const gulp = require("gulp");
const concat = require("gulp-concat");
const terser = require("gulp-terser");
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const { src, series, parallel, dest, watch } = require("gulp");
const browserSync = require("browser-sync").create();
const imagemin = require("gulp-imagemin");
const webpack = require("webpack-stream");
const sass = require("gulp-sass");
const livereload = require("gulp-livereload");
const htmlmin = require("gulp-htmlmin");
const del = require("del");

const assetsPath = "src/assets/*";
const output = "public/";
const jsPath = "src/js/**/*.*";
const cssPath = "src/css/**/*";
const wasmPath = "src/wasm/*.wasm";
const htmlPath = "src/html/*.html";
const imagePath = "src/images/*";
const jsBoxedPath = "src/js/boxedwine/**/*.js";

const jsBoxedwineIndexPath = "src/js/components/boxedwine/**/*.*";
const jsEditorIndexPath = "src/js/components/editor/**/*.**";
const jsCommonComponents = "src/js/components/common/**/*.*";
const jsUtility = "src/js/utility/*.*";

//Production
function jsTaskProd() {
  return src([jsPath, "!" + jsBoxedPath, "!node_modules"])
    .pipe(webpack(require("./webpack.prod.js")))
    .pipe(browserSync.stream())
    .pipe(dest(output));
}

function cleanTask() {
  return del(["public/**/*"]);
}

//develop
function jsTask() {
  return src([jsPath, "!" + jsBoxedPath, "!node_modules"])
    .pipe(webpack(require("./webpack.dev.js")))
    .pipe(browserSync.stream())
    .pipe(dest(output));
}

//Common
function jsBoxedTask() {
  return src(["!" + jsPath, jsBoxedPath])
    .pipe(sourcemaps.init())
    .pipe(concat("boxedwine.js"))
    .pipe(terser())
    .pipe(sourcemaps.write("."))
    .pipe(browserSync.stream())
    .pipe(dest(output));
}

function wasmTask() {
  return src(wasmPath).pipe(browserSync.stream()).pipe(dest(output));
}

function copyHtml() {
  return src(htmlPath)
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest("public"));
}

function assetsTask() {
  return src(assetsPath).pipe(gulp.dest("public"));
}

function imgTask() {
  //only using for favicon
  return src([imagePath + ".ico", "src/css/images/*"])
    .pipe(imagemin())
    .pipe(gulp.dest("public"));
}

function cssTask() {
  return src([cssPath + ".scss", cssPath + ".css"])
    .pipe(sourcemaps.init())
    .pipe(sass({ includePaths: ["./node_modules"] }).on("error", sass.logError))
    .pipe(concat("style.css"))
    .pipe(postcss([autoprefixer(), cssnano()])) //not all plugins work with postcss only the ones mentioned in their documentation
    .pipe(sourcemaps.write("."))
    .pipe(browserSync.stream())
    .pipe(dest(output));
}

function watchTask() {
  browserSync.init({
    server: {
      baseDir: "./public/",
    },
  });
  livereload.listen();
  gulp.watch(
    [cssPath, jsPath, jsBoxedPath, assetsPath, htmlPath],
    { interval: 1000 },
    parallel(
      cssTask,
      jsTask,
      wasmTask,
      assetsTask,
      copyHtml,
      jsBoxedTask,
      imgTask
    )
  );
  gulp.watch(htmlPath).on("change", browserSync.reload);
  gulp.watch(jsPath).on("change", browserSync.reload);
  gulp.watch(jsBoxedPath).on("change", browserSync.reload);
  gulp.watch(imagePath).on("change", browserSync.reload);
}

exports.default = series(
  parallel(
    cleanTask,
    jsTaskProd,
    jsBoxedTask,
    cssTask,
    wasmTask,
    assetsTask,
    copyHtml,
    imgTask
  )
);

exports.watch = series(
  parallel(
    jsTask,
    jsBoxedTask,
    cssTask,
    wasmTask,
    assetsTask,
    copyHtml,
    imgTask
  ),
  watchTask
);
