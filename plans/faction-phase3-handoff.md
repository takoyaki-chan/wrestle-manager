# 派閥システム Phase 3 引き継ぎ

> **作成日**: 2026-04-22
> **前提コミット**: Phase 2 完了後（次セッション開始時に `git log` で確認）
> **ブランチ**: `feature/faction-system` を継続使用
> **参照 spec**: `specs/faction-system-spec-v0.1.md`（§17 に Phase 1/2 実装状況記載）

---

## これまでの進捗

### Phase 1 完了（2026-04-21, commit 64598d9）
バックエンド実装 + 閾値 v0.2 調整。

- `src/factions.js` 新設（~600行、27関数の `Engine.factions` ネームスペース）
- `G.factions` / `G.factionHostility` / `G.factionEventCooldowns` データモデル稼働
- §2〜§6 の検出/生成/加入離脱/週次減衰/解散/後継/calcMatchAppeal統合/validateGameState検証
- マイグレーション `_migrated_factions_v1` 済
- auto-sim 100シーズン ALL CLEAR
- 実プレイで「梅ヶ丘みのり組」が成立することをコンソール `[WM Faction]` 出力で確認済

### Phase 2 完了（2026-04-21〜22）
UI 実装の3ポイント。

- データベースに「🎭 派閥」サブタブ（`_dbSubTab=7`、`_renderDbFactions()`）
- 選手ポップアップの派閥バッジ + `openFactionPanel()` 遷移＋1.5秒ハイライト
- 試合カードの「🏴vs🏴」バッジ
- CSS トークン `--accent-faction-1〜4` / `--accent-hostility` / `--accent-faction-feud` を整備
- **相関図の派閥レイヤーは Phase 3 へ延期**（理由は下記）

---

## Phase 3 のスコープ（全体像）

spec の未実装項目を整理すると、Phase 3 に積み残っているのは以下の **4 系統**:

### 系統 A: 相関図の派閥ビューモード（§7.4）
Phase 2 で一度実装したが**完全に撤回**した。

- **撤回理由**: フォースシミュレーションは派閥メンバーを集約しないため、メンバー位置から描いた円は非メンバーを巻き込む巨大な円になり地理的に嘘をつく。円を外して 👑/⭐ マーカーだけ残すと「囲まれていないのに星だけ付いている」状態で逆に認識ノイズになる
- **Phase 3 方針**: ネットワーク/フォーカス/勢力図に続く**第4のビューモード「派閥」**を新設。物理シムの `_relmapTick` に派閥重力項を追加し、派閥メンバーを共通の中心へ引き寄せる。集約されたあとで初めて「派閥を囲う円」と「王冠/星マーカー」「派閥名ラベル」「対立破線」が地理的に意味を持つ
- **差し込み点は用意済**: `_relmapDrawFactionLayer()` 関数本体（現状 no-op）+ `<g id="relmapFactionLayer">` SVG レイヤー。ここを拡張すればよい
- **ビューモードボタン追加場所**: `_renderDbRelmap()` 内 `.rm-view-toggle` 周辺（現在3ボタン `network` / `focus` / `power` を4ボタンに）
- **状態変数**: `_relmapViewMode` に `'faction'` を追加。`_relmapSetViewMode('faction')` 呼び出しで切替
- **物理シム**: `_relmapTick` で `_relmapViewMode === 'faction'` 分岐を追加。派閥ごとに理想中心点を仮想的に配置（4つの対角象限など）、メンバーを各中心へ引力、非メンバーを中央へ弱い引力で寄せる

### 系統 B: F01〜F08 演出イベント（§8 / §9）
派閥が生成・変化する瞬間の**社長室モーダル型演出**。

| ID | トリガー | 選択肢 | 演出規模 |
|----|---------|-------|---------|
| F01 | 忠誠型結成条件成立 | A:権威化/B:拒否/C:静観 | 中量（4シーン） |
| F02 | 対立型結成条件成立 | A:派閥A中心/B:派閥B中心/C:調停/D:静観 | 中量 |
| F03 | リーダー喪失（退団/引退） | 自動分岐（選択肢なし） | 軽量 |
| F04 | 寝返り条件成立 | A:放置/B:面談/C:告げ口 | 中量 |
| F05 | 派閥内亀裂 | A:助言/B:分裂支援/C:静観 | 中量 |
| F06 | 和解の兆し | A:後押し/B:自然/C:煽る | 軽〜中量 |
| F07 | リーダーの横暴 | A:認める/B:釘刺し/C:別幹部重用 | 中量 |
| F08 | 対立ヒートアップ | A:直接対決/B:別興行/C:警告 | 中〜重量 |

