'use strict';

// UIの「次の週へ」入口を、実際の app.js の関数本体で実行する回帰テスト。
// ブラウザ描画そのものには依存せず、インライン onclick が呼ぶ
// App.advanceFromWeekSummary の状態契約と Engine 呼出回数を検査する。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

global.window = { IS_TRIAL: false };
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js', 'flag-dialogue.js',
  'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

const appSource = (process.env.WM_APP_SOURCE_REF
  ? execFileSync('git', ['show', `${process.env.WM_APP_SOURCE_REF}:src/app.js`], { cwd: root, encoding: 'utf8' })
  : fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8')
).replace(/\r\n/g, '\n');

function methodBody(signature) {
  const start = appSource.indexOf(`\n  ${signature} {`) + 3;
  assert.ok(start >= 0, `${signature} が見つかること`);
  const bodyStart = appSource.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < appSource.length; i++) {
    if (appSource[i] === '{') depth++;
    if (appSource[i] === '}') depth--;
    if (depth === 0) return appSource.slice(bodyStart + 1, i);
  }
  throw new Error(`${signature} の終端が見つからない`);
}

const summaryBody = methodBody('advanceFromWeekSummary()');
const processBody = methodBody('processWeek()');
const autoAdvanceBody = methodBody('_tryAutoAdvance()');

// `processWeek` の最後は、集計画面で止まらず同一クリック中に既存の専用大会分岐へ渡す。
assert.ok(
  /if \(App\._tryAutoAdvance\(\)\) \{\s*App\.advanceFromWeekSummary\(\);\s*return;\s*\}/.test(processBody),
  'processWeek は週次処理後に同一クリック内で advanceFromWeekSummary を1回呼ぶこと'
);
assert.ok(autoAdvanceBody.includes("weekPhase: 'weekSummary'"),
  '_tryAutoAdvance は既存の weekSummary 入力契約を設定すること');
assert.ok(!autoAdvanceBody.includes('isMonthEnd'),
  '月末だけ別扱いせず、全週を同じ単一遷移経路で処理すること');

function runSummaryHandler(state, calls, uiLog) {
  const originalAdvanceWeek = Engine.advanceWeek;
  Engine.advanceWeek = function countedAdvanceWeek(input) {
    calls.engineAdvance++;
    return originalAdvanceWeek.call(this, input);
  };
  try {
    const app = {
      repairProgressionState: () => false,
      _shouldStartTenchosenReplay: () => false,
      initPPVShow: () => { uiLog.push('initPPVShow'); },
      initPPVTV: () => { uiLog.push('initPPVTV'); },
      initAutumnWarReplay: () => { uiLog.push('initAutumnWarReplay'); },
      initTenchosenReplay: () => { uiLog.push('initTenchosenReplay'); },
      _shouldStartSpringTagLeagueReplay: () => false,
      initSpringTagLeagueReplay: () => { uiLog.push('initSpringTagLeagueReplay'); },
      _discardStaleSpringTagLeagueReplay: () => {},
      checkSurvivalUpdate: () => {}, checkCrisisEnteredPopup: () => {},
      checkTitleEstablishment: () => {}, checkRosterCapMilestones: () => {},
      checkPrologueHighlights: () => {}, checkTenchosenPreEvent: () => {},
      checkUnifiedTitlePresentation: () => {},
      _refreshTicker: () => {},
    };
    const invoke = new Function(
      'App', 'Engine', 'initialState', 'uiLog',
      'Audio', 'dismissAllPopups', 'Storage', 'showScreen', 'refreshAll',
      'document', 'isShowWeek', 'isSpecialShow', 'isPPV', 'showToast',
      'sessionRng',
      `let G = initialState;\nconst console = { info: (...args) => uiLog.push(args[0]), warn: (...args) => uiLog.push(args[0]) };\nconst result = (function() {${summaryBody}})();\nreturn { state: G, result };`
    );
    return invoke(
      app, Engine, state, uiLog,
      { play: () => {} }, () => {}, { autoSave: () => {} }, () => {}, () => {},
      { querySelectorAll: () => [{ classList: { remove() {}, add() {} } }] },
      () => false, () => false, () => false, () => {}, null
    );
  } finally {
    Engine.advanceWeek = originalAdvanceWeek;
  }
}

// 第47週のサマリー onclick は一度だけ Engine.advanceWeek を呼び、第48週のPPV専用phaseに入る。
let state = { ...Engine.createInitialState(480047, true), week: 47, weekPhase: 'weekSummary', gameLog: [] };
const calls = { engineAdvance: 0 };
const uiLog = [];
let first = runSummaryHandler(state, calls, uiLog);
assert.strictEqual(first.result, true, 'サマリーonclickは有効な完了状態を1回消費すること');
assert.strictEqual(calls.engineAdvance, 1, '1クリックで Engine.advanceWeek は1回だけ呼ばれること');
assert.strictEqual(first.state.week, 48, '第47週の1クリックで第48週へ進むこと');
assert.ok(['ppvShow', 'ppvTV'].includes(first.state.weekPhase),
  `第48週はPPV専用phaseへ入ること (actual=${first.state.weekPhase})`);
