# モーダル統一 実装計画 v0.1

> **対象**: wrestle-manager 全モーダルのデザイン統一プロジェクト
> **承認状態**: 設計合意済み（`docs/ui/mockups/modal-unified-v0.1.html` 準拠）
> **ブランチ戦略**: 単一ブランチ `feature/modal-unification` で Phase 0〜5 を完結
> **総所要時間目安**: 15〜25時間（全Phase合計）
> **前提**: 派閥システム（faction-system）main merge 済み

---

## プロジェクトの目的

現在 wrestle-manager には 30種類以上のモーダル・オーバーレイが存在し、それぞれ開発時期や担当機能ごとにバラバラのデザインで実装されている。これらを **4つの統一テンプレート（A/B/C/D）** に収束させ、将来の機能追加でも意匠がブレないベースを構築する。

### 統一テンプレート

| 記号 | 用途 | 見た目 | 参考 |
|---|---|---|---|
| **A型** | 社長室・重大決定 | クリームパネル + コーチ取次 + 決定トレイ | 派閥 F01 / F04 |
| **B型** | ステージ演出 | 暗ステージ + スポットライト + 頭上吹き出し | 派閥 F02 / F03 |
| **C型** | 情報表示パネル | ダーク背景 + 左右2カラム（画像+情報） | 既存 `fighter-popup` |
| **D型** | 軽量ダイアログ | 小型ダークボックス（+ cream / urgent / positive バリアント） | 新規 |

---

## 参照ドキュメント（実装前に必読）

実装着手前に **必ず** 以下を確認すること:

1. `docs/ui/modal-inventory-v0.1.md` — 全モーダルの現状インベントリと分類
2. `docs/ui/mockups/modal-unified-v0.1.html` — 統一デザインのモックアップ本体（21画面）
3. `docs/ui/mockups/faction-events.html` — A/B型の意匠のオリジナル（派閥イベント実装済）
4. `CLAUDE.md` — アーキテクチャ5原則、開発ルール
5. `docs/ui/01-foundations.md` — 既存デザイントークンと命名規則

---

## 実装対象の全体像（21画面）

### A型 社長室（6画面）
- A-1 選択イベント3択（`showChoiceEventModal` 分離）
- A-2 対象選手選択（`showDecisionTargetModal`）
- A-3 結果報告（`showDecisionResultModal` / 派閥F04 等）
- A-4 緊急2択（`showRosterOverflowSigningModal`）
- A-5 選手要望（`showEventPopup` 選択肢付き分離）
- A-6 ブレークスルー報告（`showGrowthEventPopups` breakthrough）

### B型 ステージ（5画面）
- B-1 試合プレビュー（`renderMatchPreview` / `renderPPVMatchPreview` 等）
- B-2 試合結果（`renderShowResult` / `renderPPVResult` 等）
- B-3 因縁宣戦布告（`showRivalryPopups`）
- B-4 引退告知（`showRetirementPopups` / `showRetireAdviseResultPopup`）
- B-5 マイルストーン（`showMilestone`）

### C型 情報パネル（3画面）
- C-1 選手詳細（既存 `showFighterPopup` 準拠・軽微な調整）
- C-2 コーチ情報（既存 `showCoachTooltip` 準拠・軽微な調整）
- C-3 コメント表示（`showEventPopup` 表示のみ分離）

### D型 軽量（7画面）
- D-1 確認ダイアログ（`confirmOverlay`）
- D-2 通知（`notifModalOverlay` 通知タイプ）
- D-3a Glimpse A（`showGlimpseAModal`）
- D-3b 試合後対話（`showPostMatchDialogues`）
- D-4 ケアアクション（`careOverlay` ケアタイプ分離）
- D-5 スカウト競合（`renderScoutCompetitionModal`）
- D-6 R3動揺（`showR3Modal`）

### 統一対象外（E型・個別維持）

新聞 / 年間表彰式 / ゲームオーバー / クレジット / オープニング / 完走演出 / シーズンファンファーレ / 試合 iframe / Jrトーナメント一式 / HoF詳細 / 契約交渉（社長室画面内に描画）

---

## Phase 分割

