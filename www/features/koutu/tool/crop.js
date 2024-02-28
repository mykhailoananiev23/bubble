/**
 * Created by Andrewz on 1/20/2017.
 * Crop: 剪切图片， 保留矩形区域(umin, vmin) --( umax, vmax)内的内容
 */

var KT = KT || {};
KT.Tool = KT.Tool || {};
(function () {
  var cropMat = null;
  var _box = {umin: 0, vmin: 0, umax: 1, vmax: 1}; // default 是不剪裁
  function setBox(box) {
    _box = box;
  }

  function crop() {
    // 对于透明图，剪裁原图， 而不是屏幕上的图， 以提高精度
    doCrop(originalImage);
  }

  function cropFromScreen() {// 对于新抠图结果，
    koutuResultTexture.needsUpdate = true;
    doCrop(koutuResultTexture);
  }

  function doCrop(srcImg) {
    setBox(KT.Tool.findMaxMinBox.box);
    state = STATE_FIND_MAX_MIN_BOX;
    var cropResultWidth = Math.round((_box.umax - _box.umin) * srcImg.image.width),
      cropResultHeight = Math.round((_box.vmax - _box.vmin) * srcImg.image.height);
    renderer.setSize(cropResultWidth, cropResultHeight);
    if (!cropMat) {
      cropMat = createMat(srcImg);
    } else {
      updateMat(srcImg);
    }

    originalImage.needsUpdate = true;
    objPostP.material = cropMat;
    setupScene(objPostP);
  }

  function createMat(tex) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        srcImage: {value: tex},
        imgWidth: {value: (tex.image.width)},
        imgHeight: {value: (tex.image.height)},
        umin: {value: _box.umin},
        umax: {value: _box.umax},
        vmin: {value: _box.vmin},
        vmax: {value: _box.vmax}
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId('fs-crop')
    });
  }

  function updateMat(tex) {
    cropMat.uniforms.srcImage.value = tex;
    cropMat.uniforms.imgWidth.value = tex.image.width;
    cropMat.uniforms.imgHeight.value = tex.image.height;
    cropMat.uniforms.umin.value = _box.umin;
    cropMat.uniforms.umax.value = _box.umax;
    cropMat.uniforms.vmin.value = _box.vmin;
    cropMat.uniforms.vmax.value = _box.vmax;
  }

  KT.Tool.crop = crop;
  KT.Tool.cropFromScreen = cropFromScreen;
}());
