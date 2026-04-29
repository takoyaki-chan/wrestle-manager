# タスク指示書: モメンタム実効効果の縮小（B案標準）

**承認済み**: 2026-04-29 / Keisuke / B案標準（係数 0.05 / 0.001 / 0.03）+ タッグマッチ同係数。
**前提計画書**: `plans/momentum-effect-reduction-plan.md`
**対象ブランチ**: 任意の作業ブランチ（feature/momentum-effect-reduction 推奨）。
**実装モード**: Claude Code 単独実行可。途中の確認ダイアログ不要。

---

## 1. 変更内容（5ファイル）

### 1-1. `src/data.js`

**L.715 を以下に置換**:

```diff
-  defStaScale: 0.02, defMntScale: 0.055, momDmgScale: 0.003,
+  defStaScale: 0.02, defMntScale: 0.055, momDmgScale: 0.001,
```

**L.719 を以下に置換**:

```diff
-  pinAttemptMomBonus: 0.15, pinAttemptMntPenalty: 0.20,
+  pinAttemptMomBonus: 0.03, pinAttemptMntPenalty: 0.20,
```

`BIGMATCH_ENG` は `...ENG` で継承しているので、追加変更は不要。

### 1-2. `src/match-engine.js`

**L.176（シングルマッチの攻撃側決定）を置換**:

```diff
-        const leftChance = 50 + mom * 0.3;
+        const leftChance = 50 + mom * 0.05;
```

**L.730（タッグマッチの攻撃側決定）を置換**:

```diff
-      const atkRoll = Engine.rng.float(rng) * 100 + mom * 0.3;
+      const atkRoll = Engine.rng.float(rng) * 100 + mom * 0.05;
```

### 1-3. `specs/battle-engine-spec-v4.2.md`

**変更履歴テーブル（L.13付近）に v4.3 行を追加**:

```diff
 | v4.2 | 2026-04-05 | **tuneC**：HP計算式変更(...) |
+| v4.3 | 2026-04-29 | **モメンタム実効効果の縮小**：`leftChance` の `mom × 0.3 → 0.05`、`momDmgScale: 0.003 → 0.001`、`pinAttemptMomBonus: 0.15 → 0.03`。ゲージの動き方（ヒット±8/ミス±5/カウンター±18）は据え置き。「序盤の流れだけで試合が決まる」「先攻不利」現象を緩和。詳細は `plans/momentum-effect-reduction-plan.md`。 |
```

**L.135 を置換**（§3 行動順決定）:

```diff
-leftChance = 50 + (momentum × 0.3) + (eff(L.spd) - eff(R.spd)) × 0.15
+leftChance = 50 + (momentum × 0.05)
```

※ 仕様書には SPD 項と clamp(20, 80) があるが実コードでは脱落。今回は実装を正として整合させる。SPD 項復活は別計画として残す。

**L.136 を削除**（clamp 行）:

```diff
-leftChance = clamp(leftChance, 20, 80)
```

**L.139 を置換**（説明文）:

```diff
-SPDが高い方が攻撃機会を多く得るが、モメンタムが最大の影響を持つ。
+モメンタムが攻撃機会に僅かに影響する（v4.3で 0.3→0.05 に縮小）。±50時で攻撃機会±2.5%。SPD項は仕様書に記載あるが現状の実装では未反映。
```

**L.264 を置換**（§7.1 ダメージ計算のモメンタム補正）:

```diff
-mMod = 1.0 + (momentum_advantage × 0.003)
+mMod = 1.0 + (momentum_advantage × 0.001)   // v4.3: ±50時で±5%
```

**L.412 を置換**（§フォール狙い発動率）:

```diff
-attemptRate = 25 + (momentum_advantage × 0.15)
+attemptRate = 25 + (momentum_advantage × 0.03)   // v4.3: ±50時で±1.5%
```

**L.620 を置換**（§ENG定数）:

```diff
-  momDmgScale: 0.003,
+  momDmgScale: 0.001,
```

**L.633 を置換**（§ENG定数）:

```diff
-  pinAttemptMomBonus: 0.15,
+  pinAttemptMomBonus: 0.03,
```

### 1-4. `docs/master-spec.md`

`master-spec.md` でモメンタムに言及している箇所を grep で確認し、係数値を直接書いている箇所があれば同様に更新。傾向としては威圧感トレイト等の特性記述のみで具体係数は書いていないはずなので、ない場合はスキップしてよい。

```bash
grep -n "0\.3\|0\.003\|0\.15" docs/master-spec.md | grep -i "momentum\|モメンタム\|mom"
```

### 1-5. `docs/game-system-roadmap.md`

セッション末尾でロードマップに今回の変更エントリを追加（節「前回」を新規エントリで上書きする形式）。下記サンプルを参考に Keisuke スタイル（長文1段落）で記述：

