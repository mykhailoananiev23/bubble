/* jshint node:true */

"use strict";
var backOffice = "\\backOffice";
var front = "\\www";
var dstPath = ".\\dist";
var dstZipPath = dstPath + "\\dist";
var testPath = ".\\test";
var srcPath = ".\\";
var srcFrontPath = srcPath + front;
// javascriptObfuscator = require('gulp-javascript-obfuscator'),
var serverFiles = ["backOffice/**/*",
  "!backOffice/node_modules",
  "!backOffice/node_modules/**/*"];
var withServer = false;
var quick_debug_skip_minify = false;
const { series, parallel, src, dest } = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var useref = require("gulp-useref");
var gulp_if = require("gulp-if");
var gulp_size = require("gulp-size");
var gulp_zip = require("gulp-zip");
var gulp_minifyCss = require("gulp-clean-css");
var gulp_replace = require("gulp-replace");
var gulp_rename = require("gulp-rename");
var gulp_header = require("gulp-header");
var gulp_minifyHtml = require("gulp-minify-html");
var terser = require("gulp-terser-js");
var fs = require("fs");
var del = require("del");
var args = require("yargs").argv;
var exec = require("child_process").exec;
const { delay1000, waitForFiles, doOnceExist } = require("./gulphelper.js");
const { koutu_concat, koutu_use_mini, koutu_minify } = require("./gulpKoutu.js");
JSON.minify = JSON.minify || require("node-json-minify");
var sourceFiles = [
  { name: "/comLibBasic.min.js", order: 0 },
  { name: "/wcy3AppAll.min.css", order: 1 },
  { name: "/wcy3AppAll.min.js", order: 1 }
];

var cdnFileMap = [];

var config = {
  header: null,
  version: null,
  hash: null
};

var wcyApp_minify_ready = false;

function callback(cb) {
  cb();
}

async function doConfig() {
  // ver info
  config.header = "/*! ionic " + new Date().toLocaleString() + " */\n";
  config.version = require("./package.json").version;

  // container files
  config.hash = "";
  config.temp_app_js = "/temp_wcy3AppAll" + config.hash + ".js";
  config.app_js = "/wcy3AppAll" + config.hash + ".js";
  config.app_min_js = "/wcy3AppAll" + config.hash + ".min.js";
  config.app_min_js_map = "/wcy3AppAll" + config.hash + ".min.map";
  config.app_min_css = "/wcy3AppAll" + config.hash + ".min.css";
  config.adminApp_js = "/adminAppAll" + config.hash + ".js";
  config.adminApp_min_js = "/adminAppAll" + config.hash + ".min.js";
  config.adminApp_min_js_map = "/adminAppAll" + config.hash + ".min.map";
  config.adminApp_min_css = "/adminAppAll" + config.hash + ".min.css";

  config.temp_com_js = "/temp_comLibAll" + config.hash + ".js";
  config.com_js = "/comLibAll" + config.hash + ".js";
  config.com_min_js = "/comLibAll" + config.hash + ".min.js";
  config.com_min_js_map = "/comLibAll" + config.hash + ".min.map";
  config.comLibBasic_js = "/comLibBasic.js";
  config.comLibBasic_min_js = "/comLibBasic" + config.hash + ".min.js";
  config.comLibBasic_min_js_map = "/comLibBasic" + config.hash + ".min.map";
  config.koutu_js = "/koutuAll" + config.hash + ".js";
  config.koutu_min_js = "/koutuAll" + config.hash + ".min.js";
  config.koutu_min_js_map = "/koutuAll" + config.hash + ".min.map";
  config.lib_js = "/wcy3LibAll" + config.hash + ".js";

  config.lib_min_js = "/wcy3LibAll" + config.hash + ".min.js";
  config.lib_min_js_map = "/wcy3LibAll" + config.hash + ".min.map";
}

