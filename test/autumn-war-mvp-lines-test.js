const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = fs.readFileSync(path.join(root, 'src/data.js'), 'utf8').replace(/\r\n/g, '\n');

// ── オブジェクトリテラル抽出（autumn-war-ui-flow-test.js と同じロジック） ──
function objectLiteralAfter(source, marker) {
  const markerAt = source.indexOf(marker);
  assert.ok(markerAt >= 0, `${marker} not found`);
  const start = source.indexOf('{', markerAt);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${marker} object did not close`);
}

const literal = objectLiteralAfter(data, 'const AUTUMN_WAR_MVP_LINES =');
const matrix = Function(`"use strict"; return (${literal});`)();

const CONTEXTS = ['gauntlet', 'champion', 'defiant'];
const PERSONALITIES = ['normal', 'bold', 'quiet', 'shy', 'easygoing', 'earnest', 'emotional'];
const ARCHETYPES = ['standard', 'composed', 'ojousama', 'polite', 'seductive', 'delinquent', 'cool'];
const ALLOWED_PLACEHOLDERS = ['{wins}', '{org}'];

let totalLines = 0;
const allLines = [];

// 1. 3 context が揃っている
(function test1_contextsComplete() {
  assert.deepStrictEqual(Object.keys(matrix).sort(), [...CONTEXTS].sort(),
    'All 3 contexts must be present');
  console.log('  [1] 3 contexts present: OK');
})();

// 2. 各contextに7 archetypeが揃っている（2026-08-01 の軸入れ替えで第一分岐がアーキタイプに）
(function test2_archetypesComplete() {
  CONTEXTS.forEach(c => {
    const keys = Object.keys(matrix[c]).sort();
    assert.deepStrictEqual(keys, [...ARCHETYPES].sort(),
      `${c}: must have all 7 archetypes, got: ${keys}`);
  });
  console.log('  [2] 7 archetypes per context: OK');
})();

// 3. 各archetypeに7 personalityが揃っている
(function test3_personalitiesComplete() {
  CONTEXTS.forEach(c => {
    ARCHETYPES.forEach(a => {
      const keys = Object.keys(matrix[c][a]).sort();
      assert.deepStrictEqual(keys, [...PERSONALITIES].sort(),
        `${c}.${a}: must have all 7 personalities, got: ${keys}`);
    });
  });
  console.log('  [3] 7 personalities per archetype: OK');
})();

// 4. 全147セルが配列で、各2本以上ある
(function test4_cellsAreArraysWithMinLines() {
  let cells = 0;
  CONTEXTS.forEach(c => {
    PERSONALITIES.forEach(p => {
      ARCHETYPES.forEach(a => {
        const arr = matrix[c][a][p];
        assert.ok(Array.isArray(arr), `${c}.${a}.${p} must be an array`);
        assert.ok(arr.length >= 2, `${c}.${a}.${p} must have >= 2 lines, got ${arr.length}`);
        cells++;
      });
    });
  });
  assert.strictEqual(cells, 147, `Expected 147 cells, got ${cells}`);
  console.log('  [4] 147 cells, all arrays with >= 2 lines: OK');
})();

// 5. 全台詞がstringで、trim後に空でない
(function test5_allStringsNonEmpty() {
  CONTEXTS.forEach(c => {
    PERSONALITIES.forEach(p => {
      ARCHETYPES.forEach(a => {
        matrix[c][a][p].forEach((line, i) => {
          assert.strictEqual(typeof line, 'string', `${c}.${p}.${a}[${i}] must be string`);
          assert.ok(line.trim().length > 0, `${c}.${p}.${a}[${i}] must not be empty after trim`);
          totalLines++;
          allLines.push({ line, path: `${c}.${p}.${a}[${i}]` });
        });
      });
    });
  });
  console.log(`  [5] All lines are non-empty strings: OK (${totalLines} total)`);
})();

// 6. 長さが12〜90文字の安全域に収まる
(function test6_lengthBounds() {
  allLines.forEach(({ line, path: p }) => {
    const len = line.length;
    assert.ok(len >= 12 && len <= 90,
      `${p} length ${len} out of [12,90]: "${line}"`);
  });
  console.log('  [6] All lines within 12-90 chars: OK');
})();

// 7. 許可外プレースホルダーがない
(function test7_noIllegalPlaceholders() {
  const placeholderRe = /\{[^}]+\}/g;
  allLines.forEach(({ line, path: p }) => {
    const matches = line.match(placeholderRe) || [];
    matches.forEach(m => {
      assert.ok(ALLOWED_PLACEHOLDERS.includes(m),
        `${p}: illegal placeholder "${m}" in "${line}"`);
    });
  });
  console.log('  [7] No illegal placeholders: OK');
})();

// 8. ASCII `...` がない
(function test8_noAsciiEllipsis() {
  allLines.forEach(({ line, path: p }) => {
    assert.ok(!/\.{3}/.test(line),
      `${p}: ASCII ellipsis found in "${line}"`);
  });
  console.log('  [8] No ASCII ellipsis: OK');
})();

// 9. 全台詞の完全一致重複がない
(function test9_noDuplicates() {
  const seen = new Map();
  allLines.forEach(({ line, path: p }) => {
    assert.ok(!seen.has(line),
      `Duplicate line found at ${p} and ${seen.get(line)}: "${line}"`);
    seen.set(line, p);
  });
  console.log('  [9] No duplicate lines: OK');
})();

// 10. 合計294本以上ある
(function test10_totalMinimum() {
  assert.ok(totalLines >= 294,
    `Total lines must be >= 294, got ${totalLines}`);
  console.log(`  [10] Total lines: ${totalLines} (>= 294): OK`);
})();

console.log(`\nautumn-war-mvp-lines-test: ALL PASSED (147 cells, ${totalLines} lines)`);
