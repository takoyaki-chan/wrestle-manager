'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\{([^}]*)\\}`));
  assert(match, `CSS rule not found: ${selector}`);
  return match[1];
}

function hasSize(selector, width, height) {
  const body = rule(selector);
  assert.match(body, new RegExp(`width:${width}px`), `${selector} width must be ${width}px`);
  assert.match(body, new RegExp(`height:${height}px`), `${selector} height must be ${height}px`);
}

// #1 and #2: both single-match preview cards use the M rung without cropping.
assert.match(ui, /const imgW = 132;\s*const imgH = 194;/, 'show preparation fallback dimensions must be M');
hasSize('.card-main .smc-char .upper-wrap', 132, 194);
hasSize('.card-sub .smc-char .upper-wrap', 132, 194);

// #3: show-preparation tag teams are one framed, overlapping L-sized group.
assert.match(ui, /class="smc-tag-lineup">\$\{_tagFighter\(tA1\)\}\$\{_tagFighter\(tA2\)\}/);
hasSize('.smc-tag-portrait', 150, 224);
assert.match(rule('.smc-tag-fighter+.smc-tag-fighter'), /margin-left:-18px/);
assert.match(rule('.smc-tag-portrait'), /filter:drop-shadow\(/);
assert.match(rule('.smc-tag-lineup'), /border:2px solid/);
assert.doesNotMatch(rule('.smc-tag-fighter'), /border:/, 'tag members must not be individually framed');

// #4: the common result tag renderer uses the same one-frame group treatment.
assert.match(ui, /<div class="pb-tag-lineup">\$\{mems\}<\/div>/);
hasSize('.pb-tag-portrait', 150, 224);
assert.match(rule('.pb-tag-member+.pb-tag-member'), /margin-left:-18px/);
assert.match(rule('.pb-tag-portrait'), /filter:drop-shadow\(/);
assert.match(rule('.pb-tag-lineup'), /border:2px solid/);
assert.doesNotMatch(rule('.pb-tag-member'), /border:/, 'result tag members must not be individually framed');

// #5 and #6: normal results use S; compact resolved rows use chip.
hasSize('.pb-portrait', 108, 162);
hasSize('.pb-mrow.is-resolved .pb-portrait', 46, 66);

// Regression guard: the already-compliant main event remains S.
hasSize('.pb-mrow.is-main .pb-portrait', 108, 162);

console.log('showprep-result-image-size-test: ok');
