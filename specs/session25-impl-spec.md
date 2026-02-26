# セッション25 実装指示書：内部小数化 + MQボーナス体系見直し

> **目的**: 全リバランスの前提基盤（内部小数化）+ MQ外部ボーナスキャップ導入
> **対象ファイル**: engine.js, data.js, ui-render.js, ui-common.js, app.js
> **設計根拠**: difficulty-rebalance-design-v1.0.md §8.3（第0弾＋第1.5弾）

---

## Part 1: 内部小数化

### 1.1 方針

- `popularity` と `orgPop` を**小数第2位まで**内部で保持する
- `heatScore` は既に小数で動いているため変更なし
- **表示は Math.round()（四捨五入）** で整数化
- 表示用ヘルパー関数 `Engine.util.dispPop(v)` を新設 → `Math.round(v)` を返す
- マイグレーション不要（既存の整数値はそのまま小数として扱える）

### 1.2 engine.js の変更

#### A. ヘルパー関数追加

```javascript
// Engine.util に追加
dispPop(v) { return Math.round(v || 0); },
dispOrgPop(v) { return Math.round(v || 0); },
```

#### B. popularity 系 — Math.round() の除去（小数のまま返す）

| 箇所 | 行（目安） | 現行 | 変更後 |
|------|-----------|------|--------|
| `applyDiminishing()` | L402 | `Math.max(0, Math.round(rawGain * mult))` | `Math.max(0, rawGain * mult)` |
| `applyInjuryDecay()` | L433 | `Math.round((fighter.preInjuryPop \|\| fighter.popularity) * 0.5)` | そのまま `* 0.5`（Math.round除去） |
| `applyTransferReset()` | L449 | `Math.max(1, Math.round(fighter.popularity * TRANSFER_POP_MULT))` | `Math.max(1, fighter.popularity * TRANSFER_POP_MULT)` |
| `applyMQPopularity()` | L2865 | `Engine.util.clamp(c.popularity + popDelta, 1, 100)` | 変更不要（既にclampのみ） |
| 自然減衰 | L2336 | `Math.max(10, Math.round((c.popularity - 0.5) * 10) / 10)` | `Math.max(10, c.popularity - 0.5)` |
| タイトル防衛pop | L724 | `Math.min(100, c.popularity + titlePopGain)` | 変更不要 |
| タイトル王座獲得pop | L744 | `Math.min(100, c.popularity + Engine.popularity.applyDiminishing(2, c.popularity))` | 変更不要 |
| フレーバーイベントpop | L948 | `Math.min(100, c.popularity + ev.popGain)` | 変更不要（popGain自体を小数にする必要なし。+2/+3の整数加算は問題なし） |
| プロモpop | L2309-2310 | `nc.popularity + diminishedGain` → `Math.min(PROMO_POP_CAP, Math.min(100, newPop))` | 変更不要（diminishedGain が小数化される） |
| スキャンダルpop | L2330 | `Math.max(1, c.popularity + scandal.popDelta)` | 変更不要 |
| AI選手pop | L1905 | `Math.round(f.popularity + diff * rate + randomDelta)` | `f.popularity + diff * rate + randomDelta`（Math.round除去） |
| マイグレーション内 | app.js L1195 | `Math.round(c.popularity * 0.5 + targetPop * 0.5)` | `c.popularity * 0.5 + targetPop * 0.5`（Math.round除去） |

#### C. orgPop 系 — 確率的丸め → 小数蓄積に変更

`Engine.orgPop.applyOrgPopChange()` を以下に書き換え：

```javascript
applyOrgPopChange(rawDelta, orgPop, rng) {
  if (rawDelta > 0) {
    const mult = Engine.orgPop.getDiminishingMultiplier(orgPop);
    return rawDelta * mult;  // 小数のまま返す（確率的丸め不要）
  }
  // 下落には逓減を適用しない
  return rawDelta;
},
```

`applyShowPopularity()` — 変更不要（既に `orgPop + popDelta` → `clamp` の構造）

`calcAnnualDecay()` — 返値は整数のままでOK（年次の大きな減衰なので小数精度不要）

#### D. バトルエンジン内MQの丸め

