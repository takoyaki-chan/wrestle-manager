'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'app.js');
const source = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');
const autoManage = source.match(/\n  autoManage\(\) \{([\s\S]*?)\n  \},\n\n  processWeek\(\)/);

assert(autoManage, 'App.autoManage implementation should exist');
assert(!/showToast\s*\(/.test(autoManage[1]), 'autoManage should not show a completion toast');
assert(/G = \{ \.\.\.G, roster \};/.test(autoManage[1]), 'autoManage should still apply the roster changes');
assert(/refreshAll\(\);/.test(autoManage[1]), 'autoManage should still refresh the weekly screen');

console.log('weekly-auto-manage-toast-test: ok');
