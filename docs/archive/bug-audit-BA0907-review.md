# BA-0907 デプロイ前バグ監査レビュー

- 実行日: 2026-09-07
- 対象: `origin/main`(30952f5c, v1.34 デプロイ時点)〜`main`(57a6b429, 396コミット先)の全差分
- 生スキャン結果: `docs/archive/bug-audit-BA0907-origin-main-diff.md`(`tools/bug-audit.ps1 -Mode Diff -BaseRef origin/main`)
- 本ファイル: 上記スキャンの精査結果(playbook の Follow-up に従い1件ずつ判定)

## 0. スキャン手法の補足

`bug-audit.ps1` の Diff モードは「`git diff --name-only $BaseRef` で変更のあったファイル」を**全文**スキャンする(diffハンクだけではない)。今回は396コミット差分のため src/ の主要ファイルほぼ全部が対象になり、生スキャンは総ヒット数 **2,368件**(内訳: week-math少数、state-migration多数、roster-movement 2,100件超、season-stats/ui-wording/phase-routing 数百件)——大半は「ファイルは変更されたが、そのヒット行自体は今回のdiffで変わっていない」既存コードだった。

これを「1件ずつ実質的に精査する」ために、`git diff origin/main..HEAD -- src package.json` から**追加行(+行)のみ**を抽出し、同じ6ルールで再フィルタした。これにより「今回のデプロイで実際に増えた・変わったコード」に絞れる。

| ルール | 重大度 | 生スキャン(全文) | 追加行のみ(実差分) |
|---|---|---:|---:|
| week-math | HIGH | 少数 | 2 |
| state-migration | HIGH | 約190 | 3 |
| roster-movement | HIGH | 約2,100 | 170 |
| season-stats | MEDIUM | 約190 | 10 |
| ui-wording | MEDIUM | 約140 | 231 |
| phase-routing | MEDIUM | 約500 | 20 |
| **合計** | | **2,368** | **436** |

追加行436件のうち、`src/lang-en.js` / `src/lang-en-templates.js` / `src/lang-en-dialogue.js` / `src/lang-en-names.js`(英訳辞書。キー=JA原文、値=EN訳文の対訳データ)が **約215件**を占める。これらは英語対応(Stage B)の対訳追加であり、ロジック変更ではないため個別のバグ判定対象にはならない(構造的な整合性は `npm test` 内の `i18n-ledger-consistency-test.js` 等が機械的に保証しており、今回267/267 PASS)。

残る **約221件**(ロジック/テンプレ定義/表示コード)を1件ずつ精査した。以下、代表例と判定を示す。

## 1. HIGH: week-math (2件)

| ヒット箇所 | 判定 | 根拠 |
|---|---|---|
| `src/ui-common.js:8093` `{n}週`, { n: seasons * 12 } | 無害 | `origin/main` の `src/ui-common.js:7819` に既存の `${seasons * 12}週` と同じ式(素の日本語文字列を `WM_I18N.t()` で包んだだけ)。`management.js` の複数箇所で「1期=12週」という規約コメントが確認でき、レンタル期間(期)→週換算は一貫している |
| `src/ui-common.js:8114` 同上(レンタル加入トースト) | 無害 | 同上 |

## 2. HIGH: state-migration (3件)

新規マイグレーション関数 `migrateLegacySummitPendingEvent`(`src/app.js:80-88`)。旧形式の単独頂上決戦の pendingEvent を検出し、`weekPhase`が`'event'`のときだけ`'manage'`へ戻して解除する。

| 確認観点 | 結果 |
|---|---|
| 呼び出し箇所 | `Storage.deserialize` 内(app.js:2072)のみ。ロード時1回だけ実行される正しい配置 |
| 対応する gameLog テンプレ | `data.js:31864`(GAMELOG_TEMPLATES)と`data.js:32066`(GAMELOG_TYPE_CATEGORY)の両方に`summit_migration_cleared`が登録済み。片方だけ登録漏れという典型パターンには該当しない |
| 他の `'summit'` 参照との整合 | `management.js`の`type === 'summit'`群はイベント**履歴**(誰が頂上決戦を制したかの記録)であり、`pendingEvent.type`とは別の名前空間。混同・誤爆なし |

