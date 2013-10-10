skull.js
========

Lightweight Javascript MVC framework

**Sample usage**

    App = Skull.Application.create();

    App.Router.define({
      '/movies': 'App.MoviesIndexRoute'
    });

    App.MoviesIndexRoute = Skull.Route.extend({
      controller: 'App.Router.MoviesIndexController',
      view: 'App.Router.MoviesIndexView'

      // Apply naming convention to set up controller and view by default
    });

    App.MoviesIndexController = Skull.Controller.extend({
      initialize: function() {
        this.set('movies', App.Movie.find());
      }
      
      movieClick: function(movie) {

      }
    });

    App.MoviesIndexView = Skull.View.extend({
      templateName: 'movies_index'
    })

    // movies_index.handlebars
    {{#each movie in controller.movies}}
      // Display movies
      <a {{action 'movieClick' movie}}>click</a>
    {{/each}}

    // When the route is called, create an instance of route, controller, and view

    App.Movie = Skull.Model.extend({
      title: 'string',
      rating: 'number'
    })
    
**Architecture overview**

![image](https://drive.google.com/uc?export=download&id=0B0JvQixJ3vfKX0lESjExNWNaYmc)

