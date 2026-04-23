# 試合後画面 Pattern B 統一リファクタ — Claude Code 実装ハンドオフ

**ファイル**：`plans/post-match-redesign-handoff.md`
**作成日**：2026-04-23
**対象**：Claude Code
**担当モデル推奨**：Opus（多画面にわたるJS/CSS大規模改修、日本語UIテキスト含む）

---

## 1. このタスクで何をやるか

試合後に表示される **10画面** を、Stage カテゴリの **Pattern B "Broadcast Scoreboard"** に統一リファクタする。既存の古いデザイン（ネイビー残存、Cream Panel誤用、ハードコード色）を一掃し、モックアップ確定版のデザインに揃える。

### 必ず最初に読むドキュメント

以下を**必ず順番に読んでから実装に入る**こと：

1. **`CLAUDE.md`**（プロジェクト全体ルール、開発ルール、UI実装ルール）
2. **`docs/ui/01-foundations.md`**（階層1：Stage カテゴリの定義）
3. **`docs/ui/02-layouts.md`**（階層2：P7 Theatrical パターン）
4. **`docs/ui/03-screens/show-result.md`**（階層3：本リファクタのマスター画面仕様書）
5. **`docs/ui/mockups/show-result-pattern-b.html`**（モックアップ正本、ブラウザで開いて確認）

**CSS の具体的な値（色、サイズ、余白など）は全てモックアップから取る。** ハンドオフ文書に値を二重化せず、モックアップを見ながら実装する。

### 対象画面

| # | 画面 | 関数 | Phase |
|---|---|---|---|
| 1 | 通常興行 | `renderShowResult()` | Phase 1 |
| 2 | 特別興行 | 同上（`isSpecialShow()` 分岐） | Phase 1 |
| 3 | PPV GRAND FINAL | `renderPPVResult()` | Phase 2 |
| 4 | PPV TV観戦 | `renderPPVTVResult()` | Phase 2 |
| 5 | 対抗戦最終 | `renderWarFinalResult()` | Phase 3 |
| 6 | 対抗戦進行 | `renderWarMatchPreview()` | Phase 3 |
| 7 | JT各試合 | `renderJuniorTournamentMatchResult()` | Phase 4 |
| 8 | JT優勝発表 | `renderJuniorTournamentResult()` | Phase 4 |
| 9 | B3挑戦状 | `_renderB3MatchResult()` | Phase 4 |
| 10 | B2対立決着 | `_renderB2MatchResult()` | Phase 4 |

**スコープ外**：battle-engine.html / tag-battle.html 内の `showResult()`（試合中の勝利演出）。触らない。

---

## 2. 全体の進め方と停止ルール

### 2-1 Phase 進行

Phase 1 → 2 → 3 → 4 の順で実装する。**各Phase完了時に Keisuke さんに報告して確認を取ってから次へ進む**。

### 2-2 いつ途中で止まるか（Claude Code の判断基準）

以下のいずれかに該当したら、そこで実装を止めて報告する：

- **Phase 完了時**（必ず報告）
- **Phase 途中でも、予想より変更範囲が大きい場合**（例：Phase 1 で 200+ 行の削除・追加が発生した、など）
- **モックアップに明記されていないデザイン判断が必要になった場合**（例：新しい画面要素、配色の追加など）
- **仕様書（show-result.md）に書かれている「未決事項 U-0x」に該当する判断が必要になった場合**
- **既存機能を壊しそうな改修**（例：グローバル変数の使い方が変わる、他画面で使っているCSSクラスを消す、など）
- **自動検証（auto-sim）で異常検知した場合**（ui変更なので通常は不要だが、一応）

### 2-3 Phase ごとの完了定義

各 Phase は以下を満たしたら完了：
- 対象画面のモックアップとの見た目一致（ブラウザで実際に開いて目視確認）
- 既存の機能（スクロール・試合ログ・ボタン遷移等）が壊れていない
- Git コミット済み（`push は絶対にしない` — CLAUDE.md 準拠）
- 画面仕様書 `docs/ui/03-screens/show-result.md` の「実装状況」を更新

---

## 3. 事前準備（Phase 1 に入る前に全Phase共通で1回やる）

### 3-1 ブランチ作成

```bash
git checkout -b feature/post-match-stage-redesign
```

### 3-2 Stage トークンを `src/index.html` の `:root` に追加

場所：`src/index.html` の既存 `:root` ブロック（ファイル冒頭のCSS）に追記。既存トークン定義の直後に以下を追加：