| Phase | 対象 | 作業量 | 新規 or 書き換え |
|---|---|---|---|
| **Phase 0** | 共通CSSトークン・テンプレートCSS の導入 | 小（1〜2h） | 新規 |
| **Phase 1** | A型 社長室（6モーダル） | 大（4〜6h） | 主に書き換え |
| **Phase 2** | B型 ステージ（5モーダル） | 最大（5〜8h） | `showResultOverlay` からの分解を伴う |
| **Phase 3** | C型 情報パネル（3モーダル） | 小（1〜2h） | 既存デザイン踏襲の微調整のみ |
| **Phase 4** | D型 軽量（7モーダル） | 中（3〜4h） | 分離作業含む |
| **Phase 5** | `showResultOverlay` の整理 | 小（1h） | 削除または用途限定 |

各Phaseは単一ブランチ `feature/modal-unification` で連続的に実装。Phase完了ごとにコミットを切り、ユーザーレビューを経て次Phaseへ。最終的に1本のPRで main へ merge する。

---

## 実装原則（全Phase共通）

### 1. 命名規則

統一モーダル用のCSSクラスは **`mdl-{型}-*`** プレフィックスを使用:
- `mdl-a-overlay`, `mdl-a-card`, `mdl-a-header`, `mdl-a-reporter-strip` …
- `mdl-b-overlay`, `mdl-b-upper-wrap`, `mdl-b-speech` …
- `mdl-c-card`, `mdl-c-header` …
- `mdl-d-box`, `mdl-d-title`, `mdl-d-actions` …

モックアップでは `mA-*` / `mB-*` 等の開発用プレフィックスを使ったが、本番では `mdl-*` に揃える。

### 2. 既存クラスの扱い

- 既存の `fighter-popup-*` / `confirm-*` / `care-*` 等のクラスは **各Phase で段階的に廃止**（急ぎすぎて他機能を壊さない）
- 同じオーバーレイコンテナ（例: `careOverlay`）が複数用途で使い回されている場合、**新しい専用コンテナを作ってから古いものを削除**する
- 既存コンテナ ID（例: `confirmOverlay`）を残したまま中身の CSS クラスだけ差し替える方法も OK。影響範囲が小さい方を選ぶ

### 3. アクセスフロー（既存関数シグネチャは維持）

- 例: `showFighterPopup(id)` のような関数は **関数名とシグネチャを維持**、内部実装だけ差し替える
- 呼び出し側（`app.js` / `ui-render.js` 等）の書き換えを最小化し、ロジックには手を入れない

### 4. JSロジックには触らない

- `Engine.*` 名前空間の全ロジック（`management.js` / `relationships.js` / `factions.js` / `match-engine.js` / `draft-negotiation.js` 等）には **一切手を入れない**
- 変更は UI 層（`ui-common.js` / `ui-render.js` / `index.html` 内 style / `app.js` の画面遷移部分のみ）に限定

### 5. 画像アセット

- 上半身画像: `getUpperUrl(id)` → `image/upper/upper_*.webp`
- 顔画像: `getPortraitUrl(id)` → `image/face_*.png`
- コーチ画像: `getCoachUpperUrl(id)` / `getCoachPortraitUrl(id)`
- A型・B型・D-4 は上半身画像を優先使用（onerror で顔画像にフォールバック）
- C-3・D-3a・D-3b・D-6 は顔画像を優先使用（大きめの丸表示）

### 6. 動作確認チェックリスト

各Phase完了時、以下を必ず確認:

- [ ] 既存のゲーム進行フローが最後まで破綻せず動く（1シーズン通し運用）
- [ ] モーダル間の遷移（Aから次のAへ、AからBへ等）でスタイルが崩れない
- [ ] キュー処理（`_enqueuePopup` / `_isPopupActive`）が正しく働く
- [ ] モバイル表示（狭幅）での崩れがない
- [ ] BGM・SE が従来通り鳴る

---

## Phase 0: 共通CSS基盤の導入（詳細）

### 目的

統一テンプレートのCSSトークンとベーススタイルを `index.html` の `<style>` セクションに導入する。**この時点ではまだどの画面も差し替えない**。後続 Phase の土台だけ作る。

