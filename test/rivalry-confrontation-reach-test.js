// rivalry-confrontation-reach-test.js
//
// 因縁の宣戦布告が「出るべき場所で出る」ことを守る。
//
// 2026-07-26 に分かったこと:
//   セリフ資産(RIVALRY_CONFRONTATION_LINES 系、性格別に数百本)は前からあったのに、
//   **通常興行の自団体どうしの試合でしか出ていなかった**。
//   しかも通常興行ですら
//       const cl = G.roster.find(...); const cr = G.roster.find(...); if (cl && cr)
//   という条件だったため、**対外戦では一度も出たことがなかった**。
//
//   特別興行(春/夏/秋/冬)は全部が対外戦なので、年5回の大舞台すべてで
//   因縁が黙っていたことになる。データは動いていたのに、見せていなかった。
//
// このテストが守るのは3つ:
//   1. 判定が**1箇所**にあること（5画面に条件を散らすと必ずどれかが古くなる）
//   2. 出す基準が通常興行と揃っていること（rivalry 50以上・好敵手/宿怨は対象外）
//   3. **所属で足切りしていない**こと（ここが今回の本題）

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const ui = read('src/ui-common.js');
const app = read('src/app.js');
const html = read('src/index.html');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 因縁の宣戦布告が届く範囲 ===\n');

const coreSrc = (ui.match(/function _rivalryPreMatchLines[\s\S]*?\n\}/) || [])[0];
const bubbleSrc = (ui.match(/function _rivalryBubblePairHtml[\s\S]*?\n\}/) || [])[0];

// ─────────────────────────────────────────────────────────────
// A. 判定が1箇所にあるか
// ─────────────────────────────────────────────────────────────

section('1. 判定は共通ヘルパー1本', () => {
  assert.ok(coreSrc, '_rivalryPreMatchLines が無い');
  assert.ok(bubbleSrc, '_rivalryBubblePairHtml が無い');
});

section('2. 試合前セリフを描く関数が自前で因縁判定していない', () => {
  // getRivalryLevel は選手詳細の関係一覧やカード提案の相性計算でも使う。
  // 禁じたいのは「**試合前セリフを出すかどうか**を画面ごとに判断すること」。
  // 画面ごとに閾値を書くと、必ずどれかが古い基準のまま取り残される。
  const screens = {
    'ジュニア':  /function _jtFocusCard[\s\S]*?\n\}/,
    '天頂戦':    /function _tcFocusCard[\s\S]*?\n\}/,
    '秋4団体戦': /function _agwPreBoutDialogueHtml[\s\S]*?\n\}/,
  };
  Object.entries(screens).forEach(([name, re]) => {
    const src = (ui.match(re) || [])[0] || '';
    assert.ok(!/getRivalryLevel\(/.test(src),
      `${name} が自前で因縁を判定している。_rivalryPreMatchLines に寄せること`);
    assert.ok(!/rivalry >= |rivalry < /.test(src),
      `${name} に因縁のしきい値が直書きされている`);
  });
});

// ─────────────────────────────────────────────────────────────
// B. 基準が通常興行と揃っているか
// ─────────────────────────────────────────────────────────────

section('3. しきい値は通常興行と同じ 50', () => {
  assert.ok(/rivalry < 50/.test(coreSrc), 'しきい値が 50 になっていない');
  const showGate = app.match(/\(rivalLvl\.rivalry \|\| 0\) >= (\d+)/);
  assert.ok(showGate, '通常興行側のしきい値が読めない');
  assert.strictEqual(showGate[1], '50',
    `通常興行が ${showGate[1]} で特別興行が 50。基準がずれている`);
});

section('4. 好敵手・宿怨は対象外（決着済みの関係）', () => {
  assert.ok(/isGoodRival \|\| lvl\.isBitterRival/.test(coreSrc),
    '好敵手/宿怨を除外していない。決着した関係に宣戦布告させることになる');
});

section('5. 熱の段(50/70/90)を通常興行と同じ資産で出し分ける', () => {
  ['RIVALRY_CONFRONTATION_LINES_90', 'RIVALRY_CONFRONTATION_LINES_70', 'RIVALRY_CONFRONTATION_LINES']
    .forEach(k => assert.ok(coreSrc.includes(k), `${k} を使っていない`));
  assert.ok(coreSrc.indexOf('>= 90') < coreSrc.indexOf('>= 70'),
    '段の判定順が逆。90 の因縁に 70 のセリフが出る');
});

// ─────────────────────────────────────────────────────────────
// C. 所属で足切りしていないか（本題）
// ─────────────────────────────────────────────────────────────

section('6. 他団体の選手でもセリフを引ける', () => {
  // 性格・アーキタイプは静的定義から引く。G.roster を見ると対外戦で必ず落ちる
  assert.ok(/ALL_CHARS\.find\(c => c\.id === id\)/.test(coreSrc),
    '性格を G.roster から引いている。他団体の選手で必ず null になる');
  assert.ok(!/G\.roster/.test(coreSrc),
    '共通ヘルパーが自団体ロスターを見ている。対外戦で出なくなる');
});

