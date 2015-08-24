(function () {
    'use strict';

    angular
        .module('app.thing')
        .service('ThingService', ThingService);

    ThingService.$inject = ['$resource', 'restUrl'];
    function ThingService($resource, restUrl) {
        return $resource(restUrl.thing + '/:thingId',
                         {thingId: '@id'},
                         {update: {method: 'PUT'}});
    }

})();
