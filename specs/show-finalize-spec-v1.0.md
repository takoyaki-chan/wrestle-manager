# 通常興行の試合後の処理 仕様 v1.0 — `Engine.show.finalize`

- 確定: 2026-09-26(K-1「興行後の処理を一本化する」第3段。裁定 K-1 = A・段階的)
- 改訂: 2026-09-26(第4段 4-A: 実プレイだけにあった処理をエンジンへ移し、経路ごとの指定を統一した)
- 実装: `src/management.js` の `Engine.show.beginShow` / `Engine.show.finalize` と段の関数(`Engine.show.*`)、`src/relationships.js` の `Engine.relationships.archiveRetiredRivalryState`、`src/app.js` の `App._finalizeShowImpl`・`App._applyShowPresentations`・`App._finalizeHook*`
- 経緯・差の台帳: `docs/fun-audit-v0.1/k1-parity-report.md`(§8 第3段・第4段 4-A)、常設テスト `npm run test:k1:parity` / `test/k1-stage3-test.js`

## 1. 目的

通常興行の試合後の処理を1本にする。以前は、エンジン(`Engine.executeShow` = auto-sim)と実プレイ(`App._finalizeShowImpl`)が同じ処理を別々に書き写していて、測っている世界と遊ばれている世界が分かれていた(K1 の差分 40 項目)。

- **両経路は同じ関数を、同じ順番で通る。** 第4段 4-A で、実プレイだけにあった処理(成長イベント・経歴の刻印・派閥の予約の清算・密着取材・ラストランの引退・引退者の関係値の整理・乱入)をエンジンの段へ移し、経路ごとの指定(ctx)の分岐をログの型と評価の名札だけにした。
- 残る実プレイだけの処理は、試合の前の注入ごと画面側にある奪還挑戦・直訴・挑戦状 B3 の清算(§5 の hooks)。`closeShowResult` の後半(王座の設立・契約枠・サバイバルなど)は第5段で `tickWeek` へ移す。

## 2. 入口

| 経路 | 流れ |
|---|---|
| エンジン | `Engine.executeShow(state)` → 修復(`repairProgressionState`)・カードの検査 → 乱入の判定と差し替え(`Engine.show.rollIntrusion`)→ `Engine.show.beginShow` → 試合のシミュレーション(Pass 1。シングルは `Engine.battle.simulateMatch`、タッグは `Engine.showTagMatch.simulate`) → `Engine.show.finalize(s, validMatches, rawResults, { roster, preShowLosingStreaks, preShowState: state, intrusion })` |
| 実プレイ | `App.executeShow`(奪還・直訴・統一王座・B3 の注入、乱入の判定と差し替え=`Engine.show.rollIntrusion`) → 観戦/スキップで試合結果 → `App.finalizeShow` → `App._finalizeShowImpl` → `Engine.show.beginShow(G, validMatches)` → `Engine.show.finalize(begun.state, validMatches, results, { …実プレイの指定・hooks })` → 演出データを一時キーに載せる(`App._applyShowPresentations`)→ 結果画面の前のモーダル・結果画面 |

- `beginShow(state, validMatches)` → `{ state, roster, preShowLosingStreaks }`。興行数 +1・`weekPhase: 'showExec'`・F02① の火種。`roster` は休養願い(`forcedRest`)を外した**作業用の写し**で、`state.roster` は興行前のロスターのまま。
- `finalize(state, validMatches, results, ctx)` → `{ state, results, injuryResults, events, showRivalryResolutions, titleMatchOutcomes, presentations, fp, venueHeat, pressureFactor }`。
- `rollIntrusion(state, validMatches)` → `{ state, validMatches, intrusion }`。防衛3回以上の王者の王座戦に隣の順位の団体の上位選手が乱入する(`Engine.intrusion.check`・乱数 8888)。乱入者は `isIntrusion` の印でロスターに一時的に入り、同じ王座戦の枠(統一王座戦は除く)の挑戦者の側と入れ替わる。入力は書き換えない。

