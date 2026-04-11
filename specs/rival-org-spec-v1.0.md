# 🏢 ライバル団体AI設計書 v1.0

> **ステータス**: 🟢 構造確定（数値は実装後チューニング前提）
> **作成日**: 2026-02-19
> **依存**: org-ranking-spec-v1.0.md / scout-system-spec-v1.0.md / training-system-spec-v1.0.md / economy-system-spec-v1.0.md / weekly-gameloop-spec-v1.0.md / battle-engine-spec-v4.0.md / mq-popularity-spec-v1.0.md / condition-system-spec-v1.0.md
> **ロードマップ対応**: フェーズ3 ⑨ ライバル団体AI
> **🔧マーク = 調整可能パラメータ**（実装後のバランスチューニング対象）

---

## 設計原則

1. **データは本物、処理もプレイヤーと同等** — AI選手も能力値フルセットを持ち、**毎週processAIWeekで処理**（v2.0: シーズン末一括→週次化）
2. **半具体管理** — 個別選手が実在する。引き抜き・レンタル・抗争で「顔が見える」対戦相手
3. **プレイヤー団体と同じ計算式** — 成長・衰退・引退・Trust・Bond/Rivalryに同じルールを適用
4. **スカウト競合との統合** — scout-system-spec §5.2 の競合率はAI団体の行動から導かれる
5. **単一バランス** — 難易度選択なし。初期資金を多めに設定し、序盤の即死を回避

---

## §1 AI団体の定義

### §1.1 団体一覧

| ID | 名称 | 略称 | ティア | イメージカラー |
|:--:|------|:----:|:-----:|:------------:|
| ai_org_s | EMPRESS GRAND | EMPRESS | S | 金＋深紅 |
| ai_org_a | NOVA IMPACT | NOVA | A | 青＋白 |
| ai_org_b | CRESCENT RISE | CRESCENT | B | 緑＋銀 |

### §1.2 団体コンセプト

| 団体 | コンセプト | 特徴 | ゲーム上の役割 |
|------|---------|------|-------------|
| EMPRESS GRAND | 業界の絶対王者。歴史と権威の象徴 | 資金力が圧倒的。トップスターを複数抱え、興行規模も最大。引き抜き力が高い | **最終目標**。ここを超えたらクリア |
| NOVA IMPACT | 攻撃的な興行スタイルで急成長中の挑戦者 | 育成力が高く、若手を次々スターに押し上げる。スカウト積極派 | **中盤のライバル**。スカウト競合で最もぶつかる相手 |
| CRESCENT RISE | 地方発の堅実運営団体。小規模だがファンに愛される | 資金力は低いが、中堅選手の層が厚い。引き抜きされやすい側 | **序盤の目標**。最初に追い抜くべき相手 |

---

## §2 初期ロスター配分

### §2.1 人数配分

既存80名を以下のように配分する。

| 所属先 | 人数 | 備考 |
|--------|:----:|------|
| プレイヤー団体 | 5〜6名 | 弱小スタート。ここから育てる |
| EMPRESS（S） | 15〜18名 | 大所帯の王者 |
| NOVA（A） | 12〜14名 | 中規模の挑戦者 |
| CRESCENT（B） | 8〜10名 | 小規模の堅実派 |
| フリー選手プール | ROSTER_CFG.fa名 | ALL_CHARSの既存キャラから配分 |
| dormantPool | 20名 | age 17-21。スカウト候補として出現 |
| retiredIds | 残り | 5シーズンCDで順次dormantに復帰 |
| **合計** | **127名** | |

### §2.2 未登場プール

ゲーム開始時点で業界にまだ登場していない選手。時期が来るとスカウト候補として出現する。

| データ | 保持するもの | 保持しないもの |
|--------|-----------|-------------|
| 未登場選手 | Notion値・潜在値・名前・年齢・身長・スタイル・ヒール度 | trainCap・現在値・人気 |

- **出現タイミング**: 各キャラに**登場年齢**を設定。スカウト候補生成時に、ランダム新人と一緒に「今シーズン解禁の既存キャラ」が混ざる
- trainCapはどの団体に所属が決まった時点で生成（§3.1）

