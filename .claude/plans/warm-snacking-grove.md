# 成長リバランス v3 + AI週次シミュレーション統一

## Context

プレイヤーから「緩すぎる」「全キャラ突き抜け」という声。Monte Carlo 2,000回検証で原因特定:
- 試合成長(matchGrowthBase=0.7, 24試合/年)が年~23ptで、AI S級のseasonBudget全体(~17pt)を超過
- AIはシーズン末バッチ一括計算(aiSeasonGrowth)で、プレイヤーとは完全に別の成長式
- 結果: プレイヤーがS級AIの3倍速で成長、S5-6で追い越し

**方針**:
1. matchGrowthBase を 0.7 → 0.35 に引き下げ
2. AI団体も毎週プレイヤーと同じレベルの週次シミュレーションを実行する統一モデルに移行
3. ティア差はコーチの質・主力優遇・スケジュール方針・対戦環境の総合的な環境差で表現

---

## Phase 1: matchGrowthBase 引き下げ

### 変更箇所

**data.js** line 1159付近（GROWTH_SEASON_BASE直後に追加）:
```javascript
const MATCH_GROWTH_BASE = 0.35; // growth-rebalance v3: 0.7→0.35
```
- EOFのmodule.exportsブロック（line ~4978）に `MATCH_GROWTH_BASE` 追加

**engine.js** 2箇所:
- line 3401: `const matchGrowthBase = 0.7` → `const matchGrowthBase = MATCH_GROWTH_BASE`
- line 4823: 同上

**app.js** 1箇所:
- line 3030: `const matchGrowthBase = 0.7` → `const matchGrowthBase = MATCH_GROWTH_BASE`

### 検証
auto-simフック自動実行（engine.js/data.js変更検知）。追加で `node test/auto-sim.js 500 42`。

---

## Phase 2: makeAIFighter フィールド完全統一

### 目的
AI選手を `makeChar` と同じフィールドセットに拡張し、週次シミュレーションの土台を作る。

### engine.js `makeAIFighter` (line 1970-1998) に追加するフィールド

`makeChar` (line 5517-5556) との差分として不足しているフィールド:
```javascript
schedule: 'balance',
wins: 0, losses: 0, draws: 0,
injury: null,
seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
intensive: false,
intensiveWeeks: 0,
trust: 50,
lastMatchResult: null,
careerRecord: Engine.career.createRecord(),   // makeCharと同じヘルパー使用
durability: Math.max(0, Math.min(4, Math.round(2 + normalRandom(rng) * 1))),  // makeCharと同じ
wear: 0,
seasonInjuries: 0,
careerHistory: [],
growthPenalty: null,
salaryBonus: 0,
_careWeekUsed: {}
```

### 既存セーブデータのマイグレーション
`advanceWeek` 内で `_migrated_ai_unified_v1` チェック:
- 全AI団体の全選手に不足フィールドをデフォルト値で補完
- `durability` は既存AIにない → 各選手にrng(0,4)で付与
- `wear` は年齢ベースで推定: `Math.max(0, (age - 28) * 8)` 程度

---

## Phase 3: AI週次シミュレーション

### 概要
`tickWeek` 内でプレイヤー処理の後、全AI団体に同等の週次処理を実行。
`aiSeasonGrowth` バッチ計算は廃止し、毎週の練習成長+試合成長に置換。

### 新関数: `Engine.rival.processAIWeek(rng, state)`

**tickWeekへの組み込み** (line 2978 processSettlement の後、line 3119 validateGameState の前):
```javascript
// AI団体週次処理（専用RNGでプレイヤーRNG列を汚さない）
const aiWeekRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xA100));
const aiWeekResult = Engine.rival.processAIWeek(aiWeekRng, s);
s = { ...s, aiOrgs: aiWeekResult.aiOrgs };
```

### 練習週（奇数週 = !isShowWeek）の処理

各AI団体の各選手に対して:

```
1. 怪我中 → condition回復（+5~+9, 不屈+3）、スキップ
2. condition <= 30 → 強制rest
3. ティアポリシーに従いスケジュール決定（後述 Phase 4）
4. practice:
   - pickGrowthStat(rng, aiState, fighter.id)
   - calcGrowth(rng, aiState, fighter, stat)
     ※ coachMul は AI_COACH_CONFIG から算出（後述 Phase 4）
   - condition消費: -3~-6 + コーチボーナス
5. rest: condition回復 +8~+15
6. promo: popularity微増, condition -1~-2
7. intensive（エースのみ、Phase 4で制御）:
   - calcGrowth × intensiveMult(1.5)
   - condition消費: -6~-13
   - 怪我リスク 5%
```

**重要**: `calcGrowth` はそのまま再利用可能。`Engine.coach.getCharGrowthMult` は現在プレイヤー専用（G.rosterからコーチを探す）なので、AI用には直接coachMulを渡す別パスを作るか、calcGrowthにcoachMul引数を追加する。

