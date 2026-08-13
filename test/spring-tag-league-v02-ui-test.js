'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/app.js');
const ui = read('src/ui-common.js');
const render = read('src/ui-render.js');
const html = read('src/index.html');

assert.match(app, /pairs:\s*myTeams\.map/,
  'entry state must preserve one pair per player slot');
assert.match(app, /usedElsewhere[\s\S]{0,260}Audio\.play\('error'\)/,
  'entry UI must reject a fighter already assigned to another slot');
assert.ok(app.includes('Engine.springTagLeague.confirmPlayerTeams ||')
  && app.includes('G = confirmPlayerTeams(G, sel.pairs)'),
  'entry UI must submit all configured player teams together');
assert.ok(ui.includes('未編成枠は締切時におまかせ編成されます'),
  'entry modal must explain fail-open completion');
assert.ok(ui.includes('stl-slot-tabs') && ui.includes('App.stlSelectEntrySlot('),
  'multi-slot entry must provide visible slot navigation');

assert.match(ui, /html \+= renderTable\('A'\);\s*html \+= renderTable\('B'\);/,
  'league board must vertically render A then B tables');
assert.ok(ui.includes('<span class="stl-block-origin">A1位</span>')
  && ui.includes('<span class="stl-block-origin">B1位</span>'),
  'final card must identify both block origins');
// 総試合数は実データから数える(8チーム=13、6〜7チーム開催や旧形式=7〜10に追随)
assert.ok(app.includes('totalMatches: totalStlMatches')
  && app.includes('matchNum: isFinal ? totalStlMatches')
  && app.match(/totalStlMatches = \(\(G\.springTagLeague && G\.springTagLeague\.matches\) \|\| \[\]\)\.length \+ 1/),
  'battle replay metadata must count matches from tournament data');
assert.match(app, /match\.block[^\n]*match\.blockRound/,
  'block replay header must identify the block and its local match number');
assert.ok(ui.includes('match.conditionAfter?.[match.teamAId || match.orgA]')
  && ui.includes('match.conditionAfter?.[match.teamBId || match.orgB]'),
  'result popup must read wear by team id while retaining the legacy org-id fallback');

assert.match(app, /if \(!p \|\| App\._stlAdvanceBusy\) return;/,
  'one click must not advance the tournament twice');
assert.match(app, /App\._stlAdvanceTimer = setTimeout\([\s\S]{0,180}App\._stlAdvanceBusy = false/,
  'advance lock must recover through a timeout');
assert.match(app, /if \(p\.championQueued\) return;[\s\S]{0,120}p\.championQueued = true/,
  'championship presentation must have a separate one-shot flag');
assert.match(app, /App\._stlChampionTimer = setTimeout\(/,
  'championship wait must be timeout-backed');

assert.ok(render.includes('出場${teamCount}チーム決定'),
  'week 10 banner must follow the allocated team count');
assert.ok(render.includes('A/Bブロック各6試合+ブロック1位同士の優勝決定戦'),
  'reserved-week copy must describe the v0.2 structure');
assert.match(render, /league\.championTeamId[\s\S]{0,100}row\.teamId === league\.championTeamId/,
  'newspaper fallback must resolve the exact champion team when one org has multiple entries');

assert.match(html, /\.stl-block\{[^}]*margin-bottom:18px[^}]*var\(--stage-border\)/,
  'two block tables must reuse the existing Stage palette');
assert.match(html, /\.stl-block-origin\{[^}]*var\(--ev-spring\)/,
  'A1/B1 origin chips must reuse the existing spring token');

console.log('spring-tag-league-v02-ui-test: ok');
