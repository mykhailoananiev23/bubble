/**
 * Created by Andrewz on 11/27/2016.
 * 把当前画面（RGB） 转化为CIElab编码，并且分别以RGB字节来存储改进的CIElab的L,A,B
 * 标准的CIELab值:
 // L (lightness):  0 to 100
 // a* and b* (color attributes):  -128 to +127
 // 改进的CIELab取值都在[0, 255](读出来的数字)，或[0,1](在fs输出的值)，以便于用RGB存储它
 CIE_L = CIE_L /100.0 * 255.0;
 CIE_a = CIE_a + 128.0;
 CIE_b = CIE_b + 128.0;
 * 公式见： http://www.easyrgb.com/index.php?X=MATH&H=08#text8
 * RGB==> XYZ ==> CIELab
 * CIELab ==> XYZ ==>RGB
 * 标准取值范围：
 *   RGB: 都是[0, 255]
 *   CIELab: L: [0, 100], a,b: [-128, 127]
 *   XYZ: X: [0, 95.047], Y: [0, 100], Z: [0, 108.883]
 */

var KT = KT || {};
KT.Conversion = KT.Conversion || {};
(function() {
  var matRgb2CieLab = null;
  function rgb2CieLab() {
    state = STATE_RGB_2_CIELAB;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matRgb2CieLab) {
      matRgb2CieLab = createMat(lastFrameTexture);
    } else {
      matRgb2CieLab.uniforms.srcImage.value = lastFrameTexture;
    }

    lastFrameTexture.needsUpdate = true;
    objPostP.material = matRgb2CieLab;
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
      fragmentShader: getShaderByScriptId('fs-rgb2CieLab')
    });
  }

  KT.Conversion.rgb2CieLab = rgb2CieLab;
}());