### 作業内容

#### 0.1 `:root` にトークン追加

`src/index.html` L8 付近の `<style>` 開始直後の `:root` 宣言に、以下のトークンを追加:

```css
/* ===== モーダル統一テンプレート用トークン ===== */

/* Office 系（A型・D型 cream バリアント） */
--office-panel-cream: #d4ccb8;
--office-panel-cream-card: #ede8dc;
--office-panel-dark: #181614;
--office-border-cream: rgba(100,85,50,0.14);
--cream-text-main: #1e1c16;
--cream-text-sub: #5c5242;
--cream-text-dim: #7a6f5a;
--cream-gold: #7a6530;
--cream-gold-dark: #5c4a1e;

/* Stage 系（B型） */
--stage-bg: #060606;
--stage-text-main: #e8e6e0;
--stage-text-sub: #a89e8a;

/* 既存 --gold / --gold-light / --accent-* はそのまま利用 */
```

**注意**: 派閥イベント実装時に既にこれらのトークンは追加済みの可能性がある。重複しないように事前確認すること（`grep "--office-panel-cream" src/index.html`）。

#### 0.2 テンプレート CSS 本体の追加

モックアップ `docs/ui/mockups/modal-unified-v0.1.html` の `<style>` セクション（SECTION 5〜8）をベースに、以下のクラスブロックを `src/index.html` の既存 `<style>` 内に追加:

- `mdl-a-*` ブロック（A型：overlay / card / header / reporter-strip / subject-stage / decision-tray 等）
- `mdl-b-*` ブロック（B型：overlay / title-band / dual-stage / col / upper-wrap / speech / solo-stage 等）
- `mdl-c-*` ブロック（C型：overlay / card / header / body / footer 等）
- `mdl-d-*` ブロック（D型：overlay / box / title / body / actions / btn 等）

モックアップの `.mA-*` を `.mdl-a-*` に一括置換する形で移植。

**ファイル**: `src/index.html` の `<style>〜</style>` 内。既存CSSの末尾付近に追加。

#### 0.3 静的オーバーレイコンテナの追加（空のdiv）

本番で使う空のオーバーレイコンテナを `src/index.html` に追加。既存の `showResultOverlay` 等のブロックの近くに:

```html
<!-- モーダル統一テンプレート用コンテナ（Phase 1以降で内容を注入） -->
<div class="mdl-a-overlay" id="mdlAOverlay"><div class="mdl-a-card" id="mdlACard"></div></div>
<div class="mdl-b-overlay" id="mdlBOverlay"></div>
<div class="mdl-c-overlay" id="mdlCOverlay"><div class="mdl-c-card" id="mdlCCard"></div></div>
<div class="mdl-d-overlay" id="mdlDOverlay"><div class="mdl-d-box" id="mdlDBox"></div></div>
```

**注意**: `id` を上記の通り付けると、Phase 1以降で各関数が `document.getElementById('mdlAOverlay')` でアクセスできる。

#### 0.4 動作確認

- ブラウザで既存のゲーム画面を開いても、**見た目に何の変化もない**ことを確認（追加したオーバーレイは display:none のまま）
- コンソールエラーなし
- 既存モーダル（選手詳細・確認ダイアログ等）が従来通り動くことを確認

### Phase 0 完了判定

- [ ] `grep -c "mdl-a-overlay" src/index.html` が 1 以上（CSS に存在）
- [ ] `document.getElementById('mdlAOverlay')` がブラウザコンソールで要素を返す
- [ ] 既存ゲームの全画面に視覚的な影響がない
- [ ] コミット: `feat(modal): Phase 0 — 統一モーダルテンプレートのCSS基盤を導入`

---

## Phase 1: A型 社長室（骨格）

### 対象（6モーダル）

