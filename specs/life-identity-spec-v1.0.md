# 選手の人生(同姓同名の別人)仕様 v1.0

- 確定: 2026-09-26(裁定 K-4「引退した選手の再デビューは同姓同名の別人として扱う。襲名はしない」。設計書 §9 の確認8つはすべて「はい」)
- 設計の経緯: `docs/fun-audit-v0.1/k4-separate-lives-design.md`(計測・経路の洗い出し・決めた理由)
- 実装: S1〜S3(休眠プールの入口・人生番号の土台・転生の関所)、S4〜S8(恒久記録・休み・表示・既存セーブの移行・本仕様)
- 関連仕様: scout-system-spec §9(休眠プール・FA・フリーのまま引退)/ career-history / chronicle-system v0.3 / chronicle-prologue / relationship-system v2.3 / call-name / newspaper

---

## 1. 人生の定義

- **人生** = あるIDの選手が、初めてどこかの団体(自団体・AI団体)と契約した時点から、引退するまで。
- 一度もデビューしていない見込み選手(休眠プール・FA・スカウト候補の子)は、まだ人生が始まっていない。作り直されても同じ子。
- 同じIDの人生が時間的に重なることはない(引退から戻るまで最低5季空く。§5)。
- 人生番号は**内部の識別子**で、画面には出さない。「二代目」「同じ名を継ぐ」のような呼び方・演出もしない。顔画像はIDで引くので同じ顔になる(同姓同名の別人の範囲として受け入れる)。欠番はあってよい。

## 2. データ

| 置き場所 | 名前 | 意味 | 無いとき |
|---|---|---|---|
| 状態 | `lifeSerial` = `{ [id]: n }` | そのIDの「今の人生」の番号 | 1 |
| 選手 | `lifeNo` | その選手が属する人生 | `lifeSerial[id] ?? 1` |
| 選手 | `debutSeason` | その人生で最初に団体に所属した季(オフ中の獲得は翌季) | 旧セーブは在籍季数から推定 |
| 状態 | `retiredLives` = `{ [id]: {lifeNo, debutSeason, endSeason, lastOrgId, titleReigns, crowned, alumni, hof} }` | 引退した人生の要約。引退から転生までの間だけ持つ(転生の関所で消える) | 殿堂・年代記アーカイブから推定(§5) |
| 殿堂エントリ・年代記アーカイブ | `lifeNo`(アーカイブは `debutSeason` も) | どの人生の記録か | 旧データ(§8 の移行で刻む) |
| 殿堂エントリ | `startUnknown: true` | 在籍の始まりが信用できない旧AI殿堂(表示は「〜S9」) | — |
| 年代記の章(毎季作り直し) | エース・同世代に `lifeNo`・`careerSeasonsStart/End`・`active` | 顔・名前を押したときの行き先・在籍年 | — |
| 序章のハイライト | `characterLifeNo` | 人物の人生 | — |
| 統一王座の履歴・相関図の退避・裏切りの記録 | `lives` = `{ [id]: n }` | 当事者の人生 | 旧データ(統一王座の履歴は移行で刻む) |
| 業界ニュース・新聞の記事 | `characterLives` = `{ [id]: n }` | 記事の人物の人生(業界ニュースは積んだ時点、記事は紙面を作る時点) | 旧号(従来どおり今の選手を開く) |
| 状態 | `_migrated_k4_lives_v1` | 既存セーブの移行を済ませた印(新しいゲームは印つきで始まる) | — |

- `Engine.life.of(state, f)` = `f.lifeNo ?? lifeSerial[id] ?? 1`。記録を書く側はこれで番号を得る(印付けの前の見込み選手でも正しい)。
- 印付け `Engine.life.stamp`(何度呼んでも同じ): tickWeek の入口・advanceWeek の入口・repairOnLoad の末尾・createInitialState。

## 3. 転生の関所(唯一)

