# 派閥イベント演出 引き継ぎ書 v7（2026-04-23 セッション末）

前身: [docs/faction-events-handoff-v6.md](faction-events-handoff-v6.md)
ブランチ: `refactor/battle-engine-replay`
直近コミット: `c83227b feat(faction-events): §2-1 Audio hooks 実装 + §2-3 F05H specs 反映`

---

## 0. 参照すべきファイル（必読）

次セッションで作業に入る前に必ず開く:

### 0-1 UI モックアップと画面仕様書
- **HTML モックアップ**: [docs/ui/mockups/faction-events.html](ui/mockups/faction-events.html)
  - 全 F01〜F08 + F02 進展 4 種 + F05H のモーダル UI をブラウザで実機確認できる叩き台
  - セリフ・選択肢文言・レイアウトの **唯一の正**。engine 側の文言がここと齟齬したら engine を直す
- **UI 画面仕様書**: [docs/ui/03-screens/faction-events.md](ui/03-screens/faction-events.md)
  - §「音響設計」(L418-) にイベント別 BGM/SE 表。v7 実装はここの登録値に準拠
  - §F02 進展 4 種（ignite/peace/resolution/endless）の BGM 指定（L570/L614/L647/L687 付近）

### 0-2 仕様書
- **派閥システム spec**: [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md)
  - §9.1〜§9.8: F01〜F08 発火条件と効果
  - §9.10: **F05H 活動休止（v7 で追記）**
  - §9.11: F02 進展 4 種（v5 で追記）
  - §12: RNG シード一覧（0xFA__ 系）

### 0-3 エンジン・Audio 実装
- **派閥コア**: [src/factions.js](../src/factions.js) — `Engine.factions` namespace、~1,300行
- **セリフデータ**: [src/data-faction-dialogue.js](../src/data-faction-dialogue.js) — 性格6×アーキタイプ6 マトリクス
- **モーダル UI**: [src/ui-common.js](../src/ui-common.js) `showFactionF0XModal` 群
- **ディスパッチャ + Audio**: [src/app.js](../src/app.js) `handleFactionEvent` / `FACTION_AUDIO_MAP` / `_factionAudioOpen` / `_factionAudioClose`（v7 で新設）
- **試合結果フック**: [src/app.js](../src/app.js) `finalizeShow` / `finalizeWar` + [src/management.js](../src/management.js) `executeShow` / `finalizePPV`
- **週次パイプライン**: [src/management.js](../src/management.js) `tickWeek` 内の派閥ブロック（`pickWeeklyEvent` 周辺）

### 0-4 過去の引き継ぎ書（アーカイブ）
- v1.1: [docs/archive/faction-events-handoff.md](archive/faction-events-handoff.md) — 初期計画
- v2: [docs/archive/faction-events-handoff-v2.md](archive/faction-events-handoff-v2.md) — F01/F02/F03 Phase 3a 完了時点
- v3: [docs/archive/faction-events-handoff-v3.md](archive/faction-events-handoff-v3.md) — F04〜F08 + UI モーダル実装時点
- v4: [docs/archive/faction-events-handoff-v4.md](archive/faction-events-handoff-v4.md) — F05H 活動休止 完了 + §3-2/§2-2 計画
- v5: [docs/faction-events-handoff-v5.md](faction-events-handoff-v5.md) — F02 進展 4 種 完了
- v6: [docs/faction-events-handoff-v6.md](faction-events-handoff-v6.md) — §2-1 Audio hooks 計画

---

## 1. 前セッション（v6 → v7）で完了した作業

コミット `c83227b`（push なし、ローカルのみ）。

### 1-1 §2-1 Audio hooks 実装（v6 本命タスク完了）
- [src/app.js](../src/app.js) Audio 公開 API に **`stinger(src, volume)`** ワンショット再生ヘルパー追加
  - `HTMLAudioElement` 経由で BGM に触れずに鳴らす
  - 全体 mute 時は無音、SE マスターボリュームを掛ける
