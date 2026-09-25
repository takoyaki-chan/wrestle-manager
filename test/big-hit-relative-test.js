#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  K-6(2026-09-25 Keisuke裁定A): 「大ダメージ」を被弾側の最大HP比で決める — 回帰テスト
//    大ダメージ(action.isCrit) = 被弾側の最大HPの12%以上 / 特大(action.isHeavy) = 18%以上
//  1. 段判定の境界(整数比較。12%ちょうどを浮動小数の端数で取りこぼさない)
//  2. 観戦フレームの isCrit/isHeavy が被弾側の実際の最大HPに対する割合と一致する
//     (シングル通常戦・大一番・カウンター・開幕大技・タッグ)
//  3. 実況ログの「大ダメージ！」注記がフレームの isCrit と一致する
//  4. 演出専用: recordFrames の有無で勝敗・MQ・ターン数・HP・実況ログが変わらない
//  5. 配給の帯: 同格の通常戦で1試合約4回・大一番で約3回・特大は約1回(旧定義は命中の9割超)
//     ※ダメージ式・最大HPの式を意図して変えたときは、この帯を実測し直して更新する
//  6. 被弾セリフの入口 pickDamageLine は action.isCrit だけを見る(ダメージの絶対値では開かない)
//  7. 観戦iframe共通コア: _isHeavyHit(旧フレームは dmg>=20)と _frameMinDelay(溜めの間の確保)
//  乱数は試合ごとに Engine.rng.create(Engine.rng.derive(...))(本体準拠)。
// ══════════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js',
  'battle-lines.js', 'battle-replay-core.js'].forEach(loadAsGlobal);

let failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.error('  NG ' + msg); }
}
function rngFor(block, i) {
  let h = 2166136261;
  for (let k = 0; k < block.length; k++) { h ^= block.charCodeAt(k); h = Math.imul(h, 16777619); }
  return Engine.rng.create(Engine.rng.derive(20260925, h | 0, i));
}
const pctOf = (dmg, mhp) => dmg * 100 / mhp;

// ── 1. 境界 ─────────────────────────────────────────────
{
  const B = Engine.battle;
  check(B.isBigHit(42, 350) === true, '12%ちょうど(42/350)は大ダメージ');
  check(B.isBigHit(41, 350) === false, '12%未満(41/350)は大ダメージではない');
  check(B.isHeavyHit(63, 350) === true, '18%ちょうど(63/350)は特大');
  check(B.isHeavyHit(62, 350) === false, '18%未満(62/350)は特大ではない');
  check(B.isBigHit(0, 350) === false && B.isHeavyHit(0, 350) === false, 'ダメージ0はどちらでもない');
  check(B.isBigHit(20, 0) === false, '最大HPが不明(0)なら判定しない');
  // 旧定義(絶対値15)では大ダメージだった値が、大きい最大HPでは大ダメージにならない
  check(B.isBigHit(15, 354) === false, '旧定義の dmg≥15 は相対定義では大ダメージとは限らない');
}

// ── 2〜4. フレームのフラグ・実況ログ・演出専用 ────────────────────
const roster = ALL_CHARS.filter(c => c.pw && c.st);
function coreSingle(r) {
  return JSON.stringify([r.winner, r.finType, r.finMove, r.finishPhase, r.turns, r.mq, r.mqDetail, r.hpLeft, r.hpRight, r.log]);
}
let singleHitFrames = 0, openingSeen = 0, counterSeen = 0;
for (const tier of [1, 2]) {
  for (let i = 0; i < 160; i++) {
    const a = roster[(i * 7) % roster.length], b = roster[(i * 13 + 5) % roster.length];
    if (a.id === b.id) continue;
    const L = { ...a, popularity: 50 }, R = { ...b, popularity: 50 };
    const withF = Engine.battle.simulateMatch(L, R, rngFor(`single${tier}`, i), tier, { recordFrames: true });
    const noF = Engine.battle.simulateMatch(L, R, rngFor(`single${tier}`, i), tier, {});
    check(coreSingle(withF) === coreSingle(noF), `recordFrames の有無で試合結果が変わった(tier${tier} #${i})`);
    for (const fr of withF.frames) {
      const act = fr.action;
      if (!act || act.kind === 'miss') continue;
      singleHitFrames++;
      const defMhp = act.atkSide === 'left' ? fr.mhpR : fr.mhpL;
      check(typeof act.isCrit === 'boolean' && typeof act.isHeavy === 'boolean', 'フレームは isCrit/isHeavy を真偽値で持つ');
      const expHeavy = pctOf(act.dmg, defMhp) >= 18;
      check(act.isHeavy === expHeavy, `isHeavy が最大HP比と不一致 dmg=${act.dmg} mhp=${defMhp}`);
      if (act.openingExecution) {
        openingSeen++;
        check(act.isCrit === true, '開幕大技の命中は常に大ダメージ');
      } else {
        check(act.isCrit === (pctOf(act.dmg, defMhp) >= 12), `isCrit が最大HP比と不一致 dmg=${act.dmg} mhp=${defMhp}`);
      }
      if (act.kind === 'counter') counterSeen++;
      if (act.kind === 'hit' && !act.openingExecution) {
        const line = (fr.logLines || []).find(l => /^T\d+: /.test(l));
        check(!!line && line.includes('の大ダメージ！') === act.isCrit, `実況ログの「大ダメージ！」注記がフラグと不一致: ${line}`);
      }
    }
  }
}
check(singleHitFrames > 3000, `シングルの命中フレームを十分に見た(${singleHitFrames})`);
check(counterSeen > 20, `カウンターのフレームを見た(${counterSeen})`);

