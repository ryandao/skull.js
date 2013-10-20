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

// Make sure we have the dependencies included
if (typeof jQuery === 'undefined') {
  throw new Error("Skull.js requires jQuery >= 1.9.0");
}

if (typeof Handlebars === 'undefined') {
  throw new Error("Skull.js requires Handlebars >= 1.0.0");
}

/**
  Helper function for making a "class". Return the constructor
  function for all the instances of the class.

  Optional parameters can be a superclass for the class to inherit from
  and custom properties that will be mixed in as instance methods.

  TODO: Implement `super` functionality
*/
function MakeClass() {
  var subclass = function() { };
  var klass = function() { }
  var parent = null, properties = Array.prototype.slice.call(arguments);

  if ($.isFunction(properties[0])) {
    parent = properties.shift();
  }

  klass.superclass = parent;
  klass.subclasses = [];

  if (parent) {
    subclass.prototype = parent.prototype;
    klass.prototype = new subclass;
    parent.subclasses.push(klass);
  }

  // Add the custom properties to the class
  for (var i = 0; i < properties.length; i++) {
    $.each(properties[i], function(property, value){
      klass.prototype[property] = value;
    })
  }

  if (! klass.prototype.initialize) {
    klass.prototype.initialize = function() {};
  }

  klass.prototype.constructor = klass;
  return klass;
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
      var subclass = MakeClass(this, properties);
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
      $.extend(instance, properties);

      // Call the initialize method if any
      instance.initialize.apply(instance);

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
    $.extend(aClass, this.classMethods);
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
    this.__listeners__ || (this.__listeners__ = {});
    var listeners = this.__listeners__[name] || (this.__listeners__[name] = []);
    listeners.push(callback);
    return this;
  },

  removeListener: function(name, callback) {
    var listeners, retain;

    if (! this.__listeners__) { return this; }
    if (listeners = this.__listeners__[name]) {
      this.__listeners__ = retain = [];
      for (var i = 0; i < listeners.length; i++) {
        if (this.__listeners__[i] !== callback) {
          retain.push(this.__listeners__[i]);
        }
      }
    }
    return this;
  },

  sendEvent: function(eventName, params) {
    var listeners;

    if (! this.__listeners__) { return this; }
    if (listeners = this.__listeners__[eventName]) {
      for (var i = 0; i < listeners.length; i++) {
        var callback = listeners[i];
        // TODO: Set the target for the event
        callback.apply(this, params);
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

  /**
    Add an observer that observes changes of a particular property.
    Use `all` for propertyName if you want to observe all the property changes.
  */
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

  /**
    Fire the events subscribed to the change in the given property.
    Also fire the `all:changed` event for any observer that observes
    all the property changes.
  */
  propertyDidChange: function(propertyName) {
    if (! this.sendEvent) {
      throw new Error("Skull.Observable.propertyDidChange cannot be used without Skull.Events.sendEvent");
    }

    this.sendEvent(this._eventName('all'));
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
Skull.Object = MakeClass(Skull.Events, Skull.Observable);

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
