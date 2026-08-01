// industry-news-to-newspaper-test.js
//
// 2026-07-27: 業界ニュースを 📰新聞 へ一本化した件の安全網。
//
// それまでは _newsEvents という独立キューに溜め、小さなポップアップ(showNewspaperPanel)で
// 1回だけ見せて **state から消していた**。実測でシーズン境界に4本がこの経路を通り、
// その4本は最新号にも24号ぶんのバックナンバーにも1本も入っていなかった。
// オーバーレイの外側を1回押すと何枚あっても全部閉じる作りだったので、
// 見落とすと二度と読めない状態だった。
//
// 守りたいのは3つ。
//  (1) 旧パネルが復活していないこと（開く側・DOM・CSSごと撤去した）
//  (2) 記事が新聞のキューへ積まれること
//  (3) **紙面に載らなかった分が翌号へ持ち越されること**
//      掲載枠は限られている(新聞再設計P1で一面1+サブ3 → 一面1+サブ7)。以前は毎週キューを
//      まるごと空にしていたので、
//      まとめて積まれた週は溢れた記事が黙って消えていた。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

console.log('=== 業界ニュース → 新聞 一本化 ===\n');

// ─────────────────────────────────────────────────────────────
// (1) 旧パネルが復活していない
// ─────────────────────────────────────────────────────────────

