# UI walkthrough harness

Chromium で製品の `src/index.html` を開き、fixture セーブから翌シーズン第1週までを実UIクリックだけで走破する長時間テストです。製品コードや `G` は変更しません。`page.evaluate` は画面・進行状態の読取りにだけ使います。

## 実行

```powershell
npm run test:ui:walkthrough -- --mode walk --seasons 1 --seed 42
```

既定の全体タイムアウトは15分です。再現範囲を絞る場合は、失敗アーティファクトの `README.txt` に記録された `--max-steps` 付きコマンドを使います。

### ENモード(--lang・2026-09-04 P6-2対応)

```powershell
npm run test:ui:walkthrough:en
# 同義: node test/ui-walkthrough/run.js --lang en
# pseudo(擬似ロケール)も指定可: --lang pseudo
# env でも指定可: $env:WM_LANG='en'; npm run test:ui:walkthrough
```

`--lang <ja|en|pseudo>`(既定 `ja`。env `WM_LANG` でも上書き可)は、ページ読込前に `localStorage.wm_lang` を書きます(`wm_audio` の完全ミュート設定と同じ `page.addInitScript`)。既定の `ja` は従来どおり何も変えないため、`npm run test:ui:walkthrough`(引数なし)の挙動・digestは不変です。

EN/pseudo実行時のみ、レポート末尾に次の2種の**情報集計**(失敗条件にはしません — 意図的に日本語のまま残る選手データ・フレーバーテキスト等があるため)が付きます。

- `JA exposure by screen`: 画面(activeScreen)ごとに観測した「日本語文字(ひらがな/カタカナ/CJK)を含む可視要素数」の最大値。ENで日本語が漏れている画面の当たりを付けるための指標であり、0件が正解とは限りません
- `i18n-miss`: `src/i18n.js` の `[WM] [i18n-miss]` fail-openログ(未訳キーは原文表示のまま続行する仕様)の出現件数・ユニークキー数・頻度上位10件。既存の `D1_CONSOLE` 検出からは除外しており、未訳が残っていてもENウォークスルー自体は(他の理由で止まらない限り)先へ進みます

### レイアウト溢れの情報集計(`Overflow`・2026-09-04 P6-9対応)

EN訳文はJA比で文字幅が中央値2.4倍という実測(吹き出し以外のボタン・ナビタブ・表のセル・バッジ・ヘッダー・モーダルのラベル等ではみ出し/切れ/折り返し崩れが起きうる)を受けて、**lang問わず常時**(ja既定でも)レポート末尾に付く情報集計です(失敗条件にはしません)。`detectors.js` の `scanOverflow()` が各ステップの画面(walk本編2箇所+ナビ巡回1箇所、`scanText()` と同じ呼び出し箇所)で可視要素を走査し、3種を検出します。

- **`clip`**: `overflow` が `hidden`/`clip`(または `text-overflow:ellipsis`)で `scrollWidth` が `clientWidth` を2px超えて超過=テキストが物理的に切れている要素
- **`nowrap`**: `white-space:nowrap` の要素が、横スクロールを許さない親要素の右端をはみ出している
- **`wrap-height`**: `button`/`.nav-btn`/バッジ/タブ/チップ/ピル類の同種グループ(3件以上)内で、中央値よりおおむね1行分(line-height×0.9かつ4px超)高い=意図しない折り返し

要素ごとに `screen`(activeScreenまたは`overlay:xxx`)/`selector`(短縮)/`text`(表示テキスト先頭40字)/`overflowPx`(超過px)を記録し、`(screen, kind, selector, text)` で重複排除します(同じ壊れた要素を毎手数え直してカウントが手数に比例して水増しされるのを防ぐ)。レポートには**画面別・種別の集計**と**超過pxの大きい順 上位30件**が出ます。CSS/訳文の修正はこのハーネスの対象外です(報告のみ)。

