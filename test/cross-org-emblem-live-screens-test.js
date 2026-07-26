'use strict';

// 他団体が絡む対戦での団体エンブレム表示を、**プレイヤーが実際に到達できる画面**で固定する。
//
// 2026-07-26 の U6 は showPPVVSDetail / _renderB3MatchPreview にエンブレムを足したが、
// どちらも呼び出し元ゼロの死んだ関数だった(既存の u6 テストは関数単体の挙動しか見ないため
// 素通りした)。同じ取り違えを繰り返さないよう、このテストは
//   (a) 対象の関数が到達可能であること
//   (b) その中でエンブレムが条件付きで出ること
// の2点を必ず対にして検査する。

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const app = readSource('src', 'app.js');
const render = readSource('src', 'ui-render.js');
const allSrc = [ui, app, render].join('\n');

function extractFunction(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(brace + 1, i);
    }
  }
  throw new Error(`${signature} body end not found`);
}

function occurrences(hay, needle) {
  return (hay.match(new RegExp(`\\b${needle}\\b`, 'g')) || []).length;
}

/** 定義以外にも出現している = どこかから呼ばれている */
function assertReachable(name) {
  const n = occurrences(allSrc, name);
  assert.ok(n >= 2,
    `${name}() は定義されているだけで呼び出し元が無い。この画面に手を入れてもプレイヤーには見えない`);
}

// ── 1) 共通ヘルパー ──
const guestFn = extractFunction(ui, 'function guestOrgIdOf(');
assert.ok(guestFn.includes('isCRGuest') && guestFn.includes('isB3ChallengeGuest'),
  '挑戦試合のゲスト判定は isCRGuest / isB3ChallengeGuest の両方を見ること');

const crossFn = extractFunction(ui, 'function crossOrgEmblemHtml(');
assert.ok(crossFn.includes("'player'"),
  '自団体側は player のエンブレムへフォールバックすること');
assert.ok(crossFn.includes('return \'\''),
  '同一団体同士では何も出さないこと(mockup-baseline §5)');
assertReachable('crossOrgEmblemHtml');
assertReachable('guestOrgIdOf');

// ── 2) 通常興行のカード = 挑戦試合が混ざる画面(旧 _renderB3MatchPreview の後継) ──
assertReachable('renderMatchPreview');
const preview = extractFunction(ui, 'function renderMatchPreview(');
assert.ok(preview.includes('_matchOrgLabel'),
  '興行カードの選手ブロックが所属ラベルを出していない');
const orgLabel = preview.slice(preview.indexOf('const _matchOrgLabel'), preview.indexOf('// ヘッダー'));
assert.ok(orgLabel.includes('crossOrgEmblemHtml('),
  '所属ラベルが他団体判定つきのエンブレムを使っていない');
assert.ok(orgLabel.includes('orgIconHtml('),
  '敵地遠征側にも実エンブレムを出すこと');
assert.strictEqual(occurrences(preview, '_matchOrgLabel'), 3,
  '_matchOrgLabel は定義1 + 左右の呼び出し2 = 3回であること');

// ── 3) PPV の対戦紹介 = 実際に見える画面(旧 showPPVVSDetail の後継) ──
assertReachable('renderPPVMatchPreview');
const ppvPreview = extractFunction(ui, 'function renderPPVMatchPreview(');
assert.ok(ppvPreview.includes('ppvCrossOrg'),
  'PPV の対戦紹介に他団体判定が無い');
assert.ok(/_ppvOrgId.*!==.*_ppvOrgId/s.test(ppvPreview) || ppvPreview.includes('String(L._ppvOrgId) !== String(R._ppvOrgId)'),
  'PPV の他団体判定は orgId 比較(名前は同名団体でも壊れないようフォールバック)');
assert.strictEqual(occurrences(ppvPreview, 'ppvEmblem'), 3,
  'ppvEmblem は定義1 + 左右の呼び出し2 = 3回であること');

// ── 4) PPV TV中継・新聞2面は U6 時点で既に生きていた。到達性だけ固定する ──
assertReachable('renderPPVTvBroadcast');
assertReachable('_npRenderPage2');

console.log('cross-org-emblem-live-screens-test: ok');
