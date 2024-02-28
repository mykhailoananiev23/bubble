/**
 * Created by Andrewz on 1/20/2017.
 */
var KT = KT || {};
KT.Tool = KT.Tool || {};

(function () {
  var _box = {};

  function findMaxMinBox() {
    var pixelBuffer = KT.BufferPool.readPixels();
    KT.Picture.bind(pixelBuffer, canvasWidth, canvasHeight);
    var xmin = canvasWidth, ymin = canvasHeight,
      xmax = 0, ymax = 0;
    for (var x = 0; x < canvasWidth; x++) {
      for (var y = 0; y < canvasHeight; y++) {
        var pt = KT.Picture.getPoint(x, y);
        if (pt.a > 0) { // is content
          if (x < xmin) {
            xmin = x;
          }
          if (x > xmax) {
            xmax = x;
          }
          if (y < ymin) {
            ymin = y;
          }
          if (y > ymax) {
            ymax = y;
          }
        }
      }
    }

    // *矫正缩放采样导致的1像素差别
    xmin -= Math.min(2, xmin);
    xmax += Math.min(2, canvasWidth - xmax);
    ymin -= Math.min(2, ymin);
    ymax += Math.min(2, canvasHeight - ymax);

    KT.Picture.unbind();
    KT.BufferPool.release(pixelBuffer);
    _box.umin = xmin / canvasWidth;
    _box.umax = xmax / canvasWidth;
    _box.vmin = ymin / canvasHeight;
    _box.vmax = ymax / canvasHeight;
  }

  findMaxMinBox.box = _box;
  KT.Tool.findMaxMinBox = findMaxMinBox;
}());


