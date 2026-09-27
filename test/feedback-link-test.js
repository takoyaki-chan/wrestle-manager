'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const lang = fs.readFileSync(path.join(root, 'src', 'lang-en.js'), 'utf8');

assert.match(html, /\.title-feedback\{[^}]*color:rgba\(255,255,255,0\.55\)/s);
assert.match(html, /\.title-feedback:hover\{color:rgba\(255,255,255,0\.9\)\}/);
assert.match(html, /id="screen-help"[\s\S]*📝 ご意見・バグ報告を送る\(Googleフォーム\)[\s\S]*不具合の報告には、タイトル画面に出ているバージョン番号と、お使いのブラウザ名を書いてもらえると助かります。/);
assert.strictEqual((html.match(/window\.open\(FEEDBACK_FORM_URL,'_blank'\)/g) || []).length, 2, 'フォーム導線はタイトルとヘルプの2か所だけ');
assert.ok(lang.includes('📝 Send feedback or a bug report (Google Form)'));
assert.ok(lang.includes('When reporting a bug, please include the version number shown on the title screen and the name of your browser.'));

console.log('feedback-link-test: PASS');
