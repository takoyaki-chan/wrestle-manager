# 他団体戦 Bond/Rivalry リバランス — Claude Code 実装ハンドオフ

**ファイル**: `plans/cross-org-relationship-rebalance-task.md`
**作成日**: 2026-04-26
**対象**: Claude Code
**担当モデル推奨**: Opus（数値設計＋auto-sim 検証込みのため、慎重な判断が必要）
**仕様書正本**: `specs/relationship-system-spec-v2.1.md` §4.4 / §7.3 / §8.2

---

## 1. このタスクで何をやるか

他団体戦（クロスOrg試合）の関係値変動を再設計し、「敵対」「好敵手」「単なる対戦相手」の三層に二極化させる。現状は rivalry のみ ×2.0 倍率がかかり、bond は同団体戦と同扱いだったため、**他団体の希少接触で関係性が動かない問題**を解消する。

### 必ず最初に読むドキュメント

順番に読んでから実装に入ること:

1. **`CLAUDE.md`**（プロジェクト全体ルール、特に「数値哲学」「機能追加の判断基準」）
2. **`specs/relationship-system-spec-v2.1.md`** の §4.4（クロスOrg特例ルール）/ §7.3（決着の閾値）/ §8.2（逓減カウンタキー）
3. **`docs/game-system-roadmap.md`** の「他団体戦 Bond/Rivalry リバランス」セクション（背景・期待分布）
4. **`src/relationships.js`** L1336-1662（`applyMatchResult` 全体）— 既存実装の構造を把握

### スコープ

| 対象 | 内容 |
|------|------|
| ファイル①（必須） | `src/relationships.js`（`applyMatchResult` 内のクロスOrg分岐拡張） |
| ファイル②（条件付き） | `src/management.js`（`Engine.title.checkResolution` 内、matches 閾値の追加） |
| 仕様書 | `specs/relationship-system-spec-v2.1.md` は既に作成済み。コードに合わせて微調整があれば反映 |

### スコープ外

- 他団体接触機会の追加施策（メディア共演 / スカウト競合rivalry付与等）— 第二弾、本タスクでは扱わない
- 同団体戦の関係値計算 — 既存ロジックを一切変更しない（クロスOrg分岐限定）
- E-01 / E-03 のチームメイト bond 波及 — 本タスクのスコープ外（既存ロジック維持）
- UI表示の変更（bond/rivalry数値の見せ方）— 本タスクでは扱わない

---

## 2. 全体の進め方と停止ルール

### 2-1 Phase 進行

**Phase 1 → 2 → 3 の順で実装する**。Phase 完了時に Keisuke さんに報告して確認を取ってから次へ進む。

| Phase | 内容 | 想定規模 |
|-------|------|:------:|
| 1 | クロスOrg基本Bond税 + Bond方向別乗数（§4.4.2 / §4.4.3） | 中 |
| 2 | M-CO1 好敵手認定 + M-CO2 抗争和解 + 逓減カウンタキー分離（§4.4.4 / §4.4.5 / §8.2） | 中 |
| 3 | M-10決着 matches閾値の追加・クロスOrg緩和（§7.3） + auto-sim検証 | 中〜大 |

### 2-2 いつ途中で止まるか

- **Phase 完了時**（必ず報告、auto-sim 結果と分布計測値を併記）
- **既存の同団体戦の関係値計算に副作用が出た場合**（auto-sim で同団体ペア分布に有意な変化）
- **`Engine.title.checkResolution` の matches 閾値追加が、既存セーブの因縁決着挙動を壊しそうな場合**（マイグレーション設計の議論が必要）
- **想定外の連動箇所が見つかった場合**（タッグマッチの applyTagMatchResult、E-03 等）

### 2-3 Phase ごとの完了定義

- 仕様書 `relationship-system-spec-v2.1.md` の該当節の挙動と一致
- auto-sim 100シーズン（10seed × 10season）が `ALL CLEAR`（違反0/エラー0/ゲームオーバー0）
- 期待分布（敵対50% / 単なる対戦相手25% / 好敵手15% / その他10%）に対し、各層 ±15% 以内に収まる
- 同団体ペア分布が v2.0 比で大きく変動していない（±5pt 以内）
- ローカルコミット済み（`push は絶対にしない` — CLAUDE.md 準拠）

---

## 3. 事前準備

### 3-1 ブランチ作成

```bash
git checkout -b feature/cross-org-relationship-rebalance
```

### 3-2 計測スクリプトの準備（Phase 0）

auto-sim 100シーズン後、以下を集計するスクリプトを `test/cross-org-distribution.js` として作成（既存の `test/auto-sim.js` を流用）:

