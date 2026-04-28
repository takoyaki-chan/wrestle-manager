# 相性軸システム — Claude Code 実装ハンドオフ

**ファイル**: `plans/relationship-affinity-implementation-task.md`
**作成日**: 2026-04-28
**対象**: Claude Code
**担当モデル推奨**: Opus（既存週次ロジックの改訂 + 新規データモデル + 検証ループが絡む）
**前提**: `test/relationship-distribution-analysis.js` が動作していること（Phase 5 完了済み）

---

## 1. このタスクで何をやるか

`specs/relationship-affinity-spec-v1.0.md` を実装する。bond分布の構造的な圧縮（普通帯99.5%占有）を、**(1) キャラ固有360°相性軸**と **(2) 回帰圧緩和**の両輪で解決する。

### 必ず最初に読むドキュメント

順番に読んでから実装に入ること:

1. **`CLAUDE.md`**（数値哲学・対処療法回避）
2. **`specs/relationship-affinity-spec-v1.0.md`**（本タスクの完全仕様）
3. **`specs/relationship-system-spec-v2.1.md`** §3.2（改訂対象の現状）
4. **`src/relationships.js`** L398-650（processWeeklyDecay の現状実装）
5. **`src/data.js`**（character data 構造の理解、`affinityAxis` 追加箇所の特定）
6. **`test/relationship-distribution-analysis.js`**（検証ツール、Phase 5 で作成済み）

### スコープ

| 対象 | 内容 |
|------|------|
| character data | 全キャラに `affinityAxis: 'auto'` を追加。設計ペア（橘×生駒）に `pairedWith` 指定 |
| 関係性初期化 | `Engine.relationships.initialize` で軸割り当て処理を追加 |
| マイグレーション | 既存セーブのキャラに軸を後付け（`_migrated_affinity_v1`）|
| 週次処理改訂 | `processWeeklyDecay` の bond 部分を §5 通りに書き換え |
| ヘルパー追加 | `affinityDistance` / `affinityTarget` を `src/relationships.js` に追加 |
| 既存テスト追従 | `relationship-balance-test.js` の testWeeklyDecayCoolsHotRivalry 等が改訂後の値で動くよう再調整 |
| 検証 | distribution-analysis を 3 seed で実行し、目標値到達を確認 |

### スコープ外

- フラグシステム（spec v1.0 ドラフト）の実装 — 別タスク（本タスク完了後）
- 軸の可視化 UI — やらないリストに明記
- rivalry への作用 — 本仕様は bond のみに作用
- 設計ペアの拡張 — 橘×生駒以外の設計ペアは Keisuke と相談して別途追加

---

## 2. 全体の進め方と Phase 進行

| Phase | 内容 | 想定規模 |
|-------|------|:------:|
| 1 | ヘルパー関数追加 + character data に `affinityAxis: 'auto'` 一括追加 | 小 |
| 2 | 軸初期化処理（`Engine.relationships.initialize` 内）+ マイグレーション | 中 |
| 3 | 設計ペア指定（橘×生駒に `pairedWith`）+ 2パス初期化の動作確認 | 小 |
| 4 | `processWeeklyDecay` の bond 部分改訂（§5.1 + §5.2）| 中 |
| 5 | 既存テスト追従（relationship-balance-test.js 等の数値再調整）| 小〜中 |
| 6 | 検証ループ（distribution-analysis 3 seed で実行 → 目標値確認 → 必要ならパラメータ調整）| 中〜大 |

各 Phase 完了時に Keisuke さんに報告して承認を得てから次へ進む（CLAUDE.md 開発ルール）。

---

## 3. Phase 別実装詳細

### Phase 1: ヘルパー関数 + character data 一括追加

#### 3.1 ヘルパー関数（`src/relationships.js` 冒頭付近、Engine.relationships._affinity ネームスペース下）

```javascript
Engine.relationships._affinity = {
  distance(axisA, axisB) {
    if (typeof axisA !== 'number' || typeof axisB !== 'number') return 90;  // 中立フォールバック
    const diff = Math.abs(axisA - axisB);
    return Math.min(diff, 360 - diff);
  },
  target(distance) {
    return 50 + 10 * Math.cos(distance * Math.PI / 180);
  }
};
```

エクスポート方法は既存パターンに合わせる（`src/relationships.js` 末尾の Node.js モジュールエクスポート箇所を参照）。

