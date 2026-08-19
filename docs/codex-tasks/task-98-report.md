# task-98 実施報告 — care-rework2 P0 丸め修正 + ケア計装(auto-sim --care) + G13是正

- **実施**: 2026-08-20(Opus5)
- **指示書**: `docs/codex-tasks/task-98-care-p0-growth-rounding-and-care-sim.md`
- **背景**: `docs/care-rework2-plan-v0.1.md` §1.2「丸めの死」/ §3 P0-3・P0-5
- **作業ブランチ**: `worktree-agent-a774bf56ba57f4709`(main の 8668296 から fast-forward 済み)
- **ステータス**: 実装3件完了・auto-sim ALL CLEAR・npm test 252/252 PASS。
  ただし **数値目標T3未達** と **plan §3 P0-3 の不変条件「合宿×1.5の実効は現状から悪化しない」抵触** の
  2点が Fable 判断待ち(§7 差し戻し事項)。

## コミット一覧

| # | commit | 内容 |
|---|---|---|
| 実装1 | `820e880` | 招聘・合宿の指導倍率を量子化前へ移設 — 丸めの死を解消 |
| 実装2 | `d81a593` | auto-sim にケア自動実行モード `--care` を追加 |
| 実装3 | `529c6e8` | 興行後処理(G13)の2重適用を是正 — processSettlement の1回に統一 |

---

## 1. 実装1: trainerMult を calcGrowth 内へ移設

### 変更内容

`Engine.growth.calcGrowth`(management.js:8431〜)内で `Engine.shachoshitsu.getTrainerMult(char)` を取得し、
`baseGain` の乗算列(`coachMul` と同列 = 量子化前)へ適用した。

```
baseGain = baseLearning × ratio × ageMul × coachMul × rookieMul × gritMul × trainerMult
```

呼び出し側3箇所からは `trainerMult` を除去(二重適用の禁止)。
`ceil`(最低1pt保証)・`penMult`/`statusMult` 等その他の倍率の位置は変更していない。

**`overrideCoachMul` でゲートしない**と判断した。理由: このバフは `G.coaches` ではなく fighter 自身
(`_inviteBuff`/`_trainerBuff`)に乗っており、AI団体(`assignAISeasonTrainers` 由来の `_inviteBuff`)にも
同じく効くべきもの。移設前の呼び出し側3箇所も無条件に適用していたため、これが 1:1 の対応となる。
なお production で `overrideCoachMul` を渡す呼び出し元は**存在しない**(テストのみ)。

### `getTrainerMult` 呼び出し元 全数リスト

grep `getTrainerMult` の結果(src/ 全体)。**想定外の呼び出し元はなかった**。

| 場所 | 移設前 | 移設後 |
|---|---|---|
| `src/management.js:10444` | AI団体週次練習の乗算列 | **除去**(calcGrowth 内へ) |
| `src/management.js:12594` | 自団体 intensive(追い込み)の乗算列 | **除去**(同上) |
| `src/management.js:12674` | 自団体 practice(通常練習)の乗算列 | **除去**(同上) |
| `src/management.js:23765` | 定義本体 | 変更なし(rng非消費の純粋参照) |
| — | — | `src/management.js:8476`(calcGrowth 内)を**新設** |

`calcGrowth` の production 呼び出し元も同じ3箇所(10442 / 12586 / 12666)だけで、
**全てが移設前に trainerMult を適用していた**。孤立した呼び出し元はないため、
「calcGrowth 内へ移す」= 完全な 1:1 の置き換えになっている。

---

## 2. 数値目標 T1〜T3 の計測

条件: 22歳・cap=96・特性なし・コーチ無し(coachMul=1.0)・morale=60・通常練習4週・**2000試行**。
BEFORE = `WM_SOURCE_REF=8668296` かつ**呼び出し側で trainerMult を量子化後に掛ける**(=修正前の実装を忠実に再現)。

### T1/T2: current/cap = 0.70

| trainerMult | BEFORE(修正前) | AFTER(修正後) | 差 |
|---|---|---|---|
| 1.00 | 4.000 | 4.000 | ±0 |
| 1.25 | 4.000 | **4.296** | +0.296 |
| 1.30 | 4.000 | **4.465** | +0.465 |
| 1.35 | 4.000 | **4.625** | +0.625 |
| 1.53 | **8.000** | **5.184** | **-2.816** |