**既知の制約**: `driver.js` のアクション優先度付け(`actionScore`)は、大半のtierをonclick/id/`data-walk-role`(後述)で言語非依存に特定できるよう2026-09-04(P6-2b/P7-15)で整備済みですが、汎用「次へ/閉じる」系(score 8900)・「結果を見る」系(8800)・「承認」系(8600)の3tierはボタン側の生成箇所が数十か所に散らばっており、いまもJA文言+EN訳文の正規表現に依存しています(`Next`/`Continue`/`Close`/`Done`/`Confirmed`/`See the Result`/`Approve`のような短い定型英単語で翻訳ゆれのリスクが低いため、P7-15では対応を見送りました — 判断根拠は `docs/worklog.md` の P7-15 エントリ)。この3tierに該当するボタン文言の英訳を変更する場合は、変更後に `npm run test:ui:walkthrough:en` を1本回して確認してください。

**P7-22で判明した2つの落とし穴(`listCandidates`/`actionScore`側・2026-09-05)**: `ignite --scenario tenchosen --lang en` が派閥F07モーダル(`.fevt-decision-card`)でD2_FREEZEした実例から見つかった、ボタン生成側(ui-common.js)ではなくドライバ自身に潜んでいた2つのEN固有バグ。どちらも既存のJA挙動・digestには一切影響しない(JAでは元から発火条件に触れないため)。

- **候補ピッカーの100字フィルタ誤爆**: `listCandidates()` は記事本文のような無差別`[onclick]` divを弾くため、BUTTON/fullSurface以外で可視テキストが100字を超える要素を候補から除外していた。`.fevt-decision-card`(`data-choice`付き。F03/F07/F08/F09等の派閥モーダルが共有)のhint文はJAでは短い(<100字)ため素通りしていたが、EN訳は同じ内容でも文字数が伸びやすく100字を超えて誤って除外され、選択肢が1つも候補に残らずD2_FREEZEした。修正: `data-choice`/`data-fighter-id`/`data-walk-role`のいずれかを持つ要素(=`.large-evt-fighter-pick`と同じ「構造化された選択肢ピッカー」の識別規約)は、この100字フィルタの対象外にした
- **`^[AB]`正規表現がaria-label結合後の文字列に誤爆**: `actionScore`の`/^[AB][\s:：]|選択肢\s*[AB]/`規則(旧: 可視テキスト自体が「A: ...」のように書かれた選択肢を拾うためのもの、現在の実UIに実例なし)が、`candidate.searchText`(可視テキスト+aria-labelをスペース結合した文字列)に対して判定されていたため、可視テキストが単独の"A"/"B"(名前頭文字のフォールバックアバター等、`.mdl-a-title-portrait-fallback`)でaria-labelが非空な要素全般に誤爆していた(結合後が偶然"A <aria-labelの内容>"の形になるため)。天頂戦の防衛式典モーダルで、選手の英語名が"A"/"B"始まり(例: Asuka Aikawa)だとポートレートに8200点が付き、正しい続行ボタン(primaryタイの5000点)より高スコアになって無限往復した。修正: この規則だけ可視テキスト単体(`candidate.text`、aria-label結合前)で判定するようにした

#### `data-walk-role` 役割属性(2026-09-04 P7-15)

onclick/idだけでは個別ボタンを特定できない箇所(同じハンドラ・同じ`data-choice`を複数の文言が共有する等)向けに、ボタン生成側(`src/ui-common.js`/`src/ui-render.js`)が言語非依存の`data-walk-role="<役割名>"`属性を付与できます。`driver.js`の`listCandidates()`が`candidate.walkRole`として拾い、`actionScore()`の`WALK_ROLE_SCORES`テーブルが**JA/EN文言の正規表現より先に**スコアを確定します。既存のJA文言条件は保険としてすべて残っており、role属性が付いていないボタンは従来どおりJA/EN正規表現で判定されます。

現在定義済みの役割(`test/ui-walkthrough/driver.js`の`WALK_ROLE_SCORES`参照):

