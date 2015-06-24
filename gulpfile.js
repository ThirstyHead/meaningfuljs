'use strict';

// Load Node Modules/Plugins
var gulp = require('gulp-help')(require('gulp'));
var gulpPlugin = require('gulp-load-plugins')({lazy: true});
var del = require('del');
var plato = require('plato');
var browserSync = require('browser-sync');
var wiredep = require('wiredep').stream;
var lodash = require('lodash');

// Testing Modules
var selenium = require('selenium-standalone');
var protractor = require('gulp-protractor').protractor;

// variables and settings
var dir = {};
dir.build = './build';
dir.dist = './dist';
dir.reports = './reports';
dir.src = './src';
dir.client = dir.src + '/client';
dir.server = dir.src + '/server';
dir.protractor = dir.src + '/protractor';
dir.bower = './bower_components';

var src = {};
src.index = [dir.client + '/index.html'];
src.specRunner = [dir.client + '/specs.html'];  
src.html = [dir.client + '/**/*.html']; 
src.css = [dir.client + '/**/*.css'];
src.img = [
    dir.client + '/**/*.png',
    dir.client + '/**/*.jpg',
    dir.client + '/**/*.gif'
];
src.favicon = [dir.client + '/favicon.ico'];
src.js = [dir.client + '/**/*.js'];
src.less = [
    dir.client + '/**/*.less',
    dir.bower + '/theme/less/theme.less'
];
src.protractor = [dir.protractor + '/**/*.spec.js'];

var build = {};
build.html = dir.build;
build.css = dir.build + '/css';
build.img = dir.build + '/img';
build.js = dir.build + '/js';
build.allExceptTests = [
   dir.build + '/**/*.*',
   '!' + dir.build + '/**.spec.js',
   '!' + dir.build + '/specs.html' 
];

var dist = {};
dist.html = dir.dist;
dist.css = dir.dist + '/css';
dist.img = dir.dist + '/img';
dist.js = dir.dist + '/js';

var reports = {};
reports.protractor = dir.reports + '/protractor';

//NOTE: this hides tasks from 'gulp help',
//      but leaves them runnable as dependent tasks
var hideTask = false; 


/**
 * Default task
 */
gulp.task('default', 
          '*** Default task ***', 
          ['help']);

/**
 * Builds runnable website
 */
gulp.task('build', 
          'Builds runnable website (dev-mode)', 
          ['build-js', 'build-css', 'build-img', 'build-favicon'],
          function(){
    // NOTE: wiredep is for bower_components
    //       These custom options strip the leading
    //       relative path (/../../) off         
    var wiredepOptions = {
        dependencies: true,
        devDependencies: false,
        ignorePath: /^\/|(\.\.\/){1,2}/,
        fileTypes:{
            html: {
                replace: {
                  js:  '<script src="/{{filePath}}"></script>',
                  css: '<link rel="stylesheet" href="/{{filePath}}" />'
                }
            }
        }
    };

    // NOTE: gulp-inject is for our app / custom code
    var injectJs = gulp.src(['./**/*.js'], 
                             {cwd: __dirname + '/build'})
                        .pipe(gulpPlugin.angularFilesort());

    var injectJsNoTests = gulp.src(['./**/*.js', '!./**/*.spec.js'], 
                             {cwd: __dirname + '/build'})
                        .pipe(gulpPlugin.angularFilesort());

    var injectCss = gulp.src(['./**/*.css'], 
                             {cwd: __dirname + '/build'});

    // copy over all html
    gulp.src(src.html)
        .pipe(gulp.dest(build.html));

    // inject index.html    
    gulp.src(src.index)
        .pipe(wiredep(wiredepOptions))
        .pipe(gulpPlugin.inject(injectJsNoTests))
        .pipe(gulpPlugin.inject(injectCss))
        .pipe(gulp.dest(build.html));

    // inject specs.html
    // NOTE: add in devDependencies as well        
    var testOptions = {};
    lodash.merge(testOptions, wiredepOptions);
    testOptions.devDependencies = true;
    
    return gulp.src(src.specRunner)
               .pipe(wiredep(testOptions))
               .pipe(gulpPlugin.inject(injectJs))
               .pipe(gulpPlugin.inject(injectCss))
               .pipe(gulp.dest(build.html));
});

/**
 * Builds CSS
 */
gulp.task('build-css', 
          hideTask, 
          function() {
    // return gulp.src(src.css)
    //            .pipe(gulpPlugin.concat('app.css'))
    //            .pipe(gulp.dest(build.css));

    // copy css from src to build 
    gulp.src(src.css)
        .pipe(gulp.dest(dir.build));

    // build less
    return gulp.src(src.less)
               .pipe(gulpPlugin.plumber())
               .pipe(gulpPlugin.less())
               .pipe(gulpPlugin.autoprefixer({browsers: ['last 2 version', '> 5%']}))
               .pipe(gulp.dest(build.css));
});

/**
 * Builds favicon
 */
gulp.task('build-favicon', 
          hideTask, 
          function() {

    return gulp.src(src.favicon)
               .pipe(gulp.dest(build.html));
});

