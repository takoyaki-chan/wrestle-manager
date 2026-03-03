# 選手成長リバランス設計書 v1.0

## 1. 問題の概要

### 1.1 現行システムの構造的格差

プレイヤー団体とAI団体の成長メカニズムに深刻な不公平が存在し、「弱小団体から始めて逆転勝利する」というゲームのカタルシスが構造的に達成困難になっている。

**同一能力・同一年齢の選手で1シーズン成長を比較した結果:**

| 条件 | OVR変化 |
|------|---------|
| プレイヤー（怪我なし・理想条件） | +3 |
| AI B級 | +8 |
| AI A級 | +8 |
| AI S級 | +8 |

### 1.2 根本原因（5つ）

**原因①: AI全ステ同時成長 vs プレイヤー1週1ステ**

AIの `aiSeasonGrowth` は `['pw','sp','te','st'].forEach` で4ステ一括成長。プレイヤーは `pickGrowthStat` で1週1ステのみ。同じ48週で、AIは各ステに30週分、プレイヤーは各ステに9週分しか練習できない。

**原因②: プレイヤーにだけ×0.4の練習補正**

```js
// プレイヤー（engine.js:2427）
const trainGrowth = Math.round(growth * 0.4 * ...);

// AI（engine.js:2026）— 0.4補正なし
const weeklyGain = styleTable * ageMul * coachMul * facilityMul * tierGrowth * convFactor;
```

**原因③: AIにシーズン中のネガティブイベントが一切ない**

| 要素 | プレイヤー | AI |
|------|-----------|-----|
| シーズン中の怪我 | 毎試合判定 | なし |
| コンディション管理 | 低下で休養必須 | なし |
| 休養週による成長ロス | あり | なし |
| スキャンダル | 人気40以上で判定 | なし |
| スランプ（週次） | 怪我回復・敗戦で判定 | シーズン末5%のみ |
| モチベ喪失（週次） | あり | シーズン末1%のみ |
| 週次能力微減 | スランプ/モチベ中あり | なし |

**原因④: AI選手の初期OVRが高い**

`makeAIFighter` の maturity計算で28歳以上はNotion値100%スタート。プレイヤー選手は16歳入団でNotion×0.55。AI団体は初期ロスター時点でOVR60-80の選手が多数。

**原因⑤: convergenceFactor + ageMul の相互作用問題**

convergenceFactorが急峻（trainCap付近で急速にゼロ化）なため、成長は最初の2-3シーズンに集中し、ageMultiplierのカーブがほとんど意味をなさない。

### 1.3 あるべき成長カーブ

- **16歳で入団** → 初期はNotion値の55-60%程度
- **17-19歳**: 若手として着実に伸びる（年+2-3 OVR）
- **20-22歳**: 黄金の成長期（年+2-3 OVR）
- **23-25歳**: 安定成長、仕上げの段階（年+1-2 OVR）
- **26-28歳**: 最後の伸びしろ、ピーク到達（年+0-1 OVR）
- **27-28歳でピーク** → trainCapの90-95%に到達
- **29歳以降**: 衰退開始（wear/decayシステムによる）

---

## 2. リバランス方針

### 2.1 設計原則

1. **プレイヤーとAIで同一の成長モデルを使用する**（公平性の保証）
2. **年間成長量を直接制御する**（convergence依存をやめる）
3. **12シーズンかけて段階的にピークに到達する**カーブを実現
4. **AIにもネガティブイベント相当の補正を加える**
5. 既存のコーチ・特性・スケジュール管理のゲーム性は維持

### 2.2 成長モデルの統一: 「シーズン予算」方式

プレイヤーもAIも「1シーズンあたりの成長予算（seasonBudget）」から計算する。

```
seasonBudget = SEASON_BASE × ageMul(age, traits)
```

- `SEASON_BASE = 8.0`（pw+sp+te+stの合計成長ポイント、ageMul=1.0時）
- 予算は各ステに「残り距離（trainCap - current）の比率」で配分
- これによりプレイヤーとAIが完全に同じ年間成長量を持つ

---

## 3. 詳細設計

### 3.1 新しい年齢倍率カーブ（ageMultiplier）

