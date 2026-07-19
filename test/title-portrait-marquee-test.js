const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');

assert.ok(
  index.includes('@keyframes title-portraits-scroll') &&
    index.includes('animation:title-portraits-scroll 110s linear infinite'),
  'title portraits need a slow continuous marquee animation'
);
assert.ok(
  index.includes('@media(prefers-reduced-motion:reduce)'),
  'title portrait motion must respect reduced-motion preferences'
);
assert.ok(
  app.includes('Math.floor(Math.random() * (i + 1))') &&
    app.includes('titlePool.slice(0, Math.min(18, titlePool.length))'),
  'title portrait cast must be shuffled and limited on every title visit'
);
assert.ok(
  app.includes('class="title-portraits-group" aria-hidden="true"'),
  'title portrait row must be duplicated for a seamless loop'
);

console.log('title-portrait-marquee-test: ok');
