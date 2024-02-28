/**
 * Created by Andrewz on 9/26/2016.
 */

var MAX_REGION_AMOUNT = 600;
var ANGULE_RES = 18; // 必须是双数， 以便于确定统计和的renderTarget

var STATE_SMOOTH_TEXTURE = 2,
  STATE_ORIGINAL = 1,
  STATE_VISUALIZE_BUFFER = 1001,
  STATE_RGB_2_CIELAB = 2001,
  STATE_CIELAB_2_RGB = 2002,
  STATE_EQUALIZATION = 2003,
  STATE_SUBTRACT = 2004,
  STATE_MEDIAN = 2005,
  STATE_THRESHOLD = 2006,
  STATE_GEN_MASK = 2007,
  STATE_APPLY_MASK = 2008,
  STATE_PEEL_BKG = 2009,
  STATE_CLOSE_SHAPE = 2010,
  STATE_EROSION = 2010,
  STATE_DILATION = 2011,
  STATE_DESPIKE = 2012,
  STATE_FIND_MAX_MIN_BOX = 2013,
  STATE_CROP = 2014,
  STATE_MAKE_GPB = 5,
  STATE_GPB_RESULT = 6,
  STATE_NORMALIZE_GPB = 7,
  STATE_MASK = 8,
  STATE_LEFT_UP_HISTO = 9,
  STATE_RIGHT_UP_HISTO = 10,
  STATE_FIND_BKG_SEED2 = 11,
  STATE_FIND_BKG_SEED3_UPDATE = 1101,
  STATE_ALL_BKG = 12,
  STATE_THE_END = 99;

var BKG_ALPHA_THRESHOLD = 250;

var state = STATE_ORIGINAL,
  isStopped = true;

var container;
var camera, scene, scenePostP, renderer;
var originalImage, smoothTexture, gpbTexture, regionTexture, lastFrameTexture,
  koutuResultTexture;
var renderTarget1 = null,
  renderTarget2 = null,
  objPostP = null;

var materialOriginal,
  materialNormalize,
  materialErosion,
  materialConnectivity,
  maskMaterial,
  gPbMaterial,
  gGaussianMaterialHV;
var postProcessCounter = 1,
  connectivity = null,
  oldConnectivity = null;
var originalObj,
  gPbObj;

var canvasWidth = window.innerWidth, // 512,
  canvasHeight = window.innerHeight; // 512;

var leftUpHisto,
  rightUpHisto,
  bkgThreshold,
  bkgSeed1L = [],
  bkgSeed1R = [],
  bkgSeedAll = [];

var onSuccessCallback = null,
  onFailCallback = null;

var angleId = 0;
var maxTexture = 0;
var gpbDataReady = false;
var cleaned = 0;

var gaussianBlurKernal = [
  0.045, 0.122, 0.045,
  0.122, 0.332, 0.122,
  0.045, 0.122, 0.045
];

// temporal
var gpbRendered = false;

function reset() {
  BKG_ALPHA_THRESHOLD = 250;
  state = STATE_ORIGINAL;
  isStopped = true;
  container = null;
  camera = null;
  scene = null;
  scenePostP = null;
  renderer = null;
  originalImage = null;
  smoothTexture = null;
  koutuResultTexture = null;
  gpbTexture = null;
  regionTexture = null;
  lastFrameTexture = null;
  renderTarget1 = null;
  renderTarget2 = null;
  objPostP = null;

  materialOriginal = null;
  materialNormalize = null;
  materialErosion = null;
  materialConnectivity = null;
  maskMaterial = null;
  gPbMaterial = null;
  gGaussianMaterialHV = null;
  postProcessCounter = 1;
  connectivity = null;
  oldConnectivity = null;
  originalObj = null;
  gPbObj = null;

  canvasWidth = window.innerWidth; // 512,
  canvasHeight = window.innerHeight;

  leftUpHisto = null;
  rightUpHisto = null;
  bkgThreshold = null;
  bkgSeed1L = [];
  bkgSeed1R = [];
  bkgSeedAll = [];
  onSuccessCallback = null;
  onFailCallback = null;
  angleId = 0;
  maxTexture = 0;
  gpbDataReady = false;
  cleaned = 0;

  if (container) {
    container.style.display = 'block';
  }
  KT.State.init();
  KT.Region.init();
  KT.Tool.resetDom();
}

function createElement(parent, tag, id, eleClass) {
  var ele = document.createElement(tag);
  ele.setAttribute('id', id);
  ele.style.visibility = 'visible';

  if (eleClass) {
    ele.className = eleClass;
  }

  if (parent) {
    parent.appendChild(ele);
  }

  return ele;
}
function getMaxCanvasSize() {
  var MAX_CANVAS_SIZE = 256;
  if (!!KT.Config.matType) {
    switch (KT.Config.matType) {
      case 10 : // BKG: 10
        MAX_CANVAS_SIZE = 512;
        break;
      case 20 : // Prop
      case 30 : // People
      default :
        MAX_CANVAS_SIZE = 256;
        break;
    }
  }
  return MAX_CANVAS_SIZE;
}

