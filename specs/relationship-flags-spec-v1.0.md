# 🏷️ 関係性フラグシステム仕様書 v1.0

> **ステータス**: 🟡 実装完了 / 頻度未達（要次タスク検討）
> **作成日**: 2026-04-28
> **依存**: relationship-system-spec-v2.2.md（数値層 + 称号層）/ character-data-spec-v1.7.md / weekly-gameloop-spec-v1_0.md / chronicle-system-spec-v0.2.md
> **追加実装箇所**: src/relationships.js（フラグ判定・付与・消滅）/ src/management.js（発火フック・モーダルキューイング）/ src/data.js（FLAG_DEFS 追加）/ src/ui-render.js（モーダル14種・履歴表示）
> **🔧マーク = 調整可能パラメータ**

---

## 概要

数値（bond/rivalry）と称号（因縁→宿敵→永遠のライバル）に続く**第3層「フラグ」**を導入する。事件ベースで貼られる「物語の取っ手」であり、数値が減衰しても物語は残ることを保証する。

### 設計原則

1. **事件性が核** — テンプレ条件で量産せず、特定瞬間にだけ確定する
2. **原則永続** — 一度貼られたら、定義された消滅条件以外では消えない
3. **キャパで希少性** — ライバル同期・憧れ・嫉妬は1人につき1組/1人で運命的瞬間を演出
4. **ロックアウトで重み** — 抽選を外した瞬間が運命だった、を構造で表現
5. **演出の取っ手** — 新聞・年表・対戦煽り・ロッカールームから呼び出される
6. **可視性原則** — 全フラグ社長から可視（嫉妬・憧れも含む）

### CLAUDE.md との関係

- 「**数値は嘘をつかない**」原則と整合：フラグは数値層の上に乗り、数値を歪めない
- 「**キャラクターのドラマを覗き見る**」原則と整合：フラグは物語の発火点を提供する
- 「**安易な数値加減算で物事を処理しない**」原則と整合：フラグ消滅時の数値変動は最小限（許さない時の bond -10 / rivalry +10 のみ）

---

## §1 全体像

| ID | フラグ | 方向 | キャパ | 永続性 | 発火 | 消滅 |
|----|--------|------|:------:|--------|------|------|
| F-1 | 裏切り者 | 残留→離脱者（1対多）| なし | 永続 | AI団体離脱（A-1〜A-4）| 出戻り時 |
| F-2 | 出戻り | 個人 | なし | 永続 | AI団体離脱者の再加入 | なし |
| F-3 | 師弟 | 双方向（非対称ラベル）| なし | 永続 | 条件12週維持→40%抽選1回 | なし |
| F-4 | 同期 | 双方向対称 | なし | 永続 | 同期入団 | なし |
| F-5 | ライバル同期 | 双方向対称 | **1人1組** | 永続 | applyMatchResult直後判定 | なし |
| F-6 | 憧れ | A→B 一方向 | **A1人につき1人** | 動的 | 4段ゲート、3回まで30%抽選 | 追い抜き / 引退 / bond<30 |
| F-7 | 嫉妬 | A→B 一方向 | **A1人につき1人** | 動的 | 4段ゲート、1回40%抽選 | 引退 / 撃破 / 1-2-3年20%霧散 |

---

## §2 各フラグ詳細仕様

### §2.1 裏切り者（F-1）

#### 発火条件

`processDeparture` 戻り値が `type: 'rival'`（=AI団体への離脱、relationship-system-spec-v2.2 §A.1〜A.4）の時、確定発火する。

- FA / 引退 / 解雇は対象外
- `applyContractDepartureBetrayal` の最後で `Engine.relationships.flags.applyBetrayer(state, departerId, remainingIds)` を呼び出す

#### 方向

残留時のロスター全員（`!injury && !isRental && !forcedRest` を満たす者）から、離脱者1人へ向けて貼る（1対多）。

#### データ構造

```
G.relationships.flags.betrayer = [
  {
    targetId: number,   // 裏切り者扱いされた離脱者
    byIds: number[],    // 裏切り者扱いした残留者の配列
    issuedSeason: number,
    issuedWeek: number
  }
]
```

#### 消滅

出戻り発火（F-2）時、§3の処理で個別ミニイベント経由で消える。

#### 演出キュー

裏切り者発火モーダル（M-1）を `state._modalQueue` に enqueue。

