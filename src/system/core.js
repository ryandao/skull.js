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

// Make sure we have Prototype included
if (typeof Prototype === 'undefined') {
  throw new Error("Skull.js requires Prototype > 1.6.0");
}

/**
  A collection of class methods that are available for all classes in Skull.
  It contains core methods like extend() and create() which are copied to
  the constructors of all classes.
*/
Skull.ClassMixin = (function() {
  this.classMethods = {
    /**
      Create a new "class" that extends the current "class". For example:

        var Person = Skull.Object.extend({
          say: function() {
            console.log("Hello");
          }
        });

      The custom arguments are added to the prototype of the subclass.
      All instances of the subclass have access to the custom arguments.
    */
    extend: function() {
      var subclass = Class.create(this, arguments[0]);
      this.ClassMixin.apply(subclass);

      return subclass;
    },

    /**
      Create a new "instance" of the current class
    */
    create: function() {
      var instance = new this();
      if (arguments.length > 0 && typeof arguments === 'object') {
        Object.extend(instance, arguments[0]);
      }

      return instance;
    }
  };

  /**
    Apply the mixin to a given class.
    Keep a reference to the mixin in the class for later use.
  */
  this.apply = function(aClass) {
    Object.extend(aClass, this.classMethods);
    aClass.ClassMixin = this;
  };

  return this;
})();

/**
  The core object for all objects to inherit from
*/
Skull.Object = Class.create({

});

/**
  Apply the ClassMixin to Skull.Object
*/
Skull.ClassMixin.apply(Skull.Object);