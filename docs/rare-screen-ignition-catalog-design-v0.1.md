# レア画面強制点火カタログ 設計 v0.1（バグ徹底捜索体制③）

2026-08-14起案(Fable)。4本柱体制(①フライトレコーダー→②走破ハーネス→③本書→④回帰規律)の③。
①②は2026-08-13マージ済み。③はKeisuke承認済みの体制の続き(「②のdriver/detectors流用」)。

## 1. 何を解くか

②のWモード走破は「自然にプレイして1季で踏める画面」を広く浅くカバーする。
しかし本作の見せ場は**自然走破では踏めない**:

- 天頂戦は4季に1回。**通し確認の機会が構造的に少ない**
- ゲームオーバー・解散セレモニーは「踏んだら終わり」の画面で、テストプレイでまず到達しない
- 果たし状・宿怨再燃・開眼・大ニュース一面は確率/条件発火で、狙って出せない

これらの画面は交渉フリーズ級の無例外バグ(D2)が眠っていても発見が実機の偶然任せになる。
③は**条件を合成したfixtureで前提状態を作り、実UIクリックで強制到達して検査する**。

## 2. 原則

1. **点火は実UI経由**。合成するのは前提状態(fixture)だけで、ブラウザ内で `G` を直接書き換えない。
   fixture注入はlocalStorageセーブと同じ正規経路＝ロード処理・画面配線・進行ハンドラすべてが検査対象に入る
2. **fixtureはheadlessエンジンで決定論生成**(make-save.js方式のシード付き進行+シナリオ固有の状態加工)。
   生成後に `Engine.validateGameState` ゲートを通す——不変条件違反のfixtureで点火しても意味がない
3. **不発=FAIL**。各シナリオは点火マーカー(オーバーレイ/画面識別子)を必須宣言し、
   走破中に観測できなければ**検出0件でも失敗**扱い(「書いてあるのに出ていない」をシナリオ粒度で捕捉)
4. **終了条件はシナリオごと**。既定は②と同じ「次シーズン第1週」、ゲームオーバー系は当該画面到達
5. 検出器はD1/D2/D3/D5を②からそのまま流用。閾値・allowlist運用も②に従う

## 3. カタログ（棚卸し v0.1）

②の1季走破が既にカバーする画面(春タッグ/JT/秋対抗戦/PPV/ドラフト/表彰式/契約更改)は対象外。