---

### §2.2 出戻り（F-2）

#### 発火条件

AI団体に離脱した過去のあるキャラ（`fighter.orgTimeline` に過去のプレイヤー団体在籍記録あり、かつ間に他組織在籍を挟んでいる）が、再加入した時。

判定箇所：`Engine.scout.signFighter` / `Engine.rental.convertToPermanent` / `Engine.contract.resolveAcquisition` の各成立直後。

#### 方向

個人フラグ。

#### データ構造

```
G.relationships.flags.returner = [
  {
    fighterId: number,
    leftSeason: number,    // 元々離脱した時期
    leftWeek: number,
    returnedSeason: number,
    returnedWeek: number
  }
]
```

#### 消滅

なし。永続。

#### 副作用：裏切り者フラグの消去

§3で詳述。

---

### §2.3 師弟（F-3）

#### 発火条件（すべて満たす）

| 条件 | 値 |
|------|---|
| 同団体 | 必須 |
| 師匠側の在籍 | **≥ 156週（3年）** 🔧 |
| 弟子側の在籍 | 制限なし |
| bond[弟子→師] | **≥ 70** 🔧 |
| bond[師→弟子] | **≥ 55** 🔧 |
| OVR差 | **師 ≥ 弟子 + 15** 🔧 |
| スタイル | **同一必須**（打撃/組技/関節技/喧嘩/万能のいずれか一致）|

#### 判定

- 上記条件すべてを **12週連続維持** 🔧 で抽選候補入り
- 1回のみ抽選、確率 **40%** 🔧
- 外したら**そのペアは永久ロックアウト**（条件が再充足しても再抽選なし）

#### 判定タイミング

`processWeeklyDecay` 完了後の週次バッチで、候補ペア全てをチェック。維持週数カウンタは `G.relationships.flagCounters['masterCandidate:idA>idB']` に保存。

#### 方向

師→弟子、弟子→師の双方向（非対称ラベル）。

#### データ構造

```
G.relationships.flags.master = [
  {
    masterId: number,
    discipleId: number,
    establishedSeason: number,
    establishedWeek: number
  }
]

G.relationships.flagCounters = {
  'masterCandidate:1>2': { weeks: 8, lastUpdateAbsWeek: 105 }
}

G.relationships.flagLockouts = {
  'master:1>2': true   // ペア順序: masterId>discipleId
}
```

#### 消滅

なし。引退してもラベルは残る（chronicle で参照される）。

#### 演出キュー

師弟確定モーダル（M-13）を enqueue。

---

### §2.4 同期（F-4）

#### 発火条件

同じドラフト年・同じ初登録週に入団したペアに、入団直後に自動付与。

判定箇所：`Engine.scout.signFighter` 完了直後 + `Engine.draft.executeDraft` 完了直後で、同週入団ペアを全て検出。

既存 `O-14 同期ドラフト`（v2.1 §5.4）の数値変動はそのまま維持し、フラグ層のみ追加。

#### 方向

双方向対称。

#### データ構造

```
G.relationships.flags.cohort = [
  {
    idA: number,    // 常に小さいID側
    idB: number,
    cohortSeason: number,
    cohortWeek: number
  }
]
```

#### 消滅

なし。

#### 演出

新聞「新人合同入団」記事で言及。専用モーダルなし。

---

### §2.5 ライバル同期（F-5）

#### 発火条件

「同期」フラグ保有同士のうち、**先に rivalry 60到達**かつ**両者ともライバル同期未保有**で確定。

#### 判定タイミング

`applyMatchResult` 直後。試合終了後に rivalry が動いた直後にチェックする。

```
擬似コード：
After applyMatchResult:
  if (cohortFlag(A, B) && rivalry[A>B] >= 60 && rivalry[B>A] >= 60) {
    if (!hasRivalCohort(A) && !hasRivalCohort(B)) {
      establishRivalCohort(A, B);
    }
  }
```

#### 方向

双方向対称。**1人につき1組のみ**（人生で1組）。

#### データ構造

```
G.relationships.flags.rivalCohort = [
  {
    idA: number,    // 常に小さいID側
    idB: number,
    establishedSeason: number,
    establishedWeek: number
  }
]
```

#### 消滅

なし。rivalry が下がっても降格しない（一度燃えた事実は残る）。

