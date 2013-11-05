Skull.Router = Skull.Object.extend({
  uris: {},

  define: function(){
    $.extend(uris, routes);
  }
});