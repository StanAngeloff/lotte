var http    = require('http'),
    console = require('../lib/console'),
    events  = require('../lib/events');

var server;

function listen(port, address) {
  if (server) {
    close();
  }
  server = http.createServer(function(request, response) {
    var body = '';
    request.on('data', function(chuck) {
      body = body + chuck;
    });
    request.on('end', function() {
      response.writeHead(200, {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      });
      if (body.length) {
        var json  = JSON.parse(body),
            route = /^\/(message)\/([\w\-]+)$/.exec(request.url);
        if (route && route[1] === 'message' && route[2]) {
          events.message(route[2], json, function() {
            response.end(JSON.stringify(Array.prototype.slice.call(arguments)));
          });
        } else {
          response.end("URL '" + request.url + "' is not supported.");
        }
      } else {
        response.end();
      }
    });
  });
  server.listen(parseInt(port, 10), address);
};

function close() {
  if (server) {
    server.close();
    server = null;
  }
};

exports.listen = listen;
exports.close  = close;