- **T1(1.00<1.25<1.30<1.35<1.53 が単調増加)**: ✅ **PASS**。
  AFTER は 4.000 < 4.296 < 4.465 < 4.625 < 5.184 で厳密に単調。
  BEFORE は 1.25/1.30/1.35 が**全て 4.000 で区別不能**、1.53 だけ 8.000 に跳ねる階段だった。
- **T2(1.25と1.53の差が4週合計で +0.3pt以上)**: ✅ **PASS**。5.184 - 4.296 = **+0.888pt**。

### T3: current/cap = 0.85(死に帯)

| trainerMult | BEFORE | AFTER |
|---|---|---|
| 1.00 | 4.000 | 4.000 |
| 1.25 | 4.000 | 4.000 |
| 1.35 | 4.000 | **4.000** |
| 1.53 | 8.000 | 4.000 |

- **T3(0.85でも 1.35 の期待成長 > 1.00)**: ❌ **未達**(差が 0)。→ §7-A で詳述。

### ratio 掃引(4週期待成長・2000試行)

| ratio | BEFORE 1.00 / 1.25 / 1.35 / 1.53 | AFTER 1.00 / 1.25 / 1.35 / 1.53 |
|---|---|---|
| 0.30 | 8.896 / 12.172 / 12.172 / 13.643 | 8.896 / 10.523 / 11.158 / 12.219 |
| 0.50 | 6.293 / 8.385 / 8.385 / 10.114 | 6.293 / 7.262 / 7.763 / 8.620 |
| 0.60 | 4.968 / 5.780 / 5.780 / 8.688 | 4.968 / 5.930 / 6.202 / 6.633 |
| 0.70 | 4.000 / 4.000 / 4.000 / 8.000 | 4.000 / 4.296 / 4.625 / 5.184 |
| 0.75 | 4.000 / 4.000 / 4.000 / 8.000 | 4.000 / 4.000 / 4.000 / 4.139 |
| 0.80 | 4.000 / 4.000 / 4.000 / 8.000 | 4.000 / 4.000 / 4.000 / 4.000 |
| 0.85 | 4.000 / 4.000 / 4.000 / 8.000 | 4.000 / 4.000 / 4.000 / 4.000 |
| 0.90 | 3.998 / 3.998 / 3.998 / 6.780 | 3.998 / 4.000 / 4.000 / 4.000 |

### ⚠ 調査で判明した重要事実 — 旧実装は「0倍」だけでなく「2倍」も作っていた

plan §1.2 は「倍率1.45未満は成長に1ptも寄与しない」とだけ記していたが、**1.45以上では逆に
2倍化していた**。旧呼び出し側は `Math.round(growth × trainerMult × 10) / 10` → `Math.round(...)` の
二段丸めで、`growth=1`(ceil下限)のとき:

| trainerMult | `round(1×mult×10)/10` | 最終 `Math.round` | 実効 |
|---|---|---|---|
| 1.25 | 1.3 | 1 | ×1.0(寄与0) |
| 1.35 | 1.4 | 1 | ×1.0(寄与0) |
| **1.45** | **1.5** | **2** | **×2.0** |
| **1.53** | **1.5** | **2** | **×2.0** |
| **1.50(合宿)** | **1.5** | **2** | **×2.0** |

`Math.round(1.5) = 2`(JSは half-up)がこの崖の正体。つまり旧実装は
**C/B級=完全に無効、A級・合宿=公称1.5倍が実効2.0倍**という two-step 関数だった。
修正はこの崖を均して比例に戻すので、**1.45以上の倍率は実効が下がる**。これは意図した是正だが、
plan の不変条件と衝突する(§7-B)。

---

## 3. 不変条件 I1〜I5 の検証結果

### I1: trainerMult=1.0 のとき現行実装とビット一致 — ✅ PASS

3通りで確認した。

**I1-a(直接証明・最も厳密)**: バフを持たない選手で `calcGrowth` の戻り値を全網羅ダンプし、
BEFORE(8668296)/AFTER で `diff`。
- 網羅範囲: 年齢5 × ratio6 × 特性6組 × morale4 × overrideCoachMul3 × intensive2 = **4,320ケース**、
  各6週連続 = **25,920回の calcGrowth 呼び出し**
