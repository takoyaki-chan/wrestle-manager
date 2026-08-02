'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame, loadAsGlobal } = require('./helpers/load-game');

loadGame();

function fighter(id, ovr, extra = {}) {
  return {
    id, name: `F${id}`,
    pw: ovr, sp: ovr, te: ovr, st: ovr, mn: ovr,
    popularity: 40, age: 24, traits: [], injury: null,
    ...extra,
  };
}

(function testDepthRewardsCardReadySupportAndReserves() {
  const fullRoster = [90, 85, 80, 75, 75, 75, 75, 75, 70, 70, 70, 70]
    .map((ovr, index) => fighter(index + 1, ovr));
  const profile = Engine.ranking.getDepthProfile(fullRoster);
  assert.strictEqual(Math.round(profile.coreScore), 20, '4〜8番手が目標OVRなら主力層は満点');
  assert.strictEqual(Math.round(profile.reserveScore), 10, '9〜12番手が目標OVRなら控え層は満点');
  assert.strictEqual(Math.round(profile.score), 30, '層の厚みは30点を上限にする');
})();

(function testDepthDoesNotRewardStarOnlyOrUnavailableFighters() {
  const starOnly = [90, 85, 80].map((ovr, index) => fighter(index + 1, ovr));
  assert.strictEqual(Engine.ranking.getDepthProfile(starOnly).score, 0, '上位3人だけでは層の厚みを得ない');

  const healthy = [90, 85, 80, 75, 75, 75, 75, 75, 70, 70, 70, 70]
    .map((ovr, index) => fighter(index + 1, ovr));
  const injured = healthy.map(f => f.id === 4 ? { ...f, injury: { type: 'minor' } } : f);
  assert.ok(Engine.ranking.getDepthProfile(injured).score < Engine.ranking.getDepthProfile(healthy).score,
    '欠場中の主力は厚みとして数えない');
})();

(function testRankingUiReplacesAverageOvrWithDepth() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');
  const start = source.indexOf('function renderRanking()');
  const end = source.indexOf('\n// ', start + 1);
  const body = source.slice(start, end);
  assert.ok(!body.includes('平均OVR'), 'ランキング画面に平均OVRを表示しない');
  assert.ok(body.includes('層の厚み'), 'ランキング画面に層の厚みを表示する');
  assert.ok(body.includes('depthCore') && body.includes('depthReserve'), '主力層と控え層を説明する');
})();

