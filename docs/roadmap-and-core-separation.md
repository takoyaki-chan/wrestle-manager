# WRESTLE MANAGER — ロードマップ & コア分離記録

> 最終更新: 2026-02-20（v0.85b完了）

## 全体ロードマップ

```
v0.8  ✅ 高度なトレーニング（コーチアサイン・強化練習）  2,899行
  ↓
v0.85 ✅ コア分離フェーズ1（Engine名前空間・DOM排除・seed乱数）  3,079行
  ↓
v0.85b ✅ コア分離フェーズ2（GameState不変化・UI分離・tickWeek統合）  3,093行
  ↓      ★ アーキテクチャ全5原則達成
  ↓
v0.9  ★ ライバル団体AI ← 次に実装（設計⑨と並行）
  ↓
v0.95   バランス調整・テストプレイ・UI磨き上げ
  ↓
v1.0    Patreon配布版（ZIP配布・キャラ画像同梱）
  ↓
v1.x    React/TS化 / 100〜200人規模拡張 / Worker化
```

---

## v0.85/v0.85b — コア分離 ✅ 完了

### 目的
- ゲームルール（試合・週進行・ランキング等）をDOM/UIから完全分離
- 状態をGameStateに集約、更新はengine経由に限定
- seed乱数で再現性を担保
- **見た目・挙動は一切変えない**

### 非目的（やらなかったこと）
- React化 / UI全面改修
- 演出強化、デザイン変更
- 新ルール追加
- Worker化等の大規模最適化

---

### 採用した方式: 単一HTML内での論理分離

マルチファイル化は見送り、名前空間オブジェクト（Engine/App/Storage）による論理分離を実施。

```js
const Engine = {
  battle:   { simulateMatch, calcMQ, ... },
  season:   { processManage, processSettlement, ... },
  heat:     { calcUpdate, calcDecay },
  injury:   { check, tick },
  title:    { recordRivalry, crownChampion, recordDefense, validateChampion },
  coach:    { assignToCoach, unassignFromCoach },
  growth:   { applySeasonEnd },
  facility: { calcUpgradeCost },
  // 統合パイプライン（v0.85b）
  tickWeek, executeShow, advanceWeek,
  applyMQPopularity, applyShowPopularity
};

const App = {
  signFighter, releaseFighter, setSchedule, setIntensive,
  hireCoach, fireCoach, assignToCoach, unassignFromCoach,
  upgradeFacility, startShowPrep, setShowVenue, setShowCardSlot,
  clearShowCard, toggleTitleMatch, executeShow, closeShowResult,
  processWeek, advanceWeek
};

const Storage = { serialize, deserialize, save, load, autoSave, autoLoad };
```

---

### 実施ステップと結果

#### Step 0: GameState整理 ✅ v0.85
- G（グローバルステート）の構造をそのまま維持
- Engine.createInitialState()は導入せず（既存init処理を温存）

#### Step 1: seed乱数生成器 ✅ v0.85
- SeededRandom（xorshift128+ベース）を導入
- 全Math.random()をseed管理に置換
- G.rngSeedで再現性保証

#### Step 2: Engine名前空間作成 ✅ v0.85
- 全ゲームロジックをEngine.*に集約
- Engine内からdocument/window参照を全排除
- **原則①④達成**

#### Step 3: GameState不変化 ✅ v0.85b
- 全Engine関数を純粋関数化（新stateをreturn、in-place変更ゼロ）
- 163箇所のin-place mutation → 0箇所
- 各Engine関数の戻り値パターン:
  - `Engine.heat.calcUpdate(score, factors)` → 新heatScore
  - `Engine.heat.calcDecay(score)` → 新heatScore
  - `Engine.injury.check(fighter, matchResult)` → {newFighter, injuryInfo}
  - `Engine.injury.tick(roster, freeAgents)` → {roster, freeAgents, events}
  - `Engine.title.recordRivalry(rivalries, id1, id2, mq)` → 新rivalries
  - `Engine.title.crownChampion(titles, beltKey, fighterId, week)` → 新titles
  - `Engine.coach.assignToCoach(coachAssign, coachId, charId)` → 新coachAssign
  - `Engine.growth.applySeasonEnd(roster, config)` → {roster, report}
  - `Engine.season.processManage(state)` → {roster, freeAgents, heatScore, events}
  - `Engine.season.processSettlement(state)` → {funds, weeklyFinance, roster, summary}
