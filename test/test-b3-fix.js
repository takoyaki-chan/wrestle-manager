#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  B3対抗戦バグ修正テスト
//  修正前: challengerにstyle/roleがなく、simulateMatch→selMoveでクラッシュ
//  修正後: style/roleフィールド追加 + selMoveにフォールバック
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    fail++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

console.log('=== B3 対抗戦バグ修正テスト ===\n');

// ── ヘルパー: aiOrgsにrosterがあるGameStateを直接構築 ──
function createStateWithAIOrgs(seed) {
  let G = Engine.createInitialState(seed, true);
  // aiOrgsを手動で構築（tickWeekに依存しない）
  if (!G.aiOrgs || Object.keys(G.aiOrgs).length === 0) {
    G = { ...G, aiOrgs: {} };
    // RIVAL_ORGSから各団体を初期化
    const initRng = Engine.rng.create(Engine.rng.derive(seed, 0xA101));
    if (typeof RIVAL_ORGS !== 'undefined') {
      for (const cfg of RIVAL_ORGS) {
        const org = Engine.rival.initOrg ? Engine.rival.initOrg(cfg, initRng) : null;
        if (org) G.aiOrgs[cfg.id] = org;
      }
    }
  }
  // orgPopをB3要件以上に
  G = { ...G, orgPop: 35, lastLargeEventWeek: 0, season: 2, week: 10 };
  return G;
}

// ── テスト1: B3イベント生成時にstyle/roleが含まれるか ──
console.log('【1】 B3イベント生成でstyle/roleが付与されるか');

let b3Generated = 0;
for (let seed = 1; seed <= 500 && b3Generated < 5; seed++) {
  let G = createStateWithAIOrgs(seed);
  if (!G.roster || G.roster.length === 0) continue;

  for (let attempt = 0; attempt < 200; attempt++) {
    const evtRng = Engine.rng.create(Engine.rng.derive(seed, attempt, 0xB3));
    const event = Engine.eventSystem.generateLargeEvent(evtRng, G, G.roster);
    if (event && event.type === 'B3') {
      test(`Seed ${seed}: challenger.style="${event.challenger.style}", role="${event.challenger.role}"`, () => {
        assert(event.challenger.style, 'style is falsy');
        assert(typeof event.challenger.style === 'string', 'style is not string');
        assert(event.challenger.role !== undefined, 'role is undefined');
      });
      b3Generated++;
      break;
    }
  }
}
console.log(`  → B3イベント生成: ${b3Generated}件\n`);

// ── テスト2: style未設定のchallengerでsimulateMatchがクラッシュしないか ──
console.log('【2】 style未設定challengerでsimulateMatchがクラッシュしないか（修正前の再現テスト）');

test('style=undefined の選手でsimulateMatchが動作する（selMoveフォールバック）', () => {
  const rng = Engine.rng.create(42);
  const G = Engine.createInitialState(42, true);
  const playerFighter = G.roster[0];

  // 修正前のB3データ（styleなし）を再現
  const challengerNoStyle = {
    id: 9999, name: 'テスト挑戦者',
    pw: 65, sp: 60, te: 55, st: 70, mn: 50,
    // style: undefined,  ← 意図的に未設定（修正前のバグ再現）
    // role: undefined,
    popularity: 30, traits: []
  };

  const result = Engine.battle.simulateMatch(playerFighter, challengerNoStyle, rng, 2);
  assert(result, 'result is falsy');
  assert(result.winner === 'left' || result.winner === 'right' || result.winner === 'draw',
    `unexpected winner: ${result.winner}`);
  assert(typeof result.mq === 'number' && !isNaN(result.mq), `mq is not a valid number: ${result.mq}`);
});

test('style="Allround" の選手でsimulateMatchが正常動作する', () => {
  const rng = Engine.rng.create(43);
  const G = Engine.createInitialState(43, true);
  const playerFighter = G.roster[0];

  const challengerWithStyle = {
    id: 9998, name: 'テスト挑戦者2',
    pw: 65, sp: 60, te: 55, st: 70, mn: 50,
    style: 'Allround', role: 'Neutral',
    popularity: 30, traits: []
  };

  const result = Engine.battle.simulateMatch(playerFighter, challengerWithStyle, rng, 2);
  assert(result, 'result is falsy');
  assert(typeof result.mq === 'number' && !isNaN(result.mq), `mq is not a valid number: ${result.mq}`);
});

