'use strict';

// web server + middleware
var express = require('express');
var session = require('express-session');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override'); 
var flash = require('connect-flash');
var swagger = require('swagger-express-middleware');
var expressListRoutes = require('express-list-routes');
var jsonServer = require('json-server');
var YAML = require('yamljs');
var lodash = require('lodash');

// configuration for local user db  
var passport = require('./passportConfig');

// web server variables
var env = process.env.NODE_ENV || 'development';
var hostname = process.env.HOSTNAME || 'localhost';
var port = parseInt(process.env.PORT, 10) || 3000;
var publicDir = __dirname + '/../../build';
var bowerDir = __dirname + '/../../bower_components'; 
var swaggerFile = {};
swaggerFile.yaml = 'mediahub.yaml';
swaggerFile.json = YAML.load(swaggerFile.yaml);

// web server configuration
var app = express();
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({ 
                  secret: 'keyboard cat',
                  saveUninitialized: true,
                  resave: true 
                }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Swagger middleware for serving up mock RESTful endpoints
var middleware = new swagger.Middleware(app);
middleware.init(swaggerFile.yaml, function(err) {
    app.use(middleware.metadata(app));
    app.use(middleware.files());
    app.use(middleware.CORS());
    app.use(middleware.parseRequest());
    app.use(middleware.validateRequest());

    if(env === 'development'){
        // Create a custom data store with some initial mock data
        var mockDb = new swagger.MemoryDataStore();
        var mockSwagger = require('./mockswagger');
        mockSwagger.forEach(function(element, index, array) {
            mockDb.save(
                new swagger.Resource('/books/' + element._id, element)
            );
        });
        app.use(middleware.mock(mockDb));
    }
});

// json-server gives us full CRUD RESTful endpoints 
// based on static JSON in mockdb.json
var mockJsonRouter = jsonServer.router('mockdb.json');
app.use('/mock', mockJsonRouter);

// wire swagger RESTful endpoints to MongoDB
if(env === 'production'){
    console.log('PRODUCTION Swagger middleware');
    var helper = require('./swaggerHelper');
    helper.registerRoutes(app, swaggerFile.json);
}



// web server static folders
app.use(express.static(publicDir));
app.use('/bower_components', express.static(bowerDir));

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post('/login', function (req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if(err){ return next(err); }

        if(!user){
            console.log('=========');
            console.log(info);
            console.log('=========');
            res.status(401).json(info);
        }

        req.logIn(user, function(err){
            if(err){ return next(err); }
            res.status(200).json(user);   
        });
    })(req, res, next);
});


app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// start web server
app.listen(port, hostname, null, startupHandler);

function startupHandler(){
    console.log('=============================================');
    console.log('NODE_ENV = ' + env);
    console.log('Static pages served from: ' + publicDir);
    console.log('Web server running at: http://%s:%s', hostname, port);
    console.log('=============================================');
    expressListRoutes(app._router);
    console.log('=============================================');
}

