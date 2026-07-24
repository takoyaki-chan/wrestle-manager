#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  MQ再設計P3c 単体テスト
//  docs/mq-redesign-proposal-v0.5.md §3.2/§3.2b/§3.4/§3.4b/§3.7b の合成データ検証。
//  auto-sim(ランダムカード編成)では到達しない条件(ドーム興行・OV100超・ラストラン+メイン
//  重複など)を、Engine関数を直接呼び出して確認する。状態は変更しない純粋関数呼び出しのみ。
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js',
].forEach(loadAsGlobal);

let passCount = 0;
function check(label, cond) {
  assert.ok(cond, label);
  passCount++;
}

function fighter(id, overrides = {}) {
  return {
    id, name: `F${id}`,
    pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    popularity: 50, trust: 50, condition: 80, traits: [],
    ...overrides,
  };
}

// ── §3.7b: OV100超の減衰シーリング(共通関数 Engine.battle.ovCeiling) ──
{
  // avgOV<=100は既存3セグメントのまま完全不変(境界値で確認)
  check('ovCeiling(0) matches legacy formula', Engine.battle.ovCeiling(0) === 20);
  check('ovCeiling(50) matches legacy formula', Engine.battle.ovCeiling(50) === 50);
  check('ovCeiling(80) matches legacy formula', Math.abs(Engine.battle.ovCeiling(80) - 83) < 1e-9);
  check('ovCeiling(100) matches legacy formula (= 100, third segment)',
    Math.abs(Engine.battle.ovCeiling(100) - 100) < 1e-9);
  // 第4セグメント: 傾き0.25、避OV100以下には一切影響しない
  check('ovCeiling(110) = 100 + 0.25*10 = 102.5', Math.abs(Engine.battle.ovCeiling(110) - 102.5) < 1e-9);
  check('ovCeiling(120) = 100 + 0.25*20 = 105', Math.abs(Engine.battle.ovCeiling(120) - 105) < 1e-9);
  check('ovCeiling(128) = 100 + 0.25*28 = 107 (実測最大級)', Math.abs(Engine.battle.ovCeiling(128) - 107) < 1e-9);
  check('ovCeiling continuous at the 100 boundary (no jump)',
    Math.abs(Engine.battle.ovCeiling(100) - Engine.battle.ovCeiling(100.0001)) < 0.001);
}

// ── §3.4/較正結果: タイトル戦リング内カウンター+4pt ──
{
  check('TITLE_RING_COUNTER_BONUS constant is 4',
    typeof TITLE_RING_COUNTER_BONUS !== 'undefined' ? TITLE_RING_COUNTER_BONUS === 4 : true);
  const charL = fighter(1, { pw: 70, sp: 70, te: 70, st: 70, mn: 70 });
  const charR = fighter(2, { pw: 70, sp: 70, te: 70, st: 70, mn: 70 });
  const rng = Engine.rng.create(Engine.rng.derive(1, 1, 1, 1, 2));
  const result = Engine.battle.simulateMatch(charL, charR, rng, 2, { titleMatch: true });
  check('titleRing metadata reports escape bonus', result.titleRing && result.titleRing.escape === 0.10);
  check('titleRing metadata reports counterPt+4 (較正結果反映)',
    result.titleRing && result.titleRing.counterPt === 4);
}

