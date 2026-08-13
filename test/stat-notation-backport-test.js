'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n');
const uiCommon = read('src/ui-common.js');
const uiRender = read('src/ui-render.js');
const indexHtml = read('src/index.html');

function markedBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `開始マーカーが見つからない: ${startMarker}`);
  assert.ok(end > start, `終了マーカーが見つからない: ${endMarker}`);
  return source.slice(start, end + endMarker.length);
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} が見つからない`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} の終端が見つからない`);
}

function countCalls(source, name) {
  const occurrences = source.match(new RegExp(`${name}\\s*\\(`, 'g')) || [];
  const definitions = source.match(new RegExp(`function\\s+${name}\\s*\\(`, 'g')) || [];
  return occurrences.length - definitions.length;
}

const statBlock = markedBlock(
  uiCommon,
  '// ── task-90: 共通数値表記(stat-notation-v1.0)',
  '// ── /task-90: 共通数値表記'
);
const statDecaySource = extractFunction(uiCommon, 'statDecayView');
const detailBarsSource = extractFunction(uiCommon, '_fighterPopupStatBarsHtml');
const dbBlock = extractFunction(uiRender, '_renderDbFighters');
const popupBlock = markedBlock(uiCommon, 'function showFighterPopup(', '\nfunction closeFighterPopup(');

const sharedContext = { STAT_TIPS: { pw: 'パワー', sp: 'スピード', te: 'テクニック', st: 'スタミナ', mn: 'マインド' } };
vm.runInNewContext(`${statBlock}\n${statDecaySource}\n${detailBarsSource}\nthis.api = {
  statTierStyle, barDispOver, statOverBarHtml, detailBars: _fighterPopupStatBarsHtml,
};`, sharedContext, { filename: 'stat-notation-backport-shared.js' });
const statApi = sharedContext.api;