(function testRankingV13BaselineSizes() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8').replace(/\r\n/g, '\n');
  const start = source.indexOf('#screen-ranking');
  const end = source.indexOf('/* ═════════', start + 1);
  const css = source.slice(start, end);
  [
    'font-size: 28px;', 'min-height: 400px;', 'min-height: 465px;',
    'height: 222px;', 'height: 252px;', 'width: 132px; height: 194px;',
    'width: 150px; height: 224px;', 'width: 116px; height: 174px;',
    'width: 92px; height: 138px;', 'width: 40px;', 'height: 40px;',
    'width: 62px; height: 62px;', 'grid-template-columns: 1fr 108px;',
    'font-size: 18px;', 'font-size: 15px;', 'font-size: 28px;', 'line-height: 1.7;',
  ].forEach(value => assert.ok(css.includes(value), `v1.3 CSSサイズ ${value} を適用する`));
  assert.ok(/\.orgcell-fcell\.pos-2\s*\{\s*left:\s*0;\s*width:\s*92px;\s*height:\s*138px;/.test(css),
    '2位以下の左後列がカード外側へ開かれていない');
  assert.ok(/\.orgcell-fcell\.pos-3\s*\{\s*right:\s*0;\s*width:\s*92px;\s*height:\s*138px;/.test(css),
    '2位以下の右後列がカード外側へ開かれていない');
  assert.ok(/\.orgcell:not\(\.is-rank-1\) \.orgcell-fcell img\s*\{[^}]*object-fit:\s*contain;/.test(css),
    '2位以下の人物画像が割当枠からはみ出す');
  assert.ok(!css.includes('.ovr-line'), '平均OVR専用のovr-line CSSを残さない');
})();

function loadRankingRenderer() {
  const inert = {
    appendChild() {}, style: {}, setAttribute() {},
    classList: { add() {}, remove() {}, toggle() {} },
    querySelectorAll() { return []; },
  };
  global.document = {
    addEventListener() {}, querySelectorAll() { return []; }, getElementById() { return null; },
    createElement() { return { ...inert }; }, head: inert, body: inert,
  };
  window.addEventListener = () => {};
  global.valueClassOvr = () => '';
  global.escHtml = (value) => String(value ?? '');
  global._orgPopColor = () => ({ color: '' });
  loadAsGlobal('ui-render.js');
}

function rankingEntry(orgId, rank, overrides = {}) {
  return {
    orgId, name: orgId, rank, rating: 100 - rank, baseScore: 70,
    depth: 12, depthCore: 8, depthReserve: 4, depthCoreReady: 2, depthReserveReady: 1,
    battlePt: 0, legacyScore: 0, achievementScore: 0, force: 30, marquee: 20,
    ...overrides,
  };
}

function renderRankingForTest(state, rankingOverrides = {}) {
  const elements = {};
  ['rankingContent', 'rankingMast', 'rankingVictoryBar'].forEach(id => {
    elements[id] = { id, innerHTML: '', outerHTML: '' };
  });
  global.document.getElementById = (id) => elements[id] || null;
  const rankings = [
    rankingEntry('player', 1, rankingOverrides.player),
    rankingEntry('org_s', 2, rankingOverrides.org_s),
    rankingEntry('org_a', 3, rankingOverrides.org_a),
    rankingEntry('org_b', 4, rankingOverrides.org_b),
  ];
  global.G = state;
  Engine.ranking.updateRankings = () => rankings;
  renderRanking();
  return elements.rankingContent.innerHTML;
}

function rankingState(roster, title = { championId: 1, defenses: 4 }) {
  const aiRoster = [fighter(21, 84, { name: 'AI王者', surname: 'AI王' }), fighter(22, 74, { name: 'AI次点', surname: 'AI次' }), fighter(23, 70, { name: 'AI三番', surname: 'AI三' }), fighter(24, 66, { name: 'AI四番', surname: 'AI四' })];
  const aiOrg = () => ({ roster: aiRoster, titles: { world: { championId: 21, defenses: 0 } }, orgPop: 50 });
  return {
    season: 3, week: 12, orgName: 'テスト団体', orgPop: 50, roster,
    titles: { world: title },
    aiOrgs: { org_s: aiOrg(), org_a: aiOrg(), org_b: aiOrg() },
  };
}

loadRankingRenderer();

(function testRankingCopiesBindNumbersAndNamesToGameState() {
  const roster = [
    fighter(1, 90, { name: '王者花子', surname: '王者', age: 25 }),
    fighter(2, 80, { name: '次郎美咲', surname: '次郎' }),
    fighter(3, 75, { name: '三枝凛', surname: '三枝' }),
    fighter(4, 70, { name: '四谷葵', surname: '四谷' }),
  ];
  const html = renderRankingForTest(rankingState(roster), { player: { depthCoreReady: 2 } });
  const aceCopy = html.match(/<strong>王者花子[^<]*<\/strong>\s*<p>([^<]+)<\/p>/);
  assert.ok(aceCopy && aceCopy[1].includes('4'), '防衛数は合成GameStateの値をエース文へ差し込む');
  assert.ok(html.includes('次郎・三枝'), '主力文は合成GameStateの二番手・三番手の姓を使う');
  assert.ok(aceCopy && !/主力|控え|戦列/.test(aceCopy[1]), 'エース文はチーム語りを混ぜない');
})();

(function testRankingCopyFallbacksAndDepthInjury() {
  const boardRoster = [fighter(1, 90, { name: '看板花子', surname: '看板' }), fighter(2, 74, { name: '次郎美咲', surname: '次郎' }), fighter(3, 70, { name: '三枝凛', surname: '三枝' }), fighter(4, 66, { name: '四谷葵', surname: '四谷' })];
  const boardHtml = renderRankingForTest(rankingState(boardRoster, { championId: null, defenses: 0 }));
  assert.ok(boardHtml.includes('この団体の顔は間違いなく彼女だ'), '王者不在では看板系の文へフォールバックする');

  const injuredRoster = [
    fighter(1, 90, { name: '王者花子', surname: '王者' }),
    fighter(2, 80, { name: '次郎美咲', surname: '次郎' }),
    fighter(3, 75, { name: '三枝凛', surname: '三枝' }),
    fighter(4, 70, { name: '四谷葵', surname: '四谷', injury: { type: 'minor' } }),
    fighter(5, 68, { name: '五島結', surname: '五島', injury: { type: 'minor' } }),
  ];
  const injuryHtml = renderRankingForTest(rankingState(injuredRoster), { player: { depthCoreReady: 2 } });
  assert.ok(injuryHtml.includes('2人が欠場中'), '欠場数は合成GameStateの値を主力文へ差し込む');

  const vacantHtml = renderRankingForTest(rankingState([], { championId: null, defenses: 0 }));
  assert.ok(!/undefined|NaN|\{[^}]+\}/.test(vacantHtml), '王者・看板不在でも未展開値を表示しない');
})();

