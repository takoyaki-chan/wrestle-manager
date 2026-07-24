'use strict';

const assert = require('assert');
const { readSource, manifestVersion } = require('./helpers/source');

const version = manifestVersion();
const index = readSource('src', 'index.html');
const app = readSource('src', 'app.js');

assert.ok(version, 'release/manifest.json must declare a version');
assert(index.includes(`VERSION ${version}`), 'title screen version must match the release manifest');
assert(app.includes(`state._saveVersion = '${version}';`), 'save metadata version must match the release manifest');

console.log(`version-consistency-test: ok (v${version})`);
