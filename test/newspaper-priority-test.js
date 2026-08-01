// newspaper-priority-test.js
//
// 新聞に「何が大きく載るか」を守る（2026-07-27 Keisuke）。
//
// 実測（40シーズン・1920週・記事1779件）で分かったこと:
//
//   ・新聞は既に「試合系は最大1件」に絞る仕組みを持っていた。
//     試合結果で埋まる構造ではなかった（当初の私の読み違い）
//   ・**自団体の王座移動が一度も載っていなかった**。
//     playerTitleChange は優先度180・大ニュース指定まであるのに、
//     **記事を作るコードがどこにも無かった**
//   ・`titleChange` テンプレート（見出し3本）と `hatredContagion`（嫌悪の伝染）は
//     文面が書かれているだけで、積む場所が無かった
//
// Keisuke の方針:
//   「通常興行のありふれた試合をたくさん流す必要はない。タイトルマッチならまだしも。
//     それよりも派閥の諍いとか、そういうゴシップの方が楽しい」
//   「通常興行は、一団体も多団体も下げます」

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const mgmt = read('src/management.js');
const app = read('src/app.js');
const rel = read('src/relationships.js');
const data = read('src/data.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 新聞に何が大きく載るか ===\n');

const prioSrc = (mgmt.match(/PRIORITY: \{[\s\S]*?\n  \},/) || [])[0];
const P = {};
[...prioSrc.matchAll(/^\s{4}([a-zA-Z0-9]+): *(\d+)/gm)].forEach(m => { P[m[1]] = Number(m[2]); });

section('1. 優先度表が読める', () => {
  assert.ok(Object.keys(P).length > 40, `${Object.keys(P).length} 件しか読めない`);
});

// ─────────────────────────────────────────────────────────────
// A. 一般試合はニュースではない
// ─────────────────────────────────────────────────────────────

section('2. 通常興行の一般試合は、自団体も他団体も低い', () => {
  // 「ありふれた試合をたくさん流す必要はない」
  assert.ok(P.playerShowNormal <= 55,
    `自団体の一般試合が ${P.playerShowNormal}。高すぎる`);
  assert.ok(P.aiShowHighlight <= 55,
    `他団体の一般試合が ${P.aiShowHighlight}。高すぎる`);
});

section('3. タイトルマッチは一般試合よりずっと上', () => {
  // 「タイトルマッチならまだしも」
  assert.ok(P.playerShowTitle >= P.playerShowNormal + 50,
    `タイトル戦(${P.playerShowTitle})と一般試合(${P.playerShowNormal})の差が小さい`);
  assert.ok(P.playerTitleChange > P.playerShowTitle,
    '王座が動いた記事が、通常のタイトル戦より下になっている');
});

// ─────────────────────────────────────────────────────────────
// B. ゴシップが一般試合より上
// ─────────────────────────────────────────────────────────────

section('4. 派閥の諍いは一般試合より上', () => {
  // 「派閥とかの諍いとか、そういうゴシップの方が楽しい」
  const gossip = ['factionEscalation', 'factionResolution', 'factionCoup', 'factionWarSettled',
                  'factionEndless', 'factionShowdown', 'factionDefection', 'factionSplit',
                  'factionSuccession', 'factionDissolution', 'factionInternalBout'];
  gossip.forEach(k => {
    assert.ok(P[k] != null, `${k} が優先度表に無い`);
    assert.ok(P[k] > P.playerShowNormal,
      `${k}(${P[k]}) が一般試合(${P.playerShowNormal})より下`);
  });
});

section('5. 派閥内対決は「試合」として十分に高い', () => {
  // 58 だった。派閥の諍いが形になった試合なのに、日常系と同じ帯にいた
  assert.ok(P.factionInternalBout >= 95,
    `派閥内対決が ${P.factionInternalBout}。諍いが試合になった場面なので、もっと上`);
});

section('6. 派閥の日常系も一般試合より上', () => {
  ['factionCamp', 'factionJointProject', 'factionMediaFeature'].forEach(k => {
    assert.ok(P[k] > P.playerShowNormal,
      `${k}(${P[k]}) が一般試合(${P.playerShowNormal})より下`);
  });
});

section('7. 和解系を揉め事より上にしない', () => {
  // 揉め事ばかりにしないための重しだが、上げすぎると「いつも仲直り」になる
  assert.ok(P.factionPeace < P.factionEscalation, '和解が抗争激化より目立つ');
  assert.ok(P.factionReconcile < P.factionShowdown, '和解が対決より目立つ');
});

// ─────────────────────────────────────────────────────────────
// C. 死んでいた記事を繋いだ
// ─────────────────────────────────────────────────────────────

section('8. 自団体の王座移動が新聞に載る', () => {
  // 優先度も大ニュース指定もあったのに、記事を作る場所が無かった
  assert.ok(/type: 'playerTitleChange'/.test(mgmt),
    '王座移動の記事を作っていない。ベルトが動いても新聞が黙る');
  assert.ok(/NEWS_HEADLINE_TEMPLATES\.titleChange/.test(mgmt),
    '書かれていた titleChange テンプレートを使っていない');
});

