setInterval(function() {
  if (_waiting <= 0) {
    phantom.exit(_failed ? 1 : 0);
  }
}, 125);

window.onerror = function() {
  console.error(ansiStyle('red') + "Uncaught exception in '" + '${FILE}' + "':\n" + ansiStyle('reset') + Array.prototype.slice.call(arguments).join('; ').trim());
  phantom.exit(2);
};
