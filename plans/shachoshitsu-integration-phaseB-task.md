# Phase B: 解雇の社長室化 — 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 1〜1.5時間
> **承認状態**: 設計合意済み（shachoshitsu-integration-spec-v0.2.md）
> **前提**: Phase A（契約交渉の社長室化）完了後に着手

---

## Phase B の目的

選手を解雇する際、「最後の面談」シーンを社長室で行う。現在は選手ポップアップのボタンから即座に実行→結果ポップアップだが、社長室に画面遷移して対面する重みを加える。

解雇ロジック（`App.releaseFighter`）には手を入れない。面談UIの追加のみ。

---

## Phase B で実装するもの

1. 性格×6パターンの別れのセリフデータ
2. 社長室「解雇面談」モード用のレンダリング関数
3. 選手ポップアップの解雇ボタン → 面談遷移に変更
4. 面談での確認後に既存 `releaseFighter` を呼ぶ
5. 面談中のナビゲーションロック

**Phase B で実装しないもの**:
- `App.releaseFighter` のロジック変更
- 関係値更新（O-07）のロジック変更
- ロスターオーバーフロー時の解雇（`_releaseFighterForOverflow`）— これは別フローなので触らない

---

## 事前に必ず読むべきドキュメント

1. `CLAUDE.md` — アーキテクチャ5原則
2. `specs/shachoshitsu-integration-spec-v0.2.md` §4 Phase B セクション
3. `specs/personality-archetype-spec-v1.0.md` — 6性格の定義（セリフ設計に必要）

---

## 既存コードの影響範囲

### 変更するファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/data.js` | 別れのセリフデータ `RELEASE_INTERVIEW_LINES` を追加 |
| `src/ui-render.js` | 社長室解雇面談レンダリング関数を追加 |
| `src/ui-common.js` | 選手ポップアップの解雇ボタン動作を変更 |
| `src/app.js` | `App.startReleaseInterview(charId)` を新設、`releaseFighter` の呼び出し元を変更 |
| `src/index.html` | 解雇面談用 CSS を追加 |

### 触ってはいけない既存コード

- `App.releaseFighter(charId)` の内部ロジック（関係値更新、ロスター除外、FA/dormant振分け等）
- `App._releaseFighterForOverflow(charId)` — ロスター枠超過時の別フロー。面談を挟まない
- `showEventPopup` — 解雇実行後の結果通知はそのまま残して良い。ただし面談で十分なら削除も検討

---

## タスクリスト

### 1. 別れのセリフデータを追加

**ファイル**: `src/data.js`

既存の `CONTRACT_NEGOTIATION_LINES` の近くに追加:

```javascript
const RELEASE_INTERVIEW_LINES = {
  bold: [
    '……悔しいけど、次はもっといい場所で暴れてみせます。見ててください。',
    'こうなったらどこに行っても結果出しますから。覚えておいてくださいよ。',
  ],
  quiet: [
    '……お世話に、なりました。',
    '……わかりました。……ありがとう、ございました。',
  ],
  easygoing: [
    'まあ、こういうこともあるよね。元気でね！',
    'あはは、まあ仕方ないか。楽しかったよ、ここ。',
  ],
  earnest: [
    '至らない点があったなら、申し訳ありませんでした。',
    '力不足でした。……この経験を、次に必ず活かします。',
  ],
  emotional: [
    '嘘でしょ……！ まだやれるのに……！',
    'なんで……っ！ ……わかった、わかりましたよ……。',
  ],
  normal: [
    '短い間でしたが、ありがとうございました。',
    '色々と、お世話になりました。……お元気で。',
  ],
};
```

**パターン数**: 各性格2〜3パターン（RNGで選択）。まず2パターンで実装し、後から追加可能にする。

**`module.exports` に追加**: テスト用に `RELEASE_INTERVIEW_LINES` をエクスポートに含める。

### 2. 社長室解雇面談レンダリング関数を追加

**ファイル**: `src/ui-render.js`

Phase A で追加した `renderShachoshitsuNegotiation` の仕組みを再利用して:

