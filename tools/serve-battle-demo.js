'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { createBattleDataSource, createDemoBattleShell, DEMO_PORTRAITS } = require('./battle-demo-shared');

const repoRoot = path.resolve(__dirname, '..');
const useDist = process.argv.includes('--dist');
const requestedPort = Number((process.argv.find((arg) => arg.startsWith('--port=')) || '').split('=')[1]);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : (useDist ? 4174 : 4173);
const baseDir = useDist ? path.join(repoRoot, 'dist', 'battle-demo') : path.join(repoRoot, 'apps', 'battle-demo');
const battleViewFiles = new Set([
  'battle-shared.css', 'battle-mobile.css', 'battle-sfx.js', 'battle-anim.js',
  'battle-lines.js', 'battle-replay-core.js', 'battle-engine-main.js',
]);
const battleAudioFiles = new Set([
  'b01_strike_hit_v4.mp3', 'b02_throw_hit_v1.mp3', 'b03_joint_v4.mp3', 'b12_bigmove_hit_v3.mp3',
  'b03_joint_v5.mp3', 'b06_rollup_v1.mp3', 'b07_whiff_v4.mp3', 'b08_counter_v1.mp3',
  'b09_cutin_slide_v6.mp3', 'b11_charge_v2.mp3', 'b12_bigmove_hit_v2.mp3', 'f02_kickout_v2.mp3',
  'f03_escape_v2.mp3', 'f04_heartbeat_v1.mp3', 'f05_finish_impact_v2.mp3', 'f11_ready_v1.mp3',
  'e02_crowd_v2.mp3',
  'f12_fight_start_v3.mp3', 'f13_lockup_v4.mp3',
]);
const battleMusicPath = '/bgm/production-ogg/wm_bgm_m01_v01.ogg';
const sourceImageAssets = Object.fromEntries(Object.values(DEMO_PORTRAITS).flatMap((key) => [
  [`/image/face_${key}.png`, path.join(repoRoot, 'image', `face_${key}.png`)],
  [`/image/upper/upper_${key}.webp`, path.join(repoRoot, 'image', 'upper', `upper_${key}.webp`)],
  [`/image/full/full_${key}.webp`, path.join(repoRoot, 'image', 'full', `full_${key}.webp`)],
]));
sourceImageAssets['/image/battle-ring-bg-mockup-v2.webp'] = path.join(repoRoot, 'image', 'battle-ring-bg-mockup-v2.webp');
sourceImageAssets['/image/battle-bg_venue_4.webp'] = path.join(repoRoot, 'image', 'battle-bg_venue_4.webp');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

function send(response, status, body, contentType) {
  response.writeHead(status, {
    'Content-Type': contentType || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  response.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const resolved = path.resolve(baseDir, relative);
  return resolved === baseDir || resolved.startsWith(baseDir + path.sep) ? resolved : null;
}

if (!fs.existsSync(baseDir)) {
  console.error(`Battle demo directory does not exist: ${baseDir}`);
  process.exit(1);
}

const server = http.createServer((request, response) => {
  try {
    const requestPath = new URL(request.url, 'http://localhost').pathname;
    if (!useDist && sourceImageAssets[requestPath]) {
      send(response, 200, fs.readFileSync(sourceImageAssets[requestPath]), mimeTypes[path.extname(requestPath)]);
      return;
    }
    if (!useDist && requestPath === '/battle/battle-engine.html') {
      send(response, 200, createDemoBattleShell(repoRoot), mimeTypes['.html']);
      return;
    }
    if (!useDist && requestPath.startsWith('/battle/')) {
      const file = path.basename(requestPath);
      if (battleViewFiles.has(file)) {
        send(response, 200, fs.readFileSync(path.join(repoRoot, 'src', file)), mimeTypes[path.extname(file)]);
        return;
      }
    }
    if (!useDist && requestPath.startsWith('/bgm/')) {
      const file = path.basename(requestPath);
      if (requestPath === battleMusicPath) {
        send(response, 200, fs.readFileSync(path.join(repoRoot, 'bgm', 'production-ogg', file)), mimeTypes['.ogg']);
        return;
      }
      if (battleAudioFiles.has(file)) {
        send(response, 200, fs.readFileSync(path.join(repoRoot, 'bgm', file)), mimeTypes['.mp3']);
        return;
      }
    }
    if (!useDist && requestPath === '/shared/battle-data.js') {
      send(response, 200, createBattleDataSource(repoRoot), mimeTypes['.js']);
      return;
    }
    if (!useDist && requestPath === '/shared/match-engine.js') {
      send(response, 200, fs.readFileSync(path.join(repoRoot, 'src', 'match-engine.js')), mimeTypes['.js']);
      return;
    }
    let filePath = safePath(requestPath);
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      send(response, 200, fs.readFileSync(filePath), mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
      return;
    }
    filePath = path.join(baseDir, 'index.html');
    send(response, 200, fs.readFileSync(filePath), mimeTypes['.html']);
  } catch (error) {
    send(response, 500, `Battle demo server error: ${error.message}`);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Wrestle-Manager battle demo (${useDist ? 'production preview' : 'development'})`);
  console.log(`Local URL: http://127.0.0.1:${port}/`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
