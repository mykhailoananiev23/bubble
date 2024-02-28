/**
 * Created by Andrewz on 12/4/2016.
 * 阈值：去除噪声，还保留边界， 而且不模糊
 */

var KT = KT || {};
KT.PostProcess = KT.PostProcess || {};
(function () {
  KT.PostProcess.thresholdDenoise = thresholdDenoise;
  KT.PostProcess.thresholdDenoise10p = thresholdDenoise10p; // 3 percent
  KT.PostProcess.thresholdDenoise30p = thresholdDenoise30p; // 3 percent
  KT.PostProcess.thresholdDenoise50p = thresholdDenoise50p;
  var matThreshold = null;

  function thresholdDenoise(threshold) {
    if (!threshold) {
      threshold = KT.Config.gpbThreshold;
    }
    // 假设屏幕上是 改进的CIELab格式的图
    state = STATE_THRESHOLD;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matThreshold) {
      matThreshold = createMat(lastFrameTexture, threshold);
    } else {
      matThreshold.uniforms.srcImage.value = lastFrameTexture;
      matThreshold.uniforms.threshold.value = threshold;
    }

    lastFrameTexture.needsUpdate = true;
    objPostP.material = matThreshold;
    scene.remove(gPbObj);
    scene.remove(originalObj);
    scene.remove(objPostP);
    scene.add(objPostP);
  }

  function thresholdDenoise10p() {
    thresholdDenoise(0.1)
  }

  function thresholdDenoise30p() {
    thresholdDenoise(0.3)
  }

  function thresholdDenoise50p() {
    thresholdDenoise(0.5)
  }

  function createMat(tex, threshold) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        threshold: {value: threshold},
        srcImage: {value: tex},
        imgWidth: {value: (tex.image.width)},
        imgHeight: {value: (tex.image.height)},
        uSampleLength: {value: 1},
        thita: {value: 0} // radians: 0-3.14;
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId('fs-threshold')
    });
  }
}());
