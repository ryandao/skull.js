Skull.Model = Skull.Object.extend({
  url: Skull.P,
});

Skull.RecordArray = Skull.ArrayProxy.extend({
  isLoaded: false,

  initialize: function() {
    var _this = this;

    if (typeof this.promise !== 'undefined') {
      this.promise.done(function(data) {
        _this.set('content', data);
        _this.set('isLoaded', true);
      });
    } else {
      this.set('isLoaded', true);
    }
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
  },

  /**
   * Add one or more records to the array.
   * The records can be a raw array, a single record.
   *
   * TODO: Add support for RecordArray as parameter.
   */
  add: function() {
    if (jQuery.isArray(arguments[0])) {
      this.set('content', this.content.concat(records));
    } else {
      this.content.push(records);
    }
  }
});
