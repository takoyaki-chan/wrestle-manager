'use strict';
// newspaper-news-value-test.js — 新聞P2「採点の合成点化」
//
// 固定点では「無名の怪我」と「王者の怪我」が同じ点になる。
//   最終点 = 基礎点(何が起きたか) + 主役補正(誰に起きたか) + 強度補正(どれくらい大きいか)
//
// ここで固定するのは spec §2-5 の検算不変条件4件。
// **数値目標だけ渡すと最短経路で目標だけ満たされて設計意図が壊れる**ので、
// 「届く」条件と「届かない」条件を対で書く。

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); }
}

console.log('=== 新聞P2 ニュースバリュー採点 ===\n');

const NP = Engine.newspaper;
const LINE = NP.SLOT_LINE;

// ── フィクスチャ ─────────────────────────────────────────────────────
const f = (id, name, ovr, extra) => Object.assign({
  id, name, pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
  popularity: 30, streak: 0, careerSeasons: 5, careerRecord: { history: [] },
}, extra || {});

function makeState(extra) {
  // 自団体7名 + AI 1団体。王者は 101(自団体のエース)
  const roster = [f(101, 'エース', 70), f(102, '主力', 65), f(103, '中堅', 60),
    f(104, '若手A', 50), f(105, '若手B', 48), f(106, '若手C', 46), f(107, '無名', 44)];
  return Object.assign({
    season: 3, week: 20, orgName: 'テスト団体', roster,
    titles: { world: { championId: 101, defenses: 2 } },
    aiOrgs: { org_a: { roster: [f(201, '敵エース', 75)], titles: { world: { championId: 201 } } } },
    mvpRace: { rankings: [] },
    factions: [],
  }, extra || {});
}

const story = (type, priority, characterId, newsData) => ({ type, priority, characterId, newsData: newsData || {} });
const valueOf = (state, s) => NP.newsValue(state, s, NP.buildValueContext(state));

// ── §2-5 の検算不変条件 ─────────────────────────────────────────────
section('不変条件1. 無補正の日常ネタ・練習怪我は、強度を積んでも一面トップに届かない', () => {
  const st = makeState();
  // 107=無名(王座なし/MVP圏外/OVR最下位/人気圏外/連勝なし)
  const cases = [
    story('aiPracticeInjury', NP.PRIORITY.aiPracticeInjury, 107, { weeksOut: 20 }),
    story('aiMediaSpotlight', NP.PRIORITY.aiMediaSpotlight, 107, {}),
    story('general', NP.PRIORITY.general, 107, {}),
  ];
  cases.forEach(s => {
    const v = valueOf(st, s);
    assert.ok(v < LINE.top, `${s.type} が ${v} 点で一面トップ(${LINE.top})に届いてしまう`);
  });
});

section('不変条件2. 王者/MVP首位の長期離脱(全治10週+)は必ず一面トップ資格に届く', () => {
  // 王者(101)の重傷
  const champ = makeState();
  const vChamp = valueOf(champ, story('topChampionInjury', NP.PRIORITY.topChampionInjury, 101, { weeks: 10 }));
  assert.ok(vChamp >= LINE.top, `王者の全治10週が ${vChamp} 点でトップ(${LINE.top})に届かない`);

  // MVP首位(103=中堅。王者でもエースでもない)の重傷
  const mvp = makeState({ mvpRace: { rankings: [{ fighterId: 103, rank: 1 }] } });
  const vMvp = valueOf(mvp, story('topChampionInjury', NP.PRIORITY.topChampionInjury, 103, { weeks: 10 }));
  assert.ok(vMvp >= LINE.top, `MVP首位の全治10週が ${vMvp} 点でトップ(${LINE.top})に届かない`);
});

section('不変条件3. C帯の基礎点(70以下)は主役補正が上限でも一面トップに届かない', () => {
  const st = makeState({ mvpRace: { rankings: [{ fighterId: 101, rank: 1 }] } });
  // 101 は 世界王者+MVP首位+団体エース+業界人気 — 主役補正が上限に張り付く条件
  const bonus = NP.protagonistBonus(st, 101, NP.buildValueContext(st));
  assert.strictEqual(bonus, NP.PROTAGONIST_CAP, `主役補正が上限(${NP.PROTAGONIST_CAP})に達していない: ${bonus}`);
  [70, 60, 45, 30].forEach(base => {
    const v = valueOf(st, story('general', base, 101, {}));
    assert.ok(v < LINE.top, `基礎点 ${base} が ${v} 点で一面トップに届いてしまう`);
  });
});

