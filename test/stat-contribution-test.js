// ╔══════════════════════════════════════════════════════════╗
// ║  バトルエンジン 能力値貢献度テスト                        ║
// ║  node tests/stat-contribution-test.js で一括実行          ║
// ╚══════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- ソース読み込み（vm.runInThisContext で const をグローバルに露出） ---
const srcDir = path.join(__dirname, '..', 'src');
vm.runInThisContext(fs.readFileSync(path.join(srcDir, 'data.js'), 'utf8'), { filename: 'data.js' });
vm.runInThisContext(fs.readFileSync(path.join(srcDir, 'engine.js'), 'utf8'), { filename: 'engine.js' });

// --- 定数 ---
const N = 10000;         // 試行回数
const HALF = N / 2;      // 左右入替用

// --- ヘルパー ---
function createFighter(name, pw, sp, te, st, mn, style) {
  return {
    id: name,
    name: name,
    pw, sp, te, st, mn,
    style: style || 'Allround',
    popularity: 50,
    traits: [],
    injuryWeeks: 0
  };
}

/**
 * N試合シミュレーション（左右入替2セット合算）
 * 前半 HALF 試合: charL vs charR
 * 後半 HALF 試合: charR vs charL（結果を反転）
 */
function runMatchN(charL, charR, n) {
  let leftWins = 0, rightWins = 0, draws = 0;
  let totalTurns = 0, totalMQ = 0;
  const finishTypes = {};
  const half = Math.floor(n / 2);

  // 前半: charL(left) vs charR(right)
  for (let i = 0; i < half; i++) {
    const seed = i + 1;
    const rng = Engine.rng.create(seed);
    const result = Engine.battle.simulateMatch(charL, charR, rng);
    if (result.winner === 'left') leftWins++;
    else if (result.winner === 'right') rightWins++;
    else draws++;
    totalTurns += result.turns;
    totalMQ += result.mq;
    finishTypes[result.finType] = (finishTypes[result.finType] || 0) + 1;
  }

  // 後半: charR(left) vs charL(right)  → 結果を反転
  for (let i = 0; i < half; i++) {
    const seed = half + i + 1;
    const rng = Engine.rng.create(seed);
    const result = Engine.battle.simulateMatch(charR, charL, rng);
    // 反転: left勝ち → charR勝ち → rightWins
    if (result.winner === 'left') rightWins++;
    else if (result.winner === 'right') leftWins++;
    else draws++;
    totalTurns += result.turns;
    totalMQ += result.mq;
    finishTypes[result.finType] = (finishTypes[result.finType] || 0) + 1;
  }

  const total = leftWins + rightWins + draws;
  return {
    leftWins, rightWins, draws,
    leftWinRate: (leftWins / total * 100).toFixed(1),
    rightWinRate: (rightWins / total * 100).toFixed(1),
    drawRate: (draws / total * 100).toFixed(1),
    avgTurns: (totalTurns / total).toFixed(1),
    avgMQ: (totalMQ / total).toFixed(1),
    finishTypes
  };
}

function pad(s, len) { return String(s).padEnd(len); }
function padL(s, len) { return String(s).padStart(len); }

// レポート蓄積
const reportLines = [];
function log(msg) {
  console.log(msg);
  reportLines.push(msg);
}

