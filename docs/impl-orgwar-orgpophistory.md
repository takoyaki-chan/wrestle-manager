# 実装指示: orgWarRecord + orgPopHistory

## 概要

団体間の直接対決記録（orgWarRecord）と団体人気推移（orgPopHistory）をEngine側に新設する。
UIは今回のスコープ外。データ基盤のみ。

---

## 1. Engine.orgWar オブジェクト新設（engine.js）

### データ構造

```javascript
// state.orgWarRecord — 全団体ペアの直接対決記録
// キー形式: "org_a>org_s"（IDをソート、小さいほうがsideA）
// 例:
// {
//   "org_a>org_s": {
//     wars: 3, warsWonA: 1, warsWonB: 2, warsDraw: 0,
//     warMatchesWonA: 4, warMatchesWonB: 5,
//     summits: 2, summitsWonA: 1, summitsWonB: 1,
//     ppvMatches: 5, ppvWonA: 3, ppvWonB: 2,
//     streakA: -2,  // sideA視点、+で連勝 -で連敗
//     lastResult: { type: 'war', winnerSide: 'B', season: 4, week: 18 },
//   },
//   "org_b>player": { ... },
//   ...
// }
```

### ユーティリティ関数

```javascript
Engine.orgWar = {
  // ペアキー生成（小さいほうがsideA）
  getKey(org1, org2) {
    const a = org1 < org2 ? org1 : org2;
    const b = org1 < org2 ? org2 : org1;
    return `${a}>${b}`;
  },

  // 空レコード
  getEmpty() {
    return {
      wars: 0, warsWonA: 0, warsWonB: 0, warsDraw: 0,
      warMatchesWonA: 0, warMatchesWonB: 0,
      summits: 0, summitsWonA: 0, summitsWonB: 0,
      ppvMatches: 0, ppvWonA: 0, ppvWonB: 0,
      streakA: 0,
      lastResult: null,
    };
  },

  // 安全取得
  get(state, org1, org2) {
    const key = this.getKey(org1, org2);
    return (state.orgWarRecord || {})[key] || this.getEmpty();
  },

  // 自分視点の勝敗を返す（h2h.getRecordFor と同パターン）
  getFor(state, selfOrg, opponentOrg) {
    const key = this.getKey(selfOrg, opponentOrg);
    const rec = (state.orgWarRecord || {})[key] || this.getEmpty();
    const isA = selfOrg < opponentOrg;
    return {
      wars: rec.wars,
      warsWon: isA ? rec.warsWonA : rec.warsWonB,
      warsLost: isA ? rec.warsWonB : rec.warsWonA,
      warsDraw: rec.warsDraw,
      warMatchesWon: isA ? rec.warMatchesWonA : rec.warMatchesWonB,
      warMatchesLost: isA ? rec.warMatchesWonB : rec.warMatchesWonA,
      summits: rec.summits,
      summitsWon: isA ? rec.summitsWonA : rec.summitsWonB,
      summitsLost: isA ? rec.summitsWonB : rec.summitsWonA,
      ppvMatches: rec.ppvMatches,
      ppvWon: isA ? rec.ppvWonA : rec.ppvWonB,
      ppvLost: isA ? rec.ppvWonB : rec.ppvWonA,
      streak: isA ? rec.streakA : -rec.streakA,
      lastResult: rec.lastResult,
    };
  },

  // 対抗戦結果を記録。stateの新しいorgWarRecordを返す
  recordWar(orgWarRecord, org1, org2, org1Wins, org2Wins, season, week) {
    const key = this.getKey(org1, org2);
    const owr = { ...(orgWarRecord || {}) };
    const entry = { ...(owr[key] || this.getEmpty()) };
    const isA = org1 < org2;

    entry.wars += 1;
    if (org1Wins > org2Wins) {
      if (isA) entry.warsWonA += 1; else entry.warsWonB += 1;
    } else if (org1Wins < org2Wins) {
      if (isA) entry.warsWonB += 1; else entry.warsWonA += 1;
    } else {
      entry.warsDraw += 1;
    }
    if (isA) {
      entry.warMatchesWonA += org1Wins;
      entry.warMatchesWonB += org2Wins;
    } else {
      entry.warMatchesWonA += org2Wins;
      entry.warMatchesWonB += org1Wins;
    }

    // streak更新（イベント単位、sideA視点）
    if (org1Wins > org2Wins) {
      entry.streakA = isA ? Math.max(1, entry.streakA + 1) : Math.min(-1, entry.streakA - 1);
      // streakAが符号反転したらリセット
      if (isA && entry.streakA < 0) entry.streakA = 1;
      if (!isA && entry.streakA > 0) entry.streakA = -1;
    } else if (org1Wins < org2Wins) {
      entry.streakA = isA ? Math.min(-1, entry.streakA - 1) : Math.max(1, entry.streakA + 1);
      if (isA && entry.streakA > 0) entry.streakA = -1;
      if (!isA && entry.streakA < 0) entry.streakA = 1;
    } else {
      entry.streakA = 0; // 引き分けはstreak切れ
    }

    const winnerSide = org1Wins > org2Wins ? (isA ? 'A' : 'B') :
                       org1Wins < org2Wins ? (isA ? 'B' : 'A') : 'draw';
    entry.lastResult = { type: 'war', winnerSide, season, week };

    owr[key] = entry;
    return owr;
  },

  // サミット結果を記録
  recordSummit(orgWarRecord, winnerOrg, loserOrg, season, week) {
    const key = this.getKey(winnerOrg, loserOrg);
    const owr = { ...(orgWarRecord || {}) };
    const entry = { ...(owr[key] || this.getEmpty()) };
    const isWinnerA = winnerOrg < loserOrg;

    entry.summits += 1;
    if (isWinnerA) entry.summitsWonA += 1;
    else entry.summitsWonB += 1;

    // streak更新
    if (isWinnerA) {
      entry.streakA = entry.streakA >= 0 ? entry.streakA + 1 : 1;
    } else {
      entry.streakA = entry.streakA <= 0 ? entry.streakA - 1 : -1;
    }

    entry.lastResult = { type: 'summit', winnerSide: isWinnerA ? 'A' : 'B', season, week };
    owr[key] = entry;
    return owr;
  },

  // PPVクロス対戦結果を記録（サミット以外）
  recordPPVMatch(orgWarRecord, winnerOrg, loserOrg, season, week) {
    const key = this.getKey(winnerOrg, loserOrg);
    const owr = { ...(orgWarRecord || {}) };
    const entry = { ...(owr[key] || this.getEmpty()) };
    const isWinnerA = winnerOrg < loserOrg;

    entry.ppvMatches += 1;
    if (isWinnerA) entry.ppvWonA += 1;
    else entry.ppvWonB += 1;

    // PPV個別試合はstreak変動なし（イベント単位ではないため）

    owr[key] = entry;
    return owr;
  },
};
```

