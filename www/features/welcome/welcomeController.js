/**
 * Created by Andrewz on 9/8/2016.
 */
angular.module("starter")
  .controller("welcomeController", welcomeController);

welcomeController.$inject = ["$scope", "$timeout", "$state", "$document"];

function welcomeController($scope, $timeout, $state, $document) {
  var vm = this;
  var readCacheWithParse;
  var writeCache;

  if (TQ.Base && TQ.Base.Utility) {
    readCacheWithParse = TQ.Base.Utility.readCacheWithParse;
    writeCache = TQ.Base.Utility.writeCache;
  } else {
    readCacheWithParse = function(item, defaultValue) {
      var result = localStorage.getItem(item);
      return (result ? JSON.parse(result) : defaultValue);
    };

    writeCache = function(name, value) {
      if (typeof value !== "string") {
        value = JSON.stringify(value);
      }
      return localStorage.setItem(name, value);
    };
  }
  vm.introVideoCompleted = false;
  vm.introStarted = false;
  vm.introPaused = false;

  vm.onStart = onStart;
  vm.onSkipIntro = onSkipIntro;
  vm.clickToStart = clickToStart;
  vm.onClick = onClick;

  vm.showIntroFlag = TQ.Config.introVideoOn && readCacheWithParse("showIntroFlag", true);
  if (vm.showIntroFlag) {
    $timeout(showIntro, 1000);
  } else {
    prepareToStart();
  }

  function prepareToStart() {
    document.addEventListener("touch", onStart);
    document.addEventListener("keydown", onStart);
    $timeout(onStart, 1000);
  }

  function onStart() {
    readyToRemoveWelcomePage();
    document.removeEventListener("touch", onStart);
    document.removeEventListener("keydown", onStart);
    var opus = TQ.Utility.getUrlParam("opus");
    var params = (!opus) ? null : { shareCode: opus };
    var op = (!opus) ? "edit" : "opus";
    $state.go(op, params);
  }

  function showIntro() {
    TQ.AssertExt.invalidLogic(!!TQ.Config.introVideoOn);
    if (vm.showIntroFlag) {
      var introVideo = document.getElementById("id-intro-video");
      var loadTimeout = false;
      var inspector = setTimeout(function() {
        loadTimeout = true;
        onStart();
      }, 50000);

      introVideo.onloadeddata = function() {
        if (!loadTimeout) {
          clearTimeout(inspector);
          inspector = 0;
          // introVideo.play(); //(手机上的限制： play() 只能被用户的event调用）
        }
        $timeout(function() {
          readyToRemoveWelcomePage();
        });
      };

      introVideo.onended = function() {
        $timeout(function() {
          vm.introVideoCompleted = true;
          $timeout(function() {
            vm.onStart();
          }, 300);
        });
      };

      introVideo.load();
    } else {
      prepareToStart();
    }
  }

  function readyToRemoveWelcomePage() {
    // 只是ready to remove, 而留给editor和player来真正地remove，在内容准备好之后，
    // 从而消除在 welcome页面去除之后，内容显示之前的，短暂黑屏
    vm.showIntroFlag = false;
  }

  function clickToStart() {
    var introVideo = document.getElementById("id-intro-video");
    introVideo.play();
    vm.introPaused = false;
    $timeout(function() {
      vm.introStarted = true;
    });
  }

  function onSkipIntro() {
    var introVideo = document.getElementById("id-intro-video");
    introVideo.pause();
    vm.introVideoCompleted = true;
    vm.showIntroFlag = false;
    writeCache("showIntroFlag", vm.showIntroFlag);
    onStart();
  }

  function onClick() {
    if (!vm.introStarted) {
      return;
    }

    vm.introPaused = true;
    var introVideo = document.getElementById("id-intro-video");
    introVideo.pause();
  }
}
