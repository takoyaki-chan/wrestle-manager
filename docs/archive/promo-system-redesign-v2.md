# promo-system-redesign v2.0 — Claude Code実装指示書

## 概要
プロモ活動による人気成長システムを全面見直し。
「効いてる気がしない」問題を3つの改善で解消する。

## 変更ファイルと箇所

---

### 1. `src/data.js` — PROMO_POP_CAP を 70→100（実質撤廃）

```js
// 変更前
const PROMO_POP_CAP = 70; // プロモのみで到達可能な人気上限（旧55→70）

// 変更後
const PROMO_POP_CAP = 100; // promo-system-redesign v2.0: 上限撤廃（diminishingで自然に鈍化）
```

---

### 2. `src/management.js` — getDiminishingMultiplier カーブ緩和

```js
// 変更前
getDiminishingMultiplier(currentPop) {
  if (currentPop < 20) return 1.0;
  if (currentPop < 35) return 0.6;
  if (currentPop < 50) return 0.35;
  if (currentPop < 65) return 0.18;
  if (currentPop < 80) return 0.13;
  return 0.10; // 80-99
},

// 変更後
// §A: Diminishing returns curve (promo-system-redesign v2.0)
// pop0-19: full / pop20-34: 緩やか / pop50+: 逓減 / pop90+: 試合なしでは微増のみ
getDiminishingMultiplier(currentPop) {
  if (currentPop < 20) return 1.00;
  if (currentPop < 35) return 0.75;  // 旧0.60
  if (currentPop < 50) return 0.55;  // 旧0.35
  if (currentPop < 65) return 0.35;  // 旧0.18
  if (currentPop < 80) return 0.22;  // 旧0.13
  if (currentPop < 90) return 0.10;  // 旧0.10（維持）
  return 0.05;                        // 90+: 新追加（試合の好MQ必須帯）
},
```

---

### 3. `src/management.js` — balanceスケジュールの自動プロモ判定を簡略化

```js
// 変更前
// 興行週: pop上限未達 or promoStack未満3なら promo、それ以外は practice
const popBenefit = nc.popularity < PROMO_POP_CAP;
const stackBenefit = (nc.promoStack || 0) < 3;
action = (popBenefit || stackBenefit) ? 'promo' : 'practice';

// 変更後
// 興行週: promoStack未積みなら promo、それ以外は practice
// promo-system-redesign v2.0: popBenefit条件削除（PROMO_POP_CAP撤廃）
const stackBenefit = (nc.promoStack || 0) < 3;
action = stackBenefit ? 'promo' : 'practice';
```

---

### 4. `src/management.js` — プロモのrawGainをMNT連動に変更 + スター製造コーチ適用

`} else if (action === 'promo') {` ブロック内の最初の数行を置換する。

```js
// 変更前
// v1.0b: Apply diminishing returns + promo pop cap
const rawPromoGain = Math.floor(1 + Engine.rng.float(rng) * 2) + promoBoostAmount;
const diminishedGain = Engine.popularity.applyDiminishing(rawPromoGain, nc.popularity);
const newPop = nc.popularity + diminishedGain;
nc.popularity = Math.min(PROMO_POP_CAP, Math.min(100, newPop)); // promo alone cannot exceed PROMO_POP_CAP

// 変更後
// promo-system-redesign v2.0: MNT連動rawGain（MN40=1.0, MN60=1.5, MN80=2.0, MN100=2.5）
const mnVal = nc.mn || 60;
const mnRawGain = 1.0 + Math.max(0, mnVal - 40) / 40;
// v0.2: スター製造コーチ — 試合と同様にプロモにも適用
const starMakerMult = Engine.coach.getPopGainMult(stateForCalc, nc.id);
const rawPromoGain = (mnRawGain + promoBoostAmount) * starMakerMult;
const diminishedGain = Engine.popularity.applyDiminishing(rawPromoGain, nc.popularity);
const newPop = nc.popularity + diminishedGain;
nc.popularity = Math.min(100, newPop); // promo-system-redesign v2.0: 上限撤廃
```

---

## 検証

変更後 `node test/auto-sim.js` を実行して ALL CLEAR を確認。

---

## 変更後の期待動作

| 条件 | 旧（4シーズン後） | 新（4シーズン後） |
|------|----------------|----------------|
| MN40、balanceスケジュール | pop61 上限70で停止 | pop62 |
| MN60、balanceスケジュール | pop61 上限70で停止 | pop74 |
| MN80、balanceスケジュール | pop61 上限70で停止 | pop82 |
| MN60、スター製造コーチ付き | pop61 上限70で停止 | pop80 |

- **上限70の撤廃**：pop70台・80台がプロモだけでも到達可能に
- **MNTが差別化要因**に：カリスマ型選手とそうでない選手でプロモ効果が明確に違う
- **pop90台は試合の好MQが必要**：diminishing 0.05で自然に鈍化
- **スター製造コーチがプロモにも機能**するようになる
