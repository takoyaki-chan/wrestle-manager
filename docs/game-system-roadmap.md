# Wrestle Manager ロードマップ

> 最終更新: 2026-03-04（PPV GRAND FINAL Step 1-6 全完了）
> セッション履歴: `docs/archive/session-history.md`
> 完了済みタスク: `docs/archive/completed-tasks.md`

---

## 現在の状態

**PPV GRAND FINAL Step 1-6 全完了（2026-03-04）。** 年末合同興行PPVの全機能が実装完了。

- **Step 1: データ＋エンジン基盤**: data.jsにPPV定数群（PPV_SLOTS/PPV_REWARD/PPV_NAMES/PPV_OPPONENT_LINES/PPV_HYPE_TEMPLATES）追加。engine.jsにEngine.ppv名前空間を新設（checkUnlock/getSlotCount/getAIEntries/resolveInjuries/calcExcitement/generateCard/pickName/generateHype/getOpponentLine/getSummitPair）。GameStateにppvUnlocked/ppvEntries/ppvPhase/ppvName追加。orgPop変動箇所（tickWeek/applyWarOutcome/applySummitOutcome）にppvUnlocked自動チェック
- **Step 2: Week 43/48フロー**: advanceWeekにWeek 43 PPVエントリー発火を追加（ppvUnlocked→ppvEntry/未解禁→tv）。AI団体エントリー自動生成。既存のD-4サミットチェックをPPV統合時スキップに変更。シーズンリセットでppvPhase/ppvEntries/ppvNameをクリア
- **Step 3: エントリーUI**: renderWeekScreenにppvEntry描画（大会名ヘッダー+枠数+チャンピオン自動エントリー+選手選択リスト+確定ボタン）。togglePPVPick/confirmPPVEntry関数。ppvPhaseをentry→lockedに遷移。セーブデータマイグレーション(_migrated_ppv_v2)
- **Step 4: PPV当日演出＋TV観戦＋結果処理**: Engine.ppv.preparePPVDay/simulatePPVMatch/applyPPVResults/simulateTVResults追加。advanceWeekにWeek48 PPV分岐（ppvShow/ppvTV weekPhase）。App._ppvPreview+9関数（initPPVShow/ppvWatchMatch/ppvSkipMatch/ppvSkipAll/_receivePPVBattleResult/finalizePPV/closePPVResult/initPPVTV/closePPVTV）。UI: renderPPVMatchPreview（カード順次公開+煽り文+VS画面+観る/スキップ）, renderPPVResult（全試合結果+報酬+対戦pt）, renderPPVTVResult（テレビ中継簡略表示）。battle-engine iframe連携
- **Step 5-6: 結果処理完成＋演出仕上げ**: applyPPVResultsに因縁MQボーナス(+3/+5/+8)+コーチMQボーナス(+2)+因縁決着判定(checkResolution)+ヒート更新(calcUpdate)+試合成長(stat+1-2)+matchupLog記録を追加。finalizePPVにブレークスルー判定+careerBestMQ+敗北スランプ+モチベ喪失チェックを追加。closePPVResultにポップアップチェーン(因縁決着+ブレークスルー/スランプ)+バフ消費を追加。結果画面にMQボーナス内訳+因縁決着バッジ+ヒート変動を表示。怪我判定なし(condition=80固定)、orgPop変動なし(合同大会)。RNG seed: 0xBBF6-0xBBFA

**フィニッシャーシステム設計完了 + CLAUDE.md策定（2026-03-04）。** フィニッシャーシステムの設計書v1.0を完成。演出レイヤー専用の差し替え方式（エンジン計算に影響なし）、フェーズ連動確率発動、顔画像切り抜きカットイン演出、5ステップ実装計画を確定。カットインビジュアルプロトタイプ（finisher-cutin-demo.html）で演出検証済み。CLAUDE.mdをリポジトリルートに新設し、ゲームの魂（三本柱・感情設計・数値哲学・やらないことリスト・機能追加判断基準）と開発ルールを統合。

**因縁演出強化 + カード鮮度UI（2026-03-04）。** 宣戦布告・決着ポップアップの専用SE新設（4種: rivalry_confrontation / fate_confrontation / rivalry_resolution / fate_resolution）。ポップアップ表示にタメ演出追加。カード編成画面に鮮度プレビュータグ表示（初顔合わせ/マンネリを事前確認可能）。matchupLogマイグレーション修正（既存対戦ペアの初顔合わせ誤判定を解消）。

**引退勧告・引き留めシステム v1.1（2026-03-03）。** プレイヤーが選手に引退を勧告し、受諾した選手がラストラン状態に入る仕組み。拒否時は信頼低下+見返しモードMQボーナス。シーズン末の引退時に引き留め可（最大2回、wear+10代償）。コーチの観察眼ランクに応じた受諾率アドバイス。

- **Engine.retirement**: canAdvise(wear≥20/age≥30/careerSeasons≥8)、calcAcceptance(wear/isChamp/trust/winRate)、advise(受諾→lastRun=true/拒否→trust-5+proveMode4週or morale-2)
- **ラストラン**: lastRun=true → Pass2 MQ+3(基本)+5(メイン) + 因縁ボーナス+3/+5。4週後にシーズン末と同じ引退処理。ポップアップに「🌅ラストラン」バッジ
- **引き留め**: canRetain(retainCount<2, wear<80)。wear+10, retainCount+1, injuryBonus+0.05。retiredFightersからrosterへ移動
- **コーチアドバイス**: E-D:不明確、C:2段階25%flip、B:3段階15%shift、A:4段階5%shift。COACH_RETIRE_ADVICE_TEXTS

**ロスター枠制限 v1.0（2026-03-03）。** プレイヤー団体にハードキャップ（段階解放6→8→10→12→16）、AI団体はidealRosterでハードキャップ化。

- **段階解放**: ドラフト6→タイトル設立8→サバイバルクリア10→対抗戦初勝利12→ランキング1位16。各トリガーで通知ポップアップ
- **AIハードキャップ**: S:16/A:13/B:10（B tier 9→10に変更）。aiScout: need+1廃止。aiInterTransfer: idealRoster+2→idealRosterに統一
- **全獲得経路チェック**: signFighter/scoutEventResolve/resolveNegotiation の3経路で `ownCount >= rosterCap` ガード
- **UI**: ロスター画面「所属 N/M名」ヘッダー、スカウト画面キャップ警告バナー、ポップアップ獲得ボタン無効化
- **マイグレーション**: 旧セーブ互換（titleEstablished/survivalCleared/warWon/ranking1位から逆算）

**MQスコア減点制リデザイン v2.0（2026-03-03）。** 加点制を廃止し「天井−減点」方式に全面移行。OVが試合品質の上限を決め、ドラマ・ペース・決着不足で減点される設計。

- **天井（OVシーリング）**: avgOV≤50: `20+OV×0.60`（OV40→44）、≤80: `50+(OV-50)×1.10`（OV70→72）、超: `83+(OV-80)×0.85`（OV90→92）。clamp(15,100)
- **ドラマ減点**: 基本-30。KO×8（上限2回）・カウンター×2.5（上限3）・逆転×1.5（上限3）・大技×0.4（上限6）で回復
- **ペーシング減点**: 7-14ターン=0（理想）、5-16=3（許容）、<5=12（瞬殺）、17+=6（だらだら）
- **決着減点**: フォール/ギブアップはフェーズ連動(Climax:0/End:1/他:3)、ピン=0、丸め込み=1、TKO=2、タイムアウト=10
- **`finishPhase`フィールド追加**: simulateMatch戻り値に決着フェーズ名(`'Opening'|'Mid'|'End'|'Climax'|'Timeout'`)を追加
- **`mqDetail`フィールド追加**: デバッグ用内訳 `{ ceiling, dramaPenalty, pacingPenalty, finishPenalty }` を戻り値に追加
- **外部ボーナス・Pass 2は変更なし**: キャップ+15、因縁/タイトル/コーチ等のボーナスは維持
- **シミュレーション結果**: OV40同士avg 43→23、OV80同士avg 57→62（高OVは正当に評価される設計）
- 変更: engine.js のみ（L247, L317-356の各決着箇所, L374-391 MQ計算ブロック, return文）
- 設計書: `specs/mq-deduction-redesign-v2.0.md`