- 結果: **diff 完全一致(0行差分)**。乱数消費の順序・回数とも不変。

**I1-b(全シミュレーション・統制条件)**: `getTrainerMult` を恒等的に 1.0 へ潰した状態で
`node test/auto-sim.js 20 42` を BEFORE/AFTER 双方で実行。
- 週次の全ロスター(自団体+AI4団体)の pw/te/sp/st/mn + condition/popularity/trust/wear を
  1e6倍整数化した SHA1 ダイジェストを毎週記録(**1,060週**) + 最終スナップショット全行
- 結果: **1,060週分のダイジェスト + 最終スナップショットが完全一致**。
  `Semantic fingerprint` も **ec4f54cb == ec4f54cb**

**I1-c(統制なし・参考)**: 同じ 20季42シードを素で BEFORE/AFTER 比較 → `8ab84fe7` → `8f81868c` で相違。
- **初回相違は S2W2**。S1W1〜S2W1(53週)は完全一致
- 原因は `Engine.rival.assignAISeasonTrainers`(management.js:9780)。AI団体もシーズン開幕に
  `_inviteBuff` を持ち、これも同じく丸めで死んでいた。**AI側の招聘が効くようになったのが唯一の差分源**
  (指示書 実装1-3「AIの `_inviteBuff` が現行どおり効くこと」の要求どおり)
- 20季後のロスター構成自体が分岐する(ドラフト/引退/移籍がずれる)ため、平均ステ差(-1.00)は
  母集団の違いによるノイズであってインフレ指標ではない。インフレ判定は I2 の統制計測を正とする

### I2: インフレ上限(mult 1.53・4週で従来比 +4pt/選手以内) — ✅ PASS

| 経路 | BEFORE | AFTER | 増分 |
|---|---|---|---|
| 招聘 mult 1.53・4週(ratio0.70) | 8.000 | 5.184 | **-2.816** |
| 合宿 ×1.5・2週(ratio0.70, `_trainerBuff`経路) | 4.000 | 2.697 | **-1.303** |

いずれも**増分は負**(=インフレしていない)。上限 +4pt には大きく余裕あり。
ただし「悪化しない」側の不変条件には抵触する(§7-B)。

### I3: 開眼中 / 怪我ペナルティ / スランプの各経路で破綻しない — ✅ PASS

ratio0.70・4週・2000試行。

| 経路 | BEFORE 1.00/1.35/1.53 | AFTER 1.00/1.35/1.53 | 判定 |
|---|---|---|---|
| 通常 | 4.000 / 4.000 / 8.000 | 4.000 / 4.625 / 5.184 | 単調化 ✅ |
| 開眼中(brakeGamma=1.0) | 5.002 / 5.831 / 8.706 | 5.002 / 6.224 / 6.663 | 単調・破綻なし ✅ |
| 怪我 growthPenalty×0.4 | 0.000 / 4.000 / 4.000 | 0.000 / 0.992 / 1.543 | 破綻なし ✅ |
| **スランプ中(statusMult=0)** | 0.000 / 0.000 / 0.000 | **0.000 / 0.000 / 0.000** | **依然0 ✅** |

- スランプ0倍は `statusMult` が呼び出し側に残っているため厳密に維持されている(最重要要件)
- 怪我経路は BEFORE が異常だった(penMult 0.4 を掛けても `round(0.4×1.35×10)/10=0.5` →
  `Math.round(0.5)=1` で毎週1pt = 4.000 に戻ってしまっていた)。AFTER は 0.992/1.543 と
  ペナルティが実際に効く。改善であって破綻ではない

### I4: `--care` なしの従来出力が実装2で不変 — ✅ PASS

`node test/auto-sim.js 20 42`(careなし)の `Semantic fingerprint`:

| 時点 | fingerprint |
|---|---|
| 実装1適用後・実装2適用前 | `8f81868c` |
| **実装2適用後** | **`8f81868c`** |

一致。フラグを位置引数から分離したが、既存呼び出し(数値2つのみ)では `positional === args` と
なるため従来動作は完全に不変。`careSample()` は読み取り専用で state に触れない。
(実装3=G13 は当然 fingerprint を変える。I4 は「実装3の影響を除き」の条件付きなので、
実装2単独で切り分けて検証した。)

