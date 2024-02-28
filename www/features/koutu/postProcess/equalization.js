/**
 * Created by Andrewz on 11/27/2016.
 * 图像后处理：Equalization, 直方图均衡化
 * * 通过扩展图像直方图histogram的范围，让累计分布函数成为直线f(i) = i * K，
 * ** 增强图像的细节和对比度，
 * ** 适合于 曝光不足，对比度小，反差小，的图像
 * 详见： https://zh.wikipedia.org/wiki/直方图均衡化
 *    改进： 直方图都是事先规范化到[0,1], 最大值肯定是1， 但是，最小值不一定是0
 *    灰度级L=256
 *    ==> 新灰度的公式为： h(v) = (f(x) -fmin)/(fmax - fmin) * 255;
 *    ==> 规范到[0,1]:    h(v) = (f(x) -fmin)/(fmax - fmin);
 *
 * 要求： 图像在处理前和后必须是CIELab的格式显示，（不是RGB），
 */

var KT = KT || {};
KT.PostProcess = KT.PostProcess || {};
(function () {
  var matEqualization = null;

  function equalization(channelAmount) {
    // 假设屏幕上是 改进的CIELab格式的图
    state = STATE_EQUALIZATION;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    var cdf = KT.Helper.getCdf(lastFrameTexture.image.data);
    if (!matEqualization) {
      matEqualization = createMat(lastFrameTexture, cdf.cdf, cdf.cdfMin);
    } else {
      matEqualization.uniforms.srcImage.value = lastFrameTexture;
    }

    matEqualization.uniforms.lumOnly.value = (channelAmount !== 3) ? 1 : 0;

    lastFrameTexture.needsUpdate = true;
    objPostP.material = matEqualization;
    scene.remove(gPbObj);
    scene.remove(originalObj);
    scene.remove(objPostP);
    scene.add(objPostP);
  }

  function equalization3() {
    equalization(3);
  }

  function createMat(tex, cdf, cdfMin) {
    // cdf: cumulative distribution function
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        srcImage: {value: tex},
        cdf: {value: cdf},
        cdfMin: {value: cdfMin},
        lumOnly: {value: 1}, // 对L A B都做均衡化， 以最大化gpb值， 但是， 视觉上有失真)
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId('fs-equalize')
    });
  }

  KT.PostProcess.equalization = equalization;
  KT.PostProcess.equalization3 = equalization3;
}());
