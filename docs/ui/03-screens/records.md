# 画面：データベース「📜 記録」タブ

**ファイル**：`docs/ui/03-screens/records.md`  
**最終更新**：2026-07-31  
**実装状況**：完了（実装済み。実機確認待ち）  
**確定モックアップ**：`docs/ui/mockups/hof-records-and-peak-ovr-v0.4.html`（Keisuke採用）

---

## 0. スコープと経緯

データベースの旧「🏅 殿堂」サブタブは、実装上は「📜 記録」である。このサブタブ内を `🏅 殿堂入り` と `📜 歴代記録` の2択セグメントで切り替える。セグメントの既定値は `hof`（殿堂入り）であり、既存の殿堂グリッド・フィルタ・ソート・詳細ポップアップは `_renderDbHallOfFame()` に委譲して変更しない。

本仕様書は、現行実装の `_renderDbRecordsTab()`、`_renderDbRecordBook()`、DB全選手一覧の称号バッジ、および選手詳細／団体ロスター詳細のピークOVR表示を記録する。サイズはベースラインよりも実装CSSの値を優先して転記する。

---

## 1. 基本属性

| 項目 | 値 |
|---|---|
| 所属カテゴリ | Office（データベース。暖茶背景 `var(--bg-dark)`） |
| パネル様式 | Dark Panel（`var(--panel-bg)` / `var(--bg-card)`） |
| レイアウトパターン | P1 Catalog 派生（データベース内サブタブ + 縦積みの記録展示） |
| 所属シーケンス | なし |
| 使用フォント | Noto Sans JP（本文）+ Bebas Neue（MQ・シーズン・防衛数）+ Shippori Mincho（歴代優勝／最多連続防衛の儀式見出し） |
| 実装ファイル | `src/ui-render.js`：`renderDatabase()`、`setDbSubTab()`、`_renderDbRecordsTab()`、`_renderDbRecordBook()`、`_dbBuildTournamentTitleChampions()`、`_dbBuildFighterTitleBadges()`、`_renderRosterDetailPanel()`／`src/ui-common.js`：`showFighterPopup()`／`src/index.html`：`.db-*` CSS とトークン |

## 2. デザイン方針

1. **サブタブを増やさない**：データベースの「📜 記録」内で、`🏅 殿堂入り` と `📜 歴代記録` を切り替える。既定は殿堂入りである。
2. **上段は数字記録、以降は栄冠の展示**：MQ記録は小さな2列ストリップに留め、その下を天頂戦、PPV GRAND FINAL、最多連続防衛の順で人に紐づく栄誉として見せる。
3. **Office内の儀式調**：背景・カードはDark Panelのまま、金（天頂戦／防衛）と紫（PPV）のアクセント、Shippori Minchoの見出しで格を示す。Ceremony画面への遷移ではない。
4. **選手画像は反転しない**：顔・アッパーとも `getPortraitUrl()`／`getUpperUrl()` の原画像をそのまま使う。取得できない場合は名前の先頭文字を表示する。
5. **不在を説明しない**：MQ記録の保持者がいないときは、数値だけを `is-dim` で表示し、対戦カード・開催情報・不在の説明文を出さない。最多連続防衛の候補がないときも横帯を出さない。

## 3. HTML 構造（現行実装の出力）

```text
#databaseContent
└─ .panel
   ├─ .panel-title                         「📊 データベース」
   ├─ .db-subtab-bar
   │  └─ .db-subtab-btn                    「📜 記録」+ 条件時 NEW
   └─ #dbSubContent
      ├─ .db-record-seg [role=tablist]
      │  ├─ button.db-record-seg-btn.active  「🏅 殿堂入り」(既定)
      │  └─ button.db-record-seg-btn         「📜 歴代記録」
      └─ [セグメント内容]
         ├─ [hof] _renderDbHallOfFame()      （既存の殿堂一覧）
         └─ [records] .db-record-book
               ├─ .db-record-strips
               │  ├─ .db-record-strip         シングルMQ歴代最高
               │  └─ .db-record-strip.tag     タッグMQ歴代最高
               ├─ section.db-record-hall.db-record-tenchosen-hall
               │  ├─ .db-record-cere-head > h3 「天頂戦 歴代優勝」
               │  └─ .db-record-glory-row     歴代王者 + 次回の空席
               ├─ section.db-record-hall.db-record-ppv-hall
               │  ├─ .db-record-cere-head.is-ppv > h3 「PPV GRAND FINAL 歴代優勝」
               │  └─ .db-record-ppv-row       直近順の横スクロール
               └─ section.db-record-defense-band （候補がある場合のみ）
                  ├─ .db-record-defense-portrait  👑 + アッパー
                  └─ .db-record-defense-info      防衛数・選手・王座期間
```

