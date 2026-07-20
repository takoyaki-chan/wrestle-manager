# Codexタスク17: グローバルヘッダー／今週画面 季節表記リデザイン（仕様書＋モックアップのみ・src変更禁止）

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**変更してよいファイル**:
- `docs/ui/03-screens/global-header.md`（新規・成果物）
- `docs/ui/03-screens/week-dashboard.md`（新規・成果物）
- `docs/ui/mockups/` 配下（新規ディレクトリ・モックアップHTML）

**変更禁止**: `src/` 配下のすべて、`test/` 配下のすべて、`specs/` 配下のすべて。
**本タスクでは1行も実装しない。** 実装は選定後の task-18 で行う。

**コミットはOK**（日本語の明確なメッセージで）。**pushは禁止**。

---

## 背景

ゲーム内の時期表記は「1年目 4月 第1週」形式。シーズンは48週＝12ヶ月で、**4月始まり・3月終わり（年度制）**。

| Q | 週 | 季節 | 月 |
|---|---|---|---|
| Q1 | 1-12 | 🌸春 | 4 / 5 / 6月 |
| Q2 | 13-24 | ☀️夏 | 7 / 8 / 9月 |
| Q3 | 25-36 | 🍂秋 | 10 / 11 / 12月 |
| Q4 | 37-48 | ❄️冬 | 1 / 2 / 3月 |

これにより **「2年目 12月」の次の週が「2年目 1月」** になり、年の順序数が増えないのに月の数字だけ巻き戻る。プレイヤーには年度感覚の訓練がないため、ここが強い違和感を生んでいる。

**解決方針は「季節語を年目と月の間に緩衝材として挟む」こと。** 「冬の2月」と読めば年度末だと自然に伝わり、`2年目` と `2月` の直結が生む違和感が消える。

同時に、ヘッダーと今週画面のレイアウト負債もまとめて解消する。

---

## 現状の実装（調査済み・すべて確認済みの事実）

### 時期表記フォーマッタ

`src/management.js:432-435`

```js
getQuarter(w)      { return Math.ceil(w / 12); },
getMonth(w)        { return ((Math.ceil(w / 4) - 1 + 3) % 12) + 1; },   // 4月始まり
getWeekInMonth(w)  { return ((w - 1) % 4) + 1; },
formatDate(s, w)   { return `${s}年目 ${this.getMonth(w)}月 第${this.getWeekInMonth(w)}週`; },
```

### 問題1: 同一の日付文字列が画面上に3重に出ている

| # | 場所 | 実装 | 表示例 |
|---|---|---|---|
| ① | グローバルヘッダー `#dispDate` | `src/ui-render.js:190`（DOM: `src/index.html:9194`） | `1年目 4月 第1週` |
| ② | パネル見出し `#weekTitle` | `src/ui-render.js:865`（DOM: `src/index.html:9229`） | `1年目 4月 第1週 — 🎤 興行週` |
| ③ | 季節バーカード上部 | `src/ui-render.js:904` | `1年目 4月 第1週` |

②と③は縦に隣接しており、ほぼ同じ文字列が2行連続で出る。①も常時可視なので実質3重。

### 問題2: 季節バーのラベル位置が全部ズレている

`src/ui-render.js:909-914`

```html
<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim)">
  <span style="${G.week<=12?'color:var(--gold)':''}">🌸春</span>
  <span style="${G.week>12&&G.week<=24?'color:var(--gold)':''}">☀️夏</span>
  <span style="${G.week>24&&G.week<=36?'color:var(--gold)':''}">🍂秋</span>
  <span style="${G.week>36?'color:var(--gold)':''}">❄️冬</span>
</div>
```

`justify-content:space-between` により春=0% / 夏=33% / 秋=66% / 冬=100% に配置される。
実際の季節境界は **0% / 25% / 50% / 75%** なので全ラベルがズレており、特に**冬が右端に落ちて「冬が終わった後」に見える**。

進捗バー本体は `src/ui-render.js:906-907`（トラック＋フィル、`weekPct = Math.round((G.week/48)*100)` — `src/ui-render.js:872`）。**個別の週マーカーや月の目盛りは存在しない。**

### 問題3: 週→季節の判定ロジックが3系統に分裂

