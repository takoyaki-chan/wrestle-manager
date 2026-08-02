'use strict';

// タスク51(2026-07-31): 王座防衛の演出を「派閥イベント級」に落とす。
//
// docs/codex-tasks/task-51-title-defense-scale-down.md の要求:
//   - 通常の防衛(節目でない防衛) → showFactionEventResult と同じ密度の
//     A型モーダル1枚(showCeremonyEvent は使わない)
//   - 戴冠、および5/10/15度目の節目防衛 → 承認済みのA型2選手モーダル
//   - どの分岐でも onDone は必ず1回呼ばれる(王者が見つからない・DOM未整備などの
//     早期returnパスも含めて)
//
// test/README.md のルールに従い、ソース文字列の一致検査ではなく実関数を
// vm.runInNewContext + 最小fake DOM で実行し、出力HTMLと呼び出し回数を検査する
// (u4-modal-frame-safety-net-test.js / ppv-tv-start-test.js の手法を踏襲)。

const assert = require('assert');
const vm = require('vm');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const mgmt = readSource('src', 'management.js');

// u4-modal-frame-safety-net-test.js の functionSource() を踏襲
// (引数リストの分割代入 `{ ... }` を本体の開始/終了と誤認しない版)
function functionSource(src, name) {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} not found`);
  let i = src.indexOf('(', start);
  let parenDepth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') parenDepth++;
    else if (src[i] === ')') { parenDepth--; if (parenDepth === 0) { i++; break; } }
  }
  const brace = src.indexOf('{', i);
  let depth = 0;
  for (let j = brace; j < src.length; j++) {
    if (src[j] === '{') depth++;
    if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error(`${name}: end not found`);
}
const uiFn = (name) => functionSource(ui, name);

// checkDefenseMilestone は Engine.news オブジェクトのメソッドとして定義されている
// (トップレベルの function 宣言ではない)ので、本体だけを正規表現で切り出して
// 実物のロジックをそのまま使う(新しい閾値をテスト側で書き写さない)。
function extractCheckDefenseMilestone() {
  const m = mgmt.match(/checkDefenseMilestone\(defenses\) \{([\s\S]*?)\n  \}/);
  assert.ok(m, 'checkDefenseMilestone が management.js に見つからない');
  return new Function('defenses', m[1]);
}

// ── 最小 fake DOM ──────────────────────────────────────────────
function makeEl() {
  let cls = new Set();
  let html = '';
  const handlers = {};
  return {
    get className() { return Array.from(cls).join(' '); },
    set className(v) { cls = new Set(String(v == null ? '' : v).split(/\s+/).filter(Boolean)); },
    classList: {
      add: (c) => cls.add(c),
      remove: (c) => cls.delete(c),
      contains: (c) => cls.has(c),
    },
    get innerHTML() { return html; },
    set innerHTML(v) { html = v; },
    addEventListener(type, fn) { handlers[type] = fn; },
    click() { if (handlers.click) handlers.click(); },
  };
}
function makeDocument() {
  const els = {};
  return { getElementById: (id) => (els[id] || (els[id] = makeEl())) };
}

// ── showTitleMatchCeremony + 王座結果モーダルを、依存する
//    A型モーダル部品(実物)ごと vm コンテキストへ読み込む ──────────────
function buildTitleCeremony(ctxExtra) {
  const document = (ctxExtra && ctxExtra.document) || makeDocument();
  const ctx = Object.assign({
    console,
    document,
    Audio: { play: () => {} },
    _drainPopupQueue: () => {},
    getUpperUrl: () => '',
    getPortraitUrl: () => '',
    // 中身に選手名を混ぜない固定文言にする: これで「吹き出しに名前が入っていない」
    // という検査が、スタブの偶然ではなく実装コードの構造そのものを見たことになる。
    getTraitQuote: (key) => `【${key}のセリフ】`,
    Engine: {
      news: { checkDefenseMilestone: extractCheckDefenseMilestone() },
      util: { ov: () => 80 },
    },
  }, ctxExtra || {});
  ctx.document = document; // ctxExtra.document があればそれが優先される

  const code = `
    ${uiFn('escHtml')}
    ${uiFn('_mdlAHeader')}
    ${uiFn('_mdlASeasonLabel')}
    ${uiFn('_mdlASubjectStage')}
    ${uiFn('_mdlAOpen')}
    ${uiFn('_mdlAClose')}
    ${uiFn('showTitleDefenseResultModal')}
    ${uiFn('showTitleMilestoneResultModal')}
    ${uiFn('showTitleMatchCeremony')}
    this.showTitleMatchCeremony = showTitleMatchCeremony;
  `;
  vm.runInNewContext(code, ctx);
  return { ctx, document: ctx.document };
}

function extractSpeechBubble(html) {
  const m = html.match(/<div class="u3b-bubble mdl-a-subject-speech"><div class="u3b-bubble-text">([\s\S]*?)<\/div><\/div>/);
  return m ? m[1] : null;
}

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.stack); }
}

console.log('=== タスク51: 王座防衛の演出スケールダウン ===\n');

// ─────────────────────────────────────────────────────────────
// 1. 通常防衛(節目でない)は showCeremonyEvent を呼ばず、軽量モーダルを出す
// ─────────────────────────────────────────────────────────────
section('1. 通常防衛(1〜4度目など)は showCeremonyEvent を呼ばない', () => {
  [0, 1, 2, 3, 4, 6, 7, 8, 9, 11, 14, 16].forEach((defenses) => {
    let ceremonyCalls = 0;
    const champion = { id: 1, name: '桜庭アカネ', age: 24, style: 'technical' };
    const { ctx, document } = buildTitleCeremony({
      G: { roster: [champion], titles: { world: { defenses, championId: 1 } } },
      ALL_CHARS: [],
      showCeremonyEvent: (evt, speakers, cb) => { ceremonyCalls++; if (cb) cb(); },
    });
    let doneCalls = 0;
    assert.doesNotThrow(() => {
      ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 }, () => { doneCalls++; });
    }, `defenses=${defenses} で例外`);
    assert.strictEqual(ceremonyCalls, 0, `defenses=${defenses}: showCeremonyEvent を呼んでしまっている`);
    assert.strictEqual(doneCalls, 0, `defenses=${defenses}: ボタンを押す前に onDone が呼ばれている`);
    const overlay = document.getElementById('mdlAOverlay');
    assert.ok(overlay.classList.contains('active'), `defenses=${defenses}: 軽量モーダルが開いていない`);
  });
});

section('2. 節目の防衛(5/10/15)と戴冠は同じA型2選手モーダルを使う', () => {
  [5, 10, 15].forEach((defenses) => {
    let ceremonyCalls = 0;
    const champion = { id: 1, name: '桜庭アカネ' };
    const opponent = { id: 2, name: '天音ルナ' };
    const { ctx, document } = buildTitleCeremony({
      G: { roster: [champion, opponent], titles: { world: { defenses, championId: 1 } }, lastShowAttendance: 800 },
      ALL_CHARS: [],
      showCeremonyEvent: () => { ceremonyCalls++; },
    });
    let doneCalls = 0;
    ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 }, () => { doneCalls++; });
    assert.strictEqual(ceremonyCalls, 0, `defenses=${defenses}(節目): 大判式典を呼んでしまっている`);
    assert.strictEqual(doneCalls, 0, `defenses=${defenses}: ボタン前に onDone が呼ばれている`);
    const overlay = document.getElementById('mdlAOverlay');
    assert.ok(overlay.classList.contains('active'), '節目防衛のA型モーダルが開いていない');
    assert.ok(overlay.classList.contains('top-aligned'), 'スマホ縦積み時の上端スクロール保護がない');
    const html = document.getElementById('mdlACard').innerHTML;
    assert.ok(html.includes('mdl-a-title-result'), '承認済みの王座結果レイアウトを使っていない');
    assert.ok(html.includes('防 衛'), '節目防衛の見出しがない');
    assert.ok(html.includes(`TITLE DEFENSE · ${defenses} ・ 800 ATTENDED`), '防衛回数と観客数のメタ表示がない');
    assert.ok(html.includes('WORLD CHAMPION · DEFENSE SUCCESS'), '王者側の役割表示がない');
    assert.ok(html.includes('CHALLENGER'), '挑戦者側の役割表示がない');
    assert.ok(html.includes('【titleDefenseのセリフ】'), '既存の王者防衛セリフを流用していない');
    assert.ok(html.includes('【titleChallengeLossのセリフ】'), '既存の挑戦者敗戦セリフを流用していない');
    document.getElementById('mdlATitleMilestoneClose').click();
    assert.strictEqual(doneCalls, 1, `defenses=${defenses}: 閉じた後の onDone が1回でない`);
  });

  // 戴冠も同じモーダル。新王者と前王者の既存セリフをそのまま使う。
  let ceremonyCalls = 0;
  const champion = { id: 3, name: '新王者リコ' };
  const former = { id: 4, name: '前王者ミオ' };
  const { ctx, document } = buildTitleCeremony({
    G: { roster: [champion, former], titles: { world: { defenses: 0, championId: 3 } }, lastShowAttendance: 1234 },
    ALL_CHARS: [],
    showCeremonyEvent: () => { ceremonyCalls++; },
  });
  let doneCalls = 0;
  ctx.showTitleMatchCeremony({ outcome: 'change', newChampId: 3, prevChampId: 4 }, () => { doneCalls++; });
  assert.strictEqual(ceremonyCalls, 0, '戴冠で大判式典を呼んでしまっている');
  const html = document.getElementById('mdlACard').innerHTML;
  assert.ok(document.getElementById('mdlAOverlay').classList.contains('top-aligned'), '戴冠もスマホ縦積みを上端から見せる');
  assert.ok(html.includes('戴 冠'), '戴冠見出しがない');
  assert.ok(html.includes('NEW WORLD CHAMPION ・ 1,234 ATTENDED'), '戴冠メタ表示がない');
  assert.ok(html.includes('新王者リコが、頂点のベルトを手にした。'), '既存の戴冠地の文を流用していない');
  assert.ok(html.includes('【titleWinのセリフ】'), '既存の titleWin セリフを流用していない');
  assert.ok(html.includes('【titleLossのセリフ】'), '既存の titleLoss セリフを流用していない');
  assert.strictEqual(doneCalls, 0, '戴冠モーダルを閉じる前に onDone が呼ばれている');
  document.getElementById('mdlATitleMilestoneClose').click();
  assert.strictEqual(doneCalls, 1, '戴冠モーダルを閉じた後の onDone は1回');
});

// ─────────────────────────────────────────────────────────────
// 2. onDone がどの分岐でも必ず1回だけ呼ばれる(早期returnも含めて)
// ─────────────────────────────────────────────────────────────
section('3. 王者が見つからない場合でも onDone が1回だけ呼ばれる(例外なし)', () => {
  let ceremonyCalls = 0;
  const { ctx, document } = buildTitleCeremony({
    G: { roster: [], titles: { world: { defenses: 2, championId: 999 } } },
    ALL_CHARS: [],
    showCeremonyEvent: (evt, speakers, cb) => { ceremonyCalls++; if (cb) cb(); },
  });
  let doneCalls = 0;
  assert.doesNotThrow(() => {
    ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 999, challengerId: 1 }, () => { doneCalls++; });
  });
  assert.strictEqual(doneCalls, 1, '王者不在でも onDone は1回呼ばれる');
  assert.strictEqual(ceremonyCalls, 0, '王者不在なら showCeremonyEvent は呼ばれない');
  assert.ok(!document.getElementById('mdlAOverlay').classList.contains('active'), '王者不在ならモーダルも開かない');
});

section('4. onDone が未指定(null)でも例外にならない', () => {
  const champion = { id: 1, name: '桜庭アカネ' };
  const { ctx } = buildTitleCeremony({
    G: { roster: [champion], titles: { world: { defenses: 1, championId: 1 } } },
    ALL_CHARS: [],
  });
  assert.doesNotThrow(() => {
    ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 });
  }, 'onDone省略時に例外');
});

section('5. 通常防衛でモーダルのDOMが未整備でも onDone が1回だけ呼ばれる', () => {
  const champion = { id: 1, name: '桜庭アカネ' };
  const missingDocument = { getElementById: () => null };
  const { ctx } = buildTitleCeremony({
    G: { roster: [champion], titles: { world: { defenses: 1, championId: 1 } } },
    ALL_CHARS: [],
    document: missingDocument,
  });
  let doneCalls = 0;
  assert.doesNotThrow(() => {
    ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 }, () => { doneCalls++; });
  });
  assert.strictEqual(doneCalls, 1, 'DOM未整備でも onDone は1回だけ呼ばれる');
});

section('6. 節目防衛モーダルのDOMが未整備でも onDone が1回だけ呼ばれる', () => {
  const champion = { id: 1, name: '桜庭アカネ' };
  const missingDocument = { getElementById: () => null };
  const { ctx } = buildTitleCeremony({
    G: { roster: [champion], titles: { world: { defenses: 5, championId: 1 } } },
    ALL_CHARS: [],
    document: missingDocument,
  });
  let doneCalls = 0;
  assert.doesNotThrow(() => {
    ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 }, () => { doneCalls++; });
  });
  assert.strictEqual(doneCalls, 1, '節目防衛のDOM未整備でも onDone は1回だけ呼ばれる');
});

section('7. 通常防衛モーダルの「閉じる」ボタンで onDone が1回だけ呼ばれる', () => {
  const champion = { id: 1, name: '桜庭アカネ' };
  const { ctx, document } = buildTitleCeremony({
    G: { roster: [champion], titles: { world: { defenses: 2, championId: 1 } } },
    ALL_CHARS: [],
  });
  let doneCalls = 0;
  ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 }, () => { doneCalls++; });
  assert.strictEqual(doneCalls, 0, 'ボタンを押すまでは呼ばれない');
  const btn = document.getElementById('mdlATitleDefenseClose');
  btn.click();
  assert.strictEqual(doneCalls, 1, 'ボタンを押すと1回呼ばれる');
});

// ─────────────────────────────────────────────────────────────
// 3. 出力HTMLの構造(見出し・地の文・吹き出し・ボタン文言)
// ─────────────────────────────────────────────────────────────
section('8. 通常防衛モーダルの見出しは1行、ボタン文言は「閉じる」', () => {
  const champion = { id: 1, name: '桜庭アカネ', age: 24, style: 'technical' };
  const { ctx, document } = buildTitleCeremony({
    G: { roster: [champion], titles: { world: { defenses: 3, championId: 1 } } },
    ALL_CHARS: [],
  });
  ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 }, () => {});
  const html = document.getElementById('mdlACard').innerHTML;

  assert.ok(html.includes('mdl-a-header-title">🛡 王座防衛<'), '見出しが1行のタイトルになっている');
  assert.ok(html.includes('3度目の防衛'), 'メタ行に防衛回数が入っている');
  assert.ok(html.includes('閉じる'), 'ボタン文言は「閉じる」');
  assert.ok(!html.includes('式典を終える'), '式典用のボタン文言を引きずっていない');
  assert.ok(!html.includes('narration-act'), '全画面式典のオーバーレイ要素を使っていない');

  // 地の文は1行(改行を含まない1つの observation だけ)
  const observationCount = (html.match(/class="mdl-a-observation/g) || []).length;
  assert.strictEqual(observationCount, 1, '地の文のブロックは1つだけ');
  const obs = (html.match(/<div class="mdl-a-observation[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '';
  assert.strictEqual((obs.match(/<br>/g) || []).length, 0, '地の文は1行(<br>で複数行にしていない)');
});

section('9. 通常防衛モーダルは王者の顔+頭上吹き出しを1つだけ持ち、挑戦者の顔は出さない', () => {
  const champion = { id: 1, name: '桜庭アカネ' };
  const { ctx, document } = buildTitleCeremony({
    G: { roster: [champion], titles: { world: { defenses: 2, championId: 1 } } },
    ALL_CHARS: [],
  });
  ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 }, () => {});
  const html = document.getElementById('mdlACard').innerHTML;

  const speechCount = (html.match(/class="u3b-bubble mdl-a-subject-speech"/g) || []).length;
  assert.strictEqual(speechCount, 1, '頭上吹き出しはちょうど1つ');
  const portraitCount = (html.match(/mdl-a-subject-portrait-wrap/g) || []).length;
  assert.strictEqual(portraitCount, 1, '選手の顔(ポートレート枠)は1つだけ(挑戦者の顔は出さない)');
});

section('10. 吹き出しは画像の上に予約され、margin-top で下に付けていない', () => {
  const champion = { id: 1, name: '桜庭アカネ' };
  const { ctx, document } = buildTitleCeremony({
    G: { roster: [champion], titles: { world: { defenses: 2, championId: 1 } } },
    ALL_CHARS: [],
  });
  ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 }, () => {});
  const html = document.getElementById('mdlACard').innerHTML;
  // 吹き出しはHTML側にインラインstyleを一切持たない(共通の予約枠クラスに一任)。
  // margin-top を使って吹き出しを画像の下に押し出すような書き方をしていないことを確認する。
  assert.ok(!html.includes('margin-top'), '出力HTMLに margin-top を使ったインライン配置が無い');
  assert.ok(html.includes('mdl-a-subject-speech-slot'), '吹き出し予約枠が出ている');
  assert.ok(html.indexOf('mdl-a-subject-speech-slot') < html.indexOf('mdl-a-subject-portrait-wrap'), '予約枠が画像より前にある');
});

section('11. 吹き出しの中身はセリフのみで、選手名・団体名を含まない', () => {
  const champion = { id: 1, name: '桜庭アカネ', age: 24, style: 'technical' };
  const { ctx, document } = buildTitleCeremony({
    G: { roster: [champion], titles: { world: { defenses: 2, championId: 1 } } },
    ALL_CHARS: [],
    getTraitQuote: () => '【titleDefenseのセリフ】まだまだ、これからよ。',
  });
  ctx.showTitleMatchCeremony({ outcome: 'defense', champId: 1, challengerId: 2 }, () => {});
  const html = document.getElementById('mdlACard').innerHTML;
  const bubble = extractSpeechBubble(html);
  assert.ok(bubble, '吹き出しの中身が取れる');
  assert.strictEqual(bubble, '【titleDefenseのセリフ】まだまだ、これからよ。', '吹き出しの中身はセリフそのまま');
  assert.ok(!bubble.includes(champion.name), '吹き出しの中に選手名が入っていない');
  assert.ok(!bubble.includes('団体') && !bubble.includes('ORG'), '吹き出しの中に所属団体らしき文字列が入っていない');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('title-defense-scale-test: ALL PASS');
