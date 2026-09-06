'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  i18n Stage B P7-53(裁定C-6) — 観戦モード実況ログのテンプレ移設ガード
//
//  match-engine.js の pushLog が積む52本の文面は data.js の BATTLE_LOG_TEMPLATES へ
//  移設した。この「移設が1バイトも文面を変えていない」ことを、**移設前のJSテンプレート
//  リテラルの凍結コピー**と全数突合して証明する(§14-4 の作法①)。
//
//  実試合の before/after 突合(worklog P7-53 の18,615行)は自然に踏める分岐しか
//  カバーできない。ここは「HP0セーフティネットのTKO(tag.downTko)」のように
//  自然再生では到達しない枝も含めて**表の全キー**を必ず1回ずつ通す。
//
//  あわせて検査するもの:
//    - BATTLE_LOG_LINE_KINDS が BATTLE_LOG_TEMPLATES と同じキー集合を持つこと
//      (片方だけ足すと cls/spoiler が既定値へ黙って落ちる)
//    - cls が観戦側CSSの既知クラスのみであること
//    - spoiler が「旧 _SPOILER_LINE_RE と同じ判定」になること(言語非依存化の等価性)
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const { loadAsGlobal } = require('./helpers/load-game.js');

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');

// ── 移設前(2026-09-06 P7-53着手時点)のテンプレートリテラルの凍結コピー ──
// 変数名は当時のローカル名をそのまま引数名にしてある。
const FROZEN_SINGLE = {
  openingExecMiss: (p) => `T${p.turn}: [開幕大技] ${p.name}の${p.move} → 透かされた！ ${p.name2}に反撃の好機！`,
  openingExecHit: (p) => `T${p.turn}: [開幕大技] ${p.name}の${p.move} → ${p.name2}に${p.dmg}の大ダメージ！ (HP:${p.hp}/${p.mhp})`,
  openingFinishFall: (p) => `★ [開幕決着] ${p.name}、${p.move}でフォール勝ち！`,
  openingFinishGu: (p) => `★ [開幕決着] ${p.name}、${p.move}でギブアップ勝ち！`,
  openingFinishTko: (p) => `★ [開幕決着] ${p.name}、${p.move}でTKO勝ち！`,
  miss: (p) => `T${p.turn}: ${p.name}の${p.move} → MISS`,
  counter: (p) => `T${p.turn}: ${p.name}の${p.move} → カウンター！ ${p.name2}の${p.move2}で${p.name}に${p.dmg}ダメージ`,
  hit: (p) => `T${p.turn}: ${p.name}の${p.move} → ${p.name2}に${p.dmg}ダメージ (HP:${p.hp}/${p.mhp})`,
  hitCrit: (p) => `T${p.turn}: ${p.name}の${p.move} → ${p.name2}に${p.dmg}の大ダメージ！ (HP:${p.hp}/${p.mhp})`,
  hitBoost: (p) => `T${p.turn}: ${p.name}の${p.move}（透かし後の反撃） → ${p.name2}に${p.dmg}ダメージ (HP:${p.hp}/${p.mhp})`,
  hitBoostCrit: (p) => `T${p.turn}: ${p.name}の${p.move}（透かし後の反撃） → ${p.name2}に${p.dmg}の大ダメージ！ (HP:${p.hp}/${p.mhp})`,
  kickoutGrit: (p) => `  → ${p.name}がキックアウト！ Grit発動！`,
  hpNote: (p) => `  → ${p.name} HP:${p.hp}/${p.mhp}`,
  ropeEscapeGrit: (p) => `  → ${p.name}がロープエスケープ！ Grit発動！`,
  finishFall: (p) => `★ ${p.name}、${p.move}でフォール勝ち！`,
  finishGu: (p) => `★ ${p.name}、${p.move}でギブアップ勝ち！`,
  finishTko: (p) => `★ ${p.name}、${p.move}でTKO勝ち！`,
  pinSubmission: (p) => `★ ${p.name}、${p.move}でギブアップ！`,
  pinFall: (p) => `★ ${p.name}、${p.move}からのフォールで3カウント！`,
  pinFailSub: (p) => `  → 締めに入った！ だが${p.name}が振りほどいた！`,
  pinFailFall: (p) => `  → フォール！ だが${p.name}がカウント2で返した！`,
  rollup: (p) => `★ ${p.name}、まさかの${p.move}で3カウント！ 大金星！`,
  refStop: (p) => `★ レフェリーストップ！ ${p.name}のTKO勝利！`,
  timeout: (p) => `⏰ 時間切れ判定により、${p.name}の勝利！`,
};

