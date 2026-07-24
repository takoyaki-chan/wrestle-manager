'use strict';

// test/helpers/source.js
//
// Shared helpers for tests that need to inspect source-file TEXT (as opposed to
// executing real engine functions, which is always preferred — see test/README.md).
//
// The working tree is CRLF (git core.autocrlf on Windows) but test literals are almost
// always authored as LF template/string content. Reading files raw with fs.readFileSync
// makes '\n'-containing literals fail to match against '\r\n' source lines even when the
// code is 100% correct. readSource() normalizes that away so tests assert on content,
// not on line-ending accidents.

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

/**
 * Read a file relative to the repo root, stripping all \r so CRLF and LF
 * source trees behave identically. This is the ONLY way tests should read
 * source files for text-based assertions.
 */
function readSource(...relParts) {
  const full = path.join(repoRoot, ...relParts);
  return fs.readFileSync(full, 'utf8').replace(/\r/g, '');
}

/**
 * JSON.parse a readSource'd file (also CRLF-safe, though JSON.parse doesn't
 * care about line endings — provided for symmetry/convenience).
 */
function readJSON(...relParts) {
  return JSON.parse(readSource(...relParts));
}

/**
 * The single source of truth for the current release version.
 * Never hardcode a version string in a test — read it from here.
 */
function manifestVersion() {
  return readJSON('release', 'manifest.json').version;
}

module.exports = {
  repoRoot,
  readSource,
  readJSON,
  manifestVersion,
};
