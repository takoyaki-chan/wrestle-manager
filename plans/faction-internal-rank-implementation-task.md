# 派閥内ポイント制 + F-INTERNAL-CHALLENGE — Claude Code 実装ハンドオフ

**ファイル**: `plans/faction-internal-rank-implementation-task.md`
**作成日**: 2026-05-03
**対象**: Claude Code
**担当モデル推奨**: Opus（複数システム連動: 派閥 + Common-1 + F08同型UI + archetype 遷移 + 試合フック + マイグレーション）
**前提**: `specs/faction-internal-rank-spec-v0.2.md` のステータスが 🟡（実装着手可）であること

---

## 0. このタスクを開始する前に必ず確認

### 必ず最初に読むドキュメント

順番に読んでから実装に入ること:

1. **`CLAUDE.md`**（数値哲学・テンプレ表現禁止・段取りルール）
2. **`specs/faction-internal-rank-spec-v0.2.md`**（本タスクの完全仕様、必読）
3. **`specs/faction-system-spec-v0.1.md`** §3.1, §9.3（リーダー定義・F03 リーダー喪失処理、本仕様の前提）
4. **`specs/faction-archetype-rework-spec-v0.1.md`** v0.4 §6（archetype 遷移ロジック、AUTHORITY → MERIT/BOND の経路）
5. **`specs/faction-common-events-spec-v0.1.md`** §3（Common-1、本仕様のポイント加算ソース）
6. **`specs/faction-rivalry-points-spec-v0.1.md`**（参考実装、対称構造として模倣する）
7. **`src/factions.js`** の以下の箇所を熟読:
   - `applyCommon1MatchResult`（行 2767-2873）— ポイント加算フックを末尾に追加する場所
   - `accrueRivalryPointsFromMatch`（行 4348-4407）— 似た構造の参考実装
   - `_getFactionMatchRank`（行 4409-4423）— OVR 順位算出の既存パターン
   - `checkRivalryResolution` / `applyRivalryVictory`（行 4427-4558）— 決着判定の参考実装
   - `checkF09Conditions` / F08 試合ロック処理（`_f08Locked` 周辺）— ショウカード強制注入の参考
   - `_decideF03Branch` / 後継処理（行 1130-1330 周辺）— リーダー交代の既存処理
   - `_applyArchetypeTransition`（archetype 遷移ヘルパ）
8. **`src/management.js`** の以下の箇所:
   - `tickWeek` 内の派閥パイプライン（`checkRivalryResolution` / `checkF09Conditions` 呼び出し箇所、行 9695-9720 周辺）
   - `finalizeShow` のポイント加算フック（`accrueRivalryPointsFromMatch` 呼び出し、行 10452-10466 周辺）
   - F08 ショウカード強制注入処理
9. **`src/ui-common.js`** の `showFactionF08PreMatchModal` / `showFactionF08PostMatchModal`（流用元）

### 着手前確認

- `specs/faction-internal-rank-spec-v0.2.md` のステータスが `🟡 v0.2 起案（実装着手前・要レビュー）` または `🟢 v0.2 確定（実装着手可）` のいずれかであること
- 既存 auto-sim が違反 0 / エラー 0 で通っていること（着手前ベースライン取得）

---

## 1. このタスクで何をやるか

`specs/faction-internal-rank-spec-v0.2.md` を実装する。`factions.js:2849` のコメント「リーダー交代の伏線フラグ（v0.2 で交代イベントに連結予定）」を実際に v0.2 で接続し、派閥内に序列ポイントを蓄積させ、リーダー超えで挑戦戦を発火、勝敗で実際にリーダーが交代するシステムを完成させる。

外部抗争（F-RIVALRY-POINTS / F09）の対称構造として、内部抗争（F-INTERNAL-RANK / F-INTERNAL-CHALLENGE）が機能する。

### スコープ

| 対象 | 内容 |
|------|------|
| 仕様書 | `specs/faction-internal-rank-spec-v0.2.md` のステータスを 🟡→🟢 に更新 |
| データ構造 | `G.factionInternalPoints` / `faction.leaderEnthronedSeason/Week` / `faction.internalChallengeCooldownUntilWeek` / `state._pendingInternalChallenge` の lazy init とマイグレーション |
| ポイント加算 | `applyCommon1MatchResult` 末尾フック、`finalizeShow` での派閥外試合フック |
| 挑戦権検出 | `checkInternalChallengeConditions` / `registerInternalChallenge` |
| 試合ロック | F08-A と同型の showCard slot 強制注入 + picker ロック + バッジ表示 |
| 試合結果反映 | `applyInternalChallengeResult`（リーダー交代 / 防衛、OVR 順位ベース割り振り、effect 適用、archetype 遷移） |
| UI モーダル | `showInternalChallengePreModal` / `showInternalChallengePostModal`（F08 流用ベース、配色のみ差替） |
| セリフ | `INTERNAL_CHALLENGE_*_LINES` 4種テーブル（性格×アーキタイプ × HP帯） |
| UI 派閥詳細画面 | ポイント数値表示・「リーダー就任から N 週」表記・⚔ アイコン |
| マイグレーション | 既存派閥に OVR 順位ベース初期割り振り |
| auto-sim 検証 | 仕様書 §11 の指標が期待値内 |

