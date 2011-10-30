function TestCase(name, parent, block) {
  TestGroup.apply(this, arguments);
  this._completed = false;
  this._status    = null;
  this._block     = block;
  this._bindAssert();
  this._bindUtils();
  return this;
};

TestCase.prototype = _extend(TestGroup);

TestCase.prototype._bindAssert = function TestCase_bindAssert() {
  var self = this;
  this.assert = {};
  for (var key in _assert) {
    if (Object.prototype.hasOwnProperty.call(_assert, key)) {
      (function(key) {
        self.assert[key] = function() {
          try {
            _assert[key].apply(_assert, arguments);
          } catch (e) {
            if (e instanceof _assert.AssertionError) {
              self._complete(STATUS_FAIL, e.toString());
            }
          }
        };
      })(key);
    }
  }
};

TestCase.prototype._bindUtils = function TestCase_bindUtils() {
  this.$ = function() {
    return (function(klass, args) {
      var child = function() { };
      child.prototype = klass.prototype;
      return klass.apply(new child(), args);
    })(DocumentQuery, [this].concat(Array.prototype.slice.call(arguments)));
  };
};

TestCase.prototype._process = function TestCase_process() {
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

TestCase.prototype._complete = function TestCase_complete(status, message) {
  this._parent._complete(this, status, message);
};

TestCase.prototype._print = function TestCase_print() {
  console.log(this._indent(_style(this._status) + _symbol(this._status) + this._name + _ansi.style('reset')));
  if (this._status === STATUS_FAIL) {
    console.log(_indent(this._level() + 1, _style(this._status) + this._message + _ansi.style('reset')));
  }
};

TestCase.prototype.success = function TestCase_success() {
  this._complete(STATUS_SUCCESS);
};

exports = TestCase;