`simulateMatch()` の最終行 L375:
```javascript
// 現行
mq = Math.round(Engine.util.clamp(mq, 5, 100));
// 変更後（バトル内部MQは整数で問題ない。外部ボーナスも整数値の加算なので）
mq = Math.round(Engine.util.clamp(mq, 5, 100));
// → 変更不要
```

### 1.3 UI表示の変更

**原則**: `.popularity` や `.orgPop` を直接表示している箇所を `Engine.util.dispPop()` / `Engine.util.dispOrgPop()` で包む。

#### ui-render.js

| 行（目安） | 現行 | 変更後 |
|-----------|------|--------|
| L25 | `G.orgPop` | `Engine.util.dispOrgPop(G.orgPop)` |
| L822 | `f.popularity` | `Engine.util.dispPop(f.popularity)` |
| L1021 | `c.popularity` | `Engine.util.dispPop(c.popularity)` |
| L1355 | `G.orgPop` | `Engine.util.dispOrgPop(G.orgPop)` |
| L1381 | `aiData.orgPop` | `Engine.util.dispOrgPop(aiData.orgPop)` |
| L1443 | `G.orgPop || 0` | `Engine.util.dispOrgPop(G.orgPop)` |
| L1554 | `${orgPop}` | `${Engine.util.dispOrgPop(orgPop)}` |
| L1776 | `info.orgPop` | `Engine.util.dispOrgPop(info.orgPop)` |

#### ui-common.js

| 行（目安） | 現行 | 変更後 |
|-----------|------|--------|
| L1055 | `d.popularity` | `Engine.util.dispPop(d.popularity)` |
| L1082 | `c1.popularity` | `Engine.util.dispPop(c1.popularity)` |
| L1093 | `c.popularity` | `Engine.util.dispPop(c.popularity)` |
| L1414 | `c.popularity` | `Engine.util.dispPop(c.popularity)` |
| L1424 | `c.popularity` | `Engine.util.dispPop(c.popularity)` |
| L1430 | `c.popularity` | `Engine.util.dispPop(c.popularity)` |

#### app.js — イベントログ内の表示

| 行（目安） | 内容 | 変更 |
|-----------|------|------|
| L2337 | `popResult.popDelta` と `popResult.orgPop` をログ表示 | `popDelta` → `Math.round(popDelta * 100) / 100` で小数2桁表示、 `orgPop` → `Engine.util.dispOrgPop()` |

#### engine.js — イベントログ内の表示

L2688（processShow内）: 同様に `popResult.popDelta` と `popResult.orgPop` をログ表示している箇所があれば、dispOrgPopで包む。

**注意**: engine.js内にDOM操作はないが、返す`events`配列の文字列テンプレート内で値を表示している箇所がある。popDeltaは `+0.35` のように小数を含むことになるので、ログでは四捨五入して `+0` と表示するか、小数1桁 `+0.4` で表示するか判断が必要。
→ **推奨: ログ内のorgPop変動は整数表示（Math.round(popDelta)）。ただし0の場合でも `±0` と表示して「変動はあるが丸めで0」を示す**

### 1.4 判定・比較箇所の注意

`orgPop` を整数と比較しているif文（例: `orgPop >= 40`）は**変更不要**。小数値 `39.8` は `>= 40` を満たさないので、意味的に正しい。補助金打ち切り通知 `state.orgPop < 40 && popResult.orgPop >= 40` も同様に正しく動く。

`popularity` のif文比較（`popularity >= 55` 等）も同様に変更不要。

---

## Part 2: MQボーナス体系見直し

### 2.1 概要

外部ボーナスの個別値を引き下げ + 合計キャップ（+15）を導入。
「試合内容がMQの85〜90%を決め、外部要素は味付け」を実現する。

### 2.2 data.js の変更

#### RIVALRY_THRESHOLDS（L664-667）

