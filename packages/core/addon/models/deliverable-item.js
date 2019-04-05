/**
 * Copyright 2018, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

import DS from 'ember-data';
import { computed, get } from '@ember/object';

export default DS.Model.extend({
  deliveryRules: DS.belongsTo('deliveryRule', {
    async: false,
    inverse: 'deliveredItem'
  }),

  /**
   * @property {String} modelId - id or tempId of model
   */
  modelId: computed('id', 'tempId', function() {
    return get(this, 'id') || get(this, 'tempId');
  }),

  /**
   * @property {DS.Model} deliveryRuleForUser - delivery rule model
   */
  deliveryRuleForUser: computed('user', 'deliveryRules.[]', function() {
    return get(this, 'deliveryRules');
  }),

  /**
   * @returns {Promise} - resolves to when response from webservice is received
   */
  loadDeliveryRuleForUser() {
    let userId = get(get(this, 'user').getUser(), 'id');

    return this.store
      .query('deliveryRule', {
        filter: {
          'owner.id': userId,
          'deliveredItem.id': get(this, 'modelId'),
          deliveryType: get(this, 'constructor.modelName')
        }
      })
      .then(rules => {
        return rules[0] || null;
      });
  }
});
