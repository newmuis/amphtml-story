'use strict';

var express = require('express');
var fetch = require('node-fetch');
var https = require('express-force-https');

var app = express();
var ORIGIN_REGEX = /^https?:\/\/[^\/]+/;

var CONTENT_TYPE_HEADER_NAME = 'content-type';
var STAMP_PROTOTYPE_HOST = /https?\:\/\/stamp-prototype.appspot.com/gi;

var sendResponse = function(res, statusCode, body) {
  res.status(statusCode).send(body);
};

// Test new versions of the runtime on pages pointing to the production version.
app.get('/test/*', function(req, res) {
  var url = req.params[0];
  if (!url) {
    sendResponse(res, 400, 'Must specify document URL.');
    return;
  }

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
          console.log(req);
          var currentHost = 'https://' + req.headers.host;
          var baseUrl = url.substring(0, url.lastIndexOf('/')) + '/';
          var outgoingHtml = incomingHtml;
          outgoingHtml = outgoingHtml
              // Add a base href to avoid proxying dependencies.
              .replace(/<html(.*?)>/, '<html$1><base href="' + baseUrl + '">')

              // Replace the stamp-prototype base URL with the current base URL.
              .replace(STAMP_PROTOTYPE_HOST, currentHost);

          // Send the response.
          sendResponse(res, 200, outgoingHtml);
          return;
        }).catch(function(error) {
          sendResponse(res, 500, error);
        });
      }).catch(function(error) {
        sendResponse(res, 500, error);
      });
});

// Fake cache.
app.get('/v/*', function(req, res) {
  var path = req.params[0];
  if (!path) {
    sendResponse(res, 400, 'Must specify document URL.');
    return;
  }

  var isSecureUrl = function(urlStr) {
    return urlStr.startsWith('s/') || urlStr.startsWith('S/');
  };
  var urlScheme = isSecureUrl(path) ? 'https://' : 'http://';
  var urlWithoutScheme = isSecureUrl(path) ? path.substring(2) : path;
  var url = urlScheme + urlWithoutScheme;

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
          console.log(req);
          var currentHost = 'https://' + req.headers.host;
          var baseUrl = url.substring(0, url.lastIndexOf('/')) + '/';
          var outgoingHtml = incomingHtml;
          var v0host = /(http.*)v0.js/.exec(incomingHtml)[1];
          outgoingHtml = outgoingHtml
              // Add a base href to avoid proxying dependencies.
              .replace(/<html(.*?)>/, '<html$1><base href="' + baseUrl + '">')

              // Add the viewer integration script.
              .replace('</head>', '<script async custom-element="amp-viewer-integration" src="' + v0host + 'v0/amp-viewer-integration-0.1.js"></script></head>');

          // Send the response.
          sendResponse(res, 200, outgoingHtml);
          return;
        }).catch(function(error) {
          sendResponse(res, 500, error);
        });
      }).catch(function(error) {
        sendResponse(res, 500, error);
      });
});

app.use(function(req, res, next) {
  if (req.headers.referer) {
    const origin = ORIGIN_REGEX.exec(req.headers.referer)[0];
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('AMP-Access-Control-Allow-Source-Origin', origin);
    res.header('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin');
  }
  next();
});
app.use(express.static('www', { maxage: '600s' }));
app.use(https);

// Start the server
var PORT = process.env.PORT || 8080;
app.listen(PORT, function() {
  console.log('App listening on port ' + PORT);
  console.log('Press Ctrl+C to quit.');
});
