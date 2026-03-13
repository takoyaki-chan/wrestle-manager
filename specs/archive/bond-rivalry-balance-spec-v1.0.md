# Bond/Rivalry バランス改善スペック v1.0

> 2026-03-13 作成
> 目的: bondのプラス偏重を是正し、rivalryに決着リセットを導入し、他団体ライバルを育てやすくする

---

## 1. 概要

### 1.1 解決する問題

1. **Bond がプラス一辺倒**: 週次プラス+47/シーズン vs マイナス-26〜-33/シーズンで、全員が均一に仲良くなる
2. **Rivalry にリセットがない**: 高rivalryが徐々に減衰するだけで、「因縁の終わり」という体験がない
3. **他団体ライバルが育たない**: 非接触時の減衰が強すぎて、年2〜3回しか戦えない他団体相手ではrivalryが蓄積しない

### 1.2 設計方針

- まず **ネガティブイベント追加** でbondのバラつきを生む
- 全体ボーナス（同団体ボーナス等）の調整は **シミュレーション結果を見てから判断**
- rivalryリセットは **一発インパクト** で体験できるようにする

---

## 2. Rivalry リセットシステム

### 2.1 因縁決着の強化（M-10改修）

**既存の因縁決着** を rivalry リセットに強化する。

| 項目 | 現状 | 変更後 |
|---|---|---|
| 発動条件 | rivalry60+, 4戦以上, MQ50+ | **変更なし** |
| rivalry変動 | -8〜-5（双方） | → **0〜10にリセット**（双方） |
| bond変動 | +5〜+10（双方） | **変更なし** |

**実装箇所**: `applyMatchResult` 内 M-10 セクション

```
// 変更前
apply('AB', 'rivalryResolution', context.stage, 5, 10, -8, -5, false);
apply('BA', 'rivalryResolution', context.stage, 5, 10, -8, -5, false);

// 変更後: applyではなく直接リセット
const resetValue = Engine.rng.float(rng) * 10; // 0〜10
rAB.rivalry = Engine.relationships._clampAxisValue(resetValue, 'rivalry');
rBA.rivalry = Engine.relationships._clampAxisValue(resetValue, 'rivalry');
// bond は既存のapplyのまま
apply('AB', 'rivalryResolution', context.stage, 5, 10, 0, 0, false);
apply('BA', 'rivalryResolution', context.stage, 5, 10, 0, 0, false);
```

### 2.2 宿命の決着（M-14 新設）

高rivalry + 高bond + 名勝負で「戦いを超えて認め合った」リセット。

| 項目 | 値 |
|---|---|
| 条件 | rivalry80+ **かつ** bond60+ **かつ** MQ75+ |
| rivalry変動 | → **0〜5にリセット**（双方） |
| bond変動 | **+5〜+10**（双方） |
| 逓減 | なし（同一ペアで人生に何度も起きてよい） |
| 因縁決着(M-10)との排他 | **M-14が優先**。M-14条件を満たす場合はM-10は発動しない |

**判定の順序**: M-14チェック → 不成立ならM-10チェック

```javascript
// M-14: 宿命の決着（M-10より先に判定）
if (rAB.rivalry >= 80 && rAB.bond >= 60 && rBA.rivalry >= 80 && rBA.bond >= 60 && context.mq >= 75) {
  const resetValue = Engine.rng.float(rng) * 5; // 0〜5
  rAB.rivalry = Engine.relationships._clampAxisValue(resetValue, 'rivalry');
  rBA.rivalry = Engine.relationships._clampAxisValue(resetValue, 'rivalry');
  apply('AB', 'destinySettled', context.stage, 5, 10, 0, 0, false);
  apply('BA', 'destinySettled', context.stage, 5, 10, 0, 0, false);
  context._destinySettled = true; // M-10スキップ用フラグ
}

// M-10: 因縁決着（M-14不成立時のみ）
if (context.rivalryResolved && !context._destinySettled) {
  // ... 2.1のリセット処理
}
```

