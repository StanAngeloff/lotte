var http    = require('http'),
    console = require('../lib/console');

var server;

function listen(port, address) {
  if (server) {
    return false;
  }
  server = http.createServer(function(request, response) {
    response.end('XXX: Not implemented.');
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
