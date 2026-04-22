# 派閥システム Phase 3d 指示書

> **作成日**: 2026-04-22
> **前提コミット**: `052e365 feat(faction): Phase 3c 相関図 派閥オーバーレイ + 重複所属修復`
> **ブランチ**: `feature/faction-system`
> **参照 spec**: `specs/faction-system-spec-v0.1.md` (v0.6, §9 / §17)
> **引き継ぎ原本**: `plans/faction-phase3d-handoff.md`

完了で派閥システム **v1.0** 完成。

---

## ゴール

派閥が bond/rivalry に**フィードバック**するようにする。加入/離脱判定は bond を読むだけでなく、派閥所属状態が関係性を**自走させる**。Phase 3d 以降、派閥は「飾り」ではなく関係性ネットワークを歪める構造になる。

---

## 判断事項（Keisuke さん承認済み 2026-04-22）

| 項目 | 決定 |
|------|------|
| スコープ | **全 6 効果を一括実装**（コア 3 + 追加 3） |
| 効き幅 | handoff の案（下表）でスタート、auto-sim 後に調整 |
| 既存減衰との関係 | **加算で重ねる**(`processWeeklyDecay` は通常通り走る) |
| 検証指標 | ALL CLEAR + 分布条件 4 項目（下記） |

---

## 実装する 6 効果

| # | 効果 | 対象ペア | 変動量 | タイミング |
|---|------|---------|--------|-----------|
| 1 | 派閥内結束 | 同派閥メンバー同士の bond | **+0.15/週** | 週次 |
| 2 | 抗争越境敵意 | 抗争中派閥メンバー同士の rivalry | **+0.3/週** | 週次 |
| 3 | 寝返り磁力 | 敵対派閥メンバーとの bond 平均 60+ な選手 → 敵リーダー方向 rivalry | **+0.5/週** | 週次 |
| 4 | 権威化の下向き圧 | `authoritativeTag` 派閥のリーダー → メンバー方向 bond（メンバー → リーダーは ±0） | **+0.1/週** | 週次 |
| 5 | 独裁化の亀裂 | `dictatorTag` 派閥メンバー同士の rivalry（水面下の不満） | **+0.2/週** | 週次 |
| 6 | 派閥消滅の余波 | 消滅時、元メンバー全員同士の bond | **-5〜-10**（離散） | `_dissolveFaction` 実行時 |

### 数値感（1 シーズン = 52 週）

- 結束: +7.8 bond/季（自然減衰と相殺して実効 +3〜+5）
- 越境敵意: +15.6 rivalry/季
- 寝返り磁力: +26 rivalry/季
- 権威化圧: +5.2 bond/季（リーダー → メンバーの一方向のみ）
- 独裁亀裂: +10.4 rivalry/季

---

## 実装場所

### 新関数

```js
Engine.factions.processFactionInfluenceOnRelationships(state, rng)
```

**挿入箇所**: `tickWeek` の派閥パイプライン、`processWeeklyMemberChanges` の後、`processWeeklyHostilityDecay` の前。

```js
s = Engine.factions.processWeeklyMemberChanges(s, rng);
s = Engine.factions.processFactionInfluenceOnRelationships(s, rng);  // ← 新規
s = Engine.factions.processWeeklyHostilityDecay(s);
s = Engine.factions.processWeeklyMomentumDecay(s);
s = Engine.factions.checkDissolutionConditions(s, rng);
```

### 関数内部構造

1. 全派閥ループ
   - 効果 1（結束）: 同派閥メンバー全ペアに bond +0.15
   - 効果 4（権威化）: `authoritativeTag` ならリーダー → メンバー一方向 bond +0.1
   - 効果 5（独裁亀裂）: `dictatorTag` なら同派閥メンバー全ペアに rivalry +0.2
2. 抗争ペアループ（`_isHostile(f)` で対になる派閥を抽出）
   - 効果 2（越境敵意）: 敵対派閥メンバー全組み合わせに rivalry +0.3
   - 効果 3（寝返り磁力）: 自派閥選手のうち、敵派閥メンバーとの bond 平均 ≥60 な者を抽出 → その選手から敵リーダー方向 rivalry +0.5

