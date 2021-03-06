import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from '../helpers/start-app';
import { teardownModal } from '../helpers/teardown-modal';
import Mirage from 'ember-cli-mirage';

let Application, OriginalLoggerError, OriginalTestAdapterException;

module('Acceptance | Report Collections', {
  beforeEach: function() {
    Application = startApp();
    wait();
  },

  afterEach: function() {
    teardownModal();
    server.shutdown();
    Ember.run(Application, 'destroy');
  }
});

test('report-collection success', function(assert) {
  assert.expect(2);

  visit('/reportCollections/1');
  andThen(function() {
    assert.notOk(!!find('.error').length, 'Error message not present when route is successfully loaded');

    assert.ok(
      !!find('.navi-collection').length,
      'the report collection component is rendered when route is successfully loaded'
    );
  });
});

test('report-collection error', function(assert) {
  assert.expect(2);

  // Allow testing of errors - https://github.com/emberjs/ember.js/issues/11469
  OriginalLoggerError = Ember.Logger.error;
  OriginalTestAdapterException = Ember.Test.adapter.exception;
  Ember.Logger.error = function() {};
  Ember.Test.adapter.exception = function() {};

  server.get('/reportCollections/:id', () => {
    return new Mirage.Response(500);
  });

  visit('/reportCollections/1');
  andThen(function() {
    assert.ok(!!find('.error').length, 'Error message is present when route encounters an error');

    assert.notOk(!!find('.navi-collection').length, 'Navi report collection component is not rendered');

    Ember.Logger.error = OriginalLoggerError;
    Ember.Test.adapter.exception = OriginalTestAdapterException;
  });
});

test('report-collection link', function(assert) {
  assert.expect(1);
  visit('/reportCollections/1');
  andThen(function() {
    click('.navi-collection table > tbody > tr > td > a');
    andThen(function() {
      const urlRe = /\/reports\/\d+\/view/;
      assert.ok(urlRe.test(currentURL()), 'Navigate to the report when link is clicked');
    });
  });
});

test('report-collection loading', function(assert) {
  assert.expect(1);

  visit('/reportCollections/loading');

  andThen(function() {
    assert.ok(!!find('.navi-loader__container').length, 'Loader is present when visiting loading route');
  });
});