| 実装 | 場所 |
|---|---|
| `Engine.util.getQuarter(w)` = `Math.ceil(w/12)` | `src/management.js:432` |
| バーのインライン三項演算子（`<=12 / <=24 / <=36 / >36`） | `src/ui-render.js:910-913` |
| `getShachoshitsuSeasonId(week)` の if 連鎖 | `src/ui-render.js:4671-4677` |

値は一致するが単一情報源がない。境界値 12 / 24 / 36 も名前付き定数になっていない。

ラベル定数 `QUARTER_LABELS = {1:'🌸 春', 2:'☀️ 夏', 3:'🍂 秋', 4:'❄️ 冬'}` は `src/data.js:3428` に存在するが、バーからは使われていない。

### 問題4: デッドコード

`src/ui-render.js:871`

```js
const qtr = QUARTER_LABELS[getQuarter(G.week)] || '🌸 春';
```

宣言のみで以降どこからも参照されていない（`grep -n "qtr" src/ui-render.js` の結果はこの1行のみ）。

### 問題5: 季節バーが全部インラインstyle

`src/ui-render.js:900-915` にCSS classが一切なく、すべてインライン `style` 属性。
そのため `src/mobile.css` から一切上書きできず、`grid-template-columns:1fr 1fr` がスマートフォンでも2カラムのまま残る。

### 問題6: ヘッダーのレスポンシブがテストで守られていない

`test/mobile-layout-test.js`（185行、ソース文字列アサーション方式）は `.nav-bar` の sticky 等は検査するが、
**`.top-bar` / `.top-bar-info` / `#dispDate` に対するアサーションが1つも無い。**

### グローバルヘッダーの現状構造

DOM: `src/index.html:9186-9201`。CSS: `src/index.html:201-212`（デスクトップ）、`src/index.html:838-840`（簡易BP）、`src/mobile.css:44-94`（`@media (max-width:700px)`）。

**左ブロック**（`src/index.html:9187`、class無しのインラインflex div）

| 順 | 要素 | id / class | 行 |
|---|---|---|---|
| 1 | 団体アイコン | `#dispOrgIcon` | `src/index.html:9188` |
| 2 | タイトル `WRESTLE MANAGER` | `.top-bar-title` | `src/index.html:9189` |
| 3 | サウンド（SE/全体）ミュート 🔊 | `#muteBtn` | `src/index.html:9190` |
| 4 | BGMミュート 🎵 | `#bgmMuteBtn` | `src/index.html:9191` |

**右ブロック** `.top-bar-info`（`src/index.html:9193`）

| 順 | 要素 | id | 行 | 更新 |
|---|---|---|---|---|
| 1 | 年月週 | `#dispDate` | `src/index.html:9194` | `src/ui-render.js:185-192` |
| 2 | 資金 | `#dispFunds` | `src/index.html:9195` | `src/ui-render.js:193-195` |
| 3 | 人気（＋補助金バッジ） | `#dispPop` / `#dispSubsidy` | `src/index.html:9196` | `src/ui-render.js:196-218` |
| 4 | Heat | `#dispHeat` | `src/index.html:9197` | `src/ui-render.js:219-222` |
| 5 | 順位 | `#dispRank` | `src/index.html:9198` | `src/ui-render.js:223-230` |
| 6 | 王座 | `#dispChamp` | `src/index.html:9199` | `src/ui-render.js:231-233` |

各項目は `.info-item` > `.info-label` + `.info-val`（修飾 `.positive` / `.negative` / `.gold`）。
レイアウトはデスクトップ flex（`.top-bar{display:flex;justify-content:space-between;flex-wrap:wrap}`）、モバイルは grid に切替（`src/mobile.css:46-47`, `72-77`）。
ミュートボタンのタップ領域確保は `src/mobile.css:65-70`。

ミュートボタンは onclick 直書きで `Audio.toggleMute()` / `Audio.toggleBgmMute()` を呼び、テキストを 🔇 / 🎵❌ に差し替える。再描画時の同期は `src/ui-render.js:155-158`。

---

## 確定済みの設計方針（Keisuke 決裁済み・変更しないこと）

### D-1. 季節語表記は formatDate() 全面適用

`formatDate()` そのものを季節語形式に変更する。新聞・選手経歴・年代記・社長室・通知すべてが新表記に統一される。

**呼び出し箇所（全18箇所・実装時＝task-18 で全数確認が必要）**

