Skull.ArrayProxy = Skull.Object.extend({
  content: Skull.P,

  forEach: function(callback) {
    return this.content.forEach(callback);
  }
});
