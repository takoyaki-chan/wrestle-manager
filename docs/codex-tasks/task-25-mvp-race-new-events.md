# Codexタスク25: 年間MVPレースに近年実装の大会を反映する

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**作業ブランチ**: `codex/mvp-race-new-events`（`main` から切る。worktree は作らない）

```bash
git switch -c codex/mvp-race-new-events main
```

ブランチ運用（2026-07-30 Keisuke指定）: **Codex はタスク用ブランチを作ってそこで進める。**
`main` に直接コミットしないこと。task-26 と同時に走らせる場合も**同一ブランチに混ぜない**
（1タスク=1ブランチ）。着手前に `git status` が clean であることを確認する。

**変更してよいファイル**: `src/management.js`（`Engine.mvpRace` 一帯のみ）、
`src/ui-render.js`（4面表示で新カテゴリのラベルが必要になった場合のみ・最小限）、
`test/` 配下の新規テスト。
**変更禁止**: 上記以外の `src/`、`specs/`、`docs/`（`docs/worklog.md` 先頭への完了ログ追記は例外）。
**特に `Engine.mvpRace` の外（各大会の history 記録側、`Engine.mq.updateRecord` など）には
一切触らないこと。** 今回は「読む側」だけの変更で完結する。

**コミットはOK**（日本語の明確なメッセージ、CLAUDE.md の手順に従う）。**push は禁止。**
配布（`release/package-release.ps1` 等）は絶対に実行しないこと。

---

## 行番号の扱い

本書の行番号は **2026-07-30 時点**。ズレていたら関数名・変数名・コメントで検索して
正しい位置を特定せよ。

---

## 背景

MVPレース v2（`Engine.mvpRace`、`src/management.js:17245` 付近）は
結果ベースのポイント争いとして年度MVPを可視化するが、`calcSeasonPoints` が読む
history type は **ppvMainEvent / titleWin / titleDefense / domeMain / bigMatch /
war / b3Challenge / b3Decline / b3Rejected** で止まっており、その後に実装された
以下の大会が 1pt も反映されない:

- **天頂戦**（4年に1度のPPVトーナメント、`type: 'ppvTournament'`、`management.js:25723`）
- **秋の4団体勝ち残り対抗戦**（`type: 'autumnWar'`、`management.js:27322`）
- **春のタッグリーグ**（`type: 'springTagLeague'`、`management.js:26469`）
- **MQ歴代記録の更新**（`state.mqRecord` / `state.mqRecordTag` の保持者、`management.js:2543`）

ジュニアトーナメント（`type: 'juniorTournament'`）は **意図的に据え置き**
（新人王と役割が被るため。2026-07-30 Keisuke裁定）。**加点を追加しないこと。**

---

## 加点仕様（2026-07-30 Keisuke承認済み。数値を勝手に変えないこと）

### 1. 天頂戦 — ラウンド勝ち星の積み上げ型

上のラウンドほど1勝が重い。優勝・準優勝の固定ボーナスは小さく（積み上げが本体）。

| 勝ったラウンド | 加点 |
|---|---|
| 1回戦 勝利 | +3 |
| 準々決勝 勝利 | +5 |
| 準決勝 勝利 | +8 |
| 決勝 勝利 | +12 |
| 優勝ボーナス | +6 |
| 準優勝ボーナス | +3 |

history には最終結果しか記録されないが、**シングルエリミネーションなので
result から勝ち星数が一意に決まる**:

| `ev.result` | 勝ち星 | 大会由来の合計 |
|---|---|---|
| `'champion'` | 4勝 | 3+5+8+12+6 = **34** |
| `'runnerUp'` | 3勝 | 3+5+8+3 = **19** |
| `'semiFinal'`（ベスト4） | 2勝 | 3+5 = **8** |
| `'quarterFinal'`（ベスト8） | 1勝 | **3** |
| `'firstRound'`（初戦敗退） | 0勝 | **0** |

勝ち星→加点の変換は「1勝目=+3、2勝目=+5、3勝目=+8、4勝目=+12」の累積。
実装は結果→合計のルックアップでも累積ループでも構わないが、**上の合計と1点も
ズレないこと**（下の不変条件1）。

### 2. 秋の4団体勝ち残り対抗戦 — 個人勝ち星が主役

| 項目 | 加点 |
|---|---|
| 個人勝ち星（`ev.wins`） | **+3/勝** |
| チーム優勝（`ev.result === 'champion'`）全員 | +7 |
| チーム準優勝（`'runnerUp'`）全員 | +3 |
| 準決勝敗退（`'semiFinal'`） | 0（個人勝ち星のみ） |

