# 派閥システム Phase 3c / 3d 引き継ぎ

> **作成日**: 2026-04-22
> **前提コミット**: `6fd13ec feat(faction): Phase 3b F04-F08 演出 + セリフ 6x6 + F08 直接対決ディレクティブ`
> **ブランチ**: `feature/faction-system` を継続使用
> **参照 spec**: `specs/faction-system-spec-v0.1.md` (現行 v0.5、§17 に Phase 1〜3b 実装状況記載)

---

## これまでの進捗まとめ

派閥システムは**骨格＋ドラマ演出まで完成**しており、残るは「可視化」と「数値連動」の2項目のみ。

### Phase 1 完了（commit 64598d9, 2026-04-21）
バックエンド土台 —`src/factions.js` 新設、`G.factions` / `G.factionHostility` / `G.factionEventCooldowns` 稼働、検出/加入離脱/週次減衰/解散/後継/`calcMatchAppeal` 統合/`validateGameState` 検証/マイグレーション完了。auto-sim 100シーズン ALL CLEAR。

### Phase 2 完了（commit 05cd1b9 に同梱, 2026-04-21〜22）
- DB「🎭 派閥」サブタブ（`_dbSubTab=7`、`_renderDbFactions()`）
- 選手ポップアップ派閥バッジ + `openFactionPanel()` 遷移＋1.5秒ハイライト
- 試合カード「🏴vs🏴」バッジ
- CSS トークン `--accent-faction-1〜4` / `--accent-hostility` / `--accent-faction-feud`
- **相関図レイヤーは Phase 3c に全面延期**（no-op として差し込み点のみ残置）

### Phase 3a 完了（commit cca7600, 2026-04-22）
F01/F02/F03 の 4シーン careOverlay モーダル + セリフ叩き台 + ディスパッチャ + auto-sim ランダム応答。`_pendingFactionEvent` transient パターン確立。

### F02 再設計 v0.4（commit 05cd1b9, 2026-04-22）
「対立型派閥を無から同時発生」→「**既存 2 派閥間の抗争勃発**」に方針転換。
- `_isHostile(f) = type === 'rivalrous' || inHostility === true`（後方互換ヘルパ）
- 派閥は基本 `type: 'loyal'` のみ生成、抗争は `inHostility:true` フラグ管理
- 対立度が両方向 0 になると `inHostility` 自動クリア＝抗争終了

### Phase 3b 完了（commit 6fd13ec, 2026-04-22, spec v0.5）
F04〜F08 演出・セリフ・選択肢効果、**F08-A 直接対決フル実装**（次興行カード強制組込み + 集客 +15〜20 + 試合後 1.5× 反映）。セリフは性格 6 × アーキタイプ 6（normal フォールバック）。auto-sim 2 シード × 100 シーズン ALL CLEAR。

---

## Phase 3 残スコープ（2 系統）

### Phase 3c: 相関図の派閥ビューモード（§7.4）

**背景**: Phase 2 で一度実装したが、「フォースシミュは派閥メンバーを集約しないため、メンバー位置から描いた円は非メンバーを巻き込んだ巨大な円になり地理的に嘘をつく」「円を外して 👑/⭐ マーカーだけ残すと『囲まれていないのに星だけ付いている』状態で逆に認識ノイズ」と判断し、完全に撤回した。

**Phase 3c の方針**:
ネットワーク/フォーカス/勢力図に続く**第 4 ビューモード「派閥」**を新設する。これを選ぶと:

1. 物理シム `_relmapTick` に**派閥重力項**が加わり、各派閥メンバーが派閥固有の中心点へ引き寄せられる
2. 非派閥メンバーは画面中央へ弱い引力（画面から消えない）
3. 集約が落ち着いたタイミングで「派閥を囲う円」「派閥名ラベル」「リーダー 👑 / 幹部 ⭐」「対立中派閥間のオレンジ破線」が**地理的に意味を持って**描画される

**実装ポイント**:

- 差し込み点は用意済: `_relmapDrawFactionLayer()` 関数本体（現状 no-op）+ `<g id="relmapFactionLayer">` SVG レイヤー
- ビューモード切替ボタン: `_renderDbRelmap()` 内 `.rm-view-toggle` に 4 番目のボタン「🎭 派閥」を追加
- 状態変数 `_relmapViewMode` に `'faction'` 追加、`_relmapSetViewMode('faction')` ハンドラ
- 派閥ごとの理想中心点配置: 画面を派閥数で分割（2派閥なら左右、3派閥なら三角、4+は半径固定の円周配置）
- 抗争中（`_isHostile(f)`）派閥間にオレンジ破線（太さ 1.5〜3.5px・数値ラベルなし）
- F02 再設計後は `type` 依存ではなく `_isHostile(f)` を使うこと（`type === 'rivalrous'` チェックは legacy になっているので注意）