function determineCavasSize(texture) {
  var MAX_CANVAS_SIZE = getMaxCanvasSize();
  var sx = texture.image.width / MAX_CANVAS_SIZE,
    sy = texture.image.height / MAX_CANVAS_SIZE,
    scale = Math.max(sx, sy);
  scale = Math.ceil(scale);
  canvasHeight = Math.round(texture.image.height / scale);
  canvasWidth = Math.round(texture.image.width / scale);
  KT.Picture.init(canvasWidth, canvasHeight);
}

function onLoaded() {
  if (!originalImage) {
    console.log("no image found!");
    return;
  }
  determineCavasSize(originalImage);
  camera = createCamera();
  renderer = createRender();
  if (!KT.Config.diableWindowResize) {
    window.addEventListener('resize', onWindowResize, false);
  }
  KT.BufferPool.init(canvasWidth, canvasHeight, renderer);
  KT.Selector.init(renderer, canvasHeight);
  KT.Picture.init(canvasWidth, canvasHeight);

  scene = createScene();
  initGaussian();
  isStopped = false;
  animate();
  var tasks;
  if (KT.Config.rescaleOnly) { // 只去除周边空白
    tasks = [{fn: toOriginal},
      {fn: KT.Tool.findMaxMinBox},
      {fn: KT.Tool.setupCanvas},
      {fn: KT.Tool.crop},
      {fn: insertResult},
      {fn: theEnd}];
  } else if (!KT.Tool.isSupported()) {
    if (TQ && TQ.MessageBox && TQ.MessageBox.toast) {
      TQ.MessageBox.toast("This device do not meet the minimum requirement!");
    }
  } else { // 抠图，并且去周边空白
    tasks = [{fn: toOriginal},
      {fn: KT.PostProcess.medianDenoise},
      {fn: KT.PostProcess.medianDenoise, after: KT.PostProcess.getSourceImage},
      {fn: toSmoothTexture, after: restoreState},
      // {fn: KT.Conversion.rgb2CieLab, after: KT.PostProcess.getSourceImage},
      {fn: toSmoothTexture, after: restoreState},
      {fn: toSmoothTexture, after: restoreState},
      {fn: toSmoothTexture, after: restoreState},
      {fn: toSmoothTexture, after: restoreState},
      {fn: toSmoothTexture, after: restoreState},
      // {fn: KT.SequenceMgr.pause},
      //       {fn: KT.PostProcess.subtractBackground, after: KT.PostProcess.clean},
      // {fn: KT.Conversion.cieLab2Rgb},
      // ToDo: 硬件, OK
      {fn: KT.PostProcess.equalization}, // equalization 会引入额外的阴影， 不如Normalization
      {fn: KT.PostProcess.medianDenoise},
      {fn: toSmoothTexture, after: restoreState},
      {fn: getSmoothTexture},
      {fn: toGpb},  //ToDo:硬件
      // {fn: KT.SequenceMgr.pause},
      {fn: KT.PostProcess.medianDenoise},
      {fn: toSmoothTexture, after: restoreState},
      //{fn: KT.PostProcess.equalization},
      {fn: toNormalizeGpb}, //ToDo:硬件
      {fn: KT.PostProcess.thresholdDenoise10p},
      {fn: toSmoothTexture, after: restoreState},
      {fn: composeRegion}, //ToDo:硬件
      // {fn: KT.SequenceMgr.pause},
      //       {fn: toMask},
      {fn: toLeftUpHisto},
      {fn: toRightUpHisto},
      {fn: toBkgSeed2},

      //{fn: KT.SequenceMgr.pause},
      //{fn: toGpb},  //ToDo:硬件
      //{fn: KT.PostProcess.medianDenoise},
      //{fn: toNormalizeGpb}, //ToDo:硬件
      // {fn: toMask},
      // {fn: KT.SequenceMgr.pause},
      {fn: toAllBkg},  //ToDo:硬件

      // 对结果做后处理：
      {fn: KT.PostProcess.Morph.erosion}, // 去除毛刺边
      {fn: KT.PostProcess.Morph.dilation},
      {fn: KT.PostProcess.genMask},
      {fn: KT.PostProcess.applyMask},

      // 剥离背景之前，先去除毛刺
      {fn: KT.PostProcess.BorderRefine.peelBkg}, // 修边前后，不能使用中值滤波，否则修边完全失效
      {fn: KT.PostProcess.Morph.dilation},
      {fn: KT.PostProcess.Morph.erosion},
      {fn: KT.PostProcess.genMask},
      {fn: KT.PostProcess.applyMask},

      {fn: KT.PostProcess.BorderRefine.peelBkg}, // 修边前后，不能使用中值滤波，否则修边完全失效
      {fn: KT.PostProcess.Morph.dilation},
      {fn: KT.PostProcess.Morph.erosion},
      {fn: KT.PostProcess.genMask},
      {fn: KT.PostProcess.applyMask},

      {fn: KT.PostProcess.BorderRefine.peelBkg}, // 修边前后，不能使用中值滤波，否则修边完全失效
      {fn: KT.PostProcess.Morph.dilation},
      {fn: KT.PostProcess.Morph.erosion},
      {fn: KT.PostProcess.genMask},
      {fn: KT.PostProcess.applyMask},

      {fn: KT.PostProcess.BorderRefine.peelBkg}, // 修边前后，不能使用中值滤波，否则修边完全失效
      {fn: KT.PostProcess.Morph.dilation},
      {fn: KT.PostProcess.Morph.erosion},
      {fn: KT.PostProcess.genMask},
      {fn: KT.PostProcess.applyMask},

      {fn: KT.PostProcess.BorderRefine.peelBkg}, // 修边前后，不能使用中值滤波，否则修边完全失效
      {fn: KT.PostProcess.Morph.dilation},
      {fn: KT.PostProcess.Morph.erosion},
      {fn: KT.PostProcess.genMask},
      {fn: KT.PostProcess.applyMask},

      {fn: KT.PostProcess.BorderRefine.closeShape},
      {fn: KT.PostProcess.Morph.dilation},
      {fn: KT.PostProcess.Morph.erosion},
      {fn: KT.PostProcess.genMask},
      {fn: KT.PostProcess.applyMask},

      {fn: KT.PostProcess.BorderRefine.peelBkg}, // 修边前后，不能使用中值滤波，否则修边完全失效
      {fn: KT.PostProcess.Morph.dilation},
      {fn: KT.PostProcess.Morph.erosion},
      {fn: KT.PostProcess.genMask},
      {fn: KT.PostProcess.applyMask},

      {fn: KT.PostProcess.BorderRefine.peelBkg}, // 修边前后，不能使用中值滤波，否则修边完全失效
      {fn: KT.PostProcess.Morph.dilation},
      {fn: KT.PostProcess.Morph.erosion},
      {fn: KT.PostProcess.genMask},
      {fn: KT.PostProcess.applyMask},
      {fn: KT.PostProcess.BorderRefine.despike},


      // for rescale begin
      {fn: getKoutuResultTexture},
      {fn: KT.Tool.findMaxMinBox},
      {fn: KT.Tool.setupCanvas},
      {fn: KT.Tool.cropFromScreen},
      // for rescale end

      //{fn: KT.SequenceMgr.pause},
      {fn: insertResult},
      // {fn: visualizeBuffer},
      {fn: theEnd},
      // {fn:toOriginal}
    ];
  }
  KT.SequenceMgr.start(tasks);
}

