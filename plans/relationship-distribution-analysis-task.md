# 関係性分布分析スクリプト — Claude Code 実装ハンドオフ

**ファイル**: `plans/relationship-distribution-analysis-task.md`
**作成日**: 2026-04-28
**対象**: Claude Code
**担当モデル推奨**: Sonnet（既存スクリプト構造の流用 + 集計ロジックの追加が中心）
**前提**: 既存の `test/auto-sim.js` が動作している

---

## 1. このタスクで何をやるか

`test/relationship-distribution-analysis.js` を新規作成する。auto-sim と同じローダ機構・自動プレイロジックを使い、**100シーズンを回した結果の bond/rivalry 分布をヒストグラム形式で出力**する。

### 目的

Keisuke の観察「bond が傾かない、仲が良い/悪いペアが発生せず、イベントが発火しない」を**実測で確認**し、相性システム導入の前後でどう変わるかを比較するための基礎指標を取る。

### 必ず最初に読むドキュメント

順番に読んでから実装に入ること:

1. **`CLAUDE.md`**（数値哲学・対処療法回避）
2. **`test/auto-sim.js`**（ローダ機構と自動プレイロジック、丸ごと参考にする）
3. **`specs/relationship-system-spec-v2.1.md`** §1.2 / §1.3（bond/rivalry帯定義）
4. **`specs/relationship-system-spec-v2.2.md`**（最新の関係性仕様）
5. **`src/relationships.js`** §1.4 の `GameState.relationships` 構造

### スコープ

| 対象 | 内容 |
|------|------|
| 新規スクリプト | `test/relationship-distribution-analysis.js` |
| 出力 | コンソール出力（ヒストグラム + 統計）/ オプションで JSON ファイル `test/relationship-distribution-{seed}.json` |
| 実装方針 | auto-sim.js のメインループをコピペベースで流用、シーズン末スナップショット + 最終集計ロジックを追加 |

### スコープ外

- 既存 auto-sim.js の改造（コピペベースで新規スクリプトを作る）
- フラグシステム（spec v1.0 ドラフト）の検証 — フラグ実装はまだない
- 相性システムの実装 — 別タスク
- HTMLレポート出力 — コンソール出力 + JSON で十分

---

## 2. 出力指標（必須）

### 2.1 bond 分布

3つのカテゴリに分けて出力：

#### A. 全ペア（`r.frozen === false` のみ）

```
【Bond分布 — 全ペア (n=XXXX)】
  嫌悪    (0-19):  XX% [###]
  苦手   (20-39):  XX% [#####]
  普通   (40-59):  XX% [#############################]
  好意   (60-79):  XX% [######]
  深い絆(80-100):  XX% [##]

  平均: NN.N, 標準偏差: N.N, min: NN.N, max: NN.N
  中央値: NN.N, 第1四分位: NN.N, 第3四分位: NN.N
```

#### B. 同団体ペア

両者ともプレイヤー団体に在籍中のペアのみ。

#### C. 他団体・接触ありペア

異団体に分かれているが、直近4週内に対戦履歴があるペア（`recentMatchPairs` 判定相当）。

### 2.2 rivalry 分布

bond と同様に3カテゴリ × 5帯（眼中にない / 少し意識 / ライバル視 / 因縁 / 宿命）で出力。

### 2.3 因縁称号分布

```
【因縁称号分布】
  なし: XX%
  片側因縁: XX%
  因縁: XX%
  宿敵: XX%
  永遠のライバル: XX%
```

`Engine.title.getRivalryLevel(state, idA, idB)` を使って判定。

### 2.4 ペア軌跡サンプル

特徴的な10ペアを選び、シーズン1, 10, 25, 50, 100 時点の bond/rivalry 推移を出力。

#### 選定基準

- 最終 bond が最高/最低のペア各1（同団体ペアのみ）
- 同団体長期在籍ペア（rivalry帯別: 眼中にない/少し意識/ライバル視/因縁/宿命 各1）
- 因縁・宿敵に到達したペア各1
- 残りはランダムサンプル（合計10組になるよう調整）

#### 出力形式

```
【ペア軌跡サンプル】
[最終 bond 最高] F123-F456:
  S001: bond=51.2 rivalry=0.0
  S010: bond=58.7 rivalry=8.3
  S025: bond=72.4 rivalry=15.6
  S050: bond=85.1 rivalry=22.0
  S100: bond=89.3 rivalry=18.7

[同団体長期 - 因縁帯] F234-F567:
  ...
```

### 2.5 集計サマリ

```
【サマリ】
全ペア接触あり率: XX% (同団体 + 直近4週対戦)
平均bond帯シフト: 50→XX.X (普通帯から離れる程度)
帯シフト指標: |bond - 50| の平均 = X.X (高いほど分布が広い)
rivalry 60+ ペア比率: XX%
knownRival 比率: XX%
frozen ペア比率: XX% (引退者ペア)
```

