# タスク52: 新年号を「第1週に入った時点」で発行し、通知も第1週に出す

**作業場所**: main の作業ツリーで直接。worktree は作らない。
**コミットはしない**(変更を残すだけ)。push・配布禁止。

**変更してよいファイル**: `src/management.js`(`Engine.advanceWeek` のシーズン移行部と
`Engine.newspaper` 周辺のみ)、`src/app.js`(`_maybeShowBigNewsPopup` とその呼び出し)、
`src/ui-render.js`(新聞の題字表示のみ)、`test/` 新規、`docs/worklog.md` 先頭。
**変更禁止**: 上記以外。`src/data.js` のセリフ・記事テンプレ定数には触らない。

---

## Keisuke 指示(2026-07-31)

> 新聞に関しては**第1週で出したい**です。1週にまとめて出るのが嫌がっているのだったら、
> それは心配することはないです。もう1面、2面と同じ週に出ても、
> **どんどん重ねて増やしていって結構**ですよ。

## いまの構造(調査済み・これが前提)

- 新聞は `Engine.tickWeek` の末尾で生成される(`src/management.js:12431-12441`)。
  **その週を処理し終えた時点**で作られ、`week: state.week` が刻まれる
  (`src/management.js:28402` 付近の `generate` の戻り値)。
- オフシーズン中は発行されない(`if (!s.offSeason)`)。引退・殿堂入り・他団体の動きは
  `_industryNewsEvents` に溜まったまま、**翌シーズン第1週の号**にまとめて載る。
- 大ニュース通知 `App._maybeShowBigNewsPopup`(`src/app.js:10287` 付近)は
  週処理の中から `setTimeout` 付きで呼ばれる(`src/app.js:10222` / `11184` 付近)。
  その直後に週が進むので、**通知が出るころには画面は次の週**になっている。
- 結果、新年号の通知は**第2週の画面で鳴る**。これが指摘対象。

## 直す形

### A. 新年号を「第1週に入った時点」で発行する

`Engine.advanceWeek` のシーズン移行(`src/management.js:16205` の
`season: s.season + 1, week: 1, offSeason: false, offWeek: 0, ...` を作るブロック)の
**あと**で、新年号を1号発行する。

- 発行前に、直前の号(前シーズン最終週の号)を `newspaperArchive` の先頭へ退避する。
  **tickWeek と同じ手順**(`src/management.js:12433-12439`)を使うこと。上限24号も同じ
- `Engine.newspaper.generate(s, rng)` で生成する。オフシーズンに溜まった
  `_industryNewsEvents` はここで消化される
- **載り切らなかった分の持ち越し処理も tickWeek と同じにする**
  (`unpublishedIndustryEvents` / `INDUSTRY_CARRY_MAX` / `INDUSTRY_CARRY_MAX_AGE`)。
  ここを省くと、オフシーズンに溜まった記事が黙って消える
- 乱数は必ず `Engine.rng.derive` から作る(アーキテクチャ原則4)。
  週次の号と同じ種を使うと同じ抽選になるので、**別の定数を混ぜる**こと
- 生成した号に `isSeasonOpening: true` を立てる
- `playerShowData` は必ず `null` にする(この時点で今シーズンの興行はまだ無い。
  前シーズンの興行データが新年号に混ざってはいけない)

**tickWeek 側は変更しない。** 第1週を処理し終えた時点で通常どおり第1週の号が生成され、
新年号はその時点でアーカイブへ落ちる。**同じ週に2号出るのは想定どおり**(Keisuke 承認済み。
「1面、2面と同じ週に出ても、どんどん重ねて増やしていって結構」)。

### B. 新年号だと分かるようにする

新聞画面の題字/号数表示で、`isSeasonOpening` が立った号は
**「新年号」と分かる表記**にする(`S2 W1` と2号並ぶので、区別が付かないと混乱する)。
既存の題字まわりのスタイルに合わせること。**新しい16進カラーを増やさない。**

### C. 通知を第1週で鳴らす

`App._maybeShowBigNewsPopup` の `isSeasonOpening` 判定
(`!G.offSeason && G.week === 1 && (G.season||1) > 1`)を、
**第1週に到着した時点**で通る経路から呼ぶ。

- 呼び出し位置は `App.advanceWeek` の中、週が進んで `refreshAll()` した後が素直
  (`src/app.js:11412` 付近)。**特別興行や交渉フェーズへ return する分岐より後**に
  置かないと、それらの年には鳴らない
- 既存の `_bigNewsNotifiedWeek`(`${season}:${week}` キー)による1回だけの制御は
  **そのまま使う**。これで、あとから第1週を処理し終えたときに二度鳴らない
- **通常週の大ニュース通知の挙動は変えない**(今回の対象は新年号だけ)

## 不変条件

1. **オフシーズンに溜まった記事が1本も消えない**。新年号に載らなかった分は
   持ち越されて後続の号に出る(tickWeek と同じ持ち越し規則)
2. **新年号と第1週号が両方アーカイブに残る**。上書きで消えない
3. 通知は **1シーズンにつき1回だけ**。第1週で鳴ったら、第1週の処理後に再度鳴らない
4. **1年目(season 1)には新年号を出さない**(前シーズンが無いので中身が無い)
5. 乱数はシードから導出する。`Math.random()` / `Date.now()` を使わない
6. `Engine.validateGameState` が新しい違反を出さない
7. `node test/run-all.js` 全PASS(163/163 + 新規)
8. **`node test/auto-sim.js 40` が ALL CLEAR**。エンジンを触るので必須。
   実行結果(violations / errors / fingerprint)を報告に貼ること

## テスト

`test/new-year-issue-test.js`(新規):
- シーズン移行後(season 2 week 1 到着時点)に `weeklyNewspaper` が存在し、
  `isSeasonOpening` が立ち、`week === 1` であること
- 前シーズン最終週の号が `newspaperArchive[0]` に入っていること
- オフシーズンに積んだ `_industryNewsEvents` が新年号で消化され、
  溢れた分が持ち越しリストに残ること(1本も消えない)
- **1年目には新年号が作られない**こと
- 同じ state から2回作っても結果が同じこと(シード再現性)

## 完了報告

1. 新年号の発行箇所(ファイル:行)と、tickWeek 側と**どこを共通化したか**
   (同じ手順を2箇所に書き写すと必ず片方だけ古くなる。共通化できるなら関数に切る)
2. 持ち越し処理が tickWeek と同じであることの確認方法
3. 通知が第1週で1回だけ鳴ることを、どの経路で確認したか
4. 新年号の題字表示の実際の文字列
5. 不変条件1〜8の確認結果(auto-sim の出力を貼る)
6. 迷った点があれば**実装せずに質問として残す**

`docs/worklog.md` 先頭に詳細ログ。
