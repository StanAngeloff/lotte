function TaskQuery(task, page, query, message) {
  this._task    = task;
  this._page    = page;
  this._query   = query;
  this._message = message;
  return this;
};

TaskQuery.prototype._elements = function TaskQuery_elements(variable) {
  return (variable || '_elements') + ' = document.querySelectorAll(' + JSON.stringify(this._query) + ')';
};

TaskQuery.prototype.first = function TaskQuery_first(block) {
  var hasElements = this._page.evaluate(new Function(' \
    var ' + this._elements() + '; \
    return _elements.length; \
  '));
  if ( ! hasElements) {
    this._task.assert.fail(hasElements, true, this._message || ('expected at least one element: ' + this._query), this.first);
  }
};


${CODE}