function koutuMain(url, matType, onSuccess, onFail) {
  if (!Detector.webgl) { // 此设备不支持webGL
    Detector.addGetWebGLMessage();
    if (!!onSuccess) {
      container.style.display = 'none';
      onSuccess(url);
    }
    return;
  }

  reset();
  KT.Config.matType = matType;
  onSuccessCallback = onSuccess;
  onFailCallback = onFail;
  originalImage = KT.TestData.loadTextures(url);
}

function animate() {
  if (isStopped) {
    return;
  }

  requestAnimationFrame(animate);
  render();
  sceneUpdate();
}

function updateGpbMaker() {
  console.log(new Date().toLocaleString(), "update Gpb maker, angleId = ", angleId);
  if (gpbRendered) {
    maxTexture = KT.BufferPool.screen2Texture(maxTexture);
  }

  if (maxTexture != null) {
    maxTexture.needsUpdate = true; //@@ 重要， 必须从texture, material，mesh, 必须明确要求update
    gPbMaterial.uniforms.maxTexture.value = maxTexture;
    gPbMaterial.uniforms.hasMaxTexture.value = 1;
  } else {
    gPbMaterial.uniforms.hasMaxTexture.value = 0;
  }

  gPbMaterial.uniforms.thita.value = angleId * 3.14159265 / ANGULE_RES;
  gPbMaterial.needsUpdate = true;
  if (angleId >= ANGULE_RES) {
    gpbDataReady = true;
  }
  angleId += 1;
  gpbRendered = false;
}

function renderGPb() {
  renderer.render(scene, camera);
  gpbRendered = true;
  // updateGpbMaker();
  // now, i = ANGULE_RES, 1%2 是 1，result in gPbTexture中
}

