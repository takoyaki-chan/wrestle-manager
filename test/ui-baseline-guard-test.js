'use strict';

// ui-baseline-guard-test — mockup-baseline-v0.1 §2/§2-C「梯子」の機械ガード
//
// CLAUDE.md「頻出違反チェックリスト」1・2番の機械検査担当。
//   Part A: 共有部品の梯子値そのものが書き換えられていないか(改変検知)
//   Part B: 人物系セレクタの width+height 固定値が
//           「2:3梯子(XL/L/M/S/chip)」「52px以下の正方形(§2-C)」「許容リスト」
//           のいずれでもない = 新規の梯子外サイズを検出する
//
// 検査対象は CSS(HTML内<style>ブロック + src/*.css)のみ。JSテンプレート内の
// インラインstyleは対象外(そこは /ui-check の目視チェックが担当)。
//
// 新しく梯子外サイズが必要になったら、まず梯子の段(XL 172×258 / L 150×224 /
// M 132×194 / S 108×162 / chip 46×66、正方形faceは card 52 / row 40 / row-sm 24)
// に乗せられないか検討する。意図的に外すと決めたときだけ、下の ALLOW に
// 「セレクタ | WxH」を理由コメント付きで1行追加する。
//
// 許容リストの初期内容は 2026-08-12 時点の全数スキャンを凍結したもの
// (faceout-audit v0.1/v0.2 の保留5件+監査対象外レガシーを含む)。
// ここに載っているのは「準拠」ではなく「既知」— 減らす方向が正。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// 2:3梯子(§2)
const LADDER = [
  [172, 258], // XL
  [150, 224], // L
  [132, 194], // M
  [108, 162], // S
  [46, 66],   // chip
];
const FACE_SQ_MAX = 52; // §2-C: 正方形は card 52 が上限(row 40 / row-sm 24 / 道場34もここを通る)

// 人物系セレクタの判定キーワード(このコードベースの命名慣習に合わせる)
const PORTRAIT_RE = /port|\bpor\b|upper|face|avatar|photo|thumb|fighter|fcell|stand|duo|trio|member|\bchar\b|-fp\b|\bpp\b|\bimg\b|jtc-up\b|-cf\b/i;
// キーワードに引っかかっても人物画像でないもの(紋章・判子・装飾)
const EXCLUDE_RE = /emblem|badge|seal|medallion|crest|hanko|icon|logo|swatch|divider|::/i;

const SOURCES = [
  'src/index.html',
  'src/battle-engine.html',
  'src/tag-battle.html',
  'src/battle-shared.css',
  'src/battle-mobile.css',
  'src/mobile.css',
];

