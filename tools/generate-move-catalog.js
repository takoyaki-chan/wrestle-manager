const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'src', 'data.js');
const markdownPath = path.join(root, 'docs', 'move-catalog-current-v0.1.md');
const csvPath = path.join(root, 'docs', 'move-catalog-current-v0.1.csv');
const reclassifiedMarkdownPath = path.join(root, 'docs', 'move-catalog-reclassified-v0.2.md');
const reclassifiedCsvPath = path.join(root, 'docs', 'move-catalog-reclassified-v0.2.csv');
const source = fs.readFileSync(sourcePath, 'utf8');

const categoryJa = {
  strike: '打撃',
  throw: '投げ',
  submission: '関節・絞め',
  aerial: '空中',
  ground: 'グラウンド',
  rollup: '丸め込み',
};

// Technique is a legacy temporary pool. It will be dissolved rather than
// becoming a seventh style when the move data is redesigned.
const plannedTechniqueReallocation = {
  'アームバー': { target: 'Submission', scope: 'style', scopeLabel: 'スタイル技' },
  'フィギュア4レッグロック': { target: 'Submission', scope: 'style', scopeLabel: 'スタイル技' },
  'シャープシューター': { target: 'Submission', scope: 'signature_candidate', scopeLabel: '個人技候補' },
  'STF': { target: 'Submission', scope: 'style', scopeLabel: 'スタイル技' },
  '三角絞め': { target: 'Submission', scope: 'signature_candidate', scopeLabel: '個人技候補' },
  'クロスフェイス': { target: 'Submission', scope: 'signature_candidate', scopeLabel: '個人技候補' },
  '卍固め': { target: 'Submission', scope: 'signature_candidate', scopeLabel: '個人技候補' },
  'ドラゴンスリーパー': { target: 'Submission', scope: 'signature_candidate', scopeLabel: '個人技候補' },
  'キムラロック': { target: 'Submission', scope: 'signature_candidate', scopeLabel: '個人技候補' },
  'タイガー・スープレックス': { target: 'Grappler', scope: 'signature_candidate', scopeLabel: '個人技候補' },
  'ドラゴン・スープレックス': { target: 'Grappler', scope: 'signature_candidate', scopeLabel: '個人技候補' },
  'フィッシャーマン・スープレックス': { target: 'Allround', scope: 'signature_candidate', scopeLabel: '個人技候補' },
};

// These shared moves are reclassified in the target design only. The source
// game data remains unchanged until the move-pool redesign is implemented.
const plannedCommonReallocation = {
  'ビッグブーツ': { action: 'style', targets: ['Grappler'], scopeLabel: 'スタイル技' },
  'スナップ・スープレックス': { action: 'remove', targets: [], scopeLabel: '削除' },
  'サモアン・ドロップ': { action: 'signature_candidate', targets: ['Grappler', 'Brawler'], scopeLabel: '個人技候補' },
  'タイガー・ドライバー': { action: 'signature_candidate', targets: ['Grappler', 'Allround'], scopeLabel: '個人技候補' },
};

// These remain common rollup definitions, but only Aerial wrestlers may draw
// them from the independent rollup selection.
const plannedRollupStyleRestrictions = {
  'ウラカン・ラナ': ['Aerial'],
  'ラ・マヒストラル': ['Aerial'],
};

// These are too specific to be part of Allround's baseline repertoire. They
// remain selectable as personal techniques by any style, with Allround only
// recorded as the suggested affinity.
const plannedStyleToSignatureOnly = {
  'ファルコンアロー': { affinityStyles: ['Allround'] },
  'みちのくドライバーII': { affinityStyles: ['Allround'] },
  'エクスプローダー': { affinityStyles: ['Allround'] },
  'フェニックス・スプラッシュ': { affinityStyles: ['Allround'] },
};

function parseMoves(text) {
  return [...text.matchAll(/\{n:'([^']+)',d:(\d+),c:'([^']+)'\}/g)]
    .map(([, name, damage, category]) => ({ name, damage: Number(damage), category }));
}