// ── テスト3: 全6スタイルでsimulateMatchが動作するか ──
console.log('\n【3】 全スタイルでsimulateMatch動作確認');

const styles = ['Power', 'Speed', 'Technical', 'Submission', 'Brawler', 'Allround'];
for (const style of styles) {
  test(`style="${style}" で試合が完走する`, () => {
    const rng = Engine.rng.create(100 + styles.indexOf(style));
    const G = Engine.createInitialState(100, true);
    const f1 = G.roster[0];
    const f2 = {
      id: 8000 + styles.indexOf(style), name: `${style}テスター`,
      pw: 60, sp: 60, te: 60, st: 60, mn: 60,
      style, role: 'Babyface',
      popularity: 20, traits: []
    };
    const result = Engine.battle.simulateMatch(f1, f2, rng, 2);
    assert(result && typeof result.mq === 'number' && !isNaN(result.mq),
      `failed: winner=${result?.winner} mq=${result?.mq}`);
  });
}

// ── テスト4: B3イベントのフルフロー（生成→試合→結果処理）──
console.log('\n【4】 B3フルフロー: 生成→試合シミュレーション→結果適用');

let b3Tested = 0;
for (let seed = 1; seed <= 500 && b3Tested < 10; seed++) {
  let G = createStateWithAIOrgs(seed);
  if (!G.roster || G.roster.length === 0) continue;

  for (let attempt = 0; attempt < 200; attempt++) {
    const evtRng = Engine.rng.create(Engine.rng.derive(seed, attempt, 0xB3FF));
    const event = Engine.eventSystem.generateLargeEvent(evtRng, G, G.roster);
    if (event && event.type === 'B3') {
      test(`Seed ${seed}: B3フルフロー完走 (challenger: ${event.challenger.name}, style=${event.challenger.style})`, () => {
        // 代表選手を選択（ロスター最強）
        const playerFighter = G.roster
          .filter(c => !c.injury)
          .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
        assert(playerFighter, 'no player fighter available');

        // 試合実行（これが修正前はクラッシュしていた箇所）
        const matchRng = Engine.rng.create(Engine.rng.derive(seed, 0xB1B4));
        const result = Engine.battle.simulateMatch(playerFighter, event.challenger, matchRng, 2);
        assert(result, 'simulateMatch returned null');
        assert(!isNaN(result.mq), `MQ is NaN`);
        assert(result.turns > 0, `turns is ${result.turns}`);
        assert(['left', 'right', 'draw'].includes(result.winner), `bad winner: ${result.winner}`);

        // applyLargeEventEffect Step2（結果処理）
        const enrichedEvent = { ...event, matchResult: result, selectedFighterId: playerFighter.id };
        const rng3 = Engine.rng.create(Engine.rng.derive(seed, 0xB1B6));
        const result3 = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, G, rng3);
        assert(result3, 'applyLargeEventEffect returned null');
      });
      b3Tested++;
      break;
    }
  }
}

console.log(`\n  → B3フルフロー: ${b3Tested}件テスト済み`);

// ── テスト5: 大量シード安定性テスト ──
console.log('\n【5】 大量simulateMatch安定性（style=undefinedで100回）');

test('style=undefined × 100回: 全試合完走＋NaN無し', () => {
  const G = Engine.createInitialState(999, true);
  let nanCount = 0;
  let crashCount = 0;
  for (let i = 0; i < 100; i++) {
    const rng = Engine.rng.create(i * 31337);
    const f1 = G.roster[i % G.roster.length];
    const f2 = {
      id: 7000 + i, name: `NoStyle_${i}`,
      pw: 50 + (i % 30), sp: 50 + ((i * 3) % 25), te: 50 + ((i * 7) % 20),
      st: 50 + ((i * 11) % 30), mn: 50 + ((i * 13) % 20),
      // style intentionally omitted
      popularity: 10 + (i % 40), traits: []
    };
    try {
      const result = Engine.battle.simulateMatch(f1, f2, rng, i % 2 === 0 ? 1 : 2);
      if (!result || isNaN(result.mq)) nanCount++;
    } catch (e) {
      crashCount++;
    }
  }
  assert(crashCount === 0, `${crashCount} crashes`);
  assert(nanCount === 0, `${nanCount} NaN results`);
});

// ── 結果サマリー ──
console.log('\n==============================');
console.log(`Result: ${pass} passed, ${fail} failed`);
console.log('==============================');
process.exit(fail > 0 ? 1 : 0);
