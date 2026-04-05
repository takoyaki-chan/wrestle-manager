# 📣 プロモシステム設計書 v1.0

> **ステータス**: 🟢 確定
> **作成日**: 2026-03-06（再同期: 2026-04-06）
> **依存**: weekly-gameloop-spec-v1_0.md / battle-engine-spec-v4.2.md
> **実装箇所**: management.js (tickWeek promo処理, Engine.economy.calcPromoEventIncome), data.js (PROMO_POP_CAP, PROMO_EVENT_INCOME_CURVE, PROMO_EVENT_NAMES, SHOW_DRAW_CONFIG)
> **🔧マーク = 調整可能パラメータ**

---

## 設計原則

1. **プロモ＝商売** — 握手会、ファンイベント、SNS配信、グッズ販売会。試合の外で人気を上げ、直接収入を得る
2. **練習とのトレードオフ** — プロモに充てた週は練習できない。人気か成長か、社長の判断
3. **蓄積が試合を盛り上げる** — promoStackはMQボーナスに直結し、集客にも貢献する

---

## §1 人気上昇

### §1.1 基本仕様

| 項目 | 仕様 |
|------|------|
| 週次行動 | 「プロモ」選択時に人気上昇 |
| 基本上昇量 | **+1.5** × coachMult 🔧 |
| 上限 | PROMO_POP_CAP = **100** 🔧 |

### §1.2 人気逓減カーブ

| pop帯 | 倍率 🔧 | 実効上昇/週 |
|--------|--------|:----------:|
| 0–19 | ×1.0 | +1.5 |
| 20–34 | ×0.6 | +0.9 |
| 35–49 | ×0.35 | +0.53 |
| 50–64 | ×0.18 | +0.27 |
| 65–70 | ×0.13 | +0.20 |
| 75+ | ≈0 | 実質天井 |

---

## §2 プロモ収入

### §2.1 収入カーブ

区間線形補間:

```
PROMO_EVENT_INCOME_CURVE = [
  [0, 10], [15, 20], [30, 40], [45, 55], [60, 70], [75, 85], [100, 95]
]
```

| pop | 収入(万) | イベント例 |
|-----|:-------:|----------|
| 0–15 | 10–20 | 地域イベント、商店街キャンペーン |
| 30 | 40 | 握手会、ファンミーティング |
| 45 | 55 | トークショー、グッズ販売会 |
| 60 | 70 | 大型イベント出演 |
| 75 | 85 | TV番組出演、雑誌撮影会 |
| 100 | 95 | スペシャルショー |

### §2.2 精算

`_pendingPromoIncomes` 経由で `processSettlement` にて表示・加算。

---

## §3 promoStack（MQボーナス蓄積）

### §3.1 蓄積ルール

| アクション | 効果 |
|-----------|------|
| プロモ実行 | `promoStack = min(3, promoStack + 1)` |
| 試合参加 | MQボーナス適用後 `promoStack = 0`（全消費） |
| シーズン末 | `promoStack = 0`（リセット） |

### §3.2 MQボーナス

```
promoBonus = promoStack × 1.3  // 1人あたり
試合では max(left.promoBonus, right.promoBonus) を適用
```

| stack | MQボーナス 🔧 |
|:-----:|:-----------:|
| 1 | +1.3 |
| 2 | +2.6 |
| 3 | +3.9 |

> **比較**: 因縁+2, 宿敵+4, コーチMQ+2〜3。3スタックは宿敵に匹敵。

### §3.3 集客貢献

```
drawPower += promoStack × SHOW_DRAW_CONFIG.promoStackPerMatch  // 8/stack 🔧
```

---

## §4 AI行動ロジック

### §4.1 バランスモード自動判定

```
if (isShowWeek && (pop < PROMO_POP_CAP || promoStack < 3)) {
  action = 'promo'
} else {
  action = 'practice'
}
```

興行週はプロモ優先。pop上限到達 **かつ** stack上限到達で練習に切り替え。

---

## §5 salaryBonusの年次減衰

契約交渉で付与された `salaryBonus` はシーズン末に自然減衰:

```
salaryBonus = round(salaryBonus × 0.8)
if (salaryBonus <= 1) salaryBonus = 0
```

<!-- 再同期: 2026-04-06, 指示書: docs/specs-resync-instruction.md -->
