'use strict';

// src/i18n.js の本体をそのまま読み込み、言語を 'ja' に固定した WM_I18N を Node のグローバルに置く。
//
// なぜスタブではなく本体か(2026-09-26):
//   test/ui-walkthrough/fixtures/headless-sim.js の手書きスタブは t() しか持たず、factions.js が呼ぶ
//   WM_I18N.pn(_factionDisplayName)で F06/F07 などの派閥の選択の適用が毎回例外になり、黙って捨てられていた
//   (F07 のクールダウンが付かず毎週 F07 が立ち、その週は決着の判定・F09・派閥内挑戦が止まる)。
//   手書きのスタブは src が新しい関数(pn → pnSurname → pnGiven …)を呼び始めるたびに置いていかれるので、
//   ゲームと同じ i18n.js を 'ja' で動かす。ja のときの契約(t は辞書を引かずプレースホルダだけ置換、
//   pn/pnSurname/pnGiven/mv/mvShort は素通し、lang は 'ja')は src/i18n.js の D1/D2・D-P6-3 のとおり。
//
// 読み込み方:
//   i18n.js は `(typeof window !== 'undefined' ? window : globalThis)` に WM_I18N を置き、言語を
//   localStorage 'wm_lang' → navigator.language の順で決める。Node の本物のグローバルで動かすと、
//   Node 21 以降の navigator.language(OS のロケール)で 'en' になりうるので、隔離した vm の文脈で
//   「localStorage に 'ja' が保存済み」の窓を渡して動かし、できた WM_I18N だけを取り出す。
//   document は無いので applyDom は何もしない。

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const I18N_PATH = path.join(__dirname, '..', '..', 'src', 'i18n.js');

function createWmI18nJa() {
  const localStorage = {
    getItem: key => (key === 'wm_lang' ? 'ja' : null),
    setItem() {},
  };
  const fakeWindow = { localStorage };
  const context = vm.createContext({ window: fakeWindow, console });
  new vm.Script(fs.readFileSync(I18N_PATH, 'utf8'), { filename: 'i18n.js' }).runInContext(context);
  const api = fakeWindow.WM_I18N;
  if (!api || typeof api.t !== 'function') throw new Error('wm-i18n-ja: src/i18n.js did not expose WM_I18N');
  if (api.lang !== 'ja') throw new Error(`wm-i18n-ja: expected lang 'ja', got '${api.lang}'`);
  return api;
}

// 既に WM_I18N が置かれていればそれを使う(呼び出し側が自分のスタブを先に置いている場合を壊さない)。
function installWmI18nJa() {
  if (!global.WM_I18N) global.WM_I18N = createWmI18nJa();
  return global.WM_I18N;
}

module.exports = { createWmI18nJa, installWmI18nJa };
