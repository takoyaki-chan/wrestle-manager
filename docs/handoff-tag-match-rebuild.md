# タッグマッチ観戦システム 仕切り直し引き継ぎ書

> 作成日: 2026-04-17
> 最終更新: 2026-04-17 (演出まわりまとめて完了)
> **対象ブランチ: `feature/tag-match-integration` に統一済み**
> **作業ディレクトリ: `C:/Users/nkmrk/Downloads/wrestle-manager` (main worktree)**
> 方針: **種別ごとに一度に直さず、1項目ずつ分類して順番に潰す**。以前のように全部一括実装は禁止。

---

## ⚠️ ブランチ運用ルール (2026-04-17 統一)

以前は `claude/wonderful-heisenberg` ワークツリー (`.claude/worktrees/wonderful-heisenberg/`) で作業していたが、
分散して混乱する原因となったため統一済み:

- `claude/wonderful-heisenberg` ブランチ → `feature/tag-match-integration` にマージ後削除
- ワークツリー `.claude/worktrees/wonderful-heisenberg` → 削除
- **今後のタッグ試合作業は `feature/tag-match-integration` 一本**で行う
- `C:/Users/nkmrk/Downloads/wrestle-manager` の main worktree で作業すれば OK

---

## 現状の要約

タッグマッチのビジュアル観戦モードを実装した結果、**4種類の問題**が混在している状態だった。
この引き継ぎ書では問題を **カテゴリ別に切り分けて**、1件ずつ直していく。

**2026-04-17 セッション前半 (fed3a2a8) で完了した項目:**
- ✅ **V1** ステータスバー表示復旧 (6509a5e)
- ✅ **F1** タッチを独立フレームに分離 (8bf5304)
- ✅ **V1追加** 左チームバーを中央対称ミラー (a804be9)
- ✅ (運用) heisenberg → feature/tag-match-integration にブランチ統一 (0bbd170)

**2026-04-17 セッション後半 (d3f5937 〜 1c14b70) で完了した項目:**
- ✅ **E1** `touchSuccessRate` を HP 閾値段階化に反転 (d3f5937)
- ✅ **E2** `pinAttemptBaseRate`/`pinAttemptSuccessBase` に低HP線形ボーナス (両ファイル) (d3f5937)
- ✅ **E3** カウンターKO 動作確認 (実装済み、変更なし)
- ✅ **B1** タッチ頻度再測定: 4→7.8回/試合、決着率 84.5% に改善 (d3f5937)
- ✅ **S1** 技カテゴリと音の組み合わせ修正 (`moveCat` を frame 経由で propagate) (dc4b661)
- ✅ **U3** ピンカウント演出 (ワン/ツー/スリー) — **クリック駆動化** (7da7253, 1c14b70)
- ✅ **U1** モメンタムバー符号反転 (攻撃決めた側が伸びる) (f40e929)
- ✅ **U2** 丸め込み決着演出 (イントロ + ワン/ツー/スリー) (9363644, ff9a02f)
- ✅ **U4** ギブアップ/ロープエスケープ/TKO 演出 (gu ロック→極まっている→タップ) (9363644)
- ✅ (副次) ダメージポップアップをピン seq 先頭に統合 (被弾→苦悶→カバー→1,2,3) (c3e18df)
- ✅ (副次) NEXT TURN が詰まる 2 件のランタイムエラー修正 (83031c4)

**残り (次セッション以降):**
- **B2** friendlyFire 体感調整 (実プレイで違和感あれば数値見直し)
- **F2** (保留) F1 修正後 `touchPause` 700ms が冗長化していないか検証

---

## 分類表（問題一覧 — 残作業）

