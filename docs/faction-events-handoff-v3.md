# 派閥イベント演出 引き継ぎ書 v3（2026-04-23 セッション末）

前身: [docs/faction-events-handoff-v2.md](faction-events-handoff-v2.md)
ブランチ: `refactor/battle-engine-replay`

---

## 1. v2 から本セッションで完了した作業

### 1-1 F02 対峙（act1 ナレ + act2 clash）全面書き換え（§3-3 完了）
- [src/ui-common.js](../src/ui-common.js) `showFactionF02Modal` 全面書き換え
  - act1: `.fevt-narration-act` オーバーレイ（4行 1文ずつ置き換え式 / 2200ms間隔 / クリックで進行 / `fevtF02NarProceed` ボタン）
  - act2 遷移: `_factionF02RenderClash(payload, state, onChoice)` 新設
- `_factionF02RenderClash`: `.fevt-overlay-stage` 上に title-band + dual-stage(left=factionA 固定) + clash-atmosphere + personality×archetype セリフ(`Engine.factions.getF02ClashLine`) + 3択 `.fevt-stage-btn` (A煽る/B仲裁/C介入しない)
- ヘルパ追加: `_factionSurname(fighter)`, `_factionPickReporter(state)`, `_factionReporterStrip(state, line)`, `_factionSeasonLabel(state)`
- `_factionCloseCinematicOverlay` の query selector に `.fevt-narration-act` を追加
- F01（結成）と F04（寝返り）も Office 応接室型 `.fevt-overlay-office` へ書き換え済み（v2 セッション内で着手→本セッション内で仕上げ）
- 旧 scene-based 実装の残骸（scene === 3/4 ブロック）を撤去してシンタックスエラー解消

### 1-2 F02 進展4種（§3-4 完了）
- [src/ui-common.js](../src/ui-common.js) に4関数を新設・公開
  - `showFactionF02IgniteModal` — F02①「開 戦」`.fevt-overlay-stage.ignite`（橙 radial flare + VS + MAIN EVENT 帯 + verdict + ledger）
  - `showFactionF02PeaceModal` — F02② 沈静化「和 解」`.fevt-overlay-stage.peace`（象牙×若草 + 握手ドット + RECONCILED + 対称 ledger）
  - `showFactionF02ResolutionModal` — F02③ 決着「決 着」`.fevt-overlay-stage.resolution`（勝者ゴールドスポット + 敗者旗降下 + win/lose 非対称 ledger）
  - `showFactionF02EndlessModal` — F02④ 無限抗争「終わらない抗争」`.fevt-overlay-stage.endless`（グレー乗算 + 週カウンタ + 膠着VS + 4行侵食リスト）
- ヘルパ追加: `_factionF02StageMount(html)` / `_factionF02StageBtnBind(root, onContinue)`
- payload 構造:
  - ignite: `{ leaderAId, leaderBId, factionAName, factionBName, hostilityA, hostilityB, membersA, membersB }`
  - peace: `{ leaderAId, leaderBId, factionAName, factionBName }`
  - resolution: `{ winnerId, loserId, winnerFactionName, loserFactionName }`
  - endless: `{ leaderAId, leaderBId, factionAName, factionBName, weeksContinued }`
- 全4種は通知のみ（選択肢なし）。`continue-btn` で `onContinue()` → close

### 1-3 CSS ポート完了
- [src/index.html](../src/index.html) `.fevt-continue-btn:hover` 直後 〜 `</style>` 手前に以下4ブロックを移植（モック L706-1314 相当、~420行）:
  - F02 進展③ 決着（resolution）: `.fevt-overlay-stage.resolution`, `.fevt-title-main.settled`, `.fevt-res-stage/-winner/-loser/-verdict/-ledger`, keyframes `fevtResSpotBreath/fevtResWinnerRise/fevtResFlagPulse/fevtResLoserFade/fevtResFlagLower`
  - F02 進展④ 無限抗争（endless）: `.fevt-overlay-stage.endless`, `.fevt-title-main.endless`, `.fevt-endless-counter/-stage/-col/-vs/-verdict/-erosion/-erosion-row`, keyframes `fevtEndlessNumPulse/fevtEndlessColDrift`
  - F02 進展② 沈静化（peace）: `.fevt-overlay-stage.peace`, `.fevt-title-main.peace`, `.fevt-peace-stage/-col/-center/-handshake/-dot/-center-label/-verdict/-ledger`, keyframes `fevtPeaceLightBreath/fevtPeaceColIn/fevtPeaceFlagLower/fevtPeaceDotMeetA/fevtPeaceDotMeetB`
  - F02 進展① 発火（ignite）: `.fevt-overlay-stage.ignite`, `.fevt-title-main.ignite`, `.fevt-ign-stage/-col/-role-label/-role-kanji/-portrait-wrap/-faction-flag/-stats/-vs/-card-band/-card-label/-card-name/-verdict/-ledger/-ledger-col/-ledger-head/-ledger-line`, keyframes `fevtIgniteFlare/fevtIgniteFade/fevtFadeUp/fevtIgniteVs`

