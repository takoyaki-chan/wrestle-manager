# Phase 1: 派閥システムコア — 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 6〜10時間
> **承認状態**: 設計合意済み（`specs/faction-system-spec-v0.1.md`）
> **前提**: Bond/Rivalry システム v2.0 / Trust システム v2.1 が実装済み

---

## Phase 1 の目的

派閥システムの**バックエンド機能**を丸ごと実装する。UI・演出はまだ作らず、数値だけが正しく動く状態を作る。

Phase 1 が完了した時点で:
- 条件を満たすとコンソールログに「派閥発生条件成立」が出る（UIなしでも検証可能）
- 派閥成立時、内部状態に`factions`配列が生成される
- メンバー加入・離脱・消滅・後継判定が正しく動く
- 対立度・勢いが週次で変動する
- 派閥抗争マッチの集客加算が正しく入る（排他＋キャップ）
- auto-sim 100シーズンでバグなく回る

この段階ではプレイヤーは派閥を視覚的に見られない。Phase 2 で UI、Phase 3/4 でイベント演出を乗せる。

---

## Phase 1 で実装するもの

1. 新規ファイル `src/factions.js` (Engine.factions 名前空間)
2. 派閥検出ロジック（忠誠型 / 対立型の発生条件判定）
3. 派閥のライフサイクル処理（加入・離脱・消滅・派閥解散）
4. 対立度・勢いの週次変動処理
5. F03（リーダー喪失）の自動分岐処理（UIなし、内部処理のみ）
6. 派閥抗争マッチ集客属性（calcMatchAppeal 統合、排他＋キャップ）
7. GameState のマイグレーション（factions / factionHostility / factionEventCooldowns 初期化）
8. tickWeek パイプラインへの統合
9. validateGameState の拡張（派閥データの整合性チェック）
10. auto-sim での検証

**Phase 1 で実装しないもの**:
- 派閥比較UI、相関図の派閥レイヤー、団体タブの派閥セクション（Phase 2）
- F01/F02/F04〜F08 の演出モーダル・セリフ（Phase 3/4）
- F03 の継承セリフ演出（Phase 3）
- データベースタブの3グループ再編（Phase 2）

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. **CLAUDE.md** — アーキテクチャ5原則、開発ルール、auto-sim システム
2. **`specs/faction-system-spec-v0.1.md`** — 全セクション、特に §1〜§6、§8、§12、§13
3. **`specs/relationship-system-spec-v2.0.md`** — bond/rivalry の既存仕様
4. **`specs/trust-system-spec-v2.1.md`** — trust 変動の適用順序
5. **`src/relationships.js`** — 既存の週次処理フロー、非対称モデルのキー形式
6. **`src/management.js` §calcMatchAppeal 周辺（L869〜L925）** — 集客計算の構造
7. **`src/data.js` MATCH_APPEAL_CONFIG（L1329〜L1347）** — 集客加算の既存値

---

## 既存コードの影響範囲

### 新規作成するファイル

| ファイル | 内容 |
|---------|------|
| `src/factions.js` | Engine.factions 名前空間、全派閥ロジック |

### 変更するファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/management.js` | tickWeek への派閥処理統合、calcMatchAppeal への派閥抗争ボーナス統合、validateGameState 拡張、F03 フック（退団・引退時） |
| `src/app.js` | マイグレーション追加（GameState 初期化） |
| `src/data.js` | FACTION_CONFIG 定数追加（🔧 パラメータ集約） |
| `src/index.html` | factions.js の script タグ追加 |

### 触ってはいけない既存コード

- Engine.relationships の名前空間全体 — bond/rivalry ロジックはそのまま
- Engine.trust の名前空間 — trust 変動は applyTrust 経由で既存フローを使う
- 既存の MATCH_APPEAL_CONFIG の数値 — 新規に派閥用のキーを追加するのみ
- calcMatchAppeal の既存計算式 — 派閥抗争ボーナスは新しい分岐として追加
- Engine.title の因縁称号ロジック — 派閥は別概念として並行動作

---

## アーキテクチャ5原則の遵守