async function copy_resource_and_test_opus() {
  var imgList = [
    ["", "happy_new_year_popup_demo1.html"],
    ["", "lame.min.js"],
    ["", "U1Ec4Rouup.txt"],
    ["", "aZqpSD9Uc8.txt"],
    ["", "worker.js"],
    ["", "apple-touch*.png"],
    // ToDo: ['lib-debug', 'lame.min.js'],
    ["", "lame.min.js"],
    // ToDo: ['lib-debug', 'worker.js'],
    ["", "lib-debug\\select2.png"],
    ["", "lib-debug\\select2x2.png"],
    ["dictionary", "*"],
    ["css", "*"],
    ["fonts", "*"],
    ["features", "**\\*.*"],
    ["img", "*.*"],
    ["music", "*.*"],
    ["img\\changjing", "*.*"],
    ["img\\daoju", "*.*"],
    ["img\\edit_icon", "*.*"],
    ["img\\t-shirt", "*.*"],
    ["img\\login", "*.*"],
    ["img\\login", "*.*"],
    ["public\\images", "loading.gif"],
    ["mcImages", "p1.png"],
    ["mcImages", "yudi3.png"],
    ["mcImages", "xuehua1.png"],
    ["mcImages", "yuanbao*.png"],
    ["mcSounds", "p1.wav"],
    ["lib\\ionic\\js", "ionic.bundle.min.js"],
    ["lib", "comLibBasic.js"],
    ["lib", "webfontloader.js"],
    // ToDo: ['lib', 'jquery-3.3.1.min.js'],
    ["wcy3Social", "**\\*.*"],
    ["opus", "**\\*.*"]
  ];
  imgList.forEach(function(resource) {
    src(srcFrontPath + "\\" + resource[0] + "\\" + resource[1], { base: srcFrontPath })
      .pipe(dest(dstPath + front));
  });

  await src("www\\lib\\ionic\\fonts\\ionicons.*", { base: "www\\lib\\ionic\\fonts\\" })
    .pipe(dest(dstPath + "\\www\\fonts")) // 老版本需要
    .pipe(dest(dstPath + "\\www\\lib\\ionic\\fonts")); // cloudary 版本需要

  return Promise.resolve();
}

async function copy_gem_and_its_relatives() {
  var gemFiles = [
    ["gem", "*"],
    ["gem/red-date_files", "*"],
    ["gem/common", "*"],
    ["wcy3Ext", "*"],
    ["wcy3Log", "*"]
  ];
  gemFiles.forEach(function(resource) {
    src(srcFrontPath + "\\" + resource[0] + "\\" + resource[1], { base: srcFrontPath })
      .pipe(dest(dstPath + front + "\\"));
  });
  return Promise.resolve();
}

async function copy_startUdoido() {
  var imgList = [
    ["start-udoido.sh"],
    ["startUdoido.bat"]];
  imgList.forEach(function(resource) {
    src(srcPath + "\\" + resource, { base: srcPath })
      .pipe(dest(dstZipPath));
  });
}

async function copy_wx_setup() {
  await src("www\\MP_*.txt") // 这是微信将域名绑定到公众号所需要的文件
    .pipe(dest(dstPath + "\\www"));
  return Promise.resolve();
}

async function copy_admin_tool() {
  var fileList = [
    ["admin", "*.*"]
  ];
  fileList.forEach(function(resource) {
    src(srcFrontPath + "\\" + resource[0] + "\\" + resource[1], { base: srcFrontPath })
      .pipe(dest(dstPath + front + "\\"));
  });
  return Promise.resolve();
}

