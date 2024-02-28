// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
angular.module('starter', ['ionic', 'ngCordova', 'ngStorage', 'ngCookies', 'ngFileUpload'])
    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
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
        });
    })

    .config(function($compileProvider, $stateProvider, $urlRouterProvider) {
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

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider
            .state('fingerprinting', {
                url: '/fingerprinting',
                templateUrl: 'features/fingerprinting/view.html'
            })
            .state('kidInfo', {
                url: '/kidinfo',
                templateUrl: 'features/kidInfo/kidInfo.html'
            })
            .state('knownledge', {
                url: '/knownledge',
                templateUrl: 'features/knownledge/view.html'
            })
            .state('physical', {
                url: '/physical',
                templateUrl: 'features/physicalDesc/view.html'
            })
            .state('welcome', {
                url: '/welcome',
                templateUrl: 'features/welcome/welcome.html'
            });
        $urlRouterProvider.otherwise('welcome');
    });