1. **Engine純粋関数**: factions.js の全関数は DOM に触れない。state と rng を受け取り、新しい state を返す
2. **GameState返却値更新**: 派閥の変化は必ず `state` を返却する形で行う
3. **UIはGameStateを直接変更しない**: Phase 2 以降の UI は Engine.factions 経由でのみ state を更新
4. **乱数シード管理**: §12 で定義されたシード（0xFA01〜0xFA0C）を使用
5. **tickWeek統合パイプライン**: 派閥処理は relationships.processWeeklyDecay の直後に配置

---

## 実装タスクリスト

### Task 1: データモデルとマイグレーション（30分）

#### 1-1. src/data.js に FACTION_CONFIG を追加

spec §1〜§5 の 🔧 パラメータを集約した定数オブジェクトを追加。既存の MATCH_APPEAL_CONFIG と同じファイル内、同じスタイルで配置:

```javascript
const FACTION_CONFIG = {
  // §2.1 発生条件
  minRosterSize: 10,           // この人数超で発生可能
  loyalBondThreshold: 65,      // 忠誠型：リーダーからのbond閾値
  loyalMinFollowers: 2,        // 忠誠型：最小フォロワー数
  rivalrousBondThreshold: 60,  // 対立型：クラスタ内bond閾値
  rivalrousRivalryThreshold: 40, // 対立型：クラスタ間平均rivalry閾値
  // §2.2 加入判定
  joinBondThreshold: 60,
  joinRate: { 60: 0.20, 70: 0.40, 80: 0.60 }, // bond帯別/週
  joinMomentumHighMult: 1.5,   // 勢い+30超
  joinMomentumLowMult: 0.7,    // 勢い-30未満
  // §2.3 離脱判定
  leaveBondThreshold: 40,
  leaveRate: 0.10,             // 基本離脱率/週
  leaveMomentumLowMult: 1.5,   // 勢い-30未満
  leaveMomentumVeryLowMult: 2.0, // 勢い-60未満
  leaveMomentumTrustDecay: -0.3, // 勢い-60未満時の追加trust減衰
  // §2.4 消滅・解散
  minFactionSize: 3,
  dissolveRatioThreshold: 0.80, // ロスターの80%占有で派閥制度解散
  // §2.5 後継
  successionOvrRatioFull: 0.83,  // 83%以上で通常継承
  successionOvrRatioPartial: 0.70, // 70〜82%で動揺50%
  successionShockProbability: 0.50, // 部分継承時の動揺確率
  // §4 対立度
  hostilityDecayPerWeek: -0.3,
  hostilityHighBondExtraDecay: -0.3,
  hostilityHighBondThreshold: 50,
  hostilityLeaderChangeMultiplier: 0.7, // リーダー交代時
  // §5 勢い
  momentumDecayPerWeek: -1.0,
  momentumSeniorBonus: [8, 12],  // 幹部試合勝利（min,max）
  momentumLeaderBonus: [15, 20], // リーダー試合勝利
  // §6 派閥抗争appeal
  factionAppealLow: 5,         // 対立度40〜59
  factionAppealMid: 10,        // 対立度60〜79
  factionAppealHigh: 10,       // 対立度80以上（F08非発動）
  f08AppealBase: [15, 20],     // F08直接対決時
  f08TitleMultiplier: 0.5,     // F08+タイトル戦重複時
  feudSumCap: 30,              // 因縁系合計キャップ
  // §8 発動制御
  eventProbability: {
    F01: 0.60, F02: 0.80,
    F04: 0.30, F05: 0.40, F06: 0.50, F07: 0.40, F08: 0.50,
  },
  eventCooldown: {
    F01: 12, F04: 12, F05: 12, F06: 16, F07: 12, F08: 24,
  },
};
```

注意: Phase 1 ではイベント演出（F01/F02/F04〜F08）は実装しないが、設定値だけ入れておく。Phase 3/4 で参照する。

#### 1-2. src/app.js にマイグレーション追加

既存のマイグレーションパターン（`_migrated_relationships_v1` など）と同じ流儀で、`_migrated_factions_v1` を追加:

- `GameState.factions` を `[]` で初期化
- `GameState.factionHostility` を `{}` で初期化
- `GameState.factionEventCooldowns` を `{}` で初期化

既存セーブにはこれらのフィールドが存在しないため、初回ロード時に空で初期化する。

---

### Task 2: Engine.factions 名前空間の骨格（1時間）

#### 2-1. src/factions.js を新規作成

ファイルの冒頭構造:

