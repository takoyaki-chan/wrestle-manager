# 派閥イベント演出 引き継ぎ書 v6（2026-04-23 セッション末）

前身: [docs/faction-events-handoff-v5.md](faction-events-handoff-v5.md)
ブランチ: `refactor/battle-engine-replay`
直近コミット: `faccc32 feat(faction-events): F02 進展4種 実装完了 (ignite/peace/resolution/endless)`

---

## 0. 参照すべきファイル（必読）

次セッションで作業に入る前に必ず開く:

### 0-1 UI モックアップと画面仕様書
- **HTML モックアップ**: [docs/ui/mockups/faction-events.html](ui/mockups/faction-events.html)
  - 全 F01〜F08 + F02 進展 4 種 + F05H のモーダル UI をブラウザで実機確認できる叩き台
  - セリフ・選択肢文言・レイアウトの **唯一の正**。engine 側の文言がここと齟齬したら engine を直す（v4→v5 の 4択→3択 refactor はこの原則で発生）
- **UI 画面仕様書**: [docs/ui/03-screens/faction-events.md](ui/03-screens/faction-events.md)
  - モーダル挙動・シーン遷移・CSS トークン・BGM/stinger 登録マップの根拠文書
  - Audio hooks 実装時は §「演出レイヤー」/ §「BGM マッピング」を必ず参照

### 0-2 仕様書
- **派閥システム spec**: [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md)
  - §9.1〜§9.8: F01〜F08 発火条件と効果
  - §9.11: **F02 進展 4 種（v5 で追記）** ignite / peace / resolution / endless
  - §12: RNG シード一覧（0xFA__ 系）
  - §17: Phase 実装状況
- **UI 基礎**: [docs/ui/01-foundations.md](ui/01-foundations.md) — CSS トークン、カテゴリ(Office/Stage/Ceremony)
- **UI レイアウト**: [docs/ui/02-layouts.md](ui/02-layouts.md) — シーケンス S1〜S7

### 0-3 エンジン実装
- **派閥コア**: [src/factions.js](../src/factions.js) — `Engine.factions` namespace、~1,300行
- **セリフデータ**: [src/data-faction-dialogue.js](../src/data-faction-dialogue.js) — 性格6×アーキタイプ6 マトリクス
- **モーダル UI**: [src/ui-common.js](../src/ui-common.js) `showFactionF0XModal` 群
- **ディスパッチャ**: [src/app.js](../src/app.js) `handleFactionEvent`
- **試合結果フック**: [src/app.js](../src/app.js) `finalizeShow` / `finalizeWar` + [src/management.js](../src/management.js) `executeShow` / `finalizePPV`
- **週次パイプライン**: [src/management.js](../src/management.js) `tickWeek` 内の派閥ブロック（`pickWeeklyEvent` 周辺）

### 0-4 過去の引き継ぎ書（アーカイブ）
- v1.1: [docs/archive/faction-events-handoff.md](archive/faction-events-handoff.md) — 初期計画
- v2: [docs/archive/faction-events-handoff-v2.md](archive/faction-events-handoff-v2.md) — F01/F02/F03 Phase 3a 完了時点
- v3: [docs/archive/faction-events-handoff-v3.md](archive/faction-events-handoff-v3.md) — F04〜F08 + UI モーダル実装時点
- v4: [docs/archive/faction-events-handoff-v4.md](archive/faction-events-handoff-v4.md) — F05H 活動休止 完了 + §3-2/§2-2 計画
- v5: [docs/faction-events-handoff-v5.md](faction-events-handoff-v5.md) — F02 進展 4 種 完了（前セッション）

---

## 1. 前セッションで完了した作業（v5 参照）