function render() {
  if (state === STATE_THE_END) {
    return;
  }
  if ((state === STATE_MAKE_GPB) && (!gpbDataReady)) {
    return renderGPb();
  }

  if (state === STATE_SMOOTH_TEXTURE) {
    gGaussianMaterialHV.uniforms.srcImage.value = lastFrameTexture;
    gGaussianMaterialHV.uniforms.alphaOnly.value =
            (state === STATE_ALL_BKG) ? 1 : 0;
    gGaussianMaterialHV.needsUpdate = true;
    gGaussianMaterialHV.uniforms.direction.value = [1, 0];
    renderer.render(scenePostP, camera, renderTarget2, true);

    gGaussianMaterialHV.uniforms.srcImage.value = renderTarget2.texture;
    gGaussianMaterialHV.uniforms.direction.value = [0, 1];
    gGaussianMaterialHV.needsUpdate = true;
    renderer.render(scenePostP, camera); // H and V result
  } else if (state === STATE_ALL_BKG) {
    if (KT.State.connectivityOn) {
      if (postProcessCounter < 2) {
        renderer.render(scene, camera, renderTarget1, true);
      } else {
        renderer.render(scenePostP, camera, renderTarget1, true);
      }
      postProcessCounter++;

      if (!materialConnectivity) {
        materialConnectivity = createMaterialConnectivity(renderTarget1);
      } else {
        materialConnectivity.uniforms.srcImage.value = renderTarget1.texture;
      }
      objPostP.material = materialConnectivity;
      materialConnectivity.uniforms.srcImage.needsUpdate = true;
      materialConnectivity.needsUpdate = true;
      renderer.render(scenePostP, camera); // H and V result
    } else {
      renderer.render(scene, camera);
    }
  } else {
    renderer.render(scene, camera);
  }
}

function sceneUpdate() {
  if (KT.SequenceMgr.isPaused()) {
    KT.SequenceMgr.updateCounter ++;
    if (KT.SequenceMgr.updateCounter > 3) {
      KT.SequenceMgr.toNext();
    }
    return;
  }

  switch (state) {
    case STATE_THE_END:
      return;

    case STATE_MAKE_GPB:
      if (gpbDataReady) {
        toGpbResult();
      } else {
        updateGpbMaker();
      }
      break;

    case STATE_GPB_RESULT:
      KT.SequenceMgr.toNext();
      break;

    case STATE_NORMALIZE_GPB:
    case STATE_MASK:
      if (KT.SequenceMgr.updateCounter > 3) {
        KT.SequenceMgr.toNext();
      }
      break;

    case STATE_LEFT_UP_HISTO:
      if (KT.SequenceMgr.updateCounter > 3) {
        leftUpHisto = calculateHisto();
        KT.SequenceMgr.toNext();
      }
      break;

    case STATE_RIGHT_UP_HISTO:
      if (KT.SequenceMgr.updateCounter > 3) {
        rightUpHisto = calculateHisto();
        bkgThreshold = determineBkgThreshold();
        KT.SequenceMgr.toNext();
      }
      break;
    case STATE_FIND_BKG_SEED2:
      if (KT.SequenceMgr.updateCounter > 3) {
        mergeBkgSeed1();
        refineBkgSeed();
        KT.SequenceMgr.toNext();
      }
      break;
    case STATE_FIND_BKG_SEED3_UPDATE:
      if (KT.SequenceMgr.updateCounter > 3) {
        refineBkgSeed();
        KT.SequenceMgr.toNext();
      }
      break;
    case STATE_ALL_BKG:
      if (cleanBorder() > 0) {
        KT.SequenceMgr.updateCounter = 0;
      }
      if (KT.State.connectivityOn) {
        if (postProcessCounter > 1) {
          if (!!regionTexture) {
            connectivity = KT.Helper.countConnectivity(regionTexture.image.data);
            KT.BufferPool.releaseTexture(regionTexture);
          }
          if (!connectivity || !KT.Helper.isEqual(connectivity, oldConnectivity)) {
            oldConnectivity = connectivity;
            regionTexture = KT.BufferPool.screen2Texture();
            regionTexture.needsUpdate = true; //@@ 重要， 必须从texture, material，mesh, 必须明确要求update
            materialConnectivity.uniforms.srcImage.value = regionTexture;
            materialConnectivity.uniforms.srcImage.value.needsUpdate = true;
            materialConnectivity.uniforms.srcImage.needsUpdate = true;
            materialConnectivity.needsUpdate = true;
          } else {
            KT.SequenceMgr.toNext();
          }
        }
      } else {
        if (KT.SequenceMgr.updateCounter > 3) {
          KT.SequenceMgr.toNext();
        }
      }
      break;
    default:
      if (KT.SequenceMgr.updateCounter > 3) {
        KT.SequenceMgr.toNext();
      }

      break;
  }
  KT.SequenceMgr.updateCounter++;
}

function calculateHisto() {
  var pixelBuffer = KT.BufferPool.readPixels();
  var histo = KT.Helper.sort256RGBBins(pixelBuffer);
  KT.BufferPool.release(pixelBuffer);
  return histo;
}

function determineBkgThreshold() {
  var i3,
    x2 = [0.0, 0.0, 0.0],
    diff,
    base;

  for (i = 0; i < 256; i++) {
    i3 = i * 3;
    diff = leftUpHisto[i3] - rightUpHisto[i3];
    base = leftUpHisto[i3] + rightUpHisto[i3];
    if (base > 0.0001) {
      x2[0] += diff * diff / base;
    }

    i3 = i3 + 1;
    diff = leftUpHisto[i3] - rightUpHisto[i3];
    base = leftUpHisto[i3] + rightUpHisto[i3];
    if (base > 0.0001) {
      x2[1] += diff * diff / base;
    }

    i3 = i3 + 1;
    diff = leftUpHisto[i3] - rightUpHisto[i3];
    base = leftUpHisto[i3] + rightUpHisto[i3];
    if (base > 0.0001) {
      x2[2] += diff * diff / base;
    }
  }
  for (i = 0; i < 3; i++) {
    x2[i] /= 255;
    if (x2[i] < KT.Config.bkgThreshodMin) {
      x2[i] = KT.Config.bkgThreshodMin;
    }
  }
  return x2;
}