**ランキング計算刷新 Phase 1（2026-03-03）。** ティア固定ハンデ・頭数依存ランキングを廃止し、TOP5ベースの基礎力＋対戦ポイントの新計算式に移行。

- **新ランキング計算式**: `rating = TOP5平均OVR × 1.5 + TOP5平均pop × 1.0 + battlePoints`
- **championScore廃止**: RIVAL_ORGS から championScore プロパティ削除（旧: S=60/A=40/B=20/Player=0or30）
- **summitBonus廃止→battlePoints統合**: `state.summitBonus` を削除し `state.battlePoints: { player:0, org_s:0, org_a:0, org_b:0 }` に移行。シーズンリセット対象
- **対戦ポイント移動**: 対抗戦勝敗で±12pt、頂上決戦勝敗で±10pt のゼロサム移動を実装
- **BATTLE_POINT_CFG定数**: war:12, summit:10, tournament:{champion:20,runnerUp:8,semiFinal:0,firstRound:-14}, tournamentWeek:24
- **Engine.ranking全面書換え**: `calcStarPower`/`calcTotalPop` 廃止。`_topNAvg(roster, valueFn, n)`/`calcBaseScore(roster)`/`calcOrgRating(roster, battlePt)` 新設
- **ランキングUIリニューアル**: テーブル列を「⭐スター / 👥人気計」→「基礎力 / 対戦pt」に変更。対戦ptは色分け表示（正=緑/負=赤）。ツールチップ更新
- **団体比較レーダーチャート更新**: 「エース力」→「TOP5実力」（TOP5平均OVR/90×100）、「スター度」→「TOP5人気」（TOP5平均pop/80×100）に変更
- **セーブデータ互換**: `_migrated_ranking_v2`。旧summitBonus→battlePoints.player移行。ランキング再計算
- 設計書: `docs/ranking-roster-redesign-v1.0.md`
- 変更: data.js, engine.js, app.js, ui-render.js

**選手成長リバランス v1.0（2026-03-03）。** プレイヤー(+3 OVR/年)とAI(+8 OVR/年)の構造的不公平を解消。「シーズン予算」モデルに統一。

- **GROWTH_SEASON_BASE = 8.0**: 4ステ合計の1シーズン成長予算（ageMul=1.0時）。プレイヤー・AI共通基盤
- **calcGrowth全面書換え（shareベース）**: convergenceFactor+STYLE_GROWTH方式を廃止。`share = remaining / totalRemaining` で残距離比例配分。`perPractice = (seasonBudget × ageMul × coachMul × practiceShare × share) / 9`。特性ボーナス（ムードメーカー/リーダー気質/負けず嫌い）・variance（努力家/破天荒）・intensiveMul維持
- **×0.4練習補正撤廃**: tickWeek processManage内の `growth * 0.4` を2箇所（intensive/practice）から削除。penMult/statusMult/trainingBoostMult/trainerMultは維持
- **ageMultiplier新カーブ**: ≤17:0.8（新人）、18-19:1.1（急成長期入口）、20-22:1.3（黄金の成長期）、23-25:1.0（安定）、26-28:0.6（仕上げ）、29-30:0.15（ほぼ停止）、31-32:0.05（微成長）、33+:0。早熟/晩成/遅咲き特性修正は維持
- **aiSeasonGrowth書換え**: STYLE_GROWTH×convFactor方式を廃止。`seasonBudget = GROWTH_SEASON_BASE × ageMul × coachMul × tierGrowth` のshare配分に統一。facilityMul参照削除
- **AI離脱イベント（怪我擬似反映）**: processSeasonEndにS級10%/A級12%/B級15%の離脱判定追加。`_aiGrowthHalf=true`で成長50%カット
- **AI_SEASON_CFG整理**: trainWeeks/seasonVariance*/matchGrowthBase/matchesPerSeason/matchVariance*を削除。popConvergeRate/popRandomRange/tierPopBonusのみ残置
- **practiceShare: 0.6**: GROWTH_CONFIGに追加。練習:試合 = 6:4 の予算配分
- **convergenceFactor deprecation**: 関数は残置、非参照化。deprecationコメント追加
- 設計書: `docs/growth-rebalance-design-v1.0.md`
- 変更: data.js, engine.js

**コーチ上半身画像＋データベースコーチタブ（2026-03-03）。** コーチ詳細ポップアップに上半身WebP画像を追加し、データベースタブにコーチ一覧を新設。

- **コーチ上半身画像**: `image/coach/upper_coach_*.webp` — 全35名分のWebPファイルを配置（ユーザーが上書き可能なプレースホルダー）。`getCoachUpperUrl(id)` 関数追加
- **コーチ詳細ポップアップ刷新**: バナー方式→選手ポップアップと同様のサイドバイサイドレイアウト（左: 上半身画像160×240px、右: 名前・グレード・特性・指導力/観察眼/得意/成長倍率）。ポップアップ幅380px→520pxに拡大。画像なし時はフェイス画像にフォールバック
- **データベース「全コーチ」タブ**: サブタブ順を「全選手→全コーチ→団体比較→殿堂」に変更。グレード・名前・指導力・観察眼・得意・特性・給与・雇用費・状態を一覧表示。グレードフィルタ+名前検索+全カラムソート対応。行クリックでコーチ詳細ポップアップ表示
- 変更: data.js, index.html, ui-common.js, ui-render.js, image/coach/upper_*.webp (35枚追加)

**バランス調整 v1.9（2026-03-03）。** AI団体成長バランス・年齢カーブ型契約費用・逸材特別交渉枠の3点を実装。

- **変更C: AI団体成長バランス調整**: RIVAL_ORGS facilityMulを全て1.00に（実質廃止）。AI_TIER_LIMITS growthBonusをS:1.20→1.05、A:1.05→1.00、B:0.90→0.95に再調整。プレイヤーに施設システムがないためfacilityMulが歪めていた問題を解消
- **変更B: 年齢カーブ型契約費用**: ageMarketMultiplier関数追加。21歳以下の逸材+個性2つ以上に若手プレミアム(1.10-1.35)、26-27歳0.95、28-29歳0.85。30歳以降は既存reassessに委譲（二重適用なし）。calcAssessedValueに組み込み
- **変更A: 逸材特別交渉枠（FA専用）**: orgPop≥25到達時にG.eliteTicket=true。FA一覧でeliteティア選手1名のreqPopを無視して交渉可能（1回限り、superElite不可、スカウト不可）。canNegotiateにcontext/state引数追加。🎫バッジ+金枠ボーダー+使用確認メッセージ。tickWeekで検知→_pendingEliteTicket transient→processWeekでgoldポップアップ通知
- 設計書: `specs/balance-adjustment-spec-v1.9.md`
- 変更: data.js, engine.js, app.js, ui-render.js, ui-common.js

**因縁決着システム＋因縁MQボーナス半減（2026-03-03）。** 因縁に「決着」のゴールを追加し「発生→盛り上がり→決着→報酬」のサイクルを完成。2段階演出（試合前の宣戦布告→試合後の決着セリフ）でカタルシスを演出。因縁MQボーナスも約半分に引き下げ。

- **因縁MQボーナス半減**: 因縁+5/宿敵+8/永遠のライバル+12 → +3/+4/+6に引き下げ
- **決着条件**: 宿敵以上(matches>=4)で対戦しMQ>=動的閾値で決着成立。閾値=天井×0.80(下限30,上限50)。matchesゼロリセット+両選手pop+4+orgPop+1.5（永遠のライバル: pop+6, orgPop+2.5）。v2.1で固定50から動的化（低OVR帯の因縁破綻を修正）
- **宣戦布告ポップアップ（試合前）**: 宿敵+ペアの試合開始前に対決前セリフをコール＆レスポンスで表示。通常5パターン+永遠のライバル専用3パターン。SE: Audio.play('war')
- **決着ポップアップ（試合後）**: 勝者/敗者のセリフ＋ボーナス明示。永遠のライバル専用セリフ+赤枠+金枠演出。SE: Audio.play('award')
- **クールダウン**: 決着後lastResolvedWeek記録、同ペアは4週間ファン期待カードに出さない
- **ポップアップ連鎖**: eventPopups → 決着ポップアップ → growthPopups → retirementPopups
- **Engine.title.checkResolution()**: 決着判定ヘルパー。deferredRivalryPairsパターンで宿敵+ペアのrecordRivalryをMQ確定後まで保留
- 変更: data.js, engine.js, index.html, ui-common.js, app.js

