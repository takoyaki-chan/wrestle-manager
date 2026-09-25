#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/newspaper-season-end-retirement-test.js — 自団体の季末引退を格付け記事にする回帰ガード
//  (2026-09-25 面白さ総点検 06-②「自団体選手のシーズン末引退は、新聞では30点の短信にしかならない」)
//
//  ■ 何を守るか
//    1. Engine.retirement.commitRetirements(季末の引退確定)が積む新聞イベントは、季中の引退
//       (scanRosterNews)と同じ retirementDeclare 形式(戴冠歴・ピークOVR・在籍・現役王者か)
//    2. それを新年号の generate() に通すと、格付け(retirementGrade)の乗った引退記事になる。
//       3度戴冠・ピークOVR88 の看板は一面トップの資格点に届く(以前は汎用テンプレ・30点の短信)
//    3. 同じ号に殿堂入りの通知が積まれていれば、殿堂入り・引退特別号へ合流し、殿堂入りの別記事は出ない
//    4. 同じIDの「前の人生」の殿堂入り(K-4: 別人)で今の人生の引退を特別号にしない
//       (エンジンの生成・紙面の描き分けの両方)
//    5. 季中の引退(scanRosterNews)も引退した季を持つ
//
//  ■ 使い方
//    node test/newspaper-season-end-retirement-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGame } = require('./helpers/load-game.js');
const { readSource } = require('./helpers/source.js');

loadGame({ full: true });
const NP = Engine.newspaper;

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}

// 3度戴冠(最後の王座は陥落済み)・ピークOVR88・在籍9季の看板
function veteranHistory() {
  const h = [{ type: 'debut', season: 1, week: 1, via: 'draft', orgId: 'player' }];
  [2, 4, 6].forEach(s => {
    h.push({ type: 'titleWin', season: s, week: 10, beltId: 'world', orgName: 'テスト団体王座' });
    h.push({ type: 'titleLoss', season: s + 1, week: 10, beltId: 'world', orgName: 'テスト団体王座', defenses: 2 });
  });
  return h;
}
function seasonEndState() {
  const base = Engine.createInitialState(24681, true);
  const vet = {
    ...base.roster[0], age: 31, careerSeasons: 9, popularity: 60,
    careerRecord: { ...Engine.career.createRecord(), history: veteranHistory(), totalTitleWins: 3, peakOVR: 88, peakOVRSeason: 5 },
  };
  const G = { ...base, season: 9, week: 48, offSeason: true, offWeek: 1, orgName: 'テスト団体',
    roster: [vet, ...base.roster.slice(1)], _industryNewsEvents: [] };
  return { G, vet };
}
// app.js の季末フロー(commitRetirements → newsItems を _pushNewsEvent)を再現し、新年号を1号出す
function newYearIssue(G, vet, extra = {}) {
  const res = Engine.retirement.commitRetirements(G, [vet]);
  let S = res.state;
  (res.newsItems || []).forEach(n => { S = Engine.industryNews.push(S, n); });
  (extra.queue || []).forEach(n => { S = Engine.industryNews.push(S, n); });
  S = { ...S, season: G.season + 1, week: 1, offSeason: false, offWeek: 0, retiredFighters: [],
    ...(extra.allHallOfFame ? { allHallOfFame: extra.allHallOfFame } : {}) };
  const wp = NP.generate(S, Engine.rng.create(9001));
  const all = [wp.topStory, ...(wp.subStories || [])].filter(Boolean);
  return { res, wp, all, story: all.find(s => s.characterId === vet.id && /[Rr]etire/.test(s.type)) };
}

