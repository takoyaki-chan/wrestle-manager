# MQ外部ボーナス整理 実装仕様書

## 設計思想

MQ（Match Quality）は「試合そのものの質」を表す指標である。
選手のステータス・相性・戦術選択によって決まるべきであり、
試合の外側にある要素（ファンの声、プロモ、初顔合わせ等）でMQが嵩上げされるのは不適切。

本改修では、MQに影響を与える外部ボーナスのうち「試合の質」と因果関係が薄い項目を
MQから除外し、**集客（matchAppeal / attendance）** 側に移行する。

---

## 変更サマリー

| 区分 | 項目 | 現在のMQ効果 | 変更後 |
|------|------|-------------|--------|
| MQ廃止→集客移行 | A4 乱闘蓄積（pendingClash） | +1〜+2 | matchAppeal加算 |
| MQ廃止→集客移行 | A5 初顔合わせ | +2 | matchAppeal加算 |
| MQ廃止→集客移行 | A6 マンネリ | -1〜-5 | matchAppeal減算 |
| MQ廃止→集客移行 | D1 プロモスタック | +最大3.9 | 既存のdrawPower効果のみに統一 |
| MQ廃止→集客移行 | E1 ファン期待カード | +2.5 | 既存のmatchAppeal/attendance効果のみに統一 |
| 完全廃止 | D2 コーチMQ | 0（未実装） | 参照コード削除 |
| 完全廃止 | F1 タイトル格差ペナルティ | -3 or -6 | 廃止（試合結果自体で判断できる） |

MQ維持する項目（変更なし）：因縁MQ、好敵手、遺恨、タイトルマッチ+5、ラストラン、
満員/ガラガラ、会場スケール、trust低下、マイルストーン(mq_boost/next_match_mq)

---

## 1. A4 乱闘蓄積（pendingClashBonus）— MQ廃止→集客移行

### 現状
- `engine.js` L15356-15358: 週中イベントで `pendingClashBonus = 1〜2` を rivalries に蓄積
- `engine.js` L1318-1364: `getRivalryBonusForMatch()` 内で rivalryBonus.mqBonus に加算
- 試合後に `pendingClashBonus: 0` にリセット（L6908, L8722）

### 変更内容

#### 1a. MQから除外
`getRivalryBonusForMatch()` の各分岐で `+ pendingClashBonus` を mqBonus から削除。

```javascript
// Before
mqBonus: GOODRIVAL_MQ_BONUS + pendingClashBonus,
// After
mqBonus: GOODRIVAL_MQ_BONUS,
```

4箇所すべて（L1325, L1338, L1351, L1364）から `+ pendingClashBonus` を除去。

#### 1b. matchAppealに追加
`calcMatchAppeal()` に pendingClash による集客ブースト（乱闘があった→話題性→客が来る）を追加。

`MATCH_APPEAL_CONFIG` に新設定を追加:
```javascript
pendingClashAppeal: 15,  // 乱闘蓄積1あたりのappeal加算（MQ+1〜2より大きい効果）
```

`calcMatchAppeal()` 内で context から pendingClashBonus を受け取り加算:
```javascript
// 乱闘蓄積（週中衝突の話題性）
const clashAppeal = (context.pendingClashBonus || 0) * cfg.pendingClashAppeal;
const totalAppeal = avgDraw + parityBonus + rivalryAppeal + titleBonus + fanExpectBonus + heelFaceBonus + clashAppeal;
```

#### 1c. context への pendingClashBonus 受け渡し
興行カード組み立て時に各試合の context に `pendingClashBonus` を含める。
`getRivalryBonusForMatch()` の返り値に `pendingClashBonus` フィールドを追加し、
それを context 経由で matchAppeal に渡す。

#### 1d. Breakdown にも追加
`calcMatchAppealBreakdown()` に `clashAppeal` を追加して UI に表示。

#### 1e. リセット処理は既存のまま維持
試合後の `pendingClashBonus: 0` リセットはそのまま残す。

---

## 2. A5 初顔合わせ — MQ廃止→集客移行

### 現状
- `data.js` L2649: `FRESHNESS_CONFIG.firstMeetBonus: 2`
- `engine.js` L13342, L13349: `freshness.calc()` が `{ bonus: 2, label: '初顔合わせ' }` を返す
- `engine.js` L6853: `if (freshnessResult.bonus > 0) externalMQ += freshnessResult.bonus`

### 変更内容

#### 2a. MQから除外
`engine.js` の興行実行部（L6853付近）で、鮮度の**正方向ボーナス**を externalMQ に加算しない。

