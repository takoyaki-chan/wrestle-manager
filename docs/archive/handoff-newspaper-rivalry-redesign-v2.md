# 新聞・団体比較リデザイン Phase 2 引き継ぎ v2.0

## このドキュメントについて

`docs/archive/handoff-newspaper-rivalry-redesign-v1.md`(v1)の Step 1/2/4 は 2026-04-25 に commit `428311c` で完了済み。本書は **v1 で残した Step 3(新聞・団体比較の 780px 紙面豪華化)と既存フレーバー配列の拡充** を次セッションで実装するための引き継ぎ書。

**作業範囲(優先度順):**
1. 新聞 1面: 写真拡大 + ダイジェスト寸評列 + 他団体ニュース2カラム化
2. 団体比較 2面: SVGレーダー廃止 → 左右対称バー型レーダー4軸へ置換 + 団体カード VS 2カラム化
3. 共通赤帯 `.paper-header` + 共通ページナビ `.page-nav` + セクションラベル統一
4. KURODA 既存配列の文面拡充(ヘッドライン/論評/対抗戦/対戦カード/スポットライト/ファン声)

**モックアップ参照:**
- `docs/ui/mockups/newspaper-mockup-v8.html`(1面+2面+3面 統合)

**v1 で完了済み(本書ではいじらない):**
- 派閥タブ位置/非表示 (Step 1)
- MQ 会場補正 (Step 2)
- H2H 拡張 + SAVE_TRIM (Step 4-1, 4-2)
- 因縁列伝(3面)新規実装 (Step 4-3, 4-4, 4-5)
- `.db-cmp-wrap max-width:780px;margin:0 auto`(統一の前哨)

---

## Step 0: 事前準備

```bash
git fetch origin
git checkout -b feat/newspaper-redesign-phase2
```

確認: `docs/archive/handoff-newspaper-rivalry-redesign-v1.md` 上部の「黒田幸子の文体設計」セクションを必ず読む。文面拡充を書くときは:
- 1面興行記事は **観戦モード(冷静・分析的)**
- 1面他団体ニュースは **取材モード(中立・観察)**
- 2面団体比較は **論評モード(冷徹・煽り)** — 既存トーン維持
- 3面因縁列伝は **取材モード(深め)** — 既存実装で確定済み、いじらない

お決まりフレーズ「本紙は」「〜と書いておく」「数字は嘘をつかない」「40年見てきた中で」を画面横断で2〜3割の頻度で散りばめ、同一人物としての連続性を担保する。

---

## Step 1: CSS 共通基盤

### 1-1. 共通赤帯ヘッダー

`src/index.html` に追加(または `.db-cmp-newspaper-header` を共通化):

```css
.paper-header{background:linear-gradient(90deg,#8b1a1a,#c22020);padding:10px 20px;display:flex;align-items:center;justify-content:space-between;border-radius:8px 8px 0 0}
.paper-header .logo{font-size:20px;font-weight:900;color:#fff;letter-spacing:2px;font-family:'Oswald',sans-serif}
.paper-header .issue{font-size:11px;color:rgba(255,255,255,0.8);text-align:right}
.paper-header .issue small{display:block;font-size:9px;color:rgba(255,255,255,0.6);margin-top:2px}
```

### 1-2. 共通ページナビ

```css
.page-nav{display:flex;gap:6px;padding:8px 12px;background:rgba(80,50,20,0.06);border-bottom:1px solid rgba(80,50,20,0.15)}
.page-nav-btn{padding:6px 14px;background:rgba(80,50,20,0.08);border:1px solid rgba(80,50,20,0.2);border-radius:4px;font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:2px;color:#5b4b34;cursor:pointer;transition:all 0.15s}
.page-nav-btn:hover{background:rgba(139,26,26,0.15);color:#8b1a1a}
.page-nav-btn.active{background:#8b1a1a;color:#fff;border-color:#8b1a1a}
```

### 1-3. セクションラベル

```css
.sec-label{font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:2px;color:#5b4b34;text-transform:uppercase;border-left:3px solid #8b1a1a;padding-left:8px;margin-bottom:8px;font-weight:700}
.sec-label-gold{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:3px;color:#6a4a10;text-transform:uppercase;border-left:3px solid #d4a82a;padding-left:10px;margin-bottom:10px;font-weight:800}
```

注: 因縁列伝(`.rivalry-history .sec-label / .rivalry-relations .sec-label-gold`)は v1 で個別定義済み。重複しないように **既存のスコープ付き定義をグローバルに昇格** する形で統合する(`.rivalry-history .sec-label` → `.sec-label` で統一、必要なら `.rivalry-history` 側で継承確認)。

### 1-4. 黒田コメントブロック共通化

