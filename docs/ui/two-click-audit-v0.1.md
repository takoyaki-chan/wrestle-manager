# 「2回押さないと進まない」全数監査 v0.1 (2026-07-31)

**注記: この版は中間報告である。** 全 onclick ハンドラを 6 系統に分けて並行調査を開始した。
本ファイル書き出し時点で完走・確認できていたのは「週次コアループ」「タイトル/団体設立画面」
「閲覧専用ポップアップ」「factions.js のスコープ確認」「系統1: ドラフト/FA/レンタル/解雇/
契約更新モーダル」。残り5系統（ジュニアトーナメント/タッグリーグ/秋4団体戦、天頂戦/PPV、
興行準備・消化、コーチ/派閥/社長室、ポップアップキュー基盤）は関数名を洗い出した段階で、
個々の分岐の当落は**未確認**。下の「未確認」節に対象関数を列挙する。

## 対象と方法

- `src/app.js`(15,940行) / `src/ui-common.js`(18,498行) / `src/ui-render.js`(15,060行) /
  `src/index.html`(10,123行) の4ファイルから `onclick="..."` を機械的に抽出。
  試合エンジン系(`battle-engine*.html`, `tag-battle*`, `battle-anim.js`)と `data.js` は対象外。
- 抽出件数(grep実測): index.html 48件 / ui-common.js 130件 / ui-render.js 244件 / app.js 3件
  (app.jsは動的生成HTML内のonclick) = **計425件**。呼び出される関数名をユニーク化すると約140種。
- `src/factions.js`(5,638行)は `onclick` / `showScreen` / `refreshAll` / `document.` を
  1件もgrepで検出できず(325個の関数/アロー定義があるが全てDOM非依存の純粋ロジック)。
  UI側は app.js / ui-common.js / ui-render.js から `Factions.*` を呼ぶ形になっており、
  factions.js 自体には進行ハンドラが存在しない。
- 洗い出した関数を「週次コアループ」+ 6系統に分け、コアループとタイトル画面・閲覧専用ポップアップは
  自分で1行ずつ読んで検証。残り6系統は並行調査を開始したが完走前に本ファイルの書き出しを指示されたため、
  関数名の列挙止まりで個々の分岐判定は行っていない。

## 検出結果

**検証を完了させた範囲(週次コアループ／タイトル画面／閲覧専用ポップアップ／factions.jsスコープ確認／
系統1: ドラフト・FA・レンタル・解雇・契約更新モーダル)では、A/B/C型に該当する新規の問題は検出されなかった。**
該当なしのため表は空。ただし系統1の調査中に、A/B/C型とは異なる種類の実害あるバグを1件検出した
(「その他の発見」節を参照)。

| # | 型 | 関数 | 場所 | 発生条件 | 症状 | 二重更新の害 | 深刻度 |
|---|----|------|------|---------|------|------------|--------|
| (該当なし) | — | — | — | — | — | — | — |

## その他の発見(A/B/C型ではないが実害あり)

系統1の調査(担当: 並行調査エージェント)で見つかった、二度押し/画面据え置き型とは別種の実害バグ。
本監査の主題(型A/B/C)には該当しないため検出結果表には含めないが、記録として残す。

**`confirmSigning(charId)` — `src/ui-common.js:1591-1608`**
`App.signFighter(charId)`(app.js:5040-5049)はロスターが上限のとき実際には契約せず
`App._queueRosterOverflowSigning(...)`を呼んで保留にするだけだが、`confirmSigning`側は
その分岐を見ずに`App.signFighter(charId)`の直後で無条件に
「`${name}がロスターに加わりました！`」という歓迎ポップアップを表示する。
約50ms後にロスター上限の解雇選択モーダルが重ねて出るため、プレイヤーは
「加入しました」→直後に「先に誰かを解雇してください」という矛盾した表示を見る。
状態自体は`_queueRosterOverflowSigning`側の`refreshAll()`で正しく画面遷移するため
進行不能ではない(=型A/B/Cの定義には非該当)。トリガー条件: ロスターが上限(`rosterCap`)に
達した状態でFA選手と契約セレモニーから契約する。深刻度: 低(誤表示のみ、進行・数値には影響なし)。

