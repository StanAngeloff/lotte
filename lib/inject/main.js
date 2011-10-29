const PADDING = '  ';

const STATUS_SUCCESS = 'success';
const STATUS_FAIL    = 'fail';
const STATUS_SKIPED  = 'skipped';

var _webpage = require('webpage'),
    _ansi    = require('./ansi'),
    _assert  = require('./assert'),
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

this.open = function open(uri, message, block) {
  var page = _webpage.create();
  uri = absolute(uri);
  if (arguments.length < 3) {
    block   = message;
    message = void 0;
  }
  page.open(uri, function(status) {
    if (status === STATUS_SUCCESS) {
      var top = new TestPage(page, message || uri);
      _pages.push(top);
      block.call(top);
      top._process();
    } else {
      _waiting = _waiting - 1;
      _failed  = true;
      console.warn(_ansi.style('yellow') + "Could not open page at '" + uri + "'." + _ansi.style('reset'));
    }
  });
  _waiting = _waiting + 1;
};

function _indent(level) {
  var args = Array.prototype.slice.call(arguments, 1),
      padd = Array(level + 1).join(PADDING);
  return (padd + args.join(' ').replace('\n', '\n' + padd, 'g'));
};

function _style(type) {
  switch (type) {
    case 'page', 'group': return _ansi.style('white');
    case STATUS_SUCCESS:  return _ansi.style('green');
    case STATUS_FAIL:     return _ansi.style('red');
    case STATUS_SKIPED:   return _ansi.style('magenta');
  }
  return '';
};

function _symbol(type) {
  switch (type) {
    case 'page':          return '@ ';
    case 'group':         return '– ';
    case STATUS_SUCCESS:  return '✓ ';
    case STATUS_FAIL:     return '✗ ';
    case STATUS_SKIPED:   return '- ';
  }
  return '';
};

function _extend(parent) {
  var klass = function() {};
  klass.prototype = parent.prototype;
  return new klass();
};

var TestPage  = require('./test_page'),
    TestGroup = require('./test_group'),
    TestTask  = require('./test_task'),
    TaskQuery = require('./task_query');


${CODE}


setInterval(function() {
  if (_waiting <= 0) {
    console.log(_ansi.style('bold') + _ansi.style('underline') + (_title || ${FILE:encode}) + _ansi.style('reset'));
    _pages.forEach(function(page) {
      page._print();
    });
    phantom.exit(_failed ? 1 : 0);
  }
}, 125);

window.onerror = function() {
  console.error(_ansi.style('red') + "Uncaught exception in '" + '${FILE}' + "':\n" + _ansi.style('reset') + Array.prototype.slice.call(arguments).join('; ').trim());
  phantom.exit(2);
};
