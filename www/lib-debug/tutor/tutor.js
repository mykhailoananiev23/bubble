/**
 * Created by Andrewz on 12/11/17.
 */
var TQ = TQ || {};
TQ.Tutor = (function() {
  var TUTOR_VERSION = 5;

  var firstTargetId = null;
  var initialized = false;
  var currentTargets = null;
  var isAutoClick = false;
  var onCompleted = null;
  var featureCounter = 0;
  var dialogInstance = null;
  var events = ["click", "touchEnd", "mouseup"];
  var tutorQuickStart = [
    ["middle", "", "<strong>Welcome to UDOIDO!</strong> <br/>this tutor will get you familiar with UDOIDO quickly!"],
    ["middle", "id-add-element", "Add background/prop/music to stage by clicking the flashing button"],
    ["top", "id-mat-bkg", "Select the background category, which will scale automatically to fit the stage, while keep the ratio"],
    ["top", ".photo-list-2", "Select one image from material pane. <br/>Tips: Swipe left/right to open next/previous page"],
    ["top", "id-mat-pane-ok", "Confirm the selection to add it into stage"],

    ["middle", "id-add-element", "Use your own pictures"],
    ["bottom", "id-mat-prop", "Select the prop category, which will be added as is, no auto scaling"],
    ["bottom", "id-insert-from-local", "Select the prop category, which will be added as is, no auto scaling, maximum resolution of prop is " + TQ.Config.MAT_MAX_WIDTH + " by " + TQ.Config.MAT_MAX_HEIGHT],

    // ['middle', 'id-mat-music', 'Add a background music'],

    ["middle", "id-add-text", "Add text"],
    ["middle", "id-confirm-input-text", "Input text, then click check mark to confirm"],
    ["top", "id-modify-text", "Modify text"],
    ["middle", "id-confirm-input-text", "Modify text, then click check mark to confirm"],
    ["top", "id-modify-text-property", "Modify size, color or style of the text"],
    ["top", ".win-close-btn", "Close the text edit panel"],

    // sap animation
    ["top", "id-sap-pane", "Open animation panel"],
    ["top", "", "Tips：Click \"Left in\" to let the element flying in from left to the current location"],
    ["top", ".ion-ios-clock-outline", "Open the time control panel by click the flashing icon"],
    ["top", ".rz-pointer rz-pointer-max", "Adjust the duration time of the animation"],
    ["top", ".rz-pointer rz-pointer-min", "Adjust the start time of the animation"],
    ["top", "id-sap-top-in-duration", "Change to animation type to \"top-in\""],
    // ['top', 'id-sap-no-animation', 'Erase the simple animation of the selected element'],
    ["bottom", "id-am-close", "Close animation panel"],
    ["middle", "id-setting", "Open the setting panel"],
    ["top", "id-setting-show-timeline", "Turn on/off the time line"],
    ["top", ".ui-slider-handle ui-state-default ui-corner-all", "Move the slider to 1.5s position"],

    ["top", "", "Tips：Scale the element by pinch gesture in touch screen (for mouse: click on the element and drag mouse while press CTRL key and mouse left button)"],
    ["top", "", "Tips：Scale only in horizontal/vertical by pinch along horizontal/vertical axis"],
    ["top", "", "Tips：Rotate the element by rotate gesture in touch screen (for mouse: click on the element and drag mouse while press ALT key and mouse left button"],

    // ['top', 'id-group', 'Start to group elements together'],
    // ['top', '', 'Tips：Select 1st elements'],
    // ['top', '', 'Tips：Select more elements'],
    // ['top', 'id-group', 'Complete by click the group button again'],
    // ['top', '', 'Tips：Now the elements are grouped into one, they can be moved/scaled/rotated together'],
    // ['top', 'id-explode', 'Explode the selected object by clicking the flashing button'],

    ["middle", "id-play", "Preview your creation"],
    ["middle", "testCanvas", "Click on the stage to show toolbar"],
    ["middle", "", "Tips：Use timeline to select scenes"],
    ["top", "id-to-add-mode", "Return to edit mode"],
    ["middle", "id-save", "Save your opus in cloud, you can browse it anytime in \"settings | my opus\""],

    ["middle", "id-setting", "Open the setting panel"],
    ["top", "id-take-screenshot", "Make the current screen as the cover image of this opus, it is useful when sharing to social media"],
    ["middle", "id-share", "Share your creation to facebook"]
  ];
  var tutorNCopy = [
    ["top", "", "Tips：Select a element to be copied"],
    ["top", "id-m-copy", "Start to copy element"],
    ["top", "", "Tips：Click at the new position to place a new copy"],
    ["top", "", "Tips：Repeat to more positions"],
    ["top", "id-m-copy", "Complete the copy process by click the copy button again"]
  ];
  var tutorAddNewLevel = [
    ["middle", "id-setting", "Open the setting panel"],
    ["top", "id-setting-show-timeline", "Turn on the time line to show the result clearly"],
    ["middle", "id-add-level", "Add 2nd scene for this opus"],
    ["middle", "", "Tips：the new page is added"],
    ["middle", "", "Tips：move timeline to switch among pages"]
  ];

  var tutorInsertLocalImage = [
    ["middle", "", "The picture resoultion: <br/>" +
            TQ.Config.MAT_MAX_WIDTH + " by " + TQ.Config.MAT_MAX_HEIGHT + "(Background)<br/>" +
            TQ.Config.MAT_MAX_WIDTH + " by " + Math.round(TQ.Config.MAT_MAX_HEIGHT / 2) + " or " +
            Math.round(TQ.Config.MAT_MAX_WIDTH / 2) + " by " + TQ.Config.MAT_MAX_HEIGHT + "(Prop)<br/> <br/>" +
            "File size: <" + Math.round(TQ.Config.MAT_MAX_FILE_SIZE / 1024 / 1024) + "M"],
    ["middle", "id-add-element", "Use your own pictures"],
    ["bottom", "id-mat-prop", "Select the prop category, which will be added as is, no auto scaling"],
    ["bottom", "id-insert-from-local", "Select the prop category, which will be added as is, no auto scaling, maximum resolution of prop is " + TQ.Config.MAT_MAX_WIDTH + " by " + TQ.Config.MAT_MAX_HEIGHT],
    ["bottom", "", "if the image size and resolution meet the requirement, you will see the picture in stage soon"]
  ];

  var tutorKeyFrameAnimation = [
    ["middle", "id-setting", "Open the setting panel"],
    ["top", "id-setting-show-timeline", "Turn on/off the time line"],
    ["top", ".ui-slider-handle ui-state-default ui-corner-all", "Move the slider to 1st frame , for example 10"],
    ["top", "", "change size/rotation to expected, for example, scale to 0.5"],
    ["top", ".ui-slider-handle ui-state-default ui-corner-all", "Move the slider to 2nd frame , for example 15"],
    ["top", "", "change size/rotation to expected, for example, scale to 2"],
    ["middle", "id-play", "Preview your creation"],
    ["middle", "testCanvas", "Click on the stage to show the player's toolbar"],
    ["top", "id-to-add-mode", "Return to edit mode"]
  ];

  var tutorHideAndShow = [
    ["top", "", "tips: select the element first"],
    ["top", "", "tips: press \"h\" key to hide the object, press \"h\" key again will make it visible again"],
    ["top", "", "tips: if you want to select a hidden element, press \"a\" key to force to show all hidden elements, remember to press \"a\" again to back to normal"]
  ];

  var tutorCreateNewOpus = [
    ["middle", "id-setting", "Open the setting panel"],
    ["bottom", "id-create-for-desktop", "click the target platform to start the creation, such as for desktop"]
  ];

  var tutorHasNew = [
    ["middle", "", "New tutorial are ready to review"]
  ];

  var helps = [];

  function init() {
    if (initialized) {
      return;
    }
    initialized = true;
    var temp = [[TQ.Locale.getStr("Quick start"), tutorQuickStart],
      [TQ.Locale.getStr("How to use my own pictures/music?"), tutorInsertLocalImage],
      [TQ.Locale.getStr("How to multiple copy existing element?"), tutorNCopy],
      [TQ.Locale.getStr("How to make key frame animation?"), tutorKeyFrameAnimation],
      [TQ.Locale.getStr("How to hide/un-hide an element?"), tutorHideAndShow],
      [TQ.Locale.getStr("How to add new page"), tutorAddNewLevel],
      [TQ.Locale.getStr("How to create a new opus for facebook, desktop or mobile?"), tutorCreateNewOpus]
      //    [TQ.Locale.getStr('How to move object along a path?'), tutorMoveAlongPath]
    ];
    temp.forEach(function(value) {
      helps.push(value);
    });
  }

  const depreciatedItems = {
    "id-fork-it": ["top", "id-to-add-mode", "This button, \"fork\", is now replaced by the flashing button," +
      " \"to edit mode\", <br/> <br/> It will be removed after Feb 1st,2018"]
  };

  var features = tutorQuickStart;

  return {
    helps: helps,
    hasNew: hasNew,
    init: init,
    isFirstTimeUser: isFirstTimeUser,
    start: start,
    showDepreciatedBtn: showDepreciatedBtn,
    end: end
  };

  function isFirstTimeUser() {
    return (TQ.Base.Utility.readCache("tutor-completed", 0) === 0);
  }

  function hasNew(user) {
    var completed = TQ.Base.Utility.readCache("tutor-completed", 0);
    return (TQ.Config.tutorOn && completed < TUTOR_VERSION);
  }

  function start(featureData, callback) {
    if (!featureData) {
      features = (isFirstTimeUser() ? tutorQuickStart : tutorHasNew);
    } else {
      features = featureData;
    }

    onCompleted = callback;
    featureCounter = 0;
    events.forEach(function(item) {
      document.addEventListener(item, onTargetClicked, true);
    });

    tutorOne();
  }

  function end() {
    events.forEach(function(item) {
      document.removeEventListener(item, onTargetClicked, true);
    });

    if (onCompleted) {
      if (isFirstTimeUser()) {
        setTimeout(function() {
          TQ.MessageBox.confirm({
            content: "Congrats! you have completed the quick tour, you can watch it again from \"settings | help\"",
            onOK: onCompleted
          });
        });
      } else {
        onCompleted();
      }
    }
    TQ.Base.Utility.writeCache("tutor-completed", TUTOR_VERSION);
  }

  function next() {
    isAutoClick = false;
    featureCounter++;
    if (featureCounter < features.length) {
      tutorOne();
    } else {
      end();
    }
  }

  function autoClickToNext() {
    isAutoClick = true;
    if (currentTargets && currentTargets.length > 0) {
      setTimeout(function() {
        currentTargets.click();
        var whiteList = ["id-add-level", "id-add-text", "id-modify-text", "id-modify-text-property", "id-setting",
          "id-save", "id-play", "id-take-screenshot", "id-share"];
        whiteList.some(function(id) {
          if (firstTargetId === id) {
            setTimeout(doMoveToNext, 300);
            return true;
          }
          return false;
        });
      }, 300);
    } else {
      setTimeout(next, 300);
    }
  }

  function previous() {
    if (featureCounter > 0) {
      featureCounter--;
      tutorOne();
    } else {
      end();
    }
  }

  function tutorOne() {
    var feature = features[featureCounter];
    activateTarget(feature[1]);
    dialogInstance = showInstruction(feature);
  }

  function showDepreciatedBtn(btnId) {
    features = [depreciatedItems[btnId]];
    featureCounter = 0;
    tutorOne();
  }

  function showInstruction(feature) {
    var msg = feature[2];
    var pos = feature[0];

    return TQ.MessageBox.show2({ unsafeMessage: msg,
      okText: "►",
      // cancelText:'Cancel', // '◄',
      showCloseButton: true,
      overlayClassName: "display-no",
      overlayClosesOnClick: false,
      position: pos,
      onOk: autoClickToNext
      // onCancel: end
    });
  }

  function activateTarget(idOrClass) {
    if (!idOrClass) {
      currentTargets = null;
      firstTargetId = null;
    } else {
      var ele = (idOrClass[0] === ".") ? getFirstVisibleEle(idOrClass) : document.getElementById(idOrClass);
      var $ele = angular.element(ele);
      TQ.Assert.isTrue(!!ele || !!$ele, "应该有元素");
      if (!$ele.hasClass("am-tutor-flash")) {
        $ele.addClass("am-tutor-flash");
      }

      if ($ele) {
        currentTargets = $ele;
      }
      if (ele) {
        firstTargetId = ele.id;
      }
    }
  }

  function deactivateTarget(id) {
    if (currentTargets && currentTargets.hasClass("am-tutor-flash")) {
      currentTargets.removeClass("am-tutor-flash");
    }
    currentTargets = null;
    firstTargetId = null;
  }

  function onTargetClicked(evt) {
    if (evt && evt.srcElement && evt.srcElement.classList &&
            (evt.srcElement.classList[0] === "vex-dialog-button-primary")) {
      return;
    }

    if (isCorrectAction(evt)) {
      if (!isAutoClick) {
        if (dialogInstance) {
          TQ.MessageBox.hide(dialogInstance);
          dialogInstance = null;
        }
      }

      doMoveToNext();
    }
  }

  function doMoveToNext() {
    deactivateTarget();
    setTimeout(next, 300);
  }

  function isCorrectAction(evt) {
    return firstTargetId ? (firstTargetId === getTargetId(evt))
      : (currentTargets &&
            ((currentTargets[0] === evt.toElement) || (currentTargets[0] === evt.toElement.parentElement)));
  }

  function getTargetId(evt) {
    if (evt.target.id) {
      return evt.target.id;
    } else if (evt.srcElement && evt.srcElement.id) {
      return evt.srcElement.id;
    } else if (evt.toElement && evt.toElement.id) {
      return evt.toElement.id;
    }
    if ((evt.target !== evt.srcElement) || (evt.srcElement !== evt.toElement)) {
      TQ.Log.error("event target special cases");
    }
  }

  function getFirstVisibleEle(classNames) {
    // getElementsByClassName 返回的是 collection，不是array
    var elementCollection = document.getElementsByClassName(classNames.substr(1));
    var visibleEle;

    for (var i = 0; i < elementCollection.length; i++) {
      var ele = elementCollection[i];
      if (angular.element(ele).is(":visible")) {
        visibleEle = ele;
        break;
      }
    }

    if (!visibleEle && elementCollection.length > 0) {
      visibleEle = elementCollection[0];
    }

    return visibleEle;
  }
}());
