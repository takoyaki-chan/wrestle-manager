# 派閥システム Phase 3d 引き継ぎ

> **作成日**: 2026-04-22（Phase 3c 完了時点に更新）
> **前提コミット**: `052e365 feat(faction): Phase 3c 相関図 派閥オーバーレイ + 重複所属修復`
> **ブランチ**: `feature/faction-system` を継続使用
> **参照 spec**: `specs/faction-system-spec-v0.1.md`（現行 v0.6、§17 に Phase 1〜3c 実装状況記載）

---

## これまでの進捗まとめ

派閥システムは **Phase 3d を残すのみ**。完了すれば v1.0 と呼べる状態になる。

| Phase | コミット | 内容 |
|-------|---------|------|
| 1 | 64598d9 | バックエンド土台（factions.js 新設、検出/加入離脱/減衰/解散/calcMatchAppeal 統合） |
| 2 | 05cd1b9 に同梱 | DB派閥サブタブ + 選手ポップアップバッジ + 試合カード 🏴vs🏴 + CSS トークン |
| 3a | cca7600 | F01/F02/F03 結成・消滅演出 + セリフ + ディスパッチャ |
| 3a' | 05cd1b9 | F02 再設計（既存 2 派閥間の抗争勃発モデルへ） |
| 3b | 6fd13ec | F04〜F08 演出 + セリフ 6×6 + F08 直接対決ディレクティブ |
| 3c | 052e365 | 相関図 派閥オーバーレイ（団体フィルタ連動型トグル）+ 重複所属修復 |
| **3d** | 未着手 | **bond/rivalry 連動カタログ** ← 本セッションのスコープ |

### Phase 3c で起きたことで Phase 3d に効く知見

1. **派閥重複所属のデータ破綻が実機で見つかった**
   13 年目セーブで fighter#9/16/48（宇田川/大河内/菊池璃子）が複数派閥の `memberIds` に跨って存在。原因はコード上の明確な経路ではなく、過去のコンソール手動操作 or 古いバージョン時代の残存データと推定。
   対策済み:
   - `Engine.factions._dedupeFactionMembers(state)` 新設（先着派閥優先、リーダーは絶対優先、除外時 `console.warn`）
   - `reconcileRoster` 末尾に組込み → 週次自動修復
   - `_migrated_faction_dedupe_v1` マイグレーション → セーブロード時 1 回修復
   → **Phase 3d で派閥メンバー集合を参照する関数を書くときは「1 fighterId は最大 1 派閥」が保証されている前提で書いて良い**。ただし念のため `Engine.factions.getFactionByFighterId` を使うと `find()` で先着派閥だけ返すので安心。

2. **コンソールヘルパ `__makeFaction` が Keisuke の手元にある**
   重複回避ロジック付きで派閥を手動生成できる。Phase 3d の数値調整で「特定構成の派閥を作って挙動を観察する」デバッグに使える。仕様は:
   ```js
   window.__makeFaction = (leaderName, memberNames = [], opts = {}) => { ... };
   // 使用例
   __makeFaction('大河内紗代子', ['菊池璃子', '宇田川里奈']);
   ```
   セッション限定なので次セッションで改めて登録してもらう必要あり。Keisuke に「Phase 3c のコンソールヘルパをもう一度登録したい」と言えば対応可。

3. **相関図で派閥内の bond/rivalry 変化が視覚確認できる環境が整った**
   Phase 3d で bond/rivalry を動かすと、Keisuke の団体フィルタ + 🎭 派閥オーバーレイで即座に見える。数値変化の実感を得ながらチューニングできる。

---

## Phase 3d スコープ

### 背景（再掲）

現状の派閥週次処理は bond/rivalry を**書き換えない**。加入/離脱は bond 閾値を**読む**だけで、派閥所属状態が bond/rivalry に**フィードバック**しない。これだと派閥という構造が関係性に還元されない「飾り」になる。派閥が成立したら、そのメンバー間・敵対派閥間の関係性が**派閥構造によって自走し始める**のが Phase 3d のゴール。

### 実装する候補効果

| 効果 | 対象 | 変動量案 🔧 | 発火タイミング |
|------|------|-----------|--------------|
| 派閥内結束ボーナス | 同派閥メンバー同士の bond | +0.15/週 | 週次 |
| 抗争越境敵意 | 抗争中派閥メンバー同士の rivalry | +0.3/週 | 週次 |
| 権威化派閥の下向き圧 | `authoritativeTag` 派閥のリーダー → メンバー方向 bond | +0.1/週、メンバー → リーダー方向は ±0 | 週次 |
| 独裁化の亀裂 | `dictatorTag` 派閥メンバー同士の rivalry | +0.2/週（水面下の不満） | 週次 |
| 寝返り候補の磁力 | 敵対派閥メンバーとの bond 平均 60+ 選手の rivalry | リーダー向け +0.5/週 | 週次 |
| 派閥消滅の余波 | 消滅時、元メンバー全員の bond に -5〜-10 | 離散的 | 消滅イベント時 |

