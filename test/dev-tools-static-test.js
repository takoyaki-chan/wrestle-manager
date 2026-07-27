#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'dev-tools.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release', 'manifest.json'), 'utf8'));
const packageScript = fs.readFileSync(path.join(root, 'release', 'package-release.ps1'), 'utf8');
const verifyScript = fs.readFileSync(path.join(root, 'release', 'verify-package.ps1'), 'utf8');

assert.ok(index.includes('<script src="dev-tools.js"></script>'), '開発者モードのスクリプトを読み込む');

// 配布物には含めない。src/index.html は参照を持ったままなので、梱包時に参照行を除去する必要がある
// （残すと製品版で dev-tools.js の 404 が出る）。
assert.ok(!manifest.sourceFiles.includes('src/dev-tools.js'), '開発者モードは配布物に含めない');
assert.ok(Array.isArray(manifest.devOnlyFiles) && manifest.devOnlyFiles.includes('src/dev-tools.js'),
  '開発専用ファイルとして manifest.json の devOnlyFiles に宣言する');
assert.ok(packageScript.includes('$Manifest.devOnlyFiles'), '梱包スクリプトが devOnlyFiles を読む');
assert.ok(packageScript.includes('$TagPattern'), '梱包時に配布用 HTML から開発専用ファイルの参照タグを除去する');
assert.ok(verifyScript.includes('$Manifest.devOnlyFiles'), '検証スクリプトが開発専用ファイルの混入と参照残りを見る');
assert.ok(source.includes("event.code === 'KeyD'"), '隠しショートカットを用意する');
// Chrome は Ctrl+Shift+D を「全てのタブをブックマークに追加」で先取りするため、Alt+Shift+D も受ける
assert.ok(source.includes('!(event.ctrlKey || event.altKey)'), 'Ctrl+Shift+D と Alt+Shift+D の両方で開く');
assert.ok(source.includes("const DEV_AUTOSAVE_KEY = 'wm_dev_autosave'"), '通常セーブとは別の開発用オートセーブを使う');
assert.ok(source.includes("const DEV_SESSION_BASE_KEY = 'wm_dev_session_base'"), '開発開始地点も復元できる');
assert.ok(source.includes("const DEV_CHECKPOINT_PREFIX = 'wm_dev_checkpoint_'"), '複数の開発用チェックポイントを保持する');
assert.ok(source.includes('return active ? saveDevAuto() : originalAutoSave();'), '開発中だけ通常オートセーブを保護する');
assert.ok(source.includes("next.weekPhase === 'draft'"), '初期ドラフト画面からも既定編成で高速進行できる');
assert.ok(source.includes('Engine.springTagLeague.ENTRY_WEEK'), '春大会のプリセットを用意する');
assert.ok(source.includes("'_pendingSpringTagLeagueReplay'"), '年送り中に春タッグのリプレイ予約を持ち越さない');
assert.ok(source.includes('Engine.juniorTournament.WEEK'), '夏大会のプリセットを用意する');
assert.ok(source.includes('Engine.autumnWar.EVENT_WEEK'), '秋大会のプリセットを用意する');
assert.ok(source.includes('Engine.ppvTournament.SHOW_WEEK'), '冬大会のプリセットを用意する');
assert.ok(source.includes('const isTenchosenShowWeek = next.week === Engine.ppvTournament.SHOW_WEEK'), '天頂戦の開催週を通常興行から除外する');
assert.ok(source.includes('const isSpringTagWeek = next.week === Engine.springTagLeague.LEAGUE_WEEK'), '春のタッグリーグ開催週を通常興行から除外する');
assert.ok(source.includes('const isAutumnWarWeek = next.week === Engine.autumnWar.EVENT_WEEK'), '秋4団体対抗戦の開催週を通常興行から除外する');
assert.ok(source.includes('const isJuniorTournamentWeek = next.week === Engine.juniorTournament.WEEK'), 'ジュニアトーナメント開催週(成立時)を通常興行から除外する');
assert.ok(source.includes('&& !isTenchosenShowWeek && !isSpringTagWeek && !isAutumnWarWeek && !isJuniorTournamentWeek)'), '各大型イベント開催週には早送りの通常興行を実行しない');
assert.ok(source.includes('G = state; saveCheckpoint(label || `S${targetSeason}W${targetWeek}`);'), '目標週はイベントを消化せず停止する');

console.log('dev-tools-static-test: ok');
