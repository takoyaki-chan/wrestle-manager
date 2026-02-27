# WRESTLE MANAGER v0.9 — ライバル団体システム仕様書

## 1. 概要

### コンセプト
プレイヤー団体を含む3団体が同じ業界で競争する。
直接対戦（対抗戦）はなく、**ランキング競争**と**選手市場の奪い合い**が中心。

### 3団体

| 団体 | 名前 | タイプ | 初期資金 | 初期orgPop | ロスター |
|---|---|---|---|---|---|
| プレイヤー | （既存） | — | 5,000万 | 10 | 8名 |
| ライバルA | 皇輝女子プロレス（こうきじょし） | 老舗大団体 | 8,000万 | 45 | 10名 |
| ライバルB | ネオスター・プロレス | 新興団体 | 3,000万 | 15 | 6名 |

- **皇輝女子**: 資金力と知名度で安定経営。ベテラン＋中堅揃い。守りが堅いが革新性は低い
- **ネオスター**: 低予算だが若手の勢いがある。積極的にFAを獲得し急成長を狙う

### キャラクター配分（80名）
- プレイヤー初期: 8名（既存のまま）
- 皇輝女子: 10名（OVR中〜高めの選手を自動選出）
- ネオスター: 6名（OVR低〜中の若手ポテンシャル寄りを自動選出）
- フリーエージェント: 56名（残り）

選出ロジック:
```js
// initRoster() 内で実行
// 1. 既存プレイヤーロスター8名を確保
// 2. 残り72名から皇輝向けにOVR上位10名を選出
// 3. 残り62名から若手ポテンシャル上位6名をネオスター向けに選出
// 4. 残り56名がFA
```

---

## 2. ライバル団体データ構造

### 定数: RIVAL_ORGS

```js
const RIVAL_ORGS = [
  {
    id: 'kouki',
    name: '皇輝女子プロレス',
    shortName: '皇輝',
    emoji: '👑',
    color: '#e74c3c',
    type: 'established',   // 老舗
    initFunds: 8000,
    initPop: 45,
    rosterSize: 10,        // 初期ロスター
    targetRoster: 12,      // 目標ロスター数（足りなければFAを狙う）
    scoutBias: 'ovr',      // OVR重視でスカウト
    aggression: 0.3,       // 引き抜き積極性（0-1）
    growthMod: 0.8,        // 成長倍率（老舗はやや鈍化）
    desc: '業界の名門。資金力と知名度で安定経営。'
  },
  {
    id: 'neostar',
    name: 'ネオスター・プロレス',
    shortName: 'ネオスタ',
    emoji: '⚡',
    color: '#3498db',
    type: 'upstart',       // 新興
    initFunds: 3000,
    initPop: 15,
    rosterSize: 6,
    targetRoster: 10,
    scoutBias: 'potential', // ポテンシャル重視
    aggression: 0.6,        // 積極的
    growthMod: 1.2,         // 新興は勢いがある
    desc: '新世代の旗手。若手中心で急成長を狙う。'
  }
];
```

### ゲームステート追加

```js
// G に追加
G.rivals = {
  kouki: {
    roster: [],         // キャラクターオブジェクト配列
    funds: 8000,
    orgPop: 45,
    heatScore: 3,       // 老舗なので初期やや高め
    seasonAvgMQ: 0,
    seasonShowCount: 0,
    seasonTotalMQ: 0,
    seasonAvgAttendance: 0,
    seasonTotalAttendance: 0,
    titles: { world: { championId: null, defenses: 0 } }
  },
  neostar: {
    roster: [],
    funds: 3000,
    orgPop: 15,
    heatScore: 0,
    seasonAvgMQ: 0,
    seasonShowCount: 0,
    seasonTotalMQ: 0,
    seasonAvgAttendance: 0,
    seasonTotalAttendance: 0,
    titles: { world: { championId: null, defenses: 0 } }
  }
};

// 移籍市場ステート
G.transferWindow = {
  active: false,
  offers: [],       // 受信中のオファー {fromOrg, charId, offerAmount}
  results: []       // 今Qの移籍結果ログ
};
```

---

## 3. ランキングシステム

### 複合ランキングポイント（RP）

```
RP = (orgPop × 2.0)
   + (所属選手の平均人気 × 1.5)
   + (所属選手の平均OVR × 1.0)
   + (シーズン平均MQ × 2.0)
   + (平均集客率 × 150)  ← 0-1の率を150倍
```

