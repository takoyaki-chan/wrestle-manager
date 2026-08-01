# ⚖️ AI成長パリティ設計書 v0.1

> **ステータス**: 🟡 DRAFT・Keisukeレビュー待ち
> **作成日**: 2026-08-01
> **裁定**: 2026-08-01 Keisuke「公平な対決」原則(全項目対称化 / AIは追い込みを控えめに / leagueElevated再較正を含める)
> **依存**: growth-system-spec-v2.1 / rival-org-spec-v1.0 / shachoshitsu-care-rework-spec-v1.0
> **実装箇所(予定)**: management.js(processAIWeek / AIシーズン末処理), data.js(AI_COACH_CONFIG系 / GROWTH_CONFIG)
> **🔧 = 較正対象パラメータ**。§6の計測で確定するまで仮値

---

## 0. 背景と裁定

- 旧世界(〜2026-07リバランス前)では、プレイヤー・AI双方でOVR109〜110到達が発生していた
- 2026-07-30 の成長リバランス(brakeGamma 1.3)の意図は「**誰であれ**簡単にtrainCap天井へ到達してずらっと並ぶことの抑制」であり、NPC狙い撃ちではない(2026-08-01 Keisuke明言)
- しかし実際にはAI側だけが失速した(40年計測でAIトップ層84〜87)。原因は成長式ではなく**入力の非対称**(§1)
- 本仕様は成長入力をプレイヤーと対称化し、「**差がつくのは采配の質だけ**」の状態を作る
- growth-system-spec-v2.1 §6.2「AI非対称は意図的・バグとして是正しない」/ §9「AIトップ層低下は意図的」の裁定は、本仕様で**上書き**される

---

## §1 非対称の全量(2026-08-01 実装調査・検証済み)

### §1.1 既に対称(変更しない)

| 項目 | 確認箇所 |
|------|---------|
| calcGrowth本体(brakeGamma / ageMul / weeklyVariance / 特性ボーナス) | management.js 7407(AIは9256から同関数を呼ぶ) |
| コーチの実雇用 — AIはALL_COACHESから本物のコーチを隠しスタッフィングしている | ensureAICoachStaffing 8552 / AI_COACH_STAFFING(グレード計画) |
| コーチ能力: gMult / スタイル一致 / **限界突破+4 / 弱点克服+5** / 新人育成 / ステ特化 / 才能開花 | buildAIState 8419 が coaches / coachAssign を渡すため、Engine.coach 経路(getCharCoach → _charHasAbility)が全て生きる |
| ブレークスルー判定 | processAIWeek 内 9461 |
| 絶好調×1.15 / 孤立×0.7 / 関係性mult / 警告trust×0.9 | 9257-9261 |

> **注**: AI_COACH_CONFIG の `coachMul` フィールドは現行の週次成長経路では**使われていない**
> (calcGrowth 7432 は overrideCoachMul 未指定時に実コーチの gMult を読む。現行の全呼び出し元が未指定。
> 参照は management.js 8374 の1箇所のみ)。P-6で整理する。

### §1.2 AIに不利な非対称(是正対象)

| # | 内容 | 箇所 |
|---|------|------|
| 1 | **興行週(偶数週=年の半分)に練習ゼロ**(プロモ処理のみで早期return) | processAIWeek 9220-9239 |
| 2 | 体調の安全弁なし(体調<60でも練習継続 / 追い込みに体調≥50ゲートなし / 連続2週上限なし) | 9247-9282 |
| 3 | 専属トレーナー / 外部コーチ招聘(_inviteBuff)なし | getTrainerMult 22337 |

### §1.3 AIに有利な非対称(是正対象)

| # | 内容 | 箇所 |
|---|------|------|
| 4 | 追い込みが熱量逓減なしの**常時×1.8**(_heat未更新) | 9258 |
| 5 | 追い込みのwear/strainDebtを払わない(baseWear−耐久+試合数×0.05のみ。seasonInjuries×2・avgMatches補正・延命術multもなし) | 9944-9957 |

### §1.4 対称化の対象外(今回見送り)

- **合宿(trainingBoostMult)・マイルストーンバフ**: プレイヤーの能動アクション・実績由来。「環境の手厚さ」はP-5のトレーナーで代表させる
- **growthPenalty(ペナルティ期)**: AI側に該当stateが発生しないため対象外

---

## §2 是正項目 P-1〜P-6

### P-1 興行週練習の解禁

- processAIWeek の isShow 早期return を廃止し、興行週も通常週と同じ練習判定(practiceRate / intensiveRate)を通す
- 既存のAIプロモ(general枠+華/ファンサ持ち)は現行維持。プロモを発動した選手はその週は練習しない(プレイヤーの balance 運用と同型)
- **practiceRate 値は当面据え置き** 🔧 — 解禁だけで実効練習量が約2倍になるため、二重に上げない。§6の計測でS級top4が目標帯(§5 G1)に届かない場合のみ引き上げる

### P-2 体調ケアの安全弁

