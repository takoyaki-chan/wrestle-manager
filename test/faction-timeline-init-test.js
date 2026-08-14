#!/usr/bin/env node
'use strict';

// 派閥史(factionTimeline)の初期化ガード (2026-08-14)
//
// 全writer(factions.js×8+app.js×1)が `if (Array.isArray(s.factionTimeline))` ガード付きで
// 追記するため、初期化が無いと開戦(F02_IGNITE)・決着・派閥内序列戦などの派閥史が
// 一度も記録されず、社長室のタイムラインが空のままになる。
// バグ捜索体制③(レア画面点火カタログ R5)の初回実走で検出した欠落の再発防止。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'management.js', 'match-engine.js', 'relationships.js', 'factions.js'].forEach(loadAsGlobal);

// §1 新規ゲームは factionTimeline を配列で持って生まれる
const G0 = Engine.createInitialState(42, true);
assert.ok(Array.isArray(G0.factionTimeline), 'createInitialState が factionTimeline を初期化していない');

// §2 未初期化の既存セーブは repairOnLoad が救済する
const { factionTimeline: _removed, ...legacy } = G0;
const repaired = Engine.saveDoctor.repairOnLoad(legacy);
assert.ok(Array.isArray(repaired.state.factionTimeline), 'repairOnLoad が factionTimeline を補っていない');
assert.ok(repaired.changes.includes('faction_timeline_initialized'), 'repair 変更ログに faction_timeline_initialized が無い');

// §3 初期化済みなら writer が実際に記録する(開戦適用で IGNITE が刻まれる)
const withFactions = {
  ...G0,
  factions: [
    { id: 1, name: 'テスト派A', leaderId: G0.roster[0].id, memberIds: [G0.roster[0].id] },
    { id: 2, name: 'テスト派B', leaderId: G0.roster[1].id, memberIds: [G0.roster[1].id] },
  ],
  factionHostility: {},
};
const rng = Engine.rng.create(1);
const applied = Engine.factions.applyF02IgniteResult(withFactions, {
  factionAId: 1, factionBId: 2,
  factionAName: 'テスト派A', factionBName: 'テスト派B',
  leaderAId: G0.roster[0].id, leaderBId: G0.roster[1].id,
}, rng);
assert.ok(
  (applied.state.factionTimeline || []).some(e => e && e.type === 'F02_IGNITE'),
  '開戦を適用しても factionTimeline に F02_IGNITE が刻まれない'
);

console.log('faction-timeline-init-test: ok (初期化/ロード救済/開戦記録の3点)');
