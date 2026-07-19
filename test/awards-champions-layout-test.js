const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');

assert.ok(
  html.includes('grid-template-columns:repeat(3,minmax(0,1fr))'),
  'champion podium should use three equal-width columns'
);
assert.ok(
  html.includes('.champ-slot{min-width:0;display:flex;align-items:flex-end;justify-content:center}'),
  'each champion should be centered inside a fixed grid slot'
);
assert.ok(
  html.includes('.champ-quote .speech-bubble{width:100%;'),
  'dialogue length must not change the column width'
);

const slotCount = (ui.match(/<div class="champ-slot">/g) || []).length;
assert.strictEqual(slotCount, 3, 'the podium should always render left, center, and right slots');
assert.ok(ui.includes('<div class="champ-slot">${buildCol(c1, 1)}</div>'), 'rank 1 should stay in the center slot');

console.log('awards-champions-layout-test: ok');
