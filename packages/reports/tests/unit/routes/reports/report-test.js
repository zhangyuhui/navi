import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';

const { get } = Ember;

moduleFor('route:reports/report', 'Unit | Route | reports/report', {
  needs: [
    'service:navi-notifications',
    'service:update-report-action-dispatcher',
    'service:user',
    'service:navi-visualizations'
  ]
});

test('model hook', function(assert) {
  assert.expect(2);

  const localReports = [
      {
        id: undefined,
        tempId: '123-456'
      }
    ],
    webserviceReports = [
      {
        id: 1
      }
    ];

  let route = this.subject({
    store: {
      findRecord: (type, id) => Ember.A(webserviceReports).findBy('id', id),
      peekAll: () => localReports
    },
    user: {
      findOrRegister: () => Ember.RSVP.resolve()
    },
    _defaultVisualization: report => report
  });

  return route.model({ report_id: 1 }).then(model => {
    assert.equal(model.id, 1, 'Route model looks up report based on id');

    return route.model({ report_id: '123-456' }).then(model => {
      assert.equal(model.tempId, '123-456', 'Route can find reports based on temp id');
    });
  });
});

test('_findByTempId', function(assert) {
  assert.expect(2);

  let route = this.subject({
    store: {
      peekAll() {
        return [{ tempId: 1 }, { tempId: 2 }, { tempId: 3 }];
      }
    }
  });

  assert.equal(route._findByTempId(2).tempId, 2, 'Reports can be found by temp id');

  assert.equal(route._findByTempId(50), undefined, 'Undefined is returned when no report has the given temp id');
});

test('_defaultVisualization', function(assert) {
  assert.expect(2);

  let mockReport = {
      visualization: null
    },
    route = this.subject({
      store: {
        createFragment: type => {
          return { type };
        }
      }
    });

  assert.deepEqual(
    route._defaultVisualization(mockReport).visualization,
    { type: 'table' },
    'Default visualization is set for null value in visualization'
  );

  let visualization = {
    type: 'line-chart'
  };
  mockReport.visualization = visualization;

  assert.deepEqual(
    route._defaultVisualization(mockReport).visualization,
    visualization,
    'Default visualization is not set for types already present in visualization'
  );
});

test('revertChanges action', function(assert) {
  assert.expect(1);

  let mockReport = {
      rollbackAttributes() {
        assert.ok(true, 'Report model is asked to rollback');
      }
    },
    route = this.subject();

  route.send('revertChanges', mockReport);
});

test('deactivate method', function(assert) {
  assert.expect(1);

  let mockReport = {
      hasDirtyAttributes: true,
      rollbackAttributes() {
        assert.ok(true, 'Route model is asked to rollback');
      }
    },
    route = this.subject({
      currentModel: mockReport,
      routeName: 'reports.report'
    });

  /* == Transition to different route == */
  route.deactivate();
});

test('saveReport action', function(assert) {
  assert.expect(2);

  let savePromise = Ember.RSVP.reject(),
    mockReport = {
      save: () => savePromise
    },
    mockNotificationService = {},
    route = this.subject({
      naviNotifications: mockNotificationService,
      replaceWith: () => null // Functionality covered in acceptance test
    });

  return Ember.run(() => {
    /* == Error save == */
    mockNotificationService.add = ({ type }) => {
      assert.equal(type, 'danger', 'Danger notification is shown when save was unsuccesful');
    };

    route.send('saveReport', mockReport);

    return savePromise.catch(() => {
      /* == Succesful save == */
      mockNotificationService.add = ({ type }) => {
        assert.equal(type, 'success', 'Success notification is shown when save was succesful');
      };
      savePromise = Ember.RSVP.resolve();

      route.send('saveReport', mockReport);
      return savePromise;
    });
  });
});

test('updateTitle action', function(assert) {
  assert.expect(2);

  let mockReport = {
      title: 'Default Title'
    },
    route = this.subject({
      currentModel: mockReport
    });

  assert.equal(get(route, 'currentModel.title'), 'Default Title', '`Default Title` is the current report title');

  route.send('updateTitle', 'Edited Title');

  assert.equal(get(route, 'currentModel.title'), 'Edited Title', 'Title of the report is updated with `Edited Title`');
});
