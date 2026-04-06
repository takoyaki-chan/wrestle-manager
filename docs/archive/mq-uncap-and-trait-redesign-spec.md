# MQ上限撤廃 & 特性MQリデザイン 実装指示書

## 設計思想

MQは「試合の質」を正直に映す数字であるべき。
現状の `clamp(5, 100)` は、内部MQ 88 も 95 も「100」に丸めてしまい、
ベストマッチ賞や選手の評価が嘘だらけになっている。

### 3つの変更

1. **MQ上限100の撤廃** — clamp上限を外し、MQ 100超えを許容する
2. **名勝負製造機のリデザイン** — MQ直接+1〜5を廃止し、試合の中身を変える
3. **引き出し上手のリデザイン** — MQ直接+最大4を廃止し、試合の中身を変える

### 期待される結果

- MQ100連発が消える（実測: 内部MQ80超えは0.08%）
- MQ100+は「全てが揃った奇跡の試合」にのみ出現
- ベストマッチ賞が 98 vs 95 vs 92 で正確に比較される
- **既存の閾値コードは一切変更不要**

---

## 1. MQ上限100の撤廃

### 変更箇所: 5箇所

#### 1a. 通常興行の外部MQ適用（management.js L6559）
```javascript
// Before
r.mq = Engine.util.clamp(r.mq + cappedPositive + negativeExternal + trustMQPenalty, 5, 100);
// After
r.mq = Math.max(5, r.mq + cappedPositive + negativeExternal + trustMQPenalty);
```

#### 1b. 決算興行の因縁MQ加算（management.js L8349）
```javascript
// Before
r.mq = Math.min(100, r.mq + rivalLvl.mqBonus);
// After
r.mq = r.mq + rivalLvl.mqBonus;
```

#### 1c. 決算興行のケミストリーMQ加算（management.js L8355）
```javascript
// Before
r.mq = Math.min(100, r.mq + chemistryBonus);
// After
r.mq = r.mq + chemistryBonus;
```
注: `getMatchChemistryBonus()` は現在常に0を返すが、将来の変更に備えて上限を外す。

#### 1d. イベントマッチのMQ加算（management.js L8811）
```javascript
// Before
result.mq = Math.min(100, result.mq + mqBonus);
// After
result.mq = result.mq + (mqBonus || 0);
```

#### 1e. 内部MQ計算のclamp（match-engine.js L299）
```javascript
// Before
mq = Math.round(Engine.util.clamp(mq, 5, 100));
// After
mq = Math.max(5, Math.round(mq));
```
注: 特性によるMQ加算を廃止（後述§2, §3）するため、
内部MQがOVシーリングを超えることは基本的にないが、
将来的な安全のため上限を外しておく。

### 変更しないもの

- `MQ_EXTERNAL_CAP = 12` — そのまま維持。外部ボーナスの正方向上限は引き続き12
- 全ての閾値コード（人気増減、メインペナルティ、因縁決着、成長ボーナス等） — 一切変更不要
- UI表示 — MQは数値表示のみ（バーやパーセント表示なし）なので100超えでも問題なし
- OVシーリング公式 — そのまま維持（最大100）

---

## 2. 名勝負製造機のリデザイン

### 現状の問題
```javascript
// match-engine.js L296
if (Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機'))
  mq += 1 + Engine.rng.int(rng, 0, 4);  // +1〜5ランダム
```
MQに直接+1〜5。試合の中身に何も影響を与えず、数字だけ後付けで盛られる。

### 新しい設計: 「ドラマ素材が発生しやすくなる」

MQ計算の仕組み（§2ドラマ減点）のおさらい:
- 基礎ペナルティ30点から、試合中の見せ場で回復していく
- キックアウト（最大2回計上）: 1回あたり -8点回復
- カウンター（最大3回計上）: 1回あたり -2.5点回復
- リードチェンジ（最大3回計上）: 1回あたり -1.5点回復
- ビッグムーブ（最大6回計上）: 1回あたり -0.4点回復

