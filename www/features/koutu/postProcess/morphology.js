/**
 * Created by Andrewz on 12/6/2016.
腐蚀: 消除边界点，使边界向内部收缩的过程, 消除小且无意义的物体。

 将 结构元素与其覆盖的二值图像做“与”操作，
 如果都为1，结果图像的该像素为1。否则为0。 （有 0 出 0）

膨胀：是将与物体接触的所有背景点合并到该物体中，
 使边界向外部扩张的过程。可以用来填补物体中的空洞。

 将 结构元素与其覆盖的二值图像做“与”操作，
 如果都为0，结果图像的该像素为0。否则为1。  （有 1 出 1）

 3. 开运算: 先腐蚀, 后膨胀。用来消除小物体、在纤细点处分离物体、平滑较大物体的边界的同时并不明显改变其面积。
 4. 闭运算: 先膨胀，后腐蚀。用来填充物体内细小空洞、连接邻近物体、平滑其边界的同时并不明显改变其面积。
 * http://blog.csdn.net/bagboy_taobao_com/article/details/5574159
 */

var KT = KT || {};
KT.PostProcess = KT.PostProcess || {};
(function () {
  KT.PostProcess.Morph = {};
  KT.PostProcess.Morph.erosion = erosion;
  KT.PostProcess.Morph.dilation = dilation;
  var matErosion = null,
    matDilation = null;
  function erosion() {
    state = STATE_EROSION;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matErosion) {
      matErosion = createMat(lastFrameTexture, 'fs-erosion');
    } else {
      matErosion.uniforms.srcImage.value = lastFrameTexture;
    }

    lastFrameTexture.needsUpdate = true;
    objPostP.material = matErosion;
    setupScene(objPostP);
  }

  function dilation() {
    state = STATE_DILATION;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matDilation) {
      matDilation = createMat(lastFrameTexture, 'fs-dilation');
    } else {
      matDilation.uniforms.srcImage.value = lastFrameTexture;
    }

    lastFrameTexture.needsUpdate = true;
    objPostP.material = matDilation;
    setupScene(objPostP);
  }

  function createMat(tex, fsShaderName) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        srcImage: {value: tex},
        imgWidth: {value: (tex.image.width)},
        imgHeight: {value: (tex.image.height)},
        uSampleLength: {value: 1},
        thita: {value: 0}, // radians: 0-3.14;
        kernalSize: {value: 5}
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId(fsShaderName)
    });
  }
}());
