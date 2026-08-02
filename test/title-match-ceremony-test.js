'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const common = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const titleCssStart = index.indexOf('/* 戴冠・節目防衛の結果');
const titleCssEnd = index.indexOf('/* ============================================================', titleCssStart);
const titleCss = index.slice(titleCssStart, titleCssEnd);

assert.ok(common.includes('function showTitleMatchCeremony(outcome, onDone)'),
  'title outcomes should have a dedicated ceremony adapter');
assert.ok(common.includes('function showTitleMilestoneResultModal('),
  'title wins and milestone defenses should share the approved A-modal renderer');
assert.ok(common.includes('mdl-a-title-result'),
  'title milestone results should render inside the approved A-modal layout');
assert.ok(common.includes("titleDefense") && common.includes("titleWin")
  && common.includes("titleChallengeLoss") && common.includes("titleLoss"),
  'title result variants must select the existing winner and loser dialogue');
assert.ok(titleCss.includes('.mdl-a-title-result') && titleCss.includes('font-family: var(--font-body)'),
  'title result body must use the existing A-modal font tokens');
assert.ok(titleCss.includes('.mdl-a-title-role') && titleCss.includes('font-family: var(--font-label)'),
  'title result English labels must use the existing label font');
assert.ok(!titleCss.includes('var(--font-ceremony)') && !titleCss.includes('Shippori Mincho'),
  'title result modal must not leak the large ceremony Mincho font');
assert.ok(titleCss.includes('@media (max-width: 620px)')
  && titleCss.includes('.mdl-a-overlay.top-aligned')
  && titleCss.includes('grid-template-columns: 1fr'),
  'title result modal must stack both fighters from the top on narrow screens');
assert.ok(app.includes('showTitleMatchCeremony(outcome, done)'),
  'title outcomes should be queued in the regular post-show ceremony flow');
assert.ok(app.includes("outcome: 'change', newChampId: rd.challengerId"),
  'successful title reclaims should also receive the title ceremony');
assert.ok(!common.includes('tmc-card'),
  'title ceremony must not introduce a separate popup frame');

console.log('title-match-ceremony-test: ok');
