'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-4 S4: 恒久記録の人生番号(docs/fun-audit-v0.1/k4-separate-lives-design.md §3-B)
//
//  ID 55 が2つの人生を持つ合成状態(1番目: 旗揚げメンバー・AI団体で殿堂入り・S6引退 /
//  2番目: S12デビュー・自団体で S20 に引退)で、恒久記録の読み手が正しい人生を指すこと。
//  - 特別号: AI引退記事は、その人生の殿堂入りだけを特別号にする(前の人生の殿堂入りで書かない)
//  - 年代記候補: 前の人生のアーカイブと、今の人生の現役が別の候補になる。候補→フル記録の引き直しも人生で引く
//  - 年代記の登録: 2度目の自団体OGも登録される(IDだけで弾かない)
//  - founderState: 転生して自団体に戻った同名の別人を「現役」にしない
//  - _getDepartures: 今季引退した人生のアーカイブで在籍年数を出す
//  - 書き手: 殿堂エントリ・年代記アーカイブ・業界ニュース・新聞の記事・統一王座の履歴・序章のハイライトに
//    人生番号が刻まれる。retiredLives の書き手3か所と、転生の関所で消えること
//
//  WM_TEST_SRC_DIR で読み込む src を差し替えられる(変更前のコードで落ちることの確認用)。
// ══════════════════════════════════════════════════════════════════════════════
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
global.WM_I18N = { t(text, params) {
  if (typeof text !== 'string' || !params) return text;
  let out = text;
  Object.keys(params).forEach(k => { out = out.split('{' + k + '}').join(params[k]); });
  return out;
}, pn(s) { return s; }, pnSurname(s) { return s; }, mv(s) { return s; }, mvShort(s) { return s; } };

const srcDir = process.env.WM_TEST_SRC_DIR || path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js',
  'relationships.js', 'flag-dialogue.js', 'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log(`  ok  ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n${e.stack}`); process.exitCode = 1; }
}
const clone = v => JSON.parse(JSON.stringify(v));

const X = 55;
const NAME = '同名テスト';
const hofLife1 = {
  id: X, name: NAME, lifeNo: 1, orgId: 'org_s', orgName: 'S団体', style: 'Striker',
  activeSeasonsStart: 1, activeSeasonsEnd: 6, activeYears: 'S1〜S6', inductionSeason: 6,
  titleReigns: 4, totalDefenses: 12, hofPoints: 40, hofLevel: 2, epithet: '前の人生の異名',
  careerRecord: { history: [] },
};
const archiveLife1 = {
  id: X, lifeNo: 1, name: NAME, style: 'Striker', peakOVR: 88, peakOVRSeason: 4, peakPopularity: 80, peakPopularitySeason: 4,
  careerSeasonsStart: 1, careerSeasonsEnd: 6, retiredSeason: 6, titleReigns: 4, totalDefenses: 12,
  careerRecord: { history: [{ type: 'debut', season: 1 }, { type: 'titleWin', season: 3, beltId: 'world' },
    { type: 'titleDefense', season: 3, beltId: 'world', count: 12 }], seasonalSnapshots: [] },
  traits: [], age: 30,
};

function baseState() {
  let s = Engine.createInitialState(4545, true);
  // 55 を自団体の現役(2番目の人生)として置く
  const tmpl = clone(s.roster[0]);
  const me = { ...tmpl, id: X, name: NAME, lifeNo: 2, debutSeason: 12, careerStage: 'active', careerSeasons: 8, age: 26,
    careerRecord: { history: [{ type: 'debut', season: 12 }], seasonalSnapshots: [] } };
  s = { ...s, season: 20, week: 10, roster: [...s.roster.filter(f => f.id !== X).slice(0, 5), me],
    lifeSerial: { ...(s.lifeSerial || {}), [X]: 2 },
    allHallOfFame: { player: [], org_s: [clone(hofLife1)], org_a: [], org_b: [] },
    hallOfFame: [],
    chronicle: { ...(s.chronicle || Engine.chronicle.createEmpty()), fighterArchive: [clone(archiveLife1)] },
  };
  // 他の団体に同じIDが残っていないこと
  Object.keys(s.aiOrgs || {}).forEach(o => {
    s.aiOrgs[o] = { ...s.aiOrgs[o], roster: (s.aiOrgs[o].roster || []).filter(f => f.id !== X) };
  });
  s.freeAgents = (s.freeAgents || []).filter(f => f.id !== X);
  s.scoutCandidates = (s.scoutCandidates || []).filter(f => f.id !== X);
  return s;
}

