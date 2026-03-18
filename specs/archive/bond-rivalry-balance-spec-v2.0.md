# Bond/Rivalry バランス改善スペック v2.0（統合版）

> 2026-03-13 作成
> v1.0本体 + 追補（試合勝敗非対称 & Bond修正）を統合
> 
> **実装状態**: v1.0の§2〜§4 が先行実装済みの場合、§8〜§9 のみ追加実装すること。
> 全て未実装の場合はこのスペック全体を新規実装すること。

---

## 1. 概要

### 1.1 解決する問題

1. **Bond がプラス一辺倒**: 週次プラス+47/シーズン vs マイナス-26〜-33/シーズンで、全員が均一に仲良くなる
2. **通常の試合でbondが自動上昇する**: 殴り合っただけで仲良くなるのは不自然。名勝負だけが特別であるべき
3. **試合の勝敗でrivalryに差がつかない**: 圧勝以外は勝者も敗者も同じrivalry変動。「負けた方が悔しい」が表現されていない
4. **Rivalry にリセットがない**: 高rivalryが徐々に減衰するだけで、「因縁の終わり」という体験がない
5. **他団体ライバルが育たない**: 非接触時の減衰が強すぎて、年2〜3回しか戦えない他団体相手ではrivalryが蓄積しない

### 1.2 設計方針

- まず **ネガティブイベント追加** と **試合ベースライン修正** でbondのバラつきを生む
- 全体ボーナス（同団体ボーナス等）の調整は **シミュレーション結果を見てから判断**
- rivalryリセットは **一発インパクト** で体験できるようにする
- 試合の勝敗は **非対称** にして「負けた方が相手を意識する」を表現する

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

