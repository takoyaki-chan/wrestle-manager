# モーダル統一 Phase 4 引き継ぎ書

> **次セッションで Phase 4(D型・軽量ダイアログ 7モーダル) を着手するための引き継ぎ**
> 作成日: 2026-04-24
> 作業ブランチ: `feature/modal-unification`（main へ merge せず継続）

---

## 0. まず読むべきファイル(優先順)

1. **`plans/modal-unification-plan-v0.1.md`** — プロジェクト全体計画(Phase 0〜5 の全貌)
2. **本ファイル `plans/modal-unification-phase4-handoff.md`** — Phase 3 までの経緯と Phase 4 の具体的指示
3. **`docs/ui/mockups/modal-unified-v0.1.html`** — 統一デザインのモックアップ(D-1〜D-3b は SECTION 8 / L1664〜 にある)
4. **`docs/ui/modal-inventory-v0.1.md`** — 全モーダル現状インベントリ
5. **`CLAUDE.md`** — プロジェクト全体ルール

---

## 1. ここまでの進捗(Phase 0〜3 完了)

### 作業ブランチ

- ブランチ名: `feature/modal-unification`
- 現在の先頭コミット: `8b01edf`(push 済み)
- コミット履歴:
  1. `cdc4e5c` — Phase 0: CSS 基盤導入
  2. `6847b2a` — Phase 1: A型 6モーダル
  3. `258f721` — Phase 1 微調整
  4. `28ce69a` — Phase 1 追加(慰労会・合宿)
  5. `20258b7` — Phase 2 part1: B-3/B-4/B-5
  6. `dbed137` — Phase 2 part2: 試合プレビュー/結果 CSS
  7. `d9e97d0` — Phase 3 引き継ぎ書
  8. `8b01edf` — **Phase 3: C型 3モーダル** ← 現在ここ

### Phase 3 で実装したもの

- **`_mdlCOpen(html, opts)` / `_mdlCClose()`** — `src/ui-common.js` L250 付近に追加
- **`_renderEventPopupAsC3()`** — `src/ui-common.js` に追加。`showEventPopup`(choices なし)を `#mdlCOverlay` に流す
- **`closeEventPopup`** — `_mdlCClose()` + `_renderEventPopupAsC3()` に更新済み
- **CSS オーバーライド** — `src/index.html` の mdl-c ブロック末尾に以下を追記:
  ```css
  .fighter-popup-box { background: var(--info-panel-bg); border-color: var(--info-panel-border); }
  .coach-tooltip-overlay .coach-tooltip-box { background: var(--info-panel-bg); border-color: var(--info-panel-border); }
  ```

### Phase 0 で導入済みの資産(Phase 4 でも使う)

- **D型 CSS トークン**: `--lite-panel-bg`, `--lite-panel-border`, `--lite-text-main/sub` — `src/index.html` `:root` 内
- **`mdl-d-*` CSS クラス**: `src/index.html` に定義済み。`mdl-d-overlay`, `mdl-d-box`, `mdl-d-title`, `mdl-d-body`, `mdl-d-actions`, `mdl-d-btn`（primary/secondary）
- **`#mdlDOverlay`** — `src/index.html` body 内に配置済み。中身は空で Phase 4 で注入する

---

## 2. Phase 4 の作業内容

### 対象モーダル(7画面)

`plans/modal-unification-plan-v0.1.md` L314〜 に詳細あり:

| # | 既存関数/要素 | 対応内容 |
|---|---|---|
| **D-1** 確認ダイアログ | `confirmOverlay` 内の HTML | `mdl-d-*` クラスに置き換え。`confirmOverlay` ID は維持 |
| **D-2** 通知 | `notifModalOverlay` の「通知タイプ」 | `mdlDOverlay` に流す分岐を追加 |
| **D-3a** Glimpse A | `showGlimpseAModal` | `notifModalOverlay` → `mdlDOverlay` |
| **D-3b** 試合後対話 | `showPostMatchDialogues` | `notifModalOverlay` → `mdlDOverlay` |
| **D-4** ケアアクション | `careOverlay`（ケア型残存分） | `mdlDOverlay` に移動 |
| **D-5** スカウト競合 | `renderScoutCompetitionModal` | インラインスタイル → `mdl-d-*` |
| **D-6** R3モーダル | `showR3Modal` | 動的挿入 → `mdlDOverlay` |

### 関数位置の見つけ方

次セッション開始時に以下を実行して位置を把握する:

```bash
grep -n "^function showGlimpseAModal\|^function showPostMatchDialogues\|^function showR3Modal\|^function renderScoutCompetitionModal\|confirmOverlay\|notifModalOverlay" src/ui-common.js | head -30
grep -n "careOverlay" src/ui-common.js | grep "classList\|innerHTML" | head -20
```

