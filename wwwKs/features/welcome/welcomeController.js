/**
 * Created by Andrewz on 8/7/2016.
 */
angular.module('starter')
    .controller('welcomeController', welcomeController);

welcomeController.$inject = ['$scope', '$timeout', '$state'];

function welcomeController($scope, $timeout, $state) {
    // 变量
    var vm = this;
    vm.hello = hello;
    vm.start = start;

    function hello() {

    }

    function start() {
        $state.go('kidInfo');
    }
}
