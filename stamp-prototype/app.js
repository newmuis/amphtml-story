'use strict';

var express = require('express');
var https = require('express-force-https');

var app = express();

app.use(express.static('www'));
app.use(https);

// Start the server
var PORT = process.env.PORT || 8080;
app.listen(PORT, function() {
  console.log('App listening on port ' + PORT);
  console.log('Press Ctrl+C to quit.');
});
