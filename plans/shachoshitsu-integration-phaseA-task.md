# Phase A: 契約交渉の社長室化 — 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 2〜3時間
> **承認状態**: 設計合意済み（shachoshitsu-integration-spec-v0.2.md）
> **前提**: 社長室 Phase 1-9 実装完了済

---

## Phase A の目的

オフシーズン第2週の契約交渉を `careOverlay` モーダルから**社長室画面内**に移す。壁+窓+机の背景の中で、選手と対面して交渉するレイアウトに変更する。

ロジック（`Engine.contract`）には一切手を入れない。変わるのは表示先だけ。

---

## Phase A で実装するもの

1. 社長室画面に「交渉モード」のレンダリング関数群を追加
2. offWeek 2 発火時に `showScreen('shachoshitsu')` へ遷移させる
3. 既存6つの Contract モーダル関数を社長室内レンダリングに書き換え
4. 交渉中のナビゲーションロック
5. 交渉中は社長室の内部タブを非表示にする

**Phase A で実装しないもの**:
- `Engine.contract` のロジック変更
- `careOverlay` を使う他のモーダル（選択型イベント・対抗戦・挑戦状等）の変更
- 社長室の内部タブ（Phase C の範囲）
- 解雇面談（Phase B の範囲）

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. `CLAUDE.md` — 特にアーキテクチャ5原則、開発ルール
2. `specs/shachoshitsu-integration-spec-v0.2.md` §3 Phase A セクション全体
3. `specs/shachoshitsu-spec-v1.0.md` §7（社長室UIの既存構造）
4. `specs/contract-negotiation-spec-v2.0.md` §3〜§6（交渉マトリクス・フロー）

---

## 既存コードの影響範囲（重要）

### 変更するファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/ui-render.js` | 社長室交渉モード用のレンダリング関数を新規追加 |
| `src/ui-common.js` | 6つの `showContract*Modal` 関数を書き換え |
| `src/app.js` | `handleContractNegotiations` 内の画面遷移先を変更、交渉中ナビロック追加 |
| `src/index.html` | 交渉モード用 CSS を追加 |

### 触ってはいけない既存コード

- `Engine.contract` 名前空間の全ロジック（`management.js`）— ロジックは完全にそのまま
- `careOverlay` / `careBox` の DOM 要素 — 他の10+モーダルが使用中
- `.care-overlay` / `.care-box` / `.care-title` / `.care-reaction*` 等の CSS クラス — 共有クラスなので削除不可
- `showContractSummaryModal` 等の関数名自体は維持しても良い（内部実装だけ変える）

---

## 書き換え対象の6関数（ui-common.js）

すべて現在 `careOverlay` / `careBox` を使用。これを `shachoshitsuContent` への `innerHTML` 差し替えに変更する。

| 関数名 | 行番号 | 役割 |
|--------|-------|------|
| `showContractSummaryModal` | L8533 | 交渉開始前のサマリー画面 |
| `showContractNegotiationModal` | L8575 | 1対1交渉画面（セリフ+選択肢） |
| `showContractReactionModal` | L8663 | 選択後のリアクション表示 |
| `showContractListenModal` | L8689 | 移籍志願の「理由を聞く」サブ選択 |
| `showContractSuddenDepartureModal` | L8733 | 突発退団（選択肢なし） |
| `showContractResultModal` | L8770 | 全交渉完了後の結果サマリー |

---

## タスクリスト

### 1. 社長室交渉モードのレンダリング関数を追加

**ファイル**: `src/ui-render.js`

`renderShachoshitsu()` の近くに以下を新設:

```javascript
function renderShachoshitsuNegotiation(contentHtml) {
  // 社長室の壁+机を背景に、交渉コンテンツを表示する
  // - HUD: 「シーズンN 契約更新」表示（印鑑は非表示）
  // - 内部タブ: 非表示
  // - 壁: 冬の窓（オフシーズン = 冬）
  // - 机: contentHtml をカード風に配置
}
```

この関数は「社長室背景 + 中央にコンテンツ」を描画する共通テンプレート。各モーダル関数がこれを呼んで中身を差し替える。

**壁エリア**: 選手のポートレイト（96px）と吹き出しセリフを配置
**机エリア**: 金額情報カード + 選択肢ボタン

既存の `renderShachoshitsu()` を参考に、壁画像・机画像の参照方法を合わせること。

### 2. showContractSummaryModal を書き換え