```js
function ageMultiplier(age, traits) {
  let mul;
  if (age <= 17)      mul = 0.8;   // 新人: 体がまだできていない
  else if (age <= 19) mul = 1.1;   // 急成長期の入口
  else if (age <= 22) mul = 1.3;   // 黄金の成長期
  else if (age <= 25) mul = 1.0;   // 安定成長
  else if (age <= 28) mul = 0.6;   // 仕上げ段階
  else if (age <= 30) mul = 0.15;  // ほぼ停止
  else if (age <= 32) mul = 0.05;  // 微成長
  else                mul = 0;     // 成長なし

  // 特性による修正（現行を維持）
  if (!Array.isArray(traits)) return mul;
  if (traits.includes('早熟')) {
    if (age <= 21) mul *= 1.3;
    else if (age >= 26) mul *= 0.7;
  }
  if (traits.includes('晩成')) {
    if (age <= 21) mul *= 0.8;
    else if (age >= 26 && age <= 32) mul *= 1.4;
  }
  if (traits.includes('遅咲き')) {
    if (age <= 25) mul *= 0.8;
    else if (age <= 34) mul = Math.max(mul, 0.9);
  }
  return mul;
}
```

**現行との比較:**

| 年齢帯 | 現行 | 新案 | 変更理由 |
|--------|------|------|----------|
| ≤17 | 1.5 | 0.8 | 早すぎる成長を抑制 |
| 18-19 | 1.2 | 1.1 | 急成長期だがやや抑え |
| 20-21 | 1.2 | 1.3 | ここが成長のピーク |
| 22-25 | 1.0 | 1.0-1.3 | 22歳までは黄金期 |
| 26-28 | 0.7 | 0.6 | 仕上げ段階 |
| 29-30 | 0.3 | 0.15 | ほぼ停止（wearに移行） |
| 31-32 | 0.1-0.3 | 0.05 | 微量のみ |
| 33+ | 0-0.1 | 0 | 成長なし |

### 3.2 プレイヤー成長（calcGrowth改修）

**変更点:**
- `×0.4` 練習補正を **廃止**
- 代わりに `calcGrowth` 自体のbase計算を再調整し、48週の累積がseasonBudgetと整合するようにする

**計算の流れ:**

1週の練習で1ステのみ成長（現行維持）。ただしbase計算を以下に変更:

```
目標: 1シーズンで seasonBudget = 8.0 × ageMul の合計成長
  - 練習成長: 36週 × (1ステ/週) → 各ステ9回 → 4ステ合計約5.0相当
  - 試合成長: 12試合 × 1-2ステ/試合 → 約3.0相当（現行維持）
  - 合計: 約8.0
```

練習1回あたりの期待値:
```
perPractice = (seasonBudget - matchGrowthEstimate) / 36
            = (8.0 - 3.0) / 36
            ≈ 0.14 (ageMul=1.0時)
```

この値はconvergence factorやstyle weightが掛かった後の値。base計算の調整で実現する。

**具体的な calcGrowth 改修:**
```js
calcGrowth(rng, G, char, stat) {
  if (stat === 'mn') return 0;
  const current = char[stat];
  const trainCap = char.trainCap ? char.trainCap[stat] : (char.pot[stat] || current);
  if (current >= trainCap) return 0;

  // 残り距離ベースの成長量
  const remaining = trainCap - current;
  const totalRemaining = ['pw','sp','te','st'].reduce((s, st) =>
    s + Math.max(0, (char.trainCap?.[st] || char.pot?.[st] || char[st]) - char[st]), 0);
  if (totalRemaining <= 0) return 0;

  const share = remaining / totalRemaining; // このステの配分比率
  const age = char.age || (16 + (char.careerSeasons || 0));
  const ageMul = ageMultiplier(age, char.traits);

  const coachMul = Engine.coach.getCharGrowthMult(G, char.id, stat);

  // 1練習あたりのbase = seasonBudget × share / 9週
  const seasonBudget = GROWTH_SEASON_BASE * ageMul * coachMul;
  const practiceShare = 0.6; // 練習:試合 = 6:4 の配分
  const perPractice = (seasonBudget * practiceShare * share) / 9;

  // 既存の特性ボーナス（ムードメーカー、リーダー気質、負けず嫌い）
  let bonus = 1.0;
  if (G.roster?.some(c => Traits.has(c, 'ムードメーカー') && !c.injury)) bonus *= 1.05;
  if ((char.age || 99) <= 21 && G.roster?.some(c => c.id !== char.id && Traits.has(c, 'リーダー気質') && !c.injury)) bonus *= 1.10;
  if (Traits.has(char, '負けず嫌い') && char.lastMatchResult === 'loss') bonus *= 1.20;

  // variance
  const vFloor = Traits.has(char, '努力家') ? 0.75 : 0.5;
  let variance = vFloor + Engine.rng.float(rng) * (1.5 - vFloor);
  if (Traits.has(char, '破天荒')) variance = Engine.rng.float(rng) * 2.5;

  const rawGain = perPractice * bonus * variance;
  const intensiveMul = char.intensive ? GROWTH_CONFIG.intensiveMult : 1.0;
  const finalGain = Math.max(0, Math.round(rawGain * intensiveMul * 10) / 10);
  return Math.min(Math.ceil(finalGain), trainCap - current);
}
```

