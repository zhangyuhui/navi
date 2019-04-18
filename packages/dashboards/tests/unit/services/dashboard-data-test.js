import { run } from '@ember/runloop';
import { resolve } from 'rsvp';
import { get } from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import config from 'ember-get-config';

module('Unit | Service | dashboard data', function(hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    await this.owner.lookup('service:bard-metadata').loadMetadata();
  });

  test('fetch data for dashboard', function(assert) {
    assert.expect(2);

    let mockDashboard = {
      id: 1,
      widgets: resolve([1, 2, 3]),
      get(prop) {
        return this[prop];
      }
    };

    let service = this.owner.factoryFor('service:dashboard-data').create({
      // Skip the ws data fetch for this test
      fetchDataForWidgets: (id, widgets, decorators, options) => {
        //removing custom headers
        delete options.customHeaders;
        assert.deepEqual(
          options,
          { page: 1, perPage: 10000 },
          'Default pagination options are passed through for widget data fetch'
        );

        return widgets;
      }
    });

    return run(() => {
      return service.fetchDataForDashboard(mockDashboard).then(dataForWidget => {
        assert.deepEqual(dataForWidget, [1, 2, 3], 'widgetData is returned by `fetchDataForWidgets` method');
      });
    });
  });

  test('fetch data for widget', function(assert) {
    assert.expect(9);

    let service = this.owner.factoryFor('service:dashboard-data').create({
      _fetch(request) {
        // Skip the ws data fetch for this test
        return resolve(request);
      }
    });

    assert.deepEqual(service.fetchDataForWidgets(1, []), {}, 'no widgets returns empty data object');

    const makeRequest = data => {
      return {
        serialize: () => data
      };
    };

    let widgets = [
        { id: 1, requests: [makeRequest(1), makeRequest(2), makeRequest(3)] },
        { id: 2, requests: [makeRequest(4)] },
        { id: 3, requests: [] }
      ],
      data = service.fetchDataForWidgets(1, widgets);

    assert.deepEqual(Object.keys(data), ['1', '2', '3'], 'data is keyed by widget id');

    assert.ok(get(data, '1.isPending'), 'data uses a promise proxy');

    return settled().then(() => {
      assert.deepEqual(get(data, '1').toArray(), [1, 2, 3], 'data for widget is an array of request responses');

      /* == Decorators == */
      data = service.fetchDataForWidgets(1, widgets, [number => number + 1]);
      return settled().then(() => {
        assert.deepEqual(get(data, '1').toArray(), [2, 3, 4], 'each response is modified by the decorators');

        /* == Options == */
        let optionsObject = {
          page: 1
        };

        service.set('dashboardId', 1);
        service.set('_fetch', (request, options) => {
          assert.equal(options, optionsObject, 'options object is passed on to data fetch method');

          let uiViewHeaderElems = options.customHeaders.uiView.split('.');

          assert.equal(uiViewHeaderElems[1], 1, 'uiView header has the dashboard id');

          assert.equal(uiViewHeaderElems[3], 2, 'uiView header has the widget id');

          assert.ok(uiViewHeaderElems[2], 'uiView header has a random uuid attached to the end');
        });
        service.fetchDataForWidgets(1, [{ id: 2, requests: [makeRequest(4)] }], [], optionsObject);
      });
    });
  });

  test('_fetch', function(assert) {
    assert.expect(1);

    let service = this.owner.lookup('service:dashboard-data'),
      request = {
        logicalTable: {
          table: 'network',
          timeGrain: 'day'
        },
        metrics: [{ metric: 'adClicks' }],
        dimensions: [],
        filters: [],
        intervals: [
          {
            end: 'current',
            start: 'P7D'
          }
        ],
        bardVersion: 'v1',
        requestVersion: 'v1'
      },
      response = {
        rows: [
          {
            adClicks: 30
          },
          {
            adClicks: 1000
          },
          {
            adClicks: 200
          }
        ]
      };

    server.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
    server.get('data/network/day/', () => {
      return response;
    });

    return service._fetch(request).then(fetchResponse => {
      assert.deepEqual(fetchResponse.get('response.rows'), response.rows, 'fetch gets response from web service');
    });
  });

  test('_decorate', function(assert) {
    assert.expect(2);

    let service = this.owner.lookup('service:dashboard-data'),
      add = number => number + 5,
      subtract = number => number - 3;

    assert.equal(
      service._decorate([add, subtract], 1),
      3,
      'decorate calls each decorator function and passes the result to the next decorator'
    );

    assert.equal(service._decorate([], 1), 1, 'empty array of decorators has no effect');
  });
});
