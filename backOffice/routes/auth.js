const { resourceLimits } = require("worker_threads");

var express = require("express");
var router = express.Router();
var request = require("request");
var jwt = require("jwt-simple");
var jwt_full = require("jsonwebtoken");
var nodemailer = require("nodemailer");
var moment = require("moment");
var mongoose = require("mongoose");
var User = mongoose.model("User");
var Const = require("../base/const");
var utils = require("../common/utils"); // 后缀.js可以省略，Node会自动查找，
var status = require("../common/status");
var authHelper = require("./authHelper");
var config = authHelper.config;
var fs = require("fs");
var qs = require("qs");
var onlineUsers = require("../common/onlineUsers");
var onlineWxUsers = require("../common/onlineWxUsers");
var userController = require("../db/user/userController");

var composeErrorPkg = userController.composeErrorPkg;
var composeUserPkg = userController.composeUserPkg;

router.post("/login", function(req, res) {
  var email = req.body.email || ""; // email就是账号alias，也可以是电话号码，QQ, 微信，FB，等
  var displayName = req.body.nickName || "";
  var wxCode;
  var user;
  var authInfo = { authorizer: req.body.from || "" };
  if (!email) {
    return responseError500(res, { message: "email is empty！" });
  }

  authInfo.isFromWx = (!!authInfo.authorizer && authInfo.authorizer === Const.AUTH.WX);
  if (authInfo.isFromWx) {
    wxCode = email;
    authInfo.wxCode = wxCode;
    user = onlineWxUsers.get(wxCode);
    if (!user) {
      wxCode2OpenId(wxCode, displayName, function(openId, wxNickName) {
        displayName = wxNickName; // 前台来的nickName，其实没有用途，而且易被hack
        user = onlineWxUsers.get(openId);
        if (!user) {
          authInfo.wx = openId;
          userController.getByWxOpenId(openId, onFindUser);
        } else {
          updateDisplayName(user, wxCode);
          onlineWxUsers.add(user, wxCode);
          resUserToken2(req, res, user);
        }
      });
    } else {
      updateDisplayName(user, wxCode);
      return resUserToken2(req, res, user, authInfo);
    }
    return;
  }

  login(req, res, email);

  function login(req, res, userId) {
    User.findOne({ email: userId }, "+password", onFindUser);
  }

  function onFindUser(err, user) {
    if (err) {
      var pkg = composeErrorPkg(err, Const.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT);
      return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, pkg);
    }

    if (!user) {
      if (authInfo && (authInfo.isFromWx)) {
        return createWxUser(req, res, authInfo, displayName);
      }
      return failedOrOldPswUser(req, res);
    }

    status.logUser(user, req, res);
    if (!req.body.password) {
      return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, "Invalid email and/or password");
    }

    if (authInfo && (authInfo.isFromWx)) {
      if (user._doc.displayName !== displayName) {
        user._doc.displayName = ""; // 必须清空旧的，才会用新的
        updateUser(user, { wx: authInfo.wx, displayName: displayName }, Const.AUTH.WX);
      }

      resUserToken2(req, res, user, authInfo);
    } else {
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (err) {
          return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
        }

        if (!isMatch) {
          return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, "Invalid email and/or password");
        }
        // onlineUsers.add(user, user._id);
        resUserToken2(req, res, user);
      });
    }
  }
});

function failedOrOldPswUser(req, res) {
  var email = req.body.email.toLocaleLowerCase();

  User.findOne({ name: email, psw: req.body.password }, function(err, user) {
    if (err) {
      return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
    }

    if (!user) {
      return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, "Invalid email and/or password");
    }

    user.email = email;
    user.password = req.body.password;
    user.psw = ""; // 删除就psw
    saveAndResponse(req, res, user);
  });
}

