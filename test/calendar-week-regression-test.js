'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

let management = fs.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
management = management.replace(/^(const|let) /gm, 'var ');
new vm.Script(management, { filename: 'management.js' }).runInThisContext();

assert.strictEqual(Engine.util.absWeek(1, 48), 48);
assert.strictEqual(Engine.util.absWeek(2, 1), 49, 'active-week clock must omit offseason');

assert.strictEqual(Engine.util.absWeekTotal(1, 48, false, 0), 48);
assert.strictEqual(Engine.util.absWeekTotal(1, 48, true, 1), 49);
assert.strictEqual(Engine.util.absWeekTotal(1, 48, true, 2), 50);
assert.strictEqual(Engine.util.absWeekTotal(1, 48, true, 3), 51);
assert.strictEqual(Engine.util.absWeekTotal(1, 48, true, 4), 52);
assert.strictEqual(
  Engine.util.absWeekTotal(2, 1, false, 0),
  53,
  'season 2 week 1 must immediately follow four offseason weeks'
);

const convert = Engine.util.convertLegacyAbsWeek53To52;
assert.strictEqual(convert(52), 52);
assert.strictEqual(convert(53), 53, 'legacy synthetic week 53 must fold into next season week 1');
assert.strictEqual(convert(54), 53, 'legacy season 2 week 1 must become calendar week 53');
assert.strictEqual(convert(107), 105, 'legacy season 3 week 1 must remove two artificial weeks');

console.log('calendar-week-regression-test: ok');
