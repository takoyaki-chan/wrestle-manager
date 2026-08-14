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
| R3a | **果たし状(自団体発)**: CH-1直訴(同行2名選択)→sendoff→バス→敵地興行→2拍リザルト(task-87/95) | 確率イベント | 実在の最熱クロス団体ペアからpendingThisWeek(forward)を合成。同行選択はboost誘導 | ✅ PASS |
| R3b | **果たし状(相手発)**: 黒Stage到着画面→受けて立つ→迎撃予約→自団体興行で3試合シリーズ→2拍 | 確率イベント | pendingThisWeek(inverse+memberIds)を合成 | ✅ PASS |
| R4 | 統一王座「こちらの番」(playerTurn通知→挑戦者選出→統一遠征→王座戦) | AI王者3周期に1回 | S5開始+aiHolderCycles=3+periodKeyクリアでエンジンに自然発火させる | 🔄 発火は成功・モーダル表示の衝突/キュー問題を調査中(製品側修正1件済み) |
| R5 | **派閥開戦セレモニー**(F02_IGNITE・task-86) | 敵対度蓄積+社長がリーダー戦を組む | 発火予約+hostility加工。リーダー対決はboostが実際にカード編成して組む(自動組込みは存在しない) | ✅ PASS |
| R6 | 引退週(セレモニー・引退記事・派閥/ロスター整合) | 高齢選手前提 | ベテランの年齢/wearを引退圏に加工 | 次バッチ |
| R7 | 下り交渉カード(据え置き温情/査定どおり/厳しく) | 衰え選手の更改週 | 衰退中選手+更改週直前に配置 | 次バッチ |
| R8 | 宿怨「遺 恨 再 燃」+因縁宣戦布告 | rivalry高ペア | BITTERペアのrivalry値を加工しカードで対戦させる | 次バッチ |
| R9 | 開眼演出 | 隠しシード | 開眼シードと格上戦条件を満たす対戦を配置 | 次バッチ |
| R10 | 大ニュース一面(hotProspectDebut/fatedRivals/王座交代) | trainCap等の条件 | 該当条件の新人/王者交代を加工 | 次バッチ |
| R11 | 怪我発生→欠場→復帰 | 確率 | 怪我状態を加工し復帰週まで走破 | 次バッチ |

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