```javascript
// Before
if (freshnessResult.bonus > 0) externalMQ += freshnessResult.bonus;
// After
// 初顔合わせボーナスはMQに加算しない（集客側で効かせる）
```

#### 2b. matchAppealに追加
`MATCH_APPEAL_CONFIG` に新設定を追加:
```javascript
firstMeetAppeal: 8,  // 初顔合わせのappeal加算（未知のカードへの興味）
```

`calcMatchAppeal()` 内で初顔合わせ判定を行い加算:
```javascript
// 初顔合わせ（未知の対決への期待感）
const firstMeetBonus = context.isFirstMeet ? cfg.firstMeetAppeal : 0;
```

#### 2c. context への isFirstMeet 受け渡し
興行カード組み立て時に `Engine.freshness.calc()` を呼んで `bonus > 0` なら
`context.isFirstMeet = true` を設定。

注意: `freshness.calc()` は現在 externalMQ 計算時（L6848）に呼ばれている。
matchAppeal 計算は集客計算時（それより前）に行われるため、
matchAppeal 計算時にも freshness を判定する必要がある。
ただし matchupLog は試合前に参照できるので問題なし。

#### 2d. AI興行・決算興行にも同様に適用
AI団体の興行処理（L4414付近）と決算興行（L8674付近）でも同様の変更を行う。

---

## 3. A6 マンネリ — MQ廃止→集客減算

### 現状
- `engine.js` L6854: `const freshnessPenalty = freshnessResult.bonus < 0 ? freshnessResult.bonus : 0`
- `engine.js` L6868: `r.mq = ... + freshnessPenalty`（キャップ対象外で減算）
- マンネリ: -1〜-3、深刻: -2〜-4、完全: -3〜-5

### 変更内容

#### 3a. MQから除外
```javascript
// Before
const freshnessPenalty = freshnessResult.bonus < 0 ? freshnessResult.bonus : 0;
// ...
r.mq = Engine.util.clamp(r.mq + cappedPositive + negativeExternal + titleGapPenalty + freshnessPenalty + trustMQPenalty, 5, 100);

// After
// freshnessPenalty を MQ計算から完全に除外
r.mq = Engine.util.clamp(r.mq + cappedPositive + negativeExternal + trustMQPenalty, 5, 100);
```

#### 3b. matchAppealに減算追加
`MATCH_APPEAL_CONFIG` に新設定を追加:
```javascript
stalePenaltyPerCount: -8,  // マンネリ1段階あたりのappeal減算
stalePenaltyMax: -30,      // appeal減算の下限
```

`calcMatchAppeal()` 内でマンネリ判定を行い減算:
```javascript
// マンネリ（見飽きたカードは客が来ない）
const stalePenalty = context.freshnessCount >= 3
  ? Math.max((context.freshnessCount - 2) * cfg.stalePenaltyPerCount, cfg.stalePenaltyMax)
  : 0;
```

#### 3c. context への freshnessCount 受け渡し
matchupLog から直近ウィンドウ内の対戦回数を算出し context に含める。
`Engine.freshness.calc()` の返り値に `countInWindow` を追加するか、
別途カウント関数を用意する。

---

## 4. D1 プロモスタック — MQ廃止（集客は既存効果を維持）

### 現状
- **MQ効果**: `engine.js` L6749-6751 で `promoStackBonus` を計算、L6816 で externalMQ に加算
  - `PROMO_MQ_PER_STACK = 1.3`、最大3スタック → MQ +3.9
- **集客効果（既存）**: `drawPower` 内で `promoStack * 8` を加算（L826）
  - これは「プロモで話題になる → 客が来る」で因果が自然

### 変更内容

#### 4a. MQから除外
```javascript
// engine.js L6816 付近
// Before
if (r.promoStackBonus > 0) externalMQ += r.promoStackBonus;
// After
// promoStackBonus は MQ に加算しない（drawPower で集客に既に反映済み）
```

#### 4b. promoStackBonus の計算自体を削除
L6749-6751 の promoStackBonus 計算も不要になるため削除。
`result.promoStackBonus` フィールド自体を廃止。

#### 4c. 既存の集客効果はそのまま維持
- `drawPower` 内の `promoStack * promoStackPerMatch(8)` はそのまま
- `showDraw` 内の `nonMatchPromoStacks * promoStackGlobal(2)` もそのまま

#### 4d. AI興行・決算興行にも同様適用

---

## 5. E1 ファン期待カード — MQ廃止（集客は既存効果を維持）

