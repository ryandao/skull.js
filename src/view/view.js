Skull.View = Skull.Object.extend({
  templateName: Skull.P,

  initialize: function() {
    var source = $(this.templateName).html();
    var template = Handlebars.compile(source);
  }
});