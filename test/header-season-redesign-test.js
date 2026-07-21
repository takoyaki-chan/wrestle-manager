const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const management = read('src', 'management.js');
const render = read('src', 'ui-render.js');
const html = read('src', 'index.html');

const sandbox = {};
vm.runInNewContext(`${management}\nthis.__engine = Engine;`, sandbox);
const util = sandbox.__engine.util;

assert.strictEqual(util.formatDate(1, 1), '1年目 🌸春 第1週');
assert.strictEqual(util.formatDate(2, 12), '2年目 🌸春 第12週');
assert.strictEqual(util.formatDate(2, 13), '2年目 ☀️夏 第1週');
assert.strictEqual(util.formatDate(2, 25), '2年目 🍂秋 第1週');
assert.strictEqual(util.formatDate(2, 37), '2年目 ❄️冬 第1週');
assert.strictEqual(util.formatDate(10, 48), '10年目 ❄️冬 第12週');
assert.deepStrictEqual(Array.from(util.getSeasonInfo(33).months), [10, 11, 12]);
assert.strictEqual(util.getSeasonInfo(41).id, 'winter');
assert.strictEqual(util.getSeasonInfo(41).month, 2);

assert.ok(html.includes('class="top-bar-clock"'));
assert.ok(html.includes('class="top-bar-date" id="dispDate"'));
assert.ok(html.includes('class="top-bar-audio"'));
assert.ok(!html.includes('class="top-bar-title"'), 'obsolete product title must be removed from the header');

assert.ok(render.includes('function _renderWeekSeasonTrack'));
assert.ok(render.includes("Array.from({ length: Engine.util.WEEKS_PER_SEASON }"));
assert.ok(render.includes('class="week-season-track" role="img"'));
assert.ok(!render.includes('const qtr = QUARTER_LABELS'), 'dead quarter label must be removed');
assert.ok(!render.includes('function getShachoshitsuSeasonId'), 'season routing must use Engine.util');
assert.ok(!/weekTitle'\)\.textContent\s*=.*formatDate/.test(render), 'week title must not duplicate the global date');

const seasonCssStart = html.indexOf('/* Week dashboard season track */');
const seasonCssEnd = html.indexOf('/* Crisis Warning Bar', seasonCssStart);
assert.ok(seasonCssStart >= 0 && seasonCssEnd > seasonCssStart);
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(html.slice(seasonCssStart, seasonCssEnd)), 'season track CSS must only use theme tokens');

console.log('header-season-redesign-test: ok');
