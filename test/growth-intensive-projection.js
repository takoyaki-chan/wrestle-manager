#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — Growth "Intensive Grinder" Regime Projection
//
//  ■ 目的（計測専用。リバランス数値の提案・src/改変は一切行わない）
//    「追い込み(intensive)を毎週きっちり積む能動プレイヤー」の成長速度を、
//    growth-baseline-measure.js（AI＋放置プレイヤー・到達率中央値80%）とは
//    切り離した別レジームとして実測する。実機で報告されている「3年目で
//    素質MAX/OVR100+に届く」症状が、追い込み込みのモデルで再現するかを見る。
//
//  ■ 方式: 決定論的（週次ループ）プロジェクション
//    本番の Engine.growth.calcGrowth と GROWTH_CONFIG（追い込み倍率/条件/連続
//    上限）をロードしたエンジンからそのまま呼ぶ。draft/興行/AI団体/週次ループ
//    全体（tickWeek）は使わない — ALL_CHARS の実キャラを Engine.makeChar で
//    初期化し、デビュー〜27歳まで「週次で intensive か practice/rest かを選ぶ」
//    という単純な意思決定ループを自前で回す（全シーズンauto-simより軽量・
//    「追い込み変数」だけを isolatte できる）。
//
//  ■ 3レジーム
//    (I) 追い込みレジーム: condition>=50 かつ 直近連続intensive週数<2 の間は
//        毎週 intensive。条件を満たさない週は rest（次のintensive適格に最速で
//        戻るための唯一の回復手段。practiceはconditionをさらに消耗するため
//        非合理）。spec §6 の連続上限2週・必要condition50・消耗2倍(実装は
//        5+rand(0-5)固定量)・怪我3%をそのまま反映。
//    (N) 通常練習レジーム: 常にpracticeを選択（条件が本番の自動休養ライン
//        condition<60を割った週のみrest — 本番のschedule='practice'固定運用と
//        同じ automatic safety net）。intensiveは一切使わない。
//    (I2) 間欠追い込みレジーム: 2週 intensive → 2週 practice を繰り返す。
//        intensive適格でない週と通常練習のcondition<60は、本番と同じくrestへ置換する。
//    両レジームとも同一の初期キャラクター（同じtrainCap/初期ステ/特性、
//    Engine.makeCharで1回だけ生成し複製）から出発する。週次rngストリームは
//    レジームごとに独立（同一キャラの中でI/Nを揃えるcontrolled comparisonは
//    「出発条件を揃える」ことで達成し、週次乱数までは揃えていない — 個体数と
//    観測期間が十分あるため週次ノイズは平均化される、という前提。see 注記）。
//
//  ■ スコープ外（正直に明記）
//    - 試合成長(spec §7)・プロモ人気成長・合宿/専属トレーナー/絶好調/孤立
//      デバフ等の外部乗数は一切適用しない。calcGrowthの「練習成長」だけを
//      isolateしている。→ MN(mn)は仕様上「練習では伸びない・試合でのみ成長する
//      innateステ」のため、本プロジェクションでは初期値のまま完全に固定される。
//      これは5ステOVR比率に対する構造的な下限バイアスであり、実プレイでは
//      試合成長分だけ本測定より到達が速い（＝本測定は「追い込みだけでどこまで
//      いくか」の保守的な下限線）。
//    - コーチは「装着中・スタイル一致の標準コーチ」を固定値 coachOverrideMul
//      (spec §3.1 specialist一致 ×1.08) で両レジーム共通に与える。コーチ雇用
//      サブシステム（G.coaches/assign）は使わない（calcGrowthのoverrideCoachMul
//      引数を使うと限界突破/弱点克服/才能開花/新人育成/根性練習が全て無効化
//      される仕様のため、これらの上振れ要因も両レジームとも計上していない）。
//    - lockerRoomMorale=60固定（§8.1の成長ゼロ判定は発火しない中立値）。
//    - 週数=48/season固定（オフシーズン中の特殊イベント週は考慮しない）。
//
//  Usage:
//    node test/growth-intensive-projection.js [seed] [outFile.json] [--gamma 1.6] [--heat A|B|off]
//    node test/growth-intensive-projection.js --grid --json
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

