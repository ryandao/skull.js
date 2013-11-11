/*! skull.js - v0.0.1 - 2013-11-11
* Copyright (c) 2013 ; Licensed  */
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
  Influenced by Prototype.

  Helper function for making a "class". Return the constructor
  function for all the instances of the class.

  Optional parameters can be a superclass for the class to inherit from
  and custom properties that will be mixed in as instance methods.
*/
function MakeClass() {
  var subclass = function() { };
  var Class = function() { }
  var parent = null, properties = Array.prototype.slice.call(arguments);

  if ($.isFunction(properties[0])) {
    parent = properties.shift();
  }

  Class.superclass = parent;
  Class.subclasses = [];

  if (parent) {
    subclass.prototype = parent.prototype;
    Class.prototype = new subclass;
    parent.subclasses.push(Class);
  }

  // Add the custom properties to the class
  for (var i = 0; i < properties.length; i++) {
    $.each(properties[i], function(property, value){
      Class.prototype[property] = value;

      // If a method of the child class overrides the super class' method,
      // make the super class' method available via `this._super()`
      if (parent && $.isFunction(parent.prototype[property]) && $.isFunction(value)) {
        Class.prototype[property] = (function(property, fn) {
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = parent.prototype[property];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            if (typeof this._super === 'undefined') {
              delete this._super;
            }

            return ret;
          }
        })(property, value);
      } else {
        Class.prototype[property] = value;
      }
    })
  }

  if (! Class.prototype.initialize) {
    Class.prototype.initialize = Skull.P;
  }

  Class.prototype.constructor = Class;
  return Class;
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
  addListener: function(name, callback, target) {
    if (! callback) { return this; }

    this.__listeners__ || (this.__listeners__ = {});
    var listeners = this.__listeners__[name] || (this.__listeners__[name] = []);

    listeners.push({
      callback: callback,
      target: target
    });

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
        var callback = listeners[i].callback;
        callback.apply(listeners[i].target || this, params);
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

Skull.ArrayProxy = Skull.Object.extend({
  content: Skull.P,

  forEach: function(callback) {
    return this.content.forEach(callback);
  }
});

Skull.ActionHelper = (function() {
  var actions = {};
  var actionId = 0;

  var registerAction = function(actionName, options) {
    var handler = function(event) {
      event.preventDefault();

      if (options.bubbles === false) {
        event.stopPropagation();
      }

      var view = options.view,
          target = options.target;

      if (typeof target[actionName] === 'undefined') {
        throw "Action " + actionName + " does not exist in the target " + target.toString();
      }

      options.params.unshift(event);
      return target[actionName].apply(target, options.params);
    };

    actions[actionId] = {
      eventName: options.eventName,
      handler: handler
    };

    return actionId;
  };

  return {
    actions: actions,
    registerAction: registerAction
  };
})();

Skull.BindingHelper = (function() {
  var bindings = {};
  var idCounter = 0;

  var registerBinding = function(root, propertyPath) {
    var bindingId = (++idCounter).toString();

    bindings[bindingId] = {
      root: root,
      path: propertyPath
    };

    return bindingId;
  };

  return {
    bindings: bindings,
    registerBinding: registerBinding
  };
})();

Skull.CollectionHelper = (function() {
  var collections = {};
  var idCounter = 0;

  var registerCollection = function(root, propertyPath, fn) {
    var collectionId = (++idCounter).toString();

    collections[collectionId] = {
      root: root,
      path: propertyPath,
      fn: fn
    }

    return collectionId;
  };

  return {
    collections: collections,
    registerCollection: registerCollection
  };
})();

/**
  The `{{action}}` helper registers an HTML element within a template for DOM
  event handling and forwards that interaction to the specified target. The
  target can only be the view, the view's controller, or a custom target passed
  in via the `target` option.

  You can specify the corresponding DOM event via the `on` option. The default
  event is `click`. For example given the Handlebars template:

    <script type="text/x-handlebars" id="person">
      <span>{{view.name}}</span>
      <input {{action "changeName" on="change"}} type="text">
    </script>

  And a view:

    var AView = Skull.View.extend({
      templateId: 'person',
      changeName: function(event) {
        var value = event.currentTarget.value;
        this.set('name', value);
      }
    });

    var aView = AView.create({name: 'Ryan'});

  It will result in the following HTML:

    <span>Ryan</span>
    <input data-skull-action=1 type='text'>

  Any changes inside the text input calls the `changeName` method inside the view
  and update `name` accordingly. You can also bind the display of `name` to the
  associating view's property using the {{bind}} helper.
*/
Handlebars.registerHelper('action', function(actionName) {
  var options = arguments[arguments.length - 1],
      params = Array.prototype.slice.call(arguments, 1, - 1);

  var hash = options.hash,
      view = this.view,
      controller = this.controller,
      target, link;

  // Decide who will be the target of the action.
  // A custom target passed in via `target=customTarget` will take precedence,
  // and then controller and view.
  if (hash.target) {
    target = hash.target;
  } else if (controller) {
    target = controller;
  } else {
    target = view;
  }

  // create a hash to pass along to registerAction
  var action = {
    eventName: hash.on || "click",
    view: view,
    target: target,
    bubbles: hash.bubbles || false,
    params: params
  };

  var actionId = Skull.ActionHelper.registerAction(actionName, action);
  return new Handlebars.SafeString('data-skull-action="' + actionId + '"');
});

/**
  The `bind` helper can be used to display a value, then update that value if it
  changes. For example, if you wanted to print the `name` property of
  `person` using the following template:

    <script type="text/x-handlebars" id="person">
      {{bind view.name}}
    </script>

  With the view:

    var AView = Skull.View.extend({ templateId: 'person' })l
    var aView = AView.create({name: 'Ryan'})

  It will result in the following HTML:

    <span data-skull-binding=1>Ryan</span>

  Whenever `name` is updated using `aView.set('name', 'newValue')`, the
  display of `view.name` will also be updated automatically.
*/
Handlebars.registerHelper('bind', function(propertyPath, options) {
  if (arguments.length > 2) {
    throw new Error("You cannot pass more than one arguments to the bind helper");
  }

  var bindingId = Skull.BindingHelper.registerBinding(this, propertyPath);
  return new Handlebars.SafeString("<span data-skull-binding=" + bindingId + ">" +
                                      Skull.getPath(this, propertyPath) +
                                   "</span>");
});

Handlebars.registerHelper('each', function(propertyPath, options) {
  // To support ArrayProxy and RecordArray, only render a wrapper
  // and let the view fill the data in later.
  var collectionId = Skull.CollectionHelper.registerCollection(this, propertyPath, options.fn);
  return new Handlebars.SafeString("<div data-skull-collection=" + collectionId + "></div>");
});

Skull.getPath = function(root, path) {
  var parts = path.split('.');

  for (var i = 0; i < parts.length; i++) {
    root = root[parts[i]];
  }

  return root;
};

/**
 * Get the property name, which is the last component of a given path.
 * For example, if the path is `view.controller.person`, the property
 * name is `person`.
 */
Skull.getPropertyName = function(path) {
  var parts = path.split('.');
  return parts[parts.length - 1];
}

Skull.Route = Skull.Object.extend({
  /**
   * This is a pre-execution hook for custom route logic.
   * This method is called after initialization and before view rendering.
   */
  setup: Skull.P,

  /**
   * Initialize the controller and view instances of the route
   * based on the class settings:
   *
   *     MyRoute = Skull.Route.extend({
   *       controller: MyControllerClass,
   *       view: MyViewClass
   *     })
   *
   * This should not be overriden in your custom route class, unless
   * you want to customize your view and controller settings.
   * For other customization, use `setup()` instead.
   */
  initialize: function() {
    if (typeof this.controllerClass !== 'undefined') {
      this.controller = this.controllerClass.create();
    }

    if (typeof this.viewClass !== 'undefined') {
      this.view = this.viewClass.create({ controller: this.controller });
    }

    return this;
  },

  /**
   * Execute the route logic and render the view.
   * This should never be called manually,
   * instead it's called by the router by default.
   * Override this method if you want to do custom logic other than
   * view rendering (e.g. redirection).
   */
  execute: function() {
    this.setup.apply(this, arguments);
    this.view.render();
  }
});

Skull.History = Skull.Object.extend({
  locationType: 'hash',
  root: '/',
  fragment: '',

  initialize: function() {
    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }

    this.usePushState = this.locationType === 'history';
    this.useHashChange = this.locationType === 'hash';
  },

  // Start the History operations.
  start: function() {
    var _this = this;

    if (this.usePushState) {
      window.onpopstate = function() {
        _this.checkUrl();
      };
    } else if (this.useHashChange) {
      $(window).on('hashchange', function() {
        _this.checkUrl();
      });
    }

    return this.loadUrl();
  },

  getFragment: function() {
    var fragment;

    if (this.usePushState && ! this.useHashChange) {
      fragment = this.location.pathname;
    } else {
      fragment = this.getHash();
    }

    return this.normalizeFragment(fragment);
  },

  getHash: function() {
    var match = window.location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  },

  normalizeFragment: function(fragment) {
    var trailingSlash = /\/$/;
    var routeStripper = /^[#\/]|\s+$/g;
    var root = this.root.replace(trailingSlash, '');

    if (! fragment.indexOf(root)) {
      fragment = fragment.slice(root.length);
    }

    return fragment.replace(routeStripper, '');
  },

  // Check if the url is changed an call `loadUrl`
  checkUrl: function(e) {
    var current = this.getFragment();

    if (current !== this.fragment) {
      this.loadUrl(current);
    } else {
      return false;
    }
  },

  // Save the current fragment and notify all observers
  // of the change in url. Normally there's always one
  // observer which is the app router.
  loadUrl: function(fragment) {
    fragment = fragment || this.location.pathname;
    this.fragment = this.normalizeFragment(fragment);
    this.sendEvent('url:changed');
  },

  // Navigate to a particular route
  navigate: function(fragment) {
    var url = this.root + this.normalizeFragment(fragment);

    if (this.usePushState) {
      this.history.pushState({}, document.title, url);
    } else if (this.useHashChange) {
      this.location.hash = '#' + this.normalizeFragment(fragment);
    }
  }
});

/**
 * SkullJS Router.
 * Heavily inspired by Backbone Router.
 * By default each `Application` object will have a router
 * associated. Define the routes for the application by:
 *
 *     myApp.router.define({
 *       'users': myApp.UsersRoute
 *     })
 */
Skull.Router = Skull.Object.extend({
  currentRoute: Skull.P,
  routeMapping: {},

  initialize: function() {
    // Set up History API
    this.history = Skull.History.create();
    this.history.addListener('url:changed', this.urlChanged, this);
  },

  define: function(mapping) {
    this.routeMapping = mapping;
  },

  // Called when a url is changed in the History API.
  urlChanged: function() {
    this.loadRoute(this.history.fragment);
  },

  // Load the route associating to a url fragment.
  loadRoute: function(fragment) {
    var router = this;

    return $.each(this.routeMapping, function(route, routeClass) {
      route = (route instanceof RegExp) ? route : router._routeToRegExp(route);

      if (route.test(fragment) && routeClass) {
        var args = router._extractParameters(route, fragment);
        var routeObj = routeClass.create();
        router.currentRoute = routeObj;
        routeObj.execute.apply(routeObj, args);
        return true;
      }
    })
  },

  // Proxy to History `navigate`
  navigate: function(fragment) {
    return this.history.navigate(fragment);
  },

  // Convert a route string into a regular expression, suitable for matching
  // against the current location hash.
  _routeToRegExp: function(route) {
    var optionalParam = /\((.*?)\)/g;
    var namedParam    = /(\(\?)?:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    route = route.replace(escapeRegExp, '\\$&')
                 .replace(optionalParam, '(?:$1)?')
                 .replace(namedParam, function(match, optional) {
                   return optional ? match : '([^\/]+)';
                 })
                 .replace(splatParam, '(.*?)');
    return new RegExp('^' + route + '$');
  },

  // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  _extractParameters: function(route, fragment) {
    var params = route.exec(fragment).slice(1);
    return params.map(function(param) {
      return param ? decodeURIComponent(param) : null;
    });
  }
});

Skull.Application = Skull.Object.extend({
  initialize: function() {
    this.router =  Skull.Router.create();
  },

  start: function() {
    this.router.history.start();
  }
});

Skull.Controller = Skull.Object.extend({

});

Skull.View = Skull.Object.extend({
  templateId: '',
  rootEl: 'body',

  initialize: function() {
    this.rootEl = (this.rootEl instanceof jQuery) ? this.rootEl : $(this.rootEl);
    this.__scriptEl__ = $('#' + this.get('templateId'));
    this.__template__ = Handlebars.compile(this.__scriptEl__.html());

    return this;
  },

  render: function() {
    var html = this.__template__({
      view: this,
      controller: this.get('controller')
    });

    var el = $(document.createElement('div')).append(html);

    if (this.$) {
      // Re-rendering case
      this.$.replaceWith(el);
    } else {
      this.rootEl.html(el);
    }

    this.$ = el;
    this.setupHandlers();
    this.setupBindings();
    this.setupCollections();

    return this;
  },

  /**
    Setup the action handlers for the view's element.
    It basically proxies the DOM events to the actions
    set up by the view and Handlebars template.
  */
  setupHandlers: function() {
    var eventNames = [
      'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'click',
      'doubleclick', 'mousemove', 'focusin', 'focusout', 'mouseenter',
      'mouseleave', 'submit', 'input', 'change'
    ]

    for (var i = 0; i < eventNames.length; i++) {
      this.setupHandler(eventNames[i]);
    }
  },

  setupHandler: function(eventName) {
    this.$.on(eventName, '[data-skull-action]', function(event) {
      var actionId = $(event.currentTarget).attr('data-skull-action');
      var action = Skull.ActionHelper.actions[actionId];
      var handler = action.handler;

      if (action.eventName === eventName) {
        handler(event);
      }
    });
  },

  /**
    Set up the data binding specified using the {{bind}} helper.
  */
  setupBindings: function() {
    var view = this;
    var controller = view.controller;

    $('[data-skull-binding]', this.$).each(function() {
      var el = $(this),
          bindingId = el.attr('data-skull-binding'),
          propertyPath = Skull.BindingHelper.bindings[bindingId].path,
          root = Skull.BindingHelper.bindings[bindingId].root,
          parts = propertyPath.split('.'),
          propertyName = parts[parts.length - 1];

      for (var i = 0; i < parts.length - 1; i++) {
        root = root[parts[i]];
      }

      if (typeof root.addObserver !== 'undefined') {
        root.addObserver(propertyName, function() {
          el.html(this.get(propertyName));
        });
      }
    });
  },

  setupCollections: function() {
    var view = this;
    var controller = view.controller;

    $('[data-skull-collection]', this.$).each(function() {
      var el = $(this),
          collectionId = el.attr('data-skull-collection'),
          propertyPath = Skull.CollectionHelper.collections[collectionId].path,
          root = Skull.CollectionHelper.collections[collectionId].root,
          fn = Skull.CollectionHelper.collections[collectionId].fn,
          parts = propertyPath.split('.'),
          propertyName = parts[parts.length - 1],
          items = Skull.getPath(root, propertyPath);

      items.forEach(function(item) {
        el.append(fn(item));
      });

      // Add an observer for the collection
      for (var i = 0; i < parts.length - 1; i++) {
        root = root[parts[i]];
      }

      if (typeof root.addObserver !== 'undefined') {
        root.addObserver(propertyName, function() {
          var newEl = $(document.createElement('div'));
          var newItems = this.get(propertyName);

          newItems.forEach(function(item) {
            newEl.append(fn(item));
          });

          el.replaceWith(newEl);
          el = newEl;
        });
      }
    });
  },

  /**
   * Clean up the view for removal.
   * Detached the elements out of the DOM and remove all events.
   */
  cleanup: function() {
    this.$.remove();
    return this;
  }
});

Skull.Model = Skull.Object.extend({
  url: Skull.P,
  recordUrl: Skull.P
});

/**
 * A record encapsulates the JSON response and provides
 * async retrieval of the attributes.
 * TODO: Allow binding async record with the view.
 */
Skull.Record = Skull.Object.extend({
  isLoaded: false,
  recordDidLoad: Skull.P,

  initialize: function() {
    var record = this;

    if (typeof this.promise !== 'undefined') {
      this.promise.done(function(data) {
        record.set('content', data);
        record.set('isLoaded', true);
        record.recordDidLoad();
      });
    }
  },

  // Proxy the getter to `content`
  get: function(attr) {
    return this.content.get('attr');
  }
});

Skull.RecordArray = Skull.ArrayProxy.extend({
  isLoaded: false,

  initialize: function() {
    var _this = this;

    if (typeof this.promise !== 'undefined') {
      this.promise.done(function(data) {
        _this.set('content', data);
        _this.set('isLoaded', true);
      });
    } else {
      this.set('isLoaded', true);
    }
  },

  forEach: function(callback) {
    if (this.isLoaded) {
      this._super(callback);
    } else {
      this.addObserver('isLoaded', function() {
        if (this.isLoaded) {
          this.content.forEach(callback);
        }
      });
    }
  },

  /**
   * Add one or more records to the array.
   * The records can be a raw array, a single record.
   *
   * TODO: Add support for RecordArray as parameter.
   */
  add: function() {
    if (jQuery.isArray(arguments[0])) {
      this.set('content', this.content.concat(records));
    } else {
      this.content.push(records);
    }
  }
});

Skull.Store = Skull.Object.extend({
  find: function(modelClass, id) {
    if (typeof id === 'undefined') {
      return this.findAll(modelClass);
    } else {
      var url = modelClass.prototype.recordUrl(id);
      var promise = $.ajax({
        url: url
      });

      return Skull.Record.create({
        promise: promise
      });
    }
  },

  findAll: function(modelClass) {
    return Skull.RecordArray.create({
      promise: $.ajax({
        url: modelClass.prototype.url
      })
    });
  },

  findQuery: function(modelClass, query) {
    return Skull.RecordArray.create({
      promise: $.ajax({
        url: modelClass.prototype.url,
        data: query
      })
    });
  }
});