| 役割名 | score | 生成箇所 |
|---|---:|---|
| `contract-accept-raise` | 9300 | 契約交渉モーダルの昇給受諾ボタン(`src/ui-common.js` `showContractNegotiationModal`) |
| `contract-retain` | 9300 | 契約交渉モーダルの引き留めボタン(同関数)+「理由を聞く」後の引き留めボタン(`showContractListenModal`) |
| `advance-week` | 9100 | 週処理ボタン(`doProcessWeek()`)・週総括の「次の週へ →」(`App.advanceFromWeekSummary()`)(`src/ui-render.js`) |
| `to-season-report` / `to-draft` / `to-transfer` / `start-season` | 9100 | オフシーズン進行ボタン(`advanceWeek()`共有、`src/ui-render.js`のnextLabels配列。offW===1の「次へ →」上書きだけは汎用「次へ」系と同じ扱いのため役割なし) |
| `to-result` | 9000 | 興行結果/PPV結果/JT遷移/ドラフト遷移の各クローズボタン(`src/ui-common.js`/`src/ui-render.js`) |

新しいtierを言語非依存化するときは、(1) ボタン生成側に`data-walk-role`を追加、(2) `WALK_ROLE_SCORES`に**そのボタンが従来出していたのと同じスコア値**を登録、の順で行ってください。スコア値を変えるとja側の選択候補が変わり`Actions: N digest=...`が変化するため、既存tierのスコアと必ず一致させることが前提条件です。

### ナビ巡回(walkモード限定・2026-08-31監査対応)

自然走破が構造的に到達できない自由閲覧画面(団体・社長室・ランキング・データベース・新聞・経営・ログ・セーブ・ヘルプ)を、進行を一切妨げないクリーン状態(週画面・オーバーレイ/ポップアップなし・交渉/表彰中でない)で固定順に開き、各画面でD3走査を通してから「今週」へ帰還します。発車は開幕直後の初回と week10 以降の2回(条件はゲーム状態キーのみで壁時計を使わないため、同シード同経路の決定論を維持)。画面を開くだけで中の操作はしません。巡回結果はレポートの `Nav tour:` 行に出ます。ナビタブが画面を開けなければ死にタブとして `D2_FREEZE` で失敗します。

あわせて、ナビタブをランダム走のスコアラーから除外する `NAVIGATION_TEXT` ガードを実ナビ文言(絵文字プレフィックスつき)に一致させました(旧版は絵文字なし完全一致で一つもマッチしない死にガードだった)。一次識別は `.nav-btn` クラス、文言は保険です。

巡回が**どの**駅を開くかの特定は `navButtonLocator`(`.nav-btn[onclick^="showScreen('roster'"]` 等)が担い、`onclick` 第一引数という言語非依存の識別子で行います(2026-09-04 P6-2)。日本語文言(`hasText`)一致だとENモードで巡回開始直後に死にタブ扱いになっていたための修正です。

### recovered-by-retry の記録(2026-08-31監査対応)

クリックしても何も起きず、兄弟ボタンのリトライで前進した手=**死にボタンの容疑**は、これまで黙って揉み消されていました。現在は操作ログ(`recoveredBy` フィールド)とレポートの `Recovered-by-retry:` 行(容疑者→回復役)に記録されます。回復した走破は失敗にはしません(容疑の記録であり確定バグではないため)。

## ignite モード（レア画面強制点火カタログ・バグ捜索体制③）

自然走破では踏めないレア画面(天頂戦・ゲームオーバー等)を、合成 fixture から実UIクリックで強制到達して検査します。設計は `docs/rare-screen-ignition-catalog-design-v0.1.md`。

```powershell
npm run test:ui:ignite -- --scenario tenchosen
npm run test:ui:ignite -- --scenario gameover
npm run test:ui:ignite -- --scenario chronicle
npm run test:ui:ignite -- --scenario chronicle --lang en   # ENモードでも点火できる
npm run test:ui:ignite -- --scenario newspaper-mvprace
npm run test:ui:ignite -- --scenario newspaper-mvprace --lang en
npm run test:ui:ignite -- --scenario tenchosen --regen   # fixtureを作り直す
```

