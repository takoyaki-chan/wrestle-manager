# 🔧 MQスコア減点制リデザイン設計書 v2.0

> **ステータス**: 🟡 設計案（検証シミュレーション済み・承認待ち）
> **作成日**: 2026-03-03
> **前版**: mq-popularity-spec-v1.0.md
> **依存**: battle-engine-spec-v4.1b.md / economy-system-spec-v1.0.md
> **🔧マーク = 調整可能パラメータ**

---

## 変更の動機

### 現行加点制の問題

現行MQ（v1.0）は「加点制」で各要素を足し上げる設計だが、**弱い選手同士でもMQが高くなりすぎる**構造的欠陥がある。

| 問題 | 詳細 |
|------|------|
| OVの影響が薄い | OV40 avg=43 vs OV90 avg=60。たった17点差 |
| イベント発生がOV非依存 | カウンター・キックアウト等の頻度がOVで変わらない |
| 外部ボーナスで容易に上振れ | OV40+外部15 → max96（★★★★★到達可能） |
| 100点の価値が軽い | 全てが揃わなくても80超え可能 |

### 減点制の思想

**「天井から削る」** — OVが試合の品質上限を決め、ドラマ不足・テンポ不良・決着不良で減点される。全てが揃って初めて100点に到達できる。

```
MQ = 天井(OV) − ドラマ減点 − ペース減点 − 決着減点 + 外部ボーナス
```

---

## §1 天井（OVシーリング）

両選手の平均OVが「その試合で到達可能なMQの上限」を決める。

### §1.1 天井計算式

```javascript
const avgOV = (ov(charL) + ov(charR)) / 2;
let ceiling;
if (avgOV <= 50) {
  ceiling = 20 + avgOV * 0.60;          // OV30→38, OV40→44, OV50→50
} else if (avgOV <= 80) {
  ceiling = 50 + (avgOV - 50) * 1.10;   // OV60→61, OV70→72, OV80→83
} else {
  ceiling = 83 + (avgOV - 80) * 0.85;   // OV90→100, OV100→100
}
ceiling = clamp(Math.round(ceiling), 15, 100);  🔧
```

### §1.2 天井テーブル

| avgOV | 天井 | 到達可能な最高星 | 外部+15込み最高星 |
|:-----:|:----:|:--------------:|:---------------:|
| 30 | 38 | ★ | ★★ |
| 40 | 44 | ★★ | ★★ |
| 50 | 50 | ★★ | ★★★ |
| 60 | 61 | ★★★ | ★★★★ |
| 70 | 72 | ★★★ | ★★★★ |
| 80 | 83 | ★★★★ | ★★★★★ |
| 90 | 92 | ★★★★★ | ★★★★★ |
| 100 | 100 | ★★★★★ | ★★★★★ |

### §1.3 設計意図

- **低OV帯（30〜50）**: 天井が38〜50。どんなに良い展開でも★★止まり。外部全盛りでようやく★★〜★★★に届く
- **中OV帯（60〜70）**: 天井61〜72。ドラマ次第で★★★。外部込みで★★★★も視野に
- **高OV帯（80〜90）**: 天井83〜92。ここからが★★★★★圏内。外部込みで到達可能
- **超OV帯（100）**: 天井100。理論上の完璧な試合

**格差マッチの天井**: avgOVが下がるため、格上を出しても相手が弱いと天井が下がる。OV40 vs OV90 → avgOV65 → 天井67。

---

## §2 ドラマ減点

試合中の「見せ場」が少ないほどペナルティ。**基本30点減点から、イベント発生ごとに減点を軽減**する。

### §2.1 ドラマ減点計算

```javascript
let dramaPenalty = 30;  🔧  // 見せ場ゼロなら-30

// 各イベントが減点を「打ち消す」
dramaPenalty -= Math.min(kickouts, 2) * 8;       // キックアウト: 最大-16 🔧
dramaPenalty -= Math.min(counters, 3) * 2.5;     // カウンター: 最大-7.5 🔧
dramaPenalty -= Math.min(leadChanges, 3) * 1.5;  // リード逆転: 最大-4.5 🔧
dramaPenalty -= Math.min(bigMoves, 6) * 0.4;     // 大技(10+ダメ): 最大-2.4 🔧

dramaPenalty = Math.max(0, Math.round(dramaPenalty));
```

### §2.2 ドラマ減点の目安

