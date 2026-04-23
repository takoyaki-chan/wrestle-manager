# 派閥イベント演出 引き継ぎ書 v4（2026-04-23 セッション末）

前身: [docs/faction-events-handoff-v3.md](faction-events-handoff-v3.md)
ブランチ: `refactor/battle-engine-replay`
直近コミット: `674d1dd feat(faction-events): F05H 活動休止イベント生成ロジック追加`

---

## 1. v3 から本セッションで完了した作業（§3-1 完了）

### 1-1 F05H 活動休止イベント生成ロジック追加
- [src/factions.js](../src/factions.js)
  - `createFaction`: `status: 'active'` フィールド追加（`'active' | 'hiatus' | 'dissolved'`）
  - `detectLeaderLoss`: longInjury 分岐を削除 → roster 不在（retirement / departure）のみ検知
  - **新設**: `detectHiatusTrigger(state)` — active 派閥でリーダーの `injury.weeksLeft >= 8` を検知
  - **新設**: `applyHiatusRecovery(state)` — hiatus 派閥のリーダー怪我回復をサイレントに `status='active'` へ戻す
  - **新設**: `applyF05HResult(state, payload)` — `status='hiatus'` + `inHostility=false` + `momentum=0`
  - `pickWeeklyEvent`: F03 の次（F08 より前）に **F05H** 分岐を挿入。優先順 **F03 > F05H > F08 > F04 > F05 > F07 > F06 > F02 > F01**
  - `checkRivalrousFormationConditions`: pool フィルタに `f.status !== 'hiatus'` 追加
  - `checkF05Conditions`: ループ冒頭に `if (f.status === 'hiatus') continue;` 追加

- [src/management.js](../src/management.js): 週次派閥パイプライン冒頭に `Engine.factions.applyHiatusRecovery(s)` を呼び出し（通知なし自動復帰）

- [src/app.js](../src/app.js) `handleFactionEvent`: `eventId === 'F05H'` 分岐追加 → `showFactionHiatusModal` にルーティング

- [test/auto-sim.js](../test/auto-sim.js): F05H 自動応答を追加（`applyF05HResult`）

### 1-2 検証
- auto-sim 20 シーズン（seed=42）: ALL CLEAR ✓
- auto-sim **100 シーズン（seed=42）**: ALL CLEAR ✓（5,300週 / 466秒）

### 1-3 コミット
`674d1dd feat(faction-events): F05H 活動休止イベント生成ロジック追加` — ローカルのみ、push なし。

---

## 2. 未着手タスク（次セッションの作業順）

> **各タスク着手前の必読**:
> 1. [docs/ui/03-screens/faction-events.md](ui/03-screens/faction-events.md) — §3 F02 進展系の各詳細
> 2. [docs/ui/mockups/faction-events.html](ui/mockups/faction-events.html) — モック13シーン
> 3. [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md)
> 4. 本セッション追加: [src/factions.js](../src/factions.js) `pickWeeklyEvent` の優先順（F03 > F05H > F08 > ... > F01）

### 2-1 F02 進展4種の発火ロジック接続（= 旧 v3 §3-2）【次セッション最優先】

v3 §3-2 をそのまま継続。UI モーダル（`showFactionF02IgniteModal` / `showFactionF02PeaceModal` / `showFactionF02ResolutionModal` / `showFactionF02EndlessModal`）は既に ui-common.js に実装済みなので、**エンジン側の発火条件とペイロード生成のみが残タスク**。

#### 2-1-A F02① ignite（発火・公式戦化）
- **発火契機**: F02 で `choiceId === 'A'`（煽る）選択時点で**将来の興行メインカード自動組み込み**フラグを立てる
- 実装案:
  - `applyF02Choice` の 'A' 分岐で `state.factionPendingIgnite = { factionAId, factionBId, leaderAId, leaderBId, scheduledSeason, scheduledWeek }` を残す
  - 興行準備画面の初期カード生成フック（`generateMatchCard` 相当）で該当ペアをメインに自動ピン留め
  - 試合実行直前 or 興行入場時に `showFactionF02IgniteModal` を発火
  - 同ペアに対し 2シーズン CD (`ignitionTriggered` フラグ)
- **内部影響**: 両派閥間 hostility +12 / 該当カード matchAppeal +8 / 集客見込み +6%
- **payload**: `{ leaderAId, leaderBId, factionAName, factionBName, hostilityA, hostilityB, membersA, membersB }`