詳細は v5 に譲る。要約:
- F02 進展 4 種（ignite / peace / resolution / endless）エンジン側全配線完了
- applyF02Choice を 3 択（A=煽る / B=仲裁 / C=介入しない）に refactor
- specs §9.11 追記、roadmap §3-2 完了エントリ追加
- auto-sim 4 シード × 各 5,300 週 ALL CLEAR
- コミット `faccc32`（push なし）

---

## 2. 残タスク（次セッション本体）

### 2-1 Audio hooks 実装（v4 §2-2 継続、本命タスク）

**目的**: F01〜F08 + F02 進展 4 種 + F05H の各モーダルで BGM / stinger を鳴らす。

**使用アセット**（`bgm/` 配下に配置済み、確認済み）:
| ファイル | 用途 |
|---------|------|
| `bgm/Soft Bids, Sharp Minds.mp3` | 落ち着きトーンの基調 BGM |
| `bgm/bgm_tension_v1.mp3` | 緊張トーンの基調 BGM |
| `bgm/f07_gong_v1.mp3` | F02① 発火の冒頭ゴング stinger |
| `bgm/f06_fin_chime_v1.mp3` | F02② 沈静化・F03・F05H の終止チャイム stinger |

**登録マップ**（v4 §2-2 原文 + v5 確認値）:
- **F01 / F04 / F02② 沈静化（peace）**: `Soft Bids, Sharp Minds.mp3`（デフォ vol）
- **F02② 対峙 act2 / F02③ 決着（resolution）/ F02④ 無限（endless）**: `bgm_tension_v1.mp3`（F02④ のみ `× 0.6`）
- **F02① 発火（ignite）**: `bgm_tension_v1.mp3 × 1.05` + モーダル開幕で `f07_gong_v1.mp3` stinger を1発
- **F02② 沈静化（peace）**: tension を fadeOut → `Soft Bids, Sharp Minds.mp3 × 0.85` フェードイン + 終止で `f06_fin_chime_v1.mp3 × 0.7` stinger
- **F03 / F05H（活動休止）**: `Soft Bids × 0.7` + 終止で `f06_fin_chime_v1.mp3 × 0.6` stinger

**実装方針（推奨）**:
1. [src/app.js](../src/app.js) Audio マップに `faction_tension` / `faction_soft` / `faction_gong` / `faction_chime` エイリアスを追加（既存 `tension` エントリ参照 L28 付近）。volume は vol プロパティで制御。
2. `handleFactionEvent` の各イベント分岐冒頭で BGM 切替 + stinger 再生。
3. モーダル閉じる際（結果モーダルの「続ける」クリック）に BGM fadeOut（既存 `Audio.fadeOut(durationMs)` L909 利用）。
4. 進展型（ignite/peace/resolution/endless）は F02 と同じ family にくくるか要判断 — v4 マップ準拠なら別々。
5. F05H は既に実装済み（v4 §3-1 完了）なのでそこの Audio フック確認→欠けていれば追加。

**検証**:
- 手動: モーダルを開いて BGM が鳴るか、stinger が重ならないか、結果画面で正しく fadeOut するか
- auto-sim はスキップ可（試合数値に無影響、フック v6 ルール準拠）

### 2-2 UI モーダル通し確認（手動、v5 §2-2 継続）

v5 で engine 配線まで完了したが、実機で以下が発火することを確認していない:
- **F02① ignite**: 興行準備で両リーダーをシングルカードに組む → 実行時モーダル発火？
- **F02② peace**: 仲裁（B）選択後、hostility が 8〜12 週内に -20 以上下がる + lockerRoomMorale ≥ 55 で発火？（auto-sim では locker morale が低めのためヒットしにくいので実機確認必須）
- **F02③ resolution**: 敵対派閥リーダー戦を直接組んで決着モーダル発火？
- **F02④ endless**: 52 週は長い。実機検証は困難なので `FACTION_CONFIG.f02EndlessStreakWeeks` を一時 10〜20 に下げて確認 or auto-sim + factionEndlessStreak デバッグ表示で代替

