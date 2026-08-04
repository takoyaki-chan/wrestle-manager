'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DEMO_STYLES = ['Grappler', 'Aerial', 'Submission', 'Allround', 'Striker'];
const DEMO_PORTRAITS = Object.freeze({
  9: 'udagawa_r',
  11: 'tachibana_r',
  46: 'izawa_h',
  48: 'kikuchi_r',
  73: 'omagoe_y',
  98: 'yoneyama_a',
});
const COMMON_MOVE_NAMES = new Set([
  'ストンピング', 'バックエルボー', '逆水平チョップ', 'エルボー・スタンプ',
  'ニーキック', 'ドロップキック', 'ラリアット',
  'ロックアップからの押し込み', 'ショルダータックル', 'ヒップトス',
  'ファイヤーマンズキャリー', 'ボディスラム', 'スープレックス', 'ブレーンバスター', 'DDT',
  'チンロック', 'ヘッドロック', 'ハンマーロック', 'スリーパー・ホールド',
  'コブラツイスト', 'ボストンクラブ',
  'フライング・クロスボディ', 'ダイビング・ボディ・プレス', 'トペ・スイシーダ',
  'エルボードロップ', 'ニードロップ', 'ダブルニードロップ',
  'スクールボーイ', 'スモール・パッケージ', '回転エビ固め',
]);

const STYLE_MOVE_NAMES = Object.freeze({
  Grappler: new Set(['パワーボム', 'ジャーマン・スープレックス', 'デスバレーボム', 'ラストライド', '力強いラリアット', 'アルゼンチン・バックブリーカー']),
  Aerial: new Set(['フランケンシュタイナー', 'トルネードDDT', 'ムーンサルト・プレス', 'シューティング・スター・プレス', 'フロッグ・スプラッシュ', 'トペ・コンヒーロ']),
  Submission: new Set(['ギロチンチョーク', '肩固め', 'ヒール・ホールド', 'ロメロ・スペシャル', '卍固め（専）', 'バックドロップ（専）']),
  Allround: new Set(['ファルコンアロー', 'みちのくドライバーII', 'ノーザンライツ・スープレックス', 'リアネイキッドチョーク', 'フェニックス・スプラッシュ', 'スピアー']),
  Striker: new Set(['シャイニング・ウィザード（打）', 'ジャンピングニー', 'ハイキック', 'バズソーキック', 'ランニングエルボー', 'ツームストン・パイルドライバー']),
});

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`battle demo extraction marker not found: ${startMarker} -> ${endMarker}`);
  }
  return source.slice(start, end);
}

function readBattleSource(repoRoot) {
  const dataPath = path.join(repoRoot, 'src', 'data.js');
  const source = fs.readFileSync(dataPath, 'utf8');
  const moveSection = between(source, 'const commonMoves=[', '// ║  SECTION 3: ENGINE CONFIG');
  const configSection = between(source, 'const MAX_T =', '// ── Tag Match Constants');
  const context = Object.create(null);
  vm.createContext(context);
  vm.runInContext(`${moveSection}\n${configSection}\nglobalThis.__battleDemoSource = { commonMoves, styleMoves, catW, MAX_T, PHASES, ENG, BIGMATCH_MAX_T, BIGMATCH_PHASES, BIGMATCH_ENG };`, context, {
    filename: dataPath,
    timeout: 2000,
  });
  return { source, values: context.__battleDemoSource };
}

function assertSelectedMoves(values, commonMoves, styleMoves) {
  const selectedCommon = new Set(commonMoves.map((move) => move.n));
  for (const name of COMMON_MOVE_NAMES) {
    if (!selectedCommon.has(name)) throw new Error(`demo common move is missing from src/data.js: ${name}`);
  }
  for (const style of DEMO_STYLES) {
    const selected = new Set(styleMoves[style].map((move) => move.n));
    for (const name of STYLE_MOVE_NAMES[style]) {
      if (!selected.has(name)) throw new Error(`demo ${style} move is missing from src/data.js: ${name}`);
    }
    if (!values.catW[style]) throw new Error(`demo style weights are missing from src/data.js: ${style}`);
  }
}

function createBattleDataSource(repoRoot) {
  const { source, values } = readBattleSource(repoRoot);
  const commonMoves = values.commonMoves.filter((move) => COMMON_MOVE_NAMES.has(move.n));
  const styleMoves = Object.fromEntries(DEMO_STYLES.map((style) => [
    style,
    values.styleMoves[style].filter((move) => STYLE_MOVE_NAMES[style].has(move.n)),
  ]));
  const catW = Object.fromEntries(DEMO_STYLES.map((style) => [style, values.catW[style]]));
  assertSelectedMoves(values, commonMoves, styleMoves);

  const hash = crypto.createHash('sha256').update(source).digest('hex').slice(0, 12);
  const declarations = {
    commonMoves,
    styleMoves,
    catW,
    MAX_T: values.MAX_T,
    PHASES: values.PHASES,
    ENG: values.ENG,
    BIGMATCH_MAX_T: values.BIGMATCH_MAX_T,
    BIGMATCH_PHASES: values.BIGMATCH_PHASES,
    BIGMATCH_ENG: values.BIGMATCH_ENG,
  };

  return `// Generated from src/data.js (${hash}). Demo-only moves and current engine tuning.\n` +
    Object.entries(declarations).map(([name, value]) => `var ${name} = ${JSON.stringify(value)};`).join('\n') +
    '\nvar TAG_MATCH_CONFIG = {};\n';
}

function createDemoBattleShell(repoRoot) {
  const sourcePath = path.join(repoRoot, 'src', 'battle-engine.html');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const startMarker = 'const PORTRAIT={';
  const endMarker = '// 注: clamp / escHtml / _calcOvr';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('battle demo portrait adapter markers not found in src/battle-engine.html');
  const portraitSource = `const PORTRAIT=${JSON.stringify(DEMO_PORTRAITS)};\nconst PORTRAIT_OVR_VARIANT={};\n`;
  return source.slice(0, start) + portraitSource + source.slice(end);
}

module.exports = { createBattleDataSource, createDemoBattleShell, DEMO_PORTRAITS };
