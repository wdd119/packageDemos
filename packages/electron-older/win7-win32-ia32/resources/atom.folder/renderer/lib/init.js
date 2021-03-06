// Generated by CoffeeScript 1.9.3
(function() {
  var Module, arg, error, events, globalPaths, i, len, nodeIntegration, path, pathname, preloadScript, process, ref, url, v8Util;

  process = global.process;

  events = require('events');

  path = require('path');

  url = require('url');

  Module = require('module');

  process.argv.splice(1, 1);

  globalPaths = Module.globalPaths;

  globalPaths.push(path.resolve(__dirname, '..', 'api', 'lib'));

  globalPaths.push(path.join(process.resourcesPath, 'app'));

  globalPaths.push(path.join(process.resourcesPath, 'app.asar'));

  require(path.resolve(__dirname, '..', '..', 'common', 'lib', 'init'));

  v8Util = process.atomBinding('v8_util');

  v8Util.setHiddenValue(global, 'ipc', new events.EventEmitter);

  nodeIntegration = 'false';

  ref = process.argv;
  for (i = 0, len = ref.length; i < len; i++) {
    arg = ref[i];
    if (arg.indexOf('--guest-instance-id=') === 0) {
      process.guestInstanceId = parseInt(arg.substr(arg.indexOf('=') + 1));
    } else if (arg.indexOf('--node-integration=') === 0) {
      nodeIntegration = arg.substr(arg.indexOf('=') + 1);
    } else if (arg.indexOf('--preload=') === 0) {
      preloadScript = arg.substr(arg.indexOf('=') + 1);
    }
  }

  if (location.protocol === 'chrome-devtools:') {
    require('./inspector');
    nodeIntegration = 'true';
  } else if (location.protocol === 'chrome-extension:') {
    require('./chrome-api');
    nodeIntegration = 'true';
  } else {
    require('./override');
    if (process.guestInstanceId == null) {
      require('./web-view/web-view');
      require('./web-view/web-view-attributes');
    }
  }

  if (nodeIntegration === 'true' || nodeIntegration === 'all' || nodeIntegration === 'except-iframe' || nodeIntegration === 'manual-enable-iframe') {
    global.require = require;
    global.module = module;
    if (window.location.protocol === 'file:') {
      pathname = process.platform === 'win32' && window.location.pathname[0] === '/' ? window.location.pathname.substr(1) : window.location.pathname;
      global.__filename = path.normalize(decodeURIComponent(pathname));
      global.__dirname = path.dirname(global.__filename);
      module.filename = global.__filename;
      module.paths = module.paths.concat(Module._nodeModulePaths(global.__dirname));
    } else {
      global.__filename = __filename;
      global.__dirname = __dirname;
    }
    window.onerror = function(message, filename, lineno, colno, error) {
      if (global.process.listeners('uncaughtException').length > 0) {
        global.process.emit('uncaughtException', error);
        return true;
      } else {
        return false;
      }
    };
    window.addEventListener('unload', function() {
      return process.emit('exit');
    });
  } else {
    process.once('loaded', function() {
      delete global.process;
      delete global.setImmediate;
      delete global.clearImmediate;
      return delete global.global;
    });
  }

  if (preloadScript) {
    try {
      require(preloadScript);
    } catch (_error) {
      error = _error;
      if (error.code === 'MODULE_NOT_FOUND') {
        console.error("Unable to load preload script " + preloadScript);
      } else {
        console.error(error);
        console.error(error.stack);
      }
    }
  }

}).call(this);
