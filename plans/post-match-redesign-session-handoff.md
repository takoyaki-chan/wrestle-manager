# 試合後画面 Pattern B 統一リファクタ — セッション間引き継ぎ

**ファイル**：`plans/post-match-redesign-session-handoff.md`
**最終更新**：2026-04-23（Phase 2 完了時点）
**作業ブランチ**：`feature/post-match-stage-redesign`

---

## 現在の進行状況

| Phase | 対象画面 | 状態 | コミット |
|---|---|---|---|
| 1 | 通常興行 / 特別興行（`renderShowResult`） | ✅ 完了 | `93868a8` |
| 2 | PPV GRAND FINAL / PPV TV観戦（`renderPPVResult` / `renderPPVTVResult`） | ✅ 完了 | `5d3590d` |
| 3 | 対抗戦最終 / 対抗戦進行（`renderWarFinalResult` / `renderWarMatchPreview`） | ✅ 完了 | （次コミット） |
| 4 | JT各試合 / JT優勝 / B3挑戦状 / B2対立決着 | ⏳ 未着手 | — |

**次セッションで Phase 3 から再開**。元ハンドオフは `plans/post-match-redesign-handoff.md`（Phase 3-4 の指示文が §6, §7）。

---

## 必読ドキュメント（次セッション開始時に必ず読む）

1. `CLAUDE.md`（プロジェクト全体ルール、UI実装ルール）
2. `docs/ui/01-foundations.md`（階層1：Stage カテゴリ）
3. `docs/ui/02-layouts.md`（階層2：P7 Theatrical）
4. `docs/ui/03-screens/show-result-spec.md`（階層3：マスター画面仕様書）
5. `plans/post-match-redesign-handoff.md`（元ハンドオフ、Phase 3-4 の指示文）
6. `docs/ui/mockups/show-result-pattern-b.html`（モックアップ正本、V1/V2/V3）

---

## これまでに確立したもの（Phase 3-4 でそのまま使う）

### 1. Stage トークン（`src/index.html :root`、行9付近）

```css
--stage-bg: #060606;
--stage-bg-deep: #000000;
--stage-panel: rgba(20,18,15,0.62);
--stage-panel-deep: rgba(10,9,7,0.80);
--stage-border: rgba(200,190,170,0.08);
--stage-border-lit: rgba(212,168,67,0.22);
--stage-border-main: rgba(212,168,67,0.42);
--stage-text-main: #e8e6e0;
--stage-text-sub: rgba(232,230,224,0.55);
--stage-text-dim: rgba(232,230,224,0.28);
--stage-text-quiet: rgba(232,230,224,0.16);
--gold-deep: #b8912e;
--c-positive: var(--accent-faction-4);  /* 緑 */
--c-warning:  var(--accent-hostility);  /* 橙 */
--c-negative: #c0524a;                   /* 赤 */
--c-info:     var(--accent-faction-2);  /* 青 */
--c-rivalry:  #e17055;                   /* 因縁サーモン */
--font-display / --font-label / --font-body
```

### 2. `.pb-*` 共通 CSS（`src/index.html` 2378行付近〜約290行）

以下のクラス群はすでに定義済み。**新規追加するときは必ず `--stage-*` / `--c-*` / `--gold*` トークン経由で書く。ハードコード16進カラー禁止。**

- `.pb-overlay` / `.pb-container` — 骨格（`:has(.pb-container)` で自動 pb-mode）
- `.pb-banner` / `.pb-live[.is-special|.is-ppv|.is-ppvtv]` / `.pb-banner-title[.is-special|.is-ppv|.is-ppvtv]` / `.pb-banner-sub`
- `.pb-score-strip` / `.pb-score-cell[.is-attend]` / `.pb-score-val[.is-neutral]` / `.pb-score-lbl`
- `.pb-score-attend-bar` / `.pb-score-attend-bar-fill[.is-sellout|.is-good|.is-neutral|.is-weak|.is-empty]`
- `.pb-score-attend-venue` / `.pb-score-attend-rating[.is-sellout|.is-good|.is-neutral|.is-weak|.is-empty]`
- `.pb-score-stars` / `.pb-stars .star[.on]`
- `.pb-divider[.is-main]` — セクション区切り、`.is-main` で金強調
- `.pb-matches` / `.pb-mrow[.is-main[.is-ppv]][.has-dialogue]` — 試合行、grid 3列（1fr 240px 1fr）
- `.pb-fighter[.is-left|.is-right][.is-winner|.is-loser|.is-draw][.is-tag]`
- `.pb-portrait-wrap` / `.pb-portrait` / `.pb-portrait-placeholder`
- `.pb-fighter-info` / `.pb-fighter-name` / `.pb-fighter-meta` / `.pb-fighter-ovr .val/.lbl`
- `.pb-result` / `.pb-result-vs` / `.pb-result-winner[.is-draw]` / `.pb-result-finish[.sub]` / `.pb-result-turns` / `.pb-result-mq*`
- `.pb-mrow-tags` / `.pb-tag[.is-first|.is-title|.is-rivalry|.is-spotlight|.is-stale|.is-tag]`
- `.pb-hp-mini[-half/-label/-val/-track/-fill[.is-healthy|.is-warning|.is-danger]]`
- `.pb-dialogue` / `.pb-dialogue-speaker[.is-winner|.is-loser|.is-draw]` — 肖像真上、しっぽ下向き
- `.pb-injury` / `.pb-injury-label` / `.pb-injury-item .type/.name`
- `.pb-coach-praise` / `.pb-coach-praise-label` / `.pb-coach-praise-text .coach-name`
- `.pb-footer` / `.pb-footer-heat .val[.is-hot|.is-cold]` / `.pb-close-btn`
- `.pb-tag-members` / `.pb-tag-member[.is-finisher|.is-pinned]` / `.pb-tag-member-name/-ovr/-badge`

