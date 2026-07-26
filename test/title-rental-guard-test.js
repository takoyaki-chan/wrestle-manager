const assert = require('assert');
const fs = require('fs');
const path = require('path');

function extractBlock(source, signature) {
  const startToken = `${signature} {`;
  const start = source.indexOf(startToken);
  if (start < 0) throw new Error(`${signature} block not found`);
  const bodyStart = start + startToken.length;
  let depth = 1;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    if (depth === 0) return source.slice(bodyStart, i);
  }
  throw new Error(`${signature} block end not found`);
}

const managementSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'management.js'), 'utf8').replace(/\r\n/g, '\n');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');

const sanitizeBody = extractBlock(managementSource, 'sanitizeShowCardTitles(state, showCard)');
const setShowCardSlotBody = extractBlock(appSource, 'setShowCardSlot(slotIndex, side, newId)');

const runSanitize = new Function('Engine', 'state', 'showCard', `${sanitizeBody}`);
// 2026-07-27: setShowCardSlot が操作音を鳴らすようになったため、切り出し実行に Audio が要る
//（音は演出なので、ここでは呼ばれたことだけ受け止める）
const runSetShowCardSlotRaw = new Function('Engine', 'renderShowPrep', 'Audio', 'G', 'slotIndex', 'side', 'newId', `${setShowCardSlotBody}; return G;`);
const audioStub = { play() {} };
const runSetShowCardSlot = (Engine, renderShowPrep, G, slotIndex, side, newId) =>
  runSetShowCardSlotRaw(Engine, renderShowPrep, audioStub, G, slotIndex, side, newId);

(function testSanitizeClearsRentalTitleSlot() {
  const Engine = {
    title: {
      canTitleMatch() { return { allowed: true, weeksLeft: 0 }; },
      getEligibleChallengers() { return [2, 3]; },
    },
  };
  const state = {
    titleEstablished: true,
    titles: { world: { championId: 1 } },
    roster: [
      { id: 1, isRental: false },
      { id: 2, isRental: true },
    ],
  };
  const showCard = [{ left: 1, right: 2, isTitle: true }];

  const out = runSanitize(Engine, state, showCard);

  assert.strictEqual(out[0].isTitle, false);
})();

(function testSetShowCardSlotSanitizesChangedRentalSlot() {
  let renderCalls = 0;
  const Engine = {
    title: {
      sanitizeShowCardTitles(state, showCard) {
        return showCard.map(slot => {
          const hasRental = [slot.left, slot.right].some(id => state.roster.find(c => c.id === id)?.isRental);
          return hasRental ? { ...slot, isTitle: false } : slot;
        });
      },
    },
  };
  let G = {
    titles: { world: { championId: 1 } },
    roster: [
      { id: 1, isRental: false },
      { id: 2, isRental: false },
      { id: 3, isRental: true },
    ],
    showCard: [{ left: 1, right: 2, isTitle: true }],
  };

  G = runSetShowCardSlot(Engine, () => { renderCalls += 1; }, G, 0, 'right', 3);

  assert.strictEqual(G.showCard[0].right, 3);
  assert.strictEqual(G.showCard[0].isTitle, false);
  assert.strictEqual(renderCalls, 1);
})();

console.log('title-rental-guard-test: ok');
