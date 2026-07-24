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
//   - Recognizes the direct VAR.indexOf('literal') idiom the same way as .includes().
//   - Recognizes the "section extractor" helper idiom — a local function such as
//     `function section(source, startMarker, endMarker) { const from =
//     source.indexOf(startMarker); ... }` or `function extractFunction(source, signature)`
//     — by inspecting the helper's own body to learn which parameter is the source text
//     and which parameter is the start-marker literal, then checking every CALL SITE's
//     start-marker literal against the resolved source file. Only the start marker is
//     checked (an end marker is frequently the start of the *next* section and checking
//     it would be noisy/redundant); call sites whose source argument isn't a plain
//     identifier already known to be a whole-file read are skipped as ambiguous, same
//     philosophy as the plain includes()/indexOf() checks above.
//   - Best-effort "equality vs. a real file" check: `assert.strictEqual(x, 'LITERAL', ...)`
//     / `assert.equal(x, 'LITERAL', ...)` where LITERAL looks like a file path (starts
//     with '../', or contains '/' and ends in a known asset/source extension) is flagged
//     if no file exists on disk at that resolved path. Anything not clearly path-shaped
//     is skipped, not guessed at.
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

// Find VAR.indexOf('literal' | "literal" | `literal-no-interpolation`) usages — the same
// idiom as findIncludesUsages() but for .indexOf(). This catches the common
// `const xStart = someSource.indexOf('/* a marker comment */');` pattern used to slice
// out a section of a source file without going through a named helper.
function findIndexOfUsages(text) {
  const usages = [];
  const re = /\b(\w+)\.indexOf\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)\s*[),]/g;
  let m;
  while ((m = re.exec(text))) {
    const varName = m[1];
    const rawLiteral = m[2];
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

// ── Section-extractor helper idiom ──────────────────────────────────────────────────
//
// Tests in this suite commonly define a small local helper to slice a named function or
// region out of a source file, e.g.:
//   function section(source, startMarker, endMarker) {
//     const from = source.indexOf(startMarker);
//     const to = source.indexOf(endMarker, from + startMarker.length);
//     return source.slice(from, to);
//   }
//   const playJingle = section(app, 'playJingle(name) {', 'stop() {');
// or a closure-captured variant (`function section(start, end) { ui.indexOf(start) }`),
// or a brace-balancing variant (`function extractFunction(source, signature) {
// source.indexOf(signature) ... }`). In every observed case the helper body contains a
// call shaped like `RECEIVER.indexOf(ARG` where RECEIVER is either one of the helper's
// own parameters (the source text, passed positionally at each call site) or a free
// variable closed over from the outer scope (a fixed source for every call), and ARG is
// one of the helper's own parameters (the start-marker literal, passed positionally).

// Find the matching '}' for a '{' at braceStart, respecting string/template literals so
// braces inside string content don't throw off the depth count. Returns the body text
// (without the surrounding braces) or null if unbalanced.
function extractBraceBody(text, braceStart) {
  let depth = 0;
  let inStr = null;
  for (let i = braceStart; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(braceStart + 1, i);
    }
  }
  return null;
}

// Split a call's argument list into raw text fragments, respecting nested parens and
// string/template literals (call-site literals in this suite routinely contain their own
// parens, e.g. section(app, 'playJingle(name) {', 'stop() {')). `openIdx` must point at
// the '(' that opens the call. Returns { args, endIdx } where endIdx is the matching ')'
// index, or endIdx: -1 if unbalanced.
function extractCallArgs(text, openIdx) {
  let depth = 0;
  let inStr = null;
  let cur = '';
  const args = [];
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      cur += ch;
      if (ch === '\\') { i++; cur += text[i] || ''; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; cur += ch; continue; }
    if (ch === '(') { depth++; if (depth === 1) continue; cur += ch; continue; }
    if (ch === ')') {
      depth--;
      if (depth === 0) { if (cur.trim() !== '' || args.length > 0) args.push(cur); return { args, endIdx: i }; }
      cur += ch; continue;
    }
    if (ch === ',' && depth === 1) { args.push(cur); cur = ''; continue; }
    cur += ch;
  }
  return { args, endIdx: -1 };
}