function paperStories(paper) {
  const all = [paper.topStory, ...(paper.subStories || [])];
  (paper.pages || []).forEach(p => { if (p && Array.isArray(p.stories)) all.push(...p.stories); });
  return all.filter(Boolean);
}

test('特別号: AI引退記事は、その人生の殿堂入りだけを特別号にする', () => {
  // 2番目の人生がAI団体で引退(殿堂入りしていない)。1番目の人生の殿堂入りで特別号にしない
  let s = baseState();
  s = { ...s, roster: s.roster.filter(f => f.id !== X), offSeason: true, offWeek: 2, week: 52 };
  s.aiOrgs = { ...s.aiOrgs, org_a: { ...s.aiOrgs.org_a, _newsRetirements: [{
    orgName: 'A団体', id: X, name: NAME, age: 29, ovr: 66, seasons: 8, peakOVR: 72, reigns: 0, wasChampion: false,
    lifeNo: 2, retiredSeason: 20,
  }] } };
  const paper = Engine.newspaper.generate(s, Engine.rng.create(99));
  const st = paperStories(paper).find(x => x.characterId === X && /Retirement$/.test(x.type));
  assert.ok(st, '引退記事が載る');
  assert.ok(!(st._recompose && st._recompose.kind === 'hofRetirement'), '前の人生の殿堂入りで特別号にしない');
  // 2番目の人生も殿堂入りしていれば、その人生のエントリで特別号にする
  const hofLife2 = { ...clone(hofLife1), lifeNo: 2, orgId: 'org_a', orgName: 'A団体', activeSeasonsStart: 12,
    activeSeasonsEnd: 20, inductionSeason: 20, epithet: '今の人生の異名' };
  const s2 = { ...s, allHallOfFame: { ...s.allHallOfFame, org_a: [hofLife2] } };
  const paper2 = Engine.newspaper.generate(s2, Engine.rng.create(99));
  const st2 = paperStories(paper2).find(x => x.characterId === X && /Retirement$/.test(x.type));
  assert.ok(st2 && st2._recompose && st2._recompose.kind === 'hofRetirement', '今の人生の殿堂入りは特別号');
  assert.strictEqual(st2._recompose.hofEntry.epithet, '今の人生の異名');
});

test('_findHallOfFameEntry: 人生番号で引く(番号の無い旧エントリは引退した季で)', () => {
  const s = baseState();
  assert.strictEqual(Engine.newspaper._findHallOfFameEntry(s, X, { lifeNo: 2, retiredSeason: 20 }), null);
  assert.strictEqual(Engine.newspaper._findHallOfFameEntry(s, X, { lifeNo: 1 }).epithet, '前の人生の異名');
  const legacy = { ...s, allHallOfFame: { ...s.allHallOfFame, org_s: [{ ...clone(hofLife1), lifeNo: undefined }] } };
  assert.strictEqual(Engine.newspaper._findHallOfFameEntry(legacy, X, { lifeNo: 2, retiredSeason: 20 }), null,
    '番号の無い旧エントリは季が合わなければ引かない');
  assert.ok(Engine.newspaper._findHallOfFameEntry(legacy, X, { lifeNo: 1, retiredSeason: 6 }));
});

test('年代記候補: 前の人生のアーカイブと今の人生の現役が別の候補になる', () => {
  const s = baseState();
  const cands = Engine.chronicle._collectCandidates(s).filter(c => c.id === X);
  assert.strictEqual(cands.length, 2, '2人とも候補');
  const archived = cands.find(c => !c._active);
  const active = cands.find(c => c._active);
  assert.strictEqual(archived.lifeNo, 1);
  assert.strictEqual(active.lifeNo, 2);
  // 候補→フル記録の引き直し(章の防衛数など)も人生で引く
  const full1 = Engine.chronicle._resolveFullFighter({ id: X, lifeNo: 1, name: NAME }, s);
  assert.strictEqual(full1.careerSeasonsEnd, 6, '1番目の人生のエースは1番目のアーカイブを引く');
  const full2 = Engine.chronicle._resolveFullFighter({ id: X, lifeNo: 2, name: NAME }, s);
  assert.strictEqual(full2.debutSeason, 12, '2番目の人生は現役を引く');
  // 章の防衛数: 1番目の人生のエースは12防衛(現役の同名を引くと0になっていた)
  const def = Engine.chronicle._countChapterDefensesForAce({ id: X, lifeNo: 1 }, { seasonStart: 1, seasonEnd: 6 }, s);
  assert.strictEqual(def, 12);
});

