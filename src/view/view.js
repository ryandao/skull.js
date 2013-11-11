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
    this.rootEl.html(el);
    this.$ = el;
    this.setupHelpers(el);

    return this;
  },

  /**
   * Set up the custom Handlebars helpers like {{bind}}, {{action}}, {{each}}
   */
  setupHelpers: function(el) {
    this.setupHandlers(el);
    this.setupBindings(el);
    this.setupCollections(el);
  },

  /**
    Setup the action handlers for a given DOM structure.
    It basically proxies the DOM events to the actions
    set up by the view and Handlebars template.
  */
  setupHandlers: function(el) {
    var eventNames = [
      'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'click',
      'doubleclick', 'mousemove', 'focusin', 'focusout', 'mouseenter',
      'mouseleave', 'submit', 'input', 'change'
    ]

    for (var i = 0; i < eventNames.length; i++) {
      this.setupHandler(el, eventNames[i]);
    }
  },

  setupHandler: function(el, eventName) {
    el.on(eventName, '[data-skull-action]', function(event) {
      var actionId = $(event.currentTarget).attr('data-skull-action');
      var action = Skull.ActionHelper.actions[actionId];
      var handler = action.handler;

      if (action.eventName === eventName) {
        handler(event);
      }
    });
  },

  /**
    Set up the data binding specified using the {{bind}} or {{boundIf}} helper.
  */
  setupBindings: function(el) {
    var view = this;
    var controller = view.controller;

    $('[data-skull-binding]', el).each(function() {
      var el = $(this);
      var bindingId = el.attr('data-skull-binding');
      var bindObj = Skull.BindingHelper.bindings[bindingId];
      var parts = bindObj.path.split('.');
      var propertyName = parts[parts.length - 1];
      var root;

      for (var i = 0; i < parts.length - 1; i++) {
        root = bindObj.root[parts[i]];
      }

      if (typeof root.addObserver !== 'undefined') {
        root.addObserver(propertyName, function() {
          el.html(bindObj.fn(bindObj.context));

          // Setup Handlebars helpers for the nested DOM if any.
          view.setupHelpers(el);
        });
      }
    });
  },

  setupCollections: function(el) {
    var view = this;
    var controller = view.controller;

    $('[data-skull-collection]', el).each(function() {
      var el = $(this);
      var collectionId = el.attr('data-skull-collection');
      var collectionObj = Skull.CollectionHelper.collections[collectionId];
      var parts = collectionObj.path.split('.');
      var propertyName = parts[parts.length - 1];
      var items = Skull.getPath(collectionObj.root, collectionObj.path);

      items.forEach(function(item) {
        el.append(collectionObj.fn(item));
      });

      // Add an observer for the collection
      var root;
      for (var i = 0; i < parts.length - 1; i++) {
        root = collectionObj.root[parts[i]];
      }

      if (typeof root.addObserver !== 'undefined') {
        root.addObserver(propertyName, function() {
          var newEl = $(document.createElement('div'));
          var newItems = this.get(propertyName);

          newItems.forEach(function(item) {
            newEl.append(collectionObj.fn(item));
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
