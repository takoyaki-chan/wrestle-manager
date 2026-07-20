# Codexタスク19: 4団体勝ち残り対抗戦（E-4）のUI/演出リワーク（設計→実装）

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**変更してよいファイル**: `src/` 配下、`test/` 配下、`docs/ui/03-screens/autumn-gauntlet-war.md`、`specs/autumn-gauntlet-war-spec-v0.1.md`、`docs/worklog.md`

**コミットはOK**（日本語の明確なメッセージで）。**pushは禁止**。

**必読**: `CLAUDE.md`、`specs/autumn-gauntlet-war-spec-v0.1.md`、`docs/ui/03-screens/autumn-gauntlet-war.md`、`docs/ui/01-foundations.md`、`docs/ui/02-layouts.md`

---

## 背景

E-4「4団体勝ち残り対抗戦」（Week36・3名制勝ち抜き）はエンジンとUIが実装済みだが、実機確認で以下が判明した。

- 試合の観戦ができない（結果表示しか無い）
- 選手情報が読み取れない（OVRなし・詳細を開けない）
- 画面が既存オーバーレイの流用で、専用画面として設計されていない
- ルールがプレイヤーに伝わっていない

本タスクはこれをまとめて解消する。**Phase 1（設計）でレビューを受けてから Phase 2（実装）に入ること。**

---

## 現状の実装（調査済み・確認済みの事実）

### 発火とUI経路

| 週 | 処理 | 実装 |
|---|---|---|
| 34 | 告知 | `management.js:14853-14871` `Engine.autumnWar.announce(s)` |
| 35 | エントリー | `management.js:14873-14881` → `autumnWarPhase:'entry'` |
| 36 | 開催 | `management.js:14883-14895` `Engine.autumnWar.startSession(s)` + `_pendingAutumnWarReplay:true` |

- UI起動: `app.js:3408 App.initAutumnWarReplay()`（呼び出し `app.js:9406-9410`, `9996-10000`, `3286-3289`）
- 週35バナー: `ui-render.js:2495 renderAutumnWarWeekBanner()` → `ui-render.js:1069` で今週画面に連結
- 編成モーダル: `App.awOpenEntryModal()`（`app.js:3349`）→ `_mdlAOpen(_awEntryModalHtml())`（`app.js:3356`、HTML: `ui-common.js:16175`）
- 週36の興行準備ブロック: `_agwBlockedShowPrepHtml()`（`ui-render.js:2580`、適用 `ui-render.js:2606`）

### 画面が「雑に重なる」構造的原因

- 編成モーダルは `_mdlAOpen`（`ui-common.js:110`）が `index.html:9814` の `#mdlAOverlay` に `.active` を付けるだけ。**その時点で表示中の画面（興行準備）の上に全画面オーバーレイが被さる**
- 大会進行ボードは `renderAutumnWarBoard()`（`ui-common.js:16042`）が**興行結果用オーバーレイ `#showResultOverlay` / `#showResultBox`（`index.html:9699-9700`）を流用**し、`box.style` を JS から直接潰して描いている（`ui-common.js:16049-16052`、同様に `16080-16083`, `16123-16126`, `16158-16161`）
- **専用screenを持っていない。** これが `docs/ui/03-screens/autumn-gauntlet-war.md:128`「OfficeとStageを混在させない」に違反している

### 試合実行

`management.js:24835 Engine.autumnWar.simulateNextBout(state)`

```js
const matchResult = Engine.battle.simulateMatch(
  { ...left,  condition: beforeLeft,  _hpOverride: ... },
  { ...right, condition: beforeRight, _hpOverride: ... },
  rng, 2                          // ← 第4引数 = matchTier（2 = ビッグマッチ）
);
```

- HP上限計算は `BIGMATCH_ENG.hpBase / hpScale` を使用（`management.js:24853-24854`）
- `opts` を渡していないため **`recordFrames` が false → 再生用フレームが存在しない**（`match-engine.js:236`、記録処理 `match-engine.js:289`）

### 観戦モードの既存実装（移植元）

通常の観戦起動パターン（例: 挑戦状B3 `app.js:11500-11545`）:

