var emitter = new (require('events').EventEmitter)();

function add(method, args) {
  var blocks = Array.prototype.slice.call(args),
      event  = blocks.shift();
  for (var i = 0; i < blocks.length; i ++) {
    emitter[method](event, blocks[i]);
  }
};

function on(event, listener/*, ...listener */) {
  add('on', arguments);
};

function once(event, listener/*, ...listener */) {
  add('once', arguments);
};

function off(event/*, ...listener */) {
  var args = Array.prototype.slice.call(arguments);
  if (args.length === 1) {
    emitter.removeAllListeners(event);
  } else {
    for (var i = 1; i < args.length; i ++) {
      emitter.removeListener(event, args[i]);
    }
  }
};

function notify(event, args, resume) {
  var pending  = emitter.listeners(event).length;
  var complete = function() {
    pending = pending - 1;
    if (pending <= 0) {
      resume.apply(resume, arguments);
    }
  };
  if ( ! Array.isArray(args)) {
    args = [args];
  }
  args.unshift(event);
  args.push(complete);
  if (pending) {
    emitter.emit.apply(emitter, args);
  } else {
    complete();
  }
};

emitter.setMaxListeners(0);

exports.on     = on;
exports.once   = once;
exports.off    = off;
exports.notify = notify;
