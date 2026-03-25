# Wrestle Manager ロードマップ

> 最終更新: 2026-03-25（開発率ラベル化）
> セッション履歴: `docs/archive/session-history.md`
> 完了済みタスク: `docs/archive/completed-tasks.md`
> 設計決定ログ: `docs/design-decisions.md`

---

## 現在の状態

**開発率ラベル化（2026-03-25）。** getPotentialPct数値%表示を5段階ファジーラベル（未開花/成長期/開花中/充実期/完成形）に置換。選手固定devLabelOffset(-7〜+7)でファジーバウンダリ実現。既存セーブはIDハッシュで互換。バー色はstage別5色。ロスターポップアップ(ui-common.js)+詳細画面育成タブ(ui-render.js)の2箇所を変更。UIのみ(engine.js変更はutil関数追加+新規選手生成時offset付与のみ)。

前回: **タスクキュー6件一括実装（2026-03-25）。** BUG-02:ティッカー虚偽情報修正(AI負傷→実データ/フレーバー無害化/スカウトFA連動/経済orgPop参照)。TASK-03:ファン希望カードにfreshnessチェック(MQ-5以上除外/MQ-3以上priority降格)。TASK-01:ジュニアトーナメントシード配置(_seedBracket新設/1位2位決勝まで非対戦/5-8位ランダム)。BUG-01:showSp堅牢化(タイマー管理+勝者決定時強制消去/予防的修正)。TASK-02:今週画面ソート&一括操作(thクリックソート/全選択チェック/プリセット一括適用/強化一括ON/OFF)。TASK-04:給料交渉から勝率撤去(record判定をOVR/人気/タイトル歴ベースに/セリフテンプレート刷新)。auto-sim 100シーズンALL CLEAR。

前回: **AI契約交渉パリティ（2026-03-25）。** processAIContracts新設。trust<40で退団判定（30-39:15%/15-29:40%/<15:70%）。特性補正（忠誠心×0.5/反骨心+20%/野心±15%）+tier補正。退団先: 50%他AI団体移籍/30%FA/20%引退(28歳+)。移籍先でO-02 bond変動+orgTimeline更新。最低5名ガード。新聞にaiContractDeparture(priority95、大量退団+30、エース級+20)。設計書: `docs/ai-parity-07-contract-negotiation.md`。auto-sim 50シーズンALL CLEAR。

前回: **AIメディア密着B4パリティ（2026-03-25）。** processAIWeeklyEventでB4許可。tier別対象選出（S:50%若手/30%エース/20%ベテラン等）。aiData.mediaSpotlight新設で3興行MQ追跡→avgMQ≥60:orgPop+3/popularity+5/trust+3、≥45:orgPop+1/popularity+2。E-04関係性効果（bond+1~2/rivalry+1~3）。新聞に密着開始(aiMediaStart:45)+結果記事(aiMediaSpotlight:65)。設計書: `docs/ai-parity-04-media-spotlight.md`。auto-sim 50シーズンALL CLEAR。

前回: **AI怪我引退パリティ（2026-03-25）。** processAIWeek内のAI怪我処理を拡張し重傷→retireType判定追加。wearInjury(wear+25>80)とcareerEnding(wear≥40で6.5%/他2.5%)の引退パス。引退時はロスター除去+departureTrustImpact+orgTimeline close+_midSeasonRetirees蓄積（シーズン末HOF判定用）。新聞にAI怪我引退記事(aiInjuryRetirement:150、エース級+20)。最低ロスター4名ガード。設計書: `docs/ai-parity-05-injury-retirement.md`。auto-sim 50シーズンALL CLEAR。

前回: **AI選手間対立B2パリティ（2026-03-25）。** processAIWeeklyEventのB2処理にニュース連携を完成。_pickAIChoiceにB2 tier別自動選択（S:60%話し合い/35%試合/5%放置、A:40%/45%/15%、B:20%/40%/40%）追加。processAIWeekで_newsTeamConflict蓄積+_b2Relationships関係値マージ。新聞にAI選手間対立記事追加（aiTeamConflict priority110、名勝負MQ70+で+15）。設計書: `docs/ai-parity-02-team-conflict.md`。auto-sim 50シーズンALL CLEAR。

前回: **AI練習怪我B1パリティ（2026-03-25）。** processAIWeeklyEventでB1（練習怪我）をAI団体にも許可。設計書: `docs/ai-parity-01-practice-injury.md`。

前回: **AI団体ケアアクション統一（2026-03-25）。** processAICare全面改修。設計書: `docs/ai-parity-06-care-unification.md`。

前回: **サウンドシステム実装完了（2026-03-23）。** ■SE_MIX(app.js): 演出系SE個別音量ミキシング追加(bell56%/impact61%/tension_hit66%/rivalry系64-57%/war60%/transfer52%)、play()でsfxGain.gain.value自動設定。■MP3 SE優先再生(battle-engine.html): AudioBufferプリロードシステム新設(_SE_FILES 17ファイル定義/postMessage受信時_preloadSEBuffers開始/_playSample+getSfxGain経由再生)。試合SE11種(b01-b09,b11-b12)+フィニッシュSE7種(f02-f05,f11-f13)をMP3優先+Web Audioフォールバック。■ドローンd02音量42%(dMix=0.84スケーリング)。■セーブ画面BGM/SE音量スライダー10段階(前回実装済み反映)。

前回: **新聞タブ見た目パッチ 実装完了（2026-03-22）。** 新聞タブのデザインを団体比較タブと統一。■1赤帯ヘッダー(WEEKLY GRAPPLE→週刊グラップル、赤グラデーション帯+白文字)。■2セクションラベル日本語化(TOP STORY→一面記事、OTHER NEWS→他団体ニュース、次回展望、興行ダイジェスト、赤/金の縦線色分け)。■3画像アイコン派手化(一面記事:金枠+金グロウ、他団体:紫ダーク+紫枠+紫グロウ)。■4ダイジェストテーブル形式化(カード風→table1行/試合、勝者ダーク金グロウ/敗者グレーアウト、MQ色分け3段階、バッジ王座戦/番狂わせ日本語化)。■5星評価+黒田コメント微調整(星+観客満足度1行化、黒田アイコンダーク背景+赤ボーダー)。■6特集ページヘッダーも赤帯統一。UIのみ(engine.js変更なし)。auto-sim 500シーズンALL CLEAR。

