const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8');

assert.ok(
  source.includes("const rng = (typeof sessionRng !== 'undefined' && sessionRng) ? sessionRng : Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, fighterId, seasons));"),
  'rental execution should use the shared session RNG before falling back to a per-fighter seed'
);
assert.ok(
  !source.includes("const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 500 + G.week));"),
  'rental execution should not recreate the same weekly RNG seed on every attempt'
);

console.log('rental-rng-behavior-test: ok');