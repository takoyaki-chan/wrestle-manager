// 派閥momentumの週次減衰 回帰テスト(2026-08-02)
// 背景: momentumDecayPerWeek が -1.0 で書かれ、正のstep前提の減衰関数を通って
// 勢いの絶対値が毎週+1膨張していた(20→21、-20→-21)。Codex調査で発見・修正済み。
// このテストは (1)設定値が正であること (2)減衰が正負とも絶対値を0へ近づけること を固定する。
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', 'src', p), 'utf8');
let failed = 0;
function section(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

// (1) 設定値: momentumDecayPerWeek は正の値で書く(負値は符号反転バグの再発)
section('FACTION_CONFIG.momentumDecayPerWeek は正の値', () => {
  const src = read('data.js');
  const m = src.match(/momentumDecayPerWeek:\s*(-?[\d.]+)/);
  assert.ok(m, 'momentumDecayPerWeek が data.js に見つからない');
  const v = parseFloat(m[1]);
  assert.ok(v > 0, `momentumDecayPerWeek が正でない: ${v}(負値だと減衰が逆向きに膨張する)`);
});

// (2) 減衰関数の実挙動: factions.js から関数本体を抽出して実行
section('減衰は正負とも絶対値を0へ近づけ、0を跨がない', () => {
  const src = read('factions.js');
  const start = src.indexOf('processWeeklyMomentumDecay(state) {');
  assert.ok(start >= 0, 'processWeeklyMomentumDecay が見つからない');
  // 関数本体をブレース対応で切り出す
  let depth = 0, i = src.indexOf('{', start), end = -1;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  assert.ok(end > start, '関数本体の切り出しに失敗');
  const body = src.slice(src.indexOf('{', start) + 1, end);

  const FACTION_CONFIG = { momentumDecayPerWeek: 1.0 };
  const self = { _isHostile: () => true };
  const fn = new Function('state', 'FACTION_CONFIG', `return (function(){ ${body} }).call(this);`).bind(self);

  const state = { factions: [
    { id: 'a', momentum: 20 },
    { id: 'b', momentum: -20 },
    { id: 'c', momentum: 0.5 },
    { id: 'd', momentum: -0.5 },
    { id: 'e', momentum: 0 },
  ] };
  const out = fn(state, FACTION_CONFIG);
  const got = out.factions.map(f => f.momentum);
  assert.deepStrictEqual(got, [19, -19, 0, 0, 0],
    `期待 [19,-19,0,0,0] に対し ${JSON.stringify(got)}`);
});

// (3) 設定が誤って負で入っても膨張しない(Math.absガードの固定)
section('設定が負値でも減衰方向が保たれる(頑健化ガード)', () => {
  const src = read('factions.js');
  const fnRegion = src.slice(src.indexOf('processWeeklyMomentumDecay'), src.indexOf('processWeeklyMomentumDecay') + 800);
  assert.ok(/Math\.abs\(\s*cfg\.momentumDecayPerWeek\s*\)/.test(fnRegion),
    '減衰関数に Math.abs ガードが無い(負の設定値で符号反転が再発しうる)');
});

console.log(failed === 0 ? '\nfaction-momentum-decay-test: ok' : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
