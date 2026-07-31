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

// 特別興行は5つ。**冬は2種類ある** — 4年に一度は天頂戦、それ以外の年は PPV GRAND FINAL。
// 天頂戦だけ入れて PPV を忘れると、4年のうち3年は導入が出ない。
const EVENTS = ['autumnWar', 'springTagLeague', 'juniorTournament', 'tenchosen', 'ppvGrandFinal'];

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

section('2a. ジュニアの導入は出場選手本人の目線で、十分なレパートリーがある', () => {
  const at = tableSrc.indexOf('\n  juniorTournament: {');
  const body = tableSrc.slice(at, tableSrc.indexOf('\n  },', at));
  ['lastYear', 'champion', 'popular'].forEach(kind => {
    const match = body.match(new RegExp(`${kind}: \\[([\\s\\S]*?)\\]`));
    assert.ok(match, `juniorTournament: ${kind} のセリフが読めない`);
    const lines = [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
    assert.ok(lines.length >= 4, `juniorTournament: ${kind} のセリフが少ない（${lines.length}件）`);
  });
  assert.ok(!body.includes('若手の大会でも、手は抜きません。'),
    'U-20の出場選手が自分を若手の外側から評する旧セリフが残っている');
});

section('2b. ジュニアの導入は性格 × 属性のセリフを使う', () => {
  const juniorLines = (data.match(/const JUNIOR_TOURNAMENT_LINES = \{[\s\S]*?\n\};/) || [])[0];
  assert.ok(juniorLines, 'JUNIOR_TOURNAMENT_LINES が見つからない');
  const summonAt = juniorLines.indexOf('  summon: {');
  const summonEnd = juniorLines.indexOf('\n  },\n  preMatch:', summonAt);
  const summon = juniorLines.slice(summonAt, summonEnd);
  // 2026-08-01 の軸入れ替えで第一分岐がアーキタイプ、第二分岐が性格になった
  ['standard', 'ojousama', 'delinquent', 'seductive', 'cool', 'composed', 'polite'].forEach(archetype => {
    assert.ok(new RegExp(`\\n    ${archetype}: \\{`).test(summon),
      `summon: ${archetype} の属性別セリフが無い`);
  });
  ['normal', 'bold', 'earnest', 'easygoing', 'quiet', 'shy', 'emotional'].forEach(personality => {
    assert.ok(summon.includes(`${personality}: [`), `summon: ${personality} の性格別セリフが無い`);
  });
});

section('2c. 4団体対抗戦の代表挨拶は王座戦の文脈を持ち込まない', () => {
  const at = tableSrc.indexOf('\n  autumnWar: {');
  const body = tableSrc.slice(at, tableSrc.indexOf('\n  },', at));
  const fighterBody = (body.match(/fighter: \{([\s\S]*?)\n    \},/) || [])[1] || '';
  assert.ok(fighterBody, 'autumnWar: 選手用セリフが読めない');
  assert.ok(!/ベルト|王座/.test(fighterBody),
    '4団体対抗戦は王座戦ではない。代表挨拶にベルト／王座の文脈を入れないこと');
});

section('3. 会場名を二重管理していない', () => {
  // 会場は Engine.specialEventFinance.VENUE_INDEX(=8, 大会場)。
  // data.js に「大会場」と書き写すと、興行側だけ変えたときに嘘になる
  assert.ok(!/venueLabel:/.test(tableSrc), '会場名を文字列で持っている。VENUES から引くこと');
  assert.strictEqual((tableSrc.match(/venueIndex: 8,/g) || []).length, EVENTS.length,
    '全大会が venueIndex を持っていない');
  assert.ok(/VENUES\[cfg\.venueIndex\]/.test(ui), 'バスの行き先を VENUES から引いていない');
});

section('4. 去年の出場者は、実在する history.type で探している', () => {
  // ここが実際の記録と食い違うと、去年出た選手が永遠に見つからない。
  //
  // **どこかに同じ文字列があるだけでは足りない。**
  // 2026-07-26: ジュニアを 'junior' と書いていたが、それは実績(achievement)の id で、
  // 経歴に積まれるのは 'juniorTournament' だった。単純検索では素通りしてしまった。
  // **careerRecord.history に積む行だけ**を見る。
  const mgmt = read('src/management.js');
  const historyWriters = [
    ...mgmt.matchAll(/history[^\n]*\.push\(\{ *type: '([^']+)'/g),
    ...mgmt.matchAll(/const (?:hist|history|histEntry|ev) *= *[^\n]*\{ *type: '([^']+)'/g),
    ...mgmt.matchAll(/Engine\.career\.addEvent\([^,]+, *\{[\s\S]{0,40}?type: '([^']+)'/g),
    ...app.matchAll(/Engine\.career\.addEvent\([^,]+, *\{[\s\S]{0,40}?type: '([^']+)'/g),
  ].map(m => m[1]);
  const known = new Set(historyWriters);
  assert.ok(known.size > 5, '経歴に積む type を1つも拾えていない。検出側の壊れ');

  const types = [...tableSrc.matchAll(/historyType: '([^']+)'/g)].map(m => m[1]);
  assert.strictEqual(types.length, EVENTS.length, `historyType が${EVENTS.length}件そろっていない`);
  types.forEach(t => {
    assert.ok(known.has(t),
      `history.type '${t}' は careerRecord.history に積まれていない。` +
      `去年の出場者が永遠に見つからない（実績の id と取り違えていないか）`);
  });
});

// ─────────────────────────────────────────────────────────────
// B. 見た目を作り直していないか（ここが本題）
// ─────────────────────────────────────────────────────────────

const introSrc = (ui.match(/function showSpecialEventIntro[\s\S]*?\n\}/) || [])[0];
const travelSrc = (ui.match(/function showSpecialEventTravel[\s\S]*?\n\}/) || [])[0];
const fighterLineSrc = (ui.match(/function _specialIntroFighterLine[\s\S]*?\n\}/) || [])[0];

section('5. 導入シーンは既存の枠(mdl-a)を使う', () => {
  assert.ok(introSrc, 'showSpecialEventIntro が無い');
  assert.ok(/_mdlAOpen\(/.test(introSrc), '専用のオーバーレイを作っている。既存の mdl-a を使うこと');
  assert.ok(/_mdlAHeader\(/.test(introSrc), 'ヘッダーを手書きしている');
});

section('5a. ジュニアの導入は話者の性格と属性でセリフを選ぶ', () => {
  assert.ok(fighterLineSrc, '_specialIntroFighterLine が無い');
  assert.ok(/eventKey === 'juniorTournament'/.test(fighterLineSrc),
    'ジュニアだけの話者別レパートリー分岐が無い');
  assert.ok(/getJuniorTournamentLine\([\s\S]*?'summon'[\s\S]*?fighter\.personality[\s\S]*?fighter\.archetype/.test(fighterLineSrc),
    'ジュニア導入で personality × archetype のセリフを取得していない');
  assert.ok(/_specialIntroFighterLine\(eventKey, cfg, speaker, rng\)/.test(introSrc),
    '特別興行の導入表示が話者別セリフ取得を通っていない');
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

section('9. 語る順は「前年優勝者 → 前年出場者 → 王者 → 一番人気」', () => {
  assert.ok(pickSrc, '_specialIntroPickSpeaker が無い');
  const order = ['champion', 'lastYear', 'popular'].map(k => pickSrc.indexOf(`'${k}'`));
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
  assert.strictEqual(guards.length, EVENTS.length, '全大会で存在チェックしていない');
  const tGuards = app.match(/typeof showSpecialEventTravel === 'function'/g) || [];
  assert.strictEqual(tGuards.length, EVENTS.length, '会場入り側の存在チェックが足りない');
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

section('18. 冬は天頂戦と PPV の両方が入っている', () => {
  // Week48 は 4年に一度が天頂戦、それ以外の年は PPV GRAND FINAL。
  // 天頂戦だけ入れると、4年のうち3年は導入が出ない
  assert.ok(app.includes("showSpecialEventIntro('tenchosen'"), '天頂戦が入っていない');
  assert.ok(app.includes("showSpecialEventIntro('ppvGrandFinal'"), 'PPV GRAND FINAL が入っていない');
  // 順番は「導入 → 会場入り → 既存のカード紹介」。
  // 書かれている位置ではなく**渡している続き**で見る(クロージャなので位置は当てにならない)
  const at = app.indexOf('function _ppvOpenWithIntro');
  assert.ok(at > 0, '_ppvOpenWithIntro が無い');
  const body = app.slice(at, at + 1000);
  assert.ok(/const toCard = \(\) => showPPVMatchCardIntro\(/.test(body),
    'カード紹介が続きとして畳まれていない');
  assert.ok(/showSpecialEventIntro\('ppvGrandFinal', G, toTravel[,)]/.test(body),
    '導入のあとに会場入りへ渡していない');
  assert.ok(/showSpecialEventTravel\('ppvGrandFinal', G, party, toCard\)/.test(body),
    '会場入りのあとにカード紹介へ渡していない');
  // カード紹介を導入より先に直接呼んでいないこと
  assert.strictEqual((body.match(/showPPVMatchCardIntro\(/g) || []).length, 1,
    'カード紹介を複数箇所から呼んでいる。導入を飛ばす経路ができる');
});

section('19. 2枚目のボタンは大会ごとに、次に起きることを書く', () => {
  // PPV や天頂戦には選定が無い。全部「代表を選ぶ」にすると嘘になる
  assert.strictEqual((tableSrc.match(/nextLabel: '/g) || []).length, EVENTS.length,
    '全大会が nextLabel を持っていない');
  assert.ok(/cfg\.nextLabel \|\|/.test(introSrc), 'ボタン文言を直書きしている');
  // 選定が無い大会が「選ぶ」と言っていないこと
  ['tenchosen', 'ppvGrandFinal'].forEach(k => {
    const at = tableSrc.indexOf(`\n  ${k}: {`);
    const body = tableSrc.slice(at, tableSrc.indexOf('\n  },', at));
    const m = body.match(/nextLabel: '([^']+)'/);
    assert.ok(m, `${k}: nextLabel が無い`);
    assert.ok(!/選 ぶ|組 む/.test(m[1]),
      `${k}: 「${m[1]}」— この大会に選定は無い。押した先で起きることを書くこと`);
  });
});

section('20. 出場者が決まっている大会は、その中からしか喋らせない', () => {
  // 2026-07-26 Keisuke 報告:
  //   ・U-20 のジュニアトーナメントで、**出場すらしないベテラン**が「出ます」と喋っていた
  //   ・自団体から出場者ゼロの年でも導入が発火していた
  // どちらも「実際に出る人」を渡していなかったせい。
  assert.ok(/function _specialIntroPickSpeaker\(state, cfg, pool\)/.test(ui),
    '話者の候補を絞れるようになっていない');
  assert.ok(/if \(pool && !pool\.length\) \{ done\(\); return; \}/.test(introSrc),
    '自団体から誰も出ない大会でも導入が出てしまう');
  // 出場者が既に決まっている3大会は必ず pool を渡す
  ['juniorTournament', 'tenchosen', 'ppvGrandFinal'].forEach(k => {
    const m = app.match(new RegExp(`showSpecialEventIntro\\('${k}'[^;]*`));
    assert.ok(m, `${k} の呼び出しが見つからない`);
    assert.ok(/pool:/.test(m[0]),
      `${k}: 出場者が決まっているのに pool を渡していない。出ない選手が喋る`);
  });
  // 逆に、選定がこれからの2大会は pool を渡してはいけない(まだ誰が出るか決まっていない)
  ['autumnWar', 'springTagLeague'].forEach(k => {
    const m = app.match(new RegExp(`showSpecialEventIntro\\('${k}'[^;]*`));
    assert.ok(m, `${k} の呼び出しが見つからない`);
    assert.ok(!/pool:/.test(m[0]),
      `${k}: この時点ではまだ出場者が決まっていない。pool を渡すと候補が偏る`);
  });
});

section('21. 人気の足切りは、出場が決まっていない大会だけ', () => {
  // U-20 は元々人気が低い。40 で切ると2枚目が永遠に出なくなる
  assert.ok(/\(pool \|\| \(popular\.popularity \|\| 0\) >= 40\)/.test(pickSrc),
    'pool 指定時も人気で足切りしている。ジュニアで2枚目が出なくなる');
});

section('前年の大会優勝者には優勝者用の台詞を割り当てる', () => {
  const pickSpeaker = Function(`${pickSrc}; return _specialIntroPickSpeaker;`)();
  const lastSeason = 6;
  const state = {
    season: lastSeason + 1,
    roster: [
      { id: 1, popularity: 50, careerRecord: { history: [{ type: 'juniorTournament', season: lastSeason, result: 'quarterFinal' }] } },
      { id: 2, popularity: 40, careerRecord: { history: [{ type: 'juniorTournament', season: lastSeason, result: 'champion' }] } },
    ],
  };
  const speaker = pickSpeaker(state, { historyType: 'juniorTournament' });
  assert.strictEqual(speaker.fighter.id, 2, '前年優勝者を優先して選ぶ');
  assert.strictEqual(speaker.kind, 'champion', '前年優勝者に初戦敗退用の台詞を割り当てない');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (21 sections)');