// 1. DB全選手一覧の生成HTMLは、OVR+ステ5列だけが共通7帯へ移行している。
const dbFighters = [
  {
    id: 1, name: '帯境界', style: 'Allround', _orgTier: 'player', _orgId: 'player', _orgName: 'テスト団体',
    ovr: 95, pw: 44, sp: 45, te: 60, st: 70, mn: 101, age: 20, popularity: 55,
  },
  {
    id: 2, name: '系統色', style: 'Allround', _orgTier: 'player', _orgId: 'player', _orgName: 'テスト団体',
    ovr: 101, pw: 90, sp: 90, te: 90, st: 90, mn: 90, age: 21, popularity: 60,
  },
];
const dbContext = {
  Engine: {
    database: { getAllFighters: () => dbFighters },
    util: { ov: fighter => fighter.ovr, dispPop: value => value },
    springTagLeague: { getActiveBestTagTeam: () => null },
  },
  G: { orgName: 'テスト団体', retiredFighters: [], titles: { world: {} }, aiOrgs: {} },
  RIVAL_ORGS: [],
  _dbFilterOrg: '', _dbFilterStyle: '', _dbFilterName: '', _dbSortKey: 'ovr', _dbSortAsc: false,
  portraitImg: id => `<span class="portrait">${id}</span>`,
  _popColor: () => ({ color: '#pop-preserved' }),
};
vm.runInNewContext(`${statBlock}
${extractFunction(uiRender, '_statCell')}
${extractFunction(uiRender, '_dbBuildTournamentTitleChampions')}
${extractFunction(uiRender, '_dbBuildFighterTitleBadges')}
${dbBlock}
this.dbHtml = _renderDbFighters();`, dbContext, { filename: 'stat-notation-backport-db.js' });
const dbHtml = dbContext.dbHtml;
assert.match(dbHtml, /style="color:#d4a843;font-weight:700;font-size:15px">95<\/td>/, 'OVR 95は金の純色+太字');
assert.match(dbHtml, /text-shadow:0 0 6px #d4a843cc,0 0 14px #d4a84355[^>]*>101<\/td>/, 'OVR 100超だけがglow');
assert.match(dbHtml, /style="font-size:12px;color:#63615b">44<\/td>/, '44は暗灰');
assert.match(dbHtml, /style="font-size:12px;color:#a8a59d">45<\/td>/, '45は明灰');
assert.match(dbHtml, /style="font-size:12px;color:#f2f0e8">60<\/td>/, '60は白');
assert.match(dbHtml, /style="font-size:12px;color:#e74c3c;font-weight:700">90<\/td>/, 'PW純色');
assert.match(dbHtml, /style="font-size:12px;color:#2ecc71;font-weight:700">90<\/td>/, 'SPは緑');
assert.match(dbHtml, /style="font-size:12px;color:#3498db;font-weight:700">90<\/td>/, 'TEは青');
assert.ok(!dbHtml.includes('text-shadow:0 0 6px #f0d07880'), '旧OVR85+常時glowは生成HTMLに残らない');
assert.strictEqual((dbHtml.match(/<th\b/g) || []).length, 12, '列構成は12列のまま');
assert.strictEqual((dbHtml.match(/<tr class="clickable"/g) || []).length, 2, '全行のクリック遷移を維持');
for (const row of dbHtml.match(/<tr class="clickable"[\s\S]*?<\/tr>/g) || []) {
  assert.strictEqual((row.match(/<td\b/g) || []).length, 12, '各選手行のDOM列数は不変');
}
assert.ok(!extractFunction(uiRender, '_statCell').includes('>= 75'), 'DBセルに旧75以上3段塗りを残さない');
assert.ok(dbBlock.includes("statTierStyle('ovr', ovr)"), 'DBのOVRは共通ヘルパーを使う');
assert.strictEqual(countCalls(dbBlock, '_popColor'), 1, 'DB人気列は_popColorのまま');

// 2. 選手詳細能力タブの生成HTMLは、枠越えバーと7帯数値を共通部品から得る。
const detailHtml = statApi.detailBars({
  pw: 112, sp: 84, te: 80, st: 92, mn: 90,
  statPeak: { pw: 118, sp: 84, te: 80, st: 98, mn: 90 },
  seasonGrowth: { pw: 2, te: 2 },
}, [
  { key: 'pw', label: 'PW' }, { key: 'sp', label: 'SP' }, { key: 'te', label: 'TE' },
  { key: 'st', label: 'ST' }, { key: 'mn', label: 'MN' },
], false);
assert.strictEqual((detailHtml.match(/class="stat-over-row"/g) || []).length, 5, '能力5軸を枠越えバーで生成');
assert.ok(detailHtml.includes('stat-over-frame') && detailHtml.includes('stat-over-fill'), '枠=100の共通部品を使う');
assert.ok(detailHtml.includes('width:88.4%'), 'PW112を圧縮はみ出し幅へ変換');
assert.ok(detailHtml.includes('stat-over-ghost'), '消耗ゴーストを生成');
assert.ok(detailHtml.includes('▼6') && detailHtml.includes('+2'), '▼nと+nを同時に落とさず生成');
assert.ok(!detailHtml.includes('fighter-popup-stat-bar') && !detailHtml.includes('fighter-popup-stat-lost'), '旧0–150バー部品を生成しない');
assert.ok(!/stat-over-fill[^>]*(?:box-shadow|text-shadow|filter)/.test(detailHtml), 'バー自体にglow/box-shadowを付けない');
assert.ok(popupBlock.includes('font-size:36px;font-weight:900;color:var(--gold)'), '能力タブ外のヘッダOVRは変更しない');
assert.ok(popupBlock.includes('_fighterPopupStatBarsHtml(c, STATS, isAiFighter)'), '詳細バーは共通部品の画面ラッパーを使う');
assert.ok(!popupBlock.includes('val / 150') && !popupBlock.includes('fighter-popup-stat-lost'), '能力タブに旧0–150幾何を残さない');

// 3. レーダーは値・塗り・グリッドを変えず、軸ラベルだけを共通系統色へ渡す。
assert.ok(popupBlock.includes('value: c[s.key] || 0, color: _STAT_TIER_PURE[s.key]'), 'レーダー軸へ共通系統色を渡す');
assert.match(popupBlock, /\{key:'sp',label:'SP',color:'#2ecc71'/, 'SP軸は緑');
assert.match(popupBlock, /\{key:'te',label:'TE',color:'#3498db'/, 'TE軸は青');
const radarSource = markedBlock(uiCommon, 'function drawRadarChart(', '// ── v2.1: 体験版制限モーダル');
assert.ok(radarSource.includes('Math.min(100, Math.max(0, values[i] || 0))'), 'レーダー値の0–100クランプを維持');
assert.ok(radarSource.includes('[20, 40, 60, 80, 100]'), 'レーダーグリッドを維持');
assert.ok(radarSource.includes("ctx.fillStyle = s.color || 'rgba(255,255,255,0.7)'"), '軸ラベルだけがstats.colorを使う');

// 4. task-90共通ヘルパーの圧縮式を3点検算する。
assert.strictEqual(statApi.barDispOver(110), 103.6);
assert.strictEqual(statApi.barDispOver(130), 110.8);
assert.strictEqual(statApi.barDispOver(150), 118);

// 5. 対象外・非置換の旧カラーヘルパー呼び出し件数をtask-91着手時の値へ固定する。
const colorSources = uiCommon + '\n' + uiRender;
assert.strictEqual(countCalls(colorSources, '_ovrColor'), 6, '対象外_ovrColorは着手前6件のまま');
assert.strictEqual(countCalls(colorSources, '_scale6Style'), 19, '対象外_scale6Styleは着手前19件のまま');
assert.strictEqual(countCalls(colorSources, '_popColor'), 9, '非置換_popColorは着手前9件のまま');
assert.strictEqual(countCalls(dbBlock, '_ovrColor'), 0, 'DB対象OVRから旧色を除去');
assert.strictEqual(countCalls(dbBlock, '_scale6Style'), 0, 'DB対象OVRから旧glowを除去');
assert.strictEqual(countCalls(popupBlock, '_ovrColor'), 1, '詳細のピークOVR表示は変更しない');
assert.strictEqual(countCalls(popupBlock, '_scale6Style'), 5, '詳細の人気・ベストMQ・ピークOVRは変更しない');
assert.strictEqual(countCalls(popupBlock, '_popColor'), 3, '詳細の人気表示は変更しない');

// 6. task-90のバーCSSを共用し、追加定義やバー発光を要求しない。
assert.ok(indexHtml.includes('.stat-over-frame{') && indexHtml.includes('width:84.746%'), '枠=100終端CSSを共用');
assert.ok(indexHtml.includes('.stat-over-ghost{') && indexHtml.includes('opacity:.28'), 'ゴーストは同色28%');
const fillRule = (indexHtml.match(/\.stat-over-fill\{[^}]*\}/) || [''])[0];
assert.ok(!/box-shadow|text-shadow|filter/.test(fillRule), 'バーfill CSSに発光を付けない');

console.log('stat-notation-backport-test: ok');
