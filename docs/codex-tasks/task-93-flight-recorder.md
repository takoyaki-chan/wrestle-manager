# task-93: フライトレコーダー(ゲーム内バグ捕捉・報告システム)

**依頼先**: Codex
**作業場所**: 専用worktree `wm-codex-task93`(ブランチ `codex/task-93-flight-recorder`。task-86〜92と同型。mainフォルダ `Downloads/wrestle-manager` はKeisukeがブラウザで直接開いてプレイ中のため絶対に触らない)
**マージ**: Fableがdiff全文レビュー+不変条件を1つずつ独立検算→コミット代行→mainへ
**依存**: なし(task-92統一王座P4・task-94ハーネスと並行可。触るファイルが交差しない)

---

## 1. 目的

実プレイ中の不具合を「曖昧な症状報告」から「再現可能な記録」に変える。ゲーム内に常駐する軽量レコーダーを新設し、①JS例外・Promise未処理拒否・エラーログの捕捉、②直前の操作列(クリックトレース)の記録、③ワンクリックでの報告書き出し、を提供する。

背景: 2026-08-13の契約交渉フリーズは**例外を投げない進行停止**(死んだガードの早期return)で、6日間誰にも気づかれなかった。エラー捕捉だけでなく**操作トレースをリロード越しに残す**ことが本タスクの核。フリーズ→リロード後でも「最後に何を押したら止まったか」が報告に残る。

## 2. 仕様の正

このタスクは新規機構のため外部specが存在しない。**本指示書§7が仕様の正**(マージ後にFableが specs/ へ昇格させる)。横断規約:

- `CLAUDE.md` §UI実装ルール(ハードコード16進禁止 → `var(--*, fallback)` 形式で使用)
- プレイヤー可視テキストに内部変数名を出さない(日本語のみ)

## 3. 触ってよいファイル / 触ってはいけないファイル

**触ってよい**:
- `src/flight-recorder.js` — **新規作成**。本体すべてをこの1ファイルに閉じる(CSS注入含む)
- `src/index.html` — **1行のみ**: `<script src="flight-recorder.js"></script>` を既存スクリプト群の**先頭**(`victory-lines.js` の直前)に追加
- `release/manifest.json` — `sourceFiles` に `src/flight-recorder.js` を追加(配布に含める。devOnlyではない)
- `test/flight-recorder-guard-test.js` — 新規

**触ってはいけない**:
- 上記以外のすべて。**app.js / ui-common.js / ui-render.js / management.js / data.js への変更は1文字も不可**(レコーダーはゲームコードと完全疎結合。ゲーム側からの呼び出しフックも作らない)

## 4. 数値目標と不変条件(対で書く)

| # | 目標 | 不変条件(これを壊す実装は不合格) |
|---|---|---|
| I-1 | 全例外を記録する | **エラーを握りつぶさない**: `window.onerror` ハンドラは `false` を返しブラウザ既定のコンソール出力を殺さない。`console.error`/`console.warn` のラップは**必ず原関数を呼んでから**記録する。レコーダー自身の全コードパスがtry/catchで包まれ、**レコーダー起因の例外が1つもゲームへ漏れない** |
| I-2 | 操作トレースがリロードを跨いで残る | localStorage書き込みは自キー `wm_flight` **のみ**。`wrestle_manager_save_*` / `wrestle_manager_autosave` / `wm_audio` への書き込み・削除は禁止(読み取りは書き出し時のみ可)。`wm_flight` の合計サイズ上限 **150KB**、超過時は古いエントリから破棄(QuotaExceededでもゲームを止めない) |
| I-3 | エラー時のみ⚠バッジ表示 | **エラーゼロのセッションではDOMに1要素も追加しない**(バッジ・パネル・styleタグの事前生成禁止。初エラー時に遅延生成)。バッジ/パネルがゲームのどの操作もブロックしない(パネルは閉じられる小型モーダル、進行への割り込みなし) |
| I-4 | 報告のコピー/保存 | バンドルに含めるセーブ本文は **autosaveのみ**(手動スロットの本文は含めない。キー名とサイズの一覧はOK)。プレイヤー可視文言は§7-Dの確定文言と一字一句一致 |
| I-5 | ゲーム挙動の完全不変 | `Math.random` を1回も呼ばない(時刻は `Date.now()` のみ)。クリック記録はcapture-phaseの読み取り専用で `stopPropagation`/`preventDefault` を呼ばない。1クリックあたりの処理は文字列組み立てのみ(重い走査・serialize禁止) |
| I-6 | 読み込み順=最初 | 後続の全スクリプト(data.js〜ui-render.js)の**読み込み時構文エラー・実行時エラーを捕捉できる**。検証は人工エラー注入で行う(§5-3) |

## 5. 検証手順

1. `node --check src/flight-recorder.js`(フックも走る)
2. `node test/flight-recorder-guard-test.js` — **フォアグラウンドで実行(run_in_background禁止)**。stub window/document/localStorage 上でレコーダーを vm 読み込みし、**振る舞いを検査**(ソース文字列検査にしない):
   - onerror 30件超→リングバッファが古い順に破棄され30件を維持
   - console.error ラップ後も原関数が呼ばれる(スパイで検証)
   - console.warn は `[WM Debug]` / `[WM]` 前置のみ記録、他は素通し
   - localStorage stub に150KB超を書かせようとすると古いエントリ破棄で収まる
   - エラーゼロのとき document.createElement が1回も呼ばれない(スパイで検証)
   - エクスポートバンドルが§7-Cのキー構成と一致
