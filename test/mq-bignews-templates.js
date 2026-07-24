#!/usr/bin/env node
// MQ再設計P4: 大ニュース記事(mqAllTimeRecord/mqTagRecord)の変数展開検証。
// 合成の記録更新イベント → Engine.mq.updateRecord(_pushRecordNews) → NEWS_HEADLINE_TEMPLATES
// 展開 まで通し、未置換の{変数}が残らないことを確認する軽量テスト。
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js',
].forEach(loadAsGlobal);

// ── §5.2: BIG_NEWS_TYPES はP4(記録2種)+P5(新設3種)の5種 ──
assert.strictEqual(BIG_NEWS_TYPES.size, 5, 'P5時点では5種(記録2種+ルーキー/ライバル/王者重傷)');
assert.ok(BIG_NEWS_TYPES.has('mqAllTimeRecord'));
assert.ok(BIG_NEWS_TYPES.has('mqTagRecord'));
assert.ok(BIG_NEWS_TYPES.has('hotProspectDebut'));
assert.ok(BIG_NEWS_TYPES.has('fatedRivals'));
assert.ok(BIG_NEWS_TYPES.has('topChampionInjury'));

// ── 変数展開ヘルパー(Engine.newspaper.generateのindustryEvents展開と同じ置換規則) ──
function expand(tpl, data) {
  const rep = (s) => {
    let out = s;
    Object.keys(data).forEach(k => {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), data[k] != null ? data[k] : '');
    });
    return out;
  };
  return { headline: rep(tpl.headline), body: rep(tpl.body) };
}

function assertNoResidualPlaceholders(label, text) {
  const residual = text.match(/\{[a-zA-Z0-9_]+\}/g);
  assert.strictEqual(residual, null, `${label}: 未置換の変数が残っている -> ${residual}`);
}

// ── 合成state: シングル記録更新(旗色鮮明な最小ロースター) ──
function buildSingleState() {
  return {
    orgName: 'テスト団体',
    season: 5, week: 20,
    roster: [{ id: 1, name: '勝者選手', pw: 90, sp: 90, te: 90, st: 90, mn: 90 }],
    aiOrgs: {
      org_s: { roster: [{ id: 2, name: '敗者選手', pw: 80, sp: 80, te: 80, st: 80, mn: 80 }] },
    },
    freeAgents: [], retiredFighters: [],
    mqRecord: Engine.mq.createRecord(Engine.mq.SINGLE_RECORD_START),
  };
}

function buildTagState() {
  return {
    orgName: 'テスト団体',
    season: 6, week: 11,
    roster: [
      { id: 10, name: 'エース選手', pw: 95, sp: 95, te: 95, st: 95, mn: 95 },
      { id: 11, name: '相方選手', pw: 70, sp: 70, te: 70, st: 70, mn: 70 },
    ],
    aiOrgs: {
      org_a: { roster: [
        { id: 12, name: '敗者選手1', pw: 80, sp: 80, te: 80, st: 80, mn: 80 },
        { id: 13, name: '敗者選手2', pw: 80, sp: 80, te: 80, st: 80, mn: 80 },
      ] },
    },
    freeAgents: [], retiredFighters: [],
    mqRecordTag: Engine.mq.createRecord(Engine.mq.TAG_RECORD_START),
  };
}

// ── mqAllTimeRecord: 全stage分岐(STAGE_LABELS)で展開検証 ──
Object.keys(Engine.mq.STAGE_LABELS).forEach(stage => {
  const state = buildSingleState();
  const result = Engine.mq.updateRecord(state, { mq: state.mqRecord.value + 10 }, {
    holderIds: [1, 2], orgId: 'player', stage, matchType: 'singles', winnerId: 1,
  });
  assert.strictEqual(result.updated, true, `stage=${stage}: 記録更新が成立すること`);
  const events = result.state._industryNewsEvents || [];
  assert.strictEqual(events.length, 1, `stage=${stage}: news event が1件積まれること`);
  const ev = events[0];
  assert.strictEqual(ev.type, 'mqAllTimeRecord');
  assert.strictEqual(ev.data.name, '勝者選手');
  assert.strictEqual(ev.data.name2, '敗者選手');
  assert.strictEqual(ev.data.orgName, 'テスト団体');
  assert.strictEqual(ev.data.stage, Engine.mq.STAGE_LABELS[stage]);
  NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord.forEach((tpl, idx) => {
    const { headline, body } = expand(tpl, ev.data);
    assertNoResidualPlaceholders(`mqAllTimeRecord[${idx}] stage=${stage} headline`, headline);
    assertNoResidualPlaceholders(`mqAllTimeRecord[${idx}] stage=${stage} body`, body);
  });
});

