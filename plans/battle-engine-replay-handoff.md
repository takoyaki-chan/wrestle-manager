# Phase 4c 権威モデル統一: single → Replay 引き継ぎ

作成: 2026-04-22
ブランチ: `refactor/battle-engine-replay`（main から分岐）
直前コミット: `8777092` Phase 1 - `Engine.battle.simulateMatch` に `recordFrames` オプション追加

---

## 目的（なぜやるか）

### 二つの目的が同時に解決される

1. **スキップ vs 観戦の結果乖離バグ解消**
   - 現状、シングル観戦時は `battle-engine.html` 内の自走シミュレータ（独自RNG）が走る
   - スキップ時は `Engine.battle.simulateMatch` が走る
   - 同じ `rngSeed` を渡しても **2つの独立したシミュレータ**なので結果が一致しない

2. **Phase 4c 積み残し「演出シーケンス共通化」の解消**
   - ロードマップに記載された積み残し: 「setTimeout ツリーの共通化 — streaming vs Replay の権威モデル差に絡むため権威モデル統一議論と合わせて設計する必要あり」
   - タッグは既に Replay 方式を採用済み（`tag-battle-main.js`）。シングルを Replay に揃えれば、この積み残しが自然に解ける

### 方針

**シングルを Replay モデルに移行する**。エンジンが結果＋フレーム列を返し、iframe はそれを再生するだけの薄い layer にする。

---

## 完了済み（Step 1-6 全完了 2026-04-22）

Step 2: `src/battle-engine-main.js` 新設（Replay 方式の観戦ロジック）
Step 3: `src/battle-engine.html` を薄いシェルに縮小（自走ループ / RNG / 技テーブルを削除）
Step 4: `src/app.js` watchMatch を Replay 版に切り替え（事前 simulateMatch + `sp.results[idx]` に結果格納）
Step 5: PPV / War / JT / B2 / B3 watch パス順次移行、`Engine.event.resolveEventMatch` / `Engine.ppv.simulatePPVMatch` に `opts` 引数追加、JT match-loop を `recordFrames: true` に
Step 6: `src/battle-replay-core.js` 新設、共通ヘルパー抽出:
  - Plan A: 定数 (SPEED_DELAYS / BIGMOVE_CHARGE_MS / FRAME_DELAYS / PIN_SEQ_LEAD_MS / BIGMOVE_ANIM_RATE) + `hpCls` / `_frameMinDelay`
  - Plan B: インパクト演出ヘルパー (`_applyShake` / `_applyCounterFlash` / `_playImpactSE` / `_flashRedOverlay` / `_fadeSplash`)

セッション中の追加修正:
- bigmove 過剰発動: `big = moveD >= 14` + phase rate + 3回上限に是正（旧 battle-engine.html 準拠）
- ダメージセリフ停滞: cutin overlay に `onclick="dismissCutin()"` + 1500ms 自動 dismiss
- pin 演出スキップ: `applyFrame` の `pinSeqPending` 判定を `pinAttempt` のみ → `rollup / tkoStop / kickout` も拾うよう拡張

---

## （参考）Step 1 既完了分

### commit 8777092 — `Engine.battle.simulateMatch` に `recordFrames` オプション

`src/match-engine.js` の `simulateMatch(charL, charR, rng, matchTier, opts)` に第5引数追加。
`opts.recordFrames === true` のとき、各ターン末で `frames` にスナップショットを push。返り値に `frames` プロパティを含める。

フレームスキーマ（タッグ側と対称設計）:

```js
{
  turn, phase: phName,
  hpL, hpR, mhpL, mhpR,
  mom,
  gritL, gritR,
  kickoutCountL, kickoutCountR,
  consecL, consecR,
  logLines,   // この1ターン内に追加されたログ行
  action,     // {kind:'miss'|'hit'|'counter', atkSide, move, moveD, moveCat, dmg, isCrit, isBig}
  kickout,    // {count, escapeType:'fall'|'tko'|'gu'}
  pinAttempt, // 'success'|'kickout2'
  rollup,     // 'success'
  tkoStop,
  winner, finType, finMove, finishPhase,
}
```

**検証済み**: 5シード（11111/22222/33333/44444/55555）で `recordFrames` 有無によらず winner/mq/turns 完全一致。既存挙動は変わらない。

---

## 残タスク

### Step 2: `src/battle-engine-main.js` 新設（次セッションで着手）

**雛形**: `src/tag-battle-main.js` (1,545行)

**作業手順**:
1. `tag-battle-main.js` を精読し Replay 骨格を把握
   - state 構造（`S.frames` / `S.frameIdx` / `S.anim` / `S.speedIdx` / `S.pendingCutin` / `S.pinCtrl` / `S.heldWinLogs` / `S.pendingDamage` 等）
   - `startReplay(data)` → `renderMatchFrame()` → `nextFrame()` → `applyFrame()` の流れ
   - `animateAction(fr, prevFr)` / `_renderActionImpact()` / `tryDamageLine()` / `_frameMinDelay()` 等のヘルパー
   - `SPEED_DELAYS = [2500, 1500, 800]` と自動進行制御