router.post("/signup", function(req, res) {
  var email = req.body.email;
  if (email) {
    email = email.toLocaleLowerCase();
  } else {
    return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, "email is empty！");
  }

  var name = email;
  var psw = req.body.password || null;
  var groupId = req.body.groupId || "11111";
  var userType = req.body.userType || userController.USER_TYPE.STUDENT;
  let displayName = req.body.displayName || null;

  // status.logUser(req);
  var errorId = Const.ERROR.NO;
  var errorMsg = "";

  if (!isValidDisplayName(displayName)) {
    displayName = name;
  }

  if (!isValidDisplayName(displayName)) {
    errorId = Const.ERROR.DISPLAY_NAME_INVALID;
    errorMsg = "display name at least 1 character";
  } else if (!isValidFormat(name)) {
    errorId = Const.ERROR.NAME_IS_INVALID;
    errorMsg = "invalid name";
  } else if (!isValidFormat(psw)) {
    errorId = Const.ERROR.PASSWORD_IS_INVALID;
    errorMsg = "invalid password format";
  }

  if (errorId !== Const.ERROR.NO) {
    return sendBackErrorInfo1(errorMsg, errorId);
  }

  function sendBackErrorInfo1(msg, errorId) {
    var data = composeErrorPkg(msg, errorId);
    status.onLoginFailed(req, res, data);
    res.send(data);
  }

  User.findOne({ email: email }, function(err, user) {
    if (err) {
      return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
    }

    if (user) {
      errorId = Const.ERROR.NAME_IS_INVALID_OR_TAKEN;
      var pkg = composeErrorPkg("Email is already taken", errorId);
      return responseError(res, Const.HTTP.STATUS_409_CONFLICT, pkg);
    }
    var userInfo = new User({
      name: email, // email or phone number
      displayName: displayName,
      groupId: groupId,
      type: userType,
      email: email,
      password: psw
    });
    saveAndResponse(req, res, userInfo);
  });
});

router.post("/sendcode", function(req, res) {
  var name = req.body.name.toLocaleLowerCase();
  User.findOne({ email: name }, function(err, user) {
    if (err) {
      return responseError(res, 200, { user: "user" });
    }

    if (user) {
      // var payload = {username : name};
      var payload = { name: name };
      jwt_full.sign(
        payload,
        config.TOKEN_SECRET,
        {
          expiresIn: "5m"
        },
        (err, token) => {
          if (err) {
            res.send({ token: "token" });
          } else {
            // send mail or sms
            if (validateEmail(name)) {
              // mailtrap
              /*
              var transport = nodemailer.createTransport({
                host : config.MAILTRAP_HOST,
                port : config.MAILTRAP_PORT,
                auth : {
                  user : config.MAILTRAP_USER,
                  pass : config.MAILTRAP_PASS
              }});
              */

              // gmail
              var transport = nodemailer.createTransport({
                host: config.GMAIL_HOST,
                port: config.GMAIL_PORT,
                secure: false,
                auth: {
                  user: config.GMAIL_ACCOUNT,
                  pass: config.GMAIl_PASSWORD
                }});

              var mailOptions = {
                from: "noreplay@udoido.com",
                to: name,
                subject: "code to reset password",
                text: token
              };
              transport.sendMail(mailOptions, (error, info) => {
                if (error) {
                  return res.send({ error: "error" });
                }
                return res.send({ success: "success" });
              });
            } else {
              var accountSid = config.TWILIO_ACCOUNT_SID;
              var authToken = config.TWILIO_AUTH_TOKEN;
              var verifySid = config.TWILIO_VERIFY_SID;

              var twilio = require("twilio")(accountSid, authToken);

              twilio.verify.v2
                .services(verifySid)
                .verifications.create({ to: name, channel: "sms" })
                .then((verification) => {
                  return res.send({ result: verification.status });
                });
            }
          }
        });
    } else {
      return res.send({ user: "user" });
    }
  });
});

function validateEmail(email) {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
}