| 要素 | ウェイト | 最大寄与 | 意図 |
|---|---|---|---|
| 団体人気 | ×2.0 | 200 | ブランド力 |
| 選手平均人気 | ×1.5 | 150 | スター性 |
| 選手平均OVR | ×1.0 | ~110 | 戦力の厚み |
| シーズン平均MQ | ×2.0 | 200 | 興行の質 |
| 平均集客率 | ×150 | 150 | ファン動員力 |

→ 最大約810ポイント。序盤はorgPopとOVRが支配的、中盤以降はMQと集客が重要に。

### 計算関数

```js
function calcRankingPoints(orgData, roster) {
  const avgPop = roster.length > 0 ? roster.reduce((s,c) => s + c.popularity, 0) / roster.length : 0;
  const avgOvr = roster.length > 0 ? roster.reduce((s,c) => s + ov(c), 0) / roster.length : 0;
  const avgMQ = orgData.seasonShowCount > 0 ? orgData.seasonTotalMQ / orgData.seasonShowCount : 0;
  const avgAtt = orgData.seasonShowCount > 0 ? orgData.seasonTotalAttendance / orgData.seasonShowCount : 0;
  
  return Math.round(
    orgData.orgPop * 2.0 +
    avgPop * 1.5 +
    avgOvr * 1.0 +
    avgMQ * 2.0 +
    avgAtt * 150  // 0-1 rate
  );
}
```

### ランキング報酬（シーズン末）

| 順位 | 報酬 | 効果 |
|---|---|---|
| 1位 | スポンサー契約ボーナス +500万 | 次シーズンのスポンサー収入+20% |
| 2位 | 業界注目 +200万 | 次シーズンのorgPop+5 |
| 3位 | なし | 特になし（でも倒産してなければOK） |

---

## 4. ライバル団体のシミュレーション

### 4A. 毎週の処理（processRivalWeek）

ライバル団体は毎週以下を自動処理:

```
1. 選手コンディション回復（全員一律 +5〜10）
2. 興行週（偶数週）→ シミュレート興行
3. 非興行週 → 練習（全選手微成長）
4. 経済処理（給与支払い、収入計算）
5. 倒産チェック（funds < -2000 → 解散イベント）
```

### 4B. 興行シミュレーション

ライバルの興行は簡易計算。実際にバトルエンジンは回さない。

```js
function simulateRivalShow(rivalId) {
  const org = RIVAL_ORGS.find(r => r.id === rivalId);
  const state = G.rivals[rivalId];
  const roster = state.roster;
  if (roster.length < 2) return;

  // 平均OVRベースでMQを生成
  const avgOvr = roster.reduce((s,c) => s + ov(c), 0) / roster.length;
  const baseMQ = Math.round(avgOvr * 0.5 + Math.random() * 20 + state.heatScore * 2);
  const mq = Math.max(10, Math.min(100, baseMQ));
  
  // 集客率（orgPop + MQベース）
  const attendRate = Math.min(1.0, (state.orgPop / 100) * 0.6 + (mq / 100) * 0.4);
  
  // MQ統計更新
  state.seasonShowCount++;
  state.seasonTotalMQ += mq;
  state.seasonTotalAttendance += attendRate;
  state.seasonAvgMQ = Math.round(state.seasonTotalMQ / state.seasonShowCount);
  
  // Heat更新（MQ 50以上で上昇、以下で下降）
  if (mq >= 60) state.heatScore = Math.min(10, state.heatScore + 1);
  else if (mq < 40) state.heatScore = Math.max(-10, state.heatScore - 1);
  
  // orgPop微変動
  if (mq >= 70) state.orgPop = Math.min(100, state.orgPop + 1);
  else if (mq < 30) state.orgPop = Math.max(0, state.orgPop - 1);

  // 収入計算（簡易）
  const revenue = Math.round(attendRate * state.orgPop * 5); // 簡易収入
  const expense = roster.reduce((s,c) => s + calcSalaryForOvr(ov(c)), 0) + 50; // 給与+固定費
  state.funds += revenue - expense;

  // 選手人気変動
  roster.forEach(c => {
    if (mq >= 50) c.popularity = Math.min(100, c.popularity + Math.floor(Math.random()*2));
  });
}
```

### 4C. ライバル選手の成長

非興行週にライバル選手も微成長:

```js
function processRivalGrowth(rivalId) {
  const org = RIVAL_ORGS.find(r => r.id === rivalId);
  const state = G.rivals[rivalId];
  state.roster.forEach(c => {
    if (c.injury) { c.injury.weeksLeft--; if (c.injury.weeksLeft <= 0) c.injury = null; return; }
    const stats = ['pw','sp','te','st','mn'];
    const stat = pk(stats);
    const pot = c.pot[stat];
    const gap = pot - c[stat];
    if (gap <= 0) return;
    // ベース成長 × 団体の成長補正
    let growth = Math.max(0, Math.round(gap * 0.015 + Math.random() * 1.0));
    growth = Math.round(growth * org.growthMod);
    c[stat] = Math.min(pot, c[stat] + growth);
    // コンディション回復
    c.condition = Math.min(100, c.condition + 5 + Math.floor(Math.random()*5));
  });
}
```

