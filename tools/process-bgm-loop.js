#!/usr/bin/env node
// ── BGM 1曲加工ツール(音響刷新パイプラインの単曲版・リポジトリ常設) ──
// 使い方:
//   node tools/process-bgm-loop.js "<入力音源>" "<出力.ogg>" [minLen] [maxLen]
//   node tools/process-bgm-loop.js "<入力音源>" "<出力.ogg>" --fade [fadeIn秒] [fadeOut秒]
//
// 通常モード: 先頭無音カット → [minLen,maxLen]秒(既定30-45)でループ終点をエンベロープ相関探索
//             → 末尾1.5秒を曲頭とクロスフェードしてサンプル連続ループ化 → -17 LUFS/TP-1dB → OGG
// --fade    : 切り貼りせず全編使用。フェードイン/アウト型ループ(C01タイトルと同方式)
//
// 例(通常興行の進行曲を差し替える時):
//   node tools/process-bgm-loop.js "【サウンド・BGM】/WM-E01 特別興行 (12).mp3" "bgm/production-ogg/wm_bgm_sp00_v01.ogg" 30 45
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const FFDIR = process.env.LOCALAPPDATA + '\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin';
const FF = fs.existsSync(path.join(FFDIR, 'ffmpeg.exe')) ? path.join(FFDIR, 'ffmpeg.exe') : 'ffmpeg';

const [,, srcArg, outArg, a3, a4, a5] = process.argv;
if (!srcArg || !outArg) { console.error('引数不足。ファイル先頭の使い方を参照。'); process.exit(1); }
const SRC = path.resolve(srcArg);
const OUT = path.resolve(outArg);
const FADE_MODE = a3 === '--fade';
const MIN_LEN = FADE_MODE ? 0 : (parseFloat(a3) || 30);
const MAX_LEN = FADE_MODE ? 0 : (parseFloat(a4) || 45);
const FADE_IN = FADE_MODE ? (parseFloat(a4) || 1.2) : 0;
const FADE_OUT = FADE_MODE ? (parseFloat(a5) || 2.0) : 0;
const TARGET_LUFS = -17;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'wmbgm-'));

function run(args) {
  const r = spawnSync(FF, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) { console.error('ffmpeg失敗:\n' + (r.stderr || '').slice(-600)); process.exit(1); }
  return r.stderr || '';
}
function decode(rate) {
  const raw = path.join(TMP, 'a.f32');
  run(['-v', 'error', '-y', '-i', SRC, '-vn', '-ac', '1', '-ar', String(rate), '-f', 'f32le', raw]);
  const b = fs.readFileSync(raw);
  const n = b.length >> 2;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = b.readFloatLE(i * 4);
  return x;
}
function analyze(x, SR) {
  const HOP = Math.round(SR * 0.02), nf = Math.floor(x.length / HOP);
  const env = new Float32Array(nf);
  for (let f = 0; f < nf; f++) {
    let s = 0;
    for (let i = f * HOP; i < (f + 1) * HOP; i++) s += x[i] * x[i];
    env[f] = Math.sqrt(s / HOP);
  }
  let sf = 0; while (sf < nf && env[sf] < 0.005) sf++;
  let ef = nf - 1; while (ef > 0 && env[ef] < 0.005) ef--;
  return { env, HOP, nf, t0: Math.max(0, sf * HOP / SR - 0.01), audioEnd: (ef + 1) * HOP / SR, ef };
}
function findLoop(x, SR, an) {
  const { env, HOP, nf, t0, ef } = an;
  const TPL = Math.round(4 / 0.02), tf0 = Math.round(t0 / 0.02);
  const tpl = env.slice(tf0, tf0 + TPL);
  const tm = tpl.reduce((a, b) => a + b) / TPL;
  const td = Math.sqrt(tpl.reduce((a, b) => a + (b - tm) ** 2, 0));
  const from = tf0 + Math.round(MIN_LEN / 0.02);
  const to = Math.min(nf - TPL - 1, ef - 25, tf0 + Math.round(MAX_LEN / 0.02));
  let best = null;
  for (let f = from; f <= to; f++) {
    let mean = 0; for (let i = 0; i < TPL; i++) mean += env[f + i]; mean /= TPL;
    let dot = 0, dev = 0;
    for (let i = 0; i < TPL; i++) { dot += (env[f + i] - mean) * (tpl[i] - tm); dev += (env[f + i] - mean) ** 2; }
    const sc = dot / (Math.sqrt(dev) * td + 1e-9);
    if (!best || sc > best.score) best = { f, score: sc };
  }
  let T = best ? best.f * HOP : Math.min(an.audioEnd - 1, t0 + MAX_LEN) * SR;
  const a0 = Math.round(t0 * SR), R = Math.round(SR * 0.05), W = Math.round(SR * 0.4);
  let bo = Math.round(T), be = Infinity;
  for (let off = Math.round(T) - R; off <= Math.round(T) + R; off++) {
    if (off + W >= x.length || off <= a0) continue;
    let e = 0;
    for (let i = 0; i < W; i += 2) { const d = x[a0 + i] - x[off + i]; e += d * d; }
    if (e < be) { be = e; bo = off; }
  }
  return { T: bo / SR, score: best ? best.score : 0 };
}
function loudnormEncode(wav) {
  const err = run(['-v', 'info', '-y', '-i', wav, '-af', `loudnorm=I=${TARGET_LUFS}:TP=-1:LRA=11:print_format=json`, '-f', 'null', '-']);
  const m = JSON.parse(err.match(/\{[\s\S]*\}/)[0]);
  run(['-v', 'error', '-y', '-i', wav,
    '-af', `loudnorm=I=${TARGET_LUFS}:TP=-1:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    '-ar', '48000', '-c:a', 'libvorbis', '-q:a', '6', OUT]);
  return m.input_i;
}

const x = decode(22050);
const an = analyze(x, 22050);
const wav = path.join(TMP, 'edit.wav');
if (FADE_MODE) {
  const end = Math.max(an.t0 + 5, an.audioEnd - 0.2);
  run(['-v', 'error', '-y', '-i', SRC, '-af',
    `atrim=start=${an.t0.toFixed(4)}:end=${end.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${FADE_IN},afade=t=out:st=${(end - an.t0 - FADE_OUT).toFixed(3)}:d=${FADE_OUT}`,
    '-ar', '48000', wav]);
  const inI = loudnormEncode(wav);
  console.log(`フェード型 完了: ${(end - an.t0).toFixed(1)}秒 (in ${FADE_IN}s / out ${FADE_OUT}s) I=${inI}→${TARGET_LUFS} → ${OUT}`);
} else {
  const lp = findLoop(x, 22050, an);
  const L = 1.5;
  run(['-v', 'error', '-y', '-i', SRC, '-filter_complex',
    `[0:a]atrim=start=${(an.t0 + L).toFixed(4)}:end=${lp.T.toFixed(4)},asetpts=PTS-STARTPTS[a];[0:a]atrim=start=${an.t0.toFixed(4)}:end=${(an.t0 + L).toFixed(4)},asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=${L}:c1=tri:c2=tri`,
    '-ar', '48000', wav]);
  const inI = loudnormEncode(wav);
  console.log(`ループ型 完了: ${(lp.T - an.t0 - L).toFixed(1)}秒ループ score=${lp.score.toFixed(2)} I=${inI}→${TARGET_LUFS} → ${OUT}`);
  if (lp.score < 0.35) console.log('⚠ ループ相関が弱め — 継ぎ目を試聴推奨(だめなら --fade モードを検討)');
}
fs.rmSync(TMP, { recursive: true, force: true });
