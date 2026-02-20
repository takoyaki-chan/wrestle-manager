# WRESTLE MANAGER — 開発サマリー（v0.85bまで）

## プロジェクト概要
女子プロレス団体経営シミュレーションゲーム。単一HTMLファイルで動作。
プレイヤーは団体オーナーとして選手のスカウト・育成・カード編成を行い、団体を成長させる。

---

## 最新ファイル
- **wrestle-manager-v0_85b.html** — 3,093行、完全動作する単一HTMLファイル

## 参照スペックドキュメント（uploads）
| ファイル | 内容 |
|---|---|
| battle-engine-spec-v4_1b.md | バトルエンジン仕様書 |
| battle-engine_v4_1b_tuneB.html | バトルエンジン実装（tuneB調整版） |
| character-data-spec-v1_1.md | 80選手＋8コーチのデータ定義 |
| economy-system-spec-v1_0.md | 経済システム仕様書 |
| weekly-gameloop-spec-v1_0.md | 週間ゲームループ仕様書 |
| game-system-roadmap.md | ゲームシステムロードマップ |
| 技テーブル_全160技_v3_5.md | 全160技のテーブル |
| training-system-spec-v0_8.md | 高度なトレーニングシステム仕様書 |

---

## バージョン履歴

### v0.1 — 基盤構築
- バトルエンジン統合（v4.1b tuneB）
- 週間ゲームループ（48週/年、興行週は偶数週）
- 経済システム（チケット・グッズ・給与・会場費）
- ロスター管理（初期8名）
- 6画面UI
- 6会場（公民館〜ドーム）

### v0.2 — UI改善
- カード編成のオートフィル、重複防止、スタイル別バッジ

### v0.3 — 80キャラ＋MQシステム
- 80選手、MQ（Match Quality 0-100）、スカウト画面

### v0.4 — Heat＋怪我システム
- Heatシステム（6段階集客倍率）、怪我システム（3段階）

### v0.5 — タイトル＋ライバルリー
- 世界王座（MQ+15、集客+15%）、ライバルリー（3段階抗争）

### v0.6 — セーブ/コーチ/成長
- セーブ/ロード（localStorage、3スロット+オートセーブ）
- コーチシステム（8名、最大3名雇用）
- 選手成長/衰退システム

### v0.7 — 施設アップグレード
- 5施設 × 3段階レベル
- トレーニング/医療/メディア/選手寮/スカウト網

### v0.8 — 高度なトレーニング
- **コーチ→選手アサインシステム**
  - コーチ1人あたり最大4名の担当選手
  - 1選手につき1コーチまで
  - 専門コーチ: 専門ステ成長×2.0 / 他ステ×1.2
  - 全般コーチ: 全ステ×1.4
  - MQコーチ: 担当選手出場試合のみMQ+3
  - POPコーチ: 担当選手のプロモのみ人気+1
  - 未アサイン選手は基礎成長のみ
- **成長ウェイトシステム**
  - コーチ専門ステ: 選択確率40%
  - 他ステ: 各15%
  - 未アサイン/全般: 各20%均等
- **⚡ 強化練習**
  - 任意アクション: 成長×1.5
  - コンディション消耗2倍 / 8%で練習負傷（1-2週）
  - 体調50以上で使用可 / 最大2週連続
- **専用トレーニング画面**（10画面目）
- v0.7セーブとの後方互換性
- 2,899行

### v0.85 — Engine分離フェーズ1 ← アーキテクチャ改善
- **Engine名前空間作成**: 全ゲームロジックをEngine.*に集約
- **DOM参照排除**: Engine内からdocument.*呼び出しを全排除
- **seed乱数化**: SeededRandom導入、全乱数をseed管理で再現可能に
- **アーキテクチャ原則①④達成**
- 3,079行

### v0.85b — Engine分離フェーズ2 ← **最新**
- **GameState不変化（原則②）**
  - 全Engine関数を純粋関数化（新stateを返す、in-place変更ゼロ）
  - 変更箇所: 163箇所 → 0箇所
  - Engine.heat: calcUpdate/calcDecay（新heatScore返却）
  - Engine.injury: check/tick（新roster/freeAgents返却）
  - Engine.title: recordRivalry/crownChampion/recordDefense/validateChampion
  - Engine.coach: assignToCoach/unassignFromCoach（新coachAssign返却）
  - Engine.growth: applySeasonEnd（新roster+report返却）
  - Engine.season: processManage/processSettlement（新state返却）
- **UI直接変更禁止（原則③）**
  - 全onclick handlers からG.property直接代入を排除
  - App bridgeパターンに統一: G = { ...G, property: newValue }
  - 変更箇所: 25箇所 → 0箇所
- **tickWeek統合パイプライン（原則⑤）**
  - tickWeek(state) → {state, events, financeSummary}
  - executeShow(state) → {state, results, injuryResults, events}
  - advanceWeek(state) → {state, events}
  - applyMQPopularity/applyShowPopularity もEngine内に移動
- **Storage不変化**: serialize/deserialize/save/loadも全てimmutableパターン
- **アーキテクチャ全5原則達成** ✅
- 3,093行

---

## 現在の実装状況