// ---------------------------------------------------------------------------
// 許容リスト: 「セレクタ | WxH」。理由はグループコメントで持つ。
// ---------------------------------------------------------------------------
const ALLOW = new Set([
  // --- faceout-audit v0.2 保留(2026-08-12): 新聞np-*は newspaper-spec-v1.0 管轄、
  //     wm-stat-upper は観戦Pattern C v4 の実機確認待ち ---
  '.np-top-photo | 200x240',
  '.np-fphoto | 130x130',
  '.np-fphoto | 100x100',
  '.np-tag-photo-member | 58x92',
  '.np-v3-photo-top | 190x228',
  '.np-v3-photo-kata | 84x126',
  '.np-matchup-photo | 64x64',
  '.np-spotlight-photo | 64x64',
  '.wm-stat-upper | 58x92',

  // --- 旧A/B/C/D型モーダル(UI統一残。_mdlASubjectStage の3:4見直しはモックアップ先行) ---
  '.mdl-a-subject-portrait | 150x200',
  '.mdl-a-subject-portrait.big | 200x267',
  '.mdl-a-duo-portrait | 140x186',
  '.mdl-a-vs-upper | 130x174',
  '.mdl-a-opponent-upper | 72x96',
  '.mdl-a-candidate-upper | 120x160',
  '.mdl-a-faction-clash-portrait | 104x136',
  '.mdl-a-faction-clash-portrait | 88x118',
  '.mdl-b-upper | 260x320',
  '.mdl-b-upper.small | 200x240',
  '.mdl-c-avatar | 56x56',
  '.mdl-d-face | 64x64',
  '.war-entry-stage .mdl-a-opponent-upper | 54x72',
  '.war-entry-candidate .mdl-a-candidate-upper | 90x120',

  // --- 派閥イベント旧画面(F02系はU3移行対象外。移行済み画面は .u3b-* co-classで上書きし
  //     元ルールは共有のため残置 — index.html内コメント参照) ---
  '.fevt-subject-portrait-wrap | 120x140',
  '.fevt-follower-portrait | 64x76',
  '.fevt-arena-portrait | 160x190',
  '.fevt-arena-portrait.loser | 110x130',
  '.fevt-arena-portrait.winner-big | 200x230',
  '.fevt-leader-upper | 260x320',
  '.fevt-lost-upper | 180x220',
  '.fevt-survivor-portrait | 64x64',
  '.fevt-res-winner .fevt-leader-upper | 280x340',
  '.fevt-res-loser .fevt-leader-upper | 220x270',
  '.fevt-endless-col .fevt-leader-upper | 200x250',
  '.fevt-peace-col .fevt-leader-upper | 230x280',
  '.fevt-ign-col .fevt-portrait-wrap | 220x260',
  '.fevt-ign-col.left .fevt-leader-upper | 220x260',
  '.fevt-ign-col.right .fevt-leader-upper | 220x260',
  '.decision-result-hero-portrait | 120x120',
  '.dfc-hero .leader-pp | 128x160',
  '.dfx-grid-neutral .dfc-hero .leader-pp | 112x140',

  // --- データベース/相関図タブの独自レイアウト(07-31監査の対象範囲外だった一群) ---
  '.db-faction-face-lg | 72x96',
  '.db-faction-face-md | 52x68',
  '.db-faction-face-sm | 36x48',
  '.db-record-upper.is-tenchosen | 132x198',
  '.db-record-upper.is-ppv | 96x144',
  '.db-record-upper.is-defense | 88x132',
  '.db-cmp-match-avatar | 72x72',
  '.db-cmp-match-avatar.lg | 132x132',
  '.db-cmp-match-avatar | 60x60',
  '.db-cmp-match-avatar.lg | 96x96',
  '.ace-char | 150x220',
  '.ace-char | 120x180',
  '.ace-char | 100x150',

  // --- 意図的な設計値(CSS内コメントに根拠あり) ---
  '.pb-mrow.is-main.is-jt .pb-portrait | 150x225',   // mockup-jt-restyle: JT/天頂戦ヒーロー主役化
  '.jtc-up.jtc-up-peak | 150x225',                   // 同上(JTクライム頂上)
  '.stl-final-side .faces | 152x76',                 // 対戦プレビューの一体チームフレーム(群枠)
  '.stl-match-preview .stl-final-side .faces | 96x48',

  // --- コーチ・NPC・タイトル画面等(選手主役表示ではない/監査対象外) ---
  '.coach-tooltip-avatar | 88x88',
  '.coach-tooltip-upper-img | 160x240',
  '.coach-tooltip-upper-img | 120x180',
  '.title-portraits img | 280x280',
  '.title-portraits img | 180x180',
  '.portrait-popup | 228x228',                        // ポップアップの外枠(画像そのものではない)
  '.fighter-popup-avatar | 56x56',
  '.ranking-popup .rp-rank img | 62x62',              // ランク章(人物ではない)だが img で拾われる

  // --- ランキング/表彰・リーグ演出の旧レイアウト ---
  '.ranking-popup .orgcell-fcell.pos-1 | 116x174',
  '.ranking-popup .orgcell-fcell.pos-2 | 92x138',
  '.ranking-popup .orgcell-fcell.pos-3 | 92x138',
  '.le-trio | 280x240',
  '.le-trio-center | 160x240',
  '.le-trio-side | 130x195',
  '.growth-event-face | 120x120',
  '.care-modal-face | 120x120',
  '.ppvmc-fighter | 200x280',
  '.ppvmc-card.is-main .ppvmc-fighter | 240x340',
  '.mc-fp | 140x260',
  '.jt-so-card-img img | 100x100',
  '.stl-match-preview .stl-final-side .faces img | 62x62',
  '.awpick-face | 72x86',
  '.awpick-cand .awpick-cf | 46x56',
  '.travel-face | 46x56',
  '.wm-tag-member-upper | 56x84',

  // --- モバイル/狭幅の比例縮小(メディアクエリ内。梯子の段に乗せ直すのは今後の課題) ---
  '.emr-upper | 72x114',
  '.show-pregame-a .card-main .smc-char .upper-wrap | 88x112',
  '.show-pregame-a .card-sub .smc-char .upper-wrap | 76x96',
  '.wm-tag-member-upper | 40x72',
  '.rm-mobile-hero-face | 74x74',
  '.rm-mobile-face | 54x54',
  '.card-main .smc-char .upper-wrap, .card-sub .smc-char .upper-wrap | 82x104',
  '.pb-container .pb-portrait, .pb-container .pb-mrow.is-main .pb-portrait | 62x93',
  '.pb-container .pb-mrow.is-main .pb-portrait | 68x102',
  '.draft-roster-grid .draft-fc-portrait | 88x124',
  '.draft-fc.cand .draft-fc-portrait | 88x120',
  '.draft-roster-grid .draft-fc-portrait, .draft-fc.cand .draft-fc-portrait | 80x112',
  '.ranking-popup .rp-ace-img | 76x98',
  '.ch-duo .ch-por | 108x161',
  '.ch-trio .ch-por | 100x150',
  '.ch-hero .ch-por | 132x198',
  '.agw-mvp-portrait | 83x124',
]);

