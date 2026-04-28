# 関係性フラグシステム — Claude Code 実装ハンドオフ

**ファイル**: `plans/relationship-flags-implementation-task.md`
**作成日**: 2026-04-28
**対象**: Claude Code
**担当モデル推奨**: Opus（複数システム連動: 関係性 + 契約交渉 + 王座 + 引退 + UI モーダル + 新聞）
**前提**: `plans/relationship-affinity-implementation-task.md` が **完了している** こと

---

## 0. このタスクを開始する前に必ず確認

⚠️ **依存関係チェック**

このタスクは相性軸システム実装の**完了後**に着手する。理由:

- F-3 師弟（bond70/55）の発火条件は、相性軸導入前の bond分布（max 68.3）では実質発火しない
- F-6 憧れ（bond60+）も同様に発火困難
- フラグシステムを先に実装してもテスト時にフラグが動かないため、検証ができない

**着手前確認**:
1. `specs/relationship-affinity-spec-v1.0.md` のステータスが 🟢 確定 か
2. `node test/relationship-distribution-analysis.js 100 12345 --json` を実行し、bond max が 75+ 程度に伸びているか
3. 上記が満たされていない場合、本タスクは保留して相性軸タスクの完了を待つ

---

## 1. このタスクで何をやるか

`specs/relationship-flags-spec-v1.0.md` を実装する。数値（bond/rivalry）と称号（因縁→宿敵→永遠のライバル）に続く**第3層「フラグ」**を導入する。8種のフラグ × 14種のモーダル × 履歴保存 × 既存システム連携の包括タスク。

### 必ず最初に読むドキュメント

順番に読んでから実装に入ること:

1. **`CLAUDE.md`**（数値哲学・テンプレ表現禁止・段取りルール）
2. **`specs/relationship-flags-spec-v1.0.md`**（本タスクの完全仕様、必読）
3. **`specs/relationship-affinity-spec-v1.0.md`**（前提タスク、bond分布の前提を理解）
4. **`specs/relationship-system-spec-v2.2.md`**（裏切りパッケージ、F-1 がここに乗る）
5. **`src/relationships.js`** 全体（applyMatchResult, processWeeklyDecay, applyContractDepartureBetrayal）
6. **`src/management.js`** 関連箇所:
   - `processDeparture` 周辺（F-1 トリガー）
   - `Engine.scout.signFighter` / 契約成立フック（F-2 / F-4 トリガー）
   - 引退処理（F-6/F-7 消滅トリガー）
7. **`docs/dialogue/`** 配下の既存セリフ集（モーダルセリフ作成の参考）

### スコープ

| 対象 | 内容 |
|------|------|
| 仕様書 | `specs/relationship-flags-spec-v1.0.md` のステータスを 🟡→🟢 に更新 |
| データ構造 | `G.relationships.flags` / `flagLockouts` / `flagCounters` / `history.betrayalRecord` の lazy init |
| ヘルパー | `Engine.relationships.flags.*` ネームスペース下に各フラグの判定・付与・消滅関数 |
| トリガーフック | applyMatchResult / processWeeklyDecay / processDeparture / signFighter / 引退処理 等への発火フック追加 |
| モーダルキュー | `state._modalQueue` に enqueue → UI 側で順次表示 |
| UI モーダル | M-1〜M-14 の14種を実装（性格・アーキタイプ別差分付き）|
| 履歴記録 | betrayalRecord の保存と新聞・年表からの参照 |
| auto-sim 検証 | 仕様書 §7-4 の頻度指標が期待値内 |

### スコープ外

- 相性軸システム（前提タスク）
- 新聞ヘッドライン分岐の本実装（言及のみ、newspaper-spec の改訂は別タスク）
- chronicle 年表へのフラグ歴埋め込み（chronicle-spec の改訂は別タスク）
- セリフ仕様書 `relationship-flags-dialogue-spec-v1.0.md`（仕様書 §4.2 で言及されているが、本タスクで簡易版を内包）

---

## 2. 全体の進め方と Phase 進行

