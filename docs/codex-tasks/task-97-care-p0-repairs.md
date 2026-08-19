# task-97: care-rework2 P0 機械修理(招聘市場バグ・休暇赤字・小骨)

- **作業場所**: `C:\Users\nkmrk\Downloads\wrestle-manager-codex`(ブランチ `codex/agent-workspace`)。mainフォルダは触らない
- **前提知識**: `docs/care-rework2-plan-v0.1.md` §1.5(バグ台帳G1〜G14)と§3 P0。本タスクは **G1/G2/G3/G4/G6/G8/G10/G11(文言のみ)** を修理する
- **後続**: task-98(丸め+計装)が同じmanagement.jsを触る。**本タスクを先に完了・コミットしてからtask-98に着手**

## 目的

care-rework2 P0のうち「数値バランスの意図的変更を含まない」機械修理8件。招聘市場の抽選公平化・出禁解除・自動継続の罠除去、休暇辞令の信頼赤字解消、テーブル欠落補充、UI空振り解消。

## 仕様の正

- `docs/care-rework2-plan-v0.1.md` §1.3 / §1.5(現象と根拠行番号)
- `specs/shachoshitsu-care-rework-spec-v1.0.md` §3.1(招聘市場「1回休み」)
- 行番号は調査時点のもの。ずれていたら周辺を検索して特定すること

## 触ってよいファイル

`src/management.js` / `src/app.js` / `src/ui-common.js` / `src/ui-render.js` / `src/data.js`(G6の1行追加のみ)

## 触ってはいけないファイル

`src/match-engine.js` / `src/relationships.js` / `test/`(本タスクでは変更しない) / specs・docs(記帳はFableが行う)

## 修理内容

### G1: 偏りシャッフルをFisher-Yatesに置換(2箇所)

- `rollInviteMarket`(management.js:22825付近)の `[...eligible].sort(() => Engine.rng.float(rng) - 0.5)` と、雇用募集プール生成(management.js:7907付近)の同型を、**Engine.rngの同じrngストリームを使うFisher-Yatesシャッフル**に置換
- **不変条件**: 候補数(招聘2〜3名/雇用5〜8名)・除外条件・rngのシード導出は変えない。乱数消費回数の変化は許容(裁定済み)

### G2: 招聘済みコーチの「永久出禁」を仕様どおり「1回休み」に

- 現状: `lastInvitedCoachId` がセットされるだけで一切クリアされず、該当コーチが二度と市場に出ない
- 修正: **市場の再抽選(periodKey変化時)で除外を1回適用したら消費済みにする**(例: 再抽選時に除外を適用した上で `lastInvitedCoachId` をnullへ)。受け入れ挙動: Q1にコーチXを招聘 → Q2市場にXは出ない → Q3以降は出うる
- 自動継続(tickInviteBuffsの更新パス)が `lastInvitedCoachId` を再セット・延命しないことも確認する
- **不変条件**: 除外そのもの(直後1回)は維持。同時1件制は変えない

### G3: 自動継続の罠除去

1. `ui-common.js:8831` 付近の自動継続チェックボックスの `checked` を外す(**デフォルトOFF**)。残り週の表示が既にあるか確認し、なければ選手選択画面の自動継続チェック横に「(4週ごとに費用と決裁枠2を再消費)」の注記を足す
2. **消化力逓減の対称化**: 自動継続パス(management.js:22968-22982付近)は `_lastInviteEndWeek` を書かずに新バフを張るため逓減が一切掛からない。修正: **自動継続で開始する新4週バフの倍率は、同週に手動で同一コーチを再招聘した場合と同一の逓減計算を通す**(連続指導は2期目以降、1.0超過分が半減する)
- **不変条件**: 初回4週(継続でない招聘)の倍率計算は1bitも変えない。逓減式(超過分半減・12週窓)自体は変えない

### G4: 休暇中の欠場trustペナルティ除外

