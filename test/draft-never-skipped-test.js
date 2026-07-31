'use strict';

// 「ドラフト自体に行かない」場合も他団体の指名は走る (2026-07-31 Keisuke)
//
// 他団体の指名処理は startDraftNegotiation(ui-common.js)の中の
// 「非選択候補のバックグラウンド処理」ループにしか無い。**そこを通らずに週が進むと、
// その年は業界全体が新人ゼロ**になる。
//
// 通常は weekPhase === 'scoutEvent' の間ずっと画面へ押し戻すので通れないが、
// セーブの修復・phase の取りこぼし・将来の分岐追加で phase だけ外れることはあり得る。
// そこで週送りの入口に保険を置き、候補が残っていたら指名0名で裏で決着させる。
//
// 併せて、この画面で指名も見送りもできない状態(候補や関心マークが欠けている)に
// なったとき、プレイヤーが押せるボタンが1つも無くなる行き止まりも塞ぐ。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const render = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');
const stripComments = t => t.replace(/\/\/[^\n]*/g, '');

function extractMethod(source, name) {
  const start = source.indexOf(`  ${name}() {`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`could not extract ${name}`);
}

function runNet(state, opts = {}) {
  const ctx = {
    G: state,
    console: { warn() {}, error() {} },
    startDraftNegotiation: opts.startDraftNegotiation || (() => { ctx.__started = true; }),
  };
  const code = 'var App = { ' + extractMethod(app, '_ensureDraftResolvedBeforeAdvance') + ' };'
    + '\n;this.__run = () => App._ensureDraftResolvedBeforeAdvance();'
    + '\n;this.__getG = () => G;';
  vm.runInNewContext(code, ctx);
  const ret = ctx.__run();
  return { ret, G: ctx.__getG(), started: !!ctx.__started };
}

const base = {
  offSeason: true, season: 3, offWeek: 3, weekPhase: 'offseason',
  scoutCandidates: [{ id: 1 }, { id: 2 }],
  _draftInterests: { 1: [], 2: [] },
  gameLog: [],
};

// ── 1. 候補を抱えたまま週を進めようとしたら、裏で決着させる ──
{
  const r = runNet({ ...base });
  assert.strictEqual(r.ret, true, '未消化のドラフトを素通りさせている');
  assert.strictEqual(r.started, true, 'ドラフトの決着処理を呼んでいない');
  // vm の別realmで作られた配列なので deepStrictEqual は使えない(prototypeが違う)
  assert.ok(r.G._draftSelections && r.G._draftSelections.length === 0,
    '指名0名として決着させていない');
}

// ── 2. 通常経路(phase が scoutEvent)には割り込まない ──
{
  const r = runNet({ ...base, weekPhase: 'scoutEvent' });
  assert.strictEqual(r.ret, false, '通常のドラフト画面経路に割り込んでいる');
  assert.strictEqual(r.started, false);
}

// ── 3. 交渉中・結果表示中には割り込まない ──
{
  assert.strictEqual(runNet({ ...base, _draftNegotiation: { x: 1 } }).ret, false,
    '交渉の途中で裏決着を走らせている');
  assert.strictEqual(runNet({ ...base, _draftResultPages: [{}] }).ret, false,
    '結果表示の途中で裏決着を走らせている');
}

// ── 4. 候補が無い/オフシーズンでないときは何もしない ──
{
  assert.strictEqual(runNet({ ...base, scoutCandidates: [] }).ret, false);
  assert.strictEqual(runNet({ ...base, scoutCandidates: null }).ret, false);
  assert.strictEqual(runNet({ ...base, offSeason: false }).ret, false);
}

// ── 5. 関心マークが無い旧セーブ: 決着させられないが、毎週ここへ来ないよう畳む ──
{
  const r = runNet({ ...base, _draftInterests: null });
  assert.strictEqual(r.ret, false, '決着できないのに進行を止めている');
  assert.strictEqual(r.G.scoutCandidates, null, '候補を畳んでいない。毎週この判定に入り続ける');
  assert.ok(r.G.gameLog.some(l => /ドラフト情報が不完全/.test(l)),
    '何が起きたかログに残していない');
}

// ── 6. 週送りの入口2つが両方この保険を通ること ──
{
  const src = stripComments(app);
  const adv = src.slice(src.indexOf('  advanceWeek() {'), src.indexOf('  advanceWeek() {') + 900);
  assert.ok(/App\._ensureDraftResolvedBeforeAdvance\(\)/.test(adv),
    'advanceWeek が保険を通っていない');
  const flow = src.slice(src.indexOf('  advanceCurrentFlow() {'), src.indexOf('  advanceCurrentFlow() {') + 900);
  assert.ok(/App\._ensureDraftResolvedBeforeAdvance\(\)/.test(flow),
    'advanceCurrentFlow が保険を通っていない');
}

// ── 7. ドラフト画面の行き止まりを塞いでいること ──
{
  const src = stripComments(render);
  assert.ok(/G\.weekPhase === 'scoutEvent' && !G\._draftNegotiationStarted\s*\n?\s*&& \(candidates\.length === 0 \|\| !G\._draftInterests\)/.test(src),
    '指名も見送りもできない状態の逃げ道が無い。押せるボタンが1つも無くなる');
  const at = src.indexOf("(candidates.length === 0 || !G._draftInterests)");
  const block = src.slice(at, at + 900);
  assert.ok(/App\.scoutEventFinish\(\)/.test(block),
    '逃げ道のボタンが先へ進む処理を呼んでいない');
}

console.log('draft-never-skipped-test: ok');
