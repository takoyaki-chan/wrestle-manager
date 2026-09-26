#!/usr/bin/env node
'use strict';

// K-1 経路差分テストの「同じ経路の前後比較」。
// src を変える前と後で `node test/k1-parity/run.js --dump <dir>` を取り、2つの dir を比べる。
// 両経路(エンジン / 実プレイ)それぞれについて、各時点の状態 G を欄の単位まで丸ごと比べ(要約しない。
// ログ・新聞・試合結果の中身も含む)、乱数はストリームごとの引き数を比べる。
// 「リファクタで数値が動いていない」ことの確認用(K-1 第3段で追加)。
//
// 使い方: node test/k1-parity/compare-dumps.js <beforeDir> <afterDir> [--limit N] [--ignore <欄のパターン>]...
//   --ignore は '.' 区切りのパス(例: 'lastShowResults.*.mqInventory.path')。'*' は1段の任意の欄
// 終了コード: 差が無ければ 0、あれば 1

const fs = require('fs');
const path = require('path');

// 実行ごとに変わる診断用の文字列(静的サーバのポート番号・呼び出し元の行番号)は比べない
const DEFAULT_IGNORE = ['app.notes.*', 'app.previewTicks.*.caller'];

function parseArgs(argv) {
  const opts = { dirs: [], limit: 30, ignore: [...DEFAULT_IGNORE] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') opts.limit = Number(argv[++i]);
    else if (a === '--ignore') opts.ignore.push(argv[++i]);
    else opts.dirs.push(a);
  }
  if (opts.dirs.length !== 2) throw new Error('usage: compare-dumps.js <beforeDir> <afterDir> [--limit N] [--ignore pattern]');
  return opts;
}

function ignoredBy(patterns, pathSegs) {
  return patterns.some(p => {
    const ps = p.split('.');
    if (ps.length !== pathSegs.length) return false;
    return ps.every((seg, i) => seg === '*' || seg === pathSegs[i]);
  });
}

function deepDiff(a, b, segs, out, opts) {
  if (ignoredBy(opts.ignore, segs)) return;
  if (a === b) return;
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return;
  const ta = a === null ? 'null' : Array.isArray(a) ? 'array' : typeof a;
  const tb = b === null ? 'null' : Array.isArray(b) ? 'array' : typeof b;
  if (ta !== tb || (ta !== 'object' && ta !== 'array')) {
    out.push({ path: segs.join('.'), before: a, after: b });
    return;
  }
  if (ta === 'array') {
    if (a.length !== b.length) out.push({ path: `${segs.join('.')}.length`, before: a.length, after: b.length });
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) deepDiff(a[i], b[i], [...segs, String(i)], out, opts);
    return;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (!(k in a)) { if (!ignoredBy(opts.ignore, [...segs, k])) out.push({ path: [...segs, k].join('.'), before: '(なし)', after: b[k] }); continue; }
    if (!(k in b)) { if (!ignoredBy(opts.ignore, [...segs, k])) out.push({ path: [...segs, k].join('.'), before: a[k], after: '(なし)' }); continue; }
    deepDiff(a[k], b[k], [...segs, k], out, opts);
  }
}

function rngMap(tap) {
  return new Map(((tap && tap.streams) || []).map(s => [s.seed, s]));
}

function compareRng(label, before, after) {
  const rows = [];
  const b = rngMap(before), a = rngMap(after);
  for (const seed of new Set([...b.keys(), ...a.keys()])) {
    const x = b.get(seed), y = a.get(seed);
    const bd = x ? `${x.draws}/${x.creates}` : '—';
    const ad = y ? `${y.draws}/${y.creates}` : '—';
    if (bd !== ad) rows.push(`${label} stream ${seed} keys=${JSON.stringify((x || y).keys)}: 引き数/作成数 ${bd} → ${ad}`);
  }
  if ((before && before.untracked) !== (after && after.untracked)) rows.push(`${label} untracked ${before && before.untracked} → ${after && after.untracked}`);
  return rows;
}

const short = (v) => {
  let t;
  try { t = JSON.stringify(v); } catch (_e) { t = String(v); }
  if (t === undefined) t = 'undefined';
  return t.length > 140 ? `${t.slice(0, 139)}…` : t;
};

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const [dirA, dirB] = opts.dirs;
  const files = fs.readdirSync(dirA).filter(f => f.endsWith('.json')).sort();
  let total = 0;
  for (const f of files) {
    const pb = path.join(dirB, f);
    if (!fs.existsSync(pb)) { console.log(`== ${f}: 後の dump に無い`); total++; continue; }
    const A = JSON.parse(fs.readFileSync(path.join(dirA, f), 'utf8'));
    const B = JSON.parse(fs.readFileSync(pb, 'utf8'));
    const sections = [];
    const g0 = [];
    deepDiff(A.G0, B.G0, ['G0'], g0, opts);
    if (g0.length) sections.push(['入力 G0', g0]);
    for (const side of ['engine', 'app']) {
      const a = A[side] || {}, b = B[side] || {};
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (/^rng/.test(key)) continue;
        const out = [];
        deepDiff(a[key], b[key], [side, key], out, opts);
        if (out.length) sections.push([`${side}.${key}`, out]);
      }
      const rngRows = [
        ...compareRng(`${side}.rngShow`, a.rngShow, b.rngShow),
        ...compareRng(`${side}.rngTick`, a.rngTick, b.rngTick),
        ...compareRng(`${side}.rngPost`, a.rngPost, b.rngPost),
      ];
      if (rngRows.length) sections.push([`${side} 乱数`, rngRows.map(r => ({ path: r, before: '', after: '' }))]);
    }
    const n = sections.reduce((acc, [, list]) => acc + list.length, 0);
    total += n;
    console.log(`== ${f}: ${n === 0 ? '一致' : `差 ${n} 箇所`}`);
    for (const [title, list] of sections) {
      console.log(`  [${title}] ${list.length} 箇所`);
      for (const d of list.slice(0, opts.limit)) {
        if (d.before === '' && d.after === '') console.log(`    ${d.path}`);
        else console.log(`    ${d.path}: ${short(d.before)} → ${short(d.after)}`);
      }
      if (list.length > opts.limit) console.log(`    … ほか ${list.length - opts.limit} 箇所`);
    }
  }
  console.log(`\n合計 ${total} 箇所`);
  process.exitCode = total === 0 ? 0 : 1;
}

main();
