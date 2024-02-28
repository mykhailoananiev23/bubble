angular.module("starter")
  .controller("sceneController", sceneController);

sceneController.$inject = ["$scope", "$timeout", "$state", "$stateParams", "$ionicModal",
  "$ionicScrollDelegate", "WCY", "$cordovaImagePicker",
  "$cordovaSocialSharing",
  "FileService", "DeviceService",
  "AppService", "EditorService", "DataService", "MatLibService", "UserService", "NetService"
];

function sceneController($scope, $timeout, $state, $stateParams, $ionicModal,
  $ionicScrollDelegate, WCY, $cordovaImagePicker, $cordovaSocialSharing,
  FileService, DeviceService, AppService,
  EditorService, DataService, MatLibService, UserService, NetService) {
  // 变量
  var vm = this;
  var user = TQ.userProfile;
  var hasOpusSpecified = false;
  var opusDataReady = false;
  var _currentPaneOption = {};
  var selectedEle = [];
  var options = {
    requestAll: false
  };
  var buttonText4Wx = null;
  var loginPanel = null;
  var selectedMatMenuId = 2; // 缺省是 Prop
  var isDithering = false;
  var state = EditorService.state;
  state.readyToShow = !!state.readyToShow;

  vm.NEED_POLISH = true;
  vm.user = TQ.userProfile;
  vm.authenticate = authenticate;
  vm.signUpOrLogin = signUpOrLogin;
  vm.logout = logout;
  vm.manageUser = manageUser;
  vm.userName = "";
  vm.userPsw = "";
  vm.state = state;
	  vm.EDITOR_MODE = TQ.SceneEditor.MODE;
  vm.pteState = TQ.PageTransitionEffect.state;
  vm.wcyState = TQ.WCY;
  vm.nextPage = nextPage;
  vm.prevPage = prevPage;
  vm.openBkgPane = openBkgPane;
  vm.openTopicPane = openTopicPane;
  vm.openPropPane = openPropPane;
  vm.openPeoplePane = openPeoplePane;
  vm.openMyOpusPane = openMyOpusPane;
  vm.openAllOpusPane = openAllOpusPane;
  vm.openFineOpusPane = openFineOpusPane;
  vm.openGoodOpus = openGoodOpus;
  vm.onBan = onBan;
  vm.onRefine = onRefine;
  vm.onPublish = onPublish;
  vm.onSelectTopic = onSelectTopic;
  vm.onNoTopic = onNoTopic;
  vm.onDetachTopic = onDetachTopic;
  vm.onAttachTopic = onAttachTopic;

  vm.setLang = setLang;
  vm.getStr = getStr;

  vm.isMultiplePictures = false;
  vm.isMusic = false;
  vm.isBackground = false;
  vm.requestAllFlag = "";
  vm.openLoginPanel = openLoginPanel;
  vm.closeLoginPanel = closeLoginPanel;
  vm.openMyUdoido = openMyUdoido;
  vm.switchToSignUp = switchToSignUp;
  vm.switchToLogin = switchToLogin;
  vm.Config = TQ.Config;

  vm.isMyWorkPane = true;
  vm.less2More = less2More;
  vm.hasClicked = hasClicked;

  // 图片
  vm.listIsSelected = listIsSelected;
  vm.getListClass = getListClass;
  // 简单动画
  vm.state.isSignUping = false;
  vm.state.timeSetting = false;
	  state.editorMode = vm.EDITOR_MODE.LOADING;

  function listIsSelected(id) {
    selectedMatMenuId = id;
  }

  function getListClass(id) {
    if (selectedMatMenuId === id) {
      return "listSelected " + buttonText4Wx;
    }
    return "listUnselected " + buttonText4Wx;
  }

  // implementation
  function initialize() {
    // admin与user app的区别
    TQ.State.isAudit = true;

    TQ.State.determineWorkingRegion();
    // remove_debugger_begin
    // TQ.Log.setLevel(TQ.Log.INFO_LEVEL);
    TQ.Log.setLevel(TQ.Log.CRITICAL_LEVEL);
    // remove_debugger_end
    state.isRecording = false;
    // state.showTimer = true; //false;
    // state.showTrimTimeline = false; //false;

    state.bottomBarShow = true;
    state.topBarShow = true;
    vm.info = "";
    var topics = DataService.getProps(TQ.MatType.TOPIC, 0);
    if (topics.length > 0) {
      vm.state.topic = topics[0];
      vm.topicInfo = vm.state.topic._id + " " + vm.state.topic.title;
    }

		    document.addEventListener(TQ.EVENT.MAT_CHANGED, onMatChanged, false);
  }

  function onMatChanged(event) {
	    if (!TQ.userProfile.loggedIn || !_currentPaneOption) {
	    	return;
	    }

	    var matType = null;
	    if (!!event && event.data && event.data.matType) {
		    matType = event.data.matType;
	    }

	    if (TQ.MatType.OPUS !== matType) {
	    	return;
	    }

		  switch (_currentPaneOption.sourceType) {
		    case TQ.MatType.OPUS:
		    case TQ.MatType.PUBLISHED_OPUS:
			  case TQ.MatType.FINE_OPUS:
			    DataService.reload(_currentPaneOption.sourceType);
			    break;
			  default:
			  	break;
	    }
  }

  $scope.$on(DataService.EVENT_DATA_READY, function() {
    if (!opusDataReady) {
      opusDataReady = true;
      openMyUdoido();
    } else {
      $timeout(function() {
        vm.dataList = DataService.getProps(_currentPaneOption.sourceType);
      });
    }
  });

  function openMyUdoido(evt) {
    $("#id-login-panel").display = "block";
    if (!user.loggedIn) {
      openLoginPanel();
    } else {
      openMyOpusPane();
    }
  }

  function openLoginPanel() {
    document.addEventListener("keydown", onSubmitLogin);
    vm.state.isSignUping = false;
    vm.loginActiveField = 2;
    TQ.InputMap.turnOff();
    if (!loginPanel) {
      loginPanel = $("#id-login-panel");
    }
    user.nameError = false;
    user.passwordError = false;
    loginPanel.fadeIn(500);
  }

  var firstPage = null;
  function openFirstPage() {
    vm.editorMode = vm.EDITOR_MODE.FIRST;
    vm.state.isAddMode = false;
    if (!firstPage) {
      firstPage = $("#id-first-page");
    }
    firstPage.show();
    // vm.openMyUdoido();
  }

  this.toFirstPage = function() {
    if (state.isPreviewMode) {
      EditorService.stop();
    }
    closeActionBoard();
    $timeout(openFirstPage);
  };

  function switchToSignUp() {
    user.passwordError = false;
    user.nameError = false;
    vm.loginActiveField = 2;
    vm.state.isSignUping = true;
    $timeout();
  }

  function switchToLogin() {
    vm.state.isSignUping = false;
  }

  function closeLoginPanel() {
    document.removeEventListener("keydown", onSubmitLogin);
    TQ.InputMap.turnOn();
    if (loginPanel) {
      loginPanel.fadeOut(500);
    }
  }

  function openGoodOpus(prop) {
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

    prop.selected = !prop.selected;
    if (prop.selected) {
      selectedEle.push(prop);
    } else {
      var id = selectedEle.indexOf(prop);
      selectedEle.splice(id, 1);
    }

    ditherStart();
  };

  function onPublish(event) {
    travelAllSelections(function(prop) {
      switch (_currentPaneOption.sourceType) {
	            case TQ.MatType.OPUS:
	            case TQ.MatType.FINE_OPUS:
		            EditorService.shareOpus(prop);
          break;
	            case TQ.MatType.PUBLISHED_OPUS:
	            	TQ.MessageBox.promptWithNoCancel("已经发表了");
          break;

	            case TQ.MatType.TOPIC:
          EditorService.shareTopic(prop);
          break;

        default:
          EditorService.shareMat(prop);
      }
    });
  }

  function onBan() {
    travelAllSelections(function(prop) {
      prop.matType = _currentPaneOption.sourceType;
      switch (_currentPaneOption.sourceType) {
        case TQ.MatType.OPUS:
	              case TQ.MatType.PUBLISHED_OPUS:
	              case TQ.MatType.FINE_OPUS:
		            // DataService.deleteWork(prop);
          EditorService.banOpus(prop);
          break;
        case TQ.MatType.TOPIC:
          EditorService.banTopic(prop);
          break;
        default:
          EditorService.banMat(prop);
      }
    });
  }

  function onRefine() {
    travelAllSelections(function(prop) {
      prop.matType = _currentPaneOption.sourceType;
      switch (_currentPaneOption.sourceType) {
        case TQ.MatType.OPUS:
        case TQ.MatType.PUBLISHED_OPUS:
        case TQ.MatType.FINE_OPUS:
          EditorService.refineOpus(prop);
          break;
        default:
          break;
      }
    });
  }

  function onSelectTopic() {
    var topic;
    if (selectedEle.length > 0) {
      topic = selectedEle[0];
      selectedEle.splice(0);
      if (!topic) {
        return;
      }
      if ((user.ID === topic.authorId) || user.canAdmin || user.canBan) {
        state.topic = topic;
        vm.topicInfo = vm.state.topic._id + " " + vm.state.topic.title;
        DataService.reload();
      } else {
        TQ.MessageBox.toast(TQ.Locale.getStr("You are not authorized to operate!"));
        return;
      }
    }
  }

  function onAttachTopic() {
    if (_currentPaneOption.sourceType !== TQ.MatType.OPUS) {
      travelAllSelections(function(prop) {
        prop.matType = _currentPaneOption.sourceType;
        EditorService.attachTopic(prop.matType, prop.id, TQ.Utility.getTopicId());
      });
    }
  }

  function onDetachTopic() {
    if (_currentPaneOption.sourceType !== TQ.MatType.OPUS) {
      travelAllSelections(function(prop) {
        prop.matType = _currentPaneOption.sourceType;
        EditorService.detachTopic(prop.matType, prop.id, TQ.Utility.getTopicId());
      });
    }
  }

  function travelAllSelections(doAction) {
    if (isDithering) {
      return;
    }
    ditherStart();
    for (var i = 0; i < selectedEle.length; i++) {
      prop = selectedEle[i];
      if (!prop) {
        continue;
      }
      if ((user.ID === prop.authorId) || user.canAdmin || user.canBan) {
        prop.matType = _currentPaneOption.sourceType;
        doAction(prop);
        prop.selected = false;
      } else {
        TQ.MessageBox.toast(TQ.Locale.getStr("You are not authorized to operate!"));
        break;
      }
    }

    selectedEle.splice(0);
  }

  this.onDeleteWork = function() {
    // 在自己的作品列表中，删除作品？？？
    if (isDithering) {
      return;
    }
    ditherStart();

    for (var i = 0; i < selectedEle.length; i++) {
      prop = selectedEle[i];
      if (prop) {
        DataService.deleteWork(prop);
        $timeout(function() {
          vm.dataList = DataService.getProps(_currentPaneOption.sourceType);
        });
      }
    }
    selectedEle.splice(0);
  };

  vm.dataList = [];

  function openTopicPane() {
	      updateDataCollection(TQ.MatType.TOPIC);
  }

  function openMyOpusPane() {
	      updateDataCollection(TQ.MatType.OPUS);
  }

  function openAllOpusPane() {
    updateDataCollection(TQ.MatType.PUBLISHED_OPUS);
  }

  function openBkgPane() {
			  updateDataCollection(TQ.MatType.BKG);
  }

  function openPropPane() {
	      updateDataCollection(TQ.MatType.PROP);
  }

  function openPeoplePane() {
	    updateDataCollection(TQ.MatType.PEOPLE);
  }

  vm.openMusicPane = function() {
    updateDataCollection(TQ.MatType.SOUND);
  };

  function openFineOpusPane() {
    updateDataCollection(TQ.MatType.FINE_OPUS);
  }

  function updateDataCollection(collectionType) {
    _currentPaneOption.sourceType = collectionType;
    vm.dataList = DataService.getProps(_currentPaneOption.sourceType);
    DataService.reload(_currentPaneOption.sourceType);
  }

  vm.data2 = {};
  vm.data2.sceneId = 14959; // straw berry
  AppService.onAppStarted(onAppStarted);
  var _editorInitialized = false;

  $scope.$on("slideEnded", function() {
    if (vm.state.timeSetting) {
      $timeout(function() {
        saveAndPreviewAm();
      });
    }
  });

  $scope.$on(TQ.Scene.EVENT_READY, function() {
    if (!_editorInitialized) {
      // _editorInitialized = true;
      var view = $ionicScrollDelegate.getScrollView();
      if (view) {
        view.options.scrollingY = false;
        view.options.scrollingX = false;
      }

      if (!!user.loggedIn && !vm.wcyState.isPlayOnly) {
        $timeout(function() {
          TQ.SceneEditor.turnOnEditor();

          DataService.initialize();
        });
      }
      TQ.Log.debugInfo(WCY.getShareCode());
    }

    if (state.editorMode < vm.EDITOR_MODE.FIRST) {
      if (TQ.State.isPlayOnly || hasOpusSpecified) {
        gotoEditAndPlayPage();
      } else {
        openFirstPage();
        // vm.openMyUdoido();
      }
    } else if (state.editorMode === vm.EDITOR_MODE.FIRST) {
      gotoEditAndPlayPage();
    }

    state.readyToShow = true;
    checkLoginState();
    TQ.Utility.removeWelcomeTextPage();
  });

  $scope.$on(TQ.Scene.EVENT_END_OF_PLAY, function() {
    vm.openActionBoard();
  });

  function onAppStarted() {
    // TQ.Log.setLevel(TQ.Log.INFO_LEVEL);
    var opus = $stateParams.shareCode || TQ.Utility.getUrlParam("opus");
    EditorService.initialize();
    if (opus) {
      hasOpusSpecified = true;
      WCY.getWcy(opus);
    } else {
      WCY.start();
    }

    // WCY.test(vm.data2.sceneId);
    // $cordovaProgress.hide();
  }

  function nextPage() {
    vm.dataList = vm.dataList.nextPage();
  }

  function prevPage() {
    vm.dataList = vm.dataList.previousPage();
  }

  function ditherStart() {
    TQ.Log.debugInfo("dither start...");
    isDithering = true;
    setTimeout(ditherEnd, 300);
  }

  function ditherEnd() {
    isDithering = false;
  }

  function less2More() {
    vm.showMoreTopBar = !vm.showMoreTopBar;
  }
  function hasClicked(id) {
    var hasClickIndex = id;
    if (hasClickIndex == selectedAnimationId) {
      return true;
    } else {
      return false;
    }
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
    var psw = vm.userPsw;
    vm.userPsw = null;
    if (vm.state.isSignUping) {
      TQ.AssertExt.invalidLogic(false, "admin 不提供注册， 必须在app中注册！");
    } else {
      UserService.login(vm.userName, psw)
        .then(updateIde);
    }
  }

  function manageUser() {
    UserService.setAdmin(id).then(function() {
      var list = UserService.getUserList();
      console.log(list.toString());
    });
  }

  function logout() {
    UserService.logout()
      .then(openLoginPanel);
  }

  function checkLoginState() {
    if (!user.loggedIn && !vm.wcyState.isPlayOnly) {
      openLoginPanel();
    }
  }

  function updateIde() {
    if (user.loggedIn) {
      DataService.reload();
      if (loginPanel) {
        closeLoginPanel();
      }
    }
  }

  function getStr(tag) {
    return TQ.Locale.getStr(tag);
  }

  function setLang(lang) {
    return TQ.Locale.setLang(lang);
  }

  function onNoTopic() {
    state.topic = null;
    vm.topicInfo = null;
    DataService.reload();
  }

  vm.onRequestAll = function() {
    options.requestAll = !options.requestAll;
    vm.requestAllFlag = (options.requestAll) ? "√" : "";
    DataService.setup(options);
    DataService.reload();
  };

  initialize();
}