---

## 5. 移籍ウィンドウ

### 5A. 発生タイミング

四半期末（第12週, 24週, 36週, 48週）に移籍ウィンドウが開く。
ウィンドウは1週間（その週のmanageフェーズで処理）。

```js
function isTransferWindow(week) {
  return week % 12 === 0;
}
```

### 5B. ライバル → FA（先を越される）

ライバルがFAプールから選手を獲得。プレイヤーより先に動く。

```js
function processRivalScoutFA(rivalId) {
  const org = RIVAL_ORGS.find(r => r.id === rivalId);
  const state = G.rivals[rivalId];
  
  // ロスターが目標数未満なら獲得を試みる
  const need = org.targetRoster - state.roster.length;
  if (need <= 0 || state.funds < 100) return;
  
  // スカウト方針に基づいてFAをソート
  let candidates = [...G.freeAgents];
  if (org.scoutBias === 'ovr') {
    candidates.sort((a,b) => ov(b) - ov(a));
  } else {
    // ポテンシャル重視
    candidates.sort((a,b) => {
      const potA = Object.values(a.pot).reduce((s,v)=>s+v,0);
      const potB = Object.values(b.pot).reduce((s,v)=>s+v,0);
      return potB - potA;
    });
  }
  
  // 最大2名まで獲得
  const pickCount = Math.min(need, 2, candidates.length);
  for (let i = 0; i < pickCount; i++) {
    const target = candidates[i];
    const fee = 50 + ov(target); // 簡易獲得費
    if (state.funds < fee) continue;
    
    // FAプールから除去 → ライバルロスターへ
    G.freeAgents = G.freeAgents.filter(c => c.id !== target.id);
    state.roster.push(target);
    state.funds -= fee;
    
    G.transferWindow.results.push({
      type: 'rival_scout',
      org: org.shortName,
      charName: target.name,
      charOvr: ov(target)
    });
    G.gameLog.push(`📰 ${org.emoji}${org.shortName}が${target.name}(OVR${ov(target)})を獲得！`);
  }
}
```

### 5C. ライバル → 自団体（引き抜きオファー）

ライバルがプレイヤーの選手に引き抜きオファーを出す。

**オファー発生条件:**
- ライバルのロスターが目標数未満
- ライバルの資金が十分
- aggression値による確率判定

**オファー内容:**
- 移籍金 = 選手のOVR × 3万（目安: OVR60 → 180万）
- 給与UP提示あり

```js
function processRivalPoachAttempt(rivalId) {
  const org = RIVAL_ORGS.find(r => r.id === rivalId);
  const state = G.rivals[rivalId];
  
  if (state.roster.length >= org.targetRoster) return;
  if (state.funds < 300) return;
  if (Math.random() > org.aggression) return; // 積極性チェック
  
  // プレイヤーロスターからターゲット選出（ロスター5名以下なら狙わない）
  if (G.roster.length <= 5) return;
  
  // 高OVR or 高人気の選手を狙う
  const targets = G.roster
    .filter(c => !c.injury) // 怪我中は狙わない
    .filter(c => G.titles.world.championId !== c.id) // チャンピオンは狙わない
    .sort((a,b) => (ov(b) + b.popularity) - (ov(a) + a.popularity));
  
  if (targets.length === 0) return;
  
  const target = targets[0];
  const offerAmount = Math.round(ov(target) * 3);
  
  // オファーをキューに追加（プレイヤーが判断）
  G.transferWindow.offers.push({
    fromOrg: rivalId,
    charId: target.id,
    charName: target.name,
    offerAmount: offerAmount,
    responded: false
  });
  
  G.gameLog.push(`⚠️ ${org.emoji}${org.shortName}が${target.name}に引き抜きオファー（移籍金${offerAmount}万）！`);
}
```

**プレイヤーの対応（UIで選択）:**

| 選択 | 効果 |
|---|---|
| 引き留め（給与+50%） | 選手残留。週給が1.5倍に（永続） |
| 拒否（引き留めなし） | 満足度チェック → 低ければ移籍成立 |
| 承認（移籍金を受け取る） | 選手がライバルへ。移籍金を獲得 |

