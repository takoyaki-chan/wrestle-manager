'use strict';
// 呼び名(2026-09-25 Keisuke 裁定 / specs/call-name-spec-v1.0.md)の回帰テスト。
//   1) 判定: 既定は名字 / 絆85で下の名前 / 記録ありは50以上なら下の名前のまま / 50未満で名字に戻る /
//      84↔86 の往復で戻らない / 方向あり / コーチ(話し手なし)は常に名字 / 例外4名 / 関係値なし / 旧セーブ
//   2) 週次の記録更新(updateGivenNameCalls)は入力を書き換えず、変化が無ければ同じ state を返す
//   3) tickWeek に組み込んだ記録更新は givenNameCalls 以外の状態(関係値・乱数の結果)を一切変えない
//   4) validateGameState の参照整合チェック
//   5) 英語の名字・下の名前が127名全員で日本語を含まない(名前台帳 → lang-en-names.js の生成物)
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const srcDir = path.join(__dirname, '..', 'src');
const JA_RE = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;

// ── Engine を実ゲームと同じ順で読み込む(auto-sim と同じ作法) ────────────────
let randState = 7;
Math.random = function seededRandom() {
  randState = (Math.imul(randState, 1664525) + 1013904223) >>> 0;
  return randState / 0x100000000;
};
const resetRandom = (seed) => { randState = seed >>> 0; };
global.window = { IS_TRIAL: false };
global.WM_I18N = { t(text, params) {
  if (typeof text !== 'string' || !params) return text;
  let out = text;
  Object.keys(params).forEach((key) => { out = out.split('{' + key + '}').join(params[key]); });
  return out;
}, pn(str) { return str; }, pnSurname(str) { return str; }, mv(str) { return str; }, mvShort(str) { return str; } };
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js',
  'relationships.js', 'flag-dialogue.js', 'factions.js', 'draft-negotiation.js'].forEach(loadAsGlobal);

const R = Engine.relationships;
assert.strictEqual(R.CALL_NAME.givenEnter, 85, '下の名前に切り替わる絆は devoted の下限');
assert.strictEqual(R.getBondBand(R.CALL_NAME.givenEnter), 'devoted', 'getBondBand と同じ閾値');
assert.strictEqual(R.getBondBand(R.CALL_NAME.givenEnter - 0.1), 'close');
assert.strictEqual(R.CALL_NAME.givenKeep, 50, '一度切り替えたら50未満まで戻さない');

const byId = (id) => ALL_CHARS.find(c => c.id === id);
const TOKO = byId(1);   // 阿武隈塔子
const KANAKO = byId(2); // 富岡加奈子
assert.strictEqual(TOKO.name, '阿武隈塔子');
assert.strictEqual(KANAKO.name, '富岡加奈子');
const st = (rels, calls) => {
  const s = { relationships: rels || {} };
  if (calls !== undefined) s.givenNameCalls = calls;
  return s;
};
const call = (state, from, to) => R.callName(state, from, to);

