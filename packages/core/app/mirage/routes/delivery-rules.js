import moment from 'moment';
import Response from 'ember-cli-mirage/response';
import RESPONSE_CODES from '../enums/response-codes';
import { getProperties } from '@ember/object';
import { camelize } from '@ember/string';

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const FILTER_REGEX = /^filter\[deliveryRules\.(.+?)\]$/;

export default function() {
  /**
   * deliveryrules/:id - GET endpoint to fetch deliveryrules by id
   */
  this.get('/deliveryRules/:id', function({ deliveryRules }, request) {
    let id = request.params.id,
      deliveryRule = deliveryRules.find(id);

    return deliveryRule;
  });

  /**
   * deliveryrules/ - GET endpoint to fetch many deliveryrules
   */
  this.get('/deliveryRules', function({ deliveryRules }, request) {
    let idFilter = request.queryParams['filter[deliveryRules.id]'];
    const filterKeys = Object.keys(request.queryParams).filter(key => key.startsWith('filter'));
    const filters = {};

    filterKeys.forEach(key => (filters[generateFilterKey(key)] = request.queryParams[key]));

    // Just filter on id if it's present
    if (idFilter) {
      let ids = idFilter.split(',');
      return deliveryRules.find(ids);
    }

    // Use other filters if there's no id filter
    if (filters) {
      //Need to transform values to strings before comparing
      const newFilterKeys = Object.keys(filters);

      return deliveryRules.where(rule => {
        const ruleProps = getProperties(rule, newFilterKeys);

        return newFilterKeys.every(key => ruleProps[key].toString() === filters[key]);
      });
    }

    return deliveryRules.all();
  });

  /**
   * deliveryrules/ - POST endpoint to add a new deliveryrule
   */
  this.post('/deliveryRules', function({ deliveryRules, db }) {
    let attrs = this.normalizedRequestAttrs(),
      deliveryRule = deliveryRules.create(attrs);

    // Init properties
    db.deliveryRules.update(deliveryRule.id, {
      createdOn: moment.utc().format(TIMESTAMP_FORMAT),
      updatedOn: moment.utc().format(TIMESTAMP_FORMAT)
    });

    return deliveryRule;
  });

  /**
   * deliveryrules/ - PATCH endpoint for an existing deliveryrule
   */
  this.patch('/deliveryRules/:id');

  /**
   * deliveryrules/ - DELETE endpoint to delete a deliveryrule by id
   */
  this.del('/deliveryRules/:id', function({ deliveryRules, users, reports, dashboards }, request) {
    let id = request.params.id,
      deliveryRule = deliveryRules.find(id),
      deliveredItemType = deliveryRule.deliveryType,
      deliveredItems = { reports, dashboards },
      deliveredItem = deliveredItems[`${deliveredItemType}s`].find(deliveryRule.deliveredItemId.id),
      user = users.find(deliveryRule.ownerId);

    if (!deliveryRule) {
      return new Response(RESPONSE_CODES.NOT_FOUND, {}, { errors: [`Unknown identifier '${id}'`] });
    }

    // Delete delivery rule from deliveredItem
    deliveredItem.update({
      deliveryRules: deliveredItem.deliveryRules.filter(id => id.toString() !== deliveryRule.id)
    });
    // Delete delivery rule from user
    user.update({
      deliveryRules: user.deliveryRules.filter(id => id.toString() !== deliveryRule.id)
    });

    deliveryRule.destroy();
    return new Response(RESPONSE_CODES.NO_CONTENT);
  });
}

/**
 * Camelize keys extracted from query params and
 * handle special case of deliveredItemId due to mirage storing
 * polymorphic model id's as an object by grabbing the id from the object
 * e.g."filter[deliveryRules.deliveredItem.id]" ==> "deliveredItemId.id"
 *
 * @param {String} key
 */
function generateFilterKey(key) {
  let camelCaseKey = camelize(FILTER_REGEX.exec(key)[1]);

  return camelCaseKey === 'deliveredItemId' ? 'deliveredItemId.id' : camelCaseKey;
}