勝ち抜き戦なのでエースが3タテすれば個人だけで+9となり、チームボーナスを上回る
=「個人の記録の方が大事」という設計意図（Keisuke指示）。

### 3. 春のタッグリーグ

| `ev.result` | 加点 |
|---|---|
| `'champion'` | +8 |
| `'runnerUp'` | +4 |
| `'third'` / `'fourth'` | 0 |

ペア2人それぞれに history が記録されているので、素直に個人単位で加点してよい。

### 4. MQ歴代記録の更新

`state.mqRecord`（シングル）と `state.mqRecordTag`（タッグ）それぞれについて、
**`record.season === state.season` かつ `record.holderIds` に当該選手が含まれる**なら +5。
シングル・タッグ両方を同一シーズンに塗り替えた選手は +10（スタック可）。

`holderIds` は**勝者・敗者の両方**を含む（歴代に残る名勝負は両者のもの、という
既存仕様）。**敗者側にも +5 が付くのは意図どおり**。勝者だけに絞らないこと。

---

## 実装ガイド

### POINTS への追加（`management.js:17247` 付近）

既存の命名スタイルに合わせる。例:

```js
TENCHOSEN_WIN_R1: 3,
TENCHOSEN_WIN_QF: 5,
TENCHOSEN_WIN_SF: 8,
TENCHOSEN_WIN_FINAL: 12,
TENCHOSEN_CHAMPION_BONUS: 6,
TENCHOSEN_RUNNER_UP_BONUS: 3,
AUTUMN_WAR_PER_WIN: 3,
AUTUMN_WAR_TEAM_CHAMPION: 7,
AUTUMN_WAR_TEAM_RUNNER_UP: 3,
SPRING_TAG_CHAMPION: 8,
SPRING_TAG_RUNNER_UP: 4,
MQ_RECORD_BREAK: 5,
```

**既存の POINTS 値（PPV_CHAMPION: 30 ほか）は一切変更しない。**

### calcSeasonPoints（`management.js:17290` 付近）

- 既存の `hist.forEach` に `ppvTournament` / `autumnWar` / `springTagLeague` の分岐を追加。
  **`ev.season !== season` の早期 return は既存のまま効かせる**（天頂戦の非開催年に
  過去大会分が漏れ込まない根拠）
- MQ記録ボーナスは history ではなく `state.mqRecord` / `state.mqRecordTag` を直接見る
- `points` の合算式に新カテゴリを追加
- `breakdown` に数値キー `tenchosen` / `autumnWar` / `springTag` を追加。
  MQ記録ボーナスは既存の `mq` カテゴリに合算してよい
- `breakdown.meta` に表示用の生データを追加:
  `tenchosenResult, autumnWarResult, autumnWarWins, springTagResult, mqRecordBroken`
  （命名は既存 meta の流儀に合わせて調整可）

### ナラティブ / 4面表示

- `_topElements`（`management.js:17637` 付近で使用）に新カテゴリのラベルを追加し、
  上位入りの理由として「天頂戦優勝」「対抗戦の勝ち星」等が文中に出られるようにする
- **プレイヤーに見える文言に内部トークンを出さない**
  （`ppvTournament` / `autumnWar` / `springTagLeague` / `MQ` は不可）。表記は
  「天頂戦」「4団体勝ち残り対抗戦（または対抗戦）」「春のタッグリーグ」「歴代最高の試合評価」
- タグライン/ナラティブの定型文を新カテゴリ用に増やすかは任意。増やす場合は
  既存文のトーン（`management.js:17586` 付近）に合わせ、**テンプレの量産はしない**。
  最小限（各1〜2本）でよい
- `src/ui-render.js` の4面レンダラ（`_renderNp4` 系、8004行付近）が
  カテゴリをハードコードしていないか確認し、必要な場合のみ最小限の追随

---

## 不変条件（これを壊したら失敗。数値目標だけ満たしても意味がない）

1. **天頂戦の大会由来合計は 優勝34 / 準優勝19 / ベスト4 8 / ベスト8 3 / 初戦敗退 0。**
   1点でもズレたら実装ミス。さらに序列として
   `34 > PPV_CHAMPION(30)`（4年に1度は毎年の頂点より重い）、
   `15 < 19 < 30`（準優勝はPPV準優勝と優勝の間）、
   `3 <= BIG_MATCH_MQ90(4)`（ベスト8はビッグマッチ1本ぶん以下）が成立していること
2. **天頂戦・非開催年のポイント寄与は全選手 0。** `ev.season === season` フィルタで
   保証されるが、テストで明示的に確認すること
