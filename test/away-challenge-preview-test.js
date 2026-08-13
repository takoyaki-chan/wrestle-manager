'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const css = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

function functionSource(name) {
  const start = ui.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}' && --depth === 0) return ui.slice(start, i + 1);
  }
  throw new Error(`${name} end not found`);
}

const statsHtml = new Function(`${functionSource('_awayChallengeStatsHtml')}; return _awayChallengeStatsHtml;`)();
const left = { pw: 80, sp: 95, te: 70, st: 60, mn: 55 };
const right = { pw: 75, sp: 95, te: 90, st: 61, mn: 40 };
const band = statsHtml(left, right);

assert.strictEqual((band.match(/class="fc1m-stat"/g) || []).length, 5, 'fc1m式の5項目帯を出す');
assert.match(band, /PW<\/div><div class="fc1m-stat-val fc1m-higher">80/, '優位なPWだけ点灯する');
assert.match(band, /SP<\/div><div class="fc1m-stat-val">95/, '同値は点灯しない');
assert.match(band, /TE<\/div><div class="fc1m-stat-val">70/, '劣位値は点灯しない');
assert.match(band, /MN<\/div><div class="fc1m-stat-val fc1m-higher">55/, '優位なMNを点灯する');

const preview = functionSource('renderMatchPreview');
const awayBranchAt = preview.indexOf('// 敵地はfc1m');
const regularBranchAt = preview.indexOf('// 通常興行は既存の5カラムDOM');
assert.ok(awayBranchAt > 0 && regularBranchAt > awayBranchAt, 'awayと通常興行の描画分岐を分離する');
const awayBranch = preview.slice(awayBranchAt, regularBranchAt);
const regularBranch = preview.slice(regularBranchAt, preview.indexOf('// ステータス別ボトム'));
assert.ok(awayBranch.includes('smc-away-arena') && awayBranch.includes('smc-away-stats'), 'awayは専用3列と人物下の能力帯を使う');
assert.ok(!awayBranch.includes('_showStatItem('), 'awayでは左右の旧ステータスバーを出さない');
assert.ok(regularBranch.includes('smc-arena') && regularBranch.includes('smc-stat-col left'), '通常興行は既存5カラムDOMを維持する');
assert.ok(regularBranch.includes("_showStatItem('PW'") && regularBranch.includes("_showStatItem('MN'"), '通常興行の5能力バーを維持する');

const awayCssStart = css.indexOf('task-95: 遠征試合進行画面');
const awayCssEnd = css.indexOf('Show Result — Pattern B', awayCssStart);
assert.ok(awayCssStart >= 0 && awayCssEnd > awayCssStart, 'task-95 away CSS block exists');
const awayCss = css.slice(awayCssStart, awayCssEnd);
assert.ok(awayCss.includes('var(--accent-war)') && awayCss.includes('var(--accent-war-rgb)'), '黒×火の赤は既存トークンを使う');
assert.ok(awayCss.includes('.is-player-side .fc1m-higher{color:var(--gold-light)'), '自陣の優位値は金で点灯する');
assert.ok(awayCss.includes('.is-foe-side .fc1m-higher{color:var(--awx-fire-hi)'), '敵陣の優位値は赤で点灯する');
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(awayCss), 'away追加CSSに16進カラーを直書きしない');

console.log('away-challenge-preview-test: ok');
