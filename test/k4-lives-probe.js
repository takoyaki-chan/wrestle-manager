#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-4 計測版(設計書 docs/fun-audit-v0.1/k4-separate-lives-design.md §8「auto-sim の計測項目」)
//
//  test/auto-sim.js を同じプロセスで走らせ、auto-sim の差し込み口(global.__WM_AUTOSIM_HOOKS)
//  から毎週の状態を覗く。src もシミュレーションの乱数も変えない(読むだけ。印付けは選手オブジェクトに
//  計測用の欄 _k4p を1つ足すのみ — 状態の複製 {...f} で引き継がれるので「同じ人生の間は同じ印」、
//  テンプレートから作り直された選手には印が無い、を転生の検出に使う)。
//
//  使い方:
//    node test/k4-lives-probe.js [季数=40] [シード=42] [--load-repair]
//      --load-repair : 各季の第5週に Engine.saveDoctor.repairOnLoad をかける変種(ロード時修復の経路)
//    旧版との比較: $env:WM_SOURCE_REF='<commit>'; node test/k4-lives-probe.js 40 42
//
//  出す数字:
//    - 供給7項目(S11以降): 休眠プール(第1週)・ドラフト前の17-18歳・スカウト候補・FA・AIロスター合計と
//      S/A/B別・自団体ロスター(中央値/最小。AI合計は10%点も)
//    - 転生: 前の人生でデビュー済みだったIDが新しい選手として出てきた件数(間隔別・引退を経ない分)
//    - デビュー済み→休眠プール直行(引退を経ない作り直しの入口)
//    - 関係値の引き継ぎ: 転生の関所(Engine.life.beginNewLife)の直後と、転生後の初見時点に残る
//      §3-A の保存先への参照
//    - フリーのまま引退: 人数/季・年齢・殿堂判定と記事に載った人数
//    - ロード時修復(--load-repair): 戻ったIDの数と、関所を通った数
// ══════════════════════════════════════════════════════════════════════════════

const path = require('path');
const { findLiveRefs } = require('./helpers/k4-live-stores');

const argv = process.argv.slice(2);
const flags = argv.filter(a => a.startsWith('--'));
const pos = argv.filter(a => !a.startsWith('--'));
const SEASONS = parseInt(pos[0], 10) || 40;
const SEED = pos[1] != null ? parseInt(pos[1], 10) : 42;
const LOAD_REPAIR = flags.includes('--load-repair');
const FROM_SEASON = 11; // 供給は S11 以降(設計書 §1-2 と同じ窓)

const P = {
  supply: { dormant: [], youth: [], scout: [], fa: [], faDebuted: [], aiTotal: [], aiS: [], aiA: [], aiB: [], own: [] },
  seen: { week1: new Set(), youth: new Set(), scout: new Set(), repair: new Set() },
  rebirths: [],          // { id, gap, retiredSeen, carried(初見時の参照) }
  leaks: [],             // デビュー済み→休眠プール直行 { id, season, from }
  gate: { calls: 0, carried: 0, carriedStores: {}, debutedPrev: 0 },
  faRet: { seasons: new Set(), total: 0, ages: [], hofJudged: 0, inducted: 0, newsQueued: 0, printed: 0, pending: new Map() },
  repair: { runs: 0, returned: 0, viaGate: 0 },
};
const lineage = new Map(); // id -> { lin, debuted, lastSeenSeason, retiredSeen, where }
let linCounter = 0;
let prevDormant = new Set();

const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
const minOf = a => (a.length ? Math.min(...a) : null);
const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) * p)]; };

function eachFighter(G, fn) {
  (G.roster || []).forEach(f => f && fn(f, 'player'));
  Object.entries(G.aiOrgs || {}).forEach(([orgId, org]) => (org && org.roster || []).forEach(f => f && fn(f, orgId)));
  (G.freeAgents || []).forEach(f => f && fn(f, 'fa'));
  (G.scoutCandidates || []).forEach(f => f && fn(f, 'scout'));
}

