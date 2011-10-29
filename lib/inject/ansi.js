var ANSI_STYLES = {
  'reset':     0,
  'bold':      1,
  'underline': 4,
  'red':       31,
  'green':     32,
  'yellow':    33,
  'magenta':   35,
  'white':     37
};

exports.style = function style(key) {
  return '\033[' + ANSI_STYLES[key] + 'm';
};