function onWindowResize() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  // 274 * 349
  console.log(canvasWidth, canvasHeight);
  camera.aspect = canvasWidth / canvasHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvasWidth, canvasHeight);
}

function getShaderByScriptId(id) {
  return shaderLib[id];
}

function createScene() {
  var scene = new THREE.Scene();
  ///  scene.background = new THREE.Color(0x000000);
  originalObj = createOriginalObject();
  gPbObj = createGpbObject();
  scene.add(originalObj);
  return scene;
}

function createMashMaterial(regionImage) {
  originalImage.minFilter = THREE.LinearFilter;
  originalImage.magFilter = THREE.NearestFilter;
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      transparency: {value: 0}, // 0: invisible
      alphaSelected: {value: 1.0},  // 一般情况下， 突出前景, 只有在已经背景剪切的时候， 才反之
      alphaNotSelected: {value: 0.0},
      regionId: {value: 6},
      regions: {value: [2]},
      realRegionAmount: {value: 1},
      srcImage: {value: originalImage},
      regionImage: {value: regionImage},
      visualizeRegionOn: {value: 0},
      imgWidth: {value: (originalImage.image.width * 1.0)},
      imgHeight: {value: (originalImage.image.height * 1.0)}
    },
    vertexShader: getShaderByScriptId('vs-original'),
    fragmentShader: getShaderByScriptId('fs-mask')
  });
}

function createOriginalObject() {
  var quad;
  originalImage.minFilter = THREE.LinearFilter;
  originalImage.magFilter = THREE.NearestFilter;
  materialOriginal = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      u_kernel: {value: gaussianBlurKernal},
      srcImage: {value: originalImage},
      imgWidth: {value: (originalImage.image.width * 1.0)},
      imgHeight: {value: (originalImage.image.height * 1.0)}
    },
    vertexShader: getShaderByScriptId('vs-original'),
    fragmentShader: getShaderByScriptId('fs-original')
    // fragmentShader: getShaderByScriptId('fs-gpb')
  });

  var plane = new THREE.PlaneBufferGeometry(canvasWidth, canvasHeight);
  quad = new THREE.Mesh(plane, materialOriginal);
  quad.position.z = -100;
  return quad;
}

function createGpbObject() {
  var quad;

  // texture = new THREE.TextureLoader().load("../textures/flower3B.png", onLoaded);
  // texture = new THREE.TextureLoader().load("../textures/flower2A.png", onLoaded);
  // texture = new THREE.TextureLoader().load("../textures/flower1.jpg", onLoaded);
  originalImage.minFilter = THREE.LinearFilter;
  originalImage.magFilter = THREE.NearestFilter;
  gPbMaterial = new THREE.ShaderMaterial({
    uniforms: {
      srcImage: {value: originalImage},
      maxTexture: {value: null},
      uSampleLength: {value: 1},
      useRGBColor: {value: 1},
      thita: {value: 0}, // radians: 0-3.14;
      hasMaxTexture: {value: 0}, // radians: 0-3.14, in freament shader, 为什么一定要重复写一遍才有效？
      imgWidth: {value: (originalImage.image.width)},
      imgHeight: {value: (originalImage.image.height)}
    },
    vertexShader: getShaderByScriptId('vs-original'),
    fragmentShader: getShaderByScriptId('fs-gpb')
  });

  var plane = new THREE.PlaneBufferGeometry(canvasWidth, canvasHeight);
  quad = new THREE.Mesh(plane, gPbMaterial);
  quad.position.z = -100;
  return quad;
}

function createBkgMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      srcImage: {value: originalImage},
      bkgRefHisto: {value: leftUpHisto},
      pOfBkgMax: {value: KT.Config.pOfBkgMax},
      uSampleLength: {value: 1},
      useRGBColor: {value: 1},
      imgWidth: {value: (originalImage.image.width * 1.0)},
      imgHeight: {value: (originalImage.image.height * 1.0)}
    },
    vertexShader: getShaderByScriptId('vs-original'),
    fragmentShader: getShaderByScriptId('fs-bkg')
  });
}

function createMaterialNormalize(texture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      srcImage: {value: texture},
      minGrey: {value: 0.0},
      maxGrey: {value: 1.0}
    },
    vertexShader: getShaderByScriptId('vs-original'),
    fragmentShader: getShaderByScriptId('fs-normalize')
  });
}

