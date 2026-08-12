'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game.js');

loadGame({ full: true });

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');

let failed = 0;
function section(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed++;
    console.error(`  FAIL  ${name}\n        ${error.stack || error.message || error}`);
  }
}

function fresh(seed = 8819) {
  const state = Engine.createInitialState(seed, true);
  return {
    ...state,
    season: 5,
    week: 1,
    offSeason: false,
    weekPhase: 'manage',
    industryNewsQueue: [],
  };
}

function withOvr(fighter, ovr, extra = {}) {
  return {
    ...fighter,
    pw: ovr,
    sp: ovr,
    te: ovr,
    st: ovr,
    mn: ovr,
    injury: null,
    isRental: false,
    isIntrusion: false,
    condition: 80,
    ...extra,
  };
}

function awardTo(state, fighterId) {
  return Engine.unifiedTitle.awardTournamentWinner(state, fighterId).state;
}

function articleDraftPools() {
  const source = read('docs/unified-title-article-drafts-v0.1.md')
    .split('## 実装ノート')[0];
  const names = ['creation', 'crown', 'repeat', 'defense', 'move', 'retirement', 'affiliationLoss', 'return'];
  const pools = Object.fromEntries(names.map(name => [name, []]));
  let sectionIndex = -1;
  let slot = '';
  source.split('\n').forEach(line => {
    const sectionMatch = line.match(/^## ([1-8])\./);
    if (sectionMatch) {
      sectionIndex = Number(sectionMatch[1]) - 1;
      slot = '';
      return;
    }
    if (sectionIndex < 0) return;
    const slotMatch = line.match(/^\*\*(.+?)\*\*/);
    if (slotMatch) {
      slot = slotMatch[1];
      return;
    }
    let text = null;
    if (slot === '見出し案' && line.startsWith('- ')) text = line.slice(2);
    else {
      const numbered = line.match(/^\d+\. (.+)$/);
      if (numbered && !slot.startsWith('合成例')) text = numbered[1];
    }
    if (text != null) pools[names[sectionIndex]].push(text.replace(/^［.+?］/, ''));
  });
  return pools;
}

function implementedArticlePools() {
  const keys = {
    creation: ['headline', 'lead', 'circumstance', 'institution', 'closing'],
    crown: ['headline', 'lead', 'circumstance', 'historyMoved', 'historyStayed', 'closing'],
    repeat: ['headline', 'lead', 'circumstance', 'historyDefended', 'closing'],
    defense: ['headline', 'leadFirst', 'lead', 'circumstance', 'historyConsecutive', 'historyCaptured', 'closing'],
    move: ['headline', 'lead', 'circumstance', 'historyDefended', 'historyNoDefense', 'closing'],
    retirement: ['headline', 'lead', 'historyDefended', 'historyNoDefense', 'vacancy', 'closing'],
    affiliationLoss: ['headline', 'lead', 'closing'],
    return: ['headline', 'lead', 'historyStayed', 'historyMoved', 'closingEntered', 'closing'],
  };
  return Object.fromEntries(Object.entries(keys).map(([type, slots]) => [
    type,
    slots.flatMap(slot => UNIFIED_TITLE_TEMPLATES[type][slot] || []),
  ]));
}

console.log('=== 全国統一王座 P1+P2 ===');

section('初期値はnull、旧セーブはlazy-initでnullへ修復される', () => {
  const initial = fresh();
  assert.strictEqual(initial.unifiedTitle, null);
  const oldSave = { ...initial };
  delete oldSave.unifiedTitle;
  const migratedBefore = Object.keys(oldSave).filter(key => key.startsWith('_migrated_')).sort();
  const repaired = Engine.saveDoctor.repairOnLoad(oldSave);
  assert.strictEqual(repaired.state.unifiedTitle, null);
  assert.ok(repaired.changes.includes('unified_title_initialized'));
  assert.deepStrictEqual(
    Object.keys(repaired.state).filter(key => key.startsWith('_migrated_')).sort(),
    migratedBefore,
    '統一王座のロード修復は新しい_migrated_*フラグを作らない',
  );
});

section('初回授与・連覇・tvMode経路で統一王座だけを記録する', () => {
  let state = { ...fresh(), season: 4, week: 48 };
  const championId = state.roster[0].id;
  const before = state.roster.find(f => f.id === championId);
  const standardWins = before.careerRecord?.totalTitleWins || 0;
  state = awardTo(state, championId);
  assert.strictEqual(state.unifiedTitle.history.at(-1).type, 'creation');
  assert.strictEqual(state.unifiedTitle.defenses, 0);
  const after = state.roster.find(f => f.id === championId);
  assert.ok(after.popularity > before.popularity && after.popularity <= before.popularity + 8);
  assert.strictEqual(after.careerRecord?.totalTitleWins || 0, standardWins);
  assert.ok(after.careerRecord.history.some(ev => ev.type === 'unifiedTitle' && ev.result === 'won'));

  let tvState = { ...fresh(8820), season: 4, week: 48, ppvUnlocked: false };
  tvState = Engine.ppvTournament.startEntry(tvState, { tvMode: true });
  tvState = Engine.ppvTournament.ensureReady(tvState);
  const tvResult = Engine.ppvTournament.run(tvState, Engine.rng.create(8820));
  assert.ok(tvResult && !tvResult.cancelled && tvResult.championId);
  const tvApplied = Engine.ppvTournament.apply(tvState, tvResult, { tvMode: true });
  assert.strictEqual(tvApplied.state.unifiedTitle.championId, tvResult.championId,
    'プレイヤー未解禁のテレビ観戦モードでも授与する');
  assert.strictEqual(tvApplied.state.unifiedTitle.history.at(-1).type, 'creation');

  state = { ...state, season: 8, week: 47 };
  state = Engine.unifiedTitle.markTournamentReturn(state).state;
  assert.strictEqual(state.unifiedTitle.championId, championId, '返還時点ではchampionIdを保持する');
  state = { ...state, week: 48 };
  state = awardTo(state, championId);
  assert.strictEqual(state.unifiedTitle.history.at(-1).type, 'repeat');
  assert.strictEqual(state.unifiedTitle.defenses, 0);

  const management = read('src/management.js');
  const applyStart = management.indexOf('apply(state, tournamentResult, options)');
  const awardAt = management.indexOf('Engine.unifiedTitle.awardTournamentWinner', applyStart);
  const returnAt = management.indexOf('return { state: s, events };', applyStart);
  assert.ok(applyStart >= 0 && awardAt > applyStart && awardAt < returnAt,
    'ppvTournament.applyのtvMode共通コミットに授与処理が必要');
});

section('W47返還後も不成立年は前王者が保持を続ける', () => {
  let state = { ...fresh(), season: 8, week: 47 };
  const championId = state.roster[0].id;
  state = awardTo(state, championId);
  state = Engine.unifiedTitle.markTournamentReturn(state).state;
  const returned = state.unifiedTitle;
  const cancelled = Engine.ppvTournament.apply(state, { cancelled: true }, { tvMode: true });
  assert.deepStrictEqual(cancelled.unifiedTitle, returned);
  assert.strictEqual(cancelled.unifiedTitle.championId, championId);
  assert.strictEqual(cancelled.unifiedTitle.returnedSeason, 8);
});

section('引退・FA化・解雇は返上、移籍はベルトが追従する', () => {
  const reasons = ['retirement', 'affiliation', 'affiliation'];
  reasons.forEach(reason => {
    let state = fresh();
    state = awardTo(state, state.roster[0].id);
    state = Engine.unifiedTitle.vacate(state, reason, state.roster[0]);
    assert.strictEqual(state.unifiedTitle.championId, null);
    assert.strictEqual(state.unifiedTitle.orgId, null);
    assert.strictEqual(state.unifiedTitle.defenses, 0);
    assert.strictEqual(state.unifiedTitle.history.at(-1).type, 'vacate');
  });

  let state = fresh();
  const moving = state.roster[0];
  state = awardTo(state, moving.id);
  state = {
    ...state,
    roster: state.roster.filter(f => f.id !== moving.id),
    aiOrgs: {
      ...state.aiOrgs,
      org_s: { ...state.aiOrgs.org_s, roster: [...state.aiOrgs.org_s.roster, { ...moving, orgId: 'org_s' }] },
    },
  };
  state = Engine.unifiedTitle.reconcile(state, { silent: true });
  assert.strictEqual(state.unifiedTitle.championId, moving.id);
  assert.strictEqual(state.unifiedTitle.orgId, 'org_s');
});

section('四半期は最大1回、天頂戦年Q4は0回', () => {
  let state = fresh();
  state = awardTo(state, state.roster[0].id);
  state = Engine.unifiedTitle.processQuarter(state, Engine.rng.create(1));
  assert.strictEqual(state.unifiedTitle.challengePeriodKey, '5-Q1');
  assert.ok(state._pendingUnifiedIncomingMatch);
  const first = state._pendingUnifiedIncomingMatch;
  state = { ...state, week: 11, _pendingUnifiedIncomingMatch: null };
  state = Engine.unifiedTitle.processQuarter(state, Engine.rng.create(2));
  assert.strictEqual(state._pendingUnifiedIncomingMatch, null);
  assert.strictEqual(state.unifiedTitle.challengePeriodKey, '5-Q1');
  state = { ...state, season: 8, week: 37, unifiedTitle: { ...state.unifiedTitle, challengePeriodKey: null } };
  const q4 = Engine.unifiedTitle.processQuarter(state, Engine.rng.create(3));
  assert.strictEqual(q4.unifiedTitle.challengePeriodKey, null);
  assert.strictEqual(q4._pendingUnifiedIncomingMatch, null);
  assert.ok(first.challengerId != null);
});

section('挑戦者は団体最高OVR-4以内で負傷・レンタル・乱入を除外する', () => {
  let state = fresh();
  const base = state.aiOrgs.org_s.roster;
  const tuned = [
    withOvr(base[0], 90),
    withOvr(base[1], 87),
    withOvr(base[2], 86, { injury: { type: 'test' } }),
    withOvr(base[3], 89, { isRental: true }),
    withOvr(base[4], 88, { isIntrusion: true }),
    ...base.slice(5).map(f => withOvr(f, 70)),
  ];
  state = { ...state, aiOrgs: { ...state.aiOrgs, org_s: { ...state.aiOrgs.org_s, roster: tuned } } };
  const eligible = Engine.unifiedTitle.getEligibleChallengers(state, 'org_s');
  assert.deepStrictEqual(eligible.map(f => f.id), [tuned[0].id, tuned[1].id]);
  eligible.forEach(f => assert.doesNotThrow(() => Engine.unifiedTitle.assertEligibleChallenger(state, 'org_s', f.id)));
  assert.throws(() => Engine.unifiedTitle.assertEligibleChallenger(state, 'org_s', tuned[2].id), /top OVR-4/);
});

section('予約排他と1興行1タイトルを守る', () => {
  assert.strictEqual(Engine.factions.hasCompetingBooking([{ _unifiedTitleMatch: true }]), true);
  let state = fresh();
  const championId = state.roster[0].id;
  state = awardTo(state, championId);
  state = { ...state, titleEstablished: true, titles: { world: { championId: state.roster[1].id, defenses: 0 } } };
  const card = Engine.title.sanitizeShowCardTitles(state, [
    { left: championId, right: state.roster[2].id, isTitle: true, _unifiedTitleMatch: true },
    { left: state.roster[1].id, right: state.roster[3].id, isTitle: true },
  ]);
  assert.strictEqual(card.filter(m => m.isTitle).length, 1);
  assert.strictEqual(card[0]._unifiedTitleMatch, true);
  assert.strictEqual(card[1].isTitle, false);
  assert.ok(read('src/relationships.js').includes('_pendingUnifiedIncomingMatch'));
  assert.ok(read('src/relationships.js').includes('_pendingUnifiedAwayMatch'));
});

section('予約した来訪戦を通常興行で解決し、一時ゲストを残さない', () => {
  let state = { ...fresh(), week: 2 };
  const champion = state.roster[0];
  const challenger = Engine.unifiedTitle.getEligibleChallengers(state, 'org_s', champion.id)[0];
  assert.ok(challenger);
  state = awardTo(state, champion.id);
  state = {
    ...state,
    _pendingUnifiedIncomingMatch: {
      championId: champion.id,
      challengerId: challenger.id,
      challengerOrgId: 'org_s',
      periodKey: '5-Q1',
      issuedAbsWeek: Engine.util.absWeek(5, 1),
      expiresAbsWeek: Engine.util.absWeek(5, 9),
    },
  };
  const reserved = Engine.unifiedTitle.reserveIncomingMatch(state);
  assert.ok(reserved.match);
  const guest = { ...reserved.match.challenger, isUnifiedTitleGuest: true, _unifiedGuestOrgId: 'org_s' };
  state = { ...reserved.state, roster: [...reserved.state.roster, guest], showCard: [reserved.match.slot], showVenue: 0 };
  const show = Engine.executeShow(state);
  assert.ok(show && !show.error);
  assert.ok(['defense', 'move'].includes(show.state.unifiedTitle.history.at(-1).type));
  assert.ok(!show.state.roster.some(f => f.isUnifiedTitleGuest));
  const holder = Engine.unifiedTitle._findActive(show.state, show.state.unifiedTitle.championId);
  assert.ok(holder && holder.orgId === show.state.unifiedTitle.orgId);
});

section('AI保持3サイクル後にこちらの番となり、見送り・失効で0へ戻る', () => {
  let state = fresh();
  const aiChampion = state.aiOrgs.org_s.roster[0];
  state = awardTo(state, aiChampion.id);
  [1, 13, 25].forEach((week, index) => {
    state = { ...state, week, _pendingUnifiedAIMatch: null };
    state = Engine.unifiedTitle.processQuarter(state, Engine.rng.create(100 + index));
    assert.strictEqual(state.unifiedTitle.aiHolderCycles, index + 1);
  });
  state = { ...state, season: 6, week: 1, _pendingUnifiedAIMatch: null };
  state = Engine.unifiedTitle.processQuarter(state, Engine.rng.create(104));
  assert.ok(state._pendingUnifiedPlayerTurn);
  assert.strictEqual(state.unifiedTitle.history.at(-1).type, 'playerTurnOffered');
  state = Engine.unifiedTitle.declinePlayerTurn(state, 'skipped');
  assert.strictEqual(state.unifiedTitle.aiHolderCycles, 0);
  assert.strictEqual(state.unifiedTitle.history.at(-1).outcome, 'skipped');

  state = {
    ...state,
    _pendingUnifiedAwayMatch: {
      championId: aiChampion.id,
      challengerId: state.roster[0].id,
      issuedAbsWeek: 1,
      expiresAbsWeek: 2,
    },
    season: 6,
    week: 10,
    unifiedTitle: { ...state.unifiedTitle, aiHolderCycles: 3 },
  };
  state = Engine.unifiedTitle.releaseExpiredBookings(state);
  assert.strictEqual(state._pendingUnifiedAwayMatch, null);
  assert.strictEqual(state.unifiedTitle.aiHolderCycles, 0);
  assert.strictEqual(state.unifiedTitle.history.at(-1).outcome, 'expired');
});

section('防衛加算と移動・再戴冠のdefensesリセット', () => {
  let state = fresh();
  const champion = state.roster[0];
  const challenger = state.aiOrgs.org_s.roster[0];
  state = awardTo(state, champion.id);
  state = Engine.unifiedTitle.resolveMatch(state, {
    championId: champion.id,
    challengerId: challenger.id,
    winnerId: champion.id,
  });
  assert.strictEqual(state.unifiedTitle.defenses, 1);
  state = Engine.unifiedTitle.resolveMatch(state, {
    championId: champion.id,
    challengerId: challenger.id,
    winnerId: challenger.id,
  });
  assert.strictEqual(state.unifiedTitle.championId, challenger.id);
  assert.strictEqual(state.unifiedTitle.orgId, 'org_s');
  assert.strictEqual(state.unifiedTitle.defenses, 0);
  state = awardTo({ ...state, season: 8, week: 48 }, champion.id);
  assert.strictEqual(state.unifiedTitle.defenses, 0);
});

section('新聞テンプレートは承認済み草案と一字一句一致する', () => {
  const expected = articleDraftPools();
  const actual = implementedArticlePools();
  assert.deepStrictEqual(actual, expected);
  assert.strictEqual(Object.values(actual).reduce((sum, rows) => sum + rows.length, 0), 81);
  assert.strictEqual(Object.values(UNIFIED_TITLE_TEMPLATES).reduce((sum, type) => sum + type.headline.length, 0), 16);
  assert.strictEqual(81 - 16, 65);
  assert.strictEqual(UNIFIED_TITLE_TEMPLATES.creation.profileYoung, CHAMPION_CHANGE_TEMPLATES.profileYoung);
  assert.strictEqual(UNIFIED_TITLE_TEMPLATES.crown.profileRising, CHAMPION_CHANGE_TEMPLATES.profileRising);
  assert.strictEqual(UNIFIED_TITLE_TEMPLATES.move.profileVeteran, CHAMPION_CHANGE_TEMPLATES.profileVeteran);
  assert.strictEqual(UNIFIED_TITLE_TEMPLATES.affiliationLoss.vacancy, UNIFIED_TITLE_TEMPLATES.retirement.vacancy);
});

if (failed) {
  console.error(`\n${failed} section(s) failed`);
  process.exit(1);
}
console.log('\nunified-title-test: ok');
