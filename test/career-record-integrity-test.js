#!/usr/bin/env node
'use strict';

// ══════════════════════════════════════════════════════════════════════════════
//  careerRecord.history 積み忘れ検出テスト
//
//  ■ なぜこのテストがあるか
//    キャリア記録は **書き込み地点が20箇所以上に散っている**。しかも
//    「エンジン(management.js)にある経路」と「UI(app.js)にしかない経路」が混在していて、
//    auto-sim は app.js を読み込まないため *記録漏れをまったく検出できない*。
//    実際 WM_HOF_FIXTURE=1 の棚卸しでは 9 種類が 0 件に見えていたが、その大半は
//    「起きていない」のではなく「計測経路が本番と違う」だけだった。
//
//    このテストは type ごとに「どの関数を呼べば必ず積まれるか」を固定する。
//    新しい記録を足すとき / 経路を移すときは、ここに1本足すこと。
//
//  ■ 2種類のチェック
//    A. 振る舞い: エンジンを実際に回して state に残ることを確認する(本命)
//    B. 経路ガード: app.js にしか無い書き込み(DOM依存で実行できない)は、
//       書き込み地点と **G への書き戻し** が消えていないことをソースで見張る
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame({ full: true });

const srcDir = path.join(__dirname, '..', 'src');
const appSource = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const uiCommonSource = fs.readFileSync(path.join(srcDir, 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');

const types = hist => (hist || []).map(e => e.type);
const historyOf = f => ((f && f.careerRecord) || {}).history || [];
const has = (f, type) => historyOf(f).some(e => e.type === type);

let checks = 0;
function ok(cond, msg) {
  checks++;
  assert.ok(cond, msg);
}

// ══════════════════════════════════════════════════════════════════════════
//  A-1. Engine.career の土台
// ══════════════════════════════════════════════════════════════════════════
(function careerAddEventKeepsPreviousHistory() {
  const f = { id: 1, name: 'A', careerRecord: { history: [{ type: 'debut', season: 1 }] } };
  const g = Engine.career.addEvent(f, { type: 'titleWin', season: 3 });
  assert.deepStrictEqual(types(historyOf(g)), ['debut', 'titleWin']);
  // immutable: 元の fighter は書き換わらない(呼び出し元が書き戻しを忘れる事故を検出しやすくする)
  assert.deepStrictEqual(types(historyOf(f)), ['debut']);
  checks += 2;
})();

(function ensureRetireEventIsIdempotent() {
  const f = { id: 1, name: 'A', age: 31, careerRecord: { history: [] } };
  const once = Engine.career.ensureRetireEvent(f, 7, 12, 'injury');
  const twice = Engine.career.ensureRetireEvent(once, 9, 3, 'career');
  assert.deepStrictEqual(types(historyOf(twice)), ['retire'], '引退は1件だけ。2度引退した年表になってはいけない');
  const ev = historyOf(twice)[0];
  assert.strictEqual(ev.season, 7);
  assert.strictEqual(ev.week, 12);
  assert.strictEqual(ev.reason, 'injury');
  assert.strictEqual(ev.age, 31);
  checks += 5;
})();

(function ensureRetireEventWorksOnFighterWithoutCareerRecord() {
  const f = { id: 2, name: 'B', age: 28 };
  const r = Engine.career.ensureRetireEvent(f, 4);
  ok(has(r, 'retire'), 'careerRecord 未整備の選手でも retire を刻めること(旧セーブ互換)');
  assert.strictEqual(historyOf(r)[0].week, undefined, 'week 未指定なら week キーを付けない');
  checks++;
})();

// ══════════════════════════════════════════════════════════════════════════
//  A-2. joinSeason の判定は1箇所に集約されている
//       (calcHofPoints / buildCareerHighlights が独自に写経していると、
//        「殿堂ポイントは付くのに実績リストには出ない」形でズレる)
// ══════════════════════════════════════════════════════════════════════════
(function joinSeasonDetectionIsConsistentAcrossReaders() {
  const cases = [
    { label: 'debutのみ', history: [
      { type: 'debut', season: 5 }, { type: 'titleWin', season: 6, beltId: 'world' } ] },
    { label: '転生前debut + player移籍', history: [
      { type: 'debut', season: 1 },
      { type: 'titleWin', season: 2, beltId: 'world' },
      { type: 'transfer', season: 9, toOrg: 'player' },
      { type: 'titleWin', season: 10, beltId: 'world' } ] },
    { label: 'rentalIn', history: [
      { type: 'debut', season: 1 },
      { type: 'rentalIn', season: 8, toOrg: 'player' },
      { type: 'titleWin', season: 8, beltId: 'world' } ] },
    { label: '起点なし', history: [
      { type: 'titleWin', season: 2, beltId: 'world' } ] },
  ];
  cases.forEach(({ label, history }) => {
    const joinS = Engine.career.joinSeason({ careerRecord: { history } });
    const post = Engine.career.filterPostJoin(history, joinS);
    // calcHofPoints はタイトル戴冠 1件 = 1pt。post-join の titleWin 数と一致するはず
    const expectedTitlePt = post.filter(e => e.type === 'titleWin').length;
    const pts = Engine.awards.calcHofPoints({ history });
    assert.strictEqual(pts, expectedTitlePt,
      `${label}: calcHofPoints が Engine.career.joinSeason と違う範囲を集計している`);
    // buildCareerHighlights も同じ範囲であること
    const hl = Engine.awards.buildCareerHighlights({ history }, '団体', { season: 20 });
    assert.strictEqual(hl.filter(h => h.type === 'titleWin').length, expectedTitlePt,
      `${label}: buildCareerHighlights が calcHofPoints と違う範囲を見ている`);
    checks += 2;
  });
})();

// ══════════════════════════════════════════════════════════════════════════
//  A-2b. 旗揚げ5人の debut に団体名が入っていること
//        (rivalOrgNames に 'player' が無く、年表が「player にドラフト入団」になっていた)
// ══════════════════════════════════════════════════════════════════════════
(function foundingRosterDebutCarriesOrgName() {
  let G = Engine.createInitialState(31337, true);
  G = { ...G, orgName: 'テスト女子プロレス' };
  G = Engine.career.generateAllBackstories(G);
  G.roster.forEach(f => {
    const debut = historyOf(f).find(e => e.type === 'debut');
    ok(debut, `${f.name} に debut が刻まれていること`);
    assert.strictEqual(debut.orgName, 'テスト女子プロレス',
      '旗揚げメンバーの debut に内部ID(player)ではなく団体名が入ること');
    checks++;
  });
  const npc = Object.values(G.aiOrgs)[0].roster[0];
  const npcDebut = historyOf(npc).find(e => e.type === 'debut');
  ok(npcDebut && npcDebut.orgName && npcDebut.orgName !== 'player',
    'AI団体側の debut も団体名で入ること');
})();

// ══════════════════════════════════════════════════════════════════════════
//  A-3. titleWin / titleDefense / titleLoss — Engine.executeShow
// ══════════════════════════════════════════════════════════════════════════
(function executeShowRecordsTitleEvents() {
  let G = Engine.createInitialState(4242, true);
  G = { ...G, titleEstablished: true, orgPop: 40, week: 2, weekPhase: 'manage', orgName: 'テスト団体' };
  const r = G.roster;
  ok(r.length >= 3, '初期ロスターが3人以上あること');

  // ① 王座空位 → 初代王者決定戦
  G = { ...G, showCard: [{ left: r[0].id, right: r[1].id, isTitle: true }], showVenue: 2 };
  const res1 = Engine.executeShow(G);
  ok(!res1.error, `初代王者決定戦が実行できること: ${res1.error || ''}`);
  let S = res1.state;
  const champId = S.titles.world.championId;
  ok(champId != null, 'タイトルマッチ後に王者が決まること');
  const champ = S.roster.find(f => f.id === champId);
  ok(has(champ, 'titleWin'), 'titleWin が executeShow の返り値 state.roster に残っていること');
  assert.strictEqual(champ.careerRecord.totalTitleWins, 1, 'totalTitleWins キャッシュも更新されること');
  checks++;

  // ② 防衛（王者を圧倒的に強くして勝たせる）
  const challengerId = S.roster.find(f => f.id !== champId).id;
  S = { ...S, week: 16, weekPhase: 'manage', showVenue: 2,
    showCard: [{ left: champId, right: challengerId, isTitle: true }],
    roster: S.roster.map(f => f.id === champId
      ? { ...f, pw: 99, sp: 99, te: 99, st: 99, mn: 99, condition: 100, injury: null }
      : { ...f, pw: 25, sp: 25, te: 25, st: 25, mn: 25 }) };
  const res2 = Engine.executeShow(S);
  ok(!res2.error, `防衛戦が実行できること: ${res2.error || ''}`);
  S = res2.state;
  const champ2 = S.roster.find(f => f.id === champId);
  ok(has(champ2, 'titleDefense'), 'titleDefense が state.roster に残っていること');
  assert.strictEqual(champ2.careerRecord.totalDefenses, 1, 'totalDefenses キャッシュも更新されること');
  checks++;

  // ③ 王座交代（挑戦者を圧倒的に強くする）
  S = { ...S, week: 30, weekPhase: 'manage', showVenue: 2,
    showCard: [{ left: champId, right: challengerId, isTitle: true }],
    roster: S.roster.map(f => f.id === challengerId
      ? { ...f, pw: 99, sp: 99, te: 99, st: 99, mn: 99, condition: 100, injury: null }
      : { ...f, pw: 20, sp: 20, te: 20, st: 20, mn: 20 }) };
  const res3 = Engine.executeShow(S);
  ok(!res3.error, `王座交代戦が実行できること: ${res3.error || ''}`);
  S = res3.state;
  ok(S.titles.world.championId === challengerId, '王座が移動していること');
  ok(has(S.roster.find(f => f.id === champId), 'titleLoss'),
    'titleLoss が旧王者に残っていること');
  ok(historyOf(S.roster.find(f => f.id === challengerId)).filter(e => e.type === 'titleWin').length === 1,
    'titleWin が新王者に残っていること');
})();

// ══════════════════════════════════════════════════════════════════════════
//  A-4. retire — 自団体の全経路
// ══════════════════════════════════════════════════════════════════════════
(function commitRetirementsRecordsRetire() {
  let G = Engine.createInitialState(777, true);
  const victim = G.roster[0];
  const result = Engine.retirement.commitRetirements(G, [victim]);
  const retired = (result.state.retiredFighters || []).find(f => f.id === victim.id);
  ok(retired, '引退確定で retiredFighters に入ること');
  ok(has(retired, 'retire'), 'commitRetirements が retire を刻むこと');
  ok(!result.state.roster.some(f => f.id === victim.id), 'ロスターから抜けること');
})();

(function contractDepartureRetirementRecordsRetire() {
  // 契約満了/突発退団からの引退。以前ここだけ retire が積まれておらず、
  // 殿堂入りの在籍年数と称号の careerSeasons が壊れていた。
  let G = Engine.createInitialState(888, true);
  G = { ...G, season: 6, week: 40 };
  const victim = { ...G.roster[0], age: 30, wear: 90 };
  const origDetermine = Engine.contract.determineDeparture;
  Engine.contract.determineDeparture = () => ({ type: 'retire' });
  try {
    const rng = Engine.rng.create(1234);
    const out = Engine.contract.processDeparture(rng, victim, G, 'contractEnd');
    const retired = (out.state.retiredFighters || []).find(f => f.id === victim.id);
    ok(retired, '契約退団(引退)で retiredFighters に入ること');
    ok(has(retired, 'retire'), 'processDeparture(retire) が retire を刻むこと');
    assert.strictEqual(historyOf(retired).find(e => e.type === 'retire').season, 6);
    checks++;
    // 年代記アーカイブにも retire 付きで残っていること
    const arch = ((out.state.chronicle || {}).fighterArchive || []).find(a => a.id === victim.id);
    ok(arch, '年代記アーカイブにも残ること');
    ok((arch.careerRecord.history || []).some(e => e.type === 'retire'),
      'アーカイブ側の history にも retire が入っていること');
  } finally {
    Engine.contract.determineDeparture = origDetermine;
  }
})();

(function aiRetireesGetRetireEventBeforeHofJudgement() {
  // AI団体の引退者には retire がまったく積まれていなかった。
  // その結果 _buildEpithetContext の careerSeasons が常に 1 になり、
  // 「10年以上」系の称号が NPC殿堂入り選手に一度も出なかった。
  let G = Engine.createInitialState(999, true);
  const orgId = Object.keys(G.aiOrgs)[0];
  ok(orgId, 'AI団体が存在すること');
  const targetId = G.aiOrgs[orgId].roster[0].id;
  // 殿堂入り確実な戦績(タイトル戴冠+防衛)を積んでおく
  const fatHistory = [{ type: 'debut', season: 1, week: 1 }];
  for (let s = 2; s <= 12; s++) {
    fatHistory.push({ type: 'titleWin', season: s, week: 4, beltId: 'world' });
    fatHistory.push({ type: 'titleDefense', season: s, week: 20, beltId: 'world', count: 1 });
    fatHistory.push({ type: 'titleLoss', season: s, week: 40, beltId: 'world', defenses: 1 });
  }
  G = { ...G, season: 13, aiOrgs: { ...G.aiOrgs, [orgId]: { ...G.aiOrgs[orgId],
    roster: G.aiOrgs[orgId].roster.map(f => f.id === targetId
      ? { ...f, age: 34, careerRecord: { ...Engine.career.createRecord(), history: fatHistory, peakOVR: 85 } }
      : f) } } };
  const origCheck = Engine.rival.checkRetirement;
  Engine.rival.checkRetirement = (rng, f) => f.id === targetId;
  try {
    const rng = Engine.rng.create(4321);
    const out = Engine.rival.processSeasonEnd(rng, G);
    const inductees = (out.aiOrgs[orgId] || {})._npcInductees || [];
    const entry = inductees.find(h => h.id === targetId);
    ok(entry, 'AI引退者が殿堂入り判定にかかること');
    ok((entry.careerRecord.history || []).some(e => e.type === 'retire'),
      'NPC殿堂入りエントリの history に retire が入っていること');
    assert.ok(entry.activeSeasonsEnd >= 12,
      'retire から活動終了シーズンが引けていること');
    checks++;
  } finally {
    Engine.rival.checkRetirement = origCheck;
  }
})();

// ══════════════════════════════════════════════════════════════════════════
//  A-5. 受賞歴 — Engine.awards.recordAwardEvent
//       引退確定は表彰式より前に走る。ロスターしか見ないと引退年の受賞が消える。
// ══════════════════════════════════════════════════════════════════════════
(function recordAwardEventReachesEveryPool() {
  const base = {
    season: 7,
    roster: [{ id: 1, name: 'live', careerRecord: { history: [] } }],
    retiredFighters: [{ id: 2, name: 'retired', careerRecord: { history: [{ type: 'retire', season: 7 }] } }],
    aiOrgs: { org_s: { roster: [{ id: 3, name: 'npc', careerRecord: { history: [] } }] } },
    chronicle: { fighterArchive: [
      { id: 2, retiredSeason: 7, careerRecord: { history: [] } },
      { id: 2, retiredSeason: 3, careerRecord: { history: [] } },
    ] },
  };
  const evs = [
    { type: 'awardMVP', season: 7, week: 49 },
    { type: 'awardRookie', season: 7, week: 49 },
    { type: 'awardBestMatch', season: 7, week: 49, mq: 91 },
    { type: 'awardMedia', season: 7, week: 49 },
  ];
  let S = base;
  evs.forEach(ev => { S = Engine.awards.recordAwardEvent(S, [1, 2, 3], ev); });

  evs.forEach(ev => {
    ok(has(S.roster[0], ev.type), `${ev.type} が現役ロスターに積まれること`);
    ok(has(S.retiredFighters[0], ev.type),
      `${ev.type} が **引退者** に積まれること（引退した年の受賞が消えるバグの再発防止）`);
    ok(has(S.aiOrgs.org_s.roster[0], ev.type), `${ev.type} が AI団体ロスターに積まれること`);
    ok((S.chronicle.fighterArchive[0].careerRecord.history || []).some(e => e.type === ev.type),
      `${ev.type} が今季アーカイブ分の年代記エントリにも届くこと`);
    assert.strictEqual(
      (S.chronicle.fighterArchive[1].careerRecord.history || []).length, 0,
      '過去シーズンのアーカイブエントリ(出戻り前の記録)には積まないこと');
    checks++;
  });

  // 二重記録防止: 同じ賞を再度呼んでも増えない
  let T = S;
  evs.forEach(ev => { T = Engine.awards.recordAwardEvent(T, [1, 2, 3], ev); });
  assert.strictEqual(historyOf(T.roster[0]).length, evs.length,
    '同一年の同じ賞は二度積まれないこと（殿堂ポイントの二重加算防止）');
  checks++;

  // 受賞が殿堂ポイントに乗ること(配点は calcHofPoints のまま — ここでは「集計対象になる」ことだけ見る)
  const before = Engine.awards.calcHofPoints({ history: [{ type: 'debut', season: 7 }] });
  const after = Engine.awards.calcHofPoints({
    history: [{ type: 'debut', season: 7 }, ...evs] });
  ok(after > before, '受賞歴が殿堂ポイントの集計対象になっていること');
})();

// ══════════════════════════════════════════════════════════════════════════
//  A-6. ppvMainEvent — Engine.ppv（プレイヤー参加時 / TV観戦時の両方）
// ══════════════════════════════════════════════════════════════════════════
(function ppvRecordsSummitAppearance() {
  let G = Engine.createInitialState(2468, true);
  G = { ...G, season: 3, week: 47, orgPop: 60, ppvUnlocked: true };
  const rankings = G.rankings || [];
  const ppvEntries = {};
  RIVAL_ORGS.forEach(org => {
    const orgRank = rankings.find(r => r.orgId === org.id);
    const slots = Engine.ppv.getSlotCount(orgRank ? orgRank.rank : 4);
    const aiData = G.aiOrgs[org.id];
    ppvEntries[org.id] = aiData ? Engine.ppv.getAIEntries(aiData, slots) : [];
  });
  ppvEntries.player = (G.roster || []).filter(f => !f.injury && !f.isRental)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a)).slice(0, 4).map(f => ({ ...f }));
  G = { ...G, ppvEntries };

  const day = Engine.ppv.preparePPVDay(G);
  ok(day.card && day.card.length > 0, 'PPVカードが組めること');
  const summitIdx = day.card.findIndex(m => m.isSummit);
  ok(summitIdx >= 0, '頂上決戦(isSummit)がカードに含まれること');
  const results = day.card.map((match, idx) => {
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF3, idx, match.left.id));
    return Engine.ppv.simulatePPVMatch(match.left, match.right, rng);
  });
  // 引き分けだと記録されない仕様なので、引き分けなら左勝ちに寄せる
  if (results[summitIdx].winner === 'draw') results[summitIdx].winner = 'left';
  const applied = Engine.ppv.applyPPVResults(G, day.card, results, day.summitPair);
  const S = applied.state;
  const sm = day.card[summitIdx];
  const findAnywhere = id => (S.roster || []).find(f => f.id === id)
    || Object.values(S.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === id);
  [sm.left.id, sm.right.id].forEach(id => {
    const f = findAnywhere(id);
    ok(f, `頂上決戦出場者 ${id} が state のどこかに居ること`);
    ok(has(f, 'ppvMainEvent'),
      `ppvMainEvent が頂上決戦の出場者 ${id} に積まれること（勝者・敗者の両方）`);
  });
  const winnerId = results[summitIdx].winner === 'left' ? sm.left.id : sm.right.id;
  const winner = findAnywhere(winnerId);
  const wev = historyOf(winner).find(e => e.type === 'ppvMainEvent');
  assert.strictEqual(wev.won, true, '勝者の ppvMainEvent は won:true');
  assert.strictEqual(wev.isSummit, true, 'isSummit フラグが立つこと(殿堂加点の条件)');
  checks += 2;
})();

