#!/usr/bin/env node
'use strict';

// K-1「興行後の処理を一本化する」第1歩 — 経路差分テスト(診断ハーネス)
//
// 同じ興行前の状態 G0・同じカード・同じ乱数シードから、
//   エンジン経路 : Engine.executeShow(G0) → Engine.tickWeek(...)          (auto-sim が通る道)
//   実プレイ経路 : App.executeShow() → skipAllMatches()/skipMatch() → App._finalizeShowImpl()
//                  → App.closeShowResult() 内の Engine.tickWeek(...)        (画面の「開催する」の道)
// の両方を実ブラウザ(Playwright + 製品の src/index.html)で走らせ、状態 G の違いを項目ごとに列挙する。
//
// 比べる時点:
//   A  興行後(= tickWeek に渡す直前の状態)         エンジン: executeShow の戻り値 / 実プレイ: closeShowResult が tickWeek に渡す状態
//   B  tickWeek の直後                              エンジン: tickWeek の戻り値   / 実プレイ: closeShowResult 内の tickWeek の戻り値
//   A' 実プレイの finalize 直後 → tickWeek 入力     (closeShowResult の前半だけがやっていること)
//   C  実プレイの tickWeek 直後 → 週送り直前         (closeShowResult の後半だけがやっていること)
// 乱数は derive の引数(ストリーム)ごとに引いた回数を数え、両経路で回数が食い違うストリームを出す。
//
// 使い方:
//   node test/k1-parity/run.js                     許容リスト照合(未知の差分/消えた既知差分があれば exit 1)
//   node test/k1-parity/run.js --report            全差分を詳しく表示(照合結果は表示のみで exit 0)
//   node test/k1-parity/run.js --scenario rivalry  1シナリオだけ
//   node test/k1-parity/run.js --json <file>       生データを JSON で保存(既定: test/k1-parity/out/last-run.json)
//   node test/k1-parity/run.js --dump <dir>        各シナリオの両経路の状態を丸ごと <dir>/<シナリオ>__<mode>.json に保存
//                                                  (src を変える前後で取り、compare-dumps.js で「同じ経路の数値が動いていないか」を見る)
//   node test/k1-parity/run.js --fixture-out <file>  作った fixture(セーブの JSON)を保存する
//   node test/k1-parity/run.js --fixture-in <file>   fixture を作らずに保存したものを使う(2026-09-26 第4段 4-A で追加。
//                                                  fixture は headless 進行=エンジンの経路で作るので、エンジンの興行後の処理を
//                                                  変えると fixture の世界も変わる。実プレイの経路の前後比較は同じ fixture で取る)
//
// src の挙動は変えない。ページ側で行う計測の詳細は page-probe.js の冒頭を参照。

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('../ui-walkthrough/server');
const { advanceUntil, toSaveState, summarizeSwallowedErrors, loadEngines } = require('../ui-walkthrough/fixtures/headless-sim');
const { scenarios } = require('./scenarios');
const { diffStates, diffTwo, aggregate, short } = require('./diff');
const allowlist = require('./allowlist');

const ROOT = path.resolve(__dirname, '..', '..');
const PROBE_PATH = path.join(__dirname, 'page-probe.js');
const DEFAULT_JSON = path.join(__dirname, 'out', 'last-run.json');