// ── 1) 判定 ─────────────────────────────────────────────
{
  // 既定(関係値なし)は名字
  const c0 = call(st(), 2, 1);
  assert.deepStrictEqual([c0.form, c0.ja, c0.full, c0.surname, c0.given], ['surname', '阿武隈', '阿武隈塔子', '阿武隈', '塔子']);
  // 絆50〜84.9 は名字、85 で下の名前
  assert.strictEqual(call(st({ '2>1': { bond: 84.9 } }), 2, 1).ja, '阿武隈');
  assert.strictEqual(call(st({ '2>1': { bond: 85 } }), 2, 1).ja, '塔子');
  assert.strictEqual(call(st({ '2>1': { bond: 100 } }), 2, 1).form, 'given');
  // 方向あり: 2→1 が devoted でも 1→2 は名字
  assert.strictEqual(call(st({ '2>1': { bond: 95 }, '1>2': { bond: 60 } }), 1, 2).ja, '富岡');
  // 記録あり: 50 以上なら下の名前のまま、50 未満で名字
  assert.strictEqual(call(st({ '2>1': { bond: 50 } }, { '2>1': true }), 2, 1).ja, '塔子');
  assert.strictEqual(call(st({ '2>1': { bond: 49.9 } }, { '2>1': true }), 2, 1).ja, '阿武隈');
  // 記録は向きごと(逆向きの記録は効かない)
  assert.strictEqual(call(st({ '2>1': { bond: 70 } }, { '1>2': true }), 2, 1).ja, '阿武隈');
  // 関係値ごと消えた方向(引退の片付け)は記録どおり。記録も関係値も無ければ名字
  assert.strictEqual(call(st({}, { '2>1': true }), 2, 1).ja, '塔子');
  assert.strictEqual(call(st({}, {}), 2, 1).ja, '阿武隈');
  // 話し手なし(コーチ・記者)は絆に関係なく名字
  assert.strictEqual(call(st({ '2>1': { bond: 99 } }, { '2>1': true }), null, 1).ja, '阿武隈');
  // 自分自身は名字(下の名前へ切り替えない)
  assert.strictEqual(call(st({ '1>1': { bond: 99 } }), 1, 1).ja, '阿武隈');
  // 話し手 id は数字の文字列でもよい
  assert.strictEqual(call(st({ '2>1': { bond: 90 } }), '2', 1).ja, '塔子');
  // 相手は id / 選手オブジェクト / フルネームのどれでも同じ
  const s90 = st({ '2>1': { bond: 90 } });
  assert.strictEqual(call(s90, 2, TOKO).ja, '塔子');
  assert.strictEqual(call(s90, 2, '阿武隈塔子').ja, '塔子');
  // 相手不明は null
  assert.strictEqual(call(s90, 2, null), null);
  assert.strictEqual(call(s90, 2, 999999), null);
  // state が無くても名字で答える
  assert.strictEqual(call(null, 2, 1).ja, '阿武隈');
  assert.strictEqual(call(undefined, 2, 1).ja, '阿武隈');
  // コーチ(ALL_CHARS に無い「姓 名」)は空白の前を名字に
  const coach = ALL_COACHES[0];
  const cc = call(s90, 2, coach);
  assert.strictEqual(cc.ja, coach.name.split(' ')[0], 'コーチは空白区切りの先頭が名字');
  assert.strictEqual(cc.id, null, 'コーチは選手 id を持たない(選手の関係値を引かない)');
  // ALL_CHARS の id を使い回した別人(名前が違う臨時オブジェクト)は、その id の関係値を引かない
  const fake = call(s90, 2, { id: 1, name: '仮名 花子' });
  assert.deepStrictEqual([fake.ja, fake.id, fake.form], ['仮名', null, 'surname']);
}

// 例外4名(名字が末尾・リングネーム・空白入り)
{
  const EXPECT = {
    87: { surname: 'シュタインフェルト', given: 'レオナ' },   // レオナ・O・シュタインフェルト
    116: { surname: 'モーガン', given: 'リナ' },              // リナ・モーガン
    117: { surname: '毒島', given: null },                    // クラッシャー毒島(リングネーム。常に名字)
    124: { surname: '清川', given: '怜' },                    // 清川 怜
  };
  Object.keys(EXPECT).forEach(k => {
    const id = Number(k);
    const e = EXPECT[k];
    const low = call(st({ ['1>' + id]: { bond: 60 } }), 1, id);
    assert.strictEqual(low.ja, e.surname, `id${id} 既定は名字`);
    const high = call(st({ ['1>' + id]: { bond: 99 } }, { ['1>' + id]: true }), 1, id);
    assert.strictEqual(high.ja, e.given || e.surname, `id${id} devoted: ${e.given ? '下の名前' : '名字のまま'}`);
    assert.strictEqual(high.form, e.given ? 'given' : 'surname');
  });
  // 127名全員: 名字は ALL_CHARS.surname、下の名前はフルネームに含まれ、名字とも空文字とも違う
  assert.strictEqual(ALL_CHARS.length, 127);
  const surnames = new Set();
  ALL_CHARS.forEach(c => {
    const p = R.callNameParts(c.id);
    assert.strictEqual(p.surname, c.surname, `${c.id} 名字`);
    assert.ok(!surnames.has(p.surname), `${c.id} 名字の重複(呼び名が二人を指してしまう)`);
    surnames.add(p.surname);
    if (c.id === 117) { assert.strictEqual(p.given, null); return; }
    assert.ok(p.given && c.name.includes(p.given) && p.given !== c.surname && p.given.trim() === p.given,
      `${c.id} ${c.name} 下の名前 "${p.given}"`);
    assert.strictEqual(p.full, c.name);
  });
  // 名前台帳の jaGiven と一致(台帳の EN と対になる JA)
  const ledger = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'i18n', 'names-ledger.json'), 'utf8'));
  ledger.characters.forEach(e => {
    assert.strictEqual(R.callNameParts(e.id).given, e.jaGiven, `台帳 jaGiven と一致 id${e.id}`);
  });
}