## 修正済み(参考)

以下2件はKeisukeさんにより既に修正済みのため、検出結果には含めない(参考記載のみ)。

1. `_draftResultNext()`(ui-render.js) → `App.scoutEventFinish()`(app.js:5502)のオフシーズン最終週での画面戻し忘れ。
2. `_mdlDOpen()` が `mdl-d-box` のクラスをリセットせず、号外モーダルの `cream` が後続の確認ダイアログに残る問題。

## 白(問題なし)と判定したもの

行番号付きで実際に読み、A/B/C いずれにも該当しないことを確認した関数。

### 週次コアループ (`src/app.js`)

- **`App.advanceCurrentFlow`** (app.js:11236-11263) — `weekPhase` で `manage`/`weekSummary`/
  `contractNegotiation`/`scoutEvent`/`offSeason・offseason・settled` の5分岐、いずれも
  対応する遷移関数を呼んで即 `return`。該当なしの場合のみ `Audio.play('error')` で状態変更なしの
  フォールスルー(問題なし、何も変えていないので二度押しても同じ)。
- **`App.advanceWeek`** (app.js:11265-11453) — `scoutEvent`/体験版終了/`contractNegotiation`/
  天頂戦リプレイ/`ppvShow`/`ppvTV`/秋4団体戦リプレイ/ジュニアトーナメントの各分岐は
  すべて `showScreen`or`refreshAll`相当を呼んでから `return`。以降の本流も末尾で必ず
  `refreshAll()`(11445)を先に呼んでから演出チェーン(`_safeAwardsChain`等)に入る作り。
  コード内コメント(2026-07-27付)がまさに本監査と同型の不具合(「チェーンが待ちに入ると前週の画面が
  残る」)を過去に踏んで修正した経緯を記しており、既に手当て済みと判断。
- **`App.advanceFromWeekSummary`** (app.js:10657-10755) — 冒頭で `G.weekPhase !== 'weekSummary'`
  なら何もせず `return false`(二重発火防止の意図的ガード。状態を変えていないので害なし)。
  以降の分岐(体験版終了/`contractNegotiation`/天頂戦/`ppvShow`/`ppvTV`/秋4団体戦/春タッグリーグ)は
  すべて `Storage.autoSave()`+専用init関数+`return true`。どの分岐にも該当しなければ
  末尾で `showScreen('week')`+`refreshAll()`(10736-10739)。全経路で画面遷移に到達。
- **`App.processWeek`** (app.js:10776-11233) — `weekPhase==='gameover'` は専用の
  `showGameOverCeremony`チェーンで早期`return`(10794-10798)。本流は多数の `setTimeout` で
  ポップアップを積むが、いずれも進行をブロックしない(ポップアップ表示は非同期の副作用で、
  関数自体は同期的に完走する)。末尾は `App._tryAutoAdvance()` が真なら
  `App.advanceFromWeekSummary()`(検証済み・白)、偽なら `showScreen('week')`+`refreshAll()`
  (11225-11228)。全経路で画面遷移に到達。
- **`App.scoutEventFinish`** (app.js:5502-5553) — Keisukeさんの修正確認済み(上記「修正済み」参照)。
  現状のコードは `!G.scoutCandidates && !G.scoutPicks && !G._draftResultPages` の場合に
  `App.returnToWeekScreen()`+`refreshAll()`で即帰還するガードが入っており、
  `App.returnToWeekScreen()` を `advanceWeek()` の**前**に呼ぶ順序に直っている。
