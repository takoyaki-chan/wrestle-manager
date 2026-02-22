# 📋 計画書：ファイル分割 + 団体王座改修 + 歓声BGM

> 作成日: 2026-02-22
> ステータス: 計画段階（未着手）

---

## 概要

3つの作業を行う。ファイル分割を先に完了させてから、2つの機能改修に入る。

| # | 作業 | 目的 |
|---|------|------|
| 1 | ファイル分割 | 9000行超の単一HTMLを6ファイルに分割し、今後の開発効率を上げる |
| 2 | 団体王座改修 | ゲーム開始直後に王座決定戦が組める違和感を解消 |
| 3 | 歓声BGM | 興行シーンに観客のざわめきを追加して臨場感を出す |

---

## 作業1：ファイル分割

### 方針

- GitHub Pagesでホスト → ビルド不要、`<script src="...">` で分割したまま配布
- 全ファイル3000行以下（4000行超で作業効率が低下するため余裕を持つ）
- `file://` でも動作する（ES modules不使用）
- 既存のvictory-lines.js、battle-engine.htmlと同じ方式

### 分割後の構成（6ファイル）

```
src/
├── index.html           (~640行)  HTML+CSS+起動処理
├── data.js              (~840行)  全データ定数
├── engine.js            (~2640行) ゲームロジック全体（Engine オブジェクト）
├── app.js               (~1620行) Audio+Storage+Mission+Survival+App
├── ui-common.js         (~1350行) ヘルパー関数+ポップアップ+興行演出
├── ui-render.js         (~1960行) 全render関数+refreshAll
│
├── battle-engine.html   (既存・変更なし)
└── victory-lines.js     (既存・変更なし)
```

### 各ファイルの内容

#### index.html (~640行)
```
- <head>: meta, フォント読み込み, <style>CSS全体(423行)</style>
- <body>: HTML構造（トップバー、ナビ、各screen div、オーバーレイ等）(171行)
- <script src="..."> タグ（読み込み順は下記）
- <script> 起動処理 INIT(29行)
```

#### data.js (~840行)
**けいすけが主に編集するファイル**（キャラ追加・プロフィール修正時）
```
現 SECTION 1: ALL_CHARS, CHAR_PROFILES, TRAIT_DEFS, Traits,
             DRAFT設定, PORTRAIT, COACH_PORTRAIT,
             getPortraitUrl, getCoachPortraitUrl, coachPortraitImg, portraitImg
現 SECTION 2: commonMoves, styleMoves, catW
現 SECTION 3: MAX_T, PHASES, ENG
現 SECTION 4: SALARY_TABLE, VENUES, SPONSOR_TABLE, BROADCAST_TABLE,
             FIXED_COSTS, HEAT_LEVELS, QUARTER_LABELS, INJURY_TABLE,
             TITLES, RIVALRY_THRESHOLDS
現 SECTION 4B: ALL_COACHES, MAX_COACHES, COACH_HIRE_FEE, COACH_MAX_ASSIGN
現 SECTION 4C: GROWTH_CONFIG
現 SECTION 4D: FACILITIES
現 SECTION 4E: RIVAL_ORGS, SCOUT系定数, nextGenCharId, ORG_ASSIGN
             STYLE_GROWTH, STAR_POWER
現 SECTION 4G: ageMultiplier, DECAY_TABLE, RETIRE_CFG, AI_SCOUT_CFG,
             AI_SEASON_CFG, TRANSFER_CONFIG, RENTAL_CONFIG, EVENT_CONFIG
```

#### engine.js (~2640行)
```
現 SECTION 5: Engine オブジェクト全体
  rng, util, battle, economy, heat, injury, title,
  coach, facility, growth, ranking, rival, season,
  tickWeek, executeShow, applyMQPopularity, applyShowPopularity,
  ace, transfer, rental, scout, event,
  advanceWeek, makeChar, draft, createInitialState
```
※ 単一の `const Engine = { ... };` をそのまま移動

