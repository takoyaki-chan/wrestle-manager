// ppv-lines-test.js
//
// task-75: PPV GRAND FINAL のセリフ。
//
// Keisuke「PPVだけそのセリフ周り、演出周りのところが足りてない気がする。デザインはいいんだけどさ」
//
// 実測での裏付け（2026-08-01）:
//   天頂戦666 / 秋対抗戦228+315 / 春タッグ98+98 に対して **PPV は 47本**。
//   しかも喋るのは頂上決戦の勝者ひとりで、自団体が勝ったときだけ。
//
// この表の肝は **相手選手が喋る** こと。因縁の有無で色が変わり、
// **侮辱を出してよいのは `oppOnWin.grudge` だけ**。
//
// ここで守るのは「死蔵にしないこと」と「侮辱枠が漏れないこと」。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame, loadAsGlobal } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });
loadAsGlobal('ppv-lines.js');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); }
}

console.log('=== PPV GRAND FINAL のセリフ ===\n');

const ARCH = ['standard', 'polite', 'cool', 'composed', 'ojousama', 'delinquent', 'seductive'];
const PERS = ['normal', 'bold', 'earnest', 'easygoing', 'emotional', 'quiet', 'shy'];
const SCENES = ['summitPre', 'summitLose', 'oppOnLoss', 'oppOnWin'];

function allLines() {
  const out = [];
  SCENES.forEach(sc => Object.values(PPV_LINES[sc]).forEach(cell =>
    Object.values(cell).forEach(v => out.push(...v))));
  return out;
}

section('1. 4場面 × 因縁あり/なし が揃っている', () => {
  SCENES.forEach(sc => {
    assert.ok(PPV_LINES[sc], `${sc} が無い`);
    ['plain', 'grudge'].forEach(m => {
      assert.ok(PPV_LINES[sc][m], `${sc}.${m} が無い`);
    });
  });
});

section('2. 全アーキタイプの基準セルに欠けが無い', () => {
  const miss = [];
  SCENES.forEach(sc => ['plain', 'grudge'].forEach(m => ARCH.forEach(a => {
    const v = PPV_LINES[sc][m][`${a}_normal`];
    if (!Array.isArray(v) || v.length === 0) miss.push(`${sc}.${m}.${a}_normal`);
  })));
  assert.strictEqual(miss.length, 0, '欠け: ' + miss.join(', '));
});

section('3. フォールバックが49組すべてで機能する（空にならない）', () => {
  let empty = 0;
  SCENES.forEach(sc => ['plain', 'grudge'].forEach(m => ARCH.forEach(a => PERS.forEach(p => {
    const c = PPV_LINES[sc][m];
    const pool = c[`${a}_${p}`] || c[`${a}_normal`] || c.standard_normal;
    if (!Array.isArray(pool) || pool.length === 0) empty++;
  }))));
  assert.strictEqual(empty, 0, `${empty} 通りで空になる`);
});

section('4. 重複が無い', () => {
  const all = allLines();
  const norm = s => s.replace(/[…。、！？「」\s]/g, '');
  const seen = new Set(), dup = [];
  all.forEach(l => { const n = norm(l); if (seen.has(n)) dup.push(l); else seen.add(n); });
  assert.strictEqual(dup.length, 0, '重複: ' + dup.slice(0, 3).join(' | '));
});

section('5. 大会名を連呼しない（セリフ内に PPV / GRAND FINAL を出さない）', () => {
  const hit = allLines().filter(l => /PPV|GRAND|グランドファイナル/.test(l));
  assert.strictEqual(hit.length, 0, '大会名入り: ' + hit.slice(0, 3).join(' | '));
});

