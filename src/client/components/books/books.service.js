(function () {
    'use strict';

    angular
        .module('app.books')
        .service('BooksService', BooksService);

    BooksService.$inject = ['$resource', 'restUrl'];
    function BooksService($resource, restUrl) {
        // NOTE: look in src/client/app/app.config.json for restUrl
        // return $resource(restUrl.booksMock + '/:thingId',
        // return $resource(restUrl.booksSwagger + '/:thingId',
        return $resource(restUrl.books + '/:thingId',
                         {thingId: '@id'},
                         {update: {method: 'PUT'}});
    }

})();
