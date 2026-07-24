# Codexタスク22: MQクランプ整理+歴代最高MQ記録制(P2)

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`
**変更してよいファイル**: `src/management.js`、`src/match-engine.js`、`src/app.js`、セーブ移行処理(`src/app.js`のロード/マイグレーション箇所)、`test/auto-sim.js`(計測フック追加)、`test/`配下の新規スクリプト(`mq-`接頭辞)。
**変更禁止**: 上記以外の`src/`ファイル、`docs/`(worklog.md先頭への完了ログ追記は例外)、`specs/`。

**コミットはOK**(日本語の明確なメッセージで、CLAUDE.mdの手順に従うこと)。**pushは禁止**。配布(release/package-release.ps1等)は絶対に実行しないこと。

**前提**: task-21(`docs/codex-tasks/task-21-mq-finalize-unification.md`)が完了し、`Engine.mq.finalize(state, matchResult, context, profile)`が全経路(プレイヤー通常興行/AI通常興行/PPV/天頂戦/ジュニア大会/春タッグリーグ/秋勝ち残り戦)から呼ばれている状態であることを前提とする。**task-21が未完了の場合は着手前に報告し、指示を仰ぐこと。**

---

## 前提資料(必ず読む)

1. `docs/mq-redesign-proposal-v0.3.md` — 特に §2(クランプ整理+mqRecord)、§2.4(線形報酬の保護)、§7(決定記録)
2. `docs/mq-path-unification-survey.md` — §E(タッグの二重クランプの経緯)
3. `docs/mq-inventory-report.md` — §6(下流のMQ参照と100超の安全性の一覧表)
4. task-21の完了報告(`docs/worklog.md`先頭付近、または`Engine.mq.finalize`の実装そのもの)

**行番号の扱い**: 本書内の行番号は2026-07-24時点の目視確認によるものであり、task-21の実装で多くの箇所が変わっている前提である。行番号がズレていたら、関数名・コメント・変数名(`careerBestMQ`、`mqRecord`、`clamp`、`MQ_EXTERNAL_CAP`等)で周辺コードを検索し、正しい位置を特定せよ。

---

## 実装内容

### 1. タッグエンジン内部の100クランプ撤廃

対象: `src/match-engine.js:1730`付近。

```js
const final = clamp(Math.round(ceiling - dramaPenalty - pacingPenalty - finishPenalty + tagBonus - tagPenalty), 5, 100);
```

これを**下限5のみ**(上限クランプなし)に変更する。シングルエンジン(`src/match-engine.js:695-696`付近、`Math.max(5, round(...))`形式)と同じ思想に統一する(survey §E-2 選択肢1)。

タッグ固有ボーナス(出場時間ボーナス・タッチ多様性・ドラマ種別・決着演出)とペナルティ(長区間・出場偏り)の係数自体は変更しない。**上限を外した結果、既存の100シーズンauto-sim実測(タッグ最終MQ平均61.177、最大99近辺)がどう動くかは受け入れ条件(auto-sim ALL CLEAR)で確認する。数値が大きく暴れる場合も、係数の再調整は本タスクのスコープ外(報告のみ)。**

### 2. `state.mqRecord`(歴代最高MQ記録)の新設

```js
state.mqRecord = {
  value: 100,          // 初期値100
  holderIds: null,     // 記録保持者の選手ID配列(2〜4名。同値タイの場合は複数保持)
  orgId: null,          // どの団体の興行で記録されたか
  season: null,
  week: null,
  stage: null,          // 'normal' | 'ai' | 'ppv' | 'tenchosen' | 'junior' | 'springTag' | 'autumnWar' 等、経路を示す文字列
};
```

- **スコープ**: 業界記録(全団体・全経路)を1本のみ。自団体記録・シーズン記録は既存の`careerBestMQ`/`seasonBestMQ`が既にあるため新設しない。
- **更新判定**: `Engine.mq.finalize`を通る全経路の**結果適用箇所**(=最終MQが確定してGameStateへ書き込まれる箇所)で行う。task-21完了時点で確認した実際の適用箇所は以下のとおり(全て要確認。他に見落としがあれば追加すること):
  - プレイヤー通常興行(UI): `src/app.js`、`careerBestMQ`更新箇所(現在の目視確認では7581〜7584行付近)
  - AI通常興行: `src/management.js`、`processAIWeek`内(現在の目視確認では8259〜8260行付近)
  - 対抗戦/イベント戦: `src/app.js`(現在の目視確認では12057〜12058行付近、12072〜12073行付近)
  - PPV: `src/app.js`(現在の目視確認では12189〜12190行付近)、`src/management.js`の`applyPPVResults`周辺
  - 天頂戦: `Engine.growthEvents`等の`_applyMqBonuses`結果適用箇所、および`src/app.js`側のPPV/天頂戦結果反映箇所
  - 春タッグリーグ/秋勝ち残り戦: `src/management.js`(現在の目視確認では13465〜13466行付近が一例。両大会それぞれの結果適用箇所を洗い出すこと)
  - ジュニア大会: 大会結果反映箇所(`Engine.juniorTournament.run`呼び出し後)

  **各箇所で「この試合の最終MQ > `state.mqRecord.value`」なら`mqRecord`を更新する処理を追加する。既存の`careerBestMQ`更新ロジックとは別建てで判定すること(careerBestMQは選手個人の自己ベスト、mqRecordは業界記録であり、更新条件も更新先も別物)。**

  同値(タイ)の扱い: 同じ興行で複数の試合が同時に記録を更新することは通常起きないが、念のため「厳密に上回った場合のみ更新」とし、同値は無視してよい(タイによる複数holderIds付与は同一試合内の複数選手[タッグの場合]のみを想定する)。

- **既存セーブ移行**: `max(100, 全選手のcareerBestMQの最大値)`で初期化する。全選手とは、ロード時点でセーブに含まれる`careerBestMQ`フィールドを持つ全キャラクター――プレイヤー団体roster+AI団体roster+**freeAgents+retiredFighters**(引退済み選手の過去記録も業界記録の一部)を指す。この初期化はセーブロード時のマイグレーション処理(`src/app.js`、既存のセーブバージョン移行パターンに倣う。近傍の`hasOwnProperty('careerBestMQ')`チェック等、既存マイグレーションコードの書式を踏襲すること)に追加する。
- **セーブに移行バージョンを記録する**。既存のセーブバージョニングの仕組み(セーブデータ内のバージョン番号フィールド)を確認し、そこに`mqRecord`移行済みフラグまたはバージョン番号を追加する。**移行処理は1回限り実行されるようにし、既にmqRecordを持つセーブに対して再初期化しないこと。**

### 3. 線形報酬の入力飽和

以下の箇所に`min(MQ, 100)`を入力側で適用する(§2.4)。

- **対抗戦/挑戦状メディア収入**: `src/app.js`の`MEDIA_CONFIG.eventPerMQ`を使う箇所。現在の目視確認では以下の2箇所:
  - `12080`行付近: `Math.round(matchResult.mq * MEDIA_CONFIG.eventPerMQ * b3VenueMult * 1.0)`
  - `13128`行付近: `warMediaTotal += Math.round(r.mq * MEDIA_CONFIG.eventPerMQ * venueMult * 1.5)`

  両方とも`matchResult.mq`/`r.mq`を直接使わず、`Math.min(matchResult.mq, 100)`/`Math.min(r.mq, 100)`を先に計算してから乗算する。

- **MVP/ランキングの`bestMQ×0.3`系**: `src/management.js`、現在の目視確認では`17222`行付近、`+ bestMQ * 0.3`。ここも`bestMQ`を`Math.min(bestMQ, 100)`にしてから使う。**この箇所だけでなく、同じファイル内で`bestMQ`を線形係数(`×0.3`等)で加点している他の箇所がないか`grep`で確認し、見つかった全箇所に同様の飽和を適用すること**(inventory §6に記載の「一部は`bestMQ×0.3`や基準超過分を線形加点」という記述が複数箇所を示唆している)。

  星評価・閾値判定(30/50/70/65/80等の帯判定)、ソート、比較処理には**適用しない**(inventory §6でクラッシュ・下流破壊なしと確認済みのため、変更不要)。

### 4. 記録更新頻度の計測

`test/auto-sim.js`に観測フックを追加し、100シーズンあたりの「業界記録(`state.mqRecord`)更新回数」を報告させる。

- 既存の`mqInventoryProbe`(`test/auto-sim.js:307`付近)と同様のパターンで、`mqRecord`が更新されるたびにイベントを記録するprobeを追加する。
- レポート出力に「100シーズンあたりの記録更新回数」を追加する。
- **目標: 10シーズンあたり0〜2回程度**。大きく外れる場合(例: 毎シーズン更新される、または1000シーズン回しても一度も更新されない)は**その旨を報告するだけでよい。数値調整(mqRecord初期値の変更、外部補正の再設計等)は本タスクのスコープ外**であり、P3以降の課題として扱う。

---

## 受け入れ条件

- `node test/auto-sim.js 100 42` が ALL CLEAR(violations 0, errors 0)であること。
- 記録更新頻度レポート(§4)が完了報告に含まれていること(実測回数と、10シーズンあたりの換算値)。
- `node --check`が変更した全対象ファイル(`src/management.js` `src/app.js` `src/match-engine.js`、新設テストファイル)でpassすること。
- 既存セーブ移行のテスト: 移行前セーブ相当のデータ(`mqRecord`フィールドを持たない旧形式データ)をロードした際に、`mqRecord.value`が`max(100, 全選手careerBestMQ最大値)`で正しく初期化されることを確認する簡易テストまたは手動確認結果を報告する。

---

## やってはいけないこと(スコープ外)

- `Engine.mq.finalize`本体の構造変更(profile追加・削除、確定ロジックの順序変更) — task-21で確定済み。バグがあれば修正してよいが、設計変更はしない。
- 観客/会場補正の値そのものの再設計 — P3のスコープ。
- タッグ固有ボーナス/ペナルティの係数調整 — 本タスクは「100クランプの撤廃」のみが対象。数値が暴れても係数はいじらない(報告のみ)。
- `mqRecord`初期値100や記録更新頻度目標(10シーズンあたり0〜2回)からの乖離を理由とした数値調整。
- 大ニュース新聞システム(週頭通知/一面ジャック/`BIG_NEWS_TYPES`)の実装 — 提案書§5、P4のスコープであり本タスクには含まれない。`mqRecord`を新設するのみで、それを使った演出は別タスク。
- 星評価・閾値判定・ソート処理への`min(MQ,100)`適用 — inventory §6で安全と確認済みのため不要。

---

## 変更禁止事項(アーキテクチャ5原則)

- エンジン側の処理はDOMに一切触れない。
- 状態変更は必ずGameStateの返却値で行う。`mqRecord`の更新も、既存のcareerBestMQ更新と同様に`{ ...state, mqRecord: {...} }`形式の新オブジェクトを返す形にすること(直接mutateしない)。
- 乱数シード管理を壊さない。本タスクの変更はいずれも乱数を消費しない処理のはずである。もし`Engine.rng`の消費順序に影響する変更が必要になった場合は、その旨を報告し、auto-simのフィンガープリントが変わることを明記すること。

---

## 報告してほしいこと

1. タッグ内部クランプ撤廃後の実測MQ分布の変化(平均・最大・上限到達率)
2. `mqRecord`更新箇所の最終一覧(ファイル:行)。前提資料に列挙した箇所と実際に異なっていた場合はその差分
3. セーブ移行の実装箇所とバージョン記録の方式
4. 線形報酬飽和を適用した全箇所の一覧(`eventPerMQ`系・`bestMQ×0.3`系。grepで追加発見した箇所があれば含む)
5. 記録更新頻度レポート(100シーズンあたりの更新回数、10シーズンあたり換算)
6. auto-sim ALL CLEARの実行結果、`node --check`の結果
7. 実施したコミットのハッシュとメッセージ