**満足度判定（拒否時）:**
```
残留確率 = 50% + (自団体orgPop - ライバルorgPop) + (選手のcondition/5)
         → clamp(20%, 90%)
```
自団体の人気が高く、選手の体調が良ければ残留しやすい。

### 5D. 自 → ライバル（プレイヤーが引き抜き）

プレイヤーがライバル所属選手をスカウトできる。

**条件:**
- 移籍ウィンドウ中のみ
- 引き抜き費用 = 選手OVR × 4万（ライバルへの違約金として割高）
- ライバルのロスターが最低4名を下回る引き抜きは不可

**UI:**
移籍ウィンドウ中、スカウト画面にライバル所属選手が表示される。
「引き抜き」ボタンで資金を支払い獲得。

**成功率:**
- 基本80%
- 自団体orgPop > ライバルorgPop なら +10%
- 自団体orgPop < ライバルorgPop なら -20%
- 選手の現OVRが高いほど成功率低下（-0.5%/OVR超過分）

→ 格上団体から引き抜くのは難しく、格下からは容易。

---

## 6. シーズン処理

### シーズン末（第48週）

1. ランキング計算・発表
2. ランキング報酬付与
3. ライバル団体の統計リセット（seasonAvgMQ等）
4. プレイヤー統計リセット（既存処理に追加）

### ライバルのシーズンリセット

```js
function resetRivalSeason(rivalId) {
  const state = G.rivals[rivalId];
  state.seasonShowCount = 0;
  state.seasonTotalMQ = 0;
  state.seasonTotalAttendance = 0;
  state.seasonAvgMQ = 0;
  // 選手の衰退処理（既存ロジックを流用）
  state.roster.forEach(c => {
    if (c.careerSeasons !== undefined) c.careerSeasons++;
  });
}
```

### ライバル団体の解散

funds < -2000 になったライバルは解散。所属選手は全員FAへ。

```js
function checkRivalBankruptcy(rivalId) {
  const state = G.rivals[rivalId];
  if (state.funds >= -2000) return false;
  const org = RIVAL_ORGS.find(r => r.id === rivalId);
  // 全選手をFAに放出
  state.roster.forEach(c => G.freeAgents.push(c));
  state.roster = [];
  state.orgPop = Math.max(0, state.orgPop - 20);
  G.gameLog.push(`💀 ${org.emoji}${org.name}が経営破綻！所属選手が全員フリーに！`);
  return true;
}
```

---

## 7. UI

### 7A. ランキング画面（新規タブ or 既存画面内）

今週画面のトップバーまたは専用タブに「🏆 ランキング」を追加。

```
┌──────────────────────────────────────────┐
│ 🏆 業界ランキング              Y1 Q2    │
├──────────────────────────────────────────┤
│                                          │
│  1位 👑 皇輝女子プロレス     RP: 342    │
│      orgPop:45 | OVR:68 | MQ:55 | 10名  │
│      ━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%   │
│                                          │
│  2位 🏢 あなたの団体         RP: 228    │
│      orgPop:18 | OVR:62 | MQ:48 | 8名   │
│      ━━━━━━━━━━━━━━━━━━ 67%            │
│                                          │
│  3位 ⚡ ネオスター           RP: 195    │
│      orgPop:15 | OVR:55 | MQ:42 | 6名   │
│      ━━━━━━━━━━━━━━━ 57%               │
│                                          │
└──────────────────────────────────────────┘
```

**表示項目:**
- 順位、団体名、RPスコア
- orgPop / 平均OVR / 平均MQ / ロスター数
- RPバー（1位を100%とした相対バー）
- ライバルロスターの概要（名前一覧をクリックで展開）

### 7B. 移籍ウィンドウUI

四半期末に今週画面に移籍ウィンドウ情報を表示:

```
┌──────────────────────────────────────────┐
│ 📰 移籍ウィンドウ開放中！               │
├──────────────────────────────────────────┤
│                                          │
│ ⚠️ 受信オファー                         │
│ ┌────────────────────────────────────┐   │
│ │ 👑皇輝が 山田花子(OVR72) に       │   │
│ │ 引き抜きオファー！ 移籍金: 216万  │   │
│ │ [引き留め(給与+50%)] [拒否] [承認] │   │
│ └────────────────────────────────────┘   │
│                                          │
│ 📰 今期の移籍ニュース                   │
│ ・👑皇輝が佐藤美咲(OVR65)をFA獲得      │
│ ・⚡ネオスタが田中恵(OVR58)をFA獲得     │
│                                          │
│ 💡 スカウト画面でライバル選手の          │
│    引き抜きも可能です                    │
└──────────────────────────────────────────┘
```

### 7C. スカウト画面の拡張