### I5: 実プレイ経路の適用回数が1回のまま — ✅ PASS

- `src/app.js` に **`Engine.executeShow(` の呼び出しは 0 件**(grep で確認。ヒットするのは
  「mirrors Engine.executeShow logic」等のコメントと、`App.executeShow()` という別メソッド名のみ)
- 実プレイは `App.executeShow()` → 自前の finalize 経路 → `tickWeek` → `processSettlement`
  (management.js:13275)で `applyShowTrust` + `updateLockerRoomMorale` を**1回だけ**適用
- 今回の変更は `Engine.executeShow` 内(management.js:15033付近)の削除のみで、
  `processSettlement` 側には一切触れていない。**実プレイの適用回数は 1 → 1 で増減なし**
- `npm test` 252/252 PASS(変更前ベースラインと同数)

---

## 4. 実装2: auto-sim `--care` モード

`node test/auto-sim.js <seasons> <seed> --care` で、自動プレイヤーが毎週 manage フェーズ・興行前に
指示書の優先順(bonus → party → refresh_leave → special_treatment → media → trainer → camp)で
決裁枠⚡と資金の許す限り決裁する。

- 対象選手は決定的規則: bonus=trust最小 / refresh_leave=体調最小 / special_treatment=離脱最長 /
  media=人気最大 / trainer=伸びしろ(trainCap残)最大 × 今期市場内で mult 最大のコーチ。
  同順位は id 昇順で割る。**Math.random は不使用**、`Engine.rng` のみ
- state 反映は `app.js App.executeDecision` と同じ順序・同じフィールド
- サマリーに ケア総支出 / ⚡消費 / 書類別実行回数 / 平均trust / 平均lockerRoomMorale を追加
  (trust・morale はケアなしでも採取し、両モードを直接比較できるようにした)

### ケアあり/なし比較(40季・シード42・両方 ALL CLEAR)

| 指標 | ケアなし | ケアあり(`--care`) | 差 |
|---|---|---|---|
| 平均trust(自団体・週次平均) | 75.57 | **86.80** | **+11.23** |
| 平均lockerRoomMorale(週次平均) | 38.26 | **61.19** | **+22.93** |
| 平均OVR(自団体・週次平均) | 71.68 | **72.15** | **+0.47** |
| ケア総支出 | — | 115,105万(2,878万/季) | — |
| ⚡消費 | — | 966(24.1/季) | — |
| Semantic fingerprint | `31dc68a6` | `4e5b4293` | — |

方向は3指標とも「ケアありが上」で指示書どおり。

**書類別 実行回数(40季)**

| 書類 | 回数 | /季 |
|---|---|---|
| ボーナス支給願 | 48 | 1.20 |
| 慰労会開催届 | 234 | 5.85 |
| 休暇辞令 | 153 | 3.83 |
| 特別治療指示書 | 80 | 2.00 |
| メディア露出手配書 | 218 | 5.45 |
| 外部コーチ招聘状 | 6 | 0.15 |
| 合宿実施手配書 | 1 | 0.03 |

**注記(P2への申し送り)**: 指示書指定の優先順を厳格に守ると、⚡経済(+2/4週・上限6 ≒ 24/季)を
上位5書類がほぼ使い切り、**育成2書類(招聘0.15/季・合宿0.03/季)がほぼ発火しない**。
今回丸めを直したのはまさにこの2書類なので、OVR差が +0.47 と小さいのはこれが主因。
「⚡が真の通貨」(plan §1.1)が計装でも再現された形。優先順の見直し、または⚡コスト再配分
(plan P1)の判断材料になる。

なお `--care` は plan §1.1 の3シード計測(平均trust 76.5→84.7 / 士気 45.5→59.6)と
同じ方向・近い水準を再現しており、計装として妥当と判断した。

---

## 5. 実装3: G13 興行後処理の2重適用是正

### 変更内容

`Engine.executeShow`(management.js:15033付近)の
`applyShowTrust` + `updateLockerRoomMorale` の適用を**除去**し、
`processSettlement`(management.js:13275)の1回に統一した。

`Engine.executeShow` は結果を `s.lastShowResults` に載せて返す(management.js:14914)。
呼び出し元が `tickWeek` を通すと `processSettlement` が**同じ `lastShowResults`** に
同じ2関数を適用するため、同じ興行に2回効いていた。

