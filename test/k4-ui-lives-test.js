'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-4 S6: UI の読み手(docs/fun-audit-v0.1/k4-separate-lives-design.md §3-B・§4)
//
//  ID 55 が2つの人生を持つ G(1番目: S1〜S6・AI団体で殿堂入り・天頂戦優勝・統一王座 /
//  2番目: S12デビューの自団体の現役・統一王座)で、UI の純粋関数が正しい人生を指すこと。
//  - findFighter / canOpenFighterPopup: lifeNo を渡すと別の人生の現役を返さない。前の人生は殿堂入り
//    していれば押せる(殿堂詳細)、していなければ押せない
//  - 記録タブの元データ: 2つの人生 → 2件(以前はIDで重複除去して現役だけ残し、前の人生の天頂戦優勝が消えた)
//  - 統一王座の歴代表: 履歴の lives で、それぞれの人生の元データを引く
//  - 在籍年(S3〜S9)は同じIDの別の人生が並ぶときだけ
//  - 新聞の名前: 前の人生の記事は、その人生の殿堂詳細へ(殿堂入りしていなければ押せない名前)
//  - 相関図: 転生した子と前の人生の相手の間に「過去の線」を引かない
//
//  WM_TEST_SRC_DIR で読み込む src を差し替えられる(変更前のコードで落ちることの確認用)。
// ══════════════════════════════════════════════════════════════════════════════
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
global.WM_I18N = { t(text, params) {
  if (typeof text !== 'string' || !params) return text;
  let out = text;
  Object.keys(params).forEach(k => { out = out.split('{' + k + '}').join(params[k]); });
  return out;
}, pn(s) { return s; }, pnSurname(s) { return s; }, mv(s) { return s; }, mvShort(s) { return s; } };

const srcDir = process.env.WM_TEST_SRC_DIR || path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js',
  'relationships.js', 'flag-dialogue.js', 'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

// UI の関数を本体から切り出してグローバルで評価する(DOM に触れる関数は使わない)
function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) return '';
  const open = source.indexOf('{', source.indexOf(')', start));
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') { depth--; if (depth === 0) return source.slice(start, i + 1); }
  }
  throw new Error(`extract ${name}`);
}
const uiCommon = fs.readFileSync(path.join(srcDir, 'ui-common.js'), 'utf8');
const uiRender = fs.readFileSync(path.join(srcDir, 'ui-render.js'), 'utf8');
const fromCommon = ['findFighter', '_findFighterAnyLife', '_pastLifeHofEntry', 'lifeYearsLabel', 'canOpenFighterPopup'];
const fromRender = ['_recordBookSources', '_recordBookLifeOf', '_recordBookYears', '_recordBookDupIds', '_recordBookYearsSuffix',
  '_recordBookOpen', '_recordBookOpenSource', '_recordBookUnifiedReigns', '_getHofOrgName', '_newsClickableName', '_newsLifeOf',
  '_npLifeClick', '_hofYearsLabel', '_hofSameLife', '_relmapPairKey', '_relmapBuildLinks'];
const code = [...fromCommon.map(n => extractFunction(uiCommon, n)), ...fromRender.map(n => extractFunction(uiRender, n))]
  .filter(Boolean).join('\n');
new vm.Script(code, { filename: 'k4-ui-extract.js' }).runInThisContext();

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log(`  ok  ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n${e.stack}`); process.exitCode = 1; }
}
const clone = v => JSON.parse(JSON.stringify(v));
const X = 55;
const Z = 77; // 前の人生が殿堂入りしていないID

