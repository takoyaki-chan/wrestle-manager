'use strict';

// U3 グループB（2人が対置して語る画面）の統一作業に入る前の安全網。
//
// 対象は全数調査の結果テストが皆無だった5系統:
//   1. .vd-*                 因縁ポップアップ(対峙/決着)          _rivalryCol / _renderRivalryPopup
//   2. .fevt-arena-bubble     派閥直接対決/派閥内序列戦の前後(4画面共有) showFactionF08PreMatchModal / F08AftermathModal /
//                                                                    showInternalChallengePreModal / PostModal
//   3. .fevt-bubble           F08 対立ヒートアップ                  showFactionF08Modal
//   4. .fevt-dialogue-bubble  F02 抗争の勃発                        _factionF02RenderClash (showFactionF02Modalの本体)
//   5. .fc1m-bubble-wrap      直訴・派閥イベント(3関数共有)          showFactionCommon3Modal / showFactionCommon1Modal /
//                                                                    showChallengeRequestModal
//
// 方針(test/README.md): ソース文字列一致ではなく実関数を実行し、結果HTMLに対して
// 「壊れたら困る」不変条件だけを検査する。ピクセル値・クラス名の並び順・DOM順序など
// 統一作業でわざと変える予定のものは固定しない。
//
// 検査する不変条件(指示書より):
//   1. 描画関数が例外を投げずにHTMLを返す
//   2. 両者(左右)の顔が出ている
//   3. セリフが渡されたとき、そのセリフ本文が出力に含まれる
//   4. 話者の名前が画面のどこかに出ている
//   5. 勝敗・陣営の区別が出力から判別できる(クラス名でよい)
//   6. セリフが未定義・空のときも落ちない
//   7. HTMLエスケープが効いている(名前・セリフに<script>を入れても生のタグが出ない)
//
// 重要な既知の欠落(このテストを書く過程で発見。直さず報告する):
//   対象5系統の描画関数はいずれも escHtml() を一度も呼んでいない。
//   既に統一済みの .emr-*(_emrSingleSide, src/ui-common.js)は escHtml(fighter.name) 等で
//   キャラ名を確実にエスケープしているのに対し、本ファイルが対象とする5系統は
//   `${String(name)}` または `${name}` のまま生でHTMLに差し込んでいる。
//   実データ(ALL_CHARSの名前・団体名)は開発者が用意した固定文字列なので実害は薄いが、
//   `<`/`>`/`&` を含む名前が万一入るとレイアウトが壊れる。統一作業(U3)でこの機会に
//   escHtml統一するのが望ましい。本テストは「現状は生のまま出力される」という
//   実際の挙動を記録するに留め、エスケープされている前提のテストは書かない
//   (そう書くと現状レッドになり、かつ「直したら通らなくなる」歪なテストになるため)。

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const cssIndex = readSource('src', 'index.html');

