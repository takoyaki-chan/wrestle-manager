#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/newspaper-odd-week-no-repost-test.js — 非興行週の号が前週の興行記事を再掲しない回帰ガード
//  (2026-09-25 面白さ総点検 06-④)
//
//  ■ 何を守るか
//    Engine.newspaper.generate は、自団体の興行結果(state.currentNewspaper)を
//    「興行週で、今週生成されたもの」だけ載せる。currentNewspaper は次の興行週の頭まで残るので、
//    以前は非興行週の号(と新年号)に前週の興行記事が今週の日付「第N年度・第M週 定期興行」で
//    トップ再掲され、詳報(本紙つづき)も付いていた。非興行週の号が空になってもよい。
//
//  ■ 使い方
//    node test/newspaper-odd-week-no-repost-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { loadGame } = require('./helpers/load-game.js');

loadGame({ full: true });
const NP = Engine.newspaper;

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

const base = Engine.createInitialState(4242, true);
const showPaper = (week, season = 1, extra = {}) => ({
  headline: '第2週興行のメイン、白熱の決着', article: '興行の本文。', isTitleMatch: false,
  winner: { id: base.roster[0].id }, left: { id: base.roster[0].id }, right: { id: base.roster[1].id },
  generatedWeek: week, generatedSeason: season, ...extra,
});
const stateAt = (week, cn, extra = {}) => ({ ...base, season: 1, week, offSeason: false, orgName: 'テスト団体',
  currentNewspaper: cn, _industryNewsEvents: [], ...extra });
const playerShowStories = (wp) => [wp.topStory, ...(wp.subStories || [])]
  .filter(s => s && (s.type === 'playerShowNormal' || s.type === 'playerShowTitle'));

section('1. 興行週の号: その週の興行記事と詳報を載せる', () => {
  const wp = NP.generate(stateAt(2, showPaper(2)), Engine.rng.create(1));
  const st = playerShowStories(wp);
  assert.strictEqual(st.length, 1, '興行週に自団体の興行記事が載っていない');
  assert.ok(/第1年度・第2週/.test(st[0].situation), `スタンプ: ${st[0].situation}`);
  assert.ok(wp.playerShowData, '興行週に詳報が付いていない');
});

section('2. 翌週(非興行週)の号: 前週の興行記事を再掲しない・詳報も付けない', () => {
  const wp = NP.generate(stateAt(3, showPaper(2)), Engine.rng.create(1));
  assert.strictEqual(playerShowStories(wp).length, 0,
    `非興行週の号に前週の興行記事が再掲されている: ${playerShowStories(wp).map(s => s.situation).join(' / ')}`);
  assert.strictEqual(wp.playerShowData, null, '非興行週の号に前週の詳報が付いている');
  // publish 経由(週次の発行手順)でも同じ
  const S = NP.publish(stateAt(3, showPaper(2)), Engine.rng.create(1));
  assert.strictEqual(S.weeklyNewspaper.playerShowData, null);
  assert.strictEqual(playerShowStories(S.weeklyNewspaper).length, 0);
});

section('3. 次の興行週でも、前の興行週の結果は載せない(tickWeek の新聞クリアが漏れた場合の保険)', () => {
  const wp = NP.generate(stateAt(4, showPaper(2)), Engine.rng.create(1));
  assert.strictEqual(playerShowStories(wp).length, 0);
  assert.strictEqual(wp.playerShowData, null);
  // 同じ週番号でも別の年度の結果は載せない
  const wp2 = NP.generate(stateAt(2, showPaper(2, 0)), Engine.rng.create(1));
  assert.strictEqual(playerShowStories(wp2).length, 0);
});

section('4. 新年号(第1週): 前季末の興行記事を載せない', () => {
  const wp = NP.generate({ ...stateAt(1, showPaper(46, 1)), season: 2 }, Engine.rng.create(1));
  assert.strictEqual(playerShowStories(wp).length, 0);
  assert.strictEqual(wp.playerShowData, null);
});

section('5. 生成週を持たない旧データは、興行週のときだけ載せる', () => {
  const legacy = showPaper(2);
  delete legacy.generatedWeek; delete legacy.generatedSeason;
  assert.strictEqual(playerShowStories(NP.generate(stateAt(2, legacy), Engine.rng.create(1))).length, 1);
  assert.strictEqual(playerShowStories(NP.generate(stateAt(3, legacy), Engine.rng.create(1))).length, 0);
});

section('6. 判定は1か所(_isFreshPlayerShow)に寄せてある', () => {
  assert.strictEqual(NP._isFreshPlayerShow(stateAt(2, showPaper(2))), true);
  assert.strictEqual(NP._isFreshPlayerShow(stateAt(3, showPaper(2))), false);
  assert.strictEqual(NP._isFreshPlayerShow(stateAt(2, null)), false);
  const src = String(NP.generate);
  assert.ok(!/if \(state\.currentNewspaper\) \{/.test(src), 'generate が currentNewspaper の存在だけで載せている');
  assert.ok(!/playerShowData: state\.currentNewspaper \|\| null/.test(src), '詳報が存在だけで付いている');
});

if (failed > 0) {
  console.error(`\n${failed} section(s) failed.`);
  process.exit(1);
}
console.log('\nnewspaper-odd-week-no-repost-test: all sections passed.');
