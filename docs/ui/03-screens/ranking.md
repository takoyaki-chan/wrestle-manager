# 画面：団体ランキング（v0.9）

**ファイル**：`docs/ui/03-screens/ranking.md`
**最終更新**：2026-04-25 / v0.9
**実装状況**：完了（Phase 1-4 全実装、`plans/ranking-screen-redesign-v0.9-task.md` ハンドオフ）
**モックアップ正本**：`docs/ui/mockups/ranking-redesign-v0.9-for-mockups-dir.html`

---

## 0. スコープ

団体ランキング画面（`#screen-ranking`）の UI 構造、配色、データ接続、主力選手選定ロジックを定義する。
`Engine.ranking.updateRankings(G)` のロジック自体は変更しない（UI のみのリファクタ）。

---

## 1. 基本属性

| 項目 | 値 |
|---|---|
| 所属カテゴリ | **Office**（暖茶背景 `var(--office-bg)`） |
| パネル様式 | Dark Panel（Cream Panel は使わない） |
| レイアウトパターン | P1 Catalog 派生（独自 popup フレーム + 4セクション縦積み） |
| 所属シーケンス | なし（独立画面、ナビバーから開く） |
| 使用フォント | Noto Sans JP（本文）+ Bebas Neue（数値）+ Oswald（ラベル） |
| 実装ファイル | `src/index.html`（HTML + CSS）、`src/ui-render.js renderRanking()`、`src/data.js`（OVR_TIER_THRESHOLDS）、`src/ui-common.js valueClassOvr()` |

---

## 2. 目的

業界全体での自団体の立ち位置を、TV番組のチャンピオンシップ表のような格式で見せる。

- **頂点が誰か** を一目で：1位カードを拡大、金/銀/銅/鋼の順位カラーで視覚的差別化
- **どのくらい離れているか** を明示：勝利条件バーで「あと N pt で頂点」
- **各団体の主力** を一覧：T字フォーメーション（02）と5名フォーメーション（03）で団体ごとの個性を比較

---

## 3. HTML 構造

```
#screen-ranking
└─ .ranking-popup
   ├─ .popup-header        (🏆 団体ランキング)
   ├─ .popup-mast          (INDUSTRY STANDINGS / 第N シーズン・全4団体 / Y{N} W{N})
   ├─ .victory-bar         (▲1位 / 中央 −Npt / ▼自団体 — 1位プレイヤー時は .is-top フォールバック)
   └─ #rankingContent
      ├─ .section.bg-card  ── 02 全団体ロースター
      │  ├─ .section-marker (kicker のみ、番号なし)
      │  └─ .orgs-grid (1.3fr 1fr 1fr 1fr — 1位カード拡大)
      │     └─ .orgcell × 4 (head + formation T字 + foot)
      ├─ .section.bg-deep  ── 03 団体プロファイル
      │  ├─ .section-marker
      │  └─ .org-card × 4 (banner stand画像 + body 詳細＋5名フォーメーション)
      └─ .section.bg-card.history-wrap ── 04 シーズン履歴
         ├─ .section-marker
         └─ table (順位カラム h-rank-1〜4)
```

---

## 4. デザイントークン

### 4-1 順位カラー（質的属性専用：金/銀/銅/鋼）

```css
--rank-1: #d4a843;  /* Gold */    --rank-1-light: #f0d078;  --rank-1-deep: #9c7820;
--rank-2: #c0c0c0;  /* Silver */  --rank-2-light: #e8e8e8;  --rank-2-deep: #888888;
--rank-3: #c47e3a;  /* Bronze */  --rank-3-light: #d89858;  --rank-3-deep: #8a4f1f;
--rank-4: #6b6960;  /* Steel */   --rank-4-light: #b8b6ad;  --rank-4-deep: #5a584f;
```

**適用箇所**：順位番号、団体名（ヘッドライン）、ティアピル、カードの border-top、透かし数字、縦組オーバーライン、ace-name-plate、deck の border-left、王冠リングライト、シーズン履歴の順位列。

### 4-2 OVR 階調（数字専用、80以上で黄色味スタート）

```css
--v-mythic:    #ffd700;  /* 100+   — 純金（殿堂入り、glow強化） */
--v-elite-mid: #ffc640;  /* 95-99  — 強金 */
--v-elite:     #ffd870;  /* 90-94  — 中金 */
--v-elite-low: #ffe898;  /* 85-89  — 淡シャンパン金 */
--v-high:      #fff0c0;  /* 80-84  — クリーム白 */
--v-mid:       #f0eee8;  /* 70-79  — 暖白 */
--v-low:       #b8b5a8;  /* 60-69  — 淡グレー */
--v-poor:      #7a766b;  /* ~59    — 暗グレー */
```

