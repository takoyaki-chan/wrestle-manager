# 🧭 相性軸システム仕様書 v1.0

> **ステータス**: 🟡 ドラフト（Keisuke 承認済み・実装前）
> **作成日**: 2026-04-28
> **依存**: relationship-system-spec-v2.1.md（§3.2 / §3.4 / §3.5 を改訂）/ character-data-spec-v1.7.md
> **追加実装箇所**: src/relationships.js（initialize / processWeeklyDecay 改訂）/ src/data.js（character data に `affinityAxis` 追加、設計ペア指定）/ src/management.js（キャラ生成時のフック）
> **🔧マーク = 調整可能パラメータ**

---

## 概要

bond分布の構造的問題を解決する。100シーズン分布分析（seed=12345, 2026-04-28）で確認された現象：

| 指標 | 実測値 | 問題 |
|------|--------|------|
| 普通帯（40-59）占有率 | **99.50%** | ほぼ全ペアが普通帯に圧縮 |
| 帯シフト指標 `|bond-50|` 平均 | **2.70** | 事件影響が即座に回帰圧で消される |
| 同団体 bond max | **68.3** | 100シーズン回しても「深い絆」帯（80+）到達者ゼロ |
| 嫌悪帯（<20）占有率 | **0.00%** | 「不仲」自体が発生しない |

これは v2.1 §3.2 の **強い回帰圧 + 同団体ボーナス60天井** が作る構造的限界。

本仕様は **(1) キャラ固有の360°相性軸** と **(2) 回帰圧緩和** の両輪で、bond分布を健全化する。

### 目標値（auto-sim 100シーズン）

| 指標 | 現状 | 目標 |
|------|------|------|
| 帯シフト指標 | 2.70 | **8〜12** 🔧 |
| 嫌悪帯占有率 | 0.00% | **3〜8%** 🔧 |
| 苦手帯占有率 | 0.42% | **15〜25%** 🔧 |
| 普通帯占有率 | 99.50% | **45〜60%** 🔧 |
| 好意帯占有率 | 0.08% | **15〜20%** 🔧 |
| 深い絆帯占有率 | 0.00% | **3〜8%** 🔧 |

「**多くは普通、しかし両極が確実に存在する分布**」を目指す。

---

## §1 設計原則

1. **キャラ固有値** — 相性軸はキャラ生成時に1回決まり、引退まで変わらない。性格・血液型と同じ次元の固定属性
2. **ペア距離が作用** — A と B の角度差（最大180°）が bond 標的をシフトさせる
3. **完全に対称** — A→B の距離 = B→A の距離。非対称な感情は bond/rivalry 側が担当
4. **接触依存** — 接触してなければ作用しない（v2.1 §3.1 と同じ流儀）
5. **完全非可視** — プレイヤーには軸の値も距離も見せない。bond の振る舞いから観察するのみ
6. **性格摩擦と共存** — 「型と型」の摩擦（性格摩擦）と「個と個」の化学反応（相性軸）は加算で同居

### CLAUDE.md との関係

- 「**数字はドラマの裏で動くもの**」原則と整合：軸は完全に見えず、結果のみ観察される
- 「**スプレッドシートゲーム化を避ける**」原則と整合：可視化しないことで最適化ゲームを回避
- 「**安易な数値加減算で物事を処理しない**」原則と整合：各ペアの bond は固有の標的に向かって動く（個性のある引力場）

---

## §2 データモデル

### §2.1 キャラ属性

```javascript
character.affinityAxis = 0..359  // 整数（°）
```

- 値域: 0〜359 の整数
- 0° と 359° は隣接（円環）

### §2.2 ペア距離

```javascript
function affinityDistance(axisA, axisB) {
  const diff = Math.abs(axisA - axisB);
  return Math.min(diff, 360 - diff);  // 0〜180
}
```

- 0°: 完全に近い（個性的相性◎）
- 90°: 中立
- 180°: 完全に遠い（個性的相性✕）

### §2.3 設計ペア指定（character data）

`src/data.js` の各キャラデータに以下のいずれかを記述：

```javascript
// パターン A: 通常ランダム（指定なし or 'auto'）
{ id: 'tachibana', name: '橘 美咲', affinityAxis: 'auto' }

// パターン B: 設計上の相棒キャラ
{
  id: 'ikoma',
  name: '生駒 葵',
  affinityAxis: { pairedWith: 'tachibana', maxOffsetDeg: 30 }
}
```