| # | カテゴリ | 重要度 | 状態 | 症状 | 次アクション |
|---|---------|:---:|:---:|------|:---:|
| V1 | Visual / UI | 高 | ✅完 | ステータスバーのフィル表示 | — |
| V2 | Visual / UI | 中 | ✅完 | 左チームのバーミラーリング | — |
| F1 | Frame / タイミング | 最高 | ✅完 | タッチと攻撃が同一フレームで起きる問題 | — |
| F2 | Frame / タイミング | 中 | 保留 | F1 修正で `touchPause` 700ms が冗長化していないか | 任意 |
| E1 | Engine Logic | 最高 | ✅完 | 低HPでタッチ成功率が上がらない | — |
| E2 | Engine Logic | 最高 | ✅完 | 低HPでフォールが決まらない | — |
| E3 | Engine Logic | 中 | ✅完 | カウンターKO動作確認 | — |
| S1 | Sound | 高 | ✅完 | 技カテゴリと音の組み合わせ誤マッチ | — |
| U1 | Visual / UI | 中 | ✅完 | モメンタムバー符号逆転 | — |
| U2 | Visual / UI | 中 | ✅完 | 丸め込み決着の試合中表記 | — |
| U3 | Visual / UI | 高 | ✅完 | ピンカウント演出 (クリック駆動) | — |
| U4 | Visual / UI | 中 | ✅完 | ギブアップ/TKO 演出 | — |
| B1 | Balance | 中 | ✅完 | タッチ頻度 (E1/E2 後 7.8回/試合) | — |
| **B2** | Balance | 低 | ⬜ | friendlyFire 誤爆ダメージ (2-4＋MHP50%フロア) の体感 | **実プレイ判定待ち** |

---

## カテゴリ別・根本原因メモ

### V1: ステータスバーのフィルが見えない

- 対象ファイル: `src/ui-common.js` line 3771-3793（`_tagFighter` 関数）
- HTML 構造:
  ```html
  <div class="smc-tag-srow">
    <span class="smc-tag-sl">PW</span>
    <div class="smc-tag-strk">
      <div class="smc-tag-sfill pw" style="width:${pw}%"></div>
    </div>
  </div>
  ```
- 値は `f.pw||0` などの生ステ（40-100）を width% にしている
- CSS は `src/index.html` 内、`.smc-tag-strk{flex:1;height:3px;background:rgba(200,190,170,.08);...}` と `.smc-tag-sfill{height:100%;...}` がある
- **推定原因候補**:
  - a) `.smc-tag-info` が `flex:1` で、`.smc-tag-statbars` が width:100% を取れていない
  - b) `.smc-tag-srow` の flex 並びで `.smc-tag-strk` が幅 0 になっている
  - c) ミラーリング CSS（`.smc-tag-team.left .smc-tag-srow{flex-direction:row-reverse}`）が幅計算を壊している
  - d) `.smc-tag-sfill` の背景色 CSS ルール自体が定義漏れ or クラス名ミスマッチ
- **次セッションの手順**:
  1. 実機 DevTools で `.smc-tag-strk` と `.smc-tag-sfill` の computed width を確認
  2. 原因特定してから1行だけ直す。**他のCSSは触らない**

### F1: タッチと攻撃が同一フレームで発生

- 対象ファイル: `src/match-engine.js` `pushFrame` 関数周辺（line 502 付近）
- 現状: 1ターンの中で `attack` 処理 → `wantTouch` 判定 → タッチ成立 → **同じフレームに両方の状態**が入って push される
- 再生側 `tag-battle-main.js` の `applyFrame`（line 540-595）では、attack と touch を同一フレームで順番にアニメさせているが、**ロジック順序としては「攻撃してからタッチした」ように見える**
- **ユーザー要求（原文）**:
  > タッチはタッチで単独の、例えばターン10とターン11の間のターン10.5みたいなところでタッチが発生するようにしないと、これはいつまでもタッチと技の同時発動で、見せ方としてタッチが下げに来るみたいになっちゃうからです
- **修正方針**:
  - エンジンで「タッチが発生するターン」は **2フレーム** を push する
    - フレーム A（ターン N 本体）: `action = 攻撃データ`、`legalA/legalB = タッチ前のファイター`
    - フレーム B（ターン N.5 相当）: `action = null`、`legalA/legalB = タッチ後のファイター`、`events: [{kind:'touch', from, to}]`
  - 再生側は各フレームの `minDelay` を独立に計算。2フレーム分のアニメ時間で見せる
  - turn 番号の扱い: B フレームは同じ turn 番号か、`turnSub: 0.5` を持たせる（UI表示は turn のみ、N.5 表示はしない）

### E1: 低HPでタッチが通らない

- 対象ファイル: `src/match-engine.js` `touchSuccessRate` 関数
- 現在の式:
  ```javascript
  const hpBase = (hpRatio - 0.20) * TC.canTouchHpWeight;  // hpRatio=0.1 → -0.0875
  return clamp(hpBase + spdBonus - oppBlock, TC.canTouchMin, TC.canTouchMax);
  ```