### 1-4 DOM 検証
`preview_eval` で全変種動作確認:
- F02 act1→act2 遷移: ナレ4行 → proceed クリック → clash 表示 → stage-btn クリック → choice='B' → close 全て OK
- F02① ignite: 「開 戦」+ VS + 2 cols + card-band + 続けるボタン
- F02② peace: 「和 解」+ 2 dots + 2 cols + 2 ledger
- F02③ resolution: 「決 着」+ winner + loser + 2 ledger
- F02④ endless: 「終わらない抗争」+ counter「52」+ 2 cols + 4 erosion rows

---

## 2. uncommitted 変更ファイル

```
M  src/index.html                F02 進展4種 CSS ~420行追加
M  src/ui-common.js               F02 対峙書き換え + F02 進展4種4関数追加 + dangling旧コード撤去
M  docs/faction-events-handoff-v2.md  各タスクに3ファイル参照ブロック追記
?? docs/faction-events-handoff-v3.md   ← この引き継ぎ書
```

**ローカルコミット未実行**（ユーザー判断でこのまま次セッションへ / or コミット後切り替え）。

---

## 3. 未着手タスク（次セッションの作業順）

> **各タスク着手前の必読**（v2 と同じ）:
> 1. [docs/ui/03-screens/faction-events.md](ui/03-screens/faction-events.md)
> 2. [docs/ui/mockups/faction-events.html](ui/mockups/faction-events.html)
> 3. [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md)

### 3-1 F05 活動休止イベント生成ロジック追加
- **仕様**: [03-screens/faction-events.md §5](ui/03-screens/faction-events.md)
- **spec**: `faction.status` を `active | hiatus | dissolved` の3値に拡張
- [src/factions.js](../src/factions.js) §8 週次イベント抽選に F05H 検出を追加
  - 条件: リーダー `injuryWeeks >= 8` など 8週以上の長期離脱確定
  - `faction.status = 'hiatus'` へ遷移、週次抽選から除外
  - 復帰時 `status = 'active'` 復帰（将来 F07 系で演出検討）
- [src/app.js](../src/app.js) で `showFactionHiatusModal` にルーティング
- 既存 F05（派閥内亀裂）との識別: eventId を `F05H` で分離推奨（v2 §4-4 の未決事項）

### 3-2 F02 進展4種の発火ロジック接続
- [src/factions.js](../src/factions.js) 試合結果フック / 週次ループから4種をドライブ
  - F02① ignite: F02 で A 煽る選択後の「翌週興行メインカード自動組み込み」→ 組み込まれた週に `showFactionF02IgniteModal`
  - F02② peace: F02 で C 仲裁選択後、8〜12週以内に hostility -20 以上 + morale 55+ 継続
  - F02③ resolution: 両派閥リーダー間試合決着（hostility 60+ 条件下）→ `Engine.factions.rollResolutionAfterMatch(state, matchResult)` 新設
  - F02④ endless: 両方向 hostility 平均 ≥55 が 52週継続、ペア単位 `endlessRivalryTriggered` フラグ + 52週 CD
- 各イベントの内部影響（求心力/勢い/hostility/bond 等）も併せて実装

### 3-3 Audio hooks（v2 §3-6 継続）
- [src/app.js](../src/app.js) に `stopAllAudio()` / `setBed()` パターン導入
- 登録マップ:
  - F01/F04/F02② 沈静化: `Soft Bids, Sharp Minds.mp3`
  - F02② 対峙（act2）/F02③ 決着/F02④ 無限: `bgm_tension_v1.mp3`（F02④ は × 0.6）
  - F02① 発火: `bgm_tension_v1.mp3 × 1.05` + 冒頭 `f07_gong_v1.mp3` stinger
  - F02② 沈静化: tension 切る + `Soft Bids, Sharp Minds.mp3 × 0.85` フェードイン + 終止 `f06_fin_chime_v1.mp3 × 0.7` stinger
  - F03 / F05（活動休止）: Soft Bids × 0.7 + `f06_fin_chime_v1.mp3 × 0.6` stinger

