'use strict';

// U6: 団体の識別表示 統一作業の安全網。
//
// docs/ui/mockup-baseline-v0.1.md v0.4 §5「団体バッジ」が確定仕様:
//   - エンブレムは実画像を使う(orgIconHtml())。頭文字の代用は禁止
//   - 出す条件: 他団体が絡む試合のみ。自団体内の試合では出さない
//   - 自陣=--c-positive系 / 敵陣=--accent-hostility系
//
// 全数調査の結果、頭文字1文字を実画像の代用として使っている箇所(是正対象)は
// 見つからなかった(_emrOrgBadgeHtml / _u3bOrgBadgeHtml / _awOrgEmblem / _chOrgEmblemInner /
// _npOrgEmblem / rp-rank-fallback / dn-emblem-player は、いずれも実画像を最優先し、
// orgIdが解決できない経路でだけ頭文字へフォールバックする既存の正しい実装だった)。
// 代わりに見つかった実際の是正対象は「エンブレムそのものが一切出ていない」4画面:
//   1. buildOrgSummaryCard   database「団体比較」画面のVSカード(ui-render.js, _renderDbOrgCompare内)
//   2. renderSide            PPV VS比較ポップアップ(ui-common.js, showPPVVSDetail内)
//   3. _renderB3MatchPreview 挑戦状(B3)対戦プレビュー(ui-common.js)
//   4. renderPPVTvBroadcast  PPV GRAND FINAL テレビ中継(ui-common.js)
// この4画面に orgIconHtml() 経由の実エンブレムを追加した。
//
// 方針(test/README.md, u3-group-a/b を踏襲): ソース文字列一致ではなく実関数を
// new Function で取り出して最小スタブ上で実行し、「壊れたら困る」不変条件だけを検査する。
//   1. 描画関数が例外を投げない
//   2. どの団体かが出力から判別できる(画像URLか団体名のどちらかが必ず出る)
//   3. 自団体と他団体が出力で区別できる(他団体が絡むときは実エンブレムが出る/
//      自団体内では出さない、という出す条件そのものも含む)
//   4. orgIdが無い/不正なときも落ちない
//   5. HTMLエスケープが効いている

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const uiRender = readSource('src', 'ui-render.js');
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

// ---------------------------------------------------------------------------
// CSS存在確認(この回で扱うクラスが実際に定義されていること)
// ---------------------------------------------------------------------------
[
  'u3b-org-badge', 'u3b-org-home', 'u3b-org-away',
  'emr-org-badge', 'emr-org-home', 'emr-org-away',
  'db-cmp-org-summary-title', 'np-org-card-title',
].forEach(cls => {
  assert.ok(cssIndex.includes(`.${cls}`), `.${cls}がindex.htmlに存在する`);
});
// --pb-enemy-color(団体固有色)は判断が要る点として残置した。誤って消されていないかの安全網
assert.ok(cssIndex.includes('--pb-enemy-color'), '団体固有色(--pb-enemy-color)は今回のU6作業では削除していない(判断待ち、report参照)');

let sectionsRun = 0;
function section(name, fn) {
  fn();
  sectionsRun++;
  console.log(`  [ok] ${name}`);
}

// ===========================================================================
// 1. orgIconHtml — 団体エンブレムの実画像タグ生成コア関数(ui-common.js)
// ===========================================================================
(function orgIconHtmlSuite() {
  const build = new Function('Engine', 'G', `${uiFn('orgIconHtml')} return { orgIconHtml };`);
  function makeBundle(opts) {
    opts = opts || {};
    const EngineStub = opts.Engine || {
      util: {
        getPlayerOrgIconPath: () => 'image/org/org-player-0.png',
        getOrgIconPath: (state, orgId) => (orgId === 'org_a' ? 'image/org/org-a-0.png' : ''),
      },
    };
    return build(EngineStub, opts.G || {});
  }

  section('orgIconHtml: returns a real emblem <img> for a resolvable rival org (unvariant 2)', () => {
    const built = makeBundle({});
    const html = built.orgIconHtml('org_a', 20);
    assert.ok(html.includes('<img'), '<img>タグが返る');
    assert.ok(html.includes('image/org/org-a-0.png'), '実エンブレム画像のパスが使われる(頭文字の代用ではない)');
  });

  section('orgIconHtml: returns the player emblem for orgId="player"', () => {
    const built = makeBundle({});
    assert.ok(built.orgIconHtml('player', 20).includes('image/org/org-player-0.png'));
  });

  section('orgIconHtml: returns an empty string (no built-in initial fallback) when the path cannot be resolved (unvariant 4)', () => {
    const built = makeBundle({ Engine: { util: { getPlayerOrgIconPath: () => '', getOrgIconPath: () => '' } } });
    assert.strictEqual(built.orgIconHtml('org_x', 20), '', 'パス未解決時は空文字を返す(頭文字フォールバックは呼び出し側の責務)');
  });
})();