// ── mqTagRecord: エース優先充填規則(nameA1=勝者組OVR上位)の検証込み ──
{
  const state = buildTagState();
  const result = Engine.mq.updateRecord(state, { mq: state.mqRecordTag.value + 10 }, {
    holderIds: [10, 11, 12, 13], orgId: null, stage: 'springTag', matchType: 'tag',
    winnerIds: [11, 10], // あえて相方→エースの順で渡し、ソートで復元されるか確認
  });
  assert.strictEqual(result.updated, true, 'タッグ記録更新が成立すること');
  const events = result.state._industryNewsEvents || [];
  assert.strictEqual(events.length, 1, 'タッグ news event が1件積まれること');
  const ev = events[0];
  assert.strictEqual(ev.type, 'mqTagRecord');
  assert.deepStrictEqual(ev.characterIds, [10, 11], 'characterIds はOVR上位(エース)が先頭');
  assert.strictEqual(ev.data.nameA1, 'エース選手', '{nameA1}=勝者組OVR上位');
  assert.strictEqual(ev.data.nameA2, '相方選手');
  assert.ok(ev.data.nameB1 === '敗者選手1' || ev.data.nameB1 === '敗者選手2');
  assert.ok(ev.data.nameB2 === '敗者選手1' || ev.data.nameB2 === '敗者選手2');
  NEWS_HEADLINE_TEMPLATES.mqTagRecord.forEach((tpl, idx) => {
    const { headline, body } = expand(tpl, ev.data);
    assertNoResidualPlaceholders(`mqTagRecord[${idx}] headline`, headline);
    assertNoResidualPlaceholders(`mqTagRecord[${idx}] body`, body);
    // ｜区切りは本文中に必ず1回以上存在する(2段落構成の前提)
    assert.ok(tpl.body.includes('｜'), `mqTagRecord[${idx}]: ｜段落区切りが必須`);
  });
}

// ── 号外リード文言(BIG_NEWS_LEAD_LINES)の{mq}展開検証 ──
['mqAllTimeRecord', 'mqTagRecord'].forEach(type => {
  const lines = BIG_NEWS_LEAD_LINES[type];
  assert.ok(Array.isArray(lines) && lines.length === 2, `${type}: 号外リードは2バリエーション`);
  lines.forEach((line, idx) => {
    const filled = line.replace(/\{mq\}/g, '123');
    assertNoResidualPlaceholders(`${type} lead[${idx}]`, filled);
  });
});

// ── 記録未更新(value以下)では記事が積まれないこと ──
{
  const state = buildSingleState();
  const result = Engine.mq.updateRecord(state, { mq: state.mqRecord.value - 1 }, {
    holderIds: [1, 2], orgId: 'player', stage: 'normal', matchType: 'singles', winnerId: 1,
  });
  assert.strictEqual(result.updated, false);
  assert.strictEqual((result.state._industryNewsEvents || []).length, 0);
}

// ── winnerId不明(ドロー等)では数値記録のみ更新され、記事は積まれない(静かにスキップ) ──
{
  const state = buildSingleState();
  const result = Engine.mq.updateRecord(state, { mq: state.mqRecord.value + 5 }, {
    holderIds: [1, 2], orgId: 'player', stage: 'normal', matchType: 'singles', winnerId: null,
  });
  assert.strictEqual(result.updated, true, '数値記録自体は更新されること');
  assert.strictEqual((result.state._industryNewsEvents || []).length, 0, 'winnerId不明時は記事化しない');
}

// ── §5.4 P5: hotProspectDebut/fatedRivals/topChampionInjury の変数展開検証 ──
// (テンプレ文字列そのものは正本のまま。合成データでの{変数}展開・未置換なしのみ検証)

