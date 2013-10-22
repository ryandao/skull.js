Skull.View = Skull.Object.extend({
  templateId: '',
  rootEl: 'body',

  initialize: function() {
    this.__scriptEl__ = $('#' + this.get('templateId'));
    this.render();
    return this;
  },

  render: function() {
    var source = this.__scriptEl__.html();
    var template = Handlebars.compile(source);
    var html = template({
      view: this,
      controller: this.get('controller')
    });
    var el = $(document.createElement('div')).append(html);

    if (this.$) {
      this.$.replaceWith(el);
    } else {
      this.__scriptEl__.replaceWith(el);
    }

    this.$ = el;
    this.setupHandlers();
    this.setupBindings();

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
    Set up the data binding specify using the {{bind}} helper.
    The bound attribute needs be belong to either the view or the controller.
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
});