| Phase | 内容 | 想定規模 |
|-------|------|:------:|
| 1 | データ構造 lazy init + ヘルパーネームスペース基盤 | 小 |
| 2 | F-4 同期 + F-5 ライバル同期実装（最も単純、自動付与系）| 中 |
| 3 | F-1 裏切り者 + F-2 出戻り + 出戻り個別反応モーダル | 大 |
| 4 | F-3 師弟（12週維持カウンタ + 抽選 + ロックアウト）| 中 |
| 5 | F-6 憧れ（4段ゲート + 3回抽選 + 3種消滅モーダル）| 中〜大 |
| 6 | F-7 嫉妬（4段ゲート + 1回抽選 + 5種消滅モーダル + 風化判定）| 大 |
| 7 | モーダルキュー UI 統合 + 性格別セリフテンプレ | 中〜大 |
| 8 | auto-sim 検証 + 頻度調整（仕様書 §7-4）| 中 |

各 Phase 完了時に Keisuke さんに報告して承認を得てから次へ進む。

---

## 3. Phase 別実装詳細

### Phase 1: データ構造 + 基盤

#### 3.1 lazy init

仕様書 §5.1 の `initFlagsLazy` を実装し、以下のパスで呼ぶ:
- `Engine.createInitialState` 完了直後
- セーブロード時のマイグレーション
- `Engine.relationships.applyMatchResult` 等の処理冒頭（保険）

#### 3.2 ヘルパーネームスペース

```javascript
Engine.relationships.flags = {
  // 共通ユーティリティ
  _ensureInit(state) { /* lazy init */ },
  _enqueueModal(state, type, payload) { /* state._modalQueue.push */ },
  _pairKey(idA, idB) { /* small>large の正規化 */ },

  // 各フラグ判定（後の Phase で実装）
  applyBetrayer: null,
  applyReturner: null,
  applyMaster: null,
  applyCohort: null,
  applyRivalCohort: null,
  applyAdmire: null,
  applyEnvy: null,

  // 消滅判定
  checkAdmireDissolution: null,
  checkEnvyDissolution: null,

  // クエリ
  hasAdmire(state, fromId) { /* キャパチェック用 */ },
  hasEnvy(state, fromId) { /* キャパチェック用 */ },
  hasRivalCohort(state, charId) { /* キャパチェック用 */ },
  isLockedOut(state, kind, idA, idB) { /* ロックアウト確認 */ },
};
```

#### 3.3 完了条件

- 既存 auto-sim 100 シーズンで違反 0、エラー 0
- 新規ゲーム開始時に `G.relationships.flags` 構造が初期化される
- セーブ/ロードを跨いでも構造が保たれる

---

### Phase 2: F-4 同期 + F-5 ライバル同期

#### 3.4 F-4 同期

**フック**: `Engine.scout.signFighter` / `Engine.draft.executeDraft` 完了直後

```javascript
function applyCohort(state, newFighters) {
  // newFighters: 同週入団した複数キャラ
  const flags = state.relationships.flags;
  for (let i = 0; i < newFighters.length; i++) {
    for (let j = i + 1; j < newFighters.length; j++) {
      const idA = Math.min(newFighters[i].id, newFighters[j].id);
      const idB = Math.max(newFighters[i].id, newFighters[j].id);
      // 既存チェック
      if (flags.cohort.some(e => e.idA === idA && e.idB === idB)) continue;
      flags.cohort.push({
        idA, idB,
        cohortSeason: state.season,
        cohortWeek: state.week
      });
    }
  }
  return state;
}
```

専用モーダルなし（仕様書 §2.4 より）。

#### 3.5 F-5 ライバル同期

**フック**: `applyMatchResult` 直後（仕様書 §2.5）