**「帯シフト指標」は分布の幅を測る代表値**で、相性システム導入前後の比較に最も使う指標。

---

## 3. 実装方針

### 3.1 構造

`test/auto-sim.js` をコピペし、以下を変更：

1. ローダ機構（loadAsGlobal）はそのまま
2. autoSetup* / autoHandle* 関数群はそのまま流用
3. メインループはそのまま（ただし engine-integrity チェックは大幅に削除可能）
4. **追加**: 各シーズン末にスナップショット取得関数を呼ぶ
5. **追加**: 最終集計ロジック
6. **削除**: violation / freqWarnings / orgPop推移サマリー / 新集客v2計測（不要）

### 3.2 シーズン末スナップショットの取得タイミング

```javascript
// メインループ内、シーズン繰り上がり直後
if (G.season > stats.lastSeasonSnapshot) {
  takeSnapshot(G, stats);
  stats.lastSeasonSnapshot = G.season;
}
```

`G.season` がインクリメントされた直後（=PPV後の閉幕処理直後）にスナップショットを取る。

### 3.3 スナップショット内容

```javascript
function takeSnapshot(G, stats) {
  const season = G.season - 1;  // 完了したシーズン番号

  if (!stats.snapshots) stats.snapshots = {};

  // 全ペアの bond/rivalry を記録（frozen は除外）
  const pairs = [];
  for (const key of Object.keys(G.relationships || {})) {
    const r = G.relationships[key];
    if (r.frozen) continue;
    const sepIdx = key.indexOf('>');
    const idA = parseInt(key.substring(0, sepIdx), 10);
    const idB = parseInt(key.substring(sepIdx + 1), 10);
    pairs.push({ key, idA, idB, bond: r.bond, rivalry: r.rivalry, knownRival: !!r.knownRival });
  }

  stats.snapshots[season] = {
    pairs,
    rosterIds: G.roster.map(f => f.id),  // この時点のロスター
    // 同団体判定に使う
  };
}
```

メモリ節約のため、軌跡サンプル用の特定ペアだけ全シーズン保存し、それ以外は最終シーズンのみでもよい。

### 3.4 最終集計

100シーズン完了後、`stats.snapshots[99]` を基にヒストグラム生成。

軌跡サンプルは `stats.snapshots[0/9/24/49/99]` の5時点を使う。

### 3.5 同団体ペア / 他団体接触ありペアの判定

最終スナップショット時点のロスター情報と orgTimeline を使う：

```javascript
function classifyPairs(snapshot, G) {
  const charOrgMap = new Map();
  // プレイヤー団体所属
  for (const f of G.roster) charOrgMap.set(f.id, 'player');
  // AI団体所属
  for (const orgId of Object.keys(G.aiOrgs || {})) {
    for (const f of G.aiOrgs[orgId].roster || []) {
      charOrgMap.set(f.id, orgId);
    }
  }

  const sameOrgPairs = [];
  const crossOrgContactPairs = [];
  const otherPairs = [];

  for (const p of snapshot.pairs) {
    const orgA = charOrgMap.get(p.idA);
    const orgB = charOrgMap.get(p.idB);
    if (!orgA || !orgB) { otherPairs.push(p); continue; }
    if (orgA === orgB) sameOrgPairs.push(p);
    else if (hasRecentMatch(G, p.idA, p.idB)) crossOrgContactPairs.push(p);
    else otherPairs.push(p);
  }
  return { sameOrgPairs, crossOrgContactPairs, otherPairs };
}
```

`hasRecentMatch` は `G.h2h[key]` の `lastMatch` が直近4週以内かを見る。

### 3.6 ヒストグラム描画

ASCII bar 形式：

```javascript
function renderHistogram(values, bands, totalLabel) {
  const counts = bands.map(([lo, hi]) => values.filter(v => v >= lo && v < hi).length);
  const total = values.length;
  const maxCount = Math.max(...counts);
  const barWidth = 40;

  console.log(`【${totalLabel} (n=${total})】`);
  bands.forEach(([lo, hi, label], i) => {
    const pct = (counts[i] / total * 100).toFixed(1);
    const barLen = Math.round(counts[i] / maxCount * barWidth);
    const bar = '#'.repeat(barLen);
    console.log(`  ${label.padEnd(12)}: ${pct.padStart(5)}% [${bar}]`);
  });

  const mean = values.reduce((s, v) => s + v, 0) / total;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / total;
  const stdDev = Math.sqrt(variance);
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(total / 2)];
  const q1 = sorted[Math.floor(total / 4)];
  const q3 = sorted[Math.floor(total * 3 / 4)];
  console.log(`  平均: ${mean.toFixed(1)}, 標準偏差: ${stdDev.toFixed(1)}, min: ${sorted[0].toFixed(1)}, max: ${sorted[total-1].toFixed(1)}`);
  console.log(`  中央値: ${median.toFixed(1)}, Q1: ${q1.toFixed(1)}, Q3: ${q3.toFixed(1)}`);
}
```

