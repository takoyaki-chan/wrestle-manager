#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  tools/rest-marker-leak-compare.js — 自団体の休養の印が他団体・フリーの選手に残る件の計測(2026-09-26 Keisuke 裁定「直す」)
//
//  休養の印(休養願いの forcedRest・休暇辞令の onLeave・謹慎 suspended)は自団体の選手にだけ付き、自団体の週次処理と
//  興行の開始でしか外れない。自団体を離れた(放出・移籍・契約満了・引き抜き・突然の退団)選手が印を持ったまま他団体・
//  フリーに移ると、誰も外さないまま何十週も残る。直訴(Engine.challengeRequest)の発火の判定と予約はこの印を見るので、
//  出られる他団体の選手を出られない扱いにしていた。
//
//  数えるもの(各シードを headless で S{to} の終わりまで進め、毎週の頭の G を読む):
//   ・印の残り: 他団体のロスター・フリーの選手のうち印を持つ選手の延べ週数・人数・最長の週数
//   ・直訴の判定への効き目: 直訴の抽選週ごとに、同じ状態で Engine.challengeRequest.processWeekly を
//     「そのまま」と「他団体・フリーの選手の印を外した写し」の両方で走らせ、選ばれる直訴が変わった週を数える
//     (出なくなった/別の組になった)。発起人・相手のどちらが印を持っていたかも数える
//   ・直訴の件数: 直訴が立った回数(順方向・逆方向)。headless は直訴に答えないので、立ったらすぐ断る(rejectPending)
//     ことにして次の抽選を塞がない(前後とも同じ扱い)
//
//  使い方: node tools/rest-marker-leak-compare.js [シード,…=42,7919,15838] [終了季=6]
//  修正の前後で同じコマンドを流して比べる(軌道は修正の後で変わるので、件数は集計で比べる)
// ══════════════════════════════════════════════════════════════════════════════

const path = require('path');
const { loadEngines, advanceUntil } = require(path.join(__dirname, '..', 'test', 'ui-walkthrough', 'fixtures', 'headless-sim'));

const seeds = (process.argv[2] || '42,7919,15838').split(',').map(Number).filter(Number.isFinite);
const toSeason = Number(process.argv[3] || 6);

loadEngines();

const MARKERS = ['forcedRest', 'onLeave', 'suspended'];
const hasMarker = f => !!f && MARKERS.some(k => !!f[k]);
const strip = f => {
  if (!hasMarker(f)) return f;
  const c = { ...f };
  MARKERS.forEach(k => { delete c[k]; });
  return c;
};
const outsiders = G => [
  ...Object.values(G.aiOrgs || {}).flatMap(o => (o && o.roster) || []),
  ...(G.freeAgents || []),
];
const stripOutsiders = G => ({
  ...G,
  aiOrgs: Object.fromEntries(Object.entries(G.aiOrgs || {}).map(([id, o]) => [id, o ? { ...o, roster: (o.roster || []).map(strip) } : o])),
  freeAgents: (G.freeAgents || []).map(strip),
});
const pendingKey = p => (p ? `${p._inverse ? 'inv' : 'fwd'}:${p.selfId}>${p.otherId}` : 'none');

const total = {
  weeks: 0, markerFighterWeeks: 0, markerFighters: 0, maxStreak: 0, byKey: {},
  samplingWeeks: 0, crChanged: 0, crBlocked: 0, crSwapped: 0, crUnblockedByStrip: 0,
  staleOnRequester: 0, staleOnOpponent: 0,
  crIssued: 0, crIssuedInverse: 0,
  ratingOrgWeeks: 0, ratingDeltaSum: 0, ratingDeltaMax: 0, rankOrderWeeks: 0,
};
const perSeed = [];
const t0 = Date.now();

