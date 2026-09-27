#!/usr/bin/env node
'use strict';

// ══════════════════════════════════════════════════════════════════════════════
//  春のタッグリーグ 編成画面の「枠数」と「選び直し」の回帰テスト(2026-09-28 Keisuke報告)
//
//  ■ なぜこのテストがあるか
//    ランキング4位(出場枠1)なのに編成画面に「代表タッグ4組」と出て、4枠とも同じ2人が入り、
//    その2人は「他枠で選出済み」で押せず外せなかった。開催してみると出場は1組だった。
//    原因: 旧形式(v0.1: 団体ごとに1組・teamIdなし)で告知されたセーブを週11で開くと、
//    confirmPlayerTeams が teamId(=全チーム undefined)で差し替え先を引いていたため、
//    他団体の3チームまで自団体の組で上書きされた。週12の run() だけが今の枠(3/2/2/1)へ
//    移行していたので、開催時は枠どおり1組に戻った。
//
//  ■ 何を見るか
//    A. 確定処理: 旧形式でも他団体のチームを自団体の組で上書きしない
//    B. migrateLegacyEntry: 旧形式(と、上書き済みで壊れた形)を今の枠へ移し、確定済みペアを
//       第1代表に引き継ぐ。v0.2の大会・完了済みの旧記録・中止の大会は触らない
//    C. 週11の入口(advanceWeek)で旧形式が移される / run() は従来どおり開催できる
//    D. 編成画面の選び直し: 2名そろっていても入れ替えられる・他の枠の選手を移せる・
//       × で外せる・1人だけの枠があると保存できない理由を出す
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game');

loadGame();

let failures = 0;
function ok(cond, msg) {
  if (cond) console.log(`  ok  ${msg}`);
  else { failures++; console.log(`  NG  ${msg}`); }
}

const SL = Engine.springTagLeague;
const ORDER = ['player', 'org_s', 'org_a', 'org_b'];
const playerTeams = st => (st.springTagLeague.teams || []).filter(t => t.orgId === 'player');

/** ランキングを固定した週11の状態。rankOrder の先頭が1位 */
function entryWeekState(seed, rankOrder) {
  const base = Engine.createInitialState(seed, true);
  const pool = [...(base.roster || [])];
  (base.freeAgents || []).forEach(f => { if (pool.length < 10 && !pool.some(r => r.id === f.id)) pool.push(f); });
  return {
    ...base,
    week: SL.ENTRY_WEEK,
    roster: pool.map(f => ({ ...f, injury: null, isRental: false })),
    rankings: rankOrder.map((orgId, index) => ({ orgId, name: SL._orgName(base, orgId), rating: 100 - index, rank: index + 1 })),
  };
}

/** v0.1 の告知(団体ごと1組・teamId/slot/formatなし)。自団体は未編成 */
function legacyLeague(state) {
  return {
    announcedSeason: state.season,
    cancelled: false,
    teams: ORDER.map(orgId => {
      if (orgId === 'player') return { orgId, orgName: SL._orgName(state, orgId), f1Id: null, f2Id: null, confirmed: false, available: true };
      const pair = SL.bestPair(state, SL._orgRoster(state, orgId));
      return { orgId, orgName: SL._orgName(state, orgId), f1Id: pair.f1Id, f2Id: pair.f2Id, confirmed: true, available: true };
    }),
  };
}

// ── A. 確定処理は teamId に頼らない ─────────────────────────────────────────
(function confirmNeverOverwritesOtherOrgs() {
  console.log('A. 確定処理');
  let G = entryWeekState(4101, ['org_s', 'org_a', 'org_b', 'player']);
  G = { ...G, springTagLeague: legacyLeague(G) };
  const [x, y] = SL._eligible(G.roster);
  const after = SL.confirmPlayerTeams(G, [{ f1Id: x.id, f2Id: y.id }]);
  ok(playerTeams(after).length === 1, `旧形式で確定しても自団体のチームは1組のまま(実際 ${playerTeams(after).length})`);
  ok(ORDER.slice(1).every(orgId => after.springTagLeague.teams.some(t => t.orgId === orgId)),
    '他団体のチームが自団体の組で上書きされない');
  const mine = playerTeams(after)[0];
  ok(mine.f1Id === x.id && mine.f2Id === y.id && mine.confirmed, '自団体のチームには選んだ2人が入る');
})();

