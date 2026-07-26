// special-event-intro-test.js
//
// 特別興行の導入シーンと会場入り(2026-07-26 Keisuke 承認)。
//
// 承認された形は **2枚だけ**:
//   コーチが一人で一言 → 選手が一人で一言 → (従来の選定/本編へ)
// そのあと選手が決まったら **バスで会場入り**。
//
// このテストが守るのは主に2つ:
//   1. **4大会すべてに入っていること**。1つ足すたびに配線を忘れると、
//      「春だけ導入が無い」のような穴が開く。
//   2. **新しい見た目を作っていないこと**。ここが本題。
//      過去に「毎回ゼロから考え出すと統一感がなくなる」と指摘を受けている。
//      導入シーンは既存の mdl-a / _mdlASubjectStage / showTravelScene の
//      組み合わせだけで出来ていなければならない。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const ui = read('src/ui-common.js');
const app = read('src/app.js');
const data = read('src/data.js');
const html = read('src/index.html');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

const EVENTS = ['autumnWar', 'springTagLeague', 'juniorTournament', 'tenchosen'];

console.log('=== 特別興行の導入シーンと会場入り ===\n');

// ─────────────────────────────────────────────────────────────
// A. データ
// ─────────────────────────────────────────────────────────────

// SPECIAL_EVENT_INTRO の本体だけ切り出す
const tableSrc = (data.match(/const SPECIAL_EVENT_INTRO = \{[\s\S]*?\n\};/) || [])[0];

section('1. 4大会ぶんの導入データがある', () => {
  assert.ok(tableSrc, 'SPECIAL_EVENT_INTRO が見つからない');
  EVENTS.forEach(k => assert.ok(new RegExp(`\\n  ${k}: \\{`).test(tableSrc), `${k} が無い`));
});

section('2. どの大会もコーチ・選手3種のセリフが揃っている', () => {
  // 選手の枠は「去年出た人 / 王者 / 一番人気」の3通り。
  // 1つでも欠けると、その状況のときだけ2枚目が無言になる
  EVENTS.forEach(k => {
    const at = tableSrc.indexOf(`\n  ${k}: {`);
    const end = tableSrc.indexOf('\n  },', at);
    const body = tableSrc.slice(at, end);
    assert.ok(/coach: \[/.test(body), `${k}: コーチのセリフが無い`);
    ['lastYear', 'champion', 'popular'].forEach(kind => {
      assert.ok(new RegExp(`${kind}: \\[`).test(body), `${k}: 選手セリフ ${kind} が無い`);
    });
  });
});

section('3. 会場名を二重管理していない', () => {
  // 会場は Engine.specialEventFinance.VENUE_INDEX(=8, 大会場)。
  // data.js に「大会場」と書き写すと、興行側だけ変えたときに嘘になる
  assert.ok(!/venueLabel:/.test(tableSrc), '会場名を文字列で持っている。VENUES から引くこと');
  assert.strictEqual((tableSrc.match(/venueIndex: 8,/g) || []).length, 4,
    '4大会すべてが venueIndex を持っていない');
  assert.ok(/VENUES\[cfg\.venueIndex\]/.test(ui), 'バスの行き先を VENUES から引いていない');
});

section('4. 去年の出場者は、実在する history.type で探している', () => {
  // ここが実際の記録と食い違うと、去年出た選手が永遠に見つからない
  const types = [...tableSrc.matchAll(/historyType: '([^']+)'/g)].map(m => m[1]);
  assert.strictEqual(types.length, 4, 'historyType が4件そろっていない');
  types.forEach(t => {
    assert.ok(new RegExp(`type: '${t}'`).test(app) || new RegExp(`type: '${t}'`).test(read('src/management.js')),
      `history.type '${t}' はどこにも記録されていない。去年の出場者が見つからなくなる`);
  });
});

// ─────────────────────────────────────────────────────────────
// B. 見た目を作り直していないか（ここが本題）
// ─────────────────────────────────────────────────────────────

const introSrc = (ui.match(/function showSpecialEventIntro[\s\S]*?\n\}/) || [])[0];
const travelSrc = (ui.match(/function showSpecialEventTravel[\s\S]*?\n\}/) || [])[0];