```javascript
function applyRivalCohortCheck(state, idA, idB) {
  const flags = state.relationships.flags;
  // 同期フラグ確認
  const cohortKey = { idA: Math.min(idA, idB), idB: Math.max(idA, idB) };
  const isCohort = flags.cohort.some(e => e.idA === cohortKey.idA && e.idB === cohortKey.idB);
  if (!isCohort) return state;

  // rivalry 60+ 双方向確認
  const rABKey = `${idA}>${idB}`;
  const rBAKey = `${idB}>${idA}`;
  const rivalryAB = state.relationships[rABKey]?.rivalry ?? 0;
  const rivalryBA = state.relationships[rBAKey]?.rivalry ?? 0;
  if (rivalryAB < 60 || rivalryBA < 60) return state;

  // 両者ライバル同期未保有確認
  if (Engine.relationships.flags.hasRivalCohort(state, idA)) return state;
  if (Engine.relationships.flags.hasRivalCohort(state, idB)) return state;

  // 既存重複防止
  if (flags.rivalCohort.some(e => e.idA === cohortKey.idA && e.idB === cohortKey.idB)) return state;

  flags.rivalCohort.push({
    idA: cohortKey.idA,
    idB: cohortKey.idB,
    establishedSeason: state.season,
    establishedWeek: state.week
  });

  Engine.relationships.flags._enqueueModal(state, 'F-5', {
    idA, idB,
    season: state.season, week: state.week
  });
  return state;
}
```

呼び出し箇所: `applyMatchResult` の最後（rivalry 更新後）。

#### 3.6 完了条件

- 同期入団で F-4 が自動付与される
- 試合後に rivalry 60+ + 同期 + 両者フリーで F-5 が確定し M-14 が enqueue される
- auto-sim 100 シーズンで F-5 確定が 0.2〜0.5/シーズン（仕様書 §7-4）

---

### Phase 3: F-1 裏切り者 + F-2 出戻り + M-12 個別反応

このタスクで最も複雑な Phase。仕様書 §3 全体を実装する。

#### 3.7 F-1 裏切り者

**フック**: `applyContractDepartureBetrayal` の最後（v2.2 既実装処理の後段）

```javascript
function applyBetrayer(state, departerId, remainingIds) {
  const flags = state.relationships.flags;
  flags.betrayer.push({
    targetId: departerId,
    byIds: [...remainingIds],
    issuedSeason: state.season,
    issuedWeek: state.week
  });
  Engine.relationships.flags._enqueueModal(state, 'F-1', {
    departerId, byIds: remainingIds
  });
  return state;
}
```

仕様書 §6.1 のとおり、v2.2 の既存処理を維持しつつフラグ層を追加。

#### 3.8 F-2 出戻り判定

仕様書 §7-2 の `isReturning` を実装。フック箇所:
- `Engine.scout.signFighter` 成立後
- `Engine.rental.convertToPermanent` 成立後（あれば）
- `Engine.contract.resolveAcquisition` 成立後

```javascript
function applyReturner(state, fighter) {
  if (!isReturning(fighter, 'player')) return state;

  const flags = state.relationships.flags;
  const tl = fighter.orgTimeline || [];
  const playerEntries = tl.filter(e => e.orgId === 'player');
  const lastExit = playerEntries[playerEntries.length - 1];

  flags.returner.push({
    fighterId: fighter.id,
    leftSeason: lastExit.toSeason,
    leftWeek: lastExit.toWeek,
    returnedSeason: state.season,
    returnedWeek: state.week
  });

  // §3 出戻り個別反応処理を発火
  state = applyReturnerForgivenessFlow(state, fighter);
  return state;
}
```

#### 3.9 出戻り個別反応フロー（M-12）

仕様書 §3.2〜§3.7 を実装。以下のステップ:

1. `flags.betrayer` から `targetId === fighter.id` のエントリを取得
2. 該当エントリがなければスキップ（裏切り扱いされていなかった出戻り）
3. `byIds` の各残留者について forgivenessScore を計算（§3.2 評価式）
4. 結果を betrayalRecord に転記（§3.7）
5. 「許さない」者には bond -10 / rivalry +10 を適用（§3.5）
6. 全員のフラグ消滅（裏切り者フラグそのものはエントリごと削除）
7. M-12 enqueue（複数人並列画面ペイロード付き）