```javascript
// ===== Engine.factions =====
// 派閥システム（spec: faction-system-spec-v0.1.md）
Engine.factions = {
  // §2.1 発生条件チェック
  checkLoyalFormationConditions(state) { /* ... */ },
  checkRivalrousFormationConditions(state) { /* ... */ },

  // §2.2-2.3 メンバー変動
  processWeeklyMemberChanges(state, rng) { /* ... */ },

  // §2.4 消滅・解散
  checkDissolutionConditions(state) { /* ... */ },

  // §2.5 後継判定（F03）
  handleLeaderLoss(state, factionId, rng) { /* ... */ },

  // §4 対立度処理
  processWeeklyHostilityDecay(state) { /* ... */ },
  applyHostilityChange(state, fromFactionId, toFactionId, delta) { /* ... */ },

  // §5 勢い処理
  processWeeklyMomentumDecay(state) { /* ... */ },
  applyMomentumChange(state, factionId, delta) { /* ... */ },

  // §6 派閥抗争マッチ判定
  isFactionFeudMatch(state, fighterIdA, fighterIdB) { /* ... */ },
  calcFactionFeudAppeal(state, fighterIdA, fighterIdB) { /* ... */ },

  // §4 試合結果を対立度・勢いに反映
  applyMatchResult(state, fighterIdA, fighterIdB, result) { /* ... */ },

  // ヘルパー
  getFactionByFighterId(state, fighterId) { /* ... */ },
  isLeader(state, fighterId) { /* ... */ },
  isExecutive(state, fighterId) { /* ... */ },
  isLeaderOrExecutive(state, fighterId) { /* ... */ },

  // §1.3 フレーバー変換（Phase 2でUIから呼ばれるが、関数自体はPhase 1で作る）
  getMomentumLabel(momentum) { /* ... */ },
  getHostilityLabel(hostility) { /* ... */ },
  getSolidarityLabel(faction, state) { /* ... */ },
};
```

#### 2-2. src/index.html に script タグを追加

既存の relationships.js の直後に factions.js を読み込ませる。

---

### Task 3: 派閥検出・発生処理（1.5時間）

#### 3-1. 忠誠型発生条件

`checkLoyalFormationConditions(state)`:
- 自団体ロスター（player org の所属）が 10人超か
- 派閥数が 0 か
- OVR トップ3の各選手について、その選手から bond 65+ のフォロワーが2人以上いるか
- 条件成立時、核となる選手IDとフォロワーIDのリストを返す（`{ eligible: true, leaderId, followerIds } | { eligible: false }`）

#### 3-2. 対立型発生条件

`checkRivalrousFormationConditions(state)`:
- 自団体ロスターが 10人超か
- 派閥数が 0 または 1 か
- 相互 bond 60+ のクラスタを検出（簡易クラスタリング: 各選手から bond 60+ の相手を辿って BFS で連結成分を求める）
- 2つ以上のクラスタが同時に存在し、クラスタ間の平均 rivalry が 40+ か
- 条件成立時、2つのクラスタ情報を返す

#### 3-3. 派閥を生成する関数

`createFaction(state, leaderId, memberIds, options = {})`:
- spec §1.1 のデータ構造に沿って faction オブジェクトを生成
- リーダーOVR最上位、幹部は§3.2、派閥名は「${リーダー名}組」
- `authoritativeTag` / `dictatorTag` は options から受け取る（Phase 3 で F01-A 選択時に true 渡し）
- `state.factions` に追加して新しい state を返す

**重要**: Phase 1 では F01/F02 の演出イベントがないため、条件成立時にいきなり派閥が静かに生成される（ログだけ出す）。Phase 3 でこのフローをイベント経由に書き換える。

条件成立時のログ: `[WM Faction] Loyal faction formed: ${leaderName} (members: ${memberCount})`

---

### Task 4: メンバー変動・消滅処理（1時間）

#### 4-1. processWeeklyMemberChanges(state, rng)

全派閥について、以下を順に処理:

1. **加入判定**: 派閥未所属の自団体選手を走査、既存メンバーとの平均bondを算出。bond帯ごとの加入確率を引く。勢い修正適用。加入時は`memberIds`に追加、ログ出力
2. **離脱判定**: 各メンバーがリーダーへのbondが 40未満になっていれば離脱判定。勢い修正適用。離脱時は`memberIds`から除外、無派閥化、ログ出力
3. **勢い-60未満時のtrust減衰**: 派閥メンバー全員に trust -0.3 適用（applyTrust 経由、既存のmental係数等も通す）

