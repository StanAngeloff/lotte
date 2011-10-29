var childProcess = require('child_process'),
    fs           = require('fs'),
    path         = require('path'),
    console      = require('./console');

function mktemp(options, resume) {
  options.garbage || (options.garbage = []);
  var command = (options.mktemp || 'mktemp');
  childProcess.exec(command, function(e, stdout, stderr) {
    if (e) {
      return resume(e);
    }
    if (stderr) {
      return resume(new Error("Command '" + command + "' failed: " + stderr.trim()));
    }
    var result = stdout.trim();
    options.garbage.push(result);
    resume(null, result);
  });
};

function cache(options, resume) {
  var templates = ['before', 'main', 'after'],
      remaining = 0;
      success   = true;
  function completed(e) {
    if (e) {
      if (success) {
        success = false;
        return resume(e);
      }
    }
    remaining = remaining - 1;
    if (remaining === 0 && success) {
      var result = '';
      for (var i = 0; i < templates.length; i ++) {
        result = result + options.cache.templates[templates[i]];
      }
      resume(null, result);
    }
  };
  options.cache || (options.cache = {});
  options.cache.templates = {};
  remaining = remaining + templates.length;
  templates.forEach(function(name) {
    fs.readFile(path.resolve(__dirname + '/../template/' + name + '.js'), 'utf8', function(e, template) {
      options.cache.templates[name] = template;
      completed(e);
    });
  });
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
      return (resume && resume(e));
    }
    var remaining = options.files.length;
    queue(parseInt(options.concurrent, 10) || 4, template, options, resume);
  });
};

function queue(take, template, options, resume) {
  var files       = options.files,
      remaining   = files.length,
      highestCode = 0;
  function tick() {
    var top;
    if (files.length && take > 0) {
      take = take - 1;
      (function(top) {
        processOne(top, template, options, function(e, code, buffers) {
          highestCode = Math.max(code || 0, highestCode);
          if (e) {
            console.warn.exception(e);
          } else {
            process.stdout.write(buffers.stdout);
            process.stderr.write(buffers.stderr);
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
    var block, mark;
    key = key.toUpperCase();
    for (var modifier in transforms) {
      if (Object.prototype.hasOwnProperty.call(transforms, modifier)) {
        block = transforms[modifier];
        mark  = '${' + key + (block ? ':' + modifier : '') + '}';
        if (result.indexOf(mark) >= 0) {
          result = result.replace(mark, (block ? block(value) : value), 'g');
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
    toJavaScript(file, 'utf8', function(e, code) {
      if (e) {
        return resume(e);
      }
      fs.writeFile(temporary, substitute(template, file, code, options), 'utf8', function(e) {
        if (e) {
          return resume(e);
        }
        launch(temporary, options, resume);
      });
    });
  });
};

function launch(file, options, resume) {
  var phantom = childProcess.spawn(options.phantom, [
    "--cookies-file=" + options.cache.cookieFile,
    file
  ]);
  var pid    = phantom.pid,
      status = 'running',
      stdout = '', stderr = '';
  phantom.stdout.on('data', function(string) {
    stdout = stdout + string;
  });
  phantom.stderr.on('data', function(string) {
    stderr = stderr + string;
  });
  phantom.on('exit', function(code) {
    if (status === 'running') {
      status = 'exited';
      interval && clearTimeout(interval);
      resume(null, code, {
        stdout: stdout,
        stderr: stderr
      });
    }
  });
  var interval = setTimeout(function() {
    var signal = 'SIGTERM';
    if (status === 'running') {
      status = 'killed';
      phantom.kill(signal);
      resume(new Error("Process '" + pid + "' terminated with '" + signal + "', timed out"));
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

function toJavaScript() {
  return fs.readFile.apply(fs, arguments);
};

exports.process = process_;