判定: **無害**(意図通りの一度きり救済マイグレーション)。

## 3. HIGH: roster-movement (170件、lang-en除く約60件)

大半は `WM_I18N.t()` / `_t()` / `_wmFillWithDict()` による**表示文言の翻訳対応ラップ**(退団・引退・レンタル・移籍の完成文をテーブル化し、表示時に現在の言語で組み直す方式=specs §14-3)。ロジックの分岐自体は変えていないことを以下で確認した。

| ヒット箇所 | 判定 | 根拠 |
|---|---|---|
| `management.js:7163-7213`(移籍/レンタル/引退のgameLog完成文) | 無害 | `GAMELOG_TEMPLATES`的な構造をtransfer専用に別テーブル化(`T.transfer`等)しただけ。分岐条件(`ev.via==='poach'`等)は変更なし |
| `management.js:32678` `depKey`(AI契約退団の記事分岐) | 無害 | `AI_CONTRACT_DEPARTURE_TEMPLATES`に`transfer`/`fa`/`dormant`/`default`の4キー全てが定義済み(data.js:19052-19067)。コメント通り「元のif/elseifチェーンの1:1移設」 |
| `management.js:300-333` `saveDoctor.repairOnLoad`内 `_normTraits` 適用 | 無害 | 2026-09-05導入の特性名文字化け(U+FFFD)修復。roster/freeAgents/scoutCandidates/retiredFighters/aiOrgs[].rosterの**全経路**に適用されており、CLAUDE.mdの「呼び出し元を全部数えてから直す」原則に合致。`test/trait-mojibake-repair-test.js`が回帰網、267テストでPASS |
| `app.js:5614` 引き抜き交渉成立時の `transferLog`/`gameLog` 追加 | 無害 | 既存の交渉成立処理に付随するログ追記で、ロジック分岐の変更なし |
| `ui-render.js` / `ui-common.js` のレンタル残週表示群(`c.isRental`, `ct.weeksLeft`等) | 無害 | 表示値の翻訳ラップのみ。参照元データ構造(`G.rentals[].weeksLeft`)は不変 |

判定: **実バグなし**。

## 4. MEDIUM: season-stats (10件)

`peakPop`/`peakFunds`関連はすべて既存の年代記・GAME OVER画面の実績文への翻訳テンプレ追加、または既存表示値(`fmt(summary.peakFunds)`)の`WM_I18N.t()`ラップ。ロジック変更なし。判定: **無害**。

## 5. MEDIUM: ui-wording (231件、lang-en除く約16件)

`残り{n}週`系はすべて既存カウンタ(`weeksLeft`/`remainingWeeks`/`cd.weeksLeft`/`crisisWeeksRemaining`)をそのまま`WM_I18N.t()`に渡しているだけで、内部単位とのズレは確認されなかった。`4団体勝ち残り対抗戦`などの固有名詞も表示文言の翻訳対応のみ。判定: **無害**。

## 6. MEDIUM: phase-routing (20件) — P7-50 挑戦状/派閥イベント ディスパッチ

最重要ヒット。`src/app.js:11268-11282`(`closeShowResult`内、新規追加)。

```js
if (G._pendingFactionEvent || (G.challengeRequest && G.challengeRequest.pendingThisWeek)) {
  setTimeout(() => {
    if (!G || G.weekPhase !== 'manage') return;
    if (G._pendingFactionEvent) {
      const pending = G._pendingFactionEvent;
      const { _pendingFactionEvent: _, ...cleanFeShow } = G;
      G = cleanFeShow;
      App.handleFactionEvent(pending);
    } else if (G.challengeRequest && G.challengeRequest.pendingThisWeek) {
      App.handleChallengeRequest(G.challengeRequest.pendingThisWeek);
    }
  }, 1400);
}
```

