#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/faction-rivalry-resolution-notice-test.js — 派閥抗争の決着の見せ方(2026-09-26 第5回 問11
//  「派閥の抗争の決着は、新聞とログに1行で見せる」)と、関連する表示の不具合2つの回帰ガード
//
//  ■ 何を守るか
//    1. 先取100の決着(POINTS)の週に、業界ニュース factionRivalryDecided(勝ったリーダーの一言つき)と
//       週のログ faction_rivalry_decided.points が1本ずつ出る。一言は FACTION_RIVALRY_VICTORY_LINES から
//       口調×性格で引く(欠けた性格は同じ口調の normal)。モーダルは出さない(エンジンは何も待たない)
//       派閥の消滅で終わった記録(CONSOLATION・先取100の時点で片方が消えていた POINTS)はログ1行だけ。
//       自然沈静化(CALM)は何も出さない。文面に数値・内部名を出さない。JA/EN の両方で組める
//    2. 派閥画面の抗争の年表の RIVALRY_CLOSED に reason の内部名(POINTS/CALM/CONSOLATION/F06_RECONCILE)を出さない
//    3. 新聞の次回展望の因縁ペア(Engine.newspaper.pickPreviewRivalry)が空にならない
//       (以前は因縁の記録のキー「小さいID-大きいID」を '>' で割って文字列のまま比べ、段は記録に無い riv.tier を読んでいた)
//
//  ■ 使い方
//    node test/faction-rivalry-resolution-notice-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { readSource } = require('./helpers/source.js');
const { loadEngines, advanceUntil } = require('./ui-walkthrough/fixtures/headless-sim');

loadEngines();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n        ') : e)); }
}

const F = Engine.factions;
const CFG = FACTION_CONFIG;
const clone = (x) => JSON.parse(JSON.stringify(x));
const JA_RE = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
const DIGIT_RE = /[0-9０-９]/;
const INTERNAL_RE = /POINTS|CALM|CONSOLATION|F06_RECONCILE|FORCE_CLOSE/;
const TABLE = typeof FACTION_RIVALRY_VICTORY_LINES !== 'undefined' ? FACTION_RIVALRY_VICTORY_LINES : null;

// 実在の選手(EN の名前辞書を通すため)。口調×性格を指定して選ぶ
function pickChar(archetype, personality, exclude = []) {
  const c = ALL_CHARS.find(x => x.archetype === archetype && x.personality === personality && !exclude.includes(x.id));
  if (!c) throw new Error(`no char ${archetype}/${personality}`);
  return c;
}
// 派閥名は createFaction と同じ「{姓}派」(姓は選手の surname。無ければ名前)
function factionNameOf(c) { return `${c.surname || c.name}派`; }
function fighter(c, extra = {}) {
  return { id: c.id, name: c.name, archetype: c.archetype, personality: c.personality, popularity: 40, trust: 60, traits: [], role: 'Face', pw: 60, sp: 60, te: 60, st: 60, mn: 60, ...extra };
}

// 派閥1(勝者)のリーダーは cool×quiet、派閥2(敗者)のリーダーは standard×normal。抗争ポイント 100—62
function pointsState(opts = {}) {
  const winC = opts.winChar || pickChar('cool', 'quiet');
  const loseC = opts.loseChar || pickChar('standard', 'normal', [winC.id]);
  const others = ALL_CHARS.filter(c => c.id !== winC.id && c.id !== loseC.id).slice(0, 4);
  const roster = [fighter(winC), fighter(others[0]), fighter(others[1]), fighter(loseC), fighter(others[2]), fighter(others[3])];
  const winName = factionNameOf(winC);
  const loseName = factionNameOf(loseC);
  return {
    season: 3, week: 10, offSeason: false, offWeek: 0, rngSeed: 42, orgName: opts.orgName === undefined ? 'テスト団体' : opts.orgName,
    roster, relationships: {},
    factions: [
      { id: 1, name: winName, leaderId: winC.id, memberIds: [winC.id, others[0].id, others[1].id], status: 'active', type: 'rivalrous', momentum: 10, createdSeason: 1, createdWeek: 5 },
      { id: 2, name: loseName, leaderId: loseC.id, memberIds: [loseC.id, others[2].id, others[3].id], status: 'active', type: 'rivalrous', momentum: 10, createdSeason: 1, createdWeek: 8 },
    ],
    factionHostility: { '1>2': 70, '2>1': 60 },
    factionRivalryPoints: { '1-2': { factionAId: 1, factionBId: 2, pointsA: CFG.pointsResolutionThreshold, pointsB: 62, startedSeason: 2, startedWeek: 30, naturalCalmStreak: 0 } },
    factionEventCooldowns: {}, factionTimeline: [],
    _winC: winC, _loseC: loseC,
  };
}