**推奨**: `calcGrowth` にオプショナル引数 `overrideCoachMul` を追加:
```javascript
calcGrowth(rng, G, char, stat, overrideCoachMul) {
  const coachMul = overrideCoachMul != null ? overrideCoachMul : Engine.coach.getCharGrowthMult(G, char.id, stat);
  // ... 以降同じ
}
```

### 興行週（偶数週 = isShowWeek）の処理

各AI団体に対して:

```
1. 対戦カード生成 (generateAIMatchCard)
   - 出場可能: !injury && condition >= 30
   - OVR降順ソート → 隣接ペアリング（1vs2, 3vs4, ...）
   - 奇数人は末尾1名が休み（condition回復）
   - 出場不可の選手はcondition回復のみ

2. 各試合を Engine.battle.simulateMatch(charL, charR, rng) で実行
   - 戻り値: { winner, mq, turns, hpLeft, hpRight, finType, ... }

3. 試合成長適用（プレイヤーと完全同一式）
   - matchGrowthBase = MATCH_GROWTH_BASE
   - opponentBonus = clamp((oppOvr - selfOvr) / 15, -0.2, 0.5)
   - closeMatchBonus = mq >= 65 ? 0.3 : 0.0
   - resultBonus = won ? 0.0 : 0.2
   - coachMatchBonus = 0（AIコーチには実戦主義トレイトなし、Phase 4で検討）
   - growthPenalty適用（適応力軽減含む）
   - 1~2ステに分配 → Math.round → 適用

4. 怪我判定: Engine.injury.check() を各参加選手に実行
   - 同じinjuryChance式（condition/HP/turns依存）
   - 重傷→引退もあり得る

5. 試合後condition消費: 出場者 -8~-15, 全員 +3 ベース回復

6. 記録更新:
   - wins/losses/draws 更新
   - careerRecord.totalMatches++, bestMQ更新
   - lastMatchResult = 'win'/'loss'
   - seasonGrowth に成長分を加算
```

### processSeasonEnd の変更 (engine.js line 2190-2267)

**残す処理**:
1. aging (age++, careerSeasons++) — そのまま
2. wear蓄積（AI選手にもwearフィールド追加済み）— そのまま
3. applyDecay — そのまま
4. aiSeasonGrowthEvents → **slump/motivationLoss/breakthroughをプレイヤーと同じフラグ形式に変更**
   - `_aiGrowthBlock` → `slump` or `motivationLoss` フィールド使用
   - `_aiGrowthHalf` → 廃止（週次処理でinjuryフラグが同等の効果）
5. seasonGrowthリセット: `seasonGrowth: {pw:0,sp:0,te:0,st:0,mn:0}`
6. retirement check — そのまま

**削除する処理**:
- line 2237: `aiSeasonGrowth` 呼び出し → **削除**（週次成長に置換済み）
- lines 2228-2234: 確率的怪我シミュレーション → **削除**（週次の実試合で怪我が発生）

**保持する処理（暫定）**:
- line 2240: `aiSeasonPopularity` → **Phase 5以降で試合ベースに置換予定だが、今回は保持**

### aiSeasonGrowth 関数本体 (line 2270-2307)
- 関数自体は残すが、`processSeasonEnd` からの呼び出しを削除
- 安全のため関数冒頭にコメント: `// DEPRECATED v3: weekly simulation に移行。processSeasonEndからの呼び出しは削除済み`
- 後日クリーンアップで完全削除

---

## Phase 4: ティア別環境差

### 4.1 AI_COACH_CONFIG 定数 (data.js に追加)

```javascript
const AI_COACH_CONFIG = {
  S: {
    aceCoachMul: 1.30,    // A-rankコーチ(1.25) + style match(+0.05)
    mainCoachMul: 1.23,   // B-rankコーチ(1.18) + style match(+0.05)
    subCoachMul: 1.12,    // C-rankコーチ
    aceCount: 3,          // OVR上位3名がエース扱い
    intensiveRate: 0.30,  // エースの30%の練習週で強化練習
    practiceRate: 0.60,   // 非エースの練習週配分（残りはrest/promo）
    restRate: 0.20,
    promoRate: 0.20
  },
  A: {
    aceCoachMul: 1.23,
    mainCoachMul: 1.12,
    subCoachMul: 1.05,
    aceCount: 2,
    intensiveRate: 0.15,
    practiceRate: 0.50,
    restRate: 0.25,
    promoRate: 0.25
  },
  B: {
    aceCoachMul: 1.12,
    mainCoachMul: 1.08,
    subCoachMul: 1.00,
    aceCount: 1,
    intensiveRate: 0.00,   // 強化練習なし
    practiceRate: 0.40,
    restRate: 0.35,
    promoRate: 0.25
  }
};
```

### 4.2 コーチmul割り当てロジック

