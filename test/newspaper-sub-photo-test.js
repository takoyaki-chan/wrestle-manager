// newspaper-sub-photo-test.js
//
// task-54: 新聞サブ記事(業界ニュース欄)の写真。
//
// Keisuke 実機報告(2026-07-31): 「新人の記事に関して画像が入っていない。できれば複数人いる
// なら複数人画像が間に入るといいんだけど」
//
// 原因は2つ:
//   1. サブ記事の写真枠が単数の characterId しか見ておらず、ドラフト系記事が積んでいる
//      characterIds(複数)を無視していた
//   2. 写真枠が 72×72 の正方形。素材(upper)は 256×384(2:3)なので体が切れていた
//
// この修正:
//   - `_npSubPhotoHtml(ss)` を新設。characterIds が2件以上あれば §2-B の隊列
//     (枠は外側に1つだけ・18px重ね・drop-shadow・個々に額縁なし)で最大3人を出し、
//     元の人数が3人を超える場合は「+N」を添える
//   - characterIds が無い/1件だけの記事は今までどおり単発チップ(72×72 → 46×66 の
//     2:3梯子chip段に縮小)
//   - どちらの情報も無い旧バックナンバーは例外を出さず空枠を描く
//   - `Engine.newspaper.generate`(src/management.js)の characterIds slice を
//     0,2 → 0,3 に広げ、元の人数を characterCount として story に残す

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const renderSrc = read('src/ui-render.js');
const mgmtSrc = read('src/management.js');
const htmlSrc = read('src/index.html');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

console.log('=== 新聞サブ記事の写真(隊列 + 2:3 chip) ===\n');

// ─────────────────────────────────────────────────────────────
// セットアップ: _npPhotoBg / _npSubPhotoHtml を ui-render.js から抜き出して実行
// ─────────────────────────────────────────────────────────────

function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `${name} must be defined in src/ui-render.js`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`could not extract ${name}`);
}

const FIGHTERS = {
  101: { id: 101, name: '一ノ瀬アカリ' },
  102: { id: 102, name: '二階堂ミナ' },
  103: { id: 103, name: '三宅リオ' },
  104: { id: 104, name: '四条ユウ' },
  105: { id: 105, name: '五十嵐カエデ' },
};
const PORTRAIT_URLS = {
  101: '../image/upper/upper_101.webp',
  102: '../image/upper/upper_102.webp',
  103: '../image/upper/upper_103.webp',
  // 104, 105 はわざと欠番(画像URLが引けないケースの防御確認用)
};

function makeContext() {
  const ctx = {
    ALL_CHARS: Object.values(FIGHTERS),
    getUpperUrl: id => PORTRAIT_URLS[id] || '',
    escHtml: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  };
  vm.createContext(ctx);
  // P6(2026-08-02): _npPhotoBg が汎用画像へ落ちる段を持つようになったので、
  // 対応表と _npGenericPhotoBg も一緒に持ち込む(片方だけだと ReferenceError で落ちる)
  const tblAt = renderSrc.indexOf('const NP_GENERIC_PHOTO');
  const genericTable = tblAt >= 0
    ? renderSrc.slice(tblAt, renderSrc.indexOf('const NP_GENERIC_VARIANTS', tblAt)) + 'const NP_GENERIC_VARIANTS = 3;'
    : '';
  const code = [
    genericTable,
    tblAt >= 0 ? extractFunction(renderSrc, '_npGenericPhotoBg') : '',
    extractFunction(renderSrc, '_npPhotoBg'),
    extractFunction(renderSrc, '_npSubPhotoHtml'),
  ].filter(Boolean).join(String.fromCharCode(10));
  vm.runInContext(code, ctx);
  return ctx;
}

const ctx = makeContext();

// ─────────────────────────────────────────────────────────────
// A. 1人記事 — 今までどおり単発チップ
// ─────────────────────────────────────────────────────────────