```javascript
// 現行
const RIVALRY_THRESHOLDS = [
  {matches:2, label:'因縁', mqBonus:8, color:'#fdcb6e', emoji:'⚡'},
  {matches:4, label:'宿敵', mqBonus:15, color:'#e17055', emoji:'🔥'},
  {matches:7, label:'永遠のライバル', mqBonus:22, color:'#d63031', emoji:'💥'}
];

// 変更後
const RIVALRY_THRESHOLDS = [
  {matches:2, label:'因縁', mqBonus:3, color:'#fdcb6e', emoji:'⚡'},
  {matches:4, label:'宿敵', mqBonus:5, color:'#e17055', emoji:'🔥'},
  {matches:7, label:'永遠のライバル', mqBonus:8, color:'#d63031', emoji:'💥'}
];
```

#### TITLES（L660）

```javascript
// 現行
{id:'world', name:'団体王座', mqBonus:15, popBonus:3, attendBonus:1.15, emoji:'🏆'}

// 変更後
{id:'world', name:'団体王座', mqBonus:5, popBonus:3, attendBonus:1.15, emoji:'🏆'}
```

#### CROWD_HEAT_MQ（L589-596）

```javascript
// 現行
const CROWD_HEAT_MQ = [
  { min: 0.95, bonus: +5, label: '超満員の熱気' },
  { min: 0.80, bonus: +3, label: '大入りの声援' },
  { min: 0.60, bonus: +1, label: '盛況の雰囲気' },
  { min: 0.40, bonus:  0, label: '' },
  { min: 0.25, bonus: -1, label: '空席の静けさ' },
  { min: 0.00, bonus: -3, label: 'ガラガラの寂しさ' },
];

// 変更後
const CROWD_HEAT_MQ = [
  { min: 0.95, bonus: +3, label: '超満員の熱気' },
  { min: 0.80, bonus: +2, label: '大入りの声援' },
  { min: 0.60, bonus: +1, label: '盛況の雰囲気' },
  { min: 0.40, bonus:  0, label: '' },
  { min: 0.25, bonus: -1, label: '空席の静けさ' },
  { min: 0.00, bonus: -3, label: 'ガラガラの寂しさ' },
];
```

#### VENUE_SCALE_MQ（L597）

```javascript
// 現行
const VENUE_SCALE_MQ = [0, 0, 1, 1, 2, 2, 3];

// 変更後
const VENUE_SCALE_MQ = [0, 0, 0, 1, 1, 1, 2];
```

#### コーチMQボーナス（L698）— 紅林セコンド

```javascript
// 現行
{id:7, name:'紅林セコンド', emoji:'🎬', specialty:'mq', mqBonus:3, ...}

// 変更後
{id:7, name:'紅林セコンド', emoji:'🎬', specialty:'mq', mqBonus:2, ...}
```

### 2.3 engine.js の変更 — MQキャップ導入

`processShow()` 内、バトル結果に外部ボーナスを加算している箇所（L2622-2675）を改修。

**現行の流れ**:
1. バトルエンジン → baseMQ
2. + 因縁ボーナス（L2629）
3. + タイトルボーナス（L2630）
4. + コーチボーナス（L2635）
5. + 観客ボーナス（L2671）

**改修後の流れ**:
1. バトルエンジン → baseMQ（ここは変えない）
2. 外部ボーナスを**別途集計**し、合計をキャップ
3. baseMQ + min(外部合計, MQ_EXTERNAL_CAP) で最終MQ

#### 定数追加（engine.js冒頭またはdata.js）

```javascript
const MQ_EXTERNAL_CAP = 15;  // 外部ボーナス合計の上限
```

#### processShow() 改修

