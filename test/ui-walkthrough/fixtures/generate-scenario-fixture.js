#!/usr/bin/env node
'use strict';

// レア画面強制点火カタログ(③)のシナリオfixture生成CLI。
//   node test/ui-walkthrough/fixtures/generate-scenario-fixture.js <scenario> [seed]
// 生成物は fixtures/generated/<scenario>-seed<seed>.json (gitignore対象・都度生成)。

const fs = require('fs');
const path = require('path');
const scenarios = require('../scenarios');
const { advanceUntil, collectValidationWarnings, toSaveState, summarizeSwallowedErrors } = require('./headless-sim');

const scenarioName = process.argv[2];
const scenario = scenarios[scenarioName];
if (!scenario) {
  console.error(`Unknown scenario: ${scenarioName || '(none)'}`);
  console.error(`Available: ${Object.keys(scenarios).join(', ')}`);
  process.exit(1);
}

const seed = Number(process.argv[3] || scenario.fixture.seed);
if (!Number.isFinite(seed) || seed <= 0) {
  console.error('seed must be a positive number');
  process.exit(1);
}

// maxWeeks: 既定600週(=約11季)を超える停止条件を持つシナリオ(年代記は章の確定に十数季かかる)
// のために、シナリオ側から上限を宣言できるようにする(未指定は従来どおり headless-sim の既定)
let G = advanceUntil({
  seed,
  until: scenario.fixture.until,
  ...(scenario.fixture.maxWeeks ? { maxWeeks: scenario.fixture.maxWeeks } : {}),
});
if (scenario.fixture.engineer) G = scenario.fixture.engineer(G);

// headless 進行の自動応答が例外で失敗した件数(2026-09-26。以前は黙って捨てていた)。進行は止めずに知らせる
const swallowed = summarizeSwallowedErrors();
if (swallowed.length > 0) {
  console.error(`headless 進行の自動応答で握りつぶした例外 ${swallowed.reduce((n, g) => n + g.count, 0)} 件 (${scenarioName}, seed=${seed}):`);
  for (const g of swallowed) console.error(`  - ${g.where} ${g.detail} ×${g.count}(最初 ${g.first}): ${g.message}`);
}

const assertFails = scenario.fixture.assert ? scenario.fixture.assert(G) : [];
if (assertFails.length > 0) {
  console.error(`Fixture assert failed for ${scenarioName} (seed=${seed}):`);
  for (const fail of assertFails) console.error(`  - ${fail}`);
  process.exit(1);
}

// 実UIロード後のキャップ下限(orgPop 50帯=12)を超えるfixtureは毎週D1違反を吐く
const ownCount = (G.roster || []).filter(c => !c.isRental).length;
if (ownCount > 12) {
  console.error(`fixture roster ${ownCount}名 > 12。実UIのキャップ再計算で違反になる。headless-simのTARGET/capを確認`);
  process.exit(1);
}

const warnings = collectValidationWarnings(G);
if (warnings.length > 0) {
  console.error(`validateGameState violations in fixture ${scenarioName} (seed=${seed}):`);
  for (const warning of warnings) console.error(`  - ${warning}`);
  process.exit(1);
}

const saveState = toSaveState(G, `ignition fixture: ${scenarioName}, seed=${seed}`);
saveState.rngSeed = seed;
// engineerSave(save): toSaveState が落とす一時キー(_pendingFactionEvent / _pendingLargeEvent)を
// セーブへ置き直すための口。持ち越し中の派閥イベント・今週立った大型イベントの形(実プレイで
// 週を処理した直後の状態)を作る。検査に通らない形はここで例外にする
if (scenario.fixture.engineerSave) {
  const saveFails = scenario.fixture.engineerSave(saveState) || [];
  if (saveFails.length > 0) {
    console.error(`Fixture engineerSave failed for ${scenarioName} (seed=${seed}):`);
    for (const fail of saveFails) console.error(`  - ${fail}`);
    process.exit(1);
  }
}

const generatedDir = path.join(__dirname, 'generated');
fs.mkdirSync(generatedDir, { recursive: true });
const destination = path.join(generatedDir, `${scenarioName}-seed${seed}.json`);
fs.writeFileSync(destination, `${JSON.stringify(saveState)}\n`, 'utf8');
console.log(`Generated ${path.relative(process.cwd(), destination)} (season=${saveState.season} week=${saveState.week} roster=${saveState.roster.length} funds=${Math.round(saveState.funds)})`);
