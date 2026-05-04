# 団体年代記システム 仕様書 v0.3 (差分)

> **本書の位置づけ**: `specs/chronicle-system-spec-v0.1.md` / `v0.2.md` への差分仕様。v0.1/v0.2 に記述された内容のうち、章境界・エース選定・peer 選定・narrative 生成・記者の目のテンプレートを **再定義** する。
>
> **背景**: 章は元々「時代の切れ目」(非重複) で組まれていたが、Keisuke 指示 (2026-05-04) により「視点の切れ目」「世代の照らし方の切り替え」(重複可能) に再定義された。同じ選手が CH.1 では「世代の希望」、CH.3 では「時代の覇者」、CH.5 では「老いてなお輝く老兵」として描かれる年代記を実現する。
>
> **対象範囲**:
> 1. 章境界アルゴリズムの再定義 (focusSeason ベース、重複許容)
> 2. 駆け出し章 (S1-S2 専用) の常時挿入
> 3. エース選定の再定義 (素地スコア 50% + 章窓内実績スコア 50%)
> 4. 章窓内 era-OVR / era-popularity の参照 (年次スナップショット + 線形補間 fallback)
> 5. peer 4 枠化 (実力副官 / 若手ホープ / 看板スター / ベテラン)
> 6. peer narrative のデータベース駆動バリエーション化
> 7. 記者の目の 3 段構成テンプレ (§A 章での手触り / §B 時代における意味 / §C 次世代への接続)
> 8. 二枚看板章の記者の目を統合
> 9. 章ヘッダ重複インジケータ + タイムライン重複バンド
> 10. 同一選手の章登場上限 (3 章)

---

## §A. 章境界の再定義: focusSeason ベース

### A.1 概念

章は **`(focusSeason, halfWidth)`** で定義する。実シーズン窓は `[focusSeason - halfWidth, focusSeason + halfWidth]` で **重複自由**。

- `focusSeason`: 英雄値が局所最大になるシーズン
- `halfWidth`: **固定 3** (= 7 シーズン窓)
- 章数: **上限なし**

### A.2 アルゴリズム (`Engine.chronicle._segmentChapters`)

```
1. 各 season s で weighted[s] = Σ _heroDensity(c)  for c.peakOVRSeason == s
2. 局所最大検出 (LOCAL_RADIUS=1, NEAR_TIE=0.05):
   各 season s で weighted[s] が前後 1 シーズンと比べて
   weighted[s] + 0.05 以上下回る隣がいなければ focus に採用
3. 各 focus に対して章窓 [max(1, f-3), min(currentSeason, f+3)] を付与
4. 駆け出し章を先頭に追加: focusSeason=2, halfWidth=1, window=[1, 2]
   (currentSeason >= 2 のとき必ず挿入、他章との重複は許容)
```

**重要**: 検出半径と章窓半幅は別パラメータ。v0.3 仕様書で「halfWidth=3 内で局所最大」と書くと隣接ピーク同士が互いを抑え合うため、**検出は半径 1 + near-tie 0.05** で実装する。

### A.3 `_heroDensity` (境界決定用)

`_heroDensity(fighter) = _baseScore(fighter)` (lifetime peakOVR / peakPop ベース、章コンテキスト無し)。

### A.4 駆け出し章 (`_fledgling=true`)

- 必ず先頭に挿入される (currentSeason ≥ 2)
- 候補絞り込みでは **debut (careerSeasonsStart)** ベースを使う (prime ベースだと rookie の primeWindow が後年に張り出して候補ゼロになる)
- 駆け出し章の ace は通常 `aceAsRising` で立つ
- 序章 (`G.prologue`) と同じ S1-S2 領域に重なるが、序章は旗揚げ専用レイヤー / 駆け出し章はその時点ロスター視点で独立

---

## §B. era-OVR / era-popularity

### B.1 動機

旧 `_heroScore` は `peakOVR / peakPop` (lifetime peak) を使うため、CH.1 駆け出し章で「将来 OVR 95 まで成長する若手」が ace 候補で peakOVR 95 として点数化されてしまい、その時代の手触りに合わなかった。

### B.2 年次スナップショット

`Engine.career.recordSeasonSnapshot(fighter, season)` を毎シーズンの `offWeek === 1` (シーズンレポート週) で全 roster に対して呼ぶ。

```js
careerRecord.seasonalSnapshots: [{ season, ovr, popularity }, ...]
```

同 season 既存ならスキップ (idempotent)。`archiveFighter` も snapshots を保持する。

### B.3 era-OVR / era-pop 取得 (`Engine.chronicle._estimatedOVRAt` / `_estimatedPopularityAt`)

