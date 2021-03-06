// Generated by CoffeeScript 1.9.3
(function() {
  var app, extensionInfoMap, fs, getExtensionInfoFromPath, getHostForPath, getPathForHost, hostPathMap, hostPathMapNextKey, loadedExtensions, loadedExtensionsPath, path, url;

  app = require('app');

  fs = require('fs');

  path = require('path');

  url = require('url');

  hostPathMap = {};

  hostPathMapNextKey = 0;

  getHostForPath = function(path) {
    var key;
    key = "extension-" + (++hostPathMapNextKey);
    hostPathMap[key] = path;
    return key;
  };

  getPathForHost = function(host) {
    return hostPathMap[host];
  };

  extensionInfoMap = {};

  getExtensionInfoFromPath = function(srcDirectory) {
    var manifest, page;
    manifest = JSON.parse(fs.readFileSync(path.join(srcDirectory, 'manifest.json')));
    if (extensionInfoMap[manifest.name] == null) {
      page = url.format({
        protocol: 'chrome-extension',
        slashes: true,
        hostname: getHostForPath(srcDirectory),
        pathname: manifest.devtools_page
      });
      extensionInfoMap[manifest.name] = {
        startPage: page,
        name: manifest.name,
        srcDirectory: srcDirectory
      };
      return extensionInfoMap[manifest.name];
    }
  };

  loadedExtensions = null;

  loadedExtensionsPath = null;

  app.on('will-quit', function() {
    var e;
    try {
      loadedExtensions = Object.keys(extensionInfoMap).map(function(key) {
        return extensionInfoMap[key].srcDirectory;
      });
      try {
        fs.mkdirSync(path.dirname(loadedExtensionsPath));
      } catch (_error) {
        e = _error;
      }
      return fs.writeFileSync(loadedExtensionsPath, JSON.stringify(loadedExtensions));
    } catch (_error) {
      e = _error;
    }
  });

  app.once('ready', function() {
    var BrowserWindow, chromeExtensionHandler, e, i, init, len, protocol, srcDirectory;
    protocol = require('protocol');
    BrowserWindow = require('browser-window');
    loadedExtensionsPath = path.join(app.getDataPath(), 'DevTools Extensions');
    try {
      loadedExtensions = JSON.parse(fs.readFileSync(loadedExtensionsPath));
      if (!Array.isArray(loadedExtensions)) {
        loadedExtensions = [];
      }
      for (i = 0, len = loadedExtensions.length; i < len; i++) {
        srcDirectory = loadedExtensions[i];
        getExtensionInfoFromPath(srcDirectory);
      }
    } catch (_error) {
      e = _error;
    }
    chromeExtensionHandler = function(request, callback) {
      var directory, parsed;
      parsed = url.parse(request.url);
      if (!(parsed.hostname && (parsed.path != null))) {
        return callback();
      }
      if (!/extension-\d+/.test(parsed.hostname)) {
        return callback();
      }
      directory = getPathForHost(parsed.hostname);
      if (directory == null) {
        return callback();
      }
      return callback(path.join(directory, parsed.path));
    };
    protocol.registerFileProtocol('chrome-extension', chromeExtensionHandler, function(error) {
      if (error) {
        return console.error('Unable to register chrome-extension protocol');
      }
    });
    BrowserWindow.prototype._loadDevToolsExtensions = function(extensionInfoArray) {
      var ref;
      return (ref = this.devToolsWebContents) != null ? ref.executeJavaScript("DevToolsAPI.addExtensions(" + (JSON.stringify(extensionInfoArray)) + ");") : void 0;
    };
    BrowserWindow.addDevToolsExtension = function(srcDirectory) {
      var extensionInfo, j, len1, ref, window;
      extensionInfo = getExtensionInfoFromPath(srcDirectory);
      if (extensionInfo) {
        ref = BrowserWindow.getAllWindows();
        for (j = 0, len1 = ref.length; j < len1; j++) {
          window = ref[j];
          window._loadDevToolsExtensions([extensionInfo]);
        }
        return extensionInfo.name;
      }
    };
    BrowserWindow.removeDevToolsExtension = function(name) {
      return delete extensionInfoMap[name];
    };
    init = BrowserWindow.prototype._init;
    return BrowserWindow.prototype._init = function() {
      init.call(this);
      return this.on('devtools-opened', function() {
        return this._loadDevToolsExtensions(Object.keys(extensionInfoMap).map(function(key) {
          return extensionInfoMap[key];
        }));
      });
    };
  });

}).call(this);