const argv = process.argv.slice(2);
const positional = [];
for (let index = 0; index < argv.length; index++) {
  if (argv[index] === '--gamma' || argv[index] === '--heat' || argv[index] === '--baseLearning') { index++; continue; }
  if (!argv[index].startsWith('--')) positional.push(argv[index]);
}
const optionValue = (name, fallback = null) => {
  const idx = argv.indexOf(name);
  return idx >= 0 && argv[idx + 1] != null ? argv[idx + 1] : fallback;
};
const outputJson = argv.includes('--json');
const gridMode = argv.includes('--grid');
const userSeed = positional[0] ? parseInt(positional[0], 10) : 20260721;
const outFile = positional[1] || null;
const requestedGamma = Number(optionValue('--gamma', process.env.WM_BRAKE_GAMMA || '1.0'));
const requestedHeat = optionValue('--heat', process.env.WM_INTENSIVE_HEAT || 'off');
// P3b較正用: baseLearningの上書き(未指定なら data.js の GROWTH_CONFIG.baseLearning のまま)
const requestedBaseLearning = optionValue('--baseLearning', process.env.WM_BASE_LEARNING || null);
const HEAT_TABLES = { off: null, A: [1.8, 1.5, 1.25, 1.0], B: [1.8, 1.6, 1.4, 1.2, 1.0] };

if (!HEAT_TABLES.hasOwnProperty(requestedHeat)) throw new Error(`Unknown heat table: ${requestedHeat}`);
if (!Number.isFinite(requestedGamma) || requestedGamma <= 0) throw new Error(`Invalid brake gamma: ${requestedGamma}`);

if (!outputJson) {
  console.log('=== Growth Intensive-Grinder Regime Projection ===');
  console.log(`seed=${userSeed}`);
}

global.window = { IS_TRIAL: false };