**ヘルプ画面全面書き直し（2026-03-03）。** 度重なる更新で古くなっていたヘルプ画面を全11セクションに再構成。

- **誤り修正**: 満員率ボーナス（旧×1.5/×1.2→正×1.2/×1.1）、興行頻度（旧4週に1回→正2週に1回＝偶数週）
- **新セクション追加**: 信頼・士気・ケア、成長・衰え・引退、人気・MQシステム、イベント
- **既存セクション更新**: スカウト→スカウト・レンタルに統合、会場10段階・リスク指標の説明追加、スケジュール4種（バランス/練習優先/プロモ優先/休養重視）の説明追加、コーチシステム詳細化、ゲームオーバー条件の明記
- **セクション構成（全11）**: ゲームの目的/基本の流れ/団体・育成管理/興行の組み方/スカウト・レンタル/引き抜き交渉/信頼・士気・ケア/成長・衰え・引退/人気・MQシステム/イベント/序盤攻略のコツ
- 変更: index.html

**コーチ名フルネーム統一＋道場バナー中央配置（2026-03-02）。**

- **コーチ名統一**: 旧コーチ8名の肩書き付き名前（道場長/トレーナー/師範/フィジカルコーチ/メンタルコーチ/総合アドバイザー/セコンド/マネージャー）をフルネーム形式に変更。新コーチ（ID 9〜）と命名規則を統一
- **道場バナーキャラ配置**: 選手アイコンを右下端→バナー中央（上下左右）に移動。リング上で練習している演出に
- **コーチバッジ簡素化**: 肩書き除去の正規表現→姓のみ表示（`name.split(' ')[0]`）に簡素化
- 変更: data.js, index.html, ui-render.js

**会場規模連動の試合数システム（2026-03-02）。** 固定試合数（通常4/特別興行6）を廃止し、会場規模に応じた動的試合枠に変更。

- **VENUES maxMatches追加**: 公民館3→小ホールA/B 3→市民会館4→中ホールA 4→中ホールB 5→大ホール5→アリーナ6→大会場7→ドーム8。会場が大きいほど試合数が多い自然な成長感
- **特別興行/PPVボーナス**: 全会場で+1試合（上限8でキャップ）。「最大6試合」ハードコードを完全除去
- **Engine.util.getMaxMatches(week, venueIdx)**: 試合数計算の単一ソース。engine.js/ui-render.js/ui-common.js/app.jsの全箇所で使用
- **CARD_DEPTH_MULT拡張**: 6要素→8要素（7,8試合目は1.0）
- **会場カードに試合枠表示**: 「試合枠: N試合」を会場選択UIに表示。特別興行時は「(+1)」も表示
- **showCard動的調整**: 初期値を空配列`[]`に変更。renderShowPrepのpad/trimで会場に応じて自動リサイズ
- 変更: data.js, engine.js, ui-render.js, ui-common.js, app.js

**レンタルシステム全面リニューアル（2026-03-02）。** レンタルシステムを単発→複数枠・シーズン単位契約に刷新。UI大幅改善。

- **データモデル変更**: G.rental(単体)→G.rentals(配列)。契約: {fighterId, fromSource:'rival'|'fa', fromOrgId, seasonsLeft, fee}
- **RENTAL_CONFIG**: minSeasons:1, maxSeasons:4, topExclude:3, faTierMul:0.85, tierMul:{S/A/B}, getMaxConcurrent(rosterSize)
- **費用**: 前払い一括。calcSeasonFee = pow(ovr/50,2.5)*25*tierMul*12*seasons
- **供給元**: ライバル団体(OVR上位3名除外) + フリーエージェント(制限なし)。表示候補20名に拡大
- **シーズン末処理**: advanceWeek offWeek1でEngine.rental.processSeasonEnd。seasonsLeft--→0で帰団
- **確認ダイアログ**: レンタル実行前にshowConfirmで顔アイコン+費用+期間+残り資金を確認表示
- **ソート機能**: レンタル候補テーブルの名前/総合/費用カラムをクリックで昇降順ソート（▲/▼表示）
- **期間表記変更**: 「シーズン/季」→「期(N週)」に統一（12週=1期）
- **タイトル制限**: レンタル選手はタイトルマッチ出場不可（3箇所チェック）
- **orgPop貢献50%**: レンタル参加試合のMQ重み付け=0.5
- **ロスター分離表示**: 金枠セクション「🤝 レンタル枠（N/M）」で区分表示
- **マイグレーション**: _migrated_rental_v2。旧G.rental→G.rentals変換
- 変更: data.js, engine.js, ui-render.js, ui-common.js, app.js

**道場バナーシーン化＋「スタッフ室」改名（2026-03-02）。** 道場ヘッダーをシーン風に演出。「スタッフ室」→「スタッフ募集」に改名。

- **道場バナーシーン化**: dojo-headerをposition:relativeコンテナ化。バナー画像上にグラデーションオーバーレイ（下部→半透明黒）を重ねる。左下にコーチ吹き出し（報告あり:コーチアバター+報告テキスト、報告なし:先頭コーチ+雰囲気テキスト、未雇用:emoji+テキストのみ）。右下に雰囲気レベル連動の選手アイコン（level1:0人、level2:0-1人、level3:1人、level4:1-2人、level5:2-3人）をseedRNGで週固定選出、±5pxのY軸揺らぎ。選手アイコンは全員吹き出し付き（15種の掛け声テキスト、13-19sサイクルでループ、毎サイクル被りなしランダム差し替え）。クリックで選手ポップアップ連携
- **CSS新規11クラス**: .dojo-header-overlay, .dojo-scene-coach, .dojo-scene-coach-avatar, .dojo-scene-bubble, .dojo-scene-bubble .coach-name, .dojo-scene-fighters, .dojo-scene-fighter
- **「スタッフ室」→「スタッフ募集」改名**: 5箇所（index.html×3: ボタン/パネルタイトル/ヘルプ文、ui-render.js×1: 未雇用案内、app.js×1: ミッション説明）
- 変更: index.html, ui-render.js, app.js

**タブ統合＆並び替え（2026-03-02）。** 育成タブを廃止し団体タブに統合。ナビバー並び替え。

- **育成タブ廃止**: `screen-training` HTML・`renderTraining()` 関数・ナビボタンを完全削除
- **団体タブに統合**: 道場ヘッダー（雰囲気テキスト+コーチ報告）を団体タブ冒頭に移植。選手カードに▼展開ボタンを追加し、ステータスバー+伸びしろ+コーチアサインドロップダウンを展開表示。成長ログパネルを団体タブ末尾に配置。カード内にコーチバッジ+成長傾向矢印をインライン表示
- **今週タブに⚡追込ボタン追加**: スケジュールテーブルに⚡列を追加。manageフェーズ中のみ操作可能。負傷/体調不足/連続上限でdisabled
- **ナビバー並び替え**: 今週→興行準備→団体→スカウト→ランキング→データベース→収支→ログ→セーブ→ヘルプ（10ボタン）
- **互換性**: `showScreen('training')` → `'roster'` にフォールバック（セーブデータ互換）
- **テキスト更新**: クエスト2件の「育成画面で」→「団体画面で」、コーチツールチップ「育成画面で」→「団体画面で」、ヘルプ画面を団体タブ/今週タブベースの説明に書き換え
- **選手カードレイアウト変更**: 2列グリッド→1列フレックス（展開パネル収容のため）
- 変更: index.html, ui-render.js, ui-common.js, app.js

**L1: 会場システム全面再設計（2026-03-02）。** 会場自動昇格制を廃止し、プレイヤーが毎週自分で会場を選ぶシステムに変更。

