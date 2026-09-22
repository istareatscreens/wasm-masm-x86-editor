const gulp = require("gulp");
const concat = require("gulp-concat");
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const { src, series, parallel, dest } = require("gulp");
const browserSync = require("browser-sync").create();
const webpack = require("webpack-stream");
const sassCompiler = require("sass");
const sass = require("gulp-sass")(sassCompiler);
const htmlmin = require("gulp-htmlmin");
const sitemap = require('gulp-sitemap');
const file = require('gulp-file');
const fsp = require("fs/promises");
const { Transform } = require("stream");
const { optimize: svgoOptimize } = require("svgo");
const { chunkGuest } = require("./scripts/chunk-guest.cjs");

// gulp 5 decodes every src() stream as UTF-8 (and strips BOMs) unless told not
// to, which silently corrupts binaries. Every task that copies non-text assets
// (wasm, guest zips, fonts, ico/icns/png) must pass BINARY.
const BINARY = { encoding: false };

// Empty an output directory but keep it (same effect `del("dir/**/*")` had).
function cleanDir(dir) {
  return fsp.rm(dir, { recursive: true, force: true }).then(() => fsp.mkdir(dir, { recursive: true }));
}

// Minify .svg files in the stream with svgo (pure JS — replaces gulp-imagemin,
// whose gifsicle/mozjpeg/optipng download platform binaries at install time and
// never touched this input anyway). Options mirror the previous imagemin-svgo
// config: preset-default keeps removeViewBox on; cleanupIds stays off.
// Non-SVG files (favicon.ico) pass through untouched.
function svgoTransform() {
  return new Transform({
    objectMode: true,
    transform(vinyl, enc, cb) {
      if (vinyl.isBuffer() && /\.svg$/i.test(vinyl.path)) {
        try {
          const result = svgoOptimize(vinyl.contents.toString(), {
            path: vinyl.path,
            plugins: [{ name: "preset-default", params: { overrides: { cleanupIds: false } } }],
          });
          vinyl.contents = Buffer.from(result.data);
        } catch (err) {
          return cb(err);
        }
      }
      cb(null, vinyl);
    },
  });
}

const siteUrl = 'https://masm.isas.dev';

const output = "public/";
const jsPath = "src/js/**/*.*";
const cssPath = "src/css/**/*";
const wasmPath = "src/wasm/*.wasm";
const htmlPath = "src/html/";
const imagePath = "src/images/*";
const jsBoxedPath = "src/js/boxedwine/**/*.js";

const electronOutput = "build/";
const electronJS = "src/electron/*.js";

