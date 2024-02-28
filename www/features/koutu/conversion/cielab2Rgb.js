/**
 * Created by Andrewz on 11/27/2016.
 * 把当前画面（CIELab） 转化为RGB编码
 * 公式见： rgb2CieLab
 */

var KT = KT || {};
KT.Conversion = KT.Conversion || {};
(function () {
  var matCieLab2Rgb = null;

  function cieLab2Rgb() {
    state = STATE_CIELAB_2_RGB;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matCieLab2Rgb) {
      matCieLab2Rgb = createMat(lastFrameTexture);
    } else {
      matCieLab2Rgb.uniforms.srcImage.value = lastFrameTexture;
    }

    lastFrameTexture.needsUpdate = true;
    objPostP.material = matCieLab2Rgb;
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
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId('fs-cieLab2Rgb')
    });
  }

  KT.Conversion.cieLab2Rgb = cieLab2Rgb;
}());