- 低HPで hpBase がマイナスに → 最低値 0.15 にクランプ → 実質15%で失敗連発
- **修正方針案A**（反転）:
  ```javascript
  // 低HPほど「必死にタッチを取りに行く」→ 成功率高
  const hpBase = hpRatio < TC.wantHpCritical
    ? 0.85                                       // 瀕死は高確率
    : hpRatio < TC.wantHpThreshold
      ? 0.60                                     // 低HPは中確率
      : clamp(0.30 + (1 - hpRatio) * 0.4, 0.30, 0.70);  // 通常は中庸
  ```
- **修正方針案B**（単純反転）:
  ```javascript
  const hpBase = (1 - hpRatio) * 0.6 + 0.25;  // hpRatio=0.1 → 0.79, hpRatio=0.9 → 0.31
  ```
- どちらの案か、次セッションで検討してから1つ選ぶ

### E2: 低HPでフォールが入らない

- 対象ファイル: `src/match-engine.js`（`B.checkPinAttempt` / `B.calcPinAttemptSuccess` を battle-engine 側から呼び出している）、関連定数は `src/data.js` の ENG ブロック
- **現状の問題**:
  - `pinAttemptBaseRate=36`（攻撃ヒット後にピンに入る確率36%）
  - `pinAttemptSuccessBase=23`（ピン入れた後に決まる基礎23%）
  - 低HPスケーリングはあるが、実戦で「HP 5% でもフォールしない」レベル
- **修正方針**:
  - `pinAttemptBaseRate` に低HPボーナスを強く効かせる（HP20%以下で +40, HP10%以下で +60 等）
  - `pinAttemptSuccessBase` も同様に低HP側を大幅強化
  - または新定数 `pinLowHpBonus` を追加して体系化
- **注意**: battle-engine.html 側と両方の実装を確認すること

### E3: カウンターヒット後のKOチェック

- 対象ファイル: `src/match-engine.js` カウンター処理ブロック
- 前セッションで追加済み（fall/gu/tko 分岐 + kickout + cutin）
- 次セッションで**動作確認のみ**。実装変更は不要な想定

### V2: 左チームミラーリング

- 対象ファイル: `src/index.html` line 232-260 付近
- 追加済み CSS:
  ```css
  .smc-tag-team.left .smc-tag-fighter{flex-direction:row-reverse}
  .smc-tag-team.left .smc-tag-info{text-align:right;align-items:flex-end}
  .smc-tag-team.left .smc-tag-ovr-row{flex-direction:row-reverse;justify-content:flex-start}
  .smc-tag-team.left .smc-tag-srow{flex-direction:row-reverse}
  .smc-tag-team.right .smc-tag-info{align-items:flex-start}
  ```
- 実機で違和感がないか確認。V1 の解決と同時にチェックすると効率的

### B1: タッチ頻度

- 直近計測で 200試合平均4回/試合（過剰ではない）
- E1/E2 修正後に再度 `node test/auto-sim.js 200` 等で計測

### B2: friendlyFire

- apronダメージ 2-4（mhp*0.5 フロア付き）
- 実機で「味方誤爆が多すぎ/少なすぎ」の体感確認のみ

---

## 着手順（残作業）

1. **B2** friendlyFire 体感調整 — **実プレイ先行**、違和感あれば数値見直し。
   対象: `src/match-engine.js` line 946-959 付近 (ffDmg 2-4, MHP×0.5 フロア)。

**auto-sim は最小限に** (memory `feedback_auto_sim_ui_only.md` 参照):
- B2 の数値変更時のみ 100 シーズン×複数シードで違反検出
- UI/観戦専用ロジックのみなら不要

---

## クリック駆動ピン seq アーキテクチャ (2026-04-17 実装)

試合演出はシングル battle-engine.html と同じ「クリックで進む」仕様に統一。
コード: `src/tag-battle-main.js` line 830-940 付近。