function createMaterialConnectivity(renderTarget) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      srcImage: {value: renderTarget.texture},
      imgWidth: {value: renderTarget.width},
      imgHeight: {value: renderTarget.height},
      kernalSize: {value: 300}
    },
    vertexShader: getShaderByScriptId('vs-original'),
    fragmentShader: getShaderByScriptId('fs-connectivity')
  });
}

function createRender() {
  container = createElement(document.body, 'div', 'id-container', "full-screen top-layer");
  if (KT.State.debugModeOn) {
    container.style.visibility = 'visible';
    container.style.display = 'block';
  } else {
    container.style.visibility = 'hidden';
    container.style.display = 'none';
  }
  renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, antialias: true, alpha: true});
  // renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvasWidth, canvasHeight);
  renderer.setClearColor(0x000000, 0); // 清屏幕为全黑，alpha为0
  container.appendChild(renderer.domElement);
  return renderer;
}
function createCamera() {
  camera = new THREE.OrthographicCamera(canvasWidth / -2, canvasWidth / 2, canvasHeight / 2, canvasHeight / -2, -10000, 10000);
  camera.position.z = 900;

  return camera;
}

function composeRegion() {
  if (!!maxTexture) {
    KT.BufferPool.releaseTexture(maxTexture);
  }

  gpbTexture = KT.BufferPool.screen2Texture();
  var gpbPixels2RegionId = KT.BufferPool.readPixels();
  KT.Picture.bind(gpbPixels2RegionId, canvasWidth, canvasHeight);
  KT.Selector.onChange = onSelect;
  var regionImage = new THREE.DataTexture(gpbPixels2RegionId, canvasWidth, canvasHeight, THREE.RGBAFormat);
  regionImage.needsUpdate = true;
  maskMaterial = createMashMaterial(regionImage);
  KT.watershed.start(gpbPixels2RegionId);
}

function checkValue(pixels) {
  var count = 0;
  console.log('------------------');
  for (i = 0; i < 10000; i++) {
    var i4 = i * 4;
    if (pixels[i4] > 0.01) {
      console.log(count, i, pixels[i4]);
      if (count > 5) {
        break;
      }
      count++;
    }
  }
}

function toSmoothTexture() {
  state = STATE_SMOOTH_TEXTURE;
  lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
  lastFrameTexture.needsUpdate = true;
  gGaussianMaterialHV.uniforms.srcImage.value = lastFrameTexture;
  objPostP.material = gGaussianMaterialHV;
  scenePostP.remove(objPostP);
  scenePostP.add(objPostP);
}

function toGpb() {
  state = STATE_MAKE_GPB;
  gpbDataReady = false;
  gpbRendered = false; // 迫使Shader， 利用maxTexture
  angleId = 0;
  lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
  lastFrameTexture.needsUpdate = true;
  smoothTexture = lastFrameTexture;
  lastFrameTexture = null;
  var src = (!smoothTexture) ? originalImage : smoothTexture;
  gPbMaterial.uniforms.srcImage.value = src;
  gPbMaterial.uniforms.imgWidth.value = src.image.width;
  gPbMaterial.uniforms.imgHeight.value = src.image.height;
  src.needsUpdate = true; //@@ 重要， 必须从texture, material，mesh, 必须明确要求update
  gPbObj.material = gPbMaterial;

  scene.remove(originalObj);
  scene.remove(gPbObj);
  scene.remove(objPostP);
  scene.add(gPbObj);
  // updateGpbMaker();
}

function toOriginal() {
  state = STATE_ORIGINAL;
  materialOriginal.uniforms.srcImage.value = originalImage;
  materialOriginal.uniforms.imgWidth.value = originalImage.image.width;
  materialOriginal.uniforms.imgHeight.value = originalImage.image.height;
  materialOriginal.needsUpdate = true;
  originalObj.material = materialOriginal;
  scene.remove(gPbObj);
  scene.remove(originalObj);
  scene.add(originalObj);
}

function toGpbResult() {
  state = STATE_GPB_RESULT;
  setupScene(originalObj);
  maxTexture.needsUpdate = true;
  materialOriginal.uniforms.srcImage.value = maxTexture;
  materialOriginal.uniforms.imgWidth.value = maxTexture.image.width;
  materialOriginal.uniforms.imgHeight.value = maxTexture.image.height;
  materialOriginal.needsUpdate = true;
  originalObj.material = materialOriginal;
}

function toNormalizeGpb() {
  lastFrameTexture = KT.BufferPool.screen2Texture(lastFrameTexture);
  lastFrameTexture.needsUpdate = true;
  var range = KT.Helper.findRange(lastFrameTexture.image.data);
  if (!materialNormalize) {
    materialNormalize = createMaterialNormalize(lastFrameTexture);
  } else {
    materialNormalize.uniforms.srcImage.value = lastFrameTexture;
  }

  materialNormalize.uniforms.minGrey.value = range.minGrey;
  materialNormalize.uniforms.maxGrey.value = range.maxGrey;
  materialNormalize.needsUpdate = true;
  lastFrameTexture.needsUpdate = true; //@@ 重要， 必须从texture, material，mesh, 必须明确要求update
  originalObj.material = materialNormalize;
  scene.remove(gPbObj);
  scene.remove(originalObj);
  scene.add(originalObj);
  state = STATE_NORMALIZE_GPB;
}

