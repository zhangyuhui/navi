/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { isEmpty } from '@ember/utils';

import { computed } from '@ember/object';
import { A } from '@ember/array';
import { all } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import DS from 'ember-data';
import _ from 'lodash';
import { v1 } from 'ember-uuid';

export default Service.extend({
  /**
   * @property {Ember.Service} bardFacts
   */
  bardFacts: service(),

  /**
   * @property {Ember.Service} store
   */
  store: service(),

  /**
   * @property {Object} widgetOptions - options for the fact request
   */
  widgetOptions: computed(function() {
    return {
      page: 1,
      perPage: 10000
    };
  }),

  /**
   * @method fetchDataForDashboard
   * @param {Object} dashboard - dashboard model
   * @returns {Promise} - Promise that resolves to a dashboard object with widget data
   */
  fetchDataForDashboard(dashboard) {
    return dashboard
      .get('widgets')
      .then(widgets => this.fetchDataForWidgets(dashboard.id, widgets, [], get(this, 'widgetOptions')));
  },

  /**
   * @method fetchDataForWidgets
   * @param {Array} widgets - list of widget models with requests to fetch
   * @param {Array} decorators - array of functions to modify each request
   * @param {Object} options - options for web service fetch
   * @returns {Object} hash of widget id to data promise array
   */
  fetchDataForWidgets(dashboardId, widgets = [], decorators = [], options = {}) {
    let result = {},
      uuid = v1();

    // Construct hash of widget id to data
    widgets.forEach(widget => {
      let widgetId = get(widget, 'id'),
        widgetDataPromises = get(widget, 'requests').map(request => {
          //construct custom header for each widget with uuid
          options.customHeaders = {
            uiView: `dashboard.${dashboardId}.${uuid}.${widgetId}`
          };

          request = this._decorate(decorators, request.serialize());

          return this._fetch(request, options);
        });

      result[get(widget, 'id')] = DS.PromiseArray.create({
        promise: all(widgetDataPromises).then(A) // PromiseArray expects an Ember array returned
      });
    });

    return result;
  },

  /**
   * @method _decorate
   * @private
   * @param {Array} decorators - array of functions to modify request
   * @param {Object} request - object to modify
   * @returns {Object} transformed version of request
   */
  _decorate(decorators, request) {
    if (isEmpty(decorators)) {
      return request;
    } else {
      return _.flow(...decorators)(request);
    }
  },

  /**
   * @method _fetch
   * @private
   * @param {Object} request - object to modify
   * @param {Object} options - options for web service fetch
   * @returns {Promise} response from request
   */
  _fetch(request, options) {
    return get(this, 'bardFacts').fetch(request, options);
  }
});