### `Engine.executeShow` 呼び出し元 全数リスト

`Engine.executeShow(` の全ヒット(src/ + test/)。

**A. ゲーム経路**

| 場所 | tickWeek経由 | 2重適用 | 扱い |
|---|---|---|---|
| `src/app.js` | — | — | **呼び出し 0 件**。自前 finalize 経路で元から1回(I5) |
| `src/dev-tools.js:293` | ✅(直後に `Engine.tickWeek(next)`) | あり | **是正対象** |

**B. シミュレーション/計測ハーネス(tickWeek 経由 = 2重適用されていた)**

`test/auto-sim.js:1586`(**是正対象**) / `test/track-org-rosters.js:546` /
`test/title-diagnostic.js:151` / `test/roster-depth-analysis.js:369` /
`test/relationship-distribution-analysis.js:583` / `test/pool-stats.js:130` /
`test/mq-record-trajectory.js:556` / `test/mq-crowd-measure.js:553` / `test/mq-analysis.js:151` /
`test/make-save.js:210` / `test/growth-v2-verification.js:378` / `test/growth-baseline-measure.js:687` /
`test/growth-analysis.js:220` / `test/faction-sim.js:97` / `test/extraction-rate-verify.js:288,526` /
`test/extraction-rate-phase2.js:440` / `test/economy-check.js:200` / `test/diag-draft.js:315` /
`test/diag-fa.js:254` / `test/decay-longevity-test.js:201` / `test/test-vacant-title.js:112,140` /
`test/ui-walkthrough/fixtures/headless-sim.js:290`

**C. tickWeek を通さない呼び出し元(単体・計測テストのみ。ゲーム経路なし)**

`test/unified-title-test.js:283` / `test/special-event-week-block-test.js:47` /
`test/progression-repair-test.js:73` / `test/career-record-integrity-test.js:146,163,177` /
`test/mq-p3c-unit.js:201,211` / `test/mq-ceiling-worstcase.js:296` /
`test/mq-finalize-parity-test.js`(`path: 'Engine.executeShow'` のラベル参照) /
`test/show-preview-tag-skip-test.js`(app.js のソース文字列を抽出する静的テスト)

### 判断: オプトアウト引数ではなく「除去」を採用

指示書の条件分岐に従い、**全てのゲーム経路(A)が `processSettlement` を通ることを確認**した上で
除去を選んだ。C群は trust/morale を検証しない計測・単体テストであり、
`npm test` **252/252 PASS**(変更前ベースラインと同数)で 2重適用に依存したテストが
存在しないことを実証した。したがってオプトアウト引数は不要と判断。

### 効果

`--care` なし 40季42シードの平均 lockerRoomMorale は **38.26**。
plan §1.1 が auto-sim で観測していた 45.5 より低く、G13 の予測
(「実機の士気は45.5よりさらに低い可能性」)が裏付けられた。

---

## 6. 検証手順の実行結果

| # | 手順 | 結果 |
|---|---|---|
| 1 | `node --check src/management.js test/auto-sim.js` | ✅ OK |
| 2 | I1 確認(修正前後の同一シード比較) | ✅ §3 I1 のとおり(直接証明 + 全シミュレーション統制条件の2通りで一致) |
| 3 | 数値目標 T1〜T3 の計測 | ✅ T1/T2 PASS、❌ T3 未達(§7-A) |
| 4 | `node test/auto-sim.js 40 42` | ✅ **ALL CLEAR**(violations 0 / errors 0 / freq warnings 0 / 2120週 / game over 0) |
| 5 | `node test/auto-sim.js 40 42 --care` | ✅ **ALL CLEAR**(同上)+ §4 の比較表 |
| 追加 | `node test/run-all.js`(npm test) | ✅ **252/252 PASS**(変更前ベースラインと同数) |

計測用の使い捨てスクリプトはコミットしていない(作業ツリーから削除済み)。

---

## 7. 差し戻し事項(Fable 判断待ち)

### A. 数値目標 T3 が未達 — `ceil` の1pt下限が「第2の量子化器」

**事実**: current/cap=0.85 では trainerMult 1.00 と 1.35 の4週期待成長がどちらも 4.000 で差が 0。
ratio 0.78 付近から上は全倍率が 4.000 に潰れる(§2 掃引表)。