- **`App.handleContractNegotiations`**(app.js:5556-5620)+**`App._resolveContractChoice`**
  (app.js:5662-5702) — オーケストレーション本体(交渉0件なら即 `App.advanceWeek()`、
  1件以上なら `showScreen('shachoshitsu')` して `processNext()` 再帰、`idx>=length` で
  結果モーダル→`weekPhase:'offseason'`+`showScreen('week')`+`App.advanceWeek()`)自体に
  分岐漏れは無い。**ただし** `showContractSummaryModal`/`showContractNegotiationModal`/
  `showContractReactionModal`/`showContractListenModal`/`showContractResultModal`/
  `showContractSuddenDepartureModal` の実装(モーダルのクローズ/キャンセルボタンが必ず
  コールバックを呼ぶか)は**未検証**。下記「未確認」参照。
- **`App.autoManage`** (app.js:10759-10774) — `weekPhase !== 'manage'` で即 `return`
  (状態変更なしの単純ガード、害なし)。本流は単一直線パスで `refreshAll()` へ到達。

### タイトル/団体設立画面 (`src/app.js`)

- `App.titleNewGame`(4772-4792) / `App.titleContinue`(4795-4808) /
  `App.titleLoadGame`(4811-4821) / `App.selectOrgIcon`(4824-4835) /
  `App.confirmOrgSetup`(4838-4845) / `App.selectDifficulty`(4848-4858) /
  `App.confirmDifficulty`(4861-4871) / `App.backFromDifficulty`(4874-4878) /
  `App.backToTitle`(4881-4885) — 全て単一直線パスで `document.getElementById(...).style.display`
  の直接切替か `refreshAll()` に到達。分岐なし、または分岐があっても両側が同じ画面操作に収束。

### ジュニアトーナメント入口 (`src/app.js`、一部のみ)

- `App.enterJuniorTournamentFromWeek`(3868-3887) — 開催不可時は
  `App.cancelJuniorTournamentForInsufficientParticipants()` を呼ぶが、この関数自体が
  内部で `showScreen('week')`+`refreshAll()` まで完結させている(下記参照)ため、
  呼び出し側の `return false` は無害。
- `App.resumeJuniorTournament`(3892-3921) — `jt.phase` の値に応じて必ず何らかの
  `render...` 関数を呼ぶ分岐構造で、フォールスルーも `renderJuniorTournamentBracket()`。
- `App.cancelJuniorTournamentForInsufficientParticipants`(3923-3943) — 末尾で必ず
  `showScreen('week')`+`renderWeekScreen()`+`refreshAll()`。
- `App.recoverWeekPhase`(3947-3969) — 末尾で必ず `showScreen('week')`+`refreshAll()`。
- **注**: `App.initJuniorTournament`(app.js:15057〜)は冒頭30行(15057-15089、開催不可時の
  フォールバック分岐)のみ読了。トーナメント本編の分岐(`jt.phase`遷移、ラウンド進行)は未読。
  `jtAdvanceAfterResult`/`jtGoToFinalResult`/`jtNextSummon`/`jtSkipAll`/
  `App.finalizeJuniorTournament` は未検証(下記「未確認」参照)。

### 閲覧専用ポップアップ (`src/ui-common.js`)

- `closeFighterPopup`(4175-4179) — オーバーレイの `active` クラスを外して
  `_drainPopupQueue()` を呼ぶのみ。ゲーム状態(`G`)は一切変更しない。
- `_switchFighterTab`(4182-4185) — タブ番号を書き換えて `showFighterPopup` を
  再呼び出しするだけ(キュー判定スキップの直接再描画)。`G` も `weekPhase` も触らない。
- `openRelationshipMap`(4188-4196) / `openFactionPanel`(4199-4204以降) —
  `closeFighterPopup()`→`showScreen('database')`→タブ切替変数の設定→`renderDatabase()`の
  単一直線パス。
- `toggleHelp`(7221-7225) — `classList.toggle('open')` のみ。状態変更なし。

### 系統1: ドラフト/FA/レンタル/解雇/契約更新モーダル (並行調査エージェントによる検証完了分)

以下は並行調査エージェントが実際にコードを1行ずつ読んで検証し、A/B/C型のいずれにも該当しないと
判定したもの。すべて「早期returnは状態変更前(=害なし)」「状態変更後の全分岐が
`refreshAll()`/`showScreen`/コールバック呼び出しに到達」のいずれかのパターンで白判定。

