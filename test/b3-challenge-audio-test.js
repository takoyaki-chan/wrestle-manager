const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

function extractMethodBody(signature) {
  const startToken = `${signature} {`;
  const start = appSource.indexOf(startToken);
  if (start < 0) throw new Error(`${signature} block not found`);
  const bodyStart = start + startToken.length;
  let depth = 1;
  for (let i = bodyStart; i < appSource.length; i++) {
    if (appSource[i] === '{') depth++;
    else if (appSource[i] === '}') depth--;
    if (depth === 0) return appSource.slice(bodyStart, i);
  }
  throw new Error(`${signature} block end not found`);
}

const handleLargeEventBody = extractMethodBody('handleLargeEvent(event)');
const executeLargeEventMatchBody = extractMethodBody('_executeLargeEventMatch(event, prevResult)');
const closeB3ResultBody = extractMethodBody('closeB3Result()');

assert(
  appSource.includes('B3_CHALLENGE:') && appSource.includes("openStinger: { src: FACTION_AUDIO.GONG"),
  'B3 challenge audio map entry should use tension BGM with gong stinger'
);

assert(
  handleLargeEventBody.includes("event && event.type === 'B3' ? 'B3_CHALLENGE' : null") &&
    handleLargeEventBody.includes('_factionAudioOpen(largeEventAudioId)'),
  'handleLargeEvent should start B3 challenge audio when the challenge letter opens'
);

assert(
  handleLargeEventBody.includes('_factionAudioClose(largeEventAudioId)') &&
    handleLargeEventBody.includes('choiceIdx < 0') &&
    handleLargeEventBody.includes('result.nextStep === 1'),
  'handleLargeEvent should close B3 challenge audio on decline/cancel paths'
);

assert(
  executeLargeEventMatchBody.includes('const finalizeAudio = App._largeEventAudioFinalize') &&
    executeLargeEventMatchBody.includes('prevResult, finalizeAudio') &&
    executeLargeEventMatchBody.includes('App._largeEventAudioFinalize = null'),
  'B3 match preview should carry the pending audio finalizer'
);

assert(
  closeB3ResultBody.includes('const finalizeAudio = b3 && b3.finalizeAudio') &&
    closeB3ResultBody.includes('if (finalizeAudio) finalizeAudio()') &&
    closeB3ResultBody.includes('else App.restoreBgmForState()'),
  'closing B3 result should restore audio through the carried finalizer'
);

console.log('b3-challenge-audio-test: passed');