| # | シナリオ | 自然発生の稀少さ | 前提状態の作り方 | 状態 |
|---|---|---|---|---|
| R1 | **天頂戦通年**(W42ミニイベント→W43エントリー→W48開催15試合→優勝演出→**初代統一王座戴冠**→季末→新シーズン) | 4季に1回 | season4・W41到達までheadless進行(加工不要。ppvUnlocked必須assert) | ✅ PASS |
| R2 | **ゲームオーバー**(資金危機突入→即死判定→解散セレモニー5スライド→GAME OVER画面) | 踏んだら終わり | funds を -1600 に加工(1tick目で危機突入、2tick目で即死。突入バナーも通る) | ✅ PASS |
| R3a | **果たし状(自団体発)**: CH-1直訴(同行2名選択)→sendoff→バス→敵地興行→2拍リザルト(task-87/95) | 確率イベント | クロス団体ペアを熱の高い順に試し、pendingThisWeek(forward)を合成。停止週は「非興行週・翌週が通常興行」を週送りの試走つきで探す(§10)。同行選択はboost誘導 | ✅ PASS |
| R3b | **果たし状(相手発)**: 黒Stage到着画面→受けて立つ→迎撃予約→自団体興行で3試合シリーズ→2拍 | 確率イベント | pendingThisWeek(inverse+memberIds)を合成。停止週は R3a と同じ(§10)。観戦版 `incoming-challenge-watch` | ✅ PASS |
| R4 | 統一王座「こちらの番」(playerTurn通知→挑戦者選出→統一遠征→王座戦) | AI王者3周期に1回 | S5開始+aiHolderCycles=3+periodKeyクリアでエンジンに自然発火させる | 🔄 発火は成功・モーダル表示の衝突/キュー問題を調査中(製品側修正1件済み) |
| R5 | **派閥開戦セレモニー**(F02_IGNITE・task-86) | 敵対度蓄積+社長がリーダー戦を組む | 発火予約+hostility加工。リーダー対決はboostが実際にカード編成して組む(自動組込みは存在しない)。停止週はリーダー健在の派閥が2つそろう週を探す(§10) | ✅ PASS |
| R6 | 引退週(セレモニー・引退記事・派閥/ロスター整合) | 高齢選手前提 | ベテランの年齢/wearを引退圏に加工 | 次バッチ |
| R7 | 下り交渉カード(据え置き温情/査定どおり/厳しく) | 衰え選手の更改週 | 衰退中選手+更改週直前に配置 | 次バッチ |
| R8 | 宿怨「遺 恨 再 燃」+因縁宣戦布告 | rivalry高ペア | BITTERペアのrivalry値を加工しカードで対戦させる | 次バッチ |
| R9 | 開眼演出 | 隠しシード | 開眼シードと格上戦条件を満たす対戦を配置 | 次バッチ |
| R10 | 大ニュース一面(hotProspectDebut/fatedRivals/王座交代) | trainCap等の条件 | 該当条件の新人/王者交代を加工 | 次バッチ |
| R11 | 怪我発生→欠場→復帰 | 確率 | 怪我状態を加工し復帰週まで走破 | 次バッチ |
| R12 | 年代記/序章(データベース→年代記タブ→序章/各章/再構築を巡回。`tour`方式) | 章確定に十数季かかる | S18まで進めた確定章3本以上のセーブ。`fixture.maxWeeks=1400` | ✅ PASS(JA/EN) — 詳細は`test/ui-walkthrough/README.md` |
| R13 | 新聞4面(年間MVPレース)。1面「MVPレース詳細 ▶」→4面を`tour`で巡回、`_npMvpI18n`(P7-23)のフォールバック件数も計測 | ナビ巡回・自然走破のどちらも素通りする | S1W3までheadless進行(加工不要。mvpRace.rankings≥4件をassert) | ✅ PASS(JA) / ✅ PASS(EN・§8のFAILはP7-35で解消済み) |
| R14 | 対抗戦・挑戦状の辞退→死蔵セリフ(WAR_DECLINE_DIALOGUE)配線(P7-41) | 週10/22/34限定+抽選+隣接ランクの複合条件で自然発火が稀 | pendingEvent(type:'war')+weekPhase:'event'を直接合成 | ✅ PASS |
| R15 | **開幕導線**(タイトル→新規ゲーム→団体名入力→旗揚げ序章4幕→旗揚げドラフト→設立挨拶→第1週。P7-47) | fixtureベースの全シナリオが構造的に踏めない(誰も実UIで検査していなかった) | fixtureを使わない(`fixture:null`)。`preSteps`でタイトル画面から決定論的にclick/fillして難易度確定まで進める | ✅ PASS(JA) / ❌ FAIL(EN・新規発見の未修正バグ。§9参照) |
| R16 | **挑戦状(B3)→次の通常興行のメイン**(スキップ `b3-challenge` / 観戦 `b3-challenge-watch`) | 大型イベント抽選(seed42 は S2〜S4 で1回) | 停止週の頭に「その週に立った挑戦状」を合成(`generateLargeEvent`)。清算の対戦成績・ゲスト返却を stepProbe で検算 | ✅ PASS(既知の不具合1件・§10) |
| R17 | **派閥の予約の清算**(F07 メイン推薦 `faction-f07-main` / Common-1 `faction-common1` / F08 直接対決 `faction-f08`・スキップ版 `faction-f08-skip`) | 派閥イベント抽選 | 持ち越し中の派閥イベントを合成(判定関数の payload)。清算の前後の信頼・帳簿を stepProbe で検算。スキップ版は前座を1試合ずつスキップした後の F08 の試合前の画面 | ✅ PASS(F08 は製品の止まりを修正して) |
| R18 | **因縁の宣戦布告**(`rivalry-confrontation`) | 因縁50以上の2人を通常興行で組む | 停止週の後の興行のメインの2人の因縁を95に(試走でカードに残ることを確認)。前座を1試合ずつスキップ→メインのフォーカスで殻の上に宣戦布告 | ✅ PASS(2026-09-26 に殻の上に出るよう修正して) |
| R19 | **怪我の発起人の果たし状**(`incoming-challenge-injured`) | 持ち越しの間に発起人が怪我(稀) | `incoming-challenge` の果たし状+発起人に6週の怪我。出ない・予約されない・取り下げを検査(否定の点火) | ✅ PASS(2026-09-26 に出す直前の見直しを足して。変更前は FAIL=再現) |