// ── B. 旧形式の移行 ─────────────────────────────────────────────────────────
(function migrateLegacyEntry() {
  console.log('B. 旧形式の移行');
  // 4位 → 枠1(3/2/2/1)。確定済みの組は第1代表へ引き継ぐ
  let G = entryWeekState(4102, ['org_s', 'org_a', 'org_b', 'player']);
  const league = legacyLeague(G);
  const [x, y] = SL._eligible(G.roster);
  league.teams[0] = { ...league.teams[0], f1Id: x.id, f2Id: y.id, confirmed: true };
  G = { ...G, springTagLeague: league };
  const migrated = SL.migrateLegacyEntry(G);
  ok(migrated.springTagLeague.format === 2, '移行後は v0.2 形式');
  ok(playerTeams(migrated).length === 1 && migrated.springTagLeague.slotAllocation.player === 1,
    `4位の自団体は1枠(実際 ${playerTeams(migrated).length})`);
  ok(migrated.springTagLeague.teams.length === 8, '大会は8チーム(3/2/2/1)');
  const first = playerTeams(migrated)[0];
  ok(first.f1Id === x.id && first.f2Id === y.id && first.confirmed, '確定済みの組は第1代表へ引き継がれる');
  ok(migrated.springTagLeague.announcedSeason === G.season, '告知シーズンを保つ');

  // 1位 → 枠3
  let top = entryWeekState(4103, ['player', 'org_s', 'org_a', 'org_b']);
  top = { ...top, springTagLeague: legacyLeague(top) };
  ok(playerTeams(SL.migrateLegacyEntry(top)).length === 3, '1位の自団体は3枠');

  // 旧コードで上書き済みの壊れた形(自団体の組×4、teamIdなし)も直る
  const broken = { ...G, springTagLeague: { announcedSeason: G.season, cancelled: false,
    teams: ORDER.map(() => ({ orgId: 'player', orgName: 'x', f1Id: x.id, f2Id: y.id, confirmed: true, available: true })) } };
  const fixed = SL.migrateLegacyEntry(broken);
  ok(playerTeams(fixed).length === 1 && fixed.springTagLeague.teams.length === 8,
    `壊れた「代表4組」も今の枠(1組+他団体7組)へ戻る(実際 自団体${playerTeams(fixed).length}組/全${fixed.springTagLeague.teams.length})`);

  // 触らないもの
  ok(SL.migrateLegacyEntry(migrated) === migrated, 'v0.2 の大会はそのまま(同一参照)');
  const completed = { ...G, springTagLeagueCompletedSeason: G.season };
  ok(SL.migrateLegacyEntry(completed) === completed, '今季完了済みの旧記録は触らない');
  const cancelled = { ...G, springTagLeague: { ...league, cancelled: true } };
  ok(SL.migrateLegacyEntry(cancelled) === cancelled, '中止の大会は触らない');
})();

// ── C. 週11の入口と週12の開催 ─────────────────────────────────────────────────
(function weekPipeline() {
  console.log('C. 週11の入口・週12の開催');
  let G = entryWeekState(4104, ['org_s', 'org_a', 'org_b', 'player']);
  G = { ...G, week: SL.ANNOUNCE_WEEK, springTagLeague: legacyLeague(G) };
  // 週10に旧形式で告知済みのまま週11へ進む(週10の告知処理は通らない)
  const advanced = Engine.advanceWeek(G).state;
  ok(advanced.week === SL.ENTRY_WEEK, '週11へ進んだ');
  ok(advanced.springTagLeague.format === 2 && playerTeams(advanced).length === 1,
    `週11の入口で今の枠へ移る(自団体 ${playerTeams(advanced).length}組)`);
  ok(advanced.springTagPhase === 'entry', '編成期間に入る');

  // run() は旧形式でも従来どおり開催できる(移行を共通関数に寄せた後も同じ)
  let L = entryWeekState(4105, ['org_s', 'org_a', 'org_b', 'player']);
  L = { ...L, week: SL.LEAGUE_WEEK, springTagLeague: legacyLeague(L) };
  const result = SL.run(L, Engine.rng.create(7));
  ok(!result.cancelled && result.teams.length === 8, '旧形式のまま週12を迎えても8チームで開催');
  ok(result.teams.filter(t => t.orgId === 'player').length === 1, '開催時の自団体は枠どおり1組');
})();

// ── D. 編成画面の選び直し ────────────────────────────────────────────────────
function extractFunction(source, name) {
  const token = `\nfunction ${name}(`;
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`${name} が見つからない`);
  const open = source.indexOf('{', source.indexOf(')', start));
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    if (depth === 0) return source.slice(start + 1, i + 1);
  }
  throw new Error(`${name} の終わりが見つからない`);
}
function extractMethod(source, name) {
  const token = `\n  ${name}(`;
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`${name} が見つからない`);
  if (source.indexOf(token, start + token.length) >= 0) throw new Error(`${name} が複数ある`);
  const open = source.indexOf('{', source.indexOf(')', start));
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    if (depth === 0) return source.slice(start + 3, i + 1);
  }
  throw new Error(`${name} の終わりが見つからない`);
}

