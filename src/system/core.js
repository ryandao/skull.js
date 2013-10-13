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
  Return a collection of class methods that are available for all classes in Skull.
  It contains core methods like extend() and create() which are copied to
  the constructors created using extend() itself.
*/
var classMethods = function() {
  return {
    extend: function() {
      var subclass = Class.create(this, arguments[0]);
      Object.extend(subclass, classMethods());

      return subclass;
    },

    create: function() {
      var instance = new this();
      if (arguments.length > 0 && typeof arguments === 'object') {
        Object.extend(instance, arguments[0]);
      }

      return instance;
    }
  }
};

/**
  Add the class methods to Skull.Object.
*/
Object.extend(Skull.Object, classMethods());