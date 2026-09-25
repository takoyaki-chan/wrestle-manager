'use strict';
// firing-grudge-week-conversion-test.js — 解雇遺恨の「週の換算」を 48週/季(Engine.util.absWeek)に統一したことの確認
//
// 総点検 docs/fun-audit-v0.1/04-drama-engine.md 発見⑪:
//   - 古巣対決ニュース firedReturn(app.js _maybeEmitFiredReturn)は、今の週を48週/季、解雇の週を20週/季で
//     換算していた → 解雇が2季目以降だと差が必ず24週を超え、一度も出なかった
//   - 試合中の元雇用主向けセリフ(app.js _vsExEmployeeFires)と対抗戦の勝利セリフ(ui-common.js _getWarVictoryLine)は
//     両方を20週/季で換算していた → 季をまたぐと窓(解雇から24週以内 = 仕様の「半年」)の計算がずれていた
//   - 遺恨の強さの在籍年数(relationships.js computeFiringGrudgeIntensity)は、今の週を20週/季、
//     加入週(orgJoinWeek、48週/季)と混ぜて引き算していた
// 修正後の約束: 3か所とも Engine.relationships.grudgeWeeksSince(48週/季)を使う。在籍年数は48週で1年

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));
const { readSource } = require(path.join(__dirname, 'helpers', 'source.js'));

loadGame();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

// オブジェクトのメソッド定義(`name(args) {`)または関数宣言をソースから切り出す
function extractBlock(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} が見つからない`);
  const brace = source.indexOf('{', start + signature.length - 1);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${signature} の終わりが見つからない`);
}

const app = readSource('src', 'app.js');
const ui = readSource('src', 'ui-common.js');
const maybeEmitFiredReturn = new Function('Engine', 'RIVAL_ORGS',
  `return function ${extractBlock(app, '_maybeEmitFiredReturn(state, fighter, foeOrgId, sideOrgId) {')};`)(Engine, RIVAL_ORGS);
const vsExEmployeeFires = new Function('Engine', 'VS_EX_EMPLOYER_LINES',
  `return function ${extractBlock(app, '_vsExEmployeeFires(fighter, season, week, opponentOrgId) {')};`)(Engine, VS_EX_EMPLOYER_LINES);
function makeWarVictoryLine(ctx) {
  return new Function('Engine', '_warPostCtx', 'getVsExEmployerLine', 'getDialoguePool', 'WAR_VICTORY_LINES', 'WM_I18N', 'Math',
    `return ${extractBlock(ui, 'function _getWarVictoryLine(fighter, state) {')};`)(
    ctx.Engine, ctx.warPostCtx, () => 'EX_EMPLOYER_LINE', () => ['NORMAL_LINE'], {},
    { t: (s) => s }, Object.assign(Object.create(Math), { random: () => 0 }));
}

const aiOrg = RIVAL_ORGS[0].id;
const grudge = (season, week, extra) => Object.assign({ vsOrgId: 'player', reason: 'fired', issuedSeason: season,
  issuedWeek: week, intensity: 70, decayUntilSeason: season + 3 }, extra || {});
const firedFighter = (g) => ({ id: 501, name: '解雇された選手', personality: 'normal', archetype: 'standard', grudge: g });
const newsCount = (s) => (s._industryNewsEvents || []).filter(e => e.type === 'firedReturn').length;

console.log('=== 解雇遺恨: 週の換算を48週/季に統一 ===\n');

section('grudgeWeeksSince は 48週/季で数える(季をまたいでも連続)', () => {
  const W = Engine.relationships.grudgeWeeksSince;
  assert.strictEqual(W.call(Engine.relationships, grudge(2, 10), 2, 20), 10);
  assert.strictEqual(W.call(Engine.relationships, grudge(2, 40), 3, 1), 9);
  assert.strictEqual(W.call(Engine.relationships, grudge(5, 48), 6, 24), 24);
  assert.strictEqual(W.call(Engine.relationships, grudge(5, 47), 6, 24), 25);
  assert.strictEqual(W.call(Engine.relationships, null, 3, 1), null);
});

section('古巣対決ニュース: 解雇2季目以降でも24週以内なら出る(以前は一度も出なかった)', () => {
  // 第2季第10週に解雇 → 第2季第20週に古巣と対戦(10週後)。旧換算: 68 − 30 = 38週 → 出ない
  let s = { season: 2, week: 20, orgName: '自団体' };
  s = maybeEmitFiredReturn(s, firedFighter(grudge(2, 10)), 'player', aiOrg);
  assert.strictEqual(newsCount(s), 1, '解雇から10週(2季目)なのに出ない');
  assert.strictEqual(s._industryNewsEvents[0].data.weeksSinceFired, '10', '見出しに入る週数が48週/季の値でない');
  // 季をまたいで9週後
  let s2 = { season: 3, week: 1 };
  s2 = maybeEmitFiredReturn(s2, firedFighter(grudge(2, 40)), 'player', aiOrg);
  assert.strictEqual(newsCount(s2), 1, '季をまたいだ9週後に出ない');
  // 25週後・解雇より前・遺恨が弱い・相手が古巣でない は出ない
  assert.strictEqual(newsCount(maybeEmitFiredReturn({ season: 6, week: 24 }, firedFighter(grudge(5, 47)), 'player', aiOrg)), 0, '25週後に出た');
  assert.strictEqual(newsCount(maybeEmitFiredReturn({ season: 2, week: 5 }, firedFighter(grudge(2, 10)), 'player', aiOrg)), 0, '解雇より前に出た');
  assert.strictEqual(newsCount(maybeEmitFiredReturn({ season: 2, week: 20 }, firedFighter(grudge(2, 10, { intensity: 59 })), 'player', aiOrg)), 0, '遺恨59で出た');
  assert.strictEqual(newsCount(maybeEmitFiredReturn({ season: 2, week: 20 }, firedFighter(grudge(2, 10)), aiOrg, 'player')), 0, '古巣でない相手で出た');
});

