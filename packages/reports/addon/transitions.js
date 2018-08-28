/**
 * Copyright 2018, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
export const DETAILS_DURATION = 300;

export default function() {
  this.transition(
    this.hasClass('missing-intervals-warning'),
    this.onInitialRender(),
    this.use('toUp', {duration: 1000})
  );
  this.transition(
    this.hasClass('missing-intervals-warning__details-content'),
    this.use('toUp', {duration: DETAILS_DURATION})
  );
  this.transition(
    this.matchSelector('#modal-dialog'),
    this.toValue((toValue, fromValue) => toValue === null || fromValue === null),
    this.use('fade')
  );
  this.transition(
    this.matchSelector('#modal-backdrop'),
    this.toValue((toValue, fromValue) => toValue === null || fromValue === null),
    this.use('fade')
  );
}