```javascript
function applyReturnerForgivenessFlow(state, returningFighter) {
  const flags = state.relationships.flags;
  const betrayerEntry = flags.betrayer.find(e => e.targetId === returningFighter.id);
  if (!betrayerEntry) return state;

  const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, 0xBE84, state.season, state.week));
  const reactions = [];

  for (const byId of betrayerEntry.byIds) {
    const remaining = state.roster.find(c => c.id === byId);
    if (!remaining) continue;  // 既に離脱・引退している
    const score = calcForgivenessScore(state, remaining, returningFighter);
    const forgiven = score >= 0;
    reactions.push({ byId, forgiven, score });
    if (!forgiven) {
      // bond -10 / rivalry +10 適用
      const bondKey = `${remaining.id}>${returningFighter.id}`;
      if (state.relationships[bondKey]) {
        state.relationships[bondKey].bond = Math.max(0, state.relationships[bondKey].bond - 10);
        state.relationships[bondKey].rivalry = Math.min(100, state.relationships[bondKey].rivalry + 10);
      }
    }
  }

  // betrayalRecord に転記
  state.relationships.history.betrayalRecord.push({
    departerId: returningFighter.id,
    leftSeason: betrayerEntry.issuedSeason,
    leftWeek: betrayerEntry.issuedWeek,
    returnedSeason: state.season,
    returnedWeek: state.week,
    betrayedBy: [...betrayerEntry.byIds],
    forgiven: reactions.filter(r => r.forgiven).map(r => r.byId),
    notForgiven: reactions.filter(r => !r.forgiven).map(r => r.byId),
  });

  // betrayer エントリ削除
  flags.betrayer = flags.betrayer.filter(e => e.targetId !== returningFighter.id);

  // M-12 enqueue
  Engine.relationships.flags._enqueueModal(state, 'F-2', {
    returnerId: returningFighter.id,
    reactions  // [{byId, forgiven, score}]
  });

  return state;
}
```

#### 3.10 性格×アーキタイプスコア表

仕様書 §3.3 / §3.4 を `data.js` または `relationships.js` 内の定数として保持:

```javascript
const PERSONALITY_FORGIVENESS_BASE = {
  earnest: 1, easygoing: 3, emotional: -2, bold: 0, quiet: -1, normal: 0
};
const ARCHETYPE_FORGIVENESS_BASE = {
  polite: 2, ojousama: 1, earnest: 1, seductive: 0, normal: 0,
  cool: -2, delinquent: -3, emotional: -1
};
```

#### 3.11 完了条件

- 裏切り発火 → 出戻り → 個別反応のフルフローが動く
- betrayalRecord が永続記録される
- auto-sim 100 シーズンで F-1 0.5〜1.5/シーズン、F-2 0.05〜0.2/シーズン

---

### Phase 4: F-3 師弟

#### 3.12 12週維持カウンタ

**フック**: `processWeeklyDecay` 完了後の週次バッチ（仕様書 §2.3）

