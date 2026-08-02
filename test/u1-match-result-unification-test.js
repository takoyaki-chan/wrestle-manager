'use strict';

// U1 (残り分): .crrm-* (挑戦試合結果) / Common-1（派閥内対決結果） / .pb-mrow（8画面共有の試合行）を
// 既存の結果表示部品へ揃えた回。この回でしか保証されない不変条件を、
// 可能な限り実関数を実行して検証する（test/README.md の方針: 文字列一致より実行結果を優先）。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { readSource } = require('./helpers/source');
const { loadGame } = require('./helpers/load-game');

loadGame();

const css = readSource('src', 'index.html');
const ui = readSource('src', 'ui-common.js');

function functionSource(name) {
  const start = ui.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}') { depth--; if (depth === 0) return ui.slice(start, i + 1); }
  }
  throw new Error(`${name} end not found`);
}

// ---------------------------------------------------------------------------
// 1. 通常興行=自団体の金（案A）。.emr-layer と .pb-event-summary の両方の「全試合結果」系統で確認する。
// ---------------------------------------------------------------------------
assert.ok(
  css.includes('.emr-layer.is-normal{--emr-accent:var(--gold);--emr-accent-rgb:var(--gold-rgb);--emr-metal:var(--gold-light)}'),
  '1試合結果ポップアップの通常興行テーマは自団体の金にする'
);
assert.ok(
  !css.includes(".emr-layer.is-normal .emr-hp-fill{background:linear-gradient(90deg,#bd8b18"),
  '通常興行専用のHPバー個別上書き(旧ちぐはぐ実装)は削除し、共通--emr-accent経由の金に一本化する'
);
assert.ok(
  css.includes('.pb-event-summary.pb-theme-normal{--pb-event-accent:#d4a843;--pb-event-accent-rgb:212,168,67;--pb-event-metal:#f0d078}'),
  '興行結果サマリ(pb-event-summary)の通常興行テーマも同じ金にする(--goldはこのブロック内で再定義されるため循環参照を避けリテラル値を使う)'
);

// ---------------------------------------------------------------------------
// 2. .pb-mrow (8画面共有の試合行): 敗者グレースケールをmockup-baselineの規定値に統一し、
//    吹き出しの中身を本文のみにする（話者名は削除・行数制限を追加）。
// ---------------------------------------------------------------------------
assert.ok(
  css.includes('.pb-fighter.is-loser .pb-portrait img{filter:grayscale(.9) brightness(.72)}'),
  '敗者のグレースケールはbaseline規定値(grayscale(.9) brightness(.72))に統一する'
);
assert.ok(
  !css.includes('.pb-mrow.is-jt .pb-fighter.is-loser .pb-portrait{opacity:1}'),
  'JT専用の敗者フィルタ上書きは共通ルールに一本化したため撤去する'
);
assert.ok(!css.includes('.pb-dialogue-speaker'), '吹き出し内の話者名スタイルは撤去する(名前は画像下で表示)');
assert.ok(
  css.includes('.pb-dialogue-line{display:-webkit-box;-webkit-line-clamp:2'),
  '吹き出し本文は2行で打ち切る(mockup-baseline §3)'
);

const pbFighterBlockSrc = functionSource('_pbFighterBlock');
assert.ok(!pbFighterBlockSrc.includes('pb-dialogue-speaker'), '_pbFighterBlockは話者名をもう吹き出しに書き込まない');
assert.ok(pbFighterBlockSrc.includes('pb-dialogue-line'), '_pbFighterBlockの吹き出し本文はpb-dialogue-lineでラップする');

