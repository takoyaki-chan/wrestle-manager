#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  i18n Stage B P7-27: 年代記・同期(peer)叙述パーツの軸ラベル(AXIS_LABELS)往復テスト
//
//  ■ 何を守るか
//    `Engine.chronicle._buildPeerNarrativeParts` が返す冒頭パーツ(openingPart)は
//    G.chronicle.chaptersCache へ永続する素材なので、
//      1. 値 `v.styleJa` は **常にJAの1語ラベル**(dict の有無に関わらず)
//      2. `L` マーカーに `styleJa` を含み、描画時 `narrativeText(parts, dict)` で辞書を引く
//      3. dict を渡さない `narrativeText(parts)`(=保存される `narrative`)は従来どおりJA
//    を機械的に保証する。ENの同期カードで「her 組技 game」のようにJAが残っていた
//    実バグ(ignite chronicle --lang en の IGNITION_MISFIRE)の再発防止。
//
//  ■ 使い方
//    node test/chronicle-narrative-parts-i18n-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

loadAsGlobal('data.js');
loadAsGlobal('management.js');

// 擬似EN辞書: 軸ラベルと {styleJa} 入りの冒頭テンプレだけ訳し、それ以外は原文のまま
// (WM_I18N.t と同じく「辞書を引いてからプレースホルダを充填」する)
const EN = {
  '打撃': 'Striking', '組技': 'Grappling', '関節技': 'Submission', '喧嘩': 'Brawling', '万能': 'All-round',
  '独自': 'Original', '団体': 'Promotion',
};
Object.entries(CHRONICLE_NARRATIVE_TEMPLATES.peer.opening).forEach(([, pool]) => {
  pool.forEach(tpl => { if (tpl.includes('{styleJa}')) EN[tpl] = `EN<${tpl}>`; });
});
function fakeDict(text, params) {
  let out = Object.prototype.hasOwnProperty.call(EN, text) ? EN[text] : text;
  if (params) Object.keys(params).forEach(k => { out = out.split(`{${k}}`).join(params[k]); });
  return out;
}
// ja時の WM_I18N.t 相当: 辞書を引かずプレースホルダだけ充填する
function jaDict(text, params) {
  let out = text;
  if (params) Object.keys(params).forEach(k => { out = out.split(`{${k}}`).join(params[k]); });
  return out;
}
const JA_AXIS = Object.values(Engine.chronicle.AXIS_LABELS);
const hasJaAxis = s => JA_AXIS.some(l => s.includes(l));

function makePeer(id, style) {
  return {
    id, name: `年代記 同期${id}`, style,
    personality: 'normal', archetype: 'normal',
    peakOVR: 82, peakPopularity: 60,
    careerRecord: { history: [{ type: 'debut', season: 3 }] },
    traits: [], _stage: 'prime', _role: 'strength',
  };
}
const chapter = { number: 1, seasonStart: 3, seasonEnd: 6 };
function makeState(orgName) {
  const s = { rngSeed: 42, season: 10, roster: [], h2h: {}, chronicle: Engine.chronicle.createEmpty() };
  if (orgName) s.orgName = orgName;
  return s;
}

let checked = 0;
let checkedWithStyle = 0;