優先順位はレア度×実装の新しさ×壊れたときの被害で決める。R3/R4(2026-08-13マージの最新画面)とR5が次候補。

## 4. 実装構成（すべて test/ui-walkthrough/ 配下）

- `scenarios.js` — カタログ本体。各シナリオ= `{ description, fixture{seed,until,engineer,assert}, walk{seasons,maxSteps}, ignition[], finalProbe, finalAssert }`
- `fixtures/headless-sim.js` — headless進行モジュール(make-save.jsのループを流用整理。`advanceUntil(G条件)`+プレイヤー判断の自動化)
- `fixtures/generate-scenario-fixture.js` — CLI。シナリオ名→fixture生成→validateGameStateゲート→`fixtures/generated/`(gitignore)へ書き出し
- `run.js` — `--mode ignite --scenario <name>` を追加。fixture未生成なら子プロセスで自動生成(`--regen`で再生成)
- `driver.js` — `runWalk` に `until`(終了条件の差し替え)と `observe`(スナップショット毎のマーカー観測)を追加。walkモードの挙動は不変
- 点火マーカーは `snapshot.overlays`(`[id*="Overlay"], .overlay, [class*="overlay"], .emr-layer` の可視要素)と `activeScreen` で判定。
  一瞬で自動遷移する画面はスナップショット間隔(約2.2s)で取り逃がすことがあるため `required:false` にするか `finalProbe`(走破後に1回だけ `G` を読むevaluate)で事後状態を検証する
- 不発時も②と同じアーティファクト(スクショ/操作列/状態/console/再現コマンド)を `IGNITION_MISFIRE` として出力
- 実行後は観測した全オーバーレイ識別子・画面IDの一覧を必ず表示する(次のシナリオのマーカー選定資料になる)

## 5. 実行

```powershell
npm run test:ui:ignite -- --scenario tenchosen
npm run test:ui:ignite -- --scenario gameover
npm run test:ui:ignite -- --scenario newspaper-mvprace
npm run test:ui:ignite -- --scenario tenchosen --regen   # fixtureを作り直す
```

## 6. 運用

- 回すタイミング: **該当レア画面のコードを触ったとき**に当該シナリオを1本(②のWモードと同じ「一区切りで1回」方針)
- 週次オートメーション(weekly-bug-audit)への追加は、R1/R2の安定稼働を確認してから起票する
- 検出→修正→④の規律: 見つけたバグは挙動検査型ガードテストを対で書く
- fixture生成は決定論だがエンジン変更で中身がドリフトする。生成物はコミットせず、`fixtures/generated/` に都度生成(初回のみ数十秒)

## 7. 初回実走の記録（2026-08-14）

R1天頂戦=**PASS**(77操作85秒・S4W41→W48開催→優勝発表→初代統一王座戴冠→表彰式→ドラフト→S5W1・検出0) / R2ゲームオーバー=**PASS**(22操作20秒・危機突入→猶予→タイムアウト→解散セレモニー5スライド→タイトル帰着・検出0・再実行でダイジェスト完全一致)。

