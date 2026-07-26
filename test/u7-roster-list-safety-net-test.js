// u7-roster-list-safety-net-test.js
//
// U7「選手カード／一覧」の安全網。物差しは docs/ui/ui/mockup-baseline §2-C。
//
//   (1) 一覧に差し込む正方形の顔は row=40 / row-sm=24 の2段だけ
//       （U7調査では 18/20/22/24/32/34/36/40/52/72/80 の11通りが併存していた）
//   (2) 顔が出ている一覧は、押せば選手詳細が開く
//       （調査では顔があるのに押せない一覧が12箇所あった）
//   (3) 既に詳細が開く一覧を、統一の巻き添えで壊さない ← 一番大事
//
// 1人だけを見せる場面（Glimpse・交渉の話し手・王者バッジ）は §2/§2-B の管轄なので
// この検査の対象外。道場バナーの 34px も §2-B で確定済みの例外。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

const uiRender = read('src/ui-render.js');
const uiCommon = read('src/ui-common.js');
const dataJs = read('src/data.js');
const baseline = read('docs/ui/mockup-baseline-v0.1.md');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== U7 選手カード／一覧 ===\n');

// ─────────────────────────────────────────────────────────────
// 0. 物差しが先にあること
// ─────────────────────────────────────────────────────────────

section('0. ベースラインに §2-C（一覧の顔）が書かれている', () => {
  assert.ok(/## 2-C\./.test(baseline), '§2-C が無い。実装より先に物差しを決めること');
  assert.ok(/`row`[^\n]*40×40/.test(baseline), 'row 40 の定義が無い');
  assert.ok(/`row-sm`[^\n]*24×24/.test(baseline), 'row-sm 24 の定義が無い');
  assert.ok(/顔が出ているなら、押せば選手詳細が開く/.test(baseline), 'クリックの規則が無い');
});

// ─────────────────────────────────────────────────────────────
// 1. サイズの梯子
// ─────────────────────────────────────────────────────────────

// 1人だけを見せる場面。§2-C の管轄外なので梯子から除外する。
// **行番号ではなく呼び出しの字面**で持つ（行番号は編集のたびにずれて、除外が別の行に掛かる）
const SOLO_CALLS = [
  'portraitImg(f.id, 72)',              // 試合前フレーバー（単独）
  'portraitImg(charL.id, imgW)',        // 対置（U3-B が段を決める）
  'portraitImg(charR.id, imgW)',
  'portraitImg(f.id, 96)',              // 単独の話し手
  'portraitImg(fighterId, 64)',         // 単独
  'portraitImg(glimpse.speakerId, 100)', // Glimpse Cascade（U3-D 確定済み）
  'portraitImg(glimpse.targetId, 100)',
  'portraitImg(glimpse.speakerId, 120)',
  "portraitImg(neg.fighterId, 96, 'negc-speaker-portrait')", // 交渉の話し手
  'portraitImg(n.fighterId, 64)',       // 交渉の相手（単独）
  'portraitImg(champ.id, 28)',          // ヘッダーの王者バッジ
  'portraitImg(g.speakerId, 34)',       // 道場バナー 休憩中（§2-B の例外）
  'portraitImg(f.id, size)',            // タッグ枠（呼び出し側で段を渡す）
];
const ALLOWED_SQUARE = new Set([24, 40]);

function collectPortraitCalls() {
  const out = [];
  [['src/ui-render.js', uiRender], ['src/ui-common.js', uiCommon]].forEach(([file, src]) => {
    src.split('\n').forEach((line, i) => {
      // サイズが変数の呼び出しも拾う（除外リストの陳腐化チェックに使う）
      const re = /portraitImg\(\s*[^,)]+,\s*([^,)]+)\s*[,)]/g;
      let m;
      while ((m = re.exec(line))) {
        const raw = m[1].trim();
        const size = /^[0-9]+$/.test(raw) ? parseInt(raw, 10) : null;
        // line は照合用に全文を持つ。表示は show 側で刈る
        out.push({ where: `${file}:${i + 1}`, size, line: line.trim(), show: line.trim().slice(0, 90) });
      }
    });
  });
  return out;
}

const isSolo = c => SOLO_CALLS.some(s => c.line.includes(s));

section('1. 一覧の正方形の顔は 24 か 40 だけ', () => {
  const bad = collectPortraitCalls()
    .filter(c => !isSolo(c))
    .filter(c => c.size !== null && !ALLOWED_SQUARE.has(c.size));
  assert.strictEqual(bad.length, 0,
    '梯子に無いサイズ:\n        ' + bad.map(b => `${b.where} → ${b.size}px  ${b.show}`).join('\n        '));
});

section('2. 除外リストが古びていない（単独表示が消えたり一覧に化けたりしていないか）', () => {
  const all = collectPortraitCalls();
  const stale = SOLO_CALLS.filter(s => !all.some(c => c.line.includes(s)));
  assert.strictEqual(stale.length, 0,
    'この呼び出しがもう存在しない。除外リストを更新すること:\n        ' + stale.join('\n        '));
});

section('3. 梯子の2段が実際に両方使われている', () => {
  const sizes = new Set(collectPortraitCalls().filter(c => !isSolo(c)).map(c => c.size));
  assert.ok(sizes.has(40), 'row 40 がどこにも使われていない');
  assert.ok(sizes.has(24), 'row-sm 24 がどこにも使われていない');
});