---

## §3 AI選手のデータ管理

### §3.1 保持するデータ

| データ | 備考 |
|--------|------|
| 能力値フルセット | Notion値・潜在値・現在値（PWR/SPD/TEC/STA/MNT） |
| trainCap | **団体所属時に生成**（training-system-spec §1.4 と同じ公式） |
| 名前・年齢・身長 | |
| スタイル・ヒール度 | |
| 人気値（popularity） | |
| 出自フラグ | 初期配置 / スカウト流出 / AI自前スカウト / 未登場プール出身 |

### §3.2 簡略化するもの

| 項目 | 処理 |
|------|------|
| 成長 | **毎週processAIWeekで処理**（v2.0: シーズン末一括を廃止） |
| 怪我・コンディション | **管理する**（processAIWeek内で怪我判定・回復・重症時引退判定） |
| 試合結果 | **フルapplyMatchResult適用**（_lastMatchResults経由） |
| Trust | **applyShowTrustで毎興行更新**（初期値50） |
| Bond/Rivalry | **関係性システム全適用** |
| 通算成績 | **管理する**（ゲーム開始時にgenerateBackstoryで経歴自動生成） |
| lockerRoomMorale | **管理する**（初期値60、イベント・ケアで変動） |

### §3.3 保持しないもの

| 項目 | 理由 |
|------|------|
| デフォルトスケジュール | AI団体では不要。移籍時に「バランス」で自動設定 |

---

## §4 AI処理パイプライン（v2.0: 週次化）

### §4.0 週次処理: processAIWeek（毎週tickWeek内で実行）

v2.0でシーズン末一括処理を廃止し、プレイヤーと同等の週次処理に移行。

```
processAIWeek 処理内容:
  1. 怪我回復・体調管理
  2. 練習週: AI_COACH_CONFIG依存の成長計算（calcGrowthと同一式）
  3. 興行週: AIプロモ→AI試合生成→タイトルマッチ管理
  4. 試合後: applyMatchResult（Bond/Rivalry/ブレークスルー/スランプ等）
  5. applyShowTrust（信頼度更新）
  6. processAICare（trust<55の選手へのケア）
  7. processAIWeeklyEvent（通知型/選択型イベント自動処理）
```

### §4.0a processAICare（v2.0新設）

| ティア | ケア確率 | 全体ケア確率 | 全体ケア強度 |
|--------|---------|------------|------------|
| S | 35% | 15% | 1.5 |
| A | 20% | 8% | 1.2 |
| B | 10% | 4% | 0.8 |

- 個人ケア: trust<55の選手から最大2名、状況ベースで種別選択（休暇/メディア/激励/合宿）
- trustΔ: +1.5〜+3.0、bond変動: +0.3〜+1.0
- 全体ケア: 全員trust微増、全ペアbond +0.1〜+0.5

### §4.1 シーズン末処理（offWeek 1〜4に分散）

```
offWeek 1: processSeasonEnd
  1. 加齢 — 全選手+1歳
  2. 衰退判定（wear蓄積・decay）
  3. 引退判定
  4. 契約退団判定（processAIContracts: trustベース）

offWeek 3: AIスカウト + AIロスター補強
offWeek 4: AI間移籍 + FA獲得
```

### §4.2 AI成長モデル（v2.0: 週次・プレイヤー同等）

**aiSeasonGrowth一括計算は廃止**。processAIWeek内で毎週calcGrowthと同一式で計算。

```javascript
// AI_COACH_CONFIG（data.js）: ティア別コーチ環境
const AI_COACH_CONFIG = {
  S: { ace: { coachMul: 1.25, intensiveRate: 0.30, practiceRate: 0.85 },
       prospect: { coachMul: 1.18, intensiveRate: 0.20, practiceRate: 0.85 },
       regular: { coachMul: 1.15, intensiveRate: 0.10, practiceRate: 0.75 } },
  A: { ace: { coachMul: 1.20, intensiveRate: 0.20, practiceRate: 0.80 },
       regular: { coachMul: 1.10, intensiveRate: 0.10, practiceRate: 0.55 } },
  B: { ace: { coachMul: 1.12, intensiveRate: 0.10, practiceRate: 0.55 },
       regular: { coachMul: 1.08, intensiveRate: 0, practiceRate: 0.45 } }
};
```