console.log('派閥抗争の決着の見せ方(第5回 問11)・年表の決着の言葉・次回展望の因縁ペア 回帰ガード');

section('1. 先取100: 業界ニュース factionRivalryDecided(勝ったリーダーの一言)とログ1行を組む', () => {
  assert.ok(TABLE, 'FACTION_RIVALRY_VICTORY_LINES が無い');
  assert.strictEqual(typeof F.buildRivalryResolutionNotice, 'function', 'Engine.factions.buildRivalryResolutionNotice が無い');
  const s = pointsState();
  const r = F.checkRivalryResolution(s, null);
  assert.ok(r.resolved && r.reason === 'POINTS', JSON.stringify({ resolved: r.resolved, reason: r.reason }));
  const n = F.buildRivalryResolutionNotice(r.state, r, Engine.rng.create(7));
  assert.ok(n.news, '記事が出ていない');
  assert.strictEqual(n.news.type, 'factionRivalryDecided');
  assert.strictEqual(n.news.characterId, s._winC.id, '記事の人物は勝った派閥のリーダー');
  const d = n.news.data;
  assert.strictEqual(d.winFaction, s.factions[0].name);
  assert.strictEqual(d.loseFaction, s.factions[1].name);
  assert.strictEqual(d.winLeader, s._winC.name);
  assert.strictEqual(d.loseLeader, s._loseC.name);
  assert.strictEqual(d.org, 'テスト団体');
  assert.strictEqual(d.quoteLine, TABLE.cool.quiet[0], 'cool×quiet の一言を引いていない');
  assert.deepStrictEqual(n.log, { type: 'faction_rivalry_decided', data: { variant: 'points', winFaction: s.factions[0].name, loseFaction: s.factions[1].name } });
});

section('2. 一言の口調×性格: 欠けた性格は同じ口調の normal、どの口調×性格でも空にならない', () => {
  const pers = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];
  const archs = ['standard', 'ojousama', 'cool', 'delinquent', 'polite', 'composed', 'seductive'];
  archs.forEach(a => pers.forEach(p => {
    const line = F.getFactionLine(TABLE, { archetype: a, personality: p }, Engine.rng.create(1));
    assert.ok(line, `${a}×${p} の一言が空`);
    const expect = (TABLE[a] && (TABLE[a][p] || TABLE[a].normal)) || TABLE.standard[p] || TABLE.standard.normal;
    assert.ok(expect.includes(line), `${a}×${p} が口調を保っていない: ${line}`);
  }));
  // 粒度(F06_FORCE と同じ): 標準は7性格、ほかの6口調は2つずつ、各1行
  assert.strictEqual(Object.keys(TABLE.standard).length, 7);
  archs.filter(a => a !== 'standard').forEach(a => assert.strictEqual(Object.keys(TABLE[a]).length, 2, a));
  const all = [].concat(...archs.map(a => [].concat(...Object.values(TABLE[a]))));
  assert.strictEqual(all.length, 19, `一言の本数 ${all.length}`);
  all.forEach(line => {
    assert.ok(!DIGIT_RE.test(line), `一言に数字: ${line}`);
    assert.ok(!/[{}]/.test(line), `一言にプレースホルダ: ${line}`);
    assert.ok(/[。！？]$/.test(line), `一言の終わりが句点でない(EN の本文は一言の句読点で文を閉じる): ${line}`);
  });
});

