'use strict';
const path = require('path');
const fs = require('fs');
const vm = require('vm');
global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}
loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');

const chars = ALL_CHARS.slice(0, 4);
const rng = Engine.rng.create(12345);
const result = Engine.tagMatch.simulateTagMatch(
  { fighter1: chars[0], fighter2: chars[1] },
  { fighter1: chars[2], fighter2: chars[3] },
  rng,
  { bond_A: 50, bond_B: 50, tagExp_A: 0, tagExp_B: 0, recordFrames: true }
);
console.log('winner:', result.winner, 'turns:', result.turns);
console.log('frames.length:', result.frames ? result.frames.length : 'NONE');
console.log('frames===turns?', result.frames && result.frames.length === result.turns);
if (result.frames && result.frames.length > 0) {
  const f0 = result.frames[0];
  console.log('frame[0] keys:', Object.keys(f0).join(','));
  console.log('frame[0].action:', JSON.stringify(f0.action));
  const last = result.frames[result.frames.length - 1];
  console.log('last.winner:', last.winner, 'last.finType:', last.finType, 'last.finMove:', last.finMove);
  const evFrames = result.frames.filter(f => f.events && f.events.length > 0);
  console.log('event frames:', evFrames.length);
  const allEvts = result.frames.flatMap(f => f.events || []);
  console.log('events in frames:', allEvts.length, '/ dramaSummary:', result.dramaSummary.length);
}
// 後方互換
const rng2 = Engine.rng.create(12345);
const r2 = Engine.tagMatch.simulateTagMatch(
  { fighter1: chars[0], fighter2: chars[1] },
  { fighter1: chars[2], fighter2: chars[3] },
  rng2, { bond_A: 50, bond_B: 50, tagExp_A: 0, tagExp_B: 0 }
);
console.log('\n--- no recordFrames ---');
console.log('frames field:', r2.frames);
console.log('same result? winner:', r2.winner===result.winner, 'turns:', r2.turns===result.turns, 'mq:', r2.mq===result.mq);
