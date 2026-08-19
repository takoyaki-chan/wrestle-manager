#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  Wrestle Manager — 試合バランス ベースラインハーネス
//  numeric-overhaul P0 (docs/numeric-overhaul-proposal-v0.1.md)
//
//  ■ 目的
//    試合エンジンの「現在の姿」を数値で凍結し、P1以降の式変更が
//    どこをどれだけ動かしたかを機械的に検出する回帰資産。
//
//  ■ RNG方式(絶対に守る — 2026-08-19 P0で実測した罠)
//    試合ごとに Engine.rng.create(Engine.rng.derive(SEED, blockHash, i, flip)) を作る。
//    これは本体(app.js/management.js)の全試合経路と同じ方式。
//    ❌ 1本のrngストリームを共有して大量試合を回すと、xorshift128+(32bit移植)の
//       長距離相関により勝率がシードで最大35ptも動く系統バイアスが出る(実測済み)。
//       スタイル間バランスの偽の強弱・尖り勝率の偽の優劣が「発見」されるので厳禁。
//
//  ■ 計測項目
//    1. anchor     — 同格(BAL100同士)の試合の姿: ターン数/カウンター/脱出/MQ/時間切れ/決着分布
//    2. gapCurve   — OVR差(0/2/5/10/15/20)と勝率の関係(格差表現)
//    3. spikeGrid  — 尖り配分(5ステ×+12/+24/+40×OVR帯60/80/100/120)の対バランス勝率
//    4. styleMatrix — 6スタイル総当たり(全員BAL100ステ固定=技プールだけの強弱)
//    ※ タッグエンジンは対象外(P1でタッグ式に触る際に追補する)
//
//  ■ 使い方
//    node test/balance-baseline.js --save    # 計測して test/baseline/balance-baseline.json に保存
//    node test/balance-baseline.js           # 計測して保存済みベースラインと比較(逸脱でexit 1)
//    node test/balance-baseline.js --quick   # 試合数1/4の高速版(開発中の当たり付け用。保存不可)
//
//  ■ 判定閾値(比較モード)
//    勝率: ±2.5pt / anchor連続値: ±8% / 時間切れ率: ±1.5pt絶対 / 決着分布: 各±3pt絶対
//    ※ 本体準拠方式でのシード間スプレッドは実測1〜2pt。±2.5ptはシード差では鳴らない
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

const args = process.argv.slice(2);
const SAVE = args.includes('--save');
const QUICK = args.includes('--quick');
const seedArg = args.find(a => /^\d+$/.test(a));
const SEED = seedArg ? parseInt(seedArg, 10) : 49107;
const SCALE = QUICK ? 0.25 : 1.0;
const BASELINE_PATH = path.join(__dirname, 'baseline', 'balance-baseline.json');

// ロード時にMath.randomが呼ばれても全ランで同一になるよう固定シード化(SEEDとは独立)
let legacyRandomState = 12345;
Math.random = function seededLegacyRandom() {
  legacyRandomState = (Math.imul(legacyRandomState, 1664525) + 1013904223) >>> 0;
  return legacyRandomState / 0x100000000;
};
global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
 'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js',
 'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

// 計測ブロック名→安定ハッシュ(項目を後から追加しても他項目の乱数列が変わらない)
function strHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h | 0;
}
function matchRng(block, i, flip) {
  return Engine.rng.create(Engine.rng.derive(SEED, strHash(block), i, flip));
}

function mkFighter(id, name, s, style) {
  return { id, name, pw: s[0], sp: s[1], te: s[2], st: s[3], mn: s[4],
           style: style || 'Allround', popularity: 50, traits: [] };
}

