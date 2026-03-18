# 試合画面UI刷新 実装指示書

> Claude Codeセッションで本ファイルを読み込んで実装を開始すること。
> Phase順に1つずつ進める。1 Phase = 1セッションが目安。

---

## 参照ファイル一覧

| ファイル | 場所 | 用途 |
|---|---|---|
| **本ファイル（実装指示書）** | `docs/battle-ui-implementation-guide.md` | 実装の手順と注意事項 |
| **確定仕様書** | `specs/battle-ui-spec-v1.0.md` | 全11セクションの仕様。判断に迷ったらここを参照 |
| **実装計画** | `docs/battle-ui-implementation-plan.md` | Phase 0〜7のタスク一覧 |
| **未決定事項アジェンダ** | `docs/battle-ui-next-agenda.md` | まだ決まっていない項目。ここに書いてある事は実装しない |
| **プロトタイプ（対戦カード）** | `src/prototype/match-card-prototype.html` | 対戦カード紹介画面の確定レイアウト。CSS・HTML構造・遷移アニメーションの参考実装 |
| **プロトタイプ（全演出）** | `src/prototype/battle-effects-mockup.html` | ダメージ・カットイン3種・ビッグムーブ・カウンターの確定演出。CSS・アニメーション・SE・タイムラインの参考実装 |
| **プロトタイプ（Concept F）** | `src/prototype/concept-f-panel-hud.html` | バトル画面レイアウトの最終採用ベース |
| **現行バトルエンジン** | `src/battle-engine.html` | 改修対象ファイル |
| **ゲーム全体仕様** | `CLAUDE.md` | 開発ルール・アーキテクチャ5原則 |

---

## 実装の原則

1. **プロトタイプのCSS/JS/HTMLをそのまま流用してよい**。プロトタイプは確認済みの最終形なので、コピペベースで既存コードに組み込む形でOK
2. **battle-engine.htmlは単体HTMLでiframe経由呼び出し**。画像パスは `../../image/` 相対パス
3. **既存のロジック（バトル計算・フェーズ判定・SE関数群・FINISH CLICK SYSTEM等）は変更しない**。見た目とアニメーションの差し替えが主作業
4. **変更するのはCSS・HTML構造・表示関連JS**。Engine側のロジック変更はPhase 4-5のトリガー条件のみ
5. **auto-sim 100シーズン ALL CLEAR を各Phase完了時に確認**（表示系の変更のみのPhaseでは省略可）
6. **実装後のスクリーンショット確認・ブラウザ起動・サーバー起動は不要**。ユーザーが自分でテストする

---

## Phase別の実装手順

### Phase 0: 下準備

**作業内容:**
1. `src/data.js` に `getFullUrl(id)` を追加
   - パス: `image/full/full_{name}.webp`
   - 既存の `getPortraitUrl` / `getUpperUrl` と同じパターンで実装
2. `getUpperUrl(id)` の現状確認
   - 現在はstand画像パス（`image/stand/stand_{name}.webp`）を返している
   - **リファクタ方針**: `getUpperUrl` を `getStandUrl` にリネーム → 新しい `getUpperUrl` をupper画像パス（`image/upper/upper_{name}.webp`）用に作成
   - `getUpperUrl` の呼び出し元を全ファイルでgrepし、全箇所を `getStandUrl` に書き換え
   - 旧 `getUpperUrl` が残っていないことを確認

**完了条件:** `getStandUrl(id)`, `getUpperUrl(id)`, `getFullUrl(id)` の3関数が正しいパスを返す

---

### Phase 1: レイアウト刷新

**参照プロトタイプ:** `concept-f-panel-hud.html`（レイアウト構造）、`battle-effects-mockup.html`（中央パネルのスタイル）

**作業内容:**

1. **HUDバーの刷新** — 現行のヘッダー+パネル内HP表示 → グリッド上に独立したHUDバー
   - `concept-f-panel-hud.html` の `.hud` セクションをそのまま移植
   - 顔アイコン+選手名+スタイル名、対面HPバー、モメンタムバー