- **ドラフト本編**: `App.completeDraft`(app.js:4921-5017), `startDraftNegotiation`
  (ui-common.js:5347-5520 — `uiQueue.length===0`分岐は到達不能なデッドコードだが、それ自体は
  `scoutEventFinish`の自前ガードに守られており無害), `toggleDraftSelection`(ui-common.js:5331-5344),
  `draftPlayerAction`(ui-common.js:5833-5871), `draftSoloConfirm`(ui-common.js:5912-5924),
  `draftNextCandidate`(ui-common.js:5927-6112), `App.finishTransferWindow`/`finishTransferWindow`
  (ui-common.js:6157-6161)
- **ドラフト結果画面**: `_draftResultNext`(ui-render.js:5815-5834 — `scoutEventFinish`と同日
  2026-07-31に同じ「returnToWeekScreen→advanceWeek」パターンで硬化済み)
- **スカウト**: `App.scoutEventFinish`(app.js:5502-5553、修正済みを再確認)、
  `scoutFinish`/`scoutPick`/`scoutResolve`(ui-common.js:5300-5302、単純委譲)、
  `App.scoutEventPick`(app.js:5313-5335)、`App.scoutEventResolve`(app.js:5338-5480)
- **契約セレモニー**: `confirmSigning`(ui-common.js:1591-1608、型A/B/Cとしては白。ただし
  上記「その他の発見」参照)、`confirmRosterOverflowSigning`/`App.confirmRosterOverflowSigning`
  (ui-common.js:1337-1340, app.js:5197-5309)、`cancelRosterOverflowSigning`/
  `App.cancelRosterOverflowSigning`(ui-common.js:1342-1345, app.js:5187-5195)、
  `showSigningCeremony`(ui-common.js:1530-1589)、`showNegotiatePopup`(ui-common.js:1348-1445)、
  `confirmNegotiation`(ui-common.js:1447-1483)
- **レンタル/引き抜き/解雇/奪還**: `requestRental`(ui-common.js:7012-7049)、
  `resolvePoach`(ui-common.js:6124-6156)、`App.confirmRelease`(app.js:5780-5786)、
  `App.startReleaseInterview`(app.js:5758-5777)、`App.cancelReleaseInterview`(app.js:5789-5793)、
  `App.openReclaimDialog`(app.js:5871-5912)、`App.cancelReclaim`(app.js:5968-5982)、
  `App.confirmReclaim`(app.js:5917-5947)、`App._closeReclaimDialog`(app.js:5913-5916)
- **契約更新交渉チェーン**: `App.handleContractNegotiations`(app.js:5556-5620— `weekPhase===
  'contractNegotiation'`の間`showScreen()`が`shachoshitsu`以外への遷移を拒否するため
  (ui-common.js:7161)、チェーン離脱でコールバックが宙に浮くことはない)、
  `App._resolveContractChoice`(app.js:5662-5702)、`showContractSummaryModal`/
  `showContractNegotiationModal`/`showContractReactionModal`/`showContractListenModal`/
  `showContractSuddenDepartureModal`/`showContractResultModal`(いずれも ui-common.js:15217-15489、
  全て「要素が無ければ即コールバック呼び出し」のフォールバックを持ち、閉じるボタン/バックドロップ
  クリックによる離脱経路自体が存在しない設計)

## 未確認

以下は onclick から呼ばれる関数として抽出済みだが、個々の分岐(A/B/C型該当の有無)を
行番号レベルで検証できていない。次の調査で優先的に潰すべき対象として、関数名を系統別に列挙する。

