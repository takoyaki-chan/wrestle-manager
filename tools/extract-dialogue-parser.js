'use strict';
// Core source parser shared by tools/extract-dialogue.js.
//
// Finds top-level data declarations in a JS source file:
//   1) `const/let/var NAME = {...}` or `= [...]`
//   2) `path.to.existing = {...}` / `= [...]` / `= (()=>{...})()`
//      (dotted-path property assignment that EXTENDS an already-declared
//      object — this codebase does this a lot, e.g. `Engine.newspaper = {...}`
//      appended after the main `const Engine = {...}` literal, or
//      `GLIMPSE_A_LINES.bond_60_up = {...}` appended after its own declaration)
//
// Both forms are found via a single regex anchored at column 0 (this
// codebase never indents top-level statements), then the RHS expression is
// isolated with a bracket/string/template-literal/comment-aware scanner so
// that braces inside strings, comments, or `${...}` template expressions
// don't throw off the boundary detection.

function findTopLevelDeclarations(src) {
  const results = [];
  const declRe = /^(?:(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)|([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)+))\s*=\s*(?!=)/gm;
  let m;
  while ((m = declRe.exec(src))) {
    const name = m[1] || m[2];
    const isAssignment = !m[1];
    const exprStart = declRe.lastIndex;
    const startChar = src[exprStart];
    // Only capture literal object/array declarations, or (for the
    // assignment form) IIFE-style `= (() => {...})()` expressions.
    if (startChar !== '{' && startChar !== '[' && !(isAssignment && startChar === '(')) continue;
    const startLine = src.slice(0, m.index).split('\n').length;
    const end = scanExpr(src, exprStart);
    if (end == null) {
      results.push({ name, error: 'unterminated', startLine });
      continue;
    }
    const exprText = src.slice(exprStart, end);
    results.push({ name, exprText, startLine, endIndex: end, isAssignment });
    declRe.lastIndex = end;
  }
  return results;
}

// Scans starting at index i (pointing at `{`, `[`, or `(`) and returns the
// index just past the matching close bracket. Understands single/double
// quoted strings, template literals (with nested `${...}` expressions),
// and line/block comments so brace-like characters inside them don't
// perturb the bracket-depth stack.
function scanExpr(src, i) {
  const stack = [];
  const n = src.length;
  while (i < n) {
    const top = stack.length ? stack[stack.length - 1] : null;
    if (top === 'TEMPLATE') {
      const c = src[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); i++; continue; }
      if (c === '$' && src[i + 1] === '{') { stack.push('DOLLARBRACE'); i += 2; continue; }
      i++;
      continue;
    }
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      if (nl === -1) return null;
      i = nl;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      if (close === -1) return null;
      i = close + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = c;
      i++;
      while (i < n && src[i] !== quote) {
        if (src[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    if (c === '`') { stack.push('TEMPLATE'); i++; continue; }
    if (c === '{') { stack.push('OBJ'); i++; continue; }
    if (c === '[') { stack.push('ARR'); i++; continue; }
    if (c === '(') { stack.push('PAREN'); i++; continue; }
    if (c === '}') {
      if (top === 'DOLLARBRACE' || top === 'OBJ') stack.pop();
      i++;
      if (stack.length === 0) return i;
      continue;
    }
    if (c === ']') {
      if (top === 'ARR') stack.pop();
      i++;
      if (stack.length === 0) return i;
      continue;
    }
    if (c === ')') {
      if (top === 'PAREN') stack.pop();
      i++;
      if (stack.length === 0) return i;
      continue;
    }
    i++;
  }
  return null;
}

module.exports = { findTopLevelDeclarations, scanExpr };
