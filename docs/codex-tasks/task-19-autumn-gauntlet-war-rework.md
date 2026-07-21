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

本タスクはこれをまとめて解消する。

---

## ⚑ Phase 1 は承認済み（2026-07-21）— このタスクは Phase 2 実装から始める

Phase 1（設計）は完了し、Keisuke のレビューで決裁が下りている。設計の真実は **`docs/agw-rework-design.md`** にある。実装前に必ず読むこと。tier1化の数値検証は `test/agw-tier-comparison.js` で完了済み（§6 に結果表）。

**決裁内容（この指示書の R 項目より優先する）:**

1. **編成レイアウト（R-6）は未確定。モックアップ制作込みで委譲する。** L1/L2/L3 のうちどれにするかは決めていない。**まず触れる簡易モックアップを1枚作り、それを前提に実装する。** 設計書 §4 の3案と共通要件・レスポンシブ方針を制約として満たすこと。推し（設計書上）は L1「中央3枠 + スタンド候補棚」だが、モックアップで良し悪しを見て選んでよい
2. **Week 35 の事前編成は廃止（R-5）。** 編成は本番週（Week 36）の頭で一度だけ行う。流れは `週36導入（今週は◯◯です・形式/組合せ説明）→ 編成 → 進行`。前週仮登録＋本番再確認の二度手間は作らない
   - **未操作で開戦した場合のおまかせは OVR 昇順（大将＝最強）をデフォルト**にする
   - これは秋大会単独ではなく、**「大会編成は本番週の頭で一括、未操作なら OVR 順」を天頂戦・春タッグリーグにも通す基本パターン**。ただし本タスクの実装対象は秋大会のみ（他大会への波及は別タスク）
   - **決勝前の並び替えは存置**。準決勝の消耗を見てから大将を組み替える見せ場であり、初期編成の廃止とは別物
3. **tier1化（R-2）は承認。** 第4引数を `2→1` に変更し、HP上限も `BIGMATCH_ENG` → `ENG` へ同時に切り替える（設計書 §6.4）。消耗式（`wear = 12 + (1 - hpRatio) × 20`／floor 40／準決後回復 +15）は**据え置き・補正なし**。計測で消耗カーブが壊れないことは確認済み

R-1・R-3・R-4・R-7・R-8 は元の記述どおり実装する。

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

### R-2. 試合形式をビッグマッチ→通常に 【承認済み・数値検証済み】

`management.js:24855-24859` の第4引数を `2` → `1` にする。tier1化は承認済み（数値影響は設計書 §6・`test/agw-tier-comparison.js` で検証済み。消耗カーブは壊れない＝補正なし）。

**単なるフラグ変更ではない点に注意:**

- HP上限も `BIGMATCH_ENG.hpBase / hpScale`（`management.js:24853-24854`）→ `ENG.hpBase / hpScale` へ**同時に**切り替える。第4引数だけ `1` にして BIGMATCH基準の `_hpOverride` を残す実装は禁止（通常最大HPを超える開始HPが入り消耗の意味が崩れる。設計書 §6.4）
- 検証用の `runLegacy()` / `simulateNextBout()` 双方で基準を揃える（設計書 §6.4）

したがって:

1. HP上限基準を `ENG` に揃えて第4引数を `1` にする
2. **実装後に auto-sim を回す**（`node test/auto-sim.js 200`、シード複数）
3. `specs/autumn-gauntlet-war-spec-v0.1.md` の tier 記述を tier1・通常HP・消耗据え置きに更新し、`test/agw-tier-comparison.js` の計測表を根拠として反映する

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

**確定した流れ（Phase 1 決裁・Week 35 事前編成は廃止）:**

```
週36到達
  ↓
「今週は 4団体勝ち残り対抗戦です」— 大会の導入画面
（大会エンブレム / 参加4団体 / ルール要約 / 3ステップ図）
  ↓
編成画面（本番週の頭で一度だけ。未操作なら OVR 昇順で自動編成）
  ↓
大会進行 →（決勝進出時のみ）決勝前の並び替え → 決勝 → 結果 → MVP
```

