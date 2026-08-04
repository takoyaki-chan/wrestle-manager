'use strict';

const fs = require('fs');
const path = require('path');
const { createBattleDataSource, createDemoBattleShell, DEMO_PORTRAITS } = require('./battle-demo-shared');

const repoRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(repoRoot, 'apps', 'battle-demo');
const outputDir = path.join(repoRoot, 'dist', 'battle-demo');
const publicFiles = [
  'index.html',
  'styles.css',
  'config.js',
  'analytics.js',
  'demo-data.js',
  'engine-bootstrap.js',
  'app.js',
  '_redirects',
  '_headers',
];
const battleViewFiles = [
  'battle-shared.css',
  'battle-mobile.css',
  'battle-sfx.js',
  'battle-anim.js',
  'battle-lines.js',
  'battle-replay-core.js',
  'battle-engine-main.js',
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

function normalizedUrl(value, name) {
  if (!value) return '';
  let parsed;
  try {
    parsed = new URL(value);
  } catch (_) {
    throw new Error(`${name} must be an absolute http(s) URL.`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${name} must use http or https.`);
  }
  return parsed.href.replace(/\/$/, '');
}

function copyPublicFiles() {
  for (const relativePath of publicFiles) {
    const from = path.join(sourceDir, relativePath);
    const to = path.join(outputDir, relativePath);
    if (!fs.existsSync(from)) throw new Error(`missing battle demo source file: ${relativePath}`);
    fs.copyFileSync(from, to);
  }
}

function configureIndex() {
  const indexPath = path.join(outputDir, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const publicUrl = normalizedUrl(process.env.DEMO_PUBLIC_URL || '', 'DEMO_PUBLIC_URL');
  if (publicUrl) html = html.replaceAll('./assets/og-card.png', `${publicUrl}/assets/og-card.png`);
  fs.writeFileSync(indexPath, html, 'utf8');
}

function configureProductLinks() {
  const configPath = path.join(outputDir, 'config.js');
  const configuredUrl = (environmentName) => {
    const value = process.env[environmentName];
    return value ? normalizedUrl(value, environmentName) : undefined;
  };
  const links = Object.fromEntries([
    ['booth', configuredUrl('DEMO_PRODUCT_BOOTH_URL')],
    ['dlsite', configuredUrl('DEMO_PRODUCT_DLSITE_URL')],
    ['fanza', configuredUrl('DEMO_PRODUCT_FANZA_URL')],
  ].filter(([, value]) => value !== undefined));
  const promotionLinks = Object.fromEntries([
    ['primaryUrl', configuredUrl('DEMO_PRIMARY_CTA_URL')],
    ['primaryLabel', process.env.DEMO_PRIMARY_CTA_LABEL || undefined],
    ['trialUrl', configuredUrl('DEMO_TRIAL_URL')],
    ['followXUrl', configuredUrl('DEMO_FOLLOW_X_URL')],
  ].filter(([, value]) => value !== undefined));
  const overrides = `\nwindow.WM_DEMO_CONFIG_OVERRIDES = ${JSON.stringify({ productLinks: links, promotionLinks })};\n`;
  const original = fs.readFileSync(configPath, 'utf8');
  // Overrides must run before the default-merging config file.
  fs.writeFileSync(configPath, overrides + original, 'utf8');
}

function copySocialCard() {
  const source = path.join(sourceDir, 'assets', 'og-card.png');
  if (!fs.existsSync(source)) throw new Error('missing battle demo social card: apps/battle-demo/assets/og-card.png');
  const assetsDir = path.join(outputDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.copyFileSync(source, path.join(assetsDir, 'og-card.png'));
}

function copyBattleAssets() {
  const imageDir = path.join(outputDir, 'image');
  fs.mkdirSync(path.join(imageDir, 'upper'), { recursive: true });
  fs.mkdirSync(path.join(imageDir, 'full'), { recursive: true });
  for (const key of Object.values(DEMO_PORTRAITS)) {
    fs.copyFileSync(path.join(repoRoot, 'image', `face_${key}.png`), path.join(imageDir, `face_${key}.png`));
    fs.copyFileSync(path.join(repoRoot, 'image', 'upper', `upper_${key}.webp`), path.join(imageDir, 'upper', `upper_${key}.webp`));
    fs.copyFileSync(path.join(repoRoot, 'image', 'full', `full_${key}.webp`), path.join(imageDir, 'full', `full_${key}.webp`));
  }
  fs.copyFileSync(path.join(repoRoot, 'image', 'battle-ring-bg-mockup-v2.webp'), path.join(imageDir, 'battle-ring-bg-mockup-v2.webp'));
  fs.copyFileSync(path.join(repoRoot, 'image', 'battle-bg_venue_4.webp'), path.join(imageDir, 'battle-bg_venue_4.webp'));
}

function copyProductBattleView() {
  const battleDir = path.join(outputDir, 'battle');
  const audioDir = path.join(outputDir, 'bgm');
  const musicDir = path.join(audioDir, 'production-ogg');
  fs.mkdirSync(battleDir, { recursive: true });
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(musicDir, { recursive: true });
  fs.writeFileSync(path.join(battleDir, 'battle-engine.html'), createDemoBattleShell(repoRoot), 'utf8');
  for (const file of battleViewFiles) {
    fs.copyFileSync(path.join(repoRoot, 'src', file), path.join(battleDir, file));
  }
  for (const file of battleAudioFiles) {
    fs.copyFileSync(path.join(repoRoot, 'bgm', file), path.join(audioDir, file));
  }
  fs.copyFileSync(path.join(repoRoot, 'bgm', 'production-ogg', battleMusicFile), path.join(musicDir, battleMusicFile));
}

function build() {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outputDir, 'shared'), { recursive: true });
  copyPublicFiles();
  copySocialCard();
  copyBattleAssets();
  copyProductBattleView();
  configureIndex();
  configureProductLinks();
  fs.writeFileSync(path.join(outputDir, 'shared', 'battle-data.js'), createBattleDataSource(repoRoot), 'utf8');
  fs.copyFileSync(path.join(repoRoot, 'src', 'match-engine.js'), path.join(outputDir, 'shared', 'match-engine.js'));
  console.log(`Battle demo built: ${outputDir}`);
}

build();
