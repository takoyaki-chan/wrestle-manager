'use strict';

// U5「勝敗・スコアの見せ方」統一作業に入る前の安全網。
//
// 全数調査で31箇所の勝敗・スコア表示が見つかったが、勝ち/負け/引き分けの3状態を
// 検証しているテストは1本だけだった。特にスコアが直接絡む3箇所(挑戦試合のスコア/
// リーグの勝ち点/対抗戦のスコア)は回帰テスト無しで触ると数字がずれても気づけない。
//
// 方針(test/README.md, u3-group-a/b・u6を踏襲): ソース文字列一致ではなく実関数を
// new Function で取り出して最小スタブ上で実行し、「壊れたら困る」不変条件だけを検査する。
//   1. 描画関数が例外を投げずにHTMLを生成する
//   2. 勝ち・負け・引き分けの3状態がそれぞれ出力から判別できる(記号/クラス名/テキストいずれでもよい。
//      表現方法そのものは固定しない。現在○=勝ちの箇所も●=勝ちの箇所も統一作業でわざと変わる)
//   3. スコアの数値が正しく出力に含まれる。特に左右の取り違えが起きていないこと
//   4. 勝ち点・順位の計算結果が出力に反映される
//   5. 0勝0敗0分・全勝・全敗などの端のケースで落ちない
//   6. 引き分けを含むデータで落ちない
//   7. HTMLエスケープが効いている(効いていない箇所は既知の欠落として[known gap]で報告するのみに留め、
//      正として固定しない。効いている箇所はそのまま回帰対象として固定してよい)
//
// 対象(優先順): 詳細は各セクションのコメントを参照。
//   1. showChallengeRequestResultModal — 挑戦試合3試合シリーズの各試合印+合計スコア
//   2. renderSpringTagLeagueBoard / _stlComputeStandingsThrough — リーグ順位表と勝ち点
//   3. _agwFocusHtml / renderAutumnWarResult — 秋4団体対抗戦の団体戦スコア・決勝結果
//   4. renderWarFinalResult — War対抗戦シリーズ通算の勝ち越し/引き分け/負け越し
//   5. _renderB3MatchResult / _renderB2MatchResult — 挑戦状/派閥内対決の試合結果
//   6. _buildB2Step3 / _buildB3Step3 — 派閥内対決/挑戦状の結果コマ(勝敗コマ)
//   7. _npRenderDigest — 新聞ダイジェスト表の勝敗印
//   8. _npRenderPlayerShow — 新聞見出し試合の勝敗印
//   9. _npRenderPage2(過去対戦成績) / _npComputeWarRecord — 団体別の通算戦績
//   10. 選手ポップアップの通算・直近5戦 — 対象外(理由は末尾コメント参照)
//   11. ロースター一覧カードの通算(_renderRosterDetailPanel)
//
// 重要な既知の欠落・不審点(このテストを書く過程で発見。直さず報告する。詳細は各セクション内のコメント):
//   a. [U5で修正済み] showChallengeRequestResultModal: 旧実装は自陣/相手陣リアクション(顔+セリフ)
//      だけescHtml済みで、試合ごとの行(crrm-name)・スコアバナー/coachLineの団体名
//      (reqName/oppName/ourOrg/otherOrgName)は生のまま差し込まれていた(同一画面内で不統一)。
//      U5で表示用に*Safe変数(reqNameSafe等)を追加しescHtml()を通すよう修正。ただし生の
//      reqName/ourOrg/otherOrgNameは_awOrgEmblem()の団体名完全一致検索にも使われているため、
//      その変数自体は書き換えずそのまま残した(セクション1eで回帰テスト化)。
//   b. renderWarFinalResult: 個々の試合行は winnerIsDraw を常に false 固定で _pbResultColumn に渡す。
//      U5で調査確定: match-engine.js の simulateMatch は singles で winner:'draw'(時間切れ引き分け)を
//      実際に返し得る。App.warWatchMatch/warSkipMatch/warSkipAll(app.js)と Engine.event.resolveWar
//      (management.js)はこの結果を `{...r, playerWon: (winner==='left')}` の形で results[] に積むため、
//      raw な winner フィールド自体は renderWarFinalResult まで残っている(表示だけなら draw を復元できる)。
//      ただし同じ playerWon 判定が「シリーズ通算スコア」の集計(app.js: `if (r.playerWon) playerWins++;
//      else aiWins++;`)にも使われており、drawになった試合はそこで無条件にAI側の勝ち数へ算入されている。
//      そのため試合行だけ draw 表示に直しても、直上のスコアバナー(playerWins-aiWins)とは整合しない
//      (例: 1勝1分1敗のはずが「1-2」と表示される)。見せ方だけの修正では片手落ちになるため、
//      U5では見送り、実装しないまま報告する(スコア集計側の修正はapp.js/management.jsの勝敗判定ロジック
//      そのものに手を入れる話で、UI統一の範囲を超える)。
//   c. [U5で修正済み] renderWarFinalResult / _renderB3MatchResult / _renderB2MatchResult: winnerLabel
//      文字列はescHtml(fighter.name)で組み立てていたが、_pbFighterBlock内の選手名リンク(fLink経由)は
//      c.nameを生のまま差し込んでいた(非対称)。U5で共有ヘルパーfLink()自体にescHtml()を組み込んで
//      修正(セクション4d/5dで回帰テスト化。fLinkは他7箇所からも呼ばれる共有部品のため、そちらにも
//      副次的に効く)。
//   d. [U5で修正済み] _buildB2Step3 / _buildB3Step3: 旧実装は escHtml() を一度も呼ばず選手名・
//      相手名が生のまま出力されていた。U5で escHtml() を通すよう修正(セクション6dで回帰テスト化)。
//   e. [U5で修正済み] _npRenderDigest / _npRenderPlayerShow / _npRenderPage2: 旧実装はいずれも
//      escHtml()を一度も呼ばず選手名・団体名が生のまま新聞紙面に差し込まれていた。U5でescHtml()を
//      通すよう修正(セクション7c/8c/9cで回帰テスト化)。_npRenderPage2は関数内でd.playerName/
//      d.rivalNameをescHtml済みの値へ上書きする方式(dはこの関数呼び出し専用の新規オブジェクトなので
//      安全)。共有ヘルパー_npClickNameも内部でescHtml化(他4箇所の呼び出し元にも波及する副次的な修正)。
//   f. [U5で修正済み] renderSpringTagLeagueBoard の直近試合ストリップ(_stlLastMatchStripHtml)は
//      旧実装では勝者側にのみ「WIN」タグを出し、引き分け時はどちらの陣営にも is-win/is-lose/明示
//      テキストが一切付かず「両者ともWINタグが無い」という消去法でしか判別できなかった。
//      U5で is-draw クラス + 「△ DRAW」タグ(draw-tag)を両陣営に明示するよう修正。以下のセクション
//      2c で回帰テストとして固定する(もう known gap ではない)。
//   g. [U5で修正済み] _renderRosterDetailPanel(ロースター一覧カードの通算): 旧実装はescHtml()を
//      一度も呼ばず選手名がrd-portrait-name等に生のまま差し込まれていた。U5でescHtml()を通すよう
//      修正(セクション11cで回帰テスト化)。同関数内の担当コーチ名(coach.name)は選手名ではなく、
//      固定35名の既存データのみが入るため対象外(未修正のまま)。
//
// ===========================================================================

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const uiRender = readSource('src', 'ui-render.js');
const cssIndex = readSource('src', 'index.html');

function makeFnReader(src, label) {
  return function functionSource(name) {
    const start = src.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `${name} not found in ${label}`);
    // パラメータリストの閉じ括弧を括弧の深さで正しく見つける(例: fLink(c, opts = {}) のように
    // デフォルト引数に{}を含む関数だと、単純な最初の'{'探索だとその{}を本体の開始と誤認する)。
    const openParen = src.indexOf('(', start);
    let pdepth = 0;
    let closeParen = -1;
    for (let i = openParen; i < src.length; i++) {
      if (src[i] === '(') pdepth++;
      else if (src[i] === ')') { pdepth--; if (pdepth === 0) { closeParen = i; break; } }
    }
    assert.ok(closeParen >= 0, `${name}: parameter list end not found in ${label}`);
    const brace = src.indexOf('{', closeParen);
    let depth = 0;
    for (let i = brace; i < src.length; i++) {
      if (src[i] === '{') depth++;
      if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
    }
    throw new Error(`${name} end not found in ${label}`);
  };
}

const uiFn = makeFnReader(ui, 'ui-common.js');
const uiRenderFn = makeFnReader(uiRender, 'ui-render.js');

// ---------------------------------------------------------------------------
// CSS存在確認(この回で扱うクラスが実際に定義されていること)
// ---------------------------------------------------------------------------
[
  'crrm-win', 'crrm-loss', 'stl-league-table', 'agw-focus-score',
  'pb-result-winner', 'mdl-a-result-verdict', 'np-digest-mark', 'np-winner-mark',
].forEach(cls => {
  const found = cssIndex.includes(`.${cls}`) || ui.includes(`.${cls}`) || uiRender.includes(`.${cls}`);
  assert.ok(found, `.${cls}がindex.html/ui-common.js/ui-render.jsのいずれかに存在する`);
});

let sectionsRun = 0;
function section(name, fn) {
  fn();
  sectionsRun++;
  console.log(`  [ok] ${name}`);
}

const KNOWN_GAPS = [];
function logGap(msg) {
  KNOWN_GAPS.push(msg);
  console.log(`    [known gap] ${msg}`);
}