OVR 数字にのみ適用。評価値・基礎力・レガシーなどの団体スコアには適用しない（白固定）。
閾値は `OVR_TIER_THRESHOLDS`（`src/data.js`）+ `valueClassOvr(ovr)`（`src/ui-common.js`）で集中管理。

### 4-3 看板バッジ赤

```css
--board-red:        #ff4530;
--board-red-bg:     rgba(214,48,49,0.18);
--board-red-border: #e85040;
```

### 4-4 中性アクセント

```css
--th-text-main: #f0eee8;  --th-text-sub: #a8a59a;  --th-text-dim: #6b6960;
--th-divider: rgba(255,255,255,0.12);  --th-border: rgba(255,255,255,0.06);
--th-card-bg: linear-gradient(180deg, #1d1b16, #100f0c);
```

---

## 5. データ接続

### 5-1 ランキング取得

`Engine.ranking.updateRankings(G)` の戻り値（変更しない）：

```js
[{ orgId, name, rating, baseScore, legacyScore, weightedOVR, weightedPop, battlePt, rosterSize, rank }, ...]
```

### 5-2 王者の取得

- プレイヤー：`G.titles?.world?.championId` → `G.roster.find(c => c.id === ...)`
- AI：`G.aiOrgs[orgId].titles?.world?.championId` → `G.aiOrgs[orgId].roster.find(...)`
- 防衛回数：`G.titles.world.defenses` / `G.aiOrgs[orgId].titles.world.defenses`

### 5-3 ロースター加工

| 項目 | 除外 |
|---|---|
| プレイヤー（02 主力） | `isRental`, `injury`, `forcedRest` |
| プレイヤー（03 主力） | 同上 |
| AI 全般 | `isRental`（`Engine.rival.dedupeRoster` も適用） |

### 5-4 主力選定（03 のみ順位連動）

| 順位 | 主力人数 |
|---|---|
| 1位 | 5名 |
| 2位 | 4名 |
| 3位 | 3名 |
| 4位 | 2名 |

**02 ロースターはトップ3固定**（順位連動しない）。

選定手順：
1. ロースターを OVR 降順ソート
2. 王者がいれば pos-1 に配置、残り上位 N-1 名を pos-2 以降に
3. 看板：王者でない選手のうち OVR 最高位（pos-1 が看板になる場合は pos-1 のみで赤バッジ表示）

---

## 6. 画像取得

| 部位 | 関数 | 引数 |
|---|---|---|
| 03 バナー（stand 大） | `getStandUrl(id, ovr)` | OVR 必須（`PORTRAIT_OVR_VARIANT` 切替のため） |
| 03 フォーメーション 5名 | `getUpperUrl(id)` | id のみ |
| 02 フォーメーション 3名 | `getUpperUrl(id)` | id のみ |
| ロースターリスト | `portraitImg(id, 36)` | サイズ指定 |

`PORTRAIT` 辞書未登録の id は空文字を返す。各 `<img>` 出力箇所で `onerror="this.style.display='none'"` を付けてフォールバック。

### 6-1 stand 画像の向き反転（CSS）

```css
.org-card:not(.flip) .org-banner .ace-stand img { transform: scaleX(-1); }
```

- **左バナー（通常配置：1位・3位）**：`scaleX(-1)` で右向きに反転 → 中央のテキストを向く
- **右バナー（`.flip` 配置：2位・4位）**：そのまま左向き

---

## 7. 1位プレイヤー時の勝利条件バー

通常時：
```
▲1位 {1位団体} {pt}pt | −{差}pt で頂点 | ▼自団体 {自団体} {pt}pt
```

1位プレイヤー時：`.victory-bar.is-top` クラスで1カラム表示にフォールバック：
```
👑 業界1位 ／ あなたの団体が頂点に立っています
```

---

## 8. 「全選手を見る」展開

各 `.org-card` の foot に `.roster-toggle` ボタン。クリックで `.roster-list`（`display: none ⇄ flex`）を切替。
リスト内の各選手 `.ri` クリックで `showFighterPopup(id, source)` を起動（既存挙動踏襲）。

---

## 9. 既存 spec との関係

- `specs/archive/org-ranking-spec-v1_0.md`（archive 行き、参照のみ）
- 本リファクタはロジック非変更のため、`specs/` への新規 spec 追加は不要

---

## 10. 関連ハンドオフ

- `plans/ranking-screen-redesign-v0.9-task.md`（実装ハンドオフ、Phase 1-4 進行ガイド）
- `docs/ui/mockups/ranking-redesign-v0.9-for-mockups-dir.html`（モックアップ正本）

---

*v0.9 確定版 / 2026-04-25*