#### 4-2. checkDissolutionConditions(state)

全派閥について:
- メンバー数が3人未満 → 派閥消滅（§2.4）
- 1つの派閥が自団体ロスターの80%以上を占有 → 派閥制度ごと全解散（§2.6）

消滅時:
- 対立派閥があった場合、その勢い -3〜-5
- `factionHostility` 内の該当ペアエントリを削除
- ログ出力

全解散時:
- `state.factions = []`
- `state.factionHostility = {}`
- 全派閥の authoritativeTag / dictatorTag 情報はクリア（state に残っている場合）
- ログ: `[WM Faction] Faction system dissolved (single faction dominated >80% of roster)`

---

### Task 5: 対立度・勢いの週次変動（1時間）

#### 5-1. processWeeklyHostilityDecay(state)

`state.factionHostility` の全キーを走査、以下を適用:

- `-0.3/週` 基本減衰
- 両派閥メンバー間の平均bondが 50超なら追加 `-0.3/週`
- 値を clamp[0, 100]
- 値が 0 に達したキーは削除（メモリ節約）

#### 5-2. processWeeklyMomentumDecay(state)

全派閥について:
- 絶対値を 0 方向へ `-1.0/週`（符号付き、0をまたがないように）
- 忠誠型派閥は勢いを常に 0 に保つ（対立派閥がない間は勢い概念なし）

---

### Task 6: F03 リーダー喪失処理（45分）

#### 6-1. handleLeaderLoss(state, factionId, rng)

既存のリーダーが派閥メンバーから除外された時点（退団/引退/長期離脱）で呼ばれる。

処理:
1. 残メンバーのOVR最上位を後継候補に
2. 旧リーダーOVRとの比率を計算
3. 分岐:
   - 83%以上 → 通常継承（spec §9.3）
   - 70〜82% → rng で 50%判定、動揺 or 通常継承
   - 70%未満 → 解散
4. 各分岐で trust / bond / 勢い / 対立度を規定通り更新
5. 派閥名を後継者名ベースに更新
6. `lastLeaderChangeSeason/Week` 更新

**重要**: Phase 1 では F03 の演出セリフは出さない。内部処理だけ正しく動くこと。演出は Phase 3 で追加。

#### 6-2. F03 発火フック

`management.js` 内の退団処理・引退処理から、派閥リーダーが対象の場合に`handleLeaderLoss`を呼び出す。既存の `release` / `retire` / `suddenDeparture` / `contractDeparture` の各フックに条件分岐を追加:

```javascript
if (fighter && state.factions) {
  const faction = Engine.factions.getFactionByFighterId(state, fighter.id);
  if (faction && faction.leaderId === fighter.id) {
    state = Engine.factions.handleLeaderLoss(state, faction.id, rng);
  }
  // リーダー以外のメンバーなら通常の離脱処理
  else if (faction) {
    // memberIds から除外
  }
}
```

これにより、契約退団・引退・突然離脱・引き抜きの4パスでリーダー喪失が拾われる。

---

### Task 7: 派閥抗争マッチ集客統合（1.5時間）

#### 7-1. isFactionFeudMatch(state, fighterIdA, fighterIdB)

spec §6.1 の条件:
- 両者が異なる派閥に所属
- 両者がそれぞれの派閥のリーダーまたは幹部
- 派閥間の対立度（両方向の平均）が 40以上

条件を満たすかを boolean で返す。

#### 7-2. calcFactionFeudAppeal(state, fighterIdA, fighterIdB, options)

spec §6.2 の加算値を返す:
- 対立度40〜59: +5
- 対立度60〜79: +10
- 対立度80以上（通常）: +10
- options.f08 = true（F08発動中）: +15〜+20、options.isTitle = true なら ×0.5

#### 7-3. calcMatchAppeal への統合

`src/management.js` の L869 `calcMatchAppeal` を修正:

