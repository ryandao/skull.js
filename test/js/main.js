$('document').ready(function() {
console.log("d");
  Skull.History.prototype.root = "/test/index.html/";

  App = Skull.Application.create();

  App.IndexRoute = Skull.Route.extend({
    execute: function() {
      App.router.navigate('movies');
    }
  });

  // Model
  App.Movie = Skull.Model.extend({
    url: 'http://cs3213.herokuapp.com/movies.json',

    recordUrl: function(id) {
      return 'http://cs3213.herokuapp.com/movies/' + id + '.json';
    }
  });

  App.store = Skull.Store.create();
  // End Model

  // Movie index
  App.MoviesController = Skull.Controller.extend({
    pageTitle: 'CS3213Movies',
    pageNum: 1,

    nextPage: function() {
      this.set('pageNum', this.pageNum + 1);
    },

    movePage: function() {
      this.set('movies', App.store.findQuery(App.Movie, { page: this.pageNum }));
    }.observes('pageNum'),

    initialize: function() {
      this.set('movies', App.store.find(App.Movie));
    }
  });

  App.MoviesView = Skull.View.extend({
    templateId: 'movies',
    rootEl: '#wrapper'
  });

  App.MoviesRoute = Skull.Route.extend({
    controllerClass: App.MoviesController,
    viewClass: App.MoviesView
  });

  // End Moview index

  // Movie view
  App.MovieController = Skull.Controller.extend({

  });

  App.MovieView = Skull.View.extend({
    rootEl: '#wrapper',
    templateId: 'movie_view'
  });

  App.MovieViewRoute = Skull.Route.extend({
    controllerClass: App.MovieController,
    viewClass: App.MovieView,

    setup: function(movie_id) {
      // this.controller.set('movie', App.store.find(movie_id))
      // this.controller.set('movie', Skull.Object.create({
      //   title: "Batman Begins",
      //   img_url: "http://cs3213.s3.amazonaws.com/app/public/movies/imgs/000/000/342/square/green_latern2.jpeg?1379392544",
      //   score: "9.0",
      //   user: {
      //     username: "Ryan Dao"
      //   },
      // }));
    },

    execute: function(movie_id) {
      var record = App.store.find(App.Movie, movie_id);
      var route = this;
      this.controller.set('movie', record);

      record.recordDidLoad = function() {
        route.view.render();
      };
    }
  });
  // End Movie view

  App.router.define({
    '': App.IndexRoute,
    'movies': App.MoviesRoute,
    'movies/:id': App.MovieViewRoute
  });

  App.start();
});