(function testDepthNoteClaimsMatchVisibleRoster() {
  // 2026-07-31 Keisuke指摘の再発防止: 講評の数字・名指しは「表示と同じ母集団
  // (2番手以下・怪我込み)」から数える。内部スロット値(4〜8番手・怪我除外)は文章に使わない。

  // 上位偏重: 2・3番手が90台、4番手以降が60台。旧実装は4〜8番手スロットだけを数えて
  // 「実戦級0人」と顔ぶれ(90台が並ぶ)に反する文を出していた。
  const topHeavy = [
    fighter(1, 95, { name: '王者花子', surname: '王者' }),
    fighter(2, 92, { name: '二戸美咲', surname: '二戸' }),
    fighter(3, 90, { name: '三枝凛', surname: '三枝' }),
    fighter(4, 62, { name: '四谷葵', surname: '四谷' }),
    fighter(5, 60, { name: '五島結', surname: '五島' }),
  ];
  const topHtml = renderRankingForTest(rankingState(topHeavy));
  assert.ok(topHtml.includes('二戸・三枝が主力の軸'), '名指しは2番手・3番手の実名');
  assert.ok(topHtml.includes('2番手以下のOVR70以上は2人'), '実戦級カウントは顔ぶれ(92/90)と一致する');
  assert.ok(!topHtml.includes('王者の後ろが続かない') && !topHtml.includes('二戸の後ろが続かない'),
    '上位が厚い団体を薄い扱いしない');

  // 薄い: 2番手以下でOVR70以上が1人だけ → 名指しで検証可能な形になる
  const thin = [
    fighter(1, 88, { name: '王者花子', surname: '王者' }),
    fighter(2, 76, { name: '次郎美咲', surname: '次郎' }),
    fighter(3, 64, { name: '三枝凛', surname: '三枝' }),
    fighter(4, 60, { name: '四谷葵', surname: '四谷' }),
  ];
  const thinHtml = renderRankingForTest(rankingState(thin));
  assert.ok(thinHtml.includes('次郎の後ろが続かない'), '薄い判定はOVR70以上=1人のときだけ');
  assert.ok(thinHtml.includes('OVR70以上は次郎だけ'), '薄い文は名指しで顔ぶれと突き合わせられる');
})();

(function testRankingCopiesStaySafeAcrossRepresentativeSeasons() {
  const roster = [fighter(1, 90, { name: '王者花子', surname: '王者' }), fighter(2, 80, { name: '次郎美咲', surname: '次郎' }), fighter(3, 75, { name: '三枝凛', surname: '三枝' }), fighter(4, 70, { name: '四谷葵', surname: '四谷' })];
  [1, 5, 12].forEach(season => {
    const state = rankingState(roster);
    state.season = season;
    const html = renderRankingForTest(state);
    assert.ok(!/undefined|NaN|\{[^}]+\}/.test(html), `シーズン${season}の全団体講評に未展開値がない`);
  });
})();

console.log('ranking-depth-redesign-test: PASS');
