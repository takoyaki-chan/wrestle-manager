'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const app = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8').replace(/\r\n/g, '\n');
const data = fs.readFileSync(path.join(__dirname, '../src/data.js'), 'utf8');
function method(name) {
  const start = app.indexOf(`\n  ${name}(`);
  assert.ok(start >= 0, name);
  const end = app.indexOf('\n  },', start);
  return app.slice(start, end + 5).trim().replace(/,$/, '');
}
const closeStart = app.indexOf('\n  closeShowResult()');
const chainStart = app.indexOf('    const popupActions = [];', closeStart);
const chainEnd = app.indexOf('    // relationship-flags-spec-v1.0', chainStart);
assert.ok(chainStart > closeStart && chainEnd > chainStart);
const chain = app.slice(chainStart, chainEnd);
let queued, choiceCallback, shown, saved;
const context = vm.createContext({
  G: {},
  VENUES: [],
  Engine: { util: { dispOrgPop: n => n } },
  Audio: { play() {} },
  Storage: { autoSave() { saved++; } },
  showMilestoneEvent(evt, choose) { shown.push(evt.id); choiceCallback = choose; },
  showCeremonyEvent() { throw new Error('Unexpected pre-show ceremony'); },
  _chainEventPopupQueueEmpty(fn) { queued = fn; },
  titleOutcomes: [], pendingLastRunRetirements: [], pendingInjuryRetirements: [],
  pendingGrowthEventsShow: [], pendingResolutions: [], hasEventPopups: false,
  wmDiag() {},
});
vm.runInContext(data.slice(data.indexOf('const MILESTONE_EVENTS = ['), data.indexOf('\n];', data.indexOf('const MILESTONE_EVENTS = [')) + 3), context);
vm.runInContext(`var App = {${['_checkMilestones', '_checkAndShowMilestone', '_applyMilestoneChoice'].map(method).join(',')}};`, context);
function afterShow(totalShows, milestones = {}) {
  context.G = { totalShows, milestones, roster: [], orgPop: 0, rivalries: {}, showVenue: 0 };
  shown = []; saved = 0; queued = null;
  vm.runInContext(`(function() {${chain}})()`, context);
  assert.deepStrictEqual(shown, [], 'Do not open before the week advance clears popups');
  assert.strictEqual(typeof queued, 'function', 'Schedule through the existing post-show queue');
  queued();
}
afterShow(0);
assert.deepStrictEqual(shown, [], 'No opening event before a completed show');
for (let choice = 0; choice < 3; choice++) {
  afterShow(1);
  assert.deepStrictEqual(shown, ['first_show'], 'Opening event appears after the first show, without waiting for year end');
  choiceCallback(choice);
  assert.strictEqual(context.G.milestones.first_show, true);
  assert.strictEqual(saved, 1, 'Persist the choice immediately');
  const buff = context.G.milestoneBuffs[0];
  assert.strictEqual(buff.source, 'first_show');
  assert.strictEqual(buff.remainingWeeks || buff.remainingShows, [3, 4, 2][choice], 'New reward retains its full duration');
  afterShow(2, context.G.milestones);
  assert.deepStrictEqual(shown, [], 'Do not repeat at the next show');
  context.G.totalShows = 24;
  vm.runInContext('App._checkAndShowMilestone(() => {})', context);
  assert.deepStrictEqual(shown, [], 'Do not repeat at year end');
}
afterShow(12);
assert.deepStrictEqual(shown, ['first_show'], 'An existing save with an unclaimed milestone is still eligible');
console.log('post-show-milestone-timing-test: PASS');
