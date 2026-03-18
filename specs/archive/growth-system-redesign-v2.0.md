# 成長システムリデザイン設計書 v2.0

## 0. 設計理念

このゲームはシミュレーションである。選手の成長は「起きたこと（練習、試合、イベント）の結果」として発生するものであり、予算を先に決めて配給するものではない。

trainCapは成長の天井として機能し、選手は練習・試合・ブレイクスルー・スランプ等の積み重ねで自然にそこへ向かう。成長量を外部定数で制御するのではなく、シミュレーション内の出来事が成長量を決定する。

AI団体の選手もプレイヤー側と完全に同一のシミュレーション（週次処理）で成長する。

---

## 1. 現行システムの問題

### 1.1 予算配給型の構造

現行の `calcGrowth` は以下の構造を持つ：

```js
const seasonBudget = GROWTH_SEASON_BASE * ageMul * coachMul;  // ← シーズン成長量が先に決まる
const perPractice = (seasonBudget * practiceShare * share) / 9; // ← 9週に小分けして配給
```

「練習した結果こう伸びた」ではなく「今シーズンの成長量はこれ、それを9回に小分けにして渡す」構造。GROWTH_SEASON_BASE = 8.0 が全キャラ共通の成長量を外部から規定し、trainCapとの距離は配分比率にしか影響しない。

### 1.2 具体的な弊害

- **trainCapの意味が薄い**: 全キャラ共通で生涯約68ポイントしか伸びない。天井が高くても低くても同じ絶対量しか成長しないため、trainCapが高いキャラほど到達率が低くなる
- **notionが全てを決める**: スタート地点が高い＝天井に近い＝到達率が高い。potやtrainCapの設計意図が機能しない
- **シミュレーション的でない**: ブレイクスルー、スランプ等のイベントは予算の「上のスパイス」でしかなく、成長の本体を決定できない

### 1.3 AI一括成長の問題

`aiSeasonGrowth` はシーズン末に一括で成長処理を行う。AIが週次の練習・試合を経て成長していないため、スランプ・ブレイクスルー・怪我等のイベントがAIの成長に自然に影響しない。

---

## 2. 新設計: trainCap距離ベース成長

### 2.1 基本計算式

```
1回の練習成長 = baseLearning × (remaining / trainCap) × ageMul × coachMul × variance
```

- `remaining = trainCap[stat] - current[stat]` — 天井までの距離
- `remaining / trainCap` — 距離比率。天井から遠いほど1.0に近く、天井に近いほど0に近づく。**これが自然な逓減ブレーキ**
- `baseLearning` — 1回の練習で「天井が最も遠い時に」得られる最大成長量の基準値
- `ageMul` — 年齢倍率（既存のageMultiplier関数をそのまま使用）
- `coachMul` — コーチ倍率（既存のコーチシステムをそのまま使用）
- `variance` — 週ごとのランダムブレ（既存の特性別variance計算をそのまま使用）

### 2.2 baseLearning の値

**baseLearning = 2.0**

逆算根拠:
- 練習36週 + 試合12回/シーズン × 10シーズン（17-26歳）のキャリアで、trainCapの91-92%に練習+試合のみで到達
- ブレイクスルー（+2〜4, キャリアで数回）を加えて94-96%圏
- 低帯〜エースまで到達率がほぼ横並び（距離ベースの数学的性質による）

シミュレーション検証結果（baseLearning=2.0, coachMul=1.15, trainCap factor=0.65）:

| キャラ | 天井OVR | 最終OVR | 到達率 | 安定時期 |
|--------|---------|---------|--------|----------|
| 低帯（園部梨花） | 76 | 70 | 92% | age22 |
| 中帯（椿山みさき） | 88 | 81 | 92% | age22 |
| 上帯（片桐ありさ） | 97 | 89 | 92% | age22 |
| エース（阿武隈塔子） | 107 | 97 | 91% | age23 |

### 2.3 GROWTH_SEASON_BASE の廃止

`GROWTH_SEASON_BASE` 定数および `GROWTH_CONFIG.practiceShare` を廃止する。成長量は練習1回ごとに trainCap との距離から自然に導出される。

廃止対象:
- `const GROWTH_SEASON_BASE = 8.0;` （data.js）
- `GROWTH_CONFIG.practiceShare`（data.js）
- calcGrowth 内の `seasonBudget`, `perPractice` 計算ライン