### 注意: streak計算のロジック

streakはsideA視点で記録。正の値=sideAの連勝、負の値=sideBの連勝。
`getFor()` で自分視点に変換するとき `isA ? streakA : -streakA`。
引き分けは streak を 0 にリセット。

---

## 2. 記録フック追加（4箇所）

### フック1: applyWarOutcome()（engine.js）

プレイヤー vs AI の対抗戦。
`applyWarOutcome` 内、state更新の直前に orgWarRecord を更新。

```javascript
// 既存コードの warState 構築前に追加:
const updOwr = Engine.orgWar.recordWar(
  state.orgWarRecord, 'player', opponentOrgId,
  playerWins, aiWins, state.season, state.week
);
// warState に orgWarRecord: updOwr を含める
```

### フック2: PPVサミット結果処理（engine.js）

`applyPPVResults` 内のサミット処理箇所。
勝者/敗者の `_ppvOrgId` から団体を判定して記録。

```javascript
// サミット勝敗確定後
const summitWinnerOrg = sr.winner === 'left' ? card[summitIdx].left._ppvOrgId : card[summitIdx].right._ppvOrgId;
const summitLoserOrg = sr.winner === 'left' ? card[summitIdx].right._ppvOrgId : card[summitIdx].left._ppvOrgId;
// ↑ この変数は既存コードにある（winnerOrgId / loserOrgId として）
// orgWarRecord を更新
owr = Engine.orgWar.recordSummit(owr, summitWinnerOrg, summitLoserOrg, s.season, s.week);
```

