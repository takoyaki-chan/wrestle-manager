# task-95: 遠征試合(果たし状)の進行画面リスタイル+結果2拍シーケンス実装

2026-08-13 起票(Fable)。設計・セリフともKeisuke承認済み。

## 0. 作業場所

- **必ず** 専用worktree `C:\Users\nkmrk\Downloads\wm-codex-task95`(ブランチ `codex/task-95`、mainのlinked worktree)で作業する。mainフォルダはClaude専用
  - (2026-08-13 変更: 従来の wrestle-manager-codex は task-85 のWIPで占有中のため、task-86/93/94 と同じ worktree 方式に切り替え。worktree は Fable が作成済みの状態で投入する)
- **並行作業の注意**: 同日の「挑戦試合フローの週内排他/観戦中断挙動」修正(app.js/ui-common.js/ui-render.js の遠征・対抗戦まわり)は **mainへマージ済み(4b315a7)**。worktree はこれを含む main から切ってあるので、この上に実装すればよい

## 1. 目的

遠征試合(AWAY CHALLENGE)の①進行画面を「黒×火の赤」へリスタイルし能力値表示をfc1m式に置き換える。②シリーズ結果演出を「勝者側代表の勝ち名乗り(1拍目)→敗者側代表の単独の悔しさ(2拍目)」の2拍シーケンスへ再構成し、セリフ選定に「代表本人の試合結果」の軸を追加する。

## 2. 仕様の正(指示書内に二重記載しない)

- **画面設計**: `docs/ui/mockups/away-challenge-v0.2.html`(全判断点確定済み。View A=進行 / B1=1拍目 / B2=2拍目 / View C=実装メモと2軸マトリクス)
- **セリフ(承認稿)**: `docs/dialogue/away-challenge-result-lines-draft-v0.1.md` — **一字一句そのまま焼き込む**(2026-08-13「拳が握りしまる」文言化けの教訓。転記後に突き合わせ検査を書くこと)
- 顔出し規約: `docs/ui/mockup-baseline-v0.1.md`(梯子・吹き出し・勝敗表現)

## 3. 実装スコープ

### A. 進行画面(敵地の盤面)

- 対象: `renderMatchPreview` の away 変種(`.show-pregame-a.away`、ui-common.js ~4990〜)+ index.html の `.away` 系CSS
- 変更: v0.2 View A のとおり — 黒地+火の赤(`--c-rivalry` 系の既存トークンを優先。新規16進の直書き禁止、必要なら `--awx-*` トークンを :root に定義して使う)。試合カードの左右5本ステータスバーを廃止し、**各選手の下に fc1m 式5項目帯**(`.fc1m-stats` の部品/様式を流用。優位値のみ点灯: 自陣=金/敵陣=赤)。中央はVS+宿命/友好チップのみ
- 生値表示は現行踏襲(階調色化はしない)。OVRはランキングと同じ階調トークン
- タッグ枠が混ざるケース(現行の away タッグプレビュー)は現行構造を維持し、色だけ新トーンに追随させる

### B. 結果2拍シーケンス

- 対象: `showChallengeRequestResultModal` / `_challengeRequestResultReaction` / `_challengeRequestOpponentReaction`(ui-common.js 13049〜13260 近辺)
- 再構成(v0.2 View B1/B2 + View C 実装メモのとおり):
  1. **1拍目(B1)**: シリーズ勝者側の代表が XL(172×258)で主役。頭上吹き出しに**場面1プール**のセリフ。スコア帯(「団体として敗北/勝利」明記)+明細3行(現行の crrm-row の情報を踏襲: ○×・因縁/関係デルタ・MQ・決まり技)同居。▶で2拍目へ
  2. **2拍目(B2)**: シリーズ敗者側の代表が M(132×194)で単独。セリフは2軸で選定 — **本人○×団体●→場面2プール** / **本人●×団体●→既存 `Engine.challengeRequest.pickLine` の lose プール流用**。写真は本人●なら `grayscale(.9) brightness(.72)`、本人○なら軽いグレー(v0.2の `grayscale(.35) brightness(.9)`)
  3. **引き分けシリーズ**: 現行の並置表示を踏襲(新プールは使わない)
- **主役選定**: 勝利側の「代表戦(第1試合)勝者」を優先。代表が負けていれば同陣営で最高MQの試合の勝者
- **コーチ要約**: モーダルからは撤去し、同内容(現行 coachLine 相当の1行)を週次レポート(gameLog)へ移す。文言は現行 coachLine を流用してよい
- forward(こちらが挑む)/inverse(受けて立つ)の両方向で成立させる。ラベル文言は v0.2 準拠(例: 「受けて立ち、団体を勝たせた代表」)+inverse用の言い換えは既存ラベルの対を踏襲
- 新プールのデータ置き場: data.js に `AWAY_CHALLENGE_RESULT_LINES = { seriesWin: {archetype: [3本]}, regretOwnWin: {archetype: [3本]} }` 形で宣言追加(**ブラケット代入 `TABLE['key']=` は禁止** — ガードテストで落ちる)

## 4. 触ってよいファイル / 触ってはいけないファイル

- 変更可: `src/ui-common.js` / `src/index.html`(CSS) / `src/data.js`(新プール追加のみ) / `src/app.js`(コーチ行のgameLog移設と2拍シーケンスの呼び出し配線のみ) / `test/`(新規テスト)
- **変更禁止**: `src/management.js` の試合シミュレーション・週次処理 / `src/match-engine.js` / `src/relationships.js` / 既存セリフプール(CHALLENGE_LINES 等)の中身 / 通常興行(非away)の見た目

## 5. 不変条件(数値目標と対。マージ前にFableが1つずつ検算する)

- **I-1(表示層のみ)**: エンジン結果に一切影響しない。`node test/auto-sim.js 20 42` の違反ゼロ+**状態指紋が main と完全一致**
- **I-2(承認稿一字一句)**: 焼き込んだ42本が `docs/dialogue/away-challenge-result-lines-draft-v0.1.md` と完全一致する突き合わせテストを新設(記事テストの前例: task-88)
- **I-3(2軸選定)**: 本人○×団体●で場面2プール以外が出ない/本人●×団体●で既存loseプール以外が出ない/勝者側1拍目は陣営を問わず場面1プール。純関数化してテストで固定
- **I-4(主役選定)**: 代表戦勝者優先→同陣営最高MQ勝者のフォールバック順をテストで固定
- **I-5(顔出し規約)**: 画像は梯子(XL/M)、吹き出しは画像の上・中身はセリフのみ(名前・所属を入れない)、グレースケールは**本人の勝敗**基準
- **I-6(進行画面の影響範囲)**: 非awayの通常興行プレビューのDOM構造・クラスが不変(既存の安全網テストが通ること)
- **I-7(進行保証)**: 2拍シーケンスの▶待ちにはタイムアウト+二重起動防止フラグをセットで付ける(§5-D鉄則1)。onCloseが必ず1回だけ呼ばれることをテストで固定(呼ばれないと興行後処理が止まる)

## 6. 検証手順

- `node --check` 全編集ファイル
- 新設テスト+`npm test` 全通過
- auto-sim: `node test/auto-sim.js 20 42` を**フォアグラウンドで1本**(run_in_background禁止。指紋を main と比較)
- ブラウザ確認は不可の環境なら省略可(FableがマージレビューでView対照する)

## 7. 完了条件

- コミット粒度: ①進行画面リスタイル ②結果2拍シーケンス+セリフ焼き込み+テスト の2粒度
- diff は上記スコープ内に収まること。worklog/backlog への追記は Fable がマージ時に行う
