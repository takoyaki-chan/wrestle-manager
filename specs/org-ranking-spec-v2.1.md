# 団体ランキング 評価/基礎力 算出仕様 v2.1

策定日: 2026-07-31 / 実装済み

> v2.0 からの現行版。実装は `src/management.js` の `Engine.ranking` と
> `src/data.js` の `RANKING_CONFIG` を正とする。

## 1. 評価の全体式

```text
評価 (rating) = 基礎力 (baseScore) + レガシー (legacyScore)
              + 対戦PT (battlePt) + シーズン実績 (achievementScore)

基礎力 (baseScore) = Force + Depth + Marquee
```

`calcOrgRating(state, orgId, roster, battlePt)` は `getDepthBenchmark(state)` を取得して
`calcRosterPower()` へ渡す。`updateRankings()` は4団体の `rating` を降順に並べ、順位を1から振る。
表示用の `rating`、`baseScore`、`legacyScore`、`achievementScore`、`battlePt` は整数丸め、
Force / Depth / Marquee と Depth 内訳は小数第1位に丸めて保持する。

## 2. 基礎力

### 2.1 Force（コア戦力）

- 対象は在籍者。`retired` と `isRental` を除外するが、`injury` と `forcedRest` は含める。
- OVR と popularity をそれぞれ降順にし、上位8人（不足時はいる人数）の加重平均を取る。
- 重み: `[1.6, 1.4, 1.25, 1.1, 1.0, 0.9, 0.8, 0.7]`

```text
Force = weightedTop8(OVR) × 1.2 + weightedTop8(popularity) × 0.6
```

OVR順位と人気順位は独立している。同じ選手集合をOVR順で使う計算ではない。

### 2.2 Depth（層の厚み）

Depth は人数加点ではなく、実戦可能な選手が各スロットの基準OVRから満点OVRへどこまで
到達しているかを合算する。これにより、人数だけを増やしてもスコアは上がらない。

#### 対象とスロット

- `retired`、`isRental`、`injury`、`forcedRest` を除外し、OVR降順に並べる。
- 主力層は配列index `3`〜`7`、すなわち4〜8番手の5枠。1枠4点、最大20点。
- 控え層は配列index `8`〜`11`、すなわち9〜12番手の4枠。1枠2.5点、最大10点。
- 選手がいない枠のOVRは0。合計は30点で上限を掛ける。

各枠の到達度と点数は次式である（`target - baseline` は少なくとも1として除算する）。

```text
readiness = clamp((OVR - baseline) / max(1, target - baseline), 0, 1)
slotScore = readiness × perSlot
Depth = min(30, 主力5枠の合計 + 控え4枠の合計)
```

`coreReady` / `reserveReady` はそれぞれ、OVRが当該 `target` 以上のスロット数である。

#### 業界水準連動の基準（v2.1）

各計算時に、プレイヤー団体とAI全団体のロスターから業界水準を作る。各団体では
`retired` と `isRental` を除外してOVR上位8人（不足時はいる人数）を平均し、平均が0の団体は
除く。その団体別平均の平均を `industry` とする。`industry` は返却時に小数第1位へ丸めるが、
`coreTarget` の判定には丸め前の平均を `Math.round()` して用いる。

```text
industry = mean(mean(top8 OVR of each non-empty org))
coreTarget = clamp(round(industry), 75, 92)
reserveTarget = max(70, coreTarget - 6)
coreBaseline = coreTarget - 30
reserveBaseline = reserveTarget - 20
depthReadyOvr = reserveTarget
```

| 層 | 対象 | baseline | target（満点） | 幅 | 1枠 | 最大 |
|---|---|---:|---:|---:|---:|---:|
| 主力 | 4〜8番手・5枠 | `coreTarget - 30` | `clamp(round(industry), 75, 92)` | 30 | 4 | 20 |
| 控え | 9〜12番手・4枠 | `reserveTarget - 20` | `max(70, coreTarget - 6)` | 20 | 2.5 | 10 |