section('元雇用主向けセリフ(試合中): 季をまたいでも24週以内なら出る/超えたら出ない', () => {
  const f = firedFighter(grudge(4, 40));
  // 第5季第10週 = 解雇から18週。旧換算(20週/季): (80+10) − (60+40) = −10 → 出なかった
  assert.strictEqual(vsExEmployeeFires(f, 5, 10, 'player'), true, '季をまたいだ18週後に出ない');
  // 第5季第17週 = 25週。旧換算: 97 − 100 = −3 → 出ない(旧でも出ないが理由が違う)
  assert.strictEqual(vsExEmployeeFires(f, 5, 17, 'player'), false, '25週後に出た');
  // 同じ季の中: 第4季第48週 = 8週。旧換算: 108 − 100 = 8 → 出る(ここは旧新同じ)
  assert.strictEqual(vsExEmployeeFires(f, 4, 48, 'player'), true);
  // 旧換算では同じ季の中でも窓がずれていた: 第4季第10週解雇 → 第4季第40週(30週後)は旧だと 30 → 出ない、新も30 → 出ない
  assert.strictEqual(vsExEmployeeFires(firedFighter(grudge(4, 10)), 4, 40, 'player'), false);
});

section('対抗戦の勝利セリフ: 季をまたいでも24週以内なら元雇用主向けを使う/Engine が無ければ通常へ', () => {
  const warPostCtx = { ev: { opponentOrgId: 'player' } };
  const f = firedFighter(grudge(4, 40));
  const line = makeWarVictoryLine({ Engine, warPostCtx });
  assert.strictEqual(line(f, { season: 5, week: 10 }), 'EX_EMPLOYER_LINE', '季をまたいだ18週後に元雇用主向けを使わない');
  assert.strictEqual(line(f, { season: 5, week: 17 }), 'NORMAL_LINE', '25週後に元雇用主向けを使った');
  const noEngine = makeWarVictoryLine({ Engine: undefined, warPostCtx });
  assert.strictEqual(noEngine(f, { season: 5, week: 10 }), 'NORMAL_LINE', 'Engine が無い環境で例外 or 元雇用主向け');
});

section('遺恨の強さの在籍年数は48週で1年(係数は不変)', () => {
  const calc = (f, season, week) => Engine.relationships.computeFiringGrudgeIntensity(f, { season, week, titles: { world: {} } });
  const base = { id: 7, popularity: 0, age: 25, history: [] };
  // 第3季第1週に加入 → 第6季第1週に解雇 = 3年在籍 → +10(旧換算では 101 − 97 = 4週 → 0年)
  const joined3 = { ...base, orgJoinWeek: Engine.util.absWeek(3, 1) };
  assert.strictEqual(calc(joined3, 6, 1), 50, '3年在籍の +10 が付かない');
  assert.strictEqual(calc(joined3, 5, 48), 40, '3年未満なのに +10 が付いた');
  // 初期ロスター(orgJoinWeek 0)を第3季第30週に解雇 = 2年と30週 → +10 なし(旧換算では 70/20 = 3年 → +10)
  const initial = { ...base, orgJoinWeek: 0 };
  assert.strictEqual(calc(initial, 3, 30), 40, '在籍2年半で +10 が付いた(旧換算の2.4倍)');
  assert.strictEqual(calc(initial, 4, 1), 50, '初期ロスターの在籍3年で +10 が付かない');
  // 基底40・人気・王者・若さの係数は変えていない
  assert.strictEqual(Engine.relationships.computeFiringGrudgeIntensity({ ...base, popularity: 100, age: 20, orgJoinWeek: 0 },
    { season: 1, week: 1, titles: { world: { championId: 7 } } }), 40 + 25 + 10 + 15);
});

section('20週/季の換算がソースに残っていない', () => {
  const rel = readSource('src', 'relationships.js');
  [['app.js', app], ['ui-common.js', ui], ['relationships.js', rel]].forEach(([name, src]) => {
    assert.ok(!/\)\s*\*\s*20\s*\+/.test(src), `${name} に (x - 1) * 20 + の換算が残っている`);
  });
});

console.log('');
if (failed > 0) {
  console.log(`FAIL: ${failed} section(s)`);
  process.exit(1);
}
console.log('ALL PASS');