// ── 2) 週次の記録更新: 84↔86 の往復で戻らない / 50未満で消える / 入力を書き換えない / 旧セーブ ──
{
  const week = (s, bond) => R.updateGivenNameCalls({ ...s, relationships: { ...s.relationships, '2>1': { bond, rivalry: 0 } } });
  let s = st({ '2>1': { bond: 50 } });                    // 旧セーブ: 表なし
  const same = R.updateGivenNameCalls(s);
  assert.strictEqual(same, s, '変化が無ければ同じ state(旧セーブで表を作らない)');
  assert.strictEqual(same.givenNameCalls, undefined);
  const trail = [];
  for (const bond of [84, 86, 84, 86, 84, 70, 50, 49, 60, 84, 85, 80]) {
    s = week(s, bond);
    trail.push(`${bond}:${call(s, 2, 1).ja}`);
  }
  assert.deepStrictEqual(trail, [
    '84:阿武隈', '86:塔子', '84:塔子', '86:塔子', '84:塔子', '70:塔子', '50:塔子', '49:阿武隈', '60:阿武隈', '84:阿武隈', '85:塔子', '80:塔子',
  ], '一度下の名前にしたら50未満まで戻さない');
  // 入力は書き換えない
  const input = { relationships: { '2>1': { bond: 90 } }, givenNameCalls: { '3>1': true } };
  const snap = JSON.stringify(input);
  const out = R.updateGivenNameCalls(input);
  assert.strictEqual(JSON.stringify(input), snap, '入力の state を書き換えない');
  assert.deepStrictEqual(out.givenNameCalls, { '3>1': true, '2>1': true }, '関係値の無い方向の記録は残す');
  // 下の名前を持たない相手(クラッシャー毒島)は記録しない / 壊れた型は空の表に直す
  assert.strictEqual(R.updateGivenNameCalls({ relationships: { '1>117': { bond: 99 } } }).givenNameCalls, undefined);
  assert.deepStrictEqual(R.updateGivenNameCalls({ relationships: {}, givenNameCalls: [] }).givenNameCalls, {});
  assert.deepStrictEqual(R.updateGivenNameCalls({ relationships: { '1>2': { bond: 40 } }, givenNameCalls: { '1>2': true, '1>117': true } }).givenNameCalls, {});
  // 関係値の無い state はそのまま
  const noRel = { season: 1 };
  assert.strictEqual(R.updateGivenNameCalls(noRel), noRel);
}

