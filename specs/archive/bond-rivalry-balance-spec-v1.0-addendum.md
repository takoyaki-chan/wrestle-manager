# Bond/Rivalry バランス改善スペック v1.0 — 追補：試合勝敗非対称 & Bond修正

> 2026-03-13 作成
> v1.0本体（bond-rivalry-balance-spec-v1.0.md）への追補
> 目的: 試合の勝敗でbond/rivalryに非対称な変動を導入し、通常試合でのbond自動上昇を廃止する

---

## 8. 試合ベースライン修正

### 8.1 M-01: 全試合ベースライン

**問題**: 試合しただけで bond +0〜+1 が入る。殴り合った相手と自動的に仲良くなるのは不自然。

**方針**: bond を ±0 に変更。rivalry を勝敗で非対称化。

| 方向 | 現状 | 変更後 |
|---|---|---|
| 勝者→敗者 bond | +0〜+1 | **±0** |
| 敗者→勝者 bond | +0〜+1 | **±0** |
| 勝者→敗者 rivalry | +0.3〜+1.0 | **+0.1〜+0.5**（勝った余裕） |
| 敗者→勝者 rivalry | +0.3〜+1.0 | **+0.8〜+2.0**（負けた悔しさ） |
| 引き分け時 rivalry | +0.3〜+1.0 | **+0.5〜+1.0**（双方。変更小） |

**実装**:
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

### 8.2 M-02: 僅差の好勝負

**問題**: bond +2〜+4 は過剰。僅差の好勝負は頻繁に発生するため、bondプラスの主要供給源になっている。

| 方向 | 現状 | 変更後 |
|---|---|---|
| 双方 bond | +2〜+4 | **±0〜+1** |
| 双方 rivalry | +5〜+8 | **変更なし** |

**実装**:
```javascript
// ═══ M-02: 僅差の好勝負 ═══
if (isCloseMatch) {
  apply('AB', 'closeMatch', context.stage, 0, 1, 5, 8, true);
  apply('BA', 'closeMatch', context.stage, 0, 1, 5, 8, true);
}
```

### 8.3 変更しないもの

| イベント | bond | 理由 |
|---|---|---|
| M-04 名勝負 MQ80+ | +3〜+6 維持 | 特別な体験の共有。年に数回しか起きない |
| M-13 キャリアベストMQ | +2〜+3 維持 | 人生最高の試合をくれた相手への敬意 |
| M-10 因縁決着 | +5〜+10 維持 | 本体§2.1でrivalryリセット化済み |

---

## 9. 試合勝敗の非対称イベント（新規）

### 9.1 M-15: タイトル戦の勝敗非対称

**コンセプト**: タイトル戦は勝者と敗者で意味が全く違う。挑戦失敗は「あのベルトが欲しい」、陥落は「取り返したい」。

#### M-06（既存タイトルマッチ）を置き換え

| 状況 | 判定方法 | bond | rivalry |
|---|---|---|---|
| 王者が防衛成功 | winner=チャンピオン | — | 王者→挑戦者: **+4〜+7**, 挑戦者→王者: **+10〜+15** |
| 挑戦者が奪取成功 | winner=チャレンジャー | — | 新王者→前王者: **+5〜+8**, 前王者→新王者: **+12〜+18** |

**既存M-06との関係**: M-06を**完全置き換え**。既存の対称 +8〜+12 を上記に差し替える。