`Engine.life.beginNewLife(state, id)` — 引退枠(retiredIds)から休眠プールへ戻すIDは、3つの経路(季末の補充 advanceWeek・ロード時修復 repairOnLoad・CLI tools/save-doctor.js。CLI は repairOnLoad に一本化済み)すべてでここを通す。

1. `closeLiveRecords`: 前の人生の**生きた記録**(関係値・逓減カウンタ・関係フラグ・締め出し・ポップアップ冷却・呼び名・王座因縁・対戦成績・対戦ログ(自団体・AI)・タッグ経験・人気逆転・W-1・伝染・N-06・Glimpse の前週値/発火済み/冷却・スナップショット冷却・報道済みの印5種・コーチの担当。一覧は `Engine.life.LIVE_RECORD_STORES`)を退避してから消す。休眠プールの項目の `grudge` も落とす。
2. 退避: **対戦のあった組だけ**を `relationshipHistory.retiredRivalries` に1組1件 `{id1, id2, reason:'lifeEnd', retiredFighterId, lives, season, h2h: {bySeason}}` で残す。読み手は年代記の2か所(エース・同世代の宿敵。章の季の窓で `bySeason` を数える)だけ。相関図の過去の線は §6 のとおり lifeEnd の組を描かないので、関係値・因縁・勝敗の要約は持たない(セーブ容量。§9)。
3. `lifeSerial[id]` を1つ進め、`retiredLives[id]` を消す。

番号は引退の時点ではなく転生の時点で進める(引退後に書かれる記録 — 年末の殿堂入り・翌季の引退記事・年代記の登録 — を引退した人生の番号で刻むため)。

## 4. 休眠プールの入口(scout-system-spec §9)

デビュー済みの選手は休眠プールに入れない(R1)。手放す経路は `Engine.util.releaseToMarket` に一本化し、デビュー済みは FA へ(R2)。丸1季拾われなければ「フリーのまま引退」(R3。殿堂判定・新聞つき)。月次入れ替え・FA若返りは見込み選手だけ(R4/R5)。休眠プールの21歳超はその場で若返り(R6)。

## 5. 戻ってくるまでの休み

- **注目の人生**(その人生で (a) 殿堂入りした (b) 王座を獲った — 団体王座・統一王座・天頂戦優勝 (c) 自団体に在籍した)は `DORMANT_POOL_CFG.retiredCooldownNotable = 15` 季、通常は `retiredCooldown = 5` 季。
- 判定 `Engine.life.isNotableLife / returnCooldown / canReturn`。材料は `retiredLives`(書き手は引退者全員が通る3か所: 自団体 `finalizeRetireeBuffer`・AI団体 `processSeasonEnd`→advanceWeek・`retireUnsignedFreeAgents`)。無いとき(旧データ)は殿堂(a)と年代記アーカイブ(c)で判定。
- ロード時修復の「重症」の非常補充で休みを無視してよいのは**通常の人生だけ**。注目の人生は非常時でも戻さない。休みを終えた人生から先に使う。

## 6. 恒久記録: 書くときに番号を刻み、「ID+人生番号」で引く