例として、業界水準が57なら主力targetは75、控えtargetは70で旧序盤基準と同じになる。
業界水準が91なら主力targetは91、控えtargetは85になる。カーブ幅30 / 20は常に固定で、
基準点だけがスライドする。

`RANKING_CONFIG` には固定時・フォールバック時の `depthCoreBaseline: 45`、
`depthCoreTarget: 75`、`depthReserveBaseline: 50`、`depthReserveTarget: 70` とスロット設定が
ある。ただし通常のランキング計算は benchmark を渡すため、v2.1では上式の動的値を用いる。
`getDepthBenchmark()` の `depthBenchFloor` / `depthBenchCap` / `depthBenchReserveOffset` /
`depthBenchCoreWidth` / `depthBenchReserveWidth` は、現行 `RANKING_CONFIG` では未定義であり、
実装フォールバックの `75 / 92 / 6 / 30 / 20` を使う。

#### 怪我人の非対称な扱い

これは意図的な仕様である。

| 軸 | 除外 | 理由 |
|---|---|---|
| Depth | 引退・レンタル・怪我・強制休養 | 当週に実戦へ出せる層の厚みを測るため |
| Force / Marquee | 引退・レンタルのみ。怪我・強制休養は含む | 在籍する団体の「格」を週ごとの欠場で不安定にしないため |

### 2.3 Marquee（看板スター）

- 対象は Force と同じ在籍者（引退・レンタル除外、怪我・強制休養を含む）。
- popularity の上位3値に `[0.6, 0.25, 0.15]` を掛け、`0.45` 倍する。人数不足の値は0。

```text
Marquee = (top1Pop × 0.6 + top2Pop × 0.25 + top3Pop × 0.15) × 0.45
```

## 3. レガシー・対戦PT・シーズン実績

- レガシーは団体初期値（player 0 / org_s 50 / org_a 30 / org_b 15）に、殿堂入り
  （★8 / ★★10 / ★★★13）と `floor(対抗戦通算勝利数 / 5)` を加え、最大50点とする。
- 対戦PTは `state.battlePoints[orgId]` を整数丸めして加える。
- 実績は `Engine.achievement.totalPt()` の合計を整数丸めして加える。アイテムは age 0〜1は満額、
  以後 `0.5^(age - 1)` 倍、1点未満で除去する。現行配点は PPV 15、統一 10、ジュニア 8、
  MVP 10、ベストマッチ 5、メディア功労賞 4、最大動員 3、春タッグ 8、秋対抗戦 10。

## 4. ランキングへ渡す値とUI連携

各ランキングエントリには `depth`、`depthCore`、`depthReserve`、`depthCoreReady`、
`depthReserveReady` と `depthReadyOvr` を含める。`depthReadyOvr` は上記 `reserveTarget` そのもので、
ランキング画面の講評が使う「実戦級」の閾値である。内部スロット数を講評に転用してはならない。

UIの講評は、画面に並べる顔と同じ「非レンタルのOVR順ロスターから、王者または最上位の
featuredを除いた2番手以下」を母集団にする。怪我・強制休養はこの母集団に含む。
`OVR{depthReadyOvr}以上がN人` のように閾値を実数で表示し、人数・人名・OVRはすべて
GameStateから取得する。Depthスコア用の怪我除外4〜8番手/9〜12番手の人数を文章に使わない。

## 5. v2.0からの変更

| 項目 | v2.0 | v2.1 |
|---|---|---|
| Depth | 11位以下のOVR70以上を3点、75以上に追加2点 | 4〜8番手と9〜12番手の各枠をbaseline→targetで段階評価 |
| Depthの満点基準 | 固定75 / 70 | 業界主力水準連動。主力75〜92、控えは主力−6か70の高い方 |
| 頭数の影響 | 条件達成者の人数で直接加点 | 各枠のOVR到達度で加点。枠外の増員だけでは上がらない |
| 欠場者 | 明文化なし | Depthのみ怪我・強制休養を除外。Force/Marqueeは在籍として含める |
| 講評の閾値 | 固定値の前提 | `depthReadyOvr`（動的な控えtarget）を実数表示 |

