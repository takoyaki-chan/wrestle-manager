# ⚖️ バランス調整設計書 v1.9

> **ステータス**: 🟡 設計確定・実装待ち
> **作成日**: 2026-03-03
> **対象**: engine.js / data.js / ui-render.js / app.js
> **🔧マーク = 調整可能パラメータ**

---

## 変更A：逸材特別交渉枠（FA専用）

### A.1 概要

団体人気25到達時に「逸材特別交渉枠」がアンロックされる。
以降、FA（フリーエージェント）契約で **逸材ティアの選手1人だけ** reqPop制限を無視して交渉できる。
実際に逸材を1人FA契約したら枠が消費される（1回限り）。

**スカウトでは使用不可**。FA専用。

### A.2 仕様詳細

| 項目 | 仕様 |
|------|------|
| 発動条件 | `G.orgPop >= 25` に初めて到達した時 |
| 検知タイミング | tickWeek内のorgPop更新後（興行後のorgPop変動を含む）|
| 保存フラグ | `G.eliteTicket = true`（未使用時）/ `G.eliteTicketUsed = true`（使用済み）|
| 対象ティア | `elite`（逸材）のみ。`superElite`（超逸材）には使用不可 |
| 使用場所 | FA一覧でのcanNegotiate判定のみ。スカウトイベントでは無効 |
| 消費条件 | 逸材ティアのFA選手をこの枠で実際に契約完了した時 |
| 通知 | アンロック時にgameLogに記録＋UIで演出（イベント通知） |
| UIバッジ | FA一覧の逸材行に「🎫 特別交渉枠」表示。使用済みなら非表示 |

### A.3 フレーバーテキスト

```
🎫 逸材特別交渉枠を獲得！

団体の評判が業界に広まり、逸材クラスの選手にも
交渉の道が開けました。
フリーエージェント市場で、逸材ランクの選手1名と
特別に交渉できます。

※ この権利はいつでも使えます（温存OK）
※ 1回限りの特別枠です
※ 超逸材ランクには使用できません
```

### A.4 実装箇所

**engine.js:**
- `Engine.scout.canNegotiate(orgPop, tierIdOrFighter, context)` に第3引数 `context` を追加
  - `context === 'fa'` かつ `G.eliteTicket === true` かつ tier が `elite` なら reqPop無視で `true` を返す
  - `context === 'scout'` または省略時は従来通り
- もしくはシンプルに別関数 `canNegotiateFA(orgPop, fighter, G)` を追加

**app.js:**
- `Actions.signFreeAgent()` 内：逸材ティアのFA契約成功時に `G.eliteTicket = false; G.eliteTicketUsed = true;` を設定
- tickWeek内：orgPop 25到達検知 → `G.eliteTicket = true` + gameLog追加 + イベント通知

**ui-render.js:**
- FA一覧：`canNeg` が false でも `eliteTicket` で交渉可能な場合は opacity を戻し「🎫 特別交渉枠」バッジを表示
- スカウト画面：変更なし（従来通り reqPop で制御）

---

## 変更B：年齢カーブ型契約費用

### B.1 概要

選手の契約費用（assessedValue）に年齢による市場価値倍率を導入する。

- **若手プレミアム**: 逸材以上 + 個性2つ以上 の若手（21歳以下）にランダムなプレミアム加算
- **ピーク安定期**: 22〜25歳は基準価格
- **下降開始**: 25歳から内部的に減衰が始まるが、成長相殺で27歳まで表面的にはほぼ変わらない
- **明確な下降**: 27〜29歳で価格が下がる
- **30歳以降**: 既存のreassess(age30: ×0.8, age35plus: ×0.6)はそのまま維持

### B.2 年齢市場価値倍率

```javascript
function ageMarketMultiplier(age, fighter) {
  // 若手プレミアム判定（逸材以上 + 個性2つ以上 + ランダム）
  if (age <= 21) {
    const tier = Engine.scout.getTier(potTotal, curTotal);
    const isElitePlus = (tier.id === 'elite' || tier.id === 'superElite');
    const traitCount = (fighter.traits || []).length;
    if (isElitePlus && traitCount >= 2) {
      // ランダム要素: 10%〜35%のプレミアム（毎回変動）
      return 1.10 + random() * 0.25;  🔧 // 1.10〜1.35
    }
    return 1.0;  // 条件を満たさない若手はプレミアムなし
  }
  // 安定期
  if (age <= 25) return 1.0;
  // 下降開始（成長で相殺される帯）
  if (age <= 27) return 0.95;  🔧
  // 明確な下降
  if (age <= 29) return 0.85;  🔧
  // 30以降は既存reassessが処理するため、ここでは1.0
  return 1.0;
}
```

### B.3 適用箇所

**engine.js — `Engine.scout.calcAssessedValue()`:**

