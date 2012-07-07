#!/usr/bin/env node

const PHANTOMJS_VERSION = '~1.3.0 || ~1.4.0 || ~1.5.0';

var path     = require('path'),
    optimist = require('optimist'),
    console  = require('../lib/console'),
    events   = require('../lib/events');

var defaults = optimist.
      usage('Usage: $0 [OPTION...] PATH\n\nCommand-line arguments are evaluated before any included files.\n\nReport issues at https://github.com/StanAngeloff/lotte/issues.').
      option('help', {
        alias:       'h',
        default:      false,
        description: 'give this help page'
      }).
      option('version', {
        alias:       'v',
        default:      false,
        description: 'print program version'
      }).
      option('concurrent', {
        alias:       'c',
        default:     4,
        type:        'number',
        description: 'limit of files to run in parallel'
      }).
      option('timeout', {
        alias:       't',
        default:     30 * 1000,
        type:        'number',
        description: 'timeout for individual files (in milliseconds)'
      }).
      option('include', {
        alias:       'I',
        type:        'string',
        default:     '**/lotte_*.{coffee,js}',
        description: 'glob pattern to match files in PATH'
      }).
      option('exclude', {
        alias:       'E',
        type:        'string',
        description: 'glob pattern to remove included files'
      }).
      option('lottefile', {
        alias:       'f',
        type:        'string',
        default:     'Lottefile',
        description: "look for 'lottefile' in PATH"
      }).
      option('verify', {
        type:        'boolean',
        default:     ( ! process.env['LOTTE_NO_VERIFY']),
        description: "verify PhantomJS version (expected " + PHANTOMJS_VERSION + ")"
      }).
      option('server', {
        type:        'boolean',
        default:     ( ! process.env['LOTTE_NO_SERVER']),
        description: 'start a HTTP server for IPC'
      }).
      option('address', {
        alias:       'a',
        default:     '127.0.0.1',
        type:        'string',
        description: 'IP address for the HTTP server to bind to'
      }).
      option('port', {
        alias:       'p',
        default:     3838,
        type:        'number',
        description: 'port for HTTP server to listen on'
      }).
      option('phantom', {
        type:        'string',
        default:     'phantomjs',
        description: 'executable for PhantomJS'
      }).
      option('coffee', {
        type:        'string',
        default:     'coffee',
        description: 'executable for CofeeScript'
      }).
      argv;

if (defaults.help) {
  console.log(optimist.help());
  process.exit(0);
}
if (defaults.version) {
  console.log('%s %s', defaults.$0, '0.1.2-2');
  process.exit(0);
}

if (process.argv.indexOf('--') < 0 && defaults._.length) {
  defaults.path = defaults._.shift();
}
defaults.path = path.resolve(defaults.path || process.env['LOTTE_PATH'] || process.cwd());

var lotteFile = path.join(defaults.path, defaults.lottefile);
fs.exists(lotteFile, function(exists) {
  if (exists) {
    load(defaults, lotteFile, function(e, options) {
      if (e) {
        console.error.exception(e);
        process.exit(1 << 1);
      }
      main(options);
    });
  } else {
    main(defaults);
  }
});

function load(options, file, block) {
  require('../lib/utils').toJavaScript(options, file, function(e, code) {
    if (e) {
      return block(e);
    }
    var context = {}, i,
        symbols = ['Buffer', 'console', 'process', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'];
    context['require'] = require;
    for (i = 0; i < symbols.length; i ++) {
      context[symbols[i]] = global[symbols[i]];
    }
    symbols = ['on', 'once', 'off', 'message'];
    for (i = 0; i < symbols.length; i ++) {
      context[symbols[i]] = events[symbols[i]];
    }
    for (var key in options) {
      if (Object.prototype.hasOwnProperty.call(options, key)) {
        context[key] = options[key];
      }
    }
    try {
      require('vm').runInNewContext(code, context, file);
      if (context.path !== options.path) {
        context.path = path.resolve(options.path, context.path);
      }
    } catch (e) {
      console.error.exception(e);
      process.exit(1 << 2);
    }
    for (var key in options) {
      if (Object.prototype.hasOwnProperty.call(options, key)) {
        options[key] = context[key];
      }
    }
    block(null, options);
  });
};

function main(options) {
  options || (options = {});
  verifyPhantomBinary(options, function() {
    collect(options, function(files) {
      glob(files,   { mode: 'include', pattern: options.include }, function(files) {
        glob(files, { mode: 'exclude', pattern: options.exclude }, function(files) {
          var server = require('../lib/server');
          files.sort(require('naturalsort').compare);
          options.files = files;
          if (options['server']) {
            server.listen(options.port, options.address);
          }
          events.message('start', [options], function() {
            require('../lib/lotte').process(options, function(e, code) {
              code = (e ? 1 << 8 : code);
              events.message('exit', [code], function() {
                server.close();
                process.exit(code);
              });
            });
          });
        });
      });
    });
  });
};

function verifyPhantomBinary(options, resume) {
  if ( ! options['verify']) {
    options.phantomVersion = false;
    return resume();
  }
  var command = options.phantom + ' --version';
  require('child_process').exec(command, function(e, stdout, stderr) {
    if (e) {
      console.error.exception(e);
      process.exit(1 << 3);
    }
    if (stderr) {
      console.error("Command '%s' failed:\n\n%s", command, stderr);
      process.exit(1 << 4);
    }
    var groups = /^([\d\.\-a-z]+)/.exec(stdout);
    if ( ! groups) {
      console.error("Could not parse version string '%s'", ('' + stdout).trim());
      process.exit(1 << 5);
    }
    options.phantomVersion = groups[0];
    var semver = require('semver');
    if ( ! semver.satisfies(options.phantomVersion, PHANTOMJS_VERSION)) {
      console.error("PhantomJS version '%s' does not meet requirement '%s'.", options.phantomVersion, PHANTOMJS_VERSION);
      process.exit(1 << 6);
    }
    resume();
  });
};

function collect(options, resume) {
  var absolute = path.resolve(options.path);
  fs.exists(absolute, function(exists) {
    if ( ! exists) {
      console.error("Could not resolve '%s'.", absolute);
      process.exit(1 << 7);
    }
    var find   = require('findit').find(options.path),
        result = [];
    find.on('file', function(file) {
      result.push(file);
    });
    find.on('error', function(e) {
      console.warn(e.toString().trim());
    });
    find.on('end', function() {
      resume(result);
    });
  });
};

function glob(files, options, resume) {
  var minimatch = require('minimatch'),
      result    = files,
      exclude   = (options.mode === 'exclude');
  Array.isArray(options.pattern) || (options.pattern = [options.pattern]);
  options.pattern.forEach(function(pattern) {
    result = result.filter(function(file) {
      return (minimatch(file, path.normalize(pattern || '').replace(/\\/g, '/')) ^ exclude);
    });
  });
  resume(result);
};
