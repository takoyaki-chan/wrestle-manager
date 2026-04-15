# Wrestle Manager ロードマップ

> 最終更新: 2026-04-15（社長室 Phase 9 — ビジュアル磨きとヘルプ、spec v1.1 逆輸入）
> セッション履歴: `docs/archive/session-history.md`
> 完了済みタスク: `docs/archive/completed-tasks.md`
> 設計決定ログ: `docs/design-decisions.md`

---

## 現在の状態

**社長室 Phase 9 — ビジュアル磨きとヘルプ + spec v1.1 リライト（2026-04-15、Phase 1-9 全完了）。** Phase 5-8 で社長室の機能はすべて完成しており、Phase 9 は磨き込みの仕上げセッション。①書類の微回転 (±3°、週+docId で決定論的シード、同じ週内は同じ角度で再レンダーしても変わらない、週が変わるとわずかにずれる) — `renderShachoshitsu` で inline `style="--doc-rotate:Xdeg"` を注入、CSS で `.shachoshitsu-doc { transform: rotate(var(--doc-rotate, 0deg)) }` とし、hover ルールも `rotate(var(--doc-rotate, 0deg)) translateY(-4px)` に書換 (既存の is-approving 朱印アニメや is-approved 状態とも衝突しない)。②壁画像フェードイン (`@keyframes shachoshitsu-wall-fade` 0.6s ease-out、opacity 0.35→1.0) — 社長室画面を開く度に場面が立ち上がる感じを演出、季節切替週でも自然に馴染む。③書類フェードイン (`@keyframes shachoshitsu-doc-enter` 0.5s、opacity 0→1 + `filter: blur(1px)→blur(0)`) — 机に書類が並べられる際の立ち上がり演出、翌週の「決裁済みリセット」のビジュアルケアも兼ねる (同じアニメが再レンダー時にも走るので自然に馴染む)。④朱印サウンド追加 — `App.executeDecision` の演出フック冒頭で `Audio.play('stamp')` を呼び、既存のコスト別サウンド (fanfare/award/event/notify) と並列で鳴らす。stamp は既存の Web Audio 合成音で短いバーストなので重ならない。⑤ヘルプ画面の「信頼・士気・ケア」セクションに Phase 7/8 の説明を追記 — 「書類の効き方は選手によって変わる」(不確実性、🌟 深く刺さった / 💤 あまり響かなかった の2段階表現を言及)、「成長バフと並走する信頼」(trainer 4週 / camp 2週の遅延発現を narrative 的に説明)、「社長の自発的行動」(声かけの2段階温度感 gentle/urgent を明記)。⑥spec v1.1 リライト — `specs/shachoshitsu-spec-v1.0.md` の冒頭タイトルを v1.1 に、ステータスを「作成中 → 実装完了 (Phase 1-9)」に更新。§1.2 アクション分類表を 6書類 + 机外 2アクション構成に書換 (encourage を机外に分離、各書類の trust 発現タイミングを「即時」「4週遅延(バフ並走)」「2週遅延(バフ並走)」に明記)。§4.3 即時/遅延発現セクションを trainer/camp のみ遅延・narrative 変更理由(ボーナス/休暇/宴席は即時が自然) + 「即時万能感の排除」を Phase 8 の不確実性に全面移行した旨を明記。§5 遅延発現メカニズム全面書換 (対象 trainer/camp のみ、期間 `_trainerBuff.weeksLeft` と同期、データ構造に finalMult 追加、UI表現を選手ポップアップバッジ + 週次ミニ通知トーストに)。§6.1 不確実性基本方針に「v1.0 から v1.1 で即時万能感の排除手段を遅延発現から不確実性へ移行」明記。§6.3 性格マトリクスから `shy` 行削除 (プロジェクトに存在しない、6性格構成) + camp 列追加。§6.4 アーキタイプマトリクスを全書類に拡張 (ojousama×camp=0.80 / delinquent×trainer=1.10 / cool×encourage=0.80 / seductive×refresh_leave=1.10 を追加)。§6.6 UI表現をトーンマーカー (🌟/💤) と trainer 予告文言3段階に更新、team 書類でトーンマーカー非表示の旨を明記。末尾の変更履歴に v1.1 (2026-04-15) エントリを追加し、Phase 5-9 で判明した設計変更8項目を一覧化。変更: ui-render.js(renderShachoshitsu docRotation 関数 + inline style 注入)+index.html(.shachoshitsu-wall animation + .shachoshitsu-doc transform + hover 書換 + is-approved transform 保持 + @keyframes shachoshitsu-wall-fade/shachoshitsu-doc-enter + ヘルプセクション追記)+app.js(executeDecision 演出フックに Audio.play('stamp') 追加)+specs/shachoshitsu-spec-v1.0.md(v1.1 逆輸入 全面リライト)。検証: auto-sim 50シーズン(seed=42) ALL CLEAR(違反0/エラー0/ゲームオーバー0/2650週)。実機: 書類3枚にそれぞれ異なる rotation (bonus:0.28° / trainer:-2.12° / camp:-2.74°) が inline style で付与、週2に進めると 3枚とも別値に変化(bonus:-2.06° / trainer:0.32° / camp:-1.28°)。壁の animation-name が shachoshitsu-wall-fade、書類の animation-name が shachoshitsu-doc-enter、hover で rotation 保持。bonus 実行で Audio.play 呼出履歴が ['stamp','notify']、.is-approving と .hanko.falling クラス付与を確認。ヘルプセクションに不確実性/遅延発現/声かけ2段階の説明が含有 (1478 文字)。仕様: specs/shachoshitsu-spec-v1.0.md v1.1 (全面リライト)。指示書: plans/archive/shachoshitsu-phase9-task.md(未作成、Phase 9 は指示書なしで実装)。

