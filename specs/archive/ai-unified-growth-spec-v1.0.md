# AI統一成長モデル設計書 v1.0

> **ステータス**: 🟡 設計確定・実装待ち
> **作成日**: 2026-03-06
> **依存**: growth-rebalance-design-v1.0.md / rival-org-spec-v1.0.md / weekly-gameloop-spec-v1.0.md
> **🔧マーク = 調整可能パラメータ**（実装後のバランスチューニング対象）

---

## 背景と目的

growth-rebalance-design-v1.0 の実装後、Monte Carlo検証（N=2000）で以下が判明:

- プレイヤーの年間成長（~42pt）がAI S級（~13-17pt）の約3倍
- 試合成長（23pt/年）だけでAI S級のseasonBudget全体を超過
- 標準プレイヤーがS5-6でS級に追いつき、S10以降は一方的に突き抜け

**本設計書の目的**: `aiSeasonGrowth` の一括計算を廃止し、AI選手もプレイヤーと完全同一の `calcGrowth` + `simulateMatch` を通すことで、公平かつティア差のある成長環境を実現する。

---

## 実装フェーズ一覧

| Phase | 内容 | 変更規模 |
|-------|------|---------|
| 1 | `MATCH_GROWTH_BASE` 定数化 + 引き下げ | 定数1箇所追加、参照3ファイル4箇所 |
| 2 | `makeAIFighter` フィールド補完 | makeAIFighter 1箇所 |
| 3 | `processAIWeek` 新設 + `aiSeasonGrowth` 廃止 | engine.js 大規模追加 |
| 4 | `AI_COACH_CONFIG` 導入 | data.js 定数追加、engine.js 参照 |
| 5 | `convergenceMul` 比率ベース化 | calcGrowth 1箇所 |

---

## Phase 1: MATCH_GROWTH_BASE 定数化

### §1.1 変更内容

`data.js` に定数を追加し、`engine.js` のハードコード `0.7` を置き換える。

```js
// data.js — GROWTH_CONFIG に追加
const GROWTH_CONFIG = {
  // ... 既存フィールド ...
  matchGrowthBase: 0.35,  // 🔧 試合1回あたりの基本成長（旧: 0.7）
};
```

### §1.2 変更箇所（engine.js）

現在 `matchGrowthBase = 0.7` がハードコードされている箇所:

| 行（目安） | コンテキスト | 変更 |
|-----------|------------|------|
| L3402 | 興行後の試合成長計算（プレイヤー団体） | `const matchGrowthBase = GROWTH_CONFIG.matchGrowthBase;` |
| L4824 | PPV試合成長計算 | 同上 |

※ Phase 3 で `processAIWeek` から参照する際も同じ定数を使用。

### §1.3 期待効果

- 試合成長: 24試合/年 × ~0.62pt/試合（期待値）= ~14.9pt/年（旧: ~23.2pt）
- プレイヤー年間合計: 練習~19pt + 試合~14.9pt = ~34pt（旧: ~42pt）
- OVR換算: +6.8/年（旧: +8.4/年）、ageMul=1.0時

---

## Phase 2: makeAIFighter フィールド補完

### §2.1 追加フィールド

`makeChar` との差分を埋める。AI選手が `processAIWeek` の週次処理を通るために必要。

```js
makeAIFighter(template, rng, orgId, age) {
  // ... 既存の計算 ...
  return {
    // --- 既存フィールド（変更なし） ---
    id, name, h, pw, sp, te, st, mn,
    style, role, pot, traits, personality, archetype,
    notionValue, trainCap, popularity, orgId, age,
    careerSeasons, condition, losingStreak, preInjuryPop,
    assessedValue, assessedTier, assessedVariance, assessedSeason,

    // --- 追加フィールド ---
    schedule: 'balance',          // Phase 4 の processAIWeek で上書きされる
    wins: 0, losses: 0, draws: 0,
    injury: null,
    seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
    intensive: false,
    intensiveWeeks: 0,
    lastMatchResult: null,
    careerRecord: Engine.career.createRecord(),
    durability: Engine.career.generateDurability(rng),
    wear: 0,
    seasonInjuries: 0,
    careerHistory: [],
    growthPenalty: null,
    trust: 50,
  };
}
```

### §2.2 注意

- 既存のAI選手データ（セーブデータ）にはこれらのフィールドがない。`processAIWeek` 内で `fighter.seasonGrowth || { pw:0, ... }` のようにフォールバックすること。
- あるいはシーズン開始時のマイグレーション処理で一括追加する方が安全。

---

## Phase 3: processAIWeek 新設

### §3.1 概要

`Engine.rival.processAIWeek(rng, state, org)` を新設。tickWeek パイプラインから毎週呼び出す。