- `src/ui-render.js`: 190, 865, 904, 1271, 1412, 1458, 1470, 1490, 1557, 1565, 1574, 3897, 3955, 4689, 4774, 5132, 5164, 6260, 6285
- `src/app.js`: 3864

本タスク（task-17）では**実装しない**が、モックアップと仕様書には「この表記が全画面に波及する」前提を明記すること。とくに**文字数が増える案は新聞見出しや年表の行で折り返しを起こす**ため、仕様書にその影響を必ず記述する。

### D-2. 3重表記の解消方針

| 場所 | 変更後 |
|---|---|
| ① グローバルヘッダー `#dispDate` | **正の時計。** 完全表記をここに集約し、最大サイズで最左に置く |
| ② `#weekTitle` | 日付を削除し、**種別のみ**（例 `🎤 興行週` / `オフシーズン 2/4`） |
| ③ 季節バーカード上部 | テキストを削除し、**バーのみ**にする |

### D-3. ヘッダーのリデザイン要件

- `WRESTLE MANAGER`（`.top-bar-title`, `src/index.html:9189`）を**削除**
- **日付を最左・最大**に配置（ヘッダー内で最も目立つ要素にする）
- `#muteBtn` / `#bgmMuteBtn` を**最右端**へ移動し、控えめな見た目にする（タップ領域 36px は維持）
- 資金 / 人気 / Heat / 順位 / 王座は**現状より大きく**する（タイトル削除で空いた分を配分）
- `#dispOrgIcon` の置き場所は案ごとに変えて比較する（日付の左に添える / ミュート隣 / 削除）

### D-4. 季節バーのリデザイン要件

- **月境界の目盛り12本**（4週＝8.333%ごと）
- **季節境界4本を太線**で（0% / 25% / 50% / 75%）
- **季節ラベルを各区間の左端に揃える**（春=0%、夏=25%、秋=50%、**冬=75%**）。現状の `space-between` は禁止
- 各区間の下に月番号（`4·5·6` / `7·8·9` / `10·11·12` / `1·2·3`）
- 現在週マーカーを置く
- インラインstyleを廃し**CSS class 化**（`src/mobile.css` から制御可能にするため）

---

## 成果物1: 画面仕様書2本（P0）

`docs/ui/03-screen-template.md` のテンプレートに厳密に沿って以下を新規作成する。

- `docs/ui/03-screens/global-header.md`
- `docs/ui/03-screens/week-dashboard.md`

**書く前に必ず以下を読むこと**（CLAUDE.md「UI実装ルール」で必読指定）:

1. `docs/ui/01-foundations.md` — カテゴリ（Office / Stage / Ceremony）、CSSトークン、設計原則
2. `docs/ui/02-layouts.md` — レイアウトパターン P1〜P7、シーケンス S1〜S7、グローバルChrome
3. `docs/ui/03-screen-template.md` — テンプレート
4. 既存の書き方の参考として `docs/ui/03-screens/ranking.md` と `docs/ui/03-screens/show-result-spec.md`

**厳守事項**:

- **ハードコード16進カラー禁止。** 色は必ず `var(--*)` トークンで書く
- グローバルヘッダーは全画面に乗る Chrome なので、`02-layouts.md` のグローバルChrome節との整合を必ず取る。矛盾があれば仕様書に「要確認」として明記する（勝手に 02-layouts.md を書き換えないこと）
- 3カテゴリ（Office / Stage / Ceremony）の混同禁止

仕様書には最低限これを含めること:

- 週→季節→月の対応表（本書冒頭の表を正とする）
- 表記フォーマットの定義（採用案が決まるまでは3案併記でよい）
- ヘッダー各要素のサイズ階層（何が一番大きく、何が最小か）
- 季節バーの座標定義（各目盛りの%位置を数値で明記）
- オフシーズン（`G.offSeason` / `G.offWeek`、4週）の表示をどうするか。現状は `オフシーズン 2/4`。季節語体系のどこに位置づけるかを提案すること（冬＝3月の後、翌年度の春の前）
- モバイル（`max-width:700px`）での崩し方
- 「実装状況」フィールド（本タスク時点では `仕様策定中・未実装`）

---

## 成果物2: モックアップ（P1）

`docs/ui/mockups/` に**単体でブラウザで開ける静的HTML**を作る。ビルド不要・外部依存なしで完結させること。