成長式はプレイヤーと同じ: `baseLearning(2.0) × (remaining/trainCap) × ageMul × coachMul × variance`

### §4.2 人気変動（シーズン末一括）

AI選手は個別のMQ計算をしないので、Overall帯と所属団体のティアから概算。

```javascript
function aiSeasonPopularity(fighter, orgTier) {
  let overall = average(fighter.current[PWR, SPD, TEC, STA, MNT])
  let tierBonus = { S: 8, A: 4, B: 2 }[orgTier]  🔧

  // 強い選手ほど人気が高くなるが、上限あり
  let popTarget = min(90, overall * 0.7 + tierBonus)  🔧
  let diff = popTarget - fighter.popularity

  // 現在値とターゲットの差の30%を毎シーズン埋める
  fighter.popularity += round(diff * 0.3 + randomRange(-5, 5))  🔧
  fighter.popularity = clamp(fighter.popularity, 5, 95)
}
```

### §4.3 AI団体のコーチ・施設水準

AI団体はコーチ・施設を個別管理せず、ティアに応じた固定倍率で近似。

| AI団体ティア | coachMul 🔧 | facilityMul 🔧 | 想定 |
|:----------:|:----------:|:-------------:|------|
| S（EMPRESS） | 1.30 | 1.15 | S級コーチ＋Lv4施設相当 |
| A（NOVA） | 1.15 | 1.10 | A級コーチ＋Lv3施設相当 |
| B（CRESCENT） | 1.00 | 1.05 | B級コーチ＋Lv2施設相当 |

### §4.4 衰退処理

training-system-spec §5.3〜5.4を**そのまま適用**。AI用に簡略化しない。

```javascript
// training-spec §5.3 と完全に同じ処理
applyAging(fighter)
```

理由: AI選手もプレイヤー団体に移籍する可能性があるため、能力値の履歴がプレイヤー側と矛盾しないようにする。

### §4.5 引退処理

scout-system-spec §7 をそのまま適用。

- 年齢引退: 35歳〜確率判定、39歳確定
- 後遺症引退: AI選手は怪我を管理しないため発生しない
- 自主引退: Overall が Notion値の60%を2シーズン連続で下回る

AI選手の引退に引き留めはない（自動処理）。

---

## §5 AI団体のスカウト行動

### §5.1 スカウト方針

| AI団体 | 方針 | 獲得傾向 |
|--------|------|---------|
| EMPRESS（S） | 即戦力重視 | 高ランク候補を資金力で獲得。原石にはあまり手を出さない |
| NOVA（A） | 育成重視 | 若くて潜在値が高い候補を積極的に狙う。逸材を競り合う |
| CRESCENT（B） | 堅実補充 | 引退で抜けた穴を埋める程度。資金的に大型補強は難しい |

### §5.2 パラメータ

| 項目 | EMPRESS（S） 🔧 | NOVA（A） 🔧 | CRESCENT（B） 🔧 |
|------|:---:|:---:|:---:|
| 年間スカウト予算（万） | 800 | 500 | 200 |
| 最大獲得数/年 | 3 | 3 | 2 |
| 逸材獲得率 | 90% | 70% | 30% |
| 有望獲得率 | 80% | 60% | 50% |
| 原石獲得率 | 30% | 50% | 60% |
| 理想ロスター数 | 16 | 13 | 9 |

### §5.3 処理フロー

```javascript
function aiScout(aiOrg, scoutCandidates) {
  let budget = AI_SCOUT_BUDGET[aiOrg.tier]
  let need = aiOrg.idealRosterSize - aiOrg.roster.length
  let maxPicks = min(need + 1, AI_MAX_PICKS[aiOrg.tier])

  let targets = selectTargets(aiOrg, scoutCandidates)

  let picked = 0
  for (each target of targets) {
    if (picked >= maxPicks) break
    if (budget < target.contractCost) continue

    let acquireChance = AI_ACQUIRE_RATE[aiOrg.tier][target.rank]
    if (random() < acquireChance) {
      aiOrg.roster.push(target)
      budget -= target.contractCost
      picked++
    }
  }
}
```