section('1. 季末の引退確定は retirementDeclare(格付けの材料つき)を積む', () => {
  const { G, vet } = seasonEndState();
  const res = Engine.retirement.commitRetirements(G, [vet]);
  const items = (res.newsItems || []).filter(n => n.characterId === vet.id);
  assert.strictEqual(items.length, 1, '引退した選手の新聞イベントが1件でない');
  const ev = items[0];
  assert.strictEqual(ev.type, 'retirementDeclare', `型が ${ev.type}(旧: retirement の短信)`);
  assert.deepStrictEqual(
    { reigns: ev.data.reigns, peakOVR: ev.data.peakOVR, seasons: ev.data.seasons, retiredSeason: ev.data.retiredSeason, wasChampion: ev.data.wasChampion },
    { reigns: 3, peakOVR: 88, seasons: 9, retiredSeason: 9, wasChampion: false });
  assert.strictEqual(ev.data.name, vet.name);
  assert.strictEqual(ev.data.org, 'テスト団体');
  assert.ok(!(res.newsItems || []).some(n => n.type === 'retirement'), '汎用の retirement 短信が残っている');
});

section('2. 新年号で格付けの乗った引退記事になる(看板は一面トップの資格点に届く)', () => {
  const { G, vet } = seasonEndState();
  const { story } = newYearIssue(G, vet);
  assert.ok(story, '新年号に引退記事が載っていない');
  assert.strictEqual(story.type, 'retirementDeclare');
  const grade = NP.retirementGrade(story.newsData);
  assert.strictEqual(grade.tier, 'L', '3度戴冠の看板が L ティアにならない');
  assert.ok(story.newsValue >= NP.PRIORITY.retirementDeclare + grade.bonus,
    `格付けが点に乗っていない: ${story.newsValue}`);
  assert.ok(story.newsValue >= NP.SLOT_LINE.top, `看板の引退が ${story.newsValue} 点で一面トップ資格(${NP.SLOT_LINE.top})に届かない`);
  // 本文は L ティアのテンプレ(戴冠歴に合う文)から組まれている
  const L = RETIREMENT_TEMPLATES.L.map(v => v.headline);
  assert.ok(L.some(h => story.headlineTpl === h), `見出しが L ティアのテンプレでない: ${story.headline}`);
  // 以前の経路(汎用テンプレ・general 30点)と比べて、はっきり大きい
  const oldValue = NP.newsValue(G, { type: 'retirement', priority: NP.PRIORITY.general, characterId: vet.id, newsData: {} },
    NP.buildValueContext(G));
  assert.ok(story.newsValue - oldValue >= 150, `旧経路 ${oldValue} 点との差が小さい: ${story.newsValue}`);
});

section('3. 同じ号の殿堂入りは、殿堂入り・引退特別号へ合流する(殿堂入りの別記事は出ない)', () => {
  const { G, vet } = seasonEndState();
  const hof = { id: vet.id, name: vet.name, orgId: 'player', orgName: 'テスト団体', inductionSeason: 9,
    hofLevel: 2, titleReigns: 3, totalDefenses: 6, activeSeasonsStart: 1, activeSeasonsEnd: 9, activeYears: 'S1〜S9' };
  const { story, all } = newYearIssue(G, vet, {
    allHallOfFame: { player: [hof], org_s: [], org_a: [], org_b: [] },
    queue: [{ type: 'hallOfFame', characterId: vet.id, data: { name: vet.name, titles: 3, defenses: 6 } }],
  });
  assert.ok(story && story.newsData && story.newsData.hallOfFameRetirement, '殿堂入り・引退特別号になっていない');
  assert.ok(/殿堂入り/.test(story.headline), `特別号の見出しでない: ${story.headline}`);
  assert.ok(!all.some(s => s.type === 'hallOfFame' && s.characterId === vet.id), '殿堂入りの別記事が二重に出ている');
  assert.ok(story.newsValue >= NP.SLOT_LINE.top + NP.HOF_RETIREMENT_BONUS - 20, `特別号の点が低い: ${story.newsValue}`);
});