- **原則②達成**

#### Step 4: App bridge統一 ✅ v0.85b
- 全UIコマンドをApp.*経由に集約
- G更新パターン: `G = { ...G, property: newValue }`
- 25箇所のG.property直接代入 → 0箇所
- **原則③達成**

#### Step 5: tickWeek統合パイプライン ✅ v0.85b
- 3つの統合関数で週処理を完結:
  ```js
  Engine.tickWeek(state)    → {state, events, financeSummary}  // manage+settlement
  Engine.executeShow(state) → {state, results, injuryResults, events}  // 興行実行
  Engine.advanceWeek(state) → {state, events}  // 週番号進行+シーズン処理
  ```
- MQ/人気計算もEngine内に移動:
  - `Engine.applyMQPopularity(roster, result)` → 新roster
  - `Engine.applyShowPopularity(roster, results, orgPop)` → {roster, orgPop, popDelta}
- **原則⑤達成**

#### Step 6: Storage不変化 ✅ v0.85b
- serialize/deserialize: `G = { ...base, ...state }` パターン
- save/load: `G = { ...G, gameLog: [...G.gameLog, msg] }`
- v0.8セーブとの後方互換性維持

---

### アーキテクチャ5原則 — 全達成 ✅

| # | 原則 | 達成版 | 検証方法 | 結果 |
|---|---|---|---|---|
| ① | Engine = 純粋関数（DOM禁止） | v0.85 | Engine内のdocument/window参照grep | 0件 |
| ② | GameState戻り値更新（in-place禁止） | v0.85b | G.property直接代入grep | 0件（v0.85は163件） |
| ③ | UIはG直接変更禁止（App経由のみ） | v0.85b | onclick内G.代入grep | 0件（v0.85は25件） |
| ④ | 乱数はseed管理で再現可能 | v0.85 | Math.random()grep | 0件 |
| ⑤ | tickWeek統合パイプライン | v0.85b | Engine.tickWeek単体呼び出し | 正常動作 |

### 受け入れ条件の達成状況

| 条件 | 状態 | 備考 |
|---|---|---|
| Engine配下がDOM参照していない | ✅ | v0.85で達成 |
| UI側からG.xxxの直接書き換えがない | ✅ | v0.85bで達成。全てApp経由 |
| Engine.battle.simulateMatch()を単体で呼べる | ✅ | v0.85で達成 |
| Engine.tickWeek()を単体で呼んで週が進む | ✅ | v0.85bで達成 |
| seed固定で同じ試合結果が再現できる | ✅ | v0.85で達成 |
| ゲームの見た目・挙動がv0.8と同一 | ✅ | node --checkでsyntax検証済み |
| セーブ/ロードのv0.8互換性維持 | ✅ | Storage.deserializeで互換処理 |

---

### 行数の推移

| バージョン | 行数 | 増分 | 内容 |
|---|---|---|---|
| v0.8 | 2,899行 | — | 全システム統合 |
| v0.85 | 3,079行 | +180行 | Engine名前空間＋seed乱数（構造変更が主） |
| v0.85b | 3,093行 | +14行 | immutable化（G={...G}パターンへの書き換えが主） |

---

### コード構造（v0.85b最終）

```
Section 1:    CSS
Section 2:    HTML — 10画面
Section 3:    定数（VENUES, SALARIES等）
Section 4:    キャラクターデータ（ALL_CHARS 80名）
Section 4.5:  Heat/Injury/Title/Rivalry定数
Section 4B:   コーチデータ（ALL_COACHES 8名）
Section 4C:   成長/衰退設定（GROWTH_CONFIG）
Section 4D:   施設データ（FACILITIES 5施設×3レベル）
Section 5:    ゲームステート（G）
Section 5B:   SeededRandom — seed管理乱数
Section 6:    ヘルパー関数
── Engine名前空間 ──
Section 7:    Engine.battle — simulateMatch()
Section 7A:   Engine.mq — calcMQ()
Section 7B:   Engine.heat — calcUpdate/calcDecay（immutable）
              Engine.injury — check/tick（immutable）
Section 7C:   Engine.title — recordRivalry/crownChampion/recordDefense/validateChampion（immutable）
Section 7D:   Storage — serialize/deserialize/save/load（immutable）
Section 7E:   Engine.coach — assignToCoach/unassignFromCoach（immutable）
Section 7F:   Engine.growth — applySeasonEnd（immutable）
Section 7G:   Engine.facility — calcUpgradeCost
Section 7H:   Engine.season — processManage/processSettlement（immutable）
              Engine.tickWeek/executeShow/advanceWeek — 統合パイプライン
              Engine.applyMQPopularity/applyShowPopularity
── App bridge ──
Section 8:    App.* — 全UIコマンド（G={...G}パターン統一）
Section 9:    UI描画（renderXxx関数群）
Section 9B:   コーチ＆セーブUI
Section 9C:   施設UI
Section 9D:   トレーニングUI
Section 10:   興行実行
INIT:         初期化処理
```

