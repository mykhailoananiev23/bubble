/**
 * Created by Andrewz on 12/3/2016.
 */

var KT = KT || {};
KT.PostProcess = KT.PostProcess || {};
(function () {
  var subtractMat = null,
    sourceImageTexture = null;
  KT.PostProcess.clean = clean;
  KT.PostProcess.getSourceImage = getSourceImage;
  KT.PostProcess.subtractBackground = subtractBackground;

  function clean() {
    subtractMat = null;
    sourceImageTexture = null;
  }

  function createSubtractMap(srcImage, bkgImage) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        srcImage: {value: srcImage},
        bkgImage: {value: bkgImage}
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId('fs-subtract')
    });
  }

  function getSourceImage() {
    sourceImageTexture = KT.BufferPool.screen2Texture();
  }

  function subtractBackground() {
    state = STATE_SUBTRACT;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!subtractMat) {
      subtractMat = createSubtractMap(sourceImageTexture, lastFrameTexture);
      lastFrameTexture.needsUpdate = true;
      sourceImageTexture.needsUpdate = true;
    } else {
      subtractMat.uniforms.srcImage.value = sourceImageTexture;
      subtractMat.uniforms.bkgImage.value = lastFrameTexture;
    }
    objPostP.material = subtractMat;
    scene.remove(originalObj);
    scene.remove(gPbObj);
    scene.remove(objPostP);
    scene.add(objPostP);
  }
}());