### 3.7 軌跡サンプルの実装

**特定ペアの全シーズン軌跡を取りたい場合**、最終シーズンの集計でサンプル対象を選定 → そのペアキーを使って全 snapshot を遡る。これでメモリ効率を保てる（全ペア×全シーズンを保存しないで済む）。

ただし軌跡サンプルが10ペア程度なら、毎シーズン全ペア記録しても 60キャラ×60キャラ×100シーズン = 360,000 エントリ程度。各エントリ100バイト未満なら 35MB なので問題ない。**シンプルに全保存でよい**。

---

## 4. CLI インターフェース

```
node test/relationship-distribution-analysis.js [シーズン数] [シード] [--json]

例:
  node test/relationship-distribution-analysis.js 10 12345
  node test/relationship-distribution-analysis.js 100 12345 --json
```

`--json` オプションがあれば、最終結果を `test/relationship-distribution-{seed}.json` に書き出す。

---

## 5. 実装の段取り

| Phase | 内容 | 想定規模 |
|-------|------|:------:|
| 1 | auto-sim.js コピペ → スリム化（不要な violation / freq / orgPop / v2 計測を削除）| 小 |
| 2 | takeSnapshot 関数追加・メインループフック | 小 |
| 3 | 集計ロジック（renderHistogram / classifyPairs / 軌跡サンプル選定）| 中 |
| 4 | CLI 引数処理・JSON 出力 | 小 |
| 5 | 試運転 10 シーズン → 確認 | — |
| 6 | 100 シーズン本実行 → Keisuke に報告 | — |

各 Phase 完了時に Keisuke さんに報告して承認を得てから次へ進む（CLAUDE.md 開発ルール）。

---

## 6. 試運転（Phase 5）

10シーズンで動作確認：

```bash
node test/relationship-distribution-analysis.js 10 12345
```

- エラーなく完走するか
- ヒストグラム・統計が表示されるか
- 軌跡サンプルが10組出るか
- JSON 出力が valid か（`--json` 付きで実行 → `cat | jq .` で確認）

問題なければ Phase 6 へ。

---

## 7. 100シーズン本実行（Phase 6）

```bash
node test/relationship-distribution-analysis.js 100 12345 --json
```

実行時間が長い場合は seed を変えて 3〜5 回実行し、再現性を確認。

### 報告内容

Keisuke に以下を報告：
- 各カテゴリ（全ペア / 同団体 / 他団体接触あり）の bond/rivalry 帯分布
- 帯シフト指標（`|bond - 50|` の平均）
- rivalry 60+ ペア比率、knownRival 比率
- 軌跡サンプル
- 体感との一致度（「思った通り 50 周辺に集まっている」「意外と幅がある」など定性的所感）

この結果を元に、相性システム（spec 別途作成予定）のパラメータ振幅を決定する。

---

## 8. やらないことリスト

- ❌ **HTMLレポート生成** — コンソール出力 + JSONで十分
- ❌ **可視化グラフ** — ASCIIヒストグラムで足りる
- ❌ **既存 auto-sim.js の改造** — 独立スクリプトとして作る（コピペ流用は OK）
- ❌ **マルチシード並列実行** — 単発実行で十分。マルチシードは Keisuke が seed を変えて手動で複数回実行する
- ❌ **比較レポート機能**（before/after）— 単発出力のみ。比較は人間が行う

---

## 9. 完了条件

- [ ] `test/relationship-distribution-analysis.js` が新規作成されている
- [ ] 10シーズン実行で正常完走 + ヒストグラム/統計/軌跡が出力される
- [ ] 100シーズン実行で正常完走
- [ ] `--json` オプションで JSON ファイル出力が動作する
- [ ] 出力結果を Keisuke に報告し、現状の bond 分布が定量化されている

完了後、相性システム実装タスク（別途仕様書作成予定）に進む。

---

## 10. 補足：相性システム実装との関係

このスクリプトは、相性システム（360°相性軸）導入前の**ベースライン測定**として機能する。相性システム導入後に同じスクリプトを再実行し、**「帯シフト指標」が改善しているか**を確認する。

期待される改善:
- 帯シフト指標（`|bond - 50|` の平均）: 現状 X → 導入後 X+5 程度
- 「嫌悪」帯比率: 現状ほぼ 0% → 導入後 5〜10%
- 「深い絆」帯比率: 現状ほぼ 0% → 導入後 5〜10%

具体的な目標値はベースライン測定後に Keisuke と相談して決める。
