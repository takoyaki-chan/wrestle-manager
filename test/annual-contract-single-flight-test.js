'use strict';

// Regression: the year-end ceremony and contract negotiation are both modal
// chains. A repeated click, stale callback, or duplicate route entry must not
// create a second chain or advance a second negotiation cursor.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const app = read('src/app.js');
const ui = read('src/ui-common.js');

function appMethod(name, nextName) {
  const start = app.indexOf(`  ${name}(`);
  const end = app.indexOf(`\n  ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `${name} method not found`);
  return app.slice(start, end).trim().replace(/,$/, '');
}

function uiFunction(name, nextName) {
  const start = ui.indexOf(`function ${name}(`);
  const end = ui.indexOf(`\nfunction ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `${name} function not found`);
  return ui.slice(start, end);
}

// Every visible way to continue the contract chain uses the same one-shot
// binding. This includes the two-choice screens, where different buttons can
// receive queued events in the same browser frame.
const bindStart = ui.indexOf('function _bindContractOnce(');
const bindEnd = ui.indexOf('\nfunction showContractSummaryModal(', bindStart);
assert.ok(bindStart >= 0 && bindEnd > bindStart, 'contract one-shot binder not found');
const bindContext = {};
vm.runInNewContext(`${ui.slice(bindStart, bindEnd)}\nthis.bind = _bindContractOnce;`, bindContext);
let clickHandler;
const button = {
  disabled: false,
  addEventListener(type, handler) { if (type === 'click') clickHandler = handler; },
  setAttribute() {},
};
let calls = 0;
bindContext.bind(button, () => { calls += 1; });
clickHandler({ preventDefault() {} });
clickHandler({ preventDefault() {} });
assert.strictEqual(calls, 1, 'a contract action must consume only one click');
assert.strictEqual(button.disabled, true, 'the consumed contract action must disable its button');

for (const [name, nextName] of [
  ['showContractSummaryModal', 'showContractNegotiationModal'],
  ['showContractNegotiationModal', 'showContractReactionModal'],
  ['showContractReactionModal', 'showContractListenModal'],
  ['showContractListenModal', 'showContractSuddenDepartureModal'],
  ['showContractSuddenDepartureModal', 'showContractResultModal'],
  ['showContractResultModal', '_jtHeader'],
]) {
  assert.ok(uiFunction(name, nextName).includes('_bindContractOnce('), `${name} bypasses the one-shot binder`);
}

assert.ok(ui.includes('window._awardsCeremonySession'), 'awards queue has no single-flight session');
assert.ok(ui.includes('awardSession.active || awardSession.queued'), 'awards queue allows duplicate ceremony entries');

// Execute the real controller with mocked UI callbacks. Calling it twice while
// the summary is open used to create two independent idx closures; the second
// one could skip the remaining negotiations.
const handleSource = appMethod('handleContractNegotiations', '_buildContractRenewalSalaryChanges');
const context = {
  G: {
    season: 1, rngSeed: 99, roster: [], titles: {}, gameLog: [],
    pendingContractNegotiations: [
      { fighterId: 1, fighterName: 'A', attitude: 'raise' },
      { fighterId: 2, fighterName: 'B', attitude: 'raise' },
    ],
  },
  Engine: {},
  showScreen() {},
  showContractSuddenDepartureModal() { throw new Error('unexpected sudden departure'); },
};
const summaries = [];
const choices = [];
const results = [];
let advanced = 0;
context.showContractSummaryModal = (_negotiations, _autoCount, _season, onStart) => summaries.push(onStart);
context.showContractNegotiationModal = (_neg, _idx, _total, _state, onChoice) => choices.push(onChoice);
context.showContractResultModal = (_results, _changes, onDone) => results.push(onDone);
context.App = {
  _buildContractRenewalSalaryChanges() { return []; },
  _resolveContractChoice(neg, _choice, stepResults, onDone, onResolved) {
    const result = { type: 'stay', fighterId: neg.fighterId, fighterName: neg.fighterName, salaryDelta: 0 };
    stepResults.push(result);
    onResolved(result);
    onDone();
  },
  advanceWeek() { advanced += 1; },
};
const handle = vm.runInNewContext(`({${handleSource}}).handleContractNegotiations`, context);

handle.call(context.App);
handle.call(context.App);
assert.strictEqual(summaries.length, 1, 'duplicate entry must not open a second contract summary');
summaries[0]();
assert.strictEqual(choices.length, 1, 'first negotiation must open once');
choices[0](0);
assert.strictEqual(choices.length, 2, 'first result must advance to exactly one second negotiation');
choices[1](0);
assert.strictEqual(results.length, 1, 'all negotiations must reach one result screen');
results[0]();
assert.strictEqual(advanced, 1, 'result acknowledgement must advance the offseason once');
assert.strictEqual(context.App._contractNegotiationSession, null, 'completed contract session must release its lock');
assert.strictEqual(context.G._contractNegotiationProgress, undefined,
  'completed contract session must clear its durable resume cursor');

console.log('annual-contract-single-flight-test: ok');
