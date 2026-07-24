'use strict';

// test/run-all.js — unified test runner
//
// Discovers every test/*-test.js file (pass/fail assertion tests — this glob cleanly
// excludes the analysis/probe scripts in test/, none of which end in "-test.js"),
// runs each in its own child process with a timeout, and prints one summary.
//
// Usage:
//   node test/run-all.js                 run everything
//   node test/run-all.js --quick         run only the QUICK subset (see below)
//   node test/run-all.js --engine        also run test/auto-sim.js 20 as a final stage
//   node test/run-all.js someFilter      only run tests whose filename includes "someFilter"
//   (flags and a filter can be combined, e.g. `--quick spring-tag`)
//
// Exit code is non-zero if any test FAILs or TIMEOUTs (or, with --engine, if the
// engine stage reports violations).

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const testDir = __dirname;
const DEFAULT_TIMEOUT_MS = 120000;
const SLOW_THRESHOLD_MS = 5000;

// --- QUICK subset -----------------------------------------------------------------
// Populated from a real full-suite measurement run on 2026-07-24 (see test/README.md),
// not guessed. Criterion: currently PASSING and completes in under 3000ms on its own,
// so `--quick` stays a fast, green day-to-day smoke check. Re-measure with
// `node test/run-all.js` and update this list if the suite composition changes
// materially (new slow tests added, existing ones re-scoped, a listed test goes stale).
//
// Excluded deliberately: decay-longevity-test.js (120s+, a measurement profiler, not a
// pass/fail test — see test/README.md), stat-contribution-test.js (30s, real sim work),
// and any test failing at measurement time (currently: show-result-summary-theme-test.js,
// special-tournament-fanfare-test.js, stage-bgm-state-test.js — all pre-existing stale
// tests unrelated to this runner; see docs/worklog.md).
const QUICK = new Set([
  'ai-ace-title-system-test.js',
  'ai-contract-dormant-routing-test.js',
  'ai-retirement-test.js',
  'autumn-war-live-engine-test.js',
  'autumn-war-match-dialogue-test.js',
  'autumn-war-mvp-lines-test.js',
  'autumn-war-ui-flow-test.js',
  'awards-champions-layout-test.js',
  'b3-challenge-audio-test.js',
  'b3-challenge-balance-test.js',
  'calendar-week-regression-test.js',
  'challenge-guest-save-sanitize-test.js',
  'challenge-request-away-launch-test.js',
  'challenge-request-card-reservation-test.js',
  'challenge-request-result-reaction-test.js',
  'challenge-request-show-flow-guard-test.js',
  'challenge-show-orchestration-test.js',
  'challenge-show-relationship-test.js',
  'chronicle-rebuild-test.js',
  'coach-poach-assignment-test.js',
  'departed-star-claim-test.js',
  'dev-tools-static-test.js',
  'dormant-pool-migration-test.js',
  'draft-offseason-flow-guard-test.js',
  'draft-week-render-refresh-test.js',
  'event-match-result-popup-test.js',
  'faction-f03-modal-flow-test.js',
  'faction-f09-ending-score-order-test.js',
  'faction-f09-show-flow-guard-test.js',
  'faction-flavor-test.js',
  'faction-overlay-close-test.js',
  'faction-size-freeze-test.js',
  'finisher-cooldown-test.js',
  'flags-returner-detection-test.js',
  'header-season-redesign-test.js',
  'hp-shape-and-pacing-test.js',
  'internal-challenge-regression-test.js',
  'internal-ui-labels-hidden-test.js',
  'invite-auto-renew-test.js',
  'junior-tournament-cancel-test.js',
  'junior-tournament-hp-ui-test.js',
  'junior-tournament-simulation-test.js',
  'junior-tournament-watch-fix-test.js',
  'mobile-layout-test.js',
  'mq-finalize-parity-test.js',
  'mq-record-migration-test.js',
  'opening-scene-ui-test.js',
  'org-trust-visibility-guard-test.js',
  'progression-repair-test.js',
  'regular-show-pregame-design-test.js',
  'relationship-balance-test.js',
  'relationship-history-shape-test.js',
  'relmap-device-compat-test.js',
  'rental-guaranteed-success-test.js',
  'rental-migration-test.js',
  'rental-morale-guard-test.js',
  'rental-poach-guard-test.js',
  'rental-retirement-consistency-test.js',
  'rental-rng-behavior-test.js',
  'retain-fighter-test.js',
  'rivalry-resolution-regression-test.js',
  'roster-cap-away-guest-guard-test.js',
  'save-doctor-load-test.js',
  'seasonal-tournament-bgm-continuity-test.js',
  'show-preview-stale-guard-test.js',
  'show-preview-tag-skip-test.js',
  'showcard-release-cleanup-test.js',
  'special-event-finance-test.js',
  'spring-tag-league-result-placement-test.js',
  'spring-tag-league-watch-test.js',
  'spring-tag-newspaper-team-photo-test.js',
  'tag-match-test.js',
  'tenchosen-result-flow-guard-test.js',
  'title-challenger-eligibility-test.js',
  'title-defense-count-test.js',
  'title-portrait-marquee-test.js',
  'title-rental-guard-test.js',
  'version-consistency-test.js',
  'victory-overlay-speaker-test.js',
  'weekly-auto-manage-toast-test.js',
]);