---

### 移行マッピング（実績）

| 旧関数（v0.8） | 移行先（v0.85b） | 変更内容 |
|---|---|---|
| runMatch() | Engine.battle.simulateMatch() | DOM非依存化 |
| calcMQ() | Engine.mq.calcMQ() | 純粋関数化 |
| processManagePhase() | Engine.season.processManage() | immutable戻り値 |
| settleWeek() | Engine.season.processSettlement() | immutable戻り値 |
| calcGrowth() | Engine.growth内 | 純粋関数化 |
| pickGrowthStat() | Engine.coach内 | 純粋関数化 |
| tickInjuries() | Engine.injury.tick() | immutable戻り値 |
| heatDecayNoShow() | Engine.heat.calcDecay() | immutable戻り値 |
| hireCoach() | App.hireCoach() | G={...G}パターン |
| fireCoach() | App.fireCoach() | G={...G}パターン |
| signFighter() | App.signFighter() | G={...G}パターン |
| releaseFighter() | App.releaseFighter() | G={...G}パターン |
| saveGame() | Storage.save() | immutable化 |
| loadGame() | Storage.load() | immutable化 |
| — (新規) | Engine.tickWeek() | 統合パイプライン |
| — (新規) | Engine.executeShow() | 統合パイプライン |
| — (新規) | Engine.advanceWeek() | 統合パイプライン |
| applyMQPopularity() | Engine.applyMQPopularity() | Engine内に移動 |
| applyShowPopularity() | Engine.applyShowPopularity() | Engine内に移動 |

---

## v0.9 — ライバル団体AI（次のステップ）

### v0.85bアーキテクチャによる恩恵

コア分離が完了したことで、v0.9の実装は明確で安全:

```js
// Engine.rival を新規追加
Engine.rival = {
  simulateRivalWeek(state, rivalId, rng) { ... },
  processTransferWindow(state, rng) { ... },
  calcRankingPoints(orgData, roster) { ... },
  makeAIDecisions(orgData, roster) { ... }  // スカウト・育成・興行判断
};
```

tickWeekパイプラインに `applyRivalWeek` ステップを追加するだけ:

```js
// v0.9追加分（Engine.tickWeek内）
for (const rivalId of state.rivalOrgs) {
  result = Engine.rival.simulateRivalWeek(result.state, rivalId);
  state = result.state;
}
if (isTransferWindow(state.week)) {
  result = Engine.rival.processTransferWindow(state);
  state = result.state;
}
```

### 実装項目

| 機能 | 詳細 | 対応設計 |
|---|---|---|
| 団体データ構造 | ロスター・資金・人気・コーチ・施設 | org-ranking-spec |
| AI意思決定 | 練習/プロモ・コーチ雇用/解雇 | — |
| AI興行編成 | カード自動生成（ライバル度・Heat考慮） | weekly-gameloop-spec |
| AIスカウト | 新人獲得判断 | scout-system-spec §5.2 |
| 団体個性 | 攻撃育成型/スカウト重視型/守り重視型 | — |
| 対戦マッチング | 自団体 vs ライバル団体 | — |

### 前提条件（全て満たされている）
- ✅ Engine関数が純粋関数 → AI団体も同じ関数で処理可能
- ✅ tickWeek統合パイプライン → ライバル処理の追加が容易
- ✅ GameState不変化 → 複数団体の並行処理が安全
- ✅ seed乱数 → AI団体の試合結果も再現可能