立ち上げで直したもの(詳細はworklog 2026-08-14):
- **製品バグ1件**: 選択サーフェス内の顔画像(portraitImg第4引数)がstopPropagationで選択リスナーを飲み込む型。大型イベントピック2/天頂戦エントリー行/通常PPV行の4箇所修正+`test/selection-surface-portrait-guard-test.js`。カード編成ピッカー行2箇所は同型だが操作感が変わるためKeisuke裁定待ち(チップ起票済み)
- **②ハーネスの不備4件**: waitForTimedUiのclock.pauseAt競合クラッシュ / titleScreenがactiveScreenに出ない(.screenではない+下の画面が残る) / 全画面タップ面(.tcwn-wrap等)が候補から漏れ優勝発表で詰む / クリック恒久失敗が墜落(→D2+アーティファクトで着地に変更)。加えて側画面(新聞等)からの「今週」帰還脱出口を新設
- **fixture生成の教訓**: make-save.jsはauto-simの古いコピーでJT/秋対抗戦/派閥イベントを消化しない。headless-sim.jsは現行auto-simループを正として移植し、UI消化フラグ(pendingAwards等)の残骸を実プレイ相当へ戻してから書き出す

## 8. R13 新聞4面(年間MVPレース)追加の記録（2026-09-05 P7-34）

P7-23(`Engine.mvpRace`の新聞フレーバー285本をJA完成文でセーブし、表示時に`_npMvpI18n`が「dict無しで再生成→保存値とバイト一致したときだけEN版を出す」§18-1のfail-open方式へ移した回)は、新聞4面を実UIで検査したことが一度も無いまま完了していた(②のUI自動走破は4面を踏まない設計のため)。R13はその穴を埋めるignite追加。

**JA: PASS**。**EN: FAIL(新規発見・未修正)**。`--lang en`で`#newspaperContent`内に18件のJA露出——内訳は`src/ui-render.js`の`_npMvpRaceRank1Card`/`_npMvpRaceMinorCard`/`_npMvpRaceListRow`が選手名(`entry.fighterName`)・団体名(`entry.orgName`)を表示する箇所で、同ファイル内の他箇所と揃えて使うべき`WM_I18N.pn()`を通していないこと、および黒田コラム署名(`WM_I18N.t('— 編集長 {name}', { name: '黒田 貫一郎' })`)が名前をハードコードで埋め込み`pn()`を通していないことの2種類。`window.__mvpFallback`(`_npMvpI18n`のフォールバック計測)は常に0件で、P7-23が実装した見出し/リード/寸評/黒田コメントの再生成方式そのものは正常——EN失敗はP7-23の担当範囲ではなく、page4のカードUIが元々(Stage B以前から)持っていた固有名詞の未配線。

このタスクの範囲は検証ハーネスの新設のみ(`src/`改変は他エージェントとの並行作業を避けるため対象外)としたため、`src/ui-render.js`の3関数+署名1箇所へ`WM_I18N.pn()`を足す修正は別タスクへ切り出した(spawn_task経由でチケット化)。修正はJAで無変化(`pn()`はja/pseudo時に素通しのfail-open)、EN側のみ改善される想定で、修正後はR13が自動的にEN PASSへ切り替わる。

**(解消済み・P7-35)** 上記の3関数+署名1箇所へ`pn()`配線を追加。R13はJA/EN両PASSになった(詳細は`test/ui-walkthrough/README.md`)。

## 9. R15 開幕導線(opening-flow)追加の記録（2026-09-06 P7-47）

②のWモード走破も③のignite全シナリオも、fixtureは例外なく`weekPhase:'manage'`(S1W1・ドラフト完了)のオートセーブから起動する設計だった(headless-simがheadless進行で作れる状態がそれしか無いため)。そのため**タイトル画面→新規ゲーム→団体名入力→旗揚げ序章4幕→旗揚げドラフト→設立挨拶→第1週**という開幕導線そのものは、実UIのボタン・入力・遷移としては一度も検査されたことがなかった(序章の描画だけは`opening-scene-i18n-check.js`が`renderOpeningScreen()`を直接叩いて別枠で検査していたが、タイトル画面のボタン・団体名入力・難易度選択・ドラフトの実クリック経路はカバー外)。R15はこの構造的な穴を埋める。

