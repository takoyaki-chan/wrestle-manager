'use strict';

// U4「モーダルの外枠」統一作業に入る前の安全網。
//
// 対象は docs/ui/mockup-baseline-v0.1.md v0.6 §5-C「モーダルの外枠」で確定した領域:
//   - 共通部品 mdl-a(決裁・選択) / mdl-b(節目の演出) / mdl-c(情報パネル) / mdl-d(軽いダイアログ)
//     の開閉関数(_mdlAOpen/_mdlAClose 等、src/ui-common.js)
//   - ポップアップ重複防止機構 _POPUP_OVERLAY_IDS / _isPopupActive()(src/ui-common.js:137-163)
//   - 画面を覆うオーバーレイの z-index(現状25種類 → 統一後5階層 100/200/300/400/500)
//   - 削除予定の死んだ枠7系統(CSSはあるがJSから開かれていない)
//
// 方針(test/README.md, u3-group-a/b・u6を踏襲): ソース文字列一致だけに頼らず、
// 可能な範囲で実関数を new Function + 最小fake DOMで実際に実行し、結果を検査する。
// z-index の現状値そのもの・padding・border-radius・アニメーション名など
// 「U4でわざと変える予定」のものは固定しない(C節はログ出力のみ、assertでは落とさない)。
//
// ── このテストを書く過程で見つけたこと(直さず報告する) ──────────────────
//
// a. 死んだ「開こうとするコード」自体が死んでいる二重の死骸が2件見つかった:
//    - `_renderEventPopup()`(ui-common.js:1842)は eventPopupOverlay を開く完成したコードを
//      持つが、実際の入口 `showEventPopup()` は常に `_showEventPopupAsChoice`(mdl-a)か
//      `_renderEventPopupAsC3`(mdl-c相当)にしか分岐せず、`_renderEventPopup()` 自体がどこからも
//      呼ばれていない(定義のみで孤立)。
//    - `_closeShachoshitsuDecisionModal()`(ui-common.js:7306)も同様にどこからも呼ばれていない。
//      決裁モーダル本体(showDecisionTargetModal/showDecisionConfirmModal/showDecisionResultModal/
//      showDecisionPairModal)は実際には全て `_mdlAOpen()` 経由で描画されており、
//      shachoshitsu-decision-overlay 系DOMは(コメントに「再利用」とあるが)もう使っていない。
//    これらは削除候補の「死んだ関数」であり、U4の外枠統一と合わせて掃除できる。
//
// b. `.r3-modal-overlay` は名前に反して `showR3Modal()` がすでに `_mdlDOpen()` 経由(mdl-d)に
//    移行済みで、このクラスの要素を生成するコードはもう無い。残る参照は `_isPopupActive()` の
//    動的オーバーレイ検出と `dismissAllPopups()` のクリーンアップのみで、どちらも読み取り専用
//    (querySelector/querySelectorAll)。CSSクラスだけが取り残されている。
//
// c. `_mdlAOpen`/`_mdlBOpen`/`_mdlCOpen`/`_mdlDOpen` はいずれも「組み立て済みのHTML文字列を
//    そのまま innerHTML に流し込む」だけの薄い箱で、タイトル・本文を受け取って自前でエスケープ
//    する仕組みは持たない(エスケープは呼び出し側の責務。u3-group-a/bで確認済みの設計と同じ)。
//    そのためA節5番「HTMLエスケープが効いている」は、この層では「呼び出し側がescHtml()済みの
//    内容を渡したとき、openを経由しても壊れず・二重エスケープもされずそのまま出力に残る」ことを
//    検査する(open自体がエスケープする、という意味ではない)。
//
// ─────────────────────────────────────────────────────────────────────────

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const appSrc = readSource('src', 'app.js');
const uiRenderSrc = readSource('src', 'ui-render.js');
const managementSrc = readSource('src', 'management.js');
const dataSrc = readSource('src', 'data.js');
const matchEngineSrc = readSource('src', 'match-engine.js');
const relationshipsSrc = readSource('src', 'relationships.js');
const victoryLinesSrc = readSource('src', 'victory-lines.js');
const cssIndex = readSource('src', 'index.html');