// Discover local "section extractor" helper functions and, for each, which parameter is
// the source text and which parameter is the start-marker literal. Best-effort: only
// recognizes plain `function NAME(a, b, c) { ... }` declarations with simple identifier
// parameters (every helper actually used in this suite is shaped this way).
function findExtractorHelpers(text) {
  const helpers = new Map();
  const declRe = /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
  let m;
  while ((m = declRe.exec(text))) {
    const name = m[1];
    const paramNames = m[2].split(',').map(s => s.trim()).filter(Boolean);
    if (paramNames.some(p => !/^\w+$/.test(p))) continue; // destructuring/defaults — skip
    const braceStart = m.index + m[0].length - 1;
    const body = extractBraceBody(text, braceStart);
    if (!body) continue;

    const idxCallRe = /(\w+)\.indexOf\(\s*(\w+)\s*[,)]/g;
    let im;
    let sourceIdent = null;
    let markerParamIndex = null;
    while ((im = idxCallRe.exec(body))) {
      const receiver = im[1];
      const argName = im[2];
      if (sourceIdent === null) sourceIdent = receiver;
      if (markerParamIndex === null && paramNames.includes(argName)) {
        markerParamIndex = paramNames.indexOf(argName);
      }
    }
    if (sourceIdent === null || markerParamIndex === null) continue; // doesn't fit the idiom

    const sourceParamIndex = paramNames.indexOf(sourceIdent);
    helpers.set(name, {
      sourceParamIndex: sourceParamIndex >= 0 ? sourceParamIndex : null,
      sourceClosureVar: sourceParamIndex >= 0 ? null : sourceIdent,
      markerParamIndex,
    });
  }
  return helpers;
}

const PLAIN_STRING_LITERAL_RE = /^'(?:[^'\\]|\\.)*'$|^"(?:[^"\\]|\\.)*"$|^`(?:[^`\\]|\\.)*`$/;

