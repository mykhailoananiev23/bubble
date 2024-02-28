/**
 * Created by Andrewz on 12/5/2016.
 * border refine： 逐个边界点检查， 删除附着的背景。
 * 原理： 只对边界点处理:
 *    * 如果点p在前景， p的一个邻点在背景， 则p是边界点
 *
 */
var KT = KT || {};
KT.PostProcess = KT.PostProcess || {};
(function () {
  KT.PostProcess.BorderRefine = {};
  KT.PostProcess.BorderRefine.despike = despike;
  KT.PostProcess.BorderRefine.peelBkg = peelBkg;
  KT.PostProcess.BorderRefine.closeShape = closeShape;
  var matDespike = null,
    matPeelBkg = null,
    matCloseShape = null;

  function despike() { // 去除毛刺，是 物体的一部分， 但是， 太刺毛
    state = STATE_DESPIKE;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matDespike) {
      matDespike = createMat(lastFrameTexture, 'fs-despike');
    } else {
      matDespike.uniforms.srcImage.value = lastFrameTexture;
    }

    lastFrameTexture.needsUpdate = true;
    objPostP.material = matDespike;
    setupScene(objPostP);
  }

  function peelBkg() {
    state = STATE_PEEL_BKG;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matPeelBkg) {
      matPeelBkg = createMat(lastFrameTexture, 'fs-peelBkg');
    } else {
      matPeelBkg.uniforms.srcImage.value = lastFrameTexture;
    }

    lastFrameTexture.needsUpdate = true;
    objPostP.material = matPeelBkg;
    setupScene(objPostP);
  }

  function closeShape() {
    // 如果是 背景点，判定是内部点的可能性poi，
    //  *  有0个邻点是前景点:  0
    //  *  需要计算距离（才采样）
    state = STATE_CLOSE_SHAPE;
    lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
    if (!matCloseShape) {
      matCloseShape = createMatCloseShape(lastFrameTexture, originalImage);
    } else {
      matCloseShape.uniforms.srcImage.value = lastFrameTexture;
      matCloseShape.uniforms.originalImage.value = originalImage;
    }

    lastFrameTexture.needsUpdate = true;
    originalImage.needsUpdate = true;
    objPostP.material = matCloseShape;
    setupScene(objPostP);
  }

  function createMat(tex, shaderName) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        transparency: {value: 0}, // 0: invisible
        srcImage: {value: tex},
        imgWidth: {value: (tex.image.width)},
        imgHeight: {value: (tex.image.height)},
        bkgRefHisto: {value: leftUpHisto},
        pOfBkgMin: {value: KT.Config.pOfBkgMin},
        pOfBkgMax: {value: KT.Config.pOfBkgMax},
        pOfBkgMaxB: {value: KT.Config.pOfBkgMaxB},
        pOfInMin: {value: KT.Config.pOfInMin},
        pOfInMax: {value: KT.Config.pOfInMax},
        uSampleLength: {value: 1},
        thita: {value: 0} // radians: 0-3.14;
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId(shaderName)
    });
  }

  function createMatCloseShape(tex, originalImage) {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        transparency: {value: 0}, // 0: invisible
        srcImage: {value: tex},
        originalImage: {value: originalImage},
        imgWidth: {value: (tex.image.width)},
        imgHeight: {value: (tex.image.height)},
        bkgRefHisto: {value: leftUpHisto},
        pOfBkgMin: {value: KT.Config.pOfBkgMin},
        pOfBkgMax: {value: KT.Config.pOfBkgMax},
        pOfBkgMaxB: {value: KT.Config.pOfBkgMaxB},
        pOfInMin: {value: KT.Config.pOfInMin},
        pOfInMax: {value: KT.Config.pOfInMax},
        uSampleLength: {value: 1},
        thita: {value: 0} // radians: 0-3.14;
      },
      vertexShader: getShaderByScriptId('vs-original'),
      fragmentShader: getShaderByScriptId('fs-closeShape')
    });
  }
}());