3. **勝ち残り対抗戦の理論上限（1人で6勝+チーム優勝）は 6×3+7 = 25 < 34。**
   個人がどれだけ暴れても天頂戦優勝を超えない設計
4. **該当 history を持たない選手のポイントは修正前後で完全一致。**
   新カテゴリ以外の項目（ovr/ppv/title/dome/mq/war/b3/orgRank/draw）の計算式には
   1文字も触らないこと
5. **引退選手経路でも同じ加点が効くこと。** `recalcRanking` の retiredFighters 分岐は
   同じ `calcSeasonPoints` を通るので自然に成立するはずだが、確認して報告に書く
6. **プレイヤーに見えるテキストに内部トークンが出ないこと**（上記の表記ルール）
7. **既存 POINTS 値・既存カテゴリの計算式の変更、および数値の再チューニングはスコープ外。**
   分布への所見があれば報告のみ

---

## テスト

`test/mvp-race-new-events-test.js`（新規）。**振る舞いで検査すること**
（ソース文字列 `includes()` 照合は禁止。`test/README.md` 参照）。
見本: `test/year-end-awards-generate-test.js`（エンジン関数を直接呼んで返り値を検査）。

`Engine.mvpRace.calcSeasonPoints` に合成の fighter オブジェクト
（`careerRecord.history` に必要なイベントだけ入れたもの）と最小限の state を渡して:

1. 天頂戦: result 5種それぞれで大会由来の増分が 34/19/8/3/0 になること
   （history なしの同一選手との差分で検査する）
2. 天頂戦: `ev.season` が現シーズンと異なる場合、増分 0
3. 勝ち残り対抗戦: `{result:'champion', wins:2}` → +13、`{result:'semiFinal', wins:1}` → +3、
   `{result:'runnerUp', wins:0}` → +3
4. 春のタッグリーグ: champion +8 / runnerUp +4 / third 0
5. MQ記録: `state.mqRecord = { value:96, holderIds:[fighterId, 相手id], season: 当該シーズン }`
   で +5。シングル+タッグ両方で +10。`season` が過去なら 0。
   **holderIds の2番目（敗者想定）でも +5 が付くこと**
6. 回帰: 新カテゴリの history を持たない選手のポイントが、各カテゴリ 0 のまま
   （breakdown の新キーが 0 で、合計が既存項目の和に一致）

さらに `npm test` が全 PASS（2026-07-30 時点 133/133）。

## 計測

`src/management.js` を編集するとフックが自動で100シーズン（5シード×20）を回す。
**追加の手動長時間 sim は不要**（CLAUDE.md の実行方針）。フックの
`Total violations` / `Result:` 行を報告に転記すること。

余力があれば 40 シーズン 1 本（`node test/auto-sim.js 40`）を回し、
天頂戦開催年（season%4==0 の年）の `mvpRace.rankings` 上位に天頂戦優勝者が
入っているかを目視スポットチェックして所見を書く（必須ではない）。

---

## 完了報告に書いてほしいこと

1. 不変条件 1〜7 の各項目について、成立を確認した方法と結果（1は数字を並べる）
2. 新規テストの一覧と、修正前のコードでは落ちることを確認した結果
3. フック auto-sim の結果行
4. `_topElements` / ナラティブ / 4面表示に追加した文言の**全文**
   （文章系は全文チェックを受けるのがこのプロジェクトのルール）
5. 判断に迷って別の解釈を採った箇所（あれば）

`docs/worklog.md` の**先頭**に詳細ログを追記すること。
`docs/game-system-roadmap.md` と specs は触らない（こちらで更新する）。

---

## 参考資料

- `src/management.js:17242` 付近 — `Engine.mvpRace` 本体（POINTS / calcSeasonPoints /
  recalcRanking / ナラティブ生成）
- `src/management.js:25711` — 天頂戦の history 記録（`_recordCareerResults`。
  result の値域はここで確認できる）
- `src/management.js:27318` — 勝ち残り対抗戦の history 記録（result + wins）
- `src/management.js:26464` — 春のタッグリーグの history 記録（rank→result 変換）
- `src/management.js:2543` — `Engine.mq.updateRecord`（mqRecord / mqRecordTag の形）
- `specs/quadrennial-ppv-tournament-spec-v0.1.md` / `specs/autumn-gauntlet-war-spec-v0.1.md` /
  `specs/spring-tag-league-spec-v0.1.md` — 各大会の仕様
- `plans/mvp-race-and-page4-plan-v2.md` — MVPレース v2 の設計経緯