### スコープ外

- Common-1 のペア選定ロジック改変（仕様書 §3.1, §6.1 で明示的に「実装後の観測ベースで判断」としている、本タスクでは触らない）
- F09 / F08 本体の挙動変更（排他制御の追加のみ）
- archetype 遷移ロジック自体の変更（既存 `_applyArchetypeTransition` を呼ぶだけ）
- セリフテーブルの全アーキタイプ × 全性格の網羅（プレースホルダ可、normal フォールバック必須）

---

## 2. 全体の進め方と Phase 進行

| Phase | 内容 | 想定規模 |
|-------|------|:------:|
| 1 | データ構造 lazy init + マイグレーション + ヘルパー基盤 | 小 |
| 2 | ポイント加算フック（Common-1 + 派閥外試合） | 中 |
| 3 | 挑戦権検出 + ショウカード強制注入（F08同型） | 中〜大 |
| 4 | 試合結果反映 + リーダー交代 + OVR 順位割り振り + archetype 遷移 | 大 |
| 5 | UI モーダル（pre/post）+ セリフテーブル + 派閥詳細画面表示 | 大 |
| 6 | F03 / F05 / F09 との相互作用整理 + マイグレーション動作確認 | 中 |
| 7 | auto-sim 検証 + 仕様書 §11 期待値との乖離調整 | 中〜大 |

**各 Phase 完了時に Keisuke さんに報告して承認を得てから次へ進む。**

特に **Phase 4 完了時点（実機でリーダー交代が起きるようになった時点）** で一度プレイ確認をしてもらう。挑戦戦のドラマ性が想定通りか、ポイント表示が「最適化対象」と「進行度」の境界を保てているかは数値だけでは判断できないため。

---

## 3. Phase 別実装詳細

### Phase 1: データ構造 + 基盤

#### 3.1 lazy init

`Engine.factions._ensureInternalPointsInit(state)` ヘルパを新設し、以下のパスで呼ぶ:

- `Engine.createInitialState` 完了直後
- セーブロード時のマイグレーション（`_migrated_factions_internal_points_v1`）
- `accrueInternalPointsFromCommon1` / `accrueInternalPointsFromExternalMatch` / `checkInternalChallengeConditions` の処理冒頭（保険）

```js
_ensureInternalPointsInit(state) {
  if (!state.factionInternalPoints) state.factionInternalPoints = {};
  for (const f of (state.factions || [])) {
    if (f.leaderEnthronedSeason == null) {
      f.leaderEnthronedSeason = f.createdSeason || state.season;
      f.leaderEnthronedWeek = f.createdWeek || state.week;
    }
    if (f.internalChallengeCooldownUntilWeek == null) {
      f.internalChallengeCooldownUntilWeek = 0;
    }
  }
  return state;
}
```

#### 3.2 マイグレーション

セーブロード時に `_migrated_factions_internal_points_v1` フラグが立っていなければ:

1. `state.factionInternalPoints = {}` で初期化
2. 各派閥に `leaderEnthronedSeason/Week` を `createdSeason/Week` で初期化
3. 各派閥に `internalChallengeCooldownUntilWeek = 0` を初期化
4. **既存派閥に OVR 順位ベース初期割り振り** を実行（§4.4 の `_allocateInternalPointsByOvrRank` を流用、新旧リーダーは存在しないので「全員を OVR 順位で序列化」する）
5. フラグを立てる

#### 3.3 ヘルパーネームスペース（Phase 4 までに実装）

```js
Engine.factions = {
  // 既存 ...
  
  // Phase 1
  _ensureInternalPointsInit,
  _getInternalPoints(state, factionId, fighterId),  // 0 デフォルト
  _setInternalPoints(state, factionId, fighterId, pt),  // 下限0クランプ
  _addInternalPoints(state, factionId, fighterId, delta),
  
  // Phase 2
  accrueInternalPointsFromCommon1(state, payload, common1Result),
  accrueInternalPointsFromExternalMatch(state, matchCtx),
  
  // Phase 3
  checkInternalChallengeConditions(state, rng),
  registerInternalChallenge(state, payload),
  
  // Phase 4
  applyInternalChallengeResult(state, matchResult, rng),
  _allocateInternalPointsByOvrRank(state, factionId, excludeFighterIds),
};
```