section('不変条件4. 同週にトップ資格が2本以上なら、2本目以降は下の枠へ落ちる', () => {
  // 資格線は「その記事単体の資格」。実際の枠は合成点の**降順**で上から詰めるので、
  // 2本目は自動的にトップの次(肩)へ回る。ここでは順序が点で決まることを固定する
  const st = makeState();
  const a = story('topChampionInjury', NP.PRIORITY.topChampionInjury, 101, { weeks: 14 });
  const b = story('topChampionInjury', NP.PRIORITY.topChampionInjury, 201, { weeks: 10 });
  const va = valueOf(st, a), vb = valueOf(st, b);
  assert.ok(va >= LINE.top && vb >= LINE.top, `両方トップ資格でない (${va} / ${vb})`);
  assert.ok(va > vb, `長期離脱のほうが上に来ていない (${va} <= ${vb})`);
  const sorted = [b, a].map(s => ({ s, v: valueOf(st, s) })).sort((x, y) => y.v - x.v);
  assert.strictEqual(sorted[0].s, a, '合成点の降順に並んでいない');
});

// ── 設計の芯: 誰に起きたかで価値が変わる ────────────────────────────
section('同じ怪我でも、無名と主力と王者で価値が変わる(§2 の芯)', () => {
  const st = makeState();
  const v = (id, weeks) => valueOf(st, story('aiPracticeInjury', 140, id, { weeksOut: weeks }));
  const noName = v(107, 6), core = v(102, 10), champ = v(101, 14);
  assert.ok(noName < core, `無名(${noName}) < 主力(${core}) になっていない`);
  assert.ok(core < champ, `主力(${core}) < 王者(${champ}) になっていない`);
  // spec の作例と同じ並び: 中記事 / 肩 / 一面トップ
  assert.strictEqual(NP.slotOf(noName, true), 'jun', `無名の大怪我が ${noName} 点で中記事にならない`);
  assert.ok(['kata', 'top'].includes(NP.slotOf(core, true)), `主力の大怪我が ${core} 点で肩以上にならない`);
  assert.strictEqual(NP.slotOf(champ, true), 'top', `王者の大怪我が ${champ} 点でトップにならない`);
});

section('主役補正は上位2属性だけ(1位 + 2位×0.5)。全部盛りでも上限を超えない', () => {
  const st = makeState({ mvpRace: { rankings: [{ fighterId: 101, rank: 1 }] } });
  const ctx = NP.buildValueContext(st);
  const b = NP.protagonistBonus(st, 101, ctx);
  assert.ok(b <= NP.PROTAGONIST_CAP, `上限(${NP.PROTAGONIST_CAP})を超えている: ${b}`);
  // 王者(90)+MVP首位(80)×0.5 = 130 → 上限で 120 に丸まる
  assert.strictEqual(b, 120, `上位2属性の計算が想定と違う: ${b}`);
  // 該当なしは 0
  assert.strictEqual(NP.protagonistBonus(st, 107, ctx), 0, '無名に補正が乗っている');
  assert.strictEqual(NP.protagonistBonus(st, null, ctx), 0, 'idが無いのに補正が乗っている');
});

section('写真が無い記事は一面トップの資格を持たない(§3「一面なのに写真がない」を防ぐ)', () => {
  assert.strictEqual(NP.slotOf(400, false), 'kata', '写真の無い高得点記事がトップに座れてしまう');
  assert.strictEqual(NP.slotOf(400, true), 'top', '写真がある高得点記事がトップにならない');
});

