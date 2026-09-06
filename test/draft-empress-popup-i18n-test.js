'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/draft-empress-popup-i18n-test.js — EMPRESS安全網「電撃契約」通知ポップアップの
//  復活ガード (i18n Stage B 裁定 F-2 / P7-55)
//
//  ■ 何を守るか
//    ドラフト後にS級団体(EMPRESS安全網 §6.4)が有力新人を電撃契約で奪った週、
//    `_finalizeDraft`(src/ui-common.js)は業界紙報道のポップアップを出そうとしていたが、
//    呼んでいた `showPopup` という関数が src のどこにも定義されておらず
//    `typeof showPopup === 'function'` のガードで黙って素通りしていた
//    (=実装以来一度も画面に出ていなかった。docs/i18n-keisuke-rulings-pending-v0.1.md F-2)。
//    P7-55で現行のポップアップ基盤 `showEventPopup` へ載せ替えて復活させた。
//    この回帰ガードは「復活したこと」と「もう一度死なないこと」を機械で押さえる。
//
//  ■ 4つの検査
//    0. ソース走査: 未定義の `showPopup` 呼び出し・ガードが跡形もなく消え、
//       `showEventPopup` へ置き換わっていること
//    1. EMPRESS発火時、`_finalizeDraft` を1回実行すると `showEventPopup` が
//       **exactly once** 呼ばれること(二重発火なし)
//    2. JA(パススルー)/EN(実辞書 src/lang-en.js・src/lang-en-names.js)の両方で
//       message/detail が `{name}`/`{orgName}` を含まず完全に解決すること
//       (旧コードは生JAテンプレ文字列を直接組み立てておりEN未対応だった)
//    3. ゲームログ `draft_empress_reinforce_news` は従来どおり積まれること(退行なし)
//    4. EMPRESSが発火しない週(空イベント配列)では `showEventPopup` が一切呼ばれない
//       (fail-open。旧セーブ・通常のドラフト週で誤発火しないことの確認)
//
//  ■ 使い方
//    node test/draft-empress-popup-i18n-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { readSource } = require('./helpers/source.js');
const { loadGame } = require('./helpers/load-game.js');