function parsePlainStringLiteral(argText) {
  const t = argText.trim();
  if (!PLAIN_STRING_LITERAL_RE.test(t)) return null;
  const quote = t[0];
  const inner = t.slice(1, -1);
  if (quote === '`' && /\$\{/.test(inner)) return null; // interpolated — not resolvable
  return unescapeJsString(inner);
}

// Find every call site of a discovered extractor helper (excluding its own declaration)
// and return { relPath, literal, resolvable } entries for its start-marker argument, in
// the same shape lintFile()'s main loop expects. `varMap` is the whole-file-read map from
// findSourceVarMap() — call sites whose source argument isn't a plain identifier already
// in that map are marked unresolvable (skipped), same conservative stance as the other
// idioms here: a chained/derived source variable (a section sliced from another section)
// is intentionally not traced further.
function findSectionCallUsages(text, varMap, helpers) {
  const usages = [];
  for (const [name, helper] of helpers) {
    const callRe = new RegExp(`\\b${name}\\s*\\(`, 'g');
    let m;
    while ((m = callRe.exec(text))) {
      const before = text.slice(0, m.index).replace(/\s+$/, '');
      if (before.endsWith('function')) continue; // this is the declaration, not a call
      const openIdx = m.index + m[0].length - 1;
      const { args, endIdx } = extractCallArgs(text, openIdx);
      if (endIdx === -1) continue;
      callRe.lastIndex = endIdx; // resume scanning after this call

      let relPath = null;
      if (helper.sourceParamIndex !== null) {
        const raw = (args[helper.sourceParamIndex] || '').trim();
        if (/^\w+$/.test(raw) && varMap.has(raw)) relPath = varMap.get(raw);
      } else if (helper.sourceClosureVar && varMap.has(helper.sourceClosureVar)) {
        relPath = varMap.get(helper.sourceClosureVar);
      }
      if (!relPath) { usages.push({ relPath: null, literal: null, resolvable: false }); continue; }

      const markerArg = args[helper.markerParamIndex];
      const literal = markerArg !== undefined ? parsePlainStringLiteral(markerArg) : null;
      if (literal === null) { usages.push({ relPath: null, literal: null, resolvable: false }); continue; }

      usages.push({ relPath, literal, resolvable: true });
    }
  }
  return usages;
}

// ── Equality-vs-source idiom (conservative) ─────────────────────────────────────────
//
// assert.strictEqual(x, 'LITERAL', msg) / assert.equal(x, 'LITERAL', msg) where LITERAL
// is a file path is a different failure mode than the includes()/indexOf() text-search
// idioms above: the literal isn't searched for inside a source file, it's compared for
// exact equality against some runtime value (often itself extracted from source text via
// one of the idioms above). We can't generally know what that runtime value SHOULD be,
// but when the literal looks like a path we CAN check whether it points at a file that
// still exists — a dangling path is unambiguous staleness regardless of what the test
// meant to compare it to. Anything not clearly path-shaped is left alone.
function isPathLikeLiteral(lit) {
  if (!lit || /\s/.test(lit)) return false; // paths in this codebase never contain spaces
  if (lit.startsWith('../')) return true;
  if (lit.includes('/') && /\.(json|mp3|ogg|wav|png|jpg|jpeg|gif|html|js|css)$/i.test(lit)) return true;
  return false;
}

// Resolve a path-like literal to a path relative to the repo root. Literals in this
// codebase are authored relative to src/ (e.g. '../bgm/foo.mp3' from inside src/app.js),
// so leading '../' segments are stripped rather than walked — that lands on the intended
// repo-root-relative path ('bgm/foo.mp3') without needing to know the literal's authoring
// file's own location.
function resolvePathLiteralToRepoRoot(lit) {
  let rest = lit;
  while (rest.startsWith('../')) rest = rest.slice(3);
  return rest.replace(/^\.?\//, '');
}

function findEqualityPathUsages(text) {
  const findings = []; // { literal, resolvable }
  const callRe = /\bassert\.(strictEqual|equal)\s*\(/g;
  let m;
  while ((m = callRe.exec(text))) {
    const openIdx = m.index + m[0].length - 1;
    const { args, endIdx } = extractCallArgs(text, openIdx);
    if (endIdx === -1) continue;
    callRe.lastIndex = endIdx;
    if (args.length < 2) continue;
    const literal = parsePlainStringLiteral(args[1]);
    if (literal === null) continue; // second arg isn't a plain literal — not our concern
    if (!isPathLikeLiteral(literal)) continue; // not path-shaped — skip, don't guess
    findings.push({ literal });
  }
  return findings;
}

function truncate(str, n) {
  const oneLine = str.replace(/\n/g, '\\n');
  return oneLine.length > n ? oneLine.slice(0, n) + '…' : oneLine;
}

function lintFile(file) {
  const text = fs.readFileSync(path.join(testDir, file), 'utf8').replace(/\r\n/g, '\n');
  const varMap = findSourceVarMap(text);
  const sourceCache = new Map();

  function readCached(relPath) {
    let sourceText = sourceCache.get(relPath);
    if (sourceText === undefined) {
      try {
        sourceText = readSource(relPath);
      } catch (e) {
        sourceText = null; // file doesn't exist at that resolved path — can't verify
      }
      sourceCache.set(relPath, sourceText);
    }
    return sourceText;
  }

  const stale = [];
  let skipped = 0;
  let checked = 0;

  // Idiom 1: VAR.includes('literal') / VAR.indexOf('literal') for whole-file-read vars.
  const directUsages = [...findIncludesUsages(text), ...findIndexOfUsages(text)];
  for (const usage of directUsages) {
    if (!varMap.has(usage.varName)) continue; // not a source-file variable, ignore
    if (!usage.resolvable) { skipped++; continue; }
    const relPath = varMap.get(usage.varName);
    if (!relPath) { skipped++; continue; }

    const sourceText = readCached(relPath);
    if (sourceText === null) { skipped++; continue; }
    checked++;

    const normalizedLiteral = usage.literal.replace(/\r/g, '');
    if (!sourceText.includes(normalizedLiteral)) {
      stale.push({ testFile: file, sourceFile: relPath, literal: usage.literal, idiom: 'text-search' });
    }
  }

  // Idiom 2: section(source, 'START_MARKER', 'END_MARKER') / extractFunction(source, 'sig')
  // style helpers — check the start-marker literal at each call site.
  const helpers = findExtractorHelpers(text);
  const sectionUsages = findSectionCallUsages(text, varMap, helpers);
  for (const usage of sectionUsages) {
    if (!usage.resolvable) { skipped++; continue; }
    const sourceText = readCached(usage.relPath);
    if (sourceText === null) { skipped++; continue; }
    checked++;

    const normalizedLiteral = usage.literal.replace(/\r/g, '');
    if (!sourceText.includes(normalizedLiteral)) {
      stale.push({ testFile: file, sourceFile: usage.relPath, literal: usage.literal, idiom: 'section-marker' });
    }
  }

  // Idiom 3: assert.strictEqual(x, 'path/like/literal') — flag only if the file is gone.
  const equalityUsages = findEqualityPathUsages(text);
  for (const usage of equalityUsages) {
    checked++;
    const relPath = resolvePathLiteralToRepoRoot(usage.literal);
    const exists = fs.existsSync(path.join(repoRoot, relPath));
    if (!exists) {
      stale.push({ testFile: file, sourceFile: relPath, literal: usage.literal, idiom: 'equality-path' });
    }
  }

  return { stale, skipped, checked };
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
        const verb = s.idiom === 'equality-path' ? 'expects file' : 'expects string';
        const where = s.idiom === 'equality-path' ? 'at' : 'in';
        report.push(`${s.testFile} [${s.idiom}]: ${verb} "${truncate(s.literal, 70)}" ${where} ${s.sourceFile} — NOT FOUND`);
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