### ✅ 実装済み
| システム | 実装版 | 状態 |
|---|---|---|
| バトルエンジン（v4.1b tuneB） | v0.1 | ✅ |
| 週間ゲームループ（48週/年） | v0.1 | ✅ |
| 経済システム（収入/支出/倒産） | v0.1 | ✅ |
| 80キャラクター | v0.3 | ✅ |
| MQシステム（0-100） | v0.3 | ✅ |
| スカウト/獲得/解雇 | v0.3 | ✅ |
| Heatシステム（6段階集客倍率） | v0.4 | ✅ |
| 怪我システム（3段階） | v0.4 | ✅ |
| タイトルシステム（世界王座） | v0.5 | ✅ |
| ライバルリーシステム（3段階抗争） | v0.5 | ✅ |
| セーブ/ロード | v0.6 | ✅ |
| コーチシステム（8コーチ） | v0.6→v0.8 | ✅ |
| 選手成長/衰退 | v0.6→v0.8 | ✅ |
| 施設アップグレード（5施設×3段階） | v0.7 | ✅ |
| コーチ→選手アサイン | v0.8 | ✅ |
| 成長ウェイトシステム | v0.8 | ✅ |
| 強化練習（⚡） | v0.8 | ✅ |
| トレーニング画面 | v0.8 | ✅ |
| Engine名前空間分離 | v0.85 | ✅ |
| DOM参照排除 | v0.85 | ✅ |
| Seed乱数管理 | v0.85 | ✅ |
| GameState不変化 | v0.85b | ✅ |
| UI直接変更禁止（App bridge） | v0.85b | ✅ |
| tickWeek統合パイプライン | v0.85b | ✅ |

### ❌ 未実装（今後のフェーズ）
| システム | 予定版 | メモ |
|---|---|---|
| ライバル団体AI | **v0.9** | 設計⑨と並行実装 |
| タッグ王座 | v1.0+ | 世界王座のみ実装済み |
| シーズン目標/実績 | v1.0+ | |
| フィニッシャー | v1.0+ | データ構造は設計済み |
| イベントシステム | v1.0+ | |

---

## コード構造（v0.85b）

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
Section 7:    Engine.battle — runMatch()
Section 7A:   Engine.mq — MQ計算
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

### アーキテクチャ5原則

| # | 原則 | 達成版 | 実装パターン |
|---|---|---|---|
| ① | Engine = 純粋関数（DOM禁止） | v0.85 | Engine.*内にdocument参照ゼロ |
| ② | GameState戻り値更新 | v0.85b | 全Engine関数が新stateをreturn |
| ③ | UIはG直接変更禁止 | v0.85b | onclick → App.method() → G={...G} |
| ④ | 乱数seed管理 | v0.85 | SeededRandom、全Math.random()置換 |
| ⑤ | tickWeek統合パイプライン | v0.85b | tickWeek/executeShow/advanceWeek |

---

## コーチアサインシステム（v0.8〜）
| コーチ | 専門 | 担当選手効果 |
|---|---|---|
| 💪 鬼塚道場長 | PW | PW×2.0 / 他×1.2 / PW選択確率40% |
| 💨 飛鳥トレーナー | SP | SP×2.0 / 他×1.2 / SP選択確率40% |
| 🎯 鶴見師範 | TE | TE×2.0 / 他×1.2 / TE選択確率40% |
| 🏃 岩田フィジカルコーチ | ST | ST×2.0 / 他×1.2 / ST選択確率40% |
| 🧠 沢村メンタルコーチ | MN | MN×2.0 / 他×1.2 / MN選択確率40% |
| ⭐ 朝日総合アドバイザー | 全般 | 全ステ×1.4 / 均等20% |
| 🎬 紅林セコンド | MQ | 担当選手の試合MQ+3 |
| 📣 白川マネージャー | POP | 担当選手のプロモ人気+1 |

---

## 次チャットへの引き継ぎ事項

### ロードマップ
```
v0.85b ✅ アーキテクチャ全5原則達成（完了・3,093行）
v0.9   ★ ライバル団体AI ← 次に実装（設計⑨と並行）
v0.95    バランス調整・テストプレイ・UI磨き上げ
v1.0     Patreon配布版（ZIP配布・キャラ画像同梱）
```

### 次チャットで使うファイル（3つ添付）
1. **wrestle-manager-v0_85b.html** — 最新実装（3,093行）
2. **game-system-roadmap.md** — 設計＋実装ロードマップ
3. **wrestle-manager-dev-summary.md** — 本ファイル

### v0.9ライバル団体AIの実装方針
- v0.85bの不変アーキテクチャにより、AI団体もtickWeek()で統一処理可能
- 設計⑨（仕様策定）と実装を同一セッション内で並行する想定
- org-ranking-specのAI団体詳細ロジック確定が必要
- scout-system-spec §5.2のスカウト競合管理が必要

### その他の技術情報
- コーチアサイン: G.coachAssign = {coachId: [charId, ...]}
- 強化練習: c.intensive (bool) + c.intensiveWeeks (連続カウント)
- 施設: FACILITIES定数、G.facilities（1-based）
- セーブ: localStorage、wrestle_manager_save_1〜3 + autosave
- コーチ価格差: 専門150万/40万週、全般80万/30万週、MQ100万/30万週、POP60万/20万週
- **全状態更新はG={...G}パターン**（v0.85b以降）
- **Engine関数は全て純粋関数**（副作用なし、DOM参照なし）
