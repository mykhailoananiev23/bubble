var debug = require("debug")("iCardSvr2:vHostServer");
var http = require("http");
var https = require("https");
var cors = require("cors");
var vhost = require("vhost");
var compression = require("compression");
var fs = require("fs");
var configSvr = require("./../common/configSvr");
var logger = require("./../common/logger");
var express = require("express");
var gracefulExit = require("express-graceful-exit");
var onlineUsers = require("../common/onlineUsers");
var onlineWxUsers = require("../common/onlineWxUsers");

var vHostServer, vSecuredServer;
var config = { port: 80 };
var app = express();
var shuttingDown = false;
init();

function init() {
  var cert_Folder = "/data/wwwz";
  var optionForSecuredServer = {
    // 证书信息
    ca: fs.readFileSync(cert_Folder + "/www_udoido_com.ca-bundle"),
    key: fs.readFileSync(cert_Folder + "/www_udoido_com.key"),
    cert: fs.readFileSync(cert_Folder + "/www_udoido_com.crt")
  };
  app.use(cors());
  app.use(compression());
  vHostServer = http.createServer(app);
  vSecuredServer = https.createServer(optionForSecuredServer, app);
  vHostServer.maxConnections = 6000; // 6 * 1000; 最多同时1000浏览器同时访问， 每个浏览器6个并发请求
  vSecuredServer.maxConnections = 6000; // 6 * 1000; 最多同时1000浏览器同时访问， 每个浏览器6个并发请求
  app.use(gracefulExit.middleware(app)); //! !! gracefulExit 必须是app的第一个配置
  console.info("process.env.PORT = " + process.env.PORT);
  console.info("process.env.NODE_ENV = " + process.env.NODE_ENV);
  config.port = normalizePort(process.env.PORT || config.port);
  app.set("port", config.port);
  process.on("SIGINT", function() {
    console.log("received SIGINT...");
    onShotdown();
  });

  process.on("SIGTERM", function() {
    console.log("received Terminate...");
    onShotdown();
  });

  app.use(function(req, res, next) {
    if (shuttingDown) {
      return;
    }
    next();
  });

  //    app.use(vhost('www.kidsafer.org', require('./kidSaferAppServer').app));
  // app.use(vhost('www.kidsafer.org', require('./vHostTest2AppServer').app));
  app.use(vhost("*.udoido.com", require("./eCardAppServer").app));
  // app.use(vhost('bone.udoido.cn', require('./eCardAppServer').app));
  app.use(vhost("bone.udoido.cn", function(req, res) {
    // res.status(301).redirect("https://" + configSvr.host);
    res.redirect("https://" + configSvr.host);
  }));
  app.use(vhost("udoido.com", function(req, res) {
    res.redirect("https://" + configSvr.host);
  }));
  // app.use(vhost('any1.udoido11.cn', require('./eCardAppServer').app));
  // app.use(vhost('www.udoido.com', require('./eCardAppServer').app));
  // app.use(vhost('wish.udoido.cn', require('./wishAppServer').app));

  onlineWxUsers.restore();
  onlineUsers.restore();

  /**
     * Listen on provided port, on all network interfaces.
     */
  vHostServer.listen(app.get("port"));
  vHostServer.on("error", onError);
  vHostServer.on("listening", onListening);
  vSecuredServer.listen(443); // 9443 简单？ 用于调试？
  vSecuredServer.on("error", onError);
  vSecuredServer.on("listening", onListeningSecuredServer);
  console.log("started, listen on: " + config.port);
}

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof config.port === "string"
    ? "Pipe " + config.port
    : "Port " + config.port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      onShotdown();
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      onShotdown();
      break;
    default:
      onShotdown();
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = vHostServer.address();
  var bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;
  debug("Listening on " + bind);
}

function onListeningSecuredServer() {
  var addr = vSecuredServer.address();
  var bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;
  debug("Listening Secured Server on " + bind);
}

function onShotdown() {
  if (shuttingDown) {
    return;
  }

  console.log("prepare to shut dwon server ...");
  shuttingDown = true;
  if (onlineUsers || onlineUsers) {
    if (onlineUsers) {
      onlineUsers.save(onSaved);
    }

    if (onlineWxUsers) {
      onlineWxUsers.save(onSaved);
    }
  } else {
    onSaved();
  }

  function onSaved() {
    if ((onlineUsers && !onlineUsers.hasStopped()) ||
      (onlineWxUsers && !onlineWxUsers.hasStopped())) {
      return;
    }

    console.log("shutting dwon server gracefully...!");
    gracefulExit.gracefulExitHandler(app, vSecuredServer, {
      // socketio: app.settings.socketio,
      exitProcess: false,
      suicideTimeout: 130 * 1000, // ms
      callback: onShutdownSuccessfully
    });

    gracefulExit.gracefulExitHandler(app, vHostServer, {
      // socketio: app.settings.socketio,
      exitProcess: false,
      suicideTimeout: 130 * 1000, // ms
      callback: onShutdownSuccessfully
    });
  }
}

var shutdownCounter = 0;
function onShutdownSuccessfully(statusCode) {
  shutdownCounter++;
  console.info("Shutdown successfully!" + statusCode);
  logger.shutdown();
  if (shutdownCounter >= 2) { // 确认http和https都关闭了
    process.exit(statusCode);
  }
}
