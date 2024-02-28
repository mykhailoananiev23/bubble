/**
 * Created by admin on 10/8/2016.
 */
var KT = KT || {};

(function() {
  function Picture() {
  }
  var oldPictureStack = [],
    pixels, //由gpb值改写为RegionId值，
    bkgPixels, // 只使用其alpha值，判定是否bkg点
    height,
    width,
    width4,
    waterLevel = 0;

  function init(w, h) {
    oldPictureStack.splice(0);
    width = w;
    height = h;
    width4 = w * 4;
    pixels = null;
    bkgPixels = null;
    waterLevel = 0;
  }

  function bind(_pixels, w, h) {
    if (!w) {// 缺省的， 与之前图的尺寸一样
      w = width;
      h = height;
    }

    if (pixels) {
      stash();
    }
    pixels = _pixels;
    width = w;
    height = h;
    width4 = w * 4;
  }

  function unbind() {
    restore();
  }

  function attachBkg(_pixels) {
    bkgPixels = _pixels;
  }

  function detachBkg() {
    bkgPixels = null;
  }

  function restore() {
    if (oldPictureStack.length <=0 ) {
      return console.log("no saved pixels");
    }

    var item = oldPictureStack.pop();
    if (item && item.pixels) {
      pixels = item.pixels;
      width = item.width;
      height = item.height;
      width4 = width * 4;
    } else {
      pixels = null;
      width = 0;
      height = 0;
    }
  }

  function stash() {
    oldPictureStack.push({pixels : pixels, width : width, height : height});
  }

  function getAllPixels() {
    return pixels;
  }

  function getGpbByIndex(ptIndex) {
    return pixels[ptIndex + 3];
  }

  function getIndex(x, y) {
    return (y * width + x) * 4;
  }

  function getPoint(x, y) {
    return getPointByIndex(getIndex(x, y));
  }

  function getPointByIndex(id) {
    return {r: pixels[id], g: pixels[id + 1], b: pixels[id + 2], a: pixels[id + 3]};
  }

  function getRegionIdByXY(x, y) {
    return getRegionIdByIndex(getIndex(x, y));
  }

  function getRegionIdByIndex(id) {
    return ( pixels[id] << 16 ) | ( pixels[id + 1] << 8 ) | ( pixels[id + 2] );
  }

  function getBkgRegionInfoByIndex(id) {
    if (!bkgPixels) {
      console.log("must setup bkgPixel first");
      return -1;
    }
    return {regionId: getRegionIdByIndex(id), pBkg: bkgPixels[id + 3]};
  }

  function getX(ptIndex) {
    return (ptIndex % width4) / 4;
  }

  function getY(ptIndex) {
    return Math.floor(ptIndex / width4);
  }

  function hasRegionId(ptIndex) {
    return (getRegionIdByIndex(ptIndex) !== KT.Region.TYPE_UNKONWN_REGION);
  }

  function isOutOfBoundary(x, y) {
    return ((x < 0) || (y <0) || (x >= width) || (y >= height));
  }

  function isInWaterLevel(ptIndex) {
    return (pixels[ptIndex + 3] === waterLevel);
  }

  function nc2WcX(x) {
    return Math.round(x * width);
  }

  function nc2WcY(y) {
    return Math.round(y * height);
  }

  function setRegionId(ptIndex, regionId) {
    pixels[ptIndex] = regionId >>16;
    pixels[ptIndex + 1] = (regionId >> 8) & 0xff;
    pixels[ptIndex + 2] = regionId & 0xff;
  }

  function setWaterLevel(h) {
    waterLevel = h;
  }
  Picture.attachBkg = attachBkg;
  Picture.bind = bind;
  Picture.unbind = unbind;
  Picture.detachBkg = detachBkg;
  Picture.getIndex = getIndex;
  Picture.getAllPixels = getAllPixels;
  Picture.getGpbByIndex = getGpbByIndex;
  Picture.getPoint = getPoint;
  Picture.getPointByIndex = getPointByIndex;
  Picture.getRegionIdByXY = getRegionIdByXY;
  Picture.getRegionIdByIndex = getRegionIdByIndex;
  Picture.getBkgRegionInfoByIndex = getBkgRegionInfoByIndex;
  Picture.getWidth = function(){return width;};
  Picture.getHeight = function() {return height;};
  Picture.getX = getX;
  Picture.getY = getY;
  Picture.hasRegionId = hasRegionId;
  Picture.init = init;
  Picture.isOutOfBoundary = isOutOfBoundary;
  Picture.isInWaterLevel = isInWaterLevel;
  Picture.nc2WcX = nc2WcX;
  Picture.nc2WcY = nc2WcY;
  Picture.restore = restore;
  Picture.setRegionId = setRegionId;
  Picture.setWaterLevel= setWaterLevel;
  KT.Picture = Picture;
})();