router.post("/confirmcode", function(req, res) {
  var code = req.body.code;
  var name = req.body.name;

  if (validateEmail(name)) {
    jwt_full.verify(code, config.TOKEN_SECRET, function(err, decoded) {
      if (err) {
        return res.send({ error: "error" });
      } else {
        return res.send({ success: "success" });
      }
    });
  } else {
    var accountSid = config.TWILIO_ACCOUNT_SID;
    var authToken = config.TWILIO_AUTH_TOKEN;
    var verifySid = config.TWILIO_VERIFY_SID;

    var twilio = require("twilio")(accountSid, authToken);
    twilio.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: name, code: code })
      .then((verification_check) => {
        return res.send({ result: verification_check.status });
      });
  }
});

router.post("/updatepassword", function(req, res) {
  var name = req.body.name;
  var code = req.body.code;
  var password = req.body.psw;
  jwt_full.verify(code, config.TOKEN_SECRET, function(err, decoded) {
    if (err) {
      res.send({ error: "error" });
    } else {
      var name = decoded.name;
      User.findOne({ email: name }, function(err, user) {
        if (err) {
          res.send({ error: "error" });
        }

        if (user) {
          user.password = password;
          user.save(function(err) {
            if (err) {
              res.send({ error: "error" });
            } else {
              res.send({ success: "success" });
            }
          });
        } else {
          res.send({ error: "error" });
        }
      });
    }
  });
});

router.get("/api/me", authHelper.ensureAuthenticated, function(req, res) {
  var userInfo;
  if (req.tokenId) {
    userInfo = onlineUsers.get(req.tokenId);
  }

  if (!userInfo) {
    return responseError500(res, { message: "需要重新登录!" });
  }

  var userInfoPkg = composeUserPkg(userInfo);
  status.onLoginSucceed(req, res, userInfoPkg, req.tokenId); //
  res.send(userInfoPkg);
});

router.put("/api/me", authHelper.ensureAuthenticated, function(req, res) {
  console.error("需要吗？");
  User.findById(req.user, function(err, user) {
    if (err) {
      return responseError500(res, err);
    }

    if (!user) {
      return responseError(res, Const.HTTP.STATUS_400_BAD_REQUEST, "User not found");
    }
    user.displayName = req.body.displayName || user.displayName;
    user.email = req.body.email || user.email;
    user.save(function(err) {
      if (err) {
        console.error(err);
        res.status(Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR);
      } else {
        res.status(Const.HTTP.STATUS_200_OK).end();
      }
    });
  });
});

router.post("/facebook", function(req, res) {
  var fields = ["id", "email", "first_name", "last_name", "link", "name"];
  var accessTokenUrl = "https://graph.facebook.com/v2.5/oauth/access_token";
  var graphApiUrl = "https://graph.facebook.com/v2.5/me?fields=" + fields.join(",");
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: "806ead2d9cf4864704ffd3f970353f4c",
    redirect_uri: req.body.redirectUri
  };

  // Step 1. Exchange authorization code for access token.
  request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
    if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
      return responseError500(res, err, accessToken);
    }

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
      if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
        return responseError500(res, err, profile);
      }

      var requestToLink = !!req.header("Authorization");
      var unifiedProfile = unifyProfile(
        profile.id,
        profile.email,
        profile.displayName,
        "https://graph.facebook.com/" + profile.id + "/picture?type=large"
        // 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large'
      );
      return responseUserInfo(res, req, { facebook: unifiedProfile.id }, unifiedProfile,
        { authorizer: Const.AUTH.FACEBOOK }, requestToLink);
    });
  });
});

