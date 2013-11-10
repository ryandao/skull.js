Skull.Store = Skull.Object.extend({
  find: function(modelClass, id) {
    if (typeof id === 'undefined') {
      return this.findAll(modelClass);
    } else {
      var url = modelClass.prototype.url + "/" + id;

      $.ajax({
        url: url
      }).done(successCallback)
        .fail(failureCallback);
    }

    function successCallback(data) {
      console.log(data);
    }

    function failureCallback(data) {
      console.log(data);
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