section('A1. characterId のみ(旧形式)は単発チップ1枚', () => {
  const html = ctx._npSubPhotoHtml({ characterId: 101 });
  assert.ok(html.includes('class="np-sub-photo"'), '単発チップのクラスが無い: ' + html);
  assert.ok(!html.includes('np-sub-photo-group'), '単発なのに隊列クラスが出ている: ' + html);
  assert.ok(html.includes(PORTRAIT_URLS[101]), '画像URLが背景に入っていない: ' + html);
  assert.ok(html.includes('onclick="showFighterPopup(101)"'), 'クリックで選手詳細に飛ぶ経路が無い: ' + html);
});

section('A2. characterIds が1件だけでも単発チップ扱い(隊列にしない)', () => {
  const html = ctx._npSubPhotoHtml({ characterIds: [102] });
  assert.ok(html.includes('class="np-sub-photo"'), html);
  assert.ok(!html.includes('np-sub-photo-group'), '1人なのに隊列になっている: ' + html);
  assert.ok(html.includes('onclick="showFighterPopup(102)"'), html);
});

// ─────────────────────────────────────────────────────────────
// B. 2人記事 — 隊列(外枠1つ・18px重ね・個々に額縁なし)
// ─────────────────────────────────────────────────────────────

section('B1. characterIds 2件は隊列(外枠1つ)になる', () => {
  const html = ctx._npSubPhotoHtml({ characterIds: [101, 102] });
  assert.ok(html.includes('class="np-sub-photo-group"'), '隊列の外枠クラスが無い: ' + html);
  const memberCount = (html.match(/class="np-sub-photo-member"/g) || []).length;
  assert.strictEqual(memberCount, 2, `隊列の人数が2人ではない(${memberCount}人): ${html}`);
  assert.ok(html.includes(PORTRAIT_URLS[101]) && html.includes(PORTRAIT_URLS[102]),
    '2人分の画像URLが両方入っていない: ' + html);
  assert.ok(!html.includes('np-sub-photo-more'), '2人ちょうどなのに+Nバッジが出ている: ' + html);
});

section('B2. 隊列の各顔にクリック経路が付く(個別ID)', () => {
  const html = ctx._npSubPhotoHtml({ characterIds: [101, 102] });
  assert.ok(html.includes('onclick="showFighterPopup(101)"'), html);
  assert.ok(html.includes('onclick="showFighterPopup(102)"'), html);
});

section('B3. 隊列は「群の外枠1つだけ」— メンバー個々に border/box-shadow を持たせていない', () => {
  const html = ctx._npSubPhotoHtml({ characterIds: [101, 102] });
  // メンバーのdiv自体にはクラス以外の装飾(border/box-shadow等のインラインstyle)を持たせない。
  // z-indexだけがinline styleとして許容される。
  const memberDivs = html.match(/<div class="np-sub-photo-member"[^>]*>/g) || [];
  assert.strictEqual(memberDivs.length, 2, html);
  memberDivs.forEach(tag => {
    assert.ok(!/border|box-shadow/i.test(tag), `メンバー個別に額縁/影を持たせている: ${tag}`);
    assert.ok(/style="z-index:\d+"/.test(tag), `z-index が無い(手前/奥の重なり順が付かない): ${tag}`);
  });
});

// ─────────────────────────────────────────────────────────────
// C. 3人記事 — 最大3人・超過分は "+N"
// ─────────────────────────────────────────────────────────────

section('C1. characterIds 3件ちょうどは3人出て+Nは出ない', () => {
  const html = ctx._npSubPhotoHtml({ characterIds: [101, 102, 103] });
  const memberCount = (html.match(/class="np-sub-photo-member"/g) || []).length;
  assert.strictEqual(memberCount, 3, html);
  assert.ok(!html.includes('np-sub-photo-more'), '3人ちょうどなのに+Nバッジが出ている: ' + html);
});