```javascript
calcMatchAppeal(fighterA, fighterB, context, G) {
  // ... 既存処理 ...

  // B2: 因縁（rivalry値、低い方採用）
  let rivalryAppeal = 0;
  if (G.relationships) {
    // ... 既存処理 ...
    rivalryAppeal = Math.min(rivAB, rivBA) * cfg.rivalryScale;
  }

  // ▼▼▼ 追加: 派閥抗争appeal（排他＋キャップ） ▼▼▼
  let factionAppeal = 0;
  if (G.factions && G.factions.length > 0 && Engine.factions.isFactionFeudMatch(G, fighterA.id, fighterB.id)) {
    factionAppeal = Engine.factions.calcFactionFeudAppeal(G, fighterA.id, fighterB.id, {
      f08: context.isF08Match || false,
      isTitle: context.isTitle || false,
    });
  }
  // 排他: rivalryAppeal と factionAppeal のうち高い方のみ採用
  const feudCore = Math.max(rivalryAppeal, factionAppeal);

  // F08 ボーナスは別枠（既に ×0.5 適用済み）、因縁系合計キャップを適用
  const f08Bonus = context.f08Bonus || 0; // F08イベント側から渡されるボーナス
  const feudSum = Math.min(feudCore + f08Bonus, FACTION_CONFIG.feudSumCap);
  // ▲▲▲ ここまで追加 ▲▲▲

  // ... 後続処理（titleBonus, fanExpectBonus 等） ...

  // 計算式変更: rivalryAppeal の代わりに feudSum を使う
  const totalAppeal = avgDraw + parityBonus + feudSum + titleBonus + fanExpectBonus + heelFaceBonus + clashAppeal + firstMeetBonus + stalePenalty;
  return totalAppeal;
}
```

**注意**:
- 既存 `calcMatchAppealBreakdown`（L840）も同様に修正する必要あり
- 既存テストで rivalryAppeal の値を見ている箇所があれば、feudCore または feudSum を出力するよう変更

#### 7-4. 試合結果の対立度・勢い反映

`applyMatchResult(state, fighterIdA, fighterIdB, result)` を新設。以下で呼び出す:

- 既存の finalizeShow / finalizeWar / finalizePPV / AI tickWeek の4パス
- 既存の `Engine.relationships.applyMatchResult` 呼び出しの**直後**に追加

内部処理:
- 両選手が別派閥のリーダー/幹部か判定
- リーダー同士なら `momentumLeaderBonus` の範囲で変動（勝者+、敗者-）
- 幹部級（リーダー含む）同士なら `momentumSeniorBonus` の範囲で変動
- 末端同士なら変動なし
- 対立度も同時に更新（spec §4.2）

---

### Task 8: tickWeek 統合（30分）

`src/management.js` の tickWeek L7416 周辺を修正:

```javascript
// Phase 1: 人間関係 週次減衰処理（既存）
if (s.relationships && Object.keys(s.relationships).length > 0) {
  // ... 既存処理 ...
}

// ▼▼▼ 追加: 派閥処理 ▼▼▼
if (s.factions !== undefined) { // マイグレーション済みなら必ず配列
  const facRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xFA0B));

  // 1. 発生条件チェック（Phase 1 は静かに生成、Phase 3 でイベント化）
  const loyalCheck = Engine.factions.checkLoyalFormationConditions(s);
  if (loyalCheck.eligible) {
    // Phase 1: 確率無視で即生成（auto-sim でライフサイクルを検証するため）
    // Phase 3 で §8.2 の60%判定に差し替える
    s = Engine.factions.createFaction(s, loyalCheck.leaderId, [loyalCheck.leaderId, ...loyalCheck.followerIds]);
  }
  // 対立型も同様にチェック

  // 2. メンバー変動
  s = Engine.factions.processWeeklyMemberChanges(s, facRng);

  // 3. 対立度・勢い週次減衰
  s = Engine.factions.processWeeklyHostilityDecay(s);
  s = Engine.factions.processWeeklyMomentumDecay(s);

  // 4. 消滅・解散チェック
  s = Engine.factions.checkDissolutionConditions(s);
}
// ▲▲▲ ここまで追加 ▲▲▲

// Phase 5: ライバル称号 週次判定（既存）
```

---

### Task 9: validateGameState の拡張（20分）

`Engine.validateGameState(G)` に以下のチェックを追加:

- `factions` は配列であること
- 各 faction について:
  - `memberIds` は3人以上（2人以下は消滅すべき）
  - `leaderId` は `memberIds` に含まれる
  - `momentum` は -100〜+100 の範囲
  - 同じ選手が複数の派閥に所属していない（排他）
