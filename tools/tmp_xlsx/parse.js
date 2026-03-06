const fs = require('fs');
const path = require('path');
const base = 'C:/Users/nkmrk/Downloads/wrestle-manager/tools/tmp_xlsx/extracted/xl';

// Parse shared strings
const ssXml = fs.readFileSync(path.join(base, 'sharedStrings.xml'), 'utf8');
const siMatches = ssXml.match(/<si>[\s\S]*?<\/si>/g) || [];
const shared = siMatches.map(si => {
  const texts = si.match(/<t[^>]*>([^<]*)<\/t>/g) || [];
  return texts.map(t => t.replace(/<[^>]*>/g, '')).join('');
});

// Parse sheet1
const sheetXml = fs.readFileSync(path.join(base, 'worksheets/sheet1.xml'), 'utf8');
const rows = sheetXml.match(/<row[^>]*>[\s\S]*?<\/row>/g) || [];

const data = rows.map(row => {
  const cells = row.match(/<c[^>]*>[\s\S]*?<\/c>/g) || [];
  return cells.map(c => {
    const tAttr = c.match(/t="([^"]*)"/);
    const vMatch = c.match(/<v>([^<]*)<\/v>/);
    if (!vMatch) return '';
    if (tAttr && tAttr[1] === 's') return shared[parseInt(vMatch[1])] || '';
    if (tAttr && tAttr[1] === 'str') return vMatch[1];
    return vMatch[1];
  });
});

data.forEach((row, i) => {
  if (row.some(c => c)) console.log('Row' + (i+1) + ':', JSON.stringify(row));
});
