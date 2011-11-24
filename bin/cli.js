#!/usr/bin/env node

const PHANTOMJS_VERSION = '~1.3.0';

var path     = require('path'),
    optimist = require('optimist'),
    console  = require('../lib/console');

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
        default:     '**/lotte_*.js',
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
      option('mktemp', {
        type:        'string',
        default:     'mktemp',
        description: 'executable to create unique temporary files'
      }).
      argv;

if (defaults.help) {
  console.log(optimist.help());
  process.exit(0);
}
if (defaults.version) {
  console.log('%s %s', defaults.$0, '0.1.2');
  process.exit(0);
}

if (process.argv.indexOf('--') < 0 && defaults._.length) {
  defaults.path = defaults._.shift();
}
defaults.path = path.resolve(defaults.path || process.env['LOTTE_PATH'] || process.cwd());

var lotteFile = path.join(defaults.path, defaults.lottefile);
path.exists(lotteFile, function(exists) {
  if (exists) {
    var fs = require('fs');
    fs.readFile(lotteFile, 'utf8', function(e, code) {
      if (e) {
        console.error.exception(e);
        process.exit(1 << 1);
      }
      var vm       = require('vm'),
          previous = defaults.path;
      try {
        vm.runInNewContext(code, defaults, lotteFile);
        if (defaults.path !== previous) {
          defaults.path = path.resolve(previous, defaults.path);
        }
      } catch (e) {
        console.error.exception(e);
        process.exit(1 << 2);
      }
      main(defaults);
    });
  } else {
    main(defaults);
  }
});

function main(options) {
  options || (options = {});
  verifyPhantomBinary(options, function() {
    collect(options, function(files) {
      glob(files,   { mode: 'include', pattern: options.include }, function(files) {
        glob(files, { mode: 'exclude', pattern: options.exclude }, function(files) {
          files.sort(require('naturalsort').compare);
          options.files = files;
          require('../lib/lotte.js').process(options, function(e, code) {
            process.exit(e ? 1 << 8 : code);
          });
        });
      });
    });
  });
};

function verifyPhantomBinary(options, resume) {
  if ( ! options['verify']) {
    options.phantom_version = false;
    return resume();
  }
  var childProcess = require('child_process'),
      command      = options.phantom + ' --version';
  childProcess.exec(command, function(e, stdout, stderr) {
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
    options.phantom_version = groups[0];
    var semver = require('semver');
    if ( ! semver.satisfies(options.phantom_version, PHANTOMJS_VERSION)) {
      console.error("PhantomJS version '%s' does not meet requirements '%s'.", options.phantom_version, PHANTOMJS_VERSION);
      process.exit(1 << 6);
    }
    resume();
  });
};

function collect(options, resume) {
  var absolute = path.resolve(options.path);
  path.exists(absolute, function(exists) {
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
      return (minimatch(file, path.normalize(pattern || '')) ^ exclude);
    });
  });
  resume(result);
};
