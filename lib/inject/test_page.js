function TestPage(webpage, message) {
  this._webpage   = webpage;
  this._message   = message;
  this._parent    = null;
  this._children  = [];
  this._skip      = false;
  this._cases     = 0;
  this._loadQueue = [];
  this._defineGetters();
  return this;
};

TestPage.prototype.open = this.open;

TestPage.prototype.group = function TestPage_group(name, block) {
  var child = new TestGroup(name, this);
  this._children.push(child);
  block.call(child);
  return child;
};

TestPage.prototype.describe = function TestPage_describe(name, block) {
  var child = new TestCase(name, this, block);
  this._cases = this._cases + 1;
  this._children.push(child);
  return child;
};

TestPage.prototype.bind = function TestPage_bind(block) {
  var self = this;
  return function() {
    try {
      block.apply(self, arguments);
    } catch (e) {
      if (e !== BREAK_CASE) {
        throw e;
      }
    }
  };
};

TestPage.prototype._defineGetters = function TestPage_defineGetters() {
  this.__defineGetter__('top', function() {
    var top = null;
    this._ascend(function() {
      if (this._webpage) {
        top = this;
      }
    });
    return top;
  });
  this.__defineGetter__('page', function() {
    var page = this.top;
    return (page && page._webpage);
  });
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
    child.bind(child._process)();
  });
};

TestPage.prototype._complete = function TestPage_complete(child, status, message) {
  if (child._completed) {
    return child._completed;
  }
  child._completed = true;
  child._status    = status;
  child._message   = message;
  this._cases   = this._cases - 1;
  var remaining = 0;
  this.top._descend(function() {
    remaining = remaining + this._cases;
  });
  if (remaining <= 0) {
    _waiting = _waiting - 1;
  }
  if (child._status === STATUS_FAIL) {
    this._skip = true;
    _failed    = true;
    throw BREAK_CASE;
  }
};

TestPage.prototype._level = function TestPage_level() {
  var level = 0;
  this._ascend(function() {
    level = level + 1;
  });
  return level;
};

TestPage.prototype._indent = function TestPage_indent() {
  return _indent.apply(this, [this._level()].concat(Array.prototype.slice.call(arguments)));
};

TestPage.prototype._print = function TestPage_print() {
  console.log(this._indent(_style('TestPage') + _symbol('TestPage') + _ansi.style('bold') + this._message + _ansi.style('reset')));
  this._children.forEach(function(child) {
    child._print();
  });
};

TestPage.prototype._onLoad = function TestPage_onLoad(block) {
  if (arguments.length) {
    this._loadQueue.push(block);
  } else if (this._loadQueue.length) {
    (this._loadQueue.pop())();
  }
};

exports = TestPage;
