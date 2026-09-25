'use strict';
// K-14(2026-09-25 Keisuke 承認)タッグ勝利セリフの回帰テスト。
//   - TAG_MATCH_WIN_LINES: 口調7×性格7の49セル×2本。各セルちょうど1本が {partner} を1回だけ含み、もう1本は { を含まない
//   - 98本が互いに重複せず、名前なし21本(TAG_MATCH_WIN_NAMELESS_LINES)と同文が無い
//   - pickTagWinLine(f, '', dict) は名前入りの行を返さない / 呼び名を渡すと { が残らない
//   - 抽選は性格別2本+口調別の名前なし3本の5本から(名前入りは約20%)
//   - 英語: 全98本+名前なし21本に訳があり、{partner} の数が一致、英語の呼び名で埋めても日本語が出ない
//   - 呼び名の表(tagMatchCallNames)は話し手→相手の向きで名字/下の名前を決める
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const srcDir = path.join(__dirname, '..', 'src');
const read = (f) => fs.readFileSync(path.join(srcDir, f), 'utf8');
const JA_RE = /[぀-ヿ㐀-鿿]/;

const sandbox = { console, Math: Object.create(Math), JSON, IS_TRIAL: false };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const run = (f, transform) => {
  let code = read(f);
  if (transform) {
    code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
    code = code.replace(/^(const|let) /gm, 'var ');
  }
  new vm.Script(code, { filename: f }).runInContext(sandbox);
};
['i18n.js', 'lang-en.js', 'lang-en-names.js', 'lang-en-dialogue.js'].forEach(f => run(f, false));
['data.js', 'tag-battle-lines.js'].forEach(f => run(f, true));
// 呼び名の表の関数(ui-common.js)とエンジン(relationships.js)
['management.js', 'relationships.js'].forEach(f => run(f, true));
const UI = read('ui-common.js').replace(/\r\n/g, '\n');
const grab = (name) => {
  const at = UI.indexOf(`function ${name}(`);
  assert.ok(at >= 0, name);
  const end = UI.indexOf('\n}\n', at);
  assert.ok(end > at, `${name} の終わり`);
  return UI.slice(at, end + 2);
};
new vm.Script(grab('callNameText') + '\n' + grab('tagMatchCallNames'), { filename: 'ui-common.js#callNames' }).runInContext(sandbox);
const X = (c) => vm.runInContext(c, sandbox);
const I = X('WM_I18N');
const WIN = X('TAG_MATCH_WIN_LINES');
const NAMELESS = X('TAG_MATCH_WIN_NAMELESS_LINES');
const pick = X('pickTagWinLine');

const ARCH = ['standard', 'polite', 'seductive', 'delinquent', 'ojousama', 'cool', 'composed'];
const PERS = ['normal', 'earnest', 'bold', 'easygoing', 'quiet', 'shy', 'emotional'];

// ── 表の形 ──
assert.deepStrictEqual(Object.keys(WIN), ARCH, '口調7');
const all = [];
ARCH.forEach(a => {
  assert.deepStrictEqual(Object.keys(WIN[a]), PERS, `${a} 性格7`);
  PERS.forEach(p => {
    const cell = WIN[a][p];
    assert.strictEqual(cell.length, 2, `${a}.${p} は2本`);
    const named = cell.filter(l => l.includes('{partner}'));
    assert.strictEqual(named.length, 1, `${a}.${p} 名前入りはちょうど1本`);
    assert.strictEqual((named[0].match(/\{partner\}/g) || []).length, 1, `${a}.${p} 名前は1回だけ`);
    const plain = cell.find(l => !l.includes('{partner}'));
    assert.ok(!plain.includes('{'), `${a}.${p} 名前なしの行にプレースホルダが無い`);
    cell.forEach(l => all.push(l));
  });
});
assert.strictEqual(all.length, 98);
assert.strictEqual(new Set(all).size, 98, '98本が互いに重複しない');
const namelessAll = [].concat(...Object.values(NAMELESS));
assert.strictEqual(namelessAll.length, 21);
namelessAll.forEach(l => assert.ok(!all.includes(l), `名前なし21本と同文: ${l}`));
// 口調規則(裁定53・55): 一人称「あたし」・二人称「お前」を出さない。フルネーム用の敬称「先輩」「ちゃん」も使わない
all.concat(namelessAll).forEach(l => {
  assert.ok(!/あたし|お前/.test(l), `あたし/お前: ${l}`);
});
all.forEach(l => assert.ok(!/\{partner\}(先輩|ちゃん)/.test(l), `敬称は「さん」か呼び捨て: ${l}`));
assert.ok(NAMELESS.delinquent.includes('お疲れさん！　私らの勝ちだ！'), '名前なしのヤンキー1本は「私ら」');