`processWeek`側の同種ディスパッチ(app.js:12199-12232、大型>派閥>直訴の優先順位)と比較した。

| 検証観点 | 結果 |
|---|---|
| 大型イベント(`_pendingLargeEvent`)の扱い | `closeShowResult`側では未考慮だが、コメント通り大型/選択イベントは`processManage`の`isShowWeek`ガードで非興行週限定のため、興行クローズ時点では原理的に存在し得ない。除外は妥当 |
| 二重発火の可能性 | 両ディスパッチとも**発火直前にGから最新状態を再読み**して`weekPhase==='manage'`かつ該当pendingが**まだ存在するか**を確認してから消費する設計。片方が先に消費すればフィールドがGから消えるため、後発のタイマーは何もしない(`processWeek`側は`!G._pendingFactionEvent`を明示ガード、`closeShowResult`側は内側の`if (G._pendingFactionEvent)`で実質同じガード) |
| 取りこぼしの可能性 | `weekPhase`が`'manage'`以外(天頂戦/PPV/秋対抗戦等への分岐)なら両者とも何もせず、pendingをGに残したまま次の機会に持ち越す(fail-open)。コメントに2026-09-06実測の具体的な事故(F02演出オーバーレイのクリック不能固まり)と対策が明記されている |

判定: **実バグなし**(既知不具合の修正であり、レース条件・優先順位とも一貫)。ただし多重ディスパッチ経路が2箇所に増えたため、将来この付近を触る際は両方を同時に確認すること(playbookの「兄弟経路比較」対象として明記)。

## 7. 重点確認項目(a)〜(e)

### (a) 追加フィールド方式(specs §14-3)のセーブ互換

`detailTpl`/`detailVars`(career history)、`narrativeParts`(年代記)、`headlineTpl`/`bodyTpl`/`_recompose`(新聞)の3系統すべてで「新フィールドが無ければ旧来の完成文をそのまま返す」fail-open実装を確認:

- `ui-render.js:12542-12551` `narrativeParts`が無ければ`entry.narrative || ''`
- `management.js:7327-7343` `ev.detailTpl`が無ければ`ev.detail || ev.type`
- `ui-render.js:7927-8005` `_recompose`が無ければ`story.headlineTpl`、それも無ければ保存値のまま(フィールド単位で個別fail-open)

実セーブでの検証(後述の動的検証を参照)でも問題なし。

### (b) P7-50 挑戦状ディスパッチ — 上記6章参照。実バグなし。

### (c) P7-36 ティッカー撤去の残参照

`grep`で`ticker`関連の全参照を確認。実行コードからの参照(`App._refreshTicker`呼び出し、`Engine.news.generateTicker`呼び出し、`.news-ticker-bar`セレクタ)は**すべて削除済み**、残るのは削除を記録する説明コメントのみ。旧セーブの`_tickerItems`残留キャッシュは`management.js:589-592`の`saveDoctor`で検出・除去され`ticker_items_removed`ログが残る設計。`relationships.js`の`grievanceTickers`はニュースティッカーとは無関係のローカル変数名(偶然の命名衝突)。判定: **無害**。

### (d) P7-54 特性修正と TRAIT_DEFS の整合

`Traits.has(..., 'ファンサ')` / `'ヒール')` / `'人脈'`の誤字キー呼び出しが**残っていないこと**をコード全体で確認(0件)。`TRAIT_DEFS`の全25キーと、`management.js`/`app.js`/`ui-render.js`/`ui-common.js`/`relationships.js`/`factions.js`の`Traits.has()`呼び出し引数を突合するチェックスクリプトを実行し、機械的にも不一致なしを確認した。