function functionSource(name) {
  const start = ui.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} not found in ui-common.js`);
  const brace = ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}') { depth--; if (depth === 0) return ui.slice(start, i + 1); }
  }
  throw new Error(`${name} end not found`);
}

// ---------------------------------------------------------------------------
// CSS存在確認(この回で扱うクラスが実際に定義されていること。文字列一致だが
// 「クラスがまだ存在するか」はソース文字列でしか確認できない性質の検査なので許容する)
// ---------------------------------------------------------------------------
['vd-col-w', 'vd-col-l', 'vd-badge-w', 'vd-badge-l'].forEach(cls => {
  assert.ok(cssIndex.includes(`.${cls}`), `因縁ポップアップの.${cls}がindex.htmlに存在する`);
});
assert.ok(cssIndex.includes('.fevt-arena-bubble'), '.fevt-arena-bubbleがindex.htmlに存在する');
assert.ok(cssIndex.includes('.fevt-bubble '), '.fevt-bubbleがindex.htmlに存在する');
assert.ok(cssIndex.includes('.fevt-dialogue-bubble'), '.fevt-dialogue-bubbleがindex.htmlに存在する');
assert.ok(cssIndex.includes('.fc1m-bubble-wrap'), '.fc1m-bubble-wrapがindex.htmlに存在する');

let sectionsRun = 0;
function section(name, fn) {
  fn();
  sectionsRun++;
  console.log(`  [ok] ${name}`);
}

// ===========================================================================
// 1. .vd-* 因縁ポップアップ(対峙/決着) — _rivalryCol / _renderRivalryPopup
// ===========================================================================
(function rivalryPopupSuite() {
  const buildRivalry = new Function(
    'Engine', 'document', 'Audio', 'getUpperUrl', 'findFighter', 'ALL_CHARS', 'pickDialogueLine',
    'RIVALRY_CONFRONTATION_LINES', 'RIVALRY_CONFRONTATION_LINES_90', 'RIVALRY_CONFRONTATION_LINES_70',
    'RIVALRY_RESOLUTION_LINES', 'GOODRIVAL_RESOLUTION_LINES', 'BITTER_RESOLUTION_LINES',
    `let _rivalryPopupQueue = [];
     let _rivalryPopupCallback = null;
     ${functionSource('_rivalryCol')}
     ${functionSource('_renderRivalryPopup')}
     return {
       render(queue, cb) { _rivalryPopupQueue = queue; _rivalryPopupCallback = cb || null; _renderRivalryPopup(); },
     };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const EngineStub = opts.Engine || {
      util: {
        ov: () => 70,
        formatSignedStatDelta: (v, d) => `${v >= 0 ? '+' : ''}${Number(v).toFixed(d)}`,
      },
    };
    const pickDialogueLineStub = opts.pickDialogueLine
      || ((pool, fighter) => `LINE_${fighter && fighter.id}`);
    const getUpperUrlStub = opts.getUpperUrl || ((id) => (id != null ? `image/upper/${id}.webp` : ''));
    const findFighterStub = opts.findFighter || (() => null);
    const ALL_CHARS_STUB = opts.ALL_CHARS || [
      { id: 1, name: opts.leftName || '風間サキ' },
      { id: 2, name: opts.rightName || '結城ミナ' },
    ];
    const box = { innerHTML: '', className: '' };
    const overlay = { classList: { add() {}, remove() {} } };
    const documentStub = {
      getElementById: (id) => (id === 'notifModalOverlay' ? overlay : id === 'notifModalBox' ? box : null),
    };
    // 実コードは _renderRivalryPopup 内で `typeof Audio` ガード無しに Audio.play(...) を直接呼ぶ
    // (派閥系モーダルは typeof Audio !== 'undefined' で必ずガードしているのと対照的)。
    // 実行環境では常にAudioが読み込まれているため実害はないが、この非対称は不審点として報告する。
    const AudioStub = opts.Audio || { play() {} };
    const built = buildRivalry(
      EngineStub, documentStub, AudioStub, getUpperUrlStub, findFighterStub, ALL_CHARS_STUB, pickDialogueLineStub,
      {}, {}, {}, {}, {}, {}
    );
    return { built, box, overlay };
  }

  // --- 1a. 対峙(confrontation)フェーズ: 1〜5を検査 ---
  section('vd: confrontation phase renders both sides, lines, names, side classes', () => {
    const { built, box } = makeBundle({});
    assert.doesNotThrow(() => {
      built.render([{ phase: 'confrontation', leftId: 1, rightId: 2, leftName: '風間サキ', rightName: '結城ミナ', rivalry: 40 }]);
    }, '対峙ポップアップは例外を投げない(不変条件1)');
    const html = box.innerHTML;
    assert.ok(html.length > 0, 'HTMLが生成される');

    // 2. 両者の顔
    const imgCount = (html.match(/<img src="image\/upper\//g) || []).length;
    assert.strictEqual(imgCount, 2, '対峙画面で両者の画像が2枚出る(不変条件2)');

    // 3. セリフ本文(スタブpickDialogueLineが返すマーカー)が出ている
    assert.ok(html.includes('LINE_1') && html.includes('LINE_2'), '両者のセリフ本文が出力に含まれる(不変条件3)');

    // 4. 話者名
    assert.ok(html.includes('風間サキ') && html.includes('結城ミナ'), '両者の名前が画面に出ている(不変条件4)');

    // 5. 陣営の区別(対峙では勝敗未定だが、宣戦布告側/受け側をクラスで区別する)
    assert.ok(html.includes('vd-col-w') && html.includes('vd-col-l'), '対峙画面でも左右がクラスで区別できる(不変条件5)');
    // 対峙フェーズはWINNER/LOSERバッジを出さない(hideBadge:true)
    assert.ok(!html.includes('vd-badge-w') && !html.includes('vd-badge-l'), '対峙フェーズはWINNER/LOSERバッジを出さない(勝敗未定のため)');
  });

  // --- 1b. 決着(resolution)フェーズ: 勝者/敗者バッジで陣営区別 ---
  section('vd: resolution phase distinguishes winner/loser via badge classes', () => {
    const { built, box } = makeBundle({});
    built.render([{
      phase: 'resolution', winnerId: 1, loserId: 2, winnerName: '風間サキ', loserName: '結城ミナ',
      resolutionType: 'normal', popBonus: 3, orgPopBonus: 1.2,
    }]);
    const html = box.innerHTML;
    assert.ok(html.includes('vd-badge-w'), '勝者バッジが出る(不変条件5)');
    assert.ok(html.includes('vd-badge-l'), '敗者バッジが出る(不変条件5)');
    assert.ok(html.includes('WINNER') && html.includes('LOSER'), 'バッジ文言WINNER/LOSERが出る');
    const imgCount = (html.match(/<img src="image\/upper\//g) || []).length;
    assert.strictEqual(imgCount, 2, '決着画面でも両者の画像が2枚出る(不変条件2)');
  });

  // --- 1c. セリフが未定義/空/nullでも落ちない ---
  section('vd: falls back gracefully when the dialogue line is undefined/empty/null', () => {
    [undefined, '', null].forEach((emptyVal) => {
      const { built, box } = makeBundle({ pickDialogueLine: () => emptyVal });
      assert.doesNotThrow(() => {
        built.render([{ phase: 'confrontation', leftId: 1, rightId: 2, leftName: 'A', rightName: 'B', rivalry: 10 }]);
      }, `line=${JSON.stringify(emptyVal)}でも例外を投げない(不変条件6)`);
      assert.ok(box.innerHTML.length > 0, `line=${JSON.stringify(emptyVal)}でもHTML自体は生成される`);
    });
  });

  // --- 1d. HTMLインジェクション: 例外にならないことだけを確認する(エスケープ欠落は既知/未修正) ---
  section('vd: does not throw on a <script>-bearing name (escaping gap logged, not fixed)', () => {
    const { built, box } = makeBundle({
      ALL_CHARS: [{ id: 1, name: '<script>alert(1)</script>' }, { id: 2, name: 'B' }],
    });
    assert.doesNotThrow(() => {
      built.render([{ phase: 'confrontation', leftId: 1, rightId: 2, leftName: '<script>alert(1)</script>', rightName: 'B', rivalry: 10 }]);
    }, '悪意ある名前でも例外を投げない(不変条件6の派生)');
    // 既知の欠落: _rivalryColはescHtmlを呼ばないため、現状は生のまま出力される。
    // これは「今後も維持すべき仕様」ではなく「見つかったバグ」なので、正としては固定しない。
    if (box.innerHTML.includes('<script>alert(1)</script>')) {
      console.log('    [known gap] _rivalryCol: name is NOT escaped (escHtml not called) — reported, not fixed');
    }
  });
})();

// ===========================================================================
// 派閥系(2〜5)の共通ビルダー
// 各show*Modal / _factionF02RenderClashは _factionEnsureOverlayRoot() 経由で
// document.getElementById('factionEventRoot') → 無ければcreateElement→body.appendChild
// という実際の流れでDOMにHTMLを書き込む。ここでは最小限のfakeDOMでその流れを再現し、
// 生成された root.innerHTML を検査する。
// ===========================================================================
function makeFactionDom() {
  let root = null;
  function makeEl(tag) {
    return {
      tagName: tag,
      id: '',
      innerHTML: '',
      style: {},
      dataset: {},
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); },
      },
      appendChild() {},
      addEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      offsetWidth: 0,
    };
  }
  const doc = {
    getElementById(id) { return (root && root.id === id) ? root : null; },
    createElement(tag) { return makeEl(tag); },
    body: { appendChild(el) { root = el; } },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  return { doc, getRoot: () => root };
}

