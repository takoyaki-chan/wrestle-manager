'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

const rootDir = path.resolve(__dirname, '..');
const uiSource = fs.readFileSync(path.join(rootDir, 'src', 'ui-common.js'), 'utf8');
const dialogueSource = fs.readFileSync(
  path.join(rootDir, 'docs', 'dialogue', 'faction-ignite-and-challenge-lines-draft-v0.1.md'),
  'utf8'
);
const { CHALLENGE_ARRIVAL_LINES, EVENT_LINES_BY_KEY } = require('../src/data.js');

function functionSource(name) {
  const start = uiSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = uiSource.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < uiSource.length; i++) {
    if (uiSource[i] === '{') depth++;
    if (uiSource[i] === '}' && --depth === 0) return uiSource.slice(start, i + 1);
  }
  throw new Error(`${name} end not found`);
}

function parseApprovedArrivalLines(markdown) {
  const scene = markdown.split('## 場面3 — 他団体からの挑戦状・挑戦者の口上')[1].split('\n---')[0];
  const parsed = {};
  let archetype = null;
  for (const rawLine of scene.split(/\r?\n/)) {
    const heading = rawLine.match(/^### ([a-z]+)\(/);
    if (heading) {
      archetype = heading[1];
      parsed[archetype] = [];
      continue;
    }
    const bullet = rawLine.match(/^- (.+?)\s+〈[^〉]+〉$/);
    if (bullet && archetype) parsed[archetype].push(bullet[1]);
  }
  return parsed;
}

(function approvedDialogueMatchesDraftExactly() {
  const approved = parseApprovedArrivalLines(dialogueSource);
  assert.deepStrictEqual(CHALLENGE_ARRIVAL_LINES, approved, '場面3の承認済み21本と一字一句一致すること');
  assert.strictEqual(Object.values(CHALLENGE_ARRIVAL_LINES).flat().length, 21);
  assert.strictEqual(EVENT_LINES_BY_KEY.challengeArrival, CHALLENGE_ARRIVAL_LINES);
})();

function makeClassList(initial = []) {
  const values = new Set(initial);
  return {
    add: value => values.add(value),
    remove: value => values.delete(value),
    contains: value => values.has(value),
    toggle(value, force) {
      if (force === true) values.add(value);
      else if (force === false) values.delete(value);
      else if (values.has(value)) values.delete(value);
      else values.add(value);
    },
  };
}

function makeInteractiveElement(dataset, classes) {
  const listeners = {};
  return {
    dataset: { ...dataset },
    classList: makeClassList(classes),
    attributes: {},
    textContent: '',
    offsetWidth: 0,
    setAttribute(name, value) { this.attributes[name] = String(value); },
    addEventListener(type, handler) { listeners[type] = handler; },
    click() { if (listeners.click) listeners.click({ target: this }); },
  };
}

function makeFakeDom() {
  let root = null;
  const overlay = makeInteractiveElement({}, ['fevt-overlay-office']);
  const makeRoot = () => {
    let html = '';
    let buttons = {};
    const el = {
      id: '',
      contains: target => target === overlay,
      classList: makeClassList(),
      get innerHTML() { return html; },
      set innerHTML(value) { html = String(value); buttons = {}; },
      querySelector(selector) {
        if (selector.includes('fevt-overlay') || selector === '.hostile-arrival-overlay') return overlay;
        if (selector === '.crq-party-count strong') return makeInteractiveElement({}, []);
        if (selector === '.crq-sendoff-close') {
          if (!buttons[selector]) buttons[selector] = makeInteractiveElement({}, ['crq-sendoff-close']);
          return buttons[selector];
        }
        if (selector === '.fevt-decision-card[data-choice="YES"]') {
          return this.querySelectorAll('.fevt-decision-card').find(button => button.dataset.choice === 'YES') || null;
        }
        return null;
      },
      querySelectorAll(selector) {
        if (buttons[selector]) return buttons[selector];
        if (selector === '.inv-dcard') {
          buttons[selector] = [...html.matchAll(/class="inv-dcard"[^>]*data-choice-index="(\d+)"/g)]
            .map(match => makeInteractiveElement({ choiceIndex: match[1] }, ['inv-dcard']));
        } else if (selector === '[data-away-candidate-id]') {
          buttons[selector] = [...html.matchAll(/class="crq-party-cand([^\"]*)"[^>]*data-away-candidate-id="(\d+)"/g)]
            .map(match => makeInteractiveElement({ awayCandidateId: match[2] }, ['crq-party-cand', ...(match[1].includes('sel') ? ['sel'] : [])]));
        } else if (selector === '.fevt-decision-card') {
          buttons[selector] = [...html.matchAll(/class="fevt-decision-card([^\"]*)"[^>]*data-choice="(YES|NO)"/g)]
            .map(match => makeInteractiveElement({ choice: match[2] }, ['fevt-decision-card', ...(match[1].includes('label-disabled') ? ['label-disabled'] : [])]));
        } else {
          buttons[selector] = [];
        }
        return buttons[selector];
      },
    };
    return el;
  };
  const document = {
    getElementById(id) { return root && root.id === id ? root : null; },
    createElement() { return makeRoot(); },
    body: { appendChild(el) { root = el; } },
  };
  return { document, getRoot: () => root };
}

const buildUi = new Function(
  'Engine', 'document', 'getUpperUrl', '_u3bSideHtml', '_u3bOrgBadgeHtml',
  '_factionReporterStrip', '_factionSeasonLabel', '_mdlASeasonLabel', 'EVENT_LINES_BY_KEY', 'setTimeout',
  `let _popupQueue = [];
   function _isPopupActive() { return false; }
   function _enqueuePopup(fn) { fn(); }
   function _drainPopupQueue() {}
   function _factionCloseCinematicOverlay() {}
   ${functionSource('escHtml')}
   ${functionSource('_factionUpperUrl')}
   ${functionSource('_factionEnsureOverlayRoot')}
   ${functionSource('_activatePopupOverlaySync')}
   ${functionSource('showHostileArrivalStage')}
   ${functionSource('showChallengeRequestModal')}
   ${functionSource('showChallengeSendoffModal')}
   return { showHostileArrivalStage, showChallengeRequestModal, showChallengeSendoffModal };`
);

function fighter(id, name, ovr = 60, extra = {}) {
  return { id, name, archetype: 'standard', pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr, ...extra };
}

function makeUiBundle() {
  const fake = makeFakeDom();
  const EngineStub = {
    util: { ov: f => f.pw },
    rng: { derive: (...args) => args.reduce((sum, value) => sum + (Number(value) || 0), 0), create: seed => ({ seed }), int: (_rng, lo) => lo },
    challengeRequest: { pickRequesterLine: () => '直訴セリフ', pickFlavorLine: () => '因縁フレーバー' },
    h2h: { getRecordFor: () => null },
  };
  const ui = buildUi(
    EngineStub,
    fake.document,
    id => `image/upper/${id}.webp`,
    opts => `<div class="u3b-side fc1m-portrait">${opts.name}${opts.line || ''}</div>`,
    badge => `<div class="u3b-org-badge"><img src="emblem/${badge.orgId}.webp" alt="">${badge.orgName}</div>`,
    (_state, line) => `<div class="reporter">${line}</div>`,
    state => `WEEK ${state.week}`,
    state => `WEEK ${state.week}`,
    EVENT_LINES_BY_KEY,
    () => 0
  );
  return { ...fake, ui };
}

(function forwardPetitionContainsIntegratedPickerAndDisablesYesBelowTwo() {
  const { ui, getRoot } = makeUiBundle();
  const requester = fighter(1, '発起人', 80);
  const state = {
    season: 2, week: 8, rngSeed: 10, orgName: '自団体',
    roster: [
      requester,
      fighter(2, '同行可能', 75),
      fighter(3, '負傷中', 90, { injury: { type: 'minor', weeksLeft: 1 } }),
      fighter(4, '休養中', 85, { forcedRest: true }),
      fighter(5, '謹慎中', 84, { suspended: true }),
      fighter(6, '貸出選手', 83, { isRental: true }),
    ],
    aiOrgs: { rival: { name: '敵団体', roster: [fighter(101, '対戦相手', 78)] } },
    rivalOrgNames: { rival: '敵団体' },
  };
  ui.showChallengeRequestModal({ selfId: 1, otherId: 101, otherOrgId: 'rival', rivalry: 60, bond: 40 }, state, () => {});
  const html = getRoot().innerHTML;
  assert.ok(html.includes('同行する2名を選ぶ'));
  assert.ok(html.includes('同行可能'));
  ['負傷中', '休養中', '謹慎中', '貸出選手'].forEach(name => assert.ok(!html.includes(name), `${name}は候補外`));
  assert.match(html, /fevt-decision-card label-disabled" data-choice="YES"/);
})();

(function inverseRendersHostileArrivalWithoutHomeHero() {
  const { ui, getRoot } = makeUiBundle();
  const enemies = [fighter(201, '敵先鋒'), fighter(202, '敵発起人'), fighter(203, '敵中堅')];
  const state = {
    season: 2, week: 12, rngSeed: 10, orgName: '自団体', roster: [fighter(1, '自団体エース')],
    aiOrgs: { rival: { name: '敵団体', roster: enemies } }, rivalOrgNames: { rival: '敵団体' },
  };
  ui.showChallengeRequestModal({
    _inverse: true, selfId: 202, otherId: 1, requesterOrgId: 'rival', memberIds: [202, 201, 203],
  }, state, () => {});
  const html = getRoot().innerHTML;
  assert.ok(html.includes('果 た し 状'));
  assert.ok(CHALLENGE_ARRIVAL_LINES.standard.some(line => html.includes(line)), '承認済み口上が出る');
  enemies.forEach(enemy => assert.ok(html.includes(enemy.name)));
  assert.ok(!html.includes('自団体エース'), '自団体側の大型画像・名前を出さない');
  assert.ok(html.includes('emblem/rival.webp'), '実エンブレム経路のバッジが出る');
})();

(function sendoffUsesOfficeReportCardAndCompletesOnlyOnce() {
  const { ui, getRoot } = makeUiBundle();
  const initiator = fighter(1, '発起人', 80);
  const card = {
    opponentOrgId: 'rival', opponentOrgName: '敵団体',
    teamA: [initiator, fighter(2, '同行A', 75), fighter(3, '同行B', 70)],
  };
  let calls = 0;
  ui.showChallengeSendoffModal(initiator, '既存の送り出しセリフ', { week: 8 }, card, () => { calls++; });
  const html = getRoot().innerHTML;
  assert.ok(html.includes('fevt-report-card crq-sendoff-card'), 'Officeレポートカードを使う');
  assert.ok(html.includes('emblem/rival.webp') && html.includes('敵団体'), '行き先の実エンブレムを出す');
  assert.ok(html.includes('既存の送り出しセリフ'));
  assert.strictEqual((html.match(/class="crq-sendoff-member/g) || []).length, 3, '遠征3名のupperチップを出す');
  const close = getRoot().querySelector('.crq-sendoff-close');
  close.click();
  close.click();
  assert.strictEqual(calls, 1, 'sendoff onDoneは二重発火しない');
})();

(function hostileArrivalSupportsOneThreeFiveAndChoiceOnlyOnce() {
  [1, 3, 5].forEach(count => {
    const { ui, getRoot } = makeUiBundle();
    const members = Array.from({ length: count }, (_, idx) => ({ id: 300 + idx, name: `敵${idx + 1}`, roleLabel: '挑戦者' }));
    let calls = 0;
    ui.showHostileArrivalStage({
      title: '果 た し 状', subLabel: 'TEST', speakerLabel: '挑戦状の主', line: '口上', members,
      orgBadge: { orgId: 'rival', orgName: '敵団体' }, facts: ['事実'],
      choices: [{ letter: 'A', label: '受ける', result: 'YES' }, { letter: 'B', label: '断る', result: 'NO' }],
      onChoice: () => { calls++; },
    });
    const html = getRoot().innerHTML;
    assert.ok(html.includes(`data-member-count="${count}"`));
    assert.strictEqual((html.match(/class="inv-mem"/g) || []).length, count);
    const first = getRoot().querySelectorAll('.inv-dcard')[0];
    first.click();
    first.click();
    assert.strictEqual(calls, 1, `members=${count}: onChoiceは二重発火しない`);
  });
})();

loadGame({ full: true });

(function inverseTriggerFixesThreeMembersWithoutConsumingMainRng() {
  const fired = fighter(201, '発起人', 70, { grudge: { vsOrgId: 'player', intensity: 100 } });
  const top = fighter(202, 'OVR上位', 95);
  const second = fighter(203, 'OVR次点', 85);
  const injured = fighter(204, '負傷者', 120, { injury: { type: 'minor', weeksLeft: 1 } });
  const target = fighter(1, '迎撃対象', 80);
  const homeMateA = fighter(2, '迎撃仲間A', 75);
  const homeMateB = fighter(3, '迎撃仲間B', 70);
  const relKey = Engine.relationships._key(fired.id, target.id);
  const state = {
    season: 1, week: 4, rngSeed: 42, orgPop: 50, roster: [target, homeMateA, homeMateB],
    aiOrgs: { rival: { name: '敵団体', roster: [fired, second, injured, top] } },
    rivalOrgNames: { rival: '敵団体' }, relationships: { [relKey]: { rivalry: 100, bond: 50 } },
    challengeRequest: { pendingThisWeek: null, acceptedThisSeason: 0, perOrgThisSeason: {}, cdByFighter: {}, cdByPair: {} },
  };
  const rng = Engine.rng.create(999);
  const before = JSON.stringify(rng);
  const next = Engine.challengeRequest.processWeekly(state, rng);
  const pending = next.challengeRequest.pendingThisWeek;
  assert.ok(pending && pending._inverse, 'inverse挑戦が発火する');
  assert.deepStrictEqual(pending.memberIds, [201, 202, 203], '発起人+負傷者を除くOVR上位2名を固定する');
  assert.strictEqual(JSON.stringify(rng), before, '相手3名選出は本流rngを消費しない');
  const card = Engine.challengeRequest.buildMatchCard(next);
  assert.deepStrictEqual(card.teamA.map(member => member.id), [201, 202, 203], '固定した敵3名を予約カードへ引き継ぐ');
})();

console.log('ch1-challenge-flow-test: ok');
