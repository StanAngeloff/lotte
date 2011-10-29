function TestGroup(name, parent) {
  TestPage.call(this);
  this._name   = name;
  this._parent = parent;
  return this;
};

TestGroup.prototype = _extend(TestPage);

TestGroup.prototype._print = function TestGroup_print() {
  console.log(this._indent(_style('group') + _symbol('group') + _ansi.style('bold') + this._name + _ansi.style('reset')));
  this._children.forEach(function(child) {
    child._print();
  });
};

exports = TestGroup;