```css
.kuroda-block{display:flex;gap:10px;padding:10px 12px;background:rgba(248,238,210,0.7);border:1px solid rgba(120,84,39,0.2);border-radius:6px;margin:10px 0}
.kuroda-face{width:48px;height:48px;border-radius:50%;background-size:cover;background-position:center top;border:2px solid rgba(139,26,26,0.4);flex-shrink:0}
.kuroda-block .body{font-size:12px;line-height:1.7;color:#3a2e1c;font-family:'Noto Serif JP',serif}
.kuroda-block .body .sig{display:block;text-align:right;font-size:10px;color:#7a5b32;margin-top:6px;font-style:italic}
```

`.news-rating-comment` `.db-cmp-headline-quote` 等を `.kuroda-block` に置換可能か検討(既存呼出箇所が多い場合は alias として `.news-rating-comment{ /* @extend .kuroda-block の体裁 */ }`)。

---

## Step 2: 新聞 1面の豪華化

**対象**: `src/ui-render.js` の `_renderDbNewspaper` (L5395 付近) と関連サブ関数。

### 2-1. 一面記事写真拡大

現状不明な写真サイズを **200×240px の額装風** に拡大する。`_renderNewspaperPlayerShow` (L5555 付近) のメイン写真コンテナのみで OK:

```html
<div class="newspaper-photo-frame" style="width:200px;height:240px;...">
  <img src="${getStandUrl(...)}" style="width:100%;height:100%;object-fit:cover;object-position:center top;">
</div>
```

CSS:
```css
.newspaper-photo-frame{border:6px double rgba(120,84,39,0.4);box-shadow:0 4px 14px rgba(0,0,0,0.2);background:#2a1a10;overflow:hidden}
```

### 2-2. ダイジェストテーブル — 試合カード写真拡大 + 寸評列

`_renderNewspaperDigest` (L5739 付近、v1 で `_calcExpectedMQ` を入れた関数) のテーブルに変更:

- 現状の試合カード写真 80px → **130px** に拡大(`.ndt-port` のサイズ調整、`.ndt-port img` の object-fit 維持)
- 寸評列を追加: ★評価 + commentText の併記 → モックアップ v8 の構造を参照

### 2-3. 他団体ニュース 2カラムグリッド

`_renderDbNewspaper` 内の他団体ニュース描画ブロック(`_newsPaperOtherOrgs` 等のヘルパーがあるはず)を 2カラム grid に:

```css
.other-org-news-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:600px){.other-org-news-grid{grid-template-columns:1fr}}
```

各カードのフッターにフレーバー1行(KURODA_NEWS_COMMENT)を取材モードで添える。

---

## Step 3: 団体比較 2面の刷新

**対象**: `src/ui-render.js` の `_renderDbOrgCompare` (L7361 付近)。

### 3-1. SVGレーダー廃止 → 左右対称バー型レーダー

現状の SVG 放射状レーダー + 軸別バー4本(`.db-cmp-radar` 等)を **削除**。

新しい4軸レーダー(エース力/層の厚み/集客力/タイトル力)を左右対称バーで描画:

```html
<div class="org-bar-radar">
  <div class="bar-row">
    <div class="bar-left" style="--w: 78%"></div>
    <div class="bar-axis-label">エース力</div>
    <div class="bar-right" style="--w: 65%"></div>
  </div>
  ...残り3軸
</div>
```

CSS(中央軸ラベルから左右に伸びるバー):
```css
.org-bar-radar{display:grid;gap:8px;padding:12px}
.bar-row{display:grid;grid-template-columns:1fr 100px 1fr;align-items:center;gap:8px}
.bar-left,.bar-right{height:14px;background:linear-gradient(90deg,transparent,#6a4a10);border-radius:2px;position:relative}
.bar-left{justify-self:end;width:var(--w);background:linear-gradient(90deg,transparent,#6a4a10)}
.bar-right{justify-self:start;width:var(--w);background:linear-gradient(90deg,#8b1a1a,transparent)}
.bar-axis-label{text-align:center;font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:1px;color:#5b4b34}
```

軸計算:
- **エース力** = OVR top1 / 100
- **層の厚み** = OVR top1〜top5 平均 / 100
- **集客力** = orgPop / 100
- **タイトル力** = タイトル保持数 / カテゴリ総数(または `legacyScore / 50` cap1.0)

### 3-2. エース対決(維持)

`.db-cmp-match-featured` のスタンド画像対峙はそのまま維持。`.ace-char.left img { transform: scaleX(-1); }` 既存ルールは触らない。

### 3-3. 団体カード VS の 2カラム化

`.db-cmp-versus` の `grid-template-columns: 1fr auto 1fr` を `1fr 1fr` に変更し、中央 VS 円章は両カードの上に重ねる absolute レイアウトに:

```css
.db-cmp-versus{grid-template-columns:1fr 1fr;gap:10px;position:relative}
.db-cmp-vs-mark{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2}
```

省くものは省いて(`.db-cmp-mini-stats` 4列を 2列に折るなど)コンパクト化。

---

## Step 4: KURODA 既存配列の文面拡充

**対象**: `src/kuroda-text.js`(現在約930行、v1 で +100行)

