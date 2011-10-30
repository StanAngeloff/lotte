function unpack(args, options) {
  var value = args[options.take];
  if (options.ifAtLeast && args.length < options.ifAtLeast) {
    value = (typeof (options.otherwise) === 'undefined' ? void 0 : args[options.otherwise]);
  }
  return value;
};

function DocumentQuery(case_, message, query) {
  this._case    = case_;
  this._query   = unpack(arguments, { take: 2, ifAtLeast: 3, otherwise: 1 });
  this._message = unpack(arguments, { take: 1, ifAtLeast: 3 });
  this._defineGetters();
  return this;
};

DocumentQuery.prototype._evaluate = function DocumentQuery_evaluate(message, operator, code) {
  var result = this._case.page.evaluate(new Function(code));
  if (result !== true) {
    this._case.assert.fail(result, true, message || this._message, 'Document_Query.' + operator);
  }
  return this;
};

DocumentQuery.prototype._defineGetters = function DocumentQuery_defineGetters() {
  this.__defineGetter__('length', function() {
    return this._case.page.evaluate(new Function('return document.querySelectorAll(' + JSON.stringify(this._query) + ').length;'));
  });
};

DocumentQuery.prototype.first = function DocumentQuery_first(message, block) {
  return this._evaluate(unpack(arguments, { take: 0, ifAtLeast: 2 }), 'first', '\n\
    var _query    = ' + JSON.stringify(this._query) + ',\n\
        _elements = document.querySelectorAll(_query);\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    if ((' + unpack(arguments, { take: 1, ifAtLeast: 2, otherwise: 0 }).toString() + ')(_elements[0])) {\n\
      return true;\n\
    }\n\
    return "expression failed on first element: " + _query;\n\
  ');
};

DocumentQuery.prototype.every = function DocumentQuery_first(message, block) {
  return this._evaluate(unpack(arguments, { take: 0, ifAtLeast: 2 }), 'every', '\n\
    var _query    = ' + JSON.stringify(this._query) + ',\n\
        _elements = document.querySelectorAll(_query);\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    var _result = true,\n\
        _index  = 0;\n\
    Array.prototype.slice.call(_elements).forEach(function(_element) {\n\
      _index = _index + 1;\n\
      if (_result === true) {\n\
        if ((' + unpack(arguments, { take: 1, ifAtLeast: 2, otherwise: 0 }).toString() + ')(_element)) {\n\
          return true;\n\
        }\n\
        _result = "expression failed on element " + _index + ": " + _query;\n\
      }\n\
    });\n\
    return _result;\n\
  ');
};

DocumentQuery.prototype.click = function DocumentQuery_click(message, index) {
  return this._evaluate(unpack(arguments, { take: 0, ifAtLeast: 2 }), 'click', '\n\
    var _query    = ' + JSON.stringify(this._query) + ',\n\
        _index    = ' + JSON.stringify(unpack(arguments, { take: 1, ifAtLeast: 2, otherwise: 0 }) || 0) + ',\n\
        _elements = document.querySelectorAll(_query);\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    if ( ! _elements[_index]) {\n\
      return "no element at index " + _index + ": " + _query;\n\
    }\n\
    var _event = document.createEvent("MouseEvents");\n\
    _event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);\n\
    _elements[_index].dispatchEvent(_event);\n\
    return true;\n\
  ');
};

exports = DocumentQuery;
