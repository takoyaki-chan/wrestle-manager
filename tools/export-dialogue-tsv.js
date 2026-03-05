#!/usr/bin/env node
/**
 * セリフ＆プロフィール一括TSVエクスポートツール
 * 出力先: tools/export/ ディレクトリ
 *
 * Usage: node tools/export-dialogue-tsv.js
 */
const fs = require('fs');
const path = require('path');

// ── ソースファイル読み込み ──
const dataJs = fs.readFileSync(path.join(__dirname, '../src/data.js'), 'utf-8');
const uiCommonJs = fs.readFileSync(path.join(__dirname, '../src/ui-common.js'), 'utf-8');
const victoryLinesJs = fs.readFileSync(path.join(__dirname, '../src/victory-lines.js'), 'utf-8');

// eval で定数をロード
const sandbox = {};
const evalCode = dataJs + '\n' + victoryLinesJs + '\n' + uiCommonJs.split('function pickQuote')[0];
// 安全にeval: グローバル汚染を避けるためFunction使用
try {
  const fn = new Function(`
    ${dataJs}
    ${victoryLinesJs}
    // EVENT_QUOTES from ui-common.js (extract only the constant)
    ${extractConst(uiCommonJs, 'EVENT_QUOTES')}
    return { ALL_CHARS, CHAR_PROFILES, AWARD_LINES,
             RIVALRY_CONFRONTATION_LINES, RIVALRY_RESOLUTION_LINES,
             PPV_OPPONENT_LINES, PPV_HYPE_TEMPLATES,
             VICTORY_LINES, EVENT_QUOTES,
             BREAKTHROUGH_LINES, SLUMP_START_LINES, SLUMP_END_LINES,
             MOTIVATION_LOSS_LINES, MOTIVATION_RECOVERY_LINES };
  `);
  Object.assign(sandbox, fn());
} catch(e) {
  console.error('Failed to parse source files:', e.message);
  process.exit(1);
}

function extractConst(source, name) {
  // EVENT_QUOTES = { ... }; の範囲を抽出
  const startIdx = source.indexOf(`const ${name} = {`);
  if (startIdx < 0) return `const ${name} = {};`;
  let depth = 0, i = source.indexOf('{', startIdx);
  for (; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') { depth--; if (depth === 0) break; }
  }
  return source.substring(startIdx, i + 2); // include };
}

// ── 出力ディレクトリ ──
const outDir = path.join(__dirname, 'export');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// BOM付きUTF-8 TSV書き出し
function writeTSV(filename, headers, rows) {
  const bom = '\uFEFF';
  const tsv = headers.join('\t') + '\n' + rows.map(r => r.join('\t')).join('\n') + '\n';
  fs.writeFileSync(path.join(outDir, filename), bom + tsv, 'utf-8');
  console.log(`  ✓ ${filename} (${rows.length} rows)`);
}

console.log('=== セリフ＆プロフィール TSVエクスポート ===\n');

// ═══════════════════════════════════════════════════════════
// 1. キャラクタープロフィール
// ═══════════════════════════════════════════════════════════
{
  const rows = sandbox.ALL_CHARS.map(c => [
    c.id,
    c.name,
    c.role,
    c.style,
    (c.traits || []).join(', '),
    (sandbox.CHAR_PROFILES[c.id] || '').replace(/\t/g, ' ').replace(/\n/g, ' '),
    '' // 修正後
  ]);
  writeTSV('01_キャラクタープロフィール.tsv',
    ['ID', '名前', 'Role', 'Style', '特性', '現在のプロフィール', '修正後プロフィール'],
    rows);
}

// ═══════════════════════════════════════════════════════════
// 2. 勝利セリフ（キャラ別）
// ═══════════════════════════════════════════════════════════
{
  const rows = [];
  for (const c of sandbox.ALL_CHARS) {
    const lines = sandbox.VICTORY_LINES[c.id] || [];
    lines.forEach((line, i) => {
      rows.push([c.id, c.name, (c.traits || []).join(', '), i + 1, line, '']);
    });
  }
  writeTSV('02_勝利セリフ.tsv',
    ['ID', '名前', '特性', '番号', '現在のセリフ', '修正後セリフ'],
    rows);
}

// ═══════════════════════════════════════════════════════════
// 3. 年末表彰式セリフ (AWARD_LINES)
// ═══════════════════════════════════════════════════════════
{
  const categoryNames = {
    rookie: '新人王',
    bestMatch: 'ベストマッチ',
    mvp: 'MVP',
    champion: '王者',
    hallOfFame: '殿堂入り'
  };
  const rows = [];
  for (const [key, lines] of Object.entries(sandbox.AWARD_LINES)) {
    lines.forEach((line, i) => {
      rows.push([key, categoryNames[key] || key, i + 1, line, '']);
    });
  }
  writeTSV('03_年末表彰式セリフ.tsv',
    ['カテゴリKey', 'カテゴリ名', '番号', '現在のセリフ', '修正後セリフ'],
    rows);
}