- `factionHostility` は object で、各値は 0〜100
- `factionHostility` のキーで参照されるfactionIdが全て`factions`に存在する

違反時は既存の `[WM Debug]` 形式でログ出力、G.debugLog に記録。

---

### Task 10: auto-sim 検証（30分）

以下のコマンドで検証:

```bash
# 5シード × 20シーズン（通常のフック自動実行と同等）
for i in 1 2 3 4 5; do node test/auto-sim.js 20 $((i * 7919)); done

# 大規模: 100シード × 100シーズン
for i in $(seq 1 100); do node test/auto-sim.js 100 $((i * 7919)); done | grep "Result:"
```

期待結果:
- validations: 0 violations
- errors: 0
- gameOvers: 0
- すべて ALL CLEAR

もし違反が出たら、その場で修正。特に以下のパターンに注意:
- 派閥メンバー数が3を割ったのに消滅していない
- 同じ選手が複数派閥に所属
- 対立度が範囲外
- リーダーが memberIds に入っていない

---

## 完了時のチェックリスト

### 機能
- [ ] マイグレーション `_migrated_factions_v1` が動作し、既存セーブをロードできる
- [ ] 新規ゲーム開始 → 10人超のロスターで10〜30週以内に派閥が発生する
- [ ] 派閥メンバー数が3未満になると自動消滅する
- [ ] 1派閥がロスター80%超で派閥制度が解散する
- [ ] リーダー退団/引退で F03 が発動、OVR比率で分岐が正しく動く
- [ ] 対立度・勢いが週次で正しく変動する（コンソールログで確認可能）
- [ ] 派閥抗争マッチで appeal が正しく加算される（排他＋キャップ適用）
- [ ] 既存のタイトル戦・因縁カード・ファン期待の集客計算に影響なし

### 品質
- [ ] `src/factions.js` のすべての関数が純粋関数（DOMに触れない）
- [ ] 乱数は Engine.rng.derive 経由でシード管理されている
- [ ] validateGameState で派閥データの整合性がチェックされる
- [ ] auto-sim 100シーズン × 5シード ALL CLEAR
- [ ] auto-sim 100シード × 100シーズン（10,000シーズン）ALL CLEAR

### 影響確認（非変更）
- [ ] 既存の relationships.js の関数シグネチャ・出力が変わっていない
- [ ] 既存の trust 変動式に変更なし
- [ ] 既存の calcMatchAppeal のテストが通る（rivalryAppeal 単体の挙動は変わるが、因縁のない試合のappealは同値）

---

## 完了報告時に Keisuke に伝えること

実装完了時、以下を報告:

1. **auto-sim 結果**: 5×20 と 100×100 の両方
2. **派閥発生確認**: どのシードで派閥が何週目に発生したか（サンプル3つ）
3. **F03 発動確認**: リーダー退団時の分岐が3パターン（継承 / 動揺 / 解散）すべて観測されたか
4. **派閥抗争appeal**: 実際にどのくらいの試合で発動したか、appeal加算の分布
5. **既存バランスへの影響**: 派閥抗争なしの普通の試合のappeal値が変わっていないことを確認

---

## specs/ の更新フロー

実装完了後、以下を実行:

1. `specs/faction-system-spec-v0.1.md` の末尾に「実装状況 (YYYY-MM-DD)」セクションを追加、Phase 1 実装内容を記録
2. spec §15 オープン項目のうち、Phase 1 で解決したものを削除または解消済みマーク
3. spec の差分を Keisuke に確認してもらう
4. 承認後、この指示書（plans/faction-phase1-task.md）を `plans/archive/` に移動

---

## やらないことリスト（重要）

- ❌ UI 層の実装（Phase 2 の範囲）
- ❌ F01/F02/F04〜F08 のイベントモーダル・セリフ（Phase 3/4）
- ❌ F03 のセリフ演出（内部処理のみ、セリフは Phase 3）
- ❌ 既存 MATCH_APPEAL_CONFIG の数値変更
- ❌ 既存 Bond/Rivalry/Trust のロジック変更
- ❌ 既存 calcMatchAppeal の既存加算要素（title, fanExpect, heelFace, clash, firstMeet）の変更

Phase 1 はバックエンドの土台を作る段階。UI なしでも数値が正しく動くことが最優先。
