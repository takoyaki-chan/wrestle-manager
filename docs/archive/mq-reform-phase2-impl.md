# MQ改修 Phase 2: 集客ボーナス変更 + マンネリ緩和

**前提**: Phase 1 完了後に着手すること。

---

## 1. 集客ボーナス変更

engine.js の calcAttendance 内、totalMult 計算に関する変更。

### 1-1. タイトルマッチ集客: +0.15 → +0.20

```javascript
const titleBonus = hasTitleMatch ? 0.20 : 0.0;  // 現状 0.15
```

### 1-2. ファン期待カード集客（新規追加）

calcAttendance に引数 `fanExpectCount` を追加し、totalMult に加算する。

```javascript
const fanExpectBonus = (fanExpectCount || 0) * 0.08;
const totalMult = Math.min(1.0 + (heatMult - 1.0) + titleBonus + champBonus + charismaBonus + rivalryAttendanceBonus + fanExpectBonus, 2.0);
```

**呼び出し側**: calcAttendance を呼ぶ全箇所で fanExpectCount を渡す。
- processShow 内: fanExpects を生成済みなので、showCard とマッチングしてカウントを渡す
- getAttendancePrediction: カード編成画面のプレビュー用。同様に fanExpects からカウント
- AI側の集客計算: 同様

fanExpectCount の算出は既存の `Engine.fanExpect.countMatched(showCard, fanExpects)` が使える。

---

## 2. マンネリ（カード鮮度）緩和

engine.js の Engine.freshness.calc と data.js の FRESHNESS_CONFIG を変更。

### 2-1. FRESHNESS_CONFIG 変更（data.js）

```javascript
const FRESHNESS_CONFIG = {
  windowShows: 12,           // デフォルト（ロスター13人以上）
  windowShowsSmall: 8,       // ロスター8人以下
  windowShowsMedium: 10,     // ロスター9〜12人
  firstMeetBonus: 2,         // 変更なし
  penalties: [
    { minCount: 3, mqPenaltyMin: -1, mqPenaltyMax: -3 },   // 現状: -3 固定
    { minCount: 4, mqPenaltyMin: -2, mqPenaltyMax: -4 },   // 現状: -5 固定
    { minCount: 5, mqPenaltyMin: -3, mqPenaltyMax: -5 },   // 現状: -8 固定
  ],
};
```

### 2-2. Engine.freshness.calc 変更（engine.js）

関数シグネチャに `rosterSize` と `rng` を追加:

```javascript
calc(matchupLog, id1, id2, currentShowCount, rosterSize, rng) {
  // ウィンドウ決定
  let windowShows;
  if (rosterSize != null && rosterSize <= 8) {
    windowShows = FRESHNESS_CONFIG.windowShowsSmall;
  } else if (rosterSize != null && rosterSize <= 12) {
    windowShows = FRESHNESS_CONFIG.windowShowsMedium;
  } else {
    windowShows = FRESHNESS_CONFIG.windowShows;
  }

  // ... 初顔合わせ判定は変更なし ...

  // ウィンドウ内カウント（windowShows を使用）
  const windowStart = currentShowCount - windowShows;
  const countInWindow = matchupLog.filter(e =>
    e.showCount > windowStart &&
    Math.min(e.leftId, e.rightId) === key1 && Math.max(e.leftId, e.rightId) === key2
  ).length;

  // ペナルティ判定（ランダム幅）
  for (let i = FRESHNESS_CONFIG.penalties.length - 1; i >= 0; i--) {
    const p = FRESHNESS_CONFIG.penalties[i];
    if (countInWindow >= p.minCount) {
      const penalty = rng
        ? -(Math.abs(p.mqPenaltyMax) - Engine.rng.int(rng, 0, Math.abs(p.mqPenaltyMax) - Math.abs(p.mqPenaltyMin)))
        : p.mqPenaltyMax;  // rng無しならワーストケース
      const label = countInWindow >= 5 ? '完全なマンネリ' : countInWindow >= 4 ? '深刻なマンネリ' : 'マンネリ';
      return { bonus: penalty, label };
    }
  }
  return { bonus: 0, label: null };
}
```

### 2-3. 呼び出し側の修正

Engine.freshness.calc を呼ぶ全箇所で `rosterSize` と `rng` を渡す:

- Pass 2（processShow内）: `s.roster.length` と適切な rng を渡す
- AI自動編成: 同様に `G.roster.length` と rng を渡す

**注意**: rng は週次シードから派生させて、同じ週の同じカードなら同じランダム値になるようにする。

---

## 3. 検証

Phase 2 完了後、ゲームを起動して以下を目視確認:
- 集客数がタイトルマッチ時に微増していること
- ファン期待カードが集客に反映されていること
- マンネリペナルティが固定値ではなくランダム幅で出ること
- 小規模ロスター時にマンネリが出にくくなっていること
- エラーが出ないこと

**auto-simはPhase 3でまとめて実施するのでPhase 2では不要。**
