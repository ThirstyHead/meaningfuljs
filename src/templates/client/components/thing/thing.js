(function () {
    'use strict';

    angular
        .module('app.thing', ['app.config'])
        .controller('ThingController', ThingController);

    ThingController.$inject = [];
    function ThingController() {
        var vm = this;
        vm.title = 'Thing';
    }
})();
