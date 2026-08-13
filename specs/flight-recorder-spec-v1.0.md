# フライトレコーダー確定仕様 v1.0

2026-08-13確定(task-93実装・mainマージ c532b95)。バグ徹底捜索体制①。
実プレイ中の不具合を「再現可能な記録」として捕捉・書き出しする常駐レコーダー。

## 1. 位置づけと原則

- 実体は `src/flight-recorder.js` 1ファイル。**index.htmlの最初の `<script src>`**(victory-lines.jsより前)として読み込み、後続全スクリプトの読み込み時・実行時エラーを捕捉する
- **配布物に含まれる**(release/manifest.json sourceFiles)。プレイヤーの実プレイも報告源
- ゲームコードと完全疎結合: ゲーム側からの呼び出しフックなし。`G`を読み書きしない・乱数を消費しない・進行に割り込まない
- 全コードパスがtry/catchで包まれ、レコーダー起因の例外はゲームへ漏れない。エラーは握りつぶさない(onerrorはfalse返却、console.error/warnラップは原関数を先に呼ぶ)

## 2. 捕捉対象

| ソース | 記録 | 上限 |
|---|---|---|
| `window.onerror` | msg/src(ファイル名のみ)/line/col/stack(2000字) | エラー30件リング |
| `unhandledrejection` | reason+stack | 同上に合流 |
| `console.error`(ラップ) | 全件(1000字) | 同上 |
| `console.warn`(ラップ) | **`[WM Debug]`/`[WM]` 前置のみ**(validateGameState違反等) | 同上 |
| クリック(document capture) | 相対時刻/tag/id/class×3/text 40字 | 100件リング |
| ページ境界 | load毎にboundaryマーカー(セッション連番) | — |

- 同一メッセージの連続エラーは `count` 集約(無限ループ対策)
- 永続化: localStorage `wm_flight` のみ(≤150KB・超過/Quota時は古い順破棄)。エラーは即時、クリックは2秒スロットル+`pagehide`。**リロードを跨いで直前操作が残る**(無例外フリーズの診断用)

## 3. UI

- エラーゼロのセッションではDOMに1要素も追加しない。初エラー時(または前セッションの未読エラーあり)に左下へ⚠バッジ(24px・z99999)を遅延生成
- パネル: 記録をコピー(clipboard→execCommandフォールバック)/ファイルで保存(`wm_bugreport_<日付>.json`)/記録を消去(確認つき)/閉じる(ESC可)
- 色は `var(--*, fallback)` 形式(実測: --bg-dark等のトークン解決を確認済み)
- 可視文言(確定・ガードテストで固定): 見出し「不具合の記録」/本文「直前のプレイで不具合が記録されました。「記録をコピー」または「ファイルで保存」で書き出して、報告に添えてください。ゲームはそのまま続けられます。」/ボタン4種/「コピーしました」/「記録を消去しますか?」

## 4. 報告バンドル(JSON v1・キー構成固定)

`v / exportedAt / userAgent / viewport / errors / actions / openLayers / saves / context`

- `openLayers`: body直下の可視要素ラベル(最大50)——フリーズ時に開いていたモーダルの特定用
- `saves`: 手動スロットは key+bytes のみ、**本文はautosaveだけ**(1MB超はomitted)
- `context`: autosaveから season/week を復元(`WM_LZ|`マーカー+LZString。失敗時null)
- デバッグ用グローバル: `window.__wmFlightRecorder.exportBundle()/.flush()`(テスト・ハーネスから利用可)

## 5. 検証

- `test/flight-recorder-guard-test.js`(npm test収集対象): stub環境での振る舞い検査(リング上限/原関数呼び出し/warnフィルタ/容量・Quota/エラーゼロ時DOM無生成/バンドル形状/確定文言/Math.random禁止トラップ/capture-phase検証)
- ブラウザ実測済み(2026-08-13): クリーンロードDOM無追加/エラー注入→バッジ・パネル・文言/バンドル内容/リロード跨ぎ永続化/data.js先頭throw→`data.js:1`捕捉(読み込み順の実証)
