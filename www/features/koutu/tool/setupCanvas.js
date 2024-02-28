/**
 * Created by Andrewz on 1/21/2017.
 */
var KT = KT || {};
KT.Tool = KT.Tool || {};

(function () {
  function setupCanvas() {
    var box = KT.Tool.findMaxMinBox.box;
    var w = Math.round((box.umax - box.umin) * canvasWidth),
      h = Math.round((box.vmax - box.vmin) * canvasHeight);
    determineCanvasSize2(w, h);
    renderer.setSize(canvasWidth, canvasHeight);
  }

  function determineCanvasSize2(w, h) {
    var MAX_CANVAS_SIZE = getMaxCanvasSize();
    var sx = MAX_CANVAS_SIZE / w,
      sy = MAX_CANVAS_SIZE / h,
      scale = Math.min(sx, sy);
    canvasWidth = Math.floor(w * scale);
    canvasHeight = Math.floor(h * scale);
  }

  KT.Tool.setupCanvas = setupCanvas;
}());