// =============================================================================
// Phase 1: 5特化キャラの総当たり戦
// =============================================================================
function phase1() {
  log('');
  log('=== Phase 1: 5特化キャラ総当たり（style: Allround / N=10,000） ===');
  log('');

  const fighters = [
    createFighter('PW特化', 90, 60, 60, 60, 60),
    createFighter('SP特化', 60, 90, 60, 60, 60),
    createFighter('TE特化', 60, 60, 90, 60, 60),
    createFighter('ST特化', 60, 60, 60, 90, 60),
    createFighter('MN特化', 60, 60, 60, 60, 90),
  ];

  const record = {};
  for (const f of fighters) record[f.name] = { wins: 0, losses: 0, draws: 0, matches: 0 };

  log('  ' + pad('対戦', 22) + '| ' + padL('左勝率', 7) + ' | ' + padL('右勝率', 7) + ' | ' + padL('Draw', 6) + ' | ' + padL('平均T', 6) + ' | ' + padL('平均MQ', 6));
  log('  ' + '-'.repeat(65));

  for (let i = 0; i < fighters.length; i++) {
    for (let j = i + 1; j < fighters.length; j++) {
      const L = fighters[i], R = fighters[j];
      const r = runMatchN(L, R, N);
      const label = `${L.name} vs ${R.name}`;
      log('  ' + pad(label, 22) + '| ' + padL(r.leftWinRate + '%', 7) + ' | ' + padL(r.rightWinRate + '%', 7) + ' | ' + padL(r.drawRate + '%', 6) + ' | ' + padL(r.avgTurns, 6) + ' | ' + padL(r.avgMQ, 6));

      record[L.name].wins += r.leftWins;
      record[L.name].losses += r.rightWins;
      record[L.name].draws += r.draws;
      record[L.name].matches += N;

      record[R.name].wins += r.rightWins;
      record[R.name].losses += r.leftWins;
      record[R.name].draws += r.draws;
      record[R.name].matches += N;
    }
  }

  log('');
  log('--- 総合成績（勝率ランキング） ---');
  const ranking = Object.entries(record)
    .map(([name, r]) => ({ name, winRate: r.wins / r.matches * 100, ...r }))
    .sort((a, b) => b.winRate - a.winRate);

  ranking.forEach((r, idx) => {
    log(`  ${idx + 1}位: ${pad(r.name, 8)} 総合勝率 ${r.winRate.toFixed(1)}%  (${r.wins}勝 ${r.losses}敗 ${r.draws}分 / ${r.matches}試合)`);
  });

  return ranking;
}

// =============================================================================
// Phase 2: vs ベースライン（+30の価値測定）
// =============================================================================
function phase2() {
  log('');
  log('=== Phase 2: 平均型(OV60) vs 各特化(OV66) ===');
  log('');

  const baseline = createFighter('平均型', 60, 60, 60, 60, 60);
  const specs = [
    createFighter('PW特化', 90, 60, 60, 60, 60),
    createFighter('SP特化', 60, 90, 60, 60, 60),
    createFighter('TE特化', 60, 60, 90, 60, 60),
    createFighter('ST特化', 60, 60, 60, 90, 60),
    createFighter('MN特化', 60, 60, 60, 60, 90),
  ];

  log('  ' + pad('対戦', 22) + '| ' + padL('平均型', 7) + ' | ' + padL('特化', 7) + ' | ' + padL('上昇幅', 8));
  log('  ' + '-'.repeat(50));

  const results = [];
  for (const sp of specs) {
    const r = runMatchN(baseline, sp, N);
    const boost = parseFloat(r.rightWinRate) - 50;
    log('  ' + pad(`平均型 vs ${sp.name}`, 22) + '| ' + padL(r.leftWinRate + '%', 7) + ' | ' + padL(r.rightWinRate + '%', 7) + ' | ' + padL((boost >= 0 ? '+' : '') + boost.toFixed(1) + 'pp', 8));
    results.push({ name: sp.name, specWinRate: parseFloat(r.rightWinRate), boost });
  }

  log('');
  log('--- +30の価値ランキング ---');
  results.sort((a, b) => b.specWinRate - a.specWinRate);
  results.forEach((r, idx) => {
    log(`  ${idx + 1}位: ${pad(r.name, 8)} 勝率 ${r.specWinRate.toFixed(1)}%  (${r.boost >= 0 ? '+' : ''}${r.boost.toFixed(1)}pp)`);
  });

  return results;
}

// =============================================================================
// Phase 3: スケーリング検証
// =============================================================================
function phase3() {
  log('');
  log('=== Phase 3: スケーリング検証（+10/+20/+30/+40 vs 平均型） ===');
  log('');

  const baseline = createFighter('平均型', 60, 60, 60, 60, 60);

  const statConfigs = [
    { label: 'TE', make: (v) => createFighter(`TE${v}`, 60, 60, v, 60, 60) },
    { label: 'PW', make: (v) => createFighter(`PW${v}`, v, 60, 60, 60, 60) },
    { label: 'ST', make: (v) => createFighter(`ST${v}`, 60, 60, 60, v, 60) },
  ];

  const levels = [70, 80, 90, 100];
  const allResults = {};

  for (const cfg of statConfigs) {
    log(`  --- ${cfg.label} スケーリング ---`);
    log('  ' + pad('キャラ', 10) + '| ' + padL('勝率', 7) + ' | ' + padL('平均T', 6) + ' | ' + padL('平均MQ', 6));
    log('  ' + '-'.repeat(35));

    allResults[cfg.label] = [];
    for (const lv of levels) {
      const fighter = cfg.make(lv);
      const r = runMatchN(baseline, fighter, N);
      log('  ' + pad(fighter.name, 10) + '| ' + padL(r.rightWinRate + '%', 7) + ' | ' + padL(r.avgTurns, 6) + ' | ' + padL(r.avgMQ, 6));
      allResults[cfg.label].push({ level: lv, winRate: parseFloat(r.rightWinRate), avgTurns: parseFloat(r.avgTurns), avgMQ: parseFloat(r.avgMQ) });
    }
    log('');
  }

  return allResults;
}