| 記録 | 書き手 | 読み手 |
|---|---|---|
| 殿堂 `allHallOfFame` / `hallOfFame` | `_buildHofEntry`(`lifeNo`、デビュー記録の無いAI選手の在籍の始まりは `debutSeason`。以前は常に S1) | `Engine.life.findHofEntry(state, id, lifeNo, {endSeason})`、新聞の `_findHallOfFameEntry(…, {lifeNo, retiredSeason})`、殿堂詳細 `openHofDetailById(id, lifeNo)` |
| 年代記アーカイブ | `archiveFighter`(`lifeNo`・`debutSeason`。重複の判定は (id, lifeNo) — 2度目の自団体OGも登録される) | `Engine.life.findArchiveEntry`、`_collectCandidates`(前の人生のアーカイブと今の人生の現役は別の候補)、`_resolveFullFighter`、`_getDepartures`(今季引退した人生)、`founderState` |
| 年代記の章 | 候補の番号がエース・同世代に写る。3章上限も (id, 人生) 単位 | 殿堂バッジ・リンク・顔の押下 |
| 序章 | 旗揚げメンバーは必ず1番目の人生 | `founderState`: 転生して戻った同名の別人を「現役」にしない。カード・押下は1番目の人生 |
| 統一王座の履歴 | 戴冠・返還・返上・挑戦権・防衛・移動の各項目に `lives` | 記録タブの歴代表、防衛記事の「奪取」判定(今の人生だけ) |
| 新聞 | 業界ニュース(`Engine.industryNews.push`)と記事に `characterLives`。AI引退のキューに `lifeNo`・`retiredSeason` | 名前・写真の押下、殿堂特別号の照合、前の人生の一面では今の同名の所属を出さない |
| 相関図の退避・裏切りの記録 | 自団体の引退の退避(app.js)・裏切りの記録にも `lives` | 相関図の「過去の線」: `lives` が表示中の2人の今の人生と一致するときだけ |
| 記録タブ | — | 元データの重複除去は `${id}#${人生}`(前の人生の天頂戦優勝・防衛記録が消えない)。統一王座の歴代表は履歴の `lives` で引く |

対象外(優先度が低く、今回は番号を刻まない): 記録保持者(`mqRecord` / `mqRecordTag` / `streakRecord` の holderIds — 名前と顔だけで押せない)、年末表彰(季が付いているので季で判定できる)、新聞の今週の興行・対戦カード・相関の欄(今の人生の選手しか載らない)。

## 7. 表示

- **在籍年**「S3〜S9」(現役は「S3〜」、始まりの分からない旧データは「〜S9」)を、**同じIDの別の人生が同じ画面に並ぶところにだけ**添える: 殿堂の一覧カード(同じIDが2つの人生で殿堂入り)、記録タブ(天頂戦・PPV・統一王座・最多防衛)、年代記の章(同じ章に別の人生)。殿堂詳細の在籍年は常に出す(`startUnknown` のときはシーズン数を出さない)。
- **顔・名前を押したとき**: 今の人生(現役・FA・引退直後)→ 選手詳細 / 前の人生で殿堂入り → その人生の殿堂詳細 / 前の人生で殿堂入りしていない → 押せない(カーソルを出さない)。入口は `findFighter(id, source, lifeNo)` / `canOpenFighterPopup(id, lifeNo)` / `showFighterPopup(id, source, _, lifeNo)`。
- 今の人生の選手詳細に前の人生の話は出さない。

## 8. 既存セーブの移行(1回だけ)

`Engine.life.migrateLegacyLives`(repairOnLoad の中、引退の後始末と引退枠からの補充より前)。印 `_migrated_k4_lives_v1`。2回かけても同じ結果(印を外して数え直しても同じ番号)。

| # | 内容 |
|---|---|
| M1 | `lifeSerial` を作る(既存の値は下げない) |
| M2 | IDごとに殿堂と年代記アーカイブを終わりの季で並べ、2季以内は同じ人生として 1..k を刻む。**同じ人生が殿堂に2度登録されている旧データ**(同じ在籍年で別の季にもう一度殿堂入り)は最初の殿堂入りだけ残す |
| M3 | 生きた選手: デビュー(無ければ `max(1, 季 − 在籍季数)`)が最後の記録の終わりより後なら k+1(転生済み)、そうでなければ k(他団体へ移った自団体OGなど同じ人生)。**旧セーブに S2 の印付けで付いた lifeNo(全員1)は正としない**。`lifeSerial` は max(既存, 数え直し) |
| M4 | 休眠プールのID: k+1 |
| M5 | 引退枠のID: 引退した人生の番号(引退した季が最後の記録より後なら記録の無い人生として k+1) |
| M6 | 休眠プールの全IDの生きた記録を今閉じる(次の新人は白紙で始まる) |
| M7 | 転生済みの現役の関係値・対戦成績は切り分けない(1つに混ざっていて分けられない) |
| M8 | 転生済みの現役の `newsSeen.retired` を消す(2度目の引退が記事になる) |
| M9 | 始まりの信用できない旧AI殿堂(始まり S1)に `startUnknown` |
| — | 統一王座の旧履歴に `lives`(季による判定を確定)。開発版(S3〜S6)の形式の lifeEnd の退避を §3 の形に詰める。年代記の章を作り直す |