function toMask(stateId) {
  state = !stateId ? STATE_MASK : stateId;
  originalObj.material = maskMaterial;
  maskMaterial.needsUpdate = true;
  materialOriginal.needsUpdate = true;
  scene.remove(gPbObj);
  scene.remove(originalObj);
  scene.add(originalObj);
}

function toLeftUpHisto() {
  state = STATE_LEFT_UP_HISTO;
  maskMaterial.transparent = true;
  maskMaterial.needsUpdate = true;
  originalObj.material = maskMaterial;
  scene.remove(gPbObj);
  scene.add(originalObj);
  bkgSeed1L = KT.Selector.pickByXy(KT.Picture.nc2WcX(KT.Config.leftUpX0),
    KT.Picture.nc2WcY(KT.Config.leftUpY0));
}

function toRightUpHisto() {
  state = STATE_RIGHT_UP_HISTO;
  maskMaterial.transparent = true;
  maskMaterial.needsUpdate = true;
  originalObj.material = maskMaterial;
  scene.remove(gPbObj);
  scene.add(originalObj);
  bkgSeed1R = KT.Selector.pickByXy(KT.Picture.nc2WcX(KT.Config.rightUpX0),
    KT.Picture.nc2WcY(KT.Config.rightUpY0));
}

function toBkgSeed2() {
  state = STATE_FIND_BKG_SEED2;
  originalObj.material = createBkgMaterial();
  originalObj.material.needsUpdate = true;
  scene.remove(originalObj);
  scene.remove(gPbObj);
  scene.add(originalObj);
}

function toBkgSeed3_update() { // connectivity
  state = STATE_FIND_BKG_SEED3_UPDATE;
  //  只是修改状态， 利用uodate来生成新的regions
}

function toAllBkg(visualizeRegionOn) {
  if (bkgSeedAll.length > MAX_REGION_AMOUNT) {
    bkgSeedAll = bkgSeedAll.splice(0, MAX_REGION_AMOUNT);
    console.error("too many regions!");
  }

  maskMaterial.uniforms.regions.value = bkgSeedAll;
  maskMaterial.uniforms.realRegionAmount.value = bkgSeedAll.length;
  maskMaterial.uniforms.visualizeRegionOn.value = visualizeRegionOn;
  maskMaterial.uniforms.alphaSelected.value = 0.00;
  maskMaterial.uniforms.alphaNotSelected.value = 1.0;
  maskMaterial.needsUpdate = true;
  // gGaussianMaterialHV.uniforms.alphaOnly.value = 1;
  gGaussianMaterialHV.needsUpdate = true;

  // KT.State.connectivityOn = true;
  postProcessCounter = 0;

  toMask(STATE_ALL_BKG);
}

function theEnd() {
  state = STATE_THE_END;
}

function cleanBorder() {
  if (cleaned) {
    return 0;
  }

  KT.Region.cleanBorder(bkgSeedAll);
  maskMaterial.needsUpdate = true;
  gGaussianMaterialHV.needsUpdate = true;
  maskMaterial.needsUpdate = true;
  materialOriginal.needsUpdate = true;
  cleaned = 1;
  return 1;
}

function onSelect(selectedRegions) {
  changeMask(selectedRegions);
}

function changeMask(selectedRegions) {
  if (selectedRegions.length > MAX_REGION_AMOUNT) {
    selectedRegions = selectedRegions.splice(0, MAX_REGION_AMOUNT);
    console.error("too many regions!");
  }

  // selectedRegions = [1076, 1108];
  // selectedRegions = [278, 520, 561, 616, 627, 673, 743, 744, 762, 768, 781, 785, 808, 818, 822, 880, 897, 919, 926, 927, 936, 938, 941, 948, 970, 982, 985, 986, 990, 991, 1014, 1018, 1025, 1044, 1047, 1050, 1053, 1056, 1057, 1061, 1064, 1065, 1068, 1069, 1082, 1087, 1088, 1090, 1094, 1096, 1098, 1099, 1101, 1103, 1105, 1107, 1109, 1111, 1116, 1120, 1121, 1122, 1125, 1129, 1130, 1131, 1132, 1134, 1135, 1137, 1139, 1140, 1144, 1145, 1149, 1150, 1151, 1157, 882, 1091, 917, 1185, 833, 1113, 1117, 732, 887, 1092, 780, 1051, 1100, 1126, 1127, 902, 1147, 1133, 976, 1177];
  // console.log("to uniforms: ", selectedRegions);
  if (selectedRegions.length > 0) {
    if (state === STATE_ALL_BKG) {
      // selectedRegions = [689, 945, 639];
    }
    maskMaterial.uniforms.regions.value = selectedRegions;
    maskMaterial.uniforms.realRegionAmount.value = selectedRegions.length;
    maskMaterial.needsUpdate = true;
    if ((state === STATE_ALL_BKG) ||(state === STATE_MASK)) {
      // bkgSeedAll = [689, 945, 639];
      toMask(STATE_MASK);
    }
  }
  KT.SequenceMgr.updateCounter = 0;
}

