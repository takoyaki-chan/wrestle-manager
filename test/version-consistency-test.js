'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release', 'manifest.json'), 'utf8'));
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');

assert.strictEqual(manifest.version, '1.14b');
assert(index.includes('VERSION 1.14b'), 'title screen version must match the release manifest');
assert(app.includes("state._saveVersion = '1.14b';"), 'save metadata version must match the release manifest');

console.log('version-consistency-test: ok');
