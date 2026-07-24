'use strict';

// test/stale-lint.js — staleness linter
//
// The #1 way this suite rots: a test reads a source file as raw text and then asserts
// `sourceVar.includes('some literal that used to be in the code')`. When the code is
// correctly refactored, renamed, or reformatted, the literal silently stops matching
// and the test starts failing for a reason that has nothing to do with a real bug.
//
// This script does NOT run tests. It statically scans every test/*-test.js file for
// that idiom, resolves (sourceFile, literal) pairs where it can, and reports any pair
// where the literal is no longer found in the current source file. That turns "test
// quietly rotted" into a visible, actionable list instead of a mystery failure months
// later.
//
// Heuristic scope (documented, not exhaustive):
//   - Recognizes source reads via: readSource(...), fs.readFileSync(path.join(...), 'utf8'),
//     and simple local `read(...)`-style helper wrappers around either of those.
//   - Recognizes usages of VAR.includes('literal'), VAR.includes("literal"), and
//     VAR.includes(`literal`) (backtick only when it contains no ${...} interpolation).
//   - Literals with string-concatenation or interpolation are NOT statically resolvable
//     and are skipped (counted, not silently dropped).
//
// Exit code: 0 always, unless --strict is passed, in which case it's non-zero when any
// stale assertion is found (useful for a stricter CI gate later).

const fs = require('fs');
const path = require('path');
const { repoRoot, readSource } = require('./helpers/source');

const testDir = __dirname;

function discoverTestFiles() {
  return fs.readdirSync(testDir)
    .filter(name => name.endsWith('-test.js'))
    .sort();
}

// Unescape the common JS string-escape sequences we expect to see in test literals.
// Heuristic — good enough for the literals actually used in this codebase's tests.
function unescapeJsString(raw) {
  return raw.replace(/\\(.)/g, (m, ch) => {
    switch (ch) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '\\': return '\\';
      case "'": return "'";
      case '"': return '"';
      case '`': return '`';
      default: return ch; // best-effort: drop the backslash for anything else
    }
  });
}

// Extract quoted string literals from an expression fragment, in order.
// Skips common non-path noise ('utf8', 'utf-8', '..').
function extractPathLiterals(exprText) {
  const literals = [];
  const re = /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let m;
  while ((m = re.exec(exprText))) {
    const val = unescapeJsString(m[1] !== undefined ? m[1] : m[2]);
    if (val === 'utf8' || val === 'utf-8' || val === '..' || val === '.') continue;
    literals.push(val);
  }
  return literals;
}

function resolveRelPath(literals) {
  if (literals.length === 0) return null;
  // Segments may already contain '/', e.g. 'src/data.js' as a single literal, or be
  // split across several args, e.g. 'src', 'app.js'. Join with '/' either way.
  return literals.join('/').replace(/\/+/g, '/');
}

// Find local helper functions that are themselves thin wrappers around a source read,
// e.g. `const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');`
// or   `const read = file => fs.readFileSync(path.join(root, file), 'utf8')...;`
// We only need the helper NAME — we resolve literal args at each call site, not here.
function findReadHelperNames(text) {
  const names = new Set();
  const re = /(?:const|let)\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*fs\.readFileSync/g;
  let m;
  while ((m = re.exec(text))) names.add(m[1]);
  return names;
}