section('5. 導入シーンは既存の枠(mdl-a)を使う', () => {
  assert.ok(introSrc, 'showSpecialEventIntro が無い');
  assert.ok(/_mdlAOpen\(/.test(introSrc), '専用のオーバーレイを作っている。既存の mdl-a を使うこと');
  assert.ok(/_mdlAHeader\(/.test(introSrc), 'ヘッダーを手書きしている');
});

section('6. コーチも選手も同じ helper で立たせる', () => {
  // コーチだけ手書きすると、選手側の見た目を直したときコーチが取り残される
  assert.strictEqual((introSrc.match(/_mdlASubjectStage\(/g) || []).length, 2,
    'コーチ枚と選手枚の両方が _mdlASubjectStage を通っていない');
  assert.ok(/portraitUrl:/.test(introSrc), 'コーチ画像を helper の口から渡していない');
  assert.ok(!/class="mdl-a-subject-stage"/.test(introSrc),
    '見た目を手書きしている。同じものを2箇所に書くと必ず片方が古くなる');
});

section('7. 新しいCSSクラスを発明していない', () => {
  const used = new Set();
  [introSrc, travelSrc].forEach(src => {
    (src.match(/class="([^"$]+)"/g) || []).forEach(m => {
      m.slice(7, -1).trim().split(/\s+/).forEach(c => c && used.add(c));
    });
  });
  const missing = [...used].filter(c => !html.includes('.' + c));
  assert.deepStrictEqual(missing, [],
    'index.html に無いクラスを使っている: ' + missing.join(', '));
});

section('8. 会場入りは既存の遠征カットを使い回す', () => {
  assert.ok(travelSrc, 'showSpecialEventTravel が無い');
  assert.ok(/showTravelScene\(/.test(travelSrc),
    '専用のバス画面を作っている。挑戦試合の遠征カットと同じものを使うこと');
});

// ─────────────────────────────────────────────────────────────
// C. 語る人の選び方
// ─────────────────────────────────────────────────────────────

const pickSrc = (ui.match(/function _specialIntroPickSpeaker[\s\S]*?\n\}/) || [])[0];

section('9. 語る順は「去年出た人 → 王者 → 一番人気」', () => {
  assert.ok(pickSrc, '_specialIntroPickSpeaker が無い');
  const order = ['lastYear', 'champion', 'popular'].map(k => pickSrc.indexOf(`'${k}'`));
  assert.ok(order.every(i => i > 0), '3通りすべてを見ていない');
  assert.ok(order[0] < order[1] && order[1] < order[2],
    '優先順が違う。語れる文脈が濃い人から順に選ぶこと');
});

section('10. 誰も当てはまらなければ2枚目を出さない', () => {
  // 言うことのない選手に無理やり喋らせると、そこだけ薄いセリフになる
  assert.ok(/return null;/.test(pickSrc), '該当なしのときに null を返していない');
  assert.ok(/if \(!speaker\) \{ done\(\); return; \}/.test(introSrc),
    '2枚目を出せないとき、空の画面が出る');
});

section('11. 怪我人とレンタルは語らない', () => {
  assert.ok(/!f\.isRental/.test(pickSrc) && /!f\.injury/.test(pickSrc),
    '欠場中の選手が「出ます」と言いかねない');
});

section('12. 王者が不在でも落ちない', () => {
  assert.ok(/state\.titles && state\.titles\.world/.test(pickSrc),
    'titles が空のセーブで例外になる');
});

// ─────────────────────────────────────────────────────────────
// D. 4大会すべてに入っているか
// ─────────────────────────────────────────────────────────────

section('13. 4大会すべてで導入シーンが呼ばれる', () => {
  EVENTS.forEach(k => {
    assert.ok(app.includes(`showSpecialEventIntro('${k}'`),
      `${k} に導入シーンが入っていない`);
  });
});

section('14. 4大会すべてで会場入りのカットが入る', () => {
  EVENTS.forEach(k => {
    assert.ok(app.includes(`showSpecialEventTravel('${k}'`),
      `${k} にバス移動が入っていない`);
  });
});

section('15. 導入が出せないときも本編に進める', () => {
  // 関数が無い・コーチ未雇用・語れる選手が居ない — どれでも止まってはいけない
  const guards = app.match(/typeof showSpecialEventIntro === 'function'/g) || [];
  assert.strictEqual(guards.length, 4, '4大会すべてで存在チェックしていない');
  const tGuards = app.match(/typeof showSpecialEventTravel === 'function'/g) || [];
  assert.strictEqual(tGuards.length, 4, '会場入り側の存在チェックが足りない');
  assert.ok(/if \(!coach\) \{ showFighterScene\(\); return; \}/.test(introSrc),
    'コーチを雇っていない団体で導入が止まる');
});

section('16. 春タッグの導入は毎シーズン出る', () => {
  // セッション単位のフラグにすると、2年目以降ずっと出なくなる
  assert.ok(/_stlIntroSeason !== G\.season/.test(app),
    '春タッグの導入フラグがシーズン単位になっていない');
  assert.ok(!/_stlIntroShown/.test(app), '出しっぱなしフラグが残っている');
});

section('17. 毎回同じ人・同じ台詞にならない', () => {
  // シード固定なので週が変われば変わる。season/week を種に混ぜているか
  assert.ok(/Engine\.rng\.derive\([^)]*state\.season[^)]*state\.week/.test(introSrc),
    '乱数がシーズン・週に紐付いていない');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (17 sections)');