- **`FACTION_AUDIO_MAP`** 新設（Audio IIFE の直下、~985行付近）
  - F01〜F08 + F02 進展 4 種 + F05H の 13 イベント分
  - 各エントリ: `{ src, volume, openStinger?, closeStinger? }`
  - 登録値は v6 §2-1 表と画面仕様書 §音響設計に準拠:

| イベント | BGM | vol | openStinger | closeStinger |
|---|---|---|---|---|
| F01 | `Soft Bids, Sharp Minds.mp3` | 0.14 | — | — |
| F02（act2 対峙） | `bgm_tension_v1.mp3` | 0.17 | — | — |
| F02_IGNITE | `bgm_tension_v1.mp3` | 0.18 | `f07_gong_v1.mp3` × 0.15（150ms 遅延） | — |
| F02_PEACE | `Soft Bids, Sharp Minds.mp3` | 0.12 | — | `f06_fin_chime_v1.mp3` × 0.10 |
| F02_RESOLUTION | `bgm_tension_v1.mp3` | 0.17 | — | — |
| F02_ENDLESS | `bgm_tension_v1.mp3` | 0.10 | — | — |
| F03 | `Soft Bids, Sharp Minds.mp3` | 0.10 | — | `f06_fin_chime_v1.mp3` × 0.09 |
| F04 | `Soft Bids, Sharp Minds.mp3` | 0.14 | — | — |
| F05H | `Soft Bids, Sharp Minds.mp3` | 0.10 | — | `f06_fin_chime_v1.mp3` × 0.09 |
| F05 / F06 / F07 / F08 | `Soft Bids, Sharp Minds.mp3` | 0.14 | — | — |

- **`_factionAudioOpen(eventId)` / `_factionAudioClose(eventId)`** 補助関数
  - Open: `Audio.fileBgm.play(src, { loop:true, volume })` で既存チップチューン（management/tension）を内部 `BGM.stop()` で停止しつつ切替、openStinger があれば 150ms 遅延で1発
  - Close: closeStinger → `fadeOut(1500)` → 1600ms 後に `Audio.bgm.playForState()` で状態に応じた通常 BGM 復帰
- **`handleFactionEvent`** 13 分岐すべてに配線:
  - 分岐先頭で `_factionAudioOpen(eventId)`
  - 結果モーダル `showFactionEventResult` の onClose に `finalizeAudio = () => _factionAudioClose(eventId)` クロージャを渡す
  - 旧 `() => {}` は全箇所差し替え

### 1-2 §2-3 F05H specs 反映（v4 未消化分を消化）
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) §9.10「F05H 活動休止（リーダー長期離脱）」セクション追加
  - 発火条件（`injury.weeksLeft >= 8` + active status、即時発動 100%）
  - 影響（`status='hiatus'` / `inHostility=false` / `momentum=0` / timeline ログのみ）
  - 自動復帰（`applyHiatusRecovery` で `weeksLeft===0` なら `active` に戻す、通知なし）
  - F03（旗を降ろす＝解散）との区別（F05H＝旗を畳む＝再起可能な保留）
  - 演出指定（Soft Bids × 0.7 + 終止 chime × 0.6）
  - 実装参照（`detectHiatusTrigger` / `applyF05HResult` / `applyHiatusRecovery` + `showFactionHiatusModal` + handleFactionEvent `'F05H'`）

### 1-3 ロードマップ更新
- [docs/game-system-roadmap.md](game-system-roadmap.md) 現在状態を v7 内容に更新、v6 のエントリを「前回」に繰り下げ

### 1-4 検証状況
- preview_start による JS パースエラーなし確認済み
- `FACTION_AUDIO_MAP` 13 キー + 3 ヘルパー（`Audio.stinger` / `_factionAudioOpen` / `_factionAudioClose`）の global 参照可能を preview_eval で確認
- auto-sim はスキップ（handoff v6 §2-1 検証方針: 試合数値・判定に無影響）

