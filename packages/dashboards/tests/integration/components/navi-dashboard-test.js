import { run } from '@ember/runloop';
import { helper as buildHelper } from '@ember/component/helper';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import config from 'ember-get-config';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';

module('Integration | Component | navi dashboard', function(hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    const { owner } = this;

    owner.register('helper:route-action', buildHelper(() => () => {}), { instantiate: false });

    const dashboardModel = {
      title: 'Test Dashboard',
      isUserOwner: true,
      widgets: [1, 2],
      presentation: {
        version: 1,
        layout: [
          { column: 0, row: 0, height: 4, width: 3, widgetId: 1 },
          { column: 3, row: 0, height: 4, width: 6, widgetId: 2 },
          { column: 0, row: 5, height: 1, width: 1, widgetId: 123456 } // Test a widget that doesn't exist
        ],
        columns: 20
      },
      constructor: { modelName: 'dashboard' }
    };

    this.set('dashboardModel', dashboardModel);

    await owner.lookup('service:user').findUser();
    await owner.lookup('service:bard-metadata').loadMetadata();

    // Add some dashboard models to the store
    const store = owner.lookup('service:store');
    run(() => {
      store.createRecord('dashboard-widget', { id: 1, visualization: { type: 'table' } });
      store.createRecord('dashboard-widget', { id: 2, visualization: { type: 'table' } });
    });
  });

  test('it renders', async function(assert) {
    assert.expect(4);

    await render(hbs`{{navi-dashboard dashboard=dashboardModel}}`);

    assert.dom('.page-title').hasText(this.dashboardModel.title, 'Component renders header with dashboard title');

    assert
      .dom('.grid-stack .grid-stack-item')
      .exists({ count: 2 }, 'Component renders a grid-stack-item for each widget, ignoring ones that do not exist');

    assert
      .dom(findAll('.grid-stack .grid-stack-item')[1])
      .hasAttribute('data-gs-x', '3', 'Widget x position is based on layout');

    assert
      .dom(findAll('.grid-stack .grid-stack-item')[1])
      .hasAttribute('data-gs-width', '6', 'Widget width is based on layout');
  });

  test('widget data', async function(assert) {
    assert.expect(2);

    let dataForWidget = { 1: 'foo', 2: 'bar' };
    this.set('dataForWidget', dataForWidget);

    await render(hbs`{{navi-dashboard dashboard=dashboardModel dataForWidget=dataForWidget}}`);

    const { owner } = this;
    const components = owner.lookup('-view-registry:main');

    findAll('.navi-widget').forEach(el => {
      const emberId = el.getAttribute('id');
      const component = components[emberId].parentView;
      const { id } = component.model;
      const { data } = component;
      assert.equal(data, dataForWidget[id], 'widget gets matching model and data');
    });
  });

  test('dashboard export', async function(assert) {
    assert.expect(2);
    const originalFeatureFlag = config.navi.FEATURES.enableDashboardExport;

    config.navi.FEATURES.enableDashboardExport = true;
    await render(hbs`{{navi-dashboard dashboard=dashboardModel}}`);

    assert.dom('.action.export').isVisible('Dashboard export button should be visible');

    config.navi.FEATURES.enableDashboardExport = false;
    await render(hbs`{{navi-dashboard dashboard=dashboardModel}}`);
    assert.dom('.action.export').isNotVisible('Dashboard export button should not be visible');

    config.navi.FEATURES.enableDashboardExport = originalFeatureFlag;
  });

  test('dashboard schedule - config', async function(assert) {
    assert.expect(2);
    const originalFeatureFlag = config.navi.FEATURES.enableScheduleDashboards;

    config.navi.FEATURES.enableScheduleDashboards = true;
    await render(hbs`{{navi-dashboard dashboard=dashboardModel}}`);

    assert.dom('.action.schedule').isVisible('Dashboard schedule button should be visible');

    config.navi.FEATURES.enableScheduleDashboards = false;
    await render(hbs`{{navi-dashboard dashboard=dashboardModel}}`);
    assert.dom('.action.schedule').isNotVisible('Dashboard schedule button should not be visible');

    config.navi.FEATURES.enableScheduleDashboards = originalFeatureFlag;
  });

  test('dashboard schedule - isUserOwner', async function(assert) {
    assert.expect(1);

    this.set('dashboardModel.isUserOwner', false);

    await render(hbs`{{navi-dashboard dashboard=dashboardModel}}`);
    assert.dom('.action.schedule').isNotVisible('Dashboard schedule button should not be visible');
  });
});