- **Week 35 のエントリー phase・事前編成モーダル・週35バナーの編成導線は撤去する。** 現状の `management.js:14873-14881`（`autumnWarPhase:'entry'`）と `App.awOpenEntryModal()` 経由の週35編成は Week 36 導入直後の編成へ統合する。週34告知（`Engine.autumnWar.announce`）は存置
- `#showResultOverlay`（興行結果用）の流用をやめ、**AGW専用の `#autumnWarOverlay` / `#autumnWarScreen` を持たせる**（設計書 §3.3）。`box.style` を JS から潰す実装（`ui-common.js:16049-16052` ほか）は廃止する
- phase は `data-phase="intro|entry|board|reorder|result|mvp"` で表し、JS から style 文字列を代入しない（設計書 §3.3・§3.4）
- 設計書では暫定 **S9 秋の陣シーケンス**（純黒Stage / 秋エンブレム / `var(--ev-autumn)`+`var(--gold)` / 縦の勝ち上がり線 / 勝者中央残り）。`docs/ui/02-layouts.md` は本タスクの変更許可外なので、S9 は暫定IDとして扱い正式追記はしない
- Stage系の画面中はグローバルナビ・トップバーを出さない（設計書 §3.3、`docs/ui/03-screens/autumn-gauntlet-war.md:128`）
- 週36開始後は大会完了までOfficeへ戻さない（事前編成廃止により途中離脱の入口を持たない）

### R-6. 編成画面をスタンド画像を使ったビジュアル編成に 【まずモックアップ】

`_awEntryModalHtml()`（`ui-common.js:16175`）を、Week 36 導入直後に開く専用編成画面（`data-phase="entry"`）として作り直す。

**レイアウトは未確定。まず簡易モックアップを1枚作り、それを前提に実装する（Phase 1 決裁）。** 設計書 §4 の L1（推し「中央3枠 + スタンド候補棚」）/ L2 / L3 と、その「共通要件」「レスポンシブ方針」を制約とする。モックアップで L1 の良し悪しを見て、必要なら L2/L3 を選んでよい。

- 現在は draft画面の `draft-fc cand` クラス流用＋アッパー画像。**スタンド画像 `getStandUrl(id, ovr)`（`data.js:540`）を使った編成画面**にする
- スタンド使用の先例: `ui-render.js:452`, `11224-11225`, `12223-12224`, `ui-common.js:11982`, `12240`, `12410`、ラッパ `ui-render.js:6716`
- 3名を選ぶだけでなく、**出場順（勝ち抜きの並び＝先鋒/中堅/大将）が意思決定として見えるように**する。誰を先鋒に置くかがこの大会の肝であることが伝わる画面にすること
- OVR・コンディション・相手団体との力関係（平均OVR・OVR幅。決勝の最終順は伏せる）が読める情報設計にする
- **[おまかせ] ボタン = OVR 昇順（大将＝最強）で3名を自動確定。未操作のまま開戦した場合もこのデフォルトを適用する**

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

### Phase 1: 設計 — 完了・承認済み（2026-07-21）

設計は `docs/agw-rework-design.md`、tier1化の計測は `test/agw-tier-comparison.js` で完了。再着手不要。決裁内容は本指示書冒頭の「⚑ Phase 1 は承認済み」を参照。

### Phase 2: 実装 ← ここから

R-1〜R-8 を実装する。着手前に `docs/agw-rework-design.md` を通読すること。

**段取り:**

1. **まず R-6 の編成画面モックアップを1枚作り、レイアウト（L1/L2/L3）を確定させる**（Phase 1 決裁でレイアウトは未定）
2. その後 R-1〜R-8 を優先順で実装

**優先順位**: R-6モックアップ →（レイアウト確定）→ R-1（観戦）> R-3・R-4（情報が読めない）> R-5・R-6（画面設計）> R-7（ルール）> R-2（tier変更）> R-8

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
- **Keisuke が実機で確認すべき画面・操作の具体的な列挙**（週34告知 → 週36導入 → 週36編成（未操作時のOVR順おまかせ含む）→ 進行 → 観戦 → 決勝前並び替え → 結果 → MVP の順で、どこを見ればよいか）
