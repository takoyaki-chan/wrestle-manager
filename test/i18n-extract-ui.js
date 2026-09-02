#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  test/i18n-extract-ui.js — UI文字列 抽出台帳ジェネレータ (Stage B P3b-1)
//
//  設計: docs/i18n-stage-b-p3b-design-v0.1.md D-B1/D-B5、工程1「抽出」
//
//  ■ 何をするか
//    src/{ui-render,ui-common,app,factions,battle-engine-main,tag-battle-main}.js の
//    全 WM_I18N.t('...') / WM_I18N.t("...") 第1引数リテラル(バッククォートの
//    静的テンプレートリテラルも含む。${}補間を含むものは翻訳不能なため除外・警告)と、
//    src/{index,battle-engine,tag-battle}.html の [data-i18n] 要素のtextContent原文・
//    [data-i18n-attr] 対象属性値を機械抽出し、i18n/ui-ledger.json を生成する。
//
//    台帳スキーマ: { key, en: "", files: [...], count, hasPlaceholder, hasProperNoun }
//    - key: 原文(=WM_I18N.t()の辞書キーそのもの。日本語原文を書き換えない・読み取り専用)
//    - hasPlaceholder: {name}形式のプレースホルダを含むか
//    - hasProperNoun: data.js の ALL_CHARS(name/surname)・ALL_COACHES(name)・
//      VENUES(name)・RIVAL_ORG_NAME_POOL・TITLES(name)・SPECIAL_EVENT_INTRO(title、
//      絵文字接頭辞を除いた本体)+ 明示リテラル(天頂戦/GRAND FINAL)との部分一致で判定。
//      D-B5: 固有名詞入りのUI文は名詞辞書確定後に訳す(先に警告フラグを立てておく)。
//
//  ■ 使い方
//    node test/i18n-extract-ui.js            i18n/ui-ledger.json を(再)生成
//
//  ■ 既存資産との関係
//    test/i18n-scan.js の文字列トークナイザ(scanJS のバッククォート/引用符走査)と
//    同じ考え方で自前の軽量パーサを実装している(scanJS は「全文字列」を対象にした
//    棚卸し用途で、WM_I18N.t()の第1引数だけを狙い撃ちする本スクリプトの用途とは
//    異なるため、ロジックは流用しつつ独立実装とした)。
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'i18n');
const OUT_PATH = path.join(OUT_DIR, 'ui-ledger.json');

const JS_FILES = [
  'ui-render.js', 'ui-common.js', 'app.js',
  'factions.js', 'battle-engine-main.js', 'tag-battle-main.js',
];
const HTML_FILES = ['index.html', 'battle-engine.html', 'tag-battle.html'];

const PLACEHOLDER_RE = /\{[A-Za-z_][A-Za-z0-9_]*\}/g;

// ── 固有名詞リスト(data.js 由来 + 明示リテラル) ─────────────────────────────────
function buildProperNounList() {
  // data.js は module.exports 経由で Node から直接 require 可能(vm経由不要)。
  const data = require(path.join(SRC_DIR, 'data.js'));
  const set = new Set();
  const add = (s) => { if (s && typeof s === 'string' && s.trim()) set.add(s.trim()); };

  (data.ALL_CHARS || []).forEach((c) => { add(c.name); add(c.surname); });
  (data.ALL_COACHES || []).forEach((c) => add(c.name));
  (data.VENUES || []).forEach((v) => add(v.name));
  Object.values(data.RIVAL_ORG_NAME_POOL || {}).forEach((arr) => (arr || []).forEach(add));
  (data.TITLES || []).forEach((t) => add(t.name));
  Object.values(data.SPECIAL_EVENT_INTRO || {}).forEach((ev) => {
    if (!ev || !ev.title) return;
    // 大会名は絵文字接頭辞付き("👑 天頂戦")。先頭の非文字(絵文字・記号・空白)を除いた本体を採用。
    const stripped = ev.title.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    add(stripped);
  });
  // 設計指示に明示された固有名詞(SPECIAL_EVENT_INTRO抽出で既にカバーされる場合も、
  // 表記ゆれ・将来の定義変更に備えて明示的に含めておく)。
  ['天頂戦', 'GRAND FINAL'].forEach(add);

  return Array.from(set).filter(Boolean);
}

function hasProperNoun(text, properNouns) {
  for (let i = 0; i < properNouns.length; i++) {
    if (text.indexOf(properNouns[i]) >= 0) return true;
  }
  return false;
}

function hasPlaceholder(text) {
  PLACEHOLDER_RE.lastIndex = 0;
  return PLACEHOLDER_RE.test(text);
}

function lineOf(src, index) {
  let n = 1;
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === '\n') n++;
  return n;
}