- パターンA: 0-359 から一様ランダム
- パターンB: `pairedWith` で指定したキャラの軸値を取得し、`±maxOffsetDeg` の範囲で抽選
  - 既に `pairedWith` キャラの軸が決まっていない場合は警告を出してパターンA で生成（ロード順事故への保険）

`maxOffsetDeg` の推奨値：
- **30°**: 強い相棒関係（橘×生駒のような既定ペア向け）
- **60°**: 緩い相棒関係（同期生など）

---

## §3 初期化

### §3.1 新規ゲーム時

`Engine.relationships.initialize` の冒頭で全キャラの軸を割り当てる：

```javascript
const rng = Engine.rng.create(seed ^ 0xBE90);

// パスA: パターンB（設計ペア）以外を先に生成
for (const c of allChars) {
  if (typeof c.affinityAxis === 'object' && c.affinityAxis.pairedWith) continue;
  c.affinityAxis = Math.floor(Engine.rng.float(rng) * 360);
}

// パスB: 設計ペアを後から生成（パートナーの軸が決まっている前提）
for (const c of allChars) {
  if (typeof c.affinityAxis !== 'object') continue;
  const partner = allChars.find(p => p.id === c.affinityAxis.pairedWith);
  if (!partner || typeof partner.affinityAxis !== 'number') {
    // 警告: パートナーの軸が決まっていない
    c.affinityAxis = Math.floor(Engine.rng.float(rng) * 360);
    continue;
  }
  const offset = Math.floor((Engine.rng.float(rng) * 2 - 1) * c.affinityAxis.maxOffsetDeg);
  c.affinityAxis = ((partner.affinityAxis + offset) % 360 + 360) % 360;
}
```

### §3.2 既存セーブ（マイグレーション）

ロード時、`character.affinityAxis` が未定義のキャラに対してランダム値を後付けする：

```javascript
function migrateAffinityAxis(state) {
  if (state._migrated_affinity_v1) return state;
  const rng = Engine.rng.create(state.rngSeed ^ 0xBE90);
  for (const c of state.roster) {
    if (typeof c.affinityAxis !== 'number') {
      c.affinityAxis = Math.floor(Engine.rng.float(rng) * 360);
    }
  }
  for (const orgId of Object.keys(state.aiOrgs || {})) {
    for (const c of state.aiOrgs[orgId].roster || []) {
      if (typeof c.affinityAxis !== 'number') {
        c.affinityAxis = Math.floor(Engine.rng.float(rng) * 360);
      }
    }
  }
  // 引退者プール
  for (const c of state.retiredFighters || []) {
    if (typeof c.affinityAxis !== 'number') {
      c.affinityAxis = Math.floor(Engine.rng.float(rng) * 360);
    }
  }
  state._migrated_affinity_v1 = true;
  return state;
}
```

注意: 既存セーブの場合、character data 側の設計ペア指定（パターンB）は無視される。本マイグレーションは**等価ランダム置換**のみを行う。設計ペアは新規ゲームでのみ機能する。

---

## §4 作用：bond 標的シフト

### §4.1 標的計算

```javascript
function affinityTarget(distance) {
  // d=0  → +10 (target 60)
  // d=90 → ±0 (target 50)
  // d=180 → -10 (target 40)
  return 50 + 10 * Math.cos(distance * Math.PI / 180);
}
```

🔧 振幅は ±10。検証結果次第で ±15 まで強める可能性あり。

### §4.2 接触中の bond 動作（§5 改訂と統合）

接触中の bond ドリフトは「標的に向かって戻る」動作。標的が affinity で動かされたぶん、自然と居場所が個別化される。

例:
- 距離 30° のペア: 標的 58.7 → bond は 58.7 周辺をうろつく
- 距離 150° のペア: 標的 41.3 → bond は 41.3 周辺をうろつく

### §4.3 接触なしのペア

接触なしペアは bond を凍結（v2.1 §3.3 を維持）。相性軸の作用も停止。「**関わらなければ影響なし**」原則の徹底。

---

## §5 v2.1 §3.2 改訂：回帰圧緩和

bond 分布が普通帯に圧縮される構造的原因（強い回帰圧）を緩和する。**標的シフト単独では足りない**ので、同時改訂が必要。

### §5.1 bondPull 半減

**現状（v2.1 §3.2）**:
```javascript
const bondPull = 0.18 + Engine.rng.float(rng) * 0.12 +
                  Math.max(0, Math.abs(bond - 50) - 20) * 0.01;
```