// ===========================================================================
// 2. _u3bOrgBadgeHtml — U3統一の団体バッジ(既に準拠済みの手本。回帰確認)
// ===========================================================================
(function u3bOrgBadgeSuite() {
  const build = new Function(
    'Engine', 'G',
    `${uiFn('escHtml')}
     ${uiFn('_u3bOrgBadgeHtml')}
     return { _u3bOrgBadgeHtml };`
  );
  function makeBundle(opts) {
    opts = opts || {};
    const EngineStub = opts.Engine || {
      util: {
        getPlayerOrgIconPath: () => 'image/org/org-player-0.png',
        getOrgIconPath: (state, orgId) => (orgId === 'org_a' ? 'image/org/org-a-0.png' : ''),
      },
    };
    return build(EngineStub, opts.G || {});
  }

  section('u3b-org-badge: home badge carries the home class and the real player emblem (unvariant 2, 3)', () => {
    const built = makeBundle({});
    const html = built._u3bOrgBadgeHtml({ orgId: 'player', orgName: 'プレイヤー団体', isHome: true });
    assert.ok(html.includes('u3b-org-home'), '自陣クラスが付く');
    assert.ok(!html.includes('u3b-org-away'), '敵陣クラスは付かない(陣営が排他的に判別できる)');
    assert.ok(html.includes('image/org/org-player-0.png'), '実エンブレム画像が使われる');
    assert.ok(html.includes('プレイヤー団体'), '団体名が出る');
  });

  section('u3b-org-badge: away badge carries the away class and escapes a hostile org name (unvariant 3, 5)', () => {
    const built = makeBundle({});
    const html = built._u3bOrgBadgeHtml({ orgId: 'org_a', orgName: '<script>alert(1)</script>', isHome: false });
    assert.ok(html.includes('u3b-org-away'), '敵陣クラスが付く');
    assert.ok(html.includes('image/org/org-a-0.png'), '実エンブレム画像が使われる');
    assert.ok(!html.includes('<script>alert(1)</script>'), '団体名は生のまま出力されない');
    assert.ok(html.includes('&lt;script&gt;'), 'escHtml()でエスケープされる');
  });

  section('u3b-org-badge: falls back to a 1-letter initial only on the unresolvable-path route, and stays empty without orgName/badge (unvariant 1, 4)', () => {
    const built = makeBundle({ Engine: { util: { getPlayerOrgIconPath: () => '', getOrgIconPath: () => '' } } });
    const html = built._u3bOrgBadgeHtml({ orgId: 'org_z', orgName: '未知団体', isHome: false });
    assert.ok(!html.includes('<img'), '画像が解決できないときは<img>を出さない');
    assert.ok(html.includes('未'), '頭文字1文字にフォールバックする(画像未解決の経路限定)');
    assert.doesNotThrow(() => built._u3bOrgBadgeHtml(null));
    assert.strictEqual(built._u3bOrgBadgeHtml(null), '', 'badgeが無ければ何も出さない(出す条件: 他団体が絡む試合のみ)');
    assert.strictEqual(built._u3bOrgBadgeHtml({ orgId: 'player' }), '', 'orgNameが無ければ何も出さない');
  });
})();