### 系統2: ジュニアトーナメント本編/春のタッグリーグ/秋4団体勝ち残り対抗戦
`jtAdvanceAfterResult`, `jtGoToFinalResult`, `jtNextSummon`, `jtSkipAll`,
`App.finalizeJuniorTournament`, `App.initJuniorTournament`(本編部分),
`App.stlOpenEntryModal`, `stlAdvance`, `stlConfirmTeam`, `stlPickFighter`, `stlPickSuggestion`,
`stlWatchMatch`, `App.initSpringTagLeagueReplay`, `App.finalizeSpringTagLeagueReplay`,
`App._shouldStartSpringTagLeagueReplay`, `App._discardStaleSpringTagLeagueReplay`,
`App.awAdvanceMatch`, `App.awAutoEntry`, `App.awAutoFinalOrder`, `App.awBeginEntry`,
`App.awConfirmEntry`, `App.awConfirmFinalOrder`, `App.awMoveEntry`, `App.awMoveFinal`,
`App.awPickFighter`, `App.awPickFinalFighter`, `App.awRevealBout`, `App.awSelectEntryRole`,
`App.awSelectFinalRole`, `App.awShowMvpScene`, `App.awSkipTeamMatch`, `App.awWatchBout`,
`warWatchMatch`, `warSkipMatch`, `warSkipAll`, `closeWarFinalResult`, `showWarChallenge`,
`App.initAutumnWarReplay`, `App.finalizeAutumnWarReplay`

### 系統3: 天頂戦(4年に1度のPPVトーナメント)/PPV GRAND FINAL
`App._shouldStartTenchosenReplay`, `App.initTenchosenReplay`, `App.checkTenchosenPreEvent`,
`App.closeTenchosenPreEvent`, `tcAdvanceAfterResult`, `tcAfterWinner`, `tcConfirmEntries`,
`tcGoToFinalResult`, `tcNextDrama`, `tcSkipAll`, `tcSuggestPicks`, `tcTogglePick`,
`App.tcOpenEntryModal`, `App.finalizeTenchosen`, `App.initPPVShow`, `App.initPPVTV`,
`ppvSkipAll`, `ppvSkipMatch`, `ppvWatchMatch`, `App.closePPVResult`, `App.closePPVTV`,
`confirmPPVEntry`, `togglePPVPick`

### 系統4: 興行準備・興行消化・週次プリセット・共通イベント試合
`startShowPrep`, `resumeShowPrep`, `renderShowPrep`, `moveShowCard`, `App.clearShowCard`,
`App.setShowVenue`, `App.mergeToTagSlot`, `App.removeTagSlot`, `App.setTagSlotFighter`,
`_spOpenPicker`, `_spClosePicker`, `_spOpenTagPicker`, `_spSelectFighter`, `confirmExecuteShow`,
`App.finalizeShow`, `App.watchMatch`, `App.skipMatch`, `App.skipAllMatches`, `closeShowResult`,
`applyWeekPreset`, `batchIntensive`, `toggleIntensive`, `changeCoachAssign`, `executeEvent`,
`skipEvent`, `App.handleLargeEvent`, `App.applyChoiceEvent`, `App.handleFactionEvent`,
`App.handleChallengeRequest`, `App.common1SkipMatch`, `App.common1WatchMatch`,
`App.b2SkipMatch`, `App.b2WatchMatch`, `App.closeB2Result`, `App.closeB3Result`

### 系統5: コーチ/派閥/社長室/相関図/データベース/新聞
`hireCoach`, `expandCoachSlot`, `App.shachoshitsuScoutPage`, `App.onShachoshitsuDocClick`,
`App.switchShachoshitsuTab`, 派閥解散命令/封印系ハンドラ(`faction-decree-spec-v1.0.md`該当、
関数名grep未実施), `App.encourageFighter`, `doRetainFighter`, `_relmapClearCenter`,
`_relmapClosePopup`, `_relmapFocusOrg`, `_relmapMobileSetCenter`, `_relmapResetAll`,
`_relmapSetFilter`, `_relmapSetViewMode`, `_relmapShowComparePopup`,
`_relmapToggleFactionOverlay`, `_relmapZoomFit`, `_relmapZoomIn`, `_relmapZoomOut`,
`setRosterSort`, `setWeekSort`, `switchRosterDetailTab`, `toggleRosterDetail`,
`toggleSurvivalPanel`, `setDbChronicleIdx`, `setDbSubTab`, `openChronicleForFighter`,
`openHofDetailById`, `showHofDetail`, `rebuildChronicle`, `setNewspaperArchiveIdx`,
`setNewspaperPage`, `setNewspaperSubPage`
(このうち相関図・DB・新聞系は表示状態のみを書き換える単純トグルである可能性が高いと見立てているが、
未読のため「白」には入れていない。)

