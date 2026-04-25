# 新聞・団体比較画面 確定UI仕様 v2.0

最終更新: 2026-04-26

新聞画面(DBサブタブ「📰 新聞」, `_dbSubTab=5`)、団体比較画面(DBサブタブ「団体比較」, `_dbSubTab=2`)、および因縁列伝3面(`_dbSubTab=8`)の確定UI仕様。Phase 1〜2 で確立した共通CSSトークン群と、Phase 3 で完了した重複定義整理を含む。

## 1. 共通CSSトークン

`src/index.html` のグローバル CSS に集約。新聞/団体比較/因縁列伝のいずれの画面からも参照される。

| クラス | 用途 | 主要プロパティ |
|---|---|---|
| `.paper-header` | 新聞ヘッダー(週刊グラップル) | 赤グラデ背景, padding 10px 20px |
| `.page-nav` | 1面/2面/3面ボタン群 | flex center, gap 8px, max-width 560px |
| `.sec-label` | セクション見出し(銀) | Oswald, font-size:11px, color:#5b4b34, border-left:3px solid #8b1a1a, padding-left:8px |
| `.sec-label-gold` | セクション見出し(金) | Oswald, font-size:12px, color:#6a4a10, border-left:3px solid #d4a82a, padding-left:10px |
| `.kuroda-block` | 黒田寸評ブロック | flex, padding 6px 8px, ベージュ背景 |
| `.newspaper-photo-frame` | 一面記事の額装写真 | border:6px double rgba(120,84,39,0.4), box-shadow, 200×240(一面) |
| `.other-org-news-grid` | 他団体ニュース2カラム | grid auto-fill, minmax(280px,1fr) |
| `.org-bar-radar` | 団体比較4軸バー | grid 1fr |
| `.db-cmp-vs-mark-circle` | 中央VS円章 | desktop: position:absolute 64×64, tablet(≤900px): relative 48×48 |

**Phase 3 整理**: `.rivalry-history .sec-label` / `.rivalry-relations .sec-label-gold` のスコープ付き重複定義を削除し、グローバル定義に統一(2026-04-26)。

## 2. 新聞画面 1面 構造

`_renderDbNewspaper()` (ui-render.js L5395-) が表示する。アーカイブナビ → ページナビ → 本文の順。

本文の表示順:

1. **paper-header** — 「週刊グラップル」+ シーズン/週
2. **一面記事 (`topStory`)** — 額装写真 200×240(`.newspaper-photo-frame`) + 見出し + 本文。他団体story時は KURODA_NEWS_COMMENT による寸評ブロックを下部に追加
3. **自団体興行結果 (`playerShowData`)** — 該当週のみ。VS写真80px(変更なし)+ HPバー + 興行ダイジェスト表
4. **他団体ニュース (`subStories`)** — 2カラムグリッド(`.other-org-news-grid`)、各カードに portrait + 見出し + 黒田寸評(`.kuroda-block`)
5. **次回展望 (`preview`)** — `_renderNewspaperPreview()`

## 3. ダイジェストテーブル

`_renderNewspaperDigest()` (ui-render.js L5772-)。テーブル形式 5列構成:

| 列 | 内容 | 幅 |
|---|---|---|
| `.ndt-num` | 試合番号 | auto |
| `.ndt-badge` | 王座戦/番狂わせバッジ | auto |
| `.ndt-card` | 顔写真 + 名前 + vs/DRAW + 名前 + 顔写真 | 1fr |
| `.ndt-mq` | MQ値 (high/mid/low クラス) | auto |
| `.ndt-rating` | ★1〜★5 (実機 70px) | 64px ベース |

- `.ndt-port` サイズ: **48×48px**(Phase 3 で確定。@max-width:600px で 36×36px)
- 寸評行: `<td colspan="2"></td><td colspan="3" class="ndt-comment">` で5列にまたがる。pool は `NEWSPAPER_DIGEST_COMMENTS.{great|good|average|poor|bad|draw|upset|dominant|titleMatch}`
- ★算出: `mqDiff = m.mq - expectedMQ` から `+15→★5 / +5→★4 / -4→★3 / -15→★2 / それ以下→★1`、`isDraw` は ★3 固定
- `expectedMQ` は `EXPECTED_MQ_BY_VENUE[venueIdx].base + orgPop * popCoef` (上限 95)