// ── 1. 全軸 × 複数ID: 冒頭パーツの構造と JA/EN 往復 ──
Object.keys(Engine.chronicle.AXIS_LABELS).forEach(axis => {
  const jaLabel = Engine.chronicle.AXIS_LABELS[axis];
  // _styleAxis の入力は選手の style。軸キーがそのまま style として通る前提を確認
  assert.strictEqual(Engine.chronicle._styleAxis(axis), axis, `_styleAxis(${axis}) が軸キーを返さない`);
  for (let id = 1; id <= 24; id++) {
    const peer = makePeer(id, axis);
    const state = makeState('Test Org');
    const parts = Engine.chronicle._buildPeerNarrativeParts(peer, chapter, [], [peer], state);
    assert.ok(Array.isArray(parts) && parts.length >= 1, 'parts が空');
    const opening = parts[0];
    assert.ok(Array.isArray(opening.L) && opening.L.includes('styleJa'),
      `[${axis}#${id}] 冒頭パーツに L:['styleJa'] が無い: ${JSON.stringify(opening)}`);
    assert.ok(!opening.L.includes('org'), `[${axis}#${id}] 実在の団体名に L:org を付けてはいけない`);
    assert.strictEqual(opening.v.styleJa, jaLabel, `[${axis}#${id}] v.styleJa がJAラベルでない`);
    assert.strictEqual(opening.v.org, 'Test Org', `[${axis}#${id}] v.org が団体名でない`);

    // dict を渡して作っても永続値はJA(パーツは言語非依存)
    const partsWithDict = Engine.chronicle._buildPeerNarrativeParts(peer, chapter, [], [peer], state, fakeDict);
    assert.strictEqual(partsWithDict[0].v.styleJa, jaLabel, `[${axis}#${id}] dict付きで作るとJAラベルが訳されて永続する`);
    assert.strictEqual(partsWithDict[0].t, opening.t, `[${axis}#${id}] dict の有無でテンプレ抽選が変わる`);

    // JA完成文(保存値)にはJAラベルが入り、ENの訳語は混ざらない
    const ja = Engine.chronicle.narrativeText(parts);
    assert.ok(!ja.includes(EN[jaLabel]), `[${axis}#${id}] JA完成文にEN訳語が混入: ${ja}`);
    // 同じ文を「JA素通し dict」(訳さず充填だけ = ja時の WM_I18N.t)で作っても1文字も変わらない
    const jaViaDict = Engine.chronicle.narrativeText(parts, jaDict);
    assert.strictEqual(jaViaDict, ja, `[${axis}#${id}] JA素通し dict で完成文が変わる`);

    checked++;
    if (opening.t.includes('{styleJa}')) {
      checkedWithStyle++;
      assert.ok(ja.includes(jaLabel), `[${axis}#${id}] JA完成文に軸ラベルが無い: ${ja}`);
      const en = Engine.chronicle.narrativeText(parts, fakeDict);
      assert.ok(en.includes(EN[jaLabel]), `[${axis}#${id}] EN完成文に訳語(${EN[jaLabel]})が無い: ${en}`);
      assert.ok(en.includes(`EN<`), `[${axis}#${id}] 冒頭テンプレが辞書を通っていない: ${en}`);
      const enOpening = Engine.chronicle._narrativePartText(opening, fakeDict);
      assert.ok(!hasJaAxis(enOpening), `[${axis}#${id}] EN冒頭文にJA軸ラベルが残る: ${enOpening}`);
    }
  }
});
assert.ok(checkedWithStyle >= 5, `{styleJa} を含む冒頭テンプレが十分に抽選されなかった(${checkedWithStyle})`);

// ── 2. 団体名が取れないとき: 既定ラベル「団体」だけ L で辞書を引く ──
{
  const peer = makePeer(3, 'striker');
  const parts = Engine.chronicle._buildPeerNarrativeParts(peer, chapter, [], [peer], makeState(null));
  const opening = parts[0];
  assert.deepStrictEqual([...opening.L].sort(), ['org', 'styleJa'], `orgName 無しのとき L が ['org','styleJa'] でない: ${JSON.stringify(opening.L)}`);
  assert.strictEqual(opening.v.org, '団体');
  assert.strictEqual(opening.v.styleJa, '打撃');
  // 描画時の値変換: org/styleJa の両方が辞書を通る
  const v = { ...opening.v };
  const rendered = Engine.chronicle._narrativePartText({ t: '{org}/{styleJa}', v, L: opening.L }, fakeDict);
  assert.strictEqual(rendered, 'Promotion/Striking');
  const renderedJa = Engine.chronicle._narrativePartText({ t: '{org}/{styleJa}', v, L: opening.L });
  assert.strictEqual(renderedJa, '団体/打撃');
}

// ── 3. 未知スタイル: フォールバック「独自」も同じ経路 ──
{
  const peer = makePeer(5, 'mystery-style');
  const parts = Engine.chronicle._buildPeerNarrativeParts(peer, chapter, [], [peer], makeState('Test Org'));
  const axisJa = Engine.chronicle.AXIS_LABELS[Engine.chronicle._styleAxis('mystery-style')] || '独自';
  assert.strictEqual(parts[0].v.styleJa, axisJa);
  assert.ok(parts[0].L.includes('styleJa'));
}

console.log(`chronicle-narrative-parts-i18n-test: OK (${checked} peer parts checked, ${checkedWithStyle} with {styleJa})`);