現在:
```javascript
const baseValue = tier.baseMin + Math.round(Engine.rng.float(rng) * (tier.baseMax - tier.baseMin));
const variance = 0.70 + Engine.rng.float(rng) * 0.60;
return { assessedValue: Math.round(baseValue * variance), ... };
```

変更後:
```javascript
const baseValue = tier.baseMin + Math.round(Engine.rng.float(rng) * (tier.baseMax - tier.baseMin));
const variance = 0.70 + Engine.rng.float(rng) * 0.60;
const ageMul = ageMarketMultiplier(fighter.age, fighter, rng);  // ← 追加
return { assessedValue: Math.round(baseValue * variance * ageMul), ... };  // ← ageMul適用
```

※ `calcAssessedValue` にfighterオブジェクト全体を渡す必要あり（現在はpot/currentだけ参照）。
  引数の変更が必要だが、既存の呼び出し箇所への影響は小さい（大半がfighterオブジェクトを渡している）。

### B.4 reassess(age30/age35plus)との関係

- 30歳以降は ageMarketMultiplier が 1.0 を返すので、二重適用は発生しない
- 27〜29歳帯で ageMarketMultiplier × 0.85〜0.95 → reassess(age30) × 0.8 は **順次適用** なので、
  29歳: 0.85 → 30歳: さらに×0.8 = 実質0.68 程度。ベテランが安くなるのは設計意図通り

### B.5 UI変更

- FA一覧・スカウト画面: 契約金表示は既存ロジックで自動反映される（assessedValue算出時点で年齢考慮済み）
- 若手プレミアム適用時: 任意で「📈 将来性プレミアム」の小バッジを表示しても良い（優先度低）

---

## 変更C：AI団体成長バランス調整

### C.1 概要

AI団体のfacilityMulを全て1.00（実質廃止）にし、growthBonusを控えめに再調整する。
プレイヤーに施設システムが存在しないため、対応機能がないfacilityMulがバランスを歪めている問題を解消。

### C.2 変更値

**data.js — RIVAL_ORGS:**

| 団体 | coachMul | facilityMul（旧→新） | 備考 |
|------|:---:|:---:|------|
| S（EMPRESS） | 1.30（変更なし） | 1.15 → **1.00** | A級コーチ相当は維持 |
| A（NOVA） | 1.15（変更なし） | 1.10 → **1.00** | |
| B（CRESCENT） | 1.00（変更なし） | 1.05 → **1.00** | |

**data.js — AI_TIER_LIMITS:**

| 団体ティア | growthBonus（旧→新） | 備考 |
|:---:|:---:|------|
| S | 1.20 → **1.05** | 大幅削減。coachMul 1.30で十分に有利 |
| A | 1.05 → **1.00** | ニュートラル |
| B | 0.90 → **0.95** | 微不利だが従来より改善 |

### C.3 変更後の合計倍率比較

| 団体 | 旧合計 | 新合計 | 変化 | 対プレイヤー(中盤B級コーチ1.18) |
|------|:---:|:---:|:---:|:---:|
| B級 | 0.945 | 0.95 | +0.5% | Pが有利 (1.18 vs 0.95) |
| A級 | 1.328 | 1.15 | −13% | ほぼ互角 (1.18 vs 1.15) |
| S級 | 1.794 | 1.365 | −24% | S有利だがコーチで逆転可 (1.30 vs 1.365) |

### C.4 実装箇所

**data.js のみ（2箇所の数値変更）:**

```javascript
// RIVAL_ORGS — facilityMul を全て1.00に
{ id:'ai_org_s', tier:'S', coachMul:1.30, facilityMul:1.00, ... }
{ id:'ai_org_a', tier:'A', coachMul:1.15, facilityMul:1.00, ... }
{ id:'ai_org_b', tier:'B', coachMul:1.00, facilityMul:1.00, ... }

// AI_TIER_LIMITS — growthBonus 調整
S: { maxProdigies: 99, maxPromising: 99, growthBonus: 1.05, faAggressiveness: 0.60 },
A: { maxProdigies: 3,  maxPromising: 99, growthBonus: 1.00, faAggressiveness: 0.40 },
B: { maxProdigies: 1,  maxPromising: 99, growthBonus: 0.95, faAggressiveness: 0.20 }
```

---

## 実装優先順

| 順 | 変更 | 工数 | 理由 |
|:--:|------|:---:|------|
| 1 | C: AI成長バランス | 最小 | data.jsの数値2箇所変更のみ |
| 2 | B: 年齢カーブ契約金 | 小 | calcAssessedValueに倍率関数1つ追加 |
| 3 | A: 逸材特別交渉枠 | 中 | フラグ管理+canNegotiate改修+UI+イベント通知 |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-03 | v1.9 初版。3点のバランス調整設計確定 |
