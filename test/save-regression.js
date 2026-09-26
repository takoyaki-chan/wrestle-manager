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
//  Phase 1 (既定・数十秒): save-doctor — パース・修復・整合の headless 検査
//    2026-09-26: 診断(--dry-run)だけでなく、セーブの**複製**に --repair をかけて修復・移行
//    (ゲームのロード時修復 Engine.saveDoctor.repairOnLoad と同じもの。K-4 の人生番号の移行を含む)まで通す。
//    修復した結果にもう一度 --repair をかけ、「2回目は何も変えない(ファイルが1バイトも変わらない)」ことも確かめる。
//    棚の元のセーブは読むだけで書き換えない(前後でハッシュを照合する)
//  Phase 2 (--walkthrough・1本約3分): 実ブラウザで各セーブをロードし1季プレイ
//    (アプリ実物のロード経路=migration+saveDoctor+D1〜D5検出器を通す)
//
//  実行: npm run test:save-regression            (Phase 1)
//        npm run test:save-regression -- --walkthrough  (Phase 1+2)
//  棚への追加: 実セーブJSONを legacy-saves/ に置くだけ(命名: <era>_<S季W週>_<日付>.json)
// ══════════════════════════════════════════════════════════════════════════════
const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
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

// ── Phase 1: save-doctor 診断 → 複製への修復・移行 → 2回目は変化なし ──
function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function runDoctor(args) {
  const res = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'save-doctor.js'), ...args],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64, timeout: 180000 });
  const out = (res.stdout || '') + (res.stderr || '');
  return { status: res.status, out };
}
// save-doctor の出力から「Repair actions」の行と Before/After の issues 行を拾う
function parseDoctor(out) {
  const issues = [...out.matchAll(/^\s*issues:(.*)$/gm)].map(m => m[1].trim());
  const actions = [];
  const lines = out.split(/\r?\n/);
  const at = lines.findIndex(l => l.trim() === 'Repair actions');
  if (at >= 0) {
    for (let i = at + 1; i < lines.length && /^\s+(-|no changes)/.test(lines[i]); i++) {
      const t = lines[i].trim();
      if (t !== 'no changes') actions.push(t.replace(/^-\s*/, ''));
    }
  }
  return { before: issues[0] || '(出力なし)', after: issues[1] || null, actions };
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-save-regression-'));
try {
  for (const name of saves) {
    const original = path.join(SHELF, name);
    const originalHash = sha256File(original);
    const problems = [];

    // 1) 診断のみ(元のファイルを読むだけ)
    const diag = runDoctor([original, '--dry-run']);
    if (diag.status !== 0) problems.push(`診断 exit ${diag.status}`);

    // 2) 複製に修復をかける(--output で別ファイルへ。元のファイルは渡さない)
    const dir = path.join(tmpRoot, name.replace(/\.json$/, ''));
    fs.mkdirSync(dir, { recursive: true });
    const copy = path.join(dir, 'input.json');
    const pass1 = path.join(dir, 'repaired-1.json');
    const pass2 = path.join(dir, 'repaired-2.json');
    fs.copyFileSync(original, copy);
    const r1 = runDoctor([copy, '--repair', '--output', pass1, '--json']);
    const p1 = parseDoctor(r1.out);
    let migrated = null;
    if (r1.status !== 0 || !fs.existsSync(pass1)) {
      problems.push(`修復1回目 exit ${r1.status}`);
    } else {
      const state = JSON.parse(fs.readFileSync(pass1, 'utf8'));
      // K-4 の人生番号の移行(Engine.life.migrateLegacyLives)が済んだ印と、人生番号の台帳
      if (!state._migrated_k4_lives_v1) problems.push('修復後に K-4 の移行の印(_migrated_k4_lives_v1)が無い');
      if (!state.lifeSerial || typeof state.lifeSerial !== 'object') problems.push('修復後に人生番号の台帳(lifeSerial)が無い');
      migrated = p1.actions.find(a => a.startsWith('k4_lives_migrated')) || '(番号を刻む記録なし・印のみ)';
      if (p1.after && p1.after !== 'none') problems.push(`修復後も issues: ${p1.after}`);

      // 3) 修復した結果にもう一度修復をかける: 何も変えないこと(移行は1回だけ・修復は冪等)
      const r2 = runDoctor([pass1, '--repair', '--output', pass2, '--json']);
      const p2 = parseDoctor(r2.out);
      if (r2.status !== 0 || !fs.existsSync(pass2)) problems.push(`修復2回目 exit ${r2.status}`);
      else {
        if (p2.actions.length > 0) problems.push(`2回目にも修復が走った: ${p2.actions.join(', ')}`);
        if (sha256File(pass1) !== sha256File(pass2)) problems.push('2回目の修復でファイルが変わった');
      }
    }
    if (sha256File(original) !== originalHash) problems.push('棚の元のセーブが書き換わった');

    const ok = problems.length === 0;
    if (!ok) failed += 1;
    console.log(`${ok ? '✓' : '✗'} [doctor] ${name} — 修復前 issues: ${p1.before} → 修復後 issues: ${p1.after || '(出力なし)'}`);
    console.log(`    修復 ${p1.actions.length} 件${p1.actions.length ? `(${p1.actions.join(', ')})` : ''} / K-4 移行: ${migrated || '—'} / 2回目: ${ok ? '変化なし・同一' : '—'}`);
    for (const p of problems) console.log(`    ✗ ${p}`);
    if (!ok) console.log([diag.out, r1.out].join('\n').split('\n').slice(-12).join('\n'));
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
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
