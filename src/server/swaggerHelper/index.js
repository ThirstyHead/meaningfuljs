'use strict';
var S = require('string');
var lodash = require('lodash');
var mongoose = require('mongoose');
var swaggerMongoose = require('swagger-mongoose');

var helper = {};
module.exports = helper;

helper.registerRoutes = function(app, swaggerFile) {
    var rawRoutes = [];
    var rawPaths = Object.keys(swaggerFile.paths);
    
    // build up rawRoutes
    rawPaths.forEach(function(element, index, array) {
        // element  === '/books/{bookId}'
        // controller === 'books'
        var route = {};
        route.path = getPath(element);
        route.controller = getController(element);
        route.modelName = S(route.controller).capitalize()
                                             .chompRight('s')
                                             .s;
        route.methods = swaggerFile.paths[element];
        rawRoutes.push(route);
    });

    // connect to Mongo
    app.db = mongoose.createConnection('mongodb://localhost/mediahub');

    // build Mongoose models
    app.mongoose = swaggerMongoose.compile(swaggerFile);

    // register a route for each rawRoute
    rawRoutes.forEach(function(element, index, array) {
        require('./controller')(app, element);
    });
    // var book = require('./controller')(app);

};

function getController(path) {
    return path.split('/')[1];
}

function getPath(path) {
    var oldParts = path.split('/');
    var newParts = [];
    oldParts.forEach(function(it) {
        var part = it;
        if(it.length > 0 && lodash.startsWith(it, '{')) {
            part = ':' + S(it).between('{','}').s;
        }
        newParts.push(part);
    });
    return newParts.join('/');
}  

/*
[ { path: '/books',
    controller: 'books',
    methods: { get: [Object], post: [Object] } },
  { path: '/books/:bookId',
    controller: 'books',
    methods: 
     { parameters: [Object],
       get: [Object],
       put: [Object],
       delete: [Object] } } ]
*/