**isTitleMatch 内での勝敗判定**:
```javascript
// ═══ M-06改: タイトルマッチ（勝敗非対称） ═══
if (context.isTitleMatch && !isDraw) {
  const winDir = aWon ? 'AB' : 'BA';
  const loseDir = aWon ? 'BA' : 'AB';

  if (context.isChampionA !== undefined) {
    // 王者が誰かを判定
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

**注意**: context に `isChampionA` / `isChampionB` を渡す必要がある。呼び出し元の `finalizeShow` / `finalizePPV` でタイトルマッチ時に王者フラグを設定する。

### 9.2 M-16: 番狂わせ（OVR差10+の格下勝利）

**コンセプト**: 格下に負けるのは屈辱（逆恨み）。格下が格上に勝つのは自信。

| 項目 | 値 |
|---|---|
| 条件 | OVR差10以上 + 格下側が勝利 + M-03（圧勝）判定に **該当しない** |
| 格下（勝者）→格上 | bond ±0, rivalry **+3〜+5**（自信、もっと上を目指す） |
| 格上（敗者）→格下 | bond **-2〜-4**（逆恨み）, rivalry **+4〜+7**（屈辱） |
| 逓減 | あり（同一ペアで連発すると効果減） |

**M-03との排他**: M-03（圧勝）に該当した場合はM-16は発動しない。M-03は「勝者が一方的に勝った」場合で、M-16は「格下が普通に勝った」場合。

```javascript
// ═══ M-16: 番狂わせ（M-03と排他） ═══
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
      // 格下（勝者）→格上: rivalry +3〜+5
      apply(winDir, 'upset', context.stage, 0, 0, 3, 5, true);
      // 格上（敗者）→格下: bond -2〜-4, rivalry +4〜+7（逆恨み）
      apply(loseDir, 'upset', context.stage, -4, -2, 4, 7, true);
    }
  }
}
```

**context への追加**: `ovrA`, `ovrB` を渡す必要がある。

### 9.3 M-17: 対戦成績の蓄積（同一相手への3連敗+）

**コンセプト**: 同じ相手に3回以上連敗すると苛立ちが蓄積。逆に連敗を止めた初勝利は執着からの解放。

#### 3連敗+ の蓄積

| 項目 | 値 |
|---|---|
| 条件 | 同一相手への連敗が3以上（matchupLog で判定） |
| 敗者→勝者 | bond **-1〜-3**（苛立ち）, rivalry **+3〜+5**（執着） |
| 勝者→敗者 | ±0（勝ってる側は意識しない） |
| 逓減 | なし（連敗が続く限り毎回発火） |

#### 連敗ストップ（初勝利）

| 項目 | 値 |
|---|---|
| 条件 | 同一相手への連敗が3以上の状態で初めて勝利 |
| 勝者→敗者 | bond **+2〜+4**（解放感）, rivalry **-2〜-4**（執着が溶ける） |
| 敗者→勝者 | ±0 |
| 逓減 | なし |

**matchupLog からの連敗判定**:
```javascript
// ═══ M-17: 対戦成績蓄積 ═══
// matchupLog: [{ leftId, rightId, winnerId, week, season }, ...]
const getH2HStreak = (log, idA, idB) => {
  // idA vs idB の直近試合を新しい順に走査し、idAの連敗数を返す
  const matches = log.filter(m =>
    (m.leftId === idA && m.rightId === idB) ||
    (m.leftId === idB && m.rightId === idA)
  ).reverse(); // 新しい順

  let streak = 0;
  for (const m of matches) {
    if (m.winnerId === idB) streak++;  // idAの負け
    else break;  // idAの勝ちor引き分けで連敗途切れ
  }
  return streak;
};

