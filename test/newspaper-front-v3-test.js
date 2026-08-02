// newspaper-front-v3-test.js
//
// 新聞再設計 P1「紙面骨格」の安全網。
// 仕様: docs/newspaper-redesign-spec-v0.2.md §1 / §6(P1)
// 承認済みモック: docs/ui/mockups/newspaper-redesign-best-v0.3.html
//
// P1 で守りたいこと:
//   (1) 一面が「トップ / 肩 / MVP小窓 / 準トップ / 小記事2+短信 / 黒田コラム / きょうの紙面」
//       の枠を持ち、記事は PRIORITY の順位のまま上から流し込まれること
//   (2) 枠が増えたぶん subStories の上限を広げても、**溢れた記事の翌号持ち越しを殺さない**こと
//   (3) バックナンバー(layout を持たない旧号)は旧レイアウトのまま出ること
//   (4) 写真は本文に従属する脇役のまま(トップ190×228 / 肩84×126 / 小46×66)で、反転しないこと
//   (5) 黒田コラムは最下段固定、MVP小窓は最新号だけ(過去号に今の順位を貼らない)
//
// P2以降(採点の合成点化・不足ニュース源・特集化・MVP本文)はここでは見ない。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));

loadGame({ full: true });

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const renderSrc = read('src/ui-render.js');
const mgmtSrc = read('src/management.js');
const htmlSrc = read('src/index.html');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); }
}

console.log('=== 新聞 一面 v3(紙面骨格) ===\n');

// ─────────────────────────────────────────────────────────────
// セットアップ: 純関数を ui-render.js から抜き出して実行
// ─────────────────────────────────────────────────────────────

function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `${name} が src/ui-render.js に無い`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`could not extract ${name}`);
}
function fnBody(name) {
  return extractFunction(renderSrc, name);
}

const pureCtx = vm.createContext({});
vm.runInContext([
  fnBody('_npV3Paragraphs'),
  fnBody('_npV3Briefs'),
  fnBody('_npV3PrimaryId'),
].join('\n'), pureCtx);

// 紙面に載った記事の総数(スロット割り付けと同じ数え方)
function publishedCount(wp) {
  return [wp.topStory, ...(wp.subStories || [])].filter(Boolean).length;
}
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

// ─────────────────────────────────────────────────────────────
// A. produce側 — 枠が増え、持ち越しの弁は残っている
// ─────────────────────────────────────────────────────────────

section('A1. 新規生成号は layout:"v3" を持つ(新レイアウトの目印)', () => {
  const wp = Engine.newspaper.generate(stateWithQueuedNews(2), Engine.rng.create(5));
  assert.strictEqual(wp.layout, 'v3',
    'layout が付いていない。振り分けができず新レイアウトに切り替わらない');
});

section('A2. 一面の枠は トップ1 + サブ7 = 8本まで', () => {
  const wp = Engine.newspaper.generate(stateWithQueuedNews(20), Engine.rng.create(5));
  assert.strictEqual(wp.subStories.length, 7,
    `subStories が ${wp.subStories.length} 本。肩/準トップ/小2/短信3 の7枠に足りない(または増えすぎ)`);
  assert.strictEqual(publishedCount(wp), 8);
});

section('A3. 枠を広げても、溢れた記事は翌号へ持ち越す(弁を殺していない)', () => {
  // 短信で全部飲み込むと「来週なら肩に載れた記事」が一行で消費されてしまう
  const wp = Engine.newspaper.generate(stateWithQueuedNews(20), Engine.rng.create(7));
  assert.ok(wp.unpublishedIndustryEvents.length > 0,
    '20本積んだのに持ち越しが0件。溢れた記事がその場で消えている');
  assert.strictEqual(wp.unpublishedIndustryEvents.length + publishedCount(wp), 20,
    '載った本数と持ち越しの合計が積んだ本数に合わない');
});

section('A4. 枠に収まる号は持ち越しが出ない', () => {
  const wp = Engine.newspaper.generate(stateWithQueuedNews(4), Engine.rng.create(11));
  assert.strictEqual(wp.unpublishedIndustryEvents.length, 0,
    '枠が空いているのに持ち越している');
});

