'use strict';

// Generic scene progression must use a readable label.  Action-specific
// buttons such as "結果を見る" intentionally keep their own wording.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8');

assert.strictEqual(
  (source.match(/<button class="war-victory-close(?: [^"]*)?"(?: type="button")?>次へ<\/button>/g) || []).length,
  5,
  'generic post-match dialogue buttons must use the 次へ label'
);
assert.ok(
  source.includes('<button class="crrm-sequence-next crrm-sequence-forward" type="button">次へ</button>'),
  'the challenge result sequence must use the 次へ label'
);
assert.ok(
  !source.includes('class="war-victory-close">▶</button>') &&
    !source.includes('class="crrm-sequence-next crrm-sequence-forward" type="button" aria-label="次の場面へ">▶</button>'),
  'generic scene progression must not regress to an arrow-only button'
);

console.log('progression-labels-test: ok');