2. シングル版 state を設計（タッグ固有を削り、シングル固有を残す）
   - **維持**: 5段タイミング（bigmove charge→技名→衝撃→セリフ→cleanup / 0/1.8/2.3/2.7/3.3s）、rivalry カットイン（`CUTIN_LINES`）、MISS!演出、CMT（damage lines、`battle-lines.js` 経由）、HUD描画、ビッグマッチ判定（`BIG MATCH` バッジ、Climax フェーズ）
   - **削除（タッグ固有）**: タッチ・エプロン・ケミストリー・ダブルチーム・カットインセーブ・見殺し・ホットタグ・同士討ち

3. `battle-engine.html` 現行の演出コード（`nextTurn` / `doFinish` / `doRollup` / `doTimeout` / MISS / COUNTER / NORMAL HIT / BIGMOVE）を参考にしつつ、**RNG ベースの判定を `frame.action` 読み取りに置換**する形で書く

4. **Step 2 単体では `battle-engine.html` に手を入れない**（並行で新ファイルを作るだけ）。Step 3 で切り替え。

**着手前にユーザー確認すべきこと**:
- START_MATCH メッセージ protocol を `{ left, right, matchInfo, result: {frames, winner, mq, finType, finMove, turns, hpLeft, hpRight, log} }` に拡張する方針でよいか
- `battle-engine-main.js` ↔ `tag-battle-main.js` の共通ヘルパー抽出（`battle-replay-core.js` 的な層）は Step 6 にまとめるか、Step 2 から並行でやるか

### Step 3: `battle-engine.html` を薄いシェルに

- CSS / HTML は残し、JS 本体（RNG・技判定・`nextTurn` 自走ループ）を削除
- `<script src="battle-engine-main.js">` で読み込むだけに
- 現状 2,593行 → `tag-battle.html` (491行) 相当に縮小
- **削除対象の行範囲**（`src/battle-engine.html`）:
  - 1100-1200: RNG/定数/技テーブル/`selMove`/`calcHitRate`/`calcDamage`/`determineFinishType`/`calcKickoutChance`/`calcGuEscapeChance`
  - 1703-2126: `nextTurn()` 自走ループ
- **維持**: 1200-1500 の CUTIN_LINES/CMT/BT_HINT_LINES、1519-1531 の postMessage 受信、2130-2473 の HUD/ダメージ数字/結果画面

### Step 4: `app.js` watchMatch を Replay 版に切替

**変更箇所**: `src/app.js` 4274-4349 の `watchMatch()`

- 事前に `Engine.battle.simulateMatch(L, R, rng, tier, {recordFrames:true})` を実行
- 結果を `sp.results[idx]` に格納（スキップ時との結果一致を担保）
- iframe に `START_MATCH` で `result: {frames, ...}` を送信
- **ユーザー動作確認**: スキップ vs 観戦で結果一致、演出リグレッションなし

### Step 5: PPV/War/JT/B2/B3 watch パス順次移行

同じパターンを `src/app.js` の各 watch 関数に展開（PPV `ppvWatchMatch`、対抗戦 `warWatchMatch` 等）。
`receiveBattleResult()` (4416-4499) のルーティングも Replay 対応に。

### Step 6: 共通ヘルパー抽出

`battle-engine-main.js` ↔ `tag-battle-main.js` で重複する処理を `src/battle-replay-core.js`（仮）に切り出し:
- `nextFrame` / `autoAdvance` / `speedControl`
- `_frameMinDelay`
- `_renderActionImpact`
- `tryDamageLine`
- state 初期化の共通部

→ これが完了すれば Phase 4c 本来の積み残し（setTimeout ツリー共通化）も自然に解決。

---

## 関連ファイル・参照先

- **エンジン**: `src/match-engine.js` (1,313行 / Phase 1 完了)
- **雛形**: `src/tag-battle-main.js` (1,545行) / `src/tag-battle.html` (491行)
- **移行対象**: `src/battle-engine.html` (2,593行)
- **呼出元**: `src/app.js` の `watchMatch` / `ppvWatchMatch` / `warWatchMatch` / `_watchTagMatch` / `receiveBattleResult`
- **既に共通化済み（Phase 4b）**: `src/battle-shared.css` / `src/battle-sfx.js` / `src/battle-anim.js` / `src/battle-lines.js`
- **specs**: `docs/game-system-roadmap.md` の Phase 4c セクション

---

## 重要な注意点

- **auto-sim は最小限に**（CLAUDE.md メモ）。今回の変更は `recordFrames=false` 時の挙動不変のためスキップ可。Step 1 検証時は `test/_tmp-frame-test.js` 的な専用スクリプトで5シード程度の同一性チェックで十分
- **auto-sim の読み込み方式**: `const` → `var` 置換 + `vm.runInThisContext` 方式（`eval()` ではスコープが閉じてエラー）
- **方針確認済み**: シンプル化が目的。`battle-engine.html` をさらに肥大化させる in-place 改修ではなく、**タッグと同構造の外部JS化**が正解（ユーザーから明示修正あり）