['白星', '黒星'].forEach(result => {
  const data = { name: '新人選手', orgName: 'テスト団体', age: 17, result };
  NEWS_HEADLINE_TEMPLATES.hotProspectDebut.forEach((tpl, idx) => {
    const { headline, body } = expand(tpl, data);
    assertNoResidualPlaceholders(`hotProspectDebut[${idx}] result=${result} headline`, headline);
    assertNoResidualPlaceholders(`hotProspectDebut[${idx}] result=${result} body`, body);
  });
});

// fatedRivals: 別団体ケース + 同一団体ケース({orgName2}→「同門」置換は実装側の責務)
[
  { orgName: 'テスト団体', orgName2: 'ライバル団体' },
  { orgName: 'テスト団体', orgName2: '同門' },
].forEach(({ orgName, orgName2 }) => {
  const data = { name: '逸材A', name2: '逸材B', orgName, orgName2, age: 18 };
  NEWS_HEADLINE_TEMPLATES.fatedRivals.forEach((tpl, idx) => {
    const { headline, body } = expand(tpl, data);
    assertNoResidualPlaceholders(`fatedRivals[${idx}] orgName2=${orgName2} headline`, headline);
    assertNoResidualPlaceholders(`fatedRivals[${idx}] orgName2=${orgName2} body`, body);
  });
});

{
  const data = { name: '王者選手', orgName: 'テスト団体', titleName: 'テスト団体王座', weeks: 7 };
  NEWS_HEADLINE_TEMPLATES.topChampionInjury.forEach((tpl, idx) => {
    const { headline, body } = expand(tpl, data);
    assertNoResidualPlaceholders(`topChampionInjury[${idx}] headline`, headline);
    assertNoResidualPlaceholders(`topChampionInjury[${idx}] body`, body);
  });
}

// ── 号外リード文言(BIG_NEWS_LEAD_LINES) P5新設3種 ──
['hotProspectDebut', 'fatedRivals', 'topChampionInjury'].forEach(type => {
  const lines = BIG_NEWS_LEAD_LINES[type];
  assert.ok(Array.isArray(lines) && lines.length === 2, `${type}: 号外リードは2バリエーション`);
  lines.forEach((line, idx) => {
    const filled = line.replace(/\{mq\}/g, '123').replace(/\{orgName\}/g, 'テスト団体').replace(/\{titleName\}/g, 'テスト団体王座');
    assertNoResidualPlaceholders(`${type} lead[${idx}]`, filled);
  });
});

// ── §5.1/§5.4 P5: registerBignewsHire → scanBignewsDebuts の発火経路検証 ──
function makeRookie(id, name, age, tcAvg, extra = {}) {
  return {
    id, name, age,
    wins: 0, losses: 0, draws: 0, careerSeasons: 0,
    trainCap: { pw: tcAvg, sp: tcAvg, te: tcAvg, st: tcAvg, mn: tcAvg },
    ...extra,
  };
}

// A) trainCapOVR>=125の新人 → フラグが立ち、初勝利でhotProspectDebutが発火し、フラグは消費される
{
  let state = { orgName: 'テスト団体', season: 1, week: 3, roster: [], aiOrgs: {}, freeAgents: [], retiredFighters: [] };
  const rookie = makeRookie(101, '大型新人', 17, 128);
  const reg = Engine.mq.registerBignewsHire(state, rookie);
  state = reg.state;
  assert.strictEqual(reg.fighter._bignewsProspect, true, 'tcOvr128の新人はフラグが立つこと');
  state = { ...state, roster: [reg.fighter] };

  // まだ初試合前(wins=0)なのでスキャンしても発火しない
  state = Engine.mq.scanBignewsDebuts(state);
  assert.strictEqual((state._industryNewsEvents || []).length, 0, '初試合前は発火しない');

  // 初勝利
  state = { ...state, roster: [{ ...state.roster[0], wins: 1, lastMatchResult: 'win' }] };
  state = Engine.mq.scanBignewsDebuts(state);
  const events = state._industryNewsEvents || [];
  assert.strictEqual(events.length, 1, 'デビュー戦(初勝利)でhotProspectDebutが1件発火');
  assert.strictEqual(events[0].type, 'hotProspectDebut');
  assert.strictEqual(events[0].data.name, '大型新人');
  assert.strictEqual(events[0].data.result, '白星');
  assert.strictEqual(state.roster[0]._bignewsProspect, undefined, '発火後はフラグが消費される');

  // 同じ選手が次週また勝っても再発火しない
  state = { ...state, _industryNewsEvents: [], roster: [{ ...state.roster[0], wins: 2 }] };
  state = Engine.mq.scanBignewsDebuts(state);
  assert.strictEqual((state._industryNewsEvents || []).length, 0, 'フラグ消費後は再発火しない');
}

