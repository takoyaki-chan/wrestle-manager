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
function afterShow(totalShows, milestones = {}, orgPop = 0) {
  context.G = { totalShows, milestones, roster: [], orgPop, rivalries: {}, showVenue: 0 };
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

afterShow(2, { first_show: true }, 19);
assert.deepStrictEqual(shown, [], 'Local buzz does not trigger below popularity 20');
afterShow(3, { first_show: true }, 20);
assert.deepStrictEqual(shown, ['orgpop_20'], 'Local buzz appears after the qualifying show, without waiting for awards');
choiceCallback(0);
assert.strictEqual(context.G.milestones.orgpop_20, true);
assert.strictEqual(saved, 1, 'Persist local buzz completion');
assert.strictEqual(context.G.milestoneBuffs[0].remainingWeeks, 4);
afterShow(4, context.G.milestones, 20);
assert.deepStrictEqual(shown, [], 'Do not repeat local buzz at later shows');
context.G.offSeason = true;
context.G.totalShows = 24;
vm.runInContext('App._checkAndShowMilestone(() => {})', context);
assert.deepStrictEqual(shown, [], 'Do not repeat local buzz after annual awards');

afterShow(1, {}, 20);
assert.deepStrictEqual(shown, ['first_show'], 'Opening show takes priority when both conditions are met');
choiceCallback(0);
afterShow(2, context.G.milestones, 20);
assert.deepStrictEqual(shown, ['orgpop_20'], 'A simultaneous local buzz milestone is picked up at the next show, not year end');
console.log('post-show-milestone-timing-test: PASS');