---

## 実装場所

### 新関数

`src/factions.js` に追加:

```js
Engine.factions.processFactionInfluenceOnRelationships(state, rng)
```

**挿入箇所**: tickWeek の派閥パイプラインに、`processWeeklyMemberChanges` の**後**、`processWeeklyHostilityDecay` の**前**に置く（加入離脱の後で新編成に対して効果を適用、その後で減衰という順序）。

### 触らない場所

- `Engine.relationships` の関数シグネチャは触らない（読み取り＋書き戻しだけ）
- `Engine.relationships.processWeeklyDecay` の既存挙動は変更しない
- 派閥所属選手にも通常の bond/rivalry 減衰はそのまま走る。**派閥効果は加算で重ねる**

### RNG シード

- 新設候補: `0xFA19`（既存 0xFA11/13/23/33/14〜18/88/90 と衝突しない）

### 消滅時の余波

`_dissolveFaction` の既存関数内に `bond -5〜-10` の書き込みを追加。既存関数シグネチャは変更せず、内部で直接 `state.relationships` を書き戻す。

---

## 判断が必要な項目（Phase 3d 着手前に Keisuke さんに要確認）

### 1. どれだけ実装するか

- **推奨: コア 3 つ（派閥内結束 + 抗争越境敵意 + 寝返り磁力）から始める**
- 上記 3 つだけでも「派閥に入ると仲間と仲良くなる / 敵とは角が立つ / 寝返り候補は敵ボスに惹かれる」という物語のコア循環が完成する
- 残り 3 つ（権威化の下向き圧 / 独裁化の亀裂 / 派閥消滅の余波）は、コア 3 の auto-sim 結果を見てから追加するか判断

### 2. 効き幅の強度

**数値目標を先に決める**:

- 1 シーズン = 52 週
- 派閥内結束: 52 × 0.15 = +7.8 bond/シーズン（加入時 50 前後 → 58 前後へ。自然減衰 -0.3/週 と相殺して実効 +3〜+5/シーズン）
- 抗争越境敵意: 52 × 0.3 = +15.6 rivalry/シーズン（敵対派閥メンバー間でじわじわ溜まる）
- 寝返り磁力: 52 × 0.5 = +26 rivalry/シーズン（この選手が敵対派閥リーダーを強く意識し始める）

**この目標値で auto-sim → 分布を見て調整**。数値が大きすぎると派閥所属選手だけが bond/rivalry 極値に張り付くゲームになり、非派閥選手との断絶が生まれる。CLAUDE.md「安易な数値加減算によるイベント処理」禁止に注意。

### 3. 既存減衰との関係

3 パターン:

- **A: 加算で重ねる**（派閥効果 + 通常減衰）← 推奨。シンプル、実装明快
- **B: 派閥効果側で既存減衰を打ち消す**（派閥所属中は「定着」して見える）
- **C: 派閥所属選手は `processWeeklyDecay` をスキップ**（分岐が増えるので避けたい）

推奨 A で始めて、auto-sim で「派閥内 bond がシーズン末で平均 50 以下（入団時より下がる）」等の不具合が出たら B に切り替える。

### 4. バランス検証

- auto-sim 100×100 で、派閥所属選手の bond/rivalry 分布が極端に歪まないか観察
- 具体的指標:
  - 派閥所属選手の平均 bond（同派閥内）が非派閥選手のペア平均より +5〜+15 高い
  - 抗争中派閥メンバー間の平均 rivalry が +10〜+25 高い
  - どちらも極端（+40 以上）にはならない
- 派閥非所属選手の bond/rivalry 分布が Phase 1〜3c と大きく変わらない（派閥効果は所属選手だけに効くので当然だが念のため）

---

## 実装手順（推奨案）

### Step 1: コア 3 つの関数骨格

1. `Engine.factions.processFactionInfluenceOnRelationships(state, rng)` 新設
2. 3 つの効果（派閥内結束 / 抗争越境敵意 / 寝返り磁力）のループを書く
3. `_applyBondDirected` / `_applyBondBetweenMembers` の既存ヘルパを流用

### Step 2: パイプラインに挿入