section('C2. characterCount が元の人数を持っていれば3人+"+N"バッジになる', () => {
  // 例: 5人獲得記事で characterIds は3件にslice済み・characterCount=5が渡ってくるケース
  const html = ctx._npSubPhotoHtml({ characterIds: [101, 102, 103], characterCount: 5 });
  const memberCount = (html.match(/class="np-sub-photo-member"/g) || []).length;
  assert.strictEqual(memberCount, 3, '写真は3人までのはず: ' + html);
  assert.ok(html.includes('class="np-sub-photo-more">+2<'), '+2 バッジが出ていない: ' + html);
});

section('C3. characterIds が3件を超えていても写真は3人までに切る(描画側の安全側)', () => {
  const html = ctx._npSubPhotoHtml({ characterIds: [101, 102, 103, 104, 105] });
  const memberCount = (html.match(/class="np-sub-photo-member"/g) || []).length;
  assert.ok(memberCount <= 3, `4人以上の写真が出ている(${memberCount}人): ${html}`);
});

// ─────────────────────────────────────────────────────────────
// D. 画像URLが引けないケース / 情報が無いケース(旧バックナンバー)は例外にならない
// ─────────────────────────────────────────────────────────────

section('D1. characterIds は複数あるが getUpperUrl が全滅 → 例外にならず何かを返す', () => {
  assert.doesNotThrow(() => {
    const html = ctx._npSubPhotoHtml({ characterIds: [104, 105] }); // どちらもURL無し
    assert.strictEqual(typeof html, 'string');
  });
});

section('D2. characterId も characterIds も無い(旧バックナンバー) → 空枠・例外なし', () => {
  const html = ctx._npSubPhotoHtml({ headline: '見出しだけの古い記事' });
  assert.doesNotThrow(() => ctx._npSubPhotoHtml({}));
  assert.ok(html.includes('class="np-sub-photo"'), html);
  assert.ok(!html.includes('np-sub-photo-group'), html);
  assert.ok(!html.includes('onclick='), 'IDが無いのにクリック経路が付いている: ' + html);
});

section('D3. characterIds が空配列(旧データの取り違え等) → 単発チップの空枠に落ちる', () => {
  const html = ctx._npSubPhotoHtml({ characterIds: [] });
  assert.ok(html.includes('class="np-sub-photo"'), html);
  assert.ok(!html.includes('np-sub-photo-group'), html);
});

// ─────────────────────────────────────────────────────────────
// E. CSS — 2:3梯子の chip 段(46×66)・隊列(18px重ね・drop-shadow)
// ─────────────────────────────────────────────────────────────

section('E1. .np-sub-photo は 72×72 ではなく chip 46×66', () => {
  const m = htmlSrc.match(/\.np-sub-photo\s*\{([^}]*)\}/);
  assert.ok(m, '.np-sub-photo が index.html に無い');
  const body = m[1];
  assert.ok(/width:\s*46px/.test(body), `width が46pxではない: ${body}`);
  assert.ok(/height:\s*66px/.test(body), `height が66pxではない: ${body}`);
  assert.ok(!/72px/.test(body), `72pxがまだ残っている(退行): ${body}`);
});

section('E2. .np-sub-photo-group は隊列の外枠を1つだけ持つ(background/border/box-shadowあり)', () => {
  const m = htmlSrc.match(/\.np-sub-photo-group\s*\{([^}]*)\}/);
  assert.ok(m, '.np-sub-photo-group が index.html に無い');
  const body = m[1];
  assert.ok(/background-color/.test(body), body);
  assert.ok(/border:/.test(body), body);
  assert.ok(/box-shadow/.test(body), body);
});

section('E3. .np-sub-photo-member は 46×66 で border/box-shadow を持たない(個々に額縁を付けない)', () => {
  const m = htmlSrc.match(/\.np-sub-photo-member\s*\{([^}]*)\}/);
  assert.ok(m, '.np-sub-photo-member が index.html に無い');
  const body = m[1];
  assert.ok(/width:\s*46px/.test(body) && /height:\s*66px/.test(body), body);
  assert.ok(!/border[^-]/.test(body), `メンバー個々に border を持たせている: ${body}`);
  assert.ok(!/box-shadow/.test(body), `メンバー個々に box-shadow を持たせている(矩形に付くので誤り): ${body}`);
});

