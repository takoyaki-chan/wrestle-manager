#!/usr/bin/env node
'use strict';

// 新聞画面(1〜4面)のフォント検査。
//
// 背景(2026-08-01 Keisuke指摘): 1面は .np-paper { font-family: 'Noto Sans JP' } が
// 土台にあるため読みやすいが、2面以下の一部セレクタは日本語が入るのに
// Oswald / Bebas Neue のような欧文専用フォントが直接指定されていた。
// これらは日本語グリフを持たないため、ブラウザは既定の sans-serif（Windowsでは
// MS Pゴシック等）へグリフ単位でフォールバックし、周囲の Noto Sans JP と混在して
// 細く不揃いに見える。
//
// 対象は src/ui-render.js の実際の描画コードを読んで「日本語が入りうる」と
// 確認したセレクタのみ(推測でCSSだけ見て判定しない):
//   .np-war-overall .wl / .np-war-breakdown span
//     → "N勝N敗"(_npRenderPage2, 過去対戦成績)。数字+漢字混在
//   .np-rivalry-facts .fact-item strong
//     → 通常は数値だが「あり」(タイトル戦経験/PPV対決/過去同団体)も入る(_npRenderPage3)
//   .np-mvprace-rank-overlay .lbl
//     → "順位"(_npMvpRaceRank1Card, 4面TOP1カード)
//   .np-mvprace-arrow / .np-mvprace-minor-arrow / .np-mvprace-list-arrow
//     → "初登場"「前週N位から上昇」等(_npMvpRaceArrowText / _npMvpRaceArrow1ChipText)
//   .np-digest-time
//     → "5分30秒"(_npTurnsToTime。1面の興行ダイジェストだが同一バグパターンのため対象化)
//
// 一方、GRADE値・OVR・VS・ポイントのような「数字・ローマ字だけ」の表示は
// Bebas Neue / Oswald のままにするのが意図的な使い分け(不変条件: 見た目を変えない)。
// 後半のブロックはその使い分けが崩れていないかの回帰ガード。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

const LATIN_ONLY_FONT_RE = /font-family:\s*'(Oswald|Bebas Neue)'/;

// selector をそのまま CSS 定義中から検索する。".foo .bar { ... }" 形式のルールを
// 全部拾う(同じセレクタが複数箇所に定義されていても全部検査する)。
function findRuleBlocks(css, selector) {
  const escaped = selector
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/ /g, '\\s+');
  const re = new RegExp(escaped + '\\s*\\{([^}]*)\\}', 'g');
  const blocks = [];
  let m;
  while ((m = re.exec(css))) blocks.push(m[1]);
  return blocks;
}

// ── 1. 日本語が入りうるセレクタに Oswald/Bebas Neue が残っていないこと ──
const JAPANESE_TEXT_SELECTORS = [
  '.np-war-overall .wl',
  '.np-war-breakdown span',
  '.np-rivalry-facts .fact-item strong',
  '.np-mvprace-rank-overlay .lbl',
  '.np-mvprace-arrow',
  '.np-mvprace-minor-arrow',
  '.np-mvprace-list-arrow',
  '.np-digest-time',
];

JAPANESE_TEXT_SELECTORS.forEach(sel => {
  const blocks = findRuleBlocks(index, sel);
  assert.ok(blocks.length > 0, `セレクタ ${sel} の定義が src/index.html に見つからない(削除/リネームされた?)`);
  blocks.forEach(block => {
    assert.ok(
      !LATIN_ONLY_FONT_RE.test(block),
      `${sel} に和文グリフを持たないフォントが指定されている(日本語が欠けたグリフへフォールバックする): ${block.trim()}`
    );
  });
});

// ── 2. 数字・ローマ字だけの表示は Bebas Neue / Oswald のままであること(回帰ガード) ──
const ROMAN_ONLY_SELECTORS = [
  '.np-headline-grade .val',   // GRADE値(D/C/B/B+/A)
  '.np-org-stats strong',      // 選手数・団体人気などの数値
  '.np-versus-mark',           // "VS"
  '.np-power-val',             // 戦力レーダーの数値
  '.np-mvprace-stat-box strong', // OVR/ポイントの数値
];

ROMAN_ONLY_SELECTORS.forEach(sel => {
  const blocks = findRuleBlocks(index, sel);
  assert.ok(blocks.length > 0, `セレクタ ${sel} の定義が src/index.html に見つからない`);
  // レスポンシブのメディアクエリ内などで同じセレクタが padding 等だけの
  // 上書きブロックとして再登場することがある(font-familyを持たなくて正常)ので、
  // 「いずれかのブロックで指定されていること」を見る(全ブロック一致ではない)
  const hasLatinFont = blocks.some(block => LATIN_ONLY_FONT_RE.test(block));
  assert.ok(
    hasLatinFont,
    `${sel} は数値・ローマ字専用表示のはずが Bebas Neue/Oswald の指定がどこにも見つからない(意図しない変更の疑い)`
  );
});

console.log('newspaper-font-latin-leak-test: ok');


// ─────────────────────────────────────────────────────────────────────
// 1面のルールを2面以下へ持っていく（Keisuke 指摘 2026-08-01）
//   1面 : 明朝は**見出しだけ**。本文は .np-paper 継承のゴシック
//   2面〜: **読ませる本文まで明朝**で、細く読みにくかった
// 見出し・選手名・リード・黒田コラムは 1面と同じく明朝のまま残す。
// **両方向を固定する**。片方だけ縛ると、次に触った人が全部ゴシックにして
// 新聞に見えなくなる。
(function testBodyGothicHeadlineSerif() {
  const BODY_MUST_BE_GOTHIC = [
    'np-ace-flavor', 'np-matchup-comment', 'np-war-comment', 'np-rivalry-narrative',
    'np-relation-card-text', 'np-mvprace-narrative', 'np-mvprace-minor-narrative',
    'np-spotlight-comment',
  ];
  const HEADLINE_MUST_STAY_SERIF = [
    'np-page-headline', 'np-page-lead', 'np-editorial-text',
    'np-mvprace-name', 'np-mvprace-minor-name',
  ];
  const ruleOf = (sel) => {
    const needle = '\n.' + sel + ' {';
    const at = index.indexOf(needle);
    assert.ok(at >= 0, 'セレクタ .' + sel + ' が見つからない');
    const end = index.indexOf('\n', at + 1);
    return index.slice(at + 1, end < 0 ? index.length : end);
  };
  BODY_MUST_BE_GOTHIC.forEach(sel => {
    const rule = ruleOf(sel);
    assert.ok(rule.indexOf('Noto Serif JP') < 0,
      '.' + sel + ' は2面以下の本文。明朝のままでは読みにくい（1面は本文をゴシックにしている）');
    assert.ok(rule.indexOf('Noto Sans JP') >= 0, '.' + sel + ' に和文ゴシックの指定が無い');
  });
  HEADLINE_MUST_STAY_SERIF.forEach(sel => {
    const rule = ruleOf(sel);
    assert.ok(rule.indexOf('Noto Serif JP') >= 0,
      '.' + sel + ' は見出し・名前・コラムの側。ここまでゴシックにすると新聞に見えなくなる');
  });
  console.log('  PASS  2面以下: 本文=ゴシック / 見出し・名前・コラム=明朝');
})();
