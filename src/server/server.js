'use strict';

// web server + middleware
var express = require('express');
var session = require('express-session');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override'); 
var flash = require('connect-flash');
  
// configuration for local user db  
var passport = require('./passportConfig');

// web server variables
var hostname = process.env.HOSTNAME || 'localhost';
var port = parseInt(process.env.PORT, 10) || 3000;
var publicDir = __dirname + '/../../build';
var bowerDir = __dirname + '/../../bower_components'; 

// web server configuration
var app = express();
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(session({ 
                  secret: 'full of meaning js',
                  saveUninitialized: true,
                  resave: true 
                }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// web server static folders
app.use(express.static(publicDir));
app.use('/bower_components', express.static(bowerDir));

// web server routes
app.get('/', function (req, res) {
    res.redirect('/index.html');
});

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
console.log('=============================================');
console.log('Static pages served from: ' + publicDir);
console.log('Web server running at: http://%s:%s', hostname, port);
console.log('=============================================');
app.listen(port, hostname);