**スナップショット通知**: `destinySettled` をソースとして通知。重み: 8（最高レベル）

### 2.3 引退時の凍結

引退した選手との rivalry は **凍結** する（減衰しない、記録として残る）。

| 項目 | 値 |
|---|---|
| トリガー | 選手が引退した時（通常引退、モチベ喪失引退、怪我引退すべて） |
| 処理 | 引退者を含む全ペアに `frozen: true` フラグを付与 |
| 効果 | 週次decayの対象から除外。bond/rivalryの値がそのまま保持される |

**実装**: `processWeeklyRelationships` のループ冒頭で `frozen` チェックを追加

```javascript
for (const key of Object.keys(rels)) {
  const r = rels[key];
  if (r.frozen) { newRels[key] = r; continue; } // 凍結ペアはスキップ
  // ... 既存の減衰処理
}
```

**凍結のタイミング**: 引退処理時（`O-04` 等）で関係値更新した **後に** frozen フラグを付与

---

## 3. Bond ネガティブイベント

### 3.1 N-01: ポジション競合の嫉妬

**コンセプト**: 同じ立場なのに片方だけタイトル戦に出た。「なぜ私じゃない？」

| 項目 | 値 |
|---|---|
| 条件 | 同団体 + OVR差5以内 + 同スタイル + 片方がタイトル戦出場・片方が不出場 |
| 効果 | 不出場側→出場側: bond **-3〜-5**, rivalry **+3〜+5** |
| タイミング | 興行終了時（`applyShowContextEffects` 内） |
| 逓減 | なし（毎回発火するが、タイトル戦自体の頻度が制限） |

**既存C-04（タイトル戦不出場の嫉妬）との関係**: C-04は「タイトル戦出場者全員」に対して全不出場者から嫉妬が飛ぶ汎用処理。N-01は「同スタイル＋OVR近接」の特定ペアに **追加で** 重ねがけ。C-04は残す。

**実装イメージ**:
```javascript
// N-01: ポジション競合（C-04の後に追加）
if (titleMatches.length > 0) {
  for (const nonTitleId of jealousIds) {
    const nonTitleChar = roster.find(c => c.id === nonTitleId);
    if (!nonTitleChar) continue;
    for (const tId of titleIds) {
      const titleChar = roster.find(c => c.id === tId);
      if (!titleChar) continue;
      const ovrDiff = Math.abs(Engine.util.ov(nonTitleChar) - Engine.util.ov(titleChar));
      if (ovrDiff <= 5 && nonTitleChar.style === titleChar.style) {
        s = Engine.relationships.applyToRoster(s, nonTitleId, [tId],
          { min: -5, max: -3 }, { min: 3, max: 5 }, rng);
      }
    }
  }
}
```

### 3.2 N-02: 成長格差の嫉妬

**コンセプト**: 同期なのに差がついた。「あいつだけ先に行った」

| 項目 | 値 |
|---|---|
| 条件 | 同団体 + 年齢差3以内 + 片方がブレイクスルーした + もう片方のOVRが低い |
| 効果 | 取り残された側→成長した側: bond **-2〜-4**, rivalry **+3〜+5** |
| タイミング | ブレイクスルー発生時（`applyBreakthroughEffect` の拡張） |
| 逓減 | なし（ブレイクスルー自体が稀） |

**既存G-01との関係**: G-01は「OVR近接の全キャラ→本人に rivalry +3〜+5」。N-02は同団体＋同世代の特定ペアに **bond マイナスを追加**。

**実装イメージ**:
```javascript
// N-02: 成長格差の嫉妬（applyBreakthroughEffect内に追加）
const sameOrgSameGen = allChars.filter(c =>
  c.id !== fighterId &&
  c.orgId === fighter.orgId &&      // 同団体
  Math.abs(c.age - fighter.age) <= 3 && // 同世代
  Engine.util.ov(c) < selfOvr       // OVRが低い側
);
if (sameOrgSameGen.length > 0) {
  const jealousIds = sameOrgSameGen.map(c => c.id);
  s = Engine.relationships.applyFromRoster(s, jealousIds, fighterId,
    { min: -4, max: -2 }, { min: 3, max: 5 }, rng);
}
```

