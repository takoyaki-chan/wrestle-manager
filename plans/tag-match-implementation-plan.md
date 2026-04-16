# タッグマッチ本実装計画（ドラフト）

> 作成: 2026-04-16  
> 目的: プロトタイプ → 本体統合のロードマップを次セッション用に整理  
> 前提: `specs/tag-match-system-spec-v0.1.md`（設計12項目確定済み）+ プロトタイプUI統一完了

---

## 現状

| 成果物 | 状態 |
|--------|------|
| 仕様書 (`specs/tag-match-system-spec-v0.1.md`) | 完成（611行、12設計項目確定） |
| プロトタイプエンジン (`match-viewer.html` 内 TagEngine) | 動作する独立エンジン |
| UI モックアップ (`match-screen-tag.html`) | シングル準拠でデザイン統一済み |
| 本体統合 | 未着手 |

---

## フェーズ構成案

### Phase 1: エンジン統合（match-engine.js）✅ 完了 2026-04-16

**完了内容**:
- `Engine.tagMatch` 名前空間に移植（`match-engine.js`）。`Engine.battle` の共通関数を流用
- `data.js` に `TAG_MATCH_CONFIG` / `STYLE_COMPAT_MATRIX` / `STYLE_TAG_MOVES` / `getStyleCompat()` / `getTagMove()` 追加
- シングルとタッグは別関数として分離（条件分岐の複雑化回避）
- bond/tagExpはオプション引数 → Phase 3で`G.relationships`から取得

**検証**: auto-sim 100シーズン ALL CLEAR + タッグ専用1000試合 ALL CLEAR（`test/tag-match-test.js`）

---

### Phase 2: 興行カード編成（app.js / ui-render.js / ui-common.js）✅ 完了 2026-04-16

**完了内容**:
- 興行準備画面に「🤝 タッグマッチ枠」ボタン追加（空シングル2枠をタッグ1枠に変換）
- タッグ1試合=シングル2枠消費ルール（getCardWeight()ベースpad/trim）
- チーム編成UI（4名独立ピッカー+ケミストリー表示+タッグ経験表示）
- App.addTagSlot/removeTagSlot/setTagSlotFighter（スワップ対応）
- executeShow: sanitize/validMatches/confrontationのタッグ対応
- skipMatch: タッグ→simulateTagMatch呼び出し（bond/tagExp連携）
- watchMatch: タッグは自動スキップ（Phase 4まで）
- renderMatchPreview: タッグ試合カード（4名表示+スキップのみ）
- App.finalizeShow: 全30+箇所のタッグ対応（因縁スキップ/成長4名/relationship/h2h/tagExp等）
- renderShowResult: タッグ結果カード表示
- 自動編成はシングルのみ（タッグは手動追加）
- ビジュアル観戦はPhase 4で対応

**検証**: auto-sim 100シーズン ALL CLEAR

---

### Phase 3: 試合結果処理（management.js / relationships.js）

**目標**: タッグ試合の結果が全ゲームシステムに正しく反映される

**作業内容**:
- `applyMatchResult` をタッグ対応（4者間の bond/rivalry 変動）
- タッグ試合の成長処理（試合経験値、ブレークスルー判定）
- MQ計算とorgPop/集客への反映
- タッグ経験値（tag experience）の蓄積と保存
- h2h データへのタッグ戦績記録
- ケミストリー値の記録（ペア別に蓄積 → 再起用時に参照）
- matchupLog（マンネリ判定）へのタッグカード記録

**検討事項**:
- タッグのMQはシングルと同じスケール？ 別スケール？
- 4人全員にtrust変動を適用（出場扱い）
- タッグ試合中の怪我判定

---

### Phase 4: ビジュアル観戦（battle-engine.html）

**目標**: タッグ試合のビジュアル観戦モード

**作業内容**:
- `battle-engine.html` にタッグモード分岐を追加
- プロトタイプのUI統一結果をそのまま適用:
  - シングル準拠HUD（顔+名前+HPバー+モメンタムバー）
  - 3カラムレイアウト（メインカード+apronカード / 中央列 / メインカード+apronカード）
  - Battle Log 高さ同期
  - ネイビー排除済みカラーパレット
- タッグ固有演出:
  - タッチアニメーション（カード入れ替え）
  - 反撃のタッチ（旧ホットタグ）バナー
  - ダブルチーム演出
  - カットイン演出
- `app.js` の `watchMatch` にタッグ分岐を追加

**検討事項**:
- iframe通信プロトコル（`postMessage`）にタッグ固有フィールド追加
- シングル/タッグで `battle-engine.html` を1ファイルで兼用 vs 分離

---

### Phase 5: AI・イベント連携

**目標**: タッグがゲーム世界に自然に組み込まれる

**作業内容**:
- AI団体のタッグ試合自動編成・実行
- スナップショット通知にタッグ関連イベント追加
- 新聞テキストにタッグ結果表示
- 表彰式にベストタッグ賞（将来）
- タッグ王座導入（将来）

---

## 実装順序の優先度

```
Phase 1（エンジン）→ Phase 3（結果処理）→ Phase 2（カード編成UI）→ Phase 4（観戦）→ Phase 5（AI・イベント）
```

理由:
- Phase 1+3 が揃えば auto-sim で品質保証できる
- Phase 2 でプレイヤーが使えるようになる
- Phase 4 は見た目の問題なので後でも機能する（テキスト結果は先に出せる）
- Phase 5 は段階的に追加可能

---

## リスクと要検討事項

1. **match-engine.js の肥大化**: 現在330行 → タッグ追加で倍以上。ファイル分割を検討？
2. **battle-engine.html の分岐複雑度**: シングル/タッグ兼用は可能だが条件分岐が多い。別ファイル `battle-engine-tag.html` にする選択肢もある
3. **タッグ王座**: Phase 5 で言及したが、title-system-spec への影響が大きい。別タスクとして切り出すべき
4. **PPV/対抗戦でのタッグ**: PPV GRAND FINAL やライバル対抗戦にタッグ枠を入れるか。スコープ膨張注意
5. **テスト負荷**: 4人×セグメント×タッチ×ドラマの組み合わせ爆発。auto-sim の検証項目拡張が必要

---

## モデル振り分け（Opus / Sonnet）

| Phase | 推奨 | 理由 |
|-------|------|------|
| 1: エンジン統合 | **Opus** | 2つのエンジン統合の設計判断、共通インターフェース設計、RNG体系統合。アーキテクチャ決定が多い |
| 3: 結果処理 | **Opus → Sonnet** | 初回設計(applyMatchResult拡張方針)はOpus、実装の大部分は既存パターン踏襲なのでSonnet可 |
| 2: カード編成UI | **Sonnet** | 既存の興行準備UIパターンに沿った追加。仕様が明確なら機械的作業 |
| 4: ビジュアル観戦 | **Opus** | UIポート自体は機械的だが、カットインセリフ・ナレーション・ドラマ演出テキストの品質はOpusが望ましい |
| 5: AI・イベント連携 | **Opus** | 新聞テキスト・スナップショット通知・表彰式セリフなど文章生成を含む |

**まとめ**: Sonnetで済むのは **Phase 2（カード編成UI）** と **Phase 3 の実装作業**のみ。文章品質が求められるPhaseはOpus推奨。

---

## 次セッションへの申し送り

- この計画書をベースに Phase 1 の詳細設計を議論
- プロトタイプ `TagEngine` のコードを読んで本体移植の具体的な差分を洗い出す
- `battle-engine.html` をシングル/タッグ兼用にするか分離するかの判断