1. `document.getElementById('battleOverlay').style.display='block'`
2. `Engine.battle.simulateMatch(pf, af, rng, tier, { recordFrames: true, ... })`
3. `iframe.src = 'battle-engine.html?t=' + Date.now()`（`#battleIframe` = `index.html:9708`）
4. `iframe.contentWindow.postMessage({type:'START_MATCH', left, right, matchInfo:{...}, result}, '*')`
5. 結果受信（例 `App._receiveB3BattleResult` = `app.js:11559`）

同種の実装: 春のタッグリーグ `App.stlWatchMatch()`（`app.js:3671`、ボタン `ui-common.js:15599`）、天頂戦 `App.tcWatchMatch()`（`app.js:13989`）。
**共通のフォーカスカード部品 `_jtcFcCore`（`ui-common.js:14754`、観戦/スキップの2ボタンを持つ `ui-common.js:14773-14774`）が既にあるが、AGWはこれを使っていない。**

AGW側の現状ボタンは `_agwFocusHtml`（`ui-common.js:15978`）内の **`ui-common.js:16016`「ゴング — 結果を見る ▶」1個だけ**。

### 選手表示

- 布陣ボード: `_agwTeamCardHtml()`（`ui-common.js:15923`、メンバー行 `15939-15943`）
- 状態: `_agwTeamViewState()`（`ui-common.js:15863`）、コンディション `_agwConditionMeta()`（`ui-common.js:15843`）/ `_agwConditionBar()`（`ui-common.js:15850`）
- **表示しているのは HP ではなく condition。** しかも 0-80 スケールの値を `width:${value}%` にそのまま入れている（`ui-common.js:15854`）→ 最大でもバーが80%までしか伸びない
- **OVR は布陣ボードに無い。** 編成モーダルのみ表示（`ui-common.js:16178`, `16190`）。算出は **`Engine.util.ov(f)`**
- **クリック不可。** `15939-15943` / `16011-16013` / `16089-16094` / `16121` / `16166` いずれも `onclick` なし
- キャラ詳細モーダルの既存関数は **`showFighterPopup(fighterId, source)`**（定義 `ui-common.js:3058`、例 `ui-common.js:12183`, `ui-render.js:7137`）

### 画像ヘルパー（すべて `data.js`）

| 関数 | 出力 |
|---|---|
| `getPortraitUrl(id)` `data.js:539` | `../image/face_*.png` |
| `getStandUrl(id, ovr)` `data.js:540` | `../image/stand/stand_*.webp`（OVR閾値でバリアント切替） |
| `getUpperUrl(id)` `data.js:546` | `../image/upper/upper_*.webp` |
| `getFullUrl(id, ovr)` `data.js:547` | `../image/full/full_*.webp` |

**AGWはスタンド画像を一切使っていない**（upper と face のみ）。スタンド使用例: `ui-render.js:452`, `11224-11225`, `12223-12224`, `ui-common.js:11982`, `12240`, `12410`、ラッパ `ui-render.js:6716`。

### CSS

- 専用接頭辞 `agw-` あり。定義は `index.html:3502-3629`
- 一部 `stl-` 流用（`stl-week-banner`, `stl-block-banner`, `stl-modal-section-label`）、候補カードは draft画面の `draft-fc cand` 流用
- **`mobile.css` に `agw-` の記述は0件。** レスポンシブは `index.html:3629` の `@media(max-width:1000px)` 1本のみ（比較: `stl-` は `mobile.css:1347-1354`、`tc-` は `mobile.css:1356` に対応あり）

---

## やること

### R-1. 観戦モードの実装 【最優先】

現状は結果表示のみ。観戦経路を実装する。

- `Engine.autumnWar.simulateNextBout` に `recordFrames` 付きの再生用経路を用意する。春のタッグリーグの `Engine.springTagLeague.simulateReplay`（`app.js:3671 stlWatchMatch()` から利用）が最も近い先例なので、**同じ形に揃えること**
- `_agwFocusHtml`（`ui-common.js:15978`）のボタンを **`[🎬 観戦する] [結果を見る ▶]` の2つ**にする。`docs/ui/03-screens/autumn-gauntlet-war.md:71` の仕様どおり
- **共通部品 `_jtcFcCore`（`ui-common.js:14754`）が既に観戦/スキップの2ボタン構成を持っている。流用できるなら流用し、独自実装を増やさないこと**
- 観戦終了後は勝ち抜き進行に正しく戻り、二重にフォールが進まないこと

