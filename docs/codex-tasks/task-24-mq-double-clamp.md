# Codexタスク24: MQの二重クランプを解消し下限を finalize 一本化する（バグA）

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**作業ブランチ（必ず worktree を切って作業すること）**:

```bash
git worktree add ../wm-codex-mqclamp -b codex/bug-a-mq-clamp main
cd ../wm-codex-mqclamp
```

同一ディレクトリで `git checkout -b` しても `.git` と作業ツリーは共有なので分離されない。
**必ず `git worktree` で別ディレクトリを作ること。**
片付けは作業完了・マージ後に `git worktree remove ../wm-codex-mqclamp`。

**変更してよいファイル**: `src/match-engine.js`、`src/management.js`、`src/app.js`、
`test/` 配下の新規テスト、`test/auto-sim.js`（計測フックの追加のみ）。
**変更禁止**: 上記以外の `src/`、`specs/`、`docs/`（`docs/worklog.md` 先頭への完了ログ追記は例外）。

**コミットはOK**（日本語の明確なメッセージ、CLAUDE.md の手順に従う）。**push は禁止。**
配布（`release/package-release.ps1` 等）は絶対に実行しないこと。

**task-23（バグD/E/H）とは別ブランチ・別 worktree で並行して構わない**が、
両方とも `src/management.js` を触るのでマージ時に競合しうる。競合は git が検出するので
潰せばよい（同一ツリーで並行作業しないことのほうが重要）。

---

## 行番号の扱い

本書の行番号は **2026-07-30 時点**。ズレていたら関数名・変数名・コメントで検索して
正しい位置を特定せよ。`src/management.js` は 2 万行超あり、直近のセッションで
`Engine.mq` 周辺（`buildRingInOpts` に `rivalryOnly` 追加）が動いている。

---

## 現象

MQ の下限クランプ（`Math.max(5, ...)`）が**2箇所で二重にかかっている**。

**1段目 — エンジン内部（生スコアの床）**

- `src/match-engine.js:753` シングル: `mq = Math.max(5, mq);`
- `src/match-engine.js:1811` タッグ: `final = Math.max(5, final);`

**2段目 — finalize（外部加算後の床）**

- `src/management.js:2401`:
  ```js
  const external = Object.values(contributions).reduce((sum, value) => sum + value, 0);
  const preLowerClampMq = baseEngineMq + external;
  const finalMq = Math.max(5, preLowerClampMq);
  ```

`normal-single` / `normal-tag` プロファイルでは `contributions.crowd`（会場の熱 × 試合注目度）
が加算される。1段目で床上げされた生スコアに crowd が乗るため、**本来もっと低い凡戦が
注目スロットに置かれるだけで水増しされる**。

### 具体例

生スコア **−8** の凡戦（本当にひどい試合）が、

1. エンジン内部で `Math.max(5, -8)` → **5**
2. finalize で crowd **+8** が乗って → **13**

正しくは `-8 + 8 = 0` → 下限で **5**。**13 ではなく 5** であるべき。

**これは「数値は嘘をつかない」（CLAUDE.md の数値哲学）に反する。**
凡戦を凡戦として見せられないと、本当の名勝負が出たときの感動が薄まる。

---

## 期待する挙動

**MQ の下限クランプは `Engine.mq.finalize` 1箇所に集約する。**
エンジンは生スコアをそのまま返し、床は最後に一度だけかける。

- エンジン内部の `Math.max(5, ...)` を**シングル・タッグ両方から外す**
- `finalize` の `Math.max(5, preLowerClampMq)` は**そのまま残す**（唯一の床）

---

## 不変条件（これを壊したら失敗。数値目標だけ満たしても意味がない）

**変更の性質は「凡戦の水増しを止める」であって「MQ を下げる」ではない。**
したがって以下は必ず成立する。成立しない結果が出たら実装が間違っている。

1. **プレイヤーに見える最終 MQ の下限は 5 のまま。** 5 未満や負値を画面・新聞・記録に
   出してはならない