section('3. 派閥の消滅で終わった記録はログ1行だけ / 自然沈静化・和解・決着なしは何も出さない', () => {
  // CONSOLATION: 派閥2が消えている
  const s = pointsState();
  const gone = { ...s, factions: [s.factions[0]], factionRivalryPoints: { '1-2': { ...s.factionRivalryPoints['1-2'], pointsA: 30 } } };
  const r = F.checkRivalryResolution(gone, null);
  assert.strictEqual(r.reason, 'CONSOLATION');
  assert.strictEqual(r.survivorFactionId, 1);
  const n = F.buildRivalryResolutionNotice(r.state, r, Engine.rng.create(1));
  assert.strictEqual(n.news, null, 'CONSOLATION に記事が出た');
  assert.deepStrictEqual(n.log, { type: 'faction_rivalry_decided', data: { variant: 'consolation', factionName: s.factions[0].name } });
  // 先取100の時点で片方(勝った側)が消えていた POINTS も同じ扱い(効果が入らないので勝ち名乗りの記事は出さない)
  const gone2 = { ...s, factions: [s.factions[1]] };
  const r2 = F.checkRivalryResolution(gone2, null);
  assert.strictEqual(r2.reason, 'POINTS');
  assert.strictEqual(r2.survivorFactionId, 2);
  const n2 = F.buildRivalryResolutionNotice(r2.state, r2, Engine.rng.create(1));
  assert.strictEqual(n2.news, null);
  assert.strictEqual(n2.log.data.variant, 'consolation');
  assert.strictEqual(n2.log.data.factionName, s.factions[1].name);
  // CALM
  const calm = { ...s, factionHostility: { '1>2': 5, '2>1': 5 }, factionRivalryPoints: { '1-2': { ...s.factionRivalryPoints['1-2'], pointsA: 10, naturalCalmStreak: CFG.pointsNaturalCalmWeeks - 1 } } };
  const r3 = F.checkRivalryResolution(calm, null);
  assert.strictEqual(r3.reason, 'CALM');
  assert.deepStrictEqual(F.buildRivalryResolutionNotice(r3.state, r3, Engine.rng.create(1)), { news: null, log: null });
  // 決着なし・F06_RECONCILE(画面側で factionReconcile を出す)
  assert.deepStrictEqual(F.buildRivalryResolutionNotice(s, { resolved: false, reason: null }, null), { news: null, log: null });
  assert.deepStrictEqual(F.buildRivalryResolutionNotice(s, { resolved: true, reason: 'F06_RECONCILE' }, null), { news: null, log: null });
  // 勝ったリーダーが所属していない(整合の崩れた状態)ときは記事を出さずログだけ
  const noLeader = { ...r.state };
  const rp = F.checkRivalryResolution(s, null);
  const st = { ...rp.state, roster: rp.state.roster.filter(c => c.id !== s._winC.id) };
  const n4 = F.buildRivalryResolutionNotice(st, rp, Engine.rng.create(1));
  assert.strictEqual(n4.news, null);
  assert.strictEqual(n4.log.data.variant, 'points');
  void noLeader;
});

