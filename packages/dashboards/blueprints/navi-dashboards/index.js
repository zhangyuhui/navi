/**
 * Copyright 2019, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

var EOL = require('os').EOL;

module.exports = {
  description: 'Adding addons to project and update router js on install',

  normalizeEntityName: function() {}, // Required for `ember install` to run without error

  afterInstall: function() {
    /*jshint multistr: true */

    //misaligned here so that it aligns in the app correctly
    var routeInfo =
      "\tthis.route('dashboard-collections', function() { " +
      EOL +
      "\
  this.route('collection', {path:'/:collection_id'}); " +
      EOL +
      '\
});' +
      EOL +
      "\
this.route('print', function() { " +
      EOL +
      "\
  this.route('dashboards', function() { " +
      EOL +
      "\
    this.route('dashboard', { path: '/:dashboard_id' }, function() {" +
      EOL +
      "\
      this.route('view'); " +
      EOL +
      '\
    });' +
      EOL +
      '\
  });' +
      EOL +
      '\
});' +
      EOL +
      "\
this.route('dashboards', function() { " +
      EOL +
      "\
  this.route('new'); " +
      EOL +
      "\
  this.route('dashboard', { path: '/:dashboard_id' }, function() {" +
      EOL +
      "\
    this.route('clone'); " +
      EOL +
      "\
    this.route('view'); " +
      EOL +
      "\
    this.route('widgets', function() { " +
      EOL +
      "\
      this.route('add'); " +
      EOL +
      "\
      this.route('new'); " +
      EOL +
      "\
      this.route('widget', { path: '/:widget_id'}, function() { " +
      EOL +
      "\
        this.route('edit'); " +
      EOL +
      "\
        this.route('view'); " +
      EOL +
      '\
      }); ' +
      EOL +
      '\
    }); ' +
      EOL +
      '\
  });' +
      EOL +
      '\
});' +
      EOL;

    return this.insertIntoFile('app/router.js', routeInfo, {
      after: 'Router.map(function() {' + EOL
    });
  }
};
