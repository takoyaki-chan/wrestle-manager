# task-81: 完全休眠の旧実装の削除(小分けコミット)

> 完了: 2026-08-02。現行ツリーで全参照を再確認し、対象1〜6をすべて削除した。`_showSpringTagCardIntro` は着手時点ですでに削除済みで、既存回帰テストにより不在を確認した。
> 旧単独頂上決戦はロード時マイグレーションを追加し、古い `pendingEvent.type='summit'` を通常管理画面へ安全に戻す。あわせて、現行の新聞タブへ移管後も残っていた旧データベース内の新聞／因縁列伝の複製も到達不能を確認して削除した。
> 回帰テスト `test/dormant-code-cleanup-test.js` は、削除対象の不在と、加入挨拶・道場コーチ・春タッグ・Common-1予約・PPV頂上決戦・現行新聞1面／3面など置換先の存続を対で検査する。

> 起票: 2026-08-02(Codex到達性調査の引き継ぎ)。**着手はv1.24 push後**(リリース直前の削除は行わない)
> 方針: 1グループ=1コミットで小分け。削除のたびに `npm.cmd test` 全PASS + `node test/auto-sim.js 20 42` 違反0を確認

## 削除対象(Codex調査 2026-08-02 で未接続を確認済み。着手時に現行ツリーで再確認すること)

1. `getWelcomeQuote` — 実際の加入挨拶は `getJoinGreeting`
2. `getHeatStateQuote` — 未接続。現行の熱量表現は道場コーチ台詞経路
3. `_showSpringTagCardIntro` — 春タッグは `renderSpringTagLeagueBoard` 経路へ移行済み
4. Common-1 の旧即時試合一式(task-79の予約化で置換済み。task-79実装時にも削除候補としてworklogに記録あり):
   `App._common1Preview` / `common1WatchMatch` / `common1SkipMatch` / `_receiveCommon1BattleResult` / `_finalizeCommon1Match` / `_renderCommon1MatchPreview`
5. 旧・単独頂上決戦 `checkSummitMatch` — 現行はPPV内 `Engine.ppv.getSummitPair`。
   **⚠️ 削除時は旧セーブの `pendingEvent.type='summit'` 互換を必ず確認**(古いセーブに残存したpendingEventの受け皿を先に用意するか、削除を見送る判断もあり)
6. 旧UI・検証用ヘルパー(プレイヤー機能の欠落なし): `App.focusDraftCandidate` / `setSchedule` / `setIntensive` / `cancelIntensive` / `addTagSlot` / `Engine.factions.pickRandomChoice` / `Engine.autumnWar.runLegacy` / `Engine.awards._legacySelectMVP`

## 注意

- `node test/stale-lint.js` の2件(`_closeShachoshitsuDecisionModal` / `_renderEventPopup`)は**誤検出ではなく仕様**(存在しないことをテストしている)。触らない
- 削除で参照が残らないよう、各シンボルは削除前に**全ファイルgrepで参照ゼロを確認**(HTML内のonclick文字列参照を含む)
- 5番のみリスク有り。他は機械的
