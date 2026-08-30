'use strict';
// pledge-lines-guard-test.js — 起用約束セリフ63本の解決ガード(care-rework2 P2-G / task-101)
//
// 守るもの:
//   A. 3場面 × archetype 7種 = 21セルすべてが、空でも '…' でもなく引けること
//      (「書いてあるのに出ていない」= セリフを足したのに解決経路が届かない事故の検出)
//   B. 本文が承認済み草案と文字単位で一致すること
//      docs/dialogue/pledge-lines-draft-v0.1.md は Keisuke 全文承認済みで文面変更禁止。
//      うっかり推敲してしまう事故をここで止める。
//   C. PLEDGE_LINES が単一の宣言リテラルであること
//      (ブラケット代入・push はワークブック往復から不可視。GLIMPSE_B で踏んだ罠。
//       全面禁止そのものは glimpse-b-axis-guard-test.js が src/*.js 横断で見ているので、
//       ここでは「PLEDGE_LINES が const 宣言で1つだけ」を確認する)
//   D. セリフ抽出レジストリに登録されていること(tools/extract-dialogue.js)
//   E. 吹き出しに出す本文なので「」を含まないこと
//      (地の文へ埋め込む COMMON5_LINES.leaderQuoteA と違い、こちらは吹き出しの中身。
//       「」付きだと吹き出しの中で二重括弧になる)

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { scanExpr } = require('../tools/extract-dialogue-parser.js');

const ROOT = path.join(__dirname, '..');
const dataPath = path.join(ROOT, 'src', 'data.js');
const data = fs.readFileSync(dataPath, 'utf8').replace(/\r\n/g, '\n');

const SCENES = ['accept', 'kept', 'broken'];
const ARCHETYPES = ['standard', 'composed', 'cool', 'delinquent', 'ojousama', 'polite', 'seductive'];

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 起用約束セリフ(PLEDGE_LINES)の解決ガード ===\n');

// ── テーブルの取り出し ────────────────────────────────────────────────
const anchor = /^const PLEDGE_LINES = /m.exec(data);
assert.ok(anchor, 'const PLEDGE_LINES の宣言が見つからない');
const exprStart = anchor.index + anchor[0].length;
const TABLE = vm.runInNewContext('(' + data.slice(exprStart, scanExpr(data, exprStart)) + ')');

// 解決関数(getDialoguePool ではなく専用の pickPledgeLine を使う)を切り出して評価する
const ctx = vm.createContext({ PLEDGE_LINES: TABLE });
const poolStart = data.indexOf('function getPledgeLinePool');
assert.ok(poolStart >= 0, 'getPledgeLinePool が見つからない');
vm.runInContext(data.slice(poolStart, data.indexOf('\n}', poolStart) + 2), ctx);
const getPledgeLinePool = vm.runInContext('getPledgeLinePool', ctx);

