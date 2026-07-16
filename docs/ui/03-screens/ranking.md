# 画面：団体ランキング（v1.0 — A案 Office標準）

**ファイル**：`docs/ui/03-screens/ranking.md`
**最終更新**：2026-07-16 / v1.0
**実装状況**：完了（2026-07-16。CSSのみ差し替え、`renderRanking()` ロジック非変更。死にCSS(.org-card系)削除・--th-* トークン撤去済み）
**モックアップ正本**：`docs/ui/mockups/ranking-restyle-A-office.html`（A案・採用決定 2026-07-16）
**旧版**：v0.9（`docs/ui/mockups/ranking-redesign-v0.9-for-mockups-dir.html`、金銀銅鋼メタリック様式）

---

## 0. スコープと経緯

団体ランキング画面（`#screen-ranking`）の UI 様式を定義する。

v0.9 は「TV番組のチャンピオンシップ表」様式（金銀銅鋼のメタリック順位カラー・clip-path切り角・寒色寄り黒 `--th-*`・30px巨大マスト）だったが、**他のOffice画面（データベース・収支等）からの視覚的乖離が大きい**ため、v1.0 で Office 標準様式へ再スタイルする。

- **変えるもの**：色使い・フォント運用・角の処理（デザインのみ）
- **変えないもの**：セクション構造・文章・画像・データ接続・`Engine.ranking.updateRankings(G)`・`renderRanking()` の出力DOM

---

## 1. 基本属性

| 項目 | 値 |
|---|---|
| 所属カテゴリ | **Office**（暖茶背景 `var(--bg-dark)`） |
| パネル様式 | Dark Panel（`--panel-bg` / `--card-bg`。Cream Panel は使わない） |
| 角の処理 | **角丸 6px**（clip-path 切り角は廃止） |
| レイアウトパターン | P1 Catalog 派生（popup フレーム + 3〜4セクション縦積み） |
| 使用フォント | Noto Sans JP（本文）+ Bebas Neue（数値）+ Oswald（ラベル） |
| 実装ファイル | `src/index.html`（静的HTML + CSS 6713〜7813行付近 + :root トークン）、`src/ui-render.js renderRanking()`（**非変更**）、`src/data.js OVR_TIER_THRESHOLDS`、`src/ui-common.js valueClassOvr()` |

---

## 2. デザイン方針（v1.0 の核）

1. **ゴールド一元アクセント**：金銀銅鋼のメタリック順位カラーを廃止。順位は「数字の大きさ・1位カードの拡大・ゴールドの当て方」で表現する
2. **Office 標準部品に準拠**：パネルは `.panel` 相当（`--panel-bg` + `--border` + 角丸6px）、セクション見出しは `.panel-title` 相当（Oswald 13px / letter-spacing 3px / uppercase / gold / 下線）、履歴テーブルは `.data-table` 相当
3. **OVR 階調は維持**：`--v-*` 8階調と `valueClassOvr()` は現行のまま（金系階調なのでゴールド基調と両立）
4. **役割バッジは維持**：王者（金）/ 看板（赤 `--board-red` 系）/ 主力（中立）。03 主力層サムネイル左上のバッジ表示も維持
5. **自団体の強調はゴールド枠**：v0.9 の銀枠（rank-2 シルバー）をやめ、`rgba(212,168,67,0.4〜0.5)` のゴールド枠+薄金グラデ背景に統一

---

## 3. HTML 構造（現行実装の出力、非変更）

```
#screen-ranking
└─ .ranking-popup
   ├─ .popup-header        (静的HTML: 団体ランキング)
   ├─ #rankingMast         → .popup-mast (INDUSTRY STANDINGS / 第N シーズン・全4団体 / 日付)
   ├─ #rankingVictoryBar   → .victory-bar (▲1位 / 中央 −Npt / ▼自団体 — 1位時は .is-top + .vb-top)
   └─ #rankingContent
      ├─ section.section.bg-card  ── 02 — Roster 全団体ロースター
      │  ├─ .section-marker > .text > .kicker/.title
      │  └─ .orgs-grid (1.3fr 1fr 1fr 1fr)
      │     └─ .orgcell × 4 (head[rank/nm/tier-pill] + formation[orgcell-fcell pos-1〜3 + role-badges + nm-tag] + foot[評価pt/平均OVR/対戦PT])
      ├─ section.section.bg-deep  ── 03 — 団体詳細 団体プロフィール
      │  └─ .rp-profiles > .rp-card × 4
      │     (rp-rank紋章 / rp-info[tags+h3+リード文] / rp-ace[役割+名前+コピー+dl+画像] / rp-depth[head+faces+note] / rp-metrics[評価/基礎力/平均OVR/対戦PT/レガシー/実績+tooltip])
      └─ section.section.bg-card.history-wrap ── 04 — History シーズン履歴
         └─ table (h-rank-1〜4 / profit-pos/neg)
```

※ v0.9 spec に記載のあった `.org-card`（03旧レイアウト：バナー+5名フォーメーション）は実装が `.rp-card` に移行済みで **死にCSS**。v1.0 実装時に削除する。

---

## 4. デザイントークン

### 4-1 使用する共通トークン（新規定義なし）