**参考(バグではない・対象外)**: 突合の過程で`management.js`の2箇所(`Traits.has(nc, 'ファンサービス')`＝`'ファンサービス'`、`'ヒール適性'`＝`'ヒール適性'`)がJSのユニコードエスケープ表記になっていることに気付いた。`git blame`で2026-03-13(`f2b42e780`、旧`src/engine.js`時代)由来と判明し、`origin/main`の時点で既に存在(該当行は今回のデプロイ差分に含まれない)。実行時の文字列としては通常表記と完全に同一で、キー自体も既に正しい(`'ファンサービス'`/`'ヒール適性'`)ため機能的な問題はない。表記の一貫性という観点でのみ気になる程度で、修正は指揮官判断に委ねる(該当: `src/management.js` 内、`Traits.has(nc, ...)` を2箇所 `grep -n "u30d5\|u30d2" src/management.js` で特定可能)。

### (e) P7-58 新聞 `_recompose`/Tpl と `newspaperArchive` の旧セーブ互換

静的確認(上記(a))に加え、実際に旧セーブを読み込んでUIを走破し検証した(詳細は次章)。

## 8. 動的検証(実施結果)

| 検証 | 結果 |
|---|---|
| `npm test`(node test/run-all.js) | **267/267 PASS** |
| `node test/ja-golden.js` | **一致**: `hash=e43b8ed4a1e1c641b00e2a675e7305f4a9a8564c1fc5a8e5cf078ad202165cd3`(タスク指定値と完全一致) |
| `node test/auto-sim.js 20 42` | **ALL CLEAR**: violations 0, fingerprint `5a09bc6e`(タスク指定値と完全一致)、台帳検査(給与連続性/更改約束/資金恒等式)違反0 |
| `node test/save-regression.js`(Phase 1・実セーブ6本、save-doctor診断) | **ALL CLEAR**(`duplicate IDs`/`missing IDs`等の既知のsave-doctor指摘のみで新規劣化なし) |
| `node test/ui-walkthrough/run.js --fixture legacy-saves/mobile_S22W47_2026-04-06.json`(P7-58以前発行のnewspaperArchive24号を保持、実UI1季走破) | **PASS**、Issues: 0。Nav tourで`screen-newspaper`を実際に開き、旧号(headlineTpl等の新フィールドを持たない)の表示で例外なし |
| `node test/ui-walkthrough/run.js --fixture legacy-saves/v1.0x_S2W23_2026-03-21.json`(最古世代・`newspaperArchive`フィールド自体が存在しない、実UI1季走破) | **PASS**、Issues: 0。同じく新聞画面を開いて例外なし |

いずれも新規の例外・フリーズ・validateGameState違反は検出されなかった。上記2本のwalkthroughで報告されたOverflow(レイアウトはみ出し)は情報集計であり失敗条件ではなく、今回の差分に起因するものではない(EN文字幅由来の既知事象、`docs/ui-walkthrough-harness-design-v0.1.md`参照)。

## 9. 結論

**実バグ: 0件。デプロイ可。**

- 静的スキャン(追加行436件、lang-en辞書除く実質約221件)を1件ずつ精査した結果、ロジックバグは検出されなかった。ヒットの大半は英語対応(Stage B)に伴う表示文言の翻訳ラップ・テーブル化であり、既存の分岐・カウンタ単位を変更していないことを確認した
- 重点確認項目(a)〜(e)はいずれも設計・実装・動的検証の三段で問題なし。特に(e)は静的確認だけでなく実際の旧セーブ2本(P7-58以前発行の新聞アーカイブを含むものと、`newspaperArchive`フィールド自体が無い最古世代)を実UIで走破し、新聞画面表示での例外がないことを直接確認した
- (d)で発見した`management.js`のユニコードエスケープ表記は今回のデプロイ差分に含まれない旧コード(2026-03-13由来)であり、機能上のバグではないため対応不要(参考情報として記録)
- 既知の未解決事項(`faction-ignite`のJA/EN D5、fixture生成の派閥前提を満たせない件)は本タスクのスコープ外(指揮官が別途対応中)であり、デプロイ可否の判断には影響しない