```javascript
function processMasterCandidates(state, rng) {
  const flags = state.relationships.flags;
  const counters = state.relationships.flagCounters;

  for (const candidate of findMasterCandidates(state)) {
    const { masterId, discipleId } = candidate;
    const lockoutKey = `master:${masterId}>${discipleId}`;
    if (state.relationships.flagLockouts[lockoutKey]) continue;

    // 既存マスターフラグチェック
    if (flags.master.some(e => e.masterId === masterId && e.discipleId === discipleId)) continue;

    const counterKey = `masterCandidate:${masterId}>${discipleId}`;
    const counter = counters[counterKey] || { weeks: 0, lastUpdateAbsWeek: 0 };

    // 条件再チェック（前提条件が崩れていたらリセット）
    if (!checkMasterConditions(state, masterId, discipleId)) {
      delete counters[counterKey];
      continue;
    }

    counter.weeks++;
    counter.lastUpdateAbsWeek = Engine.util.absWeek(state.season, state.week);
    counters[counterKey] = counter;

    // 12週到達 → 抽選
    if (counter.weeks >= 12) {
      const masterRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, 0xBE83, masterId, discipleId));
      if (Engine.rng.float(masterRng) < 0.4) {
        // 確定
        flags.master.push({
          masterId, discipleId,
          establishedSeason: state.season, establishedWeek: state.week
        });
        Engine.relationships.flags._enqueueModal(state, 'F-3', { masterId, discipleId });
      } else {
        // 永久ロックアウト
        state.relationships.flagLockouts[lockoutKey] = true;
      }
      delete counters[counterKey];  // カウンタリセット
    }
  }
  return state;
}

function checkMasterConditions(state, masterId, discipleId) {
  const master = state.roster.find(c => c.id === masterId);
  const disciple = state.roster.find(c => c.id === discipleId);
  if (!master || !disciple) return false;
  // 同団体（roster に両方いる時点で同団体）
  // 師匠在籍 ≥ 156週
  const masterSinceJoin = Engine.util.absWeek(state.season, state.week) - Engine.util.absWeek(master.joinSeason, master.joinWeek);
  if (masterSinceJoin < 156) return false;
  // bond
  if ((state.relationships[`${discipleId}>${masterId}`]?.bond ?? 0) < 70) return false;
  if ((state.relationships[`${masterId}>${discipleId}`]?.bond ?? 0) < 55) return false;
  // OVR差
  if (Engine.util.calcOvr(master) < Engine.util.calcOvr(disciple) + 15) return false;
  // 同スタイル
  if (master.style !== disciple.style) return false;
  return true;
}
```

#### 3.13 完了条件

- 12週維持で抽選 → 40% 確率で確定 / 60% でロックアウト
- auto-sim 100 シーズンで F-3 確定が 0.1〜0.3/シーズン
- 一度ロックアウトされたペアが再抽選されないことをユニットテストで確認

---

### Phase 5: F-6 憧れ

#### 3.14 4段ゲート判定

**フック**: 名勝負（M-04 / M-CO1）発火試合の `applyMatchResult` 完了直後（仕様書 §2.6 ゲート3）

```javascript
function processAdmireCandidates(state, matchInfo) {
  if (!matchInfo.isFamousMatch && !matchInfo.isMCO1) return state;
  const fighterB = matchInfo.fighterB; // 名勝負を行った選手（B = admire対象候補）

  // 全キャラについて A→B の admire 候補チェック
  for (const fighterA of state.roster) {
    if (fighterA.id === fighterB.id) continue;
    if (!checkAdmireGate1(state, fighterA, fighterB)) continue;  // 状況条件
    if (Engine.relationships.flags.hasAdmire(state, fighterA.id)) continue;  // ゲート2
    const lockoutKey = `admire:${fighterA.id}>${fighterB.id}`;
    if (state.relationships.flagLockouts[lockoutKey]) continue;

    // ゲート4: 抽選
    const drawKey = `admireDraws:${fighterA.id}>${fighterB.id}`;
    const drawCount = state.relationships.flagCounters[drawKey] ?? 0;

    const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, 0xBE80, fighterA.id, fighterB.id, drawCount));
    if (Engine.rng.float(rng) < 0.30) {
      // 発火
      state.relationships.flags.admire.push({
        fromId: fighterA.id, toId: fighterB.id,
        issuedSeason: state.season, issuedWeek: state.week
      });
      Engine.relationships.flags._enqueueModal(state, 'F-6-fire', {
        fromId: fighterA.id, toId: fighterB.id
      });
      delete state.relationships.flagCounters[drawKey];
    } else {
      // 外し
      state.relationships.flagCounters[drawKey] = drawCount + 1;
      if (drawCount + 1 >= 3) {
        state.relationships.flagLockouts[lockoutKey] = true;
        delete state.relationships.flagCounters[drawKey];
      }
    }
  }
  return state;
}
```

#### 3.15 消滅判定

**フック**:
- 追い抜き判定: `Engine.relationships.flags.checkAdmireDissolution` を `processWeeklyDecay` 内 OR OVR変動イベント直後で呼ぶ
- 引退判定: 引退処理の最後で呼ぶ
- bond<30 判定: bond 更新後（applyMatchResult / processWeeklyDecay）で呼ぶ