現行シナリオ(2026-08-14): `tenchosen`(天頂戦通年+初代統一王座戴冠) / `gameover`(資金破綻→解散セレモニー) / `away-challenge`(CH-1直訴→遠征→2拍) / `incoming-challenge`(果たし状迎撃→シリーズ) / `faction-ignite`(派閥開戦。boostが実際にリーダー対決をカード編成する) / `unified-player-turn`(統一王座「こちらの番」→挑戦者選出→遠征。**全6本PASS** — 当初FAILの正体は孤児化した直訴pendingが週次モーダル枠を恒久占有する製品バグで、修正済み。`specs/challenge-request-spec-v0.1.md` 2026-08-14追加改修+`test/challenge-request-stale-pending-test.js`)。加えて `chronicle` / `newspaper-mvprace` / `newspaper-mvprace-legacy` / `war-decline` / `opening-flow`(下記参照)。

**推奨ゲート(2026-09-05 P7-22)**: 天頂戦igniteのEN初実行でD2_FREEZEが見つかった(→`driver.js`の2バグとして根治済み、上の「P7-22で判明した2つの落とし穴」参照)ことから分かるとおり、`--lang en`は各igniteシナリオで**一度も実走していない組み合わせ**が残っていると新しい落とし穴を踏む。`driver.js`/`ui-common.js`/`ui-render.js`を大きく触った後は、`npm run test:ui:walkthrough:en` に加えて**点火カタログの全シナリオを`--lang en`でも1本ずつ回す**ことを推奨する:

```powershell
npm run test:ui:ignite -- --scenario tenchosen --lang en
npm run test:ui:ignite -- --scenario gameover --lang en
npm run test:ui:ignite -- --scenario chronicle --lang en
```

- スナップショットの `overlays` は、汎用モーダル枠(mdlA〜D/notifModal)についてはカード直下2階層のクラス列を `mdlAOverlay:mdl-a-card.narrow.…` の形で連結します(枠idだけでは中身を識別できず点火マーカーが書けないため)。`popup` プローブ(`_popupQueue` 残量+`_isPopupActive`)も常時観測され、残量が変わった手は `popup-queue: 0 -> 1 …` として標準出力に出ます

- シナリオ定義は `scenarios.js`。fixture は初回実行時に `fixtures/generated/`(Git管理外)へ自動生成されます(headless進行+`Engine.validateGameState` ゲート)
- 各シナリオは**点火マーカー**(対象オーバーレイ/画面の観測)を必須宣言し、未観測なら検出0件でも `IGNITION_MISFIRE` で失敗します(不発検出)
- 実行後に観測した全オーバーレイ・画面IDを表示します。新シナリオのマーカー選定はこの一覧から行ってください

### 画面ツアー(`tour`・2026-09-04 P6-18で追加)

`chronicle` のように**レア画面が自由閲覧画面の奥にある**(データベース→年代記タブ→各章)シナリオは、ランダム走がナビタブを踏まない設計のため走破では永久に到達できません。シナリオが `tour` を宣言すると、走破の後に**決定論的なクリック列**でその画面を開き、各停車点で D1/D3 走査・レイアウト/JA露出集計・点火マーカー観測・`probe` 収集を行います。

- `tour.steps[]` = `{ label, selector, expectScreen?, probe?, required? }`。`required:false` の停車点(章数がセーブ依存の「第5章」等)は不在ならスキップします。クリックが遮蔽されたときは**走破と同じスコアラーで安全な前進コントロールを1つ押してから再挑戦**します(最大6回)
- `tourAssert(probes, lang)` が停車点ごとの `probe` 結果を検査し、失敗文字列を返します(= 中身の不発検出)。「章題が空」「.chron-wrap が描画されていない」等はここで落とします
- `tour.jaExposureScreens` に画面idを並べると、**ENモードのときだけ**その画面のJA露出0が**失敗条件**になります(他画面の `JA exposure by screen` は従来どおり情報集計のまま)
- `fixture.maxWeeks` で headless 進行の上限週(既定600=約11季)を引き上げられます。年代記は章の確定に十数季かかるため `chronicle` は 1400 を指定しています(fixture生成に約2分)

