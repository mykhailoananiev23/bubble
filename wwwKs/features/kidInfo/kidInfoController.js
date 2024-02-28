/**
 * Created by Andrewz on 8/7/2016.
 */
angular.module('starter')
    .controller('kidInfoController', kidInfoController);

kidInfoController.$inject = ['$scope', '$timeout'];

function kidInfoController($scope, $timeout) {
    // 变量
    var vm = this;
    vm.hello = hello;
    var kidInfo = {};


    vm.kidInfo = kidInfo;
    vm.save = save;
    vm.eyeColorTypes = ['black', 'blue', 'red', 'green'];
    vm.hairColorTypes = ['black', 'blue', 'red', 'green'];
    vm.bloodTypes = ['A', 'AB', 'B', 'O'];

    function hello() {

    }

    function save() {
        console.log(JSON.stringify(kidInfo));
    }
}