// ---------------------------------------------------------------------------
// CSS抽出
// ---------------------------------------------------------------------------
function cssTextOf(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  let css;
  if (file.endsWith('.css')) {
    css = text;
  } else {
    css = '';
    const re = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let m;
    while ((m = re.exec(text))) css += m[1] + '\n';
  }
  return css.replace(/\/\*[\s\S]*?\*\//g, ''); // コメント除去
}

function rulesOf(css) {
  // @media 等のネスト1段は「外側{ 内側{...} }」の内側だけが body 付きで拾われる
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = m[1].trim().replace(/\s+/g, ' ');
    if (!sel || sel.startsWith('@')) continue;
    rules.push({ sel, body: m[2] });
  }
  return rules;
}

function sizeOf(body) {
  const w = body.match(/(?:^|[^-\w])width\s*:\s*(\d+(?:\.\d+)?)px/);
  const h = body.match(/(?:^|[^-\w])height\s*:\s*(\d+(?:\.\d+)?)px/);
  return w && h ? [parseFloat(w[1]), parseFloat(h[1])] : null;
}

// 分類: 'ladder' | 'face' | 'allowed' | 'violation' | 'skip'
function classify(sel, w, h) {
  if (!PORTRAIT_RE.test(sel) || EXCLUDE_RE.test(sel)) return 'skip';
  if (LADDER.some(([lw, lh]) => lw === w && lh === h)) return 'ladder';
  if (w === h && w <= FACE_SQ_MAX) return 'face';
  if (ALLOW.has(`${sel} | ${w}x${h}`)) return 'allowed';
  return 'violation';
}

// 分類ロジック自体の自己検査(ガードが緩んでいないか)
assert.strictEqual(classify('.foo-portrait', 100, 150), 'violation', '梯子外2:3を見逃した');
assert.strictEqual(classify('.foo-face', 80, 80), 'violation', '52px超の正方形faceを見逃した');
assert.strictEqual(classify('.foo-upper', 108, 162), 'ladder');
assert.strictEqual(classify('.foo-face', 40, 40), 'face');
assert.strictEqual(classify('.foo-emblem', 100, 100), 'skip');
assert.strictEqual(classify('.plain-box', 100, 150), 'skip');

// ---------------------------------------------------------------------------
// Part A: 共有部品の梯子値の改変検知
// セレクタ完全一致のルール群に、期待サイズが少なくとも1つ含まれること
// (同名セレクタのメディアクエリ縮小版が併存してよい)
// ---------------------------------------------------------------------------
const parsed = new Map(); // file -> rules
for (const f of SOURCES) parsed.set(f, rulesOf(cssTextOf(f)));