```markdown
前回: **戦闘エンジン v4.3 — モメンタム実効効果の縮小（2026-04-29）。** `plans/momentum-effect-reduction-plan.md` の B案実装。①現状調査で「同格70vs70でも序盤4ターンのモメンタムリーダーが79%で勝つ」「先制ヒット被弾側の勝率36%」「同格でも86%が中盤8ターン時点で勝者確定」というスノーボール現象を測定で確認、`leftChance = 50 + mom × 0.3` の攻撃機会偏重が主因と特定。②`mom` のゲージ動き（ヒット±8/ミス±5/カウンター±18/威圧感±3）は据え置き、ゲーム上の実効効果を縮小する方向で B案を採用。③変更：`src/match-engine.js` L.176/L.730 の `leftChance` 係数 `0.3 → 0.05`、`src/data.js` L.715 `momDmgScale: 0.003 → 0.001`、L.719 `pinAttemptMomBonus: 0.15 → 0.03`。タッグマッチ(L.730)も同係数に統一。④期待効果（測定済）：同格 T4リーダー的中率 79.4% → 73.8%、T8 86.3% → 83.6%、ビッグマッチ T4 76.6% → 68.8%、T8 81.0% → 72.1%、80vs60 下位勝率（番狂わせ）通常 27.8% → 25.4% / ビッグ 23.8% → 20.0%、80vs80 同格バランス 49.9/50.1 維持。平均ターン数は通常 8.1 → 8.2、ビッグ 13.2 → 13.8 と僅かに伸長（許容範囲）。⑤副作用なし：MQ算出は `mom` 非参照、丸め込み判定の `pinAttemptMomBonus` は `pinAttempt` 関数のみで使用、セーブ互換性影響なし。⑥`specs/battle-engine-spec-v4.2.md` を v4.3 に変更履歴追記＋§3/§7.1/§フォール狙い/§ENG定数の数値同期。仕様書に記載のあった `(eff(L.spd) - eff(R.spd)) × 0.15` SPD項とclamp(20,80)は実コードで脱落していたため、実装を正として仕様書側を実装に合わせた（SPD項復活は別計画として残す）。⑦検証：`test/_momentum-baseline.js` `_momentum-correlation.js` `_momentum-whatif.js` の3スクリプトで現状/A/B/C案を並列比較、auto-sim 100シーズン(seed=12345) ALL CLEAR、stat-contribution-test で能力値貢献度に大きな歪みがないことを確認。⑧残タスク：仕様書のSPD項復活、番狂わせの絶対頻度調整（`counterBase` `rollupBaseSuccess` `hitMin/hitMax`）は別計画として未着手。変更：src/match-engine.js(L.176/L.730 mom係数)+src/data.js(L.715/L.719 ENG定数)+specs/battle-engine-spec-v4.2.md(変更履歴v4.3+§3/§7.1/§フォール狙い/§ENG定数)+plans/momentum-effect-reduction-plan.md(計画書)+plans/momentum-effect-reduction-task.md(本指示書)+docs/game-system-roadmap.md(本項)。
```

※ ⑦の検証結果（auto-sim ALL CLEAR等）は実際に実行した結果に応じて書き換え。

---

## 2. 検証手順

### 2-1. ユニット検証

```bash
node test/_momentum-whatif.js
```

出力の「B案 標準(推奨)」行が以下の値（±1%の許容誤差内）になっているか確認：

- 80 vs 80（通常）下位勝率 50.1%、T4的中率 73.8%、T8的中率 83.6%
- 80 vs 60（通常）下位勝率 25.4%、T4的中率 71.5%
- 80 vs 60（ビッグマッチ）下位勝率 20.0%、T4的中率 67.6%、T8的中率 72.8%

`_momentum-whatif.js` は変更前のコードを `vm.runInThisContext` でパッチしてから走らせる構造のため、本番コードを変更しても結果は変わらない。動作確認用。

### 2-2. エンジン整合性

```bash
node test/auto-sim.js 100 12345
```

ALL CLEAR を確認。違反0/エラー0/ゲームオーバー0。

### 2-3. 能力値貢献度

```bash
node test/stat-contribution-test.js
```

能力値ごとの勝率寄与に歪みが出ていないか目視確認。`mom` を弱めた影響でPW/SPD/TE/ST/MNの相対重要度が変化していないことを確認。

### 2-4. 不要なもの

- ブラウザでの動作確認、スクリーンショット → **不要**（Keisuke が手元で実機確認）
- セーブデータ互換テスト → **不要**（`mom` はセーブされない）

---

## 3. 実装後のファイル状態（チェックリスト）

- [ ] `src/match-engine.js` L.176, L.730 の `mom * 0.3` → `mom * 0.05`
- [ ] `src/data.js` L.715 `momDmgScale: 0.001`, L.719 `pinAttemptMomBonus: 0.03`
- [ ] `specs/battle-engine-spec-v4.2.md` 変更履歴 v4.3 追記、§3, §7.1, §フォール狙い, §ENG定数の数値更新
- [ ] `docs/master-spec.md` に係数記述があれば更新（なければスキップ）
- [ ] auto-sim 100シーズン ALL CLEAR
- [ ] `_momentum-whatif.js` の B案数値が再現可能
- [ ] `docs/game-system-roadmap.md` に「前回」エントリ追記
- [ ] `plans/momentum-effect-reduction-task.md` を `plans/archive/` に移動

---

## 4. 完了報告フォーマット

実装後、以下を Keisuke に報告：

1. 変更したファイル一覧
2. auto-sim の実行結果（エラー有無）
3. `_momentum-whatif.js` の再実行結果（B案数値が一致するか）
4. ロードマップ更新済みの「前回」エントリ全文（コピペ用）

---

## 5. ロールバック手順

万が一不具合発生時のリバート方法：

```bash
git diff HEAD~1 -- src/match-engine.js src/data.js
git checkout HEAD~1 -- src/match-engine.js src/data.js
```

仕様書側は別コミットに分けるとロールバックしやすい。