const FROZEN_TAG = {
  downTko: (p) => `  ★ 決着！ ${p.name}は立ち上がれない。TKO！（${p.phase}）`,
  miss: (p) => `T${p.turn} [${p.phase}] ${p.name}の${p.move}→MISS`,
  counter: (p) => `T${p.turn} [${p.phase}] ${p.name}がカウンター！ ${p.move} → ${p.name2}に${p.dmg}ダメージ`,
  hit: (p) => `T${p.turn} [${p.phase}] ${p.name}の${p.move} → ${p.name2}に${p.dmg}ダメージ (HP:${p.hp}/${p.mhp})`,
  kickout: (p) => `  → ${p.name}がキックアウト！ (${p.n}回目)`,
  betrayal: (p) => `  → ${p.name}が助けに行かない！ 見殺し！`,
  cutinSave: (p) => `  → ${p.name}がカットイン！ ${p.name2}を救出！`,
  ropeEscape: (p) => `  → ${p.name}がロープエスケープ！`,
  counterFinishFall: (p) => `  ★ 決着！ ${p.name}のカウンター（${p.move}）でフォール勝ち！ (${p.phase})`,
  counterFinishGu: (p) => `  ★ 決着！ ${p.name}のカウンター（${p.move}）でギブアップ勝ち！ (${p.phase})`,
  counterFinishTko: (p) => `  ★ 決着！ ${p.name}のカウンター（${p.move}）でTKO勝ち！ (${p.phase})`,
  finishFall: (p) => `  ★ 決着！ ${p.name}の${p.move}でフォール勝ち！ (${p.phase})`,
  finishGu: (p) => `  ★ 決着！ ${p.name}の${p.move}でギブアップ勝ち！ (${p.phase})`,
  finishTko: (p) => `  ★ 決着！ ${p.name}の${p.move}でTKO勝ち！ (${p.phase})`,
  rollupCutin: (p) => `  → ${p.name}の${p.move}！ しかし${p.name2}がカットイン！`,
  rollupWin: (p) => `  ★ ${p.name}が${p.move}で3カウント！ (${p.phase})`,
  refStop: (p) => `  ★ レフェリーストップ！ ${p.name}のTKO勝利！ (${p.phase})`,
  pinBetrayalWin: (p) => `  → ピン成功！ ${p.name}が見殺し！ ${p.name2}の勝利！`,
  pinCutin: (p) => `  → ピン！ だが${p.name}がカットイン！`,
  pinWin: (p) => `  ★ ピン成功！ ${p.name}の勝利！ (${p.phase})`,
  pinKickout: (p) => `  → ピン！ だが${p.name}が返した！`,
  doubleTeam: (p) => `  ★ ダブルチーム！ ${p.name}&${p.name2}の${p.move}！ ${p.name3}に${p.dmg}ダメージ！`,
  doubleTeamCutin: (p) => `  → ${p.name}がカットイン！ なんとか阻止！`,
  tagMoveFinish: () => `  ★ タッグ技で決着！`,
  friendlyFire: (p) => `  ※ 連携にほころび！ ${p.name}の反撃が${p.name2}をかすめる！`,
  hotTag: (p) => `  ★ 反撃のタッチ！ ${p.name}から${p.name2}へ！ 会場が沸く！`,
  touchTactical: (p) => `  ↔ タッチ(戦術): ${p.name} → ${p.name2}`,
  touchWorn: (p) => `  ↔ タッチ(消耗): ${p.name} → ${p.name2}`,
};

