# 因縁決着システム設計仕様 (rivalry-resolution-spec.md)

> v2.0 — 2026-03-04 設計承認済み
> v1.0 — 2026-03-03（初版）

## 概要

因縁システムに「決着」のゴールを設け、**発生→盛り上がり→決着→報酬**のサイクルを作る。
プレイヤーが因縁ペアを意識してカードを組み、いい試合で決着をつけると、
目に見える報酬と演出で「やった！」というカタルシスを得られるようにする。

### v2.0 変更点

1. **ラベル変更**: 因縁→宿敵→宿命の相手（旧:永遠のライバル）→好敵手（新）
2. **決着上限**: 同一ペア最大2回。以降は「好敵手」に移行（物語完結）
3. **カード鮮度システム新設**: 初顔合わせMQボーナス＋マンネリMQペナルティ

## 現状の問題（v1.0時点 + v2.0追加）

1. 因縁matchesカウンターが増えるだけで減衰・リセットがない
2. 一度因縁になると毎週「決着を望む声」が出続けて陳腐化
3. 期待カードで試合を組んでも、結果のフィードバックが弱い
4. **（v2.0）** 決着後にmatches=0リセット→再び宿敵→決着の無限サイクルが可能。後半でpop/orgPopインフレの原因になる
5. **（v2.0）** 同カード繰り返しにペナルティがなく、レンタル選手を借りるインセンティブが生まれない
6. **（v2.0）** 「永遠のライバル」ラベルが大げさ。高OVR帯では宿敵(4戦)で即決着するため永遠のライバル(7戦)に到達困難

---

## §1. 因縁段階（v2.0改定）

### 1.1 段階定義

| 段階 | 必要matches | MQボーナス | ラベル色 | 絵文字 | 決着 |
|---|---|---|---|---|---|
| 因縁 | 2 | +3 | #fdcb6e | ⚡ | 不可 |
| 宿敵 | 4 | +4 | #e17055 | 🔥 | 1回目可 |
| 宿命の相手 | 7 | +6 | #d63031 | 💥 | 2回目可 |
| 好敵手 | 決着2回完了 | +2 | #74b9ff | 🤝 | なし |

### 1.2 好敵手への移行

同一ペアで決着が2回成立すると、以降は「好敵手」ステータスに永続移行する。

```javascript
// rivalriesエントリに resolutionCount を追加
// { matches, lastWeek, lastResolvedWeek, resolutionCount }

// 決着時: resolutionCount をインクリメント
// resolutionCount >= 2 の場合: 好敵手に移行
// 好敵手: { matches: 0, resolved: true, resolutionCount: 2 }
```

好敵手の効果:
- MQボーナス +2 が永続（対戦するたびに自動適用）
- 決着は発生しない（pop/orgPopスパイクなし）
- UIに「🤝 好敵手」ラベルが常時表示される

### 1.3 RIVALRY_THRESHOLDS 変更

```javascript
// data.js
const RIVALRY_THRESHOLDS = [
  {matches:2, label:'因縁',     mqBonus:3, color:'#fdcb6e', emoji:'⚡'},
  {matches:4, label:'宿敵',     mqBonus:4, color:'#e17055', emoji:'🔥'},
  {matches:7, label:'宿命の相手', mqBonus:6, color:'#d63031', emoji:'💥'}
];

// 好敵手は RIVALRY_THRESHOLDS ではなく resolved フラグで判定
const GOODRIVAL_MQ_BONUS = 2;
const GOODRIVAL_LABEL = '好敵手';
const GOODRIVAL_EMOJI = '🤝';
const GOODRIVAL_COLOR = '#74b9ff';
```

---

## §2. 決着条件

### 2.1 基本条件

```
因縁レベルが「宿敵」以上（matches >= 4）の状態で、
その2人の試合を組み、MQ >= 動的閾値 の試合をした場合 → 決着成立
```

ただし、resolutionCount に応じて必要段階が変わる:

| 決着回数 | 必要段階 | 必要matches |
|---|---|---|
| 1回目 | 宿敵以上 | >= 4 |
| 2回目 | 宿命の相手 | >= 7 |
| 3回目以降 | 不可 | — |

### 2.2 動的閾値（v2.1）

固定MQ50ではなく、対戦者の平均OVRから算出される天井の80%を閾値とする。
下限30、上限50（高OVR帯は従来と同等の体験を維持）。

