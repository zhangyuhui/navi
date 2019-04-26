import Service from '@ember/service';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | reports/report/clone', function(hooks) {
  setupTest(hooks);

  test('_cloneReport', function(assert) {
    assert.expect(3);

    return run(() => {
      const store = this.owner.lookup('service:store'),
        mockAuthor = store.createRecord('user', { id: 'Gannon' });

      this.owner.register(
        'service:user',
        Service.extend({
          getUser: () => mockAuthor
        })
      );

      const route = this.owner.lookup('route:reports/report/clone'),
        originalReport = {
          title: 'Twilight Princess',
          author: 'Wolf Link',
          request: {
            responseFormat: 'json'
          },
          clone() {
            return Object.assign({}, this);
          }
        },
        clonedReport = route._cloneReport(originalReport);

      assert.equal(
        clonedReport.title,
        `Copy of ${originalReport.title}`,
        'Cloned report title is "Copy of" + original title'
      );

      assert.equal(
        clonedReport.request.responseFormat,
        'csv',
        'Response format is defaulted to csv, regardless of original report'
      );

      assert.equal(clonedReport.author, mockAuthor, 'Current user is the author of the cloned report');
    });
  });
});