```javascript
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
| 条件 | rivalry80+ **かつ** bond60+ **かつ** MQ75+（双方向とも条件を満たすこと） |
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

### 2.3 引退時の凍結

引退した選手との関係値は **凍結** する（減衰しない、記録として残る）。

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

## 3. 試合ベースライン修正

### 3.1 M-01: 全試合ベースライン

**問題**: 試合しただけで bond +0〜+1 が入る。殴り合った相手と自動的に仲良くなるのは不自然。

**方針**: bond を ±0 に変更。rivalry を勝敗で非対称化。

| 方向 | 現状 | 変更後 |
|---|---|---|
| 勝者→敗者 bond | +0〜+1 | **±0** |
| 敗者→勝者 bond | +0〜+1 | **±0** |
| 勝者→敗者 rivalry | +0.3〜+1.0 | **+0.1〜+0.5**（勝った余裕） |
| 敗者→勝者 rivalry | +0.3〜+1.0 | **+0.8〜+2.0**（負けた悔しさ） |
| 引き分け時 rivalry | +0.3〜+1.0 | **+0.5〜+1.0**（双方。変更小） |

```javascript
// ═══ M-01: ベースライン（勝敗非対称） ═══
if (isDraw) {
  apply('AB', 'match', context.stage, 0, 0, 0.5, 1.0, true);
  apply('BA', 'match', context.stage, 0, 0, 0.5, 1.0, true);
} else {
  const winDir = aWon ? 'AB' : 'BA';
  const loseDir = aWon ? 'BA' : 'AB';
  apply(winDir, 'match', context.stage, 0, 0, 0.1, 0.5, true);  // 勝者→敗者
  apply(loseDir, 'match', context.stage, 0, 0, 0.8, 2.0, true); // 敗者→勝者
}
```

### 3.2 M-02: 僅差の好勝負

**問題**: bond +2〜+4 は過剰。僅差の好勝負は頻繁に発生するため、bondプラスの主要供給源になっている。

| 方向 | 現状 | 変更後 |
|---|---|---|
| 双方 bond | +2〜+4 | **±0〜+1** |
| 双方 rivalry | +5〜+8 | **変更なし** |

```javascript
// ═══ M-02: 僅差の好勝負 ═══
if (isCloseMatch) {
  apply('AB', 'closeMatch', context.stage, 0, 1, 5, 8, true);
  apply('BA', 'closeMatch', context.stage, 0, 1, 5, 8, true);
}
```

### 3.3 M-06改: タイトルマッチ（勝敗非対称）

**問題**: タイトル戦は勝者と敗者で意味が全く違うのに、対称 +8〜+12 になっている。

| 状況 | rivalry変動 |
|---|---|
| 王者が防衛成功 → 王者→挑戦者 | **+4〜+7** |
| 王者が防衛成功 → 挑戦者→王者 | **+10〜+15**（「あのベルトが欲しい」） |
| 挑戦者が奪取成功 → 新王者→前王者 | **+5〜+8** |
| 挑戦者が奪取成功 → 前王者→新王者 | **+12〜+18**（「取り返したい」） |

**既存M-06を完全置き換え。**

```javascript
// ═══ M-06改: タイトルマッチ（勝敗非対称） ═══
if (context.isTitleMatch && !isDraw) {
  const winDir = aWon ? 'AB' : 'BA';
  const loseDir = aWon ? 'BA' : 'AB';

  if (context.isChampionA !== undefined) {
    const champWon = (context.isChampionA && aWon) || (context.isChampionB && bWon);
    if (champWon) {
      // 防衛成功: 王者→挑戦者 +4〜+7, 挑戦者→王者 +10〜+15
      apply(winDir, 'titleMatch', context.stage, 0, 0, 4, 7, true);
      apply(loseDir, 'titleMatch', context.stage, 0, 0, 10, 15, true);
    } else {
      // 王座奪取: 新王者→前王者 +5〜+8, 前王者→新王者 +12〜+18
      apply(winDir, 'titleMatch', context.stage, 0, 0, 5, 8, true);
      apply(loseDir, 'titleMatch', context.stage, 0, 0, 12, 18, true);
    }
  } else {
    // 王者情報がない場合は汎用（勝者 +4〜+7, 敗者 +10〜+15）
    apply(winDir, 'titleMatch', context.stage, 0, 0, 4, 7, true);
    apply(loseDir, 'titleMatch', context.stage, 0, 0, 10, 15, true);
  }
}
```

**context 拡張**: `isChampionA`, `isChampionB`（boolean）を呼び出し元で設定する。

### 3.4 変更しないもの

| イベント | bond | 理由 |
|---|---|---|
| M-04 名勝負 MQ80+ | +3〜+6 維持 | 特別な体験の共有。年に数回しか起きない |
| M-13 キャリアベストMQ | +2〜+3 維持 | 人生最高の試合をくれた相手への敬意 |
| M-10 因縁決着 | +5〜+10 維持 | §2.1でrivalryリセット化済み |
| M-05 PPV/GRAND FINAL | rivalry +10〜+15 維持 | 舞台の大きさが双方に効く |

---

## 4. 試合勝敗の非対称イベント（新規）

### 4.1 M-15: 番狂わせ（OVR差10+の格下勝利）

**コンセプト**: 格下に負けるのは屈辱（逆恨み）。格下が格上に勝つのは自信。

| 項目 | 値 |
|---|---|
| 条件 | OVR差10以上 + 格下側が勝利 + M-03（圧勝）に **該当しない** |
| 格下（勝者）→格上 | bond ±0, rivalry **+3〜+5**（自信） |
| 格上（敗者）→格下 | bond **-2〜-4**（逆恨み）, rivalry **+4〜+7**（屈辱） |
| 逓減 | あり |

**M-03との排他**: M-03（圧勝）に該当した場合はM-15は発動しない。

```javascript
// ═══ M-15: 番狂わせ（M-03と排他） ═══
if (!isDraw && !isSquash) {
  const ovrA = context.ovrA || 0;
  const ovrB = context.ovrB || 0;
  const ovrDiff = Math.abs(ovrA - ovrB);
  if (ovrDiff >= 10) {
    const underdogIsA = ovrA < ovrB;
    const underdogWon = (underdogIsA && aWon) || (!underdogIsA && bWon);
    if (underdogWon) {
      const winDir = aWon ? 'AB' : 'BA';
      const loseDir = aWon ? 'BA' : 'AB';
      apply(winDir, 'upset', context.stage, 0, 0, 3, 5, true);        // 格下→格上
      apply(loseDir, 'upset', context.stage, -4, -2, 4, 7, true);     // 格上→格下（逆恨み）
    }
  }
}
```

**context 拡張**: `ovrA`, `ovrB`（number）を呼び出し元で設定する。

### 4.2 M-16: 対戦成績の蓄積（同一相手への3連敗+）

**コンセプト**: 同じ相手に3回以上連敗すると苛立ちが蓄積。逆に連敗を止めた初勝利は執着からの解放。

#### 3連敗+ の蓄積

| 項目 | 値 |
|---|---|
| 条件 | 同一相手への直接対決の連敗が3以上（matchupLogで判定） |
| 敗者→勝者 | bond **-1〜-3**（苛立ち）, rivalry **+3〜+5**（執着） |
| 勝者→敗者 | ±0 |
| 逓減 | なし（連敗が続く限り毎回発火） |

#### 連敗ストップ（初勝利）

| 項目 | 値 |
|---|---|
| 条件 | 同一相手への連敗が3以上の状態で初めて勝利 |
| 勝者→敗者 | bond **+2〜+4**（解放感）, rivalry **-2〜-4**（執着が溶ける） |
| 敗者→勝者 | ±0 |

```javascript
// ═══ M-16: 対戦成績蓄積 ═══
const getH2HStreak = (log, idA, idB) => {
  // idA vs idB の直近試合を新しい順に走査し、idAの連敗数を返す
  const matches = log.filter(m =>
    (m.leftId === idA && m.rightId === idB) ||
    (m.leftId === idB && m.rightId === idA)
  ).reverse();
  let streak = 0;
  for (const m of matches) {
    if (m.winnerId === idB) streak++;
    else break;
  }
  return streak;
};