// BW_BUILD_ID: identity of the deployed emulator stack, injected into
// boxedwine.html (placeholder "__BW_BUILD_ID__"). It keys the instant-startup
// snapshot, the boot-asset cache (Cache API) and the per-build runtime-failure
// record, so a new deploy can never restore an old snapshot into a new wasm,
// serve a stale glue/wasm pair from cache, or stay pinned to a stale failure.
// Hash of: both wasm binaries, the shell + snapshot scripts, and the guest /
// toolchain zip names+sizes (content hash of 112MB every build is not worth it —
// the zip filename changes whenever the guest content is regenerated).
function computeBwBuildId() {
  const crypto = require("crypto");
  const fs = require("fs");
  const h = crypto.createHash("sha256");
  const files = [
    "src/wasm/boxedwine.wasm", "src/wasm/boxedwine-mt.wasm",
    "src/js/boxedwine/boxedwine-shell.js", "src/js/boxedwine/bw-snapshot.js",
    "src/html/boxedwine.html", // launch config (resolution, program, drives) lives here
  ];
  for (const f of files) {
    try {
      h.update(f);
      // text inputs are hashed with LF endings so a CRLF checkout (Windows,
      // core.autocrlf) and an LF checkout (Linux CI) yield the same id
      const raw = fs.readFileSync(f);
      h.update(/\.wasm$/.test(f) ? raw : raw.toString("utf8").replace(/\r\n/g, "\n"));
    } catch (e) { h.update(f + ":missing"); }
  }
  try {
    for (const z of fs.readdirSync("src/bw-assets").filter((n) => n.endsWith(".zip")).sort()) {
      // size + the zip's tail (central directory: every entry's CRC), so an
      // in-place edit of one guest file (same size) still changes the id
      const p = "src/bw-assets/" + z, size = fs.statSync(p).size, tail = Math.min(size, 2 * 1024 * 1024);
      const fd = fs.openSync(p, "r"), buf = Buffer.alloc(tail);
      fs.readSync(fd, buf, 0, tail, size - tail); fs.closeSync(fd);
      h.update(z + ":" + size); h.update(buf);
    }
  } catch (e) { throw new Error("Cannot read src/bw-assets for BW_BUILD_ID", { cause: e }); }
  return h.digest("hex").slice(0, 16);
}
function injectBwBuildId() {
  const { Transform } = require("stream");
  // recomputed per task run so `gulp watch` picks up a redeployed wasm/guest
  const bwBuildId = computeBwBuildId();
  console.log("BW_BUILD_ID " + bwBuildId);
  return new Transform({
    objectMode: true,
    transform(vinyl, enc, cb) {
      if (vinyl.isBuffer() && /boxedwine\.html$/.test(vinyl.path)) {
        vinyl.contents = Buffer.from(vinyl.contents.toString().replace(/__BW_BUILD_ID__/g, bwBuildId));
      }
      cb(null, vinyl);
    },
  });
}

// The three webpack tasks start from webpack-stream directly: the entries live in
// webpack.common.js, so a leading src() glob was only ever a trigger — and under
// gulp 5 (streamx) piping src() into webpack-stream (classic `through`) fails with
// "StreamError: Writable stream closed" on every run after the first (gulp watch).
//Electron
function jsTaskMainElectron() {
  return src([electronJS]).pipe(dest(electronOutput));
}

// The desktop app icon is src/images/masm-icon-512w.{ico,png}, copied as build/icon.ico
// and build/icon.png: what package.json's electron-builder "build" section names
// (buildResources = build/; the mac .icns is generated from the 512 px PNG) and what
// electron-main.js gives the BrowserWindow.
function iconTaskElectron() {
  const { Transform } = require("stream");
  const asIcon = new Transform({
    objectMode: true,
    transform(file, _enc, cb) { file.basename = "icon" + file.extname; cb(null, file); },
  });
  return src(["src/images/masm-icon-512w.ico", "src/images/masm-icon-512w.png"], BINARY)
    .pipe(asIcon)
    .pipe(gulp.dest(electronOutput));
}

function jsTaskElectron() {
  return webpack(require("./webpack.prod.js"))
    .pipe(dest(electronOutput));
}

function cleanTaskElectron() {
  return cleanDir(electronOutput);
}

function jsBoxedTaskElectron() {
  // Copy new boxedwine files separately (do not concat)
  // boxedwine.js / boxedwine-mt.js are the emulator glue built from the vendor tree
  // in Boxedwine/ (see README "Building Boxedwine"); jszip.min.js is still needed
  // for Boxedwine.jsx zip functionality
  return src([
    "src/js/boxedwine/boxedwine.js",
    "src/js/boxedwine/boxedwine-shell.js",
    "src/js/boxedwine/bw-snapshot.js",
    "src/js/boxedwine/bw-cache.js",
    "src/js/boxedwine/boxedwine-mt.js",
    "src/js/boxedwine/jszip.min.js"
  ])
    .pipe(dest(electronOutput));
}

function wasmTaskElectron() {
  return src(wasmPath, BINARY).pipe(browserSync.stream()).pipe(dest(electronOutput));
}

function copyHtmlElectron() {
  return src([htmlPath + "boxedwine.html", htmlPath + "electron/index.html"])
    .pipe(injectBwBuildId())
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(electronOutput));
}

