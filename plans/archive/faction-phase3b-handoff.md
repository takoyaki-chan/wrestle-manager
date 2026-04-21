# 派閥システム Phase 3b 以降 引き継ぎ

> **作成日**: 2026-04-22
> **前提コミット**: `05cd1b9 redesign(faction): F02 を「対立型派閥の同時発生」から「既存派閥間の抗争勃発」へ`
> **ブランチ**: `feature/faction-system` を継続使用
> **参照 spec**: `specs/faction-system-spec-v0.1.md`（v0.4、§17 に Phase 1/2/3a 実装状況記載）

---

## これまでの進捗（Phase 1 〜 3a + F02 再設計）

### Phase 1（commit 64598d9, 2026-04-21）
バックエンド実装 + 閾値 v0.2 調整。`src/factions.js` 新設、`G.factions` / `G.factionHostility` / `G.factionEventCooldowns` 稼働、検出/加入離脱/減衰/解散/後継/calcMatchAppeal統合/validateGameState検証/マイグレーション完了。

### Phase 2（2026-04-21〜22）
- データベース「🎭 派閥」サブタブ（`_dbSubTab=7`）
- 選手ポップアップ派閥バッジ + `openFactionPanel()` 遷移
- 試合カード「🏴vs🏴」バッジ
- CSS トークン `--accent-faction-1〜4` / `--accent-hostility` / `--accent-faction-feud`
- 相関図の派閥レイヤーは Phase 3c へ延期（理由は下記）

### Phase 3a（commit cca7600, 2026-04-22）
F01/F02/F03 の演出モーダル + セリフ叩き台。

- `Engine.factions.pickWeeklyEvent` で F03 > F02 > F01 の優先順選定
- F01/F02/F03 の `applyF0XChoice` / `applyF03Result` 実装
- `_pendingFactionEvent` transient + `App.handleFactionEvent` ディスパッチャ
- auto-sim `autoHandleFactionEvent`（A/B/C/D ランダム応答）
- `src/data-faction-dialogue.js`（F01 leader/follower、F02 leader、F03 survivor、性格6×アーキタイプ5）
- RNG シード 0xFA11 / 0xFA13 / 0xFA23 / 0xFA33 / 0xFA90

### F02 再設計 v0.4（commit 05cd1b9, 2026-04-22）
**重要な方針転換**: 「対立型派閥 2 つを無から同時発生させる」設計を廃止。

- F02 = 既存 2 派閥間で平均 rivalry 40+ かつ未抗争 → `inHostility: true` フラグ付与
- `_isHostile(f)` ヘルパ = `type === 'rivalrous' || inHostility === true`（後方互換）
- `processWeeklyHostilityDecay` で両方向対立度 0 → `inHostility` クリア = 抗争終了
- UI「対立型派閥」→「抗争中の派閥」表記、モーダル文言刷新
- 派閥は基本 `type: 'loyal'` のみ生成。`rivalrous` は legacy セーブ互換として残置

実機確認: 宇田川里奈組（loyal, 権威型）+ 富岡加奈子組 vs 大河内紗代子組（inHostility, 泥沼）の 3 派閥状態で正しく表示されることを確認済。

---

## Phase 3 残スコープ（3 系統）

### 系統 B': F04 〜 F08 演出イベント（§9.4 〜 §9.8）= Phase 3b

| ID | トリガー | 選択肢 | 演出規模 |
|----|---------|-------|---------|
| F04 | 寝返り（敵対派閥メンバーとの bond 平均 70+ かつ自派閥リーダー bond 40-） | A:放置/B:面談/C:告げ口 | 中量 |
| F05 | 派閥内亀裂（リーダーへの bond 平均 50-、または幹部1人が 35-） | A:助言/B:分裂支援/C:静観 | 中量 |
| F06 | 和解の兆し（対立度 20- かつ派閥間 bond 平均 60+） | A:後押し/B:自然/C:煽る | 軽〜中量 |
| F07 | リーダーの横暴（dictatorTag 条件成立） | A:認める/B:釘刺し/C:別幹部重用 | 中量 |
| F08 | 対立ヒートアップ（対立度 75+ 継続 4 週+） | A:直接対決/B:別興行/C:警告 | 中〜重量 |

