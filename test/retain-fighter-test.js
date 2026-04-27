const assert = require('assert');
const fs = require('fs');
const path = require('path');

function extractMethodBody(source, signature) {
  const start = source.indexOf(signature);
  if (start < 0) throw new Error(`method signature not found: ${signature}`);

  const openBrace = source.indexOf('{', start);
  if (openBrace < 0) throw new Error(`method body start not found: ${signature}`);

  let depth = 1;
  let mode = 'code';
  let escaped = false;

  for (let i = openBrace + 1; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (mode === 'line-comment') {
      if (ch === '\n') mode = 'code';
      continue;
    }

    if (mode === 'block-comment') {
      if (ch === '*' && next === '/') {
        mode = 'code';
        i++;
      }
      continue;
    }

    if (mode === 'single-quote' || mode === 'double-quote' || mode === 'template') {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (
        (mode === 'single-quote' && ch === "'") ||
        (mode === 'double-quote' && ch === '"') ||
        (mode === 'template' && ch === '`')
      ) {
        mode = 'code';
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      mode = 'line-comment';
      i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      mode = 'block-comment';
      i++;
      continue;
    }

    if (ch === "'") {
      mode = 'single-quote';
      continue;
    }

    if (ch === '"') {
      mode = 'double-quote';
      continue;
    }

    if (ch === '`') {
      mode = 'template';
      continue;
    }

    if (ch === '{') {
      depth++;
      continue;
    }

    if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(openBrace + 1, i).trimEnd();
    }
  }

  throw new Error(`method body end not found: ${signature}`);
}

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const methodBody = extractMethodBody(appSource, 'doRetainFighter(fighterId) {');

const runRetain = new Function(
  'ctx',
  'fighterId',
  `
  let G = ctx.G;
  const App = ctx.App;
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
      roster: [
        { id: 1, name: 'Retained Ace', wear: 50, retainCount: 0, retainInjuryBonus: 0 },
        { id: 2, name: 'Active Mate' },
      ],
      relationships: {},
    },
    App: {},
    closeRetirementPopup() {},
    archiveRetiredRivalryState(state) { return state; },
    Engine: {
      career: {
        addEvent(fighter) { return fighter; },
      },
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

  const retained = next.roster.find(f => f.id === 1);
  assert(retained, 'expected retained fighter to stay on roster');
  assert.strictEqual(retained.wear, 60, 'expected retain action to add wear');
  assert.strictEqual(retained.retainCount, 1, 'expected retain count to increment');
  assert.strictEqual(retained.retainInjuryBonus, 0.05, 'expected retain injury bonus to increment');
  assert.strictEqual(retained.lastRun, false, 'expected lastRun to be cleared');
  assert.strictEqual(retained.lastRunWeek, null, 'expected lastRunWeek to be cleared');
  assert(events.length === 1, 'expected success popup to be emitted');
})();

console.log('retain-fighter-test: ok');
