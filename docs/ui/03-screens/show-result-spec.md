# 画面：試合後画面 全般（Pattern B 統合仕様）

**ファイル**：`docs/ui/03-screens/show-result.md`
**最終更新**：2026-04-23 / v1.0
**実装状況**：モックアップ確定・Phase別実装待ち（ハンドオフ: `plans/post-match-redesign-handoff.md`）

---

## 0. このドキュメントのスコープ

試合後にプレイヤーに見せる **10種類の結果画面** を、Stage カテゴリの Pattern B "Broadcast Scoreboard" に統一する。モックアップ（`docs/ui/mockups/show-result-pattern-b.html`）が確定した設計の正本。本仕様書はその設計ルールを文章化したもの。

### 対象画面（全10画面 / Phase別）

| # | Phase | 画面 | 関数 | 場所 |
|---|---|---|---|---|
| 1 | 1 | 通常興行 試合結果 | `renderShowResult()` | `ui-common.js:3595` |
| 2 | 1 | 特別興行 試合結果 | 同上（`isSpecialShow()` 分岐） | 同上 |
| 3 | 2 | PPV GRAND FINAL 試合結果 | `renderPPVResult()` | `ui-common.js:4973` |
| 4 | 2 | PPV TV観戦 結果 | `renderPPVTVResult()` | `ui-common.js:5263` |
| 5 | 3 | 対抗戦 最終結果 | `renderWarFinalResult()` | `ui-common.js:439` |
| 6 | 3 | 対抗戦 試合進行画面 | `renderWarMatchPreview()` | `ui-common.js:286` |
| 7 | 4 | JT 各試合結果 | `renderJuniorTournamentMatchResult()` | `ui-common.js:10117` |
| 8 | 4 | JT 優勝発表 | `renderJuniorTournamentResult()` | `ui-common.js:10234` |
| 9 | 4 | B3 挑戦状 結果 | `_renderB3MatchResult()` | `ui-common.js:8018` |
| 10 | 4 | B2 深刻対立 決着結果 | `_renderB2MatchResult()` | `ui-common.js:8214` |

**スコープ外**：battle-engine.html / tag-battle.html 内の試合中勝利演出（`victoryOv`）— 別レイヤーのため今回は対象外。

---

## 1. 基本属性

| 項目 | 値 |
|---|---|
| 所属カテゴリ | **Stage**（純黒 `#060606`） |
| パネル様式 | Dark Panel のみ（Cream Panel 禁止 — 階層1 §1-4 原則） |
| レイアウトパターン | **P7 Theatrical**（トップバー・ナビバー非表示、オーバーレイ全画面テイクオーバー） |
| 所属シーケンス | S1 興行 / S2 PPV / S3 対抗戦 / S4 JT / 単発イベント（B2, B3） |
| 使用フォント | Noto Sans JP（本文）+ Bebas Neue（数値・タイトル）+ Oswald（ラベル） |
| 実装ファイル | `src/ui-common.js` の各 render 関数、`src/index.html` の CSS と `#showResultOverlay` HTML |

---

## 2. 目的

試合の結果を **TV中継のスコアボードのような明快さ** で伝える。情報密度を高めつつ、メインイベントや勝者・セリフなどのドラマ要素は視覚的に強調する。

- **情報の一目把握性**：スクロール少なめで興行全体の結果を見渡せる
- **ドラマの演出**：セリフが発動する試合では肖像の真上に吹き出しを配置し、選手の感情が「画面の中で生きている」ように見せる
- **興行の格差別化**：通常/特別/PPV/対抗戦それぞれに格の違いを明示する視覚バリアント

### 三本柱との整合性

- **キャラの人生を覗き見る**：肖像真上のセリフバブルで、試合直後の感情を直接的に映す
- **数値は嘘をつかない**：OVR・MQ・HP・動員率などの数値を明確に提示。ごまかさない
- **社長は舞台を作る人**：結果を直接操作する要素は一切なし。観察者の視点

---

## 3. 遷移

### 入ってくる経路（画面別）

