angular.module("starter")
  .controller("sceneController", sceneController);

sceneController.$inject = ["$scope", "$window", "$timeout", "$state", "$stateParams", "$ionicModal",
  "$ionicScrollDelegate", "WCY",
  "$cordovaSocialSharing",
  "FileService", "DeviceService",
  "AppService", "EditorService", "DataService", "MatLibService", "UserService", "NetService"
];

function sceneController($scope, $window, $timeout, $state, $stateParams, $ionicModal,
  $ionicScrollDelegate, WCY, $cordovaSocialSharing,
  FileService, DeviceService, AppService,
  EditorService, DataService, MatLibService, UserService, NetService) {
  var MAX_LEVEL_NUM = 30;
  var TOPIC_PAGE = {
    NO: 0,
    LIST: 1,
    DETAIL: 2,
    EDIT: 3
  };
  var TextEditor = {
    STATUS_INPUT_TEXT: 1,
    STATUS_EDIT_TEXT: 2,
    STATUS_EDIT_COLOR_SIZE: 3
  };
  var DEVICE_TYPE_DESKTOP = "desktop";
  var DEVICE_TYPE_PAD = "pad";
  var DEVICE_TYPE_MOBILE = "mobile";
  var DEVICE_TYPE_FACEBOOK = "facebook";

  var FORGET_PASSWORD = {
    EMAIL_OR_PHONE: 0,
    CODE: 1,
    UPDATE: 2
  };

  // 与后台定义一致：
  var PRIVILEGE_APPROVE_TO_PUBLISH = 0x10;
  var PRIVILEGE_REFINE = 0x20;
  var PRIVILEGE_BAN = 0x40;
  var PRIVILEGE_ADMIN = 0x80;
  var PRIVILEGE_CREATE_TEACHER = 0x100;
  var PRIVILEGE_ARTIST = 0x200;
  var CREATIVE_PRIVILEGE = PRIVILEGE_REFINE |
    PRIVILEGE_BAN |
    PRIVILEGE_CREATE_TEACHER |
    PRIVILEGE_ARTIST;

  var textInputEle;
  var textEditor = {
    opened: false,
    currentElement: null,
    content: "",
    fontSize: 50,
    color: "#0000ff",
    colors: [
      "#000000",
      "#ffffff",
      "#999999", // "red",
      "#6e3814", // "blue",
      "#FF0101", // "red",
      "#e04a39",
      "#fa9d58",
      "#f8cd5c", // "green",
      "#fcf779", // "green",
      "#b8ea6f", // "green",
      "#67ca6f", // "green",
      "#7adfcd", // "green",
      "#5abef9", // "green",
      "#5e81f5", // "green",
      "#8739ca", // "green",
      "#c946ba", // "green",
      "#f877b8", // "green",
      "#f8bac9" // "green",
      // "gold",
      // "blueviolet",
      // "aqua"
    ],

    cssFontStyle: {},
    fontSizeOptions: {
      floor: 12,
      ceil: 100,
      step: 1,
      minRange: MIN_DURATION,
      maxRange: MIN_DURATION,
      pushRange: true,
      onChange: onFontSizeChange,
      onEnd: sizeEnd
    }
  };

  // 变量
  var vm = this;
  var user = TQ.userProfile;
  vm.TOPIC_PAGE = TOPIC_PAGE;

  var oldType;
  var opusCollectionType = TQ.MatType.TOPIC;
  var _initialized = false;
  var editorLoaded = false;
  var lastEditorMode;
  var portraitModePrompting = false;
  var isRedoUndoDithering = false;
  var hasOpusSpecified = false;
  var opusDataReady = false;
  var opusShareData = {
    title: "",
    description: ""
  };
  var SOUND = TQ.MatType.SOUND;
  var PEOPLE = TQ.MatType.PEOPLE;
  var BKG = TQ.MatType.BKG;
  var PROP = TQ.MatType.PROP;
  var OPUS = TQ.MatType.OPUS;
  var removeListenerLocationChange;
  var _currentModal = null;
  var _currentModalType = null;
  var _currentPaneOption = null;
  var _currentMatPaneOption = null;
  var _currentMusic = null;
  var _currentThumb = -1;
  var defaultModal = PROP;
  var _modals = {};
  var eleLevelPane;
  var buttonText4Wx = null;
  var topBar = null;
  var bottomBar = null;
  var loginPanel = null;
  var settingPanel = null;
  var helpPanel = null;
  var sharePanel = null;
  var lastVoiceRecording = null;
  var callbackAfterLogin = null;
  var thumbWidth;
  var selectedSag = null;
  var selectedMatMenuId = 2; // 缺省是 Prop
  var selectedEle = [];
  var isLandscape = TQUtility.isLandscape();
  var selectedTargetMedia = "";

  var isDithering = false;
  var isAddingText = false;
  var isChangeSkinStarted = false;
  var textEditorStatus;

  var state = TQ.State;
  state.readyToShow = !!state.readyToShow;
  state.textEditor = {
    isOpening: false
  };

  var particlePane = null;
  var MIN_DURATION = 2; // 10 frames, ==> 0.5s
  var SagType = TQ.AnimationManager.SagType;
  var inSags = [
    {
      icon: "id-icon-erase",
      onClick: "sc.am.removeAllSags($event); sc.EditorService.eraseAnimeTrack();",
      name: "erase animation",
      innerType: SagType.NO
    },
    {
      icon: "id-icon-left-in",
      onClick: "sc.am.leftIn($event); sc.previewAndRemoveLatest();",
      name: "Left In",
      innerType: SagType.LEFT_IN
    },
    {
      icon: "id-icon-right-in",
      onClick: "sc.am.rightIn($event); sc.previewAndRemoveLatest();",
      name: "Right In",
      innerType: SagType.RIGHT_IN
    },
    {
      icon: "id-icon-top-in",
      onClick: "sc.am.topIn($event); sc.previewAndRemoveLatest();",
      name: "Top In",
      innerType: SagType.TOP_IN
    },
    {
      icon: "id-icon-bottom-in",
      onClick: "sc.am.bottomIn($event); sc.previewAndRemoveLatest();",
      name: "Bottom In",
      innerType: SagType.BOTTOM_IN
    },
    {
      icon: "id-icon-scale-in",
      onClick: "sc.am.scaleIn($event); sc.previewAndRemoveLatest();",
      name: "Scale In",
      innerType: SagType.SCALE_IN
    },
    {
      icon: "id-icon-fade-in",
      onClick: "sc.am.fadeIn($event); sc.previewAndRemoveLatest();",
      name: "Fade In",
      innerType: SagType.FADE_IN
    }
  ];

  var outSags = [
    {
      icon: "id-icon-left-out",
      onClick: "sc.am.leftOut($event); sc.previewAndRemoveLatest();",
      name: "Left Out",
      innerType: SagType.LEFT_OUT
    },
    {
      icon: "id-icon-right-out",
      onClick: "sc.am.rightOut($event); sc.previewAndRemoveLatest();",
      name: "Right Out",
      innerType: SagType.RIGHT_OUT
    },
    {
      icon: "id-icon-top-out",
      onClick: "sc.am.topOut($event); sc.previewAndRemoveLatest();",
      name: "Top Out",
      innerType: SagType.TOP_OUT
    },
    {
      icon: "id-icon-bottom-out",
      onClick: "sc.am.bottomOut($event); sc.previewAndRemoveLatest();",
      name: "Bottom Out",
      innerType: SagType.BOTTOM_OUT
    },
    {
      icon: "id-icon-scale-out",
      onClick: "sc.am.scaleOut($event); sc.previewAndRemoveLatest();",
      name: "Scale Out",
      innerType: SagType.SCALE_OUT
    },
    {
      icon: "id-icon-fade-out",
      onClick: "sc.am.fadeOut($event); sc.previewAndRemoveLatest();",
      name: "Fade Out",
      innerType: SagType.FADE_OUT
    }
  ];

  var idleSags = [{
    icon: "id-icon-rotate",
    onClick: "sc.am.rotate($event); sc.previewAndRemoveLatest();",
    name: "Rotate",
    innerType: SagType.ROTATE
  },
  {
    icon: "id-icon-float-x",
    onClick: "sc.am.floatX($event); sc.previewAndRemoveLatest();",
    name: "Floating",
    innerType: SagType.FLOAT_X
  },
  {
    icon: "id-icon-twinkle",
    onClick: "sc.am.twinkle($event); sc.previewAndRemoveLatest();",
    name: "Twinkle",
    innerType: SagType.TWINKLE
  }
  ];
  var accButtons = [{ // top right
    "position": "fixed",
    "left": "0",
    "top": "0",
    "isBottomRight": false // 用户自定义的属性， 区别 右上角 与 右下角 的按钮
  }, { // bottom right,
    "position": "fixed",
    "left": "0",
    "top": "0",
    "isBottomRight": true
  }];

  // 字体大小
  var sizeSlider = {
    minValue: 10,
    maxValue: 50,
    options: {
      floor: 0,
      ceil: 100,
      step: 1,
      minRange: MIN_DURATION,
      maxRange: MIN_DURATION,
      pushRange: true,
      onEnd: sizeEnd
    }
  };

  function sizeEnd(id, newValue, highValue, pointerType) {
    TQ.Log.debugInfo("end: " + id + "," + newValue + "," + pointerType);
  }

  vm.USER_TYPE = {
    STUDENT: 1,
    PARENT: 2,
    TEACHER: 3,
    CREATIVE_TEACHER: 4
  };

  vm.IN_DEV = !TQ.Config.IN_RELEASE;
  vm.NEED_POLISH = true;
  vm.TEMP_HIDE = true;
  vm.readyToShare = false;

  // interface
  vm.data = DataService;

  // T-shirt
  vm.currPopupModal = null;
  vm.closePopupModal = closePopupModal;
  vm.placeOrder = placeOrder;
  vm.orderTShirt = orderTShirt;

  vm.openLevelManager = openLevelManager;
  vm.opusList = [];
  vm.user = TQ.userProfile;
  vm.authenticate = authenticate;
  vm.signUpOrLogin = signUpOrLogin;
  vm.logout = logout;
  vm.setAdmin = setAdmin;
  vm.setPrivilege = setPrivilege;
  vm.userPrivilegeToSet = CREATIVE_PRIVILEGE;
  vm.userIDToSet = 0;
  vm.userName = "";
  vm.userPsw = "";
  vm.userGroupId = "";
  vm.userPswConfirm = "";
  vm.code = "";
  vm.codeError = false;
  vm.updatePswError = false;
  vm.pswNotMatch = false;
  vm.EDITOR_MODE = TQ.SceneEditor.MODE;
  vm.OPUS_STATE = TQ.OPUS_STATE;
  vm.state = state;
  vm.hideAccButton = true;
  vm.clip = null;
  vm.clipMask = 0;
  state.editorMode = vm.EDITOR_MODE.LOADING;
  vm.pteState = TQ.PageTransitionEffect.state;
  vm.wcyState = TQ.WCY;
  vm.bottomBarOn = bottomBarOn;
  vm.bottomBarOff = bottomBarOff;
  vm.nextPage = nextPage;
  vm.inspectPrevLevel = inspectPrevLevel;
  vm.inspectNextLevel = inspectNextLevel;
  vm.onOK = onOK;
  vm.openGoodOpus = openGoodOpus;
  vm.openOpus = openOpus;
  vm.onBanMat = onBanMat;
  vm.onPublish = onPublish;
  vm.onBan = onBan;
  vm.onEdit = onEdit;
  vm.onMirrorX = onMirrorX;
  vm.onMirrorY = onMirrorY;
  vm.onMirrorBtn = onMirrorBtn;
  vm.onCreateTopic = onCreateTopic;
  vm.selectedForeColor = "white";
  vm.prevPage = prevPage;
  vm.toggleKoutu = toggleKoutu;
  vm.toggleRemoveWhiteMarginOnly = toggleRemoveWhiteMarginOnly;
  vm.toggleSubObjectMode = toggleSubObjectMode;
  vm.topBarOff = topBarOff;
  vm.topBarOn = topBarOn;
  vm.setLang = setLang;
  vm.getStr = getStr;

  vm.stLocked = 0; // 0: not all locked, 1 : disable to lock, 2 : all locked
  vm.isMultiplePictures = false;
  vm.isMusic = false;
  vm.isBackground = false;
  vm.isOverlayOn = TQ.OverlayMask.isOn;
  vm.openSettingPanel = openSettingPanel;
  vm.closeSettingPanel = closeSettingPanel;
  vm.openSharePanel = openSharePanel;
  vm.closeSharePanel = closeSharePanel;
  vm.openActionBoard = openActionBoard;
  vm.closeActionBoard = closeActionBoard;
  vm.openHelpPanel = openHelpPanel;
  vm.closeHelpPanel = closeHelpPanel;
  vm.openOpusPane = openOpusPane;
  vm.helpTutor = helpTutor;
  vm.showDepreciatedBtn = showDepreciatedBtn;
  vm.openLoginPanel = openLoginPanel;
  vm.closeLoginPanel = closeLoginPanel;
  vm.openMyUdoido = openMyUdoido;
  vm.openAIPane = openAIPane;
  vm.copyOpusUrl = copyOpusUrl;
  vm.copyEmbedCodes = copyEmbedCodes;
  vm.confirmShare = confirmShare;
  vm.applyShareData = applyShareData;
  vm.embedCodes = null;
  vm.opusUrl = null;
  vm.opusShareData = opusShareData;
  vm.switchToSignUp = switchToSignUp;
  vm.switchToLogin = switchToLogin;
  vm.switchToForgetPassword = switchToForgetPassword;
  vm.switchToCode = switchToCode;
  vm.switchToUpdate = switchToUpdate;
  vm.switchToUpdateDone = switchToUpdateDone;
  vm.cloneIt = cloneIt;
  vm.convertToTopic = convertToTopic;
  vm.forkIt = forkIt;
  vm.createNewOpus = createNewOpus;
  vm.Config = TQ.Config;
  vm.InputCtrl = TQ.InputCtrl;
  vm.SelectSet = TQ.SelectSet;
  vm.btnEffect = TQ.SelectSet.btnEffect;
  vm.ParticleMgr = TQ.ParticleMgr;
  vm.getParticleOps = TQ.ParticleMgr.getOps;
  vm.applyParticle = applyParticle;
  vm.EditorService = EditorService;
  vm.levelThumbs = WCY.levelThumbs;
  vm.SnowEffect = EditorService.SnowEffect;
  vm.RainEffect = EditorService.RainEffect;
  vm.isMyWorkPane = true;
  vm.showMoreTopBar = false;
  vm.isSelected = true;
  vm.less2More = less2More;
  vm.onClickAnimation = onClickAnimation;
  vm.onSelectSagCategory = onSelectSagCategory;
  vm.hasClicked = hasClicked;
  vm.flashButton3 = "";
  vm.oneButtonWidth = "";
  vm.openParticlePane = openParticlePane;
  vm.closeParticlePane = closeParticlePane;
  // 随行按钮
  vm.accButtons = accButtons;

  // 图片
  vm.listIsSelected = listIsSelected;
  vm.getListClass = getListClass;
  // 简单动画
  vm.inSags = inSags;
  vm.outSags = outSags;
  vm.idleSags = idleSags;
  vm.sagCategoryId = 1;
  vm.helps = TQ.Tutor.helps;
  vm.am = TQ.AnimationManager;
  vm.amPaneOn = false;
  vm.settingPanelOn = false;
  vm.helpPanelOn = false;
  vm.sharePanelOn = false;
  vm.actionBoardOn = false;
  vm.sideBarPos = "side-bar-top";
  vm.openAmPane = openAmPane;
  vm.closeAmPane = closeAmPane;
  vm.timelineSlider = TQ.TimerUI.rangeSlider;
  vm.sizeSlider = sizeSlider;
  vm.textEditor = textEditor;
  vm.FORGET_PASSWORD = FORGET_PASSWORD;
  vm.refreshSlider = refreshSlider;
  vm.saveAm = saveAm;
  vm.previewAndRemoveLatest = TQ.AnimationManager.previewAndRemoveLatest;
  vm.interact = interact;
  vm.toggleTimeline = toggleTimeline;
  vm.freeCreate = freeCreate; // 自由创作，
  vm.selectCanvas = selectCanvas; // 不改变topicId
  vm.isSelectedCanvas = isSelectedCanvas;
  vm.stopAllSounds = TQ.SoundMgr.stopAll;
  vm.state.isSignUping = !TQ.userProfile.hasSignedUp;
  vm.state.isForgetPassword = false;
  vm.state.forgetPassword = FORGET_PASSWORD.EMAIL_OR_PHONE; // 0: input email or phone number, 1: input code, 2: update password

  // 素材编辑
  vm.enableEditMat = false;
  vm.toggleEditMat = function() { vm.enableEditMat = !vm.enableEditMat; };

  vm.state.timeSetting = false;
  if (vm.state.topic === undefined) {
    vm.state.topic = null;
  }

  // 镜像
  vm.isMirrorBtn = false;
  vm.showFullThumbs = true;

  // 动画显示
  vm.am.tDelay = 0;
  vm.am.tDuration = 1;
  vm.am.delayOptions = {
    floor: 0,
    ceil: 5,
    step: 1,
    minRange: MIN_DURATION,
    maxRange: MIN_DURATION,
    pushRange: true
    // onChange: ,
    // onEnd:
  };
  vm.am.durationOptions = {
    floor: 1,
    ceil: 2,
    step: 1,
    minRange: MIN_DURATION,
    maxRange: MIN_DURATION,
    pushRange: true
    // onChange:
    // onEnd:
  };

  var sounds = [];

  var koutuLoaded = false;
  var kouTuList = [
    // KOUTU_LIB_BEGIN
    "features/koutu/lib/Detector.js",
    "features/koutu/lib/ImageUtils.js",
    "features/koutu/shaderLib/shaderLib.js",
    "features/koutu/t4s.css",
    // "features/koutu/chaiAssert.js",
    // "features/koutu/AssertsExt.js",
    "features/koutu/kouTuConfig.js",
    "features/koutu/sequenceMgr.js",
    "features/koutu/helper.js",
    "features/koutu/bufferPool.js",
    "features/koutu/picture.js",
    "features/koutu/region.js",
    "features/koutu/arc.js",
    "features/koutu/select.js",
    "features/koutu/ucm.js",
    "features/koutu/watershed.js",
    "features/koutu/testData.js",
    "features/koutu/kouTu.js",
    "features/koutu/conversion/rgb2Cielab.js",
    "features/koutu/conversion/cielab2Rgb.js",
    "features/koutu/postProcess/equalization.js",
    "features/koutu/postProcess/subtract.js",
    "features/koutu/postProcess/median.js",
    "features/koutu/postProcess/threshold.js",
    "features/koutu/postProcess/genMask.js",
    "features/koutu/postProcess/borderRefine.js",
    "features/koutu/postProcess/morphology.js",
    "features/koutu/tool/findMaxMinBox.js",
    "features/koutu/tool/setupCanvas.js",
    "features/koutu/tool/crop.js",
    "features/koutu/tool/visualization.js",
    "features/koutu/tool/checkDeviceCap.js",
    "features/koutu/tool/save.js",
    "features/koutu/unittest/unittest.js"
    // KOUTU_LIB_END
  ];
  var onKoutuLoadedList = [];
  var koutuLoading = false;

  function loadKoutu(callback) {
    if (koutuLoaded) {
      if (callback) {
        return callback();
      }
      return;
    } else if (koutuLoading) {
      onKoutuLoadedList.push(callback);
      return;
    }

    koutuLoading = true;
    onKoutuLoadedList.push(callback);
    TQ.LazyLoading.loadOne("features/koutu/lib/three.min.js", function() {
      for (var i = 0; i < kouTuList.length; i++) {
        TQ.LazyLoading.loadOne(kouTuList[i], onLoadedOne);
      }
    });

    var fileCounter = 0;

    function onLoadedOne() {
      fileCounter++;
      if (fileCounter >= kouTuList.length) {
        koutuLoaded = true;
        koutuLoading = false;
        vm.KTConfig = KT.Config;
        KT.Config.rescaleOnly = vm.Config.removeWhiteMarginOnly;
        onKoutuLoadedList.forEach(function(fn) {
          if (fn) {
            return fn();
          }
        });
      }
    }
  }

  function loadKoutuAsync() {
    if (TQ.Config.koutuOn) {
      $timeout(function() {
        var data = {
          aFile: "textures/busket01.jpg"
          // aFile: "textures/frame01.jpg",
          // aFile: "textures/blue-bkg.jpg",
        };

        // var callback = function() {testKoutu(data);};
        var callback = null;
        loadKoutu(callback);
      }, 2000);
    }
  }

  function applyParticle(evt) {
    vm.ParticleMgr.change();
  }

  function listIsSelected(id) {
    selectedMatMenuId = id;
  }

  function getListClass(id) {
    if (selectedMatMenuId === id) {
      return "listSelected " + buttonText4Wx;
    }
    return "listUnselected " + buttonText4Wx;
  }

  function openParticlePane() {
    TQ.PreviewMenu.disableWatch();
    if (!particlePane) {
      particlePane = $("#id-particle-pane");
    }
    particlePane.fadeIn(500);
  }

  function closeParticlePane() {
    TQ.PreviewMenu.enableWatch();
    if (TQ.FrameCounter.isPlaying()) {
      TQ.PreviewMenu.startWatch();
    }
    particlePane.fadeOut(500);
  }

  function openAmPane(evt) {
    if (evt) {
      TQ.Trsa3.ditherStart();
      evt.stopPropagation();
      evt.preventDefault(evt);
    }

    closeMirrorTools();
    WCY.stopAutoSave();
    TQ.TimerUI.startSagPanel();
    vm.amPaneOn = true;
    // 对于SAG，只适合于root Element， 不适合于Children
    var ele = TQ.SelectSet.switchToRootElement();
    if (ele) {
      selectedSag = toSelectedSag(vm.am.getCurrentTypeSag(ele));
    }

    updateAmPane();
    TQ.PreviewMenu.disableWatch();
    disableTopBar();
    document.addEventListener(TQ.FrameCounter.EVENT_AB_PREVIEW_STOPPED, onEndOfPlay);
    $timeout(refreshSlider, 200);
  }

  function onResize(evt) {
    if (state.textEditor.isOpening) { // 避免手机上， 软键盘的弹出造成的字体缩放
      return;
    }

    $timeout(function() {
      var ele;
      if ((ele = TQ.SelectSet.getLastSolidElement())) {
        updateAccompanyingButtons(ele);
      }
      calOpusPaneStyle();
    }, 10);
  }

  function onSelectSetChange(evt) {
    TQ.AssertExt.invalidLogic(!!evt && !!evt.data);
    if (state.textEditor.isOpening) {
      return confirmTextInput();
    }

    var ele = (evt && evt.data && evt.data.element) ? evt.data.element : null;
    TQ.Log.debugInfo("onSelectSetChange: " + JSON.stringify(ele));

    vm.showFullThumbs = !ele;
    if (vm.amPaneOn && (!evt || (evt.type !== TQ.BBox.CHANGED))) {
      if (ele) {
        selectedSag = toSelectedSag(vm.am.getCurrentTypeSag(ele));
      }
      updateAmPane();
    }
    if (state.textEditor.isOpening) {
      updateTextPane();
    }

    if (!isRedoUndoDithering) {
      updateAccompanyingButtons(ele);
    }

    var nCntPinned = 0;
    var nLenSel = vm.SelectSet.members.length;
    for (var i = 0; i < nLenSel; i++) {	// conserve order of plugins
      if (vm.SelectSet.members[i].isPinned()) {
        nCntPinned++;
      }
    }

    if (nLenSel === 0) {
      vm.stLocked = 1; // although not to show
    } else {
      if (nCntPinned === 0) {
        vm.stLocked = 0;
      } else if (nCntPinned === nLenSel) {
        vm.stLocked = 2;
      } else {
        vm.stLocked = 1;
      }
    }
  }

  function updateAccompanyingButtons(ele) {
    var bbox;
    var poses = [];
    if (ele && (ele instanceof TQ.GroupElement)) {
      state.isIComponent = true;
    } else {
      state.isIComponent = false;
    }
    if (ele && (bbox = ele.getBBox())) {
      poses[0] = bbox.getBBoxTopRight();
      poses[1] = bbox.getBBoxBottomRight();
      if (poses[0] && poses[1]) {
        TQ.Log.debugInfo("Pos: top right: (" + poses[0].x.toFixed(0) + ", " + poses[0].y.toFixed(0) + ")" +
          ", bottom right: (" + poses[1].x.toFixed(0) + ", " + poses[1].y.toFixed(0) + ")");
      }
    }

    if (!ele || poses.length < 2) {
      vm.hideAccButton = true;
    } else {
      poses = limitWithInView(poses);
      accompanyingButton(poses, ele);
    }
  }

  function limitWithInView(poses) {
    var posTop = TQ.Utility.world2cssFromTop(poses[0].x, poses[0].y);
    var posBottom = TQ.Utility.world2cssFromTop(poses[1].x, poses[1].y);

    posTop.x = Math.round(posTop.x);
    posTop.y = Math.round(posTop.y);
    posBottom.x = Math.round(posBottom.x);
    posBottom.y = Math.round(posBottom.y);

    // 定位方式改变了: fake大按钮的定位点在左上角
    var buttonEle = document.getElementsByClassName("button2-bgc")[0];
    var btnHeight = (!buttonEle ? 0 : TQ.Utility.getCssSize(getComputedStyle(buttonEle).height));
    var btnWidth = btnHeight;
    var minX = TQ.Config.workingRegionX0;
    var minY = (TQ.State.topBarUseZeroHeight ? 0 : TQ.State.topBarHeight);

    var maxY = TQ.State.innerHeight;
    if (!TQ.State.bottomBarUseZeroHeight) {
      maxY -= TQ.State.bottomBarHeight + btnHeight;
    }
    var maxX = (TQ.Config.workingRegionX0 + TQ.Config.workingRegionWidth - btnWidth);

    // 不超界, 都是CSS坐标， 右上角小，
    if (posTop.y < minY) {
      posTop.y = minY;
    }

    if ((posBottom.y - posTop.y) < btnHeight) {
      posBottom.y = posTop.y + btnHeight;
    }

    if (posBottom.y > (maxY - btnHeight)) {
      posBottom.y = maxY - btnHeight;
    }

    if ((posBottom.y - posTop.y) < btnHeight) {
      posTop.y = posBottom.y - btnHeight;
    }

    posTop.x = TQ.MathExt.clamp(posTop.x, minX, maxX);
    posBottom.x = TQ.MathExt.clamp(posBottom.x, minX, maxX);
    return [posTop, posBottom];
  }

  function updateAmPane() {
    var ele = TQ.SelectSet.getLastSolidElement();
    vm.am.delayOptions.ceil = Math.round(currScene.currentLevel.getTime());
    vm.am.durationOptions.ceil = Math.round(currScene.currentLevel.getTime());
    if (vm.am.tDuration > vm.am.durationOptions.ceil) {
      vm.am.tDuration = vm.am.durationOptions.ceil;
    }
    if (vm.am.tDelay > vm.am.delayOptions.ceil) {
      vm.am.tDelay = vm.am.delayOptions.ceil;
    }
    if (!ele) {
      vm.closeAmPane();
    } else {
      var xy = ele.getPositionInNdc();
      var y = xy.y;
      if (y < 0.5) {
        $scope.sideBarPos = "side-bar-top";
      } else {
        $scope.sideBarPos = "side-bar-bottom";
      }
      TQ.Log.debugInfo("updateAmPane: y=" + y + "sideBarPos = " + $scope.sideBarPos);
      if (!ele || !vm.am.reset(ele)) {
        return; // TQ.MessageBox.prompt("先选择物体");
      }
      $timeout(refreshSlider, 200);
    }
  }

  function accompanyingButton(poses, ele) {
    var i;
    vm.hideAccButton = false;
    for (i = 0; i < accButtons.length; i++) {
      resetAccButton(accButtons[i], poses[i], ele);
    }
    $timeout();
  }

  function resetAccButton(btnELe, posLimited, ele) {
    if (!ele || !posLimited || posLimited.length < 1) {
      vm.hideAccButton = true;
    } else {
      var x = posLimited.x;
      var y = posLimited.y;
      btnELe.left = x + "px";
      btnELe.top = y + "px";
      btnELe.display = "block";
      TQ.Log.debugInfo("posxy(" + x + ", " + y + ")");
    }
  }

  function calOpusPaneStyle() {
    var OPUS_THUMB_WIDTH = 100;
    var MIN_MARGIN = 2;
    var w = window.innerWidth - 2 * MIN_MARGIN;
    var n = Math.floor((w - 2 * MIN_MARGIN) / (OPUS_THUMB_WIDTH + 2 * MIN_MARGIN));
    var deltaW = (w - n * OPUS_THUMB_WIDTH) / (2 * n + 2);

    vm.opusThumbListStyle = {
      "margin-left": deltaW + "px"
    };
    vm.opusThumbStyle = {
      "width": OPUS_THUMB_WIDTH + "px",
      "max-width": OPUS_THUMB_WIDTH * 2 + "px",
      "margin-left": deltaW + "px",
      "margin-right": deltaW + "px",
      "margin-bottom": deltaW + "px"
    };
  }

  function closeAmPane() {
    vm.amPaneOn = false;
    state.timeSetting = false;
    selectedSag = null;
    TQ.TimerUI.stopSagPanel();
    TQ.PreviewMenu.enableWatch();
    WCY.startAutoSave();
    if (TQ.FrameCounter.isPlaying()) {
      TQ.PreviewMenu.startWatch();
    } else {
      vm.toAddMode();
    }
    document.removeEventListener(TQ.FrameCounter.EVENT_AB_PREVIEW_STOPPED, onEndOfPlay);
    TQ.OverlayMask.turnOff();
    $timeout();
    enableTopBar();
    EditorService.turnOffTrim();
  }

  function setupLayout() {
    isLandscape = TQUtility.isLandscape();
    TQ.State.determineWorkingRegion();
    AppService.configCanvas();
    setupMenuOnly();
  }

  function setupMenuOnly() {
    isLandscape = TQUtility.isLandscape();
    vm.ngToolBtn = calButtonSize4Wx();
    vm.landscape_toolbar_style = !isLandscape ? {}
      : {
        // "left": "0",
        // "width": (TQ.State.innerWidth - TQ.Config.workingRegionWidth) + "px",
        // "max-width": (TQ.State.innerWidth/2) + "px"
      };

    EditorService.onAddModeDone(function() {
      if (TQ.State.topBarUseZeroHeight && TQ.State.bottomBarUseZeroHeight) {
        var menuAreaWidth = (TQ.State.innerWidth - TQ.Config.workingRegionWidth - 5);
        var menuAreaOffset = Math.round(TQ.Config.workingRegionWidth) + 5;

        state.topBarStyle = {
          "position": "absolute",
          "top": "0",
          "left": menuAreaOffset + "px",
          "width": menuAreaWidth + "px"
        };
        state.toolbarStyle = {
          "position": "absolute",
          "bottom": "0",
          "left": menuAreaOffset + "px",
          "width": menuAreaWidth + "px"
        };

        state.matPaneStyle = {
          "background-color": "#393939",
          "left": "0",
          "max-width": TQ.Config.workingRegionWidth + "px"
        };

        state.levelThumbsStyle = {
          "position": "absolute",
          "top": TQ.State.topBarHeight + "px",
          "left": menuAreaOffset + "px",
          "width": menuAreaWidth + "px"
        };
      } else {
        state.topBarStyle = {};
        state.toolbarStyle = {
          "position": "absolute",
          "bottom": "0",
          "width": "100%"
        };
        state.matPaneStyle = {};
        state.levelThumbsStyle = {};
      }
    });
  }

  // implementation
  function initialize() {
    isSelectingCanvas = false;
    thumbsLeft = 0;
    xStart = 0;
    thumbsLeftStart = 0;
    TQ.Utility.parseQueryString();
    var newShareCode = TQ.QueryParams.shareCode;
    if (TQ.State.lastShareCode === newShareCode) {
      return;
    }
    TQ.State.lastShareCode = newShareCode;
    AppService.onAppStarted(onAppStarted);

    // window.__wxjs_environment = "miniprogram";
    if (TQUtility.isMiniProgramWebView()) {
      TQ.Config.AutoPlay = false;
      state.needUserClickToPlayAV = true;
      state.isWxMiniProgram = true;
    }
    state.needToShowStartToPlay = true;

    if (state.readyToShow) { // 再次打开其他作品
      TQ.Utility.parseQueryString();
    }
    if (TQUtility.isMobile()) {
      // TQ.Config.koutuOn = false;
    }
    // OS 限定的功能：
    // iOS上，无法录音， 不需要copy/paste按钮（因为iOS自带了）
    TQ.State.canRecordVoice = !TQUtility.isIOS();
    TQ.State.canCopyPaste = !TQUtility.isIOS();
    setupLayout();
    // remove_debugger_begin
    // TQ.Log.setLevel(TQ.Log.INFO_LEVEL);
    TQ.Log.setLevel(TQ.Log.CRITICAL_LEVEL);
    // remove_debugger_end
    state.isRecording = false;
    // state.showTimer = true; //false;
    // state.showTrimTimeline = false; //false;

    state.bottomBarShow = true;
    state.topBarShow = true;
    state.topicPage = TOPIC_PAGE.NO;

    vm.info = "";
    window.addEventListener("orientationchange", onResize);
    // window.addEventListener('resize', onResize);
    eleLevelPane = document.getElementById("id_bottom_bar");
    if (eleLevelPane) {
      eleLevelPane.addEventListener("touchmove", onMoveLevelThumbs);
      eleLevelPane.addEventListener("touchstart", onMoveLevelThumbsStart);
    }
    var footerBar = document.querySelector(".footer .suo_img li");
    var eleThumbLevel = (!footerBar ? null : footerBar.firstElementChild);
    if (eleThumbLevel) {
      thumbWidth = TQ.Utility.getCssSize(getComputedStyle(eleThumbLevel).width);
    } else {
      thumbWidth = 100;
    }

    topBar = angular.element(document.getElementById("id-float-tool-top"));
    bottomBar = angular.element(document.getElementById("id-float-tool-bottom"));
    var uiElementIds = [
      "id-view",
      "id-float-tool-top",
      "id-float-tool-bottom"
    ];

    uiElementIds.forEach(function(id) {
      var ele = document.getElementById(id);
      if (ele) {
        ele.addEventListener("move", preventDefault);
        ele.addEventListener("drag", preventDefault);
      }
    });

    function preventDefault(e) {
      e.preventDefault();
    }

    document.addEventListener(TQ.SelectSet.SELECTION_NEW_EVENT, onSelectSetChange);
    document.addEventListener(TQ.SelectSet.SELECTION_EMPTY_EVENT, onSelectSetChange);
    document.addEventListener(TQ.BBox.CHANGED, onSelectSetChange);
    portraitModePrompt();
    angular.element($window).bind("orientationchange", function(evt) {
      console.log(evt);
      portraitModePrompt();
    });
    backButtonHandlerOn();
    calOpusPaneStyle();
    // removeListenerLocationChange = $scope.$on('$locationChangeStart', onLocationChange);
  }

  var lastOpus = null;
  function onLocationChange(evt) {
    // 几种case：
    // 从地址栏输入新url
    // 自动updateUrl（通知微信）
    // 从作品栏中打开
    // 自己创作
    if (location.hash === TQ.State.selfUpdateUrl) {
      return;
    }

    console.log(evt);
    TQ.QueryParams = TQ.Utility.parseUrl();
    var opus = TQ.QueryParams.shareCode;
    if (!opus && TQ.QueryParamsConverted && TQ.QueryParamsConverted.shareCode) {
      opus = TQ.QueryParamsConverted.shareCode;
    }
    TQ.QueryParamsConverted = null;
    if (opus !== lastOpus) {
      lastOpus = opus;
      if (opus) {
        WCY.getWcy(opus);
      } else {
        WCY.start();
      }
    }
  }

  function initEditor() {
    if (!TQ.QueryParams.hideMenu) {
      vm.state.showTimer = true;
    }

    if (!_editorInitialized) {
      // _editorInitialized = true;
      var view = $ionicScrollDelegate.getScrollView();
      if (view) {
        view.options.scrollingY = false;
        view.options.scrollingX = false;
      }

      if (!!user.loggedIn && !TQ.State.isPlayOnly) {
        $timeout(function() {
          TQ.SceneEditor.turnOnEditor();
          loadEditor();
        });
      }

      setupLayout();
      $scope.$on(TQ.Scene.EVENT_SAVED, updateUrl);
    }
  }

  function loadEditModeMat() {
    EditorService.setColorPanel(document.getElementById("color-panel"));
    // MatLibService.getProps("animal");
    vm.resource = {
      type: TQ.MatType.PROP
    };

    vm.props = null;
    oldType = vm.resource.type;
    $scope.resource = vm.resource;

    $timeout(function() {
      TQ.Log.debugInfo("start init modal within timeout... ");
      _initModal("imagePane__html", defaultModal);
    }, 100);
  }

  $scope.$on(DataService.EVENT_DATA_READY, function() {
    if (!opusDataReady) {
      opusDataReady = true;
    }
    vm.opusDataReady = opusDataReady;

    if (vm.props && vm.props.parent) {
      vm.props = vm.props.parent.getPage(0);
      $timeout(); // force to refresh UI, such as: when delete one of my opus in 2+ page;
    }
  });

  vm.openAllOpusPane = function() {
    updateOpusCollection(TQ.MatType.PUBLISHED_OPUS);
  };

  vm.onFineOpusPane = function() {
    updateOpusCollection(TQ.MatType.FINE_OPUS);
  };

  vm.onTodayTopicPane = function() {
    updateOpusCollection(TQ.MatType.TOPIC);
  };

  $scope.$on(DataService.EVENT_TOPIC_READY, function() {
    var topics = DataService.getProps(TQ.MatType.TOPIC);
    topics.forEach(function(item) {
      if (!item.thumbPath) {
        if (item.posterPicturePath === "/undefined") {
          item.posterPicturePath = null;
        }
        item.thumbPath = TQ.RM.toOpusThumbNailFullPath(item.posterPicturePath);
      }
    });

    vm.opusList = DataService.getProps(opusCollectionType);
  });

  function tryToShowOpus() {
    if (_modals[defaultModal] && opusDataReady && state.editorMode >= vm.EDITOR_MODE.EDIT) {
      if (user.loggedIn && !hasOpusSpecified) {
        if (TQ.Tutor.hasNew(user)) {
          var isFirstTimeUser = TQ.Tutor.isFirstTimeUser();
          TQ.Tutor.start(null, function() {
            (isFirstTimeUser ? openOpusPane() : openHelpPanel());
            $timeout(); // force UI update;
          });
        } else {
          openOpusPane();
        }
      }
    }
  }

  function setupEditMode() {
    $scope.$watch("resource.type", function() {
      if (oldType !== vm.resource.type) {
        TQ.Log.debugInfo("type changed!" + vm.resource.type);
        vm.props = DataService.getProps(vm.resource.type);
        oldType = vm.resource.type;
        clearFlags();
      }
    });
    $scope.$on("$destroy", function() {
      TQ.Log.debugInfo("destroy");
      for (const p in _modals) {
        _modals[p].remove();
      }
    });

    $scope.$on("modal.hidden", function() {
      TQ.Log.debugInfo("modal.hidden");
    });

    $scope.$on("modal.removed", function() {
      TQ.Log.debugInfo("modal.removed");
    });
  }

  function openSettingPanel() {
    if (!settingPanel) {
      settingPanel = $("#id-setting-panel");
    }
    settingPanel.fadeIn(500);
    vm.settingPanelOn = true;
  }

  function closeSettingPanel() {
    if (settingPanel) {
      settingPanel.fadeOut(500);
      vm.settingPanelOn = false;
    }
  }

  function openSharePanel() {
    if (isDithering) {
      return;
    }
    ditherStart();

    if (!currScene.ssPath && vm.readyToShare) {
      return TQ.MessageBox.confirm("无法生成插图!");
    }

    if (!sharePanel) {
      sharePanel = $("#id-share-panel");
    }
    fillShareData();
    TQ.InputMap.turnOff();
    sharePanel.fadeIn(500);
    vm.embedCodes = createEmbedCodes();
    vm.opusUrl = createOpusLink();
    vm.sharePanelOn = true;
    if (state.isPlayOnly) {
      vm.readyToShare = true;
    }
    state.editorMode = vm.EDITOR_MODE.SHARE_PANE;

    var UseWxRedictPage = false;
    if (UseWxRedictPage) {
      const destPage = {
        url: "/pages/sharePage/sharePage", // 大小写敏感
        complete: onComplete,
        success: onSuccess,
        fail: onFail
      };

      function onComplete(data) {
        console.log("miniProgram navigate completed, " + JSON.stringify(data));
      }

      function onSuccess(data) {
        console.log("miniProgram navigate success, " + JSON.stringify(data));
      }

      function onFail(data) {
        console.log("miniProgram navigate failed, " + JSON.stringify(data));
      }

      /**
       官方指南： 网页向小程序 postMessage 时，会在特定时机（小程序后退、组件销毁、分享）触发并收到消息
       小技巧：
       1. 对于真手机：在<web-view>页面右上角分享时先触发了onShareAppMessage事件,后触发bindmessage，
       （在开发者工具内调试，反之）
       解决：利用组件销毁条件，wx.miniProgram.redirectTo() 回一个新的小程序页面，再在页面内做按钮分享。

       2. 对于真手机：<web-view>组件的 bindmessage属性不触发。
       原因：部分Android机不接受非object传回的data，导致不触发。
       解决：为了兼容，将wx.miniProgram.postMessage()写成如下形式：
       wx.miniProgram.postMessage(data:{key:value});
       */
      console.log(WCY.getShareCode());
      wx.miniProgram.postMessage({ data: { opusShareCode: WCY.getShareCode() }});
      // wx.miniProgram.switchTab(destPage); // 不属于“特定时机”==》不能执行postMessage
      // wx.miniProgram.navigateTo(destPage);
      // wx.miniProgram.navigateBack({delta: 1}); // 属于“特定时机”， 但是测试无动作
      wx.miniProgram.redirectTo(destPage); // 属于“特定时机”， 销毁组件
    }
  }

  function closeSharePanel() {
    if (sharePanel) {
      sharePanel.fadeOut(500);
      vm.sharePanelOn = false;
    }
    state.editorMode = vm.EDITOR_MODE.PREVIEW;
    TQ.InputMap.turnOn();
  }

  function openActionBoard() {
    TQ.InputMap.turnOff();
    vm.state.isPreviewMenuOn = true;
  }

  function closeActionBoard() {
    vm.state.isPreviewMenuOn = false;
    inspectLevelsEnd();
    TQ.InputMap.turnOn();
  }

  function openHelpPanel() {
    TQ.Tutor.init();
    if (!helpPanel) {
      helpPanel = $("#id-setting-panel");
    }
    helpPanel.fadeIn(500);
    vm.helpPanelOn = true;
    $timeout(); // force to update UI
  }

  function closeHelpPanel() {
    if (helpPanel) {
      helpPanel.fadeOut(500);
      vm.helpPanelOn = false;
    }
  }

  function openMyUdoido(evt) {
    if (!ensureLogin(function() { openMyUdoido(evt); })) {
      return;
    }

    TQ.InputMap.turnOff();

    if (state.editorMode !== vm.EDITOR_MODE.LOGIN) {
      lastEditorMode = state.editorMode;
    }

    TQ.AssertExt.isTrue(TQ.userProfile.loggedIn, "先login");
    if (currScene) { vm.toAddMode(); }
    openOpusPane(evt);
  }

  /*This is a temporary style for AI demo. To be removed. Search for ROBIN to get all such temp code*/
  function openAIPane(evt) {
    if (!ensureLogin(function() { openAI(evt); })) {
      return;
    }

    TQ.InputMap.turnOff();

    if (state.editorMode !== vm.EDITOR_MODE.LOGIN) {
      lastEditorMode = state.editorMode;
    }

    TQ.AssertExt.isTrue(TQ.userProfile.loggedIn, "先login");
    if (currScene) { vm.toAddMode(); }

    window.location.assign("/features/ai/ai.html");
  }
/* End of temp code */

  function openLoginPanel(callback) {
    TQ.AssertExt.isTrue(!callbackAfterLogin, "login callback 重复了");
    callbackAfterLogin = callback;

    if (TQUtility.isMiniProgramWebView()) {
      if (TQ.QueryParams.wxCode) {
        var nickname = TQ.QueryParams.wxNickName || "微信用户";
        return UserService.loginFromWx(TQ.QueryParams.wxCode, nickname).then(onLoggedIn);
      }
      return TQ.MessageBox.promptWithNoCancel(TQ.Locale.getStr("只供注册用户使用! 请先注册"));
    }
    document.addEventListener("keydown", onSubmitLogin);
    vm.state.isSignUping = !TQ.userProfile.hasSignedUp;
    vm.state.isPreviewMenuOn = false;
    vm.loginActiveField = 2;
    TQ.InputMap.turnOff();
    $timeout(function() {
      state.editorMode = vm.EDITOR_MODE.LOGIN;
    });
    if (!loginPanel) {
      loginPanel = $("#id-login-panel");
    }
    user.nameError = false;
    user.passwordError = false;
    loginPanel.fadeIn(500);
  }

  var firstPage = null;

  function openFirstPage() {
    state.editorMode = vm.EDITOR_MODE.FIRST;
    vm.state.isAddMode = false;
    if (!firstPage) {
      firstPage = $("#id-first-page");
    }
    firstPage.show();
    updateOpusCollection(opusCollectionType);
    removeWelcomePage();
  }

  vm.goBack = function() {
    if (state.editorMode === vm.EDITOR_MODE.PREVIEW) {
      vm.toAddMode();
    } else if (state.editorMode === vm.EDITOR_MODE.MY_WORK) {
      if (state.isWxMiniProgram || (lastEditorMode === vm.EDITOR_MODE.PREVIEW)) {
        if (TQ.userProfile.canSolve) {
          toFirstPage();
        } else {
          vm.preview();
        }
      } else {
        toFirstPage();
      }
    }
  };

  function toFirstPage() {
    DataService.reload(null, true);
    if (state.isPreviewMode) {
      if (TQ.userProfile.loggedIn && !TQ.State.isPlayOnly && !!currScene &&
        (!TQ.Config.LockPostImageEnabled && (!currScene.hasScreenShotManual))) {
        vm.uploadScreenShotManually();
      }
      TQ.PreviewMenu.stopWatch();
      if (currScene) {
        EditorService.stop();
      }
    }
    closeActionBoard();
    $timeout(openFirstPage);
  }

  vm.toFirstPage = toFirstPage;
  vm.openTopicPage = function() {
    updateOpusCollection(TQ.MatType.TOPIC);
    vm.openListView();
  };

  vm.openListView = function() {
    if (state.isPreviewMode) {
      TQ.PreviewMenu.stopWatch();
      if (currScene) {
        EditorService.stop();
      }
      vm.toFirstPage();
    }
    $timeout(function() {
      vm.state.topicPage = TOPIC_PAGE.LIST;
    });
  };

  vm.closeTopicPage = function() {
    TQ.AssertExt.isTrue(state.editorMode === vm.EDITOR_MODE.FIRST, "必须从首页打开");
    vm.state.topicPage = TOPIC_PAGE.NO;
  };

  vm.openTopicDetail = function(prop) {
    TQ.AssertExt.isTrue(state.editorMode === vm.EDITOR_MODE.FIRST, "必须从首页打开");
    vm.state.topic = prop;
    if (user && user.ID === vm.state.topic.authorId) {
      vm.state.topicPage = TOPIC_PAGE.DETAIL;
    } else {
      vm.openTopicIntro(prop);
    }
  };

  vm.openTopicIntro = function(topic) {
    if (!vm.state.isLoadingIntro) { // 防止重复
      vm.state.isLoadingIntro = true;
      if (topic && topic.introId > 0) {
        WCY.getTopicIntro(topic);
      }
    }
  };

  function onIntroOpened() {
    vm.state.isLoadingIntro = false;
    if (state.editorMode === vm.EDITOR_MODE.FIRST) {
      vm.closeTopicPage();
    }
  }

  vm.openAddTopicPage = function(topic) {
    if (topic) {
      vm.state.topic = topic;
      // TQ.AssertExt.isTrue((topic._id !== undefined) && (topic._id > 0));
      topic.introUrl = (!topic.introId || topic.introId < 0) ? null : TQ.Utility.wcyId2Url(topic.introId);
      topic.outroUrl = (!topic.outroId || topic.outroId < 0) ? null : TQ.Utility.wcyId2Url(topic.outroId);
      topic.posterPictureUrl = (topic.posterPicturePath === undefined || !topic.posterPicturePath) ? null : TQ.RM.toMatThumbNailFullPath(topic.posterPicturePath);
    } else {
      vm.state.topic = {};
    }

    vm.state.topicPage = TOPIC_PAGE.EDIT;
  };

  function switchToSignUp() {
    user.passwordError = false;
    user.nameError = false;
    vm.loginActiveField = 2;
    vm.state.isSignUping = true;
    if (!user.type) {
      user.type = vm.USER_TYPE.CREATIVE_TEACHER;
    }
    $timeout();
  }

  function switchToLogin() {
    vm.state.isSignUping = false;
  }

  function switchToForgetPassword() {
    vm.state.isForgetPassword = true;
    vm.state.forgetPassword = FORGET_PASSWORD.EMAIL_OR_PHONE;
  }

  function switchToCode() {
    function validateEmail(email) {
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    }
    //    console.log("validate Email : ", validateEmail(vm.userName));

    UserService.sendCode(vm.userName, function(result) {
      console.log("switchToCode result : ", result);
      if (result.data.success) {
        vm.state.forgetPassword = FORGET_PASSWORD.CODE;
      } else if (result.data.token) {
        user.nameError = true;
      } else if (result.data.user) {
        user.nameError = true;
      }
    });
  }

  function switchToUpdate() {
    console.log("code : ", vm.code);
    UserService.confirmCode(vm.userName, vm.code, function(result) {
      if (result.data.success) {
        vm.state.forgetPassword = FORGET_PASSWORD.UPDATE;
      } else if (result.data.error) {
        console.log("error code");
        vm.codeError = true;
      }
    });
  }

  function switchToUpdateDone() {
    if (vm.userPswConfirm !== vm.userPsw) {
      vm.pswNotMatch = true;
      return;
    }

    UserService.updatePassword(vm.userName, vm.code, vm.userPsw, function(result) {
      if (result.data.success) {
        closeLoginPanel();
      } else if (result.data.error) {
        vm.updatePswError = true;
      }
    });
  }

  function closeLoginPanel() {
    callbackAfterLogin = null;
    vm.state.isForgetPassword = false;
    document.removeEventListener("keydown", onSubmitLogin);
    TQ.InputMap.turnOn();
    if (loginPanel) {
      if (!TQ.userProfile.loggedIn) {
        openFirstPage();
      }
      loginPanel.fadeOut(500);
    }
  }

  this.openMaterialPane = function(evt) {
    if (evt) {
      evt.stopPropagation();
    }
    if (isDithering) {
      return;
    }
    ditherStart();
    if (!_currentMatPaneOption) {
      this.switchToProp();
    } else {
      switchModal(_currentMatPaneOption);
    }

    showModal(_currentModal);
  };

  this.switchToBkg = function() {
    var option = {
      isMultiplePictures: true,
      sourceType: TQ.MatType.BKG,
      modalType: BKG
    };

    switchModal(option);
  };

  this.openBkgPane = function(evt) {
    vm.switchToBkg();
    vm.openMaterialPane(evt);
    registerFileChangeHandler();
  };

  this.openSoundElementPane = function(evt) {
    sounds.splice(0);
    for (var i = 0; i < TQ.SoundMgr.items.length; i++) {
      var ele = TQ.SoundMgr.items[i];
      if (!ele.isInCurrentLevel()) {
        continue;
      }
      sounds.push({
        ele: ele,
        isUsing: true,
        name: ele.getResourceName(),
        path: ele.getResourcePath()
      });
    }

    vm.props = sounds;
    showModal(_currentModal);
  };

  this.switchToMusic = function() {
    var option = {
      isMultiplePictures: false,
      sourceType: TQ.MatType.SOUND,
      modalType: SOUND
    };
    switchModal(option);
  };

  this.openMusicPane = function(evt) {
    vm.switchToMusic();
    vm.openMaterialPane(evt);
    registerFileChangeHandler();
  };

  function openOpusPane(evt) {
    if (!opusDataReady) {
      var removeListener = $scope.$on(DataService.EVENT_DATA_READY, onOpusDataReady);

      function onOpusDataReady() {
        removeListener();
        if (!opusDataReady) {
          opusDataReady = true;
        }
        openOpusPane(evt);
      }

      return;
    }

    if (state.isPlayOnly && !hasOpus()) {
      DataService.reload(TQ.MatType.OPUS, true);
    } else if (!hasOpus() && opusDataReady) {
      TQ.MessageBox.prompt(TQ.Locale.getStr("click OK to create your own first opus"),
        function() {
          vm.selectCanvas();
        });

      // return TQ.MessageBox.prompt(TQ.Locale.getStr('You have no opus to show now. <br/> ' +
      //     'Click OK will open the <strong>"Quick start"</strong> tutorial, which will help you get up to speed'),
      //     openHelpPanel);
    }

    _currentPaneOption = {
      isMultiplePictures: true,
      sourceType: TQ.MatType.OPUS,
      modalType: TQ.MatType.OPUS
    };

    vm.props = DataService.getProps(TQ.MatType.OPUS);
    $timeout(function() {
      state.editorMode = vm.EDITOR_MODE.MY_WORK;
    });
  }

  function hasOpus() {
    var opuses = DataService.getProps(TQ.MatType.OPUS);
    return (opuses && opuses.length > 0);
  }

  function isUserOperation(evt) {
    return (!!evt);
  }

  this.openSearchPane = function() {
    var option = {
      isSearch: true,
      isMultiplePictures: false,
      sourceType: _currentPaneOption.sourceType,
      modalType: _currentPaneOption.modalType
    };

    _openModal(option);
  };

  this.switchToPeople = function() {
    var option = {
      isMultiplePictures: true,
      sourceType: TQ.MatType.PEOPLE,
      modalType: PEOPLE
    };

    switchModal(option);
  };

  this.openPeoplePane = function(evt) {
    vm.switchToPeople();
    vm.openMaterialPane(evt);
    registerFileChangeHandler();
  };

  this.switchToProp = function() {
    var option = {
      isMultiplePictures: true,
      sourceType: vm.resource.type,
      modalType: PROP
    };

    switchModal(option);
  };

  this.openPropPane = function(evt) {
    vm.switchToProp();
    vm.openMaterialPane(evt);
    registerFileChangeHandler();
  };

  function onOpenWcy(prop) {
    if (isDithering) {
      return;
    }
    ditherStart();

    _closeModal();

    for (var i = 0; !prop && (i < selectedEle.length); i++) {
      if (!selectedEle[i]) {
        continue;
      }
      prop = selectedEle[i];
      break;
    }

    openOpus(prop);
  }

  function openGoodOpus(prop) {
    /* 教训:  改数据，比改代码好。
    因为测试数据，可以方便地删除，甚至在运行过程中删除，但是代码，容易忘记
     */
    if (removeListenerLocationChange) {
      removeListenerLocationChange();
      removeListenerLocationChange = null;
    }
    if (isTopic(prop)) {
      vm.openTopicDetail(prop);
    } else {
      if (vm.state.topicPage !== TOPIC_PAGE.NO) {
        vm.closeTopicPage();
      }
      openOpus(prop);
    }
  }

  function openOpus(prop) {
    if (prop && prop.wcyId > 0) {
      WCY.getWcyById(prop.wcyId);
    }
  }

  this.closePane = function(isForced) {
    if (isDithering && !isForced) {
      return;
    }
    ditherStart();

    clearFlags();
    _closeModal();
  };

  this.pickProp = function(prop) {
    if (isDithering) {
      return;
    }

    if (!prop) {
      return;
    }

    if (_currentPaneOption.sourceType === TQ.MatType.OPUS) {
      return onOK(prop);
    }

    prop.selected = !prop.selected;
    if (prop.selected) {
      selectedEle.push(prop);
    } else {
      var id = selectedEle.indexOf(prop);
      selectedEle.splice(id, 1);
    }

    if ((_currentPaneOption.sourceType === TQ.MatType.BKG) ||
      (_currentPaneOption.sourceType === TQ.MatType.PROP) ||
      (_currentPaneOption.sourceType === TQ.MatType.PEOPLE)) {
      return onOK(prop);
    }
    ditherStart();
  };

  this.onApplyMusic = function(prop, isCrossLevel) {
    if (isDithering || !prop || (_currentPaneOption.sourceType !== TQ.MatType.SOUND)) {
      return;
    }
    vm.onStopTryMusic(); // 先停止正在播放的声音（如果有的话）
    selectedEle.splice(0);
    selectedEle.push(prop);
    prop.isCrossLevel = !!isCrossLevel;
    return onOK(prop);
  };

  this.onDeleteSound = function(prop) {
    EditorService.deleteSound(prop.ele);
    var id = sounds.indexOf(prop);
    sounds.splice(id, 1);
    console.log(prop);
  };

  this.onBanSound = function(prop) {
    prop.matType = TQ.MatType.SOUND;
    prop.userId = TQ.userProfile.ID;
    EditorService.banMat(prop);
  };

  this.onTryMusic = function(prop) {
    if (isDithering || !prop || (_currentPaneOption.sourceType !== TQ.MatType.SOUND)) {
      return;
    }

    if (prop && prop.path) {
      if (_currentMusic && prop.path === _currentMusic.path) {
        vm.onStopTryMusic();
      } else {
        if (TQ.Utility.isSoundResource(prop.path) ||
          (TQUtility.isBlobUrl(prop.path) && (prop.type === TQ.ElementType.SOUND))) {
          TQ.SoundMgr.play(prop.path);
          _currentMusic = prop;
        } else {
          TQ.MessageBox.promptWithNoCancel(TQ.Utility.getExtension(prop.path) + "格式的声音： 暂时不支持的格式");
        }
      }
    }
  };

  this.onStopTryMusic = function() {
    if (_currentMusic && _currentMusic.path) {
      TQ.SoundMgr.stopAllDirectSound();
      _currentMusic = null;
    }
  };

  this.getTryingMusicStyle = function(prop) {
    if (_currentMusic && prop && (_currentMusic.path === prop.path)) {
      return "mmx_music_list_con";
    }
    return "";
  };

  this.isTryingMusic = function(prop) {
    return (_currentMusic && prop && (_currentMusic.path === prop.path));
  };

  this.doAddSound = function() {
    if (isDithering) {
      return;
    }
    ditherStart();

    _closeModal();
    for (var i = 0; i < selectedEle.length; i++) {
      const prop = selectedEle[i];
      if (!prop) {
        continue;
      }

      var name = (prop) ? prop.name : "";
      _prompt("添加sound: " + name);
      var path = prop.path;
      EditorService.insertSound(path, name, prop.isCrossLevel);
      break;
    }
  };
  this.onConfigMusic = function(prop) {
    if (!prop) {
      return;
    }
    if (isDithering) {
      return;
    }
    ditherStart();
    var name = (prop) ? prop.name : "";
    _prompt("添加sound: " + name);
    var config = {
      matId: prop.id,
      matType: TQ.MatType.SOUND
    };

    // sample sprite
    /*
        config.extra = {
            spriteMap: [
                'smile',
                'cry',
                'afraid'
            ],
            sprite: {
                'smile': [0, 1500],
                'cry': [2000, 800],
                'afraid': [3000, 1500]
            }
        };
*/

    if (config.extra) {
      EditorService.addSprite(config);
    }
  };

  this.onAddImageProps = function() {
    if (isDithering) {
      return;
    }
    ditherStart();

    _closeModal();
    for (var i = 0; i < selectedEle.length; i++) {
      const prop = selectedEle[i];
      if (!prop) {
        continue;
      }

      var name = (prop) ? prop.name : "";
      _prompt("添加道具: " + name);

      if (isComponent(prop) && prop.iComponentId < 0) {
        TQ.MessageBox.promptWithNoCancel("此元件版本已经过期，请改用其他元件! 或联系管理员升级");
        break;
      }

      doAddImageProp(prop);
    }
  };

  function doAddImageProp(prop) {
    var desc = {
      src: prop.path,
      type: TQ.MatType.toElementType(_currentModalType),
      eType: TQ.MatType.toEType(_currentModalType),
      autoFit: TQ.Element.FitFlag.WITHIN_FRAME,
      x: state.x,
      y: state.y
    };

    if (isComponent(prop)) {
      desc.src = TQ.Config.OPUS_HOST + "/wcy/" + TQ.Utility.wcyId2ShareCode(prop.iComponentId);
      desc.type = TQ.ElementType.GROUP_FILE;
      desc.x = TQ.Config.workingRegionWidth / 2;
      desc.y = TQ.Config.workingRegionHeight / 2;
    }

    if (isChangeSkinStarted) {
      isChangeSkinStarted = false;
      return EditorService.changeSkin(prop.path);
    } else {
      EditorService.insertImageDesc(desc);
    }
  }

  function onBanMat() {
    if (isDithering) {
      return;
    }
    ditherStart();
    _closeModal();
    for (var i = 0; i < selectedEle.length; i++) {
      const prop = selectedEle[i];
      if (!prop) {
        continue;
      }
      if ((user.ID === prop.authorId) || user.canAdmin || user.canBan) {
        prop.matType = modalType2MatType(_currentModalType);
        EditorService.banMat(prop);
      } else {
        TQ.MessageBox.toast(TQ.Locale.getStr("You are not authorized to delete this material"));
        break;
      }
    }
  }

  function onBan(prop, evt) {
    if (evt) {
      evt.stopPropagation();
      evt.stopImmediatePropagation();
      evt.preventDefault();
    }
    prop.matType = _currentPaneOption.sourceType;
    switch (_currentPaneOption.sourceType) {
      case TQ.MatType.OPUS:
        EditorService.banOpus(prop);
        break;
      case TQ.MatType.TOPIC:
        EditorService.banTopic(prop);
        break;
      default:
        EditorService.banMat(prop);
    }
  }

  function onPublish(prop, evt) {
    if (evt) {
      evt.stopPropagation();
      evt.stopImmediatePropagation();
      evt.preventDefault();
    }

    switch (_currentPaneOption.sourceType) {
      case TQ.MatType.OPUS:
        EditorService.shareOpus(prop);
        break;

      case TQ.MatType.TOPIC:
        EditorService.shareTopic(prop);
        break;

      default:
        EditorService.shareMat(prop);
    }
  }

  this.setSize = function() {
    EditorService.setSize();
  };

  this.onDeleteWork = function() {
    // 在自己的作品列表中，删除作品？？？
    if (isDithering) {
      return;
    }
    ditherStart();

    for (var i = 0; i < selectedEle.length; i++) {
      const prop = selectedEle[i];
      if (prop) {
        DataService.deleteWork(prop);
        $timeout(function() {
          vm.props = DataService.getProps(_currentPaneOption.sourceType);
        });
      }
    }
    selectedEle.splice(0);
  };

  this.confirmClip = function() {
    TQ.ImageCliper.confirm();
    vm.clip = null;
  };
  this.cancelClip = function() {
    TQ.ImageCliper.cancel();
    vm.clip = null;
  };
  this.turnOnClip = function() {
    vm.clip = TQ.ImageCliper;
    vm.clipMask = 1;
    TQ.ImageCliper.setMask(1);
    $timeout();
  };
  this.turnOffClip = function() {
    vm.clipMask = 0;
    TQ.ImageCliper.setMask(0);
    $timeout();
  };

  function registerFileChangeHandler() {
    setTimeout(function() {
      let ee = document.getElementById("id-input-local-files");
      ee.removeEventListener("change", insertLocalFiles);
      ee.addEventListener("change", insertLocalFiles);

      ee = document.getElementById("id-input-sound-files");
      ee.removeEventListener("change", insertLocalFiles);
      ee.addEventListener("change", insertLocalFiles);

      ee = document.getElementById("id-input-camera");
      ee.removeEventListener("change", insertFromCamera);
      ee.addEventListener("change", insertFromCamera);
    });
  }

  this.insertFromMic = function() {
    const useDevice = true;
    insertFromLocal(useDevice, null);
  };

  this.clickBtnCamera = function(evt) {
    $("#id-input-camera").click();
  };

  this.clickBtnSound = function(evt) {
    $("#id-input-sound-files").click();
  };

  this.clickBtnAlbum = function(evt) {
    $("#id-input-local-files").click();
  };

  function insertFromCamera(evt) {
    const useDevice = true;
    insertFromLocal(useDevice, evt);
  }

  function insertLocalFiles(evt) {
    const useDevice = false;
    insertFromLocal(useDevice, evt);
  }

  function insertFromLocal(useDevice, evt) {
    const files = TQ.Utility.getFilesFromEvent(evt);
    if (!useDevice && (!files || files.length === 0)) {
      return;
    }

    if (!ensureLogin(function() { insertFromLocal(useDevice, evt); })) {
      return;
    }

    TQ.AssertExt.isTrue(TQ.userProfile.loggedIn, "先login");
    var matType = null;
    _closeModal();
    switch (_currentModalType) {
      case SOUND:
        matType = TQ.MatType.SOUND;
        lastVoiceRecording = null;
        TQ.SoundMgr.stopAll();
        if (useDevice) {
          TQ.OverlayMask.turnOn("id-mic-panel");
        }
        return EditorService.loadLocalSound(matType, useDevice, files, onLocalSoundLoaded);
      case BKG:
        matType = TQ.MatType.BKG;
        break;
      case PEOPLE:
        matType = TQ.MatType.PEOPLE;
        break;
      case PROP:
      default:
        matType = TQ.MatType.PROP;
        break;
    }

    if ((matType === TQ.MatType.BKG) || (matType === TQ.MatType.PEOPLE) || (matType === TQ.MatType.PROP)) {
      var callback = null;
      if ((TQ.Config.koutuOn) && ((matType === TQ.MatType.PEOPLE) || (matType === TQ.MatType.PROP))) {
        if (typeof koutuMain === "function") {
          callback = koutuMain;
        }
      }
      // vm.clip = TQ.ImageCliper;
      return EditorService.loadLocalImage(matType, useDevice, files, onLocalImageLoaded, callback);
    }

    function onLocalImageLoaded(desc, image64Data, matType) {
      var ele;
      if (isChangeSkinStarted) {
        isChangeSkinStarted = false;
        EditorService.changeSkin(image64Data, function(ele) {
          TQ.ResourceSync.local2Cloud(ele, image64Data, matType);
        });
      } else {
        ele = TQ.SceneEditor.addItem(desc);
        if (ele) {
          TQ.ResourceSync.local2Cloud(ele, image64Data, matType);
        }
      }
    }
  }

  function onLocalSoundLoaded(desc, fileOrBlob, matType) {
    desc.isCrossLevel = false; // 假设：本地文件和录音都是本场景的，只有素材库中才有跨场景的
    if (TQUtility.isSoundFile(fileOrBlob)) {
      TQ.SoundElement.setAsEffect(desc);
      doAddLocalSound(desc, fileOrBlob);
    } else { // 实时录音
      TQ.SoundElement.setAsDub(desc);
      lastVoiceRecording = {
        desc: desc,
        fileOrBlob: fileOrBlob
      };
      vm.onTryMusic({ path: desc.src, type: desc.type });
    }
  }

  function doAddLocalSound(desc, fileOrBlob) {
    vm.onStopTryMusic();
    const ele = TQ.SceneEditor.addItem(desc);
    TQ.SceneEditor.lastSoundElement = ele;
    TQ.ResourceSync.local2Cloud(ele, fileOrBlob, TQ.MatType.SOUND)
      .then(function() {

      },
      function() {
        if (state.isWxMiniProgram) {
          if (isMiniProgramGuest()) {
            TQ.MessageBox.promptWithNoCancel("声音保存不成功！请先“授权”再重新打开帖子!");
          } else {
            TQ.MessageBox.promptWithNoCancel("声音保存不成功！请重新打开帖子!");
          }
        } else {
          TQ.MessageBox.promptWithNoCancel("声音保存不成功！请重新登录!");
        }
      });
  }

  this.isRecordingAudioMode = function() {
    // 微信小程序webview的刷新有问题：有以下三个方面要注意
    // --- js 中getter更新机制的问题
    // 1） TQ.State.isRecordingAudioMode这个getter的求解滞后的，不是实时的，（所以需要timeout）
    // 2) 在UI的ng-hide竟然没有反应，即使加了timeout
    //    ===> 改为用函数， 加timeout

    // --- cache控制header的问题，
    // 1) 新发布的版本，
    // *** ）js文件都是hash名字，所以是立即刷新的
    // *** ）html文件都是要求不cache的，所以是立即刷新的
    //    ===> 从服务器设置header中的max-age

    // --- 微信自己缓存的问题
    // 退出账号？关机？
    return (state.requestToRecordAudio && state.isRecordingAudioMode);
  };

  this.isAudioRecording = function() {
    return TQ.AudioRecorder.isRecording;
  };

  this.isAudioPending = function() {
    return TQ.AudioRecorder.isPending;
  };

  this.isBottomBarVisible = function() {
    return (!TQUtility.isMiniProgramWebView() && !state.levelThumbAtBottom &&
      state.editorMode === TQ.SceneEditor.MODE.EDIT &&
      !vm.amPaneOn && (vm.levelThumbs.length > 0));
  };

  this.stopAudioRecording = function() {
    if (TQ.AudioRecorder.isRecording) {
      return TQ.AudioRecorder.stop();
    }
  };

  this.restartSoundRecoding = function() {
    lastVoiceRecording = null;
    vm.onStopTryMusic();
    EditorService.loadLocalSound(TQ.MatType.SOUND, true, null, onLocalSoundLoaded);
  };

  this.acceptSound = function() {
    TQ.OverlayMask.turnOff();
    TQ.AudioRecorder.accept();
    vm.onStopTryMusic();
    if (lastVoiceRecording) {
      EditorService.deleteDub();
      doAddLocalSound(lastVoiceRecording.desc, lastVoiceRecording.fileOrBlob);
      lastVoiceRecording = null;
    }
  };

  // 私有的函数
  function _initModal(tempId, modalId, callback) {
    TQ.Log.debugInfo("_initModal" + tempId);
    $ionicModal.fromTemplateUrl(tempId, {
      scope: $scope,
      animation: "slide-in-up",
      // backdropClickToClose: false, // true: default
      // hardwareBackButtonClose: true,
      focusFirstInput: true // 在IOS下， 迫使显示keyboard； 在android下， 要用keyboardPlugin
    }).then(function(modal) {
      _modals[modalId] = modal;
      if (callback) {
        callback();
      }
    });
  }

  function _prompt(msg) {
    $timeout(function() {
      vm.info = msg;
    });
  }

  function _openModal(option) {
    switchModal(option);
    _currentModal.show();
  }

  function switchModal(option) {
    _currentPaneOption = option;
    if ([BKG, SOUND, PROP, PEOPLE].indexOf(option.modalType) >= 0) {
      _currentMatPaneOption = option;
    }
    vm.isMultiplePictures = option.isMultiplePictures;
    vm.isMyWorkPane = !!option.isMyWorkPane;
    if (!_currentModal) {
      _currentModal = _modals[defaultModal];
    }
    _currentModalType = option.modalType;
    vm.isMusic = (_currentModalType === TQ.MatType.SOUND);
    vm.isBackground = (_currentModalType === TQ.MatType.BKG);
    if (option.isSearch) {
      var keywords = "";
      switch (option.sourceType) {
        case TQ.MatType.PROP:
          keywords = "plant";
          break;
        case TQ.MatType.PEOPLE:
          // keywords = "animal";
          keywords = "people";
          break;
        case TQ.MatType.BKG:
        default:
          keywords = "";
          break;
      }
      vm.props = MatLibService.getProps(keywords);
    } else {
      vm.props = DataService.getProps(_currentModalType);
    }

    selectedEle.splice(0);
    clearFlags();
    TQ.Log.debugInfo("open modal: " + _currentModal);
    $timeout();
  }

  function _closeModal() {
    document.removeEventListener("click", closeModalByBackdrop);
    document.removeEventListener("touch", closeModalByBackdrop);
    document.removeEventListener("touchstart", closeModalByBackdrop);
    TQ.Log.debugInfo("close modal: " + _currentModal);
    TQ.Assert.isTrue(_currentModal != null);
    if (_currentModal) {
      _currentModal.hide();
      _currentModal = null;
    }
  }

  // Text modal:
  var selectedElement;
  this.onAddText = function($event) {
    EditorService.setAddMode();
    isAddingText = true;
    textEditorStatus = TextEditor.STATUS_INPUT_TEXT;
    textEditor.content = "";
    openTextPane($event);
    // $ionicScrollDelegate.getScrollView().options.scrollingY = true;
    // $ionicScrollDelegate.getScrollView().options.scrollingX = false;
  };

  function openTextPane(evt) {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault(evt);
    }
    textPaneInit();
    TQ.InputMap.registerAction(TQ.InputMap.ENTER, function() {
      vm.onTextEditorOK();
    });
    if (textInputEle) {
      updateTextPane();
      $timeout(function() {
        textInputEle.focus();
        textInputEle.select();
      });
    } else {
      TQ.MessageBox("系统错误ET101, 请联系管理员");
    }
  }

  function updateTextPane() {
    var needToClose = false;
    state.textEditor.isOpening = true;
    TQ.Log.debugInfo("open text pane, isDithering = " + isDithering);
    if (isDithering) {
      return;
    }

    ditherStart();

    if (!isAddingText) {
      selectedElement = TQ.SelectSet.peek();
      if (selectedElement && selectedElement.isText()) {
        textEditor.content = selectedElement.getText();
        textEditor.color = selectedElement.getColor();
        textEditor.fontSize = selectedElement.getFontSize();
      } else {
        needToClose = true;
      }
    } else {
      selectedElement = null;
    }
    if (needToClose) {
      closeTextPane();
    } else {
      TQ.InputMap.turnOff();
      updateCssStyle();
      vm.textEditor.opened = true;
    }

    refreshSlider();
  }

  function updateCssStyle() {
    var scale = TQ.Utility.getWorld2DcScale();
    var fontSize = textEditor.fontSize * Math.min(scale.sx, scale.sy);
    textEditor.cssFontStyle = {
      "bold": textEditor.boldFlag,
      "color": textEditor.color,
      "font-family": TQ.Config.fontFace,
      "font-size": fontSize + "px"
    };
  }

  function onFontSizeChange(evt) {
    console.log(evt);
    updateCssStyle();
  }

  vm.onTextEditorOK = function() {
    var data = {
      text: textEditor.content,
      color: textEditor.color,
      fontSize: textEditor.fontSize
    };

    doAddOrUpdateText(data);
    closeTextPane();
  };

  this.onSelectColor = function(id) {
    textEditor.color = textEditor.colors[id];
    updateCssStyle();
  };

  function onMirrorX(event) {
    selectedElement = TQ.SelectSet.peek();
    if (!selectedElement) {
      return;
    }
    selectedElement.mirrorX();
  }

  function onMirrorY(event) {
    selectedElement = TQ.SelectSet.peek();
    if (!selectedElement) {
      return;
    }
    selectedElement.mirrorY();
  }

  function onMirrorBtn(event) {
    if (vm.isMirrorBtn || vm.amPaneOn) {
      return;
    }
    vm.isMirrorBtn = true;
    $timeout(function() {
      TQ.OverlayMask.startClickOtherPlaceToClose("mirrors_btn", closeMirrorTools);
    });
  }

  function closeMirrorTools() {
    TQ.OverlayMask.turnOff();
    vm.isMirrorBtn = false;
  }

  function onEdit(event) {
    selectedElement = TQ.SelectSet.peek();
    if (!selectedElement) {
      return;
    }

    isChangeSkinStarted = true;
    switch (selectedElement.getEType()) {
      case TQ.Element.ETYPE_BACKGROUND:
        vm.openBkgPane(event);
        break;
      case TQ.Element.ETYPE_PROP:
        vm.openPropPane(event);
        break;
      case TQ.Element.ETYPE_CHARACTER:
        vm.openPeoplePane(event);
        break;
      case TQ.Element.ETYPE_TEXT:
        textEditorStatus = TextEditor.STATUS_EDIT_TEXT;
        textEditor.currentElement = selectedElement;
        openTextPane(event);
        break;
      default:
        TQ.Log.debugInfo("未处理的元素");
        break;
    }
  }

  function doAddOrUpdateText(data) {
    if (isDithering) {
      return;
    }

    ditherStart();
    if (!isAddingText && isChangeSkinStarted && selectedElement) {
      EditorService.setTextProperty(selectedElement, data);
      isChangeSkinStarted = false;
    } else {
      selectedElement = TQ.SelectSet.peek();
      var pos = { x: currScene.getDesignatedWidth() / 2, y: currScene.getDesignatedHeight() / 2 };// EditorService.getTextCursor();
      EditorService.insertText(textEditor.content, pos.x, pos.y, data);
      isAddingText = false;
    }

    if (data.ok) {
      closeTextPane();
    }
  }

  function closeTextPane() {
    TQ.InputMap.removeAction(TQ.InputMap.ENTER);
    if (state.textEditor.isOpening) {
      state.textEditor.isOpening = false;
      textEditor.opened = false;
      textEditor.currentElement = null;
      TQ.InputMap.turnOn();
    }
  }

  function confirmTextInput() {
    TQ.InputMap.turnOn();
  }

  vm.data2 = {};
  // vm.data2.sceneId = 12853
  // vm.data2.sceneId = 12585; // Bear
  vm.data2.sceneId = 14959; // straw berry
  // vm.data2.sceneId = 14961;  // 比例变换测试
  // vm.data2.sceneId = 15089; // 投票
  var _editorInitialized = false;

  function fillShareData() {
    opusShareData.title = currScene.title;
    opusShareData.description = currScene.description;
  }

  function applyShareData() {
    currScene.title = opusShareData.title;
    currScene.description = opusShareData.description;
    if (!vm.canEdit()) {
      vm.saveWork();
    }
  }

  $scope.$on("slideEnded", function() {
    if (vm.state.timeSetting) {
      $timeout(function() {
        saveAndPreviewAm();
      });
    }
  });

  $scope.$on(TQ.Scene.EVENT_READY, function() {
    if (vm.state.isLoadingIntro) {
      onIntroOpened();
    }

    fillShareData();
    updatePlayOnlyFlag();
    initEditor();
    if (state.editorMode < vm.EDITOR_MODE.FIRST) {
      if (TQ.State.isPlayOnly || hasOpusSpecified) {
        gotoEditAndPlayPage();
      } else {
        vm.toFirstPage();
      }
    } else if (state.editorMode >= vm.EDITOR_MODE.FIRST) {
      gotoEditAndPlayPage();
    }

    state.readyToShow = true;
    checkLoginState();
    currScene.onReadyToShow(function() {
      removeWelcomePage();
    });
    updateUrl();
    if (state.isPlayOnly && state.needToShowStartToPlay) {
      $timeout(function() { // 强制屏幕刷新
        TQ.State.needToShowStartToPlay = false;
        EditorService.stop();
        // 	vm.showStartToPlay = true;
        TQ.MessageBox.promptWithNoCancel(TQ.Locale.getStr("Click OK to start play"), function() {
          TQ.State.needUserClickToPlayAV = false;
          if (TQUtility.isMiniProgramWebView() && (!TQ.userProfile.loggedIn || isStaleWxGuest())) {
            if (TQ.QueryParams.wxCode) {
              var nickname = TQ.QueryParams.wxNickName || "微信用户";
              UserService.loginFromWx(TQ.QueryParams.wxCode, nickname);
              // .then(onLoggedIn);
            }
          }
          doPreview();
        });
      }, 100);
    } else {
      TQ.State.needUserClickToPlayAV = false;
    }
    // 如果只是打开帖子播放， 没必要获取这些信息
    // 如果是打开首页，需要显示最新作品， 喜欢需要此信息
    if (!state.isPlayOnly) {
      $timeout(function() {
        DataService.reload(); //  根据主题， 重新获取数据
      });
    }
  });

  $scope.$on(TQ.Scene.EVENT_END_OF_PLAY, function() {
    if (EditorService && EditorService.forceToRenderSlider) {
      $timeout(function() {
        refreshSlider();
      }, 500);
    }

    onEndOfPlay();
  });

  function onEndOfPlay() {
    if (vm.amPaneOn) {
      TQ.OverlayMask.turnOff();
      $timeout();
    } else {
      openActionBoard();
    }
  }

  function loadEditor() {
    if (!editorLoaded) {
      editorLoaded = true;
      loadKoutuAsync();
      loadEditModeMat();
      setupEditMode();
    }
  }

  function updateUrl() {
    fillShareData();
    var opMode = (TQ.State.isPlayOnly ? "opus" : "edit");
    backButtonHandlerOff();
    var shareCode = WCY.getShareCode();
    if (!shareCode) {
      var wcyId = TQ.Scene.getWcyId();
      if (wcyId >= 0) {
        shareCode = TQ.Utility.wcyId2ShareCode(wcyId);
      }
    }
    if (shareCode) {
      var queryString = "";
      if (currScene) {
        queryString = "?op=" + opMode;
        queryString += "&sc=" + shareCode;
        if (currScene.ssPath) {
          queryString += "&sspath=" + encodeURIComponent(TQ.RM.toFullPathFs(currScene.ssPath));
        }
        if (!currScene.title || (currScene.title === TQ.Scene.getDefaultTitle())) {
          currScene.title = "图话--送祝福！";
        }
        if (!currScene.description || (currScene.description === TQ.Scene.getDefaultTitle())) {
          currScene.description = "祝您春节快乐, 阖家幸福！";
        }
        queryString += "&st=" + encodeURIComponent(currScene.title);
        queryString += "&sd=" + encodeURIComponent(currScene.description);
        $timeout(function() {
          vm.readyToShare = true;
        }, 1000); // 延时，以确保微信收到变化
      }
    }
    if (removeListenerLocationChange) {
      removeListenerLocationChange();
      removeListenerLocationChange = null;
    }

    if (!queryString) {
      queryString = "";
    }
    location.hash = "#/do" + queryString;
    $timeout(WCY.onUrlChanged, 300);
    $timeout(function() {
      backButtonHandlerOn();
    }, 2000);

    TQ.State.selfUpdateUrl = location.hash;
    if (!removeListenerLocationChange) {
      removeListenerLocationChange = $scope.$on("$locationChangeStart", onLocationChange);
    }
  }

  function onAppStarted() {
    // TQ.Log.setLevel(TQ.Log.INFO_LEVEL);
    var opus = TQ.QueryParams.shareCode;
    if (!opus) {
      TQ.State.isPlayOnly = false; // 控制dataServere的加载
    }

    EditorService.initialize();

    if (TQ.QueryParams.hideMenu) { // hideMenu
      TQ.PreviewMenu.disableWatch();
      TQ.State.showTimer = false;
    }

    if (TQ.QueryParams.openAsTopic === "topic") { // openAsTopic
      var topicId = TQ.QueryParams.topicId;
      var title = TQ.QueryParams.topicTitle;
      var introId = TQ.Utility.getWcyIdFromUrl(location.href);
      var topic = {
        _id: topicId,
        introId: introId,
        title: title
      };

      vm.openTopicIntro(topic);
    } else if (opus) {
      hasOpusSpecified = true;
      WCY.getWcy(opus);
    } else {
      $timeout(function() {
        vm.toFirstPage();
      });
    }
    DataService.initialize();
    // WCY.test(vm.data2.sceneId);
    // $cordovaProgress.hide();
  }

  function onShowToucInfo(e) {
    TQ.Log.debugInfo(e.type);
  }

  this.params = 0;
  this.getTextMsg = function() {
    var msg = ((!currScene) || (!currScene.currentLevel) || (!currScene.currentLevel.name))
      ? "" : currScene.currentLevel.name;

    return msg + ": " + TQ.FrameCounter.t();
  };

  this.modify = function(event) {
    EditorService.setModifyMode();
  };

  this.addLevel = function() {
    if (currScene.levelNum() < MAX_LEVEL_NUM) {
      vm.onStopTryMusic();
      var newLevelId = EditorService.addLevel();
      if (newLevelId >= 0) {
        $timeout(function() {
          vm.onSelectLevel(null, newLevelId);
          $timeout(function() {
            vm.openBkgPane();
          });
        }, 100);
      }
    } else {
      TQ.MessageBox.prompt("最多" + MAX_LEVEL_NUM + "个场景");
    }
  };

  this.adjustLevelTime = function(direction) {
    if (!direction) {
      direction = 1;
    } else if (direction < 0) {
      direction = -1;
    } else {
      direction = 1;
    }
    var maxT = currScene.currentLevel.getTime();
    currScene.currentLevel.setTime(Math.round(maxT * (1 + 0.2 * direction)));
    updateAmPane();
  };

  this.duplicateCurrentLevel = function(evt) {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }
    closeLevelPanel();
    EditorService.duplicateCurrentLevel();
    _currentThumb = -1; // 迫使下次long pressed的时候，重新选择当前level
  };

  vm.onDeleteLevel = function(event, id) {
    closeLevelPanel();
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    TQ.MessageBox.prompt(TQ.Locale.getStr("Delete it? Deleted scene can not be restored, are you sure?"), function() {
      vm.onStopTryMusic();
      _currentThumb = (_currentThumb >= vm.levelThumbs.length - 1) ? _currentThumb - 1 : _currentThumb;
      _currentThumb = (_currentThumb <= 0) ? 0 : _currentThumb;
      if (currScene.levelNum() > 1) {
        EditorService.deleteLevel(id);
      } else {
        EditorService.emptyScene();
      }
    });
  };

  vm.onDeleteCurrentLevel = function(event) {
    const levelId = currScene.currentLevelId;
    vm.onDeleteLevel(event, levelId);
  };

  function inspectPrevLevel() {
    // EditorService.pause();
    EditorService.gotoPreviousLevel();
  }

  function inspectToggle() {
    if (TQ.FrameCounter.isPaused()) {
      EditorService.resume();
    } else {
      EditorService.pause();
    }
  }

  function inspectNextLevel() {
    // EditorService.pause();
    EditorService.gotoNextLevel();
  }

  this.isPaused = function() {
    return TQ.FrameCounter.isPaused();
  };

  this.onSelectLevel = function(event, id) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    vm.showFullThumbs = true;
    vm.onStopTryMusic();
    _currentThumb = id;
    EditorService.gotoLevel(id);
  };

  this.onHoldLevel = function(evt, id) {
    if (_currentThumb === id) {
      vm.state.showLevelPanel = true;
      if (evt) {
        evt.stopPropagation();
        evt.preventDefault();
      }
      $timeout(function() {
        TQ.OverlayMask.startClickOtherPlaceToClose("id-level-panel", closeLevelPanel);
      });
    } else {
      return vm.onSelectLevel(evt, id);
    }
  };

  vm.onHoldCanvas = function() {
    selectedElement = TQ.SelectSet.peek();
    if (!selectedElement) {
      return;
    }
    if (TQ.Trsa3.isDragging()) {
      return;
    }
    if (TQ.Element.ETYPE_TEXT === selectedElement.getEType()) {
      return onEdit(event);
    }
  };

  function closeLevelPanel() {
    vm.state.showLevelPanel = false;
    vm.showFullThumbs = false;
    TQ.OverlayMask.turnOff();
  }

  this.isHold = function(id) {
    return vm.state.showLevelPanel && TQ.Level.isCurrent(id);
  };

  this.getActiveLevelStyle = function(id) {
    return (TQ.Level.isCurrent(id) ? "thick-shadow-border" : "");
  };

  this.cancelHold = function() {
    _currentThumb = -1;
  };

  function nextPage(evt) {
    console.log(evt);
    vm.props = vm.props.parent.getPage(1);
  }

  vm.nextPageOpus = function() {
    vm.opusList = vm.opusList.nextPage();
  };

  vm.prevPageOpus = function() {
    vm.opusList = vm.opusList.previousPage();
  };

  function onOK(item) {
    switch (_currentPaneOption.sourceType) {
      case TQ.MatType.OPUS:
        return onOpenWcy(item);
      case TQ.MatType.SOUND:
        return vm.doAddSound(item);
      case TQ.MatType.BKG:
      case TQ.MatType.PEOPLE:
      case TQ.MatType.PROP:
      default:
        return vm.onAddImageProps(item);
    }
  }

  function prevPage() {
    vm.props = vm.props.parent.getPage(-1);
  }

  this.preview = function(evt) {
    if (TQ.TouchManager && TQ.TouchManager.hasStarted()) {
      TQ.TouchManager.stop();
    }

    vm.showStartToPlay = false;
    closeTextPane();
    if (!TQ.SelectSet.isEmpty()) {
      TQ.SelectSet.empty(); // 清空选择集，避免BBox导致的黑框
      currScene.render();
    }
    if (!currScene.isAllDataReady()) {
      return TQ.MessageBox.toast(TQ.Locale.getStr("please wait for fully loading..."));
    }

    if (vm.amPaneOn) {
      this.closeAmPane();
    }
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    if (TQ.Config.LockPostImageEnabled && currScene.hasScreenShotManual && !!currScene.ssPath) {
      TQ.MessageBox.confirm("此用户设置了保护，不允许修改封面插图");
      vm.readyToShare = true;
    } else {
      if (TQ.userProfile.loggedIn && !TQ.State.isPlayOnly && // 有资格编辑，是你的作品
        (WCY.needToSave())) { // 有更新， // || !currScene.ssPath
        currScene.ssPath = null;
        vm.readyToShare = false;
      }
    }

    if (!TQ.State.isPlayOnly) {
      vm.saveWork();
    }
    doPreview();
    showShareBtn();
  };

  this.saveWorkOnStage = function() {
    if (!TQ.State.isPlayOnly) {
      vm.saveWork();
    }
  };

  function interact(evt) {
    if (!TQ.TouchManager) {
      return TQ.MessageBox.promptWithNoCancel("请先开通互动模式！");
    }
    if (!currScene.isAllDataReady()) {
      return TQ.MessageBox.toast(TQ.Locale.getStr("please wait for fully loading..."));
    }

    if (!TQ.TouchManager.hasStarted()) {
      TQ.TouchManager.start();
    }

    closeTextPane();
    if (!TQ.SelectSet.isEmpty()) {
      TQ.SelectSet.empty(); // 清空选择集，避免BBox导致的黑框
      currScene.render();
    }

    if (vm.amPaneOn) {
      this.closeAmPane();
    }
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    WCY.stopAutoSave();
    showShareBtn();
    TQ.FrameCounter.gotoBeginning();
    TQ.Interact.start();
  }

  function doPreview() {
    state.editorMode = vm.EDITOR_MODE.PREVIEW;
    inspectLevelsStart();
    if (!state.isPlaying) {
      EditorService.preview();
    }
  }

  function showShareBtn() {
    $("#share_btn").show();
  }

  this.toggleRecord = function() {
    if (state.isRecording) { // for "video" recording only， may not include the audio, if audio is off
      EditorService.stopRecord();
      EditorService.toggleSpeed();
      vm.flashButton3 = "";
      vm.oneButtonWidth = "";
      state.isRecording = false;
    } else {
      vm.flashButton3 = "am-warning-flash3";
      vm.oneButtonWidth = "onebutton--width";
      TQ.SoundMgr.stopAll();
      $timeout(function() {
        if (state.isRecording) { // 防止flash过程被终止
          EditorService.startRecord();
          EditorService.toggleSpeed();
        }
      }, 3000);
      state.isRecording = true;
    }
  };

  this.onMoveUpLayer = function(event) {
    startUndoRedoDither();
    vm.hideAccButton = true;
    TQ.MoveCtrl.onMoveUpLayer(event);
  };

  this.onMoveDownLayer = function(event) {
    startUndoRedoDither();
    vm.hideAccButton = true;
    TQ.MoveCtrl.onMoveDownLayer(event);
  };

  this.onDelete = function(event) {
    EditorService.onDelete(event);
  };

  this.undo = function() {
    startUndoRedoDither();
    vm.hideAccButton = true;
    TQ.CommandMgr.undo();
  };

  this.redo = function() {
    startUndoRedoDither();
    vm.hideAccButton = true;
    TQ.CommandMgr.redo();
  };

  function startUndoRedoDither() {
    isRedoUndoDithering = true;
    setTimeout(function() {
      isRedoUndoDithering = false;
    }, 300);
  }

  this.pinIt = function() {
    EditorService.pinIt();
  };

  this.hideOrShow = function() {
    EditorService.hideOrShow(false);
  };

  this.eraseAnimeTrack = function() {
    EditorService.eraseAnimeTrack(true);
  };

  // for bottom bar;
  this.toAddMode = function(options) {
    if (!ensureLogin(vm.toAddMode)) {
      return;
    }
    if (!editorLoaded) {
      updateIde();
    }
    TQDebugger.Panel.logInfo("toAddMode, Ctrl:" + state.requestToRecordAudio + "," + state.isRecordingAudioMode);
    if (TQ.State.isPlayOnly) {
      TQ.MessageBox.prompt(TQ.Locale.getStr("forkIt?"), forkIt, function() {
        vm.preview();
        $timeout(); // 强制刷新UI
      });
    } else {
      if (state.editorMode !== vm.EDITOR_MODE.EDIT) {
        if (isPreviewMode() && currScene) {
          EditorService.stop();
        }

        closeActionBoard();
        EditorService.toAddMode(options);
        _currentThumb = 0;
        state.editorMode = vm.EDITOR_MODE.EDIT;
      } else {
        vm.hideAccButton = true;
      }
    }
    $timeout(function() {
      TQDebugger.Panel.logInfo("toAddMode, Ctrl, timeout:" + state.requestToRecordAudio + "," + state.isRecordingAudioMode);
    });
  };

  function isPreviewMode() {
    return state.isPreviewMode || (state.editorMode === vm.EDITOR_MODE.PREVIEW);
  }

  this.toSoundRecordingMode = function() {
    TQDebugger.Panel.logInfo("Click, enter1122: " + state.requestToRecordAudio + "," + state.isRecordingAudioMode);
    if (!ensureLogin(vm.toSoundRecordingMode)) {
      return;
    }

    state.requestToRecordAudio = true; // 在preview的时候，清除
    TQDebugger.Panel.logInfo("Click, leave:" + state.requestToRecordAudio + "," + state.isRecordingAudioMode);
    vm.toAddMode();
  };

  this.deleteElement = function() {
    EditorService.delete();
  };

  function createWcy() {
    TQ.Log.debugInfo("_initialized = " + _initialized);
    // 如果是新文件， 则弹出tag录入框
    WCY.createScene({
      filename: TQ.Config.UNNAMED_SCENE_ID,
      screenshotName: null
    });
    TQ.State.isPlayOnly = false;
    $timeout(vm.toAddMode);
  }

  this.uploadScreenShotManually = function() {
    if (TQ.State.isPlayOnly) {
      return TQ.MessageBox.prompt("只有作者本人才能使用这一功能！");
    }

    currScene.hasScreenShotManual = true;
    uploadScreenShot();
  };

  function uploadScreenShot(newScreenshot) {
    if (TQ.Config.LockPostImageEnabled && currScene.hasScreenShotManual) {
      return;
    }
    if (TQ.State.isPlayOnly) {
      return TQ.MessageBox.prompt("只有作者本人才能使用这一功能！");
    }
    return WCY.uploadScreenshot(newScreenshot, onSuccess, onError);

    function onError(e) {
      TQ.Log.error("截图保存出错了！");
      TQ.Log.error(e);
    }

    function onSuccess(res) {
      TQ.Log.info("截图保存成功！");
      var data = (!res) ? null : res.data;
      var baseUrl = "http://res.cloudinary.com/eplan/image/upload/";

      if (data && data.url) {
        vm.data.screenShotUrl = baseUrl + data.url;
      } else {
        vm.data.screenShotUrl = baseUrl + currScene.ssPath;
      }
    }
  }

  this.saveWork = function() {
    if (!ensureLogin(vm.saveWork)) {
      return;
    }

    if (!WCY.needToSave()) {
      return;
    }
    if (TQ.State.isPlayOnly) {
      return TQ.MessageBox.toast("只有作者本人才能使用这一功能！");
    }
    TQ.AssertExt.isTrue(TQ.userProfile.loggedIn, "先login");
    if (!currScene.isAllDataReady()) {
      return $timeout(vm.saveWork, 500);
    }
    if (currScene.isSaved) {
      return;
    }
    return doSaveWork();
  };

  function doSaveWork(newScreenshot) {
    if (!!currScene && !currScene.ssPath && !newScreenshot) {
      return TQ.ScreenShot.getForPostAsync(function(newImage) {
        doSaveWork(newImage);
      });
    }

    function updateShareFlag(httpResult) {
      if (httpResult && httpResult.data && httpResult.data.ssPath && TQ.Scene.isSameOpus(httpResult.localIdCached)) {
        var wcyId = httpResult.data.wcyId;
        if (wcyId >= 0) {
          EditorService.shareOpus({ wcyId: wcyId }).then(function() {
            // TdDo： 只能是同一个opus才能此修改, 避免重复设置此标志，
            // 利用server 返回的flag
          });
        }
      }
    }

    return WCY.saveOpusAndScreenshot(function(httpResult) {
      // 保存，不改变Publish属性
      // if (httpResult && httpResult.data && httpResult.data.ssPath) {
      //  updateShareFlag(httpResult);
      // }
      updateUrl();
      TQ.MessageBox.toast(TQ.Locale.getStr("Saved-Successfully"));
    });
  }

  var message = "人人动画";
  var image = "http://bone.udoido.cn/mcImages/" + "p12504.png";
  var link = "http://bone.udoido.cn";
  var subject = "title etc";
  var file = "this is file";

  this.share = function() {
    // ToDo: 必须login，如果是自己的作品，先确保有ssPath，（没有则临时制作一个）。
    // 如果是别人的作品， 提示“要作者先制作招贴画”

    if (isDithering) {
      return;
    }
    ditherStart();

    this.uploadScreenShot(function(data) {
      file = data.url;
      // file = "file:///data/data/com.ionicframework.cardforvote731685/files/screenshots/nn0.png";
      // file = "http://res.cloudinary.com/eplan/image/upload/v1444880636/vote/ptjk5xzslm3poj0ovhqv.png";
      $cordovaSocialSharing
        .share(message, subject, file, link) // Share via native share sheet
        .then(function(result) {
          TQ.Log.debugInfo("fb success!");
          TQ.Log.debugInfo(result);
        }, function(err) {
          TQ.Log.debugInfo("fb error!");
          TQ.Log.debugInfo(err);
        });
    });
  };

  function confirmShare() {
    applyShareData();
    if (vm.state.shareToFbChecked) {
      EditorService.shareFbWeb();
    }
  }

  function createOpusLink() {
    var editUrl = window.location.href;
    return editUrl.replace("/edit/", "/opus/");
  }

  function createEmbedCodes() {
    var temp =
      "<div style=\"position: relative; top: 50%; transform: translate(0, -50%); width:800px; height:600px; margin-left: auto; margin-right: auto; margin-top: auto; margin-bottom: auto;\">" +
      "<iframe width=\"100%\" height=\"100%\" src=\"$URL$\" frameborder=\"0\"></iframe>" +
      "</div>";
    return temp.replace("$URL$", vm.opusUrl);
  }

  function copyEmbedCodes() {
    var copyText = document.getElementById("id-embed-codes");
    if (copyText) {
      copyText.select();
      document.execCommand("Copy");
      TQ.MessageBox.toast("the copes is copied to the clipboard, ready for paste");
    }
  }

  function copyOpusUrl() {
    var copyText = document.getElementById("id-opus-url");
    if (copyText) {
      copyText.select();
      document.execCommand("Copy");
      TQ.MessageBox.toast("the URL is copied to the clipboard, ready for paste");
    }
  }

  this.shareWx = function() {
    // ToDo: 必须login，如果是自己的作品，先确保有ssPath，（没有则临时制作一个）。
    // 如果是别人的作品， 提示“要作者先制作招贴画”
    if (isDithering) {
      return;
    }
    ditherStart();

    this.uploadScreenShot(function(data) {
      image = data.url;
      TQ.MessageBox.show("文件已经保存到了： " + data.url);
      // image = "file:///data/data/com.ionicframework.cardforvote731685/files/screenshots/nn0.png";
      // image = "http://res.cloudinary.com/eplan/image/upload/v1444880636/vote/ptjk5xzslm3poj0ovhqv.png";
      $cordovaSocialSharing
        .shareViaFacebook(message, image, link)
        .then(function(result) {
          TQ.Log.debugInfo("fb success!");
          TQ.Log.debugInfo(result);
        }, function(err) {
          TQ.Log.debugInfo("fb error!");
          TQ.Log.debugInfo(err);
        });
    });
  };

  // private function
  function clearFlags() {
    if (!vm.props) {
      return;
    }

    for (var i = 0; i < vm.props.length; i++) {
      if (vm.props[i]) {
        vm.props[i].selected = false;
      }
    }
  }

  function ditherStart() {
    TQ.Log.debugInfo("dither start...");
    isDithering = true;
    setTimeout(ditherEnd, 300);
  }

  function ditherEnd() {
    isDithering = false;
  }

  function toggleKoutu() {
    TQ.Config.koutuOn = !TQ.Config.koutuOn;
    if (TQ.Config.koutuOn) {
      if (!koutuLoaded) {
        loadKoutuAsync();
      }
      vm.Config.removeWhiteMarginOnly = false;
    }
  }

  function toggleRemoveWhiteMarginOnly() {
    vm.Config.removeWhiteMarginOnly = !vm.Config.removeWhiteMarginOnly;
    if (KT && KT.Config) {
      KT.Config.rescaleOnly = vm.Config.removeWhiteMarginOnly;
    }
  }

  function toggleSubObjectMode() {
    if (vm.InputCtrl.inSubobjectMode) {
      vm.InputCtrl.clearSubjectModeAndMultiSelect();
    } else {
      vm.InputCtrl.setSubobjectMode();
    }
  }

  function bottomBarOn() {
    state.bottomBarShow = true;
    if (bottomBar) {
      bottomBar.addClass("am-stretch");
      bottomBar.removeClass("am-shrink");
    }
  }

  function bottomBarOff() {
    state.bottomBarShow = false;
    if (bottomBar) {
      bottomBar.addClass("am-shrink");
      bottomBar.removeClass("am-stretch");
    }
  }

  function topBarOff() {
    state.topBarShow = false;
    vm.showMoreTopBar = false;
    if (topBar) {
      topBar.addClass("am-shrink");
      topBar.removeClass("am-stretch");
    }
  }

  function topBarOn() {
    state.topBarShow = true;
    if (topBar) {
      topBar.addClass("am-stretch");
      topBar.removeClass("am-shrink");
    }
  }

  function disableTopBar() {
    if (topBar) {
      topBar.addClass("not-selectable");
    }
  }

  function enableTopBar() {
    if (topBar) {
      topBar.removeClass("not-selectable");
    }
  }

  function less2More() {
    vm.showMoreTopBar = !vm.showMoreTopBar;
  }

  function onClickAnimation(id) {
    /*  vm.isSelected = !vm.isSelected;*/
    selectedSag = {
      ID: id,
      categoryId: vm.sagCategoryId
    };
    if (!(id === 0 && vm.sagCategoryId === TQ.AnimationManager.SagCategory.IN)) {
      TQ.OverlayMask.turnOn("id-am-save");
    }
    TQ.Trsa3.ditherStart();
  }

  function onSelectSagCategory(categoryId) {
    TQ.Trsa3.ditherStart();
    vm.sagCategoryId = categoryId;
    TQ.AnimationManager.categoryId = vm.sagCategoryId;
  }

  function hasClicked(id) {
    var hasClickIndex = id;
    if (selectedSag &&
      selectedSag.categoryId === vm.sagCategoryId &&
      selectedSag.ID === hasClickIndex) {
      return true;
    } else {
      return false;
    }
  }

  function modalType2MatType(modalType) {
    var matType = 0;
    switch (_currentModalType) {
      case BKG:
        matType = TQ.MatType.BKG;
        break;
      case PEOPLE:
        matType = TQ.MatType.PEOPLE;
        break;
      case PROP:
        matType = TQ.MatType.PROP;
        break;
      case SOUND:
        matType = TQ.MatType.SOUND;
        break;
      default:
        matType = TQ.MatType.PROP;
    }
    return matType;
  }

  function authenticate(provider) {
    UserService.authenticate(provider)
      .then(updateIde)
      .catch(function(response) {
        console.log(response);
      });
  }

  function onSubmitLogin(evt) {
    if (evt.type === "keydown" && (evt.keyCode === 13)) {
      signUpOrLogin();
    }
  }

  function signUpOrLogin() {
    var PASSWORD_LENGTH = 4;
    var USERNAME_LENGTH = 8;
    var psw = vm.userPsw;
    if (vm.state.isSignUping) {
      // if (vm.userGroupId !== '190718') {
      //     return TQ.MessageBox.promptWithNoCancel("邀请码无效，请联系管理员获取新邀请码");
      // }

      if (vm.userName.length < 8) {
        return TQ.MessageBox.prompt("用户名至少" + USERNAME_LENGTH + "个数字或字母");
      } else if ((psw !== vm.userPswConfirm) || (psw.length < PASSWORD_LENGTH)) {
        return TQ.MessageBox.prompt("口令不一致,或者少于" + PASSWORD_LENGTH + "个数字字母");
      }
      var userDisplayName = (!vm.userDisplayName ? vm.userName : vm.userDisplayName);
      UserService.signUp({ email: vm.userName.toLowerCase(), password: psw, displayName: userDisplayName, userType: vm.user.type, groupId: vm.userGroupId })
        .then(onLoggedIn);
    } else {
      UserService.login(vm.userName, psw)
        .then(onLoggedIn);
    }
    vm.userPsw = null;
  }

  function onLoggedIn() {
    if (TQ.userProfile.loggedIn) {
      opusDataReady = false; // 换了user, 需要重新获取数据
      DataService.reload(null, true);
      updateIde();
      if (callbackAfterLogin) {
        callbackAfterLogin();
        callbackAfterLogin = null;
      }
      if (loginPanel) {
        closeLoginPanel();
      }
    } else {
      // user.nameError = true;
      user.passwordError = true;
    }
  }

  function setAdmin() {
    var userId = vm.userIDToSet;
    UserService.setAdmin(userId).then(function() {
      var list = UserService.getUserList();
      console.log(list.toString());
    });
  }

  function setPrivilege() {
    var userId = vm.userIDToSet;
    var userPrivilege = vm.userPrivilegeToSet;
    UserService.setPrivilege(userId, userPrivilege).then(function() {
      var list = UserService.getUserList();
      console.log(list.toString());
    });
  }

  function logout() {
    UserService.logout().then(function() {
      callbackAfterLogin = null;
      user.canCT = false;
      toFirstPage();
    });
  }

  function checkLoginState() {
    if (!user.loggedIn && !TQ.State.isPlayOnly) {
      openLoginPanel();
    }
  }

  function isStaleWxGuest() {
    return TQUtility.isMiniProgramWebView() &&
      (!TQ.userProfile.displayName ||
        ((TQ.userProfile.displayName === "微信用户") &&
          (!TQ.userProfile.expaireTime || TQ.userProfile.expaireTime < (new Date()).getTime())));
  }

  function isMiniProgramGuest() {
    return TQUtility.isMiniProgramWebView() &&
      (!TQ.userProfile.displayName || (TQ.userProfile.displayName === "微信用户"));
  }

  vm.canEdit = function() {
    return (TQ.userProfile.loggedIn && !isMiniProgramGuest());
  };

  function ensureLogin(callback) {
    if (!TQ.userProfile.loggedIn || isStaleWxGuest()) {
      if (TQUtility.isMiniProgramWebView()) {
        TQ.userProfile.expaireTime = (new Date()).getTime() + 30 * 1000; // 30分钟之后，再检查
        if (TQ.QueryParams.wxCode) {
          var nickname = TQ.QueryParams.wxNickName || "微信用户";
          callbackAfterLogin = callback;
          UserService.loginFromWx(TQ.QueryParams.wxCode, nickname).then(onLoggedIn);
        } else {
          TQ.MessageBox.promptWithNoCancel(TQ.Locale.getStr("只供注册用户使用! 请先注册"));
        }
      } else {
        openLoginPanel(callback);
      }
      return false;
    }
    return true;
  }

  function cloneIt(evt) {
    if (isDithering) {
      return;
    }
    ditherStart();

    if (!ensureLogin(function() { cloneIt(evt); })) {
      return;
    }

    TQ.AssertExt.isTrue(TQ.userProfile.loggedIn, "login, please!");
    onActions(function() {
      vm.EditorService.cloneIt(evt);
    });
  }

  function forkIt() {
    onActions(function() {
      vm.EditorService.forkIt();
    });
  }

  function createNewOpus() {
    onActions(function() {
      selectCanvas();
    });
  }

  function onActions(doFunc) {
    if (state.isPreviewMode) {
      vm.EditorService.stop();
    }
    closeActionBoard();

    vm.wcyState.templateId = vm.wcyState.authorId;
    vm.wcyState.authorId = user.ID;
    if (doFunc) {
      doFunc();
    }

    updateIde();
    $timeout(function() {
      vm.toAddMode();
    }, 500);
  }

  function updatePlayOnlyFlag() {
    // !vm.wcyState.authorId // 新创建的，当然也是自己的
    if (!user || !user.loggedIn) {
      TQ.State.isPlayOnly = true;
    } else {
      TQ.State.isPlayOnly = (!vm.wcyState.authorId || (vm.wcyState.authorId !== user.ID) || TQ.State.isTopicIntro);
    }
  }

  function updateIde() {
    updatePlayOnlyFlag();
    if (user.loggedIn) {
      DataService.reload(null, true);
      TQ.SceneEditor.turnOnEditor();
      loadEditor();

      // 延迟一下， 因为编辑器加载需要时间
      $timeout(function() {
        EditorService.updateControllers();
      }, 100);
    }
  }

  function orderTShirt() {
    vm.data.screenShotUrl = TQ.ScreenShot.getData();
    $ionicModal.fromTemplateUrl("/features/orders/t-shirt.html", {
      scope: $scope,
      animation: "slide-in-up",
      focusFirstInput: true // 在IOS下， 迫使显示keyboard； 在android下， 要用keyboardPlugin
    }).then(function(modal) {
      modal.show();
      vm.currPopupModal = modal;
    });
  }

  function openLevelManager() {
    closePopupModal();
    _closeModal();
    var modalId = "id_levelManager__html";
    if (!_modals[modalId]) {
      $ionicModal.fromTemplateUrl(modalId, {
        scope: $scope,
        animation: "slide-in-up"
      }).then(function(modal) {
        _modals[modalId] = modal;
        show(modalId);
      });
    } else {
      show(modalId);
    }

    function show(id) {
      $timeout(function() {
        _currentModal = _modals[id];
        showModal(_currentModal);
      });
    }
  }

  function closePopupModal() {
    if (vm.currPopupModal) {
      vm.currPopupModal.hide();
      vm.currPopupModal = null;
    }
  }

  function placeOrder() {
    NetService.uploadOne(vm.data.screenShotUrl, TQ.MatType.BKG, { useBackgroundMode: true })
      .then(function(res) {
        TQ.Log.debugInfo("t-shirt design is: " + res.url);
      });
    vm.closePopupModal();
    $state.go("order");
    $timeout(checkOrderPageReady, 100);
  }

  function checkOrderPageReady() {
    if (document.getElementById("pay-button-div")) {
      TQ.Pay.showButton();
    } else {
      $timeout(checkOrderPageReady, 100);
    }
  }

  function refreshSlider() {
    $timeout(function() {
      $scope.$broadcast("rzSliderForceRender");
    });
  }

  function saveAm() {
    TQ.Trsa3.ditherStart();
    saveAndPreviewAm(true);
  }

  function categoryId2Sags(categoryId) {
    var sags = null;
    switch (categoryId) {
      case 1:
        sags = inSags;
        break;

      case 2:
        sags = idleSags;
        break;

      case 3:
        sags = outSags;
        break;
      default:
    }
    return sags;
  }

  function toSelectedSag(savedSag) {
    var result = null;
    if (savedSag) {
      var sags = categoryId2Sags(savedSag.categoryId);
      for (var i = 0; i < sags.length; i++) {
        if (sags[i].innerType === savedSag.typeId) {
          result = {
            ID: i,
            categoryId: savedSag.categoryId
          };
          break;
        }
      }
    }
    return result;
  }

  function toSagItem(selectedSag) {
    var result = null;
    if (selectedSag) {
      var sags = categoryId2Sags(selectedSag.categoryId);
      TQ.AssertExt.invalidLogic(selectedSag.ID < sags.length, "出界");
      result = sags[selectedSag.ID];
    }
    return result;
  }

  function saveAndPreviewAm(withOutPreview) {
    var currentSag = toSagItem(selectedSag); // TQ.Utility.shadowCopyWithoutObject(
    if (currentSag) {
      var fn = currentSag.onClick;
      var fn2 = fn.replace(/sc\./g, "vm.");
      fn2 = fn2.replace("$event", "");

      if (withOutPreview) {
        fn2 = fn2.replace(/;.*/g, "");
      }

      eval(fn2);
    }
  }

  function toggleTimeline() {
    state.showTimer = !state.showTimer;
    // 似乎反应太慢， 需要多次刷新，以便于及早显示最大值
    $timeout(refreshSlider, 100);
    $timeout(refreshSlider, 500);
    $timeout(refreshSlider, 1000);
  }

  function helpTutor(tutorId) {
    TQ.Tutor.start(tutorId, function() {
      $timeout(openHelpPanel, 100);
    });
  }

  function getStr(tag) {
    return TQ.Locale.getStr(tag);
  }

  function isSelectedCanvas(id) {
    return (id === selectedTargetMedia) ? "√" : "○";
  }

  var isSelectingCanvas = false;
  vm.joinTopic = function(topic) {
    if (!ensureLogin(function() { vm.joinTopic(topic); })) {
      return;
    }

    TQ.AssertExt.isTrue(!!topic || !!vm.state.topic, "新指定Topic， 或已经在state中有topic");
    if (!topic) {
      topic = vm.state.topic;
    } else {
      vm.state.topic = topic;
    }
    vm.state.isTopicIntro = false;
    console.log(topic);
    DataService.reload(null, true); //  根据主题， 重新获取数据
    vm.state.topicPage = TOPIC_PAGE.NO;

    selectCanvas();
  };

  function freeCreate() {
    vm.state.topic = null; // 无主题，任意创作
    selectCanvas();
  }

  function getOpusSize() {
    if (!selectedTargetMedia) {
      selectedTargetMedia = determineOpusSizeByDevice();
    }

    return selectedTargetMedia;
  }

  function determineOpusSizeByDevice() {
    if (TQUtility.isPC()) {
      return DEVICE_TYPE_DESKTOP;
    } else if (TQUtility.isPad()) {
      return DEVICE_TYPE_PAD;
    }
    return DEVICE_TYPE_MOBILE;
  }

  function selectCanvas(targetMedia) {
    if (!ensureLogin(function() { selectCanvas(targetMedia); })) {
      return;
    }

    TQ.State.isPlayOnly = false;
    TQ.State.shareCode = null;
    if (!targetMedia) {
      targetMedia = getOpusSize();
    }

    TQ.AssertExt.isTrue(TQ.userProfile.loggedIn, "先login");
    var sizeGuides = {};
    sizeGuides[DEVICE_TYPE_PAD] = [768, 1024]; // 竖屏，ipad的分辨率，屏幕4:3
    sizeGuides[DEVICE_TYPE_MOBILE] = [414, 736]; // 竖屏，mobile
    sizeGuides[DEVICE_TYPE_DESKTOP] = [800, 600]; // 横屏，桌面， 网页
    sizeGuides[DEVICE_TYPE_FACEBOOK] = [800, 416];// 横屏, facebook, link形式的ads, 1.91: 1, 标题25个字符， 说明90字符

    if (isSelectingCanvas) {
      return;
    }

    isSelectingCanvas = true;

    EditorService.emptyScene();

    if (!targetMedia) {
      targetMedia = getOpusSize();
    }

    selectedTargetMedia = targetMedia;
    var spec = sizeGuides[targetMedia];

    if (spec) {
      TQ.Config.designatedWidth = spec[0];
      TQ.Config.designatedHeight = spec[1];
      TQ.State.designatedWidth = TQ.Config.designatedWidth;
      TQ.State.designatedHeight = TQ.Config.designatedHeight;
      AppService.configCanvas();
      createWcy();
      TQ.State.isPlayOnly = false;
      TQ.State.isTopicIntro = false;
      vm.wcyState.authorId = user.ID;
      closeFirstPage();
    }

    if (TQ.State.isAddMode) {
      EditorService.reset();
    }

    isSelectingCanvas = false;
  }

  function closeFirstPage() {
    gotoEditAndPlayPage();
    $("#id-first-page").fadeOut(500);
  }

  function setLang(lang) {
    return TQ.Locale.setLang(lang);
  }

  function showDepreciatedBtn(id) {
    TQ.Tutor.showDepreciatedBtn(id);
  }

  function calButtonSize4Wx() {
    var wxFontScale;

    if (TQ.TextElementWxAdapter.cssFontSizeFactor < 0) {
      TQ.TextElementWxAdapter.detectFontSizeFactor();
    }

    try {
      wxFontScale = 1 / TQ.TextElementWxAdapter.cssFontSizeFactor;
    } catch (e) {
      wxFontScale = 1;
    }

    if (isNaN(wxFontScale)) {
      wxFontScale = 1;
    }

    if (wxFontScale > 1.9) { // 2
      buttonText4Wx = "btn-txt-4-wx-larger";
      return "tool-btn-4-wx-larger";
    } else if (wxFontScale > 1.45) { // 1.5, 3/2
      buttonText4Wx = "btn-txt-4-wx-large";
      return "tool-btn-4-wx-large";
    } else if (wxFontScale < 0.9) { // 0.75, 3/4
      buttonText4Wx = "btn-txt-4-wx-small";
      return "tool-btn-4-wx-small";
    }
    // 1
    buttonText4Wx = "btn-txt-4-wx-std";
    return "tool-btn-4-wx-std";
  }

  vm.forwardShare = function() {
    closeActionBoard();
    TQ.MessageBox.prompt("直接点击微信右上角的分享按钮。");
  };

  vm.customizeShare = function() {
    closeActionBoard();
    if (state.isPreviewMode) {
      EditorService.stop();
    }

    if (TQ.State.isPlayOnly) {
      forkIt();
    } else {
      EditorService.toAddMode();
    }
  };

  vm.replayInActionBoard = function() {
    closeActionBoard();
    vm.EditorService.replay();
  };

  function gotoEditAndPlayPage() {
    if (state.editorMode < vm.EDITOR_MODE.EDIT) {
      $timeout(function() {
        if (TQ.State.isPlayOnly) {
          state.editorMode = vm.EDITOR_MODE.PREVIEW;
        } else {
          state.editorMode = vm.EDITOR_MODE.EDIT;
        }
      });
      if (!TQ.State.isPlayOnly) {
        vm.toAddMode();
      }
    } else {
      $timeout();
    }
  }

  function showModal(modal) {
    document.addEventListener("click", closeModalByBackdrop);
    document.addEventListener("touch", closeModalByBackdrop);
    document.addEventListener("touchstart", closeModalByBackdrop);
    modal.show();
  }

  function closeModalByBackdrop(event) {
    var target = angular.element(event.target);
    var tagName = target[0].tagName;
    if (tagName === "HTML" && !target.hasClass("modal-backdrop")) {
      isChangeSkinStarted = false;
      _closeModal();
    }
  }

  function portraitModePrompt() {
    if (TQUtility.isLandscape() && !TQUtility.isPC()) {
      TQ.MessageBox.prompt(TQ.Locale.getStr("please rotate to portrait mode!"), portraitModePrompt, portraitModePrompt);
      portraitModePrompting = true;
    } else {
      if (portraitModePrompting) {
        portraitModePrompting = false;
        isLandscape = false;
        TQ.MessageBox.hide();
        setupLayout();
      } else {
        setupMenuOnly();
      }
    }
  }

  function backButtonHandlerOn() {
    var stateObj = { name: "udoidoInEdit" + Date.now() };
    history.pushState(stateObj, stateObj.name, location.href);
    angular.element($window).on("popstate", backButtonHandler);
  }

  function backButtonHandlerOff() {
    angular.element($window).off("popstate", backButtonHandler);
  }

  function backButtonHandler(evt) {
    var stateInfo = (!evt.state) ? "" : JSON.stringify(evt.state);
    console.log("state: " + stateInfo);
    // history.go(1);
    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    $timeout(function() {
      var stateObj = { name: "udoidoInEdit" + Date.now() };
      history.pushState(stateObj, stateObj.name, location.href);
    });
  }

  function onCreateTopic() {
    var topic = {};
    TQUtility.extendWithoutObject(topic, vm.state.topic);
    topic.introId = (!topic.introUrl) ? null : TQ.Utility.getWcyIdFromUrl(topic.introUrl);
    topic.outroId = (!topic.outroUrl) ? null : TQ.Utility.getWcyIdFromUrl(topic.outroUrl);
    topic.posterPicturePath = (!topic.posterPictureUrl) ? null : TQ.RM.toRelativeFromThumbnail(topic.posterPictureUrl);
    topic.authorName = TQ.userProfile.name;
    topic.authorSchool = TQ.userProfile.school || TQ.userProfile.city || "未知";

    if (!topic.introId) {
      topic.introId = 0;
    }
    if (!topic.outroId) {
      topic.outroId = 0;
    }

    delete topic.introUrl;
    delete topic.outroUrl;
    delete topic.posterPictureUrl;
    delete topic.$$hashKey;
    delete topic.__v;
    EditorService.addTopic(topic);
    vm.openTopicPage();
  }

  function convertToTopic() {
    if (currScene && currScene.currentLevel.itemNum() <= 0) {
      return TQ.MessageBox.confirm("先给作品加点内容吧！");
    }

    /**
     * 把当前作品（playOnly的也行）转为主题
     */
    var topic = {
      introId: TQ.Utility.getWcyIdFromUrl(location.href),
      outroId: null,
      posterPicturePath: currScene.ssPath,
      authorName: TQ.userProfile.name,
      authorSchool: TQ.userProfile.school || TQ.userProfile.city || "未知"
    };

    if (TQ.FrameCounter.isPlaying()) {
      TQ.PreviewMenu.startWatch();
      EditorService.stop();
      TQ.FrameCounter.goto(0);
    }

    closeActionBoard();
    TQ.PreviewMenu.disableWatch();
    state.editorMode = vm.EDITOR_MODE.CONVERT_TO_TOPIC;
    vm.openAddTopicPage(topic);
  }

  vm.saveAsIComponent = function() {
    if (currScene && (currScene.currentLevel.itemNum() <= 0 || !currScene.currentLevel.hasGraph())) {
      return TQ.MessageBox.confirm("先给元素加点可见的内容吧！");
    }
    if (currScene && currScene.levelNum() > 1) {
      return TQ.MessageBox.confirm("元件只能有1个场景！");
    }

    EditorService.stop();
    TQ.FrameCounter.goto(0);
    TQ.SelectSet.turnOff();
    currScene.setAsIComponent(TQ.MatType.PEOPLE);
    doSaveWork();
    EditorService.uploadIComponentThumbnail();

    $timeout(function() {
      TQ.SelectSet.turnOn();
    });
  };

  vm.onCancelCreateTopic = function() {
    vm.openTopicPage();
  };

  /* Text Edit */
  function textPaneInit() {
    if (!textInputEle) {
      textInputEle = document.getElementById("id-text-area");
    }
  }

  vm.textSelectAll = function() {
    if (textInputEle) {
      textInputEle.select();
    }
  };

  function getSelectionText() {
    var text = "";
    if (window.getSelection) {
      text = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== "Control") {
      text = document.selection.createRange().text;
    }
    return text;
  }

  vm.textCopy = function() {
    if (textInputEle) {
      var text = getSelectionText();
      if (!text) {
        text = textInputEle.value;
      }
      clipboard.writeText(text).then(function() {
        TQ.Log.debugInfo("copy to clipboard successfully!");
      }, function(err) {
        TQ.Log.error("failed to copy to clipboard, error = " + JSON.stringify(err));
      });
    }
  };

  vm.textPaste = function(evt) {
    function onSuccess(clipText) {
      var oldValue = textInputEle.value;
      var newValue;
      if (textInputEle.selectionStart || (textInputEle.selectionStart === "0")) {
        var startPos = textInputEle.selectionStart;
        var endPos = textInputEle.selectionEnd;

        newValue = oldValue.substring(0, startPos) + clipText +
          oldValue.substring(endPos, oldValue.length);
      } else {
        newValue = oldValue + clipText;
      }

      $timeout(function() {
        vm.textEditor.content = newValue;
      });
    }

    function onFail(clipText) {
      console.log(JSON.stringify(clipText));
    }

    clipboard.readText().then(onSuccess, onFail);
  };

  vm.textCut = function() {
    document.execCommand("cut");
  };

  var thumbsLeft = 0;
  var xStart = 0;
  var thumbsLeftStart = 0;

  function onMoveLevelThumbsStart(event) {
    if (event.touches && event.touches.length > 0) {
      xStart = event.touches[0].screenX;
      thumbsLeftStart = thumbsLeft;
    }
  }

  function onMoveLevelThumbs(event) {
    if (event.touches && event.touches.length > 0) {
      var minLeft = -thumbWidth * (vm.levelThumbs.length - 1);
      thumbsLeft = thumbsLeftStart + (event.touches[0].screenX - xStart);
      thumbsLeft = TQ.MathExt.clamp(thumbsLeft, minLeft, 0);
      if (eleLevelPane) {
        eleLevelPane.style.transform = "translate3d(" + thumbsLeft + "px" + ", 0, 0)";
      }
    }
  }

  function isTopic(prop) {
    return ((prop.introId !== undefined) &&
      (prop.outroId !== undefined) &&
      (prop.posterPicturePath !== undefined));
  }

  function updateOpusCollection(collectionType) {
    opusCollectionType = collectionType;
    vm.opusList = DataService.getProps(opusCollectionType);
    const ignorePlayFlag = (state.editorMode === TQ.SceneEditor.MODE.FIRST);
    DataService.reload(opusCollectionType, ignorePlayFlag);
  }

  function isComponent(prop) {
    return (prop && !!prop.iComponentId);
  }

  var welcomePageRemoved = false;
  function removeWelcomePage() {
    if (!welcomePageRemoved) {
      welcomePageRemoved = true;
      TQ.Utility.removeWelcomeTextPage();
    }
  }

  vm.userIs = function(type) {
    return (vm.user.type === type) ? "✔" : "□";
  };

  function editCurrentLevel() {
    var levelId = currScene.currentLevelId;
    vm.toAddMode({ levelId: levelId });
  }

  function inspectLevelsStart() {
    document.addEventListener("swipeleft", inspectNextLevel);
    document.addEventListener("swiperight", inspectPrevLevel);
    document.addEventListener("click", inspectToggle);
    document.addEventListener("hold", editCurrentLevel);
  }

  function inspectLevelsEnd() {
    document.removeEventListener("swipeleft", inspectNextLevel);
    document.removeEventListener("swiperight", inspectPrevLevel);
    document.removeEventListener("click", inspectToggle);
    document.removeEventListener("hold", editCurrentLevel);
  }

  initialize();
}
