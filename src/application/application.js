Skull.Application = Skull.Object.extend({
  initialize: function() {
    this.router =  Skull.Router.create();
  },

  start: function() {
    this.router.history.start();
  }
});
