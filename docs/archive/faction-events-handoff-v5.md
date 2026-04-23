# 派閥イベント演出 引き継ぎ書 v5（2026-04-23 セッション末）

前身: [docs/faction-events-handoff-v4.md](faction-events-handoff-v4.md)
ブランチ: `refactor/battle-engine-replay`
直近コミット: `13afdcf docs(faction-events): v4 引き継ぎ書 — §3-1 F05H 完了、次は §3-2 F02 進展4種の発火ロジック`

---

## 1. 本セッションで完了した作業（v4 §2-1 完了）

### 1-0 applyF02Choice を 3択化
UI モックアップ（`A=煽る / B=仲裁 / C=介入しない`）と従来エンジン 4 択実装の齟齬を解消。
- [src/factions.js](../src/factions.js) `applyF02Choice`
  - 'A' 煽る: hostility +55〜70 両方向 / momentum +10〜20 両派閥 / lockerRoomMorale -3〜-5 / `factionPendingIgnite` を登録（`expireWeek = now + 4`）
  - 'B' 仲裁: 両リーダーに trust -3〜-5 / hostility +30〜45 両方向 / momentum 0 リセット / `f02MediationWatches` に登録（`deadlineWeek = now + 12`）
  - 'C' 介入しない: hostility = avgCrossRivalry を継承、他は無変更
- [test/auto-sim.js](../test/auto-sim.js): 4 択ランダムを 3 択に変更

### 1-1 F02③ resolution（決着）
- [src/factions.js](../src/factions.js)
  - **新設** `rollResolutionAfterMatch(state, matchContext)` — 両派閥リーダー同士の試合で両方向 hostility ≥60 かつドロー以外なら `{state, pendingEvent}` を返す
  - **新設** `applyF02ResolutionResult(state, payload, rng)` — 勝者 momentum +18〜25, 敗者 -22〜-25 / 勝者リーダー trust +6〜8, 敗者 -3〜-5 / 求心力（members→leader bond）勝者 +5〜8, 敗者 -6〜-9 / hostility -40 両方向 / 敗者派閥下位 2〜3 名 trust -4〜-6 / `factionTimeline` に RESOLVED エントリ
- 試合結果フック 4 パス:
  - [App.finalizeShow](../src/app.js) 5039 付近（F08 directive の直後）
  - [Engine.executeShow](../src/management.js) 8149 付近（applyShowContextEffects の直後）
  - [App.finalizeWar](../src/app.js) 8354 付近（対抗戦 applyMatchResult の直後）
  - [Engine.finalizePPV](../src/management.js) 9884 付近（PPV applyMatchResult の直後）
- `handleFactionEvent` に `F02_RESOLUTION` 分岐（`showFactionF02ResolutionModal`）
- auto-sim 応答追加

### 1-2 F02④ endless（無限抗争）
- [src/data.js](../src/data.js) `FACTION_CONFIG` に `f02EndlessHostilityMinAverage: 55` / `f02EndlessStreakWeeks: 52` / `f02EndlessCooldown: 52` を追加
- [src/factions.js](../src/factions.js)
  - **新設** `updateF02EndlessStreaks(state)` — 両方向 hostility 平均 ≥55 で `factionEndlessStreak[pairKey]++`、下回ったら削除
  - **新設** `checkF02EndlessCondition(state)` — 52 週到達 + CD 確認で eligible
  - **新設** `applyF02EndlessResult(state, payload, rng)` — CD マーク / 両派閥メンバーの `mentalCoeff` -0.02（0.85 床）/ `factionTimeline` ENDLESS エントリ / streak リセット
- [pickWeeklyEvent](../src/factions.js) F05H の次（F08 より前）に `F02_ENDLESS` 分岐を挿入
- [src/management.js](../src/management.js) 派閥パイプライン冒頭で `updateF02EndlessStreaks(s)` を呼び出し
- `handleFactionEvent` に `F02_ENDLESS` 分岐（`showFactionF02EndlessModal`）
- auto-sim 応答追加

### 1-3 F02① ignite（発火）
- [src/factions.js](../src/factions.js)
  - **新設** `checkF02IgniteTrigger(state, showCard)` — `factionPendingIgnite` が存在しかつ興行カードに両リーダーのシングル試合が含まれていれば eligible
  - **新設** `applyF02IgniteResult(state, payload, rng)` — hostility +12 両方向 / `factionTimeline` IGNITE / `factionPendingIgnite` を消費
  - **新設** `expireF02PendingIgnite(state)` — `now > expireWeek` なら黙ってクリア
