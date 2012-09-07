const STATUS_SUCCESS   = 'success';
const STATUS_FAIL      = 'fail';
const STATUS_EXCEPTION = 'exception';
const STATUS_SKIPED    = 'skipped';

const INPUT_METHOD_UNKNOWN     = 0x00;
const INPUT_METHOD_KEYBOARD    = 0x01;
const INPUT_METHOD_PASTE       = 0x02;
const INPUT_METHOD_DROP        = 0x03;
const INPUT_METHOD_IME         = 0x04;
const INPUT_METHOD_OPTION      = 0x05;
const INPUT_METHOD_HANDWRITING = 0x06;
const INPUT_METHOD_VOICE       = 0x07;
const INPUT_METHOD_MULTIMODAL  = 0x08;
const INPUT_METHOD_SCRIPT      = 0x09;

const BREAK_CASE = '__breakCase__';

const PADDING = '  ';

var _webpage = require('webpage'),
    _ansi    = require('./ansi'),
    _assert  = require('./assert'),
    _console = require('./console'),
    _pages   = [],
    _waiting = 0,
    _failed, _title, _baseUri;

this.title = function title(name) {
  var previous = _title;
  if (arguments.length) {
    _title = name;
  }
  return previous;
};

this.base = function base(uri) {
  var previous = _baseUri;
  if (arguments.length) {
    _baseUri = uri;
  }
  return previous;
};

this.absolute = function absolute(uri) {
  if (uri.indexOf('://') < 0) {
    uri = _baseUri + uri;
  }
  return uri;
};

this.open = function open(uri, message, options, block) {
  var args = Array.prototype.slice.call(arguments);
  uri = message = options = block = void 0;
  for (var i = args.length; -- i >= 0;) {
    if (typeof (args[i]) === 'function') {
      block   = args.splice(i, 1)[0];
    } else if (typeof (args[i]) === 'object') {
      options = args.splice(i, 1)[0];
    }
  }
  args.length && (uri     = args.shift());
  args.length && (message = args.pop());
  var webpage = _webpage.create(options),
      page    = null;
  uri = absolute(uri);
  webpage.onError = function(message, trace) {
    _console.error("Uncaught exception in '" + ${FILE:encode} + "':");
    _console.error(message);
    trace.forEach(function(line) {
      _console.error('  ' + line.file + ':' + line.line + (line.function ? (' in ' + line.function) : ''));
    });
    phantom.exit(4);
  };
  webpage.open(uri, function(status) {
    if (page) {
      page._onLoad();
    } else {
      page = new TestPage(webpage, message || uri);
      if (status === STATUS_SUCCESS) {
        _pages.push(page);
        block.call(page);
        page._process();
      } else {
        _waiting = _waiting - 1;
        _failed  = true;
        _console.warn("Could not open page at '" + uri + "'.");
      }
    }
  });
  _waiting = _waiting + 1;
};

this.message = function message(/* event, ...args, resume */) {
  var args   = Array.prototype.slice.call(arguments),
      event  = args.shift(),
      resume = (typeof (args[args.length - 1]) === 'function' ? args.pop() : null);
  if ( ! ${EVENTS}) {
    return (resume && resume());
  }
  var request  = new XMLHttpRequest();
  var complete = function() {
    if (request.status >= 200 && request.status < 300) {
      var json = JSON.parse(request.responseText);
      resume.apply(resume, json);
    } else {
      _console.error("Could not process event '" + event + "', server HTTP status code was '" + request.status + ' ' + request.statusText + "':");
      _console.error(request.responseText);
      phantom.exit(3);
    }
  };
  request.onreadystatechange = function() {
    if (resume && request.readyState === 4) {
      complete();
    }
  };
  request.open('POST', ${SERVER:encode} + '/message/' + encodeURIComponent(event), true);
  request.setRequestHeader('Content-Type', 'application/json');
  request.send(JSON.stringify(args));
};

function _indent(level) {
  var args = Array.prototype.slice.call(arguments, 1),
      padd = Array(level + 1).join(PADDING);
  return (padd + args.join(' ').replace(/\r\n|\r|\n/g, '\n' + padd));
};

function _style(type) {
  switch (type) {
    case 'TestPage':
    case 'TestGroup':      return _ansi.style('white');
    case STATUS_SUCCESS:   return _ansi.style('green');
    case STATUS_FAIL:
    case STATUS_EXCEPTION: return _ansi.style('red');
    case STATUS_SKIPED:    return _ansi.style('magenta');
  }
};

function _symbol(type) {
  switch (type) {
    case 'TestPage':       return '@ ';
    case 'TestGroup':      return '– ';
    case STATUS_SUCCESS:   return '✓ ';
    case STATUS_FAIL:
    case STATUS_EXCEPTION: return '✗ ';
    case STATUS_SKIPED:    return '- ';
  }
};

function _extend(parent) {
  var klass = function() {};
  klass.prototype = parent.prototype;
  return new klass();
};


var TestPage      = require('./test/page'),
    TestGroup     = require('./test/group'),
    TestCase      = require('./test/case'),
    DocumentQuery = require('./document/query');


${CODE}


var _interval = setInterval(function() {
  if (_waiting <= 0) {
    clearInterval(_interval);
    console.log(_ansi.style('bold') + _ansi.style('underline') + (_title || ${FILE:encode}) + _ansi.style('reset'));
    _pages.forEach(function(page) {
      page._print();
    });
    phantom.exit(_failed ? 1 : 0);
  }
}, 125);

window.onerror = function() {
  _console.error("Uncaught exception in '" + ${FILE:encode} + "':");
  _console.error(Array.prototype.slice.call(arguments).join('; ').trim());
  phantom.exit(2);
};