**判断が必要な項目**:

- **デフォルトの画角調整**: 派閥集約後の円が画面からはみ出さないよう、派閥モード時はズーム倍率を動的に調整するか、それとも物理シムのばね定数を強めて画面内に収めるか
- **派閥に所属していない選手の扱い**: 中央にまとめる / 画面端に退避 / 非表示 / 小さく薄く描画
- **抗争相手がいない loyal 派閥**: 円で囲むだけか、それとも対立破線がないのでよりシンプルな表示にするか
- **ビューモード切替時のトランジション**: 他のモード切替と同じく `_relmapReheat()` で物理シムを温め直すだけか、派閥中心点へのスムーズ補間を入れるか

**触ってはいけない領域**:

- `_relmapTick` のネットワーク/フォーカス/勢力図 3 モード分岐（`_relmapViewMode === 'faction'` の条件で**別枝**を追加する）
- フォースシミュの既存パラメータ（ばね定数、反発力、alpha減衰など）
- `_relmapRender` の既存描画ループ（派閥レイヤーは独立 `<g>` に描画）

---

### Phase 3d: bond/rivalry 連動カタログ

**背景**: 現状の派閥週次処理は bond/rivalry を**書き換えない**。加入/離脱は bond 閾値を**読む**だけで、派閥所属状態が bond/rivalry に**フィードバック**しない。これだと派閥という構造が関係性に還元されない「飾り」になってしまう。

**Phase 3d で実装する候補効果**:

| 効果 | 対象 | 変動量案 🔧 | 発火タイミング |
|------|------|-----------|--------------|
| 派閥内結束ボーナス | 同派閥メンバー同士の bond | +0.15/週 | 週次 |
| 抗争越境敵意 | 抗争中派閥メンバー同士の rivalry | +0.3/週 | 週次 |
| 権威化派閥の下向き圧 | `authoritativeTag` 派閥のリーダー → メンバー方向 bond | +0.1/週、メンバー → リーダー方向は ±0 | 週次 |
| 独裁化の亀裂 | `dictatorTag` 派閥メンバー同士の rivalry | +0.2/週（水面下の不満） | 週次 |
| 寝返り候補の磁力 | 敵対派閥メンバーとの bond 平均 60+ 選手の rivalry | リーダー向け +0.5/週 | 週次 |
| 派閥消滅の余波 | 消滅時、元メンバー全員の bond に -5〜-10 | 離散的 | 消滅イベント時 |

**実装場所**:

- 新関数 `Engine.factions.processFactionInfluenceOnRelationships(state, rng)` を `src/factions.js` に追加
- tickWeek 派閥パイプラインに挿入: `processWeeklyMemberChanges` の**後**、`processWeeklyHostilityDecay` の**前**に置くのが自然
- 既存 `Engine.relationships` の関数シグネチャは触らない（読み取り＋書き戻しだけ）
- RNG シード新設候補: 0xFA19 あたり

**判断が必要な項目**:

- **どれだけ実装するか**: 上記 6 カテゴリ全部 / コア 3 つだけ（派閥内結束・抗争越境敵意・寝返り磁力）/ 段階的に 1 つずつ
- **効き幅の強度**: 1 シーズン（52 週）で bond/rivalry がどこまで動くかを先に数値目標決めてから実装
- **既存システムへの影響**: 派閥所属選手は既に `processWeeklyDecay` で bond/rivalry が動いている。派閥効果を加算するか、派閥効果側で既存減衰を**打ち消す**か（後者のほうが派閥所属が「定着」して見える）
- **バランス検証**: auto-sim 100×100 で、派閥所属選手の bond/rivalry 分布が極端に歪まないか観察

**注意事項**:

- CLAUDE.md「安易な数値加減算によるイベント処理」禁止。**なぜその係数なのか**を常に問う
- 派閥の影響は**小さめから**始めて auto-sim で振れ幅を見てからチューニング
- 数値が大きすぎると派閥所属選手だけが bond/rivalry 極値に張り付くゲームになり、非派閥選手との断絶が生まれる

---

## どちらを先にやるか

### 推奨: **Phase 3c → Phase 3d** の順

**理由 1**: Phase 3c は純粋に UI レイヤーの追加で、既存のエンジン数値に影響しない。バランス崩壊リスクなし

