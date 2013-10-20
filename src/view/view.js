Skull.View = Skull.Object.extend({
  templateId: '',

  reRender: function() {
    this.render();
  }.observes('all'),

  initialize: function() {
    this.__scriptEl__ = $('#' + this.get('templateId'));
    this.render();
    return this;
  },

  render: function() {
    var source = this.__scriptEl__.html();
    var template = Handlebars.compile(source);
    var html = template({
      view: this,
      controller: this.get('controller')
    });
    var el = $(document.createElement('div')).append(html);

    if (this.$) {
      this.$.replaceWith(el);
    } else {
      this.__scriptEl__.replaceWith(el);
    }

    this.$ = el;
    this.setupHandler();

    return this;
  },

  /**
    Setup the action handlers for the view's element.
    Currently only click event is supported. Other
    events will be added later.
  */
  setupHandler: function(event, eventName) {
    this.$.on('click', '[data-skull-action]', function(event) {
      var actionId = $(event.currentTarget).attr('data-skull-action');
      var action = Skull.ActionHelper.actions[actionId];
      var handler = action.handler;

      if (action.eventName === 'click') {
        handler(event);
      }
    });
  }
});