### §3.2 週次処理フロー

```
processAIWeek(rng, state, org):
  roster = org.roster（この団体のAI選手リスト）
  coachConfig = AI_COACH_CONFIG[org.tier]

  for each fighter in roster:
    if fighter.injury:
      → 療養処理（condition回復、injury.weeksLeft--, 治癒判定）
      continue

    if isShowWeek(state.week):
      → 興行処理（§3.3）
    else:
      → 練習処理（§3.4）

  return updated roster
```

### §3.3 興行週の処理

```
興行処理:
  1. 出場可能選手をOVRでソート
  2. 上から順にペアリング（#1 vs #2, #3 vs #4, ...）
     - 奇数人の場合、最下位が欠場
  3. 各カードに simulateMatch を適用
     - MQ, winner, 試合成長を計算
     - matchGrowthBase = GROWTH_CONFIG.matchGrowthBase（プレイヤーと同値）
  4. 試合後の処理:
     - 怪我判定（既存ロジック流用）
     - condition減少
     - lastMatchResult 更新
     - wins/losses/draws 更新
```

**対戦カード生成の簡易ロジック:**

```js
function generateAIMatchCard(roster) {
  const available = roster
    .filter(f => !f.injury && f.condition > 20)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const matches = [];
  for (let i = 0; i + 1 < available.length; i += 2) {
    matches.push({ left: available[i], right: available[i + 1] });
  }
  return matches;
}
```

OVR近接ペアリングにより、S級同士の試合はMQが高くなりやすい → `closeMatchBonus` が発生しやすい → S級の試合成長がB級より自然に高くなる。

### §3.4 練習週の処理

```
練習処理:
  aceConfig = getAceConfig(coachConfig, fighter, org)

  1. スケジュール判定:
     - roll = rng.float()
     - roll < aceConfig.practiceRate → practice
     - else → rest

  2. practice の場合:
     - 強化練習判定: rng.float() < aceConfig.intensiveRate → intensive=true
     - growStat = pickGrowthStat(rng, state, fighter.id)
     - growth = calcGrowth(rng, state, fighter, growStat, aceConfig.coachMul)
     - intensive なら growth *= GROWTH_CONFIG.intensiveMult (1.5)
     - 強化練習時: 怪我判定 (5%)
     - condition 減少

  3. rest の場合:
     - condition 回復 (+8〜+14)
```

### §3.5 calcGrowth の overrideCoachMul 引数追加

AI団体はプレイヤーのコーチ雇用システムを持たないため、`calcGrowth` にオプション引数を追加する。

```js
// 変更前
calcGrowth(rng, G, char, stat) {
  // ...
  const coachMul = Engine.coach.getCharGrowthMult(G, char.id, stat);
  // ...
}

// 変更後
calcGrowth(rng, G, char, stat, overrideCoachMul = null) {
  // ...
  const coachMul = overrideCoachMul ?? Engine.coach.getCharGrowthMult(G, char.id, stat);
  // ...
}
```

### §3.6 aiSeasonGrowth の廃止

`Engine.growth.aiSeasonGrowth` を削除（またはno-op化）。現在の呼び出し元:

- シーズン末の `processAISeason` 内 → `processAIWeek` に置き換わるため不要

### §3.7 aiSeasonPopularity は維持

知名度は従来通り `aiSeasonPopularity` でシーズン一括計算。AI選手のスケジュールに promo は含めない（「やっているふり」のみ）。

### §3.8 tickWeek パイプラインへの組み込み

```js
// tickWeek 内、プレイヤー団体の処理後に追加
if (!Engine.util.isShowWeek(s.week) || /* 興行週 */) {
  (s.aiOrgs || []).forEach(org => {
    const aiRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, org.id));
    org.roster = Engine.rival.processAIWeek(aiRng, s, org);
  });
}
```

**パフォーマンス注意**: AI 3団体 × 15-18名 × 48週/シーズン。1週あたり最大54名の練習or試合計算が追加される。現行のバッチ処理（シーズン末1回）と比較して約48倍の呼び出し回数になるが、各計算は軽量なので問題なし。

---

## Phase 4: AI_COACH_CONFIG

### §4.1 定数定義（data.js）