2. **`raw` / `ppv` プロファイルの最終MQ分布は完全に不変。** これらは `contributions` が
   すべて 0（crowd 加算なし）なので、数学的に結果が変わりようがない。
   **1点でも動いたら実装ミス**（＝床を外した影響が finalize を経由しない経路に漏れている）
   - 該当: ジュニアトーナメント / 春タッグリーグ / 秋4団体勝ち残り対抗戦 /
     対抗戦 / 挑戦状 / B2団体内紛 / PPV GRAND FINAL / 天頂戦
3. **生スコアが 5 以上だった試合の最終MQは不変。** 変わるのは生スコアが 5 未満だった
   試合だけ。良い試合の評価を動かす変更ではない
4. **MQ ≥ 85 の `bigMatch` 履歴の件数は増えない。** 凡戦の水増しを消すのだから、
   増える方向は原理的にありえない。増えたらバグ
5. **`mqRecord`（歴代最高MQ）の更新回数は増えない。** 同上
6. **`Math.max(5, ...)` を別の場所に増やして辻褄を合わせてはならない。** 床は finalize の
   1箇所だけ。「二重クランプの解消」が目的なので、3箇所目を作ったら本末転倒
7. **係数の再調整は本タスクのスコープ外。** 分布が動いたら**報告のみ**。
   `dramaPenalty` / `pacingPenalty` / `transcendOverflow` / crowd 係数には触らない

---

## 実装前に必須の監査（ここが本番）

エンジンが **5 未満（負値含む）の MQ を返すようになる**。
`finalize` を通す前に `result.mq` を読んでいる箇所があると、そこへ負値が流れる。

**「`simulateMatch` の直後から `mq: finalized.mq` の再代入までの間に `result.mq` を
読んでいる箇所」を全経路で洗い出し、報告に一覧で書くこと。**

安全な形（AI団体興行）の例 — `src/management.js:9040` 付近:

```js
let result = Engine.battle.simulateMatch(...);
const finalized = Engine.mq.finalize(state, result, {...}, 'ai-show');
result = { ...result, mq: finalized.mq, ... };   // ← 再代入
// 以降の result.mq 参照(9068〜9184)は finalize 後の値なので安全
```

危険な形は「再代入の前に読んでいる」もの。**特に確認すべき参照先**:

| 参照 | 危険の内容 |
|---|---|
| `careerBestMQ` の更新（`management.js:9122` 付近） | 負値で上書きされないか（`Math.max` なので実害は無いはずだが確認） |
| `bigMatch` 履歴の閾値 `result.mq >= 85`（同 9182 付近） | 判定前に finalize 済みか |
| 成長判定 `closeMatchBonus` / `rawGain`（同 9068・9125 付近） | 負値で成長がマイナスに振れないか |
| `Engine.mq.updateRecord(...)`（歴代記録） | 負値が記録候補に入らないか |
| `Engine.h2h.update(..., matchResult.mq, ...)`（同 10084 付近） | `bestMQ` が負値で汚れないか |
| 人気変動（`Engine.popularity` 系） | MQ を係数に使う箇所で符号が反転しないか |
| `newsEntry.matchMQ`（同 8669 付近）、新聞・ティッカーの表示 | 負値がプレイヤーに見えないか |
| `src/battle-engine.html`（観戦 iframe） | 試合中/決着表示で MQ を出しているなら負値が見えないか |
| `test/auto-sim.js` の MQ 計測フック（`.mq` 参照が39箇所ある） | 平均・分布の集計が負値で壊れないか |

**方針**: プレイヤーに見える経路と記録される経路は、**必ず finalize 後の値を使う**。
finalize を通していない経路が見つかったら、**負値を弾く応急処置ではなく
finalize を通す形に直す**（それが「一本化」の意味）。
どうしても finalize を通せない経路があれば、**直さずに報告して指示を仰ぐこと。**

---

## 計測（必須・条件を揃えること）

`test/auto-sim.js` は `WM_SOURCE_REF=<commit>` で過去コミットのソースを読める。
**同一シード・同一シーズン数で前後比較すること。** 実運用サンプルを並べるのは無効。

```bash
# 修正前（main の先頭 commit hash を入れる）
WM_SOURCE_REF=<main-head> node test/auto-sim.js 100 12345
# 修正後
node test/auto-sim.js 100 12345
```

**100シーズン×1本**でよい（CLAUDE.md の実行方針: 較正判断が必要なときだけ100年1本）。
再現性の確認が必要と判断したら40シーズンで+1シード。**10シード×100年級は回さないこと。**

