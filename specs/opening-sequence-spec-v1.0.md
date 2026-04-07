# オープニングシーケンス仕様書 v1.0

> **作成日**: 2026-04-07
> **ステータス**: 実装済み

---

## 1. 概要

ゲーム開始時に「社長就任の儀式」としてのオープニングシーンを挿入し、初期ドラフトUIをクリーム新聞テーマで刷新する。

## 2. フェーズ構成

```
タイトル → 団体設定 → 難易度 → [opening] → [draft] → 本編(manage)
```

- `weekPhase: 'opening'` — 新フェーズ。`confirmDifficulty()` で設定
- `weekPhase: 'draft'` — 既存フェーズ。openingからの自動遷移
- `Engine.createInitialState` の初期値は `'draft'` のまま（auto-sim互換性維持）

## 3. オープニングシーン（weekPhase='opening'）

### 3.1 演出シーケンス（4幕構成・推定30〜40秒）

各幕は黒地フェード＋短文＋クリックで進行。全幕スキップ可能。

| 幕 | 内容 | 動的変数 |
|---|---|---|
| 幕1 | 団体名提示「今、ひとつの団体が旗を揚げようとしている。団体の名は「{orgName}」。」 | `{orgName}` |
| 幕2 | 弱小団体の宣言（後ろ盾なし・期待なし・業界への爪痕） | なし |
| 幕3 | 固定2名の紹介（upper画像左右フェードイン＋名前＋ナレーション） | `{name1}` `{name2}` |
| 幕4 | ドラフトへの導入「さらに3名。立ち上げメンバーを選びに行こう。」 | なし |

### 3.2 フォント

- ナレーション本文: `var(--font-ceremony)` = Shippori Mincho（儀式専用）
- 選手名: `var(--font-body)` = Noto Sans JP（本編連続性）

### 3.3 スキップ

- 右下隅に `>> skip` テキストリンク（半透明、hover時ゴールド）
- ESCキーでもスキップ可
- セーブデータロード時は構造上自動スキップ（opening中はautoSaveが存在しない）

### 3.4 BGM

- `kaimaku` を幕1〜draft画面前半まで継続
- `playForState()`: `weekPhase === 'draft' || weekPhase === 'opening'` で kaimaku

### 3.5 UI非表示

- navBar: opening中は非表示
- topBar: opening中は非表示

## 4. 初期ドラフトUI（weekPhase='draft'）

### 4.1 テーマ

- クリームテーマ（`.draft-cream` クラスを `.app` に付与）
- 新聞風レイアウト（`.draft-paper` ラッパー）
- 赤ヘッダーバー「WRESTLING OBSERVER / SPECIAL EDITION」
- 持ち越しナレーション（明朝体、幕4テキスト）

### 4.2 セクション構成

1. **持ち越しナレーション**: 「さらに3名。立ち上げメンバーを選びに行こう。」
2. **キャプション**: 「数字は推定値。本当の姿は、リングの上でしか分からない。」
3. **FIRST ROSTER / 設立メンバー**: 固定2名のカード（横2列、upper画像、5stat棒グラフ、コーチ所感）
4. **CANDIDATES / 候補選手**: 6名の縦型カード（3列グリッド、クリックでpick/unpick）
5. **確定エリア**: 契約金合計・残り資金・確定ボタン

### 4.3 候補カードのインタラクション

- クリックでtoggleDraftPick（既存ロジック流用）
- picked状態: ゴールドボーダー + 「PICKED」バッジ
- disabled状態: 半透明（枠いっぱい or 資金不足）
- フォーカス展開UIは廃止（カード直接クリック方式に簡略化）

### 4.4 スタイルバッジ色（クリームテーマ用）

| Style | クラス | 色 |
|---|---|---|
| Grappler | `tag-cream-grappler` | 紫系 |
| Striker | `tag-cream-striker` | 赤系 |
| Aerial | `tag-cream-aerial` | 緑系 |
| Submission | `tag-cream-submission` | 橙系 |
| Allround | `tag-cream-allround` | 黄土系 |
| Brawler | `tag-cream-brawler` | 赤系 |

## 5. 完了演出（completeDraft後）

### 5.1 集合写真オーバーレイ

- 全画面ダーク背景（`.completion-overlay`）
- 5名の `image/upper/` を横並び表示（168px幅）
- 並び順: 固定メンバー左 → 選択3名 → 固定メンバー右
- 各メンバーは順次フェードイン（0.3s〜1.1s遅延）
- 固定メンバーの名前はゴールド色

### 5.2 キメ言葉

- `{orgName}` / `始動` の二段組み（明朝体）
- 「始動」は letter-spacing: 0.4em で重厚感

### 5.3 遷移

- オーバーレイクリックで1秒フェードアウト → 本編(manage)へ
- フェードアウト後に autoSave 実行

## 6. 影響範囲

| ファイル | 変更内容 |
|---|---|
| `src/index.html` | Shippori Mincho フォント追加、CSS変数（cream/ceremony）、opening/draft/completion CSS |
| `src/management.js` | `validPhases` に `'opening'` 追加 |
| `src/app.js` | `playForState()` opening対応、`confirmDifficulty()` weekPhase='opening'、`completeDraft()` 集合写真演出 |
| `src/ui-render.js` | `refreshTopBar()` navBar/topBar/cream管理、`renderOpeningScreen()` 新設、draft描画クリームテーマ化 |

## 7. auto-sim互換性

- `Engine.createInitialState` の weekPhase 初期値は `'draft'` のまま（変更なし）
- `'opening'` は `confirmDifficulty()` で上書きされるUI専用フェーズ
- auto-sim 100シーズン ALL CLEAR 確認済み