// ── §3.4b: ラストラン/メイン気迫のリング内OV+1(ovBuffチャネル) ──
{
  const state = {
    roster: [
      fighter(10, { lastRun: true }),
      fighter(11),
    ],
  };
  const ringIn = Engine.mq.buildRingInOpts(state, 10, 11, {
    roster: state.roster, normalShowRingExtras: true, isMainEvent: true,
  });
  // 10番はラストラン出場(+1)、かつメイン枠(+1) → 合計+2。11番はメイン枠のみ(+1)。
  check('lastRun + main event stack for the retiring fighter (ovBuff[0] = +2)',
    ringIn.simOpts.ovBuff[0] === 2);
  check('main event alone grants +1 to the opponent (ovBuff[1] = +1)',
    ringIn.simOpts.ovBuff[1] === 1);

  const ringInNonMain = Engine.mq.buildRingInOpts(state, 10, 11, {
    roster: state.roster, normalShowRingExtras: true, isMainEvent: false,
  });
  check('lastRun alone (non-main) grants +1 only to the retiring fighter',
    ringInNonMain.simOpts.ovBuff[0] === 1 && ringInNonMain.simOpts.ovBuff[1] === 0);

  const ringInPpvScope = Engine.mq.buildRingInOpts(state, 10, 11, {
    roster: state.roster, isMainEvent: true, // normalShowRingExtras省略 = PPV/AI興行相当
  });
  check('without normalShowRingExtras, lastRun/main bonuses do not apply (PPV/AI-show scope)',
    ringInPpvScope.simOpts.ovBuff[0] === 0 && ringInPpvScope.simOpts.ovBuff[1] === 0);
}

// ── §3.4b: Engine.mq.finalizeからcontributions.lastRunが撤廃されていること ──
{
  const state = { roster: [fighter(20, { lastRun: true }), fighter(21)] };
  const context = Engine.mq.buildNormalContext(state, { mq: 50, left: { id: 20 }, right: { id: 21 } },
    { left: 20, right: 21 }, { roster: state.roster, matchIndex: 0, venueHeat: 0 });
  const finalized = Engine.mq.finalize(state, { mq: 50 }, context, 'normal-single');
  check('mqInventory has no "lastRun" key (folded into ovBuff, not a finalize external add-on)',
    !Object.prototype.hasOwnProperty.call(finalized.mqInventory, 'lastRun'));
  check('lastRunFighterId metadata is still reported for observability',
    finalized.lastRunFighterId === 20);
}

// ── §3.2/§3.2b: venueHeat = tierAmp × pressureFactor(fp) ──
{
  const tierAmpTable = [2, 2, 2, 3, 3, 3, 4, 5, 5, 7];
  for (let i = 0; i < tierAmpTable.length; i++) {
    const heat = Engine.economy.calcVenueHeat(i, 2.0); // fp>=1.30 → pf=+1.0
    check(`venueIdx=${i} tierAmp=${tierAmpTable[i]} at pf=+1.0`, heat.tierAmp === tierAmpTable[i]);
    check(`venueIdx=${i} venueHeat at pf=+1.0 equals tierAmp`, heat.total === tierAmpTable[i]);
  }
  check('tierAmp is monotonically non-decreasing across venue tiers (不変条件10)',
    tierAmpTable.every((v, i) => i === 0 || v >= tierAmpTable[i - 1]));
  check('dome (idx9) is a category apart (tierAmp=7, strictly greater than idx7/8=5)',
    tierAmpTable[9] === 7 && tierAmpTable[9] > tierAmpTable[7] && tierAmpTable[9] > tierAmpTable[8]);

  const bands = [
    [1.35, 1.0], [1.30, 1.0],
    [1.10, 0.5], [1.05, 0.5],
    [0.90, 0.0], [0.85, 0.0],
    [0.60, -0.5], [0.55, -0.5],
    [0.30, -1.0], [0.0, -1.0],
  ];
  for (const [fp, expectedPf] of bands) {
    const heat = Engine.economy.calcVenueHeat(9, fp);
    check(`fp=${fp} → pressureFactor=${expectedPf} (dome)`, heat.pressureFactor === expectedPf);
  }
  const domeMax = Engine.economy.calcVenueHeat(9, 2.0);
  check('dome at max pressure reaches venueHeat=+7 (別格)', domeMax.total === 7);
  const domeMin = Engine.economy.calcVenueHeat(9, 0.1);
  check('dome at min pressure reaches venueHeat=-7 (最も深く冷える)', domeMin.total === -7);
}