function parseArgs(argv) {
  const opts = { report: false, scenario: null, json: DEFAULT_JSON, dump: null, fixtureSeed: 42, season: 2, week: 14, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--report') opts.report = true;
    else if (a === '--verbose') opts.verbose = true;
    else if (a === '--scenario') opts.scenario = argv[++i];
    else if (a === '--json') opts.json = argv[++i];
    else if (a === '--dump') opts.dump = argv[++i];
    else if (a === '--fixture-out') opts.fixtureOut = argv[++i];
    else if (a === '--fixture-in') opts.fixtureIn = argv[++i];
    else if (a === '--fixture-seed') opts.fixtureSeed = Number(argv[++i]);
    else if (a === '--season') opts.season = Number(argv[++i]);
    else if (a === '--week') opts.week = Number(argv[++i]);
    else if (a === '--help' || a === '-h') opts.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

// ── 乱数ストリームの名前(derive の最後の方にあるタグ値で引く) ──
const STREAM_TAGS = new Map([
  [0x7A60, 'tagMatchSim'], [8888, 'intrusionCheck'], [8889, 'intrusionHeat'], [0xBE6F, 'intrusionRivalry'],
  [0xA77E, 'attendance'], [0xF5E5, 'freshnessLabel'], [0x4F50, 'showOrgPop'], [999, 'injury'],
  [0xBE3C, 'injuryRetireRel'], [0xBE2A, 'matchRelationships'], [0xBE5C, 'showContextRel'], [1732, 'matchGrowth'],
  [0xB818, 'breakthrough'], [0x5C6, 'slump'], [0x5C7, 'slumpMomentum'], [0x5C8, 'motivationLoss'],
  [0xBE57, 'breakthroughRel'], [0xBE58, 'slumpSympathy'], [0xBE59, 'motivationSympathy'], [0xBE6C, 'slumpLashout'],
  [0xBE77, 'rivalryResolution'], [0xDE7A, 'suddenDeparture'], [0xBE3A, 'departureRel'], [0xFAD2, 'injuryRetireLine'],
  [0xFAD3, 'lastRunLine'], [0xBE3B, 'lastRunRel'], [0xB4B4, 'mediaSpotlight'], [0xBE56, 'spotlightRel'],
  [0xC0B1, 'common1'], [0xFA88, 'f08'], [0xFA21, 'internalChallenge'], [0xBEE1, 'heelRivalry'], [0xB1B6, 'b3InShow'],
  [0xC715, 'crisisLine'], [777, 'careerEndingRoll'], [888, 'severeInjuryReassess'],
  [0x5A30, 'snapshot'], [0xBE53, 'weeklyRelOps'], [0xBE2D, 'crossOrgBondTax'], [0xBE61, 'relationRepairDoc'],
  [0xBE1B, 'weeklyRelDecay+story'], [0xBE6D, 'popOvertake(N-04)'], [0xBE6A, 'roleClash(N-03)'], [0xD03E, 'domeLine(表示)'],
  [0xBE2B, 'ppvRelationships'], [0xFA90, 'factionEvent'], [0xC0E7, 'contract'],
  [0xEE01, 'glimpseA'], [0xEE02, 'glimpseB'], [0xEE57, 'weeklyNewspaper'], [0xFA20, 'internalChallengeWeekly'],
]);

function streamLabel(record, matchPairs) {
  const keys = record.keys;
  if (!keys) return `raw(${record.seed})`;
  // 777 / 888 は2通りに使われている: [season, week, 777] は週次のスキャンダル判定、
  // [fighterId, 777] / [fighterId, 888] は怪我判定の中の「壮絶な幕切れ」抽選と重傷時の再評価
  if (keys.length === 3 && keys[2] === 777) return `scandal[${keys.join(',')}]`;
  for (let i = keys.length - 1; i >= 0; i--) {
    if (typeof keys[i] === 'number' && STREAM_TAGS.has(keys[i])) return `${STREAM_TAGS.get(keys[i])}[${keys.join(',')}]`;
  }
  // [season, week, left, right] は単試合のシミュレーション
  if (keys.length === 4 && matchPairs.has(`${keys[2]}-${keys[3]}`)) return `singleMatchSim[${keys.join(',')}]`;
  // [season, week] は tickWeek 本体の共有ストリーム(週次処理の多くが順に引く)
  if (keys.length === 2) return `tickMain[${keys.join(',')}]`;
  // [season, week, id ^ 0xFEA5] はプロモ行動のイベント名抽選(management.js の週次スケジュール)
  if (keys.length === 3 && typeof keys[2] === 'number' && ((keys[2] ^ 0xFEA5) >>> 0) < 1000) return `promoEventName[id ${(keys[2] ^ 0xFEA5) >>> 0}]`;
  return `stream[${keys.join(',')}]`;
}

function compareRng(engTap, appTap, matchPairs) {
  const rows = [];
  const e = new Map((engTap?.streams || []).map(s => [s.seed, s]));
  const a = new Map((appTap?.streams || []).map(s => [s.seed, s]));
  for (const seed of new Set([...e.keys(), ...a.keys()])) {
    const es = e.get(seed), as = a.get(seed);
    const label = streamLabel(es || as, matchPairs);
    const engDraws = es ? es.draws : null;
    const appDraws = as ? as.draws : null;
    if (engDraws === appDraws) continue;
    rows.push({ label, seed, engDraws, appDraws, engCreates: es ? es.creates : 0, appCreates: as ? as.creates : 0 });
  }
  return rows.sort((x, y) => x.label.localeCompare(y.label));
}

function matchPairsOf(G0) {
  const pairs = new Set();
  for (const m of G0.showCard || []) {
    if (m && m.matchType !== 'tag' && m.left > 0 && m.right > 0) pairs.add(`${m.left}-${m.right}`);
  }
  return pairs;
}

function gameLogDelta(before, after) {
  const b = (before && before.gameLog) || [];
  const a = (after && after.gameLog) || [];
  const added = a.slice(b.length);
  const types = {};
  for (const item of added) {
    const t = typeof item === 'string' ? 'string' : (item && item.type) || 'object';
    types[t] = (types[t] || 0) + 1;
  }
  return { count: added.length, types };
}

function eventTypes(events) {
  const types = {};
  for (const item of events || []) {
    const t = typeof item === 'string' ? `string:${item.replace(/[0-9０-９.+-]+/g, '#').slice(0, 18)}` : (item && item.type) || 'object';
    types[t] = (types[t] || 0) + 1;
  }
  return { count: (events || []).length, types };
}

async function newPage(browser, server, fixtureText) {
  const context = await browser.newContext({ locale: 'ja-JP', reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', error => problems.push(`pageerror: ${error && error.message}`));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/Failed to load resource/.test(text)) return; // 画像・音声の欠落は比較と無関係
    problems.push(`console.error: ${text.slice(0, 300)}`);
  });
  page.on('dialog', dialog => { problems.push(`dialog: ${dialog.message().slice(0, 200)}`); dialog.dismiss().catch(() => {}); });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00.000Z') });
  await page.addInitScript(({ save }) => {
    localStorage.setItem('wm_audio', JSON.stringify({ muted: true, bgmMuted: true, bgmMasterVol: 0, sfxMasterVol: 0 }));
    localStorage.setItem('wm_lang', 'ja');
    localStorage.setItem('wrestle_manager_autosave', save);
  }, { save: fixtureText });
  await page.addInitScript({ path: PROBE_PATH });
  await page.goto(`${server.baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.clock.runFor(1000);
  await page.waitForFunction(() => typeof App !== 'undefined' && typeof Engine !== 'undefined' && !!window.__k1, null, { timeout: 30000 });
  return { context, page, problems };
}

function buildFixture(opts) {
  const t0 = Date.now();
  // 表示用の文選び(Math.random。Glimpse の台詞など)を種付きにして、fixture を毎回同じにする
  // (2026-09-26 K-1 第3段: --dump の前後比較で、fixture の台詞だけが実行ごとに変わっていた。数値の抽選は
  // Engine.rng なので影響しない)
  const origRandom = Math.random;
  let mr = (0x2545F491 ^ opts.fixtureSeed) >>> 0 || 1;
  Math.random = function seededFixtureRandom() {
    mr = (mr + 0x6D2B79F5) | 0;
    let t = Math.imul(mr ^ (mr >>> 15), 1 | mr);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let G;
  try {
    G = advanceUntil({
      seed: opts.fixtureSeed,
      until: g => g.season === opts.season && g.week === opts.week && g.weekPhase === 'manage' && !g.offSeason,
    });
  } finally {
    Math.random = origRandom;
  }
  // headless 進行の自動応答が例外で失敗した件数(2026-09-26)。0 でなければ fixture の世界が実プレイと違う
  // (以前は WM_I18N スタブの不足で派閥の選択が毎回失敗し、黙って捨てられていた)ので、照合の失敗として数える
  const swallowed = summarizeSwallowedErrors();
  const save = toSaveState(G, `k1-parity fixture seed=${opts.fixtureSeed} S${opts.season}W${opts.week}`);
  save.rngSeed = opts.fixtureSeed;
  return { text: JSON.stringify(save), ms: Date.now() - t0, season: save.season, week: save.week, roster: save.roster.length, swallowed };
}

async function runScenario(browser, server, fixtureText, scenario, mode, cache) {
  const { context, page, problems } = await newPage(browser, server, fixtureText);
  try {
    const loaded = await page.evaluate(() => window.__k1.loadBase());
    if (!loaded.ok) throw new Error(`loadBase failed: ${loaded.reason}`);
    const base = loaded.state;
    let buildOpts = {};
    let seedInfo = null;
    if (scenario.seedSearch) {
      if (cache.seed == null) {
        const probeG0 = scenario.build(base, {}).G0;
        const seeds = Array.from({ length: 600 }, (_, i) => 9001 + i * 7);
        seedInfo = await page.evaluate(({ G0, seeds, criteria }) => window.__k1.searchSeed(G0, seeds, criteria),
          { G0: probeG0, seeds, criteria: scenario.seedSearch });
        cache.seed = seedInfo.seed;
        cache.seedInfo = seedInfo;
      }
      seedInfo = cache.seedInfo;
      if (cache.seed != null) buildOpts = { rngSeed: cache.seed };
    }
    const built = scenario.build(base, buildOpts);
    const G0 = built.G0;
    const engine = await page.evaluate(({ G0 }) => window.__k1.runEngine(G0), { G0 });
    const app = await page.evaluate(({ G0, mode }) => window.__k1.runApp(G0, { mode }), { G0, mode });
    return { base, G0, notes: built.notes || [], seedInfo, engine, app, problems: [...problems] };
  } finally {
    await context.close();
  }
}

function analyze(run) {
  const { G0, engine, app } = run;
  const pairs = matchPairsOf(G0);
  const out = { errors: [...(engine.errors || []), ...(app.errors || [])], notes: [...run.notes, ...(app.notes || [])] };
  if (engine.postShow && app.tickInput) {
    out.A = diffStates(G0, engine.postShow, app.tickInput);
  }
  if (app.afterFinalize && app.tickInput) out.Aprime = diffTwo(app.afterFinalize, app.tickInput);
  if (engine.postTick && app.tickOutput) out.B = diffStates(G0, engine.postTick, app.tickOutput);
  if (app.tickOutput && app.final) out.C = diffTwo(app.tickOutput, app.final);
  // 結果画面の「先読み tickWeek」の前後で G そのものが変わっていれば、それは引数の共有部分を
  // 破壊的に書き換えている(= 画面を開いただけで状態が動く)ということ
  out.previewLeak = (app.previewTicks || []).map(p => ({ caller: p.caller, records: diffTwo(p.gBefore, p.gAfter) }));
  out.rngShow = compareRng(engine.rngShow, app.rngShow, pairs);
  out.rngTick = compareRng(engine.rngTick, app.rngTick, pairs);
  out.events = {
    engineShowEvents: eventTypes(engine.showEvents),
    appShowLog: gameLogDelta(G0, app.tickInput),
    engineTickEvents: eventTypes(engine.tickEvents),
    appTickEvents: eventTypes(app.tickEvents),
  };
  out.matches = {
    engine: ((engine.postShow && engine.postShow.lastShowResults) || []).map(r => ({ w: r.winner, mq: r.mq })),
    app: ((app.tickInput && app.tickInput.lastShowResults) || []).map(r => ({ w: r.winner, mq: r.mq })),
  };
  out.injuries = { engine: engine.injuryResults || [], app: app.lastInjuries || [] };
  out.intrusion = app.intrusion || null;
  return out;
}

function kindLabel(kinds) {
  return Object.entries(kinds).map(([k, n]) => `${k}${n > 1 ? `×${n}` : ''}`).join('+');
}

function printDiffBlock(title, records, verbose, limitPatterns = 400) {
  if (!records) { console.log(`  ${title}: (取得できず)`); return; }
  const groups = aggregate(records);
  console.log(`  ${title}: ${groups.length} 項目 / ${records.length} 箇所`);
  for (const g of groups.slice(0, limitPatterns)) {
    const ex = g.examples[0];
    const exText = ex.kind === 'changed'
      ? `${ex.path}: ${short(ex.base, 60)} → ${short(ex.app, 60)}`
      : `${ex.path}: base ${short(ex.base, 50)} / eng ${short(ex.eng, 50)} / app ${short(ex.app, 50)}`;
    const delta = g.maxAbsDelta ? ` maxΔ=${Math.round(g.maxAbsDelta * 1000) / 1000}` : '';
    console.log(`    ${kindLabel(g.kinds).padEnd(18)} ${g.pattern.padEnd(52)} ×${g.count}${delta}`);
    if (verbose) console.log(`        例 ${exText}`);
  }
}

function printRng(title, rows) {
  if (!rows || rows.length === 0) { console.log(`  ${title}: 全ストリームで引き数一致`); return; }
  console.log(`  ${title}: 引き数が食い違うストリーム ${rows.length} 本`);
  for (const r of rows.slice(0, 40)) {
    const e = r.engDraws == null ? '—(未使用)' : `${r.engDraws}`;
    const a = r.appDraws == null ? '—(未使用)' : `${r.appDraws}`;
    console.log(`    ${r.label.padEnd(48)} engine ${e.padStart(9)} / app ${a.padStart(9)}`);
  }
  if (rows.length > 40) console.log(`    … ほか ${rows.length - 40} 本`);
}

// 許容リスト照合
//   パターンの書き方: '*' はドットをまたがない任意の文字列、'**' はドットもまたぐ任意の文字列
const CHECKPOINTS = ['A', 'B', 'C', 'P'];

function globToRegExp(glob) {
  const escaped = glob
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^.]*')
    .replace(/\u0000/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function matchEntry(entry, pattern, checkpoint, scenario, mode) {
  if (entry.checkpoints && !entry.checkpoints.includes(checkpoint)) return false;
  if (entry.scenarios && !entry.scenarios.includes(scenario)) return false;
  if (entry.modes && !entry.modes.includes(mode)) return false;
  const pats = Array.isArray(entry.patterns) ? entry.patterns : [entry.patterns];
  return pats.some(p => globToRegExp(p).test(pattern));
}

function recordsAt(analysis, checkpoint) {
  if (checkpoint === 'P') return (analysis.previewLeak || []).flatMap(l => l.records);
  return analysis[checkpoint] || null;
}

function checkAllowlist(allRuns, { staleCheck = true } = {}) {
  const unexpected = [];
  const sideMismatch = [];
  const hits = new Map(allowlist.map(e => [e.id, 0]));
  const hitDetail = new Map(allowlist.map(e => [e.id, new Set()]));
  for (const { scenario, mode, analysis } of allRuns) {
    for (const checkpoint of CHECKPOINTS) {
      const records = recordsAt(analysis, checkpoint);
      if (!records) continue;
      for (const g of aggregate(records)) {
        const entry = allowlist.find(e => matchEntry(e, g.pattern, checkpoint, scenario, mode));
        if (!entry) {
          unexpected.push({ scenario, mode, checkpoint, pattern: g.pattern, kinds: g.kinds, example: g.examples[0] });
          continue;
        }
        hits.set(entry.id, hits.get(entry.id) + 1);
        hitDetail.get(entry.id).add(`${checkpoint}:${scenario}`);
        const sides = entry.sides && (entry.sides[checkpoint] || null);
        if (sides) {
          const bad = Object.keys(g.kinds).filter(k => !sides.includes(k));
          if (bad.length > 0) sideMismatch.push({ scenario, mode, checkpoint, pattern: g.pattern, entry: entry.id, kinds: g.kinds });
        }
      }
    }
  }
  // 「消えた既知差分」の判定は全シナリオを回したときだけ行う(--scenario で絞ると、
  // 他のシナリオでしか出ない項目が「消えた」ように見えてしまうため)
  const stale = staleCheck
    ? allowlist.filter(e => e.mustAppear && hits.get(e.id) === 0)
    : [];
  return { unexpected, sideMismatch, stale, hits, hitDetail };
}

function printCategorySummary(check) {
  const byCat = new Map();
  for (const entry of allowlist) {
    if (check.hits.get(entry.id) === 0) continue;
    const list = byCat.get(entry.category) || [];
    list.push(entry);
    byCat.set(entry.category, list);
  }
  const CAT_LABELS = {
    processing: '処理の有無(片方の経路にしか無い処理)',
    formula: '式・入力の違い(両方にあるが中身が違う)',
    rng: '乱数消費のずれ(処理は同じだが共有乱数の引き数がずれて結果が変わる)',
    leak: '先読み tickWeek の副作用(結果画面が G を直接書き換える)',
    propagation: '波及(上流の差が tickWeek を通って広がったもの)',
    transient: '一時キー・表示キュー・ログ(数値に効かない)',
  };
  console.log('\n== 検出された既知の乖離(許容リストの分類別) ==');
  for (const [cat, entries] of byCat) {
    console.log(`  [${CAT_LABELS[cat] || cat}] ${entries.length} 件`);
    for (const e of entries) {
      const where = [...check.hitDetail.get(e.id)].map(s => s.split(':')[0]);
      const cps = [...new Set(where)].join('');
      console.log(`    ${e.id.padEnd(8)} ${String(e.side || '').padEnd(6)} ${String(e.impact || '').padEnd(4)} [${cps}] ${e.title}`);
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(2, 26).join('\n'));
    return;
  }
  const selected = opts.scenario ? scenarios.filter(s => s.name === opts.scenario) : scenarios;
  if (selected.length === 0) throw new Error(`no scenario named ${opts.scenario}. available: ${scenarios.map(s => s.name).join(', ')}`);

  let fixture;
  if (opts.fixtureIn) {
    loadEngines(); // シナリオの組み立て(scenarios.js)が Node 側の Engine を使う(fixture を作るときは advanceUntil が読み込む)
    const text = fs.readFileSync(opts.fixtureIn, 'utf8');
    const save = JSON.parse(text);
    fixture = { text, ms: 0, season: save.season, week: save.week, roster: (save.roster || []).length, swallowed: [] };
    console.log(`  fixture は保存したものを使う: ${opts.fixtureIn}`);
  } else {
    fixture = buildFixture(opts);
  }
  if (opts.fixtureOut) {
    fs.mkdirSync(path.dirname(path.resolve(opts.fixtureOut)), { recursive: true });
    fs.writeFileSync(opts.fixtureOut, fixture.text);
  }
  console.log(`K-1 経路差分テスト — fixture seed=${opts.fixtureSeed} S${fixture.season}W${fixture.week} roster=${fixture.roster} (生成 ${fixture.ms}ms)`);
  const swallowedTotal = fixture.swallowed.reduce((n, g) => n + g.count, 0);
  console.log(`  headless 進行の自動応答で握りつぶした例外: ${swallowedTotal} 件`);
  for (const g of fixture.swallowed) console.log(`    ${g.where} ${g.detail} ×${g.count}(最初 ${g.first}): ${g.message}`);

  const server = await startStaticServer({ projectRoot: ROOT });
  const browser = await chromium.launch({ headless: true });
  const allRuns = [];
  const t0 = Date.now();
  try {
    for (const scenario of selected) {
      const cache = {};
      for (const mode of scenario.modes || ['skipAll']) {
        const ts = Date.now();
        const run = await runScenario(browser, server, fixture.text, scenario, mode, cache);
        const analysis = analyze(run);
        allRuns.push({ scenario: scenario.name, title: scenario.title, mode, run, analysis });
        if (opts.dump) {
          fs.mkdirSync(opts.dump, { recursive: true });
          fs.writeFileSync(path.join(opts.dump, `${scenario.name}__${mode}.json`),
            JSON.stringify({ scenario: scenario.name, mode, G0: run.G0, engine: run.engine, app: run.app }));
        }
        console.log(`\n== ${scenario.name} [${mode}] — ${scenario.title} (${Date.now() - ts}ms)`);
        if (run.notes.length) console.log(`  設定: ${run.notes.join(' / ')}`);
        if (run.seedInfo) console.log(`  シード探索: rngSeed=${run.seedInfo.seed} (${run.seedInfo.tried} 本目)`);
        if (analysis.errors.length) console.log(`  !! 実行エラー: ${analysis.errors.map(e => e.split('\n')[0]).join(' | ')}`);
        if (run.problems.length) console.log(`  ページ上のエラー/ダイアログ ${run.problems.length} 件: ${run.problems.slice(0, 3).join(' | ')}`);
        console.log(`  試合結果 engine=${JSON.stringify(analysis.matches.engine)}`);
        console.log(`  試合結果 app   =${JSON.stringify(analysis.matches.app)}`);
        if (analysis.intrusion) console.log(`  乱入(実プレイの記録。第4段 4-A からエンジンも同じ判定): ${JSON.stringify(analysis.intrusion)}`);
        console.log(`  怪我 engine=${short(analysis.injuries.engine.map(i => [i.id, i.injury && i.injury.type, i.retireType || null]), 200)}`);
        console.log(`  怪我 app   =${short(analysis.injuries.app.map(i => [i.id, i.injury && i.injury.type, i.retireType || null]), 200)}`);
        if (opts.report || opts.verbose) {
          console.log(`  ログ engine(戻り値events)=${JSON.stringify(analysis.events.engineShowEvents)} app(gameLog追記)=${JSON.stringify(analysis.events.appShowLog)}`);
          printDiffBlock('A 興行後(tickWeek入力)の差', analysis.A, opts.verbose);
          printDiffBlock("A' 実プレイ: finalize直後→tickWeek入力(closeShowResult前半)", analysis.Aprime, opts.verbose);
          printDiffBlock('B tickWeek直後の差', analysis.B, opts.verbose);
          printDiffBlock('C 実プレイ: tickWeek直後→週送り直前(closeShowResult後半)', analysis.C, opts.verbose);
          for (const leak of analysis.previewLeak) {
            printDiffBlock(`先読みtickWeekの前後でGが変わった箇所 (${leak.caller.slice(0, 80)})`, leak.records, opts.verbose);
          }
          printRng('乱数(興行処理)', analysis.rngShow);
          printRng('乱数(tickWeek)', analysis.rngTick);
        } else {
          const count = x => (x ? aggregate(x).length : 'n/a');
          console.log(`  差分項目数 A=${count(analysis.A)} B=${count(analysis.B)} C=${count(analysis.C)} / 乱数ずれ 興行=${analysis.rngShow.length} tick=${analysis.rngTick.length}`);
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  // ── 全シナリオ横断の集計(A: 興行後) ──
  const cross = new Map();
  for (const r of allRuns) {
    for (const g of aggregate(r.analysis.A || [])) {
      let c = cross.get(g.pattern);
      if (!c) { c = { pattern: g.pattern, scenarios: [], kinds: {} }; cross.set(g.pattern, c); }
      c.scenarios.push(`${r.scenario}${r.mode !== 'skipAll' ? `(${r.mode})` : ''}`);
      for (const [k, n] of Object.entries(g.kinds)) c.kinds[k] = (c.kinds[k] || 0) + n;
    }
  }
  console.log(`\n== 横断集計(A 興行後): ${cross.size} 項目 ==`);
  for (const c of [...cross.values()].sort((a, b) => a.pattern.localeCompare(b.pattern))) {
    console.log(`  ${kindLabel(c.kinds).padEnd(22)} ${c.pattern.padEnd(52)} ${c.scenarios.length}/${allRuns.length} ${opts.report ? c.scenarios.join(',') : ''}`);
  }

  // ── 許容リスト照合 ──
  const check = checkAllowlist(allRuns.map(r => ({ scenario: r.scenario, mode: r.mode, analysis: r.analysis })),
    { staleCheck: !opts.scenario });
  printCategorySummary(check);
  if (opts.scenario) console.log('  (--scenario 指定時は「消えた既知差分」の判定を省略)');
  const runErrors = allRuns.filter(r => r.analysis.errors.length > 0);
  console.log(`\n== 許容リスト照合: 登録 ${allowlist.length} 件 / 未登録の差分 ${check.unexpected.length} 件 / 向きの食い違い ${check.sideMismatch.length} 件 / 消えた既知差分 ${check.stale.length} 件 / 実行エラー ${runErrors.length} 件 / fixture の握りつぶし ${swallowedTotal} 件 ==`);
  const uniqUnexpected = new Map();
  for (const u of check.unexpected) {
    const key = `${u.checkpoint}:${u.pattern}`;
    if (!uniqUnexpected.has(key)) uniqUnexpected.set(key, u);
  }
  for (const u of [...uniqUnexpected.values()].slice(0, 80)) {
    const ex = u.example;
    const val = ex.kind === 'changed' ? `${short(ex.base, 40)} → ${short(ex.app, 40)}` : `base ${short(ex.base, 30)} / eng ${short(ex.eng, 30)} / app ${short(ex.app, 30)}`;
    console.log(`  未登録 [${u.checkpoint}] ${u.pattern} (${kindLabel(u.kinds)}) 例: ${u.scenario} ${ex.path}: ${val}`);
  }
  if (uniqUnexpected.size > 80) console.log(`  … ほか ${uniqUnexpected.size - 80} 件`);
  for (const s of check.sideMismatch.slice(0, 30)) {
    console.log(`  向き違い [${s.checkpoint}] ${s.pattern} → ${s.entry} で許容した向きと違う: ${kindLabel(s.kinds)} (${s.scenario})`);
  }
  for (const e of check.stale) {
    console.log(`  消えた既知差分 ${e.id} ${e.title} — 一本化で差分が消えたなら、許容リストから外して「差分ゼロ」に固定してください`);
  }
  for (const r of runErrors) {
    console.log(`  実行エラー ${r.scenario}[${r.mode}]: ${r.analysis.errors.map(e => e.split('\n')[0]).join(' | ')}`);
  }

  if (opts.json) {
    fs.mkdirSync(path.dirname(opts.json), { recursive: true });
    const payload = allRuns.map(r => ({
      scenario: r.scenario, title: r.title, mode: r.mode, notes: r.run.notes, seedInfo: r.run.seedInfo,
      problems: r.run.problems,
      analysis: {
        ...r.analysis,
        A: r.analysis.A && aggregate(r.analysis.A), Aprime: r.analysis.Aprime && aggregate(r.analysis.Aprime),
        B: r.analysis.B && aggregate(r.analysis.B), C: r.analysis.C && aggregate(r.analysis.C),
        previewLeak: r.analysis.previewLeak.map(l => ({ caller: l.caller, groups: aggregate(l.records) })),
      },
    }));
    fs.writeFileSync(opts.json, JSON.stringify({ generatedAt: new Date().toISOString(), fixture: { seed: opts.fixtureSeed, season: fixture.season, week: fixture.week, swallowed: fixture.swallowed }, runs: payload }, null, 1));
    console.log(`\nJSON: ${path.relative(ROOT, opts.json)}`);
  }
  console.log(`所要 ${Math.round((Date.now() - t0) / 1000)}s`);

  if (swallowedTotal > 0) {
    console.log(`  fixture の握りつぶし ${swallowedTotal} 件 — headless 進行の世界が実プレイと違うので、許容リストの照合は当てにならない(上の一覧を直すこと)`);
  }
  const failed = check.unexpected.length > 0 || check.sideMismatch.length > 0 || check.stale.length > 0 || runErrors.length > 0
    || swallowedTotal > 0;
  if (failed && !opts.report) {
    console.log('\nRESULT: FAIL(許容リストと食い違いがあります。--report で詳細を確認してください)');
    process.exitCode = 1;
  } else {
    console.log(`\nRESULT: ${failed ? 'REPORT(照合は表示のみ)' : 'PASS'}`);
  }
}

main().catch(error => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
