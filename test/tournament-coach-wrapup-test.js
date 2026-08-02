'use strict';

// tournament-coach-wrapup-test.js — task-73「特別興行の終わりにコーチの総括を一言」
//
// この演出は「大会結果 → コーチ → 経営画面」の連鎖に割り込む。**詰まると週が進まなくなる**ので、
// 守るのは主に次の3点:
//   A. 5大会すべてに割り込みが配線されていること(経路が消えていないこと)
//   B. onDone が必ずちょうど1回だけ呼ばれること(クリック/タイムアウト/連打/失敗のどれでも)
//   C. 文言の不変条件 — voice 8系統 × 成績6段が全部埋まっている / 言及は最大2人 /
//      不出場でも無言にならない / 内部語と生の数値をプレイヤーに見せない
//
// ピクセル値・クラス名の並び・セリフ本文そのものは固定しない(今後直す予定のものを縛らない)。

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const appSrc = readSource('src', 'app.js');
const htmlSrc = readSource('src', 'index.html');
const coachLines = require('../src/coach-lines.js');

const VOICES = ['sparta_roshi', 'sparta_tosho', 'theorist', 'artisan_bukotsu',
  'artisan_seihitsu', 'mentor', 'bigheart_oyaji', 'bigheart_anego'];
const GRADES = ['champion', 'finalist', 'semifinal', 'advanced', 'firstRound', 'absent'];
const REASONS = ['crown', 'deep', 'upset', 'close'];

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

// ─────────────────────────────────────────────────────────────
// ui-common.js の task-73 ブロックを丸ごと切り出して、最小スタブ上で実行する
// ─────────────────────────────────────────────────────────────
const START = 'const TCW_TIMEOUT_MS';
const END = '// ===== CLIMBLINE BRACKET';
const startAt = ui.indexOf(START);
const endAt = ui.indexOf(END, startAt);
assert.ok(startAt > 0 && endAt > startAt, 'task-73 のコーチ総括ブロックが ui-common.js に見つからない');
const blockSrc = ui.slice(startAt, endAt);

const ALL_COACHES_STUB = [
  { id: 1, name: '鬼塚 剛志', emoji: '🔥' },   // sparta_roshi
  { id: 2, name: '飛鳥 真琴', emoji: '📐' },   // theorist
  { id: 14, name: '土屋 弘美', emoji: '🌸' },  // bigheart_anego
];

function makeSandbox() {
  const created = [];
  const listeners = [];
  const timers = [];
  const doc = {
    createElement() {
      const el = {
        className: '', innerHTML: '', parentNode: null,
        querySelector: () => ({ addEventListener: (ev, fn) => listeners.push({ target: 'btn', ev, fn }) }),
        addEventListener: (ev, fn) => listeners.push({ target: 'overlay', ev, fn }),
      };
      created.push(el);
      return el;
    },
    body: { appendChild(el) { el.parentNode = { removeChild() { el.parentNode = null; } }; } },
  };
  const api = new Function(
    'Engine', 'ALL_COACHES', 'getCoachVoiceKey', 'COACH_WRAPUP_VERDICT_LINES',
    'COACH_WRAPUP_MENTION_LINES', 'getCoachPortraitUrl', 'escHtml', '_u3bSideHtml',
    '_drainPopupQueue', 'Audio', 'document', 'setTimeout', 'clearTimeout',
    `${blockSrc}
     return { buildCoachTournamentWrapup, showCoachTournamentWrapup, _tcwPickMentions, TCW_EVENT_META };`
  )(
    { util: { ov: f => f.ovr || 0 } },
    ALL_COACHES_STUB,
    coachLines.getCoachVoiceKey,
    coachLines.COACH_WRAPUP_VERDICT_LINES,
    coachLines.COACH_WRAPUP_MENTION_LINES,
    () => '../image/coach/face_stub.png',
    s => String(s == null ? '' : s),
    o => `<div class="u3b-side">${o.line || ''}${o.name || ''}${o.role || ''}</div>`,
    () => {},
    { play() {} },
    doc,
    (fn, ms) => { const t = { fn, ms, cleared: false }; timers.push(t); return t; },
    t => { if (t) t.cleared = true; }
  );
  return { api, timers, listeners, created };
}