assert.ok(uiLog.includes('[WM][week-advance] summary handler advanced exactly once'),
  'UIハンドラの実行ログが残ること');

// 同じ onclick が重複発火しても、第48週のPPV専用phaseでは拒否し第49週へ進めない。
const beforeSecond = { week: first.state.week, phase: first.state.weekPhase, offSeason: first.state.offSeason };
const second = runSummaryHandler(first.state, calls, uiLog);
assert.strictEqual(second.result, false, '古いサマリーonclickはPPV専用phaseで無視すること');
assert.strictEqual(calls.engineAdvance, 1, '重複onclickが Engine.advanceWeek を追加で呼ばないこと');
assert.deepStrictEqual(
  { week: second.state.week, phase: second.state.weekPhase, offSeason: second.state.offSeason },
  beforeSecond,
  '重複onclickで第48週を第49週/オフシーズンへ飛ばさないこと'
);

// 第44週から、週遷移の呼出列は48を必ず経由してオフシーズンへ到達する。
state = { ...Engine.createInitialState(480044, true), week: 44, weekPhase: 'weekSummary', gameLog: [] };
const transitionLog = [];
for (let guard = 0; guard < 5 && !state.offSeason; guard++) {
  const localCalls = { engineAdvance: 0 };
  const localLog = [];
  const from = state.week;
  // 各周のtickWeek完了直後に processWeek が設定する入力契約を再現する。
  state = { ...state, weekPhase: 'weekSummary' };
  const next = runSummaryHandler(state, localCalls, localLog);
  assert.strictEqual(localCalls.engineAdvance, 1, `第${from}週のUI遷移はEngineを1回だけ呼ぶこと`);
  state = next.state;
  transitionLog.push(`${from}:${'weekSummary'} -> ${state.week}:${state.weekPhase}`);
  if (['ppvShow', 'ppvTV'].includes(state.weekPhase)) {
    // PPV画面の終了処理は第48週のtickWeekを一度だけ確定し、その後にオフシーズンへ遷移する。
    state = Engine.tickWeek({ ...state, weekPhase: 'manage', ppvPhase: null }).state;
    const afterPpv = Engine.advanceWeek(state).state;
    transitionLog.push(`48:PPV-settle -> ${afterPpv.week}:${afterPpv.weekPhase}`);
    state = afterPpv;
  }
}
assert.ok(transitionLog.some(line => line.includes('-> 48:ppv')), `第48週を経由すること: ${transitionLog.join(' | ')}`);
assert.ok(state.offSeason, `第48週の確定後にのみオフシーズンへ入ること: ${transitionLog.join(' | ')}`);

// 4大会の開始週も、同じUIハンドラから Engine を1回だけ呼んで到達する。
function assertUiEventEntry(label, previousWeek, prepare, verify) {
  let eventState = { ...Engine.createInitialState(481000 + previousWeek, true), week: previousWeek, weekPhase: 'weekSummary', gameLog: [] };
  eventState = prepare ? prepare(eventState) : eventState;
  const eventCalls = { engineAdvance: 0 };
  const eventResult = runSummaryHandler(eventState, eventCalls, []);
  assert.strictEqual(eventCalls.engineAdvance, 1, `${label}: UIハンドラは Engine を1回だけ呼ぶこと`);
  assert.strictEqual(eventResult.state.week, previousWeek + 1, `${label}: 正規の大会週へ到達すること`);
  verify(eventResult.state);
}

assertUiEventEntry('春タッグ', 11,
  s => ({ ...s, springTagLeague: Engine.springTagLeague.announce(s) }),
  s => assert.ok(s.springTagLeague && (s.springTagLeague.completedSeason === s.season || s._pendingSpringTagLeagueReplay),
    '春タッグは第12週に1回だけ実行されること'));
assertUiEventEntry('ジュニア', 23, null,
  s => assert.ok(s.weekPhase === 'juniorTournament' || s.juniorTournament?.completedSeason === s.season,
    'ジュニア大会は第24週に通常興行を置き換えること'));
assertUiEventEntry('秋4団体戦', 35, null,
  s => assert.ok(s._pendingAutumnWarReplay || s.autumnWar?.completedSeason === s.season,
    '秋4団体戦は第36週に1回だけ開始されること'));
assertUiEventEntry('PPV GRAND FINAL', 47, null,
  s => assert.ok(['ppvShow', 'ppvTV'].includes(s.weekPhase),
    'PPVは第48週に専用phaseへ入ること'));

assert.deepStrictEqual([12, 24, 36, 48], [12, 24, 36, PPV_SHOW_WEEK],
  '4大会の週定数は12/24/36/48を維持すること');

console.log('UI handler log:', uiLog.join(' | '));
console.log('Week 44 transition log:', transitionLog.join(' | '));
console.log('week-advance-single-step-test: PASS');
