/**
 * History API for SkullJS.
 * Currently it only supports `pushState`.
 * TODO: Add `onHashChange` API if `pushState` is not available.
 */
Skull.History = Skull.Object.extend({
  root: '/',
  fragment: '',

  initialize: function() {
    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }

    this.start();
  },

  // Start the History operations.
  start: function() {
    // Make sure pushState is available
    if (! this.history.pushState) {
      throw new Error("Skull History currently supports only pushState. Make sure your browser has pushState enabled");
    }

    var _this = this;
    $(window).on('popstate', function() {
      _this.checkUrl();
    });
  },

  getFragment: function() {
    var fragment = this.location.pathname;

    return this.normalizeFragment(fragment);
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
    fragment = this.fragment = this.normalizeFragment(fragment);
    this.sendEvent('url:changed');
  },

  // Navigate to a particular route
  navigate: function(fragment) {
    var url = this.root + this.normalizeFragment(fragment);

    this.history.pushState({}, document.title, url);
    this.loadUrl(fragment);
  }
});

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
    var routeClass = this.routeMapping[fragment];

    if (routeClass) {
      this.currentRoute = routeClass.create();
    } else {
      return false;
    }
  },

  // Proxy to History `navigate`
  navigate: function(fragment) {
    this.history.navigate(fragment);
  }
});