**F02 再設計の影響:**
- F05 の分裂支援 B 分岐で「新派閥発生」→ それは `type: 'loyal'` で生成し、発生直後は抗争ではない。時間が経って F02 の条件を満たせば F02 が発火して抗争に入る（連鎖構造）
- F08 は「既に抗争中の派閥」が対象なので `_isHostile(f)` ベースで判定
- F06 和解成功 → `inHostility = false` + momentum=0 + 対立度 0 クリア（§9.6 の「和解成立」効果）

**実装パターン:**
- Phase 3a と同じ `_pendingFactionEvent` + `App.handleFactionEvent` 経由
- `pickWeeklyEvent` に F04〜F08 の検出ロジック追加（優先順は §8.3 準拠: F03 > F08 > F04 > F05 > F07 > F06 > F01/F02）
- auto-sim `autoHandleFactionEvent` にも F04〜F08 選択肢を追加
- RNG シード案: 0xFA43（F04）/ 0xFA53（F05）/ 0xFA63（F06）/ 0xFA73（F07）/ 0xFA83（F08）
- セリフ `src/data-faction-dialogue.js` に `FACTION_F04_*_LINES` 〜 `FACTION_F08_*_LINES` を追加

### 系統 A: 相関図の派閥ビューモード（§7.4）= Phase 3c

Phase 2 で一度実装したが**完全に撤回**済（理由は Phase 3 handoff に既述）。

- ネットワーク/フォーカス/勢力図に続く**第 4 ビューモード「派閥」**を新設
- `_relmapTick` に派閥重力項を追加：派閥メンバーを共通中心へ引き寄せ、非メンバーを中央へ弱引力
- 集約後に「派閥を囲う円」「王冠/星マーカー」「派閥名ラベル」「対立破線」を描画
- 差し込み点: `_relmapDrawFactionLayer()`（現状 no-op）+ `<g id="relmapFactionLayer">`
- 抗争中派閥は `_isHostile(f)` で判定して対立破線を引く（F02 再設計後は `type` 依存ではないので注意）

### 系統 C: 派閥絡みの bond/rivalry 変動カタログ = Phase 3d

派閥所属状態が週次 bond/rivalry 変動に影響するべきという spec 示唆。

- 現状: `processWeeklyMemberChanges` は bond/rivalry を書き換えない（加入/離脱判定のみ）
- 追加: 派閥内メンバー同士の bond 微上昇、抗争中派閥メンバー同士の rivalry 微増、寝返り候補の bond/rivalry 動的変動
- 新関数 `Engine.factions.processFactionInfluenceOnRelationships` を tickWeek 派閥パイプラインに挿入
- **注意**: 派閥の影響は**小さめ**から。auto-sim 大規模で振れ幅観察

---

## 次セッションの推奨スタート: Phase 3b

**理由**: F04〜F08 が動けば派閥ドラマが完成形に近づく。特に F04（寝返り）と F08（ヒートアップ）が抗争状態の出口・入口を埋めるので、F02 再設計の効果が実感できる。

Phase 3c（相関図）は物理シム改修でリスク独立、Phase 3d（数値連動）はバランス調整が重いのでそれぞれ別セッションを推奨。

---

## 次セッション開始時にやること

1. `git status` でブランチ確認（`feature/faction-system`）
2. `git log --oneline -10` で Phase 3a + F02 再設計コミット確認
3. **このファイル** と `specs/faction-system-spec-v0.1.md` §8〜§11 を読む
4. **Phase 3b の指示書** を Keisuke に書いてもらう or 提案する
5. 承認されたら実装に入る

---

## 事前に必ず読むべきドキュメント