### §5.4 プレイヤーのスカウト競合との統合

```
スカウト開催時の処理順:
  1. 候補者リスト生成（ランダム＋未登場プール解禁分）
  2. プレイヤーが指名
  3. 競合判定 = 「AI団体がこの候補を欲しがっているか」
  4. 競合発生 → プレイヤーに追加コスト/50%勝負の選択肢
  5. プレイヤーが獲得しなかった候補の中から、AI団体が獲得
```

scout-system-spec §5.2 の競合率（逸材80%、有望40%、原石10%）は、AI団体のスカウト方針（§5.2）から導かれる。既存の数値とほぼ一致するように設定済み。

---

## §6 エース認定システム

### §6.1 基本仕様

| 項目 | 仕様 |
|------|------|
| 操作 | プレイヤーが任意のタイミングで選手をエース認定/解除 |
| 上限 | **1名** |
| コスト | 認定自体は無料。引き留め時にコストが発生 |
| 効果① | 引き抜きに対して、引き留め金を払えば**100%残留** |
| 効果② | 興行のメインイベントに優先配置（weekly-gameloop連携） |
| 効果③ | グッズ売上ボーナス（economy-spec連携） |

---

## §7 選手の引き抜き・移籍

### §7.1 引き抜き（プレイヤー → AI団体の選手を獲得）

| 項目 | 仕様 |
|------|------|
| タイミング | オフシーズン第3週（スカウト翌週） 🔧 |
| 対象 | AI団体所属の全選手（ただしエース級は制限あり） |
| 情報開示 | スカウトより精度が高い（現役選手なので実績が見える） |
| 年間上限 | 1名 🔧 |

**移籍金の算出:**

```javascript
function calcTransferFee(fighter, fromOrg) {
  let overall = average(fighter.current)
  let popBonus = fighter.popularity * 10  // 万円。人気選手ほど高い

  let baseFee
  if (overall >= 80)      baseFee = 800   // エース級
  else if (overall >= 60) baseFee = 400   // 主力級
  else if (overall >= 45) baseFee = 200   // 中堅級
  else                    baseFee = 100   // 若手級

  let tierMul = { S: 1.5, A: 1.2, B: 1.0 }[fromOrg.tier]

  return round((baseFee + popBonus) * tierMul)  // 万円
}
```

| Overall帯 | 基本移籍金（万）🔧 | S級加算 | A級加算 | B級 |
|:---------:|:---------------:|:------:|:------:|:---:|
| 80〜（エース） | 800 + 人気補正 | ×1.5 | ×1.2 | ×1.0 |
| 60〜79（主力） | 400 + 人気補正 | ×1.5 | ×1.2 | ×1.0 |
| 45〜59（中堅） | 200 + 人気補正 | ×1.5 | ×1.2 | ×1.0 |
| 〜44（若手） | 100 + 人気補正 | ×1.5 | ×1.2 | ×1.0 |

**交渉成功率:**

```javascript
function transferNegotiation(fighter, fromOrg, offerAmount) {
  let required = calcTransferFee(fighter, fromOrg)
  if (offerAmount < required) return "rejected"

  let successRate = 0.8  🔧
  if (fighter.isAce(fromOrg)) successRate -= 0.3  🔧
  if (fromOrg.tier === "S") successRate -= 0.2  🔧

  successRate = clamp(successRate, 0.1, 0.95)
  return random() < successRate ? "success" : "rejected"
}
```

### §7.2 流出（AI団体 → プレイヤーの選手を引き抜く）

| 項目 | 仕様 |
|------|------|
| タイミング | オフシーズン第3週（引き抜きウィンドウ） |
| 対象条件 | 人気50以上 かつ 引き抜き元がプレイヤー団体より上位 🔧 |
| 発生確率 | シーズンごとに15%（対象選手1人あたり） 🔧 |
| 防衛手段 | 引き留め金を払う or 諦める |

