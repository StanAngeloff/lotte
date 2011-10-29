const PADDING = '  ';

const STATUS_SUCCESS = 'success';
const STATUS_FAIL    = 'fail';
const STATUS_SKIPED  = 'skipped';

var ANSI_STYLES = {
  'reset':     0,
  'bold':      1,
  'underline': 4,
  'red':       31,
  'yellow':    33,
};

var _webpage = require('webpage'),
    _pages   = [],
    _waiting = 0,
    _assert  = {},
    _failed, _title, _baseUri;

this.ansiStyle = function ansiStyle(key) {
  return '\033[' + ANSI_STYLES[key] + 'm';
};

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

this.open = function open(uri, block) {
  var page = _webpage.create();
  uri = absolute(uri);
  page.open(uri, function(status) {
    if (status === STATUS_SUCCESS) {
      var child = new TestPage(page);
      _pages.push(child);
      block.call(child);
      child._process();
    } else {
      _waiting = _waiting - 1;
      _failed  = true;
      console.warn(ansiStyle('yellow') + "Could not open page at '" + uri + "'." + ansiStyle('reset'));
    }
  });
  _waiting = _waiting + 1;
};

function _indent(level) {
  var args = Array.prototype.slice.call(arguments, 1),
      padd = Array(level + 1).join(PADDING);
  console.log(padd + args.join(' ').replace('\n', '\n' + padd, 'g'));
};

function _extend(parent) {
  var klass = function() {};
  klass.prototype = parent.prototype;
  return new klass();
};


function TestPage(page) {
  this._page      = page;
  this._parent    = null;
  this._children  = [];
  this._skip      = false;
  this._tasks     = 0;
  this.__defineGetter__('top', function() {
    var top = null;
    this._ascend(function() {
      if (this._page) {
        top = this;
      }
    });
    return top;
  });
  this.__defineGetter__('page', function() {
    var page = this.top;
    return (page && page._page);
  });
  return this;
};

TestPage.prototype.group = function TestPage_group(name, block) {
  var child = new TestGroup(name, this);
  this._children.push(child);
  block.call(child);
  return child;
};

TestPage.prototype.describe = function TestPage_describe(name, block) {
  var child = new TestTask(name, this, block);
  this._tasks = this._tasks + 1;
  this._children.push(child);
  return child;
};

TestPage.prototype._ascend = function TestPage_ascend(block) {
  block.call(this);
  if (this._parent) {
    this._parent._ascend(block);
  }
};

TestPage.prototype._descend = function TestPage_descend(block) {
  block.call(this);
  this._children.forEach(function(child) {
    child._descend(block);
  });
};

TestPage.prototype._process = function TestPage_process() {
  this._children.forEach(function(child) {
    child._process();
  });
};

TestPage.prototype._complete = function TestPage_complete(child, status) {
  if (child._completed) {
    return child._completed;
  }
  child._completed = true;
  child._status    = status;
  this._tasks      = this._tasks - 1;
  if (child._status === STATUS_FAIL) {
    this._skip = true;
    _failed    = true;
  }
  var remaining = 0;
  this.top._descend(function() {
    remaining = remaining + this._tasks;
  });
  if (remaining <= 0) {
    // TODO: print tree
    _waiting = _waiting - 1;
  }
};


function TestGroup(name, parent) {
  TestPage.call(this);
  this._name   = name;
  this._parent = parent;
  return this;
};

TestGroup.prototype = _extend(TestPage);


function TestTask(name, parent, block) {
  TestGroup.apply(this, arguments);
  this._completed = false;
  this._status    = null;
  this._block     = block;
  this._bindAssert();
  this._bindUtils();
  return this;
};

TestTask.prototype = _extend(TestGroup);

TestTask.prototype._bindAssert = function TestTask_bindAssert() {
  var self = this;
  this.assert = {};
  for (var key in _assert) {
    if (Object.prototype.hasOwnProperty.call(_assert, key)) {
      (function(key) {
        self.assert[key] = function() {
          try {
            _assert[key].apply(_assert, arguments);
          } catch (e) {
            self._complete(STATUS_FAIL);
          }
        };
      })(key);
    }
  }
};

TestTask.prototype._bindUtils = function TestTask_bindUtils() {
  var page = this.page;
  this.$ = function(query, message) {
    return (function(klass, args) {
      var child = function() { };
      child.prototype = klass.prototype;
      return klass.apply(new child(), args);
    })(TaskQuery, [this, page].concat(Array.prototype.slice.call(arguments)));
  };
};

TestTask.prototype._process = function TestTask_process() {
  var skip = false;
  this._ascend(function() {
    if (this._skip) {
      skip = true;
    }
  });
  if (skip) {
    this._complete(STATUS_SKIPED);
  } else {
    this._block.call(this);
  }
};

TestTask.prototype._complete = function TestTask_complete(status) {
  this._parent._complete(this, status);
};

TestTask.prototype.success = function TestTask_success() {
  this._complete(STATUS_SUCCESS);
};


