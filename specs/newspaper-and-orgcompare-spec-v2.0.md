# 新聞タブ独立 v3.0 — 確定UI仕様

最終更新: 2026-07-21 (春タッグリーグ優勝ペアの一面写真に対応)

## 業界ニュースキュー (2026-04-30 追加)

1面 `np-sub-stories`(業界ニュース欄) は従来 `Engine.newspaper.generate` が AI団体の `_newsXxx` フラグと自団体の `currentNewspaper` だけを拾っていた。これに加えて `state._industryNewsEvents` キューを毎週新聞生成時に消費するパスを追加。

- **キュー push API**: engine 側 `Engine.industryNews.push(state, ev)`、UI 側 `App._pushIndustryNews(ev)`。
- **イベント type 一覧** (PRIORITY 値): `factionEscalation:125` / `factionResolution:122` / `reclaimSuccess:120` / `reclaimChallenge:108` / `reclaimFailure:102` / `factionFormed:90` / `factionSplit:88` / `factionDissolution:85` / `lockerRoomCrisis:75` / `firstMeetSinceDeparture:72` / `relationshipRepair:68` / `relationshipRepairFail:55` / `hatredContagion:50`。王座交代(130)と興行(120)の中位帯に配置し、興行記事を押し出さない設計。
- **派閥イベント拡充 (2026-07-05 C-1)**: Tier A 大ネタ = `factionCoup:118`(下剋上) / `factionWarSettled:115`(F09 対抗戦決着) / `factionEndless:112`(無限抗争) / `factionDefection:105`(F04 寝返り成立) / `factionShowdown:95`(F08 リーダー直接対決決定) / `factionSuccession:87`(F03 後継就任・turmoil 含む) / `factionPeace:84`(F02 沈静化) / `factionReconcile:82`(F06 和解=A択) / `factionHiatus:78`(F05H 活動休止)。Tier B 日常ネタ(閑散週の埋め草・低 priority でソートに自然に弾かれる) = `factionInternalBout:58`(Common-1 同門対決=A択) / `factionMediaFeature:52`(Common-5 取材=A択) / `factionJointProject:50`(Common-7 合同企画=A択) / `factionCamp:48`(Common-4 合宿)。**設計原則: 「外から見える出来事」だけ記事化**(慰留成功・告げ口などの未遂、社長の内々の決裁は載せない)。
- **テンプレ**: `data.js` の `NEWS_HEADLINE_TEMPLATES` に黒田トーンで各 type 1〜3バリエーション。
- **クリア**: `tickWeek` 内 `weeklyNewspaper` 生成直後に `_industryNewsEvents: []` で消化(週次)。
- **フックポイント**: `relationships.js`(P-4 ロッカー荒廃) / `management.js`(P-6 修復チャネル) / `app.js handleFactionEvent`(F01/F02/F02_PEACE/F02_RESOLUTION/F02_ENDLESS/F03 消滅+後継/F04/F05/F05H/F06/F08/COMMON_1/COMMON_4/COMMON_5/COMMON_7) / `app.js`(`confirmReclaim`・奪還結果・F09 sweep 決着ブロック) / `factions.js applyInternalChallengeResult`(下剋上成立) / 試合 h2h.update 時(B-3 firstMeetSinceDeparture)。

新聞画面(独立タブ「📰 新聞」、`screen-newspaper`)に統合された 1面/2面/3面 のUI仕様。`docs/ui/mockups/newspaper-mockup-v8.html` 準拠。Phase 2 の DBサブタブ実装(`_dbSubTab=2/5/8`)を破棄し、独立トップタブに移管した v3.0 設計。

## 1. 全体構造

```
ナビバー: 「📰 新聞」(showScreen('newspaper'))
└── #screen-newspaper
    └── #newspaperContent
        ├── .np-outer-tabs (1面/2面/3面 切替)
        └── .np-paper (max-width:780px)
            ├── .np-paper-header (週刊グラップル + シーズン/週)
            ├── .np-archive-nav (1面のみ: バックナンバーナビ)
            └── .np-content
                └── (1面/2面/3面 個別本文)
```

`.np-paper` は 780px 幅・クリーム紙背景・赤ヘッダーで 3面共通。

## 2. CSS 命名規約

すべて `.np-*` プレフィックス。グローバル `.sec-label` などと衝突しないよう独立 namespace。

