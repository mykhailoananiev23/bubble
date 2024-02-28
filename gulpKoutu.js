'use strict';

var useref = require('gulp-useref'),
  gulp_if = require('gulp-if'),
  gulp_size = require('gulp-size'),
  gulp_zip = require('gulp-zip'),
  gulp_minifyCss = require('gulp-clean-css'),
  gulp_replace = require('gulp-replace'),
  gulp_rename = require('gulp-rename'),
  gulp_header = require('gulp-header');

var glsl = require('gulp-glsl');
var wait = require('gulp-wait');

async function koutu_concat() {
  await src('www/features/koutu/koutu.html')
    .pipe(gulp_if(/koutuAll\.js/, gulp_rename(config.koutu_js)))
    .pipe(useref())
    .pipe(gulp_if('*.html', gulp_replace(/koutuAll\.js/g, config.koutu_min_js)))

    .pipe(dest(dstPath + '\\koutu'))
    .pipe(gulp_if('index.html', gulp_rename('index_temp.html')))
    .pipe(dest(dstPath + '\\www\\koutu'));
  return Promise.resolve();
}

async function koutu_use_mini() {
  await src(dstPath + '\\www' + config.app_js)
    .pipe(gulp_replace(/\/\/KOUTU_LIB_BEGIN[\w\W]*\/\/KOUTU_LIB_END/g, '"' + config.koutu_min_js + '"'))
    .pipe(dest(dstPath + '\\www')); // 同名
  return Promise.resolve();
}

async function koutu_minify() {
  await minifyOne(dstPath + '\\koutu\\' + config.koutu_js,
    dstPath + '\\www\\' + config.koutu_min_js,
    dstPath + '\\www\\' + config.koutu_min_js_map);
  return Promise.resolve();
}

async function glsl_minify(callback) {
  var shaderList = [
    srcPath + "\\www\\shaders\\*.glsl"
  ];

  console.log(JSON.stringify(shaderList));
  await src(shaderList)
    .pipe(glsl({ format: "string" }))
    .pipe(dest(dstPath + '/dist'));

  return Promise.resolve();
}

exports.koutu_concat = koutu_concat;
exports.koutu_use_mini = koutu_use_mini;
exports.koutu_minify = koutu_minify;