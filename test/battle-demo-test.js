'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createBattleDataSource, DEMO_PORTRAITS } = require('../tools/battle-demo-shared');

const repoRoot = path.resolve(__dirname, '..');
const appDir = path.join(repoRoot, 'apps', 'battle-demo');
const outputDir = path.join(repoRoot, 'dist', 'battle-demo');
const battleViewFiles = [
  'battle-shared.css', 'battle-mobile.css', 'battle-sfx.js', 'battle-anim.js',
  'battle-lines.js', 'battle-replay-core.js', 'battle-engine-main.js',
];
const battleAudioFiles = [
  'b01_strike_hit_v4.mp3', 'b02_throw_hit_v1.mp3', 'b03_joint_v4.mp3', 'b12_bigmove_hit_v3.mp3',
  'b03_joint_v5.mp3', 'b06_rollup_v1.mp3', 'b07_whiff_v4.mp3', 'b08_counter_v1.mp3',
  'b09_cutin_slide_v6.mp3', 'b11_charge_v2.mp3', 'b12_bigmove_hit_v2.mp3', 'f02_kickout_v2.mp3',
  'f03_escape_v2.mp3', 'f04_heartbeat_v1.mp3', 'f05_finish_impact_v2.mp3', 'f11_ready_v1.mp3',
  'e02_crowd_v2.mp3',
  'f12_fight_start_v3.mp3', 'f13_lockup_v4.mp3',
];
const battleMusicFile = 'wm_bgm_m01_v01.ogg';

function read(relativePath, base) {
  return fs.readFileSync(path.join(base || repoRoot, relativePath), 'utf8');
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function listFiles(dir, root) {
  const base = root || dir;
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(fullPath, base) : [path.relative(base, fullPath).replace(/\\/g, '/')];
  });
}

function buildDemo() {
  const result = childProcess.spawnSync(process.execPath, [path.join(repoRoot, 'tools', 'build-battle-demo.js')], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, DEMO_PUBLIC_URL: '', DEMO_PRODUCT_BOOTH_URL: '', DEMO_PRODUCT_DLSITE_URL: '', DEMO_PRODUCT_FANZA_URL: '' },
  });
  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
}

function loadDemoEngine() {
  const context = {
    console,
    setTimeout,
    clearTimeout,
    window: null,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read('engine-bootstrap.js', appDir), context, { filename: 'engine-bootstrap.js' });
  vm.runInContext(createBattleDataSource(repoRoot), context, { filename: 'battle-data.js' });
  vm.runInContext(read('src/match-engine.js'), context, { filename: 'match-engine.js' });
  vm.runInContext(read('demo-data.js', appDir), context, { filename: 'demo-data.js' });
  return context;
}

function testSharedEngine() {
  const context = loadDemoEngine();
  assert.strictEqual(context.WMDemoEngine.isReady(), true, 'shared engine should initialize');
  assert.strictEqual(context.WMDemoData.fighters.length, 6, 'only six fighters should be exposed');
  const allowedIds = new Set([9, 11, 46, 48, 73, 98]);
  context.WMDemoData.fighters.forEach((fighter) => assert(allowedIds.has(fighter.id), `unexpected fighter id: ${fighter.id}`));

  let simulations = 0;
  for (const left of context.WMDemoData.fighters) {
    for (const right of context.WMDemoData.fighters) {
      if (left.id === right.id) continue;
      for (let replay = 0; replay < 3; replay += 1) {
        const result = context.WMDemoEngine.simulate(left, right, 1000 + left.id * 17 + right.id * 31 + replay);
        assert(['left', 'right'].includes(result.winner), 'match must have a winner');
        assert(result.finType, 'match must have a finish type');
        assert(Number.isFinite(result.turns) && result.turns > 0, 'match must advance turns');
        assert(Array.isArray(result.frames) && result.frames.length > 0, 'match must record replay frames');
        assert(result.frames[result.frames.length - 1].winner, 'final frame must record the winner');
        assert(Array.isArray(result.log) && result.log.length > 0, 'match must record a battle log');
        simulations += 1;
      }
    }
  }
  assert.strictEqual(simulations, 90, 'all demo pairings should support repeated matches');
}