2. **中央パネルの刷新** — `battle-effects-mockup.html` のCSS参照
   - 全要素 `text-align:center`
   - `.turn-lbl`: `T8` → `ターン 8`（Noto Sans JP 20px 太字 ゴールド）
   - `.nar-box`: border-left廃止、中央寄せ。`.nar-move` 16px、`.nar-text` 16px太字、`.nar-dmg` 14px赤
   - `.move-name`: 18px太字
   - `.log-entry`: 9px、`.log-turn`: 8px。背景を薄く
   - `.top-line`: `justify-content:center`、gap:12px

3. **選手パネル情報の変更**
   - `.f-style`: 正式スタイル名（Power Fighter → Grappler等）。データ側の `style` フィールドを参照して表示
   - `.f-rival-badge`: ライバル関係がある場合に両パネルに表示。`matchData.matchInfo.rivalryTier > 0` で判定
   - タイトルマッチ時のベルト表示
   - `.f-name` にクリックイベント追加 → `showFighterPopup(id)` 呼び出し

4. **旧レイアウトのCSS/HTMLを削除**（site-header等の不要部分）

**完了条件:** バトル画面の見た目がConcept Fベースになっている。HUD上部、3カラム構造維持

---

### Phase 2: ダメージ表現の刷新

**参照プロトタイプ:** `battle-effects-mockup.html` のCSS+JS

**作業内容:**

1. **旧演出CSSの廃止**
   - `.fighter-panel.exhausted .portrait-area img` のfilter（画像暗転）→ 削除
   - `.fighter-panel.critical .portrait-area img` のfilter+赤パルス → 削除
   - `flash-hit` 関連 → 削除
   - これらを参照するJS箇所も削除（`classList.add('exhausted')` 等）

2. **新演出の移植**（`battle-effects-mockup.html` から）
   - **shake**: `@keyframes shakePanel` + `.fighter-panel.shake`（既存と同じなら維持）
   - **強shake**: `@keyframes shakeHard` + `.fighter-panel.shake-hard`（クリティカル用、新規追加）
   - **ダメージ数字**: `.dmg-number` + `@keyframes dmgNumPop`（既存改修 or 新規移植）
   - **クリティカル数字**: `.dmg-number.crit`（52px、ゴールド色）
   - **画面フラッシュ**: `.flash-overlay` + `@keyframes flashScreen`
   - **HP25%赤グロー**: `.danger-glow`（height:45%, ellipse 130%, opacity 0.45）+ `@keyframes dangerPulse`

3. **JS側の差し替え**
   - `updPanelState` 関数内の `exhausted`/`critical` クラス付け替えロジックを、新しい `danger-glow` 表示ロジックに差し替え
   - ダメージ表示関数を `battle-effects-mockup.html` の `showDmgNum` ベースに統一

**完了条件:** 通常ダメージでshake+数字、クリティカルでフラッシュ+強shake+金色数字、HP25%以下で足元赤脈動。旧暗転演出が一切残っていない

---

### Phase 3: カットインシステム刷新

**参照プロトタイプ:** `battle-effects-mockup.html` のカットイン3種

**作業内容:**

1. **cutin-overlay HTMLの差し替え**
   - 現行の `.cutin-portrait`（56×56丸face）→ 100×150矩形upper画像に
   - `.cutin-text` 15px → 20px太字
   - オーバーレイにクリックイベント追加（`dismissCutin`）。自動消去の `setTimeout` を削除
   - 「CLICK TO CLOSE」テキスト表示追加

2. **カットインCSS移植**（3種類）
   - `.cutin-box`（セリフ用、ゴールド枠）
   - `.cutin-box.damage-serif`（ダメージセリフ用、赤枠）
   - `.cutin-box.damage-voice`（ダメージボイス用、濃い赤、28px）
   - スライドインアニメーション（左/右）