移籍ウィンドウ中、スカウト画面にライバル所属選手セクションを追加:

```
┌──────────────────────────────────────────┐
│ 🔍 スカウト / フリーエージェント (56名)  │
│ ... (既存のFA一覧) ...                   │
│                                          │
│ ─── 📰 移籍ウィンドウ：ライバル選手 ─── │
│                                          │
│ 👑 皇輝女子プロレス (10名)              │
│ ┌──────────────────────────────────────┐ │
│ │ 名前      OVR  人気  引抜費  成功率  │ │
│ │ 鈴木京子   78   65   312万   65%    │ │
│ │           [引き抜き交渉]             │ │
│ │ ...                                  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ⚡ ネオスター (6名)                      │
│ │ ...                                  │ │
└──────────────────────────────────────────┘
```

### 7D. トップバー更新

トップバーに業界順位を表示:

```
既存: Y1 | W12 | Q1 | 💰5,000万 | 📈10 | 🔥中立 | 🏆空位
追加:                                              | 🏅2位/3
```

---

## 8. セーブ/ロード互換性

### セーブ対象追加
- `G.rivals` — ライバル団体全データ
- `G.transferWindow` — 移籍ウィンドウ状態

### v0.8互換

```js
// deserializeState() 内
if (!G.rivals) {
  // v0.8セーブデータの場合、ライバルを初期化
  initRivals(); // 初期ロスター振り分けを実行
}
if (!G.transferWindow) {
  G.transferWindow = { active: false, offers: [], results: [] };
}
```

---

## 9. 実装ボリューム見積もり

### 新規コード

| セクション | 内容 | 推定行数 |
|---|---|---|
| Section 4E: RIVAL_ORGS | ライバル団体定数 | ~30行 |
| Section 5: ステート追加 | G.rivals, G.transferWindow | ~20行 |
| Section 7H: ライバルシステム | シミュレーション、移籍ロジック | ~200行 |
| Section 8: 週間ループ追加 | processRivalWeek()呼び出し | ~30行 |
| Section 9E: ランキングUI | renderRanking() | ~80行 |
| Section 9F: 移籍ウィンドウUI | 移籍オファー表示・操作 | ~100行 |
| Section 9A: スカウト画面拡張 | ライバル選手表示 | ~60行 |
| CSS追加 | ランキング・移籍UI | ~30行 |
| HTML追加 | ランキングタブ or 既存内組込 | ~10行 |
| INIT更新 | initRivals() | ~40行 |

**合計: 約600行追加 → v0.9 推定 3,500行**

### 改修箇所

| 箇所 | 内容 |
|---|---|
| initRoster() | ライバルロスター振り分け追加 |
| processManagePhase() | processRivalWeek()呼び出し |
| renderWeekScreen() | 移籍ウィンドウ＋ランキング表示 |
| renderScout() | ライバル選手セクション追加 |
| refreshAll() | renderRanking()追加 |
| refreshTopBar() | 順位表示追加 |
| serializeState() | rivals, transferWindow含む |
| deserializeState() | v0.8互換処理 |
| シーズン末処理 | ランキング報酬＋リセット |

---

## 10. 週間処理フロー（v0.9）

```
毎週の処理順序:
1. processManagePhase()     ← 既存（プレイヤー）
2. processRivalWeek('kouki')  ← 新規
3. processRivalWeek('neostar') ← 新規
4. 移籍ウィンドウチェック（Q末のみ）
   a. ライバル→FA獲得
   b. ライバル→プレイヤー引き抜きオファー生成
   c. プレイヤーの判断を待つ（UIで操作）
5. settleWeek()             ← 既存（経済処理）
6. ライバル倒産チェック
7. ランキング更新
```

---

## 11. バランスノート

### 引き抜きコスト目安

| 選手OVR | ライバル→自（移籍金） | 自→ライバル（引抜費） |
|---|---|---|
| 50 | 150万 | 200万 |
| 65 | 195万 | 260万 |
| 80 | 240万 | 320万 |
| 95 | 285万 | 380万 |

→ 自分から引き抜く方が割高（違約金込み）

### 引き留めコスト
- 給与+50%は永続なので、高OVR選手ほど重い負担
- 例: OVR80の選手（週給35万） → 引き留め後52万/週 → 年間+816万の追加コスト
- 承認して移籍金を受け取り、FAから代替を探す方が安い場合も

### ライバルの経済バランス
- 皇輝: 高収入だが高コスト（大ロスター）。安定するが急成長しない
- ネオスター: 低コストだが低収入。成長率が高いので中盤から伸びる
- プレイヤー: 両方の中間。判断次第でどちらにもなれる
