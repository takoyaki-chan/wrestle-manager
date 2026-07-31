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
  // 返り値: [{ key, start, end, parentPath, valueStart, valueEnd }]
  //   start..end     = キー名トークンの範囲(クォート付きキーはクォートを含む)
  //   valueStart/End = `:` の直後から、同じ階層のカンマ or 親の閉じ括弧まで
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
        const entry = { key: name, start, end: i, parentPath: pathKey(cur().segs), valueStart: skipWs(after + 1), valueEnd: -1 };
        cur().pendingEntry = entry;
        out.push(entry);
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
        const entry = { key: name, start: i, end: j, parentPath: pathKey(cur().segs), valueStart: skipWs(after + 1), valueEnd: -1 };
        cur().pendingEntry = entry;
        out.push(entry);
      }
      prevWord = name; prevChar = text[j - 1]; i = j; continue;
    }
    prevWord = '';
    if (!/\s/.test(c)) prevChar = c;
    if (c === '{') { frames.push({ type: 'obj', segs: childSegs(), pendingKey: null, pendingEntry: null, idx: 0 }); i++; continue; }
    if (c === '[') { frames.push({ type: 'arr', segs: childSegs(), pendingKey: null, pendingEntry: null, idx: 0 }); i++; continue; }
    if (c === '}' || c === ']') {
      const f = frames.pop();
      if (f && f.pendingEntry) { f.pendingEntry.valueEnd = i; f.pendingEntry = null; }
      i++; continue;
    }
    if (c === ',') {
      const f = cur();
      if (f) {
        if (f.type === 'arr') f.idx++;
        else { f.pendingKey = null; if (f.pendingEntry) { f.pendingEntry.valueEnd = i; f.pendingEntry = null; } }
      }
      i++; continue;
    }
    i++;
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────
// 2.5. 軸入れ替え: [性格][アーキタイプ] → [アーキタイプ][性格]
// ───────────────────────────────────────────────────────────────────────
const isArchDict = (o) => {
  if (!isDict(o)) return false;
  const ks = Object.keys(o);
  const a = ks.filter(k => ARCHETYPE_PURE.has(k) || k === 'standard').length;
  const p = ks.filter(k => PERSONALITY.has(k) && k !== 'normal').length;
  return a >= 2 && a > p;
};
const isPersDict = (o) => {
  if (!isDict(o)) return false;
  const ks = Object.keys(o);
  const p = ks.filter(k => PERSONALITY.has(k)).length;
  const a = ks.filter(k => ARCHETYPE_PURE.has(k) || k === 'standard').length;
  return p >= 2 && p > a;
};

// 入れ替え対象の辞書を集める。子がすべてアーキタイプ辞書になっている
// 「きれいな」ものだけを対象とし、そうでないものは dirty として報告する。
function collectSwapTargets(sandbox) {
  const clean = [], dirty = [];
  for (const entry of TABLE_MANIFEST) {
    const root = resolvePath(sandbox, entry.path);
    if (root === undefined || entry.path.includes('.')) continue;
    const seen = new Set();
    (function scan(node, segs) {
      if (!node || typeof node !== 'object' || seen.has(node)) return;
      seen.add(node);
      if (isPersDict(node)) {
        const kids = Object.entries(node);
        const archKids = kids.filter(([, v]) => isArchDict(v));
        if (archKids.length) {
          const rec = {
            table: entry.path, file: entry.file, cat: entry.cat,
            path: pathKey(segs), segs: segs.slice(),
            persKeys: kids.map(([k]) => k),
            archKeys: [...new Set(archKids.flatMap(([, v]) => Object.keys(v)))],
            oddKeys: kids.filter(([, v]) => !isArchDict(v)).map(([k]) => k),
          };
          (rec.oddKeys.length ? dirty : clean).push(rec);
          return; // 入れ替え対象の内側はこれ以上降りない
        }
      }
      if (Array.isArray(node)) node.forEach((v, i) => scan(v, segs.concat([i])));
      else for (const k of Object.keys(node)) scan(node[k], segs.concat([k]));
    })(root, []);
  }
  return { clean, dirty };
}

// 元テキストの [性格][アーキ] ブロックを [アーキ][性格] に組み替える。
// **セリフ本体(値のテキスト)は1文字も変えず、そのまま移動させる。**
function buildSwappedText(text, rec, keys) {
  // keys: findKeyOffsets の結果
  const persEntries = keys.filter(k => k.parentPath === rec.path && rec.persKeys.includes(k.key));
  if (persEntries.length !== rec.persKeys.length) return null;

  // (性格, アーキタイプ) -> 値のソーステキスト
  const cell = new Map();
  const archOrder = [];
  for (const pe of persEntries) {
    const inner = keys.filter(k => k.parentPath === `${rec.path}.${pe.key}`);
    for (const ie of inner) {
      if (ie.valueEnd < 0) return null;
      cell.set(`${pe.key} ${ie.key}`, text.slice(ie.valueStart, ie.valueEnd).replace(/\s+$/, ''));
      if (!archOrder.includes(ie.key)) archOrder.push(ie.key);
    }
  }

  // 元の字下げを踏襲する(性格キー行の行頭からのインデント)
  const lineStart = text.lastIndexOf('\n', persEntries[0].start) + 1;
  const indent = text.slice(lineStart, persEntries[0].start);
  const inner = indent + '  ';

  const parts = [];
  for (const a of archOrder) {
    const rows = [];
    for (const p of rec.persKeys) {
      const v = cell.get(`${p} ${a}`);
      if (v === undefined) continue; // その組み合わせは元から無い
      rows.push(`${inner}${p}: ${v},`);
    }
    if (!rows.length) continue;
    parts.push(`${indent}${a}: {\n${rows.join('\n')}\n${indent}},`);
  }
  return parts.join('\n');
}