**設計の要点**:
- 前提fixtureを持たない初のシナリオ(`fixture: null`)。`generate-scenario-fixture.js`(headless-sim経由)を一切使わず、`run.js`の`setupPage()`がオートセーブを書かないよう分岐した。これにより本物の初回起動(タイトル画面の「CONTINUE」ボタンが出ない状態)を再現する
- 団体名の入力(テキストフィールド)は、既存の`runWalk`(クリックだけを当てずっぽうで選ぶ汎用機構)にも`tour`(決定論的クリック列だが`type:'click'`のみ)にも無い操作種別だったため、`run.js`に**`preSteps`**(シナリオが`{label,selector,type:'click'|'fill',value?}`の配列またはlang引数の関数を宣言し、`page.locator().click()/.fill()`で直列実行する)を新設した。preSteps各段は通常のwalkループと同じ検査(D1/D3/JA露出/オーバーフロー)を受ける
- 旗揚げドラフトの候補カード(`.draft-fc.cand`)は強み/課題/コーチ寸評/契約金まで含む説明文が優に100字を超え、`driver.js`の「記事本文のような無差別onclick divを弾く100字フィルタ」(P7-22)にそのまま引っかかり、走破の候補にすら挙がらなかった(他の全画面はbutton/data-choice/data-fighter-id経由でこのフィルタを素通りしていたため、このタスクで初めて表面化)。原則2「fixture合成のみ・DOM直書き換え禁止」は守った上で、**`src/ui-render.js`に`data-walk-role="draft-pick"`属性を1つだけ追加**してisStructuredPicker扱いにした(属性の追加は表示テキストに影響しないため`node test/ja-golden.js`は基準ハッシュ`3466a6ff...`と完全一致のまま)。`boost`関数が契約金の安い順に決定的に3名を選ぶ(開始資金5000万に対し安価候補2名保証(§3.6)があるため資金不足に陥らない)
- `detectors.js`の`activeScreen`判定を、`titleScreen`だけでなく`orgSetupScreen`/`difficultyScreen`も見るよう拡張した(`src/app.js`の`_isTitleFlowVisible()`と同じ3枚組=ゲーム開始前の同一シーケンスという既存の設計意図をそのまま流用)。既存シナリオはこの2画面を通らないため挙動・digestは不変
- ENでのJA露出ゼロは`tour.jaExposureScreens`(画面単位)ではなく`jaExposureAllowText`(シナリオ全体の許容リスト方式)で新設した。開幕導線はほぼ全画面が検査対象になるため、画面を1枚ずつ列挙するより「言語トグルの『日本語』ラベルだけ除外して残り全部ゼロ」の方が素直だった

**JA: PASS**(9操作・12秒)。**EN: FAIL(新規発見・未修正)**。旗揚げドラフト画面の「Upside: …」(将来性評価)欄に日本語5種が漏れる——`Engine.draft.EVAL_TIERS`(`src/management.js`)の評価テキスト5種(`逸材の匂いがする`/`かなりの素質あり`/`十分な伸びしろ`/`堅実に育つタイプ`/`未知数`)が生JA文字列のまま返され、`ui-render.js`の`WM_I18N.t('将来性: {text}', { text: c.coachEval.text })`は外側テンプレ("将来性:"→"Upside:")だけ訳して`{text}`の中身自体は`t()`を通していない(呼び出し2箇所、いずれも旗揚げドラフト画面限定。`lang-en.js`に該当5文字列の辞書登録も無い)。このタスクの範囲は検証ハーネスの新設のみのため修正は別タスクへ切り出す(report内で言及。年次ドラフト/スカウトは別のテキストを使うため無関係)。

回帰確認: 既存10シナリオをJAで、`newspaper-mvprace`/`faction-ignite`/`chronicle`をENでも再実行。`away-challenge`/`incoming-challenge`はマージ由来の既存不具合(このタスクの変更を外しても同一結果で再現)、`unified-player-turn`は本表R4の調査中扱いのままFAIL、`faction-ignite --lang en`は既知FAILのまま変化なし、それ以外はPASS。詳細は`docs/worklog.md`のP7-47エントリを参照。