if (!isDraw) {
  const winnerId = aWon ? charIdA : charIdB;
  const loserId = aWon ? charIdB : charIdA;
  const winDir = aWon ? 'AB' : 'BA';
  const loseDir = aWon ? 'BA' : 'AB';

  // 今回の試合結果を含めない直前までの連敗数
  const loserStreak = getH2HStreak(context.matchupLog || [], loserId, winnerId);

  if (loserStreak >= 3) {
    // 4連敗以上: 苛立ち蓄積
    apply(loseDir, 'h2hFrustration', context.stage, -3, -1, 3, 5, false);
  }

  // 連敗ストップ判定: 今回勝者が以前3連敗+していた場合
  const winnerPrevStreak = getH2HStreak(context.matchupLog || [], winnerId, loserId);
  if (winnerPrevStreak >= 3) {
    // 連敗を止めた: 解放感
    apply(winDir, 'h2hBreakthrough', context.stage, 2, 4, -4, -2, false);
  }
}
```

**context への追加**: `matchupLog`（当該ペアの過去対戦履歴）を渡す必要がある。

### 9.4 M-18: 凡戦ペナルティ（MQ40未満）

**コンセプト**: つまらない試合は関係を悪化させる。負けた側の方がより不快。

| 項目 | 値 |
|---|---|
| 条件 | MQ40未満 + 引き分けでない |
| 勝者→敗者 | bond **-1〜-2**（つまらない相手） |
| 敗者→勝者 | bond **-2〜-4**（つまらない試合で負けた屈辱） |
| 引き分け時 | 双方 bond **-1〜-2** |
| rivalry | ±0（凡戦は意識を高めない） |
| 逓減 | あり（同一ペアの凡戦は慣れで効果減） |

```javascript
// ═══ M-18: 凡戦ペナルティ（MQ40未満） ═══
if (context.mq < 40) {
  if (isDraw) {
    apply('AB', 'boringMatch', context.stage, -2, -1, 0, 0, true);
    apply('BA', 'boringMatch', context.stage, -2, -1, 0, 0, true);
  } else {
    const winDir = aWon ? 'AB' : 'BA';
    const loseDir = aWon ? 'BA' : 'AB';
    apply(winDir, 'boringMatch', context.stage, -2, -1, 0, 0, true);  // 勝者→敗者
    apply(loseDir, 'boringMatch', context.stage, -4, -2, 0, 0, true); // 敗者→勝者
  }
}
```

---

## 10. context の拡張要件

上記イベントの実装に必要な context の追加フィールド:

| フィールド | 型 | 供給元 | 用途 |
|---|---|---|---|
| `ovrA` | number | `finalizeShow` / `finalizePPV` | M-16（番狂わせ）の OVR差判定 |
| `ovrB` | number | 同上 | 同上 |
| `isChampionA` | boolean | タイトルマッチ時に設定 | M-15（タイトル勝敗非対称）の王者判定 |
| `isChampionB` | boolean | 同上 | 同上 |
| `matchupLog` | array | `state.matchupLog` or 興行内蓄積 | M-17（対戦成績蓄積）のH2H連敗判定 |

---

## 11. 影響の見積もり

### 11.1 Bond への累積効果（1シーズン概算）

**削減されるプラス:**
- M-01 bond +0.5/試合 × 年20試合 ≈ **-10/シーズン** 削減
- M-02 bond +3/試合 × 年4回 ≈ **-12/シーズン** 削減（+0.5に縮小で -10）
- **合計: 約-20〜-22/シーズン のプラス削減**

**追加されるマイナス:**
- M-16（番狂わせ）: 格上敗者に bond -3 × 年1〜2回 ≈ **-3〜-6**
- M-17（対戦成績蓄積）: 連敗ペアに bond -2 × 年1〜3回 ≈ **-2〜-6**
- M-18（凡戦）: bond -2.5 × 年2〜4回 ≈ **-5〜-10**
- **合計: 約-10〜-22/シーズン の追加マイナス**

### 11.2 現状との比較

| | 現状 | 変更後 |
|---|---|---|
| 試合経由の年間bond | +10〜+20 | **-5〜+5** |
| 全体のbond収支 | +14〜+21/シーズン | **-10〜+5/シーズン** |

本体§3（N-01〜N-05）と合わせると、特定ペアでは **bondが50を下回る** 状況が十分に起きうる。全体ボーナスの調整（同団体ボーナス減等）はシミュレーション結果を見てから判断。

---

## 12. スナップショット通知連携（追加分）

| ソース名 | トリガー | 重み | テンプレート例 |
|---|---|---|---|
| `titleMatchDefended` | タイトル防衛成功 | 3 | 「{挑戦者}は{王者}のベルトに届かなかった」 |
| `titleMatchLost` | タイトル陥落 | 5 | 「{前王者}は{新王者}にベルトを奪われた」 |
| `upsetVictory` | 番狂わせ | 4 | 「格下の{勝者}が{敗者}を破る金星」 |
| `upsetGrudge` | 番狂わせ逆恨み | 3 | 「{敗者}は{勝者}への敗北に屈辱を感じている」 |
| `h2hFrustration` | 同一相手3連敗+ | 3 | 「{敗者}は{勝者}にまたしても敗れ、苛立ちを募らせている」 |
| `h2hBreakthrough` | 連敗ストップ | 5 | 「{勝者}がついに{敗者}への連敗を止めた」 |
| `boringMatch` | 凡戦 | 1 | （低重みのため通常は通知されない） |

---

## 13. 実装の優先順位（追加分）

本体§6（優先順位1〜10）の続きとして:

| 順 | 項目 | 理由 |
|---|---|---|
| 11 | M-01修正（§8.1） | 全試合に影響。bond供給の根本修正 |
| 12 | M-02修正（§8.2） | M-01と同時に実施 |
| 13 | M-18: 凡戦ペナルティ（§9.4） | MQ判定のみで実装容易 |
| 14 | M-15: タイトル勝敗非対称（§9.1） | context拡張が必要だが影響大 |
| 15 | M-16: 番狂わせ（§9.2） | context に ovrA/ovrB 追加 |
| 16 | M-17: 対戦成績蓄積（§9.3） | matchupLog連携が必要でやや複雑 |