#### 3.2 character data に一括追加

`src/data.js` の `ALL_CHARS` または相当配列の各キャラに `affinityAxis: 'auto'` を追加。一括追加なので機械的でよい。

設計ペア（橘×生駒）は Phase 3 で対応。Phase 1 では全員 `'auto'` で OK。

#### 3.3 完了条件

- ヘルパーが Engine.relationships._affinity.distance(0, 180) === 180 などで動作
- character data 全エントリに affinityAxis: 'auto' が入っている
- 既存 auto-sim 100 シーズンで違反 0 を維持（変更がまだ作用していない段階）

### Phase 2: 軸初期化 + マイグレーション

#### 3.4 `Engine.relationships.initialize` の改訂

仕様書 §3.1 のとおり 2パス処理を追加する。

```javascript
initialize(state, rng) {
  // ... 既存処理 ...

  // ── §3.1 軸初期化（2パス） ──
  const affRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, 0xBE90));

  // パス A: 'auto' のキャラを先に
  for (const c of state.roster) {
    if (typeof c.affinityAxis !== 'object') {
      c.affinityAxis = Math.floor(Engine.rng.float(affRng) * 360);
    }
  }
  // AI org も同様
  for (const orgId of Object.keys(state.aiOrgs || {})) {
    for (const c of state.aiOrgs[orgId].roster || []) {
      if (typeof c.affinityAxis !== 'object') {
        c.affinityAxis = Math.floor(Engine.rng.float(affRng) * 360);
      }
    }
  }

  // パス B: 設計ペア（pairedWith 指定）
  const allChars = [...state.roster, ...Object.values(state.aiOrgs || {}).flatMap(o => o.roster || [])];
  for (const c of allChars) {
    if (typeof c.affinityAxis !== 'object' || !c.affinityAxis.pairedWith) continue;
    const partner = allChars.find(p => p.id === c.affinityAxis.pairedWith);
    if (!partner || typeof partner.affinityAxis !== 'number') {
      console.warn(`[affinity] partner ${c.affinityAxis.pairedWith} not resolved for ${c.id}, falling back to random`);
      c.affinityAxis = Math.floor(Engine.rng.float(affRng) * 360);
      continue;
    }
    const offset = Math.floor((Engine.rng.float(affRng) * 2 - 1) * c.affinityAxis.maxOffsetDeg);
    c.affinityAxis = ((partner.affinityAxis + offset) % 360 + 360) % 360;
  }

  // ... 既存の bond/rivalry 初期化処理 ...
}
```

#### 3.5 マイグレーション

仕様書 §3.2 の `migrateAffinityAxis` を `Engine.relationships.migrateAffinityAxisV1` として実装し、既存の migration チェーンに登録する（既存の `_migrated_relationships_v1` などと同じパスで）。

ロード時に走るマイグレーションフックの登録位置は、既存実装（`src/management.js` のロード処理など）を grep で見つけて合わせること。

#### 3.6 完了条件

- 新規ゲームで全キャラの affinityAxis が 0-359 の整数になっている（数値）
- 既存セーブをロードしても全キャラに affinityAxis が後付けされる
- `_migrated_affinity_v1` フラグが立つ

### Phase 3: 設計ペア指定 + 2パス動作確認

#### 3.7 character data に橘×生駒指定

`src/data.js` で生駒のエントリを以下のように変更（橘の側はそのまま 'auto' で OK、片方指定で十分）:

```javascript
{
  id: <生駒のID>,
  name: '生駒 葵',  // ※実名は data.js を見て確認
  affinityAxis: { pairedWith: <橘のID>, maxOffsetDeg: 30 }
}
```

`<橘のID>`, `<生駒のID>` は data.js の実 ID を grep で確認すること。（Keisuke のメモリには「橘と生駒は相棒キャラ」とあるが、ID が分からないので Claude Code 側で確認する）

橘・生駒の正確な ID と名前が確認できなかった場合、Phase 3 はスキップして Phase 4 に進む。Keisuke に質問して保留とする。

#### 3.8 動作確認

100 シーズン分の新規ゲーム生成を実行（手動 or auto-sim）し、橘と生駒の `affinityAxis` 距離が常に 30° 以内に収まることを 5 seed 程度で確認する。簡易スクリプトでよい:

