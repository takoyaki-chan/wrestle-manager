// ppv-org-name-resolution-test.js
//
// 新聞（週刊グラップル）のPPV記事に、団体バッジは正しい団体名を出しているのに
// 記事テキスト側だけ「他団体」という内部フォールバック文字列が出ていたバグの回帰テスト。
//
// 根本原因: state.aiOrgs[orgId] には .name フィールドが無い(実名は
// state.rivalOrgNames / RIVAL_ORGS[].name 側にしかない)。にもかかわらず
// 新聞生成側の orgNameOf/orgNameOfU が state.aiOrgs?.[orgId]?.name を直接引いて
// いたため、'player' も含めどの orgId でも解決に失敗し、常に「他団体」に落ちて
// いた（Engine.ppv.simulateTVResults 内、management.js）。同じ壊れ方の閉包が
// app.js のアンダーカード集計にもあった（フォールバックは「相手団体」）。
//
// ここで固定するのは:
//   1. Engine.ppv.simulateTVResults が実際に実団体名を返すこと(バッジ側と同じ
//      state.rivalOrgNames / RIVAL_ORGS[].name の優先順位で解決していること)
//   2. その結果を Engine.newspaper.generate に渡した記事本文に「他団体」が
//      出ないこと(実際に紙面へ出るところまで確認する)
//   3. 頂上決戦見出しの「勝者の団体」が実際に勝った側の団体になること
//      (playerInvolved:false のとき常に左側の団体を出していた副作用バグも併せて修正)
//   4. 所属が本当に解決できないケースは「他団体」に落とさず、括弧・「の」ごと
//      所属句を省いた文型になること(無言フォールバックの禁止)
//   5. 壊れていた参照パターンが management.js に再混入していないこと(静的ガード)

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); }
}

console.log('=== PPV新聞記事の団体名解決(他団体フォールバック回帰) ===\n');

function makeState(seed) {
  let G = Engine.createInitialState(seed, true);
  // サミット(頂上決戦)を org_s(1位) vs org_a(2位) に固定する。
  G = {
    ...G,
    rankings: [
      { orgId: 'org_s', rank: 1 },
      { orgId: 'org_a', rank: 2 },
      { orgId: 'org_b', rank: 3 },
    ],
    relationships: G.relationships || {},
  };
  return G;
}

section('1. state.aiOrgs[orgId] には .name が無い(前提の確認)', () => {
  const G = makeState(1);
  assert.ok(G.aiOrgs && G.aiOrgs.org_s, 'aiOrgs.org_s が無い');
  assert.strictEqual('name' in G.aiOrgs.org_s, false,
    '前提が崩れている: aiOrgs[orgId].name が存在するようになった場合、このテストの意義が変わるので確認して');
  assert.ok(G.rivalOrgNames && G.rivalOrgNames.org_s, '実名は rivalOrgNames 側にあるはず');
});

section('2. simulateTVResults が実団体名を返す(サミット/アンダーカード)', () => {
  const G = makeState(20260801);
  const rng = Engine.rng.create(20260801 ^ 0xABCDEF);
  const result = Engine.ppv.simulateTVResults(G, rng);

  assert.ok(result.newsSummitResult, 'newsSummitResult が生成されていない(セットアップ要確認)');
  const sr = result.newsSummitResult;
  assert.strictEqual(sr.playerOrgName, G.rivalOrgNames.org_s, 'サミット1位側の団体名が rivalOrgNames と一致しない');
  assert.strictEqual(sr.aiOrgName, G.rivalOrgNames.org_a, 'サミット2位側の団体名が rivalOrgNames と一致しない');
  assert.notStrictEqual(sr.playerOrgName, '他団体', 'サミット1位側が「他団体」に落ちている');
  assert.notStrictEqual(sr.aiOrgName, '他団体', 'サミット2位側が「他団体」に落ちている');

  assert.ok(result.newsPpvUndercards.length > 0, 'アンダーカードが1件も無い(セットアップ要確認)');
  result.newsPpvUndercards.forEach(uc => {
    assert.notStrictEqual(uc.winnerOrgName, '他団体', `アンダーカード勝者側が「他団体」: ${uc.winnerName}`);
    assert.notStrictEqual(uc.loserOrgName, '他団体', `アンダーカード敗者側が「他団体」: ${uc.loserName}`);
    assert.ok(uc.winnerOrgName, `アンダーカード勝者の団体名が空: ${uc.winnerName}`);
    assert.ok(uc.loserOrgName, `アンダーカード敗者の団体名が空: ${uc.loserName}`);
  });
});

section('3. 実際に紙面(Engine.newspaper.generate)まで「他団体」が出ない', () => {
  const G = makeState(7);
  const rng = Engine.rng.create(7 ^ 0xABCDEF);
  const result = Engine.ppv.simulateTVResults(G, rng);
  const G2 = { ...G, _newsSummitResult: result.newsSummitResult, _newsPpvUndercards: result.newsPpvUndercards };
  const wp = Engine.newspaper.generate(G2);
  const stories = [wp.topStory, ...(wp.subStories || [])].filter(Boolean);
  const ppvStories = stories.filter(s => s.type === 'ppvSummitResult' || s.type === 'ppvUndercard' || s.type === 'ppvUndercardTitle');
  assert.ok(ppvStories.length > 0, 'PPV記事が1本も生成されていない(セットアップ要確認)');
  ppvStories.forEach(s => {
    assert.ok(!/他団体/.test(s.headline), `見出しに「他団体」が残っている: ${s.headline}`);
    assert.ok(!/他団体/.test(s.body), `本文に「他団体」が残っている: ${s.body}`);
  });
  // バッジ相当(rivalOrgNames由来の実名)が実際に本文へ入っていることも確認する
  const summitStory = stories.find(s => s.type === 'ppvSummitResult');
  if (summitStory) {
    const orgNames = Object.values(G.rivalOrgNames);
    assert.ok(orgNames.some(n => summitStory.body.includes(n)), '頂上決戦本文に実団体名が1つも入っていない');
  }
});