async function wcylib_concat() {
  await src("www/index.html")
    .pipe(gulp_if("*.css", gulp_rename(config.app_min_css)))
    .pipe(gulp_if(/libs\.js/, gulp_replace(/\/\/ IN_HEAVY_DEV_BEGIN[\w\W]*?\/\/ IN_HEAVY_DEV_END/g, "")))
    .pipe(gulp_if(/wcy3AppAll\.js/ && args.remove_logs, gulp_replace(/AuxLog\.log\(.*\);/gm, "")))
    .pipe(gulp_if(/wcy3AppAll\.js/, gulp_replace(/\/\/ DEBUG_ONLY_BEGIN[\w\W]*?\/\/ DEBUG_ONLY_END/g, "")))
    .pipe(gulp_if(/wcy3AppAll\.js/, gulp_replace(/\/\/ IN_HEAVY_DEV_BEGIN[\w\W]*?\/\/ IN_HEAVY_DEV_END/g, "")))
    .pipe(gulp_if(/wcy3AppAll\.js/, gulp_rename(config.temp_app_js)))
  // .pipe(gulp_if(/wcy3AppAll\.js/, gulp_header(config.header)))
    .pipe(useref())
    .pipe(gulp_if("*.html", gulp_replace(/wcy3AppAll\.js/g, config.app_min_js)))
    .pipe(gulp_if("*.html", gulp_replace(/comLibAll\.js/g, config.com_js)))
    .pipe(gulp_if("*.html", gulp_replace(/wcy3LibAll\.js/g, config.lib_js)))
    .pipe(gulp_if("*.html", gulp_replace(/wcy3AppAll\.css/g, config.app_min_css)))
  // .pipe(gulp_if('*.css', gulp_replace(/url\(\.\.\/img\//g, "url(https://show.udoido.com/img/")))
    .pipe(gulp_if("*.css", gulp_minifyCss()))
  // .pipe(gulp_if('*.html', minifyHtml()))

    .pipe(dest(dstPath + "\\www"))
    .pipe(gulp_if("index.html", gulp_rename("index_temp.html")))
    .pipe(gulp_if("wcy3AppAll.js", gulp_rename(config.temp_app_js)))
    .pipe(dest(dstPath + "\\www"));

  return Promise.resolve();
}

async function process_dev_release_flag() {
  await src(dstPath + "\\www" + config.temp_app_js)
    .pipe(gulp_replace(/\/\/ DEBUG_ONLY_BEGIN[\w\W]*?\/\/ DEBUG_ONLY_END/g, ""))
    .pipe(gulp_replace(/\/\/ IN_HEAVY_DEV_BEGIN[\w\W]*?\/\/ IN_HEAVY_DEV_END/g, ""))
    .pipe(gulp_rename(config.app_js))
    .pipe(dest(dstPath))
    .pipe(dest(dstPath + "\\www"));
  return Promise.resolve();
}

async function admin_tool_concat() {
  console.log("in admin_tool_concat...");
  await src("www/admin.html")
    .pipe(gulp_if("*.css", gulp_rename(config.adminApp_min_css)))
    .pipe(gulp_if(/adminAppAll\.js/, gulp_rename(config.adminApp_js)))
    .pipe(gulp_if(/adminAppAll\.js/, gulp_header(config.header)))
    .pipe(useref())
    .pipe(gulp_if("*.html", gulp_replace(/adminAppAll\.js/g, config.adminApp_min_js)))
  // .pipe(gulp_if('*.html', gulp_replace(/adminComLibAll\.js/g, config.admin_com_js)))
  // .pipe(gulp_if('*.html', gulp_replace(/adminLibAll\.js/g, config.admin_lib_js)))
    .pipe(gulp_if("*.html", gulp_replace(/adminAppAll\.css/g, config.adminApp_min_css)))
  // .pipe(gulp_if('*.css', gulp_replace(/url\(\.\.\/img\//g, "url(https://show.udoido.com/img/")))
    .pipe(gulp_if("*.css", gulp_minifyCss()))

    .pipe(dest(dstPath))
  // .pipe(gulp_if('admin.html', gulp_rename('admin_temp.html')))
    .pipe(dest(dstPath + "\\www"));

  return Promise.resolve();
}

async function wcyApp_minify() {
  var source = dstPath + "\\www" + config.app_js;
  await doOnceExist(source, function() {
    wcyApp_minify_ready = true;
    minifyOne(dstPath + "\\www" + config.temp_app_js,
      dstPath + "\\www" + config.app_min_js,
      dstPath + "\\www" + config.app_min_js_map);
    minifyOne(dstPath + "\\www" + config.app_js,
      dstPath + "\\www" + config.app_min_js,
      dstPath + "\\www" + config.app_min_js_map);
    console.log(source + " minified");
  });

  return Promise.resolve();
}

