# AI団体ドラフト節度 — 実装指示書

> **対象**: Claude Code（推奨モデル: Sonnet）
> **所要時間目安**: 2〜3時間
> **承認状態**: 設計合意済み（ai-draft-balance-spec-v0.1.md v0.2）
> **前提**: draft-negotiation-spec-v1.0.md 実装完了済（現状のコードベースでOK）

---

## このタスクの目的

`draft-negotiation-spec-v1.0.md` の実装後に観測された**S級団体EMPRESSの獲得過多問題**（年6〜7枚取り、素材ティアまで拾う）を解消する。

4つの調整を1本のブランチで実装する：

1. **年間獲得目安（ソフト上限）** — EMPRESS 3〜4 / NOVA 2〜3 / CRESCENT 1〜2（leagueElevated時は変化）
2. **素材ティア参加率の締め付け** — EMPRESS素材0%、NOVA素材一段下げ
3. **ロスター充足時の惰性参加を廃止** — gap 0〜1 の 0.15 を 0 に
4. **シーズン気分の抽選** — 各団体に毎シーズン「活動的/標準/消極的」をランダム割当

**ロジックの置換ではなく、既存の `assignInterest()` に係数を追加で掛ける重ね着方式**。既存の挙動の骨格は温存する。

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. `CLAUDE.md` — 特にアーキテクチャ原則、開発ルール
2. `specs/ai-draft-balance-spec-v0.1.md` — 本実装の根拠spec（全文）
3. `specs/draft-negotiation-spec-v1.0.md` §4〜§6 — 既存の参加率・降り判定の仕組み
4. `src/draft-negotiation.js` 全体 — 特に `assignInterest()` / `runFullDraft()` / `runValidation()` の3関数

---

## 変更ファイル一覧

| ファイル | 変更内容 | 規模 |
|---------|---------|------|
| `src/draft-negotiation.js` | 定数追加、参加率テーブル改訂、`_getRosterFillMul()` 調整、`assignInterest()` に係数ロジック追加、`runValidation()` 拡張 | 中〜大 |
| `src/management.js` | シーズン気分の抽選処理を `offWeek 5` 処理内に追加 | 小 |
| `src/data.js` または `management.js: initAIOrgs` | `aiOrgs[orgId].seasonMood` フィールドの初期化 | 小 |
| `specs/draft-negotiation-spec-v1.0.md` | §5.5 末尾に参照注記を追加 | 極小 |

**触ってはいけないもの**:
- 既存の参加率テーブル（超逸材〜原石のクリア前値）
- 性格別降り率（§5.3 の baseDrop / sens）
- 執着スコア計算（§5.4）
- マーク閾値（§5.6）
- EMPRESS安全網（§6）

---

## タスクリスト

### Step 1: 定数追加（draft-negotiation.js 冒頭付近）

`DRAFT_MARK_NOISE` の直後あたりに追加：

```js
// ═══════════════════════════════════════════════════════
//  ai-draft-balance-spec-v0.1 追加定数
// ═══════════════════════════════════════════════════════

// §1.1 年間獲得目安（leagueElevated連動）
const DRAFT_ORG_YEARLY_CAP = {
  normal: {
    org_s: { min: 3, max: 4 },  // EMPRESS
    org_a: { min: 2, max: 3 },  // NOVA
    org_b: { min: 1, max: 2 },  // CRESCENT
  },
  elevated: {
    org_s: { min: 3, max: 4 },
    org_a: { min: 3, max: 4 },
    org_b: { min: 2, max: 3 },
  },
};

// §1.3 超過時の参加率倍率
const DRAFT_CAP_OVERFLOW_MUL = {
  withinRange: 1.0,    // 上限内
  atMax:       0.3,    // 上限到達
  overMax:     0.05,   // 上限+1超過
  // ハードキャップ到達は _getRosterFillMul が 0 を返すので別系統
};

// §4.2 シーズン気分
const DRAFT_SEASON_MOOD_DIST = {
  normal:   { active: 0.30, normal: 0.50, passive: 0.20 },
  elevated: { active: 0.50, normal: 0.40, passive: 0.10 },
};

// §4.4 気分の効果
const DRAFT_SEASON_MOOD_EFFECT = {
  active:  { capDelta: +1, rateMul: 1.1 },
  normal:  { capDelta:  0, rateMul: 1.0 },
  passive: { capDelta: -1, rateMul: 0.9 },
};
```

