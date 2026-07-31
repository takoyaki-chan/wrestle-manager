'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const data = require('../src/data.js');

const root = path.join(__dirname, '..');
const commonSource = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const appSource = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const renderSource = fs.readFileSync(path.join(root, 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must be defined`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`could not extract ${name}`);
}

function flattenLines(pool) {
  return Object.values(pool).flatMap(personality => Object.values(personality).flat());
}

// 承認草案 v0.2 (docs/dialogue/signing-greeting-draft-v0.2.md) を直接パースし、
// data.js の4定数と一字一句の完全一致を検査する(代表サンプル方式 v0.1 から置換)。
{
  const draftSource = fs.readFileSync(
    path.join(root, 'docs', 'dialogue', 'signing-greeting-draft-v0.2.md'), 'utf8').replace(/\r\n/g, '\n');
  const draftSandbox = {};
  const draftCode = draftSource.match(/```js\n([\s\S]*?)```/g)
    .map(b => b.replace(/```js\n/, '').replace(/```/, '')).join('\n')
    + '\n;this.__out = { SCOUT_GREETING_LINES, SCOUT_GREETING_GENERIC_LINES, FA_GREETING_LINES, FA_GREETING_GENERIC_LINES };';
  vm.runInNewContext(draftCode, draftSandbox);
  // VM別レルムのプロトタイプ差を避けるため JSON 往復で正規化して比較する
  const norm = v => JSON.parse(JSON.stringify(v));
  assert.deepStrictEqual(norm(data.SCOUT_GREETING_LINES), norm(draftSandbox.__out.SCOUT_GREETING_LINES), 'scout pool matches approved draft v0.2');
  assert.deepStrictEqual(norm(data.FA_GREETING_LINES), norm(draftSandbox.__out.FA_GREETING_LINES), 'FA pool matches approved draft v0.2');
  assert.deepStrictEqual(norm(data.SCOUT_GREETING_GENERIC_LINES), norm(draftSandbox.__out.SCOUT_GREETING_GENERIC_LINES), 'scout generic matches draft');
  assert.deepStrictEqual(norm(data.FA_GREETING_GENERIC_LINES), norm(draftSandbox.__out.FA_GREETING_GENERIC_LINES), 'FA generic matches draft');
  const allDraftLines = [
    ...flattenLines(draftSandbox.__out.SCOUT_GREETING_LINES),
    ...flattenLines(draftSandbox.__out.FA_GREETING_LINES),
    ...draftSandbox.__out.SCOUT_GREETING_GENERIC_LINES,
    ...draftSandbox.__out.FA_GREETING_GENERIC_LINES,
  ];
  assert.ok(allDraftLines.every(l => l.length <= 43), 'all lines fit the 43-char bubble limit');
}

const legacySamplesRemoved = true; // v0.1の内蔵サンプル方式は撤去(上のmd照合が正)
void legacySamplesRemoved;
assert.strictEqual(data.EVENT_LINES_BY_KEY.scoutGreeting, data.SCOUT_GREETING_LINES);
assert.strictEqual(data.EVENT_LINES_BY_KEY.scoutGreetingGeneric, data.SCOUT_GREETING_GENERIC_LINES);
assert.strictEqual(data.EVENT_LINES_BY_KEY.faGreeting, data.FA_GREETING_LINES);
assert.strictEqual(data.EVENT_LINES_BY_KEY.faGreetingGeneric, data.FA_GREETING_GENERIC_LINES);

const context = {
  Math: { random: () => 0.9, floor: Math.floor },
  SCOUT_GREETING_LINES: data.SCOUT_GREETING_LINES,
  SCOUT_GREETING_GENERIC_LINES: data.SCOUT_GREETING_GENERIC_LINES,
  FA_GREETING_LINES: data.FA_GREETING_LINES,
  FA_GREETING_GENERIC_LINES: data.FA_GREETING_GENERIC_LINES,
  EVENT_FA_WELCOME_LINES: data.EVENT_FA_WELCOME_LINES,
  pickDialogueLine: data.pickDialogueLine,
};
vm.runInNewContext(`${extractFunction(commonSource, 'hasCareerHistory')}\n${extractFunction(commonSource, 'getJoinGreeting')}\nthis.hasCareerHistory = hasCareerHistory; this.getJoinGreeting = getJoinGreeting;`, context);

const prospect = { wins: 0, losses: 0, draws: 0, careerRecord: { history: [{ type: 'debut' }] }, careerSeasons: 0, personality: 'normal', archetype: 'cool' };
const veteran = { wins: 0, losses: 0, draws: 0, careerRecord: { history: [{ type: 'release' }] }, careerSeasons: 0, personality: 'normal', archetype: 'cool' };
assert.strictEqual(context.hasCareerHistory(prospect), false, '17-year-old prospect with debut only is not careered');
assert.strictEqual(context.hasCareerHistory(veteran), true, 'released FA has career history');
assert.strictEqual(context.hasCareerHistory({ wins: 1 }), true, 'recorded match creates career history');
assert.strictEqual(context.hasCareerHistory({ careerSeasons: 1 }), true, 'career season creates career history');
assert.ok(data.SCOUT_GREETING_LINES.cool.normal.includes(context.getJoinGreeting(prospect)), 'prospect selects scout greeting');
assert.ok(data.FA_GREETING_LINES.cool.normal.includes(context.getJoinGreeting(veteran)), 'veteran selects FA greeting');

context.Math.random = () => 0.1;
assert.ok(data.EVENT_FA_WELCOME_LINES.cool.normal.includes(context.getJoinGreeting(prospect)), '25% welcome pool is available to all join sources');

const fallbackContext = {
  Math: { random: () => 0.9, floor: Math.floor },
  SCOUT_GREETING_LINES: undefined,
  SCOUT_GREETING_GENERIC_LINES: ['scout generic'],
  FA_GREETING_LINES: undefined,
  FA_GREETING_GENERIC_LINES: ['FA generic'],
  EVENT_FA_WELCOME_LINES: undefined,
  pickDialogueLine: () => undefined,
};
vm.runInNewContext(`${extractFunction(commonSource, 'hasCareerHistory')}\n${extractFunction(commonSource, 'getJoinGreeting')}\nthis.getJoinGreeting = getJoinGreeting;`, fallbackContext);
assert.strictEqual(fallbackContext.getJoinGreeting(prospect), 'scout generic', 'missing scout pool falls back without undefined');
assert.strictEqual(fallbackContext.getJoinGreeting(veteran), 'FA generic', 'missing FA pool falls back without undefined');

assert.ok(commonSource.includes('const quote = getSigningQuote(fighter);'), 'FA ceremony pre-signing quote remains unchanged');
assert.ok(commonSource.includes('const welcomeQuote = fighter ? getJoinGreeting(fighter)'), 'FA welcome uses the join greeting');
assert.ok(commonSource.includes('function getRentalQuote(char)'), 'rental greeting remains present');
assert.ok(appSource.includes('message: `「${getJoinGreeting(normalizedSigned)}」`'), 'scout acquisition displays join greeting');
assert.ok(appSource.includes('detail:`${cand.name}が加入しました！(スカウト獲得)`'), 'scout acquisition detail is preserved');
assert.ok(renderSource.includes("getJoinSourceBadge('fa')"), 'FA cards render source badge');
assert.ok(renderSource.includes("getJoinSourceBadge('scout')"), 'scout cards render source badge');
const badgeFunction = extractFunction(commonSource, 'getJoinSourceBadge');
assert.ok(badgeFunction.includes('var(--blue)') && badgeFunction.includes('var(--green)'), 'badge colors use theme tokens');
assert.ok(!badgeFunction.includes('#'), 'badge colors contain no hard-coded hex');

console.log('join greeting and source badge checks: PASS');
