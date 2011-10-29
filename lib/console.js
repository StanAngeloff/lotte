const COLUMN_WIDTH = 8;

var ANSI_STYLES = {
  'reset':  0,
  'bold':   1,
  'red':    31,
  'yellow': 33,
};

exports.log   = console.log;
exports.warn  = function() { forward('warn',  'yellow', 'WARNING', arguments); };
exports.error = function() { forward('error', 'red',    'ERROR',   arguments); };

function ansiStyle(key) {
  return '\033[' + ANSI_STYLES[key] + 'm';
};

function forward(method, style, type, args) {
  args = Array.prototype.slice.call(args);
  type = type + ':';
  var lines = args[0].split('\n');
  for (var i = type.length; i < COLUMN_WIDTH; i ++) {
    type = type + ' ';
  }
  lines[0] = 'Lotte | ' +
    ansiStyle(style) + ansiStyle('bold') + type + ansiStyle('reset') + ' ' +
    ansiStyle(style) + lines[0] + ansiStyle('reset');
  args[0]  = lines.join('\n');
  console[method].apply(console, args);
};

for (var key in exports) {
  if (Object.prototype.hasOwnProperty.call(exports, key)) {
    exports[key].exception = (function(key) {
      return function(e) {
        exports[key]('%s:\n\n\t%s', e.toString().trim(), ('' + e.stack).replace('\n', '\n\t', 'g'));
      };
    })(key);
  }
}
