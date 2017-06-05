'use strict';

var cheerio = require('cheerio');
var express = require('express');
var fetch = require('node-fetch');
var fs = require('fs');
var https = require('express-force-https');
var stringify = require('json-stringify-safe');
var Promise = require('promise');

fetch.Promise = Promise;
var app = express();

var SECURE_PREFIX = 's/';
var AMP_CACHE_TIMEOUT_MS = 10000;
var CONTENT_TYPE_HEADER_NAME = 'content-type';
var SCREEN_SELECTORS = 'amp-story-cover, amp-story-page, amp-story-bookend';

var sendResponse = function(res, statusCode, body) {
  var statusType = Math.floor(statusCode / 100);
  var isError = statusType > 3;
  var logger = isError ? console.error : console.log;

  // logger('OUTGOING RESPONSE\n', 'Status Code: ' + statusCode + '\n', body);
  res.status(statusCode).send(body);
};


app.get('/amp/*', function(req, res) {
  // console.log('INCOMING REQUEST\n', stringify(req, undefined, 2));

  var path = req.params[0];
  if (!path) {
    sendResponse(res, 400, 'Must specify document URL.');
    return;
  }

  var url = path.indexOf(SECURE_PREFIX) === 0
      ? 'https://' + path.substring(SECURE_PREFIX.length)
      : 'http://' + path;

  fetch(url)
      .then(function(fetchResponse) {
        var contentType = fetchResponse.headers.get(CONTENT_TYPE_HEADER_NAME);
        res.setHeader(CONTENT_TYPE_HEADER_NAME, contentType);

        if (!contentType.indexOf('text/html') === 0) {
          // For content types that we don't handle, just directly proxy the
          // resource without doing anything additional.
          fetchResponse.body.pipe(res);
          return;
        }

        fetchResponse.text().then(function(incomingHtml) {
          var outgoingHtml = incomingHtml;

          // Maybe get a specific screen.
          var screenNumber = parseInt(req.query['screen']);
          if (!isNaN(screenNumber)) {
            var $ = cheerio.load(incomingHtml);
            var screens = $(SCREEN_SELECTORS);
            outgoingHtml = $.html(screens[screenNumber]);
          }

          var baseUrl = url.substring(0, url.lastIndexOf('/')) + '/';
          var hasSystemLayer = req.query['stripSystemLayer'] !== "true";
          var hasReadMore = req.query['disableReadMore'] !== "true";
          outgoingHtml = outgoingHtml
              // Add a base href to avoid proxying dependencies.
              .replace(/<html(.*?)>/, '<html$1><base href="' + baseUrl + '">')

              // Toggle the system layer, per the query param.
              .replace(/<amp-story[\s>]/,
                  '<amp-story system-layer="' + hasSystemLayer + '" ' +
                      'read-more="' + hasReadMore + '"');

          // Send the response.
          sendResponse(res, 200, outgoingHtml);
          return;
        })
        .catch(function(error) {
          sendResponse(res, 500, error);
        });
      })
      .catch(function(error) {
        sendResponse(res, 500, error);
      });
});


app.get('/stamp2.js', function(req, res) {
  var cssFileNames = [
    'www/reset.css',
    'www/components2/common.css',
  ];
  var jsFileNames = [
    'www/components2/common.js',
    'www/components2/base-stamp-element.js',
    'www/components2/amp-story.js',
    'www/components2/amp-story-page.js',
    'www/components2/amp-story-base-layer.js',
    'www/components2/amp-story-fill-layer.js',
    'www/components2/amp-story-sequential-layer.js',
    'www/components2/define-elements.js',
  ];

  res.setHeader(CONTENT_TYPE_HEADER_NAME, 'application/javascript');
  sendResponse(res, 200, bundleJsBinary(cssFileNames, jsFileNames));
});



var bundleJsBinary = function(cssFileNames, jsFileNames) {
  var encoding = 'utf-8';
  var output = '';

  var printSeparator = function() {
    output += '\n';
    for (var i = 0; i < 80; i++) {
      output += '/';
    }
  };

  var printLabel = function(label, fileName) {
    printSeparator();
    output += '\n// [' + label + '] ' + fileName;
    printSeparator();
    output += '\n\n';
  };

  output += 'const head = document.getElementsByTagName("head")[0];\n';
  output += 'const customStyles = ' +
      'document.querySelectorAll("style[amp-custom]")[0];\n';
  output += 'const styles = {}\n';

  cssFileNames.forEach(function(cssFileName) {
    printLabel('START', cssFileName);
    output += 'styles["' + cssFileName + '"] = ' +
        'document.createElement("style");\n';
    output += 'styles["' + cssFileName + '"]' +
        '.setAttribute("amp-extension", "amp-story");\n';
    output += 'styles["' + cssFileName + '"]' +
        '.innerHTML = `' + fs.readFileSync(cssFileName, encoding) + '`;\n';

    output +=
        'head.insertBefore(styles["' + cssFileName + '"], customStyles);\n';
    printLabel('END', cssFileName);
  });

  jsFileNames.forEach(function(jsFileName) {
    printLabel('START', jsFileName);
    output += fs.readFileSync(jsFileName, encoding);
    printLabel('END', jsFileName);
  });

  return output;
};

app.use(express.static('www'));
app.use(https);

// Start the server
var PORT = process.env.PORT || 8080;
app.listen(PORT, function() {
  console.log('App listening on port ' + PORT);
  console.log('Press Ctrl+C to quit.');
});