(function ppvTvModeRecordsSummitForAiOrgs() {
  let G = Engine.createInitialState(1357, true);
  G = { ...G, season: 3, week: 47, orgPop: 60, ppvUnlocked: true };
  const rng = Engine.rng.create(24680);
  const tv = Engine.ppv.simulateTVResults(G, rng);
  ok(tv && Array.isArray(tv.card), 'TV観戦のカードが返ること');
  const summitIdx = (tv.card || []).findIndex(m => m.isSummit);
  ok(summitIdx >= 0, 'TV観戦でも頂上決戦が組まれること');
  ok(tv.results[summitIdx].winner === 'draw' || tv.aiOrgs,
    'サミット決着時は aiOrgs パッチ(戦績反映)が返ること — これを捨てると AI 側の記録が消える');
  if (tv.aiOrgs) {
    const sm = tv.card[summitIdx];
    const all = Object.values(tv.aiOrgs).flatMap(o => o.roster || []);
    [sm.left.id, sm.right.id].forEach(id => {
      const f = all.find(x => x.id === id);
      if (!f) return; // プレイヤー所属なら対象外
      ok(has(f, 'ppvMainEvent'),
        'TV観戦(プレイヤー不参加)でも AI 側に ppvMainEvent が積まれること');
    });
  }
  // 呼び出し元が aiOrgs パッチを state に戻していること(戻さないと記録が消える)
  ok(/aiOrgs: tvResult\.aiOrgs \|\| G\.aiOrgs/.test(appSource),
    'app.js が simulateTVResults の aiOrgs を G に書き戻していること');
  // 注: auto-sim は simulateTVResults を MQ サンプリングにしか使わず state を捨てるため、
  //     WM_HOF_FIXTURE の集計では ppvMainEvent が常に 0 に見える。ハーネス側の制約。
})();