(function entryModalRedo() {
  console.log('D. 編成画面の選び直し');
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  const uiSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8');
  const plays = [];
  const App = { _stlRerenderEntry() {} };
  const methods = new Function('App', 'Audio', `return { ${['stlPickFighter', 'stlUnpickFighter'].map(n => extractMethod(appSource, n)).join(',\n')} };`)(App, { play: k => plays.push(k) });
  Object.assign(App, methods);
  const pairsOf = () => App._stlEntrySelection.pairs.map(p => [p.f1Id, p.f2Id]);

  App._stlEntrySelection = { activeSlot: 0, pairs: [{ f1Id: 1, f2Id: 2 }, { f1Id: 3, f2Id: 4 }, { f1Id: null, f2Id: null }] };
  App.stlPickFighter(5);
  ok(JSON.stringify(pairsOf()[0]) === JSON.stringify([1, 5]), '2名そろっていても、別の選手を押せば2人目と入れ替わる');
  App.stlPickFighter(1);
  ok(JSON.stringify(pairsOf()[0]) === JSON.stringify([null, 5]), '選択中の選手をもう一度押すと外れる');
  App.stlPickFighter(3);
  ok(JSON.stringify(pairsOf()) === JSON.stringify([[3, 5], [null, 4], [null, null]]),
    '他の枠の選手を押すとこの枠へ移り、元の枠は1人になる(同じ選手が2枠に入らない)');
  App.stlUnpickFighter(5);
  ok(JSON.stringify(pairsOf()[0]) === JSON.stringify([3, null]), '下の帯の × で外せる');
  const all = pairsOf().flat().filter(id => id != null);
  ok(new Set(all).size === all.length, 'どの操作の後も同じ選手が2枠に入っていない');
  ok(!plays.includes('error'), '選び直しの操作でエラー音を鳴らさない');

  // 画面: 他枠の選手も押せる・× がある・保存できない理由が出る
  const src = ['_tagDiscordEffectText', '_stlDiscordWarnHtml', '_stlEntryModalHtml'].map(n => extractFunction(uiSource, n)).join('\n');
  let G = entryWeekState(4106, ['player', 'org_s', 'org_a', 'org_b']);
  const announced = SL.announce(G);
  G = { ...G, springTagLeague: { ...announced, announcedSeason: G.season } };
  const [a, b, c] = SL._eligible(G.roster);
  const i18n = { t: (text, params) => WM_I18N.t(text, params), pn: s => s };
  const stubs = { _mdlAHeader: () => '', escHtml: s => String(s), getUpperUrl: () => '', _stlFaceImg: () => '', _STL_STYLE_CREAM: {} };
  const render = sel => new Function('G', 'App', 'Engine', 'WM_I18N', ...Object.keys(stubs),
    `${src}\nreturn _stlEntryModalHtml();`)(G, { _stlEntrySelection: sel }, Engine, i18n, ...Object.values(stubs));
  ok(playerTeams(G).length === 3, '前提: 1位は3枠');
  const html = render({ activeSlot: 0, pairs: [{ f1Id: a.id, f2Id: null }, { f1Id: b.id, f2Id: c.id }, { f1Id: null, f2Id: null }] });
  const cardOf = id => {
    const at = html.indexOf(`App.stlPickFighter(${id})`);
    return at < 0 ? '' : html.slice(html.lastIndexOf('<div class="draft-fc', at), at);
  };
  ok(cardOf(b.id).includes('stl-is-elsewhere') && html.includes('第2代表から移す'), '他の枠の選手のカードも押せて「第2代表から移す」と出る');
  ok(!html.includes('stl-is-locked') && !html.includes('他枠で選出済み'), '押せないカード(旧: 他枠で選出済み)はもう無い');
  ok(html.includes(`App.stlUnpickFighter(${a.id})`), '下の帯に選んだ選手を外す × がある');
  ok(html.includes('第1代表があと1名です') && /<button class="btn btn-gold" disabled/.test(html), '1人だけの枠があると保存できず、理由を1行で出す');
  ok(html.includes('App.stlCloseEntryModal()') && html.includes('保存せずに閉じる'), '保存せずに閉じられる');
  ok(/stl-slot-tab[^"]*is-half[\s\S]{0,200}あと1名/.test(html), '1人だけの枠のタブは「あと1名」');
})();

if (failures) {
  console.error(`spring-tag-league-entry-redo-test: ${failures} failure(s)`);
  process.exit(1);
}
console.log('spring-tag-league-entry-redo-test: ok');
