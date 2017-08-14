'use strict';

var express = require('express');
var https = require('express-force-https');

var app = express();
var ORIGIN_REGEX = /^https?:\/\/[^\/]+/;

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
