# Codexタスク23: 個別バグ2件の修正（E / H）

> **2026-07-30 更新**: バグD（天頂戦のエントリー再抽選）は **Keisuke 裁定により修正不要**となった。
> 「再抽選は面倒なので、当日か直前選定で良い」＝現在の当日再選定の挙動を正とする。
> 本書から削除済み。経緯は末尾の「バグD: 対応しないことにした経緯」を参照。

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**作業ブランチ**: `codex/bug-eh`（`main` から切る）

```bash
git switch -c codex/bug-eh main
```

**すでに専用の作業ツリー（Codex アプリが用意する `~/.codex/worktrees/...` 等）に居る場合は、
上のブランチ作成だけを行い、新たに worktree を作らないこと。** 入れ子の worktree ができる。

**メインの作業ディレクトリで作業する場合に限り**、先に隔離すること。同一ディレクトリで
`git checkout -b` しても `.git` と作業ツリーは共有なので分離されず、2026-07-30 に別セッションと
変更が混在してコミットを分離できない事態が起きている。

```bash
git worktree add ../wm-codex-eh -b codex/bug-eh main
cd ../wm-codex-eh
```

いずれの場合も、**着手前に `git status` が clean であることを確認する。**
他セッションの未コミット変更が残っていたら、混ざる前に報告して指示を仰ぐこと。

**変更してよいファイル**: `src/management.js`、`src/factions.js`、`test/` 配下の新規テスト。
**変更禁止**: 上記以外の `src/`、`specs/`、`docs/`（`docs/worklog.md` 先頭への完了ログ追記は例外）。

**コミットはOK**（日本語の明確なメッセージ、CLAUDE.md の手順に従う）。**push は禁止。**
配布（`release/package-release.ps1` 等）は絶対に実行しないこと。

**2件は独立した修正なので、1件ずつ別コミットにすること。**

---

## 行番号の扱い

本書の行番号は **2026-07-30 時点** の目視確認によるもの。ズレていたら関数名・変数名・
コメントで検索して正しい位置を特定せよ。特に `src/management.js` は 2 万行超あり、
直前のセッションで `Engine.awards` と `Engine.mq` 周辺が動いている。

---

## 受け入れ条件（2件共通）

1. `npm test` が **全 PASS**（2026-07-30 時点で 132/132）
2. `node test/auto-sim.js 20 12345` が **ALL CLEAR**（violations 0 / errors 0）
3. 各バグにつき**振る舞いを検査するテストを1本追加**すること
   - **ソース文字列を `includes()` で照合するテストは書かないこと。** リファクタで陳腐化する。
     `npm run test:stale` が既にこの型の負債を検出している（`test/README.md` 参照）
   - 書き方の見本: `test/tenchosen-rivalry-ringin-test.js`（`simulateMatch` をスパイして
     実際に渡る引数を検査する）、`test/year-end-awards-generate-test.js`（エンジン関数を
     直接呼んで返り値を検査する）
4. 修正前のコードで**そのテストが確実に落ちること**を確認して、報告に書くこと

---

# バグE: 秋対抗戦と同じ週に引き抜かれた選手が大会の成果を失う

## 現象

`src/management.js:13508` `Engine.transfer.resolvePoach(state, fighterIdToRelease, accepted)`。

引き抜きオファーは `s.pendingPoach` に**選手オブジェクトのスナップショット**として積まれる
（`pendingPoach: poachAttempts` / 13498行付近）。承諾処理はそのスナップショットを移籍先へ渡す。

```js
let resetFighter = Engine.popularity.applyTransferReset({ ...poach.fighter, orgId: targetId });
```

`poach.fighter` は**オファー生成時点の姿**。オファー生成と承諾のあいだに本人が
秋の4団体勝ち残り対抗戦へ出場していると、その週に付いたはずのものが消える。

- `careerRecord.history` の `{ type: 'autumnWar', season, result, wins }`（`management.js:27215` 付近）
- 大会MVPの人気 +5（`management.js:27263` 付近 `bumpMvp`）

**結果**: 移籍先で本人の経歴から大会出場が消え、殿堂ポイント（`autumnWar` は勝ち抜き+1.5 /
優勝+2 / 3人抜き以上+2）も失われる。年代記にも残らない。

## 期待する挙動

移籍先へ渡す選手は、**その時点の生きているロスターの姿**を基準にする。
スナップショットは「オファーの内容（移籍金・相手団体）」を保持するためだけに使う。

## 実装方針

`resolvePoach` の承諾分岐で、移籍させる選手の実体を**現ロスターから引き直す**。

```js
// pendingPoach のスナップショットはオファー内容（移籍金・相手団体）の保持用。
// 選手の実体は「今のロスター」から引く。オファー生成から承諾までの間に大会へ
// 出場していると、スナップショットには経歴も人気加算も入っていない。
const liveFighter = (s.roster || []).find(c => c.id === fighterIdToRelease) || poach.fighter;
```

以後 `poach.fighter` を選手の実体として使っている箇所を `liveFighter` に差し替える。
**移籍金 `poach.fee` と相手団体 `poach.org` はスナップショット側を使い続ける**（改変しない）。

## 注意

- `applyDepartureTrustImpact` に渡している `{ name: poach.fighter.name, ... }` は表示名だけ
  なのでどちらでもよいが、揃えておくほうが読みやすい
- 拒否分岐（`accepted === false`）にも同種の参照があれば同じ扱いにする
- 同じ「スナップショットを使っている」構造が他の移籍経路（`suddenDeparture` /
  `contractEnd` / AI間移籍）にもあるかを**確認して報告**すること。
  見つかっても**本タスクでは直さない**（スコープ外・報告のみ）

