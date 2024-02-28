/**
 * Created by Andrewz on 10/3/2016.
 */

var KT = KT||{};
KT.Helper = (function(){
  var FULL_256_SIZE = 256;
  return {
    countConnectivity: countConnectivity,
    findRange: findRange,
    getCdf: getCdf,
    isEqual: isEqual,
    sort256Bins: sort256Bins,
    sort256RGBBins: sort256RGBBins,
    initialize: initialize
  };

  function countConnectivity(pixels) {
    var amount = pixels.length;
    var ids = [],
      areas = [];

    KT.Picture.bind(pixels);

    for (var i = 0; i < amount; i += 4) {
      var id = KT.Picture.getRegionIdByIndex(i);
      if (!areas[id]) {
        areas[id] = 1;
        ids.push(id);
      } else {
        areas[id]++;
      }
    }

    KT.Picture.restore();
    ids.sort(compareNumber);
    console.log(JSON.stringify(ids));
    var msg = "";
    for (var i=0; i< ids.length; i++) {
      msg +="," +areas[ids[i]];
    }

    console.log(msg);
    return {
      ids: ids,
      areas: areas
    }
  }

  function findRange(pixels) {
    var minGrey = 255,
      maxGrey = 0;
    var amount = pixels.length;
    KT.Picture.bind(pixels);

    for (var i = 0; i < amount; i += 4) {
      var value = KT.Picture.getPointByIndex(i).r;
      if (minGrey > value) {
        minGrey = value;
      }

      if (maxGrey < value) {
        maxGrey = value;
      }
    }

    KT.Picture.restore();

    return {
      minGrey: minGrey / 255.0,
      maxGrey: maxGrey / 255.0
    }
  }

  function getCdf(pixels) {
    var rgbBins = new Float32Array(FULL_256_SIZE * 3),
      amount = pixels.length,
      i,
      i3;

    for (var i = 0; i < FULL_256_SIZE * 3; i++) {
      rgbBins[i] = 0;
    }

    KT.Picture.bind(pixels);
    for (var i = 0; i < amount; i += 4) {
      var pt = KT.Picture.getPointByIndex(i);
      rgbBins[pt.r * 3]++;
      rgbBins[pt.g * 3 + 1]++;
      rgbBins[pt.b * 3 + 2]++;
    }

    // normalize, and accumulate
    var pixelsNum = amount / 4;
    var rmin = 0, gmin = 0, bmin = 0,
      rmax = 0, gmax = 0, bmax = 0,
      rh, gh, bh;

    for (var i = 0; i < FULL_256_SIZE; i++) {
      i3 = 3 * i;
      rh = rgbBins[i3] / pixelsNum;
      gh = rgbBins[i3 + 1] / pixelsNum;
      bh = rgbBins[i3 + 2] / pixelsNum;
      if ((rmin <=0) && (rgbBins[i3] > 0)) {
        rmin = rh;
      }
      if (rh > rmax) {
        rmax = rh;
      }

      if ((gmin <= 0) && (rgbBins[i3 + 1] > 0)) {
        gmin = gh;
      }
      if (gh > gmax) {
        gmax = gh;
      }

      if ((bmin <= 0) && (rgbBins[i3 + 2] > 0)) {
        bmin = bh;
      }
      if (bh > bmax) {
        bmax = bh;
      }

      if (i3===0) {
        rgbBins[i3] = rh;
        rgbBins[i3 + 1] = gh;
        rgbBins[i3 + 2] = bh;
      } else {
        var j3 = i3 - 3;
        rgbBins[i3] = rgbBins[j3] + rh;
        rgbBins[i3 + 1] = rgbBins[j3 + 1] + gh;
        rgbBins[i3 + 2] = rgbBins[j3 + 2] + bh;
      }
    }

    var rgbMin = new Float32Array(3);
    rgbMin[0] = rmin;
    rgbMin[1] = gmin;
    rgbMin[2] = bmin;
    var histroMax = new Float32Array(3);
    histroMax[0] = rmax;
    histroMax[1] = gmax;
    histroMax[2] = bmax;
    return {cdf: rgbBins, cdfMin: rgbMin, histoMax: histroMax};
  }

  function isEqual(connectivity1, connectivity2) {
    if ((!connectivity1) || (!connectivity2)) {
      if ((!connectivity1) && (!connectivity2)) {
        return true;
      } else {
        return false;
      }
    }

    var n = connectivity2.ids.length;
    if (n != connectivity1.ids.length) {
      return false;
    }

    for (var i = 0; i< n; i++) {
      var id1 = connectivity1.ids[i],
        id2 = connectivity2.ids[i];

      if ((id1 !== id2) ||
                (connectivity1.areas[id1] != connectivity2.areas[id2])) {
        return false;
      }
    }
    return true;
  }

  // ����
  function sort256Bins(pixels) {
    var SCALE = 256 / FULL_256_SIZE;
    var pixelBins = [];
    for (var i = 0; i < FULL_256_SIZE; i++) {
      pixelBins[i] = [];
    }

    var amount = pixels.length;
    for (var i = 0; i < amount; i += 4) {
      var value = KT.Picture.getGpbByIndex(i);
      value = Math.ceil(value / SCALE);
      pixelBins[value].push(i);
    }

    return pixelBins;
  }

  function sort256RGBBins(pixels) {
    var rgbBins = new Float32Array(FULL_256_SIZE * 3),
      amount = pixels.length,
      totalPixelInBkg = 0,
      i,
      i3,
      j3;

    for (var i = 0; i < FULL_256_SIZE; i++) {
      i3 = 3 * i;
      rgbBins[i3] = 0;
      rgbBins[i3 + 1] = 0;
      rgbBins[i3 + 2] = 0;
    }

    KT.Picture.bind(pixels);
    for (i = 0; i < amount; i += 4) {
      var pt = KT.Picture.getPointByIndex(i);

      if ((pt.a > 200)) { //��shader�У� �Ѿ�Լ�� ������ aΪ1.0,(255)�� ǰ����Ϊ(0.1) 25
        rgbBins[pt.r * 3]++;
        rgbBins[pt.g * 3 + 1]++;
        rgbBins[pt.b * 3 + 2]++;
        totalPixelInBkg++;
      }
    }

    TQ.Log.info("total:" + totalPixelInBkg);
    //    dumpRgbBins(rgbBins);

    // remove noise： 去除背景中的杂色， 特别是 粘连在边界上的 属于物体的点
    var rNoise = 0,
      gNoise = 0,
      bNoise = 0;

    var threshold = determineNoise(rgbBins, totalPixelInBkg);
    for (var i = 0; i < FULL_256_SIZE; i++) {
      i3 = i * 3;
      if (rgbBins[i3] < threshold.r) {
        rNoise += rgbBins[i3];
        rgbBins[i3] = 0;
      }
      if (rgbBins[i3 + 1] < threshold.g) {
        gNoise += rgbBins[i3 + 1];
        rgbBins[i3 + 1] = 0;
      }

      if (rgbBins[i3 + 2] < threshold.b) {
        bNoise += rgbBins[i3 + 2];
        rgbBins[i3 + 2] = 0;
      }
    }

    var rTotalPixel = totalPixelInBkg - rNoise,
      gTotalPixel = totalPixelInBkg - gNoise,
      bTotalPixel = totalPixelInBkg - bNoise;

    // normalize & convolution
    i = 0;
    i3 = i * 3;
    rgbBins[i3] = rgbBins[i3] / rTotalPixel;
    rgbBins[i3 + 1] = rgbBins[i3 + 1] / gTotalPixel;
    rgbBins[i3 + 2] = rgbBins[i3 + 2] / bTotalPixel;

    for (var i = 1; i < FULL_256_SIZE; i++) {
      i3 = i * 3;
      j3 = (i - 1) * 3;
      rgbBins[i3] = rgbBins[i3] / rTotalPixel + rgbBins[j3];
      rgbBins[i3 + 1] = rgbBins[i3 + 1] / gTotalPixel + rgbBins[j3 + 1];
      rgbBins[i3 + 2] = rgbBins[i3 + 2] / bTotalPixel + rgbBins[j3 + 2];
    }

    //  dumpRgbBins(rgbBins);
    KT.Picture.restore();
    return rgbBins;
  }

  function dumpRgbBins(rgbBins) {
    var i,
      i3;

    for (var i = 1; i < 256; i++) {
      i3 = i * 3;
      console.log(rgbBins[i3].toFixed(3));
    }

    for (var i = 1; i < 256; i++) {
      i3 = i * 3;
      console.log(rgbBins[i3 + 1].toFixed(3));
    }

    for (var i = 1; i < 256; i++) {
      i3 = i * 3;
      console.log(rgbBins[i3 + 2].toFixed(3));
    }
  }

  function initialize(pixels) {
    var amount = pixels.length;
    for (var ptIndex = 0; ptIndex < amount; ptIndex += 4) {
      pixels[ptIndex + 3] = pixels[ptIndex]; //alpha
      KT.Picture.setRegionId(ptIndex, KT.Region.TYPE_UNKONWN_REGION);
    }

    return pixels;
  }

  function determineNoise(histo, amount) {
    /* 基本假设： 多数点是 背景点， 超过80%，
           排序非空的bin， 从最多的bin开始， 找到超过70% 的点， 剩余bin中，数目最多的bin的量就是阈值
         */

    var rBins = [],
      gBins = [],
      bBins = [];

    for (var i = 0; i < FULL_256_SIZE; i++) {
      var i3 = i * 3;
      if (histo[i3] > 0) {
        rBins.push(histo[i3]);
      }
      if (histo[i3 + 1] < 0) {
        gBins.push(histo[i3 + 1]);
      }

      if (histo[i3 + 2] < 0) {
        bBins.push(histo[i3 + 2]);
      }
    }

    return {
      r: findOneChannelNoise(rBins, amount),
      g: findOneChannelNoise(rBins, amount),
      b: findOneChannelNoise(rBins, amount)
    }
  }

  function findOneChannelNoise(bins, amount) {
    bins.sort(compareNumber);
    var minAmount = amount * 0.7;
    var sum = 0;
    var threshold = 0;
    for (var i = 0; i < bins.length; i++) {
      if (sum > minAmount) {
        threshold = bins[i];
        break;
      }
      sum += bins[i];
    }
    return threshold;
  }

  function compareNumber(a, b) {
    return a - b;
  }

})();