// ── C. 単一の宣言リテラル ─────────────────────────────────────────────
section('PLEDGE_LINES は const 宣言リテラルが1つだけ', () => {
  const decls = data.match(/^const PLEDGE_LINES\s*=/gm) || [];
  assert.strictEqual(decls.length, 1, `const 宣言が ${decls.length} 個ある(二重定義は解決の平坦化を生む)`);
  const reassign = data.match(/^PLEDGE_LINES\s*[[.]/gm) || [];
  assert.deepStrictEqual(reassign, [], 'PLEDGE_LINES への後付け代入/pushがある(ワークブック往復から不可視になる)');
});

// ── A. 全セルが引けること ─────────────────────────────────────────────
section('3場面 × archetype 7種 = 21セルすべてが空・"…" なしで引ける', () => {
  const bad = [];
  for (const scene of SCENES) {
    for (const archetype of ARCHETYPES) {
      const pool = getPledgeLinePool(scene, { archetype, personality: 'bold' });
      if (!Array.isArray(pool) || pool.length === 0) { bad.push(`${scene}.${archetype}: 空`); continue; }
      if (pool.length !== 3) bad.push(`${scene}.${archetype}: ${pool.length}本(3本のはず)`);
      pool.forEach((line, i) => {
        if (typeof line !== 'string' || !line.trim()) bad.push(`${scene}.${archetype}[${i}]: 空文字`);
        else if (line.trim() === '…') bad.push(`${scene}.${archetype}[${i}]: '…' フォールバック`);
      });
    }
  }
  assert.deepStrictEqual(bad, [], '引けないセルがある:\n' + bad.join('\n'));
});

section('未知の口調は standard へ落ちる(空にならない)', () => {
  const pool = getPledgeLinePool('accept', { archetype: 'no_such_archetype', personality: 'bold' });
  assert.ok(Array.isArray(pool) && pool.length === 3, '未知の口調で standard に落ちていない');
  assert.deepStrictEqual(pool, TABLE.accept.standard, 'フォールバック先が standard ではない');
});

section('未知の場面は null を返す(呼び出し側が演出ごと省略できる)', () => {
  assert.strictEqual(getPledgeLinePool('no_such_scene', { archetype: 'standard' }), null);
});

// ── E. 吹き出し本文なので「」を持たない ───────────────────────────────
section('本文に「」を含まない(吹き出しの中で二重括弧にならない)', () => {
  const bad = [];
  for (const scene of SCENES) {
    for (const archetype of ARCHETYPES) {
      (TABLE[scene][archetype] || []).forEach((line, i) => {
        if (line.includes('「') || line.includes('」')) bad.push(`${scene}.${archetype}[${i}]`);
      });
    }
  }
  assert.deepStrictEqual(bad, [], '「」を含む本文がある:\n' + bad.join('\n'));
});

// ── B. 承認済み草案との文字単位一致 ───────────────────────────────────
section('63本すべてが承認済み草案と文字単位で一致する', () => {
  const draftPath = path.join(ROOT, 'docs', 'dialogue', 'pledge-lines-draft-v0.1.md');
  const draft = fs.readFileSync(draftPath, 'utf8').replace(/\r\n/g, '\n');

  const parsed = {};
  let scene = null, archetype = null;
  for (const raw of draft.split('\n')) {
    let m;
    if ((m = /^## pledge_(accept|kept|broken)/.exec(raw))) { scene = m[1]; archetype = null; continue; }
    if ((m = /^### (\w+)/.exec(raw))) { archetype = m[1]; continue; }
    // 草案の「」は Markdown 上の会話マーカーであり本文ではない(data.js 側では外す)
    if (scene && archetype && (m = /^\d+\.\s*「(.+)」\s*$/.exec(raw))) {
      (parsed[`${scene}.${archetype}`] = parsed[`${scene}.${archetype}`] || []).push(m[1]);
    }
  }

  const diffs = [];
  let matched = 0;
  for (const s of SCENES) {
    for (const a of ARCHETYPES) {
      const src = parsed[`${s}.${a}`] || [];
      const dst = TABLE[s][a] || [];
      assert.strictEqual(src.length, 3, `草案の ${s}.${a} が3本ではない(${src.length}本) — 草案側の見出しが変わった可能性`);
      src.forEach((line, i) => {
        if (line === dst[i]) matched++;
        else diffs.push(`${s}.${a}[${i}]\n    草案: ${line}\n    実装: ${dst[i]}`);
      });
    }
  }
  assert.deepStrictEqual(diffs, [], '草案と実装が食い違う(承認済み文面は変更禁止):\n' + diffs.join('\n'));
  assert.strictEqual(matched, 63, `一致本数が ${matched}/63`);
});

// ── D. 抽出レジストリ登録 ─────────────────────────────────────────────
section('tools/extract-dialogue.js のレジストリに登録されている', () => {
  const ex = fs.readFileSync(path.join(ROOT, 'tools', 'extract-dialogue.js'), 'utf8');
  assert.ok(/T\('PLEDGE_LINES',\s*'data\.js'/.test(ex),
    'PLEDGE_LINES が抽出レジストリに無い — ワークブック往復から不可視になる');
});

console.log('');
if (failed > 0) { console.log(`結果: ${failed} 件 FAIL`); process.exit(1); }
console.log('結果: 全項目 PASS');
