'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var controller = {};
module.exports = controller;

controller.get = function(req, res, next) {
    var out;

    if(req.params.id) {
        out = {'title':'foo'};
    } else {
        out = [{'title':'foo'},{'title':'bar'}];
    }
    res.jsonp(out);
};



module.exports = function(app) {
    var router = express.Router();

    // Add middlewares
    router.use(bodyParser.json({limit: '10mb'}));
    router.use(bodyParser.urlencoded({extended: false}));
    router.use(methodOverride());

    // link routes to controller
    router.route('/')
          .get(controller.get);

    router.route('/:id')
          .get(controller.get);


    // mount this router in the main app
    app.use('/books', router);

    return router;
};


