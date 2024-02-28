/**
 * Created by Andrewz on 12/5/2016.
 */

var KT = KT || {};
KT.Tool = KT.Tool || {};
(function () {
  var TEMP_IMG_NODE_ID = "temp_img",
    TEMP_LINK_NODE_ID = "temp_link";

  KT.Tool.saveImage = saveImage;
  KT.Tool.resetDom = resetDom;

  function resetDom() {
    var ele;
    if (ele = document.getElementById(TEMP_IMG_NODE_ID)) {
      ele.remove();
    }
    if (ele = document.getElementById(TEMP_LINK_NODE_ID)) {
      ele.remove();
    }
  }

  function saveImage(filename) {
    var canvas = renderer.domElement;
    var image = canvas.toDataURL("image/png");
    _saveAs(image, filename);
    // _saveWithLocation(image);
  }

  function _saveWithLocation(image64png) {
    // here is the most important part because
    // if you dont replace you will get a DOM 18 exception.
    image64png = image64png.replace("image/png", "image/octet-stream"); // save directly, no name, no ext
    window.location.href = image64png; // it will save locally
    // 缺点： 文件名称只能是缺省的"下载",不能是其它名称， 也没有后缀
  }

  function _saveAs(image64png, filename) {
    // create a new image and add to the document
    var imgNode; // = document.getElementById(TEMP_IMG_NODE_ID);
    if (!imgNode) {
      imgNode = document.createElement("img");
      imgNode.src = image64png;
      imgNode.id = "temp_img";
      document.body.appendChild(imgNode);
    } else {
      imgNode.src = image64png;
    }

    var link = document.getElementById(TEMP_LINK_NODE_ID);
    if (!link) {
      link = document.createElement("a");
    }

    link.download = filename;
    link.href = image64png;
    link.click();
  }
}());
