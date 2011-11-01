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
  this._bindProxyProperties();
  return this;
};

DocumentQuery.prototype._evaluate = function DocumentQuery_evaluate(message, operator, code) {
  var result = this._case.page.evaluate(new Function(code));
  if (result !== true) {
    this._case.assert.fail(result, true, message || this._message, 'Document_Query.' + operator);
  }
  return this;
};

DocumentQuery.prototype._bindProxyProperties = function DocumentQuery_bindProxyProperties() {
  var self = this;
  defaultProxyProperties.forEach(function(property) {
    self.proxy(property);
  });
};

DocumentQuery.prototype.proxy = function DocumentQuery_proxy(property) {
  var self = this;
  this.__defineGetter__(property, function() {
    return self.attr(property);
  });
  return this;
};

DocumentQuery.prototype.attr = function DocumentQuery_attr(index, property) {
  return this._case.page.evaluate(new Function('\n\
    var _property = ' + JSON.stringify(unpack(arguments, { take: 1, ifAtLeast: 2, otherwise: 0 })) + ',\n\
        _index    = ' + JSON.stringify(unpack(arguments, { take: 0, ifAtLeast: 2 }) || 0) + ',\n\
        _elements = document.querySelectorAll(' + JSON.stringify(this._query) + ');\n\
    if (typeof (_elements[_property]) !== "undefined") {\n\
      return _elements[_property];\n\
    }\n\
    if ( ! _elements.length) {\n\
      return void 0;\n\
    }\n\
    var _element = _elements[Math.max(0, Math.min((_index < 0 ? _elements.length + _index : _index), _elements.length - 1))];\n\
    if ( ! _element) {\n\
      return void 0;\n\
    }\n\
    if (typeof (_element[_property]) !== "undefined") {\n\
      return _element[_property];\n\
    }\n\
    var _attribute = (_element.attributes && _element.attributes[_property]);\n\
    return (_attribute && _attribute.value);\n\
  '));
};

DocumentQuery.prototype.click = function DocumentQuery_click(index, message, block) {
  var args = Array.prototype.slice.call(arguments);
  message = index = block = void 0;
  if (args.length && typeof (args[args.length - 1]) === 'function') {
    block = args.pop();
    this._case.top._onLoad(this._case.bind(block));
  }
  index = args.shift();
  if (args.length) {
    message = args.pop();
  }
  index || (index = 0);
  return this._evaluate(message, 'click', '\n\
    var _query    = ' + JSON.stringify(this._query) + ',\n\
        _index    = ' + index + ',\n\
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

DocumentQuery.prototype.each = function DocumentQuery_each(message, block) {
  return this._evaluate(unpack(arguments, { take: 0, ifAtLeast: 2 }), 'each', '\n\
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

DocumentQuery.prototype.first = function DocumentQuery_first(message, block) {
  return this.nth.apply(this, [0].concat(Array.prototype.slice.call(arguments)));
}

DocumentQuery.prototype.html = function DocumentQuery_each(message, pattern) {
  pattern = unpack(arguments, { take: 1, ifAtLeast: 2, otherwise: 0 });
  return this._evaluate(unpack(arguments, { take: 0, ifAtLeast: 2 }), 'html', '\n\
    var _query    = ' + JSON.stringify(this._query) + ',\n\
        _elements = document.querySelectorAll(_query),\n\
        _pattern  = ' + (pattern instanceof RegExp ? pattern.toString() : JSON.stringify('' + pattern)) + ';\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    var _result = "no element contains requested pattern: " + _pattern + ", " + _query;\n\
    Array.prototype.slice.call(_elements).forEach(function(_element) {\n\
      if (' + (pattern instanceof RegExp ? '_pattern.exec("" + _element.innerHTML)' : '~("" + _element.innerHTML).indexOf(_pattern)') + ') {\n\
        _result = true;\n\
      }\n\
    });\n\
    return _result;\n\
  ');
};

DocumentQuery.prototype.last = function DocumentQuery_first(message, block) {
  return this.nth.apply(this, [-1].concat(Array.prototype.slice.call(arguments)));
}

DocumentQuery.prototype.nth = function DocumentQuery_first(index, message, block) {
  index || (index = 0);
  return this._evaluate(unpack(arguments, { take: 1, ifAtLeast: 3 }), 'nth', '\n\
    var _query    = ' + JSON.stringify(this._query) + ',\n\
        _elements = document.querySelectorAll(_query),\n\
        _index    = ' + index + ';\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    _index = (_index < 0 ? _elements.length + _index : _index);\n\
    if ( ! _elements[_index]) {\n\
      return "no element at index ' + index + ': " + _query;\n\
    }\n\
    if ((' + unpack(arguments, { take: 2, ifAtLeast: 3, otherwise: 1 }).toString() + ')(_elements[_index])) {\n\
      return true;\n\
    }\n\
    return "expression failed on element ' + index + ': " + _query;\n\
  ');
};

exports = DocumentQuery;

var defaultProxyProperties = [
  'action',
  'alt',
  'checked',
  'className',
  'clientHeight',
  'clientLeft',
  'clientTop',
  'clientWidth',
  'disabled',
  'enctype',
  'height',
  'href',
  'id',
  'innerHTML',
  'length',
  'maxLength',
  'media',
  'method',
  'name',
  'nodeName',
  'nodeValue',
  'offsetHeight',
  'offsetLeft',
  'offsetTop',
  'offsetWidth',
  'outerHTML',
  'outerText',
  'readOnly',
  'rel',
  'scrollHeight',
  'scrollLeft',
  'scrollTop',
  'scrollWidth',
  'selectedIndex',
  'size',
  'src',
  'tagName',
  'target',
  'textContent',
  'title',
  'type',
  'value',
  'width'
];
