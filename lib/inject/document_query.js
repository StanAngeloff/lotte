function DocumentQuery(case_, query, message) {
  this._case    = case_;
  this._query   = query;
  this._message = message;
  this._page    = this._case.page;
  return this;
};

DocumentQuery.prototype._evaluate = function DocumentQuery_evaluate(name, code) {
  var result = this._page.evaluate(new Function(code));
  if (result !== true) {
    this._case.assert.fail(result, true, this._message, name + '(..)');
  }
  return this;
};

DocumentQuery.prototype.first = function DocumentQuery_first(block) {
  return this._evaluate('first', '\n\
    var _query    = ' + JSON.stringify(this._query) + '\n\
        _elements = document.querySelectorAll(_query);\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    if ((' + block.toString() + ')(_elements[0])) {\n\
      return true;\n\
    }\n\
    return "expression failed on first element: " + _query;\n\
  ');
};

DocumentQuery.prototype.every = function DocumentQuery_first(block) {
  return this._evaluate('every', '\n\
    var _query    = ' + JSON.stringify(this._query) + '\n\
        _elements = document.querySelectorAll(_query);\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    var _result = true,\n\
        _index  = 0;\n\
    Array.prototype.slice.call(_elements).forEach(function(_element) {\n\
      _index = _index + 1;\n\
      if (_result === true) {\n\
        if ((' + block.toString() + ')(_element)) {\n\
          return true;\n\
        }\n\
        _result = "expression failed on element " + _index + ": " + _query;\n\
      }\n\
    });\n\
    return _result;\n\
  ');
};

DocumentQuery.prototype.click = function DocumentQuery_click(index) {
  index || (index = 0);
  return this._evaluate('click', '\n\
    var _query    = ' + JSON.stringify(this._query) + '\n\
        _elements = document.querySelectorAll(_query);\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    if ( ! _elements[' + index + ']) {\n\
      return "no element at index ' + index + ': " + _query;\n\
    }\n\
    var _event = document.createEvent("MouseEvents");\n\
    _event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);\n\
    _elements[' + index + '].dispatchEvent(_event);\n\
    return true;\n\
  ');
};

exports = DocumentQuery;
