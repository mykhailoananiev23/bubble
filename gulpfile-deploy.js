
//deploy专用的code，从gulpfile.js中剥离出来。
var allowHostJsToCloudinary = false;

var amountDeployed = 0;
async function deploy_to_cdn() {
  var options = {
      resource_type: 'raw' // 'image'
    },
    i,
    cloudinary = require('cloudinary'),
    hashSurffix = generateHash();

  cloudinary.config({
    cloud_name: 'eplan',
    api_key: "374258662676811",
    api_secret: 'dwwKQ0MPL40ttMSR6SoMH-E1Jrw'
  });

  cdnFileMap.splice(0);
  for (i = 0; i < sourceFiles.length; i++) {
    cdnFileMap.push(null);
    await uploadToCDN(sourceFiles[i], i);
  }

  function uploadToCDN(item, slotId) {
    if (!allowHostJsToCloudinary) {
      makeHashName(item, slotId);
    } else {
      uploadToCloudinary(item, slotId);
    }
  }

  function uploadToCloudinary(item, slotId) {
    cloudinary.uploader.upload(dstPath + "/www" + item.name, function (result) {
      addToMap(item, result, slotId);
    }, options);
  }

  function makeHashName(item, slotId) {
    var newName = getHashName(item.name);
    src(dstPath + "/www" + item.name)
      .pipe(gulp_rename(newName))
      .pipe(dest(dstPath + '\\www'));
    // 确认hash name 的文件生成了
    doOnceExist(dstPath + '\\www' + newName, async function () {
      addToMap(item, { url: newName }, slotId);
    });
  }


  function generateHash() {
    var today = new Date(),
      timestamp = today.getTime(),
      digit5 = Math.round(timestamp / 1000) % 10000;
    return (1 + today.getMonth()) + '-' + today.getDate() + '-' + digit5;
  }

  function getHashName(name) {
    var ext,
      root,
      pos = name.indexOf('.');
    root = name.substr(0, pos);
    ext = name.substr(pos);
    return root + '-' + hashSurffix + ext;
  }

  function addToMap(sourceFile, result, slotId) {
    var dstUrl = (!result ? null : (result.secure_url ? result.secure_url : result.url));
    if (dstUrl) {
      cdnFileMap[slotId] = { src: sourceFile.name, dst: dstUrl, order: sourceFile.order };
      console.log(amountDeployed + ': ' + sourceFile.name + " uploaded as " + dstUrl);
    } else {
      console.log("!!!! Error !!!!");
      console.log(result);
    }

    amountDeployed++;
    if (amountDeployed >= cdnFileMap.length) {
      console.log("key: start prepare for deploy... " + amountDeployed + ' of ' + cdnFileMap.length);
      setTimeout(function () {
        gulp.start('prepare_for_AliClound'); // 延时， 以确保hash改名能够完成
      }, 1000);
    }
  }
  return Promise.resolve();
}

async function deployClient(callback) {
  withServer = false;
  await tryToDeploy(callback);
  return Promise.resolve();
}

async function deployClientAndserver(callback) {
  withServer = true;
  await tryToDeploy(callback);
  return Promise.resolve();
}

async function tryToDeploy(callback) {
  if (wcyApp_minify_ready) {
    series(deploy_to_cdn, function () {
      if (callback) {
        callback();
      }
    });
  } else {
    console.log("try to deploy, but wcyApp_minify not ready");
    setTimeout(function () {
      tryToDeploy(callback);
    }, 10000);
  }
  return Promise.resolve();
}

const prepare_for_AliClound =
    series([update_index_html], [hide_source_del_temp], [zip_backend], [zip_frontend],
      show_result, callback);

