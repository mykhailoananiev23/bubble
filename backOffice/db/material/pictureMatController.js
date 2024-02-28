/**
 * Created by admin on 12/4/2015.
 */
// 实现数据库的增删改查
// 1) 获取我的所有素材和公共分享的素材
// 2) 上传素材，(先获取ID， 上传到Cloundary，在通知：以及上传成功
//
var mongoose = require("mongoose");
var utils = require("../../common/utils");
var dbCommon = require("../dbCommonFunc.js");
var PictureMat = mongoose.model("PictureMat");

// ToDo: 限制：只选择所有的共享素材，和 我的素材。用Query的 and()操作
function get(userId, callback) {
  PictureMat.find({ userId: userId, uploaded: true }).exec(function(err, data) {
    if (err) {
      console.error("Error", err);
    } else if (!data) {
      console.error(404, { msg: "not found for user: " + userId });
    } else {
      // console.log(data);
    }

    if (callback) {
      var result = [];
      var num = data.length;
      var i;

      for (i = 0; i < num; i++) {
        var doc1 = data[i];
        if (!doc1.path) {
          continue;
        }
        result.push(doc1.path);
      }
      callback(result);
    }
  });
}

function getList(userId, typeId, topicId, onSuccess, isAdmin, requestAll) {
  /*
			必须是“没有禁止的”
			内容及其排序：
			1）我自己上传的 （如果指定了userID）
			2）关联到本主题，而且 公开的（如果指定了主题， 否则： 所有公开的）

			对于管理员：
			1) 获取所有素材
	 */
  var userLimit = (userId == null) ? null : { "userId": userId };
  var topicLimit = !hasValidTopic(topicId) ? null : { topicIds: topicId }; // 选topicIds数组中含有元素topicId的，
  var allShared = { "isShared": true };
  var typeLimit = { "typeId": typeId };
  var notBanned = { "isBanned": false };
  var userAndTopicLimit;
  var queryStr;
  if (isAdmin) {
    userLimit = null;
    if (requestAll) {
      topicLimit = null;
    }
  } else if (!topicLimit) {
    topicLimit = allShared;
  }

  userAndTopicLimit = userLimit;
  if (topicLimit) {
    if (userAndTopicLimit) {
      userAndTopicLimit = { $or: [userAndTopicLimit, topicLimit] };
    } else {
      userAndTopicLimit = topicLimit;
    }
  }

  if (userAndTopicLimit) {
    queryStr = { $and: [typeLimit, notBanned, userAndTopicLimit] };
  } else {
    queryStr = { $and: [typeLimit, notBanned] };
  }

  PictureMat.aggregate([
    { "$match": queryStr },
    {
      "$addFields": { // 有些记录没有此数组，所以要补，否则下面的比较会出错
        "topicIds": {
          "$cond": {
            "if": { "$ne": [{ "$type": "$topicIds" }, "array"] },
            "then": [],
            "else": "$topicIds"
          }
        }
      }
    },
    { "$addFields": { "topicAttached": { $in: [topicId, "$topicIds"] }}} // 排序依据：是否关联到主题
    //, {"$limit": 15}
  ]).sort({ topicAttached: 1, timestamp: -1 }).exec(onSearchResult);

  function onSearchResult(err, data) {
    var result = [];
    if (err) {
      console.error("Error", err);
    } else if (!data) {
      console.error(404, { msg: "not found! userId = " + userId + ", matType =" + typeId });
    } else {
      data.forEach(copyItem);
    }

    onSuccess(result);

    function copyItem(doc) {
      var item = doc;
      if (item.path) {
        item.id = item._id;
        item.authorId = item.userId;
        item.time = item.timestamp;
        result.push(item);
      }
    }
  }
}