| 画面 | 入場トリガー |
|---|---|
| #1-2 通常/特別興行 | S1 興行シーケンスの試合消化後 |
| #3 PPV | S2 PPV シーケンスの試合消化後 |
| #4 PPV TV観戦 | orgPop < 30 時の PPV週 |
| #5 対抗戦最終 | S3 War 全5試合終了後 |
| #6 対抗戦進行 | S3 War の試合間（次試合待ち） |
| #7 JT各試合 | S4 JT の各試合終了後 |
| #8 JT優勝 | S4 JT 決勝終了後 |
| #9 B3挑戦状 | B3 イベント受諾 → 試合消化後 |
| #10 B2対立 | B2 イベント「試合決着」選択後 |

### 出ていく経路

基本：画面下部の「結果を確認 →」ボタン（または対応するラベル）で次のフェーズへ。

| 画面 | 出場先 |
|---|---|
| #1-2 | 週終了処理 → 翌週の「今週」画面 |
| #3 | オフシーズン（年末表彰式へ） |
| #4 | 翌週の「今週」画面 |
| #5 | 勝利時は対抗戦後処理（勝利セリフチェーン）→ 翌週 |
| #6 | 次試合ボタン → 次の #6 または #5 |
| #7 | 次試合ボタン → 次の #7 または #8 |
| #8 | 翌週 |
| #9-10 | イベント終了 → 週処理へ戻る |

**戻るボタン**：なし（全画面 forward のみ）

---

## 4. 共通フレームワーク（Pattern B 基礎）

モックアップ `docs/ui/mockups/show-result-pattern-b.html` を正本とする。以下は骨格の説明。

### 4-1 画面構造

