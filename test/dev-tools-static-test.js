#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'dev-tools.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

assert.ok(index.includes('<script src="dev-tools.js"></script>'), '開発者モードのスクリプトを読み込む');
assert.ok(source.includes("event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd'"), '隠しショートカットを用意する');
assert.ok(source.includes("const DEV_AUTOSAVE_KEY = 'wm_dev_autosave'"), '通常セーブとは別の開発用オートセーブを使う');
assert.ok(source.includes("const DEV_SESSION_BASE_KEY = 'wm_dev_session_base'"), '開発開始地点も復元できる');
assert.ok(source.includes("const DEV_CHECKPOINT_PREFIX = 'wm_dev_checkpoint_'"), '複数の開発用チェックポイントを保持する');
assert.ok(source.includes('return active ? saveDevAuto() : originalAutoSave();'), '開発中だけ通常オートセーブを保護する');
assert.ok(source.includes("next.weekPhase === 'draft'"), '初期ドラフト画面からも既定編成で高速進行できる');
assert.ok(source.includes('Engine.springTagLeague.ENTRY_WEEK'), '春大会のプリセットを用意する');
assert.ok(source.includes('Engine.juniorTournament.WEEK'), '夏大会のプリセットを用意する');
assert.ok(source.includes('Engine.autumnWar.EVENT_WEEK'), '秋大会のプリセットを用意する');
assert.ok(source.includes('Engine.ppvTournament.SHOW_WEEK'), '冬大会のプリセットを用意する');
assert.ok(source.includes('G = state; saveCheckpoint(label || `S${targetSeason}W${targetWeek}`);'), '目標週はイベントを消化せず停止する');

console.log('dev-tools-static-test: ok');
