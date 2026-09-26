#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  tools/b3-guest-source-compare.js — 挑戦状(B3)の挑戦者の作り方の前後比較(2026-09-26 Keisuke 裁定「直す」)
//
//  挑戦者(他団体の選手)のゲストを
//    前: 挑戦状が届いた時点の写し event.challenger(能力・人気・特性だけ。体調・年齢・信頼・自己最高評価なし)
//    後: 興行の開催の時点の本物(挑戦してきた団体の最新のロスター。Engine.challengeRequest.getScheduledSingleChallenge)
//  から作ったときの、挑戦状の試合の勝率・挑戦者の怪我の率・予約の解除の数を、実プレイと同じ興行の処理
//  (Engine.show.finalize + app.js の hooks。test/helpers/b3-show.js)で数える。
//
//  標本: 各シードを headless で進め、S{from}〜S{to} の通常興行週(挑戦状を消化できる週)ごとに、前の週の状態で
//  挑戦状を作り(= 届いて受けた週)、その興行週に代表(自団体の OVR 上位3人)ごとに1試合ずつ前後の両方で通す。
//  試合の乱数は本体と同じく試合ごとの新品(rngSeed・季・週・左右の id から)。前後で同じ乱数なので、差は挑戦者の値だけから出る。
//
//  使い方: node tools/b3-guest-source-compare.js [シード,…=42,7919,15838] [開始季=2] [終了季=4]
// ══════════════════════════════════════════════════════════════════════════════

const path = require('path');
const { loadEngines, advanceUntil } = require(path.join(__dirname, '..', 'test', 'ui-walkthrough', 'fixtures', 'headless-sim'));
const { buildB3Event, makeBooking, runB3Show, clone } = require(path.join(__dirname, '..', 'test', 'helpers', 'b3-show'));

const seeds = (process.argv[2] || '42,7919,15838').split(',').map(Number).filter(Number.isFinite);
const fromSeason = Number(process.argv[3] || 2);
const toSeason = Number(process.argv[4] || 4);

loadEngines();

const tally = () => ({ n: 0, playerWin: 0, challengerWin: 0, draw: 0, challengerInjured: 0, repInjured: 0, mqSum: 0, noReserve: 0 });
const before = tally();
const after = tally();
let flipped = 0;
let paired = 0;
const cancelReasons = {};
const t0 = Date.now();

function add(t, run) {
  t.n += 1;
  const w = run.main.winner;
  if (w === 'left') t.playerWin += 1; else if (w === 'right') t.challengerWin += 1; else t.draw += 1;
  if (run.guestPost && run.guestPost.injury) t.challengerInjured += 1;
  const rep = run.fin.state.roster.find(f => f.id === run.mainMatch.left);
  if (rep && rep.injury) t.repInjured += 1; // 代表は出場の時点で健康(予約の条件)
  t.mqSum += run.main.mq || 0;
}

for (const seed of seeds) {
  const weeks = [];
  advanceUntil({
    seed,
    maxWeeks: 60 * (toSeason + 1),
    until: g => {
      if (g.season > toSeason) return true;
      if (g.season >= fromSeason && g.weekPhase === 'manage' && !g.offSeason) weeks.push(clone(g));
      return false;
    },
  });
  for (let i = 1; i < weeks.length; i += 1) {
    const show = weeks[i];
    if (!Engine.challengeRequest.isEligibleHomeShow(show)) continue;
    const accepted = weeks[i - 1];
    const event = buildB3Event(accepted);
    if (!event || !event.challenger) continue;
    const reps = show.roster.filter(f => !f.isRental && !f.injury && !f.forcedRest && !f.suspended)
      .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a)).slice(0, 3);
    for (const rep of reps) {
      const booking = makeBooking(event, rep.id, accepted);
      const old = runB3Show(show, booking, { guestMode: 'snapshot' });
      const now = runB3Show(show, booking, { guestMode: 'game' });
      if (!old.reserved) continue;
      add(before, old);
      if (!now.reserved) {
        after.noReserve += 1;
        const org = show.aiOrgs && show.aiOrgs[event.orgId];
        const real = org && (org.roster || []).find(f => f.id === event.challenger.id);
        const reason = !org ? '団体が無い' : !real ? '所属団体にいない(移籍・引退)' : real.injury ? '怪我' : real.forcedRest ? '休養' : real.suspended ? '謹慎' : 'その他';
        cancelReasons[reason] = (cancelReasons[reason] || 0) + 1;
        continue;
      }
      add(after, now);
      paired += 1;
      if (old.main.winner !== now.main.winner) flipped += 1;
    }
  }
}

const pct = (a, b) => (b > 0 ? `${(100 * a / b).toFixed(1)}%` : '-');
const row = (label, t) => console.log(`${label}  試合 ${t.n}  代表の勝ち ${pct(t.playerWin, t.n)}  挑戦者の勝ち ${pct(t.challengerWin, t.n)}  引き分け ${pct(t.draw, t.n)}  `
  + `挑戦者の怪我 ${pct(t.challengerInjured, t.n)}(${t.challengerInjured})  代表の怪我 ${pct(t.repInjured, t.n)}  平均評価 ${(t.mqSum / Math.max(1, t.n)).toFixed(1)}`);
console.log(`挑戦状(B3)の挑戦者の作り方 前後比較  シード ${seeds.join(',')}  S${fromSeason}〜S${toSeason}  (${((Date.now() - t0) / 1000).toFixed(1)}秒)`);
row('前(届いた時点の写し)', before);
row('後(開催の時点の本物)', after);
console.log(`予約の解除(後だけ。前は試合をしていた): ${after.noReserve} / ${before.n}  内訳 ${JSON.stringify(cancelReasons)}`);
console.log(`同じ組で勝敗が入れ替わった試合: ${flipped} / ${paired}`);
