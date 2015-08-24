(function() {
    'use strict';

    var modules = ['ngNewRouter',
                   'ngResource',
                   'app.config',
                   'ui.bootstrap',
                   'app.home',
                   'app.books'];

    angular.module('app', modules)
           .controller('AppController', AppController);

    AppController.$inject = ['$router',
                             'env'];

    function AppController($router, env) {
        console.log('Environment: ' + env);
        var routes = [
            {'path': '/',
             'as': 'home',
             'components': {'main':'home'}},
            {'path': '/books',
             'as': 'books',
             'components': {'main':'books'}}
        ];

        $router.config(routes);
    }
})();
