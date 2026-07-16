const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');

function functionSource(name) {
  const start = ui.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} not found`);
  const brace = ui.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < ui.length; i++) {
    if (ui[i] === '{') depth++;
    if (ui[i] === '}') {
      depth--;
      if (depth === 0) return ui.slice(start, i + 1);
    }
  }
  throw new Error(`${name} end not found`);
}

function buildEndingModal(mocks) {
  return new Function(
    '_isPopupActive',
    '_popupQueue',
    '_factionUpperUrl',
    '_factionEnsureOverlayRoot',
    '_factionCloseCinematicOverlay',
    '_factionSeasonLabel',
    '_f09BgmStop',
    'Audio',
    `${functionSource('showFactionF09EndingModal')}; return showFactionF09EndingModal;`
  )(
    mocks._isPopupActive,
    mocks._popupQueue,
    mocks._factionUpperUrl,
    mocks._factionEnsureOverlayRoot,
    mocks._factionCloseCinematicOverlay,
    mocks._factionSeasonLabel,
    mocks._f09BgmStop,
    mocks.Audio
  );
}

(function testEndingModalShowsWinnerAlignedScore() {
  const root = {
    innerHTML: '',
    querySelector(selector) {
      if (selector === '.fevt-overlay-arena') return null;
      if (selector === '#fevtF09EndingBtn') return { addEventListener() {} };
      return null;
    },
  };

  const showFactionF09EndingModal = buildEndingModal({
    _isPopupActive: () => false,
    _popupQueue: [],
    _factionUpperUrl: () => '',
    _factionEnsureOverlayRoot: () => root,
    _factionCloseCinematicOverlay: () => {},
    _factionSeasonLabel: () => 'S3W48',
    _f09BgmStop: () => {},
    Audio: { play() {}, stinger() {} },
  });

  showFactionF09EndingModal({
    winnerFaction: { name: '赤羽あんな派', leaderId: 1, leaderName: '赤羽あんな' },
    loserFaction: { name: '西川ちあき派', leaderId: 2, leaderName: '西川ちあき' },
    winnerLine: '見たか。',
    loserLine: '次に返すから',
    scoreA: 1,
    scoreB: 4,
    winnerScore: 4,
    loserScore: 1,
    swept: true,
    narration: '赤羽あんな派が4勝1敗で西川ちあき派を制した――対抗戦は決着した。',
  }, {}, () => {});

  assert(root.innerHTML.includes('赤羽あんな派 <span style="color:#fff">4</span>'));
  assert(root.innerHTML.includes('<span style="color:#fff">1</span> 西川ちあき派'));
})();

console.log('faction-f09-ending-score-order-test: ok');