```javascript
const results = validMatches.map(m => {
  const charL = roster.find(c => c.id === m.left);
  const charR = roster.find(c => c.id === m.right);
  if (!charL || !charR) return null;
  const matchRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, m.left, m.right));
  const result = Engine.battle.simulateMatch(charL, charR, matchRng);

  // --- 外部MQボーナス集計（キャップ付き） ---
  let externalMQ = 0;

  const rivalLvl = Engine.title.getRivalryLevel({ ...s, rivalries }, m.left, m.right);
  if (rivalLvl) {
    externalMQ += rivalLvl.mqBonus;
    result.rivalryBonus = rivalLvl;
  }

  if (m.isTitle) {
    externalMQ += (TITLES.find(t => t.id === 'world')?.mqBonus || 5);
    result.isTitleMatch = true;
  }

  const coachMQ = Engine.coach.getMQBonusForMatch(s, m.left, m.right);
  if (coachMQ > 0) {
    externalMQ += coachMQ;
    result.coachMQBonus = coachMQ;
  }

  // キャップ適用
  const cappedExternal = Math.min(externalMQ, MQ_EXTERNAL_CAP);
  result.mq = Math.min(100, result.mq + cappedExternal);
  result.externalMQBonus = cappedExternal;
  result.externalMQRaw = externalMQ;

  return result;
}).filter(Boolean);

// 観客ボーナスも外部ボーナスの一部としてキャップに含める
// → 注意: 観客ボーナスはカード全体に一律適用されるため、
//   上記の per-match キャップとは別に処理する必要がある。
//
// 方針: 観客ボーナスは「per-match externalMQに加算してからキャップ」に統一。
// ただし現行は観客ボーナスが全試合一律適用のため、processShow内で
// 2パスにする必要がある。
//
// 推奨アプローチ:
//   Pass 1: バトル結果を生成（外部ボーナスなし）
//   Pass 2: 各試合ごとに externalMQ = 因縁 + タイトル + コーチ + 観客
//           → min(externalMQ, MQ_EXTERNAL_CAP) を加算
```

**具体的な実装（2パス方式）**:

```javascript
// Pass 1: バトル結果生成（外部ボーナスなし・因縁情報の記録のみ）
const rawResults = validMatches.map(m => {
  const charL = roster.find(c => c.id === m.left);
  const charR = roster.find(c => c.id === m.right);
  if (!charL || !charR) return null;
  const matchRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, m.left, m.right));
  const result = Engine.battle.simulateMatch(charL, charR, matchRng);

  // メタデータ記録（MQにはまだ加算しない）
  const rivalLvl = Engine.title.getRivalryLevel({ ...s, rivalries }, m.left, m.right);
  if (rivalLvl) result.rivalryBonus = rivalLvl;
  if (m.isTitle) result.isTitleMatch = true;
  result.coachMQBonus = Engine.coach.getMQBonusForMatch(s, m.left, m.right);

  // 因縁更新（副作用）
  const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right);
  rivalries = rivalResult.rivalries;
  if (rivalResult.msg) events.push(rivalResult.msg);

  return result;
}).filter(Boolean);

// タイトル処理は rawResults の winner を使って先に実行（現行通り）
// ...（既存のタイトル処理コード）...

// 観客MQ算出（満員率＋会場規模。現行ロジックそのまま）
const showMatchPops = validMatches.map(m => { /* 現行通り */ });
const showCardPop = Engine.economy.calcCardPop(showMatchPops);
// ... preAttendance, preOccRate 算出 ...
const crowdMQ = Engine.economy.calcCrowdMQBonus(s.showVenue, preOccRate);

// Pass 2: 外部ボーナスキャップ適用
const results = rawResults.map(r => {
  let externalMQ = 0;
  if (r.rivalryBonus) externalMQ += r.rivalryBonus.mqBonus;
  if (r.isTitleMatch) externalMQ += (TITLES.find(t => t.id === 'world')?.mqBonus || 5);
  if (r.coachMQBonus > 0) externalMQ += r.coachMQBonus;
  externalMQ += crowdMQ.total;  // 観客ボーナスも合算

  const cappedExternal = Math.min(Math.max(externalMQ, crowdMQ.total < 0 ? crowdMQ.total : 0), MQ_EXTERNAL_CAP);
  // 注: 観客ペナルティ（ガラガラ -3）はキャップの対象外にする。
  //     マイナスはそのまま通す。
  //     → 最終的に: positiveExternal をキャップ + negativeExternal はそのまま

  // より正確な実装:
  const positiveExternal = Math.max(0, externalMQ);
  const negativeExternal = Math.min(0, externalMQ);
  const cappedPositive = Math.min(positiveExternal, MQ_EXTERNAL_CAP);

  r.mq = Engine.util.clamp(r.mq + cappedPositive + negativeExternal, 5, 100);
  r.externalMQBonus = cappedPositive + negativeExternal;
  return r;
});
```

### 2.4 battle-engine.html への反映

