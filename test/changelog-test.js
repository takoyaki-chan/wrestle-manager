'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'data-changelog.js'), 'utf8');
const context = {};
vm.runInNewContext(`${source}\nthis.result = WM_CHANGELOG;`, context);
const changelog = context.result;

// 新しい版が先頭。v1.05 まで遡って載せる(文面の正本は docs/changelog-content-20260927.md)
assert.ok(changelog.length >= 20, '更新履歴は20版以上');
assert.strictEqual(changelog[0].version, '1.37', '先頭は最新版');
assert.strictEqual(changelog[changelog.length - 1].version, '1.05', '末尾は最古の掲載版');
assert.ok(changelog.every(entry => /^1\.\d+$/.test(entry.version)), 'version の形式');
assert.ok(changelog.every(entry => /^20\d\d-\d\d-\d\d$/.test(entry.date)), 'date の形式');
assert.ok(changelog.every(entry => entry.ja.length >= 1 && entry.ja.length <= 3), '1版につき1〜3項目');
assert.ok(changelog.every(entry => entry.ja.length === entry.en.length), '日本語と英語の項目数が同じ');
assert.ok(changelog.every(entry => entry.ja.every(line => line.trim().length > 3)), '空の項目がない');
assert.ok(changelog.every(entry => entry.en.every(line => line.trim().length > 3)), '空の英文がない');

// 日付は新しい順に並んでいる
const dates = changelog.map(entry => entry.date);
assert.ok(dates.every((d, i) => i === 0 || dates[i - 1] >= d), '新しい順に並んでいる');

const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release', 'manifest.json'), 'utf8'));
assert.ok(html.includes('<script src="data-changelog.js"></script>'));
assert.ok(html.includes('onclick="App.showChangelog()"'));
assert.ok(manifest.sourceFiles.includes('src/data-changelog.js'));

// タイトル画面のバージョン表記と、更新履歴の先頭の版が一致している
const titleVer = (html.match(/class="title-ver">VERSION\s+([0-9.]+)</) || [])[1];
assert.strictEqual(titleVer, changelog[0].version, 'タイトルのバージョンと更新履歴の先頭が一致');

console.log('changelog-test: PASS');
