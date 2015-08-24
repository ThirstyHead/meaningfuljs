'use strict';

var browsers = require('./browsers');
require('date-utils');

var HtmlReporter = require('protractor-jasmine2-html-reporter');
var jasmineReporters = require('jasmine-reporters');
var today = new Date();

var htmlReporter = new HtmlReporter({
    savePath: './reports/protractor/html/',
    screenshotsFolder: 'images',
    takeScreenshots: true,
    takeScreenshotsOnlyOnFailures: false,
    filePrefix: 'index'
});

var junitXmlReporter = new jasmineReporters.JUnitXmlReporter({
    savePath: './reports/protractor/',
    filePrefix: 'junit',
    consolidateAll: true
});

// An example configuration file.
// https://raw.github.com/angular/protractor/master/example/conf.js
exports.config = {
    // seleniumServerJar: '../../node_modules/selenium-standalone/.selenium/selenium-server/2.45.0-server.jar',

    // The address of a running selenium server.
    seleniumAddress: 'http://localhost:4444/wd/hub',

    // Capabilities to be passed to the webdriver instance.
    capabilities: browsers.chrome,

    // Options to be passed to Jasmine-node.
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
    },

    //Time for explicit wait timeout
    params: {
        explicitWaitTimeout: 3000
    },

    framework: 'jasmine2',

    onPrepare: function() {
        jasmine.getEnv().addReporter(htmlReporter);
        jasmine.getEnv().addReporter(junitXmlReporter);
        browser.manage().window().maximize();
        //Synchronization review on non angularJS app as help dialog
        // because protractor waits for angular to finish its work
        global.isAngularSite = function(flag) {
            browser.ignoreSynchronization = !flag;
        };
    }
};
