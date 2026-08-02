#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'dev-event-catalog.js'), 'utf8');
const sandbox = {};
vm.runInNewContext(source, sandbox, { filename: 'dev-event-catalog.js' });
const catalog = sandbox.WrestleManagerDevEventCatalog;

assert.ok(Array.isArray(catalog), 'catalogue must be an array');
assert.ok(catalog.length >= 30, 'catalogue must cover the major event families');
assert.equal(new Set(catalog.map(event => event.id)).size, catalog.length, 'catalogue IDs must be unique');

for (const id of ['ai-breakthrough-s', 'ai-breakthrough-a', 'ai-breakthrough-b']) {
  assert.ok(catalog.some(event => event.id === id), `${id} must be catalogued`);
}
const relationshipAwakening = catalog.find(event => event.id === 'relationship-awakening');
assert.equal(relationshipAwakening.audioState, 'silent', 'relationship awakening must document its silent route');

const legacy = catalog.filter(event => event.audioState === 'legacy-one-shot');
assert.ok(legacy.length >= 8, 'legacy one-shot audio must be visible in the catalogue');
assert.ok(legacy.some(event => event.id === 'faction-f09'), 'faction war legacy stingers must be catalogued');
assert.ok(legacy.some(event => event.id === 'league-elevation'), 'league elevation legacy SFX must be catalogued');

for (const event of catalog) {
  assert.ok(event.title && event.category && event.oneShot && event.trigger && event.summary, `${event.id} must have inspection metadata`);
  assert.ok(Array.isArray(event.sources) && event.sources.length > 0, `${event.id} must point to source code`);
  for (const sourceRef of event.sources) {
    const relativeFile = String(sourceRef).split(':')[0];
    assert.ok(fs.existsSync(path.join(root, relativeFile)), `${event.id} source file is missing: ${relativeFile}`);
  }
  const audio = event.audio || {};
  for (const sound of [audio.bgm, ...(audio.sfx || [])].filter(Boolean)) {
    assert.ok(sound.type && sound.label, `${event.id} audio metadata must have a type and label`);
    if (sound.src) {
      const relativeAsset = sound.src.replace(/^\.\.\//, '');
      assert.ok(fs.existsSync(path.join(root, relativeAsset.split('?')[0])), `${event.id} audio asset is missing: ${relativeAsset}`);
    }
  }
}

assert.equal(catalog.find(event => event.id === 'league-elevation').audio.sfx.length, 2,
  'league elevation must expose both legacy one-shot effects');

assert.ok(!/\bG\s*=|Storage\./.test(source), 'catalogue must remain data-only and never mutate game/save state');

console.log(`dev-event-catalog-test: ok (${catalog.length} entries)`);