### 3.3 N-03: ベビーフェイス×ヒール衝突

**コンセプト**: 控室で正義派と悪役派がぶつかる。「あんたのやり方は気に入らない」

| 項目 | 値 |
|---|---|
| 条件 | 同団体 + role対立（Babyface × Heel）+ 4%/週で発火 |
| 効果 | 双方: bond **-3〜-6**, rivalry **+2〜+4** |
| タイミング | 週次処理（`processWeeklyRelationships` 内、新セクション） |
| 逓減 | なし（低頻度なので不要。48週×4% ≈ 年2回） |
| Neutral | **関与しない**。BabyfaceとHeelのペアだけが対象 |

**発火対象の選出**: 毎週、同団体内の BF×Heel ペアの中から1組をランダム選出（4%で発火）

**実装イメージ**:
```javascript
// N-03: Babyface×Heel衝突（週次処理に新設）
// 全団体（プレイヤー + AI）について処理
const processRoleClash = (orgRoster, rng) => {
  const bfIds = orgRoster.filter(c => c.role === 'Babyface' && !c.injury).map(c => c.id);
  const heelIds = orgRoster.filter(c => c.role === 'Heel' && !c.injury).map(c => c.id);
  if (bfIds.length === 0 || heelIds.length === 0) return;

  // 全BF×Heelペアに対して4%の発火判定
  for (const bfId of bfIds) {
    for (const heelId of heelIds) {
      if (Engine.rng.float(rng) >= 0.04) continue; // 96%で不発
      // 双方にbond↓ rivalry↑
      const keyAB = Engine.relationships._key(bfId, heelId);
      const keyBA = Engine.relationships._key(heelId, bfId);
      const bondDelta = -(3 + Engine.rng.float(rng) * 3); // -3〜-6
      const rivalryDelta = 2 + Engine.rng.float(rng) * 2;  // +2〜+4
      // ... apply処理
    }
  }
};
```

**スナップショット通知**: `roleClash` をソースとして通知。「控室でAとBが口論になった」系テンプレート

### 3.4 N-04: 人気逆転の複雑な感情

**コンセプト**: 後輩の人気が先輩を超えた。「あの子が、私より…」

| 項目 | 値 |
|---|---|
| 条件 | 同団体 + 年齢差5以上 + 若手のpopが年長者を初めて超えた瞬間 |
| 効果 | 年長者→若手: bond **-3〜-5**, rivalry **+2〜+4** |
| タイミング | 興行終了後のpop更新時 |
| 発火制限 | 同一ペアで **1回限り**（`popOvertakeTriggered` フラグで管理） |

**「初めて超えた」の判定**: 各ペアの pop 大小関係を保持し、逆転を検知する。

**実装イメージ**:
```javascript
// N-04: 人気逆転（興行終了後）
// state.popOvertakeTriggered = { "seniorId>juniorId": true, ... }
const triggered = state.popOvertakeTriggered || {};
for (const senior of roster) {
  for (const junior of roster) {
    if (senior.id === junior.id) continue;
    if ((senior.age || 20) - (junior.age || 20) < 5) continue; // 年齢差5未満はスキップ
    const pairKey = `${senior.id}>${junior.id}`;
    if (triggered[pairKey]) continue; // 既に発火済み
    if ((junior.pop || 0) > (senior.pop || 0)) {
      // 逆転発生
      s = Engine.relationships.applyToRoster(s, senior.id, [junior.id],
        { min: -5, max: -3 }, { min: 2, max: 4 }, rng);
      triggered[pairKey] = true;
    }
  }
}
s = { ...s, popOvertakeTriggered: triggered };
```

