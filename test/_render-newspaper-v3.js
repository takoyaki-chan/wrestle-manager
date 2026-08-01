// 新聞 一面 v3 の目視確認用レンダラ（テストではない。run-all.js は *-test.js しか拾わない）。
//
//   node test/_render-newspaper-v3.js
//   → docs/ui/mockups/newspaper-v3-render-check.html を書き出す
//
// ブラウザでゲームを起動しなくても、実装 (_npFrontV3) の出力を実CSSで確認できる。
// 承認済みモック newspaper-redesign-best-v0.3.html と同じ場所に出るので並べて見比べられる。
// 記事の中身はダミー（画像だけ実在キャラのものを借りている）。
// 出力ファイルは生成物なので、紙面をいじったら再生成すること。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const R = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
const renderSrc = R('src/ui-render.js');
const htmlSrc = R('src/index.html');

function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('missing ' + name);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unterminated ' + name);
}

// 最小の Engine.rng（決定論であればよい）
const Engine = {
  rng: {
    create: seed => ({ s: seed >>> 0 }),
    derive: (...xs) => xs.reduce((a, b) => (a * 31 + (b >>> 0)) >>> 0, 7),
    pick: (r, arr) => arr[0],
    int: (r, a, b) => a,
  },
};

const CH = {
  1: { id: 1, name: '阿武隈塔子', file: 'upper_abukuma_t' },
  2: { id: 2, name: '相川あかね', file: 'upper_aikawa_a' },
  3: { id: 3, name: '会田美緒', file: 'upper_aida_m' },
  4: { id: 4, name: '赤羽あすか', file: 'upper_akabane_a' },
  5: { id: 5, name: '安沢ひかり', file: 'upper_anazawa_h' },
  6: { id: 6, name: '相沢みなみ', file: 'upper_aizawa_m' },
};

const ctx = {
  Engine,
  ALL_CHARS: Object.values(CH),
  G: {
    season: 6, week: 14, orgName: '我が団体',
    roster: [CH[1], CH[2], CH[3]], aiOrgs: {},
    mvpRace: {
      rankings: [
        { rank: 1, fighterId: 6, fighterName: '相沢みなみ', points: 148.2 },
        { rank: 2, fighterId: 1, fighterName: '阿武隈塔子', points: 141 },
        { rank: 3, fighterId: 4, fighterName: '赤羽あすか', points: 126 },
        { rank: 4, fighterId: 2, fighterName: '相川あかね', points: 118 },
        { rank: 5, fighterId: 5, fighterName: '安沢ひかり', points: 111 },
      ],
    },
  },
  escHtml: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  getUpperUrl: id => (CH[id] ? `../../../image/upper/${CH[id].file}.webp` : ''),
  getPortraitUrl: id => (CH[id] ? `../../../image/upper/${CH[id].file}.webp` : ''),
  _findFighterOrgName: (_s, id) => (id ? '我が団体' : ''),
  _npOrgEmblem: () => '',
  _npKurodaFaceUrl: () => '../../../image/npc/face_kuroda_s.png',
  _getKurodaNewsComment: () => [() => '7度目でようやく、である。だがこの7度がなければ今日の歓声もなかった。近道の無いことが、この商売の唯一の救いだ'],
  NP_KURODA_BYLINE: { news: '——黒田幸子(週刊グラップル)', rating: '——黒田幸子(本紙)', editorial: '——黒田幸子(編集部)' },
  _npRenderBignewsTag: () => '',
  _npSwapMainToSecondCard: d => d,
  _npRenderPlayerShow: () => `<section class="np-show-result">
      <div class="np-sec">自団体 興行結果</div>
      <h3 class="np-show-headline">（ここに既存の興行詳報がそのまま入る：VS 対面 / 星取 / 観客満足度 / ダイジェスト表）</h3>
    </section>`,
};
vm.createContext(ctx);
vm.runInContext([
  '_npPhotoBg', '_npSubPhotoHtml', '_npFindFighterOrgKey', '_npSpringTagStoryIds', '_npTopTagPhotoHtml',
  '_npCrisisColumnHtml', '_npKurodaCommentText',
  '_npV3PrimaryId', '_npV3OrgLine', '_npV3Paragraphs', '_npV3IndexBar', '_npV3MvpBox',
  '_npV3KurodaColumn', '_npV3TopStory', '_npV3Shoulder', '_npV3JunTop', '_npV3Small',
  '_npV3Briefs', '_npFrontV3',
].map(n => extractFunction(renderSrc, n)).join('\n'), ctx);