#### 共存

「同期」フラグと共存（昇格時に追加付与、置換ではない）。

#### 演出キュー

ライバル同期昇格モーダル（M-14）を enqueue。

---

### §2.6 憧れ（F-6）

#### 発火フロー（4段ゲートすべてクリア）

##### ゲート1：状況条件

| 条件 | 値 |
|------|---|
| 同団体 | 必須 |
| bond[A→B] | **≥ 60** 🔧 |
| OVR/タイトル | **B が A より OVR +10以上 OR B にタイトル保持経験あり**（OR）|
| 経験年数 | A の在籍年数 < B の在籍年数 |

##### ゲート2：キャパ空き

A は憧れの相手未保有（`G.relationships.flags.admire` 内に `fromId === A` のエントリが存在しない）。

##### ゲート3：契機イベント

**B の名勝負（M-04 / M-CO1）発火試合**直後にのみ、ゲート1・2のチェックが走る。

##### ゲート4：確率抽選

確率 **30%** 🔧 で発火。

#### 抽選回数

**3回まで** 🔧。3回外したら A→B のロックアウト確定。

```
G.relationships.flagCounters = {
  'admireDraws:1>2': 2   // 2回目まで外した状態。次がラスト
}
```

3回目で外したら `G.relationships.flagLockouts['admire:1>2'] = true` を設定。

#### データ構造

```
G.relationships.flags.admire = [
  {
    fromId: number,
    toId: number,
    issuedSeason: number,
    issuedWeek: number
  }
]
```

#### 消滅条件（すべてモーダル）

| 条件 | モーダル | 数値変動 |
|------|---------|---------|
| A が B を OVR で追い抜いた（A.ovr > B.ovr）| 達成（M-3）| なし |
| B が引退 | 喪失（M-4）| なし |
| bond[A→B] < 30 | 幻滅（M-5）| なし |

#### 演出キュー

憧れ発火モーダル（M-2）を enqueue。

---

### §2.7 嫉妬（F-7）

#### 発火フロー（4段ゲートすべてクリア）

##### ゲート1：状況条件（**全6つAND**）

| 条件 | 値 |
|------|---|
| 関係 | 同団体 OR 過去同団体 OR 同期 |
| rivalry[A→B] | **≥ 30** 🔧 |
| OVR差 | B が A より **+5以上** 🔧 |
| 人気差 | B が A より **+20以上** 🔧 |
| Bの直近実績 | 直近12週でタイトル獲得 / 名勝負（M-04/M-CO1）/ メイン抜擢のいずれか |
| Aの直近状況 | 直近12週で出場機会少 OR 人気/OVR下降（要詳細定義、§7-1）|

##### ゲート2：キャパ空き

A は嫉妬の相手未保有。

##### ゲート3：契機イベント

**B のタイトル獲得・防衛 / B の PPV メイン出場**直後にのみ、ゲート1・2のチェックが走る。

##### ゲート4：確率抽選

確率 **40%** 🔧 で発火。

#### 抽選回数

**1回限り**。外したら A→B 永久ロックアウト確定。

```
G.relationships.flagLockouts['envy:1>2'] = true
```

##### ロックアウトの永続性

A→B でロックアウトされた後、**A は別の C に対して嫉妬可能**だが、**A→B には絶対に再発火しない**（C との関係が解消されてキャパが空いた後でも）。

#### データ構造

```
G.relationships.flags.envy = [
  {
    fromId: number,
    toId: number,
    issuedSeason: number,
    issuedWeek: number,
    issuedAbsWeek: number   // 1-2-3年経過判定用
  }
]
```

#### 消滅条件（すべてモーダル）

| 条件 | モーダル | 数値変動 |
|------|---------|---------|
| B が引退 | 宙吊り（M-7）| なし |
| A が B を OVR で上回った状態で勝利 | 撃破（M-6）| なし |
| 発生から1年経過時 | 風化1年（M-8）20%確率 | なし |
| 発生から2年経過時 | 風化2年（M-9）20%確率 | なし |
| 発生から3年経過時 | 風化3年（M-10）20%確率 | なし |

風化判定は `processWeeklyDecay` 内で `(absWeek - issuedAbsWeek) === 52 / 104 / 156` のタイミングでチェック。3年経過後も残る場合がある（最悪 0.8^3 = 51.2% 残存）。

