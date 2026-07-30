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

// Approved draft v0.1 representative lines (24 samples) plus every generic line.
const approvedSamples = [
  '見つけてもらった以上、期待には応えるつもり',
  '…評価は、リングで確かめて',
  'わたくしを見つけたご慧眼、称えて差し上げます',
  'わたしに声をかけた責任は、取ってちょうだいね',
  '……見込まれた。…なら、やる',
  'み、見つかっちゃった…隠れてたのに…',
  'うふふ♪見出されるって、とても気分がよいことですね',
  'ふん！まぁ、アンタの目が正しいのは、証明してやるよ',
  '所属のなかった身に声をかけてくれた。忘れないよ',
  '…次のリングを探してた。…ここに腰を据える',
  'チャンスをありがとう。私を侮ったあいつらに、ほえ面かかせてやりますわ',
  '…次が、決まっていなかったので。…助かりました',
  '…もう、独りじゃないの…？　…よかった…',
  'フリー生活、今日で終わりです！助かりました',
  '頂いた二度目の機会、決して粗末にしません',
  '畜生…！拾いやがって…！泣かせるじゃねえか…！',
  '声をかけてくれてありがとうございます。やります！',
  '腕試しの場をもらいました。全力でいきます！',
  'もう一度リングに立てます。無駄にしません！',
  '拾っていただいた恩、必ず返します！',
  '所属を失っていました。ここで、やり直します！',
  '…フリーはここまでにするよ。落ち着くとこだ',
  '一度は失った場所です。今度こそ守り抜きます',
  '…っ…終わってなかったんだな。…やるよ',
];

const allGreetingLines = [
  ...flattenLines(data.SCOUT_GREETING_LINES),
  ...flattenLines(data.FA_GREETING_LINES),
  ...data.SCOUT_GREETING_GENERIC_LINES,
  ...data.FA_GREETING_GENERIC_LINES,
];
assert.strictEqual(flattenLines(data.SCOUT_GREETING_LINES).length, 58, 'scout draft line count');
assert.strictEqual(flattenLines(data.FA_GREETING_LINES).length, 57, 'FA draft line count');
approvedSamples.forEach(line => assert.ok(allGreetingLines.includes(line), `approved draft text missing: ${line}`));
assert.deepStrictEqual(data.SCOUT_GREETING_GENERIC_LINES, [
  '見つけてもらった分、リングで返します！',
  '声をかけてくれてありがとうございます。やります！',
  '腕試しの場をもらいました。全力でいきます！',
]);
assert.deepStrictEqual(data.FA_GREETING_GENERIC_LINES, [
  'もう一度リングに立てます。無駄にしません！',
  '拾っていただいた恩、必ず返します！',
  '所属を失っていました。ここで、やり直します！',
]);
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
assert.ok(data.SCOUT_GREETING_LINES.normal.cool.includes(context.getJoinGreeting(prospect)), 'prospect selects scout greeting');
assert.ok(data.FA_GREETING_LINES.normal.cool.includes(context.getJoinGreeting(veteran)), 'veteran selects FA greeting');

context.Math.random = () => 0.1;
assert.ok(data.EVENT_FA_WELCOME_LINES.normal.cool.includes(context.getJoinGreeting(prospect)), '25% welcome pool is available to all join sources');

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
