# 🔄 人気＋会場・経済 再設計 実装仕様書 v1.0b

> **ステータス**: 📋 実装待ち（Keisukeレビュー後に着手）
> **作成日**: 2026-02-23
> **前提**: v1_0b-popularity-venue-redesign.md（設計引き継ぎ書）
> **依存**: mq-popularity-spec-v1.0.md / economy-system-spec-v1_0.md / weekly-gameloop-spec-v1_0.md
> **対象バージョン**: v1.0a → v1.0b
> **影響ファイル**: engine.js, data.js, app.js, ui-render.js, ui-common.js

---

## 目次

1. [変更の全体像](#1-変更の全体像)
2. [§A 人気上昇の再設計](#a-人気上昇の再設計)
3. [§B 人気下落システム](#b-人気下落システム)
4. [§C 会場・集客の再設計](#c-会場集客の再設計)
5. [§D グッズ収入の再設計](#d-グッズ収入の再設計)
6. [§E 満員率ボーナス](#e-満員率ボーナス)
7. [§F データ定義の変更](#f-データ定義の変更)
8. [§G 影響範囲と移行処理](#g-影響範囲と移行処理)
9. [§H 実装順序](#h-実装順序)
10. [§I バランス検証シナリオ](#i-バランス検証シナリオ)

---

## 1. 変更の全体像

### 1.1 現行の問題サマリー

| 問題 | 原因 | 影響 |
|------|------|------|
| 全選手が人気100に到達 | 減衰カーブなし＋下落なし | 人気差が生まれない→戦略性ゼロ |
| 大会場ほどコスパが良い | 費用×100なのに収入×400 | 会場選択に悩みがない |
| グッズが来場者と無関係 | 上位3名×2の固定式 | 26人でも5000人でも同額 |
| 集客がキャパ依存 | `orgPop/100 × cap × 0.8` | 大箱のガラガラ＞小箱の満員 |

### 1.2 解決アプローチ

```
【Before】
  人気: 上がるだけ → 全員100
  会場: 大箱＝正義 → 選択不要
  グッズ: 固定額 → 序盤グッズ92%

【After】
  人気: 減衰カーブ＋5種の下落要素 → 差が生まれる
  会場: リスク比例＋集客キャパ非依存 → 身の丈選び
  グッズ: 来場者×人気 → スケールする
```

---

## §A 人気上昇の再設計

### A-1. 減衰カーブ関数（新規追加）

**設計引き継ぎ書 案B（急カーブ）を採用。**

```javascript
// engine.js に新規追加
// 人気帯に応じた上昇量の倍率を返す
Engine.popularity = {
  getDiminishingMultiplier(currentPop) {
    if (currentPop < 20) return 1.0;
    if (currentPop < 35) return 0.6;
    if (currentPop < 50) return 0.35;
    if (currentPop < 65) return 0.18;
    if (currentPop < 80) return 0.13;
    return 0.10; // 80〜99
  },

  // rawGain: 減衰適用前の人気上昇量
  // currentPop: 現在の人気値
  // returns: 減衰適用後の実効上昇量（整数、最低0）
  applyDiminishing(rawGain, currentPop) {
    if (rawGain <= 0) return rawGain; // マイナスには減衰を適用しない
    const mult = Engine.popularity.getDiminishingMultiplier(currentPop);
    return Math.max(0, Math.round(rawGain * mult));
  }
};
```

**テーブル形式（設計引き継ぎ書確定値）：**

| 現在人気帯 | 倍率 | rawGain +5 → 実効 | rawGain +10 → 実効 |
|:----------:|:----:|:------------------:|:-------------------:|
| 0〜19 | ×1.0 | +5 | +10 |
| 20〜34 | ×0.6 | +3 | +6 |
| 35〜49 | ×0.35 | +2 | +4 |
| 50〜64 | ×0.18 | +1 | +2 |
| 65〜79 | ×0.13 | +1 | +1 |
| 80〜99 | ×0.10 | +1 | +1 |

**重要**: 下落（マイナス値）には減衰を適用しない。人気80で-10なら-10そのまま。

### A-2. 試合後の人気変動（改修）

**現行コード（engine.js L1630-1643）を置換：**

```javascript
// 【Before】 engine.js L1634
let popDelta = result.mq >= 70 ? 3 : result.mq >= 50 ? 2 : result.mq >= 30 ? 1 : 0;

// 【After】 MQベースの生の上昇量を計算 → 減衰カーブを適用
applyMQPopularity(roster, result) {
  return roster.map(c => {
    const isLeft = c.id === result.left.id;
    const isRight = c.id === result.right.id;
    if (!isLeft && !isRight) return c;

    // ① MQベースの基本変動値（mq-popularity-spec §2.4 準拠）
    let rawGain;
    if (result.mq >= 90)      rawGain = 8;
    else if (result.mq >= 75) rawGain = 6;
    else if (result.mq >= 60) rawGain = 4;
    else if (result.mq >= 40) rawGain = 2;
    else if (result.mq >= 20) rawGain = 0;
    else                      rawGain = -2; // 凡戦ペナルティ

    // ② 勝敗ボーナス
    const isWinner = (isLeft && result.winner === 'left') || (isRight && result.winner === 'right');
    const isLoser = !isWinner && result.winner !== 'draw';
    if (isWinner) rawGain += 2;
    if (isLoser) rawGain -= 1;

    // ③ 番狂わせ補正
    const ownOvr = Engine.util.ov(c);
    const oppId = isLeft ? result.right.id : result.left.id;
    const opp = roster.find(f => f.id === oppId);
    if (isWinner && opp && ownOvr < Engine.util.ov(opp) - 15) {
      rawGain += 3;
    }

    // ④ カード位置補正
    const slotMult = (result.slot === 'main') ? 1.5
                   : (result.slot === 'semi') ? 1.2 : 1.0;
    rawGain = Math.round(rawGain * slotMult);

    // ⑤ トレイト補正（ヒール適性）
    if (Traits.has(c, 'ヒール適性') && (c.role === 'Heel' || c.role === 'Dirty') && result.mq >= 40) {
      rawGain += 1;
    }

    // ⑥ 減衰カーブ適用（正のゲインのみ）
    const effectiveGain = rawGain > 0
      ? Engine.popularity.applyDiminishing(rawGain, c.popularity)
      : rawGain; // 負の値はそのまま

    // ⑦ 試合結果の記録（連敗トラッキング用 — §B-1で使用）
    const lastMatchResult = isWinner ? 'win' : (result.winner === 'draw' ? 'draw' : 'loss');

    const newPop = Engine.util.clamp(c.popularity + effectiveGain, 0, 100);
    return { ...c, popularity: newPop, lastMatchResult };
  });
},
```

### A-3. プロモによる人気変動（改修）

**現行コード（engine.js L1382）を置換：**

```javascript
// 【Before】
nc.popularity = Math.min(100, nc.popularity +
  Math.floor(1 + Engine.rng.float(rng) * 2) +
  Engine.coach.getPopBonusForChar(stateForCalc, nc.id) +
  Engine.facility.getPromoBonus(G));

// 【After】 減衰カーブ＋popCap適用
} else if (action === 'promo') {
  const basePromo = Math.floor(1 + Engine.rng.float(rng) * 2); // 1〜2
  const coachBonus = Engine.coach.getPopBonusForChar(stateForCalc, nc.id);
  const facilityBonus = Engine.facility.getPromoBonus(G);
  const rawGain = basePromo + coachBonus + facilityBonus;
  const popCap = 40; // プロモだけでは40が上限（mq-popularity-spec §2.5）
  const effectiveGain = Engine.popularity.applyDiminishing(rawGain, nc.popularity);
  nc.popularity = Math.min(popCap, Math.min(100, nc.popularity + effectiveGain));
  // ...
}
```

### A-4. 王座戴冠・防衛の人気変動（改修）

**現行コード（engine.js L533, L550）を改修：**

```javascript
// 【Before】crownChampion (L533)
return { ...c, popularity: Math.min(100, c.popularity + 5), ...reassessed };

// 【After】減衰カーブ適用
const titleGain = Engine.popularity.applyDiminishing(5, c.popularity);
return { ...c, popularity: Math.min(100, c.popularity + titleGain), ...reassessed };

// 【Before】recordDefense (L550)
let updated = { ...c, popularity: Math.min(100, c.popularity + 2) };

// 【After】減衰カーブ適用
const defenseGain = Engine.popularity.applyDiminishing(2, c.popularity);
let updated = { ...c, popularity: Math.min(100, c.popularity + defenseGain) };
```

---

## §B 人気下落システム

5つの下落要素を新規実装する。すべて `Engine.popularity` 名前空間に集約。

### B-1. 連敗ペナルティ

**GameStateに追加するフィールド：**
```javascript
// 各選手オブジェクトに追加
fighter.losingStreak = 0; // 連敗カウンター（初期値0）
```

**ロジック（engine.js `applyMQPopularity` 内で更新）：**
```javascript
Engine.popularity.checkLosingStreak(fighter, isWinner) {
  if (isWinner || fighter.lastMatchResult === 'draw') {
    return { losingStreak: 0, popPenalty: 0, msg: null }; // リセット
  }
  const newStreak = (fighter.losingStreak || 0) + 1;
  let popPenalty = 0;
  let msg = null;

  if (newStreak === 3) {
    popPenalty = -5;
    msg = `${fighter.name}に陰り…ファンの声援が減り始めた`;
  } else if (newStreak === 5) {
    popPenalty = -10;
    msg = `${fighter.name}の低迷が深刻化…会場からため息が漏れる`;
  } else if (newStreak === 7) {
    popPenalty = -15;
    msg = `${fighter.name}への失望感が広がる…かつての声援はどこへ`;
  }
  // 7以降は追加発動なし（7で-15が最大）

  return { losingStreak: newStreak, popPenalty, msg };
}
```

**発動タイミング**: 3/5/7到達時に一発のみ（毎試合ではない）。勝利でカウンターリセット。

| 連敗数 | 発動 | 人気低下 | テキスト |
|:------:|:----:|:-------:|---------|
| 3 | 1回 | -5 | 「○○に陰り…」 |
| 5 | 1回 | -10 | 「○○の低迷が深刻化…」 |
| 7+ | 1回 | -15 | 「○○への失望感が広がる…」 |

### B-2. スキャンダル（ランダムイベント）

```javascript
Engine.popularity.checkScandal(rng, fighter, isAce) {
  // 条件: 人気40以上のみ対象
  if ((fighter.popularity || 0) < 40) return null;

  // 基本確率: 0.5%/週
  let chance = 0.005;
  // エースは発生率半減
  if (isAce) chance *= 0.5;

  if (Engine.rng.float(rng) >= chance) return null;

  // 発生: -20〜-35のランダム幅
  const penalty = -(20 + Engine.rng.int(rng, 0, 15));
  const newPop = Math.max(0, fighter.popularity + penalty);

  // テキストバリエーション
  const texts = [
    `📰 週刊誌にスクープが…${fighter.name}のスキャンダルが報じられた`,
    `📱 ${fighter.name}がSNSで炎上騒動…ファンの間に動揺が広がる`,
    `⚠️ ${fighter.name}の素行問題が発覚…団体イメージにも影響か`,
  ];
  const msg = texts[Engine.rng.int(rng, 0, texts.length - 1)];

  return { newPop, penalty, msg };
}
```

**発動タイミング**: `processWeeklyEvents`（毎週処理）内でロスター全員を判定。

| パラメータ | 値 |
|-----------|---|
| 週発生率 | 0.5% |
| 対象 | 人気40以上 |
| ペナルティ | -20〜-35 |
| エース | 発生率半減（0.25%） |
| 年間個人確率 | 約21% |
| ロスター中誰か（人気40+が4人時） | 年約60% |

### B-3. 怪我中の忘却

```javascript
Engine.popularity.applyInjuryDecay(fighter) {
  if (!fighter.injury || fighter.injury <= 0) return fighter;
  // 毎週-1。下限は元の人気の半分
  const floor = Math.max(0, Math.floor(fighter.preInjuryPop * 0.5));
  const newPop = Math.max(floor, fighter.popularity - 1);
  return { ...fighter, popularity: newPop };
}
```

**GameStateに追加するフィールド：**
```javascript
fighter.preInjuryPop = null; // 怪我発生時に記録。回復時にnullクリア
```

**発動タイミング**: 怪我発生時に `preInjuryPop` を記録 → 毎週処理で `-1` → 回復時にクリア。

| パラメータ | 値 |
|-----------|---|
| 減衰量 | -1/週 |
| 下限 | 怪我前人気の50% |
| 4週怪我 | -4 |
| 12週大怪我 | -12（下限で停止） |

### B-4. メインイベント凡戦ペナルティ

```javascript
Engine.popularity.checkMainEventPenalty(result) {
  // メインイベントの試合のみ対象
  if (result.slot !== 'main') return null;

  let penalty = 0;
  if (result.mq < 25)      penalty = -5;
  else if (result.mq < 35) penalty = -3;
  else if (result.mq < 45) penalty = -1;
  else return null; // MQ45以上はペナルティなし

  return { penalty }; // 両選手に適用
}
```

**発動タイミング**: `applyMQPopularity` 内。メイン枠の試合結果に対してのみ。

| MQ | 人気低下 | 対象 |
|:--:|:-------:|------|
| < 25 | -5 | メイン両選手 |
| 25〜34 | -3 | メイン両選手 |
| 35〜44 | -1 | メイン両選手 |
| 45+ | なし | — |

### B-5. 移籍時の人気リセット

```javascript
Engine.popularity.applyTransferReset(fighter) {
  // 移籍した選手は人気を75%に減算
  const newPop = Math.max(1, Math.round(fighter.popularity * 0.75));
  return { ...fighter, popularity: newPop };
}
```

**発動タイミング**: 
- 自団体への入団時（FA契約・交渉成功・レンタル獲得）
- AI団体間の移籍時

| パラメータ | 値 |
|-----------|---|
| 係数 | ×0.75 |
| 例 | 人気60 → 45 |
| 下限 | 1 |

---

## §C 会場・集客の再設計

### C-1. 新会場データ

**設計原則（引き継ぎ書B-3確定）：**
1. チケット単価は全会場統一
2. 集客は会場に依存しない（団体力＋カード力）
3. 大会場ほどリスクが大きい（会場費がキャパに比例）
4. 各フェーズに「ちょうどいい会場」がある

```javascript
// data.js — VENUES の完全置換
const VENUES = [
  { name: '公民館',   cap: 150,   cost: 5,    popReq: 0  },
  { name: '小ホール', cap: 400,   cost: 60,   popReq: 15 },
  { name: '市民会館', cap: 1000,  cost: 180,  popReq: 30 },
  { name: '中ホール', cap: 2500,  cost: 500,  popReq: 45 },
  { name: 'アリーナ', cap: 6000,  cost: 1400, popReq: 60 },
  { name: '大会場',   cap: 12000, cost: 3200, popReq: 75 },
  { name: 'ドーム',   cap: 30000, cost: 9000, popReq: 90 },
];

// チケット単価は全会場統一（新規定数）
const TICKET_PRICE = 0.5; // 万円/人（5,000円）
```

**設計根拠（コスパ均一化の検証）：**

| 会場 | キャパ | 費用(万) | 費用/席(万) | 満員収入(万) | 満員利益率 |
|------|:------:|:--------:|:----------:|:-----------:|:---------:|
| 公民館 | 150 | 5 | 0.033 | 75 | 93% |
| 小ホール | 400 | 60 | 0.150 | 200 | 70% |
| 市民会館 | 1,000 | 180 | 0.180 | 500 | 64% |
| 中ホール | 2,500 | 500 | 0.200 | 1,250 | 60% |
| アリーナ | 6,000 | 1,400 | 0.233 | 3,000 | 53% |
| 大会場 | 12,000 | 3,200 | 0.267 | 6,000 | 47% |
| ドーム | 30,000 | 9,000 | 0.300 | 15,000 | 40% |

- 席あたり費用が大きくなるほど高い → **大箱ほどリスク大**（公民館は例外的に安い＝序盤救済）
- 満員時利益率は公民館93%→ドーム40% → **小箱のほうが安定**
- ドームで利益を出すには集客力が必須 → 会場選択の戦略性

**損益分岐点：**

| 会場 | 損益分岐点 |
|------|:---------:|
| 公民館 | 7% (10人) |
| 小ホール | 30% (120人) |
| 市民会館 | 36% (360人) |
| 中ホール | 40% (1,000人) |
| アリーナ | 47% (2,800人) |
| 大会場 | 53% (6,400人) |
| ドーム | 60% (18,000人) |

→ **ドームは6割入らないと赤字**。これが「満員の小箱 vs ガラガラの大箱」のジレンマを生む。

### C-2. 集客計算の全面刷新

**設計原則**: 集客は「来る客の数」を先に計算し、会場は「箱のサイズ」を決めるだけ。

```javascript
Engine.economy.calcAttendance(G, venueIdx, mainCardPop, hasTitleMatch) {
  const v = VENUES[venueIdx];

  // ① ベース集客（団体人気から算出。会場キャパに依存しない）
  //    orgPop 0→0人、orgPop 50→700人、orgPop 100→5000人
  //    二次関数で高人気ほど加速
  const baseAttendance = Math.round(
    (G.orgPop / 100) * (G.orgPop / 100) * 5000
  );

  // ② カード補正（メイン選手の個人人気合計を直接反映）
  const cardBonus = Math.round(mainCardPop * 3);

  // ③ Heat補正
  const heatMult = Engine.heat.getMult(G);

  // ④ タイトルマッチ補正
  const titleMult = hasTitleMatch ? 1.15 : 1.0;

  // ⑤ トレイト「華」補正
  const charismaMult = (G.roster && G.roster.some(
    c => Traits.has(c, '華') && !c.injury
  )) ? 1.05 : 1.0;

  // ⑥ 生の集客数（会場キャパでクランプ）
  const rawAttendance = Math.round(
    (baseAttendance + cardBonus) * heatMult * titleMult * charismaMult
  );

  // ⑦ 最低保証集客（キャパの5%）
  const minAttendance = Math.max(10, Math.round(v.cap * 0.05));

  return Engine.util.clamp(rawAttendance, minAttendance, v.cap);
}
```

**集客シミュレーション（Heat: NEUTRAL, mainPop=30, タイトルなし）：**

| orgPop | ベース集客 | カード補正 | 合計 | 適正会場 |
|:------:|:---------:|:---------:|:----:|:--------:|
| 5 | 13 | 90 | 103 | 公民館(150) |
| 15 | 113 | 90 | 203 | 小ホール(400) |
| 25 | 313 | 90 | 403 | 小ホール〜市民会館 |
| 40 | 800 | 90 | 890 | 市民会館(1000) |
| 55 | 1,513 | 90 | 1,603 | 中ホール(2500) |
| 70 | 2,450 | 90 | 2,540 | 中ホール〜アリーナ |
| 85 | 3,613 | 90 | 3,703 | アリーナ(6000) |
| 95 | 4,513 | 90 | 4,603 | アリーナ〜大会場 |

**Heat＋好カードの影響（orgPop 50 時）：**

| Heat | mainPop | 合計集客 | 備考 |
|:----:|:-------:|:-------:|------|
| NEUTRAL(×1.0) | 30 | 1,340 | 基本 |
| WARM(×1.2) | 60 | 1,716 | Heat重要 |
| HOT(×1.5) | 100 | 2,325 | 中ホールが埋まる |
| ON_FIRE(×2.0) | 150 | 3,400 | アリーナに挑戦可 |

### C-3. 目標ゲーム体験との整合

| フェーズ | orgPop目安 | 適正会場 | 経営状態 |
|:--------:|:---------:|:--------:|---------|
| S1前半 | 5〜15 | 公民館 | 赤字だが破産しない |
| S1後半 | 15〜25 | 小ホール | トントン〜微黒字 |
| S2 | 25〜45 | 市民会館〜中ホール | 安定黒字 |
| S3〜4 | 45〜70 | 中ホール〜アリーナ | 成長期、会場選択が楽しい |
| S5+ | 70〜90 | アリーナ〜大会場 | 大箱チャレンジ |
| S7+ | 90+ | ドーム | 到達感 |

---

## §D グッズ収入の再設計

### D-1. 新計算式

```javascript
Engine.economy.calcShowRevenue(roster, venueIdx, attendance) {
  const v = VENUES[venueIdx];

  // ① チケット収入（統一単価 × 来場者数）— 満員率ボーナスは§Eで別途適用
  const ticketRev = Math.round(attendance * TICKET_PRICE);

  // ② グッズ収入（来場者数 × グッズ単価 × ロスター人気スコア / 100）
  const GOODS_PRICE = 0.08; // グッズ単価（万/人）= 800円
  const rosterPopScore = Engine.popularity.calcRosterPopScore(roster);
  let goodsRev = Math.round(attendance * GOODS_PRICE * rosterPopScore / 100);

  return { ticketRev, goodsRev, venueCost: v.cost };
}
```

### D-2. ロスター人気スコア

```javascript
Engine.popularity.calcRosterPopScore(roster) {
  // 加重平均: 人気が高い選手ほど貢献度が大きい
  // 上位1名: ×3、2-3位: ×2、それ以外: ×1
  const healthy = roster.filter(c => !c.injury);
  if (healthy.length === 0) return 0;

  const sorted = [...healthy].sort((a, b) => b.popularity - a.popularity);
  let weightedSum = 0;
  let totalWeight = 0;

  sorted.forEach((c, i) => {
    let weight = 1;
    if (i === 0) weight = 3;
    else if (i < 3) weight = 2;

    let contrib = c.popularity * weight;
    // 華: グッズ貢献×1.3
    if (Traits.has(c, '華')) contrib *= 1.3;
    // ファンサービス: グッズ貢献×1.2
    if (Traits.has(c, 'ファンサービス')) contrib *= 1.2;
    // ヒール適性 + Heel: +20%
    if (Traits.has(c, 'ヒール適性') && (c.role === 'Heel' || c.role === 'Dirty')) contrib *= 1.2;

    weightedSum += contrib;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}
```

### D-3. グッズ収入シミュレーション

| シナリオ | 来場者 | 人気スコア | グッズ収入(万) |
|---------|:------:|:---------:|:------------:|
| 序盤: 100人、平均人気10 | 100 | 10 | 1 |
| S1末: 200人、エース人気30 | 200 | 25 | 4 |
| 中盤: 1000人、エース人気50 | 1,000 | 45 | 36 |
| 成長期: 3000人、エース人気70 | 3,000 | 60 | 144 |
| 終盤: 8000人、エース人気85 | 8,000 | 75 | 480 |

→ 序盤はグッズがほぼゼロ、成長とともに自然にスケール。

---

## §E 満員率ボーナス

### E-1. 満員率の計算

```javascript
Engine.economy.calcOccupancyRate(attendance, venueCap) {
  return attendance / venueCap;
}
```

### E-2. 満員率ボーナステーブル

```javascript
// data.js に新規追加
const OCCUPANCY_BONUS = [
  { min: 0.95, ticketMult: 1.5, label: '🔥 超満員！プレミア', heatDelta: +2 },
  { min: 0.80, ticketMult: 1.2, label: '✨ 大入り！',       heatDelta: +1 },
  { min: 0.60, ticketMult: 1.0, label: '👍 盛況',          heatDelta: 0  },
  { min: 0.40, ticketMult: 0.85,label: '➖ まずまず',       heatDelta: 0  },
  { min: 0.25, ticketMult: 0.7, label: '😟 空席目立つ…',    heatDelta: -1 },
  { min: 0.0,  ticketMult: 0.5, label: '😰 ガラガラ…',      heatDelta: -2 },
];
```

### E-3. 適用ロジック

```javascript
Engine.economy.applyOccupancyBonus(attendance, venueCap, ticketRev) {
  const rate = attendance / venueCap;
  const bonus = OCCUPANCY_BONUS.find(b => rate >= b.min);

  return {
    adjustedTicketRev: Math.round(ticketRev * bonus.ticketMult),
    heatDelta: bonus.heatDelta,
    label: bonus.label,
    rate: Math.round(rate * 100),
  };
}
```

**発動タイミング**: `processSettlement` 内で、チケット収入計算後に適用。heatDeltaはHeat更新時に加算。

### E-4. 満員率ボーナスのシミュレーション

| 状況 | 集客 | 会場 | 集客率 | チケット基本 | 倍率 | 調整後 | 利益 |
|------|:----:|:----:|:-----:|:----------:|:----:|:------:|:----:|
| 公民館満員 | 150 | 150 | 100% | 75 | ×1.5 | 113 | +108 |
| 小ホール8割 | 320 | 400 | 80% | 160 | ×1.2 | 192 | +132 |
| アリーナ半分 | 3000 | 6000 | 50% | 1500 | ×0.85 | 1275 | -125 |
| ドーム2割 | 6000 | 30000 | 20% | 3000 | ×0.5 | 1500 | -7500 |

→ **「満員の公民館（+108万）」vs「半分のアリーナ（-125万）」** — 小箱のほうが得な状況が生まれる。

---

## §F データ定義の変更

### F-1. data.js の変更一覧

| 項目 | Before | After |
|------|--------|-------|
| `VENUES` | 6会場、ticket個別 | 7会場、ticket削除 |
| `TICKET_PRICE` | なし | `0.5`（新規定数） |
| `OCCUPANCY_BONUS` | なし | 6段階テーブル（新規） |
| `GOODS_PRICE` | なし | `0.08`（新規定数） |

### F-2. 選手オブジェクトの追加フィールド

| フィールド | 型 | 初期値 | 用途 |
|-----------|:---:|:------:|------|
| `losingStreak` | number | 0 | 連敗カウンター（§B-1） |
| `preInjuryPop` | number\|null | null | 怪我前人気（§B-3） |

### F-3. 既存関数の変更サマリー

| 関数 | ファイル | 変更内容 |
|------|---------|---------|
| `Engine.economy.calcAttendance` | engine.js | 全面書き換え（§C-2） |
| `Engine.economy.calcShowRevenue` | engine.js | グッズ計算変更（§D-1） |
| `Engine.applyMQPopularity` | engine.js | 減衰カーブ＋連敗＋ME凡戦（§A-2, §B-1, §B-4） |
| プロモ処理 | engine.js L1381-1384 | 減衰カーブ＋popCap（§A-3） |
| `Engine.title.crownChampion` | engine.js | 減衰カーブ適用（§A-4） |
| `Engine.title.recordDefense` | engine.js | 減衰カーブ適用（§A-4） |
| `Engine.injury.check` | engine.js | `preInjuryPop`記録（§B-3） |
| 週間処理 | engine.js | 怪我忘却＋スキャンダル判定（§B-2, §B-3） |
| 移籍処理 | engine.js | 人気リセット追加（§B-5） |

### F-4. 新規関数の追加サマリー

| 関数 | 名前空間 | 用途 |
|------|---------|------|
| `getDiminishingMultiplier` | `Engine.popularity` | 減衰倍率テーブル参照 |
| `applyDiminishing` | `Engine.popularity` | 減衰適用（rawGain→effective） |
| `checkLosingStreak` | `Engine.popularity` | 連敗判定 |
| `checkScandal` | `Engine.popularity` | スキャンダル判定 |
| `applyInjuryDecay` | `Engine.popularity` | 怪我中忘却 |
| `checkMainEventPenalty` | `Engine.popularity` | ME凡戦判定 |
| `applyTransferReset` | `Engine.popularity` | 移籍リセット |
| `calcRosterPopScore` | `Engine.popularity` | ロスター人気スコア |
| `applyOccupancyBonus` | `Engine.economy` | 満員率ボーナス |

---

## §G 影響範囲と移行処理

### G-1. AI団体への波及

AI団体も同じ経済計算を使っている。以下を確認・修正する：

| 対象 | 影響 | 対応 |
|------|------|------|
| AI集客計算 | `calcAttendance`を使っている | 同じ関数なので自動的に適用される |
| AI会場選択 | VENUESのpopReqで選択 | 新テーブルのpopReqで自動対応 |
| AI選手人気 | `Engine.ai.simulateSeason`で独自計算 | 減衰カーブ適用は不要（AI側はpopConvergeRateで別管理） |
| AI経済 | AI団体は経済シミュレーションを簡略化 | `calcShowRevenue`変更は自動反映 |

### G-2. ランキング計算への影響

```javascript
// engine.js L824 付近 — STAR_POWERテーブル
for (const t of STAR_POWER) { if (f.popularity >= t.minPop) return score + t.points; }
```

人気の平均値が下がるため、ランキングの人気ボーナスのしきい値を調整：

| 現行 | 新 |
|------|---|
| 人気70+ → +15pt | 人気50+ → +15pt |
| 人気50+ → +10pt | 人気35+ → +10pt |
| 人気30+ → +5pt | 人気20+ → +5pt |

### G-3. 移籍金計算への影響

```javascript
// engine.js L1673
const popBonus = fighter.popularity * 10;
```

人気の平均値が下がるため、移籍金に占める人気の比重を上げる：

```javascript
// 【After】
const popBonus = fighter.popularity * 15; // ×10 → ×15
```

### G-4. 既存セーブデータの移行

```javascript
// app.js のロード処理に追加
function migrateToV1_0b(state) {
  // 1. 選手オブジェクトに新フィールド追加
  state.roster = state.roster.map(c => ({
    ...c,
    losingStreak: c.losingStreak ?? 0,
    preInjuryPop: c.preInjuryPop ?? (c.injury > 0 ? c.popularity : null),
  }));

  // 2. 人気値を新カーブに合わせてリスケール
  //    現行の「全員100」状態を是正するため、一律に補正
  state.roster = state.roster.map(c => {
    // Overall基準の「あるべき人気帯」と現在値の加重平均を取る
    const ovr = Engine.util.ov(c);
    const targetPop = ovr <= 50 ? 15 : ovr <= 65 ? 30 : ovr <= 80 ? 50 : ovr <= 90 ? 65 : 80;
    const newPop = Math.round(c.popularity * 0.5 + targetPop * 0.5);
    return { ...c, popularity: Engine.util.clamp(newPop, 5, 90) };
  });

  // 3. バージョンフラグ
  state.version = '1.0b';
  return state;
}
```

---

## §H 実装順序

大きな変更のため、段階的に実装し各ステップで動作確認する。

| Step | 内容 | 影響ファイル | 確認項目 |
|:----:|------|-------------|---------|
| **1** | `Engine.popularity` 名前空間＋減衰カーブ関数の追加 | engine.js | 単体テスト：各人気帯でのapplyDiminishing |
| **2** | 試合後人気変動の改修（減衰適用） | engine.js | 試合後のpopDeltaが人気帯に応じて変わる |
| **3** | プロモ人気変動の改修（減衰＋popCap） | engine.js | プロモで人気40超しない、高人気帯で伸びない |
| **4** | 王座関連の減衰適用 | engine.js | 戴冠+5が人気帯で減衰する |
| **5** | 連敗ペナルティ実装 | engine.js | 3/5/7連敗時にイベント発火 |
| **6** | スキャンダル実装 | engine.js | 週処理で低確率発火、イベントテキスト表示 |
| **7** | 怪我中忘却実装 | engine.js | 怪我選手の人気が毎週-1 |
| **8** | ME凡戦ペナルティ実装 | engine.js | メインMQ<45で両選手人気低下 |
| **9** | 移籍リセット実装 | engine.js | 入団時にpop×0.6 |
| **10** | VENUES新テーブル＋TICKET_PRICE定数 | data.js | 会場選択UIに7会場表示 |
| **11** | 集客計算の全面刷新 | engine.js | 各orgPopでの集客数が想定に合致 |
| **12** | グッズ収入の改修 | engine.js | 来場者×人気のスケーリング確認 |
| **13** | 満員率ボーナス実装 | data.js, engine.js | 集客率に応じたラベル＋チケ倍率 |
| **14** | ランキング・移籍金の調整 | engine.js | 新人気帯でのバランス確認 |
| **15** | セーブデータ移行処理 | app.js | 旧セーブが読み込めてフィールド追加される |
| **16** | UI表示の調整 | ui-render.js | 満員率ラベル表示、集客テキスト |
| **17** | 通しバランス検証 | — | §Iの全シナリオ確認 |

---

## §I バランス検証シナリオ

### I-1. 人気成長曲線の検証

**条件**: 新人（初期人気5）、毎週プロモ+2基本。

| 期間 | 週数 | 期待人気 | 確認ポイント |
|------|:----:|:-------:|-------------|
| 半年 | 26 | 25〜30 | popCap=40の手前で減速開始 |
| 1年 | 52 | 40 | プロモだけではここが天井 |
| 2年 | 104 | 40 | それ以上は試合でしか伸びない |

**条件**: 中堅（初期人気30）、2週に1回の試合でMQ55平均（★★+3基本）。

| 期間 | 週数 | 期待人気 | 確認ポイント |
|------|:----:|:-------:|-------------|
| 1年 | 52 | 50〜55 | 50帯の減衰(×0.18)で停滞 |
| 2年 | 104 | 60〜65 | ここから先は名勝負が必要 |
| 5年 | 260 | 75〜80 | 80超えは困難 |

### I-2. 経済バランスの検証

**S1前半（orgPop 10, 選手5人新人中心）:**
```
週支出: 選手50万 + 固定50万 + コーチ40万 = 140万
2週支出: 280万
興行（公民館）: 集客100人程度
  チケット: 100 × 0.5 = 50万 × 満員率ボーナス
  満員率66%（盛況）→ 50万 × 1.0 = 50万
  会場費: -5万
  グッズ: 100 × 0.08 × 10/100 = 1万
  興行利益: 46万
スポンサー: 0万
─────────────
2週収支: 46万 - 280万 = -234万
初期5000万 → 約42週（10ヶ月強）の猶予
```
→ ✅ 「赤字だが破産しない」。公民館のコスト5万で序盤の救済

**S1後半（orgPop 20, 小ホール解放）:**
```
集客: 250人程度（小ホール400キャパ）
  チケット: 250 × 0.5 = 125万
  満員率62%（盛況）→ 125万 × 1.0 = 125万
  会場費: -60万
  グッズ: 250 × 0.08 × 20/100 = 4万
  興行利益: 69万
スポンサー: 20万/週 × 2 = 40万
─────────────
2週収支: 109万 - 280万 = -171万
```
→ ✅ まだ赤字だが改善傾向

**S2中盤（orgPop 40, Heat:WARM, 市民会館）:**
```
集客: 800×1.2(WARM) = 960人（市民会館1000キャパ）
  チケット: 960 × 0.5 = 480万
  満員率96%（超満員！）→ 480 × 1.5 = 720万
  会場費: -180万
  グッズ: 960 × 0.08 × 40/100 = 31万
  興行利益: 571万
スポンサー: 60万/週 × 2 = 120万
─────────────
2週支出: 350万/週 × 2 = 700万
2週収支: 691万 - 700万 = -9万（ほぼトントン）
```
→ ✅ 「トントン〜微黒字」。Heat上げれば黒字化

### I-3. 会場選択のジレンマ検証

**orgPop 55 / mainPop 80 / Heat:HOT の場合:**

| 会場 | 集客 | 満員率 | チケ(倍率込) | 会場費 | グッズ | 利益 |
|------|:----:|:-----:|:----------:|:------:|:-----:|:----:|
| 市民会館 | 1000(上限) | 100% | 750万 | 180万 | 80万 | **650万** |
| 中ホール | 2325 | 93% | 1395万 | 500万 | 186万 | **1081万** |
| アリーナ | 2325 | 39% | 814万 | 1400万 | 186万 | **-400万** |

→ ✅ 中ホールが最適解。アリーナは赤字。市民会館は安全だが利益が低い。**悩むべきポイント**が生まれている。

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-02-23 | v1.0b 初版作成。人気システム再設計＋会場・集客・経済全面刷新の実装仕様確定 |