battle-engine.html（ビジュアル観戦モード）は独立したバトルエンジンのコピーを持つ。
MQボーナスのキャップは processShow 側の処理なので battle-engine.html の変更は不要。
ただし、外部ボーナスをUI上に表示している箇所があれば、新しい値に合わせる。

### 2.5 名勝負製造機・引き出し上手（バトル内部特性）の扱い

名勝負製造機（+5）と引き出し上手（最大+8）はバトルエンジン内部で加算されるため、
外部ボーナスキャップの対象外。これは意図的な設計：**選手の特性は「試合内容」の一部**。

---

## Part 3: ログ・イベント文言の調整

### 3.1 因縁発展メッセージ

L701付近で因縁発展時に `MQ+${newLvl.mqBonus}` を表示している。
新しい値に自動的に追従するため、変更不要。

### 3.2 orgPop変動ログ

L2688:
```javascript
// 現行
events.push(`📊 興行平均MQ: ${Math.round(results.reduce((a,r) => a + r.mq, 0) / results.length)} → 団体人気${popResult.popDelta >= 0 ? '+' : ''}${popResult.popDelta} (現在: ${popResult.orgPop})`);

// 変更後: popDeltaを小数1桁表示、orgPopを整数表示
events.push(`📊 興行平均MQ: ${Math.round(results.reduce((a,r) => a + r.mq, 0) / results.length)} → 団体人気${popResult.popDelta >= 0 ? '+' : ''}${Math.round(popResult.popDelta * 10) / 10} (現在: ${Engine.util.dispOrgPop(popResult.orgPop)})`);
```

---

## Part 4: テスト確認事項

実装後にClaude Codeで以下を確認：

1. **小数蓄積テスト**: orgPop 80の状態で興行を回し、`popDelta` が `0.24` のような小数で蓄積されることを確認
2. **人気小数テスト**: popularity 80+の選手がMQ50帯の試合をした際、`applyDiminishing` が `0.2` のような小数を返すことを確認
3. **MQキャップテスト**: 因縁lv3(+8) + タイトル(+5) + コーチ(+2) + 超満員(+3) = +18 → キャップで+15に制限されることを確認
4. **表示テスト**: UI上ですべてのpopularity/orgPopが整数で表示されることを目視確認
5. **セーブ/ロードテスト**: 小数値を含むセーブデータが正しくロード・表示されることを確認
6. **マイナス観客ボーナスがキャップをすり抜けること**: ガラガラ(-3)は合計+15キャップとは別にそのまま適用

---

## 変更サマリー

| ファイル | 変更概要 |
|---------|---------|
| **engine.js** | `Engine.util.dispPop/dispOrgPop` 追加。`applyDiminishing` 等からMath.round除去。`applyOrgPopChange` 確率的丸め→小数返却。processShow 2パス方式でMQ外部キャップ導入 |
| **data.js** | RIVALRY_THRESHOLDS mqBonus → 3/5/8。TITLES mqBonus → 5。CROWD_HEAT_MQ bonus → 3/2/1。VENUE_SCALE_MQ → 0/0/0/1/1/1/2。コーチmqBonus → 2。MQ_EXTERNAL_CAP = 15 追加 |
| **ui-render.js** | popularity/orgPop表示を `dispPop`/`dispOrgPop` で包む（8箇所） |
| **ui-common.js** | popularity表示を `dispPop` で包む（6箇所） |
| **app.js** | ログ内orgPop表示をdispOrgPopで包む。マイグレーション内のMath.round除去 |

---

## ロードマップ更新指示

セッション25完了後、game-system-roadmap.md の「次セッション予定」を更新：
- #1 内部小数化 → ✅ 完了
- #3 MQボーナス体系見直し → ✅ 完了
- 設計決定ログに以下を追加：
  - **内部小数化（セッション25）** — popularity/orgPopを小数第2位まで保持。表示はMath.round。Engine.util.dispPop/dispOrgPop新設
  - **MQ外部ボーナスキャップ（セッション25）** — 外部ボーナス合計を+15で頭打ち。因縁3/5/8、タイトル5、コーチ2、満員3、会場0-2。ガラガラペナルティはキャップ対象外