- **VENUES 10段化**: 旧7段（公民館〜ドーム, popReqロック制）→ 新10段（公民館〜ドーム, 全会場選択可能）。序盤帯を細かく刻み（小ホールA/B、中ホールA/B、大ホール追加）、段階的ステップアップの選択肢を拡充
- **基礎集客カーブ刷新**: 旧`(orgPop/100)²×10000` → 新`BASE_ATTENDANCE_CURVE`（21点区間線形補間）。orgPop 5で60人〜orgPop 100で30,000人の滑らかなカーブ。相応の会場で70-90%埋まる設計
- **週次揺らぎ**: ±17%ランダム係数（seed 0xA77E で再現可能）。プレビューでは揺らぎなし（rng=null）、実行時のみ適用
- **勢い補正（momentum）**: 満員(95%+)→+4%、大入り(80%+)→+2%、空席(30-60%)→-3%、ガラガラ(<30%)→-5%+orgPop-0.5。上限±15%。連続満員で好循環、ガラガラで悪循環
- **ざっくり予測**: 正確な集客数を非表示に。3段階テキスト（盛り上がりそう/まずまず/客足が心配）で手応えだけ表示
- **リスク指標UI**: 会場カードにbaseAtt/cap比率で◎安全/△挑戦/✕危険を色分け表示（緑/橙/赤ボーダー）
- **セーブマイグレーション**: 旧7段venueIdx→新10段へ自動変換（venueMap）。attendanceMomentum初期化
- 変更: data.js, engine.js, app.js, ui-common.js, ui-render.js, index.html

**バグ修正バッチ+画像拡大パス+給料連続関数化+ファン期待リアクション（2026-03-02）。**

- **バグ修正バッチ(R2/B1/B3)**: AUTO_DELAY 3000→2500ms（battle-engine.html）、showFinishClickBtn AUTO自動送り対応、イベントポップアップ拡大（max-width 340→450px、顔画像 72→120px）
- **画像拡大パス(R1)**: ケア反応トースト 40→120px（縦レイアウト化）、試合結果 勝者90→180px/敗者70→110px/ドロー80→140px、選択/大型イベント 52→88px、育成画面 80→100px。`.care-reaction-toast` CSS新設
- **給料連続関数化(R4)**: SALARY_TABLE（7段テーブル）→ SALARY_PARAMS 連続指数関数。base = A*exp(B*OVR) + popMax*(pop/100)^popExp + titleBonus。OVR35:5万〜OVR95:194万の滑らかなカーブ
- **ファン期待リアクション(R3)**: ファン期待カードの試合後にMQ分岐リアクションポップアップ表示。MQ≥55:好試合（gold tone + 歓声5パターン + 勝者セリフ5パターン）、MQ<55:凡戦（neutral tone + 残念4パターン + 勝者セリフ4パターン）。autoCloseMs 2500対応。FAN_EXPECT_REACTIONS定数（data.js）、fanExpectMatchフラグ（engine.js/app.js両パス）

**コーチ新キャラクター27名反映+画像フォルダ分離（2026-03-02）。**

- **コーチキャラクター全面刷新**: ALL_COACHES id 9-35 の27名を新規キャラクターに差し替え。name（フルネーム形式）・emoji・desc・profile・age・gender・origin を更新。機械的パラメータ（grade/teaching/observation/style/trait/salary/hireFee/minOrgPop）は変更なし
- **世界観整合**: 「元プロレスラー」経歴4名を別スポーツに変更（id30:BJJ黒帯、id31:バレー代表監督、id33:テコンドー五輪銀、id34:柔道五輪金）。女子プロレスが国民的スポーツの世界観に合致
- **名前修正**: id33 葉月レナ→葉月レミ（実在人物との重複回避）
- **画像フォルダ分離**: コーチ肖像画を `image/coach/` サブフォルダに移動。既存8枚を移動＋新規27名の仮画像を配置（全35枚）
- **COACH_PORTRAIT拡張**: id 1-8 のみ → id 1-35 の全35名にマッピング追加。`getCoachPortraitUrl` パスを `../image/coach/` に変更
- **肖像画プロンプト文書**: `docs/coach-portrait-prompts.md` を27名分の新キャラに全面更新（Danbooru形式プロンプト+格納フォルダ記載）

**リデザイン Phase C+D 実装完了（2026-03-01）。** 観察眼システム（§2）+ ロッカールーム可視化（§3）+ バグ修正2件。

- **§2 観察眼システム**: Engine.coach.generateReport — 非興行週に25%/週でコーチ報告生成。観察眼ランク別テキスト（E-D:漠然、C:選手名+ムード、B:選手名+ステータス名、A:天井接近ヒント）。COACH_OBS_INACCURACY揺らぎ（的外れ時に報告方向が反転）。_pendingCoachReport transient → currentCoachReport（1週持続、育成画面インライン表示）
- **§3 ロッカールーム可視化**: Engine.lockerRoom.getAtmosphereText — lockerRoomMorale±10ノイズ→5段階雰囲気テキスト。render時生成（Date.now()ソルトで意図的非決定性）。育成画面冒頭に道場ヘッダー+雰囲気テキスト常時表示
- **バグ修正**: _pendingTeamSpirit がtickWeekで未転送（チームスピリットトースト未発火）を修正。renderWeekScreen L641 の streak未定義エラーを修正
- **UI**: .dojo-atmosphere（level-1~5色分け）、.coach-report-bubble（ゴールド枠吹き出し、クリックでコーチツールチップ連携）

**リデザイン Phase A〜D 全完了。** 残りは Phase E（施設システム廃止）のみ。設計書: `docs/coach-lockerroom-redesign-v1.0.md`

**Phase1-7 セリフバリエーション拡充+バランス調整セッション完了。** セリフ73個追加+バランス微調整4点。

- **セリフ拡充（data.js）**: LARGE_EVENT_TEXTS +12（B1:3→6, B2:2→5, B3:2→5, B4:2→5）、LARGE_EVENT_DIALOGUES +17（B3_challenger:8→13, B3_decline:3→7, B3_result_lose:3→7, B3_result_win:3→7）、CHOICE_EVENT_DIALOGUES +11（E1特性別4行+default2行, S4_silent:1→3, E6:+2）、NOTIF_EVENT_TEXTS +12（全タイプ4→6）、NOTIF_DIALOGUES新設 N2/N5_warning キー各6行、ENDING_LINES +9（fighter:10→15, coach:6→10）
- **N1ウェイト増**: w:2→3（trust管理の報酬感強化）
- **N2/N5_warningセリフ有効化**: getNotifDialogue の早期リターン条件削除
- **S4 低コスト第4選択肢**: funds<200時「励ましの言葉をかける」（信頼度+3、無料）
- **逆境チームスピリットバフ**: funds<300 && morale>=50 && week%4===0 でランダム1名trust+1、トースト表示
- **トースト表示時間動的化**: 固定7秒→テキスト長に応じて9〜15秒（ui-common.js）
- **TEAM_SPIRIT_TEXTS**: 4パターン新設（data.js）
- 変更: data.js, engine.js, app.js, ui-common.js

**大型イベントB1〜B4セッション完了。** v2.0イベントシステム Phase1-6 を実装。

- **B1 練習中の怪我**: 単発3択モーダル（特別治療-200万/通常/無理させる）。injury+growthPenalty適用
- **B2 選手間の深刻対立**: 3段階フロー（対立報告→秘密介入→試合結果）。trust低い2選手が対立、試合で決着
- **B3 他団体対抗戦**: 3段階フロー（挑発オファー→代表選手選択→試合結果）。AI団体から憎たらしい態度の挑戦者
- **B4 メディア密着取材**: 選手選択→3興行追跡→avgMQ評価。興行準備画面にスポットライトバナー表示
- 発生率: 2.5%/週（非興行週のみ）、8週間クールダウン
- 変更: data.js, engine.js, app.js, ui-common.js, ui-render.js, index.html

**データベースタブセッション完了。** データベースタブ・選手ポップアップ刷新・5能力値カラム・プロフィール拡充を実装。

