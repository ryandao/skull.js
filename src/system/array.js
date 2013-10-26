Skull.ArrayProxy = Skull.Object.extend({
  forEach: function(callback) {
    this.content.forEach(function(entry) {
      if (entry.then) {
        entry.then(callback);
      } else {
        callback(entry);
      }
    })
  }
});