// ─────────────────────────────────────────────────────────────
// 2. portraitImg が呼び出し元を受け取れる
// ─────────────────────────────────────────────────────────────

section('4. portraitImg の clickable が呼び出し元(source)を受け取れる', () => {
  const at = dataJs.indexOf('function portraitImg(');
  assert.ok(at > 0, 'portraitImg が見つからない');
  const body = dataJs.slice(at, at + 2200);
  assert.ok(/showFighterPopup\(/.test(body), 'clickable 時に詳細を開いていない');
  assert.ok(!/showFighterPopup\(\$\{id\},'roster'\)[\s\S]*showFighterPopup\(\$\{id\},'roster'\)/.test(body),
    "source が 'roster' 決め打ちのまま。呼び出し元を渡せないと戻り先が壊れる");
  assert.ok(/typeof clickable === 'string'/.test(body),
    'clickable に文字列(source)を渡せる分岐が無い');
});

section('5. clickable のとき stopPropagation を必ず付ける', () => {
  const at = dataJs.indexOf('function portraitImg(');
  const body = dataJs.slice(at, at + 2200);
  const hits = body.match(/onclick="event\.stopPropagation\(\);showFighterPopup/g) || [];
  assert.ok(hits.length >= 2,
    '画像とフォールバックの両方に stopPropagation が要る（行の選択が同時に走る）');
});

// ─────────────────────────────────────────────────────────────
// 3. 顔が出ている一覧は押せる
// ─────────────────────────────────────────────────────────────

/** 関数名から本文を粗く切り出す（次の "\nfunction " まで） */
function fnBody(src, name) {
  const at = src.indexOf(name);
  if (at < 0) return null;
  const next = src.indexOf('\nfunction ', at + name.length);
  return src.slice(at, next > 0 ? next : at + 6000);
}

/** 目印の前後を切り出す。巨大な関数の中の一区画を見るため */
function around(src, anchor, back = 600, fwd = 900) {
  const at = src.indexOf(anchor);
  if (at < 0) return null;
  return src.slice(Math.max(0, at - back), at + fwd);
}

const MUST_OPEN = [
  ['引き抜きオファー一覧', () => around(uiRender, '💰 移籍金:', 1400)],
  ['契約更改 結果サマリー', () => fnBody(uiCommon, 'function showContractResultModal')],
  ['春タッグ リーグ順位表', () => fnBody(uiCommon, 'function _stlFaceImg')],
  ['天頂戦 特別招待カード', () => around(uiCommon, 'tc-invite-up')],
  ['社長室 レンタル中ストリップ', () => fnBody(uiRender, 'function _renderShachoshitsuWallRentals')],
  ['年代記 序章「旗揚げ世代」', () => fnBody(uiRender, 'function _renderPrologueBlock')],
  ['年代記 この時代の同期', () => around(uiRender, 'const memberClass = `chron-gen-member', 200, 1200)],
  ['旗揚げドラフト 設立メンバー', () => around(uiRender, 'draft-fc fixed', 400, 1400)],
  ['ジュニアT ブラケット', () => fnBody(uiCommon, 'function _jtcFx')],
  ['天頂戦 ブラケット', () => fnBody(uiCommon, 'function _tcCircleFx')],
];

/** 詳細を開く手段があるか。直接呼びと、clickable な portraitImg の両方を認める */
function opensDetail(body) {
  if (/showFighterPopup\(/.test(body)) return true;
  // portraitImg(id, size, cls, true) / portraitImg(id, size, cls, 'source')
  return /portraitImg\([^)]*,\s*(true|'[a-zA-Z0-9_]+')\s*\)/.test(body);
}

MUST_OPEN.forEach(([label, get], idx) => {
  section(`${6 + idx}. ${label} が選手詳細を開ける`, () => {
    const body = get();
    assert.ok(body, `${label} の該当箇所が見つからない`);
    assert.ok(opensDetail(body),
      '顔や名前が出ているのに押しても何も起きない。§2-C「顔が出ているなら押せば開く」に反する');
  });
});

// ─────────────────────────────────────────────────────────────
// 4. 既にあるものを壊さない（回帰）
// ─────────────────────────────────────────────────────────────

const KEEP_OPEN = [
  ['データベース 全選手一覧', uiRender, 'function _renderDbFighters'],
  ['団体タブ ロスターカード', uiRender, 'function renderRoster'],
  ['ランキング 全団体布陣', uiRender, 'function renderRanking'],
  ['道場バナー', uiRender, 'function _renderRosterDojoHeader'],
  ['対抗戦 出場3名選択', uiCommon, 'function _awEntryScreenHtml'],
];

KEEP_OPEN.forEach(([label, src, marker], idx) => {
  section(`${6 + MUST_OPEN.length + idx}. ${label} の選手詳細が消えていない`, () => {
    const body = fnBody(src, marker);
    assert.ok(body, `${marker} が見つからない`);
    assert.ok(/showFighterPopup\(/.test(body), '統一の巻き添えで詳細リンクが消えている');
  });
});

section('殿堂は専用ポップアップのまま（例外として明記済み）', () => {
  const body = fnBody(uiRender, 'function _renderDbHallOfFame');
  assert.ok(body, '_renderDbHallOfFame が無い');
  assert.ok(/showHofDetail/.test(body), '殿堂専用ポップアップが消えている');
  assert.ok(/殿堂/.test(baseline), 'ベースラインに殿堂の例外が書かれていない');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS');
