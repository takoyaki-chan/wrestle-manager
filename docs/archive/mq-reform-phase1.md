# MQ改修 Phase 1: バグ修正 + ペーシング変更 + 外部MQソース改定

**前提**: Phase 1 → Phase 2 → Phase 3 の順に実装すること。Phase 2 は Phase 1 完了後に着手。

---

## 1. キックアウトバグ修正

engine.js の simulateMatch 内、fall/tko キックアウト成功時に `totalKickouts++` が抜けている。

**現状（354-361行目付近）**:
```javascript
if (fType === 'fall' || fType === 'tko') {
  const koChance = B.calcKickoutChance(def, ph, eng);
  if (Engine.rng.float(rng) < koChance) {
    escaped = true;
    def.hp = Math.round(def.mhp * 0.05);
    def.kickoutCount++;
    def.gritTurns = eng.gritDuration;
    log.push(`  → ${def.name}がキックアウト！ Grit発動！`);
  }
}
```

**修正**: `def.kickoutCount++` の後に `totalKickouts++` を追加。

---

## 2. ペーシング減点: 「長すぎ」ペナルティ撤廃

engine.js の simulateMatch 内、ペーシング減点計算を変更。

**通常マッチ（Tier 1）改定後**:
```javascript
if (matchTurns >= 7) pacingPenalty = 0;       // 7ターン以上は全て理想
else if (matchTurns >= 5) pacingPenalty = 3;   // 5〜6は許容
else pacingPenalty = 12;                        // <5 はスコアッシュ
```

**ビッグマッチ（Tier 2）改定後**:
```javascript
if (matchTurns >= 13) pacingPenalty = 0;       // 13ターン以上は全て理想
else if (matchTurns >= 10) pacingPenalty = 3;   // 10〜12は許容
else pacingPenalty = 12;                         // <10 はスコアッシュ
```

---

## 3. 外部MQソース: 値変更

### 3-1. タイトルマッチ MQ: +10 → +5

data.js の TITLES 定義:
```javascript
{id:'world', name:'団体王座', mqBonus:5, ...}  // 現状 mqBonus:10
```

### 3-2. ファン期待カード MQ: +5 → +2.5

engine.js の fanExpect.getMQBonus:
```javascript
return matched ? 2.5 : 0;  // 現状 5
```

### 3-3. 宿怨 MQ: +3 → +2

data.js:
```javascript
const BITTER_RIVAL_MQ_BONUS = 2;  // 現状 3
```

### 3-4. ライバル因縁カーブ変更

engine.js の getRivalryMQBonus を以下に差し替え:
```javascript
getRivalryMQBonus(rivalry) {
  if (rivalry == null || rivalry < 45) return 0;
  if (rivalry < 55) return 1;
  if (rivalry < 65) return 2;
  if (rivalry < 80) return 3;
  return 4;
}
```

### 3-5. ラストラン基本: +3 → +2

engine.js の Pass 2 ラストラン処理:
```javascript
externalMQ += 2;  // 現状 3 — ラストラン基本
```

### 3-6. ラストランメイン: +5 → +3

engine.js の Pass 2 ラストラン処理:
```javascript
if (matchIdx === 0) externalMQ += 3;  // 現状 5 — メインイベント
```

---

## 4. 外部MQソース: 削除（6件）

以下のMQボーナスをPass 2から削除する。

### 4-1. 一方的因縁 MQ+1 → 削除

engine.js の getRivalryLevel 内、`isOneSided` 分岐の `mqBonus` を 0 にする。
※ 一方的因縁の判定自体（`isOneSided`フラグ）は残す。MQソースから外すだけ。

### 4-2. ケミストリー（友情）→ 削除

engine.js の Pass 2 で `r.friendshipBonus` を externalMQ に加算している箇所を削除。
getMatchChemistryBonus 関数自体も return 0 にする。

### 4-3. ラストラン因縁相手ボーナス +3/+5 → 削除

engine.js の Pass 2 ラストラン処理内、因縁相手チェック（rivalLevel → externalMQ += 3/5）を削除。
`r.lastRunRivalBonus` の設定も削除。

### 4-4. 見返しモード MQ+2 → 削除

engine.js の Pass 2 で `proveMode` チェック → externalMQ += 2 の箇所を削除。
`r.proveModeBonus` の設定も削除。

### 4-5. コスチュームデビュー MQ+2 → 削除

engine.js の Pass 2 で `_costumeDebut` チェック → externalMQ += 2 の箇所を削除。
`r.costumeDebutBonus` の設定も削除。

### 4-6. 野心 MQ+1 → 削除

engine.js の Pass 2 でタイトルマッチ挑戦者の野心チェック → externalMQ += 1 の箇所を削除。

---

## 5. 検証

Phase 1 完了後、ゲームを起動して以下を目視確認:
- 試合が正常に動作すること
- MQ詳細（mqDetail）に正しい値が出ていること
- エラーが出ないこと

**auto-simはPhase 3でまとめて実施するのでPhase 1では不要。**
