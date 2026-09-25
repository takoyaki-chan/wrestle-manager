#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/retirement-article-variant-test.js — 引退記事の本文が戴冠歴と食い違わない回帰ガード
//  (2026-09-25 面白さ総点検 06 §5「引退記事のLティア第3文」)
//
//  ■ 何を守るか
//    Lティア(戴冠2回以上 または ピークOVR90以上)の第3バリアントは「ベルトの数で語られる選手では
//    なかった」と書く。同じ号にLティアの引退が3件以上並ぶと順繰りで複数回戴冠した選手にも回って
//    きていた。maxReigns(=1)を持つバリアントは戴冠1回以下の選手にだけ選ぶ。
//
//  ■ 使い方
//    node test/retirement-article-variant-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { loadGame } = require('./helpers/load-game.js');

loadGame({ full: true });
const NP = Engine.newspaper;
const NOT_BY_BELTS = /ベルトの数で語られる選手ではなかった/;

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

section('1. 「ベルトの数で語られる選手ではなかった」は戴冠1回以下の選手にだけ選ぶ', () => {
  const lVariants = RETIREMENT_TEMPLATES.L;
  const target = lVariants.find(v => NOT_BY_BELTS.test(v.body));
  assert.ok(target, 'Lティアに該当バリアントが無い(文面が変わったならこのテストを見直す)');
  assert.strictEqual(target.maxReigns, 1, '該当バリアントに maxReigns:1 が付いていない');
  // 複数回戴冠: 何件並んでも選ばれない
  [2, 3, 5, 7].forEach(reigns => {
    const used = {};
    for (let i = 0; i < 6; i++) {
      const v = NP.pickRetirementVariant('L', reigns, used);
      assert.ok(v && !NOT_BY_BELTS.test(v.body), `戴冠${reigns}回の${i + 1}件目に「ベルトの数で…」が当たった`);
    }
  });
  // 無冠(ピークOVRで L): 該当バリアントだけ({reigns} 入りは使えない)
  const used0 = {};
  for (let i = 0; i < 3; i++) assert.strictEqual(NP.pickRetirementVariant('L', 0, used0), target);
  // 戴冠1回: 3本とも順繰りで使える
  const used1 = {};
  const seen = new Set();
  for (let i = 0; i < 3; i++) seen.add(NP.pickRetirementVariant('L', 1, used1));
  assert.strictEqual(seen.size, 3, '戴冠1回の選手に3本が順繰りで回っていない');
});

section('2. 実際の号: Lティア(複数回戴冠)の引退が3件並んでも、どの本文も戴冠歴と食い違わない', () => {
  const base = Engine.createInitialState(77881, true);
  const orgId = Object.keys(base.aiOrgs)[0];
  const roster = base.aiOrgs[orgId].roster;
  const retirements = roster.slice(0, 3).map((f, i) => ({
    orgName: '天頂プロレス', id: f.id, name: f.name, age: 30 + i, ovr: 80,
    seasons: 10 + i, peakOVR: 86, reigns: 2 + i, wasChampion: false,
  }));
  const aiOrgs = { ...base.aiOrgs, [orgId]: { ...base.aiOrgs[orgId], _newsRetirements: retirements } };
  const wp = NP.generate({ ...base, season: 12, week: 1, aiOrgs }, Engine.rng.create(3));
  const stories = [wp.topStory, ...(wp.subStories || [])].filter(s => s && /Retirement/.test(s.type));
  assert.strictEqual(stories.length, 3, `引退記事が3本載っていない(${stories.length})`);
  stories.forEach(s => assert.ok(!NOT_BY_BELTS.test(s.body), `複数回戴冠の選手に「ベルトの数で…」: ${s.headline}`));
});

if (failed > 0) {
  console.error(`\n${failed} section(s) failed.`);
  process.exit(1);
}
console.log('\nretirement-article-variant-test: all sections passed.');
