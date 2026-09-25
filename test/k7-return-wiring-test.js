'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-7(2026-09-25 Keisuke裁定A)「返し」の配線の回帰テスト
//   1. 丸め込み技は丸め込み専用の判定を先に通る(汎用フォール狙いの「ピン」決着に吸われない)
//   2. 丸め込みを返したら、フレーム rollup='kickout2' + 実況 rollupFail(観戦側の「返したーーっ！」経路)
//   3. 返しの回数(ピン・丸め込み・HP0の合計)は kickoutMax(通常2/大一番3)を超えない
//   4. 上乗せで脱出率が下がる逆転がない/回数上限で0になった側を上乗せで生き返らせない
//   5. 大一番のフォール狙いは BIGMATCH_ENG の成功率(基礎14・Climax+18)を読む。閾値は通常と同じ35%
//   6. 大一番のニアフォールは通常戦より多い(裁定の目標)
//   乱数は試合ごとに Engine.rng.create(Engine.rng.derive(...))(本体と同方式)
// ══════════════════════════════════════════════════════════════════════════════
const assert = require('assert');
const { loadGame } = require('./helpers/load-game.js');
loadGame();

const B = Engine.battle;
const ROLLUP_NAMES = new Set(commonMoves.filter(m => m.c === 'rollup').map(m => m.n));
const mk = (id, v) => ({ id, name: `F${id}`, pw: v, sp: v, te: v, st: v, mn: v, style: 'Allround', popularity: 50, traits: [] });
const rngFor = (tier, i) => Engine.rng.create(Engine.rng.derive(90725, tier, i));

// ── 4. 上乗せの足し方 ──
for (const chance of [0.05, 0.2, 0.4, 0.487, 0.6]) {
  for (const bonus of [0.02, 0.08, 0.15, 0.4]) {
    const out = B.addReturnBonus(chance, bonus, 0.6);
    assert.ok(out >= chance, `上乗せで脱出率が下がった: ${chance}+${bonus} → ${out}`);
    assert.ok(out <= Math.max(chance, 0.6) + 1e-12, `式の上限を超えた: ${out}`);
  }
}
assert.strictEqual(B.addReturnBonus(0, 0.15, 0.6), 0, '回数上限で0になった側を上乗せで生き返らせない');

// ── 5. 大一番の設定をフォール狙いが読む ──
assert.strictEqual(BIGMATCH_ENG.pinAttemptHpThreshold, ENG.pinAttemptHpThreshold, '大一番のフォール狙い閾値は通常と同じ(K-7で0.25の上書きを外した)');
{
  const atk = { ...mk(1, 85) }, def = { ...mk(2, 85), hp: 50, mhp: 500, gritTurns: 0 };
  const climax = { name: 'Climax' };
  const normal = B.calcPinAttemptSuccess(atk, def, 30, climax, ENG);
  const big = B.calcPinAttemptSuccess(atk, def, 30, climax, BIGMATCH_ENG);
  // HP10%・dmg30・MN85・Climax: 基礎 + 15 − 20.4 + Climax + (0.35−0.10)×100
  const expected = e => Math.min(80, Math.max(8, e.pinAttemptSuccessBase + 15 - 85 * e.pinAttemptMntPenalty + e.pinAttemptClimax + 25));
  assert.ok(Math.abs(normal - expected(ENG)) < 1e-9, `通常戦のフォール狙い成功率: ${normal}`);
  assert.ok(Math.abs(big - expected(BIGMATCH_ENG)) < 1e-9, `大一番のフォール狙い成功率が BIGMATCH_ENG を読んでいない: ${big}`);
  assert.ok(big < normal, '大一番のほうが3カウントが入りにくい');
  // タッグは引数なし=従来どおり ENG
  assert.strictEqual(B.calcPinAttemptSuccess(atk, def, 30, climax), normal, '引数なし(タッグ)は ENG のまま');
}