- **データベースタブ（3サブタブ）**: 全選手一覧（ソート・フィルター対応）/ 殿堂一覧 / 団体比較（デュアルレーダーチャート）
- **選手ポップアップ刷新**: 上半身画像（200×300 webp + onerror fallback）+ レーダーチャート + ステータスバー並列表示。因縁・ファン期待・戦績セクション追加
- **drawRadarChart()汎用関数**: Canvas 2D 5角形レーダー。単一/デュアルデータセット対応。ポップアップ・団体比較で共用
- **5能力値カラム**: 全選手一覧テーブルにPW/SP/TE/ST/MNカラム追加。各カラムでソート可能。色分け表示（75以上=固有色、60以上=白、未満=薄色）
- **CHAR_PROFILES拡充**: 主要キャラ約85名のプロフィールを1-2行→3-4行（200-280文字）に拡充。戦闘スタイル・性格・強み弱みの掘り下げ

**v2.1 BGMセッション完了。** エンディング/ゲームオーバー/BGMファイル再生を実装。

- **クリア演出**: 年間1位でシーズン終了時に5スライドのエンディング（awardsOverlay再利用）
- **ゲームオーバー**: funds≤0 で weekPhase:'gameover' → gameoverOverlay 表示。autoSave 上書きなし
- **BGMファイル再生**: FileBGM（HTMLAudioElement ベース）。`Audio.fileBgm` として公開
- **クレジット画面**: タイトルに Credits リンク追加。楽曲クレジット（序・序曲 / MOMIZizm MUSiC）表示
- **BGM Autoplay対応**: `_endingNext()` 内 idx===0（「開始▶」クリック直後）でBGM開始

**セッション33完了。** ビジュアル観戦バトルエンジン品質改善。

- **バトルエンジン耐久性調整**: hpScale 0.90→1.20、defStaScale 0.02→0.06、pinAttemptHpThreshold 0.35→0.28、pinAttemptMinDmg 9→10。OVR80同士の試合が3ターンで終わる問題を解消
- **状況依存技選択**: selMoveにHP比率を導入。相手HP<30%で65%フィニッシャー(d≥12)優先、自分HP<25%で40%逃げ技(rollup/弱サブミッション)優先
- **フィニッシュ確率傾斜**: End/Climaxで低d技(d<10)のフォール試行率をd/10に低減（ハードゲートではなく傾向）。アームドラッグ(d=4)での決着確率が大幅低下

**セッション32完了分。** バグ修正2件 + UX改善1件 + 難易度微調整1件。

- **UX改善**: ロスターソートに「育成」ソート追加 — 強化練習→練習→バランス→プロモ→休養の順で整列。同タグ内はOVR降順
- **Bug修正**: 補助金が「推定週間収支」に反映されていない表示バグ — `Survival.estimateWeeklyNet` の `totalBaseIncome` に `getSubsidy()` を追加。「固定収入」表示も正確に（orgPop 32なら+10万→+30万）
- **難易度調整**: SUBSIDY_TABLE に orgPop 30〜34 帯（45万/週）を新設 — 30の崖（65万→20万、-45万落差）を（65万→45万→20万）の2段に緩和
- **Bug修正**: 育成画面の「今週の行動」が前週の行動を表示し続けるバグ — `previewAction` が `c._weekAction`（前週記録）を優先参照していた。常に現在の `c.schedule` から算出するよう修正。「休養を選択済みなのに反応しない」問題も解消

**セッション31完了分**: バグ修正1件＋UX改善5件＋難易度崖緩和3件。ケアモーダルCSS修正・ケアアクション確認ダイアログ・おまかせボタン両週対応・getMQAdjust 4段階化・逓減×0.70・補助金20-29帯65万。NPC選手戦績非表示・ランキング画面「選手を見る」構造改修・NPC特性表示（_migrated_npc_traits）・FA初期年齢16-20修正・収支報告過去4週集計。

セッション30完了分: 月末再試合バグ修正・ケアシステム週次制限・getMQAdjust導入。セッション29完了分: タイトルマッチ格差ペナルティ＋特性4種実装（適応力/人望/忠誠心/野心）。v2.0イベントシステム Phase 1（Step 1〜5）完了。

---

## 次の実装予定

### ランキング・ロスター・団体間対戦 リデザイン（設計書: `docs/ranking-roster-redesign-v1.0.md`）

| Phase | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| 1 | **ランキング計算の刷新** championScore廃止、TOP5基礎力+対戦pt計算式、ランキングUI更新、団体比較連動 | 中 | **実装済み** |
| 2 | **ロスター人数制限** プレイヤー段階解放6→16、AI:idealRosterハードキャップ化(S:16/A:13/B:10)、全獲得経路チェック、UI表示 | 中 | **実装済み** |
| 3 | **対戦ポイントシステム** battlePointsフィールド運用開始、AI同士の対抗戦ポイント処理、サミット条件緩和(ランク3位以上) | 中 | **実装済み**（warChance 50%化のみ。AI同士のポイント処理はトーナメント/PPVに委任。summitMinRankは2を維持） |
| 4 | **統一トーナメント** Engine.tournament新規実装、第24週開催、8名シングルエリミネーション、代表選手選択UI | 大 | 未着手 |

### コーチ＋ロッカールーム統合リデザイン（設計書: `docs/coach-lockerroom-redesign-v1.0.md`）

| Phase | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| A | **独立3タスク先行実装** 努力家変更・表彰式画像パス修正・ケアアクション制限変更 | 小 | **実装済み** |
| B | **§1 コーチシステム** 格C/B/A・指導力/観察眼・得意スタイル・コーチ特性6種・枠(orgPop連動1-3枠)・コスト・プール30-40人 | 大 | **実装済み** |
| C | **§2 観察眼システム** コーチ報告（25%/週）・ランク別情報レベル(E-A)・揺らぎ(的外れ)・インライン表示 | 中 | **実装済み** |
| D | **§3 ロッカールーム可視化** 道場ヘッダー・雰囲気テキスト5段階+ノイズ揺らぎ | 中 | **実装済み** |
| E | **§4 施設システム廃止** 成長速度→コーチ吸収・施設UI削除 | 中 | **実装済み** |

### 因縁リデザイン＋カード鮮度システム（設計書: `specs/rivalry-resolution-spec.md` v2.0）

| タスク | 重さ | 状態 |
|--------|:----:|------|
| **A. 因縁ラベル変更** 永遠のライバル→宿命の相手。RIVALRY_THRESHOLDS + セリフデータ + UI表示 | 小 | **実装済み** |
| **B. 決着2回上限** resolutionCount追加、1回目=宿敵(4戦)、2回目=宿命の相手(7戦)、以降不可 | 中 | **実装済み** |
| **C. 好敵手ステータス** resolved=true後はMQ+2永続、決着なし、🤝ラベル表示 | 小 | **実装済み** |
| **D. カード鮮度システム** matchupLog記録、初顔合わせMQ+2、マンネリMQ-3/-5/-8（12興行ウィンドウ） | 中 | **実装済み** |
| **E. 演出・UI** 鮮度メッセージ、好敵手表示、最終決着ポップアップ | 小 | **実装済み** |
| **F. マイグレーション** resolutionCount/matchupLog初期化、ラベル参照更新 | 小 | **実装済み** |

### PPV GRAND FINAL 合同興行（設計書: `specs/ppv-grand-final-spec-v2.0.md`）

| Step | タスク | 重さ | 状態 |
|------|--------|:----:|------|
| 1 | **データ＋エンジン基盤** PPV定数 + Engine.ppv名前空間 | 中 | **実装済み** |
| 2 | **Week 43/48 フロー** advanceWeek連携 + ppvPhase管理 | 中 | **実装済み** |
| 3 | **エントリーUI** 選手選択画面 + AI自動選出 | 中 | **実装済み** |
| 4 | **PPV当日演出＋結果処理** 試合発表+観戦+TV+報酬+ポイント+人気 | 大 | **実装済み** |
| 5-6 | **結果処理完成＋演出仕上げ** MQボーナス+因縁決着+ヒート+成長+ブレークスルー+UI改善 | 中 | **実装済み** |

### フィニッシャーシステム（設計書: `specs/finisher-system-spec-v1.0.md`）

