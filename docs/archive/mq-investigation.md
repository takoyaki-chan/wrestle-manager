# レッスルマネージャー MQ判定 完全調査レポート

調査日: 2026-03-25
対象コミット: 最新main

---

## 全体構造

```
最終MQ = baseMQ + cappedPositiveExternal + negativeExternal + titleGapPenalty + freshnessPenalty + trustMQPenalty
```

ここで `baseMQ` は試合シミュレーション内部で計算され、残りはPass 2で適用される。

---

## Part 1: 試合内部MQ（baseMQ）

### §1 天井（OVシーリング）

```javascript
avgOV = (ov(charL) + ov(charR)) / 2

if (avgOV <= 50)  ceiling = 20 + avgOV * 0.60
if (avgOV <= 80)  ceiling = 50 + (avgOV - 50) * 1.10
else              ceiling = 83 + (avgOV - 80) * 0.85

ceiling = clamp(round(ceiling), 15, 100)
```

| avgOV | 天井 |
|:-----:|:----:|
| 20 | 32 |
| 30 | 38 |
| 40 | 44 |
| 50 | 50 |
| 60 | 61 |
| 70 | 72 |
| 80 | 83 |
| 90 | 92 |
| 100 | 100 |

格差マッチ例: OV40 vs OV90 → avgOV=65 → 天井=67

---

### §2 ドラマ減点

30点から開始し、見せ場の発生で減点を打ち消す。

```javascript
dramaPenalty = 30
dramaPenalty -= min(totalKickouts, 2) * 8      // 最大 -16
dramaPenalty -= min(totalCounters, 3) * 2.5    // 最大 -7.5
dramaPenalty -= min(leadChanges, 3) * 1.5      // 最大 -4.5
dramaPenalty -= min(bigMoves, 6) * 0.4         // 最大 -2.4
dramaPenalty = max(0, round(dramaPenalty))
// 理論最大打消し: 30.4（完全ゼロ化可能）
```

#### ドラマイベントの発生条件

**totalKickouts（キックアウト）のカウント対象:**

| イベント | def.kickoutCount++ | totalKickouts++ |
|---------|:---:|:---:|
| fall/tko で HP<=0 → キックアウト成功 | ✅ | ❌ **カウントされない** |
| gu で HP<=0 → ロープエスケープ成功 | ✅ | ✅ |
| ピン試行 → カウント2で返した | — | ✅ |

⚠️ **バグ発見**: `fall`/`tko`決着判定時のキックアウト成功は`def.kickoutCount`（キックアウト回数制限用）には加算されるが、`totalKickouts`（MQドラマ計算用）には加算されない。つまり**フォール/TKOからのキックアウトはMQに全く反映されない**。GU（ギブアップ）からのロープエスケープとピン返しだけがMQに影響する。

- `def.kickoutCount` → キックアウト上限チェック用（fall/tko: max2、gu: max2）
- `totalKickouts` → MQ計算用（GUエスケープ + ピン返しのみカウント）

**totalCounters（カウンター）:**
- 攻撃がヒットした後、`counterRate`判定に成功した場合にカウント
- `counterRate = counterBase(4) + def.te * 0.055 - atk.sp * 0.07 + ph.counterBonus + (grit時+8)`
- clamp: 2〜22%
- フェーズ別counterBonus: Opening=0, Mid=3, End=5, Climax=8（通常マッチ）

**leadChanges（リード逆転）:**
- モメンタムが+5超/-5超に変化して、前回と異なるリーダーになった場合にカウント
- ヒット時に mom += 8（攻撃側）なので比較的頻繁に発生

**bigMoves（大技）:**
- `dmg >= 10` でカウント
- ダメージ計算: `(base - defense) * momMod * randFactor * phaseMult`
- 低OV同士だと大技が出にくい（パワー・テク・スピード全部低い）

---

### §3 ペーシング減点

Tier別に適正ターン帯が異なる。

**通常マッチ（Tier 1）: MAX_T = 20**

| ターン数 | ペナルティ | 判定 |
|:--------:|:---------:|:----:|
| 7〜14 | 0 | 理想 |
| 5〜6, 15〜16 | -3 | 許容 |
| <5 | -12 | スコアッシュ |
| >16 | -6 | 長すぎ |

**ビッグマッチ（Tier 2）: MAX_T = 24**

| ターン数 | ペナルティ | 判定 |
|:--------:|:---------:|:----:|
| 13〜21 | 0 | 理想 |
| 10〜12, 22〜23 | -3 | 許容 |
| <10 | -12 | スコアッシュ |
| >23 | -6 | 長すぎ |

---

### §4 決着減点

| 決着タイプ | フェーズ | ペナルティ |
|-----------|---------|:---------:|
| フォール / ギブアップ | Climax | 0 |
| フォール / ギブアップ | End | -1 |
| フォール / ギブアップ | Opening/Mid | -3 |
| ピン（サプライズフォール） | 任意 | 0 |
| 丸め込み | 任意 | -1 |
| TKO | 任意 | -2 |
| 時間切れ / HP判定 | — | -10 |