section('4. 紙面の組み立て(JA): 一言を「」で引用・名前が入る・数値と内部名が出ない', () => {
  const s = pointsState();
  const r = F.checkRivalryResolution(s, null);
  const ev = F.buildRivalryResolutionNotice(r.state, r, Engine.rng.create(3)).news;
  const data = _wmResolvePreformattedIndustryData(ev, WM_I18N.t);
  assert.strictEqual(data.quote, `「${ev.data.quoteLine}」`);
  const tpls = NEWS_HEADLINE_TEMPLATES.factionRivalryDecided;
  assert.ok(Array.isArray(tpls) && tpls.length >= 1, 'NEWS_HEADLINE_TEMPLATES.factionRivalryDecided が無い');
  assert.ok(Engine.newspaper.PRIORITY.factionRivalryDecided > Engine.newspaper.PRIORITY.playerShowNormal, '優先度が一般試合より下');
  tpls.forEach((tpl, i) => {
    const h = _wmFillWithDict(WM_I18N.t, tpl.headline, data);
    const b = _wmFillWithDict(WM_I18N.t, tpl.body, data);
    assert.ok(!/[{}]/.test(h + b), `#${i} 未充填: ${h} / ${b}`);
    assert.ok(h.includes(s.factions[0].name) && h.includes(s.factions[1].name), `#${i} 見出しに派閥名が無い: ${h}`);
    assert.ok(b.includes(`「${ev.data.quoteLine}」`), `#${i} 本文に一言が無い: ${b}`);
    assert.ok(b.includes(s._winC.name) && b.includes(s._loseC.name), `#${i} 本文にリーダー名が無い`);
    assert.ok(!DIGIT_RE.test(h + b), `#${i} 数値が出ている: ${h} / ${b}`);
    assert.ok(!INTERNAL_RE.test(h + b), `#${i} 内部名が出ている`);
  });
  // ログ(JA)
  const log = F.buildRivalryResolutionNotice(r.state, r, null).log;
  assert.strictEqual(gameLogEntryText({ ...log, s: 3, w: 10 }), `⚔ 派閥抗争に決着: ${s.factions[0].name}が${s.factions[1].name}を制した`);
  assert.strictEqual(gameLogEntryText({ type: 'faction_rivalry_decided', data: { variant: 'consolation', factionName: '根岸派' }, s: 3, w: 10 }),
    '⚔ 根岸派の抗争は、相手の派閥の消滅で終わった');
  assert.deepStrictEqual(GAMELOG_TYPE_CATEGORY.faction_rivalry_decided, ['event']);
});

section('5. EN: 記事・ログ・年表の言葉・一言19本が英語で組め、日本語が残らない', () => {
  const srcDir = path.join(__dirname, '..', 'src');
  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  ['i18n.js', 'lang-en.js', 'lang-en-templates.js', 'lang-en-dialogue.js', 'lang-en-names.js'].forEach(f => {
    new vm.Script(fs.readFileSync(path.join(srcDir, f), 'utf8'), { filename: f }).runInContext(sandbox);
  });
  const EN = sandbox.WM_I18N;
  EN.setLang('en');
  const jaI18n = global.WM_I18N;
  const s = pointsState({ orgName: '' });  // 団体名が空の回は「プレイヤー団体」の既訳へ落ちる
  const r = F.checkRivalryResolution(s, null);
  const n = F.buildRivalryResolutionNotice(r.state, r, Engine.rng.create(3));
  global.WM_I18N = EN;   // 派閥名の表示(_factionDisplayName)とログの整形は実行時の WM_I18N を読む
  try {
    const data = _wmResolvePreformattedIndustryData(n.news, EN.t);
    NEWS_HEADLINE_TEMPLATES.factionRivalryDecided.forEach((tpl, i) => {
      const h = EN.t(tpl.headline, data);
      const b = EN.t(tpl.body, data);
      assert.ok(!JA_RE.test(h) && !JA_RE.test(b), `#${i} EN に日本語: ${h} / ${b}`);
      assert.ok(!/[{}]/.test(h + b), `#${i} EN 未充填: ${b}`);
      assert.ok(/Group/.test(h), `#${i} EN 見出しに派閥名(Group)が無い: ${h}`);
      assert.ok(b.includes(EN.t(n.news.data.quoteLine)), `#${i} EN 本文に一言の訳が無い: ${b}`);
      assert.ok(!DIGIT_RE.test(h + b), `#${i} EN 数値が出ている`);
    });
    const log = gameLogEntryText({ ...n.log, s: 3, w: 10 });
    assert.ok(!JA_RE.test(log) && /Group/.test(log), `EN ログ: ${log}`);
    const log2 = gameLogEntryText({ type: 'faction_rivalry_decided', data: { variant: 'consolation', factionName: s.factions[0].name }, s: 3, w: 10 });
    assert.ok(!JA_RE.test(log2) && /Group/.test(log2), `EN ログ(consolation): ${log2}`);
    const allLines = [].concat(...Object.values(TABLE).map(byP => [].concat(...Object.values(byP))));
    allLines.forEach(line => {
      const en = EN.t(line);
      assert.ok(en !== line && !JA_RE.test(en), `一言の EN が無い: ${line} => ${en}`);
      assert.ok(en.length <= 110, `一言の EN が吹き出しの長さを超える(${en.length}): ${en}`);
    });
    ['ポイント先取で決着', '抗争の幕引き', '自然沈静化', '派閥消滅で終結', '決着'].forEach(k => {
      const en = EN.t(k);
      assert.ok(en !== k && !JA_RE.test(en), `年表の言葉の EN が無い: ${k}`);
    });
  } finally {
    global.WM_I18N = jaI18n;
  }
});