router.post("/wechat", function(req, res) {
  // 参考： https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140842
  var redirect_uri = req.body.redirectUri;
  var getCodeUrl = "https://open.weixin.qq.com/connect/oauth2/authorize?" +
            "appid=" + config.WECHAT_APPID +
            "&redirect_uri=" + redirect_uri +
            "&response_type=code" +
            "&scope=" + "snsapi_login" + // snsapi_userinfo,  snsapi_base
            "&state=" + "STATE123" + // 可以任意取值
            "#wechat_redirect";
    // 如果用户同意授权，页面将跳转至 redirect_uri/?code=CODE&state=STATE。
    // code只能使用一次，5分钟未被使用自动过期。
    // code作为换取access_token的票据，每次用户授权带上的code将不一样.
    // 尤其注意：由于公众号的secret和获取到的access_token安全级别都非常高，
    // 必须只保存在服务器，不允许传给客户端。
    // 后续刷新access_token、通过access_token获取用户信息等步骤，也必须从服务器发起。

  request.get({ url: getCodeUrl, qs: {}, json: true }, function(err, response, data) {
    if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
      return responseError500(res, err, data);
    }

    var code2TokenUrl = "https://api.weixin.qq.com/sns/oauth2/access_token?" +
            "appid=" + config.WECHAT_APPID +
            "&secret=" + config.WECHAT_SECRET +
            "&data=" + readQs(url, "data") +
            "&grant_type=authorization_code";

    request.get({ url: code2TokenUrl, qs: {}, json: true }, function(err, response, data) {
      if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
        return responseError500(res, err, data);
      }

      var webAuth_access_token = data.access_token;
      var openid = data.openid;
      // access_token拥有较短的有效期，
      // 可以使用refresh_token进行刷新，refresh_token有效期为30天，
      // 当refresh_token失效之后，需要用户重新授权。
      // Step 2. Retrieve profile information about the current user.
      var profileApiUrl = "https://api.weixin.qq.com/sns/userinfo?" +
                "access_token=" + webAuth_access_token +
                "&openid=" + openid +
                "&lang=zh_CN";
      request.get({ url: profileApiUrl, qs: {}, json: true }, function(err, response, profile) {
        if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
          return responseError500(res, err, profile);
        }

        var requestToLink = !!req.header("Authorization");
        var unifiedProfile = unifyProfile(
          profile.openid,
          null, // email， nice to have, 不能是必须的，因为很多微信用户就没有email
          profile.displayName || profile.nickName, // 兼容二者
          profile.headimgurl
        );
        return responseUserInfo(res, req, { facebook: unifiedProfile.id },
          unifiedProfile, { authorizer: Const.AUTH.FACEBOOK }, requestToLink);
      });
    });
  });
});

function responseUserInfo(res, req, condition, profile, authInfo, requestToLink) {
  User.findOne(condition, onFound);
  function onFound(err, user) {
    if (err) {
      return responseError500(res, err);
    } else if (user) {
      user = updateUser(user, profile, authInfo);
    } else {
      if (requestToLink && req) { // 未发现已经link好的账号，
        var token = req.header("Authorization").split(" ")[1];
        var payload = jwt.decode(token, config.TOKEN_SECRET);
        condition = { _id: payload.sub };
        return responseUserInfo(res, null, condition, profile, authInfo, requestToLink);
      } else {
        user = createUser(profile, authInfo);
      }
    }

    return saveAndResponse(req, res, user, profile, authInfo);
  }
}

function updateUser(userModel, profile, authInfo) {
  var prefix = Const.AUTH_PREFIX[authInfo.authorizer];
  if (userModel.name === (prefix + "undefined")) {
    userModel.name = null;
  }
  if (userModel.psw === (prefix + "undefined")) {
    userModel.psw = null;
  }
  userModel.name = userModel.name || (prefix + profile.id);
  userModel.psw = userModel.psw || (prefix + profile.id);
  userModel.email = userModel.email || profile.email;
  if (profile.facebook) {
    userModel.facebook = profile.facebook;
  }
  if (profile.google) {
    userModel.google = profile.google;
  }
  if (profile.twitter) {
    userModel.twitter = profile.twitter;
  }
  if (profile.wx) {
    userModel.wx = profile.wx;
  }
  userModel.displayName = userModel.displayName || profile.displayName; // 其它平台修改了，这里不受影响？
  return userModel;
}