```css
/* ── Stage カテゴリ（試合後画面共通） ── */
--stage-bg:         #060606;
--stage-bg-deep:    #000000;
--stage-panel:      rgba(20,18,15,0.62);
--stage-panel-deep: rgba(10,9,7,0.80);
--stage-border:     rgba(200,190,170,0.08);
--stage-border-lit: rgba(212,168,67,0.22);
--stage-border-main: rgba(212,168,67,0.42);
--stage-text-main:  #e8e6e0;
--stage-text-sub:   rgba(232,230,224,0.55);
--stage-text-dim:   rgba(232,230,224,0.28);
--stage-text-quiet: rgba(232,230,224,0.16);

/* ── Semantic Colors（試合後画面の状態表現、既存トークンのエイリアス） ── */
--c-positive: var(--accent-faction-4);  /* #6fa28c */
--c-warning:  var(--accent-hostility);  /* #d07a3e */
--c-negative: #c0524a;                  /* 新規（--accent-hostility より赤い） */
--c-info:     var(--accent-faction-2);  /* #6d94b8 */
--c-rivalry:  var(--color-rivalry);     /* #e17055 */
```

**既存トークンとの重複を作らないこと**。既に `:root` に定義済みのトークン（`--gold` など）は触らない。

### 3-3 Pattern B の共通CSSブロックを `src/index.html` に追加

場所：`src/index.html` の既存 `.show-result-overlay` 関連CSSの直前または直後に、新しいセクションとして追加する。モックアップ `docs/ui/mockups/show-result-pattern-b.html` の `<style>` 内から以下のクラス群を全てコピー：

- `.pb-overlay`, `.pb-container`（オーバーレイ骨格）
- `.pb-banner`, `.pb-live`, `.pb-banner-title`, `.pb-banner-sub`（バナー）
- `.pb-score-strip`, `.pb-score-cell`, `.pb-score-val`, `.pb-score-lbl`, `.pb-score-attend-bar*`, `.pb-score-stars`（スコアボード）
- `.pb-divider`（区切り）
- `.pb-matches`, `.pb-mrow`, `.pb-mrow.is-main`（試合行）
- `.pb-fighter`, `.pb-portrait-wrap`, `.pb-portrait`, `.pb-fighter-info`, `.pb-fighter-name`, `.pb-fighter-meta`, `.pb-fighter-ovr`（選手ブロック）
- `.pb-result`, `.pb-result-*`（中央結果カラム）
- `.pb-mrow-tags`, `.pb-tag.is-*`（タグ）
- `.pb-hp-mini*`（HPバー）
- `.pb-dialogue`, `.pb-dialogue-speaker`, `.pb-mrow.has-dialogue`（セリフ）
- `.pb-injury*`（負傷）
- `.pb-footer`, `.pb-footer-heat`, `.pb-close-btn`（フッター）

**モックアップからコピペする際の注意**：
- モックアップには `dev-switcher` や `.variant` など、モックアップ固有のクラスが含まれている。これらは実装にコピーしない
- モックアップのスクロールバースタイル `.pb-overlay::-webkit-scrollbar` はコピーする

### 3-4 既存の古いCSSを削除（警告：慎重に）

以下のCSSブロックは Phase 1 で完全に使われなくなるので削除対象：

- `src/index.html` 2287〜2407行付近：`.show-header`, `.show-label`, `.show-title`, `.show-summary-bar`, `.show-attend-*`, `.show-results-area`, `.sr-*` 系全て

ただし**他の画面で流用されていないか grep で必ず確認してから削除**：

```bash
grep -n "show-header\|show-label\|show-title\|show-summary-bar\|show-attend\|show-results-area\|sr-card\|sr-match-num\|sr-fighters\|sr-char\|sr-vs\|sr-bubble\|sr-win-badge\|sr-finish\|sr-mq\|sr-heat-info\|sr-close" src/
```

もし他ファイル（特に `renderPPVResult` など Phase 2 で手を入れる関数）で使っている場合、Phase 1 では削除せず、該当 Phase で一緒に削除する。

### 3-5 コミット

事前準備が完了したら一度コミット：

```bash
git add -A
git commit -m "prep: Stage トークン追加 + Pattern B 共通CSS導入

- :root に --stage-* / --c-* トークンを追加
- .pb-* 共通CSSブロックを show-result.html モックアップから移植
- 既存の .sr-* CSSは Phase 1 で削除予定（まだ残存）

Refs: docs/ui/03-screens/show-result.md"
```

