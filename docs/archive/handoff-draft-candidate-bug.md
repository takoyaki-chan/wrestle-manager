# 引き継ぎ: ドラフト候補不足バグ調査

## 症状
- ドラフトで新キャラが出てこない
- ドラフト候補が少ない

## 最重要仮説（未検証）: 98→128名拡張時のID周辺の不整合

もともと98名だったALL_CHARSが127名(ID 1-9, 11-128)に拡張された。
この拡張時にID系・数え方系で狂いが生じ、全選手が正しく循環しなくなっている可能性。

### 発見済みの証拠

#### 1. CHAR_GROUP が新キャラをカバーしていない
`data.js:340-378` の CHAR_GROUP は **98ID分しか定義がない**。
ID 100-128 (29名) は `CHAR_GROUP` に未登録。

```
CHAR_GROUP coverage: 98 / 127
Missing: 100,101,102,103,104,105,106,107,108,109,110,...,128
```

CHAR_GROUP は `initRandomRoster` の `weightedPick` でシリーズボーナス計算に使われる。
未登録IDは `group: 'other'` としてフォールバックされるが、重み付けへの影響は未検証。

#### 2. org_s, org_a のスロット数がROSTER_CFGを大幅超過
```
ROSTER_CFG: org_s=16, org_a=13, org_b=10, fa=12 (計51)
実際の配分: org_s=28, org_a=24, org_b=10, fa=12 (計74)
```

127名に対してROSTER_CFG合計は51スロットのまま。残り76名がdormant(20)+retired(56)に行くべきだが、
**実際はorg_sに28名、org_aに24名が入っている**。

原因推定: `initRandomRoster` で `superElites` + `guaranteedElites` が ROSTER_CFG.org_s (16) を超過している。
127名で potTotal >= 850 (superEliteThreshold) のキャラが増え、`sMembers` が16を超えるが、
`cfg.org_s - sMembers.length` が負になってもsMembers全員がorg_sに入る（上限チェックがない）。

**management.js:3175-3182**:
```javascript
const sMembers = [...superElites, ...guaranteedElites]; // これが16を超える可能性
const sRemaining = cfg.org_s - sMembers.length;         // 負になる
// weightedPickは count<=0 なら何も追加しない
const sPicked = weightedPick(pool, sMembers, sRemaining, 99, 3.0, 720);
const sAll = [...sMembers.map(c => c.id), ...sPicked.map(c => c.id)]; // sMembers全員が入る
```

結果: org_s/org_a が膨張 → dormant/retiredに回る人数が減少 → ドラフト候補枯渇

#### 3. dormant初期プールが実質的に小さくなっている
配分: orgs/FA=74名, dormant=20名, retired=56名 → 合計150??? 
→ 実際は127名で重複なし。org配分が膨張した分、dormant+retiredに回る人数が減少。

### 調査で確認済みだが「根本原因ではない」と判断された事項

以下は補充・生成系の対症療法であり、根本原因（ID/数え方の狂い）とは別の問題:

1. **ミッドシーズンスカウト(W29)がS2以降0人**: dormantPool age 17-18 がオフシーズンで全消費済み
2. **generateCandidate が死んだコード**: management.js:8020 — 新規キャラ生成が一度も呼ばれない
3. **dormantPool枯渇**: S7で0に接近。引退復帰は年8名/5年CD
4. **FA膨張**: S10で40名超。ドラフト候補にならない

### 次セッションでやるべきこと

#### 最優先: ROSTER_CFG vs 実配分の不整合修正
1. `initRandomRoster` で org_s/org_a に上限キャップを追加
2. または ROSTER_CFG を127名に合わせて再調整
3. 超過分をdormant/retiredに回すことで候補プールを確保

#### 要検証: CHAR_GROUP の拡張
1. ID 100-128 を適切なグループに割り当て
2. 重み付けへの影響を確認

#### 要検証: ドラフトフロー全体
1. org配分修正後に `node test/diag-draft.js 20 42` で候補数を再計測
2. 修正前後でdormant/retired/FAの推移を比較

## 診断スクリプト

`test/diag-draft.js` — dormantPool/FA/候補数の推移を追跡（このセッションで作成済み）
```bash
node test/diag-draft.js 20 42     # 20シーズン、シード42
```

`test/diag-fa.js` — FA分析（既存）

## 関連コード箇所

| ファイル | 行 | 内容 |
|---------|-----|------|
| data.js | 324-336 | ROSTER_CFG（スロット定数） |
| data.js | 340-378 | CHAR_GROUP（98IDのみ定義） |
| data.js | 397-480 | generateDraftConfig（初期ドラフト生成） |
| data.js | 3473-3477 | SCOUT_EVENT_CFG |
| management.js | 3100-3236 | initRandomRoster（全キャラ配分） |
| management.js | 8020-8123 | generateCandidate（死んだコード） |
| management.js | 8126-8207 | generateScoutReport（ドラフト候補生成） |
| management.js | 9285-9371 | シーズン末dormant処理（加齢/復帰） |
| management.js | 9453-9490 | offWeek 3 ドラフト |
| management.js | 9752-9781 | ミッドシーズンスカウト(W29) |

## 変更状態
- `src/management.js` — 修正は全て `git checkout` で巻き戻し済み。未変更状態。
- `test/diag-draft.js` — 新規作成（診断スクリプト）。コミット不要。