async function adminTool_minify() {
  await minifyOne(dstPath + "\\www" + config.adminApp_js,
    dstPath + "\\www" + config.adminApp_min_js,
    dstPath + "\\www" + config.adminApp_min_js_map);
  return Promise.resolve();
}

async function wcyCom_minify() {
  await minifyOne(srcPath + "\\www\\lib" + config.comLibBasic_js,
    dstPath + "\\www" + config.comLibBasic_min_js,
    dstPath + "\\www" + config.comLibBasic_min_js_map);
  return Promise.resolve();
}

async function minifyOne(srcFile, minFolder, mapFolder) {
  if (quick_debug_skip_minify) {
    return Promise.resolve();
  }
  console.log("old minFile: " + minFolder);
  console.log("old mapFile: " + mapFolder);

  minFolder = dstPath + "\\www\\";
  // minFolder = './temp_min';
  mapFolder = "./temp_map";

  console.log("new minFolder: " + minFolder);
  console.log("new mapFolder: " + mapFolder);
  console.log("default name format");

  await src([srcFile])
    .pipe(gulp_replace(/\/\/ IN_HEAVY_DEV_BEGIN[\w\W]*?\/\/ IN_HEAVY_DEV_END/g, ""))
    .pipe(sourcemaps.init())
    .pipe(terser({
      // outSourceMap: mapFile,
      // sourceRoot: "",
      compress: {
        warnings: false
      },
      mangle: {
        reserved: ["GenCommand",
          "MoveCommand", "MoveAnchorCommand", "MovePivotCommand",
          "RotateCommand", "ScaleCommand", "SetSizeCommand"]
      }
    }))
    .on("error", function(error) {
      if (error.plugin !== "gulp-terser-js") {
        console.log(error.message);
      }
      this.emit("end");
    })
    .pipe(gulp_rename(function(path) {
      return {
        dirname: path.dirname,
        basename: path.basename + ".min",
        extname: path.extname
      };
    }))
    .pipe(sourcemaps.write(mapFolder))
    .pipe(dest(minFolder));
  return Promise.resolve();
}

async function clean() {
  var files = ["www.zip",
    "wcy3AppAll*.js",
    "wcy3AppAll*.css",
    "adminAppAll*.js",
    "adminAppAll*.css",
    "backOffice.zip",
    "comLibBasic-*.js",
    "lib/comLibBasic*.js"
  ];

  files.forEach(function(item) {
    del.sync([
      dstZipPath + "/" + item,
      dstPath + "/www/" + item], { force: true });
  });
  return Promise.resolve();
}

async function hide_source_del_temp() {
  // 这些是中间文件，应该删除，缩小发布包的size
  var files = [
    "comLibBasic.min.js",
    "wcy3AppAll.js",
    // 'wcy3AppAll.min.js', // for debug only
    "wcy3AppAll.css",
    // 'wcy3AppAll.min.css', // for debug only
    "adminAppAll.js",
    "three.js",
    "*.xcf",
    "welcome_Old.mp3",
    "index_temp.html",
    "index-OK.html",
    "temp_wcy3AppAll.js",
    "temp_wcy3AppAll.min.js"
  ];

  files.forEach(function(item) {
    del.sync([
      dstZipPath + "/" + item,
      dstPath + "/www/" + item], { force: true });
  });
  return Promise.resolve();
}

const do_package =
    series([hide_source_del_temp], [zip_backend, zip_frontend, zip_frontend_no_mcImages], callback);

