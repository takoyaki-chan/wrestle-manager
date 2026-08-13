# task-89: 全国統一王座 P3(演出+セリフ焼き込み)

- 起票: 2026-08-13(Fable) / デザイン裁定: 同日Keisuke**全点確定**(戴冠=案B暗転スポットライト・色=オーロラ・到着=静か版・こちらの番=Office・ベルト画像=仮運用先行)
- 作業場所: 専用worktree `C:\Users\nkmrk\Downloads\wm-codex-task89`(mainのlinked worktree・ブランチ `codex/task-89-unified-title-p3`)。mainフォルダは触らない
- **前提: セリフ草案は承認済み(2026-08-13 Keisuke全文承認・v0.1a)** — 投入ゲート通過。同ツリーに他タスクWIPがあれば先にコミット
- スコープ外: P4(表彰・殿堂)/ベルト・エンブレム画像(絵文字+色帯で仮運用)/エンジン数値・抽選の変更一切

## 1. 目的

task-88でエンジン実装済みの全国統一王座に、確定済みの演出4画面(戴冠セレモニー案B/返還式/挑戦到着/こちらの番Office)と承認済みセリフ147本を載せる。**表示層のみの改修**でエンジンの乱数消費・数値を一切変えない。

## 2. 仕様の正(この順に読む。指示書内に仕様を二重記載しない)

1. `docs/ui/mockups/unified-title-ceremonies-v0.1.html` — **画面の正**(v0.2a裁定刻印版)。戴冠=案Bビュー、到着=静か版ビュー、バッジ=v5ビュー、返還式=v6ビュー。案A/C・白金/紫紺は不採用の記録
2. `docs/dialogue/unified-title-lines-draft-v0.1.md` — **セリフの正**(Keisuke承認版・**一字一句変更禁止**・要判断5点の裁定反映後の稿)
3. `docs/unified-title-p3-presentation-plan-v0.1.md` — 場面割り(格付け表・頻度と格)
4. `docs/ui/mockup-baseline-v0.1.md` §2(2:3梯子)/§3(吹き出し)

## 3. 実装項目

### A. オーロラトークン新設 + 仮ティール全置換

- `src/index.html` の `:root` に `--unified` 系トークンを新設(値はモックの `c-aurora` 定義が正: idc/deep/hi/grad/glow/text)
- task-88の仮ティール直書き(`#4fb7c5` `#75d6e2` `#9eeaf2` `#257886` `#d9fbff` `rgba(79,183,197,*)` `rgba(25,95,110,*)`)を**全てトークン参照へ置換**(ui-common.js / ui-render.js / app.js)

### B. セリフ焼き込み(src/data.js)

- 新テーブル `UNIFIED_TITLE_LINES = { coronation, return, challengerArrival, defenseWin, beltLost, captureWin, challengeFailed }`。第二階層はarchetype単軸7種、各3本。**承認稿を一字一句そのまま**
- `EVENT_LINES_BY_KEY` に7キーを登録し、Nodeエクスポートにも追加(セリフ編集ブック往復。task-86 D項と同型)
- 選択は `Engine.rng.derive()` のローカルRNG(GameState不変)。欠落キーは `standard` フォールバック

### C. 戴冠セレモニー(案B・全画面)

- 天頂戦の結果確定後(`App.finalizeTenchosen` の流れの末尾)に1枚。黒背景+オーロラのスポットライト光柱+浮遊粒子/優勝者XL 172×258/頭上吹き出し(coronation・優勝者のarchetype)/見出し「頂 点」+「業界の頂点は、ただ一人」/beltband「初代 全国統一王者」(2回目以降「第N代」・連覇時「連覇」表記)
- AI選手が優勝した年も表示する(観戦している大会の帰結のため)
- クリック進行+**タイムアウト保険+二重起動防止フラグをセットで**(§5-D鉄則1)。`onDone` ちょうど1回

### D. 返還式(W47・自団体王者のときのみ)

- Stageモーダル(モックv6ビュー)。在位年数・防衛数・「一度も動かなかった/N人を渡った」は `unifiedTitle.history` の実データから。セリフは return(王者のarchetype)
- AI王者の返還は従来どおり新聞のみ(演出なし)
- 表示用フラグは management.js のW47処理に追加してよい(**表示用フラグの追加のみ可**)。表示は `_enqueuePopup` 作法(同期呼び禁止・checkTenchosenPreEventのコメント参照)