**tickWeekでの呼び出し変更:**
- `growth * 0.4 * penMult * statusMult * ...` の `* 0.4` を **削除**
- `calcGrowth` 自体が適切な量を返すので、そのまま `growth * penMult * statusMult * ...` とする

### 3.3 AI成長（aiSeasonGrowth改修）

**変更方針:** プレイヤーと同じseasonBudgetモデルを使用する。

```js
aiSeasonGrowth(rng, fighter, org) {
  const f = { ...fighter };
  if (f._aiGrowthBlock) { /* cleanup and return */ }
  const growthMod = f._aiGrowthHalf ? 0.5 : 1.0;

  const age = f.age || 20;
  const ageMul = ageMultiplier(age, (f || {}).traits);
  if (ageMul <= 0) return f;

  const coachMul = org.coachMul || 1.0;

  // ★新: プレイヤーと同じ SEASON_BASE を使用（tierGrowthBonusは維持）
  const tierGrowth = (AI_TIER_LIMITS[org.tier] || AI_TIER_LIMITS.B).growthBonus;
  const seasonBudget = GROWTH_SEASON_BASE * ageMul * coachMul * tierGrowth;

  const stats = ['pw','sp','te','st'];
  const totalRemaining = stats.reduce((s, st) =>
    s + Math.max(0, (f.trainCap?.[st] || 100) - f[st]), 0);
  if (totalRemaining <= 0) return f;

  stats.forEach(s => {
    if (f[s] >= (f.trainCap?.[s] || 100)) return;
    const remaining = (f.trainCap?.[s] || 100) - f[s];
    const share = remaining / totalRemaining;

    // variance（シーズン全体のブレ）
    const variance = 0.85 + Engine.rng.float(rng) * 0.30;
    const gain = Math.round(seasonBudget * share * variance * growthMod);
    f[s] = Math.min(f.trainCap?.[s] || 100, f[s] + gain);
  });

  // cleanup temp fields
  const { _aiGrowthHalf: _h, _aiGrowthBlock: _b, ...cleanF } = f;
  return cleanF;
}
```

**AI_SEASON_CFGの旧パラメータは不要になる:**
- `trainWeeks`, `seasonVarianceMin/Max`, `matchGrowthBase`, `matchesPerSeason` → 廃止
- `tierPopBonus`, `popConvergeRate`, `popRandomRange` → 人気計算用に残す

### 3.4 AI_TIER_LIMITSの調整

```js
const AI_TIER_LIMITS = {
  S: { maxProdigies: 99, maxPromising: 99, growthBonus: 1.05, faAggressiveness: 0.60 },
  A: { maxProdigies: 3,  maxPromising: 99, growthBonus: 1.00, faAggressiveness: 0.40 },
  B: { maxProdigies: 1,  maxPromising: 99, growthBonus: 0.95, faAggressiveness: 0.20 }
};
```

S級が+5%、B級が-5%。これは現行維持。ただしseasonBudgetベースになるため、旧モデルとの実効差は大きく変わる。

### 3.5 新定数

```js
// data.js に追加
const GROWTH_SEASON_BASE = 8.0; // 1シーズンの成長予算（4ステ合計、ageMul=1.0時）
```

### 3.6 AI ネガティブイベントの強化

現行の `aiSeasonGrowthEvents` はシーズン末1回判定だが、プレイヤーとの公平性のため以下を追加:

**AI怪我の擬似反映:**
- AI選手に年間10-15%の確率で「離脱イベント」を付与
- 離脱した選手はそのシーズンの成長が50%カット（`_aiGrowthHalf`相当）
- S級: 10%、A級: 12%、B級: 15%（設備差による）

