/**
 * Created by Andrewz on 12/5/2016.
 * 通过 合并 gpbTexture和第一次抽取的物体的mask， 形成新的mask，
 * 以利用Gpb图的边缘
 */
var KT = KT || {};
KT.PostProcess = KT.PostProcess || {};
(function () {
  KT.PostProcess.genMask = genMask;
  KT.PostProcess.applyMask = applyMask;
  var matGenMask = null,
    matApplyMask = null,
    withGpbTexture = 0;

  function applyMask() {
    state = STATE_APPLY_MASK;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matApplyMask) {
      matApplyMask = createMaskMat(lastFrameTexture, originalImage);
    } else {
      matApplyMask.uniforms.srcImage.value = originalImage;
      matApplyMask.uniforms.maskImage.value = lastFrameTexture;
    }

    originalImage.needsUpdate = true;
    lastFrameTexture.needsUpdate = true;
    objPostP.material = matApplyMask;
    setupScene(objPostP);
  }

  function genMask() {
    state = STATE_GEN_MASK;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matGenMask) {
      matGenMask = createMat(gpbTexture, lastFrameTexture);
    } else {
      matGenMask.uniforms.srcImage.value = lastFrameTexture;
      if (withGpbTexture) {
        matGenMask.uniforms.mask1Image.value = gpbTexture;
      }
    }

    if (withGpbTexture) {
      gpbTexture.needsUpdate = true;
    }
    lastFrameTexture.needsUpdate = true;
    objPostP.material = matGenMask;
    setupScene(objPostP);
  }

  function createMat(mask1Image, tex) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        withGpbTexture: {value: withGpbTexture},//不需要gpbTexture
        mask1Image: {value: mask1Image},
        srcImage: {value: tex}
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId('fs-genMask')
    });
  }

  function createMaskMat(maskImage, tex) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        maskImage: {value: maskImage},
        srcImage: {value: tex}
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId('fs-applyMask')
    });
  }
}());
