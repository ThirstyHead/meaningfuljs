(function() {
    'use strict';

    angular.module('app', ['ngNewRouter',
                           'ngResource',
                           'ui.bootstrap',
                           'app.home',
                           'app.books'])
    .controller('AppController', AppController);

    AppController.$inject = ['$router'];
    function AppController($router) {
        $router.config([
            {path: '/',
             as: 'home',
             components: {'main':'home'}},
            {path: '/books',
             as: 'books',
             components: {'main':'books'}}
        ]);
    }
})();