| クラス | 用途 |
|---|---|
| `.np-outer-tabs` / `.np-tab` | 紙面外のページ切替タブ |
| `.np-paper` / `.np-paper-header` / `.np-content` | 紙面コンテナ |
| `.np-sec` / `.np-sec-gold` | セクション赤ピル / 金ピル (display:inline-block + width:fit-content + justify-self:start) |
| `.np-kuroda` / `.np-kuroda-face` / `.np-kuroda-text` / `.np-kuroda-byline` | 黒田寸評ブロック |
| `.np-archive-nav` | バックナンバーナビ |
| **1面** `.np-news-lead / .np-top-story / .np-top-photo / .np-top-headline / .np-top-sub / .np-top-text / .np-show-result / .np-versus-grid / .np-fc / .np-fphoto / .np-vs-block / .np-result-line / .np-show-article / .np-rating / .np-digest / .np-digest-table / .np-digest-thumb / .np-sub-stories / .np-sub-grid / .np-sub / .np-preview` | 1面 |
| **2面** `.np-cmp-select / .np-headline-section / .np-headline-grade / .np-org-summary / .np-org-card / .np-versus-mark / .np-ace-confront / .np-stand-wrap / .np-stand-img / .np-ace-name-bar / .np-ace-side / .np-ace-flavor / .np-matchup-list / .np-matchup-row / .np-power-section / .np-power-bar-wrap / .np-editorial / .np-spotlight-grid / .np-spotlight` | 2面 |
| **3面** `.np-rivalry-headline / .np-rivalry-main / .np-rivalry-stand / .np-rivalry-vs / .np-rivalry-info / .np-rivalry-side / .np-rivalry-narrative / .np-history / .np-history-row / .np-relations / .np-relation-card` | 3面 |

## 3. 1面: 興行 (`_npRenderPage1`)

