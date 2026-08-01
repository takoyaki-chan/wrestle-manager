'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

assert.ok(ui.includes("const venueLabel = isInverse ? '自団体で迎撃' : '遠征興行';"),
  'challenge petition must explicitly distinguish an away event from a home defense');
assert.ok(ui.includes("const formatLabel = '3人制・シングル3連戦';"),
  'challenge petition must explicitly identify the three-person, three-match format');
assert.match(ui, /class="crq-briefing"[\s\S]*開催地[\s\S]*試合形式/,
  'location and match format must be displayed together before the fighter comparison');
assert.ok(ui.includes('第1試合・先鋒対決'),
  'the displayed pair must be identified as the first of the three matches, not a one-off singles match');
assert.match(css, /\.crq-briefing\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,
  'challenge briefing needs a two-part, scannable layout');
assert.match(css, /@media\(max-width:520px\)\{\.crq-briefing\{grid-template-columns:1fr/, 
  'challenge briefing must stack on narrow displays');

console.log('challenge-request-briefing-test: ok');