// ─────────────────────────────────────────────────────────────
// B. レイアウトの振り分け — 旧号は旧レイアウトのまま
// ─────────────────────────────────────────────────────────────

section('B1. layout:"v3" の号だけ新レイアウトへ振り分ける', () => {
  assert.ok(/wp\.layout === 'v3'\s*\)?\s*[\r\n]?\s*\?\s*_npFrontV3\(/.test(renderSrc),
    '振り分けが見つからない。全号が同じレイアウトで描かれている');
  assert.ok(/:\s*_npFrontLegacy\(/.test(renderSrc),
    '旧レイアウトへのフォールバックが無い。バックナンバーが壊れる');
});

section('B2. 旧レイアウトの描画関数を消していない(マイグレーションしない約束)', () => {
  assert.ok(/function _npFrontLegacy\(/.test(renderSrc),
    '_npFrontLegacy が無い。layout を持たない旧号を描けない');
});

// ─────────────────────────────────────────────────────────────
// C. スロット割り付け — PRIORITY の順位のまま上から流す
// ─────────────────────────────────────────────────────────────

section('C1. トップ→肩→準トップ→小記事2→短信 の順に流し込んでいる', () => {
  const body = fnBody('_npFrontV3');
  assert.ok(/const shoulder = subs\[0\]/.test(body), `肩が subStories[0] ではない:\n${body.slice(0, 400)}`);
  assert.ok(/const junTop = subs\[1\]/.test(body), '準トップが subStories[1] ではない');
  assert.ok(/const smalls = subs\.slice\(2, 4\)/.test(body), '小記事が subStories[2..3] ではない');
  assert.ok(/const briefs = subs\.slice\(4\)/.test(body), '短信が subStories[4..] ではない');
});

section('C2. 一面の定位置が全部ある(トップ/肩/MVP小窓/準トップ/小/短信/コラム/目次)', () => {
  const body = fnBody('_npFrontV3');
  [
    ['_npV3IndexBar', 'きょうの紙面(目次)'],
    ['_npV3TopStory', 'トップ記事'],
    ['_npV3Shoulder', '肩記事'],
    ['_npV3MvpBox', 'MVP小窓'],
    ['_npV3JunTop', '準トップ'],
    ['_npV3Small', '小記事'],
    ['_npV3Briefs', '短信'],
    ['_npV3KurodaColumn', '黒田コラム'],
  ].forEach(([fn, label]) => {
    assert.ok(body.includes(fn + '('), `${label}(${fn})が一面に無い`);
  });
});

section('C3. 黒田コラムは最下段固定(小記事より後・つづきより前)', () => {
  const body = fnBody('_npFrontV3');
  const smallAt = body.indexOf('_npV3Briefs(');
  const kurodaAt = body.indexOf('_npV3KurodaColumn(');
  const contAt = body.indexOf('_npRenderPlayerShow(');
  assert.ok(smallAt >= 0 && kurodaAt >= 0 && contAt >= 0);
  assert.ok(kurodaAt > smallAt, 'コラムが下段記事より上にある。コラムは定位置が命');
  assert.ok(kurodaAt < contAt, 'コラムが一面のつづきより後に落ちている');
});

section('C4. 自団体興行の詳報は一面の下へそのまま続ける(面をめくらせない)', () => {
  const body = fnBody('_npFrontV3');
  assert.ok(/id="npShowDetail"/.test(body), 'つづきの行き先(アンカー)が無い');
  assert.ok(/_npSwapMainToSecondCard\(/.test(body),
    '一面トップが自団体興行のとき、詳報のメインを繰り上げていない。同じ試合を二度語ることになる');
});

section('C5. MVP小窓は最新号だけ(過去号に今の順位を貼らない)', () => {
  const body = fnBody('_npV3MvpBox');
  assert.ok(/if \(!isLatest\) return '';/.test(body),
    'バックナンバーにも今週のMVP順位が出る。号と中身が食い違う');
});

// ─────────────────────────────────────────────────────────────
// D. 本文の段落割り — 記事文は書き換えず、割り位置だけ決める
// ─────────────────────────────────────────────────────────────

// vm の別コンテキストで作られた配列は prototype が違うので、比較前に自realmへ写す
const P = s => Array.from(pureCtx._npV3Paragraphs(s));

section('D1. 短い本文は割らない', () => {
  const s = '第14週興行のメインで阿武隈塔子が勝利した。';
  assert.deepStrictEqual(P(s), [s]);
});

section('D2. ｜区切りの記事は既存の区切りを尊重する(mqTagRecord)', () => {
  assert.deepStrictEqual(P('前半の記録事実。｜後半の称賛。'), ['前半の記録事実。', '後半の称賛。']);
});

section('D3. 長いベタ文は複数段に割れる', () => {
  const s = 'あ'.repeat(60) + '。' + 'い'.repeat(60) + '。' + 'う'.repeat(60) + '。' + 'え'.repeat(60) + '。';
  const out = P(s);
  assert.ok(out.length >= 2, `割れていない(${out.length}段)`);
  assert.strictEqual(out.join(''), s, '割った結果を繋ぐと元の本文に戻らない(文字が消えている)');
});

section('D4. 段数は4段まで', () => {
  const s = ('か'.repeat(40) + '。').repeat(30);
  assert.ok(P(s).length <= 4, '5段以上に割れている');
});

section('D5. セリフの閉じ括弧の直前では割らない', () => {
  const s = '第13週興行で右膝を負傷した高津小春は、全治14週と診断された。本人は前を向いていた。'
    + '「必ず戻ってきます。」と短く言い残し、控室を後にした。'
    + 'コーチ陣は復帰時期について明言を避けた。戦線への影響は小さくない。'
    + '本紙の取材に、団体側は代役の起用を検討していると答えた。次週の会見で方針が示される見込みだ。'
    + '今季の成績は9勝2敗、MVPレースでも4位につけていた。追う側から一転、追われる立場を離れる。';
  const out = P(s);
  assert.ok(out.length >= 2, '長文なのに割れていない');
  out.forEach(p => {
    assert.ok(!p.startsWith('」'), `段落が閉じ括弧で始まっている(セリフを断ち切った): ${p}`);
  });
});

section('D6. 空の本文でも落ちない', () => {
  assert.deepStrictEqual(P(''), []);
  assert.deepStrictEqual(P(null), []);
  assert.deepStrictEqual(P(undefined), []);
});

// ─────────────────────────────────────────────────────────────
// E. 短信 — 1本ずつ枠を取らず「▼」で連結する
// ─────────────────────────────────────────────────────────────

section('E1. 短信は見出しを▼で連結する', () => {
  const html = pureCtx._npV3Briefs([{ headline: 'あああ' }, { headline: 'いいい' }]);
  assert.ok(html.includes('あああ') && html.includes('いいい'), html);
  assert.ok(html.includes('▼'), '区切りの▼が無い: ' + html);
  assert.ok(!/np-v3-small/.test(html), '短信が小記事の枠を取っている: ' + html);
});

section('E2. 短信が無い週は何も出さない(枠だけ残さない)', () => {
  assert.strictEqual(pureCtx._npV3Briefs([]), '');
  assert.strictEqual(pureCtx._npV3Briefs(null), '');
  assert.strictEqual(pureCtx._npV3Briefs([{ headline: '' }, null]), '');
});

// ─────────────────────────────────────────────────────────────
// F. 写真ルール — 本文に従属する脇役。反転禁止
// ─────────────────────────────────────────────────────────────

function cssBlock(selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = htmlSrc.match(new RegExp(esc + '\\s*\\{([^}]*)\\}'));
  assert.ok(m, `${selector} が index.html に無い`);
  return m[1];
}

section('F1. トップ写真は 190×228(モック v0.3 の寸法)', () => {
  const body = cssBlock('.np-v3-photo-top');
  assert.ok(/width:\s*190px/.test(body), `width が190pxではない: ${body}`);
  assert.ok(/height:\s*228px/.test(body), `height が228pxではない: ${body}`);
});

section('F2. 肩記事の写真は 84×126(2:3)', () => {
  const body = cssBlock('.np-v3-photo-kata');
  assert.ok(/width:\s*84px/.test(body) && /height:\s*126px/.test(body), body);
});

section('F3. 小記事・準トップの写真は既存の chip(46×66)を使い回す', () => {
  ['_npV3Small', '_npV3JunTop'].forEach(fn => {
    assert.ok(fnBody(fn).includes('_npSubPhotoHtml('),
      `${fn} が chip 写真ヘルパーを使っていない。梯子から外れた枠を作っている`);
  });
});

section('F4. アッパー画像を左右反転していない', () => {
  const v3Rules = [...htmlSrc.matchAll(/\.np-v3-[a-z0-9-]*[^{}]*\{([^}]*)\}/g)].map(m => m[1]).join(' ');
  assert.ok(!/scaleX\(\s*-1/.test(v3Rules), '一面 v3 のどこかで画像を反転している(顔が崩れる)');
});

section('F5. 新しい16進カラーを足していない(紙面パレットの再利用)', () => {
  const v3Rules = [...htmlSrc.matchAll(/\.np-v3-[a-z0-9-]*[^{}]*\{([^}]*)\}/g)].map(m => m[1]).join(' ');
  const hexes = [...new Set([...v3Rules.matchAll(/#[0-9a-fA-F]{3,6}/g)].map(m => m[0].toLowerCase()))];
  assert.ok(hexes.length > 0, '色が1つも無い(想定外)');
  hexes.forEach(hex => {
    const all = (htmlSrc.match(new RegExp(hex, 'gi')) || []).length;
    const inV3 = (v3Rules.match(new RegExp(hex, 'gi')) || []).length;
    assert.ok(all > inV3, `${hex} は np-v3-* だけで使われている新規色。既存パレットから採ること`);
  });
});

// ─────────────────────────────────────────────────────────────
// G. レスポンシブ — 375px でも段組が崩れない
// ─────────────────────────────────────────────────────────────

section('G1. 820px以下で一面の段組が1列に落ちる', () => {
  const blocks = [...htmlSrc.matchAll(/@media \(max-width: 820px\)\s*\{([\s\S]*?)\n\}/g)].map(m => m[1]);
  assert.ok(blocks.length > 0, '@media (max-width: 820px) が無い');
  const all = blocks.join('\n');
  assert.ok(/\.np-v3-lead-grid\s*\{\s*grid-template-columns:\s*1fr;\s*\}/.test(all),
    'トップ+肩 の2段組が1列に落ちない');
  assert.ok(/\.np-v3-bottom-grid\.cols-2[^}]*\{\s*grid-template-columns:\s*1fr;/.test(all),
    '下段(小記事+短信)が1列に落ちない');
  assert.ok(/\.np-v3-cols\s*\{\s*columns:\s*1;\s*\}/.test(all),
    '本文の2段組が1段に落ちない');
});

section('G2. 820px以下でトップ写真は回り込みをやめて全幅になる', () => {
  const blocks = [...htmlSrc.matchAll(/@media \(max-width: 820px\)\s*\{([\s\S]*?)\n\}/g)].map(m => m[1]).join('\n');
  assert.ok(/\.np-v3-topfig\s*\{[^}]*float:\s*none/.test(blocks),
    '写真が float したまま。本文が細い柱になって読めない');
  assert.ok(/\.np-v3-photo-top\s*\{[^}]*width:\s*100%/.test(blocks), blocks.slice(0, 200));
});

section('G3. 下段の列数はインラインstyleではなくクラスで決める(メディアクエリで上書きできる)', () => {
  const body = fnBody('_npFrontV3');
  assert.ok(/np-v3-bottom-grid cols-\$\{cells\.length\}/.test(body),
    '列数をインライン style で書いている。インラインはメディアクエリより強く、スマホで崩れる');
});

// ─────────────────────────────────────────────────────────────
// H. 実際に描いてみる — 骨格が出る / 記事が無い週でも落ちない
// ─────────────────────────────────────────────────────────────

function makeRenderCtx() {
  const chars = [
    { id: 101, name: '阿武隈塔子' }, { id: 102, name: '高津小春' },
    { id: 103, name: '宇田川里奈' }, { id: 104, name: '深町真琴' },
    { id: 105, name: '林真尋' }, { id: 106, name: '橘玲美' },
  ];
  const ctx = {
    Engine,
    ALL_CHARS: chars,
    G: {
      season: 6, week: 14, orgName: 'テスト団体',
      roster: chars.slice(0, 3), aiOrgs: {},
      mvpRace: { rankings: [
        { rank: 1, fighterId: 106, fighterName: '橘玲美', points: 148.2 },
        { rank: 2, fighterId: 101, fighterName: '阿武隈塔子', points: 141 },
        { rank: 3, fighterId: 104, fighterName: '深町真琴', points: 126 },
        { rank: 4, fighterId: 102, fighterName: '高津小春', points: 118 },
        { rank: 5, fighterId: 105, fighterName: '林真尋', points: 111 },
      ] },
    },
    escHtml: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    getUpperUrl: id => `../image/upper/upper_${id}.webp`,
    getPortraitUrl: id => `../image/face/face_${id}.webp`,
    _findFighterOrgName: (_s, id) => (id ? 'テスト団体' : ''),
    _npOrgEmblem: () => '',
    _npKurodaFaceUrl: () => '',
    _getKurodaNewsComment: () => [() => '近道の無いことが、この商売の唯一の救いだ'],
    NP_KURODA_BYLINE: { news: '——黒田幸子(週刊グラップル)', rating: '——黒田幸子(本紙)', editorial: '——黒田幸子(編集部)' },
    _npRenderBignewsTag: () => '<article class="np-bignews-tag"></article>',
    _npRenderPlayerShow: () => '<section class="np-show-result">詳報</section>',
    _npSwapMainToSecondCard: d => d,
  };
  vm.createContext(ctx);
  vm.runInContext([
    '_npPhotoBg', '_npSubPhotoHtml', '_npFindFighterOrgKey', '_npSpringTagStoryIds', '_npTopTagPhotoHtml',
    '_npCrisisColumnHtml', '_npKurodaCommentText',
    '_npV3PrimaryId', '_npV3OrgLine', '_npV3Paragraphs', '_npV3IndexBar', '_npV3MvpBox',
    '_npV3KurodaColumn', '_npV3HofEntry', '_npV3IsHofRetirement', '_npV3HallOfFameRetirement',
    '_npV3TopStory', '_npV3Shoulder', '_npV3JunTop', '_npV3Small',
    '_npV3Briefs', '_npFrontV3',
  ].map(fnBody).join('\n'), ctx);
  return ctx;
}
const rctx = makeRenderCtx();

const fullIssue = {
  layout: 'v3', season: 6, week: 14,
  topStory: {
    type: 'playerTitleChange', characterId: 101,
    headline: '阿武隈塔子、ついに王座奪取', subhead: '3年越しの雪辱——7度目の対戦で下す',
    situation: '第6年度・第14週 タイトル戦',
    body: '第14週興行のメインイベントで阿武隈塔子が生駒エリカを破り、団体王座を獲得した。'
      + '試合時間18分42秒、最後は正面からの組み技で3カウント。初挑戦で敗れてから3年、7度目の対戦で初めてベルトが腰に巻かれた。'
      + '序盤は王者のペースだった。生駒の打撃が阿武隈の出足を止め、場内には嫌な沈黙が流れる。'
      + 'だが中盤、阿武隈は被弾を覚悟で距離を詰め、試合の重心を組みに引きずり込んだ。'
      + '通算成績はなお生駒の4勝3敗。それでも今夜の歓声は、この3年間を見続けた者への報酬だった。'
      + '防衛戦線は来月から始まる。新王者に休む間はない。',
  },
  subStories: [
    { type: 'aiPracticeInjury', characterId: 102, headline: '高津小春、右膝負傷で全治14週', body: '第13週興行で右膝を負傷、全治14週と診断された。今季9勝2敗、絶好調の中での離脱となった。' },
    { type: 'juniorTournamentPreview', characterId: 103, headline: 'ジュニアカップ来週開幕——本命不在、16名の混戦へ', body: '若手16名が集う夏の祭典が来週開幕する。前年覇者が卒業した今年は本命不在の混戦模様。トーナメント表は今週末の公開抽選で決まる。注目は初出場の宇田川里奈。' },
    { type: 'aiBreakthrough', characterId: 104, headline: '深町真琴、10連勝で記録に王手', body: '団体記録まであと2。次週の相手は因縁の富岡加奈子。' },
    { type: 'aiShowHighlight', characterId: 105, headline: '林真尋、スランプ脱出を宣言', body: '6週ぶりの白星に控室では涙も見えた。' },
    { type: 'factionCamp', characterId: null, headline: 'ノヴァインパクトが新体制を発表' },
    { type: 'general', characterId: null, headline: '大会場は第16週から座席を約1割増設' },
    { type: 'general', characterId: null, headline: '週間観客動員は4団体合計18,240人' },
  ],
  playerShowData: { left: { id: 101 }, right: { id: 102 } },
};

section('H1. 記事が揃った号を描くと、一面の枠がすべて出る', () => {
  const html = rctx._npFrontV3(fullIssue, 6, 14, true);
  [
    ['np-v3-indexbar', 'きょうの紙面'],
    ['np-v3-top', 'トップ記事'],
    ['np-v3-photo-top', 'トップ写真'],
    ['np-v3-kata', '肩記事'],
    ['np-v3-mvpbox', 'MVP小窓'],
    ['np-v3-jun', '準トップ'],
    ['np-v3-small', '小記事'],
    ['np-v3-beta', '短信'],
    ['np-v3-kuroda', '黒田コラム'],
    ['npShowDetail', 'つづき(自団体興行 詳報)'],
  ].forEach(([cls, label]) => {
    assert.ok(html.includes(cls), `${label}(${cls})が描かれていない`);
  });
});

section('H2. 記事が正しいスロットに入る(見出しの出現順が階段になっている)', () => {
  const html = rctx._npFrontV3(fullIssue, 6, 14, true);
  const at = s => html.indexOf(s);
  assert.ok(at('阿武隈塔子、ついに王座奪取') < at('高津小春、右膝負傷'), 'トップより肩が先に出ている');
  assert.ok(at('高津小春、右膝負傷') < at('ジュニアカップ来週開幕'), '肩より準トップが先に出ている');
  assert.ok(at('ジュニアカップ来週開幕') < at('深町真琴、10連勝'), '準トップより小記事が先に出ている');
  assert.ok(at('深町真琴、10連勝') < at('ノヴァインパクトが新体制'), '小記事より短信が先に出ている');
  assert.ok(at('ノヴァインパクトが新体制') < at('npShowDetail'), '短信よりつづきが先に出ている');
});

section('H3. 短信は3本とも1つの枠に連結される', () => {
  const html = rctx._npFrontV3(fullIssue, 6, 14, true);
  const beta = html.slice(html.indexOf('np-v3-beta'), html.indexOf('np-v3-kuroda'));
  assert.strictEqual((beta.match(/np-v3-beta-sep/g) || []).length, 2,
    '短信3本が▼2つで連結されていない: ' + beta.slice(0, 300));
});

section('H4. トップ本文は段落に割れる', () => {
  const html = rctx._npFrontV3(fullIssue, 6, 14, true);
  const top = html.slice(html.indexOf('np-v3-top"'), html.indexOf('np-v3-kata'));
  assert.ok((top.match(/<p>/g) || []).length >= 2, 'トップ本文が1段のベタのまま');
});

section('H5. 本文が伸びたら3段目以降は2段組へ回る(モックの組み)', () => {
  // いまの記事文は150〜250字なので普段は2段どまり。P3で本文が伸びたときに2段組が効く
  const long = { ...fullIssue, topStory: { ...fullIssue.topStory, body: ('あ'.repeat(70) + '。').repeat(6) } };
  const html = rctx._npFrontV3(long, 6, 14, true);
  const top = html.slice(html.indexOf('np-v3-top"'), html.indexOf('np-v3-kata'));
  assert.ok((top.match(/<p>/g) || []).length >= 3, 'トップ本文が3段以上に割れていない');
  assert.ok(top.includes('np-v3-cols'), '3段目以降の2段組が出ていない');
});

section('H6. 肩記事が無い静かな号でも右カラムが崩れない', () => {
  const quiet = { layout: 'v3', season: 6, week: 15, topStory: fullIssue.topStory, subStories: [], playerShowData: null };
  let html;
  assert.doesNotThrow(() => { html = rctx._npFrontV3(quiet, 6, 15, true); });
  assert.ok(!html.includes('np-v3-kata'), '肩記事が無いのに枠だけ出ている');
  assert.ok(html.includes('np-v3-mvpbox'), 'MVP小窓は定位置なので残るはず');
  assert.ok(!html.includes('np-v3-beta'), '短信が無いのに枠だけ出ている');
  assert.ok(!html.includes('npShowDetail'), '興行が無いのに「つづき」が出ている');
});

section('H6b. 右カラムが丸ごと空なら一面は1列に落ちる', () => {
  const bare = { layout: 'v3', season: 6, week: 15, topStory: fullIssue.topStory, subStories: [], playerShowData: null };
  const html = rctx._npFrontV3(bare, 6, 15, false); // 過去号 = MVP小窓も出ない
  assert.ok(html.includes('np-v3-lead-grid--single'), '右カラムが空なのに2段組のままで、右が白く空く');
});

section('H7. 記事が1本も無い号でも落ちない', () => {
  const empty = { layout: 'v3', season: 6, week: 16, topStory: null, subStories: [], playerShowData: null };
  let html;
  assert.doesNotThrow(() => { html = rctx._npFrontV3(empty, 6, 16, true); });
  assert.ok(html.includes('np-empty-substory'), '空の号に埋め草の一言が出ていない');
});

section('H8. バックナンバーではMVP小窓を出さない', () => {
  const html = rctx._npFrontV3(fullIssue, 6, 14, false);
  assert.ok(!html.includes('np-v3-mvpbox'), '過去号に今週のMVP順位が貼られている');
  assert.ok(!html.includes('MVPレース詳細'), '過去号の目次にMVPレースへの誘導が出ている');
  assert.ok(html.includes('np-v3-kata'), '肩記事まで消えている(小窓だけ落とすはずが右カラムごと消えた)');
});

section('H9. 人物が特定できない記事に空の額縁を置かない', () => {
  const noFace = {
    layout: 'v3', season: 6, week: 17, topStory: fullIssue.topStory,
    subStories: [
      fullIssue.subStories[0], fullIssue.subStories[1],
      { type: 'general', characterId: null, headline: '写真の無い小記事', body: '本文。' },
    ],
    playerShowData: null,
  };
  const html = rctx._npFrontV3(noFace, 6, 17, true);
  const small = html.slice(html.indexOf('np-v3-small'));
  assert.ok(!/np-sub-photo"[^>]*>/.test(small.slice(0, 400)) || !small.includes('np-v3-small-body'),
    '人物のいない小記事に空の写真枠を置いている');
});

section('H10. 殿堂入り引退は発行済みの号も一面ジャックへ昇格し、他の記事を消さない', () => {
  const oldAllHof = rctx.G.allHallOfFame;
  rctx.G.allHallOfFame = {
    player: [{
      id: 101, name: '阿武隈塔子', orgId: 'player', orgName: 'テスト団体',
      hofLevel: 3, titleReigns: 2, totalDefenses: 6,
      activeSeasonsStart: 1, activeSeasonsEnd: 12,
    }],
  };
  try {
    // 専用フラグ追加前のバックナンバーを模す。恒久保存の殿堂記録だけで昇格できること。
    const issue = {
      ...fullIssue,
      topStory: {
        type: 'aiAceRetirement', characterId: 101,
        headline: '阿武隈塔子が引退、12シーズンの現役に区切り',
        body: '長く団体を支えた阿武隈塔子が現役を退いた。二度の戴冠を含む歩みは団体史に残る。',
        newsData: { reigns: 2, seasons: 12 },
      },
    };
    const html = rctx._npFrontV3(issue, 6, 14, true);
    assert.ok(html.includes('np-v3-hof-retirement'), '通常の一面トップのままで専用紙面にならない');
    assert.ok(html.includes('np-v3-hof-mast') && html.includes('np-v3-hof-facts'),
      '殿堂入りの題字または功績帯が無い');
    assert.ok(html.includes('np-v3-lead-grid np-v3-lead-grid--single'),
      '殿堂入り引退が左右分割の狭いトップ枠に閉じ込められている');
    assert.ok(html.includes('np-v3-hof-secondary') && html.includes('np-v3-kata'),
      '一面ジャックのために2番手記事を消している');
    assert.ok(html.includes('np-v3-mvpbox'), '一面ジャックのためにMVP欄を消している');
  } finally {
    rctx.G.allHallOfFame = oldAllHof;
  }
});

// ─────────────────────────────────────────────────────────────
console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILED'}`);
process.exit(failed === 0 ? 0 : 1);