async function zip_frontend_no_mcImages() {
  /* 注意： 目录是否以“.”开始, 对应于不同的规则*/
  await src([dstPath + "/www/mcImages/*",
    dstPath + "/www/mcSounds/*"],
  { base: dstPath + "/www" })

    .pipe(gulp_size({ title: "build", gzip: true }))
    .pipe(gulp_zip("wwwArts.zip"))
    .pipe(dest(dstZipPath));

  await src([dstPath + "/www/**/*",
    dstPath + "/www/dictionary/zh.json",
    dstPath + "/www/dictionary/en.json",
    "!" + dstPath + "/www/mcImages/**/*",
    "!" + dstPath + "/www/mcImages",
    "!" + dstPath + "/www/mcSounds/**/*",
    "!" + dstPath + "/www/mcSounds"])
    .pipe(gulp_size({ title: "build", gzip: true }))
    .pipe(gulp_zip("www_no_images.zip"))
    .pipe(dest(dstZipPath));
  return Promise.resolve();
}

async function zip_frontend() {
  /* 注意： 目录是否以“.”开始, 对应于不同的规则*/
  await src([dstPath + "/www/**/*"],
    { base: dstPath + "/www" })
    .pipe(gulp_size({ title: "build", gzip: true }))
    .pipe(gulp_zip("www.zip"))
    .pipe(dest(dstZipPath));
  return Promise.resolve();
}

async function zip_backend() {
  if (withServer) {
    await src(serverFiles)
      .pipe(gulp_size({ title: "build", gzip: true }))
      .pipe(gulp_zip("backOffice.zip"))
      .pipe(dest(dstZipPath));
  }
  return Promise.resolve();
}

async function update_index_html() {
  console.log("update - index html");
  var fileList = [];
  var basicCssStr = "<style> " + fs.readFileSync(srcPath + "/www/css/styleBasic.css") +
            " </style>";
  var lazyLoadingJS = "" + fs.readFileSync(srcPath + "/www/lazyLoading.js");

  for (var i = 0; i < cdnFileMap.length; i++) {
    if (!cdnFileMap[i]) {
      console.error("why is null？ i=" + i + " of " + cdnFileMap.length);
      continue;
    }
    var item = cdnFileMap[i];
    var listId = item.order;
    if (!fileList[listId]) {
      fileList[listId] = "";
    }
    fileList[listId] = !fileList[listId] ? "" : (fileList[listId] + ",\n");
    var hostId = 1 + (i % 5);
    const url = cdnFileMap[i].dst.replace("//res.cloudinary.", "//res-" + hostId + ".cloudinary.");
    fileList[listId] = fileList[listId] + "\"" + url + "\"";
  }

  // Don't make async functions within a loop.
  await src(dstPath + "\\www\\index_temp.html")
    .pipe(gulp_rename("index.html"))
    .pipe(gulp_replace(/\/\/ DEBUG_ONLY_BEGIN[\w\W]*?\/\/ DEBUG_ONLY_END/g, "")) // remove-debug-code
    .pipe(gulp_replace(/\/\/ IN_HEAVY_DEV_BEGIN[\w\W]*?\/\/ IN_HEAVY_DEV_END/g, ""))
  // 没有lazy loading的时候， 不能删除这些常规loading
  // .pipe(gulp_replace(/TO-LAZY-LOADING-CSS-BEGIN[\w\W]*TO-LAZY-LOADING-CSS-END/g, ""))
  // .pipe(gulp_replace(/TO-MULTI-HOST-BEGIN[\w\W]*TO-MULTI-HOST-END/g, ""))
  // .pipe(gulp_replace(/TO-LAZY-LOADING-BEGIN[\w\W]*TO-LAZY-LOADING-END/g, ""))
    .pipe(gulp_replace("//LAZY-LOADING-LIST0", fileList[0]))
    .pipe(gulp_replace("//LAZY-LOADING-LIST1", fileList[1]))
  // .pipe(gulp_replace(/TO-EMBEDED-CSS-BEGIN[\w\W]*TO-EMBEDED-CSS-END/g, ""))
    .pipe(gulp_replace("<!-- EMBEDED-CSS-HERE -->", basicCssStr))
  // .pipe(gulp_replace(/TO-EMBEDED-JS-BEGIN[\w\W]*TO-EMBEDED-JS-END/g, ""))
    .pipe(gulp_replace("// EMBEDED-JS-HERE", lazyLoadingJS))
    .pipe(dest(dstPath + "\\www"));

  return Promise.resolve();
}