// dead-frame 検査(D節)は「JSのどこにも開くコードが無い」ことを見たいので、
// 主要JSファイル全部を対象にする(ui-common.js以外に紛れ込んでいても検出できるように)。
const combinedSrc = [
  ui, appSrc, uiRenderSrc, managementSrc, dataSrc, matchEngineSrc, relationshipsSrc, victoryLinesSrc,
].join('\n');

// u3-group-a/b の functionSource() を踏襲しつつ、showR3Modal のような
// 分割代入引数 `function f({ a, b }) {` を誤認しないよう改良したもの。
// (素朴な「関数名の直後の最初の '{' から深さ0まで」実装だと、引数リスト内の
//  分割代入 `{ ... }` を本体の開始/終了と誤認して本体を取りこぼす)
function functionSource(name) {
  const start = ui.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} not found in ui-common.js`);
  // まず引数リストの ')' を括弧の深さで正しく見つける
  let i = ui.indexOf('(', start);
  let parenDepth = 0;
  for (; i < ui.length; i++) {
    if (ui[i] === '(') parenDepth++;
    else if (ui[i] === ')') { parenDepth--; if (parenDepth === 0) { i++; break; } }
  }
  const brace = ui.indexOf('{', i);
  let depth = 0;
  for (let j = brace; j < ui.length; j++) {
    if (ui[j] === '{') depth++;
    if (ui[j] === '}') { depth--; if (depth === 0) return ui.slice(start, j + 1); }
  }
  throw new Error(`${name} end not found`);
}
const uiFn = functionSource;

function occurrences(src, needle) {
  let count = 0;
  let idx = 0;
  while ((idx = src.indexOf(needle, idx)) !== -1) { count++; idx += needle.length; }
  return count;
}

/** name(...) という「呼び出し」が、自分自身の function 定義行以外から一度も現れないことを確認する */
function assertFunctionNeverCalled(src, fnName, message) {
  const defPattern = `function ${fnName}(`;
  const defCount = occurrences(src, defPattern);
  const totalCount = occurrences(src, `${fnName}(`);
  assert.strictEqual(totalCount - defCount, 0,
    `${message}(定義${defCount}件 / 呼び出し含む出現${totalCount}件。差が0でなければどこかから呼ばれている)`);
}

// ---------------------------------------------------------------------------
// CSS存在確認(共通部品そのもの。こちらは今回統一の「主役」なので消えない前提で存在を確認する。
// 死んだ7系統は逆に「消えてもテストが通る」設計にするため、ここでは確認しない — D節参照)
// ---------------------------------------------------------------------------
[
  'mdl-a-overlay', 'mdl-a-card', 'mdl-b-overlay', 'mdl-c-overlay', 'mdl-c-card', 'mdl-d-overlay', 'mdl-d-box',
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
// A. 共通部品の開閉 — _mdlAOpen/Close, _mdlBOpen/Close, _mdlCOpen/Close, _mdlDOpen/Close
// ===========================================================================

// className と classList が同じクラス集合を共有する fake element。
// _mdlBOpen は `overlay.className = '...'` で全上書きした直後に `overlay.classList.add('active')`
// を呼ぶため、この2つを独立管理すると実DOMと違う挙動になり検査がごまかせてしまう。
function makeMdlEl() {
  const el = { innerHTML: '', offsetWidth: 0 };
  let clsSet = new Set();
  Object.defineProperty(el, 'className', {
    get() { return Array.from(clsSet).join(' '); },
    set(v) { clsSet = new Set(String(v == null ? '' : v).split(/\s+/).filter(Boolean)); },
  });
  el.classList = {
    add(c) { clsSet.add(c); },
    remove(c) { clsSet.delete(c); },
    contains(c) { return clsSet.has(c); },
  };
  return el;
}

function makeMdlDom() {
  const els = {
    mdlAOverlay: makeMdlEl(), mdlACard: makeMdlEl(),
    mdlBOverlay: makeMdlEl(),
    mdlCOverlay: makeMdlEl(), mdlCCard: makeMdlEl(),
    mdlDOverlay: makeMdlEl(), mdlDBox: makeMdlEl(),
  };
  const doc = { getElementById: (id) => els[id] || null };
  return { doc, els };
}

const buildMdl = new Function(
  'document', '_drainPopupQueue',
  `${uiFn('escHtml')}
   ${uiFn('_mdlAOpen')}
   ${uiFn('_mdlAClose')}
   ${uiFn('_mdlBOpen')}
   ${uiFn('_mdlBClose')}
   ${uiFn('_mdlCOpen')}
   ${uiFn('_mdlCClose')}
   ${uiFn('_mdlDOpen')}
   ${uiFn('_mdlDClose')}
   return {
     escHtml, _mdlAOpen, _mdlAClose, _mdlBOpen, _mdlBClose, _mdlCOpen, _mdlCClose, _mdlDOpen, _mdlDClose,
   };`
);

function makeMdlBundle(opts) {
  opts = opts || {};
  const { doc, els } = makeMdlDom();
  const drainStub = opts.drainPopupQueue || (() => {});
  const built = buildMdl(opts.document || doc, drainStub);
  return { built, els };
}

// テンプレートごとの記述(どの要素がactiveになるか、content/escapingをどの要素で見るか)
const MDL_TEMPLATES = [
  {
    label: 'mdl-a', openFn: '_mdlAOpen', closeFn: '_mdlAClose',
    overlayId: 'mdlAOverlay', contentId: 'mdlACard',
    call: (built, html) => built._mdlAOpen(html),
    missingIds: [], // overlay/cardの両方が要る
  },
  {
    label: 'mdl-b', openFn: '_mdlBOpen', closeFn: '_mdlBClose',
    overlayId: 'mdlBOverlay', contentId: 'mdlBOverlay', // B型はoverlay自身がinnerHTMLを持つ(専用card無し)
    call: (built, html) => built._mdlBOpen(html),
  },
  {
    label: 'mdl-c', openFn: '_mdlCOpen', closeFn: '_mdlCClose',
    overlayId: 'mdlCOverlay', contentId: 'mdlCCard',
    call: (built, html) => built._mdlCOpen(html),
  },
  {
    label: 'mdl-d', openFn: '_mdlDOpen', closeFn: '_mdlDClose',
    overlayId: 'mdlDOverlay', contentId: 'mdlDBox',
    call: (built, html) => built._mdlDOpen(html),
  },
];

MDL_TEMPLATES.forEach(tpl => {
  (function templateSuite() {
    section(`${tpl.label}: open() does not throw and sets the overlay to the active state (unvariant 1)`, () => {
      const { built, els } = makeMdlBundle({});
      assert.doesNotThrow(() => tpl.call(built, '<div>content</div>'), `${tpl.openFn}は例外を投げない`);
      assert.ok(els[tpl.overlayId].classList.contains('active'), `open後、${tpl.overlayId}にactiveクラスが付く`);
    });

    section(`${tpl.label}: close() clears the active state (unvariant 2)`, () => {
      const { built, els } = makeMdlBundle({});
      tpl.call(built, '<div>content</div>');
      assert.ok(els[tpl.overlayId].classList.contains('active'), '前提: open済み');
      assert.doesNotThrow(() => built[tpl.closeFn](), `${tpl.closeFn}は例外を投げない`);
      assert.ok(!els[tpl.overlayId].classList.contains('active'), `close後、${tpl.overlayId}のactiveクラスが外れる`);
    });

    section(`${tpl.label}: the title/body/button content passed to open() shows up in the output (unvariant 3)`, () => {
      const { built, els } = makeMdlBundle({});
      const html = `<div class="x-title">見出しテキスト</div><div class="x-body">本文テキスト</div><button class="x-btn">決定ボタン</button>`;
      tpl.call(built, html);
      const out = els[tpl.contentId].innerHTML;
      assert.ok(out.includes('見出しテキスト'), 'タイトルが出力に含まれる');
      assert.ok(out.includes('本文テキスト'), '本文が出力に含まれる');
      assert.ok(out.includes('決定ボタン'), 'ボタン文言が出力に含まれる');
    });

    section(`${tpl.label}: does not throw when the content is empty/undefined/null (unvariant 4)`, () => {
      const { built } = makeMdlBundle({});
      [undefined, '', null].forEach(v => {
        assert.doesNotThrow(() => tpl.call(built, v), `${tpl.openFn}(${JSON.stringify(v)})でも例外なし`);
      });
    });

    // 不変条件5: openはHTML文字列をそのままinnerHTMLへ流すだけの薄い箱(ファイル冒頭の注記c参照)。
    // ここでは「呼び出し側がescHtml()済みの内容を渡したとき、openを経由しても壊れず・
    // 二重エスケープもされずそのまま出力に残る」ことを検査する。
    section(`${tpl.label}: pre-escaped content survives open() intact, without being corrupted or double-escaped (unvariant 5)`, () => {
      const { built, els } = makeMdlBundle({});
      const dangerousTitle = '<script>alert(1)</script>危険な見出し';
      const dangerousBody = '本文<b>強調</b>&値';
      const html = `<div class="x-title">${built.escHtml(dangerousTitle)}</div><div class="x-body">${built.escHtml(dangerousBody)}</div>`;
      tpl.call(built, html);
      const out = els[tpl.contentId].innerHTML;
      assert.ok(!out.includes('<script>alert(1)</script>'), '生のscriptタグとしては出力に出ない');
      assert.ok(out.includes('&lt;script&gt;alert(1)&lt;/script&gt;危険な見出し'), 'escHtml済みのタイトルがそのままの形(二重エスケープなし)で出力に残る');
      assert.ok(out.includes('本文&lt;b&gt;強調&lt;/b&gt;&amp;値'), 'escHtml済みの本文もそのままの形で出力に残る');
    });

    section(`${tpl.label}: open() does not throw and reports failure gracefully when the overlay/content DOM is missing`, () => {
      const missingDoc = { getElementById: () => null };
      const built = buildMdl(missingDoc, () => {});
      let result;
      assert.doesNotThrow(() => { result = tpl.call(built, '<div>x</div>'); }, 'DOM未整備でも例外を投げない');
      // _mdlBOpen/_mdlDOpenは戻り値がundefinedになるケースもあるため、真偽値としてfalsyであることだけを見る
      assert.ok(!result, 'DOM未整備時は真値(true)を返さない(失敗を伝える)');
    });
  })();
});

// close() が _drainPopupQueue() を呼ぶのは mdl-a だけ(B/C/Dはoverlay操作のみで完結する)。
// 呼び出しの有無そのものが仕様なので、ここだけ個別に確認する。
section('mdl-a close: calls _drainPopupQueue() so the next queued popup can run', () => {
  let drained = 0;
  const { built } = makeMdlBundle({ drainPopupQueue: () => { drained++; } });
  built._mdlAOpen('<div>x</div>');
  built._mdlAClose();
  assert.strictEqual(drained, 1, '_mdlAClose は _drainPopupQueue を1回呼ぶ');
});

// ===========================================================================
// B. ポップアップの重複防止 — _POPUP_OVERLAY_IDS / _isPopupActive()
// ===========================================================================

// 配列リテラルをソースから生きたまま取り出す(手で書き写すと配列が更新されたときに
// テストだけ古いままになり、指示書が求める「掃除漏れの検出」ができなくなるため)。
function popupOverlayIdsLiteral() {
  const marker = 'const _POPUP_OVERLAY_IDS = [';
  const start = ui.indexOf(marker);
  assert.ok(start >= 0, '_POPUP_OVERLAY_IDS not found in ui-common.js');
  const bracketStart = ui.indexOf('[', start);
  const end = ui.indexOf('];', bracketStart);
  assert.ok(end >= 0, '_POPUP_OVERLAY_IDS end (];) not found');
  return ui.slice(bracketStart, end + 1);
}

const POPUP_OVERLAY_IDS = new Function(`return ${popupOverlayIdsLiteral()};`)();

section('_POPUP_OVERLAY_IDS: is a non-empty array of id strings (sanity check on the extraction itself)', () => {
  assert.ok(Array.isArray(POPUP_OVERLAY_IDS) && POPUP_OVERLAY_IDS.length > 0, '配列として取り出せている');
  POPUP_OVERLAY_IDS.forEach(id => assert.strictEqual(typeof id, 'string', `${id}は文字列`));
});

section('_POPUP_OVERLAY_IDS: every listed id actually exists as an element in src/index.html (unvariant 6)', () => {
  const missing = POPUP_OVERLAY_IDS.filter(id => !cssIndex.includes(`id="${id}"`));
  assert.deepStrictEqual(missing, [],
    `リストに載っているが index.html に無いID: [${missing.join(', ')}]。死んだ枠を削除したときの掃除漏れが無いか、ここで検出する`);
});

const buildActive = new Function(
  'document',
  `const _POPUP_OVERLAY_IDS = ${popupOverlayIdsLiteral()};
   ${uiFn('_isPopupActive')}
   return { _isPopupActive };`
);

function makeActiveDom(opts) {
  opts = opts || {};
  const activeIds = opts.activeIds || [];
  const elMap = {};
  POPUP_OVERLAY_IDS.forEach(id => {
    elMap[id] = { classList: { contains: (c) => activeIds.includes(id) && (c === 'active' || c === 'show') } };
  });
  const factionRoot = opts.noFactionRoot ? null : {
    querySelector: () => (opts.factionRootActive ? {} : null),
  };
  const doc = {
    getElementById: (id) => {
      if (id === 'factionEventRoot') return factionRoot;
      return elMap[id] || null;
    },
    querySelector: (sel) => {
      if (sel === '.r3-modal-overlay') return opts.r3Active ? {} : null;
      if (sel === '.war-victory-overlay') return opts.warActive ? {} : null;
      return null;
    },
  };
  return doc;
}

section('_isPopupActive: returns true when a static overlay currently has the "active" class (unvariant 7)', () => {
  const { _isPopupActive } = buildActive(makeActiveDom({ activeIds: ['mdlAOverlay'], noFactionRoot: true }));
  assert.strictEqual(_isPopupActive(), true, 'mdlAOverlayがactiveならtrueを返す');
});

section('_isPopupActive: also recognizes the legacy "show" class, not just "active"', () => {
  const { _isPopupActive } = buildActive(makeActiveDom({ activeIds: ['seasonFanfareOverlay'], noFactionRoot: true }));
  assert.strictEqual(_isPopupActive(), true, 'showクラスでも検出できる(seasonFanfareOverlay等が使う旧クラス名)');
});

section('_isPopupActive: returns false when nothing in the list is active (unvariant 8)', () => {
  const { _isPopupActive } = buildActive(makeActiveDom({ activeIds: [], noFactionRoot: true }));
  assert.strictEqual(_isPopupActive(), false, '何も開いていなければfalse');
});

section('_isPopupActive: also detects an active faction-event overlay layer (dynamic overlay, not in the static id list)', () => {
  const { _isPopupActive } = buildActive(makeActiveDom({ activeIds: [], factionRootActive: true }));
  assert.strictEqual(_isPopupActive(), true, 'factionEventRoot配下にactiveな演出レイヤーがあればtrue');
});

section('_isPopupActive: also detects the dynamically-appended r3-modal-overlay / war-victory-overlay', () => {
  const { _isPopupActive: isActiveR3 } = buildActive(makeActiveDom({ activeIds: [], noFactionRoot: true, r3Active: true }));
  assert.strictEqual(isActiveR3(), true, '.r3-modal-overlayが存在すればtrue(動的追加DOM)');
  const { _isPopupActive: isActiveWar } = buildActive(makeActiveDom({ activeIds: [], noFactionRoot: true, warActive: true }));
  assert.strictEqual(isActiveWar(), true, '.war-victory-overlayが存在すればtrue(動的追加DOM)');
});

section('_isPopupActive: opts.ignoreShowResultOverlay lets showResultOverlay be excluded from the check', () => {
  const doc = makeActiveDom({ activeIds: ['showResultOverlay'], noFactionRoot: true });
  const { _isPopupActive } = buildActive(doc);
  assert.strictEqual(_isPopupActive(), true, 'デフォルトではshowResultOverlayもactive判定に含まれる');
  assert.strictEqual(_isPopupActive({ ignoreShowResultOverlay: true }), false,
    'ignoreShowResultOverlay:trueのときはshowResultOverlayだけ無視される(F09開幕モーダルの循環待ち回避用)');
});

// ===========================================================================
// C. 重なり順(z-index)の現状値サーベイ — ログ出力のみ。assertでは落とさない。
//    docs/ui/mockup-baseline-v0.1.md v0.6 §5-C: 統一後は100/200/300/400/500の5階層に固定予定。
//    今はまだ混在しているので、ここでは「今何がどの値か」を記録するだけに留める。
// ===========================================================================
(function zIndexSurveySuite() {
  function firstRuleBlock(selector) {
    const idx = cssIndex.indexOf(selector + '{');
    const searchIdx = idx >= 0 ? idx : cssIndex.indexOf(selector);
    if (searchIdx < 0) return null;
    const braceIdx = cssIndex.indexOf('{', searchIdx);
    if (braceIdx < 0) return null;
    const closeIdx = cssIndex.indexOf('}', braceIdx);
    if (closeIdx < 0) return null;
    return cssIndex.slice(braceIdx, closeIdx);
  }
  function zIndexOf(selector) {
    const block = firstRuleBlock(selector);
    if (!block) return null;
    const m = block.match(/z-index:\s*(-?\d+)/);
    return m ? m[1] : null;
  }

  // 画面を覆うオーバーレイ/モーダル系セレクタ(現状の主なもの。網羅は目的ではなく、
  // 「どのセレクタが今どの値を使っているか」を統一作業の着手前に見えるようにするのが目的)
  const targets = [
    '.show-result-overlay', '.emr-layer', '.title-screen', '.org-setup',
    '.coach-tooltip-overlay', '.fighter-popup-overlay', '.db-hof-detail-overlay',
    '.confirm-overlay', '.awards-overlay', '.growth-event-overlay', '.gameover-overlay',
    '.credits-overlay', '.rm-popup-overlay', '.jt-so', '.agw-overlay',
    '.care-modal-overlay', '.notif-modal-overlay', '.season-fanfare-overlay',
    '.milestone-overlay', '.glimpse-cascade-overlay', '.care-overlay',
    '.event-popup-overlay', '.retirement-popup-overlay', '.rivalry-popup-overlay',
    '.newspaper-overlay', '.shachoshitsu-decision-overlay', '.mdl-shacho-bg',
    '.mdl-a-overlay', '.mdl-b-overlay', '.mdl-c-overlay', '.mdl-d-overlay',
    '.r3-modal-overlay',
  ];

  section('z-index survey: dumps the current value for every screen-covering overlay/modal selector (informational only — see console output; not asserted, U4 will deliberately change these)', () => {
    const rows = targets.map(sel => ({ sel, z: zIndexOf(sel) }));
    console.log('  [z-index survey] U4着手前の現状値(統一後は 100/200/300/400/500 の5階層に固定予定):');
    rows.forEach(r => {
      const label = r.z === null ? '(見つからず)' : String(r.z).padStart(5, ' ');
      console.log(`    ${label}  ${r.sel}`);
    });
    const distinctValues = Array.from(new Set(rows.filter(r => r.z !== null).map(r => Number(r.z)))).sort((a, b) => a - b);
    console.log(`  [z-index survey] 現状の値の種類: ${distinctValues.length}種 → [${distinctValues.join(', ')}]`);
    const notFound = rows.filter(r => r.z === null).map(r => r.sel);
    if (notFound.length > 0) console.log(`  [z-index survey] z-indexが見つからなかったセレクタ(親要素の値を継承している可能性): ${notFound.join(', ')}`);
    // このセクションはログ出力が目的。実行できたこと自体だけを確認する(指示書:「assertでは落とさない」)。
    assert.ok(true);
  });
})();

// ===========================================================================
// D. 死んだ枠が復活しないこと — 削除予定の7系統
//    CSSは(今は)存在してよいが、それを生成するコードがJSのどこにも無いことを固定する。
//    削除後もこのテストが通り続けるよう、CSSクラスの存在は確認しない(D節冒頭コメント参照)。
// ===========================================================================
(function deadFrameSuite() {
  section('dead frame 1/7 — .milestone-overlay: referenced only once in the whole JS codebase (inside the popup-queue id list); nothing opens it', () => {
    const count = occurrences(combinedSrc, 'milestoneOverlay');
    assert.strictEqual(count, 1,
      `milestoneOverlay の出現回数は1(_POPUP_OVERLAY_IDS内の1件のみ)のはず。現在値: ${count}件。増えていたら誰かが新たに開こうとしている`);
  });

  section('dead frame 2/7 — .rivalry-popup-overlay: referenced only once in the whole JS codebase (inside the popup-queue id list); nothing opens it', () => {
    const count = occurrences(combinedSrc, 'rivalryPopupOverlay');
    assert.strictEqual(count, 1,
      `rivalryPopupOverlay の出現回数は1(_POPUP_OVERLAY_IDS内の1件のみ)のはず。現在値: ${count}件`);
  });

  section('dead frame 3/7 — .retirement-popup-overlay: the only other reference is a defensive classList.remove, never an add', () => {
    const count = occurrences(combinedSrc, 'retirementPopupOverlay');
    assert.strictEqual(count, 2,
      `retirementPopupOverlay の出現回数は2(_POPUP_OVERLAY_IDS内の1件 + closeRetirementPopupの互換クリーンアップ1件)のはず。現在値: ${count}件`);
    assert.ok(!combinedSrc.includes("getElementById('retirementPopupOverlay').classList.add"),
      'retirementPopupOverlay に対して classList.add(...) するコードは無い(あるのはclassList.removeの互換処理のみ)');
  });

  section('dead frame 4/7 — .shachoshitsu-decision-overlay: the only function referencing it (_closeShachoshitsuDecisionModal) is itself unreachable; the live decision modals all use mdl-a', () => {
    const idCount = occurrences(combinedSrc, 'shachoshitsuDecisionOverlay');
    assert.strictEqual(idCount, 1,
      `shachoshitsuDecisionOverlay の出現回数は1(_closeShachoshitsuDecisionModal内のgetElementById呼び出しのみ)のはず。現在値: ${idCount}件`);
    assertFunctionNeverCalled(combinedSrc, '_closeShachoshitsuDecisionModal',
      '_closeShachoshitsuDecisionModal自体、どこからも呼ばれていない(定義のみで孤立した関数)');

    ['showDecisionTargetModal', 'showDecisionConfirmModal', 'showDecisionResultModal', 'showDecisionPairModal'].forEach(fnName => {
      const body = uiFn(fnName);
      assert.ok(!body.includes('shachoshitsuDecisionOverlay') && !body.includes('shachoshitsu-decision'),
        `${fnName} は shachoshitsu-decision-overlay系DOMを参照していない(すでにmdl-aへ移行済み)`);
      assert.ok(body.includes('_mdlAOpen('), `${fnName} は _mdlAOpen 経由で描画している(生きている経路であることの確認)`);
    });
  });

  section('dead frame 5/7 — .mdl-shacho-bg: zero references anywhere in the JS source', () => {
    const count = occurrences(combinedSrc, 'mdl-shacho-bg');
    assert.strictEqual(count, 0, `mdl-shacho-bg はJS側から一切参照されていないはず。現在値: ${count}件`);
  });

  section('dead frame 6/7 — .event-popup-overlay: the only function that activates it (_renderEventPopup) is unreachable from the live entry point showEventPopup()', () => {
    const idCount = occurrences(combinedSrc, 'eventPopupOverlay');
    assert.strictEqual(idCount, 2,
      `eventPopupOverlay の出現回数は2(_POPUP_OVERLAY_IDS内の1件 + 孤立した関数_renderEventPopup内のactivate呼び出し1件)のはず。現在値: ${idCount}件`);
    assertFunctionNeverCalled(combinedSrc, '_renderEventPopup',
      '_renderEventPopup自体、どこからも呼ばれていない(定義のみで孤立。完成したactivateコードを持つが到達不能)');

    const showEventPopupBody = uiFn('showEventPopup');
    assert.ok(!showEventPopupBody.includes('_renderEventPopup('),
      'showEventPopup() は _renderEventPopup を呼ばない');
    assert.ok(showEventPopupBody.includes('_showEventPopupAsChoice(') && showEventPopupBody.includes('_renderEventPopupAsC3('),
      'showEventPopup() の実際の分岐先はmdl-a(_showEventPopupAsChoice)/mdl-c相当(_renderEventPopupAsC3)のみ(生きている経路であることの確認)');
  });

  section('dead frame 7/7 — .r3-modal-overlay: showR3Modal has already migrated to mdl-d; the remaining references are read-only cleanup/detection checks', () => {
    const count = occurrences(combinedSrc, 'r3-modal-overlay');
    assert.strictEqual(count, 2,
      `r3-modal-overlay の出現回数は2(_isPopupActiveの動的オーバーレイ検出1件 + dismissAllPopupsのクリーンアップ1件)のはず。現在値: ${count}件`);
    const showR3ModalBody = uiFn('showR3Modal');
    assert.ok(!showR3ModalBody.includes('r3-modal-overlay'),
      'showR3Modal() はもう r3-modal-overlay クラスの要素を生成していない(すでにmdl-dへ移行済み)');
    assert.ok(showR3ModalBody.includes('_mdlDOpen('),
      'showR3Modal() の実体は _mdlDOpen 経由(生きている経路であることの確認)');
  });
})();

console.log(`u4-modal-frame-safety-net-test: ${sectionsRun} sections ok`);