手動確認チェックリスト:
- [ ] モーダルが正しい UI モックアップ（[faction-events.html](ui/mockups/faction-events.html)）通りに表示されるか
- [ ] セリフが性格×アーキタイプで変わるか
- [ ] 結果画面で数値変動が narrative と一致するか
- [ ] BGM/stinger が正しく鳴るか（2-1 完了後）

### 2-3 specs/ への F05H 反映（v4 の未消化）

v4 で F05H（活動休止）を実装したが、specs/ にはまだ反映されていない。次セッション序盤または Audio hooks と並行で:
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) に §9.9（または §9.11 の前に §9.9）として「F05H 活動休止」セクション追加
- 発火条件（派閥リーダーが長期怪我/調整で 8 週以上ロスター外）、効果、CD を記述
- 実装参照: [src/factions.js](../src/factions.js) `checkF05HConditions` / `applyF05HResult`

---

## 3. 実装上の落とし穴（v5 からの継承）

### 3-1 UI と engine の 3 択整合
UI モック（[faction-events.html](ui/mockups/faction-events.html) / [faction-events.md](ui/03-screens/faction-events.md)）が **唯一の正**。
v4 まで engine が 4 択設計だった時期があったが、UI は常に `A=煽る / B=仲裁 / C=介入しない` の 3 択。
**新しい分岐を追加するときは必ず HTML モックアップを開いてボタン数とセリフを一致させる**。

### 3-2 BGM 二重再生の回避
既存 `Audio.play('tension')` が試合中に鳴っている可能性があるため、モーダル開幕で BGM 切替する前に必ず `fadeOut` してから新 BGM を play する（v4 §2-2 の冒頭に明記）。

### 3-3 F02④ endless の発火確率
`f02EndlessStreakWeeks: 52` は相当長い。auto-sim 100 シーズンでも発火しないことがあり得る。
Audio 実装確認のときは一時的に `10〜20` へ下げて検証。

### 3-4 peace の lockerRoomMorale 条件
v5 で `state.lockerRoomMorale ≥ 55` に単純化済み。派閥別 morale は仕様未整備（将来の課題）。

### 3-5 resolution と ignite の同時成立
同一興行で両方発火し得るが `!s._pendingFactionEvent` ガードで ignite が優先される（試合前先発火）。意図通り。

---

## 4. ファイル変更サマリ（v5 時点）

- [src/factions.js](../src/factions.js): F02 進展 4 種 の検出/適用関数群 +約 250 行
- [src/data.js](../src/data.js): `FACTION_CONFIG.f02Endless*` 3 定数 +3 行
- [src/management.js](../src/management.js): state 初期化 + 派閥パイプライン 4 関数呼び出し + executeShow ignite/resolution フック +約 30 行
- [src/app.js](../src/app.js): `handleFactionEvent` 4 分岐 + finalizeShow/finalizeWar フック +約 60 行
- [test/auto-sim.js](../test/auto-sim.js): `autoHandleFactionEvent` 4 分岐 +約 10 行
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md): §9.11 追記 + §9.2 選択肢 3 択化
- [docs/game-system-roadmap.md](game-system-roadmap.md): 現在状態エントリ更新

---

## 5. 次セッション着手手順（推奨）

1. 本引き継ぎ書 §0 の参照ファイル群に目を通す（特に HTML モックアップを実機で開く）
2. [src/app.js](../src/app.js) L28 付近の Audio マップ現状を確認
3. F05H 既存 Audio フック確認（v4 で実装済みなら参考にできる）
4. §2-1 Audio hooks を F01/F02/F03 から順に実装 → 実機で鳴動確認
5. §2-3 F05H の specs 反映
6. §2-2 手動モーダル通し確認
7. ローカルコミット（push なし）

---

**所要見積**: Audio hooks 実装 1〜2 時間、specs F05H 反映 30 分、手動確認 30 分〜1 時間。計 2〜4 時間。