**集計内容**:
- 全クロスOrgペア（charOrgMap で異なる org に属するペア）の最終 bond/rivalry を抽出
- bond帯 × rivalry帯のクロス集計（25マスのヒートマップ）
- 「敵対」「単なる対戦相手」「好敵手」の3カテゴリに振り分けた割合

**実行**: `node test/cross-org-distribution.js --seeds=42,43,44,45,46,47,48,49,50,51 --seasons=10`

このスクリプトは v2.0 状態（変更前）で1回実行し、ベースライン分布を記録してから Phase 1 に進む。

---

## 4. Phase 1: 基本Bond税 + 方向別乗数

### 4-1 実装内容（`src/relationships.js` `applyMatchResult`）

**現状（L1387-1392）**:
```javascript
// 他団体戦: rivalry変動を×2.0ブースト
const rivalryMult = isCrossOrg ? 2.0 : 1.0;

rel.bond = this._applyAxisDelta(rel.bond, roll(bondMin, bondMax) * mult, 'bond');
rel.rivalry = this._applyAxisDelta(rel.rivalry, roll(rivalryMin, rivalryMax) * mult * rivalryMult, 'rivalry');
```

**変更後**:
```javascript
// 他団体戦: rivalry変動を×2.0ブースト、bondは方向別乗数
const rivalryMult = isCrossOrg ? 2.0 : 1.0;

const rawBondDelta = roll(bondMin, bondMax) * mult;
// クロスOrg時、bondDelta < 0 の場合に ×1.5 加速（M-CO1/M-CO2はこの apply() 経由しないので影響なし）
const bondMult = (isCrossOrg && rawBondDelta < 0 && !opts.skipCrossOrgBondMult) ? 1.5 : 1.0;
const finalBondDelta = rawBondDelta * bondMult;

rel.bond = this._applyAxisDelta(rel.bond, finalBondDelta, 'bond');
rel.rivalry = this._applyAxisDelta(rel.rivalry, roll(rivalryMin, rivalryMax) * mult * rivalryMult, 'rivalry');
```

`apply()` の関数シグネチャに `opts = {}` を追加（後方互換性維持、既存呼び出しは引数省略でOK）。

### 4-2 基本Bond税の追加

**位置**: M-events ループの **直前**（rivalryStartAB/BA 設定の直後、L1366付近）

```javascript
// ── §4.4.2 クロスOrg基本Bond税: 両方向に bond -2〜-5 を加算 ──
if (isCrossOrg) {
  const taxRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season || 1, state.week || 1, charIdA, charIdB, 0xBE2D));
  const taxAB = -(2 + Engine.rng.float(taxRng) * 3); // -2 〜 -5
  const taxBA = -(2 + Engine.rng.float(taxRng) * 3);
  rAB.bond = this._applyAxisDelta(rAB.bond, taxAB, 'bond');
  rBA.bond = this._applyAxisDelta(rBA.bond, taxBA, 'bond');
}
```

**重要**:
- 基本税は §4.4.3 の方向別乗数の **対象外**（直接 `_applyAxisDelta` を呼ぶ）
- `skipCrossOrgBondMult` でも回避できるが、`apply()` を経由しないのが最もシンプル
- 専用RNGシード `0xBE2D` を使用（既存の M-events シード 0xBE2A〜0xBE2C と分離）

### 4-3 検証

```
auto-sim 100シーズン（10seed × 10season）を実行
test/cross-org-distribution.js でクロスOrgペア分布を集計
```

**期待挙動**:
- クロスOrgペアの bond 平均値が v2.0 比で **-5〜-12pt** 程度低下
- 「敵対」帯（bond <40 + rivalry 60+）の割合が **30%→45%** に増加
- 同団体ペアの分布は v2.0 比で **±2pt 以内**（理論上影響なし、検証で確認）

完了したら Phase 2 へ。

---

## 5. Phase 2: M-CO1 / M-CO2 + 逓減カウンタキー分離

### 5-1 M-CO1 好敵手認定（M-04 のクロスOrg分岐）

**現状（L1443-1447）**:
```javascript
// ═══ M-04: 名勝負（MQ80+） ═══
if (context.mq >= 80) {
  apply('AB', 'greatMatch', context.stage, 3, 6, 8, 12, true);
  apply('BA', 'greatMatch', context.stage, 3, 6, 8, 12, true);
}
```

**変更後**:
```javascript
// ═══ M-04 / M-CO1: 名勝負（MQ80+） ═══
if (context.mq >= 80) {
  if (isCrossOrg) {
    // M-CO1 好敵手認定: bond +6〜+10（固定値、方向別乗数の対象外）
    // 逓減カウンタは別キー 'greatMatch:cross' で独立カウント
    apply('AB', 'greatMatch:cross', context.stage, 6, 10, 8, 12, true, { skipCrossOrgBondMult: true });
    apply('BA', 'greatMatch:cross', context.stage, 6, 10, 8, 12, true, { skipCrossOrgBondMult: true });
  } else {
    apply('AB', 'greatMatch', context.stage, 3, 6, 8, 12, true);
    apply('BA', 'greatMatch', context.stage, 3, 6, 8, 12, true);
  }
}
```