全選手一覧では、名前セル内の `.db-title-badges` に `.db-title-badge` を追加する。行クリックは `showFighterPopup(id, source)` で選手詳細を開く。

## 4. デザイントークン

| 用途 | トークン／実装値 |
|---|---|
| Office背景 | `--bg-dark` = `#24221e`（`--office-bg` の実体） |
| Dark Panel | `--panel-bg` = `#181614`、`--bg-card` = `#12110e` |
| 基本文字 | `--text-main` = `#e8e6e0`、`--text-sub` = `rgba(232,230,224,0.5)`、`--text-dim` = `rgba(232,230,224,0.25)` |
| 基本境界 | `--border` = `rgba(200,190,170,0.08)` |
| 金 | `--gold` = `#d4a843`、`--gold-light` = `#f0d078` |
| PPV | `--ppv-accent` = `#9b59b6` |
| 記録更新 | `--accent-rival` = `#c41e3a` |
| 大会称号：天頂戦 | `--ev-winter` = `#cfc4a2` |
| 大会称号：ジュニア | `--ev-summer` = `#56b1d8` |
| 大会称号：秋 | `--ev-autumn` = `#c1503c` |
| 大会称号：春タッグ | `--db-title-spring` = `#ff6f9c` |
| Cream側のピークOVR | `--cream-text-dim` = `#7a7466`、`--cream-text-sub` = `#4a4638` |
| 角丸 | `--radius-md`（記録セグメント／MQストリップ）。歴代優勝・防衛帯は実装値 `8px`、防衛アッパーは `6px` |

## 5. 各部の様式と特有ルール

### 5-1. 記録サブタブとセグメント

- データベースサブタブの文言は `📜 記録`。`G.mqRecord` または `G.mqRecordTag` の `season` と `week` が現在の `G.season`／`G.week` に一致すると、末尾に `NEW` を表示する。`NEW` は `8px`、`padding: 1px 4px`、`border-radius: 3px`、背景 `var(--accent-rival)`、文字 `var(--text-main)`、`1.4s` の点滅である。
- セグメントは `inline-flex`、下余白 `16px`、`1px solid var(--border)`、`border-radius: var(--radius-md)`。各ボタンは `padding: 6px 18px`、`font-size: 12px`。
- 選択中は背景 `color-mix(in srgb, var(--gold) 14%, transparent)`、文字 `var(--gold-light)`、太字。クリック時に `_dbRecSeg` を `hof` または `records` にして `renderDatabase()` を再描画する。

### 5-2. MQ記録ストリップ

| 項目 | シングル | タッグ |
|---|---|---|
| コンテナ | 2列グリッド、列間 `10px`、下余白 `18px` | 同左 |
| 枠・背景 | `1px solid color-mix(in srgb,var(--gold) 28%,transparent)`、背景は金14%ではなく金5%の `color-mix` | 境界 `var(--ppv-accent)` 36%、背景 `var(--ppv-accent)` 5% |
| 内側 | `padding: 8px 12px`、要素間 `10px`、`border-radius: var(--radius-md)` | 同左 |
| 縦書きラベル | `歴代最高`、`9px`、字間 `2px`、`var(--gold)` | 同文言・`var(--ppv-accent)` |
| MQ数値 | Bebas Neue、幅 `48px`、`34px`、`var(--gold-light)`、金30%の10pxグロー | 同サイズ・`var(--ppv-accent)`、紫30%の10pxグロー |
| 対戦カード | 顔 + 選手名 + `VS` + 選手名。`11px`太字、行高 `1.3`、要素間 `6px` | 同左 |
| 顔 | `22×22px`、円形、`1.5px`境界、重なり `-6px`、画像は `object-fit: cover` | 同サイズ・PPV色の境界／背景／文字 |
| 開催情報 | `シングル ─ S{season}・第{week}週 ─ {stage}`、`9px`、上余白 `3px` | `タッグ ─ S{season}・第{week}週 ─ {stage}` |

- `stage` は `Engine.mq.STAGE_LABELS[record.stage]` を使い、未定義時の表示文言は `興行`。
- 保持者がある更新済み記録だけが対戦カードと開催情報を出す。保持者がいない場合、シングルは `90`、タッグは `94` を数値のフォールバックとして表示し、`var(--text-dim)`・グローなしにする。
- 当週更新の場合だけ、`記録更新!` を表示する。これは `9px`太字、`padding: 1px 6px`、角丸 `3px`、背景 `var(--accent-rival)`、文字 `var(--text-main)`、`1.4s` 点滅である。

### 5-3. 天頂戦・PPV GRAND FINALの歴代優勝

