'use strict';
// 「値がちょうど0のとき、既定値(50など)として扱ってしまう」型の再発防止ガード。
//
// 背景: `f.trust || 50` は信頼が0のとき「値なし」と読み違え、50に戻す。
//   K-9(A)(2026-09-25)で AI団体の人気 `orgPop || 50` を `?? 50` に直し、
//   2026-09-26 に残り(信頼・絆・控室の士気・体調・人気など 117か所)をまとめて直した。
//   実測(auto-sim 40季 seed42): 絆0は関係値の約1%、信頼0・士気0も実際に起きる。
//   オフの信頼の自然変動では、信頼0の選手が翌季の頭に50前後へ戻っていた。
//
// 守るもの:
//   src/ の実行コードで、下の項目名で終わる式に `|| <0以外の数>` を付けない。
//   欠損だけを補うなら `?? 50`、NaNも弾くなら `Number.isFinite(v) ? v : 50`。
//   `|| 0` は0を0にするだけなので許可。コメント内の記述は対象外。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

// 0 が正当な値になりうる(またはそうなりうる同型の)項目。式の末尾の名前で判定する
// (f.trust / G.relationships[k]?.bond / G.orgPop[id] / link.bondAB / 裸の変数 trust など)。
const FIELDS = new Set([
  'trust', 'bond', 'bondAB', 'bondBA', 'rivalry', 'rivAB', 'rivBA',
  'lockerRoomMorale', 'condition', 'popularity', 'heat', 'morale', 'orgPop',
]);

// `||` の左オペランド(メンバー式の連鎖)を後ろ向きに切り出す。括弧・添字・呼び出しは丸ごと飛ばす。
function leftOperand(text, idx) {
  let i = idx - 1;
  while (i >= 0 && /\s/.test(text[i])) i--;
  const end = i + 1;
  while (i >= 0) {
    const c = text[i];
    if (c === ')' || c === ']') {
      const open = c === ')' ? '(' : '[';
      let depth = 0;
      for (; i >= 0; i--) {
        if (text[i] === c) depth++;
        else if (text[i] === open) { depth--; if (depth === 0) break; }
      }
      i--;
      continue;
    }
    if (/[A-Za-z0-9_$.?'"]/.test(c)) {
      if (c === '?' && text[i + 1] !== '.') break; // 三項演算子の ? で止める(?. は連鎖の一部)
      i--;
      continue;
    }
    break;
  }
  return text.slice(i + 1, end);
}

// 連鎖の末尾の名前(括弧・添字の外側にある最後の識別子。['key'] 形式の添字は名前として扱う)
function tailName(expr) {
  let out = '';
  let depth = 0;
  for (let k = 0; k < expr.length; k++) {
    const c = expr[k];
    if (c === '(' || c === '[') {
      if (depth === 0 && c === '[') {
        const m = /^\[\s*['"]([A-Za-z_$][\w$]*)['"]\s*\]/.exec(expr.slice(k));
        if (m) { out += '.' + m[1]; k += m[0].length - 1; continue; }
      }
      if (depth === 0) out += ' ';
      depth++;
      continue;
    }
    if (c === ')' || c === ']') { depth--; continue; }
    if (depth === 0) out += c;
  }
  const names = out.split(/[^A-Za-z0-9_$]+/).filter(Boolean);
  return names[names.length - 1] || '';
}

// その位置が行コメント(// …)またはブロックコメントの行(/* … / * …)の中か。
// 文字列中の "://"(URL)は行コメントとみなさない。
function inComment(lineText, col) {
  const trimmed = lineText.trimStart();
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return true;
  const before = lineText.slice(0, col);
  return /(^|[^:])\/\//.test(before);
}

function findOffenders(text, file) {
  const out = [];
  const lines = text.split('\n');
  const lineStarts = [0];
  for (let k = 0; k < text.length; k++) if (text[k] === '\n') lineStarts.push(k + 1);
  const lineOf = pos => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= pos) lo = mid; else hi = mid - 1; }
    return lo;
  };
  const re = /\|\|\s*(-?\d+(?:\.\d+)?)(?![\w.])/g;
  let m;
  while ((m = re.exec(text))) {
    if (Number(m[1]) === 0) continue;
    const field = tailName(leftOperand(text, m.index));
    if (!FIELDS.has(field)) continue;
    const li = lineOf(m.index);
    const lineText = lines[li].replace(/\r$/, '');
    if (inComment(lineText, m.index - lineStarts[li])) continue;
    out.push(`${file}:${li + 1}: ${field} ${m[0]} — ${lineText.trim().slice(0, 120)}`);
  }
  return out;
}

// ── 検出器の自己検査(検出すべきもの/見逃すべきもの) ──────────────────────
const mustCatch = [
  'const t = f.trust || 50;',
  'const b = G.relationships[kAB]?.bond || 50;',
  'x = (s.lockerRoomMorale || 60) + d;',
  'const p = G.orgPop[orgId] || 50;',
  'const c = Math.min(100, (nc.condition || 70) + 8);',
  "const r = rel['rivalry'] || 70;",
  'const d = Math.abs((link.bondAB || 50) - 50);',
  'foo(trust || 50, popularity || 1.5);',
];
mustCatch.forEach(src => {
  assert.ok(findOffenders(src, 'self').length >= 1, `自己検査: 検出すべき式を見逃した: ${src}`);
});
const mustPass = [
  'const t = f.trust ?? 50;',
  'const t = f.trust || 0;',
  'const t = f.trust || 0.0;',
  'const b = (rel && Number.isFinite(rel.bond)) ? rel.bond : 50;',
  'const o = (G.orgPop || {})[id];',
  'const n = f.mn || 50;',
  '// 旧 `f.trust || 50` は0を50に化けさせていた',
  '   * 旧 `bond || 50` の説明',
  "const u = 'https://example.com'; const t = f.trust ?? 50;",
  'const x = calcPop(f.popularity) || 50;',
];
mustPass.forEach(src => {
  assert.deepStrictEqual(findOffenders(src, 'self'), [], `自己検査: 誤検出した: ${src}`);
});

// ── 本番: src/ 全体 ──────────────────────────────────────────────────────
const offenders = [];
for (const file of fs.readdirSync(SRC).filter(f => /\.(js|html)$/.test(f) && !/\.min\.js$/.test(f))) {
  const text = fs.readFileSync(path.join(SRC, file), 'utf8');
  offenders.push(...findOffenders(text, file));
}
assert.deepStrictEqual(offenders, [],
  '0 が正当な値になりうる項目に `|| <0以外の数>` が使われている。0 を既定値に化けさせるので '
  + '`?? <既定値>`(欠損だけ補う)か `Number.isFinite(v) ? v : <既定値>`(NaNも弾く)にする:\n  '
  + offenders.join('\n  '));

console.log(`falsy-zero-default-guard: PASS (${FIELDS.size}項目 / 自己検査 ${mustCatch.length + mustPass.length}件)`);
