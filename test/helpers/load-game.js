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

// i18n Stage A P3a-4d: factions.js が WM_I18N.t() を呼ぶようになったため、
// i18n.js 本体は読み込まずスタブで賄う（ja では素通し+プレースホルダ置換。
// 契約は src/i18n.js の D1/D2 参照。他の複数テストファイルと同じスタブ）。
function ensureWmI18n() {
  if (global.WM_I18N) return;
  global.WM_I18N = { t(text, params) {
    if (typeof text !== 'string' || !params) return text;
    let out = text;
    Object.keys(params).forEach((key) => { out = out.split('{' + key + '}').join(params[key]); });
    return out;
  } };
}

function loadGame({ full = false, factions = false, draft = false, flagDialogue = false } = {}) {
  ensureWindow();
  ensureWmI18n();

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
