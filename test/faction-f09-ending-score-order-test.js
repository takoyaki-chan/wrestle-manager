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
    '_u3bSideHtml',
    'escHtml',
    `${functionSource('showFactionF09EndingModal')}; return showFactionF09EndingModal;`
  )(
    mocks._isPopupActive,
    mocks._popupQueue,
    mocks._factionUpperUrl,
    mocks._factionEnsureOverlayRoot,
    mocks._factionCloseCinematicOverlay,
    mocks._factionSeasonLabel,
    mocks._f09BgmStop,
    mocks.Audio,
    mocks._u3bSideHtml,
    mocks.escHtml
  );
}

(function testEndingModalShowsWinnerAlignedScore() {
  const sideCalls = [];
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
    _u3bSideHtml: (side) => {
      sideCalls.push(side);
      return `<div class="u3b-side"><div class="u3b-bubble-slot"><div class="u3b-bubble">${side.line}</div></div><div class="u3b-upper fevt-arena-portrait"></div><div class="u3b-name">${side.name}</div></div>`;
    },
    escHtml: (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
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
  assert.strictEqual(sideCalls.length, 2, '勝者・敗者を共通の顔出しブロックで描画する');
  assert.strictEqual(sideCalls[0].line, '見たか。');
  assert.strictEqual(sideCalls[1].line, '次に返すから');
  assert.ok(root.innerHTML.indexOf('u3b-bubble-slot') < root.innerHTML.indexOf('u3b-upper fevt-arena-portrait'),
    'セリフ吹き出しをキャラクター画像より上に置く');
  assert.ok(!root.innerHTML.includes('<script>'), 'F09結末ナレーションをHTMLとして解釈しない');
})();

[
  'showFactionF09OpeningModal',
  'showFactionF09MatchPreModal',
  'showFactionF09MatchPostModal',
  'showFactionF09EndingModal',
].forEach(name => {
  const source = functionSource(name);
  assert.ok(source.includes('_u3bSideHtml({'), `${name}: 共通の吹き出し・画像配置を使う`);
  assert.ok(source.includes('u3b-theme-stage is-hostility'), `${name}: 既存Stageテーマを使う`);
  assert.ok(!source.includes('fevt-arena-bubble-name'), `${name}: 画像下の旧セリフ枠へ戻さない`);
});

console.log('faction-f09-ending-score-order-test: ok');
