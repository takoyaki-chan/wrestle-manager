'use strict';
// task-72: 天頂戦 決勝の会話演出（直前1往復 / 決着後の勝者・敗者コメント）
//
// 固定したい不変条件:
//   1. 決勝以外では 1 本も出ない（1回戦〜準決勝の見え方を変えない）
//   2. 決勝の直前は 1 往復まで（吹き出しは 2 つちょうど）
//   3. アーキタイプ 7 種すべてにセルがある（archetype を持たないセリフを作らない）
//   4. セリフ内に大会名を連呼しない
//   5. 吹き出しの中に名前・所属を書かない
//   6. 因縁が無い組（初対戦・互角・余力あり）でも必ず何か出る
//   7. 決着後の待ちに時限の保険と二重起動防止が掛かっている

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const uiSrc = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8').replace(/\r\n/g, '\n');
const appSrc = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const { TENCHOSEN_FINAL_LINES } = require(path.join(root, 'src', 'tenchosen-final-lines.js'));

const ARCHETYPES = ['standard', 'polite', 'cool', 'composed', 'ojousama', 'delinquent', 'seductive'];

// ── src/ui-common.js から決勝会話ブロックだけを切り出す ─────────────────────
function sliceBetween(src, startAnchor, endAnchor) {
  const s = src.indexOf(startAnchor);
  assert.ok(s >= 0, `not found: ${startAnchor}`);
  const e = src.indexOf(endAnchor, s);
  assert.ok(e > s, `not found: ${endAnchor}`);
  return src.slice(s, e);
}
function functionSource(src, header) {
  const start = src.indexOf(header);
  assert.ok(start >= 0, `not found: ${header}`);
  const brace = src.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error(`end not found: ${header}`);
}

const finalBlock = sliceBetween(uiSrc, 'const TC_FINAL_WEAR', '/** フォーカスカード:');
const focusCardSrc = functionSource(uiSrc, 'function _tcFocusCard');
const runAftermathSrc = functionSource(appSrc, 'App._tcRunFinalAftermath = function');
const advanceSrc = functionSource(appSrc, 'App.tcAdvanceAfterResult = function');

// ── 最小 DOM ────────────────────────────────────────────────────────────────
function makeDom() {
  const nodes = [];
  const mk = () => {
    const el = {
      className: '', innerHTML: '', _handlers: {}, _attached: false,
      querySelector() { return { addEventListener: (ev, fn) => { el._handlers[ev] = fn; } }; },
      remove() { el._attached = false; const i = nodes.indexOf(el); if (i >= 0) nodes.splice(i, 1); },
      click() { if (el._handlers.click) el._handlers.click(); },
    };
    return el;
  };
  return {
    nodes,
    document: {
      createElement: mk,
      body: {
        appendChild(el) { el._attached = true; nodes.push(el); },
        contains(el) { return !!el && nodes.indexOf(el) >= 0; },
      },
      getElementById() { return null; },
    },
  };
}

