#!/usr/bin/env node

var express = require('express'),
    app     = express.createServer();

app.configure(function(){
  app.use(express.static(require('path').join(__dirname, 'public')));
});

app.listen(parseInt(process.argv[3], 10), process.argv[2]);