// Profilers/measurement scripts that are named "*-test.js" but contain NO
// assertions (they just print stats). They are not pass/fail tests, so the
// runner must not treat their runtime/timeout as a failure. Run them by hand
// when you want the measurement. (Verified 0 asserts on 2026-07-24.)
const EXCLUDE = new Set([
  'decay-longevity-test.js', // 5×30-season retirement profiler, ~120s, prints only
]);

function discoverTests() {
  return fs.readdirSync(testDir)
    .filter(name => name.endsWith('-test.js'))
    .filter(name => name !== 'run-all.js')
    .filter(name => !EXCLUDE.has(name))
    .sort();
}

function runOne(file, timeoutMs) {
  const full = path.join(testDir, file);
  const start = Date.now();
  const res = spawnSync(process.execPath, [full], {
    cwd: testDir,
    timeout: timeoutMs,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 32,
  });
  const duration = Date.now() - start;

  const timedOut = res.error && res.error.code === 'ETIMEDOUT';
  const status = timedOut ? 'TIMEOUT' : (res.status === 0 ? 'PASS' : 'FAIL');

  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  const combined = (stdout + (stderr ? '\n' + stderr : '')).trim();
  const tailLines = combined.split('\n').slice(-12).join('\n');

  return { file, status, duration, tail: tailLines, exitCode: res.status };
}

function fmtMs(ms) {
  return `${ms}ms`;
}

function runEngineStage() {
  console.log('\n--- engine stage: node test/auto-sim.js 20 ---');
  const start = Date.now();
  const res = spawnSync(process.execPath, [path.join(testDir, 'auto-sim.js'), '20'], {
    cwd: testDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  });
  const duration = Date.now() - start;
  const out = (res.stdout || '') + (res.stderr || '');
  console.log(out.trim());

  const allClear = /ALL CLEAR/i.test(out);
  const violationMatch = out.match(/(\d+)\s*violation/i);
  const violations = violationMatch ? parseInt(violationMatch[1], 10) : (allClear ? 0 : null);
  const ok = res.status === 0 && (allClear || violations === 0);

  console.log(`engine stage: ${ok ? 'OK' : 'FAILED'} (${fmtMs(duration)})${violations != null ? `, violations=${violations}` : ''}`);
  return { ok, duration, violations };
}

function main() {
  const args = process.argv.slice(2);
  const quick = args.includes('--quick');
  const engine = args.includes('--engine');
  const timeoutArgIdx = args.findIndex(a => a === '--timeout');
  const timeoutMs = timeoutArgIdx >= 0 ? parseInt(args[timeoutArgIdx + 1], 10) : DEFAULT_TIMEOUT_MS;
  const filter = args.find(a => !a.startsWith('--') && a !== String(timeoutMs));

  let tests = discoverTests();
  if (quick) tests = tests.filter(f => QUICK.has(f));
  if (filter) tests = tests.filter(f => f.includes(filter));

  if (tests.length === 0) {
    console.log('No tests matched. (quick=%s, filter=%s)', quick, filter || '(none)');
    process.exit(1);
  }

  console.log(`Running ${tests.length} test${tests.length === 1 ? '' : 's'}${quick ? ' [quick subset]' : ''}${filter ? ` [filter: ${filter}]` : ''}...\n`);

  const results = [];
  for (const file of tests) {
    process.stdout.write(`  ${file} ... `);
    const r = runOne(file, timeoutMs);
    results.push(r);
    const slowTag = r.duration > SLOW_THRESHOLD_MS ? ' [slow]' : '';
    console.log(`${r.status} (${fmtMs(r.duration)})${slowTag}`);
  }

  const pass = results.filter(r => r.status === 'PASS');
  const fail = results.filter(r => r.status === 'FAIL');
  const timeout = results.filter(r => r.status === 'TIMEOUT');
  const slow = results.filter(r => r.duration > SLOW_THRESHOLD_MS);

  let engineResult = null;
  if (engine) engineResult = runEngineStage();

  console.log('\n================ SUMMARY ================');
  console.log(`total: ${results.length}  passed: ${pass.length}  failed: ${fail.length}  timed out: ${timeout.length}`);
  if (slow.length) {
    console.log(`slow (>${SLOW_THRESHOLD_MS}ms): ${slow.map(r => `${r.file} (${fmtMs(r.duration)})`).join(', ')}`);
  }
  if (engineResult) {
    console.log(`engine stage: ${engineResult.ok ? 'OK' : 'FAILED'} (${fmtMs(engineResult.duration)})`);
  }

  if (fail.length || timeout.length) {
    console.log('\n--- non-passing tests ---');
    for (const r of [...fail, ...timeout]) {
      console.log(`\n[${r.status}] ${r.file}${r.exitCode != null ? ` (exit ${r.exitCode})` : ''}`);
      console.log(r.tail.split('\n').map(l => `    ${l}`).join('\n'));
    }
  }
  console.log('==========================================');

  const failed = fail.length > 0 || timeout.length > 0 || (engineResult && !engineResult.ok);
  process.exit(failed ? 1 : 0);
}

main();