// Electron gets the same pre-booted guest + toolchain as the web build
// (boxedwine.html points the shell at latest26/<guest>.zip and assembler-dp0.zip).
function assetsTaskElectron() {
  return src("src/bw-assets/*.zip", BINARY).pipe(gulp.dest(electronOutput + "latest26/"));
}

function imgTaskElectron() {
  // favicon (copied verbatim) + the SVG icons used by the SCSS (svgo-minified)
  return src([imagePath + ".ico", "src/css/images/*"], BINARY)
    .pipe(svgoTransform())
    .on('error', function(err) {
      console.error('Error in imgTaskElectron:', err);
      this.emit('end');
    })
    .pipe(gulp.dest(electronOutput));
}

function cssTaskElectron() {
  return src([cssPath + ".scss", cssPath + ".css"])
    .pipe(sass({ loadPaths: ["./node_modules"] }).on("error", sass.logError))
    .pipe(concat("style.css"))
    .pipe(postcss([autoprefixer(), cssnano()])) //not all plugins work with postcss only the ones mentioned in their documentation
    .pipe(dest(electronOutput));
}

function fontTaskElectron() {
  return src("src/fonts/*", BINARY)
    .pipe(browserSync.stream())
    .pipe(dest(electronOutput));
}

//WEB
//Production
function jsTaskProd() {
  return webpack(require("./webpack.prod.js"))
    .pipe(browserSync.stream())
    .pipe(dest(output));
}

function cleanTask() {
  return cleanDir(output);
}

function generateSitemapTask() {
  return src(['public/**/*.html', '!public/boxedwine.html', '!public/404.html'], { read: false })
    .pipe(sitemap({
      siteUrl: siteUrl
    }))
    .pipe(gulp.dest(output));
}

function generateRobotsTask() {
  const robotsContent = `
User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
`;
  return file('robots.txt', robotsContent.trim(), { src: true })
    .pipe(gulp.dest(output));
}

function copyHeadersTask() {
  return src("_headers").pipe(dest(output));
}

// Runtime URLs and the manifest contract are unchanged; only this guest is split.
function guestAssetsTask() {
  return chunkGuest();
}


//develop
function jsTask() {
  return webpack(require("./webpack.dev.js"))
    .on('error', function(err) {
      console.error('Error in jsTask:', err);
      this.emit('end');
    })
    .pipe(browserSync.stream())
    .pipe(dest(output));
}

//Common
function fontTask() {
  return src("src/fonts/*", BINARY).pipe(browserSync.stream()).pipe(dest(output));
}

function jsBoxedTask() {
  // Copy new boxedwine files separately (do not concat)
  // boxedwine.js / boxedwine-mt.js are the emulator glue built from the vendor tree
  // in Boxedwine/ (see README "Building Boxedwine"); jszip.min.js is still needed
  // for Boxedwine.jsx zip functionality
  // bw-chunk-sw.js is the web-only service worker that reassembles the chunked
  // guest image (see guestAssetsTask); it must live at the site root.
  return src([
    "src/js/boxedwine/boxedwine.js",
    "src/js/boxedwine/boxedwine-shell.js",
    "src/js/boxedwine/bw-snapshot.js",
    "src/js/boxedwine/bw-cache.js",
    "src/js/boxedwine/bw-chunk-sw.js",
    "src/js/boxedwine/boxedwine-mt.js",
    "src/js/boxedwine/jszip.min.js"
  ])
    .pipe(browserSync.stream())
    .pipe(dest(output));
}

function wasmTask() {
  return src(wasmPath, BINARY).pipe(browserSync.stream()).pipe(dest(output));
}

function copyHtml() {
  return src([htmlPath + "boxedwine.html", htmlPath + "web/index.html", htmlPath + "web/404.html"])
    .pipe(injectBwBuildId())
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest("public"));
}


function copyGuideHtmlTask() {
  return src(htmlPath + "web/guide/**/*.html", { base: htmlPath + "web" })
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(dest(output));
}

