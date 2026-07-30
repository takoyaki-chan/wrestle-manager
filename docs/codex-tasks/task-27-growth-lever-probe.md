# Codexタスク27: 成長リバランス3レバーの計測プローブとグリッド計測

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**作業場所(準備済み)**: `C:\Users\nkmrk\Downloads\wm-task27`
(ブランチ `codex/growth-lever-probe` をチェックアウト済みの git worktree)

このフォルダでそのまま作業する。**新たにブランチ・worktree を作らない。
`main` に直接コミットしない。** 着手前に確認:

```bash
git status                 # clean であること
git branch --show-current  # codex/growth-lever-probe であること
```

**変更してよいファイル**:
- `src/data.js` — `GROWTH_CONFIG` への**既定値パラメータ追加のみ**
- `src/management.js` — 下記3箇所の**ゲート付きロジックのみ**
- `test/growth-intensive-projection.js` — レジーム追加・設定注入
- `test/` 配下の新規計測スクリプト(必要なら)
- `docs/growth-lever-probe-report-v0.1.md`(新規・計測レポート)
- `docs/worklog.md` 先頭への完了ログ

**変更禁止**: 上記以外すべて。`specs/` 禁止。UI(`ui-*.js`/`index.html`)には一切触れない。
**コミットは自分で行わずローカル変更のまま残してよい**(前回タスクでgit書込権限が
サンドボックスで拒否された。コミットはレビュー後にこちらで行う)。**push・配布は禁止。**

---

## 目的

成長リバランス(2026-07-30 Keisuke裁定)の採用値を決めるための**計測**。
3つのレバーを「デフォルトでは挙動が完全に現行同一」のパラメータとして仕込み、
テスト側から差し替えてグリッド計測する。**本番バランスの変更はこのタスクではしない。**

前提資料(必読): `docs/growth-rebalance-baseline-measurement-v0.1.md`
(特に §7 追い込みレジーム実測と §8 レバー分析。計測の書式もこれに合わせる)

---

## A. プローブ実装(デフォルト不変)

`GROWTH_CONFIG`(src/data.js:7600付近)に以下を追加。**既定値では現行と数学的に同一**:

```js
brakeGamma: 1.0,           // 収束ブレーキ指数。1.0 = 現行(線形)と同一
intensiveHeatTable: null,  // 追い込み熱量逓減テーブル。null = 現行(×intensiveMult固定)
aiMatchWearCoef: 0,        // AI活動wear係数(試合数×これ)。0 = 現行と同一
```

### A-1. 収束ブレーキ指数化(`Engine.growth.calcGrowth`、management.js:7212付近)

現行: `const ratio = remaining / trainCap;`
変更: `brakeGamma !== 1.0` のときのみ `Math.pow(remaining / trainCap, GROWTH_CONFIG.brakeGamma)`。
1.0 のときは **pow を呼ばず現行の式をそのまま通す**(浮動小数の完全一致を保証)。

### A-2. 追い込み熱量逓減(週次の練習処理)

`char.intensive` が消費され `seasonIntensiveWeeks` が積まれる週次処理
(management.js:11030付近)を起点に、選手ごとの内部値 `_heat` を維持する:

- その週が追い込み: `_heat = min(_heat + 1, テーブル長 - 1)`
- 通常練習: `_heat = max(0, _heat - 1)`
- 休養: `_heat = max(0, _heat - 2)`

`intensiveHeatTable` が非null のとき、calcGrowth の `intensiveMul`(7250付近)を
`GROWTH_CONFIG.intensiveMult` 固定から `intensiveHeatTable[_heat]` に差し替える
(**その週の追い込み実行前の `_heat` を参照** = 1週目はテーブル先頭の満額)。
テーブルが null のときは `_heat` の更新も参照も一切行わない(フィールド自体を生やさない)。
負傷リスク・wear計上(seasonIntensiveWeeks)は従来どおり満額でカウントする
(効果だけ逓減し、代償は変わらない設計)。

計測に使うテーブル2案:
- **A(急)**: `[1.8, 1.5, 1.25, 1.0]`
- **B(緩)**: `[1.8, 1.6, 1.4, 1.2, 1.0]`

