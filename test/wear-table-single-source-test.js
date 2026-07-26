// wear-table-single-source-test.js
//
// 消耗(wear)の帯は **WEAR_TABLE だけが定義元**。
// 2026-07-26 まで applyDecay / checkRetirement / getDeclinePresentation が同じ数字を
// 各自ベタ書きしており、表は誰にも読まれない飾りだった。
// 「表を書き換えたのにゲームが変わらない」事故は、書き換えた本人が気づけないので
// いちばん質が悪い。実装が表を読んでいることを固定する。
//
// 数値そのものは調整で動く前提なので固定しない。**読んでいること**だけを守る。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const management = read('src/management.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

// エンジンを実体で読む
global.window = { IS_TRIAL: false };
(function load() {
  const srcDir = path.join(root, 'src');
  ['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
   'management.js', 'match-engine.js', 'relationships.js'].forEach(f => {
    let code = fs.readFileSync(path.join(srcDir, f), 'utf-8')
      .replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '')
      .replace(/^(const|let) /gm, 'var ');
    new vm.Script(code, { filename: f }).runInThisContext();
  });
})();

console.log('=== 消耗の帯は WEAR_TABLE が唯一の定義元 ===\n');

section('1. getWearBand がある', () => {
  assert.strictEqual(typeof getWearBand, 'function', 'getWearBand が無い');
});

section('2. 帯の境目を正しく引く', () => {
  assert.strictEqual(getWearBand(0).min, 0, 'wear 0');
  assert.strictEqual(getWearBand(19).min, 0, 'wear 19 は全盛期の上端');
  assert.strictEqual(getWearBand(20).min, 20, 'wear 20 で次の帯へ');
  assert.strictEqual(getWearBand(39).min, 20);
  assert.strictEqual(getWearBand(40).min, 40);
  assert.strictEqual(getWearBand(59).min, 40);
  assert.strictEqual(getWearBand(60).min, 60);
  assert.strictEqual(getWearBand(79).min, 60);
  assert.strictEqual(getWearBand(80).min, 80);
  assert.strictEqual(getWearBand(999).min, 80, '上限なしの帯へ落ちる');
});

section('3. 壊れた入力でも落ちない', () => {
  [-5, NaN, undefined, null, '', 'abc'].forEach(v => {
    const b = getWearBand(v);
    assert.ok(b && typeof b.min === 'number', `getWearBand(${String(v)}) が帯を返さない`);
  });
  assert.strictEqual(getWearBand(-5).min, 0, '負値は全盛期へ丸める');
});

section('4. 表は min の昇順で、隙間も重なりも無い', () => {
  for (let i = 1; i < WEAR_TABLE.length; i++) {
    const prev = WEAR_TABLE[i - 1], cur = WEAR_TABLE[i];
    assert.ok(cur.min > prev.min, `${i}番目の min が昇順でない`);
    assert.strictEqual(cur.min, prev.max + 1,
      `帯 ${prev.min}-${prev.max} と ${cur.min}- の間に隙間か重なりがある`);
  }
});

section('5. applyDecay が表から減少量を読む（ベタ書きに戻っていない）', () => {
  const at = management.indexOf('applyDecay(rng, fighter, decayReduction = 0)');
  assert.ok(at > 0, 'applyDecay が見つからない');
  const body = management.slice(at, at + 1200);
  assert.ok(/getWearBand\(/.test(body), 'getWearBand を呼んでいない');
  assert.ok(!/decayMin = 1; decayMax = 2/.test(body),
    '減少量が実装にベタ書きされている。表を書き換えても効かなくなる');
});

section('6. checkRetirement が表から引退確率を読む', () => {
  const at = management.indexOf('checkRetirement(rng, fighter)');
  assert.ok(at > 0, 'checkRetirement が見つからない');
  const body = management.slice(at, at + 1600);
  assert.ok(/getWearBand\(/.test(body), 'getWearBand を呼んでいない');
  assert.ok(!/retireChance = 0\.50/.test(body) && !/retireChance = 0\.20/.test(body),
    '引退確率が実装にベタ書きされている');
  assert.ok(!/if \(wear >= 80\) return true;/.test(body),
    'wear 80 の閾値が実装にベタ書きされている');
});

section('7. getDeclinePresentation が表から段階を読む', () => {
  const at = management.indexOf('getDeclinePresentation(fighter)');
  assert.ok(at > 0, 'getDeclinePresentation が見つからない');
  const body = management.slice(at, at + 1200);
  assert.ok(/getWearBand\(/.test(body), 'getWearBand を呼んでいない');
  assert.ok(!/wear \|\| 0\) >= 60/.test(body), '境目が実装にベタ書きされている');
});

section('8. 表を書き換えると実際に挙動が変わる（一本化が効いている証明）', () => {
  const f = { pw: 60, sp: 60, te: 60, st: 60, mn: 60, wear: 25,
              notionValue: { pw: 60, sp: 60, te: 60, st: 60, mn: 60 } };
  const rng = () => Engine.rng.create(12345);
  const before = Engine.growth.applyDecay(rng(), f);
  const beforeLoss = 60 - before.pw;

  const band = WEAR_TABLE.find(b => b.min === 20);
  const save = { decayMin: band.decayMin, decayMax: band.decayMax };
  band.decayMin = 9; band.decayMax = 9;              // 表だけ書き換える
  const after = Engine.growth.applyDecay(rng(), f);
  const afterLoss = 60 - after.pw;
  band.decayMin = save.decayMin; band.decayMax = save.decayMax; // 必ず戻す

  assert.ok(afterLoss > beforeLoss,
    `表を書き換えても減少量が変わらない (${beforeLoss} → ${afterLoss})。一本化できていない`);
});

section('9. 段階の判定が表と矛盾しない', () => {
  const stageOf = wear => Engine.retirement.getDeclinePresentation(
    { pw: 60, sp: 60, te: 60, st: 60, mn: 60, wear, careerRecord: { peakOVR: 60 } }).stage;
  assert.strictEqual(stageOf(10), 'none', '全盛期は段階なし');
  assert.strictEqual(stageOf(45), 'major', '本格衰退帯');
  assert.strictEqual(stageOf(70), 'terminal', '末期帯');
  assert.strictEqual(stageOf(90), 'terminal', '確定引退帯も terminal のまま（ラベルは空だが段階は末期）');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (9 sections)');