// Find `const VAR = <expr>;` assignments where <expr> reads a source file directly
// (readSource(...) or fs.readFileSync(path.join(...), 'utf8')) or via one of the local
// helper names discovered above. Returns a Map<varName, relPathFromRepoRoot|null>.
function findSourceVarMap(text) {
  const helperNames = findReadHelperNames(text);
  const map = new Map();
  const declRe = /(?:const|let)\s+(\w+)\s*=\s*([^;]+);/g;
  let m;
  while ((m = declRe.exec(text))) {
    const varName = m[1];
    const expr = m[2];
    const callsReadSource = /\breadSource\s*\(/.test(expr);
    const callsReadFileSync = /\bfs\.readFileSync\s*\(/.test(expr);
    const helperMatch = expr.match(/^\s*(\w+)\s*\(/);
    const callsHelper = helperMatch && helperNames.has(helperMatch[1]);
    if (!callsReadSource && !callsReadFileSync && !callsHelper) continue;
    if (helperNames.has(varName)) continue; // this IS a helper definition, not a source var
    const literals = extractPathLiterals(expr);
    const relPath = resolveRelPath(literals);
    map.set(varName, relPath);
  }
  return map;
}

// Find VAR.includes('literal' | "literal" | `literal-no-interpolation`) usages anywhere
// in the file text. Returns [{ varName, literal, resolvable }].
function findIncludesUsages(text) {
  const usages = [];
  const re = /(!\s*)?\b(\w+)\.includes\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)\s*[),]/g;
  let m;
  while ((m = re.exec(text))) {
    const negated = !!m[1];
    const varName = m[2];
    const rawLiteral = m[3];
    if (negated) {
      // `!VAR.includes('X')` asserts X is ABSENT — the intended, passing state after a
      // refactor removes dead code. "Literal not found" is success here, not staleness,
      // so this idiom is out of scope for this linter (a different check would be needed
      // to catch a negated assertion whose literal reappeared). Skip, don't flag.
      usages.push({ varName, literal: null, resolvable: false });
      continue;
    }
    const quote = rawLiteral[0];
    const inner = rawLiteral.slice(1, -1);
    if (quote === '`' && /\$\{/.test(inner)) {
      usages.push({ varName, literal: null, resolvable: false });
      continue;
    }
    usages.push({ varName, literal: unescapeJsString(inner), resolvable: true });
  }
  return usages;
}

function truncate(str, n) {
  const oneLine = str.replace(/\n/g, '\\n');
  return oneLine.length > n ? oneLine.slice(0, n) + '…' : oneLine;
}

function lintFile(file) {
  const text = fs.readFileSync(path.join(testDir, file), 'utf8').replace(/\r\n/g, '\n');
  const varMap = findSourceVarMap(text);
  const usages = findIncludesUsages(text);

  const stale = [];
  let skipped = 0;
  const sourceCache = new Map();

  for (const usage of usages) {
    if (!varMap.has(usage.varName)) continue; // not a source-file variable, ignore
    if (!usage.resolvable) { skipped++; continue; }
    const relPath = varMap.get(usage.varName);
    if (!relPath) { skipped++; continue; }

    let sourceText = sourceCache.get(relPath);
    if (sourceText === undefined) {
      try {
        sourceText = readSource(relPath);
      } catch (e) {
        sourceText = null; // file doesn't exist at that resolved path — can't verify
      }
      sourceCache.set(relPath, sourceText);
    }
    if (sourceText === null) { skipped++; continue; }

    const normalizedLiteral = usage.literal.replace(/\r/g, '');
    if (!sourceText.includes(normalizedLiteral)) {
      stale.push({ testFile: file, sourceFile: relPath, literal: usage.literal });
    }
  }

  return { stale, skipped, checked: usages.length - skipped };
}

function main() {
  const strict = process.argv.includes('--strict');
  const files = discoverTestFiles();

  let totalStale = 0;
  let totalSkipped = 0;
  let totalChecked = 0;
  const filesWithStale = new Set();
  const report = [];

  for (const file of files) {
    const { stale, skipped, checked } = lintFile(file);
    totalSkipped += skipped;
    totalChecked += checked;
    if (stale.length) {
      filesWithStale.add(file);
      totalStale += stale.length;
      for (const s of stale) {
        report.push(`${s.testFile}: expects string "${truncate(s.literal, 70)}" in ${s.sourceFile} — NOT FOUND`);
      }
    }
  }

  console.log(`Scanned ${files.length} test files, ${totalChecked} resolvable source-string assertions checked, ${totalSkipped} skipped (interpolated/unresolvable).\n`);

  if (report.length === 0) {
    console.log('no stale source-string assertions found.');
  } else {
    console.log(`${totalStale} stale assertion${totalStale === 1 ? '' : 's'} across ${filesWithStale.size} test file${filesWithStale.size === 1 ? '' : 's'}:\n`);
    for (const line of report) console.log('  ' + line);
  }

  if (strict && report.length > 0) process.exit(1);
  process.exit(0);
}

main();