```js
const AI_COACH_CONFIG = {
  S: {
    ace: {
      count: 3,                    // OVR上位3名がエース
      top1: {
        coachMul: 1.25,            // 🔧 Aランク相当
        intensiveRate: 0.30,       // 🔧 強化練習確率 30%
        practiceRate: 0.85,        // 🔧 練習週になる確率 85%（残りはrest）
      },
      top2_3: {
        coachMul: 1.18,            // 🔧 Bランク相当
        intensiveRate: 0.20,       // 🔧 20%
        practiceRate: 0.85,        // 🔧 85%
      },
    },
    general: {
      coachMul: 1.12,              // 🔧 Cランク相当
      intensiveRate: 0.05,         // 🔧 5%
      practiceRate: 0.75,          // 🔧 75%
    },
  },
  A: {
    ace: {
      count: 1,                    // OVR上位1名がエース
      top1: {
        coachMul: 1.18,            // 🔧 Bランク相当
        intensiveRate: 0.20,       // 🔧 20%
        practiceRate: 0.75,        // 🔧 75%
      },
    },
    general: {
      coachMul: 1.12,              // 🔧 Cランク相当
      intensiveRate: 0.0,          // 強化練習なし
      practiceRate: 0.60,          // 🔧 60%
    },
  },
  B: {
    ace: {
      count: 1,                    // OVR上位1名がエース
      top1: {
        coachMul: 1.12,            // 🔧 Cランク相当
        intensiveRate: 0.0,        // 強化練習なし
        practiceRate: 0.55,        // 🔧 55%
      },
    },
    general: {
      coachMul: 1.08,              // 🔧 Dランク相当
      intensiveRate: 0.0,          // 強化練習なし
      practiceRate: 0.45,          // 🔧 45%
    },
  },
};
```

### §4.2 エース選定ロジック

```js
function getAceConfig(org, fighter) {
  const config = AI_COACH_CONFIG[org.tier];
  const roster = org.roster
    .filter(f => !f.injury)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const rank = roster.findIndex(f => f.id === fighter.id);

  if (rank === 0 && config.ace.top1) {
    return config.ace.top1;
  }
  if (rank < config.ace.count && config.ace.top2_3) {
    return config.ace.top2_3;
  }
  if (rank < config.ace.count) {
    return config.ace.top1; // A級・B級はtop1設定をエース全員に適用
  }
  return config.general;
}
```

**エース選定タイミング**: 毎週、怪我を除いたOVR上位で判定。怪我選手はエース枠から外れ、復帰後にOVRが上位ならエースに戻る。

### §4.3 テンプレート保証

`initRandomRoster` のロスター配分時に以下を保証する:

| ティア | 保証内容 | 実装方法 |
|--------|---------|---------|
| S級 | 超逸材（superElite）1名以上 | 既存の `superElite → S級確定` ロジックで達成済み |
| A級 | 逸材（elite）以上1名以上 | eliteプールからA級に最低1名を確保する処理を追加 |
| B級 | 保証なし | 現行通り |

A級の保証は `weightedPick` 実行前に eliteプールから1名をA級に確定配置する。確率的に superElite がA級に来ることもある（S級確定枠に余りがあった場合）。

---

## Phase 5: convergenceMul 比率ベース化

### §5.1 変更内容

`calcGrowth` 内の convergenceMul 計算を比率ベースに変更。

```js
// 変更前
const convergenceMul = remaining < 10 ? Math.sqrt(remaining / 10) : 1.0;

// 変更後
const convergenceThreshold = trainCap * GROWTH_CONFIG.convergenceRatio;
const convergenceMul = remaining < convergenceThreshold
  ? Math.sqrt(remaining / convergenceThreshold)
  : 1.0;
```

### §5.2 定数（data.js）

```js
const GROWTH_CONFIG = {
  // ... 既存フィールド ...
  convergenceRatio: 0.15,  // 🔧 trainCapの上位15%で減速開始
};
```

### §5.3 効果一覧

| trainCap | 減速開始OVR | 減速ゾーン幅 |
|----------|-----------|------------|
| 95（超逸材） | 80.8 | 14.3pt |
| 80（逸材） | 68.0 | 12.0pt |
| 65（普通） | 55.3 | 9.8pt |
| 55（低tier） | 46.8 | 8.3pt |

### §5.4 体験イメージ（OVR 40スタート）

- **超逸材 (trainCap 95)**: OVR 81まで全力 → S8-9で鈍化開始 → OVR 90付近が実質天井
- **逸材 (trainCap 80)**: OVR 68まで全力 → S5-6で頭打ち感 → OVR 76付近
- **普通 (trainCap 65)**: OVR 55まで全力 → S3で「ここまでか」 → OVR 62付近
- **低tier (trainCap 55)**: OVR 47まで全力 → S1.5で伸び悩み → OVR 52付近

trainCap間の格差が早期に顕在化し、「逸材を見つけないと上に行けない」体験が強まる。

---

## 期待バランス（全Phase適用後）

### 成長速度比較（21歳、ageMul=1.3、convergenceMul=1.0区間）