`chronicle` シナリオは **S18・序章=進行中・確定章3本**のセーブから、序章(記者の見立て/ハイライト/書きかけの章末)・各章(章題/副題/エース/同期/外敵/通算タイル/章末)・「年代記を再構築」ボタンを一巡します。**年代記まわりのコード(`Engine.chronicle` / `Engine.prologue` / `_renderPrologueBlock` / `_renderDbChronicle`)を触ったら JA と `--lang en` の2本**を回してください。

**(解消済み・P7-27)** `chronicle --lang en` はかつて `IGNITION_MISFIRE` でした。原因は `Engine.chronicle._buildPeerNarrativeParts`(`src/management.js`)が `styleJa`(`AXIS_LABELS` = `打撃`/`組技`/`関節技`/`喧嘩`/`万能`)を **buildChapters 側(dict無し=JA固定)で先に辞書解決してしまい**、`narrativeParts.opening` パーツに `L` マーカーを付けずに保存していたこと。表示時(`ui-render.js` の `_chronicleNarrative` → `narrativeText(…, WM_I18N.t)`)は `L` が無い値を再解決しないため、キャッシュに焼き込まれたJAの軸ラベルがENテンプレへそのまま素通りしていた。修正で `styleJa`/`org`(既定ラベルにフォールバックした場合のみ)を生JAのまま保持し `openingPart.L` に載せ、表示時に再解決するようにした(`_generateClosingParts` の `axis`/`org` と同じ流儀)。JA完成文は1バイト不変(`node test/ja-golden.js` 一致)。

`newspaper-mvprace`(2026-09-05 P7-34で追加)は新聞4面(年間MVPレース)の点火です。4面は `_npFeatureOn` のようなゲートも無いのにナビ巡回にも自然走破にも出てこない画面で(1面の目次「MVPレース詳細 ▶」/MVP小窓「詳細 ▶」のどちらかを踏まないと開かない)、`tour`は「新聞を開く」→「4面へ進む」の2停車点だけの短いものです。1停車目の `probe` で `window._npMvpI18n`(P7-23が実装した「JAで再生成→保存値とバイト一致したときだけEN版を出す」自己検証フォールバック、§18-1)を計測用ラッパーに差し替え(分岐ロジックは変えないのでJA出力への影響はゼロ)、2停車目で実際に評価された `_npMvpI18n` 呼び出しがフォールバックした件数と理由を `window.__mvpFallback` に集めます。`tourAssert` は見出し/リード/黒田寸評/TOP3寸評/4位以下一覧の非空と(ENのみ)`#newspaperContent` 内のJA露出0を検査し、`finalAssert` がフォールバック件数(新品fixtureでは0が期待)を検査します。

**(解消済み・P7-35)** 導入直後(P7-34)は `--lang en` が `#newspaperContent` 内18件のJA露出でFAILしていた。原因は `_npMvpRaceRank1Card`/`_npMvpRaceMinorCard`/`_npMvpRaceListRow`(いずれも `src/ui-render.js`)の選手名・団体名表示と黒田コラムの署名が `WM_I18N.pn()` を通していなかったこと(`window.__mvpFallback` は当時から毎回 `[]` で、P7-23の再生成方式自体は正常だった)。P7-35でpn()配線を追加し、JA/EN両PASSになった。

**P7-39(2026-09-05)で `_npMvpI18n` に1条件を追加**: 保存値と現行プールの再生成が不一致(=P7-23以前の旧セーブ)でも、`WM_I18N.lang==='en'` のときは保存値を捨てて現行プールで作り直した文を出す(JA/pseudoは従来どおり保存値のまま)。この変更は本シナリオ(新品fixture=常に一致)には影響しない — 引き続き `mvpFallback: []` のままJA/EN両PASS。旧セーブ相当の挙動は姉妹シナリオ `newspaper-mvprace-legacy` で検査する(下記)。

