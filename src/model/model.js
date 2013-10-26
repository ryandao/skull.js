Skull.Model = Skull.Object.extend({
  url: Skull.P,
});

Skull.RecordArray = Skull.ArrayProxy.extend({
  isLoaded: false,

  initialize: function() {
    var _this = this;

    this.promise.done(function(data) {
      _this.set('content', data);
      _this.set('isLoaded', true);
    });
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
  }
});