// 左右入替つき対戦(本体準拠rng): A側の勝率を返す
function playPair(block, sA, sB, n, styleA, styleB) {
  let winA = 0, total = 0;
  for (let i = 0; i < n; i++) {
    const r1 = Engine.battle.simulateMatch(
      mkFighter(1, 'A', sA, styleA), mkFighter(2, 'B', sB, styleB), matchRng(block, i, 0), 1);
    if (r1.winner === 'left') winA++;
    total++;
    const r2 = Engine.battle.simulateMatch(
      mkFighter(2, 'B', sB, styleB), mkFighter(1, 'A', sA, styleA), matchRng(block, i, 1), 1);
    if (r2.winner === 'right') winA++;
    total++;
  }
  return winA / total;
}

console.log(`═══ balance-baseline ═══ seed=${SEED} scale=${SCALE}${QUICK ? ' (quick)' : ''}`);
const t0 = Date.now();
const result = { meta: { seed: SEED, scale: SCALE, rngMethod: 'per-match create(derive)', date: new Date().toISOString().slice(0, 10) } };

// ── 1. anchor: 同格の試合の姿 ─────────────────────────────
{
  const n = Math.round(8000 * SCALE);
  let turns = 0, counters = 0, escapes = 0, mq = 0, timeout = 0;
  const finTypes = {};
  for (let i = 0; i < n; i++) {
    const r = Engine.battle.simulateMatch(
      mkFighter(1, 'A', [100, 100, 100, 100, 100]), mkFighter(2, 'B', [100, 100, 100, 100, 100]),
      matchRng('anchor', i, 0), 1);
    turns += r.turns; mq += r.mq;
    if (r.finType === 'HP判定') timeout++;
    finTypes[r.finType] = (finTypes[r.finType] || 0) + 1;
    counters += r.log.filter(l => l.includes('カウンター！')).length;
    escapes += r.log.filter(l => l.includes('キックアウト！') || l.includes('ロープエスケープ！')).length;
  }
  Object.keys(finTypes).forEach(k => { finTypes[k] = finTypes[k] / n; });
  result.anchor = {
    n, turns: turns / n, counters: counters / n, escapes: escapes / n,
    mq: mq / n, timeoutRate: timeout / n, finTypes,
  };
  console.log(`1/4 anchor: ターン${result.anchor.turns.toFixed(2)} カウンター${result.anchor.counters.toFixed(3)} 脱出${result.anchor.escapes.toFixed(3)} MQ${result.anchor.mq.toFixed(1)} 時間切れ${(result.anchor.timeoutRate * 100).toFixed(1)}%`);
}

// ── 2. gapCurve: 格差と勝率 ─────────────────────────────
{
  const n = Math.round(4000 * SCALE);
  result.gapCurve = {};
  for (const gap of [0, 2, 5, 10, 15, 20]) {
    const hi = [100, 100, 100, 100, 100];
    const lo = hi.map(v => v - gap);
    result.gapCurve[gap] = playPair(`gap${gap}`, hi, lo, n);
  }
  console.log('2/4 gapCurve: ' + Object.entries(result.gapCurve)
    .map(([g, w]) => `+${g}=${(w * 100).toFixed(1)}%`).join(' '));
}

// ── 3. spikeGrid: 尖り配分の対バランス勝率 ─────────────────
{
  const n = Math.round(4000 * SCALE);
  const STAT_NAMES = ['PW', 'SP', 'TE', 'ST', 'MN'];
  result.spikeGrid = {};
  for (const band of [60, 80, 100, 120]) {
    for (const spike of [12, 24, 40]) {
      const comp = spike / 4; // 尖り+spike、他4ステ-spike/4で合計固定
      for (let si = 0; si < 5; si++) {
        const bal = [band, band, band, band, band];
        const sp = bal.map((v, k) => k === si ? v + spike : v - comp);
        const key = `${STAT_NAMES[si]}+${spike}@${band}`;
        result.spikeGrid[key] = playPair(key, sp, bal, n);
      }
    }
  }
  console.log('3/4 spikeGrid: 60構成計測完了 (例: TE+24@100=' +
    (result.spikeGrid['TE+24@100'] * 100).toFixed(1) + '% MN+24@100=' +
    (result.spikeGrid['MN+24@100'] * 100).toFixed(1) + '%)');
}