for (const seed of seeds) {
  const streak = new Map();   // id → 続いている週数
  const everMarked = new Set();
  let maxStreak = 0;
  let lastPendingKey = 'none';
  const row = { seed, markerFighterWeeks: 0, markerFighters: 0, maxStreak: 0, crChanged: 0, crIssued: 0, crIssuedInverse: 0 };
  advanceUntil({
    seed,
    maxWeeks: 60 * (toSeason + 1),
    until: G => {
      if (G.season > toSeason) return true;
      total.weeks += 1;
      // ── 印の残り ──
      const marked = outsiders(G).filter(hasMarker);
      const seen = new Set();
      marked.forEach(f => {
        seen.add(f.id);
        everMarked.add(f.id);
        const n = (streak.get(f.id) || 0) + 1;
        streak.set(f.id, n);
        if (n > maxStreak) maxStreak = n;
        MARKERS.forEach(k => { if (f[k]) total.byKey[k] = (total.byKey[k] || 0) + 1; });
      });
      [...streak.keys()].forEach(id => { if (!seen.has(id)) streak.delete(id); });
      row.markerFighterWeeks += marked.length;

      // ── 団体の評価(層の厚み getDepthProfile が印の選手を出られない選手として数える)への効き目 ──
      if (marked.length > 0) {
        const a = Engine.ranking.updateRankings(G);
        const b = Engine.ranking.updateRankings(stripOutsiders(G));
        const byOrg = list => Object.fromEntries(list.map(e => [e.orgId, e.rating]));
        const ra = byOrg(a); const rb = byOrg(b);
        Object.keys(ra).forEach(orgId => {
          const d = (rb[orgId] || 0) - (ra[orgId] || 0);
          if (d !== 0) { total.ratingOrgWeeks += 1; total.ratingDeltaSum += d; total.ratingDeltaMax = Math.max(total.ratingDeltaMax, d); }
        });
        if (a.map(e => e.orgId).join() !== b.map(e => e.orgId).join()) total.rankOrderWeeks += 1;
      }

      // ── 直訴の件数(立ったらすぐ断って次の抽選を塞がない) ──
      const cr = G.challengeRequest;
      const p = cr && cr.pendingThisWeek;
      const key = pendingKey(p);
      if (p && key !== lastPendingKey) {
        row.crIssued += 1;
        if (p._inverse) row.crIssuedInverse += 1;
      }
      lastPendingKey = key;
      if (p) {
        // advanceUntil の G をその場で書き換える(計測専用。前後とも同じ扱い)
        G.challengeRequest = Engine.challengeRequest.rejectPending(G).challengeRequest;
        lastPendingKey = 'none';
      }

      // ── 直訴の判定への効き目(同じ状態で、印あり/印を外した写しの両方で抽選する) ──
      if (G.weekPhase === 'manage' && Engine.challengeRequest._isSamplingWeek(G) && (G.orgPop || 0) >= 15 && G.relationships) {
        total.samplingWeeks += 1;
        const rngFor = () => Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xC4A1));
        const asIs = Engine.challengeRequest.processWeekly(G, rngFor()).challengeRequest.pendingThisWeek;
        const stripped = Engine.challengeRequest.processWeekly(stripOutsiders(G), rngFor()).challengeRequest.pendingThisWeek;
        if (pendingKey(asIs) !== pendingKey(stripped)) {
          row.crChanged += 1;
          if (!asIs) total.crBlocked += 1; else if (!stripped) total.crUnblockedByStrip += 1; else total.crSwapped += 1;
          if (stripped) {
            const all = [...outsiders(G), ...(G.roster || [])];
            const find = id => all.find(f => f && f.id === id);
            if (hasMarker(find(stripped.selfId)) && stripped._inverse) total.staleOnRequester += 1;
            if (hasMarker(find(stripped.otherId)) && !stripped._inverse) total.staleOnOpponent += 1;
          }
        }
      }
      return false;
    },
  });
  row.markerFighters = everMarked.size;
  row.maxStreak = maxStreak;
  perSeed.push(row);
  total.markerFighterWeeks += row.markerFighterWeeks;
  total.markerFighters += row.markerFighters;
  total.maxStreak = Math.max(total.maxStreak, maxStreak);
  total.crChanged += row.crChanged;
  total.crIssued += row.crIssued;
  total.crIssuedInverse += row.crIssuedInverse;
}

console.log(`rest-marker-leak-compare  seeds=${seeds.join(',')}  S1〜S${toSeason}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
perSeed.forEach(r => console.log(
  `  seed ${r.seed}: 印の残り 延べ${r.markerFighterWeeks}週・${r.markerFighters}人・最長${r.maxStreak}週 / 直訴が変わった抽選週 ${r.crChanged} / 直訴 ${r.crIssued}件(逆方向 ${r.crIssuedInverse})`));
console.log(`  合計: 週 ${total.weeks} / 印の残り 延べ${total.markerFighterWeeks}週・${total.markerFighters}人・最長${total.maxStreak}週 ${JSON.stringify(total.byKey)}`);
console.log(`  直訴の抽選週 ${total.samplingWeeks}: 印で直訴が変わった ${total.crChanged}(出なくなった ${total.crBlocked} / 別の組 ${total.crSwapped} / 印を外すと出なくなる ${total.crUnblockedByStrip})`
  + ` — 印を外した側で選ばれた直訴の発起人(逆方向)に印 ${total.staleOnRequester}・相手(順方向)に印 ${total.staleOnOpponent}`);
console.log(`  直訴が立った回数 ${total.crIssued}(逆方向 ${total.crIssuedInverse})`);
console.log(`  団体の評価: 印で評価が下がっていた団体×週 ${total.ratingOrgWeeks}(平均 -${total.ratingOrgWeeks ? (total.ratingDeltaSum / total.ratingOrgWeeks).toFixed(1) : 0}・最大 -${total.ratingDeltaMax})`
  + ` / 順位の並びが変わっていた週 ${total.rankOrderWeeks}`);