test('年代記の登録: 2度目の自団体OGも登録される(IDだけで弾かない)', () => {
  const s = baseState();
  const me = s.roster.find(f => f.id === X);
  const out = Engine.chronicle.archiveFighter(s, { ...me, careerRecord: { history: [{ type: 'debut', season: 12 }, { type: 'retire', season: 20 }] } });
  const list = out.chronicle.fighterArchive.filter(a => a.id === X);
  assert.strictEqual(list.length, 2);
  const e2 = list.find(a => a.lifeNo === 2);
  assert.ok(e2, '2番目の人生の項目');
  assert.strictEqual(e2.debutSeason, 12);
  // 同じ人生は二重に登録しない
  const again = Engine.chronicle.archiveFighter(out, me);
  assert.strictEqual(again.chronicle.fighterArchive.filter(a => a.id === X).length, 2);
});

test('founderState: 転生して自団体に戻った同名の別人を「現役」にしない', () => {
  const s = baseState();
  const withFounder = { ...s, prologue: { ...(s.prologue || {}), founderIds: [X], status: 'in_progress' } };
  assert.strictEqual(Engine.prologue.founderState(withFounder, X), 'retired', '1番目の人生は自団体で引退済み');
  const noArchive = { ...withFounder, chronicle: { ...withFounder.chronicle, fighterArchive: [] } };
  assert.strictEqual(Engine.prologue.founderState(noArchive, X), 'departed', '1番目の人生は他団体へ去った');
  // 1番目の人生のまま自団体にいれば現役
  const firstLife = { ...withFounder, roster: withFounder.roster.map(f => f.id === X ? { ...f, lifeNo: 1 } : f),
    lifeSerial: { ...withFounder.lifeSerial, [X]: 1 }, chronicle: { ...withFounder.chronicle, fighterArchive: [] } };
  assert.strictEqual(Engine.prologue.founderState(firstLife, X), 'active');
});

test('_getDepartures: 今季引退した人生のアーカイブで在籍年数を出す', () => {
  let s = baseState();
  const me = s.roster.find(f => f.id === X);
  s = Engine.chronicle.archiveFighter(s, { ...me, careerRecord: { history: [{ type: 'debut', season: 12 }, { type: 'retire', season: 20 }] } });
  s = { ...s, roster: s.roster.filter(f => f.id !== X), retiredFighters: [], retiredSeasons: { [X]: 20 }, retiredIds: [X] };
  const deps = Engine.seasonReview._getDepartures(s).filter(d => d.id === X);
  assert.strictEqual(deps.length, 1);
  assert.ok(deps[0].note.includes('9'), `2番目の人生の9年(S12〜S20): ${deps[0].note}`);
});

test('書き手: 殿堂エントリに人生番号・AI選手の在籍の始まりはデビューの季', () => {
  const s = baseState();
  const me = s.roster.find(f => f.id === X);
  const aiF = { ...me, careerRecord: { history: [{ type: 'retire', season: 20 }] } };
  const e = Engine.awards._buildHofEntry(aiF, 'org_a', 'A団体', s);
  assert.strictEqual(e.lifeNo, 2);
  assert.strictEqual(e.activeSeasonsStart, 12, 'AI選手の在籍の始まり(以前は常に1)');
  assert.strictEqual(e.activeYears, 'S12〜S20');
});