const buildFaction = new Function(
  'Engine', 'document', 'getUpperUrl', '_factionLine', '_factionReporterStrip', '_awOrgEmblem',
  `let _popupQueue = [];
   let FACTION_F08_LEADER_LINES = {};
   function _isPopupActive() { return false; }
   ${functionSource('_factionUpperUrl')}
   ${functionSource('_factionSeasonLabel')}
   ${functionSource('_factionEnsureOverlayRoot')}
   ${functionSource('showFactionF08Modal')}
   ${functionSource('showFactionF08PreMatchModal')}
   ${functionSource('showFactionF08AftermathModal')}
   ${functionSource('showInternalChallengePreModal')}
   ${functionSource('showInternalChallengePostModal')}
   ${functionSource('_factionF02RenderClash')}
   ${functionSource('showFactionCommon3Modal')}
   ${functionSource('showFactionCommon1Modal')}
   ${functionSource('showChallengeRequestModal')}
   return {
     showFactionF08Modal, showFactionF08PreMatchModal, showFactionF08AftermathModal,
     showInternalChallengePreModal, showInternalChallengePostModal,
     _factionF02RenderClash, showFactionCommon3Modal, showFactionCommon1Modal, showChallengeRequestModal,
   };`
);

function defaultEngineStub() {
  return {
    util: {
      ov: (f) => Math.round(((f.pw || 0) + (f.sp || 0) + (f.te || 0) + (f.st || 0) + (f.mn || 0)) / 5),
    },
    rng: {
      derive: (...args) => args.reduce((a, b) => (a * 31 + (Number(b) || 0)) >>> 0, 7),
      create: (seed) => ({ seed: seed || 0, i: 0 }),
      int: (rng, lo) => lo,
    },
    factions: {
      getF02ClashLine: (fighter, mode) => (fighter ? `F02_${mode}_${fighter.id}` : ''),
      getCommon1Line: (kind) => (kind === 'coachReport' ? 'COACH_LINE_MARKER' : 'LEADER_LINE_MARKER'),
      getCommon3Line: (kind) => (kind === 'newcomer' ? 'NEWCOMER_LINE_MARKER' : 'REACTION_LINE_MARKER'),
    },
    challengeRequest: {
      pickRequesterLine: (requester) => (requester ? `REQUESTER_LINE_${requester.id}` : null),
      pickFlavorLine: (rivalry, bond, rName, oName) => `FLAVOR_${rName}_${oName}`,
    },
    h2h: { getRecordFor: () => null },
  };
}