function collectStories(np, out = []) {
  if (!np || typeof np !== 'object') return out;
  if (Array.isArray(np)) { np.forEach(x => collectStories(x, out)); return out; }
  if (np.type && np.characterId != null) out.push(np);
  Object.keys(np).forEach(k => { if (k !== '_recompose' && np[k] && typeof np[k] === 'object') collectStories(np[k], out); });
  return out;
}

function afterLoad() {
  const E = global.Engine;
  // 転生の関所(S2以降にある。旧版では無いので何もしない)
  if (E.life && typeof E.life.beginNewLife === 'function') {
    const orig = E.life.beginNewLife;
    E.life.beginNewLife = function probeBeginNewLife(state, id) {
      const out = orig.apply(this, arguments);
      P.gate.calls += 1;
      const prev = lineage.get(Number(id));
      if (prev && prev.debuted) P.gate.debutedPrev += 1;
      const refs = findLiveRefs(out, Number(id));
      if (Object.keys(refs).length > 0) {
        P.gate.carried += 1;
        Object.keys(refs).forEach(k => { P.gate.carriedStores[k] = (P.gate.carriedStores[k] || 0) + 1; });
      }
      return out;
    };
  }
  // フリーのまま引退(S1以降)
  if (E.util && typeof E.util.retireUnsignedFreeAgents === 'function') {
    const orig = E.util.retireUnsignedFreeAgents;
    E.util.retireUnsignedFreeAgents = function probeRetireUnsigned(state) {
      const out = orig.apply(this, arguments);
      (out.retired || []).forEach(r => {
        P.faRet.total += 1;
        P.faRet.seasons.add(state.season);
        if (r.age != null) P.faRet.ages.push(r.age);
        if (r.hofJudged) P.faRet.hofJudged += 1;
        if (r.inducted) P.faRet.inducted += 1;
        if (r.newsQueued) {
          P.faRet.newsQueued += 1;
          P.faRet.pending.set(Number(r.id), state.season);
        }
      });
      return out;
    };
  }
  if (LOAD_REPAIR && E.saveDoctor && typeof E.saveDoctor.repairOnLoad === 'function') {
    // 観測側から呼ぶ(下の observe)。ここでは何もしない
  }
}