### E. 挑戦到着画面(自団体王者への四半期挑戦の発火時)

- `showHostileArrivalStage` の**バリアント**(人数1・タイトル「挑 戦 表 明」・**静か版**=黒Stage+オーロラの見出しとバッジのみ。赤系・グロー盛りは使わない)
- 口上は challengerArrival(挑戦者のarchetype)。ボタンは「受けて立つ」1つ(裁定: 断れない)
- 発火通知フラグを `processQuarter` のプレイヤー保持分岐に追加(表示用のみ)し、週頭ポップアップキューに載せる(既存 `_pendingUnifiedNotification` と同じ流儀)

### F. こちらの番モーダルのOffice化

- 既存 `showUnifiedTitleChallengeModal` をモック④ビュー(v0.1)の形へ置換: 相手王者 upper M 132×194+候補は face 52px 正方チップ(名前+OVR)+「遠征に送る」/「今回は見送る(次は約9か月後)」

### G. 結果画面のセリフ差し込み

- 統一王座戦(`_unifiedTitleMatch`)の結果ポップアップで勝者/敗者セリフを差し替え: 自団体王者防衛=defenseWin / 自団体王者敗北=beltLost / 遠征奪取=captureWin / 遠征敗北=challengeFailed。AI間はUI対象外
- 吹き出しは頭上・クリーム+黒文字・名前を中に書かない(既存部品流用)

## 4. 数値目標と不変条件(対。マージ前にFableが1つずつ検算する)

| 目標 | 不変条件 |
|---|---|
| 演出4画面+セリフを載せる | **I-1**: 表示層のみ。実装前後で `node test/auto-sim.js 20 42` の出力(指紋含む)が**完全一致**(エンジン乱数消費ゼロ増。セリフ選択・演出分岐はderiveローカル or 表示時の純関数) |
| セリフ147本焼き込み | **I-2**: 承認稿MDと一字一句一致(草案MDをパースして突き合わせるテストを新設・task-86 I-4方式) |
| 仮ティール撤去 | **I-3**: src/*.js から仮ティール直書き0件(grep検査)。トークン定義は index.html の :root のみ |
| セレモニー/モーダル追加 | **I-4**: 全ての待ちにタイムアウト+二重起動防止+onDone1回(詰まると週が進まなくなる箇所のため) |
| showHostileArrivalStage流用 | **I-5**: 既存の果たし状(CH-1)・派閥用途の見た目/挙動に差分なし(バリアント引数の追加のみ。既定値は現行動作) |
| 表示用フラグ追加 | **I-6**: management.js への変更は表示用pendingフラグの追加のみ。抽選・数値・history記録の変更なし(diffで担保) |

## 5. 触ってよい / 触ってはいけないファイル

- **可**: src/ui-common.js / src/ui-render.js / src/app.js / src/index.html(トークン+CSS追加) / src/data.js(セリフテーブル追加のみ) / src/management.js(**表示用フラグ追加のみ**) / test/(新規+追随)
- **不可**: src/match-engine.js / src/relationships.js / src/factions.js / src/victory-lines.js / エンジンの抽選・数値・履歴ロジック / **新規srcファイル禁止**(manifest事故防止)

## 6. 検証手順(すべてフォアグラウンド。run_in_background禁止)

1. 実装**前**に main HEAD で `node test/auto-sim.js 20 42` の出力を保存(I-1基準。ファイルはコミットしない)
2. `node --check` 対象ファイル全部
3. `npm test` 全PASS(新規: セリフ突き合わせテスト)
4. `node test/auto-sim.js 20 42` → 手順1と完全一致(I-1)
5. 仮ティールgrep → src/*.js で0件(I-3)
6. ui-check 7項目の自己申告(2:3梯子/正方形52px以下/吹き出しは画像の上/隊列/勝敗/時限保険/1操作1進行)

## 7. 完了条件

- 2〜3コミット(例: トークン+セリフ / 画面4種 / テスト)
- 報告に: 触ったファイルと行数規模 / I-1〜I-6の自己申告 / ui-check○×
- specs昇格(unified-title-spec v1.0)はP4完了後にFableがまとめて行う
