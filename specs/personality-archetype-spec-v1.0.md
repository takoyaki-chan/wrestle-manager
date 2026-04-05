# 🎭 性格・アーキタイプシステム設計書 v1.0

> **ステータス**: 🟢 確定
> **作成日**: 2026-04-06（実装からの逆起こし）
> **依存**: character-data-spec-v1.7.md
> **実装箇所**: relationships.js (PERSONALITY_BOND_MATRIX, ARCHETYPE_BOND_MATRIX), management.js (getPersonalityType), data.js (ALL_CHARS personality/archetype)
> **🔧マーク = 調整可能パラメータ**

---

## 設計原則

1. **性格は感情のベース** — 交渉、関係性、セリフのトーンを決める基盤
2. **アーキタイプは表現の型** — 同じ性格でも「お嬢様の怒り」と「不良の怒り」は違う
3. **相性は確率ではなく傾向** — 相性値にガウスノイズを加え、個々の化学反応を生む

---

## §1 性格（Personality）

### §1.1 6種+1

| 性格 | 英名 | 特徴 |
|------|------|------|
| 普通 | normal | バランス型。特性ベースフォールバック |
| 熱血 | bold | 闘争心が強い。攻撃的な交渉 |
| 寡黙 | quiet | 控えめ。遠慮がちな対話 |
| 気楽 | easygoing | リラックス。軽いノリ |
| 真面目 | earnest | 努力家気質。筋を通す |
| 情熱 | emotional | 感情豊か。怒りも喜びも大きい |
| 内気 | shy | 臆病。声が小さい（一部キャラ） |

### §1.2 getPersonalityType 変換

`personality` フィールドが明示されている場合はそれを優先。`normal` の場合は特性ベースで判定:

| personality | 対話タイプ |
|------------|----------|
| bold | bold |
| quiet → | introverted |
| easygoing → | carefree |
| earnest | earnest |
| emotional | emotional |
| normal | 特性フォールバック |

---

## §2 アーキタイプ（Archetype）

### §2.1 6種

| アーキタイプ | 英名 | 特徴 |
|------------|------|------|
| 普通 | normal | 標準。相性マトリクスで無視 |
| お嬢様 | ojousama | 上品・格式重視 |
| 不良 | delinquent | 粗暴・反抗的 |
| クール | cool | 冷静・距離を置く |
| 妖艶 | seductive | 魅惑的・色気 |
| 礼儀正しい | polite | 丁寧・謙虚 |

---

## §3 関係性への影響

### §3.1 Personality Bond マトリクス（対称）

| ペア | Bond調整 🔧 | 理由 |
|------|:--------:|------|
| 同一性格 | +2 | 波長が合う |
| earnest × earnest | +4 | 努力の相互認知 |
| bold × bold | +3 | 競争的エネルギー |
| easygoing × easygoing | +3 | 安心できる空気 |
| bold × quiet | -3 | エネルギーレベルの不一致 |
| earnest × easygoing | -3 | 仕事観の衝突 |
| emotional × quiet | -2 | 温度差 |

### §3.2 Archetype Bond マトリクス（対称、normalは無視）

| ペア | Bond調整 🔧 | 理由 |
|------|:--------:|------|
| 同一アーキタイプ | +1 | 基本共感 |
| ojousama × ojousama | +3 | 育ちの理解 |
| polite × ojousama | +3 | 礼儀の調和 |
| cool × cool | +2 | 距離感の尊重 |
| delinquent × delinquent | +2 | アウトロー共感 |
| delinquent × ojousama | **-6** | 根本的世界観の衝突 |
| delinquent × polite | -4 | 礼儀との衝突 |
| cool × emotional | -3 | 距離 vs 情熱 |
| seductive × earnest | -2 | 色気 vs 誠実さ |

### §3.3 Personality Rivalry 調整

| ペア | Rivalry調整 🔧 |
|------|:----------:|
| bold × bold | +3 |
| earnest × earnest | +2 |
| quiet × quiet | -2 |

### §3.4 ガウスノイズ

初期化時に全調整値にノイズを加算:
- Bond: σ = **2.5** 🔧
- Rivalry: σ = **1.5** 🔧

---

## §4 成長への影響

| 性格特性 | 週次variance範囲 🔧 |
|---------|:-----------------:|
| 努力家 | 0.75–1.5（安定） |
| 破天荒 | 0.0–2.5（ハイリスク） |
| 通常 | 0.5–1.5 |

---

## §5 タレント活動相性（B4イベント）

### §5.1 Personality × Activity 倍率

| 性格 | CM | グラビア | バラエティ | ブランド | ファッション | ファンイベ |
|------|:--:|:------:|:--------:|:------:|:---------:|:--------:|
| bold | 1.5 | 1.0 | 1.0 | 1.0 | 1.0 | 0.5 |
| earnest | 1.0 | 0.5 | 1.0 | 1.0 | 0.5 | 1.5 |
| normal | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| easygoing | 1.0 | 1.5 | 1.5 | 1.0 | 1.0 | 1.0 |
| quiet | 0.5 | 1.0 | 0.5 | 1.5 | 0.5 | 1.0 |
| emotional | 1.0 | 1.5 | 1.5 | 0.5 | 1.5 | 1.5 |
| shy | 0.5 | 0.5 | 0.5 | 1.0 | 0.5 | 1.0 |

### §5.2 Archetype ボーナス（+0.2）

| Activity | 対象アーキタイプ |
|----------|-------------|
| グラビア | seductive |
| ファッション | seductive, ojousama |
| ブランド | ojousama, cool |
| CM | cool |
| バラエティ | delinquent |
| ファンイベ | polite |

---

## §6 セリフ・ボイス解決

personality × archetype の組み合わせでセリフテンプレートを選択:
- 交渉セリフ（CONTRACT_NEGOTIATION_LINES）
- ケアリアクション（CARE_REACTION）
- 選択イベント（CHOICE_EVENT）
- 対抗戦（WAR_DIALOGUE）
- スナップショット通知（SNAPSHOT_TEXTS）
- 試合中カットイン（CUTIN_LINES）

<!-- 再同期: 2026-04-06, 指示書: docs/specs-resync-instruction.md -->