#### app.js (~1620行)
```
現 SECTION 0:  Audio（SFX+BGM、~420行）
現 SECTION 6b: MISSIONS, Mission関連関数（~70行）
現 SECTION 6c: Survival（~170行）
現 SECTION 7:  Storage（~200行）
現 SECTION 8:  App オブジェクト（~780行）
```

#### ui-common.js (~1350行)
```
現 SECTION 9前半:
  clamp, showConfirm, showCoachTooltip, closeCoachTooltip,
  showEventPopup, closeEventPopup, pickQuote, findFighter,
  showFighterPopup(593行), closeFighterPopup,
  fLink, autoFillCard, onCardSelect, toggleTitle, mqStars,
  startShowPrep, updateSchedulePreview, advanceWeek,
  renderMatchPreview, renderShowResult,
  各種委譲関数(signFighter, releaseFighter, scoutPick等),
  resolvePoach, finishTransferWindow, designateAce, revokeAce,
  playerPoachFighter, executeEvent, skipEvent, requestRental,
  getCoachSalaryTotal, unassignFromCoach, assignToCoach,
  calcWeeklySalary等のEngine委譲関数,
  showScreen, gotoScreen
```

#### ui-render.js (~1960行)
```
現 SECTION 9後半～SECTION 9D:
  refreshTopBar,
  renderWeekScreen(849行), renderRoster, renderShowPrep,
  renderFinance, renderLog, renderRanking,
  renderScout, renderScoutEvent, renderScoutCompetitionModal,
  renderCoach, renderSave, renderFacility,
  toggleIntensive, changeCoachAssign, toggleTrainDetail,
  getGrowthTendency, renderTraining,
  refreshAll
```

### 読み込み順序

```html
<!-- ① データ（依存なし） -->
<script src="data.js"></script>

<!-- ② エンジン（Dataに依存） -->
<script src="engine.js"></script>

<!-- ③ アプリ（Engine+Dataに依存） -->
<script src="victory-lines.js"></script>
<script src="audio.js">  ← app.jsから独立させるかは後で判断</script>
<script src="app.js"></script>

<!-- ④ UI（全部に依存） -->
<script src="ui-common.js"></script>
<script src="ui-render.js"></script>
```

### グローバル変数 `G` について

現状 `let G;` はどこかで宣言されている。分割後は **app.js** 内で宣言し、
ui-common.js と ui-render.js から参照する（グローバルスコープなのでそのまま動く）。

### Engine分割の方式

Engineは単一オブジェクトリテラルなので、engine.js にそのまま移動するだけ。
将来もし3000行を超えたら、以下の方式で分割可能：

```js
// engine-core.js
const Engine = { rng: {...}, util: {...}, battle: {...} };

// engine-world.js（後から追加）
Engine.rival = { ... };
Engine.transfer = { ... };
```

**今回はこの追加分割はやらない**。2640行なので閾値内。

### 作業手順

1. 現在のwrestle-manager.htmlをバックアップ（wrestle-manager_backup_presplit.html）
2. index.html を作成（HTML+CSS部分をコピー、scriptタグ追加、INIT部分をコピー）
3. data.js を作成（SECTION 1〜4Gのデータ定数をコピー）
4. engine.js を作成（SECTION 5をコピー）
5. app.js を作成（SECTION 0, 6b, 6c, 7, 8をコピー）
6. ui-common.js を作成（SECTION 9前半をコピー）
7. ui-render.js を作成（SECTION 9後半〜9D, refreshAllをコピー）
8. ブラウザで動作確認
9. 問題なければコミット、旧ファイルは削除

**コードは1行も変更しない。切り分けるだけ。**

### リスク

| リスク | 対策 |
|--------|------|
| 変数の依存順序ミス | 読み込み順序を厳守。DRAFT_WEAK_POOL等はALL_CHARSの後に来るよう同一ファイル内に維持 |
| `let G;` の宣言場所 | app.js の先頭で宣言。他ファイルからはグローバル参照 |
| battle-engine.htmlとの連携 | 変更なし（iframe+postMessage方式、src相対パスはそのまま） |
| 既存セーブデータ互換 | コード変更なしなので影響なし |