### 現状
- **MQ効果**: `engine.js` L6829-6831 で `getMQBonus()` → +2.5
- **集客効果（既存）**:
  - `calcAttendance()` L687: 件数 × 8% の乗算ボーナス
  - `calcMatchAppeal()` L915: `fanExpectAppeal: 12` 加算
  - メディア収入: priority × 30万円
  - 興行評価 bonusScore: 1件あたり +4

### 変更内容

#### 5a. MQから除外
```javascript
// engine.js L6829-6831
// Before
const fanMQBonus = Engine.fanExpect.getMQBonus(r.left.id, r.right.id, fanExpects);
externalMQ += fanMQBonus;
if (fanMQBonus > 0) r.fanExpectMatch = true;

// After
// MQボーナスは廃止。fanExpectMatch フラグは集客・メディア判定に必要なので残す
const isFanExpectMatch = fanExpects.some(exp =>
  (exp.leftId === r.left.id && exp.rightId === r.right.id) ||
  (exp.leftId === r.right.id && exp.rightId === r.left.id)
);
if (isFanExpectMatch) r.fanExpectMatch = true;
// externalMQ への加算なし
```

#### 5b. `getMQBonus()` を廃止または常に0を返すように変更
```javascript
getMQBonus(fId1, fId2, expects) { return 0; },
```

#### 5c. 既存の集客効果はすべて維持
- attendance 乗算ボーナス（8%/件）→ そのまま
- matchAppeal の fanExpectAppeal: 12 → そのまま
- メディア収入 → そのまま
- 興行評価 bonusScore → そのまま

#### 5d. AI興行・決算興行にも同様適用

---

## 6. D2 コーチMQ — 完全廃止

### 現状
- `engine.js` L2667: `getMQBonusForMatch() { return 0; }` — 既に常時0
- L6747, L6815: 呼び出しと externalMQ 加算のコードが残存

### 変更内容

#### 6a. 呼び出し・加算コードの削除
- L6747: `result.coachMQBonus = Engine.coach.getMQBonusForMatch(...)` → 削除
- L6815: `if (r.coachMQBonus > 0) externalMQ += r.coachMQBonus` → 削除
- AI興行（L4414-4416）の同等コードも削除
- 決算興行（L8674-8677）の同等コードも削除

#### 6b. 関数定義の削除
- L2667: `getMQBonusForMatch` 関数自体を削除

---

## 7. F1 タイトル格差ペナルティ — 完全廃止

### 現状
- `engine.js` L6860-6862: titleOVRGap が 20超で -6、10超で -3
- MQ計算式（L6868）で `+ titleGapPenalty` として減算

### 変更内容

#### 7a. ペナルティ計算の削除
```javascript
// Before
let titleGapPenalty = 0;
if (r.isTitleMatch && r.titleOVRGap > 20) titleGapPenalty = -6;
else if (r.isTitleMatch && r.titleOVRGap > 10) titleGapPenalty = -3;

// After
// タイトル格差ペナルティ廃止（試合結果で自明に反映される）
```

#### 7b. MQ計算式から除去
```javascript
// Before
r.mq = Engine.util.clamp(r.mq + cappedPositive + negativeExternal + titleGapPenalty + freshnessPenalty + trustMQPenalty, 5, 100);
// After
r.mq = Engine.util.clamp(r.mq + cappedPositive + negativeExternal + trustMQPenalty, 5, 100);
```

#### 7c. externalMQBonus 記録からも除去
```javascript
// Before
r.externalMQBonus = cappedPositive + negativeExternal + titleGapPenalty + freshnessPenalty + trustMQPenalty;
// After
r.externalMQBonus = cappedPositive + negativeExternal + trustMQPenalty;
```

#### 7d. `r.titleGapPenalty` フィールド廃止
UI側で参照している場合は表示も削除。

---

## 8. UI表示の変更

### 8a. 試合結果のMQボーナス表示
externalMQBonus の内訳表示から、廃止した項目を除外。
残る表示項目: 因縁MQ、好敵手、遺恨、タイトルマッチ+5、ラストラン、
満員/ガラガラ、会場スケール、trust低下、マイルストーン

### 8b. matchAppeal Breakdown（集客力ツールチップ）
新しく追加された集客要素を表示に追加:
- 🥊 乱闘蓄積 +N
- 🆕 初顔合わせ +N
- 😴 マンネリ -N

### 8c. 興行評価のボーナス表示
fanExpectBonus は興行評価（bonusScore）には残るので変更なし。

---

## 9. 定数変更サマリー

### data.js 変更

