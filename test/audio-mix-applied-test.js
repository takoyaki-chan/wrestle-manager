// audio-mix-applied-test.js
//
// 2026-07-27: bgm/audio-mixer.html で Keisuke が実聴して決めた音量が、
// ゲーム側に**取りこぼしなく**入っていることを守る。
//
// 経緯: ミキサーの書き出しには「まだゲームに割り当てていない音（参考）」という欄があり、
// そこに並んでいた曲の多くが**実際にはゲームで使われていた**（STAGE_BGM の12曲、引退・
// エンディング・表彰式のBGM、最高栄誉ジングル）。参考欄だからと見送ったため、これらは
// 仮の 0.15 のまま残っていた。全ファイルを走査して初めて分かった。
//
// 守りたいのは1点だけ:
//   **production-ogg の音源を鳴らしている箇所に、仮値(0.13〜0.15)が残っていないこと。**
// 個々の数値は耳で決めるものなので焼き付けない（焼き付けると調整のたびにテストが落ちる）。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const SRC = ['src/app.js', 'src/ui-common.js', 'src/ui-render.js'];

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== ミキサー音量がゲームに入っているか ===\n');

section('1. production-ogg を鳴らす行に仮値(0.13〜0.15)が残っていない', () => {
  const hits = [];
  for (const f of SRC) {
    read(f).split('\n').forEach((line, i) => {
      if (!/production-ogg/.test(line)) return;
      const m = line.match(/vol(?:ume)?:\s*(0\.1[345])\b/);
      if (m) hits.push(`${f}:${i + 1}  vol=${m[1]}  ${line.trim().slice(0, 80)}`);
    });
  }
  assert.strictEqual(hits.length, 0,
    '実聴値が入っていない箇所が残っている（音源セット導入時の仮値 0.15 / TV中継の 0.13）:\n        '
    + hits.join('\n        '));
});

section('2. STAGE_BGM の全曲に実聴値が入っている', () => {
  const app = read('src/app.js');
  const block = (app.match(/const STAGE_BGM = \{[\s\S]*?\n  \};/) || [])[0];
  assert.ok(block, 'STAGE_BGM が見つからない');
  const entries = [...block.matchAll(/(\w+):\s*\{ file: '[^']*\/(wm_bgm_[a-z0-9_]+\.ogg)', vol: ([0-9.]+) \}/g)];
  assert.ok(entries.length >= 14, `STAGE_BGM のエントリが少ない(${entries.length})。取りこぼしの疑い`);
  const stale = entries.filter(e => parseFloat(e[3]) <= 0.15).map(e => `${e[1]}=${e[3]}`);
  assert.strictEqual(stale.length, 0,
    'STAGE_BGM に仮値のままの曲がある: ' + stale.join(', '));
});

section('3. ミキサー台帳が参照するファイルはすべて実在する', () => {
  const mixerPath = path.join(root, 'bgm/audio-mixer.html');
  if (!fs.existsSync(mixerPath)) {
    // audio-mixer.html は .gitignore 済みのローカルツール。無い環境では検査しない
    console.log('        （ミキサー未配置のためスキップ）');
    return;
  }
  const h = fs.readFileSync(mixerPath, 'utf8');
  const files = [...new Set([
    ...[...h.matchAll(/'(wm_[a-z0-9_]+\.ogg)'/g)].map(m => m[1]),
    ...[...h.matchAll(/"(wm_[a-z0-9_]+\.ogg)":/g)].map(m => m[1]),
  ])];
  const missing = files.filter(f => !fs.existsSync(path.join(root, 'bgm/production-ogg', f)));
  assert.strictEqual(missing.length, 0, '台帳が実在しないファイルを指している: ' + missing.join(', '));
});

section('4. ゲームが鳴らす production-ogg はすべて実在する', () => {
  const refs = new Set();
  for (const f of SRC) {
    [...read(f).matchAll(/production-ogg\/(wm_[a-z0-9_]+\.ogg)/g)].forEach(m => refs.add(m[1]));
  }
  assert.ok(refs.size > 20, `参照が少なすぎる(${refs.size})。走査が壊れている疑い`);
  const missing = [...refs].filter(f => !fs.existsSync(path.join(root, 'bgm/production-ogg', f)));
  assert.strictEqual(missing.length, 0, '存在しない音源を鳴らそうとしている: ' + missing.join(', '));
});

section('5. 年末表彰式は最新版H05をキャッシュ回避付きで鳴らす', () => {
  const app = read('src/app.js');
  assert.ok(
    app.includes("const YEAR_END_AWARDS_BGM = '../bgm/production-ogg/wm_bgm_h05_v01.ogg?mix=20260727';"),
    '年末表彰式H05に最新版ミックスのキャッシュ識別子がない'
  );
  assert.ok(
    /Audio\.fileBgm\.play\(YEAR_END_AWARDS_BGM,\s*\{\s*loop:\s*true,\s*volume:\s*0\.40\s*\}\)/.test(app),
    '年末表彰式が最新版H05を実聴値0.40で再生していない'
  );
  const awardsCall = app.slice(app.indexOf('showAwardsCeremony(pendingAwards'), app.indexOf('\n  },', app.indexOf('showAwardsCeremony(pendingAwards')));
  assert.ok(/,\s*\(\)\s*=>\s*\{[\s\S]*Audio\.fileBgm\.play\(YEAR_END_AWARDS_BGM/.test(awardsCall),
    '表彰式BGMが表彰式オーバーレイの実表示より前に鳴る');
});

section('6. 音響刷新前の旧BGMを参照しない', () => {
  for (const file of SRC) {
    const source = read(file);
    assert.ok(!/bgm_(?:tension|season_end)_v1\.mp3/.test(source),
      `${file} に旧 tension / season_end BGM が残っている`);
  }
  const app = read('src/app.js');
  assert.ok(/season_end:\s*\{\s*file:\s*'\.\.\/bgm\/production-ogg\/wm_bgm_d04_v01\.ogg'/.test(app),
    'season_end が WM-D04 世代交代へ移行していない');
  assert.ok(/tension:\s*\{\s*file:\s*'\.\.\/bgm\/production-ogg\/wm_bgm_s03_v01\.ogg'/.test(app),
    'tension が WM-S03 不穏へ移行していない');
});

console.log('');
console.log(failed === 0 ? 'Result: ALL PASS ✓' : `Result: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
