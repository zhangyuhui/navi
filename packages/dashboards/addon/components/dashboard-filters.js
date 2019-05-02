import Component from '@ember/component';
import layout from '../templates/components/dashboard-filters';

export default Component.extend({
  layout,
  classNames: ['dashboard-filters'],

  /**
   * @property {Boolean} isCollapsed
   */
  isCollapsed: true
});
