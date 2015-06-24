'use strict';

var HtmlReporter = require('protractor-html-screenshot-reporter');

var htmlReporter = new HtmlReporter({
    baseDirectory: './reports/protractor/html',
    docTitle: 'Protractor Test Results',
    docName: 'index.html'
});

// An example configuration file.
// https://raw.github.com/angular/protractor/master/example/conf.js
exports.config = {
    // seleniumServerJar: '../../node_modules/selenium-standalone/.selenium/selenium-server/2.45.0-server.jar',

    // The address of a running selenium server.
    seleniumAddress: 'http://localhost:4444/wd/hub',

    // Capabilities to be passed to the webdriver instance.
    capabilities: {
        'browserName': 'chrome'
    },

    // Options to be passed to Jasmine-node.
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
    },

   onPrepare: function() {
      jasmine.getEnv().addReporter(htmlReporter);
   }    
};


