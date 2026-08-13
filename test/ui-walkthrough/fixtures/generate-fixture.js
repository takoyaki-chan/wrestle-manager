#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const harnessRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(harnessRoot, '..', '..');
const srcRoot = path.join(projectRoot, 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcRoot, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js',
  'data.js',
  'management.js',
  'match-engine.js',
  'relationships.js',
  'draft-negotiation.js',
  'factions.js',
].forEach(loadAsGlobal);

function expandRoster(state) {
  const target = 14;
  const ownCount = state.roster.filter(fighter => !fighter.isRental).length;
  const additions = [...(state.freeAgents || [])]
    .sort((left, right) => Engine.util.ov(right) - Engine.util.ov(left) || left.id - right.id)
    .slice(0, Math.max(0, target - ownCount));
  const ids = new Set(additions.map(fighter => fighter.id));
  const roster = [...state.roster, ...additions.map(fighter => ({
    ...fighter,
    condition: fighter.condition ?? 80,
    draws: fighter.draws || 0,
    injury: null,
    intensive: false,
    intensiveWeeks: 0,
    losses: fighter.losses || 0,
    schedule: fighter.schedule || 'balance',
    seasonGrowth: fighter.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    wins: fighter.wins || 0,
  }))];
  return {
    ...state,
    freeAgents: (state.freeAgents || []).filter(fighter => !ids.has(fighter.id)),
    funds: Math.max(state.funds, 8000),
    orgPop: Math.max(state.orgPop, 80),
    roster,
    rosterCap: 16,
    rosterCapPop25Notified: true,
    rosterCapPop50Notified: true,
    rosterCapPop70Notified: true,
  };
}

const seed = Number(process.argv[2] || 42);
if (!Number.isFinite(seed) || seed <= 0) throw new Error('seed must be a positive number');
let state = expandRoster(Engine.createInitialState(seed, true));
state = {
  ...state,
  _saveDate: '2026-01-01T00:00:00.000Z',
  _saveNote: `ui walkthrough fixture: season 1 week 1, seed=${seed}`,
  _saveVersion: '1.26',
  debugLog: [],
  gameLog: [],
  rngSeed: seed,
};
for (const fighter of state.roster) {
  delete fighter._weekAction;
  fighter.intensive = false;
}

const destination = path.join(__dirname, `season-1-week-1-seed${seed}.json`);
fs.writeFileSync(destination, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
console.log(`Generated ${path.relative(projectRoot, destination)} (${state.roster.length} wrestlers, seed=${seed})`);