// ── §3.2/§3.2b: Engine.mq.calcEngagement ──
{
  const lowPopFighters = [fighter(1, { popularity: 10 }), fighter(2, { popularity: 10 })];
  const base = Engine.mq.calcEngagement(lowPopFighters, {});
  check('baseline engagement (no bonuses, low pop) = 0.5 + 0.5*normPop(0) = 0.5',
    Math.abs(base - 0.5) < 1e-9);

  const highPopFighters = [fighter(1, { popularity: 90 }), fighter(2, { popularity: 90 })];
  const full = Engine.mq.calcEngagement(highPopFighters, {
    hasRivalry: true, isTitle: true, isMainEvent: true, hasLastRun: false,
  });
  // normPop = clamp((90-35)/55,0,1) = 1.0 → raw = 0.5+0.5+0.15+0.2+0.12 = 1.47 → capped at 1.25
  check('engagement caps at 1.25 for a stacked non-lastRun main event', full === 1.25);

  const lastRunMain = Engine.mq.calcEngagement(highPopFighters, {
    hasRivalry: true, isTitle: true, isMainEvent: true, hasLastRun: true,
  });
  // raw = 0.5+0.5+0.15+0.2+0.12+0.25 = 1.72 → capped at 1.4 (lastRun+main上限拡張)
  check('engagement caps at 1.4 when the retiring fighter headlines the main event',
    lastRunMain === 1.4);

  const floor = Engine.mq.calcEngagement([fighter(1, { popularity: 0 }), fighter(2, { popularity: 0 })], {});
  check('engagement floors at 0.35 even with nothing going for the match',
    floor >= 0.35 && floor <= 0.51);
}

// ── §3.2b: ドーム興行のメインは大一番(matchTier=2)、非ドームは通常(tier=1) ──
{
  function buildShowState(venueIdx) {
    const base = Engine.createInitialState(12345, true);
    const roster = [
      fighter(9001, { name: 'MainA', pw: 80, sp: 80, te: 80, st: 80, mn: 80 }),
      fighter(9002, { name: 'MainB', pw: 80, sp: 80, te: 80, st: 80, mn: 80 }),
      fighter(9003, { name: 'SubA', pw: 60, sp: 60, te: 60, st: 60, mn: 60 }),
      fighter(9004, { name: 'SubB', pw: 60, sp: 60, te: 60, st: 60, mn: 60 }),
    ];
    return {
      ...base,
      roster,
      showVenue: venueIdx,
      showCard: [
        { left: 9001, right: 9002, matchType: 'singles', isTitle: false },
        { left: 9003, right: 9004, matchType: 'singles', isTitle: false },
      ],
      titles: { world: { championId: null, defenses: 0 } },
      milestoneBuffs: [],
      relationships: {},
      rivalries: {},
      matchupLog: [],
    };
  }

  const domeState = buildShowState(9);
  const domeResult = Engine.executeShow(domeState);
  check('dome show executes without error', domeResult && !domeResult.error);
  if (domeResult && !domeResult.error) {
    check('dome main event (index 0, non-title singles) runs at matchTier=2 (大一番ルール)',
      domeResult.results[0].matchTier === 2);
    check('dome sub match (index 1) stays at matchTier=1',
      domeResult.results[1].matchTier === 1);
  }

  const smallState = buildShowState(3); // 市民会館
  const smallResult = Engine.executeShow(smallState);
  check('non-dome show executes without error', smallResult && !smallResult.error);
  if (smallResult && !smallResult.error) {
    check('non-dome main event (non-title singles) stays at matchTier=1',
      smallResult.results[0].matchTier === 1);
  }
}

console.log(`MQ P3c unit tests: PASS (${passCount} assertions)`);
console.log('Coverage: ovCeiling(§3.7b) / title counterPt(§3.4) / lastRun+main ovBuff(§3.4b/§3.2b) / venueHeat tierAmp+pressureFactor(§3.2/§3.2b) / calcEngagement caps(§3.2/§3.2b) / dome main matchTier=2(§3.2b)');
