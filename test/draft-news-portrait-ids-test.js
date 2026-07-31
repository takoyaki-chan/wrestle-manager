'use strict';

// ドラフト記事に選手IDを渡す (task-54 / 2026-07-31 Keisuke報告「新人の記事に画像が入っていない」)
//
// 原因: 新聞のサブ記事は選手IDから顔を引く。ところが _queueDraftIndustryNews は
//   - draftPlayerResult … characterIds を2人ぶんだけ渡していた
//   - draftAiResult     … **IDを一切渡していなかった**(他団体の新人記事に顔が出ない主因)
//   - draftFlowThrough  … 同上
// さらに元データ側(draftSummary)が氏名しか持っておらず、IDを渡そうにも無かった。
//
// 直し方: draftSummary に氏名と**並行して** aiAcquiredIds / flowThroughIds を持たせる。
//   要素の型は変えない(見出し・本文が文字列配列を前提にしているため)。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const mgmt = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8').replace(/\r\n/g, '\n');
const stripComments = t => t.replace(/\/\/[^\n]*/g, '');

const src = stripComments(ui);

// ── 1. draftSummary が ID 配列を持つ ──
{
  assert.ok(/const draftSummary = \{ playerAcquired: \[\], aiAcquired: \{\}, aiAcquiredIds: \{\}, flowThrough: \[\], flowThroughIds: \[\] \};/.test(src),
    'draftSummary に ID 配列が無い。氏名しか持たないと新聞に顔を出せない');
  assert.ok(/draftSummary\.aiAcquired\[orgId\] = \[\]; draftSummary\.aiAcquiredIds\[orgId\] = \[\];/.test(src),
    'aiAcquiredIds が団体ごとに初期化されていない');
}

// ── 2. 氏名を push する箇所すべてに ID の push が並んでいる ──
{
  const lines = src.split('\n');
  const nameLines = [];
  lines.forEach((l, i) => {
    const st = l.trim();
    if (st === 'draftSummary.flowThrough.push(clean.name);') nameLines.push({ i, kind: 'flow' });
    if (/^draftSummary\.aiAcquired\[[\w.]+\]\.push\(clean\.name\);$/.test(st)) nameLines.push({ i, kind: 'ai' });
  });
  assert.ok(nameLines.length >= 8,
    `氏名を積む箇所が ${nameLines.length} 件しか見つからない。検出方法が壊れている可能性`);
  nameLines.forEach(({ i, kind }) => {
    const win = lines.slice(i, i + 4).join('\n');
    const needle = kind === 'flow' ? 'flowThroughIds' : 'aiAcquiredIds';
    assert.ok(win.includes(needle),
      `src/ui-common.js:${i + 1} — 氏名だけ積んで ID を積んでいない。`
      + `\n  この経路で獲得された選手は新聞に顔が出ない。`
      + `\n  該当行: ${lines[i].trim()}`);
  });
}

// ── 3. 交渉を挟む経路でも ID 配列が写される ──
{
  assert.ok(/aiAcquiredIds: \{\s*org_s: \[\.\.\.\(dn\.draftSummary\?\.aiAcquiredIds\?\.org_s \|\| \[\]\)\],/.test(src),
    'draftNextCandidate のスナップショットで aiAcquiredIds を写していない。'
    + '写し忘れると、交渉を1件でも挟んだ年だけ顔が消える');
  assert.ok(/flowThroughIds: \[\.\.\.\(dn\.draftSummary\?\.flowThroughIds \|\| \[\]\)\],/.test(src),
    'flowThroughIds を写していない');
}

// ── 4. 記事(story)へ ID が載る ──
{
  assert.ok(/type: 'draftAiResult',\s*ids: \[\.\.\.\(summary\.aiAcquiredIds\?\.\[orgId\] \|\| \[\]\)\],/.test(src),
    '他団体の新人記事に ID が載っていない(顔が出ない主因だった箇所)');
  assert.ok(/type: 'draftFlowThrough',\s*ids: \[\.\.\.\(summary\.flowThroughIds \|\| \[\]\)\],/.test(src),
    '指名漏れ記事に ID が載っていない');
}

// ── 5. 業界ニュースへ characterIds が渡る(3種別すべて) ──
{
  const at = src.indexOf('function _queueDraftIndustryNews');
  assert.ok(at > 0, '_queueDraftIndustryNews が無い');
  const body = src.slice(at, at + 2600);

  assert.ok(/characterIds: ports\.map\(p => p\.id\)\.filter\(/.test(body),
    '自団体の獲得で characterIds を2人に切り詰めたままになっている。'
    + '何人まで紙面に載せるかは Engine.newspaper.generate 側の判断にする');
  assert.ok(/push\('draftAiResult'[\s\S]{0,240}?characterIds: aiIds\.length \? aiIds : null,/.test(body),
    'draftAiResult に characterIds を渡していない');
  assert.ok(/push\('draftFlowThrough'[\s\S]{0,240}?characterIds: ftIds\.length \? ftIds : null,/.test(body),
    'draftFlowThrough に characterIds を渡していない');
}

// ── 6. 紙面側は3人まで載せ、超過分の人数を持つ ──
{
  const m = stripComments(mgmt);
  assert.ok(/characterIds: Array\.isArray\(ev\.characterIds\) \? ev\.characterIds\.slice\(0, 3\) : null,/.test(m),
    '紙面に載せる上限が3人になっていない');
  assert.ok(/characterCount: Array\.isArray\(ev\.characterIds\) \? ev\.characterIds\.length : 0,/.test(m),
    '元の人数(characterCount)を残していない。「+N」が出せない');
}

console.log('draft-news-portrait-ids-test: ok');