function assertSharedSize(file, sel, w, h) {
  const hits = parsed.get(file).filter((r) => r.sel === sel).map((r) => sizeOf(r.body)).filter(Boolean);
  assert.ok(hits.length > 0, `${file}: 共有部品 "${sel}" の width/height 固定ルールが見つからない`);
  assert.ok(
    hits.some(([hw, hh]) => hw === w && hh === h),
    `${file}: 共有部品 "${sel}" が ${w}x${h} でない(実測: ${hits.map((s) => s.join('x')).join(', ')})`
  );
}

assertSharedSize('src/index.html', '.u3b-upper', 132, 194);
assertSharedSize('src/index.html', '.u3b-upper.is-l', 150, 224);
assertSharedSize('src/index.html', '.u3b-upper.is-xl', 172, 258);
assertSharedSize('src/index.html', '.u3b-upper.is-s', 108, 162);
assertSharedSize('src/index.html', '.u3b-upper.is-chip', 40, 40); // §2-B 丸chip
assertSharedSize('src/index.html', '.ch-por', 172, 258);
assertSharedSize('src/index.html', '.ch-duo .ch-por', 150, 224);
assertSharedSize('src/index.html', '.ch-sub-img', 46, 66);
assertSharedSize('src/index.html', '.emr-upper', 132, 194);
assertSharedSize('src/index.html', '.emr-pair .emr-upper', 108, 162);
assertSharedSize('src/index.html', '.pb-portrait', 108, 162);
assertSharedSize('src/index.html', '.portrait-main', 172, 258);
assertSharedSize('src/index.html', '.aw-team-portrait', 150, 224);
assertSharedSize('src/battle-engine.html', '.cutin-portrait', 108, 162);
assertSharedSize('src/battle-engine.html', '.winner-portrait', 172, 258);
assertSharedSize('src/tag-battle.html', '.cutin-portrait', 108, 162);
assertSharedSize('src/tag-battle.html', '.vic-portrait', 150, 224);

// ---------------------------------------------------------------------------
// Part B: 全走査
// ---------------------------------------------------------------------------
const violations = [];
const seenAllow = new Set();
let nLadder = 0;
let nFace = 0;

for (const f of SOURCES) {
  for (const r of parsed.get(f)) {
    const s = sizeOf(r.body);
    if (!s) continue;
    const verdict = classify(r.sel, s[0], s[1]);
    if (verdict === 'ladder') nLadder++;
    else if (verdict === 'face') nFace++;
    else if (verdict === 'allowed') seenAllow.add(`${r.sel} | ${s[0]}x${s[1]}`);
    else if (verdict === 'violation') violations.push(`${f} | ${r.sel} | ${s[0]}x${s[1]}`);
  }
}

if (violations.length) {
  console.error('\n梯子外の人物サイズを検出。まず mockup-baseline-v0.1 §2 の段');
  console.error('(XL 172x258 / L 150x224 / M 132x194 / S 108x162 / chip 46x66、正方形は52px以下)');
  console.error('に乗せることを検討。意図的な逸脱なら本テストの ALLOW に理由付きで追記:\n');
  for (const v of violations) {
    const [, sel, size] = v.split(' | ');
    console.error(`  '${sel} | ${size}',  // <- ${v.split(' | ')[0]}`);
  }
  console.error('');
}
assert.strictEqual(violations.length, 0, `梯子外の人物サイズ ${violations.length} 件(上の一覧)`);

// 許容リストの陳腐化を知らせる(失敗にはしない)
const stale = [...ALLOW].filter((k) => !seenAllow.has(k));
if (stale.length) {
  console.log(`note: ALLOW中 ${stale.length} 件は現在のCSSに存在しない(掃除できる):`);
  for (const k of stale) console.log(`  ${k}`);
}

console.log(`ui-baseline-guard-test: ok (ladder=${nLadder}, face<=52=${nFace}, allowed=${seenAllow.size}/${ALLOW.size})`);
