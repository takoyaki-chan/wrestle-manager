#!/usr/bin/env node
'use strict';
/**
 * tools/axis-rewrite.js
 *
 * セリフテーブルの「軸」をソーステキスト上で構造的に書き換えるツール。
 *
 *   node tools/axis-rewrite.js rename [--write]
 *     アーキタイプ位置に残った旧キー `normal` を `standard` に改名する。
 *
 * ── なぜテキスト置換ではなく構造走査なのか ─────────────────────────
 * `normal` は**性格キーでもアーキタイプキーでもある**(task-68 でアーキタイプ側だけ
 * `standard` に改名されたが、31テーブルが取り残された)。したがって
 *   - `HOT_TAG_LINES.normal`        → 性格「ノーマル」。**触ってはいけない**
 *   - `HOT_TAG_LINES.bold.normal`   → アーキタイプ「標準」。**改名対象**
 * の2つを区別しないと壊れる。値の型で見分ける手も試したが反例が75件あり使えない
 * (FACTION_TRANSITION_LINES / F07_LINES / FACTION_F02_LINES はアーキタイプ位置なのに
 *  値が dict や string)。
 *
 * そこで:
 *   1. extract-dialogue.js のパイプラインでテーブルを**評価**し、
 *      「アーキタイプ位置にある normal 辞書」のキーパスを確定させる(判定はデータで行う)
 *   2. 同じテーブルの**ソーステキスト**をキーパス付きで走査し、
 *      1 で確定したパスに一致する `normal:` トークンだけを書き換える
 *
 * 1 と 2 の件数が一致しない場合は書き込まずに異常終了する(対応が取れていない証拠)。
 * 書き込み時は対象ファイルを `<name>.bak` に退避する。
 */

const fs = require('fs');
const path = require('path');
const EX = require('./extract-dialogue.js');
const { loadAllDecls, evalAll, resolvePath, TABLE_MANIFEST, SRC } = EX;
const { findTopLevelDeclarations } = require('./extract-dialogue-parser.js');

const PERSONALITY = new Set(['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional']);
// standard / normal を除いた「疑いようのないアーキタイプキー」。
// これが同居していれば、その辞書はアーキタイプ位置だと断定できる。
const ARCHETYPE_PURE = new Set(['composed', 'ojousama', 'delinquent', 'cool', 'seductive', 'polite']);

const isDict = (o) => o && typeof o === 'object' && !Array.isArray(o);
const pathKey = (segs) => segs.map(s => (typeof s === 'number' ? `[${s}]` : `.${s}`)).join('');

// ───────────────────────────────────────────────────────────────────────
// 1. 評価済みオブジェクトから「アーキタイプ位置の normal 辞書」を集める
// ───────────────────────────────────────────────────────────────────────
function collectTargets(sandbox) {
  const targets = new Map(); // tableName -> Set(親辞書のパス文字列)
  const report = [];

  for (const entry of TABLE_MANIFEST) {
    const root = resolvePath(sandbox, entry.path);
    if (root === undefined) continue;
    // ドット区切りパス(Engine.xxx)はソース上の const 宣言と対応が取れないので対象外
    if (entry.path.includes('.')) continue;

    const seen = new Set();
    const hits = [];

    (function scan(node, segs, parentKey) {
      if (!node || typeof node !== 'object' || seen.has(node)) return;
      seen.add(node);

      if (isDict(node) && Object.prototype.hasOwnProperty.call(node, 'normal')) {
        const keys = Object.keys(node);
        const hasPureArch = keys.some(k => ARCHETYPE_PURE.has(k));
        const hasOtherPers = keys.some(k => PERSONALITY.has(k) && k !== 'normal');
        let verdict = null;
        if (hasPureArch) verdict = 'ARCH:同居キーで断定';
        else if (hasOtherPers) verdict = null; // 性格辞書。触らない
        else {
          // キーが normal(/standard) だけ。親のキーが性格ならアーキタイプ位置。
          const pk = String(parentKey == null ? '' : parentKey);
          const compound = /^([a-z]+)_([a-z]+)$/.exec(pk);
          if (PERSONALITY.has(pk)) verdict = 'ARCH:親が性格キー';
          else if (compound && PERSONALITY.has(compound[1])) verdict = 'ARCH:親が複合キー';
        }
        if (verdict) hits.push({ segs: segs.slice(), verdict, keys });
      }

      if (Array.isArray(node)) node.forEach((v, i) => scan(v, segs.concat([i]), null));
      else for (const k of Object.keys(node)) scan(node[k], segs.concat([k]), k);
    })(root, [], null);

    if (hits.length) {
      targets.set(entry.path, new Set(hits.map(h => pathKey(h.segs))));
      report.push({ table: entry.path, file: entry.file, hits });
    }
  }
  return { targets, report };
}