**引き抜き防衛:**

| 状況 | 残留率 🔧 | 引き留め金 | 移籍金 |
|------|:--------:|:---------:|:-----:|
| エース認定 + 引き留め金支払い | **100%** | 消費 | — |
| 非エース + 引き留め金支払い | **80%** | 消費（失敗でも返金なし） | 失敗時のみ入る |
| 引き留めしない | 0%（流出確定） | — | 入る |

```javascript
function resolvePoaching(fighter, aiOrg, playerChoice) {
  if (playerChoice === "let_go") {
    let transferIncome = calcTransferFee(fighter, playerOrg) * 0.7  🔧
    playerOrg.funds += transferIncome
    transferPlayer(fighter, playerOrg, aiOrg)
    return "poached"
  }

  // 引き留め
  let retentionCost = calcTransferFee(fighter, playerOrg) * 0.5  🔧
  playerOrg.funds -= retentionCost

  if (fighter.isAceDesignated) {
    return "retained"  // エース認定 → 確定残留
  } else {
    if (random() < 0.80) {  🔧
      return "retained"
    } else {
      // 引き留め失敗。金は戻らないが移籍金は入る
      let transferIncome = calcTransferFee(fighter, playerOrg) * 0.7
      playerOrg.funds += transferIncome
      transferPlayer(fighter, playerOrg, aiOrg)
      return "poached"
    }
  }
}
```

### §7.3 AI間移籍

AI団体同士の選手移動。シーズン末に自動処理。

```javascript
function aiInterTransfer(aiOrgs) {
  for (each upperOrg of aiOrgs.sortByTierDesc()) {
    for (each lowerOrg of aiOrgs.filter(o => o.tier < upperOrg.tier)) {
      if (random() < 0.10) {  🔧  // 年1回、10%の確率で1名移籍
        let target = lowerOrg.getTopFighter()
        lowerOrg.roster.remove(target)
        upperOrg.roster.push(target)
        target.popularity += 5  🔧  // 移籍ブースト
      }
    }
  }
}
```

---

## §8 他団体レンタル

### §8.1 基本仕様

| 項目 | 仕様 |
|------|------|
| 方向 | プレイヤー ← AI団体（借りるのみ。貸し出しはなし） |
| 目的 | 怪我や引退でロスターが足りない時の一時補強 |
| タイミング | シーズン中いつでも申請可 |
| 期間 | 4週間固定 🔧 |
| 同時レンタル | 1名まで 🔧 |
| 延長 | 不可。期間終了で自動返却 |

### §8.2 レンタル対象の制限

| 条件 | 理由 |
|------|------|
| 団体内Overall 1位は対象外 | 相手団体の看板は貸さない |
| 団体内Overall 2位も対象外 | 主力すぎる |
| 対象は3位以下 | 中堅〜若手が借りられる |

### §8.3 レンタル料

```javascript
function calcRentalFee(fighter, fromOrg) {
  let overall = average(fighter.current)

  let weeklyFee
  if (overall >= 60)      weeklyFee = 50   // 主力級
  else if (overall >= 45) weeklyFee = 30   // 中堅級
  else                    weeklyFee = 15   // 若手級

  let tierMul = { S: 1.5, A: 1.2, B: 1.0 }[fromOrg.tier]

  return round(weeklyFee * tierMul)  // 万円/週
}
```

| Overall帯 | 週レンタル料（万）🔧 | 4週合計（B級） | 4週合計（S級） |
|:---------:|:----------------:|:------------:|:------------:|
| 60〜（主力） | 50 | 200 | 300 |
| 45〜59（中堅） | 30 | 120 | 180 |
| 〜44（若手） | 15 | 60 | 90 |

### §8.4 レンタル中の扱い

| 項目 | 仕様 |
|------|------|
| 試合出場 | 可。通常の選手と同じように使える |
| 成長 | **なし**。レンタル元に返すので育成できない |
| 怪我 | 発生する。怪我したまま返却される |
| 人気変動 | 試合のMQに応じて変動する（返却後も引き継ぐ） |
| トレーニング | 不可。「試合のみ」 |
| プロモ | 不可 |
| 給与 | レンタル料に含まれる（別途給与は発生しない） |

