'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const srcDir = path.join(__dirname, '..', '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

function ensureWindow() {
  global.window = global.window || {};
  if (typeof global.window.IS_TRIAL === 'undefined') global.window.IS_TRIAL = false;
}

function loadGame({ full = false, factions = false, draft = false, flagDialogue = false } = {}) {
  ensureWindow();

  const files = [
    'victory-lines.js',
    'data.js',
  ];

  if (full || factions) files.push('data-faction-dialogue.js');

  files.push(
    'management.js',
    'match-engine.js',
    'relationships.js',
  );

  if (full || flagDialogue) files.push('flag-dialogue.js');
  if (full || factions) files.push('factions.js');
  if (full || draft) files.push('draft-negotiation.js');

  files.forEach(loadAsGlobal);
}

module.exports = {
  loadAsGlobal,
  loadGame,
};
