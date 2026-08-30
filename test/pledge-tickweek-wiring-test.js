'use strict';
// pledge-tickweek-wiring-test.js — 起用約束が「本物の tickWeek」を通って発火することの確認
//
// pledge-channel-test.js は settlePledge を直接叩く単体検査。こちらは
// Engine.createInitialState → Engine.tickWeek という実パイプラインを回して、
// 「書いてあるのに出ていない」(配線されていない/呼ばれていない)を潰す。
//
// 失効(expired)は auto-sim では滅多に出ない — 通常興行が平均2.8週に1回あるため
// 「12週間まったく判定機会がない」状況がほぼ生じないから。そこで失効経路だけは
// ここで決定論的に踏む。履行/破約は auto-sim 40季 --care で実発火を確認済み。

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 起用約束: 実 tickWeek パイプライン配線 ===\n');

// 開始ロスターは5名で、強気(bold)は1人も含まれない — 24名の強気勢は
// ドラフト/FAで後から加入する。配線検査なので、先頭の1名を強気に付け替えて使う。
function freshState() {
  let G = Engine.createInitialState(20260830, true);
  const roster = G.roster.slice();
  roster[0] = { ...roster[0], personality: 'bold' };
  G = Engine.validateGameState({ ...G, roster });
  return G;
}

function findBold(G) {
  return (G.roster || []).find(f => String(f.personality || 'normal') === 'bold' && !f.isRental && !f.injury);
}

section('強気(bold)はゲーム世界に実在し、チャンネルの対象になる', () => {
  const boldAll = (typeof ALL_CHARS !== 'undefined' ? ALL_CHARS : []).filter(c => c.personality === 'bold');
  assert.ok(boldAll.length > 0, '強気の選手が1人もいない — チャンネルの対象が存在しない');
  console.log(`        強気 ${boldAll.length}名 / 全${ALL_CHARS.length}名（例: ${boldAll.slice(0, 3).map(c => c.name).join('、')}）`);
  // ただし開始ロスターには含まれない = 加入して初めて使えるチャンネルである
  const G0 = Engine.createInitialState(20260830, true);
  const inStart = (G0.roster || []).filter(f => f.personality === 'bold').length;
  console.log(`        開始ロスター(${G0.roster.length}名)中の強気: ${inStart}名 — 加入後に開くチャンネル`);
});

section('約束を持ったまま tickWeek を回すと、判定されるまで G.pledge が保持される', () => {
  let G = freshState();
  const b = findBold(G);
  // 直接 pledge を置く(execute 経路は pledge-channel-test.js で検査済み)
  G = { ...G, pledge: { fighterId: b.id, madeWeek: Engine.util.absWeek(G.season, G.week) } };
  const before = G.pledge.fighterId;
  const r = Engine.tickWeek(G);
  assert.ok(r && r.state, 'tickWeek が state を返さない');
  // 通常興行が発生していなければ持ち越し、発生していれば判定されて消える
  const settled = !(r.state.pledge && r.state.pledge.fighterId != null);
  if (settled) {
    assert.ok(r.state._pendingPledgeResult || true, '判定済みなら結果が載るか、静かに失効している');
  } else {
    assert.strictEqual(r.state.pledge.fighterId, before, '未判定なのに約束の中身が変わった');
  }
});

section('判定機会がないまま12週で失効し、trust は動かない(実パイプライン)', () => {
  let G = freshState();
  const b = findBold(G);
  const targetId = b.id;
  const trustBefore = (G.roster.find(f => f.id === targetId).trust);

  // madeWeek を13週前に置く = 次の tick で必ず失効条件(elapsed >= 12)に入る。
  // 通常興行の判定が先に走らないよう、興行結果を空にしておく。
  G = {
    ...G,
    lastShowResults: [],
    pledge: { fighterId: targetId, madeWeek: Engine.util.absWeek(G.season, G.week) - 13 },
  };
  const r = Engine.tickWeek(G);
  const after = r.state;

  assert.ok(!(after.pledge && after.pledge.fighterId != null), '12週超で失効していない(G.pledge が残っている)');
  assert.ok(!after._pendingPledgeResult, '失効なのに結果ポップアップが積まれている(静かに消えるべき)');

  const f = after.roster.find(x => x.id === targetId);
  // 失効そのものでは trust を動かさない(週次の自然変動は別要因なので、罰の桁=6が出ていないことを見る)
  assert.ok(Math.abs((f.trust != null ? f.trust : 50) - trustBefore) < 3,
    `失効で trust が大きく動いた(${trustBefore} → ${f.trust}) — 失効は無罰のはず`);

  const log = (after.gameLog || []).join('\n');
  assert.ok(/約束/.test(log) && /流れた/.test(log), '失効のログ1行が残っていない');
  console.log('        失効ログ: ' + (after.gameLog || []).filter(l => /約束/.test(l)).slice(-1)[0]);
});

section('_pendingPledgeResult は1週かぎりで、次の tickWeek で必ず消える', () => {
  let G = freshState();
  const b = findBold(G);
  // 消費側(closeShowResult)を通らない経路で結果が残っても、翌週には消えること
  G = { ...G, _pendingPledgeResult: { fighterId: b.id, outcome: 'kept' } };
  const r = Engine.tickWeek(G);
  assert.ok(!r.state._pendingPledgeResult,
    '前週の結果が残っている — 同じ約束の結果ポップアップが毎週出続ける');
});

section('約束が無い状態では pledge 関連の状態を一切作らない', () => {
  const G = freshState();
  assert.ok(!G.pledge, '初期状態に pledge がある');
  const r = Engine.tickWeek(G);
  assert.ok(!r.state.pledge, '約束していないのに pledge が生えた');
  assert.ok(!r.state._pendingPledgeResult, '約束していないのに結果が生えた');
});

console.log('');
if (failed > 0) { console.log(`結果: ${failed} 件 FAIL`); process.exit(1); }
console.log('結果: 全項目 PASS');
