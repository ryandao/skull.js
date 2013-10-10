skull.js
========

Lightweight Javascript MVC framework

**Sample usage**

    App = Ramaze.Application.create();

    App.Router.define({
      '/movies': 'App.MoviesIndexRoute'
    })

    App.MoviesIndexRoute = Ramaze.Route.extend({
      controller: 'App.Router.MoviesIndexController',
      view: 'App.Router.MoviesIndexView'

      // Apply naming convention to set up controller and view by default
    });

    App.MoviesIndexController = Ramaze.Controller.extend({
      initialize: function() {
        this.set('movies', App.Movie.find());
      }
      
      movieClick: function(movie) {

      }
    })

    App.MoviesIndexView = Ramaze.View.extend({
      templateName: 'movies_index'
    })

    // movies_index.handlebars
    {{#each movie in controller.movies}}
      // Display movies
      <a {{action 'movieClick' movie}}>click</a>
    {{/each}}

    // When the route is called, create an instance of route, controller, and view

    App.Movie = Ramaze.Model.extend({
      title: 'string',
      rating: 'number'
    })
