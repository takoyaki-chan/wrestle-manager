const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const index = read('src', 'index.html');
const mobile = read('src', 'mobile.css');
const app = read('src', 'app.js');
const uiRender = read('src', 'ui-render.js');

assert.ok(
  mobile.includes('.title-screen,') && mobile.includes('z-index: 9000;'),
  'title and setup overlays must cover the fixed phone navigation'
);
assert.ok(
  uiRender.includes('opening-org-line${orgLengthClass}') &&
    index.includes('.opening-org-line{display:block') &&
    index.includes('white-space:nowrap'),
  'the promotion name must start on its own unbroken line'
);
assert.ok(
  uiRender.includes('let _openingTransitioning = false;') &&
    uiRender.includes('if (_openingTransitioning) return;') &&
    uiRender.includes("currentEl.style.display = 'none'"),
  'opening acts must switch sequentially without duplicated text'
);
assert.ok(
  app.includes('const foundingGreetings = [') &&
    app.includes('class="team-greetings"') &&
    index.includes('.completion-overlay.show .team-greeting'),
  'all founding members need a greeting in the promotion-start scene'
);

console.log('opening-scene-ui-test: ok');