if (!isDraw) {
  const winnerId = aWon ? charIdA : charIdB;
  const loserId = aWon ? charIdB : charIdA;
  const winDir = aWon ? 'AB' : 'BA';
  const loseDir = aWon ? 'BA' : 'AB';

  // 敗者の対勝者への連敗数（今回の試合結果を含めない直前まで）
  const loserStreak = getH2HStreak(context.matchupLog || [], loserId, winnerId);
  if (loserStreak >= 3) {
    apply(loseDir, 'h2hFrustration', context.stage, -3, -1, 3, 5, false);
  }

  // 勝者が以前この相手に3連敗+していた場合 → 連敗ストップ
  const winnerPrevStreak = getH2HStreak(context.matchupLog || [], winnerId, loserId);
  if (winnerPrevStreak >= 3) {
    apply(winDir, 'h2hBreakthrough', context.stage, 2, 4, -4, -2, false);
  }
}
```

**context 拡張**: `matchupLog`（当該ペアの過去対戦履歴）を呼び出し元で設定する。

### 4.3 M-17: 凡戦ペナルティ（MQ40未満）

**コンセプト**: つまらない試合は関係を悪化させる。負けた側の方がより不快。

| 状況 | bond | rivalry |
|---|---|---|
| 勝者→敗者 | **-1〜-2** | ±0 |
| 敗者→勝者 | **-2〜-4** | ±0 |
| 引き分け時 | **-1〜-2**（双方） | ±0 |
| 逓減 | あり |

```javascript
// ═══ M-17: 凡戦ペナルティ（MQ40未満） ═══
if (context.mq < 40) {
  if (isDraw) {
    apply('AB', 'boringMatch', context.stage, -2, -1, 0, 0, true);
    apply('BA', 'boringMatch', context.stage, -2, -1, 0, 0, true);
  } else {
    const winDir = aWon ? 'AB' : 'BA';
    const loseDir = aWon ? 'BA' : 'AB';
    apply(winDir, 'boringMatch', context.stage, -2, -1, 0, 0, true);
    apply(loseDir, 'boringMatch', context.stage, -4, -2, 0, 0, true);
  }
}
```

---

## 5. Bond ネガティブイベント（週次・興行・状況トリガー）

### 5.1 N-01: ポジション競合の嫉妬

**コンセプト**: 同じ立場なのに片方だけタイトル戦に出た。「なぜ私じゃない？」

| 項目 | 値 |
|---|---|
| 条件 | 同団体 + OVR差5以内 + 同スタイル + 片方がタイトル戦出場・片方が不出場 |
| 効果 | 不出場側→出場側: bond **-3〜-5**, rivalry **+3〜+5** |
| タイミング | 興行終了時（`applyShowContextEffects` 内） |
| 逓減 | なし |

**既存C-04との関係**: C-04（全不出場者からの汎用嫉妬）は残す。N-01は同スタイル＋OVR近接の特定ペアに**追加で重ねがけ**。

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

### 5.2 N-02: 成長格差の嫉妬

**コンセプト**: 同期なのに差がついた。「あいつだけ先に行った」

| 項目 | 値 |
|---|---|
| 条件 | 同団体 + 年齢差3以内 + 片方がブレイクスルーした + もう片方のOVRが低い |
| 効果 | 取り残された側→成長した側: bond **-2〜-4**, rivalry **+3〜+5** |
| タイミング | ブレイクスルー発生時（`applyBreakthroughEffect` の拡張） |

```javascript
// N-02: 成長格差の嫉妬（applyBreakthroughEffect内に追加）
const sameOrgSameGen = allChars.filter(c =>
  c.id !== fighterId &&
  c.orgId === fighter.orgId &&
  Math.abs(c.age - fighter.age) <= 3 &&
  Engine.util.ov(c) < selfOvr
);
if (sameOrgSameGen.length > 0) {
  const jealousIds = sameOrgSameGen.map(c => c.id);
  s = Engine.relationships.applyFromRoster(s, jealousIds, fighterId,
    { min: -4, max: -2 }, { min: 3, max: 5 }, rng);
}
```

### 5.3 N-03: ベビーフェイス×ヒール衝突

**コンセプト**: 控室で正義派と悪役派がぶつかる。「あんたのやり方は気に入らない」

| 項目 | 値 |
|---|---|
| 条件 | 同団体 + role対立（Babyface × Heel）+ 4%/週で発火 |
| 効果 | 双方: bond **-3〜-6**, rivalry **+2〜+4** |
| タイミング | 週次処理（`processWeeklyRelationships` 内、新セクション） |
| Neutral | **関与しない**。BabyfaceとHeelのペアだけが対象 |

```javascript
// N-03: Babyface×Heel衝突（週次処理に新設）
const processRoleClash = (orgRoster, rng) => {
  const bfIds = orgRoster.filter(c => c.role === 'Babyface' && !c.injury).map(c => c.id);
  const heelIds = orgRoster.filter(c => c.role === 'Heel' && !c.injury).map(c => c.id);
  if (bfIds.length === 0 || heelIds.length === 0) return;

  for (const bfId of bfIds) {
    for (const heelId of heelIds) {
      if (Engine.rng.float(rng) >= 0.04) continue;
      const bondDelta = -(3 + Engine.rng.float(rng) * 3); // -3〜-6
      const rivalryDelta = 2 + Engine.rng.float(rng) * 2;  // +2〜+4
      // ... apply処理
    }
  }
};
```

### 5.4 N-04: 人気逆転の複雑な感情

**コンセプト**: 後輩の人気が先輩を超えた。「あの子が、私より…」

| 項目 | 値 |
|---|---|
| 条件 | 同団体 + 年齢差5以上 + 若手のpopが年長者を初めて超えた瞬間 |
| 効果 | 年長者→若手: bond **-3〜-5**, rivalry **+2〜+4** |
| 発火制限 | 同一ペアで **1回限り**（`popOvertakeTriggered` フラグで管理） |

```javascript
// N-04: 人気逆転（興行終了後）
const triggered = state.popOvertakeTriggered || {};
for (const senior of roster) {
  for (const junior of roster) {
    if (senior.id === junior.id) continue;
    if ((senior.age || 20) - (junior.age || 20) < 5) continue;
    const pairKey = `${senior.id}>${junior.id}`;
    if (triggered[pairKey]) continue;
    if ((junior.pop || 0) > (senior.pop || 0)) {
      s = Engine.relationships.applyToRoster(s, senior.id, [junior.id],
        { min: -5, max: -3 }, { min: 2, max: 4 }, rng);
      triggered[pairKey] = true;
    }
  }
}
s = { ...s, popOvertakeTriggered: triggered };
```

### 5.5 N-05: スランプの八つ当たり

**コンセプト**: 苦しい時に一番近い人に当たる。「ほっといてよ…！」

| 項目 | 値 |
|---|---|
| 条件 | スランプ突入時 + 同団体内のbond最高の相手（bond50未満なら不発） |
| スランプ者→bond最高相手 | bond **-4〜-7** |
| 相手→スランプ者 | bond **-1〜-3** |
| rivalry | ±0 |
| 発火制限 | スランプ突入1回につき1回 |

```javascript
// N-05: スランプの八つ当たり
const findHighestBondTarget = (state, fighterId) => {
  const rels = state.relationships || {};
  const roster = state.roster || [];
  let maxBond = 50;
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

const targetId = findHighestBondTarget(state, fighterId);
if (targetId) {
  s = Engine.relationships.applyToRoster(s, fighterId, [targetId],
    { min: -7, max: -4 }, { min: 0, max: 0 }, rng);
  s = Engine.relationships.applyFromRoster(s, [targetId], fighterId,
    { min: -3, max: -1 }, { min: 0, max: 0 }, rng);
}
```

---

## 6. 他団体ライバル構築システム

### 6.1 knownRival フラグ

| 項目 | 値 |
|---|---|
| 付与条件 | rivalry が **40以上** に達した時点で自動付与 |
| 効果 | 非接触時のrivalry週次減衰を **1/3** に抑制 |
| 解除条件 | rivalry が **10未満** に下がった場合に解除 |
| 保存場所 | `relationships[key].knownRival: true/false` |

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

  if (r.knownRival) rivalryDecay *= (1 / 3);
  rivalry -= rivalryDecay;
}
```

### 6.2 乱入・対抗戦の Rivalry ブースト強化

| イベント | 現状 | 変更後 |
|---|---|---|
| 乱入（B-1a） | rivalry付与なし | → 新設: **+12〜+18** |
| 対抗戦（E-03） | 対戦者同士 +5〜+8 | → **+8〜+12** |
| 対抗戦チャレンジ（B-5b） | 対戦者同士 +5〜+10 | → **+8〜+15** |

### 6.3 「意識している」週次マイクロイベント

| 項目 | 値 |
|---|---|
| 条件 | knownRival フラグあり + 非接触（他団体）+ 4週に1回 |
| 効果 | rivalry **+0.3〜+0.5** |
| 上限 | rivalry 60まで |

```javascript
if (!inContact && r.knownRival && absWeek % 4 === 0 && rivalry < 60) {
  rivalry += 0.3 + Engine.rng.float(rng) * 0.2;
}
```

---

## 7. context の拡張要件

上記イベントの実装に必要な context の追加フィールド:

| フィールド | 型 | 供給元 | 用途 |
|---|---|---|---|
| `ovrA` | number | `finalizeShow` / `finalizePPV` | M-15（番狂わせ）のOVR差判定 |
| `ovrB` | number | 同上 | 同上 |
| `isChampionA` | boolean | タイトルマッチ時に設定 | M-06改（タイトル勝敗非対称）の王者判定 |
| `isChampionB` | boolean | 同上 | 同上 |
| `matchupLog` | array | `state.matchupLog` or 興行内蓄積 | M-16（対戦成績蓄積）のH2H連敗判定 |

**新規 state フィールド**:

| フィールド | 型 | 用途 |
|---|---|---|
| `popOvertakeTriggered` | object `{ "seniorId>juniorId": true }` | N-04（人気逆転）の1回限り判定 |

---

## 8. スナップショット通知連携

| ソース名 | トリガー | 重み | テンプレート例 |
|---|---|---|---|
| `destinySettled` | 宿命の決着 | 8 | 「{A}と{B}の宿命の物語がついに幕を閉じた」 |
| `rivalryResolutionReset` | 因縁決着（リセット版） | 6 | 「{A}と{B}の因縁に決着がついた」 |
| `roleClash` | BF×Heel衝突(N-03) | 3 | 「控室で{A}と{B}が口論になった」 |
| `positionJealousy` | ポジション競合(N-01) | 2 | 「{A}は{B}のタイトル戦出場に複雑な表情を浮かべた」 |
| `growthJealousy` | 成長格差(N-02) | 3 | 「{A}は同期の{B}の成長ぶりに焦りを感じている」 |
| `popOvertake` | 人気逆転(N-04) | 4 | 「後輩{B}の人気が{A}を超えた」 |
| `slumpLashout` | 八つ当たり(N-05) | 4 | 「スランプの{A}が{B}に当たり散らした」 |
| `titleMatchDefended` | タイトル防衛成功 | 3 | 「{挑戦者}は{王者}のベルトに届かなかった」 |
| `titleMatchLost` | タイトル陥落 | 5 | 「{前王者}は{新王者}にベルトを奪われた」 |
| `upsetVictory` | 番狂わせ | 4 | 「格下の{勝者}が{敗者}を破る金星」 |
| `upsetGrudge` | 番狂わせ逆恨み | 3 | 「{敗者}は{勝者}への敗北に屈辱を感じている」 |
| `h2hFrustration` | 同一相手3連敗+ | 3 | 「{敗者}は{勝者}にまたしても敗れ、苛立ちを募らせている」 |
| `h2hBreakthrough` | 連敗ストップ | 5 | 「{勝者}がついに{敗者}への連敗を止めた」 |
| `knownRivalAware` | 他団体ライバル意識 | 1 | （低重みのため通常は通知されない） |
| `boringMatch` | 凡戦 | 1 | （低重みのため通常は通知されない） |

---

## 9. 実装の優先順位

| 順 | 項目 | 理由 |
|---|---|---|
| 1 | M-01修正（§3.1） | 全試合に影響。bond供給の根本修正 |
| 2 | M-02修正（§3.2） | M-01と同時に実施 |
| 3 | Rivalryリセット（§2.1, §2.2） | 既存コードの修正で済む。体験インパクト最大 |
| 4 | M-17: 凡戦ペナルティ（§4.3） | MQ判定のみで実装容易 |
| 5 | knownRivalフラグ（§6.1） | 週次処理への追加のみ。他団体ライバルの基盤 |
| 6 | N-03: BF×Heel衝突（§5.3） | 週次処理への新設。頻度安定 |
| 7 | M-06改: タイトル勝敗非対称（§3.3） | context拡張が必要だが影響大 |
| 8 | N-01: ポジション競合（§5.1） | 興行処理への追加 |
| 9 | N-05: スランプ八つ当たり（§5.5） | スランプ処理への追加 |
| 10 | N-02: 成長格差（§5.2） | ブレイクスルー処理への追加 |
| 11 | M-15: 番狂わせ（§4.1） | context に ovrA/ovrB 追加 |
| 12 | N-04: 人気逆転（§5.4） | 新規state管理が必要 |
| 13 | M-16: 対戦成績蓄積（§4.2） | matchupLog連携が必要でやや複雑 |
| 14 | 引退時凍結（§2.3） | 全引退処理に影響。慎重にテスト |
| 15 | 乱入・対抗戦ブースト（§6.2） | 数値変更のみ |
| 16 | 意識マイクロイベント（§6.3） | knownRival依存 |

---

## 10. 検証計画

### 10.1 シミュレーション（実装前 or 実装後）

100シーズン自動シミュレーションで以下を計測:

- **Bond分布**: 全ペアのbond値のヒストグラム
  - 期待: 30〜80にバラつく多峰分布（現状は50〜80に偏る単峰）
- **Rivalryリセット発生回数**: シーズンあたり平均
  - 期待: 因縁決着 1〜3回/シーズン、宿命の決着 0〜1回/シーズン
- **他団体rivalry**: 最高到達値、knownRival保持率
  - 期待: rivalry40+の他団体ペアが常時2〜4組存在
- **N-01〜N-05発火回数**: 各イベントのシーズンあたり発生頻度
  - 期待: N-01(8〜12), N-02(1〜4), N-03(2〜6), N-04(0〜2), N-05(0〜2)
- **試合経由のbond年間収支**: 
  - 期待: 現状+10〜+20 → 変更後 **-5〜+5**（名勝負以外ではbondが上がらない）
- **凡戦(MQ40未満)の発生頻度とbondへの影響**

### 10.2 実装後の観察ポイント

- bondが極端に低い（20未満）ペアが多すぎないか → 多すぎたら全体ボーナス調整
- N-03(BF×Heel)が特定ペアに偏りすぎていないか
- rivalryリセットが「あっけない」と感じないか（スナップショット通知の演出で補う）
- knownRivalが多すぎて減衰抑制が効きすぎていないか
- タイトル陥落時のrivalry +12〜+18 が強すぎないか
- 番狂わせの逆恨み(bond -2〜-4)が頻発しすぎないか

### 10.3 全体ボーナス調整（シミュ後に判断）

以下は本スペックでは**変更しない**。シミュレーション結果を見て必要なら別途調整:

- 同団体ボーナス（+0.2〜+0.5/週、天井60）
- 世代近接ボーナス（+0.1/週）
- 性格不一致摩擦（-0.15/週）
- camp/partyの全ペア bond +2〜+4