// ── 4. styleMatrix: 技プールだけの強弱 ─────────────────────
{
  const n = Math.round(3000 * SCALE);
  const STYLES = ['Allround', 'Grappler', 'Striker', 'Submission', 'Aerial', 'Brawler'];
  const s100 = [100, 100, 100, 100, 100];
  result.styleMatrix = {};
  for (let i = 0; i < STYLES.length; i++) {
    for (let j = i + 1; j < STYLES.length; j++) {
      const key = `${STYLES[i]}|${STYLES[j]}`;
      result.styleMatrix[key] = playPair(key, s100, s100, n, STYLES[i], STYLES[j]);
    }
  }
  result.styleAvg = {};
  for (const a of STYLES) {
    let sum = 0, cnt = 0;
    for (const b of STYLES) {
      if (a === b) continue;
      const w = result.styleMatrix[`${a}|${b}`] != null
        ? result.styleMatrix[`${a}|${b}`] : 1 - result.styleMatrix[`${b}|${a}`];
      sum += w; cnt++;
    }
    result.styleAvg[a] = sum / cnt;
  }
  console.log('4/4 styleAvg: ' + Object.entries(result.styleAvg)
    .map(([s, w]) => `${s}=${(w * 100).toFixed(1)}%`).join(' '));
}

console.log(`計測時間: ${((Date.now() - t0) / 1000).toFixed(0)}秒`);

// ── 保存 or 比較 ─────────────────────────────────────────
if (SAVE) {
  if (QUICK) { console.error('--quick の結果は保存できません(Nが小さくSEが大きい)'); process.exit(2); }
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(result, null, 2));
  console.log(`✅ ベースラインを保存: ${path.relative(process.cwd(), BASELINE_PATH)}`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.error(`ベースライン未保存(${BASELINE_PATH})。まず --save で作成してください`);
  process.exit(2);
}
const base = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
const issues = [];
function cmpRate(label, now, was, tol) {
  if (Math.abs(now - was) > tol) issues.push(`${label}: ${(was * 100).toFixed(1)}% → ${(now * 100).toFixed(1)}% (許容±${tol * 100}pt)`);
}
function cmpRel(label, now, was, tolPct) {
  if (was === 0) return;
  if (Math.abs(now - was) / Math.abs(was) > tolPct) issues.push(`${label}: ${was.toFixed(2)} → ${now.toFixed(2)} (許容±${tolPct * 100}%)`);
}
cmpRel('anchor.turns', result.anchor.turns, base.anchor.turns, 0.08);
cmpRel('anchor.counters', result.anchor.counters, base.anchor.counters, 0.08);
cmpRel('anchor.escapes', result.anchor.escapes, base.anchor.escapes, 0.08);
cmpRel('anchor.mq', result.anchor.mq, base.anchor.mq, 0.08);
cmpRate('anchor.timeoutRate', result.anchor.timeoutRate, base.anchor.timeoutRate, 0.015);
for (const k of Object.keys(base.anchor.finTypes)) {
  cmpRate(`anchor.finTypes.${k}`, result.anchor.finTypes[k] || 0, base.anchor.finTypes[k], 0.03);
}
for (const k of Object.keys(base.gapCurve)) cmpRate(`gapCurve.+${k}`, result.gapCurve[k], base.gapCurve[k], 0.025);
for (const k of Object.keys(base.spikeGrid)) cmpRate(`spikeGrid.${k}`, result.spikeGrid[k], base.spikeGrid[k], 0.025);
for (const k of Object.keys(base.styleMatrix)) cmpRate(`styleMatrix.${k}`, result.styleMatrix[k], base.styleMatrix[k], 0.025);

if (issues.length === 0) {
  console.log('✅ ベースラインから逸脱なし');
  process.exit(0);
}
console.log(`⚠️ ベースラインからの逸脱 ${issues.length}件:`);
issues.forEach(i => console.log('  - ' + i));
process.exit(1);
