'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
};

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolveRequestPath(projectRoot, harnessRoot, requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
  if (pathname.startsWith('/__harness__/')) {
    const candidate = path.resolve(harnessRoot, pathname.slice('/__harness__/'.length));
    return isInside(harnessRoot, candidate) ? candidate : null;
  }

  const srcRoot = path.join(projectRoot, 'src');
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const srcCandidate = path.resolve(srcRoot, relative);
  if (isInside(srcRoot, srcCandidate) && fs.existsSync(srcCandidate)) return srcCandidate;

  const projectCandidate = path.resolve(projectRoot, relative);
  return isInside(projectRoot, projectCandidate) ? projectCandidate : null;
}

function sendFile(response, filename) {
  fs.stat(filename, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-length': stats.size,
      'content-type': MIME_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream',
    });
    fs.createReadStream(filename).pipe(response);
  });
}

async function startStaticServer(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || path.join(__dirname, '..', '..'));
  const harnessRoot = path.resolve(options.harnessRoot || __dirname);
  const host = options.host || '127.0.0.1';
  const port = Number.isInteger(options.port) ? options.port : 0;

  const server = http.createServer((request, response) => {
    if (!request.url || !['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { allow: 'GET, HEAD' });
      response.end();
      return;
    }
    let filename;
    try {
      filename = resolveRequestPath(projectRoot, harnessRoot, request.url);
    } catch (_error) {
      filename = null;
    }
    if (!filename) {
      response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }
    if (request.method === 'HEAD') {
      fs.stat(filename, (error, stats) => {
        if (error || !stats.isFile()) response.writeHead(404);
        else response.writeHead(200, { 'content-length': stats.size });
        response.end();
      });
      return;
    }
    sendFile(response, filename);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  return {
    baseUrl: `http://${host}:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections?.();
    }),
    server,
  };
}

module.exports = { resolveRequestPath, startStaticServer };