| 試合展開 | KO | Cnt | 逆転 | 大技 | 減点 |
|---------|:--:|:---:|:---:|:---:|:----:|
| 何も起きない一方的試合 | 0 | 0 | 0 | 3 | **-29** |
| 最低限の見せ場 | 0 | 1 | 1 | 5 | **-23** |
| 平均的な試合 | 1 | 1 | 2 | 7 | **-16** |
| ドラマチックな好試合 | 2 | 2 | 3 | 8 | **-3** |
| 完璧な試合（理論上限） | 2 | 3 | 3 | 6+ | **0** |

### §2.3 設計意図

- **減点制だが「見せ場がある = 減点が減る」構造** — 加点制の逆。「見せ場がないのがデフォルト、あると回復」
- **キックアウトが最大の価値**（1回8点回復）— ドラマの最大要因
- **カウンターは中程度**（1回2.5点回復）— 流れが変わる瞬間の価値
- **大技は小さい**（1回0.4点）— 発生頻度が高い（平均7回）ので価値を抑制
- **上限あり**（KO2回、Cnt3回など）— 多すぎても追加価値なし

---

## §3 ペーシング減点

試合の長さが適切でないとペナルティ。

### §3.1 ペース減点テーブル

```javascript
let pacingPenalty = 0;
if (turns >= 7 && turns <= 14)       pacingPenalty = 0;   // 理想帯 🔧
else if (turns >= 5 && turns <= 16)  pacingPenalty = 3;   // 許容帯 🔧
else if (turns < 5)                  pacingPenalty = 12;  // スコアッシュ 🔧
else                                 pacingPenalty = 6;   // 長すぎ（タイムアップ域）🔧
```

### §3.2 設計意図

- 実測平均ターン数は8.6〜9.8。**7〜14ターンを理想帯**に設定
- 5ターン未満の瞬殺は-12の重いペナルティ
- 16ターン超はだらだら試合で-6
- 格差マッチは短くなりやすい → ペーシング減点が自然に発生

---

## §4 決着減点

決着タイプと決着フェーズによるペナルティ。

### §4.1 決着減点テーブル

```javascript
let finishPenalty = 0;

if (finType === 'fall' || finType === 'gu') {
  // Climaxフェーズでの決着 = 最高
  finishPenalty = (finishPhase === 'Climax') ? 0
    : (finishPhase === 'End') ? 1
    : 3;  🔧
}
else if (finType === 'pin')     finishPenalty = 0;  // サプライズフォール 🔧
else if (finType === 'rollup')  finishPenalty = 1;  // 丸め込み 🔧
else if (finType === 'tko')     finishPenalty = 2;  // 一方的 🔧
else if (finType === 'timeout') finishPenalty = 10; // 決着なし 🔧
```

### §4.2 設計意図

- **Climaxフェーズでのフォール/ギブアップ = ペナルティなし**（最も盛り上がる決着）
- **ピン = ペナルティなし**（「まさか！」のサプライズ価値）
- **タイムアップ = -10の重いペナルティ**（ファン不満）
- **TKO = -2**（一方的な印象は残るが見応えはある）
- 決着減点は最大でも-10。ドラマ減点ほどの影響力はない

---

## §5 最終MQ計算

### §5.1 合算式

```javascript
// §1〜§4の合算
let rawMQ = ceiling - dramaPenalty - pacingPenalty - finishPenalty;
let mq = clamp(Math.round(rawMQ), 5, 100);

// 特性ボーナス（減点制でも維持。天井を超える加点として機能）
if (Traits.has(charL, '名勝負製造機') || Traits.has(charR, '名勝負製造機')) mq += 5;
if (ovDiff > 15 && (Traits.has(charL, '引き出し上手') || Traits.has(charR, '引き出し上手'))) {
  mq += Math.min(8, ovDiff * 0.3);
}

mq = clamp(Math.round(mq), 5, 100);
```

### §5.2 外部MQボーナス（Pass 2、既存仕様を維持）

外部ボーナスの構造は変更なし。正方向キャップ +15（MQ_EXTERNAL_CAP）。

| ソース | 加点 | 備考 |
|-------|:----:|------|
| ライバル因縁 | +3/+4/+6 | rivalry-resolution-spec準拠 |
| タイトルマッチ | +10 | 世界王座 |
| コーチ（引き出し上手） | +2 | coach-lockerroom準拠 |
| 会場熱気（満員率） | +3〜-3 | CROWD_HEAT_MQ準拠 |
| 会場規模 | +0〜+3 | VENUE_SCALE_MQ準拠 |
| マイルストーンバフ | 可変 | mq_boost / next_match_mq |
| ファン期待度 | +5 | fanExpect準拠 |
| 野心トレイト | +2 | タイトルマッチ挑戦者 |