section('1. 旧「新聞パネル」が開く側ごと撤去されたままである', () => {
  const uiCommon = read('src/ui-common.js');
  const indexHtml = read('src/index.html');
  const appJs = read('src/app.js');

  assert.ok(!/function showNewspaperPanel\s*\(/.test(uiCommon),
    'showNewspaperPanel が復活している。業界ニュースは📰新聞へ一本化した');
  assert.ok(!/id="newspaperOverlay"/.test(indexHtml),
    'newspaperOverlay の DOM が復活している');
  assert.ok(!/^\.newspaper-overlay\{/m.test(indexHtml),
    '.newspaper-overlay の CSS が復活している');
  // 背景クリックで「何枚あっても全部閉じる」導線が二度と生えないこと
  assert.ok(!/window\._newsClose\s*\(\)/.test(indexHtml),
    '背景クリックで記事キューごと閉じる導線が復活している');
});

// ─────────────────────────────────────────────────────────────
// (2) 記事は新聞のキューへ積まれる
// ─────────────────────────────────────────────────────────────

section('2. _pushNewsEvent は新聞のキュー(_industryNewsEvents)へ積む', () => {
  const appJs = read('src/app.js');
  const at = appJs.indexOf('_pushNewsEvent(ev) {');
  assert.ok(at > 0, '_pushNewsEvent が見つからない');
  const body = appJs.slice(at, at + 260);
  assert.ok(/Engine\.industryNews\.push/.test(body),
    '_pushNewsEvent が新聞のキューへ積んでいない');
  assert.ok(!/_newsEvents:/.test(body),
    '_pushNewsEvent がまだ独立キュー(_newsEvents)へ積んでいる。消える経路が復活する');
});

section('2-b. 旧セーブに残った _newsEvents は捨てずに新聞へ移す', () => {
  const appJs = read('src/app.js');
  const at = appJs.indexOf('_showNewsPanelIfNeeded(callback) {');
  assert.ok(at > 0, '_showNewsPanelIfNeeded が見つからない');
  const body = appJs.slice(at, at + 500);
  assert.ok(/Engine\.industryNews\.push/.test(body),
    '旧キューの中身が新聞へ移されていない（既存セーブの記事が黙って消える）');
});

// ─────────────────────────────────────────────────────────────
// (3) 載らなかった記事は翌号へ持ち越す（エンジンを実際に動かして確認）
// ─────────────────────────────────────────────────────────────

// 掲載枠(一面1+サブ7 = 8本)を確実に超える本数を、テンプレートのある type で積む
function stateWithQueuedNews(count) {
  const G = Engine.createInitialState(31337, true);
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push({
      type: 'breakthrough',
      characterId: null,
      data: { name: `選手${i}`, org: 'テスト団体', detail: 'PWを大きく伸ばした' },
    });
  }
  return { ...G, offSeason: false, week: 5, _industryNewsEvents: events };
}

section('3-a. 紙面に載らなかった業界ニュースが unpublishedIndustryEvents で返る', () => {
  const s = stateWithQueuedNews(10);
  const wp = Engine.newspaper.generate(s, Engine.rng.create(7));
  const published = [wp.topStory, ...(wp.subStories || [])].filter(Boolean).length;
  assert.ok(published > 0, '1本も紙面に載っていない');
  assert.ok(Array.isArray(wp.unpublishedIndustryEvents),
    'unpublishedIndustryEvents が返っていない。持ち越しができず溢れた記事が消える');
  assert.ok(wp.unpublishedIndustryEvents.length > 0,
    `10本積んだのに持ち越しが0件（掲載は最大8本のはず。published=${published}）`);
  assert.strictEqual(
    wp.unpublishedIndustryEvents.length + published, 10,
    `載った本数(${published})と持ち越し(${wp.unpublishedIndustryEvents.length})の合計が積んだ10本に合わない`
  );
});

section('3-b. 紙面に載った記事は持ち越さない（同じ記事が翌号にも出ない）', () => {
  const s = stateWithQueuedNews(6);
  const wp = Engine.newspaper.generate(s, Engine.rng.create(11));
  const published = [wp.topStory, ...(wp.subStories || [])].filter(Boolean).length;
  assert.ok(wp.unpublishedIndustryEvents.length < 6,
    '全件が持ち越されている。載った分も翌号に再掲される');
  assert.strictEqual(wp.unpublishedIndustryEvents.length, 6 - published,
    '持ち越し件数が「積んだ数 − 載った数」になっていない');
});

section('3-c. テンプレートの無い type は持ち越さない（キューに永久に居座らせない）', () => {
  const G = Engine.createInitialState(31337, true);
  const s = { ...G, offSeason: false, week: 5, _industryNewsEvents: [
    { type: '__no_such_template__', data: {} },
    { type: 'breakthrough', data: { name: 'A', org: 'B', detail: 'PWを大きく伸ばした' } },
  ] };
  const wp = Engine.newspaper.generate(s, Engine.rng.create(3));
  assert.ok(
    !wp.unpublishedIndustryEvents.some(e => e.type === '__no_such_template__'),
    '記事にできない type を持ち越している。永久にキューへ居座り枠を食う'
  );
});

section('3-d. tickWeek が持ち越しを次週へ渡し、上限を超えたら古い方から捨てる', () => {
  const mgmt = read('src/management.js');
  const at = mgmt.indexOf('const INDUSTRY_CARRY_MAX = 12;');
  assert.ok(at > 0, 'tickWeek が持ち越しを受け取っていない');
  assert.ok(/const _carryOver = \(weeklyNewspaper\.unpublishedIndustryEvents \|\| \[\]\)/.test(mgmt),
    'tickWeek が generate の持ち越しを受け取っていない');
  const body = mgmt.slice(at, at + 1500);
  assert.ok(!/_industryNewsEvents:\s*\[\]/.test(body),
    'キューをまるごと空にする実装に戻っている。溢れた記事がまた消える');
  assert.ok(/INDUSTRY_CARRY_MAX/.test(body),
    '持ち越し上限が無い。溜まり続けて新しいニュースを押しのける');
  assert.ok(/slice\(_carryOver\.length - INDUSTRY_CARRY_MAX\)/.test(body),
    '上限超過時に古い方から捨てていない');
  // バックナンバー24号ぶんに持ち越しリストが複製されないこと
  assert.ok(/unpublishedIndustryEvents: _unpub, \.\.\.weeklyNewspaperClean/.test(body),
    '持ち越しリストを weeklyNewspaper から外していない。セーブに同じイベントが何十本も複製される');
});

section('3-e. 持ち越しには期限がある（時限性のある記事が後の号に出ない）', () => {
  const mgmt = read('src/management.js');
  const at = mgmt.indexOf('const INDUSTRY_CARRY_MAX = 12;');
  assert.ok(at > 0, '持ち越しの上限が見つからない');
  const body = mgmt.slice(at, at + 1200);
  assert.ok(/INDUSTRY_CARRY_MAX_AGE/.test(body),
    '持ち越しに期限が無い。「第12週に激突する」のような時限性のある告知が何週も後の号に載り、'
    + '開催済みの大会をこれから開催すると報じてしまう');
  assert.ok(/_carryFromAbsWeek/.test(body), '記事がいつのものか刻んでいない');
  assert.ok(/\.filter\(ev => \(_nowAbs - ev\._carryFromAbsWeek\) < INDUSTRY_CARRY_MAX_AGE\)/.test(body),
    '期限切れを捨てていない');
});

// ─────────────────────────────────────────────────────────────
// (4) シーズン開幕号の知らせ
// ─────────────────────────────────────────────────────────────

section('4. シーズン開幕号は既存の号外フレームで知らせる', () => {
  const appJs = read('src/app.js');
  const uiCommon = read('src/ui-common.js');
  const at = appJs.indexOf('_maybeShowBigNewsPopup(delay) {');
  assert.ok(at > 0, '_maybeShowBigNewsPopup が見つからない');
  // 固定長で切ると、関数にコメントを足しただけで検査対象が窓から外れる
  // (2026-08-01 に 900 で外れた)。関数の終わりまでを対象にする
  const body = (() => {
    const open = appJs.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < appJs.length; i++) {
      if (appJs[i] === '{') depth++;
      if (appJs[i] === '}') { depth--; if (depth === 0) return appJs.slice(at, i + 1); }
    }
    return appJs.slice(at, at + 2000);
  })();
  assert.ok(/G\.week === 1/.test(body) && /G\.season \|\| 1\) > 1/.test(body),
    '開幕号の判定が「新シーズンの第1週」になっていない');
  // 変数を作るだけで早期 return に使っていないと、開幕号は誰にも知らされないまま素通りする
  assert.ok(/if \(!wp\.isBigNews && !isSeasonOpening\) return;/.test(body),
    '開幕号が早期 return の条件に入っていない。'
    + '大ニュースの週以外は素通りするので、オフに溜まった記事が知らされない');
  assert.ok(/showBigNewsPopup\([^)]*isSeasonOpening[^)]*\)|'seasonOpening'/.test(body),
    '開幕号の variant が号外ポップアップへ渡っていない');
  // 号外フレームは使い回す（新しい枠を作らない）
  assert.ok(/showBigNewsPopup\(topStory, variant\)/.test(uiCommon),
    '号外ポップアップが variant を受け取らない');
  assert.ok(/SEASON_OPENING_NEWS_LEAD_LINES/.test(uiCommon),
    '開幕号の文言が使われていない');
  assert.ok(typeof SEASON_OPENING_NEWS_LEAD_LINES !== 'undefined'
    && SEASON_OPENING_NEWS_LEAD_LINES.length > 0, '開幕号のリード文が定義されていない');
});

console.log('');
console.log(failed === 0 ? 'Result: ALL PASS ✓' : `Result: ${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