### 構成

`docs/ui/mockups/header-season-redesign.html` — 全案を1枚に縦に並べ、上下に並べて見比べられる形にする。ファイルを分割してもよいが、その場合は index を必ず用意する。

### 表記3案（全案を作ること）

| 案 | 表記例 | 性格 |
|---|---|---|
| **A** | `2年目 ❄️冬 第3週` | 月を捨てる。最短・巻き戻りゼロ。ただし12週の中の「第3週」は粒度が粗い |
| **B** | `2年目 ❄️冬 2月 第1週` | 現状の精度を保ちつつ、季節語を年目と月の間の緩衝材に置く（**現時点の推奨案**） |
| **C** | `2年目 第39週 ❄️冬` | 通し週（1-48）を主時計に、季節をバッジとして添える |

B案は2行組み（上段 `2年目 ❄️冬` / 下段 `2月 第1週`）のバリエーションも作ること。ヘッダー最左で最大表示したときの見え方を確認するため。

### ヘッダーレイアウト3案

D-3 の要件は全案共通。案ごとに変えるのは以下:

- `#dispOrgIcon` の置き場所（日付の左 / ミュート隣 / 削除）
- 資金・人気・Heat・順位・王座 の並べ方（横一列 / 2段 / 重要度でサイズ差をつける）
- ミュートボタンの見せ方（アイコンのみ / 区切り線で隔離 / 極小化）

### 季節バー

D-4 の要件を満たしたものを作る。**バーだけは案を分けず、1つの決定版を作ること**（要件が具体的に確定しているため）。

以下の状態を並べて表示し、目盛りと季節ラベルの位置が正しいことを目視確認できるようにする:

- 週1（春の頭）
- 週12（春の最後）
- 週13（夏の頭）
- 週37（**冬の頭** — ラベルが75%位置にあることの確認用）
- 週48（冬の最後）

### モックアップの共通ルール

- 実際の CSSトークン（`var(--*)`）を使う。実ゲームの `src/index.html` から `:root` のトークン定義をコピーしてモックアップの `<style>` 先頭に置くこと。**16進カラーの直書き禁止**
- デスクトップ幅とモバイル幅（375px）の両方を並べて見せる。モバイルは iframe か固定幅コンテナで再現してよい
- ダミーデータは実ゲームらしい値にする（資金・人気・Heat・順位・王座）
- **JSは最小限**。静止画的に案を比較できることが最優先

---

## やってはいけないこと

- `src/` を1行でも変更する
- `test/` を変更する
- `specs/` を変更する
- `docs/ui/01-foundations.md` / `02-layouts.md` を書き換える（矛盾は仕様書に「要確認」として書くだけ）
- 3案のうち勝手に1案だけ作る（**必ず全案作る。選定は Keisuke が行う**）
- 16進カラーの直書き
- push

---

## 完了時の報告

以下を報告すること:

1. 作成したファイルの一覧
2. **表記3案それぞれについて、文字数が最長になるケース**（例: `10年目 ❄️冬 12月 第4週`）と、それが `#dispDate` およびモバイル幅で収まるかの判定
3. `docs/ui/01-foundations.md` / `02-layouts.md` と矛盾した点があればその一覧
4. オフシーズン表示の提案内容
5. モックアップを開いて確認すべき箇所（Keisuke が見るべきポイント）

---

## 本タスクの後

Keisuke が表記案・レイアウト案を選定 → 仕様書に反映 → **task-18（実装）** を別途起票する。

task-18 で行う想定（本タスクの範囲外）:

- 週→季節の単一情報源を `Engine.util` に集約、境界値の定数化、3系統（`management.js:432` / `ui-render.js:910-913` / `ui-render.js:4671-4677`）の統合
- デッドコード `src/ui-render.js:871` の `qtr` 除去
- `formatDate()` の季節語化と全18箇所の表示崩れ確認
- 3重表記の解消（D-2）
- ヘッダーHTML/CSSリデザインと `src/mobile.css` 追従
- 季節バーのCSS class化と再実装
- `test/mobile-layout-test.js` にヘッダーのアサーション追加
- `specs/weekly-gameloop-spec-v1_0.md` に季節・月の定義表を追記
- 画面仕様書の「実装状況」更新、`docs/worklog.md` 記録