### モックアップ参照位置

**`docs/ui/mockups/modal-unified-v0.1.html`** 内 L1664〜:
- D-1: 確認ダイアログ (L1669)
- D-2: 通知1ボタン (L1683)
- D-3a: Glimpse A — 2人構図 (L1697)
- D-3b: 試合後対話 — 顔+セリフ (L1723)

---

## 3. Phase 4 の難所と注意点

### 最大の難所: `notifModalOverlay` の分解 (D-2/D-3a/D-3b)

現状、`notifModalOverlay` が **Glimpse A / 試合後対話 / 通知** の 3用途を共有している。
`showGlimpseAModal` / `showPostMatchDialogues` を grep して実態を把握してから設計すること。

**推奨アプローチ**: `notifModalOverlay` はそのまま残しつつ、各関数の「HTML 生成」だけを `mdl-d-*` クラスに置き換える。`notifModalOverlay` の ID は他の呼び出し元が残っている可能性があるため削除しない。

### D-4: `careOverlay` の残存分

Phase 1 で A型に移行したケアアクション以外に、`careOverlay` が何かに使われていないか確認。
```bash
grep -n "careOverlay" src/*.js | grep -v "^Binary"
```
まだ残っていれば `mdlDOverlay` に移動。すでに使われていなければスキップ可。

### D-6: `showR3Modal` の動的挿入

`showR3Modal` は `document.body.appendChild` などで DOM を直接生成している可能性あり。
`mdlDOverlay` の中身を注入する方式（A/B/C 型と同パターン）に書き換える。

### キュー処理との互換性

Glimpse A / 試合後対話は `_enqueuePopup` に乗っているため、`mdlDOverlay` を使う場合は `mdlDOverlay` が `_POPUP_OVERLAY_IDS`（`src/ui-common.js` L44）にすでに含まれているか確認すること。

**確認済み**: Phase 0 で `_POPUP_OVERLAY_IDS` に `'mdlDOverlay'` が追加済み（L44）。

---

## 4. Phase 4 開始時の推奨ワークフロー

1. **状況把握**
   ```bash
   cd C:\Users\nkmrk\Downloads\wrestle-manager
   git log --oneline -10
   git branch
   ```

2. **対象関数を特定**
   ```bash
   grep -n "^function show\|^function render\|notifModalOverlay\|careOverlay\|confirmOverlay" src/ui-common.js | head -40
   ```

3. **D型 ヘルパー追加** (Phase 1/2/3 と同パターン)
   `src/ui-common.js` の `_mdlCClose()` 直後に:
   ```js
   function _mdlDOpen(html, opts) { ... }  // mdlDOverlay を操作
   function _mdlDClose() { ... }
   ```

4. **書き換え着手** — D-1 → D-2/D-3a/D-3b → D-4 → D-5 → D-6 の順推奨
   - D-1 は最もシンプル(CSS 置き換えのみ)
   - D-2/D-3a/D-3b が最大の難所。調査に時間をかける

5. **コミット**
   ```
   feat(modal): Phase 4 — D型(軽量) 7モーダルを統一デザインに移行
   ```

---

## 5. Phase 4 完了判定

プランから:
- [ ] D-1〜D-6 の7モーダルが `mdl-d-*` クラスで動作
- [ ] Glimpse / 試合後対話の連続表示が崩れない
- [ ] コミット完了

---

## 6. 未着手の後続 Phase

- **Phase 5**: `showResultOverlay` の整理 + 用途確認 — 1h 程度

---

## 7. ファイル位置まとめ

### 作業対象ファイル

- `C:\Users\nkmrk\Downloads\wrestle-manager\src\index.html` — CSS, コンテナ定義
- `C:\Users\nkmrk\Downloads\wrestle-manager\src\ui-common.js` — 全モーダル関数
- `C:\Users\nkmrk\Downloads\wrestle-manager\src\app.js` — 呼び出し側(変更は最小限)

### 参照ドキュメント

- `C:\Users\nkmrk\Downloads\wrestle-manager\plans\modal-unification-plan-v0.1.md`
- `C:\Users\nkmrk\Downloads\wrestle-manager\docs\ui\modal-inventory-v0.1.md`
- `C:\Users\nkmrk\Downloads\wrestle-manager\docs\ui\mockups\modal-unified-v0.1.html`

---

## 8. 次セッション開始時に言うべきフレーズ例

```
Phase 4 を開始します。
plans/modal-unification-phase4-handoff.md を読んでから進めてください。
```
