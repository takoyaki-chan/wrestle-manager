'use strict';

// U3 グループA(1人が語る画面)の統一作業に入る前の安全網。
//
// 対象は指示書より9系統(#9は既存テスト special-tournament-fanfare-test.js と重複するため対象外):
//   1. .coach-fg-bubble        殿堂入り演出のコーチ                  _awShowCoachFg(ui-common.js)
//   2. .care-reaction-bubble   B1 練習中の怪我ケアモーダル             _buildB1Modal(ui-common.js)
//   3. .cerem-bubble-wrap/.cerem-bubble 節目セレモニー(3画面共有)      showCeremonyEvent(app.js)
//   4. .pb-ace-bubble          War 敵将のエースコメント               _showWarEnemyAceStatement(ui-common.js)
//   5. .war-victory-line       War 勝者コメント連鎖(箱の無い形)        _showWarVictoryChain(ui-common.js)
//   6. .negotiation-bubble     社長室 解雇面談                        renderShachoshitsuReleaseInterview(ui-render.js)
//   7. .mdl-b-speech           引退/引退勧告の結果(2画面共有)          _renderRetirementPopup / showRetireAdviseResultPopup(ui-common.js)
//   8. (クラス名なし・インラインstyle) チャンピオン故障引退時の一言    _showChampionWorryBubble(ui-common.js)
//
// 方針(test/README.md, u3-group-b-safety-net-test.js を踏襲): ソース文字列一致ではなく実関数を
// new Function で取り出して最小スタブ上で実行し、生成HTMLに対して「壊れたら困る」不変条件だけを
// 検査する。ピクセル値・クラス名の並び順・現在のDOM順序など統一作業でわざと変える予定のものは
// 固定しない。
//
// 検査する不変条件(指示書より、グループBと同一の7点):
//   1. 描画関数が例外を投げずにHTMLを生成する
//   2. 主役の顔が出ている(画像要素が生成される。画像が無いケースのフォールバックも含む)
//   3. セリフが渡されたとき、そのセリフ本文が出力に含まれる
//   4. 話者の名前が画面のどこかに出ている
//   5. 画面固有の重要情報が落ちていない
//   6. セリフが未定義・空・nullのときも落ちない
//   7. HTMLエスケープが効いている(<script>を入れて生のタグが出ないこと)
//
// 重要な既知の欠落・不審点(このテストを書く過程で発見。直さず報告する):
//   a. エスケープ欠落: 1(_awShowCoachFg)/2(_buildB1Modal)/3(showCeremonyEvent)/5(_showWarVictoryChain)/
//      6(renderShachoshitsuReleaseInterview)/7(_mdlBSoloStage/_mdlBSpeech経由)/8(_showChampionWorryBubble)は
//      いずれも escHtml() を一度も呼ばずに名前・セリフを生のままHTMLに差し込む。唯一の例外が
//      4(_showWarEnemyAceStatement)で、ここだけ全箇所 escHtml() を通している
//      (グループ内で最もエスケープが徹底している画面)。
//   b. 顔画像フォールバックの不在: 4(_showWarEnemyAceStatement)と7(_mdlBSoloStage、つまり
//      _renderRetirementPopup/showRetireAdviseResultPopup)は、upperUrlが空文字のとき<img>タグ自体を
//      出さない(portraitImg/_imgOrInitial系のようなイニシャル代替フォールバックが無い)。
//      画像取得に失敗した場合、この2画面だけ顔が完全に空白になる。他の6画面(1/2/3/5/6/8)は
//      portraitImg または _imgOrInitial 経由でイニシャル文字への視覚的フォールバックを持つ。
//   c. renderShachoshitsuReleaseInterview(6)・_showChampionWorryBubble(8)は dialogue/line が
//      undefined のとき '…' 等のフォールバックが無く、テンプレートリテラルがそのまま文字列
//      "undefined" を画面に出力する(他画面、例えば _buildB1Modal は `event.dialogue || '…'` で
//      明示的にフォールバックしている)。
//   d. _awShowCoachFg(1)は末尾で `window._hofCoachReady = true;` を typeof ガード無しに直接代入する。
//      同関数内の他の外部参照(G/ALL_COACHES/AWARD_LINES/getCoachPortraitUrl)はすべて
//      `typeof X !== 'undefined'` や `typeof X === 'function'` でガードされているのに、
//      windowだけ素の参照になっている非対称性。ブラウザでは常にwindowが存在するため実害は薄いが、
//      この関数だけ「実行環境依存の無ガード参照」が1箇所混ざっている。
//   これらは「今後も維持すべき仕様」ではなく「見つかった問題」なので、正としては固定しない
//   (該当箇所は console.log の [known gap] / [observation] としてのみ記録し、テストの pass/fail
//   条件には含めない)。

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const uiRender = readSource('src', 'ui-render.js');
const appSrc = readSource('src', 'app.js');
const dataSrc = readSource('src', 'data.js');
const cssIndex = readSource('src', 'index.html');