### フック3: PPV結果ループ — クロス対戦記録

PPV結果処理で h2h を記録しているループの中に追加。
サミットマッチ以外で、`left._ppvOrgId !== right._ppvOrgId` の試合をPPVクロス対戦として記録。

```javascript
// PPV h2h記録ループ（app.js の ppvH2h ループ）の近くに追加
let ppvOwr = { ...(s.orgWarRecord || {}) };
pp.results.forEach((r, idx) => {
  const match = pp.card[idx];
  const leftOrg = match.left._ppvOrgId;
  const rightOrg = match.right._ppvOrgId;
  if (leftOrg === rightOrg) return; // 同団体 → スキップ
  if (match.isSummit) return; // サミットは別途記録済み
  if (r.winner === 'draw') return; // ドローは記録しない（勝敗のみ）
  const winnerOrg = r.winner === 'left' ? leftOrg : rightOrg;
  const loserOrg = r.winner === 'left' ? rightOrg : leftOrg;
  ppvOwr = Engine.orgWar.recordPPVMatch(ppvOwr, winnerOrg, loserOrg, s.season, s.week);
});
s = { ...s, orgWarRecord: ppvOwr };
```

### フック4: AI同士の対抗戦

AI週次処理（tickWeek内のAIループ）で対抗戦が発生している場合、その結果も記録。
まず `engine.js` のAI対抗戦処理箇所を確認し、同様のフックを追加。

AI対抗戦がどのように処理されているかコードを確認して適切な箇所にフック。
AI同士の対抗戦は `aiOrgs` 内で処理されている可能性がある。
見つからない場合は、AI対抗戦の仕組みを調査してから追加。

---

## 3. orgPopHistory 新設

### データ構造

```javascript
// state.orgPopHistory
// { player: [{ season: 1, start: 10 }, ...], org_s: [...], ... }
```

### 記録タイミング

`tickWeek` 内でシーズンが変わった瞬間（week===1 の初回処理、またはシーズン初期化処理）に、
全団体の現在の orgPop を `start` として記録。

```javascript
// シーズン開始処理内に追加
const oph = { ...(state.orgPopHistory || {}) };
// プレイヤー
const pHist = [...(oph.player || [])];
pHist.push({ season: state.season, start: Math.round(state.orgPop) });
oph.player = pHist;
// AI各団体
for (const org of RIVAL_ORGS) {
  const aiOrg = state.aiOrgs?.[org.id];
  if (!aiOrg) continue;
  const aHist = [...(oph[org.id] || [])];
  aHist.push({ season: state.season, start: Math.round(aiOrg.orgPop) });
  oph[org.id] = aHist;
}
state = { ...state, orgPopHistory: oph };
```

`end` は保持しない。現在値は `state.orgPop` / `state.aiOrgs[id].orgPop` からリアルタイム取得。

---

## 4. initialState への追加

`Engine.createInitialState()` 内（または同等の初期化箇所）に以下を追加:

```javascript
orgWarRecord: {},
orgPopHistory: {
  player: [{ season: 1, start: Math.round(initialOrgPop) }],
  // AI各団体も同様に初期値を記録
},
```

---

## 5. 既存セーブデータ互換

`orgWarRecord` / `orgPopHistory` が存在しない場合、アクセス時に空オブジェクト/空配列をフォールバック。
マイグレーション処理は不要（0-0スタートでOK）。

---

## 6. 検証ポイント

- 対抗戦を実行して orgWarRecord に記録されるか確認
- PPVを実行してサミット + クロス対戦が記録されるか確認
- `Engine.orgWar.getFor(state, 'player', 'org_s')` で自分視点の数字が正しく返るか確認
- AI同士の記録が入っているか確認
- シーズンまたぎで orgPopHistory に新エントリが追加されるか確認
- 既存セーブをロードしてエラーが出ないか確認（フォールバック動作）

---

## スコープ外（今回はやらない）

- UI表示（団体比較タブへの反映）
- 黒田幸子のテキスト
- 新聞タブの豪華化
- テキストレパートリー追加

上記は次フェーズで実施。
