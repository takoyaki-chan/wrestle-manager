// MVPルート案の受動評価: 記録済みの同一状態に、案ごとの加点式を当てて MVP の顔ぶれがどう変わるかを見る
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8')).sort((a, b) => a.season - b.season);
const bd = (r, k) => (r.breakdown && r.breakdown[k]) || 0;
const belt = r => (r.cap + r.def > 0 || r.hold || r.tHold || r.tDef > 0 || r.tWin > 0);

// 案: それぞれ row と文脈(prevStreak)から加点(差分)を返す
const VARIANTS = {
  'v2(現行1.37)': () => 0,
  'P1 躍進 OVR伸び×6': r => Math.max(0, r.ovrGain) * 6,
  'P1 躍進 OVR伸び×10': r => Math.max(0, r.ovrGain) * 10,
  'P2 名勝負 mq×2': r => bd(r, 'mq'),
  'P2 名勝負 mq×3': r => bd(r, 'mq') * 2,
  'P4 連続MVP疲れ -20/年(上限-60)': (r, ctx) => -Math.min(60, 20 * (ctx.streak[r.id] || 0)),
  'P4 連続MVP疲れ -30/年(上限-90)': (r, ctx) => -Math.min(90, 30 * (ctx.streak[r.id] || 0)),
  'P1×6 + P2×2': r => Math.max(0, r.ovrGain) * 6 + bd(r, 'mq'),
  'P1×6 + P2×2 + P4-20': (r, ctx) => Math.max(0, r.ovrGain) * 6 + bd(r, 'mq') - Math.min(60, 20 * (ctx.streak[r.id] || 0)),
  'P1×10 + P2×3 + P4-30': (r, ctx) => Math.max(0, r.ovrGain) * 10 + bd(r, 'mq') * 2 - Math.min(90, 30 * (ctx.streak[r.id] || 0)),
};

console.log('案'.padEnd(34), '| ベルト無しMVP | 統一絡みMVP | 前年と同じ | 最長連続 | MVP経験者数 | MVP平均年齢');
for (const [name, fn] of Object.entries(VARIANTS)) {
  const ctx = { streak: {} };
  let free = 0, uni = 0, repeat = 0, maxStreak = 1, cur = 1, prev = null, ages = 0;
  const uniq = new Set();
  for (const d of data) {
    const top = d.rows.map(r => ({ r, s: r.pts + r.ppvSynth + fn(r, ctx) })).sort((a, b) => b.s - a.s)[0].r;
    if (!belt(top)) free++;
    if (top.cap + top.def > 0 || top.hold) uni++;
    if (prev === top.id) { repeat++; cur++; maxStreak = Math.max(maxStreak, cur); } else cur = 1;
    ctx.streak = { [top.id]: (prev === top.id ? (ctx.streak[top.id] || 0) : 0) + 1 };
    prev = top.id; uniq.add(top.id); ages += top.age || 0;
  }
  console.log(name.padEnd(34), '|', String(free).padStart(6), '/', data.length, '  |', String(uni).padStart(5), '      |', String(repeat).padStart(5), '     |', String(maxStreak).padStart(4), '    |', String(uniq.size).padStart(6), '     |', (ages / data.length).toFixed(1));
}
// 参考: ベルト無し勢の ovrGain 分布
const gains = data.map(d => Math.max(...d.rows.filter(r => !belt(r)).map(r => r.ovrGain || 0)));
gains.sort((a, b) => a - b);
console.log('\nベルト無し上位候補の季内OVR伸び最大: 中央値', gains[Math.floor(gains.length / 2)], ' 90%', gains[Math.floor(gains.length * .9)], ' 最大', gains[gains.length - 1]);
const mg = data.map(d => { const t = d.rows[0]; return t.ovrGain || 0; }).sort((a, b) => a - b);
console.log('現MVPの季内OVR伸び: 中央値', mg[Math.floor(mg.length / 2)], ' 90%', mg[Math.floor(mg.length * .9)]);