// ── JS文字列リテラルのエスケープ解決(実行時の値と一致させる) ───────────────────
function unescapeJsLiteral(raw) {
  let out = '';
  for (let k = 0; k < raw.length; k++) {
    const c = raw[k];
    if (c !== '\\') { out += c; continue; }
    const next = raw[k + 1];
    switch (next) {
      case 'n': out += '\n'; k++; break;
      case 't': out += '\t'; k++; break;
      case 'r': out += '\r'; k++; break;
      case 'b': out += '\b'; k++; break;
      case 'f': out += '\f'; k++; break;
      case 'v': out += '\v'; k++; break;
      case '0': out += '\0'; k++; break;
      case '\n': k++; break; // 行継続(バックスラッシュ+改行) → 何も追加しない
      case 'u': {
        if (raw[k + 2] === '{') {
          const end = raw.indexOf('}', k + 3);
          if (end >= 0) {
            out += String.fromCodePoint(parseInt(raw.slice(k + 3, end), 16));
            k = end;
            break;
          }
        }
        out += String.fromCharCode(parseInt(raw.slice(k + 2, k + 6), 16));
        k += 5;
        break;
      }
      case 'x': {
        out += String.fromCharCode(parseInt(raw.slice(k + 2, k + 4), 16));
        k += 3;
        break;
      }
      default: out += next; k++; break; // \\ \' \" \` など → そのままの文字
    }
  }
  return out;
}

// ── WM_I18N.t('...') / WM_I18N.t("...") / WM_I18N.t(`静的テンプレート`) を抽出 ──
function extractJsCalls(src, filename, warnings) {
  const results = [];
  const marker = 'WM_I18N.t(';
  let searchFrom = 0;
  while (true) {
    const pos = src.indexOf(marker, searchFrom);
    if (pos === -1) break;
    let i = pos + marker.length;
    searchFrom = i;
    while (i < src.length && /\s/.test(src[i])) i++;
    const q = src[i];

    if (q === "'" || q === '"') {
      let j = i + 1; let raw = ''; let closed = false;
      while (j < src.length) {
        if (src[j] === '\\') { raw += src[j] + (src[j + 1] || ''); j += 2; continue; }
        if (src[j] === q) { closed = true; j++; break; }
        if (src[j] === '\n') break;
        raw += src[j]; j++;
      }
      if (closed) {
        const text = unescapeJsLiteral(raw);
        results.push({ text, line: lineOf(src, pos) });
      } else {
        warnings.push(`${filename}:${lineOf(src, pos)}: 未終端の文字列リテラル(解析失敗、スキップ)`);
      }
      searchFrom = j;
    } else if (q === '`') {
      let j = i + 1; let raw = ''; let hasInterp = false; let closed = false;
      while (j < src.length) {
        if (src[j] === '\\') { raw += src[j] + (src[j + 1] || ''); j += 2; continue; }
        if (src[j] === '`') { closed = true; j++; break; }
        if (src.substr(j, 2) === '${') {
          hasInterp = true;
          let depth = 1; j += 2;
          while (j < src.length && depth > 0) {
            if (src[j] === '{') depth++;
            else if (src[j] === '}') depth--;
            j++;
          }
          continue;
        }
        raw += src[j]; j++;
      }
      if (closed && !hasInterp) {
        const text = unescapeJsLiteral(raw);
        results.push({ text, line: lineOf(src, pos) });
      } else if (closed && hasInterp) {
        warnings.push(`${filename}:${lineOf(src, pos)}: テンプレートリテラルに\${}補間があり静的抽出不能(スキップ)`);
      } else {
        warnings.push(`${filename}:${lineOf(src, pos)}: 未終端のテンプレートリテラル(解析失敗、スキップ)`);
      }
      searchFrom = j;
    }
    // それ以外(識別子・関数呼び出し等の非リテラル引数)は対象外。次のWM_I18N.t(を探す。
  }
  return results;
}

// ── HTML: [data-i18n] / [data-i18n-attr] の機械抽出(引用符を意識した簡易タグパーサ) ──
function decodeHtmlEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseAttrs(attrsRaw) {
  const map = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
  let m;
  while ((m = re.exec(attrsRaw))) {
    const name = m[1];
    if (!name) continue;
    const val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : true);
    map[name] = val;
  }
  return map;
}