### Step 2: 参加率テーブル改訂（DRAFT_PARTICIPATION）

既存定義を以下に置換：

```js
// §5.2 ティア別参加率テーブル
// ai-draft-balance-spec-v0.1 §2.1 で素材・原石・有望を改訂
const DRAFT_PARTICIPATION = {
  normal: {
    org_s: { superElite: 0.95, elite: 0.90, promising: 0.80, raw: 0.30, material: 0.00 },
    org_a: { superElite: 0.75, elite: 0.70, promising: 0.60, raw: 0.50, material: 0.10 },
    org_b: { superElite: 0.35, elite: 0.30, promising: 0.50, raw: 0.60, material: 0.25 },
  },
  elevated: {
    org_s: { superElite: 0.98, elite: 0.95, promising: 0.80, raw: 0.05, material: 0.00 },
    org_a: { superElite: 0.85, elite: 0.80, promising: 0.60, raw: 0.50, material: 0.20 },
    org_b: { superElite: 0.55, elite: 0.50, promising: 0.65, raw: 0.65, material: 0.30 },
  },
};
```

**変更点の要約**:
- `org_s.material` 両レベル: 5%/10% → **0%/0%**
- `org_s.raw` クリア後: 40% → **5%**（大幅減、上位集中）
- `org_s.promising` クリア後: 85% → **80%**（据置）
- `org_a.material`: 15%/25% → **10%/20%**
- `org_a.raw` クリア後: 55% → **50%**（据置）
- `org_a.promising` クリア後: 70% → **60%**（据置）
- CRESCENTは全ティア現行据置

### Step 3: `_getRosterFillMul()` の調整

```js
function _getRosterFillMul(currentSize, idealSize) {
  const gap = currentSize - idealSize;
  if (gap >= 2) return 0;     // 理想+2以上 → 不参加（ハードキャップ）
  if (gap >= 0) return 0;     // ai-draft-balance §3: 0.15 → 0（充足時は参加しない）
  if (gap >= -2) return 1.0;  // 理想 -1〜-2名 → 通常
  if (gap >= -4) return 1.3;  // 理想 -3〜-4名 → 積極的
  return 1.6;                  // 理想 -5名以下 → 非常に積極的
}
```

**既存コメントの `0.15` を残さない**こと（混乱の元）。

### Step 4: `assignInterest()` にソフト上限と気分の係数を追加

既存の `assignInterest()` 内、`baseRate = Math.min(1.0, baseRate * fillMul);` の直後に以下を追加：

```js
    // ── ai-draft-balance §1: 年間獲得目安（ソフト上限）─────
    const capTable = leagueElevated ? DRAFT_ORG_YEARLY_CAP.elevated : DRAFT_ORG_YEARLY_CAP.normal;
    const cap = capTable[orgId] || capTable.org_b;
    const acquired = (state._draftOrgAcquired || {})[orgId] || 0;

    // §4: シーズン気分による上限調整
    const mood = (aiData && aiData.seasonMood) || 'normal';
    const moodEffect = DRAFT_SEASON_MOOD_EFFECT[mood] || DRAFT_SEASON_MOOD_EFFECT.normal;
    const effectiveMax = Math.max(1, cap.max + moodEffect.capDelta);

    // §1.3: 超過時の参加率倍率
    let overflowMul;
    if (acquired < effectiveMax) {
      overflowMul = DRAFT_CAP_OVERFLOW_MUL.withinRange;
    } else if (acquired === effectiveMax) {
      overflowMul = DRAFT_CAP_OVERFLOW_MUL.atMax;
    } else {
      overflowMul = DRAFT_CAP_OVERFLOW_MUL.overMax;
    }
    baseRate = Math.min(1.0, baseRate * overflowMul);

    // §4: 気分による参加率倍率
    baseRate = Math.min(1.0, baseRate * moodEffect.rateMul);
```