`src/management.js` tickWeek の派閥ブロック:

```js
s = Engine.factions.processWeeklyMemberChanges(s, rng);
s = Engine.factions.processFactionInfluenceOnRelationships(s, rng);  // ← 新規
s = Engine.factions.processWeeklyHostilityDecay(s);
s = Engine.factions.processWeeklyMomentumDecay(s);
s = Engine.factions.checkDissolutionConditions(s, rng);
```

### Step 3: 消滅時の余波

`_dissolveFaction` 内の memberId ループに `bond -5〜-10` の書き込みを追加（relationships.js 既存 API を使って）。

### Step 4: auto-sim 100×100 で検証

```bash
for i in $(seq 1 100); do node test/auto-sim.js 100 $((i * 7919)); done | grep "Result:"
```

ALL CLEAR になるまで数値調整。

### Step 5: Keisuke さんレビュー

- 数値目標の達成度を確認
- 問題があれば残り 3 効果（権威化圧 / 独裁化亀裂 / 消滅余波）を追加実装

### Step 6: 完了処理

- `specs/faction-system-spec-v0.1.md` v0.7 追記 + §17 Phase 3d 完了記録
- `docs/game-system-roadmap.md` 更新
- `git commit`（push しない）
- 派閥システム v1.0 完成宣言
- spec 整理（v0.1 〜 v0.7 の履歴を統合して clean v1.0 化）は別タスク

---

## 事前に必ず読むべきドキュメント

1. **`CLAUDE.md`** — 数値哲学「単純計算で済ませない」「安易な加減算 NG」
2. **`specs/faction-system-spec-v0.1.md §9`** — 派閥関連 bond/rivalry 変動の spec 示唆
3. **`src/factions.js`**:
   - `processWeeklyMemberChanges`（加入/離脱判定、bond を読むだけ）
   - `processWeeklyHostilityDecay`（対立度減衰、bond 平均を読むだけ）
   - `_isHostile(f)`（抗争判定ヘルパ、Phase 3d でも多用）
   - `_applyBondDirected` / `_applyBondBetweenMembers`（既存ヘルパ、流用候補）
   - `_dissolveFaction`（消滅時余波の追加先）
4. **`src/relationships.js`**:
   - `Engine.relationships.processWeeklyDecay`（既存の bond/rivalry 週次処理、干渉確認）
   - bond/rivalry 書き換えの既存 API（`applyBond` 等）
5. **`plans/faction-phase3cd-handoff.md`**（今回の原本、この handoff はその 3d 部分を切り出して具体化したもの）

---

## 触ってはいけないもの（Phase 共通）

- `Engine.factions.*` の**既存関数シグネチャ**（追加 OK、変更 NG）
- `_isHostile(f)` の判定ロジック（v0.4 の統一ヘルパ）
- `G.factions` / `G.factionHostility` / `G.factionEventCooldowns` のデータ形状
- F02 再設計の方針（`applyF02Choice` が派閥を新規作成しないこと）
- `calcMatchAppeal` の factionAppeal 分岐（§6）
- Phase 2 の派閥 UI 3 ポイント（DBタブ/ポップアップバッジ/試合カードバッジ）
- Phase 3a/3b の F01〜F08 モーダル UI と選択肢効果適用ロジック
- Phase 3c の相関図派閥ビューモード
- `Engine.relationships` の関数シグネチャ

---

## 次セッションの開始手順

1. `git status` でブランチ確認（`feature/faction-system`）
2. `git log --oneline -5` で Phase 3c 完了まで確認
3. **このファイル** + `specs/faction-system-spec-v0.1.md §9 / §17` を読む
4. 上記「判断が必要な項目」の 4 点を Keisuke さんに確認
5. コア 3 つの実装着手 → auto-sim 100×100 → レビュー → 残り 3 つを判断

---

## 備考

Phase 3d が完了すると:

- 派閥システム **v1.0 完成宣言**
- 残タスク:
  - **Phase 4**（未計画）: §10 ロスター運営への波及効果（派閥所属が契約交渉・給与要求・育成方針に影響する等）
  - **v0.x 整理**: v0.1 〜 v0.7 の履歴が §17 / 変更履歴に積み重なっているので、v1.0 リリースタイミングで spec を整理・統合
  - **実プレイ反応待ち**: Keisuke さんの長期プレイで派閥イベントのバランス/頻度/セリフ品質を見て、必要に応じて 3e, 3f... としてパッチ

Phase 3c と違い、Phase 3d は**数値バランス調整が主題**。一発で決まらない前提で、auto-sim を回しながら数値を詰める時間を確保してから着手する。
