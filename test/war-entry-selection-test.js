'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame({ full: true });

function fighter(id, ovr, extra = {}) {
  return {
    id,
    name: `選手${id}`,
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    age: 24,
    popularity: 50,
    condition: 80,
    style: 'Allround',
    traits: [],
    ...extra,
  };
}

function makeState(matchCount) {
  const state = Engine.createInitialState(8022026, true);
  const player = [
    fighter(1, 91), fighter(2, 83), fighter(3, 75), fighter(4, 67),
    fighter(5, 59), fighter(6, 51), fighter(7, 43),
  ];
  const opponent = [
    fighter(101, 90), fighter(102, 82), fighter(103, 74), fighter(104, 66),
    fighter(105, 58), fighter(106, 50), fighter(107, 42),
  ];
  return {
    ...state,
    roster: player,
    aiOrgs: {
      ...state.aiOrgs,
      org_s: { ...state.aiOrgs.org_s, roster: opponent },
    },
    pendingEvent: {
      type: 'war',
      opponentOrgId: 'org_s',
      opponentName: '対戦団体',
      matchCount,
    },
  };
}

(function testOnlyEligibleFightersAreListed() {
  const state = makeState(3);
  state.roster = [
    fighter(1, 90),
    fighter(2, 89, { injury: { weeks: 2 } }),
    fighter(3, 88, { isRental: true }),
    fighter(4, 87, { forcedRest: true }),
    fighter(5, 86, { suspended: true }),
    fighter(6, 85, { onLeave: true }),
    fighter(7, 84, { isIntrusion: true }),
    fighter(8, 83),
  ];
  assert.deepStrictEqual(
    Engine.event.getWarEntryCandidates(state).map(f => f.id),
    [1, 8],
    '代表候補には対抗戦へ出場可能な自団体選手だけを出す'
  );
})();

(function testThreeMatchCardUsesExactlyTheChosenRepresentatives() {
  const state = makeState(3);
  const card = Engine.event.makeWarCard(state, 'org_s', [2, 5, 7]);
  assert.strictEqual(card.length, 3);
  assert.deepStrictEqual(
    card.map(match => match.playerFighter.id).sort((a, b) => a - b),
    [2, 5, 7],
    '自動上位選出へ差し替えず、選んだ3名だけでカードを作る'
  );
  assert.deepStrictEqual(
    card.map(match => Engine.util.ov(match.playerFighter)),
    [43, 59, 83],
    'カードは弱い順に並び、最強同士がメインイベントになる'
  );
  assert.deepStrictEqual(
    card.map(match => Engine.util.ov(match.aiFighter)),
    [74, 82, 90]
  );
})();

(function testFiveMatchCardAndInvalidSelections() {
  const state = makeState(5);
  assert.strictEqual(Engine.event.makeWarCard(state, 'org_s', [1, 2, 3, 4, 5]).length, 5);
  assert.deepStrictEqual(Engine.event.makeWarCard(state, 'org_s', [1, 2, 3, 4]), []);
  assert.deepStrictEqual(Engine.event.makeWarCard(state, 'org_s', [1, 2, 3, 4, 4]), []);
  state.roster[4].injury = { weeks: 1 };
  assert.deepStrictEqual(Engine.event.makeWarCard(state, 'org_s', [1, 2, 3, 4, 5]), []);
})();

(function testUiRequiresSelectionBeforeCardCreation() {
  const root = path.join(__dirname, '..');
  const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
  const mobile = fs.readFileSync(path.join(root, 'src', 'mobile.css'), 'utf8');

  const accept = ui.slice(ui.indexOf('function acceptWarChallenge()'), ui.indexOf('// ── War Match Preview Renderer'));
  assert.ok(accept.includes('renderWarEntrySelection()'));
  assert.ok(!accept.includes('makeWarCard('), '受諾時点では試合カードを作らない');
  assert.ok(!accept.includes('initWarPreview('), '代表確定前は試合画面へ進まない');

  const confirm = app.slice(app.indexOf('warConfirmEntry()'), app.indexOf('_beginWarUiTransition()'));
  assert.ok(confirm.includes('makeWarCard(G, ev.opponentOrgId, selected)'));
  assert.ok(confirm.includes('if (selected.length !== required)'));
  assert.ok(confirm.includes('App.initWarPreview(ev, card)'));

  assert.ok(ui.includes('この${required}名で開戦する'));
  assert.ok(ui.includes("${canConfirm ? '' : 'disabled'}"));
  assert.ok(ui.includes('App.warAutoSelectEntry()'));
  assert.ok(css.includes('.war-entry-candidate.is-selected'));
  assert.ok(mobile.includes('.war-entry-candidate-grid'));
})();

console.log('war-entry-selection-test: ok');