// ===========================================================================
// 1. showChallengeRequestResultModal — 挑戦試合3試合シリーズの各試合印+合計スコア
//    (ui-common.js, showChallengeRequestResultModal)
// ===========================================================================
(function challengeRequestResultSuite() {
  const build = new Function(
    'Engine', 'document', 'getUpperUrl', 'getCoachPortraitUrl', 'RIVAL_ORGS', 'G',
    `let _popupQueue = [];
     const _POPUP_OVERLAY_IDS = [];
     ${uiFn('escHtml')}
     ${uiFn('_isPopupActive')}
     ${uiFn('_factionUpperUrl')}
     ${uiFn('_factionEnsureOverlayRoot')}
     ${uiFn('_factionPickReporter')}
     ${uiFn('_factionReporterStrip')}
     ${uiFn('_factionSeasonLabel')}
     ${uiFn('orgIconHtml')}
     ${uiFn('_awOrgEmblem')}
     ${uiFn('_challengeRequestOpponentReaction')}
     ${uiFn('_challengeRequestResultReaction')}
     ${uiFn('showChallengeRequestResultModal')}
     return { showChallengeRequestResultModal };`
  );

  function makeDom() {
    let root = null;
    function makeEl() {
      return {
        innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, contains() { return false; } },
        appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
      };
    }
    const doc = {
      getElementById(id) { return (root && id === 'factionEventRoot') ? root : null; },
      createElement() { return makeEl(); },
      body: { appendChild(el) { root = el; } },
      querySelector() { return null; },
      querySelectorAll() { return []; },
    };
    return { doc, getRoot: () => root };
  }

  function makeEngine(overrides) {
    return Object.assign({
      rng: {
        derive: (...args) => args.reduce((a, b) => (a * 31 + (Number(b) || 0)) >>> 0, 7),
        create: (seed) => ({ seed: seed || 0 }),
        int: (rng, lo) => lo,
      },
      challengeRequest: {
        pickLine: (fighter, scene) => `PICKLINE_${fighter.id}_${scene}`,
      },
      util: {
        getPlayerOrgIconPath: () => 'image/org/org-player-0.png',
        getOrgIconPath: (state, orgId) => (orgId === 'org_a' ? 'image/org/org-a-0.png' : ''),
      },
    }, overrides || {});
  }

  function makeBundle(opts) {
    opts = opts || {};
    const { doc, getRoot } = makeDom();
    const EngineStub = opts.Engine || makeEngine();
    const getUpperUrlStub = opts.getUpperUrl || ((id) => `image/upper/${id}.webp`);
    const getCoachPortraitUrlStub = () => '';
    const RIVAL_ORGS_STUB = opts.RIVAL_ORGS || [{ id: 'org_a', name: 'ライバル団体' }];
    const GStub = opts.G || {};
    const built = build(EngineStub, doc, getUpperUrlStub, getCoachPortraitUrlStub, RIVAL_ORGS_STUB, GStub);
    return { built, getRoot };
  }

  function baseCard(overrides) {
    return Object.assign({
      teamA: [{ id: 1, name: '風間サキ' }],
      teamB: [{ id: 2, name: '結城ミナ' }],
      isInverse: false,
      otherOrgName: 'ライバル団体',
      __deferredRender: true, // 実コードの650ms遅延タイマーをバイパスして同期描画させる
    }, overrides || {});
  }

  function baseMatches() {
    return [
      { winner: 'left', fighterA: { id: 1, name: 'ハルカ' }, fighterB: { id: 9, name: 'ソラ' }, mq: 70, finMove: '技1' },
      { winner: 'right', fighterA: { id: 3, name: 'ツキノ' }, fighterB: { id: 10, name: 'アカリ' }, mq: 65, finMove: '技2' },
      { winner: 'draw', fighterA: { id: 5, name: 'レンカ' }, fighterB: { id: 11, name: 'ミオ' }, mq: 60 },
    ];
  }

  // --- 1a. 例外を投げない + スコアが正しい位置に出る(不変条件1, 3) ---
  section('crrm: renders without throwing and the score digits land on the correct side', () => {
    const { built, getRoot } = makeBundle({});
    const card = baseCard({});
    const result = { teamWin: 'A', winsA: 2, winsB: 1, matches: baseMatches() };
    const state = { orgName: 'プレイヤー団体', season: 2, week: 5, rngSeed: 1 };
    assert.doesNotThrow(() => built.showChallengeRequestResultModal(card, result, state, () => {}),
      '例外を投げない(不変条件1)');
    const html = getRoot().innerHTML;
    // playerWon(forward, teamWin==='A') なので playerScore=winsA=2, aiScore=winsB=1
    // U5でスコア区切りをemダッシュ「—」に統一(旧: ハイフン)。左右の数値順が正しいことが本質の不変条件。
    assert.ok(/crrm-score-num[^>]*>\s*2\s*—\s*1\s*</.test(html), 'スコアが「2 — 1」の順で出る。左=自陣勝ち数、右=相手陣勝ち数の取り違えが無い(不変条件3)');
  });

  // --- 1b. inverse(他団体からの逆打診)でもプレイヤー側スコアが左に来る(左右取り違えチェック) ---
  section('crrm: inverse case still puts the player-side score on the left (no left/right swap)', () => {
    const { built, getRoot } = makeBundle({});
    const card = baseCard({ isInverse: true, requesterOrgName: 'ライバル団体', otherOrgName: 'ライバル団体' });
    // inverse: playerWon <=> teamWin==='B'。 playerScore=winsB, aiScore=winsA
    const result = { teamWin: 'B', winsA: 1, winsB: 3, matches: baseMatches() };
    const state = { orgName: 'プレイヤー団体', season: 2, week: 5, rngSeed: 1 };
    built.showChallengeRequestResultModal(card, result, state, () => {});
    const html = getRoot().innerHTML;
    assert.ok(/crrm-score-num[^>]*>\s*3\s*—\s*1\s*</.test(html),
      'inverseでも自陣(プレイヤー)勝ち数が左に出る。isInverseでplayerScore/aiScoreの取り違えが無い(不変条件3)');
  });

  // --- 1c. 各試合行で勝ち・負けの2状態がクラスで判別できる(不変条件2)。引き分け行は無印(2026-07-26) ---
  section('crrm: win/loss are distinguishable per match row via crrm-win/crrm-loss classes; a draw row carries neither', () => {
    const { built, getRoot } = makeBundle({});
    const card = baseCard({});
    const result = { teamWin: 'A', winsA: 2, winsB: 0, matches: baseMatches() };
    const state = { orgName: 'プレイヤー団体', season: 2, week: 5, rngSeed: 1 };
    built.showChallengeRequestResultModal(card, result, state, () => {});
    const html = getRoot().innerHTML;
    const rows = html.split('<div class="crrm-row">').slice(1); // 各要素が1行分のHTMLを完全に含む
    assert.strictEqual(rows.length, 3, '3試合分の行が出る');
    // m0: winner:'left' → ハルカ(fighterA)側にcrrm-win、ソラ(fighterB)側にcrrm-loss
    assert.ok(/crrm-win[\s\S]*?ハルカ/.test(rows[0]) , '第1試合: 左勝ちのときハルカ側にcrrm-winが付く(不変条件2, 3左右一致)');
    assert.ok(/ソラ[\s\S]*?crrm-loss/.test(rows[0]), '第1試合: 右側(ソラ)にcrrm-lossが付く');
    // m1: winner:'right' → ツキノ側にcrrm-loss、アカリ側にcrrm-win
    assert.ok(/crrm-loss[\s\S]*?ツキノ/.test(rows[1]), '第2試合: 右勝ちのとき左側(ツキノ)にcrrm-lossが付く(左右取り違え無し)');
    assert.ok(/アカリ[\s\S]*?crrm-win/.test(rows[1]), '第2試合: 右側(アカリ)にcrrm-winが付く');
    // m2: draw(2026-07-26: 実測0件のため引き分け表記を撤去。crrm-win/crrm-lossどちらも付かない無印行になる)
    assert.ok(!rows[2].includes('crrm-win') && !rows[2].includes('crrm-loss'), '引き分け行にはcrrm-win/crrm-lossどちらも付かない(不変条件2, 2026-07-26仕様)');
    assert.ok(!rows[2].includes('△'), '引き分け行に△記号は出ない(2026-07-26 撤去)');
  });

  // --- 1d. 0試合・全勝・全敗などの端のケースで落ちない(不変条件5) ---
  section('crrm: does not throw on 0-match series, all-win, or all-loss data (unvariant 5)', () => {
    const state = { orgName: 'プレイヤー団体', season: 1, week: 1, rngSeed: 1 };
    const cases = [
      { teamWin: 'draw', winsA: 0, winsB: 0, matches: [] }, // 0試合
      { teamWin: 'A', winsA: 3, winsB: 0, matches: [baseMatches()[0], baseMatches()[0], baseMatches()[0]] }, // 全勝
      { teamWin: 'B', winsA: 0, winsB: 3, matches: [baseMatches()[1], baseMatches()[1], baseMatches()[1]] }, // 全敗
    ];
    cases.forEach((result, i) => {
      const { built } = makeBundle({});
      assert.doesNotThrow(() => built.showChallengeRequestResultModal(baseCard({}), result, state, () => {}),
        `ケース${i}で例外を投げない`);
    });
  });

  // --- 1e. HTMLエスケープ: U5でスコアバナー/coachLine/試合行もescHtml()を通すよう修正 ---
  // (旧: リアクション欄だけescHtml済みで、それ以外は生のままという非対称な既知の欠落だった。不変条件7)
  section('crrm: reaction scene, score banner, coach line, and match rows are all escaped now (fixed in U5, was a mixed known gap)', () => {
    const { built, getRoot } = makeBundle({});
    const card = baseCard({
      teamA: [{ id: 1, name: '<script>alert(1)</script>' }],
      otherOrgName: '<script>alert(2)</script>',
    });
    const evilMatches = [{ winner: 'left', fighterA: { id: 1, name: '<script>alert(3)</script>' }, fighterB: { id: 9, name: 'B' }, mq: 50 }];
    const result = { teamWin: 'A', winsA: 1, winsB: 0, matches: evilMatches };
    const state = { orgName: 'プレイヤー団体', season: 1, week: 1, rngSeed: 1 };
    assert.doesNotThrow(() => built.showChallengeRequestResultModal(card, result, state, () => {}),
      '悪意ある名前でも例外を投げない(不変条件6の派生)');
    const html = getRoot().innerHTML;
    // reqName(=card.teamA[0].name)は「リアクション欄」「スコアバナー/coachLine」の両方に流れ込む。
    const reactionIdx = html.indexOf('crrm-reaction-name">'); // CSS内の.crrm-reaction-name(セレクタ)ではなく実際のdivを狙う
    assert.ok(reactionIdx >= 0, 'リアクション欄が出力される');
    const reactionSlice = html.slice(reactionIdx, reactionIdx + 200);
    assert.ok(!reactionSlice.includes('<script>alert(1)</script>'), 'リアクション欄内の選手名はエスケープされる(不変条件7)');
    assert.ok(reactionSlice.includes('&lt;script&gt;'), 'リアクション欄内はescHtml()でエスケープされた形で出力される');
    // スコアバナー/coachLine内のreqNameもエスケープされる(U5で修正)
    assert.ok(!html.includes('<script>alert(1)</script>'), 'reqNameはどこにも生のまま出力されない(不変条件7)');
    // 試合行の選手名(crrm-name)もエスケープされる(U5で修正)
    assert.ok(!html.includes('<script>alert(3)</script>'), '試合行(crrm-name)の選手名は生のまま出力されない(不変条件7)');
    // スコアバナーの相手団体名(otherOrgName)もエスケープされる(U5で修正)
    assert.ok(!html.includes('<script>alert(2)</script>'), 'スコアバナー/見出しの団体名(otherOrgName)は生のまま出力されない(不変条件7)');
  });
})();

