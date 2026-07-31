'use strict';

// 1年目を実際に進行し、年末表彰とPPVテレビ中継の到達状態を検証する。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js',
  'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

function advanceFirstSeason(seed) {
  let state = Engine.createInitialState(seed, true);
  let sawPpvTV = false;
  let guard = 0;
  while (!(state.offSeason && state.offWeek === 1) && guard++ < 60) {
    if (state.weekPhase === 'ppvTV') {
      sawPpvTV = true;
      state = { ...state, weekPhase: 'manage', ppvPhase: null };
    } else if (state.weekPhase === 'ppvShow') {
      state = { ...state, weekPhase: 'manage', ppvPhase: 'tv' };
    } else if (state.weekPhase !== 'manage' && state.weekPhase !== 'settled' && state.weekPhase !== 'offseason') {
      // UI専用の選択・演出フェーズは、この検証では状態を保ったまま通過させる。
      state = { ...state, weekPhase: 'manage' };
    }
    state = Engine.tickWeek(state).state;
    state = Engine.advanceWeek(state).state;
    if (state.weekPhase === 'ppvTV') sawPpvTV = true;
  }
  assert.ok(guard < 60, '1年目のオフシーズン第1週へ到達すること');
  return { state, sawPpvTV };
}

const { state, sawPpvTV } = advanceFirstSeason(20260731);
const awards = state.pendingAwards;
const present = Object.entries(awards || {})
  .filter(([key, value]) => key !== 'npcAwards' && value && (!Array.isArray(value) || value.length > 0))
  .map(([key]) => key);

console.log('year1 awards:', present.join(', ') || '(none)');
console.log('year1 ppvTV:', sawPpvTV);
assert.ok(awards, 'オフシーズン第1週に表彰データが生成されること');
assert.ok(Engine.awards.hasDisplayableAwards(awards), '成立する賞があれば式典表示対象になること');
assert.strictEqual(sawPpvTV, true, '出場資格がない初年度もPPVテレビ中継へ入ること');

assert.strictEqual(Engine.awards.hasDisplayableAwards({ season: 1, champions: {}, hallOfFame: [] }), false,
  '全賞が空なら式典をスキップすること');

const appSource = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');
assert.ok(!appSource.includes('if (!Array.isArray(G.seasonHistory) || G.seasonHistory.length === 0) return false;'),
  '初年度の空のseasonHistoryを理由に表彰データ復旧を拒まないこと');

console.log('year1-season-events-test: PASS');