```javascript
function renderShachoshitsuReleaseInterview(fighter, dialogue) {
  // 社長室の壁+机を背景に、解雇面談を表示
  // 壁エリア: 選手ポートレイト（96px） + セリフ吹き出し
  // 机エリア: 確認カード
  //   - ⚠️ 選手の解雇は取り消せません
  //   - [解雇を実行する]（赤系ボタン）
  //   - [やっぱりやめる]（灰系ボタン）
}
```

**壁の季節**: 現在の `G.week` / `G.offSeason` から正しい季節を取得（`getShachoshitsuSeasonId` を使用）。

### 3. 選手ポップアップの解雇ボタンを変更

**ファイル**: `src/ui-common.js` L3178-3184

**変更前**:
```html
<button onclick="closeFighterPopup();releaseFighter(${c.id})" ...>
  🚪 この選手を解雇する
</button>
```

**変更後**:
```html
<button onclick="closeFighterPopup();App.startReleaseInterview(${c.id})" ...>
  🚪 この選手を解雇する
</button>
```

ボタンの表示条件（`inCard` による disabled 等）はそのまま維持。

**注意**: `releaseFighter` のグローバル関数エイリアスは残しておく（他から呼ばれている可能性がある）。

### 4. App.startReleaseInterview を新設

**ファイル**: `src/app.js`

`App.releaseFighter` の直前に追加:

```javascript
startReleaseInterview(charId) {
  const fighter = G.roster.find(c => c.id === charId);
  if (!fighter) return;
  
  // カード登録中チェック（既存の releaseFighter と同じ条件）
  const inCard = (G.showCard || []).some(entry => entry.some(slot => slot && slot.id === charId));
  if (inCard) return;
  
  // セリフ選択
  const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xF1E2, charId));
  const personality = fighter.personality || 'normal';
  const lines = RELEASE_INTERVIEW_LINES[personality] || RELEASE_INTERVIEW_LINES.normal;
  const dialogue = lines[Engine.rng.nextInt(rng, 0, lines.length - 1)];
  
  // 社長室に遷移して面談表示
  // G._releaseInterviewTarget を一時的にセット（面談中の状態管理用）
  G = { ...G, _releaseInterviewTarget: charId };
  showScreen('shachoshitsu');
  renderShachoshitsuReleaseInterview(fighter, dialogue);
},
```

**面談実行ボタン**: `App.confirmRelease(charId)` を呼ぶ → 内部で既存の `App.releaseFighter(charId)` を呼ぶ。

**キャンセルボタン**: `G._releaseInterviewTarget` をクリアして `renderShachoshitsu()` を呼ぶ（通常モードに戻る）。

### 5. ナビゲーションロック

**ファイル**: `src/ui-common.js` の `showScreen` (L5780)

Phase A で追加したロック条件に解雇面談を追加:

```javascript
if (G._releaseInterviewTarget && id !== 'shachoshitsu') return;
```

### 6. 面談完了後のクリーンアップ

解雇実行後:
1. `G._releaseInterviewTarget` を削除
2. 社長室の通常モードに戻る（`renderShachoshitsu()` を呼ぶ）
3. 結果ポップアップ（`showEventPopup`）はそのまま表示

キャンセル時:
1. `G._releaseInterviewTarget` を削除
2. `renderShachoshitsu()` を呼ぶ

---

## 検証

1. **手動テスト**: 選手ポップアップから解雇 → 社長室に遷移 → 面談画面表示 → セリフが性格に応じて変わること
2. **実行確認**: 「解雇を実行する」→ 選手がロスターから除外されること、関係値が更新されること
3. **キャンセル確認**: 「やっぱりやめる」→ 社長室通常画面に戻り、選手がロスターに残っていること
4. **カード登録中**: カード登録中の選手は解雇ボタンが disabled のままであること
5. **ナビロック**: 面談中に他のタブをクリックしても遷移しないこと
6. **auto-sim**: 100シーズン(seed=42) ALL CLEAR
7. **ロスターオーバーフロー解雇**: `_releaseFighterForOverflow` 経由の解雇は面談を挟まず、従来通り動作すること

---

## 完了条件

- [ ] 解雇ボタン → 社長室で面談シーン表示
- [ ] 性格×6パターンのセリフが出る
- [ ] 実行 / キャンセルが正常動作
- [ ] ナビゲーションロックが動作
- [ ] auto-sim 100シーズン ALL CLEAR
- [ ] ロスターオーバーフロー解雇は従来通り