// ===========================================================================
// 3. _emrOrgBadgeHtml — 試合結果ポップアップの団体バッジ(既に準拠済みの手本。回帰確認)
// ===========================================================================
(function emrOrgBadgeSuite() {
  const build = new Function(
    'Engine', 'G',
    `${uiFn('escHtml')}
     ${uiFn('_emrOrgInitial')}
     ${uiFn('_emrOrgBadgeHtml')}
     return { _emrOrgBadgeHtml };`
  );
  function makeBundle(opts) {
    opts = opts || {};
    const EngineStub = opts.Engine || {
      util: {
        getPlayerOrgIconPath: () => 'image/org/org-player-0.png',
        getOrgIconPath: (state, orgId) => (orgId === 'org_a' ? 'image/org/org-a-0.png' : ''),
      },
    };
    return build(EngineStub, opts.G || {});
  }

  section('emr-org-badge: left(home)/right(away) sides are distinguishable via class (unvariant 3)', () => {
    const built = makeBundle({});
    const homeHtml = built._emrOrgBadgeHtml('player', 'プレイヤー団体', 'left');
    const awayHtml = built._emrOrgBadgeHtml('org_a', 'ライバル団体', 'right');
    assert.ok(homeHtml.includes('emr-org-home') && !homeHtml.includes('emr-org-away'));
    assert.ok(awayHtml.includes('emr-org-away') && !awayHtml.includes('emr-org-home'));
    assert.ok(homeHtml.includes('image/org/org-player-0.png') && awayHtml.includes('image/org/org-a-0.png'),
      '両陣営とも実エンブレム画像が使われる(unvariant 2)');
  });

  section('emr-org-badge: falls back to the initial only when the org path is unresolvable, escapes the org name (unvariant 4, 5)', () => {
    const built = makeBundle({ Engine: { util: { getPlayerOrgIconPath: () => '', getOrgIconPath: () => '' } } });
    const html = built._emrOrgBadgeHtml('org_z', '<script>alert(1)</script>', 'right');
    assert.ok(!html.includes('<img'), '画像未解決時は<img>を出さない');
    assert.ok(!html.includes('<script>alert(1)</script>'), '団体名は生のまま出力されない');
    assert.ok(html.includes('&lt;script&gt;'), '団体名がescHtml()でエスケープされる(頭文字フォールバック文字列も同様にescHtml経由)');
  });

  section('emr-org-badge: returns empty string without an org name (unvariant 1)', () => {
    const built = makeBundle({});
    assert.strictEqual(built._emrOrgBadgeHtml('player', '', 'left'), '');
    assert.strictEqual(built._emrOrgBadgeHtml('player', null, 'left'), '');
  });
})();

// ── 2026-07-26: 対象だった3画面(database団体比較 / PPV VS比較 / B3対戦プレビュー)は
//    いずれも到達不能な死にコードだったため関数ごと削除した。生きている後継画面の検査は
//    cross-org-emblem-live-screens-test.js が担当する。

// ===========================================================================
// 4-B. _npRenderPage2 — 新聞2面「団体比較」の団体サマリーカード(ui-render.js)
//    是正対象: buildOrgSummaryCard(database タブ)と同じ内容を独自に再実装した画面で、
//    こちらも従来はエンブレムが一切無かった。同じ .np-org-card-title ラッパーパターンで統一。
// ===========================================================================
(function npOrgCardSuite() {
  section('_npRenderPage2 wires real org emblems (26px) into both newspaper org-summary cards', () => {
    assert.ok(uiRender.includes("_npOrgEmblem(G, 'player', 26)"), '新聞2面プレイヤーカードへ実エンブレムを渡している');
    assert.ok(uiRender.includes('_npOrgEmblem(G, _dbCompareTarget, 26)'), '新聞2面の比較相手カードへ実エンブレムを渡している');
    assert.ok(uiRender.includes('np-org-card-title'), '新聞2面のカード見出しにも専用ラッパーが導入されている');
  });
})();