**改訂後**:
```javascript
const target = affinityTarget(affinityDistance(charA.affinityAxis, charB.affinityAxis));
const bondPull = 0.08 + Engine.rng.float(rng) * 0.06;  // 🔧 0.18+0.12 → 0.08+0.06（半減）
// 加速項撤廃: max(0, |bond-target|-20)*0.01 を削除
if (bond > target) bond -= bondPull;
else if (bond < target) bond += bondPull;
```

#### 変更点
1. **基準値 0.18 → 0.08**（約半減）
2. **乱数幅 0.12 → 0.06**（半減）
3. **加速項を撤廃**（離れたら離れっぱなし）
4. **回帰先を 50 から `target` に変更**

### §5.2 同団体ボーナス引き下げ

**現状（v2.1 §3.2）**:
```javascript
if (sameOrg && bond < 60) {
  const orgBondGain = 0.2 + Engine.rng.float(rng) * 0.3;  // +0.2〜+0.5
  const ceiling = bond < 55 ? 1.0 : Math.max(0, (60 - bond) / 5);
  bond = applyAxisDelta(bond, orgBondGain * ceiling, 'bond');
}
```

**改訂後**:
```javascript
if (sameOrg && bond < 60) {
  const orgBondGain = 0.1 + Engine.rng.float(rng) * 0.15;  // 🔧 半減: +0.1〜+0.25
  const ceiling = bond < 55 ? 1.0 : Math.max(0, (60 - bond) / 5);
  bond = applyAxisDelta(bond, orgBondGain * ceiling, 'bond');
}
```

#### 改訂理由
- 同団体ボーナスは「特定方向に押す力」で、回帰圧の一部
- これも半減する。ただし完全には消さない（同団体感は残す）

### §5.3 性格摩擦（v2.1 §3.4）— 据え置き

```javascript
if (sameOrg && pAdj + aAdj <= -3) {
  bond -= 0.15;  // 据え置き
}
```

性格摩擦は「型と型」の摩擦で、相性軸（個と個）と独立。両者が加算で同居する。

### §5.4 世代近接ボーナス（v2.1 §3.5）— 据え置き

```javascript
if (sameOrg && Math.abs(ageA - ageB) <= 3) {
  bond = applyAxisDelta(bond, 0.1, 'bond');  // 据え置き
}
```

---

## §6 期待される動的挙動

### §6.1 標的シフト + 回帰圧緩和の合成効果

| 距離 | 標的 | 同団体接触ありペアで予想される定常 bond |
|------|------|-----------------------------------------|
| 0° | 60 | 58〜65（事件で押し上がりやすく、戻りにくい）|
| 60° | 55 | 53〜58 |
| 120° | 45 | 38〜48 |
| 180° | 40 | 32〜45（性格摩擦も該当する場合さらに -7pt）|

### §6.2 帯シフト指標の見積もり

距離は 0〜180° で一様分布なので、`E[|target - 50|] = E[|10 cos(d * π/180)|]` ≈ 6.4

bond は標的周辺で揺らぐので、最終的な `E[|bond - 50|]` は **6〜10程度** を期待。

回帰圧緩和でイベント影響が残りやすくなる効果を加えて、**目標 8〜12** に到達する見込み。

### §6.3 「設計ペア」の挙動

橘×生駒（距離 0〜30°）の場合:
- 標的 58.7〜60
- 同団体在籍中なら bond 60+ 帯で安定
- 引退・退団でも frozen 直前の値（60+）で凍結
- 結果として「**再現性のある相棒関係**」が成立

---

## §7 設計ペア候補（character data 側で指定）

実装時に Keisuke と相談して決めるが、初期想定の候補:

| ペア | 関係性 | maxOffsetDeg |
|------|--------|:------------:|
| 橘×生駒 | 相棒 | 30° |
| （その他、Keisuke が指定する設計上の関係性ペア）| | 30°〜60° |

ペア指定は character-data-spec-v1.7.md の改訂を伴う（仕様外）。実装時には：
1. 全キャラを通常ランダム（'auto'）で初期化する
2. 設計ペアの一方だけ `pairedWith` 指定に変える（双方向同時指定は冗長なので片方のみ）

---

## §8 既存仕様との関係

### §8.1 v2.1 § との対応