`newspaper-mvprace-legacy`(2026-09-05 P7-39で追加)は `newspaper-mvprace` と同じ土台のセーブに対し、`fixture.engineer` で保存済み5文字列(見出し/リード/黒田寸評/TOP3寸評/4位以下タグライン)を現行プールに存在しない文言へ差し替え、「P7-23以前の旧セーブ(現行プールと一致しない完成文を持つ)」を模擬します。`MVP_INSTRUMENT_PROBE` は実装と同じ分岐(不一致×`lang!=='en'`のときだけ保存値へ抜ける)を写しているため、`window.__mvpFallback` にJA/ENどちらも6件の `regen-mismatch` が記録されるのが正常です(newspaper-mvpraceとは逆に、**0件だとfixtureが機能していない**ことになるので`finalAssert`は0件をFAILにします)。`tourAssert` はJAでは差し替えた保存値がそのまま1バイト不変で出ること、ENでは差し替え前の文言(`旧プール文言`)が1文字も残らずJA露出0であることを検査します。実際に旧プールの完成文を持つ実セーブ2本(`test/ui-walkthrough/fixtures/legacy-saves/{prerefix_S12W45_2026-07-27,v1.25_S3W11_2026-08-03}.json`)は `save-regression` 棚の実データ検査用に温存し、こちらのfixture生成には使っていません(スキーマ差分による無関係な検証エラーを避けるため)。

### 開幕導線(`opening-flow`・fixtureを使わないシナリオ・2026-09-06 P7-47で追加)

walk/igniteの全シナリオは`weekPhase:'manage'`(ドラフト完了済み)のオートセーブから始まるため、**タイトル画面→新規ゲーム→団体名入力→旗揚げ序章4幕→旗揚げドラフト→設立挨拶→第1週**という開幕導線そのものは誰も実UIで踏んでいなかった穴だった(序章の描画だけは`opening-scene-i18n-check.js`が実関数を直接叩いて別枠で検査している。実UIのボタン・入力・遷移を検査するのは`opening-flow`が最初)。

```powershell
npm run test:ui:ignite -- --scenario opening-flow
npm run test:ui:ignite -- --scenario opening-flow --lang en
```

- `fixture: null` — このシナリオだけ前提セーブを一切使わない。`run.js`は`wrestle_manager_autosave`を書かず、`app.js`起動時の`App.showTitleScreen()`に任せる(「CONTINUE」ボタンも出ない=本物の初回起動と同じ)
- `preSteps`(`scenarios.js`) — タイトル→団体名入力→難易度確定までの決定論的な`click`/`fill`手続き。走破の汎用クリック当てずっぽう機構(`runWalk`)はテキスト入力(団体名)を表現できないため、`run.js`に`preSteps`実行ブロックを追加した(生のPlaywright操作を直列実行し、各段の後に`observe`/`scanText`/`scanOverflow`/`scanJaExposureDetail`を通常のwalkループと同じようにかける)。団体名はJA「紅蓮」/EN「Ember」の固定名(EN側は英語名の実例として1ケース使う)
- 旗揚げドラフト(固定2名+候補6名から3名選択)は`boost`(`_openingFlowDraftBoost`)が契約金の安い順に決定的に3名を選ぶ。候補カード(`.draft-fc.cand`)は強み/課題/コーチ寸評/契約金まで含む説明文が100字を超えるため、`driver.js`の「記事本文のような無差別onclick divを弾く100字フィルタ」(P7-22)にそのまま引っかかり候補にすら挙がらなかった。`src/ui-render.js`に`data-walk-role="draft-pick"`属性を1つだけ追加してこのフィルタを回避している(属性追加は表示テキストに影響しないため`node test/ja-golden.js`は完全一致のまま)
- `jaExposureAllowText: ['日本語']` — シナリオ全体(preSteps+walk)を通じたJA露出ゼロゲート(`tour.jaExposureScreens`とは別枠。開幕導線はほぼ全画面が検査対象になるため画面単位でなく全量チェックにした)。言語トグルの「日本語」ラベル(意図的に翻訳しない仕様)だけを許容リストに乗せる
- 点火マーカー7段: `title-screen` / `org-setup-screen` / `difficulty-screen` / `opening-overlay` / `draft-screen` / `founding-greeting` / `week1-reached`。`org-setup-screen`/`difficulty-screen`の検出のため、`detectors.js`の`activeScreen`判定を`titleScreen`だけでなく`orgSetupScreen`/`difficultyScreen`も見るよう拡張した(`app.js`の`_isTitleFlowVisible()`と同じ3枚組。既存シナリオはこの3画面を通らないため digest 不変)