### 2.4 GROWTH_CONFIG の更新

```js
const GROWTH_CONFIG = {
  baseLearning: 2.0,          // 🆕 1回の練習の基本成長量（距離比率=1.0時）
  matchGrowthBase: 0.35,      // 試合1回あたりの基本成長（変更なし）
  intensiveMult: 1.5,         // 強化練習倍率（変更なし）
  intensiveCondDrain: 2.0,    // 強化練習コンディション消耗倍率（変更なし）
  intensiveInjuryChance: 0.05,// 強化練習怪我確率（変更なし）
  intensiveMaxConsec: 2,      // 強化練習最大連続週（変更なし）
  intensiveMinCond: 50,       // 強化練習最低コンディション（変更なし）
  convergenceRatio: 0.15,     // ⚠️ 廃止検討（§2.5参照）
};
```

### 2.5 convergenceRatio について

現行の convergenceMul（trainCap上位15%で追加の減速）は距離ベースと二重減速になる。

距離ベース `remaining / trainCap` は既にtrainCap付近で自然に減速する:
- remaining = trainCap × 0.15 のとき、ratio = 0.15 → baseLearning × 0.15 と十分小さい
- remaining = trainCap × 0.05 のとき、ratio = 0.05 → ほぼ微増

**convergenceRatio は廃止する。** 距離ベースの自然な逓減のみで十分。

---

## 3. 新しい calcGrowth 実装

### 3.1 関数シグネチャ（変更なし）

```js
calcGrowth(rng, G, char, stat, overrideCoachMul = null)
```

### 3.2 実装

```js
calcGrowth(rng, G, char, stat, overrideCoachMul = null) {
  if (stat === 'mn') return 0; // MNT is innate, no training growth

  const current = char[stat];
  const trainCap = char.trainCap ? char.trainCap[stat] : (char.pot[stat] || current);
  if (current >= trainCap) return 0;

  const remaining = trainCap - current;
  const ratio = remaining / trainCap; // 距離比率: 天井から遠いほど1.0に近い

  const age = char.age || (17 + (char.careerSeasons || 0));
  const ageMul = ageMultiplier(age, char.traits);
  if (ageMul <= 0) return 0;

  const coachMul = overrideCoachMul ?? Engine.coach.getCharGrowthMult(G, char.id, stat);

  // ★ 核心: baseLearning × 距離比率 × 年齢 × コーチ
  const baseGain = GROWTH_CONFIG.baseLearning * ratio * ageMul * coachMul;

  // 特性ボーナス（既存ロジック維持）
  let bonus = 1.0;
  if ((char.age || 99) <= 19 && G.roster && G.roster.some(
    c => c.id !== char.id && Traits.has(c, 'リーダー気質') && !c.injury
  )) bonus *= 1.10;
  if (Traits.has(char, '負けず嫌い') && char.lastMatchResult === 'loss') bonus *= 1.10;
  if (Traits.has(char, '反骨心') && (char.trust != null ? char.trust : 50) <= 30) bonus *= 1.15;

  // variance（既存ロジック維持）
  const vFloor = Traits.has(char, '努力家') ? 0.75 : 0.5;
  let weeklyVariance = vFloor + Engine.rng.float(rng) * (1.5 - vFloor);
  if (Traits.has(char, '破天荒')) weeklyVariance = Engine.rng.float(rng) * 2.5;

  const rawGain = baseGain * bonus * weeklyVariance;
  const intensiveMul = char.intensive ? GROWTH_CONFIG.intensiveMult : 1.0;

  const finalGain = Math.max(0, Math.round(rawGain * intensiveMul * 10) / 10);
  return Math.min(Math.ceil(finalGain), trainCap - current);
},
```

### 3.3 既存の修飾要素（変更なし）

calcGrowthの外側で適用される以下の乗算はそのまま維持:

| 要素 | 乗算 | 適用箇所 |
|------|------|----------|
| スランプ | ×0 | `statusMult` |
| モチベ喪失 | ×0 | `statusMult` |
| 絶好調 | ×1.15 | `statusMult` |
| growthPenalty | ×multiplier | `penMult` |
| 専属トレーナー | trainerMult | `trainerMult` |
| 孤立デバフ | ×0.7 | `isolationMult` |
| トレーニングブースト | trainingBoostMult | ケアアクション由来 |