- **発動制御**: §8.2 の確率・クールダウン（`FACTION_CONFIG.eventProbability` / `eventCooldown` に値は既に入っている）
- **競合解決**: §8.3 の優先順位（F03 > F08 > F04 > F05 > F07 > F06 > F01/F02）
- **差し込み点**: `tickWeek` の派閥週次パイプライン（`reconcileRoster` → 形成チェック → `processWeeklyMemberChanges` → hostility/momentumDecay → `checkDissolutionConditions`）。Phase 1 時点では「形成チェック」は確率無視で即生成しているが、Phase 3 で F01/F02 の確率判定 + モーダル経由に書き換える
- **モーダル UI**: 既存 `careOverlay` を流用すべきか、新規コンポーネントを立てるかは要検討。既存の大型イベント（B1-B4）や契約交渉のフローを参考にする
- **効果適用**: §9.x の各選択肢ごとの trust/bond/rivalry/勢い/対立度変動。これは `Engine.factions` に新 API を追加して純粋関数として実装（UI から呼ぶ）

### 系統 C: 派閥絡みの bond/rivalry 変動カタログ
F系イベント以外に、**派閥所属状態そのもの**が週次の bond/rivalry 変動に影響するべきという spec の示唆。

- **現状**: Phase 1 の `processWeeklyMemberChanges` は bond/rivalry を**書き換えない**（加入/離脱判定のみ）。`processWeeklyDecay` は派閥概念を知らずに bond/rivalry を減衰する
- **Phase 3 で追加**: 派閥内メンバー同士の bond 維持/上昇、対立派閥メンバー同士の rivalry 増加、寝返り候補の bond/rivalry 動的変動 など
- **影響範囲**: `src/relationships.js` の `processWeeklyDecay` か、`src/factions.js` に新関数 `processFactionInfluenceOnRelationships` を作って tickWeek 派閥パイプラインに挿入
- **注意**: bond/rivalry は既に複雑に絡み合っているので、派閥の影響は**小さめ**から始めて auto-sim で振れ幅を観察すること

### 系統 D: セリフデータ（§11）
性格6種 × アーキタイプ6種 × イベント種別（F01〜F08 の各選択肢）= 膨大。

- **spec の指示**: 最低 2〜3 パターン／組合せ
- **格納場所候補**: `src/data-faction-dialogue.js` 新規ファイル（推奨）または `src/data.js` 追記
- **spec §11 に例示セリフ（bold/normal, earnest/normal, quiet/cool, emotional/ojousama の4組）があるので叩き台にできる**
- **CLAUDE.md の鉄則**: テンプレセリフ禁止、一人称/語尾/感情の出し方を性格ごとに変える
- **ボリューム目安**: F01 だけでも 6×6×2〜3 = 72〜108 セリフ。全8イベントで 600〜800 セリフ規模

---

## Phase 3 の分割提案

全部を1セッションで片付けるのは非現実的。次のように分割を推奨:

### 案 1: 機能軸で分ける（推奨）
- **Phase 3a（演出の土台）**: F01/F02/F03 の 3 イベント + モーダル UI 基盤 + セリフ20〜30本（叩き台）。派閥誕生と消滅という最重要3点を動かす
- **Phase 3b（演出の拡充）**: F04〜F08 の5イベント追加 + セリフを各性格×アーキタイプに拡張
- **Phase 3c（相関図派閥ビューモード）**: 系統 A 単独。物理シム改修があるのでリスクを分離
- **Phase 3d（bond/rivalry 連動）**: 系統 C 単独。数値チューニングに auto-sim を多く回す必要あり

### 案 2: レイヤー軸で分ける
- **Phase 3a**: 系統 A（相関図）+ 系統 C（bond連動）= エンジン寄りの変更をまとめて
- **Phase 3b**: 系統 B（イベント UI）+ 系統 D（セリフ）= UI と文字量が多い変更

**案 1 の Phase 3a を最優先で推奨**: プレイヤーが「派閥が生まれた！」「リーダーがいなくなった！」というドラマを体験できる最低限が揃う。F04〜F08 は無くても派閥の骨格は成り立つ。