function tier(damage) {
  if (damage <= 5) return '小技';
  if (damage <= 10) return '中技';
  if (damage <= 13) return '大技';
  return '大技（フィニッシャー候補）';
}

function futureReviewHint(move, poolType) {
  if (plannedTechniqueReallocation[move.name]) {
    const plan = plannedTechniqueReallocation[move.name];
    return `移設予定: ${plan.target}（${plan.scopeLabel}）`;
  }
  if (poolType === 'common') return '共有技として維持';
  if (move.damage >= 14) return '個人技候補：優先検討';
  if (move.damage >= 11) return '個人技候補：検討';
  return 'スタイル技として維持候補';
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const value = item[key];
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function csv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const commonMatch = source.match(/const commonMoves=\[(.*?)\];\s*const styleMoves=/s);
const styleMatch = source.match(/const styleMoves=\{(.*?)\};\s*const catW=/s);
const weightsMatch = source.match(/const catW=\{(.*?)\};/s);
if (!commonMatch || !styleMatch || !weightsMatch) throw new Error('Move definitions could not be parsed.');

const commonMoves = parseMoves(commonMatch[1]);
const styleMoves = {};
for (const match of styleMatch[1].matchAll(/(?:^|\n)([A-Za-z]+):\[(.*?)\](?=,?\s*(?:[A-Za-z]+:\[|$))/gs)) {
  styleMoves[match[1]] = parseMoves(match[2]);
}
const categoryWeights = {};
for (const match of weightsMatch[1].matchAll(/([A-Za-z]+):\{([^}]+)\}/g)) {
  categoryWeights[match[1]] = Object.fromEntries(
    [...match[2].matchAll(/([a-z]+):(\d+)/g)].map(([, category, weight]) => [category, Number(weight)])
  );
}

const characterSection = source.slice(0, source.indexOf('const commonMoves='));
const rosterCount = countBy([...characterSection.matchAll(/style:'([^']+)'/g)].map(([, style]) => ({ style })), 'style');
const styleOrder = Object.keys(styleMoves);
const allRows = [
  ...commonMoves.map(move => ({ ...move, poolType: 'common', pool: '共通', currentUse: '全スタイル' })),
  ...styleOrder.flatMap(style => styleMoves[style].map(move => ({
    ...move,
    poolType: 'style',
    pool: `スタイル: ${style}`,
    currentUse: style,
  }))),
];

const commonCounts = countBy(commonMoves, 'category');
const summaryRows = styleOrder.map(style => {
  const moves = styleMoves[style];
  const counts = countBy(moves, 'category');
  return {
    style,
    roster: rosterCount[style] || 0,
    count: moves.length,
    big: moves.filter(move => move.damage >= 11).length,
    counts,
  };
});

const md = [];
md.push('# 現行・全技カタログ v0.1', '');
md.push('`src/data.js` の `commonMoves`、`styleMoves`、`catW` をそのまま抽出した一覧。技データを変更せず、個人技スロットを設計・選択するための現状確認用資料。', '');
md.push('## 現行の抽選構造', '');
md.push('```text', '使用可能技 = commonMoves（全スタイル共通）+ styleMoves[選手スタイル]', '丸め込み = commonMoves の rollup だけを独立抽選', '個人技スロット = 現行コードには未実装。将来ここへ追加する予定。', '```', '');
md.push('- 威力2〜5: 小技、6〜10: 中技、11〜13: 大技、14〜16: フィニッシャー候補。', '- 現行の技定義は **共通76件 + スタイル技84件 = 160件**。同名の括弧違いは別定義として数える。', '- `Technique` はスタイル技データにあるが、現行ロスター人数は0。第7スタイルにはせず、下記の再配置計画に従って廃止する。', '');
md.push('## 現行スタイル別の構成', '');
md.push('| スタイル | 現行選手数 | スタイル技 | 大技以上 | 打撃 | 投げ | 関節・絞め | 空中 | グラウンド |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const row of summaryRows) {
  md.push(`| ${row.style} | ${row.roster} | ${row.count} | ${row.big} | ${row.counts.strike || 0} | ${row.counts.throw || 0} | ${row.counts.submission || 0} | ${row.counts.aerial || 0} | ${row.counts.ground || 0} |`);
}
md.push('', '## 現行のカテゴリ抽選比率', '');
md.push('| スタイル | 打撃 | 投げ | 関節・絞め | 空中 | グラウンド |', '|---|---:|---:|---:|---:|---:|');
for (const style of styleOrder) {
  const weights = categoryWeights[style];
  md.push(`| ${style} | ${weights.strike || 0} | ${weights.throw || 0} | ${weights.submission || 0} | ${weights.aerial || 0} | ${weights.ground || 0} |`);
}
md.push('', '## Technique仮置き12技の再配置計画', '');
md.push('`Technique` スタイルは作らない。下表はデータを変更する時の移設先であり、現時点の実装はまだ旧プールのままである。', '');
md.push('| 技名 | 威力 | カテゴリ | 移設先 | 将来の扱い |', '|---|---:|---|---|---|');
for (const move of styleMoves.Technique || []) {
  const plan = plannedTechniqueReallocation[move.name];
  if (!plan) throw new Error(`Technique move has no reassignment plan: ${move.name}`);
  md.push(`| ${move.name} | ${move.damage} | ${categoryJa[move.category]} | ${plan.target} | ${plan.scope} |`);
}
md.push('', '## 共通技（76）', '');
md.push('| 技名 | 威力 | 技帯 | カテゴリ | 現在のプール | 個人技化の初期判定 |', '|---|---:|---|---|---|---|');
for (const move of commonMoves) {
  md.push(`| ${move.name} | ${move.damage} | ${tier(move.damage)} | ${categoryJa[move.category]} | 共通 | ${futureReviewHint(move, 'common')} |`);
}
for (const style of styleOrder) {
  const label = style === 'Technique' ? 'Technique（旧仮置きプール。再配置予定）' : style;
  md.push('', `## ${label} のスタイル技（${styleMoves[style].length}）`, '');
  md.push('| 技名 | 威力 | 技帯 | カテゴリ | 現在のプール | 個人技化の初期判定 |', '|---|---:|---|---|---|---|');
  for (const move of styleMoves[style]) {
    md.push(`| ${move.name} | ${move.damage} | ${tier(move.damage)} | ${categoryJa[move.category]} | スタイル: ${style} | ${futureReviewHint(move, 'style')} |`);
  }
}
md.push('', '## 個人技スロットの選定メモ', '');
md.push('- 将来案：各選手は初期持ち技1枠 + 育成で解放される2枠、最大3枠。', '- 個人技は威力・命中へ特別補正を付けず、`共通技 + スタイル技` に追加する。', '- 14〜16の派手技は、共有に残すか個人技候補にするかをこの一覧で1技ずつ決める。威力だけで自動的に個人技化しない。', '- 一覧の「個人技化の初期判定」は決定ではない。ユーザーの選択後に、技へ `shared / style / signature` の属性を設定する。', '');

const csvHeader = ['current_pool_type', 'current_pool', 'move_name_ja', 'damage', 'tier_ja', 'category', 'category_ja', 'current_use', 'future_target_pool', 'future_scope', 'future_personal_move_review'];
const csvRows = [csvHeader.join(',')];
for (const row of allRows) {
  csvRows.push([
    row.poolType,
    row.pool,
    row.name,
    row.damage,
    tier(row.damage),
    row.category,
    categoryJa[row.category],
    row.currentUse,
    plannedTechniqueReallocation[row.name]?.target || '',
    plannedTechniqueReallocation[row.name]?.scopeLabel || '',
    futureReviewHint(row, row.poolType),
  ].map(csv).join(','));
}

// ── Target catalog after Technique is dissolved ──────────────
const reclassifiedStyleOrder = styleOrder.filter(style => style !== 'Technique');
const reclassifiedStyleMoves = Object.fromEntries(
  reclassifiedStyleOrder.map(style => [style, styleMoves[style].map(move => ({
    ...move,
    originPool: style,
    targetScope: 'style',
    targetScopeLabel: 'スタイル技',
  }))])
);
const reclassifiedCommonMoves = [];
const individualCandidates = [];
for (const style of reclassifiedStyleOrder) {
  const retained = [];
  for (const move of reclassifiedStyleMoves[style]) {
    const plan = plannedStyleToSignatureOnly[move.name];
    if (!plan) {
      retained.push(move);
      continue;
    }
    individualCandidates.push({
      ...move,
      originPool: style,
      affinityStyles: plan.affinityStyles,
      eligibleStyles: reclassifiedStyleOrder,
      targetScope: 'signature_only',
      targetScopeLabel: '固有選定専用技',
    });
  }
  reclassifiedStyleMoves[style] = retained;
}
for (const move of commonMoves) {
  const plan = plannedCommonReallocation[move.name];
  if (!plan) {
    reclassifiedCommonMoves.push({
      ...move,
      originPool: 'common',
      eligibleStyles: plannedRollupStyleRestrictions[move.name] || reclassifiedStyleOrder,
    });
    continue;
  }
  if (plan.action === 'style') {
    for (const target of plan.targets) {
      reclassifiedStyleMoves[target].push({
        ...move,
        originPool: 'common',
        targetScope: 'style',
        targetScopeLabel: plan.scopeLabel,
      });
    }
  } else if (plan.action === 'signature_candidate') {
    individualCandidates.push({
      ...move,
      originPool: 'common',
      affinityStyles: plan.targets,
      eligibleStyles: reclassifiedStyleOrder,
      targetScope: plan.action,
      targetScopeLabel: plan.scopeLabel,
    });
  } else if (plan.action !== 'remove') {
    throw new Error(`Unknown common-move action: ${plan.action}`);
  }
}
for (const move of styleMoves.Technique || []) {
  const plan = plannedTechniqueReallocation[move.name];
  if (!plan) throw new Error(`Technique move has no reassignment plan: ${move.name}`);
  const targetMove = {
    ...move,
    originPool: 'Technique',
    affinityStyles: [plan.target],
    eligibleStyles: reclassifiedStyleOrder,
    targetScope: plan.scope,
    targetScopeLabel: plan.scopeLabel,
  };
  if (plan.scope === 'style') reclassifiedStyleMoves[plan.target].push(targetMove);
  else individualCandidates.push(targetMove);
}

const reclassifiedSummaryRows = reclassifiedStyleOrder.map(style => {
  const moves = reclassifiedStyleMoves[style];
  const counts = countBy(moves, 'category');
  return {
    style,
    roster: rosterCount[style] || 0,
    count: moves.length,
    big: moves.filter(move => move.damage >= 11).length,
    counts,
  };
});

const reclassifiedMd = [];
reclassifiedMd.push('# 再配置後・全技カタログ v0.2', '');
reclassifiedMd.push('`Technique` プールを廃止し、共有技・スタイル技・固有選定専用技を分け直した将来案。ゲームの `src/data.js` はまだ変更していない。', '');
reclassifiedMd.push('## 再配置後の抽選構造', '');
reclassifiedMd.push('```text', `基礎使用技 = 共通技（${reclassifiedCommonMoves.length}）+ スタイル技`, '個人技スロット = 初期1 + 育成2、最大3。全技から選べる表示・演出用の個人化枠', '試合計算 = 個人技の表示名へ差し替える前に選ばれた基礎技の威力・命中・カテゴリを使用', '丸め込み = 共通技の rollup を独立抽選し、技ごとの利用スタイル条件で絞り込む', 'Technique = 廃止。単独のスタイル・抽選比率・選手枠を持たない。', '```', '');
reclassifiedMd.push('- 個人技に選べる対象は、共有技・スタイル技・固有選定専用技を含む全159技。スタイル外の技も選べる。', '- ただし個人技は候補へ直接追加しない。基礎技と同じカテゴリ・技帯の時に表示名と絵を差し替えるため、選択技の威力13／16で有利不利が生まれない。', '- ビッグブーツはGrapplerのスタイル技へ移す。スナップ・スープレックスは削除する。サモアンドロップとタイガードライバーは共有技から外し、固有選定専用技へ移す。', '- ウラカン・ラナとラ・マヒストラルは共有の丸め込み定義のまま、Aerialだけが独立丸め込み抽選で使える。スタイル技には移さない。', '- ファルコンアロー、みちのくドライバーII、エクスプロイダー、フェニックス・スプラッシュはAllroundの基礎レパートリーから外し、固有選定専用技へ移す。', '');
reclassifiedMd.push('## 再配置後のスタイル構成', '');
reclassifiedMd.push('| スタイル | 選手数 | 技数 | 大技以上 | 打撃 | 投げ | 関節・絞め | 空中 | グラウンド |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const row of reclassifiedSummaryRows) {
  reclassifiedMd.push(`| ${row.style} | ${row.roster} | ${row.count} | ${row.big} | ${row.counts.strike || 0} | ${row.counts.throw || 0} | ${row.counts.submission || 0} | ${row.counts.aerial || 0} | ${row.counts.ground || 0} |`);
}
reclassifiedMd.push('', '## 旧Technique 12技の移設先', '');
reclassifiedMd.push('| 技名 | 移設先 | 配置 |', '|---|---|---|');
for (const move of styleMoves.Technique || []) {
  const plan = plannedTechniqueReallocation[move.name];
  reclassifiedMd.push(`| ${move.name} | ${plan.target} | ${plan.scopeLabel} |`);
}
reclassifiedMd.push('', '## 共有技から外す4技', '');
reclassifiedMd.push('| 技名 | 再配置 | 推奨スタイル |', '|---|---|---|');
for (const move of commonMoves.filter(move => plannedCommonReallocation[move.name])) {
  const plan = plannedCommonReallocation[move.name];
  reclassifiedMd.push(`| ${move.name} | ${plan.scopeLabel} | ${plan.targets.join(' / ') || 'なし'} |`);
}
reclassifiedMd.push('', `## 共通技（${reclassifiedCommonMoves.length}）`, '');
reclassifiedMd.push('| 技名 | 威力 | 技帯 | カテゴリ | 配置 | 使用可能スタイル |', '|---|---:|---|---|---|---|');
for (const move of reclassifiedCommonMoves) {
  const eligible = move.eligibleStyles.length === reclassifiedStyleOrder.length ? '全スタイル' : move.eligibleStyles.join(' / ');
  reclassifiedMd.push(`| ${move.name} | ${move.damage} | ${tier(move.damage)} | ${categoryJa[move.category]} | 共有技 | ${eligible} |`);
}
reclassifiedMd.push('', '## Aerial限定の共有丸め込み', '');
reclassifiedMd.push('| 技名 | 定義上の配置 | 抽選上の利用制限 |', '|---|---|---|');
for (const [name, styles] of Object.entries(plannedRollupStyleRestrictions)) {
  reclassifiedMd.push(`| ${name} | 共有丸め込み | ${styles.join(' / ')} のみ |`);
}
for (const style of reclassifiedStyleOrder) {
  const moves = reclassifiedStyleMoves[style];
  reclassifiedMd.push('', `## ${style} の再配置後技（${moves.length}）`, '');
  reclassifiedMd.push('| 技名 | 威力 | 技帯 | カテゴリ | 配置 | 出所 | 個人技化の検討 |', '|---|---:|---|---|---|---|---|');
  for (const move of moves) {
    const origin = move.originPool === 'Technique'
      ? '旧Technique'
      : move.originPool === 'common'
        ? '旧共有技'
        : '現行スタイル技';
    const review = move.originPool === 'Technique' || move.originPool === 'common'
      ? move.targetScopeLabel
      : futureReviewHint(move, 'style');
    reclassifiedMd.push(`| ${move.name} | ${move.damage} | ${tier(move.damage)} | ${categoryJa[move.category]} | ${move.targetScopeLabel} | ${origin} | ${review} |`);
  }
}
reclassifiedMd.push('', `## 固有選定専用技（${individualCandidates.length}）`, '');
reclassifiedMd.push('基礎使用技には入らない。全スタイルの選手が個人技スロットで選択でき、推奨スタイルはUIの絞り込みやキャラクター性の目安として使う。', '');
reclassifiedMd.push('| 技名 | 威力 | 技帯 | カテゴリ | 推奨スタイル | 選択可能スタイル | 出所 |', '|---|---:|---|---|---|---|---|');
for (const move of individualCandidates) {
  const origin = move.originPool === 'Technique' ? '旧Technique' : move.originPool === 'common' ? '旧共有技' : '旧スタイル技';
  reclassifiedMd.push(`| ${move.name} | ${move.damage} | ${tier(move.damage)} | ${categoryJa[move.category]} | ${move.affinityStyles.join(' / ')} | 全スタイル | ${origin} |`);
}
reclassifiedMd.push('', '## 個人技スロットの前提', '');
reclassifiedMd.push('- 初期持ち技1枠 + 育成解放2枠、最大3枠。', '- 個人技は特別な威力補正を持たず、基礎技の表示名・絵を置換する。', '- 既にスタイル技として使える技を個人技に選んだ時は、その表示が出る確率だけを上げる。技定義を二重に作らない。', '- 個人技の選択自体は全技から可能とし、推奨スタイルは選びやすさのための目安に留める。', '');

const reclassifiedCsvHeader = ['target_pool_type', 'target_pool', 'move_name_ja', 'damage', 'tier_ja', 'category', 'category_ja', 'eligible_styles', 'affinity_styles', 'placement', 'origin_pool', 'personal_move_review'];
const reclassifiedCsvRows = [reclassifiedCsvHeader.join(',')];
for (const move of reclassifiedCommonMoves) {
  reclassifiedCsvRows.push([
    'common', '共通', move.name, move.damage, tier(move.damage), move.category,
    categoryJa[move.category], move.eligibleStyles.length === reclassifiedStyleOrder.length ? '全スタイル' : move.eligibleStyles.join(' / '), '', '共有技', 'common', '共有技として維持',
  ].map(csv).join(','));
}
for (const style of reclassifiedStyleOrder) {
  for (const move of reclassifiedStyleMoves[style]) {
    reclassifiedCsvRows.push([
      'style', style, move.name, move.damage, tier(move.damage), move.category,
      categoryJa[move.category], style, style, move.targetScopeLabel, move.originPool,
      move.originPool === 'Technique' ? move.targetScopeLabel : futureReviewHint(move, 'style'),
    ].map(csv).join(','));
  }
}
for (const move of individualCandidates) {
  reclassifiedCsvRows.push([
    'personal_candidate', move.eligibleStyles.join(' / '), move.name, move.damage, tier(move.damage), move.category,
    categoryJa[move.category], move.eligibleStyles.join(' / '), move.affinityStyles.join(' / '), move.targetScopeLabel, move.originPool, move.targetScopeLabel,
  ].map(csv).join(','));
}

fs.writeFileSync(markdownPath, `${md.join('\n')}\n`, 'utf8');
fs.writeFileSync(csvPath, `\uFEFF${csvRows.join('\n')}\n`, 'utf8');
fs.writeFileSync(reclassifiedMarkdownPath, `${reclassifiedMd.join('\n')}\n`, 'utf8');
fs.writeFileSync(reclassifiedCsvPath, `\uFEFF${reclassifiedCsvRows.join('\n')}\n`, 'utf8');
console.log(`Wrote ${path.relative(root, markdownPath)} (${allRows.length} entries).`);
console.log(`Wrote ${path.relative(root, csvPath)} (${allRows.length} entries).`);
console.log(`Wrote ${path.relative(root, reclassifiedMarkdownPath)} (${reclassifiedCsvRows.length - 1} entries).`);
console.log(`Wrote ${path.relative(root, reclassifiedCsvPath)} (${reclassifiedCsvRows.length - 1} entries).`);