前回: **団体比較 見せ場パッチ 実装完了（2026-03-22）。** セピア紙面の「おとなしすぎる」問題を解消。■1エース対決アリーナ:ダーク背景+赤ラジアル照明+赤金ライン+VS48px発光(text-shadow3層)+メトリクス白文字化+名前バーグラデーション。■2相性グレードボックス:赤ベタ塗り(#8b1a1a)+白文字。■3 No.2/No.3アバター:プレイヤー金ダーク(#5a4020→#3a2810)+金枠+金グロウ、ライバル暗色グラデ+白枠+紫グロウ。■4注目選手アバター:52px拡大+紫枠+紫グロウ。■5バッジ/タグ全ベタ塗り白文字化(要警戒赤/スター候補金/急務赤/検討緑/注意金/ロールチップ赤)。■6通算成績赤太字化。UIのみ(engine.js変更なし)。

前回: **団体比較スポーツ新聞風リデザイン 実装完了（2026-03-22）。** データベースタブ「団体比較」サブタブの全面リデザイン。■1カラースキーム変更(ダーク→セピア紙風、.db-cmp-wrapコンテナ+新聞タブ同系統パレット)。■2英語ラベル全日本語化(Compare with→比較対象/Matchup→相性/Head to Head→対戦成績/Top 3 Matchups→主力対決/Power Snapshot→戦力レーダー/Column→記者コラム/Scouting Report→{団体名}注目選手/Fan Voice→ファンの声/Player→プレイヤー/Tier→ティア/ACE→エース対決/No.2→No.2対決/No.3→No.3対決)。■3テキストロジック修正(getPopularityTail slotIndex別3バリエーション×5帯=15パターン、OVR優勢+人気劣勢時の逆接表現)。■4VS表示強調(36px赤色VS+グラデーション区切り線、ライバルemoji削除)。■5エース対決アリーナレイアウト(getStandUrlスタンド画像向かい合わせ+中央VS+名前バー、No.2/No.3は従来形式維持)。■6赤帯ヘッダー(週刊グラップル──団体比較)。■セクションタイトル縦線色分け(金=自陣営・中立/赤=相手情報)。UIのみ変更(engine.js変更なし)。auto-sim 500シーズンALL CLEAR。

前回: **殿堂入り画面追加修正 A-E 実装完了（2026-03-22）。** ■修正A:hofPointsバグ(applyHallOfFameにhofPoints/hofLevelガード追加)。■修正B:グリッドカードレイアウト変更(2列grid→flex-wrap 130pxコンパクトカード)。■修正C:詳細ポップアップ情報密度強化(C-0異名自動生成generateEpithet10条件、C-0b語り文自動生成generateBiography3文テンプレート、C-2 _buildHofEntryにepithet/biography保存、C-4/C-5ポップアップ全面書き換え:全身画像+異名+語り文+レジェンドグロー)。■修正D:レガシーポイント計算方式変更(初期値S50/A30/B15/P0+殿堂★8/★★10/★★★13pt+対抗戦5勝ごとに1pt、上限50、battleWinsTotal追加)。■修正E:pickGrowthStat STYLE_WEIGHTS緩和(最大-最小差8%、全スタイル最低22%)。auto-sim 500シーズンALL CLEAR。

前回: **新聞記事追加+キャラ名クリック対応 実装完了（2026-03-21）。** ■タスク1:対抗戦・頂上決戦の結果を新聞に掲載(finalizeWar→_newsWarResult/finalizePPV→_newsSummitResult保存、newspaper.generate story追加、tickWeekクリア)。■タスク2:新聞画面のキャラクター名をクリック可能に(_newsClickableName/\_newsStoryClickableヘルパー、topStory/subStories/playerShowData/次回展望/特集ページ全箇所適用、対抗戦記事の個別試合結果表示)。■タスク3:団体比較画面のキャラクター名をクリック可能に(王者名/Top3 Matchups選手名+アバター/Scouting Report選手名+顔写真)。preview buildPreviewにID追加。auto-sim 500シーズンALL CLEAR。

前回: **殿堂入りシステム拡張 v2.0 実装完了（2026-03-21）。** allHallOfFame統合管理(player/org_s/org_a/org_b)、NPC団体殿堂入り判定(processSeasonEnd+advanceWeek回収)、レガシーポイント動的化(全団体HOF×10上限50)、DB殿堂タブリッチ化(団体フィルタ+盾グリッド+詳細ポップアップ+キャリアハイライト年表)、表彰式スライドリッチ化(盾+ハイライト+サマリー+NPC殿堂表示)、新聞NPC殿堂ニュース。設計書: `docs/hall-of-fame-expansion-v2.0.md`。auto-sim 500シーズンALL CLEAR。

前回: **6件バグ修正・改善パッチ 実装完了（2026-03-21）。** ■1新聞JT記事残留クリア(既適用)、■2興行中BGM漏れ(全試合完了時のみmanagement BGM)、■3タイトル挑戦資格(getEligibleChallengers+UI/AI/S1/期待カード5箇所適用)、■4収支チャート(既適用)、■5JT勝敗逆転バグ(iframe結果でmatch上書き+後続ラウンド再計算)、■6コーチ画面視認性(未雇用背景色+バッジコントラスト向上)。auto-sim 100シーズンALL CLEAR。

前回: **B3/B2 試合観戦UI統一化 実装完了（2026-03-21）。** B3（名称「対抗戦」→「挑戦状」に変更）とB2（対立解決マッチ）に、通常興行・War・PPVと同等の試合観戦UI（VS対峙画面+battle-engine iframe観戦+フル結果カード）を追加。仕様書: `docs/impl-b3-b2-match-viewing.md`。auto-sim 200シーズンALL CLEAR。

前回: 浮動小数点表示バグ根絶+JT体力バーアニメ復活+BGM演出+新聞タイミング+WAR/JTアイコン統一（2026-03-21）。 JT試合結果画面に勝者体力バー減少→回復アニメーション復活（準々決勝・準決勝のみ）。優勝決定時BGMフェードアウト→チャンピオンジングル。JT終了後に新聞を再生成し結果記事を即座に反映（出場選手発表→結果特集に切替）。WAR勝利セリフ+JT感想チェーンの画像をupper→80pxポートレートアイコン（丸枠）に統一。

### 直近の完了セッション

| 日付 | 内容 |
|------|------|
| 03-25 | 新聞バックナンバー: G.newspaperArchive(最大24週分)蓄積+バックナンバーナビUI(◀前の号/次の号▶/最新号)+日付表示大型化(シーズンN 第M週)。engine.js+ui-render.js |
| 03-25 | 開発率ラベル化: getPotentialPct数値→5段階ファジーラベル(未開花/成長期/開花中/充実期/完成形)+devLabelOffset(-7~+7)+stage別バー色。UIのみ |
| 03-25 | タスクキュー6件一括実装: BUG-02ティッカー虚偽修正+TASK-03ファン希望カードfreshness+TASK-01 JTシード配置+BUG-01 showSp堅牢化+TASK-02今週画面ソート&一括+TASK-04給料交渉勝率撤去。auto-sim 100シーズンALL CLEAR |
| 03-25 | AI契約交渉パリティ: processAIContracts新設。trust<40退団判定+特性/tier補正+退団先3種(移籍/FA/引退)+O-02 bond変動+新聞(aiContractDeparture:95)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AIメディア密着B4パリティ: processAIWeeklyEvent B4許可。tier別対象選出+mediaSpotlight 3興行追跡+avgMQ報酬+E-04関係性効果+新聞(aiMediaStart:45/aiMediaSpotlight:65)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AI怪我引退パリティ: processAIWeek怪我処理拡張。重傷→retireType判定+引退処理+departureTrustImpact+_midSeasonRetirees HOF判定+新聞記事(aiInjuryRetirement:150)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AI選手間対立B2パリティ: processAIWeeklyEvent B2ニュース連携完成。_pickAIChoice B2追加+_newsTeamConflict蓄積+_b2Relマージ+新聞記事(aiTeamConflict:110)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AI練習怪我B1パリティ: processAIWeeklyEventでB1許可。tier別自動選択+applyLargeEventEffect+新聞記事(aiPracticeInjury:55)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AI団体ケアアクション統一: processAICare全面改修。状況ベース4種ケア自動選択(休暇/メディア/激励/合宿)+OVR傾斜+C系関係性効果簡易版(bond変動)。tickWeekでrelationshipsマージ。auto-sim 500シーズンALL CLEAR |
| 03-24 | ダメージセリフ/ボイス HP残量ベース発動ルール修正: フェーズ→HP残量基準に変更。tryDamageCutin関数追加(HP66%超:セリフ40%/HP34-66%:セリフ15%+ボイス50%/HP33%以下:ボイス60%のみ)。defenderReactionと同一閾値。battle-engine.html 3箇所修正+CLAUDE.mdルール追記。auto-sim 100シーズンALL CLEAR |
| 03-24 | タイトル画面SNSリンク追加(X/Patreon/FANBOX)+体験版終了画面改修(BOOTH URL修正/DLsiteボタン削除/FANBOX導線追加/SNSリンク追加)+showTrialLimitMessageテキスト修正(DLsite一時削除) |
| 03-22 | 新聞タブ見た目パッチ: 赤帯ヘッダー(週刊グラップル)、セクションラベル日本語化(一面記事/興行結果/他団体ニュース/次回展望+赤金縦線)、画像アイコン派手化(一面金枠+金グロウ/他団体紫ダーク+紫枠)、ダイジェストテーブル形式化(table1行/試合+勝者金グロウ/敗者グレー+MQ3色+バッジ日本語化)、星評価1行化+黒田アイコンダーク赤。UIのみ |
| 03-22 | 団体比較 見せ場パッチ: エース対決アリーナ(ダーク背景+赤照明+VS発光48px+名前バーグラデ)、相性グレード(赤ベタ白文字)、No.2/No.3アバター(金/紫ダーク+枠+グロウ)、注目選手アバター(52px+紫枠+グロウ)、バッジ/タグ全種ベタ塗り白文字、通算成績赤太字。UIのみ(engine.js変更なし) |
| 03-25 | AI団体間対抗戦B3パリティ: processAIWar既存実装(4週クールダウン/orgPop>20/2.5%発生率/OVRトップ3代表選出/simulateMatch matchTier2/勝者orgPop+2 trust+3 battleWins+1/敗者orgPop-0.5 trust-1/関係性rivalry/ニュースフラグ蓄積)に新聞記事生成(aiWarResult priority135、MQ90+で+20格上げ、勝利/引分テキスト分岐)+clearAINewsFlags(_newsAIWarResult削除)を追加。設計書: `docs/ai-parity-03-inter-org-war.md` |
| 03-25 | 対抗戦勝利報酬体感化: 5勝マイルストーンで新聞記事(warMilestone priority145)+士気ブースト(+3〜+5)。選手ポップアップTAB1に対抗戦個人戦績(🏴 N勝M敗)表示。殿堂ポイントにwarPt(1勝=2pt)加算+buildCareerHighlightsに「対抗戦通算N勝」。auto-sim 500シーズンALL CLEAR |
| 03-22 | 団体比較スポーツ新聞風リデザイン: カラースキームをダーク→セピア紙風に全面変更(.db-cmp-wrapコンテナ+新聞タブ同系統パレット)。英語ラベル全14箇所を日本語化。getPopularityTail slotIndex別バリエーション化(15パターン、OVR優勢+人気劣勢時の逆接表現)。VS表示強調(36px赤色+グラデーション区切り線)。エース対決アリーナレイアウト(スタンド画像向かい合わせ+名前バー)。赤帯ヘッダー追加。セクションタイトル縦線色分け(金=自陣営・中立/赤=相手情報)。UIのみ(engine.js変更なし)。auto-sim 50シーズンALL CLEAR |
| 03-21 | 6件バグ修正・改善: ■2興行中BGM漏れ修正(全試合完了時のみmanagement復帰)、■3タイトル挑戦資格(Engine.title.getEligibleChallengers新設+toggleTitle/AI団体/S1イベント/期待カード5箇所適用)、■5JT勝敗逆転修正(_receiveJTBattleResult→iframe結果でmatch上書き+_jtRecomputeSubsequentRoundsで後続ラウンド再シミュレーション)、■6コーチ画面視認性(未雇用背景rgba(0,0,0,0.3)→rgba(200,190,170,0.07)+グレード/特性バッジコントラスト向上)。auto-sim 100シーズンALL CLEAR |
| 03-21 | 収支チャート全サブタブ対応: _financeChart()共通SVGチャート関数新設+_weeklyFinanceValues()週次集計ヘルパー。総合タブの既存チャートをリファクタ、収入(緑#2ecc71)/支出(赤#e74c3c)/給与(橙#e67e22)タブにチャート追加。期間フィルタ連動。UIのみ(engine.js変更なし) |
| 03-21 | B3/B2試合観戦UI統一化 実装: B3「対抗戦」→「挑戦状」名称変更(engine.js/ui-common.js/data.js)、B3/B2にVS対峙画面(stand画像向かい合わせ+能力値対比バー+セリフ+観戦/スキップ)+battle-engine iframe観戦+フル試合結果カード(肖像/決まり手/MQ/HPバー/ターンログ+B2対立解決サマリー)追加。_renderB3MatchPreview/_renderB3MatchResult/_renderB2MatchPreview/_renderB2MatchResult新設、_executeLargeEventMatch→VS画面表示に改修、b3WatchMatch/b3SkipMatch/b2WatchMatch/b2SkipMatch/_finalizeB3Match/_finalizeB2Match新設、receiveBattleResult/escapeBattleにB3/B2ルーティング追加。auto-sim 200シーズンALL CLEAR |
| 03-21 | 浮動小数点表示バグ根絶: 表示整数化原則の確立。sanitizeFloatsにfunds/battlePoints整数化追加、updateRankingsでbaseScore/legacyScore整数化、ui-render.js/ui-common.js/engine.jsの全数値表示箇所にMath.roundガード(rating/funds/profit/収支/サバイバル/セーブスロット等40+箇所)、dispInt()汎用ヘルパー追加。auto-sim 100シーズンALL CLEAR |
| 03-21 | B3/B2試合観戦UI統一化 設計: B3「対抗戦」→「挑戦状」名称変更、B3/B2にVS対峙画面(stand画像向かい合わせ+能力値対比バー+セリフ)+battle-engine iframe観戦+フル試合結果カード(肖像/決まり手/MQ/HPバー/ターンログ)追加。Warパターン(`_warPreview`)踏襲の設計。モックアップ4画面(B3 VS/結果、B2 VS/結果)承認済み。仕様書: impl-b3-b2-match-viewing.md |
| 03-23 | レンタル契約単位修正: seasonsLeft(シーズン末一括減算)→weeksLeft(毎週1減算)に統一。1期=12週で正確に満了。processSeasonEnd→processWeeklyRental(tickWeek内呼出)。UI残週表示簡素化。マイグレーション_migrated_rental_v3(旧seasonsLeft×12→weeksLeft変換)。auto-sim 500シーズンALL CLEAR |
| 03-21 | 殿堂入りシステム拡張v2.0: allHallOfFame統合管理(player/org_s/org_a/org_b)+マイグレーション、buildCareerHighlights(titleWin/Defense/Loss/JT/PPV→固有名詞テキスト)、NPC団体殿堂入り(checkNpcHallOfFame+processSeasonEnd判定+advanceWeek回収)、レガシーポイント動的化(calcLegacyScore全団体HOF×10/cap50)、DB殿堂タブリッチ化(団体フィルタ+盾グリッド2列+詳細ポップアップ+キャリアハイライト年表+upper画像+ソート3種)、表彰式スライド(盾emoji+ハイライト年表+通算実績)、_buildAwardsSummary NPC殿堂表示、新聞npcHallOfFameニュース(priority170)。auto-sim 500シーズンALL CLEAR |
| 03-21 | JT体力バーアニメ復活+BGM演出+新聞タイミング+アイコン統一: 勝者体力バー減少→回復アニメ(準々決勝・準決勝)、優勝時BGMフェードアウト→チャンピオンジングル、JT後新聞再生成で結果記事即反映、WAR勝利+JT感想の画像を80pxポートレートアイコン(丸枠)に統一 |
| 03-21 | ジュニアトーナメントUI V6ビジュアル刷新: 召集画面(カード型全画面演出+face100px+ドット進行)、水平ブラケット(48pxアイコン角丸四角+OVRゴールドバッジ+SVGコネクター+勝者吹き出し)、フォーカスカード(stand画像向かい合わせscaleX(-1)+セリフペア)、勝者画面(upper180px+セリフ上配置)、チャンピオン画面(trophy→upper200×200 cover→CHAMPION→名前→団体→personality×archetypeセリフ)。CSS .jt-*プレフィックス新設。UIのみ(engine.js変更なし)。auto-sim 50シーズンALL CLEAR |
| 03-21 | WAR系3種+VICTORY+JTセリフ personality×archetype化: WAR_CHALLENGER/DECLINE/POST_DIALOGUE新設(200行)、WAR_VICTORY_LINES 47→93行増量、JUNIOR_TOURNAMENT_LINES 250行全属性拡張、旧trait/roleベースダイアログ全廃止、LARGE_EVENT_DIALOGUES.B3系4定数廃止 |
| 03-21 | 対抗戦勝利セリフポップアップ: WAR_VICTORY_LINES新設(personality×archetype 47パターン)+closeWarFinalResult後ポップアップチェーン(顔画像+セリフ)+CSS(.war-victory-overlay/modal)。セリフExcel管理拡張: 対抗戦4カテゴリ+JT全5タイミングの属性別枠497行追加、旧B3行統合、不要タブ削除 |
| 03-20 | U-20ジュニアトーナメント+殿堂ポイント制 全実装: Engine.juniorTournament(select/run/apply)+ブラケットUI+観戦+結果画面+セリフ5タイミング(personality×archetype)+HoFポイント制(12pt殿堂/★★★レジェンド)+PPV賞金+新聞複数ページ化(Week24プレビュー+Week25詳報)+ティッカー統合+auto-sim200シーズンALL CLEAR |
| 03-20 | 3件修正: (1)選手カード身長c.height→c.h+年齢追加、(2)B4密着取材サブタイプ化(youngStar/ace/veteran、候補フィルタ+テキスト分岐+レンタル除外)、(3)オフシーズン処理順変更(契約更新→スカウト→移籍) |
| 03-20 | バグ修正: プレイヤー練習成長(追い込み+通常)にtrainCapクランプ追加。外部乗数適用後のtrainGrowthがtrainCapを超過しうるバグを修正(AI版は既にクランプ済み) |
| 03-20 | バグ修正4件: 特別治療説明文を実ロジックに合わせ修正、B3辞退時の隠しペナルティ削除（UI表記と一致）、勝利条件/ランキング表示の浮動小数点をMath.round整数化、B3挑戦者選択をランキング隣接±1に変更（S級→3位挑戦の不自然さ解消） |
| 03-20 | 統一修正パッチv1.0: (1)黒田上半身画像廃止→28px顔アイコン統一(index.html CSS削除+ui-render.js getNpcPortraitUrl化)、(2)デフォルト比較対象→ランキング上位自動選択(_getDefaultCompareTarget+Engine.ranking.getPlayerRank)、(3)黒田テキスト全文体を記事調に統一(KURODA_HEADLINES/EDITORIAL/WAR_RECORD/MATCHUP_FLAVOR/SHOW_RATING/PREVIEW/SPOTLIGHT 全7定数)、(4)新聞v2(Engine.newspaper.generate/buildPreview/clearAINewsFlags+weeklyNewspaper+AIイベント蓄積4種+優先度ベーストップ記事+レガシー互換_renderDbNewspaperLegacy)。auto-sim 100シーズンALL CLEAR |
| 03-20 | 黒田幸子レポーターシステム Phase 2-3: NPC画像システム(getNpcPortraitUrl/getNpcUpperUrl)、kuroda-text.js新規作成(KURODA_HEADLINES/EDITORIAL/WAR_RECORD/MATCHUP_FLAVOR/SPOTLIGHT/FAN_OPINIONS/NEWSPAPER_DIGEST_COMMENTS/SHOW_RATING/PREVIEW 600+行)、既存テキスト修正(getMatchupCopy/getPopularityTail/getEdgeState/gradeDesc)、団体比較_renderDbOrgCompare()全面リニューアル8セクション、新聞タブ_renderDbNewspaper()拡張3セクション(興行評価★+全試合ダイジェスト+次回展望)、seasonStartOvrフィールド追加(ovrGainThisSeason算出用)、デッドコード削除。auto-sim 100シーズンALL CLEAR |
| 03-20 | orgWarRecord + orgPopHistory データ基盤: Engine.orgWarユーティリティ(getKey/get/getFor/recordWar/recordSummit/recordPPVMatch)、applyWarOutcome/applyPPVResults/simulateTVResultsの3箇所にフック、orgPopHistoryシーズン開幕時スナップショット、initialState初期値設定。auto-sim 500シーズンALL CLEAR |
| 03-19 | 団体画面ブラッシュアップ設計: 選手詳細WP風リデザイン（full画像+3タブ）、G1クリームカラーテーマ決定→本拠地系4画面に展開（団体/スカウト/ランキング/DB）、アイコン角丸四角統一、growthLogデータ構造設計、Mockup v1-v9作成 |
| 03-19 | バグ修正3件: ランキング画面レガシーpt列追加、引退試合後即引退（4週待ちバグ修正）、retiredIds永続化で引退選手の早期再登場防止 |
| 03-19 | 他団体戦ライバリーブースト + knownRival自動付与: isCrossOrgでrivalry×2.0(cap+35)、MQ65+/僅差でknownRival付与、PPV/B3/War全パス対応、B3バグ修正 |
| 03-19 | オフシーズンBGM: 表彰式終了まで（offWeek0-1）はmanagement BGM、offWeek2以降でseason_end BGM再生 |
| 03-18 | バグ修正バッチ: メインイベントボーナス逆転修正、不出場不満バグ、NPC王者王冠、タイトル挑戦条件強化、通常試合BGM、レンタル期日表示、効果残り時間表示 |
| 03-18 | 試合画面UI刷新 Phase 0〜7 全完了 + §1〜§4完了（勝利演出/PPVマッチカード/BGM/SE） + PPV試合進行画面リデザイン |
| 03-16 | 契約交渉v2.0（trust×ギャップ2軸マトリクス/突発退団）、trust欠落バグ修正、序盤orgPop保護 |
| 03-14 | Glimpse P1〜P6全完了、ポップアップUI統一 |
| 03-13 | Bond/Rivalryイベント設計spec + Phase A-E2演出テキスト、S級エース強化 |
| 03-10 | 成長システムリデザインv2.0、h2hデータ蓄積、Trust総合リバランスT1-T3 |

---

## 次の実装予定

### Trust Phase T4: 単発ガツン系イベント（未着手）

bond/rivalryシステムと連携する劇的イベント群。実装順推奨: S_humiliation → S_scandal → S_fanrevolt → S_powerstruggle → S_betrayal

| ID | 名称 | 発火条件 | 主効果 | 重さ |
|----|------|----------|--------|:----:|
| S_scandal | スキャンダル発覚 | pop40+ & trust60+、年1-2回 | trust-12〜-18、orgPop-1〜-3。3択 | 中 |
| S_powerstruggle | 派閥抗争 | roster12+ & trust70+が3人以上 | trust-6〜-10。3択 | 大 |
| S_humiliation | 大一番の惨敗 | タイトル/PPVでMQ35以下（自動発火） | trust-8〜-12。3択 | 中 |
| S_betrayal | 裏切り退団 | trust20-35 & 対抗戦敗北（低確率） | 即退団、全員trust-3〜-5 | 中 |
| S_fanrevolt | ファン離反 | 3興行連続平均MQ50未満 | 全選手trust-3〜-5、orgPop-2〜-4。3択 | 中 |

### U-20ジュニアトーナメント + 殿堂ポイント制 ✅ 実装完了（2026-03-20）

設計書: `docs/junior-tournament-hof-points-spec.md`

**実装済み内容:**
- Engine.juniorTournament(select/run/apply) — 全団体U-20からOVR上位8名(4名)選出、3(2)ラウンドトーナメント、決勝ビッグマッチエンジン、コンディション25%回復持ち越し
- ブラケットUI + battle-engine観戦 + 結果画面（専用BGM付き）
- personality×archetypeセリフ5タイミング（召集/試合前/試合後/決勝前/優勝後）
- PPV賞金（国庫支出: 優勝¥2,000万 / 準優勝¥1,000万 / 3-4位¥500万）
- 殿堂ポイント制（タイトル1pt/JT優勝7pt/PPV優勝9pt、12pt殿堂入り、★/★★/★★★）
- 新聞複数ページ化（Week24プレビュー特集 + Week25全試合詳報ページ + ページ送りUI）
- ティッカー統合 + careerRecord拡張 + マイグレーション

### フィニッシャーシステム（未着手、設計完了）

設計書: `specs/finisher-system-spec-v1.0.md`。SE素材＋初期キャラリスト待ち。

| Step | タスク | 重さ |
|------|--------|:----:|
| 1 | data.jsにfinisherフィールド追加（初期10〜20キャラ） | 小 |
| 2 | simulateMatch内フィニッシャー発動判定＋メタデータ付与 | 中 |
| 3 | battle-engine.htmlにカットイン演出＋SE | 中〜大 |
| 4 | 試合結果テキスト・ログに技名差し込み | 小 |
| 5 | テストプレイで発動確率・演出微調整 | 小 |

### 団体画面ブラッシュアップ + クリームテーマ展開（設計確定、未着手）

設計書: `tasks/roster-redesign-plan.md`、Mockup: `archive/prototype/roster-detail-redesign-v9.html`

所属選手の詳細パネルをウイニングポスト風に全面リデザイン。G1クリームテーマを本拠地系画面に展開。道場バナーは変更なし。
承認済み: 信頼・やる気は載せない、開発率はそのまま、growthLog無制限（引退時削除）、G1クリームカラー。
body背景: `#24221e`（セピアグレー）に全画面統一。ダークパネル: `#181614`/`#12110e`（ダークウォーム、旧ネイビーから暖色化）。パネル内でクリーム/ダークを分ける。
クリーム対象: 団体/スタッフ募集/スカウト/ランキング/DB/収支（グラフは黒維持）。ダーク維持: 今週/興行準備/ログ/セーブ/ヘルプ。

| Phase | タスク | 重さ |
|-------|--------|:----:|
| 1 | `growthLog` データ構造追加 + advanceWeek()内に記録ロジック + マイグレーション + 引退時削除 | 中 |
| 2 | body背景 `#24221e` 統一 + ダークパネル `#181614` 暖色化 + G1クリームCSS + 選手アイコン角丸四角化 | 小 |
| 3 | 詳細パネル描画: 左カラムfull画像 + 右カラム3タブ（能力/成長経過/育成） | 大 |
| 4 | クリームテーマ他画面適用: スタッフ募集/スカウト/ランキング/DB/収支（グラフは黒維持） | 中 |
| 5 | 検証: auto-sim 100シーズン + 全画面文字視認性 + モバイル確認 | 小 |

### 拡張候補

| 項目 | 優先度 | 備考 |
|---|---|---|
| 金銭バランス改善（グッズ再設計+メディア収入+trust給与効果） | 高 | 設計完了。`docs/finance-rebalance-brainstorm.md` |
| フィニッシャー（キャラ固有必殺技） | 高 | 設計完了。SE素材＋初期キャラリスト待ち |
| ライバルストーリー自動生成 | 高 | 未設計 |
| ストーリーアーク（数ヶ月にわたる抗争管理） | 高 | 未設計 |
| コーチ転身 | 中 | scout-system-spec §8.2 で予約済み |
| タッグマッチ・タッグ王座 | 中 | ライト案: シングル2試合合算方式 |
| 敵AI団体専用キャラクター | 中 | 固有キャラで世界観を深める |
| マネージャー的存在（説明キャラ） | 中 | チュートリアル・イベントの語り手 |
| マインド依存の成長イベント | 中 | mnの存在感を強化 |
| トレーニング施設アップグレード（C/B/Aランク＋老朽化メンテ） | 低 | 金銭バランス改善B-1として将来構想。お金が余った時の投資先 |

### 金銭バランス改善（設計完了・実装待ち）

設計書: `docs/finance-rebalance-brainstorm.md`

上級プレイヤーのフィードバック（6年目・6000席満員でも月間+94万）を受けた包括改善。チケット収入偏重と給与↔収入の二元論を解消する。

**① グッズ収入再設計**
- popularity連動、毎週発生（オンラインショップ的）、興行週ブースト、プロモ連動
- 月次報告で「グッズ売上トップ3」を選手セリフ付きで発表
- OVR低くてもpopularity高い選手＝「安くて稼げるお得な選手」に居場所を作る

**② メディア収入の新設**
- 放映権とスポンサーを「メディア収入」に統合、7発生源から個別計算→積み上げ
- 発生源: 週次ベース(orgPop×順位×人気) / 興行(来場人数,タイトル戦,MQ) / PPV・特別興行 / 挑戦状・対抗戦 / プロモ(回数×選手人気) / ファン期待カード実現(期待度×MQ) / ライバル抗争カード(rivalry値)
- 月次報告で合計表示＋内訳展開

**③ trust → 昇給交渉に最大8%減額効果**
- 契約交渉v2.0に組み込み。日頃のケアが少しだけ報われる程度

**④ プロモの位置づけ強化**
- プロモ活動がグッズ・メディア両方に直結。試合出場 vs プロモの人気上昇バランス再調整

**⑤ ランダムイベントE2再定義**
- スポンサー提案→「メディアパートナー契約」に。条件付き契約→メディア収入ボーナス

**見送り:** 新パラメータ(集客力等)追加、施設投資経費効率化(将来保留)、独立スポンサー契約システム、放映権ランク制

| Step | タスク | 重さ |
|------|--------|:----:|
| 1 | グッズ収入計算式の数値設計＋シミュレーション | 中 |
| 2 | メディア収入7発生源の金額テーブル設計＋シミュレーション | 大 |
| 3 | プロモ人気上昇量 vs 試合出場人気上昇量のバランス調整 | 中 |
| 4 | trust昇給減額ロジック組み込み（契約交渉v2.0拡張） | 小 |
| 5 | 月次報告UI改修（グッズトップ3演出＋メディア内訳） | 中 |
| 6 | ランダムイベントE2のメディアパートナー契約化 | 小 |
| 7 | auto-sim 100シーズン検証 | 小 |

---

## 実装済みシステム一覧

> 詳細は `docs/design-decisions.md` と `docs/archive/session-history.md` を参照。

| システム | 実装日 | 設計書 |
|---------|--------|--------|
| 団体アイコンシステム（NPC自動マッピング+プレイヤー選択UI+ランキング/対抗戦/トップバー表示） | 03-23 | — |
| 絶対週計算48週基準統一（Engine.util.absWeek共通関数+52→48修正+旧セーブマイグレーション） | 03-23 | — |
| B3/B2試合観戦UI統一化（VS対峙画面+iframe観戦+フル結果カード+名称変更） | 03-21 | `docs/impl-b3-b2-match-viewing.md` |
| JT体力バーアニメ+BGM演出+新聞再生成+WAR/JTアイコン統一 | 03-21 | — |
| 対抗戦勝利セリフポップアップ（WAR_VICTORY_LINES + ポップアップチェーン） | 03-21 | — |
| 黒田幸子レポーターシステム（NPC画像+テキスト定数+団体比較8セクション+新聞タブ3セクション+seasonStartOvr） | 03-20 | `docs/impl-orgcompare-ui-restructure.md`, `docs/impl-newspaper-enhance.md`, `docs/kuroda-style-guide.md` |
| セーブデータ圧縮+トリミング（LZ-UTF16圧縮+データ刈り込みでlocalStorage容量超過対策） | 03-20 | — |
| 興行画面ブラッシュアップ（HP対比バー共通化+対抗戦/通常興行UI刷新） | 03-19 | `docs/show-ui-brushup-spec.md` |
| 他団体戦ライバリーブースト + knownRival自動付与 | 03-19 | — |
| PPV試合進行画面リデザイン（upper画像+能力比較バー+白吹き出し） | 03-18 | — |
| 勝利演出+PPVマッチカード+BGM/SE音量（§1〜§4） | 03-18 | `docs/victory-ppv-implementation-guide.md` |
| 試合画面UI刷新 Phase 0〜7 | 03-18 | `specs/archive/battle-ui-spec-v1.0.md` |
| 契約交渉v2.0（trust×ギャップ2軸） | 03-16 | `specs/archive/contract-negotiation-event-spec-v2.0.md` |
| Glimpse P1〜P6 | 03-14 | `specs/archive/glimpse-popup-overhaul-spec-v1.2.md` |
| Bond/Rivalryイベント設計 Phase A-E2 | 03-13 | `specs/archive/relationship-event-design-spec-v1.0.md` |
| S級エース強化 & NPC団体チャンピオン | 03-13 | `specs/archive/s-rank-ace-rebalance-spec-v1.0.md` |
| 成長システムリデザイン v2.0 | 03-10 | `specs/archive/growth-system-redesign-v2.0.md` |
| h2hデータ蓄積・orgTimeline・感情テキスト | 03-10 | — |
| Trust総合リバランス T1-T3 | 03-10 | `specs/archive/trust-redesign-v2.1.md` |
| スナップショット通知 | 03-09 | — |
| 相関図リニューアル Phase 6v2 + UX改善 | 03-09 | `specs/archive/relmap-redesign-spec-v1.0.md` |
| 施設システム廃止 | 03-09 | `docs/archive/coach-lockerroom-redesign-v1.0.md` §4 |
| Trust/Bond/Rivalry包括リバランス Phase 2-5 | 03-08 | `specs/archive/bond-rivalry-balance-spec-v2.0.md` |
| 人間関係データ基盤 Phase 1〜5 + ライバル称号統合 | 03-07 | `specs/archive/relationship-system-spec-v0.2.md` |
| ライフサイクルリデザイン Phase 4 | 03-07 | — |
| NPC記録データ完全統一 v1.0 | 03-06 | `specs/archive/npc-record-unification-spec-v1.0.md` |
| 信頼度リデザイン v2.1 | 03-06 | `specs/archive/trust-redesign-v2.1.md` |
| AI統一成長モデル v1.0 | 03-06 | `specs/archive/ai-unified-growth-spec-v1.0.md` |
| プロモ改修 v1.0 | 03-06 | `specs/archive/promo-redesign-spec-v1.0.md` |
| 契約更新交渉イベント + 性格属性追加 | 03-05 | `specs/archive/contract-negotiation-event-spec-v2.0.md` |
| セリフ personality×archetype 構造化 | 03-05 | — |
| 個別特性リバランス v1.0 + 反骨心 | 03-05 | — |
| コーチスタイル統一 + マッチ演出 | 03-05 | — |
| 成長バランスリバランス v2 | 03-05 | — |
| デバッグ検証システム（auto-sim） | 03-05 | — |
| PPV GRAND FINAL Step 1-6 | 03-04 | `specs/archive/ppv-grand-final-spec-v2.0.md` |
| フィニッシャー設計 + CLAUDE.md策定 | 03-04 | `specs/finisher-system-spec-v1.0.md` |
| 因縁決着システム + MQボーナス半減 | 03-03 | `specs/archive/rivalry-resolution-spec.md` |
| MQスコア減点制 v2.0 | 03-03 | `specs/archive/mq-deduction-redesign-v2.0.md` |
| ランキング計算刷新 + ロスター枠制限 | 03-03 | — |
| ビッグマッチエンジン Tier 2 | 03-08 | — |
| コーチ+ロッカールーム Phase A〜E | 03-01 | `docs/archive/coach-lockerroom-redesign-v1.0.md` |
| L1 会場システム全面再設計 | 03-02 | — |
| レンタルシステム全面リニューアル | 03-02 | — |
| v2.0 イベントシステム Phase 1-7 | 02-28 | `specs/archive/event-system-spec-v2.md` |
| v2.1 エンディング/ゲームオーバー/BGM | 03-02 | `specs/archive/ending-gameover-spec-v1.0.md` |
| データベースタブ + 選手ポップアップ刷新 | 03-02 | — |

---

## コードベース構成

| ファイル | 行数 | 役割 |
|---------|-----:|------|
| index.html | ~2,590 | HTML+CSS+起動処理 |
| data.js | ~13,820 | 全データ定数（キャラ98名・コーチ35名・技160種） |
| engine.js | ~14,630 | ゲームロジック全体 |
| app.js | ~6,450 | Audio+Storage+Mission+App統合 |
| ui-common.js | ~6,400 | ヘルパー+ポップアップ+各種UI+レーダーチャート |
| ui-render.js | ~5,910 | 全render関数+データベースタブ+相関図v2 |
| kuroda-text.js | ~780 | 黒田幸子レポーターテキスト定数 |
| victory-lines.js | ~830 | 勝利台詞データ |
| battle-engine.html | ~2,620 | ビジュアル観戦モード（iframe） |
| **合計** | **~54,030** | |

その他: `portrait-map.js`（ルート）、選手顔画像107枚＋表彰式フレーム7枚（`image/`）、コーチ肖像画35枚（`image/coach/`）、NPC画像（`image/npc/`）、build-zip.sh

---

## アーキテクチャ5原則

1. Engine = 純粋関数（DOM禁止）
2. GameState戻り値更新（in-place変更禁止）
3. UIはG直接変更禁止（App経由のみ）
4. 乱数はseed管理で再現可能
5. tickWeek統合パイプライン

---

## 設計書インデックス

### docs/（永続ドキュメント）

| ドキュメント | ファイル |
|---|---|
| ロードマップ（本ファイル） | game-system-roadmap.md |
| ゲームの魂・開発ルール | CLAUDE.md（リポジトリルート） |
| 設計決定ログ | design-decisions.md |
| マスタースペック（現行仕様） | master-spec.md |
| 世界観設定 | world-setting.md |
| 勝利演出+PPVマッチカード+リファクタ 実装指示書 | victory-ppv-implementation-guide.md |
| 金銭バランス改善ブレスト議事録 | finance-rebalance-brainstorm.md |

### specs/（現行リファレンス仕様書）

| ドキュメント | ファイル |
|---|---|
| バトルエンジン | battle-engine-spec-v4.1b.md |
| キャラクターデータ（98名） | character-data-spec-v1.4.md |
| フィニッシャーシステム（**未実装**） | finisher-system-spec-v1.0.md |
| ライバル団体AI | rival-org-spec-v1.0.md |
| スカウト | scout-system-spec-v1.0.md |
| タイトル/ベルト | title-system-spec-v1.0.md |
| 週間ゲームループ | weekly-gameloop-spec-v1_0.md |
| 技テーブル（160技） | 技テーブル_全160技_v3_5.md |

### archive/（過去資料）

| ディレクトリ | 内容 |
|---|---|
| docs/archive/ | セッション履歴・完了タスク・旧設計書・分析レポート |
| specs/archive/ | 実装完了済み仕様書・旧バージョン（80+ファイル） |
| archive/prototype/ | HTMLプロトタイプ・UIモックアップ（15ファイル。victory-popup-prototype.html, ppv-matchcard-prototype.html, ppv-progression-prototype.html 追加） |
| archive/scripts/ | セリフ変換スクリプト群 |
| archive/exports/ | Notion/セリフエクスポートデータ |
| archive/tasks/ | 旧タスクメモ |

---

## メモ

- build-zip.shは要確認: `image/award-frame-*.png`（7枚）と `portrait-map.js` が未包含の可能性あり
- README.mdの「120名以上のキャラクター」は固有キャラ98名＋スカウト生成＋コーチ35名の合算
- 会場ロック判定は `Math.round(G.orgPop)` で比較すること（内部小数化対応）
- **立ち絵画像**: stand(256×384 webp) / full(512×768 RGBA webp) / upper(256×384 RGBA webp) / face(256×256 png)。バトル中はstand、対戦カード/PPV/練習詳細ではfull、カットインではupper
