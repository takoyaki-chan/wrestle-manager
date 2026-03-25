# TASK-03: ファン希望カードのマンネリ重複回避 — 計画書

## 概要

ファンが希望する対戦カード（ファン期待カード）の生成時に、staleness（マンネリ度）の高い組み合わせが推薦されてしまう問題を修正する。

## 現状の問題

### ファン期待カード生成ロジック

`Engine.fanExpect.generate()` (engine.js L12232-12303) は以下の3カテゴリからカードを生成する:

1. **Priority 3**: rivalry値の高いペア（因縁系） — L12249-12276
2. **Priority 2**: チャンピオンへの挑戦（人気上位挑戦者） — L12278-12292
3. **Priority 1**: 人気上位2名の対決 — L12294-12301

**問題**: いずれのカテゴリでもカード鮮度（staleness/freshness）を一切参照していない。

### カード鮮度システム

`Engine.freshness.calc()` (engine.js L12186-12224) が鮮度を計算する:
- `matchupLog`: 全対戦履歴 `[{leftId, rightId, showCount}, ...]`
- 12興行ウィンドウ内の同カード回数でペナルティを判定
- 3回以上 → 「マンネリ」(MQ-3)、4回以上 → 「深刻なマンネリ」(MQ-5)、5回以上 → 「完全なマンネリ」(MQ-8)
- 設定値は `FRESHNESS_CONFIG.penalties` で定義

### 具体的な問題シナリオ

rivalry値が高い2選手は何度も対戦させられるため、matchupLog内で同カードが積み上がる。しかしファン期待カードはrivalry値だけで推薦するため、「マンネリ」ペナルティが付くカードをファンが望んでいるという矛盾が発生する。プレイヤーがファンの声に従うとMQペナルティを食らう。

## 変更方針

### Engine.fanExpect.generate() 内でfreshnessを参照

#### 変更箇所: engine.js L12232-12303 `Engine.fanExpect.generate()`

```js
generate(state) {
  const roster = (state.roster || []).filter(f => !f.injury && !f.isRental);
  if (roster.length < 2) return [];
  const matchupLog = state.matchupLog || [];
  const totalShows = state.totalShows || 0;
  // ... (既存コード)

  const addCandidate = (f1, f2, reason, priority) => {
    if (!f1 || !f2 || f1.id === f2.id) return;
    const key = [f1.id, f2.id].sort().join('-');
    if (seen.has(key)) return;
    seen.add(key);
    // ★追加: freshnessチェック
    const freshness = Engine.freshness.calc(matchupLog, f1.id, f2.id, totalShows);
    if (freshness.bonus <= -5) return; // 深刻なマンネリ以上は除外
    const adjustedPriority = freshness.bonus < 0 ? Math.max(0, priority - 1) : priority;
    candidates.push({ leftId: f1.id, rightId: f2.id, leftName: f1.name, rightName: f2.name, reason, priority: adjustedPriority });
  };
```

#### 変更の詳細

1. **深刻なマンネリ（MQ-5以上、countInWindow >= 4）**: ファン期待カードから完全除外
   - 根拠（基準スケール）: MQ-5は1試合の品質に大きく影響する閾値
   - 根拠（相対比較）: ファン期待ボーナスがMQ+5なので、-5以上のペナルティがあると相殺以下
   - 根拠（プレイヤー体験）: ファンが望むカードに従ってもMQペナルティが出るのは理不尽

2. **マンネリ（MQ-3、countInWindow >= 3）**: priority を1段階下げる
   - 根拠（基準スケール）: MQ-3はファン期待ボーナスMQ+5でまだ+2の余地あり
   - 根拠（相対比較）: 他の候補と比べて優先度を下げるが、候補がなければ出す
   - 根拠（プレイヤー体験）: 「ファンはまだ見たがっているが、そろそろ新鮮味が…」という自然な状態

3. **初顔合わせ・鮮度正常**: 変更なし（現行通り）

#### reason テキストへの反映（オプション）

マンネリ気味のカードがpriority降格で残った場合、reasonテキストを調整:
```js
if (freshness.bonus < 0) {
  reason = reason.replace('期待の声', '根強い人気はあるが新鮮味も求める声');
}
```

## 影響範囲

- **engine.js**: `Engine.fanExpect.generate()` (L12232-12303) のみ
- **ui-render.js**: 表示側（L1842-1854）は変更不要（generate結果をそのまま使うため）
- **engine.js**: `Engine.freshness.calc()` は読み取り専用で変更なし

他システムへの影響: ファン期待カードの候補が減る可能性があるが、最大3件中1-2件が入れ替わる程度。候補が0件になった場合の既存挙動（空配列→パネル非表示）はそのまま動く。

## 検証方法

1. **auto-sim**: engine.js変更のため自動フック実行
2. **手動確認ポイント**:
   - 同じカードを3回以上組んだ後、ファン期待カードにそのペアが出にくくなること
   - 5回以上組んだカードがファン期待に出ないこと
   - ファン期待カードが0件になっても画面が壊れないこと
3. **ログ確認**: auto-simの中でfanExpect生成カードとfreshness値を突き合わせ（必要ならデバッグログ追加）

## 完了条件

- `Engine.fanExpect.generate()` が `Engine.freshness.calc()` を参照し、深刻なマンネリ以上のカードを除外すること
- マンネリ度中のカードの優先度が下がること
- auto-sim 100シーズンで違反なし
- ファン希望カードにマンネリ度の高い組み合わせが出にくくなること