**2026-09-06実走で発見 → 2026-09-06 P7-49で修正済み**: `--lang en`で旗揚げドラフト画面(固定2名+候補6名のカード)の「Upside: …」(将来性評価)欄に日本語が漏れていた。`Engine.draft.EVAL_TIERS`(`src/management.js`、実際は6段階: `将来のエース候補`/`逸材の匂いがする`/`かなりの素質あり`/`十分な伸びしろ`/`堅実に育つタイプ`/`未知数`。発見時は5本と見誤っていた)が生JA文字列のまま`getEvalComment()`から返され、`ui-render.js`側の`WM_I18N.t('将来性: {text}', { text: c.coachEval.text })`はテンプレ本体("将来性:"→"Upside:")だけ訳して`{text}`の中身(`c.coachEval.text`)自体は`WM_I18N.t()`を通していなかった(呼び出し箇所は`.draft-fc.fixed`/`.draft-fc.cand`の2箇所、いずれも旗揚げドラフト画面限定)。**修正**: Engine側(`management.js`)には手を入れず、表示点2箇所を`WM_I18N.t('将来性: {text}', { text: WM_I18N.t(c.coachEval.text) })`へ変更し、6文字列を`i18n/ui-ledger.json`へ手追加(`node test/i18n-extract-ui.js`は未実行 — `management.js`は同スクリプトの走査対象外のため)。`--scenario opening-flow --lang en`はJA露出0でPASS。旗揚げ以外の画面(年次ドラフト/スカウト等)はこの`EVAL_TIERS`を使っていないため無関係。

### 既存シナリオ(2026-09-06 P7-47・main348コミット分マージ後の回帰確認)

`opening-flow`追加に合わせ、既存10シナリオ(chronicle / newspaper-mvprace / newspaper-mvprace-legacy / tenchosen / away-challenge / incoming-challenge / unified-player-turn / faction-ignite / war-decline / gameover)をJAで、一部をENでも再実行した。`away-challenge`/`incoming-challenge`(直訴/果たし状の点火モーダルが出ない)は本タスクの変更を`git stash`で外した状態でも同一結果で再現する**マージ由来の既存不具合**(このタスクの回帰ではない)。`unified-player-turn`はカタログ設計書に記載済みの調査中扱い(R4)のままFAIL。`faction-ignite --lang en`は既知FAIL(D5_WATCHDOG)で変化なし。`newspaper-mvprace --lang en`はP7-35時点のFAILからPASSへ改善(マージで取り込まれたpn()配線修正が効いている)。詳細は`docs/worklog.md`のP7-47エントリを参照。

**`faction-ignite --lang en`は2026-09-06 P7-51で修正済み(既知FAILを解消)**: 原因はゲーム本体ではなく走破ドライバ側——`scenarios.js`の`_makeFactionIgniteBoost`が編成画面の「開く」ボタン(`_spOpenPicker`)の表示テキストとfixtureの生JA選手名を`String.includes()`で比較しており、EN言語では選手名が`WM_I18N.pn()`でローカライズされるため一致せず、リーダー対決の編成が完了したと判定できずに`_spOpenPicker`をクリックし続けるだけで120手上限までループしていた。修正は表示名比較をやめ、`_spFighterInfo`(`src/ui-render.js`)が付与する`data-sp-fighter-id`属性(選手ID)で判定する方式に変更(`driver.js`の候補メタデータへ`spFighterId`として抽出を追加)。属性名は既存の`data-fighter-id`(actionScore側でスコア8250の汎用「この選手を選ぶ」ピッカー規約)とは意図的に別名にしてあり、一般走破(`test:ui:walkthrough`)のスコアリングには波及しない(JA基準367手/`7b3faff2792abc0f`は1バイトも変えず再現)。`test/ui-walkthrough/scenarios.js`内の同型パターン(表示テキストと生JA名の比較)を全走査したところ該当は`faction-ignite`のみで、`away-challenge`/`incoming-challenge`の既知FAILとは別原因(そちらは上記の通りP7-50調査中)。`chronicle`(JA)は本タスク着手時点で既にFAIL(「確定章が2本(3本以上を期待)」)だったが、`git stash`で本タスクの差分を外した状態でも同一結果で再現する**マージ由来の既存不具合**(このタスクの回帰ではない・未修正のまま)。副次的発見として、EN走破が初めてF02開戦セレモニーへ到達したことで`_mdlAReporterStrip(state, opts.reporterText || …)`(`src/ui-common.js`)が`lineTranslated`引数を渡しておらず、既に`WM_I18N.t()`済みの`opts.reporterText`(`src/app.js`)を二重翻訳して`i18n-miss`を1件出すことが判明した(表示自体はEN文のまま出るため実害は軽微)。本タスクのスコア外のため未修正・記録のみ。