```js
// processSeasonEnd 内、成長計算前に追加
roster.forEach(f => {
  const injuryChance = org.tier === 'S' ? 0.10 : org.tier === 'A' ? 0.12 : 0.15;
  if (Engine.rng.float(rng) < injuryChance) {
    f._aiGrowthHalf = true; // 成長50%カット
    events.push(`${org.emoji} ${f.name}: 長期離脱`);
  }
});
```

---

## 4. シミュレーション結果

### 4.1 新方式での成長カーブ（逸材選手、コーチなし）

```
entry OVR: 53 | trainCap OVR: 76 | gap: 23
目標: 27-28歳で cap到達 90-95% (OVR 68~72)

16歳: OVR 54  cap71%
17歳: OVR 56  cap73%
18歳: OVR 57  cap75%
19歳: OVR 59  cap77%
20歳: OVR 61  cap80%
21歳: OVR 64  cap83%
22歳: OVR 66  cap86%
23歳: OVR 68  cap89%
24歳: OVR 70  cap91%
25歳: OVR 71  cap93%
26歳: OVR 72  cap95%
27歳: OVR 74  cap96%  ← ピーク付近
28歳: OVR 75  cap98%  ← ピーク
29歳以降: decay開始
```

### 4.2 特性による成長カーブ差

| タイプ | ピーク年齢 | ピークOVR | cap到達率 |
|--------|-----------|-----------|----------|
| 逸材（通常） | 28歳 | 75 | 98% |
| 逸材（早熟） | 25歳 | 75 | 99% |
| 逸材（晩成） | 28歳 | 73 | 96% |
| 中堅（通常） | 24歳 | 54 | 100% |
| 中堅（遅咲き） | 26歳 | 54 | 100% |

### 4.3 プレイヤーvsAIの公平性

新方式では、同一能力・同一年齢・同一環境の選手が、プレイヤー/AI問わず同じ年間成長量を持つ。差が出るのは:

- **コーチ倍率**: S級=1.30, A級=1.15, B級=1.0, プレイヤー=雇用コーチ次第
- **tierGrowthBonus**: S級=1.05, A級=1.0, B級=0.95（微差）
- **ネガティブイベント**: AI=年10-15%で離脱、プレイヤー=週次で怪我/スランプ判定

プレイヤーのネガティブイベントがAIより多いが、コーチを良いものに変えたりスケジュール管理することで追いつける設計。

---

## 5. 変更対象ファイル

### 5.1 data.js
- `GROWTH_SEASON_BASE` 定数追加
- `ageMultiplier()` 関数の書き換え（§3.1）
- `AI_SEASON_CFG` の旧練習/試合パラメータ削除（人気関連は残す）

### 5.2 engine.js
- `Engine.growth.calcGrowth()` 改修（§3.2）
- tickWeek内の `growth * 0.4` → `growth` に変更（0.4削除）
- `Engine.rival.aiSeasonGrowth()` 改修（§3.3）
- `Engine.rival.processSeasonEnd()` にAI離脱イベント追加（§3.6）

### 5.3 影響を受ける既存仕様
- コーチの成長倍率: そのまま `calcGrowth` 内の `coachMul` として機能
- 強化練習（intensive）: `GROWTH_CONFIG.intensiveMult` はそのまま有効
- ブレークスルー/スランプ/モチベ喪失: 判定ロジックはそのまま、成長量のみ変化
- 特性ボーナス: ムードメーカー/リーダー気質/負けず嫌い/努力家/破天荒 → そのまま有効
- growthPenalty: 怪我後のデバフ → そのまま有効

---

## 6. セーブデータ互換性

既存セーブデータへの影響:

- 選手の能力値・trainCap・notionValueは変更なし → そのまま読み込み可能
- 成長計算式が変わるため、ロード後の成長速度が変化する（許容範囲）
- マイグレーション処理は不要（計算式変更のみ）

---

## 7. テスト計画

1. 新規ゲーム開始 → 16歳入団選手が28歳までに期待通りのOVRに到達するか
2. AI団体のシーズン末処理 → 各団体のOVR増加が年+2-3程度に収まるか
3. 既存セーブデータのロード → エラーなく動作するか
4. 特性（早熟/晩成/遅咲き）→ 期待通りのカーブ差が出るか
5. コーチありでの成長 → コーチなしより明確に速くなるか（ゲーム性維持）