**原因**: `calcGrowth` 末尾の `Math.min(Math.ceil(finalGain), trainCap - current)`。
ratio=0.85 では `finalGain` は最大でも約 0.56(baseGain 0.246 × variance上限1.5 × mult1.53)しかなく、
**`ceil` が常に 1 を返す**。倍率を量子化の前に持ってきても、`ceil` の 1pt 下限が後段にある限り
この帯では倍率が結果に現れない。指示書の実装1は
「`ceil`(最低1pt保証)…の位置は変えない」「方式の変更禁止」と明記しているため、
**T3 を満たすには指示書の範囲外の変更が必要**と判断し、独断では行わなかった。

**T3 を満たす選択肢**(いずれも設計判断が要るため Fable へ差し戻し):
1. **端数持ち越し**(plan §3 P0-3 が「+端数持ち越し等の最小手当て」として言及済み)。
   週ごとの `finalGain` 小数部を選手に蓄積し、1.0 を超えたら +1pt する。
   `ceil` の1pt下限と両立し、死に帯でも倍率が期待値に効く。**推奨**
2. `ceil` を `round`+下限0 に変える。死に帯の「毎週必ず1pt」という現行の底上げが消えるため
   成長総量が大きく下がる(0.70〜0.90帯の 4.000 が丸ごと落ちる)。影響大
3. T3 を「達成不能な目標」として取り下げ、死に帯の存在を仕様として受け入れる

### B. plan §3 P0-3 の不変条件「合宿×1.5の実効は現状から悪化しない」に抵触

**事実**: 合宿(`_trainerBuff` ×1.5・2週・ratio0.70)の期待成長が **4.000 → 2.697(-33%)**。
招聘 A級 1.53 も 8.000 → 5.184(-35%)。ratio 0.30 でも 13.643 → 12.219 と全帯で低下する。

**原因**: §2 の「⚠ 重要事実」のとおり、旧実装は `Math.round(1.5) = 2` により
**mult 1.45以上を実効2.0倍に化けさせていた**。修正はこの偶発的な崖を均すため、
公称1.5倍の合宿は「実効2.0倍」から「実効1.5倍」へ**正される**。
数値としては悪化だが、**公称値どおりになった**とも言える。

**論点**: plan の不変条件は「合宿の実効を落とすな」だが、その「現状」は
バグ由来の2倍化だった。以下のどちらを正とするか Fable の裁定が要る:
1. **公称値を正とする**(現状の実装のまま)。単調性は回復し、C/B/A級と合宿が
   設計どおりの序列になる。ただし育成書類の絶対量は下がるので、
   plan P2「書類の役割再定義」で `growthBoost.mult` を上げて補正する
2. **実効値を維持する**(`GROWTH_CONFIG`/`DECISION_DOCS` 側の mult を引き上げて 2.0 相当に戻す)。
   ただし `data.js` は指示書で「触ってはいけないファイル」に指定されているため今回は対象外

**現状の実装は 1(公称値を正)**。§7-A の端数持ち越しを入れると死に帯が埋まって
実効が持ち上がるため、A と B は**セットで判断するのが望ましい**。

### C. `--care` で育成2書類がほぼ発火しない(P2申し送り)

§4 の注記のとおり、指示書指定の優先順では ⚡ を上位5書類が使い切り、
招聘 0.15/季・合宿 0.03/季 しか回らない。丸め修正の効果を計装で観測しづらい。
優先順の見直し(育成書類を上位へ)か ⚡コスト再配分(plan P1)の判断材料として申し送る。

---

## 8. 実機確認をお願いしたい点

1. **社長室 → 外部コーチ招聘状**: C級/B級/A級のコーチを同条件の選手に招聘し、
   4週後の伸びが格の順に違って見えるか(旧実装では C/B が完全に0pt だった)
2. **社長室 → 合宿実施手配書**: 2週間の全体成長が以前より控えめに見えるはず(§7-B)。
   「合宿の手応えが落ちた」と感じるかどうかがそのまま §7-B の判断材料になる
3. **道場の雰囲気テキスト**: G13是正で士気の実効レンジが下がっている可能性がある
   (auto-sim 40季平均 38.26)。plan P1 の閾値較正(G12)の前提値として要確認