function testSourceContract() {
  const html = read('index.html', appDir);
  const app = read('app.js', appDir);
  const config = read('config.js', appDir);
  const analytics = read('analytics.js', appDir);
  const data = read('demo-data.js', appDir);
  const redirects = read('_redirects', appDir);

  for (const meta of ['title', 'description', 'og:title', 'og:description', 'og:image', 'og:type', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert(html.includes(meta), `metadata should include ${meta}`);
  }
  assert(html.includes('summary_large_image'), 'X card should use a large image');
  assert(html.includes('1試合限定のバトルデモ'), 'the page should identify itself as a one-match battle demo');
  assert(!html.includes('製品版と同じ') && !app.includes('製品版と同じ'), 'visible copy should avoid repetitive product-equivalence claims');
  assert(data.includes('./image/upper/upper_tachibana_r.webp'), 'selection cards should use close upper-body artwork');
  assert(!data.includes('./image/full/'), 'selection cards should not use distant full-body artwork');
  assert(html.includes('<base href="/">'), 'nested SPA reloads should resolve assets from the Pages root');
  assert(!html.includes('shared/match-engine.js'), 'heavy battle engine must not load on the opening screen');
  assert(app.includes("loadScript('./shared/match-engine.js')"), 'battle engine should load on demand');
  assert(app.includes('./battle/battle-engine.html?demo='), 'the demo must launch the product battle viewer on demand');
  assert(!app.includes('toggleAuto'), 'the demo should leave the product viewer in manual playback mode at match start');
  assert(app.includes("new Audio('./bgm/production-ogg/wm_bgm_m01_v01.ogg')"), 'the product battle BGM should start from the demo adapter');
  assert(app.includes("trackEvent('battle_start'"), 'battle_start event should exist');
  assert(app.includes("trackEvent('battle_complete'"), 'battle_complete event should exist');
  assert(app.includes("trackEvent('rematch'"), 'rematch event should exist');
  assert(app.includes("trackEvent('product_link_click'"), 'product click event should exist');
  assert(app.includes("trackEvent('primary_cta_click'"), 'primary CTA click event should exist');
  assert(app.includes("trackEvent('result_share_click'"), 'result sharing click event should exist');
  assert(app.includes("trackEvent('follow_x_click'"), 'follow X click event should exist');
  assert(app.includes('MATCH RESULT') && app.includes('WINNER'), 'the result screen should present a satisfying match result hero');
  assert(app.includes('この一戦の先に、あなたの団体がある。'), 'the result screen should explain the next step after a match');
  assert(app.includes('無料版で団体を始める'), 'the configured free-management CTA should be available');
  assert(app.includes("./image/upper/upper_${escapeHtml(winner ? winner.assetKey : player.assetKey)}.webp"), 'the result screen should use upper-body artwork');
  assert(app.includes("new Audio('./bgm/e02_crowd_v2.mp3')"), 'the result screen should play the crowd cheer');
  assert(app.includes('shareResult()'), 'the result screen should prepare an X sharing action');
  assert(analytics.includes('WM_DEMO_ANALYTICS_ADAPTER'), 'analytics adapter hook should exist');
  assert(config.includes('wrestle-manager-demo-v1'), 'demo storage namespace should be isolated');
  assert(config.includes('promotionLinks'), 'promotion links should be configurable separately from store links');
  assert(!app.includes('wrestle_manager_save_') && !app.includes('wrestle_manager_autosave'), 'product saves must not be referenced');
  assert.strictEqual((app.match(/localStorage\./g) || []).length, 0, 'the demo should not read or write localStorage');
  for (const name of ['橘玲美', '井沢遥', '米山杏里', '宇田川里奈', '菊池璃子', '大馬越よし子']) {
    assert(data.includes(name), `selected public fighter should be present: ${name}`);
  }
  assert(!app.includes('vl: []'), 'the adapter must not suppress product victory quotes');
  assert(app.includes('fighter.vl.slice()'), 'the adapter should pass demo fighter victory quotes to the product viewer');
  assert.strictEqual((data.match(/\bvl:\s*\[/g) || []).length, 6, 'each demo fighter should include only its own victory quote set');
  assert(redirects.trim() === '/demo/* /index.html 200', 'the demo reload fallback should avoid a Cloudflare redirect loop');
}

function testProductionOutput() {
  buildDemo();
  const expectedFiles = new Set([
    '_headers', '_redirects', 'analytics.js', 'app.js', 'config.js', 'demo-data.js', 'engine-bootstrap.js', 'index.html', 'styles.css',
    'assets/og-card.png',
    'shared/battle-data.js', 'shared/match-engine.js',
    'battle/battle-engine.html',
    ...battleViewFiles.map((file) => `battle/${file}`),
    ...battleAudioFiles.map((file) => `bgm/${file}`),
    `bgm/production-ogg/${battleMusicFile}`,
    'image/battle-ring-bg-mockup-v2.webp', 'image/battle-bg_venue_4.webp',
    ...Object.values(DEMO_PORTRAITS).flatMap((key) => [
      `image/face_${key}.png`, `image/upper/upper_${key}.webp`, `image/full/full_${key}.webp`,
    ]),
  ]);
  const actualFiles = listFiles(outputDir).sort();
  assert.deepStrictEqual(new Set(actualFiles), expectedFiles, `unexpected public files: ${actualFiles.join(', ')}`);
  assert.strictEqual(
    sha256(path.join(repoRoot, 'src', 'match-engine.js')),
    sha256(path.join(outputDir, 'shared', 'match-engine.js')),
    'production demo must share the exact product match engine file'
  );
  for (const file of battleViewFiles) {
    assert.strictEqual(
      sha256(path.join(repoRoot, 'src', file)),
      sha256(path.join(outputDir, 'battle', file)),
      `production demo must share the exact product battle view file: ${file}`
    );
  }

  const battleShell = read('battle/battle-engine.html', outputDir);
  assert(battleShell.includes('const PORTRAIT={"9":"udagawa_r","11":"tachibana_r","46":"izawa_h","48":"kikuchi_r","73":"omagoe_y","98":"yoneyama_a"};'), 'battle shell must expose only six portrait mappings');
  assert(battleShell.includes('battle-engine-main.js'), 'battle shell must use the product battle presentation');
  assert(!battleShell.includes('takashima_s2'), 'unused product portrait variants must be stripped');

  const battleData = read('shared/battle-data.js', outputDir);
  assert(Buffer.byteLength(battleData, 'utf8') < 20000, 'demo battle data should stay small');
  assert(!battleData.includes('ALL_CHARS') && !battleData.includes('PORTRAIT'), 'full fighter data and portrait maps must be absent from battle tuning data');
  assert(!battleData.includes('Brawler') && !battleData.includes('Technique'), 'unused move styles must be absent');

  assert.strictEqual(
    sha256(path.join(repoRoot, 'bgm', 'production-ogg', battleMusicFile)),
    sha256(path.join(outputDir, 'bgm', 'production-ogg', battleMusicFile)),
    'production demo must use the exact product battle BGM file'
  );

  const textFiles = actualFiles.filter((file) => /\.(?:html|js|css)$/.test(file));
  const publicText = textFiles.map((file) => read(file, outputDir)).join('\n');
  const forbidden = [
    '富岡加奈子', '阿武隈塔子', '深町真琴', '白銀麗子', 'クラッシャー毒島', 'ALL_CHARS', 'CHAR_PROFILES',
    'wrestle_manager_save_', 'wrestle_manager_autosave', 'wm_audio',
    'BEGIN PRIVATE KEY', 'AKIA', 'C:\\Users\\', 'notion-client',
  ];
  forbidden.forEach((needle) => assert(!publicText.includes(needle), `public output must not contain ${needle}`));
  assert(!publicText.includes('無料バトル体験版'), 'the browser demo must not be labeled as a trial version');

  const builtConfig = read('config.js', outputDir);
  assert(builtConfig.includes('https://takoyakichan.booth.pm/items/8121734'), 'the configured BOOTH product link should remain available');
  assert(builtConfig.includes('https://www.dlsite.com/ai/work/=/product_id/RJ01592994.html'), 'the configured DLsite product link should remain available');
  const image = fs.readFileSync(path.join(outputDir, 'assets', 'og-card.png'));
  assert(image.length > 10000 && image.subarray(1, 4).toString() === 'PNG', 'OGP image should be a real PNG');
}

testSourceContract();
testSharedEngine();
testProductionOutput();
console.log('battle-demo-test: PASS');