// ───────────────────────────────────────────────────────────────────────
// 2. ソーステキストをキーパス付きで走査し、`normal:` の位置を返す
// ───────────────────────────────────────────────────────────────────────
const REGEX_PREV_KEYWORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'case', 'do', 'else', 'new', 'delete', 'void', 'throw', 'yield', 'await']);

function findKeyOffsets(text) {
  // 返り値: [{ key, start, end, parentPath }] — parentPath は pathKey 形式
  const out = [];
  const frames = [];
  let i = 0, prevChar = '', prevWord = '';
  const n = text.length;
  const cur = () => frames[frames.length - 1];
  const childSegs = () => {
    const f = cur();
    if (!f) return [];
    return f.type === 'obj' ? f.segs.concat([f.pendingKey]) : f.segs.concat([f.idx]);
  };
  const skipWs = (j) => {
    for (;;) {
      while (j < n && /\s/.test(text[j])) j++;
      if (text[j] === '/' && text[j + 1] === '/') { const k = text.indexOf('\n', j); if (k === -1) return n; j = k; continue; }
      if (text[j] === '/' && text[j + 1] === '*') { const k = text.indexOf('*/', j + 2); if (k === -1) return n; j = k + 2; continue; }
      return j;
    }
  };

  while (i < n) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '/') { const k = text.indexOf('\n', i); if (k === -1) break; i = k; continue; }
    if (c === '/' && text[i + 1] === '*') { const k = text.indexOf('*/', i + 2); if (k === -1) break; i = k + 2; continue; }
    if (c === '`') { // テンプレートリテラル(${} のネストも飛ばす)
      i++; let depth = 0;
      while (i < n) {
        if (text[i] === '\\') { i += 2; continue; }
        if (depth === 0 && text[i] === '`') { i++; break; }
        if (text[i] === '$' && text[i + 1] === '{') { depth++; i += 2; continue; }
        if (depth > 0 && text[i] === '}') { depth--; i++; continue; }
        i++;
      }
      prevChar = '`'; prevWord = ''; continue;
    }
    if (c === "'" || c === '"') {
      const q = c; const start = i; i++;
      while (i < n && text[i] !== q) { if (text[i] === '\\') i++; i++; }
      i++;
      const name = text.slice(start + 1, i - 1);
      const after = skipWs(i);
      if (cur() && cur().type === 'obj' && text[after] === ':') {
        cur().pendingKey = name;
        out.push({ key: name, start, end: i, parentPath: pathKey(cur().segs) });
      }
      prevChar = q; prevWord = ''; continue;
    }
    if (c === '/' && (!prevChar || REGEX_PREV_KEYWORDS.has(prevWord) || !/[A-Za-z0-9_$)\]]/.test(prevChar))) {
      i++; let inClass = false;
      while (i < n) {
        const d = text[i];
        if (d === '\\') { i += 2; continue; }
        if (d === '\n') break;
        if (inClass) { if (d === ']') inClass = false; i++; continue; }
        if (d === '[') { inClass = true; i++; continue; }
        if (d === '/') { i++; break; }
        i++;
      }
      while (i < n && /[a-z]/.test(text[i])) i++;
      prevChar = '/'; prevWord = ''; continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(text[j])) j++;
      const name = text.slice(i, j);
      const after = skipWs(j);
      if (cur() && cur().type === 'obj' && text[after] === ':') {
        cur().pendingKey = name;
        out.push({ key: name, start: i, end: j, parentPath: pathKey(cur().segs) });
      }
      prevWord = name; prevChar = text[j - 1]; i = j; continue;
    }
    prevWord = '';
    if (!/\s/.test(c)) prevChar = c;
    if (c === '{') { frames.push({ type: 'obj', segs: childSegs(), pendingKey: null, idx: 0 }); i++; continue; }
    if (c === '[') { frames.push({ type: 'arr', segs: childSegs(), pendingKey: null, idx: 0 }); i++; continue; }
    if (c === '}' || c === ']') { frames.pop(); i++; continue; }
    if (c === ',') { const f = cur(); if (f) { if (f.type === 'arr') f.idx++; else f.pendingKey = null; } i++; continue; }
    i++;
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────
// 3. メイン
// ───────────────────────────────────────────────────────────────────────
function main() {
  const cmd = process.argv[2];
  const write = process.argv.includes('--write');
  if (cmd !== 'rename') {
    console.error('usage: node tools/axis-rewrite.js rename [--write]');
    process.exit(2);
  }

  const { allDecls, fileSrc } = loadAllDecls();
  const sandbox = evalAll(allDecls);
  const { targets, report } = collectTargets(sandbox);

  const expected = report.reduce((a, r) => a + r.hits.length, 0);
  console.log(`[axis-rewrite] 評価側で確定したアーキタイプ位置の normal 辞書: ${expected}ヶ所 / ${report.length}テーブル`);

  // 宣言のソース位置(ファイル内オフセット)を引くための索引
  const declByName = new Map();
  for (const file of new Set(report.map(r => r.file))) {
    const src = fileSrc.get(file);
    if (src == null) continue;
    for (const d of findTopLevelDeclarations(src)) {
      if (d.error || d.isAssignment) continue;
      if (!declByName.has(d.name)) declByName.set(d.name, { file, src, d });
    }
  }

  const edits = new Map(); // file -> [{start, end}]
  let matched = 0;
  const misses = [];

  for (const r of report) {
    const info = declByName.get(r.table);
    if (!info) { misses.push(`${r.table}: ソース上の const 宣言が見つからない`); continue; }
    const exprStart = info.src.indexOf(info.d.exprText, 0);
    // exprText は一意とは限らないので、宣言行から探し直す
    const declRe = new RegExp(`^const\\s+${r.table}\\s*=\\s*`, 'm');
    const m = declRe.exec(info.src);
    if (!m) { misses.push(`${r.table}: 宣言行の再検出に失敗`); continue; }
    const base = m.index + m[0].length;
    const text = info.src.slice(base, base + info.d.exprText.length);

    const want = targets.get(r.table);
    const keys = findKeyOffsets(text);
    let hit = 0;
    for (const k of keys) {
      if (k.key !== 'normal') continue;
      if (!want.has(k.parentPath)) continue;
      if (!edits.has(info.file)) edits.set(info.file, []);
      edits.get(info.file).push({ start: base + k.start, end: base + k.end });
      hit++;
    }
    if (hit !== r.hits.length) {
      misses.push(`${r.table}: 評価${r.hits.length}ヶ所 に対しソース側 ${hit}ヶ所`);
    }
    matched += hit;
    console.log(`  ${r.table.padEnd(44)} src/${info.file.padEnd(28)} 評価${String(r.hits.length).padStart(3)} / ソース${String(hit).padStart(3)}`);
  }

  console.log(`\n[axis-rewrite] ソース側で特定できた書き換え位置: ${matched}ヶ所`);
  if (misses.length) {
    console.error('\n[axis-rewrite] 件数が一致しないテーブルがある。書き込みは行わない:');
    for (const s of misses) console.error('  - ' + s);
    process.exit(1);
  }
  if (matched !== expected) {
    console.error(`\n[axis-rewrite] 合計が一致しない(評価${expected} / ソース${matched})。書き込みは行わない。`);
    process.exit(1);
  }

  if (!write) {
    console.log('\n[axis-rewrite] --write が無いので書き込みはしていない。');
    for (const [file, list] of edits) console.log(`  src/${file}: ${list.length}ヶ所`);
    return;
  }

  for (const [file, list] of edits) {
    const full = path.join(SRC, file);
    const src = fs.readFileSync(full, 'utf8');
    fs.writeFileSync(full + '.bak', src, 'utf8');
    list.sort((a, b) => b.start - a.start); // 後ろから置換してオフセットを保つ
    let out = src;
    for (const e of list) {
      if (out.slice(e.start, e.end) !== 'normal') {
        console.error(`[axis-rewrite] 想定外: ${file} @${e.start} が "normal" ではない`);
        process.exit(1);
      }
      out = out.slice(0, e.start) + 'standard' + out.slice(e.end);
    }
    fs.writeFileSync(full, out, 'utf8');
    console.log(`[axis-rewrite] 書き込み: src/${file} (${list.length}ヶ所, バックアップ ${file}.bak)`);
  }
}

if (require.main === module) main();
module.exports = { findKeyOffsets, collectTargets };