```javascript
// 既存コードそのまま
const positiveExternal = Math.max(0, externalMQ);
const negativeExternal = Math.min(0, externalMQ);
const cappedPositive = Math.min(positiveExternal, MQ_EXTERNAL_CAP);  // +15上限
mq = clamp(mq + cappedPositive + negativeExternal + titleGapPenalty, 5, 100);
```

---

## §6 シミュレーション結果（N=3000）

### §6.1 現行制 vs 減点制 比較

```
┌──────────────┬─────────────────────┬─────────────────────┐
│              │    現行（加点制）     │    提案（減点制）     │
│  マッチアップ  │  avg  med  max +15max│  avg  med  max +15max│
├──────────────┼─────────────────────┼─────────────────────┤
│ OV40同士       │  43.2   42   80   96  │  23.4   23   44   59  │
│ OV60同士       │  50.1   49   90  100  │  40.4   40   61   76  │
│ OV80同士       │  57.4   56   92  100  │  62.4   62   83   98  │
│ OV90同士       │  60.1   59   99  100  │  72.0   72   92  100  │
│ OV40vsOV90   │  44.0   42   86    -  │  38.3   38   67    -  │
└──────────────┴─────────────────────┴─────────────────────┘
```

### §6.2 減点制 星分布

| OV | 天井 | ☆ | ★ | ★★ | ★★★ | ★★★★ | ★★★★★ |
|:--:|:---:|:--:|:--:|:---:|:----:|:-----:|:------:|
| 30 | 38 | 63% | 37% | 0% | 0% | 0% | 0% |
| 40 | 44 | 39% | 60% | 1% | 0% | 0% | 0% |
| 50 | 50 | 7% | 79% | 14% | 0% | 0% | 0% |
| 60 | 61 | 0% | 49% | 50% | 0.3% | 0% | 0% |
| 70 | 72 | 0% | 5% | 73% | 22% | 0% | 0% |
| 80 | 83 | 0% | 0% | 44% | 47% | 9% | 0% |
| 90 | 92 | 0% | 0% | 6% | 56% | 38% | 0.4% |
| 100 | 100 | 0% | 0% | 1% | 36% | 43% | 20% |

### §6.3 重要な特性

1. **OV40+外部全盛り → max59（★★止まり）** — 弱い選手では絶対に★★★★★に到達しない
2. **OV60+外部全盛り → max76（★★★★の下限）** — 中堅で好条件全部揃えてギリギリ★★★★
3. **OV90+外部全盛り → max100（★★★★★到達可能）** — トップが全盛りで初めて到達
4. **★★★★★が出る確率は OV100同士でも20%** — 真にレアな最高評価

---

## §7 既存システムへの影響

### §7.1 変更が必要な箇所

| 箇所 | 変更内容 |
|------|---------|
| `engine.js` L374-391 | MQ計算ロジックを天井−減点式に書き換え |
| `engine.js` simulateMatch 戻り値 | `finishPhase` を追加（決着時のフェーズ名） |

### §7.2 変更不要な箇所

| 箇所 | 理由 |
|------|------|
| Pass 2 外部MQ処理 (L2959-3005) | そのまま維持。内部MQの計算だけ変わる |
| 星評価変換 | 閾値変更なし（20/40/60/75/90） |
| 人気変動テーブル (§2.4 of v1.0) | MQ→人気変換はそのまま |
| Heat変動 | showMQ平均への影響は間接的 |
| 集客計算 | 変更なし |
| ショーレーティング加重平均 | 変更なし |

### §7.3 バランスへの波及

減点制によりMQ平均が下がるため、以下の調整が**必要になる可能性**がある（実装後の検証で判断）：

| 項目 | 懸念 | 対応案 |
|------|------|--------|
| 序盤のHeat低下速度 | MQ平均が下がる→Heat維持が困難に | Heat変動テーブル(§4.4 of v1.0)の閾値を-5〜-10下方修正 |
| 団体人気の伸び | 同上 | 団体人気変動テーブル(§3.3 of v1.0)の閾値を下方修正 |
| 個人人気の伸び | ★★帯(MQ40-59)の+2が主流に | 必要なら★★帯の人気変動を+3に上方修正 |
| アワード（ベストバウト）| 年間最高MQが下がる | 表彰閾値を調整 |

---

## §8 実装スコープ

### §8.1 engine.js 変更（最小差分）