名勝負製造機の選手がいると、**キックアウトとカウンターの発生率が上がる**。
これにより見せ場が増え、ドラマ減点が回復しやすくなり、結果的にMQが高くなりやすい。
ただし毎試合確実にMQが上がるわけではなく、試合展開に依存する自然なばらつきが出る。

### 実装

#### 2a. match-engine.js の MQ直接加算を削除
```javascript
// L296: この行を削除
if (Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機')) mq += 1 + Engine.rng.int(rng, 0, 4);
```

#### 2b. キックアウト判定に名勝負製造機ボーナスを追加
`calcKickoutChance()` 内で、名勝負製造機持ちが試合に参加している場合、
キックアウト確率を上げる。

```javascript
// match-engine.js: calcKickoutChance() 内
// 名勝負製造機ボーナス: キックアウト確率 +15%
// ※ この関数には試合参加者の特性情報が必要になるため、
//    引数で hasMeishoubuSeizou フラグを受け取る設計にする
if (hasMeishoubuSeizou) chance += 0.15;
```

具体的なアプローチ:
- `simulateMatch()` 内で `hasMeishoubu = Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機')` を事前計算
- キックアウト判定の呼び出し箇所で確率に +0.15 を加算（calcKickoutChanceの返り値に加算でも、引数渡しでもよい）
- ギブアップ脱出判定でも同様に +0.15

#### 2c. カウンター発生率に名勝負製造機ボーナスを追加
カウンター判定箇所を確認し、名勝負製造機持ちがいる場合に発生率を上げる。
具体的な上げ幅はカウンター発生の基礎確率を確認した上で、
キックアウトと同程度の影響度（見せ場が1試合あたり平均0.5〜1回増える程度）に調整する。

#### 2d. 数値調整の目安
- 名勝負製造機なしの場合の平均ドラマ減点: 約20（実測値）
- 名勝負製造機ありの目標: 平均ドラマ減点 15〜17程度（= MQ換算で平均+3〜5の間接効果）
- 旧効果の+1〜5（平均+3）と概ね同等だが、確率的にばらつく
- auto-simで名勝負製造機あり/なしの平均MQ差を計測して微調整する

---

## 3. 引き出し上手のリデザイン

### 現状の問題
```javascript
// match-engine.js L298
if (ovDiff > 15 && (Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手')))
  mq += Math.min(4, ovDiff * 0.15);
```
OV差が大きい試合でMQに直接+最大4。格下とやるほど得する。

### 新しい設計: 「格下との試合でペーシング減点を緩和する」

OV差が大きい試合は短期決着になりやすく、ペーシング減点が発生しやすい。
引き出し上手の選手がいると、格下でも試合が適正ターン数まで続きやすくなる。
結果としてペーシング減点が0になり、MQが高くなる。

### 実装

#### 3a. match-engine.js の MQ直接加算を削除
```javascript
// L298: この2行を削除
const ovDiff = Math.abs(Engine.util.ov(charL) - Engine.util.ov(charR));
if (ovDiff > 15 && (Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手'))) mq += Math.min(4, ovDiff * 0.15);
```
注: `ovDiff` が他の箇所で参照されていないか確認すること。

#### 3b. ペーシング減点の計算にOV差緩和を追加
```javascript
// match-engine.js: §3 ペーシング減点の計算箇所
// 引き出し上手: OV差が大きい試合でもターン数が短くなりにくい
// → ペーシング減点の「適正ターン」判定を緩和する
const hasHikidashi = Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手');
if (tier >= 2) {
  // Tier 2: 通常は13ターン以上が理想
  const idealMin = hasHikidashi ? 10 : 13;  // 引き出し上手: 10ターンでも理想扱い
  const okMin = hasHikidashi ? 7 : 10;      // 引き出し上手: 7ターンでも軽微
  if (matchTurns >= idealMin) pacingPenalty = 0;
  else if (matchTurns >= okMin) pacingPenalty = 3;
  else pacingPenalty = 12;
} else {
  // Tier 1: 通常は7ターン以上が理想
  const idealMin = hasHikidashi ? 5 : 7;
  const okMin = hasHikidashi ? 3 : 5;
  if (matchTurns >= idealMin) pacingPenalty = 0;
  else if (matchTurns >= okMin) pacingPenalty = 3;
  else pacingPenalty = 12;
}
```