3. ブラウザ実測(worktreeの index.html を開く):
   - コンソールで `setTimeout(()=>{throw new Error('WM_TEST_ERROR')})` → ⚠バッジ出現→パネル→「ファイルで保存」でJSONが落ち、エラーと直前クリック列が入っている
   - 数回クリック→リロード→再度エラー注入→バンドルの `actions` に**リロード前のクリックと境界マーカーが残っている**こと
   - `data.js` の先頭に一時的な `throw` を仕込み、読み込み時エラーが捕捉されることを確認(**確認後必ず戻す**)
4. auto-sim: **不要**(エンジン非接触・nodeでは読み込まれない)。フックがターン末に回した場合はALL CLEARであること
5. 実機の見た目・文言確認はKeisukeの実機確認バックログへ委ねる

## 6. 完了条件

- diffが§3の「触ってよい」4ファイルに閉じている(index.htmlは+1行のみ)
- コミット粒度: ①flight-recorder.js本体+テスト ②index.html組み込み+manifest、の2粒度
- 完了報告に: 不変条件I-1〜I-6の自己チェック結果 / §5-2と§5-3の結果全文 / バンドルJSONのサンプル1つ

---

## 7. 仕様(このタスクの正)

### 7-A. 捕捉するもの

| ソース | 記録内容 | 上限 |
|---|---|---|
| `window.onerror` | message / source(ファイル名のみ) / line:col / stack(先頭2000字) / 発生時刻 | エラー30件(リング) |
| `unhandledrejection` | reason(String化・先頭2000字) / 発生時刻 | 同上に合流 |
| `console.error`(ラップ) | 引数をString化連結(先頭1000字) | 同上に合流 |
| `console.warn`(ラップ) | **`[WM Debug]` または `[WM]` で始まるもののみ**(validateGameState違反・オートセーブ失敗等)。他は記録しない | 同上に合流 |
| クリック(document capture-phase) | 相対時刻 / tag / id / class(先頭3つ) / textContent(trim・先頭40字) | 100件(リング) |
| ページ境界 | load時に境界マーカー(時刻+セッション連番)をactionsへ挿入(リロード検出用) | — |

- 同一メッセージの連続エラー(無限ループ由来)は `count` を増やすだけにして1エントリへ集約する(リングバッファ汚染防止)
- 記録の永続化: エラーは即時、クリックは2秒スロットル+`pagehide` でlocalStorage `wm_flight` へ書き出し

### 7-B. ⚠バッジとパネル

- 初エラー捕捉時に画面**左下**へ小さな⚠バッジを遅延生成(`position:fixed; z-index:99999`、24px角程度、控えめ。点滅・アニメなし)。前セッションの未確認エラーが `wm_flight` に残っている場合も起動時に表示
- バッジクリック→小型パネル(幅340px程度)。CSSはレコーダーが自分で注入し、色は `var(--bg-dark, #1a1a1a)` のようにトークン+フォールバック形式
- パネルの操作: 記録をコピー / ファイルで保存 / 記録を消去(確認つき) / 閉じる
- コピーは `navigator.clipboard` →失敗時は textarea+`execCommand('copy')` フォールバック(file://ではclipboard APIが使えない)。「ファイルで保存」はBlobダウンロード(`wm_bugreport_<日付>.json`)で常に動く

### 7-C. エクスポートバンドル(JSON・キー構成固定)

```
{
  "v": 1,
  "exportedAt": "(ISO文字列)",
  "userAgent": "...", "viewport": "WxH",
  "errors": [ {t, type, msg, src, line, col, stack, count} ],
  "actions": [ {t, kind, tag, id, cls, text} | {t, kind:"boundary", session} ],
  "openLayers": [ "(body直下の要素のうち可視のもの: tag#id.class×最大50件。innerHTMLは含めない)" ],
  "saves": { "slots": [ {key, bytes} ], "autosave": "(生の圧縮文字列そのまま。1MB超なら省略し'omitted'と記載)" },
  "context": { "season": n, "week": n } または null (window.LZStringが在ればautosaveをtry/catchで復元して抽出。失敗時null)
}
```

`openLayers` はフリーズ時に「どのモーダルが開いたまま止まったか」を読むためのもの。書き出し時に1回だけ走査する(常時監視はしない)。

### 7-D. プレイヤー可視文言(確定・一字一句)

- バッジ tooltip: `不具合の記録`
- パネル見出し: `不具合の記録`
- 本文: `直前のプレイで不具合が記録されました。「記録をコピー」または「ファイルで保存」で書き出して、報告に添えてください。ゲームはそのまま続けられます。`
- ボタン: `記録をコピー` / `ファイルで保存` / `記録を消去` / `閉じる`
- コピー成功トースト: `コピーしました`
- 消去確認: `記録を消去しますか?`

内部語(flight/recorder/error/stack等)を可視文言に出さない。
