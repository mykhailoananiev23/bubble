/**
 * Created by Andrewz on 12/3/2016.
 * 均值滤波：去除噪声，还保留边界
 */

var KT = KT || {};
KT.PostProcess = KT.PostProcess || {};
(function () {
  var matMedian = null;

  function medianDenoise() {
    // 假设屏幕上是 改进的CIELab格式的图
    state = STATE_MEDIAN;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matMedian) {
      matMedian = createMat(lastFrameTexture);
    } else {
      matMedian.uniforms.srcImage.value = lastFrameTexture;
    }

    lastFrameTexture.needsUpdate = true;
    objPostP.material = matMedian;
    scene.remove(gPbObj);
    scene.remove(originalObj);
    scene.remove(objPostP);
    scene.add(objPostP);
  }

  function createMat(tex) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        srcImage: {value: tex},
        imgWidth: {value: (tex.image.width)},
        imgHeight: {value: (tex.image.height)},
        uSampleLength: {value: 1},
        thita: {value: 0} // radians: 0-3.14;
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId('fs-median')
    });
  }

  KT.PostProcess.medianDenoise = medianDenoise;
}());
