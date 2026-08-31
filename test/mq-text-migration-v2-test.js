'use strict';

// MQ表記一掃のロード時テキスト移行(v2)の回帰ガード(2026-08-31)。
//
// v1(fc637de)は実セーブ棚のD3検出(MQ exposed in visible text)で取りこぼしが判明した:
//   ① currentNewspaper(新聞playerShowDataの供給元)と mvpRace(記録タブの語り)が
//      対象リストから漏れていた
//   ② 「沸かせ、MQ 84」「攻防はMQ 76」「興行でMQ98」の和文直結型がどのパターンにも
//      掛からなかった
// v2はキー2本の追加+和文字直結パターンの追加+フラグ再走(_migrated_mq_text_v2)。
// このテストは app.js の実移行ブロックを抽出して実行し、実セーブから採った実物の
// 焼き込み文字列で「可視のMQトークンが残らない/内部識別子は無傷/冪等/v1適用済み
// セーブも再走される」を固定する。

const assert = require('assert');
const { readSource } = require('./helpers/source');

const appSrc = readSource('src', 'app.js');

// `if (!G._migrated_mq_text_v2) { ... }` ブロックを波括弧対応で丸ごと抽出
const sig = 'if (!G._migrated_mq_text_v2) {';
const start = appSrc.indexOf(sig);
assert.ok(start >= 0, 'v2移行ブロックがapp.jsに存在する');
const brace = appSrc.indexOf('{', start + sig.length - 1);
let depth = 0, end = -1;
for (let i = brace; i < appSrc.length; i++) {
  if (appSrc[i] === '{') depth++;
  if (appSrc[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
assert.ok(end > 0, 'v2移行ブロックの終端が見つかる');
const migrate = new Function('G', `${appSrc.slice(start, end)} return G;`);

// 走破検出器と同じ「可視MQトークン」判定(detectors.js のパターンと揃える)
const VISIBLE_MQ = /\bMQ(?![A-Za-z])/;

// 実セーブ(ultralong/prerefix)から採った実物の焼き込み文字列
const burned = () => ({
  currentNewspaper: {
    subheadline: 'アリーナ大会、観客6,000人。全5試合平均MQ 63——好カード続出の第27回興行',
    article: '互いの手の内を知り尽くした二人の攻防はMQ 76を記録。観客を沸かせ、MQ 84を記録した。',
    avgMQ: 78, // 内部キー(数値)は対象外
  },
  mvpRace: {
    rankings: [
      { narrative: '第32週、リナ・モーガンとの通常興行でMQ98を刻み、惜敗を喫した記憶も新しい' },
    ],
  },
  weeklyNewspaper: {
    topStory: { body: '8ターンの試合は5,052人の観客を沸かせ、MQ 84を記録した。' },
  },
  gameLog: [
    '🏟️ 超満員の熱気（MQ全試合 +5）',
    '📊 ★4 (MQ avg 80) → 団体人気+0.2 (現在: 74)',
    'careerBestMQ', // 内部識別子そのままの文字列: 触ってはいけない
  ],
});

let sectionsRun = 0;
function section(name, fn) { fn(); sectionsRun++; console.log(`  [ok] ${name}`); }

section('v2 leaves no visible MQ token in currentNewspaper / mvpRace / weeklyNewspaper / gameLog', () => {
  const out = migrate(burned());
  assert.ok(!VISIBLE_MQ.test(out.currentNewspaper.subheadline), `subheadline: ${out.currentNewspaper.subheadline}`);
  assert.ok(!VISIBLE_MQ.test(out.currentNewspaper.article), `article: ${out.currentNewspaper.article}`);
  assert.ok(!VISIBLE_MQ.test(out.mvpRace.rankings[0].narrative), `narrative: ${out.mvpRace.rankings[0].narrative}`);
  assert.ok(!VISIBLE_MQ.test(out.weeklyNewspaper.topStory.body), `body: ${out.weeklyNewspaper.topStory.body}`);
  assert.ok(!VISIBLE_MQ.test(out.gameLog[0]) && !VISIBLE_MQ.test(out.gameLog[1]),
    'v1で拾えていた型もv2で引き続き拾える');
  assert.strictEqual(out._migrated_mq_text_v2, true, 'v2マーカーが立つ');
});

section('internal identifiers and numeric keys survive untouched', () => {
  const out = migrate(burned());
  assert.strictEqual(out.gameLog[2], 'careerBestMQ', '識別子文字列は書き換えない(直前が英字)');
  assert.strictEqual(out.currentNewspaper.avgMQ, 78, '数値の内部キーは対象外');
});

section('reruns on saves already migrated by v1 (the whole point of the v2 flag)', () => {
  const G = burned();
  G._migrated_mq_text_v1 = true; // v1適用済みだが和文直結型が取り残されているセーブ
  const out = migrate(G);
  assert.ok(!VISIBLE_MQ.test(out.currentNewspaper.article), 'v1フラグ立ちでもv2は再走して掃除する');
});

section('idempotent: running twice yields identical text', () => {
  const once = migrate(burned());
  const twice = migrate(JSON.parse(JSON.stringify(once)));
  assert.strictEqual(JSON.stringify(twice.currentNewspaper), JSON.stringify(once.currentNewspaper));
  assert.strictEqual(JSON.stringify(twice.gameLog), JSON.stringify(once.gameLog));
});

console.log(`mq-text-migration-v2-test: ${sectionsRun} sections ok`);
