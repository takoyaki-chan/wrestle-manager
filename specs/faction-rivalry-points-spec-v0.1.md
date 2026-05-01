# 派閥抗争ポイント制 + F09 派閥対抗戦 仕様書 v0.1

> **ステータス**: 🟢 v0.3 確定（Phase B Step1 完了・実装着手可）
> **作成日**: 2026-05-01
> **依存仕様**: `faction-system-spec-v0.1.md` (v0.8 / Phase 1b 完了) / `relationship-system-spec-v2.x` / `personality-archetype-spec-v1.0.md` / `match-flavor-popup-spec-v0.1.md`
> **計画書**: `docs/handoff-faction-confrontation-plan-v0.2.md` §5
> **画面仕様**: `docs/ui/03-screens/factions.md` (Phase A' 確定)
> **🔧マーク = 調整可能パラメータ**

---

## 設計思想

派閥対決を **「単発リーダー戦」から「シリーズ抗争」に拡張**する。

- 日常の試合が累積し、ある閾値で F09 が「大物」として発火し、F09 で動いたポイントで決着する——という時系列の物語構造
- 数値（ポイント）は表示するが、それは「進行度」であって「最適化スコア」ではない
- リーダー幹部級・OVR上位の試合だけがポイント源。末端試合は無効
- 派閥抗争はいつかは決着する。先取100 / 40週強制和解 / 派閥消滅 / 自然沈静化の4経路で必ず終わる

---

## §1 データモデル

### §1.1 GameState.factionRivalryPoints

```
GameState.factionRivalryPoints = {
  "fA-fB": {                       // 派閥IDペアキー（昇順ソート: min-max）
    factionAId: number,            // 数値小さい側
    factionBId: number,            // 数値大きい側
    pointsA: number,               // factionAId 側の累積ポイント
    pointsB: number,               // factionBId 側の累積ポイント
    startedSeason: number,         // 抗争（このペアエントリ）開始
    startedWeek: number,
    lastUpdatedSeason: number,
    lastUpdatedWeek: number,
    naturalCalmStreak: number,     // 両方向 hostility<20 が連続した週数（自然沈静化判定用）
  },
  ...
}
```

### §1.2 ペアキー生成ルール

```js
function _pairKey(fid1, fid2) {
  const a = Math.min(fid1, fid2);
  const b = Math.max(fid1, fid2);
  return `${a}-${b}`;
}
```

派閥消滅時はそのペアの全エントリを削除。

### §1.3 マイグレーション

旧セーブ（factionRivalryPoints 未定義）は `G.factionRivalryPoints = {}` で初期化。既存抗争中ペアに対しては **遡及生成しない**（現在進行中の抗争はゼロから積み始める）。

---

## §2 ポイント計算

### §2.1 試合ベースポイント（rank別）

`pointsByRank` テーブル（`FACTION_CONFIG.pointsByRank`）：

| マッチランク | ベース | 適用条件 |
|---|---|---|
| top | 10pt 🔧 | 両派閥のリーダー同士の試合 |
| second | 6pt 🔧 | 両派閥のOVR2位同士 |
| third | 4pt 🔧 | 両派閥のOVR3位同士 |
| filler | 2pt 🔧 | 4番手以降同士 |

ランク判定は **試合に出ている両派閥メンバーの自派閥内 OVR 順位** で決定。リーダー vs 2番手のような非対称マッチは「低い方」を採用（例: リーダー vs 2番手 → second扱い）。

### §2.2 補正（加算式）

基準倍率 1.0 に対し、以下の補正値を **加算** していく方式。倍率の掛け算ではないため重ね掛けで暴走しない。

| 補正名 | 加算量 | 条件 |
|---|---|---|
| メインイベント | +0.3 🔧 | 興行のメインカード |
| タイトル戦 | +0.2 🔧 | 試合がタイトル戦 |
| 下剋上 | +0.2 🔧 | OVR下位（5以上低い）が勝った場合、勝者側のポイントのみ |
| タッグ試合 | -0.5 🔧 | タッグマッチ |

**最終倍率** = max(0.1, 1.0 + Σ加算量) — 下限0.1（タッグ単独で-0.5でも0.5、極端な負値にはならない）

**計算例**:
- メイン+タイトル戦: 1.0 + 0.3 + 0.2 = ×1.5
- メイン+タイトル+下剋上: 1.0 + 0.3 + 0.2 + 0.2 = ×1.7
- タッグ・メイン: 1.0 + 0.3 - 0.5 = ×0.8

### §2.3 派閥規模倍率（廃止）

v0.1 で導入予定だった「小さい方の派閥サイズによる救済倍率」は **廃止**。
- 理由: 「数値で弱者ボーナス」は「数値は嘘をつかない」原則に反する。F09 発火条件の OVR 差15%以内ガードで戦力差は別途制御済み

### §2.4 ポイント帰属

- 試合の勝者側派閥に基本ポイントを加算
- 引き分けは **ポイントなし**
- 敗者側にはポイントが入らない（差分で物語が動く設計）

### §2.5 計算順序

```
素点 = pointsByRank[matchRank]
補正倍率 = max(0.1, 1.0 + メイン加算 + タイトル加算 + 下剋上加算 + タッグ加算)
ポイント = Math.round(素点 × 補正倍率)
（F09中はさらに ×1.8 を最後に乗算）
```

### §2.6 1興行・週次の上限（プレイヤー連戦詰め込み防止）

- **1興行内の同一派閥ペア試合上限**: 最大2試合 🔧 — カード編成段階でソフト警告（強制ロックはしない）
- **週次ポイントキャップ**: 同一ペアで1週に積めるポイントは **20pt まで** 🔧。超過分は破棄
- **F09 はキャップ無視**（F09 が決着の主舞台なので例外）

---

## §3 F09 派閥対抗戦

### §3.1 発火条件

すべて満たす場合に F09 候補となる：

1. 対立型派閥（`type === 'rivalrous'`）が **2つ存在し、互いに抗争中**
2. **両方向 hostility ≥ 65** 🔧（v0.3 で 70→65 に緩和）
3. 両派閥の **OVR上位5名合計の差が15%以内** 🔧（5名に満たない場合は在籍人数分、最低3名）
4. 両派閥とも **momentum ≥ -20** 🔧
5. F09 クールダウン **52週以上経過** 🔧
6. F09 が現在他派閥ペアで発火中でない（同時発火不可）

### §3.2 後半補正（プレイ年週）

物語終盤にクライマックスを誘うため、発火確率に倍率を掛ける：

| プレイ年週 | 確率倍率 |
|---|---|
| 〜52週 | ×1.1 🔧（v0.3 で 1.0→1.1 に微増） |
| 〜104週 | ×1.3 🔧 |
| 〜156週 | ×1.5 🔧 |
| 156週超 | ×1.5（156週帯維持） |

### §3.3 F09 規模

- **3対3〜5対5** のシングル戦（小さい方の派閥サイズに合わせる、最大5）
- 組み合わせは **OVR順位マッチ**（トップ同士、2番手同士、…）
- メイン〜セミ下の連続3〜5枠を **固定**（プレイヤーは差し替え不可）
- showCard slot に `_f09Locked: true` フラグ
- 興行名が自動で「○○組 vs △△組 対抗戦」に変更
- **1興行集中**（全試合を1夜で消化）

### §3.4 F09 ポイント特例

- 各試合の基本ポイントに **×1.8 倍率** 🔧
- 派閥規模倍率は **適用しない**
- §2.2 の補正（下剋上/タイトル/メイン/タッグ）は通常通り適用
- **興行勝ち越しボーナス**: 勝利数の多い派閥に **+15pt** 🔧

→ F09 一発で **30〜70pt** 動く想定。決着の主戦場。

### §3.5 F09 演出スロット（3区分）

| スロット | タイミング | 内容 |
|---|---|---|
| Opening | 興行冒頭 | 対抗戦オープニング: 全メンバー並列ポートレイト + 両リーダー宣戦セリフ |
| 各試合 | 試合前/試合後 | 簡略版 confrontation / aftermath（軽量、勝敗ポイント表示） |
| Ending | 興行終了 | 獲得ポイント表示 + 勝ち越し派閥スポット + 抗争全体決着なら追加セレモニー |

### §3.6 F09 後の状態

- F09 で動いたポイントを `factionRivalryPoints` に加算後、§4 の決着判定を実行
- F09 cooldown 52週セット
- 抗争未決着の場合、抗争は継続（F09 だけで必ず決着するわけではない）

---

## §4 決着判定（checkRivalryResolution）

`tickWeek` 派閥パイプライン末尾、および `finalizeShow` 直後に実行。優先順位は上から順：

### §4.1 先取100pt（決着・最優先）

`pointsA >= 100` または `pointsB >= 100` 🔧 で達した方が **勝者派閥** 確定。`applyRivalryVictory(state, winnerFid, loserFid, 'POINTS')` 実行。
v0.3 で最優先に変更（ドラマ優先・100pt到達したらたとえ消滅条件にも当たっていても勝利確定）。

### §4.2 派閥消滅

どちらか / 両方の派閥が消滅した場合、ポイントエントリを破棄。**勝者なし**（ただし残った派閥には消滅相手への hostility -40 のみ適用、勝者効果なし）。

### §4.3 40週強制和解（F06 強制発火）

`(現在週 - startedWeek) >= 40` 🔧 で先取100に未到達の場合、F06 強制発火（プレイヤー判断 A 和解 / B 決裂継続 の2択）。
v0.3 で C 棚上げ削除。シンプル2択化。

- A 和解: ポイント破棄、両方向 hostility -30、勝者なし、抗争終了
- B 決裂継続: ポイント維持、抗争続行、+20週猶予（次の強制和解判定は20週後）

### §4.4 自然沈静化

両方向 hostility が **20未満が連続4週続いた** 🔧 場合、抗争は自然消滅。ポイント破棄、勝者なし。
- `naturalCalmStreak` カウンタを毎週インクリメント / リセット

### §4.5 決着優先順位の同週多重判定

同週に複数条件が成立した場合の優先順位（v0.3 確定）：

1. **先取100pt** （§4.1・最優先・ドラマ優先）
2. **派閥消滅** （§4.2）
3. **40週経過** （§4.3）
4. **自然沈静化** （§4.4）

上位条件で決着したら下位はスキップ。

---

## §5 applyRivalryVictory（勝者敗者効果）

### §5.1 勝者派閥

- `momentum += 40` 🔧
- 全メンバー `trust += 5` 🔧
- 全メンバー → リーダー `bond += 5` 🔧
- **派閥抗争 appeal ボーナス 12週間継続加算** 🔧（既存 feudSumCap=30 と排他処理は維持）
- `factionTimeline` に `RESOLVED_BY_POINTS` エントリ追加（reason別: POINTS/CONSOLATION/CALM/F06_RECONCILE）

### §5.2 敗者派閥（v0.3 で緩和調整）

- `momentum -= 25` 🔧（v0.3 で -30→-25 に緩和、衰退帯一気落ち回避）
- リーダー `trust -= 8` 🔧（責任集中）
- 末端メンバー `trust -= 3` 🔧（一律-5から差別化）
- F04（寝返り）発火確率 **×1.5 を 12週間** 🔧（v0.3 で ×2→×1.5）
- F05（亀裂）発火確率 **×1.5 を 12週間** 🔧（v0.3 で ×2→×1.5）
- リーダーが `authoritativeTag` を持っていれば **即時喪失**（権威の失墜）
- → 「再結束 or 崩壊の岐路」（faction-system-spec-v0.1 §10連鎖マトリクスの重要分岐点）

### §5.3 両派閥共通

- 両方向 `hostility -= 40` 🔧
- `factionRivalryPoints[pairKey]` エントリ削除
- F08 / F09 クールダウンリセット（即時再発火防止）

### §5.4 reason別の効果分岐

| reason | 勝者効果 | 敗者効果 | hostility |
|---|---|---|---|
| POINTS（先取100） | フル適用 | フル適用 | -40 |
| F06_RECONCILE（40週A和解） | なし | なし | -30 |
| CALM（自然沈静化） | なし | なし | 据置（既に20未満） |
| CONSOLATION（派閥消滅） | なし | （消滅済み） | -40（残存側のみ） |

---

## §6 表示仕様（factions.md 連携）

- 抗争中ペアの進行度バーで **ポイント数値を表示**（factions.md §特有ルール準拠）
- GOAL=100 を中央軸に表示
- pt差で「いまどっちが優勢か」即時把握可能
- **強制和解までのカウントダウンは表示しない**（決まっていると思われる印象を避ける）
- ただし「抗争○週目」表示は出す（プレイヤーは感覚で40週接近を察せる）
- F09 接近バッジ: 両方向 hostility ≥ 60 で点灯 🔧（F09 発火閾値65 の手前）

---

## §7 FACTION_CONFIG 追加項目

```
// §5 抗争ポイント制（Phase B 追加）
pointsByRank: { top: 10, second: 6, third: 4, filler: 2 },
pointsMainEventBonus: 0.3,    // 加算式
pointsTitleBonus: 0.2,
pointsUpsetBonus: 0.2,
pointsTagBonus: -0.5,
pointsMultMin: 0.1,           // 補正倍率の下限
pointsResolutionThreshold: 100,
pointsForceCloseWeeks: 40,
pointsNaturalCalmWeeks: 4,
pointsNaturalCalmHostilityMax: 20,
pointsPerShowPairMax: 2,      // 1興行で同一ペア最大2試合（ソフト警告）
pointsWeeklyCapPerPair: 20,   // 週内同一ペアキャップ

// §3 F09 派閥対抗戦
f09HostilityMin: 65,        // v0.3 で 70→65
f09OvrTopN: 5,
f09OvrDiffMaxRatio: 0.15,
f09MomentumMin: -20,
f09Cooldown: 52,
f09LateGameMult: { 52: 1.1, 104: 1.3, 156: 1.5 },  // v0.3 で 1年目 1.0→1.1
f09PointsMult: 1.8,
f09SweepBonus: 15,
f09MaxMatches: 5,
f09MinMatches: 3,
f09NearBadgeHostility: 60,  // v0.3 で 65→60（発火閾値の手前）

// §5 勝者敗者効果（v0.3 で敗者ペナルティ緩和）
victoryWinnerMomentum: 40,
victoryLoserMomentum: -25,         // v0.3 で -30→-25
victoryWinnerTrust: 5,
victoryLoserLeaderTrust: -8,       // v0.3 新設・リーダー責任集中
victoryLoserMemberTrust: -3,       // v0.3 新設・末端
victoryBondGainToLeader: 5,
victoryHostilityDecay: -40,
victoryAppealBoostWeeks: 12,
victoryDefectionMult: 1.5,         // v0.3 で 2.0→1.5
victoryDefectionMultWeeks: 12,
// §4.3 F06 強制和解（v0.3 で 2択化）
forceCloseDelayWeeks: 20,          // B 決裂継続選択時の +20週延長
forceCloseHostilityDecayOnA: -30,  // A 和解選択時の hostility 減衰
```

---

## §8 実装ファイル

| ファイル | 変更内容 |
|---|---|
| `src/factions.js` | `_pairKey` / `accrueRivalryPointsFromMatch` / `checkRivalryResolution` / `applyRivalryVictory` / `checkF09Conditions` / `setupF09Show` / `applyF09Result` 追加 |
| `src/management.js` | `tickWeek` 派閥パイプラインに決着判定組込み、`finalizeShow` でポイント蓄積、興行作成パイプラインに F09 強制組込みフック、`factionRivalryPoints` 初期化 |
| `src/data.js` | `FACTION_CONFIG` に §7 の項目追加 |
| `src/ui-render.js` | `_renderDbFactions` を v0.9 構造に書き換え、サブ関数分離 |
| `src/index.html` | `--pop-pink` `--pop-pink-light` トークン追加、`/* === Faction Tab v0.9 === */` CSS 新設 |
| `src/ui-common.js` | `showF09OpeningModal` / `showF09MatchPreModal` / `showF09MatchPostModal` / `showF09EndingModal` 新設 |
| `src/data-faction-dialogue.js` | F09 用セリフテーブル追加 |

---

## §9 やらないこと

- ❌ 末端メンバー同士の試合をポイント対象に含めない（リーダー幹部級・OVR上位のみ）
- ❌ プレイヤーが対戦カードを差し替えることでポイント操作する（F09 は完全ロック）
- ❌ ポイントを試合外で動かすイベント追加（試合結果のみがソース）
- ❌ 派閥規模倍率（廃止・v0.2）
- ❌ 補正の倍率乗算方式（v0.2 で加算式に変更）
- ❌ 強制和解までのカウントダウン UI 表示（決まっている印象を避ける）
- ❌ 同時複数派閥ペアの抗争中表示（画面仕様により1組のみ前提）

---

## §10 確認してほしいポイント（Keisuke レビュー）

### 数値の妥当性

1. **ポイント基本値** top10/second6/third4/filler2 が抗争のテンポとして適切か
2. **補正倍率** 下剋上×1.2 / タイトル×1.5 / メイン×1.5 / タッグ×0.5 の重ね掛け上限を設けないで良いか
3. **派閥規模倍率** 3人×1.5 / 4人×1.25 / 5人以上×1.0 が小派閥救済として効きすぎないか
4. **決着閾値 100pt** F09 を1〜2回挟んで決着する想定で 100 が妥当か
5. **F09 ×1.8 + 勝ち越し+15pt** F09 一発で決着するケースの頻度感

### 決着条件

6. 同週多重判定の優先順位（消滅 > 先取100 > 40週 > 自然沈静化）でOKか
7. F06 強制発火時の B 選択（決裂継続）の +20週延長 / C 選択（棚上げ）の cooldown 16週

### F09 発火条件

8. hostility70 / OVR上位5名差15%以内 / momentum-20以上 / cooldown52週 が「狙えるが乱発しない」バランスか
9. 後半補正カーブ（×1.0 / ×1.3 / ×1.5）

### 勝者敗者効果

10. 勝者 momentum+40 / 敗者 -30 / 敗者 trust-5 / F04・F05 確率×2 が「血みどろの代償」として適切か
11. authoritativeTag 喪失条件

### 表示方針

12. pt 数値表示はOKだが「強制和解 残○週」を出さない方針で良いか

---

**変更履歴**

| 版 | 日付 | 内容 |
|---|---|---|
| v0.1 | 2026-05-01 | 初版起案。handoff v0.2 §5 確定値を仕様化、決着優先順位 / reason別効果分岐 / FACTION_CONFIG 項目を追加 |
| v0.2 | 2026-05-01 | 補正を加算式に変更（メイン+0.3/タイトル+0.2/下剋上+0.2/タッグ-0.5）。派閥規模倍率を廃止。1興行ペア試合上限2 + 週次キャップ20pt を追加 |
| v0.3 | 2026-05-01 | 決着優先順位確定（先取100最優先）。F09 hostility 70→65、後半補正1年目 1.0→1.1。F06 を A/B 2択化（C 削除）。敗者ペナルティ緩和（momentum -30→-25、trust リーダー-8/末端-3、F04・F05 ×2→×1.5）。F09 接近バッジ閾値 65→60。「抗争○週目」表示は出すと明記 |
