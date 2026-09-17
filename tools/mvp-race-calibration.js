#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════
//  MVPレース配点の較正器(受動ペアプローブ) — 2026-09-17
//
//  使い方:
//    node tools/mvp-race-calibration.js record 100 42      # auto-simを1本回し、表彰時点の全候補の内訳をJSONへ
//    node tools/mvp-race-calibration.js grid <json> [...]  # 記録済みJSONに候補配点グリッドを当てて比較(数秒)
//
//  なぜこの形か:
//    配点を変えてシムを回し直すと、MVP→殿堂/人気の連鎖で軌道ごと変わり、シード間のカオスで差が読めない。
//    そこで「同じ年・同じ候補者」に対して配点だけ差し替えて再採点する(軌道は1本・比較は対)。
//    シムは1回で済み、グリッドは何度でも引き直せる。
//
//  注意:
//    - auto-sim は通常年PPVの結果を適用しない(サンプルするだけ)。実機に近づけるため、そのサンプル結果から
//      PPV加点(優勝/準優勝/他試合の勝敗)を合成して足している
//    - 指標は「年末王者か」ではなく「統一王座絡みか(季内に統一戦勝利 or 年末保持)」。季中に防衛を重ねて
//      陥落した元王者を非王者に数えると、配点を下げたのに王者率が上がる逆転が出る(実測で踏んだ)
//    - test/auto-sim.js をソース改変したコピーを os.tmpdir() に作って実行する。リポジトリは汚さない
// ══════════════════════════════════════════════════════════════
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoDir = path.join(__dirname, '..');
const testDir = path.join(repoDir, 'test');
const outDir = path.join(os.tmpdir(), 'wm-mvp-cal');
const [mode, ...rest] = process.argv.slice(2);

function replaceExactly(code, needle, replacement, expected) {
  const n = code.split(needle).length - 1;
  if (n !== expected) throw new Error(`anchor "${needle.slice(0, 40)}..." found ${n} times (expected ${expected})`);
  return code.split(needle).join(replacement);
}