function extractHtmlI18n(rawSrc, filename, warnings) {
  const results = []; // {text, line, kind}
  // <script>/<style> の本体は同じ長さの空白へ潰す(オフセット=行番号を保つ)。
  let src = rawSrc.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  src = src.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, open, body, close) => open + body.replace(/[^\n]/g, ' ') + close);
  src = src.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, open, body, close) => open + body.replace(/[^\n]/g, ' ') + close);

  let i = 0;
  while (i < src.length) {
    if (src[i] !== '<') { i++; continue; }
    if (src.substr(i, 2) === '</' || src.substr(i, 4) === '<!--' || src.substr(i, 9).toLowerCase() === '<!doctype') { i++; continue; }
    let j = i + 1;
    const nameStart = j;
    while (j < src.length && /[A-Za-z0-9]/.test(src[j])) j++;
    if (j === nameStart) { i++; continue; } // '<' が実タグ開始ではない(比較演算子等)
    const tagName = src.slice(nameStart, j);

    let inQuote = null;
    while (j < src.length) {
      const c = src[j];
      if (inQuote) { if (c === inQuote) inQuote = null; j++; continue; }
      if (c === '"' || c === "'") { inQuote = c; j++; continue; }
      if (c === '>') { j++; break; }
      j++;
    }
    const tagEnd = j;
    const attrsRaw = src.slice(nameStart + tagName.length, tagEnd - 1);
    const attrs = parseAttrs(attrsRaw);
    const lineNo = lineOf(src, i);

    if (Object.prototype.hasOwnProperty.call(attrs, 'data-i18n')) {
      const closeTag = `</${tagName}`;
      const closeIdx = src.toLowerCase().indexOf(closeTag.toLowerCase(), tagEnd);
      if (closeIdx === -1) {
        warnings.push(`${filename}:${lineNo}: <${tagName} data-i18n> の閉じタグが見つからない(スキップ)`);
      } else {
        const rawText = src.slice(tagEnd, closeIdx);
        if (rawText.indexOf('<') >= 0) {
          warnings.push(`${filename}:${lineNo}: <${tagName} data-i18n> のtextContentに子要素混在の疑い(想定外構造、スキップ)`);
        } else {
          const text = decodeHtmlEntities(rawText);
          if (text.trim()) results.push({ text, line: lineNo, kind: 'text' });
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(attrs, 'data-i18n-attr')) {
      const spec = attrs['data-i18n-attr'];
      const names = (typeof spec === 'string' ? spec : '').split(',').map((s) => s.trim()).filter(Boolean);
      names.forEach((name) => {
        if (!Object.prototype.hasOwnProperty.call(attrs, name)) {
          warnings.push(`${filename}:${lineNo}: data-i18n-attr="${spec}" が属性 "${name}" を参照しているが同タグに存在しない(スキップ)`);
          return;
        }
        const val = attrs[name];
        if (typeof val !== 'string' || !val.trim()) return;
        results.push({ text: decodeHtmlEntities(val), line: lineNo, kind: `attr:${name}` });
      });
    }

    i = tagEnd;
  }
  return results;
}

// ── メイン ──────────────────────────────────────────────────────────────────
function main() {
  const warnings = [];
  const properNouns = buildProperNounList();
  const ledgerMap = new Map(); // key -> { key, en, filesSet, count, hasPlaceholder, hasProperNoun }

  function record(text, filename) {
    if (typeof text !== 'string' || !text) return;
    let entry = ledgerMap.get(text);
    if (!entry) {
      entry = {
        key: text,
        en: '',
        filesSet: new Set(),
        count: 0,
        hasPlaceholder: hasPlaceholder(text),
        hasProperNoun: hasProperNoun(text, properNouns),
      };
      ledgerMap.set(text, entry);
    }
    entry.filesSet.add(filename);
    entry.count++;
  }

  const perFileStats = [];

  JS_FILES.forEach((filename) => {
    const filePath = path.join(SRC_DIR, filename);
    if (!fs.existsSync(filePath)) { warnings.push(`${filename}: ファイルが存在しない(スキップ)`); return; }
    const src = fs.readFileSync(filePath, 'utf8');
    const calls = extractJsCalls(src, filename, warnings);
    calls.forEach((c) => record(c.text, filename));
    perFileStats.push({ file: filename, extracted: calls.length });
  });

  HTML_FILES.forEach((filename) => {
    const filePath = path.join(SRC_DIR, filename);
    if (!fs.existsSync(filePath)) { warnings.push(`${filename}: ファイルが存在しない(スキップ)`); return; }
    const src = fs.readFileSync(filePath, 'utf8');
    const items = extractHtmlI18n(src, filename, warnings);
    items.forEach((it) => record(it.text, filename));
    perFileStats.push({ file: filename, extracted: items.length });
  });

  const ledger = Array.from(ledgerMap.values())
    .map((e) => ({
      key: e.key,
      en: e.en,
      files: Array.from(e.filesSet).sort(),
      count: e.count,
      hasPlaceholder: e.hasPlaceholder,
      hasProperNoun: e.hasProperNoun,
    }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8');

  // ── レポート ──
  const total = ledger.length;
  const properCount = ledger.filter((e) => e.hasProperNoun).length;
  const placeholderCount = ledger.filter((e) => e.hasPlaceholder).length;

  console.log(`[i18n-extract-ui] 台帳を生成しました: ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[i18n-extract-ui] 総キー数=${total} hasProperNoun=${properCount} hasPlaceholder=${placeholderCount}`);
  console.log('[i18n-extract-ui] ファイル別抽出件数(呼び出し/要素の総数。キーの重複統合前):');
  perFileStats.forEach((s) => console.log(`  ${s.file.padEnd(24)} ${String(s.extracted).padStart(6)}`));
  console.log(`[i18n-extract-ui] 固有名詞リスト件数=${properNouns.length}`);

  if (warnings.length) {
    console.log(`[i18n-extract-ui] 警告 ${warnings.length}件:`);
    warnings.slice(0, 50).forEach((w) => console.log(`  ${w}`));
    if (warnings.length > 50) console.log(`  ...ほか${warnings.length - 50}件`);
  }
}

main();
