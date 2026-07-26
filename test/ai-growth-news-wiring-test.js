// ai-growth-news-wiring-test.js
//
// AI団体のブレークスルーが新聞記事になることを守る。
//
// 2026-07-26 まで、エンジンは type:'threat' で積み、新聞側は type:'breakthrough' しか
// 見ていなかったため、**AI団体の覚醒は一度も記事にならなかった**
// （NEWS_HEADLINE_TEMPLATES.breakthrough の3本が丸ごと死に文だった）。
// 'threat' は脅威ポップアップ(ui-common)が見ている名前なので変えられない。
// 受け取り側が両方を拾っていることを固定する。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const app = read('src/app.js');
const management = read('src/management.js');
const uiCommon = read('src/ui-common.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

global.window = { IS_TRIAL: false };
(function load() {
  const srcDir = path.join(root, 'src');
  ['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
   'management.js', 'match-engine.js', 'relationships.js'].forEach(f => {
    let code = fs.readFileSync(path.join(srcDir, f), 'utf-8')
      .replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '')
      .replace(/^(const|let) /gm, 'var ');
    new vm.Script(code, { filename: f }).runInThisContext();
  });
})();

console.log('=== AI団体の成長ニュースの配線 ===\n');

section("1. エンジンは 'threat' で積む（ポップアップがこの名前を見ている）", () => {
  assert.ok(/type: 'threat'/.test(management), "エンジンの 'threat' が消えている");
  assert.ok(/a\.type === 'threat'/.test(uiCommon), '脅威ポップアップが threat を見ていない');
});

section("2. 新聞の受け取り側が 'threat' も拾う", () => {
  const at = app.indexOf('aiAlerts.forEach');
  assert.ok(at > 0, 'aiAlerts の処理が見つからない');
  const body = app.slice(at, at + 1600);
  assert.ok(/alert\.type === 'breakthrough' \|\| alert\.type === 'threat'/.test(body),
    "'threat' を拾っていない。エンジンが積むのは 'threat' なので記事が1本も出なくなる");
  assert.ok(/type: 'breakthrough'/.test(body), "新聞イベントの type が 'breakthrough' でない");
});

section('3. 記事テンプレートが3種とも存在する', () => {
  ['breakthrough', 'slump', 'motivationLoss'].forEach(k => {
    const t = NEWS_HEADLINE_TEMPLATES[k];
    assert.ok(Array.isArray(t) && t.length > 0, `${k} のテンプレートが無い`);
    t.forEach(x => {
      assert.ok(x.headline && x.body, `${k} に headline/body が欠けている`);
    });
  });
});

section('4. breakthrough の記事が実際に組み上がる（穴が全部埋まる）', () => {
  const ev = [{ type: 'breakthrough', characterId: 1,
    data: { name: '白銀麗子', org: '皇武館', detail: 'パワーを4伸ばした' } }];
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const out = Engine.news.generateHeadlines(Engine.rng.create(1000 + i * 77), ev);
    assert.strictEqual(out.length, 1, '記事が生成されない');
    const { headline, body } = out[0];
    assert.ok(!/\{[a-zA-Z]+\}/.test(headline), '見出しに未展開の穴が残る: ' + headline);
    assert.ok(!/\{[a-zA-Z]+\}/.test(body), '本文に未展開の穴が残る: ' + body);
    seen.add(headline);
  }
  assert.ok(seen.size >= 2, '同じ見出ししか出ない（テンプレートが引けていない）');
});

section('5. 記事に小数が出ない（内部の刻みを新聞に出さない）', () => {
  const at = app.indexOf('aiAlerts.forEach');
  const body = app.slice(at, at + 1600);
  assert.ok(!/toFixed\(1\)/.test(body), '小数1桁のまま記事に流している');
  assert.ok(/Math\.round\(/.test(body), '整数に丸めていない');
  assert.ok(/STAT_LABELS_JP/.test(body),
    'ステータス名が英字略号のまま。プレイヤー向け表記に内部の呼び方を使わない');
});

section('6. 削除した未参照定数が復活していない', () => {
  const dataJs = read('src/data.js');
  ['STYLE_GROWTH', 'STAR_POWER', 'CONTRACT_NEGOTIATION_CONFIG',
   'AI_BREAKTHROUGH_NEWS', 'AI_SLUMP_NEWS', 'AI_MOTIVATION_LOSS_NEWS',
   'BESTMATCH_FLAVOR'].forEach(k => {
    assert.ok(!new RegExp('const ' + k + '\\s*=').test(dataJs),
      `${k} が復活している。役目を終えた定数なので後継（STYLE_WEIGHTS / Marquee軸 / 実装内の数値）を使うこと`);
  });
});

section('7. WEAR_TABLE は残っている（こちらは唯一の定義元）', () => {
  const dataJs = read('src/data.js');
  assert.ok(/const WEAR_TABLE\s*=/.test(dataJs), 'WEAR_TABLE まで消してはいけない');
  assert.strictEqual(typeof getWearBand, 'function', 'getWearBand が消えている');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (7 sections)');
