'use strict';
// F09 派閥対抗戦のクールダウン回帰テスト(2026-09-18)。
// Keisuke実機報告「派閥が対抗戦を制した→1週間後また対抗戦が勃発」。
// 原因: applyF09SweepBonus / applyRivalryVictory が純関数版 _markCooldown の戻り値を捨てており、
// F09/F08 のクールダウンが一度も記録されていなかった(+決着後のキーが勝者/敗者順で判定側と不一致)。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
global.WM_I18N = { t(text, params) {
  if (typeof text !== 'string' || !params) return text;
  let out = text;
  Object.keys(params).forEach((key) => { out = out.split('{' + key + '}').join(params[key]); });
  return out;
}, pn(str) { return str; }, pnSurname(str) { return str; }, mv(str) { return str; }, mvShort(str) { return str; } };
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js', 'relationships.js', 'factions.js'].forEach(loadAsGlobal);

const cfg = FACTION_CONFIG;
function fighter(id) {
  return { id, name: `F${id}`, pw: 70, sp: 70, te: 70, st: 70, mn: 70, condition: 80, popularity: 40, trust: 60, injury: null };
}
// 両派閥とも抗争中・対立度65以上・勢い0・OVR同等 = F09 の発火条件をすべて満たす状態
function hostileState(week) {
  return {
    season: 2, week, rngSeed: 7,
    roster: [1, 2, 3, 4, 5, 6].map(fighter),
    relationships: {},
    factions: [
      { id: 1, name: '赤組', leaderId: 1, memberIds: [1, 2, 3], type: 'loyal', inHostility: true, momentum: 0, status: 'active' },
      { id: 2, name: '青組', leaderId: 4, memberIds: [4, 5, 6], type: 'loyal', inHostility: true, momentum: 0, status: 'active' },
    ],
    factionHostility: { '1>2': 80, '2>1': 80 },
    factionRivalryPoints: {},
    factionEventCooldowns: {},
    factionTimeline: [],
  };
}

// 1) 対抗戦の集計(applyF09SweepBonus)後、翌週は同じペアで F09 が発火しない(52週CD)
{
  const s = hostileState(10);
  assert.ok(Engine.factions.checkF09Conditions(s), '前提: この状態は F09 の発火条件を満たす');
  const results = [{ winnerFactionId: 1 }, { winnerFactionId: 1 }, { winnerFactionId: 2 }];
  const after = Engine.factions.applyF09SweepBonus(s, 1, 2, results);
  const key = Engine.factions._f09Key(2, 1);
  assert.ok(after.factionEventCooldowns && after.factionEventCooldowns[key], 'F09 クールダウンが記録される(min/max順キー)');
  const nextWeek = { ...after, week: 11 };
  assert.strictEqual(Engine.factions.checkF09Conditions(nextWeek), null, '翌週は同じペアで F09 が再発火しない');
  const oneYearLater = { ...after, season: 3, week: 11 };
  assert.ok(Engine.factions.checkF09Conditions(oneYearLater), `${cfg.f09Cooldown}週経てば再び発火できる`);
}

// 2) 先取100pt の決着(applyRivalryVictory)でも F08/F09 のクールダウンが判定側と同じキーで記録される
{
  const s0 = hostileState(20);
  // 勝者が id の大きい派閥(=旧コードのキー "F09_2_1" が判定側 "F09_1_2" と食い違う組み合わせ)
  // 2026-09-26: applyRivalryVictory は返却値で更新する純関数になった(勢い・信頼・対立度の取りこぼしの修正)
  const s = Engine.factions.applyRivalryVictory(s0, 2, 1, 'POINTS', Engine.rng.create(1));
  const cds = s.factionEventCooldowns || {};
  assert.ok(cds[Engine.factions._f09Key(1, 2)], '決着後に F09 クールダウン(判定キー)が立つ');
  assert.ok(cds[Engine.factions._f08Key(1, 2)], '決着後に F08 クールダウン(判定キー)が立つ');
  assert.strictEqual(Object.keys(cds).some(k => /^F0[89]_2_1$|^F08_2_1$/.test(k)), false, '勝者/敗者順の孤立キーを作らない');
  // 決着直後は対立度が下がる(80-40=40 < 65)ので条件でも止まるが、対立度が再燃してもCDで止まること
  const reheated = { ...s, week: 21, factionHostility: { '1>2': 90, '2>1': 90 } };
  assert.strictEqual(Engine.factions.checkF09Conditions(reheated), null, '決着の翌週に対立が再燃しても F09 は発火しない');
}

// 3) 純関数版 _markCooldown は従来どおり新しい state を返し、元を汚さない(既存呼び出し側の前提)
{
  const s = hostileState(30);
  const out = Engine.factions._markCooldown(s, 'X');
  assert.ok(out !== s && out.factionEventCooldowns.X && !(s.factionEventCooldowns || {}).X);
}

console.log('faction-f09-cooldown-test: ok');