```javascript
// 確認用一発スクリプト
for (let s = 1; s <= 5; s++) {
  const G = Engine.createInitialState(s * 1000);
  const tachibana = G.roster.find(c => c.id === <橘ID>);
  const ikoma = G.roster.find(c => c.id === <生駒ID>);
  const d = Engine.relationships._affinity.distance(tachibana.affinityAxis, ikoma.affinityAxis);
  console.log(`seed ${s}: tachibana=${tachibana.affinityAxis} ikoma=${ikoma.affinityAxis} dist=${d}`);
  console.assert(d <= 30, 'distance must be within 30 deg');
}
```

#### 3.9 完了条件

- 橘×生駒の距離が常に ≤ 30°
- 警告ログが出ない（パートナー解決失敗ゼロ）

### Phase 4: processWeeklyDecay 改訂

#### 3.10 改訂対象

`src/relationships.js` L490-525 付近（接触ありペアの bond ドリフト + 同団体ボーナス）。

仕様書 §5.1 / §5.2 のとおり書き換える。具体的には:

```javascript
// (改訂前)
if (inContact) {
  const bondPull = 0.18 + Engine.rng.float(rng) * 0.12 +
                    Math.max(0, Math.abs(bond - 50) - 20) * 0.01;
  if (bond > 50) bond -= bondPull;
  else if (bond < 50) bond += bondPull;
  // ...
}

// (改訂後)
if (inContact) {
  const charA = charInfoMap.get(idA);
  const charB = charInfoMap.get(idB);
  const dist = Engine.relationships._affinity.distance(
    charA?.affinityAxis ?? 0,
    charB?.affinityAxis ?? 0
  );
  const target = Engine.relationships._affinity.target(dist);
  const bondPull = 0.08 + Engine.rng.float(rng) * 0.06;  // 半減
  // 加速項撤廃
  if (bond > target) bond -= bondPull;
  else if (bond < target) bond += bondPull;
  // ...
}

// 同団体ボーナス
if (sameOrg && bond < 60) {
  const orgBondGain = 0.1 + Engine.rng.float(rng) * 0.15;  // 半減 +0.1〜+0.25
  // ceiling 計算は据え置き
  // ...
}
```

#### 3.11 注意事項

- `charInfoMap` は既存実装で構築済み（L529 付近で参照されているマップを再利用）
- 引退者・凍結ペアの処理は変更なし（v2.1 §3.3 維持）
- rivalry 部分は一切触らない
- 性格摩擦（§3.4）と世代近接ボーナス（§3.5）は据え置き

#### 3.12 完了条件

- 改訂後コードがコンパイル・実行できる
- auto-sim 100 シーズン エラー 0、違反 0
- 既存ユニットテストの一部が失敗するはず（次 Phase で対応）

### Phase 5: 既存テスト追従

#### 3.13 失敗するテストの想定

`test/relationship-balance-test.js`:
- `testWeeklyDecayCoolsHotRivalry`: bond 92 → 91.7 未満を期待。改訂後は bondPull が半減したので、より控えめな減少を期待する値に再調整

```javascript
// (改訂前) bond 92 → 91.7 未満
assert.ok(next.relationships['1>2'].bond < 91.7, ...);

// (改訂後) bond 92 → 91.85 未満（pull が半減した想定で）
assert.ok(next.relationships['1>2'].bond < 91.85, ...);
```

正確な閾値は実測ベースで決める（テスト用キャラに `affinityAxis` を設定し、実際に1週走らせた結果から導出）。

#### 3.14 テスト用キャラの affinityAxis

`makeFighter` ヘルパーに `affinityAxis: 0` などのデフォルト値を追加する：

```javascript
function makeFighter(id, extra = {}) {
  return {
    id, name: `F${id}`, pw: 60, sp: 60, te: 60, st: 60, mn: 60,
    style: 'Allround', personality: 'normal', archetype: 'normal',
    injury: null, isRental: false, age: 22,
    affinityAxis: 0,  // 🆕 追加
    ...extra,
  };
}
```

両キャラ axis 0 → distance 0 → target 60 になるので、テストの基準値計算がそれに従う。

#### 3.15 完了条件

- relationship-balance-test.js が pass する
- auto-sim.js が違反 0
- それ以外の既存テストも維持

### Phase 6: 検証ループ

