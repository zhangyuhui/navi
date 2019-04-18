import { find, click } from '@ember/test-helpers';
import { run } from '@ember/runloop';
import { get } from '@ember/object';
import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from '../helpers/start-app';
import Mirage from 'ember-cli-mirage';
import config from 'ember-get-config';

let Application, OriginalLoggerError, OriginalTestAdapterException;

module('Acceptance | Dashboards', function(hooks) {
  hooks.beforeEach(function() {
    Application = startApp();
    return wait();
  });

  hooks.afterEach(function() {
    server.shutdown();
    run(Application, 'destroy');
  });

  test('dashboard success', function(assert) {
    assert.expect(2);

    visit('/dashboards/1');
    assert.notOk(!!find('.error').length, 'Error message not present when route is successfully loaded');

    assert.ok(
      !!find('.navi-dashboard').length,
      'the dashboard collection component is rendered when route is successfully loaded'
    );
  });

  test('dashboard error', function(assert) {
    assert.expect(2);

    // Allow testing of errors - https://github.com/emberjs/ember.js/issues/11469
    OriginalLoggerError = Ember.Logger.error;
    OriginalTestAdapterException = Ember.Test.adapter.exception;
    Ember.Logger.error = function() {};
    Ember.Test.adapter.exception = function() {};

    this.urlPrefix = config.navi.appPersistence.uri;
    server.get('/dashboards/:id', () => {
      return new Mirage.Response(500);
    });

    visit('/dashboards/1');
    assert.ok(!!find('.error').length, 'Error message is present when route encounters an error');

    assert.notOk(!!find('.navi-dashboard').length, 'Navi dashboard collection component is not rendered');

    Ember.Logger.error = OriginalLoggerError;
    Ember.Test.adapter.exception = OriginalTestAdapterException;
  });

  test('dashboard loading', function(assert) {
    assert.expect(1);

    visit('/dashboards/loading');

    assert.ok(!!find('.loader-container').length, 'Loader is present when visiting loading route');
  });

  test('updates to dashboard layout', function(assert) {
    assert.expect(2);

    visit('/dashboards/1');

    let route = Application.__container__.lookup('route:dashboards.dashboard'),
      layout = get(route, 'currentDashboard.presentation.layout');

    assert.deepEqual(
      layout,
      [
        { column: 0, height: 4, row: 0, widgetId: 1, width: 6 },
        { column: 6, height: 4, row: 0, widgetId: 2, width: 6 },
        { column: 0, height: 4, row: 4, widgetId: 3, width: 12 }
      ],
      'Original layout property is correct'
    );

    //swap widget rows
    let grid = find('.grid-stack').data('gridstack'),
      items = find('.grid-stack-item');
    run(() => grid.move(items[2], 0, 0));

    assert.deepEqual(
      layout,
      [
        { column: 0, height: 4, row: 4, widgetId: 1, width: 6 },
        { column: 6, height: 4, row: 4, widgetId: 2, width: 6 },
        { column: 0, height: 4, row: 0, widgetId: 3, width: 12 }
      ],
      "Moving widget locations updates the dashboard's layout property"
    );
  });

  test('empty dashboard', async function(assert) {
    assert.expect(2);

    visit('/dashboards/5');

    assert.equal(
      find('.error-container .error')
        .text()
        .replace(/\s+/g, ' ')
        .trim(),
      'Looks like this dashboard has no widgets. Go ahead and add a widget now?'
    );

    await click('.navi-dashboard-container__add-widget-text');
    assert.ok(
      $('.ember-modal-dialog').is(':visible'),
      'Add Widget Dialog box is visible when `add a widget` text is clicked'
    );
  });

  test('index route', function(assert) {
    assert.expect(1);

    visit('/dashboards');

    let titles = find('.navi-collection .table tr td:first-of-type')
      .toArray()
      .map(el =>
        $(el)
          .text()
          .trim()
      );
    assert.deepEqual(
      titles,
      ['Tumblr Goals Dashboard', 'Dashboard 2', 'Empty Dashboard'],
      'the dashboard collection component with `navi-users`s dashboards is shown'
    );
  });

  test('index route actions', async function(assert) {
    assert.expect(4);

    visit('/dashboards');

    $('.navi-collection__row:first-of-type').trigger('mouseenter');

    // Click "Share"
    await click('.navi-collection__row:first-of-type .share .btn');

    assert.equal(
      find('.navi-collection__row:first-of-type td:eq(1) .action').length,
      5,
      'The second column contains five actions'
    );
    assert
      .dom('.primary-header')
      .hasText('Share "Tumblr Goals Dashboard"', 'Share modal pops up when action is clicked');

    // Cancel modal and click "Delete"
    await click('.btn:contains(Cancel)');
    await click('.navi-collection__row:first-of-type .delete button');

    assert
      .dom('.primary-header')
      .hasText('Delete "Tumblr Goals Dashboard"', 'Delete modal pops up when action is clicked');

    // Cancel modal and click "Clone"
    await click('.btn:contains(Cancel)');
    await click('.navi-icon__copy');

    assert.equal(currentURL(), '/dashboards/6/view', 'A dashboard is cloned when the action is clicked');
  });

  test('Add new dashboard in index route', async function(assert) {
    assert.expect(2);

    visit('/dashboards');
    await click('.dashboards-index__new-btn');

    assert
      .dom('.navi-dashboard .page-title')
      .hasText('Untitled Dashboard', 'Adding new dashboard in dashboards route transitions to new dasboard');

    visit('/dashboards');

    let titles = find('.navi-collection .table tr td:first-of-type')
      .toArray()
      .map(el =>
        $(el)
          .text()
          .trim()
      );
    assert.deepEqual(
      titles,
      ['Tumblr Goals Dashboard', 'Dashboard 2', 'Empty Dashboard', 'Untitled Dashboard'],
      'The New Dashboard is shown along with `navi-user`s other dashboards '
    );
  });

  test('add widget button', async function(assert) {
    assert.expect(4);

    visit('/dashboards/4');

    assert.notOk(
      find('.add-widget button').is(':visible'),
      'The `Add Widget` button is not visible when user cannot edit the dashboard'
    );

    visit('/dashboards/5');

    assert.ok(
      find('.add-widget button').is(':visible'),
      'The `Add Widget` button is visible when user can edit the dashboard'
    );

    await click('.add-widget .btn');

    assert.equal(
      find('.add-widget-modal .btn').getAttribute('href'),
      `/dashboards/5/widgets/new`,
      'Create new assigns the new widget route to the primary button'
    );

    selectChoose('.report-select', 'Report 12');

    assert.equal(
      find('.add-widget-modal .btn').getAttribute('href'),
      `/reports/4`,
      'Selecting a report assigns the route `/reports/${id}` to the primary button where id is the id of the report'
    );
  });

  test('Delete a dashboard', function(assert) {
    assert.expect(3);

    visit('/dashboards');

    let titles = find('.navi-collection .table tr td:first-of-type')
      .toArray()
      .map(el =>
        $(el)
          .text()
          .trim()
      );
    assert.deepEqual(
      titles,
      ['Tumblr Goals Dashboard', 'Dashboard 2', 'Empty Dashboard'],
      '`navi-user`s dashboard are shown '
    );

    visit('/dashboards/2');

    click('.dashboard-actions .delete > button').then(function() {
      click('button:contains(Confirm)').then(function() {
        assert.equal(currentURL(), '/dashboards', 'Deleting a dashboard transitions to index route');

        let titles = find('.navi-collection .table tr td:first-of-type')
          .toArray()
          .map(el =>
            $(el)
              .text()
              .trim()
          );
        assert.deepEqual(
          titles,
          ['Tumblr Goals Dashboard', 'Empty Dashboard'],
          '`navi-user`s dashboard are shown after deleting `Dashboard 2`'
        );
      });
    });
  });

  test('favorite dashboards', async function(assert) {
    assert.expect(2);

    // Favorite dashboard 2
    visit('/dashboards/2');
    await click('.navi-dashboard__fav-icon');

    // Filter by favorites
    visit('/dashboards');
    await click('.pick-form li:contains(Favorites)');

    let dasboardBefore = find('tbody tr td:first-of-type')
      .toArray()
      .map(el =>
        $(el)
          .text()
          .trim()
      );

    assert.deepEqual(dasboardBefore, ['Tumblr Goals Dashboard', 'Dashboard 2'], 'Two dashboards are in favories now');

    // Unfavorite dashboard 1
    await click('tbody tr td a:contains(Tumblr Goals Dashboard)');
    await click('.navi-dashboard__fav-icon');
    visit('/dashboards');
    await click('.pick-form li:contains(Favorites)');

    let dashboardsAfter = find('tbody tr td:first-of-type')
      .toArray()
      .map(el =>
        $(el)
          .text()
          .trim()
      );

    assert.deepEqual(dashboardsAfter, ['Dashboard 2'], 'Only one dashboard is in favories now');
  });

  test('favorite dashboard - rollback on failure', async function(assert) {
    assert.expect(1);

    // Mock server path endpoint to mock failure
    server.patch('/users/:id', () => {
      return new Mirage.Response(500);
    });

    /* == mark dashboard as favorite == */
    visit('/dashboards/3');
    await click('.navi-dashboard__fav-icon');

    /* == list favorites in list view == */
    visit('/dashboards');
    await click('.pick-form li:contains(Favorites)');

    let listedDashboards = find('tbody tr td:first-of-type')
      .toArray()
      .map(el =>
        $(el)
          .text()
          .trim()
      );

    assert.deepEqual(listedDashboards, ['Tumblr Goals Dashboard'], 'The user state is rolled back on failure');
  });

  test('clone dashboard', async function(assert) {
    assert.expect(3);

    let originalDashboardTitle, originalWidgetTitles;

    visit('/dashboards/2');

    originalDashboardTitle = find('.page-title .clickable')
      .text()
      .trim();
    originalWidgetTitles = find('.navi-widget__title')
      .toArray()
      .map(el =>
        $(el)
          .text()
          .trim()
      );

    await click('.navi-icon__copy');

    assert.equal(currentURL(), '/dashboards/6/view', 'Cloning a dashboard transitions to newly made dashboard');

    assert
      .dom('.page-title .clickable')
      .hasText(
        `Copy of ${originalDashboardTitle}`,
        'Cloned dashboard has the same title as Original dashboard with `copy of` prefix title'
      );

    assert.deepEqual(
      find('.navi-widget__title')
        .toArray()
        .map(el =>
          $(el)
            .text()
            .trim()
        ),
      originalWidgetTitles,
      'Cloned widgets are present in the dashboard '
    );
  });

  test('clone dashboard on failure', function(assert) {
    assert.expect(1);

    server.post('/dashboards/', () => {
      return new Mirage.Response(500);
    });

    visit('/dashboards/2');

    click('.navi-icon__copy').then(() => {
      assert.equal(currentURL(), '/dashboards', 'Transition to `dashboards` route on failed cloning action');
    });
  });

  test('New widget', async function(assert) {
    assert.expect(4);

    // Check original set of widgets
    visit('/dashboards/1');
    let widgetsBefore = $('.navi-widget__title')
      .map(function() {
        return this.textContent.trim();
      })
      .toArray();

    assert.deepEqual(
      widgetsBefore,
      ['Mobile DAU Goal', 'Mobile DAU Graph', 'Mobile DAU Table'],
      '"Untitled Widget" is not initially present on dashboard'
    );

    // Create new widget
    await click('.add-widget .btn');
    await click('.add-widget-modal .add-to-dashboard');

    // Fill out request
    await click('.checkbox-selector--metric .grouped-list__item:contains(Total Clicks) label');
    await click('.navi-report-widget__run-btn');
    // Regex to check that a string ends with "{uuid}/view"
    const TempIdRegex = /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/view$/;

    assert.ok(TempIdRegex.test(currentURL()), 'Creating a widget brings user to /view route with a temp id');

    // Save
    await click('.navi-report-widget__save-btn');
    assert.ok(
      currentURL().endsWith('/dashboards/1/view'),
      'After saving for the first time, user is brought back to dashboard view'
    );

    let widgetsAfter = $('.navi-widget__title')
      .map(function() {
        return this.textContent.trim();
      })
      .toArray();

    assert.deepEqual(
      widgetsAfter,
      ['Mobile DAU Goal', 'Mobile DAU Graph', 'Mobile DAU Table', 'Untitled Widget'],
      '"Untitled Widget" has been added to dashboard'
    );
  });

  test('Failing to save a new widget', async function(assert) {
    assert.expect(2);

    server.patch('/dashboards/1', () => {
      return new Mirage.Response(500);
    });

    // Create and save
    visit('/dashboards/1/widgets/new');
    await click('.checkbox-selector--metric .grouped-list__item:contains(Total Clicks) label');
    await click('.navi-report-widget__run-btn');
    await click('.navi-report-widget__save-btn');
    assert.ok(
      currentURL().endsWith('/dashboards'),
      'User ends up on dashboards route when there is an error adding a widget'
    );

    visit('/dashboards/1');
    assert.dom('.navi-widget').exists({ count: 3 }, 'The new widget was never added to the dashboard');
  });

  test('Editing dashboard title', async function(assert) {
    assert.expect(2);

    // Edit title of the dashboard
    visit('/dashboards/1');
    await click('.editable-label__icon');
    fillIn('.editable-label__input', 'A new title');
    triggerEvent('.editable-label__input', 'blur');

    assert
      .dom('.navi-dashboard .page-title')
      .hasText('A new title', 'New Dashboard title is persisted with value `A new title` ');

    //Not Editor
    visit('/dashboards/3');
    assert.notOk($('.editable-label__icon').is(':visible'), 'Edit icon is not available if user is not the editor');
  });

  test('Unauthorized widget', function(assert) {
    assert.expect(2);
    // Allow testing of errors - https://github.com/emberjs/ember.js/issues/11469
    OriginalLoggerError = Ember.Logger.error;
    OriginalTestAdapterException = Ember.Test.adapter.exception;
    Ember.Logger.error = function() {};
    Ember.Test.adapter.exception = function() {};

    server.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
    server.get('/data/network/day/os', function() {
      return new Mirage.Response(403);
    });

    visit('/dashboards/2/view');
    assert.ok(
      find('.navi-widget:eq(0) .navi-widget__content').hasClass('visualization-container'),
      'Widget loaded visualization for allowed component'
    );

    assert.ok(
      find('.navi-widget:eq(1) .navi-report-invalid__info-message .fa-lock').is(':visible'),
      'Unauthorized widget loaded unauthorized component'
    );

    Ember.Logger.error = OriginalLoggerError;
    Ember.Test.adapter.exception = OriginalTestAdapterException;
  });
});