| Step | タスク | 重さ | 状態 |
|------|--------|:----:|------|
| 1 | **データ追加** data.jsにfinisherフィールド追加（初期10〜20キャラ分） | 小 | 未着手（キャラリスト＋技名待ち） |
| 2 | **エンジン判定** simulateMatch内で高ダメージ技選択時にフィニッシャー発動判定。matchResultにメタデータ付与 | 中 | 未着手 |
| 3 | **観戦モード演出** battle-engine.htmlにカットインHTML/CSS/アニメーション＋SE再生 | 中〜大 | プロトタイプ検証済み（SE素材待ち） |
| 4 | **試合ログ反映** 試合結果テキスト・ログにフィニッシャー技名差し込み | 小 | 未着手 |
| 5 | **調整** テストプレイで発動確率・顔切り抜き位置の微調整 | 小 | 未着手 |

### 拡張候補

| 項目 | 優先度 | 備考 |
|---|---|---|
| フィニッシャー（キャラ固有必殺技） | 高 | **設計完了** specs/finisher-system-spec-v1.0.md。SE素材＋初期キャラリスト待ち |
| ライバルストーリー自動生成 | 高 | 未設計 |
| ストーリーアーク（数ヶ月にわたる抗争管理） | 高 | 未設計 |
| コーチ転身 | 中 | scout-system-spec §8.2 で予約済み |
| タッグマッチ・タッグ王座 | 中 | — |
| 敵AI団体専用キャラクター | 中 | 固有キャラで世界観を深める |
| マネージャー的存在（説明キャラ） | 中 | チュートリアル・イベントの語り手 |
| マインド依存の成長イベント | 中 | mnの存在感を強化 |
| エンディング/ゲームオーバー演出 | — | **v2.1実装済み** |
| 選手/団体の情報一覧タブ | — | **データベースタブとして実装済み** |

---

## コードベース構成

| ファイル | 行数 | 役割 |
|---------|-----:|------|
| index.html | ~1,320 | HTML+CSS+起動処理 |
| data.js | ~2,000 | 全データ定数（キャラ98名・コーチ35名・技160種） |
| engine.js | ~6,100 | ゲームロジック全体 |
| app.js | ~3,530 | Audio+Storage+Mission+App統合 |
| ui-common.js | ~3,200 | ヘルパー+ポップアップ+各種UI+レーダーチャート |
| ui-render.js | ~2,550 | 全render関数+データベースタブ |
| victory-lines.js | 501 | 勝利台詞データ |
| battle-engine.html | 1,734 | ビジュアル観戦モード（iframe） |
| **合計** | **~20,605** | |

その他: `portrait-map.js`（ルート）、選手顔画像107枚＋表彰式フレーム7枚（`image/`）、コーチ肖像画35枚（`image/coach/`）、build-zip.sh

---

## 設計決定ログ（実装済みルール集）