---

## 4. Phase 1 — 通常興行・特別興行（#1 + #2）

### 4-1 対象

- `src/ui-common.js:3595` の `renderShowResult(results, injuryResults)` 関数

### 4-2 実装手順

#### Step 1: 関数内 HTML 生成ロジックを Pattern B ベースに完全書き換え

モックアップの HTML 構造を参考に、動的データを JS で埋め込んでいく。

**バナー部分**：
```javascript
const isSpecial = isSpecialShow(G.week);
const liveClass = isSpecial ? 'pb-live is-special' : 'pb-live';
const liveText = isSpecial ? '⭐ MONTHLY SPECIAL' : '● ON AIR';
const titleClass = isSpecial ? 'pb-banner-title is-special' : 'pb-banner-title';
const showName = isSpecial ? '特 別 興 行' : `第 ${G.totalShows} 回 定期興行`;

html += `<div class="pb-banner">
  <div class="${liveClass}">${liveText}</div>
  <div class="${titleClass}">${showName}</div>
  <div class="pb-banner-sub">Year ${G.year}<span class="dot">·</span>Week ${G.week}<span class="dot">·</span>${monthLabel}</div>
</div>`;
```

**スコアボードストリップ**：`.pb-score-strip` を構築。動員セルには `.pb-score-attend-bar` を含める。

動員バーのクラス判定（OCCUPANCY_BONUS に準拠）：
```javascript
function getAttendBarClass(occRate) {
  if (occRate >= 0.95) return 'is-sellout';
  if (occRate >= 0.80) return 'is-good';
  if (occRate >= 0.60) return 'is-neutral';
  if (occRate >= 0.40) return 'is-weak';
  return 'is-empty';
}
```

**試合行**：`results.forEach((r, i) => { ... })` でループ。`i === 0` がメインイベント（`.pb-mrow.is-main`）。

試合行内の要素：
- 左選手ブロック（`.pb-fighter.is-left.is-{winner|loser|draw}`）
- 結果カラム（`.pb-result`）
- 右選手ブロック（`.pb-fighter.is-right.is-{winner|loser|draw}`）
- タグ行（`.pb-mrow-tags`、タグが1個以上ある場合のみ表示）
- HPミニバー（`.pb-hp-mini`）
- 負傷バッジ（`.pb-injury`、該当選手が負傷した場合のみ）

#### Step 2: セリフ（Dialogue）の発動判定

既存の `hasRivalryDialogue` ロジックを踏襲：

```javascript
const hasRivalryDialogue = !isDraw && r.rivalryBonus && (r.rivalryBonus.rivalry || 0) >= 30;
let winLine = '', loseLine = '';
if (hasRivalryDialogue) {
  // 既存のセリフ生成ロジック（pickDialogueLine）をそのまま使用
  // winLine, loseLine を生成
}
```

セリフが存在する場合は：
- `.pb-mrow` に `has-dialogue` クラスを付与
- `.pb-portrait-wrap` 内に `.pb-dialogue` を挿入

```javascript
const wrapperHtml = (fighter, isWinner, line, speakerClass) => {
  const bubble = line ? `
    <div class="pb-dialogue">
      <div class="pb-dialogue-speaker ${speakerClass}">${isWinner ? '🏆 ' : ''}${fighter.name}</div>
      「${line}」
    </div>` : '';
  return `<div class="pb-portrait-wrap">
    ${bubble}
    <div class="pb-portrait">
      <img src="${getUpperUrl(fighter.id)}" alt="${fighter.name}" onerror="this.style.display='none'">
    </div>
  </div>`;
};
```

#### Step 3: タッグマッチ対応

既存の `r.matchType === 'tag'` 分岐を Pattern B の**タッグマッチ専用試合行**として再実装する。

モックアップ（show-result-pattern-b.html）にはタッグマッチの例が無いため、以下の設計で実装：

- 試合行の左選手ブロックを **タッグチーム** に変更：2選手を小さめの肖像（60×90）で横並び、各選手にOVR表示
- VSと結果カラムは同じ
- 右選手ブロックも同様

**Tag Match バッジ**は `.pb-tag.is-tag` を必ず表示。

もし実装が複雑になる場合は、Keisuke に相談して止まる（停止条件該当）。

#### Step 4: 試合ログの扱い（未決事項 U-01）

**暫定方針**：既存の `<details>` 試合ログ開閉を Pattern B のトーンに合わせてスタイル調整して残す。