```
┌─ .pb-overlay（Stage 純黒 #060606 + ほのかな上部金スポットライト） ─┐
│ ┌─ .pb-container（max-width: 960px, 中央寄せ） ──────────────────┐ │
│ │ ┌─ .pb-banner（上部バナー） ─────────────────────────────────┐ │ │
│ │ │   [● ON AIR バッジ / ⭐ MONTHLY SPECIAL 等]                │ │ │
│ │ │   興行名（Bebas Neue 32px）                                 │ │ │
│ │ │   サブ情報（Oswald UPPERCASE）                              │ │ │
│ │ └────────────────────────────────────────────────────────────┘ │ │
│ │ ┌─ .pb-score-strip（水平スコアボード） ──────────────────────┐ │ │
│ │ │ [動員+バー+評価] [平均MQ] [Heat] [試合数] [負傷数]          │ │ │
│ │ └────────────────────────────────────────────────────────────┘ │ │
│ │ ┌─ .pb-divider「MATCH RESULTS」 ──────────────────────────────┐ │ │
│ │ │ ┌─ .pb-mrow.is-main（メインイベント行） ─────────────────┐ │ │ │
│ │ │ │ [★ MAIN EVENT ラベル（左上 absolute）]                 │ │ │ │
│ │ │ │ [左選手+肖像(+バブル)] [VS/結果] [右選手+肖像(+バブル)] │ │ │ │
│ │ │ │ [タグ行（タイトル、因縁など）]                          │ │ │ │
│ │ │ │ [HP mini bar]                                           │ │ │ │
│ │ │ │ [負傷報告（該当選手に）]                                │ │ │ │
│ │ │ └────────────────────────────────────────────────────────┘ │ │ │
│ │ │ ┌─ .pb-mrow（通常試合行） ───────────────────────────────┐ │ │ │
│ │ │ │ [左選手] [VS/結果] [右選手] / [tags] / [HP]             │ │ │ │
│ │ │ └────────────────────────────────────────────────────────┘ │ │ │
│ │ └────────────────────────────────────────────────────────────┘ │ │
│ │ ┌─ .pb-footer（Heat + 閉じるボタン） ────────────────────────┐ │ │
│ │ └────────────────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 4-2 主要コンポーネント一覧

| コンポーネント | 役割 | 備考 |
|---|---|---|
| `.pb-overlay` | 全画面テイクオーバー | `inset: 0`, Stage 純黒 + 上部ビネット |
| `.pb-container` | 中央寄せコンテナ | `max-width: 960px` |
| `.pb-banner` | 興行タイトルバナー | `● ON AIR` バッジ + 興行名 + サブ情報 |
| `.pb-live` | ライブバッジ | 通常 `● ON AIR`、特別興行 `⭐ MONTHLY SPECIAL`、PPV `🏆 GRAND FINAL`、対抗戦 `⚔ WAR`、JT `🥇 TOURNAMENT` |
| `.pb-score-strip` | 水平スコアボード | 5カラム（動員/MQ/Heat/試合数/負傷数）。画面により項目差し替え |
| `.pb-score-cell.is-attend` | 動員セル | 動員数 + **プログレスバー** + 会場名 + 評価ラベル |
| `.pb-score-attend-bar` | 動員プログレスバー | 動員率で色変化（5段階） |
| `.pb-divider` | セクション区切り | `MATCH RESULTS` / `MAIN EVENT` / `UNDERCARD` などのラベル |
| `.pb-mrow` | 試合行 | 3カラムグリッド（左選手 / 結果 / 右選手） |
| `.pb-mrow.is-main` | メインイベント行 | 金ボーダー左 + 金グラデ背景 + `★ MAIN EVENT` ラベル |
| `.pb-mrow.has-dialogue` | セリフあり試合行 | padding-top 拡張（バブル分の余白確保） |
| `.pb-portrait-wrap` | 肖像ラッパー | position:relative（バブル配置アンカー） |
| `.pb-portrait` | 肖像枠 | 86×129（通常）/108×162（メイン）、upper 画像 |
| `.pb-dialogue` | セリフバブル | 肖像の真上に absolute 配置、しっぽ下向き |
| `.pb-dialogue-speaker` | 発言者ラベル | 勝者=金 / 敗者=オレンジ赤 / 引分=オレンジ |
| `.pb-fighter-ovr` | OVR 表示 | Bebas Neue 38px（メイン勝者は 46px） |
| `.pb-result` | 中央結果カラム | VS + 🏆 勝者 + フィニッシュ + ターン + MQ |
| `.pb-tag` | 試合タグバッジ | `is-title`（金）/`is-rivalry`（オレンジ赤）/`is-first`（青）/`is-spotlight`（薄金） |
| `.pb-hp-mini` | HP ミニバー | 試合行最下部、左右対称 |
| `.pb-injury` | 負傷バッジ | 試合行内（該当試合の選手のみ）。画面下部の独立セクションではない |
| `.pb-footer` | フッター | Heat 表示 + 閉じるボタン |

### 4-3 タイポグラフィ

- **Bebas Neue**：興行タイトル（32-36px）、動員数（32px）、OVR値（38-46px）、VS（16px）、MQ値（16-20px）、各スコアセル値（24px）
- **Oswald**：ライブバッジ、スコアラベル、試合ラベル、Winner/Finish/MQラベル、Tag、発言者、HP label、結果ボタン
- **Noto Sans JP**：選手名、フィニッシュ技名、セリフ本文、ログ本文、負傷情報

### 4-4 カラートークン（CSSカスタムプロパティ）

```css
--stage-bg:         #060606;
--stage-panel:      rgba(20,18,15,0.62);
--stage-panel-deep: rgba(10,9,7,0.80);
--stage-border:     rgba(200,190,170,0.08);
--stage-border-main: rgba(212,168,67,0.42);

--gold:       #d4a843;
--gold-light: #f0d078;
--gold-deep:  #b8912e;

--c-positive: #6fa28c;  /* 勝者肖像ボーダー強調には使わず、動員"大入り"などに使用 */
--c-warning:  #d07a3e;  /* 引分・まずまず */
--c-negative: #c0524a;  /* 負傷・ガラガラ */
--c-info:     #6d94b8;  /* 初顔合わせ・タッグ・盛況 */
--c-rivalry:  #e17055;  /* 因縁 */
```

**ハードコード16進カラー禁止**（階層1 §1-6 原則）。上記トークンまたは既存の `--gold*` `--text-*` を使用。

### 4-5 セリフバブル（Dialogue）詳細

**配置**：肖像の真上（`bottom: calc(100% + 10px)`）、中央揃え（`left: 50%; transform: translateX(-50%)`）。しっぽは **下向き**（肖像を指す）。

**構造**：
```html
<div class="pb-portrait-wrap">
  <div class="pb-dialogue">
    <div class="pb-dialogue-speaker is-winner">🏆 赤沼 紗稀</div>
    「まだ私の方が上だ」
  </div>
  <div class="pb-portrait">
    <img src="[upper画像]" alt="[選手名]">
  </div>
