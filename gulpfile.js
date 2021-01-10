const gulp = require('gulp');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const sourcemaps = require('gulp-sourcemaps')
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');
const { src, series, parallel, dest, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const imagemin = require('gulp-imagemin');
const webpack = require('webpack-stream');
const sass = require("gulp-sass");
const livereload = require('gulp-livereload');

const assetsPath = 'src/assets/*';
const output = 'public/';
const jsPath = 'src/js/**/*.j*';
const cssPath = 'src/css/**/*';
const wasmPath = 'src/wasm/*.wasm';
const htmlPath = 'src/html/*.html';
const imagePath = 'src/images/*'
const jsBoxedPath = 'src/js/boxedwine/**/*.js'


function jsBoxedTask() {
    return src(['!' + jsPath, jsBoxedPath])
        .pipe(sourcemaps.init())
        .pipe(terser())
        .pipe(sourcemaps.write('.'))
        .pipe(browserSync.stream())
        .pipe(dest(output));
}

function jsTask() {
    return src([jsPath, '!' + jsBoxedPath, '!node_modules'])
        .pipe(sourcemaps.init(),
        )
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(concat('index.js'))
        /*
        .pipe(rollup({ plugins: [babel({
            presets: ["react", 'env',
  {
    "useBuiltIns": "entry"
  }],
            "plugins": ["@babel/plugin-transform-runtime"],
        }), resolve(), commonjs(), nodePolyfills({preferBuiltins: false})] }, 'umd'))
        */
        /*.pipe(babel({
            presets: ['@babel/env'],
            "plugins": ["@babel/plugin-transform-runtime"],
        }))*/
        //.pipe(terser())
        .pipe(sourcemaps.write('.'))
        .pipe(browserSync.stream())
        .pipe(dest(output));
}

function wasmTask() {
    return src(wasmPath)
        .pipe(browserSync.stream())
        .pipe(dest(output));
}

function wasmJSTask() {
    return src(wasmJSPath)
        .pipe(terser())
        .pipe(sourcemaps.write('.'))
        .pipe(browserSync.stream())
        .pipe(dest(output));
}

function copyHtml() {
    return src(htmlPath).pipe(gulp.dest('public'));
}

function assetsTask(){
    return src(assetsPath).pipe(gulp.dest('public'));
}

function imgTask() {
    return src(imagePath).pipe(imagemin()).pipe(gulp.dest('public'));
}

function cssTask() {
    return src(cssPath)
        .pipe(sourcemaps.init())
        .pipe(sass({includePaths: ['./node_modules']}).on('error', sass.logError))
        .pipe(concat('style.css'))
        .pipe(postcss([autoprefixer(), cssnano()])) //not all plugins work with postcss only the ones mentioned in their documentation
        .pipe(sourcemaps.write('.'))
        .pipe(browserSync.stream())
        .pipe(dest(output));
}

function watchTask() {
    browserSync.init({
        server: {
            baseDir: './public/'
        }
    });
    livereload.listen();
    gulp.watch([cssPath, jsPath, jsBoxedPath,  assetsPath, htmlPath], { interval: 1000 }, parallel(cssTask, jsTask, wasmTask, assetsTask, copyHtml, jsBoxedTask, imgTask));
    gulp.watch(htmlPath).on('change', browserSync.reload);
    gulp.watch(jsPath).on('change', browserSync.reload);
    gulp.watch(jsBoxedPath).on('change', browserSync.reload);
}

exports.cssTask = cssTask;
exports.jsTask = jsTask;

exports.default = series(
    parallel(jsTask, cssTask, wasmTask, assetsTask, copyHtml, imgTask, jsBoxedTask),
);

exports.watch = series(
    parallel(jsTask, cssTask, wasmTask, assetsTask, copyHtml, imgTask, jsBoxedTask),
    watchTask
);