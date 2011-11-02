function unpack(args, options) {
  var value = args[options.index];
  if (options.ifAtLeast && args.length < options.ifAtLeast) {
    value = (typeof (options.otherwise) === 'undefined' ? void 0 : args[options.otherwise]);
  }
  return value;
};

function DocumentQuery(case_, message, query) {
  this._case    = case_;
  this._query   = unpack(arguments, { index: 2, ifAtLeast: 3, otherwise: 1 });
  this._message = unpack(arguments, { index: 1, ifAtLeast: 3 });
  this.passthru(defaultProperties);
  return this;
};

DocumentQuery.prototype._evaluate = function DocumentQuery_evaluate(message, operator, code) {
  var result = this._case.page.evaluate(new Function(code));
  if (result !== true) {
    this._case.assert.fail(result, true, message || this._message, 'Document_Query.' + operator);
  }
  return this;
};

DocumentQuery.prototype._wrap = function DocumentQuery_wrap(index, variable) {
  index = JSON.stringify(index);
  variable || (variable = '_elements');
  return 'Math.max(0, Math.min((' + index + ' < 0 ? ' + variable + '.length + ' + index + ' : ' + index + '), ' + variable + '.length - 1))';
};

DocumentQuery.prototype.passthru = function DocumentQuery_passthru(properties) {
  var self = this;
  Array.isArray(properties) || (properties = [properties]);
  for (var i = 0; i < properties.length; i ++) {
    (function(property) {
      self.__defineGetter__(property, function() {
        return self.attr(property);
      });
    })(properties[i]);
  }
  return this;
};

DocumentQuery.prototype.attr = function DocumentQuery_attr(index, property) {
  return this._case.page.evaluate(new Function('\n\
    var _property = ' + JSON.stringify(unpack(arguments, { index: 1, ifAtLeast: 2, otherwise: 0 })) + ',\n\
        _elements = document.querySelectorAll(' + JSON.stringify(this._query) + ');\n\
    if (typeof (_elements[_property]) !== "undefined") {\n\
      return _elements[_property];\n\
    }\n\
    if ( ! _elements.length) {\n\
      return void 0;\n\
    }\n\
    var _element = _elements[' + this._wrap(unpack(arguments, { index: 0, ifAtLeast: 2 }) || 0) + '];\n\
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
  return this.mouse.apply(this, [{
    type: 'click'
  }].concat(Array.prototype.slice.call(arguments)));
};

DocumentQuery.prototype.contains = function DocumentQuery_contains(message, pattern) {
  pattern = unpack(arguments, { index: 1, ifAtLeast: 2, otherwise: 0 });
  return this._evaluate(unpack(arguments, { index: 0, ifAtLeast: 2 }), 'contains', '\n\
    var _query    = ' + JSON.stringify(this._query) + ',\n\
        _elements = document.querySelectorAll(_query),\n\
        _pattern  = ' + (pattern instanceof RegExp ? pattern.toString() : JSON.stringify('' + pattern)) + ';\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    var _result = "no element contains requested pattern: " + _pattern + ", " + _query;\n\
    Array.prototype.slice.call(_elements).forEach(function(_element) {\n\
      var _value = "" + (_element.value || _element.innerHTML);\n\
      if (' + (pattern instanceof RegExp ? '_pattern.exec(_value)' : '~(_value).indexOf(_pattern)') + ') {\n\
        _result = true;\n\
      }\n\
    });\n\
    return _result;\n\
  ');
};

DocumentQuery.prototype.each = function DocumentQuery_each(message, block) {
  return this._evaluate(unpack(arguments, { index: 0, ifAtLeast: 2 }), 'each', '\n\
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
        if ((' + unpack(arguments, { index: 1, ifAtLeast: 2, otherwise: 0 }).toString() + ')(_element)) {\n\
          return true;\n\
        }\n\
        _result = "expression failed on element " + _index + ": " + _query;\n\
      }\n\
    });\n\
    return _result;\n\
  ');
};

