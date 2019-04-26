/**
 * Copyright 2019, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

import { A as arr } from '@ember/array';
import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';
import { get } from '@ember/object';
import config from 'ember-get-config';

export default {
  /**
   * @property {Array} _definitions - list of response formats
   */
  _definitions() {
    let defaultOperations = arr([
      {
        id: 'in',
        name: 'Equals',
        valuesComponent: 'filter-form/select-input'
      },
      {
        id: 'notin',
        name: 'Not Equals',
        valuesComponent: 'filter-form/select-input'
      },
      {
        id: 'null',
        name: 'Is Empty',
        valuesComponent: 'filter-form/null-input'
      },
      {
        id: 'notnull',
        name: 'Is Not Empty',
        valuesComponent: 'filter-form/null-input'
      }
    ]);
    if (get(config, 'navi.FEATURES.enableContains')) {
      defaultOperations.pushObject({
        id: 'contains',
        name: 'Contains',
        valuesComponent: 'filter-form/text-input'
      });
    }
    return defaultOperations;
  },

  /**
   * Gets all the response formats
   *
   * @method all
   */
  all() {
    return this._definitions();
  },

  /**
   * Gets a response format given an id
   *
   * @method getById
   * @param {String} id
   * @return {Object} - response format object
   */
  getById(id) {
    assert(`id: \`${id}\` should be of type string and non-empty`, typeOf(id) === 'string' && id !== '');
    return this._definitions().findBy('id', id);
  }
};
