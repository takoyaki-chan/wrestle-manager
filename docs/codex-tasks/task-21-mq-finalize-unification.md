# Codexタスク21: MQ確定経路の一本化(P1: `Engine.mq.finalize` 新設)

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`
**変更してよいファイル**: `src/management.js`、`src/app.js`、`src/match-engine.js`(タッグattendance移植が必要な場合のみ)、`test/auto-sim.js`(検証用フック追加)、`test/`配下の新規テストスクリプト(`mq-`接頭辞)。
**変更禁止**: 上記以外の`src/`ファイル、`docs/`(worklog.md先頭への完了ログ追記は例外として許可)、`specs/`。

**コミットはOK**(日本語の明確なメッセージで、CLAUDE.mdの手順に従うこと)。**pushは禁止**。配布(release/package-release.ps1等)は絶対に実行しないこと。

---

## 前提資料(必ず読む)

1. `docs/mq-redesign-proposal-v0.3.md` — 確定した設計。特に §1(一本化+profile)、§7(決定記録)
2. `docs/mq-path-unification-survey.md` — 経路差の完全差分(§A表)、呼び出し元一覧(§C)、既存セーブ整合(§D)
3. `docs/mq-inventory-report.md` — §1の計算順序表(現行実装の行番号付き。ただし作成日2026-07-20時点のもので、行番号はズレている)

これらは調査・設計フェーズの成果物であり、本タスクはその決定を実装するフェーズである。**背景の経緯を再調査する必要はない。以下の「確定ポリシー」どおりに実装せよ。**

---

## 背景

MQ(試合クオリティ)の最終確定処理が経路によって別実装になっている。

- `App._finalizeShowImpl`(`src/app.js`、現在の関数開始行は概ね6589付近)— プレイヤーが画面から興行を見るときに通る
- `Engine.executeShow`(`src/management.js`、現在の関数開始行は概ね11306付近)— headless/auto-sim/検証テストが通る

この2経路は「同じ試合」でも最終MQが一致しない(因縁+チェミストリー+タイトルの適用順・クランプ地点・+12外部キャップ・trustペナルティ・マイルストーン加算・ラストラン加算の有無が違う)。CLAUDE.mdのアーキテクチャ5原則「UIはGameStateを直接変更しない/エンジン経由でのみ状態を更新する」にも反する状態である。

**注意: 行番号はすべて2026-07-24時点の目視確認によるものだが、調査資料作成後にコードが変わっている可能性がある。行番号がズレていたら、関数名・コメント・変数名(`MQ_EXTERNAL_CAP`、`mqInventory`、`freshnessBonus`、`milestoneBuffs`、`crowdMQ`等)で周辺コードを検索し、正しい位置を特定せよ。**

---

## ゴール

`src/management.js` 内(`Engine`名前空間、DOMに一切触れない場所)に純粋関数 `Engine.mq.finalize(state, matchResult, context, profile)` を新設し、以下の5経路すべてがこの1関数を呼ぶようにする。

| profile | 適用要素 | 使用経路 |
|---|---|---|
| `normal-single` | 因縁/タイトル/観客・会場/マイルストーン2種(全試合MQバフ・次戦MQバフ)/ラストラン/trust | プレイヤー通常興行・headless通常興行(シングル) |
| `normal-tag` | 観客・会場/ラストラン | 同(タッグ) |
| `ppv` | 因縁のみ | PPV/天頂戦 |
| `ai-show` | 因縁のみ | AI通常興行 |
| `raw` | 補正なし(エンジン素点=最終MQ) | ジュニア大会/春タッグリーグ/秋勝ち残り戦/対抗戦・挑戦状などのイベント戦 |

`Engine.mq.finalize` は**シミュレーション済みのエンジン素点を受け取って最終MQを返すだけ**の関数であり、試合の再シミュレーションは行わない。入力は `matchResult`(エンジン素点・avgOV・特性フラグなどを含む結果オブジェクト)と `context`(因縁レベル、タイトル戦か、観客/会場補正、マイルストーンバフ、ラストラン対象か、trust値など興行文脈)、`profile`名。出力は最終MQと、寄与内訳メタデータ(現行`mqInventory`相当。§4参照)。

---

## 確定ポリシー(すべてこの通りに実装する。再検討しない)

1. **鮮度はMQに一切入れない**。全経路から除去する。UI経路の鮮度加算(`src/app.js` の `Engine.freshness.calc` 呼び出し後、`fr.bonus` をMQへ`Math.min(100, ...)`または`Engine.util.clamp(...)`する箇所。現在の目視確認では6910〜6922行付近)を削除する。**Engine側の鮮度ラベル計算自体(`Engine.freshness.calc`)は削除しない**。鮮度は将来集客計算(P3)へ転用するため、ラベル/カウント算出ロジックは残し、MQへの加減算だけをやめる。
2. **+12外部キャップ(`MQ_EXTERNAL_CAP`、`src/data.js:4353`付近)は実装しない**。関連する `cappedPositive = Math.min(positiveExternal, MQ_EXTERNAL_CAP)` のようなキャップ処理(`src/management.js`の`executeShow`内、現在の目視確認では11575行付近)を撤廃し、正の外部補正はキャップなしで加算する。
3. **段階的な100クランプ(UI経路が各加算段階で`Math.min(100, ...)`する処理)は実装しない**。共通関数内で最終確定は1回だけ行う。
4. **最終は `max(5, ...)` のみ**。上限クランプは設けない(タッグの内部クランプ撤廃はtask-22で扱うため、本タスクでは`normal-tag`最終確定の上限を作らないことだけ守ればよい。タッグエンジン内部100クランプ自体の撤廃はtask-22のスコープ)。
5. **trust・マイルストーン2種(全試合MQバフ・次戦MQバフ)・ラストラン・次戦バフは `normal-single`/`normal-tag` profileに含める**。現行headless(`Engine.executeShow`)の実装が正であり、UI経路には今回初めて適用されることになる(仕様どおり)。
6. **次戦MQバフ(`next_match_mq`)の消費は共通関数側の責務**。現行`Engine.executeShow`内にある消費処理(`src/management.js`、現在の目視確認では11611〜11614行付近、`milestoneBuffs`から`next_match_mq`をfilterして除去)を共通関数へ移す。UI経路でも同様に消費されるよう保証すること(survey資料の食い違い4「UI経路では該当戦を終えてもこの箇所では消費されない」を解消する)。
7. **タイトルのfallback値は削除し、定数+5に一本化する**。現行UI側にある `TITLES.find(t => t.id === 'world')?.mqBonus || 15` のようなfallback(`src/app.js`、現在の目視確認では6631行付近)を、fallbackなしの定数参照(`src/data.js`のタイトルMQ定数を直接参照するか、共通関数内に`TITLE_MQ_BONUS = 5`のような明示定数を持つ)に置き換える。**フォールバックが発火する状況を残さない**こと。
8. **ケミストリー分岐は全経路から削除する**。`Engine.title.getMatchChemistryBonus(pairState)` の呼び出しと加算処理(常に0を返す関数)を、UI経路・headless経路の両方から削除する。関数定義自体(`src/management.js:1790`付近)は他に参照がないか確認した上で、未参照になったら削除してよい(dead code掃除)。
9. **タイトル格差ペナルティのメタデータ**(OVR差から算出される値だが加算処理は既に廃止済み)も、メタデータ生成コードごと削除する。

---

## 実装内容

### 4.1 `Engine.mq.finalize` のシグネチャと返却値

以下は実装の出発点として提示する設計であり、既存コードの構造に合わせて調整してよい(ただし確定ポリシー1〜9は必ず守ること)。

```js
Engine.mq = {
  finalize(state, matchResult, context, profile) {
    // matchResult: { mq: エンジン素点, avgOV, isTag, ...特性フラグ等 }
    // context: { rivalryLevel, isTitle, crowdVenueBonus, milestoneBuffs, isLastRunMatch, lastRunFighter, trustPenaltyFighters, ... }
    // profile: 'normal-single' | 'normal-tag' | 'ppv' | 'ai-show' | 'raw'
    // 戻り値: { mq: 最終MQ, mqInventory: {...内訳メタデータ...}, consumedNextMatchMqBuff: bool }
  }
};
```

呼び出し側は返却値の`mq`をそのまま結果へ反映し、`consumedNextMatchMqBuff`が真なら`state.milestoneBuffs`から`next_match_mq`エントリを除去した新しいstateを組み立てて返す(GameState返却値更新の原則を守ること。共通関数自身がstateを書き換えてはいけない――関数は入力を受けて出力を返す純粋関数であり、`state`の差分適用は呼び出し元が行う)。

### 4.2 UI経路(`App._finalizeShowImpl`)の書き換え

対象: `src/app.js`、`_finalizeShowImpl`(現在の目視確認では6589行付近から)。

- 現在シングルにだけ因縁/ケミストリー/タイトルを個別加算して`Math.min(100, ...)`している箇所(現在の目視確認では6628〜6631行付近)、観客/会場を加算して`Engine.util.clamp(..., 5, 100)`する箇所(6904行付近)、鮮度を加算する箇所(6910〜6922行付近)を**すべて削除**し、代わりに観戦済みの結果(`sp.results`。survey資料 C-1参照)を`Engine.mq.finalize`へ渡して最終MQを得る。
- **再シミュレーション禁止・二重更新禁止**(survey §C-1の注意)。`sp.results`に保持されているエンジン素点・特性フラグをそのまま`matchResult`として使うこと。新しい乱数消費や`simulateMatch`の再実行を発生させてはならない。
- attendance計算(observer count等)は本関数のスコープ外だが、§4.4のattendance移植と合わせて整合を取ること。

### 4.3 headless経路(`Engine.executeShow`)の書き換え

対象: `src/management.js`、`executeShow(state)`(現在の目視確認では11306行付近)。

- 現行のインライン確定処理(因縁→タイトル→観客/会場→マイルストーン→ラストラン→trust→キャップ→クランプ、現在の目視確認では11373〜11614行付近)を`Engine.mq.finalize`呼び出しに置き換える。
- `mqInventory`の生成(現在の目視確認では11499行付近・11587行付近)は共通関数の返却値へ移す。`test/auto-sim.js`が読んでいる`matchResult.mqInventory`のキー構造(§7参照)を壊さないこと。

### 4.4 AI通常興行・PPV・特殊興行の接続

- **AI通常興行**(`Engine.rival.processAIWeek`、`src/management.js`、現在の目視確認では8025行付近。MQ加算は8106〜8112行付近)は`ai-show` profileで`Engine.mq.finalize`を呼ぶ。
- **PPV**(`applyPPVResults`、`src/management.js`、現在の目視確認では13565行付近)は`ppv` profileで呼ぶ。
- **天頂戦**(`_applyMqBonuses`、`src/management.js`、現在の目視確認では24138行付近)も`ppv` profileで呼ぶ。
- **ジュニア大会/春タッグリーグ/秋勝ち残り戦/対抗戦・挑戦状イベント戦**(`resolveEventMatch`含む)は`raw` profileで呼ぶ(=補正なし。エンジン素点をそのまま`Engine.mq.finalize`に通して同じ返却スキーマに揃えるだけでよい。値は変えない)。
- **重要: 因縁の適用範囲は各経路の現行条件を変えない**。適用するかどうかは`context`構築側(呼び出し元)が現行どおり決める。具体的には、PPVは**プレイヤー関与試合のみ**因縁を渡す(survey §C-3「プレイヤー関与戦の因縁」)、AI通常興行・天頂戦は現行の適用範囲のまま。profileが`ppv`/`ai-show`だからといって全試合に因縁を適用してはいけない——`Engine.mq.finalize`は渡された`context.rivalryLevel`を使うだけで、どの試合に因縁が付くかの判定は現行コードの条件を維持すること。
- 呼び出し元の一覧はsurvey資料§Cに詳しい。**全箇所を洗い出して置き換えること。1箇所でも旧ロジックの直書きが残っていないか`grep`で確認せよ**(`getMatchChemistryBonus`、`MQ_EXTERNAL_CAP`、鮮度加算パターンなどが検索の手がかりになる)。

### 4.5 attendance経路差の同時解消

survey A-1 順4〜6、提案書§1.3の該当行に基づき、以下を揃える(MQ確定そのものではないが、同じ関数群を触るため本タスクでまとめて実施する)。

- **タッグのdraw power平均**: 現行Engine側はタッグのmatch appealを専用計算せず0扱いにしている(`src/management.js`、`executeShow`内タッグ早期return部分)。App側の実装(4人のdraw power平均を計算する処理。`src/app.js`、現在の目視確認では6863行付近〜)を正としてEngine側へ移植する。
- **attendanceMultiplier 2種**(`mq_boost.attendanceMultiplier`、`next_match_mq.attendanceMultiplier`。`src/app.js`、現在の目視確認では6877〜6892行付近)をEngine側(`executeShow`)にも適用する。現行Engine側にはこの適用がない。

---

## 受け入れ条件

(a) **同一seed・同一カードでUI経路とheadless経路の最終MQが完全一致するテストを新設する**。`test/`配下に新規スクリプト(`mq-`接頭辞、例: `test/mq-finalize-parity-test.js`)を作成し、同じ試合入力(エンジン素点・因縁・タイトル・観客/会場・マイルストーン・ラストラン・trust条件を複数パターン用意)に対して、UI側の確定ロジックとheadless側の確定ロジックが**同じ`Engine.mq.finalize`呼び出しを経由し、同じ結果になる**ことを検証する。UIの非同期DOM経路そのものをテストする必要はない(`_finalizeShowImpl`内で`Engine.mq.finalize`に渡す直前の`matchResult`/`context`を構築するヘルパーを抽出し、そのヘルパーとheadless側のcontext構築が同じ関数を共有するのが望ましい)。

(b) `node test/auto-sim.js 100 42` が ALL CLEAR(violations 0, errors 0)であること。

(c) headless通常興行(シングル)の平均MQが55.8±1.5に収まること(現行実測55.832±実測σ、確定ポリシーで鮮度除去・trust/マイルストーン/ラストランのUI適用が入るため、多少の変動は許容するが、この帯を外れる場合は原因(どの確定ポリシー項目が効いたか)を完了報告に書くこと。数値そのものの再設計はP3のスコープなので、ここで数値を調整してはいけない)。

(d) `node --check` が対象ファイル(`src/management.js` `src/app.js` `src/match-engine.js` 変更した場合)、および新設テストファイルすべてでpassすること。

---

## やってはいけないこと(スコープ外)

- タッグエンジン内部の100クランプ撤廃(`src/match-engine.js:1730`付近) — **task-22のスコープ**。本タスクでは触らない。
- `state.mqRecord`(歴代最高MQ記録)の新設 — task-22のスコープ。
- 観客/会場補正の値そのものの再設計(平均+4を正負対称帯へ組み替える等) — P3のスコープ。本タスクでは**現行の値をそのまま**共通関数へ移すだけでよい。
- 線形報酬(`eventPerMQ`、`bestMQ×0.3`)の入力飽和処理 — task-22のスコープ。
- `docs/design-decisions.md`等のドキュメント整合修正 — 別タスクのスコープ。
- 新しい乱数消費を伴う変更。既存の`Engine.rng.derive`シード系列を変えてはいけない(乱数シード管理の原則。auto-simのフィンガープリントが変わる変更は避け、変わる場合は理由を明記すること)。

---

## 変更禁止事項(アーキテクチャ5原則)

- エンジン(`Engine.mq.finalize`含む全ロジック)はDOMに一切触れない。
- 状態変更は必ずGameStateの返却値で行う。`Engine.mq.finalize`自身が`state`や`roster`配列を直接mutateしてはいけない。
- UIは`Engine.mq.finalize`の返却値を使ってのみ状態を更新する。UI側に独自のMQ計算式を残さない。
- 乱数シード管理を壊さない。MQ確定処理は既存の乱数消費点を変えない(現行、MQ確定自体は`Engine.rng`を消費していないはずだが、鮮度計算に使っている`appFreshnessRng`等の扱いを変える場合は、乱数消費順序への影響を確認すること)。

---

## 注意書き

- 鮮度除去によりマンネリ抑止(同カード連発への実質ペナルティ)が一時的に消える。これはP3(集客側への移管)とセットで配布前に揃える前提であり、**本タスク完了時点では未完成な状態のまま許容する**。配布(zip梱包・DLsite/BOOTH差し替え)は絶対に行わない。
- 作業はローカルコミットのみ。pushしない。

---

## 報告してほしいこと

1. `Engine.mq.finalize`の最終シグネチャと、5profileそれぞれの適用要素の実装箇所(ファイル:行)
2. 削除したdead code一覧(ケミストリー分岐、タイトルfallback、段階的100クランプ、鮮度MQ加算等)とその行番号
3. 受け入れ条件(a)(b)(c)(d)それぞれの実行結果(コマンドと出力の要約)
4. attendance移植(§4.5)で実際に揃えた箇所と、揃えたことでauto-simの動員/収支数値に有意な変化が出たか
5. 資料と現行コードの間で見つかった追加の食い違いや、行番号が大きくズレていた箇所があれば列挙
6. 実施したコミットのハッシュとメッセージ
