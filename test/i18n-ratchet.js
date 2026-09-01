#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-ratchet.js — 直書き日本語文字列のラチェットガード (Stage A P1 D6/I5)
//
//  ■ 目的
//    test/i18n-scan.js の計測(scanDir)を流用し、src/ の各ファイルの
//    「生日本語文字列本数」(=t()を経由せずコード中に直接書かれた日本語リテラルの数)を
//    基準値(test/fixtures/i18n-ratchet-baseline.json)と比較する。
//    増えたら失敗、減るのは許容(＝t()化が進んだ分は歓迎する)。
//    移行が済んだファイルへ新しい直書き日本語がこっそり足されるのを防ぐための
//    回帰ガード。docs/i18n-english-plan-v0.1.md §3-3。
//
//  ■ 使い方
//    node test/i18n-ratchet.js            # 基準と比較。増加があればexit 1
//    node test/i18n-ratchet.js --update   # 現在の実測値を新しい基準として保存
//
//  ■ I5(P1完了条件)
//    P1完了時点の実測値で基準を焼く。以後は増加のみで失敗する状態が「納品物」。
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');
const { scanDir } = require('./i18n-scan.js');

const UPDATE = process.argv.includes('--update');
const srcDir = path.join(__dirname, '..', 'src');
const baselinePath = path.join(__dirname, 'fixtures', 'i18n-ratchet-baseline.json');

const { perFile } = scanDir(srcDir);
const current = {};
for (const r of perFile) {
  current[r.file] = { jaCount: r.jaCount, jaChars: r.jaChars };
}

function totalJaCount(map) {
  return Object.values(map).reduce((sum, v) => sum + (v.jaCount || 0), 0);
}

if (UPDATE) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  const baseline = {
    generatedAt: new Date().toISOString(),
    files: current,
  };
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n', 'utf8');
  console.log(`[i18n-ratchet] 基準を更新しました: ${baselinePath}`);
  console.log(`[i18n-ratchet] files=${Object.keys(current).length} totalJaStrings=${totalJaCount(current)}`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.error(`[i18n-ratchet] 基準ファイルがありません: ${baselinePath}`);
  console.error('[i18n-ratchet] まず `node test/i18n-ratchet.js --update` で基準を採取してください。');
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const baseFiles = baseline.files || {};

const regressions = [];
const allFiles = new Set([...Object.keys(baseFiles), ...Object.keys(current)]);
for (const file of allFiles) {
  const baseCount = (baseFiles[file] && baseFiles[file].jaCount) || 0;
  const curCount = (current[file] && current[file].jaCount) || 0;
  if (curCount > baseCount) {
    regressions.push({ file, baseCount, curCount, delta: curCount - baseCount });
  }
}

if (regressions.length === 0) {
  console.log(`[i18n-ratchet] OK: 直書き日本語文字列の増加なし (files=${Object.keys(current).length} totalJaStrings=${totalJaCount(current)})`);
  process.exit(0);
}

console.error(`[i18n-ratchet] NG: ${regressions.length}件のファイルで生日本語文字列が増加しています(移行済み箇所への直書き再発の疑い)`);
regressions.sort((a, b) => b.delta - a.delta);
for (const r of regressions) {
  console.error(`  ${r.file}: ${r.baseCount} → ${r.curCount} (+${r.delta})`);
}
console.error('[i18n-ratchet] 新規文字列は WM_I18N.t() 経由にするか、正当な理由があれば `node test/i18n-ratchet.js --update` で基準を更新してください。');
process.exit(1);