section('9. 王座移動は積み忘れようがない形にする', () => {
  // crownChampion の呼び出し元は2箇所ある。片方だけ直すと、その経路では載らない
  assert.ok(/return \{ titles: newTitles, roster: newRoster, msg, newsEvent \};/.test(mgmt),
    'crownChampion が記事を返していない。呼び出し元ごとに組むと必ず片方を忘れる');
  // 呼び出しは2箇所（エンジンの週次処理 と UI の興行実行）。増えたら積み忘れを疑う
  const callers = [...mgmt.matchAll(/Engine\.title\.crownChampion\(/g)].length
                + [...app.matchAll(/Engine\.title\.crownChampion\(/g)].length;
  assert.strictEqual(callers, 2,
    `crownChampion の呼び出しが ${callers} 箇所。増えたなら、その経路でも記事を積むこと`);
  assert.ok(/if \(crown\.newsEvent\) s = Engine\.industryNews\.push\(s, crown\.newsEvent\);/.test(mgmt),
    'エンジン側の呼び出しで積んでいない');
  assert.ok(/if \(crown\.newsEvent\) App\._pushIndustryNews\(crown\.newsEvent\);/.test(app),
    'UI側の呼び出しで積んでいない');
});

section('10. 嫌悪の伝染が新聞に載る', () => {
  assert.ok(/type: 'hatredContagion'/.test(rel),
    '嫌悪の伝染を新聞へ積んでいない。ログに流れて消えるだけ');
  // テンプレートの差し込み名と揃っていること
  const tpl = (data.match(/hatredContagion: \[[\s\S]*?\n  \],/) || [])[0] || '';
  const keys = [...new Set([...tpl.matchAll(/\{(\w+)\}/g)].map(m => m[1]))];
  assert.ok(keys.length > 0, 'テンプレートの差し込み名が読めない');
  const push = (rel.match(/type: 'hatredContagion'[\s\S]{0,400}?\}\];/) || [])[0];
  keys.forEach(k => {
    assert.ok(new RegExp(`${k}:`).test(push),
      `テンプレートが {${k}} を使うのに、積む側が渡していない`);
  });
});

section('11. 嫌悪の伝染はゴシップ帯に置く', () => {
  assert.ok(P.hatredContagion > P.playerShowNormal,
    `嫌悪の伝染(${P.hatredContagion})が一般試合より下`);
  assert.ok(P.hatredContagion < P.factionShowdown,
    '嫌悪の伝染が派閥の対決より目立つ。小さな出来事なので下に置く');
});

// ─────────────────────────────────────────────────────────────
// D. 元からある仕組みを壊していないか
// ─────────────────────────────────────────────────────────────

section('12. 試合系は最大1件の絞りを残す', () => {
  // これがあるから新聞が試合結果で埋まらない。優先度をいじっても壊さないこと
  assert.ok(/if \(matchPicks\.length > 0\) subStories\.push\(matchPicks\[0\]\);/.test(mgmt),
    '試合系を1件に絞る仕組みが消えている。新聞が試合結果で埋まる');
});

// ─────────────────────────────────────────────────────────────
// E. 一面の順番（2026-08-01 Keisuke 裁定）
// ─────────────────────────────────────────────────────────────

section('14. 天頂戦優勝は歴代最高評価の試合より大きい', () => {
  // 「最高評価の試合が生まれたのは大きな記事だけど、天頂戦優勝の方がより大きな記事」
  assert.ok(P.tenchosenResult > P.mqAllTimeRecord,
    `天頂戦優勝(${P.tenchosenResult})が歴代最高評価(${P.mqAllTimeRecord})より下。4年に一度の頂点が一面を取れない`);
  // 4年に一度の頂点なので、他の大ニュース枠より上に置く
  ['mqTagRecord', 'hotProspectDebut', 'fatedRivals', 'topChampionInjury'].forEach(k => {
    assert.ok(P.tenchosenResult > P[k], `天頂戦優勝が ${k}(${P[k]}) より下`);
  });
});

section('15. 大ニュースがトップから押し出されても号外通知は鳴る', () => {
  // 天頂戦優勝(330)が大ニュース(320以下)を肩へ落とす週がある。トップだけを見ていると
  // 記録更新の号外が黙って消える
  assert.ok(/const bigNewsStory = [\s\S]{0,260}?BIG_NEWS_TYPES\.has\(s\.type\)/.test(mgmt),
    '号に載っている大ニュース記事を拾っていない（topStory だけを見ている）');
  assert.ok(/isBigNews: !!bigNewsStory/.test(mgmt),
    'isBigNews がトップ記事の型だけで決まっている');
  assert.ok(/showBigNewsPopup\(wp\.bigNewsStory \|\| wp\.topStory/.test(app),
    '号外ポップアップが bigNewsStory を使っていない。旧号のフォールバックも要る');
});

section('16. 歴代最高評価は勝者と相手の2人で紙面に出る', () => {
  // 「勝者だけではなくて、対戦相手も含めて2人を並べた画像にするべき」
  assert.ok(/type: 'mqAllTimeRecord', characterId: winnerId, characterIds: \[winnerId, loserId\]/.test(mgmt),
    '記録記事に相手のIDを積んでいない。描画側が2人並びにできない');
  const render = read('src/ui-render.js');
  assert.ok(/PAIR_TYPES = \[[^\]]*'mqAllTimeRecord'/.test(render),
    '一面トップの2人並び写真の対象に mqAllTimeRecord が入っていない');
});

section('13. 特別興行は最上位のまま', () => {
  ['tenchosenResult', 'juniorTournamentResult', 'autumnWarResult', 'springTagResult'].forEach(k => {
    assert.ok(P[k] >= 230, `${k}(${P[k]}) が下がっている。特別興行は最上位`);
    assert.ok(P[k] > P.playerShowTitle, `${k} が通常のタイトル戦より下`);
  });
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (16 sections)');
