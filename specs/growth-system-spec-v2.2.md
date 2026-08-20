# 📈 成長システム設計書 v2.2

> **ステータス**: 🟢 確定（AI成長パリティ実装済み）
> **作成日**: 2026-03-10（v2.2更新: 2026-08-02）
> **依存**: character-data-spec-v1.7.md / weekly-gameloop-spec-v1_0.md / rival-org-spec-v1.0.md
> **実装箇所**: management.js (`Engine.growth` / `Engine.rival.processAIWeek` / `Engine.rival.processSeasonEnd`), data.js (`GROWTH_CONFIG` / `AI_COACH_CONFIG`)
> **前版**: v2.1。v2.1の全内容を本書へ統合し、AI入力の非対称に関する裁定を本書で上書きする。

---

## 改訂履歴

| 版 | 日付 | 変更 |
|---|---|---|
| v2.0 | 2026-04-06 | trainCap距離ベース成長、年齢、追い込みの再同期 |
| v2.1 | 2026-07-31 | 指数収束ブレーキ、追い込み熱量逓減、AI活動wearを追加 |
| v2.2 | 2026-08-02 | AI成長パリティ。興行週練習、体調安全弁、熱量、追い込み代償、限定トレーナー、AI追い込み率をプレイヤーのbalance基準へ統合。`aiMatchWearCoef` / AI設定の死に倍率を廃止 |
| v2.2.1 | 2026-08-20 | **現物合わせの遡及追記**（実装は2026-08-05 `13aa69e`、当時未記帳だったものをD-3調査で発見・記帳）: ①`遅咲き`特性を廃止（成熟度テーブルは`早熟`/`晩成`のみ） ②入団成熟度を引き上げ（`getEntryMaturityRatio`: 17歳0.75〜23歳+1.00、晩成は0.68〜） ③季末wearの試合量項を「キャリア平均試合数≥40で+3」から**当季試合数連動**（≤10: −1 / 19〜24: +2 / ≥25: +4）へ変更 |
| v2.2.2 | 2026-08-20 | **招聘/合宿倍率の適用位置を量子化前へ移設**（care-rework2 P0-3・task-98）: 従来は `calcGrowth` 末尾の `ceil` の後（呼び出し側の `round` 連鎖）に掛かり、倍率1.45未満は成長0pt・1.45以上は実効2.0倍という二重の崖を作っていた。`getTrainerMult` を `baseGain` の乗算列（coachMulと同列）へ移設し、格・スタイル一致・相性が期待成長で単調に効く。招聘・合宿なしの成長はビット一致で不変 |
| v2.2.3 | 2026-08-20 | **成長量子化を端数持ち越しへ是正**（numeric-overhaul P3b・task-98裁定Bの引き取り）: `calcGrowth` の `Math.ceil` 1pt下限（rawGain 0.4でも+1ptの隠しインフレ。cap近傍0.85帯で倍率差を潰す第2の量子化器）を廃止し、0.1刻みの小数を返す。整数化は呼び出し側3箇所（AI週処理/追い込み/通常練習）が `settleGrowthFraction` で行い、端数は `_growthFrac` に持ち越す（積み重ねは必ず実る）。ceilは実質「壁際限定の成長フロア」でγ1.3はフロア込みの較正だったため、補償は2軸再フィット: **baseLearning 3.0→4.5 / brakeGamma 1.3→1.1**。アンカー維持を3シード×127名projection+25季フルシミュで確認（追い込み連打カンスト率 35.7→36.7% / キャリア成長総量 -0.4〜+2.7% / AI-SトップOVR帯 -2.9%）。不変条件は `test/growth-frac-carry-test.js`（T1単調性/T3 cap近傍0.85帯/保存則/セーブ互換） |

---

## 設計原則

1. **trainCap距離ベース** — 上限までの距離が練習成長を決め、上限へ近いほど指数ブレーキで重くなる
2. **年齢は残酷** — 年齢カーブとwear由来の衰退は、プレイヤー・AIで共通である
3. **差がつくのは采配** — AIは毎週 `balance` を選ぶ社長として振る舞う。プレイヤーは追い込み時機、招聘、ケア、マッチメイクで上振れを狙える
4. **能動カンストを抑える** — 放置層を一律に底上げせず、上限接近と追い込み連用の上振れを抑える
5. **実効値だけを設定する** — 成長倍率は実在コーチの `gMult` / 能力から得る。未参照の設定値を残さない

---

## §1 核心式（練習成長）

`GROWTH_CONFIG.brakeGamma = 1.1` / `baseLearning = 4.5`（v2.2.3で 1.3 / 3.0 から再較正）。`remaining = trainCap - current`、`current < trainCap` のとき:

```
ratio        = (remaining / trainCap) ^ 1.1
baseGain     = 4.5 × ratio × ageMul × coachMul × rookieMul × gritMul × trainerMult
rawGain      = baseGain × traitBonus × weeklyVariance
intensiveMul = intensiveHeatTable[_heat]（追い込み時のみ）
calcGrowth   = min(round(rawGain × intensiveMul × 10) / 10, remaining)   ※0.1刻みの小数のまま返す
```

**適用（v2.2.3・端数持ち越し）**: 呼び出し側3箇所（AI週処理 / 追い込み / 通常練習）が状態・孤立・関係性・警告trust等の事後倍率を掛けたあと、`settleGrowthFraction(_growthFrac, 週次成長, capRemaining)` で「今週適用する整数pt」と「持ち越す端数」に分解する。ステ本体は常に整数を維持し、端数は選手の `_growthFrac`（0 ≤ frac < 1、旧セーブの未定義は0扱い、cap衝突時は超過端数を破棄）へ蓄積して、貯まった週に+1ptとして実る。`validateGameState` がNaN・範囲外を検出し0へ自動修正する。

`coachMul` は AI_COACH_CONFIG の固定値ではなく、プレイヤー・AIとも `Engine.coach.getCharGrowthMult` が実コーチから算出する。**招聘/合宿の倍率（`getTrainerMult`）は v2.2.2 から `baseGain` の乗算列（量子化前）に入る**。

## §2 年齢倍率（ageMul）

| 年齢 | 特性なしの実装値 |
|------|-------:|
| 17歳以下 | 0.70 |
| 18歳 | 1.00 |
| 19–20歳 | 1.15 |
| 21–22歳 | 1.00 |
| 23–24歳 | 0.50 |
| 25–26歳 | 0.10 |
| 27歳以上 | 0.00 |

`早熟`、`晩成` は専用テーブルで上書きする（`遅咲き` 特性は 2026-08-05 `13aa69e` で廃止 — v2.2.1追記）。年齢カーブの変更は別途再計測が必要であり、本版では変更しない。

## §3 コーチと特性

| 要素 | 効果 |
|------|------|
| specialist一致 / allround | ×1.08 / ×1.05 |
| 限界突破 | trainCap +4/stat |
| 弱点克服 | 最弱stat trainCap +5 |
| 才能開花 | 衰退期ageMul下限 0.90 |
| 新人育成 / 根性練習 | OVR≤50で×1.5 / ×1.05 |
| 延命術 | 季末wear ×0.50 |

## §4 特性ボーナス

| 特性 | 条件 | 倍率 |
|------|------|------|
| 負けず嫌い | 直前試合で敗北 | ×1.10 |
| 反骨心 | trust ≤ 30 | ×1.15 |

## §5 週次ランダム揺れ

| 特性 | 範囲 |
|------|------|
| 努力家 | 0.75–1.5 |
| 破天荒 | 0.0–2.5 |
| 通常 | 0.5–1.5 |

---

## §6 追い込み・休養の共通ルール

| 項目 | 値 |
|------|------|
| 熱量テーブル | `[1.8, 1.6, 1.4, 1.2, 1.0]` |
| 怪我確率 | 3% |
| 最大連続週 | 2週 |
| 追い込み可能体調 | 50以上 |
| 自動休養 | 体調60未満 |

`_heat` は追い込みで +1（最大4）、通常練習で -1、休養で -2。プロモ・怪我では変化しない。追い込みの成長倍率だけが熱量で逓減し、怪我・体調消耗・`seasonIntensiveWeeks` は満額で積む。

### §6.1 AIのbalance運用

AIも同じ判定を行う。

- **興行週も**練習判定へ進む。general枠の華／ファンサービス持ちがプロモを実行した週だけ練習しない
- 体調60未満は強制休養し、追い込みは体調50以上かつ連続2週未満でのみ選ぶ
- AIの追い込みは `calcGrowth` へ `intensive: true` を渡し、プレイヤーと同じ熱量テーブルを使う
- `seasonIntensiveWeeks` と `_heat` はAIにも保存する。`validateGameState` は `_heat: 0..4`、非負の追い込み週数／負債、衰退開始後の負債ゼロを常時確認する

### §6.2 季末wear / strainDebt（共通式）

`applySeasonTrainingWear` をプレイヤーとAIの両方が使う。`decayStartAge = 23 + 実効耐久`。

```
baseWear(10 ± 3)
+ [当季試合数 ≤10: −1 / 19〜24: +2 / ≥25: +4]   ← v2.2.1: キャリア平均基準(≥40:+3)から当季実数連動へ(13aa69e)
+ seasonInjuries × 2
+ round(seasonIntensiveWeeks × 0.15)
- effectiveDurability
+ 初到達年のみ strainDebt
→ 延命術なら全体 ×0.50（最低1は残る）
```