// ── 抽選 ──
const f = (archetype, personality) => ({ id: 1, name: '阿武隈塔子', archetype, personality });
let seed = 12345;
sandbox.Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };
ARCH.forEach(a => PERS.forEach(p => {
  const pool = WIN[a][p].concat(NAMELESS[a]);
  for (let i = 0; i < 40; i++) {
    const noName = pick(f(a, p), '', null);
    assert.ok(!noName.includes('{') && !noName.includes('阿武隈'), `呼び名なしでは名前入りの行を出さない: ${noName}`);
    assert.ok(pool.includes(noName), `${a}.${p} の5本から引く`);
    const withName = pick(f(a, p), '富岡', null);
    assert.ok(!withName.includes('{'), `呼び名を渡すと { が残らない: ${withName}`);
    assert.ok(!withName.includes('富岡加奈子'), 'フルネームは入らない');
  }
}));
// 名前入りは5本に1本
{
  let named = 0;
  const N = 20000;
  for (let i = 0; i < N; i++) if (pick(f('polite', 'earnest'), '富岡', null).includes('富岡')) named++;
  const rate = named / N;
  assert.ok(rate > 0.18 && rate < 0.22, `名前入りの割合 ${rate}(期待 0.20)`);
}

// ── 英語 ──
I.setLang('en');
const missesBefore = I._misses.size;
all.concat(namelessAll).forEach(ja => {
  const en = I.t(ja);
  assert.ok(en !== ja && !JA_RE.test(en.replace('{partner}', '')), `英訳がある: ${ja}`);
  assert.strictEqual((en.match(/\{partner\}/g) || []).length, (ja.match(/\{partner\}/g) || []).length, `英訳の {partner} の数: ${ja}`);
  assert.ok(!/-san\b|-chan\b|senpai/i.test(en), `英語に敬称を付けない: ${en}`);
});
ARCH.forEach(a => PERS.forEach(p => {
  for (let i = 0; i < 10; i++) {
    const out = pick(f(a, p), 'Tomioka', I.t);
    assert.ok(!JA_RE.test(out) && !out.includes('{'), `[en] 日本語・プレースホルダが残らない: ${out}`);
  }
}));
assert.strictEqual(I._misses.size, missesBefore, '英語の辞書引きで漏れ(i18n-miss)が出ない');
I.setLang('ja');

// ── 吹き出しの長さ(最長の呼び名を入れた場合)の記録 ──
{
  const longJa = 'シュタインフェルト';
  const lensJa = all.map(l => l.replace('{partner}', longJa).length);
  I.setLang('en');
  const lensEn = all.map(l => I.t(l).replace('{partner}', 'Banyubashi').length);
  I.setLang('ja');
  const maxJa = Math.max(...lensJa);
  const maxEn = Math.max(...lensEn);
  assert.ok(maxJa <= 49, `日本語の最長 ${maxJa} 字(下書き §6 の上限49字)`);
  assert.ok(maxEn <= 110, `英語の最長 ${maxEn} 字(英語トーンバイブル上限110字)`);
  console.log(`  吹き出しの最長: 日本語${maxJa}字 / 英語${maxEn}字`);
}

// ── 呼び名の表: 話し手→相手の向きで決まる ──
{
  sandbox.G = { relationships: { '2>1': { bond: 90 }, '1>2': { bond: 60 }, '3>4': { bond: 86 } }, givenNameCalls: {} };
  const byId = (id) => X('ALL_CHARS').find(c => c.id === id);
  const map = JSON.parse(JSON.stringify(X('tagMatchCallNames')({ fighter1: byId(1), fighter2: byId(2) }, { fighter1: byId(3), fighter2: byId(4) }, sandbox.G)));
  assert.deepStrictEqual(map, { '1:2': '富岡', '2:1': '塔子', '3:4': '小春', '4:3': '澤出' });
  I.setLang('en');
  const mapEn = JSON.parse(JSON.stringify(X('tagMatchCallNames')({ fighter1: byId(1), fighter2: byId(2) }, { fighter1: byId(3), fighter2: byId(4) }, sandbox.G)));
  assert.deepStrictEqual(mapEn, { '1:2': 'Tomioka', '2:1': 'Toko', '3:4': 'Koharu', '4:3': 'Sawaide' });
  I.setLang('ja');
}

// ── 観戦画面の配線(ソース)──
{
  const main = read('tag-battle-main.js');
  assert.ok(main.includes('const winLine = pickTagWinLine(winFinisher, _tagCallName(winFinisher, winPartner), WM_I18N.t);'), '観戦画面は呼び名を渡す');
  assert.ok(/function _tagCallName\(speaker, partner\)\{[\s\S]*?S\.matchInfo && S\.matchInfo\.callNames/.test(main), '呼び名は matchInfo.callNames から');
  const app = read('app.js');
  assert.strictEqual(app.split("callNames: (typeof tagMatchCallNames === 'function') ? tagMatchCallNames(").length - 1, 2, '送り元2か所(春タッグ・興行のタッグ観戦)');
}

console.log('tag-win-lines-callname-test: OK');