#### 3.4 完了条件

- 既存 auto-sim 100 シーズン × seed 42 で違反 0、エラー 0
- 新規ゲーム開始時に `state.factionInternalPoints = {}` が初期化される
- セーブ/ロードを跨いでも `leaderEnthronedSeason/Week` が保たれる
- 既存セーブ（13年目）をロードし、マイグレーションで全既存派閥に OVR 順位ベース初期ポイントが割り振られていることをログ出力で確認

---

### Phase 2: ポイント加算フック

#### 3.5 Common-1 結果フック

`applyCommon1MatchResult`（`factions.js:2767`）の末尾、戻り値直前に追加:

```js
// 派閥内ポイント加算（v0.2 仕様書 §3.1）
if (facId) {
  s = this.accrueInternalPointsFromCommon1(s, payload, {
    winnerId, loserId, isUpset, isLeaderWin
  });
}
```

`accrueInternalPointsFromCommon1` の実装は仕様書 §3.1 の表に従う:

| 結果 | 勝者 | 敗者 |
|---|---|---|
| 非リーダー同士（`!isLeaderWin && !isUpset`） | +6 | -3 |
| リーダー順当勝ち（`isLeaderWin`） | ±0 | -3（非リーダー敗者） |
| 下克上（`isUpset`） | +12 | -8（リーダー） |

**重要**: BOND archetype の派閥はスキップ（`f.archetypeId === 'BOND'` で判定、互換のため legacy `f.flavor === 'bond'` もチェック）。

#### 3.6 派閥外試合の節目勝利フック

`finalizeShow` 内、既存 `accrueRivalryPointsFromMatch` 呼び出しの**直後**に並べる形で追加。試合 context は同じものを流用。

`accrueInternalPointsFromExternalMatch(state, matchCtx)`:
- 勝者の派閥所属を `getFactionByFighterId` で取得
- BOND 派閥はスキップ
- **勝者がリーダー本人ならスキップ**（リーダーには加算しない、§3.2）
- タイトル戦勝利: +3pt
- メイン勝利（タイトル戦兼任時は重複しない、高い方を採用）: +2pt
- F09 試合は ×1.5 倍率
- Common-1 試合（`matchCtx.isCommon1 === true`）はスキップ（§3.5 で別ルートで処理されているため）

```js
// 概略
if (matchCtx.isCommon1) return state;  // 二重加算防止
const winnerFaction = this.getFactionByFighterId(state, winnerId);
if (!winnerFaction) return state;
if (winnerFaction.archetypeId === 'BOND') return state;
if (winnerFaction.leaderId === winnerId) return state;  // リーダーには加算しない

let pt = 0;
if (matchCtx.isTitle) pt = cfg.internalPointsExternalTitleWin;
else if (matchCtx.isMain) pt = cfg.internalPointsExternalMainWin;
if (pt <= 0) return state;
if (matchCtx.isF09) pt = Math.round(pt * cfg.internalPointsF09Multiplier);
return this._addInternalPoints(state, winnerFaction.id, winnerId, pt);
```

#### 3.7 完了条件

- auto-sim 100 シーズン × seed 42 で違反 0、エラー 0
- 13年目セーブをロードし、数週進めて `state.factionInternalPoints` にエントリが蓄積していくことをコンソール `[WM Internal Rank]` ログで確認
- BOND archetype の派閥にはエントリが作られないこと
- リーダーには Common-1 順当勝ちでも派閥外勝利でも加算されないこと（コンソールログで確認）

---

### Phase 3: 挑戦権検出 + ショウカード強制注入

#### 3.8 checkInternalChallengeConditions

仕様書 §4.1 の9条件を全てチェック。F09 排他制御に注意。