### 3.5 N-05: スランプの八つ当たり

**コンセプト**: 苦しい時に一番近い人に当たる。「ほっといてよ…！」

| 項目 | 値 |
|---|---|
| 条件 | スランプ突入時 + 同団体内のbond最高の相手 |
| 効果 | スランプ者→bond最高相手: bond **-4〜-7** / 相手→スランプ者: bond **-1〜-3** |
| rivalry | ±0（八つ当たりは敵意ではなく苦しみの発散） |
| タイミング | スランプ突入判定時（`checkSlump` 等） |
| 発火制限 | スランプ突入1回につき1回 |

**「bond最高の相手」の特定**: 同団体ロスターから、スランプ者→相手方向のbondが最高のペアを選出。bond50未満なら不発（八つ当たる相手がいない）。

**実装イメージ**:
```javascript
// N-05: スランプの八つ当たり
const findHighestBondTarget = (state, fighterId) => {
  const rels = state.relationships || {};
  const roster = state.roster || [];
  let maxBond = 50; // 50未満なら不発
  let targetId = null;
  for (const c of roster) {
    if (c.id === fighterId || c.injury) continue;
    const key = Engine.relationships._key(fighterId, c.id);
    const r = rels[key];
    if (r && r.bond > maxBond) {
      maxBond = r.bond;
      targetId = c.id;
    }
  }
  return targetId;
};

// スランプ突入時に呼び出し
const targetId = findHighestBondTarget(state, fighterId);
if (targetId) {
  // スランプ者→相手: bond -4〜-7
  s = Engine.relationships.applyToRoster(s, fighterId, [targetId],
    { min: -7, max: -4 }, { min: 0, max: 0 }, rng);
  // 相手→スランプ者: bond -1〜-3
  s = Engine.relationships.applyFromRoster(s, [targetId], fighterId,
    { min: -3, max: -1 }, { min: 0, max: 0 }, rng);
}
```

---

## 4. 他団体ライバル構築システム

### 4.1 knownRival フラグ

| 項目 | 値 |
|---|---|
| 付与条件 | rivalry が **40以上** に達した時点で自動付与 |
| 効果 | 非接触時のrivalry週次減衰を **1/3** に抑制 |
| 解除条件 | rivalry が **10未満** に下がった場合に解除 |
| 保存場所 | `relationships[key].knownRival: true/false` |

**実装箇所**: `processWeeklyRelationships`

```javascript
// knownRival フラグ管理
if (rivalry >= 40 && !r.knownRival) {
  r.knownRival = true;
}
if (rivalry < 10 && r.knownRival) {
  r.knownRival = false;
}

// 非接触時の減衰にフラグを適用
if (!inContact) {
  let rivalryDecay = 0.16;
  if (rivalry >= 85) rivalryDecay += 0.45;
  else if (rivalry >= 70) rivalryDecay += 0.28;
  else if (rivalry >= 50) rivalryDecay += 0.14;
  else if (rivalry >= 30) rivalryDecay += 0.06;

  // knownRival なら減衰を1/3に
  if (r.knownRival) rivalryDecay *= (1 / 3);

  rivalry -= rivalryDecay;
}
```

### 4.2 乱入・対抗戦の Rivalry ブースト強化

他団体との接点イベントで得られる rivalry を **1.5倍** にする。

| イベント | 現状 | 変更後 |
|---|---|---|
| 乱入（B-1a） | 実装にrivalry付与なし（監査時の提案値） | → 新設: **+12〜+18** |
| 対抗戦（E-03） | 対戦者同士 +5〜+8 | → **+8〜+12** |
| 対抗戦チャレンジ（B-5b） | 対戦者同士 +5〜+10 | → **+8〜+15** |

### 4.3 「意識している」週次マイクロイベント

| 項目 | 値 |
|---|---|
| 条件 | knownRival フラグあり + 非接触（他団体）+ 4週に1回 |
| 効果 | rivalry **+0.3〜+0.5** |
| 上限 | rivalry 60まで（これ以上は試合で稼ぐ必要あり） |