// ── サンドボックス ─────────────────────────────────────────────────────────
function makeCtx(opts) {
  opts = opts || {};
  const dom = makeDom();
  const rngInt = (r, lo, hi) => {
    r.s = (Math.imul(r.s, 1664525) + 1013904223) >>> 0;
    return lo + (r.s % (hi - lo + 1));
  };
  const ctx = {
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    document: dom.document,
    _domNodes: dom.nodes,
    TENCHOSEN_FINAL_LINES,
    escHtml: s => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    getUpperUrl: id => `image/upper-${id}.png`,
    Audio: { play() {} },
    App: {},
    Engine: {
      rng: {
        create: s => ({ s: (s >>> 0) || 1 }),
        derive: (...a) => a.reduce((h, v) => (Math.imul(h, 31) + (Number(v) || 0)) >>> 0, 7) || 1,
        int: rngInt,
      },
      h2h: { getRecord: (_g, a, b) => (opts.h2h || {})[`${Math.min(a, b)}>${Math.max(a, b)}`] || null },
    },
    G: { rngSeed: 12345, season: 12, relationships: opts.relationships || {} },
    _u3bSideHtml: o => `<div class="u3b-side"><div class="u3b-bubble-slot"><div class="u3b-bubble">`
      + `<div class="u3b-bubble-text">${o.line || ''}</div></div></div>`
      + `<div class="u3b-upper"></div><div class="u3b-copy"><div class="u3b-name">${o.name}</div>`
      + `${o.roleHtml || ''}</div></div>`,
    _tcRoundLabel: n => n,
    _tcOwnPill: () => '',
    _rivalryBubblePairHtml: () => '<div class="jt-bub-pair" data-legacy="rivalry"></div>',
    _jtcFcHpBlock: () => '',
    _jtcFcCore: o => `<div class="jtc-fc">${o.extraHtml || ''}</div>`,
    valueClassOvr: () => '',
  };
  vm.createContext(ctx);
  vm.runInContext(`${finalBlock}\n${focusCardSrc}\n${runAftermathSrc}\n`, ctx);
  // const 宣言は context のプロパティにならないので、必要な定数だけ読み出して載せ直す
  ctx.TC_FINAL_WEAR = vm.runInContext('TC_FINAL_WEAR', ctx);
  ctx.TC_FINAL_OVR_GAP = vm.runInContext('TC_FINAL_OVR_GAP', ctx);
  return ctx;
}

function mkFighter(id, name, archetype, personality, ovr) {
  return { id, name, archetype, personality, ovr, orgId: 'org_a', _orgName: 'ORG' };
}
function mkMatch(o) {
  o = o || {};
  return {
    left: o.left || mkFighter(101, 'アリス', 'standard', 'normal', 80),
    right: o.right || mkFighter(202, 'ベアトリス', 'ojousama', 'normal', 80),
    carryLeftPct: o.carryLeftPct != null ? o.carryLeftPct : 84,
    carryRightPct: o.carryRightPct != null ? o.carryRightPct : 84,
    hpLeft: o.hpLeft || { final: 40, max: 100 },
    hpRight: o.hpRight || { final: 0, max: 100 },
    winnerId: o.winnerId != null ? o.winnerId : 101,
  };
}

// ═══ 1. 決勝以外では 1 本も出ない ═══════════════════════════════════════════
(function testNothingOutsideFinal() {
  const ctx = makeCtx();
  ['firstRound', 'quarterFinal', 'semiFinal', '', null, undefined].forEach(round => {
    assert.strictEqual(ctx._tcFinalPreLines(mkMatch(), round), null,
      `${round} で決勝セリフを組み立ててはいけない`);
    assert.strictEqual(ctx._tcFinalPreBubbleHtml(mkMatch(), round), '',
      `${round} で決勝の吹き出しを出してはいけない`);
    let called = 0;
    const shown = ctx._showTcFinalAftermath(mkMatch(), round, () => { called++; });
    assert.strictEqual(shown, false, `${round} で決着後コメントを出してはいけない`);
    assert.strictEqual(called, 0, `${round} でコールバックを呼んではいけない`);
    assert.strictEqual(ctx._domNodes.length, 0, `${round} で DOM に何も足してはいけない`);
  });

  // フォーカスカードも、決勝以外は従来どおり因縁セリフのまま
  const html = ctx._tcFocusCard(mkMatch(), 'semiFinal', 2, 0);
  assert.ok(html.includes('data-legacy="rivalry"'), '決勝以外は既存の因縁セリフ経路のまま');
  assert.ok(!html.includes('tc-final-bub'), '決勝以外に決勝用の吹き出しを混ぜない');
})();