// =============================================================================
// Phase 4: スタイル別の相互作用
// =============================================================================
function phase4() {
  log('');
  log('=== Phase 4: スタイル別 勝率ランキング ===');
  log('');

  const styles = ['Grappler', 'Speed', 'Technique', 'Allround', 'Striker', 'Submission', 'Brawler'];
  const statNames = ['PW特化', 'SP特化', 'TE特化', 'ST特化', 'MN特化'];
  const statDefs = [
    [90, 60, 60, 60, 60],
    [60, 90, 60, 60, 60],
    [60, 60, 90, 60, 60],
    [60, 60, 60, 90, 60],
    [60, 60, 60, 60, 90],
  ];

  const allResults = {};
  let completedStyles = 0;

  for (const style of styles) {
    const fighters = statDefs.map((s, i) => createFighter(statNames[i], s[0], s[1], s[2], s[3], s[4], style));
    const record = {};
    for (const f of fighters) record[f.name] = { wins: 0, matches: 0 };

    for (let i = 0; i < fighters.length; i++) {
      for (let j = i + 1; j < fighters.length; j++) {
        const r = runMatchN(fighters[i], fighters[j], N);
        record[fighters[i].name].wins += r.leftWins;
        record[fighters[i].name].matches += N;
        record[fighters[j].name].wins += r.rightWins;
        record[fighters[j].name].matches += N;
      }
    }

    const ranking = Object.entries(record)
      .map(([name, r]) => ({ name, winRate: r.wins / r.matches * 100 }))
      .sort((a, b) => b.winRate - a.winRate);

    allResults[style] = ranking;

    const line = ranking.map((r, idx) => `${idx + 1}位:${pad(r.name, 6)} ${r.winRate.toFixed(1)}%`).join('  ');
    log(`  Style: ${pad(style, 12)} ${line}`);

    completedStyles++;
    process.stderr.write(`  [Phase 4 進捗: ${completedStyles}/${styles.length} スタイル完了]\r`);
  }
  process.stderr.write('\n');

  return allResults;
}

// =============================================================================
// Phase 5: 攻撃型 vs 防御型（OV固定の極端配分）
// =============================================================================
function phase5() {
  log('');
  log('=== Phase 5: 攻撃型 vs 防御型（OV=64, style: Allround） ===');
  log('');

  const attack  = createFighter('攻撃全振り', 90, 60, 90, 40, 40);
  const defense = createFighter('防御全振り', 40, 60, 40, 90, 90);
  const balance = createFighter('バランス', 64, 64, 64, 64, 64);

  const pairs = [
    [attack, defense],
    [attack, balance],
    [defense, balance],
  ];

  log('  ' + pad('対戦', 26) + '| ' + padL('左勝率', 7) + ' | ' + padL('右勝率', 7) + ' | ' + padL('Draw', 6) + ' | ' + padL('平均T', 6) + ' | ' + padL('平均MQ', 6));
  log('  ' + '-'.repeat(68));

  const results = [];
  for (const [L, R] of pairs) {
    const r = runMatchN(L, R, N);
    const label = `${L.name} vs ${R.name}`;
    log('  ' + pad(label, 26) + '| ' + padL(r.leftWinRate + '%', 7) + ' | ' + padL(r.rightWinRate + '%', 7) + ' | ' + padL(r.drawRate + '%', 6) + ' | ' + padL(r.avgTurns, 6) + ' | ' + padL(r.avgMQ, 6));
    results.push({ left: L.name, right: R.name, ...r });
  }

  return results;
}

