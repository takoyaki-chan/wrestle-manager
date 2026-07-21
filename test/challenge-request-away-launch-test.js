'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8');

assert(renderer.includes('App.startAwayChallengeFromPrep()'), 'away challenge notice must expose a direct launch button');
assert(app.includes('startAwayChallengeFromPrep()'), 'App must expose a direct away challenge launch method');
assert(app.includes('App._awayChallengeManualStart = true'), 'direct launch must mark the manual result flow');
assert(app.includes('if (App._awayChallengeManualStart)'), 'manual away results must return to show preparation instead of closing a nonexistent local result screen');

console.log('challenge-request-away-launch-test: ok');
