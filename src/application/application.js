Skull.Application = Skull.Object.extend({
  initialize: function() {
    this.router =  Skull.Router.create();
    this.store = Skull.Store.create();
  },

  start: function() {
    this.router.history.start();
  }
});
