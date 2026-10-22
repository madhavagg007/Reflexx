const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');

test('mean and stdDev', () => {
  assert.equal(C.mean([200, 300]), 250);
  assert.equal(C.stdDev([250, 250, 250]), 0);
  assert.equal(Math.round(C.stdDev([200, 300])), 50);
});
test('level thresholds', () => {
  assert.equal(C.level(170), 'S');
  assert.equal(C.level(200), 'A+');
  assert.equal(C.level(240), 'A');
  assert.equal(C.level(280), 'B');
  assert.equal(C.level(320), 'C');
  assert.equal(C.level(400), 'D');
  assert.equal(C.level(0), '\u2014');
});
test('percentile is monotonic and centred near the median', () => {
  assert.ok(C.percentile(200) > C.percentile(273));
  assert.ok(C.percentile(273) > C.percentile(350));
  assert.ok(Math.abs(C.percentile(273) - 50) <= 1);
});
test('scoreRun averages rounds and penalises precision false starts', () => {
  assert.equal(C.scoreRun([200, 300], 'challenge', 3), 250);
  assert.equal(C.scoreRun([250], 'precision', 2), 350);
  assert.equal(C.scoreRun([], 'classic', 0), 0);
});
test('anticipation detection', () => {
  assert.equal(C.isAnticipation(99), true);
  assert.equal(C.isAnticipation(100), false);
});
