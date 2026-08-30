'use strict';

// オフシーズン第1週: ポップアップ → 表彰式 → 総括。待機コールバックには時限保険を付ける。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const advanceStart = app.indexOf('  advanceWeek() {');
assert.ok(advanceStart >= 0, 'advanceWeek が見つからない');
const advance = app.slice(advanceStart, app.indexOf('\n  },', advanceStart));

// 総括を伏せるのは advanceWeek 側で refreshAll を止める形ではない。止めると
// 2026-07-27 に直した「ヘッダーとステッパーが1つ前のまま」が再発する。
// 描き直しは常に行い、**総括だけ**を renderWeekScreen 側で pendingAwards の有無で伏せる。
assert.ok(/^\s*refreshAll\(\);\s*$/m.test(advance),
  '週が進んだことは常に描き直す(ヘッダー・ステッパーを取り残さない)');

const render = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui-render.js'), 'utf8').replace(/\r\n/g, '\n');
assert.ok(/if \(offW === 1 && !G\.pendingAwards\) \{/.test(render),
  '年末表彰式が済むまで総括を描かない(ポップアップの背面に総括が見えない)');
assert.ok(/showAIGrowthAlerts\(aiAlerts, startAwardsChain\);/.test(advance),
  'AI成長ポップアップの完了後に表彰式チェーンを開始する');
assert.ok(/let awardsChainStarted = false;[\s\S]*?if \(awardsChainStarted\) return;[\s\S]*?App\._safeAwardsChain\(\);/.test(advance),
  '通常完了と保険発火が表彰式チェーンを二重起動しない');
// 時限保険は「式典待ちの記帳」まで。旧実装のように保険から式典チェーンを直接開始すると、
// ユーザーがログ・ランキング・新聞を閲覧中に無操作で式典が被さる(v1.31「勝手に始まる」報告)。
// 実際に開くのは _guardAwardsStage → _resumeInterruptedAnnualAwards が次のユーザー操作で行う。
assert.ok(/const armPendingCeremony = \(\) => \{[\s\S]*?_annualAwardsCeremonyPending:[\s\S]*?setTimeout\(armPendingCeremony, Math\.max\(8000, aiAlerts\.length \* 4000\)\);/.test(advance),
  'ポップアップ解消待ちのコールバックに時限保険(式典待ちの記帳)がある');
assert.ok(!/awards chain safety net fired/.test(advance),
  '時限保険が式典チェーンを直接開始している(閲覧中に式典が勝手に始まる旧実装)');
assert.ok(/if \(typeof _isPopupActive === 'function' && _isPopupActive\(\)\)/.test(advance),
  'アラートをまだ読んでいる間(コールバック生存中)は保険を延長せず記帳してしまう');

const finish = app.indexOf('const finishAwardsCeremony = () => {');
const report = app.indexOf('_showFarewellsThenReport()', finish);
const ceremony = app.indexOf('showAwardsCeremony(pendingAwards, finishAwardsCeremony', report);
assert.ok(finish >= 0 && report > finish && ceremony > report,
  '表彰式の完了コールバック内で総括表示へ進み、そのコールバックを式典へ渡す');

console.log('awards-before-report-order-test: ok');