/**
 * Builds images
 */
gulp.task('build-img', 
          hideTask, 
          function() {

    return gulp.src(src.img)
               .pipe(gulp.dest(build.img));
});

/** 
 * Builds JS
 */
gulp.task('build-js', 
          hideTask, 
          function() {
    return gulp.src(src.js)
               .pipe(gulpPlugin.jshint())
               .pipe(gulpPlugin.jshint.reporter('jshint-stylish', {verbose: true}))
               .pipe(gulpPlugin.jshint.reporter('fail'))
               .pipe(gulpPlugin.jscs())
               // .pipe(gulpPlugin.concat('app.js'))
               // .pipe(gulpPlugin.uglify())
               .pipe(gulp.dest(build.js));
});

/** 
 * Deletes generated artifacts
 */
gulp.task('clean', 
          'Deletes generated artifacts', 
          function(cb) {
    del.sync([dir.build, dir.dist, dir.reports]);
    return cb();
});

/**
 * Builds production website
 */
gulp.task('dist', 
          'Builds production website (prod-mode)', 
          ['clean', 'build'],
          function(){
    return gulp.src(build.allExceptTests)
               .pipe(gulp.dest(dir.dist));
});

/**
 * Keeps web server up and running
 * Called by 'run' task
 */
gulp.task('nodemon', 
           hideTask, 
           function(cb) {

    // We use this `called` variable to make sure the callback is only executed once
    var called = false;
    var port = process.env.PORT || 3000;
    var nodemonOptions = {
        port: port,
        script: dir.server + '/server.js',
        watch: [dir.server + '/server.js', 
                dir.build + '/**/*.*']        
    };

    return gulpPlugin.nodemon(nodemonOptions)
    .on('start', function onStart() {
        console.log('*** nodemon started');
        if (!called) {
            cb();
        }
        called = true;
    })
    .on('restart', function onRestart() {
        console.log('*** nodemon restarted');

        // Also reload the browsers after a slight delay
        setTimeout(function reload() {
            browserSync.notify('reloading now ...');
            browserSync.reload({
                stream: false
            });
        }, 1000);
    })
    .on('crash', function () {
        console.log('*** nodemon crashed: script crashed for some reason');
    })
    .on('exit', function () {
        console.log('*** nodemon exited cleanly');
    });
});

/**
 * Create a visualizer report
 */
gulp.task('plato', 
          hideTask, 
          ['clean', 'build'],
          function(done) {
    console.log('Analyzing source with Plato');
    console.log('Browse to ' + dir.reports + '/plato/index.html to see Plato results');

    var options = {
        title: 'Plato Inspections Report',
        exclude: /.*\.spec\.js/
    };

    plato.inspect([build.js + '/**/*.js'], 
                  dir.reports + '/plato/', 
                  options, 
                  platoCompleted);

    function platoCompleted(report) {
        var overview = plato.getOverviewReport(report);
        console.log(overview.summary);
        if (done) { 
            done(); 
        }
    }
});

/**
 * Runs Protractor tests (browser acceptance tests)
 */
gulp.task('protractor', 
          hideTask, 
          function(){
    del.sync([reports.protractor]);

    var protractorOptions = {
        configFile: dir.protractor + '/protractor.conf.js',
        args: ['--baseUrl', 'http://127.0.0.1:8000']
    };

    return gulp.src(src.protractor)
               .pipe(protractor(protractorOptions))
               .on('error', function(e) { throw e; })
               .on('end', function(){
                    console.log('=========================');
                    console.log('Protractor test run done.');
                    console.log('See ' + reports.protractor + '/html/index.html');
                    console.log('=========================');
               });
});

/**
 * Runs website (dev-mode)
 */
gulp.task('run', 
          'Runs website (dev-mode)',
          ['nodemon'], 
          function(){

    var port = process.env.PORT || 3000;
    var browserSyncOptions = {
        // All of the following files will be watched
        files: [dir.build + '/**/*.*'],

        // Tells BrowserSync on where the express app is running
        proxy: 'http://localhost:' + port,

        // This port should be different from the express app port
        port: 4000,

        // Which browser should we launch?
        browser: ['google chrome']
    };

    browserSync.init(browserSyncOptions);

    // Register a watcher on the src directory for changes,
    // which will update the build directory,
    // which will trigger browserSync + nodemon
    return gulp.watch(dir.src + '/**/*.*', ['build']);
});

/**
 * Runs Selenium server (for Protractor tests)
 */
gulp.task('selenium', 
          hideTask, 
          function (done) {

    // NOTE: this redirects Selenium server output
    //       from std.err to std.out            
    var seleniumOptions = {
        spawnOptions: {
            stdio: 'inherit'
        }
    };

    var seleniumInstallOptions = {
        logger: function (message) { 
            console.log(message);
        }
    };

    selenium.install(seleniumInstallOptions, 
                     function (err) {
        if (err) { return done(err); }

        selenium.start(seleniumOptions, 
                       function (err, child) {
            if (err) { return done(err); }
            selenium.child = child;
            done();
        });
    });
});