// ── ソースコードをグローバルスコープで読み込む（test/growth-baseline-measure.js と同じ方式。
//    そのファイル自体は編集しない・別プロセス使用中のため読み取りもしない） ──
const srcDir = path.join(__dirname, '..', 'src');
function readSource(filename) {
  return fs.readFileSync(path.join(srcDir, filename), 'utf-8');
}
function loadAsGlobal(filename) {
  let code = readSource(filename);
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('coach-lines.js');
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('flag-dialogue.js');
loadAsGlobal('factions.js');
loadAsGlobal('draft-negotiation.js');

function injectGrowthConfig(brakeGamma, heatName) {
  GROWTH_CONFIG.brakeGamma = brakeGamma;
  GROWTH_CONFIG.intensiveHeatTable = HEAT_TABLES[heatName];
  if (requestedBaseLearning != null) {
    const bl = Number(requestedBaseLearning);
    if (!Number.isFinite(bl) || bl <= 0) throw new Error(`Invalid baseLearning: ${requestedBaseLearning}`);
    GROWTH_CONFIG.baseLearning = bl;
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  仮定（すべてレポートに明記する数値）
// ══════════════════════════════════════════════════════════════════════════
const ASSUMPTIONS = {
  coachOverrideMul: 1.08,   // spec §3.1 specialist一致コーチ。両レジーム共通なので比較には影響しない
  lockerRoomMorale: 60,     // 中立（§8.1 成長ゼロ判定は発火しない）
  weeksPerSeason: 48,
  debutAges: [17, 18, 19],  // フルウィンドウ cohort 条件（baseline scriptと同じ <=19）からランダム抽選
};

const STAT4 = ['pw', 'sp', 'te', 'st'];
const STAT5 = ['pw', 'sp', 'te', 'st', 'mn'];
function sum4(o) { return STAT4.reduce((s, k) => s + (o[k] || 0), 0); }
function sum5(o) { return STAT5.reduce((s, k) => s + (o[k] || 0), 0); }
function ovr5(o) { return Math.round(sum5(o) / 5); }
function ovr4(o) { return Math.round(sum4(o) / 4); }

// ── tier分類: growth-baseline-measure.js の SPEC_TARGETS 区分と揃える ──
const SPEC_TARGETS = [
  { label: '低帯', anchor: 76, target: 0.92 },
  { label: '中帯', anchor: 88, target: 0.92 },
  { label: '上帯', anchor: 97, target: 0.92 },
  { label: 'エース', anchor: 107, target: 0.91 },
];
function tierFor(trainCapOvr5) {
  if (trainCapOvr5 < 82) return SPEC_TARGETS[0];
  if (trainCapOvr5 < 93) return SPEC_TARGETS[1];
  if (trainCapOvr5 < 103) return SPEC_TARGETS[2];
  return SPEC_TARGETS[3];
}

function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN; }
function median(arr) {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function pct(n, d) { return d > 0 ? (100 * n / d) : NaN; }

// ══════════════════════════════════════════════════════════════════════════
//  初期キャラクター生成（ALL_CHARS 全員、両レジーム共通の出発点を1回だけ作る）
// ══════════════════════════════════════════════════════════════════════════
function buildInitialCharacters(seed) {
  return ALL_CHARS.map(template => {
    const ageRng = Engine.rng.create(Engine.rng.derive(seed, 0xA9E, template.id));
    const age = ASSUMPTIONS.debutAges[Engine.rng.int(ageRng, 0, ASSUMPTIONS.debutAges.length - 1)];
    const mkRng = Engine.rng.create(Engine.rng.derive(seed, 0xC4A2, template.id));
    return Engine.makeChar(template, mkRng, { age });
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  1キャラ・1レジームの週次シミュレーション
// ══════════════════════════════════════════════════════════════════════════
function simulateRegime(baseChar, regime, seed) {
  let c = JSON.parse(JSON.stringify(baseChar));
  c.intensive = false;
  c.intensiveWeeks = 0;
  c.injury = null;

  const startAge = c.age;
  const trainCapOvr5 = ovr5(c.trainCap);
  const trainCapOvr4 = ovr4(c.trainCap);
  const initOvr5 = ovr5(c);
  const initOvr4 = ovr4(c);

  const rng = Engine.rng.create(Engine.rng.derive(seed, regime === 'I' ? 0x1171 : 0x0EEE, baseChar.id));
  const miniG = { roster: [c], coaches: [], lockerRoomMorale: ASSUMPTIONS.lockerRoomMorale, season: 1, week: 1 };

  const milestone5 = { p90: null, p95: null, p98: null, p100: null };
  const milestone4 = { p90: null, p95: null, p98: null, p100: null };
  const seasonSnapshots = [];

  let intensiveWeeksTotal = 0, practiceWeeksTotal = 0, restWeeksTotal = 0, injuryEventsTotal = 0, injuryWeeksTotal = 0;

  const maxSeasons = 26 - startAge + 1; // ageMul(27+)=0（実装）なので age<=26 の間だけ練習を積む
  for (let s = 1; s <= maxSeasons; s++) {
    c.age = startAge + (s - 1);
    miniG.season = s;

    for (let w = 1; w <= ASSUMPTIONS.weeksPerSeason; w++) {
      miniG.week = w;
      miniG.roster = [c];

      if (c.injury) {
        c.injury.weeksLeft -= 1;
        c.condition = Math.min(100, c.condition + 5 + Engine.rng.int(rng, 0, 4));
        if (c.injury.weeksLeft <= 0) c.injury = null;
        c.intensive = false;
        injuryWeeksTotal++;
        continue;
      }

      let action;
      if (regime === 'I') {
        const eligible = c.condition >= GROWTH_CONFIG.intensiveMinCond && (c.intensiveWeeks || 0) < GROWTH_CONFIG.intensiveMaxConsec;
        action = eligible ? 'intensive' : 'rest';
      } else if (regime === 'I2') {
        const intensivePhase = (w - 1) % 4 < 2;
        if (intensivePhase) {
          const eligible = c.condition >= GROWTH_CONFIG.intensiveMinCond && (c.intensiveWeeks || 0) < GROWTH_CONFIG.intensiveMaxConsec;
          action = eligible ? 'intensive' : 'rest';
        } else {
          action = c.condition < 60 ? 'rest' : 'practice';
        }
      } else {
        action = c.condition < 60 ? 'rest' : 'practice'; // 本番の自動休養ライン（condition<60）をそのまま反映
      }

      if (action === 'intensive') {
        c.intensive = true;
        const growStat = Engine.coach.pickGrowthStat(rng, miniG, c.id);
        const growth = Engine.growth.calcGrowth(rng, miniG, c, growStat, ASSUMPTIONS.coachOverrideMul);
        if (growth > 0) {
          // P3b: 本番の呼び出し元と同じ端数持ち越し(settleGrowthFraction)で整数化する
          const cap = c.trainCap[growStat];
          const settled = Engine.growth.settleGrowthFraction(c._growthFrac, growth, Math.max(0, cap - c[growStat]));
          c._growthFrac = settled.frac;
          c[growStat] += settled.gain;
        }
        const ironBonusI = Traits.has(c, '鉄人') ? 2 : 0;
        const hardWorkerBonusI = Traits.has(c, '努力家') ? 1 : 0;
        c.condition = Math.max(0, c.condition - Math.round(5 + Engine.rng.int(rng, 0, 5)) + ironBonusI + hardWorkerBonusI);
        if (Engine.rng.float(rng) < GROWTH_CONFIG.intensiveInjuryChance) {
          const weeks = 1 + Engine.rng.int(rng, 0, 1);
          c.injury = { type: '練習負傷', weeksLeft: weeks };
          injuryEventsTotal++;
        }
        c.intensiveWeeks = (c.intensiveWeeks || 0) + 1;
        if (GROWTH_CONFIG.intensiveHeatTable !== null) {
          c._heat = Math.min((c._heat ?? 0) + 1, GROWTH_CONFIG.intensiveHeatTable.length - 1);
        }
        c.intensive = false;
        intensiveWeeksTotal++;
      } else if (action === 'practice') {
        c.intensive = false;
        const growStat = Engine.coach.pickGrowthStat(rng, miniG, c.id);
        const growth = Engine.growth.calcGrowth(rng, miniG, c, growStat, ASSUMPTIONS.coachOverrideMul);
        if (growth > 0) {
          // P3b: 本番の呼び出し元と同じ端数持ち越し(settleGrowthFraction)で整数化する
          const cap = c.trainCap[growStat];
          const settled = Engine.growth.settleGrowthFraction(c._growthFrac, growth, Math.max(0, cap - c[growStat]));
          c._growthFrac = settled.frac;
          c[growStat] += settled.gain;
        }
        const ironBonus = Traits.has(c, '鉄人') ? 2 : 0;
        const hardWorkerBonus = Traits.has(c, '努力家') ? 1 : 0;
        c.condition = Math.max(0, c.condition - (3 + Engine.rng.int(rng, 0, 3)) + ironBonus + hardWorkerBonus);
        c.intensiveWeeks = 0;
        if (GROWTH_CONFIG.intensiveHeatTable !== null) c._heat = Math.max(0, (c._heat ?? 0) - 1);
        practiceWeeksTotal++;
      } else { // rest
        c.intensive = false;
        const restIronBonus = Traits.has(c, '鉄人') ? 3 : 0;
        c.condition = Math.min(100, c.condition + (8 + Engine.rng.int(rng, 0, 7)) + restIronBonus);
        c.intensiveWeeks = 0;
        if (GROWTH_CONFIG.intensiveHeatTable !== null) c._heat = Math.max(0, (c._heat ?? 0) - 2);
        restWeeksTotal++;
      }

      const r5 = trainCapOvr5 > 0 ? ovr5(c) / trainCapOvr5 : 0;
      const r4 = trainCapOvr4 > 0 ? ovr4(c) / trainCapOvr4 : 0;
      const absWeek = (s - 1) * ASSUMPTIONS.weeksPerSeason + w;
      if (milestone5.p90 === null && r5 >= 0.90) milestone5.p90 = { season: s, absWeek };
      if (milestone5.p95 === null && r5 >= 0.95) milestone5.p95 = { season: s, absWeek };
      if (milestone5.p98 === null && r5 >= 0.98) milestone5.p98 = { season: s, absWeek };
      if (milestone5.p100 === null && r5 >= 1.00) milestone5.p100 = { season: s, absWeek };
      if (milestone4.p90 === null && r4 >= 0.90) milestone4.p90 = { season: s, absWeek };
      if (milestone4.p95 === null && r4 >= 0.95) milestone4.p95 = { season: s, absWeek };
      if (milestone4.p98 === null && r4 >= 0.98) milestone4.p98 = { season: s, absWeek };
      if (milestone4.p100 === null && r4 >= 1.00) milestone4.p100 = { season: s, absWeek };
    }

    seasonSnapshots.push({
      season: s, age: c.age,
      ovr5: ovr5(c), ovr4: ovr4(c),
      ratio5: trainCapOvr5 > 0 ? ovr5(c) / trainCapOvr5 : 0,
      ratio4: trainCapOvr4 > 0 ? ovr4(c) / trainCapOvr4 : 0,
    });
  }
  c.age = startAge + maxSeasons; // 27歳到達（それ以降 ageMul=0 のため打ち止め）

  return {
    id: c.id, name: c.name, style: c.style, traits: c.traits,
    startAge, finalAge: c.age,
    trainCapOvr5, trainCapOvr4, initOvr5, initOvr4,
    finalOvr5: ovr5(c), finalOvr4: ovr4(c),
    finalStats: { pw: c.pw, sp: c.sp, te: c.te, st: c.st, mn: c.mn },
    seasonSnapshots,
    milestone5, milestone4,
    intensiveWeeksTotal, practiceWeeksTotal, restWeeksTotal, injuryEventsTotal, injuryWeeksTotal,
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  実行
// ══════════════════════════════════════════════════════════════════════════
function summarizeRegime(recs) {
  const s3 = recs.map(r => seasonNSnapshot(r, 3));
  const ace = recs.filter(r => tierFor(r.trainCapOvr5).label === 'エース');
  const annual4 = recs.flatMap(r => r.seasonSnapshots.map((snapshot, idx) => {
    const previous = idx === 0 ? r.initOvr4 : r.seasonSnapshots[idx - 1].ovr4;
    return snapshot.ovr4 - previous;
  }));
  const at = (rows, predicate) => rows.filter(predicate).length;
  return {
    n: recs.length,
    final4MedianPct: median(recs.map(r => r.finalOvr4 / r.trainCapOvr4)) * 100,
    final4At98Pct: pct(at(recs, r => r.finalOvr4 / r.trainCapOvr4 >= 0.98), recs.length),
    finalOvr100Pct: pct(at(recs, r => r.finalOvr5 >= 100), recs.length),
    aceOvr100Pct: pct(at(ace, r => r.finalOvr5 >= 100), ace.length),
    year3TrainCap4MedianPct: median(s3.map(s => s.ratio4)) * 100,
    year3At90Pct: pct(at(s3, s => s.ratio4 >= 0.90), s3.length),
    annualGrowth4Mean: mean(annual4),
  };
}

function runConfiguration(brakeGamma, heatName, initChars) {
  injectGrowthConfig(brakeGamma, heatName);
  const results = { N: [], I: [], I2: [] };
  initChars.forEach(base => {
    results.N.push(simulateRegime(base, 'N', userSeed));
    results.I.push(simulateRegime(base, 'I', userSeed));
    results.I2.push(simulateRegime(base, 'I2', userSeed));
  });
  const summary = {
    N: summarizeRegime(results.N),
    I: summarizeRegime(results.I),
    I2: summarizeRegime(results.I2),
  };
  return {
    brakeGamma,
    heat: heatName,
    summary,
    annualGrowth4_I_minus_I2: summary.I.annualGrowth4Mean - summary.I2.annualGrowth4Mean,
    results,
  };
}

function main() {
  const started = Date.now();
  const initChars = buildInitialCharacters(userSeed);
  if (!outputJson) console.log(`初期キャラ生成: ${initChars.length}名（ALL_CHARS全員、デビュー年齢17-19からランダム抽選）`);
  const configs = gridMode
    ? [1.0, 1.3, 1.6, 2.0].flatMap(brakeGamma => ['off', 'A', 'B'].map(heat => ({ brakeGamma, heat })))
    : [{ brakeGamma: requestedGamma, heat: requestedHeat }];
  const runs = configs.map(config => runConfiguration(config.brakeGamma, config.heat, initChars));
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const output = {
    seed: userSeed,
    assumptions: ASSUMPTIONS,
    characterCount: initChars.length,
    runs: runs.map(({ results, ...run }) => run),
  };

  if (outFile) {
    fs.writeFileSync(outFile, JSON.stringify(output));
    if (!outputJson) console.log(`written: ${outFile}`);
  }
  if (outputJson) {
    console.log(JSON.stringify(output));
    return;
  }
  console.log(`done. characters=${initChars.length} elapsed=${elapsed}s`);
  const first = runs[0];
  console.log(`[lever] gamma=${first.brakeGamma} heat=${first.heat} I-I2 annual4=${first.annualGrowth4_I_minus_I2.toFixed(3)}`);
  printReport(first.results.I, first.results.N);
  console.log(`  (I2) 4stat最終中央値=${first.summary.I2.final4MedianPct.toFixed(1)}% / 98%到達=${first.summary.I2.final4At98Pct.toFixed(1)}% / 年間4stat成長=${first.summary.I2.annualGrowth4Mean.toFixed(3)}`);
}

function seasonNSnapshot(rec, seasonIdx) {
  return rec.seasonSnapshots.find(s => s.season === seasonIdx) || rec.seasonSnapshots[rec.seasonSnapshots.length - 1];
}

function printTierTable(label, recsI, recsN) {
  console.log(`\n--- ${label} (n=${recsI.length}) ---`);
  if (recsI.length === 0) { console.log('  サンプルなし'); return; }

  ['I', 'N'].forEach((tag, idx) => {
    const recs = idx === 0 ? recsI : recsN;
    const s3 = recs.map(r => seasonNSnapshot(r, 3));
    const s3Ovr = s3.map(s => s.ovr5);
    const s3Ratio = s3.map(s => s.ratio5);
    const finalOvr = recs.map(r => r.finalOvr5);
    const finalRatio = recs.map(r => r.finalOvr5 / r.trainCapOvr5);
    const finalRatio4 = recs.map(r => r.finalOvr4 / r.trainCapOvr4);
    const over100 = recs.filter(r => r.finalOvr5 >= 100).length;
    const over98 = recs.filter(r => r.finalOvr5 / r.trainCapOvr5 >= 0.98).length;
    const over98_4 = recs.filter(r => r.finalOvr4 / r.trainCapOvr4 >= 0.98).length;
    const to98seasons = recs.map(r => r.milestone5.p98 ? r.milestone5.p98.season : null).filter(x => x != null);
    const to98seasons4 = recs.map(r => r.milestone4.p98 ? r.milestone4.p98.season : null).filter(x => x != null);
    const s3Ratio4 = s3.map(s => s.ratio4);
    const s3At90_4 = s3.filter(s => s.ratio4 >= 0.90).length;
    const s3At95_4 = s3.filter(s => s.ratio4 >= 0.95).length;
    const s3At98_4 = s3.filter(s => s.ratio4 >= 0.98).length;
    const s3AtOvr100 = s3.filter(s => s.ovr5 >= 100).length;
    const regimeName = tag === 'I' ? '(I)追い込み' : '(N)通常練習';
    console.log(`  ${regimeName}:`);
    console.log(`    3年目終了時点OVR: mean=${mean(s3Ovr).toFixed(1)} median=${median(s3Ovr).toFixed(1)}  trainCap比(5stat): mean=${(mean(s3Ratio) * 100).toFixed(1)}% median=${(median(s3Ratio) * 100).toFixed(1)}%`);
    console.log(`    3年目終了時点trainCap比(4stat): mean=${(mean(s3Ratio4) * 100).toFixed(1)}% median=${(median(s3Ratio4) * 100).toFixed(1)}%`);
    console.log(`    ★3年目時点で既に4stat90%/95%/98%到達済み: ${s3At90_4}/${recs.length}=${pct(s3At90_4, recs.length).toFixed(1)}% / ${s3At95_4}/${recs.length}=${pct(s3At95_4, recs.length).toFixed(1)}% / ${s3At98_4}/${recs.length}=${pct(s3At98_4, recs.length).toFixed(1)}%`);
    console.log(`    ★3年目時点で既にOVR>=100: ${s3AtOvr100}/${recs.length}=${pct(s3AtOvr100, recs.length).toFixed(1)}%`);
    console.log(`    最終OVR(27歳打止め): mean=${mean(finalOvr).toFixed(1)} median=${median(finalOvr).toFixed(1)}  trainCap比(5stat): mean=${(mean(finalRatio) * 100).toFixed(1)}% median=${(median(finalRatio) * 100).toFixed(1)}%`);
    console.log(`    trainCap比(4stat,MN除く訓練可能ステのみ): mean=${(mean(finalRatio4) * 100).toFixed(1)}% median=${(median(finalRatio4) * 100).toFixed(1)}%`);
    console.log(`    最終OVR>=100 割合: ${over100}/${recs.length} = ${pct(over100, recs.length).toFixed(1)}%`);
    console.log(`    trainCap98%以上到達(5stat): ${over98}/${recs.length} = ${pct(over98, recs.length).toFixed(1)}%  (4stat): ${over98_4}/${recs.length} = ${pct(over98_4, recs.length).toFixed(1)}%`);
    console.log(`    98%到達までのシーズン数(到達者のみ,5stat): n=${to98seasons.length} mean=${mean(to98seasons).toFixed(1)} median=${median(to98seasons)}`);
    console.log(`    98%到達までのシーズン数(到達者のみ,4stat): n=${to98seasons4.length} mean=${mean(to98seasons4).toFixed(1)} median=${median(to98seasons4)}`);
    if (tag === 'I') {
      const avgIntWeeks = mean(recs.map(r => r.intensiveWeeksTotal));
      const avgTotalWeeks = mean(recs.map(r => r.intensiveWeeksTotal + r.practiceWeeksTotal + r.restWeeksTotal + r.injuryWeeksTotal));
      console.log(`    週内訳(平均): intensive=${avgIntWeeks.toFixed(1)}週 (${pct(avgIntWeeks, avgTotalWeeks).toFixed(1)}%)  怪我発生回数平均=${mean(recs.map(r => r.injuryEventsTotal)).toFixed(2)}`);
    }
  });

  // 差分（I - N）
  const diffFinalRatio = mean(recsI.map(r => r.finalOvr5 / r.trainCapOvr5)) - mean(recsN.map(r => r.finalOvr5 / r.trainCapOvr5));
  const diffS3Ratio = mean(recsI.map(r => seasonNSnapshot(r, 3).ratio5)) - mean(recsN.map(r => seasonNSnapshot(r, 3).ratio5));
  console.log(`  差分(I-N): 3年目trainCap比 +${(diffS3Ratio * 100).toFixed(1)}pt / 最終trainCap比 +${(diffFinalRatio * 100).toFixed(1)}pt`);
}

function printReport(resultsI, resultsN) {
  console.log('\n========================================================');
  console.log(' Growth Intensive-Grinder Regime Projection — Report');
  console.log('========================================================');

  console.log('\n[前提条件] ' + JSON.stringify(ASSUMPTIONS));
  console.log('[GROWTH_CONFIG] ' + JSON.stringify(GROWTH_CONFIG));

  // 全体
  printTierTable('全体', resultsI, resultsN);

  // tier別
  SPEC_TARGETS.forEach(t => {
    const idxs = resultsI.map((r, i) => i).filter(i => tierFor(resultsI[i].trainCapOvr5) === t);
    const recsI = idxs.map(i => resultsI[i]);
    const recsN = idxs.map(i => resultsN[i]);
    printTierTable(`${t.label}(基準trainCap≈${t.anchor}, spec目標${(t.target * 100).toFixed(0)}%)`, recsI, recsN);
  });

  // spec目標との比較まとめ
  console.log('\n--- spec §9 設計目標(90-92%収束)との比較まとめ ---');
  SPEC_TARGETS.forEach(t => {
    const idxs = resultsI.map((r, i) => i).filter(i => tierFor(resultsI[i].trainCapOvr5) === t);
    if (idxs.length === 0) return;
    const recsI = idxs.map(i => resultsI[i]);
    const recsN = idxs.map(i => resultsN[i]);
    const meanRatioI = mean(recsI.map(r => r.finalOvr5 / r.trainCapOvr5));
    const meanRatioN = mean(recsN.map(r => r.finalOvr5 / r.trainCapOvr5));
    console.log(`  ${t.label}: 目標${(t.target * 100).toFixed(0)}%  (N)通常=${(meanRatioN * 100).toFixed(1)}%(差${meanRatioN >= t.target ? '+' : ''}${((meanRatioN - t.target) * 100).toFixed(1)}pt)  (I)追い込み=${(meanRatioI * 100).toFixed(1)}%(差${meanRatioI >= t.target ? '+' : ''}${((meanRatioI - t.target) * 100).toFixed(1)}pt)`);
  });

  console.log('\n[注記] MN(mental)は仕様上「練習では伸びない・試合成長のみ」のステータスのため、本プロジェクション');
  console.log('       （練習成長のみを対象）ではMNが初期値のまま完全に固定される。5stat OVR/trainCap比はこの分だけ');
  console.log('       構造的に下限バイアスがかかる（実プレイでは試合成長でさらに伸びる）。4stat(MN除く)比率を');
  console.log('       あわせて参照すること。');
}

main();