**ファイル**: `src/ui-common.js` L8533

**変更前**: `careOverlay` / `careBox` に HTML を流し込み、`overlay.classList.add('active')` で表示

**変更後**:
1. `showScreen('shachoshitsu')` を呼んで社長室画面に遷移
2. `renderShachoshitsuNegotiation()` で社長室背景を描画
3. 机の上に「対象者一覧カード」を配置（顔一覧 + 「交渉を始める」ボタン）
4. コールバックは維持（ボタンクリックで `onStart()` を呼ぶ）

**注意**: `Audio.play('paper')` 等のSEはそのまま維持。

### 3. showContractNegotiationModal を書き換え

**ファイル**: `src/ui-common.js` L8575

最も重要な画面。壁前に選手、机上に選択肢。

**壁エリア**:
```html
<div class="shachoshitsu-wall" style="background-image:url('../image/shachoshitsu/wall-window-winter.webp')">
  <!-- ポートレイト + セリフ吹き出し -->
  <div class="negotiation-speaker">
    [portraitImg 96px]
    <div class="negotiation-bubble">
      <strong>選手名</strong> [態度バッジ]
      「セリフ」
    </div>
  </div>
</div>
```

**机エリア**:
```html
<div class="shachoshitsu-desk">
  <!-- 交渉書類カード -->
  <div class="negotiation-card">
    [金額情報]
    [選択肢ボタン ×3]
  </div>
</div>
```

**コールバック**: 選択肢ボタンのクリックで `onChoice(choiceIdx)` を呼ぶ。これは既存と同じ。

### 4. 残り4つのモーダルを同様に書き換え

- `showContractReactionModal`: 壁前に選手セリフ + 机上に「次へ」ボタン
- `showContractListenModal`: 壁前にセリフ + 机上にサブ選択（引き留め/送り出す）
- `showContractSuddenDepartureModal`: 壁前に選手 + 机上に「……わかった」ボタン
- `showContractResultModal`: 机上に結果サマリーカード + 「シーズン開幕へ」ボタン

### 5. app.js の遷移先を変更

**ファイル**: `src/app.js`

`handleContractNegotiations` (L3475) の先頭で:

```javascript
// 社長室に遷移（交渉モード）
showScreen('shachoshitsu');
```

を追加。この後の `processNext()` → `showContractSummaryModal()` の呼び出しチェーンで、各モーダルが社長室内に描画される。

### 6. 交渉中のナビゲーションロック

**ファイル**: `src/ui-common.js` の `showScreen` 関数 (L5780)

```javascript
function showScreen(id, evt) {
  // 交渉中は社長室以外への遷移をブロック
  if (G.weekPhase === 'contractNegotiation' && id !== 'shachoshitsu') return;
  // ... 既存コード
}
```

---

## CSS 追加（index.html）

交渉モード用のスタイルを追加:

```css
/* 交渉画面 — 壁前の発言者 */
.negotiation-speaker { ... }
.negotiation-bubble { ... }
/* 交渉画面 — 机上のカード */
.negotiation-card { ... }
/* 態度バッジ */
.negotiation-badge-raise { color: #f39c12; }
.negotiation-badge-transfer { color: #e74c3c; }
.negotiation-badge-sudden { color: #8e44ad; }
```

既存の社長室 CSS トークン（`--shachoshitsu-*`）を活用すること。

---

## 検証

1. **手動テスト**: 新規ゲーム開始 → オフシーズン第2週まで進める → 契約交渉が社長室背景で表示されることを確認
2. **全パターン**: 昇給要求・移籍志願・突発退団・交渉→移籍発展の4パターンを確認
3. **ナビロック**: 交渉中にトップバーの他のタブをクリックしても遷移しないことを確認
4. **auto-sim**: 100シーズン(seed=42) ALL CLEAR（違反0/エラー0/ゲームオーバー0）
5. **既存モーダル**: 選択型イベント・対抗戦等の `careOverlay` モーダルが引き続き動作することを確認

---

## 完了条件

- [ ] 契約交渉が社長室背景で表示される（careOverlay 不使用）
- [ ] 6つの交渉画面（サマリー・個別交渉・リアクション・理由聞き・突発退団・結果）がすべて動作
- [ ] 交渉中のナビゲーションロックが動作
- [ ] SE（サウンドエフェクト）が維持されている
- [ ] auto-sim 100シーズン ALL CLEAR
- [ ] `careOverlay` を使う他のモーダルが壊れていない
