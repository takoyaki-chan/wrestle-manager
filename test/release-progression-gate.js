'use strict';

// Release progression gate. This curated suite protects every supported route
// back to a playable state before a distributable ZIP is created.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TEST_DIR = __dirname;
const TIMEOUT_MS = 120000;

const TESTS = [
  // Startup, save/load, and the common weekly loop.
  'app-startup-scope-test.js',
  'calendar-week-regression-test.js',
  'week-advance-contract-test.js',
  'week-advance-single-step-test.js',
  'progression-repair-test.js',
  'stuck-screen-regression-test.js',
  'save-doctor-load-test.js',

  // The season boundary: retirement -> awards -> report -> offseason.
  'year1-season-events-test.js',
  'season-end-order-test.js',
  'awards-before-report-order-test.js',
  'awards-ceremony-progression-lock-test.js',
  'year-end-awards-generate-test.js',

  // Offseason choices and each dedicated event route.
  'draft-never-skipped-test.js',
  'draft-offseason-flow-guard-test.js',
  'draft-week-render-refresh-test.js',
  'junior-weekphase-lifecycle-test.js',
  'junior-tournament-cancel-test.js',
  'junior-tournament-watch-fix-test.js',
  'spring-tag-league-watch-test.js',
  'autumn-war-ui-flow-test.js',
  'ppv-season-flow-test.js',
  'ppv-tv-start-test.js',
  'tenchosen-entry-timing-test.js',
  'tenchosen-result-flow-guard-test.js',
  'tenchosen-ppv-opening-guard-test.js',
  'challenge-request-show-flow-guard-test.js',
  'faction-f09-show-flow-guard-test.js',
];

function run(label, args) {
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, args, {
    cwd: TEST_DIR,
    timeout: TIMEOUT_MS,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 32,
  });
  const elapsed = Date.now() - startedAt;
  const timedOut = result.error && result.error.code === 'ETIMEDOUT';
  const ok = !timedOut && result.status === 0;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label} (${elapsed}ms)`);
  if (!ok) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
    const tail = output.split('\n').slice(-16).join('\n');
    if (tail) console.log(tail.split('\n').map(line => `        ${line}`).join('\n'));
    if (timedOut) console.log(`        Timed out after ${TIMEOUT_MS}ms`);
  }
  return ok;
}

function main() {
  console.log('=== Release progression gate ===');
  console.log('Checks every supported route back to a playable state before packaging.\n');

  const missing = TESTS.filter(file => !fs.existsSync(path.join(TEST_DIR, file)));
  if (missing.length) {
    console.error('Missing required progression tests:');
    missing.forEach(file => console.error(`  - ${file}`));
    process.exit(1);
  }

  let passed = 0;
  const failed = [];
  for (const file of TESTS) {
    if (run(file, [file])) passed += 1;
    else failed.push(file);
  }

  // A deterministic multi-season run covers state combinations beyond the
  // focused route tests.
  if (run('auto-sim.js (20 seasons)', ['auto-sim.js', '20'])) passed += 1;
  else failed.push('auto-sim.js (20 seasons)');

  console.log('\n================ SUMMARY ================');
  console.log(`passed: ${passed}  failed: ${failed.length}`);
  if (failed.length) {
    console.log(`BLOCKED: Do not package or upload. Failed: ${failed.join(', ')}`);
    process.exit(1);
  }
  console.log('CLEAR: Progression gate passed. Packaging may proceed.');
}

main();