section('E4. 重なりは 18px の負のマージン', () => {
  assert.ok(/\.np-sub-photo-member\s*\+\s*\.np-sub-photo-member\s*\{\s*margin-left:\s*-18px/.test(htmlSrc),
    '.np-sub-photo-member + .np-sub-photo-member の -18px 重ねが見つからない');
});

section('E5. 落ち影は drop-shadow(box-shadow ではない)をメンバー画像に使う', () => {
  const m = htmlSrc.match(/\.np-sub-photo-member img\s*\{([^}]*)\}/);
  assert.ok(m, '.np-sub-photo-member img が index.html に無い');
  assert.ok(/filter:\s*drop-shadow\(/.test(m[1]), `drop-shadow が無い: ${m[1]}`);
  assert.ok(!/box-shadow/.test(m[1]), `box-shadow を使っている(矩形に付くので誤り): ${m[1]}`);
});

section('E6. 375px幅(@media max-width:820px)で .np-sub-grid が1列に落ちる(既存の仕組みを壊していない)', () => {
  // 820px以下の @media ブロックは複数あるので、全部から .np-sub-grid の1列指定を探す
  const blocks = [...htmlSrc.matchAll(/@media \(max-width: 820px\)\s*\{([\s\S]*?)\n\}/g)].map(m => m[1]);
  assert.ok(blocks.length > 0, '@media (max-width: 820px) ブロックが見つからない');
  const found = blocks.some(b => /\.np-sub-grid\s*\{\s*grid-template-columns:\s*1fr;\s*\}/.test(b));
  assert.ok(found, '.np-sub-grid の1列フォールバックがどの820px media queryにも無い');
});

section('E7. 新規16進カラーは既存パレット内の値の再利用(np-sub-photo-* が使う色は他の np- ルールにも出現する)', () => {
  const groupBlock = (htmlSrc.match(/\.np-sub-photo-group\s*\{([^}]*)\}/) || [])[1] || '';
  const moreBlock = (htmlSrc.match(/\.np-sub-photo-more\s*\{([^}]*)\}/) || [])[1] || '';
  const hexes = [...(groupBlock + ' ' + moreBlock).matchAll(/#[0-9a-fA-F]{3,6}/g)].map(m => m[0].toLowerCase());
  assert.ok(hexes.length > 0, '色が1つも無い(想定外)');
  hexes.forEach(hex => {
    const occurrences = (htmlSrc.match(new RegExp(hex.replace('#', '#'), 'gi')) || []).length;
    assert.ok(occurrences >= 2, `${hex} が np-sub-photo-* 以外で使われていない(新規色の可能性): 出現${occurrences}回`);
  });
});

// ─────────────────────────────────────────────────────────────
// F. management.js — characterIds slice と characterCount
// ─────────────────────────────────────────────────────────────

section('F1. Engine.newspaper.generate の characterIds slice が 3 に広がっている', () => {
  assert.ok(/characterIds:\s*Array\.isArray\(ev\.characterIds\)\s*\?\s*ev\.characterIds\.slice\(0,\s*3\)\s*:\s*null/.test(mgmtSrc),
    'characterIds の slice(0, 3) が見つからない');
});

section('F2. characterCount が元の人数として story に残る', () => {
  assert.ok(/characterCount:\s*Array\.isArray\(ev\.characterIds\)\s*\?\s*ev\.characterIds\.length\s*:\s*0/.test(mgmtSrc),
    'characterCount フィールドが見つからない');
});

// ─────────────────────────────────────────────────────────────
console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILED'}`);
process.exit(failed === 0 ? 0 : 1);