| 配列名 | 既存件数 | 追加目標 | モード |
|---|---|---|---|
| `KURODA_HEADLINES` 各tier | 14-16 | +5本 | 論評(団体比較) |
| `KURODA_EDITORIAL` 各tier | 既存数 | +5本 | 論評 |
| `KURODA_WAR_RECORD.{winStreak,loseStreak,even}` | 各3-5 | 各+3本 | 論評 |
| `KURODA_MATCHUP_FLAVOR.{style,age,h2h}` | 各4-5 | 各+3本 | 論評 |
| `KURODA_SPOTLIGHT.{star,growth,youngThreat}` | 各3-5 | 各+3本 | 論評 |
| `FAN_OPINIONS` 各tier×各type | 各3-5 | 各+2本 | 論評(ファンの声) |
| `KURODA_NEWS_COMMENT`(他団体ニュース寸評) | 既存数 | +各カテゴリ3本 | 取材 |

文体ガイドは v1 handoff の「黒田幸子の文体設計」セクションを必ず参照。

---

## Step 5: 検証

### 5-1. 視覚回帰
- 新聞1面: 一面写真が 200×240、試合カード写真 130px、他団体ニュース2カラム、ダイジェスト寸評列が出る
- 団体比較2面: 4軸バー型レーダー + 既存ace対決 + 2カラム VS
- 因縁列伝3面(v1で完成済み): 表示崩れがないこと(リグレッション確認)
- モバイル幅(< 820px / < 600px)で破綻しないこと

### 5-2. 既存機能の非破壊性
- 既存セーブのロード時にエラーなし
- `_renderDbNewspaper` が新聞アーカイブ(`_newspaperArchiveIdx`)切替で破綻しない
- `_renderDbOrgCompare` の `_dbCompareTarget` 切替で破綻しない

### 5-3. auto-sim
本セッションは **UI のみの変更** のため auto-sim は不要(MEMORY.md `feedback_auto_sim_ui_only` 準拠)。ただし数値計算をいじる軸スコア(層の厚み等)を変えた場合は念のため100シーズン1回回す。

---

## 実装しないこと(明示的なスコープ外)

- v1 で完成した因縁列伝(3面)・派閥タブ移動・MQ会場補正・H2H拡張をいじらない
- 因縁メーター数値ゲージ、9象限ラベル名の紙面表示(v1 で廃止確定)
- 新聞アーカイブ機能の追加
- 団体比較の選定アルゴリズム変更(`_pickRivalryFeatured` 同等のスコア式は触らない)

---

## 実装ファイル一覧(変更想定)

| ファイル | 変更内容 |
|---|---|
| `src/index.html` | `.paper-header / .page-nav / .sec-label / .kuroda-block / .org-bar-radar / .newspaper-photo-frame / .other-org-news-grid` 等の CSS 追加(約150行) |
| `src/ui-render.js` | `_renderDbNewspaper / _renderNewspaperPlayerShow / _renderNewspaperDigest / _renderDbOrgCompare` の改修(約300行差分) |
| `src/kuroda-text.js` | 既存配列の文面拡充(約100〜150行追加) |
| `specs/rivalry-chronicle-spec-v1.0.md` | (もし共通CSSへ統合した場合)CSS パス記述の更新のみ |
| `docs/game-system-roadmap.md` | 完了報告追記 |
| `docs/handoff-newspaper-rivalry-redesign-v2.md`(本書) | 完了後 `docs/archive/` へ移動 |

---

## 推奨実装順

1. **Step 1 共通CSS** — 基盤、後続の HTML 変更が活きる
2. **Step 4 文面拡充** — 独立、CSS と並行可能
3. **Step 2 新聞1面豪華化** — 共通CSSが入っていると見栄えが分かる
4. **Step 3 団体比較2面刷新** — 最も大規模、最後に着手
5. **Step 5 検証** — preview_eval で DOM 構造を確認、screenshot は timeout しがちなので preview_inspect を併用

各ステップ完了後に commit を作る(粒度: Step 1 / Step 4 / Step 2 / Step 3 の 4 commits 程度)。

---

## 参考: v1 で確定済みの設計事項(再確認)

- 数値メーター廃止、9象限ラベルは内部タグのみ
- 黒田の文体は **モード制(同一人物・温度違い)** で画面横断のお決まりフレーズ共有
- スタンド画像の向き: **左 flip / 右 そのまま**
- 紙面幅 780px 統一(`.db-cmp-wrap` で v1 適用済み、新聞ページにも継承)
- 既存セーブのマイグレは行わない(新規記録から蓄積)

---

## 完了処理

1. `docs/game-system-roadmap.md` 更新
2. `specs/` の該当 spec を更新するか、新規 `specs/newspaper-and-orgcompare-spec-v1.0.md` を作成して CLAUDE.md ファイル索引に追記
3. 本書を `docs/archive/handoff-newspaper-rivalry-redesign-v2.md` へ移動
4. ローカルコミット(push しない)
