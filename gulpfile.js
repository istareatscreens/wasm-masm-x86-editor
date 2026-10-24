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
const { chunkGuest, guestChunkVersions, GUEST_CHUNKS_PLACEHOLDER } = require("./scripts/chunk-guest.cjs");

// gulp 5 decodes src() streams as UTF-8 unless told not to: binary assets need BINARY.
const BINARY = { encoding: false };

function cleanDir(dir) {
  return fsp.rm(dir, { recursive: true, force: true }).then(() => fsp.mkdir(dir, { recursive: true }));
}

// Minify .svg files with svgo; other files pass through untouched.
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

// BW_BUILD_ID: hash of the emulator stack, injected into boxedwine.html. It keys the
// snapshot, the asset cache, the runtime-failure record and the glue/wasm URLs.
function computeBwBuildId() {
  const crypto = require("crypto");
  const fs = require("fs");
  const h = crypto.createHash("sha256");
  const files = [
    "src/wasm/boxedwine.wasm", "src/wasm/boxedwine-mt.wasm",
    "src/js/boxedwine/boxedwine.js", "src/js/boxedwine/boxedwine-mt.js",
    "src/js/boxedwine/boxedwine-shell.js", "src/js/boxedwine/bw-snapshot.js",
    "src/html/boxedwine.html", // launch config (resolution, program, drives) lives here
  ];
  for (const f of files) {
    try {
      h.update(f);
      // LF-normalised so CRLF and LF checkouts give the same id
      const raw = fs.readFileSync(f);
      h.update(/\.wasm$/.test(f) ? raw : raw.toString("utf8").replace(/\r\n/g, "\n"));
    } catch (e) { h.update(f + ":missing"); }
  }
  try {
    for (const z of fs.readdirSync("src/bw-assets").filter((n) => n.endsWith(".zip")).sort()) {
      // size + the central directory (every entry's CRC)
      const p = "src/bw-assets/" + z, size = fs.statSync(p).size, tail = Math.min(size, 2 * 1024 * 1024);
      const fd = fs.openSync(p, "r"), buf = Buffer.alloc(tail);
      fs.readSync(fd, buf, 0, tail, size - tail); fs.closeSync(fd);
      h.update(z + ":" + size); h.update(buf);
    }
  } catch (e) { throw new Error("Cannot read src/bw-assets for BW_BUILD_ID", { cause: e }); }
  return h.digest("hex").slice(0, 16);
}
function injectBwBuildId() {
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
// BW_GUEST_CHUNKS: {"<guest zip>": "<chunks-manifest version>"}; {} for Electron (whole zips).
function injectGuestChunks({ electron = false } = {}) {
  return new Transform({
    objectMode: true,
    transform(vinyl, enc, cb) {
      if (!vinyl.isBuffer() || !/boxedwine\.html$/.test(vinyl.path)) return cb(null, vinyl);
      (electron ? Promise.resolve({}) : guestChunkVersions()).then((chunks) => {
        const text = vinyl.contents.toString();
        const found = text.match(GUEST_CHUNKS_PLACEHOLDER);
        if (!found || found.length !== 1)
          throw new Error("boxedwine.html must contain /*__BW_GUEST_CHUNKS__*/null (whitespace between them is allowed) exactly once, found " + (found ? found.length : 0));
        console.log("BW_GUEST_CHUNKS " + JSON.stringify(chunks));
        vinyl.contents = Buffer.from(text.replace(GUEST_CHUNKS_PLACEHOLDER, () => JSON.stringify(chunks)));
        cb(null, vinyl);
      }).catch((e) => cb(e));
    },
  });
}

// The webpack tasks start from webpack-stream directly: piping src() into it fails
// under gulp 5 on every watch run after the first.
//Electron
function jsTaskMainElectron() {
  return src([electronJS]).pipe(dest(electronOutput));
}

// build/icon.{ico,png}: the electron-builder icons and the BrowserWindow icon.
function iconTaskElectron() {
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
    .pipe(injectGuestChunks({ electron: true }))
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(electronOutput));
}

function assetsTaskElectron() {
  return src("src/bw-assets/*.zip", BINARY).pipe(gulp.dest(electronOutput + "latest26/"));
}

function imgTaskElectron() {
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
  // bw-chunk-sw.js (web only) must be served from the site root
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
    .pipe(injectGuestChunks())
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
      // cross-origin isolation for the multi-threaded build (?bw=mt)
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
  // clean FIRST so it cannot race the copy tasks
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