// ── 3) tickWeek 結合: 記録の更新は givenNameCalls 以外を変えない ──────────────
{
  let G = Engine.createInitialState(42, true);
  G = Engine.career.generateAllBackstories(G);
  G = Engine.relationships.initialize(G);
  G = Engine.career.generateInheritedRecords(G);
  const a = G.roster[0].id;
  const b = G.roster[1].id;
  const c = G.roster[2].id;
  G = { ...G, relationships: { ...G.relationships,
    [`${a}>${b}`]: { ...G.relationships[`${a}>${b}`], bond: 95 },
    [`${b}>${c}`]: { ...G.relationships[`${b}>${c}`], bond: 30 } },
    givenNameCalls: undefined };
  delete G.givenNameCalls; // 旧セーブ相当
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const realUpdate = R.updateGivenNameCalls;
  let withCalls = clone(G);
  let without = clone(G);
  for (let i = 0; i < 6; i++) {
    resetRandom(500 + i);
    withCalls = Engine.tickWeek(withCalls).state;
    R.updateGivenNameCalls = (s) => s;
    try {
      resetRandom(500 + i);
      without = Engine.tickWeek(without).state;
    } finally {
      R.updateGivenNameCalls = realUpdate;
    }
    const strip = (s) => { const { givenNameCalls: _g, debugLog: _d, ...rest } = s; return rest; };
    assert.deepStrictEqual(strip(clone(withCalls)), strip(clone(without)), `週${i + 1}: 記録以外の状態は同一`);
  }
  assert.strictEqual(without.givenNameCalls, undefined, '記録更新を止めた側には表が無い');
  assert.ok(withCalls.givenNameCalls && withCalls.givenNameCalls[`${a}>${b}`] === true, '絆95の方向を記録');
  assert.ok(!withCalls.givenNameCalls[`${b}>${c}`], '絆30の方向は記録しない');
  Object.keys(withCalls.givenNameCalls).forEach(k => {
    const rel = withCalls.relationships[k];
    assert.ok(!rel || rel.bond >= 50, `${k}: 記録は絆50以上の方向だけ`);
  });
  // 冷えたら消える(関係値を書き換えて1週回す)
  const cooled = { ...withCalls, relationships: { ...withCalls.relationships, [`${a}>${b}`]: { ...withCalls.relationships[`${a}>${b}`], bond: 20 } } };
  resetRandom(900);
  const after = Engine.tickWeek(cooled).state;
  assert.ok(!after.givenNameCalls[`${a}>${b}`], '絆が50未満に冷えた方向の記録は消える');
  // tickWeek は入力を書き換えない(記録の表について)
  assert.ok(cooled.givenNameCalls[`${a}>${b}`] === true, '入力 state の表は書き換えない');
}

// ── 4) validateGameState の参照整合チェック ─────────────────
{
  const base = Engine.createInitialState(7, true);
  const warnsOf = (calls) => {
    const out = Engine.validateGameState({ ...base, debugLog: [], givenNameCalls: calls });
    return (out.debugLog || []).map(e => e.message).filter(m => /givenNameCalls/.test(m));
  };
  const origWarn = console.warn;
  console.warn = () => {};
  try {
    assert.deepStrictEqual(warnsOf({ '1>2': true, '2>1': true }), [], '正常な表は警告なし');
    assert.deepStrictEqual(warnsOf(undefined), [], '表が無い旧セーブは警告なし');
    assert.strictEqual(warnsOf([]).length, 1, '配列は不正');
    assert.strictEqual(warnsOf({ 'x>y': true }).length, 1, 'キーの形');
    assert.strictEqual(warnsOf({ '1>1': true }).length, 1, '自分自身');
    assert.strictEqual(warnsOf({ '1>999999': true }).length, 1, 'マスターに無い選手');
    assert.strictEqual(warnsOf({ '1>2': 'yes' }).length, 1, '値は true だけ');
  } finally {
    console.warn = origWarn;
  }
}

