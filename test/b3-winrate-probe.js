#!/usr/bin/env node
// B3 挑戦状の構造的バイアス検証スクリプト
// 目的: OVR100 級プレイヤー vs OVR91 級チャレンジャーで本当に勝率が低いのか測る
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');

// 仮想キャラ生成: OVR ターゲット値から逆算で stats を割る
function makeFighter(id, name, targetOvr, style = 'Allround', popularity = 50) {
  const s = Math.max(40, Math.min(99, targetOvr));
  return {
    id, name,
    pw: s, sp: s, te: s, st: s, mn: s,
    style, role: 'main',
    popularity, traits: [],
  };
}

function runScenario(label, leftOvr, rightOvr, trials = 500) {
  let wins = 0, losses = 0, draws = 0;
  for (let i = 0; i < trials; i++) {
    const L = makeFighter(1, 'Player', leftOvr);
    const R = makeFighter(2, 'Challenger', rightOvr);
    const rng = Engine.rng.create(i * 7919 + 12345);
    const result = Engine.battle.simulateMatch(L, R, rng, 2);
    if (result.winner === 'left') wins++;
    else if (result.winner === 'right') losses++;
    else draws++;
  }
  const wr = (wins / trials * 100).toFixed(1);
  const lr = (losses / trials * 100).toFixed(1);
  console.log(`${label.padEnd(30)} W ${wins}/${trials} (${wr}%)  L ${losses} (${lr}%)  D ${draws}`);
}

console.log('=== B3 winrate probe: matchTier=2 (BIGMATCH) ===');
runScenario('OVR99 vs OVR91', 99, 91);
runScenario('OVR95 vs OVR91', 95, 91);
runScenario('OVR91 vs OVR91', 91, 91);
runScenario('OVR91 vs OVR95 (逆)', 91, 95);
runScenario('OVR85 vs OVR91 (逆)', 85, 91);
runScenario('OVR99 vs OVR80', 99, 80);

console.log('\n=== 同一シードで右側が常に勝つかチェック (固定 seed) ===');
// 旧 B3 の seed 派生を模倣: 季節12週=固定
const fixedSeed = Engine.rng.derive(123, 1, 12, 0xB1B4);
let lWin = 0;
for (let trial = 0; trial < 50; trial++) {
  // pf.id を変えながら（ただし stats は固定 OVR99）試す
  const L = makeFighter(trial + 100, `P${trial}`, 99);
  const R = makeFighter(2, 'Challenger', 91);
  const rng = Engine.rng.create(fixedSeed);
  const result = Engine.battle.simulateMatch(L, R, rng, 2);
  if (result.winner === 'left') lWin++;
}
console.log(`Fixed seed (旧B3 と同じシード派生) で OVR99 vs OVR91 を 50 回: 左勝ち ${lWin}/50`);

console.log('\n=== シードに pf.id 混ぜた場合（新 B3） ===');
let lWin2 = 0;
for (let trial = 0; trial < 50; trial++) {
  const fighterId = trial + 100;
  const L = makeFighter(fighterId, `P${trial}`, 99);
  const R = makeFighter(2, 'Challenger', 91);
  const seed = Engine.rng.derive(123, 1, 12, 0xB1B4, fighterId);
  const rng = Engine.rng.create(seed);
  const result = Engine.battle.simulateMatch(L, R, rng, 2);
  if (result.winner === 'left') lWin2++;
}
console.log(`pf.id 混合シード で OVR99 vs OVR91 を 50 回: 左勝ち ${lWin2}/50`);