### §8.5 レンタル交渉

```javascript
function requestRental(fighter, fromOrg) {
  let baseRate = 0.80  🔧

  // プレイヤー団体が格下すぎると貸してもらえにくい
  let ratingGap = fromOrg.rating - playerOrg.rating
  if (ratingGap > 150) baseRate -= 0.3  🔧
  else if (ratingGap > 80) baseRate -= 0.1  🔧

  baseRate = clamp(baseRate, 0.3, 0.90)
  return random() < baseRate ? "approved" : "rejected"
}
```

---

## §9 団体間抗争イベント

### §9.1 抗争の種類

| 種類 | 規模 | 発生条件 | 概要 |
|------|------|---------|------|
| **対抗戦** | 3〜5試合 | ランキングが隣接する2団体間 | 互いの威信をかけた団体対決 |
| **挑戦状** | 1試合 | 引き抜き・レンタル怪我等のトラブル | 因縁の1戦 |
| **頂上決戦** | 1試合（タイトルマッチ） | プレイヤーがランキング2位以上 | 他団体チャンプへの挑戦 |

### §9.2 対抗戦

シーズンのメインイベント。年に最大1回発生。

| 項目 | 仕様 |
|------|------|
| 発生タイミング | Q2末またはQ3末の非興行週 🔧 |
| 発生確率 | 30%/シーズン 🔧 |
| 対戦相手 | ランキングで隣接するAI団体 |
| 試合数 | 3〜5試合（会場規模による） |
| 会場 | プレイヤーの使用可能な最大会場を自動選択 |
| 入場料 | 通常興行の1.5倍 🔧 |

```javascript
function checkRivalryEvent(playerOrg, aiOrgs, currentWeek) {
  if (rivalryAlreadyThisSeason) return null
  if (random() >= 0.30) return null

  let rankings = getAllRankings()
  let playerRank = rankings.findIndex(playerOrg)

  let candidates = []
  if (playerRank > 0) candidates.push(rankings[playerRank - 1])
  if (playerRank < rankings.length - 1) candidates.push(rankings[playerRank + 1])

  return randomPick(candidates)
}
```

**マッチメイク:**

```javascript
function makeRivalryCard(playerOrg, aiOrg, matchCount) {
  let playerFighters = playerOrg.roster.sortByOverall()
  let aiFighters = aiOrg.roster.sortByOverall()

  let card = []
  for (let i = 0; i < matchCount; i++) {
    card.push({
      player: playerFighters[i],  // プレイヤーは入れ替え可能
      ai: aiFighters[i]            // AI側は固定
    })
  }
  return card
}
```

**対抗戦の結果:**

| 勝ち越し | 効果 |
|---------|------|
| プレイヤー勝ち越し | 団体人気+5 🔧、出場選手の人気+3 🔧、ボーナス収入 |
| 引き分け | 団体人気+2 🔧 |
| プレイヤー負け越し | 団体人気-2 🔧 |

### §9.3 挑戦状（因縁の1戦）

トラブルをきっかけに発生する小規模イベント。

| トリガー | 発生確率 🔧 |
|---------|:----------:|
| レンタル中に選手が怪我 | 50% |
| 引き抜きが成功した | 30% |
| 引き抜きを拒否された | 20% |

| 項目 | 仕様 |
|------|------|
| 試合数 | 1試合のみ |
| 形式 | 通常の定期興行のメインイベントに組み込む |
| 対戦カード | トリガーに関連する選手同士（or 両団体のエース） |
| MQボーナス | +10 🔧（因縁補正で盛り上がりやすい） |

### §9.4 頂上決戦

ゲーム後半に発生する、クリアに向けた大一番。

| 項目 | 仕様 |
|------|------|
| 発生条件 | プレイヤー団体がランキング2位以上 かつ PPV開催時 |
| 形式 | PPVのメインイベントに、他団体チャンプとの1戦を追加 |
| 対戦 | プレイヤーのエース vs 1位団体のエース |
| 勝利効果 | 団体人気+10 🔧、org-ratingにボーナス+15（次シーズン末まで）🔧 |
| 敗北効果 | なし（ペナルティは与えない。挑戦自体が名誉） |