// ───────────────────────────────────────────────────────────────────────
// 3. メイン
// ───────────────────────────────────────────────────────────────────────
function runSwap(argv) {
  const write = argv.includes('--write');
  const fileArg = (argv.find(a => a.startsWith('--file=')) || '').slice(7);
  const tableArg = (argv.find(a => a.startsWith('--table=')) || '').slice(8);

  const { allDecls, fileSrc } = loadAllDecls();
  const sandbox = evalAll(allDecls);
  const { clean, dirty } = collectSwapTargets(sandbox);

  const scoped = clean.filter(r => (!fileArg || r.file === fileArg) && (!tableArg || r.table === tableArg));
  const scopedDirty = dirty.filter(r => (!fileArg || r.file === fileArg) && (!tableArg || r.table === tableArg));

  console.log(`[axis-rewrite swap] 対象: ${scoped.length}ヶ所 / ${new Set(scoped.map(r => r.table)).size}テーブル` +
              (scopedDirty.length ? `  (要手動 ${scopedDirty.length}ヶ所)` : ''));
  for (const d of scopedDirty) {
    console.log(`  [手動] ${d.table}${d.path.slice(0, 60)} — アーキタイプ辞書でない子: ${d.oddKeys.join(',')}`);
  }
  if (!scoped.length) { console.log('  (該当なし)'); return; }

  // テーブル -> ソース上の宣言位置
  const byTable = new Map();
  for (const r of scoped) {
    if (!byTable.has(r.table)) byTable.set(r.table, []);
    byTable.get(r.table).push(r);
  }

  const edits = new Map(); // file -> [{start,end,text}]
  let ok = 0;
  const fails = [];
  for (const [table, recs] of byTable) {
    const file = recs[0].file;
    const src = fileSrc.get(file);
    const m = new RegExp(`^const\\s+${table}\\s*=\\s*`, 'm').exec(src);
    if (!m) { fails.push(`${table}: 宣言行が見つからない`); continue; }
    const decl = findTopLevelDeclarations(src).find(d => d.name === table && !d.error);
    if (!decl) { fails.push(`${table}: 宣言のパースに失敗`); continue; }
    const base = m.index + m[0].length;
    const text = src.slice(base, base + decl.exprText.length);
    const keys = findKeyOffsets(text);

    for (const rec of recs) {
      const swapped = buildSwappedText(text, rec, keys);
      if (swapped == null) { fails.push(`${table}${rec.path}: 値の範囲を特定できない`); continue; }
      // 置換範囲 = 最初の性格キーの先頭 〜 最後の性格キーの値の終端
      const pes = keys.filter(k => k.parentPath === rec.path && rec.persKeys.includes(k.key));
      const start = Math.min(...pes.map(k => k.start));
      const end = Math.max(...pes.map(k => k.valueEnd));
      if (!isFinite(start) || end < 0) { fails.push(`${table}${rec.path}: 範囲計算に失敗`); continue; }
      if (!edits.has(file)) edits.set(file, []);
      edits.get(file).push({ start: base + start, end: base + end, text: swapped.replace(/^\s+/, '').replace(/,$/, '') });
      ok++;
    }
  }

  if (fails.length) {
    console.error('\n[axis-rewrite swap] 組み替えできなかった箇所がある。書き込みは行わない:');
    for (const f of fails) console.error('  - ' + f);
    process.exit(1);
  }
  console.log(`[axis-rewrite swap] 組み替え可能: ${ok}ヶ所`);

  if (!write) {
    // 先頭1件をプレビュー
    const [file, list] = [...edits][0];
    const one = list.slice().sort((a, b) => a.start - b.start)[0];
    const src = fileSrc.get(file);
    console.log(`\n--- プレビュー src/${file} ---\n【前】\n${src.slice(one.start, Math.min(one.end, one.start + 400))}\n\n【後】\n${one.text.slice(0, 400)}`);
    console.log('\n[axis-rewrite swap] --write が無いので書き込みはしていない。');
    return;
  }

  for (const [file, list] of edits) {
    const full = path.join(SRC, file);
    const src = fs.readFileSync(full, 'utf8');
    fs.writeFileSync(full + '.bak', src, 'utf8');
    list.sort((a, b) => b.start - a.start);
    let out = src;
    for (const e of list) out = out.slice(0, e.start) + e.text + out.slice(e.end);
    fs.writeFileSync(full, out, 'utf8');
    console.log(`[axis-rewrite swap] 書き込み: src/${file} (${list.length}ヶ所)`);
  }
}

function main() {
  const cmd = process.argv[2];
  const write = process.argv.includes('--write');
  if (cmd === 'swap') return runSwap(process.argv.slice(3));
  if (cmd !== 'rename') {
    console.error('usage: node tools/axis-rewrite.js rename|swap [--file=X.js] [--table=NAME] [--write]');
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