## 3. 処理の順番(両経路共通)

1. ファン期待の印に使う期待カード(興行の処理を始める前の状態で作る)
2. 因縁の印(rivalryBonus・isTitleMatch)と、決着候補でない組の因縁の記録(王座戦・乱入の前。乱入者・奪還挑戦の防衛者がロスターにいるうちの特性で記録する。決着候補の組は 8 で扱う)
3. 王座戦の結果(防衛・戴冠・新王者の記事。乱入者が奪った王座は記事にしない。奪還挑戦の試合は飛ばす) → 乱入の清算(`resolveIntrusion`: 奪取なら王座の空位・熱 −3〜−6(Hot 以上 −1〜−2 追加・乱数 8889)・対戦pt −、防衛なら団体人気 +2・対戦pt +。王者と乱入者の因縁 +12〜18(0xBE6F)。乱入者をロスターから外し、乱入のクールダウン) → **hooks.afterTitles**
4. 集客(試合の魅力(F08 の印つき)・動員・バフ(次の試合のバフの集客倍率はカード全体 `state.showCard` を見る)・fp・会場の熱)。超満員のドームの節目(`milestones.first_dome_sellout` を立て、式典は presentations.domeSellout)
5. 評価の確定(`Engine.mq.finalize`)・ファン期待の印・鮮度 → 次の試合のバフの消費
6. 歴代最高評価の記録
7. 因縁の決着(決着候補の組だけ。1興行1件。2人のどちらかがもうロスターにいない組は記録しない)
8. 試合評価による人気(`applyMatchPopularity`) → ★(`calcShowRating`) → 団体人気(`applyShowPopularity`・因縁カードの加算) → プロモ蓄積の消費 → 熱
9. 怪我と怪我による引退(`resolveMatchInjury`) → 引退の波及(`applyInjuryRetirementAftermath`)
10. 試合の関係値(`applyMatchResult` / `applyTagMatchResult`。統一王座戦の王者は統一王者、奪還戦・挑戦試合・統一王座戦は cross-org の文脈)・興行の文脈(`applyShowContextEffects`)
11. 派閥の予約の清算(`settleFactionBookings`: Common-1(0xC0B1)・F08(0xFA88)・F07 メイン推薦・F09 の決着・派閥内序列戦(0xFA21)・F08 の試合後)→ F02③ 決着 → 派閥ポイント(`accrueFactionPoints`。Common-1 で清算した試合は派閥内ポイントを二重に入れない)
12. 試合成長(`applyMatchGrowth`) → 季節の統計 → 王座戦の週 → **一度書き戻す** → 試合後の成長イベント(`applyGrowthEvents`: ブレークスルー(0xB818)・キャリア最高評価と信頼ボーナス +1.2・敗戦スランプ(0x5C6)・スランプとモチベ喪失のモメンタム(0x5C7)・モチベ喪失(0x5C8))
13. 対戦成績(`recordShowH2h`) → 直近戦績 → 対戦記録(matchupLog)・タッグ経験 → 経歴の刻印(`recordCareerMarks`: 評価85以上の試合の出場者に bigMatch、ドーム興行のメイン・王座戦の出場者に domeMain とドーム回数 +1・初ドームの節目) → 開眼
14. **書き戻し**(`s = { ...s, roster, rivalries, titles, heatScore, orgPop, lastShowResults, lastTitleMatchWeek, matchupLog, tagExp }`) → 成長イベントの演出データ(`_pendingGrowthEvents`) → 統一王座戦の清算(ロスターに混ぜた挑戦者 `isUnifiedTitleGuest` を相手団体へ戻し、`Engine.unifiedTitle.resolveMatch`) → **hooks.afterWriteback**
15. 歴代最高評価の経歴の刻み直し → 突然の退団(`applySuddenDepartures`)
16. (エンジン)助成金の知らせ
17. 怪我引退の演出データ(`buildInjuryRetirementPresentations`) → メディア密着取材の消化(`Engine.eventSystem.processMediaSpotlight`・乱数 0xB4B4。団体人気は 0〜100 に収める) → ラストランの引退(`retireLastRunFighters`) → 興行結果の新聞データ(`buildShowNewspaperData`。組めなくても処理は止めない) → 引退者の関係値と因縁の整理(`Engine.relationships.archiveRetiredRivalryState`。怪我引退 → ラストランの順)

