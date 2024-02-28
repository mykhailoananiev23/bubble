// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
angular.module("starter", ["ionic", "ngCordova", "ngStorage", "ngCookies", "ngFileUpload", "rzModule",
  "satellizer", "ngSanitize", "ui.select"])
  .run(["$ionicPlatform", "DeviceService", "AppService", function($ionicPlatform, DeviceService, AppService) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleLightContent();
      }

      if (!DeviceService.isReady()) {
        // $cordovaProgress.showSimple(true);
        ionic.Platform.ready(AppService.init);
      } else {
        AppService.init();
      }
    });
  }])

  .config(["$compileProvider", "$stateProvider", "$urlRouterProvider", "$authProvider", "$locationProvider",
    function($compileProvider, $stateProvider, $urlRouterProvider, $authProvider, $locationProvider) {
      // 让img的ng-src可以使用 本地url：
      // unsafe:filesystem:http://localhost:8100/temporary/imgcache/mcImages/p15325.png
      // Angular -1.2.0-rc2 : /^\s*(https?|ftp|file):|data:image\//
      /*        var currentImgSrcSanitizationWhitelist = $compileProvider.imgSrcSanitizationWhitelist();
             newImgSrcSanitizationWhiteList = currentImgSrcSanitizationWhitelist.toString().slice(0,-1)+
             '|filesystem:chrome-extension:'+
             '|blob:chrome-extension%3A'+
             '|filesystem:http:\/\/localhost:8100\/temporary\/imgcache' +
             currentImgSrcSanitizationWhitelist.toString().slice(-1);
             console.log("Changing imgSrcSanitizationWhiteList from "+currentImgSrcSanitizationWhitelist+" to "+newImgSrcSanitizationWhiteList);
             $compileProvider.imgSrcSanitizationWhitelist(newImgSrcSanitizationWhiteList);
             */

      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
      $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|file|filesystem):/);

      $authProvider.facebook({
        clientId: "273410813018932",
        url: "/auth/facebook"
        // url: "/features/orders/thankyou.html"
        // url: "/user/signup"

      });

      $authProvider.google({
        clientId: "143028246441-qvsoi6ug4qnfg5mtl5rd8jfjjrb5itcj.apps.googleusercontent.com"
      });

      $authProvider.twitter({
        url: "/auth/twitter",
        authorizationEndpoint: "https://api.twitter.com/oauth/authenticate",
        redirectUri: window.location.origin,
        oauthType: "1.0",
        // oauth_token: '920796548572868608-0LZ8K881BA6XiesnqIFfkYiYL5YlRLc',
        // oauth_verifier: "abcd123",
        popupOptions: { width: 495, height: 645 }
      });

      // Ionic uses AngularUI Router which uses the concept of states
      // Learn more here: https://github.com/angular-ui/ui-router
      // Set up the various states which the app can be in.
      // Each state's controller can be found in controllers.js
      var editStateAdded = false;
      var stateProvider = $stateProvider
      // .state('prefer', {
      //    url: '/prefer',
      //    templateUrl: 'features/prefer/prefer.html'
      // })
        .state("opus", {
          url: "/opus/:shareCode",
          templateUrl: "admin/adminView.html"
        })
        .state("edit", {
          url: "/edit/:shareCode",
          templateUrl: "admin/adminView.html"
        })
        .state("opus.edit", {
          url: "/edit" // 没有templateUrl，也没有controller， 都是父state的，也就不刷新页面了
          // 但是， 也不能直接打开
        });

      function addStateForEdit() {
        if (editStateAdded) {
          return;
        }

        editStateAdded = true;
        stateProvider
          .state("welcome", {
            url: "/welcome",
            templateUrl: "features/welcome/welcome.html"
          });
      }

      var isPlayOnly = (location.hash.indexOf("#/opus/") >= 0);
      if (isPlayOnly) {
        $urlRouterProvider.otherwise("opus");
      } else {
        addStateForEdit();
        $urlRouterProvider.otherwise("welcome");
      }
      // $locationProvider.html5Mode({
      //    enabled: true,
      //    requireBase: true // false
      // });
    }]);