// 開幕大技はOVR差15以上のカードでだけ起きるので、格差カードで別に確かめる
{
  let found = 0;
  const mk = (id, s) => ({ id, name: 'X' + id, pw: s, sp: s, te: s, st: s, mn: s, style: 'Allround', popularity: 50, traits: [] });
  for (let i = 0; i < 400 && found < 5; i++) {
    const r = Engine.battle.simulateMatch(mk(1, 110), mk(2, 70), rngFor('opening', i), 1, { recordFrames: true });
    const f = r.frames.find(x => x.action && x.action.openingExecution && x.action.kind === 'hit');
    if (!f) continue;
    found++;
    check(f.action.isCrit === true, '開幕大技の命中は大ダメージ');
    check(f.action.isHeavy === (pctOf(f.action.dmg, f.mhpR) >= 18), '開幕大技の特大は実ダメージで判定');
  }
  check(found >= 3, `開幕大技の命中フレームを確認できた(${found})`);
}

// タッグ: 被弾側の最大HPは 70+ST(TAG_MATCH_CONFIG)
{
  let tagHit = 0;
  const coreTag = r => JSON.stringify([r.winner, r.finType, r.finMove, r.turns, r.mq, r.log, r.perFighter]);
  for (let i = 0; i < 80; i++) {
    const f = [0, 1, 2, 3].map(k => ({ ...roster[(i * 5 + k * 11) % roster.length], id: 1000 + i * 4 + k, popularity: 50 }));
    const A = { fighter1: f[0], fighter2: f[1] }, Bt = { fighter1: f[2], fighter2: f[3] };
    const withF = Engine.tagMatch.simulateTagMatch(A, Bt, rngFor('tag', i), { recordFrames: true, bond_A: 60, bond_B: 40 });
    const noF = Engine.tagMatch.simulateTagMatch(A, Bt, rngFor('tag', i), { bond_A: 60, bond_B: 40 });
    check(coreTag(withF) === coreTag(noF), `タッグ: recordFrames の有無で試合結果が変わった(#${i})`);
    const mhpOf = {};
    f.forEach(x => { mhpOf[x.id] = Math.round(TAG_MATCH_CONFIG.hpBase + x.st * TAG_MATCH_CONFIG.hpScale); });
    for (const fr of withF.frames) {
      const act = fr.action;
      if (!act || act.kind === 'miss') continue;
      tagHit++;
      const mhp = mhpOf[act.defenderId];
      check(act.isCrit === (pctOf(act.dmg, mhp) >= 12), `タッグ isCrit 不一致 dmg=${act.dmg} mhp=${mhp}`);
      check(act.isHeavy === (pctOf(act.dmg, mhp) >= 18), `タッグ isHeavy 不一致 dmg=${act.dmg} mhp=${mhp}`);
    }
  }
  check(tagHit > 1000, `タッグの命中フレームを十分に見た(${tagHit})`);
}

