Skull.Route = Skull.Object.extend({
  setup: Skull.P,

  initialize: function() {
    if (typeof this.controllerClass !== 'undefined') {
      this.controller = this.controllerClass.create();
    }

    if (typeof this.viewClass !== 'undefined') {
      this.view = this.viewClass.create({ controller: this.controller });
    }

    return this;
  }
});