section('7. 通常興行の対外戦が開通している', () => {
  // ここが 2026-07-26 まで閉じていた。roster 限定の検索に戻っていないこと
  const at = app.indexOf('const confrontations = []');
  assert.ok(at > 0, '通常興行の宣戦布告検出が見つからない');
  const body = app.slice(at, at + 1600);
  assert.ok(!/const cl = G\.roster\.find\(c => c\.id === m\.left\);/.test(body),
    '自団体ロスター限定に戻っている。対外戦で宣戦布告が出なくなる');
  assert.ok(/findFighter\(id\)/.test(body),
    '所属を問わず引く経路が無い');
});

// ─────────────────────────────────────────────────────────────
// D. 5つの場面すべてに届いているか
// ─────────────────────────────────────────────────────────────

section('8. 特別興行4大会に入っている', () => {
  // 春タッグはタッグなので対象外（通常興行でもタッグは宣戦布告しない）
  const places = {
    'ジュニア':   /function _jtFocusCard[\s\S]*?\n\}/,
    '天頂戦':     /function _tcFocusCard[\s\S]*?\n\}/,
    '秋4団体戦':  /function _agwPreBoutDialogueHtml[\s\S]*?\n\}/,
  };
  Object.entries(places).forEach(([name, re]) => {
    const src = (ui.match(re) || [])[0];
    assert.ok(src, `${name} の試合前描画が見つからない`);
    assert.ok(/_rivalryBubblePairHtml\(/.test(src), `${name} に因縁セリフが入っていない`);
  });
  // PPV は独自の吹き出しを持つので、セリフの出どころだけ差し替える
  assert.ok(/const ppvRiv = [\s\S]{0,80}?_rivalryPreMatchLines\(/.test(ui), 'PPV に因縁セリフが入っていない');
  assert.ok(/\(ppvRiv && ppvRiv\.leftLine\) \|\| _getPPVPreMatchLine\(L\)/.test(ui),
    'PPV で汎用セリフより因縁を優先していない');
});

section('9. 汎用セリフより因縁を優先する', () => {
  const jt = (ui.match(/function _jtFocusCard[\s\S]*?\n\}/) || [])[0];
  assert.ok(/let bubbleHtml = [\s\S]{0,80}?_rivalryBubblePairHtml\(/.test(jt),
    'ジュニアで汎用セリフが因縁を上書きしている');
  assert.ok(/if \(!bubbleHtml && \(lineL \|\| lineR\)\)/.test(jt),
    '因縁が出ているのに汎用セリフも重ねている');
});

section('10. 秋は抽選を通さず必ず出す', () => {
  // 年1回の対抗戦で当たった宿敵が、確率で黙るのは不自然
  const agw = (ui.match(/function _agwPreBoutDialogueHtml[\s\S]*?\n\}/) || [])[0];
  assert.ok(agw.indexOf('_rivalryBubblePairHtml') < agw.indexOf('_agwDialogueRng'),
    '抽選のあとに因縁を見ている。確率で宿敵が黙る');
});

// ─────────────────────────────────────────────────────────────
// E. 見た目
// ─────────────────────────────────────────────────────────────

section('11. 新しい吹き出しを作っていない', () => {
  // jt-bub / jt-bub-pair はジュニアも秋も使っている既存の共通部品
  const used = new Set();
  (bubbleSrc.match(/class="([^"$]+)"/g) || []).forEach(m => {
    m.slice(7, -1).replace(/\$\{[^}]*\}/g, '').trim().split(/\s+/)
      .forEach(c => c && used.add(c));
  });
  const missing = [...used].filter(c => !html.includes('.' + c));
  assert.deepStrictEqual(missing, [], 'index.html に無いクラス: ' + missing.join(', '));
});

section('12. 吹き出しの中身は話者名とセリフだけ', () => {
  // 既存の jt-bub と同じ形を崩さない。バッジや所属を足さない
  assert.ok(!/因 縁|宿 敵|⚡/.test(bubbleSrc),
    '吹き出しの中に飾りを足している。因縁であることはセリフ自体が言っている');
  assert.ok(/class="sp bl"/.test(bubbleSrc) && /class="sp gd"/.test(bubbleSrc),
    '既存の話者ラベル(sp bl / sp gd)を使っていない');
});

section('13. 同じ対戦なら描き直しても同じセリフ', () => {
  // Math.random() だと再描画のたびに言うことが変わる
  assert.ok(!/Math\.random\(\)/.test(coreSrc), '乱数が Math.random。再描画で台詞が変わる');
  assert.ok(/Engine\.rng\.derive\(/.test(coreSrc), 'ペアと日付から種を作っていない');
});

section('14. 飾りが盤面を落とせない', () => {
  // 因縁セリフは**飾り**。ここで例外が出て秋の盤面ごと消えるのは割に合わない。
  // (実際、追加直後に既存テスト2本が ReferenceError で落ちた)
  assert.ok(/try \{ r = _rivalryPreMatchLines\(leftId, rightId\); \} catch \(_e\) \{ return ''; \}/.test(bubbleSrc),
    'セリフの解決で投げると呼び出し元まで巻き込む');
  // 呼び出し側も、ヘルパー不在で落ちないこと
  ['_jtFocusCard', '_tcFocusCard', '_agwPreBoutDialogueHtml'].forEach(fn => {
    const src = (ui.match(new RegExp(`function ${fn}[\\s\\S]*?\\n\\}`)) || [])[0] || '';
    assert.ok(/typeof _rivalryBubblePairHtml === 'function'/.test(src),
      `${fn}: ヘルパーが無い環境で落ちる`);
  });
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (14 sections)');