## テスト

`test/poach-live-fighter-test.js`（新規）。

- ロスターに選手1名、`pendingPoach` にその選手の**古いスナップショット**（`careerRecord.history`
  が空・`popularity` が低い）を積む
- 現ロスター側の同一IDには `autumnWar` の history と高い `popularity` を入れておく
- `resolvePoach(state, id, true)` を呼ぶ
- 検査:
  - 移籍先AI団体のロスターに入った選手が **`autumnWar` の history を持っている** ← 本体
  - 人気が古いスナップショットの値ではないこと（`applyTransferReset` の減衰後の値で比較する。
    リセット処理の係数には触らないので、**スナップショット基準の期待値と一致しないこと**を見る）
  - プレイヤーの `funds` が `poach.fee` ぶん増えていること（オファー内容が壊れていない確認）

---

# バグH: 引退時に派閥のメンバーIDが掃除されない

## 現象

`src/management.js:6533` `Engine.retire.commitRetirements(state, confirmedFighters)`。

引退確定でロスターから外す（6552行 `surviving`）が、**`state.factions[].memberIds` は触らない**。
そのため引退した選手のIDが派閥に残る。

現状すでに救済はある。`src/factions.js:1161` `reconcileRoster(state, rng)` が
ロスター不在のメンバーを毎週落としている（1189行）。

```js
const filtered = f.memberIds.filter(id => id === f.leaderId || rosterIds.has(id));
```

ただし `reconcileRoster` は **`management.js:12135` の「派閥イベントが発動しなかった週」の
分岐でしか呼ばれない**。イベントが発動した週はスキップされる。
つまり不整合は**次にイベントが起きなかった週まで残る**。

**severity は低い（下流はガード済み・データ衛生の問題）。** ただしオフシーズン中は
派閥パイプラインが回らないため、引退直後からシーズン開幕までずっと残る。

## 期待する挙動

引退でロスターから外すのと**同じ場所で**派閥からも外す。
週次の救済に頼らず、state が常に整合している状態にする。

## 実装方針

`commitRetirements` の 6556行付近（`roster: surviving` を設定している箇所）で、
`retireeIds` を使って `factions[].memberIds` からも除外する。

```js
// 引退でロスターから外すのと同時に派閥からも外す。factions.reconcileRoster の
// 週次救済は「派閥イベントが発動しなかった週」しか回らず、オフシーズン中は
// 走らないため、ここで整合させる。
```

**リーダーの扱いに注意。**

- `memberIds` から単純に消すだけでは、**リーダーが引退した派閥がリーダー不在になる**
- リーダー喪失の正規経路は `Engine.factions.handleLeaderLoss(state, factionId, rng)`
  （`factions.js:1183` 付近から呼ばれている）
- したがって:
  - **引退者がリーダーでない** → `memberIds` から除外するだけ
  - **引退者がリーダー** → `memberIds` はそのままにし、既存の `handleLeaderLoss` 経路に
    委ねる（`reconcileRoster` がリーダーを filter から除外しているのと同じ理由）。
    ここで独自にリーダー継承を書かないこと

## テスト

`test/retire-faction-cleanup-test.js`（新規）。

- 派閥1つ（リーダー1名＋メンバー2名）を作る
- **メンバー1名**を `commitRetirements` で引退させる
- 検査:
  - その ID が `factions[0].memberIds` から消えていること ← 本体
  - リーダーと残りメンバーは残っていること
  - `retiredFighters` に入り `roster` から消えていること
- **リーダーを引退させたケース**も1件見る:
  - `memberIds` を勝手に壊していないこと（`handleLeaderLoss` に委ねる設計の確認）

---

## 完了報告に書いてほしいこと

1. 2件それぞれの**修正前にテストが落ちること**を確認した結果
2. `npm test` の集計行と `auto-sim 20 12345` の Result 行
3. バグE の「他の移籍経路にも同じスナップショット構造があるか」の調査結果
4. 判断に迷って別の解釈を採った箇所（あれば）

`docs/worklog.md` の**先頭**に詳細ログを追記すること。
`docs/game-system-roadmap.md` は触らない（こちらで1行更新する）。

---

# 付録: バグD「天頂戦のエントリー再抽選」を対応しないことにした経緯

**2026-07-30 Keisuke 裁定: 「天頂戦の再抽選は面倒なので、当日か直前選定で良い」**

`src/management.js` `Engine.ppvTournament.ensureReady(state)` は Week48 の開催直前に
出場16名を再検証し、1名でも無効（不在／怪我／レンタル／乱入）だと `startEntry` を
呼んでエントリー全体を組み直す。プレイヤーが選んだ有効な選手は `previousPlayerIds` で
拾い直すが、特別招待2名とAI団体枠は再抽選され、シード配置も変わる。

`specs/quadrennial-ppv-tournament-spec-v0.1.md` 46行目は
「怪我・レンタル等の除外条件に該当する場合は次点繰り上げ」と書いており、
**実装は仕様と食い違っている**。

当初は「無効エントリーだけを seed 維持で差し替える」実装を指示する予定だったが、
**その複雑さに見合わないという判断で、当日再選定を正とする裁定になった。**
出場者は当日（または直前）に確定するもの、という扱いにする。

したがって:

- **コード変更なし**（現在の挙動が正）
- 仕様書側を実装に合わせて更新済み

**この件を再度タスク化しないこと。**
