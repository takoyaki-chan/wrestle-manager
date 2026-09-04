// ══════════════════════════════════════════════════════════════════════════════
//  src/i18n.js — i18n基盤 (Stage A P1)
//
//  設計: docs/i18n-stage-a-p1-design-v0.1.md (D1〜D3, D7, D8)
//  大原則: 日本語版の見た目・挙動は1ピクセルも変えない。P1はインフラ敷設のみ。
//
//  ■ D1: t()のキーは日本語原文そのもの(キー名を発明しない)。
//    - lang='ja' → 辞書を経由せず引数をそのまま返す(ゼロコスト)
//    - lang='en' → 辞書引き。無ければ翻訳漏れログを出し、原文を返す(fail-open)
//    - lang='pseudo' → ⟦原文~~⟧ 形式に加工(D8)
//  ■ D2: プレースホルダは {名前} 形式。t('第{n}週', {n:5}) のように使う。
//    ja時もプレースホルダ置換だけは行う(=現行の文字列連結結果と完全一致させるため)。
//  ■ D3: 言語設定はセーブ(G)に入れない。デバイス設定として localStorage 'wm_lang'
//    ('ja'|'en'|'pseudo'、既定'ja')に保持する。Engineはこのファイルに一切触れない。
//  ■ D7: 翻訳漏れログ。lang≠'ja' で辞書ミスのときだけ記録する。同一キーはセッション中1回。
//    console.warn の '[WM]' プレフィックスは flight-recorder.js の既存フック
//    (wrapConsole)がそのまま拾って記録する(専用の記録APIは無いため、この規約に乗る)。
//  ■ D8: 擬似ロケール。`⟦` + 原文 + 原文の長さ40%分の `~` + `⟧`。
//    翻訳漏れ(t()を通っていない文字列)の可視化と、英語の文字数増によるレイアウト
//    溢れを翻訳ゼロの段階で検査するためのもの。
//  ■ プレースホルダフィルタ記法(Stage B P6 D-P6-5): `{name:filter}` の形で書くと、
//    params[name] の値をフィルタ関数へ通してから埋め込む。ja側テンプレは素の `{name}` の
//    ままでよい(フィルタ有無に関わらず基底名が同じなら同一パラメータとして解決される)。
//    現在の唯一のフィルタは `man`(通貨B方式変換。詳細は下のFILTERS定義参照)。
//    未知のフィルタ名・非数値入力はいずれもfail-open(値をそのまま挿入)。
//  ■ applyDom (Stage A P3a-4d): index.htmlの静的HTMLテキストノード用。
//    JS生成文字列と違い、静的HTMLはt()を直接通せない。そこで data-i18n / data-i18n-attr
//    属性でマークした要素をDOM走査時にt()へ通す。
//    - [data-i18n] 要素: 初回のtextContentを data-i18n-orig 属性へ退避し、以後は
//      その原文から t(原文) を再計算してtextContentへ書き戻す(2回目以降もdatasetの
//      原文を参照するので、setLang()での再適用や多重呼び出しでも文字化けない)。
//      要素の子に他のタグが混在するケース(インライン装飾)は対象外
//      (textContent置換で子要素が消えるため、該当箇所はdata-i18nを付与しないこと)。
//    - [data-i18n-attr="attr1,attr2"] 要素: 指定した属性名(カンマ区切り)の原文を
//      data-i18n-attr-orig 属性へ JSON で退避し、同様に t() で書き戻す。
//    - DOMContentLoaded時とsetLang()時に自動で document 全体へ適用する。
//    - ja時はt()がno-opなので、applyDomを何度呼んでも描画結果は原文のまま(1バイト不変)。
//  ■ 名前辞書 PN_EN(Stage B P6 D-P6-1〜D-P6-3、docs/i18n-stage-b-p6-design-v0.1.md):
//    選手・コーチ名等はdata由来の「値」としてUIへ出るため、キー一致のt()では訳せない。
//    - addNames(map): t()の辞書(dict)とは別領域の名前辞書へ { 原文: 訳文 } をマージする。
//      生成元は test/i18n-build-names.js(src/lang-en-names.js を自動生成)。
//    - pn(str): strが名前辞書に完全一致すればEN訳を返す。無ければ原文のまま(fail-open)。
//      ja/pseudo時は素通し(常にstrをそのまま返す)。直接補間(`${c.name}`)の表示サイトを
//      段階移行する際の入口(D-P6-3)。
//    - t()のパラメータ値自動変換(D-P6-2): lang=enのとき、applyParamsで挿入する値が
//      文字列かつ名前辞書に完全一致すれば変換してから埋め込む(manフィルタ等の通常の
//      プレースホルダフィルタより前段で評価する)。ja/pseudo時は従来どおり無変換。
//      これによりテンプレ経由の名前({name}/{winner}等)は配線ゼロで英語化される。
//  ■ 姓のみ辞書 pnSurname (Stage B P6-11、docs/i18n-en-layout-overflow-report-v0.1.md):
//    チップ・1行の表・ランキング行(.flink/.jtc-fn/.nm-tag等の固定幅1行枠)はフルネーム
//    だと英語で折り返し・はみ出しが起きる。pn()と同じ「フルネームJA」を入力に取り、
//    姓だけを返す。姓のみ辞書に無ければpn()(フルネーム訳、それも無ければ原文)へ
//    fail-openする。addSurnames(map)が登録入口(生成元はpn()と同じsrc/lang-en-names.js)。
//  ■ <html lang>属性の同期 (Stage B P6-11): setLang()呼び出し時と読み込み時に
//    document.documentElement.lang を 'en'(currentLang==='en')/'ja'(それ以外) へ同期する。
//    静的HTMLは`<html lang="ja">`固定なので、EN専用CSS(`html[lang="en"] .foo{...}`)が
//    JAの見た目に一切触れずにレイアウトだけ言語別に出し分けられるようにするための入口。
// ══════════════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  const STORAGE_KEY = 'wm_lang';
  const VALID_LANGS = ['ja', 'en', 'pseudo'];
  const DEFAULT_LANG = 'ja';

  // 原文 → 訳文。P1時点では空(Stage Bで addDict() により英語辞書が登録される)。
  const dict = Object.create(null);
  // 固有名詞(選手・コーチ・団体・大会・ベルト・会場等)の 原文 → 訳文。
  // 通常のUI辞書(dict)とは別領域(Stage B P6 D-P6-1)。生成元: src/lang-en-names.js。
  const names = Object.create(null);
  // フルネーム(JA) → 姓のみ(EN)。P6-11: チップ・1行固定枠(.flink/.jtc-fn/.nm-tag等)で
  // フルネームだと折り返し・はみ出しが起きる箇所向け。names(pn)とは別領域。
  // 生成元: src/lang-en-names.js(test/i18n-build-names.jsがnames-ledger.jsonの
  // ja(フルネーム)→enSurnameを突合して生成)。
  const surnames = Object.create(null);
  // このセッションで既にログ済みの未訳キー(D7: 同一キーは1回だけ)。
  const missSeen = new Set();

  // P6-12: wm_lang が未設定(=一度も保存されたことがない)ときだけ、
  // navigator.language(最優先の1言語のみ)を見て初回既定を決める('en*'ならen、それ以外はja)。
  // navigator.languagesの2番目以降(副次的な言語プリファレンス)は見ない —
  // 主言語がjaでも配列に'en-US'等が混ざっている環境は珍しくなく、それらまで見ると
  // 「ブラウザの主言語はjaなのにENが既定になる」誤判定になる(実機のPlaywright環境で実測)。
  // navigator.languageが取得できない稀な環境でだけnavigator.languages[0]を代わりに見る。
  // navigator不在・取得失敗はすべてfail-openでjaに落ちる。
  function detectBrowserDefaultLang() {
    try {
      const nav = global.navigator;
      if (!nav) return DEFAULT_LANG;
      const primary = (typeof nav.language === 'string' && nav.language)
        ? nav.language
        : (Array.isArray(nav.languages) && typeof nav.languages[0] === 'string' ? nav.languages[0] : null);
      if (primary && /^en/i.test(primary)) return 'en';
    } catch (_e) { /* fail-openでja */ }
    return DEFAULT_LANG;
  }

  // 言語の決まり方(優先順): 1) localStorage wm_lang が保存済みならそれを常に尊重
  // (不正値でも既定'ja'に落とすだけで、ブラウザ言語は見ない) → 2) 未設定(初回起動)
  // のときだけ navigator.language で既定を決める → 3) それでも決まらなければ'ja'。
  // wm_lang が保存済みかどうかは store.getItem()の戻り値がnullかどうかで判定する
  // (VALID_LANGS外の不正値は「保存済みだが壊れている」扱いでja、ブラウザ言語は見ない)。
  function readStoredLang() {
    try {
      const store = global.localStorage;
      const v = store ? store.getItem(STORAGE_KEY) : null;
      if (v !== null) return VALID_LANGS.indexOf(v) >= 0 ? v : DEFAULT_LANG;
      return detectBrowserDefaultLang();
    } catch (_e) {
      return DEFAULT_LANG;
    }
  }

  let currentLang = readStoredLang();

  // ── D-P6-5: 通貨B方式フィルタ `man` ──
  // 値=万単位の数値(number または "1,234"のようなカンマ区切り数字文字列。符号"-"可)を
  // 英語圏標準の k/M 表記へ変換する。
  //   100万未満(絶対値<100) → {v*10}k (整数・カンマ不要の桁。例: 15→150k)
  //   100万以上(絶対値>=100) → {v/100}M (小数1桁まで・末尾.0は削除。例: 300→3M, 120→1.2M)
  // 符号はk/M表記の頭に付与する(例: -500 → -5M)。数値化できない値はfail-openでそのまま返す。
  function manFilter(raw) {
    if (raw === null || raw === undefined) return raw;
    const stripped = (typeof raw === 'string') ? raw.replace(/,/g, '').trim() : raw;
    const num = (typeof stripped === 'number') ? stripped : parseFloat(stripped);
    if (typeof stripped === 'string' && stripped === '') return raw;
    if (!isFinite(num)) return raw;
    const neg = num < 0;
    const abs = Math.abs(num);
    let out;
    if (abs < 100) {
      out = String(Math.round(abs * 10)) + 'k';
    } else {
      let m = Math.round((abs / 100) * 10) / 10;
      let mStr = m.toFixed(1);
      if (mStr.slice(-2) === '.0') mStr = mStr.slice(0, -2);
      out = mStr + 'M';
    }
    return (neg ? '-' : '') + out;
  }

  const FILTERS = { man: manFilter };

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // {key} または {key:filter} プレースホルダを params[key] で置換する。
  // params が無ければ何もしない。フィルタ指定が無ければ従来通り値をそのまま挿入する
  // (split/joinと同じくString化されるだけで、フィルタ関連の挙動は一切変わらない)。
  // convertNames(D-P6-2): trueのとき、値が文字列かつ名前辞書(names)に完全一致すれば
  // フィルタ適用より前に訳文へ差し替える。呼び出し元はt()のenブランチのみtrueを渡す
  // (ja/pseudoは常にfalse相当=従来どおり無変換。ja側の1バイト不変を保つ)。
  function applyParams(str, params, convertNames) {
    if (!params || typeof str !== 'string') return str;
    let out = str;
    Object.keys(params).forEach((key) => {
      const re = new RegExp('\\{' + escapeRegExp(key) + '(?::([A-Za-z_][A-Za-z0-9_]*))?\\}', 'g');
      out = out.replace(re, (_match, filterName) => {
        let raw = params[key];
        if (convertNames && typeof raw === 'string'
          && Object.prototype.hasOwnProperty.call(names, raw)) {
          raw = names[raw];
        }
        if (filterName && Object.prototype.hasOwnProperty.call(FILTERS, filterName)) {
          return String(FILTERS[filterName](raw));
        }
        return String(raw);
      });
    });
    return out;
  }

  function logMiss(original) {
    if (missSeen.has(original)) return;
    missSeen.add(original);
    try {
      // eslint-disable-next-line no-console
      console.warn('[WM] [i18n-miss]', original);
    } catch (_e) { /* コンソール不在環境でも黙って続行 */ }
  }

  // D8: 擬似ロケール表記。原文の長さの40%分(最低1文字)を `~` で伸ばして囲う。
  function toPseudo(str) {
    if (typeof str !== 'string') return str;
    const tildeLen = Math.max(1, Math.ceil(str.length * 0.4));
    return '⟦' + str + '~'.repeat(tildeLen) + '⟧';
  }

  // D1/D2: 翻訳関数本体。
  //   text: 日本語原文(=辞書キー)
  //   params: { 名前: 値, ... } — 任意
  function t(text, params) {
    if (typeof text !== 'string') return text;

    if (currentLang === 'ja') {
      // I1: プレースホルダが無い呼び出しは辞書を一切経由せず、引数をそのまま返す(参照同一)。
      return params ? applyParams(text, params) : text;
    }

    if (currentLang === 'pseudo') {
      return toPseudo(applyParams(text, params));
    }

    // en: 辞書引き。まだ翻訳が無い(Stage A時点は必ずこちら)場合は原文をfail-openで返す。
    // D-P6-2: パラメータ値の名前自動変換(convertNames=true)はenのときだけ行う。
    const translated = Object.prototype.hasOwnProperty.call(dict, text) ? dict[text] : null;
    if (translated == null) {
      logMiss(text);
      return applyParams(text, params, true);
    }
    return applyParams(translated, params, true);
  }

  // ── applyDom: 静的HTMLの [data-i18n] / [data-i18n-attr] 要素をt()へ通す ──
  // root: 走査開始ノード(省略時はdocument全体)。document不在環境(node等)では何もしない。
  function applyDom(root) {
    const doc = (root && typeof root.querySelectorAll === 'function')
      ? root
      : (typeof document !== 'undefined' ? document : null);
    if (!doc) return;

    // [data-i18n]: textContent 全体を置換。子要素混在テキストへは付与しない運用前提。
    // 辞書キーは trim して引く: HTMLソースのインデント改行が textContent に混入し、
    // かつブラウザはCRLFをLFへ正規化するため、生のtextContentでは台帳キーと一致しない
    // (P3bバッチ4後の実機確認で発覚——「旗揚げする」等がfail-openしていた)。
    // ja時は退避した原文を厳密復元する(1バイト不変)。
    const textNodes = doc.querySelectorAll('[data-i18n]');
    for (let i = 0; i < textNodes.length; i++) {
      const el = textNodes[i];
      let orig = el.getAttribute('data-i18n-orig');
      if (orig === null) {
        orig = el.textContent;
        el.setAttribute('data-i18n-orig', orig);
      }
      if (currentLang === 'ja') {
        el.textContent = orig;
      } else {
        const trimmed = orig.trim();
        const out = t(trimmed);
        el.textContent = (out === trimmed) ? orig : out;
      }
    }

    // [data-i18n-attr="title,placeholder"]: 属性値をt()へ通す。複数属性はカンマ区切り。
    const attrNodes = doc.querySelectorAll('[data-i18n-attr]');
    for (let i = 0; i < attrNodes.length; i++) {
      const el = attrNodes[i];
      const spec = el.getAttribute('data-i18n-attr');
      if (!spec) continue;
      const names = spec.split(',').map((s) => s.trim()).filter(Boolean);
      if (!names.length) continue;
      let origMap = null;
      const stored = el.getAttribute('data-i18n-attr-orig');
      if (stored) {
        try { origMap = JSON.parse(stored); } catch (_e) { origMap = null; }
      }
      if (!origMap) {
        origMap = {};
        names.forEach((name) => { origMap[name] = el.getAttribute(name) || ''; });
        el.setAttribute('data-i18n-attr-orig', JSON.stringify(origMap));
      }
      names.forEach((name) => {
        if (Object.prototype.hasOwnProperty.call(origMap, name)) {
          el.setAttribute(name, t(origMap[name]));
        }
      });
    }
  }

  // P6-11: <html lang>属性の同期。EN専用CSS(`html[lang="en"] .foo{...}`)がJAの見た目に
  // 一切触れずにレイアウトだけ言語別に出し分けられるようにするための入口。
  // pseudoはEN専用CSSの対象外(レイアウト溢れの目視検査用途で、幅の物差しが違うため)なので
  // 'ja'のまま据え置く。document不在環境(node等)では何もしない。
  function syncHtmlLangAttr() {
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = (currentLang === 'en') ? 'en' : 'ja';
      }
    } catch (_e) { /* 属性設定不可でも動作は続行 */ }
  }

  function setLang(lang) {
    if (VALID_LANGS.indexOf(lang) < 0) return;
    currentLang = lang;
    try {
      if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, lang);
    } catch (_e) { /* 保存不可でも動作は続行(既定'ja'に落ちるだけ) */ }
    syncHtmlLangAttr();
    applyDom();
  }

  // Stage Bで英語辞書を登録するための入口。{ 原文: 訳文 } のマップをマージする。
  function addDict(map) {
    if (!map) return;
    Object.keys(map).forEach((key) => { dict[key] = map[key]; });
  }

  // ── D-P6-1: 名前辞書(PN_EN)の登録入口 ──
  // dict(通常UI辞書)とは別領域。{ 原文: 訳文 } のマップをマージする(複数回呼び出し可)。
  // 生成元: test/i18n-build-names.js → src/lang-en-names.js。
  function addNames(map) {
    if (!map) return;
    Object.keys(map).forEach((key) => { names[key] = map[key]; });
  }

  // ── P6-11: 姓のみ辞書(フルネームJA → 姓のみEN)の登録入口 ──
  // names(pn)とは別領域。{ フルネームJA: 姓のみEN } のマップをマージする(複数回呼び出し可)。
  // 生成元: test/i18n-build-names.js → src/lang-en-names.js。
  function addSurnames(map) {
    if (!map) return;
    Object.keys(map).forEach((key) => { surnames[key] = map[key]; });
  }

  // ── D-P6-3: 直接補間サイト用ヘルパー ──
  // strが名前辞書に完全一致すればEN訳を返す。一致しなければ原文のまま(fail-open)。
  // ja/pseudo時は素通し(t()のpseudo分岐が辞書引きをしないのと同じ扱い。D-P6-2参照)。
  function pn(str) {
    if (typeof str !== 'string') return str;
    if (currentLang !== 'en') return str;
    return Object.prototype.hasOwnProperty.call(names, str) ? names[str] : str;
  }

  // ── P6-11: チップ・1行固定枠(.flink/.jtc-fn/.nm-tag等)向け姓のみヘルパー ──
  // strはフルネームJA(pn()と同じ入力形)。姓のみ辞書に完全一致すればEN姓を返す。
  // 一致しなければ pn(str)(フルネームEN、無ければ原文)にfail-open。
  // ja/pseudo時は素通し(pn()と対称)。
  function pnSurname(str) {
    if (typeof str !== 'string') return str;
    if (currentLang !== 'en') return str;
    if (Object.prototype.hasOwnProperty.call(surnames, str)) return surnames[str];
    return pn(str);
  }

  // DOMContentLoaded時に自動適用。i18n.jsはbody内の他スクリプトより前に読み込まれる
  // (index.htmlのコメント参照)ため、それまでにパースされた静的要素は既にDOM上に
  // 存在している。念のためDOMContentLoadedでも再適用し、取りこぼしを防ぐ。
  // P6-11: <html lang>属性も初回読み込み時点のcurrentLangに合わせて同期する
  // (静的HTMLはlang="ja"固定のため、EN既定端末の初回起動でズレないようにする)。
  syncHtmlLangAttr();
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => applyDom());
    } else {
      applyDom();
    }
  }

  global.WM_I18N = {
    get lang() { return currentLang; },
    setLang,
    t,
    addDict,
    addNames,
    addSurnames,
    pn,
    pnSurname,
    applyDom,
    // D7: 翻訳漏れログの記録先。テスト/デバッグから中身を読めるようSetのまま公開する。
    _misses: missSeen,
  };
})(typeof window !== 'undefined' ? window : globalThis);