優先順位:
1. `seasonalSnapshots` に focus season 完全一致 → その値
2. snapshots に focus 未満で最も近い season → その値
3. (fallback) デビュー (rookie OVR ≈ peakOVR-22, 下限 60) → peakOVRSeason (= peakOVR) の線形補間

### B.4 `_baseScore(f, chapter)` への波及

chapter コンテキスト有り → era-OVR と era-pop を使う / chapter 無し → lifetime peak を使う。

---

## §C. エース選定の再定義 (`_aceScore`)

### C.1 構造

```
ace_score = baseScore × 0.5 + achievementScore × 0.5
```

両者を 0〜1 に正規化してから加重合成。

### C.2 baseScore

`_baseScore(f, chapter)` (§B.4 参照): era-OVR ÷ 110 × 0.6 + era-pop ÷ 100 × 0.4 を 0〜1 clamp。

### C.3 achievementScore (章窓内実績)

`_achievementRaw(f, chapter, state)` で章窓 `[seasonStart, seasonEnd]` 内の history を走査。重み定数 `ACE_ACH_WEIGHTS`:

| 種別 | 重み |
|---|---|
| titleWin | 0.05 |
| titleDefense (`_countChapterDefensesForAce` 値) | 0.06 |
| ppvMainEvent | 0.15 |
| domeMain | 0.12 |
| war (won=true) | 0.07 |
| war (won=false) | 0.02 |
| challenge_request_match (defender 撃退 = isRequester=false かつ won=true) | 0.06 |
| challenge_request_match (自団体発信 = isRequester=true) | 0.05 |
| awardMVP | 0.12 |
| awardBestMatch | 0.04 |
| juniorTournament (result=='champion') | 0.08 |
| 章末王者ボーナス (seasonEnd 時点で在位中ベルト ≥ 1) | +0.10 |

`achievementScore = clamp01(raw / 1.5)` で 0〜1 化 (1.5 はフルエース基準値)。

### C.4 二枚看板閾値

差 `≤ 0.20` かつ prime overlap `≥ 3` シーズン。素地スコア時代の `≤ 0.04` から緩和。

---

## §D. CareerStage 分類

`Engine.chronicle._classifyCareerStage(fighter, chapter)`:

| stage | 条件 |
|---|---|
| rising | `focus < primeStart` |
| prime | `primeStart ≤ focus ≤ primeEnd` |
| veteran | `focus > primeEnd` |
| aceAsRising | prime 候補が皆無の章で rising 最上位を ace 昇格させた特例 |

`cameo` は v0.3 では使わない (Phase B 以降で必要になれば追加)。

---

## §E. peer 4 枠化

### E.1 枠定義

| 枠名 | role 値 | 人数 | 選び方 |
|---|---|---|---|
| 実力副官 | `'strength'` | 1〜2 | `_stage === 'prime'`、`_baseScore(f, chapter)` 降順 |
| 若手ホープ | `'rising'` | 1〜2 (駆け出し章は最大 3) | `_stage === 'rising'`、才能スコア = `peakOVR×0.5 + currentOVR(focus)×0.3 + peakPop×0.2` 降順 |
| 看板スター | `'idol'` | 0〜1 | `peakPopularity ≥ 80` の最高人気、stage 不問 |
| ベテラン | `'veteran'` | 0〜1 | `_stage === 'veteran'`、`(titleReigns × 0.4) + _achievementRaw` 降順 |

合計 3〜5 名目安。3 未満なら残候補から `_baseScore` 順で補填 (role は stage に応じて派生)。

### E.2 同一選手 3 章上限

`buildChapters` 末尾の post-process で、同一選手が 4 章以上に登場する場合は `aceScore` 上位 3 章のみ keep。切り捨ては **peer 枠のみ** に適用 (ace 枠は不変、安全側)。

---

## §F. peer narrative のバリエーション化

`Engine.chronicle._buildPeerNarrative(peer, chapter, aces, peers, state)` は以下 4 ブロックを seed 抽選で組み立てる:

| ブロック | 素材データ |
|---|---|
| **opening** | `stage` × `ovrTier` (top/high/mid) × debut の 7 系統 × 各 3〜5 本のプール |
| **achLine** | 章窓内 戴冠/防衛/MVP/ベストマッチ/JT/PPVメイン/対外戦/王座陥落 を束ねた 3 言い回し |
| **charLine** | `traits` (華 / ファンサービス / 人望 / ムードメーカー / 熱血 / 名勝負製造機 / ガラスのハート) + `personality` (6 種) + `styleAxis` (5 種) + `popTier` (4 段) の固有フレーズ |
| **relLine** | `state.h2h` の 3 軸 (章窓内対戦数 / 累積 bond / 累積 rivalry) で「印象に残った相手 / 絆の相手 / 因縁の相手」を抽出し、上位を文脈に挿入 |

