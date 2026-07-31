'use strict';

// 新年号を「第1週に入った時点」で発行する (task-52 / 2026-07-31 Keisuke指示)
//
// 従来: 新聞は tickWeek の末尾で作られる。オフシーズン中は発行されないので、
//       引退・殿堂入り・他団体の動きは翌シーズン第1週の号にまとめて載る。
//       通知は週処理の中から遅延で鳴るため、**画面が第2週になってから**出ていた。
// 変更: シーズン移行の時点で1号発行する。第1週に入った瞬間に読める号があり、
//       通知もそこで鳴る。第1週を処理し終えると通常どおり第1週の号がもう1号出て、
//       新年号はアーカイブへ落ちる(同じ週に2号出るのは承認済み)。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
// 新聞生成は data.js の定数(FRESHNESS_CONFIG 等)を参照するので、
// management.js を単体 require せず、ゲーム一式をグローバルへ読み込む。
const { loadGame } = require('./helpers/load-game.js');
loadGame({ full: true });
const Engine = global.Engine;

const root = path.join(__dirname, '..');
const mgmt = fs.readFileSync(path.join(root, 'src', 'management.js'), 'utf8').replace(/\r\n/g, '\n');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const stripComments = t => t.replace(/\/\/[^\n]*/g, '');

const rng = () => Engine.rng.create(12345);

function baseState(overrides = {}) {
  return {
    season: 2,
    week: 1,
    offSeason: false,
    rngSeed: 4242,
    orgName: 'テスト団体',
    roster: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
    aiOrgs: {},
    gameLog: [],
    _industryNewsEvents: [],
    ...overrides,
  };
}

// ── 1. publish は1号出して、前の号をバックナンバー先頭へ退避する ──
{
  const prev = { season: 1, week: 48, topStory: { headline: '前号' }, subStories: [] };
  const s = Engine.newspaper.publish(baseState({ weeklyNewspaper: prev }), rng());
  assert.ok(s.weeklyNewspaper, '新しい号が発行されていない');
  assert.strictEqual(s.newspaperArchive[0], prev, '前号がバックナンバー先頭に退避されていない');
}

// ── 2. 新年号の印と playerShowData の扱い ──
{
  const s = Engine.newspaper.publish(
    baseState({ currentNewspaper: { bogus: true } }), rng(),
    { isSeasonOpening: true, forcePlayerShowDataNull: true });
  assert.strictEqual(s.weeklyNewspaper.isSeasonOpening, true, '新年号の印が立っていない');
  assert.strictEqual(s.weeklyNewspaper.playerShowData, null,
    '新年号に前シーズン末の興行データが紛れ込んでいる');
  assert.strictEqual(s.weeklyNewspaper.week, 1, '新年号が第1週の号になっていない');
}

// ── 3. 通常発行では新年号の印を立てない ──
{
  const s = Engine.newspaper.publish(baseState(), rng());
  assert.ok(!s.weeklyNewspaper.isSeasonOpening, '通常の号に新年号の印が立っている');
}

// ── 4. 溜まった記事が1本も消えない(載らなかった分は持ち越す) ──
{
  // 掲載枠は一面1+サブ3の4本しかない。多めに積んで、溢れた分が持ち越されることを見る。
  const many = Array.from({ length: 10 }, (_, i) => ({
    type: 'retirement', characterId: i + 1, season: 2, week: 1,
    data: { name: `選手${i + 1}` },
  }));
  const s = Engine.newspaper.publish(baseState({ _industryNewsEvents: many }), rng());
  const carried = s._industryNewsEvents || [];
  assert.ok(carried.length > 0, '載り切らなかった記事が持ち越されていない(黙って消えている)');
  assert.ok(carried.length < many.length, '1本も消化されていない');
  carried.forEach(ev => assert.ok(ev._carryFromAbsWeek != null,
    '持ち越しに「いつの記事か」が刻まれていない(期限切れ判定ができない)'));
  // 発行号に unpublishedIndustryEvents を残さない(セーブに何十本も複製される)
  assert.ok(!('unpublishedIndustryEvents' in s.weeklyNewspaper),
    '発行号に持ち越しリストが残っている');
}

// ── 5. 同じ入力なら同じ結果(シード再現性・アーキテクチャ原則4) ──
{
  const mk = () => Engine.newspaper.publish(baseState({
    _industryNewsEvents: [{ type: 'retirement', characterId: 1, season: 2, week: 1, data: { name: 'A' } }],
  }), rng());
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(mk().weeklyNewspaper)),
    JSON.parse(JSON.stringify(mk().weeklyNewspaper)),
    '同じ state から2回発行して結果が違う(乱数が種から導出されていない)');
}

// ── 6. 手順が2箇所に書き写されていないこと ──
{
  const src = stripComments(mgmt);
  assert.ok(/s = Engine\.newspaper\.publish\(s, newsRng\);/.test(src),
    'tickWeek が共通手順(publish)を使っていない');
  assert.ok(/Engine\.newspaper\.publish\(s, newYearRng, \{ isSeasonOpening: true, forcePlayerShowDataNull: true \}\)/.test(src),
    'シーズン移行部で新年号を発行していない');
  // バックナンバー退避のコードが publish 以外に残っていないか
  const archivePushes = (src.match(/archive\.unshift\(s\.weeklyNewspaper\)/g) || []).length;
  assert.strictEqual(archivePushes, 1,
    'バックナンバー退避が複数箇所に書かれている。片方だけ古くなるので publish に寄せること');
}

// ── 7. 1年目には新年号を出さない ──
{
  const src = stripComments(mgmt);
  const at = src.indexOf('Engine.newspaper.publish(s, newYearRng');
  assert.ok(at > 0);
  const before = src.slice(Math.max(0, at - 400), at);
  assert.ok(/if \(s\.season > 1\)/.test(before),
    '1年目にも新年号を出そうとしている(前シーズンが無いので中身が空になる)');
}

// ── 8. 週次の号と別の乱数系列か ──
{
  const src = stripComments(mgmt);
  const weekly = src.match(/Engine\.rng\.derive\(s\.rngSeed, s\.season, s\.week, (0x[0-9A-Fa-f]+)\)[\s\S]{0,200}?newsRng/);
  const newYear = src.match(/const newYearRng = Engine\.rng\.create\(Engine\.rng\.derive\(s\.rngSeed, s\.season, s\.week, (0x[0-9A-Fa-f]+)\)\)/);
  assert.ok(newYear, '新年号の乱数がシードから導出されていない');
  if (weekly) {
    assert.notStrictEqual(weekly[1], newYear[1],
      '新年号が週次の号と同じ種を使っている。同じ抽選になるので別系列にすること');
  }
}

// ── 9. 通知が第1週の到着時に1回だけ鳴るか ──
{
  const src = stripComments(app);
  assert.ok(/if \(!G\.offSeason && G\.week === 1 && \(G\.season \|\| 1\) > 1\) \{\s*App\._maybeShowBigNewsPopup\(/.test(src),
    '新年号の通知が「第1週に到着した時点」から呼ばれていない');
  // 1回だけの制御は既存の _bigNewsNotifiedWeek(season:week キー)に任せる
  const start = app.indexOf('  _maybeShowBigNewsPopup(delay) {');
  assert.ok(start >= 0, '_maybeShowBigNewsPopup が無い');
  const body = app.slice(start, app.indexOf('\n  },', start));
  assert.ok(/_bigNewsNotifiedWeek === weekKey/.test(body),
    '同じ週に二度鳴らない制御が外れている');
}

console.log('new-year-issue-test: ok');