- [App.finalizeShow](../src/app.js) / [Engine.executeShow](../src/management.js): 興行実行直後（validMatches 確定後）に ignite トリガ判定 → `_pendingFactionEvent` へ積む
- [src/management.js](../src/management.js) 派閥パイプライン冒頭で `expireF02PendingIgnite(s)` を呼び出し
- `handleFactionEvent` に `F02_IGNITE` 分岐（`showFactionF02IgniteModal`）
- auto-sim 応答追加

### 1-4 F02② peace（沈静化）
- [src/factions.js](../src/factions.js)
  - **新設** `sweepF02PeaceWatches(state)` — `deadlineWeek` 超過の watch をサイレント削除（management.js パイプライン用）
  - **新設** `checkF02PeaceConditions(state)` — 純粋関数。両方向 hostility が base から -20 以上減衰 + `state.lockerRoomMorale ≥ 55` なら eligible
  - **新設** `applyF02PeaceResult(state, payload, rng)` — hostility -40 両方向 / momentum 0 両派閥 / `inHostility=false` 解除 / 両リーダー間 bond +3 / 対応 watch 削除 / `factionTimeline` PEACE
- [pickWeeklyEvent](../src/factions.js) F02_ENDLESS の次（F08 より前）に `F02_PEACE` 分岐を挿入
- [src/management.js](../src/management.js) 派閥パイプライン冒頭で `sweepF02PeaceWatches(s)` を呼び出し
- `handleFactionEvent` に `F02_PEACE` 分岐（`showFactionF02PeaceModal`）
- auto-sim 応答追加

### 1-5 state 初期化
[src/management.js](../src/management.js) 派閥パイプライン冒頭の「未初期化セーブ対応」ブロックに下記を追加:
```js
if (!s.factionEndlessStreak || typeof s.factionEndlessStreak !== 'object') s = { ...s, factionEndlessStreak: {} };
if (!Array.isArray(s.f02MediationWatches)) s = { ...s, f02MediationWatches: [] };
// factionPendingIgnite は null 許容なので初期化不要
```

### 1-6 検証
- auto-sim 20 シーズン（seed=42）: ALL CLEAR ✓（22.5秒 / 1,060週）
- auto-sim 100 シーズン（seed=7919）: ALL CLEAR ✓（325秒 / 5,300週）
- auto-sim 100 シーズン（seed=101 / seed=202）: バックグラウンド実行中（コミット前に確認）

### 1-7 優先順（pickWeeklyEvent 最新）
**F03 > F05H > F02_ENDLESS > F02_PEACE > F08 > F04 > F05 > F07 > F06 > F02 > F01**

加えて試合フック経由（`_pendingFactionEvent` 直書き）:
- F02_IGNITE（興行開始時、validMatches 確定直後 → resolution 判定より前）
- F02_RESOLUTION（試合結果処理直後）

同一週に複数候補が立つ場合は `!s._pendingFactionEvent` ガードで早い者勝ち。

---

## 2. 残タスク（次セッション予定）

### 2-1 Audio hooks（= v4 §2-2 継続、未着手）
v4 §2-2 の BGM / stinger 登録マップは未実装。
- 登録マップ（v4 §2-2 参照）:
  - F01/F04/F02② 沈静化: `Soft Bids, Sharp Minds.mp3`
  - F02② 対峙(act2)/F02③ 決着/F02④ 無限: `bgm_tension_v1.mp3`（F02④ は ×0.6）
  - F02① 発火: `bgm_tension_v1.mp3 ×1.05` + 冒頭 `f07_gong_v1.mp3` stinger
  - F02② 沈静化: tension 切る + `Soft Bids, Sharp Minds.mp3 ×0.85` フェードイン + 終止 `f06_fin_chime_v1.mp3 ×0.7` stinger
  - F03 / F05H: `Soft Bids ×0.7` + `f06_fin_chime_v1.mp3 ×0.6` stinger

### 2-2 UI モーダル通し確認（手動）
本セッションではエンジン配線のみ。以下はプレイ実機で確認が必要:
- F02① ignite: 興行準備で両リーダーをシングルカードに組む → 実行時モーダル発火？
- F02② peace: 仲裁（B）選択後、hostility が 8〜12 週内に -20 以上下がる条件で発火？（auto-sim では lockerRoomMorale が低めのためヒットしにくい）
- F02③ resolution: 敵対派閥のリーダー戦を直接組んで決着モーダル発火？
- F02④ endless: 52 週の長丁場。実機での検証は困難なので auto-sim と `factionEndlessStreak` のデバッグ表示で代替