section('4. 同じIDの前の人生の殿堂入り(K-4: 別人)で、今の人生の引退を特別号にしない', () => {
  const { G, vet } = seasonEndState();
  const pastLife = { id: vet.id, name: vet.name, orgId: 'player', orgName: 'テスト団体', inductionSeason: 1,
    hofLevel: 3, titleReigns: 5, totalDefenses: 20, epithet: '前の人生の異名' };
  const { story } = newYearIssue(G, vet, { allHallOfFame: { player: [pastLife], org_s: [], org_a: [], org_b: [] } });
  assert.ok(story, '引退記事が載っていない');
  assert.ok(!(story.newsData && story.newsData.hallOfFameRetirement), '前の人生の殿堂入りで特別号になっている');
  assert.ok(!/前の人生の異名/.test(story.body), '前の人生の異名が本文に混ざっている');
  // 引退した季を渡さない呼び出し(AI団体の引退・旧データ)は従来どおりIDで引ける
  const st = { allHallOfFame: { player: [pastLife] } };
  assert.strictEqual(NP._findHallOfFameEntry(st, vet.id), pastLife);
  assert.strictEqual(NP._findHallOfFameEntry(st, vet.id, { retiredSeason: 9 }), null);
  assert.strictEqual(NP._findHallOfFameEntry(st, vet.id, { retiredSeason: 1 }), pastLife);

  // 紙面の描き分け(ui-render.js)も、引退した季を持つ記事は生成時の判定に従う
  const src = readSource('src', 'ui-render.js');
  const extract = (name) => {
    const start = src.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `${name} が無い`);
    const open = src.indexOf('{', start);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
      if (src[i] === '{') depth++;
      if (src[i] === '}') depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
    throw new Error(`extract ${name}`);
  };
  const ctx = vm.createContext({ G: { allHallOfFame: { player: [pastLife] } } });
  vm.runInContext([extract('_npV3HofEntry'), extract('_npV3IsHofRetirement')].join('\n'), ctx);
  const isHof = (story) => vm.runInContext(`_npV3IsHofRetirement(${JSON.stringify(story)})`, ctx);
  assert.strictEqual(isHof({ type: 'retirementDeclare', characterId: vet.id, newsData: { retiredSeason: 9 } }), false,
    '前の人生の殿堂入りで紙面が特別号に描き替わる');
  assert.strictEqual(isHof({ type: 'retirementDeclare', characterId: vet.id, newsData: { retiredSeason: 9, hallOfFameRetirement: true } }), true);
  // 引退した季を持たない旧号は、従来どおり殿堂の記録で描き替える
  assert.strictEqual(isHof({ type: 'retirementDeclare', characterId: vet.id, newsData: {} }), true);
});

section('5. 季中の引退(scanRosterNews)も引退した季を持つ', () => {
  const base = Engine.createInitialState(13579, true);
  const r = { ...base.roster[0], careerSeasons: 4,
    careerRecord: { ...Engine.career.createRecord(), history: [
      { type: 'debut', season: 1, week: 1 }, { type: 'retire', season: 5, week: 22, age: 26, reason: 'lastrun' }] } };
  const S = Engine.newspaper.scanRosterNews({ ...base, season: 5, week: 23, retiredFighters: [r], newsSeen: {} });
  const ev = (S._industryNewsEvents || []).find(e => e.type === 'retirementDeclare' && e.characterId === r.id);
  assert.ok(ev, '季中の引退記事が積まれていない');
  assert.strictEqual(ev.data.retiredSeason, 5);
  assert.strictEqual(ev.data.seasons, 5, '季中の引退は今季を+1して数える');
});

section('6. app.js は季末の引退確定の新聞イベントを積み続けている', () => {
  const app = readSource('src', 'app.js');
  assert.ok(/const result = Engine\.retirement\.commitRetirements\(G, confirmed\);/.test(app));
  assert.ok(/\(result\.newsItems \|\| \[\]\)\.forEach\(n => App\._pushNewsEvent\(n\)\);/.test(app),
    'commitRetirements の newsItems を新聞キューへ積んでいない');
});

if (failed > 0) {
  console.error(`\n${failed} section(s) failed.`);
  process.exit(1);
}
console.log('\nnewspaper-season-end-retirement-test: all sections passed.');