```js
checkInternalChallengeConditions(state, rng) {
  if (!state.factionInternalPoints) return null;
  if (state._pendingF09) return null;  // F09 排他
  // 進行中の F09 ペアエントリチェック
  const hasActiveF09 = Object.values(state.factionRivalryPoints || {})
    .some(e => e.f09Active);
  if (hasActiveF09) return null;
  
  const cfg = FACTION_CONFIG;
  const absWeek = (state.season || 1) * 52 + (state.week || 1);
  
  for (const f of (state.factions || [])) {
    if (f.status !== 'active') continue;
    if (f.archetypeId === 'BOND') continue;
    if ((f.memberIds || []).length < cfg.internalChallengeMinFactionSize) continue;
    
    // CD チェック
    const cdUntilAbs = (f.internalChallengeCooldownUntilWeek != null)
      ? f.internalChallengeCooldownUntilWeek : 0;
    if (absWeek < cdUntilAbs) continue;
    
    // リーダー就任から猶予期間チェック
    const enthronedAbs = (f.leaderEnthronedSeason || 1) * 52 + (f.leaderEnthronedWeek || 1);
    if (absWeek - enthronedAbs < cfg.internalChallengeGraceWeeksAfterEnthronement) continue;
    
    // リーダー在籍チェック
    const leader = (state.roster || []).find(c => c.id === f.leaderId);
    if (!leader) continue;
    
    // 既に挑戦戦予約済みならスキップ
    if (state._pendingInternalChallenge && state._pendingInternalChallenge.factionId === f.id) continue;
    
    // 挑戦者候補選定
    const leaderPt = this._getInternalPoints(state, f.id, f.leaderId);
    const threshold = (f.archetypeId === 'FACE')
      ? cfg.internalChallengeThresholdGapFace
      : cfg.internalChallengeThresholdGap;
    
    const challengers = (f.memberIds || [])
      .filter(id => id !== f.leaderId)
      .filter(id => (state.roster || []).find(c => c.id === id))
      .map(id => ({ id, pt: this._getInternalPoints(state, f.id, id) }))
      .filter(x => x.pt > leaderPt && (x.pt - leaderPt) >= threshold)
      .sort((a, b) => {
        if (b.pt !== a.pt) return b.pt - a.pt;
        // 同点はOVR上位
        const aOvr = Engine.util.ov((state.roster || []).find(c => c.id === a.id));
        const bOvr = Engine.util.ov((state.roster || []).find(c => c.id === b.id));
        return bOvr - aOvr;
      });
    
    if (challengers.length === 0) continue;
    
    return {
      factionId: f.id,
      factionName: f.name,
      challengerId: challengers[0].id,
      leaderId: f.leaderId,
    };
  }
  return null;
}
```

#### 3.9 registerInternalChallenge

```js
registerInternalChallenge(state, payload) {
  state._pendingInternalChallenge = {
    factionId: payload.factionId,
    challengerId: payload.challengerId,
    leaderId: payload.leaderId,
    registeredSeason: state.season,
    registeredWeek: state.week,
  };
  this._appendFactionTimeline(state, payload.factionId, {
    type: 'INTERNAL_CHALLENGE_REGISTERED',
    season: state.season, week: state.week,
    challengerId: payload.challengerId, leaderId: payload.leaderId,
  });
  return state;
}
```

#### 3.10 tickWeek パイプラインへの組込み

`management.js` の F09 判定ブロック（行 9706-9720 周辺）の **直後** に追加:

```js
// 派閥内挑戦戦 発火判定（spec §4） — F09 後・興行週限定
if (!s._pendingFactionEvent && !s._pendingF09 && !s._pendingInternalChallenge
    && Engine.util.isShowWeek(s.week)
    && typeof Engine.factions.checkInternalChallengeConditions === 'function') {
  const icRng = Engine.rng.create(Engine.rng.derive(s.rngSeed || 1, s.season || 1, s.week || 1, 0xFA20));
  const cand = Engine.factions.checkInternalChallengeConditions(s, icRng);
  if (cand) {
    s = Engine.factions.registerInternalChallenge(s, cand);
    console.log('[WM Internal Rank] Challenge registered:', cand);
  }
}
```

RNG シード `0xFA20` を新規追加（既存の `0xFA1B`〜`0xFA1F` の続き）。

#### 3.11 ショウカード強制注入（F08 同型）

`renderShowPrep` 内、F08 ディレクティブ検出処理の直後に並べる形で追加:

- `state._pendingInternalChallenge` を検出
- showCard slot 0（メイン）に挑戦者 vs リーダーのシングル戦を強制注入
- 他 slot に同 2名がいた場合は自動除去
- slot に `_internalChallengeLocked: true` をマーク

`_spOpenPicker` の F08 ロックハンドリング箇所に内部挑戦戦の case を追加（トースト「派閥内序列戦は固定です」）。

slot UI に「⚔ 派閥内序列戦（固定）」バッジを追加（F08 の「🔥 F08 直接対決（固定）」と同じスタイル、絵文字のみ差替）。

#### 3.12 完了条件