// ── 5. 配給の帯(同格の平坦ステ OVR85) ──────────────────────────
{
  const styles = Object.keys(styleMoves);
  const mk = (id, s, style) => ({ id, name: 'X' + id, pw: s, sp: s, te: s, st: s, mn: s, style, popularity: 50, traits: [] });
  const band = {};
  for (const tier of [1, 2]) {
    let n = 0, hits = 0, crit = 0, heavy = 0;
    for (let i = 0; i < 300; i++) {
      const r = Engine.battle.simulateMatch(mk(1, 85, styles[i % styles.length]), mk(2, 85, styles[(i * 3 + 1) % styles.length]),
        rngFor(`band${tier}`, i), tier, { recordFrames: true });
      n++;
      for (const fr of r.frames) {
        const act = fr.action;
        if (!act || act.kind === 'miss') continue;
        hits++;
        if (act.isCrit) crit++;
        if (act.isHeavy) heavy++;
      }
    }
    band[tier] = { crit: crit / n, heavy: heavy / n, share: crit / hits };
  }
  check(band[1].crit >= 3.0 && band[1].crit <= 5.5, `通常戦の大ダメージが1試合約4回の帯から外れた(${band[1].crit.toFixed(2)})`);
  check(band[1].heavy >= 0.6 && band[1].heavy <= 2.0, `通常戦の特大が1試合約1回の帯から外れた(${band[1].heavy.toFixed(2)})`);
  check(band[1].share < 0.5, `大ダメージが命中の半分以上になった(${(band[1].share * 100).toFixed(0)}%) — 全部が山場に戻っていないか`);
  check(band[2].crit >= 1.8 && band[2].crit <= 4.0, `大一番の大ダメージが1試合約3回の帯から外れた(${band[2].crit.toFixed(2)})`);
  console.log(`  帯: 通常戦 大${band[1].crit.toFixed(2)}/特大${band[1].heavy.toFixed(2)}(命中の${(band[1].share * 100).toFixed(0)}%) 大一番 大${band[2].crit.toFixed(2)}/特大${band[2].heavy.toFixed(2)}`);
}

// ── 6. pickDamageLine の入口 ───────────────────────────────
{
  const fighter = { personality: 'normal', archetype: 'standard' };
  const zero = () => 0;
  check(pickDamageLine(fighter, { kind: 'hit', dmg: 999, isCrit: false }, 0.9, zero) === null, '大ダメージでなければダメージ値が大きくてもセリフを抽選しない');
  check(pickDamageLine(fighter, { kind: 'miss', dmg: 0, isCrit: true }, 0.9, zero) === null, 'MISSは抽選しない');
  check(pickDamageLine(fighter, null, 0.9, zero) === null, 'action なしは抽選しない');
  const serif = pickDamageLine(fighter, { kind: 'hit', dmg: 5, isCrit: true }, 0.9, zero);
  check(!!serif && serif.type === 'serif', 'HP66%超の大ダメージはセリフ帯(ダメージ値が小さくても isCrit を正とする)');
  const voice = pickDamageLine(fighter, { kind: 'hit', dmg: 50, isCrit: true }, 0.2, zero);
  check(!!voice && voice.type === 'voice', 'HP33%以下の大ダメージはボイスのみ');
  check(pickDamageLine(fighter, { kind: 'hit', dmg: 50, isCrit: true }, 0.2, () => 0.99) === null, 'HP33%以下で抽選に外れたら何も出さない');
}

// ── 7. 観戦iframe共通コア ─────────────────────────────────
{
  check(_isHeavyHit({ kind: 'hit', dmg: 90, isHeavy: false }) === false, 'isHeavy を持つフレームは dmg ではなくフラグを正とする');
  check(_isHeavyHit({ kind: 'hit', dmg: 25 }) === true, 'isHeavy を持たない旧フレームは従来の dmg>=20');
  check(_isHeavyHit({ kind: 'hit', dmg: 19 }) === false, '旧フレームで dmg<20 は特大ではない');
  check(_isHeavyHit({ kind: 'miss', dmg: 99, isHeavy: true }) === false, 'MISSは特大ではない');
  check(_isHeavyHit(null) === false, 'action なしは特大ではない');
  const fr = (action) => ({ action });
  check(_frameMinDelay(fr({ kind: 'hit', dmg: 40, isCrit: false, isHeavy: false })) === 900, '通常の命中は900ms');
  check(_frameMinDelay(fr({ kind: 'hit', dmg: 40, isCrit: true, isHeavy: false })) === 1300, '大ダメージ(特大でない)は1300ms');
  check(_frameMinDelay(fr({ kind: 'hit', dmg: 70, isCrit: true, isHeavy: true })) === 3300, '特大は+2000msで3300ms');
  check(_frameMinDelay(fr({ kind: 'hit', dmg: 40, isCrit: true, isHeavy: false }), true) === 3300, 'シングルの溜めが走るフレームは特大でなくても3300ms');
  check(_frameMinDelay(fr({ kind: 'hit', dmg: 10, isCrit: false, isHeavy: false }), true) === 2900, '溜めが走る通常の命中は2900ms');
  check(_frameMinDelay(fr({ kind: 'miss', dmg: 0, isCrit: false }), true) === 700, 'MISSには溜めの間を足さない');
  check(_frameMinDelay(fr({ kind: 'hit', dmg: 25, isCrit: true })) === 3300, '旧フレーム(isHeavyなし・dmg>=20)は従来どおり3300ms');
}

if (failures > 0) {
  console.error(`big-hit-relative-test: FAIL (${failures})`);
  process.exit(1);
}
console.log('big-hit-relative-test: ok');
