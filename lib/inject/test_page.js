function TestPage(page, message) {
  this._page      = page;
  this._message   = message;
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

TestPage.prototype._complete = function TestPage_complete(child, status, message) {
  if (child._completed) {
    return child._completed;
  }
  child._completed = true;
  child._status    = status;
  child._message   = message;
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
    _waiting = _waiting - 1;
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
  console.log(this._indent(_style('page') + _symbol('page') + _ansi.style('bold') + this._message + _ansi.style('reset')));
  this._children.forEach(function(child) {
    child._print();
  });
};

exports = TestPage;
