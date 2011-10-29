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

TestTask.prototype._print = function TestTask_print() {
  console.log(this._indent(_style(this._status) + _symbol(this._status) + this._name + _ansi.style('reset')));
  if (this._status === STATUS_FAIL) {
    console.log(_indent(this._level() + 1, _style(this._status) + this._message + _ansi.style('reset')));
  }
};

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
            self._complete(STATUS_FAIL, e.toString());
          }
        };
      })(key);
    }
  }
};

TestTask.prototype._bindUtils = function TestTask_bindUtils() {
  this.$ = function(query, message) {
    return (function(klass, args) {
      var child = function() { };
      child.prototype = klass.prototype;
      return klass.apply(new child(), args);
    })(TaskQuery, [this].concat(Array.prototype.slice.call(arguments)));
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

TestTask.prototype._complete = function TestTask_complete(status, message) {
  this._parent._complete(this, status, message);
};

TestTask.prototype.success = function TestTask_success() {
  this._complete(STATUS_SUCCESS);
};

exports = TestTask;