// B) 経験者(wins>0またはcareerSeasons>0)はtcOvrが高くてもフラグが立たない(既存ロスターの誤検知防止ガード)
{
  const state = { orgName: 'テスト団体', season: 1, week: 1 };
  const veteranByWins = makeRookie(102, '中堅選手', 25, 130, { wins: 3 });
  const veteranByCareer = makeRookie(103, 'ベテラン選手', 28, 130, { careerSeasons: 5 });
  assert.strictEqual(Engine.mq.registerBignewsHire(state, veteranByWins).fighter._bignewsProspect, undefined, 'wins>0はフラグなし');
  assert.strictEqual(Engine.mq.registerBignewsHire(state, veteranByCareer).fighter._bignewsProspect, undefined, 'careerSeasons>0はフラグなし');
}

// C) fatedRivals: 同年代(age diff<=1)・tcOvr>=117の2人が揃うとペア形成され、後発デビュー戦で発火する
{
  let state = { orgName: 'テスト団体', season: 2, week: 1, roster: [], aiOrgs: { org_s: { roster: [] } }, freeAgents: [], retiredFighters: [] };

  // 1人目(プレイヤー団体、tcOvr120): まだ相方がいないのでプールに積まれるのみ
  const first = makeRookie(201, '逸材A', 18, 120);
  let reg = Engine.mq.registerBignewsHire(state, first);
  state = reg.state;
  state = { ...state, roster: [reg.fighter] };
  assert.strictEqual(reg.fighter._fatedRivalPartnerId, undefined, '1人目はペア相手がいない');
  assert.strictEqual((state._fatedTalentPool || []).length, 1, '1人目はプールに積まれる');

  // 2人目(AI団体・org_s、tcOvr118、年齢差1): ペア形成され、_fatedRivalPartnerIdが1人目を指す
  const second = makeRookie(202, '逸材B', 19, 118);
  reg = Engine.mq.registerBignewsHire(state, { ...second, orgId: 'org_s' });
  state = reg.state;
  state = { ...state, aiOrgs: { org_s: { roster: [reg.fighter] } } };
  assert.strictEqual(reg.fighter._fatedRivalPartnerId, 201, '2人目は1人目とペア形成される');
  assert.strictEqual((state._fatedTalentPool || []).length, 0, 'ペア形成後はプールが空になる');

  // 2人目のデビュー戦(初勝利) → fatedRivals発火。別団体なのでorgName2はライバル団体名のまま
  state = { ...state, aiOrgs: { org_s: { roster: [{ ...state.aiOrgs.org_s.roster[0], wins: 1, lastMatchResult: 'win' }] } } };
  state = Engine.mq.scanBignewsDebuts(state);
  const events = (state._industryNewsEvents || []).filter(e => e.type === 'fatedRivals');
  assert.strictEqual(events.length, 1, 'fatedRivalsが1件発火');
  assert.strictEqual(events[0].data.name, '逸材B', '{name}は後発(発火者)側');
  assert.strictEqual(events[0].data.name2, '逸材A', '{name2}は先発(相方)側');
  assert.notStrictEqual(events[0].data.orgName2, '同門', '別団体ペアは「同門」置換されない');
  assert.strictEqual(state.aiOrgs.org_s.roster[0]._fatedRivalPartnerId, undefined, '発火後はフラグが消費される');
}