```javascript
// 天井計算（battle-engine §1 と同一式）
let ceiling;
if (avgOV <= 50) ceiling = 20 + avgOV * 0.60;
else if (avgOV <= 80) ceiling = 50 + (avgOV - 50) * 1.10;
else ceiling = 83 + (avgOV - 80) * 0.85;
ceiling = clamp(ceiling, 15, 100);

// 動的閾値
const threshold = min(50, max(30, round(ceiling * 0.80)));
```

| 平均OVR | 天井 | 決着閾値 | 備考 |
|:---:|:---:|:---:|------|
| 30 | 38 | 30 | 低OVR帯でも決着可能 |
| 35 | 41 | 33 | |
| 40 | 44 | 35 | |
| 45 | 47 | 38 | |
| 50 | 50 | 40 | |
| 60 | 61 | 49 | |
| 65+ | 67+ | 50 | 上限 |

- MQ < 閾値 の場合：「不完全燃焼」として因縁は残存（matchesも維持）
- 因縁レベル「因縁」（matches 2-3）では決着不可（まだドラマが足りない）

---

## §3. 決着時の処理

### 3a. データ変更

```javascript
// 決着判定（checkResolution を拡張）
checkResolution(rivalLvl, mq, avgOV, resolutionCount) {
  resolutionCount = resolutionCount || 0;
  if (resolutionCount >= 2) return null; // 好敵手: もう決着しない

  // 2回目の決着は宿命の相手(7+)が必要
  const requiredMatches = resolutionCount === 0 ? 4 : 7;
  if (!rivalLvl || rivalLvl.matches < requiredMatches) return null;

  // 動的閾値（従来通り）
  // ...threshold計算...
  if (mq < threshold) return null;

  const isFate = rivalLvl.matches >= 7; // 宿命の相手からの決着
  return {
    isFate,
    popBonus: isFate ? 6 : 4,
    orgPopBonus: isFate ? 2.5 : 1.5,
    newResolutionCount: resolutionCount + 1,
  };
}
```

### 3b. 報酬適用

| 項目 | 宿敵決着（1回目） | 宿命の相手決着（2回目） |
|---|---|---|
| 両選手 popularity | +4 | +6 |
| orgPop | +1.5 | +2.5 |
| 演出 | 決着ポップアップ | 最終決着ポップアップ（強化版） |
| 決着後 | matchesリセット、再蓄積可能 | 好敵手に永続移行 |

- popularity加算は逓減カーブの影響を受けない直接加算
- orgPop加算も直接加算（逓減の対象外）
- **1ペアの生涯合計**: pop最大+10（4+6）、orgPop最大+4.0（1.5+2.5）

### 3c. リセット処理

```javascript
// 1回目の決着後
rivalries[key] = {
  matches: 0, lastWeek: G.week,
  lastResolvedWeek: G.week,
  resolutionCount: 1
};

// 2回目の決着後（好敵手移行）
rivalries[key] = {
  matches: 0, lastWeek: G.week,
  lastResolvedWeek: G.week,
  resolutionCount: 2,
  resolved: true  // 好敵手フラグ
};
```

---

## §4. クールダウン

```javascript
// ファン期待カード生成時（Engine.fanExpect.generate）
// 同ペアの lastResolvedWeek から4週未満なら候補から除外

if (rv.lastResolvedWeek && (state.week - rv.lastResolvedWeek) < 4) return; // skip
```

- 4週間の空白期間で「また同じカードばかり」を防止
- 空白期間後も matches が 0 なので、再び2回対戦するまで因縁は発生しない
- つまり最短でも **4週クールダウン + 2試合（因縁発生まで）** = 実質6-8週の間隔

---

## §5. カード鮮度システム（v2.0新設）

### 5.1 概要

全試合を対象に、同一ペアの対戦頻度に応じてMQにボーナス/ペナルティを適用する。
レンタル選手や新戦力の投入に明確なインセンティブを与え、後半のインフレを抑制する。

### 5.2 対戦履歴の記録

```javascript
// GameState に追加
// matchupLog: 直近の対戦履歴を記録
// [{leftId, rightId, week}, ...]
// 最大保持: 直近12興行分（それより古いエントリは自動削除）
```

### 5.3 鮮度テーブル

直近12興行ウィンドウで同一ペアの対戦回数を集計し、MQに加算:

| 対戦回数 | MQ効果 | ラベル |
|---|---|---|
| 初対戦（過去に一度も対戦なし） | **+2** | 初顔合わせ |
| 1回（ウィンドウ内） | ±0 | — |
| 2回 | ±0 | — |
| 3回 | **-3** | マンネリ |
| 4回 | **-5** | 深刻なマンネリ |
| 5回以上 | **-8** | 完全なマンネリ |