- auto-sim 200 シーズン × seed 42 で違反 0、エラー 0
- 13年目セーブをロード → 適切なポイント差を持つ派閥がある場合に挑戦戦が登録されること（コンソールログで確認、まだ試合反映は Phase 4）
- F09 進行中は登録されないこと（テストフィクスチャで確認）
- 挑戦戦登録後、ショウカードのメインに該当試合が強制注入され、picker でロックされていること
- 興行終了時に `_pendingInternalChallenge` がクリアされること

---

### Phase 4: 試合結果反映 + リーダー交代 + OVR 順位割り振り

#### 3.13 _allocateInternalPointsByOvrRank

```js
_allocateInternalPointsByOvrRank(state, factionId, excludeFighterIds = []) {
  const cfg = FACTION_CONFIG;
  const allocation = cfg.internalPointsAllocationByOvrRank || [8, 5, 2, 0];
  const f = (state.factions || []).find(x => x.id === factionId);
  if (!f) return state;
  
  // 全メンバーをゼロリセット
  state.factionInternalPoints[factionId] = {};
  
  // 除外（新旧リーダー等）はゼロのまま
  for (const id of excludeFighterIds) {
    state.factionInternalPoints[factionId][id] = 0;
  }
  
  // OVR 順位算出（除外メンバー以外）
  const candidates = (f.memberIds || [])
    .filter(id => !excludeFighterIds.includes(id))
    .map(id => {
      const c = (state.roster || []).find(c => c.id === id);
      return c ? { id, ovr: Engine.util.ov(c) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.ovr - a.ovr);
  
  for (let i = 0; i < candidates.length; i++) {
    const pt = (i < allocation.length) ? allocation[i] : allocation[allocation.length - 1];
    state.factionInternalPoints[factionId][candidates[i].id] = pt;
  }
  return state;
}
```

#### 3.14 applyInternalChallengeResult

`finalizeShow` で `_internalChallengeLocked: true` の試合結果が確定した時に呼ぶ:

```js
applyInternalChallengeResult(state, matchResult, rng) {
  const pending = state._pendingInternalChallenge;
  if (!pending) return state;
  const { factionId, challengerId, leaderId } = pending;
  const f = (state.factions || []).find(x => x.id === factionId);
  if (!f) return state;
  
  const challengerWon = matchResult.winnerId === challengerId;
  const cfg = FACTION_CONFIG;
  const absWeek = (state.season || 1) * 52 + (state.week || 1);
  let s = state;
  
  if (challengerWon) {
    // === 禅譲（リーダー交代） ===
    // 派閥構造更新
    const newName = this._buildFactionNameFromLeader(s, challengerId);
    s = this._updateFaction(s, factionId, {
      leaderId: challengerId,
      name: newName,
      leaderEnthronedSeason: s.season,
      leaderEnthronedWeek: s.week,
      internalChallengeCooldownUntilWeek: absWeek + cfg.internalChallengeCooldownWeeks,
    });
    
    // OVR 順位ベース割り振り（新旧リーダーは0pt）
    s = this._allocateInternalPointsByOvrRank(s, factionId, [challengerId, leaderId]);
    
    // effect 適用（仕様書 §4.4 リーダー敗北 表）
    s = this._applyInternalChallengeUpsetEffects(s, factionId, challengerId, leaderId, rng);
    
    // archetype 遷移（AUTHORITY のみ）
    if (f.archetypeId === 'AUTHORITY') {
      const toArchetype = this._decideAuthorityTransitionTarget(s, factionId, challengerId);
      // toArchetype: 'MERIT' or 'BOND'
      s = this._applyArchetypeTransition(s, factionId, toArchetype, {
        reasonKey: 'AUTHORITY_DEFEATED_INTERNAL', leaderId: challengerId
      });
    }
    
    // モーダルキュー（pending）
    s._pendingInternalChallengePostModal = {
      factionId, oldLeaderId: leaderId, newLeaderId: challengerId, leaderWon: false,
      hpRatio: matchResult.loserHpRatio,
    };
  } else {
    // === 防衛（権威の確認） ===
    s = this._updateFaction(s, factionId, {
      internalChallengeCooldownUntilWeek: absWeek + cfg.internalChallengeCooldownWeeks,
      // leaderEnthronedSeason/Week は更新しない
    });
    
    // OVR 順位ベース割り振り（リーダー・挑戦者は0pt）
    s = this._allocateInternalPointsByOvrRank(s, factionId, [leaderId, challengerId]);
    
    // effect 適用（仕様書 §4.4 リーダー勝利 表）
    s = this._applyInternalChallengeHoldEffects(s, factionId, leaderId, challengerId, rng);
    
    s._pendingInternalChallengePostModal = {
      factionId, oldLeaderId: leaderId, newLeaderId: leaderId, leaderWon: true,
      hpRatio: matchResult.loserHpRatio,
    };
  }
  
  // タイムライン
  this._appendFactionTimeline(s, factionId, {
    type: 'INTERNAL_CHALLENGE_RESOLVED',
    season: s.season, week: s.week,
    challengerId, leaderId, challengerWon,
  });
  
  // pending クリア
  s._pendingInternalChallenge = null;
  
  return s;
}
```

