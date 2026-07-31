# 「2回押さないと進まない」全数監査 v0.2 (2026-07-31・完了)

Keisuke 報告:
> 2度ボタンを押さないと進まないってところは、結構いろんなところに今まであって、
> それが悪さしてバグ的な挙動を起こしているっていうこともあると思うので、そういうのはもう潰してほしい。

v0.1 は6系統のうち1系統だけ完走した中間報告だった。**v0.2 で残り5系統も完走**し、
検出分は全て修正済み。以下はその統合結果。

## 探した型

| 型 | 内容 |
|----|------|
| **A** | 状態は進むが画面が変わらない。ハンドラの**一部の分岐にだけ**画面遷移がある |
| **B** | 再入で初めて進む。1回目と2回目で違う分岐に入る。二重更新の害を伴うことがある |
| **C** | 待ちが解けないと進まない。コールバック待ちにタイムアウトの保険が無い |

## 方法

`src/app.js` / `src/ui-common.js` / `src/ui-render.js` / `src/index.html` から
`onclick="..."` を機械抽出(計425件・ユニーク約140種)。試合エンジン系
(`battle-engine*.html` / `tag-battle*` / `battle-anim.js`)と `data.js` は対象外。
`src/factions.js` は DOM 非依存の純粋ロジックのみで進行ハンドラを持たない(grep で確認)。

そのうえで6系統に分けて独立に読ませ(並列)、`App.advanceWeek` / `processWeek` /
`advanceCurrentFlow` / `advanceFromWeekSummary` / `scoutEventFinish` の呼び出し元を
全部たどり、`weekPhase` を書き換える箇所を洗った。

---

## 検出結果(すべて修正済み)

| # | 型 | 箇所 | 発生条件 | 症状 | 深刻度 |
|---|----|------|---------|------|--------|
| 1 | A | `App.closeShowResult` `src/app.js:10264` | **毎週、興行結果を閉じるたび** | 状態だけ `weekSummary` へ進んで画面が前のまま。押しても何も起きないように見える | **高** |
| 2 | A | `App.scoutEventFinish` `src/app.js` | オフシーズン最終週(ドラフト結果の「経営画面へ」) | 状態は進むが画面がドラフト結果のまま。2度目で別分岐に落ちて初めて切り替わる。再入で `scoutsThisSeason` が余計に加算 | 高 |
| 3 | C | `dismissAllPopups` `src/ui-common.js` | ポップアップを閉じた直後(200ms)にタブ移動や「次の週へ」 | 試合後セリフ / Glimpse / イベント通知の**3系統がセッション中まるごと出なくなる**。エラーは出ない | 高 |
| 4 | B | `_awCommitResult` / `initAutumnWarReplay` | 秋4団体戦の結果画面のまま閉じて開き直す | 精算が二度走り、資金・人気・経歴・記事・対戦PTが**二重に入る** | 高 |
| 5 | C | `App.escapeBattle` `src/app.js` | 派閥内対決(Common-1)で試合中断 | 復帰の枝が無く `watching` が立ったまま。遅れて届いた結果で精算が二度走る | 中 |
| 6 | C | `FileBGM.stop` / `fadeOut` `src/app.js` | エンディング/ゲームオーバー閉幕の2秒以内にBGM操作 | `fadeOut().then()` が永久に来ず、締めが呼ばれない | 中 |
| 7 | — | `toggleTitle` / `confirmExecuteShow` | 画面の枠と `G.showCard` がずれたとき | TypeError で落ちて以降のクリックが全部死ぬ / 開催ボタンがエラー音だけで無言 | 中 |
| 8 | C | `escapeBattle` の対抗戦枝 `src/app.js:7154` | 現状は到達しない(結果を先に埋めているため) | `App._skipWarMatch` は存在しない(改名の取り残し)。結果を後回しにする変更で即 TypeError | 低 |

### #1 の背景(同種再発の元)

task-48(`b33519b`)で `_tryAutoAdvance` の契約が変わった。

- **旧**: 条件つきで true を返し、**自分で** `showScreen`/`refreshAll` まで済ませた
- **新**: 常に true を返し `weekPhase='weekSummary'` を置くだけ。**何も描かない**
  → 呼び出し側が続けて `advanceFromWeekSummary()` を呼ぶ義務がある

`processWeek` 側だけ直され、`closeShowResult` は旧来の `if (App._tryAutoAdvance()) return;`
のまま残った。**契約を変えたとき呼び出し側を全部洗わなかった**のが原因。
以降、その下の `showScreen`/`refreshAll` は到達不能な死にコードになっていた。

---

## 入れた機械検査

| テスト | 何を縛るか |
|--------|-----------|
| `test/week-advance-contract-test.js` | `_tryAutoAdvance` が「常に true・描画しない」ままか / **すべての**呼び出し側が `advanceFromWeekSummary` へ繋いでいるか / `returnToWeekScreen` が `showScreen` を使っていないか / `refreshAll` が `_reconcileDedicatedScreen` を通しているか |
| `test/autumn-war-commit-once-test.js` | 精算済みの印がセーブに残る場所にあるか / 大会開始で倒すか / UI が GameState の印を見ているか |
| `test/title-defense-scale-test.js` | 王座結果の全6経路で `onDone` が例外なく1回だけ呼ばれるか |
| `test/ppv-tv-start-test.js` | 空キューでもコールバックが走るか / 保険の時限があるか |