section('generate() が合成点で並べ、記事に内訳を残している(死蔵にしない)', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
  assert.ok(/s\.newsValue = Engine\.newspaper\.newsValue\(/.test(src),
    'generate() が newsValue を当てていない（採点だけ作って使っていない）');
  assert.ok(/stories\.sort\(\(a, b\) => \(b\.newsValue - a\.newsValue\)/.test(src),
    '並べ替えが合成点になっていない（基礎点のまま並んでいる）');
  assert.ok(/s\.newsSlot = Engine\.newspaper\.slotOf\(/.test(src),
    '資格線の判定結果が記事に残っていない');
});

// ── P3 §2-7: 特別興行の事前記事 ─────────────────────────────────────
section('事前記事は結果と同じ帯にある(いまの PRIORITY は逆だった)', () => {
  const P = NP.PRIORITY;
  assert.ok(P.tenchosenAnnounce >= 260, `天頂戦の告知が ${P.tenchosenAnnounce} 点で結果の帯に届かない`);
  assert.ok(P.autumnWarAnnounce >= P.autumnWarResult - 20, '秋4団体戦の告知が結果から離れすぎ');
  assert.ok(P.springTagAnnounce >= P.springTagResult - 20, '春タッグの告知が結果から離れすぎ');
});

section('優勝候補は「見えている実績」で並ぶ。OVRの降順にしない', () => {
  const st = makeState({
    mvpRace: { rankings: [{ fighterId: 107, rank: 1 }] },
    h2h: { '101_107': { matches: 3 } },
  });
  // 107 は団体で**最もOVRが低い**が、MVP首位。OVR順なら最下位、実績順なら上位に来る
  const picks = NP.eventContenders(st, [101, 102, 103, 104, 105, 106, 107], 3);
  assert.ok(picks.length >= 2, '候補が挙がらない');
  assert.ok(picks.some(p => p.id === 107), 'MVP首位がOVRの低さで落とされている');
  // 語れる実績が無い選手は候補にしない(無理に埋めない)
  const none = NP.eventContenders(st, [105, 106], 3);
  assert.strictEqual(none.length, 0, '実績の無い選手を候補に挙げている');
});

section('事前記事の段落は断定しない / 素材が無ければ空を返す', () => {
  const st = makeState({ mvpRace: { rankings: [{ fighterId: 101, rank: 1 }] } });
  const par = NP.eventPreviewParagraph(st, [101, 102]);
  assert.ok(par && par.length > 0, '段落が組み立てられない');
  assert.ok(!/優勝する|必ず|確実/.test(par), `記者の予想が断定になっている: ${par}`);
  assert.ok(!/OVR|総合値|pw/.test(par), `生の能力値が漏れている: ${par}`);
  assert.strictEqual(NP.eventPreviewParagraph(st, []), '', '素材が無いのに文を作っている');
});

section('事前記事のテンプレに差し込み口がある(死蔵にしない)', () => {
  const t = (typeof NEWS_HEADLINE_TEMPLATES !== 'undefined') && NEWS_HEADLINE_TEMPLATES;
  assert.ok(t, 'NEWS_HEADLINE_TEMPLATES が読めない');
  ['autumnWarAnnounce', 'springTagAnnounce'].forEach(k => {
    assert.ok((t[k] || []).every(x => x.body.includes('{preview}')),
      `${k} の本文に {preview} が無い（段落を作っても紙面に出ない）`);
  });
});

// ── P3 §2-6: 週次ニュース源 / ドラフト総括 ──────────────────────────
section('大怪我・連勝連敗はスキャンで拾う(発生地点を追いかけない)', () => {
  const st = makeState({
    roster: [f(101, '王者', 70, { injury: { type: '重傷', weeksLeft: 12 } }),
      f(102, '連勝中', 65, { streak: 10 }), f(103, '連敗中', 60, { streak: -5 })],
    streakRecord: { value: 9, holderId: 999 }, _industryNewsEvents: [],
  });
  const after = NP.scanRosterNews(st);
  const types = (after._industryNewsEvents || []).map(e => e.type);
  ['longInjury', 'winStreakMilestone', 'loseStreakMilestone'].forEach(t => {
    assert.ok(types.includes(t), `${t} が拾われていない`);
  });
  // 同じネタを毎週出さない
  const again = NP.scanRosterNews({ ...after, _industryNewsEvents: [] });
  assert.strictEqual((again._industryNewsEvents || []).length, 0, '同じネタが翌週も出ている');
});

section('連勝は団体記録との距離で強度が変わる', () => {
  const base = { type: 'winStreakMilestone', priority: NP.PRIORITY.winStreakMilestone, characterId: 107 };
  const st = makeState();
  const plain = valueOf(st, { ...base, newsData: {} });
  const match = valueOf(st, { ...base, newsData: { recordState: 'match' } });
  const broken = valueOf(st, { ...base, newsData: { recordState: 'broken' } });
  assert.ok(plain < match && match < broken, `王手/更新で点が上がらない (${plain}/${match}/${broken})`);
});

section('移籍・引退の記事が生成できる(旧 transfer は死んだエントリだった)', () => {
  assert.ok(NP.PRIORITY.transferDone > 0 && NP.PRIORITY.retirementDeclare > 0, '基礎点が無い');
  const t = (typeof NEWS_HEADLINE_TEMPLATES !== 'undefined') && NEWS_HEADLINE_TEMPLATES;
  ['transferDone', 'retirementDeclare', 'longInjury', 'winStreakMilestone',
    'loseStreakMilestone', 'draftRoundup'].forEach(k => {
    assert.ok(t[k] && t[k].length, `${k} の記事テンプレが無い(点だけあって紙面に出ない)`);
    t[k].forEach(x => {
      assert.ok(x.headline && x.body, `${k} に見出しか本文が欠けている`);
      assert.ok(!/MQ|condition|orgPop|OVR/.test(x.headline + x.body), `${k} に内部語が出ている`);
    });
  });
});

section('ドラフト総括は見立てティア順。能力値の降順にしない', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8');
  // 同名のローカル変数 draftSummary が別の場所にあるので、**記事の push** を狙う
  const at = src.indexOf("type: 'draftRoundup'");
  assert.ok(at > 0, 'ドラフト総括の記事生成が ui-common.js に無い');
  const block = src.slice(Math.max(0, at - 1800), at + 400);
  assert.ok(/assessedTier/.test(block), '見立てティアで並べていない');
  assert.ok(!/Engine\.util\.ov\(/.test(block), '能力値で並べている(隠しステが読める)');
  assert.ok(/characterIds:/.test(block), '顔付きになっていない');
});

// ── P4/P5 ───────────────────────────────────────────────────────────
section('静かな週の読み物は実話だけ。素材が無ければ作らない', () => {
  // 直近に何も起きていない選手だけの週 → 読み物は作らない
  const quiet = makeState({ season: 5, week: 20 });
  assert.strictEqual(NP.buildFollowUp(quiet), null, '素材が無いのに読み物を作っている');
  // ブレークスルーがあれば拾う
  const withBt = makeState({ season: 5, week: 20,
    roster: [f(101, 'A', 60, { careerRecord: { history: [{ type: 'breakthrough', season: 5, week: 18, stat: 'pw' }] } })] });
  const fu = NP.buildFollowUp(withBt);
  assert.ok(fu && fu.type === 'followUpBreakthrough', 'ブレークスルーの後追いが出ない');
  // 一度取り上げた選手は当分外す(連勝が毎週一面を占めた事故の再発防止)
  const cooled = { ...withBt, newsSeen: { followUp: { '101': Engine.util.absWeek(5, 19) } } };
  assert.strictEqual(NP.buildFollowUp(cooled), null, 'クールダウン中の選手をまた取り上げている');
});

section('MVPレース4位以下は順位争いだけを書く(N-12)', () => {
  const rows = [
    { fighterId: 101, rank: 1, prevRank: 1, points: 400 },
    { fighterId: 102, rank: 2, prevRank: 2, points: 380 },
    { fighterId: 103, rank: 3, prevRank: 3, points: 370 },
    { fighterId: 104, rank: 4, prevRank: 6, points: 366 },
  ];
  const st = { season: 5, week: 38, rngSeed: 42, mvpRace: { rankings: rows }, roster: [], aiOrgs: {} };
  const line = Engine.mvpRace._composeChaseLine(st, rows[3]);
  assert.ok(/位/.test(line) && /点差/.test(line), `順位・点差が入っていない: ${line}`);
  assert.ok(/残り/.test(line), `残り週数が入っていない: ${line}`);
  assert.ok(!/因縁|宿敵|好敵手/.test(line), `下位に因縁の話を書いている: ${line}`);
  // 4位以上は chase 側へ回る
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
  assert.ok(/MVP_CHASE_FROM_RANK/.test(src) && /_composeChaseLine\(state, entry\)/.test(src),
    '4位以下の分岐が _composeFlavorLine に入っていない');
});

section('P6: 人物が取れない記事は汎用画像へ落ちる(一面の写真枠を空にしない)', () => {
  const ui = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8');
  assert.ok(/NP_GENERIC_PHOTO/.test(ui), '汎用画像の対応表が無い');
  assert.ok(/_npGenericPhotoBg/.test(ui), '汎用画像の解決関数が無い');
  // 人物写真が最優先で、汎用はその後(順番が逆になると顔が出なくなる)
  const at = ui.indexOf('function _npPhotoBg(');
  const body = ui.slice(at, at + 400);
  assert.ok(body.indexOf('getUpperUrl') < body.indexOf('_npGenericPhotoBg'),
    '汎用画像が人物写真より先に当たっている');
  // 主要な「人物が特定できない記事」に割り当てがある
  ['springTagAnnounce', 'autumnWarAnnounce', 'lockerRoomCrisis', 'draftRoundup']
    .forEach(k => assert.ok(new RegExp(k + ':').test(ui), `${k} に汎用画像の割り当てが無い`));
});

console.log('');
if (failed > 0) { console.log(`newspaper-news-value-test: ${failed} FAILED`); process.exit(1); }
console.log('newspaper-news-value-test: ok');
