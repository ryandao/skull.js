/**
 * History API for SkullJS.
 * It uses either the `hashChange` or `pushState` API.
 * Specify the type of location API to be used via the `location` option.
 * By default it uses the `hashChange` API.
 */
Skull.History = Skull.Object.extend({
  locationType: 'hash',
  root: '/',
  fragment: '',

  initialize: function() {
    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }

    this.usePushState = this.locationType === 'history';
    this.useHashChange = this.locationType === 'hash';
  },

  // Start the History operations.
  start: function() {
    var _this = this;

    if (this.usePushState) {
      window.onpopstate = function() {
        _this.checkUrl();
      };
    } else if (this.useHashChange) {
      $(window).on('hashchange', function() {
        _this.checkUrl();
      });
    }

    return this.loadUrl();
  },

  getFragment: function() {
    var fragment;

    if (this.usePushState && ! this.useHashChange) {
      fragment = this.location.pathname;
    } else {
      fragment = this.getHash();
    }

    return this.normalizeFragment(fragment);
  },

  getHash: function() {
    var match = window.location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  },

  normalizeFragment: function(fragment) {
    var trailingSlash = /\/$/;
    var routeStripper = /^[#\/]|\s+$/g;
    var root = this.root.replace(trailingSlash, '');

    if (! fragment.indexOf(root)) {
      fragment = fragment.slice(root.length);
    }

    return fragment.replace(routeStripper, '');
  },

  // Check if the url is changed an call `loadUrl`
  checkUrl: function(e) {
    var current = this.getFragment();

    if (current !== this.fragment) {
      this.loadUrl(current);
    } else {
      return false;
    }
  },

  // Save the current fragment and notify all observers
  // of the change in url. Normally there's always one
  // observer which is the app router.
  loadUrl: function(fragment) {
    fragment = fragment || this.location.pathname;
    this.fragment = this.normalizeFragment(fragment);
    this.sendEvent('url:changed');
  },

  // Navigate to a particular route
  navigate: function(fragment) {
    var url = this.root + this.normalizeFragment(fragment);

    if (this.usePushState) {
      this.history.pushState({}, document.title, url);
    } else if (this.useHashChange) {
      this.location.hash = '#' + this.normalizeFragment(fragment);
    }
  }
});

/**
 * SkullJS Router.
 * Heavily inspired by Backbone Router.
 * By default each `Application` object will have a router
 * associated. Define the routes for the application by:
 *
 *     myApp.router.define({
 *       'users': myApp.UsersRoute
 *     })
 */
Skull.Router = Skull.Object.extend({
  currentRoute: Skull.P,
  routeMapping: {},

  initialize: function() {
    // Set up History API
    this.history = Skull.History.create();
    this.history.addListener('url:changed', this.urlChanged, this);
  },

  define: function(mapping) {
    this.routeMapping = mapping;
  },

  // Called when a url is changed in the History API.
  urlChanged: function() {
    this.loadRoute(this.history.fragment);
  },

  // Load the route associating to a url fragment.
  loadRoute: function(fragment) {
    var router = this;

    return $.each(this.routeMapping, function(route, routeClass) {
      route = (route instanceof RegExp) ? route : router._routeToRegExp(route);
      if (route.test(fragment) && routeClass) {
        var args = router._extractParameters(route, fragment);
        router.currentRoute = routeClass.create();
        router.currentRoute.setup(args);
        return true;
      }
    })
  },

  // Proxy to History `navigate`
  navigate: function(fragment) {
    this.history.navigate(fragment);
  },

  // Convert a route string into a regular expression, suitable for matching
  // against the current location hash.
  _routeToRegExp: function(route) {
    var optionalParam = /\((.*?)\)/g;
    var namedParam    = /(\(\?)?:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    route = route.replace(escapeRegExp, '\\$&')
                 .replace(optionalParam, '(?:$1)?')
                 .replace(namedParam, function(match, optional) {
                   return optional ? match : '([^\/]+)';
                 })
                 .replace(splatParam, '(.*?)');
    return new RegExp('^' + route + '$');
  },

  // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  _extractParameters: function(route, fragment) {
    var params = route.exec(fragment).slice(1);
    return params.map(function(param) {
      return param ? decodeURIComponent(param) : null;
    });
  }
});
