#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/hof-epithet-count-test.js — 殿堂の異名の数字が実際の回数と一致する回帰ガード
//  (2026-09-25 面白さ総点検 06-⑤「三度の頂が4〜7回戴冠した選手にも付いている」)
//
//  ■ 何を守るか
//    1. 数字の入った異名(三度の頂・三度の栄冠・三年王朝・二度の戴冠・10年選手 …)は、
//       実際の回数と一致するときだけ選ばれる。合わないときは同じタグの数字の無い異名になる
//    2. 回数が一致する選手は、従来と同じ乱数から同じ異名が選ばれる(プールの並び・本数が不変)
//
//  ■ 使い方
//    node test/hof-epithet-count-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { loadGame } = require('./helpers/load-game.js');

loadGame({ full: true });
const A = Engine.awards;

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

const SEEDS = Array.from({ length: 300 }, (_, i) => 1000 + i * 7);
function epithetsFor(rec, fighter) {
  const out = new Set();
  SEEDS.forEach(seed => out.add(A.generateEpithet(rec, fighter, Engine.rng.create(seed))));
  return out;
}
// n回戴冠(防衛は各1回・最後は陥落)の履歴。ほかのタグ(防衛数・MVP等)に触れない
function reignsRec(n) {
  const history = [{ type: 'debut', season: 1, week: 1 }];
  for (let i = 0; i < n; i++) {
    history.push({ type: 'titleWin', season: 2 + i, week: 5, beltId: 'world', orgName: 'T王座' });
    history.push({ type: 'titleLoss', season: 2 + i, week: 30, beltId: 'world', orgName: 'T王座', defenses: 1 });
  }
  history.push({ type: 'retire', season: 3 + n, week: 40 });
  return { history, totalTitleWins: n, totalDefenses: n };
}
function mvpRec(n) {
  const history = [{ type: 'debut', season: 1, week: 1 }];
  for (let i = 0; i < n; i++) history.push({ type: 'awardMVP', season: 2 + i, week: 49 });
  history.push({ type: 'retire', season: 3 + n, week: 40 });
  return { history, totalTitleWins: 0, totalDefenses: 0 };
}
function jtRec(consecutive) {
  const history = [{ type: 'debut', season: 1, week: 1 }];
  for (let i = 0; i < consecutive; i++) history.push({ type: 'juniorTournament', season: 1 + i, result: 'champion' });
  history.push({ type: 'retire', season: 2 + consecutive, week: 40 });
  return { history, totalTitleWins: 0, totalDefenses: 0, juniorTournamentWins: consecutive };
}
const F = { id: 42, name: 'Epithet Test', trust: 50 };

section('1. 戴冠4〜7回の選手に「三度の頂」が付かない(同じタグの数字の無い異名になる)', () => {
  [4, 5, 6, 7].forEach(n => {
    const got = epithetsFor(reignsRec(n), F);
    assert.ok(!got.has('三度の頂'), `戴冠${n}回に「三度の頂」`);
    got.forEach(e => assert.ok(['不死鳥', '返り咲きの女王', '不滅の王者'].includes(e), `戴冠${n}回: 想定外の異名 ${e}`));
  });
  assert.ok(epithetsFor(reignsRec(3), F).has('三度の頂'), '戴冠ちょうど3回で「三度の頂」が選ばれない');
});

section('2. ほかの数字入りの異名も実数と一致する(MVP・ジュニア連覇・戴冠2回・在籍10年)', () => {
  assert.ok(!epithetsFor(mvpRec(4), F).has('三度の栄冠'), 'MVP4回に「三度の栄冠」');
  assert.ok(epithetsFor(mvpRec(3), F).has('三度の栄冠'), 'MVPちょうど3回で「三度の栄冠」が出ない');
  const jt4 = epithetsFor(jtRec(4), F);
  assert.ok(!jt4.has('三年王朝') && !jt4.has('三連覇の怪物'), 'ジュニア4連覇に「三年王朝/三連覇の怪物」');
  const jt3 = epithetsFor(jtRec(3), F);
  assert.ok(jt3.has('三年王朝') || jt3.has('三連覇の怪物'), 'ジュニアちょうど3連覇で数字入りの異名が出ない');
  // 規則表の各原文は、実在する異名であること(異名の文面を変えたら規則表も直す)
  const all = new Set(Object.values(A._EPITHET_TEMPLATES).flat());
  Object.keys(A._EPITHET_COUNT_RULES).forEach(k => assert.ok(all.has(k), `規則表の「${k}」が異名の表に無い`));
  // 10年選手は在籍ちょうど10年だけ
  const ironRec = (seasons) => ({ history: [{ type: 'debut', season: 1, week: 1 }, { type: 'retire', season: seasons, week: 40 }],
    totalTitleWins: 0, totalDefenses: 0, peakOVR: 70 });
  assert.ok(!epithetsFor(ironRec(14), F).has('10年選手'), '在籍14年に「10年選手」');
  assert.ok(epithetsFor(ironRec(10), F).has('10年選手'), '在籍ちょうど10年で「10年選手」が出ない');
});

section('3. 回数が一致する選手は、従来と同じ乱数から同じ異名が選ばれる', () => {
  const rec = reignsRec(3);
  const oldPool = A._EPITHET_TEMPLATES.tripleChamp.map(t => A._resolvePlaceholders(t, rec, F));
  SEEDS.slice(0, 60).forEach(seed => {
    const expected = oldPool[Engine.rng.int(Engine.rng.create(seed), 0, oldPool.length - 1)];
    assert.strictEqual(A.generateEpithet(rec, F, Engine.rng.create(seed)), expected, `seed ${seed}`);
  });
});

if (failed > 0) {
  console.error(`\n${failed} section(s) failed.`);
  process.exit(1);
}
console.log('\nhof-epithet-count-test: all sections passed.');
