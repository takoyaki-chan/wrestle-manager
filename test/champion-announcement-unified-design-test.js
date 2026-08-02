'use strict';

// U2: 大会の優勝発表 統一デザイン (.champ / .ch-*) の回帰テスト。
// JT・春タッグリーグ・秋4団体対抗戦・天頂戦の優勝発表が同じ型(ヘッダー→吹き出し→画像→
// 名前→役割→団体→数値→フッター)に統一されていること、タッグ/団体戦で複数人が横一列に
// 並ぶこと(flex-wrap:nowrap)、天頂戦がPPVと同じ深紅であることを検証する。
// 手本: test/event-match-result-popup-test.js

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const css = readSource('src', 'index.html');
const mobile = readSource('src', 'mobile.css');

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} end not found`);
}

// ---- 共通CSSが1つに揃っていること ----
[
  '.champ{', '.ch-head{', '.ch-emb{', '.ch-kicker{', '.ch-title{', '.ch-meta{',
  '.ch-hero{', '.ch-bubble-slot{', '.ch-bubble{', '.ch-bubble::after{',
  '.ch-por-wrap{', '.ch-glow{', '.ch-por{', '.ch-crown{', '.ch-name{', '.ch-role{',
  '.ch-org{', '.ch-stat{', '.ch-sub{', '.ch-sub-card{', '.ch-foot{', '.ch-prize{', '.ch-next{',
  '.ch-teamline{', '.ch-teamname{', '.ch-role-line{', '.ch-duo,.ch-trio{', '.ch-order{', '.ch-mem{',
  '.ch-lineup-bubs,.ch-lineup-imgs,.ch-lineup-names{', '.ch-lineup-imgs{', '.ch-trio-speech{',
].forEach(sel => assert.ok(css.includes(sel), `統一デザインの共通CSSが必要: ${sel}`));

assert.ok(css.includes('吹き出し'), 'CSSブロックに縦の並び順を説明する日本語コメントが必要');

// ---- 吹き出しは画像の上(被せない)。予約枠で高さを確保する ----
assert.ok(css.includes('.ch-bubble-slot{min-height:52px'), 'ヒーロー/デュオの吹き出し予約枠は52px確保する');
assert.ok(css.includes('.ch-bubble{position:relative;max-width:420px'), '吹き出しは画像に被せない独立ブロックであること');
assert.ok(!css.includes('.ch-bubble{position:absolute'), '吹き出しをposition:absoluteで浮かせてはいけない(高さがずれる)');

// ---- 隊列(案C): 個々の画像に額縁を付けず、群の外側を1つの枠(.ch-lineup-imgs)で囲む ----
assert.ok(css.includes('.ch-duo,.ch-trio{position:relative;display:flex;flex-direction:column;align-items:center;padding:20px 16px 14px}'),
  '隊列は縦3段(吹き出し/画像/名前)を1本の群として積む');
assert.ok(/\.ch-lineup-imgs\{border:1px solid rgba\(var\(--gold-rgb\),\.55\);border-bottom:3px solid var\(--gold\)/.test(css),
  '画像の行だけを金の枠(群の外側1つだけ)で囲む');
assert.ok(css.includes('background:radial-gradient(ellipse 80% 60% at 50% 100%,rgba(var(--ev-rgb),.13),transparent 70%)'),
  '群の背景は大会テーマ色(--ev-rgb)を使う(大会ごとに色が変わる)');
assert.ok(css.includes('linear-gradient(180deg,var(--stage-card-top),var(--stage-card-bottom))'),
  '群の背景はハードコード色ではなくstage-cardトークンを使う');

// ---- 個々の画像には背景・枠・box-shadowを付けない。落ち影はdrop-shadow(box-shadowは矩形に付くため誤り) ----
assert.ok(css.includes('.ch-duo .ch-por,.ch-trio .ch-por{background:transparent;border:0;border-radius:0;box-shadow:none;\n  filter:drop-shadow(0 8px 16px rgba(0,0,0,.55))}'),
  '隊列の画像は個々の背景・枠・box-shadowを持たず、drop-shadowだけを使う');

// ---- 重なり: 隣どうしを-18px重ねる。画像・吹き出し・名前の3列すべてに掛かる(1つの.ch-memクラスが3行で再利用されるため自動的に揃う) ----
assert.ok(css.includes('.ch-mem+.ch-mem{margin-left:-18px}'), '隊列は隣どうしを18px重ねる');

// ---- 秋トリオ: 役割やMVPにかかわらず3名を同じ大きさに揃える ----
assert.ok(css.includes('.ch-trio .ch-mem{width:150px}'), '秋の3名は同じ列幅を使う');
assert.ok(css.includes('.ch-trio .ch-por{width:150px;height:224px}'), '秋の3名は同じL画像サイズを使う');
assert.ok(!css.includes('.ch-trio .ch-mem.is-ace'), '大将だけを拡大してMVPを小さく見せてはいけない');

// ---- タッグ2名は両方L(同格) ----
assert.ok(css.includes('.ch-duo .ch-mem{width:150px}'), 'タッグの2人は両方Lサイズ(同格)');
assert.ok(css.includes('.ch-duo .ch-por{width:150px;height:224px}'), 'タッグの画像サイズはL');

// ---- 梯子は5段(XL/L/M/S/chip)。M→S 4.5%・S→XS 4.8%の差が読めない2段は統合済み ----
assert.ok(css.includes('.agw-mvp-portrait{width:108px;height:162px'), 'MVP(おまけ)は5段目のS(108×162)');

// ---- テーマ色: 天頂戦はPPVと同じ深紅を共有する ----
assert.ok(css.includes('.champ.th-tenchosen{--ev-rgb:214,61,70}'), '天頂戦はPPVと同じ深紅(214,61,70)を使う');
assert.ok(css.includes('.emr-layer.is-tenchosen,.emr-layer.is-ppv{--emr-accent:#d63d46;--emr-accent-rgb:214,61,70'),
  '既存の試合結果ポップアップ(U1)と同じ色言語であることが前提');
assert.ok(css.includes('.champ.th-normal{--ev-rgb:var(--gold-rgb)}'), '通常興行の王座戴冠は自団体の金(--gold-rgb)を使う');
assert.ok(css.includes('.champ.th-spring{--ev-rgb:224,122,154}'), '春は桜色');
assert.ok(css.includes('.champ.th-summer{--ev-rgb:var(--ev-summer-rgb)}'), '夏は水色');
assert.ok(css.includes('.champ.th-autumn{--ev-rgb:193,80,60}'), '秋は朱色');

// ---- 団体エンブレムは実画像。頭文字色丸は最終フォールバックのみ ----
assert.ok(ui.includes('function _chOrgEmblemInner(orgId, orgName)'), '団体エンブレム解決ヘルパーが必要');
const orgEmblemFn = functionSource(ui, '_chOrgEmblemInner');
assert.ok(orgEmblemFn.includes('Engine.util.getPlayerOrgIconPath'), '自団体は実エンブレム画像を使う');
assert.ok(orgEmblemFn.includes('Engine.util.getOrgIconPath'), '他団体も実エンブレム画像を使う');
assert.ok(orgEmblemFn.includes('_emrOrgInitial'), 'orgIdが取れないときだけ頭文字へフォールバックする');

// _emrOrgBadgeHtml(U1)も同じ理由でorgIdを受け取り実画像を使うよう修正済みであること
const emrBadgeFn = functionSource(ui, '_emrOrgBadgeHtml');
assert.ok(/function _emrOrgBadgeHtml\(orgId, orgName, side\)/.test(emrBadgeFn), '_emrOrgBadgeHtmlはorgIdを引き回す');
assert.ok(emrBadgeFn.includes('Engine.util.getOrgIconPath') || emrBadgeFn.includes('Engine.util.getPlayerOrgIconPath'),
  '_emrOrgBadgeHtmlも実エンブレム画像を優先する');

// ---- JT: 吹き出し→画像→名前→役割→団体→数値、の順で1名を主役に ----
const jtFn = functionSource(ui, 'renderJuniorTournamentResult');
assert.ok(jtFn.includes('class="champ th-summer"'), 'JTは夏のテーマ色を使う');
assert.ok(jtFn.indexOf('_chBubbleSlot(champLine)') < jtFn.indexOf('class="ch-por"'), '吹き出しは画像より前(上)に描画する');
assert.ok(jtFn.indexOf('class="ch-por"') < jtFn.indexOf('class="ch-name"'), '画像は名前より前');
assert.ok(jtFn.indexOf('class="ch-name"') < jtFn.indexOf('class="ch-role">優勝'), '名前は役割ラベルより前');
assert.ok(jtFn.indexOf('class="ch-role">優勝') < jtFn.indexOf('_chOrgBadgeHtml('), '役割ラベルは団体バッジより前');
assert.ok(jtFn.indexOf('_chOrgBadgeHtml(') < jtFn.indexOf('class="ch-stat"'), '団体バッジは数値より前');
assert.ok(jtFn.includes('_chOrgBadgeHtml(champion._orgId, champion._orgName)'), 'JTは他団体が絡むため団体バッジを必ず出す');

// ---- 春タッグ: 2名を必ず横一列。両方に吹き出し ----
const stlFn = functionSource(ui, 'renderSpringTagLeagueChampion');
assert.ok(stlFn.includes('class="champ th-spring"'), '春は桜のテーマ色を使う');
assert.ok(stlFn.includes('class="ch-duo"'), 'タッグ優勝は2名並びの.ch-duoを使う');
assert.strictEqual((stlFn.match(/_chBubbleSlot\(/g) || []).length, 2, '春タッグは2名とも吹き出しの予約枠を持つ');
// 隊列(案C)は吹き出し/画像/名前の3行に分かれ、各行に2名分の.ch-memが並ぶ(2名 x 3行 = 6)
assert.strictEqual((stlFn.match(/class="ch-mem"/g) || []).length, 6, '春タッグは2名分の.ch-memを3行(吹き出し/画像/名前)に描画する');
assert.ok(stlFn.includes('class="ch-lineup-bubs"') && stlFn.includes('class="ch-lineup-imgs"') && stlFn.includes('class="ch-lineup-names"'),
  '春タッグも隊列の3行構造(吹き出し/画像/名前)を使う');
assert.ok(stlFn.includes('_chTeamlineHtml(champTeam.orgId, champTeam.orgName)'), '団体優勝は団体名を主役として掲げる');
assert.ok(!stlFn.includes('stl-champ-') && !stlFn.includes('pb-champion-card') && !stlFn.includes('pb-champion-portrait'),
  '旧pb-champion/stl-champ系の優勝カード表示クラスを残していない(自団体賞金パネルのpb-champion-prizeboxは対象外)');

// ---- 秋4団体対抗戦: 3名を横一列。最多勝コメントは隊列全体に対する独立した1枠 ----
const agwFn = functionSource(ui, 'renderAutumnWarResult');
assert.ok(agwFn.includes('class="champ th-autumn"'), '秋は朱のテーマ色を使う');
assert.ok(agwFn.includes('class="ch-trio"'), '団体優勝は3名並びの.ch-trioを使う');
assert.strictEqual((agwFn.match(/_chBubbleSlot\(/g) || []).length, 1, '秋の優勝コメントは3列ではなく1枠だけ描画する');
assert.ok(agwFn.includes('class="ch-trio-speech"'), '最多勝コメントを隊列中央の独立ブロックに置く');
assert.ok(agwFn.includes('最多勝コメント'), '独立した吹き出しの話者理由を明示する');
assert.ok(!agwFn.includes('class="ch-lineup-bubs"'), '見えない空欄を含む3人分の吹き出し行を残さない');
// _chBubbleSlot は他の統一優勝画面でも使うため、空枠の基本動作は維持する。
const bubbleSlot = new Function(
  'escHtml',
  `${functionSource(ui, '_chBubbleSlot')}; return _chBubbleSlot;`
)(s => String(s));
assert.ok(bubbleSlot('').includes('class="ch-bubble-slot"'),
  '発言が無くても予約枠(.ch-bubble-slot)は出す。出さないと3名の高さが揃わない');
assert.ok(!bubbleSlot('').includes('class="ch-bubble"'),
  '発言が無いときに空の吹き出し本体は描かない');
assert.ok(bubbleSlot('やった', 'is-autumn-speech').includes('ch-bubble is-autumn-speech'),
  '修飾クラスを渡せば吹き出し本体に付く');
assert.ok(agwFn.indexOf('_chBubbleSlot(speech.line') < agwFn.indexOf('class="ch-por"'), '秋トリオも吹き出しは画像より前');
assert.ok(!agwFn.includes('isAce'), '大将だけを拡大せず、MVPを含む3名を同寸にする');
assert.ok(agwFn.includes("isMvp ? ' is-mvp' : ''"), 'MVPは大きさではなくラベル色で識別する');
assert.ok(agwFn.includes('_chTeamlineHtml(champ?.orgId, champ?.orgName)'), '団体優勝は団体名を主役として掲げる');
assert.ok(!agwFn.includes('agw-champion-speech') && !agwFn.includes('agw-champ-card') && !agwFn.includes('agw-champ-lineup'),
  '旧agw-champion系クラスを残していない');

// ---- 天頂戦: PPVと同じ深紅。顔出し+吹き出しを新規に持つ(旧実装は無言だった) ----
const tcFn = functionSource(ui, 'renderTenchosenResult');
assert.ok(tcFn.includes('class="champ th-tenchosen"'), '天頂戦はPPVと同じ深紅テーマを使う');
assert.ok(tcFn.includes('_chBubbleSlot(champLine)'), '天頂戦の優勝者にも吹き出しを追加する(旧tcwn-*には無かった)');
assert.ok(tcFn.indexOf('_chBubbleSlot(champLine)') < tcFn.indexOf('class="ch-por"'), '天頂戦も吹き出しは画像より前');
assert.ok(tcFn.includes("getJuniorTournamentLine('champion'"), '既存の優勝セリフ機構(JT championタイミング)を流用する');
assert.ok(!tcFn.includes('tcwn-name') && !tcFn.includes('tcwn-up') && !tcFn.includes('tcwn-org'),
  '旧tcwn-*(顔なし優勝演出)のクラスを残していない');
assert.ok(tcFn.includes('class="tcwn-wrap"') && tcFn.includes('class="tcwn-rays"'),
  '全画面の回転レイズ演出(U2のスコープ外)は温存する');

// ---- 削除した旧CSSクラスが本当に参照ゼロであることの回帰ガード ----
[
  'pb-champion-card', 'pb-champion-bubble', 'pb-champion-portrait', 'pb-champion-trophy',
  'pb-champion-label', 'pb-champion-name', 'pb-champion-org', 'pb-champion-sub',
  'stl-champ-duo', 'stl-champ-slot', 'stl-champ-team-name', 'stl-champ-title',
  'agw-champion-speech', 'agw-champ-lineup', 'agw-champ-member', 'agw-champ-card',
  'agw-result-org', 'agw-result-title',
  'tcwn-emblem', 'tcwn-tour', 'tcwn-kanmuri', 'tcwn-evname', 'tcwn-up', 'tcwn-champ-lb',
  'tcwn-name', 'tcwn-org', 'tcwn-title-line', 'tcwn-prize',
].forEach(cls => {
  assert.ok(!ui.includes(cls), `旧クラス ${cls} はui-common.jsから消えているはず`);
  assert.ok(!css.includes(`.${cls}`), `旧クラス .${cls} はindex.htmlのCSSから消えているはず`);
});
// pb-champion-prizeboxは自団体の獲得賞金内訳として現役のため対象外(意図的に残す)
assert.ok(css.includes('.pb-champion-prizebox{'), '自団体の獲得賞金パネルは現役なので残す');

// mobile.cssも旧クラスに依存していない
['agw-champ-lineup', 'agw-champion-speech', 'agw-champ-card'].forEach(cls => {
  assert.ok(!mobile.includes(cls), `mobile.cssに旧クラス ${cls} が残っている`);
});
assert.ok(mobile.includes('.ch-duo') && mobile.includes('.ch-trio'), '狭幅でも.ch-duo/.ch-trioの横並びを保つモバイル調整が必要');

// ══════════════════════════════════════════════════════════
//  U3: 隊列(案C) + サイズ梯子5段 の追加検証
//  spec: docs/ui/mockup-baseline-v0.1.md v0.3 §2, §2-B
// ══════════════════════════════════════════════════════════

// ---- 隊列の画像に「個々の」枠・背景が無いこと。枠は群の外側(.ch-lineup-imgs)に1つだけ ----
assert.ok(css.includes('.ch-duo .ch-por,.ch-trio .ch-por{background:transparent;border:0;border-radius:0;box-shadow:none;'),
  '隊列の画像1枚ごとには背景・枠・box-shadowを付けない');
assert.ok(css.includes('.ch-lineup-imgs{border:1px solid rgba(var(--gold-rgb),.55);border-bottom:3px solid var(--gold);border-radius:var(--radius-md);'),
  '枠は群の外側(画像の行=.ch-lineup-imgs)に1つだけ持たせる');
// .ch-por自体(ヒーロー用の基準ルール)は個別の額縁を持ったままでよい(単独主役.ch-heroでは温存)。
// 隊列側は.ch-duo/.ch-trioの子孫セレクタで上書きしているので、上のassertで検証済み。

// ---- 重なり(-18px)が画像・名前の列に掛かっていること ----
// .ch-mem+.ch-mem{margin-left:-18px} は.ch-duo/.ch-trio共通の1ルールで、
// 春タッグは吹き出し/画像/名前の3行、秋は独立コメント+画像/名前の2行で、
// 画像と名前には同じ.ch-memクラスを再利用する。
assert.ok(css.includes('.ch-mem+.ch-mem{margin-left:-18px}'), '隣どうしの重なりは18pxで、値は1箇所に集約されている');
assert.ok(stlFn.includes('class="ch-lineup-bubs"'), '春タッグ: 2人とも喋るため吹き出しの列を維持する');
[stlFn, agwFn].forEach((fn, i) => {
  const label = i === 0 ? '春タッグ' : '秋4団体対抗戦';
  assert.ok(fn.includes('class="ch-lineup-imgs"'), `${label}: 画像の列が存在する`);
  assert.ok(fn.includes('class="ch-lineup-names"'), `${label}: 名前の列が存在する`);
});
assert.ok(!agwFn.includes('class="ch-lineup-bubs"'), '秋4団体対抗戦: 1つだけのコメントに3列の空枠を使わない');

// ---- 落ち影はfilter:drop-shadow()を使う。box-shadowは矩形に付くため誤り ----
const chLineupPorRule = css.match(/\.ch-duo \.ch-por,\.ch-trio \.ch-por\{[^}]*\}/);
assert.ok(chLineupPorRule, '隊列の画像スタイルが見つかること');
assert.ok(chLineupPorRule[0].includes('filter:drop-shadow('), '隊列の落ち影はfilter:drop-shadow()を使う');
assert.ok(chLineupPorRule[0].includes('box-shadow:none'), '隊列の画像はbox-shadowを明示的に無効化する(矩形の影になるため誤り)');
assert.ok(!/box-shadow:(?!none)/.test(chLineupPorRule[0]), '隊列の画像にnone以外のbox-shadow値を持たせない');

// ---- 秋の優勝隊列は3名とも同寸。専用MVP発表画面のサイズ規則は別に維持する ----
assert.ok(css.includes('.ch-trio .ch-por{width:150px;height:224px}'), '隊列(秋)は3名ともL(150×224)で揃える');
assert.ok(!css.includes('126px;height:188px'), '廃止した段(126×188)がCSSに残っていない');
const mvpPortraitRule = css.match(/\.agw-mvp-portrait\{[^}]*\}/);
assert.ok(mvpPortraitRule, '.agw-mvp-portraitのルールが見つかること');
assert.ok(mvpPortraitRule[0].includes('width:108px;height:162px'), 'MVPはS(108×162)。旧(120×180)は廃止');
// 梯子の他の段は変更しない(単独主役XL/2人主役L/emr-upperのM)
assert.ok(css.includes('.ch-por{position:relative;width:172px;height:258px'), '単独主役(XL)は変更しない');
assert.ok(css.includes('.emr-upper{width:132px;height:194px'), '2人を対置する画面(emr-upper)のMは既存のまま');

console.log('champion-announcement-unified-design-test: ok');
