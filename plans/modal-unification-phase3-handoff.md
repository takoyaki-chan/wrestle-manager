# モーダル統一 Phase 3 引き継ぎ書

> **次セッションで Phase 3(C型・情報パネル 3モーダル) を着手するための引き継ぎ**
> 作成日: 2026-04-24
> 作業ブランチ: `feature/modal-unification`（main へ merge せず継続）

---

## 0. まず読むべきファイル(優先順)

次セッション開始時、以下の順で読めば状況を完全に把握できます:

1. **`plans/modal-unification-plan-v0.1.md`** — プロジェクト全体計画(Phase 0〜5 の全貌)
2. **本ファイル `plans/modal-unification-phase3-handoff.md`** — Phase 2 までの経緯と Phase 3 の具体的指示
3. **`docs/ui/mockups/modal-unified-v0.1.html`** — 統一デザインのモックアップ(C-1〜C-3 は SECTION 7 / L1505〜 にある)
4. **`docs/ui/modal-inventory-v0.1.md`** — 全モーダル現状インベントリ
5. **`CLAUDE.md`** — プロジェクト全体ルール(ハードコード16進禁止、カテゴリ分離など)
6. **`docs/ui/01-foundations.md`** / **`docs/ui/02-layouts.md`** — UI 基礎原則

---

## 1. ここまでの進捗(Phase 0〜2 完了)

### 作業ブランチ

- ブランチ名: `feature/modal-unification`
- 現在の先頭コミット: `dbed137`(push 済み、merge はまだ)
- コミット履歴:
  1. `cdc4e5c` — Phase 0: 統一モーダルテンプレートの CSS 基盤導入
  2. `6847b2a` — Phase 1: A型(社長室) 6モーダルを統一デザインに移行
  3. `258f721` — Phase 1 微調整: A-2 選択マーカー強化・A-3 セリフ吹き出し化
  4. `28ce69a` — Phase 1 追加: 慰労会・合宿(団体書類)も A型に統一
  5. `20258b7` — Phase 2 part1: B-3/B-4/B-5(因縁・引退・マイルストーン)を統一
  6. `dbed137` — Phase 2 part2: 試合プレビュー/結果を B型ステージ演出に(CSSのみ)

### Phase 0 で導入したもの

- **CSS トークン**(`src/index.html` の `:root` 内):
  - `--info-panel-bg`, `--info-panel-border`, `--info-text-main/sub/dim` — **C型用(Phase 3 で使う)**
  - `--lite-panel-bg`, `--lite-panel-border`, `--lite-text-main/sub` — D型用
  - `--accent-positive/negative/info/rival/milestone`, `--space-*`, `--radius-*`
- **テンプレート CSS 本体**(`src/index.html` の `</style>` 直前):
  - `mdl-a-*`(A型), `mdl-b-*`(B型), `mdl-c-*`(C型), `mdl-d-*`(D型) 全クラス定義済み
  - **C型の CSS は既に定義済みなので、Phase 3 では CSS を追加する必要はほぼない**
- **空のオーバーレイコンテナ**(`src/index.html` body 内):
  - `#mdlAOverlay`, `#mdlBOverlay`, `#mdlCOverlay`, `#mdlDOverlay` — 既に配置済み
  - **C型は `#mdlCOverlay` / `#mdlCCard` を使う**(Phase 3 で中身を注入)

### Phase 1 A型 で書き換えた関数(参考)

全て `src/ui-common.js` 内:
- `showChoiceEventModal` (L6446 周辺) — 選択型イベント(A-1)
- `showChoiceEventResult` (A-1 の結果画面)
- `showDecisionTargetModal` (A-2) — 社長室書類・対象選手選択
- `showDecisionConfirmModal` (A-2相当) — 団体書類・事前確認
- `showDecisionResultModal` (A-3) — 決裁結果
- `showRosterOverflowSigningModal` (A-4) — ロスター超過警告
- `showEventPopup` (A-5 分岐) — `opts.choices` 有無で A型/従来に分岐
- `showGrowthEventPopups` / `_renderBreakthroughAsMdlA` (A-6) — ブレークスルーのみ mdl-a

### Phase 1 で導入した `mdl-a-*` ヘルパー(Phase 3 の参考になる)

`src/ui-common.js` の L100 付近に以下のパターンで実装:

```js
function _mdlAOpen(html, opts)      // overlay を active 化
function _mdlAClose()                // 閉じる
function _mdlAHeader(title, meta, opts)
function _mdlAReporterStrip(state, line)  // 派閥の _factionPickReporter を再利用
function _mdlASeasonLabel(state)
function _mdlASubjectStage(fighter, bodyHtml, opts)  // opts.speech で頭上吹き出し
```

**Phase 3 でも同じパターンで `_mdlCOpen` / `_mdlCClose` / `_mdlCHeader` などを作ると統一感が出る。**

### Phase 2 B型 で書き換えた関数(参考)

