if (typeof Skull === 'undefined') {
  // Create the core namespace object
  Skull = {};
}

// TODO: Make sure we have prototype included
Skull.Object = Class.create({

});

// Alias for extending classes with Prototype
Skull.extend = function() {
  return Class.create(this, arguments);
}