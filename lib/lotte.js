var childProcess = require('child_process'),
    fs           = require('fs'),
    path         = require('path'),
    console      = require('./console');

function exec(command, resume) {
  childProcess.exec(command, function(e, stdout, stderr) {
    if (e) {
      return resume(e);
    }
    if (stderr) {
      return resume(new Error("Command '" + command + "' failed: " + stderr.trim()));
    }
    resume(null, stdout);
  });
};

function mktemp(options, resume) {
  options.garbage || (options.garbage = []);
  exec(options.mktemp || 'mktemp', function(e, stdout) {
    if (e) {
      return resume(e);
    }
    var temporary = stdout.trim();
    options.garbage.push(temporary);
    resume(null, temporary);
  });
};

function cache(options, resume) {
  options.cache || (options.cache = {});
  options.cache.templates = {};
  var remaining = 0,
      success   = true,
      pattern   = /\brequire\s*\(\s*['"]([^"']+).\s*\)/g,
      main      = path.resolve(__dirname, './inject/main.js');
  function completed(e) {
    if (e) {
      if (success) {
        success = false;
        return resume(e);
      }
    }
    remaining = remaining - 1;
    if (remaining === 0 && success) {
      var result = options.cache.templates[main];
          dirty  = true,
          depth  = 0;
      while (dirty && depth < 9) {
        dirty = false;
        depth = depth + 1;
        result = result.replace(pattern, function(groups, required) {
          if (required.indexOf('/') < 0) {
            return groups;
          }
          dirty = true;
          return '(function(exports) {\n\n' + options.cache.templates[required].trim() + '\n\nreturn exports;\n}).call(this, {})';
        });
      }
      resume(null, result);
    }
  };
  function include(file) {
    remaining = remaining + 1;
    fs.readFile(file, 'utf8', function(e, template) {
      if (template) {
        template = template.replace(pattern, function(groups, required) {
          if (required.indexOf('/') < 0) {
            return groups;
          }
          var absolute = path.resolve(path.dirname(file), required);
          if (path.extname(absolute).length < 1) {
            absolute = absolute + '.js';
          }
          include(absolute);
          return "require('" + absolute + "')";
        });
      }
      options.cache.templates[file] = template;
      completed(e);
    });
  };
  include(main);
  remaining = remaining + 1;
  mktemp(options, function(e, temporary) {
    options.cache.cookieFile = temporary;
    completed(e);
  });
};

function process_(options, resume) {
  cache(options, function(e, template) {
    if (e) {
      console.error.exception(e);
      return resume(e);
    }
    queue(parseInt(options.concurrent, 10) || 4, template, options, resume);
  });
};

function queue(take, template, options, resume) {
  var files       = options.files,
      remaining   = files.length,
      highestCode = 0;
  function tick() {
    if (files.length && take > 0) {
      take = take - 1;
      (function(top) {
        processOne(top, template, options, function(e, code, buffers) {
          if (buffers) {
            process.stdout.write(buffers.stdout);
            process.stderr.write(buffers.stderr);
          }
          highestCode = Math.max(code || 0, highestCode);
          if (e) {
            console.warn.exception(e);
          } else {
            options.processed.push(top);
          }
          take      = take + 1;
          remaining = remaining - 1;
        });
      })(files.shift());
    }
    if (remaining > 0) {
      process.nextTick(tick);
    } else {
      cleanup(options, function() {
        resume(null, highestCode);
      });
    }
  };
  process.nextTick(tick);
  options.processed = [];
};

function substitute(template, file, code/*, options */) {
  var variables = {
    'file': file,
    'code': code
  };
  var transforms = {
    'none':   null,
    'encode': JSON.stringify
  };
  var result = template,
      dirty  = true,
      depth  = 0;
  function replace(result, key, value) {
    var block, slug;
    key = key.toUpperCase();
    for (var modifier in transforms) {
      if (Object.prototype.hasOwnProperty.call(transforms, modifier)) {
        block = transforms[modifier];
        slug  = '${' + key + (block ? ':' + modifier : '') + '}';
        if (result.indexOf(slug) >= 0) {
          result = result.replace(slug, (block ? block(value) : value), 'g');
          dirty = true;
        }
      }
    }
    return result;
  }
  while (dirty && depth < 9) {
    dirty = false;
    depth = depth + 1;
    for (var key in variables) {
      if (Object.prototype.hasOwnProperty.call(variables, key)) {
        result = replace(result, key, variables[key]);
      }
    }
  }
  return result;
};

function processOne(file, template, options, resume) {
  mktemp(options, function(e, temporary) {
    if (e) {
      return resume(e);
    }
    toJavaScript(options, file, function(e, code) {
      if (e) {
        return resume(e);
      }
      var compiled = substitute(template, file, code, options);
      try {
        require('vm').createScript(compiled, file);
      } catch (e) {
        return resume(new Error("Could not process '" + file + "', " + e));
      }
      fs.writeFile(temporary, compiled, 'utf8', function(e) {
        if (e) {
          return resume(e);
        }
        launch(temporary, options, resume);
      });
    });
  });
};

function launch(file, options, resume) {
  var phantom = childProcess.spawn(options.phantom || 'phantom', [
    "--cookies-file=" + options.cache.cookieFile,
    file
  ]);
  var pid     = phantom.pid,
      status  = 'running',
      buffers = {
        stdout: '',
        stderr: ''
      };
  phantom.stdout.on('data', function(string) {
    buffers.stdout = buffers.stdout + string;
  });
  phantom.stderr.on('data', function(string) {
    buffers.stderr = buffers.stderr + string;
  });
  phantom.on('exit', function(code) {
    if (status === 'running') {
      status = 'exited';
      interval && clearTimeout(interval);
      resume(null, code, buffers);
    }
  });
  var interval = setTimeout(function() {
    var signal = 'SIGTERM';
    if (status === 'running') {
      status = 'killed';
      phantom.kill(signal);
      resume(new Error("Process '" + pid + "' terminated with '" + signal + "', timed out"), null, buffers);
    }
  }, parseInt(options.timeout, 10) || 30000);
};

function cleanup(options, resume) {
  if ( ! options.garbage) {
    return resume();
  }
  var remaining = options.garbage.length - 1;
  options.garbage.forEach(function(temporary) {
    fs.unlink(temporary, function() {
      remaining = remaining - 1;
      if (remaining === 0) {
        resume();
      }
    });
  });
};

function toJavaScript(options, file, resume) {
  if (/\.coffee$/i.exec(file)) {
    exec((options.coffee || 'coffee') + " -p '" + file + "'", function(e, stdout) {
      if (e) {
        return resume(e);
      }
      resume(null, stdout.trim());
    });
  } else {
    fs.readFile(file, 'utf8', resume);
  }
};

exports.process = process_;
