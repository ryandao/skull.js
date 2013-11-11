$('document').ready(function() {
  Skull.History.prototype.root = "/test/index.html/";

  App = Skull.Application.create();

  App.IndexRoute = Skull.Route.extend({
    execute: function() {
      App.router.navigate('movies');
    }
  });

  // Model
  App.Movie = Skull.Model.extend({
    url: function() {
      return 'http://cs3213.herokuapp.com/movies.json';
    },

    recordUrl: function(id) {
      return 'http://cs3213.herokuapp.com/movies/' + id + '.json';
    }
  });

  App.Review = Skull.Model.extend({
    url: function() {
      return 'http://cs3213.herokuapp.com/movies/' + this.movie_id + '/reviews.json';
    }
  })
  // End Model

  // Movie index
  App.MoviesController = Skull.Controller.extend({
    isLoading: true,
    pageTitle: 'CS3213Movies',
    pageNum: 1,

    nextPage: function() {
      this.set('pageNum', this.pageNum + 1);
    },

    movePage: function() {
      this.set('isLoading', true);
      this.set('movies', App.store.findQuery(App.Movie, { page: this.pageNum }));
    }.observes('pageNum'),

    updateMoviesObserver: function() {
      var controller = this;
      this.movies.addObserver('isLoaded', function() {
        controller.set('isLoading', ! this.isLoaded);
      });
    }.observes('movies'),

    initialize: function() {
      this.set('movies', App.store.find(App.Movie));

      var controller = this;
      this.movies.addObserver('isLoaded', function() {
        controller.set('isLoading', ! this.isLoaded);
      });
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

  // End Movie index

  // Movie view
  App.MovieController = Skull.Controller.extend({
    movie_id: Skull.P,
    isLoadingMovie: true,
    isLoadingReviews: true,

  });

  App.MovieView = Skull.View.extend({
    rootEl: '#wrapper',
    templateId: 'movie_view'
  });

  App.MovieViewRoute = Skull.Route.extend({
    controllerClass: App.MovieController,
    viewClass: App.MovieView,

    execute: function(movie_id) {
      var record = App.store.find(App.Movie, movie_id);
      var route = this;

      this.controller.set('movie', record);
      this.controller.set('movie_id', movie_id);

      // Hack to pass movie_id to review model class
      var controller = this.controller;
      App.Review.prototype.movie_id = movie_id;
      this.controller.set('reviews', App.store.find(App.Review));
      this.controller.reviews.addObserver('isLoaded', function() {
        controller.set('isLoadingReviews', ! this.isLoaded);
      });

      record.recordDidLoad = function() {
        controller.set('isLoadingMovie', false);
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