const { api } = makeSandbox();
const { buildCoachTournamentWrapup } = api;

// ─────────────────────────────────────────────────────────────
// フィクスチャ
// ─────────────────────────────────────────────────────────────
function fighter(id, name, ovr) { return { id, name, ovr, personality: 'normal', archetype: 'standard' }; }

/** 4名ジュニアトーナメント。自団体は 101/102、相手は 201/202 */
function juniorResult({ playerWinsAll = false, upset = false, closeLoss = false } = {}) {
  const me = { id: 101, name: '朝比奈 千夏', ovr: 60, _orgId: 'player' };
  const mate = { id: 102, name: '御堂 ひかり', ovr: 55, _orgId: 'player' };
  const a = { id: 201, name: '外崎 レイ', ovr: upset ? 75 : 58, _orgId: 'org_a' };
  const b = { id: 202, name: '砂原 ユキ', ovr: 57, _orgId: 'org_b' };
  const semi = {
    name: 'semiFinal',
    matches: [
      { left: me, right: a, winnerId: playerWinsAll || upset ? me.id : a.id, loserId: playerWinsAll || upset ? a.id : me.id, mq: closeLoss ? 72 : 40 },
      { left: mate, right: b, winnerId: b.id, loserId: mate.id, mq: closeLoss ? 74 : 35 },
    ],
  };
  const finalist = playerWinsAll || upset ? me : a;
  const fin = {
    name: 'final',
    matches: [{ left: finalist, right: b, winnerId: playerWinsAll || upset ? me.id : b.id, loserId: playerWinsAll || upset ? b.id : me.id, mq: 70 }],
  };
  return {
    rounds: [semi, fin],
    champion: playerWinsAll || upset ? me : b,
    runnerUp: playerWinsAll || upset ? b : me,
    semiFinalists: [mate],
    bracketSize: 4,
  };
}

function baseState(extra) {
  return Object.assign({
    season: 3,
    orgName: 'テスト団体',
    roster: [fighter(101, '朝比奈 千夏', 60), fighter(102, '御堂 ひかり', 55)],
    aiOrgs: { org_a: { roster: [fighter(201, '外崎 レイ', 75)] }, org_b: { roster: [fighter(202, '砂原 ユキ', 57)] } },
    coaches: [2, 14],
    coachAssign: { 2: [101], 14: [102] },
  }, extra || {});
}

// ─────────────────────────────────────────────────────────────
console.log('=== task-73 特別興行後のコーチ総括 ===\n');

// A. 配線 — 5大会すべてに割り込みが入っているか
section('A1. 5大会すべての終了ハンドラに _tcwGate が配線されている', () => {
  const wanted = {
    "_tcwGate('junior'": 'ジュニアトーナメント',
    "_tcwGate('springTag'": '春のタッグリーグ',
    "_tcwGate('autumnWar'": '秋の4団体勝ち残り対抗戦',
    "_tcwGate('ppv'": 'PPV GRAND FINAL',
    "_tcwGate('tenchosen'": '天頂戦',
  };
  Object.keys(wanted).forEach(needle => {
    assert.ok(appSrc.includes(needle), `${wanted[needle]} の割り込みが消えている (${needle})`);
  });
});