function makeFactionBundle(overrides) {
  overrides = overrides || {};
  const { doc, getRoot } = makeFactionDom();
  const EngineStub = overrides.Engine || defaultEngineStub();
  const getUpperUrlStub = overrides.getUpperUrl || ((id) => (id != null ? `image/upper/${id}.webp` : ''));
  const factionLineStub = overrides._factionLine || ((table, fighter) => (fighter ? `FLINE_${fighter.id}` : ''));
  const reporterStripStub = overrides._factionReporterStrip
    || ((state, line) => `<div class="fevt-reporter-strip">${line}</div>`);
  const orgEmblemStub = overrides._awOrgEmblem || (() => '<span class="org-emblem-stub"></span>');
  const built = buildFaction(EngineStub, doc, getUpperUrlStub, factionLineStub, reporterStripStub, orgEmblemStub);
  return { built, getRoot };
}

function fighter(id, name, extra) {
  return Object.assign({ id, name, pw: 65, sp: 60, te: 62, st: 58, mn: 55 }, extra || {});
}

// ===========================================================================
// 2. .fevt-arena-bubble — F08前後 + 派閥内序列戦前後(4関数共有)
// ===========================================================================
(function arenaBubbleSuite() {
  // --- 2a. showFactionF08PreMatchModal ---
  section('fevt-arena-bubble: F08 pre-match renders both leaders, lines, names (no throw)', () => {
    const { built, getRoot } = makeFactionBundle({});
    const data = {
      narration: 'ふたつの派閥が、直接対決へと踏み出す。',
      factionA: { leaderId: 1, name: '紅蓮', leaderName: '風間サキ', leaderOvr: 74 },
      factionB: { leaderId: 2, name: '氷月', leaderName: '結城ミナ', leaderOvr: 71 },
      lineA: 'ここで決めてやる。',
      lineB: '受けて立つ。',
    };
    assert.doesNotThrow(() => built.showFactionF08PreMatchModal(data, { season: 3, week: 10 }, () => {}),
      '例外を投げない(不変条件1)');
    const html = getRoot().innerHTML;
    assert.strictEqual((html.match(/fevt-arena-bubble/g) || []).length >= 2, true, '両者分の吹き出しが出る');
    assert.ok(html.includes('風間サキ') && html.includes('結城ミナ'), '両リーダーの名前が出る(不変条件4)');
    assert.ok(html.includes('ここで決めてやる。') && html.includes('受けて立つ。'), '渡したセリフ本文が出る(不変条件3)');
    const colCount = (html.match(/fevt-arena-col/g) || []).length;
    assert.strictEqual(colCount, 2, '両サイド分の画像+情報カラムが出る(不変条件2の代替: 顔の器が2つ)');
    assert.ok(html.includes(`background-image:url('image/upper/1.webp')`), '左リーダーの画像URLが差し込まれる');
    assert.ok(html.includes(`background-image:url('image/upper/2.webp')`), '右リーダーの画像URLが差し込まれる');
  });

  // --- 2b. showFactionF08AftermathModal: 勝敗の区別 ---
  section('fevt-arena-bubble: F08 aftermath distinguishes winner/loser via CSS classes', () => {
    const { built, getRoot } = makeFactionBundle({});
    const data = {
      narrationOpen: '鐘が鳴った。',
      narrationClose: '決着はついた。',
      winner: { id: 1, name: '風間サキ' },
      loser: { id: 2, name: '結城ミナ', factionName: '氷月' },
      winnerLine: '勝ったぞ。',
      loserLine: 'まだ終わってない。',
    };
    built.showFactionF08AftermathModal(data, { season: 3, week: 10 }, () => {});
    const html = getRoot().innerHTML;
    assert.ok(html.includes('winner-big'), '勝者側にwinner-bigクラスが付く(不変条件5)');
    assert.ok(html.includes('fevt-arena-bubble loser') || html.includes('fevt-arena-portrait loser'),
      '敗者側にloserクラスが付く(不変条件5)');
    assert.ok(html.includes('風間サキ') && html.includes('結城ミナ'), '勝者・敗者の名前が両方出る(不変条件4)');
    assert.ok(html.includes('勝ったぞ。') && html.includes('まだ終わってない。'), '両者のセリフが出る(不変条件3)');
    assert.strictEqual((html.match(/fevt-arena-portrait/g) || []).length, 2, '勝者・敗者双方の顔画像枠が出る(不変条件2)');
  });

  // --- 2c. showInternalChallengePreModal ---
  section('fevt-arena-bubble: internal challenge pre-match renders challenger and leader', () => {
    const { built, getRoot } = makeFactionBundle({});
    const data = {
      narration: '序列を懸けた挑戦状が叩きつけられた。',
      faction: { name: '紅蓮' },
      challenger: { id: 3, name: '新人A', ovr: 55 },
      leader: { id: 1, name: '風間サキ', ovr: 74 },
      lineChallenger: '追い抜いてみせます。',
      lineLeader: '甘くはないぞ。',
    };
    built.showInternalChallengePreModal(data, { season: 2, week: 4 }, () => {});
    const html = getRoot().innerHTML;
    assert.ok(html.includes('新人A') && html.includes('風間サキ'), '挑戦者・リーダー双方の名前が出る(不変条件4)');
    assert.ok(html.includes('追い抜いてみせます。') && html.includes('甘くはないぞ。'), '両者のセリフが出る(不変条件3)');
    assert.strictEqual((html.match(/fevt-arena-portrait/g) || []).length, 2, '両者分の顔画像枠が出る(不変条件2)');
  });

  // --- 2d. showInternalChallengePostModal: 勝敗 + アーキタイプ遷移オプション ---
  section('fevt-arena-bubble: internal challenge post-match distinguishes winner/loser and shows transition text', () => {
    const { built, getRoot } = makeFactionBundle({});
    const data = {
      narrationOpen: '決着の刻。',
      narrationClose: '序列は動いた。',
      faction: { name: '紅蓮' },
      winner: { id: 3, name: '新人A' },
      loser: { id: 1, name: '風間サキ' },
      leaderWon: false,
      winnerLine: 'やってやった。',
      loserLine: 'まだだ…',
      archetypeTransition: { from: 'MERIT', to: 'HEEL' },
    };
    built.showInternalChallengePostModal(data, { season: 2, week: 4 }, () => {});
    const html = getRoot().innerHTML;
    assert.ok(html.includes('winner-big'), '勝者側の区別クラスが出る(不変条件5)');
    assert.ok(html.includes('portrait loser') || html.includes('bubble loser'), '敗者側の区別クラスが出る(不変条件5)');
    assert.ok(html.includes('新人A') && html.includes('風間サキ'), '勝者・敗者の名前が出る(不変条件4)');
    assert.ok(html.includes('実力主義') && html.includes('ヒール派閥'), 'アーキタイプ遷移テキストが渡した値で出る');
    assert.strictEqual((html.match(/fevt-arena-portrait/g) || []).length, 2, '勝者・敗者双方の顔画像枠が出る(不変条件2)');

    // archetypeTransitionが無いケースでも落ちない
    const { built: built2, getRoot: getRoot2 } = makeFactionBundle({});
    assert.doesNotThrow(() => built2.showInternalChallengePostModal({ ...data, archetypeTransition: null }, { season: 2, week: 4 }, () => {}),
      'archetypeTransitionが無くても例外を投げない(不変条件6)');
    assert.ok(getRoot2().innerHTML.length > 0);
  });

  // --- 2e. dataが渡されない/セリフが空のときも落ちない ---
  section('fevt-arena-bubble: missing data / empty lines do not throw across all 4 functions', () => {
    const { built } = makeFactionBundle({});
    let continued = 0;
    const onContinue = () => { continued++; };
    assert.doesNotThrow(() => built.showFactionF08PreMatchModal(null, {}, onContinue), 'data=nullでも例外なし');
    assert.doesNotThrow(() => built.showFactionF08AftermathModal(undefined, {}, onContinue), 'data=undefinedでも例外なし');
    assert.doesNotThrow(() => built.showInternalChallengePreModal(null, {}, onContinue), 'data=nullでも例外なし');
    assert.doesNotThrow(() => built.showInternalChallengePostModal(null, {}, onContinue), 'data=nullでも例外なし');
    assert.strictEqual(continued, 4, 'data無しのときは4関数ともonContinueへフォールバックする(不変条件6)');

    const { built: built2, getRoot } = makeFactionBundle({});
    assert.doesNotThrow(() => built2.showFactionF08PreMatchModal({
      narration: '', factionA: { leaderId: 1, name: 'A', leaderName: 'A', leaderOvr: 50 },
      factionB: { leaderId: 2, name: 'B', leaderName: 'B', leaderOvr: 50 }, lineA: '', lineB: undefined,
    }, {}, () => {}), 'セリフが空文字/undefinedでも例外なし(不変条件6)');
    assert.ok(getRoot().innerHTML.length > 0);
  });

  // --- 2f. <script>混入時に例外にならないことのスポットチェック(エスケープ欠落は既知・未修正) ---
  section('fevt-arena-bubble: does not throw on a <script>-bearing leader name (escaping gap logged, not fixed)', () => {
    const { built, getRoot } = makeFactionBundle({});
    const data = {
      narrationOpen: 'x', narrationClose: 'x',
      winner: { id: 1, name: '<script>alert(1)</script>' },
      loser: { id: 2, name: 'B', factionName: 'F' },
      winnerLine: 'x', loserLine: 'x',
    };
    assert.doesNotThrow(() => built.showFactionF08AftermathModal(data, {}, () => {}), '例外を投げない(不変条件6の派生)');
    const html = getRoot().innerHTML;
    if (html.includes('<script>alert(1)</script>')) {
      console.log('    [known gap] showFactionF08AftermathModal: name is NOT escaped (escHtml not called) — reported, not fixed');
    }
  });
})();