</div>
```

**サイズ**：`min-width: 150px; max-width: 220px;`。セリフが長い場合は折り返し。

**発動ルール**（既存実装準拠）：

| 発動条件 | 発言者 | セリフソース |
|---|---|---|
| 因縁 30+ の試合 | 勝者・敗者ともに | `RIVALRY_MATCH_REACTION.winnerLines` / `.loserLines` |
| 大番狂わせ因縁 | 勝者・敗者ともに | `UPSET_RIVALRY_LINES` |
| PPV メインイベント | 勝者 | `BT_HINT_LINES` + コーチ称賛バブル |
| 対抗戦 勝者 | 勝者 | `WAR_VICTORY_LINES[personality][archetype]` |
| JT 優勝 | 優勝者 | `getJuniorTournamentLine('champion', ...)` |
| 初顔合わせ | 両者（試合前ポップアップで発動、試合後は基本なし） | `FIRST_MEET_LINES`（試合結果画面では非表示） |

**発動しない試合**：セリフ条件を満たさない通常の試合では `.pb-portrait-wrap` 内に `.pb-dialogue` を出力しない（`.pb-mrow.has-dialogue` クラスも付けない → padding-top 拡張なし）。

### 4-6 動員バー色分けルール

`OCCUPANCY_BONUS` テーブル（`data.js:1173`）に準拠し、`.pb-score-attend-bar-fill` のクラスで表現：

| 動員率 | ラベル | CSS クラス | 色 |
|---|---|---|---|
| ≥ 95% | 🔥 超満員！ | `.is-sellout` | 金グラデ（`--gold-deep` → `--gold-light`） |
| ≥ 80% | ✨ 大入り！ | `.is-good` | 緑 `--c-positive` |
| ≥ 60% | 👍 盛況 | `.is-neutral` | 青 `--c-info` |
| ≥ 40% | ➖ まずまず | `.is-weak` | オレンジ `--c-warning` |
| < 40% | 😰 ガラガラ | `.is-empty` | 赤 `--c-negative` |

動員セルの評価ラベル（`.pb-score-attend-rating`）の色も同じクラス名体系で揃える。

---

## 5. バリアント別仕様

### 5-1 #1 通常興行（Weekly Show）

**バナー**：`● ON AIR` バッジ + `第 N 回 定期興行`（Bebas Neue 32px 金）
**スコアボード**：動員 / 平均MQ / Heat / 試合数 / 負傷数
**試合行**：メインイベント（`.is-main`）+ 第N試合（昇順）
**セリフ**：因縁試合のみ発動
**フッター**：Heat表示 + 「結果を確認 →」

モックアップ V1 参照。

### 5-2 #2 特別興行（Monthly Special）

**バナー**：`⭐ MONTHLY SPECIAL` バッジ（薄金ベース） + `特 別 興 行`（金グラデ文字、36px）
**スコアボード**：同上
**試合行**：同上、試合枠+1（最大4試合）
**セリフ**：同上
**フッター**：同上

モックアップ V2 参照。

### 5-3 #3 PPV GRAND FINAL

**バナー**：`🏆 GRAND FINAL` バッジ（金強調） + PPV名（例「`DREAM CLASH 2026`」、36-40px 金グラデ+光彩）
**スコアボード**：動員 / 平均MQ / Best MQ / Heat / 試合数（7試合固定）
**試合行**：
- 表示順：メイン（頂上決戦）→ 第6試合 → ... → 第1試合（逆順）
- メイン試合の上に `.pb-divider` で `🏆 MAIN EVENT — 頂上決戦`
- 第6試合の上に `.pb-divider` で `UNDERCARD`
- 頂上決戦は `.pb-mrow.is-main.is-ppv` で最強装飾（金ボーダー上下、金背景強め）
**セリフ**：頂上決戦勝者は必ず発動。コーチ称賛バブル（`_ppvCoachBubble` 相当）も肖像側に表示 → コーチ用に専用スロット（`.pb-dialogue.is-coach`、薄青系背景）を用意
**フッター**：対戦pt変動表示 + Heat変動表示 + 「オフシーズンへ →」

**未決事項**：コーチ称賛バブルを選手バブルと同じ位置（肖像真上）に重ねるか、別の場所（試合行下部）に置くかは実装時にモックアップで確認。暫定：**試合行下部の独立ブロック `.pb-coach-praise`** とする。

### 5-4 #4 PPV TV観戦（PPV TV Result）

**バナー**：`📺 PPV 観戦` バッジ（青系 `--c-info` ベース） + PPV名（36px 金、プレイヤー不参加なので光彩なし）
**スコアボード**：動員 / 平均MQ / Best MQ / （Heat は自団体分のみ表示）
**試合行**：プレイヤー選手が不在 → すべての試合が観戦対象。所属団体名を `.pb-fighter-meta` に表示（例：`BBW` / `NXT` など）
**セリフ**：頂上決戦勝者のみ発動（他団体の選手だが演出上は同じフォーマット）
**フッター**：「結果を確認 →」

### 5-5 #5 対抗戦 最終結果（War Final）

**バナー**：`⚔ WAR` バッジ（敵団体カラー背景） + `対 抗 戦 結 果`（36px 金 or プレイヤー団体色）
**スコアボード**：**対抗戦専用構成**
- Cell 1（動員）：通常通り
- Cell 2：`我方 N 勝` / `敵方 M 勝` の対抗戦スコア（Bebas Neue 大型）
- Cell 3：勝敗結果（🏆 勝ち越し / ⚖ 引き分け / 💀 負け越し、色分け）
- Cell 4：平均MQ
- Cell 5：Heat変動
**試合行**：5試合をメインイベントから降順表示。**各試合行に `.pb-fighter-team-color` で所属団体色（プレイヤー側は青、敵側は敵団体色）**
**セリフ**：**各試合の勝者にセリフが発動**（`WAR_VICTORY_LINES`）。バブルは通常通り肖像真上。
**フッター**：敵エースのセリフセクション（既存 `.ace-area` を Pattern B 向けに再構成） + 「閉じる」ボタン

### 5-6 #6 対抗戦 試合進行画面（War Progress）

**バナー**：同 #5
**スコアボード**：動員 / 現在のスコア（例 `2-1`） / 残り試合数 / 次試合選手名
**試合行**：
- **完了試合**：`.pb-mrow.is-resolved`（コンパクト版、padding 小さめ、選手の勝敗結果のみ + 勝利セリフ1つ）
- **次の試合**：`.pb-mrow.is-upcoming`（大判、選手対峙、試合前セリフ両者）
- **未消化試合**：`.pb-mrow.is-pending`（超コンパクト、選手名のみ灰色表示）
**フッター**：「次の試合へ →」

### 5-7 #7 JT 各試合結果（JT Match Result）

**バナー**：`🥇 JUNIOR TOURNAMENT` バッジ + ラウンド名（`準々決勝` / `準決勝` / `🏆 決勝`）
**スコアボード**：**JT 専用構成**
- Cell 1（ブラケット縮小表示、4つの枠の進行状況を小さく）
- Cell 2：試合ラベル（例：`Match 3 / 7`）
- Cell 3：MQ
- Cell 4：フィニッシュ技カテゴリ
**試合行**：**1試合のみ**を大きく展開（`.pb-mrow.is-main.is-jt`）。両選手肖像、OVR、VS、結果、セリフ
**セリフ**：勝者はセリフ発動（`getJuniorTournamentLine('postMatchWin', ...)`）
**フッター**：「次の試合へ →」（決勝の場合「優勝発表へ →」）

### 5-8 #8 JT 優勝発表（JT Champion）

**バナー**：`🏆 JT CHAMPION` バッジ（金強調） + 「第 N 回 ジュニアトーナメント 優勝」
**スコアボード**：**優勝者専用構成**
- Cell 1（優勝者動員 + 全試合の動員平均）
- Cell 2：優勝者通算MQ
- Cell 3：勝ち上がりパス（例 `QF → SF → F`）
- Cell 4：賞金額（`¥120万`）
- Cell 5：新王者 OVR
**優勝者カード**：`.pb-mrow.is-main.is-champion` を1つだけ表示
- 中央に優勝者肖像を最大サイズ（150×225）で表示
- 🏆 アイコン大型、`CHAMPION` ラベル（Bebas Neue 大）、優勝者名（24px）
- 所属団体名
- 優勝スピーチバブル（肖像真上、金枠強調）
- 賞金 `¥120万` 表示
**準優勝・3-4位**：`.pb-mrow.is-sub.is-runnerup` / `.is-semifinalist` として下部にコンパクト表示
**フッター**：「閉じる」

### 5-9 #9 B3 挑戦状 結果

**バナー**：`⚔ CHALLENGE MATCH` バッジ（敵団体色） + `挑戦状 — 結果`
**スコアボード**：**簡略構成**（試合数1の単発イベント）
- Cell 1：対戦団体名
- Cell 2：結果（🏆 WIN / 💀 LOSE / ⚖ DRAW）
- Cell 3：MQ
- Cell 4：バフ獲得有無
**試合行**：1試合のみ、`.pb-mrow.is-main.is-b3`
- プレイヤー選手 vs 他団体選手
- 所属団体を `.pb-fighter-meta` に表示
- セリフは勝者のみ発動（既存 `winLine` ロジック）
**フッター**：バフ詳細（あれば）+ 「了解」ボタン

### 5-10 #10 B2 深刻対立 決着結果

**バナー**：`💥 CONFLICT RESOLUTION` バッジ（紫系） + `決着の試合 — 結果`
**スコアボード**：**簡略構成**
- Cell 1：試合前の介入選択（激励 / 放置）
- Cell 2：結果（どちらが勝ったか）
- Cell 3：MQ
- Cell 4：Bond/Rivalry 変動
**試合行**：1試合のみ、`.pb-mrow.is-main.is-b2`
- 両選手ロスター内、所属は同じなので `.pb-fighter-meta` は省略
- セリフ：両者発動（既存ロジック）
**フッター**：関係性変動サマリ + 「了解」ボタン

---

## 6. 画面ごとの特有ルール

### 6-1 試合行の並び順

| 画面 | 並び順 |
|---|---|
| #1-2, #3（PPV）, #5（War）, #7（JT）| メインイベント（上） → 前座（降順） |
| #4（PPV TV）| 同上 |
| #6（War Progress）| 進行順（第1試合 → 最終試合）だが、完了済みは上部にコンパクト、次の試合が中央 |
| #8（JT Champion）| 優勝者カード単独、準優勝・3-4位は下部 |
| #9, #10 | 1試合のみ |

### 6-2 タグバッジの出現パターン

| タグ | 色クラス | 発動条件 |
|---|---|---|
| `🏆 タイトルマッチ` | `.is-title` | `r.isTitleMatch === true` |
| `⚔ 因縁` | `.is-rivalry` | `r.rivalryBonus` 存在 |
| `⚡ 決着！` | `.is-rivalry`（強調） | `r.rivalryResolved === true` |
| `✨ 初顔合わせ` / `😐 フレッシュ度低` | `.is-first` / `.is-stale` | `r.freshnessBonus` で判定 |
| `📺 取材中` | `.is-spotlight` | `G.mediaSpotlight` が該当選手 |
| `TAG MATCH` | `.is-tag` | `r.matchType === 'tag'` |

複数タグは横並び（flex + wrap）。メインイベントは通常3-4個、通常試合は0-2個。

### 6-3 ホバー効果

- `.pb-mrow:hover`：背景が微かに明るくなる（`rgba(255,255,255,0.012)` → `0.02`）
- `.pb-close-btn:hover`：シャドウ強化、transform 軽微

### 6-4 アニメーション

- オーバーレイ出現：フェードイン 400ms
- スコアボードのバー：`transition: width .6s ease`（動員バー）
- メインイベントの金スポットライト：静的（アニメーションなし）

### 6-5 試合ログ（collapsible）

Pattern A 時代の `<details>` は Pattern B では削除方向。試合行をコンパクトに保つため、ログが必要なら将来的に独立ボタンで別オーバーレイを開く方式を検討。**暫定：ログ表示は省略（必要なら Phase 5 で追加検討）**

**注意**：現在の関数はログ表示機能を含んでいる。Phase 実装時に削除するかユーザーに確認してから進める。

---

## 7. 状態バリエーション

| 状態 | 表示 |
|---|---|
| 通常 | 上記レイアウト |
| 試合数0 | 想定外（興行はNG）。ガード文を入れる |
| 動員0 | 試合行は表示、スコアストリップは 0/xx cap で表示 |
| 負傷0 | Injuries セル「0」、試合行内の `.pb-injury` は非表示 |
| ログ破損時 | `<details>` ブロック自体を非出力 |

---

## 8. 関連トークン

階層1 Foundations に以下を追加する必要がある（未定義のため）：

```css
/* Stage 専用トークン（階層1 §1-4 で未定義のもの） */
--stage-bg:         #060606;
--stage-bg-deep:    #000000;
--stage-panel:      rgba(20,18,15,0.62);
--stage-panel-deep: rgba(10,9,7,0.80);
--stage-border:     rgba(200,190,170,0.08);
--stage-border-lit: rgba(212,168,67,0.22);
--stage-border-main: rgba(212,168,67,0.42);
--stage-text-main:  #e8e6e0;
--stage-text-sub:   rgba(232,230,224,0.55);
--stage-text-dim:   rgba(232,230,224,0.28);
--stage-text-quiet: rgba(232,230,224,0.16);
```

既存の `--gold`, `--gold-light`, `--gold-deep` は既に定義されているのでそのまま使用。`--c-*` 系は既存の派閥色 `--accent-faction-*` や `--accent-hostility` と整合するように新規追加：

```css
--c-positive: #6fa28c;  /* 既存 --accent-faction-4 と同じ値、別名として再定義 */
--c-warning:  #d07a3e;  /* 既存 --accent-hostility と同じ値、別名として再定義 */
--c-negative: #c0524a;  /* 新規 */
--c-info:     #6d94b8;  /* 既存 --accent-faction-2 と同じ値、別名として再定義 */
--c-rivalry:  #e17055;  /* 既存 --color-rivalry と同じ値 */
```

**実装方針**：既存トークンとの重複を避けるため、`--c-*` は別名として `:root` で既存トークンをエイリアスするのが良い：

```css
--c-positive: var(--accent-faction-4);
--c-warning:  var(--accent-hostility);
--c-negative: #c0524a;  /* 新規 */
--c-info:     var(--accent-faction-2);
--c-rivalry:  var(--color-rivalry);
```

---

## 9. 階層1・2への参照

- **階層1 §1-2**：Stage カテゴリ（純黒背景、Cream Panel 禁止）
- **階層1 §1-4**：Stage トークン体系（本仕様で具体化）
- **階層1 §1-6**：ハードコード16進カラー禁止
- **階層1 §1-7**：タイポグラフィ3書体（Noto Sans JP / Bebas Neue / Oswald）
- **階層2 §2-A-2〜4**：トップバー・ナビバー非表示（P7 Theatrical）
- **階層2 §2-B P7**：Theatrical パターン（全画面テイクオーバー、中央寄せ）
- **階層2 §2-C S1-S4**：試合後画面が属するシーケンス

---

## 10. モックアップ

**正本**：`docs/ui/mockups/show-result-pattern-b.html`

上部スイッチャーで V1（通常興行）と V2（特別興行 + 因縁セリフ）を切替可能。Phase 実装時は必ずモックアップを開いて CSS の値・余白・色を参照すること。

---

## 11. 未決事項

| ID | 項目 | 決め方 |
|---|---|---|
| U-01 | 試合ログ `<details>` の継続/廃止 | Phase 1 実装時にユーザーに確認。暫定は**継続**（Pattern B 風にスタイル調整） |
| U-02 | PPV コーチ称賛バブルの位置 | Phase 2 実装時にモックアップで確認。暫定：試合行下部の独立ブロック |
| U-03 | 対抗戦 #5 の敵エースセリフセクション | Phase 3 実装時に Pattern B 風にモックアップ更新。暫定：既存レイアウトを Stage カラーに寄せる |
| U-04 | JT 優勝発表 #8 で「Ceremony 化」するか | 決定：**Pattern B 準拠で実装**（Ceremony化しない）。将来的にアップグレードの余地あり |
| U-05 | 試合行内の負傷バッジの配置 | モックアップ V2 準拠（試合行内下部、該当選手のみ）|

---

*v1.0 / 2026-04-23 / モックアップ確定版（show-result-pattern-b.html 参照）*
