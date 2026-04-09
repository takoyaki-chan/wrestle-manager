# dormantPool枯渇バグ — 修正状況と回復メカニズムの分析

## 問題の概要

長期プレイ（10+シーズン）でスカウト候補・FA市場が0名になるバグ。
ドラフト/スカウトで毎シーズン最大24名をdormantPoolから抽出するが、未獲得候補がプールに戻らず消滅していた。

## 修正済みの内容（コミット d37230c）

### 1. 流出の修正（根本原因）
- `scoutEventFinish`（app.js）: 未獲得候補の70%をdormantPool末尾に返却（以前は30%がFAに行くだけで残り70%が消滅していた）

### 2. 既存セーブの救済マイグレーション（app.js L2238-2266）
- セーブロード時に1回だけ実行（`_migrated_dormantPool_refill_v1`フラグ）
- dormantPoolのeligible（age < 21）が20未満なら、ALL_CHARS（全98名）から未占有キャラを一括補充
- 引退5シーズン経過キャラもリサイクル対象

### 3. 枯渇防止の閾値引き上げ（management.js）
- シーズン末のdormantPool補充判定: `MIN_ELIGIBLE` 6→20
- 補充量: +4→+8

### 4. ドラフト流札候補のプール返却（ui-common.js）
- ドラフトで流札した候補もdormantPoolに戻す

## 回復メカニズムの詳細

### セーブロード時マイグレーション（即時）
```
occupied = roster + aiOrgs全員 + freeAgents + pool既存 + retiredIds(5シーズン未満)
available = ALL_CHARS - occupied
→ availableを全員dormantPoolに追加（age: 17）
```

### 週次FAローテーション（4週ごと、management.js L6168-6208）
- FA市場から最大2名をpoolに戻し、poolから最大2名をFAに追加
- 条件: `week % 4 === 0 && !offSeason`

### 週次緊急補充（4週ごと、management.js L6211-6261）
- 条件: `freeAgents.length === 0 && eligibleInPool < 3`
- 発動時: FA直接3名 + pool5名を即座に追加
- 引退5シーズン経過キャラもリサイクル対象

### シーズン末dormantPool補充（management.js L9243-9278）
- 条件: `eligibleCount < MIN_ELIGIBLE(20)`
- ALL_CHARSから未占有キャラをpool補充、引退5シーズン経過もリサイクル

## 検証結果（実機テスト）

```
ALL_CHARS: 98名

=== シナリオ1: FA=0, Pool=0, retiredIds=0 ===
占有: 44/98（roster 5 + AI 39）
マイグレーション後: +54名がpoolに追加 → OK

=== シナリオ2: FA=0, Pool=0, retiredIds=25(retiredSeasonsなし) ===
占有: 69/98（roster + AI + retiredIds全部occupied扱い）
マイグレーション後: +29名がpoolに追加 → OK
```

## 懸念点・相談したいこと

### 1. retiredSeasons未記録の古い引退者について
ロード時の dormantPool 救済・週次緊急補充・シーズン末補充の各ロジックは、いずれも
`retiredSeasons[id] !== undefined` の場合だけ「5シーズン経過」を判定している。

ただし、現状コードにはこの穴を埋める別マイグレーションがすでにある:

```js
// app.js L2024-2032
if (!G._migrated_retiredSeasons_v1) {
  const rs = { ...(G.retiredSeasons || {}) };
  const pastSeason = Math.max(1, (G.season || 1) - 10);
  (G.retiredIds || []).forEach(id => {
    if (!rs[id]) rs[id] = pastSeason;
  });
  G = { ...G, retiredSeasons: rs, _migrated_retiredSeasons_v1: true };
}
```

つまり、「retiredSeasons がない古い引退者」はロード時に一括で過去シーズンへ補完され、
その後の recycle 判定では実質的に「5シーズン以上経過扱い」になる。

結論:
- 恒久対応としては、`undefined をその場で 5シーズン経過扱い` に変えるより、現行の `retiredSeasons` 補完マイグレーションで吸収する方が安全
- 理由は、`undefined = 古いデータ` と `undefined = 直近で記録漏れした壊れデータ` を区別せず即 recycle してしまうより、補完を一段挟む方が意図が明確だから
- ドキュメント上の懸念としては「永久ロックの恐れ」ではなく、「`_migrated_retiredSeasons_v1` が前提になっている」と書くのが正確

### 2. マイグレーション1回きりで足りるか
`_migrated_dormantPool_refill_v1` は1回きりだが、その後は以下の継続回復ループがある。

- `scoutEventFinish` で未獲得候補の 70% を dormantPool に返却
- 4週ごとの FA ローテーションで pool → FA / FA → pool を循環
- FA 0 かつ eligible pool < 3 のとき、4週ごとの緊急補充
- シーズン末に eligible pool < 20 のとき、追加補充
- FA と dormantPool は年次で 21歳超過時に若返りリサイクル

したがって、「流出バグ修正後も同じ理由で再枯渇する」可能性はかなり低い。
一方で、1回きりマイグレーション自体はあくまで初期回復であり、継続的な安全性は週次/年次補充ロジックに依存している。

結論:
- 設計としては 1回きりで問題ない
- ただし安全性の本体は `dormantPool_refill_v1` ではなく、`management.js` 側の定期補充ロジック
- 懸念を残すなら、「理論上再枯渇しないか」より「4週周期なので回復が最大3週遅延するケースはあるか」を見る方が実務的

### 3. FAが実際に並ぶまで最大4週かかるか
ここは現状ドキュメントが少し古い。
ロード時マイグレーションは pool 補充のみだが、週次ロジックにはすでに「FA への直接追加」が入っている。

```js
// management.js L6211-6258
if (curFA.length === 0 && eligibleInPool < 3) {
  ...
  s = {
    ...s,
    freeAgents: [...curFA, ...directFighters],
    dormantPool: [...curPool, ...newPoolEntries],
    ...
  };
}
```

つまり、FA が空で pool も薄い最悪ケースでは、次の4週更新タイミングで FA に直接 3名入る。

結論:
- 「最大4週待ち」はまだ概ね正しい
- ただし「FAにも直接入れるべきか」は、週次緊急補充で既に実装済み
- 残る論点は「ロード直後にも即FAを見せたいか」で、UX改善としてはあり得るが、必須の不具合修正ではない
- もし入れるなら、ロード時マイグレーションで常に FA を足すより、「ロード後に FA=0 のときだけ 2名補充」くらいに限定した方が副作用が少ない

## 現時点の推奨結論

1. `retiredSeasons undefined => 即5シーズン経過扱い` へは変えなくてよい  
   既存の `retiredSeasons` 補完マイグレーションで吸収できており、責務分離も明確。

2. `dormantPool_refill_v1` を再実行可能にする必要は薄い  
   再回復は週次/年次補充に任せる今の設計で自然。

3. 追加で検討するなら「ロード直後FAゼロの見た目対策」  
   不具合の本筋ではなく UX 改善。優先度は低め。

## 関連コード箇所

| ファイル | 行 | 内容 |
|---------|-----|------|
| src/app.js | L2238-2266 | ロード時マイグレーション |
| src/app.js | L2024-2032 | retiredSeasons 補完マイグレーション |
| src/app.js | L3189-3214 | scoutEventFinish（70%返却修正） |
| src/management.js | L6168-6261 | 週次FAローテーション + 緊急補充 |
| src/management.js | L9243-9278 | シーズン末dormantPool補充 |
