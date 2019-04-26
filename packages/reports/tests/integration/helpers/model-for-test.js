import { run } from '@ember/runloop';
import Route from '@ember/routing/route';
import { set } from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

let route;

module('Integration | Helper | model for', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    let controller = {};
    this.owner.register('route:mock-route', Route.extend({ controller }));
    route = this.owner.lookup('route:mock-route');
  });

  test('modelFor', async function(assert) {
    assert.expect(2);

    set(route, 'controller.model', 'foo');
    await render(hbs`<span>{{model-for 'mock-route'}}</span>`);
    assert.dom('span').hasText('foo', "model-for helper returned the route's model");

    run(() => set(route, 'controller.model', 'bar'));
    assert.dom('span').hasText('bar', "model-for helper recomputes when the route's model changes");
  });

  test('modelFor - missing route', async function(assert) {
    assert.expect(1);

    await render(hbs`<span>{{model-for 'missing-route'}}</span>`);
    assert.dom('span').hasText('', 'model-for helper returns undefined when route does not exist');
  });
});
