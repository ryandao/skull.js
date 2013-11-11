Skull.Store = Skull.Object.extend({
  find: function(modelClass, id) {
    if (typeof id === 'undefined') {
      return this.findAll(modelClass);
    } else {
      var url = modelClass.prototype.recordUrl(id);
      var promise = $.ajax({
        url: url
      });

      return Skull.Record.create({
        promise: promise
      });
    }
  },

  findAll: function(modelClass) {
    return Skull.RecordArray.create({
      promise: $.ajax({
        url: modelClass.prototype.url
      })
    });
  },

  findQuery: function(modelClass, query) {
    return Skull.RecordArray.create({
      promise: $.ajax({
        url: modelClass.prototype.url,
        data: query
      })
    });
  }
});