#### 演出キュー

嫉妬発火モーダル（M-11）を enqueue。

---

## §3 出戻り時の処理（F-1 ⇄ F-2 連動）

### §3.1 トリガー

F-2 出戻り発火時、`G.relationships.flags.betrayer` から `targetId === fighterId` のエントリを取得。`byIds` に列挙された残留者全員に対して**個別反応モーダル（M-12）**を発火する。

該当 betrayer エントリが存在しない場合（裏切り扱いされていなかった出戻り）、本処理はスキップ。

### §3.2 個別反応ロジック（性格×アーキタイプ + bond/rivalry現在値）

各 byId（残留者）に対して、出戻り選手との関係を評価し、「許す」「許さない」を決定する。

#### 評価式

```
forgivenessScore = 0
+ personalityBaseScore[残留者.personality]   // §3.3 表参照
+ archetypeBaseScore[残留者.archetype]       // §3.4 表参照
+ (bond[残留者→出戻り者] - 50) / 5          // -10 〜 +10 の範囲
+ -(rivalry[残留者→出戻り者] / 10)          // 0 〜 -10 の範囲

if (forgivenessScore >= 0): 許す
else: 許さない
```

#### §3.3 性格別ベーススコア 🔧

| Personality | スコア | 傾向 |
|-------------|:------:|------|
| earnest | +1 | 真面目、許しがち |
| easygoing | +3 | おおらか、水に流す |
| emotional | -2 | 感情的、わだかまり残す |
| bold | 0 | フラット |
| quiet | -1 | 内向、引きずる |
| normal | 0 | フラット |

#### §3.4 アーキタイプ別ベーススコア 🔧

| Archetype | スコア | 傾向 |
|-----------|:------:|------|
| polite | +2 | 礼節、表向き許す |
| ojousama | +1 | 余裕、許す |
| earnest（archetype）| +1 | 真面目、許しがち |
| seductive | 0 | フラット |
| normal | 0 | フラット |
| cool | -2 | クール、許さない |
| delinquent | -3 | 不良、根に持つ |
| emotional（archetype）| -1 | 感情的 |

### §3.5 効果

| 結果 | bond 変動 | rivalry 変動 | 裏切り者フラグ |
|------|:---------:|:------------:|:--------------:|
| 許す | なし | なし | 消滅 |
| 許さない | **-10** 🔧 | **+10** 🔧 | **消滅**（必ず消える）|

**重要**: 「許さない」場合でも裏切り者フラグは消える。これは「出戻りで全消去」のルールを維持するため。代わりに数値で**わだかまりが残った**ことを表現する。

### §3.6 UI形式

画面1枚に複数人並べる形式（全員ぶん見せるのが UI 的に重い場合の緩和案）：

- 各残留者のポートレート + 短い反応セリフ + 許す/許さないアイコン
- 操作1回で完結（OK ボタンで全員ぶん適用）
- セリフは性格・アーキタイプで分岐（テンプレ作成は §6 演出仕様で別途）

### §3.7 履歴保存（永続）

```
G.relationships.history.betrayalRecord = [
  {
    departerId: number,
    leftSeason: number,
    leftWeek: number,
    returnedSeason: number,
    returnedWeek: number,
    betrayedBy: number[],     // 残留時に裏切り者扱いした人々（leftWeek時点）
    forgiven: number[],       // 出戻り時に許した人々（returnedWeek時点）
    notForgiven: number[]     // 許さなかった人々（returnedWeek時点）
  }
]
```

新聞・年表・キャラ年表（chronicle）から呼び出され、「○年○月、××は出戻りの際、△△に許されなかった」という記録が残る。

### §3.8 betrayer エントリの除去

処理完了後、`G.relationships.flags.betrayer` から該当 `targetId` のエントリを削除する（履歴は §3.7 に転記済み）。

---

## §4 モーダル A クラス一覧（全14種）