スタイル例：
```css
.pb-log-toggle {
  cursor: pointer;
  font-family: var(--font-label);
  font-size: 10px; letter-spacing: 2px;
  color: var(--stage-text-dim);
  text-transform: uppercase;
  list-style: none;
  text-align: center;
  margin-top: 10px;
}
/* 既存の details[open] 挙動と揃える */
```

実装前にユーザーに「ログ表示は残しますか？削除しますか？」と確認してから進める（**停止条件該当**）。

#### Step 5: フッター + 閉じるボタン

```javascript
html += `<div class="pb-footer">
  <div class="pb-footer-heat">Heat<span class="val ${heatColorClass}">${heat.emoji} ${heat.label.toUpperCase()}</span></div>
  <button class="pb-close-btn" onclick="closeShowResult()">結果を確認 →</button>
</div>`;
```

既存の `closeShowResult` 関数（`ui-common.js:5954`）はそのまま使う。

#### Step 6: 古いCSSを削除

Phase 1 が動くことを確認したら、古い `.show-header`, `.show-label`, `.show-title`, `.show-summary-bar`, `.show-attend-*`, `.show-results-area`, `.sr-*` 系を `src/index.html` から削除。ただし **他の関数（Phase 2-4 対象）で使われていないかを grep で確認** してから。

使用されているなら、その Phase で一緒に削除する。

#### Step 7: 動作確認

ブラウザでゲームを起動し、試合を1週分走らせて結果画面を開く。以下を確認：

- [ ] バナーが正しく表示される（通常/特別で分岐）
- [ ] 動員数・動員バー・動員率が正しく表示される
- [ ] メインイベントが金装飾で目立つ
- [ ] 通常試合は控えめなダーク背景
- [ ] 勝者肖像が金ボーダー、敗者が薄く、引分が警告色
- [ ] OVR が大きく Bebas Neue で表示される
- [ ] 因縁試合でセリフバブルが肖像の真上に表示される（しっぽ下向き）
- [ ] タイトル戦タグ・因縁タグ・初顔合わせタグなどが正しく出る
- [ ] HPミニバーが表示される
- [ ] 負傷選手のいる試合は試合行内に負傷バッジが表示される
- [ ] 閉じるボタンで次週に進む
- [ ] タッグマッチも表示される

動かなかった場合：コンソールログを確認し、エラーがあれば報告して止まる。

### 4-3 コミット

```bash
git add -A
git commit -m "feat(post-match): Phase 1 — 通常/特別興行の試合結果画面を Pattern B に刷新

- renderShowResult を Pattern B レイアウトに全面書き換え
  - 水平スコアボードストリップ（動員+バー+会場名、平均MQ、Heat、試合数、負傷数）
  - 試合行を 3 カラムグリッド化（左選手 / 結果 / 右選手）
  - メインイベント行は金ボーダー + 金スポットライト + ★ MAIN EVENT ラベル
  - 因縁セリフは肖像の真上に配置（しっぽ下向き）
- 動員率 5 段階で色分け（is-sellout/is-good/is-neutral/is-weak/is-empty）
- 古い .sr-* / .show-* CSS を削除
- 試合ログ <details> はトーン調整して継続

モックアップ: docs/ui/mockups/show-result-pattern-b.html V1/V2
仕様書: docs/ui/03-screens/show-result.md §5-1, §5-2

Refs: plans/post-match-redesign-handoff.md Phase 1"
```

### 4-4 完了報告

Phase 1 完了後、Keisuke さんに以下を報告：

- 実装完了した画面（#1 通常興行 / #2 特別興行）
- ブラウザでの確認観点
- 気になった点・懸念（あれば）
- Phase 2 に進んでよいか確認を取る

**Keisuke さんが OK を出すまで Phase 2 に進まない。**

---

## 5. Phase 2 — PPV GRAND FINAL + PPV TV観戦（#3 + #4）

### 5-1 対象

- `src/ui-common.js:4973` の `renderPPVResult(card, results, summitPair, heatChange, mqBonuses)`
- `src/ui-common.js:5263` の `renderPPVTVResult(card, results, ppvName)`

### 5-2 実装手順

仕様書 §5-3, §5-4 を参照。Phase 1 と同じ要領で Pattern B ベースに書き換える。

