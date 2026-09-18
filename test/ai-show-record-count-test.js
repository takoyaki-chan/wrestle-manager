'use strict';
// AI団体の興行1回で wins+losses+draws の増分が試合数と一致することの回帰テスト。
// 2026-09-18: 成長ループ内と後段の streak 更新の2箇所で加算されており、AI選手の通算成績が毎試合2重に増えていた(8試合で+32)。
// wins/losses/draws は後段で1回だけ数える(processSettlement と同等)。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
global.window = { IS_TRIAL: false };
const assert = require('assert');
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js', 'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

let state = { ...Engine.createInitialState(9200, true), season: 2, week: 3, offSeason: false, weekPhase: 'manage', industryNewsQueue: [] };
const rng = Engine.rng.create(Engine.rng.derive(9200, 2, 3));
const orgId = 'org_s';
const before = new Map(state.aiOrgs[orgId].roster.map(f => [f.id, (f.wins || 0) + (f.losses || 0) + (f.draws || 0)]));
// 興行週にするため tickWeek ではなく processAIWeek を直接。興行が立たない週なら数週回す
let found = null;
for (let w = 1; w <= 12 && !found; w++) {
  const s2 = { ...state, week: w };
  const out = Engine.rival.processAIWeek(rng, s2, RIVAL_ORGS.find(o => o.id === orgId));
  const org = out && (out.aiOrgs ? out.aiOrgs[orgId] : out[orgId] || out);
  const results = org && org._lastMatchResults;
  if (results && results.length) found = { org, results, week: w };
}
assert.ok(found, '12週以内にAI団体の興行が立つはず');
const { org, results } = found;
let singles = 0, tags = 0; results.forEach(r => (r.matchType === 'tag' ? tags++ : singles++));
let deltaSum = 0, over = [];
org.roster.forEach(f => {
  const b = before.get(f.id); if (b == null) return;
  const d = (f.wins || 0) + (f.losses || 0) + (f.draws || 0) - b;
  deltaSum += d;
  if (d > 1) over.push(`${f.name}:+${d}`);
});
const expected = singles * 2 + tags * 4;
assert.strictEqual(deltaSum, expected, `wins+losses+draws の増分は試合数と一致(シングル×2+タッグ×4)。2重加算: ${over.slice(0, 4).join(', ')}`);
assert.strictEqual(over.length, 0, '1興行で通算成績が2以上増える選手がいない');
console.log(`ai-show-record-count-test: ok (week ${found.week}: singles ${singles} tags ${tags} → +${deltaSum})`);
