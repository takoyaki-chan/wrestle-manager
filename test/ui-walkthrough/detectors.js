'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 2026-08-31監査: NaNのcase-insensitive部分一致は英語化で"finance"等に誤爆する時限爆弾
// だったため、NaNのみ大文字小文字厳密+単語境界に分離。
// MQトークンは2026-08-31のUI掃除(src全域を「試合評価/評価」へ日本語化+旧セーブの
// ロード時テキスト移行)完了に伴い復帰。`\bMQ(?![A-Za-z])` は「MQ85」「MQ+3」のような
// 数字/記号直結型も拾う(素の\bMQ\bではQ|8間に語境界が無く素通りする)。
// 「careerBestMQ」等の識別子は前側の語境界が無いため誤爆しない
const RAW_VALUE_PATTERN = /undefined|\bNaN\b|\[object\s|\bnull\b/g;
// P6-5: EN走破でD3_TEXTが「outstanding condition」のような正当な英文にも誤爆していた
// (news tickerの「in outstanding condition in training」= 好調を意味する自然な英語)。
// morale/conditionはJAでは絶対に出ない内部識別子だが、ENでは訳文自身が普通に使う英単語
// でもあるため、言語別に検査対象を分ける。orgPop/weekPhase/MQは英語としても意味を持たない
// 純内部トークンなので、ENでも変わらず検査する
const INTERNAL_TOKEN_PATTERN_JA = /\b(?:morale|orgPop|weekPhase|condition)\b|\bMQ(?![A-Za-z])/g;
const INTERNAL_TOKEN_PATTERN_EN = /\b(?:orgPop|weekPhase)\b|\bMQ(?![A-Za-z])/g;
// P6-2: ENモードの日本語露出計測(ひらがな/カタカナ/CJK統合漢字+互換漢字)。
// 失敗条件には使わない(意図的に残るナレーション等があるため) — 情報として集計するだけ
const JAPANESE_CHAR_PATTERN = /[぀-ヿ㐀-鿿豈-﫿]/;
// i18n.js logMiss() の console.warn 出力プレフィックス(src/i18n.js:140)。
// enモードでの未訳キーは仕様上fail-openの想定挙動であり、走破のD1失敗にはしない
// (「失敗条件にはしない」§P6-2設計) — 件数・ユニークキーとして別集計する
const I18N_MISS_PREFIX = '[WM] [i18n-miss]';

function stableHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizeName(value) {
  return String(value || 'issue').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'issue';
}

async function readPageSnapshot(page) {
  return page.evaluate((japanesePatternSource) => {
    const visible = element => {
      if (!(element instanceof Element)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
        && rect.width > 0 && rect.height > 0;
    };
    const leafElements = Array.from(document.querySelectorAll('body *'))
      .filter(element => visible(element) && element.children.length === 0);
    const text = leafElements.map(element => element.textContent || '').join('\n');
    // P6-2: 日本語文字が露出している可視リーフ要素の数(EN/pseudoモードの情報計測用。
    // ja時も計算コストは軽微だが値は使わない — 呼び出し側でlang!=='ja'のときだけ集計・出力する)
    const japanesePattern = new RegExp(japanesePatternSource);
    const jaExposureCount = leafElements
      .filter(element => japanesePattern.test(element.textContent || '')).length;
    const overlays = Array.from(document.querySelectorAll('[id*="Overlay"], .overlay, [class*="overlay"], .emr-layer'))
      .filter(visible)
      .map(element => {
        let label = element.id || element.className;
        // 汎用モーダル枠は枠idだけでは中身を識別できない(例: 統一王座「こちらの番」は
        // mdlAOverlayに載るため、点火マーカーが枠の中身を観測できなかった — 2026-08-14 R4)。
        // カード直下2階層のクラス列を連結し、中身をマーカーから識別可能にする
        if (/^(mdlAOverlay|mdlBOverlay|mdlCOverlay|mdlDOverlay|notifModalOverlay)$/.test(element.id || '')) {
          const inner = Array.from(element.querySelectorAll(':scope > *, :scope > * > *'))
            .slice(0, 12)
            .map(node => (typeof node.className === 'string' ? node.className : ''))
            .filter(Boolean)
            .join(' ');
          if (inner) label = `${label}:${inner}`;
        }
        return label;
      })
      .map(value => String(value).replace(/\s+/g, '.'))
      .sort();
    // #titleScreen は .screen ではなく .title-screen で、表示中は下の .screen に全面で
    // 重なる(下は非表示にならない)。可視ならタイトルを最優先で採る
    const titleScreen = document.getElementById('titleScreen');
    const activeScreen = (titleScreen && visible(titleScreen))
      ? titleScreen
      : Array.from(document.querySelectorAll('.screen')).find(visible);
    // ポップアップ直列化キューの観測プローブ(2026-08-14 キュー飢餓調査で追加)。
    // _popupQueue/_isPopupActive はメインワールドのグローバルレキシカルなので直接読める。
    // didProgress の比較対象には含めない(キュー残量の変化を「前進」と誤認させない)
    let popup = null;
    try {
      popup = {
        queueLength: (typeof _popupQueue !== 'undefined' && Array.isArray(_popupQueue)) ? _popupQueue.length : null,
        active: (typeof _isPopupActive === 'function') ? !!_isPopupActive() : null,
      };
    } catch (_error) {}
    let state = null;
    try {
      if (typeof G !== 'undefined' && G) {
        state = {
          season: G.season,
          week: G.week,
          weekPhase: G.weekPhase,
          offSeason: !!G.offSeason,
          offWeek: G.offWeek || 0,
          showCardValid: Array.isArray(G.showCard)
            ? G.showCard.filter(match => match && (match.matchType === 'tag'
              ? match.teamA?.fighter1 > 0 && match.teamB?.fighter1 > 0
              : match.left > 0 && match.right > 0)).length
            : 0,
          pendingAwards: !!G.pendingAwards,
        };
      }
    } catch (_error) {}
    const domShape = `${document.body?.childElementCount || 0}|${document.querySelectorAll('*').length}|${text}`;
    return {
      activeScreen: activeScreen?.id || null,
      domShape,
      jaExposureCount,
      overlays,
      popup,
      state,
      text,
      title: document.title,
      url: location.href,
    };
  }, JAPANESE_CHAR_PATTERN.source);
}

function summarizeSnapshot(snapshot) {
  return {
    activeScreen: snapshot.activeScreen,
    domHash: stableHash(snapshot.domShape),
    jaExposureCount: snapshot.jaExposureCount,
    overlays: snapshot.overlays,
    popup: snapshot.popup,
    state: snapshot.state,
    textHash: stableHash(snapshot.text),
    title: snapshot.title,
    url: snapshot.url,
  };
}

function didProgress(before, after) {
  if (!before || !after) return true;
  return before.domHash !== after.domHash
    || before.textHash !== after.textHash
    || before.activeScreen !== after.activeScreen
    || JSON.stringify(before.overlays) !== JSON.stringify(after.overlays)
    || JSON.stringify(before.state) !== JSON.stringify(after.state)
    || before.url !== after.url;
}

class WalkthroughDetectors {
  constructor(options = {}) {
    this.stackTimeoutMs = options.stackTimeoutMs || 5000;
    this.watchdogMs = options.watchdogMs || 90000;
    // P6-5: D3_TEXTの内部トークン検査を言語別にするための既定'ja'(未指定時は従来どおり
    // フル検査=ja digest不変)。run.js から --lang をそのまま渡す
    this.lang = options.lang || 'ja';
    this.issues = [];
    this.consoleEntries = [];
    this.lastProgressAt = Date.now();
    this.lastProgressKey = null;
    this._seenIssueKeys = new Set();
    // P6-2: EN検出の集計(失敗条件にはしない・情報として報告するだけ)。
    // key(原文の欠落キー) -> 出現回数(observe iframe/親windowで別インスタンスなので
    // 同一キーが2回出ることもある)。ja/pseudoでは発火しないので常時初期化しても無害
    this.i18nMissCounts = new Map();
    // 画面id(またはoverlay:xxx) -> その画面で観測した日本語露出要素数の最大値
    this.jaExposureByScreen = new Map();
    // P6-9: レイアウト溢れの情報集計(失敗条件にはしない)。ja/en/pseudo全モードで動かし、
    // 同一harnessでja/en差分を比較できるようにする(EN文字幅がJA比で約2.4倍という実測を
    // 踏まえ、吹き出し以外のUI要素で切れ/はみ出し/意図しない折り返しが起きていないかを
    // 計測するだけで、CSS/訳文の修正はこのハーネスの対象外)
    // screen id(またはoverlay:xxx) -> { total: ユニーク要素数, byKind: { clip/nowrap/wrap-height: 件数 } }
    this.overflowByScreen = new Map();
    // ユニーク要素(screen|kind|selector|text で重複排除)のフラットな一覧。上位N件抽出に使う
    this.overflowRecords = [];
    this._seenOverflowKeys = new Set();
    // P6-13: JA露出要素の一覧モード(screen/selector/text)。scanTextのraw-value/internal-token
    // 検査(D3_TEXT・失敗条件)とは完全に独立した情報集計で、jaの行動選択・digestには
    // 一切影響させない(scanOverflowと同じ設計 — jaExposureByScreenの最大値集計とは別に、
    // 個々の要素を突き合わせて分類できるようテキスト付きで保持する)
    this.jaExposureRecords = [];
    this._seenJaExposureKeys = new Set();
  }

  attach(page) {
    page.on('pageerror', error => {
      this.record('D1_EXCEPTION', error.message, { stack: error.stack || String(error) });
    });
    page.on('console', message => {
      // リソース系エラーはtextにURLが入らない(「Failed to load resource: 404」だけ)ため、
      // location からURLを補う。無いと何が404したのか特定できない(2026-08-14実例)
      const location = typeof message.location === 'function' ? message.location() : null;
      const entry = { type: message.type(), text: message.text(), url: (location && location.url) || '' };
      this.consoleEntries.push(entry);
      // favicon.ico はブラウザの自動リクエストで、配信サーバに実体が無いだけのノイズ
      if (/Failed to load resource/.test(entry.text) && /favicon\.ico/.test(entry.url)) return;
      // 2026-09-05: 外部Webフォント(Google Fonts)の取得失敗はネットワーク側の揺れで、アプリのバグではない
      // (ja走破で net::ERR_CONNECTION_CLOSED の woff2 が D1 になった実例)。fallbackフォントで描画は続くので除外
      if (/Failed to load resource/.test(entry.text) && /fonts\.(?:gstatic|googleapis)\.com/.test(entry.url)) return;
      // P6-2: i18n未訳キーのfail-openログ(src/i18n.js logMiss)はenモードでの想定内挙動。
      // D1失敗にはせず、件数+ユニークキーとして別集計する(設計: docs/i18n-stage-b-p6-design-v0.1.md §3-1)
      if (entry.text.startsWith(I18N_MISS_PREFIX)) {
        const key = entry.text.slice(I18N_MISS_PREFIX.length).trim();
        this.i18nMissCounts.set(key, (this.i18nMissCounts.get(key) || 0) + 1);
        return;
      }
      // 2026-08-31監査: [WM Debug](不変条件違反)だけでなく [WM](自己修復・スキップ・
      // オートセーブ失敗などの「壊れたが黙って立て直した」証拠ログ)も検出対象にする。
      // 自己修復が走った走破は健全ではない — flight-recorderと同じ基準に揃える。
      // 例外: 「不適切な入力を設計どおり拒否した」だけの情報ログは対象外
      // ([WM][awards]の背景ナビ無視 = 表彰式中のadvanceWeek連打をガードが正しく弾いた記録。
      //  状態は何も変わっておらず、走破ハーネス自身の連打が発生源。実セーブ棚の初回実走で
      //  3本がこれだけで失敗したため区別を導入)
      const isBenignRejection = entry.text.includes('ignored background navigation');
      if (entry.type === 'error'
          || (entry.type === 'warning' && !isBenignRejection
              && (entry.text.includes('[WM Debug]') || entry.text.includes('[WM]')))) {
        this.record('D1_CONSOLE', entry.url ? `${entry.text} (${entry.url})` : entry.text, entry);
      }
    });
  }

  record(type, message, details = {}) {
    const issue = { type, message: compactText(message), details };
    const key = `${type}|${issue.message}|${stableHash(JSON.stringify(details))}`;
    if (this._seenIssueKeys.has(key)) return issue;
    this._seenIssueKeys.add(key);
    this.issues.push(issue);
    return issue;
  }

  async snapshot(page) {
    const summary = summarizeSnapshot(await readPageSnapshot(page));
    this._recordJaExposure(summary);
    return summary;
  }

  // P6-2: 画面(activeScreen、無ければ最前面overlay)ごとの日本語露出要素数の最大値を
  // 記録する。ステップ毎に呼ばれるが値は「その画面で見えた最大値」だけを保持するので、
  // 同じ画面に長く留まっても数字が水増しされない
  _recordJaExposure(summary) {
    if (!summary || typeof summary.jaExposureCount !== 'number') return;
    const bucket = summary.activeScreen
      || (summary.overlays && summary.overlays.length ? `overlay:${summary.overlays[0]}` : 'unknown');
    const previous = this.jaExposureByScreen.get(bucket) || 0;
    if (summary.jaExposureCount > previous) this.jaExposureByScreen.set(bucket, summary.jaExposureCount);
  }

  async beginMutationWatch(page) {
    const handle = await page.evaluateHandle(() => {
      const tracker = { mutated: false };
      const observer = new MutationObserver(() => { tracker.mutated = true; });
      observer.observe(document.documentElement, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
      tracker.stop = () => observer.disconnect();
      return tracker;
    });
    return {
      dispose: async () => {
        await page.evaluate(tracker => tracker.stop(), handle).catch(() => {});
        await handle.dispose().catch(() => {});
      },
      hasMutated: () => page.evaluate(tracker => tracker.mutated, handle),
    };
  }

  async scanText(page) {
    const snapshot = await readPageSnapshot(page);
    const lines = snapshot.text.split(/\r?\n/).map(compactText).filter(Boolean);
    const matches = [];
    // P6-5: ENは訳文自体がmorale/condition等を普通の英単語として使うため専用パターンへ
    const internalTokenPattern = this.lang === 'en' ? INTERNAL_TOKEN_PATTERN_EN : INTERNAL_TOKEN_PATTERN_JA;
    for (const line of lines) {
      for (const raw of line.matchAll(RAW_VALUE_PATTERN)) {
        matches.push({ kind: 'raw-value', token: raw[0], context: line.slice(0, 240) });
      }
      for (const internal of line.matchAll(internalTokenPattern)) {
        matches.push({ kind: 'internal-token', token: internal[0], context: line.slice(0, 240) });
      }
    }
    for (const match of matches) {
      this.record('D3_TEXT', `${match.token} exposed in visible text`, match);
    }
    return matches;
  }

  // P6-9: レイアウト溢れの情報集計。3種を検出する(いずれもissuesには積まない=失敗条件にしない):
  //   (a) clip      — overflow が hidden/clip (または text-overflow:ellipsis) で
  //                    scrollWidth が clientWidth を2px超えて超過=テキストが物理的に切れている
  //   (b) nowrap     — white-space:nowrap の要素が、横スクロールを許さない親の右端をはみ出している
  //   (c) wrap-height — button/nav-btn/badge/tab/chip/pill の同種グループ(3件以上)内で、
  //                    中央値より概ね1行分(line-height×0.9かつ4px超)高い=意図しない折り返し
  // 要素ごとに screen/selector(短縮)/text(先頭40字)/kind/overflowPx を記録し、
  // (screen, kind, selector, text) で重複排除する(同じ要素を毎手数え直さない)。
  async scanOverflow(page) {
    const result = await page.evaluate(() => {
      const visible = element => {
        if (!(element instanceof Element)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
          && rect.width > 0 && rect.height > 0;
      };
      const shortSelector = element => {
        if (element.id) return `#${element.id}`;
        const classes = (typeof element.className === 'string' ? element.className : '')
          .trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
        return classes ? `${element.tagName.toLowerCase()}.${classes}` : element.tagName.toLowerCase();
      };
      const textOf = element => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();

      const titleScreen = document.getElementById('titleScreen');
      const activeScreenEl = (titleScreen && visible(titleScreen))
        ? titleScreen
        : Array.from(document.querySelectorAll('.screen')).find(visible);
      const overlayEl = Array.from(document.querySelectorAll('[id*="Overlay"], .overlay, [class*="overlay"], .emr-layer'))
        .find(visible);
      const screen = activeScreenEl?.id || (overlayEl ? `overlay:${overlayEl.id || overlayEl.className}` : 'unknown');

      const found = [];
      const push = (kind, element, overflowPx) => {
        found.push({
          kind,
          overflowPx: Math.max(0, Math.round(overflowPx)),
          selector: shortSelector(element),
          text: textOf(element).slice(0, 40),
        });
      };

      const allVisible = Array.from(document.querySelectorAll('body *')).filter(visible);

      // (a)(b): 1要素1回のgetComputedStyleで両方判定する
      for (const element of allVisible) {
        const text = textOf(element);
        if (!text) continue;
        // v1.4wのニュースティッカー(.news-ticker-bar)専用の除外はP7-36(2026-09-06)で
        // ティッカー自体が廃止されたため削除した。設計上のマーキー(常時スクロール)を
        // 意図的にoverflow:hiddenで作る要素が今後増えたら、ここに同様の除外を足すこと。
        const style = getComputedStyle(element);

        const overflowX = style.overflowX;
        const isClipStyle = overflowX === 'hidden' || overflowX === 'clip' || style.textOverflow === 'ellipsis';
        if (isClipStyle && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2
            && !element.querySelector('img, svg, canvas, video')) {
          push('clip', element, element.scrollWidth - element.clientWidth);
        }

        if (style.whiteSpace === 'nowrap') {
          const parent = element.parentElement;
          if (parent) {
            const parentStyle = getComputedStyle(parent);
            if (!/(?:auto|scroll)/.test(parentStyle.overflowX)) {
              const rect = element.getBoundingClientRect();
              const parentRect = parent.getBoundingClientRect();
              const overflowPx = rect.right - parentRect.right;
              if (overflowPx > 2) push('nowrap', element, overflowPx);
            }
          }
        }
      }

      // (c): ボタン/タブ/バッジ類を同種(タグ+先頭クラス)でグルーピングし、中央値より
      // 1行分以上高い個体を意図しない折り返しとして拾う(同種2件だけだと基準が決まらないため3件以上で比較)
      // P6-11: [class*="tab"] は「タブ切替ボタン」だけでなく「タブの中身のパネル」
      // (例: .rd-tab-content。ロースター詳細の育成余地パネル)にも部分一致してしまい、
      // 本来は選手ごとに文章量が違って当然のプローズ(散文)ブロックを、固定サイズのはずの
      // コントロール(ボタン/バッジ)と誤って同グループ扱いしていた(P6-9報告書§6の既知の限界)。
      // -content/-panel で終わるクラスを持つ要素はコントロールではなくパネル本体とみなし除外する
      const isContentOrPanelClass = element => {
        const classes = (typeof element.className === 'string' ? element.className : '').trim().split(/\s+/);
        return classes.some(cls => /(?:-content|-panel)$/.test(cls));
      };
      const groupSelector = 'button, .nav-btn, [class*="badge"], [class*="tab"], [class*="chip"], [class*="pill"]';
      const groupCandidates = Array.from(document.querySelectorAll(groupSelector))
        .filter(visible)
        .filter(element => !isContentOrPanelClass(element));
      const groups = new Map();
      for (const element of groupCandidates) {
        const firstClass = (typeof element.className === 'string' ? element.className : '')
          .trim().split(/\s+/).filter(Boolean)[0] || '';
        const key = `${element.tagName.toLowerCase()}.${firstClass}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(element);
      }
      for (const elements of groups.values()) {
        if (elements.length < 3) continue;
        const heights = elements.map(element => element.getBoundingClientRect().height);
        const sortedHeights = [...heights].sort((a, b) => a - b);
        const median = sortedHeights[Math.floor(sortedHeights.length / 2)];
        elements.forEach((element, index) => {
          const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 16;
          const diff = heights[index] - median;
          if (diff >= lineHeight * 0.9 && diff > 4) push('wrap-height', element, diff);
        });
      }

      return { found, screen };
    });
    this._recordOverflow(result.screen, result.found);
    return result.found;
  }

  // (screen, kind, selector, text) で重複排除しつつ画面別・種別集計を積む。
  // 同じ壊れた要素を毎手数え直すとカウントが手数に比例して水増しされるため、
  // 「ユニーク要素がいくつ見つかったか」の集計にする(jaExposureByScreenの最大値方式と同じ思想)
  _recordOverflow(screen, found) {
    if (!found || found.length === 0) return;
    for (const item of found) {
      const key = `${screen}|${item.kind}|${item.selector}|${item.text}`;
      if (this._seenOverflowKeys.has(key)) continue;
      this._seenOverflowKeys.add(key);
      this.overflowRecords.push({ ...item, screen });
      const bucket = this.overflowByScreen.get(screen) || { byKind: {}, total: 0 };
      bucket.total += 1;
      bucket.byKind[item.kind] = (bucket.byKind[item.kind] || 0) + 1;
      this.overflowByScreen.set(screen, bucket);
    }
  }

  // P6-13: scanOverflowと同じ設計の情報集計。可視リーフ要素のうち日本語文字を含むものを
  // (screen, selector, text先頭60字)で列挙する。scanText/snapshotが使うjaExposureCount
  // (画面ごとの最大値のみ)と異なり、個々の要素を後段の分類作業(名前/直書きラベル/整形値等)
  // へ渡せる形で保持する。呼び出しはscanOverflowと同じ3箇所(ja/en/pseudo問わず動くが、
  // 出力するのはrun.js側でlang!=='ja'のときだけ)
  async scanJaExposureDetail(page) {
    const result = await page.evaluate((japanesePatternSource) => {
      const visible = element => {
        if (!(element instanceof Element)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
          && rect.width > 0 && rect.height > 0;
      };
      const shortSelector = element => {
        if (element.id) return `#${element.id}`;
        const classes = (typeof element.className === 'string' ? element.className : '')
          .trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
        return classes ? `${element.tagName.toLowerCase()}.${classes}` : element.tagName.toLowerCase();
      };
      const textOf = element => (element.textContent || '').replace(/\s+/g, ' ').trim();

      const titleScreen = document.getElementById('titleScreen');
      const activeScreenEl = (titleScreen && visible(titleScreen))
        ? titleScreen
        : Array.from(document.querySelectorAll('.screen')).find(visible);
      const overlayEl = Array.from(document.querySelectorAll('[id*="Overlay"], .overlay, [class*="overlay"], .emr-layer'))
        .find(visible);
      const screen = activeScreenEl?.id || (overlayEl ? `overlay:${overlayEl.id || overlayEl.className}` : 'unknown');

      const pattern = new RegExp(japanesePatternSource);
      // P7-31: 「リーフ要素だけ」では `地の文<br>地の文<span>…</span>` 型の枠を1つも見ない
      // (子要素を持つので走査対象から外れ、自分の直下テキストノードは誰にも読まれない)。
      // 旗揚げ序章の `.opening-act-line` が丸ごとこの死角だった。リーフに加えて
      // **自分の直下テキストノードだけ**を持つ非リーフ要素も見る(子孫のテキストは
      // その子孫自身の行で数えるので、二重計上にはならない)。
      const directTextOf = (element) => Array.from(element.childNodes)
        .filter(node => node.nodeType === 3)
        .map(node => node.textContent || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      const found = [];
      for (const element of Array.from(document.querySelectorAll('body *'))) {
        if (!visible(element)) continue;
        const isLeaf = element.children.length === 0;
        const text = isLeaf ? textOf(element) : directTextOf(element);
        if (!text || !pattern.test(text)) continue;
        let path = '';
        let cur = element;
        for (let i = 0; i < 6 && cur; i++) { path = shortSelector(cur) + (path ? '>' + path : ''); cur = cur.parentElement; }
        found.push({ selector: shortSelector(element), text: text.slice(0, 60), path });
      }
      return { found, screen };
    }, JAPANESE_CHAR_PATTERN.source);
    this._recordJaExposureDetail(result.screen, result.found);
    return result.found;
  }

  // (screen, selector, text) で重複排除しつつフラットな一覧へ積む(_recordOverflowと同じ思想)
  _recordJaExposureDetail(screen, found) {
    if (!found || found.length === 0) return;
    for (const item of found) {
      const key = `${screen}|${item.selector}|${item.text}`;
      if (this._seenJaExposureKeys.has(key)) continue;
      this._seenJaExposureKeys.add(key);
      this.jaExposureRecords.push({ ...item, screen });
    }
  }

  noteProgress(snapshot, now = Date.now()) {
    const state = snapshot?.state;
    if (!state) return;
    const key = `${state.season}|${state.week}|${state.offSeason}|${state.offWeek}`;
    if (this.lastProgressKey === null || key !== this.lastProgressKey) {
      this.lastProgressKey = key;
      this.lastProgressAt = now;
    }
  }

  checkWatchdog(snapshot, now = Date.now()) {
    this.noteProgress(snapshot, now);
    const stalledForMs = now - this.lastProgressAt;
    if (stalledForMs < this.watchdogMs) return null;
    return this.record('D5_WATCHDOG', `week did not advance for ${stalledForMs}ms`, {
      stalledForMs,
      state: snapshot?.state || null,
    });
  }

  async waitForProgress(page, before, options = {}) {
    const mutationWatch = options.mutationWatch || null;
    const timeoutMs = options.timeoutMs || this.stackTimeoutMs;
    const pollMs = Math.min(options.pollMs || 100, timeoutMs);
    const deadline = Date.now() + timeoutMs;
    let after = before;
    do {
      await page.waitForTimeout(pollMs);
      after = await this.snapshot(page);
      const mutated = mutationWatch ? await mutationWatch.hasMutated().catch(() => false) : false;
      if (mutated || didProgress(before, after)) {
        this.noteProgress(after);
        return { progressed: true, after };
      }
    } while (Date.now() < deadline);
    return { progressed: false, after };
  }

  async detectStack(page, before, action, retryActions = [], mutationWatch = null) {
    const first = await this.waitForProgress(page, before, { mutationWatch });
    await mutationWatch?.dispose();
    if (first.progressed) return first;

    let after = first.after;
    for (let retryIndex = 0; retryIndex < retryActions.length; retryIndex += 1) {
      const retryWatch = await this.beginMutationWatch(page);
      await retryActions[retryIndex]().catch(() => {});
      const result = await this.waitForProgress(page, after, { mutationWatch: retryWatch });
      await retryWatch.dispose();
      after = result.after;
      // retryIndex は「どの兄弟が回復させたか」を呼び出し元がレポートに記録するための添字
      // (2026-08-31監査③: 回復した死にボタンの黙殺をやめる)
      if (result.progressed) return { ...result, recoveredByRetry: true, retryIndex };
    }

    const issue = this.record('D2_FREEZE', `no observable progress after clicking ${action}`, {
      action,
      before,
      after,
      retriedButtons: retryActions.length,
    });
    return { progressed: false, after, issue };
  }
}

async function writeFailureArtifacts(options) {
  const {
    actionLog,
    artifactRoot,
    consoleEntries,
    issue,
    page,
    reproductionCommand,
    state,
    step,
  } = options;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = path.join(artifactRoot, `${stamp}-${sanitizeName(issue.type)}`);
  fs.mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, 'screenshot.png'), fullPage: true }).catch(() => {});
  fs.writeFileSync(path.join(directory, 'actions.json'), `${JSON.stringify(actionLog, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(directory, 'state.json'), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(directory, 'console.json'), `${JSON.stringify(consoleEntries, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(directory, 'README.txt'), [
    `${issue.type}: ${issue.message}`,
    `step: ${step}`,
    `reproduce: ${reproductionCommand}`,
    '',
  ].join('\n'), 'utf8');
  return directory;
}

module.exports = {
  WalkthroughDetectors,
  didProgress,
  readPageSnapshot,
  stableHash,
  summarizeSnapshot,
  writeFailureArtifacts,
};
