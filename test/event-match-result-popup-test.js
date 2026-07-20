'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

assert(css.includes('.emr-layer'), '共通の1試合結果レイヤーが必要');
assert(css.includes('backdrop-filter:grayscale(.72) saturate(.28) brightness(.68) blur(2px)'), '背面を減彩するフィルターが必要');
assert(css.includes('.emr-popup') && css.includes('border-radius:14px'), '結果ポップアップの外枠は14px角丸にする');
assert(css.includes('.emr-bubble') && css.includes('.emr-bubble::after'), '勝者セリフの吹き出しと尻尾が必要');
assert(css.includes('.emr-layer.is-tenchosen,.emr-layer.is-ppv{--emr-accent:#d63d46'), '天頂戦とPPVは深紅のカラー言語を共有する');
assert(css.includes('--emr-accent:var(--ev-winter)'), '通常興行は旧冬色の白金を標準色にする');
assert(css.includes('grid-template-columns:minmax(0,1fr) 130px minmax(0,1fr)') && css.includes('padding:66px 58px 14px'), '選手画像はモックアップどおり中央寄りに配置する');
assert(css.includes('.emr-foot{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,300px) minmax(0,1fr)') && css.includes('.emr-next{grid-column:2;grid-row:1;width:100%') && css.includes('padding:12px 18px'), '進行ボタンは試合前ボタン相当の大きさで下中央へ配置する');
assert(css.includes('.emr-layer.is-normal .emr-hp-fill{background:linear-gradient(90deg,#bd8b18,#f0c75e)') && css.includes('.emr-layer.is-normal .emr-next{border-color:#f0c75e'), '通常興行のHPと進行ボタンは試合前画面と同じ黄色系にする');

assert(ui.includes('function showEventMatchResultPopup(opts)'), '共通ポップアップレンダラーが必要');
assert(ui.includes('function closeEventMatchResultPopup()'), '背面画面を維持したまま閉じる処理が必要');
assert(ui.includes('function _emrVictoryLine(fighter, preferred)'), '全大会で勝者セリフを解決する処理が必要');
assert(ui.includes("winnerSide === 'draw' ? 'is-draw'"), '引き分けでは両者を敗者表示にしない');
assert(ui.includes("winnerSide === 'draw' ? '' : `<div class=\"emr-bubble"), '引き分けでは架空の勝者コメントを出さない');
assert(ui.includes('function _emrTeamHp(result, fighterIds)'), '通常タッグ結果はperFighterからチームHPを集計する');
assert(ui.includes('theme: \'normal\''), '通常興行テーマを接続する');
assert(ui.includes("normal:    { cls: 'is-normal'"), '通常興行だけの黄色系アクセントを適用できるテーマクラスが必要');
assert((ui.match(/nextLabel: '進む →'/g) || []).length >= 2, '通常興行の結果ボタンは試合途中・興行終了を問わず「進む」に統一する');
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
assert(app.includes('renderAutumnWarBoutResultPopup(revealedMatch, revealedBout)'), '秋団体戦の各フォールで結果ポップアップを出す');
assert(app.includes('renderPPVMatchResultPopup(idx, () =>'), 'PPV各試合で結果ポップアップを出す');
assert(ui.includes('onContinue: () => App.jtAdvanceAfterResult(ri, mi)'), 'ジュニア結果を閉じた後に従来進行へ戻す');
assert(ui.includes('onContinue: () => App.tcAdvanceAfterResult(ri, mi)'), '天頂戦結果を閉じた後に従来進行へ戻す');

console.log('event-match-result-popup-test: ok');