差分の要点：
- **バナー**：PPV 用に `🏆 GRAND FINAL` バッジ（金強調）、PPV名（例 `DREAM CLASH 2026`）をタイトルに。40px 前後・金グラデ+光彩
- **スコアボード**：PPV特有の項目構成（`Avg MQ` / `Best MQ` / `Heat` / `Matches(7固定)`）
- **試合の並び順**：メインイベント（頂上決戦）→ 第6試合 → ... → 第1試合（既存ロジック `for (let di = total - 1; di >= 0; di--)` 踏襲）
- **セクション区切り**：メイン試合の上に `.pb-divider` で `🏆 MAIN EVENT — 頂上決戦`、第6試合の上に `UNDERCARD`
- **頂上決戦の追加装飾**：`.pb-mrow.is-main.is-ppv` クラスで、さらに金強調
- **コーチ称賛バブル**（未決事項 U-02）：
  - 暫定：試合行下部に独立ブロック `.pb-coach-praise` として追加（選手バブルとは別）
  - 実装前にモックアップを簡易で作って Keisuke さんに見せる（**停止条件該当**）
- **フッター**：対戦pt変動表示 + Heat変動表示 + 「オフシーズンへ →」ボタン

### 5-3 PPV TV観戦（#4）

- プレイヤー選手が不在：選手ブロックは全て他団体の選手
- 所属団体名を `.pb-fighter-meta` に表示
- バナー：`📺 PPV 観戦` バッジ（青系 `--c-info` ベース）、タイトルは普通の金（光彩なし）
- 頂上決戦の勝者セリフは発動する（既存ロジック踏襲）

### 5-4 コミット

```bash
git add -A
git commit -m "feat(post-match): Phase 2 — PPV GRAND FINAL + PPV TV観戦を Pattern B に刷新

- renderPPVResult: PPV専用バナー（🏆 GRAND FINAL、光彩強調）
  - MAIN EVENT / UNDERCARD セクション区切り
  - 頂上決戦は .pb-mrow.is-main.is-ppv で最強装飾
  - コーチ称賛バブルは試合行下部の独立ブロックに配置
- renderPPVTVResult: 外部視点バナー（📺 PPV 観戦、青系）
  - 所属団体名を fighter-meta に表示
- 古い PPV専用CSS (.ppvtv-*, show-result 内のPPV分岐) を整理

モックアップ: docs/ui/mockups/show-result-pattern-b.html
仕様書: docs/ui/03-screens/show-result.md §5-3, §5-4

Refs: plans/post-match-redesign-handoff.md Phase 2"
```

### 5-5 完了報告

Phase 1 と同じ要領で報告。Phase 3 へ進んでよいか確認を取る。

---

## 6. Phase 3 — 対抗戦（#5 + #6）

### 6-1 対象

- `src/ui-common.js:439` の `renderWarFinalResult(ev, results, playerWins, aiWins, eventWon)`
- `src/ui-common.js:286` の `renderWarMatchPreview()`

### 6-2 実装手順

仕様書 §5-5, §5-6 を参照。

**#5 対抗戦最終結果**：
- **バナー**：`⚔ WAR` バッジ（敵団体カラー背景）、タイトル `対 抗 戦 結 果`
- **スコアボード**：
  - Cell 1: 動員（通常通り）
  - Cell 2: `我方 N 勝` / `敵方 M 勝`（プレイヤー団体色＋敵団体色、Bebas Neue大型、`—` で区切る）
  - Cell 3: 勝敗（🏆 勝ち越し / ⚖ 引き分け / 💀 負け越し、色分け）
  - Cell 4: 平均MQ
  - Cell 5: Heat変動
- **試合行**：5試合をメインイベントから降順表示。`.pb-fighter` に **所属団体色のアクセントボーダー** を追加（プレイヤー側は青、敵側は `orgCfg.color`）。専用クラス `.is-player-side` / `.is-enemy-side` を追加する必要あり
- **セリフ**：各試合の勝者にセリフ（`WAR_VICTORY_LINES`）。バブルは通常通り肖像真上
- **フッター**：敵エースのセリフセクション（既存の `.ace-area`）を Pattern B カラーに更新。`--stage-panel-deep` 背景 + 肖像右側に大きめバブル。**実装前にこの部分のモックアップを簡易作成して Keisuke に見せる**（**停止条件該当**）
- **閉じるボタン**：「閉じる」 → `closeWarFinalResult(eventWon)` を呼ぶ（既存関数そのまま）

