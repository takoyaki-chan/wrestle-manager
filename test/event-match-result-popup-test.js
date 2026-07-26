'use strict';

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const app = readSource('src', 'app.js');
const css = readSource('src', 'index.html');

assert(css.includes('.emr-layer'), '共通の1試合結果レイヤーが必要');
assert(css.includes('backdrop-filter:grayscale(.72) saturate(.28) brightness(.68) blur(2px)'), '背面を減彩するフィルターが必要');
assert(css.includes('.emr-popup') && css.includes('border-radius:14px'), '結果ポップアップの外枠は14px角丸にする');
assert(css.includes('.emr-bubble') && css.includes('.emr-bubble::after'), '勝者セリフの吹き出しと尻尾が必要');
assert(css.includes('.emr-layer.is-tenchosen,.emr-layer.is-ppv{--emr-accent:#d63d46'), '天頂戦とPPVは深紅のカラー言語を共有する');
assert(css.includes('--emr-accent:var(--ev-winter)'), '通常興行は旧冬色の白金を標準色にする');
assert(css.includes('grid-template-columns:minmax(0,1fr) 150px minmax(0,1fr)') && css.includes('padding:16px 26px 16px'), '選手画像はモックアップどおり中央寄りに配置する(縦積み・画像を内側へ)');
assert(css.includes('.emr-foot{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,300px) minmax(0,1fr)') && css.includes('.emr-next{grid-column:2;grid-row:1;width:100%') && css.includes('padding:12px 18px'), '進行ボタンは試合前ボタン相当の大きさで下中央へ配置する');
assert(css.includes('.emr-layer.is-normal{--emr-accent:var(--gold);--emr-accent-rgb:var(--gold-rgb);--emr-metal:var(--gold-light)}'), '通常興行は自団体の金(--gold系統)を標準色にし、冬色との混同(ちぐはぐ)を解消する');

assert(ui.includes('function showEventMatchResultPopup(opts)'), '共通ポップアップレンダラーが必要');
assert(ui.includes('function closeEventMatchResultPopup()'), '背面画面を維持したまま閉じる処理が必要');
assert(ui.includes('function _emrVictoryLine(fighter, preferred)'), '全大会で勝者セリフを解決する処理が必要');
assert(ui.includes("winnerSide === 'draw' ? 'is-draw'"), '引き分けでは両者を敗者表示にしない');
assert(ui.includes("const showVictoryLine = winnerSide !== 'draw' && opts.showVictoryLine !== false"), '引き分けと明示的なセリフ省略では勝者コメントを出さない');
assert(ui.includes('const bubbleHtml = showVictoryLine && line'), '勝者セリフは表示対象かつ文面がある場合だけ描画する');
assert(css.includes('.emr-bubble-slot'), '吹き出しは画像に被せず予約枠の中に入れる');
assert(ui.includes('function _emrCrossOrg(opts)'), '対外試合(左右の所属が実際に異なる)かどうかを判定する処理が必要');
assert(ui.includes('function _emrTeamHp(result, fighterIds)'), '通常タッグ結果はperFighterからチームHPを集計する');
assert(ui.includes('theme: \'normal\''), '通常興行テーマを接続する');
assert(ui.includes("normal:    { cls: 'is-normal'"), '通常興行だけの黄色系アクセントを適用できるテーマクラスが必要');
// 2026-07-26 決定を差し替え: 旧「試合途中・興行終了を問わず『進む』」→
// **「次の試合へ / 結果へ」の二択**（Keisuke 裁定）。
// 「進む」はいちばん多く見る画面なのに、いちばん何も言っていない言葉だった。
// 文言そのものの検査は test/match-next-label-test.js が持つ。ここでは**接続**だけ見る。
assert((ui.match(/nextLabel: _matchNextLabel\(idx >= total - 1\)/g) || []).length >= 2,
  '通常興行の結果ボタンは、最終試合かどうかで「次の試合へ / 結果へ」を出し分ける');
assert(ui.includes('theme: \'spring\''), '春タッグテーマを接続する');
assert(ui.includes('theme: \'summer\''), '夏ジュニアテーマを接続する');
assert(ui.includes('theme: \'autumn\''), '秋団体戦テーマを接続する');
assert(ui.includes('theme: \'tenchosen\''), '天頂戦テーマを接続する');
assert(ui.includes('theme: \'ppv\''), 'PPVテーマを接続する');

assert(app.includes('renderRegularMatchResultPopup(idx, skipFlavor'), '通常興行は観戦・1試合スキップの両方で結果ポップアップを出す');
assert(ui.includes('const boutNumber = total - idx;'), '通常興行の結果番号は前座からメインへの実施順に合わせる');
assert(ui.includes('sourceMatch?.isCRMatch && r._challengeRelationshipDelta'), '挑戦試合の興行結果には方向別の因縁・相手との関係変化を表示する');
assert(app.includes('? finalize\n      : () => App._runPostMatchFlavorForMatch'), '1試合スキップでは余韻だけを省略し、結果画面は維持する');
assert(app.includes('renderSpringTagLeagueMatchResultPopup(revealed, false)'), '春リーグ各試合で結果ポップアップを出す');
assert(app.includes('renderAutumnWarBoutResultPopup(resolved.match, resolved.bout)') && app.includes('renderAutumnWarBoutResultPopup(match, match?.bouts?.[resolved.boutIndex] || resolved.bout)'), '秋団体戦のスキップ・観戦の各フォールで結果ポップアップを出す');
assert(app.includes('renderPPVMatchResultPopup(idx, () =>'), 'PPV各試合で結果ポップアップを出す');
assert(ui.includes('onContinue: () => App.jtAdvanceAfterResult(ri, mi)'), 'ジュニア結果を閉じた後に従来進行へ戻す');
assert(ui.includes('onContinue: () => App.tcAdvanceAfterResult(ri, mi)'), '天頂戦結果を閉じた後に従来進行へ戻す');

console.log('event-match-result-popup-test: ok');
