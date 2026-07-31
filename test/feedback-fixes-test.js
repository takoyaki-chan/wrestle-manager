'use strict';

// task-40: 実機フィードバック6件の回帰テスト。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const uiCommon = read('src/ui-common.js');
const uiRender = read('src/ui-render.js');
const indexHtml = read('src/index.html');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (error) { failed++; console.log('  FAIL  ' + name + '\n        ' + error.message); }
}

function functionSource(source, name) {
  const matched = source.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n}`));
  assert.ok(matched, `${name} が見つからない`);
  return matched[0];
}

function loadFunction(source, name, scope = {}) {
  const keys = Object.keys(scope);
  return Function(...keys, `${functionSource(source, name)}\nreturn ${name};`)(...keys.map(key => scope[key]));
}

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : (/\.(js|html)$/.test(entry.name) ? [full] : []);
  });
}

console.log('=== task-40 feedback fixes ===\n');

section('1-2. プレイヤー向け文言にサッカー用語を残さない', () => {
  const hits = [];
  sourceFiles(path.join(root, 'src')).forEach(file => {
    const text = fs.readFileSync(file, 'utf8');
    const re = /ベンチ(?!マーク)|プレー(?!スホルダ|ヤー|ト)/g;
    let match;
    while ((match = re.exec(text))) hits.push(`${path.relative(root, file)}:${match[0]}`);
  });
  assert.deepStrictEqual(hits, [], `未修正の用語: ${hits.join(', ')}`);
});

section('3. 歴代優勝カードはOVRを表示し、引退者はpeakOVRへフォールバックする', () => {
  const escHtml = value => String(value);
  const Engine = { util: { ov: fighter => fighter.currentOvr }, career: { resolveFighterName: () => '' } };
  const upper = loadFunction(uiRender, '_recordBookUpper', { escHtml, getUpperUrl: () => '', _recordBookPeak: () => 0 });
  const name = loadFunction(uiRender, '_recordBookName', { Engine, G: {} });
  const displayOvr = loadFunction(uiRender, '_recordBookDisplayOvr', { Engine });
  const renderCard = loadFunction(uiRender, '_renderDbRecordWinnerCard', {
    escHtml,
    valueClassOvr: value => `tier-${value}`,
    _recordBookUpper: upper,
    _recordBookName: name,
    _recordBookDisplayOvr: displayOvr,
    _recordBookOpen: () => '',
  });
  const active = renderCard({ source: { active: true, orgName: '団体', fighter: { id: 1, name: '現役', currentOvr: 120 } }, event: { season: 8 } }, 0, 'tenchosen');
  const retired = renderCard({ source: { active: false, orgName: '引退', fighter: { id: 2, name: '引退', currentOvr: 90, careerRecord: { peakOVR: 129 } } }, event: { season: 7 } }, 0, 'ppv');
  assert.match(active, /OVR 120/, '現役の現在OVRが無い');
  assert.match(active, /db-record-ovr tier-120/, 'OVR階調クラスが無い');
  assert.match(retired, /OVR 129/, '引退者がpeakOVRへフォールバックしていない');
});

section('4. 画像がある記録アッパーはイニシャルを出さず、失敗時だけ表示する', () => {
  const upper = loadFunction(uiRender, '_recordBookUpper', {
    escHtml: value => String(value),
    _recordBookPeak: () => 0,
    getUpperUrl: () => 'image/test.png',
  });
  const imageUpper = upper({ fighter: { id: 1, name: '画像あり' } }, 'is-ppv');
  assert.match(imageUpper, /<img /, '画像が出力されない');
  assert.doesNotMatch(imageUpper, /db-record-upper-initial/, '画像あり時にもイニシャルを出力している');
  assert.match(imageUpper, /is-image-missing/, '画像失敗時のフォールバックが無い');
  assert.match(indexHtml, /\.db-record-upper\.is-image-missing::before\{content:attr\(data-initial\)\}/,
    '画像失敗時だけイニシャルを描くCSSが無い');
});

section('5. 選手詳細の能力バーは150目盛りで120を80%に描く', () => {
  assert.match(uiCommon, /const w = Math\.min\(100, \(val \/ 150\) \* 100\);/,
    '能力バーが150目盛りで計算されていない');
  assert.match(uiCommon, /statDecayView\(c, s\.key, 150, isAiFighter\)/,
    '消耗帯が150目盛りに揃っていない');
  assert.strictEqual(Math.min(100, (120 / 150) * 100), 80, '120のバー幅が80%にならない');
});

section('6. AIの実天井差を表示専用に復元し、通常選手の履歴は捏造しない', () => {
  const statDecayView = loadFunction(uiCommon, 'statDecayView', { GROWTH_CONFIG: { wearCapDecayRatio: 0.5 } });
  const ai = { pw: 80, trainCap: { pw: 116 }, trainCapOrigin: { pw: 120 } };
  assert.strictEqual(statDecayView(ai, 'pw', 150).lostPts, 0,
    '通常経路がstatPeakなしの履歴を作っている');
  assert.strictEqual(statDecayView(ai, 'pw', 150, true).lostPts, 8,
    'AIの実天井差から消耗を復元できない');
  assert.match(uiCommon, /let isAiFighter = false;/, 'AI選手の表示経路を判定していない');
});

console.log('');
if (failed > 0) {
  console.log(`Result: ${failed} FAILED`);
  process.exit(1);
}
console.log('Result: ALL PASS');