| ID | カテゴリ | 名称 | 発火 | 性格差分 |
|----|---------|------|------|----------|
| M-1 | 裏切り者 | 裏切り発火 | F-1 確定時 | 離脱者個人ベース |
| M-2 | 憧れ | 憧れ発火 | F-6 確定時 | A の性格・アーキタイプ |
| M-3 | 憧れ消滅 | 達成 | A が B を OVR で追い抜いた | A の性格・アーキタイプ |
| M-4 | 憧れ消滅 | 喪失 | B が引退 | A の性格・アーキタイプ |
| M-5 | 憧れ消滅 | 幻滅 | bond[A→B] < 30 | A の性格・アーキタイプ |
| M-6 | 嫉妬消滅 | 撃破 | A が B を OVR で上回って勝利 | A の性格・アーキタイプ |
| M-7 | 嫉妬消滅 | 宙吊り | B が引退 | A の性格・アーキタイプ |
| M-8 | 嫉妬消滅 | 風化1年 | 1年経過 + 20%抽選 | A の性格・アーキタイプ |
| M-9 | 嫉妬消滅 | 風化2年 | 2年経過 + 20%抽選 | A の性格・アーキタイプ |
| M-10 | 嫉妬消滅 | 風化3年 | 3年経過 + 20%抽選 | A の性格・アーキタイプ |
| M-11 | 嫉妬 | 嫉妬発火 | F-7 確定時 | A の性格・アーキタイプ |
| M-12 | 出戻り | 出戻り反応（複数人並列）| F-2 確定時 + betrayer エントリあり | 各残留者の性格・アーキタイプ |
| M-13 | 師弟 | 師弟確定 | F-3 確定時 | 師・弟子それぞれの性格 |
| M-14 | ライバル同期 | ライバル同期昇格 | F-5 確定時 | 双方の性格 |

### §4.1 モーダル発火順序

同一週に複数モーダルが発火した場合、`state._modalQueue: [{type, payload}, ...]` に enqueue し、UI 側で1つずつ表示する。

優先順位（先に表示）:
1. F-2 出戻り（M-12）
2. F-1 裏切り者（M-1）
3. 消滅系（M-3〜M-10）
4. 発火系（M-2 / M-11）
5. F-3 / F-5（M-13 / M-14）

### §4.2 セリフ・演出仕様

別途、`specs/relationship-flags-dialogue-spec-v1.0.md` で詳細定義する（本仕様書スコープ外）。

CLAUDE.md 原則に従い、テンプレ表現を避け、性格・アーキタイプ・キャラ名を踏まえた個別性のあるセリフにする。

---

## §5 データ構造（完全版）

```javascript
G.relationships.flags = {
  betrayer: [],      // [{ targetId, byIds, issuedSeason, issuedWeek }]
  returner: [],      // [{ fighterId, leftSeason, leftWeek, returnedSeason, returnedWeek }]
  master: [],        // [{ masterId, discipleId, establishedSeason, establishedWeek }]
  cohort: [],        // [{ idA, idB, cohortSeason, cohortWeek }]
  rivalCohort: [],   // [{ idA, idB, establishedSeason, establishedWeek }]
  admire: [],        // [{ fromId, toId, issuedSeason, issuedWeek }]
  envy: []           // [{ fromId, toId, issuedSeason, issuedWeek, issuedAbsWeek }]
};

G.relationships.flagLockouts = {
  // フラグ別 永久ロックアウト（一度設定したら解除しない）
  'master:1>2': true,    // master の場合は masterId>discipleId 順
  'admire:1>2': true,    // admire/envy の場合は fromId>toId 順
  'envy:1>2': true
};

G.relationships.flagCounters = {
  // 抽選回数カウンタ（憧れ）
  'admireDraws:1>2': 2,  // 2回外した状態。3回目で外せば lockout 確定

  // 維持週数カウンタ（師弟）
  'masterCandidate:1>2': { weeks: 8, lastUpdateAbsWeek: 105 }
};

G.relationships.history = {
  betrayalRecord: []   // §3.7 参照
};

G._modalQueue = [
  // { type: 'F-1', payload: { targetId, byIds, ... } }
  // ... 1週分のモーダル発火を貯めておく
];
```

### §5.1 lazy init

すべて `G.relationships.flags` 等が未定義の場合は空構造として扱う。明示マイグレーションフラグは設けない（v2.2 と同方針）。

```javascript
function initFlagsLazy(G) {
  if (!G.relationships) G.relationships = {};
  if (!G.relationships.flags) {
    G.relationships.flags = {
      betrayer: [], returner: [], master: [], cohort: [],
      rivalCohort: [], admire: [], envy: []
    };
  }
  if (!G.relationships.flagLockouts) G.relationships.flagLockouts = {};
  if (!G.relationships.flagCounters) G.relationships.flagCounters = {};
  if (!G.relationships.history) G.relationships.history = { betrayalRecord: [] };
  return G;
}
```

