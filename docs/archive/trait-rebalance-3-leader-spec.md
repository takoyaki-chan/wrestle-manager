# 個性リバランス第3弾: リーダー気質

## 設計意図
「若手の成長UP」という教官的な効果を廃止し、「チームを安定させ、ベルトを持つと団体の顔になる」リーダーらしい効果に変更。

## 削除する効果

**engine.js 2371行目付近:**
```
削除: if ((char.age || 99) <= 19 && G.roster && G.roster.some(c => c.id !== char.id && Traits.has(c, 'リーダー気質') && !c.injury)) bonus *= 1.10;
```

## 追加する効果

### 効果1: 不満（grievance）の発生を抑える（-30%）
リーダー気質の選手が同団体にいる（怪我なし）場合、`calcGrievanceDelta` で算出されたマイナスdelta（不満）を30%軽減する。

**実装場所**: `Engine.trust.calcGrievanceDelta` の呼び出し元（engine.js 9077行目付近）が適切。
grievanceResultのdeltaが負の場合に、ロスターにリーダー気質持ち（怪我なし・本人以外）がいれば `delta *= 0.7` で軽減。

```javascript
// リーダー気質: grievance軽減（-30%）
const grievanceResult = Engine.trust.calcGrievanceDelta(updated, rosterContext, titles, state);
let grievanceDelta = grievanceResult.delta;
if (grievanceDelta < 0 && (state.roster || []).some(c => c.id !== updated.id && Traits.has(c, 'リーダー気質') && !c.injury)) {
  grievanceDelta *= 0.7;
}
delta += grievanceDelta;
```

**注意**: リーダー気質を持つ本人のgrievanceも軽減対象。ただし「自分以外にリーダー気質がいるか」で判定するので、リーダー自身1人しかいない場合は本人のgrievanceは軽減されない。これは意図通り（リーダーが1人で不満を抱えるのは自然）。

### 効果2: チャンピオン時に団体人気ボーナス（毎週+1）
リーダー気質持ちがタイトル保持中の場合、週次処理で団体人気（orgPop）に+1。

**実装場所**: 週次の `processWeek` 内、orgPop更新処理付近に追加。
```javascript
// リーダー気質: チャンピオン時orgPop+1/週
const champId = state.champion?.id || state.titles?.[0]?.holderId; // タイトル保持者ID取得（実装に合わせて調整）
if (champId && (state.roster || []).some(c => c.id === champId && Traits.has(c, 'リーダー気質') && !c.injury)) {
  // orgPop +1（上限クランプは既存処理に任せる）
}
```

**注意**: どのタイトルでもよい。複数タイトル保持でも+1（重複しない）。

## TRAIT_DEFS説明文の更新（data.js 229行目付近）
```
現行: 'リーダー気質': {cat:'org', icon:'将', color:'#f1c40f', en:'Leadership', desc:'若手の成長率にボーナス'},
変更: 'リーダー気質': {cat:'org', icon:'将', color:'#f1c40f', en:'Leadership', desc:'チームの不満を抑え、チャンピオン時は団体の顔として人気UP'},
```

## 変更しない
- 11296行: personality推定の'earnest'判定 — 残す（UIフレーバー）

## 検証
- auto-sim 10seeds × 10seasons で ALL CLEAR
- リーダー気質持ちがいる団体で grievance delta が30%軽減されていることをログで確認
- リーダー気質持ちがチャンピオン時にorgPopが微増していることを確認
