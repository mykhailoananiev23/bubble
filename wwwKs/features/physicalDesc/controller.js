/**
 * Created by Andrewz on 8/7/2016.
 */
angular.module('starter')
    .controller('physicalDescController', physicalDescController);

physicalDescController.$inject = ['$scope', '$timeout'];

function physicalDescController($scope, $timeout) {
    // 变量和常量
    var MAX_MARK = 10,

        vm = this,
        physicalDesc = [];

    vm.add = add;
    vm.location = "";
    vm.locations = ['left arm', 'right-leg', 'left face', '...'];
    vm.mark = "";
    vm.markTypes = ['birthmark', 'scar', 'glasses', 'brace', 'other'];
    vm.physicalDesc = physicalDesc;
    vm.save = save;

    function add() {
        if (physicalDesc.length < MAX_MARK) {
            physicalDesc.push({mark: vm.mark, location: vm.location});
        }
    }

    function hello() {
    }

    function save() {
        console.log(JSON.stringify(physicalDesc));
    }
}