`aiData` は既存で取得済み（`const aiData = (state.aiOrgs || {})[orgId];`）。その下に追加する形。

### Step 5: シーズン気分の抽選処理を `management.js` に追加

`src/management.js` の `offWeek >= 5` の処理内（新シーズン遷移時）に、各AI団体に気分を抽選する処理を追加する。既存の `aiOrgs` 更新処理と同じブロックで：

```js
// ai-draft-balance §4: シーズン気分の抽選
const moodRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season + 1, 0xD00D));
const moodDist = s.leagueElevated ? DRAFT_SEASON_MOOD_DIST.elevated : DRAFT_SEASON_MOOD_DIST.normal;
const updatedAiOrgsWithMood = {};
for (const [orgId, orgData] of Object.entries(s.aiOrgs || {})) {
  const r = Engine.rng.float(moodRng);
  let newMood;
  if (r < moodDist.active) newMood = 'active';
  else if (r < moodDist.active + moodDist.normal) newMood = 'normal';
  else newMood = 'passive';
  updatedAiOrgsWithMood[orgId] = { ...orgData, seasonMood: newMood };
}
s = { ...s, aiOrgs: updatedAiOrgsWithMood };
```

**配置場所の目安**: `seasonStartOvr` の記録処理の直後、`s.season + 1` への遷移の直前。挿入位置は `s.season + 1` を使う処理の前である必要がある（新シーズン用の気分なので）。

**注意**: プレイヤーに気分は見せない（§4.5）。UIに出力するイベントメッセージは追加しないこと。

### Step 6: `seasonMood` の初期値設定

`management.js: initAIOrgs` 内、`orgs[org.id] = { ... }` の箇所に `seasonMood: 'normal'` を追加：

```js
orgs[org.id] = {
  roster,
  orgPop: { S: 75, A: 55, B: 35 }[org.tier] || 30,
  lockerRoomMorale: 60,
  coaches: [],
  coachAssign: {},
  titles: Engine.rival.createAITitles(),
  seasonMood: 'normal',  // ai-draft-balance §4: 初期は標準
};
```

シーズン1開始時点では全団体が標準。§5のシーズン遷移処理で次シーズン開始時に再抽選される。

### Step 7: `runValidation()` の拡張

`runValidation()` の末尾の `return` 文を書き換え、以下の集計を追加：

```js
// ai-draft-balance §7.1 拡張メトリクス
const orgPickStats = {
  org_s: { total: 0, byTier: { superElite: 0, elite: 0, promising: 0, raw: 0, material: 0 } },
  org_a: { total: 0, byTier: { superElite: 0, elite: 0, promising: 0, raw: 0, material: 0 } },
  org_b: { total: 0, byTier: { superElite: 0, elite: 0, promising: 0, raw: 0, material: 0 } },
};
const orgPickPerSeason = { org_s: [], org_a: [], org_b: [] };
```

この集計は、`runFullDraft` を呼ぶ各シーズンのループ内で、`draftResult.orgAcquired` と `draftResult.results` を走査して更新する。

戻り値の `return` 文に追加する項目：

```js
orgPickAverage: {
  org_s: (orgPickStats.org_s.total / totalSeasons).toFixed(2),
  org_a: (orgPickStats.org_a.total / totalSeasons).toFixed(2),
  org_b: (orgPickStats.org_b.total / totalSeasons).toFixed(2),
},
orgPickTierDist: orgPickStats,
orgPickMax: {
  org_s: Math.max(...orgPickPerSeason.org_s, 0),
  org_a: Math.max(...orgPickPerSeason.org_a, 0),
  org_b: Math.max(...orgPickPerSeason.org_b, 0),
},
over6PicksRate: {
  org_s: pct(orgPickPerSeason.org_s.filter(n => n >= 6).length, totalSeasons),
  org_a: pct(orgPickPerSeason.org_a.filter(n => n >= 6).length, totalSeasons),
  org_b: pct(orgPickPerSeason.org_b.filter(n => n >= 6).length, totalSeasons),
},
```