#### 3.15 archetype 遷移先判定

仕様書 §4.5 の規則:
- 後継幹部（=新リーダー）の性格を `getPersonalityType` で取得
- fiery / grudging / bold / emotional 多数 → MERIT
- それ以外 → BOND

ただし「多数」の判定は新リーダー1人だけだと曖昧なので、**派閥幹部 OVR 上位2名 + 新リーダーの計3名**で多数決する形に解釈する。Keisuke 確認推奨。

#### 3.16 完了条件

- auto-sim 200 シーズン × seed 42 で違反 0、エラー 0
- 13年目セーブで、Phase 3 で登録された挑戦戦が試合実行 → リーダー交代 or 防衛が動くこと
- リーダー敗北時、`leaderId` が実際に挑戦者に置き換わること
- 派閥名が新リーダー名に更新されること（`堂前ユキ組` → `片桐ありさ組` のような）
- AUTHORITY 派閥でリーダー敗北時、`archetypeId` が MERIT or BOND に遷移すること
- 全メンバーのポイントが OVR 順位ベース（8/5/2/0）に再配分されていること

**※ ここで Keisuke の実プレイ確認を強く推奨。** 数値だけでは挑戦戦のドラマ性は判断できない。

---

### Phase 5: UI モーダル + セリフ + 派閥詳細画面表示

#### 3.17 UI モーダル

`ui-common.js` に `showInternalChallengePreModal` / `showInternalChallengePostModal` を新設。F08 の `showFactionF08PreMatchModal` / `showFactionF08PostMatchModal` を**コピーベース**にして、配色 CSS クラスのみ差し替え。

新規 CSS（`index.html` :root）:

```css
--accent-internal-challenge-bg-from: #1a0a2d;
--accent-internal-challenge-bg-to:   #2d0d4d;
--accent-internal-challenge-frame-defender: rgba(120,60,180,0.4);
```

`fevt-arena-card.internal-challenge-pre` / `fevt-arena-card.internal-challenge-post` クラスを `index.html` に追加。

#### 3.18 セリフテーブル

`src/data-faction-dialogue.js` に4種追加:

```js
const INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES = {
  AUTHORITY: { fiery: [...], composed: [...], grudging: [...], airy: [...], earnest: [...], flippant: [...] },
  MERIT: { ... },
  HEEL: { ... },
  FACE: { ... },
  COMBAT: { ... },
  // BOND は発動しないので不要
  normal: { /* フォールバック */ }
};
const INTERNAL_CHALLENGE_PRE_LEADER_LINES = { /* 同構造 */ };
const INTERNAL_CHALLENGE_POST_WINNER_LINES = { /* 同構造、防衛/禅譲で分岐は呼び出し側で */ };
const INTERNAL_CHALLENGE_POST_LOSER_LINES = {
  AUTHORITY: { fiery: { hp_high: [...], hp_mid: [...], hp_low: [...] }, ... },
  // ...
};
```

各セルにつき最低2-3パターン。フル品質を狙うのは AUTHORITY と MERIT の2 archetype のみで、HEEL/FACE/COMBAT は normal フォールバック相当のプレースホルダ可（仕様書 §11.3 の実プレイ検証フェーズで増強）。

#### 3.19 派閥詳細画面表示

`ui-render.js` の `_renderDbFactions` 内、各メンバーポートレート横にポイント数値を小さく表示:

- BOND archetype の派閥はポイント表示なし（既存の momentum/cohesion 帯と同じ扱い）
- リーダーには 👑 アイコンの後に「`Pt: 0`」のような形式
- 非リーダーには「`Pt: 8`」のような形式（数値表示）
- 挑戦権成立時はリーダーと挑戦者を「⚔」アイコンで結ぶ視覚的指標

派閥カードの右上に「リーダー就任から N 週」表記:
- 52週未満は「就任 N 週目」
- 52週以上は表記なし（or 「就任 N シーズン」)

#### 3.20 試合前プレビューバッジ

`renderShowPrep` のカードタグに「⚔ 派閥内序列戦」バッジを追加（`_internalChallengeLocked === true` の試合のみ）。

#### 3.21 完了条件