報告に載せる数字:

- 通常興行の MQ 平均・分布（`MQ>=45 / 60 / 65 / 70 / 80` の各越え率）
- ショー評価★分布（★1〜★5）
- `mqRecord` 更新回数
- `raw` / `ppv` 経路（ジュニア・春タッグ・秋対抗戦・天頂戦）の MQ 平均
  → **不変条件2により完全一致するはず。一致しなければそこで止めて報告**
- `Total violations` / `Total errors` / `Result:` 行

---

## テスト

`test/mq-lower-clamp-single-source-test.js`（新規）。**振る舞いで検査すること。**
ソース文字列を `includes()` で照合するテストは書かない（リファクタで陳腐化する。
`npm run test:stale` が既にこの型の負債を検出している。`test/README.md` 参照）。

見本: `test/tenchosen-rivalry-ringin-test.js`（`simulateMatch` をスパイして引数を検査）、
`test/year-end-awards-generate-test.js`（エンジン関数を直接呼んで返り値を検査）。

検査すること:

1. **`Engine.mq.finalize` の床が唯一であること** — 生スコアを負値にした `matchResult` を
   渡し、crowd が乗る `normal-single` で `baseEngineMq + external` が 5 未満なら
   最終 MQ が **ちょうど 5** になること
2. **水増しが消えていること（本体）** — 生スコア 5 未満 + crowd 正 の組み合わせで、
   最終 MQ が `Math.max(5, 生スコア + crowd)` になること。
   **修正前は `Math.max(5, 5 + crowd)` になっていたので確実に落ちる**
3. **`raw` / `ppv` は不変** — 同じ負値の生スコアを `raw` と `ppv` で finalize して、
   最終 MQ が 5 であること（crowd 加算が無いので床だけが効く）
4. **良い試合は不変** — 生スコア 70 に crowd を乗せた結果が修正前と一致すること
5. **エンジンが床を持っていないこと** — `Engine.battle.simulateMatch` を
   極端に弱い選手同士で回して、**返り値の `mq` が 5 未満になりうる**こと。
   （必ず 5 未満になる入力を作れない場合は、この項目は「生スコアに床が無い」ことを
   `finalize` を通さない直接呼び出しで確認する形に代えてよい。理由を報告に書くこと）

さらに `npm test` が全 PASS（2026-07-30 時点 133/133）。
**既存テストが落ちた場合、それが「床を前提にしていたテスト」なら
テスト側を直してよいが、何を前提にしていたかを報告に必ず書くこと。**

---

## 完了報告に書いてほしいこと

1. **pre-finalize で `result.mq` を読んでいる箇所の全一覧**と、それぞれの安全/危険の判定
2. 危険だった箇所をどう直したか（finalize を通す形にしたか／通せず報告に回したか）
3. 不変条件 1〜7 の各項目について、成立を確認した方法と結果
   - 特に **不変条件2（`raw`/`ppv` の完全一致）** は数字を並べて示すこと
4. 前後比較の計測結果（上記の項目すべて）
5. 分布が動いた箇所の所見。**係数の再調整はしないこと**。
   「この帯が○○動いたので再較正の相談が必要」という形で報告する
6. 修正前に新規テストが落ちることを確認した結果
7. 判断に迷って別の解釈を採った箇所（あれば）

`docs/worklog.md` の**先頭**に詳細ログを追記すること。
`docs/game-system-roadmap.md` と `specs/mq-system-spec-v1.0.md` は触らない（こちらで更新する）。

---

## 参考資料

- `specs/mq-system-spec-v1.0.md` — MQ確定仕様。§2（finalize一本化とプロファイル）、
  §4（リング内効果）。**profile 別の外部加算の表**が不変条件2の根拠
- `docs/mq-redesign-proposal-v0.5.md` — 設計経緯
- `docs/mq-path-unification-survey.md` §E — タッグの二重クランプの経緯
- `docs/mq-inventory-report.md` §6 — 下流のMQ参照と100超の安全性の一覧
- `docs/codex-tasks/task-22-mq-record-and-clamps.md` — タッグの**上限**100クランプを
  外した先行タスク。今回は**下限**の一本化で、同じ思想の続き
