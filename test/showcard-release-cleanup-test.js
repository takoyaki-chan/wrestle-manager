const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const match = appSource.match(/_removeFighterFromShowCard\(showCard, fighterId\) \{[\s\S]*?\n  \},/);
if (!match) throw new Error('_removeFighterFromShowCard block not found');

const fnBody = match[0]
  .replace(/^_removeFighterFromShowCard\(showCard, fighterId\) \{/, '')
  .replace(/\n  \},$/, '');

const runCleanup = new Function('showCard', 'fighterId', `${fnBody}`);

(function testCleanupClearsReleasedFighterAndTitleFlag() {
  const cleaned = runCleanup([
    { left: 10, right: 20, isTitle: true },
    { left: 30, right: 10, isTitle: false },
    { left: 40, right: 50, isTitle: true },
  ], 10);

  assert.deepStrictEqual(cleaned, [
    { left: 0, right: 20, isTitle: false },
    { left: 30, right: 0, isTitle: false },
    { left: 40, right: 50, isTitle: true },
  ]);
})();

console.log('showcard-release-cleanup-test: ok');