3. **セリフデータの追加**（`data.js`）
   - `DAMAGE_SERIF_LINES`: 性格×属性の2次元テーブル
   - `DAMAGE_VOICE_LINES`: 属性のみの1次元テーブル
   - 既存の `CUTIN_LINES` は維持（セリフ用）

4. **showCutin関数の拡張**
   - 既存の `showCutin(side, charData, lineType)` を拡張して3種類のカットインに対応
   - `showDamageSpeech(side, charData)` — ダメージセリフ用。性格×属性で分岐
   - `showDamageVoice(side, charData)` — ダメージボイス用。属性のみで分岐
   - いずれもupper画像を使用（`getUpperUrl(charData.id)` — Phase 0でリファクタ済み）

5. **SE追加**（`sfx` オブジェクトに追加）
   - `cutinSlide()`: `osc('sine',300,800,.08,.06); mkNoiseHP(.03,.04,4000)`
   - `dmgVoice()`: `osc('sine',200,80,.2,.06); mkNoiseLP(.08,.05,800)`

**完了条件:** 既存のセリフカットインがupper画像+大文字に置き換わっている。ダメージセリフとダメージボイスが正しい条件で発火する

---

### Phase 4: ビッグムーブ演出

**参照プロトタイプ:** `battle-effects-mockup.html` の `demoBigMove` 関数

**作業内容:**

1. **SE追加**（`sfx` オブジェクトに追加）
   - `bigmoveCharge()`: 低音ライザー（`battle-effects-mockup.html` の実装そのまま）
   - `bigmoveImpact()`: 重い衝撃音（同上）

2. **ビッグムーブ発動条件の実装**
   - `nextTurn` / `resolveTurn` 内で、技のダメージが閾値を超えた場合にビッグムーブ演出を挿入
   - 閾値候補: `dmg >= 20`（要調整。仕様書では「一定以上のダメージ」としか決めていない）
   - 1試合のカウンター: `S.bigmoveCount`（0で初期化、発動ごとに+1、3以上で発動しない）
   - 技の成否はまだ未確定の段階で発動する（カウンター判定の前）

3. **演出フローの実装**
   - セリフカットイン表示（Phase 3の `showCutin` を呼ぶ。lineType='bigmove'）→ 1.5秒後に消去
   - 技名表示（`.bigmove-name`）→ 0.5秒後にダメージ適用
   - タイムライン: 0s→カットイン+溜め音 / 1.5s→消去 / 1.8s→技名 / 2.3s→ダメージ / 3.0s→クリーンアップ

4. **決め技系セリフデータ追加**（`data.js`）
   - `CUTIN_LINES.bigmove`: 性格×属性。「ここで…決める！！」系

5. **技名表示のCSS/HTML追加**
   - `.bigmove-name` + `.bigmove-name.show` + `.bigmove-name.fade`
   - `battle-effects-mockup.html` からそのまま移植

**完了条件:** 高ダメージ技で自動的にセリフカットイン+溜め音+技名表示+重い着弾音が発動。1試合3回まで

---

### Phase 5: カウンター演出

**参照プロトタイプ:** `battle-effects-mockup.html` の `demoCounter` 関数

**作業内容:**

1. **カウンターSE差し替え**
   - 現行の `sfx.counterSE()` を差し替え
   - 新: `mkNoise(.12,.3); osc('sine',150,40,.2,.2); mkNoiseLP(.15,.2,500); osc('square',800,200,.08,.12); setTimeout(()=>{mkNoiseHP(.08,.15,3000);osc('sine',60,30,.15,.1)},60)`

2. **COUNTER!テキストのCSS/HTML追加**
   - `.counter-big` + `.start-left` / `.start-right` + `.slide-in` + `.fade-out`
   - `.bigmove-name.blown-right` / `.blown-left`
   - `battle-effects-mockup.html` からそのまま移植