検出器だけを既知バグ入りサンドボックスで確認するには次を実行します。

```powershell
npm run test:ui:walkthrough -- --self-test
```

同一 seed の操作列を比較する例です。操作ログには時刻や所要時間を含めません。

```powershell
node test/ui-walkthrough/run.js --mode walk --seasons 1 --seed 42 --action-log C:\tmp\wm-walk-1.json
node test/ui-walkthrough/run.js --mode walk --seasons 1 --seed 42 --action-log C:\tmp\wm-walk-2.json
git diff --no-index -- C:\tmp\wm-walk-1.json C:\tmp\wm-walk-2.json
```

## fixture

既定 fixture は `fixtures/season-1-week-1-seed42.json` です。既存 `test/make-save.js` と同じ headless Engine 読込方式を使い、初期ドラフト済みロスターへ利用可能なFAをOVR順で補充した12名体制を seed 42 から決定論的に生成しています。

```powershell
node test/ui-walkthrough/fixtures/generate-fixture.js 42
```

読み込み前の `page.addInitScript` で、fixture を `wrestle_manager_autosave`、完全ミュート設定を `wm_audio` に入れます。Chromium は毎回一時 context で起動するため、通常ブラウザのプロファイルと localStorage には触れません。

## 検出とアーティファクト

- D1: `pageerror`、console error、`[WM Debug]` warning
- D2: クリック後5秒間、DOM・状態・overlay のいずれにも変化がない進行停止
- D3: 可視テキストに出た `undefined`、`NaN`、`[object ...]`、`null`、内部トークン
- D5: 90秒以上、シーズン／週／オフ週が変化しない大域停止

FAIL/FREEZE ごとに `artifacts/<timestamp>-<type>/` へ screenshot、操作列、読取り専用の状態要約、console 全文、再現コマンドを保存します。このディレクトリは Git 管理外です。サーバと Chromium は成功・失敗・タイムアウトのいずれでも `finally` で終了します。

## 観戦画面の技名i18nチェック(手動・P7-5)

```powershell
node test/ui-walkthrough/spectator-move-i18n-check.js
```

`run-all.js` は `*-test.js` しか拾わないので**自動実行には入りません**。観戦画面(`battle-engine.html` / `tag-battle.html`)のコード、技名辞書(`i18n/names-ledger.json` の `moves` 節)、`battle-sfx.js` の効果音判定、`_movePresentation` の解説文分岐のいずれかを触ったら手で1本回してください。

node側で実試合を1本シミュして iframe へ `START_MATCH` を投げ、**JA と EN の両方で走らせて突き合わせます**。

- 全フレームの `[_actionMoveName | _movePresentation().guide | guessCategory() | moveCat]` 列が JA/EN 完全一致 = **英語名が判定層へ漏れていない**(技名の日本語は効果音・解説文・セーブ値の安定キーなので、ここが崩れると効果音が全部フォールバックに落ちる)
- `sfx.hit*` の呼び出し列も JA/EN 完全一致 = 効果音が従来どおり鳴る
- EN側の技名パネル・ビッグムーブ演出に日本語が1文字も無い / JA側は日本語のまま

スクリーンショットと `result.json` は `artifacts/p7-5-spectator/` に出ます(Git管理外)。設計背景は `specs/i18n-runtime-spec-v1.0.md` §23。
