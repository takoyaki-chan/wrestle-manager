'use strict';

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const management = readSource('src', 'management.js');
const css = readSource('src', 'index.html');

assert.ok(ui.includes('function _emrTagFinishActors(opts, winnerSide)'),
  'tag result UI needs a dedicated finish-attribution renderer');
assert.ok(ui.includes('attribution.pinnedBy') && ui.includes('attribution.pinnedWho'),
  'tag result UI must resolve both the finishing wrestler and defeated wrestler');
assert.ok(ui.includes('<span>&#8594;</span>'),
  'tag result UI must show the direction from winner to loser');
assert.ok(ui.includes('winAttribution: result.winAttribution'),
  'regular tag results must pass finish attribution to the shared popup');
assert.ok(ui.includes('winAttribution: match.winAttribution'),
  'spring tag results must pass finish attribution to the shared popup');
assert.ok(management.includes('finType: result.finType, finMove: result.finMove, winAttribution: result.winAttribution')
  || management.includes('finType: sim.result.finType, finMove: sim.result.finMove, winAttribution: sim.result.winAttribution'),
  'spring tag league matches must preserve finish details');
assert.ok(management.includes('finType: finalResult.finType, finMove: finalResult.finMove, winAttribution: finalResult.winAttribution'),
  'spring tag league final must preserve finish details');
assert.ok(css.includes('.emr-finish-actors{'),
  'finish attribution needs result-screen styling');

const helperStart = ui.indexOf('function _emrTagFinishActors');
const helperEnd = ui.indexOf('\nfunction _matchNextLabel', helperStart);
const renderActors = new Function('escHtml',
  `${ui.slice(helperStart, helperEnd)}; return _emrTagFinishActors;`
)(value => String(value).replace(/[&<>"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
})[char]));
const options = {
  winAttribution: { pinnedBy: 2, pinnedWho: 3 },
  teamLeft: { members: [{ id: 1, name: 'Partner' }, { id: 2, name: '<Finisher>' }] },
  teamRight: { members: [{ id: 3, name: 'Defeated & Wrestler' }, { id: 4, name: 'Partner 2' }] },
};
const actorsHtml = renderActors(options, 'left');
assert.ok(actorsHtml.includes('&lt;Finisher&gt;')
  && actorsHtml.includes('Defeated &amp; Wrestler'),
  'finish attribution must render the exact two wrestlers and escape their names');
assert.strictEqual(renderActors(options, 'draw'), '',
  'draws must not invent a finish attribution');
assert.strictEqual(renderActors({ ...options, winAttribution: null }, 'left'), '',
  'legacy results without attribution must keep the old finish-only display');

console.log('tag-result-attribution-test: ok');