function createUser(profile, authInfo) {
  var userModel = new User();
  return updateUser(userModel, profile, authInfo);
}

var requestTokenUrlTwitter = "https://api.twitter.com/oauth/request_token";
var accessTokenUrlTwitter = "https://api.twitter.com/oauth/access_token";
var profileUrlTwitter = "https://api.twitter.com/1.1/account/verify_credentials.json";

router.post("/twitter", function(req, res) {
  // Part 1 of 2: Initial request from Satellizer.
  if (!req.body.oauth_token || !req.body.oauth_verifier) {
    var requestTokenOauth = {
      consumer_key: config.TWITTER_KEY,
      consumer_secret: config.TWITTER_SECRET,
      // 在授权通过，但是不允许获取用户资料的情况下， 调用此url
      // 如果允许获取用户资料，则不调用此url
      callback: req.body.redirectUri
    };

    // Step 1. Obtain request token for the authorization popup.
    request.post({ url: requestTokenUrlTwitter, oauth: requestTokenOauth }, function(err, response, body) {
      if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
        return responseError500(res, err, body);
      }

      var oauthToken = qs.parse(body);
      console.log("oauth_token: " + oauthToken.oauth_token);
      console.log("oauth_verifier: " + oauthToken.oauth_verifier);

      // Step 2. Send OAuth token back to open the authorization screen.
      if (oauthToken.oauth_callback_confirmed === "true") {
        // 必须返回这些Token， Twitter才会向用户显示授权请求信息
        res.send(oauthToken);
      } else {
        return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, "Authentication failed!");
      }
    });
  } else {
    return doTwitterPart2(req, res, req.body.oauth_token, req.body.oauth_verifier);
  }
});

function doTwitterPart2(req, res, oauth_token, oauth_verifier) {
  // Part 2 of 2: Second request after Authorize app is clicked.
  var accessTokenOauth = {
    consumer_key: config.TWITTER_KEY,
    consumer_secret: config.TWITTER_SECRET,
    token: oauth_token,
    verifier: oauth_verifier
  };

  // Step 3. Exchange oauth token and oauth verifier for access token.
  request.post({ url: accessTokenUrlTwitter, oauth: accessTokenOauth }, function(err, response, accessToken) {
    if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
      return responseError500(res, err, accessToken);
    }

    accessToken = qs.parse(accessToken);

    var profileOauth = {
      consumer_key: config.TWITTER_KEY,
      consumer_secret: config.TWITTER_SECRET,
      token: accessToken.oauth_token,
      token_secret: accessToken.oauth_token_secret
    };

    // Step 4. Retrieve user's profile information and email address.
    request.get({
      url: profileUrlTwitter,
      qs: { include_email: true },
      oauth: profileOauth,
      json: true
    }, function(err, response, profile) {
      if (err) {
        console.error("Error", err);
      }
      console.info(response);

      var requestToLink = !!req.header("Authorization");
      var unifiedProfile = unifyProfile(
        profile.id,
        profile.email,
        profile.displayName,
        profile.profile_image_url_https.replace("_normal", "")
        // 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large'
      );

      return responseUserInfo(res, req, { twitter: unifiedProfile.id },
        unifiedProfile, { authorizer: Const.AUTH.TWITTER }, requestToLink);
    });
  });
}

