(function () {
    'use strict';

    angular
        .module('app.books')
        .service('BooksService', BooksService);

    BooksService.$inject = ['$resource'];
    function BooksService($resource) {
        return $resource('/mock/books/:id',
        // return $resource('/swagger/books/:id',
                         {id: '@_id'},
                         {update: {method: 'PUT'}});
    }

})();
