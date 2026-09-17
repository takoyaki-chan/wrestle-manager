const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(p * (s.length - 1))] : NaN; };
const qs = a => [.1, .25, .5, .75, .9].map(p => q(a, p)).join(' / ') + '  (n=' + a.length + ')';
const all = data.flatMap(d => d.rows);

const tdef = all.flatMap(r => r.tEv.filter(e => e.kind === 'tDef' && e.oppOv != null));
const udef = all.flatMap(r => r.tEv.filter(e => (e.kind === 'uDef' || e.kind === 'uCap') && e.oppOv != null));
console.log('団体王座 防衛: 王者OVR−挑戦者OVR  10/25/50/75/90% =', qs(tdef.map(e => e.selfOv - e.oppOv)));
console.log('団体王座 防衛: MQ                        =', qs(tdef.map(e => e.mq)));
console.log('統一王座戦 勝者OVR−敗者OVR               =', qs(udef.map(e => e.selfOv - e.oppOv)));
console.log('統一王座戦 MQ                            =', qs(udef.map(e => e.mq)));
const buckets = [[-99, 0], [0, 5], [5, 10], [10, 15], [15, 99]];
console.log('団体王座防衛の格差帯別 件数/平均MQ:');
buckets.forEach(([lo, hi]) => { const b = tdef.filter(e => e.selfOv - e.oppOv >= lo && e.selfOv - e.oppOv < hi); console.log('   差', lo, '〜', hi, ':', b.length, '件  MQ平均', (b.reduce((s, e) => s + e.mq, 0) / Math.max(1, b.length)).toFixed(1)); });

// MVPの防衛の中身
const mvps = data.map(d => d.rows.slice().sort((a, b) => (b.pts + b.ppvSynth) - (a.pts + a.ppvSynth))[0]);
const mvpDef = mvps.flatMap(r => r.tEv.filter(e => e.oppOv != null));
console.log('\n現MVPの王座戦(団体+統一): 格差 =', qs(mvpDef.map(e => e.selfOv - e.oppOv)), ' MQ =', qs(mvpDef.map(e => e.mq)));

// 格上撃破
const up = all.map(r => r.upsets);
const cnt = (r, g, t) => r.upsets.filter(u => u[0] >= g && u[1] >= t).length;
for (const [g, t] of [[3, 1], [5, 1], [8, 1], [5, 2], [8, 2], [10, 2]]) {
  const perSeasonMax = data.map(d => Math.max(0, ...d.rows.map(r => cnt(r, g, t))));
  const mvpC = mvps.map(r => cnt(r, g, t));
  console.log(`格上撃破(差≥${g}, tier≥${t}): 季内最多 =`, qs(perSeasonMax), ' / 現MVP本人 =', qs(mvpC));
}
console.log('1季あたりシングル試合数 中央値:', q(data.map(d => d.matchCount), .5));

// 伸び
console.log('\n人気の伸び(季内): 全候補 =', qs(all.map(r => r.popGain)), ' / 現MVP =', qs(mvps.map(r => r.popGain)));
console.log('季内最大の人気伸び =', qs(data.map(d => Math.max(...d.rows.map(r => r.popGain)))));
const rankMoves = data.flatMap(d => { const seen = {}; d.rows.forEach(r => { if (r.orgRankPrev && r.orgRank) seen[r.org] = r.orgRankPrev - r.orgRank; }); return Object.values(seen); });
console.log('団体順位の変動(+が上昇) 分布:', JSON.stringify(rankMoves.reduce((m, v) => { m[v] = (m[v] || 0) + 1; return m; }, {})));

// 大会
const jtCh = all.filter(r => r.jt === 'champion');
console.log('\nJT優勝者の総点(現行) =', qs(jtCh.map(r => Math.round(r.pts + r.ppvSynth))), ' そのときのMVP点 =', qs(mvps.map(r => Math.round(r.pts + r.ppvSynth))));
const tagCh = all.filter(r => r.tag === 'champion'), awCh = all.filter(r => r.aw === 'champion');
console.log('春タッグ優勝者の総点 =', qs(tagCh.map(r => Math.round(r.pts + r.ppvSynth))));
console.log('秋対抗戦 優勝メンバーの総点 =', qs(awCh.map(r => Math.round(r.pts + r.ppvSynth))), ' 個人勝数 =', qs(awCh.map(r => r.awWins)));