#### 2-1-B F02② peace（沈静化・対等な和解）
- **発火契機**: F02 で `choiceId === 'C'`（仲裁）を選んだ後、**8〜12週以内**に両方向 hostility **-20 以上減衰** + 両派閥 lockerRoomMorale 55+ 維持
- 実装案:
  - `applyF02Choice` の 'C' 分岐で `state.f02MediationWatches = [{ factionAId, factionBId, baseHostilityAB, baseHostilityBA, startWeek, deadlineWeek }]` を登録（deadlineWeek = now + 12）
  - 週次派閥パイプライン（`pickWeeklyEvent` 内 or 別フェーズ）で watch を走査
  - 条件満たしたら F02② peace イベントを発火、watch エントリ削除
  - 期限切れ（12週）でも満たさなければ watch 削除（自然消滅・時間経過で F02③ / F02④ 側へ）
- **内部影響**: 両方向 hostility -40 / 両派閥 momentum = 0 / 両リーダー間 bond +3
- **payload**: `{ leaderAId, leaderBId, factionAName, factionBName }`

#### 2-1-C F02③ resolution（決着）
- **発火契機**: 両派閥に `inHostility=true` + 両方向 hostility ≥60 下で、**両派閥リーダー（または象徴選手）間の試合が決着**（ドロー不可）
- 実装案:
  - `Engine.factions.rollResolutionAfterMatch(state, matchResult)` を新設
  - 試合結果フック（`App.finalizeShow` + `Engine.executeShow` + `finalizeWar` + `finalizePPV` の4パス）から呼び出し
  - 返り値: `{ state, eventPayload?, resultText }` — eventPayload があれば `_pendingFactionEvent` に積んで UI 表示
- **内部影響**:
  - 勝者派閥: 求心力 +10〜+15 / momentum +15〜+25 / リーダー trust +5〜+8
  - 敗者派閥: 求心力 -12〜-18 / momentum -18〜-25 / 下位メンバー 2〜3名に離脱リスクフラグ
  - 両派閥間 hostility -40（完全解消ではない"決着後の冷静"）
  - `factionTimeline` に RESOLVED エントリ追記
- **敗者派閥の F03-D 連動**: 敗北で momentum が閾値割れた場合、次週以降の `checkDissolutionConditions` で自然消滅 → F03-D（COLLAPSE）経路
- **payload**: `{ winnerId, loserId, winnerFactionName, loserFactionName }`

#### 2-1-D F02④ endless（無限抗争）
- **発火契機**: 両方向 hostility 平均 ≥55 が **52週継続**
- 実装案:
  - `state.factionEndlessStreak = { [pairKey]: weekCount }` を週次で更新（`pickWeeklyEvent` 内 or F06 streak と並列のフェーズ）
  - 平均が 55 以上の週は +1、下回ったらリセット
  - 52 に到達 + CD チェック（`endlessRivalryTriggered_{pairKey}_until`）で F02④ 発火
  - 発火後 52週 CD
- **内部影響**:
  - 両派閥 members の週次 `mentalCoeff` に -0.02 程度の下方バイアス（cap あり）
  - 新人（経験 <1 シーズン）の練習集中 -3
  - その興行週の集客 -5%
  - 両派閥の離脱チェック週次レート +20%
- **payload**: `{ leaderAId, leaderBId, factionAName, factionBName, weeksContinued }`

#### 2-1-E auto-sim 対応
- `test/auto-sim.js` の派閥自動応答に F02① / F02② / F02③ / F02④ を「通知のみ／選択肢なし」パターンで追加
- `applyF02IgniteResult` / `applyF02PeaceResult` / `applyF02ResolutionResult` / `applyF02EndlessResult` を新設（payload 受けて state 更新）

### 2-2 Audio hooks（= v3 §3-3 継続）
- [src/app.js](../src/app.js) に `stopAllAudio()` / `setBed()` パターン導入
- 登録マップ:
  - F01/F04/F02② 沈静化: `Soft Bids, Sharp Minds.mp3`
  - F02② 対峙（act2）/F02③ 決着/F02④ 無限: `bgm_tension_v1.mp3`（F02④ は × 0.6）
  - F02① 発火: `bgm_tension_v1.mp3 × 1.05` + 冒頭 `f07_gong_v1.mp3` stinger
  - F02② 沈静化: tension 切る + `Soft Bids, Sharp Minds.mp3 × 0.85` フェードイン + 終止 `f06_fin_chime_v1.mp3 × 0.7` stinger
  - F03 / F05H（活動休止）: Soft Bids × 0.7 + `f06_fin_chime_v1.mp3 × 0.6` stinger

