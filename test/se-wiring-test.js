'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const app = read('src/app.js');
const manifest = JSON.parse(read('release/manifest.json'));
const seDir = path.join(root, 'bgm', 'production-ogg');

function section(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (error) {
    console.log(`  FAIL  ${name}\n        ${error.message}`);
    process.exitCode = 1;
  }
}

console.log('=== SE配線の実体・配布台帳チェック ===\n');

const referencedFiles = [...new Set([...app.matchAll(/\b(wm_se_[a-z0-9]+_v\d+\.ogg)\b/g)].map(match => match[1]))].sort();
const filesTable = (app.match(/const SE_FILES = \{[\s\S]*?\n  \};/) || [])[0] || '';

section('1. src/app.js が参照する全SEファイルが実在する', () => {
  assert.ok(referencedFiles.length > 0, 'SE参照が見つからない');
  referencedFiles.forEach(file => {
    assert.ok(fs.existsSync(path.join(seDir, file)), `${file} が bgm/production-ogg/ に無い`);
  });
});

section('2. 参照SEはすべて配布manifestに含まれる', () => {
  const sourceFiles = new Set(manifest.sourceFiles || []);
  const assetDirectories = (manifest.assetDirectories || []).map(dir => dir.replace(/\\/g, '/').replace(/\/$/, ''));
  referencedFiles.forEach(file => {
    const relativePath = `bgm/production-ogg/${file}`;
    const coveredByDirectory = assetDirectories.some(dir => relativePath === dir || relativePath.startsWith(`${dir}/`));
    assert.ok(coveredByDirectory || sourceFiles.has(relativePath), `${relativePath} が manifest に含まれない`);
  });
});

section('3. SE_FILES に重複キーがない', () => {
  assert.ok(filesTable, 'SE_FILES が見つからない');
  const keys = [...filesTable.matchAll(/^\s{4}([A-Za-z0-9_]+):/gm)].map(match => match[1]);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  assert.deepStrictEqual(duplicates, [], `重複キー: ${[...new Set(duplicates)].join(', ')}`);
});

if (process.exitCode) process.exit(process.exitCode);
console.log('\nALL PASS (3 sections)');
