#!/usr/bin/env node

var express = require('express'),
    app     = express();

app.configure(function(){
  app.use(express.static(require('path').join(__dirname, 'public')));
});

// http://node-js.ru/3-writing-express-middleware
// Attribution 3.0 Unported (CC BY 3.0)
function basic_auth (request, response, next) {
  if (request.headers.authorization && request.headers.authorization.search('Basic ') === 0) {
    if (new Buffer(request.headers.authorization.split(' ')[1], 'base64').toString() === 'secret:password') {
      return next();
    }
  }
  response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secret"' });
  if (request.headers.authorization) {
    response.end('Authentication required');
  } else {
    response.end('Authentication required');
  }
};

app.get('/secret', basic_auth, function(request, response) {
  response.end('OK');
});

app.listen(parseInt(process.argv[3], 10), process.argv[2]);