- 体調<60 → その週は強制休養(回復は既存の休養分岐 9284 と同式)。プレイヤーの自動休養(11426)と同値
- 追い込みは `condition ≥ intensiveMinCond(50)` かつ `intensiveWeeks < intensiveMaxConsec(2)` のときのみ発動
- 同じ代償(P-4)を払わせる以上、同じ安全弁を与える。これがないとAIだけが自壊する

### P-3 熱量逓減のAI適用

- isIntensive 時の倍率を固定 `intensiveMult(1.8)` から `intensiveHeatTable[_heat]` に変更
- `_heat` 更新もプレイヤーと同一: 追い込み+1(max 4) / 通常練習−1 / 休養−2 / 怪我・プロモは変化なし
- §3の低い intensiveRate により、AIは自然に「熱量ほぼ0の状態で満額×1.8を撃つ」挙動になる(戦略コード不要)

### P-4 wear/strainDebtの共通化

- AI選手も追い込み時に `seasonIntensiveWeeks` を加算する
- シーズン末のAI wear蓄積(9944)をプレイヤー式(7594-7611)と**同一の共通ルーチン**に統合する:
  `baseWear(10±3) + [avgMatches≥40: +3] + seasonInjuries×2 + seasonIntensiveWeeks×0.15 − effDura + strainDebt清算`、延命術コーチ×0.50適用
- decayStartAge 前は strainDebt 積み立て(0.25/週)、初到達シーズンに一括清算 — プレイヤーと同一
- **GROWTH_CONFIG.aiMatchWearCoef(0.05)は廃止**(共通式に置き換わる)
- 注: AIの年間試合数がプレイヤー水準と揃っているかを§6で確認し、avgMatches≥40 補正が非対称に効く場合は閾値を調整 🔧

### P-5 専属トレーナー相当(限定的) 🔧

- Keisuke裁定「限定的に」の解釈案: **エース1名のみ・シーズン単位の確率付与・常設しない**
- シーズン開幕処理で付与判定:
  - S級: top1 に 50% 🔧
  - A級: leagueElevated 時のみ top1 に 30% 🔧
  - B級: なし
- 効果・期間はプレイヤーの外部コーチ招聘(shachoshitsu-care-rework §3)と**同値を参照**する。AI専用の倍率を新設しない
- 同時付与は業界全体で最大2名(S + elevated A)

### P-6 coachMulフィールドの整理

- AI_COACH_CONFIG の `coachMul` は週次成長経路で未使用(§1.1注)。8374 の参照用途を実装時に特定し、死んでいれば削除、生きていれば用途をコメントで明記
- 「見た目の設定値」と「実際に効く値」の乖離はバランス調整の事故源になるため放置しない

---

## §3 AI追い込み節度(intensiveRate改定) 🔧

裁定: wearを対称に払う代わり、**AIは追い込みを控えめに使う**。

平均発火間隔 = 1/rate 週。0.12なら約8週に1回で、熱量(通常練習で−1/週)はほぼ毎回全快 → 撃つときは満額×1.8。「頻度を絞ること自体が最適運用」の構造になり、熱量テーブルと自然に噛み合う。

| ティア/枠 | 現行 | 改定案 🔧 |
|-----------|-----:|---------:|
| S top1 | 0.30 | 0.12 |
| S top2_4 | 0.25 | 0.10 |
| S prospect | 0.20 | 0.08 |
| S general | 0.10 | 0.04 |
| A top1 | 0.20 | 0.08 |
| A top2_3 | 0.15 | 0.06 |
| A general | 0.0 | 0.0 |
| B 全枠 | 0.0 | 0.0 |

wear見積り(S top1): 0.12 × 実効練習約40週 ≒ 4.8追い込み週/シーズン → decayStartAge到達後 wear+0.72/季、到達前 strainDebt+1.2/季。プレイヤーの節度ある運用と同帯。

---

## §4 業界底上げ(leagueElevated)の再較正

**前提が変わる**: elevated の数値は「AIが年の半分しか練習せず」の世界で調整されたもの。対称化後は同じ数値が別の強さになる(A級top1の実効練習機会: 約0.40/週 → 約0.85/週)。

- 「覚醒(本気)」の表現を**追い込み連打から、練習量・コーチ格・獲得競争へ**移す:
  - practiceRate / エース枠数 / コーチ格上げ(A,B,B,B 等) / FA積極性 / ドラフト強化 → **現行elevated値を維持**
  - intensiveRate → 引き下げ 🔧: A top1 0.25→0.10 / A top2_3 0.20→0.08 / A general 0.05→0.02 / B top1 0.15→0.06 / B top2_3 0.10→0.04 / B general 0.0
- **growthBonus(A ×1.10 / B ×1.08)は廃止を提案**(開いた論点1)。対称原則の下で説明のつかないAI専用乗算を残さない。覚醒の強さはコーチ格・枠数・練習量で表現する
- S級は現行どおり変更なし

---

## §5 数値目標と不変条件(対で定義)