`src/ui-common.js` 内:
- `showRivalryPopups` / `_renderRivalryPopup` (B-3) — 因縁宣戦布告/決着
- `showRetirementPopups` / `_renderRetirementPopup` / `closeRetirementPopup` (B-4)
- `showRetireAdviseResultPopup` (B-4)
- `showMilestoneEvent` (B-5)

### Phase 2 で導入した `mdl-b-*` ヘルパー

- `_mdlBOpen(html, variant)` — variant: default/sepia/rival/gold
- `_mdlBClose()`
- `_mdlBTitleBand(title, cls, sub)` — B型タイトル帯
- `_mdlBSpeech(speaker, text, variant, size)` — 頭上吹き出し
- `_mdlBCol(fighter, opts)` — 対峙構図の1人分
- `_mdlBSoloStage(fighter, speech, opts)` — ソロ構図
- `_mdlBActions(buttons)` — 下部アクション行

### Phase 2 で試合プレビュー/結果は最小限対応(重要)

- **JS は一切触っていない**。`showResultOverlay` の CSS を B型ステージ風にオーバーライドしただけ
- 10 関数・約 2,500 行の試合レンダリングコード(`renderMatchPreview` / `renderShowResult` / `renderPPVMatchPreview` / `renderPPVResult` / `renderPPVTVResult` / `renderWarFinalResult` / `_renderB2/B3MatchPreview/Result`)はすべて現状維持
- これらの本格書き換えは **Phase 5** で検討(プラン書にも明記済み)

---

## 2. Phase 3 の作業内容

### 対象モーダル(3画面)

`plans/modal-unification-plan-v0.1.md` L285〜 に詳細あり:

| # | 対応 | 既存関数 | 現在位置 |
|---|---|---|---|
| **C-1** 選手詳細 | `showFighterPopup` 微調整 | `fighterPopupOverlay` 維持・CSS 修正 | `src/ui-common.js` / `src/ui-render.js` を grep |
| **C-2** コーチ情報 | `showCoachTooltip` 微調整 | `coachTooltipOverlay` 維持・CSS 修正 | 同上 |
| **C-3** コメント表示 | `showEventPopup` の `opts.choices` なし分岐を `mdlCOverlay` に移動 | `eventPopupOverlay` から分離 | `src/ui-common.js` L1097 付近(`showEventPopup`) |

### 関数位置の見つけ方

次セッション開始時、まず以下で位置を確認:

```bash
grep -n "^function showFighterPopup\|^function showCoachTooltip" src/*.js
```

`showEventPopup` / `_renderEventPopup` は `src/ui-common.js` L1097 付近(Phase 1 で一部書き換え済み、A-5 分岐を追加した箇所を見れば流儀がわかる)。

### モックアップ参照位置

**`docs/ui/mockups/modal-unified-v0.1.html`** 内:
- SECTION 7(L691 付近)に `.mC-*` の CSS 定義(**本番では `.mdl-c-*` に置換済みなので再利用しない**)
- L1505〜 に C-1/C-2/C-3 の HTML モックアップ
  - C-1 (L1506): 選手詳細 — 上半身画像 240×360 + タブ(ステータス/契約/関係/技/履歴)
  - C-2 (L1620 付近想定): コーチ情報 — 顔画像 + 名前 + ステータスバー
  - C-3 (L1700 付近想定): コメント表示 — アイコン 120px 中央配置 + メッセージ

### Phase 3 の作業原則(プランから抜粋)

1. **C-1 はゲーム内で最も頻繁に使われるモーダル**(バグ影響大) — 既存デザイン踏襲を徹底
2. **タブ(ステータス/契約/関係/技/履歴)の技・履歴タブは既存実装を流用** — モックアップにも明記
3. C-1/C-2 は既存デザインを踏襲しているため**大きな変更は不要**。ヘッダー背景色の調整など微細な CSS 修正のみ
4. C-3 は新規実装: `showEventPopup` で `opts.choices` なしの場合に `mdlCOverlay` に流す分岐を追加
5. C-3 はアイコン 120px 中央配置

### Phase 3 完了判定(プランから)

- [ ] 選手詳細・コーチ情報・コメント表示が新デザインで動作
- [ ] 選手詳細のタブ切り替えが従来通り動く
- [ ] コミット: `feat(modal): Phase 3 — C型(情報) 3モーダルを統一デザインに移行`

---

## 3. 重要な注意点・過去の経緯

### A-2 選択マーカーについて(Phase 1 でユーザ指摘)

- A-2(対象選手選択)で選択中のカードが分かりにくいと指摘があった
- 対応: `.mdl-a-decision-card.is-selected` にゴールド枠・背景グラデ・右上 ✓ バッジを付けた
- C-1 でもカード/タブの選択状態は明確にすること

### A-3 セリフ位置について(Phase 1 でユーザ指摘)

