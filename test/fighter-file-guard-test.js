'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');
const appSource = read('src/app.js');
const uiSource = read('src/ui-common.js');
const indexSource = read('src/index.html');
const { ALL_CHARS, CHAR_PROFILES, PORTRAIT, TRAIT_DEFS } = require(path.join(root, 'src', 'data.js'));

function markedBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `開始マーカーが見つからない: ${startMarker}`);
  assert.ok(end > start, `終了マーカーが見つからない: ${endMarker}`);
  return source.slice(start, end + endMarker.length);
}

const statBlock = markedBlock(
  uiSource,
  '// ── task-90: 共通数値表記(stat-notation-v1.0)',
  '// ── /task-90: 共通数値表記'
);
const fighterBlock = markedBlock(
  appSource,
  '// ── task-90: タイトル画面 選手ファイル',
  '// ── /task-90: タイトル画面 選手ファイル'
);

const context = {
  ALL_CHARS,
  CHAR_PROFILES,
  PORTRAIT,
  TRAIT_DEFS,
  App: {},
  document: {
    addEventListener() {},
    getElementById() { return null; },
  },
  escHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
};

// 実ブラウザと同じく app.js ブロック→ui-common.js ブロックの順で定義する。
vm.runInNewContext(`${fighterBlock}\n${statBlock}\n
this.__statApi = { statTierStyle, barDispOver, statOverBarHtml };
this.__fighterApi = {
  buildCatalog: _fighterFileBuildCatalog,
  nextSort: _fighterFileNextSort,
  compare: _fighterFileCompare,
  listHtml: _fighterFileListHtml,
  detailHtml: _fighterFileDetailHtml,
};`, context, { filename: 'fighter-file-task-90-blocks.js' });

const statApi = context.__statApi;
const fighterApi = context.__fighterApi;

// 1. 機密注記3行は確定文言と一字一句一致する。
const confidentialLines = [
  '潜在能力値は、本ファイルには記載されない。',
  '各選手の潜在能力は機密事項。さらに同じ選手であっても、その数値はプレイごとに変化する。',
  '※ 記載の能力値は各選手の能力基準値。',
];
const noticeMain = indexSource.match(/<div class="fighter-file-notice-main">([^<]*)<\/div>/);
const noticeSub = indexSource.match(/<div class="fighter-file-notice-sub">([^<]*)<br>([^<]*)<\/div>/);
assert.ok(noticeMain && noticeSub, '機密注記の3行DOMが見つかる');
assert.strictEqual(noticeMain[1], confidentialLines[0]);
assert.strictEqual(noticeSub[1], confidentialLines[1]);
assert.strictEqual(noticeSub[2], confidentialLines[2]);

// 2. 全127名を、許可字段だけのカタログから一覧・詳細HTMLへ描画する。
assert.strictEqual(ALL_CHARS.length, 127, '静的マスタは全127名');
const sentinels = [];
const instrumentedChars = ALL_CHARS.map((char, index) => {
  const hiddenA = {};
  const hiddenB = {};
  ['pw', 'sp', 'te', 'st', 'mn'].forEach((key, statIndex) => {
    hiddenA[key] = 910000 + index * 10 + statIndex;
    hiddenB[key] = 920000 + index * 10 + statIndex;
    sentinels.push(String(hiddenA[key]), String(hiddenB[key]));
  });
  return {
    ...char,
    pot: hiddenA,
    trainCap: hiddenB,
    developmentRate: `HIDDEN_RATE_${index}`,
  };
});
const catalog = fighterApi.buildCatalog(instrumentedChars, CHAR_PROFILES, PORTRAIT);
assert.strictEqual(catalog.length, 127, '全127名が表示カタログへ入る');
assert.ok(catalog.every(fighter => fighter.profile.length > 0), '全127名にプロフィールがある');
assert.ok(catalog.every(fighter => fighter.portraitKey.length > 0), '全127名に画像キーがある');
const allowedCatalogKeys = ['h', 'id', 'mn', 'name', 'ovr', 'portraitKey', 'profile', 'pw', 'role', 'sp', 'st', 'style', 'te', 'traits'];
catalog.forEach(fighter => assert.deepStrictEqual(Object.keys(fighter).sort(), allowedCatalogKeys));

const defaultState = { key: 'ovr', asc: false, style: '', query: '' };
const listView = fighterApi.listHtml(catalog, defaultState);
const allDetails = catalog.map(fighter => fighterApi.detailHtml(fighter, TRAIT_DEFS)).join('');
const generatedHtml = listView.head + listView.body + allDetails;
assert.strictEqual(listView.visibleCount, 127, '一覧HTMLは全127名を描画する');
sentinels.forEach(value => assert.ok(!generatedHtml.includes(value), `非表示値 ${value} が生成HTMLへ出ない`));
assert.ok(!generatedHtml.includes('HIDDEN_RATE_'), '派生ラベルが生成HTMLへ出ない');
assert.ok(!generatedHtml.includes('trainCap'), '非表示フィールド名が生成HTMLへ出ない');
assert.ok(!generatedHtml.includes('pot:'), '非表示フィールド名が生成HTMLへ出ない');

