'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

(function testTopLevelAudioMapsDoNotReachIntoAudioClosure() {
  assert.ok(/SOFT:\s*'\.\.\/bgm\/production-ogg\/wm_bgm_c07_v02\.ogg'/.test(app),
    'faction BGM must be a top-level usable file path');
  assert.ok(/const CEREMONY_ARRIVAL_BGM\s*=\s*\{\s*file:\s*'\.\.\/bgm\/production-ogg\/wm_bgm_c01_v01\.ogg',\s*vol:\s*0\.30,?\s*\}/.test(app),
    'ceremony BGM must define its own file path and volume');
  assert.ok(!/SUNO_BGM\.(?:kaimaku|contract)\.file/.test(app),
    'top-level event constants must not use Audio module-private SUNO_BGM');
})();

console.log('app-startup-scope-test: ok');