- 実プレイで挑戦戦の pre/post モーダルが正しく表示される
- セリフが性格×アーキタイプで分岐している（最低 AUTHORITY/MERIT は確認）
- 派閥詳細画面でポイント数値が見える / 「就任 N 週目」が表示される
- ショウカードのメイン枠に「⚔ 派閥内序列戦」バッジが立つ

---

### Phase 6: F03 / F05 / F09 との相互作用

#### 3.22 F03（リーダー喪失）

`_decideF03Branch` の succession / turmoil 経路で、リーダー継承時に内部ポイント割り振りを実行:

```js
// succession / turmoil 経路の派閥更新処理に追加
if (branch === 'succession' || branch === 'turmoil') {
  s = this._allocateInternalPointsByOvrRank(s, factionId, [successor.id, faction.leaderId]);
  s = this._updateFaction(s, factionId, {
    leaderEnthronedSeason: s.season,
    leaderEnthronedWeek: s.week,
    internalChallengeCooldownUntilWeek: absWeek + cfg.internalChallengeCooldownWeeks,
  });
}

// dissolution 経路では internalPoints[factionId] エントリを削除
if (branch === 'dissolution') {
  if (s.factionInternalPoints) delete s.factionInternalPoints[factionId];
}
```

#### 3.23 F05（派閥内亀裂・分裂）

F05-B 分裂で新派閥が誕生する経路（`createFaction` 呼び出し直後）に追加:

```js
// 旧派閥のポイントを新派閥へ移管（メンバー所属で分割）
if (s.factionInternalPoints && s.factionInternalPoints[oldFactionId]) {
  s.factionInternalPoints[newFactionId] = {};
  for (const id of newFaction.memberIds) {
    s.factionInternalPoints[newFactionId][id] = s.factionInternalPoints[oldFactionId][id] || 0;
    delete s.factionInternalPoints[oldFactionId][id];
  }
}

// 旧派閥側もメンバー構成変化したので OVR 順位ベース再構成
s = this._allocateInternalPointsByOvrRank(s, oldFactionId, [oldFaction.leaderId]);

// 新派閥は誕生時の OVR 順位ベース割り振り（リーダーは0pt）
s = this._allocateInternalPointsByOvrRank(s, newFactionId, [newFaction.leaderId]);

// 新旧派閥それぞれに leaderEnthronedSeason/Week / 個別CD を設定
```

#### 3.24 F04（寝返り）

F04-A 適用処理に追加:

```js
// 寝返った選手のポイントを元派閥から削除
if (s.factionInternalPoints && s.factionInternalPoints[oldFactionId]) {
  delete s.factionInternalPoints[oldFactionId][targetId];
}
// 新派閥へは加算しない（0pt スタート）

// 寝返った選手が現挑戦者だった場合は挑戦戦をクリア
if (s._pendingInternalChallenge && s._pendingInternalChallenge.challengerId === targetId) {
  s._pendingInternalChallenge = null;
}
```

#### 3.25 archetype 遷移（FACE⇄HEEL ドリフト等）

`_applyArchetypeTransition` 内、以下の追加処理:

```js
// BOND に遷移した場合、internalPoints を削除
if (toArchetype === 'BOND') {
  if (s.factionInternalPoints) delete s.factionInternalPoints[factionId];
}
// BOND から遷移した場合、OVR 順位ベース割り振りで初期化
if (fromArchetype === 'BOND' && toArchetype !== 'BOND') {
  s = this._allocateInternalPointsByOvrRank(s, factionId, [faction.leaderId]);
}
```

#### 3.26 完了条件

- auto-sim 200 シーズン × 5 シードで違反 0、エラー 0
- F03 succession 後、内部ポイントが OVR 順位ベース割り振りされていること
- F05 分裂後、両派閥にそれぞれ適切なポイントが設定されていること
- F04 寝返り時、対象選手のポイントが元派閥から削除されていること
- BOND 遷移時、ポイントエントリが削除されていること

---

### Phase 7: auto-sim 検証 + 数値調整

#### 3.27 検証スクリプト

`test/internal-rank-distribution.js` を新設し、200 シーズン × 5 シードで以下を計測:

- archetype 別の挑戦戦発火頻度（AUTHORITY / MERIT / COMBAT / HEEL / FACE）
- 派閥成立から最初の挑戦戦までの平均週数
- リーダー勝率（archetype 別）
- AUTHORITY → MERIT/BOND 遷移率
- F09 と内部挑戦戦の同時発火件数（0 であるべき）

#### 3.28 期待値との比較

仕様書 §11.2 の期待値:
- AUTHORITY: 3〜5シーズンに1回
- MERIT/COMBAT/HEEL: 2〜3シーズンに1回
- FACE: 3〜4シーズンに1回
- 派閥成立から最初の挑戦戦まで平均 80〜130週
- リーダー勝率 60〜70%
- AUTHORITY 遷移率 30〜50%