// ═══════════════════════════════════════════════════════════
// 4. 因縁マッチセリフ
// ═══════════════════════════════════════════════════════════
{
  const rows = [];
  // Confrontation pairs
  sandbox.RIVALRY_CONFRONTATION_LINES.pairs.forEach((pair, i) => {
    rows.push(['confrontation', '宣戦布告（通常）', i + 1, 'P1', pair[0], '']);
    rows.push(['confrontation', '宣戦布告（通常）', i + 1, 'P2', pair[1], '']);
  });
  sandbox.RIVALRY_CONFRONTATION_LINES.fatePairs.forEach((pair, i) => {
    rows.push(['fatePairs', '宣戦布告（宿命）', i + 1, 'P1', pair[0], '']);
    rows.push(['fatePairs', '宣戦布告（宿命）', i + 1, 'P2', pair[1], '']);
  });
  // Resolution
  for (const [key, lines] of Object.entries(sandbox.RIVALRY_RESOLUTION_LINES)) {
    const labels = { winner: '決着・勝者', loser: '決着・敗者', fateWinner: '宿命決着・勝者', fateLoser: '宿命決着・敗者' };
    lines.forEach((line, i) => {
      rows.push([key, labels[key] || key, i + 1, '', line, '']);
    });
  }
  writeTSV('04_因縁マッチセリフ.tsv',
    ['カテゴリKey', 'カテゴリ名', '番号', '話者', '現在のセリフ', '修正後セリフ'],
    rows);
}

// ═══════════════════════════════════════════════════════════
// 5. PPVセリフ
// ═══════════════════════════════════════════════════════════
{
  const rows = [];
  const attitudeNames = { confident: '自信', fierce: '闘志', respectful: '敬意', calm: '冷静' };
  for (const [att, lines] of Object.entries(sandbox.PPV_OPPONENT_LINES)) {
    lines.forEach((line, i) => {
      rows.push(['PPV_OPPONENT', attitudeNames[att] || att, att, i + 1, line, '']);
    });
  }
  const hypeNames = { rivalry: '因縁', tierGap: '格差', closeOVR: '実力伯仲', starMatch: 'スター対決', summit: '頂上決戦' };
  for (const [type, lines] of Object.entries(sandbox.PPV_HYPE_TEMPLATES)) {
    lines.forEach((line, i) => {
      rows.push(['PPV_HYPE', hypeNames[type] || type, type, i + 1, line, '']);
    });
  }
  writeTSV('05_PPVセリフ.tsv',
    ['種別', 'カテゴリ名', 'カテゴリKey', '番号', '現在のセリフ', '修正後セリフ'],
    rows);
}

// ═══════════════════════════════════════════════════════════
// 6. タイトルマッチ反応セリフ (EVENT_QUOTES: titleWin/Defense/ChallengeLoss/Loss)
// ═══════════════════════════════════════════════════════════
{
  const categories = {
    titleWin: '王座奪取（新チャンピオン）',
    titleDefense: 'タイトル防衛成功',
    titleChallengeLoss: 'タイトル挑戦失敗',
    titleLoss: '王座陥落（前王者）'
  };
  const rows = [];
  for (const [key, label] of Object.entries(categories)) {
    const pool = sandbox.EVENT_QUOTES[key];
    if (!pool) continue;
    for (const [trait, lines] of Object.entries(pool)) {
      const traitLabel = trait === '_default' ? '（デフォルト）' : trait;
      lines.forEach((line, i) => {
        rows.push([key, label, traitLabel, i + 1, line, '']);
      });
    }
  }
  writeTSV('06_タイトルマッチ反応セリフ.tsv',
    ['カテゴリKey', 'カテゴリ名', '特性', '番号', '現在のセリフ', '修正後セリフ'],
    rows);
}

// ═══════════════════════════════════════════════════════════
// 7. 成長イベントセリフ
// ═══════════════════════════════════════════════════════════
{
  const rows = [];
  sandbox.BREAKTHROUGH_LINES.forEach((line, i) => {
    rows.push(['breakthrough', 'ブレークスルー', '', i + 1, line, '']);
  });
  for (const [trigger, lines] of Object.entries(sandbox.SLUMP_START_LINES)) {
    lines.forEach((line, i) => {
      rows.push(['slump_start', 'スランプ開始', trigger, i + 1, line, '']);
    });
  }
  sandbox.SLUMP_END_LINES.forEach((line, i) => {
    rows.push(['slump_end', 'スランプ脱出', '', i + 1, line, '']);
  });
  sandbox.MOTIVATION_LOSS_LINES.forEach((line, i) => {
    rows.push(['motivation_loss', 'モチベーション喪失', '', i + 1, line, '']);
  });
  sandbox.MOTIVATION_RECOVERY_LINES.forEach((line, i) => {
    rows.push(['motivation_recovery', 'モチベーション回復', '', i + 1, line, '']);
  });
  writeTSV('07_成長イベントセリフ.tsv',
    ['カテゴリKey', 'カテゴリ名', 'トリガー', '番号', '現在のセリフ', '修正後セリフ'],
    rows);
}

console.log(`\n✅ 全ファイル出力完了: ${outDir}`);
console.log('\n【使い方】');
console.log('1. TSVファイルをExcel/Googleスプレッドシートで開く');
console.log('2. 「修正後」列にセリフを記入（空欄 = 変更なし）');
console.log('3. 保存したTSVを私に渡してください → コードに反映します');