**`state.roster` の読み方**: 12 の書き戻しまで `state.roster` は興行前のロスター(期待カード・興行の文脈・派閥ポイントの序列などが読む)。作業中のロスターは別に持つ。派閥の予約の清算(11)は作業中のロスターを状態に載せて派閥の関数へ渡し、変わったロスターを受け取って状態の roster を興行前へ戻す。乱入の清算(3)の因縁は、作業中のロスターを載せた状態で計算する(以前の実プレイと同じ)。12 の一度目の書き戻しの後は作業中のロスター。

### 直近戦績(`recentMatches`、直近5戦)

シングルは左右の2人に1枠ずつ。**タッグは1試合1枠**: 相手は向かい合った1人(A1↔B1・A2↔B2。人気の組と同じ)で、`tag: true` の印を付ける。選手ポップアップの「直近」は印のある枠に「(タッグ)」と出す。(K1-A07。以前はエンジンがタッグを記録せず、実プレイが対角の4組を記録して1試合で2枠使っていた)

### ラストランの引退(`retireLastRunFighters`)

出場した選手(タッグは4人)のうち `lastRun` の選手を試合ごとに1人選び、その試合の結果に `isLastRunMatch` / `lastRunFighterId` の印を付け、その興行の後すぐに引退させる(「4週待ちバグ修正」)。経歴(retire / lastrun)・引退者の記録・コーチの担当・年代記(アーカイブ・気風・章)・王座の返上・関係値の凍結と信頼への波及(引退試合)・O-04 仲の良い選手の気落ち(bond −5〜−10・乱数 0xBE3B)。季末の「ラストランの期限切れ」は、興行に出ないまま4週を過ぎた選手だけに残る。

## 4. 経路ごとの違いの指定(ctx)

省略時はエンジンの従来どおり。

| 指定 | 実プレイ | 意味 |
|---|---|---|
| `logStyle` | `'structured'` | ログの型。エンジンは文字列、実プレイは gameLog の型(`venue_heat_crowd` ほか)。人気の増減の知らせ・助成金の知らせは文字列のログだけ(K1-T03・裁定待ち) |
| `mqPath` | `'App._finalizeShowImpl'` | 評価の内訳に残す経路の名札(表示のみ) |
| `intrusion` | `App._intrusionData` | 乱入(`rollIntrusion` の intrusion)。エンジンは executeShow が自分で判定したものを渡す(データ。経路の違いではない) |
| `dict` | `WM_I18N.t` | 画面の言語の辞書。怪我引退・ラストランの引退の経歴の要約(団体名入り)と新聞データの訳(表示のみ) |
| `hooks` | §5 | 実プレイだけの処理 |

第4段 4-A で両経路にそろえて消した指定(以前の実プレイの処理に統一): `rivalryBeforeTitles`(§3 の 2)・`f08AttendanceMark`(§7 X04)・`nextMatchBuffCard`(カード全体)・`markDomeSellout`(§7 X10)・`crossOrgRelationshipContext` と `resolveUnifiedTitle`(§7 X06。統一王座)・`buildNewspaper`(新聞はラストランの引退の後)・`intruderId`(`intrusion` に)・`injuryPresentationDict`(`dict` に)。

## 5. 実プレイだけの処理の差し込み口(hooks)

`finalize` は作業中の値の入れ物 `w = { s, roster, titles, rivalries, events, titleMatchOutcomes, validMatches, results }` を渡し、hook が書き換えた値を以後の処理で使う。hook は状態を写してから書く。各 hook は1回ずつ、§3 の位置で呼ばれる。