```
背景・パネル: --bg-dark / --panel-bg / --card-bg / --border
文字:        --text-main / --text-sub / --text-dim
アクセント:  --gold / --gold-light（白→金グラデ: linear-gradient(180deg,#fff 20%,var(--gold-light)) + background-clip:text）
状態:        --green / --red（signal-up/down エイリアス経由可）
看板赤:      --board-red / --board-red-bg / --board-red-border（継続使用）
OVR階調:     --v-mythic 〜 --v-poor（現行値のまま）
```

### 4-2 廃止するトークン参照

- `--rank-1〜4`（light/deep 含む）: ランキングCSSからの参照を全廃。**h-rank-1 のみ `--gold-light` に置換**、h-rank-2〜4 は `--text-main`
- `--th-*`（accent/divider/text/border/section-bg/card-bg）: 参照を全廃し、`--border` / `--text-*` / `--panel-bg` / `--card-bg` に置換。参照ゼロになったら :root の定義ごと削除
- `--office-bg-deep` / `--office-text-on-dark-*`: ランキング内の参照は `--text-*` 系へ置換（定義は他画面が使うため残置）
- `--rank-*` の :root 定義自体は残置（将来・他画面用。削除はスコープ外）

### 4-3 ゴールドの当て方（順位表現）

| 要素 | 1位 | 2〜4位 |
|---|---|---|
| orgcell 枠 | `rgba(212,168,67,0.35)` + 拡大(min-height 420px) | `--border` |
| orgcell 順位数字 | 白→金グラデ 46px | `--text-dim` 36px |
| orgcell 評価値 | 白→金グラデ 32px | `--text-main` 26px |
| rp-card 左ボーダー | `--gold` 3px + 薄金グラデ背景 | `rgba(232,230,224,0.18)` 3px |
| rp-metrics 評価値 | 白→金グラデ | 白→金グラデ（全団体共通） |
| 履歴 順位列 | `--gold-light` | `--text-main` |
| 自団体(is-player) | ─ | ゴールド枠 `rgba(212,168,67,0.4〜0.5)` |

---

## 5. 各部の様式（v0.9 → v1.0 差分）

| 部位 | v0.9 | v1.0（A案） |
|---|---|---|
| popup フレーム | radius-lg + 黒影 | `--border` 枠 + 角丸6px、ヘッダは `--panel-bg` |
| マスト | Bebas 30px 金ベタ + 4px二重金罫 | **Bebas 22px 白→金グラデ**（トップバータイトル様式）+ 1px `--border` |
| 勝利条件バー | 金/銀の rank 色 | 1位ラベル=`--gold`、自団体ラベル=`--text-sub`、中央ギャップ数字=白→金グラデ。`.is-top`（1位時）は金系のまま維持 |
| セクション見出し | kicker金 + title白 2行 | `.panel-title` 様式1行（`.text` を flex 化、kicker=`--text-dim` 小、title=Oswald 13px gold ls3 uppercase 下線付き） |
| orgcell | clip-path切り角 + rank色 border-top + rank色団体名 + メタリックピル | 角丸6px + `--panel-bg`、団体名=`--text-main`、ピル=ゴールド枠チップ（`rgba(212,168,67,0.4)`枠 + `--gold`文字 + 薄金背景） |
| tier-pill | rank色グラデ塗り | 全団体共通のゴールド枠チップ。自団体のみ濃いめ |
| フォーメーション | rank色の床ライト | 床ライト・王者スポットとも金 `rgba(212,168,67,0.3)` に統一 |
| rp-card | clip無しだが rank色 border-left + rank色タグ | 角丸6px、border-left は 4-3 の表どおり、rp-tags は全団体ゴールド統一 |
| rp-face バッジ | ボーダー色のみ（is-champ/board/core） | ボーダー色 + **role-badges（7px、左上）を維持**（実装は既に出力済み。バッジ背景 `rgba(18,17,14,0.85)` で視認性確保） |
| 履歴テーブル | th 金 2px 下線 + rank色順位列 | `.data-table` 様式（th=Oswald 11px gold、1px `--border` 下線）、順位列は 4-3 の表どおり |
| 旧 org-card CSS 一式 | 残置（死にコード） | **削除**（`.org-card` / `.org-banner` / `.ace-stand` / `.fcell` / `.formation-*` / `.champ-row` / `.footer-actions` / `.roster-toggle` / `.roster-list` 系。`.orgcell-fcell` は現役なので残す） |

**維持するもの**：`.rank-metric` / `.rank-metric-tooltip`（teleport 型ツールチップ）、`.v-*` 階調クラス、`.orgcell-fcell .role-badges`（top:-16px 配置）、nm-tag の黒縁取り白文字、レスポンシブ規則。

---

## 6. データ接続・画像取得・主力選定

**v0.9 から変更なし**（`Engine.ranking.updateRankings(G)` / 王者取得 / ロースター加工 / 順位連動の主力人数 / `getUpperUrl`・`getOrgIconPath`・`onerror` フォールバック）。旧 spec §5〜§8 の記載のうち、03 の描画は `.rp-card`（紋章+リード文+エース+主力層+6指標）が現行の真実。

---

## 7. 関連

- モックアップ3案の比較経緯: `docs/ui/mockups/ranking-restyle-A-office.html`（採用）/ `-B-cream.html` / `-C-tuned.html`（worklog 2026-07-16 参照）
- 旧 v0.9 spec の内容はこのファイルの git 履歴を参照

---

*v1.0 / 2026-07-16（A案 Office標準・採用決定）*