| # | 目標 | 対の不変条件 |
|---|------|-------------|
| G1 | 40年計測でS級top4の到達OVRが `trainCapOVR−6 〜 trainCapOVR` 帯に入る(cap帯[0.75,0.80]なら実OVR ≒ 108〜118) | **I1**: 業界全体の27歳時4statカンスト率(98%+)が25%以下(現行22%から+3pt以内) |
| G2 | elevated後のA級トップが「S級にやや劣る」水準を維持 | **I2**: 40年elevated計測でA級top1到達OVR中央値 ≤ S級top1中央値−3 |
| G3 | wear対称化後もAIが自壊しない | **I3**: AI引退年齢中央値が現行比−1.0歳以内 / AIロスター人数がシーズン末に下限を維持 |
| G4 | プレイヤー側への波及ゼロ | **I4**: 同一シードでプレイヤー選手の練習成長ログが変更前後で一致(AI側は独立乱数ストリーム(aiRng)のため、分離が保たれている限り一致するはず) |
| — | — | **I5**: validateGameState 追加チェック: AI選手の `_heat ∈ [0,4]` / `seasonIntensiveWeeks ≥ 0` / `strainDebt ≥ 0` かつ decayStartAge到達済みなら `strainDebt = 0` |

---

## §6 計測計画(2026-07-24裁定「不必要に回さない」の範囲内)

1. ベースライン: 現行mainで40年×同一5シード(既存計測結果があれば使い回す)
2. 実装後: 同じ5シードで40年×2構成 — (a) 通常 / (b) 開幕からelevated強制(計測フラグを新設する場合、**本編の乱数消費を変えない形にする**こと — 2026-08-01 のWM_PPV_FIXTUREの失敗(fingerprint変動で取り下げ)を繰り返さない)
3. 比較指標: S/A/Bトップ層到達OVR分布 / カンスト率 / AI引退年齢 / AIロスター人数 / プレイヤー成長ログ一致(I4)
4. §3のrate・P-5の確率は上記の結果で判断し、動かす場合のみ40年グリッド(候補値±50%の2点)
5. 採用値の最終確認だけ100年×1本

---

## §7 実装箇所マップ

| 変更 | ファイル / 関数 / 行 |
|------|---------------------|
| P-1 / P-2 / P-3 | management.js processAIWeek 9210-9290 |
| P-4 wear共通化 | management.js AIシーズン末 9944-9958 ↔ プレイヤー式 7576-7615(共通関数へ抽出) |
| P-4 定数廃止 | data.js GROWTH_CONFIG.aiMatchWearCoef(8051) |
| P-5 | シーズン開幕AI処理(ensureAICoachStaffing 12169近傍に付与判定) + getTrainerMult 22337(変更なし・参照のみ) |
| §3 / §4 | data.js AI_COACH_CONFIG 8557 / AI_COACH_CONFIG_ELEVATED 8638 / AI_TIER_LIMITS_ELEVATED 8633(growthBonus) |
| I5 | management.js validateGameState |

実装時の注意:
- **呼び出し元を全部数えてから直す**。`aiMatchWearCoef` / `intensiveMult` / `coachMul` / `isShowWeek`(processAIWeek内) の全参照を列挙してから着手
- management.js / data.js の編集で auto-sim フック(100シーズン)が自動実行される。フェーズごとに追加で回さない

---

## §8 既存specへの影響(実装完了時に反映)

| spec | 上書き内容 |
|------|-----------|
| growth-system-spec-v2.1 §6.1 | 「AIは_heatを更新せず×1.8」→ P-3で対称化 |
| growth-system-spec-v2.1 §6.2 | 「AI非対称は意図的・バグとして是正しない」→ 撤回(2026-08-01裁定) |
| growth-system-spec-v2.1 §6.3 | AI活動wear(aiMatchWearCoef)→ 廃止、共通式へ |
| growth-system-spec-v2.1 §9 | 「AIトップ層84〜87は意図的」→ 撤回。新目標は§5 G1 |
| growth-system-spec-v2.1 §10.2 | AI_COACH_CONFIG表 → §3改定値 + coachMul整理を反映 |
| rival-org-spec-v1.0 | AI週次処理(練習カレンダー/ケア)の記述更新 |

→ 実装完了時に **growth-system-spec-v2.2** を起こして本仕様を統合し、本ファイルは役目を終える

---

## §9 開いた論点(レビューで決める)

1. **growthBonus(elevated A ×1.10 / B ×1.08)の廃止** — 推奨: 廃止。残すなら縮小値の根拠を較正で示す
2. **P-5の付与範囲・確率**(S top1 50% / elevated A top1 30%)— 「限定的に」の解釈がこれで合っているか
3. **下位層の底上がり** — 興行週解禁はA般・B級の実効練習量も倍増させる。業界の底が上がりすぎる場合、下位枠のpracticeRateを下げる補正を入れるか(§6の計測で判断)
4. **開眼(化ける)システムとの接続** — 本spec較正後のトップ実到達帯(G1)を開眼の着地帯の物差しにする。開眼specは本specの計測完了後に起票する

---

## 改訂履歴

| 版 | 日付 | 変更 |
|---|------|------|
| v0.1 | 2026-08-01 | 初版DRAFT(実装調査に基づく非対称レジャー / 是正P-1〜P-6 / AI追い込み節度 / elevated再較正 / 計測計画) |
