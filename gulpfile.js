'use strict';

// Load Node Modules/Plugins
var gulp = require('gulp-help')(require('gulp'));
var gulpPlugin = require('gulp-load-plugins')({lazy: true});
var gulpNgConfig = require('gulp-ng-config');
var del = require('del');
var plato = require('plato');
var browserSync = require('browser-sync');
var wiredep = require('wiredep').stream;
var lodash = require('lodash');
var eventStream = require('event-stream');
var os = require('os');
var fs = require('fs-extra');

// read in package.json
var pkginfo = require('pkginfo')(module);
var packageJson = module.exports;

// Testing Modules
var selenium = require('selenium-standalone');
var protractor = require('gulp-protractor').protractor;
var jasmineReporters = require('jasmine-reporters');
var JasmineSpecReporter = require('jasmine-spec-reporter');
var karma = require('karma');
var karmaParseConfig = require('karma/lib/config').parseConfig;

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
dir.npm = './node_modules';

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
src.json = [dir.client + '/**/*.json'];
src.jsNoTests = [
    dir.client + '/**/*.js',
    '!' + dir.client + '/**/*.spec.js',
];
src.less = [
    dir.client + '/**/*.less',
    dir.bower + '/theme/less/theme.less'
];
src.protractor = [dir.protractor + '/**/*.spec.js'];
src.jasmine = [dir.client + '/**/*.spec.js'];

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
build.jsExceptTests = dir.build + '/js/**/!(*.spec).js';

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
          ['build-js',
           'build-css',
           'build-img',
           'build-favicon',
           'build-angular-const',
           'build-json'],
          function() {
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
                    js:  '<script src="{{filePath}}"></script>',
                    css: '<link rel="stylesheet" href="{{filePath}}" />'
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

    var jsTransform = function(filepath) {
        return '<script src="' + filepath.replace('../../build/', '') + '"></script>';
    };
    var cssTransform = function(filepath) {
        return '<link rel="stylesheet" href="' + filepath.replace('../../build/', '') + '" />';
    };

    // copy over all html
    gulp.src(src.html)
        .pipe(gulp.dest(build.html));

    // inject index.html
    gulp.src(src.index)
        .pipe(wiredep(wiredepOptions))
        .pipe(gulpPlugin.inject(injectJsNoTests, {relative: true, transform: jsTransform}))
        .pipe(gulpPlugin.inject(injectCss, {relative: true, transform: cssTransform}))
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
 * Builds Angular environment-specific
 * constants file based on the NODE_ENV
 * environment variable
 *
 * NOTE: defaults to 'development'
 */
gulp.task('build-angular-const',
          hideTask,
          function() {
    var env = process.env.NODE_ENV || 'development';
    var ngConfigOptions = {
        environment: env,
        wrap: true
    };

    return gulp.src(dir.client + '/app/app.config.json')
               .pipe(gulpNgConfig('app.config',
                                  ngConfigOptions))
               .pipe(gulpPlugin.replace('"', '\''))
               .pipe(gulp.dest(build.js + '/app'));
});

/**
 * Builds CSS
 */
gulp.task('build-css',
          hideTask,
          function() {
              gulp.src(src.css)
                  .pipe(gulp.dest(dir.build));

              return gulp.src(src.less)
                         .pipe(gulpPlugin.sourcemaps.init())
                         .pipe(gulpPlugin.plumber())
                         .pipe(gulpPlugin.less())
                         .pipe(gulpPlugin.autoprefixer({browsers: ['last 2 version', '> 5%']}))
                         .pipe(gulpPlugin.sourcemaps.write('/maps'))
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
    // check this file for errors,
    // but don't deploy to build
    gulp.src('./gulpfile.js')
        .pipe(gulpPlugin.jshint())
        .pipe(gulpPlugin.jshint.reporter('jshint-stylish', {verbose: true}))
        .pipe(gulpPlugin.jshint.reporter('fail'))
        .pipe(gulpPlugin.jscs());

    return gulp.src(src.js)
               .pipe(gulpPlugin.jshint())
               .pipe(gulpPlugin.jshint.reporter('jshint-stylish', {verbose: true}))
               .pipe(gulpPlugin.jshint.reporter('fail'))
               .pipe(gulpPlugin.jscs())
               .pipe(gulp.dest(build.js));
});

/**
 * Builds JSON
 */
gulp.task('build-json',
          hideTask,
          function() {
              return gulp.src(src.json)
                  .pipe(gulpPlugin.jsonlint())
                  .pipe(gulpPlugin.jsonlint.reporter())
                  .pipe(gulp.dest(dir.build));
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
          ['clean', 'build', 'dist-js', 'dist-css', 'dist-json'],
          function() {
              var wiredepOptions = {
                  dependencies: true,
                  devDependencies: false,
                  ignorePath: /^\/|(\.\.\/){1,2}/,
                  fileTypes:{
                      html: {
                          replace: {
                              js:  '<script src="{{filePath}}"></script>',
                              css: '<link rel="stylesheet" href="{{filePath}}" />'
                          }
                      }
                  }
              };

              // NOTE: gulp-inject is for our app / custom code
              var injectJs = gulp.src(['./**/*.js'],
                                      {cwd: __dirname + '/dist'})
                  .pipe(gulpPlugin.angularFilesort());

              var injectJsNoTests = gulp.src(['./**/*.js', '!./**/*.spec.js'],
                                             {cwd: __dirname + '/dist'})
                  .pipe(gulpPlugin.angularFilesort());

              var injectCss = gulp.src(['./**/*.css'],
                                       {cwd: __dirname + '/dist'});

              var jsTransform = function(filepath) {
                  return '<script src="' + filepath.replace('../../dist/', '') + '"></script>';
              };
              var cssTransform = function(filepath) {
                  return '<link rel="stylesheet" href="' +
                         filepath.replace('../../dist/', '') + '" />';
              };

              // copy over all html
              gulp.src(src.html.concat(['!**/specs.html']))
                  .pipe(gulp.dest(dist.html));

              // inject index.html
              return gulp.src(src.index)
                  .pipe(wiredep(wiredepOptions))
                  .pipe(gulpPlugin.inject(injectJsNoTests,
                                          {relative: true, transform: jsTransform}))
                  .pipe(gulpPlugin.inject(injectCss, {relative:true, transform:cssTransform}))
                  .pipe(gulp.dest(dist.html));

          });

gulp.task('dist-js',
          hideTask,
          ['build-js'],
          function() {
              return gulp.src(build.jsExceptTests)
                  .pipe(gulpPlugin.sourcemaps.init())
                  .pipe(gulpPlugin.concat('app/app.js'))
                  .pipe(gulpPlugin.uglify())
                  .pipe(gulpPlugin.sourcemaps.write('/maps'))
                  .pipe(gulp.dest(dir.dist));
          });

gulp.task('dist-css',
          hideTask,
          ['build-css'],
          function() {
              return gulp.src(build.css + '**/*.css')
                  .pipe(gulpPlugin.sourcemaps.init('/maps'))
                  .pipe(gulpPlugin.minifyCss())
                  .pipe(gulpPlugin.sourcemaps.write('/maps'))
                  .pipe(gulp.dest(dir.dist));
          });

gulp.task('dist-json',
          hideTask,
          ['build-json'],
          function() {
              return gulp.src(dir.build + '/**/*.json')
                  .pipe(gulp.dest(dir.dist));
          });

/**
 * Runs unit test in multiple browsers via Karma
 */
gulp.task('karma',
          hideTask,
          function(cb) {
    var server = karma.server;
    var config = karmaParseConfig(__dirname + '/karma.conf.js', {});
    server.start(config, function(exitCode) {
        console.log('Karma has exited with ' + exitCode);
        cb();
        process.exit(exitCode);
    });
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
                       // Also reload the browsers after a slight delay
                       setTimeout(function reload() {
                           browserSync.notify('reloading now ...');
                           browserSync.reload({
                               stream: false
                           });
                           cb();
                       }, 1000);
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
          'Runs Plato report on the project',
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
          'Runs Protractor tests',
          function() {
    del.sync([reports.protractor]);

    var port = process.env.PORT || 3000;
    var protractorOptions = {
        configFile: dir.protractor + '/configuration/protractor.conf.js',
        args: ['--baseUrl', 'http://127.0.0.1:' + port + '/' + packageJson.name]
    };

    return gulp.src(src.protractor)
               .pipe(protractor(protractorOptions))
               .on('error', function(e) { throw e; })
               .on('end', function() {
                   console.log('=========================');
                   console.log('Protractor test run done.');
                   console.log('See ' + reports.protractor + '/html/index.html');
                   console.log('=========================');
               });
});

/**
 * Deletes generated and downloaded artifacts (node_modules, bower_components)
 */
gulp.task('reset',
          'Deletes generated (build, dist, reports) ' +
          'and downloaded artifacts (node_modules, bower_components)',
          function(cb) {
    del.sync([dir.build, dir.dist, dir.reports, dir.bower, dir.npm]);
    return cb();
});

/**
 * Runs website (dev-mode)
 */
gulp.task('run',
          'Runs website',
          ['nodemon'],
          function() {
              var port = process.env.PORT || 3000;
              var syncPort = process.env.SYNC_PORT || 4000;
              var publicDir = (process.env.NODE_ENV === 'production' ? 'dist' : 'build');
              var browserSyncOptions = {
                  // All of the following files will be watched
                  files: [dir[publicDir] + '/**/*.*'],

                  // Tells BrowserSync on where the express app is running
                  proxy: 'http://localhost:' + port + '/' + packageJson.name,

                  // This port should be different from the express app port
                  port: syncPort,

                  // Which browser should we launch?
                  browser: ['google chrome']
              };

              browserSync.init(browserSyncOptions);

              // Register a watcher on the src directory for changes,
              // which will update the build directory,
              // which will trigger browserSync + nodemon
              return gulp.watch(dir.src + '/**/*.*', [publicDir]);
          });

/**
 * Runs Selenium server (for Protractor tests)
 */
gulp.task('selenium',
          'Downloads and runs Selenium server',
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

/**
 * Runs Jasmine tests
 */
gulp.task('test',
          'Runs Jasmine tests',
          function(cb) {
    // prints JUnit XML
    var junitReporter = new jasmineReporters.JUnitXmlReporter({
        savePath: dir.reports + '/jasmine/junit',
        consolidateAll: false
    });

    // prints test results to the console
    var jasmineSpecReporter = new JasmineSpecReporter({
        displayFailuresSummary: true,
        displaySuccessfulSpec: true,
        displayFailedSpec: true,
        displayPendingSpec: true
    });

    // configuration for the Jasmine test runner
    var jasmineOptions = {
        verbose: true,
        reporter: [junitReporter, jasmineSpecReporter]
    };

    // delete old test run data
    del.sync([dir.reports + '/jasmine', dir.reports + '/coverage']);

    // instrument the classes for coverage, then run the tests
    return gulp.src(src.jsNoTests)
               .pipe(gulpPlugin.istanbul({includeUntested: true}))
               .on('finish', function () {
                   gulp.src(src.jasmine)
                       .pipe(gulpPlugin.jasmine(jasmineOptions))
                       .pipe(gulpPlugin.istanbul.writeReports({
                           dir: dir.reports + '/coverage',
                           reporters: ['lcov', 'text-summary'],
                           reportOpts: {dir: dir.reports + '/coverage'}
                       }));
               });
});