| # | 新関数 or 流用 | 既存関数 / オーバーレイ | 移植元コード |
|---|---|---|---|
| A-1 | `showChoiceEventModal` を書き換え | `careOverlay` 使用 → `mdlAOverlay` へ | モック A-1 |
| A-2 | `showDecisionTargetModal` を書き換え | `shachoshitsuDecisionOverlay` → `mdlAOverlay` | モック A-2 |
| A-3 | `showDecisionResultModal` を書き換え / `showFactionF04Modal` 統合 | `shachoshitsuDecisionOverlay` / 派閥用 | モック A-3 |
| A-4 | `showRosterOverflowSigningModal` を書き換え | `showResultOverlay` → `mdlAOverlay` | モック A-4 |
| A-5 | `showEventPopup` を分岐（選択肢あり→A型） | `eventPopupOverlay` → `mdlAOverlay` | モック A-5 |
| A-6 | `showGrowthEventPopups`（breakthroughのみ）分離 | `growthEventOverlay` → `mdlAOverlay` | モック A-6 |

### 主要作業項目

1. `ui-common.js` の対象6関数について、内部実装を `mdlAOverlay` / `mdlACard` に切り替える
2. 既存 `careOverlay` / `shachoshitsuDecisionOverlay` / `growthEventOverlay` の使用箇所を順次移動
3. `showEventPopup` は `opts.choices` の有無で A型（選択肢あり）と C/D型（表示のみ）に分岐
4. 動作確認（各モーダル単体・連続表示・キュー処理）

### 注意点

- **`showEventPopup` 分岐**: `opts.choices` が `undefined` または `[]` のときは C型か D型（Phase 3/4 で対応予定）。Phase 1 では「選択肢あり」だけ A型に移し、「なし」は既存 `eventPopupOverlay` のまま据え置き
- **派閥 F01 / F04 との関係**: 派閥システム実装で既に `fevt-overlay-office` / `fevt-report-card` が存在。A型は派閥F01/F04そっくりなので、派閥側のCSSを流用するか、`mdl-a-*` に置き換えるか、どちらかを選ぶ。**推奨**: 派閥側も将来的に `mdl-a-*` に統合する方針で、Phase 1 で `mdl-a-*` を新規定義し、派閥側は次機会に統合
- **社長室画面内の契約交渉**: これは「モーダル」ではなく「画面コンテンツ」なので対象外（インベントリ確認済）

### Phase 1 完了判定

- [ ] A-1〜A-6 の6モーダルがすべて `mdl-a-*` クラスで動作
- [ ] 1シーズン通しでテストし、該当イベントが発生した時に新デザインで表示される
- [ ] コミット: `feat(modal): Phase 1 — A型(社長室) 6モーダルを統一デザインに移行`

---

## Phase 2: B型 ステージ（骨格）

### 対象（5モーダル）

最大の工事。`showResultOverlay` の用途別分解を含む。

| # | 新関数 or 流用 | 既存関数 | 注記 |
|---|---|---|---|
| B-1 | `renderMatchPreview` / `renderPPVMatchPreview` / `_renderB2MatchPreview` / `_renderB3MatchPreview` を統合 or 共通化 | `showResultOverlay` 多数 | 通常/PPV/団体戦の差は `variant` パラメータで |
| B-2 | `renderShowResult` / `renderPPVResult` / `renderPPVTVResult` / `_renderB2MatchResult` / `_renderB3MatchResult` / `renderWarFinalResult` | `showResultOverlay` 多数 | 同上 |
| B-3 | `showRivalryPopups` 書き換え（宣戦布告タイプ） | `rivalryPopupOverlay` → `mdlBOverlay` | |
| B-4 | `showRetirementPopups` / `showRetireAdviseResultPopup` | `retirementPopupOverlay` → `mdlBOverlay` | |
| B-5 | `showMilestone` | `milestoneOverlay` → `mdlBOverlay` | |

### 主要作業項目

1. 試合系（B-1/B-2）の統合レンダラを新設（または既存関数を内部で共通呼び出し）
2. 頭上吹き出しコンポーネント（`mdl-b-speech`）を全B型で統一適用
3. `showResultOverlay` の試合系用途を全て `mdlBOverlay` へ移行
4. 旧 `rivalryPopupOverlay` / `retirementPopupOverlay` / `milestoneOverlay` の削除または廃止予告

### 注意点