**#6 対抗戦進行画面**：
- **バナー**：#5 と同じ構成
- **スコアボード**：動員 / 現在のスコア（例 `2-1`） / 残り試合数 / 次試合選手名 / 合計MQ（出揃った分まで）
- **試合行の3状態**：
  - `.pb-mrow.is-resolved`（完了済み）：padding 小さめ、コンパクト表示。勝者セリフ1つ（既存 `result.victoryLine`）を肖像真上に
  - `.pb-mrow.is-upcoming`（次の試合）：Pattern B 標準サイズで対峙、両者試合前セリフ（`pickDialogueLine(PPV_OPPONENT_LINES, ...)`）
  - `.pb-mrow.is-pending`（未消化）：超コンパクト、選手名のみグレー表示（最小限）
- **次へボタン**：「次の試合へ →」

### 6-3 コミット

```bash
git add -A
git commit -m "feat(post-match): Phase 3 — 対抗戦（War）画面群を Pattern B に刷新

- renderWarFinalResult
  - 対抗戦専用スコアボード（我方N勝/敵方M勝、勝敗ラベル、Heat変動）
  - 試合行に団体色アクセントボーダー（.is-player-side / .is-enemy-side）
  - 勝者セリフを肖像真上に配置
  - 敵エースセリフセクションを Pattern B カラーに更新
- renderWarMatchPreview
  - 試合行3状態（.is-resolved / .is-upcoming / .is-pending）
  - 現在の試合が中央、完了はコンパクト上部、未消化はグレー最下部

モックアップ: docs/ui/mockups/show-result-pattern-b.html（War拡張はモックアップ簡易確認済み）
仕様書: docs/ui/03-screens/show-result.md §5-5, §5-6

Refs: plans/post-match-redesign-handoff.md Phase 3"
```

### 6-4 完了報告

同上。Phase 4 へ進んでよいか確認を取る。

---

## 7. Phase 4 — JT各試合 + JT優勝 + B3 + B2（#7 + #8 + #9 + #10）

### 7-1 対象

- `src/ui-common.js:10117` の `renderJuniorTournamentMatchResult(ri, mi)`
- `src/ui-common.js:10234` の `renderJuniorTournamentResult()`
- `src/ui-common.js:8018` の `_renderB3MatchResult(event, matchResult, playerFighter, challenger)`
- `src/ui-common.js:8214` の `_renderB2MatchResult(event, matchResult, f1, f2, interventionChoice)`

### 7-2 実装手順

仕様書 §5-7 〜 §5-10 を参照。4画面とも **1試合のみ** の画面なので、試合行は1つだけ。

**#7 JT各試合結果**：
- バナー：`🥇 JUNIOR TOURNAMENT` バッジ + ラウンド名（`準々決勝` / `準決勝` / `🏆 決勝`）
- スコアボード：JT専用構成（ブラケット縮小表示、試合ラベル `Match N/7`、MQ、フィニッシュ技カテゴリ）
  - **ブラケット縮小表示**は現在の `.jt-*` 系 HTML を借用。Pattern B スコアボードの1セル内に収まるサイズで表示
- 試合行：1試合のみ、`.pb-mrow.is-main.is-jt`
- 勝者セリフ：`getJuniorTournamentLine('postMatchWin', ...)`
- フッター：「次の試合へ →」 or 「優勝発表へ →」

**#8 JT優勝発表**：
- **特別扱い**：仕様書 §5-8 参照
- バナー：`🏆 JT CHAMPION` バッジ（金強調）、タイトル `第 N 回 ジュニアトーナメント 優勝`
- スコアボード：優勝者特化構成（平均動員、優勝者通算MQ、勝ち上がりパス、賞金、新王者OVR）
- **優勝者カード**：`.pb-mrow.is-main.is-champion` 1つだけ
  - 中央に優勝者肖像（150×225、3重金ボーダー）
  - 🏆 アイコン大型 + `CHAMPION` ラベル（Bebas Neue 40px）+ 優勝者名（24px）
  - 所属団体名
  - 優勝スピーチバブル（肖像真上、金枠強調、通常バブルより大きめ）
  - 賞金 `¥120万` 表示（Bebas Neue金）
- **準優勝・3-4位**：下部に `.pb-mrow.is-sub.is-runnerup` / `.is-semifinalist` として小さめ表示
- 閉じるボタン：「閉じる」

**#9 B3挑戦状**：
- 簡略スコアボード（対戦団体名、結果、MQ、バフ獲得有無）
- 1試合のみ（`.pb-mrow.is-main.is-b3`）
- プレイヤー選手 vs 他団体選手、所属は `.pb-fighter-meta` に
- 勝者セリフのみ発動
- フッター：バフ詳細 + 「了解」ボタン

