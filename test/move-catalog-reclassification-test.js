#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = fs.readFileSync(path.join(root, 'src', 'data.js'), 'utf8');
const catalogGenerator = fs.readFileSync(path.join(root, 'tools', 'generate-move-catalog.js'), 'utf8');
const reclassifiedCatalog = fs.readFileSync(path.join(root, 'docs', 'move-catalog-reclassified-v0.2.md'), 'utf8');

assert.ok(data.includes("{n:'ジャーマン・スープレックス',d:7,c:'throw'}"),
  'the shared suplex must be explicitly named German suplex');
assert.ok(data.includes("{n:'パワースラム',d:13,c:'throw'}"),
  'the strong Grappler slot must use Power Slam');
assert.ok(!data.includes("{n:'ジャーマン・スープレックス',d:13,c:'throw'}"),
  'the strong Grappler slot must not duplicate the shared German suplex');
assert.ok(data.includes("{n:'卍固め',d:14,c:'submission'}"),
  'the existing manji hold must remain in the legacy Technique catalogue');

const aerialSection = data.match(/Aerial:\[(.*?)\],\s*Technique:/s);
assert.ok(aerialSection, 'Aerial move section must be readable');
assert.ok(!aerialSection[1].includes('ハリケーンラナ'),
  'Hurricanrana must not remain in the Aerial baseline pool');

assert.ok(catalogGenerator.includes("{ name: 'ハリケーンラナ', damage: 12, category: 'throw'"),
  'Hurricanrana must remain available as a signature-only candidate');
assert.ok(catalogGenerator.includes("{ name: 'パラダイスロック', damage: 10, category: 'submission'"),
  'Paradise Lock must be added as a signature-only candidate');
assert.ok(catalogGenerator.includes("{ name: 'グラウンド卍固め', damage: 14, category: 'submission'"),
  'ground manji hold must be a separate signature-only candidate');

for (const row of [
  '| ハリケーンラナ | 12 | 大技 | 投げ | Aerial | 全スタイル | 旧スタイル技 |',
  '| 卍固め | 14 | 大技（フィニッシャー候補） | 関節・絞め | Submission | 全スタイル | 旧Technique |',
  '| グラウンド卍固め | 14 | 大技（フィニッシャー候補） | 関節・絞め | Submission | 全スタイル | 新規追加 |',
  '| パラダイスロック | 10 | 中技 | 関節・絞め | Allround | 全スタイル | 新規追加 |',
]) {
  assert.ok(reclassifiedCatalog.includes(row), `catalogue must contain: ${row}`);
}

console.log('move-catalog-reclassification-test: ok');