**理由 2**: Phase 3d はバランス調整が主題で、auto-sim 大規模（100×100 以上）を何度も回すことになる。一度腰を据える必要があり、Phase 3c のような短期タスクと同居しづらい

**理由 3**: 相関図に派閥が見えるようになると、Phase 3d の数値連動が「派閥内の絆が育っている」「抗争がエスカレートしている」と**可視的に実感できる**。順序が逆だと数値だけ動いて誰も気付けない

**例外的に 3d を先にやりたいケース**:
- 「現状の派閥効果が全試合に均一に効きすぎて違和感がある」等、既存プレイで数値連動の不在がすでに問題化している
- 相関図 UI のリファクタがブロッカーになっている（派閥レイヤー追加のためにまず相関図を整理したい、等）

---

## 次セッションの開始手順

1. `git status` でブランチ確認（`feature/faction-system`）
2. `git log --oneline -10` で Phase 3b 完了まで確認
3. **このファイル** + `specs/faction-system-spec-v0.1.md` §7.4 / §17 を読む
4. Phase 3c か 3d を選び、指示書を `plans/faction-phase3c-task.md`（または `3d-task.md`）として書き出してもらう
5. 承認後に実装開始

---

## 事前に必ず読むべきドキュメント

### Phase 3c（相関図）を選ぶ場合

1. **`CLAUDE.md`** — UI 実装ルール（`docs/ui/01-foundations.md` トークン必須）
2. **`specs/faction-system-spec-v0.1.md §7.4`** — 派閥レイヤー仕様の原案
3. **`src/ui-render.js`**:
   - `_renderDbRelmap()`（SVG 構造、`.rm-view-toggle`）
   - `_drawRelmapAfterRender()`（初期化）
   - `_relmapTick()`（ネットワーク/フォーカスの物理シム分岐、派閥モードはここに追加）
   - `_relmapSetViewMode()`（モード切替ハンドラ）
   - `_relmapDrawFactionLayer()`（Phase 3c 差し込み点、現状 no-op）
4. **Phase 2 時代の撤回実装**（参考）: git log で `05cd1b9` の `ui-render.js` 変更を見ると、当時の「重心円＋👑/⭐マーカー」実装の骨が残っている

### Phase 3d（bond/rivalry 連動）を選ぶ場合

1. **`CLAUDE.md`** — 数値哲学「単純計算で済ませない」「安易な加減算 NG」
2. **`specs/faction-system-spec-v0.1.md §9`** — 派閥関連 bond/rivalry 変動の spec 示唆
3. **`src/factions.js`**:
   - `processWeeklyMemberChanges`（加入/離脱判定、bond を読むだけ）
   - `processWeeklyHostilityDecay`（対立度減衰、bond 平均を読むだけ）
   - `_isHostile(f)`（抗争判定ヘルパ、Phase 3d でも多用する）
4. **`src/relationships.js`**:
   - `Engine.relationships.processWeeklyDecay`（既存の bond/rivalry 週次処理、派閥と干渉する可能性がある部分）
5. **`memory/v2.0-phase1-7.md`**（もしあれば）— 過去のバランス調整履歴

---

## 触ってはいけないもの（両 Phase 共通）

- `Engine.factions.*` の**既存関数シグネチャ**（追加 OK、変更 NG）
- `_isHostile(f)` の判定ロジック（v0.4 の統一ヘルパ、改変すると整合崩壊）
- `G.factions` / `G.factionHostility` / `G.factionEventCooldowns` のデータ形状
- F02 再設計の方針（`applyF02Choice` が派閥を新規作成しないこと）
- `calcMatchAppeal` の factionAppeal 分岐（§6）
- Phase 2 の派閥 UI 3 ポイント（DBタブ/ポップアップバッジ/試合カードバッジ）
- Phase 3a/3b の F01〜F08 モーダル UI と選択肢効果適用ロジック

---

## 備考

Phase 3c/3d が完了すると派閥システムは**v1.0 完成**と呼べる状態になる。残るは:

- **Phase 4**（未計画）: §10 ロスター運営への波及効果（派閥所属が契約交渉・給与要求・育成方針に影響する等）
- **v0.x 整理**: 現在 v0.1 〜 v0.5 の履歴が §17 に積み重なっているので、v1.0 リリースタイミングで spec を整理・統合する
- **実プレイ反応待ち**: Keisuke さんの長期プレイで派閥イベントのバランス/頻度/セリフ品質を見て、必要に応じて 3e, 3f... としてパッチしていく

Phase 3c/3d のどちらを先に選んでも、もう一方が Phase 3 のラストピースになる。どちらも独立しているので**どちらを先にしても他方に破壊的影響はない**。