## 4. 団体比較画面: 4軸バー型レーダー

`_renderDbOrgCompare()` (ui-render.js L7816-)。

軸定義:

| key | label | スコア源 (`Engine.database.getOrgCompareScores`) |
|---|---|---|
| `ace` | エース力 | エース1名のOVRに連動 |
| `depth` | 層の厚み | 上位N名平均OVR |
| `popularity` | 集客力 | orgPop |
| `starPower` | タイトル力 | 保有タイトル数+所属王者の威厳 |

- バー描画: 左(プレイヤー) ←→ 中央(軸名+`+N`/`-N`) ←→ 右(ライバル) の対称構造
- 中央 VS円章 (`.db-cmp-vs-mark-circle`) は左右カードの中央上に重ねる(desktop)。tablet 以下では position:relative 縦並びにフォールバック
- 値ソース: `Engine.database.getOrgCompareAnalysis(state, orgId)` の `playerScores` / `rivalScores` / `diffs`

**既知の妥協点**: タイトル力(`starPower`)は当面 `playerScores.starPower` をそのまま使用。Phase 3 引き継ぎで検討された「`legacyScore/50`」式は採用せず(auto-sim 影響回避)。将来の調整は別タスク。

## 5. KURODA テキスト接続点

`src/kuroda-text.js` 配下の各配列を Engine.rng で seeded pick する。

| 用途 | 配列 | seed |
|---|---|---|
| 一面記事の他団体寸評 | `KURODA_NEWS_COMMENT[storyType]` | `Engine.rng.derive(season, week, 0xC0DA)` |
| 他団体ニュース2カラム寸評 | `KURODA_NEWS_COMMENT[storyType]` | `Engine.rng.derive(season, week, idx, 0xC0DC)` |
| 興行総合評価 | `KURODA_SHOW_RATING.stars{0-5}` | `Engine.rng.derive(season, week, 0xC5A1)` |
| ダイジェスト寸評 | `NEWSPAPER_DIGEST_COMMENTS.{rating}` | `Engine.rng.derive(season, week, idx, 0xD1C0)` |

各 pool は `(ctx) => string` の関数配列。文体ガイドは `docs/archive/handoff-newspaper-rivalry-redesign-v1.md` の「黒田幸子の文体設計」に従う。

## 6. 因縁列伝3面

`_renderDbRivalry()` が `.rivalry-history` / `.rivalry-relations` 配下で `.sec-label` / `.sec-label-gold` を直接利用。Phase 3 整理によりスコープ付き定義はグローバルに統合済み(視覚同値、リグレッションなし)。

詳細仕様は `specs/rivalry-chronicle-spec-v1.0.md` を参照。

## 7. Phase 3 で見送られた拡張(将来タスク候補)

- **`.ndt-port` 130px + カードレイアウト化** — テーブル構造を `<div class="ndt-row">` の grid に切替する案。視覚インパクトは大きいが影響範囲が広く、Phase 3 では 48px 維持を選択
- **`starPower` 計算式の刷新** — `legacyScore/50` 等の動的計算。auto-sim 検証必須のため別タスク
- **playerShow セクション内の VS写真 80px → 大型化** — Phase 1-2 の対象外、現行維持

## 8. 実装ファイル

| ファイル | 役割 |
|---|---|
| `src/index.html` | 共通CSSトークン定義(L1138付近〜) |
| `src/ui-render.js` | 新聞 (L5395-) / 団体比較 (L7400-) / 因縁列伝 (L8000+) のレンダー |
| `src/kuroda-text.js` | KURODA_* テキスト配列群 |
| `src/data.js` | `NEWSPAPER_DIGEST_COMMENTS` 定義 |