### 3.4 試合成長（変更なし）

試合成長ロジックは既にイベント駆動で動いているため変更しない:

```js
matchGrowth = matchGrowthBase + opponentBonus + closeMatchBonus + resultBonus + coachMatchBonus
```

### 3.5 ブレイクスルー（変更なし）

`Engine.growthEvents.checkAndApplyBreakthrough` は既存ロジックをそのまま維持。

---

## 4. AI週次化

### 4.1 aiSeasonGrowth の廃止

`Engine.rival.aiSeasonGrowth` を廃止する。AI選手は tickWeek 内でプレイヤー選手と同一の週次処理を受ける。

### 4.2 AI週次練習の処理

現在の tickWeek 内 AI処理（engine.js 2920行付近）は既に以下の構造を持っている:

```js
const growth = Engine.growth.calcGrowth(rng, state, nc, growStat, aceConfig.coachMul);
const trainGrowth = Math.round(growth * statusMult * intensiveMult * 10) / 10;
```

この処理は新しい calcGrowth がそのまま呼ばれるため、AI側の変更は `aiSeasonGrowth` の呼び出し箇所を削除するだけ。

### 4.3 aiSeasonGrowth を呼んでいる箇所の特定と削除

シーズン末処理で `aiSeasonGrowth` を呼んでいる箇所を全て削除する。AI選手は既に週次の tickWeek ループ内で練習成長と試合成長を受けているため、シーズン末の一括成長は二重適用になる。

### 4.4 AI団体間の差別化

コーチ倍率（`org.coachMul`）で自然に差がつく:

| 団体 | coachMul | 効果 |
|------|----------|------|
| S級 | 1.30 | baseLearning × 1.30 → 練習効率30%UP |
| A級 | 1.15 | baseLearning × 1.15 → 練習効率15%UP |
| B級 | 1.00 | baseLearning × 1.00 → 基準 |
| プレイヤー | コーチ依存 | 雇用コーチの growthMult |

---

## 5. 検証計画

### 5.1 auto-sim による検証

Phase 1 実装後、`test/auto-sim.js` を使って以下を検証:

1. **到達率分布**: 全98キャラの trainCap 到達率。目標: 85-95%帯に大半が収まる
2. **成長カーブ形状**: 年齢ごとのOVR推移。黄金期（19-22歳）が最も伸び、23歳以降は緩やかに
3. **AI団体間バランス**: S/A/B級の平均OVRが適切な差を持つか
4. **ブレイクスルーの影響**: BT有無による最終到達率の差
5. **スランプの影響**: スランプ経験キャラの到達率低下が致命的でないか
6. **ゲーム全体への影響**: ランキング推移、タイトル戦バランス等

### 5.2 特に注目する指標

- S級エースの最終OVR（目標: 95-100程度）
- ドラフト候補の最終OVR（目標: 各自のtrainCapの90%前後）
- プレイヤー団体 vs AI団体の成長速度差
- 引退時の到達率分布

---

## 6. 変更ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `src/data.js` | GROWTH_CONFIG 更新（baseLearning追加、practiceShare削除）、GROWTH_SEASON_BASE 削除 |
| `src/engine.js` | calcGrowth 書き換え、aiSeasonGrowth 呼び出し削除 |
| `test/auto-sim.js` | 成長到達率の検証ロジック追加 |

---

## 7. 将来の拡張: 内部カウンター方式（Phase 2予定）

Phase 1 が安定した後、成長の「波」を導入する。練習で得た成長ポイントを内部カウンター（潜在成長バッファ）に蓄積し、閾値を超えた時に実際のステータスに反映する仕組み。これにより成長カーブに自然な階段状の凹凸が生まれ、最終到達点にもばらつきが出る。詳細は Phase 2 設計書で定義する。

---

## 8. 初期ドラフト改善・バックストーリー関係生成

成長システム安定後のロードマップ項目として以下を予定:

- **初期ドラフトの逸材リーク**: elite帯キャラをFAプールに1-2名漏らし、ドラフト候補に混入させる
- **バックストーリー初期関係**: ドラフト開始前に世界全体へ関係性（同期入団/元タッグ/過去の遺恨）を割り振る。`G.backstoryPairs` に記録し、inspect/コンソールから確認可能にする