3. **カウンター演出フローの実装**
   - ビッグムーブ演出（Phase 4）が開始された後、カウンター判定が成功した場合に分岐
   - タイムライン: ビッグムーブと同じ導入(0〜1.8s) → 技名表示(1.8s) → COUNTER!スライドイン+技名blown(2.3s) → フラッシュ(2.3s) → 反撃ダメージ(3.2s) → クリーンアップ(3.8s)
   - COUNTER!のスライド方向は防御側の位置で決定（右が防御→start-right→blown-left）

4. **既存のカウンター処理との連携**
   - 現行の `isCounter` 判定ロジックはそのまま維持
   - ビッグムーブ演出が発動した技でカウンターが発生した場合のみ、新カウンター演出を使用
   - ビッグムーブ演出なし（通常攻撃）のカウンターは現行通りの処理

**完了条件:** ビッグムーブ→カウンター連鎖で、技名がCOUNTER!に吹き飛ばされる演出が正しく動作。SE「バケッ！」が鳴る

---

### Phase 6: 対戦カード紹介画面

**参照プロトタイプ:** `match-card-prototype.html`（確定レイアウト+遷移演出）

**作業内容:**

1. **HTML構造の追加**
   - `.match-card` セクション（対戦カード画面）を `battle-engine.html` に追加
   - `.battle-screen`（バトル画面）で既存の `.match-grid` をラップ
   - 初期状態: match-card表示、battle-screen非表示

2. **CSS移植**
   - `.venue-bg`（会場背景+暗幕+リング床ライン）
   - `.card-fighters`（full画像配置、幅50%、object-fit:cover、object-position:center 95%、左scaleX反転）
   - `.card-info`（中央テキスト: 興行名/第N試合/SINGLES MATCH/VS/対戦成績/バッジ）
   - `.scanlines` + `.card-corner-frame`
   - パネルスライドインアニメーション

3. **データ連携**
   - `matchData.matchInfo` から情報を取得して表示
   - 興行名、試合番号、試合形式
   - 選手名、スタイル（`getFullUrl(id)` でfull画像取得）
   - 対戦成績（`G.h2h` から取得）
   - ライバルバッジ（`rivalryTier > 0`）
   - タイトルマッチバッジ（`matchData.matchInfo.isTitle`）
   - 初顔合わせ判定（h2hレコードの総試合数=0）

4. **遷移演出の実装**
   - NEXTボタン → `startTransition()` 呼び出し
   - ゴングフラッシュ(0ms) + `sfx.gongStart()`
   - FIGHT!テキスト(200ms→800ms)
   - match-cardフェードアウト(1000ms)
   - battle-screenアクティブ化 + パネルスライドイン(1200ms)
   - 中央パネルフェードイン(1200ms+0.3s遅延)
   - NEXTボタン再有効化(2200ms)

**完了条件:** 試合開始時にfull画像のポスター構図カード画面が表示され、NEXTクリックで遷移演出を経てバトル画面に切り替わる

---

### Phase 7: 統合テスト・調整

**作業内容:**

1. auto-sim 100シーズン ALL CLEAR確認
2. 各演出が正しいタイミングで発火するか通しで確認
3. ビッグムーブ→カウンター→ダメージセリフの連鎖テスト
4. 対戦カード→バトル→決着までのフロー確認
5. SE音量バランスの確認（新規SE5種 vs 既存SE）
6. `game-system-roadmap.md` を更新して完了タスクを記録

---

## 注意事項

- **未決定事項（`battle-ui-next-agenda.md` の7項目）には手を出さないこと**。フェーズ遷移演出、勝利演出、ピンフォール演出等は別途打ち合わせ後に実装
- **full画像はバトル中の演出には使用しない**（対戦カード画面のみ）。ビッグムーブ演出でfull画像パンを入れてはいけない
- **SE関数群（sfxオブジェクト）に追加するのは5つ**: bigmoveCharge, bigmoveImpact, counterSE(差替), cutinSlide, dmgVoice。既存のSEは変更しない
- **カットインは全てクリックで消す**。自動消去の setTimeout は入れない
- **`.app` のサイズは `max-width:1400px; padding:20px` を維持**。変更しない