#### 3.29 乖離時の調整

期待値から大きく外れている場合、`FACTION_CONFIG` の以下パラメータを調整:

| 観測 | 調整候補 |
|---|---|
| 発火頻度が高すぎ | `internalChallengeThresholdGap` を 10 → 12 or 15 |
| 発火頻度が低すぎ | `internalChallengeThresholdGap` を 10 → 8 / Common-1 ポイント値を増やす |
| リーダー勝率が低すぎ | リーダー勝利時の effect 強化 / 下克上ポイントを下げる |
| 発火が早すぎる | `internalChallengeGraceWeeksAfterEnthronement` を 52 → 78 |

数値変更を加えた場合、Keisuke に報告して承認を得る。

#### 3.30 完了条件

- auto-sim 200 シーズン × 5 シードで全指標が期待値内
- 違反 0、エラー 0
- 仕様書 v0.2 のステータスを 🟢 に更新
- 最終的な数値調整内容を仕様書 §0 改訂履歴に追記（v0.3 として）

---

## 4. 注意事項

### 数値哲学の遵守（CLAUDE.md より）

- ポイント数値の表示は「進行度」として見せる、最適化対象として煽らない
- 「効率の良いリーダー交代戦略」をプレイヤーに最適化させない設計
- セリフは性格×アーキタイプで個別化、テンプレ表現禁止

### F08 / F09 との実装パターン共有

本タスクの多くの処理は F08 / F09 のパターンを流用する:

- ショウカード強制注入: F08-A `_f08Locked` パターン
- 試合前後モーダル: F08 `f08-pre-match` / `f08-post-match` パターン
- 試合結果フック: F09 `_f09Active` 試合結果集計パターン
- 排他制御: F09 同時発火防止パターン

**コピー&差替** で済む部分が多い。新規アーキテクチャを設計しない。

### archetype 遷移の慎重な扱い

AUTHORITY → MERIT/BOND の遷移は派閥のアイデンティティを大きく変える。`_applyArchetypeTransition` を呼ぶ際は、必ずナレーション付きで遷移させる（既存実装で対応済みのはず）。

### マイグレーション失敗時のフォールバック

既存セーブで `factionInternalPoints` が存在しない場合、初期化処理で必ず空オブジェクトを作る。マイグレーションフラグが立たないままプレイが続いて、後でロードした時に再度初期化されると既存ポイントが消えるバグになる。フラグの立て忘れに注意。

### RNG シード

新規追加する RNG シード:
- `0xFA20`: tickWeek 内部挑戦戦判定
- `0xFA21`: applyInternalChallengeResult 内の effect ロール用
- `0xFA22`: archetype 遷移先判定（性格多数決）

既存の `0xFA00`〜`0xFA1F` 帯と被らないこと（要確認）。

---

## 5. 承認ゲートまとめ

| Phase | 承認内容 |
|-------|---------|
| 1 完了 | データ構造 + マイグレーション動作確認 |
| 2 完了 | ポイント加算ログで蓄積を確認、BOND 除外を確認 |
| 3 完了 | 挑戦戦登録ログ + ショウカード強制注入動作確認 |
| **4 完了** | **実機でリーダー交代が動く、派閥名更新、archetype 遷移、ドラマ性をプレイ確認** |
| 5 完了 | UI モーダル / セリフ / 派閥詳細画面の実機確認 |
| 6 完了 | F03 / F05 / F04 連携の auto-sim 検証 |
| 7 完了 | 全期待値クリア、仕様書 🟢 化 |

---

## 6. 関連ファイル

実装で触る:

- `src/factions.js`（最大の変更箇所）
- `src/management.js`（tickWeek 組込み + finalizeShow フック）
- `src/data.js`（FACTION_CONFIG 追加）
- `src/ui-render.js`（派閥詳細画面 + showPrep バッジ）
- `src/ui-common.js`（pre/post モーダル）
- `src/index.html`（CSS トークン + クラス）
- `src/data-faction-dialogue.js`（セリフテーブル）
- `src/app.js`（マイグレーション）

参照のみ（変更しない）:

- `specs/faction-internal-rank-spec-v0.2.md`
- `specs/faction-system-spec-v0.1.md`
- `specs/faction-archetype-rework-spec-v0.1.md`
- `specs/faction-common-events-spec-v0.1.md`
- `specs/faction-rivalry-points-spec-v0.1.md`
- `CLAUDE.md`

新設:

- `test/internal-rank-distribution.js`（Phase 7 検証スクリプト）

---

**着手準備完了**
