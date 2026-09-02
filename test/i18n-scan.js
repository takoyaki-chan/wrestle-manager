// i18n棚卸しスキャナ v2: トップレベル宣言でチャンク分割してから走査(desync被害を1区間に限定)
// カテゴリ別ロールアップ付き
const fs = require('fs');
const path = require('path');
const JA = /[぀-ヿ㐀-鿿豈-﫿ｦ-ﾟ一-鿿]/;

function scanJS(src) {
  const strings = []; const comments = [];
  let i = 0; const n = src.length;
  while (i < n) {
    const c = src[i]; const c2 = src.substr(i, 2);
    if (c2 === '//') { let j = src.indexOf('\n', i); if (j === -1) j = n; comments.push(src.slice(i + 2, j)); i = j; }
    else if (c2 === '/*') { let j = src.indexOf('*/', i + 2); if (j === -1) j = n; else j += 2; comments.push(src.slice(i + 2, j - 2)); i = j; }
    else if (c === "'" || c === '"') {
      const q = c; let j = i + 1; let buf = '';
      while (j < n) { if (src[j] === '\\') { buf += src[j+1]||''; j += 2; continue; } if (src[j] === q || src[j] === '\n') break; buf += src[j]; j++; }
      strings.push(buf); i = j + 1;
    } else if (c === '`') {
      let j = i + 1; let buf = '';
      while (j < n) {
        if (src[j] === '\\') { buf += src[j+1]||''; j += 2; continue; }
        if (src[j] === '`') break;
        if (src.substr(j, 2) === '${') {
          let depth = 1; j += 2;
          while (j < n && depth > 0) {
            if (src[j] === '{') depth++;
            else if (src[j] === '}') depth--;
            else if (src[j] === "'" || src[j] === '"' || src[j] === '`') {
              const qq = src[j]; j++;
              while (j < n && src[j] !== qq) { if (src[j] === '\\') j++; j++; }
            }
            j++;
          }
          buf += ' '; continue;
        }
        buf += src[j]; j++;
      }
      strings.push(buf); i = j + 1;
    } else i++;
  }
  return { strings, comments };
}

function jaLen(s) { let c = 0; for (const ch of s) if (JA.test(ch)) c++; return c; }
function analyze(strings) {
  const ja = strings.filter(s => JA.test(s));
  return { jaCount: ja.length, jaChars: ja.reduce((a, s) => a + jaLen(s), 0) };
}

// チャンク分割: 列0から始まる宣言的な行を境界にする
function chunkScan(src) {
  const lines = src.split('\n');
  const bounds = [0];
  for (let li = 1; li < lines.length; li++) {
    if (/^(?:const|let|var|function|class|window\.|if\s*\(|\/\/|\})/.test(lines[li])) bounds.push(li);
  }
  bounds.push(lines.length);
  const all = { strings: [], comments: [] };
  for (let bi = 0; bi < bounds.length - 1; bi++) {
    const chunk = lines.slice(bounds[bi], bounds[bi + 1]).join('\n');
    const r = scanJS(chunk);
    all.strings.push(...r.strings); all.comments.push(...r.comments);
  }
  return all;
}

function scanHTML(src) {
  const out = { strings: [], comments: [], markupJaChars: 0 };
  let html = src.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (m, body) => {
    const r = chunkScan(body);
    out.strings.push(...r.strings); out.comments.push(...r.comments);
    return '';
  });
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  const text = html.replace(/<[^>]+>/g, '\n');
  for (const line of text.split('\n')) { const t = line.trim(); if (t && JA.test(t)) out.markupJaChars += jaLen(t); }
  return out;
}

// data.js セクション → カテゴリ
function dataSectionCategory(name) {
  if (/PROFILES/.test(name)) return 'プロフィール';
  if (/TEMPLATE|TICKER|_TEXTS|SNAPSHOT|HEADLINE|BYLINE/.test(name)) return '記事・テンプレ';
  if (/LINES|DIALOGUE|REACTION|VOICE|QUOTE|DRAMA/.test(name)) return 'セリフ';
  return 'データ・その他';
}