/* 所有的行动：
 * 显示原图， 新的scene
 * 显示gPb图
 * 显示选中的区域
 */

function initGaussian() {
  renderTarget1 = new THREE.WebGLRenderTarget(canvasWidth, canvasHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat
  });

  renderTarget2 = new THREE.WebGLRenderTarget(canvasWidth, canvasHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat
  });

  scenePostP = createSceneGaussian();
}

function createSceneGaussian() {
  scenePostP = new THREE.Scene();
  // scenePostP.background = new THREE.Color(0xff0000);
  objPostP = createGaussianObj(renderTarget1);
  scenePostP.add(objPostP);
  return scenePostP;
}

function createGaussianObj(target) {
  var quad, plane;
  target.minFilter = THREE.LinearFilter;
  target.magFilter = THREE.NearestFilter;
  gGaussianMaterialHV = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      alphaOnly: {value: 0},
      direction: {value: [1, 0]},
      srcImage: {value: target.texture},
      imgWidth: {value: target.width},
      imgHeight: {value: target.height}
    },
    vertexShader: getShaderByScriptId('vs-original'),
    // fragmentShader: getShaderByScriptId('fs-gaussian')
    fragmentShader: getShaderByScriptId('fs-bilateral')
  });

  plane = new THREE.PlaneBufferGeometry(canvasWidth, canvasHeight);
  quad = new THREE.Mesh(plane, gGaussianMaterialHV);
  quad.position.z = -100;
  return quad;
}

function increaseHeight() {
  KT.Config.UCMHeight += 0.1;
  KT.Selector.setHeight(KT.Config.UCMHeight);
}

function decreaseHeight() {
  KT.Config.UCMHeight -= 0.1;
  KT.Selector.setHeight(KT.Config.UCMHeight);
}

function increaseHeightS() {
  KT.Config.UCMHeight += 0.01;
  KT.Selector.setHeight(KT.Config.UCMHeight);
}

function decreaseHeightS() {
  KT.Config.UCMHeight -= 0.01;
  KT.Selector.setHeight(KT.Config.UCMHeight);
}

function increaseThita() {
  gPbMaterial.uniforms.thita.value += 20 * 3.14159265 / 180;
  gPbMaterial.needsUpdate = true;
}

function decreaseThita() {
  gPbMaterial.uniforms.thita.value -= 2 * 3.14159265 / 180;
  gPbMaterial.needsUpdate = true;
}

function increaseConnectivity() {
  materialConnectivity.uniforms.kernalSize.value += 10;
  materialConnectivity.needsUpdate = true;
}
function resetConnectivity() {
  materialConnectivity.uniforms.kernalSize.value = 3;
  materialConnectivity.needsUpdate = true;
}

function mergeBkgSeed1() {
  //先合并bkgSeed1L和R.
  bkgSeedAll = bkgSeed1L;
  bkgSeed1R.forEach(function (item) {
    if (bkgSeedAll.indexOf(item) < 0) {
      bkgSeedAll.push(item);
    }
  });
}

function refineBkgSeed() {
  // 读取pixels， 生成可能的seed，
  var candidates = [],
    counts = [];

  // 发现新的candidate
  var pixelBuffer = KT.BufferPool.readPixels();
  KT.Picture.attachBkg(pixelBuffer);

  var amount = pixelBuffer.length;
  for (var ptIndex = 0; ptIndex < amount; ptIndex += 4) {
    bkgInfo = KT.Picture.getBkgRegionInfoByIndex(ptIndex);
    if (bkgInfo.pBkg > BKG_ALPHA_THRESHOLD) {
      rId = bkgInfo.regionId;
      if (bkgSeedAll.indexOf(rId) < 0) {
        if (candidates.indexOf(rId) < 0) {
          candidates.push(rId);
          counts[rId] = 1;
        } else {
          counts[rId]++;
        }
      }
    }
  }

  KT.Picture.detachBkg();
  KT.BufferPool.release(pixelBuffer);
  // convert candidate to seed
  bkgSeedAll = KT.Region.growConnect(bkgSeedAll, candidates, counts);
}

function getSmoothTexture() {
  smoothTexture = KT.BufferPool.screen2Texture();
}

function getKoutuResultTexture() {
  koutuResultTexture = KT.BufferPool.screen2Texture();
}

function insertResult() {
  var canvas = renderer.domElement,
    image = canvas.toDataURL("image/png");

  if (!!onSuccessCallback) {
    container.style.display = 'none';
    onSuccessCallback(image);
  }
}

function restoreState() {
  KT.State.connectivityOn = false;
}

function setupScene(obj) {
  scene.remove(gPbObj);
  scene.remove(originalObj);
  scene.remove(objPostP);
  scene.add(obj);
}