```javascript
// data.js
const FRESHNESS_CONFIG = {
  windowShows: 12,        // 直近12興行を対象
  firstMeetBonus: 2,      // 初顔合わせボーナス
  penalties: [
    // { minCount, mqPenalty }
    { minCount: 3, mqPenalty: -3 },
    { minCount: 4, mqPenalty: -5 },
    { minCount: 5, mqPenalty: -8 },
  ],
};
```

### 5.4 初顔合わせの判定

「過去に一度も対戦したことがない」ペアを初顔合わせとする。
matchupLog 全履歴（12興行ウィンドウではなくゲーム通算）に存在しないペアが対象。

- レンタル選手: 自団体の全選手と初対戦 → 全試合に MQ+2
- 新規スカウト選手: 同様に初対戦ボーナスが得られる
- 一度でも対戦すれば以降は通常（±0〜マンネリ）

### 5.5 MQ_EXTERNAL_CAPとの関係

鮮度ボーナス/ペナルティは外部MQボーナスの一部として扱い、MQ_EXTERNAL_CAP(+15) の対象とする。
ただし鮮度ペナルティ（マイナス）はキャップ対象外（ペナルティは常に全額適用）。

### 5.6 因縁との相互作用

鮮度ペナルティと因縁MQボーナスは**両方適用**される（相殺される）:

```
1戦目: 初顔合わせ+2
2戦目: 鮮度±0 → 因縁発展(+3)
3戦目: 鮮度-3 + 因縁(+3) = ±0
4戦目: 鮮度-5 + 宿敵(+4) = -1 → 決着チャンスだがMQ不利
```

因縁を育てる価値はあるが、引っ張るほどジリ貧になる。
「ここで決着させたい」というタイミング判断が重要。

### 5.7 演出

- マンネリ発生時: 興行結果に「😐 〇〇 vs △△ — ファンにマンネリの空気…（MQ-3）」表示
- 初顔合わせ時: 「✨ 〇〇 vs △△ — 初顔合わせの緊張感！（MQ+2）」表示

### 5.8 レンタルとの連携

レンタル選手の主要な価値:
1. 全試合が初顔合わせ → MQ+2で興行品質の底上げ
2. 既存ペアのローテーション緩和 → マンネリ試合の発生を抑制
3. 因縁が育つ前に契約終了 → 新鮮さの循環

---

## §6. 演出

### 6a. 決着ポップアップ（専用）

通常のイベントポップアップとは別に、因縁決着専用のモーダルを表示。

```
┌─────────────────────────────────┐
│     🔥 宿敵決着！               │
│  ────────────────────────────   │
│  [勝者アイコン]  VS  [敗者アイコン]  │
│                                 │
│  勝者セリフ:                     │
│  「ようやく決着がついた…最高の相手だった」│
│                                 │
│  敗者セリフ:                     │
│  「負けた…でも、あなたとの試合は誇り」 │
│                                 │
│  ── 決着ボーナス ──              │
│  📈 両選手の人気 +4              │
│  🏢 団体人気 +1.5               │
│                                 │
│         [ OK ]                  │
└─────────────────────────────────┘
```

宿命の相手決着時（2回目決着）:
```
┌─────────────────────────────────┐
│     💥 宿命の相手 — 最終決着！    │
│  ────────────────────────────   │
│  ...（強化版演出）...             │
│                                 │
│  🤝 ふたりは「好敵手」になった    │
│                                 │
│         [ OK ]                  │
└─────────────────────────────────┘
```

### 6b. セリフデータ

```javascript
const RIVALRY_RESOLUTION_LINES = {
  winner: [
    'ようやく決着がついた…最高の相手だった',
    'この勝利は、あの人がいたから掴めた',
    '何度でも言う。あなたは最高のライバルだ',
    'この拳が届いた…それだけで十分だ',
    '終わった…でも、この因縁に感謝している',
  ],
  loser: [
    '負けた…でも、この試合は誇りに思う',
    '悔しい。でも、あなたが強かった。それだけだ',
    '次は…いや、今はこの敗北を受け入れる',
    'ありがとう。あなたのおかげで強くなれた',
    '完敗だ。でも私はまだ終わらない',
  ],
  fateWinner: [  // 旧 eternalWinner
    'この物語に終止符を打てた…感無量だ',
    '長かった。でも、あなたなしでは辿り着けなかった',
    'これが最終章。最高のエンディングだった',
  ],
  fateLoser: [  // 旧 eternalLoser
    'あなたには敵わなかった。でも、この戦いは宝物だ',
    '幾度となく戦った。すべてが私の財産だ',
    '最後まで…全力だった。悔いはない',
  ],
};
```