当季試合数は `seasonMatchCount`（季末にリセット）。少ない稼働で寿命を延ばす選択が全成長タイプ共通で成立する（実装: `applySeasonTrainingWear`, management.js:8607-8638）。

| 時期 | 挙動 |
|------|------|
| 衰退開始前 | wearへは載せず `strainDebt += seasonIntensiveWeeks × 0.25` |
| 初到達年 | 既存負債を一括清算して0へ戻す |
| 到達後 | その年の追い込み・怪我・試合量を共通式へ反映 |

`aiMatchWearCoef` は廃止。AIだけが追い込みの代償を免除される非対称は撤回する。

### §6.3 限定AIトレーナー

シーズン開幕時、S級は50%、`leagueElevated`中のA級は30%で、`trainCapOVR`上位3名から候補を選ぶ。`wear = 0` かつ `statPeak` 比の低下がゼロの選手だけが対象で、1団体1名・業界全体で最大2名。

付与はプレイヤーの外部コーチ招聘と同じ `_inviteBuff`、`calcInviteMult`、4週の効果・コーチ能力を使う。AIの招聘は卒業レポート、延長、化ける（覚醒）には接続しない。

---

## §7 試合成長

```
matchGrowth = (0.5 + opponentBonus + closeMatchBonus + resultBonus + coachMatchBonus) × ageMul
```

MQ≥65の好試合 +0.3、敗北 +0.2。AIも同じ試合結果・コーチ経路を使う。

## §8 外部乗算

| 要因 | 効果 |
|------|------|
| スランプ / モチベーション喪失 | ×0 |
| レッドホット | ×1.15 |
| growthPenalty | penalty値 |
| 外部コーチ招聘 | `trainerMult` |
| 孤立 | ×0.7 |
| 合宿 | `trainingBoostMult` |

低士気の成長ゼロ確率は、士気40未満で15%、40–49で5%、50以上で0%。

## §9 較正と不変条件

本版の測定は `ai-growth-parity-spec-v0.1.md` §6 の5シード・40年比較を使う。調整対象はAIの `intensiveRate` とトレーナー確率のみで、`practiceRate` は据え置く。最終採用時のみ100年×1本を実施する。

| 条件 | 目的 |
|------|------|
| G1 | S級top4が trainCapOVR−6〜trainCapOVR帯へ到達 |
| G2 | elevated A級top1中央値 ≤ S級top1中央値−3 |
| G3 | AI引退年齢中央値が基準比−1.0歳以内、ロスター下限維持 |
| I1 | 27歳時4statカンスト率25%以下 |
| I4 | 同一シードでプレイヤー練習成長ログが不変 |

AI週次／季節トレーナーはAI専用の派生RNGを使い、プレイヤーの乱数列を消費しない。

## §10 AI週次設定

`AI_COACH_CONFIG` は行動率だけを持つ。`coachMul` は削除済み。

| ティア/枠 | normal intensiveRate | elevated intensiveRate | practiceRate |
|------|:---:|:---:|:---:|
| S top1 / top2–4 / prospect / general | .12 / .10 / .08 / .04 | 同左 | 現行維持 |
| A top1 / top2–3 / general | .08 / .06 / .00 | .10 / .08 / .02 | 現行維持 |
| B top1 / top2–3 / general | .00 / .00 / .00 | .06 / .04 / .00 | 現行維持 |

## §11 決定済みの非対応事項

| 項目 | 決定 |
|------|------|
| 年齢減衰カーブの仕様乖離 | 本版では変更しない |
| trainCap上限を下げる案 | 却下済み |
| `_heat` の数値UI | 未実装。将来は道場コメントで定性的に示す |
| 開眼（化ける）システム | 本パリティ較正後に別仕様として起票。AIトレーナーでは発火させない |

## §12 廃止された定数

| 定数 | 旧用途 |
|------|------|
| `GROWTH_SEASON_BASE` / `practiceShare` / `convergenceRatio` | 旧年間配給型成長 |
| `baseGrowthRate` / `growthRandom` / `peakBonusSeason` / `peakGrowthMult` | 旧成長式 |
| `GROWTH_CONFIG.aiMatchWearCoef` | AIだけの試合wear近似。共通季末式へ統合 |
| AI設定の `coachMul` / `growthBonus` | 未参照の見かけ設定。実コーチ／実行動率へ統合 |

<!-- v2.2: ai-growth-parity-spec-v0.1.md を統合。測定結果は同specの§6運用記録に追記する。 -->