### A-3. AI活動wear(management.js:9593-9596)

AIの季末wear蓄積 `aiBaseWear - aiEffDura` に、`aiMatchWearCoef > 0` のときのみ
`Math.round((f.wins + f.losses + f.draws) * GROWTH_CONFIG.aiMatchWearCoef)` を加算する。
(この時点の勝敗数は当季の値。直後の Step でリセットされることを確認済み)

---

## B. 不変条件(このタスクの合否)

1. **既定値では挙動が完全に現行同一。** 証明: `node test/auto-sim.js 40 7919` の
   `Semantic fingerprint` が、プローブ実装前(HEAD)と実装後で**完全一致**すること。
   一致しなければゲートが漏れている。レポートに両方の値を記載
2. `npm test` 全PASS(2026-07-30時点 138/138)
3. `_heat` はテーブル null のときフィールドごと存在しない(セーブ形式を汚さない)
4. スクリプトからの `GROWTH_CONFIG.xxx = 値` の差し替えで各レバーが独立に効く

---

## C. グリッド計測

### C-1. 成長側(projection スクリプト・安価なので全組合せ)

`test/growth-intensive-projection.js` を拡張:
- レジーム追加: 既存 (N)通常 / (I)毎週追い込み に加え **(I2) 2週追い込み→2週通常** を追加
- CLI か環境変数で `brakeGamma` / `intensiveHeatTable(off|A|B)` を注入できるようにする

グリッド: γ ∈ {1.0, 1.3, 1.6, 2.0} × heat ∈ {off, A, B} × レジーム ∈ {N, I, I2} を全部回し、
組合せごとに baseline 資料 §7 と同じ指標を出す:
- 最終(27歳) 4stat比 中央値 / 4stat 98%以上到達率
- 最終OVR≥100(全体 / エース帯)
- 3年目終了時 trainCap比 / 3年目90%到達率
- **(I) と (I2) の年間成長比較**(「毎週連打が間欠運用を上回らない」の検証に使う)

### C-2. auto-sim 側(40年・本数を絞る)

計測ポリシー(CLAUDE.md)厳守: **グリッドは40年、以下の6本まで。それ以上回さない。**

1. 全off(= fingerprint 一致確認と兼用)
2. `aiMatchWearCoef = 0.05`
3. `aiMatchWearCoef = 0.08`
4. γ=1.6 単独
5. γ=1.6 + heat A
6. γ=2.0 + heat A

各本で報告: AI団体トップ8の平均OVR(終盤5季平均) / AI引退年齢の分布(中央値・p10) /
wear分布の概況 / `Total violations` / `Result:` 行。
※ auto-sim に該当の集計が無い場合は、計測用の一時フックを test 側スクリプトとして
足してよい(src への計測コード追加はしない)。

### C-3. レポート

`docs/growth-lever-probe-report-v0.1.md` に、baseline 資料と同じ「事実の提示のみ」体裁で
全組合せの表を書く。**採用値の提案・推奨は書かない**(採用判断はこちらで行う)。

---

## 完了報告に書いてほしいこと

1. 不変条件 B-1〜B-4 の確認結果(B-1 は fingerprint を前後並べる)
2. `_heat` 更新を組み込んだ週次処理の正確な位置(関数名・行番号)と、
   追い込み以外の練習モード(通常/休養)の判別をどう取ったか
3. グリッド表(C-1 全組合せ・C-2 6本)
4. 判断に迷って別の解釈を採った箇所

---

## 参考資料

- `docs/growth-rebalance-baseline-measurement-v0.1.md` — 計測の前提と書式(§6 の
  「メモリ上差し替え・src未変更」方式の先例が WM_AGECURVE)
- `src/management.js:7201` — calcGrowth(ブレーキは 7212-7213 の ratio、追い込みは 7250)
- `src/management.js:11030` 付近 — seasonIntensiveWeeks の週次積算
- `src/management.js:9586-9600` — AI団体の季末 wear/decay
- `src/data.js:7600` 付近 — GROWTH_CONFIG
- `test/growth-intensive-projection.js` / `test/growth-baseline-measure.js` — 既存計測