前回: **社長室 Phase 8 — 性格×アーキタイプで決裁効果が±50%変動（2026-04-15）。** spec v1.0 §6 の2マトリクス(性格×書類, アーキタイプ×書類)を採用し、`finalMult = clamp(personalityMult × archetypeMult, 0.5, 1.5)` を各書類の trust 効果に乗算。同じ書類でも選手の性格・アーキタイプで効き目が ±50% 変動するようになり、「刺せば必ず望み通りに効く」万能感が崩れた。「即時万能感の排除」を Phase 7 の遅延発現から Phase 8 の不確実性に完全移行(遅延発現は trainer/camp のみで成長バフ並走、ボーナス等は narrative の時間軸を優先して即時維持)。実装: `src/data.js` に `DECISION_PERSONALITY_MULT` (6性格×7書類: normal/bold/quiet/easygoing/earnest/emotional — spec §6.3 の shy はプロジェクトに存在しないため除外) と `DECISION_ARCHETYPE_MULT` (4非normal × 書類: ojousama/delinquent/cool/seductive、記載なしは 1.00) を追加。spec §6.4 を拡張して camp/encourage/refresh_leave/trainer の組合せを narrative から補完(ojousama×camp=0.80, delinquent×trainer=1.10, cool×encourage=0.80, seductive×refresh_leave=1.10)。`Engine.shachoshitsu.calcUncertainty(docId, fighter)` 新設: personalityMult × archetypeMult を算出、`Math.max(0.5, Math.min(1.5, mult))` で clamp。`Engine.shachoshitsu.classifyTone(finalMult)` 新設: ≥1.2='high' / <0.8='low' / それ以外=null を返す。`execute` 内 `queueTrust` のシグネチャに `finalMult` パラメータ追加(Phase 7 の `pendingTrustDeltas.finalMult` フィールドに保存され、`applyPendingTrustDeltas` で毎週 `perWeekDelta × finalMult` として適用される)。各書類分岐で `calcUncertainty` を呼んで trust 効果に適用 — bonus/refresh_leave/encourage/media は `applyTrust(f, delta * mult)`、trainer は `queueTrust(f, delta, 'trainer', weeks, mult)`、party/camp は選手ごとに `calcUncertainty` 呼出。`condition`/`slumpMomentum`/`growthBoost`/`orgPopDelta` は不確実性対象外(固定効果のまま)。個人書類の `execute` 返り値に `reactionTone` / `finalMult` を追加(team書類は選手ごとに mult が異なるため含めない)。`showDecisionResultModal` に `displayData.reactionTone` を読み取ってトーンマーカーを表示(🌟 深く刺さった / 💤 あまり響かなかったようだ、普通は無表示)。trainer の予告文言を3段階に出し分け: high→「今後4週にわたって、予想以上に深く響いていきそうだ」/ low→「今後4週にわたって、わずかに効いていくだけかもしれない」/ normal→「今後4週にわたって、じわじわと育っていく」。`app.js` の `executeDecision` / `encourageFighter` の displayData 構築に `reactionTone: result.reactionTone || null` を追加。CSS `.decision-result-tone.high`/`.low` を `src/index.html` に追加(high: rgba(212,168,67,0.18) 背景 + #e8c35c テキスト + 金色発光、low: rgba(160,160,160,0.10) 背景 + #a8a8a8 テキスト)。検証: auto-sim 100シーズン(seed=42) ALL CLEAR(違反0/エラー0/ゲームオーバー0/5300週)。実機 (preview_eval 経由): calcUncertainty 13パターン検証で normal/normal=1.0/tone=null, emotional=1.3/high, ojousama×bonus=0.7/low, emotional×delinquent clamp 1.5, bold×cool×bonus=0.56/low を全て確認。execute 経由の bonus trust 上昇差を4パターン検証: emotional/delinquent +9.28/🌟, normal/normal +6.19/無印, bold/cool +3.46/💤, normal/ojousama +4.33/💤 (同じ書類で 3倍差)。trainer 遅延型4週シミュレーションで finalMult が perWeekDelta に正確に乗算され trustDelta が 8.04×mult で累積することを確認。camp (team書類) 3選手に別々の mult (1.1/1.2/0.72) を適用、返り値に reactionTone/finalMult 非含有を確認。結果モーダル DOM で high/low マーカーの class と text 表示、team書類で非表示を確認。変更: data.js(DECISION_PERSONALITY_MULT/DECISION_ARCHETYPE_MULT)+management.js(calcUncertainty/classifyTone/queueTrust シグネチャ拡張/execute 各書類分岐 6箇所/execute 返り値 reactionTone/trainer 予告文言3段階)+ui-common.js(showDecisionResultModal トーンマーカー HTML)+app.js(executeDecision/encourageFighter displayData)+index.html(.decision-result-tone CSS)。仕様: specs/shachoshitsu-spec-v1.0.md §6 (設計意図そのまま採用、matrix 数値は spec §6.3/§6.4 の叩き台を継承、実機プレイで尖りすぎたら後で調整)。指示書: plans/shachoshitsu-phase8-task.md。

前回: **社長室 Phase 7 — trainer/camp の信頼度遅延発現 + 可視化（2026-04-15）。** spec v1.0 の「全書類3週遅延」方針を narrative 不整合により修正(Keisuke 指摘: ボーナスや休暇は金や休みをもらったその瞬間が嬉しさのピーク、遅延発現にすると感情の時間軸が壊れる)。Phase 7 で遅延発現するのは成長バフが並走する2書類のみ — `trainer` (4週、`_trainerBuff.weeksLeft` と完全同期) / `camp` (2週、全員同期)。残り5書類(bonus/refresh_leave/party/encourage/media)は即時維持、既存動作を一切変更せず。「即時万能感の排除」は Phase 8 の不確実性(性格×アーキタイプ ±50%)に全面委譲。実装: `fighter.pendingTrustDeltas: [{source, totalDelta, perWeekDelta, weeksRemaining, startedWeek, finalMult}]` を全選手マイグレーション + `makeChar`/`makeAIFighter` で初期化。`Engine.shachoshitsu.execute` 内に `queueTrust` ローカルヘルパー新設(`applyTrust` はそのまま残し即時型書類が使い続ける)、trainer/camp 分岐だけ `queueTrust` 経由に変更。`Engine.shachoshitsu.applyPendingTrustDeltas(roster)` 新設、`processManage` 内 `tickTrainerBuffs` 直後で呼び出し(同タイミング実行でバフと発現が同期)。processManage 返り値に `_pendingTrustReveals`、`tickWeek` で state 転送、`processWeek()` で `perWeekDelta` 降順で1件だけピックしてミニ通知トースト表示(「🤝 専属トレーナーとの練習で○○の気持ちが前向きになってきた」、camp 全員分の reveal 過剰を防ぐため上限1件)。結果モーダル: trainer/camp の changes を「今後◯週にわたって、じわじわと育っていく」文言に書換(個人書類の信頼度 changes 構築で `docId === 'trainer'` 分岐を優先、bonus/refresh_leave/encourage/media は従来の `Engine.trust.describeChange` 質的表現を維持)。`showFighterPopup` ステータスバッジ群に `_trainerBuff` 表示追加 — 「🏋️ 専属トレーナー 残り4週 — 信頼もじわじわ育つ」(source='camp' なら「合宿」)、数値は出さず残り週数のみ、ゴールド系 `#d4a843`。`validateGameState` に `pendingTrustDeltas` 型チェック追加(配列型 + entry の `perWeekDelta`/`weeksRemaining` 検証 + 無効エントリ自動削除)。マイグレーション: 既存セーブに `pendingTrustDeltas: []` を全選手付与、`_costumeDebut` 削除直後のブロックに配置。Phase 6 (閾値最終確認) は Phase 7 に統合吸収 — Phase 4 時点の `trust_unstable<60` / `morale_low<60` は auto-sim 100シーズンで違反ゼロなので現状維持確定。検証: auto-sim 100シーズン(seed=42) ALL CLEAR(違反0/エラー0/ゲームオーバー0/5300週)。実機: trainer 実行 → trust 53→53 即時変化なし + `_trainerBuff.weeksLeft=4` + `pendingTrustDeltas[0].weeksRemaining=4` 同期、1週進行 → trust 53→55.57 (perWeekDelta 通り) + buffLeft 4→3 + ptdRem 4→3、ポップアップバッジ「残り3週」に更新、ミニ通知トースト表示確認。camp 実行で全員に pending 積み + weeksRemaining=2 全員同期も確認済。bonus/refresh_leave は従来通り即時で上がる(trust 40→46.19)。変更: management.js(makeChar/makeAIFighter 初期化 / Engine.shachoshitsu.execute queueTrust 分岐 / applyPendingTrustDeltas 新設 / processManage 呼び出し追加 / tickWeek 転送 / validateGameState 型チェック)+app.js(マイグレーション / processWeek 週次ミニ通知)+ui-common.js(showFighterPopup 成長バフバッジ)。仕様: specs/shachoshitsu-spec-v1.0.md §4, §5 (設計変更あり、v1.1 で逆輸入予定)。指示書: plans/shachoshitsu-phase7-task.md。

前回: **社長室 Phase 5 — 旧ケアシステム廃止（2026-04-15）。** 旧ケアモーダル(💝 ケア)を完全に廃止し、社長室 🏛️ が唯一の決裁入口になった。今週画面の「💝 ケア」ボタン削除 / `showCareActionModal`(~360行)削除 / `App.openCareModal` + `App.executeCareAction` 削除 / `Engine.careActions` 丸ごと削除。`Engine.careActions` のヘルパー関数群(`tickTrainerBuffs` / `getTrainerMult` / `resetSeasonalCounters` / `isInSlump` / `getBonusRepeatCount`)は `Engine.shachoshitsu` に移植、`processManage` / `tickWeek` / シーズン末処理の呼び出し元を全置換。`CARE_ACTIONS` データ定義と `module.exports` も削除。`costume` 関連を完全削除(`CARE_REACTION_DIALOGUES.costume` 初期化ブロック+全 `.push(...)` 行+`_costumeDebut` フラグ消費ロジック)。`special_treatment` は怪我発生ポップアップに統合: `showEventPopup` に二次アクションボタン(`action: { label, disabled, disabledHint, onClick }`)を生やし、`App.executeSpecialTreatment` + `Engine.shachoshitsu.executeSpecialTreatment` を新設(決裁枠消費なし、資金200万のみ)。`hireCoach` にコーチ画面の決裁枠チェック追加(決裁枠-2消費、雇用ボタンに ⚡2 表示)。選手フィールド `_careWeekUsed` → `_decisionWeekUsed` を統合するマイグレーション追加。旧 `G.careStock` / `careStockMax` / `careStockLastRecovery` / `_teamCareWeekUsed` を削除するマイグレーション追加。`createInitialState` の careStock 初期化と `tickWeek` の回復ロジック削除。`validateGameState` に旧フィールド検出の安全弁追加。ケア専用 CSS を削除。ただし `.care-overlay` / `.care-box` / `.care-title` / `.care-reaction*` / `.care-result-header` / `.care-result-action-*` / `.care-result-portrait*` / `.care-result-name` は選択型イベント / 対抗戦 / 挑戦状 / 契約交渉 / 練習アクシデント等 10+箇所の他モーダルで再利用中のため残存(spec §9.3 の「全削除」指示は実コード調査で否定)。auto-sim 100シーズン(seed=42) ALL CLEAR(違反0/エラー0/ゲームオーバー0/5300週)。変更: management.js(Engine.shachoshitsu拡張/Engine.careActions削除/createInitialState/tickWeek/validateGameState)+app.js(マイグレーション/hireCoach/executeSpecialTreatment/怪我ポップアップ改修/openCareModal+executeCareAction削除)+ui-common.js(showCareActionModal削除/showEventPopup 二次アクション対応)+ui-render.js(ケアボタン削除/hireCoach ボタン⚡2表示)+data.js(CARE_ACTIONS削除/costume dialogues削除/module.exports)+index.html(ケア専用CSS削除/event-popup-action CSS追加)。仕様: specs/shachoshitsu-spec-v1.0.md §9 §11(Phase 5)。指示書: plans/shachoshitsu-phase5-task.md。

前回: **社長室 Phase 4 — 決裁実行ロジック（2026-04-15）。** 社長室の机に並ぶ7書類(bonus/encourage/refresh_leave/party/trainer/camp/media)をクリックして実際に決裁を実行できるようにした。`Engine.shachoshitsu` に `calcCost` / `execute` / `getReactionText` を追加し既存 `Engine.careActions.execute` から 7 書類分のロジックを移植(costume/special_treatment/hireCoach は Phase 5 で統合/削除)。`App.executeDecision` / `App.onShachoshitsuDocClick` エントリポイント追加。対象選手選択モーダル(個人書類: 書類別に候補絞込)+団体確認モーダル(party/camp: 対象人数・コスト内訳・残金・効果サマリ表示)。朱印演出(.is-approving → stamp-slam 0.6s → is-approved 再レンダ)+印鑑倒れアニメ(.hanko.falling → hanko-fall 0.5s)+決裁済み書類は document-stamped.webp 背景差し替え+onclick除去。週進行時に `_decisionDoneThisWeek` を tickWeek でリセット(`_decisionWeekUsed` は cooldown 管理のため維持)。validateGameState に型チェック追加。Phase 3 セーブからのマイグレーション(`_decisionWeekUsed: {}` / `_decisionDoneThisWeek: []` 空初期化)。既存ケアモーダルは Phase 5 まで並行稼働。auto-sim 100 シーズン ALL CLEAR、ブラウザ実機で bonus/camp/trainer 実行 + cooldown + DP不足トースト + 週進行リセットを確認。変更: management.js(Engine.shachoshitsu拡張/tickWeek/validateGameState/createInitialState)+app.js(executeDecision/onShachoshitsuDocClick/マイグレーション)+ui-common.js(showDecisionTargetModal/showDecisionConfirmModal/showDecisionResultToast)+ui-render.js(renderShachoshitsu書類クリックハンドラ+is-approved判定)+index.html(Phase4 CSS+決裁モーダルDOM)。仕様: specs/shachoshitsu-spec-v1.0.md §4 §8 §11(Phase 4)。指示書: plans/shachoshitsu-phase4-task.md。

前回: **orgPop リバランス v1.1（2026-04-14）。** 「70の壁」（orgPop が S20-S30 でも 64 付近に張り付く）を完全解消。§2 逓減カーブ見直し: getDiminishingMultiplier を 70-84:0.12→0.22、85-94 の新 tier 0.15、95+:0.06 に変更。calcAnnualDecay を 79-:3（旧4）、80-89:3（旧7、specの5→さらに緩和）、90-94 の新 tier 7、95+:10（旧15）に変更。§3 ドーム会場リサイズ: cap 30000→22500、cost 12000→11000（理論天井に合わせた満員設計）。§4 殿堂 domeMain ポイント新設: calcHofPoints に domeMain イベント対応追加（メイン勝利+3/敗北+1）、buildCareerHighlights にも case 追加。§5 ドーム年 1 回制限: domeShowsThisSeason フィールド追加（createInitialState + season-reset）、setShowVenue に guard (≥1 で却下)、finalizeShow でカウントアップ + domeMain キャリア記録プッシュ。§6 収支→経営リネーム: ナビボタン「💰 収支」→「🏢 経営」、パネルタイトル変更、収支サブタブに「📣 団体人気」タブ追加 + _orgPopChart 関数新設（SVG折れ線グラフ、Y固定0-100、ドーム解禁ライン90、シーズンラベル、pop 帯別カラー）。§7 シーズン開幕通知: _prevSeasonEndOrgPop 保存 + _pendingSeasonStartNotif transient フィールド → advanceFromWeekSummary でトースト表示（decay > 0 のみ）。検証: auto-sim 5 シード×20 シーズン ALL CLEAR。旧 S30=64.2 → 新 S30=79-86（seed 依存）。変更: management.js(getDiminishingMultiplier/calcAnnualDecay/calcHofPoints/buildCareerHighlights/createInitialState/processSeasonEnd)、data.js(VENUES[9])、app.js(finalizeShow/setShowVenue/advanceFromWeekSummary)、ui-render.js(renderShowPrep/renderFinance/_orgPopChart)、index.html(ナビラベル)。

前回: **選手循環システム修正 + FA膨張解消（2026-04-10）。** 初期dormantPool設計変更: 78人全員age17→20人（age17-20分散）+58人retiredIdsスタート（retiredSeasons -4〜+5ばらけ、年6人ずつ復帰可能に）。FA膨張解消: Engine.util.canAddToFA/redirectToDormantPoolヘルパー新設、全6箇所のFA流入ルート（AI契約退団/プレイヤー契約退団/突然離脱/レンタル帰還/解雇/オーバーフロー解雇）にROSTER_CFG.faキャップ追加、超過分はdormantPoolへ退避。scoutEventFinish 30% FA流入を廃止（100% dormantPool返却）。初期FA年齢を19-20に固定（ドラフト17-18との棲み分け）。pool-stats計測ツール修正（auto-sim互換ループ）。検証: pool-stats 2シード×20シーズンで安定（Pool=20-24/FA=0-2/age17-18=10-13）、auto-sim 2シード×20シーズン ALL CLEAR。変更: management.js(initRandomRoster/createInitialState/canAddToFA/redirectToDormantPool/processAIContracts/resolveNegotiation/executeShow/processWeeklyRental)、app.js(releaseFighter/_releaseFighterForOverflow/scoutEventFinish)、test/pool-stats.js。

前回: **ドラフト価値向上リバランス（2026-04-10）。** 施策0: ドラフト候補数縮小(14-18→6-8, maxPicks 4→3)、ミッドシーズン候補(8-10→4-6)、FA枠縮小(22→10人)、FA表示枠6→10(全員表示)。施策1: 年齢ベースでドラフト/FA棲み分け（ドラフト=age17-18、FA=age19-20のドラフト漏れ世代）、age振り直し廃止(dormantPool実年齢使用)、FA選手に待機微成長(年3%×待機年数)。施策2: AI団体がシーズン中にFAを取りに来る(aiMidseasonFAAcquire新設、四半期判定、S:35%/A:25%/B:15%、年間最大1人/団体、OVR差閾値制)。施策3: ドラフト指名ボーナス(trust +5〜+15ラウンド連動、bond +1〜+5)。変更: data.js(SCOUT_EVENT_CFG/ROSTER_CFG/AI_MIDSEASON_FA_CFG/DRAFT_SIGNING_BONUS)、management.js(generateScoutReport年齢フィルタ/FAローテーション年齢フィルタ+微成長/getVisibleFAIds/aiMidseasonFAAcquire/tickWeekフック/_midseasonFAGrabsリセット)、ui-common.js(draftNextCandidate trust+bond付与)。auto-sim 100シーズン ALL CLEAR。

前回: **引き抜きtrust連動+予兆可視化（2026-04-09）。** specs/poach-trust-spec-v1.0.md に基づきA→B-2→B-1の順で実装。A-1: processTransferWindowにtrust補正追加（trust75+→×0.30/trust30-→×2.00、忠誠心と乗算）。A-2: resolvePoachの防衛率をtrust連動関数化（trust70+→95%/trust30-→35%）。B-2: 移籍ウィンドウ前週（11/23/35/47週）にリスク選手の予兆通知モーダル（trust帯別mild/moderate/seriousテキスト、最大2名、忠誠心持ちは対象外）。B-1: 週次ロッカールーム空気ログ（2週に1度、非興行週、morale/trust状態でgood/warning/dangerフレーバーをgameLog出力）。変更: data.js(TRANSFER_CONFIG拡張+PRE_WINDOW_TEXTS+LOCKER_AIR_TEXTS)、management.js(processTransferWindow/resolvePoach/processWeekPhase/processWeek)、app.js(_pendingPreWindowWarning回収)、ui-common.js(N_pre_window警告スタイル)。auto-sim 200シーズン ALL CLEAR。

前回: **Session F nested セリフ拡張（2026-04-12）。** dialogue-expansion-worksheet.xlsx 全394行を6種のnested sourceに反映。NOTIF_DIALOGUES(36行)+CARE_REACTION_DIALOGUES(66行)+CHOICE_EVENT_DIALOGUES(61行)+LARGE_EVENT_DIALOGUES(60行)+GLIMPSE_B_LINES(84行, dialogue+scene)+SNAPSHOT_TEXTS(87行, voice+scene deduped)。polite/cool/seductive/ojousama/composed等のarchetype別セリフを各personality×event_idスロットに追加。GLIMPSE_Bに_scene並列構造を新設。auto-sim 100シーズン(10シード×10) ALL CLEAR。

前回: **新キャラ29名追加+既存キャラデータ更新（2026-04-09）。** Notion DBから新キャラ29名（ID 100〜128）をALL_CHARS/CHAR_PROFILES/PORTRAITに追加。土岐山乃ノ佳, 沢登鮎, 大山たかみ, 財津琴美, 吉野萌子, 黒岩千晶, 赤沼紗稀, 松岡綾乃, 結城玲奈, 戸塚ゆかり, 若林美佐子, 相模あずみ, 朝比奈ひかり, 綿貫すず, 木村レイカ, 豊田いすず, リナ・モーガン, クラッシャー毒島, 割田久美, 岩小路志摩子, 蔵前静, 山本理香, 宮沢ひかる, 柳沼英子, 清川怜, 藤代絵麻, 西園百合香, 榊原菜摘, 巳沼紗霧。既存キャラ12名のデータ更新: スタイル変更(高津小春→Allround, 生駒エリカ→Brawler)、性格変更(大河内紗代子→bold, 芝彩音→earnest)、特性変更8名。登録キャラ総数: 98→127名。auto-sim 100シーズン ALL CLEAR。

前回: **ドラフト画面リニューアル+PPVポスター修正（2026-04-07）。** ドラフトフローの「スカウト」呼称を「ドラフト」に統一。ドラフト開幕前画面を号外紙面型(A1)に刷新。ドラフト完了画面をトレーディングカード型(B1)に新設（超逸材ヒーロー表示/逸材大カード/標準カードのティア別サイズ差別化）。獲得時リアクション復活(getSigningLine+showEventPopup)。ドラフトまとめ記事にポートレート付きチップ表示。バグ修正: _draftInterestsオリジナル破壊によるAI団体不参加問題+バックグラウンド処理のロスター枠温存(idealRosterキャップ)。PPVポスター画面: カード背景分離(ppvmc-card-bg)+fighter絶対配置+z-index重なり演出復元+center暗影修正。auto-sim 2シード×30シーズン ALL CLEAR。

前回: **dormantPool枯渇バグ修正（2026-04-06）。** 長期プレイでスカウト候補が0名になる致命的バグを修正。ドラフト交渉システム実装+修正完了済み。

**実装内容:**
- src/draft-negotiation.js新規作成(~780行): セリエンジン(assignInterest/runDropCheck/stepRound/runNegotiation/runFullDraft/empressReinforce)
- 旧スカウトシステム(aiScout/aiSeasonReinforce/resolveCompetition)を廃止、共通プール+セリ参加に統合
- 候補プール拡張(14-18名/8-10名)、事前選択制(★星トグル最大4名+5分岐ロジック)
- 候補一覧UI(週刊グラップル「ドラフト速報」新聞風)、交渉画面UI(会場バナー+入札カード4枚+ヒートゲージ+ナレーション30+パターン)
- BGM/SFX統合(tension BGM+7トリガーSE)、EMPRESS安全網、業界紙まとめ記事

**修正内容(ユーザー実機FB対応):**
- 観戦モード廃止→降りる即決着の2クリックフロー
- 推定契約金をassessedValue統一(getSigningCostのorgPop割引除去)
- 団体名をRIVAL_ORGS.nameから動的取得(ハードコード廃止)、ナレーション{ORG}プレースホルダ方式
- エンブレム画像パス修正(../image/org/)、外枠ダークテーマ切替
- ★ボタン視認性(draft-star-btn CSS統一+行/カードハイライト)、獲得上限日本語化
- BGM切替: showScreen経由のplayForStateがtensionを毎回再生し直す問題→_showScreenNoBgm導入で交渉中はBGM不干渉
- SFX: 入札音→Audio.play('select')、ファンファーレ→v5、競り負け→Audio.play('defeat')
- 粘り度ゲージ: ラベルのbackground漏れ修正(太い謎バー根絶)、プレイヤーカードのゲージ廃止
- 並び順をassessedValue純粋順位ベースに(ティア区分廃止)
- AI全同時離脱→流札バグ修正(最後の1社は降りないガード)
- AI団体ロスター上限制御: _getRosterFillMul厳格化(理想+2以上→不参加強制)+落札時idealRoster+2チェック+ドラフト中獲得数リアルタイム追跡

引き継ぎ: docs/draft-notes/。仕様: specs/draft-negotiation-spec-v1.0.md。auto-sim 100シーズンALL CLEAR。

前回: **dormantPool FIFOキュー化 — 同じ選手の即リサイクル防止（2026-04-05）。** dormantPoolの選抜が全箇所ランダムシャッフルだったため、リサイクルされた選手が即座に再登場し「同じ選手ばかり回る」問題があった。(1)Engine.util.drawFromFrontヘルパー追加: キュー先頭ウィンドウ(count×3, min12)からランダム抽出。古い選手優先+バリエーション確保。(2)選抜4箇所FIFO化: generateScoutReport/aiScout/aiSeasonReinforce(先頭15件内最強)/FA市場ローテ。(3)フィルタバグ修正(L9286/L9546): {id,age}オブジェクトとstring IDの.includes()比較が常にfalseで使用済み選手がプールから除去されなかった。(4)エントリ形式統一: 全てを{id,age}オブジェクトに統一、typeof分岐ガード12箇所除去。(5)セーブマイグレーション: レガシーstring ID→{id,age:17}変換。リサイクル投入は全て末尾追加(変更不要)、年次加齢は配列位置維持(変更不要)。変更: management.js(drawFromFront+選抜4箇所+フィルタ2箇所+typeof除去)+app.js(マイグレーション)。auto-sim 100シーズン×2シード ALL CLEAR。

前回: **AI引退選手の即リサイクル修正（2026-04-04）。** AI団体の引退選手(怪我引退・シーズン末引退・契約退団引退)のIDがretiredIds/retiredSeasonsに登録されず、dormantPool補充時にクールダウンなしで即復活していた問題を修正。processAIWeek内の怪我引退時に_weekRetiredIdsへ一時記録→tickWeekで回収、processSeasonEndで全AI引退者IDを集約して返却→offWeek1でstateに反映。プレイヤー側と同じ5シーズンクールダウンがAI引退者にも適用されるようになった。変更: management.js(6箇所、29行追加)。auto-sim 100シーズン×2シード ALL CLEAR。

前回: **対抗戦発生確率改善（2026-04-02）。** ランキング上位プレイヤーで対抗戦が極端に少ない問題を修正。(1)チェック窓追加: checkRivalryWarの判定をWeek24/36の2回→Week12/24/36の3回に拡大（Q1末追加）。(2)基本確率微増: warChancePerSeason 0.50→0.55。(3)干ばつ防止: 前シーズン対抗戦なし時に各チェック+15%ボーナス（lastWarSeasonフィールド新設、蓄積なし）。(4)B3挑戦状競合緩和: B4(メディア)weight 3→2でB3が高orgPopでも50%選出に。P(0回/シーズン)が25%→9.1%（干ばつ後2.7%）に改善。変更: data.js(EVENT_CONFIG)/management.js(checkRivalryWar/advanceWeek/初期状態/B4 weight)。auto-sim 100シーズンALL CLEAR。

前回: **ロッカールーム士気リデザイン v3.0（2026-04-02）。** morale=100張り付き問題を根本解決。(1)平均回帰: baseline=55への12%/週回帰を導入、100に留まれない設計に。(2)ムードメーカー条件付き化: 無条件+2.53→+1.5/週(morale70超で半減+0.75)。(3)人望条件付き化: 無条件+1.84→trust<50の選手数に比例(0.3×人数, max+1.2)。(4)興行双方向化: MQ<45で-1.5/MQ<55で-0.5追加。(5)ロスターサイズ税: 8人超-0.15/人/週。(6)負傷者負荷: 3人以上-0.5, 5人以上追加-0.5。(7)敵対ペア強化: 0.5→0.7/組, cap2→3。(8)morale→condition回復速度: 75+で×1.15/40未満で×0.80。(9)morale→成長ゼロ化: 40未満15%/40-50 5%。(10)morale→trust侵食: 45未満で追加減衰(45-morale)/100。(11)morale→スランプ/モチベ喪失回復: 70+で×1.3/35未満で×0.5。均衡帯38-76。変更: management.js/relationships.js/data.js。auto-sim 5シード×100シーズン ALL CLEAR。

前回: **プロモシステム再設計 v2.0（2026-03-31）。** プロモ活動による人気成長を全面見直し。(1)PROMO_POP_CAP 70→100（実質撤廃、diminishingで自然鈍化）。(2)getDiminishingMultiplierカーブ緩和（pop20-34:0.60→0.75/pop35-49:0.35→0.55/pop50-64:0.18→0.35/pop65-79:0.13→0.22/pop90+:0.05新追加）。(3)balanceスケジュールのpopBenefit条件削除（stackBenefitのみで判定）。(4)プロモrawGainをMNT連動に変更（mnRawGain=1.0+(mn-40)/40）+スター製造コーチ(getPopGainMult)をプロモにも適用。変更: data.js/management.js。auto-sim 100シーズン×2シード ALL CLEAR。

前回: **数値カラースケール再設計（2026-03-30）。** 全パラメーター統一6段階カラースケール導入。_scale6ヘルパー+8パラメーター別ラッパー関数をui-common.jsに追加。S帯(金+glow)→A帯(金)→B帯(琥珀)→C帯(くすんだ暖色)→D帯(スチールブルー)→E帯(冷灰)の色温度スケール。適用: MQ(6箇所)/OVR(3箇所)/Condition(2箇所)/Bond(2箇所)/Rivalry(1箇所)/Popularity(8箇所新規)/orgPop(4箇所新規)。Rivalryのみ赤系専用パレット。新聞パネル(ライト背景)・Trust(隠しパラメータ)・HPバー・スタイルバッジ等は除外。変更: ui-common.js/ui-render.js。

前回: **興行準備画面 v7 デザイン全面実装（2026-03-29）。** showprep-v7.htmlモックアップ準拠で興行準備画面を全面書き換え。(1)集客予測パネル: ムードアイコン+テキスト+5ドットゲージ+メトリクス行(Heat/予想MQ/タイトル/会場席数/会場費)。(2)ファンの声: コンパクト中央揃えパネル。(3)マッチカード: 7列グリッド(80px params | 1fr fighter | auto portrait | 110px center | auto portrait | 1fr fighter | 80px params)。ティア別スタイル(main-event金ボーダー+上ライン/mid-card/undercard薄め/empty-slot破線)。(4)ピッカーUI: `<select>`廃止→選手名クリックで下展開パネル、配置済み選手ホバーでスワップハイライト、クリックでスワップ自動処理。(5)中央タグ: 因縁/マンネリ/新鮮/タイトル/ファン期待/ラストマッチをsp-match-tagクラスで統一表示。変更: src/index.html(sp-*CSS追加)、src/ui-render.js(_spActivePicker状態+ピッカー関数群+renderShowPrep全面書換)。

前回: **集客v2 Phase 4完了 + チューニング + UI改修（2026-03-29）。** 新集客モデル本接続+バランスチューニング+興行準備画面UI改修。(A)Phase4本切り替え: (1)集客計算を旧calcAttendance（orgPopベース）→calcAttendanceV2（reach×draw×heat×揺らぎ→softCap）に差し替え、カード内容（drawPower/matchAppeal）が集客に直結。(2)heat更新をavgMQ閾値→★ベース（heatDeltaByStars）に変更。(3)orgPop変動をavgMQ+VENUE_MQ_THRESHOLD→★ベース（orgPopDeltaByStars）に変更、序盤保護（orgPop<15ペナルティなし、<30半減+成長ブースト）追加。(4)メディア放映収入をavgMQ×showPerMQ→baseBroadcast×mediaMult[stars]に変更。(5)showRating（★1-5）をengine側calcShowRating（mqScore+occScore+bonusScore）で統一算出。(6)AI団体にも★ベースorgPop変動追加。(7)PPV/対抗戦のheat更新も★ベースに統一。影響範囲: engine.js/app.js/ui-render.js全面。(B)チューニング: 会場階層別★評価基準(小規模-18/中規模-8/大規模±0/ドーム+3)、★3微正デルタ(+0.3)、負方向逓減(orgPop40+で×0.7)、reachカーブ大幅引き上げ(旧集客同等)、expectedDrawCurve再キャリブレーション、drawPowerをmatchAppealに統合、promoStackをdrawPowerに反映。(C)UI改修: 集客予測6段階化、カード評価ツールチップ(drawPowerBreakdown/matchAppealBreakdown)、興行準備画面レイアウト全面改修(集客予測上部移動/左右対称レイアウト/興行順番号)。(D)次ステップ: 興行準備画面デザインのモックアップ詰め(docs/showprep-mockup.html)→本体反映。auto-sim 3シード×20シーズン ALL CLEAR。

前回: **ステ特化コーチのcap到達済みステ空振りバグ修正（2026-03-29）。** pickGrowthStatがtrainCap到達済みステのウェイトを0にせず、ステ特化コーチの×1.40ウェイトによりcap到達済みステが高確率で選ばれてcalcGrowthが0を返し、他ステの成長機会が最大35%失われていたバグを修正。ステ選択時にtrainCap（限界突破・弱点克服ボーナス含む）をチェックしcap到達済みステのウェイトを0にして再分配。auto-sim 100シーズン×2シードALL CLEAR。

前回: **因縁放置ペナルティ修正（2026-03-27）。** orgPopが中盤以降0に向かって不可逆的に下落するバグを修正。原因: getNeglectedRivalryPenaltyが①暦週ベース(3週)で判定されるため非興行週にもペナルティ発生、②recordRivalryでlastAbsWeekが更新されず通常対戦でペナルティがリセットされない、③全因縁ペア対象で上限-1.0/週と過大。修正: ①興行週のみ判定+興行回数ベース(3興行未対戦)に変更、②recordRivalryにlastAbsWeek/lastShowNumber更新追加、③上位2ペア限定+ペナ-0.15/ペア+上限-0.3に軽減。auto-sim 20シーズン×5シード ALL CLEAR、orgPop 40-55帯で安定推移。

前回: **stat小数点バグ根本修正+画像フォールバック（2026-03-26）。** 練習成長3箇所(追い込み/通常練習/AI週次)でtrainGrowthがMath.round(…*10)/10の小数値のままstatに加算されfloat蓄積していたバグを修正。statに加算する直前にMath.round()を適用し整数を保証。validateGameStateに非整数検出+自動修正チェック追加。既存セーブデータ向けマイグレーション(_migrated_stat_round_v1)で全キャラstat一括丸め。画像フォールバック: _imgOrInitialヘルパー新設(onerror時にスタイル色イニシャル表示)、PPVカード対戦画像/対抗戦勝利演出/JT結果ポップアップ/選手詳細ポートレートの4箇所に適用。auto-sim 100シーズンALL CLEAR。

前回: **年間表彰式全面リファクタ（2026-03-26）。** モックアップ(awards-mockup-final-v2.html)準拠で表彰式UIを全面書き換え。TASK-1:メディア功労賞を全団体対象に拡張(AI団体processAIWeek内で興行出場選手のmediaRevSeasonトラッキング追加+PPV/JT/対抗戦でAI選手のmediaRevSeason加算+processSeasonEndに3フィールドリセット追加+selectMediaAward候補を全団体に拡張+返り値にorgName追加)。TASK-2:CSS全面置換(ステージ背景+スポットライト3灯+パーティクル+ファンファーレオーバーレイ+セレモニーヘッダー+スライド制御+award-card+各賞固有レイアウト+ナビゲーション+コーチFG+紙吹雪、枠画像フレームa-g完全廃止)+Google Fonts追加(Noto Serif JP)+HTML構造書換(#stage/#aw-particles/#aw-fanfare-overlay/#aw-ceremony/#hof-coach-fg)。TASK-3:全7スライドビルダー関数をモックアップ準拠で書換(メディア功労賞→新人王→ベストマッチ→タイトル王者→MVP→殿堂→一覧、該当なしスキップ)。TASK-4:スライド制御(goToSlide/nextSlide+ドットインジケータ動的生成+ファンファーレ冒頭3秒演出)+タイトル王者順番登場(3位→2位→1位各700ms)+MVPスタッツバーアニメーション(data-width→style.width遅延適用)+殿堂紙吹雪(80個5色)+SE4種(Web Audio: playChime/playMvpFanfare/playHofChime/playFanfare)+パーティクル30個動的生成。TASK-5:殿堂入りコーチFG演出(自団体殿堂入り時のみ+coachAssign逆引きで担当コーチ特定+1.4秒後スライドイン+AWARD_LINES.hofCoach5パターン+他スライド移動で非表示)。auto-sim 200シーズン(2 seeds)ALL CLEAR。

前回: **バグ修正追補（2026-03-26）。** ④_pendingPromoIncomes/_pendingPromoGoods毎週重複計上: _pendingMediaIncomesと同様にtickWeek内processSettlement後にdelete。⑤メディア功労賞の金額表示が/10000で極小値: 値はすでに万単位のため除算を削除しtoLocaleString()整形に変更。⑥fanExpectation参照は前回修正で全箇所解消済み(grep確認)。auto-sim 100シーズンALL CLEAR（funds正常化: プロモ重複解消で約40%減）。

前回: **バグ修正3件（2026-03-26）。** ①メディア功労賞が選出されない: applySeasonEndがmediaRevSeason等を先にリセットしていたため、awards.generate()をapplySeasonEndの前に移動。②_pendingMediaIncomes毎週重複計上: processSettlement後にtickWeek内でdelete実行し1回限りの消費に。③新聞プレビューのファン期待カードが空: buildPreview/app.jsのstate.fanExpectation参照をEngine.fanExpect.generate()動的生成に置換。auto-sim 200シーズンALL CLEAR。

前回: **受賞歴キャリア記録追加（2026-03-26）。** 年間表彰式の受賞結果を個人のcareerRecord.historyに永続記録。対象4賞:新人王(awardRookie)/MVP(awardMVP)/メディア功労賞(awardMedia)/ベストマッチ賞(awardBestMatch)。_checkAndShowAwardsでEngine.career.addEvent呼び出し(プレイヤー団体受賞者のみ)。milestone.getに4case追加→キャリア年表に受賞歴表示。_typeStyleに4スタイル追加(アイコン+カラー)。buildCareerHighlightsに4case追加→殿堂入り時のハイライトにも反映。auto-sim 100シーズンALL CLEAR。

前回: **メディア功労賞実装（2026-03-26）。** 年間表彰式にメディア功労賞を追加。選考基準:mediaRevSeason+talentRevSeasonの合計最大のプレイヤー団体選手。TASK-1:選手フィールド追加(mediaRevSeason/talentRevSeason/talentCountSeason)+resetSeasonalCountersでリセット。TASK-2:収入発生時の個人別累計加算(processSettlement内プロモ連動+タレント活動バフ→Map蓄積+roster反映、app.js PPV出演料/JT出演料/対抗戦JT出演料→s.roster/G.roster反映、B4全6activityTypeでtalentCountSeason+1)。TASK-3:Engine.awards.selectMediaAward新設(score>0の候補をソート、タイブレーカー=talentCountSeason)。TASK-4:表彰式UIにMVP直後スライド追加(_buildMediaAward:顔写真+名前+年間メディア貢献額+出演料/タレント活動内訳+活動回数)+AWARD_LINES mediaAwardセリフ(5personality×archetype)。auto-sim 100シーズンALL CLEAR。

前回: **B4タレント活動イベント拡充（2026-03-26）。** 既存B4メディア密着取材に6種の新タレント活動サブタイプ追加(CM出演/グラビア撮影/バラエティ出演/ブランドコラボ/ファッションショー/ファンイベント)。B4発生時7択均等抽選(null=既存spotlight,6種=新活動)。名前プール6配列。personality×activityType相性テーブル(得意1.5/普通1.0/苦手0.5)+archetype追加補正(+0.2)。効果:cm/variety→メディア週次収入(pop×0.6万×mult,1週),gravure/brand→グッズ週次収入(brand2週),fashion→即時人気+1~3,fan→即時trust+2~6。talentActivityBuffフィールド+processSettlementカウントダウン。LARGE_EVENT_TEXTS/DIALOGUES各6種追加。UI:モーダルにactivityType別ヘッダ/適性タグ/おすすめ推薦。AI団体B4同等処理。§13:チャンピオン怪我引退時trust85+30%で社長への一言ポップアップ。auto-sim 100シーズンALL CLEAR。

前回: **旧収入関数参照修正 hotfix（2026-03-26）。** 金銭バランス改善で削除されたgetSponsorIncome/getBroadcastIncomeがapp.js(Survival.estimateWeeklyNet)とui-render.js(収支画面推定コスト)で残参照→calcWeeklyGoodsRev/calcWeeklyMediaRevに置換。titleLoadGameでcreateInitialState(skipDraft=true)に修正しドラフト画面誤表示も解消。data.jsのexportから削除済みSPONSOR_TABLE/BROADCAST_TABLE除去。auto-sim 100シーズンALL CLEAR。

前回: **金銭バランス改善 TASK1-4（2026-03-26）。** 収入を興行収入(チケット)+ブランド収入(グッズ+メディア+プロモ)の2軸に再編。TASK-1:グッズ収入再設計(GOODS_PRICE廃止→GOODS_CONFIG/週次ベース全選手pop×0.2万+興行ブースト出場者pop×0.25万×占有率+プロモ連動pop×0.6万)。calcRosterPopScore廃止。TASK-2:メディア収入新設(SPONSOR_TABLE/BROADCAST_TABLE廃止→MEDIA_CONFIG/MEDIA_ORGPOP_CURVE区間線形補間/7発生源:①週次orgPop×1.5万②興行放映avgMQ×1.1万×VENUE_MEDIA_MULT×タイトル1.5×orgPopMult③PPV出演pop×0.9万×PPV_CARD_MULT④JT出演pop×0.9万⑤対抗戦MQ×1.1万×venueMult×1.5⑥プロモ連動pop×0.6万⑦ファン期待priority×30万×(MQ/70)×orgPopMult⑧ライバル抗争rivalry×MQ×0.016万×orgPopMult)。processSettlement全面改修。app.jsにPPV/JT/War/B3メディア収入フック(_pendingMediaIncomes)。TASK-3:月次報告UI再設計(収入タブをカテゴリ別グルーピング表示:興行収入/ブランド収入(グッズ▼折畳/メディア▼折畳/プロモ)/その他、内訳デフォルト折畳)。TASK-4:trustによる昇給要求減額(trust40→0%,trust100→8%線形補間)。auto-sim 100シーズンALL CLEAR。

前回: **MQ改修 Phase 1-3（2026-03-26）。** MQシステム全面リバランス。Phase 1: キックアウトバグ修正(fall/tkoでtotalKickouts++漏れ)、ペーシング「長すぎ」ペナルティ撤廃(短すぎのみ維持)、外部MQソース値変更(タイトル+10→+5/ファン期待+5→+2.5/宿怨+3→+2/ライバルカーブ圧縮)、外部MQソース6件削除(一方的因縁MQ/ケミストリー/ラストラン因縁相手/見返しモード/コスチュームデビュー/野心)。Phase 2: タイトルマッチ集客+0.15→+0.20、ファン期待カード集客+0.08/件新設、マンネリペナルティ固定値→ランダム幅(-8max→-5max)、マンネリウィンドウロスターサイズ連動(≤8:8興行/9-12:10興行/13+:12興行)。Phase 3: OV帯別MQ分布検証(全帯目標範囲内)、ドラマ減点パラメータ据置(初期値30が適正)。auto-sim 100シーズンALL CLEAR。

前回: **AI団体タイトルマッチ適正化（2026-03-26）。** 弱い選手が王者に居座る問題を修正。Fix1:AI団体に12週タイトルマッチクールダウン導入(createAITitles.lastTitleMatchWeek+processAIWeek判定)。Fix2:挑戦資格厳格化(Top5→Top3,OVR差8→5)。Fix3:AIマッチカード生成時にトップ挑戦者を王者の対戦相手に優先配置。Fix4:AI選手にrecordTitleWin/Loss/Defense経歴記録追加。診断結果:タイトル変動20.7→7.88回/シーズン(-62%),OVRギャップ>5割合46.2%→25.5%(-45%),奪取時ギャップ>5率50%→23%(-54%)。auto-sim 100シーズンALL CLEAR。

前回: **開発率ラベル化（2026-03-25）。** getPotentialPct数値%表示を5段階ファジーラベル（未開花/成長期/開花中/充実期/完成形）に置換。選手固定devLabelOffset(-7〜+7)でファジーバウンダリ実現。既存セーブはIDハッシュで互換。バー色はstage別5色。ロスターポップアップ(ui-common.js)+詳細画面育成タブ(ui-render.js)の2箇所を変更。UIのみ(engine.js変更はutil関数追加+新規選手生成時offset付与のみ)。

前回: **タスクキュー6件一括実装（2026-03-25）。** BUG-02:ティッカー虚偽情報修正(AI負傷→実データ/フレーバー無害化/スカウトFA連動/経済orgPop参照)。TASK-03:ファン希望カードにfreshnessチェック(MQ-5以上除外/MQ-3以上priority降格)。TASK-01:ジュニアトーナメントシード配置(_seedBracket新設/1位2位決勝まで非対戦/5-8位ランダム)。BUG-01:showSp堅牢化(タイマー管理+勝者決定時強制消去/予防的修正)。TASK-02:今週画面ソート&一括操作(thクリックソート/全選択チェック/プリセット一括適用/強化一括ON/OFF)。TASK-04:給料交渉から勝率撤去(record判定をOVR/人気/タイトル歴ベースに/セリフテンプレート刷新)。auto-sim 100シーズンALL CLEAR。

前回: **AI契約交渉パリティ（2026-03-25）。** processAIContracts新設。trust<40で退団判定（30-39:15%/15-29:40%/<15:70%）。特性補正（忠誠心×0.5/反骨心+20%/野心±15%）+tier補正。退団先: 50%他AI団体移籍/30%FA/20%引退(28歳+)。移籍先でO-02 bond変動+orgTimeline更新。最低5名ガード。新聞にaiContractDeparture(priority95、大量退団+30、エース級+20)。設計書: `docs/ai-parity-07-contract-negotiation.md`。auto-sim 50シーズンALL CLEAR。

前回: **AIメディア密着B4パリティ（2026-03-25）。** processAIWeeklyEventでB4許可。tier別対象選出（S:50%若手/30%エース/20%ベテラン等）。aiData.mediaSpotlight新設で3興行MQ追跡→avgMQ≥60:orgPop+3/popularity+5/trust+3、≥45:orgPop+1/popularity+2。E-04関係性効果（bond+1~2/rivalry+1~3）。新聞に密着開始(aiMediaStart:45)+結果記事(aiMediaSpotlight:65)。設計書: `docs/ai-parity-04-media-spotlight.md`。auto-sim 50シーズンALL CLEAR。

前回: **AI怪我引退パリティ（2026-03-25）。** processAIWeek内のAI怪我処理を拡張し重傷→retireType判定追加。wearInjury(wear+25>80)とcareerEnding(wear≥40で6.5%/他2.5%)の引退パス。引退時はロスター除去+departureTrustImpact+orgTimeline close+_midSeasonRetirees蓄積（シーズン末HOF判定用）。新聞にAI怪我引退記事(aiInjuryRetirement:150、エース級+20)。最低ロスター4名ガード。設計書: `docs/ai-parity-05-injury-retirement.md`。auto-sim 50シーズンALL CLEAR。

前回: **AI選手間対立B2パリティ（2026-03-25）。** processAIWeeklyEventのB2処理にニュース連携を完成。_pickAIChoiceにB2 tier別自動選択（S:60%話し合い/35%試合/5%放置、A:40%/45%/15%、B:20%/40%/40%）追加。processAIWeekで_newsTeamConflict蓄積+_b2Relationships関係値マージ。新聞にAI選手間対立記事追加（aiTeamConflict priority110、名勝負MQ70+で+15）。設計書: `docs/ai-parity-02-team-conflict.md`。auto-sim 50シーズンALL CLEAR。

前回: **AI練習怪我B1パリティ（2026-03-25）。** processAIWeeklyEventでB1（練習怪我）をAI団体にも許可。設計書: `docs/ai-parity-01-practice-injury.md`。

前回: **殿堂語り文（biography）リデザイン 実装完了（2026-03-30）。** 固定3文テンプレート→導入文×核心文×余韻文の3プール構成に全書き換え。導入文6分岐(無敗退場/長期政権/長キャリア/複数戴冠/短命/通常)、核心文19分岐(防衛数20+/グランドスラム/MVP3回/JT三連覇/PPV連覇等を優先度順で選出)、余韻文3系統(trust80+ファン信頼バリアント/メディア受賞/スタイル別3候補)。ID×シーズン数ハッシュで安定選出(ロード後も同文)。_buildHofEntryにコンテキスト8フィールド追加(mvpCount/bestMatchCount/hasRookie/mediaCount/maxSingleReign/retiredAsChamp/maxConsecutiveJT/maxConsecutivePPV)。変更:management.jsのみ。auto-sim 100シーズンALL CLEAR。

前回: **殿堂異名（エピテット）システム v2.0 実装完了（2026-03-30）。** 固定10パターン→実績タグ30種×重み付きランダム選出（全104テンプレート）に改修。buildEpithetContext(連覇/MVP/ベストマッチ等コンテキスト算出)、EPITHET_TAGS(rarity10-100の30タグ)、EPITHET_TEMPLATES(104異名)、resolvePlaceholders({n}防衛数等)。generateEpithet(rec,fighter,rng)に署名変更、最高rarityタグ群のみからプール構築+均等ランダム選出。_buildHofEntryにepithetRng(seed:0xEF17)+careerBestMQ/trustフィールド追加。仕様書: `docs/epithet-system-spec-v2.0.md`。auto-sim 100シーズンALL CLEAR。

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
| 04-15 | 社長室 Phase 3 (書類の動的生成と表示): data.js に DECISION_DOC_ORDER + DECISION_DOCS(8種類、hireCoach 含む)、management.js に Engine.shachoshitsu(getDoc/getDocOrder/checkActivation/getAvailableDocs) を追加。renderShachoshitsu を placeholder から動的描画に差し替え、grid-column/grid-row を各書類に直接付与して §7.2 「穴は空いたまま」を保証。CSS ツールチップ位置補正を nth-child → [data-col] に切替。4シナリオ検証 ALL PASS(初期3枚/orgPop25で+media/+スランプで+encourage+refresh_leave/+morale<50で全7枚)。auto-sim 20シーズン ALL CLEAR。保留事項: 慰労会の発動条件(morale<50限定)の再検討は Phase 4 実装後 |
| 04-12 | Tier3B大穴埋め370行: シャイ/丁寧+感情的/蠱惑の欠落セリフ一括反映。37ソース対象(GLIMPSE_B40/JUNIOR28/CHOICE25/CARE22/CONTRACT20/EMOTION20/GLIMPSE_A20/LARGE20/SNAPSHOT18/RETIREMENT16/NOTIF13他)。304スロット新規挿入+26既存スキップ(EMOTION_TEXTS20+SCOUT6)。data.js +996行。auto-sim 100シーズンALL CLEAR |
| 04-12 | Tier3A大穴埋め124行: RETIREMENT_CHAMPION_WORRY_LINES性格別→archetype別に設計変更(_ARCHETYPEに統合、management.jsルックアップ簡素化)。5ソース欠落補完: VOLUNTARY_STAY_LINES+15/RIVALRY_CONFRONTATION_LINES_90+18/PPV_SUMMIT_VICTORY_LINES+13/FAN_EXPECT_REACTIONS+32/SCOUT_SIGNING_LINES+39。auto-sim 100シーズンALL CLEAR |
| 04-12 | バトル系セリフ穴埋め91行: DAMAGE_VOICE_LINESにcomposed追加(battle-engine.html)。CUTIN_LINES atk/def/climaxにshy性格×7archetype追加(2Dネスト、既存ルックアップ互換)。RIVALRY_MATCH_REACTION 69行追加(winnerLines/loserLines欠落組合せ+2本目バリエーション)。auto-sim 100シーズンALL CLEAR |
| 04-12 | Session F nested セリフ拡張+TIER2穴埋め: worksheet.xlsx 394行→6種nested source反映(NOTIF36+CARE66+CHOICE61+LARGE60+GLIMPSE_B 84+SNAPSHOT 87)。TIER2: EMOTION_TEXTS全10感情にcomposed archetype追加(ui-render.js)。RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPEに_default/cool/delinquent追加+ルックアップ汎用化(management.js)。auto-sim 100シーズンALL CLEAR |
| 04-06 | ドラフト交渉システム step1-5実装+修正16件: セリエンジン(draft-negotiation.js ~780行)/旧スカウト廃止/候補プール拡張/事前選択制/候補一覧UI(新聞風)/交渉画面UI(入札カード+ヒートゲージ+ナレーション)/BGM・SFX統合/EMPRESS安全網/観戦モード廃止/団体名動的化/エンブレム修正/★視認性改善/BGM_showScreenNoBgm導入/AI全同時離脱バグ修正/ロスター上限制御(理想+2超で不参加)。引き継ぎ: docs/draft-notes/ |
| 04-06 | specs/再同期全完了: カテゴリA(7件)+カテゴリC(6件)、specs/全20ファイル |
| 04-05 | dormantPool FIFOキュー化: drawFromFrontヘルパー+選抜4箇所FIFO化+フィルタバグ修正+エントリ形式統一 |
| 04-04 | AI引退選手即リサイクル修正: _weekRetiredIds→retiredIds反映+5シーズンクールダウン適用 |
| 04-02 | 殿堂ポイント調整: ジュニア優勝6→4pt/PPV勝利7→5pt/対抗戦勝利2→1.5pt。表彰歴4種を新規加算(MVP2pt/新人王1.5pt/ベストマッチ1pt/メディア功労賞1.5pt)。殿堂タブ説明文を全9種内訳に更新。既存セーブの殿堂入り済み選手は再計算せず維持。auto-sim 100シーズンALL CLEAR |
| 04-02 | プロモ人気増加の可視化: seasonPopGrowthフィールド追加→団体タブ成長ログに「人気+X.X」（オレンジ）表示。精算レポートのプロモ収入行に「人気+X.X」追記。シーズン末リセット。auto-sim 100シーズンALL CLEAR |
| 04-01 | ポップアップ通知追加6件: P1スキャンダル→showNotifEventToast(N_scandal警告スタイル+portrait)/O2空席新聞記事(emptyVenue newspaper)/T4-T7不満ティッカー(G1-G4 grievanceフラグをprocessWeeklyStoryEventsで最大2件/週)/M1対立ペアティッカー強化(ペア名表示)/P5怪我離脱人気低下→showToast(4週毎)/P6メディア密着終了→showToast。data.js+management.js+relationships.js+app.js+ui-common.js変更。auto-sim 100シーズンALL CLEAR |
| 03-30 | MQ上限撤廃&特性MQリデザイン: MQ clamp上限100を5箇所で撤廃(match-engine.js×1+management.js×4)。名勝負製造機:MQ直接+1~5廃止→キックアウト+0.15/ギブアップ脱出+0.15/カウンター+5%の間接効果に。引き出し上手:MQ直接+max4廃止→ペーシング減点の適正ターン閾値緩和(Tier2:13→10/10→7、Tier1:7→5/5→3)に。auto-sim 100シーズンALL CLEAR |
| 03-28 | 関節技決着の勝利方法表示修正: checkPinAttempt成功時にmv.c==='submission'でfinType='ギブアップ'に分岐（従来はすべて'ピン'→3カウント表示になっていた）。auto-sim 100シーズンALL CLEAR |
| 03-28 | 殿堂入りスライド修正: セリフタイミング制御(選手セリフ→タップでコーチセリフに切替、次へボタン無効化)+コーチ画像パス修正(getPortraitUrl→getCoachPortraitUrl)+タップヒントUI追加 |
| 03-26 | B4タレント活動拡充設計: 6種サブタイプ(cm/gravure/variety/brand/fashion/fan)+personality相性倍率+archetype追加補正+名前配列6種+LARGE_EVENT_TEXTS/DIALOGUES全セリフ+週次収入組み込み+推薦ヒントUI。実装依頼書: docs/b4-talent-activity-impl.md |
| 03-26 | 引退セリフ修正設計: B4_champion_injury全パターンをネガティブ→誇り・優秀の美ベースに書き直し。trust≥85+30%抽選で社長気遣い追加ポップアップ（クリックで閉じる）。セリフ管理: dialogue-rewrite-master_5.xlsx |
| 03-26 | メディア功労賞実装完了。mediaRevSeason+talentRevSeason合計最大の選手を選出。表彰式MVP直後にスライド表示。AWARD_LINESにmediaAwardセリフ追加 |
| 03-26 | 団体画面ブラッシュアップ完了済み確認 |
| 03-26 | MQ改修Phase1-3: キックアウトバグ修正+ペーシング長すぎ撤廃+外部MQ6件削除+値圧縮+集客ボーナス変更+マンネリ緩和(ランダム幅+ロスターサイズ連動ウィンドウ)+OV帯別分布検証ALL CLEAR |
| 03-25 | 直近5戦表示: recentMatches配列(FIFO max5)をプレイヤー興行/AI興行/PPV/対抗戦の全4パスで記録。Engine.pushRecentMatch新設。選手ポップアップ通算戦績の下に「直近: ○山田 ×鈴木...」横1列表示。auto-sim 100シーズンALL CLEAR |
| 03-25 | 新聞バックナンバー: G.newspaperArchive(最大24週分)蓄積+バックナンバーナビUI(◀次の号/前の号▶/最新号)+日付表示大型化(シーズンN 第M週)。engine.js+ui-render.js |
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

### 団体画面ブラッシュアップ + クリームテーマ展開 ✅ 実装完了（2026-03-30頃）

設計書: `tasks/roster-redesign-plan.md`、Mockup: `archive/prototype/roster-detail-redesign-v9.html`

**実装済み内容:**
- 所属選手の詳細パネルをウイニングポスト風に全面リデザイン（full画像 + 3タブ: 能力/成長経過/育成）
- G1クリームテーマを本拠地系画面に展開（団体/スタッフ募集/スカウト/ランキング/DB/収支）
- body背景 `#24221e`（セピアグレー）統一 + ダークパネル暖色化
- `growthLog` データ構造 + 記録ロジック + マイグレーション + 引退時削除
- 選手アイコン角丸四角化
- ダーク維持画面: 今週/興行準備/ログ/セーブ/ヘルプ

### 拡張候補

| 項目 | 優先度 | 備考 |
|---|---|---|
| ~~金銭バランス改善（グッズ再設計+メディア収入+trust給与効果）~~ | ~~高~~ | **実装済み（2026-03-26）** |
| フィニッシャー（キャラ固有必殺技） | 高 | 設計完了。SE素材＋初期キャラリスト待ち |
| ライバルストーリー自動生成 | 高 | 未設計 |
| ストーリーアーク（数ヶ月にわたる抗争管理） | 高 | 未設計 |
| コーチ転身 | 中 | scout-system-spec §8.2 で予約済み |
| タッグマッチ・タッグ王座 | 中 | ライト案: シングル2試合合算方式 |
| 敵AI団体専用キャラクター | 中 | 固有キャラで世界観を深める |
| マネージャー的存在（説明キャラ） | 中 | チュートリアル・イベントの語り手 |
| マインド依存の成長イベント | 中 | mnの存在感を強化 |
| **ケアシステム全面改修** | **高** | 専属トレーナーがバフ4週=ストック回復4週の完全同期で100%稼働（実質ストック制限なし）。1920万/シーズンで常時成長+30%は強すぎる。合宿は2ストック消費でトレードオフ機能中。改修案: バフ期間3週化/同一選手再使用CD/逓減など。他ケアとのバランスも含めた包括見直し |
| トレーニング施設アップグレード（C/B/Aランク＋老朽化メンテ） | 低 | 金銭バランス改善B-1として将来構想。お金が余った時の投資先 |

### 金銭バランス改善（実装済み 2026-03-26）

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
| オープニングシーン+初期ドラフトUI刷新（4幕儀式演出+クリーム新聞テーマ+5名集合写真完了演出） | 04-07 | `specs/opening-sequence-spec-v1.0.md` |
| 業界底上げシステム（1位達成後A/B団体恒久強化+全画面演出枠+新聞記事） | 04-03 | `docs/league-elevation-mockup-spec.md` |
| 強化メニュー（追込）バランス修正（倍率1.5→1.8/消耗6-13→5-10/怪我5%→3%/鉄人・努力家軽減適用） | 03-28 | — |
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