### 系統6: ポップアップキュー基盤/セーブロード/シーズン末セレモニーチェーン
`_drainPopupQueue`, `_mdlDClose`, `dismissAllPopups`, `showEventPopup`, `closeEventPopup`,
`closeEventMatchResultPopup`, `closeMatchDialogue`, `closeGlimpseCascade`, `closeNotifModal`,
`showToast`, `showConfirm`, `window._confirmYes`, `showSaveNameModal`, `_confirmSaveNameModal`,
`saveGame`, `exportSave`, `importSave`, `showRetirementPopups`, `App._showNewsPanelIfNeeded`,
`showEndingCeremony`, `showLeagueElevationCeremony`, `App._checkAndShowMilestone`,
`showTrialEndMessage`, `App.checkCrisisEnteredPopup`, `App.checkSurvivalUpdate`

**この系統6が最優先で見るべき箇所**: `App.advanceWeek` の末尾(app.js:11370-11453)は
`showRetirementPopups`→`App._safeAwardsChain`→`App._showNewsPanelIfNeeded`→
`App._checkAndShowEnding`→(`showEndingCeremony`/`showLeagueElevationCeremony`)→
`App._checkAndShowAwards`→`App._checkAndShowMilestone`→`App._maybeShowSeasonFanfare`→
`App._showFarewellsThenReport` という長いコールバック連鎖になっている。
`app.js`側の中継コード自体は try/catch でフォールスルーする作りで一見安全に見えるが、
連鎖の末端にあたる各 `show...` 系UI関数(おそらく`ui-common.js`または`ui-render.js`に実装)の
「閉じるボタンを押したら渡されたコールバックを必ず呼ぶか」は1つも実装を開いて確認していない。
ここでコールバックが呼ばれない分岐が1つでもあれば、年末チェーン全体が固まり、
「レポート週に総括が出ない」「表彰式が出ない」といった形で本監査の対象パターン(進行はしているが
画面が追随しない)として現れる可能性がある。

## 所見

- 検証できた範囲(週次コアループ、タイトル/団体設立、閲覧専用ポップアップ、系統1のドラフト/FA/
  レンタル/解雇/契約更新モーダル)は、いずれも2026-07-27〜07-31にかけて既に「状態が先、
  画面遷移が追随する順序」への手直しが入った跡(コード内コメント、および`_draftResultNext`が
  `scoutEventFinish`と全く同じ日付・同じガードパターンで硬化されている事実)が見つかり、
  この型の不具合が実際に過去に発生し修正されてきた領域だと確認できた。確認済みの
  `App.scoutEventFinish`の例と同じ設計思想(状態更新の**前**に`returnToWeekScreen()`等で
  下地を戻してから次の処理へ進む)が他の箇所にも一貫して適用されている。
- 系統1では型A/B/Cには該当しないが、`confirmSigning`(ui-common.js:1591-1608)がロスター上限時に
  `App.signFighter`の保留分岐を見ずに「加入しました」の歓迎ポップアップを無条件表示してしまう
  誤表示バグを検出した(詳細は「その他の発見」節)。二度押しでの進行不能ではないため型分類外だが、
  実害はある。
- 一方で、今回の中間報告では**各種トーナメント/対抗戦の試合進行ハンドラ(系統2・3)、
  興行準備・消化(系統4)、コーチ/派閥/社長室(系統5)、そしてポップアップキュー基盤(系統6)という
  ボタン操作の絶対量が多い領域をまだ検証できていない**。Keisukeさんが実機で踏んだ不具合の
  母数からすると、残っている不具合はこれらの中(特にコールバック連鎖に依存する「系統6」、
  および試合を1つずつ進める型のUIが多い系統2・3・4)にある可能性が高いと見ている。
  次の調査はここから再開すべき。