// ── 通知のコーチの報告: 「」の中だけ名字(地の文はフルネームのまま) ─────────────
{
  assert.deepStrictEqual([...R.speechOnlyPlaceholders('コーチ{coach}が社長室を訪れた。「{name}のことなんですが…」')], ['name']);
  assert.deepStrictEqual([...R.speechOnlyPlaceholders('{name}が「{name}です」と言った')], [], '外にも現れる名前は対象外');
  assert.deepStrictEqual([...R.speechOnlyPlaceholders('🗣️ コーチ{coach}が{name}について進言')], []);
  const pool = NOTIF_EVENT_TEXTS.N_coach_report;
  const seen = new Set();
  let quotedSurname = 0;
  for (let seed = 1; seed < 400 && seen.size < pool.length; seed++) {
    const rng = Engine.rng.create(seed);
    const r = Engine.eventSystem.pickText(rng, 'N_coach_report', { name: '阿武隈塔子', coach: '鬼塚 剛志' });
    seen.add(r.text + r.detail);
    [r.text, r.detail].forEach(line => {
      const inQuote = (line.match(/「[^」]*」/g) || []).join('');
      const outQuote = line.replace(/「[^」]*」/g, '');
      assert.ok(!inQuote.includes('阿武隈塔子'), `「」の中にフルネームが入らない: ${line}`);
      if (inQuote.includes('阿武隈')) quotedSurname++;
      if (/阿武隈/.test(outQuote)) assert.ok(outQuote.includes('阿武隈塔子'), `地の文はフルネーム: ${line}`);
    });
  }
  assert.strictEqual(seen.size, pool.length, 'コーチの報告の文面を全部見た');
  assert.ok(quotedSurname >= 5, '「」の中は名字');
  // 表の側: 「」の内と外の両方に同じ人名が出る文は無い(文ごとに名字/フルネームを決められる前提)
  Object.values(NOTIF_EVENT_TEXTS).concat(Object.values(LARGE_EVENT_TEXTS)).forEach(v => {
    const strings = [];
    const walk = (n) => { if (typeof n === 'string') strings.push(n); else if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === 'object') Object.values(n).forEach(walk); };
    walk(v);
    strings.forEach(s => ['name', 'name1', 'name2'].forEach(k => {
      if (!s.includes('{' + k + '}')) return;
      const inside = (s.match(/「[^」]*」/g) || []).some(q => q.includes('{' + k + '}'));
      const outside = s.replace(/「[^」]*」/g, '').includes('{' + k + '}');
      assert.ok(!(inside && outside), `「」の内外に同じ名前: ${s}`);
    }));
  });
}

// ── 5) 英語の名字・下の名前(台帳 → lang-en-names.js)───────────────────────────
{
  const sandbox = { console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  ['i18n.js', 'lang-en-names.js'].forEach(f => {
    new vm.Script(fs.readFileSync(path.join(srcDir, f), 'utf8'), { filename: f }).runInContext(sandbox);
  });
  const I = sandbox.WM_I18N;
  assert.ok(I && typeof I.pnGiven === 'function' && typeof I.addGivenNames === 'function', 'pnGiven / addGivenNames が公開されている');
  // ja は素通し
  assert.strictEqual(I.lang, 'ja');
  assert.strictEqual(I.pnGiven('阿武隈塔子'), '阿武隈塔子');
  I.setLang('en');
  assert.strictEqual(I.pnSurname('阿武隈塔子'), 'Abukuma');
  assert.strictEqual(I.pnGiven('阿武隈塔子'), 'Toko');
  assert.strictEqual(I.pnGiven('レオナ・O・シュタインフェルト'), 'Leona', 'ミドルイニシャルは下の名前に含めない');
  assert.strictEqual(I.pnGiven('清川 怜'), 'Rei');
  assert.strictEqual(I.pnGiven('リナ・モーガン'), 'Rina');
  assert.strictEqual(I.pnGiven('クラッシャー毒島'), 'Busujima', 'リングネームは名字へ fail-open');
  ALL_CHARS.forEach(c => {
    const sur = I.pnSurname(c.name);
    const giv = I.pnGiven(c.name);
    assert.ok(sur && !JA_RE.test(sur), `${c.id} ${c.name} 英語の名字 "${sur}"`);
    assert.ok(giv && !JA_RE.test(giv), `${c.id} ${c.name} 英語の下の名前 "${giv}"`);
    assert.ok(!/\s/.test(giv) || c.id === 117, `${c.id} 下の名前は1語 "${giv}"`);
    const p = R.callNameParts(c.id);
    if (p.given) assert.notStrictEqual(giv, sur, `${c.id} 下の名前と名字が別`);
  });
  // コーチは名字だけ(下の名前辞書に載せない)
  ALL_COACHES.forEach(co => {
    assert.ok(!JA_RE.test(I.pnSurname(co.name)), `コーチ ${co.name} 英語の名字`);
    assert.strictEqual(I.pnGiven(co.name), I.pnSurname(co.name), 'コーチは下の名前で呼ばない');
  });
  I.setLang('ja');
}

console.log('call-name-test: OK');