---

## 作業2：団体王座改修

### 現状の問題

- ゲーム開始直後（1年目Week1）から王座決定戦が組める
- 無名の新興団体が初興行で「世界チャンピオン」を決めるのは違和感
- 「世界王座」という名称が大げさ

### 変更内容

#### A. 名称変更
- `TITLES[0].name`: `'世界王座'` → `'団体王座'`
- UI表示の「世界王座」「世界チャンピオン」→「王座」「チャンピオン」に統一
- ミッション: `'世界王座を認定'` → `'王座を設立しよう'`

#### B. 王座設立フラグ
初期状態に `titleEstablished: false` を追加。

#### C. 設立条件（全て満たしたら通知）
- 興行を **3回以上** 開催済み（`G.totalShows >= 3`）
- 団体人気 **15以上**（`G.orgPop >= 15`）
- ロスター **5人以上**（`G.roster.length >= 5`）

#### D. 設立フロー
1. 条件達成時、週画面に通知パネル表示
   > 「📢 団体の実績が認められ、**王座の新設**が可能になりました！」
2. `titleEstablished = true` に切り替え
3. 以降の興行準備画面でタイトル戦チェックボックスが出現
4. 初回タイトルマッチは「🏆 初代王者決定戦」の特別ラベル

#### E. 興行準備画面の制御
現在のcanTitle判定:
```js
const canTitle = hasChamp || (isVacant && curL > 0 && curR > 0);
```
変更後:
```js
const canTitle = G.titleEstablished && (hasChamp || (isVacant && curL > 0 && curR > 0));
```

#### F. セーブ互換
ロード時に `titleEstablished` がなければ:
- `championId` が存在する → `true`
- `totalShows >= 3` かつ `orgPop >= 15` → `true`
- それ以外 → `false`

### 変更対象ファイル（分割後）
- data.js: TITLES名称変更
- engine.js: createInitialState に titleEstablished 追加
- app.js: 通知ロジック、セーブ互換
- ui-render.js: renderWeekScreen に通知パネル、renderShowPrep の canTitle 条件
- ui-common.js: dispChamp 表示文言

---

## 作業3：興行シーンの歓声BGM

### 方針

Web Audio APIでノイズベースの群衆音をシンセサイズ（外部ファイル不要）。
既存のAudio/BGMシステムに `startCrowd()` を追加するだけ。

### 音の構成

```
startCrowd(intensity = 0.5)
  ├── ベース層: ホワイトノイズ → バンドパス(300-800Hz) → 低い「ガヤガヤ」
  ├── 高域層:   ホワイトノイズ → バンドパス(1500-3000Hz) → 高い「キャーキャー」
  └── うねり:   LFO(0.3Hz) でゲインを周期的に上下 → 生きた群衆感
```
- intensityパラメータで全体音量をスケール
- 既存のミュート・BGM音量設定に自動対応（bgmGainを経由）

### トリガーポイント

| タイミング | 呼び出し | 効果 |
|-----------|---------|------|
| 興行準備画面に入る | `BGM.startCrowd(0.3)` | 小さめの期待感 |
| 興行実行→マッチプレビュー | `BGM.startCrowd(0.6)` | 中程度の盛り上がり |
| 全試合完了→結果表示 | `BGM.startCrowd(0.8)` | 大きな歓声 |
| 結果画面を閉じる | `BGM.stop()` | 静寂に戻る |
| 興行準備から週画面に戻る | `BGM.stop()` | 静寂に戻る |

### 変更対象ファイル（分割後）
- app.js: Audio.BGM に startCrowd() を追加（~40行）
- app.js: App.executeShow, App.finalizeShow, App.closeShowResult にトリガー追加
- ui-common.js: startShowPrep() にトリガー追加

---

## 作業順序

```
作業1: ファイル分割
  ↓（分割完了・動作確認後）
作業2: 団体王座改修  ←┐
作業3: 歓声BGM       ←┘ この2つは独立、どちらが先でもOK
```

作業1を必ず先に完了させる。分割後のファイルに対して2と3を実装する。