function add(userId, iComponentId, picName, typeId, ip, isShared, onSuccess, onError) {
  var condition = null;
  if (isFullPath(picName)) {
    condition = { "typeId": typeId, "name": picName };
    PictureMat.find(condition).exec(onSearchResult);
  } else {
    doAdd(userId, iComponentId, picName, typeId, ip, isShared, onSuccess, onError);
  }

  function onSearchResult(err, data) {
    if (err) {
      console.error("Error", err);
    } else if (!data || (data.length < 1)) {
      doAdd(userId, picName, typeId, ip, isShared, onSuccess, onError);
    } else {
      onSuccess(data[0]._doc._id, data[0]._doc.path);
    }
  }
}

function addFromCloud(userId, iComponentId, picName, typeId, ip, isShared, path) {
  const condition = { "typeId": typeId, "path": path };

  PictureMat.find(condition).exec(function(err, data) {
    if (!err && (!data || (data.length < 1))) {
      doAdd(userId, iComponentId, picName, typeId, ip, isShared, null, null, path);
    }
  });
}

function doAdd(userId, iComponentId, picName, typeId, ip, isShared, onSuccess, onError, path = null) {
  var aDoc = new PictureMat({
    userId: userId,
    typeId: typeId,
    iComponentId: iComponentId,
    name: picName,
    ip: ip,
    isShared: isShared
  });

  if (path !== "") {
    aDoc.path = path;
  }

  aDoc.save(function(err, doc) {
    utils.onSave(err, doc, onSuccess, onError);
  });
}

function isFullPath(url) {
  var protocols = ["http://", "https://"];
  for (var i = 0; i < protocols.length; i++) {
    if (url.indexOf(protocols[i]) === 0) {
      return true;
    }
  }
  return false;
}

function update(id, path, callback) {
  PictureMat.findOne({ _id: id })
    .exec(function(err, data) {
      if (err) {
        console.error("Error", err);
      } else if (!data) {
        console.error(404, { msg: "not found!" + id });
      } else {
        console.log(data);
        data.set("uploaded", true);
        data.set("path", path);
        data.save(function(err, data) {
          if (!err) {
            if (callback) {
              callback(data._doc._id);
            }
          } else {
            console.error("error in update picture mat!");
          }
        });
      }
    });
}

function attachTopic(matType, matId, topicId, operator, onSuccess, onError) {
  function doAttach(model) {
    var topicIds = model._doc.topicIds;
    if (!topicIds) {
      topicIds = [];
    }
    if (topicIds.indexOf(topicId) < 0) {
      topicIds.push(topicId);
    }
    model.set("topicIds", topicIds);
  }

  genericUpdate(matId, doAttach, operator, onSuccess, onError);
}

function detachTopic(matType, matId, topicId, operator, onSuccess, onError) {
  function doDetach(model) {
    var id;
    var topicIds = model._doc.topicIds;

    if (topicIds && ((id = topicIds.indexOf(topicId)) >= 0)) {
      topicIds.splice(id, 1);
      model.set("topicIds", topicIds);
    }
  }

  genericUpdate(matId, doDetach, operator, onSuccess, onError);
}

function genericUpdate(id, doUpdate, operator, onSuccess, onError) {
  var condition = { _id: id };
  if (!operator.canAdmin) {
    condition.authorId = operator.ID;
  }

  PictureMat.findOne(condition)
    .exec(function(err, data) {
      if (err || !data) {
        onError(dbCommon.composeErrorMsg(err, data));
      } else {
        console.log(data);
        doUpdate(data);
        data.save(function(err, model) {
          if (err || !model) {
            onError(dbCommon.composeErrorMsg(err, model));
          } else {
            if (onSuccess) {
              onSuccess(model._doc._id, model._doc);
            }
          }
        });
      }
    });
}

function ban(operator, id, newValue, callback) {
  dbCommon.ban(operator, PictureMat, id, newValue, callback);
}

function hasValidTopic(topicId) {
  return (topicId != null) && (topicId > 0);
}

exports.add = add;
exports.addFromCloud = addFromCloud;
exports.attachTopic = attachTopic;
exports.detachTopic = detachTopic;
exports.get = get;
exports.getList = getList;
exports.update = update;
exports.ban = ban;