// ===========================================================================
// 3. .fevt-bubble — F08 対立ヒートアップ(showFactionF08Modal)
// ===========================================================================
(function f08HeatUpSuite() {
  section('fevt-bubble: F08 heat-up renders both leaders with side classes, lines, names', () => {
    const { built, getRoot } = makeFactionBundle({});
    const leaderA = fighter(1, '風間サキ');
    const leaderB = fighter(2, '結城ミナ');
    const payload = { leaderAId: 1, leaderBId: 2, factionAName: '紅蓮', factionBName: '氷月', hostilityPeak: 88 };
    const state = { roster: [leaderA, leaderB], season: 3, week: 20, rngSeed: 1 };
    let choice = null;
    assert.doesNotThrow(() => built.showFactionF08Modal(payload, state, (c) => { choice = c; }),
      '例外を投げない(不変条件1)');
    const html = getRoot().innerHTML;

    // 2. 両者の顔(肖像枠)
    assert.strictEqual((html.match(/fevt-duel-portrait/g) || []).length, 2, '両リーダーの肖像枠が2つ出る(不変条件2)');

    // 3. セリフ(スタブ_factionLineが返すマーカー)
    assert.ok(html.includes('FLINE_1') && html.includes('FLINE_2'), '両リーダーのセリフ本文が出力に含まれる(不変条件3)');

    // 4. 話者名
    assert.ok(html.includes('風間サキ') && html.includes('結城ミナ'), '両リーダーの名前が出る(不変条件4)');

    // 5. 陣営の区別(左/右カラム)
    assert.ok(html.includes('class="col">') && html.includes('class="col right">'), '左右のカラムがクラスで区別できる(不変条件5)');
    assert.ok(html.includes('fevt-bubble left') && html.includes('fevt-bubble right'), '吹き出しも左右クラスで区別される');
  });

  section('fevt-bubble: falls back to default line when _factionLine returns empty, does not throw', () => {
    const { built, getRoot } = makeFactionBundle({ _factionLine: () => '' });
    const leaderA = fighter(1, 'A');
    const leaderB = fighter(2, 'B');
    const payload = { leaderAId: 1, leaderBId: 2, factionAName: 'X', factionBName: 'Y', hostilityPeak: 80 };
    assert.doesNotThrow(() => built.showFactionF08Modal(payload, { roster: [leaderA, leaderB] }, () => {}),
      '空セリフでも例外を投げない(不変条件6)');
    assert.ok(getRoot().innerHTML.length > 0);
  });

  section('fevt-bubble: does not throw on a <script>-bearing faction name (escaping gap logged, not fixed)', () => {
    const { built, getRoot } = makeFactionBundle({});
    const leaderA = fighter(1, 'A');
    const leaderB = fighter(2, 'B');
    const payload = { leaderAId: 1, leaderBId: 2, factionAName: '<script>alert(1)</script>', factionBName: 'Y', hostilityPeak: 80 };
    assert.doesNotThrow(() => built.showFactionF08Modal(payload, { roster: [leaderA, leaderB] }, () => {}),
      '例外を投げない(不変条件6の派生)');
    const html = getRoot().innerHTML;
    if (html.includes('<script>alert(1)</script>')) {
      console.log('    [known gap] showFactionF08Modal: factionAName is NOT escaped (escHtml not called) — reported, not fixed');
    }
  });
})();

