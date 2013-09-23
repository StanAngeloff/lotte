var childProcess = require('child_process'),
    fs = require('fs'),
    vm = require('vm');

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

function toJavaScript(options, file, resume) {
  if (file.treatAs === 'coffee' || /\.coffee$/i.exec(file)) {
    if (options.coffee) {
      exec((options.coffee) + ' -b -p "' + (file.file || file) + '"', function(e, stdout) {
        if (e) {
          return resume(e);
        }
        resume(null, stdout.trim());
      });
    } else {
      try {
        var coffee = require('coffee-script');
        fs.readFile((file.file || file), 'utf8', function(e, code) {
          if (e) {
            return resume(e);
          }
          resume(null, coffee.compile(code, { bare: true }));
        });
      } catch (e) {
        return resume(e);
      }
    }
  } else {
    fs.readFile(file, 'utf8', function(e, code) {
      if (e) {
        return resume(e);
      }
      try {
        vm.createScript(code, file);
        resume(e, code);
      } catch (e) {
        toJavaScript(options, {
          treatAs: 'coffee',
          file:    file
        }, resume);
      }
    });
  }
};

exports.exec         = exec;
exports.toJavaScript = toJavaScript;