DocumentQuery.prototype.event = function DocumentQuery_event(options, index, message, block) {
  var args = Array.prototype.slice.call(arguments),
      i, key, object;
  index   = message = block = void 0;
  options = {};
  for (i = args.length; -- i >= 0;) {
    if (typeof (args[i]) === 'function') {
      block = args.splice(i, 1)[0];
    } else if (typeof (args[i]) === 'object') {
      object = args.splice(i, 1)[0];
      for (key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          options[key] = object[key];
        }
      }
    }
  }
  if (block) {
    this._case.top._onLoad(this._case.bind(block));
  }
  args.length && (index   = args.shift());
  args.length && (message = args.pop());
  options.event || (options.event = {});
  var eventOptions = (options.event.options || []),
      values       = [],
      override;
  for (i = 0; i < eventOptions.length; i ++) {
    if (typeof (eventOptions[i]) === 'object') {
      override = options[eventOptions[i].key];
      values.push(JSON.stringify(typeof (override) === 'undefined' ? eventOptions[i].default : override));
    } else {
      values.push(eventOptions[i]);
    }
  }
  index || (index = 0);
  return this._evaluate(message, 'event(' + options.event.type + ')', '\n\
    var _query    = ' + JSON.stringify(this._query) + ',\n\
        _elements = document.querySelectorAll(_query);\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    var _index = ' + this._wrap(index) + ';\n\
    if ( ! _elements[_index]) {\n\
      return "no element at index ' + JSON.stringify(index) + ': " + _query;\n\
    }\n\
    ' + (options.event.setUp || '') + '\n\
    var _event = document.createEvent(' + JSON.stringify(options.event.type) + ');\n\
    _event.' + options.event.initialize + '(' + values.join(', ') + ');\n\
    _elements[_index].dispatchEvent(_event);\n\
    ' + (options.event.tearDown || '') + '\n\
    return true;\n\
  ');
};

DocumentQuery.prototype.first = function DocumentQuery_first(message, block) {
  return this.nth.apply(this, [0].concat(Array.prototype.slice.call(arguments)));
};

DocumentQuery.prototype.last = function DocumentQuery_last(message, block) {
  return this.nth.apply(this, [-1].concat(Array.prototype.slice.call(arguments)));
};

DocumentQuery.prototype.mouse = function DocumentQuery_event(options, index, message, block) {
  return this.event.apply(this, Array.prototype.slice.call(arguments).concat([{
    event: {
      type:       'MouseEvents',
      initialize: 'initMouseEvent',
      options:    [
        { key: 'type',       default: 'click' },
        { key: 'canBubble',  default: true },
        { key: 'cancelable', default: true },
        'window',
        { key: 'detail',     default: 0 },
        { key: 'screenX',    default: 0 },
        { key: 'screenY',    default: 0 },
        { key: 'clientX',    default: 0 },
        { key: 'clientY',    default: 0 },
        { key: 'ctrlKey',    default: false },
        { key: 'altKey',     default: false },
        { key: 'shiftKey',   default: false },
        { key: 'metaKey',    default: false },
        { key: 'button',     default: 0 },
        'null'
      ]
    }
  }]));
};

DocumentQuery.prototype.nth = function DocumentQuery_nth(index, message, block) {
  index || (index = 0);
  return this._evaluate(unpack(arguments, { index: 1, ifAtLeast: 3 }), 'nth', '\n\
    var _query    = ' + JSON.stringify(this._query) + ',\n\
        _elements = document.querySelectorAll(_query);\n\
    if ( ! _elements.length) {\n\
      return "expected at least one element: " + _query;\n\
    }\n\
    var _index = ' + this._wrap(index) + ';\n\
    if ( ! _elements[_index]) {\n\
      return "no element at index ' + JSON.stringify(index) + ': " + _query;\n\
    }\n\
    if ((' + unpack(arguments, { index: 2, ifAtLeast: 3, otherwise: 1 }).toString() + ')(_elements[_index])) {\n\
      return true;\n\
    }\n\
    return "expression failed on element ' + JSON.stringify(index) + ': " + _query;\n\
  ');
};

exports = DocumentQuery;

var defaultProperties = [
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