- **ロスターランダム化** — potTotal重み付き配分。S級≥690, A級≥640。シリーズボーナス+0.3。dormant動的計算
- **チャンピオン集客ボーナス** — チャンピオン出場時に集客×1.10
- **乱入マッチ** — チャンピオン3回防衛後、タイトルマッチ当日に20%で発生。隣接団体OVR90%以上の選手が乱入。勝利+2/敗北-15〜-20
- **フレーバーイベント** — チャンピオン or 人気55以上に12%/週。雑誌取材（人気+2〜3）・TV出演（ヒート+2〜3）
- **殿堂入り条件** — 獲得＋防衛合計13回以上、またはグランドスラム
- **衰退・引退はdurability + wear方式** — wearは28+durability歳から蓄積。wear 20〜39で軽度衰退、40〜59で本格衰退（引退20%/年）、60〜79で末期（50%/年）、80+で確定引退
- **壊滅的怪我** — 重傷時に追加判定。基本2〜3%、ベテラン(wear40+)は5〜8%。即引退
- **PPV GRAND FINAL** — orgPop≥30で永続解禁(ppvUnlocked)。Week43エントリー受付(ppvPhase:'entry'→'locked')、Week48開催。枠数ランク依存(1位:5/2位:4/3位:3/4位:2名)。チャンピオン自動エントリー。AI団体OVR上位自動選出。未解禁時はTV観戦モード(ppvPhase:'tv')。出場報酬ランク依存(1位:300/2位:200/3位:150/4位:100万円)
- **PPVマッチメイクは盛り上がり優先** — 因縁最優先(宿敵以上+異団体制約)、次にcalcExcitement貪欲法。サミット(ランク1位vs2位エース)はメインイベント固定。同団体対戦禁止
- **PPV当日は専用実行パス** — App._ppvPreview+9関数。通常興行（executeShow/finalizeShow）とは独立。対抗戦(war)パターン踏襲。会場/集客/チケット収益なし、固定報酬PPV_REWARD[rank]。condition=80固定。RNG seed: 0xBBF2(hype)/0xBBF3(battle)/0xBBF6(成長)/0xBBF7(BT)/0xBBF8(スランプ)/0xBBF9(momentum)/0xBBFA(モチベ喪失)/0xBBF5(TV)。カード順次公開（前座→メイン、card末尾→先頭）。TV観戦モード: AI全自動+battlePoints更新のみ
- **PPV事後効果** — 因縁MQボーナス(+3/+5/+8)+コーチMQボーナス+因縁決着判定+ヒート更新+試合成長+matchupLog+ブレークスルー+careerBestMQ+スランプ+モチベ喪失。怪我なし(condition=80人工的)、orgPop変動なし(合同大会)、会場熱気/カード鮮度/ファン期待度は非適用
- **年末表彰式** — 新人王・ベストマッチ・MVP・チャンピオン紹介・殿堂入り
- **集客計算は加算方式** — heat/title/champ/charismaのボーナスを加算し上限2.0倍キャップ
- **人気の自然減衰** — 毎週-0.5（人気10超の全選手）
- **orgPop年次減衰** — シーズン末にorgPop比例（-2/-3/-5/-7/-10）
- **FA年齢保存方式** — dormantPool退場時に{id, age}で保存。22歳超はFA参入不可
- **HEAT倍率圧縮** — Warm ×1.1、Hot ×1.2、On Fire ×1.3。興行週にも軽減衰-0.3
- **baseAttendance係数** — ~~(orgPop/100)² × 10000~~ L1で廃止 → BASE_ATTENDANCE_CURVE（21点区間線形補間、orgPop 0:20人〜100:30000人）
- **会場システム（L1）** — 全10段（公民館150〜ドーム30000）、popReq撤廃で全会場選択可能。週次揺らぎ±17%（seed 0xA77E）。勢い補正attendanceMomentum（±15%上限、ガラガラ<30%でorgPop-0.5）。ざっくり予測3段階テキスト。リスク指標（◎安全/△挑戦/✕危険）
- **給料連続関数** — base=0.65*exp(0.06*OVR) + 80*(pop/100)²人気加算 + タイトル保持者+20万。SALARY_TABLE廃止→SALARY_PARAMS
- **グッズ単価** — 0.15万/人（チケット:グッズ比率 3:1）
- **育成補助金** — orgPop 40未満に地域振興助成金（0-19:80万/週、20-29:65万/週、30-34:45万/週、35-39:20万/週）。推定週間収支にも反映
- **orgPop逓減カーブ** — 0→×1.0, 20→×0.70, 40→×0.35, 55→×0.20, 70→×0.12, 85→×0.08
- **orgPop帯別MQ閾値シフト** — orgPop<20:shift=-10/negMult=0.4、orgPop<30:shift=-7/negMult=0.5、orgPop<45:shift=-3/negMult=0.85、45以上:変更なし（Engine.orgPop.getMQAdjust）
- **ケアシステム2週間隔制限** — costume/mediaは2週に1回/選手/アクション（state.week - _careWeekUsed[actionId] < 2 で管理）。orgPopゲート: costume/media≥20、special_treatment≥40。ロック時はUI上で「知名度XXで解放」表示
- **Heat維持困難化** — HOT以上（heatScore≥6）で上昇×0.5、冷め速度1.5倍
- **内部小数化** — popularity/orgPopを小数のまま保持。表示はdispPop/dispOrgPop（Math.round）
- **MQ外部ボーナスキャップ** — 外部ボーナス合計+15上限。因縁+3/+4/+6、タイトル+5、コーチ+2、超満員+3/大入り+2、会場0-2
- **タイトルマッチ格差ペナルティ** — OVR差>10:MQ-3、>20:MQ-6（キャップ後別途減算）
- **特性4種効果** — 適応力:growthPenalty+0.2軽減、人望:lockerRoomMorale+3/週、忠誠心:引き抜き確率×0.25、野心:挑戦者MQ+2+ブレークスルー+0.5%
- **trustパラメータ** — レスラーに trust(0-100) 追加。mentalCoeffの変動係数。自然減衰(-1/月)
- **ファン期待度** — 因縁ペア(priority3) → 王者挑戦者(priority2) → 人気上位(priority1)。最大3件。実現時MQ+5。試合後リアクションポップアップ（MQ≥55:好試合gold/MQ<55:凡戦neutral、観客+勝者セリフ各4-5パターン、autoCloseMs 2500）
- **ニュースティッカー** — manage画面スクロールバー。毎週3-5件生成。8カテゴリ
- **新聞パネル** — 重大イベント時にスポーツ新聞風ポップアップ。8種×複数パターン
- **autoFillCardのタイトルマッチチェック** — autoFillCard()でEngine.title.canTitleMatch()を確認
- **エンディング条件** — offWeek4: pRank===1 && !endingCleared → endingCleared=true/endingClearedSeason=season。翌シーズン offWeek1 に演出（endingClearedSeason===season-1 で1回のみ）
- **ゲームオーバー条件** — tickWeek settlement後に funds≤0 → weekPhase:'gameover'。autoSave上書きなし。processWeekで検知→showGameOverScreen
- **FileBGM** — HTMLAudioElement ベース。Audio IIFE 内 FileBGM オブジェクト。Audio.fileBgm として公開。BGM再生は必ずユーザー操作直後（Autoplay Policy対応）
- **逆境チームスピリットバフ** — funds<300 && lockerRoomMorale>=50 && week%4===0 でランダム1名にtrust+1。_pendingTeamSpirit transientフィールドでトースト表示
- **S4低コスト第4選択肢** — funds<200時のみ表示。「励ましの言葉をかける」信頼度+3、morale+2、無料
- **通知イベントトースト動的表示時間** — テキスト長に応じて9〜15秒（baseDuration + max(0, textLen-40)*40ms、上限15秒）
- **大型イベントB1〜B4** — 非興行週に2.5%/週で発生。8週クールダウン。B1:怪我3択、B2:対立3段階+介入+試合、B3:他団体対抗戦3段階+試合、B4:メディア密着3興行追跡。_pendingLargeEvent transientフィールドでadvanceWeekへ連携
- **努力家特性** — baseGain×1.15乗算を廃止。weeklyVariance下限を0.5→0.75に引き上げ（通常:0.5-1.5、努力家:0.75-1.5）。破天荒(0.0-2.5)との対極構造
- **コーチ報告（観察眼システム）** — 非興行週に25%/週で発生。担当選手がいるコーチからランダム1人→担当選手からランダム1人。ランク別テキスト: E-D=vague(名前なし), C=named+mood(positive/negative/neutral), B=named+stat(growing/stagnant), A=trainCap接近ヒント(near_cap/far_from_cap)。COACH_OBS_INACCURACY揺らぎ(C:20%,B:20%,A:8%)で方向反転。_pendingCoachReport→currentCoachReport（1週持続インライン表示）
- **雰囲気テキスト（ロッカールーム可視化）** — lockerRoomMorale±10ノイズ→displayScore→5段階(0-20/21-40/41-60/61-80/81-100)。render時にDate.now()ソルトで意図的非決定性（装飾表示のみ、ゲーム状態に影響なし）。ATMOSPHERE_TEXTS各段階3-4パターン
- **データベースタブ** — Engine.database.getAllFighters()でdormantPool除外の全選手を収集。3サブタブ構成（全選手/殿堂/団体比較）。モジュールレベル変数（_dbSubTab/_dbSortKey等）で状態管理
- **drawRadarChart()** — Canvas innerHTML設定後にdocument.getElementByIdで取得して描画。5角形レーダー、単一/デュアルデータセット対応。hexToRgba()ヘルパー併用
- **選手ポップアップ上半身画像** — getUpperUrl(id)でwebpパス取得。onerrorで従来のface PNGにフォールバック
- **5能力値カラム色分け** — PW=#e74c3c, SP=#3498db, TE=#2ecc71, ST=#f39c12, MN=#9b59b6。75以上=固有色、60以上=白、未満=薄色
- **イベントポップアップautoCloseMs** — showEventPopup opts.autoCloseMs指定時にsetTimeout(closeEventPopup, ms)で自動閉じ。closeEventPopup内でclearTimeout。ファン期待リアクションで使用（2500ms）
- **会場規模連動の試合数** — VENUES.maxMatches（公民館3〜ドーム8）。Engine.util.getMaxMatches(week,venueIdx)で一元管理。特別興行/PPVは+1（上限8）。CARD_DEPTH_MULT 8要素。showCardは空配列初期化→pad/trimで動的調整
- **レンタルシステム** — G.rentals配列。シーズン(期)単位契約(1-4期,12週/期)。前払い一括。FA+ライバル団体2ソース。同時2-3枠(ロスターサイズ連動)。タイトル戦出場不可。orgPop貢献50%。確認ダイアログ(顔アイコン+費用)。ソート(名前/OVR/費用)対応。ロスター金枠分離表示
- **AI団体成長バランス（v1.9）** — facilityMul全団体1.00（実質廃止）。growthBonus: S=1.05, A=1.00, B=0.95。coachMulのみで差異化
- **年齢カーブ型契約費用（v1.9）** — ageMarketMultiplier: 21歳以下の逸材+個性2つ以上で1.10-1.35プレミアム、22-25歳=1.0、26-27歳=0.95、28-29歳=0.85、30歳以降=1.0（既存reassessに委譲）。calcAssessedValueでbaseValue*variance*ageMulとして適用
- **逸材特別交渉枠（v1.9）** — orgPop≥25到達時にG.eliteTicket=true（1回限り）。canNegotiate(orgPop, fighter, context, state)の第3-4引数で判定。context='fa'かつeliteTicket=trueかつtierId='elite'でreqPop無視。superElite不可、スカウト不可。契約成功時にeliteTicket=false,eliteTicketUsed=true。isEliteTicketRequired()ヘルパーでUI表示判定。_pendingEliteTicket transientフィールドでgoldポップアップ通知
- **選手成長リバランス v1.0** — GROWTH_SEASON_BASE=8.0の「シーズン予算」モデル。calcGrowthをshare(残距離比例)ベースに全面書換え。×0.4練習補正撤廃。aiSeasonGrowthも同モデルに統一。ageMultiplier新カーブ（20-22歳ピーク1.3、33歳以上0）。AI離脱イベント（S:10%/A:12%/B:15%で成長50%カット）。convergenceFactor+STYLE_GROWTHは非参照化（残置）。practiceShare=0.6（練習:試合=6:4）。設計書: docs/growth-rebalance-design-v1.0.md
- **ランキング計算（v2: ranking-roster-redesign Phase 1）** — 旧: `championScore + calcStarPower(全員合算) + calcTotalPop(全員合算) + summitBonus`。新: `TOP5平均OVR × 1.5 + TOP5平均pop × 1.0 + battlePoints[orgId]`。TOP5は各指標で独立に上位5名を選出し平均（5名未満はある分だけ平均）。battlePointsはシーズンリセット。対抗戦±12pt、頂上決戦±10ptのゼロサム移動。BATTLE_POINT_CFG定数で管理。団体比較レーダーも連動（TOP5実力/TOP5人気）。設計書: docs/ranking-roster-redesign-v1.0.md
- **MQスコア減点制（v2.0）** — 旧加点制(Base+Drama+Pacing+Finish)を廃止。新: `天井(OVシーリング) − ドラマ減点 − ペース減点 − 決着減点`。天井=OV依存曲線(15-100)。ドラマ減点=基本30からKO/カウンター/逆転/大技で回復。ペース減点=7-14ターン理想帯(0)、<5ターン=-12。決着減点=フォールはClimaxで0〜3、ピン=0、タイムアウト=-10。特性ボーナス（名勝負製造機/引き出し上手）は天井超え加点として維持。外部ボーナス(Pass2, cap+15)は変更なし。simulateMatch戻り値に `finishPhase`・`mqDetail` を追加。設計書: specs/mq-deduction-redesign-v2.0.md
- **引退勧告・引き留めシステム v1.1** — Engine.retirement: canAdvise(wear≥20/age≥30/careerSeasons≥8)、calcAcceptance(50±wear±champ±trust±winRate, clamp 5-95)。受諾→lastRun=true(4週)、Pass2 MQ+3(基本)+5(メイン)+因縁+3/+5。拒否→trust-5, retireAdviceCooldown=48週, 70%でproveMode4週(MQ+2)/30%でmorale-2。引き留め→retiredFighters→roster, wear+10, retainCount+1(最大2回), injuryBonus+0.05。コーチアドバイス: Engine.coach.getRetireAdvice(obsRank別4段階+COACH_OBS_INACCURACY flip)。UI: ポップアップTab2引退セクション+ラストランバッジ+ラストマッチ金枠表示。設計書: specs/retirement-advisory-spec-v1_1.md
- **ロスター枠制限 v1.0** — G.rosterCap(初期6)段階解放: タイトル設立→8、サバイバルクリア→10、対抗戦初勝利(warWon)→12、ランキング1位→16。レンタル別枠(isRental除外)。AIハードキャップ: AI_SCOUT_CFG.idealRoster(S:16/A:13/B:10)。aiScout: need+1→need、aiInterTransfer: idealRoster+2→idealRoster。全獲得経路チェック: signFighter/scoutEventResolve/resolveNegotiation。UI: renderRoster「所属 N/M名」ヘッダー、renderScoutキャップ警告バナー、ポップアップ獲得ボタン無効化。マイグレーション: 旧セーブは達成状況から逆算。設計書: specs/roster-cap-design-v1.0.md
- **因縁決着システム（実装済み）** — 因縁を「発生→盛り上がり→決着→報酬」のサイクルにする。2段階演出: 試合前に宣戦布告ポップアップ（ペア台詞コール＆レスポンス、通常5パターン+永遠3パターン、SE:'war'）→ 試合後に決着ポップアップ（勝者/敗者セリフ+ボーナス明示、SE:'award'）。決着条件: 宿敵以上(matches≥4)で試合しMQ≥50。決着成立時: matchesをゼロリセット、両選手pop+4、orgPop+1.5。永遠のライバル(matches≥7)からの決着はpop+6、orgPop+2.5、赤枠+金枠演出強化。クールダウン: 決着後lastResolvedWeekを記録、同ペアは4週間ファン期待カードに出さない。MQ<50の試合は「不完全燃焼」として因縁残存。deferredRivalryPairsパターン: 宿敵+ペアのrecordRivalryをMQ確定後まで保留し、レベルアップメッセージと決着リセットの矛盾を防止。因縁MQボーナス半減: +5/+8/+12→+3/+4/+6。ポップアップ連鎖: eventPopups→決着→growth→retirement。詳細: specs/rivalry-resolution-spec.md

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
| コーチ＋ロッカールーム統合リデザイン | coach-lockerroom-redesign-v1.0.md |
| マスタースペック（現行仕様） | master-spec.md |
| 世界観設定 | world-setting.md |
| ロスターランダム化 v2 | roster-randomization-design-v2.md |
| 難易度リバランス設計 | difficulty-rebalance-design-v1.0.md |
| 選手成長リバランス v1.0 | growth-rebalance-design-v1.0.md |
| ランキング・ロスター・団体間対戦 リデザイン v1.0 | ranking-roster-redesign-v1.0.md |

