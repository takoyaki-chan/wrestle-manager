#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  detector-selftest — 検査システム自身の生存証明バッテリー
//
//  2026-08-31 Keisuke指弾「バグを探すシステムが本当に機能しているのか怪しい」への
//  恒久回答。わざと壊したエンジンで各検出器を走らせ、**鳴くこと**を確認する。
//  初回実施日の戦果: 台帳L1の借り物差し盲目化 / ロスター重複検査の未実装 /
//  資金NaNの無言0円化 / 観客数検査の幻フィールド参照 — 計4件の検出器欠陥を発見。
//
//  実行: npm run test:detectors (約7〜8分)
//  いつ回すか: リリース前に1回(リリースパイプラインの一部)+検査系コードを触ったとき
// ══════════════════════════════════════════════════════════════════════════════
const { spawnSync } = require('child_process');
const path = require('path');

const testDir = __dirname;
const results = [];

function run(label, args, env, expectFailure, timeoutMs) {
  const started = Date.now();
  const res = spawnSync(process.execPath, args, {
    cwd: path.join(testDir, '..'),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
    env: { ...process.env, ...env },
    timeout: timeoutMs || 300000,
  });
  const failed = res.status !== 0;
  const ok = expectFailure ? failed : !failed;
  results.push({ label, ok, expect: expectFailure ? 'ISSUES(非0 exit)' : 'CLEAR(exit 0)', actual: `exit ${res.status}`, sec: Math.round((Date.now() - started) / 1000) });
  console.log(`${ok ? '✓' : '✗'} ${label} — 期待:${expectFailure ? '鳴く' : '静か'} 実際:exit ${res.status} (${Math.round((Date.now() - started) / 1000)}s)`);
  return ok;
}

console.log('=== 検出器自己点検バッテリー(全て「期待どおり」で合格) ===');

// ── 変異(台帳検査が鳴くこと) ──
run('台帳L1: 再固定上限の撤廃', ['test/auto-sim.js', '6', '42'], { WM_LEDGER_MUTATION: 'refix_uncap' }, true);
run('台帳L2: 昇給の2倍付与', ['test/auto-sim.js', '10', '42'], { WM_LEDGER_MUTATION: 'raise_double' }, true);
run('台帳L3: 資金の無言リーク', ['test/auto-sim.js', '4', '42'], { WM_LEDGER_MUTATION: 'funds_leak' }, true);

// ── カオス(validate→collect→判定パイプラインが鳴くこと) ──
run('生存: ステータスNaN', ['test/auto-sim.js', '4', '42'], { WM_CHAOS: 'nan_stat' }, true);
run('生存: ロスター重複', ['test/auto-sim.js', '4', '42'], { WM_CHAOS: 'dupe_roster' }, true);
run('生存: tick例外', ['test/auto-sim.js', '4', '42'], { WM_CHAOS: 'throw_tick' }, true);
run('生存: 資金NaN', ['test/auto-sim.js', '4', '42'], { WM_CHAOS: 'nan_funds' }, true);

// ── 健全側(壊していないエンジンでは静かであること=偽陽性なし) ──
run('健全: 20季クリーン', ['test/auto-sim.js', '20', '42'], {}, false, 420000);

// ── 独立検出器(凍結ベースライン)と走破検出器のサンドボックス ──
run('balance-baseline: 凍結比較', ['test/balance-baseline.js'], {}, false, 420000);
run('走破検出器: self-test', ['test/ui-walkthrough/run.js', '--self-test'], {}, false, 300000);

console.log('\n=== サマリー ===');
const failedCount = results.filter(r => !r.ok).length;
results.forEach(r => console.log(`  ${r.ok ? 'OK ' : 'NG '} ${r.label} (期待=${r.expect} / 実際=${r.actual})`));
console.log(failedCount === 0
  ? 'DETECTORS ALIVE: 全検出器が期待どおりに反応'
  : `DETECTOR FAILURE: ${failedCount}件の検出器が期待どおりに動かない — 検査結果を信用してはいけない`);
process.exit(failedCount === 0 ? 0 : 1);