```javascript
function checkAdmireDissolution(state) {
  const admireList = state.relationships.flags.admire;
  const removed = [];
  state.relationships.flags.admire = admireList.filter(entry => {
    const { fromId, toId } = entry;
    const fromChar = findChar(state, fromId);
    const toChar = findChar(state, toId);
    if (!fromChar || !toChar) return true;  // 不明: 維持

    // 達成: A が B を OVR で追い抜いた
    if (Engine.util.calcOvr(fromChar) > Engine.util.calcOvr(toChar)) {
      Engine.relationships.flags._enqueueModal(state, 'F-6-achieve', { fromId, toId });
      removed.push(entry);
      return false;
    }
    // 喪失: B が引退（roster/aiOrgs/rentalRoster 全て不在）
    if (isRetired(state, toId)) {
      Engine.relationships.flags._enqueueModal(state, 'F-6-loss', { fromId, toId });
      removed.push(entry);
      return false;
    }
    // 幻滅: bond[A→B] < 30
    const bond = state.relationships[`${fromId}>${toId}`]?.bond ?? 50;
    if (bond < 30) {
      Engine.relationships.flags._enqueueModal(state, 'F-6-disillusion', { fromId, toId });
      removed.push(entry);
      return false;
    }
    return true;
  });
  return state;
}
```

#### 3.16 完了条件

- 名勝負後にゲートを通って 30% 確率で発火
- 3回外したらロックアウト
- 3種の消滅条件すべてが正しく動く
- auto-sim 100 シーズンで F-6 0.5〜1.5/シーズン

---

### Phase 6: F-7 嫉妬

仕様書 §2.7 を実装。Phase 5 の admire 実装をベースに、以下の差分を反映:

#### 3.17 ゲート1（仕様書 §2.7 全6条件AND）

「**直近12週で目立つ実績**」「**直近12週で干されている／伸び悩み**」のヘルパーは仕様書 §7-1 を参照して実装。Keisuke と相談して閾値を最終調整する。

#### 3.18 抽選回数

**1回限り**。外したら即ロックアウト（admire の 3回までと異なる）。

#### 3.19 風化判定

```javascript
function processEnvyAging(state) {
  const absWeek = Engine.util.absWeek(state.season, state.week);
  const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, 0xBE82, state.season, state.week));

  state.relationships.flags.envy = state.relationships.flags.envy.filter(entry => {
    const elapsed = absWeek - entry.issuedAbsWeek;
    if (elapsed === 52 || elapsed === 104 || elapsed === 156) {
      if (Engine.rng.float(rng) < 0.20) {
        const yearKey = elapsed === 52 ? 'F-7-fade1' : elapsed === 104 ? 'F-7-fade2' : 'F-7-fade3';
        Engine.relationships.flags._enqueueModal(state, yearKey, {
          fromId: entry.fromId, toId: entry.toId
        });
        return false;
      }
    }
    return true;
  });
  return state;
}
```

`processWeeklyDecay` の最後で呼ぶ。

#### 3.20 撃破判定

A が B を OVR で上回った状態で勝利したタイミング = `applyMatchResult` 内、勝者判定後にチェック:

```javascript
// applyMatchResult の中、勝敗確定後
if (winner === fighterA && Engine.util.calcOvr(fighterA) > Engine.util.calcOvr(fighterB)) {
  // F-7 撃破判定
  const envyEntry = state.relationships.flags.envy.find(
    e => e.fromId === fighterA.id && e.toId === fighterB.id
  );
  if (envyEntry) {
    Engine.relationships.flags._enqueueModal(state, 'F-7-defeat', {
      fromId: fighterA.id, toId: fighterB.id
    });
    state.relationships.flags.envy = state.relationships.flags.envy.filter(e => e !== envyEntry);
  }
}
```

#### 3.21 完了条件

