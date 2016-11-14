// Generated by CoffeeScript 1.9.3
(function() {
  var CallbacksRegistry, callbacksRegistry, ipc, isCircular, metaToValue, moduleCache, process, processCache, v8Util, webContentsCache, windowCache, wrapArgs,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  process = global.process;

  ipc = require('ipc');

  v8Util = process.atomBinding('v8_util');

  CallbacksRegistry = require('callbacks-registry');

  callbacksRegistry = new CallbacksRegistry;

  isCircular = function(field, visited) {
    if (typeof field === 'object') {
      if (indexOf.call(visited, field) >= 0) {
        return true;
      }
      visited.push(field);
    }
    return false;
  };

  wrapArgs = function(args, visited) {
    var valueToMeta;
    if (visited == null) {
      visited = [];
    }
    valueToMeta = function(value) {
      var field, prop, ret;
      if (Array.isArray(value)) {
        return {
          type: 'array',
          value: wrapArgs(value, visited)
        };
      } else if (Buffer.isBuffer(value)) {
        return {
          type: 'buffer',
          value: Array.prototype.slice.call(value, 0)
        };
      } else if ((value != null) && value.constructor.name === 'Promise') {
        return {
          type: 'promise',
          then: valueToMeta(value.then.bind(value))
        };
      } else if ((value != null) && typeof value === 'object' && v8Util.getHiddenValue(value, 'atomId')) {
        return {
          type: 'remote-object',
          id: v8Util.getHiddenValue(value, 'atomId')
        };
      } else if ((value != null) && typeof value === 'object') {
        ret = {
          type: 'object',
          name: value.constructor.name,
          members: []
        };
        for (prop in value) {
          field = value[prop];
          ret.members.push({
            name: prop,
            value: valueToMeta(isCircular(field, visited) ? null : field)
          });
        }
        return ret;
      } else if (typeof value === 'function' && v8Util.getHiddenValue(value, 'returnValue')) {
        return {
          type: 'function-with-return-value',
          value: valueToMeta(value())
        };
      } else if (typeof value === 'function') {
        return {
          type: 'function',
          id: callbacksRegistry.add(value)
        };
      } else {
        return {
          type: 'value',
          value: value
        };
      }
    };
    return Array.prototype.slice.call(args).map(valueToMeta);
  };

  metaToValue = function(meta) {
    var RemoteFunction, el, fn, i, j, len, len1, member, ref, ref1, results, ret;
    switch (meta.type) {
      case 'value':
        return meta.value;
      case 'array':
        ref = meta.members;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          el = ref[i];
          results.push(metaToValue(el));
        }
        return results;
      case 'buffer':
        return new Buffer(meta.value);
      case 'promise':
        return Promise.resolve({
          then: metaToValue(meta.then)
        });
      case 'error':
        throw new Error(meta.message + "\n" + meta.stack);
        break;
      default:
        if (meta.type === 'function') {
          ret = RemoteFunction = (function() {
            function RemoteFunction() {
              var obj;
              if (this.constructor === RemoteFunction) {
                obj = ipc.sendSync('ATOM_BROWSER_CONSTRUCTOR', meta.id, wrapArgs(arguments));
                return metaToValue(obj);
              } else {
                ret = ipc.sendSync('ATOM_BROWSER_FUNCTION_CALL', meta.id, wrapArgs(arguments));
                return metaToValue(ret);
              }
            }

            return RemoteFunction;

          })();
        } else {
          ret = v8Util.createObjectWithName(meta.name);
        }
        ref1 = meta.members;
        fn = function(member) {
          var RemoteMemberFunction;
          if (member.type === 'function') {
            return ret[member.name] = RemoteMemberFunction = (function() {
              function RemoteMemberFunction() {
                var obj;
                if (this.constructor === RemoteMemberFunction) {
                  obj = ipc.sendSync('ATOM_BROWSER_MEMBER_CONSTRUCTOR', meta.id, member.name, wrapArgs(arguments));
                  return metaToValue(obj);
                } else {
                  ret = ipc.sendSync('ATOM_BROWSER_MEMBER_CALL', meta.id, member.name, wrapArgs(arguments));
                  return metaToValue(ret);
                }
              }

              return RemoteMemberFunction;

            })();
          } else {
            return Object.defineProperty(ret, member.name, {
              enumerable: true,
              configurable: false,
              set: function(value) {
                ipc.sendSync('ATOM_BROWSER_MEMBER_SET', meta.id, member.name, value);
                return value;
              },
              get: function() {
                ret = ipc.sendSync('ATOM_BROWSER_MEMBER_GET', meta.id, member.name);
                return metaToValue(ret);
              }
            });
          }
        };
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          member = ref1[j];
          fn(member);
        }
        v8Util.setDestructor(ret, function() {
          return ipc.send('ATOM_BROWSER_DEREFERENCE', meta.id);
        });
        v8Util.setHiddenValue(ret, 'atomId', meta.id);
        return ret;
    }
  };

  ipc.on('ATOM_RENDERER_CALLBACK', function(id, args) {
    return callbacksRegistry.apply(id, metaToValue(args));
  });

  ipc.on('ATOM_RENDERER_RELEASE_CALLBACK', function(id) {
    return callbacksRegistry.remove(id);
  });

  moduleCache = {};

  exports.require = function(module) {
    var meta;
    if (moduleCache[module] != null) {
      return moduleCache[module];
    }
    meta = ipc.sendSync('ATOM_BROWSER_REQUIRE', module);
    return moduleCache[module] = metaToValue(meta);
  };

  windowCache = null;

  exports.getCurrentWindow = function() {
    var meta;
    if (windowCache != null) {
      return windowCache;
    }
    meta = ipc.sendSync('ATOM_BROWSER_CURRENT_WINDOW', process.guestInstanceId);
    return windowCache = metaToValue(meta);
  };

  webContentsCache = null;

  exports.getCurrentWebContents = function() {
    var meta;
    if (webContentsCache != null) {
      return webContentsCache;
    }
    meta = ipc.sendSync('ATOM_BROWSER_CURRENT_WEB_CONTENTS');
    return webContentsCache = metaToValue(meta);
  };

  exports.getGlobal = function(name) {
    var meta;
    meta = ipc.sendSync('ATOM_BROWSER_GLOBAL', name);
    return metaToValue(meta);
  };

  processCache = null;

  exports.__defineGetter__('process', function() {
    if (processCache == null) {
      processCache = exports.getGlobal('process');
    }
    return processCache;
  });

  exports.createFunctionWithReturnValue = function(returnValue) {
    var func;
    func = function() {
      return returnValue;
    };
    v8Util.setHiddenValue(func, 'returnValue', true);
    return func;
  };

  exports.getGuestWebContents = function(guestInstanceId) {
    var meta;
    meta = ipc.sendSync('ATOM_BROWSER_GUEST_WEB_CONTENTS', guestInstanceId);
    return metaToValue(meta);
  };

}).call(this);
