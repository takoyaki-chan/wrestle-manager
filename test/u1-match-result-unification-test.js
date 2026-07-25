'use strict';

// U1 (残り分): .crrm-* (挑戦試合結果) / .c1r-*（派閥内対決結果） / .pb-mrow（8画面共有の試合行）を
// .emr-*（1試合結果ポップアップ）の配置バランスに揃えた回。この回でしか保証されない不変条件を、
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
// 4. .c1r-* (派閥内対決結果): 既存の_emrSingleSide/.emr-bout/.emr-hpヘルパーを流用し、
//    常に自団体内の試合なのでcrossOrg=falseで団体バッジを出さない。
// ---------------------------------------------------------------------------
assert.ok(
  css.includes('.c1r-card{--emr-accent:var(--gold);--emr-accent-rgb:var(--gold-rgb);--emr-metal:var(--gold-light);'),
  '派閥内対決カードは.emr-*ヘルパーが参照する--emr-accent系をローカル定義し、常に金テーマで描画する'
);
assert.ok(!css.includes('.c1r-stage{'), '旧.c1r-stage(独自2カラムレイアウト)は.emr-boutへ置換したため削除する');
assert.ok(!css.includes('.c1r-verdict{'), '旧.c1r-verdict(勝敗タグ)はグレースケール+中央WIN表示と重複するため削除する');
assert.ok(!css.includes('.c1r-bubble-wrap{'), '旧.c1r-bubble-wrap(絶対配置の吹き出し)は.emr-bubble-slotへ置換したため削除する');
assert.ok(!css.includes('.c1r-portrait{'), '旧.c1r-portrait(勝敗で共通サイズだが独自実装)は.emr-upperへ統合したため削除する');

const c1rSrc = functionSource('_renderCommon1MatchResult');
const emrSideCalls = c1rSrc.match(/_emrSingleSide\(/g) || [];
assert.strictEqual(emrSideCalls.length, 2, '_renderCommon1MatchResultは共通ヘルパー_emrSingleSideを両サイドで流用する');
assert.ok(c1rSrc.includes("'OVR', ovrA, bubbleFor(fA), false"), '派閥内対決の左サイドはcrossOrg=falseで団体バッジを出さない');
assert.ok(c1rSrc.includes("'OVR', ovrB, bubbleFor(fB), false"), '派閥内対決の右サイドはcrossOrg=falseで団体バッジを出さない');
assert.ok(c1rSrc.includes('emr-hp'), '派閥内対決のHPバーも共通.emr-hpを流用する');
// レイアウト統一で選手プロフィールへの導線を失わないこと(2026-07-25に一度消えた)
assert.strictEqual(
  (c1rSrc.match(/profileContext:\s*'roster'/g) || []).length, 2,
  '派閥内対決の結果から選手プロフィールへ飛べる導線を両サイドに残す'
);
assert.ok(
  ui.includes("onclick=\"showFighterPopup(${fid},'${ctx}')\""),
  '_emrSingleSideはprofileContextを受けたとき画像と名前をプロフィールへの導線にする'
);

// ---------------------------------------------------------------------------
// 5. ランタイム実測: _renderCommon1MatchResultを実際に実行し、
//    (a) 吹き出し→画像→名前の順でDOMに現れる (b) 団体バッジが出ない (c) 勝者/敗者で画像サイズを分けていない
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
  const fakeBox = { innerHTML: '' };
  const fakeOverlay = { classList: { add() {}, remove() {} } };
  const documentStub = { getElementById: (id) => (id === 'showResultBox' ? fakeBox : id === 'showResultOverlay' ? fakeOverlay : null) };

  const build = new Function(
    'Engine', 'G', 'document', 'escHtml', 'getUpperUrl', 'Math',
    `${functionSource('_emrUpper')}
     ${functionSource('_emrOvr')}
     ${functionSource('_emrOrgBadgeHtml')}
     ${functionSource('_emrOrgInitial')}
     ${functionSource('_emrSingleSide')}
     ${functionSource('_renderCommon1MatchResult')}
     return { _renderCommon1MatchResult };`
  );
  const built = build(EngineStub, Gstub, documentStub, escHtml, getUpperUrl, Math);

  const fA = { id: 11, name: 'A選手', pw: 80, sp: 78, te: 76, st: 82, mn: 74 };
  const fB = { id: 22, name: 'B選手', pw: 70, sp: 68, te: 66, st: 72, mn: 64 };
  const payload = { factionName: 'テスト派閥', leaderId: 11, archetypeId: 'testarch' };
  const matchResult = { winner: 'left', mq: 62, turns: 9, finType: 'ピン', finMove: '必殺技', hpLeft: { final: 40, max: 100 }, hpRight: { final: 5, max: 100 } };
  const applyResult = { resultText: 'AがBを下した。', impactSummary: [] };

  built._renderCommon1MatchResult(payload, matchResult, fA, fB, applyResult, () => {});
  const html = fakeBox.innerHTML;

  assert.ok(html.includes('emr-bubble-slot') && html.includes('emr-upper') && html.includes('emr-name'),
    '派閥内対決の1サイド分に吹き出し予約枠・画像・名前が揃っている');
  const bubbleIdx = html.indexOf('emr-bubble-slot');
  const upperIdx = html.indexOf('emr-upper');
  const nameIdx = html.indexOf('emr-name');
  assert.ok(bubbleIdx < upperIdx && upperIdx < nameIdx, '吹き出し→画像→名前の縦順序を守る(mockup-baseline §4)');
  assert.ok(!html.includes('emr-org-badge'), '自団体内の試合(派閥内対決)では団体バッジを出さない');

  const upperBlocks = html.match(/<div class="emr-upper"[^>]*>[\s\S]*?<\/div>/g) || [];
  assert.strictEqual(upperBlocks.length, 2, '両サイド分の画像ブロックが生成されている');
  // 選手IDと画像URLだけを伏せて比較する。両サイドの構造が同じであることを確かめるため
  const normalize = (s) => s.replace(/src="[^"]*"/, 'src=""').replace(/showFighterPopup\(\d+,/, 'showFighterPopup(0,');
  assert.strictEqual(normalize(upperBlocks[0]), normalize(upperBlocks[1]),
    '勝者・敗者で画像の見た目(サイズ等)を分けない。差は.emr-side.is-loserのCSS(グレースケール等)だけで付ける');
  assert.strictEqual((html.match(/showFighterPopup\(/g) || []).length, 4,
    '両サイドの画像と名前がプロフィールへの導線になっている(画像2+名前2)');

  console.log('u1-match-result-unification-test: c1r runtime check ok');
})();

console.log('u1-match-result-unification-test: ok');
