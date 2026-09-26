'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const common = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `section not found: ${startMarker}`);
  return source.slice(start, end);
}

// K-1 第3段: 判定は興行後の処理の共通関数 Engine.show.sameSinglesPair(app.js の _sameSinglesPair はそれを呼ぶだけ)。
// 因縁の記録と決着の保険も Engine.show.finalize(両経路が通る)の中
loadGame();
const mgmt = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8').replace(/\r\n/g, '\n');
const pairSource = section(app, 'function _sameSinglesPair(', '\n\nconst Audio');
assert.ok(pairSource.includes('return Engine.show.sameSinglesPair(match, result);'), 'app.js の _sameSinglesPair が共通の判定を使っていない');
const sameSinglesPair = Engine.show.sameSinglesPair;

assert.strictEqual(sameSinglesPair(
  { left: 10, right: 20 }, { left: { id: 20 }, right: { id: 10 } }
), true, 'the same booked pair should be accepted regardless of corner');
assert.strictEqual(sameSinglesPair(
  { left: 10, right: 20 }, { left: { id: 10 }, right: { id: 30 } }
), false, 'a result from another match must be rejected');
assert.strictEqual(sameSinglesPair(
  { left: 10, right: 20 }, { left: null, right: { id: 20 } }
), false, 'incomplete result participants must be rejected');

assert.ok(mgmt.includes('rivalry processing skipped: card/result participants differ'),
  'rivalry accumulation must reject mismatched card/result pairs');
assert.ok(mgmt.includes('rivalry settlement skipped: card/result participants differ'),
  'rivalry settlement must reject mismatched card/result pairs');
// K-1 第4段 4-A: 両経路とも決着候補でない組の因縁を王座戦の前に記録する(以前は実プレイだけの ctx.rivalryBeforeTitles)
assert.ok(mgmt.includes('const deferredRivalryIdx = new Set();') && !app.includes('rivalryBeforeTitles'),
  'both paths must record non-candidate rivalries before titles (Engine.show.finalize)');
assert.ok(common.includes('r, leftIsWinner, isDraw, `Match ${results.length - i}`, sourceMatch,'),
  'regular-show inline rivalry comments must receive the booked match for verification');
assert.ok(common.includes("_queueRivalryMatchDialogue(r, leftIsWinner, isDraw, isMain ? WM_I18N.t('頂上決戦') : `Match ${matchNum}`, match)"),
  'PPV rivalry comments must receive the booked match for verification');
const buildDialogue = section(common, 'function _buildRivalryMatchDialogue(', '\n}\n\n/** 独立した試合後モーダル用');
assert.ok(buildDialogue.includes('if (r.rivalryResolved) return;'),
  'resolved rivalry matches must stay out of ordinary inline/post-match comments');
const dialogue = section(common, 'function _renderNextMatchDialogue()', '\nfunction closeMatchDialogue()');
assert.ok(dialogue.includes('因 縁 の 一 戦'),
  'ordinary rivalry-match comments must not be labelled as a full rivalry settlement');
assert.ok(!dialogue.includes('因 縁 決 着'),
  'only actual resolution popups may use the rivalry-settled wording');

const settledPair = {
  resolvedType: null,
  rivalryAB: 80,
  rivalryBA: 80,
  bondAB: 20,
  bondBA: 20,
  minRivalry: 80,
  minBond: 20,
  matches: 10,
  isCrossOrg: false,
  idA: 10,
  idB: 20,
};
const unfinishedPair = { ...settledPair, minRivalry: 60 };
const firstResolution = Engine.title.checkResolution(unfinishedPair, 80, 60, 0);
assert.ok(firstResolution && firstResolution.type === 'first' && !firstResolution.resolved,
  '仕様上の1回目は宿敵決着であり、因縁の完結ではない');
assert.strictEqual(firstResolution.label, '宿敵戦勝利',
  '1回目を因縁全体の完結と誤読させない名称にする');
const resolutionPopup = section(common, 'function _renderRivalryPopup()', '\nfunction closeRivalryPopup()');
assert.ok(resolutionPopup.includes("const isFirstWin = o.resolutionType === 'first';"),
  '1回目の表示を最終決着と区別する分岐が無い');
assert.ok(resolutionPopup.includes("WM_I18N.t('宿 敵 戦 勝 利')") && resolutionPopup.includes("vsLabel = isFirstWin ? WM_I18N.t('勝 利') : WM_I18N.t('決 着')"),
  '1回目のポップアップを勝利として表示していない');
const finalResolution = Engine.title.checkResolution(settledPair, 80, 60, 1);
assert.ok(finalResolution && ['goodRival', 'bitter'].includes(finalResolution.resolved),
  '最終決着は好敵手／宿怨への移行として成立する');
assert.strictEqual(finalResolution.newResolutionCount, 2,
  '最終決着は2回目として記録する');

console.log('rivalry-resolution-match-guard-test: ok');