section('6. 侮辱は oppOnWin.grudge だけ（他の枠へ漏らさない）', () => {
  // 侮辱にしか現れない言い回しで見る（「届きませんでした」のような
  // 敗者の述懐と紛れる語は入れない）
  const INSULT = /身の程|この程度か|デカい口|立っている場所が違う|そんなものか|吠えていたのに|あなたでは、わたしには/;
  const leak = [];
  SCENES.forEach(sc => ['plain', 'grudge'].forEach(m => {
    if (sc === 'oppOnWin' && m === 'grudge') return;
    Object.entries(PPV_LINES[sc][m]).forEach(([k, v]) => v.forEach(l => {
      if (INSULT.test(l)) leak.push(`${sc}.${m}.${k}: ${l}`);
    }));
  }));
  assert.strictEqual(leak.length, 0, '侮辱が漏れている:\n        ' + leak.join('\n        '));
});

section('7. 侮辱枠は7アーキタイプすべてで書き分けられている', () => {
  const cell = PPV_LINES.oppOnWin.grudge;
  const lines = ARCH.map(a => cell[`${a}_normal`][0]);
  assert.strictEqual(new Set(lines).size, 7, '侮辱枠に同じ文がある');
  // 口調の差が出ていること（不良は乱暴、丁寧は敬語）を最低限の形で見る
  assert.ok(/ねぇ|ぞ|だろ|よ$|な$/.test(cell.delinquent_normal[0]), '不良の侮りが乱暴ではない');
  assert.ok(/ます|ません|ですが/.test(cell.polite_normal[0]), '丁寧の侮りが敬語になっていない');
});

section('8. 因縁の有無で引く枝が変わる（picker）', () => {
  const speaker = { id: 1, archetype: 'standard', personality: 'normal' };
  const other = { id: 2 };
  const plain = pickPpvLine('oppOnWin', speaker, other, { relationships: {} });
  const grudge = pickPpvLine('oppOnWin', speaker, other, { relationships: { '1>2': { rivalry: 75 } } });
  assert.ok(plain && grudge, '引けない枝がある');
  assert.notStrictEqual(plain, grudge, '因縁の有無で同じ文が出ている');
  // 非対称2軸: 相手側だけ燃えていても「因縁のある一戦」として扱う
  const rev = pickPpvLine('oppOnWin', speaker, other, { relationships: { '2>1': { rivalry: 75 } } });
  assert.strictEqual(rev, grudge, '相手側だけ因縁があるとき plain に落ちている');
});

section('9. 引数が欠けても落ちない', () => {
  assert.doesNotThrow(() => pickPpvLine('summitPre', null, null, null));
  assert.doesNotThrow(() => pickPpvLine('nosuch', { archetype: 'cool' }, null, {}));
  assert.strictEqual(pickPpvLine('nosuch', { archetype: 'cool' }, null, {}), '');
});

section('10. 既存の PPV_SUMMIT_VICTORY_LINES を壊していない', () => {
  assert.ok(typeof PPV_SUMMIT_VICTORY_LINES !== 'undefined', '既存テーブルが消えている');
  let n = 0;
  const walk = o => { if (Array.isArray(o)) n += o.length; else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
  walk(PPV_SUMMIT_VICTORY_LINES);
  assert.strictEqual(n, 47, `既存47本が ${n} 本に変わっている`);
});

section('11. 死蔵にしない — 実際に配線されている', () => {
  const app = read('src/app.js');
  assert.ok(/pickPpvLine\('summitLose'/.test(app),
    '頂上決戦の敗者セリフが app.js から引かれていない（テーブルだけあって出ない）');
  assert.ok(/loserLine,/.test(app), '敗者セリフが _newsSummitResult に載っていない');
  const html = read('src/index.html');
  assert.ok(/ppv-lines\.js/.test(html), 'index.html に script タグが無い（本番で読み込まれない）');
  const manifest = read('release/manifest.json');
  assert.ok(/src\/ppv-lines\.js/.test(manifest), 'release/manifest.json に無い（配布に含まれない）');
});

console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILED'}`);
process.exit(failed === 0 ? 0 : 1);