- ゲートを通って 40% 確率で発火、外したら即ロックアウト
- 3種の消滅条件すべて動く
- 1-2-3年経過時の風化が 20% で発火（最悪 0.8^3 = 51.2% 残存）
- auto-sim 100 シーズンで F-7 0.3〜1.0/シーズン

---

### Phase 7: モーダル UI 統合 + セリフテンプレ

#### 3.22 モーダルキューの UI 接続

`state._modalQueue` を週切り替え時 or 興行直後の UI フェーズで pop して順次表示。仕様書 §4.1 の優先順位を尊重。

実装箇所: `src/ui-render.js` または `src/app.js` のモーダル表示パス。既存の興行後モーダル（タイトル獲得・引退等）と同居できるよう配置。

#### 3.23 セリフテンプレ（簡易版）

CLAUDE.mdの「テンプレ表現を避ける」原則に従い、性格×アーキタイプ別に**最低3パターン**用意してランダム選択する。

各モーダル（M-1〜M-14）について、性格6種 × アーキタイプ8種の全48組合せをカバーするのは現実的でないので、**性格別のみ6セット**を用意し、アーキタイプは語尾・呼称調整で差をつける。

**重要**: テンプレ感を避けるため、各モーダルの基本構造を**3パターン**用意し、その上で性格による文体調整を入れる。

詳細セリフ集は別途 `specs/relationship-flags-dialogue-spec-v1.0.md` として作るが、本タスクでは簡易版（性格6種 × 各3パターン = 18本/モーダル）で実装。

#### 3.24 完了条件

- M-1〜M-14 すべてが UI に表示される
- セリフがテンプレに見えない（同性格でも3パターンで散らばる）
- 出戻り反応モーダル（M-12）の複数人並列画面が動作する

---

### Phase 8: auto-sim 検証 + 頻度調整

#### 3.25 検証指標（仕様書 §7-4）

```bash
node test/auto-sim.js 100 12345
node test/auto-sim.js 100 67890
node test/auto-sim.js 100 99999
```

3 seed の平均で以下が範囲内か確認:

| 指標 | 期待値 |
|------|--------|
| F-1 裏切り者発火頻度 | 0.5〜1.5/シーズン |
| F-2 出戻り発火頻度 | 0.05〜0.2/シーズン |
| F-3 師弟確定頻度 | 0.1〜0.3/シーズン |
| F-5 ライバル同期昇格頻度 | 0.2〜0.5/シーズン |
| F-6 憧れ発火頻度 | 0.5〜1.5/シーズン |
| F-7 嫉妬発火頻度 | 0.3〜1.0/シーズン |
| F-7 風化発火数 | 1〜2年で過半数霧散 |

auto-sim にフラグカウンタ集計を追加する（既存の orgPopHistory 等と同じ仕組み）。

#### 3.26 範囲外の場合の調整

| 状況 | 調整対象 | 第1段階 | 第2段階 |
|------|---------|---------|---------|
| F-3 師弟が少なすぎ | bond 閾値（弟子70/師55）| 65/50 | 60/45 |
| F-3 師弟が多すぎ | 維持週数 12週 | 16週 | 24週 |
| F-6 憧れが少なすぎ | 確率 30% | 40% | 50% |
| F-7 嫉妬が少なすぎ | 確率 40% | 50% | ゲート条件緩和（仕様書 §7-1）|
| F-7 嫉妬が多すぎ | 確率 40% | 30% | ゲート条件強化 |

調整は **1パラメータずつ**動かす（複数同時調整禁止）。

#### 3.27 完了条件

- 3 seed の平均が全指標で範囲内
- 仕様書のステータスを 🟡→🟢 に更新
- Keisuke に最終報告

---

## 4. 完了条件（タスク全体）

- [ ] Phase 1〜8 完了
- [ ] auto-sim 3 seed の頻度指標が範囲内
- [ ] 既存テスト（auto-sim.js / relationship-balance-test.js）が pass
- [ ] specs/relationship-flags-spec-v1.0.md のステータスが 🟢 確定 に更新される
- [ ] 仕様書 §7-3 の「セリフテンプレ別仕様書」を簡易版として本実装に内包したことを仕様書末尾に注記

