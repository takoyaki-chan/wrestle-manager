#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  save-regression — 実セーブのリグレッション棚
//
//  2026-08-31 新設。v1.32給与バグ(旧版セーブの査定ギャップ一括精算)が「検査は毎回
//  まっさらな新規ゲームしか通らない」死角で起きたことへの恒久対応。Keisuke提供の
//  実セーブ(test/ui-walkthrough/fixtures/legacy-saves/)を毎リリース前に現行ビルドへ
//  読み込ませ、移行系バグを機械で踏む。
//
//  Phase 1 (既定・数十秒): save-doctor診断 — パース・修復・整合の headless 検査
//  Phase 2 (--walkthrough・1本約3分): 実ブラウザで各セーブをロードし1季プレイ
//    (アプリ実物のロード経路=migration+saveDoctor+D1〜D5検出器を通す)
//
//  実行: npm run test:save-regression            (Phase 1)
//        npm run test:save-regression -- --walkthrough  (Phase 1+2)
//  棚への追加: 実セーブJSONを legacy-saves/ に置くだけ(命名: <era>_<S季W週>_<日付>.json)
// ══════════════════════════════════════════════════════════════════════════════
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHELF = path.join(__dirname, 'ui-walkthrough', 'fixtures', 'legacy-saves');
const withWalkthrough = process.argv.includes('--walkthrough');

// 既知課題: 修正されるまで失敗を「⚠既知」として数えない(黙殺ではなく注記 —
// 新しい退行と混ざらないようにするための区別。解消したら必ずここから消すこと)
// (prerefix_S12W45 のオフシーズン自己修復は 2026-08-31 解消 — 真因は旧セーブではなく
//  引退確定パスの coachAssign 掃除漏れ。test/departure-coach-assign-test.js が回帰網)
const KNOWN_ISSUES = {};

const saves = fs.existsSync(SHELF)
  ? fs.readdirSync(SHELF).filter(f => f.endsWith('.json')).sort()
  : [];
if (saves.length === 0) {
  console.error('save-regression: legacy-saves/ にセーブがありません');
  process.exit(1);
}

console.log(`=== 実セーブ棚: ${saves.length}本 ===`);
let failed = 0;

// ── Phase 1: save-doctor 診断 ──
for (const name of saves) {
  const res = spawnSync(process.execPath, [
    path.join(ROOT, 'tools', 'save-doctor.js'),
    path.join(SHELF, name), '--dry-run',
  ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64, timeout: 120000 });
  const out = (res.stdout || '') + (res.stderr || '');
  const issueLine = (out.match(/issues:.*$/m) || ['issues: (出力なし)'])[0].trim();
  const ok = res.status === 0;
  if (!ok) failed += 1;
  console.log(`${ok ? '✓' : '✗'} [doctor] ${name} — ${ok ? issueLine : `exit ${res.status}`}`);
  if (!ok) console.log(out.split('\n').slice(-8).join('\n'));
}

// ── Phase 2: 実ブラウザ走破(1季) ──
if (withWalkthrough) {
  for (const name of saves) {
    const started = Date.now();
    const res = spawnSync(process.execPath, [
      path.join(__dirname, 'ui-walkthrough', 'run.js'),
      '--fixture', path.join('legacy-saves', name),
      '--seasons', '1', '--seed', '42',
    ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64, timeout: 900000 });
    const out = (res.stdout || '') + (res.stderr || '');
    const pass = res.status === 0 && /Walkthrough: PASS/.test(out);
    const known = !pass && KNOWN_ISSUES[name];
    if (!pass && !known) failed += 1;
    const tail = (out.match(/Issues:.*$/m) || [''])[0].trim();
    console.log(`${pass ? '✓' : (known ? '⚠' : '✗')} [walkthrough] ${name} — ${tail || `exit ${res.status}`} (${Math.round((Date.now() - started) / 1000)}s)`);
    if (known) console.log(`  (既知課題として計上外: ${known})`);
    if (!pass && !known) console.log(out.split('\n').slice(-12).join('\n'));
  }
} else {
  console.log('(Phase 2の実ブラウザ走破は --walkthrough で実行。リリース前は必ず両方回す)');
}

console.log(failed === 0 ? 'SAVE REGRESSION: ALL CLEAR' : `SAVE REGRESSION: ${failed}件失敗`);
process.exit(failed === 0 ? 0 : 1);
