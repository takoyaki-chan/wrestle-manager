# 🎪 集客計算リデザイン＋会場熱気MQ補正 仕様書 v1.0

> **ステータス**: 📋 Keisukeレビュー待ち
> **作成日**: 2026-02-23
> **前提**: popularity-venue-redesign-spec-v1.0b.md（現行集客計算 §C-2）
> **依存**: economy-system-spec-v1_0.md / mq-popularity-spec-v1.0.md
> **対象**: v1.0b → v1.0c
> **影響ファイル**: engine.js, data.js, ui-render.js, ui-common.js

---

## 目次

1. [問題の定義](#1-問題の定義)
2. [設計の全体像](#2-設計の全体像)
3. [§A 集客計算の改善（積み上げ方式）](#a-集客計算の改善積み上げ方式)
4. [§B 会場熱気MQボーナス](#b-会場熱気mqボーナス)
5. [§C バランス検証](#c-バランス検証)
6. [§D 影響範囲と変更一覧](#d-影響範囲と変更一覧)
7. [§E テストシナリオ](#e-テストシナリオ)
8. [§F 調整ノブ](#f-調整ノブ)
9. [§G 実装手順](#g-実装手順)

---

## 1. 問題の定義

### 1.1 問題①：「出ない方がマシ」問題

現行の集客計算は全試合の選手人気の**平均**をベースにしている。

```javascript
// 現行（engine.js:1544-1548）
const mainPop = 全試合popの合計 / 試合数;  // ← 平均
const cardBonus = mainPop * 3;
```

| カード構成 | mainPop | cardBonus |
|:--|--:|--:|
| エースA(80) vs B(70) の1試合 | 150 | **450** |
| ＋若手C(10) vs D(5) の2試合目 | 82.5 | **248** ⚠️ 半減 |

若手を追加しただけで集客が激減する。「全員で団体を作っている」テーマに反する。

### 1.2 問題②：会場の雰囲気がMQに反映されない

現行のMQ（マッチクオリティ）は純粋に選手能力と試合展開だけで決まる。満員のアリーナでもガラガラの公民館でも同じMQ。

- カードを充実させて集客を伸ばしても → MQには無関係
- 前座が会場を温めても → メインのMQに影響しない
- 大会場で戦う意義 → 数字に現れない

### 1.3 設計目標

| # | 目標 |
|:--|:--|
| G1 | **どんな選手でも出場すれば必ず集客にプラス**（「出ない方がマシ」完全排除） |
| G2 | メイン試合の重要性は維持（フルウェイト vs サブ7割） |
| G3 | 試合数（カードの厚み）に価値がある |
| G4 | **集客 → 満員率 → MQ → 個人人気・団体人気** の好循環を作る |
| G5 | 大会場で戦うこと自体にも意味がある（ただし満員率ほどではない） |
| G6 | 既存のゲームバランスを大きく崩さない |

---

## 2. 設計の全体像

```
カード充実（試合数↑）
    ↓
集客増加（§A: 積み上げ方式で全試合が貢献）
    ↓
満員率UP → チケット収入UP + Heat変動
    ↓ ← ★ 新規追加
MQボーナス（§B: 満員率＋会場規模）
    ↓
個人人気UP + orgPop UP + Heat UP
    ↓
次の興行の集客さらにUP → 好循環
```

**全員で作る興行 → 満員の会場 → 名勝負が生まれる → 団体が成長する**

---

## §A. 集客計算の改善（積み上げ方式）

### A-1. コンセプト

**平均ではなく合計ベース。メインはフル貢献、サブは7割貢献。1試合だけの興行は×0.85。**

```
cardPop = (メイン試合pop + Σ サブ試合pop × 0.7) × カード深度乗数
cardBonus = cardPop × 1.2
```

### A-2. 定数定義（data.js に追加）

```javascript
const CARD_POP_CONFIG = {
  SUB_WEIGHT: 0.7,    // サブ試合の重み（メインの7割）
  CARD_MULT:  1.2     // cardPop → cardBonus 変換倍率
};

// カード深度乗数: 試合数に応じた乗数
// index = 試合数 - 1
const CARD_DEPTH_MULT = [0.85, 0.92, 1.0, 1.0, 1.0, 1.0];
//                        1試合  2試合  3試合  4試合  5試合  6試合
```

| 試合数 | 深度乗数 | 意味 |
|:--:|:--:|:--|
| 1試合 | ×0.85 | 興行として成り立たない（軽いペナルティ） |
| 2試合 | ×0.92 | 最低限の形 |
| 3試合 | ×1.0 | 標準的な興行（基準） |
| 4〜6試合 | ×1.0 | 合計popが自然と増えるので乗数は不要 |

### A-3. 新関数: `calcCardPop`（engine.js — Engine.economy に追加）

```javascript
calcCardPop(matchPops) {
  // matchPops: 各試合の [leftPop + rightPop] の配列
  if (matchPops.length === 0) return 0;

  // ① 降順ソート（最も人気の高い試合 = メインイベント）
  const sorted = [...matchPops].sort((a, b) => b - a);

  // ② メイン試合はフルウェイト、サブは SUB_WEIGHT
  let cardPop = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    cardPop += sorted[i] * CARD_POP_CONFIG.SUB_WEIGHT;
  }

  // ③ カード深度乗数
  const depthIdx = Math.min(sorted.length, CARD_DEPTH_MULT.length) - 1;
  cardPop *= CARD_DEPTH_MULT[depthIdx];

  return cardPop;
},
```

### A-4. `calcAttendance` の変更（engine.js:466-479）

```javascript
calcAttendance(G, venueIdx, mainCardPop, hasTitleMatch) {
  const v = VENUES[venueIdx];
  const baseAttendance = Math.round((G.orgPop / 100) * (G.orgPop / 100) * 5000);
  const cardBonus = Math.round(mainCardPop * CARD_POP_CONFIG.CARD_MULT); // ★ 3 → CARD_MULT(1.2)
  const heatMult = Engine.heat.getMult(G);
  const titleMult = hasTitleMatch ? 1.15 : 1.0;
  const charismaMult = (G.roster && G.roster.some(
    c => Traits.has(c, '華') && !c.injury
  )) ? 1.05 : 1.0;
  const rawAttendance = Math.round(
    (baseAttendance + cardBonus) * heatMult * titleMult * charismaMult
  );
  const minAttendance = Math.max(10, Math.round(v.cap * 0.05));
  return Engine.util.clamp(rawAttendance, minAttendance, v.cap);
}
```

### A-5. 呼び出し側の変更

#### engine.js（興行処理: 1544-1548）

```javascript
// 旧: 平均
const mainPop = G.lastShowResults.reduce((sum, r) => {
  ...
}, 0) / G.lastShowResults.length;

// ★ 新: calcCardPop
const matchPops = G.lastShowResults.map(r => {
  const lc = roster.find(c => c.id === r.left.id);
  const rc = roster.find(c => c.id === r.right.id);
  return (lc ? lc.popularity : 0) + (rc ? rc.popularity : 0);
});
const mainPop = Engine.economy.calcCardPop(matchPops);
```

#### ui-render.js（プレビュー: 1128-1133）

```javascript
// ★ 新: calcCardPop
const mainPop = validMatches.length > 0 ?
  Engine.economy.calcCardPop(validMatches.map(m => {
    const l = G.roster.find(c => c.id === m.left);
    const r = G.roster.find(c => c.id === m.right);
    return (l ? l.popularity : 0) + (r ? r.popularity : 0);
  })) : 0;
```

---

## §B. 会場熱気MQボーナス

### B-1. コンセプト

**「満員の会場が生む熱気が試合の質を底上げする」＋「大きな会場で戦うこと自体の価値」**

MQボーナスは2つの要素の合計:

```
MQボーナス = 満員率ボーナス（主役）+ 会場規模ボーナス（添え物）
```

### B-2. 満員率MQボーナス（data.js に追加）

```javascript
const CROWD_HEAT_MQ = [
  { min: 0.95, bonus: +5, label: '超満員の熱気' },
  { min: 0.80, bonus: +3, label: '大入りの声援' },
  { min: 0.60, bonus: +1, label: '盛況の雰囲気' },
  { min: 0.40, bonus:  0, label: '' },
  { min: 0.25, bonus: -1, label: '空席の静けさ' },
  { min: 0.00, bonus: -3, label: 'ガラガラの寂しさ' },
];
```

| 満員率 | MQボーナス | 意味 |
|:--:|:--:|:--|
| 95%以上 | **+5** | 超満員の熱気が選手を後押し |
| 80%以上 | +3 | 大入りの声援が試合を盛り上げる |
| 60%以上 | +1 | 盛況の雰囲気 |
| 40%以上 | ±0 | 影響なし |
| 25%以上 | −1 | 空席が目に入り選手の気持ちが乗らない |
| 25%未満 | **−3** | ガラガラの中では試合が盛り上がりにくい |

### B-3. 会場規模MQボーナス（data.js に追加）

```javascript
const VENUE_SCALE_MQ = [0, 0, 1, 1, 2, 2, 3];
// index: 公民館=0, 小ホール=0, 市民会館=+1, 中ホール=+1, アリーナ=+2, 大会場=+2, ドーム=+3
```

| 会場 | MQボーナス | 意味 |
|:--|:--:|:--|
| 公民館・小ホール | +0 | 小箱では規模ボーナスなし |
| 市民会館・中ホール | +1 | それなりの舞台 |
| アリーナ・大会場 | +2 | 大舞台の空気 |
| ドーム | +3 | 最高峰の舞台 |

### B-4. 合計ボーナスの組み合わせ例

| 状況 | 熱気 | 規模 | 合計 |
|:--|:--:|:--:|:--:|
| 公民館・超満員 | +5 | +0 | **+5** |
| 市民会館・超満員 | +5 | +1 | **+6** |
| アリーナ・超満員 | +5 | +2 | **+7** |
| ドーム・超満員 | +5 | +3 | **+8** |
| アリーナ・空席目立つ | −1 | +2 | **+1** |
| ドーム・ガラガラ | −3 | +3 | **±0** |

**ドームでもガラガラだと規模ボーナスが帳消しに。** 大箱を使うなら埋める覚悟が必要。

### B-5. 新関数: `calcCrowdMQBonus`（engine.js — Engine.economy に追加）

```javascript
calcCrowdMQBonus(venueIdx, occupancyRate) {
  // ① 満員率ボーナス
  const crowdEntry = CROWD_HEAT_MQ.find(c => occupancyRate >= c.min)
    || CROWD_HEAT_MQ[CROWD_HEAT_MQ.length - 1];
  const crowdBonus = crowdEntry.bonus;

  // ② 会場規模ボーナス
  const scaleBonus = VENUE_SCALE_MQ[venueIdx] || 0;

  return {
    total: crowdBonus + scaleBonus,
    crowdBonus,
    scaleBonus,
    crowdLabel: crowdEntry.label
  };
},
```

### B-6. MQへの適用（engine.js — executeShow 内）

`executeShow` 内で試合結果のMQに会場熱気ボーナスを加算する。
**適用タイミング**: 全試合の simulateMatch 完了後、MQ popularity 処理の前。

```javascript
// ★ 新規追加: 会場熱気MQボーナス
// executeShow 内、results 生成後・MQ popularity 処理前に挿入
const attendance = Engine.economy.calcAttendance(s, s.showVenue, mainPop, hasTitleMatch);
const occRate = attendance / VENUES[s.showVenue].cap;
const crowdMQ = Engine.economy.calcCrowdMQBonus(s.showVenue, occRate);
if (crowdMQ.total !== 0) {
  results.forEach(r => {
    r.mq = Engine.util.clamp(r.mq + crowdMQ.total, 5, 100);
  });
  if (crowdMQ.crowdLabel) {
    events.push(`🏟️ ${crowdMQ.crowdLabel}（MQ ${crowdMQ.total >= 0 ? '+' : ''}${crowdMQ.total}）`);
  }
}
```

**注意**: `executeShow` 内で attendance を計算する処理は現在 `weeklySettlement` にある（engine.js:1543-1551）。executeShow 内でも同じ計算を行うか、あるいは weeklySettlement から attendance 計算を executeShow に移動する設計判断が必要。

**推奨**: executeShow 内で attendance と occupancyRate を算出し、`state.lastShowAttendance` と `state.lastShowOccRate` に保存。weeklySettlement ではこの保存値を参照する。

---

## §C. バランス検証

### C-1. 「出ない方がマシ」の解消確認

**条件**: orgPop=40, Heat=NEUTRAL, タイトルなし, 華なし

| カード構成 | 旧集客 | 新集客 | 差分 |
|:--|--:|--:|:--|
| エース1試合(150) | 1,250 | 953 | — |
| ＋中堅(75) 2試合 | 1,138 ⚠️**減** | 1,024 ✅**+71** | 問題解消 |
| ＋若手(15) 3試合 | 1,040 ⚠️**減** | 1,056 ✅**+32** | 問題解消 |
| ＋最弱(5) 4試合 | 984 ⚠️**減** | 1,060 ✅**+4** | 問題解消 |

旧方式では試合追加のたびに減少。新方式では**必ず増加**。

### C-2. ゲーム進行バランス

| フェーズ | カード | 旧集客 | 新集客 | 適正会場 |
|:--|:--|--:|--:|:--|
| 序盤(orgPop15) | 2試合(24,16) | 173 | 152 | 公民館(150) |
| 序盤(orgPop15) | 3試合(24,16,8) | 161 | 162 | 小ホール(400) |
| 中盤(orgPop40/HOT) | 3試合(90,55,25) | 1,164 | 1,170 | 市民会館(1000) |
| 中盤(orgPop40/HOT) | 4試合(90,55,25,15) | 1,127 | 1,186 | 市民会館(1000) |
| 終盤(orgPop70/HOT) | 4試合(150,100,70,40) | 4,080 | 4,209 | アリーナ(6000) |
| 終盤PPV(orgPop70/HOT) | 6試合フル | 4,050 | 4,386 | アリーナ(6000) |

既存の会場進行タイミングはほぼ維持。試合数を増やす意味が出る。

### C-3. 層の厚さの差（orgPop=50, HOT×1.5）

| カード | 旧集客 | 新集客 |
|:--|--:|--:|
| エース頼み4試合(140,30,20,10) | 2,100 | 2,202 |
| **充実4試合(100,90,80,60)** | 2,247 | **2,345** |

メインを張れる選手が4-5人いる団体の方が、エース1人頼みより明確に強い。

### C-4. カード充実 → MQボーナスの連鎖（orgPop=40, NEUTRAL, 市民会館）

| カード | 集客 | 満員率 | 全試合MQ補正 |
|:--|--:|:--|:--:|
| エース1試合(90) | 892 | 89% 大入り | +4 |
| ＋中堅で2試合 | 942 | 94% 大入り | +4 |
| **＋若手で3試合** | **975** | **98% 超満員** | **+6** |

若手の試合を追加 → 超満員になった → **全試合のMQが+4から+6に！**
若手の試合そのもののMQは低いかもしれないが、**会場を満員にしたことでメインの名勝負を後押しした**。

### C-5. MQボーナスの orgPop への影響

3試合(基礎MQ: 50, 45, 55)の場合:

| 状況 | avgMQ | orgPop変動 | 補正なし |
|:--|:--:|:--:|:--:|
| 市民会館・超満員 | 56 | **+2** | +1 |
| 市民会館・盛況 | 52 | +1 | +1 |
| 市民会館・ガラガラ | 48 | +1 | +1 |
| アリーナ・超満員 | 57 | **+2** | +1 |

満員の興行は団体の成長スピードも変わる。

---

## §D. 影響範囲と変更一覧

| ファイル | 変更箇所 | 変更内容 |
|:--|:--|:--|
| `data.js` | 新規追加 | `CARD_POP_CONFIG`, `CARD_DEPTH_MULT`, `CROWD_HEAT_MQ`, `VENUE_SCALE_MQ` |
| `engine.js` | `Engine.economy` | `calcCardPop()` 新規追加 |
| `engine.js` | `Engine.economy` | `calcCrowdMQBonus()` 新規追加 |
| `engine.js` | `calcAttendance` L470 | `* 3` → `* CARD_POP_CONFIG.CARD_MULT` |
| `engine.js` | 興行処理 L1544-1548 | 平均 → `calcCardPop()` |
| `engine.js` | `executeShow` L1679付近 | 会場熱気MQボーナスの適用を追加 |
| `engine.js` | AI興行処理 | 同上（mainPop計算の変更） |
| `ui-render.js` | プレビュー L1128-1133 | 平均 → `calcCardPop()` |
| `ui-render.js` | プレビュー表示 | 会場熱気MQボーナスの予想表示（任意） |
| `ui-common.js` | `calcAttendance` ラッパー | 変更なし |

---

## §E. テストシナリオ

### E-1. 集客テスト

| # | テスト | 期待結果 |
|:--|:--|:--|
| T1 | 任意の試合を追加 → 集客が増加 | attendance(N+1) ≥ attendance(N) |
| T2 | pop=1の最弱2人の試合を追加 | 集客が減らない |
| T3 | 1試合の集客 < 3試合の集客（同メイン） | 深度乗数が機能 |
| T4 | 6試合PPVの集客 > 3試合の集客 | カード充実の価値 |

### E-2. MQボーナステスト

| # | テスト | 期待結果 |
|:--|:--|:--|
| T5 | 超満員(95%+)の興行 → 全試合MQに+5以上 | crowdBonus ≥ 5 |
| T6 | ガラガラ(25%未満)の興行 → 全試合MQに−3 | crowdBonus = -3 |
| T7 | ドームの規模ボーナス > 公民館 | scaleBonus差 = 3 |
| T8 | ドーム・ガラガラの合計ボーナス ≤ 公民館・超満員 | 大箱ガラガラの無意味さ |

### E-3. 統合テスト

| # | テスト | 期待結果 |
|:--|:--|:--|
| T9 | カード追加 → 満員率UP → MQボーナスUP の連鎖 | 数値で確認 |
| T10 | UI予想集客とエンジン実集客が一致 | 同じ関数使用 |
| T11 | AI興行も新方式で集客計算される | AI側のコード確認 |

---

## §F. 調整ノブ

すべて `data.js` の定数に集約。ゲームプレイを見ながら微調整可能。

### F-1. 集客関連

| パラメータ | 初期値 | 上げると | 下げると |
|:--|:--:|:--|:--|
| `SUB_WEIGHT` | 0.7 | サブの貢献UP（全員平等に） | メイン偏重に |
| `CARD_MULT` | 1.2 | カード全体の集客影響力UP | orgPopの比重UP |
| `CARD_DEPTH_MULT[0]` | 0.85 | 1試合興行のペナルティ軽減 | ペナルティ強化 |
| `CARD_DEPTH_MULT[1]` | 0.92 | 2試合興行の不利軽減 | 不利強化 |

### F-2. MQボーナス関連

| パラメータ | 初期値 | 上げると | 下げると |
|:--|:--:|:--|:--|
| `CROWD_HEAT_MQ` の各bonus | +5/+3/+1/0/-1/-3 | 満員率のMQへの影響拡大 | 影響縮小 |
| `VENUE_SCALE_MQ` の各値 | 0/0/1/1/2/2/3 | 大箱の価値UP | 箱の大きさの意味薄まる |

---

## §G. 実装手順

### Step 1: data.js — 定数追加
- `CARD_POP_CONFIG` オブジェクト
- `CARD_DEPTH_MULT` 配列
- `CROWD_HEAT_MQ` テーブル
- `VENUE_SCALE_MQ` 配列

### Step 2: engine.js — 新関数追加
- `Engine.economy.calcCardPop()` を追加
- `Engine.economy.calcCrowdMQBonus()` を追加

### Step 3: engine.js — calcAttendance 修正
- `mainCardPop * 3` → `mainCardPop * CARD_POP_CONFIG.CARD_MULT`

### Step 4: engine.js — 呼び出し側修正（興行処理 L1544-1548）
- 平均計算 → `calcCardPop()` に変更

### Step 5: engine.js — executeShow に会場熱気MQ適用を追加
- attendance 計算を executeShow 内に追加（or 移動）
- `calcCrowdMQBonus()` で全試合のMQを補正
- イベントメッセージ出力

### Step 6: ui-render.js — プレビュー修正
- 平均計算 → `calcCardPop()` に変更
- （任意）会場熱気MQボーナスの予想表示

### Step 7: AI興行処理の対応
- AI側のmainPop計算も同じ方式に変更

### Step 8: テスト実行（§E の全項目）
