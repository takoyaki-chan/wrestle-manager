const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const startToken = 'doRetainFighter(fighterId) {';
const endToken = '\n  // Release a fighter';
const start = appSource.indexOf(startToken);
const end = appSource.indexOf(endToken, start);
if (start < 0 || end < 0) throw new Error('doRetainFighter block not found');

const methodBody = appSource
  .slice(start + startToken.length, end)
  .trimEnd()
  .replace(/\n\s*\},?\s*$/, '');

const runRetain = new Function(
  'ctx',
  'fighterId',
  `
  let G = ctx.G;
  const closeRetirementPopup = ctx.closeRetirementPopup;
  const archiveRetiredRivalryState = ctx.archiveRetiredRivalryState;
  const Engine = ctx.Engine;
  const Storage = ctx.Storage;
  const refreshAll = ctx.refreshAll;
  const showEventPopup = ctx.showEventPopup;
  ${methodBody}
  return G;
`
);

(function testRetainedFighterLeavesRetiredCooldownPools() {
  const events = [];
  const next = runRetain({
    G: {
      rngSeed: 1,
      season: 3,
      week: 48,
      roster: [{ id: 2, name: 'Active Mate' }],
      retiredFighters: [{ id: 1, name: 'Retired Ace', wear: 50, retainCount: 0 }],
      retiredIds: [1, 9],
      retiredSeasons: { 1: 3, 9: 1 },
      relationships: {},
    },
    closeRetirementPopup() {},
    archiveRetiredRivalryState(state) { return state; },
    Engine: {
      retirement: { selectRetainLine() { return 'back'; } },
      relationships: {
        applyToRoster(state) { return state; },
        applyFromRoster(state) { return state; },
      },
      rng: {
        create() { return {}; },
        derive() { return 1; },
      },
    },
    Storage: { autoSave() {} },
    refreshAll() {},
    showEventPopup(payload) { events.push(payload); },
  }, 1);

  assert(next.roster.some(f => f.id === 1), 'expected retained fighter to return to roster');
  assert(!next.retiredFighters.some(f => f.id === 1), 'expected retained fighter to leave retiredFighters');
  assert(!next.retiredIds.includes(1), 'expected retained fighter to be removed from retiredIds');
  assert.strictEqual(next.retiredSeasons[1], undefined, 'expected retained fighter to be removed from retiredSeasons');
  assert(next.retiredIds.includes(9), 'expected other retired ids to stay intact');
  assert(events.length === 1, 'expected success popup to be emitted');
})();

console.log('retain-fighter-test: ok');