---

## 2. 残タスク（次セッション本体）

### 2-1 §2-2 UI モーダル通し確認（手動、本命タスク）

v5 で engine 配線、v7 で Audio 配線まで完了したが、実機で以下を通しで発火確認していない:

- **F02① ignite**: 興行準備で両リーダーをシングルカードに組む → 実行時モーダル発火 + `f07_gong_v1.mp3` stinger が鳴るか
- **F02② peace**: F02 で B=仲裁 選択後、hostility が 8〜12 週内に -20 以上下がる + `lockerRoomMorale ≥ 55` で発火するか（auto-sim では locker morale が低めなのでヒットしにくい → 実機必須）
- **F02③ resolution**: 敵対派閥リーダー戦を直接組む → 決着モーダル発火 + tension BGM
- **F02④ endless**: 52 週は長い。`FACTION_CONFIG.f02EndlessStreakWeeks` を一時 10〜20 に下げて検証推奨、または auto-sim + `factionEndlessStreak` デバッグ表示で代替
- **F05H**: リーダーに 8 週以上の怪我を発生させる（デバッグで `fighter.injury.weeksLeft = 10` を直接代入）→ モーダル発火 + chime stinger + `status='hiatus'` 遷移確認

**Audio 手動チェックリスト**:
- [ ] BGM が正しく切り替わるか（management → Soft Bids / tension）
- [ ] openStinger（F02_IGNITE の f07_gong）が150ms遅延で1発鳴るか、BGM と二重にならないか
- [ ] closeStinger（F02_PEACE / F03 / F05H の f06_fin_chime）が「閉じる」クリック時に1発鳴るか
- [ ] 結果モーダル閉じた後に management BGM が 1600ms のオフセットを経て復帰するか
- [ ] セリフが性格×アーキタイプで変わるか
- [ ] 結果画面で数値変動が narrative と一致するか
- [ ] モックアップ [faction-events.html](ui/mockups/faction-events.html) の見た目と実機が一致するか

### 2-2 Audio チューニング（必要なら）

手動確認で以下のような問題が出たら調整:

- **volume が小さすぎ / 大きすぎ**: [src/app.js](../src/app.js) `FACTION_AUDIO_MAP` の `volume` 値を調整（現在 0.10〜0.18 レンジ）
- **openStinger が BGM と被る**: `_factionAudioOpen` の `setTimeout(150)` を 250〜400ms に伸ばす
- **closeStinger が fadeOut と被る**: `_factionAudioClose` は「stinger → fadeOut → playForState」の順。stinger だけ `setTimeout(0)` で発火して直後に fadeOut 始まるので、chime が fadeOut される元 BGM と重なり得る。気になるなら stinger を同期発火、fadeOut を 200ms 遅延させる
- **fadeOut 後に management BGM が復帰しないケース**: `playForState` は現在 `G.weekPhase` を見て判断する。イベント直後は `event` フェーズが抜けてるか確認

### 2-3 optional: F05-F08 の BGM 仕様確定

v6/v7 では F05/F06/F07/F08 の BGM が未規定のため Soft Bids × 0.14 のフォールバックを適用している。演出トーンに合わせて本仕様化するなら:

- **F05（派閥内亀裂）**: 内輪揉めなので Soft Bids でOK、または軽く tension × 0.10
- **F06（和解の兆し）**: Soft Bids × 0.8 + 終止 chime
- **F07（リーダー横暴）**: tension × 0.15（緊張トーン寄り）
- **F08（対立ヒートアップ）**: tension × 0.17 + 冒頭 gong stinger（F02 と統一感）

いずれも [docs/ui/03-screens/faction-events.md](ui/03-screens/faction-events.md) §音響設計 の表拡張とセットで確定したい。

