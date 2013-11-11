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
  }
});