function record(args) {
  fs.mkdirSync(outDir, { recursive: true });
  const tag = args.filter(a => !a.startsWith('--')).join('-') + (args.includes('--care') ? '-care' : '');
  const outJson = path.join(outDir, `cal-${tag || 'run'}.json`);
  let code = fs.readFileSync(path.join(testDir, 'auto-sim.js'), 'utf-8').replace(/^#!.*/, '');
  code = code.split('__dirname').join(JSON.stringify(testDir));

  const ppvLine = 'const sample = Engine.ppv.simulateTVResults(G, ppvRng);';
  code = replaceExactly(code, ppvLine,
    ppvLine + ' (globalThis.__ppvSample = globalThis.__ppvSample || {})[G.season] = sample;', 2);

  const anchor = code.includes('return awards;\r\n};') ? 'return awards;\r\n};' : 'return awards;\n};';
  code = replaceExactly(code, anchor, PROBE + anchor, 1);

  code = `process.on('exit', () => {
    require('fs').writeFileSync(${JSON.stringify(outJson)}, JSON.stringify(globalThis.__mvpCal || []));
    console.log('[mvp-cal] seasons=' + (globalThis.__mvpCal || []).length + ' -> ' + ${JSON.stringify(outJson)});
  });\n` + code;

  const patched = path.join(outDir, 'auto-sim-mvp-cal.js');
  fs.writeFileSync(patched, code);
  const r = spawnSync(process.execPath, [patched, ...args], { cwd: repoDir, encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024 });
  (r.stdout || '').split('\n').filter(l => /Result:|mvp-cal|\[probe\]/.test(l)).forEach(l => console.log(l));
  if (r.status !== 0) { console.error(r.stderr || ''); process.exit(r.status || 1); }
}

const PROBE = `
  try {
    const P0 = Engine.mvpRace.POINTS;
    const sample = (globalThis.__ppvSample || {})[state.season] || null;
    const ppvSynth = new Map();
    if (sample && sample.card) {
      const si = sample.card.findIndex(m => m.isSummit);
      if (si >= 0 && sample.results[si] && sample.results[si].winner !== 'draw') {
        const m = sample.card[si], r = sample.results[si];
        const w = r.winner === 'left' ? m.left.id : m.right.id;
        const l = r.winner === 'left' ? m.right.id : m.left.id;
        ppvSynth.set(w, P0.PPV_CHAMPION); ppvSynth.set(l, P0.PPV_RUNNER_UP);
        sample.card.forEach((mm, idx) => {
          if (mm.isSummit) return;
          const rr = sample.results[idx]; if (!rr) return;
          [[mm.left, rr.winner === 'left'], [mm.right, rr.winner === 'right']].forEach(([f, won]) => {
            if (!f || f.id === w || f.id === l) return;
            ppvSynth.set(f.id, won ? P0.PPV_OTHER_WIN : P0.PPV_OTHER_LOSS);
          });
        });
      }
    }
    const rows = [];
    const push = (f, orgId) => {
      if (!f || f.id == null || f.isIntrusion || f.isRental) return;
      const r = Engine.mvpRace.calcSeasonPoints(f, orgId, state.season, state);
      const b = r.breakdown, m = b.meta;
      rows.push({
        id: f.id, org: orgId, pts: r.points, uni: b.unified || 0, breakdown: { ...b, meta: undefined },
        cap: m.unifiedCaptures || 0, def: m.unifiedDefenses || 0, hold: !!m.isUnifiedChamp,
        tDef: m.titleDefenses || 0, tWin: m.titleWins || 0, tHold: !!m.isCurrentChamp,
        role: m.role, age: m.age, ppvSynth: ppvSynth.get(f.id) || 0,
      });
    };
    (state.roster || []).forEach(f => push(f, 'player'));
    Object.entries(state.aiOrgs || {}).forEach(([orgId, od]) => (od.roster || []).forEach(f => push(f, orgId)));
    rows.sort((a, b) => (b.pts + b.ppvSynth) - (a.pts + a.ppvSynth));
    (globalThis.__mvpCal = globalThis.__mvpCal || []).push({
      season: state.season, champId: state.unifiedTitle ? state.unifiedTitle.championId : null,
      rows: rows.slice(0, 25),
    });
  } catch (e) { console.error('[probe]', e.message); }
  `;

function grid(files) {
  const data = files.flatMap(f => JSON.parse(fs.readFileSync(fs.existsSync(f) ? f : path.join(outDir, f), 'utf-8')));
  const seqSum = (seq, n) => { let s = 0; for (let i = 0; i < n; i++) s += seq[Math.min(i, seq.length - 1)]; return s; };
  // seq = 季内の統一王座戦n勝目の点(奪取・防衛共通=1勝対称)。長さ1なら定額
  const CFGS = {
    'v1   win[20]       hold12 (〜v1.36)': { seq: [20], hold: 12 },
    'v2   win[13]       hold12 (採用)   ': { seq: [13], hold: 12 },
    '     win[13]       hold8          ': { seq: [13], hold: 8 },
    '     win[20,14,10] hold12         ': { seq: [20, 14, 10], hold: 12 },
    '     win[20,10,5]  hold8          ': { seq: [20, 10, 5], hold: 8 },
    '     win[20,16,13] hold12         ': { seq: [20, 16, 13], hold: 12 },
    '     win[8]        hold8          ': { seq: [8], hold: 8 },
    'zero (統一pt全廃=配点で動かせる床) ': { seq: [0], hold: 0 },
  };
  const involved = r => (r.cap + r.def) > 0 || r.hold;
  const score = (row, cfg) => row.pts - row.uni + seqSum(cfg.seq, row.cap + row.def) + (row.hold ? cfg.hold : 0) + row.ppvSynth;
  const ranked = (d, cfg) => d.rows.map(r => ({ r, s: score(r, cfg) })).sort((a, b) => b.s - a.s);
  const zero = { seq: [0], hold: 0 };

  const live = data.filter(d => d.rows.some(involved) || d.champId != null);
  console.log(`表彰季 ${data.length} / 統一王座が動いていた季 ${live.length} (通常年PPV合成あり)`);
  console.log('cfg'.padEnd(38), '| MVPが統一絡み   | 非絡みの当たり年が勝てる率 | 絡みMVPの2位との差');
  for (const [name, cfg] of Object.entries(CFGS)) {
    let inv = 0, base = 0, kept = 0, mSum = 0, mN = 0;
    for (const d of live) {
      const sc = ranked(d, cfg);
      if (involved(sc[0].r)) { inv++; if (sc[1]) { mSum += sc[0].s - sc[1].s; mN++; } }
      const z = ranked(d, zero)[0];
      if (!involved(z.r)) { base++; if (sc[0].r.id === z.r.id) kept++; }
    }
    console.log(name.padEnd(38), '|', `${inv}/${live.length}`.padStart(8), (100 * inv / live.length).toFixed(1).padStart(5) + '% |',
      `${kept}/${base}`.padStart(8), (100 * kept / Math.max(1, base)).toFixed(0).padStart(4) + '%             |', (mSum / Math.max(1, mN)).toFixed(1).padStart(7));
  }
}

if (mode === 'record') record(rest);
else if (mode === 'grid') grid(rest);
else { console.log('usage: record <seasons> <seed> [--care] | grid <json> [...]'); process.exit(1); }