// ===========================================================================
// 2. renderSpringTagLeagueBoard / _stlComputeStandingsThrough — リーグ順位表と勝ち点
//    (ui-common.js)
// ===========================================================================
(function springTagLeagueSuite() {
  const build = new Function(
    'Engine', 'document', 'App', 'G', 'getPortraitUrl', 'requestAnimationFrame',
    `${uiFn('escHtml')}
     ${uiFn('_stlOrgTeam')}
     ${uiFn('_stlFighterOf')}
     ${uiFn('_stlFaceImg')}
     ${uiFn('_stlConditionTier')}
     ${uiFn('_stlWearBarHtml')}
     ${uiFn('_stlCurrentCondition')}
     ${uiFn('_stlComputeStandingsThrough')}
     ${uiFn('_stlHeaderHtml')}
     ${uiFn('_stlLastMatchStripHtml')}
     ${uiFn('_stlFinalPreviewHtml')}
     ${uiFn('_stlUpcomingMatchHtml')}
     ${uiFn('renderSpringTagLeagueBoard')}
     return { renderSpringTagLeagueBoard, _stlComputeStandingsThrough };`
  );

  const ENGINE_STL = {
    POINTS: { win: 3, draw: 1, loss: 0 },
    MQ_BONUS_THRESHOLD: 60,
    MQ_BONUS: 1,
    ORG_ORDER: ['player', 'org_s', 'org_a', 'org_b'],
    INITIAL_CONDITION: 80,
  };

  function baseMatches() {
    return [
      { orgA: 'player', orgB: 'org_s', teamA: { f1Id: 1, f2Id: 2 }, teamB: { f1Id: 3, f2Id: 4 }, winner: 'teamA', isDraw: false, mq: 70, turns: 10, round: 1, conditionAfter: { player: 75, org_s: 70 } },
      { orgA: 'org_a', orgB: 'org_b', teamA: { f1Id: 5, f2Id: 6 }, teamB: { f1Id: 7, f2Id: 8 }, winner: 'teamB', isDraw: false, mq: 40, turns: 8, round: 2, conditionAfter: { org_a: 65, org_b: 78 } },
      { orgA: 'player', orgB: 'org_a', teamA: { f1Id: 1, f2Id: 2 }, teamB: { f1Id: 5, f2Id: 6 }, isDraw: true, mq: 55, turns: 9, round: 3, conditionAfter: { player: 68, org_a: 60 } },
      { orgA: 'player', orgB: 'org_b', teamA: { f1Id: 1, f2Id: 2 }, teamB: { f1Id: 7, f2Id: 8 }, round: 4 }, // 未消化(次戦プレビュー用)
    ];
  }

  function makeBundle(opts) {
    opts = opts || {};
    const box = { innerHTML: '', style: {} };
    const overlay = { classList: { add() {}, remove() {}, contains() { return false; } } };
    const doc = {
      getElementById: (id) => (id === 'showResultOverlay' ? overlay : id === 'showResultBox' ? box : null),
      querySelectorAll: () => [],
    };
    const EngineStub = opts.Engine || { springTagLeague: ENGINE_STL };
    const AppStub = opts.App || { _stlPreview: { idx: 3, phase: 'inProgress' } };
    const GStub = opts.G || baseG();
    const getPortraitUrlStub = opts.getPortraitUrl || ((id) => `image/face/${id}.png`);
    const built = build(EngineStub, doc, AppStub, GStub, getPortraitUrlStub, () => {});
    return { built, box };
  }

  function baseG() {
    return {
      season: 4,
      springTagLeague: {
        teams: [
          { orgId: 'player', orgName: 'プレイヤー団体', f1Id: 1, f2Id: 2 },
          { orgId: 'org_s', orgName: '巨人道場', f1Id: 3, f2Id: 4 },
          { orgId: 'org_a', orgName: '鬼道場', f1Id: 5, f2Id: 6 },
          { orgId: 'org_b', orgName: '氷月', f1Id: 7, f2Id: 8 },
        ],
        matches: baseMatches(),
        finalMatch: null,
      },
      roster: [{ id: 1, name: '風間サキ' }, { id: 2, name: '風間相方' }],
      aiOrgs: {
        org_s: { roster: [{ id: 3, name: 'S1' }, { id: 4, name: 'S2' }] },
        org_a: { roster: [{ id: 5, name: 'A1' }, { id: 6, name: 'A2' }] },
        org_b: { roster: [{ id: 7, name: 'B1' }, { id: 8, name: 'B2' }] },
      },
    };
  }

  // --- 2a. _stlComputeStandingsThrough: 勝ち点・順位・MQタイブレークが正しい(不変条件4) ---
  section('_stlComputeStandingsThrough: computes points/wins/losses/draws and ranks with MQ tiebreak', () => {
    const built = build({ springTagLeague: ENGINE_STL }, {}, {}, {}, () => '', () => {});
    const standings = built._stlComputeStandingsThrough(baseMatches(), 3);
    const byOrg = Object.fromEntries(standings.map(s => [s.orgId, s]));
    // player: win(+3,+1bonus mq70)=4, draw(+1)=1 => 5pt, 1勝0敗1分
    assert.strictEqual(byOrg.player.points, 5, 'playerの勝ち点が正しい(win+bonus, draw)');
    assert.strictEqual(byOrg.player.wins, 1);
    assert.strictEqual(byOrg.player.draws, 1);
    assert.strictEqual(byOrg.player.losses, 0);
    // org_s: loss(+0) + bonus(mq70>=60, 両者に付与)=1pt
    assert.strictEqual(byOrg.org_s.points, 1, 'org_sは敗北だがMQボーナスは両陣営に付くので1pt');
    assert.strictEqual(byOrg.org_s.losses, 1);
    // org_b: win(+3, mq40<60ボーナス無し)=3pt
    assert.strictEqual(byOrg.org_b.points, 3);
    assert.strictEqual(byOrg.org_b.wins, 1);
    // org_a: loss(+0)+draw(+1)=1pt、mqTotal=40+55=95 > org_sのmqTotal=70 なので同点タイブレークでorg_aが上位
    assert.strictEqual(byOrg.org_a.points, 1);
    assert.ok(byOrg.org_a.rank < byOrg.org_s.rank,
      '同じ勝ち点(1pt)のときMQ合計が高いorg_aがorg_sより上位に来る(タイブレーク, 不変条件4)');
    // ランキング1位はplayer(5pt)
    assert.strictEqual(byOrg.player.rank, 1, 'player(5pt)が1位');
  });

  // --- 2b. 0試合(開幕前)で落ちない(不変条件5) ---
  section('_stlComputeStandingsThrough: all-zero standings at count=0 does not throw', () => {
    const built = build({ springTagLeague: ENGINE_STL }, {}, {}, {}, () => '', () => {});
    let standings;
    assert.doesNotThrow(() => { standings = built._stlComputeStandingsThrough(baseMatches(), 0); });
    standings.forEach(s => {
      assert.strictEqual(s.points, 0);
      assert.strictEqual(s.wins + s.losses + s.draws, 0);
    });
  });

  // --- 2c. renderSpringTagLeagueBoard: 3状態(勝ち/負け/分け)が順位表テキストに反映される(不変条件2, 3) ---
  section('renderSpringTagLeagueBoard: win/loss/draw record text and points render without throwing (unvariant 1, 2, 3)', () => {
    const { built, box } = makeBundle({});
    assert.doesNotThrow(() => built.renderSpringTagLeagueBoard(), '例外を投げない(不変条件1)');
    const html = box.innerHTML;
    // 2026-07-26: 実測0件のため戦績テキストから「N分」表記を撤去(playerの戦績は「1勝」のみになる)。
    // 勝ち点(points)計算自体は draw を含めて集計され続ける(不変条件4は _stlComputeStandingsThrough で別途検証)。
    assert.ok(html.includes('1勝'), 'playerの戦績「1勝」がテキストで出る(不変条件2)');
    assert.ok(!html.includes('1分'), '「N分」表記は出ない(2026-07-26 撤去)');
    assert.ok(html.includes('1敗'), '敗北チームの「1敗」がテキストで出る(不変条件2)');
    assert.ok(html.includes('5<small>pt</small>') || /5<small>pt/.test(html), 'player(5pt)の勝ち点数値が出る(不変条件3)');
    // 直近試合ストリップ(m2=引き分け)。U5で明示するようになったdraw-tagクラス自体は維持しつつ、
    // 2026-07-26でタグの文言を「△ DRAW」から「NO CONTEST」へ変更(引き分け表記の撤去)。
    const stripStart = html.indexOf('stl-lastmatch-label');
    assert.ok(stripStart >= 0, '直近試合ストリップが出る');
    const strip = html.slice(stripStart - 40, stripStart + 800);
    assert.ok(!strip.includes('win-tag'), '引き分け行にはWINタグが付かない');
    assert.strictEqual((strip.match(/draw-tag/g) || []).length, 2, '引き分け行は両陣営にdraw-tagクラスが明示される(不変条件2)');
    assert.ok(strip.includes('NO CONTEST'), '引き分け行のタグ文言は「NO CONTEST」(2026-07-26、旧: △ DRAW)');
    assert.ok(!strip.includes('△'), '引き分け行に△記号は出ない(2026-07-26 撤去)');
    // 次戦プレビュー(matches[3]、未消化)も出る
    assert.ok(html.includes('NEXT MATCH'), '次戦プレビューが出る');
  });

  // --- 2d. 開幕前(idx=0)・決勝進出決定(finalReady)で落ちない(不変条件5, 6) ---
  section('renderSpringTagLeagueBoard: does not throw before round 1 (idx=0) or at finalReady', () => {
    const g0 = baseG();
    const { built: b1, box: box1 } = makeBundle({ App: { _stlPreview: { idx: 0, phase: 'entry' } }, G: g0 });
    assert.doesNotThrow(() => b1.renderSpringTagLeagueBoard(), 'idx=0(開幕前)でも例外なし');
    assert.ok(box1.innerHTML.includes('——'), '開幕前は全チーム戦績「——」表示(0勝0敗0分の端のケース)');

    const gFinal = baseG();
    gFinal.springTagLeague.finalMatch = { orgA: 'player', orgB: 'org_b', teamA: { f1Id: 1, f2Id: 2 }, teamB: { f1Id: 7, f2Id: 8 } };
    const { built: b2, box: box2 } = makeBundle({ App: { _stlPreview: { idx: 4, phase: 'finalReady' } }, G: gFinal });
    assert.doesNotThrow(() => b2.renderSpringTagLeagueBoard(), 'finalReadyでも例外なし');
    assert.ok(box2.innerHTML.includes('FINAL'), '決勝プレビューが出る');
  });

  // --- 2e. HTMLエスケープ: 団体名・選手名はエスケープされている(現状の正しい挙動として固定, 不変条件7) ---
  section('renderSpringTagLeagueBoard: escapes a hostile org/fighter name (this screen IS escaped)', () => {
    const g = baseG();
    g.springTagLeague.teams[2].orgName = '<script>alert(1)</script>';
    g.aiOrgs.org_a.roster[0].name = '<script>alert(2)</script>';
    const { built, box } = makeBundle({ G: g });
    assert.doesNotThrow(() => built.renderSpringTagLeagueBoard());
    const html = box.innerHTML;
    assert.ok(!html.includes('<script>alert(1)</script>') && !html.includes('<script>alert(2)</script>'),
      '団体名・選手名は生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()でエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 3. _agwFocusHtml / renderAutumnWarResult — 秋4団体対抗戦の団体戦スコア・決勝結果
//    (ui-common.js)
// ===========================================================================
(function autumnWarSuite() {
  const buildFocus = new Function(
    'Engine', 'G', 'App',
    `${uiFn('escHtml')}
     ${uiFn('_agwTeam')}
     ${uiFn('_agwFighter')}
     ${uiFn('_agwOvrHtml')}
     ${uiFn('_agwScoreThrough')}
     ${uiFn('_agwDisplayOrgIds')}
     ${uiFn('_agwOrderFor')}
     ${uiFn('_agwRoleLabel')}
     ${uiFn('_agwConditionMeta')}
     ${uiFn('_agwConditionBar')}
     const _AGW_DIALOGUE_CHANCE = { preBout: 0.55, survivor: 0.60, champion: 0.75 };
     ${uiFn('_agwDialogueRng')}
     ${uiFn('_agwPreBoutDialogueHtml')}
     ${uiFn('_agwFocusHtml')}
     return { _agwFocusHtml, _agwScoreThrough, _agwDisplayOrgIds };`
  );

  const ENGINE_AW = { INITIAL_CONDITION: 60, CEILING: 100 };

  function makeFocusBundle(opts) {
    opts = opts || {};
    const EngineStub = opts.Engine || {
      autumnWar: ENGINE_AW,
      rng: { create: (s) => ({ s }), derive: () => 1, float: () => 0, int: (rng, lo) => lo },
      util: { ov: () => 60 },
    };
    const GStub = opts.G || { autumnWar: { teams: [
      { orgId: 'player', orgName: 'プレイヤー団体', memberIds: [1, 2, 3] },
      { orgId: 'org_a', orgName: '鬼道場', memberIds: [11, 12, 13] },
    ] }, roster: [{ id: 1, name: '選手1' }, { id: 2, name: '選手2' }, { id: 3, name: '選手3' }], aiOrgs: { org_a: { roster: [{ id: 11, name: '敵1' }, { id: 12, name: '敵2' }, { id: 13, name: '敵3' }] } } };
    const AppStub = opts.App || {};
    return buildFocus(EngineStub, GStub, AppStub);
  }

  // --- 3a. 団体戦決着時: 自団体が左でも右でもスコアの取り違えが無い(最重要: 不変条件3) ---
  section('_agwFocusHtml: team-match-complete score never swaps left/right regardless of orgA/orgB order', () => {
    const built = makeFocusBundle({});
    // ケース1: orgA=player(左), orgB=org_a(右)。player 2フォール、org_a 1フォール取って決着
    const match1 = {
      orgA: 'player', orgB: 'org_a', winnerOrg: 'org_a', round: 'semiFinal',
      bouts: [
        { left: { id: 1 }, right: { id: 11 }, winnerId: 1 },
        { left: { id: 2 }, right: { id: 11 }, winnerId: 2 },
        { left: { id: 3 }, right: { id: 11 }, winnerId: 11 },
      ],
    };
    const disp1 = built._agwDisplayOrgIds(match1);
    const html1 = built._agwFocusHtml(match1, 3, disp1);
    assert.ok(/agw-focus-score">\s*2\s*—\s*1\s*</.test(html1),
      'orgA=player,orgB=org_aのとき「2 — 1」(左=player, 右=org_a)の順で出る(不変条件3)');

    // ケース2: 対称的にorgA/orgBを入れ替え、org_aが左・playerが右のケースでも取り違えが無いことを確認
    const match2 = {
      orgA: 'org_a', orgB: 'player', winnerOrg: 'player', round: 'semiFinal',
      bouts: [
        { left: { id: 11 }, right: { id: 1 }, winnerId: 11 },
        { left: { id: 12 }, right: { id: 1 }, winnerId: 1 },
        { left: { id: 13 }, right: { id: 1 }, winnerId: 1 },
      ],
    };
    const disp2 = built._agwDisplayOrgIds(match2);
    const html2 = built._agwFocusHtml(match2, 3, disp2);
    assert.ok(/agw-focus-score">\s*1\s*—\s*2\s*</.test(html2),
      'orgA=org_a,orgB=playerのときは「1 — 2」(左=org_a, 右=player)の順で出る。playerが常に右に固定されたりしない(不変条件3)');
  });

  // --- 3b. 決着済みチーム名が正しく出る(不変条件2) ---
  section('_agwFocusHtml: shows the correct winning team name (not the loser)', () => {
    const built = makeFocusBundle({});
    const match = {
      orgA: 'player', orgB: 'org_a', winnerOrg: 'org_a', round: 'final',
      bouts: [{ left: { id: 1 }, right: { id: 11 }, winnerId: 11 }],
    };
    const html = built._agwFocusHtml(match, 1, built._agwDisplayOrgIds(match));
    assert.ok(html.includes('鬼道場'), '勝者(org_a)の団体名が出る(不変条件2)');
    assert.ok(!html.includes('>プレイヤー団体<'), '敗者(player)の団体名を勝者として出さない');
  });

  // --- 3c. 次フォール(未決着)+直前フォールの引き分け表示(3状態目、2026-07-26で文言変更) ---
  section('_agwFocusHtml: next-bout branch shows "決着つかず" text for a drawn fall (3rd state, was "両者脱落")', () => {
    const built = makeFocusBundle({});
    const match = {
      orgA: 'player', orgB: 'org_a', winnerOrg: null, round: 'semiFinal',
      orderA: [1, 2, 3], orderB: [11, 12, 13], aIdx: 1, bIdx: 1,
      bouts: [{ left: { id: 1, name: '選手1' }, right: { id: 11, name: '敵1' }, draw: true, mq: 50 }],
    };
    let html;
    assert.doesNotThrow(() => { html = built._agwFocusHtml(match, 1, built._agwDisplayOrgIds(match)); }, '例外を投げない(不変条件1)');
    // 2026-07-26: 実測0件のため「両者脱落」→「決着つかず」に文言変更(進行ロジック=両者ともに次の選手へ進む、は不変)
    assert.ok(html.includes('決着つかず'), '直前フォールが引き分けのとき「決着つかず」の文言で3つ目の状態が判別できる(不変条件2)');
    assert.ok(!html.includes('両者脱落'), '旧文言「両者脱落」は出ない(2026-07-26 撤去)');
  });

  // --- 3d. 0-0(未消化)で落ちない(不変条件5) ---
  section('_agwFocusHtml: does not throw at 0-0 (no bouts played yet)', () => {
    const built = makeFocusBundle({});
    const match = {
      orgA: 'player', orgB: 'org_a', winnerOrg: null, round: 'semiFinal',
      orderA: [1, 2, 3], orderB: [11, 12, 13], aIdx: 0, bIdx: 0, bouts: [],
    };
    let html;
    assert.doesNotThrow(() => { html = built._agwFocusHtml(match, 0, built._agwDisplayOrgIds(match)); });
    assert.ok(html.length > 0);
  });

  // --- renderAutumnWarResult: 決勝の最終スコア(champion vs runnerUp) ---
  const buildResult = new Function(
    'Engine', 'G', 'App', 'document',
    `${uiFn('escHtml')}
     ${uiFn('_agwTeam')}
     ${uiFn('_agwFighter')}
     ${uiFn('_agwHeaderHtml')}
     ${uiFn('_agwRoleLabel')}
     ${uiFn('_agwRenderPhase')}
     const _AGW_DIALOGUE_CHANCE = { preBout: 0.55, survivor: 0.60, champion: 0.75 };
     ${uiFn('_agwDialogueRng')}
     ${uiFn('_agwChampionSpeech')}
     ${uiFn('_emrOrgInitial')}
     ${uiFn('_chOrgEmblemInner')}
     ${uiFn('_chBubbleSlot')}
     ${uiFn('_chPortraitImg')}
     ${uiFn('_chTeamlineHtml')}
     ${uiFn('renderAutumnWarResult')}
     return { renderAutumnWarResult };`
  );

  function makeResultDom() {
    let screenHtml = '';
    const screen = {
      dataset: {}, get innerHTML() { return screenHtml; }, set innerHTML(v) { screenHtml = v; },
      querySelector() { return null; },
    };
    const overlay = { dataset: {}, classList: { add() {}, remove() {} } };
    const doc = { getElementById: (id) => (id === 'autumnWarOverlay' ? overlay : id === 'autumnWarScreen' ? screen : null) };
    return { doc, getScreen: () => screen };
  }

  function makeResultBundle(opts) {
    opts = opts || {};
    const { doc, getScreen } = makeResultDom();
    const EngineStub = opts.Engine || {
      autumnWar: { PRIZE: { champion: 500, runnerUp: 200 }, INITIAL_CONDITION: 60 },
      rng: { create: (s) => ({ s }), float: () => 0.99, int: (rng, lo) => lo },
      util: { getPlayerOrgIconPath: () => 'image/org/org-player-0.png', getOrgIconPath: (s, id) => (id === 'org_a' ? 'image/org/org-a-0.png' : '') },
    };
    const GStub = opts.G || {
      season: 3,
      roster: [{ id: 1, name: '選手1' }, { id: 2, name: '選手2' }, { id: 3, name: '選手3' }],
      autumnWar: { teams: [
        { orgId: 'player', orgName: 'プレイヤー団体', memberIds: [1, 2, 3] },
        { orgId: 'org_a', orgName: '鬼道場', memberIds: [11, 12, 13] },
      ] },
    };
    const AppStub = opts.App || { _awPreview: opts.p };
    const built = buildResult(EngineStub, GStub, AppStub, doc);
    return { built, getScreen };
  }

  function baseResultP() {
    return {
      committed: true,
      result: {
        teams: [
          { orgId: 'player', orgName: 'プレイヤー団体', memberIds: [1, 2, 3] },
          { orgId: 'org_a', orgName: '鬼道場', memberIds: [11, 12, 13] },
        ],
        champion: 'player',
        runnerUp: 'org_a',
        finalResult: { orgA: 'player', orgB: 'org_a', orderA: [1, 2, 3], orderB: [11, 12, 13], teamWins: { player: 2, org_a: 1 } },
        fighterWins: { 1: 2, 2: 1, 3: 0 },
        mvpId: 1,
        revenueDistribution: null,
      },
    };
  }

  // --- 3e. renderAutumnWarResult: 優勝団体のスコアが正しく表示される(不変条件3) ---
  section('renderAutumnWarResult: shows the champion-vs-runnerUp final score without throwing', () => {
    const p = baseResultP();
    const { built, getScreen } = makeResultBundle({ p });
    assert.doesNotThrow(() => built.renderAutumnWarResult(), '例外を投げない(不変条件1)');
    const html = getScreen().innerHTML;
    assert.ok(/agw-result-score[\s\S]*?2\s*—\s*1/.test(html), 'FINALスコア「2 — 1」(champion側が先)が出る(不変条件3)');
    assert.ok(html.includes('プレイヤー団体'), '優勝団体名が出る(不変条件2)');
    assert.ok(html.includes('鬼道場'), '準優勝団体名が出る');
    assert.ok(html.includes('選手1') && html.includes('選手2') && html.includes('選手3'), '優勝メンバー3名の名前が全員出る');
  });

  // --- 3f. HTMLエスケープ(この画面は一貫してescHtml済み。正として固定, 不変条件7) ---
  section('renderAutumnWarResult: escapes hostile org/fighter names (this screen IS escaped)', () => {
    const p = baseResultP();
    p.result.teams[1].orgName = '<script>alert(1)</script>';
    p.result.teams[0].memberIds = [1];
    const { built, getScreen } = makeResultBundle({
      p,
      G: {
        season: 3, roster: [{ id: 1, name: '<script>alert(2)</script>' }],
        autumnWar: { teams: p.result.teams },
      },
    });
    assert.doesNotThrow(() => built.renderAutumnWarResult());
    const html = getScreen().innerHTML;
    assert.ok(!html.includes('<script>alert(1)</script>') && !html.includes('<script>alert(2)</script>'),
      '団体名・選手名は生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()でエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 4. renderWarFinalResult — War対抗戦シリーズ通算の勝ち越し/引き分け/負け越し
//    (ui-common.js)
// ===========================================================================
(function warFinalResultSuite() {
  const build = new Function(
    'Engine', 'document', 'RIVAL_ORGS', 'G', 'getUpperUrl', 'getHeatLevel',
    `let _warVictoryWinners = [];
     let _warPostCtx = null;
     ${uiFn('escHtml')}
     ${uiFn('fLink')}
     ${uiFn('_pbStars')}
     ${uiFn('_pbPortraitImg')}
     ${uiFn('_pbFighterBlock')}
     ${uiFn('_pbResultColumn')}
     ${uiFn('renderWarFinalResult')}
     return { renderWarFinalResult };`
  );

  function makeDom() {
    const box = { innerHTML: '' };
    const overlay = { classList: { add() {}, remove() {} } };
    const doc = { getElementById: (id) => (id === 'showResultOverlay' ? overlay : id === 'showResultBox' ? box : null) };
    return { doc, box };
  }

  function makeBundle(opts) {
    opts = opts || {};
    const { doc, box } = makeDom();
    const EngineStub = opts.Engine || {
      util: { ov: () => 65 },
      rival: { getOrgInfo: (aiOrgs, orgId) => aiOrgs[orgId] || null },
      event: { getAce: (roster) => (roster && roster[0]) || null },
      formatFinish: (type, move) => move || type || '',
    };
    const RIVAL_ORGS_STUB = opts.RIVAL_ORGS || [{ id: 'org_a', color: '#e74c3c', emoji: '⚔', tier: 'A' }];
    const GStub = opts.G || { orgName: 'プレイヤー団体', aiOrgs: { org_a: { roster: [{ id: 99, name: 'エース' }] } } };
    const getUpperUrlStub = opts.getUpperUrl || ((id) => `image/upper/${id}.webp`);
    const getHeatLevelStub = opts.getHeatLevel || (() => ({ id: 'warm', label: 'warm', emoji: '\u{1F525}' }));
    const built = build(EngineStub, doc, RIVAL_ORGS_STUB, GStub, getUpperUrlStub, getHeatLevelStub);
    return { built, box };
  }

  function fighter(id, name) { return { id, name, pw: 60, sp: 60, te: 60, st: 60, mn: 60 }; }

  function makeResults() {
    return [
      { playerFighter: fighter(1, '選手1'), aiFighter: fighter(11, '敵1'), playerWon: false, mq: 50, turns: 10, finType: 'pin', finMove: 'm1' },
      { playerFighter: fighter(2, '選手2'), aiFighter: fighter(12, '敵2'), playerWon: true, mq: 60, turns: 11, finType: 'pin', finMove: 'm2' },
      { playerFighter: fighter(3, '選手3'), aiFighter: fighter(13, '敵3'), playerWon: true, mq: 70, turns: 12, finType: 'pin', finMove: 'm3' },
    ];
  }

  // --- 4a. 3状態(勝ち越し/決着つかず/負け越し)がverdictLabelで判別できる(不変条件2)。
  // 2026-07-26: warMatchCountは奇数のみ(3 or 5)かつ個々の試合は実測上drawにならないため、
  // playerWins===aiWinsのシリーズ引き分け自体が構造上ほぼ起こり得ないが、文言だけは「引き分け」→「決着つかず」に変更。 ---
  section('renderWarFinalResult: series verdict distinguishes win/no-contest/loss via label text and score digits', () => {
    const ev = { opponentOrgId: 'org_a', opponentName: '鬼道場' };
    [
      { playerWins: 2, aiWins: 1, expect: '勝ち越し', won: true },
      { playerWins: 1, aiWins: 1, expect: '決着つかず', won: false },
      { playerWins: 1, aiWins: 2, expect: '負け越し', won: false },
    ].forEach(({ playerWins, aiWins, expect, won }) => {
      const { built, box } = makeBundle({});
      assert.doesNotThrow(() => built.renderWarFinalResult(ev, makeResults(), playerWins, aiWins, won),
        `${expect}ケースで例外を投げない(不変条件1)`);
      const html = box.innerHTML;
      assert.ok(html.includes(expect), `verdictLabelに「${expect}」が出る(不変条件2)`);
      assert.ok(new RegExp(`>${playerWins}<[\\s\\S]{0,60}>${aiWins}<`).test(html) || html.includes(`${playerWins}`),
        `スコア(${playerWins}-${aiWins})の数値が出力に含まれる(不変条件3)`);
    });
  });

  // --- 4b. 個々の試合行は is-winner/is-loser のみ(3値目=引き分けが構造的に出せない。既知として報告) ---
  section('renderWarFinalResult: per-match rows only ever carry is-winner/is-loser, never a draw state (known gap, reported not fixed)', () => {
    const ev = { opponentOrgId: 'org_a', opponentName: '鬼道場' };
    const { built, box } = makeBundle({});
    built.renderWarFinalResult(ev, makeResults(), 2, 1, true);
    const html = box.innerHTML;
    assert.ok(html.includes('is-winner') && html.includes('is-loser'), '勝敗2状態は出る');
    if (!html.includes('is-draw') && !/pb-result-winner is-draw/.test(html)) {
      logGap('renderWarFinalResult: _pbResultColumnにwinnerIsDraw:falseが常に固定で渡るため、個々の試合行は勝敗の2状態しか表現できない(シリーズ通算の引き分けは出せるが試合単位では出せない)');
    }
  });

  // --- 4c. 0-0(未消化0試合)でも落ちない(不変条件5) ---
  section('renderWarFinalResult: does not throw with an empty results array', () => {
    const ev = { opponentOrgId: 'org_a', opponentName: '鬼道場' };
    const { built } = makeBundle({});
    assert.doesNotThrow(() => built.renderWarFinalResult(ev, [], 0, 0, false));
  });

  // --- 4d. エスケープ: U5でfLink()自体がescHtml()を通すよう修正。winnerLabelとの非対称は解消(不変条件7) ---
  section('renderWarFinalResult: winnerLabel and the fLink name are both escaped now (fixed in U5, was a mixed known gap)', () => {
    const ev = { opponentOrgId: 'org_a', opponentName: '鬼道場' };
    const evilResults = [
      { playerFighter: fighter(1, '<script>alert(1)</script>'), aiFighter: fighter(11, '敵1'), playerWon: true, mq: 50, turns: 10, finType: 'pin', finMove: 'm1' },
    ];
    const { built, box } = makeBundle({});
    assert.doesNotThrow(() => built.renderWarFinalResult(ev, evilResults, 1, 0, true), '例外を投げない(不変条件6の派生)');
    assert.ok(!box.innerHTML.includes('<script>alert(1)</script>'), '_pbFighterBlock内の選手名リンク(fLink経由)も生のまま出力されない(不変条件7)');
    assert.ok(box.innerHTML.includes('&lt;script&gt;'), 'escHtml()でエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 5. _renderB3MatchResult / _renderB2MatchResult — 挑戦状/派閥内対決の試合結果
//    (ui-common.js)
// ===========================================================================
(function b2b3MatchResultSuite() {
  const build = new Function(
    'Engine', 'document', 'RIVAL_ORGS', 'G', 'getUpperUrl', 'pickDialogueLine', 'RIVALRY_MATCH_REACTION', 'WAR_POST_DIALOGUE',
    `${uiFn('escHtml')}
     ${uiFn('fLink')}
     ${uiFn('_pbStars')}
     ${uiFn('_pbPortraitImg')}
     ${uiFn('_pbFighterBlock')}
     ${uiFn('_pbResultColumn')}
     ${uiFn('_renderB3MatchResult')}
     ${uiFn('_renderB2MatchResult')}
     return { _renderB3MatchResult, _renderB2MatchResult };`
  );

  function makeDom() {
    const box = { innerHTML: '' };
    const overlay = { classList: { add() {}, remove() {} } };
    const doc = { getElementById: (id) => (id === 'showResultOverlay' ? overlay : id === 'showResultBox' ? box : null) };
    return { doc, box };
  }

  function makeBundle(opts) {
    opts = opts || {};
    const { doc, box } = makeDom();
    const EngineStub = opts.Engine || { util: { ov: () => 60 }, formatFinish: (t, m) => m || t || '' };
    const RIVAL_ORGS_STUB = opts.RIVAL_ORGS || [{ id: 'org_a', color: '#e74c3c', emoji: '' }];
    const GStub = opts.G || { orgName: 'プレイヤー団体' };
    const getUpperUrlStub = opts.getUpperUrl || ((id) => `image/upper/${id}.webp`);
    const pickDialogueLineStub = opts.pickDialogueLine || ((pool, f) => `LINE_${f && f.id}`);
    const RMR = opts.RIVALRY_MATCH_REACTION || { winnerLines: ['w'], loserLines: ['l'] };
    const built = build(EngineStub, doc, RIVAL_ORGS_STUB, GStub, getUpperUrlStub, pickDialogueLineStub, RMR, undefined);
    return { built, box };
  }

  function fighter(id, name) { return { id, name, pw: 60, sp: 60, te: 60, st: 60, mn: 60, style: 'Grappler' }; }

  // --- 5a. B3: 勝ち・負け・引き分けの3状態がクラスで判別できる(不変条件2) ---
  section('_renderB3MatchResult: win/loss/draw are distinguishable via is-winner/is-loser/is-draw classes', () => {
    const event = { orgName: '鬼道場', orgId: 'org_a' };
    const pf = fighter(1, '選手A');
    const cf = fighter(9, '黒羽ミナ');
    [
      { winner: 'left', expectWin: true },
      { winner: 'right', expectWin: false },
      { winner: 'draw', expectDraw: true },
    ].forEach(({ winner, expectWin, expectDraw }) => {
      const { built, box } = makeBundle({});
      const matchResult = { winner, mq: 60, turns: 10, finType: 'pin', finMove: 'm' };
      assert.doesNotThrow(() => built._renderB3MatchResult(event, matchResult, pf, cf), `winner=${winner}で例外を投げない(不変条件1)`);
      const html = box.innerHTML;
      if (expectDraw) {
        assert.ok(html.includes('is-draw'), 'draw時はis-drawクラスが両者に付く(不変条件2)');
        // 2026-07-26: 実測0件のため「DRAW」→「NO CONTEST」に文言変更
        assert.ok(html.includes('NO CONTEST'), 'NO CONTEST表記が出る(旧: DRAW)');
        assert.ok(!html.includes('DRAW'), '旧文言「DRAW」は出ない(2026-07-26 撤去)');
      } else {
        assert.ok(html.includes('is-winner') && html.includes('is-loser'), 'win/lose時はis-winner/is-loserが付く(不変条件2)');
        assert.ok(html.includes(expectWin ? 'WIN' : 'WIN'), '勝者ラベルにWINが出る'); // winnerLabelは常にWIN表記(勝者名+WIN)
      }
    });
  });

  // --- 5b. B2: 同様に3状態が判別できる(不変条件2) ---
  section('_renderB2MatchResult: win/loss/draw are distinguishable via is-winner/is-loser/is-draw classes', () => {
    const f1 = fighter(1, '選手A');
    const f2 = fighter(2, '選手B');
    [
      { winner: 'left' }, { winner: 'right' }, { winner: 'draw' },
    ].forEach(({ winner }) => {
      const { built, box } = makeBundle({});
      const matchResult = { winner, mq: 55, turns: 8, finType: 'pin', finMove: 'm' };
      assert.doesNotThrow(() => built._renderB2MatchResult({}, matchResult, f1, f2, 2), `winner=${winner}で例外を投げない`);
      const html = box.innerHTML;
      if (winner === 'draw') {
        // 2026-07-26: 実測0件のため「DRAW」→「NO CONTEST」に文言変更
        assert.ok(html.includes('is-draw') && html.includes('NO CONTEST'), '引き分け(決着つかず)が判別できる(不変条件2)');
        assert.ok(!html.includes('DRAW'), '旧文言「DRAW」は出ない(2026-07-26 撤去)');
      } else {
        assert.ok(html.includes('is-winner') && html.includes('is-loser'), '勝敗が判別できる(不変条件2)');
      }
    });
  });

  // --- 5c. HP無し・介入無しなど端のケースで落ちない(不変条件5) ---
  section('_renderB3MatchResult / _renderB2MatchResult: do not throw without hp fields or intervention choice', () => {
    const { built } = makeBundle({});
    assert.doesNotThrow(() => built._renderB3MatchResult({ orgName: 'X', orgId: 'org_a' }, { winner: 'left', mq: 0, turns: 0 }, fighter(1, 'A'), fighter(2, 'B')));
    assert.doesNotThrow(() => built._renderB2MatchResult({}, { winner: 'draw', mq: 0, turns: 0 }, fighter(1, 'A'), fighter(2, 'B'), 2));
  });

  // --- 5d. エスケープ: U5でfLink()自体がescHtml()を通すよう修正。winnerLabelとの非対称は解消(不変条件7) ---
  section('_renderB3MatchResult / _renderB2MatchResult: winnerLabel and fLink fighter name are both escaped now (fixed in U5, was a mixed known gap)', () => {
    const evilF = fighter(1, '<script>alert(1)</script>');
    const okF = fighter(2, 'B');
    const { built, box } = makeBundle({});
    assert.doesNotThrow(() => built._renderB3MatchResult({ orgName: 'X', orgId: 'org_a' }, { winner: 'left', mq: 10, turns: 1 }, evilF, okF),
      '例外を投げない(不変条件6の派生)');
    assert.ok(!box.innerHTML.includes('<script>alert(1)</script>'), '_pbFighterBlock内の選手名リンク(fLink経由)も生のまま出力されない(不変条件7)');
    assert.ok(box.innerHTML.includes('&lt;script&gt;'), 'escHtml()でエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 6. _buildB2Step3 / _buildB3Step3 — 派閥内対決/挑戦状の結果コマ(勝敗コマ)
//    (ui-common.js)
// ===========================================================================
(function step3Suite() {
  const build = new Function(
    'Engine', 'getUpperUrl',
    `${uiFn('escHtml')}
     ${uiFn('_factionPickReporter')}
     ${uiFn('_mdlAReporterStrip')}
     ${uiFn('_mdlASeasonLabel')}
     ${uiFn('_buildB2Step3')}
     ${uiFn('_buildB3Step3')}
     return { _buildB2Step3, _buildB3Step3 };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const EngineStub = opts.Engine || { rng: { derive: () => 1 }, util: { ov: () => 60 } };
    const getUpperUrlStub = opts.getUpperUrl || ((id) => `image/upper/${id}.webp`);
    return build(EngineStub, getUpperUrlStub);
  }

  const roster = [{ id: 1, name: '選手A', age: 20 }, { id: 2, name: '選手B', age: 22 }];

  // --- 6a. B2Step3: 勝ち・負け(fighter1/fighter2どちらが勝ったか)・引き分けの3状態(不変条件2) ---
  section('_buildB2Step3: victory/defeat verdict correctly names the actual winner, plus draw state', () => {
    const built = makeBundle({});
    // fighter1勝ち
    const html1 = built._buildB2Step3({ fighter1: 1, fighter2: 2, matchResult: { winner: 'fighter1' } }, {}, roster);
    assert.ok(html1.includes('victory') && html1.includes('VICTORY'), 'fighter1勝ちでvictoryクラス/VICTORY表記');
    assert.ok(html1.includes('選手A'.toUpperCase()) || html1.includes('選手A'), '勝者(選手A)の名前が出る(不変条件2)');
    // fighter2勝ち
    const html2 = built._buildB2Step3({ fighter1: 1, fighter2: 2, matchResult: { winner: 'fighter2' } }, {}, roster);
    assert.ok(html2.includes('選手B'), '勝者(選手B)の名前が出る。fighter1/fighter2の取り違えが無い');
    // draw(2026-07-26: 文言を「引き分け」/「DRAW」→「決着つかず」/「NO CONTEST」に変更。draw クラス自体は維持)
    const html3 = built._buildB2Step3({ fighter1: 1, fighter2: 2, matchResult: { winner: 'draw' } }, {}, roster);
    assert.ok(html3.includes('draw') && html3.includes('決着つかず') && html3.includes('NO CONTEST'), '引き分け(決着つかず)が3つ目の状態として判別できる(不変条件2)');
    assert.ok(!html3.includes('引き分け') && !html3.includes('DRAW'), '旧文言「引き分け」「DRAW」は出ない(2026-07-26 撤去)');
  });

  // --- 6b. B3Step3: 勝ち・負け・引き分けの3状態(社長視点=挑戦を受けた選手の勝敗)(不変条件2) ---
  section('_buildB3Step3: victory/defeat/draw verdict distinguishes all 3 states via verdictCls', () => {
    const built = makeBundle({});
    const base = { challenger: { id: 9, name: '黒羽ミナ' }, orgName: '鬼道場', selectedFighterId: 1 };
    const htmlWin = built._buildB3Step3({ ...base, matchResult: { winner: 'left', mq: 60 } }, {}, roster);
    assert.ok(htmlWin.includes('victory') && htmlWin.includes('VICTORY'), '勝利が判別できる(不変条件2)');
    const htmlLose = built._buildB3Step3({ ...base, matchResult: { winner: 'right', mq: 60 } }, {}, roster);
    assert.ok(htmlLose.includes('defeat') && htmlLose.includes('DEFEAT'), '敗北が判別できる(不変条件2)');
    // 2026-07-26: 文言を「引き分け」/「DRAW」→「決着つかず」/「NO CONTEST」に変更。draw クラス自体は維持
    const htmlDraw = built._buildB3Step3({ ...base, matchResult: { winner: 'other', mq: 60 } }, {}, roster);
    assert.ok(htmlDraw.includes('draw') && htmlDraw.includes('NO CONTEST') && htmlDraw.includes('決着つかず'), '引き分け(決着つかず)が判別できる(不変条件2)');
    assert.ok(!htmlDraw.includes('DRAW') && !htmlDraw.includes('引き分け'), '旧文言「DRAW」「引き分け」は出ない(2026-07-26 撤去)');
  });

  // --- 6c. matchResultが無いとき閉じるボタンのみで落ちない(不変条件5) ---
  section('_buildB2Step3 / _buildB3Step3: do not throw when matchResult is missing', () => {
    const built = makeBundle({});
    assert.doesNotThrow(() => built._buildB2Step3({ fighter1: 1, fighter2: 2 }, {}, roster));
    assert.doesNotThrow(() => built._buildB3Step3({ challenger: {}, selectedFighterId: 1 }, {}, roster));
  });

  // --- 6d. エスケープ: U5で escHtml() を通すよう修正(旧: 一度も呼ばない既知の欠落だった。不変条件7) ---
  section('_buildB2Step3 / _buildB3Step3: now escape fighter/challenger names (fixed in U5, was a known gap)', () => {
    const built = makeBundle({});
    const evilRoster = [{ id: 1, name: '<script>alert(1)</script>', age: 20 }, { id: 2, name: 'B', age: 22 }];
    const html2 = built._buildB2Step3({ fighter1: 1, fighter2: 2, matchResult: { winner: 'fighter1' } }, {}, evilRoster);
    assert.doesNotThrow(() => built._buildB2Step3({ fighter1: 1, fighter2: 2, matchResult: { winner: 'fighter1' } }, {}, evilRoster),
      '例外を投げない(不変条件6の派生)');
    assert.ok(!html2.includes('<script>alert(1)</script>'), '_buildB2Step3: 選手名は生のまま出力されない(不変条件7)');
    assert.ok(html2.includes('&lt;script&gt;'), '_buildB2Step3: escHtml()でエスケープされた形で出力される');

    const html3 = built._buildB3Step3({ challenger: { id: 9, name: '<script>alert(2)</script>' }, orgName: '鬼道場', selectedFighterId: 1, matchResult: { winner: 'left', mq: 10 } }, {}, roster);
    assert.ok(!html3.includes('<script>alert(2)</script>'), '_buildB3Step3: 相手選手名は生のまま出力されない(不変条件7)');
    assert.ok(html3.includes('&lt;script&gt;'), '_buildB3Step3: escHtml()でエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 7. _npRenderDigest — 新聞ダイジェスト表の勝敗印 (ui-render.js)
// ===========================================================================
(function npDigestSuite() {
  const build = new Function(
    'G', 'Engine',
    `${uiFn('escHtml')}
     ${uiRenderFn('_npTurnsToTime')}
     ${uiRenderFn('_npThumbBg')}
     ${uiRenderFn('_npRenderDigest')}
     return { _npRenderDigest };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const GStub = opts.G || { showVenue: 0, orgPop: 50 };
    const EngineStub = opts.Engine || {};
    return build(GStub, EngineStub);
  }

  function m(overrides) {
    return Object.assign({
      left: { id: 1, name: 'ハルカ' }, right: { id: 2, name: 'ソラ' },
      winner: 'left', isDraw: false, mq: 60, turns: 10, matchNumber: 2,
    }, overrides || {});
  }

  // --- 7a. 勝ち・負け・引き分けの3状態が○/×/決着つかずテキストで判別できる(不変条件2)。
  // 2026-07-26: 実測0件のため vs欄の「DRAW」表記は撤去し常に「vs」表示。引き分けは
  // finishLine の「決着つかず」テキスト(旧: 時間切れ引き分け)と、勝敗マークが両者とも無いことで判別する ---
  section('_npRenderDigest: win/loss are distinguishable via ○/× marks; a draw row shows neither mark and reads "決着つかず"', () => {
    const built = makeBundle({});
    const d = { allMatches: [
      m({ winner: 'left', left: { id: 1, name: 'ハルカ' }, right: { id: 2, name: 'ソラ' } }),
      m({ winner: 'right', left: { id: 3, name: 'ツキノ' }, right: { id: 4, name: 'アカリ' } }),
      m({ isDraw: true, winner: null, left: { id: 5, name: 'レンカ' }, right: { id: 6, name: 'ミオ' } }),
    ] };
    let html;
    assert.doesNotThrow(() => { html = built._npRenderDigest(d, 3, 5); }, '例外を投げない(不変条件1)');
    assert.ok(/ハルカ<span class="np-digest-mark win">○/.test(html), '左勝ちのとき勝者(ハルカ)側に○マークが付く(不変条件2, 3)');
    assert.ok(/<span class="np-digest-mark lose">×<\/span>ツキノ/.test(html), '右勝ちのとき敗者(ツキノ)側に×マークが付く(左右取り違え無し)');
    assert.ok(html.includes('アカリ<span class="np-digest-mark win">○'), '右勝ちのとき勝者(アカリ)側に○が付く');
    assert.ok(html.includes('決着つかず'), '引き分けは「決着つかず」テキストで判別できる(不変条件2, 2026-07-26)');
    assert.ok(!html.includes('DRAW'), '旧文言「DRAW」は出ない(2026-07-26 撤去)');
    // 引き分け行には○/×マークが付かない
    const drawRowIdx = html.indexOf('レンカ');
    const drawRow = html.slice(Math.max(0, drawRowIdx - 300), drawRowIdx + 300);
    assert.ok(!drawRow.includes('np-digest-mark'), '引き分け行には勝敗マークが付かない');
  });

  // --- 7b. 0試合・タッグ形式で落ちない(不変条件5, 6) ---
  section('_npRenderDigest: does not throw with 0 matches, or a tag-team draw', () => {
    const built = makeBundle({});
    assert.doesNotThrow(() => built._npRenderDigest({ allMatches: [] }, 1, 1));
    const tagDraw = m({
      isTag: true, isDraw: true, winner: null,
      teamA: { members: [{ id: 1, name: 'A1' }, { id: 2, name: 'A2' }] },
      teamB: { members: [{ id: 3, name: 'B1' }, { id: 4, name: 'B2' }] },
    });
    assert.doesNotThrow(() => built._npRenderDigest({ allMatches: [tagDraw] }, 1, 1), 'タッグ引き分けで例外なし');
  });

  // --- 7c. エスケープ: U5でescHtml()を通すよう修正(旧: 一度も呼ばない既知の欠落だった。不変条件7) ---
  section('_npRenderDigest: now escapes fighter names (fixed in U5, was a known gap)', () => {
    const built = makeBundle({});
    const evilMatch = m({ left: { id: 1, name: '<script>alert(1)</script>' }, right: { id: 2, name: 'B' } });
    let html;
    assert.doesNotThrow(() => { html = built._npRenderDigest({ allMatches: [evilMatch] }, 1, 1); }, '例外を投げない(不変条件6の派生)');
    assert.ok(!html.includes('<script>alert(1)</script>'), '選手名は生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()でエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 8. _npRenderPlayerShow — 新聞見出し試合の勝敗印 (ui-render.js)
// ===========================================================================
(function npPlayerShowSuite() {
  const build = new Function(
    'G', 'Engine', 'getUpperUrl',
    `${uiFn('escHtml')}
     ${uiRenderFn('_npPhotoBg')}
     ${uiRenderFn('_npTurnsToTime')}
     ${uiRenderFn('_npThumbBg')}
     ${uiRenderFn('_renderNewspaperInjuries')}
     ${uiRenderFn('_npRenderDigest')}
     ${uiRenderFn('_npRenderPlayerShow')}
     return { _npRenderPlayerShow };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const GStub = opts.G || { showVenue: 0, orgPop: 50, orgName: '自団体' };
    const EngineStub = opts.Engine || {};
    const getUpperUrlStub = opts.getUpperUrl || ((id) => `image/upper/${id}.webp`);
    return build(GStub, EngineStub, getUpperUrlStub);
  }

  function baseD(overrides) {
    return Object.assign({
      headline: 'メインイベント白熱',
      left: { id: 1, name: 'ハルカ' }, right: { id: 2, name: 'ソラ' },
      winner: { id: 1 }, isDraw: false,
      finishLabel: '必殺技', matchLabel: 'メインイベント', mq: 80, turns: 14,
    }, overrides || {});
  }

  // --- 8a. 左勝ち・右勝ち・引き分けの3状態が○/×/DRAWで判別できる(不変条件2, 3) ---
  section('_npRenderPlayerShow: left-win / right-win / draw are each distinguishable (unvariant 2, 3)', () => {
    const built = makeBundle({});
    const leftWinHtml = built._npRenderPlayerShow(baseD({ winner: { id: 1 } }), 1, 1);
    assert.ok(/ハルカ<span class="np-winner-mark">○/.test(leftWinHtml), '左勝ちのとき左(ハルカ)側に○が付く(不変条件3)');
    assert.ok(/ソラ<span class="np-loser-mark">×/.test(leftWinHtml), '左勝ちのとき右(ソラ)側に×が付く(左右取り違え無し)');

    const rightWinHtml = built._npRenderPlayerShow(baseD({ winner: { id: 2 } }), 1, 1);
    assert.ok(/ソラ<span class="np-winner-mark">○/.test(rightWinHtml), '右勝ちのとき右(ソラ)側に○が付く(不変条件3)');
    assert.ok(/ハルカ<span class="np-loser-mark">×/.test(rightWinHtml), '右勝ちのとき左(ハルカ)側に×が付く');

    // 2026-07-26: 実測0件のため vs欄は常に「VS」表示(旧: 引き分け時のみ「DRAW」)。
    // 引き分けは np-show-decision 内の「決着つかず」テキスト(旧: 時間切れ引き分け)で判別する。
    const drawHtml = built._npRenderPlayerShow(baseD({ isDraw: true, winner: null }), 1, 1);
    assert.ok(!drawHtml.includes('np-winner-mark') && !drawHtml.includes('np-loser-mark'), '引き分け時はどちらにも勝敗マークが付かない');
    assert.ok(drawHtml.includes('決着つかず'), '引き分けは「決着つかず」のdecision文で判別できる(不変条件2, 2026-07-26)');
    assert.ok(!drawHtml.includes('DRAW') && !drawHtml.includes('時間切れ引き分け'), '旧文言「DRAW」「時間切れ引き分け」は出ない(2026-07-26 撤去)');
  });

  // --- 8b. allMatchesが無い・空でも落ちない(不変条件5) ---
  section('_npRenderPlayerShow: does not throw without allMatches, or with left/right missing', () => {
    const built = makeBundle({});
    assert.doesNotThrow(() => built._npRenderPlayerShow(baseD({}), 1, 1), 'allMatches無しでも例外なし');
    assert.strictEqual(built._npRenderPlayerShow({ left: null, right: { id: 2 } }, 1, 1), '', 'left/right欠落時は空文字を返す');
  });

  // --- 8c. エスケープ: U5でescHtml()を通すよう修正(旧: 一度も呼ばない既知の欠落だった。不変条件7) ---
  section('_npRenderPlayerShow: now escapes fighter names (fixed in U5, was a known gap)', () => {
    const built = makeBundle({});
    const d = baseD({ left: { id: 1, name: '<script>alert(1)</script>' }, winner: { id: 1 } });
    let html;
    assert.doesNotThrow(() => { html = built._npRenderPlayerShow(d, 1, 1); }, '例外を投げない(不変条件6の派生)');
    assert.ok(!html.includes('<script>alert(1)</script>'), '選手名は生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()でエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 9. _npRenderPage2(過去対戦成績) / _npComputeWarRecord — 団体別の通算戦績
//    (ui-render.js)
// ===========================================================================
(function npWarRecordSuite() {
  const buildCompute = new Function(`${uiRenderFn('_npComputeWarRecord')} return { _npComputeWarRecord };`);
  const computeBuilt = buildCompute();

  function baseState() {
    return {
      roster: [{ id: 1, name: '選手1' }],
      aiOrgs: { org_a: { roster: [{ id: 101, name: '敵1' }] } },
    };
  }

  // --- 9a. _npComputeWarRecord: war/ppv/b3の内訳・通算・連勝が正しく集計される(不変条件4) ---
  section('_npComputeWarRecord: aggregates war/ppv/b3 wins/losses/draws correctly and detects a streak', () => {
    const state = baseState();
    state.h2h = {
      '1>101': { history: [
        { st: 'war', win: 'A', s: 3, w: 5 },
        { st: 'ppv', win: 'B', s: 4, w: 2 },
        { st: 'b3', win: 'd', s: 4, w: 10 },
        { st: 'war', win: 'A', s: 5, w: 1 },
        { st: 'war', win: 'A', s: 5, w: 4 },
        { st: 'show', win: 'A', s: 5, w: 3 }, // 通常興行は集計対象外
      ] },
    };
    const rec = computeBuilt._npComputeWarRecord(state, 'org_a');
    assert.strictEqual(rec.wins, 3, '通算勝ち数(warのみ3勝, showは除外)');
    assert.strictEqual(rec.losses, 1, '通算負け数(ppv 1敗)');
    assert.strictEqual(rec.draws, 1, '通算引き分け数(b3 1分)');
    assert.strictEqual(rec.total, 5);
    assert.deepStrictEqual(rec.byWar, { w: 3, l: 0, d: 0 });
    assert.deepStrictEqual(rec.byPpv, { w: 0, l: 1, d: 0 });
    assert.deepStrictEqual(rec.byB3, { w: 0, l: 0, d: 1 });
    assert.strictEqual(rec.streakKind, 'win', '直近2連勝(s5w4, s5w1)を連勝として検出する');
    assert.strictEqual(rec.streak, 2);
  });

  // --- 9b. 対戦履歴が無いとき(0勝0敗0分)で落ちない(不変条件5) ---
  section('_npComputeWarRecord: returns an all-zero record without throwing when there is no history', () => {
    const state = baseState();
    state.h2h = {};
    let rec;
    assert.doesNotThrow(() => { rec = computeBuilt._npComputeWarRecord(state, 'org_a'); });
    assert.strictEqual(rec.total, 0);
    assert.strictEqual(rec.wins, 0);
    assert.strictEqual(rec.losses, 0);
    assert.strictEqual(rec.draws, 0);
  });

  // --- 9c. _npRenderPage2: 通算戦績が紙面テキストに正しく反映される(実行ベース, 不変条件2, 3, 4) ---
  const buildPage2 = new Function(
    'G', 'Engine', 'RIVAL_ORGS',
    `let _dbCompareTarget = null;
     const NP_KURODA_BYLINE = { news: 'x', rating: 'x', editorial: 'x', rivalry: 'x', warRecord: 'x' };
     ${uiFn('escHtml')}
     ${uiRenderFn('_npPaperHeader')}
     ${uiRenderFn('_npKurodaFaceUrl')}
     ${uiRenderFn('_npOrgEmblem')}
     ${uiRenderFn('_npClickName')}
     ${uiRenderFn('_npFindOrgChampion')}
     ${uiRenderFn('_npComputeWarRecord')}
     ${uiRenderFn('_npThumbBg')}
     ${uiRenderFn('_npStandBg')}
     ${uiRenderFn('_npRenderPage2')}
     return { _npRenderPage2, getCompareTarget: () => _dbCompareTarget };`
  );

  function makePage2D(overrides) {
    return Object.assign({
      summaryText: '互角の戦い', grade: 'B', gradeDesc: '互角',
      playerName: 'プレイヤー団体', playerSubtitle: '', playerTags: [], playerRosterCount: 10,
      pOrgPop: 50, pTop5Ovr: 70, playerScores: { ace: 50, depth: 40, popularity: 60, starPower: 45 },
      rivalName: 'ライバル団体', rivalSubtitle: '', rivalTags: [], rivalRosterCount: 8, rivalTier: 'B',
      rOrgPop: 45, rTop5Ovr: 65, rivalScores: { ace: 55, depth: 35, popularity: 50, starPower: 40 },
      matchups: [], opportunity: '', risk: '', scout: '',
    }, overrides || {});
  }

  function makePage2Bundle(opts) {
    opts = opts || {};
    const d = opts.d || makePage2D();
    const EngineStub = opts.Engine || {
      database: { getOrgCompareAnalysis: () => d },
      util: {
        ov: (f) => Math.round(((f.pw || 0) + (f.sp || 0) + (f.te || 0) + (f.st || 0) + (f.mn || 0)) / 5),
        getPlayerOrgIconPath: () => '', getOrgIconPath: () => '',
      },
    };
    const RIVAL_ORGS_STUB = opts.RIVAL_ORGS || [{ id: 'org_a', name: 'ライバル団体', tier: 'B' }];
    const GStub = opts.G || {
      season: 5, week: 10, rivalOrgNames: {}, titles: {},
      roster: [{ id: 1, name: '選手1' }],
      aiOrgs: { org_a: { roster: [{ id: 101, name: '敵1', pw: 60, sp: 60, te: 60, st: 60, mn: 60, popularity: 50, age: 25 }] } },
    };
    const built = buildPage2(GStub, EngineStub, RIVAL_ORGS_STUB);
    return { built, G: GStub };
  }

  section('_npRenderPage2: renders the war-record numbers (wins/losses/draws + streak) reflecting real h2h data', () => {
    const { built, G } = makePage2Bundle({});
    G.h2h = {
      '1>101': { history: [
        { st: 'war', win: 'A', s: 3, w: 5 },
        { st: 'ppv', win: 'B', s: 4, w: 2 },
        { st: 'b3', win: 'd', s: 4, w: 10 },
        { st: 'war', win: 'A', s: 5, w: 1 },
        { st: 'war', win: 'A', s: 5, w: 4 },
      ] },
    };
    let html;
    assert.doesNotThrow(() => { html = built._npRenderPage2(); }, '例外を投げない(不変条件1)');
    // U5で通算成績の書式を「N勝N敗N分」に統一したが、2026-07-26で実測0件のため「N分」表記自体を撤去。
    // 内部の draws 集計(_npComputeWarRecord)は残るが、表示は「N勝N敗」のみになる。数値そのものが
    // 正しく出ることが本質の不変条件(draws=1でも表示には出ない)。
    assert.ok(html.includes('3勝1敗'), '通算「3勝1敗」が数値どおりに出る(不変条件3, 4)');
    assert.ok(html.includes('3勝0敗'), '対抗戦(war)内訳「3勝0敗」が出る');
    assert.ok(html.includes('0勝1敗'), 'PPV内訳「0勝1敗」が出る');
    assert.ok(html.includes('0勝0敗'), '挑戦状(b3)内訳「0勝0敗」が出る');
    assert.ok(!/\d分/.test(html), '戦績に「N分」表記は出ない(2026-07-26 撤去)');
    assert.ok(html.includes('2連勝中'), '連勝ラベルが出る(不変条件2)');
  });

  section('_npRenderPage2: omits the war-record block entirely at 0-0-0 (no throw, unvariant 5)', () => {
    const { built, G } = makePage2Bundle({});
    G.h2h = {};
    let html;
    assert.doesNotThrow(() => { html = built._npRenderPage2(); });
    assert.ok(!html.includes('np-war-record'), '対戦履歴が無いときは通算成績ブロック自体を出さない(0-0-0の端のケースで落ちない)');
  });

  // U5で escHtml() を通すよう修正(旧: 一度も呼ばない既知の欠落だった。不変条件7)
  section('_npRenderPage2: now escapes the player org name (fixed in U5, was a known gap)', () => {
    const d = makePage2D({ playerName: '<script>alert(1)</script>' });
    const { built } = makePage2Bundle({ d });
    let html;
    assert.doesNotThrow(() => { html = built._npRenderPage2(); }, '例外を投げない(不変条件6の派生)');
    assert.ok(!html.includes('<script>alert(1)</script>'), '団体名(playerName)は生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()でエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 10. 選手ポップアップの通算・直近5戦(showFighterPopup 内, ui-common.js:3591-3611付近) — 対象外
// ===========================================================================
// この勝敗表示は独立関数ではなく、showFighterPopup という664行(約45,600文字)の巨大関数の
// 内部に直接埋め込まれている(タブ切替・チャート・コーチ情報・因縁・特性など無関係な描画が
// すべて同じ関数本体に同居する)。対象箇所(通算勝敗+直近5戦の○×△)だけを取り出す独立関数が
// 無いため、実行するには showFighterPopup 全体を new Function で展開する必要があり、
// その場合 Engine.chronicle 系・グラフ描画・因縁テーブル・特性テーブル・コーチ適性など
// 本題と無関係な依存を大量にスタブしないと動かない。u3/u6が確立した「実関数を最小スタブで
// 動かす」方針の費用対効果が他の10対象と比べて著しく悪いと判断し、本パスでは対象外とした。
// 統一作業(U5)の際にこの通算表示を独立ヘルパー関数へ切り出せば、そのタイミングで
// 同じ手法でテストを追加できる。
console.log('  [skip] fighter popup overall record / last-5 (embedded in showFighterPopup, 664 lines — see comment)');

// ===========================================================================
// 11. ロースター一覧カードの通算 — _renderRosterDetailPanel (ui-render.js)
// ===========================================================================
(function rosterDetailRecordSuite() {
  const build = new Function(
    'Engine', 'G', 'ALL_CHARS', 'getFullUrl', 'getCharCoach', 'getSalary', 'getGrowthTendency',
    'getPotentialPct', 'getPotentialLabel', 'getCoachAssignees', 'COACH_MAX_ASSIGN',
    `let _rosterDetailOpenId = null;
     let _rosterDetailTab = {};
     const STAT_TIPS = {};
     ${uiFn('escHtml')}
     function ov(c) { return Engine.util.ov(c); }
     function _tipAttr() { return ''; }
     function _scale6Style() { return ''; }
     function _popColor() { return '#000'; }
     function _condColor() { return '#000'; }
     ${uiRenderFn('_renderRosterDetailPanel')}
     return { _renderRosterDetailPanel, setOpenId(id) { _rosterDetailOpenId = id; } };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const EngineStub = opts.Engine || {
      util: { ov: (c) => Math.round(((c.pw || 0) + (c.sp || 0) + (c.te || 0) + (c.st || 0) + (c.mn || 0)) / 5), dispPop: (p) => String(p) },
      orgTimeline: { getTenureYears: () => 2 },
      retirement: { getDeclinePresentation: () => ({ stage: 'none' }) },
    };
    const GStub = opts.G || { season: 3, week: 5, weekPhase: 'manage', titles: {} };
    const ALL_CHARS_STUB = opts.ALL_CHARS || [{ id: 1, name: '選手A', style: 'Grappler' }];
    const getFullUrlStub = opts.getFullUrl || ((id) => `image/full/${id}.png`);
    const getCharCoachStub = opts.getCharCoach || (() => null);
    const built = build(
      EngineStub, GStub, ALL_CHARS_STUB, getFullUrlStub, getCharCoachStub,
      () => 15, () => null, () => 40, () => ({ label: '標準', color: '#000' }), () => [], 3
    );
    return built;
  }

  function baseChar(overrides) {
    return Object.assign({
      id: 1, name: '選手A', h: 165, age: 22, style: 'Grappler', role: 'Babyface',
      wins: 10, losses: 3, draws: 1,
      pw: 60, sp: 60, te: 60, st: 60, mn: 60,
      trainCap: { pw: 100, sp: 100, te: 100, st: 100, mn: 100 },
      seasonGrowth: {}, growthLog: [], popularity: 50, condition: 70, traits: [],
    }, overrides || {});
  }

  // --- 11a. 通算戦績が○×の2記号+数値で判別できる(不変条件2, 3)。2026-07-26で△(分け数)表示は撤去 ---
  section('_renderRosterDetailPanel: overall record shows wins/losses distinguishably via ○/× with correct numbers; draws no longer shown', () => {
    const built = makeBundle({});
    let html;
    assert.doesNotThrow(() => { html = built._renderRosterDetailPanel(baseChar({}), []); }, '例外を投げない(不変条件1)');
    assert.ok(/10○/.test(html), '勝ち数10が○付きで出る(不変条件2, 3)');
    assert.ok(/3×/.test(html), '負け数3が×付きで出る');
    assert.ok(!html.includes('1△'), '分け数(draws=1)は△付きで出ない(2026-07-26 撤去。draws自体はデータとして残る)');
  });

  // --- 11b. 0勝0敗・王者バッジで落ちない(不変条件5) ---
  section('_renderRosterDetailPanel: does not throw at 0-0, and shows the champion badge when applicable', () => {
    const built = makeBundle({ G: { season: 3, week: 5, weekPhase: 'manage', titles: { world: { championId: 1 } } } });
    let html;
    assert.doesNotThrow(() => { html = built._renderRosterDetailPanel(baseChar({ wins: 0, losses: 0, draws: 0 }), []); });
    assert.ok(/0○/.test(html) && /0×/.test(html), '0勝0敗でも数値がそのまま出る(端のケース, 不変条件5)');
    assert.ok(!html.includes('0△'), '0△(分け表示)は出ない(2026-07-26 撤去)');
    assert.ok(html.includes('王者'), 'タイトル保持者のとき王者バッジが出る');
  });

  // --- 11c. エスケープ: U5でescHtml()を通すよう修正(旧: 一度も呼ばない既知の欠落だった。不変条件7) ---
  section('_renderRosterDetailPanel: now escapes the fighter name (fixed in U5, was a known gap)', () => {
    const built = makeBundle({});
    const evilChar = baseChar({ name: '<script>alert(1)</script>' });
    let html;
    assert.doesNotThrow(() => { html = built._renderRosterDetailPanel(evilChar, []); }, '例外を投げない(不変条件6の派生)');
    assert.ok(!html.includes('<script>alert(1)</script>'), '選手名(rd-portrait-name等)は生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()でエスケープされた形で出力される');
  });
})();

console.log(`u5-winloss-safety-net-test: ${sectionsRun} sections ok, ${KNOWN_GAPS.length} known gaps logged`);
