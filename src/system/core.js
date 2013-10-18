if (typeof Skull === 'undefined') {
  // Create the core namespace object
  Skull = {};
}

/**
  A placeholder object used for any property that will be
  defined later on. For example:

    var MyClass = Skull.Object.extend({
      test: Skull.P
    });

    var myObj = MyClass.create({
      test: function() {
        console.log("Test");
      }
    });
*/
Skull.P = function() {
  return this;
}

// Make sure we have Prototype included
if (typeof Prototype === 'undefined') {
  throw new Error("Skull.js requires Prototype > 1.6.0");
}

/**
  A collection of class methods that are available for all classes in Skull.
  It contains core methods like extend() and create() which are copied to
  the constructors of all classes.
*/
Skull.ClassMixin = (function() {
  this.classMethods = {
    /**
      Create a new "class" that extends the current "class". For example:

        var Person = Skull.Object.extend({
          say: function() {
            console.log("Hello");
          }
        });

      The custom arguments are added to the prototype of the subclass.
      All instances of the subclass have access to the custom arguments.
    */
    extend: function() {
      var properties = arguments[0] || {};
      var subclass = Class.create(this, properties);
      this.ClassMixin.apply(subclass);

      // Take care of observing functions
      var observing_hash = getObservingFunctions(properties);
      updateObservers(subclass.prototype, observing_hash);

      return subclass;
    },

    /**
      Create a new "instance" of the current class.
      All the custom arguments are added to the instance object itself.
      For example:

        var Person = Skull.Object.extend({
          name: "Ryan"
        });
        var person = Person.create();
        person.hasOwnProperty('name'); // false

        var person2 = Person.create({
          name: "Ryan"
        });
        person2.hasOwnProperty('name'); // true
    */
    create: function() {
      var instance = new this();
      var properties = arguments[0] || {};
      Object.extend(instance, properties);

      // Take care of observing functions
      var observing_hash = getObservingFunctions(properties);
      updateObservers(instance, observing_hash);

      return instance;
    }
  };

  /**
    Apply the mixin to a given class.
    Keep a reference to the mixin in the class for later use.
  */
  this.apply = function(aClass) {
    Object.extend(aClass, this.classMethods);
    aClass.ClassMixin = this;
  };

  return this;
})();

/**
  Helper method to get the observing functions from a hash of
  mixin properties passed to Skull.Object.create().
*/
function getObservingFunctions(params) {
  var result = {}, observes_properties;
  for (var key in params) {
    if (! params.hasOwnProperty(key)) { continue; }

    if (observes_properties = params[key].__observes_properties__) {
      for (var i = 0; i < observes_properties.length; i++) {
        result[observes_properties[i]] = params[key];
      }
    }
  }
  return result;
}

/**
  Update the observers of an object.
  `obj` is the object needs to be updated.
  `observing_hash` is an object containing a property name as key and
  callback as value.
*/
function updateObservers(obj, observing_hash) {
  for (var key in observing_hash) {
    if (! observing_hash.hasOwnProperty(key)) { continue; }

    obj.addObserver(key, observing_hash[key]);
  }
}

/**
  A mixin that can be added to an object to enable event functionality.
  This will be mixed into the root Skull.Event object, so most of the
  time you don't need to call this module specifically.
*/
Skull.Events = {
  addListener: function(name, callback) {
    if (! callback) { return this; }
    this._listeners || (this._listeners = {});
    var listeners = this._listeners[name] || (this._listeners[name] = []);
    listeners.push(callback);
    return this;
  },

  removeListener: function(name, callback) {
    var listeners, retain;

    if (! this._listeners) { return this; }
    if (listeners = this._listeners[name]) {
      this._listeners = retain = [];
      for (var i = 0; i < listeners.length; i++) {
        if (this._listeners[i] !== callback) {
          retain.push(this._listeners[i]);
        }
      }
    }
    return this;
  },

  sendEvent: function(eventName, params) {
    var listeners;

    if (! this._listeners) { return this; }
    if (listeners = this._listeners[eventName]) {
      for (var i = 0; i < listeners.length; i++) {
        var callback = listeners[i];
        // TODO: Set the target for the event
        callback.apply(null, params);
      }
    }
    return this;
  }
}

/**
  A mixin that makes use of Skull.Events to enable property observing functionality.
  This has to be added to objects together with Skull.Events for it to work.
*/
Skull.Observable = {
  _eventName: function(propertyName) {
    return propertyName + ":changed";
  },

  addObserver: function(propertyName, callback) {
    if (! this.addListener) {
      throw new Error("Skull.Observable.addObserver cannot be used without Skull.Events.addListener");
    }
    return this.addListener(this._eventName(propertyName), callback);
  },

  removeObserver: function(propertyName, callback) {
    if (! this.removeListener) {
      throw new Error("Skull.Observable.removeObserver cannot be used without Skull.Events.removeListener");
    }
    return this.removeListener(this._eventName(propertyName), callback);
  },

  // Fire the events subscribed to the change in the given property
  propertyDidChange: function(propertyName) {
    if (! this.sendEvent) {
      throw new Error("Skull.Observable.propertyDidChange cannot be used without Skull.Events.sendEvent");
    }
    return this.sendEvent(this._eventName(propertyName));
  },

  /**
    All objects should use this method for getting their attributes.
    So instead of `person.name`, use `person.get('name')`.
    Classes and instances can customize getter depending on their needs.
  */
  get: function(attr) {
    return this[attr];
  },

  /**
    All objects should use this method for setting their attributes.
    So instead of `person.name = "Ryan"`, do `person.set('name', 'Ryan')`.
    Setter triggers the respective change events for others to listen to.
  */
  set: function(key, val) {
    if (key == null) {
      return this;
    }

    var current = this[key];
    if (current !== val) {
      this[key] = val;
      return this.propertyDidChange(key);
    } else {
      return this;
    }
  }
}

/**
  The core object for all objects to inherit from
*/
Skull.Object = Class.create(Skull.Events, Skull.Observable);

/**
  Apply the ClassMixin to Skull.Object
*/
Skull.ClassMixin.apply(Skull.Object);

/**
  Add the `observes` extension to Function.prototype.
  The extension can be used to add an observer to the
  changes of certain properties of an object during declaration.
  For example:

    var obj = Skull.Object.create({
      testObserver: function() {
        // Do something
      }.observes('test')
    })
*/
Function.prototype.observes = function() {
  if (arguments.length > 0) {
    this.__observes_properties__ = arguments;
  }
  return this;
}