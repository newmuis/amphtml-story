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
app.use(express.static('www'));
app.use(https);

// Start the server
var PORT = process.env.PORT || 8080;
app.listen(PORT, function() {
  console.log('App listening on port ' + PORT);
  console.log('Press Ctrl+C to quit.');
});
