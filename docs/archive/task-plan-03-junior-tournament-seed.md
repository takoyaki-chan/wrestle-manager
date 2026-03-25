# TASK-01: ジュニアトーナメントのシード配置改善 — 計画書

## 概要

U-20ジュニアトーナメント（Week 25開催）の組み合わせ抽選で、OVR上位選手が同じブロック（トーナメント半山）に偏り序盤で潰し合う問題を修正。シード方式を導入して上位選手を分散配置する。

## 現状の問題

### 現行の組み合わせロジック

`Engine.juniorTournament.select()` (engine.js L16061-16091):
```js
candidates.sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
const bracketSize = total >= 8 ? 8 : 4;
return { participants: candidates.slice(0, bracketSize), bracketSize, cancelled: false };
```

OVR降順ソートの上位8名（or 4名）をそのまま返す。

`Engine.juniorTournament.run()` (engine.js L16095-16170):
```js
let currentBracket = participants.map(p => ({ ...p, condition: 80 }));
for (let i = 0; i < currentBracket.length; i += 2) {
  const left = currentBracket[i];
  const right = currentBracket[i + 1];
  // ...試合実行
}
```

`participants` 配列の順番がそのままトーナメントの配置になる。OVR降順で並んでいるため:
- 8人制: [1位 vs 2位, 3位 vs 4位, 5位 vs 6位, 7位 vs 8位]
- → 1位と2位が1回戦で激突、3位と4位も1回戦で激突

これは最悪の配置。上位同士が全て初戦で潰し合い、決勝に残りやすいのは5-8位の選手になる。

### 期待されるシード方式

テニスやバスケのトーナメントと同様に:
- 8人制: 1位は上半山の端、2位は下半山の端。3位と4位は逆の半山に分散
- 4人制: 1位 vs 4位、2位 vs 3位（または1位 vs ランダム、2位 vs ランダム）

## 変更方針

### Engine.juniorTournament のシード配置導入

#### 変更箇所1: `Engine.juniorTournament.select()` (engine.js L16061-16091)

selectの返り値にシード情報を付与:
```js
select(state) {
  // ...既存のcandidate収集...
  candidates.sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const bracketSize = total >= 8 ? 8 : 4;
  const selected = candidates.slice(0, bracketSize);
  // シード配置を適用
  const seeded = Engine.juniorTournament._seedBracket(selected, state);
  return { participants: seeded, bracketSize, cancelled: false };
},
```

#### 変更箇所2: 新規関数 `_seedBracket()` 追加

```js
_seedBracket(sorted, state) {
  // sorted: OVR降順。sorted[0]=1位シード, sorted[1]=2位シード, ...
  const n = sorted.length;
  const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, 0xSEED));

  if (n === 8) {
    // 標準テニス方式シード:
    // スロット配置: [1, 8, 4, 5, 3, 6, 2, 7]
    // → 1位(idx0)はスロット0、2位(idx1)はスロット6、3位(idx2)はスロット4、4位(idx3)はスロット2
    // → 5-8位は残りスロットにランダム配置
    const bracket = new Array(8).fill(null);
    bracket[0] = sorted[0]; // 1シード: 上半山の端
    bracket[7] = sorted[1]; // 2シード: 下半山の端
    bracket[4] = sorted[2]; // 3シード: 下半山の端寄り（2シードと同じ半山にならない）
    bracket[3] = sorted[3]; // 4シード: 上半山の端寄り（1シードと同じ半山にならない）
    // 残り4名をランダムに空きスロットに配置
    const remaining = sorted.slice(4);
    const emptySlots = [1, 2, 5, 6];
    // シャッフル
    for (let i = emptySlots.length - 1; i > 0; i--) {
      const j = Engine.rng.int(rng, 0, i);
      [emptySlots[i], emptySlots[j]] = [emptySlots[j], emptySlots[i]];
    }
    remaining.forEach((p, i) => { bracket[emptySlots[i]] = p; });
    return bracket;
  }

  if (n === 4) {
    // 4人制: 1位 vs 非シード, 2位 vs 非シード
    const bracket = new Array(4).fill(null);
    bracket[0] = sorted[0]; // 1シード
    bracket[3] = sorted[1]; // 2シード（反対の半山の端）
    const remaining = [sorted[2], sorted[3]];
    // ランダムに残り2スロットに配置
    if (Engine.rng.float(rng) < 0.5) {
      bracket[1] = remaining[0]; bracket[2] = remaining[1];
    } else {
      bracket[1] = remaining[1]; bracket[2] = remaining[0];
    }
    return bracket;
  }

  return sorted; // フォールバック
},
```

#### シード配置の根拠

**8人制のスロット配置 `[1位, ?, ?, 4位, 3位, ?, ?, 2位]`:**

| スロット | 1回戦の対戦 | 準決勝の対戦 |
|---------|-----------|-----------|
| 0 vs 1 | 1位 vs ランダム | 勝者 vs |
| 2 vs 3 | ランダム vs 4位 | ← この2試合の勝者 |
| 4 vs 5 | 3位 vs ランダム | 勝者 vs |
| 6 vs 7 | ランダム vs 2位 | ← この2試合の勝者 |

- 1位と2位は決勝まで当たらない
- 3位と4位も決勝まで当たらない
- 1位と4位は準決勝で当たりうる（標準的なシード方式）

**数値パラメータ根拠:**
- 基準スケール: シード数4名は参加者8名の50%。テニスの32ドローで8シードに相当する比率
- 相対比較: 4名固定シードはプロレスのトーナメントでも自然（番付上位が別ブロック）
- プレイヤー体験: 「実力者同士の決勝が見たい」という期待に応える。初戦で消えると物足りない

## 影響範囲

- **engine.js**: `Engine.juniorTournament.select()` (L16061-16091) と新規 `_seedBracket()` 関数
- **engine.js**: `Engine.juniorTournament.run()` (L16095-16170) は変更不要（participants配列の順番で試合するため、配列の並びを変えるだけで動く）
- 新聞記事・HOF記録等は結果ベースなので影響なし

## 検証方法

1. **auto-sim**: engine.js変更のため自動フック実行
2. **手動確認**:
   - Week 25のジュニアトーナメントで、OVR上位4名が別ブロックに分かれていること
   - 1位と2位が決勝以外で当たらないこと
   - 5-8位の配置がランダムであること（複数回実行して異なる配置になる）
3. **大規模テスト**: 100シード×100シーズンで違反なし確認

## 完了条件

- OVR上位4名が各ブロックに分散配置されること
- 1位と2位が決勝まで対戦しないトーナメント構造になること
- ランダム性が残ること（5-8位の配置が毎回異なる）
- auto-sim 100シーズンで違反なし
