'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');

function collectSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(?:html|js)$/i.test(entry.name) ? [fullPath] : [];
  });
}

const forbidden = [
  { label: '自団体王座に「世界」を冠した日本語表現', pattern: /世界(?:王者|王座|戦線)/g },
  { label: '自団体王座に「WORLD」を冠した英語表現', pattern: /\bWORLD\s+(?:CHAMPION|TITLE|CHAMPIONSHIP)\b/gi },
];

const violations = [];
for (const filePath of collectSourceFiles(srcDir)) {
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    forbidden.forEach(({ label, pattern }) => {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        violations.push(`${path.relative(srcDir, filePath)}:${index + 1} ${label}: ${line.trim()}`);
      }
    });
  });
}

assert.deepStrictEqual(
  violations,
  [],
  `自団体タイトルは「団体王者／団体王座」と表記する:\n${violations.join('\n')}`,
);

console.log('✅ 自団体タイトルの「団体王者／団体王座」表記を確認');
