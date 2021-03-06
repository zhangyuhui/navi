/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Ember from 'ember';
import ReportView from 'navi-reports/routes/reports/report/view';

export default ReportView.extend({
  /**
   * @property {Object} parentModel - object containing request to view
   */
  parentModel: Ember.computed(function() {
    return this.modelFor('dashboards.dashboard.widgets.widget');
  }).volatile()
});
