#!/usr/bin/env node
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { WalkthroughDetectors, stableHash, writeFailureArtifacts } = require('./detectors');
const { runWalk } = require('./driver');
const scenarios = require('./scenarios');
const { startStaticServer } = require('./server');

const HARNESS_ROOT = __dirname;
const PROJECT_ROOT = path.resolve(HARNESS_ROOT, '..', '..');
const DEFAULT_FIXTURE = 'season-1-week-1-seed42.json';
const VALID_LANGS = ['ja', 'en', 'pseudo'];

function parseArgs(argv) {
  const options = {
    actionLog: null,
    fixture: DEFAULT_FIXTURE,
    // P6-2: --lang(またはenv WM_LANG)。既定は'ja'で、従来どおりwm_langへ何も書かない
    // 既存挙動・digestと完全に揃える(setupPageは'ja'でも明示的に書くが、readStoredLang()の
    // 既定値と同じなので結果は不変)
    lang: VALID_LANGS.includes(process.env.WM_LANG) ? process.env.WM_LANG : 'ja',
    maxSteps: 1200,
    maxStepsExplicit: false,
    mode: 'walk',
    regen: false,
    scenario: null,
    seasons: 1,
    seed: 42,
    seedExplicit: false,
    selfTest: false,
    timeoutMs: 15 * 60 * 1000,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--self-test') options.selfTest = true;
    else if (arg === '--mode') options.mode = argv[++index];
    else if (arg === '--scenario') { options.scenario = argv[++index]; options.mode = 'ignite'; }
    else if (arg === '--regen') options.regen = true;
    else if (arg === '--seasons') options.seasons = Number(argv[++index]);
    else if (arg === '--seed') { options.seed = Number(argv[++index]); options.seedExplicit = true; }
    else if (arg === '--fixture') options.fixture = argv[++index];
    else if (arg === '--max-steps') { options.maxSteps = Number(argv[++index]); options.maxStepsExplicit = true; }
    else if (arg === '--timeout-ms') options.timeoutMs = Number(argv[++index]);
    else if (arg === '--action-log') options.actionLog = path.resolve(argv[++index]);
    else if (arg === '--lang') options.lang = argv[++index];
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (options.mode !== 'walk' && options.mode !== 'ignite') {
    throw new Error(`Unsupported mode: ${options.mode}. Use "walk" or "ignite".`);
  }
  if (options.mode === 'ignite') {
    if (!options.scenario) throw new Error('--mode ignite requires --scenario <name>');
    if (!scenarios[options.scenario]) {
      throw new Error(`Unknown scenario: ${options.scenario}. Available: ${Object.keys(scenarios).join(', ')}`);
    }
  }
  if (!VALID_LANGS.includes(options.lang)) {
    throw new Error(`Unsupported --lang: ${options.lang}. Use one of ${VALID_LANGS.join(', ')}`);
  }
  for (const key of ['seasons', 'seed', 'maxSteps', 'timeoutMs']) {
    if (!Number.isFinite(options[key]) || options[key] <= 0) throw new Error(`--${key} must be a positive number`);
  }
  return options;
}

function usage() {
  return [
    'Usage:',
    '  node test/ui-walkthrough/run.js --mode walk --seasons 1 --seed 42',
    `  node test/ui-walkthrough/run.js --mode ignite --scenario <${Object.keys(scenarios).join('|')}>`,
    '  node test/ui-walkthrough/run.js --self-test',
    '',
    'Options:',
    `  --fixture <file>     fixture under fixtures/ (default: ${DEFAULT_FIXTURE})`,
    '  --scenario <name>    ignite mode: rare-screen scenario from scenarios.js',
    '  --regen              ignite mode: regenerate the scenario fixture',
    '  --max-steps <n>      deterministic action ceiling (default: 1200 / scenario walk.maxSteps)',
    '  --timeout-ms <n>     whole-run timeout (default: 900000)',
    '  --action-log <file>  write the deterministic operation log',
    `  --lang <${VALID_LANGS.join('|')}>  UI language via localStorage wm_lang (default: ja, or env WM_LANG)`,
  ].join('\n');
}

async function setupPage(browser, server, fixtureText, seed, lang = 'ja') {
  const context = await browser.newContext({
    locale: 'ja-JP',
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-01-01T00:00:00.000Z') });
  await page.addInitScript(({ save, runSeed, uiLang }) => {
    localStorage.setItem('wm_audio', JSON.stringify({
      muted: true,
      bgmMuted: true,
      bgmMasterVol: 0,
      sfxMasterVol: 0,
    }));
    // P6-2: src/i18n.js の readStoredLang() は wm_lang 未設定時に既定'ja'へ落ちるため、
    // 'ja'を明示的に書いても既存挙動と結果は同一(digest不変)
    localStorage.setItem('wm_lang', uiLang);
    const parsed = JSON.parse(save);
    parsed.rngSeed = runSeed;
    localStorage.setItem('wrestle_manager_autosave', JSON.stringify(parsed));
  }, { save: fixtureText, runSeed: seed, uiLang: lang });
  await page.goto(`${server.baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.clock.runFor(1000);
  return { context, page };
}

async function runDetectorSelfTest(server, browser) {
  const context = await browser.newContext({ viewport: { width: 900, height: 700 } });
  const page = await context.newPage();
  const detectors = new WalkthroughDetectors({ stackTimeoutMs: 80, watchdogMs: 80 });
  detectors.attach(page);
  await page.goto(`${server.baseUrl}/__harness__/fixtures/detector-sandbox.html`, { waitUntil: 'domcontentloaded' });

  await page.locator('#throw-button').click();
  await page.waitForTimeout(20);
  const d1 = detectors.issues.some(issue => issue.type === 'D1_EXCEPTION');

  const before = await detectors.snapshot(page);
  await page.locator('#noop-button').click();
  const d2Result = await detectors.detectStack(page, before, '#noop-button', [
    () => page.locator('#noop-button').click(),
  ]);
  const d2 = !d2Result.progressed && detectors.issues.some(issue => issue.type === 'D2_FREEZE');

  const textMatches = await detectors.scanText(page);
  const d3 = textMatches.some(match => match.token.toLowerCase() === 'undefined')
    && textMatches.some(match => match.token === 'NaN');

  const snapshot = await detectors.snapshot(page);
  detectors.lastProgressKey = `${snapshot.state?.season || 0}|${snapshot.state?.week || 0}|false|0`;
  detectors.lastProgressAt = Date.now() - 100;
  const d5 = detectors.checkWatchdog(snapshot) != null;
  await context.close();

  const results = { D1: d1, D2: d2, D3: d3, D5: d5 };
  const failed = Object.entries(results).filter(([, passed]) => !passed).map(([name]) => name);
  console.log(`Detector sandbox: ${Object.entries(results).map(([name, passed]) => `${name}=${passed ? 'PASS' : 'FAIL'}`).join(' ')}`);
  if (failed.length > 0) throw new Error(`Detector self-test failed: ${failed.join(', ')}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const fixtureRoot = path.resolve(HARNESS_ROOT, 'fixtures');
  const scenario = options.mode === 'ignite' ? scenarios[options.scenario] : null;
  const effectiveSeed = scenario && !options.seedExplicit ? scenario.fixture.seed : options.seed;
  const effectiveMaxSteps = scenario && !options.maxStepsExplicit ? scenario.walk.maxSteps : options.maxSteps;
  const effectiveSeasons = scenario ? scenario.walk.seasons : options.seasons;

  let fixturePath;
  if (scenario) {
    fixturePath = path.join(fixtureRoot, 'generated', `${options.scenario}-seed${effectiveSeed}.json`);
    if (options.regen || !fs.existsSync(fixturePath)) {
      console.log(`Generating fixture for scenario "${options.scenario}" (seed=${effectiveSeed})...`);
      execFileSync(process.execPath, [
        path.join(fixtureRoot, 'generate-scenario-fixture.js'),
        options.scenario,
        String(effectiveSeed),
      ], { stdio: 'inherit' });
    }
  } else {
    fixturePath = path.resolve(HARNESS_ROOT, 'fixtures', options.fixture);
    if (!fixturePath.startsWith(`${fixtureRoot}${path.sep}`)) throw new Error('Fixture must be inside test/ui-walkthrough/fixtures');
    if (!options.selfTest && !fs.existsSync(fixturePath)) {
      throw new Error(`Fixture not found: ${fixturePath}. Run fixtures/generate-fixture.js first.`);
    }
  }

  let browser;
  let server;
  let context;
  const startedAt = Date.now();
  const timeout = new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error(`Walkthrough timed out after ${options.timeoutMs}ms`)), options.timeoutMs);
    timer.unref?.();
  });

  try {
    server = await startStaticServer({ projectRoot: PROJECT_ROOT });
    browser = await chromium.launch({ headless: true });
    if (options.selfTest) {
      await Promise.race([runDetectorSelfTest(server, browser), timeout]);
      return;
    }

    const fixtureText = fs.readFileSync(fixturePath, 'utf8');
    const setup = await setupPage(browser, server, fixtureText, effectiveSeed, options.lang);
    context = setup.context;
    const page = setup.page;
    // P6-5: D3_TEXTの内部トークン検査を言語別にするためlangを渡す(ja既定は従来どおり)
    const detectors = new WalkthroughDetectors({ lang: options.lang });
    detectors.attach(page);
    const reproductionCommand = scenario
      ? `node test/ui-walkthrough/run.js --mode ignite --scenario ${options.scenario} --seed ${effectiveSeed}`
      : `node test/ui-walkthrough/run.js --mode walk --seasons ${effectiveSeasons} --seed ${effectiveSeed} --fixture ${options.fixture}`;

    const markerHits = new Map();
    const seenOverlays = new Set();
    const seenScreens = new Set();
    const observe = scenario ? snapshot => {
      for (const overlay of snapshot.overlays || []) seenOverlays.add(overlay);
      if (snapshot.activeScreen) seenScreens.add(snapshot.activeScreen);
      for (const marker of scenario.ignition || []) {
        if (!markerHits.has(marker.name) && marker.match(snapshot)) markerHits.set(marker.name, true);
      }
    } : null;

    const result = await Promise.race([
      runWalk({
        artifactRoot: path.join(HARNESS_ROOT, 'artifacts'),
        // makeBoost はfixtureの実データ(リーダーID等)に依存する誘導を作るための口
        boost: scenario && scenario.makeBoost
          ? scenario.makeBoost(JSON.parse(fixtureText))
          : (scenario && scenario.boost ? scenario.boost : null),
        detectors,
        fixtureName: scenario ? path.basename(fixturePath) : options.fixture,
        maxSteps: effectiveMaxSteps,
        // ナビ巡回はwalkモード限定。igniteはシナリオの誘導(boost/until)と手数予算が主役で、
        // 自由閲覧画面の検査はwalk側が担う
        navTour: !scenario,
        observe,
        page,
        reproductionCommand,
        seasons: effectiveSeasons,
        seed: effectiveSeed,
        until: scenario && scenario.until ? scenario.until : null,
      }),
      timeout,
    ]);

    if (options.actionLog) {
      fs.mkdirSync(path.dirname(options.actionLog), { recursive: true });
      fs.writeFileSync(options.actionLog, `${JSON.stringify(result.actionLog, null, 2)}\n`, 'utf8');
    }

    let ignitionFailures = [];
    if (scenario) {
      for (const marker of scenario.ignition || []) {
        const hit = markerHits.has(marker.name);
        console.log(`Marker ${hit ? 'HIT ' : 'MISS'}: ${marker.name}${marker.required === false ? ' (optional)' : ''}`);
        if (!hit && marker.required !== false) ignitionFailures.push(`点火マーカー未観測: ${marker.name}`);
      }
      if (scenario.finalProbe) {
        const probe = await page.evaluate(scenario.finalProbe).catch(error => ({ probeError: String(error) }));
        console.log(`Final probe: ${JSON.stringify(probe)}`);
        if (probe && probe.probeError) ignitionFailures.push(`finalProbe失敗: ${probe.probeError}`);
        else if (scenario.finalAssert) ignitionFailures.push(...scenario.finalAssert(probe));
      }
      if (ignitionFailures.length > 0 && !result.artifactDirectory) {
        const issue = detectors.record('IGNITION_MISFIRE', ignitionFailures.join(' / '), { scenario: options.scenario });
        result.artifactDirectory = await writeFailureArtifacts({
          actionLog: result.actionLog,
          artifactRoot: path.join(HARNESS_ROOT, 'artifacts'),
          consoleEntries: detectors.consoleEntries,
          issue,
          page,
          reproductionCommand,
          state: { state: result.finalState },
          step: result.actionLog.length,
        });
      }
    }

    const elapsedMs = Date.now() - startedAt;
    const passed = result.completed && result.issues.length === 0 && ignitionFailures.length === 0;
    console.log(`${scenario ? `Ignition [${options.scenario}]` : 'Walkthrough'}: ${passed ? 'PASS' : 'FAIL'}`);
    console.log(`Fixture: ${path.basename(fixturePath)} seed=${effectiveSeed} seasons=${effectiveSeasons}`);
    console.log(`Actions: ${result.actionLog.length} digest=${result.actionDigest || stableHash(JSON.stringify(result.actionLog))}`);
    console.log(`Duration: ${(elapsedMs / 1000).toFixed(2)}s`);
    console.log(`Final state: ${JSON.stringify(result.finalState)}`);
    console.log(`Special screens: ${result.specialScreens.length ? result.specialScreens.join(', ') : 'none'}`);
    if (!scenario) {
      const toured = result.navTourScreens || [];
      const skipped = result.navTourSkipped || [];
      console.log(`Nav tour: ${toured.length ? toured.join(', ') : 'none'}${skipped.length ? ` (undeparted: ${skipped.join(', ')})` : ''}`);
    }
    const recoveries = result.recoveries || [];
    console.log(`Recovered-by-retry: ${recoveries.length}`);
    for (const recovery of recoveries) {
      console.log(`  step ${recovery.step}: ${recovery.action} -> recovered by ${recovery.recoveredBy}`);
    }
    if (scenario) {
      console.log(`Observed overlays: ${[...seenOverlays].sort().join(', ') || 'none'}`);
      console.log(`Observed screens: ${[...seenScreens].sort().join(', ') || 'none'}`);
      for (const failure of ignitionFailures) console.log(`Ignition failure: ${failure}`);
    }
    const issueTypeCounts = result.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    console.log(`Issues: ${result.issues.length}${result.issues.length
      ? ` (${Object.entries(issueTypeCounts).map(([type, count]) => `${type}=${count}`).join(', ')})`
      : ''}`);
    if (result.artifactDirectory) console.log(`Artifacts: ${result.artifactDirectory}`);
    // P6-2: EN/pseudoモードの情報集計(失敗条件にはしない)。ja既定では出力しない
    // (既存の標準出力を変えないため)
    if (options.lang !== 'ja') {
      const missEntries = [...detectors.i18nMissCounts.entries()].sort((a, b) => b[1] - a[1]);
      const missTotal = missEntries.reduce((sum, [, count]) => sum + count, 0);
      console.log(`i18n-miss: ${missTotal} occurrences / ${missEntries.length} unique keys`);
      if (missEntries.length > 0) {
        // P6-5: 棚卸しのため全量を出力する(以前はtop10のみ)。ja分岐(options.lang==='ja')には
        // 触れないためja digest/出力は不変
        console.log(`i18n-miss all ${missEntries.length}:`);
        for (const [key, count] of missEntries) {
          console.log(`  ${count}x ${key}`);
        }
      }
      const exposureEntries = [...detectors.jaExposureByScreen.entries()].sort((a, b) => b[1] - a[1]);
      console.log(`JA exposure by screen (informational, not a failure condition): ${exposureEntries.length
        ? exposureEntries.map(([screen, count]) => `${screen}=${count}`).join(', ')
        : 'none'}`);
    }
    // P6-9: レイアウト溢れの情報集計(失敗条件にはしない)。i18n-miss/JA exposureと違い
    // lang問わず常に出力する — ja側でも走らせて「ENで新規に溢れたのか元から溢れていたのか」の
    // 差分を取れるようにするため(既存のja行より後に新規追加するだけなので、既存出力・digestは不変)
    const overflowRecords = detectors.overflowRecords || [];
    console.log(`Overflow (informational, not a failure condition): ${overflowRecords.length} unique elements`);
    if (overflowRecords.length > 0) {
      const byScreen = [...detectors.overflowByScreen.entries()].sort((a, b) => b[1].total - a[1].total);
      console.log('Overflow by screen:');
      for (const [screen, bucket] of byScreen) {
        const kindStr = Object.entries(bucket.byKind).map(([kind, count]) => `${kind}=${count}`).join(', ');
        console.log(`  ${screen}: ${bucket.total} (${kindStr})`);
      }
      const byKindTotal = overflowRecords.reduce((acc, record) => {
        acc[record.kind] = (acc[record.kind] || 0) + 1;
        return acc;
      }, {});
      console.log(`Overflow by kind: ${Object.entries(byKindTotal).map(([kind, count]) => `${kind}=${count}`).join(', ')}`);
      const top = [...overflowRecords].sort((a, b) => b.overflowPx - a.overflowPx).slice(0, 30);
      console.log(`Overflow top ${top.length}:`);
      top.forEach((record, index) => {
        console.log(`  ${index + 1}. [${record.kind}] ${record.screen} | ${record.selector} | "${record.text}" | +${record.overflowPx}px`);
      });
    }
    if (!passed) process.exitCode = 1;
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    if (server) await server.close().catch(() => {});
  }
}

main().catch(error => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