1. **`CLAUDE.md`** — 感情設計、テンプレセリフ禁止、性格ごとの一人称/語尾/感情
2. **`specs/faction-system-spec-v0.1.md`** — 特に §8（発動制御）§9.4〜§9.8（F04-F08 カタログ）§11（セリフ方針）§17（v0.4 再設計記録）
3. **`src/factions.js`** — 全関数、特に `_isHostile` / `pickWeeklyEvent` / `applyF0XChoice`
4. **`src/data-faction-dialogue.js`** — Phase 3a の叩き台セリフ構造（性格6×アーキタイプ5の記法）
5. **`src/app.js handleFactionEvent`** — ディスパッチャの実装パターン
6. **`src/ui-common.js showFactionF01/F02/F03Modal`** — モーダル UI のシーン遷移パターン

---

## Phase 3b で触るファイル（予想）

| ファイル | 変更内容 |
|---------|---------|
| `src/factions.js` | F04〜F08 検出ロジック（`pickWeeklyEvent` 拡張）、`applyF04Choice` 〜 `applyF08Choice` |
| `src/ui-common.js` | `showFactionF04Modal` 〜 `showFactionF08Modal`（F01/F02 と同じ careOverlay パターン） |
| `src/app.js` | `handleFactionEvent` に F04〜F08 分岐追加 |
| `src/data-faction-dialogue.js` | F04〜F08 のセリフデータ追加（性格6×アーキタイプ5） |
| `test/auto-sim.js` | `autoHandleFactionEvent` に F04〜F08 選択肢追加 |
| `specs/faction-system-spec-v0.1.md` | §17 に Phase 3b 完了記録追記、v0.5 履歴 |

---

## 触ってはいけないもの

- Phase 1〜3a の `Engine.factions.*` の**既存関数シグネチャ**（追加 OK、変更 NG）
- `_isHostile(f)` の判定ロジック（v0.4 で統一したので改変すると整合崩壊）
- `G.factions` / `G.factionHostility` / `G.factionEventCooldowns` の**データ形状**
- F02 再設計の方針（`applyF02Choice` が派閥を新規作成しないこと）
- `calcMatchAppeal` の factionAppeal 分岐
- Phase 2 の派閥 UI 3ポイント（DBタブ/ポップアップバッジ/試合カードバッジ）

---

## Phase 3b で判断が必要な項目

- **F04 寝返りの演出重さ**: 中量 4 シーン（F01/F02 相当）で行くか、F03 寄りの軽量で行くか
- **F05 分裂支援 B 分岐の派閥生成タイミング**: モーダル選択直後に `createFaction` するか、効果適用を 1 週遅らせるか
- **F06 和解成功の後始末**: `inHostility` クリア + 対立度全消去だけで十分か、momentum リセット以外に bond 微上昇も付けるか
- **F07 dictatorTag の発動条件**: spec 上の条件がまだ曖昧（OVR 比 + 在籍期間 + authoritativeTag 保持が目安）
- **F08 ヒートアップの「直接対決 A」**: 既存の対抗戦/因縁戦スキームに乗せるか、専用のワンナイトイベントを作るか

---

## auto-sim での検証方針

- Phase 3b 実装後は 2 シード × 100 シーズンで ALL CLEAR 確認
- F04（寝返り）は派閥解散を誘発するのでロスター整合性（`validateGameState`）に注意
- F08（ヒートアップ）は対立度 75+ が継続するので自然減衰とのせめぎ合いでデッドロックしないか観察
- 選択肢ランダム化で極端な分布に偏らないか（全シード F04:A しか選ばないと寝返り効果が検証されない）

---

## CLAUDE.md 準拠チェック項目

- **テンプレセリフ禁止**: F04〜F08 のセリフは性格ごとに一人称/語尾/感情の出し方を変える
- **数値の丸見せ NG**: 対立度/勢いの生数字は出さない。既存のフレーバー変換（泥沼/血みどろ/隆盛/衰退）を活用
- **社長の視点**: 試合中の直接操作禁止と同様、派閥イベントも「社長の手が届く範囲」の選択肢のみ

---

## 備考

Phase 3a + F02 再設計を経て、派閥システムの骨格（発生・抗争・継承・消滅）は安定した。Phase 3b でドラマを肉付けし、Phase 3c/3d で可視化と数値連動を仕上げれば派閥システムは完成形。Phase 4 以降は DRAFT 項目（§9 の bond/rivalry 変動カタログ完全版、§10 ロスター運営への波及効果）を扱うことになる。