### §5.2 キー命名規則

ペアキーは **`{smallerId}>{largerId}`** を基本とする。ただし以下は例外（**意味のある順序がある場合**）:

- `master:masterId>discipleId` — 師→弟子の順（OVRが高い側が必ず師、ID順ではない）
- `admire:fromId>toId` / `envy:fromId>toId` — 感情の方向順（A→B）

---

## §6 既存仕様との関係

### §6.1 v2.2 裏切りイベント（A-1〜A-4）

数値変動はそのまま維持し、フラグ層を追加で乗せる。具体的には：

```
processDeparture (type: 'rival') 内:
  // 既存処理（v2.2）
  applyContractDepartureBetrayal(state, ...)  // bond/rivalry/morale 変動
  if (A-4 + ベルト持ち出し) transferTitleToOrg(...)

  // 新規追加（本仕様）
  Engine.relationships.flags.applyBetrayer(state, departerId, remainingIds)
  enqueueModal(state, 'F-1', { departerId, remainingIds })
```

### §6.2 因縁称号（v2.1 §7）

数値由来 vs 事件由来。新聞ヘッドライン・対戦煽り文では**フラグ優先**、数値帯はサブで扱う。

具体的には、対戦煽り生成器で：
1. ライバル同期（F-5）→ あれば「人生のライバル」として煽り生成
2. 永遠のライバル（数値由来）→ あれば「永遠のライバル」として煽り生成
3. 嫉妬・憧れ（F-6/F-7）→ あれば該当方向のキャラ視点で煽り生成
4. 因縁・宿敵 → デフォルト

優先度は上から評価。

### §6.3 O-14 同期入団（v2.1 §5.4）

既存の数値変動（bond +3〜+5, rivalry +2〜+4）はそのまま維持し、フラグ層（F-4 cohort）を追加で付与。

### §6.4 chronicle（v0.2）

各キャラの fighterArchive に「フラグ歴」を追加保存することで、引退後の年表で関係性が呼び出せる。詳細は本仕様書スコープ外、別途 chronicle-system-spec の改訂で対応。

### §6.5 newspaper-and-orgcompare（v2.0）

新聞ヘッドライン分岐で F-1〜F-7 を使う。詳細は別途 newspaper-and-orgcompare-spec の改訂で対応。

---

## §7 残課題

### §7-1 「直近12週で目立つ実績」「直近12週で干されている／伸び悩み」の検出ロジック

嫉妬（F-7）のゲート1で必要。仮実装案：

#### B 側「目立つ実績」の検出

直近12週で以下のいずれか1つでも該当：
- `state.titles[type].championId === B.id` で 1試合以上防衛 OR この期間内に獲得
- M-04 または M-CO1 の発火試合に B が出場（h2h 履歴から検索）
- メイン抜擢: `showCard[lastSlot]` のメイン試合に B が出場（直近2興行）

#### A 側「干されている／伸び悩み」の検出

直近12週で以下のいずれか1つでも該当：
- 興行出場数が同団体平均の50%未満
- popularity が12週前比で -3 以上低下
- ovr が12週前比で -2 以上低下（成長系イベントを含む）

具体閾値は実装試運転後に調整。

### §7-2 出戻り検出の精度

`Engine.scout.signFighter` 等の各経路で、過去にプレイヤー団体在籍歴があり、間にAI団体在籍を挟んでいるかを `fighter.orgTimeline` から判定する。

具体的判定ロジック:
```
function isReturning(fighter, currentOrgId) {
  if (currentOrgId !== 'player') return false;
  const tl = fighter.orgTimeline || [];
  const playerEntries = tl.filter(e => e.orgId === 'player');
  if (playerEntries.length === 0) return false;
  // 直近のplayer離脱以降に他org経由があるか
  const lastPlayerExit = playerEntries[playerEntries.length - 1].toWeek;
  if (lastPlayerExit == null) return false; // まだ在籍中
  const otherOrgEntries = tl.filter(e => e.orgId !== 'player' && e.fromWeek > lastPlayerExit);
  return otherOrgEntries.length > 0;
}
```

### §7-3 性格セリフテンプレートの設計