## 10. K-1 第3段の確認と停止週の探し方(2026-09-26)

K-1 第3段(興行後の処理を `Engine.show.finalize` に一本化・実プレイは `App._finalizeHook*` の差し込み口つき)の後、差分テストが見ていない実プレイだけの清算(受けた挑戦状・派閥の予約)を実UIで通した。詳細は `test/ui-walkthrough/README.md` の同名の節。

- **停止週を固定しない**: R3a/R3b/R5 は「S2W6 固定」で、エンジンの軌道が動くたびに前提が崩れていた(R3: 画面に出る前の週送りで他団体の選手が怪我をして予約が解除 / R5: seed7 で派閥が1つ)。R3・R16・R17 は「S2 の非興行週で翌週が通常興行」の週を、その週の週送り(`tickWeek`→`advanceWeek`)を fixture 生成時に試走して、決断画面が翌週の頭に出て翌週の興行で清算できる形だけを採る(大型イベント・派閥イベント・対抗戦の申し入れに枠を取られない、出場者が翌週に健康)。R5 はリーダー健在の派閥が2つそろう通常興行週を S2〜S4 から探す。終了条件は開始週からの相対(`makeUntil`)
- **清算を検算する**: 手ごとに G を読む `stepProbe` を足し、同じ週のうちに `totalShows` が増えた手の前後を清算の前後として、信頼(`_applyTrustToMembers` の感度つきの式)・帳簿の「派閥」・予約の消化・対戦成績を `finalAssert` で確かめる
- **観戦**: 観戦 iframe は1コマずつ「次の攻防」で進み、決着の「決めろ!」と「試合終了」を押して初めて親へ結果が届く。`hold` でクリックせずに時計を進め、iframe の中のボタンを押す。「試合を観る」を押した直後は偽の時計を進める前に iframe の読み込みを実時間で待つ
- **見つけた製品の不具合**: F08 の試合後の画面が試合一覧の殻の後ろに積まれて興行が止まる(修正済み)/ 挑戦状のゲストの怪我で所属団体の選手の体調が NaN(同日修正。返却を「興行で起きたことだけ反映」に・`b3-challenge*` の既知扱いを外し、返却後の本物の選手を `stepProbe` で検算)/ 観戦の経路の試合後のフレーバー(敗者の心)が殻の後ろに積まれて出ず、保険のタイマーが毎回発火(同日修正。`*-watch` の既知扱いを外し、出た回数を数えて検査)/ F08 の直接対決の「両リーダーの因縁 +30〜40」が関係値のキーの形の違いで効いていない(同日修正。`faction-f08` が両方向 +30 以上を検査)。4件とも直ったので、点火の既知扱い(`knownConsole`)はいま無い。
- 2026-09-26(裁定3件): 宣戦布告を殻の上に出す(R18 `rivalry-confrontation`)/ 派閥の試合前の画面をスキップしていても出す(`faction-f08-skip`)/ 出す直前に果たし状の発起人・相手の怪我を見直す(R19 `incoming-challenge-injured`)。3本とも変更前のコードで FAIL を確認。`incoming-challenge-watch` に観戦 iframe の STANDBY 止まりのゆらぎ(3回に1回・再実行で PASS。走破の待ちの側。test/ui-walkthrough/README.md)
- 2026-09-26(続き): 挑戦状の挑戦者を開催の時点の本物から作る(裁定「直す」。`B3_STEP_PROBE` が興行中のゲストの体調・年齢・同じ時点の本物との一致を検算)/ 試合前の「✨ 初対決」を判定を直して観戦の前に出す(裁定「判定を直して出す」。`b3-challenge-watch` は2枚・`b3-challenge` は0枚を `_assertB3FirstMeet` で検査。観戦の手の直後の待ちは初対決を OK で閉じてから iframe の読み込みを待つ)
- **同じ条件で失敗していたもう1本**: `away-challenge` も main(K-1 第3段の前後とも)で同じ原因(相手の選手の怪我で遠征が黙って取り消し)の FAIL だった。R3b と同じ停止週の探し方で PASS