### 6c. 宣戦布告セリフデータ

```javascript
const RIVALRY_CONFRONTATION_LINES = {
  pairs: [
    ['今日こそ、決着をつける', '……望むところよ'],
    ['何度やっても結果は同じだ', 'それは終わってから言いなさい'],
    ['この因縁、今夜終わりにしよう', '最後にふさわしい試合にしましょう'],
    // ...
  ],
  fatePairs: [  // 旧 eternalPairs
    ['長かった……この物語に、終止符を打つ', 'ええ……最高の結末を見せましょう'],
    ['何度も戦った。でも今日が最後だ', 'わかっている。だから全力で来なさい'],
    // ...
  ],
};
```

### 6d. 専用SE

サウンドオーバーホール案の `award` 系音、または新規 `resolve` SE。
ベル系ハーモニクス＋歓声ノイズで「決着の余韻」を表現。

---

## §7. 既存コードへの変更箇所

| ファイル | 変更内容 |
|---|---|
| data.js | RIVALRY_THRESHOLDS ラベル変更（永遠のライバル→宿命の相手） |
| data.js | FRESHNESS_CONFIG 定数追加 |
| data.js | GOODRIVAL_* 定数追加 |
| data.js | RIVALRY_RESOLUTION_LINES キー名変更（eternal→fate） |
| data.js | RIVALRY_CONFRONTATION_LINES キー名変更（eternalPairs→fatePairs） |
| engine.js | `checkResolution()`: resolutionCount引数追加、2回上限＋段階必要matches |
| engine.js | `getRivalryLevel()`: resolved=true時は好敵手を返す |
| engine.js | `recordRivalry()`: resolved=true時はmatches加算しない |
| engine.js | MQ計算: 鮮度ボーナス/ペナルティを外部MQに加算 |
| engine.js | `executeShow`: matchupLog記録の追加 |
| engine.js | `Engine.fanExpect.generate()`: lastResolvedWeek クールダウン判定（変更なし） |
| app.js | 決着処理: resolutionCount更新、resolved=true設定 |
| app.js | matchupLog のGameState管理 |
| ui-common.js | 好敵手ラベル表示対応 |
| ui-common.js | 鮮度演出メッセージ |
| ui-render.js | 因縁表示のラベル/色更新 |

### マイグレーション

- 既存rivalriesエントリに `resolutionCount: 0` をデフォルト追加
- matchupLog 未存在時は空配列で初期化
- 既存のラベル参照（UI文字列比較）があれば更新

---

## §8. バランスメモ

### 因縁サイクル制限

- 1ペア生涯: 最大2回の決着（pop合計+10、orgPop合計+4.0）
- 1回目決着後の再蓄積: 4週CD + 4試合(宿敵) = 最短8興行
- 2回目決着は宿命の相手(7戦)必要 → 1回目決着後から最短11興行（CD4+試合7）
- 2回目決着後は好敵手（MQ+2のみ、決着なし）

### カード鮮度の影響

- 6人ロスター × 3試合/興行 × 12興行 = 36枠 ÷ 15ペア = 平均2.4回
  - 一部ペアが3回目に到達しMQ-3。レンタル1人(→7人,21ペア)で大幅緩和
- 10人ロスター × 4試合 × 12興行 = 48枠 ÷ 45ペア = 平均1.07回
  - マンネリはほぼ発生しない。意図的な繰り返しのみペナルティ対象
- レンタル選手の価値: 全試合MQ+2 × 3試合/興行 = 1興行あたりavgMQ +1〜2の底上げ

### 因縁×鮮度の相互作用

| 対戦 | 鮮度 | 因縁 | 合計MQ効果 |
|---|---|---|---|
| 1戦目 | +2(初顔) | — | +2 |
| 2戦目 | ±0 | +3(因縁) | +3 |
| 3戦目 | -3 | +3(因縁) | ±0 |
| 4戦目 | -5 | +4(宿敵) | -1 |
| 5戦目 | -8 | +4(宿敵) | -4 |
| 7戦目 | -8 | +6(宿命) | -2 |

→ 因縁を引っ張るほどMQが不利に。「ここで決着」の判断が重要。