### 消滅時の余波（効果 6）

`_dissolveFaction` 内の既存 memberId ループに、元メンバー全ペアへ bond を `-5〜-10` の範囲でランダム書き込み。RNG 使用、`Engine.relationships` の既存書き込み API（`applyBond` 系）を使う。関数シグネチャは変更しない。

### RNG シード

- 新設: **`0xFA19`**（週次効果用）
- 消滅余波は `_dissolveFaction` に渡ってくる既存 rng を流用

### 触らない場所

- `Engine.relationships.*` の関数シグネチャ
- `Engine.relationships.processWeeklyDecay` の挙動
- `Engine.factions` 既存関数のシグネチャ
- `_isHostile(f)` の判定
- `G.factions` / `G.factionHostility` / `G.factionEventCooldowns` のデータ形状
- `calcMatchAppeal` の factionAppeal 分岐
- Phase 2/3a/3b/3c の UI
- F02 再設計方針

### ヘルパ流用

`_applyBondDirected` / `_applyBondBetweenMembers` が既存にあれば流用。なければ `Engine.relationships` の API を直接叩く。

### 重複所属前提

Phase 3c の `_dedupeFactionMembers` により「1 fighterId は最大 1 派閥」保証済み。ただし念のため派閥メンバー参照時は `getFactionByFighterId` 経由で先着派閥のみを扱う。

---

## 実装手順

### Step 1: 関数骨格
`src/factions.js` に `processFactionInfluenceOnRelationships(state, rng)` 新設。全 6 効果のうち週次 5 つをここに実装。

### Step 2: パイプライン挿入
`src/management.js` tickWeek の派閥ブロックに新関数を挿入（上記順序）。

### Step 3: 消滅余波
`_dissolveFaction` に効果 6 の bond -5〜-10 書き込みを追加。

### Step 4: auto-sim 100×100
```bash
for i in $(seq 1 100); do node test/auto-sim.js 100 $((i * 7919)); done | grep "Result:"
```
ALL CLEAR になるまで、必要なら効き幅を調整。

### Step 5: 分布検証
auto-sim の途中状態を抽出（or Keisuke さん手元セーブ）で以下を確認:

- **派閥内 bond 平均** が非派閥ペア平均より **+5〜+15 高い**
- **抗争中派閥メンバー間の rivalry 平均** が通常ペアより **+10〜+25 高い**
- 両方とも **+40 以上に張り付かない**
- **非派閥選手の bond/rivalry 分布** が Phase 3c と大きく変わらない

想定より歪んだら効き幅 20〜50% 減で再試行。

### Step 6: レビュー
Keisuke さんに auto-sim 結果 + 分布サンプルを提示。

### Step 7: 完了処理
- `specs/faction-system-spec-v0.1.md` v0.7 追記 + §17 に Phase 3d 完了記録
- `docs/game-system-roadmap.md` 更新
- `git commit`（push しない）
- 派閥システム **v1.0 完成宣言**

---

## 事前に読むべきファイル

1. `CLAUDE.md`（数値哲学「安易な加減算 NG」）
2. `specs/faction-system-spec-v0.1.md §9 / §17`
3. `src/factions.js`
   - `processWeeklyMemberChanges`
   - `processWeeklyHostilityDecay`
   - `_isHostile(f)`
   - `_applyBondDirected` / `_applyBondBetweenMembers`(存在すれば)
   - `_dissolveFaction`
   - `getFactionByFighterId`
4. `src/relationships.js`
   - `processWeeklyDecay`
   - bond/rivalry 書き換え API
5. `plans/faction-phase3d-handoff.md`(本指示書の原本)

---

## 完了定義

- [ ] `processFactionInfluenceOnRelationships` 新設・パイプライン組込
- [ ] 効果 1〜5 の週次適用実装
- [ ] 効果 6（消滅余波）を `_dissolveFaction` に追加
- [ ] auto-sim 100×100 ALL CLEAR
- [ ] 分布条件 4 項目を満たす
- [ ] spec v0.7 追記 + §17 Phase 3d 完了記録
- [ ] `docs/game-system-roadmap.md` 更新
- [ ] ローカルコミット