```javascript
// simulateMatch内: finishPhaseを記録（既存のwinner設定箇所に追加）
// L318あたり: if (!escaped) { winner = atkSide; finType = finLabel; finishPhase = ph.name; }
// L326あたり: winner = atkSide; finType = 'ピン'; finishPhase = ph.name;
// 他の決着箇所も同様

// L374-391: MQ計算を書き換え
// ── 旧: 加点制 ──
// let mq = 0;
// mq += Math.min(30, avgOV * 0.35);
// ...

// ── 新: 減点制 ──
let ceiling;
if (avgOV <= 50) ceiling = 20 + avgOV * 0.60;
else if (avgOV <= 80) ceiling = 50 + (avgOV - 50) * 1.10;
else ceiling = 83 + (avgOV - 80) * 0.85;
ceiling = Math.round(Engine.util.clamp(ceiling, 15, 100));

let dramaPenalty = 30;
dramaPenalty -= Math.min(totalKickouts, 2) * 8;
dramaPenalty -= Math.min(totalCounters, 3) * 2.5;
dramaPenalty -= Math.min(leadChanges, 3) * 1.5;
dramaPenalty -= Math.min(bigMoves, 6) * 0.4;
dramaPenalty = Math.max(0, Math.round(dramaPenalty));

let pacingPenalty = 0;
if (matchTurns >= 7 && matchTurns <= 14) pacingPenalty = 0;
else if (matchTurns >= 5 && matchTurns <= 16) pacingPenalty = 3;
else if (matchTurns < 5) pacingPenalty = 12;
else pacingPenalty = 6;

let finishPenalty = 0;
// finType/finishPhaseに応じた減点（§4.1参照）

let mq = ceiling - dramaPenalty - pacingPenalty - finishPenalty;
// 特性ボーナス（名勝負製造機 +5、引き出し上手 +min(8, ovDiff*0.3)）
mq = Math.round(Engine.util.clamp(mq, 5, 100));
```

### §8.2 戻り値への追加

```javascript
return {
  // 既存フィールドは全て維持
  left: charL, right: charR, winner, finType, finMove,
  turns: matchTurns, hpLeft, hpRight, mq, log,
  // 追加
  finishPhase,          // 決着フェーズ（'Opening'/'Mid'/'End'/'Climax'/'Timeout'）
  mqDetail: { ceiling, dramaPenalty, pacingPenalty, finishPenalty }  // デバッグ用
};
```

---

## §9 MQ仕様書v1.0との差分サマリー

| v1.0 の項目 | v2.0 での扱い |
|------------|-------------|
| §1 MQスコア Base/Drama/Pacing/Finish/Bonus 5構成 | → **天井 − ドラマ減点 − ペース減点 − 決着減点** に再構成。Bonusは外部ボーナス(Pass2)に統合 |
| §1.3 Base（10〜35） | → **天井(15〜100)** に置換。OVの影響を大幅に強化 |
| §1.4 Drama（0〜35加点） | → **ドラマ減点(0〜-30)** に反転。イベント不足がペナルティ |
| §1.5 Pacing（-10〜+10） | → **ペース減点(0〜-12)** に。理想帯は加点ゼロ |
| §1.6 Finish（-5〜+15） | → **決着減点(0〜-10)** に。良い決着は「ペナルティなし」 |
| §1.7 Bonus（0〜30） | → 外部ボーナス(Pass2, cap+15)に一本化。内部MQからは分離 |
| §1.8 星評価閾値 | → **変更なし**（☆/★/★★/★★★/★★★★/★★★★★ = 20/40/60/75/90） |
| §2〜§7 人気/団体人気/Heat/集客 | → **変更なし**（MQの値域0-100は同じ。分布が変わるのみ） |
| §8 ヒール相性補正 | → 外部ボーナスとして維持（Pass2の+15キャップ内数） |
| §9 ライバル度MQ補正 | → 外部ボーナスとして維持 |

---

## §10 未決事項

- [ ] 実装後のHeat/団体人気変動テーブル再調整（§7.3参照）
- [ ] 天井曲線の微調整（実プレイ感覚によるチューニング）
- [ ] ドラマ減点の各係数チューニング（キックアウト=8は適切か？）
- [ ] 序盤シーズンの経済バランス検証（MQ低下→収入低下の連鎖確認）
- [ ] アワード閾値の調整

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-03 | v2.0 減点制リデザイン設計書 初版作成。天井制+ドラマ/ペース/決着減点のシミュレーション検証済み |