const issue = {
  layout: 'v3', season: 6, week: 14,
  topStory: {
    type: 'playerTitleChange', characterId: 1,
    situation: '第6年度・第14週 タイトル戦',
    headline: '阿武隈塔子、ついに王座奪取',
    subhead: '3年越しの雪辱——7度目の対戦で相沢みなみを下す',
    body: '第14週興行のメインイベントで阿武隈塔子が相沢みなみを破り、世界王座を獲得した。試合時間18分42秒、最後は正面からの組み技で3カウント。初挑戦で敗れてから3年、7度目の対戦で初めてベルトが腰に巻かれた。序盤は王者のペースだった。相沢の打撃が阿武隈の出足を止め、場内には嫌な沈黙が流れる。だが中盤、阿武隈は被弾を覚悟で距離を詰め、試合の重心を組みに引きずり込んだ。通算成績はなお相沢の4勝3敗。数字の上では王者だった側が上回る。それでも今夜の歓声は、この3年間を見続けた者への報酬だった。防衛戦線は来月から始まる。新王者に休む間はない。',
  },
  subStories: [
    { type: 'aiPracticeInjury', characterId: 2, headline: '相川あかね、右膝負傷で全治14週',
      body: '第13週興行で右膝を負傷、全治14週と診断された。今季9勝2敗、MVPレース4位につけていた絶好調の中での離脱となる。本人は「必ず戻る」と短くコメントした。復帰は最終盤の見込みで、レース戦線への影響は避けられない。' },
    { type: 'juniorTournamentPreview', characterId: 3, headline: 'ジュニアカップ来週開幕——本命不在、16名の混戦へ',
      body: '若手16名が集う夏の祭典が来週開幕する。前年覇者が卒業した今年は本命不在の混戦模様。トーナメント表は今週末の公開抽選で決まる。注目は初出場の会田美緒。道場での動きには早くもスカウト陣の視線が集まっている。' },
    { type: 'aiBreakthrough', characterId: 4, headline: '赤羽あすか、10連勝で記録に王手',
      body: '団体記録まであと2。次週の相手は因縁の相沢みなみで、最も止められる可能性の高い一戦となった。' },
    { type: 'aiShowHighlight', characterId: 5, headline: '安沢ひかり、スランプ脱出を宣言',
      body: '6週ぶりの白星に控室では涙も見えた。次の一戦で真価が問われる。' },
    { type: 'factionCamp', characterId: null, headline: 'ノヴァインパクトが新体制を発表、来季は「原点回帰」' },
    { type: 'general', characterId: null, headline: '大会場は第16週から座席を約1割増設' },
    { type: 'general', characterId: null, headline: '週間観客動員は4団体合計18,240人（前週比+6%）' },
  ],
  playerShowData: { left: { id: 1 }, right: { id: 6 } },
};

const front = ctx._npFrontV3(issue, 6, 14, true);

// index.html の <style> をまるごと持ってくる（実CSSで確認するため）
const styles = [...htmlSrc.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');

const out = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>新聞 一面 v3 — 実装レンダリング確認</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@600;700;900&family=Noto+Sans+JP:wght@400;700;900&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${styles}</style>
<style>
body { background:#241a12; margin:0; padding:24px 12px 80px; }
.chk-note { max-width:800px; margin:0 auto 18px; color:#cbb98c; font-size:13px; line-height:1.8; font-family:'Noto Sans JP',sans-serif; }
.chk-note h1 { font-size:18px; color:#f0d48b; margin:0 0 6px; }
</style>
</head><body>
<div class="chk-note">
  <h1>新聞 一面 v3 — <b>実装の出力</b>（モックではありません）</h1>
  src/ui-render.js の <code>_npFrontV3()</code> が返した HTML に、src/index.html の実CSSを当てたもの。
  記事の中身はダミー（実在キャラの画像を借りています）。
</div>
<div class="np-paper">
  <div class="np-paper-header">
    <div class="logo">週刊グラップル</div>
    <div class="issue">シーズン6 第14週<small>Y6 W14</small></div>
  </div>
  ${front}
</div>
</body></html>`;

const dest = path.join(root, 'docs', 'ui', 'mockups', 'newspaper-v3-render-check.html');
fs.writeFileSync(dest, out, 'utf8');
console.log('wrote', dest, out.length, 'bytes');