### 3. 再利用可能な JS ヘルパー（`src/ui-common.js`）

Phase 1 で追加、Phase 2 で再利用済み。**Phase 3-4 ではそのまま使う**：

```js
escHtml(s)                                         // HTML エスケープ（行 7付近）
_pbAttendClass(occRate)                            // 動員率 → is-sellout 等
_pbStars(mq)                                       // MQ → ★ × 5
_pbPortraitImg(fighter)                            // upper 画像 or プレースホルダー
_pbFighterBlock(side, fighter, stateCls, metaText, dialogueLine)
_pbTagFighterBlock(side, members, stateCls)        // タッグ 2選手横並び
_pbResultColumn({winnerLabel, winnerIsDraw, finishText, turns, mq})
_pbHpMini(hpL, hpR)                                // {final,max} オブジェクト
_pbInjuryBlock(injuries)
```

### 4. `:has()` セレクタによる pb-mode 自動適用

`.show-result-overlay:has(.pb-container)` で pb 化。**他 Phase の関数が pb-container を出力しなければ自動で Stage トーンにならない**。pb-mode クラス管理不要。

Phase 3-4 の関数は最終的に全て `.pb-container` を出力するため、移行完了後は全画面が自動で Stage トーンになる。

---

## Phase 3 対象（対抗戦）

### ファイル位置

- `src/ui-common.js:448` `renderWarFinalResult(ev, results, playerWins, aiWins, eventWon)`
- `src/ui-common.js:295` `renderWarMatchPreview()`

### 仕様書参照

- `docs/ui/03-screens/show-result-spec.md` §5-5, §5-6
- `plans/post-match-redesign-handoff.md` §6

### 設計ポイント（暫定）

**#5 対抗戦最終結果（`renderWarFinalResult`）**
- バナー: `⚔ WAR` バッジ（敵団体カラー背景）+ `対 抗 戦 結 果`
- スコアボード 5カラム: 動員 / 我方N勝-敵方M勝 / 勝敗（🏆勝ち越し/⚖引き分け/💀負け越し）/ 平均MQ / Heat変動
- 試合行: 5試合をメイン→降順表示、所属団体色アクセントボーダー（`.is-player-side` / `.is-enemy-side` クラスを新設）
- 各試合の勝者にセリフ（`WAR_VICTORY_LINES[personality][archetype]`）
- 敵エースセリフセクション（既存 `.ace-area` を Pattern B 化）→ **U-03: 実装前にモックアップ簡易作成して相談（停止条件該当）**
- 閉じるボタン: `closeWarFinalResult(eventWon)` 既存関数

**#6 対抗戦進行画面（`renderWarMatchPreview`）**
- バナー: #5 と同じ
- スコアボード: 動員 / 現在スコア（例 `2-1`）/ 残り試合数 / 次試合選手名 / 合計MQ
- 試合行の3状態:
  - `.pb-mrow.is-resolved`（完了）: コンパクト、勝者セリフ1つ（`result.victoryLine`）肖像真上
  - `.pb-mrow.is-upcoming`（次試合）: Pattern B 標準、両者試合前セリフ（`pickDialogueLine(PPV_OPPONENT_LINES, ...)`）
  - `.pb-mrow.is-pending`（未消化）: 超コンパクト、選手名のみグレー
- 次へボタン: 「次の試合へ →」

### 追加が必要な CSS（予想）

```css
.pb-live.is-war { /* 敵団体カラー背景バッジ */ }
.pb-banner-title.is-war { /* War 用タイトル */ }
.pb-fighter.is-player-side { /* 左アクセントボーダー青 */ }
.pb-fighter.is-enemy-side { /* 右アクセントボーダー敵団体色 */ }
.pb-mrow.is-resolved { /* padding 小 */ }
.pb-mrow.is-upcoming { /* 通常 Pattern B */ }
.pb-mrow.is-pending { /* padding 最小、グレーアウト */ }
.pb-ace-area { /* 敵エースセリフブロック、独立セクション */ }
```