section('6. tickWeek: 先取100の週に業界ニュースとログ1行が入る(表示だけ・モーダルの待ちは立てない)', () => {
  const base = advanceUntil({ seed: 42, until: g => g.season === 2 && g.week === 6 && g.weekPhase === 'manage' && !g.offSeason });
  const pool = base.roster.filter(c => !c.isRental);
  assert.ok(pool.length >= 6);
  const [w1, w2, w3, l1, l2, l3] = pool;
  let G = {
    ...base,
    factions: [
      { id: 1, name: factionNameOf(w1), leaderId: w1.id, memberIds: [w1.id, w2.id, w3.id], status: 'active', type: 'rivalrous', momentum: 10, createdSeason: 1, createdWeek: 5 },
      { id: 2, name: factionNameOf(l1), leaderId: l1.id, memberIds: [l1.id, l2.id, l3.id], status: 'active', type: 'rivalrous', momentum: 10, createdSeason: 1, createdWeek: 8 },
    ],
    factionHostility: { '1>2': 70, '2>1': 60 },
    factionRivalryPoints: { '1-2': { factionAId: 1, factionBId: 2, pointsA: CFG.pointsResolutionThreshold, pointsB: 40, startedSeason: 2, startedWeek: 1, naturalCalmStreak: 0 } },
    factionEventCooldowns: {}, factionTimeline: [],
  };
  delete G._pendingFactionEvent;
  delete G._pendingF09;
  const origPick = F.pickWeeklyEvent;
  const origMembers = F.processWeeklyMemberChanges;
  F.pickWeeklyEvent = () => ({ eventId: null });
  F.processWeeklyMemberChanges = (st) => st;
  let res;
  try { res = Engine.tickWeek(G); } finally {
    F.pickWeeklyEvent = origPick;
    F.processWeeklyMemberChanges = origMembers;
  }
  const out = res.state;
  const logs = (res.events || []).filter(e => e && typeof e === 'object' && e.type === 'faction_rivalry_decided');
  assert.strictEqual(logs.length, 1, `ログの行数 ${logs.length}`);
  assert.strictEqual(logs[0].data.variant, 'points');
  assert.strictEqual(logs[0].data.winFaction, G.factions[0].name);
  // 新聞は tickWeek の末尾で発行される。今週の号に載るか、載り切らなければ翌号へ持ち越されている
  const np = out.weeklyNewspaper || {};
  const stories = [np.topStory, ...(np.subStories || [])].filter(Boolean);
  const inPaper = stories.find(st => st.type === 'factionRivalryDecided');
  const queued = (out._industryNewsEvents || []).find(e => e.type === 'factionRivalryDecided');
  assert.ok(inPaper || queued, '業界ニュースが紙面にもキューにも無い');
  if (inPaper) {
    assert.strictEqual(inPaper.characterId, w1.id);
    assert.ok(/「.+」/.test(inPaper.body), `本文に一言が無い: ${inPaper.body}`);
  }
  assert.ok(!out._pendingFactionEvent, '決着でモーダルの待ちが立った');
  const mgmt = readSource('src', 'management.js');
  assert.ok(/buildRivalryResolutionNotice\(s, resolution, noticeRng\)/.test(mgmt), 'tickWeek が決着の知らせを組んでいない');
});