- **エンジン** (`src/match-engine.js`): 決着判定点で `dramaSummary.push({type:'pinAttempt', attemptType, outcome, count, byId, onId})` を追加。attemptType は `fall`/`pin`/`rollup`/`gu`/`tko`。
- **再生側 applyFrame**: pinAttempt イベントを検出したら `_beginPinSequence` を呼ぶ。
- **`_buildPinCtrl`**: attemptType 別に seq (step の配列) を構築:
  - fall/pin: `[damage?, ワン, ツー, スリー/返した/cutin]`
  - rollup: `[intro'丸め込みだーっ！', ワン, ツー, スリー/cutin]` (damage はなし)
  - gu win: `[ロック, 極まっている, タップ]`
  - gu escape: `[ロック, ロープエスケープ]`
  - tko: `[T K O ！]` の 1 step
- **step 種別**: `count` (.pin-count DOM 表示) / `damage` (showCutin) / `cutin` (showCutin)
- **進行**: 各 step 表示後 700ms は nBtn を disable (連打防止)、以降クリックで `_advancePinStep` が次を実行。最終 step 消化で `_finishPinSeq` → winner なら 800ms 後 showResult、非 winner なら通常フローへ。
- **cutin/damage step**: showCutin の pendingCutin=true を流用。`dismissCutin` が pinCtrl の kind を見て `_advancePinStep` or `_finishPinSeq` を呼び分け。
- **CSS**: `.pin-count` とそのバリアント (.three / .kickout / .tko / .lock / .agony / .tap / .escape / .rollupIntro) が `src/tag-battle.html` にある。

---

## 現在のブランチ状態 (2026-04-17 後半まで)

### ブランチ
- `feature/tag-match-integration` (ローカルのみ、origin より先行)

### 直近コミット (新しい順、後半セッション分のみ)
- `1c14b70` — ピンカウントの連打防止クールダウン (700ms)
- `ff9a02f` — 丸め込み勝利の逆転感を明示 (intro + クリーンな 3 カウント)
- `9363644` — 丸め込み/ギブアップ/TKO 演出をクリック駆動ピン seq に統合 (U2/U4)
- `83031c4` — NEXT TURN が詰まる 2 件のランタイムエラーを修正
- `c3e18df` — crit ヒット+ピン同フレームでダメージ演出を seq 先頭に組み込み
- `7da7253` — ピンカウントとダメージ演出をクリック駆動化 (シングル同等の間合いに)
- `f40e929` — モメンタムバー符号反転とピンカウント速度をシングルに整合 (U1/U3 refinement)
- `dc4b661` — 技カテゴリ音ズレ修正とピンカウント演出実装 (S1/U3)
- `d3f5937` — 低HPタッチ/ピン判定を体力連動に是正 (E1/E2)

### 次セッション冒頭でやること
1. `git status` / `git log --oneline -15` で現状確認
2. この引き継ぎ書を再読
3. **B2 の実プレイ体感を踏まえて判断**。違和感なければ完了宣言。違和感あれば数値調整。
4. 完了したら `docs/game-system-roadmap.md` にタッグ演出整備の完了を追記 + この引き継ぎ書を `docs/archive/` へ移動。

---

## 絶対にやってはいけないこと

1. ❌ 数値を変えない変更で auto-sim を走らせる — `feedback_auto_sim_ui_only.md` 参照
2. ❌ CSS の一括リファクタ — 原因特定前に周辺 CSS を書き換えない
3. ❌ data.js の TAG_MATCH_CONFIG を一度に複数値変更 — 1 件ずつ効果測定
4. ❌ `claude/wonderful-heisenberg` ブランチの復活・新規ワークツリーの切り出し — `feature/tag-match-integration` に統一済み
5. ❌ ピン seq のクリック駆動を setTimeout 自動進行に戻す — ユーザー明示要望で click 駆動に統一済み

---

## ユーザーからの直近フィードバック（方針の原文）

> 一旦問題点を全部総合的に整理して、箇条書きにして次のセッションで直しましょう。ただ、もう種別ごとに一度に全部やろうとせず、1個1個分類して直さないといけない

> タッチはタッチで単独の、例えばターン10とターン11の間のターン10.5みたいなところでタッチが発生するようにしないと

> 体力がどんなに減ってもタッチしようとしない。本当にロジックどうなってんだよ

> しかも体力ゼロにほぼつけるのにフォールも入るんですよ

この4点（特に最後の3つ）が、次セッションで直す最優先ターゲット。