- 当初は左ボーダー付き bubble でセリフを表示 → 頭上吹き出しに変更された
- `_mdlASubjectStage(fighter, bodyHtml, { speech: text })` で実現
- CSS: `.mdl-a-speech`(クリーム背景の吹き出し)、`src/index.html` 内
- C型でも同じ発想でセリフ/コメントは自然な位置に置く

### 慰労会・合宿の背景について(Phase 1 でユーザ指摘)

- `showDecisionConfirmModal`(団体書類)は当初 Phase 1 対象外だったが、ボーナス支給などと背景が違って違和感があったため追加で mdl-a 化した
- C型でも**同種の関数で別系統のモーダルがないか**確認すること

### 試合プレビュー/結果の扱い(Phase 2 で判断)

- ユーザの承認を得て **最小限の CSS オーバーライドのみ** で対応
- 全面書き換えは Phase 5 で検討
- C型には該当しないが、**「大きな既存関数を無理に書き換えない」判断パターン**として参考に

### スクリーンショットツールの制約

- `preview_screenshot` が何度もタイムアウトする事象あり
- 代わりに `preview_eval` で DOM 検査(`getComputedStyle`, `querySelector` など)で検証した
- Phase 3 でも同じ手法で検証することを推奨

### ブラウザ dev server

- `preview_list` で起動中サーバ確認可能(Phase 2 時点で `3ccaa3f0-e8d3-442c-aa9e-922ecd261c2d` が走っていた)
- 新セッションでは ID が変わるので `preview_list` で取得してから使う

---

## 4. Phase 3 開始時の推奨ワークフロー

1. **状況把握**(10分)
   ```bash
   cd C:\Users\nkmrk\Downloads\wrestle-manager
   git log --oneline -10                    # 直近コミット確認
   git status                                # 現在の作業状態
   git branch                                # ブランチ確認
   ```

2. **対象関数を特定**(5分)
   ```bash
   grep -n "^function showFighterPopup\|^function showCoachTooltip" src/*.js
   ```

3. **既存実装を読む**(30分)
   - `showFighterPopup`(C-1): タブ構造・画像サイズ・データ表示を確認
   - `showCoachTooltip`(C-2): よりシンプルなはず
   - 呼び出し箇所も grep して影響範囲を把握

4. **`_mdlC*` ヘルパー追加**(Phase 1/2 と同パターン)
   - `src/ui-common.js` の `_mdlBActions` の直後(L200 付近)に追加推奨

5. **書き換え着手**
   - C-1 → C-2 → C-3 の順(C-1 が最重要・最大)
   - 既存の `fighter-popup-*` / `coach-tooltip-*` クラスは段階廃止

6. **検証**
   ```js
   // preview_eval で
   showFighterPopup(G.roster[0].id)
   // DOM 検査でタブ・画像・ステータスバーが正しく描画されているか
   ```

7. **コミット**
   ```
   feat(modal): Phase 3 — C型(情報) 3モーダルを統一デザインに移行
   ```

---

## 5. 想定所要時間

プラン書では **1〜2時間**(全Phaseで最も小さい)。C-1 は既存デザインを踏襲するので CSS 微調整のみ、C-3 は新規だが小規模。

---

## 6. 未着手の後続 Phase

- **Phase 4**: D型(軽量) 7モーダル — 3〜4h
- **Phase 5**: `showResultOverlay` の整理 + B-1/B-2 の本格書き換え(判断しだい) — 1h〜

---

## 7. ファイル位置まとめ(絶対パス)

### 作業対象ファイル

- `C:\Users\nkmrk\Downloads\wrestle-manager\src\index.html` — CSS, コンテナ定義
- `C:\Users\nkmrk\Downloads\wrestle-manager\src\ui-common.js` — 全モーダル関数
- `C:\Users\nkmrk\Downloads\wrestle-manager\src\ui-render.js` — 画面描画(コーチ・選手詳細で使われる可能性)
- `C:\Users\nkmrk\Downloads\wrestle-manager\src\app.js` — 呼び出し側(変更は最小限)

### 参照ドキュメント

- `C:\Users\nkmrk\Downloads\wrestle-manager\plans\modal-unification-plan-v0.1.md` — 全体計画
- `C:\Users\nkmrk\Downloads\wrestle-manager\docs\ui\modal-inventory-v0.1.md` — 現状インベントリ
- `C:\Users\nkmrk\Downloads\wrestle-manager\docs\ui\mockups\modal-unified-v0.1.html` — モックアップ
- `C:\Users\nkmrk\Downloads\wrestle-manager\CLAUDE.md` — プロジェクトルール
- `C:\Users\nkmrk\Downloads\wrestle-manager\docs\ui\01-foundations.md` / `02-layouts.md` — UI基礎

### 本ファイル

- `C:\Users\nkmrk\Downloads\wrestle-manager\plans\modal-unification-phase3-handoff.md`

---

## 8. 次セッション開始時に言うべきフレーズ例

```
Phase 3 を開始します。
plans/modal-unification-phase3-handoff.md を読んでから進めてください。
```

これで次の Claude が状況を把握して直ちに着手できます。
