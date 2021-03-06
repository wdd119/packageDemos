// Generated by CoffeeScript 1.9.3
(function() {
  var CallbacksRegistry, savedGlobal,
    slice = [].slice;

  savedGlobal = global;

  module.exports = CallbacksRegistry = (function() {
    function CallbacksRegistry() {
      this.emptyFunc = function() {
        throw new Error("Browser trying to call a non-exist callback in renderer, this usually happens when renderer code forgot to release a callback installed on objects in browser when renderer was going to be unloaded or released.");
      };
      this.callbacks = {};
    }

    CallbacksRegistry.prototype.add = function(callback) {
      var id;
      id = Math.random().toString();
      this.callbacks[id] = callback;
      return id;
    };

    CallbacksRegistry.prototype.get = function(id) {
      var ref;
      return (ref = this.callbacks[id]) != null ? ref : function() {};
    };

    CallbacksRegistry.prototype.call = function() {
      var args, id, ref;
      id = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return (ref = this.get(id)).call.apply(ref, [savedGlobal].concat(slice.call(args)));
    };

    CallbacksRegistry.prototype.apply = function() {
      var args, id, ref;
      id = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return (ref = this.get(id)).apply.apply(ref, [savedGlobal].concat(slice.call(args)));
    };

    CallbacksRegistry.prototype.remove = function(id) {
      return delete this.callbacks[id];
    };

    return CallbacksRegistry;

  })();

}).call(this);