---

## 5. コミット運用

ローカルコミットのみ（push しない）。Phase ごとにコミットを切る。コミットメッセージ案:

- `feat(flags): フラグシステム基盤・データ構造 lazy init (Phase 1)`
- `feat(flags): F-4 同期 + F-5 ライバル同期 (Phase 2)`
- `feat(flags): F-1 裏切り者 + F-2 出戻り + 個別反応 (Phase 3)`
- `feat(flags): F-3 師弟 12週維持判定と抽選 (Phase 4)`
- `feat(flags): F-6 憧れ 4段ゲート + 3回抽選 (Phase 5)`
- `feat(flags): F-7 嫉妬 4段ゲート + 風化判定 (Phase 6)`
- `feat(flags): モーダル UI 統合と性格別セリフ (Phase 7)`
- `chore(flags): auto-sim 検証 + 頻度調整 (Phase 8)`

---

## 6. やらないことリスト

- ❌ **相性軸システムの実装** — 前提タスク。本タスク開始時には完了済みであるべき
- ❌ **新聞ヘッドライン分岐の本実装** — 仕様書 §6.5 で言及のみ。別タスク
- ❌ **chronicle 年表へのフラグ歴埋め込み** — 仕様書 §6.4 で言及のみ。別タスク
- ❌ **嫉妬・憧れに性格ゲートを追加** — Keisuke の指示で外した（仕様書 §8 やらないことリスト参照）
- ❌ **ロックアウトの解除機能** — 一度外した抽選は永遠に外れたまま
- ❌ **裏切り者フラグの自動消滅**（時間経過で消える等）— 出戻り以外では消えない
- ❌ **複数パラメータの同時調整** — Phase 8 では 1 つずつ
- ❌ **詳細セリフ仕様書の本実装** — 簡易版を本タスクに内包

---

## 7. 注意事項

### 7.1 既存システムとの干渉

- v2.2 裏切りパッケージ（A-1〜A-4）の数値変動は維持。フラグ層は**追加で乗る**だけ
- O-14 同期入団の数値変動は維持。F-4 cohort フラグが追加で乗る
- `applyMatchResult` への新規フックが多い（F-5 / F-6 / F-7 すべて）。**呼び出し順序**に注意（rivalry 確定後、bond 確定後にフラグチェック）

### 7.2 「直近12週」検出ロジック（仕様書 §7-1）

「目立つ実績」「干されている／伸び悩み」の検出ロジックは仕様書で簡易案が出されているが、実装試運転で要調整。

具体的には:
- `state.h2h[key].history` に absWeek が入っているかを確認
- title 履歴 `state.titles[type].championLog` の有無
- showCard の history（既存実装で archived されているか）

実装前に `src/management.js` の関連箇所を grep して、これら情報の取得しやすさを確認する。取得が困難な場合は Keisuke と相談して条件を簡素化する。

### 7.3 出戻り検出（仕様書 §7-2）

`fighter.orgTimeline` の構造をまず `specs/relationship-system-spec-v2.1.md` §10 で確認。`isReturning` の判定で順序ミスがあると、入団直後すべてが「出戻り」扱いされる事故になる。

ユニットテストを必ず書くこと:
- 通常入団（過去にプレイヤー団体在籍歴なし）→ false
- AI 団体出戻り（過去にプレイヤー団体在籍 + AI 団体在籍）→ true
- レンタル復帰（過去にプレイヤー団体在籍だが間に他組織なし）→ false
- 解雇後復帰 → 仕様書では出戻りに該当しない（解雇は裏切り者発火対象外なので、betrayer エントリも存在しない）

### 7.4 モーダルキューの増えすぎ対策

複数フラグが同一週に同時発火する場合、モーダルが連続して何枚も出る可能性がある。Phase 7 の UI 実装で **同種モーダルの集約**（例: 同週に憧れ発火が3件あれば1画面に並べる）を検討。

ただし F-1 裏切り者・F-2 出戻り・F-12 個別反応は集約不可（個別演出が必要）。