// 代表値+境界値。名前・技名は実データから採る(全角/記号入りの技名で壊れないこと)。
const NAMES = ['神楽坂 澪', '阿武隈塔子', 'A'];
const MOVES = ['ブレーンバスター', 'ツームストン・パイルドライバー（喧）', '卍固め'];
const PHASES_N = ['Opening', 'Mid', 'End', 'Climax'];
const NUMS = [0, 1, 2, 9, 15, 128];

function paramGrid() {
  const out = [];
  for (let i = 0; i < NAMES.length; i++) {
    for (let j = 0; j < MOVES.length; j++) {
      for (let k = 0; k < NUMS.length; k++) {
        out.push({
          turn: NUMS[k],
          n: NUMS[k],
          dmg: NUMS[(k + 1) % NUMS.length],
          hp: NUMS[(k + 2) % NUMS.length],
          mhp: 100 + NUMS[k],
          name: NAMES[i],
          name2: NAMES[(i + 1) % NAMES.length],
          name3: NAMES[(i + 2) % NAMES.length],
          move: MOVES[j],
          move2: MOVES[(j + 1) % MOVES.length],
          phase: PHASES_N[k % PHASES_N.length],
        });
      }
    }
  }
  return out;
}

const GRID = paramGrid();
let compared = 0;

for (const [kind, frozen] of [['single', FROZEN_SINGLE], ['tag', FROZEN_TAG]]) {
  const table = BATTLE_LOG_TEMPLATES[kind];
  const kinds = BATTLE_LOG_LINE_KINDS[kind];
  assert.deepStrictEqual(Object.keys(table).sort(), Object.keys(frozen).sort(),
    `${kind}: テンプレ表と凍結コピーのキー集合が食い違っている`);
  assert.deepStrictEqual(Object.keys(table).sort(), Object.keys(kinds).sort(),
    `${kind}: BATTLE_LOG_LINE_KINDS のキー集合がテンプレ表と食い違っている`);

  for (const id of Object.keys(table)) {
    for (const p of GRID) {
      const expected = frozen[id](p);
      const actual = fillTemplateVars(table[id], p);
      assert.strictEqual(actual, expected,
        `${kind}.${id}: 移設で文面が変わった\n  凍結: ${JSON.stringify(expected)}\n  現在: ${JSON.stringify(actual)}`);
      compared++;
    }
  }
}

// ── 分類メタの妥当性 ──
// 観戦側CSS(.log-event.<cls>)が持つクラスだけを使う。
const KNOWN_CLS = [null, 'finish', 'betrayal', 'cutin', 'double', 'hottag', 'touch', 'friendly'];
// 移設前の「完成文の部分一致」判定(battle-engine-main.js / tag-battle-main.js の凍結コピー)。
const OLD_SPOILER = {
  single: /(★|カウント2で返した|振りほどいた|キックアウト|ロープエスケープ|カットイン|見殺し|丸め込み|タップ|レフェリーストップ|大金星)/,
  tag: /(★|カウント2で返した|振りほどいた|キックアウト|ロープエスケープ|カットイン|見殺し|丸め込み|タップ|なんとか阻止|返した)/,
};

for (const kind of ['single', 'tag']) {
  const table = BATTLE_LOG_TEMPLATES[kind];
  const kinds = BATTLE_LOG_LINE_KINDS[kind];
  for (const id of Object.keys(table)) {
    const meta = kinds[id];
    assert.ok(KNOWN_CLS.indexOf(meta.cls) >= 0, `${kind}.${id}: 未知のcls ${JSON.stringify(meta.cls)}`);
    assert.strictEqual(typeof meta.spoiler, 'boolean', `${kind}.${id}: spoilerがbooleanでない`);
    // 言語非依存化の等価性: JA完成文に旧正規表現を掛けた結果と一致すること。
    const ja = fillTemplateVars(table[id], GRID[0]).trim();
    assert.strictEqual(meta.spoiler, OLD_SPOILER[kind].test(ja),
      `${kind}.${id}: spoilerが旧判定と食い違う(${JSON.stringify(ja)})`);
  }
}

console.log(`battle-log-template-test: ok (${compared}通り突合 / single ${Object.keys(BATTLE_LOG_TEMPLATES.single).length}本 + tag ${Object.keys(BATTLE_LOG_TEMPLATES.tag).length}本)`);