function makeFnReader(src, label) {
  return function functionSource(name) {
    const start = src.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `${name} not found in ${label}`);
    const brace = src.indexOf('{', start);
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
const appFn = makeFnReader(appSrc, 'app.js');
const dataFn = makeFnReader(dataSrc, 'data.js');

// ---------------------------------------------------------------------------
// CSS存在確認(この回で扱うクラスが実際に定義されていること。
// #8は元々仕様上クラスを持たなかったが、U3統一で champion-worry-bubble を新設したため追加)
// ---------------------------------------------------------------------------
[
  'coach-fg-bubble', 'care-reaction-bubble', 'cerem-bubble-wrap', 'cerem-bubble',
  'pb-ace-bubble', 'war-victory-line', 'negotiation-bubble', 'mdl-b-speech',
  'champion-worry-bubble',
].forEach(cls => {
  assert.ok(cssIndex.includes(`.${cls}`), `.${cls}がindex.htmlに存在する`);
});

let sectionsRun = 0;
function section(name, fn) {
  fn();
  sectionsRun++;
  console.log(`  [ok] ${name}`);
}

// ===========================================================================
// 1. .coach-fg-bubble — 殿堂入り演出のコーチ(_awShowCoachFg)
// ===========================================================================
(function coachFgSuite() {
  // 注: _awShowCoachFg は末尾で `window._hofCoachReady = true;` を typeof ガード無しに直接代入する
  // (同関数内の他の外部参照は `typeof G !== 'undefined'` 等でガードされているのと対照的)。
  // ブラウザでは常にwindowが存在するため実害は無いが、Node実行時はwindowスタブが無いと
  // ReferenceErrorになる非対称性であり、不審点として報告する(直さず、テストではスタブを与える)。
  // U3グループA実装(2026-07-26): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行したため、
  // 関数本体と一緒に依存先(escHtml/_u3bSideHtml/_u3bInitialFallback)もサンドボックスへ持ち込む
  // (test/u3-group-b-safety-net-test.js が確立した手法を踏襲)。
  const build = new Function(
    'document', 'window', 'G', 'ALL_COACHES', 'AWARD_LINES', 'getCoachPortraitUrl',
    `${uiFn('escHtml')}
     ${uiFn('_u3bInitialFallback')}
     ${uiFn('_u3bSideHtml')}
     ${uiFn('_awShowCoachFg')}
     return { _awShowCoachFg };`
  );

  function makeCoachFgEl() {
    return {
      innerHTML: '',
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); },
      },
    };
  }

  function makeBundle(opts) {
    opts = opts || {};
    const coachFg = makeCoachFgEl();
    const documentStub = { getElementById: (id) => (id === 'hof-coach-fg' ? coachFg : null) };
    const GStub = opts.G || { coachAssign: { 5: [42] } };
    const ALL_COACHES_STUB = opts.ALL_COACHES || [{ id: 5, name: '道場長', emoji: '🥋' }];
    const AWARD_LINES_STUB = opts.AWARD_LINES || { hofCoach: { _default: ['よくやってくれた。感謝している。'] } };
    const getCoachPortraitUrlStub = opts.getCoachPortraitUrl || ((id) => `image/coach/${id}.webp`);
    const windowStub = opts.window || {};
    const built = build(documentStub, windowStub, GStub, ALL_COACHES_STUB, AWARD_LINES_STUB, getCoachPortraitUrlStub);
    return { built, coachFg };
  }

  section('coach-fg-bubble: renders assigned coach face, line, name for a player-org inductee', () => {
    const { built, coachFg } = makeBundle({});
    assert.doesNotThrow(() => built._awShowCoachFg({ orgId: 'player', id: 42 }, {}), '例外を投げない(不変条件1)');
    const html = coachFg.innerHTML;
    assert.ok(html.includes('coach-fg-bubble'), 'coach-fg-bubbleが出る');
    assert.ok(html.includes('<img src="image/coach/5.webp"'), 'コーチの顔画像が出る(不変条件2)');
    assert.ok(html.includes('よくやってくれた。感謝している。'), 'セリフ本文が出る(不変条件3)');
    assert.ok(html.includes('道場長') && html.includes('コーチ'), 'コーチ名(話者名)・役割ラベルが出る(不変条件4)');
  });

  section('coach-fg-bubble: falls back to the coach emoji when there is no portrait URL', () => {
    const { built, coachFg } = makeBundle({ getCoachPortraitUrl: () => '' });
    built._awShowCoachFg({ orgId: 'player', id: 42 }, {});
    assert.ok(!coachFg.innerHTML.includes('<img'), '画像URLが無いときは<img>を出さない');
    assert.ok(coachFg.innerHTML.includes('🥋'), 'コーチのemojiにフォールバックする(不変条件2)');
  });

  section('coach-fg-bubble: shows the correctly-assigned coach, not an arbitrary one (unvariant 5)', () => {
    const { built, coachFg } = makeBundle({
      ALL_COACHES: [{ id: 5, name: '道場長', emoji: '🥋' }, { id: 7, name: '花村コーチ', emoji: '🌸' }],
      G: { coachAssign: { 7: [42] } }, // 42番選手の担当は7番コーチ
    });
    built._awShowCoachFg({ orgId: 'player', id: 42 }, {});
    const html = coachFg.innerHTML;
    assert.ok(html.includes('花村コーチ'), '正しく割り当てられたコーチが表示される(不変条件5)');
    assert.ok(!html.includes('道場長'), '割り当てられていない別コーチは出ない');
  });

  section('coach-fg-bubble: does nothing (no throw) for a non-player-org inductee or an unassigned coach', () => {
    const { built: b1, coachFg: fg1 } = makeBundle({});
    assert.doesNotThrow(() => b1._awShowCoachFg({ orgId: 'rival_a', id: 42 }, {}), '他団体選手でも例外なし');
    assert.strictEqual(fg1.innerHTML, '', '他団体選手ではコーチ演出を出さない');

    const { built: b2, coachFg: fg2 } = makeBundle({ G: { coachAssign: {} } });
    assert.doesNotThrow(() => b2._awShowCoachFg({ orgId: 'player', id: 42 }, {}), 'コーチ未割当でも例外なし');
    assert.strictEqual(fg2.innerHTML, '', 'コーチが割り当てられていないときは演出を出さない');
  });

  section('coach-fg-bubble: does not throw when hofData is missing or the line pool is empty (unvariant 6)', () => {
    const { built: b1, coachFg: fg1 } = makeBundle({});
    assert.doesNotThrow(() => b1._awShowCoachFg(null, {}), 'hofData=nullでも例外なし');
    assert.strictEqual(fg1.innerHTML, '');

    const { built: b2, coachFg: fg2 } = makeBundle({ AWARD_LINES: { hofCoach: { _default: [] } } });
    assert.doesNotThrow(() => b2._awShowCoachFg({ orgId: 'player', id: 42 }, {}), 'セリフプールが空でも例外なし');
    assert.strictEqual(fg2.innerHTML, '', 'セリフが無いときは演出自体を出さない(フォールバック)');
  });

  section('coach-fg-bubble: escapes a <script>-bearing coach name (U3統一で修正済み。旧known gap)', () => {
    const { built, coachFg } = makeBundle({ ALL_COACHES: [{ id: 5, name: '<script>alert(1)</script>', emoji: '🥋' }] });
    assert.doesNotThrow(() => built._awShowCoachFg({ orgId: 'player', id: 42 }, {}), '例外を投げない(不変条件6の派生)');
    const html = coachFg.innerHTML;
    assert.ok(!html.includes('<script>alert(1)</script>'), 'コーチ名は生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()によりエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 2. .care-reaction-bubble — B1 練習中の怪我ケアモーダル(_buildB1Modal)
// ===========================================================================
(function b1ModalSuite() {
  const build = new Function(
    'ALL_CHARS', 'G', 'getPortraitUrl',
    `${dataFn('portraitImg')}
     ${uiFn('escHtml')}
     ${uiFn('_u3bInitialFallback')}
     ${uiFn('_u3bSideHtml')}
     ${uiFn('_buildB1Modal')}
     return { _buildB1Modal };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const ALL_CHARS_STUB = opts.ALL_CHARS || [{ id: 1, name: '風間サキ', style: 'Grappler' }];
    const GStub = opts.G || {};
    const getPortraitUrlStub = opts.getPortraitUrl || ((id) => `image/face/${id}.png`);
    const built = build(ALL_CHARS_STUB, GStub, getPortraitUrlStub);
    return { built };
  }

  const roster = [{ id: 1, name: '風間サキ' }];

  section('care-reaction-bubble: renders face, dialogue, name, and severity/detail (no throw)', () => {
    const { built } = makeBundle({});
    const event = { fighter: 1, severity: 'moderate', detail: '練習中に足首をひねった。', dialogue: '大丈夫です、続けられます。' };
    const state = { funds: 500 };
    let html;
    assert.doesNotThrow(() => { html = built._buildB1Modal(event, state, roster); }, '例外を投げない(不変条件1)');
    assert.ok(html.includes('<img src="image/face/1.png"'), '選手の顔画像が出る(不変条件2)');
    assert.ok(html.includes('大丈夫です、続けられます。'), 'セリフ本文が出る(不変条件3)');
    assert.ok(html.includes('風間サキ'), '選手名が出る(不変条件4)');
    assert.ok(html.includes('（重め）'), '重症度ラベルが出る(不変条件5)');
    assert.ok(html.includes('練習中に足首をひねった。'), 'イベント詳細文が出る(不変条件5)');
    assert.ok(!/data-choice="0"[^>]*disabled/.test(html), '資金が足りているときは特別治療ボタンが有効');
  });

  section('care-reaction-bubble: disables the special-treatment choice when funds are short (unvariant 5)', () => {
    const { built } = makeBundle({});
    const event = { fighter: 1, severity: 'mild', dialogue: '平気です。' };
    const html = built._buildB1Modal(event, { funds: 50 }, roster);
    assert.ok(/data-choice="0"[^>]*disabled/.test(html), '資金不足時は特別治療ボタンがdisabledになる(不変条件5)');
  });

  section('care-reaction-bubble: falls back to an initial-letter portrait when there is no image URL', () => {
    const { built } = makeBundle({ getPortraitUrl: () => '' });
    const html = built._buildB1Modal({ fighter: 1, severity: 'mild', dialogue: 'x' }, { funds: 500 }, roster);
    assert.ok(!html.includes('<img'), '画像URLが無いときは<img>を出さない');
    assert.ok(html.includes('>風</div>'), 'イニシャル文字にフォールバックする(不変条件2)');
  });

  section('care-reaction-bubble: does not throw when the fighter is missing from roster, or dialogue is undefined/empty/null (unvariant 6)', () => {
    const { built } = makeBundle({});
    assert.doesNotThrow(() => built._buildB1Modal({ fighter: 999, severity: 'mild' }, { funds: 500 }, roster),
      'roster内に対象選手がいなくても例外なし');
    [undefined, '', null].forEach((v) => {
      assert.doesNotThrow(() => built._buildB1Modal({ fighter: 1, severity: 'mild', dialogue: v }, { funds: 500 }, roster),
        `dialogue=${JSON.stringify(v)}でも例外なし`);
    });
  });

  section('care-reaction-bubble: escapes a <script>-bearing name/dialogue (U3統一で修正済み。旧known gap)', () => {
    const { built } = makeBundle({ ALL_CHARS: [{ id: 1, name: '<script>alert(1)</script>', style: 'Grappler' }] });
    const evilRoster = [{ id: 1, name: '<script>alert(1)</script>' }];
    let html;
    assert.doesNotThrow(() => {
      html = built._buildB1Modal({ fighter: 1, severity: 'mild', dialogue: '<script>alert(2)</script>' }, { funds: 500 }, evilRoster);
    }, '例外を投げない(不変条件6の派生)');
    assert.ok(!html.includes('<script>alert(1)</script>') && !html.includes('<script>alert(2)</script>'),
      '選手名・セリフは生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()によりエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 3. .cerem-bubble-wrap / .cerem-bubble — 節目セレモニー(showCeremonyEvent, app.js)
//    同一関数を app.js:9221(ドーム満員後) / 11027・11041(MILESTONE_EVENTS巡回) の
//    3箇所から呼ぶ共有画面。関数自体を直接叩けば3箇所すべてをカバーできる。
// ===========================================================================
(function ceremSuite() {
  const build = new Function(
    'document', 'G', 'App', 'getUpperUrl', 'Audio',
    `${uiFn('escHtml')}
     ${uiFn('_u3bInitialFallback')}
     ${uiFn('_u3bSideHtml')}
     ${appFn('_ceremAudioOpen')}
     ${appFn('_ceremAudioClose')}
     ${appFn('showCeremonyEvent')}
     return { showCeremonyEvent };`
  );

  function makeEl() {
    return {
      className: '', style: {}, innerHTML: '',
      appendChild() {}, remove() {},
      querySelector() { return { addEventListener() {}, classList: { add() {}, remove() {}, contains() { return false; } } }; },
      querySelectorAll() { return []; },
      addEventListener() {},
    };
  }
  function makeCeremDom() {
    let appended = null;
    const doc = {
      createElement() { return makeEl(); },
      body: { appendChild(el) { appended = el; } },
    };
    return { doc, getAppended: () => appended };
  }

  function makeBundle(opts) {
    opts = opts || {};
    const { doc, getAppended } = makeCeremDom();
    const GStub = opts.G || { week: 15, lastShowAttendance: 30000 };
    const AppStub = opts.App || { resolveDomeLine: (fighter, key) => `LINE_${fighter.id}_${key}` };
    const getUpperUrlStub = opts.getUpperUrl || ((id) => `image/upper/${id}.webp`);
    const AudioStub = opts.Audio || { fileBgm: { play() {}, fadeOut() {} }, bgm: { playForState() {} } };
    const built = build(doc, GStub, AppStub, getUpperUrlStub, AudioStub);
    return { built, getAppended };
  }

  const evt = {
    titleMain: '到　達', titleSub: 'THE DOME', visualVariant: 'arrival', dialogueKey: 'dome_firstshow',
    continueLabel: '試合に向かう',
    narration: ['ドーム。', '選手たちが、待っている。'],
    narrationGaps: [0],
  };
  const speakers = [
    { fighter: { id: 1, name: '風間サキ' }, roleLabel: 'MAIN EVENT ・ 赤コーナー' },
    { fighter: { id: 2, name: '結城ミナ' }, roleLabel: 'MAIN EVENT ・ 青コーナー' },
  ];

  section('cerem-bubble: renders each speaker face, line, name (no throw)', () => {
    const { built, getAppended } = makeBundle({});
    assert.doesNotThrow(() => built.showCeremonyEvent(evt, speakers, () => {}), '例外を投げない(不変条件1)');
    const html = getAppended().innerHTML;
    assert.strictEqual((html.match(/cerem-bubble-wrap/g) || []).length, 2, '話者2名分の吹き出し枠が出る');
    assert.ok(html.includes('image/upper/1.webp') && html.includes('image/upper/2.webp'), '両話者の顔画像URLが出る(不変条件2)');
    assert.ok(html.includes('LINE_1_dome_firstshow') && html.includes('LINE_2_dome_firstshow'), '両話者のセリフ本文が出る(不変条件3)');
    assert.ok(html.includes('風間サキ') && html.includes('結城ミナ'), '両話者の名前が出る(不変条件4)');
    assert.ok(html.includes('WEEK 15'), 'arrivalバリアントでは週番号がタイトルサブに出る(不変条件5)');
  });

  section('cerem-bubble: triumph variant shows attendance count in the title sub (unvariant 5)', () => {
    const { built, getAppended } = makeBundle({});
    const triumphEvt = { ...evt, visualVariant: 'triumph', titleSub: 'FULL HOUSE' };
    built.showCeremonyEvent(triumphEvt, speakers, () => {});
    const html = getAppended().innerHTML;
    const attendanceStr = (30000).toLocaleString();
    assert.ok(html.includes(`${attendanceStr} ATTENDED`), '満員系バリアントでは観客動員数がタイトルサブに出る(不変条件5)');
  });

  section('cerem-bubble: still emits an <img> with an onerror fallback when the portrait URL is empty', () => {
    const { built, getAppended } = makeBundle({ getUpperUrl: () => '' });
    assert.doesNotThrow(() => built.showCeremonyEvent(evt, speakers, () => {}));
    const html = getAppended().innerHTML;
    assert.ok(/<img src="" alt="[^"]*"[\s\S]*?onerror="this\.style\.display='none'"/.test(html),
      '画像URLが空でもonerrorフォールバック付きの<img>は出る(不変条件2)');
  });

  section('cerem-bubble: does not throw when the dome line is undefined/empty/null (unvariant 6)', () => {
    [undefined, '', null].forEach((v) => {
      const { built, getAppended } = makeBundle({ App: { resolveDomeLine: () => v } });
      assert.doesNotThrow(() => built.showCeremonyEvent(evt, speakers, () => {}), `line=${JSON.stringify(v)}でも例外なし`);
      assert.ok(getAppended().innerHTML.length > 0);
    });
  });

  section('cerem-bubble: escapes a <script>-bearing fighter name (U3統一で修正済み。旧known gap)', () => {
    const { built, getAppended } = makeBundle({});
    const evilSpeakers = [{ fighter: { id: 1, name: '<script>alert(1)</script>' }, roleLabel: 'MAIN' }];
    assert.doesNotThrow(() => built.showCeremonyEvent(evt, evilSpeakers, () => {}), '例外を投げない(不変条件6の派生)');
    const html = getAppended().innerHTML;
    assert.ok(!html.includes('<script>alert(1)</script>'), '選手名は生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()によりエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 4. .pb-ace-bubble — War 敵将のエースコメント(_showWarEnemyAceStatement)
//    この画面だけ escHtml() を全滴所に通している(グループ内で唯一のエスケープ済み画面)。
// ===========================================================================
(function warAceSuite() {
  const build = new Function(
    'document', 'G', 'Audio', 'getUpperUrl', 'getWarPostDialogue',
    `let _warPostCtx = null;
     ${uiFn('escHtml')}
     ${uiFn('_u3bInitialFallback')}
     ${uiFn('_u3bOrgBadgeHtml')}
     ${uiFn('_u3bSideHtml')}
     ${uiFn('_showWarEnemyAceStatement')}
     return {
       _showWarEnemyAceStatement,
       setCtx(ctx) { _warPostCtx = ctx; },
     };`
  );

  function makeAceDom() {
    let created = null;
    const doc = {
      createElement() {
        created = {
          className: '', style: { setProperty() {} }, innerHTML: '',
          querySelector() { return { addEventListener() {} }; },
          appendChild() {},
        };
        return created;
      },
      body: { appendChild() {} },
    };
    return { doc, getCreated: () => created };
  }

  function makeBundle(opts) {
    opts = opts || {};
    const { doc, getCreated } = makeAceDom();
    const GStub = opts.G || { orgName: '風間プロレス' };
    const AudioStub = opts.Audio || { play() {} };
    const getUpperUrlStub = opts.getUpperUrl || ((id) => `image/upper/${id}.webp`);
    const getWarPostDialogueStub = opts.getWarPostDialogue || ((fighter) => `DIALOGUE_${fighter.id}`);
    const built = build(doc, GStub, AudioStub, getUpperUrlStub, getWarPostDialogueStub);
    return { built, getCreated };
  }

  const ctxBase = {
    ev: { opponentName: '鬼道場' },
    orgCfg: { color: '#e74c3c' },
    eventWon: true, playerWins: 3, aiWins: 1,
    enemyAce: { id: 9, name: '黒羽ミナ' },
  };

  section('pb-ace-bubble: renders enemy ace face, dialogue, and both names (no throw)', () => {
    const { built, getCreated } = makeBundle({});
    built.setCtx(ctxBase);
    let called = false;
    assert.doesNotThrow(() => built._showWarEnemyAceStatement(() => { called = true; }), '例外を投げない(不変条件1)');
    const html = getCreated().innerHTML;
    assert.ok(html.includes('pb-ace-bubble'), 'pb-ace-bubbleが出る');
    assert.ok(html.includes('image/upper/9.webp'), 'エースの顔画像が出る(不変条件2)');
    assert.ok(html.includes('DIALOGUE_9'), 'セリフ本文が出る(不変条件3)');
    assert.ok(html.includes('黒羽ミナ') && html.includes('鬼道場'), 'エース名・団体名が出る(不変条件4)');
    assert.strictEqual(called, false, '閉じるボタンをクリックするまでonDoneは呼ばれない');
  });

  section('pb-ace-bubble: falls back to an initial-letter portrait when the upper image URL is empty (U3統一で修正済み。旧known gap)', () => {
    const { built, getCreated } = makeBundle({ getUpperUrl: () => '' });
    built.setCtx(ctxBase);
    built._showWarEnemyAceStatement(() => {});
    const html = getCreated().innerHTML;
    assert.ok(!html.includes('<img'), '画像URLが空のとき<img>タグ自体が出ない');
    assert.ok(html.includes('>黒</div>'), 'イニシャル文字にフォールバックする(不変条件2)');
  });

  section('pb-ace-bubble: calls onDone immediately (no throw) when there is no war context or no enemy ace (unvariant 6)', () => {
    const { built } = makeBundle({});
    let called = false;
    assert.doesNotThrow(() => built._showWarEnemyAceStatement(() => { called = true; }), '_warPostCtx=nullでも例外なし');
    assert.strictEqual(called, true, 'コンテキストが無いときは即座にonDoneへフォールバックする');

    const { built: b2 } = makeBundle({});
    b2.setCtx({ ...ctxBase, enemyAce: null });
    let called2 = false;
    assert.doesNotThrow(() => b2._showWarEnemyAceStatement(() => { called2 = true; }));
    assert.strictEqual(called2, true, 'enemyAceが無いときも即座にonDoneへフォールバックする');
  });

  section('pb-ace-bubble: escapes a <script>-bearing name/dialogue — this screen IS escaped (the exception)', () => {
    const { built, getCreated } = makeBundle({ getWarPostDialogue: () => '<script>alert(2)</script>' });
    built.setCtx({ ...ctxBase, enemyAce: { id: 9, name: '<script>alert(1)</script>' } });
    assert.doesNotThrow(() => built._showWarEnemyAceStatement(() => {}), '例外を投げない(不変条件6の派生)');
    const html = getCreated().innerHTML;
    assert.ok(!html.includes('<script>alert(1)</script>'), 'エース名は生のまま出力されない(不変条件7)');
    assert.ok(!html.includes('<script>alert(2)</script>'), 'セリフも生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()によりエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 5. .war-victory-line — War 勝者コメント連鎖(_showWarVictoryChain)
//    吹き出しの箱が無い形(war-victory-modal直下に画像・名前・セリフが並ぶ)
// ===========================================================================
(function warVictoryChainSuite() {
  const build = new Function(
    'document', 'Audio', 'getPortraitUrl', '_getWarVictoryLine', 'ALL_CHARS',
    `${uiFn('escHtml')}
     ${uiFn('_imgOrInitial')}
     ${uiFn('_u3bInitialFallback')}
     ${uiFn('_u3bSideHtml')}
     ${uiFn('_showWarVictoryChain')}
     return { _showWarVictoryChain };`
  );

  function makeChainDom() {
    const created = [];
    const doc = {
      createElement() {
        const el = {
          className: '', innerHTML: '', appendChild() {}, remove() {},
          querySelector() { return { addEventListener() {} }; },
        };
        created.push(el);
        return el;
      },
      body: { appendChild() {} },
    };
    return { doc, getCreated: () => created };
  }

  function makeBundle(opts) {
    opts = opts || {};
    const { doc, getCreated } = makeChainDom();
    const AudioStub = opts.Audio || { play() {} };
    const getPortraitUrlStub = opts.getPortraitUrl || ((id) => `image/face/${id}.png`);
    const lineStub = opts._getWarVictoryLine || ((fighter) => `LINE_${fighter.id}`);
    const ALL_CHARS_STUB = opts.ALL_CHARS || [{ id: 1, name: '風間サキ', style: 'Grappler' }];
    const built = build(doc, AudioStub, getPortraitUrlStub, lineStub, ALL_CHARS_STUB);
    return { built, getCreated };
  }

  section('war-victory-line: renders winner face, line, name for each fighter in the chain (no throw)', () => {
    const { built, getCreated } = makeBundle({});
    let done = false;
    assert.doesNotThrow(() => built._showWarVictoryChain([{ id: 1, name: '風間サキ' }], 0, () => { done = true; }),
      '例外を投げない(不変条件1)');
    const html = getCreated()[0].innerHTML;
    assert.ok(html.includes('war-victory-line'), 'war-victory-lineが出る');
    assert.ok(html.includes('<img src="image/face/1.png"'), '勝者の顔画像が出る(不変条件2)');
    assert.ok(html.includes('LINE_1'), 'セリフ本文が出る(不変条件3)');
    assert.ok(html.includes('風間サキ'), '勝者名が出る(不変条件4)');
    assert.strictEqual(done, false, '閉じるボタンをクリックするまで次には進まない');
  });

  section('war-victory-line: falls back to an initial-letter portrait when there is no image URL', () => {
    const { built, getCreated } = makeBundle({ getPortraitUrl: () => '' });
    built._showWarVictoryChain([{ id: 1, name: '風間サキ' }], 0, () => {});
    const html = getCreated()[0].innerHTML;
    assert.ok(!html.includes('<img'), '画像URLが無いときは<img>を出さない');
    assert.ok(html.includes('>風</div>'), 'イニシャル文字にフォールバックする(不変条件2)');
  });

  section('war-victory-line: calls onDone immediately (no DOM write) once idx reaches the end of the list (unvariant 6)', () => {
    const { built, getCreated } = makeBundle({});
    let done = false;
    assert.doesNotThrow(() => built._showWarVictoryChain([{ id: 1, name: 'A' }], 1, () => { done = true; }));
    assert.strictEqual(done, true, 'リスト終端ではonDoneが呼ばれる');
    assert.strictEqual(getCreated().length, 0, 'リスト終端ではDOM要素を作らない');
  });

  section('war-victory-line: does not throw when the victory line is undefined/empty/null (unvariant 6)', () => {
    [undefined, '', null].forEach((v) => {
      const { built, getCreated } = makeBundle({ _getWarVictoryLine: () => v });
      assert.doesNotThrow(() => built._showWarVictoryChain([{ id: 1, name: 'A' }], 0, () => {}),
        `line=${JSON.stringify(v)}でも例外なし`);
      assert.ok(getCreated()[0].innerHTML.length > 0);
    });
  });

  section('war-victory-line: escapes a <script>-bearing name/line (U3統一で修正済み。旧known gap)', () => {
    const { built, getCreated } = makeBundle({ _getWarVictoryLine: () => '<script>alert(2)</script>' });
    assert.doesNotThrow(() => built._showWarVictoryChain([{ id: 1, name: '<script>alert(1)</script>' }], 0, () => {}),
      '例外を投げない(不変条件6の派生)');
    const html = getCreated()[0].innerHTML;
    assert.ok(!html.includes('<script>alert(1)</script>') && !html.includes('<script>alert(2)</script>'),
      '選手名・セリフは生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()によりエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 6. .negotiation-bubble — 社長室 解雇面談(renderShachoshitsuReleaseInterview, ui-render.js)
// ===========================================================================
(function releaseInterviewSuite() {
  const build = new Function(
    'document', 'G', 'Engine', 'getPortraitUrl', 'ALL_CHARS',
    `${dataFn('portraitImg')}
     ${uiFn('escHtml')}
     ${uiFn('_u3bInitialFallback')}
     ${uiFn('_u3bSideHtml')}
     ${uiRenderFn('renderShachoshitsuReleaseInterview')}
     return { renderShachoshitsuReleaseInterview };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    const el = { innerHTML: '' };
    const documentStub = {
      getElementById: (id) => {
        if (id !== 'shachoshitsuContent') return null;
        return opts.elMissing ? null : el;
      },
    };
    const GStub = opts.G || { offSeason: false, week: 10, funds: 1200, season: 2 };
    const EngineStub = opts.Engine || {
      util: {
        getSeasonInfo: () => ({ id: 'winter' }),
        formatDate: (s, w) => `S${s}-W${w}`,
      },
    };
    const getPortraitUrlStub = opts.getPortraitUrl || ((id) => `image/face/${id}.png`);
    const ALL_CHARS_STUB = opts.ALL_CHARS || [{ id: 3, name: '結城ミナ', style: 'Striker' }];
    const built = build(documentStub, GStub, EngineStub, getPortraitUrlStub, ALL_CHARS_STUB);
    return { built, el };
  }

  const fighter = { id: 3, name: '結城ミナ' };

  section('negotiation-bubble: renders fighter face, dialogue, name, and release-critical info (no throw)', () => {
    const { built, el } = makeBundle({});
    assert.doesNotThrow(() => built.renderShachoshitsuReleaseInterview(fighter, 'お世話になりました。'), '例外を投げない(不変条件1)');
    const html = el.innerHTML;
    assert.ok(html.includes('negotiation-bubble'), 'negotiation-bubbleが出る');
    assert.ok(html.includes('<img src="image/face/3.png"'), '選手の顔画像が出る(不変条件2)');
    assert.ok(html.includes('お世話になりました。'), 'セリフ本文が出る(不変条件3)');
    assert.ok(html.includes('結城ミナ'), '選手名が出る(不変条件4)');
    assert.ok(html.includes('解雇の確認') && html.includes('取り消せません'), '解雇の確定操作であることが明示される(不変条件5)');
    assert.ok(html.includes('App.confirmRelease(3)'), '解雇実行ボタンが対象選手のIDに紐付く(不変条件5)');
  });

  section('negotiation-bubble: does nothing (no throw) when the shachoshitsuContent element is missing', () => {
    const { built } = makeBundle({ elMissing: true });
    assert.doesNotThrow(() => built.renderShachoshitsuReleaseInterview(fighter, 'x'), '要素が無くても例外なし');
  });

  section('negotiation-bubble: falls back to \'…\' when dialogue is undefined/empty/null (U3統一で修正済み。旧known gap)', () => {
    const { built, el } = makeBundle({});
    [undefined, '', null].forEach((v) => {
      assert.doesNotThrow(() => built.renderShachoshitsuReleaseInterview(fighter, v), `dialogue=${JSON.stringify(v)}でも例外なし`);
      assert.ok(!el.innerHTML.includes('undefined'), `dialogue=${JSON.stringify(v)}のとき画面に"undefined"の文字列が出ない(_buildB1Modalと同じ'…'フォールバック)`);
    });
  });

  section('negotiation-bubble: escapes a <script>-bearing name/dialogue (U3統一で修正済み。旧known gap)', () => {
    const { built, el } = makeBundle({ ALL_CHARS: [{ id: 3, name: '<script>alert(1)</script>', style: 'Striker' }] });
    const evilFighter = { id: 3, name: '<script>alert(1)</script>' };
    assert.doesNotThrow(() => built.renderShachoshitsuReleaseInterview(evilFighter, '<script>alert(2)</script>'),
      '例外を投げない(不変条件6の派生)');
    assert.ok(!el.innerHTML.includes('<script>alert(1)</script>') && !el.innerHTML.includes('<script>alert(2)</script>'),
      '選手名・セリフは生のまま出力されない(不変条件7)');
    assert.ok(el.innerHTML.includes('&lt;script&gt;'), 'escHtml()によりエスケープされた形で出力される');
  });
})();

// ===========================================================================
// 7. .mdl-b-speech — 引退/引退勧告の結果(2画面共有)
//    _renderRetirementPopup(引退) / showRetireAdviseResultPopup(引退勧告の結果)
// ===========================================================================
(function retirementSuite() {
  // U3グループA統一(2026-07-26): 顔出しブロックは _u3bSideHtml(.u3b-*)へ移行したため依存を追加。
  // 旧 _mdlBSpeech(このソロ画面専用の頭上吹き出し実装)は _mdlBSoloStage 内部から削除されたため、
  // サンドボックスへの注入も削除(uiFn()はソースに存在しない関数を渡すとthrowする)
  const build = new Function(
    'document', 'Engine', 'getUpperUrl', 'Audio', 'wmDiag',
    `let _retirementPopupQueue = [];
     let _retirementPopupCallback = null;
     // 2026-07-26: 引退セレモニーに WM-D03 のBGMを繋いだため、その番人フラグも注入する
     let _retirementBgmOn = false;
     ${uiFn('escHtml')}
     ${uiFn('_u3bInitialFallback')}
     ${uiFn('_u3bSideHtml')}
     ${uiFn('_mdlBOpen')}
     ${uiFn('_mdlBClose')}
     ${uiFn('_mdlBTitleBand')}
     ${uiFn('_mdlBSoloStage')}
     ${uiFn('_mdlBActions')}
     ${uiFn('_renderRetirementPopup')}
     ${uiFn('showRetireAdviseResultPopup')}
     return {
       _renderRetirementPopup, showRetireAdviseResultPopup,
       setQueue(q, cb) { _retirementPopupQueue = q; _retirementPopupCallback = cb || null; },
     };`
  );

  function makeOverlay() {
    return {
      className: '', innerHTML: '', offsetWidth: 0,
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); },
      },
    };
  }

  function makeBundle(opts) {
    opts = opts || {};
    const overlay = makeOverlay();
    const documentStub = { getElementById: (id) => (id === 'mdlBOverlay' ? overlay : null) };
    const EngineStub = opts.Engine || { util: { ov: () => 70 } };
    const getUpperUrlStub = opts.getUpperUrl || ((id) => `image/upper/${id}.webp`);
    const AudioStub = opts.Audio || { play() {} };
    const wmDiagStub = opts.wmDiag || (() => {});
    const built = build(documentStub, EngineStub, getUpperUrlStub, AudioStub, wmDiagStub);
    return { built, overlay };
  }

  const retiringFighter = { id: 5, name: '白鳥レイ', age: 29, wins: 40, losses: 12, draws: 1, careerSeasons: 6 };

  section('mdl-b-speech: retirement popup renders face, line, name, and career info (no throw)', () => {
    const { built, overlay } = makeBundle({});
    built.setQueue([{
      fighter: retiringFighter, route: 'age', line: '長い間、応援ありがとうございました。',
      summary: [{ icon: '🏆', text: '王座2度戴冠' }], canRetain: false, wasChampion: true,
    }], () => {});
    assert.doesNotThrow(() => built._renderRetirementPopup(), '例外を投げない(不変条件1)');
    const html = overlay.innerHTML;
    assert.ok(html.includes('mdl-b-speech'), 'mdl-b-speechが出る');
    assert.ok(html.includes('src="image/upper/5.webp"'), '選手の顔画像が出る(不変条件2)');
    assert.ok(html.includes('長い間、応援ありがとうございました。'), 'セリフ本文が出る(不変条件3)');
    assert.ok(html.includes('白鳥レイ'), '選手名が出る(不変条件4)');
    assert.ok(html.includes('現役期間') && html.includes('>6<'), '現役期間が出る(不変条件5)');
    // 2026-07-26: 引き分け表記の撤去(実測0件のため)に伴い、戦績表示は勝敗の2状態のみになった。
    // draws フィールド自体はセーブ互換のため残すが、表示には出ない(消えたことを回帰対象にする)。
    assert.ok(html.includes('40勝 12敗'), '戦績が出る(不変条件5)');
    assert.ok(!html.includes('引き分け'), '引き分け表記は出ない(2026-07-26 撤去)');
    assert.ok(html.includes('王座返上'), 'チャンピオンの引退では王座返上の注記が出る(不変条件5)');
  });

  section('mdl-b-speech: retirement popup calls the callback immediately when the queue is empty (unvariant 6)', () => {
    const { built, overlay } = makeBundle({});
    let done = false;
    built.setQueue([], () => { done = true; });
    assert.doesNotThrow(() => built._renderRetirementPopup());
    assert.strictEqual(done, true, 'キューが空ならコールバックへフォールバックする');
    assert.strictEqual(overlay.innerHTML, '', 'キューが空のときはモーダルを開かない');
  });

  section('mdl-b-speech: retirement popup omits the speech block gracefully when the line is empty (unvariant 6)', () => {
    const { built, overlay } = makeBundle({});
    built.setQueue([{ fighter: retiringFighter, route: 'age', line: '', summary: [] }], () => {});
    assert.doesNotThrow(() => built._renderRetirementPopup(), 'line=""でも例外なし');
    assert.ok(overlay.innerHTML.length > 0, '吹き出し以外の内容(タイトル・戦績等)は出る');
    assert.ok(!overlay.innerHTML.includes('mdl-b-speech'), 'セリフが無いときはmdl-b-speech自体を出さない(_u3bSideHtmlの空バブル省略)');
  });

  section('mdl-b-speech: retire-advise result popup renders face, line, name, and accepted/rejected framing', () => {
    const { built, overlay } = makeBundle({});
    assert.doesNotThrow(() => built.showRetireAdviseResultPopup(true, retiringFighter, '見届けてくれてありがとう。'),
      '例外を投げない(不変条件1)');
    const html = overlay.innerHTML;
    assert.ok(html.includes('mdl-b-speech'), 'mdl-b-speechが出る');
    assert.ok(html.includes('src="image/upper/5.webp"'), '選手の顔画像が出る(不変条件2)');
    assert.ok(html.includes('見届けてくれてありがとう。'), 'セリフ本文が出る(不変条件3)');
    assert.ok(html.includes('白鳥レイ'), '選手名が出る(不変条件4)');
    assert.ok(html.includes('LAST RUN BEGINS'), '受諾のときはラストラン開始が明示される(不変条件5)');

    const { built: b2, overlay: ov2 } = makeBundle({});
    b2.showRetireAdviseResultPopup(false, { ...retiringFighter, proveMode: 1 }, '拒否のセリフ');
    assert.ok(ov2.innerHTML.includes('見返しモード'), '拒否+proveMode時は見返しモード発動が明示される(不変条件5)');
  });

  section('mdl-b-speech: retire-advise result popup does not throw when the line is undefined/empty/null (unvariant 6)', () => {
    const { built } = makeBundle({});
    [undefined, '', null].forEach((v) => {
      assert.doesNotThrow(() => built.showRetireAdviseResultPopup(true, retiringFighter, v), `line=${JSON.stringify(v)}でも例外なし`);
    });
  });

  section('mdl-b-speech: escapes a <script>-bearing name/line (U3統一で修正済み。旧known gap)', () => {
    const { built, overlay } = makeBundle({});
    const evilFighter = { ...retiringFighter, name: '<script>alert(1)</script>' };
    assert.doesNotThrow(() => built.showRetireAdviseResultPopup(true, evilFighter, '<script>alert(2)</script>'),
      '例外を投げない(不変条件6の派生)');
    assert.ok(!overlay.innerHTML.includes('<script>alert(1)</script>') && !overlay.innerHTML.includes('<script>alert(2)</script>'),
      '選手名・セリフは生のまま出力されない(不変条件7)');
    assert.ok(overlay.innerHTML.includes('&lt;script&gt;'), 'escHtml()によりエスケープされた形で出力される');
  });

  section('mdl-b-speech: falls back to an initial-letter portrait when the upper image URL is empty (U3統一で修正済み。旧known gap)', () => {
    const { built, overlay } = makeBundle({ getUpperUrl: () => '' });
    built.setQueue([{ fighter: retiringFighter, route: 'age', line: 'x', summary: [] }], () => {});
    built._renderRetirementPopup();
    assert.ok(!overlay.innerHTML.includes('<img'), '画像URLが空のとき<img>タグ自体が出ない');
    assert.ok(overlay.innerHTML.includes('>白</div>'), 'イニシャル文字にフォールバックする(不変条件2)');
  });
})();

