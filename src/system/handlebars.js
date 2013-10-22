Skull.ActionHelper = {
  actions: {},

  registerAction: (function(actionName, options) {
    var idCounter = 0;

    return function(actionName, options) {
      var actionId = (++idCounter).toString();

      Skull.ActionHelper.actions[actionId] = {
        eventName: options.eventName,
        handler: function(event) {
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
        }
      };

      return actionId;
    }
  })()
};

Skull.BindingHelper = {
  bindings: {},

  registerBinding: (function(propertyPath) {
    var idCounter = 0;

    return function(propertyPath) {
      var bindingId = (++idCounter).toString();

      Skull.BindingHelper.bindings[bindingId] = {
        path: propertyPath
      };

      return bindingId;
    }
  })()
}

/**
  Inspired by Ember's {{action}} helper.
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

Handlebars.registerHelper('bind', function(propertyPath, options) {
  if (arguments.length > 2) {
    throw new Error("You cannot pass more than one arguments to the bind helper");
  }

  var bindingId = Skull.BindingHelper.registerBinding(propertyPath);
  return new Handlebars.SafeString("<span data-skull-binding=" + bindingId + ">" +
                                      getPath(this, propertyPath) +
                                   "</span>");
});

function getPath(root, path) {
  var parts = path.split('.');

  for (var i = 0; i < parts.length; i++) {
    root = root[parts[i]];
  }

  return root;
}