- 共通の展示パネルは、内側余白 `16px`、下余白 `14px`、角丸 `8px`、`var(--bg-card)` 上に放射状グラデーションを重ねる。天頂戦は金35%境界・金14%グロー、PPVは `var(--ppv-accent)` 35%境界・紫10%グローである。
- 儀式見出しの実文言は、`━━ 天頂戦 歴代優勝 ━━` と `━━ PPV GRAND FINAL 歴代優勝 ━━`。天頂戦はShippori Mincho `16px`／字間`8px`／`var(--gold)`、PPVは `14px`／字間`5px`／`var(--ppv-accent)`。リードは順に `4年に一度、業界の頂を決める舞台`、`毎年の頂点 ─ 直近から`（`10px`、字間`2px`、`var(--text-dim)`）。
- 天頂戦は開催シーズン昇順で表示する。アッパーは **132×198px**、金65%の`2px`境界、角丸`8px`、金22%の22pxグロー。列は下端揃え・要素間`22px`・横スクロール可。各カードに名前（`13px`太字）、任意の団体名（`9px`）、`🌿S{season}🌿`（Bebas Neue `15px`）、`第{index+1}回 王者`（`9px`）を出す。
- 天頂戦の末尾には、必ず次回の空席を出す。文言は `⛰`、`次回`、`S{nextTenchosen}`、下部に `S{nextTenchosen}` と `開催前`。空席は破線・`var(--border)`・透明背景・グローなし・`var(--text-dim)`である。
- PPV GRAND FINALは開催シーズン降順で表示する。アッパーは **96×144px**、横列の間隔は`14px`、横スクロール可。紫55%の`2px`境界、紫18%の16pxグロー、名前`11px`、シーズンはBebas Neue `13px`で表示する。
- アッパー画像は `getUpperUrl(id, peakOVR)`、`object-position: top` を使用する。画像なしは選手名の先頭文字、選手データが開けるときだけ `role="button"`／`tabindex="0"` とクリックで `showFighterPopup(id, null, true)` を付ける。画像に左右反転の指定はない。

### 5-4. 最多連続防衛

- `titleLoss` の `defenses > 0` と、各団体の現王者の `defenses > 0` を候補にする。防衛数降順、同数なら継続中、さらに終了シーズン降順で先頭を採用する。
- 横帯は要素間 `20px`、内側 `14px 20px`、角丸`8px`、金30%境界、左上金12%の放射状グラデーション + `var(--bg-card)`。
- アッパーは **88×132px**、金65%の`2px`境界、角丸`6px`。上端`-13px`に `👑`（`19px`）を重ねる。
- 実文言は `最多連続防衛`、`{defenses}度防衛`、選手名、`{titleName} ─ {period}`、現王者であれば末尾に ` ─ 継続中`。防衛数はBebas Neue `46px`・`var(--gold-light)`、見出しはShippori Mincho `12px`・字間`4px`・`var(--gold)`、選手名は`15px`太字である。
- 候補がない場合、このセクションは出力しない。

### 5-5. ピークOVR表示（関連仕様）

- 表示条件は両方の実装で **現在OVR `<` `careerRecord.peakOVR`** のときだけ。現在OVR以上、またはピーク値が0の場合は出さない。従って成長途上の選手には出ない。
- 選手詳細ポップアップ（`showFighterPopup()`）のヘッダーでは、現OVRの右に `ピーク {N} (S{season})` を置く。`13px`、`var(--text-sub)`、下端余白`5px`。シーズンは`11px`・`var(--text-dim)`。
- 団体タブのロスター詳細（`_renderRosterDetailPanel()` の能力タブ）では、OVR行に `ピーク {N}(S{season})` を置く。`12px`・`var(--cream-text-dim)`、ピーク値は`var(--cream-text-sub)`、シーズンは`11px`。

### 5-6. DB全選手一覧の称号バッジ

バッジは全所属・FA・引退者を含む全選手一覧の名前右に、次の固定順で表示する。`.db-title-badge` は `10px`、`padding: 1px 5px`、角丸`2px`、左余白`4px`。色は `--db-title-color` に渡したトークンを文字色にし、背景20%・境界40%の `color-mix` にする。`.db-title-badges` と各バッジは `white-space: nowrap` で折り返さない。