構造的な保険も入れた。

- `App.returnToWeekScreen()` — 専用フローから抜ける共通の出口。
  `showScreen` と違い `dismissAllPopups()` を呼ばないので、重ねた演出オーバーレイを消さない
- `_reconcileDedicatedScreen()`(`refreshAll` の先頭)— ドラフト専用画面が材料を失ったまま
  残っていたら自動で今週画面へ戻す。**出口ごとに気をつけるのをやめる**ための仕掛け
- `docs/ui/mockup-baseline-v0.1.md` §5-D「画面遷移とタイミング」— 同種の事故4回を規約にした

---

## 白(A/B/C いずれにも該当せず)

読んで確認した主要系統。**何を見たかの記録**として残す。

- **週次コアループ** — `advanceCurrentFlow` / `advanceWeek` / `advanceFromWeekSummary` /
  `processWeek` / `handleContractNegotiations`。`advanceFromWeekSummary` には
  `weekPhase !== 'weekSummary'` の再入拒否ガードがある
- **ドラフト/FA/レンタル/解雇/契約更新モーダル**(約30関数)— 1行ずつ検証して A/B/C は0件
- **興行準備** — `startShowPrep` / `resumeShowPrep` / `moveShowCard` / `setShowVenue` /
  `clearShowCard` / `mergeToTagSlot` / `removeTagSlot` / `setTagSlotFighter` /
  `_spOpenPicker` / `_spClosePicker` / `_spOpenTagPicker` / `_spSelectFighter`。
  すべて「ガードは変更前・変更したら必ず同じtickで再描画」の形
- **興行消化** — `executeShow` / `watchMatch` / `_watchTagMatch` / `skipMatch` /
  `skipAllMatches` / `receiveBattleResult` / `finalizeShow` / `renderShowResult`
- **天頂戦** — `initTenchosenReplay` ほか全ハンドラ。`tcAdvanceAfterResult` /
  `tcAfterWinner` / `tcSkipAll` / `finalizeTenchosen` すべて全分岐で描画に到達
- **PPV GRAND FINAL** — `initPPVShow` / `initPPVTV` / `ppvSkipAll` / `ppvSkipMatch` /
  `ppvWatchMatch` / `closePPVResult` / `closePPVTV` / `confirmPPVEntry` / `togglePPVPick`
- **ジュニアトーナメント** — 全ハンドラ。`_juniorTournamentResult` を **G に永続させて**
  再適用を防いでいる。**秋対抗戦(#4)が真似すべきだった正しい形**
- **春のタッグリーグ** — 結果は `tickWeek` 内で確定済みで、UI は再生するだけ。
  #4 の型の危険が構造的に無い
- **対抗戦(旧war)** — `closeWarFinalResult` はトークンで古い遷移を無効化する
  デバウンスを持っており、二度押しに強い
- **コーチ / 社長室 / 派閥パネル / 選手ケア / 相関図 / DB・新聞のビュー操作** —
  すべて「ガードは変更前・単一経路・最後に必ず再描画」
- **ポップアップキュー基盤** — `_isPopupActive` / `_enqueuePopup` / `_drainPopupQueue` /
  MutationObserver の安全網 / 引退・因縁・成長・AI警告の各キュー。#3 以外は健全
- **表彰式チェーン** — `_safeAwardsChain` は各段を try/catch で包み、失敗しても次へ落ちる
- **タイトル/団体設立画面 / 閲覧専用ポップアップ**

---

## 残り(未確認・低優先)

確定していないので**バグとしては数えない**。触るときに一緒に見る。

- `App.stlAdvance`(`src/app.js:4529`)に `'watching'` 用の else が無い。
  その phase で呼ばれると無言で何もしないが、**呼ばれる経路を見つけられなかった**
- `App.skipAllMatches`(`src/app.js:7216` 付近)に到達不能な `if (false)` が残っている。
  害は無いが、直しかけの跡
- `confirmSigning`(`src/ui-common.js:1591` 付近)がロスター上限時に保留分岐を見ずに
  「加入しました」と出す誤表示
- `showTravelScene`(`src/ui-common.js:2596` 付近)が `anim.onfinish` だけに頼っており、
  タイムアウトの保険が無い。ただしクリックで飛ばせるので詰まりはしない
- `renderTenchosenPreEvent` が `G.tenchosenPreEvent` 不在で return すると
  `_drainPopupQueue()` を呼ばない。**その状態になる経路は見つからなかった**
- 動的オーバーレイ(`.war-victory-overlay` / `.db-hof-detail-overlay`)の close が
  `_drainPopupQueue()` を呼ばず、MutationObserver の監視対象にも入っていない
- `App.handleFactionEvent` の 13/17 分岐、`App.handleLargeEvent` の B2/B3 サブ分岐は
  同じ型を4分岐で確認しただけで、全部は追っていない
- **試合エンジン系は対象外のまま**(Keisuke 指示でまとめて別途)