// ── 0. ソース走査: 死んだ showPopup が跡形もなく消えている ──────────────────
const uiSrc = readSource('src', 'ui-common.js');
assert.ok(!/\bshowPopup\s*\(/.test(uiSrc), 'showPopup(...) 呼び出しが残っている(未定義関数への配線)');
assert.ok(!/typeof showPopup\b/.test(uiSrc), 'typeof showPopup ガードが残っている(死んだ分岐)');
assert.ok(/if \(typeof showEventPopup === 'function'\) \{\s*\n\s*setTimeout\(\(\) => \{\s*\n\s*showEventPopup\(\{/.test(uiSrc),
  '_finalizeDraft の EMPRESS通知が showEventPopup(現行基盤) へ配線されていない');

// ── 1. 実エンジンをロード(ドラフト系含む) ──────────────────────────────────
global.window = global.window || {};
if (typeof global.window.IS_TRIAL === 'undefined') global.window.IS_TRIAL = false;
loadGame({ draft: true });

// u4-modal-frame-safety-net-test.js の functionSource() と同じ発想(分割代入引数を
// 誤認しない版)で _finalizeDraft のソースを1関数だけ抽出する。
function functionSource(src, name) {
  const startNeedle = `function ${name}(`;
  const start = src.indexOf(startNeedle);
  assert.ok(start >= 0, `${name} が見つからない`);
  let i = src.indexOf('(', start);
  let parenDepth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') parenDepth++;
    else if (src[i] === ')') { parenDepth--; if (parenDepth === 0) { i++; break; } }
  }
  const brace = src.indexOf('{', i);
  let depth = 0;
  for (let j = brace; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error(`${name} end not found`);
}

const finalizeDraftSrc = functionSource(uiSrc, '_finalizeDraft');

// ── EN辞書(実ファイル)の読み込み ────────────────────────────────────────
const EN_DICT = Object.create(null);
const EN_NAMES = Object.create(null);
const enSandboxGlobals = {
  WM_I18N: {
    addDict(obj) { Object.assign(EN_DICT, obj); },
    addNames(obj) { Object.assign(EN_NAMES, obj); },
    addSurnames() {}, addMoves() {}, addMoveShorts() {},
    t(text, params) { return text; }, // ロード時に誤って呼ばれても壊れないためのno-op
  },
};
['lang-en.js', 'lang-en-names.js'].forEach((f) => {
  const code = readSource('src', f);
  new (require('vm').Script)(code, { filename: f }).runInNewContext(enSandboxGlobals);
});
assert.ok(Object.keys(EN_DICT).length > 1000, 'EN辞書の読み込みに失敗した');

// 実装(src/i18n.js applyParams)と同じ契約を再現する: lang=enのとき、パラメータ値が
// 文字列かつ名前辞書に完全一致すれば「パラメータ名に関わらず」変換してから埋め込む
// (D-P6-2)。{orgName}側は本コードで明示pn()していないが、この自動変換だけで
// 英語化される設計のため、テストのスタブもここを端折ると偽陽性/偽陰性が出る。
function makeWmI18n(mode) {
  return {
    t(text, params) {
      let out = mode === 'en' ? (Object.prototype.hasOwnProperty.call(EN_DICT, text) ? EN_DICT[text] : text) : text;
      if (params) {
        Object.keys(params).forEach((k) => {
          let raw = params[k];
          if (mode === 'en' && typeof raw === 'string' && Object.prototype.hasOwnProperty.call(EN_NAMES, raw)) {
            raw = EN_NAMES[raw];
          }
          out = out.split('{' + k + '}').join(String(raw));
        });
      }
      return out;
    },
    pn(name) {
      if (mode === 'en' && Object.prototype.hasOwnProperty.call(EN_NAMES, name)) return EN_NAMES[name];
      return name;
    },
  };
}

// ── _finalizeDraft を隔離実行するファクトリ ──────────────────────────────
function runFinalizeDraft({ empEvents, wmT }) {
  const calls = [];
  const fakeShowEventPopup = (opts) => calls.push(opts);
  const fakeSetTimeout = (fn) => fn(); // テストでは500msの遅延を同期実行に潰す
  const stubBuildGetPage = () => ({});
  const stubBuildSummaryPage = () => ({});
  const stubQueueNews = (state) => state;

  const factory = new Function(
    'RIVAL_ORGS', 'Engine', '_buildDraftGetPage', '_buildDraftSummaryPage',
    '_queueDraftIndustryNews', 'showEventPopup', 'setTimeout', 'WM_I18N',
    `${finalizeDraftSrc}\nreturn _finalizeDraft;`
  );

  const fnEngine = {
    rng: global.Engine.rng,
    draftNegotiation: { empressReinforce: () => empEvents },
    rival: { pushUniqueFighter: global.Engine.rival.pushUniqueFighter },
  };

  // org_s.name はゲーム開始時に RIVAL_ORG_NAME_POOL からランダムに割り当てられ、
  // 実プレイでは空文字になることはない(空文字→'S級団体'フォールバックは静的
  // テンプレ上の定義時デフォルトにしか存在しない到達不能分岐)。テストも実プレイと
  // 同じ「名前が付いた状態」(名前辞書に登録済みの実在プール名)で検査する。
  const rivalOrgsWithName = global.RIVAL_ORGS.map(o => (o.id === 'org_s' ? { ...o, name: '皇武館' } : o));

  const finalizeDraft = factory(
    rivalOrgsWithName, fnEngine, stubBuildGetPage, stubBuildSummaryPage,
    stubQueueNews, fakeShowEventPopup, fakeSetTimeout, wmT
  );

  const state = {
    season: 3, week: 48,
    gameLog: [],
    aiOrgs: { org_s: { roster: [] }, org_a: { roster: [] }, org_b: { roster: [] } },
    dormantPool: [{ id: 1, age: 17 }],
    roster: [], freeAgents: [],
    _draftNegotiation: { acquiredThisSession: [] },
  };
  const summary = { flowThrough: [] };

  const result = finalizeDraft(state, summary, 12345, 5);
  return { result, calls };
}

// 実在キャラ(ALL_CHARS[0]、阿武隈塔子)を使う — 名前辞書に実際に登録されている
// フルネームでENの完全解決(pn())まで確認するため、テスト専用の合成名は使わない。
const REAL_CHAR = global.ALL_CHARS[0];
const canned = {
  fighter: { ...REAL_CHAR, id: REAL_CHAR.id, condition: 80 },
  template: { id: REAL_CHAR.id, name: REAL_CHAR.name },
  dormantIdRemoved: REAL_CHAR.id,
};

// ── 2. JAモード: exactly once・プレースホルダ完全解決・ゲームログ退行なし ──
{
  const { result, calls } = runFinalizeDraft({
    empEvents: [{ type: 'empressReinforce', ...canned }],
    wmT: makeWmI18n('ja'),
  });
  assert.strictEqual(calls.length, 1, `JA: showEventPopup は1回だけ呼ばれるべき(実測${calls.length}回)`);
  const opts = calls[0];
  assert.strictEqual(opts.type, 'system');
  assert.strictEqual(opts.tone, 'negative');
  assert.ok(!/\{[a-zA-Z]+\}/.test(opts.message), `JA: message にプレースホルダが残っている: ${opts.message}`);
  assert.ok(!/\{[a-zA-Z]+\}/.test(opts.detail), `JA: detail にプレースホルダが残っている: ${opts.detail}`);
  assert.ok(opts.message.includes(REAL_CHAR.name) && opts.message.includes('業界紙報道') && opts.message.includes('電撃契約') && opts.message.includes('皇武館'),
    `JA: messageの文面が期待と違う: ${opts.message}`);
  assert.ok(opts.detail.includes('スカウト合戦'), `JA: detailの文面が期待と違う: ${opts.detail}`);

  const newsLog = result.gameLog.filter(e => e.type === 'draft_empress_reinforce_news');
  assert.strictEqual(newsLog.length, 1, 'draft_empress_reinforce_news のログ行が退行している');
  assert.strictEqual(newsLog[0].data.name, REAL_CHAR.name);
}

// ── 3. ENモード: 実辞書を通して完全解決(JA文字が残らない) ──────────────────
{
  const { calls } = runFinalizeDraft({
    empEvents: [{ type: 'empressReinforce', ...canned }],
    wmT: makeWmI18n('en'),
  });
  assert.strictEqual(calls.length, 1, `EN: showEventPopup は1回だけ呼ばれるべき(実測${calls.length}回)`);
  const opts = calls[0];
  const JA_RE = /[぀-ヿ㐀-䶿一-鿿ｦ-ﾟ]/;
  assert.ok(!/\{[a-zA-Z]+\}/.test(opts.message), `EN: message にプレースホルダが残っている: ${opts.message}`);
  assert.ok(!/\{[a-zA-Z]+\}/.test(opts.detail), `EN: detail にプレースホルダが残っている: ${opts.detail}`);
  assert.ok(!JA_RE.test(opts.message), `EN: message に日本語が漏れている: ${opts.message}`);
  assert.ok(!JA_RE.test(opts.detail), `EN: detail に日本語が漏れている: ${opts.detail}`);
  const expectedEnName = EN_NAMES[REAL_CHAR.name];
  assert.ok(expectedEnName, `${REAL_CHAR.name} が名前辞書に無い(テスト前提が崩れている)`);
  assert.strictEqual(opts.message, `From the trade press: ${expectedEnName} signs with Kobukan out of nowhere`,
    'EN: 選手名・団体名ともに名前辞書経由で完全に英語化されるべき');
  assert.strictEqual(opts.detail, 'Talks had been running in secret behind the scouting war');
}

// ── 4. 空イベント: 一度も呼ばれない(fail-open・誤発火なし) ─────────────────
{
  const { calls, result } = runFinalizeDraft({ empEvents: [], wmT: makeWmI18n('ja') });
  assert.strictEqual(calls.length, 0, 'EMPRESS不発火時に showEventPopup が呼ばれてはいけない');
  const newsLog = result.gameLog.filter(e => e.type === 'draft_empress_reinforce_news');
  assert.strictEqual(newsLog.length, 0, 'EMPRESS不発火時にニュースログが積まれている');
}

console.log('draft-empress-popup-i18n-test: ok (JA/EN各1回発火・プレースホルダ完全解決・空イベントで不発火)');