const FILE_CATEGORY = {
  'kuroda-text.js': '記事・テンプレ',
  'victory-lines.js': 'セリフ', 'tenchosen-final-lines.js': 'セリフ', 'coach-lines.js': 'セリフ',
  'tag-battle-lines.js': 'セリフ', 'flag-dialogue.js': 'セリフ', 'data-faction-dialogue.js': 'セリフ',
  'battle-lines.js': 'セリフ', 'ppv-lines.js': 'セリフ',
  'battle-engine-main.js': '観戦モードUI・実況', 'tag-battle-main.js': '観戦モードUI・実況',
  'battle-engine.html': '観戦モードUI・実況', 'tag-battle.html': '観戦モードUI・実況',
  'battle-anim.js': '観戦モードUI・実況', 'battle-sfx.js': '観戦モードUI・実況', 'battle-replay-core.js': '観戦モードUI・実況',
  'ui-common.js': 'UI・システム', 'ui-render.js': 'UI・システム', 'app.js': 'UI・システム',
  'index.html': 'UI・システム', 'factions.js': 'UI・システム', 'management.js': 'エンジン内文字列',
  'match-engine.js': 'エンジン内文字列', 'relationships.js': 'エンジン内文字列',
  'draft-negotiation.js': 'UI・システム', 'flight-recorder.js': '開発用(対象外)',
  'dev-tools.js': '開発用(対象外)', 'dev-event-catalog.js': '開発用(対象外)',
};

// i18n-ratchet.js(test/i18n-ratchet.js)から流用するための計測本体。
// CLI出力(console.log)を一切含まない純粋な集計関数にしてあるので、
// このファイルを require() すれば計測ロジックを再実装せずに使い回せる。
// 走査対象から外すファイル。
// lang-en.js は test/i18n-build-dict.js が i18n/ui-ledger.json から生成するEN辞書で、
// 中の日本語は「翻訳キー(原文)」であって移行すべき直書き文字列ではない。
// 本スキャナが数えているのは「t()を経由していない生の日本語リテラル本数」なので、
// 辞書のキーを混ぜるとラチェット(test/i18n-ratchet.js)が翻訳を進めるたびに増加で落ちる。
// 翻訳の進捗そのものは i18n/ui-ledger.json の en 列充填数で測るため、ここでは対象外にする。
const EXCLUDED_FILES = new Set(['lang-en.js']);

function scanDir(srcDir) {
  const files = fs.readdirSync(srcDir).filter(f => /\.(js|html)$/.test(f) && !EXCLUDED_FILES.has(f));
  const perFile = [];
  const categories = {};
  function addCat(cat, a) {
    if (!categories[cat]) categories[cat] = { jaCount: 0, jaChars: 0 };
    categories[cat].jaCount += a.jaCount; categories[cat].jaChars += a.jaChars;
  }

  for (const f of files) {
    const src = fs.readFileSync(path.join(srcDir, f), 'utf8');
    let a, markup = 0;
    if (f.endsWith('.html')) {
      const h = scanHTML(src);
      a = analyze(h.strings); markup = h.markupJaChars;
      a.jaChars += markup; a.jaCount += markup > 0 ? 1 : 0;
    } else if (f === 'data.js') {
      // セクション単位でカテゴリ集計
      const lines = src.split('\n');
      const secs = [];
      for (let li = 0; li < lines.length; li++) {
        const m = lines[li].match(/^(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/);
        if (m) secs.push({ name: m[1], start: li });
      }
      secs.push({ name: '(EOF)', start: lines.length });
      a = { jaCount: 0, jaChars: 0 };
      for (let si = 0; si < secs.length - 1; si++) {
        const chunk = lines.slice(secs[si].start, secs[si + 1].start).join('\n');
        const r = chunkScan(chunk);
        const sa = analyze(r.strings);
        a.jaCount += sa.jaCount; a.jaChars += sa.jaChars;
        addCat('data.js:' + dataSectionCategory(secs[si].name), sa);
      }
      perFile.push({ file: f, ...a });
      continue;
    } else {
      const r = chunkScan(src);
      a = analyze(r.strings);
    }
    perFile.push({ file: f, ...a });
    addCat(FILE_CATEGORY[f] || '未分類:' + f, a);
  }

  perFile.sort((x, y) => y.jaChars - x.jaChars);
  return { perFile, categories };
}

function printReport(srcDir) {
  const { perFile, categories } = scanDir(srcDir);

  console.log('=== ファイル別 (JA文字列本数 / JA文字数) ===');
  let tCount = 0, tChars = 0;
  for (const r of perFile) {
    if (!r.jaCount) continue;
    console.log(r.file.padEnd(28), String(r.jaCount).padStart(7), String(r.jaChars).padStart(9));
    tCount += r.jaCount; tChars += r.jaChars;
  }
  console.log('TOTAL'.padEnd(28), String(tCount).padStart(7), String(tChars).padStart(9));

  console.log('\n=== カテゴリ別集計 (JA文字列本数 / JA文字数) ===');
  const cats = Object.entries(categories).sort((x, y) => y[1].jaChars - x[1].jaChars);
  for (const [name, v] of cats) {
    console.log(name.padEnd(32), String(v.jaCount).padStart(7), String(v.jaChars).padStart(9));
  }
}

module.exports = { scanDir };

// CLIとして直接実行された場合だけ従来どおりレポートを標準出力に書く
// (require() されたときは何も出力しない)。
if (require.main === module) {
  printReport(process.argv[2] || 'src');
}
