$('document').ready(function() {
console.log("d");
  Skull.History.prototype.root = "/test/index.html/";

  App = Skull.Application.create();

  App.IndexRoute = Skull.Route.extend({
    execute: function() {
      App.router.navigate('movies');
    }
  });
  App.oauth = new function() {
    var clientId = '73e47de1d3c355f9d99ecc2fea99ebb3';
    var clientSecret = '265e4e4f2ed3c5e10b9208d4ded915c7';
    //var redirectUrl = encodeURIComponent(window.location.origin + '/#oauth/callback');
    var redirectUrl = encodeURIComponent('http://localhost/skulljs/test/index.html#movies/645/#oauth/callback');
    this.authorize = function() {
      var oauthUrl = 'https://cs3213.herokuapp.com/oauth/new?client_id=' + clientId
                     + '&client_secret=' + clientSecret
                     + '&redirect_uri=' + redirectUrl;

      // Save the current route so we can come back later
      //localStorage.setItem('currentRoute', Backbone.history.fragment);
      window.location = oauthUrl;
    };

    this.getAccessToken = function(code, callback) {
      var postUrl = 'https://cs3213.herokuapp.com/oauth/token.json';
      var data = {
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      };

      $.ajax({
        url: postUrl,
        type: 'POST',
        data: data,

        success: function(data) {
          if (data.access_token) {
            callback(data.access_token);
          } else {
            console.log(data);
          }
        },

        error: function(error) {
          console.log(error);
        }
      });
    };
  }();
  // Model
  App.Movie = Skull.Model.extend({
    url: function() {
      return 'http://cs3213.herokuapp.com/movies.json'
    },

    recordUrl: function(id) {
      return 'http://cs3213.herokuapp.com/movies/' + id + '.json';
    }
  });
  App.Review = Skull.Model.extend({
    url: function() {
      return 'http://cs3213.herokuapp.com/movies/' + this.movie_id + '/reviews.json';
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

    previousPage: function() {
      console.log("haha");

      if(this.pageNum == 1)
        return;
      this.set('pageNum', this.pageNum - 1);

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

    deleteMovie: function(e) {
      e.preventDefault();

      if (! App.oauth.access_token) {
        App.oauth.authorize();
        return;
      }

      var _this = this;
      $.ajax({
        url: 'http://cs3213.herokuapp.com/movies/' + this.movie_id + '.json',
        type: 'DELETE',
        data: {
          access_token: App.oauth.access_token
        },

        success: function(data) {
          //_this.movies.remove(_this.movies.get(_this.movie.id));
          _this.router.navigate('movies');
          alert("Deleted!");
        },

        error: function() {
          alert('You cannot delete this movie!');
        }
      })
    },

    addReview: function(e) {
      e.preventDefault();

      if (! App.oauth.access_token) {
        App.oauth.authorize();
        return;
      }

      var _this = this;
      _this.isAddingReview = true;
      $('#new-review-form').ajaxSubmit({
        url: 'http://cs3213.herokuapp.com/movies/' + this.movie_id + '/reviews.json',
        type: 'POST',
        data: {
          access_token: "sdadsas"//Hw2.oauth.access_token
        },

        success: function(data) {
          var review = new App.Review(data);
          _this.reviews.add(review);
          _this.isAddingReview = false;
        },

        error: function(error) {
          _this.isAddingReview = false;
          alert("Incorrect access token");
        }
      });
    },

    deleteReview: function(review_id) {

      if (! App.oauth.access_token) {
        App.oauth.authorize();
        return;
      }

      var _this = this;
      $.ajax({
        url: 'http://cs3213.herokuapp.com/movies/' + _this.movie_id + '/reviews/' + review_id + '.json',
        type: 'DELETE',
        data: {
          access_token: App.oauth.access_token
        },

        success: function(data) {
          _this.reviews.remove(_this.reviews.get(review_id));
        },

        error: function(error) {
          if (error.status == 401) {
            alert("You don't have permission to do this");
          }
        }
      })
    }
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