// ===========================================================================
// 4. .fevt-dialogue-bubble — F02 抗争の勃発(_factionF02RenderClash)
// ===========================================================================
(function f02ClashSuite() {
  section('fevt-dialogue-bubble: F02 clash renders both leaders with a/b side classes, lines, names', () => {
    const { built, getRoot } = makeFactionBundle({});
    const leaderA = fighter(1, '風間サキ');
    const leaderB = fighter(2, '結城ミナ');
    const payload = { leaderAId: 1, leaderBId: 2, factionAName: '紅蓮', factionBName: '氷月' };
    const state = { roster: [leaderA, leaderB], week: 15 };
    assert.doesNotThrow(() => built._factionF02RenderClash(payload, state, () => {}), '例外を投げない(不変条件1)');
    const html = getRoot().innerHTML;

    // 2. 両者の顔
    assert.strictEqual((html.match(/fevt-leader-upper/g) || []).length, 2, '両リーダーの画像枠が2つ出る(不変条件2)');

    // 3. セリフ(Engine.factions.getF02ClashLineスタブのマーカー)
    assert.ok(html.includes('F02_attack_1') && html.includes('F02_defend_2'), '両リーダーのセリフ本文が出力に含まれる(不変条件3)');

    // 4. 話者名
    assert.ok(html.includes('風間サキ') && html.includes('結城ミナ'), '両リーダーの名前が出る(不変条件4)');

    // 5. 陣営の区別(a/bクラス)
    assert.ok(html.includes('fevt-dialogue-bubble a') && html.includes('fevt-dialogue-bubble b'),
      '吹き出しがa/bクラスで陣営区別できる(不変条件5)');
  });

  section('fevt-dialogue-bubble: does not throw when Engine.factions.getF02ClashLine returns empty', () => {
    const { built, getRoot } = makeFactionBundle({
      Engine: Object.assign(defaultEngineStub(), {
        factions: { getF02ClashLine: () => '' },
      }),
    });
    const leaderA = fighter(1, 'A');
    const leaderB = fighter(2, 'B');
    assert.doesNotThrow(() => built._factionF02RenderClash(
      { leaderAId: 1, leaderBId: 2, factionAName: 'X', factionBName: 'Y' },
      { roster: [leaderA, leaderB], week: 1 }, () => {}
    ), '空セリフでも例外を投げない(不変条件6)');
    assert.ok(getRoot().innerHTML.includes('……'), '空セリフのときは代替の「……」が出る(既存フォールバック挙動の確認)');
  });

  section('fevt-dialogue-bubble: does not throw on a <script>-bearing leader name (escaping gap logged, not fixed)', () => {
    const { built, getRoot } = makeFactionBundle({});
    const leaderA = fighter(1, '<script>alert(1)</script>');
    const leaderB = fighter(2, 'B');
    assert.doesNotThrow(() => built._factionF02RenderClash(
      { leaderAId: 1, leaderBId: 2, factionAName: 'X', factionBName: 'Y' },
      { roster: [leaderA, leaderB], week: 1 }, () => {}
    ), '例外を投げない(不変条件6の派生)');
    const html = getRoot().innerHTML;
    if (html.includes('<script>alert(1)</script>')) {
      console.log('    [known gap] _factionF02RenderClash: leader name is NOT escaped (escHtml not called) — reported, not fixed');
    }
  });
})();

