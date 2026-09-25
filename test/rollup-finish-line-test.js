#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-6 追加(2026-09-26): 丸め込み決着の実況行 — 「大金星」は格下が勝ったときだけ
//    rollupUpset: '★ {name}、まさかの{move}で3カウント！ 大金星！'  … 勝者のOVRが敗者より8を超えて低い
//    rollupWin  : '★ {name}、{move}で丸め込んで3カウント！'          … それ以外(同格・格上)
//  格下の基準は新聞・試合結果の「番狂わせ」(app.js の isUpset)と同じ(Engine.battle.isUpsetWin)。
//  1. isUpsetWin の境界(差8ちょうどは格下の勝利ではない)
//  2. 実試合: 丸め込み決着の実況行が規則どおり選ばれ、1試合に1本だけ・ピン演出中は伏せる行・決着の行
//  3. 両方の行に英訳がある(台帳と src/lang-en-templates.js)
//  乱数は試合ごとに Engine.rng.create(Engine.rng.derive(...))(本体準拠)。
// ══════════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { loadAsGlobal } = require('./helpers/load-game.js');

global.window = global.window || { IS_TRIAL: false };
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js'].forEach(loadAsGlobal);

let failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.error('  NG ' + msg); }
}
const T = BATTLE_LOG_TEMPLATES.single;
const K = BATTLE_LOG_LINE_KINDS.single;

// ── 1. 境界 ─────────────────────────────────────────────
{
  const B = Engine.battle;
  check(B.isUpsetWin(60, 69) === true, '勝者60・敗者69(差9)は格下の勝利');
  check(B.isUpsetWin(60, 68) === false, '差8ちょうどは格下の勝利ではない(番狂わせ=8を超える差)');
  check(B.isUpsetWin(70, 70) === false, '同格は格下の勝利ではない');
  check(B.isUpsetWin(80, 60) === false, '格上の勝利は格下の勝利ではない');
  check(!/大金星/.test(T.rollupWin), '事実の行は「大金星」を言わない');
  check(/大金星/.test(T.rollupUpset), '格下の行は従来の「大金星」の行');
  for (const id of ['rollupUpset', 'rollupWin']) {
    check(K[id] && K[id].cls === 'finish' && K[id].spoiler === true, `${id} は決着の行(finish)で、ピン演出中は伏せる行`);
  }
}

// ── 2. 実試合 ───────────────────────────────────────────
function rngFor(tag, i) {
  let h = 2166136261;
  for (let k = 0; k < tag.length; k++) { h ^= tag.charCodeAt(k); h = Math.imul(h, 16777619); }
  return Engine.rng.create(Engine.rng.derive(20260926, h | 0, i));
}
const styles = Object.keys(styleMoves);
const mk = (id, s, style) => ({ id, name: 'X' + id, pw: s, sp: s, te: s, st: s, mn: s, style, popularity: 50, traits: [] });
const seen = { upset: 0, plainSame: 0, plainFavorite: 0, plainGap8: 0 };
// [左のOVR, 右のOVR]: 同格 / 差8ちょうど / 差9 / 差15
const cards = [[75, 75], [70, 78], [70, 79], [65, 80]];
for (const tier of [1, 2]) {
  for (const [ovL, ovR] of cards) {
    for (let i = 0; i < 700; i++) {
      const L = mk(1, ovL, styles[i % styles.length]), R = mk(2, ovR, styles[(i * 3 + 1) % styles.length]);
      const r = Engine.battle.simulateMatch(L, R, rngFor(`rollup${tier}_${ovL}_${ovR}`, i), tier, { recordFrames: true });
      const rollupTpls = [];
      for (const f of r.frames) {
        (f.logLineTpls || []).forEach((tpl, k) => {
          if (tpl === T.rollupUpset || tpl === T.rollupWin) rollupTpls.push({ tpl, spoiler: f.logLineSpoilers[k], cls: f.logLineClasses[k] });
        });
      }
      if (r.finType !== '丸め込み') {
        check(rollupTpls.length === 0, '丸め込み決着でない試合に丸め込み決着の行が出た');
        continue;
      }
      check(rollupTpls.length === 1, `丸め込み決着の行は1試合に1本(${rollupTpls.length})`);
      const winOv = r.winner === 'left' ? ovL : ovR, loseOv = r.winner === 'left' ? ovR : ovL;
      const expectUpset = winOv < loseOv - 8;
      const got = rollupTpls[0];
      check(got.tpl === (expectUpset ? T.rollupUpset : T.rollupWin),
        `勝者OVR${winOv}・敗者OVR${loseOv}で ${expectUpset ? '大金星' : '事実'} の行になっていない`);
      check(got.spoiler === true && got.cls === 'finish', '丸め込み決着の行は伏せる行・決着の行');
      check(r.log.some(l => l.startsWith('★ ') && l.includes(r.finMove)), '結果の実況ログに決着の行がある');
      if (expectUpset) seen.upset++;
      else if (winOv === loseOv) seen.plainSame++;
      else if (winOv > loseOv) seen.plainFavorite++;
      else seen.plainGap8++;
    }
  }
}
check(seen.upset > 0, '格下の丸め込み勝ち(大金星)を実試合で踏んだ');
check(seen.plainSame > 0, '同格の丸め込み勝ちを実試合で踏んだ');
check(seen.plainFavorite > 0, '格上の丸め込み勝ちを実試合で踏んだ');
check(seen.plainGap8 > 0, '差8ちょうどの格下の丸め込み勝ち(大金星ではない)を実試合で踏んだ');

// ── 3. 英訳 ─────────────────────────────────────────────
{
  const ledger = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'i18n', 'template-ledger.json'), 'utf8'));
  const dict = fs.readFileSync(path.join(__dirname, '..', 'src', 'lang-en-templates.js'), 'utf8');
  for (const id of ['rollupUpset', 'rollupWin']) {
    const row = ledger.find(x => x.key === T[id]);
    check(!!row && !!row.en, `${id} の英訳が台帳にある`);
    check(dict.includes(JSON.stringify(T[id]) + ':'), `${id} の英訳が src/lang-en-templates.js にある`);
    if (row && row.en) {
      check(row.en.includes('{name}') && row.en.includes('{move}'), `${id} の英訳は {name} と {move} を持つ`);
      check(/upset/i.test(row.en) === (id === 'rollupUpset'), `${id} の英訳で upset を言うのは格下の行だけ`);
    }
  }
}

if (failures > 0) {
  console.error(`rollup-finish-line-test: FAIL (${failures})`);
  process.exit(1);
}
console.log(`rollup-finish-line-test: ok (大金星 ${seen.upset} / 同格 ${seen.plainSame} / 格上 ${seen.plainFavorite} / 差8ちょうど ${seen.plainGap8})`);