### Phase 3 停止条件（要相談）

- **U-03**: 敵エースセリフセクションのレイアウト（暫定：既存 `.ace-area` を Stage カラーに寄せる方式で問題ないか実装前に簡易モック確認）
- **対抗戦進行画面の3状態レイアウト**: 実装中に複雑化した場合は止めて相談

---

## Phase 4 対象（JT + B3 + B2）

### ファイル位置

- `src/ui-common.js:10287` `renderJuniorTournamentMatchResult(ri, mi)`
- `src/ui-common.js:10404` `renderJuniorTournamentResult()`
- `src/ui-common.js:8188` `_renderB3MatchResult(event, matchResult, playerFighter, challenger)`
- `src/ui-common.js:8384` `_renderB2MatchResult(event, matchResult, f1, f2, interventionChoice)`

### 仕様書参照

- `docs/ui/03-screens/show-result-spec.md` §5-7 〜 §5-10
- `plans/post-match-redesign-handoff.md` §7

### 設計ポイント（暫定）

**#7 JT 各試合結果**
- バナー: `🥇 JUNIOR TOURNAMENT` + ラウンド名（`準々決勝`/`準決勝`/`🏆 決勝`）
- スコアボード: ブラケット縮小表示 / Match N/7 / MQ / フィニッシュカテゴリ
- 試合行: 1試合のみ `.pb-mrow.is-main.is-jt`
- 勝者セリフ: `getJuniorTournamentLine('postMatchWin', ...)`
- フッター: 「次の試合へ →」 or 「優勝発表へ →」

**#8 JT 優勝発表**（他画面と構造が違う、**U-04 既決: Ceremony化しない、Pattern B 準拠**）
- **実装前に簡易モックアップ作成してレビュー（停止条件該当）**
- バナー: `🏆 JT CHAMPION` + 「第N回 ジュニアトーナメント 優勝」
- スコアボード: 平均動員 / 優勝者通算MQ / 勝ち上がりパス（例 `QF→SF→F`）/ 賞金 / 新王者OVR
- 優勝者カード: `.pb-mrow.is-main.is-champion` 1枚、肖像150×225 + 3重金ボーダー + CHAMPION ラベル（40px Bebas）+ 金枠強調スピーチバブル
- 準優勝・3-4位: 下部に `.pb-mrow.is-sub.is-runnerup` / `.is-semifinalist` 小型表示
- 閉じるボタン: 「閉じる」

**#9 B3 挑戦状**
- バナー: `⚔ CHALLENGE MATCH`（敵団体色）+ `挑戦状 — 結果`
- スコアボード 4カラム: 対戦団体名 / 結果 / MQ / バフ獲得有無
- 試合行 1つ `.pb-mrow.is-main.is-b3`、所属団体を meta 表示
- 勝者セリフのみ
- フッター: バフ詳細 + 「了解」

**#10 B2 対立決着**
- バナー: `💥 CONFLICT RESOLUTION`（紫系）+ `決着の試合 — 結果`
- スコアボード 4カラム: 介入選択（激励/放置）/ 結果 / MQ / Bond/Rivalry 変動
- 試合行 1つ `.pb-mrow.is-main.is-b2`、両者ロスター内で meta 省略
- 両者セリフ
- フッター: 関係性変動サマリ + 「了解」

### Phase 4 コミット分割

handoff §7-3 の指示通り、小コミットに分ける：
- `feat(post-match): Phase 4a — JT各試合を Pattern B に`
- `feat(post-match): Phase 4b — JT優勝発表を Pattern B に`
- `feat(post-match): Phase 4c — B3挑戦状を Pattern B に`
- `feat(post-match): Phase 4d — B2対立決着を Pattern B に`

### Phase 4 停止条件（要相談）

- **#8 JT 優勝発表**: 1人フォーカスで構造が他と違うため、**実装前に簡易モックアップ作成してレビュー（停止条件該当）**
- ブラケット縮小表示（`.jt-*` 既存CSS借用か、新 `.pb-bracket-mini` 作るか）

---

## Phase 1/2 で発見した Gotcha（Phase 3-4 で踏まないよう注意）

### G1: `escHtml` はプロジェクト全体にはない

`battle-engine-main.js` に存在するが、他から呼べない。Phase 1 で `src/ui-common.js` 冒頭（clamp の直後）にローカル定義済み。**Phase 3-4 でもそのまま `escHtml()` を呼べる**。

### G2: `:has()` セレクタで pb-mode 自動適用