### R-2. 試合形式をビッグマッチ→通常に 【要注意・先に確認せよ】

`management.js:24855-24859` の第4引数を `2` → `1` にする。

**ただしこれは単なるフラグ変更ではない:**

- HP上限が `BIGMATCH_ENG.hpBase / hpScale`（`management.js:24853-24854`）から通常値に変わる
- E-4は `specs/autumn-gauntlet-war-spec-v0.1.md` において**「連戦消耗モジュール」の定義元**であり、3名勝ち抜き制の消耗設計が HP上限に依存している
- 仕様書は現在 tier2 を正としているため、**これは仕様変更である**

したがって:

1. Phase 1 で、tier1化によって連戦消耗の効き方が具体的にどう変わるかを**数値で示す**（フォール1本目/2本目/3本目の平均残HP・平均ターン数の変化）
2. 消耗カーブが壊れる場合は補正案を併せて提示する
3. **実装後は必ず auto-sim を回す**（`node test/auto-sim.js 200`、シード複数）
4. `specs/autumn-gauntlet-war-spec-v0.1.md` の該当記述を更新する

### R-3. 布陣ボードにOVRを表示

`_agwTeamCardHtml()`（`ui-common.js:15923`、メンバー行 `15939-15943`）に `Engine.util.ov(f)` の値を追加。コンディションと並べて読めるようにする。

**併せて `_agwConditionBar()`（`ui-common.js:15850`）のバー幅バグを直すこと。** 0-80スケールの値を `width:${value}%` に直接入れており、バーが最大80%までしか伸びない（`ui-common.js:15854`）。

### R-4. 選手名・アイコンからキャラ詳細を開けるように

既存の **`showFighterPopup(fighterId, source)`**（`ui-common.js:3058`）を接続する。

対象箇所（すべて現在 `onclick` なし）:

| 箇所 | 実装 |
|---|---|
| 布陣ボードのメンバー行 | `ui-common.js:15939-15943` |
| フォーカスの対面カード | `ui-common.js:16011-16013` |
| 出場順の並べ替え行 | `ui-common.js:16089-16094` |
| 優勝者カード | `ui-common.js:16121` |
| MVPポートレート | `ui-common.js:16166` |

呼び出し形式は既存例（`ui-common.js:12183`）に合わせ、**親要素にクリックハンドラがある箇所では `event.stopPropagation()` を必ず入れる**こと。とくに出場順の並べ替え行は行自体がドラッグ/クリック対象なので、詳細を開く導線と操作が衝突しないよう設計すること（アイコンのみクリック可にする等）。

### R-5. 週36の導入を専用画面にする 【設計が主】

現状はいきなり編成モーダルが興行準備画面に被さる。これを改める。

**望ましい流れ:**

```
週36到達
  ↓
「今週は 4団体勝ち残り対抗戦です」— 大会の導入画面
（大会エンブレム / 参加4団体 / ルール要約）
  ↓
「出場メンバーはどうしますか？」— 編成画面へ
  ↓
大会進行
```

- `#showResultOverlay`（興行結果用）の流用をやめ、**AGW専用のオーバーレイ/screenを持たせる**。`box.style` を JS から潰す実装（`ui-common.js:16049-16052` ほか）は廃止する
- `docs/ui/02-layouts.md` のシーケンス（S1〜S7）のどれに属するかを決め、そのシーケンスの共通ビジュアルキーを貫くこと
- Stage系の画面中はグローバルナビを出さない（`docs/ui/03-screens/autumn-gauntlet-war.md:128`）

### R-6. 編成画面をスタンド画像を使ったビジュアル編成に

`_awEntryModalHtml()`（`ui-common.js:16175`）を作り直す。

