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
//
// https://github.com/joyent/node/blob/master/lib/assert.js
//   at 6d7aa65399ea302adb3965c57938ae8393f8dbb3

var util = require('./util');

exports.AssertionError = function AssertionError(options) {
  this.name     = 'AssertionError';
  this.message  = options.message;
  this.actual   = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
};

util.inherits(exports.AssertionError, Error);

function replace(key, value) {
  if (value === undefined) {
    return ('' + value);
  }
  if (typeof (value) === 'number' && (isNaN(value) || ! isFinite(value))) {
    return value.toString();
  }
  if (typeof (value) === 'function' || value instanceof RegExp) {
    return value.toString();
  }
  return value;
};

function truncate(string, length) {
  if (typeof (string) === 'string') {
    return (string.length < length ? string : string.slice(0, length));
  } else {
    return string;
  }
};

exports.AssertionError.prototype.toString = function() {
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

var fail = exports.fail = function fail(actual, expected, message, operator) {
  throw new exports.AssertionError({
    actual:   actual,
    expected: expected,
    message:  message,
    operator: operator
  });
};

exports.ok = function ok(value, message) {
  if ( !!! value) {
    fail(value, true, message, '==');
  }
};

exports.equal = function equal(actual, expected, message) {
  if (actual != expected) {
    fail(actual, expected, message, '==');
  }
};

exports.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=');
  }
};

exports.deepEqual = function deepEqual(actual, expected, message) {
  if ( ! _deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual');
  }
};

function _deepEqual(actual, expected) {
  if (actual === expected) {
    return true;
  } else if (actual instanceof Date && expected instanceof Date) {
    return (actual.getTime() === expected.getTime());
  } else if (typeof (actual) !== 'object' && typeof (expected) !== 'object') {
    return (actual == expected);
  } else {
    return objectEqual(actual, expected);
  }
};

function isUndefinedOrNull(value) {
  return (value === null || value === undefined);
};

function isArguments(object) {
  return (Object.prototype.toString.call(object) === '[object Arguments]');
};

function objectEqual(left, right) {
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

exports.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual');
  }
};

exports.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===');
  }
};

exports.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==');
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
  if (typeof (expected) === 'string') {
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
    fail(actual, expected, 'Missing expected exception: ' + message, 'throws');
  }
  if ( ! shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception: ' + message, 'throws');
  }
  if ((shouldThrow && actual && expected &&
      ! expectedException(actual, expected)) || ( ! shouldThrow && actual)) {
    fail(actual, expected, 'Uncaught exception: ' + actual, 'throws');
  }
}

exports.throws = function(block, error, message) {
  _throws.apply(exports, [true].concat(Array.prototype.slice.call(arguments)));
};

exports.doesNotThrow = function(block, error, message) {
  _throws.apply(exports, [false].concat(Array.prototype.slice.call(arguments)));
};