### specs/（現行仕様書）

| ドキュメント | ファイル |
|---|---|
| バトルエンジン | battle-engine-spec-v4.1b.md |
| キャラクターデータ（98名） | character-data-spec-v1.4.md |
| 経済システム | economy-system-spec-v1_0.md |
| コンディション/怪我 | condition-system-spec-v1.0.md |
| 週間ゲームループ | weekly-gameloop-spec-v1_0.md |
| 育成/トレーニング v1.2 | training-system-spec-v1_2.md |
| MQスコア＋人気（旧加点制） | mq-popularity-spec-v1.0.md |
| MQスコア減点制 v2.0 | mq-deduction-redesign-v2.0.md |
| 団体ランキング/勝利条件 | org-ranking-spec-v1_0.md |
| タイトル/ベルト | title-system-spec-v1.0.md |
| スカウト | scout-system-spec-v1.0.md |
| ライバル団体AI | rival-org-spec-v1.0.md |
| 特性リスト（25種） | traits-v2.1.md |
| 技テーブル（160技） | 技テーブル_全160技_v3_5.md |
| エンディング/ゲームオーバー v1.0 | ending-gameover-spec-v1.0.md |
| イベントシステム v2 | event-system-spec-v2.md |
| 成長イベントシステム | growth-event-spec-v1.0.md |
| 世界観演出システム | world-presentation-spec-v1.4.md |
| データベースタブ | database-tab-spec-v1.0.md |
| 因縁決着システム | rivalry-resolution-spec.md |
| バランス調整 v1.9 | balance-adjustment-spec-v1.9.md |
| レンタルシステム | rental-system-spec.md |
| ロスター枠制限 v1.0 | roster-cap-design-v1.0.md |
| 引退勧告・引き留め v1.1 | retirement-advisory-spec-v1_1.md |
| フィニッシャーシステム v1.0 | finisher-system-spec-v1.0.md |
| PPV GRAND FINAL 合同興行 v2.0 | ppv-grand-final-spec-v2.0.md |

### docs/（実装ガイド）

| ドキュメント | ファイル |
|---|---|
| PPV実装指示書 | ppv-implementation-guide.md |

### docs/archive/（旧版・完了済み）

| ファイル | 内容 |
|---|---|
| docs/archive/session-history.md | セッション1〜29の開発記録 |
| docs/archive/completed-tasks.md | v1.0〜v2.0の完了済みタスク一覧・マイグレーション一覧 |

### specs/archive/（完了済み実装仕様・旧版）

| ファイル | 内容 |
|---|---|
| v1.3-1-decay-retirement-spec.md | 衰退・引退システム（v1.3-1実装済み） |
| v1.3-2-growth-injury-spec.md | 成長システム改訂＋怪我デバフ（v1.3-2実装済み） |
| v1.3-3-retirement-presentation-spec.md | 引退演出（v1.3-3実装済み） |
| v1.4-awards-impl-spec.md | 年末表彰式（v1.4実装済み） |
| v1.4-awards-ui-revision-spec.md | 年末表彰式UI修正（v1.4実装済み） |
| session25-impl-spec.md | 内部小数化＋MQボーナス見直し（v1.5s25実装済み） |
| session25b-milestone-spec.md | rawDeltaカーブ＋節目イベント（v1.5s25b実装済み） |
| economy-rebalance-spec-v5b.md | 経済リバランス設計書（v1.5として実装済み） |
| card-attendance-redesign-spec-v1.0.md | 集客計算リデザイン設計書（実装済み） |
| popularity-venue-redesign-spec-v1.0b.md | 人気・会場再設計仕様書（実装済み） |
| ppv-awards-spec.md | PPV＋年末表彰式仕様書（実装済み） |
| pricing-balance-spec-v0.99.md | 価格バランス設計書 v0.99（旧版） |
| balance-test-spec.md | バランステスト仕様書（旧版） |
| training-system-spec-v1_0.md | 育成システム v1.0（旧版、v1_2が現行） |
| rival-system-spec-v0_9.md | ライバル団体システム v0.9（旧版） |

---

## メモ

- build-zip.shは要確認: `image/award-frame-*.png`（7枚）と `portrait-map.js` が未包含の可能性あり
- README.mdの「120名以上のキャラクター」は固有キャラ98名＋スカウト生成＋コーチ35名の合算
- セッション17のバランスシミュレーション結果: `tests/balance-sim.js` で再現可能
- 会場ロック判定は `Math.round(G.orgPop)` で比較すること（内部小数化対応）
