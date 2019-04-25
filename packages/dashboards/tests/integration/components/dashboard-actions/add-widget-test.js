import { A as arr } from '@ember/array';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, findAll, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { clickTrigger as toggleSelector } from 'ember-power-select/test-support/helpers';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import $ from 'jquery';

const DASHBOARD_ID = 12;

module('Integration | Component | dashboard actions/add widget', function(hooks) {
  setupRenderingTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function() {
    this.set('reports', arr([{ id: 1, title: 'Report 1' }, { id: 2, title: 'Report 2' }]));
    this.set('dashboard', { id: DASHBOARD_ID });

    await render(hbs`
      {{#dashboard-actions/add-widget
        classNames='dashboard-control add-widget'
        reports=reports
        dashboard=dashboard
      }}
        Add Widget
      {{/dashboard-actions/add-widget}}
    `);
  });

  test('it renders', async function(assert) {
    assert.expect(2);

    assert.dom('.add-widget').hasText('Add Widget', 'Template component is yielded');
    assert.dom('.ember-modal-dialog').isNotVisible('The add widget modal is not visible in the beginning');
  });

  test('report selector', async function(assert) {
    assert.expect(4);

    await click('.dashboard-control');

    assert
      .dom('.add-widget-modal .ember-power-select-selected-item')
      .hasText('Create new...', 'Create new option is selected by default in the dropdown');

    await toggleSelector('.add-widget-modal');

    assert.deepEqual(
      findAll('.add-widget-modal .ember-power-select-option').map(el => el.textContent.trim()),
      ['Create new...', 'Report 1', 'Report 2'],
      'The user`s report titles are shown in the dropdown along with create new'
    );

    assert.deepEqual(
      findAll('.add-widget-modal .ember-power-select-group .ember-power-select-option').map(el =>
        el.textContent.trim()
      ),
      ['Report 1', 'Report 2'],
      'The user`s report titles are shown under a group in the dropdown'
    );

    assert
      .dom('.add-widget-modal .ember-power-select-group-name')
      .hasText('My Reports', 'The user`s report titles are shown under a group name `My Reports` in the dropdown');

    // Clean up
    await click('.primary-header');
    await click($('button:contains(Cancel)')[0]);
  });
});
