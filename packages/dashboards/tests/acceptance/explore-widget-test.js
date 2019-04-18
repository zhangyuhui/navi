import { find, click, fillIn, currentURL, currentPath, findAll, blur, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import Ember from 'ember';
import config from 'ember-get-config';
import { setupApplicationTest } from 'ember-qunit';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';

// Regex to check that a string ends with "{uuid}/view"
const TempIdRegex = /\/reports\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/view$/;

module('Acceptance | Exploring Widgets', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('Widget title', async function(assert) {
    assert.expect(1);

    await visit('/dashboards/1/widgets/1');

    assert.dom('.navi-report-widget__title').hasText('Mobile DAU Goal', 'Widget title is displayed as the page title');
  });

  test('Editing widget title', async function(assert) {
    assert.expect(1);

    // Edit title
    await visit('/dashboards/1/widgets/2/view');
    await click('.editable-label__icon');
    await fillIn('.editable-label__input', 'A new title');
    await blur('.editable-label__input');

    // Save and return to dashboard
    await click('.navi-report-widget__save-btn');
    await visit('/dashboards/1');

    const widgetNames = find('.navi-widget__title').map(el => el.textContent.trim());

    assert.ok(widgetNames.includes('A new title'), 'New widget title is saved and persisted on dashboard');
  });

  test('Breadcrumb', async function(assert) {
    assert.expect(4);
    let originalFeatureFlag = config.navi.FEATURES.enableDirectory;

    config.navi.FEATURES.enableDirectory = true;

    await visit('/dashboards/1/widgets/1');

    let firstBreadcrumbItem = find(find('.navi-report-widget__breadcrumb-link')),
      secondBreadcrumbItem = find(findAll('.navi-report-widget__breadcrumb-link')[1]);

    assert.equal(firstBreadcrumbItem.text().trim(), 'Directory', 'Breadcrumb begins with "Directory" link');

    assert.ok(
      firstBreadcrumbItem.attr('href').endsWith('/directory/my-data'),
      'First breadcrumb item links to my-data route'
    );

    assert.equal(
      secondBreadcrumbItem.text().trim(),
      'Tumblr Goals Dashboard',
      'Second breadcrumb contains dashboard title'
    );

    assert.ok(
      secondBreadcrumbItem.attr('href').endsWith('/dashboards/1'),
      'Second breadcrumb item links to parent dashboard'
    );
    config.navi.FEATURES.enableDirectory = originalFeatureFlag;
  });

  test('Viewing a widget', async function(assert) {
    assert.expect(2);

    await visit('/dashboards/1/widgets/2/view');

    assert.ok(
      find('.navi-report-widget__body .report-builder').is(':visible'),
      'Widget body has a builder on the view route'
    );

    assert.ok(
      find('.navi-report-widget__body .report-builder__container--result').is(':visible'),
      'Widget body has a visualization on the view route'
    );
  });

  test('Exploring a widget', async function(assert) {
    assert.expect(1);

    await visit('/dashboards/1');
    await click(findAll('.navi-widget__explore-btn')[1]);

    assert.ok(currentURL().endsWith('/dashboards/1/widgets/2/view'), 'Explore action links to widget view route');
  });

  test('Changing and saving a widget', async function(assert) {
    assert.expect(1);

    // Add a metric to widget 2, save, and return to dashboard route
    await visit('/dashboards/1/widgets/2/view');
    await click('.checkbox-selector--metric .grouped-list__item:contains(Total Clicks) label');
    await click('.navi-report-widget__save-btn');
    await visit('/dashboards/1');

    let legends = $('.c3-legend-item')
      .map(function() {
        return this.textContent.trim();
      })
      .toArray();

    assert.deepEqual(
      legends,
      ['Ad Clicks', 'Nav Link Clicks', 'Total Clicks'],
      'Added metric appears in dashboard view after saving widget'
    );
  });

  test('Revert changes', async function(assert) {
    assert.expect(4);

    await visit('/dashboards/1/widgets/2/view');

    assert.notOk($('.navi-report-widget__revert-btn').is(':visible'), 'Revert changes button is not initially visible');

    // Remove a metric
    await click('.checkbox-selector--dimension .grouped-list__item:contains(Week) label');
    assert.ok(
      $('.navi-report-widget__revert-btn').is(':visible'),
      'Revert changes button is visible once a change has been made'
    );

    await click('.navi-report-widget__revert-btn');
    assert.ok(
      $('.filter-builder__subject:contains(Day)').is(':visible'),
      'After clicking "Revert Changes", the changed time grain is returned'
    );

    assert.notOk(
      $('.navi-report-widget__revert-btn').is(':visible'),
      'After clicking "Revert Changes", button is once again hidden'
    );
  });

  test('Export action', async function(assert) {
    assert.expect(3);

    let originalFeatureFlag = config.navi.FEATURES.enableMultipleExport;

    // Turn flag off
    config.navi.FEATURES.enableMultipleExport = false;

    await visit('/dashboards/1/widgets/2/view');

    assert.notOk(
      $('.navi-report-widget__action-link:contains(Export)').is('.navi-report-widget__action-link--is-disabled'),
      'Export action is enabled for a valid request'
    );
    assert.ok(
      find('.navi-report-widget__action-link:contains(Export)')
        .getAttribute('href')
        .includes('metrics=adClicks%2CnavClicks'),
      'Have correct metric in export url'
    );

    // Remove all metrics to create an invalid request
    await click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) label');
    await click('.checkbox-selector--metric .grouped-list__item:contains(Nav Link Clicks) label');

    assert.ok(
      $('.navi-report-widget__action-link:contains(Export)').is('.navi-report-widget__action-link--is-disabled'),
      'Export action is disabled when request is not valid'
    );

    config.navi.FEATURES.enableMultipleExport = originalFeatureFlag;
  });

  test('Multi export action', async function(assert) {
    assert.expect(1);

    await visit('/dashboards/1/widgets/2/view');
    clickDropdown('.multiple-format-export');
    assert.ok(
      find('.multiple-format-export__dropdown a:contains(PDF)')
        .getAttribute('href')
        .includes('export?reportModel='),
      'Export url contains serialized report'
    );
  });

  test('Get API action - enabled/disabled', async function(assert) {
    assert.expect(2);

    await visit('/dashboards/1/widgets/2/view');
    assert.notOk(
      $('.get-api').is('.navi-report-widget__action--is-disabled'),
      'Get API action is enabled for a valid request'
    );

    // Remove all metrics
    click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) label');
    click('.checkbox-selector--metric .grouped-list__item:contains(Nav Link Clicks) label');


    // Remove all metrics to create an invalid request
    await click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) label');
    await click('.checkbox-selector--metric .grouped-list__item:contains(Nav Link Clicks) label');

    // Create empty filter to make request invalid
    await click($('.grouped-list__item:Contains(Operating System) .checkbox-selector__filter')[0]);
    assert.ok(
      $('.get-api').is('.navi-report-widget__action--is-disabled'),
      'Get API action is disabled when request is not valid'
    );
  });

  test('Share action', async function(assert) {
    assert.expect(2);

    /* == Unsaved widget == */
    await visit('/dashboards/1/widgets/new');
    await click('.checkbox-selector--metric .grouped-list__item:contains(Ad Clicks) label');
    await click('.navi-report-widget__run-btn');
    assert.notOk(
      $('.navi-report-widget__action:contains(Share)').is(':visible'),
      'Share action is not present on an unsaved report'
    );

    /* == Saved widget == */
    await visit('/dashboards/1/widgets/2/view');
    await click('.navi-report-widget__action:contains(Share) button');

    assert.equal(
      $('.navi-modal .primary-header').text(),
      'Share "Mobile DAU Graph"',
      'Clicking share action brings up share modal'
    );
  });

  test('Delete widget', async function(assert) {
    assert.expect(5);

    /* == Not author == */
    await visit('/dashboards/3/widgets/4/view');
    assert.notOk(
      $('.navi-report-widget__action:contains(Delete)').is(':visible'),
      'Delete action is not available if user is not the author'
    );

    /* == Delete success == */
    await visit('/dashboards/1');
    let widgetNamesBefore = $('.navi-widget__title')
      .map(function() {
        return this.textContent.trim();
      })
      .toArray();

    assert.deepEqual(
      widgetNamesBefore,
      ['Mobile DAU Goal', 'Mobile DAU Graph', 'Mobile DAU Table'],
      '"DAU Graph" widget is initially present on dashboard'
    );

    await visit('/dashboards/1/widgets/2/view');
    await click('.navi-report-widget__action:contains(Delete) button');
    assert.dom('.primary-header').hasText('Delete "Mobile DAU Graph"', 'Delete modal pops up when action is clicked');

    await click('.navi-modal .btn-primary');
    assert.ok(currentURL().endsWith('/dashboards/1/view'), 'After deleting, user is brought to dashboard view');

    let widgetNamesAfter = $('.navi-widget__title')
      .map(function() {
        return this.textContent.trim();
      })
      .toArray();

    assert.deepEqual(
      widgetNamesAfter,
      ['Mobile DAU Goal', 'Mobile DAU Table'],
      'Deleted widget is removed from dashboard'
    );
  });

  test('Clone a widget', async function(assert) {
    assert.expect(4);
    let originalWidgetTitle;

    await visit('/dashboards/1/widgets/1/view');
    originalWidgetTitle = find('.navi-report-widget__title').textContent.trim();

    await click('.navi-report-widget__action-link:contains("Clone As Report")');

    assert.ok(
      TempIdRegex.test(currentURL()),
      'After cloning, user is brought to view route for a new report with a temp id'
    );

    assert.dom('.navi-report__title').hasText('Copy of ' + originalWidgetTitle, 'Cloned Report title is displayed');

    assert.ok(find('.navi-report__body .report-builder').is(':visible'), 'Report body has a builder on the view route');

    assert.ok(
      find('.navi-report__body .report-view__visualization-main').is(':visible'),
      'Report body has a visualization on the view route'
    );
  });

  test('Error data request', async function(assert) {
    assert.expect(1);

    server.get(`${config.navi.dataSources[0].uri}/v1/data/*path`, () => {
      return new Mirage.Response(500, {}, { description: 'Cannot merge mismatched time grains month and day' });
    });

    //suppress errors and exceptions for this test
    let originalLoggerError = Ember.Logger.error,
      originalException = Ember.Test.adapter.exception;

    Ember.Logger.error = function() {};
    Ember.Test.adapter.exception = function() {};

    await visit('/dashboards/2/widgets/4/view');
    assert.equal(
      $('.navi-report-error__info-message')
        .text()
        .replace(/\s+/g, ' ')
        .trim(),
      'Oops! There was an error with your request. Cannot merge mismatched time grains month and day',
      'An error message is displayed for an invalid request'
    );

    Ember.Logger.error = originalLoggerError;
    Ember.Test.adapter.exception = originalException;
  });

  test('Cancel Widget', async function(assert) {
    //Slow down mock
    server.timing = 400;
    server.urlPrefix = `${config.navi.dataSources[0].uri}/v1`;
    server.get('data/*path', () => {
      return { rows: [] };
    });

    //Load the widget
    visitWithoutWait('/dashboards/1/widgets/1/view');
    waitForElement('.navi-report-widget__cancel-btn').then(() => {
      assert.equal(currentPath(), 'dashboards.dashboard.widgets.widget.loading', 'Widget is loading');

      assert.deepEqual(
        find('.navi-report-widget__footer .btn')
          .toArray()
          .map(e =>
            $(e)
              .text()
              .trim()
          ),
        ['Cancel'],
        'When widget is loading, the only footer button is `Cancel`'
      );
    });

    //Cancel the widget
    await click('.navi-report-widget__cancel-btn');
    assert.equal(
      currentPath(),
      'dashboards.dashboard.widgets.widget.edit',
      'Clicking `Cancel` brings the user to the edit route'
    );

    assert.deepEqual(
      find('.navi-report-widget__footer .btn')
        .toArray()
        .map(e =>
          $(e)
            .text()
            .trim()
        ),
      ['Run', 'Save Changes', 'Revert Changes'],
      'When not loading a widget, the standard footer buttons are available'
    );

    //Run the widget
    await click('.navi-report-widget__run-btn');
    assert.equal(
      currentPath(),
      'dashboards.dashboard.widgets.widget.view',
      'Running the widget brings the user to the view route'
    );

    assert.deepEqual(
      find('.navi-report-widget__footer .btn')
        .toArray()
        .map(e =>
          $(e)
            .text()
            .trim()
        ),
      ['Run', 'Save Changes', 'Revert Changes'],
      'When not loading a widget, the standard footer buttons are available'
    );
  });
});