function observe(G) {
  const season = G.season || 1;

  // ── ロード時修復の変種 ──
  if (LOAD_REPAIR && !G.offSeason && G.week === 5 && !P.seen.repair.has(season)) {
    P.seen.repair.add(season);
    const retiredBefore = new Set((G.retiredIds || []).map(Number));
    const serialBefore = { ...(G.lifeSerial || {}) };
    const rep = global.Engine.saveDoctor.repairOnLoad(G);
    P.repair.runs += 1;
    if (rep && rep.changed) {
      const after = rep.state;
      const returned = (after.dormantPool || []).map(e => Number(e.id))
        .filter(id => retiredBefore.has(id) && !(after.retiredIds || []).map(Number).includes(id));
      P.repair.returned += returned.length;
      returned.forEach(id => {
        const b = serialBefore[id] != null ? serialBefore[id] : 1;
        const a = (after.lifeSerial || {})[id];
        if (a != null && a === b + 1) P.repair.viaGate += 1;
      });
      G = after;
    }
  }

  // ── 引退枠に入ったID ──
  (G.retiredIds || []).forEach(id => { const l = lineage.get(Number(id)); if (l) l.retiredSeen = true; });

  // ── 選手オブジェクトの系譜(転生の検出) ──
  eachFighter(G, (f, where) => {
    const id = Number(f.id);
    const inOrg = where !== 'fa' && where !== 'scout';
    if (f._k4p == null) {
      const prev = lineage.get(id);
      if (prev && prev.debuted) {
        const refs = findLiveRefs(G, id);
        P.rebirths.push({ id, season, gap: season - prev.lastSeenSeason, retiredSeen: !!prev.retiredSeen,
          carried: Object.keys(refs).length > 0, carriedStores: Object.keys(refs), firstWhere: where });
      }
      linCounter += 1;
      f._k4p = linCounter;
      lineage.set(id, { lin: linCounter, debuted: inOrg, lastSeenSeason: season, retiredSeen: false, where });
    } else {
      const l = lineage.get(id);
      if (l && l.lin === f._k4p) {
        if (inOrg) l.debuted = true;
        l.lastSeenSeason = season;
        l.where = where;
      }
    }
  });

  // ── デビュー済み→休眠プール直行 ──
  const dormantNow = new Set((G.dormantPool || []).map(e => Number(e.id)));
  dormantNow.forEach(id => {
    if (prevDormant.has(id)) return;
    const l = lineage.get(id);
    if (l && l.debuted && !l.retiredSeen) P.leaks.push({ id, season, from: l.where });
  });
  prevDormant = dormantNow;

  // ── 供給(S11以降) ──
  if (season >= FROM_SEASON) {
    if (!G.offSeason && G.week === 1 && !P.seen.week1.has(season)) {
      P.seen.week1.add(season);
      P.supply.dormant.push((G.dormantPool || []).length);
      P.supply.fa.push((G.freeAgents || []).length);
      P.supply.faDebuted.push((G.freeAgents || []).filter(f => f && f.careerStage !== 'prospect').length);
      const tierOf = orgId => { const o = (global.RIVAL_ORGS || []).find(x => x.id === orgId); return o ? o.tier : null; };
      let total = 0; const byTier = { S: 0, A: 0, B: 0 };
      Object.entries(G.aiOrgs || {}).forEach(([orgId, org]) => {
        const n = ((org && org.roster) || []).length;
        total += n;
        const t = tierOf(orgId);
        if (t && byTier[t] != null) byTier[t] += n;
      });
      P.supply.aiTotal.push(total); P.supply.aiS.push(byTier.S); P.supply.aiA.push(byTier.A); P.supply.aiB.push(byTier.B);
      P.supply.own.push((G.roster || []).filter(f => f && !f.isRental).length);
    }
    if (G.offSeason && G.offWeek === 2 && !P.seen.youth.has(season)) {
      P.seen.youth.add(season);
      P.supply.youth.push((G.dormantPool || []).filter(e => { const a = e.age || 17; return a >= 17 && a <= 18; }).length);
    }
    if (G.weekPhase === 'scoutEvent' && G.scoutEventType === 'offseason' && !P.seen.scout.has(season)) {
      P.seen.scout.add(season);
      P.supply.scout.push((G.scoutCandidates || []).length);
    }
  }

  // ── フリーのまま引退の記事が紙面に出たか ──
  if (P.faRet.pending.size > 0 && G.weeklyNewspaper) {
    collectStories(G.weeklyNewspaper).forEach(st => {
      const id = Number(st.characterId);
      if (P.faRet.pending.has(id) && /Retirement$|^retirementDeclare$/.test(st.type)) {
        P.faRet.printed += 1;
        P.faRet.pending.delete(id);
      }
    });
    // 翌季の第3週を過ぎても出なかったものは「載らなかった」で打ち切る
    P.faRet.pending.forEach((s0, id) => { if (season > s0 + 1 || (season === s0 + 1 && !G.offSeason && G.week > 3)) P.faRet.pending.delete(id); });
  }
  return G;
}

let finalG = null;
function final(G) { finalG = G; }

