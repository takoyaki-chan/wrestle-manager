# Codexタスク31: 「進行不具合(juniorTournament)」大量発生の根本修正

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**作業場所(準備済み)**: `C:\Users\nkmrk\Downloads\wm-task31`
(ブランチ `codex/junior-weekphase-fix` をチェックアウト済みの git worktree。
起点 43dbcad = ジュニア16人化バッチを含む最新mainなので、現象の再現に必要なコードは全て入っている)

このフォルダでそのまま作業する。新たにブランチ・worktreeを作らない。mainに直接コミットしない。
**コミットは自分で行わずローカル変更のまま残す**。push・配布禁止。

**変更してよいファイル**: `src/app.js` / `src/ui-render.js` / `src/management.js`(ジュニア進行部のみ)/
`test/` 新規、`docs/worklog.md` 先頭。それ以外は禁止。

---

## 現象(Keisuke実機報告 2026-07-31)

今週タブに以下が**大量に**出る:

> ⚠️ 進行不具合が発生しました
> 想定外の状態(juniorTournament)で停止しました。下のボタンで復旧できます。

## 発生機構(こちらで特定済みの入口)

`renderWeekScreen`(ui-render.js:1680-1689)は既知の weekPhase しか描画できず、
未対応の phase では復旧UIにフォールバックする設計。つまり
**`G.weekPhase === 'juniorTournament'` のまま今週タブが描画されている**。

## 調査してほしいこと(根本原因の特定)

1. `weekPhase = 'juniorTournament'` を設定する箇所・解除する箇所を全て洗う
   (設定→ジュニア進行画面→完了処理→次の phase、のライフサイクル)
2. どの経路で「phase が juniorTournament のまま今週タブが描かれる」かを特定する。仮説2本:
   - **仮説A**: 直近のジュニア16人ブラケット化(commit 43dbcad。1回戦=firstRound追加、
     ラウンド数増、UI xsセル追加)で進行フロー/完了処理に穴が開いた
     (例: 1回戦を含むラウンド進行で完了イベントが発火しない・live画面の終了処理が
     ラウンド数3前提など)
   - **仮説B**: 16人化以前からの既存バグ(復旧UI自体は以前からの防御機構。
     「大量発生」がいつからかは実機報告では不明)
   git log でジュニア関連の変更履歴を辿り、どちらかを結論づけること
3. **復旧ボタンの副作用**も確認: 復旧onclickは `weekPhase='manage'` に強制リセットする
   (ui-render.js:1688)。ジュニア進行中にこれを押すと、トーナメント結果・履歴・賞金は
   どうなるか(消えるなら二次被害)

## 修正方針

- **根本修正が主**: phase のライフサイクルを直す(設定したら必ず適切に解除される/
  進行中に今週タブへ来ても壊れない)。renderWeekScreen に分岐を足して黙らせるだけの
  対処療法にしないこと
- **防御の追加は可**: renderWeekScreen に `juniorTournament` 用の正規描画
  (「U-20トーナメント進行中」の案内+ジュニア画面へ戻るボタン)を足すのは根本修正と
  併用してよい(復旧UIの「状態を復元」でデータを壊す導線より安全)
- 復旧ボタンがジュニア進行を破壊する場合は、破壊しない復旧(結果を確定してから
  manage に戻す等)へ直す

## 不変条件

1. ジュニア開催年の W24 を通しで進行して、復旧UIが一度も出ない
2. トーナメント結果・careerRecord 履歴(firstRound/quarterFinal/semiFinal/runnerUp/champion)・
   賞金・出場記録が16人/8人/4人ブラケットすべてで完全に記録される
3. 進行中に今週タブ・他タブへ遷移して戻っても進行が壊れない
4. 復旧ボタン(存在し続ける場合)を押しても結果データが失われない
5. `npm test` 全PASS(143/143+新規)/ auto-sim 40年1本 ALL CLEAR(ジュニア年を跨ぐこと)

## テスト

`test/junior-weekphase-lifecycle-test.js`(新規): ジュニア週の weekPhase 遷移列を
ヘッドレスで検証(開始→進行→完了→次phase)。修正前に落ちる形で書き、修正後PASSを確認。

## 完了報告に書いてほしいこと

1. 根本原因(仮説A/Bどちらか、コミット・行番号つき)と、phase ライフサイクルの修正内容
2. 復旧ボタンの副作用調査の結果
3. 不変条件1〜5の確認結果
4. 実機での再現手順と、修正後に出なくなることの確認方法(Keisuke実機確認用)

`docs/worklog.md` 先頭に詳細ログ。