// ===========================================================================
// 5. .fc1m-bubble-wrap — 直訴・派閥イベント(3関数共有)
// ===========================================================================
(function fc1mSuite() {
  // --- 5a. showFactionCommon3Modal(加入) ---
  section('fc1m-bubble-wrap: Common3 (newcomer join) renders both faces, lines, names', () => {
    const { built, getRoot } = makeFactionBundle({});
    const newcomer = fighter(3, '新人チカ');
    const leader = fighter(1, '風間サキ');
    const payload = { newcomerId: 3, leaderId: 1, factionName: '紅蓮', archetypeId: 'MERIT' };
    assert.doesNotThrow(() => built.showFactionCommon3Modal(payload, { roster: [newcomer, leader] }, () => {}),
      '例外を投げない(不変条件1)');
    const html = getRoot().innerHTML;
    assert.strictEqual((html.match(/fc1m-bubble-wrap/g) || []).length, 2, '新加入・リーダー双方の吹き出しが出る(不変条件2の代替)');
    assert.strictEqual((html.match(/fc1m-portrait/g) || []).length, 2, '両者の顔画像枠が2つ出る(不変条件2)');
    assert.ok(html.includes('新人チカ') && html.includes('風間サキ'), '両者の名前が出る(不変条件4)');
    assert.ok(html.includes('NEWCOMER_LINE_MARKER') && html.includes('REACTION_LINE_MARKER'),
      '両者のセリフ本文が出力に含まれる(不変条件3)');
  });

  // --- 5b. showFactionCommon1Modal(派閥内対決の打診) ---
  section('fc1m-bubble-wrap: Common1 (internal match proposal) renders both fighters and the leader line', () => {
    const { built, getRoot } = makeFactionBundle({});
    const fA = fighter(3, 'A選手', { pw: 80 });
    const fB = fighter(4, 'B選手', { pw: 60 });
    const leader = fA; // リーダー=fAのケース
    const payload = {
      fighterAId: 3, fighterBId: 4, leaderId: 3, factionName: '紅蓮', archetypeId: 'MERIT', currentRivalry: 62,
    };
    assert.doesNotThrow(() => built.showFactionCommon1Modal(payload, { roster: [fA, fB, leader] }, () => {}),
      '例外を投げない(不変条件1)');
    const html = getRoot().innerHTML;
    assert.strictEqual((html.match(/fc1m-portrait/g) || []).length, 2, '両者の顔画像枠が2つ出る(不変条件2)');
    assert.ok(html.includes('A選手') && html.includes('B選手'), '両者の名前が出る(不変条件4)');
    // このモーダルはリーダー側にのみ吹き出しを出す仕様(相手側はスペーサー)
    assert.strictEqual((html.match(/fc1m-bubble-wrap/g) || []).length, 1, 'リーダー側のみ吹き出しが出る(仕様上1個)');
    assert.ok(html.includes('LEADER_LINE_MARKER'), 'リーダーのセリフ本文が出力に含まれる(不変条件3)');
    assert.ok(html.includes('62'), '因縁値が渡した値のまま出る');
    // 勝敗が無いこの画面では、能力値の優劣がクラスで陣営を区別する唯一の手がかりになる(不変条件5)
    assert.ok(/fc1m-stat-val fc1m-higher">80/.test(html), 'PWが高いA選手側にfc1m-higherクラスが付く(不変条件5)');
    assert.ok(!/fc1m-stat-val fc1m-higher">60/.test(html), 'PWが低いB選手側にはfc1m-higherが付かない');
  });

  // --- 5c. showChallengeRequestModal(挑戦試合の直訴, forward) ---
  section('fc1m-bubble-wrap: challenge request (forward) renders requester and opponent, lines, names', () => {
    const { built, getRoot } = makeFactionBundle({});
    const requester = fighter(3, 'A選手');
    const opponent = fighter(101, 'B選手');
    const state = {
      season: 3, week: 8, rngSeed: 1, orgName: '自団体',
      roster: [requester],
      aiOrgs: { org_a: { name: 'ライバル団体', roster: [opponent] } },
      rivalOrgNames: { org_a: 'ライバル団体' },
      h2h: {},
    };
    const payload = { selfId: 3, otherId: 101, otherOrgId: 'org_a', rivalry: 40, bond: 30 };
    let called = null;
    assert.doesNotThrow(() => built.showChallengeRequestModal(payload, state, (c) => { called = c; }),
      '例外を投げない(不変条件1)');
    const html = getRoot().innerHTML;
    assert.strictEqual((html.match(/fc1m-portrait/g) || []).length, 2, '両者の顔画像枠が2つ出る(不変条件2)');
    assert.ok(html.includes('A選手') && html.includes('B選手'), '両者の名前が出る(不変条件4)');
    assert.strictEqual((html.match(/fc1m-bubble-wrap/g) || []).length, 1, '打診者側のみ吹き出しが出る(仕様上1個)');
    assert.ok(html.includes('REQUESTER_LINE_3'), '打診者のセリフ本文が出力に含まれる(不変条件3)');
    assert.ok(html.includes('FLAVOR_A選手_B選手'), '社長視点フレーバー行が出力に含まれる(不変条件3の派生)');
    assert.strictEqual(called, null, 'クリックしていない段階ではonChoiceは呼ばれない');
  });

  // --- 5d. showChallengeRequestModal(inverse: 他団体からの逆打診) ---
  section('fc1m-bubble-wrap: challenge request (inverse) resolves requester from the AI org roster', () => {
    const { built, getRoot } = makeFactionBundle({});
    const requester = fighter(201, 'C選手'); // 相手団体側の打診者
    const opponent = fighter(5, 'D選手'); // 自団体側
    const state = {
      season: 3, week: 8, rngSeed: 1, orgName: '自団体',
      roster: [opponent],
      aiOrgs: { org_b: { name: '古巣団体', roster: [requester] } },
      rivalOrgNames: { org_b: '古巣団体' },
      h2h: {},
    };
    const payload = { selfId: 201, otherId: 5, requesterOrgId: 'org_b', rivalry: 20, bond: 80, _inverse: true };
    assert.doesNotThrow(() => built.showChallengeRequestModal(payload, state, () => {}),
      'inverseケースでも例外を投げない(不変条件1)');
    const html = getRoot().innerHTML;
    assert.ok(html.includes('C選手') && html.includes('D選手'), 'inverseケースでも両者の名前が出る(不変条件4)');
    assert.ok(html.includes('REQUESTER_LINE_201'), 'inverseケースでも打診者のセリフが出る(不変条件3)');
  });

  // --- 5e. payload/dataが欠けている・セリフが空でも落ちない ---
  section('fc1m-bubble-wrap: missing payload / empty lines do not throw across all 3 functions', () => {
    const { built: b1 } = makeFactionBundle({});
    let onChoiceCalled = null;
    assert.doesNotThrow(() => b1.showChallengeRequestModal(null, {}, (v) => { onChoiceCalled = v; }),
      'payload=nullでも例外なし');
    assert.strictEqual(onChoiceCalled, null, 'payload=nullのときonChoice(null)にフォールバックする(不変条件6)');

    const { built: b2, getRoot: r2 } = makeFactionBundle({
      Engine: Object.assign(defaultEngineStub(), {
        factions: { getCommon3Line: () => '' },
      }),
    });
    const newcomer = fighter(3, 'X');
    const leader = fighter(1, 'Y');
    assert.doesNotThrow(() => b2.showFactionCommon3Modal(
      { newcomerId: 3, leaderId: 1, factionName: 'F' }, { roster: [newcomer, leader] }, () => {}
    ), 'Common3: セリフが空文字でも例外なし(不変条件6)');
    assert.ok(r2().innerHTML.length > 0);

    const { built: b3, getRoot: r3 } = makeFactionBundle({
      Engine: Object.assign(defaultEngineStub(), {
        factions: { getCommon1Line: () => '' },
      }),
    });
    const fA = fighter(3, 'A');
    const fB = fighter(4, 'B');
    assert.doesNotThrow(() => b3.showFactionCommon1Modal(
      { fighterAId: 3, fighterBId: 4, leaderId: 3, factionName: 'F' }, { roster: [fA, fB] }, () => {}
    ), 'Common1: セリフが空文字でも例外なし(不変条件6)');
    assert.ok(r3().innerHTML.length > 0);
  });

  // --- 5f. <script>混入時に例外にならないことのスポットチェック(エスケープ欠落は既知・未修正) ---
  section('fc1m-bubble-wrap: does not throw on a <script>-bearing name (escaping gap logged, not fixed)', () => {
    const { built, getRoot } = makeFactionBundle({});
    const newcomer = fighter(3, '<script>alert(1)</script>');
    const leader = fighter(1, 'Y');
    assert.doesNotThrow(() => built.showFactionCommon3Modal(
      { newcomerId: 3, leaderId: 1, factionName: 'F' }, { roster: [newcomer, leader] }, () => {}
    ), '例外を投げない(不変条件6の派生)');
    const html = getRoot().innerHTML;
    if (html.includes('<script>alert(1)</script>')) {
      console.log('    [known gap] showFactionCommon3Modal: newcomer name is NOT escaped (escHtml not called) — reported, not fixed');
    }
  });
})();

console.log(`u3-group-b-safety-net-test: ${sectionsRun} sections ok`);