const maxOvr = Math.max(...catalog.map(fighter => fighter.ovr));
const firstId = Number((listView.body.match(/App\.openFighterFileDetail\((\d+)\)/) || [])[1]);
assert.ok(catalog.some(fighter => fighter.id === firstId && fighter.ovr === maxOvr), 'デフォルトはOVR降順');
assert.ok(allDetails.includes('width="200" height="208"'), '全詳細に共通レーダーを生成できる');
assert.ok(allDetails.includes('loading="lazy"'), '画像は遅延読み込みを使う');
const aerialView = fighterApi.listHtml(catalog, { ...defaultState, style: 'Aerial' });
assert.strictEqual(aerialView.visibleCount, catalog.filter(fighter => fighter.style === 'Aerial').length, 'スタイル絞り込み');
assert.strictEqual(fighterApi.listHtml(catalog, { ...defaultState, query: '阿武隈' }).visibleCount, 1, '名前部分一致検索');
assert.strictEqual(fighterApi.listHtml(catalog, { ...defaultState, query: '__該当なし__' }).visibleCount, 0, '検索0件');

// 3. stat-notation §1/§2 の帯・glow・圧縮式を固定する。
assert.strictEqual(statApi.statTierStyle('pw', 44), 'color:#63615b');
assert.strictEqual(statApi.statTierStyle('pw', 45), 'color:#a8a59d');
assert.strictEqual(statApi.statTierStyle('pw', 60), 'color:#f2f0e8');
assert.strictEqual(statApi.statTierStyle('pw', 70), 'color:#ed9e92');
assert.strictEqual(statApi.statTierStyle('pw', 80), 'color:#e96d5e');
assert.strictEqual(statApi.statTierStyle('pw', 90), 'color:#e74c3c;font-weight:700');
assert.strictEqual(statApi.statTierStyle('pw', 100), 'color:#e74c3c;font-weight:700');
assert.ok(statApi.statTierStyle('pw', 101).includes('text-shadow:0 0 6px #e74c3ccc,0 0 14px #e74c3c55'));
assert.ok(!statApi.statTierStyle('pw', 100).includes('text-shadow'), 'glowは100超だけ');
assert.strictEqual(statApi.statTierStyle('sp', 90), 'color:#2ecc71;font-weight:700');
assert.strictEqual(statApi.statTierStyle('te', 90), 'color:#3498db;font-weight:700');
assert.strictEqual(statApi.barDispOver(110), 103.6);
assert.strictEqual(statApi.barDispOver(130), 110.8);
assert.strictEqual(statApi.barDispOver(150), 118);
assert.strictEqual(statApi.barDispOver(200), 118);
const overBar = statApi.statOverBarHtml('pw', 110, { label: 'PW', lost: 6, gain: 2 });
assert.ok(overBar.includes('width:87.8%'), '110の圧縮幅をHTMLへ反映する');
assert.ok(overBar.includes('stat-over-ghost'), '消耗ゴースト部品を共通生成する');
assert.ok(overBar.includes('▼6') && overBar.includes('+2'), '▼n/+nを共通生成する');
assert.ok(!/stat-over-fill[^>]*(?:box-shadow|text-shadow|filter)/.test(overBar), 'バー自体は発光しない');
assert.ok(indexSource.includes('.stat-over-ghost{') && indexSource.includes('opacity:.28'), 'ゴーストは同色28%');

// 4. ソートは同列トグル、別列は降順開始、名前はlocaleCompare("ja")。
let sortState = fighterApi.nextSort({ key: 'ovr', asc: false }, 'ovr');
assert.strictEqual(sortState.key, 'ovr');
assert.strictEqual(sortState.asc, true, '同列再クリックで昇順へトグル');
sortState = fighterApi.nextSort(sortState, 'name');
assert.strictEqual(sortState.key, 'name');
assert.strictEqual(sortState.asc, false, '別列は降順から開始');
sortState = fighterApi.nextSort(sortState, 'name');
assert.strictEqual(sortState.asc, true, '名前列も再クリックで昇降トグル');
const nameA = { name: '阿武隈塔子' };
const nameB = { name: '白銀麗子' };
assert.strictEqual(
  Math.sign(fighterApi.compare(nameA, nameB, 'name', true)),
  Math.sign(nameA.name.localeCompare(nameB.name, 'ja')),
  '名前比較はlocaleCompare("ja")'
);
let renderCalls = 0;
context.App.renderFighterFile = () => { renderCalls += 1; return true; };
context.App.sortFighterFile('name');
assert.strictEqual(renderCalls, 1, 'th 1クリック相当で再描画は1回だけ');

// 5. タイトル配色はローカル上書きだけ。従来ボタン経路とOffice色は維持する。
assert.ok(indexSource.includes('--bg-dark: #24221e;'), 'Officeの暖茶トークンを維持');
assert.ok(indexSource.includes('.title-screen{--title-bg:#161b21;--title-glow:rgba(110,150,190,0.09);'));
assert.ok(indexSource.includes('filter:saturate(0.55)'), '顔マーキー彩度は0.55');
assert.ok(indexSource.includes('onclick="App.titleNewGame()"'));
assert.ok(indexSource.includes('onclick="App.titleContinue()"'));
assert.ok(indexSource.includes('onclick="App.titleLoadGame()"'));
assert.ok(indexSource.includes('onclick="App.showCredits()"'));
assert.ok(indexSource.includes('onclick="App.showFighterFile()">Fighter File'));

// 6. ゲーム状態・乱数から独立し、塗り/バーは共通ヘルパーだけを使う。
assert.ok(!/\bG\b/.test(fighterBlock), '選手ファイル実装はゲーム状態を読み書きしない');
assert.ok(!/Math\.random|Engine\.rng|sessionRng/.test(fighterBlock), '乱数を消費しない');
assert.ok(fighterBlock.includes('statTierStyle('), '数値塗りは共通ヘルパー経由');
assert.ok(fighterBlock.includes('statOverBarHtml('), 'バーは共通ヘルパー経由');
assert.ok(!fighterBlock.includes('stat-over-fill'), '選手ファイル内にバーHTMLを重複実装しない');

console.log('fighter-file-guard-test: ok');