// ═══ 2. 決勝は必ず 1 往復（因縁ゼロ・初対戦でも出る）═══════════════════════
(function testFinalAlwaysSpeaksExactlyOnce() {
  const ctx = makeCtx(); // relationships / h2h とも空 = 因縁なし・初対戦
  const html = ctx._tcFinalPreBubbleHtml(mkMatch(), 'final');
  assert.ok(html, '因縁が無くても決勝では必ず何か出る（不変条件6）');
  const bubbles = html.match(/<div class="jt-bub">/g) || [];
  assert.strictEqual(bubbles.length, 2, '吹き出しはちょうど 2 つ = 1 往復（不変条件2）');
  assert.ok(html.includes('jt-bub-pair'), '既存の .jt-bub-pair の形を崩さない');

  // 吹き出しの中に名前・所属を書かない
  assert.ok(!html.includes('アリス') && !html.includes('ベアトリス'),
    '吹き出しの中に名前を書かない');
  assert.ok(!html.includes('ORG'), '吹き出しの中に所属を書かない');
  assert.ok(!/class="sp/.test(html), '話者名ラベル(.sp)を吹き出しに入れない');

  // フォーカスカード経由でも決勝は決勝用に差し替わる
  const card = ctx._tcFocusCard(mkMatch(), 'final', 3, 0);
  assert.ok(card.includes('tc-final-bub'), '決勝は決勝用の吹き出しを使う');
  assert.ok(!card.includes('data-legacy="rivalry"'), '決勝では因縁セリフより優先する');
})();

// ═══ 3. 再描画しても同じセリフ（ブラケットは何度も描き直される）═════════════
(function testDeterministic() {
  const ctx = makeCtx();
  const a = ctx._tcFinalPreBubbleHtml(mkMatch(), 'final');
  const b = ctx._tcFinalPreBubbleHtml(mkMatch(), 'final');
  assert.strictEqual(a, b, '同じ対戦なら何度描き直しても同じセリフ');
})();

// ═══ 4. 5 軸が実際に効いている ═══════════════════════════════════════════════
(function testFiveAxes() {
  // 消耗（満身創痍が最優先）
  {
    const ctx = makeCtx();
    const m = mkMatch({ carryLeftPct: 74, carryRightPct: 84 });
    assert.strictEqual(ctx._tcFinalMotifs(m, 'left')[0], 'battered', '満身創痍が最優先');
    assert.strictEqual(ctx._tcFinalMotifs(m, 'right')[0], 'firstMeet', '余力ありは満身創痍にならない');
  }
  // 消耗（中位）
  {
    const ctx = makeCtx();
    const m = mkMatch({ carryLeftPct: 79 });
    assert.strictEqual(ctx._tcFinalMotifs(m, 'left')[0], 'worn', '中位の消耗は worn');
  }
  // 因縁（向きで読む: 片方だけ燃えていても、その本人は grudge になる）
  {
    const ctx = makeCtx({ relationships: { '101>202': { rivalry: 88 }, '202>101': { rivalry: 10 } } });
    const m = mkMatch();
    assert.strictEqual(ctx._tcFinalMotifs(m, 'left')[0], 'grudge', '強い因縁を向けている側は grudge');
    assert.notStrictEqual(ctx._tcFinalMotifs(m, 'right')[0], 'grudge', '向けていない側は grudge にしない');
  }
  {
    const ctx = makeCtx({ relationships: { '101>202': { rivalry: 65 } } });
    assert.strictEqual(ctx._tcFinalMotifs(mkMatch(), 'left')[0], 'rivalry', '因縁 60 台は rivalry');
  }
  // 対戦歴 + 直近の勝敗（101 < 202 なので 101 = A 側）
  {
    const hist = w => ({ '101>202': { matches: w.length, history: w.map(x => ({ win: x })) } });
    const down = makeCtx({ h2h: hist(['B', 'B', 'B']) });
    assert.strictEqual(down._tcFinalMotifs(mkMatch(), 'left')[0], 'revenge', '負け越しは revenge');
    const even = makeCtx({ h2h: hist(['A', 'B']) });
    assert.strictEqual(even._tcFinalMotifs(mkMatch(), 'left')[0], 'settle', '五分は settle');
    const up = makeCtx({ h2h: hist(['A', 'A']) });
    assert.strictEqual(up._tcFinalMotifs(mkMatch(), 'left')[0], 'hold', '勝ち越しは hold');
  }
  // 力量差
  {
    const ctx = makeCtx();
    const m = mkMatch({
      left: mkFighter(101, 'アリス', 'standard', 'normal', 70),
      right: mkFighter(202, 'ベアトリス', 'ojousama', 'normal', 82),
    });
    assert.strictEqual(ctx._tcFinalMotifs(m, 'left')[0], 'underdog', 'OVR -12 は格下');
    assert.strictEqual(ctx._tcFinalMotifs(m, 'right')[0], 'crown', 'OVR +12 は格上');
  }
  // 消耗帯は実効レンジ内（FLOOR=55 なので 40 未満は永久に発火しない）
  assert.ok(makeCtx().TC_FINAL_WEAR.battered > 55 && makeCtx().TC_FINAL_WEAR.battered < 82,
    '満身創痍のしきい値は決勝の carryPct 実測レンジ(72〜86)の中にある');
})();

// ═══ 5. 同アーキタイプ・同モチーフでも二人が同文にならない ══════════════════
(function testNoEchoBetweenTheTwo() {
  const ctx = makeCtx();
  const m = mkMatch({
    left: mkFighter(101, 'ア', 'cool', 'normal', 80),
    right: mkFighter(202, 'イ', 'cool', 'normal', 80),
  });
  const r = ctx._tcFinalPreLines(m, 'final');
  assert.ok(r, '同じアーキタイプ同士でも 1 往復は出る');
  assert.notStrictEqual(r.leftLine, r.rightLine, '二人が同じセリフを繰り返さない');
})();

// ═══ 6. 決着後: 敗者のみ 1 枚(勝者は戴冠式で喋る・2026-08-13 Keisuke実機裁定) ═══
(function testAftermathChain() {
  const ctx = makeCtx();
  let done = 0;
  const shown = ctx._showTcFinalAftermath(mkMatch(), 'final', () => { done++; });
  assert.strictEqual(shown, true, '決勝では決着後コメントが出る');
  assert.strictEqual(ctx._domNodes.length, 1, '1 枚ずつ出す');
  const first = ctx._domNodes[0];
  assert.ok(/is-tenchosen/.test(first.className), '天頂戦テーマで出す');
  assert.ok(first.innerHTML.includes('準優勝'), '出るのは敗者のみ(勝者カードは戴冠式に統合)');
  assert.ok(!first.innerHTML.includes('戴冠'), '勝者カードは出さない');
  assert.ok(!first.innerHTML.includes('u3b-bubble-text"></div>'), '敗者のセリフが空でない');

  first.click();
  first.click(); // 連打しても二重に進まない
  assert.strictEqual(ctx._domNodes.length, 0, '送り終えたら残骸を残さない');
  assert.strictEqual(done, 1, '送り終えてちょうど 1 回だけ次へ進む');
})();

// ═══ 7. 待ちの保険: 二重起動防止 + オーバーレイ消失で救う ═══════════════════
const safetyNetDone = (function testSafetyNet() {
  // 7-a. 正常系: 会話を送り切ったら proceed はちょうど 1 回
  {
    const ctx = makeCtx();
    let proceeded = 0;
    const tc = {};
    ctx.App._tcRunFinalAftermath(tc, mkMatch(), 'final', () => { proceeded++; });
    assert.strictEqual(ctx._domNodes.length, 1, '敗者カードが 1 枚だけ出る(勝者は戴冠式へ統合)');
    ctx._domNodes[0].click();
    if (ctx._domNodes[0]) ctx._domNodes[0].click(); // 残骸があっても二重に進まない
    assert.strictEqual(proceeded, 1, 'proceed はちょうど 1 回');
    assert.strictEqual(ctx.App._tcFinalTalkWatch, null, '見張りを畳む');
    assert.strictEqual(ctx.App._tcFinalTalkCap, null, '絶対上限タイマーを畳む');
  }
  // 7-b. 決勝以外・二重呼び出しでは会話を出さずに素通り
  {
    const ctx = makeCtx();
    let proceeded = 0;
    ctx.App._tcRunFinalAftermath({}, mkMatch(), 'semiFinal', () => { proceeded++; });
    assert.strictEqual(proceeded, 1, '決勝以外は素通りで進む');
    assert.strictEqual(ctx._domNodes.length, 0, '決勝以外は何も出さない');

    const tc = {};
    ctx.App._tcRunFinalAftermath(tc, mkMatch(), 'final', () => {});
    assert.strictEqual(tc._finalTalkShown, true);
    let second = 0;
    ctx.App._tcRunFinalAftermath(tc, mkMatch(), 'final', () => { second++; });
    assert.strictEqual(second, 1, '2 回目は会話を出さずに素通り');
    assert.strictEqual(ctx._domNodes.length, 1, '会話が二重に積まれない');
  }
  // 7-c. オーバーレイが外から消されたら見張りが救う
  {
    const ctx = makeCtx();
    let proceeded = 0;
    ctx.App._tcRunFinalAftermath({}, mkMatch(), 'final', () => { proceeded++; });
    assert.ok(ctx.App._tcFinalTalkWatch, '見張りが張られている');
    ctx._domNodes.length = 0; // 誰かが盤面ごと消した
    ctx.App._tcFinalTalkEl = null;
    return new Promise(resolve => {
      setTimeout(() => {
        assert.strictEqual(proceeded, 1, 'コールバックが来なくても時限で救われる');
        resolve();
      }, 1400);
    });
  }
})();

// ═══ 8. ソース側の約束 ═════════════════════════════════════════════════════
(function testSourceContract() {
  assert.ok(/tc\._finalAdvanced/.test(advanceSrc), '決勝の二重進行を弾くフラグがある(1操作=1進行)');
  assert.ok(/_tcRunFinalAftermath/.test(advanceSrc), '決勝決着は決着後コメント経由で進む');
  assert.ok(/setInterval/.test(runAftermathSrc) && /setTimeout/.test(runAftermathSrc),
    '待ちに見張りと絶対上限の両方が掛かっている');
  assert.ok(/console\.warn/.test(runAftermathSrc), '保険が作動したら黙って救わず warn を残す');
  assert.ok(/_tcFinalTalkWatch/.test(appSrc.slice(appSrc.indexOf('App.finalizeTenchosen'))),
    'finalizeTenchosen で見張りを片付ける');
})();

// ═══ 9. セリフテーブルの体裁 ═══════════════════════════════════════════════
(function testLineTable() {
  const seen = new Map();
  let total = 0, withTournamentName = 0;
  const scenes = { pre: TENCHOSEN_FINAL_LINES.pre, postWin: TENCHOSEN_FINAL_LINES.postWin, postLose: TENCHOSEN_FINAL_LINES.postLose };
  Object.entries(scenes).forEach(([scene, motifs]) => {
    assert.ok(motifs && Object.keys(motifs).length, `${scene} が空`);
    Object.entries(motifs).forEach(([motif, cell]) => {
      // アーキタイプ 7 種すべてに基準セルがある（archetype を持たないセリフを作らない）
      ARCHETYPES.forEach(a => {
        const pool = cell[`${a}_normal`];
        assert.ok(Array.isArray(pool) && pool.length,
          `${scene}.${motif} に ${a}_normal が無い`);
        pool.forEach(line => {
          assert.ok(typeof line === 'string' && line.trim().length >= 8,
            `${scene}.${motif}.${a}_normal に短すぎる行がある`);
        });
      });
      // キーは必ず `${archetype}_${personality}` の形（archetype 第一分岐）
      Object.keys(cell).forEach(key => {
        const a = key.split('_')[0];
        assert.ok(ARCHETYPES.includes(a),
          `${scene}.${motif} のキー ${key} が archetype 始まりでない`);
        cell[key].forEach(line => {
          total++;
          if (line.includes('天頂戦')) withTournamentName++;
          const where = `${scene}.${motif}.${key}`;
          assert.ok(!seen.has(line), `セリフが重複: ${line} (${seen.get(line)} / ${where})`);
          seen.set(line, where);
        });
      });
    });
  });
  assert.ok(total >= 120, `本数が想定より少ない (${total})`);
  assert.ok(withTournamentName / total <= 0.1,
    `大会名の連呼: ${withTournamentName}/${total}（1割以下に収めること）`);
})();

// 見張りの時限テストだけ非同期。ここを待ってから ok を出す
safetyNetDone.then(() => {
  console.log('tenchosen-final-dialogue-test: ok');
}).catch(e => {
  console.error(e);
  process.exit(1);
});
