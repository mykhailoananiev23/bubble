/**
 * Created by Andrewz on 8/13/2016.
 */
angular.module('starter')
    .controller('fingerprintingController', fingerprintingController);

fingerprintingController.$inject = ['$scope', '$timeout', '$state'];

function fingerprintingController($scope, $timeout, $state) {
    // 变量和常量
    var vm = this;
    vm.next = next;
    vm.previous = previous;
    vm.upload = upload;

    function next() {
        $state.go('knownledge');
    }

    function previous() {
        $state.go('physical');
    }

    function upload() {

    }
}