---

### §5 特性ボーナス（天井超え可能）

baseMQ算出後、特性による加点が天井を超えて適用される。

| 特性 | 効果 |
|------|------|
| 名勝負製造機 | +1〜5（ランダム） |
| 引き出し上手 | OV差>15の場合、min(4, ovDiff * 0.15) |

```javascript
mq = ceiling - dramaPenalty - pacingPenalty - finishPenalty
if (名勝負製造機) mq += 1 + rng.int(0, 4)
if (引き出し上手 && ovDiff > 15) mq += min(4, ovDiff * 0.15)
baseMQ = clamp(round(mq), 5, 100)
```

---

## Part 2: 外部MQボーナス（Pass 2）

### 正方向（MQ_EXTERNAL_CAP = +15 上限）

以下の合計が+15を超えた分は切り捨てられる。

| ソース | 加点 | 条件 |
|-------|:----:|------|
| **タイトルマッチ** | +10 | 世界王座戦 |
| **ファン期待カード** | +5 | fanExpect一致 |
| **ライバル因縁（通常）** | +1〜+6 | rivalry30〜90で段階的（連続関数） |
| ├ rivalry30-49 | +1 | |
| ├ rivalry50-59 | +2 | |
| ├ rivalry60-69 | +3 | |
| ├ rivalry70-79 | +4 | |
| ├ rivalry80-89 | +5 | |
| └ rivalry90+ | +6 | |
| ├ bond50+ & rivalry40+ | 上記+1 | ケミストリーボーナス |
| ├ pendingClashBonus | +1〜+2 | 衝突イベント発生時（5%確率） |
| **好敵手（resolved goodRival）** | +2 (+clash) | GOODRIVAL_MQ_BONUS |
| **宿怨（resolved bitter）** | +3 (+clash) | BITTER_RIVAL_MQ_BONUS |
| **一方的因縁** | +1 (+clash) | ONESIDED_RIVALRY_MQ_BONUS |
| **ケミストリー（友情）** | +1 | bond70+ & rivalry<40 |
| **ラストラン基本** | +3 | 引退試合 |
| **ラストラン メイン** | +5 | 引退試合がメインイベント |
| **ラストラン 因縁相手** | +3 or +5 | rivalry50+で+3, rivalry70+/好敵手/宿怨で+5 |
| **プロモスタック** | +1.3〜+3.9 | promoStack 1〜3 × 1.3 |
| **会場熱気** | +1〜+3 | 満席率60%〜95%+ |
| **会場規模** | +0〜+3 | 公民館=0, ドーム=+3 |
| **コーチMQ** | 0 | 現在の実装は常に0を返す（未実装） |
| **マイルストーン mq_boost** | 可変 | milestoneBuffs |
| **マイルストーン next_match_mq** | 可変 | 特定ペア1回限り |
| **見返しモード** | +2 | proveMode > 0 |
| **コスチュームデビュー** | +2 | _costumeDebut |
| **カード鮮度（初顔合わせ）** | +2 | 初対戦 |
| **野心** | +1 | タイトルマッチ挑戦者側 |

#### 理論上の正方向最大値（キャップ前）

ラストラン + メイン + 因縁相手(好敵手) + タイトル + ファン期待 + 好敵手MQ + プロモ3 + 会場熱気3 + 会場規模3 + 見返し + コスチューム + 初顔合わせ  
= 3 + 5 + 5 + 10 + 5 + 2 + 3.9 + 3 + 3 + 2 + 2 + 2 = **45.9**

→ **キャップ+15で切り捨て** → 実質+15まで

### 負方向（キャップ対象外）

| ソース | 減点 | 条件 |
|-------|:----:|------|
| **ガラガラペナルティ** | -1〜-3 | 満席率25%未満で-3 |
| **マンネリ** | -3〜-8 | 12興行中3回目-3, 4回目-5, 5回目-8 |
| **タイトル格差** | -3 or -6 | OVR差>10で-3, >20で-6 |
| **信頼低下（trust<35）** | -1.53/人 | 片方or両方、最大-3.06 |

### 最終式

```javascript
positiveExternal = max(0, externalMQ)
negativeExternal = min(0, externalMQ)
cappedPositive = min(positiveExternal, 15)

finalMQ = clamp(baseMQ + cappedPositive + negativeExternal + titleGapPenalty + freshnessPenalty + trustMQPenalty, 5, 100)
```

注意: `negativeExternal`は`externalMQ`の負の部分（ガラガラペナルティのみが該当しうる）。マンネリ・タイトル格差・信頼低下は別途加算されるのでキャップの影響を受けない。

---

## Part 3: 発見事項・問題点

### 🐛 バグ: fall/tkoキックアウトがMQに反映されない

**engine.js 354〜372行目**

