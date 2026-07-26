#!/usr/bin/env node
/**
 * index.html + assets/ → 画像を全部埋め込んだ1枚のHTMLにする。
 *
 *   node build-single-file.js
 *   → wrestle-manager-report-2026-07.html  （これ1つをアップすれば表示される）
 *
 * 画像は ffmpeg で webp に縮小・再圧縮してから base64 で埋める。
 * 縮小の指定は下の PROFILE。表示サイズの2倍を目安にしている。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, 'index.html');
const OUT = path.join(__dirname, 'wrestle-manager-report-2026-07.html');
const TMP = path.join(__dirname, '.build-tmp');

// ファイル名パターン → [出力幅, webp品質]。表示サイズの約2倍。
const PROFILE = [
  [/^upper_/,     [256, 72]],  // 表示 最大118px（表紙）
  [/^emblem-/,    [192, 82]],  // 表示 最大78px（天頂戦）
  [/^org-/,       [192, 80]],  // 表示 76px
  [/^venue_/,     [400, 62]],  // 表紙背景。元が400px、上から暗幕が掛かる
];
const DEFAULT = [256, 75];

function profileFor(name) {
  for (const [re, p] of PROFILE) if (re.test(name)) return p;
  return DEFAULT;
}

function ffmpegOk() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

const html = fs.readFileSync(SRC, 'utf8');
const refs = [...new Set(
  [...html.matchAll(/src='(assets\/[^']+)'|src="(assets\/[^"]+)"|url\('(assets\/[^']+)'\)/g)]
    .map(m => m[1] || m[2] || m[3])
)];

const useFfmpeg = ffmpegOk();
if (!useFfmpeg) console.warn('! ffmpeg が見つかりません。元画像をそのまま埋め込みます（サイズが大きくなります）');
if (useFfmpeg) fs.mkdirSync(TMP, { recursive: true });

let before = 0, after = 0;
const table = [];
let out = html;

for (const ref of refs) {
  const abs = path.join(__dirname, ref);
  if (!fs.existsSync(abs)) { console.error('MISSING:', ref); process.exit(1); }

  const base = path.basename(ref);
  const orig = fs.statSync(abs).size;
  before += orig;

  let buf = fs.readFileSync(abs);
  let mime = base.endsWith('.png') ? 'image/png' : 'image/webp';

  if (useFfmpeg) {
    const [w, q] = profileFor(base);
    const dst = path.join(TMP, base.replace(/\.[^.]+$/, '') + '.webp');
    try {
      execFileSync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-i', abs,
        '-vf', `scale=${w}:-1:flags=lanczos`,
        '-c:v', 'libwebp', '-lossless', '0', '-q:v', String(q), '-preset', 'picture',
        dst,
      ], { stdio: 'pipe' });
      const cand = fs.readFileSync(dst);
      if (cand.length < buf.length) { buf = cand; mime = 'image/webp'; }
    } catch (e) {
      console.warn('  変換失敗、元のまま:', base);
    }
  }

  after += buf.length;
  table.push([base, orig, buf.length]);

  const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
  // src="..." / src='...' / url('...') の3形をまとめて置換
  const esc = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  out = out.replace(new RegExp(`(src=["']|url\\(['"]?)${esc}(["']?\\)?)`, 'g'),
    (m, pre, post) => pre + dataUri + post);
}

// 埋め込み後は参照が残っていてはいけない
const leftover = [...out.matchAll(/assets\/[A-Za-z0-9_.\-]+/g)].map(m => m[0]);
if (leftover.length) { console.error('未置換の参照:', [...new Set(leftover)]); process.exit(1); }

fs.writeFileSync(OUT, out, 'utf8');
if (useFfmpeg) fs.rmSync(TMP, { recursive: true, force: true });

const kb = n => (n / 1024).toFixed(0) + 'KB';
console.log('画像 ' + table.length + '点');
for (const [n, a, b] of table.sort((x, y) => y[1] - x[1])) {
  const cut = a ? Math.round((1 - b / a) * 100) : 0;
  console.log('  ' + n.padEnd(26) + kb(a).padStart(7) + ' → ' + kb(b).padStart(7) + (cut > 0 ? `  -${cut}%` : ''));
}
console.log('---');
console.log('画像合計   ' + kb(before) + ' → ' + kb(after));
console.log('出力       ' + path.basename(OUT) + '  ' + kb(fs.statSync(OUT).size) + ' （1ファイル完結）');
