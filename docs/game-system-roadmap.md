# Wrestle Manager ロードマップ

> 最終更新: 2026-03-02（サウンドデザイン オーバーホール）
> セッション履歴: `docs/archive/session-history.md`
> 完了済みタスク: `docs/archive/completed-tasks.md`

---

## 現在の状態

**サウンドデザイン オーバーホール（2026-03-02）。** SFXカテゴリ再分類・新規4種追加・未使用3種削除・全呼び出し見直し。

- **新規SFX 4種追加**: `event`（E5→G5 上昇2音、イベント発生・成長通知）、`reveal`（シンバルブラシ＋高域sine減衰、スライド切替）、`award`（C5-E5-G5 ベルハーモニクス＋スパークル、受賞発表）、`tension_hit`（ドラムロール→シンバル一打、緊張演出）
- **未使用SFX 3種削除**: `championship`（SFX側、BGMジングルは健在）、`seasonEnd`、`powerup`
- **音の割当て変更**: fanfareを「殿堂入り・シーズン開幕・エンディング」の3箇所に厳選。notify→event（イベント/成長通知系）、fanfare→award（受賞/ミッション完了/ドラフト完了等）、notify→reveal（スライド切替系）、hover→war（対抗戦チャレンジ表示で追加）
- **typeofガード全削除**: ui-common.js 全9箇所の `typeof Audio !== 'undefined'` ガードを直接 `Audio.play()` 呼び出しに統一（public API側にtry-catchあり）
- 変更: app.js, ui-common.js

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

### コーチ＋ロッカールーム統合リデザイン（設計書: `docs/coach-lockerroom-redesign-v1.0.md`）

| Phase | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| A | **独立3タスク先行実装** 努力家変更・表彰式画像パス修正・ケアアクション制限変更 | 小 | **実装済み** |
| B | **§1 コーチシステム** 格C/B/A・指導力/観察眼・得意スタイル・コーチ特性6種・枠(orgPop連動1-3枠)・コスト・プール30-40人 | 大 | **実装済み** |
| C | **§2 観察眼システム** コーチ報告（25%/週）・ランク別情報レベル(E-A)・揺らぎ(的外れ)・インライン表示 | 中 | **実装済み** |
| D | **§3 ロッカールーム可視化** 道場ヘッダー・雰囲気テキスト5段階+ノイズ揺らぎ | 中 | **実装済み** |
| E | **§4 施設システム廃止** 成長速度→コーチ吸収・施設UI削除 | 中 | 未着手（§1依存） |

### v2.0イベントシステム — 残タスク

| # | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| Phase1-6 | **大型イベント（B1〜B4）** 練習中の怪我・選手間対立・他団体対抗戦・メディア密着取材 | 中 | **実装済み** |
| Phase1-7 | **セリフバリエーション拡充 + バランス調整** セリフ73個追加、N1ウェイト増、S4低コスト選択肢、チームスピリットバフ、トースト時間動的化 | 中 | **実装済み** |

### Phase 2: プレイの方向性・動機付け

数シーズン遊んだ後のマンネリ防止を目標とする。

- **ファン期待度の拡張** — より多様な期待パターン、長期的な期待の蓄積
- **物語的な目標イベント** — 「○○にふさわしい舞台を用意できるか？」等、大型イベント（B枠）の一種。KPI的数値目標ではなくドラマの文脈を持った目標
- **ロッカールームの空気の可視化** — ~~リデザインPhase Dで対応~~ **Phase D実装済み**（雰囲気テキスト5段階+ノイズ揺らぎ）

### Phase 3: ゲームの個性確立

「女子プロレスのドラマを演出するゲーム」としての独自性確立を目標とする。

- **ストーリーアーク** — 数ヶ月にわたる抗争管理。完結時に大きな収益
- **練習システムのリデザイン** — コーチ割当は **Phase B実装済み**（35名コーチ、格C/B/A、指導力/観察眼、得意スタイル、コーチ特性6種）。**タブ統合実装済み**（育成タブ廃止→団体タブに統合、⚡追込を今週タブに移動）

### 拡張候補

| 項目 | 優先度 | 備考 |
|---|---|---|
| フィニッシャー（キャラ固有必殺技） | 高 | 設計書 第3部 3.11 |
| ライバルストーリー自動生成 | 高 | 未設計 |
| エンディング/ゲームオーバー演出 | — | **v2.1実装済み** |
| コーチ転身 | 中 | scout-system-spec §8.2 で予約済み |
| タッグマッチ・タッグ王座 | 中 | — |
| 敵AI団体専用キャラクター | 中 | 固有キャラで世界観を深める |
| マネージャー的存在（説明キャラ） | 中 | チュートリアル・イベントの語り手 |
| マインド依存の成長イベント | 中 | mnの存在感を強化 |
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
- **PPVは全団体合同大会** — エントリー制（Week44締切）、Week48開催。枠数はランク依存（S=5,A=4,B=3,4位=2）
- **PPVマッチメイクは盛り上がり優先** — 因縁最優先、次に盛り上がりスコア
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
- **MQ外部ボーナスキャップ** — 外部ボーナス合計+15上限。因縁+3/+5/+8、タイトル+5、コーチ+2、超満員+3/大入り+2、会場0-2
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
- **SFXカテゴリ体系** — UIカテゴリ(click/hover/select/deselect/error/save)、進行カテゴリ(tick/notify/event/reveal)、経済カテゴリ(coin/spend/stamp)、試合カテゴリ(bell/bellx3/crowd/impact)、ドラマカテゴリ(fanfare/victory/defeat/war/transfer/award/tension_hit)。fanfareは「殿堂入り・シーズン開幕・エンディング」の3箇所のみ使用。notify=軽い情報表示、event=ゲームイベント発生、reveal=段階的表示/スライド切替、award=受賞発表（fanfare代替）

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
| コーチ＋ロッカールーム統合リデザイン | coach-lockerroom-redesign-v1.0.md |
| マスタースペック（現行仕様） | master-spec.md |
| 世界観設定 | world-setting.md |
| ロスターランダム化 v2 | roster-randomization-design-v2.md |
| 難易度リバランス設計 | difficulty-rebalance-design-v1.0.md |

### specs/（現行仕様書）

| ドキュメント | ファイル |
|---|---|
| バトルエンジン | battle-engine-spec-v4.1b.md |
| キャラクターデータ（98名） | character-data-spec-v1.4.md |
| 経済システム | economy-system-spec-v1_0.md |
| コンディション/怪我 | condition-system-spec-v1.0.md |
| 週間ゲームループ | weekly-gameloop-spec-v1_0.md |
| 育成/トレーニング v1.2 | training-system-spec-v1_2.md |
| MQスコア＋人気 | mq-popularity-spec-v1.0.md |
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