抽選は `Engine.rng.derive(rngSeed, chapter.number, peer.id, salt)` で派生 (salt は `0xCE01〜0xCE04`、各ブロック独立)。**同一選手は不変・別選手は trait/personality/OVR帯/topRival の組み合わせで変動**。

---

## §G. 記者の目の 3 段構成 (`QUOTE_TEMPLATES_V2`)

### G.1 構造

各カテゴリ (peakDefender / defender / champion / popStar / generationShift / struggle / craftsman / uncrowned) に `sectionA` / `sectionB` / `sectionC` の 3 配列。各 2〜4 本。

| 段 | 役割 | 出現条件 |
|---|---|---|
| §A 章での手触り | 章窓内固有戦績 (defenses / titleReigns / topRival / topVenue / war 等) | 必須 |
| §B 時代における意味 | 章 axis / org / eraTag / peakOVR / peakPop | 80% 確率で挿入 |
| §C 次世代への接続 | risingPeerSurname / nextChapterTopSurname / successorStyle | `chapter.status !== 'in_progress'` のときのみ (= 最新章では出さない) |

### G.2 拡張スロット (`_buildQuoteContext`)

| スロット | 集計 |
|---|---|
| `topRivalSurname` / `topRivalClause` | 章窓内 h2h.history で最も多く対戦した相手 |
| `topVenue` / `topVenueClause` | 章窓内に最も多く立ったベニュー (history.venue) |
| `warOpponentOrg` / `warRecord` / `warClause` | 章窓内対外戦の主要相手と勝敗 |
| `risingPeerSurname` / `risingClause` | 同章 rising peer の最高 peakOVR |
| `nextChapterTopSurname` / `successorStyle` | 次章の ace[0] と `_topAxis` |
| `eraTag` | 章 `_topAxis` + 戴冠数 + 防衛数 → 「黄金期 / 端境期 / xx の時代」 |

### G.3 二枚看板章の統合 quote (`buildDualAceQuote`)

`isDual` (chapter.aces.length ≥ 2) のとき、各 ace の個別 quote を捨てて **1 つの統合 quote** を返す。`QUOTE_TEMPLATES_DUAL` (sectionA/B/C 各 3 本) に `{surname1}` / `{surname2}` を含む dual 専用テンプレを用意。

UI 側は dual カード内の `chron-dual-quote` を削除し、`chron-dual-shared-quote` として 2 カードの下に 1 つだけ配置。

---

## §H. UI 章ヘッダ + タイムライン

### H.1 タイムライン重複バンド

各章を `seasonStart`→`seasonEnd` の半透明バンド (`chron-timeline-band`) で描画。重なる章は重ね描きで色濃く見える。tick は `focusSeason` 上に配置。current は赤系、`_fledgling` は緑系で色分け。

### H.2 章ヘッダの重複インジケータ

- `chron-focus-tag`: 「焦点: SEASON {focusSeason}」を期間表示の隣に併記
- `chron-overlap-row`: 前後章との重複範囲を「← 第N章と SEASON X–Y で重なる」「第M章と SEASON X–Y で重なる →」を破線枠で表示

### H.3 peer 役割タグ

- `★ アイドル選手` / `▲ 若手ホープ` / `◇ ベテラン` / `◆ 実力副官`
- それぞれ枠線色で視覚的に区別

### H.4 メタタイル整列

ace meta (PEAK OVR / PEAK POP / STYLE / ERA RUN / TITLES) は `grid-template-columns: repeat(5, 1fr)` で 5 等分。`align-items: end` + 各タイル `min-height: 44px` で val のベースラインを揃える。dual カードは `align-items: stretch` で左右同高、`dual-info` 内で `meta-row` に `margin-top: auto` を効かせて 2 カードの meta-row が同じ縦位置で揃う。

### H.5 二列レイアウトのバランス

- 左列: 主な出来事 + 外敵 + 通算
- 右列: 同期 (peer narrative 主役)

---

## §I. キャッシュ互換

`buildChapters` の冒頭で `focusSeason` フィールドを持たないキャッシュ (= v0.1/v0.2 形式) を検知し、自動でリビルドする。

---

## §J. 実装状況

Phase A〜D 全実装完了 (2026-05-04)。auto-sim 100 シーズン × seed 42 で violations 0 / errors 0 / weeks 5300 ALL CLEAR ✓。