CLI `tools/save-doctor.js --repair` は独自の再投入を持たず、`Engine.saveDoctor.repairOnLoad` に委ねる(使い方 docs/SAVE-DOCTOR-使い方.txt は不変)。

## 9. 不変条件・検証

- I-1(validateGameState): 現役・FA・スカウト候補の `lifeNo` は今の人生と一致
- I-2(validateGameState): 殿堂・年代記アーカイブに同じ (id, 人生番号) が2件ない
- 回帰テスト: `k4-dormant-entry-test` / `k4-life-serial-test` / `k4-rebirth-clean-test` / `k4-permanent-records-test` / `k4-return-cooldown-test` / `k4-ui-lives-test` / `k4-migration-test`
- 計測: `node test/k4-lives-probe.js <季数> <シード> [--load-repair]`(供給・転生・再デビュー率・恒久記録の番号・フリーのまま引退・ロード時修復・セーブ容量)

### 計測値(2026-09-26)

`node test/k4-lives-probe.js 100 42`(S11以降。K-4 前 = `WM_SOURCE_REF=28b92b9f`)

| 項目 | K-4 前 | K-4(S1〜S8) |
|---|---|---|
| 休眠プール(第1週)中央値/最小 | 8 / 4 | 11 / 4 |
| ドラフト前の17-18歳 | 6 / 4 | 7 / 4 |
| スカウト候補 | 6 / 4 | 7 / 4 |
| FA(第1週) | 6 / 4 | 7 / 3 |
| AIロスター合計 中央値/最小/10%点 | 36 / 29 / 31 | 38 / 29 / 35 |
| AI S/A/B 中央値(最小) | 16/11/9(13/7/4) | 16/13/10(12/9/6) |
| 自団体ロスター | 8 / 5 | 8 / 5 |
| 転生(前の人生でデビュー済み)/ うち引退を経ない | 599 / 219 | 609 / 0 |
| 転生の初見時点で前の人生の生きた記録が残っていた | 599 | 15(すべて団体ロスターで初見 = 関所の後に新しい人生で書かれた記録) |
| 再デビュー率 注目 / 通常 | — | 84% / 95%(注目の人生の引退→転生 最小15季・早戻り0件) |
| 殿堂 (id,人生)の二重 / 番号の無いエントリ | — | 0 / 0(115件中、2つの人生で殿堂入りしたID 31) |
| フリーのまま引退 | — | 1.99人/季(殿堂判定199人・紙面に出た177人) |
| lifeEnd の退避(S101) | — | 4,719件・JSON 629KB・圧縮後 89KB(状態全体の圧縮後 740KB) |

- 退避を読み手が必要とする形に詰める前の形式(関係値・因縁・勝敗の要約つき、対戦の無い組も退避)は、40季で 2,461件・圧縮後 108KB だった(詰めた後 1,732件・33KB。100季なら約290KB → 89KB)。1人生あたりの件数の上限は、年代記の宿敵の数え方を変えずに掛けられないので設けていない(転生1回あたり平均約7組)。
- ロード時修復の変種(各季第5週に repairOnLoad、40季): 戻ったID 232件すべてが関所を通り、注目の人生が15季未満で戻った件数 0。

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-09-26 | v1.0 初版(K-4 S1〜S8) |