- `applyShowTrust`(management.js:22299付近)の除外条件が `fighter.injury` のみのため、休暇辞令で休ませた選手が興行ごとに不出場ペナルティ(-2.64×streak)を受け、**休暇の信頼収支が赤字になる**
- 修正: 休暇中(`onLeave`。実フィールド名はコードで確認)を**injuryと完全同扱い**にする(ペナルティなし・欠場連続カウンタもinjuryと同じ扱い)
- **不変条件**: 非休暇・非怪我の選手の信頼挙動は完全不変。休暇辞令の即時trust効果(基礎(3+週数)×0.5)は変えない

### G6: DECISION_PERSONALITY_MULT に shy 行を追加(data.js:19245)

- ALL_CHARSに `personality:'shy'` が5名実在するのにテーブルに行がなく、無言でnormal(全1.00)にフォールバックしている。行頭コメント「spec §6.3 の shy は project に存在しないため除外」は事実誤認なので書き換える
- **追加する行(Fable設計値。変更禁止)**:

```js
shy:       { bonus: 0.90, encourage: 1.30, refresh_leave: 1.10, special_treatment: 1.00, party: 0.60, trainer: 0.90, camp: 0.90, media: 0.50 },
```

(内気: 個別の静かな声かけが最も響く。宴会・メディアは苦手。外部コーチ・合宿の集団は少し緊張)
- **不変条件**: 既存6行の数値は1文字も変えない。clamp(0.5〜1.5)の仕組みは変えない

### G8: executeDecision のエラーフォールスルー封鎖

- `App.executeDecision`(app.js:14377-14397付近)のエラー分岐に `offseason_locked` がなく、未知のエラーコードが返るとエラーオブジェクトをGameStateとして代入し `G.roster=undefined` になる地雷
- 修正: `offseason_locked` のトースト追加 **+ 最後に「`result.error` が真なら汎用トーストを出してreturn」の防壁を追加**(将来のエラーコード追加でも状態破壊しない根本対処)

### G10: 招聘UIの空振り解消(2件)

1. 招聘書類クリック時に `roster.some(c => c._inviteBuff)` を**事前チェック**し、既に招聘中なら「すでに招聘中のコーチがいます(◯◯・残N週)」トーストを出してモーダルを開かない(現状は5クリック進めてからエラーで全破棄)
2. 招聘書類クリック時に市場最安候補の招聘費と資金を比較し、**最安すら払えない場合**は他書類と同型の「資金が足りません」トーストで止める
- **不変条件**: エンジン側の判定(23329等)は変えない(UIの事前チェックは保険であり権威はエンジン)

### G11: 招聘の遅延トースト文言修正(文言のみ)

- app.js:11619-11637付近の遅延trust発現トーストが旧名「専属トレーナーとの練習で」のまま。現行の書類名(外部コーチ招聘)に合う文言へ修正
- **本タスクでは文言のみ**。週1人制限・最終週無通知の改善はP1(通知再設計)で扱うので触らない

## 検証手順(フォアグラウンド実行。run_in_background禁止)

1. `node --check src/management.js src/app.js src/ui-common.js src/ui-render.js src/data.js`
2. `node test/auto-sim.js 20 42` → **Result: ALL CLEAR** を確認
3. G1分布確認: 作業ツリー内に使い捨てスクリプト(コミットしない)で `rollInviteMarket` を同一state・1000シードで回し、全コーチの出現率が公平値±15%以内であることを確認。結果の表を報告に貼る
4. G2確認: 招聘→四半期送りを2回進めるミニシナリオ(スクリプト可)で「次Q不在・次々Q出現しうる」を確認
5. `npm run test:ui:walkthrough` 1本(UI変更があるため)

## 完了条件

- 修理はG単位で**1コミットずつ**(G1〜G11で最大7コミット。メッセージに G番号を含める)
- diffは上記スコープ外に及ばない。リファクタ・整形の混入禁止
- 報告書: `docs/codex-tasks/task-97-report.md` に各Gの修正内容・検証結果(分布表含む)を記載
- マージはFableがdiffレビュー+不変条件検算の上で行う