```javascript
function checkApexMatch(playerOrg, rankings) {
  if (playerOrg.rank > 2) return false
  if (!isPPVWeek()) return false

  let topAI = rankings[0]
  if (topAI === playerOrg) return false

  return presentApexMatchOption(topAI)  // プレイヤーに挑戦するか選択させる
}
```

### §9.5 AI選手の試合処理

抗争イベントではAI選手がバトルエンジンで実際に戦う。

| 項目 | 仕様 |
|------|------|
| 能力値 | 実データをそのまま使用 |
| コンディション | 一律80（万全）として扱う 🔧 |
| 怪我 | 発生しない（イベント戦のため） 🔧 |
| MQ計算 | 通常通り |
| 成長 | 試合成長は発生しない（AI側もプレイヤー側も） |

---

## §10 org-rating算出方式の変更

### §10.1 AI団体の評価値

org-ranking-spec §5.2 の簡易変動モデル（±15ランダム＋基準値回帰）を**廃止**。AI団体も実データからプレイヤー団体と同じ計算式で算出する。

```javascript
// 全団体共通（org-ranking-spec §1 そのまま）
orgRating = championScore + starPowerScore + totalPopScore
```

AI団体のchampionScoreは各ティアの固定値（§10.2）を使用。

### §10.2 AI団体のchampionScore

title-system-spec §8.3 で定義済みの暫定値をそのまま使用。

| AI団体 | ティア | championScore 🔧 |
|--------|:-----:|:----------------:|
| EMPRESS | S | 60 |
| NOVA | A | 40 |
| CRESCENT | B | 20 |

> AI団体のタイトルシステムは簡略化し、この固定値を用いる。
> AI団体間でのタイトル移動は管理しない。

---

## §11 初期資金の変更

economy-system-spec §7.1 の初期資金を変更。

| 項目 | 旧値 | 新値 |
|------|:----:|:----:|
| プレイヤー団体の初期資金 | 3,000万 | **5,000万** 🔧 |

**設計意図**: 初回プレイで経営感覚がなくても、1シーズン目で即ゲームオーバーにならない余裕を持たせる。

---

## §12 確定事項

| # | 項目 | 決定 |
|---|------|------|
| 1 | AI団体数 | 3団体（S/A/B級） |
| 2 | 団体名 | EMPRESS GRAND / NOVA IMPACT / CRESCENT RISE |
| 3 | 初期ロスター | プレイヤー5〜6名、S級15〜18名、A級12〜14名、B級8〜10名 |
| 4 | 未登場プール | 登場年齢に達するとスカウト候補として出現 |
| 5 | AI選手のデータ | 能力値フルセット保持。trainCapは団体所属時に生成 |
| 6 | シーズン末一括処理 | 加齢→衰退→成長→人気→引退→スカウト→移籍→rating再計算 |
| 7 | 衰退・引退 | training-spec / scout-spec と同じルールをそのまま適用 |
| 8 | org-rating | 簡易変動モデル廃止。実データから同一計算式で算出 |
| 9 | エース認定 | 1名のみ。引き留め金で100%残留 |
| 10 | 非エースの引き留め | 引き留め金を払っても80%。失敗時は金が戻らず、移籍金は入る |
| 11 | 引き抜き上限 | プレイヤーからAI選手を年1名まで |
| 12 | レンタル | 4週間固定、1名まで。Overall 3位以下が対象 |
| 13 | 対抗戦 | 年1回30%で発生。ランキング隣接団体と3〜5試合 |
| 14 | 挑戦状 | トラブルトリガー。因縁の1戦 |
| 15 | 頂上決戦 | ランキング2位以上＋PPV時。1位団体エースに挑戦 |
| 16 | 難易度 | なし（単一バランス） |
| 17 | 初期資金 | 5,000万に変更 |

---

## §13 未確定事項（フェーズ4〜実装時に要設計）

