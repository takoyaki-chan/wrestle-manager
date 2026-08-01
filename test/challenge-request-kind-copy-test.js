'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

const root = path.join(__dirname, '..', 'src');
const ui = fs.readFileSync(path.join(root, 'ui-common.js'), 'utf8');

assert.ok(ui.includes('団体戦挑戦の直訴'),
  'three-match challenge requests must be titled as organization challenges from the first screen');
assert.ok(ui.includes('シングル挑戦の直訴'),
  'B3 one-on-one challenge letters must be titled separately from organization challenges');
assert.ok(ui.includes('pickGroupRequesterLine'),
  'the organization challenge request screen must use group-specific dialogue');

loadGame({ full: true });

const fighter = { archetype: 'standard', personality: 'normal' };
const rng = Engine.rng.create(12345);
const line = Engine.challengeRequest.pickGroupRequesterLine(fighter, rng, '桜翔プロレス');
assert.ok(typeof line === 'string' && line.includes('桜翔プロレス'),
  'group petition dialogue must name the challenged organization');
assert.match(line, /私たち|三人/,
  'group petition dialogue must state that the challenge is collective rather than one-on-one');

console.log('challenge-request-kind-copy-test: ok');
