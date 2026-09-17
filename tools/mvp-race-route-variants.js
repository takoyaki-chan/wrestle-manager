#!/usr/bin/env node
// MVPルート案の受動評価(v2・2026-09-17): tools/mvp-race-calibration.js record の記録に、案ごとの配点式を
// 同一状態で当てて MVP の顔ぶれがどう変わるかを見る。使い方: node tools/mvp-race-route-variants.js <cal.json> [...]
const fs = require('fs');
const os = require('os');
const path = require('path');
const files = process.argv.slice(2);
if (!files.length) files.push(path.join(os.tmpdir(), 'wm-mvp-cal', 'cal-100-42.json'));
const datasets = files.map(f => JSON.parse(fs.readFileSync(f, 'utf-8')).sort((a, b) => a.season - b.season));

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const bd = (r, k) => (r.breakdown && r.breakdown[k]) || 0;
const belt = r => (r.cap + r.def > 0 || r.hold || r.tHold || r.tDef > 0 || r.tWin > 0);

// ── 部品 ──
// 案1: 王座戦1勝の点 = 13 × 係数。gap=自分OVR−相手OVR(試合時点)、mq=その試合のMQ
const F = {
  flat: () => 1,
  gap: e => e.oppOv == null ? 1 : clamp(1.35 - 0.055 * (e.selfOv - e.oppOv), 0.4, 1.35),
  gapSoft: e => e.oppOv == null ? 1 : clamp(1.25 - 0.04 * (e.selfOv - e.oppOv), 0.5, 1.25),
  mq: e => e.mq == null ? 1 : clamp(1 + (e.mq - 76) / 40, 0.6, 1.4),
  both: e => (F.gap(e) + F.mq(e)) / 2,
  bothSoft: e => (F.gapSoft(e) + F.mq(e)) / 2,
};
const titlePart = (r, f) => {
  // 現行: title = tWin*11 + tDef*13 + hold8 / unified = (cap+def)*13 + hold12。勝利ぶんだけ係数付きに差し替える
  let delta = 0;
  r.tEv.forEach(e => { if (e.kind === 'tDef' || e.kind === 'uDef' || e.kind === 'uCap') delta += 13 * (f(e) - 1); });
  return delta;
};
const upsetPart = (r, p1, p2, minGap) => r.upsets.reduce((s, u) => s + (u[0] >= minGap ? (u[1] >= 2 ? p2 : p1) : 0), 0);
const popPart = (r, k, cap) => clamp(Math.max(0, r.popGain || 0) * k, 0, cap);
// 大会: 現行 春タッグ 8/4・秋対抗戦 1勝3+優勝7/準優勝3・JT 0 に対する上乗せ
const tourPart = (r, t) => (r.tag === 'champion' ? t.tag : r.tag === 'runnerUp' ? t.tag / 2 : 0)
  + (r.awWins || 0) * t.awWin + (r.aw === 'champion' ? t.aw : r.aw === 'runnerUp' ? t.aw / 2 : 0)
  + (r.jt === 'champion' ? t.jt : r.jt === 'runnerUp' ? t.jt / 2 : 0);
const T0 = { tag: 0, awWin: 0, aw: 0, jt: 0 };
const T1 = { tag: 8, awWin: 2, aw: 5, jt: 10 };    // 春タッグ16・秋 1勝5+優勝12・JT優勝10
const T2 = { tag: 16, awWin: 4, aw: 10, jt: 15 };  // 春タッグ24・秋 1勝7+優勝17・JT優勝15

const V = {
  '現行 v1.37': r => 0,
  '案1 格のみ': r => titlePart(r, F.gap),
  '案1 内容(MQ)のみ': r => titlePart(r, F.mq),
  '案1 格+内容': r => titlePart(r, F.both),
  '案1 格+内容(緩)': r => titlePart(r, F.bothSoft),
  '格上撃破 3/8点(差≥5)': r => upsetPart(r, 3, 8, 5),
  '人気の伸び×0.5(上限12)': r => popPart(r, 0.5, 12),
  '大会 T1': r => tourPart(r, T1),
  '大会 T2': r => tourPart(r, T2),
  '案1+撃破3/8': r => titlePart(r, F.both) + upsetPart(r, 3, 8, 5),
  '案1+撃破3/8+伸び': r => titlePart(r, F.both) + upsetPart(r, 3, 8, 5) + popPart(r, 0.5, 12),
  '全部 (T1)': r => titlePart(r, F.both) + upsetPart(r, 3, 8, 5) + popPart(r, 0.5, 12) + tourPart(r, T1),
  '全部 (T2)': r => titlePart(r, F.both) + upsetPart(r, 3, 8, 5) + popPart(r, 0.5, 12) + tourPart(r, T2),
  '全部 (T2)+撃破4/10': r => titlePart(r, F.both) + upsetPart(r, 4, 10, 5) + popPart(r, 0.5, 12) + tourPart(r, T2),
  '全部 (T2) 案1=格のみ': r => titlePart(r, F.gap) + upsetPart(r, 3, 8, 5) + popPart(r, 0.5, 12) + tourPart(r, T2),
};

console.log('案'.padEnd(26), '| ベルト無しMVP | 統一絡み | 前年と同じ | 最長連続 | MVP人数 | 平均年齢 | 1-2位差(平均) | MVPの加点内訳 平均(案1/撃破/伸び/大会)');
for (const [name, fn] of Object.entries(V)) {
  let n = 0, free = 0, uni = 0, repeat = 0, maxStreak = 1, ages = 0, margin = 0;
  const uniq = new Set(); const parts = [0, 0, 0, 0];
  for (const data of datasets) {
    let prev = null, cur = 1;
    for (const d of data) {
      const sc = d.rows.map(r => ({ r, s: r.pts + r.ppvSynth + fn(r) })).sort((a, b) => b.s - a.s);
      const top = sc[0].r; n++;
      if (!belt(top)) free++;
      if (top.cap + top.def > 0 || top.hold) uni++;
      if (prev === top.id) { repeat++; cur++; maxStreak = Math.max(maxStreak, cur); } else cur = 1;
      prev = top.id; uniq.add(top.id); ages += top.age || 0; margin += sc[1] ? sc[0].s - sc[1].s : 0;
      parts[0] += titlePart(top, F.both); parts[1] += upsetPart(top, 3, 8, 5); parts[2] += popPart(top, 0.5, 12); parts[3] += tourPart(top, T2);
    }
  }
  console.log(name.padEnd(26), '|', String(free).padStart(5), '/', n, '   |', String(uni).padStart(5), '   |', String(repeat).padStart(6), '    |', String(maxStreak).padStart(5), '   |',
    String(uniq.size).padStart(5), '  |', (ages / n).toFixed(1).padStart(6), '  |', (margin / n).toFixed(1).padStart(8), '     |', parts.map(p => (p / n).toFixed(1)).join(' / '));
}