- 現在は draft画面の `draft-fc cand` クラス流用＋アッパー画像。**スタンド画像 `getStandUrl(id, ovr)`（`data.js:540`）を使った編成画面**にする
- スタンド使用の先例: `ui-render.js:452`, `11224-11225`, `12223-12224`, `ui-common.js:11982`, `12240`, `12410`、ラッパ `ui-render.js:6716`
- 3名を選ぶだけでなく、**出場順（勝ち抜きの並び）が意思決定として見えるように**する。誰を先鋒に置くかがこの大会の肝であることが伝わる画面にすること
- OVR・コンディション・相手団体との力関係が読める情報設計にする

### R-7. ルールをプレイヤーに伝える

現状、ルール説明のモーダル/画面は**コードベースに一切存在しない**（天頂戦・春タッグにも無く、バナーの1〜2行サブテキストで代用）。

- 3名制勝ち抜き・4団体・勝ち残りの流れが**初見で理解できる**表現を設計する
- 常時説明文を出すのではなく、導入画面（R-5）と進行ボードに自然に埋め込むことを優先する。読まなくても進めるが、読めば分かる状態にすること
- 図解が有効なら、勝ち抜きの流れを示す小さな図をCSSで作ってよい

### R-8. モバイル対応

`mobile.css` に `agw-` の記述が0件。`stl-`（`mobile.css:1347-1354`）と `tc-`（`mobile.css:1356`）を参考に対応を入れる。
`index.html:3629` の `@media(max-width:1000px)` で `.agw-opponent-panel` を `display:none` にしている箇所は、情報が消えて良いのか再検討すること。

---

## 進め方

### Phase 1: 設計（**ここでレビューを受けること。実装に進まない**）

以下を `docs/agw-rework-design.md` にまとめて提示する:

1. R-5 の画面遷移設計（導入 → 編成 → 進行 → 結果）。どのシーケンスに属するか、どのオーバーレイ/screenを新設するか
2. R-6 の編成画面のレイアウト案（**複数案）。スタンド画像の配置、出場順の決め方
3. R-7 のルール提示方法
4. **R-2 の tier1化による連戦消耗への影響を数値で**（フォール1〜3本目の平均残HP・平均ターン数の変化、必要なら補正案）
5. `docs/ui/03-screens/autumn-gauntlet-war.md` への差分案

**Phase 1 では `src/` を変更しない。** ただし R-2 の数値計測のために `test/` 配下に計測スクリプトを追加するのは可（接頭辞 `agw-`）。

### Phase 2: 実装

Phase 1 の承認後に R-1〜R-8 を実装する。

**優先順位**: R-1（観戦）> R-3・R-4（情報が読めない）> R-5・R-6（画面設計）> R-7（ルール）> R-2（仕様変更）> R-8

R-2 は影響が大きいので**単独のコミットに分ける**こと。

---

## 厳守事項

- **ハードコード16進カラー禁止。** 色は `var(--*)` トークンのみ
- 既存の共通部品（`_jtcFcCore`, `showFighterPopup`, `getStandUrl`）がある機能を独自実装で作り直さない
- インラインstyleを増やさない。`agw-` プレフィックスのCSS classとして `index.html` に定義する
- **auto-sim は編集のたびに回さない。** R-2 を含む実装が一区切りついた時点でまとめて1回（`node test/auto-sim.js 200` をシード複数）
- 完了時に `docs/worklog.md` の**先頭**に詳細ログを追記し、`docs/game-system-roadmap.md` は該当行のステータスを1行更新するのみ
- `specs/autumn-gauntlet-war-spec-v0.1.md` を実装後の確定状態に更新する（R-2 の tier 変更、R-1 の観戦経路）
- `docs/ui/03-screens/autumn-gauntlet-war.md` の「実装状況」を更新する
- push禁止

## 完了報告に含めること

- 変更ファイル一覧とコミット
- auto-sim の結果（違反件数・シード）
- R-2 による連戦消耗の変化（実装前後の数値比較）
- **Keisuke が実機で確認すべき画面・操作の具体的な列挙**（週34告知 → 週35編成 → 週36進行 → 観戦 → 結果 → MVP の順で、どこを見ればよいか）