const pre_build = series(clean,
  admin_tool_concat,
  wcylib_concat, // koutu_use_mini,
  parallel(
    copy_support_files,
    copy_resource_and_test_opus,
    copy_gem_and_its_relatives,
    copy_admin_tool),
  callback);

const build = series(doConfig,
  ensureCatFileReady,
  process_dev_release_flag,
  // koutu_concat, koutu_minify,
  parallel(wcyApp_minify, adminTool_minify),
  wcyCom_minify,
  update_index_html,
  callback
);

async function protect(callback) {
  await src(srcPath + "/www/lib/wcy3all.js")
  // .pipe(javascriptObfuscator({
  //     compact: true,
  //     //sourceMap: true
  // }))
    .pipe(dest(dstPath));
  return Promise.resolve();
}

async function show_result(callback) {
  var who = "front End";
  if (withServer) {
    who += " and server";
  }

  console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log(who + ": packaged successfully!");
  if (!withServer) {
    console.log("to include server end, use: ");
    console.log("       gulp server");
  }
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!");
  return Promise.resolve();
}

async function makeFolders() {
  let waitFlag = false;
  const folders = [
    testPath,
    dstPath,
    dstPath + "\\www",
    dstZipPath
  ];

  folders.forEach(function(item) {
    if (!fs.existsSync(item)) {
      exec("mkdir " + item);
      waitFlag = true;
      console.log(item + " made");
    } else {
      console.log(item + " exists!");
    }
  });

  if (waitFlag) {
    setTimeout(() => {
      return Promise.resolve();
    }, 1000);
  } else {
    return Promise.resolve();
  }
  return Promise.resolve();
}

async function ensureCatFileReady(cb) {
  await waitForFiles(dstPath + "/www" + config.app_js);
  await waitForFiles(dstPath + "/www" + config.temp_app_js);
  await waitForFiles(dstPath + "/www" + "/wcy3AppAll.css");
  await waitForFiles(dstPath + "/www" + "/temp_wcy3AppAll.js");

  await waitForFiles(dstPath + "/www" + config.adminApp_js);
  await waitForFiles(dstPath + "/www" + "/adminAppAll.css");
  return Promise.resolve();
}

async function copy_support_files() {
  const files = [
    // lazy loader:
    srcPath + "\\www\\lazyLoading.js",

    // lazy loaded files
    srcPath + "\\www\\wcy3Social\\*.*",

    // workers
    srcPath + "\\www\\worker.js",
    srcPath + "\\www\\lame.min.js",

    // dictionary:
    srcPath + "\\www\\dictionary\\*.*",

    // debug toos:
    srcPath + "\\www\\wcy3\\debugger\\*.*"

    // for test only:
    //        srcPath + "\\startUdoido.bat"
  ];

  await src(files, { base: srcPath })
    .pipe(dest(dstPath));

  return Promise.resolve();
}

async function work_around() {
  console.log("ToDo: these file will be generated automatically");
  // await src(dstPath + "/index.html", { base: dstPath })
  //     .pipe(dest(dstPath + "/www"));

  await src(dstPath + "/www" + "/wcy3AppAll.css", { base: dstPath })
    .pipe(gulp_rename("wcy3AppAll.min.css"))
    .pipe(dest(dstPath + "/www"));

  return Promise.resolve();
}

async function enableServer() {
  console.log("with server!");
  withServer = true;
  return Promise.resolve();
}

async function ensureMinFileReady(cb) {
  await waitForFiles(dstPath + "/www" + config.app_min_css);
  await waitForFiles(dstPath + "/www" + config.adminApp_min_js);
  return Promise.resolve();
}

exports.default = series(makeFolders, doConfig, pre_build, callback);
exports.server = series(makeFolders, doConfig, work_around, build);
exports.dopack = series(makeFolders, doConfig, enableServer, ensureMinFileReady, delay1000, do_package);
exports.test = series(makeFolders, doConfig, copy_startUdoido);
