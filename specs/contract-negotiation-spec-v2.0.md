# 📝 契約交渉イベント設計書 v2.0

> **ステータス**: 🟢 確定
> **作成日**: 2026-03-05（再同期: 2026-04-06）
> **依存**: trust-system-spec-v2.1.md / character-data-spec-v1.7.md / weekly-gameloop-spec-v1_0.md
> **実装箇所**: management.js (Engine.contract), data.js (CONTRACT_NEGOTIATION_CONFIG, CONTRACT_NEGOTIATION_LINES)
> **🔧マーク = 調整可能パラメータ**

---

## 設計原則

1. **シーズン開幕の緊張感** — 契約更新は経営判断の場。信頼を疎かにしたツケがここで来る
2. **性格が滲む交渉** — 5性格×6アーキタイプで異なるセリフ・態度。テンプレ交渉にしない
3. **社長の選択が結果を変える** — 受諾/交渉/拒否の3択に正解はない

---

## §1 発生タイミング

| 項目 | 仕様 |
|------|------|
| 発生週 | **offWeek 2**（シーズン開幕前） |
| 対象 | 低trust or 給与ギャップの選手 |
| 最大人数 | **4名/シーズン** 🔧 |

---

## §2 対象選出

### §2.1 給与ギャップ計算

```
fairSalary = getSalary(currentOVR, currentPop)
currentSalary = getSalary(contractOVR, contractPop)  // 契約時点で固定
gapRatio = fairSalary / currentSalary
```

| ギャップ水準 | gapRatio |
|------------|---------|
| なし | < 1.1 |
| 軽度 | 1.1–1.3 |
| 大きい | ≥ 1.3 |

### §2.2 深刻度スコア

```
score = (100 - trust) + (gapRatio - 1.0) × 100
```

上位4名を交渉対象として選出。

---

## §3 交渉マトリクス

Trust帯と給与ギャップの組み合わせで交渉の種類が決まる:

| Trust帯 | ギャップなし | 軽度 | 大きい |
|---------|:----------:|:----:|:-----:|
| **75+** | 自動残留 | 丁寧な昇給要求 | 昇給要求（強め） |
| **40–74** | 自動残留 | 昇給要求 | 昇給要求（強い） |
| **30–39** | 昇給要求（軽度） | 昇給要求（不満） | 昇給要求（怒り） |
| **15–29** | 移籍志願 | 移籍志願（強い） | 移籍志願（怒り） |
| **<15** | 移籍最後通牒 | 突然退団リスク30% | 突然退団リスク50% |

---

## §4 昇給要求の処理

### §4.1 昇給額計算

```
baseRaisePct = 0.15 + (pop / 100) × 0.10     // pop 0→15%, pop 100→25%
ovrFactor = (ovr / 60) ^ 1.5                  // OVR 60 = 1.0基準
raiseAmount = clamp(currentSalary × baseRaisePct × ovrFactor, 3, 30) // 万
```

### §4.2 対抗案

```
counterOffer = max(2, ceil(raiseAmount × 0.5))
```

### §4.3 選択肢と結果

| 選択 | 効果 |
|------|------|
| A: 受諾 | salaryBonus += raiseAmount, trust **+12** 🔧 |
| B: 交渉 | 成功50% → salaryBonus += counterOffer, trust **+6** 🔧; 失敗 → trust **-8** 🔧, 40%で移籍に昇格 |
| C: 拒否 | trust **-15** 🔧, 40%で移籍志願に昇格, 60%で不満残留 |

### §4.4 交渉成功率

```
successRate = 0.50 + (trust - 30) × 0.01 + (mental - 50) × 0.005
忠誠心: +0.15 | 野心: -0.10 | 反骨心: -0.15
clamp(0.15, 0.85)
```

---

## §5 移籍志願の処理

### §5.1 選択肢

| 選択 | 効果 |
|------|------|
| A: 引き留め | 残留率チェック（§5.2）→ 失敗で退団 |
| B: 話を聞く | 理由セリフ → A or C 再選択 |
| C: 放出 | 即退団 |

### §5.2 残留率

```
baseRate = 0.55 + (trust - 15) × 0.015 + careerSeasons × 0.03
忠誠心: +0.20 | 反骨心: -0.15
初期メンバー: +0.10
ギャップ補正: 軽度 -0.10, 大きい -0.20
clamp(0.10, 0.80)
```

### §5.3 引き留めボーナス

```
weeksFactor = 8 + floor(ovr / 20)
retentionBonus = ceil(currentSalary × weeksFactor)  // 万
```

---

## §6 退団先

| 優先度 | 行き先 | 条件 |
|--------|--------|------|
| 1 | ライバル団体移籍 | AI団体の空き枠あり |
| 2 | フリーエージェント | 上記不可の場合 |
| 3 | 引退 | 高齢 or OVR低下 |

---

## §7 性格タイプシステム

### §7.1 性格→対話タイプ変換

| personality | 対話タイプ |
|------------|----------|
| bold | aggressive |
| quiet | introverted |
| easygoing | carefree |
| earnest | earnest |
| emotional | emotional |
| normal | 特性ベースフォールバック |

### §7.2 セリフ構造

5性格 × 2態度（要求/離脱）× 分岐 = 約30パターン

**コンテキスト変数:**

| 変数 | 内容 |
|------|------|
| `{tenure}` | 在籍年数テキスト |
| `{record}` | 勝率テキスト |
| `{rivalry}` | ライバル名 or 空 |
| `{wins}/{losses}/{n}` | 数値 |

---

## §8 salaryBonusの永続性

- `salaryBonus` は週給に永続加算（フィールドとして保持）
- シーズン末に自然減衰: `salaryBonus = round(salaryBonus × 0.8)`、1以下で0にリセット

---

## §9 Trust連動の昇給割引

| 定数 | 値 🔧 |
|------|------|
| threshold | 40 |
| maxDiscount | 0.08 |

trust 40 → 0%割引、trust 100 → 8%割引（線形補間）。昇給要求額に適用。

<!-- 再同期: 2026-04-06, 指示書: docs/specs-resync-instruction.md -->
