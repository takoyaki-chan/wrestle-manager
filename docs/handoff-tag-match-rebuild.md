# タッグマッチ観戦システム 仕切り直し引き継ぎ書

> 作成日: 2026-04-17
> 対象ブランチ: `claude/wonderful-heisenberg`
> 方針: **種別ごとに一度に直さず、1項目ずつ分類して順番に潰す**。以前のように全部一括実装は禁止。

---

## 現状の要約

タッグマッチのビジュアル観戦モードを実装した結果、**4種類の問題**が混在している状態。
これまで「全部一括修正」を何度か試みたが、毎回別の問題が顔を出して混乱が深まった。
この引き継ぎ書では問題を **カテゴリ別に切り分けて**、次セッションで 1件ずつ直すための分類表とする。

---

## 分類表（問題一覧）

| # | カテゴリ | 重要度 | 症状 | 着手順推奨 |
|---|---------|:---:|------|:---:|
| V1 | Visual / UI | 高 | 試合実行画面のタッグ選手カードで、PW/SP/TE/ST のラベルは出るが**ステータスバーのフィル**が見えない | 1 |
| V2 | Visual / UI | 中 | 左チームのミラーリング（右向き配置）は CSS 適用済みだが、実機で違和感がないか未検証 | 6 |
| F1 | Frame / タイミング | 最高 | **タッチと攻撃が同一フレームで起きている**。見た目が「タッチ＝攻撃の後始末」に見える。ターン N とターン N+1 の間に「ターン N.5」として独立したタッチフレームを挟む必要がある | 2 |
| F2 | Frame / タイミング | 中 | タッチ後の pause（700ms）は入れたが、F1 を直すと不要になる可能性あり | 2と同時検証 |
| E1 | Engine Logic | 最高 | **体力がどんなに減ってもタッチしようとしない / 成功しない**。`touchSuccessRate` の式が `(hpRatio - 0.20) * canTouchHpWeight` で、低HPだと基礎値がマイナス→`canTouchMin=0.15`にクランプ→15%しかタッチが通らない。低HPほどタッチ成功率が上がるように**反転**する必要がある | 3 |
| E2 | Engine Logic | 最高 | **体力ほぼゼロでもフォールに入ろうとしない / 入っても決まらない**。中盤のピン試行率（`pinAttemptBaseRate`）と成功率（`pinAttemptSuccessBase`）が低すぎる。低HP時の大幅ボーナススケーリングが必要 | 4 |
| E3 | Engine Logic | 中 | カウンターヒット時の KO チェックは追加済み（確認は必要） | 5 |
| B1 | Balance | 中 | タッチ頻度は落ち着いた（平均4回/試合）が、E1/E2 直した後に再測定が必要 | 7 |
| B2 | Balance | 低 | friendlyFire の誤爆ダメージ（2-4＋MHP50%フロア）は妥当か、実機プレイでの体感が未検証 | 8 |

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

## 着手順（推奨）

次セッションは **この順番**で、1件ずつ完結させてコミット。まとめて直さない。

1. **V1** ステータスバー見えない問題（UI確認だけで直る可能性が高い）
2. **F1** タッチ独立フレーム化（エンジン改修の核心）
3. **E1** touchSuccessRate 反転（E1がないとF1直しても同じ失敗ループ）
4. **E2** 低HPピン成功率強化
5. **E3** カウンターKO動作確認のみ
6. **V2** 左ミラーリング実機確認
7. **B1** タッチ頻度再計測
8. **B2** friendlyFire 体感調整

**各項目終わったら auto-sim を回して違反ゼロを確認してからコミット。**

---

## 現在のファイル状態（ブランチ `claude/wonderful-heisenberg`）

### すでにコミット済み（直近）
- `3e3d9a0` — タッグマッチ包括修正（F1-F3/F5/E3を含む一括コミット。ただしV1/F1/E1/E2は未解決）

### 直近セッションで変更されたが未コミットの可能性があるファイル
- `src/ui-common.js` (`_tagFighter` 周辺)
- `src/index.html` (tag CSS ミラーリング)
- `src/match-engine.js`（`touchSuccessRate`, `pushFrame`, `wantTouch`）
- `src/data.js`（TAG_MATCH_CONFIG の数値）
- `src/tag-battle-main.js`（`applyFrame` のタッチpause）

→ **次セッション冒頭で必ず `git status` / `git diff` を取って現状を確認してから着手する**

---

## 絶対にやってはいけないこと

1. ❌ 4件を一括修正コミット（これまで失敗し続けた方法）
2. ❌ ユーザーに「全部直しました」と報告する前に auto-sim を回さない
3. ❌ CSS の一括リファクタ（V1 の原因特定前に周辺CSSを書き換えない）
4. ❌ data.js の TAG_MATCH_CONFIG を一度に複数値変更（1件ずつ変更して効果測定）

---

## ユーザーからの直近フィードバック（方針の原文）

> 一旦問題点を全部総合的に整理して、箇条書きにして次のセッションで直しましょう。ただ、もう種別ごとに一度に全部やろうとせず、1個1個分類して直さないといけない

> タッチはタッチで単独の、例えばターン10とターン11の間のターン10.5みたいなところでタッチが発生するようにしないと

> 体力がどんなに減ってもタッチしようとしない。本当にロジックどうなってんだよ

> しかも体力ゼロにほぼつけるのにフォールも入るんですよ

この4点（特に最後の3つ）が、次セッションで直す最優先ターゲット。
