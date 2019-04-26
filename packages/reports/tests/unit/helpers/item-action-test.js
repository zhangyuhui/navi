import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setOwner } from '@ember/application';
import ActionConsumer from 'navi-core/consumers/action-consumer';

let Container;

module('Unit | Helper | item action', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    Container = this.owner;
  });

  test('item action', function(assert) {
    assert.expect(4);

    Container.register(
      'consumer:item',
      ActionConsumer.extend({
        send(actionType, ...params) {
          assert.equal(actionType, 'deleteItem', 'consumer receives the correct action from the item-action helper');

          assert.deepEqual(
            params,
            [{ title: 'Report' }],
            'consumer receives the correct params from the item-action helper'
          );
        }
      })
    );

    let actionFactory = this.owner.lookup('helper:item-action');
    let actionHelper = new actionFactory();
    setOwner(actionHelper, this.owner);

    let action = actionHelper.compute([
      'DELETE_ITEM',
      {
        title: 'Report'
      }
    ]);

    assert.equal(typeof action, 'function', 'The helper returns a function that dispatches the desired action');

    action();

    assert.throws(
      () => actionHelper.compute(['Invalid']),
      /The action name "Invalid" is not a valid item action/,
      'An invalid action name throws an exception'
    );
  });
});
