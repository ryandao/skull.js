if (typeof Skull === 'undefined') {
  // Create the core namespace object
  Skull = {};
}

/**
  A placeholder object used for any property that will be
  defined later on. For example:

    var MyClass = Skull.Object.extend({
      test: Skull.P
    });

    var myObj = MyClass.create({
      test: function() {
        console.log("Test");
      }
    });
*/
Skull.P = function() {
  return this;
}

// TODO: Make sure we have prototype included
Skull.Object = Class.create({

});

/**
  Use Prototype API to define the set of custom methods
  Skull.Object will have. All the subclasses of Skull.Object
  will inherit the methods defined here.
*/
Object.extend(Skull, {
  /**
    Create a new subclass of this current class.
  */
  extend: function() {
    return Class.create(this, arguments);
  },

  /**
    Create a new instance of the current class
  */
  create: function() {

  },

  /**
    A function that has will be called when a new instance is created.
    It is useful for custom setup for the instance. For example:

      var MyClass = Skull.Object.extend({
        initialize: function() {
          this.test = "test";
        }
      })
  */
  initialize: function() {

  }
})
/**
  Alias for Protottype class extension
*/
Skull.extend = function() {
  return Class.create(this, arguments);
}