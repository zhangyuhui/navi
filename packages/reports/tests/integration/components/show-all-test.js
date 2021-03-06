import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const COMMON_TEMPLATE = hbs`
    <style>
        .show-all {
            max-height: 40px;
        }
    </style>
    {{show-all
        filter=filter
        updateFilterValues=(action updateFilterValues)
        cancel=(action cancel)
    }}`;

let Filter = {
  dimension: {
    longName: 'property'
  },
  values: _buildFilterVals(10)
};

moduleForComponent('show-all', 'Integration | Component | Show All', {
  integration: true,

  beforeEach() {
    this.set('filter', Filter);
    this.set('updateFilterValues', () => {});
    this.set('cancel', () => {});
  }
});

test('show-all component renders', function(assert) {
  assert.expect(5);

  this.render(COMMON_TEMPLATE);

  assert.equal(
    $('.navi-modal-header .primary-header')
      .text()
      .trim(),
    'Included properties',
    'component has main header text based on dimension filter'
  );

  assert.equal(
    $('.navi-modal-header .secondary-header')
      .text()
      .trim(),
    'The properties listed below have been included',
    'component has secondary header text based on dimension filter'
  );

  assert.equal(
    $('.show-all .valid-id-count')
      .text()
      .replace(/\s+/g, ' ')
      .trim(),
    '10 properties',
    'component displays appropriate filter value count'
  );

  let pills = $('.show-all .item'),
    expectedResult = Filter.values.map(value => {
      return `${value.get('description')} (${value.get('id')})`;
    });
  assert.deepEqual(
    pills
      .map(function() {
        return this.childNodes[0].wholeText.trim();
      })
      .get(),
    expectedResult,
    'component displays appropriate filter values as expected'
  );

  assert.equal(
    $('.show-all .btn')
      .text()
      .trim(),
    'Done',
    'component displays "Done" button when no values have been removed'
  );
});

test('behaviour of done button', function(assert) {
  assert.expect(3);

  this.render(COMMON_TEMPLATE);

  assert.equal($('button:contains("Done")').length, 1, 'Done button is visible before updating filter values');

  this.set('cancel', () => {
    assert.ok(true, 'cancelAction action is triggered');
  });

  $('button:contains("Done")').click();

  /* == update filter values == */
  $('.show-all li:first a').click(); // remove 1st pill

  assert.equal($('button:contains("Done")').length, 0, 'Done button is not visible after removing filter values');
});

test('behaviour of cancel button', function(assert) {
  assert.expect(3);

  this.render(COMMON_TEMPLATE);

  assert.equal($('button:contains("Cancel")').length, 0, 'Cancel button is not visible before updating filter values');

  /* == update filter values == */
  $('.show-all .item:first .remove-pill').click(); // remove 1st pill

  assert.equal($('button:contains("Cancel")').length, 1, 'Cancel button is visible after updating filter values');

  this.set('cancel', () => {
    assert.ok(true, 'cancelAction action is triggered');
  });

  $('button:contains("Cancel")').click();
});

test('updating filter values', function(assert) {
  assert.expect(6);

  this.render(COMMON_TEMPLATE);

  assert.equal($('button:contains("Update")').length, 0, 'Update button is not visible before updating filter values');

  assert.equal(
    $('.items-count')
      .text()
      .trim(),
    '10',
    'component displays 10 filter values before updating filter values'
  );

  /* == update filter values == */
  $('.show-all .item:first .remove-pill').click(); // remove 1st pill

  assert.equal($('button:contains("Update")').length, 1, 'Update button is visible after updating filter values');

  assert.equal(
    $('.items-count')
      .text()
      .trim(),
    '9',
    'component displays 9 filter values after updating filter values'
  );

  this.set('updateFilterValues', updatedValues => {
    assert.ok(true, 'update filter values action is triggered');

    assert.deepEqual(
      updatedValues,
      Filter.values.slice(1),
      'update filter values action receives updated values as expected'
    );
  });

  $('button:contains("Update")').click();
});

//Builds mock array of filter values
function _buildFilterVals(count) {
  let values = Ember.A([]);
  for (let i = 0; i < count; i++) {
    values.push(
      Ember.Object.create({
        id: i.toString(),
        description: 'Property ' + i
      })
    );
  }
  return values;
}