`overlay.classList.add('pb-mode')` は不要。`.pb-container` を出力すれば自動で Stage トーンになる。Phase 1 で導入済み（`src/index.html:541`）。

### G3: 旧 CSS は Phase 対象関数と 1:1 対応していない

- `.sr-*` / `.show-attend-*` / `.show-summary-bar` / `.show-results-area` → Phase 1 で削除済み（renderShowResult 専用）
- `.show-header` / `.show-label` / `.show-title` → **`renderMatchPreview` で今も使用中、削除禁止**（Phase 対象外画面）
- `.ppvtv-*` → Phase 2 では**未削除で残存**、Phase 4 完了時にまとめて削除予定
- `.ace-*` / `.war-md-*` / `.jt-*` → Phase 3/4 完了まで残す。削除前に必ず `grep -rn` で参照確認

### G4: `.sr-close-btn` 委譲ハンドラ（`ui-common.js:76`）

セレクタを `.pb-close-btn, .sr-close-btn` に更新済み。Phase 3-4 の close ボタンも `.pb-close-btn` クラスを使えば委譲が効く（ただし現状は onclick 属性で直接呼んでいるので委譲は保険）。

### G5: Screenshot timeout

`mcp__Claude_Preview__preview_screenshot` は巨大ページで頻繁にタイムアウトする。`preview_eval` で DOM 測定値を検証するほうが確実。

### G6: テストデータ生成（`preview_eval` パターン）

真のゲーム状態でテストするのは重いので、ロスターに手動で char を注入してから render* を直接呼ぶパターンで動作確認してきた：

```js
const mkChar = id => { const b = ALL_CHARS.find(c => c.id === id); return { ...b, condition:80, trust:60, popularity:30, durability:50, wear:0, age:22, salary:30 }; };
G.roster = [mkChar(1), mkChar(2), ...];
// 必要なら _ppvOrgId / _ppvOrgName を付ける
// 偽の results 配列を作り renderXxx を直接呼び、document.getElementById('showResultOverlay') で DOM 検証
```

### G7: Heat ID

`HEAT_LEVELS` は `ice_cold / cold / neutral / warm / hot / on_fire`。spec は `blazing` と書いてあるが実装は `on_fire`。Phase 1 の `heatFooterCls` 判定を参照。

### G8: Fighter オブジェクトのフィールド

`r.left`, `r.right` は完全な fighter オブジェクト（ID / name / 全ステータス / ovr源）。`Engine.util.ov(f)` で OVR 計算。`fLink(f, {source:'roster', skipQueue:true})` で選手詳細ポップアップリンク。

HP は `{final: number, max: number}` 形式。

### G9: タッグマッチは `renderShowResult` でしか出ない

Phase 3-4 の関数にタッグ分岐は不要（War / PPV / JT / B2 / B3 はいずれもシングル戦のみ）。

---

## まだ書かれていない決定（次セッションで確認）

| ID | 項目 | 推奨 |
|---|---|---|
| U-03 | 対抗戦 #5 敵エースセリフセクション | 実装前に簡易モック提示して相談 |
| U-04 | JT優勝発表 #8 の Ceremony 化 | 既決（Pattern B 準拠） |
| U-05 | 試合行内負傷バッジ配置 | 既決（モックV2準拠）、Phase 1で実装済み |
| — | JT ブラケット縮小表示 | 既存 `.jt-*` 借用 vs 新 `.pb-bracket-mini` — 実装時判断 |
| — | #8 JT 優勝発表レイアウト | **実装前に簡易モック提示して相談** |

---

## 次セッションの開始手順

1. 必読ドキュメント1-6を読む
2. `git log --oneline main..HEAD` で Phase 1/2 のコミットを確認
3. 現在ブランチが `feature/post-match-stage-redesign` であることを確認
4. Phase 3 計画を提示 → Keisuke さんに OK もらう
5. 事前準備不要（トークンと CSS は Phase 1 で整備済み）
6. `renderWarFinalResult` から着手
7. U-03（敵エースセリフ）に到達したら止まる → 簡易モック提示 → 承認後続行
8. 実装 → ブラウザ動作確認（eval 使用推奨、screenshot は不安定）→ コミット → Phase 3 完了報告
9. Phase 4 は 4a/4b/4c/4d に分割コミット、#8 JT優勝発表で必ず止まってモック提示

---

## 最終完了時の作業（全 Phase 完了後、まだやらない）

1. `docs/ui/03-screens/show-result-spec.md` の「実装状況」を「完了」に更新
2. `docs/game-system-roadmap.md` に完了記録追加
3. 旧 CSS（`.ppvtv-*`、`.ace-*`、`.war-md-*`、`.jt-*` 等）を `grep -rn` で未使用確認後まとめて削除
4. specs/ に試合後画面の UI 仕様追記が必要か検討
5. push はしない（CLAUDE.md ルール）