| v2.1 セクション | 本仕様での扱い |
|----------------|---------------|
| §1 データモデル | 維持。`character.affinityAxis` は新規追加 |
| §2 初期化 | §2.1 同団体ボーナス〜§2.3 バックストーリーは維持。§3 で軸初期化を追加 |
| §3.1 接触判定 | 維持 |
| §3.2 接触ありの bond/rivalry 動作 | **bond 部分を本仕様 §5.1 で改訂** |
| §3.3 接触なし | 維持 |
| §3.4 性格摩擦 | 維持（共存） |
| §3.5 世代近接ボーナス | 維持 |
| §3.6 OVR変動効果 | 維持 |
| §4〜§14 | 全て維持 |

### §8.2 v2.2（裏切りパッケージ）との関係

無関係。v2.2 は契約離脱時の数値変動（A-1〜A-4）で、本仕様の週次回帰とは適用パスが分離している。両者は独立に動作する。

### §8.3 relationship-flags-spec-v1.0（フラグ仕様）との関係

フラグ仕様の **F-6 憧れ（bond60+）** や **F-3 師弟（bond70/55）** は、現状の閉じた分布では実質発火しない。本仕様で bond 分布を広げてから、フラグ層を乗せる前提。

実装順序: **本仕様 → フラグ仕様** の順で進める。

---

## §9 RNG シード

| 用途 | シード |
|------|--------|
| 軸初期化（新規ゲーム）| `seed ^ 0xBE90` |
| 軸マイグレーション（既存セーブ）| `state.rngSeed ^ 0xBE90` |
| ペア相対オフセット | 上記と共通 |

v2.2 までで使用済みの 0xBE71〜0xBE73、フラグ仕様予定の 0xBE80〜0xBE84 と衝突しない。

---

## §10 マイグレーション

| ID | 内容 |
|----|------|
| `_migrated_affinity_v1` | §3.2 のマイグレーション処理を実行 |

---

## §11 検証

### §11.1 自動検証

`test/relationship-distribution-analysis.js` を実装後に再実行し、§概要の目標値に到達するかを確認:

```bash
node test/relationship-distribution-analysis.js 100 12345 --json
node test/relationship-distribution-analysis.js 100 67890 --json
node test/relationship-distribution-analysis.js 100 99999 --json
```

異なる seed で 3〜5 回実行し、目標値内に収まるかを確認。

### §11.2 既存テスト

```bash
node test/auto-sim.js 100
node test/relationship-balance-test.js
```

既存テストで違反 0 を確認。特に **relationship-balance-test.js の `testWeeklyDecayCoolsHotRivalry` は v2.1 §3.2 の挙動を仮定**しているため、改訂後の値で再調整が必要になる可能性あり。

### §11.3 手動確認

ブラウザでプレイ → 数年回す → 「あの2人だけ何故か仲が良い／悪い」という観察ができるかを Keisuke が体感確認。

---

## §12 やらないことリスト

- ❌ **軸の可視化** — プロフィール画面・デバッグ画面どちらにも表示しない
- ❌ **動的な相性変化** — 一度決まった軸は引退まで変わらない（フラグ層で表現可能なので）
- ❌ **集団相性** — 3人以上の場の相性は実装しない（複雑化、効果不明）
- ❌ **相性によるイベント発火** — 相性は数値ドリフトのみに作用。イベントトリガには使わない
- ❌ **rivalry への作用** — 相性は bond のみに作用。rivalry は試合・OVR差で動く既存ロジックを維持
- ❌ **性格摩擦の撤廃** — 性格摩擦と相性は独立して同居する

---

## §13 振幅・パラメータ調整方針

実装後 §11.1 の検証で目標値（帯シフト指標 8〜12）に届かない場合の調整順:

| 優先度 | 対象 | 現状値 | 第1段階調整 | 第2段階調整 |
|--------|------|--------|------------|-------------|
| 1 | 振幅 | ±10 | ±12 | ±15 |
| 2 | bondPull | 0.08+0.06 | 0.06+0.04 | 0.05+0.03 |
| 3 | 同団体ボーナス | 0.10+0.15 | 0.05+0.10 | 撤廃 |
| 4 | 同団体天井 60 | — | 65 | 70 |

逆に**広がりすぎ**の場合は逆順で戻す。

調整の最終決定は Keisuke が体感で行う。auto-sim 数値だけで決めない（CLAUDE.md「auto-sim の結果だけでバランス修正しない」）。

---

## 変更履歴

| 日付 | バージョン | 内容 |
|------|:--------:|------|
| 2026-04-28 | v1.0 ドラフト | 初版（100シーズン分布分析の結果を踏まえて作成）|