// D) fatedRivals: 同一団体ペアは{orgName2}が「同門」に置換される
{
  let state = { orgName: 'テスト団体', season: 3, week: 1, roster: [], aiOrgs: {}, freeAgents: [], retiredFighters: [] };
  const first = makeRookie(301, '同門逸材A', 17, 122);
  let reg = Engine.mq.registerBignewsHire(state, first);
  state = { ...reg.state, roster: [reg.fighter] };
  const second = makeRookie(302, '同門逸材B', 17, 119);
  reg = Engine.mq.registerBignewsHire(state, second);
  state = { ...reg.state, roster: [...state.roster, reg.fighter] };
  assert.strictEqual(reg.fighter._fatedRivalPartnerId, 301, '同一団体でもペア形成される');

  state = { ...state, roster: state.roster.map(f => f.id === 302 ? { ...f, wins: 1, lastMatchResult: 'win' } : f) };
  state = Engine.mq.scanBignewsDebuts(state);
  const events = (state._industryNewsEvents || []).filter(e => e.type === 'fatedRivals');
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].data.orgName2, '同門', '同一団体ペアは{orgName2}が「同門」に置換される');
}

// E) fatedRivals: 年1回まで(同年に複数ペア成立なら最初の1組のみ)
{
  let state = { orgName: 'テスト団体', season: 4, week: 1, roster: [], aiOrgs: {}, freeAgents: [], retiredFighters: [] };
  const ids = [401, 402, 403, 404];
  const names = ['C1', 'C2', 'C3', 'C4'];
  ids.forEach((id, i) => {
    const reg = Engine.mq.registerBignewsHire(state, makeRookie(id, names[i], 17, 120));
    state = { ...reg.state, roster: [...state.roster, reg.fighter] };
  });
  // 402は401とペア形成、404は403とのペアが同年内では2組目のため見送られプールに残るはず
  const f402 = state.roster.find(f => f.id === 402);
  const f404 = state.roster.find(f => f.id === 404);
  assert.strictEqual(f402._fatedRivalPartnerId, 401, '同年1組目のペアは形成される');
  assert.strictEqual(f404._fatedRivalPartnerId, undefined, '同年2組目はペア形成が見送られる(年1回まで)');
  assert.ok((state._fatedTalentPool || []).some(p => p.id === 403), '見送られた側はプールに残り翌年以降に持ち越せる');
}

// F) topChampionInjury: ランキング1/2位の団体の王者が新規に重傷を負った週にのみ発火する
{
  const champ = { id: 501, name: '王者選手', injury: { type: '重傷', weeksLeft: 7 } };
  const baseState = {
    orgName: 'テスト団体', season: 5, week: 10,
    roster: [champ], aiOrgs: { org_s: { roster: [], titles: { world: { championId: null } } } },
    titles: { world: { championId: 501 } },
    rankings: [{ orgId: 'player', rank: 1 }, { orgId: 'org_s', rank: 2 }],
  };
  const snapshotHealthy = Engine.mq.snapshotChampionInjuries({ ...baseState, roster: [{ ...champ, injury: null }] });
  const result = Engine.mq.checkTopChampionInjury(baseState, snapshotHealthy);
  const events = (result._industryNewsEvents || []).filter(e => e.type === 'topChampionInjury');
  assert.strictEqual(events.length, 1, '新規の重傷は発火する');
  assert.strictEqual(events[0].data.name, '王者選手');
  assert.strictEqual(events[0].data.weeks, 7);
  assert.strictEqual(events[0].data.titleName, 'テスト団体王座');

  // 継続中(前週スナップショットも既に重傷)は再発火しない
  const snapshotAlreadyInjured = Engine.mq.snapshotChampionInjuries(baseState);
  const result2 = Engine.mq.checkTopChampionInjury(baseState, snapshotAlreadyInjured);
  assert.strictEqual((result2._industryNewsEvents || []).length, 0, '継続中の重傷は再発火しない');

  // ランキング3位以下の団体の王者が重傷でも発火しない
  const lowRankState = { ...baseState, rankings: [{ orgId: 'player', rank: 3 }, { orgId: 'org_s', rank: 4 }] };
  const result3 = Engine.mq.checkTopChampionInjury(lowRankState, snapshotHealthy);
  assert.strictEqual((result3._industryNewsEvents || []).length, 0, '3位以下の団体は対象外');
}

console.log('mq-bignews-templates: ALL CLEAR (types=5, stages=' + Object.keys(Engine.mq.STAGE_LABELS).length + ', variants OK)');