### 2-3 仕様書反映（specs/）
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) §9.11 「F02 進展 4 種」を本実装に合わせて追記
  - §9.11.1 F02① ignite：条件 / 影響 / CD（今回は 2 シーズン CD は未実装、`expireWeek` のみ）
  - §9.11.2 F02② peace：条件 / 影響 / deadline 12 週
  - §9.11.3 F02③ resolution：条件 / 影響 / 敗者派閥 F03-D 連動（自然消滅経路）
  - §9.11.4 F02④ endless：条件 / 影響 / CD 52 週

### 2-4 完了時タスク
- [docs/game-system-roadmap.md](game-system-roadmap.md) §3-2 分追記
- [docs/faction-events-handoff.md](faction-events-handoff.md)（v1.1） + [v2](faction-events-handoff-v2.md) + [v3](faction-events-handoff-v3.md) + [v4](faction-events-handoff-v4.md) をアーカイブへ
- ローカルコミット（push なし）

---

## 3. 実装メモ・落とし穴

### 3-1 UI と engine の 3 択整合
v3 までは engine が 4 択（A=どちらでもない/B=factionA側/C=factionB側/D=仲裁）の設計だったが、
UI モック（[faction-events.md](ui/03-screens/faction-events.md) / [faction-events.html mockup](ui/mockups/faction-events.html)）は `A=煽る / B=仲裁 / C=介入しない` の 3 択。
既存の `showFactionF02Modal` はボタン3つ（A/B/C）の実装だったため、engine 側を 3 択に合わせて refactor（v4 handoff にあった「'C'（仲裁）」は 4 択時代の名残でありミス）。

### 3-2 resolution と ignite の同時成立
同一興行でリーダー対決が「pendingIgnite 保持中」に組まれた場合、ignite（試合前）→ match → resolution（試合後）の順で両方発火し得る。
現実装では `!s._pendingFactionEvent` ガードにより同一週内では先に積まれた方（ignite）が優先されるので、同週 resolution はスキップされる。
これは意図通り: ignite の方が物語的に優先されるべき（「抗争の火が公式戦になった」瞬間を見せてから、その試合の結末は次回）。

### 3-3 敗者派閥 F03-D 連動
F02③ resolution で敗者派閥の momentum が大きく下がるため、次週以降の `checkDissolutionConditions` により自然消滅経路に入りやすい。
専用の F03-D モーダルは用意せず、既存の F03 経路でフォールスルーする前提（handoff v4 §3-2-A 想定通り）。

### 3-4 F02④ endless の発火確率
`f02EndlessStreakWeeks: 52` は相当長い。auto-sim 100 シーズンでも発火しないことが十分あり得る。
発火条件を確認したい場合は `FACTION_CONFIG.f02EndlessStreakWeeks` を一時的に 10〜20 に下げて手動確認。

### 3-5 peace の lockerRoomMorale 条件
v4 handoff の記述「両派閥 lockerRoomMorale 55+ 維持」は、state.lockerRoomMorale が派閥ごとに分離していないため「state.lockerRoomMorale ≥ 55」と単純化。
派閥別 morale は仕様未整備（将来の課題）。

### 3-6 UI モーダルは v3 で実装済み
`showFactionF02IgniteModal` / `showFactionF02PeaceModal` / `showFactionF02ResolutionModal` / `showFactionF02EndlessModal` は全て ui-common.js 実装済み（v3）。
今回のエンジン配線でそのまま繋がって動作する。

---

## 4. ファイル変更サマリ
- [src/factions.js](../src/factions.js): +約 250 行（F02 進展 4 種の検出/適用関数群）
- [src/data.js](../src/data.js): +3 行（FACTION_CONFIG.f02Endless* 3 定数）
- [src/management.js](../src/management.js): +約 30 行（state 初期化 2 行 / 派閥パイプライン内 4 関数呼び出し / executeShow に ignite/resolution フック）
- [src/app.js](../src/app.js): +約 60 行（handleFactionEvent に 4 分岐追加 / finalizeShow/finalizeWar に resolution フック / finalizeShow に ignite フック）
- [test/auto-sim.js](../test/auto-sim.js): +約 10 行（autoHandleFactionEvent に 4 分岐追加）
