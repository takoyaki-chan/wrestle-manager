'use strict';
// player-text-no-numeric-exposure-test.js — 雑誌取材・TV出演と関係修復の書類が、数値や内部変数名を
// プレイヤーに見せないことの確認(効果の値そのものは変えていない)
//
// 総点検 docs/fun-audit-v0.1/06-narrative-spotlight.md 発見⑩ / 04-drama-engine.md §5:
//   - 雑誌取材・TV出演のポップアップが「人気 +2」「ヒート +1」を表示していた
//   - 雑誌の見出しに、誰が取材されても同じ『』の決め台詞(「まだまだ頂点を譲る気はない」等)が付いていた
//   - 関係修復斡旋書の説明とログに「双方向 bond +5〜+10」「W-1(憎い敵ゾーン)」「(双方向 bond +N)」が出ていた

const assert = require('assert');
const path = require('path');
const { loadGame } = require(path.join(__dirname, 'helpers', 'load-game.js'));
const { readSource } = require(path.join(__dirname, 'helpers', 'source.js'));

loadGame();

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + (e && e.stack || e)); }
}
function extractBlock(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} が見つからない`);
  const brace = source.indexOf('{', start + signature.length - 1);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') { depth -= 1; if (depth === 0) return source.slice(start, i + 1); }
  }
  throw new Error(`${signature} の終わりが見つからない`);
}
const app = readSource('src', 'app.js');
const INTERNAL = /\bbond\b|\brivalry\b|W-1|憎い敵ゾーン|morale|orgPop/;

console.log('=== 雑誌取材・TV出演 / 関係修復: 数値と内部変数名を見せない ===\n');

section('雑誌・TVの見出しは本数・並びを保ったまま、名指しの『』セリフを含まない', () => {
  const M = Engine.flavor.MAGAZINE_HEADLINES, T = Engine.flavor.TV_HEADLINES;
  assert.strictEqual(M.length, 6, '雑誌見出しの本数が変わった(乱数の添字がずれる)');
  assert.strictEqual(T.length, 6, 'TV見出しの本数が変わった(乱数の添字がずれる)');
  [...M, ...T].forEach(h => {
    assert.ok(!/『/.test(h), `名指しの『』セリフが残っている: ${h}`);
    assert.ok(h.includes('{name}'), `見出しに {name} が無い: ${h}`);
  });
  // 並び(添字)の同一性: 変えたのは0番と5番の文面だけ
  assert.ok(M[1].includes('素顔に迫る') && M[2].includes('表紙') && M[3].includes('強さの秘密') && M[4].includes('密着ルポ'));
});

section('雑誌・TVの効果欄は質的な一文で、数値を出さない(効果の値は Engine 側で不変)', () => {
  const detail = new Function('WM_I18N', `return function ${extractBlock(app, '_flavorEventDetail(ev) {')};`)({ t: (s) => s });
  const mag = detail({ type: 'magazine', popGain: 3 });
  const tv = detail({ type: 'tv', heatGain: 2 });
  [mag, tv].forEach(s => {
    assert.ok(s && !/[0-9０-９]|\+/.test(s), `数値が出ている: ${s}`);
    assert.ok(!INTERNAL.test(s), `内部変数名が出ている: ${s}`);
  });
  assert.notStrictEqual(mag, tv);
  // 2か所のポップアップが共通の関数を使い、旧来の「人気 +{n}」「ヒート +{n}」は残っていない
  assert.strictEqual((app.match(/App\._flavorEventDetail\(ev\)/g) || []).length, 2, 'ポップアップ2か所が共通関数を通っていない');
  assert.ok(!app.includes("'人気 +{n}'") && !app.includes("'ヒート +{n}'"), '数値の効果欄が残っている');
});

section('雑誌取材の効果の値は従来どおり(王者+3/それ以外+2、TVはヒート王者+2/それ以外+1)', () => {
  const champ = { id: 1, name: '王者', popularity: 80, pw: 60, sp: 60, te: 60, st: 60, mn: 60 };
  const other = { id: 2, name: '挑戦者', popularity: 70, pw: 60, sp: 60, te: 60, st: 60, mn: 60 };
  const seen = { magazine: new Set(), tv: new Set() };
  for (let seed = 1; seed <= 400; seed++) {
    const s = { season: 2, week: 10, offSeason: false, roster: [champ, other], titles: { world: { championId: 1 } } };
    Engine.flavor.check(s, Engine.rng.create(seed)).forEach(ev => {
      const isChamp = ev.fighterId === 1;
      if (ev.type === 'magazine') { assert.strictEqual(ev.popGain, isChamp ? 3 : 2); seen.magazine.add(isChamp); }
      else { assert.strictEqual(ev.heatGain, isChamp ? 2 : 1); seen.tv.add(isChamp); }
    });
  }
  assert.strictEqual(seen.magazine.size, 2, '雑誌の王者/挑戦者の両方を踏めていない');
  assert.strictEqual(seen.tv.size, 2, 'TVの王者/挑戦者の両方を踏めていない');
});

section('関係修復斡旋書の説明文に内部変数名・増減の数値が無い', () => {
  const doc = Engine.shachoshitsu.getDoc('relationship_repair');
  assert.ok(doc, '書類が見つからない');
  [doc.body, doc.detailText, doc.effectSummary, doc.recommendation].forEach(s => {
    assert.ok(!INTERNAL.test(s), `内部変数名が出ている: ${s}`);
  });
  [doc.effectSummary, doc.recommendation].forEach(s => {
    assert.ok(!/[0-9０-９]|\+/.test(s), `数値が出ている: ${s}`);
  });
  // 効果の値は不変
  assert.deepStrictEqual(doc.effect.bondDelta, [5, 10]);
  assert.strictEqual(doc.effect.successRate, 0.70);
});

section('関係修復の実行結果(ログ・決裁結果)に内部変数名・増減の数値が無く、関係値は従来どおり動く', () => {
  const f = (id) => ({ id, name: `選手${id}`, pw: 60, sp: 60, te: 60, st: 60, mn: 60, popularity: 40,
    salary: 30, trust: 50, condition: 80, age: 22 });
  let checkedSuccess = false, checkedFail = false;
  for (let seed = 1; seed <= 60 && !(checkedSuccess && checkedFail); seed++) {
    const state = {
      rngSeed: seed, season: 3, week: 10, offSeason: false, funds: 5000, orgPop: 30, decisionPoints: 5,
      roster: [f(1), f(2)], w1FireCount: { '1_2': 5 },
      relationships: { '1>2': { bond: 20, rivalry: 60 }, '2>1': { bond: 25, rivalry: 55 } },
    };
    const r = Engine.shachoshitsu.execute('relationship_repair', '1_2', state, {});
    assert.ok(!r.error, `実行エラー: ${r.error}`);
    const texts = [...(r.events || []), ...(r.changes || []).map(c => c.text)];
    texts.forEach(s => {
      assert.ok(!INTERNAL.test(s), `内部変数名が出ている: ${s}`);
      assert.ok(!/\+\s*[0-9]/.test(s), `増減の数値が出ている: ${s}`);
    });
    const rr = r.pairRepairResult || (r.relationships ? { success: true } : null);
    const rels = r.relationships || (r.pairRepairResult && r.pairRepairResult.relationships);
    if (rels && rels['1>2'] && rels['1>2'].bond !== 20) {
      const d = rels['1>2'].bond - 20;
      assert.ok(d >= 5 && d <= 10, `成功時の増分が 5〜10 の範囲外: ${d}`);
      assert.strictEqual(rels['2>1'].bond - 25, d, '双方向の増分が食い違う');
      assert.ok(texts.some(s => s.includes('わだかまり')), `成功時の文面が質的な言い方になっていない: ${JSON.stringify(texts)}`);
      checkedSuccess = true;
    } else {
      assert.ok(texts.some(s => s.includes('不発') || s.includes('埋まらなかった')), `失敗時の文面が無い: ${JSON.stringify(texts)} ${JSON.stringify(rr)}`);
      checkedFail = true;
    }
  }
  assert.ok(checkedSuccess, '成功の経路を踏めていない');
  assert.ok(checkedFail, '失敗の経路を踏めていない');
});

console.log('');
if (failed > 0) {
  console.log(`FAIL: ${failed} section(s)`);
  process.exit(1);
}
console.log('ALL PASS');