// =============================================================================
// メイン実行 + サマリーレポート
// =============================================================================
function main() {
  const startTime = Date.now();

  log('╔══════════════════════════════════════════════════════════════╗');
  log('║  バトルエンジン 能力値貢献度テスト                            ║');
  log('║  N = 10,000（左右入替 各5,000試合ずつ）                      ║');
  log('╚══════════════════════════════════════════════════════════════╝');

  const p1 = phase1();
  const p2 = phase2();
  const p3 = phase3();
  const p4 = phase4();
  const p5 = phase5();

  // --- サマリーレポート ---
  log('');
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║  バトルエンジン 能力値貢献度レポート（サマリー）               ║');
  log('╠══════════════════════════════════════════════════════════════╣');
  log('');

  log('■ Phase 1 結果: 特化キャラ総合ランキング（Allround）');
  p1.forEach((r, i) => log(`  ${i + 1}位: ${pad(r.name, 8)} ${r.winRate.toFixed(1)}%`));
  log('');

  log('■ Phase 2 結果: +30の価値（vs 平均型）');
  p2.forEach((r, i) => log(`  ${i + 1}位: ${pad(r.name, 8)} 勝率${r.specWinRate.toFixed(1)}%  (${r.boost >= 0 ? '+' : ''}${r.boost.toFixed(1)}pp)`));
  log('');

  log('■ Phase 3 結果: スケーリングカーブ');
  for (const [stat, rows] of Object.entries(p3)) {
    const line = rows.map(r => `+${r.level - 60}→${r.winRate.toFixed(1)}%`).join('  ');
    log(`  ${pad(stat, 4)}: ${line}`);
  }
  log('');

  log('■ Phase 4 結果: スタイル別ランキングまとめ');
  for (const [style, ranking] of Object.entries(p4)) {
    const top = ranking[0];
    const line = ranking.map((r, i) => `${i + 1}.${r.name.replace('特化', '')} ${r.winRate.toFixed(1)}%`).join(' ');
    log(`  ${pad(style, 12)}: ${line}`);
  }
  log('');

  log('■ Phase 5 結果: 攻撃型 vs 防御型');
  for (const r of p5) {
    log(`  ${pad(r.left, 10)} vs ${pad(r.right, 10)}: ${r.leftWinRate}% vs ${r.rightWinRate}%  (Draw ${r.drawRate}%)`);
  }
  log('');

  // --- 総合分析 ---
  log('■ 総合分析');

  // 最も勝率に貢献する能力値 (Phase 1 + Phase 2 から)
  const topP1 = p1[0].name;
  const topP2 = p2[0].name;
  log(`  - 最も勝率に貢献する能力値: ${topP1}（総当たり1位）/ ${topP2}（vs平均型1位）`);

  // 最もスタイルに依存する能力値 (Phase 4 で順位の分散が最大)
  const statRankVariance = {};
  for (const sn of ['PW特化', 'SP特化', 'TE特化', 'ST特化', 'MN特化']) {
    const ranks = [];
    for (const [, ranking] of Object.entries(p4)) {
      const idx = ranking.findIndex(r => r.name === sn);
      ranks.push(idx + 1);
    }
    const avg = ranks.reduce((a, b) => a + b, 0) / ranks.length;
    const variance = ranks.reduce((a, b) => a + (b - avg) ** 2, 0) / ranks.length;
    statRankVariance[sn] = { ranks, avg, variance };
  }
  const mostStyleDep = Object.entries(statRankVariance).sort((a, b) => b[1].variance - a[1].variance)[0];
  log(`  - 最もスタイルに依存する能力値: ${mostStyleDep[0]}（順位分散 ${mostStyleDep[1].variance.toFixed(2)}）`);

  // 攻撃 vs 防御
  const atkVsDef = p5[0];
  if (parseFloat(atkVsDef.leftWinRate) > parseFloat(atkVsDef.rightWinRate)) {
    log(`  - 攻撃寄りと防御寄り: 攻撃型が有利（${atkVsDef.leftWinRate}% vs ${atkVsDef.rightWinRate}%）`);
  } else {
    log(`  - 攻撃寄りと防御寄り: 防御型が有利（${atkVsDef.rightWinRate}% vs ${atkVsDef.leftWinRate}%）`);
  }

  log('');
  log('╚══════════════════════════════════════════════════════════════╝');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`\n実行時間: ${elapsed}秒`);

  // --- ファイル出力 ---
  const docsDir = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  const reportPath = path.join(docsDir, 'stat-contribution-report.md');
  const mdContent = '# バトルエンジン 能力値貢献度レポート\n\n```\n' + reportLines.join('\n') + '\n```\n';
  fs.writeFileSync(reportPath, mdContent, 'utf8');
  console.log(`\nレポート保存先: ${reportPath}`);
}

main();