**#10 B2対立決着**：
- 簡略スコアボード（試合前介入選択、結果、MQ、Bond/Rivalry変動）
- 1試合のみ（`.pb-mrow.is-main.is-b2`）
- 両者ロスター内なので所属meta省略
- 両者セリフ発動（既存ロジック）
- フッター：関係性変動サマリ + 「了解」ボタン

### 7-3 Phase 4 の注意点

- 4画面同時に扱うため、各画面の実装を**小コミット単位に分ける**
  - `feat(post-match): Phase 4a — JT各試合を Pattern B に`
  - `feat(post-match): Phase 4b — JT優勝発表を Pattern B に`
  - `feat(post-match): Phase 4c — B3挑戦状を Pattern B に`
  - `feat(post-match): Phase 4d — B2対立決着を Pattern B に`
- **#8 JT優勝発表はデザインが他と違う（1人フォーカス）ので、実装前に簡易モックアップを作って Keisuke に見せる**（**停止条件該当**）
- 既存の `.jt-*` 系CSS / `.war-md-*` / `.ace-*` などが他で使われていないかを grep で確認してから削除

### 7-4 最終完了報告

Phase 4 完了後、全10画面の Pattern B 統一が完了。以下を報告：

- 実装完了した画面一覧
- ブラウザでの確認観点（各画面で1試合ずつ動作確認）
- 残存する技術負債（古いCSSで完全削除できなかったもの、など）
- マージしてよいか確認を取る

### 7-5 完了時の作業（CLAUDE.md 準拠）

全 Phase 完了後：

1. **画面仕様書の更新**：`docs/ui/03-screens/show-result.md` の「実装状況」を「完了」に更新
2. **game-system-roadmap 更新**：`docs/game-system-roadmap.md` に本リファクタの完了記録を追加
3. **specs/ 更新の要否確認**：試合後画面のレイアウトに関する既存 specs（例：`battle-engine-spec`, `ppv-grand-final-spec`）があれば、UI部分について追記または更新
4. **push はしない**（Keisuke さんが判断）

---

## 8. 全 Phase 共通の注意事項

### 8-1 データ整合性の保持

試合結果画面は以下のゲーム状態データに依存している。レンダリング関数の書き換え時に**データ参照を変えない**こと：

- `G.lastShowResults`（試合結果配列）
- `G.lastShowAttendance`（動員数）
- `G.showVenue`（会場ID）
- `G.showCard`（試合カード）
- `results[i].mq / winner / finType / finMove / turns / hpLeft / hpRight / log`（各試合データ）
- `results[i].rivalryBonus / freshnessBonus / isTitleMatch`（タグ判定用）
- `G.mediaSpotlight`（取材中バッジ判定）
- `Engine.util.ov(fighter)`（OVR計算）
- `isPPV(G.week)`, `isSpecialShow(G.week)`（分岐判定）
- `getHeatLevel()`（Heat値）
- `OCCUPANCY_BONUS` / `VENUES`（動員評価用）

これらの API を勝手に変えない。表示仕様を変えるだけ。

### 8-2 肖像画像

**必ず `getUpperUrl(fighter.id)` を使う**。`getPortraitUrl()` や `portraitImg()` を使わない（Pattern B は upper 画像統一）。

```javascript
const upperUrl = getUpperUrl(fighter.id);
const imgHtml = upperUrl
  ? `<img src="${upperUrl}" alt="${escHtml(fighter.name)}" onerror="this.style.display='none'">`
  : `<div class="pb-portrait-placeholder">${(fighter.name || '?').charAt(0)}</div>`;
```

プレースホルダー用の `.pb-portrait-placeholder` スタイルも追加する（画像がない場合のフォールバック、肖像枠と同じサイズで文字色 `--stage-text-dim`）。

### 8-3 fLink 関数

既存の `fLink(fighter, opts)` は選手詳細ポップアップへのリンクを生成する。試合行内の選手名は**クリックで選手詳細ポップアップを開く**ように、`fLink` を使って wrap する：

```javascript
<div class="pb-fighter-name">${fLink(fighter, {source: 'roster', skipQueue: true, bold: isWinner})}</div>
```

### 8-4 escHtml

選手名・セリフ・フィニッシュ技名など、ユーザー由来または生成テキストは `escHtml()` で必ずエスケープする（既存関数）。ただし fLink が内部でエスケープしている場合は二重エスケープしないよう注意。