### 3-4 完了時タスク
- [docs/game-system-roadmap.md](game-system-roadmap.md) に本セッション分を追記
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) §9.2 `applyF02Choice` 整合確認 + F02 進展4種を仕様側に反映
- [docs/faction-events-handoff.md](faction-events-handoff.md) (v1.1) + [v2](faction-events-handoff-v2.md) をアーカイブへ移動
- ローカルコミット（push しない）

---

## 4. 引き継ぎメモ・落とし穴（v2 から継続 + 本セッション追加分）

### 4-1 dev server port
- `http://localhost:3000/` が dev server ルート（推奨）
- port 3002 はファイルパスが `/ui-common.js` を HTML で返すため関数ロード失敗 → port 3000 を使う

### 4-2 F02 モーダル間の整合
- act1 ナレ → act2 clash の遷移は `_factionF02RenderClash` を介する。act1 の `.active` を外してから `setTimeout(500ms)` で act2 を描画
- 3択後の発火ルートは各 choice に対応するイベント ID へ分岐する想定（spec 3-2 参照）:
  - A 煽る → F02① ignite（公式戦化）
  - B 仲裁 → 条件満たせば F02② peace、満たさなければ時間経過で F02③ resolution or F02④ endless
  - C 介入しない → hostility 推移任せ → F02③ resolution or F02④ endless

### 4-3 F02 進展4種の payload 設計方針
- 旗の表示名（factionAName/winnerFactionName 等）は呼び出し側で決定済みの文字列を渡す前提
- portrait は `_factionUpperUrl(fighterId)` ヘルパが `upper_{id}.webp` を返す
- ledger の数値は現状モック固定値をそのまま表示。spec 3-2 で実データ連動に差し替える想定

### 4-4 _isPopupActive() と _popupQueue
- F02 進展系は他 popup 中に呼ばれたら `_popupQueue` に積む設計（v2 の F03/F04 と同等）
- Audio hook 実装時、popup チェーン途中で BGM が切れないよう注意

### 4-5 z-index（v2 から継続）
- `.fevt-overlay-*` = 9000（title-screen 300 より上、battleOverlay 9999 より下）
- cinematic overlay 複数同時は想定外（`_popupQueue` で直列化）

---

## 5. 本セッションで更新した CLAUDE 指示書

v2 の §3 各タスク冒頭に 3ファイル参照ブロックを追記済み（03-screens / mockups / specs）。v3 でも同方針を継続する。

**鉄則**: 計画から外れた実装（独自サフィックス/テンプレテキスト/モック外構造）は禁止。モック + 03-screens + specs の3つを必ず参照して実装する。

---

## 6. 参照ドキュメント

- [docs/faction-events-handoff-v2.md](faction-events-handoff-v2.md) — 前身 v2（F01/F03/F04/F05 新規 + 着手途中の F02 の議事録）
- [docs/faction-events-handoff.md](faction-events-handoff.md) — v1.1（決定事項全文）
- [docs/ui/03-screens/faction-events.md](ui/03-screens/faction-events.md) — 階層3画面仕様 v0.2
- [docs/ui/mockups/faction-events.html](ui/mockups/faction-events.html) — モック13シーン
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) — エンジン契約
- [specs/character-data-spec-v1.7.md](../specs/character-data-spec-v1.7.md) — personality / archetype 値域
- [specs/oyou-style-guide.md](../specs/oyou-style-guide.md) — 鷹揚（composed）口調

---

## 7. 次セッション初手コマンド（推奨）

```bash
git status
git log --oneline -5

# dev server 起動（preview_start で port 3000）
# 初手: v3 §3-1 F05 活動休止の生成ロジックから
#   → src/factions.js §8 週次イベント抽選を読む
#   → faction.status 拡張の影響範囲を把握
#   → 既存 F05（亀裂）との eventId 分離策を Keisuke に確認
```

最初の1ステップ: **[src/factions.js](../src/factions.js) の §8 週次イベント抽選を読み、`faction.status` を `active | hiatus | dissolved` の3値に拡張する場所を特定する**。

---

*引き継ぎ書 v3 / 2026-04-23 / F02 対峙 + F02 進展4種 実装完了時点*