section('4. 頂上決戦見出しは「実際に勝った側」の団体を出す(左右どちらでも)', () => {
  const P = Engine.newspaper.PRIORITY;
  const base = {
    playerInvolved: false,
    playerName: 'A選手', playerId: 1, playerOrgName: '凰翔プロレス',
    aiName: 'B選手', aiId: 2, aiOrgName: 'ノヴァインパクト',
    mq: 55, finType: 'ピン', finMove: 'ラリアット', finishPhase: 'Heat', turns: 20,
    priorH2h: null, winnerLine: null,
  };
  // 左側(A選手/凰翔プロレス)が圧勝
  const leftWin = { ...base, won: false, winnerName: 'A選手', winnerId: 1, loserName: 'B選手', loserId: 2,
    winnerHpFinal: 400, winnerHpMax: 500, loserHpFinal: 20, loserHpMax: 500 };
  const s1 = _buildPpvSummitStory(leftWin, 1, 48, P);
  assert.ok(s1.headline.includes('凰翔プロレス'), `左側勝利なのに見出しの団体が違う: ${s1.headline}`);
  assert.ok(!s1.headline.includes('ノヴァインパクト'), `左側勝利なのに敗者側の団体が出ている: ${s1.headline}`);

  // 右側(B選手/ノヴァインパクト)が圧勝 — 修正前は常に左側(凰翔プロレス)が出ていた
  const rightWin = { ...base, won: false, winnerName: 'B選手', winnerId: 2, loserName: 'A選手', loserId: 1,
    winnerHpFinal: 400, winnerHpMax: 500, loserHpFinal: 20, loserHpMax: 500 };
  const s2 = _buildPpvSummitStory(rightWin, 1, 48, P);
  assert.ok(s2.headline.includes('ノヴァインパクト'), `右側勝利なのに見出しの団体が違う: ${s2.headline}`);
  assert.ok(!s2.headline.includes('凰翔プロレス'), `右側勝利なのに敗者側の団体が出ている: ${s2.headline}`);
});

section('5. 所属が解決できない場合は「他団体」に落とさず、所属句ごと省く', () => {
  const P = Engine.newspaper.PRIORITY;
  const sr = {
    playerInvolved: false,
    playerName: 'A選手', playerId: 1, playerOrgName: '',
    aiName: 'B選手', aiId: 2, aiOrgName: '',
    won: false, winnerName: 'B選手', winnerId: 2, loserName: 'A選手', loserId: 1,
    mq: 55, finType: 'ピン', finMove: 'ラリアット', finishPhase: 'Heat', turns: 20,
    winnerHpFinal: 400, winnerHpMax: 500, loserHpFinal: 20, loserHpMax: 500,
    playerRank: 1, aiRank: 2, priorH2h: null, winnerLine: null,
  };
  const story = _buildPpvSummitStory(sr, 1, 48, P);
  assert.ok(!/他団体/.test(story.headline + story.body), '解決不能時に「他団体」を出している');
  assert.ok(!/（）/.test(story.body), '所属不明なのに空の丸括弧が残っている');
  assert.ok(story.headline.includes('B選手') && story.body.includes('A選手'), '所属を省いた結果、選手名まで消えている');

  const uc = { winnerName: 'X選手', winnerId: 3, winnerOrgName: '', loserName: 'Y選手', loserId: 4, loserOrgName: '',
    mq: 40, finType: 'ピン', finMove: 'ラリアット', turns: 15, isTitleMatch: false };
  const G = { ...makeState(3), _newsSummitResult: null, _newsPpvUndercards: [uc] };
  const wp = Engine.newspaper.generate(G);
  const stories = [wp.topStory, ...(wp.subStories || [])].filter(Boolean);
  const ucStory = stories.find(s => s.type === 'ppvUndercard' && s.characterId === 3);
  assert.ok(ucStory, 'アンダーカード記事が生成されていない');
  assert.ok(!/他団体/.test(ucStory.headline + ucStory.body), 'アンダーカードで所属不明時に「他団体」を出している');
  assert.ok(!/（）/.test(ucStory.body), 'アンダーカードで空の丸括弧が残っている');
  assert.ok(!ucStory.headline.startsWith('の'), '所属句を省いた結果、見出し先頭に「の」が残っている');
});

section('6. 壊れた参照パターンが management.js に再混入していない(静的ガード)', () => {
  const mg = fs.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8');
  const badPattern = /aiOrgs\?\.\[orgId\]\?\.name/;
  // コメント中の解説文(このバグの説明)は対象外にし、実コードにだけ残っていないか見る
  const offenders = mg.split('\n').filter(line => {
    const codePart = line.split('//')[0];
    return badPattern.test(codePart);
  });
  assert.strictEqual(offenders.length, 0,
    'state.aiOrgs?.[orgId]?.name という解決できない参照パターンが実コードに復活している: ' + offenders.join(' | '));
});

section('7. Engine.contract._getOrgName は rivalOrgNames を優先して実名を返す(app.js側の修正が使う経路)', () => {
  const G = makeState(99);
  const realName = Engine.contract._getOrgName('org_s', G);
  assert.strictEqual(realName, G.rivalOrgNames.org_s, 'rivalOrgNames を優先していない');
  assert.notStrictEqual(realName, '他団体', 'Engine.contract._getOrgName が「他団体」を返している');
});

console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILED'}`);
process.exit(failed === 0 ? 0 : 1);