- **試合プレビュー/結果の関数群は数が多く、用途別の差異（通常 / PPV / B2 / B3 / 団体戦決着）を保持する必要あり**。統合レンダラが複雑になりすぎる場合、まず既存関数を個別に移行し、リファクタは Phase 5 で
- **頭上吹き出しの位置調整**: モックアップではキャラ画像 260×320 に対して吹き出しの `margin-top: 110px` でバランスを取っている。実ゲームで違うサイズの画像を使うとズレる可能性があるため、実装時にブラウザで確認しながら調整
- **`showResultOverlay` は Phase 2 終了時点でほぼ空になる**。Phase 5 で正式に削除

### Phase 2 完了判定

- [ ] B-1〜B-5 の5モーダルがすべて `mdl-b-*` クラスで動作
- [ ] 試合を実行して、プレビュー→試合本体→結果→因縁/引退/マイルストーン の連続フローが崩れない
- [ ] コミット: `feat(modal): Phase 2 — B型(ステージ) 5モーダルを統一デザインに移行`

---

## Phase 3: C型 情報パネル（骨格）

### 対象（3モーダル）

| # | 対応 | 既存 |
|---|---|---|
| C-1 | `showFighterPopup` 微調整（ヘッダー背景を明るい系に・画像240×360化） | `fighterPopupOverlay` 維持、CSS修正 |
| C-2 | `showCoachTooltip` 微調整 | `coachTooltipOverlay` 維持、CSS修正 |
| C-3 | `showEventPopup`（表示のみ分岐）を `mdlCOverlay` に移動 | `eventPopupOverlay` 分離 |

### 主要作業項目

1. **C-1・C-2 は既存デザインを踏襲**しているため大きな変更は不要。ヘッダー背景色の調整など微細な CSS 修正のみ
2. C-3 の新規実装: `showEventPopup` のうち `opts.choices` なしの場合の分岐先として `mdlCOverlay` を用意
3. モックアップ通り、C-3 はアイコン120px中央配置

### 注意点

- **C-1 はゲーム内で最も頻繁に使われるモーダル**。バグが出ると影響大。既存デザイン踏襲を徹底し、余計な変更を加えない
- **タブ（ステータス/契約/関係/技/履歴）の技・履歴タブは既存実装を流用**（モックアップにも明記済）

### Phase 3 完了判定

- [ ] 選手詳細・コーチ情報・コメント表示が新デザインで動作
- [ ] 選手詳細のタブ切り替えが従来通り動く
- [ ] コミット: `feat(modal): Phase 3 — C型(情報) 3モーダルを統一デザインに移行`

---

## Phase 4: D型 軽量（骨格）

### 対象（7モーダル）

| # | 対応 | 既存 |
|---|---|---|
| D-1 | `confirmOverlay` 内部を `mdlDBox` に差し替え | `confirmOverlay` |
| D-2 | `notifModalOverlay` の通知タイプ | `notifModalOverlay` |
| D-3a | `showGlimpseAModal` | `notifModalOverlay` → `mdlDOverlay` |
| D-3b | `showPostMatchDialogues` | `notifModalOverlay` → `mdlDOverlay` |
| D-4 | `careOverlay` のケアタイプを分離 | `careOverlay` 分離（残りは Phase 1 で A型へ） |
| D-5 | `renderScoutCompetitionModal` | inline modal → `mdlDOverlay` |
| D-6 | `showR3Modal`（新規 D型化） | 動的挿入 → `mdlDOverlay` |

### 主要作業項目

1. `confirmOverlay` のHTML/CSSを `mdl-d-*` に置き換え（ID `confirmOverlay` は維持でOK）
2. `notifModalOverlay` を用途別に分解: 通知(D-2) / Glimpse(D-3a) / 試合後対話(D-3b) を別々の関数経路に
3. `careOverlay` の最後の用途（ケアアクション）を D-4 として `mdlDOverlay` へ。他の用途（選択/大型イベント）は Phase 1 でA型に移行済みのはず
4. `renderScoutCompetitionModal` のインラインスタイルを `mdl-d-*` に置き換え
5. `showR3Modal` を B型（旧モック）から D型（新）に書き換え

### 注意点

