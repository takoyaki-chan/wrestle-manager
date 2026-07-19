'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = relativePath => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
const ui = read('src/ui-render.js');
const mobile = read('src/mobile.css');

// Phone: avoid the force graph and expose touch-friendly list navigation.
assert(ui.includes("window.matchMedia?.('(max-width: 700px)').matches && centerChar"));
assert(ui.includes('return _renderDbRelmapMobile(allChars, centerChar);'));
assert(ui.includes('onclick="_relmapMobileSetCenter('));
assert(ui.includes('onclick="showFighterPopup('));
assert(ui.includes('function _relmapMobileSearch(value)'));
assert(mobile.includes('@media (max-width: 700px)'));
assert(mobile.includes('.relmap-mobile-root {'));
assert(mobile.includes('touch-action: pan-y;'));
assert(mobile.includes('.rm-mobile-card {'));

// Tablet/desktop: retain the graph, with mouse and primary touch/pen routes.
assert(ui.includes('<svg id="relmapSvg"'));
assert(ui.includes("svg.addEventListener('click'"));
assert(ui.includes("svg.addEventListener('contextmenu'"));
assert(ui.includes("svg.addEventListener('pointerdown'"));
assert(ui.includes("svg.addEventListener('pointermove'"));
assert(ui.includes("svg.addEventListener('pointerup'"));
assert(ui.includes("if (_relmapViewMode === 'power') showFighterPopup(tappedNodeId);"));
assert(ui.includes('else _relmapSetCenter(tappedNodeId);'));

// Both layouts build their links through the same legacy-save normalizer.
assert(ui.includes('normalizeHistoryStore(G.relationshipHistory)'));
assert(ui.includes('const history = historyStore.retiredRivalries;'));

// Bound the force simulation on tablet/desktop instead of running forever.
assert(ui.includes("_relmapAlpha = { value: 1.0, decay: 0.0015, min: 0.005 };"));
assert(ui.includes('if (_relmapAlpha.value > _relmapAlpha.min || _relmapDragTarget || _relmapPanning)'));

console.log('relmap-device-compat-test: ok');