```javascript
// MATCH_APPEAL_CONFIG に追加
pendingClashAppeal: 15,     // 乱闘蓄積1あたり（話題性大）
firstMeetAppeal: 8,          // 初顔合わせ
stalePenaltyPerCount: -8,   // マンネリ段階あたり
stalePenaltyMax: -30,        // マンネリ下限
```

### 定数バランスの根拠
- **pendingClashAppeal: 15**: 乱闘は大きな話題。MQ+1〜2より集客への影響が大きいはず。
  appeal +15〜30 は人気50台の選手1人分のdrawPower相当で、十分インパクトがある。
- **firstMeetAppeal: 8**: 初顔合わせは「ちょっと気になる」程度。
  ヒールvsベビー(6)より少し上。
- **stalePenaltyPerCount: -8**: 3回目で-8、4回目で-16、5回目で-24。
  マンネリカードは明確に客が離れる。
- **stalePenaltyMax: -30**: タイトルマッチ(+20)を相殺してもお釣りが来る厳しさ。

---

## 10. MQ_EXTERNAL_CAP の調整

項目数が減ったため、CAP値を見直す。

### 変更後にCAP対象として残る正方向ボーナス:
- 因縁MQ: +1〜4
- 好敵手/遺恨: +2
- タイトルマッチ: +5
- ラストラン: +2 (+3 メイン追加)
- 満員ボーナス: +1〜3
- 会場スケール: +1〜3
- mq_boost: +2
- next_match_mq: +5

理論最大: 4 + 2 + 5 + 5 + 3 + 3 + 2 + 5 = 29（ただし同時発生は稀）

**推奨: MQ_EXTERNAL_CAP は 15 → 12 に引き下げ**

理由: 5項目が消えたので天井を下げて、外部要因の影響力を全体的に縮小する。
残った項目はすべて「試合そのものの質に影響する因果がある」ため、
12あれば十分な幅がある。

---

## 11. テスト方針

### 11a. auto-sim 回帰テスト
- 100シーズンsimを回し、MQ分布（平均・標準偏差）の変化を確認
- 外部ボーナス廃止によりMQの分散が小さくなる（OVRと相性で決まる度合いが高まる）ことを検証
- ベストマッチ賞の受賞者が高OVRペアに集中しすぎないかをチェック

### 11b. 集客バランステスト
- 新しいappeal要素（乱闘蓄積、初顔合わせ、マンネリ）が集客に適切に反映されるか
- 既存のfanExpect集客効果とプロモ集客効果が変わっていないことを確認

### 11c. 興行評価テスト
- MQが全体的に下がるため、興行の星評価が過度に厳しくならないか確認
- 必要なら `SHOW_RATING_CONFIG.expectedMQTotal` を調整

---

## 12. 変更箇所一覧（ファイル別）

### engine.js
| 行番号（目安） | 変更内容 |
|----------------|----------|
| L1325,1338,1351,1364 | pendingClashBonus を mqBonus から除去 |
| L2667 | getMQBonusForMatch 削除 |
| L4414-4416 | AI興行: coachMQBonus 削除 |
| L6747 | coachMQBonus 計算削除 |
| L6749-6751 | promoStackBonus 計算削除 |
| L6815 | coachMQBonus の externalMQ 加算削除 |
| L6816 | promoStackBonus の externalMQ 加算削除 |
| L6829-6831 | fanExpect MQボーナス廃止（フラグは残す） |
| L6848-6854 | freshness の正方向ボーナスと負方向ペナルティをMQから除外 |
| L6860-6862 | titleGapPenalty 計算削除 |
| L6868 | MQ計算式から titleGapPenalty, freshnessPenalty 除去 |
| L6869 | externalMQBonus 記録から同上除去 |
| L8674-8677 | 決算興行: coachMQBonus 削除 |
| L13468-13472 | getMQBonus を return 0 に変更 or 削除 |
| calcMatchAppeal() | 初顔合わせ・マンネリ・乱闘蓄積を追加 |
| calcMatchAppealBreakdown() | 同上のBreakdown追加 |

### data.js
| 定数 | 変更内容 |
|------|----------|
| MATCH_APPEAL_CONFIG | pendingClashAppeal, firstMeetAppeal, stalePenaltyPerCount, stalePenaltyMax 追加 |
| MQ_EXTERNAL_CAP | 15 → 12 |
| PROMO_MQ_PER_STACK | 参照箇所が消えるため削除可能 |

### ui-render.js / ui-common.js
| 変更内容 |
|----------|
| MQボーナス内訳表示から廃止項目を除外 |
| matchAppeal Breakdownに新項目追加 |
| titleGapPenalty 表示削除 |