**逓減カウンタキー**: `greatMatch:cross` を新設し、同団体 `greatMatch` とは独立カウント（仕様書 §8.2）。

**注意**: `skipCrossOrgBondMult: true` を指定しているのは、bond +6〜+10 が正の値で乗数対象外（実害はないが意図を明示）。

### 5-2 M-CO2 抗争和解（M-10 のクロスOrg分岐）

**現状（L1487-1494）**:
```javascript
// ═══ M-10: 因縁決着 → rivalryリセット（0〜10）（M-14不成立時のみ）
if (context.rivalryResolved && !context._destinySettled) {
  const m10Reset = Engine.rng.float(rng) * 10;
  rAB.rivalry = this._clampAxisValue(m10Reset, 'rivalry');
  rBA.rivalry = this._clampAxisValue(m10Reset, 'rivalry');
  apply('AB', 'rivalryResolution', context.stage, 5, 10, 0, 0, false);
  apply('BA', 'rivalryResolution', context.stage, 5, 10, 0, 0, false);
}
```

**変更後**:
```javascript
// ═══ M-10 / M-CO2: 因縁決着 → rivalryリセット（M-14不成立時のみ）
if (context.rivalryResolved && !context._destinySettled) {
  const m10Reset = Engine.rng.float(rng) * 10;
  rAB.rivalry = this._clampAxisValue(m10Reset, 'rivalry');
  rBA.rivalry = this._clampAxisValue(m10Reset, 'rivalry');
  if (isCrossOrg) {
    // M-CO2 抗争和解: bond +12〜+20（固定値、方向別乗数の対象外）
    apply('AB', 'rivalryResolutionCross', context.stage, 12, 20, 0, 0, false, { skipCrossOrgBondMult: true });
    apply('BA', 'rivalryResolutionCross', context.stage, 12, 20, 0, 0, false, { skipCrossOrgBondMult: true });
  } else {
    apply('AB', 'rivalryResolution', context.stage, 5, 10, 0, 0, false);
    apply('BA', 'rivalryResolution', context.stage, 5, 10, 0, 0, false);
  }
}
```

### 5-3 検証

```
auto-sim 100シーズン → 分布集計
```

**期待挙動**:
- 「好敵手」帯（bond 60+ + rivalry 60+）の割合が **0%→10〜15%** に増加（v2.0では構造的にほぼ不可能）
- 同団体 M-04 / M-10 の挙動は**完全に維持**（逓減カウンタも分離したため副作用なし）

完了したら Phase 3 へ。

---

## 6. Phase 3: M-10決着 matches閾値の追加・クロスOrg緩和

### 6-1 現状確認

`src/management.js` `Engine.title.checkResolution`（L1394-1448）には **matches 閾値の明示的なガードが現状ない**。仕様書 v2.0 §7.3 では「対戦4+」が条件として記載されているが、実装は rivalry / MQ のみで判定している。

### 6-2 変更内容

`checkResolution` の冒頭、`pairState.minRivalry < 60` チェックの **直前** に matches ガードを追加:

```javascript
// matches 閾値: 同団体 4+、クロスOrg 3+（v2.1新設）
const matchesThreshold = pairState.isCrossOrg ? 3 : 4;
if ((pairState.matches || 0) < matchesThreshold) return null;
```

### 6-3 `pairState.isCrossOrg` の供給

`Engine.title.getRivalryPairState` の返却値に `isCrossOrg` を追加する必要がある。実装方法:

**Option A（推奨）**: `getRivalryPairState` の引数に id1/id2 が渡るので、state.roster および aiOrgs から所属 org を引いて `isCrossOrg` を計算
**Option B**: 呼び出し元（`finalizeShow` など）で context を別経由で渡す

Option A が侵襲性が低いので推奨。実装例:

```javascript
// management.js getRivalryPairState 内
const orgA = Engine.util.findOrgIdById(G, id1);
const orgB = Engine.util.findOrgIdById(G, id2);
const isCrossOrg = orgA && orgB && orgA !== orgB;

return {
  ...,
  matches: entry?.matches || 0,
  isCrossOrg,
};
```

`Engine.util.findOrgIdById` がなければ、roster / aiOrgs を走査するヘルパーを新設（既存の charOrgMap ロジックを参考）。

### 6-4 既存セーブとの互換性

- 既に rivalry 60+ で対戦回数 0〜3 のペアがいる場合、本変更で「決着不成立」になり、結果として因縁が継続する
- これは**設計通り**（「対戦をもっと積まないと決着しない」という仕様の徹底）
- 本変更でゲームオーバーやデータ破損は発生しないため、マイグレーションは不要