function makeG() {
  let s = Engine.createInitialState(4747, true);
  const tmpl = clone(s.roster[0]);
  const me = { ...tmpl, id: X, name: '同名', lifeNo: 2, debutSeason: 12, careerStage: 'active', age: 24,
    careerRecord: { history: [{ type: 'debut', season: 12 }, { type: 'ppvTournament', season: 20, result: 'champion' }] } };
  const z2 = { ...tmpl, id: Z, name: 'ゼット', lifeNo: 2, debutSeason: 14, careerStage: 'active', age: 22,
    careerRecord: { history: [{ type: 'debut', season: 14 }] } };
  const hof1 = { id: X, name: '同名', lifeNo: 1, orgId: 'org_s', orgName: 'S', activeSeasonsStart: 1, activeSeasonsEnd: 6,
    activeYears: 'S1〜S6', inductionSeason: 6, hofLevel: 2, hofPoints: 30, titleReigns: 2, totalDefenses: 5,
    careerRecord: { history: [{ type: 'ppvTournament', season: 4, result: 'champion' }] } };
  const arch1 = { id: X, lifeNo: 1, name: '同名', careerSeasonsStart: 1, careerSeasonsEnd: 6, retiredSeason: 6,
    careerRecord: { history: [{ type: 'ppvTournament', season: 4, result: 'champion' }] } };
  const G = { ...s, season: 22, week: 5,
    roster: [...s.roster.filter(f => f.id !== X && f.id !== Z).slice(0, 5), me, z2],
    lifeSerial: { ...(s.lifeSerial || {}), [X]: 2, [Z]: 2 },
    allHallOfFame: { player: [], org_s: [hof1], org_a: [], org_b: [] }, hallOfFame: [],
    chronicle: { ...(s.chronicle || {}), fighterArchive: [arch1] },
    unifiedTitle: { championId: X, orgId: 'player', defenses: 1, history: [
      { type: 'creation', season: 3, week: 10, championId: X, orgId: 'org_s', lives: { [X]: 1 } },
      { type: 'vacate', season: 6, week: 40, championId: X, orgId: 'org_s', lives: { [X]: 1 } },
      { type: 'crown', season: 20, week: 10, championId: X, orgId: 'player', lives: { [X]: 2 } },
    ] },
    relationshipHistory: { betrayalRecord: [], retiredRivalries: [
      { id1: Z, id2: X, reason: 'lifeEnd', retiredFighterId: Z, lives: { [Z]: 1, [X]: 2 }, season: 13,
        h2h: { bySeason: { 12: 3 } } },
    ] },
  };
  Object.keys(G.aiOrgs || {}).forEach(o => { G.aiOrgs[o] = { ...G.aiOrgs[o], roster: (G.aiOrgs[o].roster || []).filter(f => f.id !== X && f.id !== Z) }; });
  G.freeAgents = (G.freeAgents || []).filter(f => f.id !== X && f.id !== Z);
  G.scoutCandidates = (G.scoutCandidates || []).filter(f => f.id !== X && f.id !== Z);
  G.retiredFighters = [];
  return G;
}

test('findFighter / canOpenFighterPopup: 別の人生の現役を返さない・前の人生は殿堂入りしていれば押せる', () => {
  global.G = makeG();
  assert.strictEqual(findFighter(X, null, 1), null, '1番目の人生の記録で2番目の現役を開かない');
  assert.strictEqual(findFighter(X, null, 2).debutSeason, 12);
  assert.strictEqual(findFighter(X).debutSeason, 12, 'lifeNo 省略は従来どおり');
  assert.strictEqual(canOpenFighterPopup(X, 1), true, '1番目の人生は殿堂入り → 殿堂詳細');
  assert.strictEqual(canOpenFighterPopup(Z, 1), false, '殿堂入りしていない前の人生は押せない');
  assert.strictEqual(canOpenFighterPopup(Z, 2), true);
});

test('記録タブの元データ: 2つの人生 → 2件(前の人生の天頂戦優勝が消えない)', () => {
  global.G = makeG();
  const sources = _recordBookSources().filter(s => s.fighter.id === X);
  assert.strictEqual(sources.length, 2, `2件: ${sources.map(s => s.key).join(',')}`);
  const keys = sources.map(s => s.key).sort();
  assert.deepStrictEqual(keys, [`${X}#1`, `${X}#2`]);
  const wins = sources.flatMap(s => ((s.fighter.careerRecord || {}).history || [])
    .filter(e => e.type === 'ppvTournament' && e.result === 'champion').map(e => e.season)).sort((a, b) => a - b);
  assert.deepStrictEqual(wins, [4, 20], '天頂戦優勝が両方の人生で残る');
  // 前の人生の元データを押すと、その人生の殿堂詳細(第4引数 1)
  const past = sources.find(s => s.lifeNo === 1);
  assert.ok(/showFighterPopup\(55,null,true,1\)/.test(_recordBookOpenSource(past)));
  // 在籍年は同じIDの別の人生が並ぶときだけ
  const dup = _recordBookDupIds(sources);
  assert.ok(dup.has(String(X)));
  assert.strictEqual(_recordBookYearsSuffix(past, dup), ' S1〜S6');
  assert.strictEqual(_recordBookYearsSuffix(sources.find(s => s.lifeNo === 2), dup), ' S12〜');
  assert.strictEqual(_recordBookYearsSuffix(past, new Set()), '', '1人しか並ばなければ添えない');
});

