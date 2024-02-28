/**
 * Created by Andrewz on 8/4/2016.
 */
var appConfig = {
  name: "eCard",
  useVHost: true,
  wwwRoot: "./../../www",
  dbList: [ // 他们在dbMain.js中使用， 所以要以dbMain.js的目录为相对路径
    { name: "Show", schema: "../db/show/showSchema.js", ctrl: "../db/show/showController.js" },
    { name: "Share", schema: "../db/share/shareSchema.js", ctrl: "../db/share/shareController.js" },
    { name: "User", schema: "../db/user/userSchema.js", ctrl: "../db/user/userController.js" },
    { name: "Opus", schema: "../db/opus/opusSchema.js", ctrl: "../db/opus/opusController.js" },
    { name: "Topic", schema: "../db/topic/topicSchema.js", ctrl: "../db/topic/topicController.js" },
    { name: "PictureMat", schema: "../db/material/pictureMatSchema.js", ctrl: "../db/material/pictureMatController.js" },
    { name: "AudioMat", schema: "../db/material/audioMatSchema.js", ctrl: "../db/material/audioMatController.js" }
  ],
  routesMap: [
    { url: "auth", filePath: "./../routes/auth" },
    { url: "index55", filePath: "./../routes/index33" },
    // {url: 'users', filePath: './../routes/users'},
    { url: "getCSignature", filePath: "./../routes/getCSignature" },
    { url: "getWSignature", filePath: "./../routes/getWSignature" },
    { url: "headlines", filePath: "./../routes/headlines" },
    { url: "onWxmpLogin", filePath: "./../routes/onWxmpLogin" },
    { url: "isWx", filePath: "./../routes/isWx" },
    { url: "wechat", filePath: "./../routes/isWx" }, // ???
    { url: "wcy", filePath: "./../routes/wcy" },
    { url: "topic", filePath: "./../routes/topic" },
    { url: "wcyList", filePath: "./../routes/wcyList" },
    { url: "user", filePath: "./../routes/user" },
    { url: "material", filePath: "./../routes/material" },
    { url: "payment", filePath: "./../routes/payment" }
  ]
};

exports.dbList = appConfig.dbList;
exports.name = appConfig.name;
exports.routesMap = appConfig.routesMap;
exports.useVHost = appConfig.useVHost;
exports.wwwRoot = appConfig.wwwRoot;

