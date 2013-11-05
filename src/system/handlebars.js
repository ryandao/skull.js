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