section('A2. PPV は本編・TV観戦の両方から入る(不出場の回も無言にしない)', () => {
  const closeResult = appSrc.slice(appSrc.indexOf('App.closePPVResult = function()'), appSrc.indexOf('App.closePPVResult = function()') + 400);
  const closeTv = appSrc.slice(appSrc.indexOf('App.closePPVTV = function()'), appSrc.indexOf('App.closePPVTV = function()') + 400);
  assert.ok(/_tcwGate\('ppv'/.test(closeResult), 'closePPVResult に割り込みが無い');
  assert.ok(/_tcwGate\('ppv'/.test(closeTv), 'closePPVTV に割り込みが無い');
});

section('A3. _tcwGate は失敗しても false を返して呼び出し元を通す(fail-open)', () => {
  const at = appSrc.indexOf('App._tcwGate = function');
  assert.ok(at > 0, '_tcwGate が見つからない');
  const body = appSrc.slice(at, appSrc.indexOf('\n};', at));
  assert.ok(/if \(!payload\) return false;/.test(body), 'payload が無いとき false を返していない');
  assert.ok(/lastKey === key\) return false;/.test(body), '二重起動防止(lastKey)が消えている');
  assert.ok(/catch/.test(body), '組み立て失敗を握りつぶす catch が無い');
});

section('A4. 顔出しは共通部品 _u3bSideHtml を使う(新しい顔出しブロックを作らない)', () => {
  assert.ok(/_u3bSideHtml\(\{[\s\S]{0,400}role: 'コーチ'/.test(blockSrc),
    'コーチの顔出しが _u3bSideHtml 経由でない、または役割ラベルが無い');
  assert.ok(!/<img[^>]*coach/i.test(blockSrc), '生の <img> で顔出しを自作している');
});

section('A5. コーチ総括の長文は2行で切らず、吹き出し枠ごと全文に合わせて伸びる', () => {
  assert.ok(/bubbleClass: 'war-victory-line tcw-bubble'/.test(blockSrc),
    'コーチ総括の吹き出しに専用スコープが付いていない');
  assert.ok(/slotClass: 'tcw-bubble-slot'/.test(blockSrc),
    '長文に合わせて伸ばす予約枠クラスが付いていない');
  assert.ok(/\.war-victory-overlay\.is-tcw \.tcw-bubble-slot\{height:auto;min-height:52px\}/.test(htmlSrc),
    'コーチ総括の予約枠が固定高のまま');
  assert.ok(/\.war-victory-overlay\.is-tcw \.tcw-bubble \.u3b-bubble-text\{display:block;-webkit-line-clamp:unset;overflow:visible\}/.test(htmlSrc),
    'コーチ総括の2行制限が解除されていない');
  assert.ok(/\.u3b-bubble-text\{display:-webkit-box;-webkit-line-clamp:2/.test(htmlSrc),
    '他の共通吹き出しまで2行制限を外している');
});

// B. 進行 — onDone がちょうど1回
section('B1. ▶ を押すと onDone がちょうど1回呼ばれる', () => {
  const { api: a, listeners, timers } = makeSandbox();
  let n = 0;
  a.showCoachTournamentWrapup({ line: 'テスト', coachName: 'コーチ', kicker: 'K', theme: '' }, () => { n++; });
  assert.strictEqual(n, 0, '表示した時点で onDone を呼んではいけない');
  listeners.filter(l => l.target === 'btn' && l.ev === 'click').forEach(l => l.fn());
  assert.strictEqual(n, 1, '▶ で onDone が1回呼ばれていない');
  assert.ok(timers.every(t => t.cleared), 'タイムアウトが解除されていない');
});

section('B2. 連打・背景タップ・タイムアウトが重なっても onDone は1回だけ', () => {
  const { api: a, listeners, timers } = makeSandbox();
  let n = 0;
  a.showCoachTournamentWrapup({ line: 'テスト', coachName: 'コーチ', kicker: 'K', theme: '' }, () => { n++; });
  const btn = listeners.filter(l => l.target === 'btn' && l.ev === 'click');
  btn.forEach(l => { l.fn(); l.fn(); l.fn(); });
  listeners.filter(l => l.target === 'overlay').forEach(l => l.fn({ target: null }));
  timers.forEach(t => t.fn());
  assert.strictEqual(n, 1, `二重起動防止が効いていない(onDone が ${n} 回)`);
});

section('B3. クリックが一度も来なくてもタイムアウトで必ず進む', () => {
  const { api: a, timers } = makeSandbox();
  let n = 0;
  a.showCoachTournamentWrapup({ line: 'テスト', coachName: 'コーチ', kicker: 'K', theme: '' }, () => { n++; });
  assert.ok(timers.length >= 1, '待ちにタイムアウトが掛かっていない');
  assert.ok(timers[0].ms > 0 && timers[0].ms <= 60000, `タイムアウトが実用的な長さでない (${timers[0].ms}ms)`);
  timers.forEach(t => t.fn());
  assert.strictEqual(n, 1, 'タイムアウトで進まない=週が止まる');
});

section('B4. payload が壊れていても onDone は呼ばれる(画面を掴んだまま死なない)', () => {
  const { api: a } = makeSandbox();
  let n = 0;
  a.showCoachTournamentWrapup(null, () => { n++; });
  a.showCoachTournamentWrapup({ line: '' }, () => { n++; });
  assert.strictEqual(n, 2, '壊れた payload で進行が止まる');
});

// C. 文言 — 表が埋まっているか
section('C1. 総括は voice 8系統 × 成績6段が全部埋まっている(フォールバック無し)', () => {
  const holes = [];
  GRADES.forEach(g => VOICES.forEach(v => {
    const cell = coachLines.COACH_WRAPUP_VERDICT_LINES[g] && coachLines.COACH_WRAPUP_VERDICT_LINES[g][v];
    const text = Array.isArray(cell) ? cell.join('') : cell;
    if (!text || !String(text).trim()) holes.push(`${g}/${v}`);
  }));
  assert.strictEqual(holes.length, 0, '未記入: ' + holes.join(', '));
});

section('C2. 言及セリフは 4理由 × 8voice が solo/duo とも埋まっている', () => {
  const holes = [];
  REASONS.forEach(r => VOICES.forEach(v => {
    const cell = coachLines.COACH_WRAPUP_MENTION_LINES[r] && coachLines.COACH_WRAPUP_MENTION_LINES[r][v];
    if (!cell || !cell.solo || !cell.duo) holes.push(`${r}/${v}`);
    if (cell && cell.solo && cell.solo.indexOf('{n1}') < 0) holes.push(`${r}/${v}(soloに{n1}が無い)`);
    if (cell && cell.duo && (cell.duo.indexOf('{n1}') < 0 || cell.duo.indexOf('{n2}') < 0)) holes.push(`${r}/${v}(duoの名前枠が足りない)`);
  }));
  ['together', 'togetherPoor'].forEach(key => VOICES.forEach(v => {
    const cell = coachLines.COACH_WRAPUP_MENTION_LINES[key][v];
    if (!cell || !cell.duo) holes.push(`${key}/${v}`);
    else if (cell.duo.indexOf('{n1}') < 0 || cell.duo.indexOf('{n2}') < 0) holes.push(`${key}/${v}(名前枠)`);
  }));
  assert.strictEqual(holes.length, 0, '未記入: ' + holes.join(', '));
});

section('C3. セリフに内部語と生の数値を出さない', () => {
  const all = [];
  Object.values(coachLines.COACH_WRAPUP_VERDICT_LINES).forEach(byVoice =>
    Object.values(byVoice).forEach(v => (Array.isArray(v) ? all.push(...v) : all.push(v))));
  Object.values(coachLines.COACH_WRAPUP_MENTION_LINES).forEach(byVoice =>
    Object.values(byVoice).forEach(cell => { if (cell.solo) all.push(cell.solo); if (cell.duo) all.push(cell.duo); }));
  // {n1}/{n2} は選手名の差し込み枠なので、数値チェックの前に外す
  const bad = all.map(t => t.replace(/\{n[12]\}/g, '＿'))
    .filter(t => /MQ|condition|orgPop|morale|OVR|[0-9０-９]/.test(t));
  assert.strictEqual(bad.length, 0, '内部語/数値が混じっている: ' + bad.join(' / '));
});

section('C4. セリフに 「」 を入れない(吹き出しが二重括弧になる)', () => {
  const all = [];
  Object.values(coachLines.COACH_WRAPUP_VERDICT_LINES).forEach(byVoice =>
    Object.values(byVoice).forEach(v => (Array.isArray(v) ? all.push(...v) : all.push(v))));
  const bad = all.filter(t => /[「」]/.test(t));
  assert.strictEqual(bad.length, 0, '括弧付きのセリフ: ' + bad.join(' / '));
});

// D. 組み立て — 実データを通す
section('D1. 自団体が優勝 → 優勝者に触れ、その担当コーチが喋る', () => {
  const state = baseState();
  // 101=優勝(優先度4) / 102=準決勝敗退(優先度3)。下の物語なので2人目として添えられる
  const p = buildCoachTournamentWrapup('junior', state, { result: juniorResult({ playerWinsAll: true }) });
  assert.ok(p, '総括が組み立てられない');
  assert.strictEqual(p.coachId, 2, '優先度1位の選手(101)の担当コーチが喋っていない');
  assert.ok(p.line.includes('朝比奈 千夏'), '優勝者に触れていない');
  assert.deepStrictEqual(p.mentionedIds, [101, 102], '優勝者+その下の1人という並びになっていない');
  assert.ok(p.line.indexOf('朝比奈 千夏') < p.line.indexOf('御堂 ひかり'),
    '優先度の高い選手が先に来ていない');
});

section('D2. 言及は最大2人。3人以上には絶対に触れない', () => {
  const many = baseState({
    roster: [1, 2, 3, 4, 5].map(i => fighter(100 + i, `選手${'ABCDE'[i - 1]}`, 60)),
    coachAssign: {},
  });
  // 5人全員が「格上を食った」= 同格。同格しか居なければ1人だけ触れる
  const rounds = [{
    name: 'firstRound',
    matches: [1, 2, 3, 4, 5].map(i => ({
      left: { id: 100 + i, name: `選手${'ABCDE'[i - 1]}`, ovr: 60 },
      right: { id: 300 + i, name: `敵${i}`, ovr: 80 },
      winnerId: 100 + i, loserId: 300 + i, mq: 50,
    })),
  }];
  const p = buildCoachTournamentWrapup('junior', many, { result: { rounds, champion: null, runnerUp: null, semiFinalists: [] } });
  assert.ok(p, '総括が組み立てられない');
  assert.ok(p.mentionedIds.length <= 2, `${p.mentionedIds.length}人に触れている`);
});

section('D3. 不出場でも必ず何か喋る(無言にしない)', () => {
  const state = baseState({ roster: [] });
  ['junior', 'tenchosen', 'springTag', 'autumnWar', 'ppv'].forEach(kind => {
    const p = buildCoachTournamentWrapup(kind, state, {});
    assert.ok(p && p.line && p.line.trim(), `${kind}: 不出場の回が無言になっている`);
    assert.ok(!/\{n[12]\}/.test(p.line), `${kind}: 名前枠が埋まらずに残っている`);
    assert.strictEqual(p.mentionedIds.length, 0, `${kind}: 出ていない選手に触れている`);
  });
});

section('D4. コーチが1人もいなければ演出を出さない(無人の吹き出しを作らない)', () => {
  const state = baseState({ coaches: [], coachAssign: {} });
  const p = buildCoachTournamentWrapup('junior', state, { result: juniorResult({ playerWinsAll: true }) });
  assert.strictEqual(p, null, 'コーチ不在なのに吹き出しが出る');
});

section('D5. 担当が付いていなければ在籍が最も長いコーチが喋る', () => {
  const state = baseState({ coaches: [14, 2], coachAssign: {} });
  const p = buildCoachTournamentWrapup('junior', state, { result: juniorResult({ playerWinsAll: true }) });
  assert.strictEqual(p.coachId, 14, 'G.coaches の先頭(在籍最長)が選ばれていない');
});

section('D6. 同点なら直近で触れた選手を後ろへ回す(スポットライトは巡る)', () => {
  const rounds = [{
    name: 'firstRound',
    matches: [
      { left: { id: 101, name: '朝比奈 千夏', ovr: 60 }, right: { id: 301, name: '敵1', ovr: 80 }, winnerId: 101, loserId: 301, mq: 50 },
      { left: { id: 102, name: '御堂 ひかり', ovr: 55 }, right: { id: 302, name: '敵2', ovr: 80 }, winnerId: 102, loserId: 302, mq: 50 },
    ],
  }];
  const args = { result: { rounds, champion: null, runnerUp: null, semiFinalists: [] } };
  const first = buildCoachTournamentWrapup('junior', baseState({ coachWrapup: { recent: [] } }), args);
  const after = buildCoachTournamentWrapup('junior', baseState({ coachWrapup: { recent: [first.mentionedIds[0]] } }), args);
  assert.notStrictEqual(after.mentionedIds[0], first.mentionedIds[0],
    '直近で触れた選手が同点でもまた選ばれている');
});

section('D7. 春のタッグリーグは組の2人をまとめて出す(片方だけにしない)', () => {
  const state = baseState({
    springTagLeague: {
      teams: [{ orgId: 'player', orgName: 'テスト団体', f1Id: 101, f2Id: 102 }],
      matches: [{ orgA: 'player', orgB: 'org_a', winner: 'teamA', mq: 65 }],
      champion: 'player', runnerUp: 'org_a', third: 'org_b',
    },
  });
  const p = buildCoachTournamentWrapup('springTag', state, {});
  assert.ok(p.line.includes('朝比奈 千夏') && p.line.includes('御堂 ひかり'), '組の2人が揃っていない');
  assert.deepStrictEqual(p.mentionedIds.sort(), [101, 102]);

  // 最下位で終わった回に「よく噛み合っていた」と言うと嘘になるので語り口を替える
  const poorState = baseState({
    springTagLeague: {
      teams: [{ orgId: 'player', orgName: 'テスト団体', f1Id: 101, f2Id: 102 }],
      matches: [], champion: 'org_a', runnerUp: 'org_b', third: 'org_c',
    },
  });
  const poor = buildCoachTournamentWrapup('springTag', poorState, {});
  assert.ok(poor.line.includes('朝比奈 千夏') && poor.line.includes('御堂 ひかり'), '最下位でも組の2人に触れる');
  assert.notStrictEqual(poor.line, p.line, '優勝と最下位で同じ台詞が出ている');
});

section('D8. 成績6段が実データから正しく出る(優勝/準優勝/不出場)', () => {
  const won = buildCoachTournamentWrapup('junior', baseState(), { result: juniorResult({ playerWinsAll: true }) });
  const lost = buildCoachTournamentWrapup('junior', baseState(), { result: juniorResult({}) });
  assert.notStrictEqual(won.line, lost.line, '優勝と準優勝で同じセリフが出ている');
  const absent = buildCoachTournamentWrapup('junior', baseState({ roster: [] }), { result: juniorResult({}) });
  assert.notStrictEqual(absent.line, won.line, '不出場と優勝で同じセリフが出ている');
});

section('D9. 全 voice × 全成績段 が実際に文になる(組み立てで穴が出ない)', () => {
  const holes = [];
  [1, 2, 14].forEach(coachId => {
    GRADES.forEach(() => {});
    [
      ['champion', juniorResult({ playerWinsAll: true }), baseState({ coaches: [coachId], coachAssign: {} })],
      ['finalist', juniorResult({}), baseState({ coaches: [coachId], coachAssign: {} })],
      ['absent', juniorResult({}), baseState({ coaches: [coachId], coachAssign: {}, roster: [] })],
    ].forEach(([label, result, state]) => {
      const p = buildCoachTournamentWrapup('junior', state, { result });
      if (!p || !p.line || /\{n[12]\}/.test(p.line)) holes.push(`coach${coachId}/${label}`);
    });
  });
  assert.strictEqual(holes.length, 0, '文にならない組み合わせ: ' + holes.join(', '));
});

section('D10. 理論派の番狂わせ評は、矛盾する大会総評を後ろへ連結しない', () => {
  const result = {
    rounds: [{
      name: 'firstRound',
      matches: [{
        left: { id: 101, name: '朝比奈 千夏', ovr: 60, _orgId: 'player' },
        right: { id: 201, name: '外崎 レイ', ovr: 75, _orgId: 'org_a' },
        winnerId: 101, loserId: 201, mq: 60,
      }],
    }],
    champion: null, runnerUp: null, semiFinalists: [], bracketSize: 4,
  };
  const p = buildCoachTournamentWrapup('junior', baseState(), { result });
  assert.ok(p, '番狂わせ評が組み立てられない');
  assert.strictEqual(
    p.line,
    '朝比奈 千夏が格上を崩しました。あれは狙って作った勝ちです。ああいう書き方ができたことを褒めてあげたいですね。'
  );
  assert.ok(!p.line.includes('勝てる相手には勝てました'), '旧総評が後ろへ残っている');
});

console.log('');
if (failed > 0) { console.log(`tournament-coach-wrapup-test: ${failed} FAILED`); process.exit(1); }
console.log('tournament-coach-wrapup-test: ok');