#### 3c. 効果の性質
- 平均ペーシング減点は現在1.0（ほとんどの試合で0）なので、効果が出るのは主にOV差の大きい格下戦
- OV差が大きい試合ではターン数が短くなりがちで、ペーシング減点3〜12が発生する
- 引き出し上手があればその減点を回避できる = 格下との試合でもMQが崩れにくい
- auto-simでOV差20+の試合における引き出し上手あり/なしのMQ差を計測

---

## 4. 変更箇所一覧

### match-engine.js
| 行番号（目安） | 変更内容 |
|----------------|----------|
| L296 | 名勝負製造機のMQ直接加算を削除 |
| L297-298 | 引き出し上手のMQ直接加算を削除 |
| L299 | `clamp(mq, 5, 100)` → `Math.max(5, Math.round(mq))` |
| キックアウト判定箇所 | 名勝負製造機の確率ボーナス +0.15 を追加 |
| ギブアップ脱出判定箇所 | 名勝負製造機の確率ボーナス +0.15 を追加 |
| カウンター判定箇所 | 名勝負製造機の確率ボーナスを追加（値はカウンター基礎確率を見て調整） |
| §3 ペーシング減点 | 引き出し上手によるターン閾値緩和を追加 |

### management.js
| 行番号（目安） | 変更内容 |
|----------------|----------|
| L6559 | `clamp(r.mq ..., 5, 100)` → `Math.max(5, r.mq ...)` |
| L8349 | `Math.min(100, r.mq + ...)` → `r.mq + ...` |
| L8355 | `Math.min(100, r.mq + ...)` → `r.mq + ...` |
| L8811 | `Math.min(100, result.mq + ...)` → `result.mq + (mqBonus \|\| 0)` |

### data.js
変更なし。

### ui-render.js / ui-common.js
MQは数値として直接表示されているだけなので変更不要。
100超えの数字がそのまま表示される。

---

## 5. テスト方針

### 5a. auto-sim 回帰テスト（100シーズン）
- validateGameState の違反がないことを確認
- MQ分布の変化を確認（100が消えて、最大が85〜95付近に収まること）

### 5b. MQ100+の発生率確認
OV70+の選手ペアで大量試合（10,000試合以上）を回し、
外部ボーナスなしの内部MQだけで85を超える試合が1%未満であることを確認。
外部ボーナス+12を足してMQ100に届く試合が0.1%未満であることが理想。

### 5c. 名勝負製造機の効果検証
名勝負製造機あり/なしで各5,000試合を回し:
- 平均MQ差が+3〜5の範囲にあること
- キックアウト・カウンターの平均発生回数が増えていること
- MQ分布が「確実に+N」ではなく自然にばらついていること

### 5d. 引き出し上手の効果検証
OV差20+の試合で引き出し上手あり/なしの比較:
- ペーシング減点が発生する確率が大幅に下がること
- 平均MQ差が+2〜4の範囲にあること

### 5e. 既存システムへの影響確認
- ベストマッチ賞が正確に最高MQ試合を選んでいること
- 人気増減、因縁決着、成長ボーナス等が従来と同程度に発生していること
- 興行評価（星評価）が大きく変動していないこと

---

## 6. 実装順序

1. match-engine.js: 名勝負製造機・引き出し上手のMQ直接加算を削除
2. match-engine.js: MQ clamp上限を外す
3. match-engine.js: 名勝負製造機のドラマ素材発生率ボーナスを実装
4. match-engine.js: 引き出し上手のペーシング減点緩和を実装
5. management.js: 4箇所の MQ clamp上限を外す
6. auto-simで回帰テスト
7. 名勝負製造機・引き出し上手の効果を個別検証、数値調整