// {{{ Assertions

// https://github.com/joyent/node/blob/master/lib/util.js
//   at 6d7aa65399ea302adb3965c57938ae8393f8dbb3
//
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
function inherits(child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value:        child,
      enumerable:   false,
      writable:     true,
      configurable: true
    }
  });
  child.__proto__ = parent.prototype;
};

(function() {

// https://github.com/joyent/node/blob/master/lib/assert.js
//   at 6d7aa65399ea302adb3965c57938ae8393f8dbb3
//
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var self = this;

this.AssertionError = function AssertionError(options) {
  this.name     = 'AssertionError';
  this.message  = options.message;
  this.actual   = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
};

inherits(this.AssertionError, Error);

var replace = function replace(key, value) {
  if (value === undefined) {
    return ('' + value);
  }
  if (typeof value === 'number' && (isNaN(value) || ! isFinite(value))) {
    return value.toString();
  }
  if (typeof value === 'function' || value instanceof RegExp) {
    return value.toString();
  }
  return value;
};

var truncate = function truncate(string, length) {
  if (typeof string === 'string') {
    return (string.length < length ? string : string.slice(0, length));
  } else {
    return string;
  }
};

this.AssertionError.prototype.toString = function() {
  if (this.message) {
    return [this.name + ':', this.message].join(' ');
  } else {
    return [
      this.name + ':',
      truncate(JSON.stringify(this.actual, replace), 128),
      this.operator,
      truncate(JSON.stringify(this.expected, replace), 128)
    ].join(' ');
  }
};

var fail = this.fail = function fail(actual, expected, message, operator) {
  throw new self.AssertionError({
    actual:   actual,
    expected: expected,
    message:  message,
    operator: operator
  });
};

var ok = this.ok = function ok(value, message) {
  if ( !!! value) {
    fail(value, true, message, '==', self.ok);
  }
};

var equal = this.equal = function equal(actual, expected, message) {
  if (actual != expected) {
    fail(actual, expected, message, '==', self.equal);
  }
};

var notEqual = this.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', self.notEqual);
  }
};

var deepEqual = this.deepEqual = function deepEqual(actual, expected, message) {
  if ( ! _deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', self.deepEqual);
  }
};

var _deepEqual = function _deepEqual(actual, expected) {
  if (actual === expected) {
    return true;
  } else if (actual instanceof Date && expected instanceof Date) {
    return (actual.getTime() === expected.getTime());
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return (actual == expected);
  } else {
    return objectEqual(actual, expected);
  }
};

var isUndefinedOrNull = function isUndefinedOrNull(value) {
  return (value === null || value === undefined);
};

var isArguments = function isArguments(object) {
  return (Object.prototype.toString.call(object) === '[object Arguments]');
};

var objectEqual = function objectEqual(left, right) {
  if (isUndefinedOrNull(left) || isUndefinedOrNull(right)) {
    return false;
  }
  if (left.prototype !== right.prototype) {
    return false;
  }
  if (isArguments(left)) {
    if ( ! isArguments(right)) {
      return false;
    }
    left  = Array.prototype.slice.call(left);
    right = Array.prototype.slice.call(right);
    return _deepEqual(left, right);
  }
  try {
    var keysLeft  = Object.keys(left),
        keysRight = Object.keys(right),
        key, i;
  } catch (e) {
    return false;
  }
  if (keysLeft.length != keysRight.length) {
    return false;
  }
  keysLeft.sort();
  keysRight.sort();
  for (i = keysLeft.length - 1; i >= 0; i --) {
    if (keysLeft[i] != keysRight[i]) {
      return false;
    }
  }
  for (i = keysLeft.length - 1; i >= 0; i--) {
    key = keysLeft[i];
    if ( ! _deepEqual(left[key], right[key])) {
      return false;
    }
  }
  return true;
};

this.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', self.notDeepEqual);
  }
};

this.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', self.strictEqual);
  }
};

this.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', self.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if ( ! actual || ! expected) {
    return false;
  }
  if (expected instanceof RegExp) {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }
  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;
  if (typeof expected === 'string') {
    message  = expected;
    expected = null;
  }
  try {
    block();
  } catch (e) {
    actual = e;
  }
  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');
  if (shouldThrow && ! actual) {
    fail('Missing expected exception' + message);
  }
  if ( ! shouldThrow && expectedException(actual, expected)) {
    fail('Got unwanted exception' + message);
  }
  if ((shouldThrow && actual && expected &&
      ! expectedException(actual, expected)) || ( ! shouldThrow && actual)) {
    throw actual;
  }
}

this.throws = function(block, error, message) {
  _throws.apply(this, [true].concat(Array.prototype.slice.call(arguments)));
};

this.doesNotThrow = function(block, error, message) {
  _throws.apply(this, [false].concat(Array.prototype.slice.call(arguments)));
};

this.ifError = function(e) {
  if (e) {
    throw e;
  }
};

}).call(_assert);

// }}}