### 8-5 バナーの Year / Month 表示

```javascript
const year = G.year || 1;
const week = G.week || 1;
const month = Math.floor((week - 1) / 4) + 1; // または既存の月表記ヘルパがあればそれを使う
const weekInMonth = ((week - 1) % 4) + 1;
const monthLabel = `${month}月 第${weekInMonth}週`;
```

ただし既存の月表示ヘルパ関数（例えば `formatWeekLabel(w)` など）がコードベースにある場合はそれを使う。grep で確認：

```bash
grep -n "月.*週\|formatWeek\|weekLabel" src/app.js src/ui-common.js src/data.js | head
```

### 8-6 Heat 表示の色クラス

```javascript
const heat = getHeatLevel();
let heatColorClass = '';
if (heat.id === 'hot' || heat.id === 'blazing') heatColorClass = 'is-hot';
else if (heat.id === 'cold') heatColorClass = 'is-cold';
else heatColorClass = 'is-neutral';
```

`.pb-footer-heat .val.is-hot` → `--c-rivalry`
`.pb-footer-heat .val.is-cold` → `--c-info`
`.pb-footer-heat .val.is-neutral` → `--stage-text-main`

### 8-7 auto-sim への影響

本リファクタは **UI のみの変更** なので `auto-sim` への影響は基本ない。ただし `management.js` や `match-engine.js` を触った場合は自動フックが発動する。UI 変更だけであれば **発動しない**想定。

もし誤って management.js や match-engine.js を編集した場合は auto-sim のログに注意。

### 8-8 テスト用セーブデータ

試合結果画面を試すには、ゲームを普通に進めて興行日を迎える必要がある。効率化のため `test/make-save.js` で興行直前のセーブデータを生成できるかもしれない。必要なら確認：

```bash
grep -n "週\|week\|興行" test/make-save.js | head
```

---

## 9. トラブルシューティング

### 9-1 セリフバブルが肖像の真上に表示されない

- `.pb-portrait-wrap` に `position: relative` が効いているか確認
- `.pb-dialogue` が `.pb-portrait-wrap` の**直接の子要素**か確認
- `.pb-mrow.has-dialogue` クラスが付与されているか確認（padding-top 拡張のため）

### 9-2 古いデザインが残って表示される

- `src/index.html` の古いCSS（`.show-header` 等）が削除されているか確認
- ブラウザキャッシュをハードリロード（Cmd+Shift+R / Ctrl+Shift+R）

### 9-3 動員バーの色が変わらない

- `.pb-score-attend-bar-fill` に `.is-sellout` 等のクラスが正しく付与されているか確認
- `getAttendBarClass(occRate)` の閾値が `OCCUPANCY_BONUS` と一致しているか確認

### 9-4 メインイベントと通常試合の差分が弱い

- `.pb-mrow.is-main::before` の `★ MAIN EVENT` ラベルが表示されているか
- `background` の `radial-gradient` が効いているか
- `border-left` の金ラインが出ているか

---

## 10. 最終チェックリスト

全 Phase 完了後、以下を確認：

- [ ] 画面 #1〜#10 を実際にブラウザで1つずつ確認
- [ ] モックアップ（show-result-pattern-b.html V1/V2）との見た目一致
- [ ] 選手肖像は全て upper 画像を使用
- [ ] 選手表記に全て OVR が付いている
- [ ] セリフバブルは肖像の真上、しっぽ下向き
- [ ] 動員バー・色分けが5段階で動作
- [ ] 既存機能（スクロール、選手クリック→詳細ポップアップ、閉じるボタンによる遷移）が全て動作
- [ ] コンソールに JS エラーがない
- [ ] `src/index.html` からハードコード16進カラーの新規追加がない（既存残存分は Phase で削除）
- [ ] `docs/ui/03-screens/show-result.md` の「実装状況」を完了に更新
- [ ] `docs/game-system-roadmap.md` に完了記録を追加
- [ ] ローカルコミット済み、push はしない

---

## 11. 参考資料

- **モックアップ正本**: `docs/ui/mockups/show-result-pattern-b.html`
- **マスター画面仕様書**: `docs/ui/03-screens/show-result.md`
- **階層1 Foundations**: `docs/ui/01-foundations.md`
- **階層2 Layouts**: `docs/ui/02-layouts.md`
- **プロジェクトルール**: `CLAUDE.md`

---

*v1.0 / 2026-04-23*