test('統一王座の歴代表: 履歴の lives で、それぞれの人生の元データを引く', () => {
  global.G = makeG();
  const reigns = _recordBookUnifiedReigns(_recordBookSources());
  assert.strictEqual(reigns.length, 2);
  assert.strictEqual(reigns[0].source && reigns[0].source.lifeNo, 1, '初代は1番目の人生');
  assert.strictEqual(reigns[1].source && reigns[1].source.lifeNo, 2, '在位中は2番目の人生');
  assert.strictEqual(reigns[1].active, true);
});

test('在籍年の表記: S3〜S9・現役は S3〜・始まりの分からない旧データは 〜S9', () => {
  assert.strictEqual(lifeYearsLabel(3, 9, false), 'S3〜S9');
  assert.strictEqual(lifeYearsLabel(3, null, true), 'S3〜');
  assert.strictEqual(lifeYearsLabel(null, 9, false), '〜S9');
  assert.strictEqual(_hofYearsLabel({ activeSeasonsStart: 1, activeSeasonsEnd: 9, startUnknown: true }), '〜S9');
  assert.strictEqual(_hofYearsLabel({ activeSeasonsStart: 3, activeSeasonsEnd: 9 }), 'S3〜S9');
  assert.strictEqual(_hofSameLife({ id: X, lifeNo: 1 }, { id: X, lifeNo: 2 }), false);
  assert.strictEqual(_hofSameLife({ id: X, lifeNo: 1 }, { id: X, lifeNo: 1 }), true);
});

test('新聞の名前: 前の人生の記事はその人生の殿堂詳細へ・殿堂入りしていなければ押せない名前', () => {
  global.G = makeG();
  assert.ok(/showFighterPopup\(55,null,true,1\)/.test(_newsClickableName('同名', X, 1)));
  assert.strictEqual(_newsClickableName('ゼット', Z, 1), 'ゼット', '押せない名前');
  assert.ok(/showFighterPopup\(55,null,true\)/.test(_newsClickableName('同名', X, 2)), '今の人生は従来どおり');
  assert.ok(/showFighterPopup\(55,null,true\)/.test(_newsClickableName('同名', X)), '番号の無い旧号は従来どおり');
  const story = { characterId: X, characterLives: { [X]: 1 } };
  assert.ok(/showFighterPopup\(55,null,true,1\)/.test(_npLifeClick(X, story, 'onclick="x"')));
  assert.strictEqual(_npLifeClick(Z, { characterId: Z, characterLives: { [Z]: 1 } }, 'onclick="x"'), '');
  assert.strictEqual(_npLifeClick(X, { characterId: X }, 'onclick="x"'), 'onclick="x"');
});

test('相関図: 転生した子と前の人生の相手の間に過去の線を引かない', () => {
  global.G = makeG();
  const chars = G.roster.filter(f => f.id === X || f.id === Z);
  const links = _relmapBuildLinks(chars);
  assert.ok(!links.some(l => (l.a === X && l.b === Z) || (l.a === Z && l.b === X)), 'Z の前の人生との過去の線が出ている');
  // 同じ人生どうしの退避(lives が今の人生と一致)は従来どおり過去の線
  global.G = { ...G, relationshipHistory: { betrayalRecord: [], retiredRivalries: [
    { id1: Z, id2: X, reason: 'retirement', retiredFighterId: Z, lives: { [Z]: 2, [X]: 2 }, season: 21 }] } };
  const links2 = _relmapBuildLinks(chars);
  assert.ok(links2.some(l => l.hasPast), '今の人生どうしの過去の線は出る');
});

console.log(`\nk4-ui-lives-test: ${passed} passed${process.exitCode ? ' (FAILURES)' : ''}`);
