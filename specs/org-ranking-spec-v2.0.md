# 団体ランキング 評価/基礎力 算出仕様 v2.0

策定日: 2026-04-30 / Phase 1〜4 全実装完了

## 1. 概要

団体の業界順位を決める「評価ポイント」を **4軸構造** で算出する。
基礎力(現有戦力) は更に 3軸 (コア戦力/層の厚み/看板スター) で多軸化する。

```
評価 (rating) = 基礎力 + レガシー + 対戦PT + シーズン実績
                  ↓
基礎力 (baseScore) = コア戦力 (Force) + 層の厚み (Depth) + 看板スター (Marquee)
```

旧 v1.0 (TOP10加重OVR×1.2 + TOP10加重人気×0.9 の単一線形式) を置き換え。

## 2. 基礎力 (baseScore) — 3軸合算

実装: `Engine.ranking.calcRosterPower(roster)` ([src/management.js:4916+](../src/management.js#L4916))

### 2.1 Force コア戦力
- **対象**: ロスター活動中 (`f.retired === true` を除外、レンタル選手は含む)
- **重み (TOP8)**: `forceWeights = [1.6, 1.4, 1.25, 1.1, 1.0, 0.9, 0.8, 0.7]`
- **OVR重み**: `forceOvrMult = 1.2`
- **人気重み**: `forcePopMult = 0.6`
- **式**: `Σ(top8.OVR × weight) / Σweight × 1.2 + Σ(top8.pop × weight) / Σweight × 0.6`
- 旧 v1.0 から「TOP8への絞り込み」+「人気比重を 0.9→0.6 に下げて Marquee に役割を分担」という変更

### 2.2 Depth 層の厚み
- **対象**: ロスター 11位以下 (OVR順)
- **加点**: `OVR ≥ 70` の選手 × 3pt + `OVR ≥ 75` の選手 × 追加2pt
- **上限**: 30pt
- **意図**: 「主力層8名/控え層厚」という台帳UIと数字を整合させ、頭数の少ない団体は depth で稼げない構造にする

### 2.3 Marquee 看板スター
- **対象**: 人気順 TOP3
- **重み**: `marqueeWeights = [0.6, 0.25, 0.15]`
- **倍率**: `marqueeMult = 0.45`
- **式**: `(top1Pop × 0.6 + top2Pop × 0.25 + top3Pop × 0.15) × 0.45`
- **意図**: 「絶対エース型 (top1突出)」と「分散型」を区別する

設定: [src/data.js](../src/data.js) の `RANKING_CONFIG`

## 3. シーズン実績 (Achievement) — 第4の評価軸

実装: `Engine.achievement.*` ([src/management.js](../src/management.js))

### 3.1 state構造
```js
state.achievementItems = {
  player: [], org_s: [], org_a: [], org_b: []
}
// 各item: { id, type, season, originalPt, age, label, winnerName? }
```

### 3.2 配点 (`ACHIEVEMENT_CONFIG.pt`)

| イベント | 加点 | アイテム ID | 加点タイミング |
|---------|------|-----------|----------------|
| PPV GRAND FINAL 優勝者所属団体 | 15pt | `ppv_${season}` | applyPPVResults サミット結果確定時 |
| 統一トーナメント優勝者所属団体 | 10pt | `unified_${season}` | (※統一トーナメント未実装、配点定義のみ) |
| ジュニアトーナメント優勝者所属団体 | 8pt | `junior_${season}` | offWeek1 awards.generate 直後 |
| 年末MVP受賞者所属団体 | 10pt | `mvp_${season}` | 同上 |
| 新人賞受賞者所属団体 | 5pt | `rookie_${season}` | 同上 |
| ベストマッチ賞受賞試合の所属団体 | 5pt | `bestMatch_${season}` | 同上 |
| メディア厚労賞受賞者所属団体 | 4pt | `media_${season}` | 同上 |
| シーズン最大動員興行開催団体 | 3pt | `bestAttend_${season}` | (※tracker 未実装、保留中) |

**重複ガード**: 同一 `id` のアイテムが既に存在する場合は追加せずスキップ (二重加点防止)。

### 3.3 減衰モデル — 1年満額 → ×0.5/年

```js
function currentPt(item) {
  const decay = ACHIEVEMENT_CONFIG.decayRate;   // 0.5
  const grace = ACHIEVEMENT_CONFIG.graceAge;     // 1
  const age = item.age || 0;
  if (age <= grace) return item.originalPt;
  return item.originalPt * Math.pow(decay, age - grace);
}
```

| age | 説明 | PPV+15pt の現在pt |
|-----|------|-------------------|
| 0 | 当シーズン勝ち取った | 15 |
| 1 | 翌シーズン (まだ満額) | 15 |
| 2 | 2年後 | 7.5 |
| 3 | 3年後 | 3.75 |
| 4 | 4年後 | 1.875 |
| 5 | 5年後 (1pt未満で除去) | — |

「翌年は王者の余韻に満額浸れる、その次の年から色褪せ始める」というナラティブ。

### 3.4 加齢処理 (`Engine.achievement.tickAge`)

シーズン開幕時 (advanceWeek 内のシーズン跨ぎ処理 [src/management.js:12484](../src/management.js#L12484)) で全アイテムの `age` を +1、`currentPt(item) < 1` のアイテムを除去。

### 3.5 集計 (`Engine.achievement.totalPt`)
評価計算時に `state.achievementItems[orgId]` の `currentPt(item)` 合計を整数丸め。

## 4. 年間王者 (Annual Champion) — 最高位の称号

すべての加点が確定した段階で評価最高値の団体を「年間王者」とする。

- **加点なし**: この称号自体が最大の賞であり、評価ポイントには影響しない
- **記録**: `state.seasonHistory[].annualChampion = { orgId, orgName }`
- **表彰式の流れ** (offWeek 1):
  1. PPV GRAND FINAL (PPV加点)
  2. 個別表彰 (年末MVP/ベストマッチ賞/JT等の加点)
  3. シーズン最大動員集計 (将来実装で加点)
  4. **すべての評価が確定**
  5. ランキング1位団体を年間王者として発表 (儀式的演出のみ)

## 5. UI 表示

### 5.1 ランキング画面のメトリクス (rp-metrics, 7個)
[src/ui-render.js:3759+](../src/ui-render.js#L3759)

```
[評価] [基礎力] [平均OVR] [対戦PT] [レガシー] [実績] [人気]
```

### 5.2 ツールチップ

#### 基礎力ツールチップ — 3軸内訳
```
基礎力 — 今そこにある戦力
3軸の合算:
・コア戦力 142  TOP8加重OVR×1.2 ＋ 加重人気×0.6
・層の厚み 12   11位以下のOVR70+/75+を加点（上限30）
・看板スター 28 TOP3人気の突出加重×0.45
引退者は除外。レンタルは戦力に含む。
```

#### 実績ツールチップ — アイテム時系列一覧
```
実績 — シーズンで勝ち取った勲章とその余韻
当シーズン (5年目)
  PPV GRAND FINAL 優勝 (生駒エリカ) +15
  年末MVP受賞 (生駒エリカ)         +10
1年前 (4年目)
  ジュニアトーナメント優勝          +8
2年前 (3年目)
  PPV GRAND FINAL 優勝 (本郷真理子) +7.5
合計 40pt
※ 翌シーズンまで満額、その後毎年半減。1pt未満で消滅。
```

実装: `_buildAchievementTooltip(r, currentSeason)` [src/ui-render.js](../src/ui-render.js)

## 6. 設定値 (`src/data.js`)

```js
const RANKING_CONFIG = {
  // Force
  forceWeights: [1.6, 1.4, 1.25, 1.1, 1.0, 0.9, 0.8, 0.7],
  forceOvrMult: 1.2,
  forcePopMult: 0.6,
  // Depth
  depthOvrThreshold: 70,
  depthOvrBonusThreshold: 75,
  depthPerFighter: 3,
  depthBonusPerFighter: 2,
  depthCap: 30,
  // Marquee
  marqueeWeights: [0.6, 0.25, 0.15],
  marqueeMult: 0.45,
  // Legacy
  legacyCapByTier: { S: 50, A: 50, B: 50, player: 50 },
};

const ACHIEVEMENT_CONFIG = {
  pt: { ppv: 15, unified: 10, junior: 8, mvp: 10, rookie: 5, bestMatch: 5, mediaAward: 4, bestAttend: 3 },
  decayRate: 0.5,
  graceAge: 1,
  removeBelow: 1,
};
```

## 7. 今後のスコープ外項目 (将来 fphase 候補)

- **統一トーナメント本実装**: 配点 (10pt) のみ定義済み、トーナメント自体が未実装
- **シーズン最大動員 tracker**: 全団体の興行ごと動員を追跡する仕組みの新設後に有効化
- **タッグ戦力評価**: specs/tag-match-system-spec-v0.1.md の本実装と連動
- **王座保持の基礎力反映**: 一度議論したが「ベルト保持を静的に評価軸に乗せる」のは違和感があると判断、保留
- **年間王者の表彰式 UI 演出**: 「王者を前に、後ろに2名を配した3人並び」の構図 (ランキング画面の rp-ace 流用) を実装予定。データ側 (annualChampion) は記録済み

## 8. v1.0 からの変更点まとめ

| 項目 | v1.0 | v2.0 |
|------|------|------|
| 基礎力 | TOP10加重 OVR×1.2 + TOP10加重人気×0.9 | Force + Depth + Marquee の3軸合算 |
| 評価 | 基礎力 + レガシー + 対戦PT (3軸) | + シーズン実績 (4軸) |
| 11位以下の戦力 | 完全無視 | Depth で加点 |
| 看板スター突出 | 加重平均で平準化 | Marquee で top1突出を評価 |
| シーズン勲章 | 評価に乗らない | 実績軸に蓄積、減衰しながら数年残る |
| 年間王者称号 | 概念なし | 評価1位を seasonHistory に記録 |
