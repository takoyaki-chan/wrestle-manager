# 派閥システム Phase 1b 指示書（人数偏り修正 v0.2）

> **作成日**: 2026-04-23
> **前提コミット**: `4d79231 feat(faction): Phase 3d bond/rivalry 連動カタログ — 派閥 v1.0 完成`
> **ブランチ**: **新規作成推奨** `feature/faction-v0.2`（`feature/faction-system` から分岐）
> **参照 spec**: `specs/faction-system-spec-v0.1.md`（§2.2 / §2.6 / §17）
> **位置付け**: 派閥 v1.0 完成後の運用修正。課題1「人数偏り」への対応。課題2・3 は別指示書。

---

## ゴール

派閥 v1.0 運用中に判明した「1派閥へのメンバー集中（9〜10人規模）」を防ぐ。複数派閥の並立を構造的に促し、単独派閥が肥大化する前に第二派閥誕生・F05 分裂のいずれかが起こりやすい状態にする。

---

## 背景と問題

現 §2.2 メンバー加入には**人数によるブレーキが一切ない**:

- 加入条件は「既存メンバーとの bond 平均 60 以上」のみ
- 派閥が大きくなるほど「既存メンバー」の母集団が増え、平均 bond が安定して高く出やすい（逆説的に加入しやすくなる）
- Phase 3d の「派閥内結束 bond +0.15/週」効果により、派閥内の bond はさらに高止まりしやすい
- §2.6 の 80% 解散のみが唯一のブレーキ。ただしこれは「派閥が団体そのものと化した」状態で、物語上は手遅れ
- F05（派閥内亀裂）は忠誠型で bond が高止まりしている間は発火条件（リーダー bond < 35 の不満分子 ≥ 2）を満たしづらい

結果、単独派閥が 10 人規模まで膨れ上がり、抗争相手も生まれず停滞するケースが発生する。

---

## 判断事項（Keisuke さん承認済み 2026-04-23）

| 項目 | 決定 |
|------|------|
| 対策 | **案A（サイズ加入率減衰） + 案B（単独派閥の加入凍結）の併用** |
| 案C（F05 発火確率ブースト） | **今回は入れない**（上記2つで足りるか実測で判断、足りなければ次弾） |
| 凍結解除条件 | 「第二派閥誕生 / 当該派閥が F05 分裂 / 脱退で 4 人以下」の3つのいずれか |
| ブランチ運用 | `feature/faction-v0.2` 新規（v1.0 完成宣言後のため） |

---

## 仕様変更内容

### §2.2 メンバー加入 の改訂

#### 追加ルール 1: サイズベース加入率減衰

加入率判定時、派閥サイズ（加入前）に応じて以下の倍率を乗算する:

| 派閥サイズ（加入前） | サイズ倍率 |
|---|---|
| 3〜4 人 | ×1.0 |
| 5〜6 人 | ×0.6 |
| 7 人 | ×0.3 |
| 8 人以上 | ×0.0（実質ストップ） |

既存の勢い修正（`joinMomentumHighMult` / `joinMomentumLowMult`）の**後**に適用する。

#### 追加ルール 2: 単独派閥の加入凍結

派閥が **1 つしか存在せず、かつサイズが 5 人以上** の状態では、新規加入判定そのものをスキップする（凍結）。

**凍結解除条件**（以下のいずれかが成立した時点で次週以降の加入判定が再開される）:

1. 第二派閥が誕生する（F01 再発火 / F02 / F05-B 分裂のいずれか）
2. 当該派閥が F05-B で分裂する（これも上記 1 の一種）
3. メンバー脱退（§2.3 bond 低下離脱 / F04 寝返りなど）でサイズが 4 人以下に戻る

**実装上の注意**: 凍結判定は「派閥数 === 1 かつ そのサイズ ≥ 5」をループ先頭で見るだけでよい。状態フラグは持たない（毎週条件評価するだけ）。

### §2.6 派閥制度の解散 は変更なし

80% 解散条件はそのまま残す（案A・Bですり抜けた場合の最終セーフティネットとして）。

---

## FACTION_CONFIG 追加値

`src/data.js` の `FACTION_CONFIG` 末尾、`// §2.2 加入判定` ブロック付近に追記:

```js
// §2.2 加入判定（v0.2 追加）
joinSizeMult: { 4: 1.0, 6: 0.6, 7: 0.3, 8: 0.0 },  // 派閥サイズ→加入率倍率（キーは「以下」の閾値、例: size<=4→×1.0, size<=6→×0.6, size=7→×0.3, size>=8→×0.0）
soloFactionFreezeSize: 5,  // 単独派閥がこのサイズ以上なら加入凍結
```

**マップの解釈ルール**: `joinSizeMult` のキーは「このサイズ以下なら倍率を適用」の上限値。昇順にチェックして最初にマッチしたキーの倍率を返す。8 人以上は 0.0 固定。

---

## 実装場所

`src/factions.js:361` `processWeeklyMemberChanges` 関数内、加入判定ブロック（370-393 行）のみ修正。**離脱判定や trust 更新ロジックは触らない**。

### 修正箇所の差分イメージ

```js
// ── 加入判定 ──
const newFactions = s.factions.map(f => ({ ...f, memberIds: [...f.memberIds] }));

// v0.2: 単独派閥の加入凍結判定
const soloFreeze = newFactions.length === 1
  && newFactions[0].memberIds.length >= cfg.soloFactionFreezeSize;

for (const f of newFactions) {
  if (soloFreeze) continue;  // v0.2: 単独派閥凍結時はスキップ

  const candidates = [...rosterIds].filter(id => !assigned.has(id));
  for (const candId of candidates) {
    if (f.memberIds.includes(candId)) continue;
    const avg = this._avgBond(s, candId, f.memberIds);
    if (avg < cfg.joinBondThreshold) continue;
    let rate;
    if (avg >= 80) rate = cfg.joinRate[80];
    else if (avg >= 70) rate = cfg.joinRate[70];
    else rate = cfg.joinRate[60];
    if (this._isHostile(f)) {
      if (f.momentum > 30) rate *= cfg.joinMomentumHighMult;
      else if (f.momentum < -30) rate *= cfg.joinMomentumLowMult;
    }
    // v0.2: サイズ倍率適用
    rate *= this._getJoinSizeMult(f.memberIds.length);

    if (Engine.rng.float(rng) < rate) {
      f.memberIds.push(candId);
      assigned.add(candId);
      const name = (s.roster || []).find(c => c.id === candId)?.name || `#${candId}`;
      if (typeof console !== 'undefined') console.log(`[WM Faction] ${name} joined ${f.name}`);
    }
  }
}
```

### 新ヘルパ

`_getJoinSizeMult(size)` を `_isHostile` の近くに追加:

```js
_getJoinSizeMult(size) {
  const cfg = FACTION_CONFIG;
  const thresholds = Object.keys(cfg.joinSizeMult)
    .map(Number)
    .sort((a, b) => a - b);
  for (const t of thresholds) {
    if (size <= t) return cfg.joinSizeMult[t];
  }
  return 0.0;  // 最大閾値を超えたら加入率0
},
```

---

## 触らない場所

- `Engine.factions` の既存関数シグネチャ
- 離脱判定ブロック（`processWeeklyMemberChanges` 395 行以降）
- `checkDissolutionConditions`（§2.6）
- F05-B 分裂ロジック（自然と凍結解除のトリガーになる）
- RNG シード値
- 既存の `FACTION_CONFIG` 値（`joinRate`、`joinBondThreshold` など）
- Phase 3d の `processFactionInfluenceOnRelationships`
- `calcMatchAppeal` の factionAppeal 分岐
- すべての UI コード

---

## 実装手順

### Step 1: FACTION_CONFIG 追記
`src/data.js` の `FACTION_CONFIG` に `joinSizeMult` と `soloFactionFreezeSize` を追加。

### Step 2: ヘルパ関数追加
`src/factions.js` の `_isHostile` 近辺に `_getJoinSizeMult(size)` を追加。

### Step 3: 加入判定ロジック修正
`processWeeklyMemberChanges` の加入判定ブロック（370-393 行）を上記差分イメージ通りに修正。

### Step 4: auto-sim 100×100 検証
```bash
for i in $(seq 1 100); do node test/auto-sim.js 100 $((i * 7919)); done | grep "Result:"
```
ALL CLEAR になることを確認。

### Step 5: 派閥サイズ分布の実測
auto-sim を長期（200 週）で回し、以下を確認:

- **派閥サイズ 8 人超 の発生頻度** が v0.7（現状）比で**半減以下**
- **平均派閥数** が v0.7 比で**増加**（単独派閥凍結により第二派閥誕生の余地が生まれるため）
- **派閥制度解散（§2.6 80%）の発生頻度** が v0.7 比で**減少**

簡易計測スクリプトは `test/auto-sim.js` の既存ループに以下を足す:

```js
// 既存のシーズン末サマリー付近に挿入
const maxFactionSize = Math.max(0, ...(s.factions || []).map(f => f.memberIds.length));
const factionCount = (s.factions || []).length;
if (!stats.factionSizeHistogram) stats.factionSizeHistogram = {};
stats.factionSizeHistogram[maxFactionSize] = (stats.factionSizeHistogram[maxFactionSize] || 0) + 1;
```

### Step 6: 分布が想定内なら spec 反映
- `specs/faction-system-spec-v0.1.md` §2.2 を v0.2 仕様に書き換え
- §17 に Phase 1b 完了エントリ追加（v0.8 として）
- バージョン表記を v0.7 → v0.8 に

### Step 7: レビュー
Keisuke さんに auto-sim 結果 + 派閥サイズ分布サンプルを提示。

### Step 8: 完了処理
- `docs/game-system-roadmap.md` 更新
- `git commit`（push しない）
- 課題1 完了宣言

---

## 検証成功基準

### auto-sim 整合性（必須）
- 100×100 で ALL CLEAR（既存検証が壊れていない）

### 派閥サイズ分布（必須）
| 指標 | v0.7 比 |
|---|---|
| 最大派閥サイズ ≥ 8 の週の比率 | **50% 以上減少** |
| 派閥数 2 以上の週の比率 | **20% 以上増加** |
| §2.6 80% 解散の発生回数 | **40% 以上減少** |

### 副作用チェック（確認）
- 派閥発生率（F01 / F02）が v0.7 と大きく変わらない
- 派閥の平均寿命が v0.7 と大きく変わらない
- 非派閥選手の bond / rivalry 分布が v0.7 と大きく変わらない

目標未達なら `joinSizeMult` の値を調整（例: 5〜6 人を ×0.6 → ×0.4 へ）、または `soloFactionFreezeSize` を 5 → 4 に下げる。調整は Keisuke さん確認の上で。

---

## 事前に読むべきファイル

1. `CLAUDE.md`（数値哲学「安易な加減算 NG」）
2. `specs/faction-system-spec-v0.1.md` §2.2 / §2.6 / §17
3. `src/factions.js`
   - `processWeeklyMemberChanges`（361 行〜）
   - `_isHostile`
   - `_avgBond`
4. `src/data.js` の `FACTION_CONFIG`（1350 行〜）
5. `test/auto-sim.js`（検証パイプライン）
6. `plans/faction-phase3d-task.md`（1つ前のタスクファイル、書式参考）

---

## 完了定義

- [ ] `FACTION_CONFIG.joinSizeMult` / `soloFactionFreezeSize` 追加
- [ ] `_getJoinSizeMult` ヘルパ追加
- [ ] `processWeeklyMemberChanges` 加入判定にサイズ倍率 + 単独凍結を組込
- [ ] auto-sim 100×100 ALL CLEAR
- [ ] 派閥サイズ分布 3 指標が成功基準を満たす
- [ ] 副作用チェック 3 項目が v0.7 比で大きく変わらない
- [ ] `specs/faction-system-spec-v0.1.md` §2.2 を v0.2 仕様に改訂（v0.8 表記）
- [ ] §17 に Phase 1b 完了エントリ追加
- [ ] `docs/game-system-roadmap.md` 更新
- [ ] ローカルコミット（`feature/faction-v0.2` ブランチ）

---

## 次のフェーズへの接続

完了後の次タスク（別指示書）:

1. **Phase 1c（予定）**: ブッキング制約機構 + 🎭 派閥優先ボタン
2. **Phase 1d（予定）**: 課題3（F09 派閥対抗戦 + 抗争ポイント制）
3. **Phase 1e（予定）**: 課題2（F07-A 呑みペナルティ：メイン 8 週拘束 + メディア露出手配書義務）

Phase 1b 完了時の実測データが Phase 1d のポイント制閾値調整（現案 130pt / 規模倍率）の根拠資料になる。