- [ ] 既存80名の具体的な団体配分（キャラデータ確認後に作業）
- [ ] 未登場プール選手の登場年齢の個別設定
- [ ] AI団体の所属選手の初期人気値設定
- [ ] 抗争イベントの演出詳細（フェーズ4 ⑪）
- [ ] エース認定のUI演出
- [ ] レンタル怪我時の抗争トリガー演出
- [ ] AI団体のchampionScoreの動的変化（タイトル移動のシミュレーション）

---

## §14 他spec反映メモ

本spec確定に伴い、以下の既存specに反映が必要。

| 対象spec | 反映内容 |
|---------|---------|
| org-ranking-spec §5.2 | 簡易変動モデル（±15ランダム＋回帰）を廃止。「rival-org-spec §10 に移行」の注記を追加 |
| org-ranking-spec §5.3 | 未確定事項の消し込み（AI団体名称・設定・選手・交流・評価値ロジック → 本specで確定） |
| economy-system-spec §7.1 | 初期資金を3,000万 → 5,000万に変更 |
| training-system-spec §1.4 | trainCap生成タイミングを「ニューゲーム開始時に全選手」→「団体所属時に生成」に修正 |
| scout-system-spec §5.2 | 競合の行き先「他団体に加入（70%）」の管理方法として「rival-org-spec §5 参照」を追記 |
| scout-system-spec §12 | 未確定事項「他団体に流出した選手の管理」を消し込み |
| weekly-gameloop-spec §5.5 | レンタルシステムの詳細として「rival-org-spec §8 参照」を追記 |
| weekly-gameloop-spec §1.3 | 年間イベントカレンダーに「引き抜きウィンドウ（オフシーズン第3週）」「対抗戦（Q2末/Q3末）」を追加 |

---

## §15 システム連携サマリー

```
┌──────────────────────────────────────────────────────┐
│                    シーズン末一括処理                    │
│                                                        │
│  1. 加齢 (+1歳)                                        │
│  2. 衰退判定 (training-spec §5.3〜5.4 そのまま)         │
│  3. 成長処理 (48週一括。同じ公式、シーズンブレ1回)        │
│  4. 人気変動 (Overall×0.7 + tierBonus → 30%収束)        │
│  5. 引退判定 (scout-spec §7 そのまま)                   │
│  6. AIスカウト (方針別。プレイヤー競合と統合)             │
│  7. AI間移籍 (上位が下位のトップを10%で引き抜き)         │
│  8. org-rating再計算 (実データから。簡易変動モデル廃止)    │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                  オフシーズン第3週                       │
│                  引き抜きウィンドウ                      │
│                                                        │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ プレイヤー→AI選手獲得  │  │ AI団体→プレイヤー選手流出 │  │
│  │ 年1名まで             │  │ 人気50以上が対象          │  │
│  │ 移籍金支払い          │  │ 15%/選手/シーズン         │  │
│  └─────────────────────┘  └─────────────────────────┘  │
│                                                        │
│  エース認定（1名）→ 引き留め100%                         │
│  非エース → 引き留め80%（失敗時：金戻らず、移籍金入る）   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                   団体間抗争イベント                     │
│                                                        │
│  対抗戦（年1回30%）→ 3〜5試合。勝ち越しで人気UP         │
│  挑戦状（トラブルトリガー）→ 因縁の1戦。MQ+10            │
│  頂上決戦（ランキング2位+PPV）→ エースvsエース           │
│                                                        │
│  AI選手は能力値フルデータで戦闘。バトルエンジン使用       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                    他団体レンタル                        │
│                                                        │
│  いつでも申請可。4週間固定、1名まで                      │
│  Overall 3位以下が対象。成長なし。怪我あり               │
└──────────────────────────────────────────────────────┘
```

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-02-19 | v1.0 初版。AI団体3つ（EMPRESS/NOVA/CRESCENT）、半具体管理、エース認定、引き抜き・レンタル・抗争イベント、初期資金5,000万で設計 |

<!-- 再同期: 2026-04-05, 指示書: docs/specs-resync-instruction.md -->