// ══════════════════════════════════════════════════════════════════════════
//  A-7. war（AI vs AI）— Engine 側で積まれること
// ══════════════════════════════════════════════════════════════════════════
(function aiWarRecordsWarEvent() {
  // AI同士の対抗戦は management.js 側で記録される。プレイヤーの対抗戦は
  // app.js 側にしかない(B-3 のガードで見張る)。
  const src = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
  ok(/type: 'war', season: s\.season, week: s\.week, opponentOrg, opponentName, won/.test(src),
    'AI団体同士の対抗戦で war が careerRecord に積まれる書き込みが残っていること');
})();

// ══════════════════════════════════════════════════════════════════════════
//  B. 経路ガード — app.js / ui-common.js にしか無い書き込み
//     （DOM 依存で node から実行できないが、消えると誰も気づかないので見張る）
// ══════════════════════════════════════════════════════════════════════════
const APP_ONLY_WRITE_SITES = [
  { type: 'debut(初期ドラフト)',   src: appSource,      re: /type: 'debut'.*via: 'draft'/ },
  { type: 'debut(FA契約)',         src: appSource,      re: /type: 'debut'.*via: 'freeagent'/ },
  { type: 'debut(スカウト)',       src: appSource,      re: /type: 'debut'.*via: 'scout'/ },
  { type: 'debut(スカウト/UI)',    src: uiCommonSource, re: /type: 'debut'.*via: 'scout'/ },
  { type: 'transfer(引き抜き交渉)', src: appSource,     re: /type: 'transfer'.*via: 'negotiate'/ },
  { type: 'war(自団体)',           src: appSource,      re: /type: 'war', season: G\.season/ },
  { type: 'domeMain',              src: appSource,      re: /type: 'domeMain', season: s\.season/ },
  { type: 'bigMatch',              src: appSource,      re: /type: 'bigMatch', season: s\.season/ },
];
APP_ONLY_WRITE_SITES.forEach(({ type, src, re }) => {
  ok(re.test(src), `${type} の careerRecord 書き込みが消えている`);
});