**注意**: `runValidation()` の現在の mockState には `seasonMood` が設定されていない。テスト用には各ループ冒頭で `mockState.aiOrgs[orgId].seasonMood = 'normal'` をセットすること（または気分抽選ロジックも仮で入れる）。

### Step 8: 既存specへの参照注記追加

`specs/draft-negotiation-spec-v1.0.md` の **§5.5 ロスター充足度補正** の末尾（「これでEMPRESSが看板選手を引退で失った年は...」の段落の直後）に以下を挿入：

```markdown
> **注記（2026-04-23追加）**: 本節の倍率と§5.2参加率テーブルの節度は、`ai-draft-balance-spec-v0.1.md` で追加の調整が入る。実装時は両specを参照のこと。具体的には、素材ティア参加率・原石ティア参加率（クリア後）・gap 0〜1時の倍率・年間獲得目安（ソフト上限）・シーズン気分が本spec外部で調整される。
```

---

## 検証方法

### 単体動作確認

1. `test/diag-draft.js` を実行し、20シーズン走らせてクラッシュしないこと
   ```powershell
   node test/diag-draft.js 20 42
   ```

2. 既存の `PASS: draft pool circulation looks healthy` が引き続き出ること

### 数値検証（メイン）

`runValidation()` を100シーズンで実行し、以下の目標値を満たすことを確認：

```js
// Node.jsから実行する検証スクリプト例
const result = Engine.draftNegotiation.runValidation(100, 42);
console.log(JSON.stringify(result, null, 2));
```

**目標値（クリア前 leagueElevated=false）**:

| 指標 | 目標 |
|:---|:---|
| `orgPickAverage.org_s` | 3.3〜3.7 |
| `orgPickAverage.org_a` | 2.3〜2.7 |
| `orgPickAverage.org_b` | 1.3〜1.7 |
| `orgPickTierDist.org_s.byTier.material` | 0 |
| `over6PicksRate.org_s` | <5% |
| 年2名以下の発生率（org_s） | 15〜25% |

クリア後版も同様に検証すること（現状 `runValidation` は `leagueElevated: false` 固定なので、オプション引数で切替可能にする拡張も歓迎）。

### 目標値を外した場合

パラメータ調整の優先順位：

1. **獲得数が多すぎる場合** → `DRAFT_CAP_OVERFLOW_MUL.atMax` を 0.3 → 0.2 に下げる
2. **獲得数が少なすぎる場合** → `DRAFT_CAP_OVERFLOW_MUL.atMax` を 0.3 → 0.4 に上げる
3. **素材ティアがまだ取られる場合** → `_getRosterFillMul()` の gap -5以下の倍率（1.6）を見直し
4. **気分の効果が弱い/強い場合** → `DRAFT_SEASON_MOOD_EFFECT` の `rateMul` を調整

---

## コミット単位の目安

```
feat(draft): add yearly soft cap for AI orgs (ai-draft-balance §1)
feat(draft): tighten material tier participation (ai-draft-balance §2)
feat(draft): remove passive participation when roster is full (ai-draft-balance §3)
feat(draft): add season mood randomization for AI orgs (ai-draft-balance §4)
feat(draft): extend runValidation with per-org pick stats (ai-draft-balance §7)
docs(spec): add cross-reference note from draft-negotiation-spec §5.5
```

分割コミット後、ブランチ `feature/ai-draft-balance` を作成して push。マージは `--no-ff` で。

---

## 注意事項（Keisukeの指示）

- **置換ロジックは実装しない** — 「ロスターの弱選手を新規取得時に入れ替える」は明示的に不要
- **気分はUIに見せない** — デバッグログ以外で気分を露出しないこと
- **EMPRESS安全網（§6）は触らない** — 既存実装のまま温存
- **数値は単位付きで表示** — ログやコメントで枚数に言及する場合は「名」を明記、金額なら「万円」

---

## 完了報告の内容

実装完了後、以下を報告：

1. 変更ファイルの diff サマリー
2. `runValidation(100, 42)` の実行結果（全メトリクス）
3. `test/diag-draft.js 20 42` の実行結果
4. 目標値に達していない項目があれば、推奨する追加調整案