function report() {
  const S = P.supply;
  const row = (label, a, extra) => `  ${label.padEnd(22)} 中央値 ${String(median(a)).padStart(3)} / 最小 ${String(minOf(a)).padStart(3)}${extra || ''}  (n=${a.length})`;
  const lines = [];
  lines.push('');
  lines.push(`=== K-4 計測版: ${SEASONS}季・シード${SEED}${LOAD_REPAIR ? '・ロード時修復あり' : ''}${process.env.WM_SOURCE_REF ? `・src=${process.env.WM_SOURCE_REF}` : ''} ===`);
  lines.push(`[供給] S${FROM_SEASON}以降`);
  lines.push(row('休眠プール(第1週)', S.dormant));
  lines.push(row('ドラフト前の17-18歳', S.youth));
  lines.push(row('スカウト候補(オフ)', S.scout));
  lines.push(row('FA(第1週)', S.fa, `  うちデビュー済み 中央値 ${median(S.faDebuted)}`));
  lines.push(row('AIロスター合計', S.aiTotal, ` / 10%点 ${pct(S.aiTotal, 0.1)}`));
  lines.push(`  ${'AI S/A/B'.padEnd(22)} 中央値 ${median(S.aiS)}/${median(S.aiA)}/${median(S.aiB)}  最小 ${minOf(S.aiS)}/${minOf(S.aiA)}/${minOf(S.aiB)}`);
  lines.push(row('自団体ロスター', S.own));
  const rb = P.rebirths;
  const noRetire = rb.filter(r => !r.retiredSeen).length;
  const gap01 = rb.filter(r => r.gap <= 1).length;
  lines.push(`[転生] 前の人生でデビュー済みのIDの作り直し: ${rb.length}件(間隔0〜1季 ${gap01} / 引退枠を経ない ${noRetire})`);
  lines.push(`  初見時点で §3-A の保存先に参照が残っていた: ${rb.filter(r => r.carried).length}件`);
  const byStore = {};
  rb.filter(r => r.carried).forEach(r => r.carriedStores.forEach(k => { byStore[k] = (byStore[k] || 0) + 1; }));
  if (Object.keys(byStore).length) lines.push(`    保存先別: ${Object.entries(byStore).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' / ')}`);
  const firstWhere = {};
  rb.forEach(r => { firstWhere[r.firstWhere] = (firstWhere[r.firstWhere] || 0) + 1; });
  lines.push(`    初見の場所: ${Object.entries(firstWhere).map(([k, n]) => `${k} ${n}`).join(' / ') || '-'}`);
  lines.push(`[引退を経ない作り直しの入口] デビュー済み→休眠プール直行: ${P.leaks.length}件`);
  if (P.leaks.length) {
    const from = {};
    P.leaks.forEach(l => { from[l.from] = (from[l.from] || 0) + 1; });
    lines.push(`    直前の居場所: ${Object.entries(from).map(([k, n]) => `${k} ${n}`).join(' / ')}`);
  }
  if (global.Engine.life && typeof global.Engine.life.beginNewLife === 'function') {
    lines.push(`[転生の関所] beginNewLife ${P.gate.calls}回(前の人生デビュー済み ${P.gate.debutedPrev}) / 関所の直後に参照が残った ${P.gate.carried}回`
      + (P.gate.carried ? `  ${JSON.stringify(P.gate.carriedStores)}` : ''));
  } else {
    lines.push('[転生の関所] (このsrcには Engine.life.beginNewLife が無い)');
  }
  if (global.Engine.util && typeof global.Engine.util.retireUnsignedFreeAgents === 'function') {
    const F = P.faRet;
    const perSeason = SEASONS > 0 ? (F.total / SEASONS).toFixed(2) : '-';
    lines.push(`[フリーのまま引退] ${F.total}人(${perSeason}人/季) 年齢中央値 ${median(F.ages)} / 22歳以下 ${F.ages.filter(a => a <= 22).length}人`);
    lines.push(`  殿堂判定 ${F.hofJudged}人(うち殿堂入り ${F.inducted}) / 記事を積んだ ${F.newsQueued}人 → 紙面に出た ${F.printed}人`);
  } else {
    lines.push('[フリーのまま引退] (このsrcには無い)');
  }
  if (LOAD_REPAIR) {
    lines.push(`[ロード時修復] ${P.repair.runs}回 / 戻ったID ${P.repair.returned} / 関所を通った ${P.repair.viaGate}`);
  }
  if (finalG) {
    const rr = ((finalG.relationshipHistory || {}).retiredRivalries || []);
    const lifeEnd = rr.filter(e => e && e.reason === 'lifeEnd');
    lines.push(`[最終状態] S${finalG.season} retiredRivalries ${rr.length}件(うち lifeEnd ${lifeEnd.length}件・${Math.round(JSON.stringify(lifeEnd).length / 1024)}KB)`
      + ` / lifeSerial の2以上 ${Object.values(finalG.lifeSerial || {}).filter(n => n >= 2).length}ID`);
  }
  console.log(lines.join('\n'));
}

global.__WM_AUTOSIM_HOOKS = { afterLoad, observe, final };
process.on('exit', report);
process.argv = [process.argv[0], path.join(__dirname, 'auto-sim.js'), String(SEASONS), String(SEED)];
require('./auto-sim.js');