```javascript
// 「意識している」マイクロイベント
if (!inContact && r.knownRival && absWeek % 4 === 0 && rivalry < 60) {
  rivalry += 0.3 + Engine.rng.float(rng) * 0.2;
}
```

---

## 5. スナップショット通知連携

以下のイベントをスナップショット通知システムに登録する。

| ソース名 | トリガー | 重み | テンプレート例 |
|---|---|---|---|
| `destinySettled` | 宿命の決着 | 8 | 「{A}と{B}の宿命の物語がついに幕を閉じた」 |
| `rivalryResolutionReset` | 因縁決着（リセット版） | 6 | 「{A}と{B}の因縁に決着がついた」 |
| `roleClash` | BF×Heel衝突(N-03) | 3 | 「控室で{A}と{B}が口論になった」 |
| `positionJealousy` | ポジション競合(N-01) | 2 | 「{A}は{B}のタイトル戦出場に複雑な表情を浮かべた」 |
| `growthJealousy` | 成長格差(N-02) | 3 | 「{A}は同期の{B}の成長ぶりに焦りを感じている」 |
| `popOvertake` | 人気逆転(N-04) | 4 | 「後輩{B}の人気が{A}を超えた」 |
| `slumpLashout` | 八つ当たり(N-05) | 4 | 「スランプの{A}が{B}に当たり散らした」 |
| `knownRivalAware` | 他団体ライバル意識 | 1 | （低重みのため通常は通知されない） |

---

## 6. 実装の優先順位

| 順 | 項目 | 理由 |
|---|---|---|
| 1 | Rivalryリセット（§2.1, §2.2） | 既存コードの修正で済む。体験インパクト最大 |
| 2 | knownRivalフラグ（§4.1） | 週次処理への追加のみ。他団体ライバルの基盤 |
| 3 | N-03: BF×Heel衝突 | 週次処理への新設。頻度が安定しておりバランス検証しやすい |
| 4 | N-01: ポジション競合 | 興行処理への追加。C-04と同じ場所で実装 |
| 5 | N-05: スランプ八つ当たり | スランプ処理への追加 |
| 6 | N-02: 成長格差 | ブレイクスルー処理への追加 |
| 7 | N-04: 人気逆転 | 新規状態(popOvertakeTriggered)の管理が必要 |
| 8 | 引退時凍結（§2.3） | 全引退処理に影響。慎重にテスト |
| 9 | 乱入・対抗戦ブースト（§4.2） | 数値変更のみ |
| 10 | 意識マイクロイベント（§4.3） | knownRival依存。§4.1の後 |

---

## 7. 検証計画

### 7.1 シミュレーション（実装前）

100シーズン自動シミュレーションで以下を計測:

- **Bond分布**: 全ペアのbond値のヒストグラム（現状 vs 変更後）
  - 期待: 50±20に広がるベルカーブ → 30〜80にバラつく多峰分布
- **Rivalryリセット発生回数**: シーズンあたり平均何回因縁決着/宿命の決着が起きるか
  - 期待: 因縁決着 1〜3回/シーズン、宿命の決着 0〜1回/シーズン
- **他団体rivalry**: 最高到達値、knownRival保持率
  - 期待: rivalry40+の他団体ペアが常時2〜4組存在
- **N-01〜N-05発火回数**: 各イベントのシーズンあたり発生頻度
  - 期待: N-01(8〜12), N-02(1〜4), N-03(2〜6), N-04(0〜2), N-05(0〜2)

### 7.2 実装後の観察ポイント

- bondが極端に低い（20未満）ペアが多すぎないか
- N-03(BF×Heel)が特定ペアに偏りすぎていないか
- rivalryリセットが「あっけない」と感じないか（スナップショット通知の演出で補う）
- knownRivalが多すぎて減衰抑制が効きすぎていないか