### 2-3 完了時タスク
- [docs/game-system-roadmap.md](game-system-roadmap.md) に §3-1 / §3-2 分を追記
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) に §9.10 F05H / §9.11 F02 進展4種 を追加反映
- [docs/faction-events-handoff.md](faction-events-handoff.md) (v1.1) + [v2](faction-events-handoff-v2.md) + [v3](faction-events-handoff-v3.md) をアーカイブへ移動
- ローカルコミット（push しない）

---

## 3. 引き継ぎメモ・落とし穴

### 3-1 F05H 実装の落とし穴（v3 → v4 で判明）
- **`pickWeeklyEvent` は純粋関数**。`applyHiatusRecovery` を中で呼ぶと戻り値 state が呼び出し側に伝播しないため、**management.js 側で先に呼ぶ**パターンに落ち着いた
- `detectLeaderLoss` は **hiatus 派閥でも動く**（leader が roster から消えたら引退/退団として F03 経路に）。これは仕様通り — hiatus 中にリーダーが引退したら F03 に昇格
- hiatus 派閥は `inHostility=false` が強制されるため、F04/F06/F07/F08（いずれも `_isHostile(f)` 要求）から自動的に除外される。追加フィルタは F02（rivalrousFormation）と F05（派閥内亀裂）のみで十分だった

### 3-2 F02 進展4種の実装で想定される落とし穴
- **F02③ resolution と F03-D（COLLAPSE）の順序**: 決着当週に resolution → 次週 dissolution → F03-D の順。同週内で重ねない
- **endless streak カウンタのマイグレーション**: 既存セーブに `factionEndlessStreak` がない → 初期化 `{}` を忘れずに（management.js の faction 未初期化セーブ対応ブロックに追加）
- **F02 選択の CD と進展4種の CD は別**: 選択後に peace watch が動く間、別途 resolution や endless が発火し得る — 排他ではない
- **UI モーダルは既存**（v3 で実装済み）。エンジン側だけ繋げば動く

### 3-3 dev server port（v3 から継続）
- `http://localhost:3000/` が dev server ルート（推奨）
- port 3002 はファイルパスが `/ui-common.js` を HTML で返すため関数ロード失敗

### 3-4 _isPopupActive() と _popupQueue
- F02 進展系は他 popup 中に呼ばれたら `_popupQueue` に積む設計
- Audio hook 実装時、popup チェーン途中で BGM が切れないよう注意

### 3-5 z-index
- `.fevt-overlay-*` = 9000（title-screen 300 より上、battleOverlay 9999 より下）

---

## 4. 参照ドキュメント

- [docs/faction-events-handoff-v3.md](faction-events-handoff-v3.md) — 前身 v3
- [docs/faction-events-handoff-v2.md](faction-events-handoff-v2.md) — v2
- [docs/faction-events-handoff.md](faction-events-handoff.md) — v1.1
- [docs/ui/03-screens/faction-events.md](ui/03-screens/faction-events.md) — 階層3画面仕様 v0.2
- [docs/ui/mockups/faction-events.html](ui/mockups/faction-events.html) — モック13シーン
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) — エンジン契約
- [specs/character-data-spec-v1.7.md](../specs/character-data-spec-v1.7.md) — personality / archetype 値域
- [specs/oyou-style-guide.md](../specs/oyou-style-guide.md) — 鷹揚（composed）口調

---

## 5. 次セッション初手コマンド（推奨）

```bash
git status
git log --oneline -5
# 直近コミット: 674d1dd F05H 活動休止イベント生成ロジック

# 初手: v4 §2-1-C F02③ resolution（決着）から
#   → src/factions.js に Engine.factions.rollResolutionAfterMatch を新設
#   → applyF02ResolutionResult（payload 受け state 更新）
#   → 4試合パス（finalizeShow / executeShow / finalizeWar / finalizePPV）からフック
#   → app.js handleFactionEvent に F02_RESOLUTION 分岐追加
#   → auto-sim 100シーズン

# あるいは簡単な F02④ endless（streak カウンタのみ）から先に実装してもよい
```

**推奨順**: F02③ resolution → F02④ endless → F02① ignite（カード自動組み込みが一番重い） → F02② peace（watch 登録フェーズ追加）

---

*引き継ぎ書 v4 / 2026-04-23 / §3-1 F05H 完了時点*