| hook | 実プレイの関数 | 中身 |
|---|---|---|
| `afterTitles` | `App._finalizeHookSpecialBouts` | 奪還挑戦・直訴の3試合の清算(§7 X06)。どちらも試合の前の注入(`App.executeShow`)ごと画面側にある |
| `afterWriteback` | `App._finalizeHookGuests` | 挑戦状 B3 の清算・直訴のゲストの返却(B3 は `Engine.challengeRequest.mergeReturningGuest` で興行で起きたことだけを本物へ反映し、一時印を外す。large-event-spec §4.3b)。統一王座の予約の控え `App._unifiedTitleShowData` を片付ける |

第4段 4-A でエンジンの段へ移して消した hook: `afterRelationships`(派閥の予約の清算 → §3 の 11)・`afterGrowth`(成長イベント → 12)・`beforeKaigan`(経歴の刻印 → 13)。`afterTitles` の乱入(→ 3)と `afterWriteback` の統一王座・成長の演出データ(→ 14)も移した。直訴の結果モーダルへ関係値の変化を添える処理は `_finalizeShowImpl` の finalize の後(読むのは試合結果に付いた差分だけ)。

## 6. 演出データ(presentations)

finalize は、実プレイが結果画面の前後に見せるデータを**状態に積まず** `presentations` で返す(エンジン=auto-sim は使わない。K1-T04)。実プレイは `App._applyShowPresentations` で一時キーに載せ、従来どおりの場所で見せる。

| presentations | 実プレイの一時キー / 見せ方 |
|---|---|
| `injuryRetirements` | `_pendingInjuryRetirements`(本人の引退ポップアップ。closeShowResult が取り出す) |
| `lastRunRetirements` | `_pendingLastRunRetirements`(同上) |
| `common1Result` | `_pendingCommon1Result`(Common-1 予約の清算の結果表示) |
| `f08Aftermath` | `_pendingF08Aftermath`(F08 の試合後モーダル。キューの後ろに足す) |
| `f09Ending` | `_pendingF09Ending`(派閥対抗戦の決着。地の文は画面の言語でここで組む。台詞は表示専用の文選び=Math.random) |
| `mediaSpotlightEnded` | 密着取材の終了のトースト |
| `domeSellout` | `_pendingDomeSelloutCeremony`(超満員のドームの式典。節目の印は finalize が状態に立て済み) |

成長イベントの演出データ `_pendingGrowthEvents` は状態に載せる(tickWeek のスナップショットがブレークスルーの項目に一文を足すため。auto-sim は興行の後に一時キーとして捨てる)。ブレークスルーの兆しの独白(btHint)は表示専用の文選びで、専用の乱数 0xB7A1。

## 7. 不変条件

- `finalize` / `beginShow` / `rollIntrusion` は入力の状態を書き換えない(試合結果の配列には評価と印を書き足す)。同じ入力から同じ結果(乱数は状態の種から derive した系列だけ。F09 の決着の台詞だけは表示専用の Math.random)。
- 実プレイの経路は、第3段の組み替えの前後と第4段 4-A の移し替えの前後で、tickWeek に渡す状態から後が同じ(差分テストの `--dump` と `compare-dumps.js`、4-A は同じ fixture(`--fixture-in`)で 16 本を比較)。4-A で変わった実プレイの値は、100 を超えそうな団体人気を密着取材の最終回で 100 に収めること、乱入の差し替えを同じ王座戦の枠だけにしたこと(以前は同じ興行の統一王座戦・奪還挑戦の同じ側まで乱入者にしていた)、表示専用の文選び(btHint)の乱数だけ。引退者の関係値の整理は closeShowResult から finalize の中へ早まった(tickWeek の入力は同じ)。
- 共通の処理(評価の確定・記録・集客・人気・怪我・関係値・派閥の予約と派閥ポイント・成長と成長イベント・対戦成績・直近戦績・経歴の刻印・開眼・統一王座・突然の退団・密着取材・ラストランの引退・新聞データ・引退者の整理)を、`_finalizeShowImpl` と hooks に書き直さない(`test/k1-stage3-test.js` が文面で見る)。