| ポジション | coachMul | 強化補正 | 練習週/年 | 練習pt | 試合pt | 合計pt | OVR/年 |
|-----------|---------|---------|----------|--------|--------|--------|--------|
| S級エース#1 | 1.25 | ×1.15 | ~41 | ~11.6 | ~16.2 | ~27.8 | **+5.6** |
| S級#2-3 | 1.18 | ×1.10 | ~41 | ~10.0 | ~15.5 | ~25.5 | **+5.1** |
| S級一般 | 1.12 | ×1.025 | ~36 | ~7.4 | ~15.5 | ~22.9 | **+4.6** |
| A級エース#1 | 1.18 | ×1.10 | ~36 | ~8.7 | ~14.5 | ~23.2 | **+4.6** |
| A級一般 | 1.12 | ×1.0 | ~29 | ~5.9 | ~14.0 | ~19.9 | **+4.0** |
| B級エース#1 | 1.12 | ×1.0 | ~26 | ~5.3 | ~13.0 | ~18.3 | **+3.7** |
| B級一般 | 1.08 | ×1.0 | ~22 | ~4.3 | ~12.5 | ~16.8 | **+3.4** |
| プレイヤー（標準） | 1.18 | ×1.0 | ~48 | ~10.3 | ~14.9 | ~25.2 | **+5.0** |

※ 試合ptの差はOVRペアリングによる `closeMatchBonus` 発生率の違いから自然発生。S級はMQ65超えの試合が多く、B級は少ない。

### 10シーズン経過OVRイメージ（初期OVR差+convergenceMul含む）

| ポジション | 初期OVR | 10S後OVR | 備考 |
|-----------|--------|---------|------|
| S級#1（超逸材） | ~55 | **85-90** | trainCap 95、減速なし区間が長い |
| S級#2-3（逸材） | ~50 | **80-85** | trainCap 80台 |
| A級#1（逸材以上） | ~45 | **75-80** | trainCap 80台、コーチB |
| B級#1 | ~35 | **65-70** | trainCap 65台、S6あたりで鈍化 |
| B級一般 | ~30 | **55-60** | trainCap 55-65、早期に実質停止 |
| プレイヤー初期メンバー | ~40 | **72-78** | trainCap依存でばらつき大 |

### 設計ターゲットとの対応

| ターゲット | 達成見込み |
|-----------|----------|
| S級#1が最強（超逸材+最高環境） | ✅ OVR/年+5.6、trainCap 95で減速なし |
| プレイヤーの後発逸材がS12-13でS級#1にギリギリ | ✅ プレイヤーOVR+5.0/年 vs S級#1+5.6/年。初期差を含めS12-13で追いつく |
| A級#1がS級#2-3と渡り合える | ✅ コーチB+強化20%は同条件。差はテンプレート質と試合環境 |
| B級は早い段階で追い抜ける | ✅ B級一般のOVR/年+3.4。プレイヤー知名度40-50の頃に並ぶ |
| 同trainCapでもばらつきが出る | ✅ ブレイクスルー/スランプ/怪我/hotStreakが自然にばらす |

---

## 既存コードへの影響チェックリスト

| 箇所 | 影響 | 対応 |
|------|------|------|
| `aiSeasonGrowth` | 廃止 | Phase 3 で削除 or no-op化 |
| `aiSeasonPopularity` | 維持 | 変更なし |
| `processAISeason` | 成長処理を削除 | aiSeasonGrowth 呼び出しを除去 |
| `tickWeek` | AI週次処理を追加 | processAIWeek 呼び出しを挿入 |
| `calcGrowth` | 引数追加 | overrideCoachMul オプション引数 |
| `makeAIFighter` | フィールド追加 | Phase 2 |
| `simulateMatch` | 変更なし | AI興行からもそのまま呼び出し |
| `AI_TIER_LIMITS.growthBonus` | 不要になる | Phase 3 完了後に削除可 |
| `AI_TIER_LIMITS.coachMul` | 不要になる | AI_COACH_CONFIG に置き換わる |
| セーブデータ互換 | AI選手に新フィールドがない | マイグレーションまたはフォールバック |

---

## 実装順序の推奨

1. **Phase 5**（convergenceMul）— 独立した変更。先に入れても安全
2. **Phase 1**（MATCH_GROWTH_BASE）— 定数化のみ。Phase 3 の前提
3. **Phase 2**（makeAIFighter補完）— Phase 3 の前提
4. **Phase 4**（AI_COACH_CONFIG定数）— Phase 3 の前提
5. **Phase 3**（processAIWeek + aiSeasonGrowth廃止）— 最大の変更。1-4が揃ってから

Phase 5 → 1 → 2 → 4 → 3 の順が安全。各Phaseで個別にテスト可能。
