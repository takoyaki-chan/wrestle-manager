'use strict';

// 4団体勝ち残り対抗戦の精算が二度走らないこと (2026-07-31 監査で検出)
//
// 症状の筋道:
//   _awCommitResult は精算済みの印を App._awPreview.committed(UIの一時オブジェクト)に
//   置いていた。この印は再読み込みで消える。一方 G.autumnWar.session は
//   「大会を終える」を押す finalizeAutumnWarReplay まで残る。
//   結果、結果画面のままゲームを閉じて開き直すと、initAutumnWarReplay →
//   renderAutumnWarResult → _awCommitResult と流れて **精算がもう一度走った**。
//   Engine.autumnWar.apply は冪等ではないので、資金・団体人気・MVP人気・
//   経歴(careerRecord.history)・業界記事・対戦ポイントが二重に入る。
//
//   committed の判定に使われていた G.autumnWar.champion は、リポジトリのどこからも
//   代入されていない(常に undefined)。つまり常に false だった。
//
// 直し方: 精算済みの印を **GameState 側(autumnWar.applied)** に置き、
//         大会開始(startSession)で倒す。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mgmt = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8').replace(/\r\n/g, '\n');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

const stripComments = t => t.replace(/\/\/[^\n]*/g, '');

// ── 1. apply が精算済みの印をセーブに残すか ──
{
  const src = stripComments(mgmt);
  assert.ok(/autumnWar: \{ \.\.\.s\.autumnWar, \.\.\.result, revenueDistribution, phase: 'result', cancelled: false, applied: true \}/.test(src),
    'Engine.autumnWar.apply が applied:true を残していない。'
    + 'UI の一時フラグだけでは再読み込みで消え、精算が二度走る');
}

// ── 2. 開始時に印を倒すか(前年の値を引き継ぐと今年が精算されない) ──
{
  const src = stripComments(mgmt);
  assert.ok(/session, phase: 'live', cancelled: false, applied: false \}/.test(src),
    'startSession が applied:false に戻していない。前年の精算済みフラグを引き継ぐと'
    + '今年の大会が精算されないまま終わる');
}

// ── 3. UI 側が GameState の印を見ているか ──
{
  const src = stripComments(app);
  assert.ok(/committed: !!G\.autumnWar\?\.applied,/.test(src),
    'initAutumnWarReplay が G.autumnWar.applied を見ていない');
  assert.ok(!/committed: !!G\.autumnWar\?\.champion/.test(src),
    'G.autumnWar.champion を見ている。この項目はどこからも代入されず常に undefined');

  const start = app.indexOf('  _awCommitResult() {');
  assert.ok(start >= 0, '_awCommitResult が無い');
  const body = stripComments(app.slice(start, app.indexOf('\n  },', start)));
  assert.ok(/if \(G\.autumnWar\?\.applied\)/.test(body),
    '_awCommitResult が GameState 側の精算済みフラグを見ていない');
  const appliedAt = body.indexOf('G.autumnWar?.applied');
  const applyAt = body.indexOf('Engine.autumnWar.apply(');
  assert.ok(appliedAt >= 0 && applyAt > appliedAt,
    '精算済みチェックが apply の後にある。先に見ないと意味が無い');
}

// ── 4. champion がどこからも書かれていないことの確認(誤解の再発防止) ──
{
  const writes = [mgmt, app].join('\n').match(/champion:\s*[^n\s]/g) || [];
  // session.champion への代入はあるが、autumnWar 直下の champion は無い。
  assert.ok(!/autumnWar:\s*\{[^}]*\bchampion:/.test(stripComments(mgmt)),
    'autumnWar 直下に champion を書く箇所ができた。'
    + 'applied ではなく champion を印に使う設計へ戻すなら、本テストごと見直すこと');
  void writes;
}

console.log('autumn-war-commit-once-test: ok');
