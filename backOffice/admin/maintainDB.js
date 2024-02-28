// 维护db：
// 重新建立素材db：
//   1) 从素材文件夹获取所有的文件，并加入到db中，
//   2) 标记有用的素材
//   3) 清除剩余的垃圾素材，
//

var cloudinary = require("cloudinary");
var pictureMat = require("../db/material/pictureMatController");
var utils = require("../common/utils");

cloudinary.config({
  cloud_name: "eplan",
  api_key: "374258662676811",
  api_secret: "dwwKQ0MPL40ttMSR6SoMH-E1Jrw",
  secure: true
});

let next_cursor = null;
function saveAllMatToDB() {
  const options = {
    type: "upload",
    max_results: 100,
    // Jan 23, 2016 3: 57 pm
    // Jan 10, 2017
    start_at: "2016-1-30",
    prefix: "" // add your folder
  };

  if (next_cursor) {
    options.next_cursor = next_cursor;
  }

  cloudinary.v2.api.resources(
    options,
    function(error, result) {
      if (error) {
        console.log("Error:", error);
      } else {
        next_cursor = result.next_cursor;

        if (result && result.resources) {
          for (var item of result.resources) {
            console.log(item.created_at + ": " + item.secure_url);
            addMatToDb(item.secure_url);
          }
        }
        if (next_cursor) {
          setTimeout(saveAllMatToDB, 100);
        } else {
          console.log("!!!!All images are listed above!!!!");
        }
      }
    });

  function addMatToDb(fullPath) {
    const userId = 10;
    const iComponentId = 0;
    const picName = "mat2020";
    const typeId = 20;
    const ip = null;
    const isShared = false;
    const path = utils.path2short(fullPath);

    pictureMat.addFromCloud(userId,
      iComponentId,
      picName,
      typeId,
      ip,
      isShared,
      path);
  }
}

const maintainDB = {};
maintainDB.saveAllMatToDB = saveAllMatToDB;
module.exports = maintainDB;
