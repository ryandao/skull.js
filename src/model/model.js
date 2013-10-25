Skull.Model = Skull.Object.extend({
  url: Skull.P,
});

Skull.RecordArray = Skull.ArrayProxy.extend({
  initialize: function() {
    var _this = this;

    this.promise.done(function(data) {
      _this.set('content', data);
    });
  },

  forEach: function(callback) {
    if (typeof this.content === 'undefined') {
      this.addObserver('content', function() {
        this.content.forEach(callback);
      });
    } else {
      this.content.forEach(callback);
    }
  }
});