'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

// Controller
var controller = {};
module.exports = controller;

controller.setModel = function(mongooseModel) {
    controller.model = mongooseModel;
};

controller.get = function(req, res, next) {
    var handler = function(err, obj){
        if(err){ throw err; }
        res.jsonp(obj);
    };

    if(req.params.id) {
        controller.model.findById(req.params.id, handler);
    } else {
        controller.model.find(handler);
    }
};

controller.post = function(req, res, next) {
    var handler = function (err, savedObj) {
        if(err) { throw err; }
        res.status(201);
        res.jsonp(savedObj);
    };

    var obj = new controller.model(req.body);
    obj.save(handler);
};

controller.put = function(req, res, next) {
    var handler =  function(err, obj){
        if(err){ throw err; }
        obj.set(req.body);
        obj.save(function (err, savedObj) {
            if(err) { throw err; }
            res.status(200);
            res.jsonp(savedObj);
        });
    };

    controller.model.findById(req.params.id, handler);
};

controller.delete = function(req, res, next) {
    var handler = function (err, obj) {
        if(err){ throw err; }
        obj.remove(function (err2) {
            if(err2){ throw err2; }
            res.status(204).end();
        });
    };

    controller.model.findById(req.params.id, handler);
};

// Constructor
module.exports = function(app, rawRoute) {
    var router = express.Router();

    // register Mongoose model with controller
    controller.setModel(app.db.model(rawRoute.modelName));
    
    // Add middlewares
    router.use(bodyParser.json({limit: '10mb'}));
    router.use(bodyParser.urlencoded({extended: false}));
    router.use(methodOverride());

    // link routes to controller
    router.route('/')
          .get(controller.get)
          .post(controller.post);

    router.route('/:id')
          .get(controller.get)
          .put(controller.put)
          .delete(controller.delete);


    // mount this router in the main app
    // app.use('/books', router);
    app.use('/' + rawRoute.controller, router);

    return router;
};