ただし auto-sim 100シーズンで **既存セーブ互換性** を確認:
- v2.0 のセーブを v2.1 コードでロード → 異常終了しないこと
- v2.0 で決着済みのペア（resolutionCount > 0）はそのまま維持されること

### 6-5 最終検証

```
auto-sim 100シーズン（10seed × 10season）
test/cross-org-distribution.js で最終分布を集計
```

**目標分布**:

| 分布カテゴリ | 目標 | 許容範囲 |
|------------|:----:|:------:|
| 敵対（bond <40 + rivalry 60+） | 50% | ±15% |
| 単なる対戦相手（bond 40-59 + rivalry 40+） | 25% | ±10% |
| 好敵手（bond 60+ + rivalry 60+） | 15% | ±5%（最低10%は確保） |
| その他 | 10% | — |

**同団体ペアの分布変化**: v2.0 比で全帯 ±5pt 以内（理論上影響なし、確認のため計測）

**全体検証**:
- 違反0 / エラー0 / ゲームオーバー0 / 5300週完走
- 既存のテストケース（test/auto-sim.js）が全件パス

---

## 7. 実装上の注意

### 7-1 数値哲学（CLAUDE.md 準拠）

仕様書 v2.1 §4.4 に記載の数値（-2〜-5、×1.5、+6〜+10、+12〜+20、3+）は **すべて根拠が示されている**。これらの値を変更する必要が出てきた場合は、Keisuke さんに相談してから動かすこと。安易な調整（「キリのいい数字に丸める」「さらに強くする/弱くする」）は厳禁。

### 7-2 RNGシード分離

基本Bond税には専用シード `0xBE2D` を割り当てる（既存M-events 0xBE2A〜0xBE2C と分離）。これにより、同じ試合の M-events を変更しても基本税の値は影響を受けない（再現性確保）。

### 7-3 タッグマッチ

`applyTagMatchResult`（L1668〜）はクロスOrg特例の対象 **外**（同団体内タッグが大半のため）。ただし、もしタッグでもクロスOrgが発生する場合は将来検討。本タスクでは扱わない。

### 7-4 旧コードの保持

v2.0 の同団体ロジックは **完全に維持**。`if (isCrossOrg)` 分岐の外側は既存コードをそのまま残し、副作用を最小化する。

---

## 8. 完了時の報告フォーマット

```
## 他団体戦 Bond/Rivalry リバランス 実装完了報告

### 実装サマリ
- Phase 1（基本税 + 方向別乗数）: ✅
- Phase 2（M-CO1 / M-CO2）: ✅
- Phase 3（matches閾値）: ✅

### auto-sim 検証結果
- シード×シーズン: 10 × 10 = 100シーズン（5300週）
- 違反: 0 / エラー: 0 / ゲームオーバー: 0
- 同団体分布変化: ±Xpt 以内 ✅

### クロスOrgペア分布（最終）
| カテゴリ | 目標 | 実測 |
|---------|:---:|:---:|
| 敵対 | 50% | XX% |
| 単なる対戦相手 | 25% | XX% |
| 好敵手 | 15% | XX% |
| その他 | 10% | XX% |

### 変更ファイル
- src/relationships.js: applyMatchResult クロスOrg分岐拡張（XX行追加）
- src/management.js: checkResolution matches閾値追加 + getRivalryPairState 拡張（XX行追加）
- specs/relationship-system-spec-v2.1.md: 微調整があれば反映
- docs/game-system-roadmap.md: 完了マーク（前回エントリに移動）

### 残課題 / 次のステップ
- （あれば記載）
```

---

## 9. 補足: 既知のリスク

### 9-1 接触機会の少なさによる初期効果の遅さ

クロスOrg試合は **年1試合未満** であるため、Phase 3完了直後の auto-sim 1〜3シーズンでは効果が見えにくい。**最低5シーズン以上** 走らせて分布を見る必要がある。

### 9-2 M-CO2の発火頻度

クロスOrg + 因縁決着は条件が厳しい（rivalry 60+ + 対戦3+ + MQ50+）。発火率が極端に低い場合、好敵手15%枠の達成が難しい。**Phase 3完了後の分布計測で好敵手帯が10%未満なら、M-10閾値をさらに緩和する（rivalry 60+ → 50+ など）議論が必要**。

### 9-3 既存セーブの bond 値

v2.0 環境で長期プレイされた既存セーブを v2.1 でロードした場合、**過去のクロスOrg試合分の基本税は遡及適用されない**（試合発生時のみ適用）。これは設計通りで、新規のクロスOrg試合から徐々に分布が変化していく想定。

---

**指示書終わり**