---

## 3. 実装上の落とし穴（v6 → v7 で継承 + 追加）

### 3-1 UI と engine の 3 択整合（v5 から継承）
UI モック（[faction-events.html](ui/mockups/faction-events.html) / [faction-events.md](ui/03-screens/faction-events.md)）が **唯一の正**。
v4 まで engine が 4 択設計だった時期があったが、UI は常に `A=煽る / B=仲裁 / C=介入しない` の 3 択。
**新しい分岐を追加するときは必ず HTML モックアップを開いてボタン数とセリフを一致させる**。

### 3-2 BGM 二重再生の回避（v6 から継承、v7 で担保済み）
`FileBGM.play()` は内部で `BGM.stop()` を呼ぶので、`_factionAudioOpen` 1 行で既存チップチューン停止 + ファイル BGM 開始が両立する。
手動でチップチューン BGM を流しつつ FileBGM を鳴らす実装をしない限り二重再生は起きない。

### 3-3 F02④ endless の発火確率（v6 から継承）
`f02EndlessStreakWeeks: 52` は相当長い。auto-sim 100 シーズンでも発火しないことがあり得る。
Audio 実装確認のときは一時的に `10〜20` へ下げて検証。

### 3-4 peace の lockerRoomMorale 条件（v6 から継承）
v5 で `state.lockerRoomMorale ≥ 55` に単純化済み。派閥別 morale は仕様未整備（将来の課題）。

### 3-5 resolution と ignite の同時成立（v6 から継承）
同一興行で両方発火し得るが `!s._pendingFactionEvent` ガードで ignite が優先される（試合前先発火）。意図通り。

### 3-6 fadeOut 中の再オープン（v7 新規）
結果モーダルを閉じた直後（1600ms 以内）に別の派閥イベントが発火するケース（同週内複数 pendingFactionEvent）では、fadeOut 中の `FileBGM` が次の `_factionAudioOpen` に `FileBGM.stop()` で置き換えられる。
挙動としては問題ないが、playForState が一度も呼ばれないまま次の BGM に移行する形になる。現状は起きにくいので放置。

### 3-7 Audio.stinger の同時多発（v7 新規）
`stinger` は `new window.Audio(src)` ごとに独立 HTMLAudioElement を作るので、同時多発しても衝突しない。ただしボリュームは SE マスターのみ掛かり、BGM ミキサーとは独立。モーダルが同時に複数開くシーンでは stinger だけ重なる可能性がある（v7 時点で該当シーンなし）。

---

## 4. ファイル変更サマリ（v6 → v7）

- [src/app.js](../src/app.js): Audio.stinger + FACTION_AUDIO + FACTION_AUDIO_MAP + `_factionAudioOpen/Close` 2 関数 + handleFactionEvent 13 分岐に open + finalizeAudio クロージャ配線 +約 90 行
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md): §9.10 F05H 活動休止 +約 35 行
- [docs/game-system-roadmap.md](game-system-roadmap.md): 現在状態エントリ更新

---

## 5. 次セッション着手手順（推奨）

1. 本引き継ぎ書 §0 の参照ファイル群に目を通す
2. 実機で派閥イベントを発火させて §2-1 チェックリストを埋める
   - F02 系の検証は `f02EndlessStreakWeeks` を一時 10〜20 に下げる
   - F05H の検証はデバッグコンソールで `G.roster.find(f=>f.id===<leaderId>).injury = {type:'leg', weeksLeft:10, ...}` 等を直接注入
3. BGM/stinger の音量・タイミングに違和感があれば §2-2 に従って `FACTION_AUDIO_MAP` を調整
4. （optional）§2-3 F05-F08 BGM 仕様確定を Keisuke と相談
5. ローカルコミット（push なし）

---

**所要見積**: 手動確認 1〜2 時間、Audio 微調整があれば +30 分。計 1〜2.5 時間。