```javascript
// fall/tko の場合（354-361行目）
if (fType === 'fall' || fType === 'tko') {
  const koChance = B.calcKickoutChance(def, ph, eng);
  if (rng < koChance) {
    escaped = true;
    def.hp = round(def.mhp * 0.05);
    def.kickoutCount++;     // ← 上限チェック用にカウント
    def.gritTurns = eng.gritDuration;
    // ⚠️ totalKickouts++ が無い！
  }
}
// gu の場合（363-372行目）
else if (fType === 'gu') {
  const escChance = B.calcGuEscapeChance(def, ph, eng);
  if (rng < escChance) {
    escaped = true;
    def.hp = round(def.mhp * 0.05);
    def.kickoutCount++;
    def.gritTurns = eng.gritDuration;
    totalKickouts++;         // ← GUだけカウントしている
  }
}
```

**影響**: フォール/TKOからの劇的なキックアウトが発生しても、ドラマ減点の回復（1回あたり8点）に全く貢献しない。ギブアップからのロープエスケープだけがカウントされる。finishWeightsを見ると、submission技以外はgu確率0%なので、**submission技以外からのキックアウトは全てMQ的に無意味**。

実質的にMQのドラマ回復に効くキックアウト系イベント:
1. submission技によるGU判定 → ロープエスケープ（totalKickouts++）
2. ピン試行 → カウント2で返す（totalKickouts++）

通常のフォール/TKO決着からのキックアウト（プロレスで最もドラマチックなイベント）はカウントされていない。

### ⚠️ 構造的懸念: 外部キャップ+15の飽和

正方向の外部ボーナスソースが非常に多い（約12種類、理論合計45.9）のに対してキャップが+15。つまり:
- タイトルマッチ(+10) + ファン期待(+5) だけでキャップ到達
- ライバル因縁、プロモ、会場効果などが無意味になるケースが多い
- 「全部揃えた」感が得られにくい

### ⚠️ 構造的懸念: コーチMQが常に0

`getMQBonusForMatch`は常に0を返す。実装予定だが未着手の模様。

### 📊 MQレンジの実態（baseMQ のみ）

| avgOV | 天井 | 完璧(減点0) | 好試合(減点5) | 平均(減点16) | 凡戦(減点29) |
|:-----:|:----:|:----------:|:-----------:|:----------:|:----------:|
| 30 | 38 | 38 | 33 | 22 | 9 |
| 40 | 44 | 44 | 39 | 28 | 15 |
| 50 | 50 | 50 | 45 | 34 | 21 |
| 60 | 61 | 61 | 56 | 45 | 32 |
| 70 | 72 | 72 | 67 | 56 | 43 |
| 80 | 83 | 83 | 78 | 67 | 54 |
| 90 | 92 | 92 | 87 | 76 | 63 |

減点16 = drama12 + pacing3 + finish1（平均的な試合の目安）

### 📊 最終MQ（baseMQ + 外部キャップ+15）

| avgOV | 完璧+外部全盛 | 平均+外部全盛 | 凡戦+外部なし |
|:-----:|:-----------:|:----------:|:----------:|
| 30 | 53 | 37 | 9 |
| 40 | 59 | 43 | 15 |
| 50 | 65 | 49 | 21 |
| 60 | 76 | 60 | 32 |
| 70 | 87 | 71 | 43 |
| 80 | 98 | 82 | 54 |
| 90 | 100 | 91 | 63 |

---

## Part 4: データフローまとめ

```
simulateMatch()
  │
  ├── カウンター判定 → totalCounters++
  ├── ダメージ判定 → bigMoves++ (dmg>=10)
  ├── モメンタム変動 → leadChanges++
  ├── HP<=0 判定
  │   ├── fall/tko → kickoutChance → def.kickoutCount++ (⚠️ totalKickoutsに加算されない)
  │   └── gu → escapeChance → def.kickoutCount++ & totalKickouts++
  ├── ピン試行 → 失敗時 totalKickouts++
  ├── 丸め込み判定
  └── TKO判定
  │
  ▼ baseMQ計算
  ceiling - dramaPenalty - pacingPenalty - finishPenalty + 特性ボーナス
  │
  ▼ Pass 2: 外部MQ
  ├── rivalryBonus.mqBonus
  ├── friendshipBonus (chemistry)
  ├── titleMatch (+10)
  ├── coachMQBonus (常に0)
  ├── promoStackBonus (max +3.9)
  ├── crowdMQ (heat+scale)
  ├── mqBoostBuff (milestone)
  ├── nextMatchMqBuff (milestone, 1回限り)
  ├── fanExpect (+5)
  ├── 野心 (+1, タイトル挑戦者)
  ├── ラストラン (+3, メイン+5, 因縁+3/+5)
  ├── 見返しモード (+2)
  ├── コスチュームデビュー (+2)
  └── カード鮮度 (+2 初顔 / -3〜-8 マンネリ)
  │
  ▼ キャップ適用
  cappedPositive = min(正方向合計, 15)
  │
  ▼ キャップ外ペナルティ
  ├── titleGapPenalty (-3/-6)
  ├── freshnessPenalty (-3〜-8)
  └── trustMQPenalty (-1.53/人)
  │
  ▼ finalMQ = clamp(baseMQ + cappedPositive + negative + penalties, 5, 100)
```