function copyGuideIconsTask() {
  // Reuse the application's toolbar icons in the static user manual.
  return src([
    "src/images/{buildFile,runBinary,cmdCancel,cmdReset,cacheReset,moon,themeMenu,zen,editor,cmd,filedrawer,fullscreen,about,newFile,uploadFile,saveFile,deleteFile,files}.png",
    "src/images/vim.svg",
  ], BINARY)
    .pipe(svgoTransform())
    .pipe(dest(output + "guide/icons/"));
}

const copyGuideTask = parallel(copyGuideHtmlTask, copyGuideIconsTask);

function imgTask() {
  // favicon (copied verbatim) + the SVG icons used by the SCSS (svgo-minified)
  return src([imagePath + ".ico", "src/css/images/*", "src/images/masm-icon-512w.png"], BINARY)
    .pipe(svgoTransform())
    .on('error', function(err) {
      console.error('Error in imgTask:', err);
      this.emit('end');
    })
    .pipe(gulp.dest("public"));
}

function cssTask() {
  return src([cssPath + ".scss", cssPath + ".css"])
    .pipe(sourcemaps.init())
    .pipe(sass({ loadPaths: ["node_modules", "src/css"] }).on("error", sass.logError))
    .pipe(concat("style.css"))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write("."))
    .pipe(browserSync.stream())
    .pipe(dest(output));
}

function watchTask() {
  browserSync.init({
    server: {
      baseDir: "./public/",
      // Cross-origin isolation so the multi-threaded build (SharedArrayBuffer)
      // can be selected with ?bw=mt. The single-threaded default (instant startup)
      // works with or without these headers; all app subresources are same-origin
      // so COEP:require-corp does not block them.
      middleware: [
        function (req, res, next) {
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          next();
        },
      ],
    },
  });
  gulp.watch(
    [cssPath, jsPath, jsBoxedPath, htmlPath + "**/*.html"],
    { interval: 1000 },
    parallel(
      cssTask,
      jsTask,
      wasmTask,
      series(parallel(copyHtml, copyGuideTask), generateSitemapTask),
      jsBoxedTask,
      imgTask,
    )
  );
  gulp.watch("_headers", copyHeadersTask);
  gulp.watch("src/bw-assets/*.zip", series(guestAssetsTask, copyHtml));
  gulp.watch(htmlPath + "**/*.html").on("change", browserSync.reload);
  gulp.watch(jsPath).on("change", browserSync.reload);
  gulp.watch(jsBoxedPath).on("change", browserSync.reload);
  gulp.watch(imagePath).on("change", browserSync.reload);
}

//BUILD Electron
exports.electron = series(
  // clean FIRST (not inside the parallel) so it cannot race the copy tasks.
  cleanTaskElectron,
  parallel(
    iconTaskElectron,
    jsTaskMainElectron,
    jsTaskElectron,
    jsBoxedTaskElectron,
    cssTaskElectron,
    wasmTaskElectron,
    assetsTaskElectron,
    copyHtmlElectron,
    imgTaskElectron,
    fontTaskElectron
  )
);
//BUILD Web Production
exports.default = series(
  // clean FIRST so it never races the asset/html tasks (a parallel clean would
  // delete files other tasks are writing, and made the sitemap task lstat a
  // half-deleted html file and abort the whole build).
  cleanTask,
  parallel(
    jsTaskProd,
    jsBoxedTask,
    cssTask,
    wasmTask,
    copyHtml,
    copyGuideTask,
    imgTask,
    fontTask,
    guestAssetsTask
  ),
  // sitemap/robots run AFTER copyHtml has populated public/ with the html.
  parallel(generateSitemapTask, generateRobotsTask, copyHeadersTask)
);

//Develop Web
exports.watch = series(
  parallel(
    jsTask,
    jsBoxedTask,
    cssTask,
    wasmTask,
    copyHtml,
    copyGuideTask,
    imgTask,
    fontTask,
    guestAssetsTask,
    generateRobotsTask,
    copyHeadersTask,
  ),
  generateSitemapTask,
  watchTask
);
