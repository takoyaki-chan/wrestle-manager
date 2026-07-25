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
  '.ch-teamline{', '.ch-teamname{', '.ch-role-line{', '.ch-duo{', '.ch-trio{', '.ch-order{', '.ch-mem{',
].forEach(sel => assert.ok(css.includes(sel), `統一デザインの共通CSSが必要: ${sel}`));

assert.ok(css.includes('吹き出し'), 'CSSブロックに縦の並び順を説明する日本語コメントが必要');

// ---- 吹き出しは画像の上(被せない)。予約枠で高さを確保する ----
assert.ok(css.includes('.ch-bubble-slot{min-height:52px'), 'ヒーロー/デュオの吹き出し予約枠は52px確保する');
assert.ok(css.includes('.ch-bubble{position:relative;max-width:420px'), '吹き出しは画像に被せない独立ブロックであること');
assert.ok(!css.includes('.ch-bubble{position:absolute'), '吹き出しをposition:absoluteで浮かせてはいけない(高さがずれる)');

// ---- 複数人が並ぶ大会は狭くても横並びを維持する(nowrap) ----
assert.ok(css.includes('.ch-duo{position:relative;display:flex;justify-content:center;align-items:flex-end;gap:var(--space-lg);\n  padding:20px 16px 14px;flex-wrap:nowrap;overflow-x:auto}'),
  '春タッグの2名は狭幅でも折り返して縦積みにしてはいけない');
assert.ok(css.includes('.ch-trio{position:relative;display:flex;justify-content:center;align-items:flex-end;gap:var(--space-lg);\n  padding:20px 16px 14px;flex-wrap:nowrap;overflow-x:auto}'),
  '秋4団体対抗戦の3名は狭幅でも折り返して縦積みにしてはいけない');

// ---- 秋トリオ: 大将(is-ace)だけ一回り大きい ----
assert.ok(css.includes('.ch-trio .ch-mem.is-ace .ch-por{width:150px;height:224px}'), '大将は他の2名より大きく表示する');
assert.ok(css.includes('.ch-trio .ch-por{width:126px;height:188px}'), '先鋒/中堅は小さめの共通サイズ');

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
assert.strictEqual((stlFn.match(/class="ch-mem"/g) || []).length, 2, '春タッグは2名分の.ch-memを描画する');
assert.ok(stlFn.includes('_chTeamlineHtml(champTeam.orgId, champTeam.orgName)'), '団体優勝は団体名を主役として掲げる');
assert.ok(!stlFn.includes('stl-champ-') && !stlFn.includes('pb-champion-card') && !stlFn.includes('pb-champion-portrait'),
  '旧pb-champion/stl-champ系の優勝カード表示クラスを残していない(自団体賞金パネルのpb-champion-prizeboxは対象外)');

// ---- 秋4団体対抗戦: 3名を横一列。全員に吹き出しの予約枠(1人しか出ない不具合の修正) ----
const agwFn = functionSource(ui, 'renderAutumnWarResult');
assert.ok(agwFn.includes('class="champ th-autumn"'), '秋は朱のテーマ色を使う');
assert.ok(agwFn.includes('class="ch-trio"'), '団体優勝は3名並びの.ch-trioを使う');
assert.ok(agwFn.includes('_chBubbleSlot(line)'), '3名それぞれに吹き出しの予約枠を置く(発言が無くても空枠を出す)');
assert.ok(agwFn.indexOf('_chBubbleSlot(line)') < agwFn.indexOf('class="ch-por"'), '秋トリオも吹き出しは画像より前');
assert.ok(agwFn.includes("isAce ? ' is-ace' : ''"), '大将だけ一回り大きい表示(is-ace)にする');
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

console.log('champion-announcement-unified-design-test: ok');