section('7. 派閥画面の抗争の年表: RIVALRY_CLOSED の reason の内部名を出さない', () => {
  const ui = readSource('src', 'ui-render.js');
  assert.ok(!/決着 ・ \{reason\}/.test(ui), "年表が '決着 ・ {reason}' で内部名を差し込んでいる");
  const m = ui.match(/function _dfcRivalryClosedLabel\(reason\) \{[\s\S]*?\n\}/);
  assert.ok(m, '_dfcRivalryClosedLabel が無い');
  const label = vm.runInNewContext(`(${m[0].replace('function _dfcRivalryClosedLabel', 'function')})`, { WM_I18N: { t: (k) => k } });
  const got = ['POINTS', 'F06_RECONCILE', 'CALM', 'CONSOLATION', 'UNKNOWN_X', undefined].map(label);
  assert.deepStrictEqual(got, ['ポイント先取で決着', '抗争の幕引き', '自然沈静化', '派閥消滅で終結', '決着', '決着']);
  got.forEach(l => assert.ok(!INTERNAL_RE.test(l) && !/UNKNOWN/.test(l), l));
  assert.ok(/ev\.type === 'RIVALRY_CLOSED'\) \{ cls = 'f09'; label = _dfcRivalryClosedLabel\(ev\.reason\); \}/.test(ui), '年表が _dfcRivalryClosedLabel を通していない');
});

section('8. 次回展望の因縁ペア: 自団体の組の因縁が出る(常に空だった不具合)', () => {
  const a = ALL_CHARS[0], b = ALL_CHARS[1], c = ALL_CHARS[2], d = ALL_CHARS[3];
  const key = (x, y) => Engine.title.getRivalryKey(x.id, y.id);
  const relPair = (x, y, v) => ({ [`${x.id}>${y.id}`]: { bond: 40, rivalry: v }, [`${y.id}>${x.id}`]: { bond: 40, rivalry: v } });
  const state = {
    season: 3, week: 10, roster: [a, b, c, d].map(x => fighter(x)),
    rivalries: {
      [key(a, b)]: { matches: 4, lastBand: 1 },
      [key(c, d)]: { matches: 2, lastBand: 2 },
    },
    relationships: { ...relPair(a, b, 35), ...relPair(c, d, 55) },
  };
  assert.strictEqual(typeof Engine.newspaper.pickPreviewRivalry, 'function');
  const p = Engine.newspaper.pickPreviewRivalry(state);
  assert.ok(p, '因縁ペアが空');
  const ids = [p.leftId, p.rightId].sort((x, y) => x - y);
  assert.deepStrictEqual(ids, [c.id, d.id].sort((x, y) => x - y), '段の高い組(宿敵)を選んでいない');
  assert.ok(p.leftName && p.rightName);
  assert.deepStrictEqual(Engine.newspaper.buildPreview(state).rivalry, p, 'buildPreview の因縁ペアが共通関数と違う');
  // 同じ段なら対戦回数の多い組
  const sameTier = { ...state, relationships: { ...relPair(a, b, 55), ...relPair(c, d, 55) }, rivalries: { [key(a, b)]: { matches: 6 }, [key(c, d)]: { matches: 2 } } };
  const p2 = Engine.newspaper.pickPreviewRivalry(sameTier);
  assert.deepStrictEqual([p2.leftId, p2.rightId].sort((x, y) => x - y), [a.id, b.id].sort((x, y) => x - y));
  // 決着済み(好敵手・宿怨)・因縁の段が無い組・自団体にいない組は選ばない
  const none = { ...state, rivalries: { [key(a, b)]: { matches: 9, resolved: 'bitter' }, [key(c, d)]: { matches: 9 } }, relationships: { ...relPair(a, b, 90), ...relPair(c, d, 10) } };
  assert.strictEqual(Engine.newspaper.pickPreviewRivalry(none), null);
  const away = { ...state, roster: [fighter(a), fighter(c)] };
  assert.strictEqual(Engine.newspaper.pickPreviewRivalry(away), null);
  // 興行結果の新聞データ(buildShowNewspaperData)も同じ関数を使う
  const mgmt = readSource('src', 'management.js');
  assert.ok(!/const ids = key\.split\('>'\);\s*\n\s*const rLeft/.test(mgmt), "次回展望が '>' で因縁のキーを割っている");
  assert.strictEqual((mgmt.match(/preview\.rivalry = Engine\.newspaper\.pickPreviewRivalry\(/g) || []).length, 2, '次回展望の2か所が共通関数を使っていない');
});

if (failed > 0) {
  console.log(`\n${failed} 件 FAIL`);
  process.exit(1);
}
console.log('\nfaction-rivalry-resolution-notice-test: ALL PASS');