// ===========================================================================
// 7. renderPPVTvBroadcast — PPV GRAND FINAL テレビ中継(ui-common.js)
//    5場面クリック送りのうち「対戦カード」「試合速報」「頂上決戦VS」の3箇所に
//    団体名だけでなく実エンブレムが出る(他団体戦のみ)。GRAND FINALは複数団体混成のため
//    同一団体どうしの組み合わせも起こり得るため、出す条件(cross-org)のテストも兼ねる。
// ===========================================================================
(function ppvTvBroadcastSuite() {
  const build = new Function(
    'document', 'G', 'Audio', 'window', 'Engine', 'portraitImg',
    `${uiFn('escHtml')}
     ${uiFn('orgIconHtml')}
     ${uiFn('_pbStars')}
     ${uiFn('renderPPVTvBroadcast')}
     return { renderPPVTvBroadcast };`
  );

  function makePtvDom() {
    let html = '';
    let clickHandler = null;
    const tvEl = { addEventListener: (evt, cb) => { clickHandler = cb; } };
    const box = {
      get innerHTML() { return html; },
      set innerHTML(v) { html = v; clickHandler = null; },
      querySelector: (sel) => (sel === '.ptv-tv' ? tvEl : null),
    };
    const overlay = { classList: { add() {}, remove() {} } };
    const documentStub = {
      getElementById: (id) => (id === 'showResultBox' ? box : id === 'showResultOverlay' ? overlay : null),
    };
    return {
      documentStub, box,
      click() { const cb = clickHandler; clickHandler = null; assert.ok(cb, 'クリック送りのハンドラが登録されている'); cb(); },
    };
  }

  function makeBundle(opts) {
    opts = opts || {};
    const { documentStub, box, click } = makePtvDom();
    const GStub = opts.G || { ppvTvWatchCount: 1 };
    const AudioStub = opts.Audio || { bgm: { playStage() {} }, play() {}, muted: true, sfxMasterVol: 1 };
    const windowStub = opts.window || { Audio: function () { return { volume: 0, play: () => ({ catch() {} }) }; } };
    const EngineStub = opts.Engine || {
      formatFinish: () => 'フィニッシュ',
      util: {
        getPlayerOrgIconPath: () => 'image/org/org-player-0.png',
        getOrgIconPath: (state, orgId) => (orgId === 'org_a' ? 'image/org/org-a-0.png' : orgId === 'org_b' ? 'image/org/org-b-0.png' : ''),
      },
    };
    const portraitImgStub = opts.portraitImg || ((id, size) => `<img src="image/face/${id}.png" width="${size}">`);
    const built = build(documentStub, GStub, AudioStub, windowStub, EngineStub, portraitImgStub);
    return { built, box, click };
  }

  function fighter(id, name, orgId, orgName) {
    return { id, name, _ppvOrgId: orgId, _ppvOrgName: orgName };
  }

  section('cross-org match gets a real emblem in the card list, flash result, and summit VS scenes; same-org match does not (unvariant 2, 3)', () => {
    // card[0]: 通常戦、cross-org(player vs org_a) / card[1]: 頂上決戦、同一団体(org_b同士。GRAND FINALの組合せ運で起こり得る)
    const underMatch = { left: fighter(1, '風間サキ', 'player', 'プレイヤー団体'), right: fighter(2, '結城ミナ', 'org_a', 'ライバル団体A'), isSummit: false };
    const summitMatch = { left: fighter(3, '白鳥レイ', 'org_b', '団体B'), right: fighter(4, '東城カレン', 'org_b', '団体B'), isSummit: true };
    const card = [underMatch, summitMatch];
    const results = [
      { winner: 'left', turns: 12, finType: 'pin', finMove: 'm1', mq: 72 },
      { winner: 'right', turns: 15, finType: 'pin', finMove: 'm2', mq: 80 },
    ];
    const { built, box, click } = makeBundle({});
    assert.doesNotThrow(() => built.renderPPVTvBroadcast(card, results, 'GRAND FINAL'), '例外を投げない(不変条件1)');
    assert.ok(box.innerHTML.length > 0, '放送オープニングが描画される');

    // ② 対戦カード一覧
    click();
    let html = box.innerHTML;
    assert.ok(html.includes('ptv-worg'), '対戦カード一覧が描画される');
    assert.ok(html.includes('image/org/org-player-0.png') && html.includes('image/org/org-a-0.png'),
      '他団体戦の行には両陣営の実エンブレムが出る');
    assert.ok(!html.includes('image/org/org-b-0.png'), '同一団体どうしの行にはエンブレムを出さない(出す条件: 他団体が絡む試合のみ)');
    assert.ok(html.includes('団体B'), '同一団体どうしでも団体名のテキストは出る(配置は変えずバッジだけ省く)');

    // ③ 試合速報(アンダーカード, cross-org)
    click();
    html = box.innerHTML;
    assert.ok(html.includes('ptv-flash-name'), '試合速報が描画される');
    assert.ok(html.includes('image/org/org-player-0.png'), '勝者(自陣)の実エンブレムが速報にも出る');

    // ④ 頂上決戦VS(同一団体)
    click();
    html = box.innerHTML;
    assert.ok(html.includes('ptv-sorg'), '頂上決戦VSが描画される');
    assert.ok(!html.includes('image/org/org-b-0.png'), '頂上決戦が同一団体どうしのときはエンブレムを出さない');
    assert.strictEqual((html.match(/団体B/g) || []).length, 2, '同一団体どうしでも両者の団体名テキストは出る');
  });

  section('escapes a hostile org name in the card list without throwing (unvariant 4, 5)', () => {
    const card = [{ left: fighter(1, 'A', 'player', 'プレイヤー団体'), right: fighter(2, 'B', 'org_a', '<script>alert(1)</script>'), isSummit: false }];
    const results = [{ winner: 'left', turns: 10, finType: 'pin', finMove: 'm', mq: 60 }];
    const { built, box, click } = makeBundle({});
    assert.doesNotThrow(() => built.renderPPVTvBroadcast(card, results, 'GRAND FINAL'));
    assert.doesNotThrow(() => click());
    assert.ok(!box.innerHTML.includes('<script>alert(1)</script>'), '団体名は生のまま出力されない');
    assert.ok(box.innerHTML.includes('&lt;script&gt;'), 'escHtml()でエスケープされる');
  });
})();

console.log(`u6-org-identity-safety-net-test: ${sectionsRun} sections ok`);