表示順:
1. **np-top-story** — `grid-template-columns:200px 1fr` + `.np-top-photo` 200×240 額装(EXCLUSIVE スタンプ + キャプション overlay) + 24px見出し + sub バー + justify本文。通常記事は代表選手1名のupper画像、`springTagResult` は優勝ペアの `characterIds[0..1]` を左右58%幅で配置し、中央を少し重ねて2名を同じ枠へ表示する。修正前セーブの同記事は、記事と同じシーズンの `springTagLeague` または `bestTagTeam` からペアIDを補完し、別シーズンの結果は流用しない
2. **np-show-result** — `playerShowData` がある週のみ。130×130 fighter-card×2 + WIN スタンプ(勝者) + result-line(MQ大字) + show-article + rating-block(★+headline+黒田コメント)
3. **np-digest** — `_npRenderDigest()`。テーブル形式 4列(#/badge/カード/MQ右寄せ)、寸評行は colspan
4. **np-sub-stories** — 2col グリッド。subStories の portrait + headline + body、まとめ末尾に黒田寸評
5. **np-preview** — 次回展望

ダイジェスト ★算出: 廃止(モックアップ準拠で MQ列のみ)。寸評は `NEWSPAPER_DIGEST_COMMENTS.{great|good|average|poor|bad|draw|upset|dominant|titleMatch}` から `Engine.rng.derive(season, week, idx, 0xD1C0)` でseeded pick。

**期待MQの算出 (`_calcExpectedMQ`)**: 寸評プール選択は `diff = mq - expectedMQ` を `+15/+5/-4/-15` で5段階に分類する相対判定 (`great/good/average/poor/bad`)。`expectedMQ` は会場index×orgPopから `EXPECTED_MQ_BY_VENUE[idx].base + orgPop × popCoef` で算出し、上限80でクランプ。**この per-match 期待MQはショー評価系 `SHOW_RATING_CONFIG.expectedMQTotal` (data.js) と整合させる**: ショー評価が「6試合合計220」を基準にする(=平均≒37/試合)のに対し、寸評側はそれと同帯〜やや上 (公民館32〜ドーム80) を per-match 期待値とする。両者が乖離するとショー4★の興行で全undercardが`bad`プールに落ちる自己矛盾が生じるため。テーブル数値: 公民館 base30/coef0.15 → ドーム base65/coef0.40、cap80。

## 4. 2面: 団体比較 (`_npRenderPage2`)

データ源: `Engine.database.getOrgCompareAnalysis(state, orgId)`。表示順:
1. **np-cmp-select** — ライバル団体ドロップダウン
2. **np-headline-section** — 黒田顔(40px丸) + 引用(summaryText) + GRADE(36px Bebas)
3. **np-org-summary** — `grid 1fr 50px 1fr`。player/VS/rival 各カード(name + tier badge + tags + stats grid + 王者表示)
4. **np-ace-confront** — `grid 1fr 100px 1fr` の 280px 高 upper画像対峙(右側のみ `scaleX(-1)` flip)。中央 VS+OVR メトリクス。下に `.np-ace-name-bar`(2col 中央寄せ: 団体/名前/OVR・人気)。フレーバー文(opportunity)
5. **np-matchup-list** — 主力対決 2件 (matchups[1..])。1fr/110px/1fr で player(左)/VS+role+verdict/rival(右反転)
6. **np-power-section** — **戦力レーダー4軸 単色バー**(`.player-side` 単色 `#9a7020`、`.rival-side` 単色 `#8b1a1a`)。左右に伸び、中央 1px ライン、右端に diff
7. **np-editorial** — 黒田コラム(summary + opportunity + risk + scout)
8. **np-spotlight-grid** — ライバル注目選手 3件(エース/スター/脅威タグ)

軸: `ace / depth / popularity / starPower` を `playerScores[ax.key] / rivalScores[ax.key]` から取得(0-100 cap)。

## 5. 3面: 因縁列伝 (`_npRenderPage3`)

データ源: `_pickRivalryFeatured(G)` の `featured` + `relations[0..5]`。表示順:
1. **np-rivalry-headline** — pre(タグ別ラベル) + title + sub。9象限タグ別 9 種テーブル(`headlineMap`)
2. **np-rivalry-main** — 暗背景。
   - photos: `grid 1fr 100px 1fr` + **np-rivalry-stand 320px 高**(画像はupper:`background-size:contain;background-position:center bottom` で引き気味)。右側 `scaleX(-1)` flip
   - VS: 42px Bebas + h2h バッジ(W-L-D) + `N戦` ラベル
   - **np-rivalry-info**: `grid 1fr 1fr` で**完全中央寄せ**。各サイドに `団体 / 名前(クリック可) / 役割(style/role) / OVR(runtime値) / 年齢 / 勝数` を中央表示
   - narrative: `KURODA_RELATION_NARRATIVE[tag]` から seeded pick (`Engine.rng.derive(season, week, idA, idB, 0xC1A1)`)、不在時はフォールバック
3. **np-history** — `h2h.history[]` 直近10戦を時系列(新→古)。stage バッジ(PPV/対抗戦/興行) + 結果列
4. **np-relations** — 2col × 6 件の関係カード。9象限タグ別の `np-relation-tag` カラー(heat/respect/cold)

**runtime fighter 取得**: `_npFindRuntimeFighter(state, id)` で `roster / aiOrgs.*.roster / freeAgents / retiredFighters` を順に検索し、age や trained ステータスを反映した OVR を表示。

## 6. KURODA テキスト接続点

| 用途 | 配列 | seed |
|---|---|---|
| 1面 一面記事 他団体寸評 | `KURODA_NEWS_COMMENT[storyType]` | `derive(season, week, 0xC0DA)` |
| 1面 他団体ニュース寸評 | `KURODA_NEWS_COMMENT[storyType]` | `derive(season, week, 0xC0DC)` |
| 1面 興行総合評価 | `KURODA_SHOW_RATING.stars{0-5}` | `derive(season, week, 0xC5A1)` |
| 1面 ダイジェスト寸評 | `NEWSPAPER_DIGEST_COMMENTS.{rating}` | `derive(season, week, idx, 0xD1C0)` |
| 3面 featured narrative | `KURODA_RELATION_NARRATIVE[tag]` | `derive(season, week, idA, idB, 0xC1A1)` |
| 3面 relations カード narrative | `KURODA_RELATION_NARRATIVE[tag]` | `derive(season, week, idA, idB, 0xC1B2)` |

## 7. DB側からの撤去

`renderDatabase()` のサブタブ配列から `2 (団体比較) / 5 (新聞) / 8 (因縁列伝)` を削除。残り順序: `0 全選手 / 1 全コーチ / 4 相関図 / (7 派閥 条件付) / 3 殿堂 / 6 年代記`。旧セーブで `_dbSubTab=2/5/8` を保持していた場合は `renderDatabase()` 冒頭で 0 にフォールバック。

`_renderDbNewspaper / _renderDbOrgCompare / _renderDbRivalry` は呼び出し元なし(dead code、将来削除候補)。

## 8. レスポンシブ

`@media (max-width: 820px)`:
- top-story 1col 化、photo 100% 220px
- versus-grid 1fr 70px 1fr、fphoto 100×100
- sub-grid / spotlight-grid / relations-grid 1col
- org-summary 1col、versus-mark 縦並び
- rivalry-stand 240px

## 9. 実装ファイル

| ファイル | 役割 |
|---|---|
| `src/index.html` | ナビボタン追加 + `#screen-newspaper` + `.np-*` CSS 約400行 |
| `src/ui-render.js` | `renderNewspaper / setNewspaperSubPage / _npRenderPage1/2/3 / _npRenderPlayerShow / _npRenderDigest / _npFindOrgChampion / _npFindRuntimeFighter` 等の新規関数群 |
| `src/ui-common.js` | `showScreen('newspaper')` 分岐追加 |
| `src/kuroda-text.js` | `KURODA_RELATION_NARRATIVE` (Phase 1で追加済) |

## 10. 変更履歴

- v1.0 (Phase 1, 2026-04-25): 因縁列伝3面 DBサブタブとして実装
- v2.0 (Phase 2-3, 2026-04-26): 額装200×240/4軸バーレーダー/`.ndt-port` 48px/KURODA +120本/`.sec-label` 重複整理
- **v3.0 (2026-04-26): 新聞タブ独立化 + 780px 統一 + v8 mockup 準拠で全面書き直し + バーレーダー単色化 + 3面 stand 320px・OVR/年齢中央寄せ**
- **v3.2 (2026-05-03): ダイジェスト寸評の期待MQ式を見直し。**`EXPECTED_MQ_BY_VENUE` (`src/ui-render.js:7951`) を base 18→30〜60→65・popCoef 0.30→0.15〜0.80→0.40 に圧縮し、cap を95→80に引き下げ。原因: 旧テーブルではドーム×高人気で expectedMQ が95に張り付き、`bad` 閾値 (diff<-15) 換算で MQ ≦79 がすべて `bad` プールに落ち、ショー4★の興行で undercard 全試合が「退屈な試合」「興行のテンポを完全に殺した」と書かれる自己矛盾が発生していた。ショー評価系 `expectedMQTotal[6]=220` (per-match 平均≒37) と整合する水準まで下げ、新値ではドーム×orgPop50 で expectedMQ≒80、MQ77 → diff -3 → `average` として再判定される。`bad` プールは MQ50台以下 + 高期待会場の極端な駄試合に限定。黒田の辛辣トーン自体 (プール文言) は据え置き。
- **v3.1 (2026-04-29): 4面「年間MVPレース」を追加。タブ表記=「📊 4面 MVPレース」、紙面内見出し=「📊 4面 ・ 年間MVPレース」(タブは短く、紙面は正式名称)。1〜3位カードに `Engine.mvpRace.generateRichBlocks` の補強行(直近名勝負ファクト)、2/3位ミニカードに事績チップ + フレーバー文、4位以下は3段リッチ行(順位ヘッダ + 事績チップ + フレーバー1行)に再構築。英字ラベル `RANK / POINTS / PT / NEW / TOP3` を「順位 / ポイント / 初登場 / 三傑」など日本語/カタカナへ統一（`OVR / MQ / PPV / pt` は業界略号として維持）。データ源: `careerRecord.history` / `state.h2h` / `state.relationships` / `G.snapshots` / `fighter.traits`。実装: [src/management.js](../src/management.js) `Engine.mvpRace.generateRichBlocks` + 補助関数群、[src/ui-render.js](../src/ui-render.js) `_npRenderPage4 / _npMvpRaceRank1Card / _npMvpRaceMinorCard / _npMvpRaceListRow`、[src/index.html](../src/index.html) `np-mvprace-list-row--rich / np-mvprace-fact-chip / np-mvprace-flavor / np-mvprace-rich-line` CSS。