router.post("/google", function(req, res) {
  var accessTokenUrl = "https://accounts.google.com/o/oauth2/token";
  var peopleApiUrl = "https://www.googleapis.com/plus/v1/people/me/openIdConnect";
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.GOOGLE_SECRET,
    redirect_uri: req.body.redirectUri,
    grant_type: "authorization_code"
  };

  // Step 1. Exchange authorization code for access token.
  request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
    if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
      return responseError500(res, err, token);
    }

    var accessToken = token.access_token;
    var headers = { Authorization: "Bearer " + accessToken };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
      if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
        return responseError500(res, err, profile);
      }

      // Step 3a. Link user accounts.
      var requestToLink = !!req.header("Authorization");
      var unifiedProfile = unifyProfile(
        profile.sub, // 不是id！！！， google 用sub代替id
        profile.email,
        profile.displayName,
        profile.picture.replace("sz=50", "sz=200")
      );
      return responseUserInfo(res, req, { google: unifiedProfile.id },
        unifiedProfile, { authorizer: Const.AUTH.GOOGLE }, requestToLink);
    });
  });
});

function createJWT(user, tokenId) {
  var payload = {
    salt: Math.round(Math.random() * 1000),
    sub: (!user.ID ? user._id : user.ID),
    tokenId: tokenId,
    iat: moment().unix(),
    exp: moment().add(14, "days").unix()
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
}

function responseError(res, statusCode, msg) {
  return authHelper.responseError(res, statusCode, msg);
}

function responseError500(res, err, data) {
  var errDesc = (err) ? err.message : (data.error ? data.error.message : "unknown error");
  return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, errDesc);
}

function resUserToken2(req, res, user, authInfo) {
  var tokenId = authHelper.generateTokenId();
  var token = createJWT(user, tokenId);
  var userInfoPackage = composeUserPkg(user);
  status.onLoginSucceed(req, res, userInfoPackage, tokenId, authInfo);
  res.send({ token: token, data: userInfoPackage });
}

function saveAndResponse(req, res, userModel, authInfo) {
  doSaveUser(req, res, userModel, function(savedModel) {
    resUserToken2(req, res, savedModel, authInfo);
  });
}

function doSaveUser(req, res, userModel, callback) {
  userModel.save(function(err, userModel) {
    if (err) {
      var pkg = composeErrorPkg(err, Const.ERROR_NAME_EXIST_OR_INVALID_FORMAT);
      return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, pkg);
    }
    if (callback) {
      callback(userModel);
    }
  });
}

function wxCode2OpenId(wxCode, displayName, callback) {
  var wxUser = onlineWxUsers.getOpenId(wxCode);
  var openId;

  if (wxUser) {
    if (wxUser.openId) {
      openId = wxUser.openId;
    }

    if (wxUser.nickName && (wxUser.nickName !== Const.DEFAULT_WX_GUEST_NAME)) {
      displayName = wxUser.nickName;
    }
  }

  if (!openId) {
    openId = "OpenIdF" + displayName;
  }

  setTimeout(function() {
    if (callback) {
      callback(openId, displayName);
    }
  });
}

function updateDisplayName(user, wxCode) {
  var wxUser = onlineWxUsers.getOpenId(wxCode);

  if (user && wxUser && wxUser.nickName && (wxUser.nickName !== Const.DEFAULT_WX_GUEST_NAME)) {
    user.displayName = wxUser.nickName;
  }
}

function createWxUser(req, res, authInfo, displayName) {
  var requestToLink = false; // 建立新的，而不是link到老的
  var unifiedProfile = unifyProfile(authInfo.wx, null, displayName);
  unifiedProfile.wx = authInfo.wx; // openId;
  unifiedProfile.wxCode = authInfo.wxCode;

  return responseUserInfo(res, req,
    { wx: authInfo.wx },
    unifiedProfile,
    authInfo,
    requestToLink);
}

function isValidFormat(name) {
  return ((name) && (name.length >= 8));
}

function isValidDisplayName(name) {
  return ((name) && (name.length >= 1));
}

function unifyProfile(id, email, displayName, pictureUrl) {
  return {
    id: id,
    email: email,
    displayName: displayName,
    picture: pictureUrl
  };
}

function readQs(url, paraName) {
  var queryString = url.substr(url.indexOf("?") + 1);
  return qs.parse(queryString)[paraName];
}

module.exports = router;
