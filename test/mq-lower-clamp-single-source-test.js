'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const battle = fs.readFileSync(path.join(root, 'src', 'match-engine.js'), 'utf8');
const management = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8');

assert.ok(!battle.includes('mq = Math.max(5, mq);'), 'singles simulation must not apply the MQ lower clamp');
assert.ok(!battle.includes('final = Math.max(5, final);'), 'tag simulation must not apply the MQ lower clamp');
assert.ok(management.includes('const finalMq = preLowerClampMq;'), 'finalize should be the sole MQ final-value source');
assert.ok(!management.includes('const finalMq = Math.max(5, preLowerClampMq);'), 'finalize must not reintroduce the lower clamp');

console.log('mq-lower-clamp-single-source-test: ok');