- **`notifModalOverlay` の分解が難所**: 現状 Glimpse A / 試合後対話 / 通知 が同じコンテナを使い回している。関数ごとに別コンテナ（`mdlDOverlay` を使うが中身テンプレートを切り替え）にするか、`notifModalOverlay` を残して中身だけ 3パターン切り替えるか選択
- **キュー処理**: Glimpse A / 試合後対話は `_enqueuePopup` に乗っているため、キュー処理の互換性を確認

### Phase 4 完了判定

- [ ] D-1〜D-6 の7モーダルがすべて `mdl-d-*` クラスで動作
- [ ] Glimpse / 試合後対話の連続表示が崩れない
- [ ] コミット: `feat(modal): Phase 4 — D型(軽量) 7モーダルを統一デザインに移行`

---

## Phase 5: `showResultOverlay` の整理

### 作業内容

Phase 2 終了時点で `showResultOverlay` の用途はほぼ以下だけ残っているはず:

- Jr.トーナメント一式（E型・統一対象外）
- ドラフト交渉（新システムで別処理済？要確認）

これらを確認し、以下のいずれかを実施:

- (a) `showResultOverlay` を **Jr.トーナメント専用** に縮小し、CSS クラス名も `jr-tournament-overlay` 等に改名
- (b) 完全に削除し、Jr.トーナメントには専用の新オーバーレイを用意

### 主要作業項目

1. `grep "showResultOverlay" src/` で残存用途を全列挙
2. 残っている用途が想定通りか確認
3. 上記 (a) or (b) を実施
4. `index.html` から古い `.show-result-box` 等の CSS を削除

### Phase 5 完了判定

- [ ] `showResultOverlay` の使用箇所が意図通りに限定されている（または削除済み）
- [ ] コミット: `refactor(modal): Phase 5 — showResultOverlay を整理・廃止`

---

## 最終 PR レビューポイント

全Phase完了後、`feature/modal-unification` → `main` の PR を作成。レビューで確認する項目:

- [ ] 全21モーダルが統一テンプレート（A/B/C/D）で動作
- [ ] 旧CSSクラス（`.show-result-box`, `.care-box`, `.event-popup`, `.retirement-popup` 等）が削除されている（意図的に残すもの以外）
- [ ] 旧オーバーレイID（`eventPopupOverlay`, `rivalryPopupOverlay` 等）の廃止判断が明記されている
- [ ] 1シーズン通しでプレイして視覚的崩れ・機能バグがない
- [ ] モバイル表示で崩れがない
- [ ] `docs/ui/modal-inventory-v0.1.md` の内容と実装が一致

---

## 要議論項目（実装中に判断）

以下は Phase 着手時点で未確定。実装担当（Claude Code）が進行しながら判断し、必要に応じて Keisuke へ確認:

1. **モックアップの `mA-*` → 本番 `mdl-a-*` 置換**: 機械的一括置換で対応可能か、意味的に違う箇所があるかを Phase 0 で確認
2. **派閥システム `fevt-*` との統合**: Phase 1 の A型実装時、派閥F01/F04 の既存 `fevt-*` クラスを `mdl-a-*` に寄せるか、別物として並存させるか
3. **`showEventPopup` の分岐ロジック**: `opts.choices` の有無以外にも `opts.detail` の有無で C/D を分ける必要がないか
4. **試合系の統合レンダラ設計**: Phase 2 で統合関数を作るか、既存の個別関数を内部で共通プリミティブに呼び出す形にするか
5. **`showResultOverlay` の扱い確定**: Phase 5 で Jr.トーナメント専用化するか完全削除か

これらは着手時に小さく Keisuke に確認しながら進める。判断に迷う場合は一旦停止し、方針確認。

---

## 実装完了後のドキュメント更新

- `docs/ui/modal-inventory-v0.1.md` → v0.2 として更新（実装反映）
- `docs/ui/01-foundations.md` に統一モーダルトークンを追記
- `docs/ui/mockups/modal-unified-v0.1.html` は参照資料として保持
- 本計画書（`plans/modal-unification-plan-v0.1.md`）は実装完了後に `plans/archive/` に移動