---

## 次セッション開始時にやること

1. `git status` でブランチ・作業状況を確認（`feature/faction-system` にいるはず）
2. `git log --oneline -20` で Phase 1/2 のコミットを確認
3. **このファイル** と `specs/faction-system-spec-v0.1.md` §8〜§11 を読む
4. **Phase 3a の指示書**（plans/faction-phase3a-task.md）を Keisuke に書いてもらう or 提案する
5. 承認されたら実装に入る

---

## 事前に必ず読むべきドキュメント（次セッション）

Phase 3a を例にすると:

1. **`CLAUDE.md`** — 感情設計、テンプレセリフ禁止、性格ごとの一人称/語尾/感情
2. **`specs/faction-system-spec-v0.1.md`** — 特に §8（発動制御）§9（イベントカタログ）§11（セリフ方針）
3. **`src/factions.js`** — Phase 1 の Engine.factions 全関数
4. **`src/management.js` tickWeek の派閥週次パイプライン** — F01/F02 の現状「確率無視で即生成」箇所を特定
5. **既存の大型イベント実装**（B1〜B4）— careOverlay/モーダル UI の実装パターン
6. **契約交渉イベント実装** — 1対1対話の UI パターン（参考）
7. **spec §11 叩き台セリフ** — 4組の例示

---

## Phase 3a で触るファイル（予想）

| ファイル | 変更内容 |
|---------|---------|
| `src/factions.js` | F01/F02 確率判定 API、F03 モーダル用データ準備 API、各選択肢の効果適用 API |
| `src/management.js` | tickWeek 派閥パイプライン：F01/F02 モーダル経由に書き換え、F03 フック |
| `src/ui-render.js` or `src/ui-common.js` | F01/F02/F03 モーダル UI（既存 careOverlay 流用 or 新規） |
| `src/data-faction-dialogue.js` | 新規ファイル：性格×アーキタイプ×イベント選択肢のセリフ叩き台（F01/F02/F03 のみ） |
| `src/app.js` | モーダル選択結果を Engine.factions に渡すディスパッチャ |
| `src/index.html` | 必要に応じて CSS 追加 |
| `specs/faction-system-spec-v0.1.md` | §17 Phase 3a 完了記録追記 |

---

## 触ってはいけないもの

- Phase 1 の `Engine.factions.*` の**既存関数シグネチャ**（追加はOK、変更はNG）
- Phase 2 の派閥 UI 3ポイント（DBタブ/ポップアップバッジ/試合カードバッジ）
- `G.factions` / `G.factionHostility` / `G.factionEventCooldowns` の**データ形状**
- `calcMatchAppeal` の factionAppeal 分岐
- `src/relationships.js` の bond/rivalry 計算式本体（派閥連動は新しい関数として追加）

---

## Phase 3 全体での未解決・判断が必要な項目

- **モーダル UI**: careOverlay 流用 vs 専用コンポーネント新設 — 次セッション冒頭で決める
- **F01/F02 の発動タイミング**: 条件成立週の tickWeek 内で即モーダル、それとも翌週のゲーム開始時？ spec では曖昧
- **F03 の演出量**: spec は「軽量版。ナレーション中心＋残メンバー1人のセリフ」とあるが、具体的にどれだけ重くするか
- **セリフのスケール**: Phase 3a の叩き台は最低限（各性格1パターンのみ）でも良いか、それとも全性格×全アーキタイプ網羅を要求するか
- **Phase 3c（相関図）のタイミング**: Phase 3a/3b と独立させて単独セッションで扱うか、3a の演出が落ち着いた後にサブセッションで扱うか

---

## 注意事項

- **auto-sim**: Phase 3a/3b は確率判定＋UI 分岐が主なので、auto-sim でプレイヤー判断をランダム自動化するときの**選択肢ランダム化**実装が追加で必要になる可能性
- **バランス検証**: 派閥イベントは trust/bond/rivalry/勢い/対立度 の5パラメータに同時に効くので、auto-sim で大規模（100シード×100シーズン）を回して破綻がないか見る
- **CLAUDE.md の数値哲学**: 「単純計算で済ませない」「数値の丸見せによるスプレッドシートゲーム化 NG」— 派閥効果もこれに従う