// ===========================================================================
// 8. クラス名なし(インラインstyle) — チャンピオン故障引退時の社長への一言
//    (_showChampionWorryBubble)
// ===========================================================================
(function championWorrySuite() {
  const build = new Function(
    'document', 'getPortraitUrl', 'ALL_CHARS', 'G',
    `${dataFn('portraitImg')}
     ${uiFn('escHtml')}
     ${uiFn('_u3bInitialFallback')}
     ${uiFn('_u3bSideHtml')}
     ${uiFn('_showChampionWorryBubble')}
     return { _showChampionWorryBubble };`
  );

  function makeBundle(opts) {
    opts = opts || {};
    let created = null;
    const doc = {
      createElement() {
        created = { style: {}, innerHTML: '', addEventListener() {} };
        return created;
      },
      body: { appendChild() {} },
    };
    const getPortraitUrlStub = opts.getPortraitUrl || ((id) => `image/face/${id}.png`);
    const ALL_CHARS_STUB = opts.ALL_CHARS || [{ id: 8, name: '東城カレン', style: 'Aerial' }];
    const GStub = opts.G || {};
    const built = build(doc, getPortraitUrlStub, ALL_CHARS_STUB, GStub);
    return { built, getCreated: () => created };
  }

  const fighter = { id: 8, name: '東城カレン' };

  section('champion-worry: renders face, line, name via _u3bSideHtml (U3統一で専用クラスを付与)', () => {
    const { built, getCreated } = makeBundle({});
    assert.doesNotThrow(() => built._showChampionWorryBubble(fighter, '応援してくれる人がいる限り、また立てる。', () => {}),
      '例外を投げない(不変条件1)');
    const html = getCreated().innerHTML;
    assert.ok(html.includes('<img src="image/face/8.png"'), '選手の顔画像が出る(不変条件2)');
    assert.ok(html.includes('応援してくれる人がいる限り、また立てる。'), 'セリフ本文が出る(不変条件3)');
    assert.ok(html.includes('東城カレン'), '選手名が出る(不変条件4)');
    assert.ok(html.includes('champion-worry-bubble'), 'U3統一で専用クラス(champion-worry-bubble)が付いた');
  });

  section('champion-worry: falls back to an initial-letter portrait when there is no image URL', () => {
    const { built, getCreated } = makeBundle({ getPortraitUrl: () => '' });
    built._showChampionWorryBubble(fighter, 'x', () => {});
    const html = getCreated().innerHTML;
    assert.ok(!html.includes('<img'), '画像URLが無いときは<img>を出さない');
    assert.ok(html.includes('>東</div>'), 'イニシャル文字にフォールバックする(不変条件2)');
  });

  section('champion-worry: falls back to \'…\' when the line is undefined/empty/null (U3統一で修正済み。旧known gap)', () => {
    const { built, getCreated } = makeBundle({});
    [undefined, '', null].forEach((v) => {
      assert.doesNotThrow(() => built._showChampionWorryBubble(fighter, v, () => {}), `line=${JSON.stringify(v)}でも例外なし`);
      assert.ok(!getCreated().innerHTML.includes('undefined'), `line=${JSON.stringify(v)}のとき画面に"undefined"の文字列が出ない(_buildB1Modalと同じ'…'フォールバック)`);
    });
  });

  section('champion-worry: escapes a <script>-bearing name/line (U3統一で修正済み。旧known gap)', () => {
    const { built, getCreated } = makeBundle({ ALL_CHARS: [{ id: 8, name: '<script>alert(1)</script>', style: 'Aerial' }] });
    const evilFighter = { id: 8, name: '<script>alert(1)</script>' };
    assert.doesNotThrow(() => built._showChampionWorryBubble(evilFighter, '<script>alert(2)</script>', () => {}),
      '例外を投げない(不変条件6の派生)');
    const html = getCreated().innerHTML;
    assert.ok(!html.includes('<script>alert(1)</script>') && !html.includes('<script>alert(2)</script>'),
      '選手名・セリフは生のまま出力されない(不変条件7)');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()によりエスケープされた形で出力される');
  });
})();

console.log(`u3-group-a-safety-net-test: ${sectionsRun} sections ok`);