```
getAICoachMul(org, fighter, roster):
  OVR順ソート
  rank = fighter's OVR rank in roster
  if rank <= config.aceCount → aceCoachMul
  if rank <= config.aceCount + 5 → mainCoachMul  (主力6名程度)
  else → subCoachMul
```

### 4.3 スケジュール自動決定

```
determineAISchedule(fighter, tierConfig, rng):
  if injury → 'rest'
  if condition <= 30 → 'rest' (強制)
  if condition <= 50 → 70% rest, 30% practice
  if isAce && rng < tierConfig.intensiveRate → 'intensive'
  else → rng < practiceRate ? 'practice' : rng < practiceRate+restRate ? 'rest' : 'promo'
```

### 4.4 対戦環境（自然発生）
- S級: ロスター全体のOVRが高い → `opponentBonus = clamp((oppOvr - selfOvr)/15, ...)` が均等に分布
- B級: OVR低い → 弱い者同士の試合で成長ボーナスが少ない
- **明示的パラメータ不要** — 同一式から自然に差が生まれる

---

## Phase 5: 既存コードの廃止・変更まとめ

| 対象 | 変更 |
|------|------|
| `aiSeasonGrowth` (engine.js:2270) | processSeasonEndからの呼び出し削除。関数はDEPRECATED |
| `AI_TIER_LIMITS.growthBonus` (data.js:1319) | 未使用化。コメントでDEPRECATED |
| `aiMatchEquivalent` (engine.js:2285) | 削除済み（aiSeasonGrowth内のローカル変数） |
| `RIVAL_ORGS.coachMul` (data.js:1172) | AI_COACH_CONFIGに移行後も残す（他で参照あれば互換用） |
| processSeasonEnd 怪我シミュレーション | 削除（実試合シミュレーションに置換） |
| `_aiGrowthBlock` / `_aiGrowthHalf` | slump/motivationLoss/injury フラグに統一 |

---

## RNG設計

プレイヤーのRNG列を汚さないため、AI処理は専用のderiveを使用:
```
AI週次全体: derive(seed, season, week, 0xA100)
  org_s用: derive(aiSeed, 0xA1S0)
  org_a用: derive(aiSeed, 0xA1A0)
  org_b用: derive(aiSeed, 0xA1B0)
    試合RNG: derive(orgSeed, matchIndex)
    成長RNG: derive(orgSeed, fighterId)
```

---

## validateGameState 拡張

AI団体のチェック（engine.js:8026付近の既存AIチェックを拡張）:
```
- AI選手の全数値フィールドがNaN/Infinityでないこと
- condition: 0-100
- trust: 0-100
- seasonGrowth: 各値が数値であること
- wear: 0以上
- roster内に重複IDがないこと
```

---

## 実装順序

1. **Phase 1** — MATCH_GROWTH_BASE定数化（data.js + engine.js×2 + app.js×1）→ auto-sim検証
2. **Phase 2** — makeAIFighter拡張 + マイグレーション → auto-sim検証
3. **Phase 3** — processAIWeek実装 + tickWeek組込 + processSeasonEnd変更 → auto-sim検証
4. **Phase 4** — AI_COACH_CONFIG + スケジュール自動決定 + コーチmul割り当て → auto-sim検証
5. **完了** — docs/game-system-roadmap.md 更新

Phase 3と4は密結合（processAIWeekがcoachMulを必要とする）ため、実質的には同時実装。
ただし段階的検証のため、Phase 3では暫定coachMul（RIVAL_ORGS.coachMul流用）で動かし、Phase 4でAI_COACH_CONFIGに切り替える。

## 検証方法

```bash
# 各Phase後
node test/auto-sim.js 500 42

# Phase 3完了後: 大規模テスト
for i in $(seq 1 100); do node test/auto-sim.js 100 $((i * 7919)); done | grep "Result:"
```

### 確認すべきポイント
- NaN/Infinity/負値のステータスが発生しないこと
- AI選手のOVRが合理的な範囲で推移すること
- プレイヤーがS級AIを超えるタイミングがS8-10程度になること
- AI選手のconditionが0に張り付かないこと（rest週で回復しているか）
- AI選手の怪我が適切な頻度で発生・回復すること
- ゲーム進行速度が体感で遅くなっていないこと

## 変更対象ファイル

- **`src/data.js`** — MATCH_GROWTH_BASE, AI_COACH_CONFIG追加。AI_TIER_LIMITS.growthBonus廃止マーク。exports更新
- **`src/engine.js`** — matchGrowthBase定数参照化(2箇所)。makeAIFighter拡張。processAIWeek新設。calcGrowthにoverrideCoachMul引数追加。processSeasonEnd変更（aiSeasonGrowth/怪我シミュ削除、slump統一）。tickWeek組込。validateGameState拡張
- **`src/app.js`** — matchGrowthBase定数参照化(1箇所)
- **`docs/game-system-roadmap.md`** — 変更記録追加