#### 3.16 distribution-analysis 実行

```bash
node test/relationship-distribution-analysis.js 100 12345 --json
node test/relationship-distribution-analysis.js 100 67890 --json
node test/relationship-distribution-analysis.js 100 99999 --json
```

3 seed の結果を集めて報告。

#### 3.17 目標値チェック（仕様書 §概要）

| 指標 | 目標 | 観測値 | OK/NG |
|------|------|--------|-------|
| 帯シフト指標 | 8〜12 | ? | ? |
| 嫌悪帯（<20） | 3〜8% | ? | ? |
| 苦手帯（20-39）| 15〜25% | ? | ? |
| 普通帯（40-59）| 45〜60% | ? | ? |
| 好意帯（60-79）| 15〜20% | ? | ? |
| 深い絆帯（80+）| 3〜8% | ? | ? |

3 seed の平均が目標範囲内なら成功。

#### 3.18 目標未達の場合

仕様書 §13 の調整方針に従う：

| 優先度 | 対象 | 第1段階 | 第2段階 |
|--------|------|---------|---------|
| 1 | 振幅 ±10 | ±12 | ±15 |
| 2 | bondPull 0.08+0.06 | 0.06+0.04 | 0.05+0.03 |
| 3 | 同団体ボーナス 0.1+0.15 | 0.05+0.10 | 撤廃 |
| 4 | 同団体天井 60 | 65 | 70 |

調整は **1パラメータずつ** 動かす。複数同時調整しない（効果切り分け不能になる）。

#### 3.19 完了条件

- 3 seed の平均が目標値内
- Keisuke に報告し、最終承認を得る

---

## 4. 完了条件（タスク全体）

- [ ] Phase 1〜6 完了
- [ ] auto-sim.js / relationship-balance-test.js が pass
- [ ] distribution-analysis 3 seed の平均が目標値内
- [ ] specs/relationship-affinity-spec-v1.0.md のステータスが 🟢 確定 に更新される（実装完了の表明）
- [ ] Keisuke に最終報告

---

## 5. コミット運用

ローカルコミットのみ（push しない）。コミットメッセージ案（参考、実際は内容に合わせて）:

- `feat(affinity): 360°相性軸データモデルとヘルパー追加 (Phase 1)`
- `feat(affinity): キャラ生成時の軸初期化と既存セーブマイグレーション (Phase 2)`
- `feat(affinity): 橘×生駒の設計ペア指定 (Phase 3)`
- `refactor(relationships): bondPull 半減 + 標的シフト導入 (Phase 4)`
- `test(relationships): 相性軸導入に伴う既存テスト数値追従 (Phase 5)`
- `chore(affinity): 検証ループ + パラメータ最終調整 (Phase 6)`

---

## 6. やらないことリスト

- ❌ **軸の UI 表示** — プロフィール画面・デバッグ画面どちらにも表示しない
- ❌ **rivalry への作用** — 本タスクは bond のみ
- ❌ **設計ペアの大量追加** — 橘×生駒のみ。それ以外は Keisuke と相談してから別タスク
- ❌ **複数パラメータの同時調整** — 効果切り分け不能になる
- ❌ **auto-sim 数値だけでの判断** — 体感確認も Keisuke が行う
- ❌ **フラグシステム実装の同時着手** — 本タスク完了後の別タスク

---

## 7. 注意事項

### 7.1 既存挙動との互換

- `_migrated_affinity_v1` 立つ前のセーブは、ロード時に1回だけマイグレーションを通る
- マイグレーション後は新規ゲームと同じ動作になる
- 引退者プールにも affinityAxis を後付けする（chronicle で参照する可能性があるため）

### 7.2 Phase 3 の橘×生駒 ID 確認

`src/data.js` を grep して `橘` と `生駒` の文字列で検索すれば見つかる。日本語キャラ名で `name` フィールドに入っている想定。

```bash
grep -n "橘\|生駒" src/data.js
```

見つからない or 確証が持てない場合は Phase 3 をスキップして Keisuke に質問。

### 7.3 検証フェーズで目標値が大幅に外れた場合

調整1〜2回試して目標値に届かない場合、仕様書 §13 で想定していない要因（例: rivalry 側との相互作用、frozen 比率の影響）を疑う。Keisuke に報告して仕様レベルでの再検討を依頼する。
