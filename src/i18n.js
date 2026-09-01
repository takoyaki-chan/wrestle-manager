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
// ══════════════════════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  const STORAGE_KEY = 'wm_lang';
  const VALID_LANGS = ['ja', 'en', 'pseudo'];
  const DEFAULT_LANG = 'ja';

  // 原文 → 訳文。P1時点では空(Stage Bで addDict() により英語辞書が登録される)。
  const dict = Object.create(null);
  // このセッションで既にログ済みの未訳キー(D7: 同一キーは1回だけ)。
  const missSeen = new Set();

  function readStoredLang() {
    try {
      const store = global.localStorage;
      const v = store ? store.getItem(STORAGE_KEY) : null;
      return VALID_LANGS.indexOf(v) >= 0 ? v : DEFAULT_LANG;
    } catch (_e) {
      return DEFAULT_LANG;
    }
  }

  let currentLang = readStoredLang();

  // {key} プレースホルダを params[key] で置換する。params が無ければ何もしない。
  function applyParams(str, params) {
    if (!params || typeof str !== 'string') return str;
    let out = str;
    Object.keys(params).forEach((key) => {
      out = out.split('{' + key + '}').join(params[key]);
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
    const translated = Object.prototype.hasOwnProperty.call(dict, text) ? dict[text] : null;
    if (translated == null) {
      logMiss(text);
      return applyParams(text, params);
    }
    return applyParams(translated, params);
  }

  function setLang(lang) {
    if (VALID_LANGS.indexOf(lang) < 0) return;
    currentLang = lang;
    try {
      if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, lang);
    } catch (_e) { /* 保存不可でも動作は続行(既定'ja'に落ちるだけ) */ }
  }

  // Stage Bで英語辞書を登録するための入口。{ 原文: 訳文 } のマップをマージする。
  function addDict(map) {
    if (!map) return;
    Object.keys(map).forEach((key) => { dict[key] = map[key]; });
  }

  global.WM_I18N = {
    get lang() { return currentLang; },
    setLang,
    t,
    addDict,
    // D7: 翻訳漏れログの記録先。テスト/デバッグから中身を読めるようSetのまま公開する。
    _misses: missSeen,
  };
})(typeof window !== 'undefined' ? window : globalThis);