test('書き手: 業界ニュース・新聞の記事・統一王座の履歴・序章のハイライトに人生番号', () => {
  const s = baseState();
  const q = Engine.industryNews.push(s, { type: 'retirementDeclare', characterId: X, data: { name: NAME } });
  const ev = q._industryNewsEvents[q._industryNewsEvents.length - 1];
  assert.deepStrictEqual(ev.characterLives, { [X]: 2 });
  const paper = Engine.newspaper.generate(q, Engine.rng.create(5));
  const withId = paperStories(paper).filter(st => st.characterId != null);
  assert.ok(withId.length > 0);
  withId.forEach(st => assert.ok(st.characterLives && st.characterLives[st.characterId] != null, `記事 ${st.type}`));
  // 統一王座: 戴冠の履歴
  const crowned = Engine.unifiedTitle.awardTournamentWinner(s, X).state;
  const last = crowned.unifiedTitle.history[crowned.unifiedTitle.history.length - 1];
  assert.deepStrictEqual(last.lives, { [X]: 2 });
  // 序章のハイライト
  const pro = { ...s, prologue: { ...(s.prologue || {}), status: 'in_progress', highlights: [] } };
  const hl = Engine.prologue.addHighlight(pro, { id: 'k4test', text: 'x', characterId: X }).prologue.highlights[0];
  assert.strictEqual(hl.characterLifeNo, 2);
});

test('retiredLives: 自団体の年末・AI団体の季末・フリーのまま引退で書き、転生の関所で消える', () => {
  // (1) 自団体: finalizeRetireeBuffer
  let s = baseState();
  const me = s.roster.find(f => f.id === X);
  s = { ...s, roster: s.roster.filter(f => f.id !== X), retiredFighters: [{ ...me, careerRecord: { history: [
    { type: 'debut', season: 12 }, { type: 'titleWin', season: 15, beltId: 'world' }, { type: 'retire', season: 20 }] } }] };
  const fin = Engine.awards.finalizeRetireeBuffer(s);
  const rl = fin.retiredLives && fin.retiredLives[X];
  assert.ok(rl, '自団体の引退者の要約');
  assert.strictEqual(rl.lifeNo, 2);
  assert.strictEqual(rl.alumni, true);
  assert.strictEqual(rl.crowned, true);
  assert.strictEqual(rl.debutSeason, 12);
  // (2) 転生の関所で消える
  const reborn = Engine.life.beginNewLife(fin, X);
  assert.ok(!(reborn.retiredLives && reborn.retiredLives[X]), '転生で要約は消える');
  assert.strictEqual(reborn.lifeSerial[X], 3);
  // (3) AI団体: processSeasonEnd が要約を返し、advanceWeek が書く
  let a = Engine.createInitialState(4546, true);
  const org = Object.keys(a.aiOrgs)[0];
  const vet = a.aiOrgs[org].roster[0];
  a.aiOrgs[org] = { ...a.aiOrgs[org], _midSeasonRetirees: [{ ...vet, id: 9901, careerRecord: { history: [] } }] };
  const res = Engine.rival.processSeasonEnd(Engine.rng.create(3), a);
  const pair = (res.retiredLives || []).find(([id]) => id === 9901);
  assert.ok(pair, 'processSeasonEnd が引退した人生の要約を返す');
  assert.strictEqual(pair[1].lastOrgId, org);
  const adv = Engine.advanceWeek({ ...a, offSeason: true, offWeek: 0, weekPhase: 'offseason' }).state;
  // 開始時から引退枠にいるID(一度も生きていない)は除く
  const aiRetired = Object.keys(adv.retiredSeasons || {}).map(Number)
    .filter(id => adv.retiredSeasons[id] === a.season && !(a.retiredSeasons && a.retiredSeasons[id] != null));
  assert.ok(aiRetired.includes(9901), '季中の引退者が季末に引退枠へ入る');
  aiRetired.forEach(id => assert.ok(adv.retiredLives && adv.retiredLives[id], `advanceWeek: AI引退者 ${id} の要約`));
  // (4) フリーのまま引退
  let f = baseState();
  const fa = { ...f.roster.find(x => x.id === X), faSince: 19, faFromOrgId: 'org_b' };
  f = { ...f, roster: f.roster.filter(x => x.id !== X), freeAgents: [...(f.freeAgents || []), fa] };
  const r = Engine.util.retireUnsignedFreeAgents(f);
  assert.ok(r.state.retiredLives && r.state.retiredLives[X], 'フリーのまま引退の要約');
  assert.strictEqual(r.state.retiredLives[X].lastOrgId, 'org_b');
  assert.ok(!('_fighter' in r.retired[0]), '戻り値に選手オブジェクトを残さない');
});

console.log(`\nk4-permanent-records-test: ${passed} passed${process.exitCode ? ' (FAILURES)' : ''}`);