§4.2 で別仕様書に切り出し。CLAUDE.mdの「テンプレ表現を避ける」原則に従い、各モーダルで性格×アーキタイプ別に**最低3パターン**を用意し、ランダム選択。

### §7-4 auto-sim 検証指標

実装完了後、auto-sim 100シーズンで以下を確認:

| 指標 | 期待値 |
|------|--------|
| F-1 裏切り者発火頻度 | 0.5〜1.5/シーズン |
| F-2 出戻り発火頻度 | 0.05〜0.2/シーズン（稀）|
| F-3 師弟確定頻度 | 0.1〜0.3/シーズン |
| F-5 ライバル同期昇格頻度 | 0.2〜0.5/シーズン |
| F-6 憧れ発火頻度 | 0.5〜1.5/シーズン |
| F-7 嫉妬発火頻度 | 0.3〜1.0/シーズン |
| F-7 風化発火数 | 1〜2年で過半数霧散 |

期待値から大きく外れる場合、🔧 パラメータの再調整を行う。

---

## §8 やらないことリスト

- ❌ **ふわっとしたポジティブフラグ**（親友・仲良し）— 数値 bond で十分。フラグは事件性のあるものだけ
- ❌ **テンプレ条件で量産されるフラグ**（5回対戦したら自動で「ライバル」など）— 既存の因縁称号と重複する
- ❌ **本人プロフィールのバッジコレクション化** — フラグは「物語を呼び出す取っ手」であって、業績バッジではない
- ❌ **嫉妬・憧れの性格ゲート** — 検討したが Keisuke の指示で外した。状況条件と確率抽選で十分絞る
- ❌ **ロックアウトの解除** — 一度外した抽選は永遠に外れたまま。これが運命的瞬間の重みを担保する
- ❌ **裏切り者フラグの自動消滅**（時間経過で消える等）— 出戻り以外では消えない

---

## §9 RNG シード

| 用途 | シード |
|------|--------|
| 憧れ抽選 | 0xBE80 |
| 嫉妬抽選 | 0xBE81 |
| 嫉妬風化（1/2/3年）| 0xBE82 |
| 師弟抽選 | 0xBE83 |
| 出戻り反応分岐 | 0xBE84 |

v2.2 で使用済みの 0xBE71〜0xBE73 と衝突しない範囲で確保。

---

## §10 マイグレーション

| ID | 内容 |
|----|------|
| `_migrated_relationships_flags_v1` | §5.1 の lazy init を実行。既存セーブには空構造を埋める |

---

## 変更履歴

| 日付 | バージョン | 内容 |
|------|:--------:|------|
| 2026-04-28 | v1.0 ドラフト | 初版（Keisuke との会話で確定）|
| 2026-04-28 | v1.0 実装完了 | Phase 1-8 完了。`src/relationships.js` の `Engine.relationships.flags` ネームスペース、`src/flag-dialogue.js` の14モーダル×7性格×3パターン、`src/ui-common.js` の `_drainFlagModalQueue` を実装。データ構造は `state.relationshipFlags` / `relationshipFlagLockouts` / `relationshipFlagCounters` / `relationshipHistory` に変更（state.relationships は pair-key 専用 namespace のため分離）。実装メモ: spec §3.4 の archetype `earnest` は `composed` (+1) にマッピング、`emotional`(archetype) は実コードに無いため personality 側で吸収。spec §3.3 に無い `shy` は -1 に割り当て。詳細セリフ仕様書 (§4.2 / §7-3) は別ファイル化せず本実装に内包。|
| 2026-04-28 | 頻度検証 | auto-sim 100×3 seed (12345/67890/99999) で頻度測定。**全項目で目標値を大幅に下回る**: F-1 0.06/シーズン (目標 0.5-1.5)、F-2 0/シーズン、F-3 0.003/シーズン、F-5 0/シーズン、F-6 0/シーズン、F-7 0/シーズン。原因仮説: bond 帯シフト未達 (実測 1.2-2.5、目標 8-12) により bond≥60/70 の関係が稀。F-4 cohort も 0 だが auto-sim の入団簡易化のため実機での確認が必要。Keisuke の指示でパラメータ調整は本タスクでは行わず、次タスクで bond 上昇イベント追加 OR 相性軸の更なるチューニング OR 閾値再検討を要する。|

