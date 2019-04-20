import { resolve } from 'rsvp';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import { Response } from 'ember-cli-mirage';

let Route;

const mockModelFor = currentDashboard => {
  return { currentDashboard };
};

module('Unit | Route | dashboards/dashboard', function(hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    await this.owner.lookup('service:bard-metadata').loadMetadata();
    Route = this.owner.lookup('route:dashboards/dashboard');
  });

  test('it exists', function(assert) {
    assert.expect(1);
    assert.ok(Route, 'Route Exists');
  });

  test('model', async function(assert) {
    assert.expect(4);

    await run(async () => {
      const params = { dashboard_id: '1' };
      const modelPromise = Route.model(params);

      assert.ok(modelPromise.then, 'Route returns a promise in the model hook');

      const dashboard = await modelPromise;
      assert.equal(dashboard.id, params.dashboard_id, 'The requested dashboard is retrieved');

      assert.equal(dashboard.get('title'), 'Tumblr Goals Dashboard', 'The requested dashboard is retrieved');

      const widgets = await dashboard.get('widgets');
      assert.deepEqual(
        widgets.map(w => w.id),
        ['1', '2', '3'],
        'The requested dashboard is retrieved with the three widgets'
      );
    });
  });

  test('currentDashboard', function(assert) {
    assert.expect(1);

    const model = {};

    Route.reopen(mockModelFor(model));

    assert.equal(Route.currentDashboard, model, 'currentDashboard returns the dashboard in the current model object');
  });

  test('_updateLayout', function(assert) {
    assert.expect(2);

    const dashboard = {
      presentation: {
        layout: [
          { widgetId: 1, column: 0, row: 0, height: 4, width: 4 },
          { widgetId: 2, column: 0, row: 4, height: 3, width: 3 },
          { widgetId: 3, column: 1, row: 7, height: 3, width: 9 }
        ]
      }
    };
    Route.reopen(mockModelFor(dashboard));

    Route._updateLayout([{ id: 1, x: 1, y: 1, height: 3, width: 1 }, { id: 2, x: 2, y: 4, height: 4, width: 5 }]);

    const expectedLayout = [
      { widgetId: 1, column: 1, row: 1, height: 3, width: 1 },
      { widgetId: 2, column: 2, row: 4, height: 4, width: 5 },
      { widgetId: 3, column: 1, row: 7, height: 3, width: 9 }
    ];

    const actualLayout = Route.currentDashboard.presentation.layout;

    assert.deepEqual(actualLayout, expectedLayout, '_updateLayout successfully updated the dashboard layout');

    Route._updateLayout();

    assert.deepEqual(
      actualLayout,
      expectedLayout,
      '_updateLayout does not update the dashboard layout when not passed arguments'
    );
  });

  test('_saveDashboardFn', async function(assert) {
    assert.expect(1);

    const dashboard = {
      save: () => resolve()
    };

    Route.reopen(mockModelFor(dashboard));
    await Route._saveDashboardFn();
    assert.ok(true, '_saveDashboardFn saves dashboard model when user can edit');
  });

  test('didUpdateLayout - user can edit', async function(assert) {
    assert.expect(1);

    const currentDashboard = {
      canUserEdit: true,
      save: () => resolve()
    };

    Route.reopen({
      _updateLayout() {
        return;
      },

      currentDashboard,

      _saveDashboardFn() {
        assert.ok(true, '_saveDashboardFn method is called when user can edit');
      }
    });

    Route.send('didUpdateLayout', undefined, [1, 2]);
    await settled();
  });

  test('didUpdateLayout - user cannot edit', async function(assert) {
    assert.expect(1);

    const currentDashboard = { canUserEdit: false };
    Route.reopen({
      _updateLayout() {
        return;
      },

      currentDashboard,

      _saveDashboardFn() {
        assert.ok(false, 'Error: _saveDashboardFn method when user cannot edit');
      }
    });

    Route.send('didUpdateLayout', undefined, [1, 2]);
    assert.ok(true, '_saveDashboardFn method is not called');
    await settled();
  });

  test('delete widget - success', async function(assert) {
    assert.expect(5);

    await run(async () => {
      const dashboard = await Route.store.findRecord('dashboard', 1);
      const naviNotifications = {
        add({ message }) {
          assert.equal(
            message,
            'Widget "Mobile DAU Graph" deleted successfully!',
            'A notification is sent containing the widget title'
          );
        }
      };

      Route.reopen(mockModelFor(dashboard), {
        naviNotifications,

        _saveDashboardFn() {
          assert.ok(true, 'Dashboard is saved after layout update');
        },
        transitionTo(route) {
          assert.equal(route, this.routeName, 'After deleting a widget, user is transitioned out of any child route');
        }
      });

      const widgets = await dashboard.get('widgets');
      const originalWidgetCount = widgets.length;

      Route.send('deleteWidget', Route.store.peekRecord('dashboard-widget', 2));

      await settled();
      assert.equal(dashboard.widgets.length, originalWidgetCount - 1, 'Dashboard has one less widget after a delete');

      assert.equal(
        dashboard.presentation.layout.find(w => w.widgetId === 2),
        undefined,
        'Dashboard layout no longer has reference to deleted widget'
      );
    });
  });

  test('delete widget - failure', async function(assert) {
    assert.expect(3);

    //Mock Server Endpoint
    server.delete('/dashboards/:id/widgets/:widget_id', () => new Response(500));

    await run(async () => {
      const dashboard = await Route.store.findRecord('dashboard', 1);
      const naviNotifications = {
        add({ message }) {
          assert.equal(
            message,
            'OOPS! An error occurred while deleting widget "Mobile DAU Graph"',
            'A notification is sent containing the widget title'
          );
        }
      };
      Route.reopen(mockModelFor(dashboard), { naviNotifications });

      const widgets = await dashboard.get('widgets');
      const originalWidgetCount = widgets.length;

      Route.send('deleteWidget', Route.store.peekRecord('dashboard-widget', 2));

      await settled();
      assert.equal(
        dashboard.widgets.length,
        originalWidgetCount,
        'Dashboard still has all widgets after a failed delete'
      );

      assert.notEqual(
        dashboard.presentation.layout.find(w => w.widgetId === 2),
        undefined,
        'Dashboard layout still has reference to widget after a failed delete'
      );
    });
  });
});