// ── 1〜3, 6. 試合を回して確かめる ──
const stat = { 1: { n: 0, nf: 0 }, 2: { n: 0, nf: 0 } };
let rollupKickouts = 0, rollupWins = 0;
for (const tier of [1, 2]) {
  const eng = tier >= 2 ? BIGMATCH_ENG : ENG;
  for (let i = 0; i < 1500; i++) {
    const r = B.simulateMatch(mk(1, 85), mk(2, 85), rngFor(tier, i), tier, { recordFrames: true });
    stat[tier].n++;
    assert.ok(!(r.finType === 'ピン' && ROLLUP_NAMES.has(r.finMove)), `丸め込み技が「ピン」決着に吸われた: ${r.finMove}`);
    if (r.finType === '丸め込み') rollupWins++;
    for (const f of r.frames) {
      assert.ok(f.kickoutCountL <= eng.kickoutMax && f.kickoutCountR <= eng.kickoutMax,
        `返しの回数が上限(${eng.kickoutMax})を超えた: L${f.kickoutCountL} R${f.kickoutCountR}`);
      if (f.pinAttempt === 'kickout2' || f.pinAttempt === 'kickout2_sub') stat[tier].nf++;
      if (f.kickout && f.kickout.count >= 1) stat[tier].nf++;
      if (f.rollup === 'kickout2') {
        stat[tier].nf++;
        rollupKickouts++;
        // 最後のターンが返しのまま時間切れになると、エンジンはそのフレームに winner(判定)を書く
        assert.ok(f.winner === null || f.finishPhase === 'Timeout', '丸め込みを返したフレームで決着していない(時間切れの上書きを除く)');
        const idx = f.logLineTpls.indexOf(BATTLE_LOG_TEMPLATES.single.rollupFail);
        assert.ok(idx >= 0, '丸め込みを返したフレームに実況 rollupFail がある');
        assert.strictEqual(f.logLineSpoilers[idx], true, 'rollupFail はピン演出中は伏せる行');
      }
    }
  }
}
assert.ok(rollupKickouts > 0, '丸め込みの返しが一度も起きていない(配線切れ)');
assert.ok(rollupWins > 0, '丸め込み決着が一度も起きていない(配線切れ)');
const nf1 = stat[1].nf / stat[1].n, nf2 = stat[2].nf / stat[2].n;
assert.ok(nf2 > nf1 + 0.05, `大一番のニアフォール(${nf2.toFixed(2)})が通常戦(${nf1.toFixed(2)})を上回っていない`);

// ── 観戦側: ピン演出の締め(3カウント/返した)はそのフレームの出来事で決める ──
{
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'battle-engine-main.js'), 'utf8').replace(/\r\n/g, '\n');
  const start = src.indexOf('function _buildPinCtrl(fr){');
  const end = src.indexOf('\nfunction _executePinStep', start);
  assert.ok(start >= 0 && end > start, '_buildPinCtrl を切り出せない');
  const build = new Function('S', 'WM_I18N', 'pk', 'PIN_INTRO_TEXTS', 'SUB_ATTEMPT_INTRO_TEXTS',
    src.slice(start, end) + '\nreturn _buildPinCtrl;')(
    { L: { name: 'L' }, R: { name: 'R' }, lastCritTurn: {} },
    { t: (s, p) => { let o = s; Object.keys(p || {}).forEach(k => { o = o.split('{' + k + '}').join(p[k]); }); return o; } },
    arr => arr[0], { tko: ['TKO'], pin: ['PIN'], fall: ['FALL'] }, ['SUB']);
  const last = fr => { const seq = build(fr).seq; return seq[seq.length - 1].text; };
  const hit = { kind: 'hit', atkSide: 'left', move: 'M', isCrit: false };
  assert.strictEqual(last({ action: hit, pinAttempt: 'kickout2', winner: 'left', finishPhase: 'Timeout' }), '返したーーーーっ！！',
    '時間切れで終わった最後のターンの返しを3カウントとして見せない');
  assert.strictEqual(last({ action: hit, pinAttempt: 'success', winner: 'left', finishPhase: 'Climax' }), '3ーーーーっ！！！');
  assert.strictEqual(last({ action: hit, pinAttempt: 'kickout2', winner: null }), '返したーーーーっ！！');
  assert.strictEqual(last({ action: hit, rollup: 'kickout2', winner: null }), '返したーーっ！', '丸め込みの返し');
  assert.strictEqual(last({ action: hit, rollup: 'success', winner: 'left', finishPhase: 'Climax' }), '3ーーーっ！！');
  assert.strictEqual(last({ action: hit, kickout: { count: 1, escapeType: 'gu' }, winner: 'left', finishPhase: 'Timeout' }), 'ロープ！ ロープブレイクーーっ！！',
    '時間切れで終わった最後のターンのロープブレイクをタップとして見せない');
}

console.log(`k7-return-wiring-test: ok (ニアフォール/試合 通常${nf1.toFixed(2)} 大一番${nf2.toFixed(2)}、丸め込み返し${rollupKickouts}回・丸め込み決着${rollupWins}回)`);