// 受賞歴は Engine.awards.recordAwardEvent 経由に一本化してある。
// ロスターだけを舐める旧実装に戻ると、引退した年の受賞がまた消える。
['awardRookie', 'awardMVP', 'awardMedia', 'awardBestMatch'].forEach(type => {
  ok(new RegExp(`type: '${type}'`).test(appSource), `${type} の授与記録が消えている`);
});
ok(/Engine\.awards\.recordAwardEvent\(/.test(appSource),
  '受賞歴は Engine.awards.recordAwardEvent で全プール(現役/AI/引退者/年代記)に配ること');
ok(!/const recordOnAllOrgs = /.test(appSource),
  'ロスターと AI 団体だけを更新する旧ヘルパー(recordOnAllOrgs)が復活している');
ok(/pendingAwards\.hallOfFame = Engine\.awards\.checkHallOfFame\(G\)/.test(appSource),
  '受賞を刻んだあとに殿堂入りエントリを作り直すこと(エントリは受賞前のスナップショット)');

// 引退記録の一本化。新しい引退経路を足したら ensureRetireEvent を通すこと。
const mgmtSource = fs.readFileSync(path.join(srcDir, 'management.js'), 'utf8');
ok(/ensureRetireEvent\(fighter, season, week, reason\)/.test(mgmtSource),
  'Engine.career.ensureRetireEvent が消えている');
ok((mgmtSource.match(/Engine\.career\.ensureRetireEvent\(/g) || []).length >= 3,
  'ensureRetireEvent の呼び出しが減っている(AI引退・AI怪我引退・契約退団の3経路)');

console.log(`career-record-integrity-test: OK (${checks} checks)`);