| 順 | 表示 | 色トークン | `title` 属性（日本語ツールチップ） | 対象・失効 |
|---:|---|---|---|---|
| 1 | 👑 | `--gold` | `王座保持者` | プレイヤー団体と全AI団体の現王者 |
| 2 | ⛰️ | `--ev-winter` | `天頂戦優勝(第{season}回)` | `careerRecord.history` の直近シーズンの `ppvTournament` / `champion` |
| 3 | 🏆 | `--ppv-accent` | `PPV GRAND FINAL優勝(第{season}回)` | 直近シーズンの `ppvMainEvent`、`isSummit === true`、`won === true` |
| 4 | 🏟️ | `--ev-summer` | `ジュニアトーナメント優勝(第{season}回)` | 直近シーズンの `juniorTournament` / `champion` |
| 5 | ⚔️ | `--ev-autumn` | `秋の4団体勝ち残り対抗戦優勝(第{season}回)` | 直近シーズンの `autumnWar` / `champion` |
| 6 | 🌸 | `--db-title-spring` | `春のタッグリーグ優勝(第{season}回)`。seasonなし時は `春のタッグリーグ優勝` | `Engine.springTagLeague.getActiveBestTagTeam(G)` の2選手。片方が現所属ロスターにいなければ両方非表示 |

- 2〜5は、大会ごとに履歴を全選手分走査し、最大の`season`の優勝者ID集合だけを使う。同大会の次回優勝確定時に過去シーズンの優勝者は集合から置き換えられ、歴代バッジにはしない。
- 引退者も一覧の走査対象であり、直近優勝者なら同じ基準で表示する。春タッグは有効性判定により引退／退団時に失効する。

## 6. データ接続・状態バリエーション

| 要素 | データ源・導出 |
|---|---|
| 記録タブのNEW | `G.mqRecord`／`G.mqRecordTag` の `season`・`week` と現在の `G.season`・`G.week` の一致 |
| MQシングル／タッグ | `G.mqRecord`／`G.mqRecordTag` の `value`、`holderIds`、`orgId`、`season`、`week`、`stage`。初期値は各々90／94 |
| MQ選手名・顔 | `Engine.mq._fighterName(G, id)`、`getPortraitUrl(id)` |
| 天頂戦・PPVの候補 | プレイヤー、AI、FA、引退、年代記アーカイブ、全殿堂、旧殿堂をID重複除去した選手群の `careerRecord.history`。天頂戦は `ppvTournament` / `champion`、PPVは `ppvMainEvent` + `isSummit` + `won` |
| アッパーと詳細導線 | `getUpperUrl(id, _recordBookPeak(source))`。ピークは `careerRecord.peakOVR` → `fighter.peakOVR` → 現OVR の順で解決。`canOpenFighterPopup(id)` が真の場合だけ詳細を開く |
| 最多連続防衛 | 各選手の `careerRecord.history` の `titleLoss.defenses`、および `G.titles.world`／各 `G.aiOrgs[*].titles.world` の現防衛数 |
| 称号バッジ | 全所属・FA・引退者の `careerRecord.history`、各団体の `titles.world.championId`、`Engine.springTagLeague.getActiveBestTagTeam(G)` |
| ピークOVR | `fighter.careerRecord.peakOVR` と `fighter.careerRecord.peakOVRSeason` |

| 状態 | 表示 |
|---|---|
| 初期表示 | `🏅 殿堂入り` セグメント。`_dbRecSeg = 'hof'` |
| MQ未更新 | 90（シングル）／94（タッグ）を減光表示。対戦カード・開催情報・不在説明文なし |
| 当週MQ更新 | 該当ストリップに `記録更新!`、記録サブタブに `NEW` |
| 天頂戦の優勝履歴なし | 歴代王者カードは0件、次回の空席のみ表示 |
| PPV優勝履歴なし | PPV横列は空。空状態説明は実装しない |
| 最多連続防衛の候補なし | 防衛横帯を出さない |
| 選手画像なし | 顔／アッパーに選手名先頭文字。エラー時の画像要素は削除 |

## 7. 関連

- 階層1：`docs/ui/01-foundations.md` のOffice（Dark Panel、金アクセント）。
- ベースライン：`docs/ui/mockup-baseline-v0.1.md` の数値=Bebas Neue、顔は一覧用の正方形系、アッパーは2:3系という原則を参照する。ただし、歴代優勝の実装寸法は天頂戦132×198px、PPV96×144px、防衛88×132pxであり、本仕様書では実装値を採用する。
- 確定モックアップ：`docs/ui/mockups/hof-records-and-peak-ovr-v0.4.html`。
- 既存殿堂の仕様は本書のスコープ外。`hof` セグメントでは `_renderDbHallOfFame()` の既存仕様を維持する。

## 未決事項

- 実装済みの記録タブについて、モバイル実機での2列MQストリップと天頂戦列の横スクロールの確認が残る。
- `.db-record-glory-card` は `role="button"` と `tabindex="0"` を持つが、Enter／Spaceのキーハンドラは現行実装にない。キーボード操作を追加するかは本仕様書では決めない。
