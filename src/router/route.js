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