// ---------------------------------------------------------------------------
// 3. .crrm-* (挑戦試合結果の代表リアクション): 吹き出しは予約枠・画像は勝敗でサイズを変えない(段M)。
//    このCSSはindex.htmlではなくui-common.js内のインラインstyleに埋め込まれている点に注意。
// ---------------------------------------------------------------------------
assert.ok(
  ui.includes('.crrm-reaction-bubble-slot { height:52px; display:flex; align-items:flex-end; justify-content:center;'),
  '代表リアクションの吹き出しは画像の上の予約枠(固定高さ52px)に入れる'
);
assert.ok(
  !/\.crrm-reaction-bubble-slot\s*\{[^}]*position:\s*absolute/.test(ui),
  '吹き出し予約枠はposition:absoluteで浮かせない'
);
assert.ok(
  ui.includes('.crrm-reaction-portrait { display:grid; place-items:center; width:132px; height:194px;'),
  '代表リアクションの既定サイズは梯子の段M(132x194)'
);
// この画面は勝者/敗者を1人ずつ別々に見せるため、左右対称性の制約が無い。
// 「勝ったんだから真ん中でもっと大きく」の指示どおり勝者だけ一段上げる(M -> XL)。
assert.ok(
  ui.includes('.crrm-reaction-scene.is-victorious .crrm-reaction-portrait { width:172px; height:258px; }'),
  '1人ずつ見せる画面では勝者を一段上げる(XL 172x258)'
);
// 一方、2人を並置する画面(.emr-*)では左右の対称性が崩れるためサイズ差を付けない。
const emrUpper = (css.match(/\.emr-upper\{[^}]*\}/) || [''])[0];
assert.ok(
  /width:132px;height:194px/.test(emrUpper),
  '並置画面の画像は段M(132x194)'
);
assert.ok(
  !/\.emr-side\.is-(winner|loser)[^{]*\{[^}]*width:\s*\d/.test(css),
  '並置画面では勝敗で画像サイズを変えない(格差は灰色化と下辺の色で表す)'
);
assert.ok(!ui.includes('crrm-reaction-speaker'), '吹き出し内の話者名(旧crrm-reaction-speaker)は撤去する');
assert.ok(!ui.includes('crrm-reaction-figure'), '旧ラッパー(crrm-reaction-figure)は撤去し画像を直接センタリングする');

// ---------------------------------------------------------------------------
// 4. Common-1 (派閥内対決結果): 重要な一戦として、戴冠・節目防衛と同じ既存A型イベントモーダルを使う。
//    独自のc1rカードやshowResultOverlayへは戻さない。
// ---------------------------------------------------------------------------
assert.ok(!css.includes('.c1r-card{'), '旧Common-1専用結果カードCSSは廃止し、既存A型へ一本化する');

const c1rSrc = functionSource('_renderCommon1MatchResult');
assert.ok(c1rSrc.includes("_mdlAHeader('⚔ 派閥内対決・決着'"), '既存A型ヘッダーを使う');
assert.ok(c1rSrc.includes('mdl-a-title-result'), '戴冠・節目防衛と同じA型結果本体を使う');
assert.ok(c1rSrc.includes('mdl-a-title-pair'), '既存A型の2名並置を使う');
assert.ok(c1rSrc.includes('mdl-a-title-bubble'), 'セリフは既存A型の頭上吹き出しへ置く');
assert.ok(c1rSrc.includes('mdl-a-result-summary'), '実況・ナレーションではない数値影響は既存結果欄へ分離する');
assert.ok(c1rSrc.includes('_mdlAOpen(html, { wide: true, topAligned: true })'), 'A型共通オーバーレイを開く');
assert.ok(!c1rSrc.includes('showResultOverlay'), 'Common-1専用のshowResultOverlay描画へ戻さない');
assert.ok(!c1rSrc.includes('_emrSingleSide('), '単発試合カードではなく重要イベント用A型を使う');

// ---------------------------------------------------------------------------
// 5. ランタイム実測: _renderCommon1MatchResultを実際に実行し、
//    (a) A型モーダルを開く (b) 吹き出し→画像→名前の順でDOMに現れる
//    (c) 地の文と数値影響が吹き出しから分離される
//    ことを生成HTMLで確認する。
// ---------------------------------------------------------------------------
(function runC1rRuntimeCheck() {
  function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
  function getUpperUrl(id) { return id != null ? `image/upper/${id}.webp` : ''; }
  const EngineStub = {
    util: { ov: (f) => (f.pw + f.sp + f.te + f.st + f.mn) / 5 },
    formatFinish: (finType, finMove) => `${finMove || ''} → ${finType || ''}`,
    factions: { getCommon1Line: (kind) => (kind === 'resultLeader' ? '勝った。' : 'まだだ…') },
  };
  const Gstub = { season: 3, week: 12 };
  let openHtml = '';
  let openOpts = null;
  const fakeButton = { addEventListener() {} };
  const documentStub = { getElementById: (id) => (id === 'c1rCloseBtn' ? fakeButton : null) };

  const build = new Function(
    'Engine', 'G', 'document', 'escHtml', 'getUpperUrl', 'Math',
    `let _capturedHtml = '', _capturedOpts = null;
     function showFighterPopup() {}
     function _mdlAOpen(html, opts) { _capturedHtml = html; _capturedOpts = opts; return true; }
     function _mdlAClose() {}
     function _mdlAHeader(title, meta) { return '<div class="mdl-a-header"><div class="mdl-a-header-title">' + title + '</div><div class="mdl-a-header-meta">' + meta + '</div></div>'; }
     function _mdlASeasonLabel(state) { return 'WEEK ' + state.week + ' ・ ' + state.season + 'Y'; }
     ${functionSource('_renderCommon1MatchResult')}
     return { _renderCommon1MatchResult, getHtml: () => _capturedHtml, getOpts: () => _capturedOpts };`
  );
  const built = build(EngineStub, Gstub, documentStub, escHtml, getUpperUrl, Math);

  const fA = { id: 11, name: 'A選手', pw: 80, sp: 78, te: 76, st: 82, mn: 74 };
  const fB = { id: 22, name: 'B選手', pw: 70, sp: 68, te: 66, st: 72, mn: 64 };
  const payload = { factionName: 'テスト派閥', leaderId: 11, archetypeId: 'testarch' };
  const matchResult = { winner: 'left', mq: 62, turns: 9, finType: 'ピン', finMove: '必殺技', hpLeft: { final: 40, max: 100 }, hpRight: { final: 5, max: 100 } };
  const applyResult = {
    resultText: 'AがBを下し、派閥の序列が動いた。', isUpset: true,
    impactSummary: [{ label: 'A選手 人気', delta: '+2' }, { label: 'B選手 trust', delta: '-3' }],
  };

  built._renderCommon1MatchResult(payload, matchResult, fA, fB, applyResult, () => {});
  const html = built.getHtml();

  assert.deepStrictEqual(built.getOpts(), { wide: true, topAligned: true }, '既存A型を重要イベント用の幅・上寄せで開く');
  assert.ok(html.includes('mdl-a-header') && html.includes('mdl-a-title-result') && html.includes('mdl-a-title-pair'),
    'A型イベントモーダルの既存骨格が生成されている');
  const bubbleIdx = html.indexOf('mdl-a-title-bubble');
  const upperIdx = html.indexOf('mdl-a-title-portrait');
  const nameIdx = html.indexOf('mdl-a-title-name');
  assert.ok(bubbleIdx < upperIdx && upperIdx < nameIdx, '吹き出し→画像→名前の縦順序を守る(mockup-baseline §4)');
  assert.strictEqual((html.match(/mdl-a-title-person/g) || []).length, 2, '勝者と敗者をA型の同じ人物部品で2名並べる');
  assert.strictEqual((html.match(/showFighterPopup\(/g) || []).length, 4,
    '両サイドの画像と名前がプロフィールへの導線になっている(画像2+名前2)');
  assert.ok(html.includes('AがBを下し、派閥の序列が動いた。'), 'ナレーションは地の文欄に残る');
  assert.ok(html.includes('mdl-a-result-summary') && html.includes('A選手 人気') && html.includes('B選手 社長への反応'),
    '数値影響は吹き出しではなくA型結果欄に残る');
  assert.ok(!html.includes('showResultOverlay') && !html.includes('emr-bout'), '旧結果カードのDOMを生成しない');

  console.log('u1-match-result-unification-test: c1r runtime check ok');
})();

console.log('u1-match-result-unification-test: ok');
