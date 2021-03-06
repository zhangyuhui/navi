/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import ActionConsumer from 'navi-core/consumers/action-consumer';
import Ember from 'ember';
import { RequestActions } from 'navi-reports/services/request-action-dispatcher';

const { inject, get, set } = Ember;

export default ActionConsumer.extend({
  /**
   * @property {Ember.Service} requestActionDispatcher
   */
  requestActionDispatcher: inject.service(),

  actions: {
    /**
     * @action UPDATE_TABLE
     * @param {Object} route - route that has a model that contains a request property
     * @param {String} table - name of the new table
     */
    [RequestActions.UPDATE_TABLE](route, table) {
      let currentModel = get(route, 'currentModel'),
        oldTimeGrain = get(currentModel, 'request.logicalTable.timeGrain') || {
          name: ''
        }; // allow findBy to work when switching from an invalid table so switching to a valid table works

      set(currentModel, 'request.logicalTable.table', table);

      /*
       * Since timeGrain is tied to logicalTable, send a timeGrain update
       * and try to find a new time grain with the same name as the previous
       */
      let newTimeGrain =
        Ember.A(get(table, 'timeGrains')).findBy('name', oldTimeGrain.name) || get(table, 'timeGrains.0');
      get(this, 'requestActionDispatcher').dispatch(RequestActions.ADD_TIME_GRAIN, route, newTimeGrain);
    }
  }
});
