'use strict';
// newspaper-generic-photo-test.js — 新聞P6「記事用の汎用画像」
//
// §3 の優先順: 人物写真(アッパー) → 汎用画像 → それも当たらなければ写真なし。
// 人物が特定できない記事(団体の動き・告知・制度の話)に写真が無く、
// 一面に載ると枠が黒く空いていた。**「一面なのに写真がない」を仕組みで防ぐ**段。
//
// ここで守るのは3つ:
//   1. 人物写真が**先**に当たること(逆にすると顔が出なくなる)
//   2. 参照するファイルが**実在する**こと(綴り違いは黒い枠になって初めて気づく)
//   3. 割り当ての無い記事では**無理に画像を出さない**こと

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');

function cut(name) {
  const m = 'function ' + name + '(';
  const a = src.indexOf(m);
  assert.ok(a >= 0, `${name} が ui-render.js に無い`);
  let d = 0;
  for (let i = src.indexOf('{', a); i < src.length; i += 1) {
    if (src[i] === '{') d += 1;
    if (src[i] === '}') d -= 1;
    if (d === 0) return src.slice(a, i + 1);
  }
  throw new Error(name + ' の終端が見つからない');
}

const tblAt = src.indexOf('const NP_GENERIC_PHOTO');
assert.ok(tblAt > 0, '汎用画像の対応表が無い');
const table = src.slice(tblAt, src.indexOf('const NP_GENERIC_VARIANTS', tblAt)) + 'const NP_GENERIC_VARIANTS = 3;';

const ctx = { G: { season: 5, week: 20 }, getUpperUrl: (id) => (id === 101 ? '../image/upper/upper_x.webp' : '') };
vm.createContext(ctx);
vm.runInContext(`${table}\n${cut('_npGenericPhotoBg')}\n${cut('_npPhotoBg')}\nthis.f = _npPhotoBg;\nthis.T = NP_GENERIC_PHOTO;`, ctx);

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); }
}

console.log('=== 新聞P6 記事用の汎用画像 ===\n');

section('1. 人物写真が汎用画像より先に当たる', () => {
  const out = ctx.f(101, { type: 'longInjury' });
  assert.ok(/image\/upper\//.test(out), `人物写真が使われていない: ${out}`);
  assert.ok(!/image\/news\//.test(out), '人物がいるのに汎用画像へ落ちている');
});

section('2. 人物が取れない記事は汎用画像へ落ちる', () => {
  ['springTagAnnounce', 'autumnWarAnnounce', 'lockerRoomCrisis', 'playerTitleChange', 'draftRoundup']
    .forEach(type => {
      const out = ctx.f(null, { type });
      assert.ok(/image\/news\//.test(out), `${type} で写真枠が空のまま: ${out || '(空)'}`);
    });
});

section('3. 参照するファイルが実在する(綴り違いは黒い枠にしかならない)', () => {
  const missing = [];
  Object.keys(ctx.T).forEach(type => {
    // 週を変えて3バリエーションすべてを踏む
    for (let w = 1; w <= 3; w += 1) {
      ctx.G.week = w;
      const out = ctx.f(null, { type });
      const m = out.match(/image\/news\/([a-z_0-9]+\.webp)/);
      if (!m) { missing.push(`${type}: 画像に落ちない`); continue; }
      if (!fs.existsSync(path.join(root, 'image', 'news', m[1]))) missing.push(`${type}: ${m[1]} が無い`);
    }
  });
  ctx.G.week = 20;
  assert.strictEqual(missing.length, 0, '実在しない参照:\n        ' + missing.join('\n        '));
});

section('4. 割り当ての無い記事では無理に画像を出さない', () => {
  assert.strictEqual(ctx.f(null, { type: 'aiMediaStart' }), '', '割り当ての無い記事に画像が付いている');
  assert.strictEqual(ctx.f(null, null), '', '記事が無いのに画像が付いている');
});

section('5. 素材は 256x384 / 40KB以内(紙面の枠に合わせた寸法)', () => {
  const dir = path.join(root, 'image', 'news');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.webp')) : [];
  assert.ok(files.length >= 27, `素材が足りない (${files.length}枚)`);
  const bad = [];
  files.forEach(f => {
    const b = fs.readFileSync(path.join(dir, f));
    let w = 0, h = 0;
    const chunk = b.slice(12, 16).toString();
    if (chunk === 'VP8X') { w = (b[24] | b[25] << 8 | b[26] << 16) + 1; h = (b[27] | b[28] << 8 | b[29] << 16) + 1; }
    else if (chunk === 'VP8 ') { w = (b[26] | b[27] << 8) & 0x3fff; h = (b[28] | b[29] << 8) & 0x3fff; }
    else if (chunk === 'VP8L') { const v = b.readUInt32LE(21); w = (v & 0x3fff) + 1; h = ((v >> 14) & 0x3fff) + 1; }
    if (w !== 256 || h !== 384) bad.push(`${f} ${w}x${h}`);
    if (b.length > 40 * 1024) bad.push(`${f} ${Math.round(b.length / 1024)}KB`);
  });
  assert.strictEqual(bad.length, 0, '仕様外の素材: ' + bad.join(', '));
});

console.log('');
if (failed > 0) { console.log(`newspaper-generic-photo-test: ${failed} FAILED`); process.exit(1); }
console.log('newspaper-generic-photo-test: ok');
