# 契約OVR制（シーズン固定給）仕様書 v1.0

## 概要

現行の給与計算は `getSalary(c, titles)` で毎週リアルタイムに現在の OVR / popularity から算出される。選手を育成するとOVRが上がり、**プレイヤーの意思に関係なく給与が自動上昇する**。これにより中堅帯（orgPop 20-40）で支出が急膨張し、資金繰りが極めて厳しくなる。

### 設計方針

シーズン開始時（契約更新完了時）に給与計算の基準となる OVR / popularity を**固定**する。シーズン中はどれだけ育成しても給与が変わらない。次のシーズン更新時に再計算されて新しい給与が確定する。

- **プレイヤー体験**: 育成のリターンを1シーズン楽しんでから、次のコストを考える健全なサイクル
- **経営計画**: シーズン開始時に年間の人件費が確定し、計画的な経営判断が可能
- **世界観**: 「年俸契約」という現実のプロスポーツと同じ仕組みで直感的

---

## §1 データ構造

### §1.1 選手オブジェクトへの追加フィールド

```javascript
fighter.contractOVR  // number | undefined — 契約時のOVR（給与計算に使用）
fighter.contractPop  // number | undefined — 契約時のpopularity（給与計算に使用）
```

- いずれも `undefined` の場合は現在値にフォールバック（既存セーブデータ互換）
- レンタル選手（`isRental: true`）は給与計算対象外のため設定不要

### §1.2 セーブデータ互換

`contractOVR` / `contractPop` が存在しない選手 → 現行どおり `Engine.util.ov(c)` / `c.popularity` を使用。次のオフシーズン契約更新（OffWeek 4）で自動的にフィールドが設定される。

---

## §2 給与計算の変更

### §2.1 `Engine.util.getSalary` の修正

```javascript
// engine.js L136-144
getSalary(c, titles) {
  // 契約OVRがあればそれを使用、なければ現在値（互換フォールバック）
  const ovr = c.contractOVR != null ? c.contractOVR : Engine.util.ov(c);
  const pop = c.contractPop != null ? c.contractPop : (c.popularity || 0);

  const base = SALARY_PARAMS.baseA * Math.exp(SALARY_PARAMS.baseB * ovr);
  const popBonus = SALARY_PARAMS.popMax * Math.pow(pop / 100, SALARY_PARAMS.popExp);
  const isChamp = titles && titles.world && titles.world.championId === c.id;
  const titleBonus = isChamp ? SALARY_PARAMS.titleBonus : 0;
  const contractBonus = c.salaryBonus || 0;
  return Math.round(base + popBonus + titleBonus + contractBonus);
},
```

**変更点**: OVR と popularity の取得元のみ。計算式自体は不変。

**注意**: `titleBonus` はリアルタイム判定を維持する（タイトル獲得/喪失は即座に給与に反映）。これはチャンピオンへの報奨金的な位置づけで、基本給とは性質が異なるため。

### §2.2 影響範囲

`getSalary` を呼んでいる全箇所は自動的に契約OVR制に移行する:

| 呼び出し箇所 | 用途 | 影響 |
|---|---|---|
| `calcWeeklySalary` (L544) | 週次給与計算 | ✅ シーズン固定に |
| スナップショット G1: 給与不公平 (L8725) | 同僚との給与比較 | ✅ 契約給ベースの比較に |
| スナップショット G2: 後輩高給 (L8905) | 年齢×給与チェック | ✅ 同上 |
| S4 待遇改善コスト (L9705, L9817) | 週給×12の引き留めコスト | ✅ 契約給ベースに |
| E6 引き留めコスト (L9734, L9906) | 同上 | ✅ 同上 |
| 契約更新: calcRaiseAmount (L11162) | 昇給額算出 | ✅ 契約給ベースに |
| 契約更新: calcRetentionBonus (L11176) | 引き留めボーナス | ✅ 同上 |

---

## §3 contractOVR / contractPop の設定タイミング

### §3.1 ゲーム開始（初期ドラフト完了時）

**場所**: `Engine.draft.completeDraft` (L7748)

ドラフトで選んだ全選手に `contractOVR` / `contractPop` を設定する。

```javascript
// completeDraft 内、roster に追加する各選手に対して:
fighter.contractOVR = Engine.util.ov(fighter);
fighter.contractPop = fighter.popularity || 0;
```

### §3.2 オフシーズン契約更新完了時（年次更新）

**場所**: OffWeek 4 の処理完了後（L7403 付近、「📅 オフシーズン第4週: 契約更新完了」の直前）

契約交渉がすべて解決した後、**ロスター全選手**の contractOVR / contractPop を現在値で更新する。

```javascript
// OffWeek 4: 契約更新完了時
s = {
  ...s,
  roster: s.roster.map(f => f.isRental ? f : {
    ...f,
    contractOVR: Engine.util.ov(f),
    contractPop: f.popularity || 0,
  }),
};
events.push('📅 オフシーズン第4週: 契約更新完了');
```

**ポイント**: 契約交渉で `salaryBonus` が加算された選手も、`contractOVR` は現在のOVRで統一的に設定される。`salaryBonus` は別途上乗せされる構造なので干渉しない。

### §3.3 シーズン中の新規加入

シーズン途中で入団した選手は、加入時点のOVR/popで契約OVRを設定する。

**スカウト引き抜き** (L5630付近):
```javascript
newFighter.contractOVR = Engine.util.ov(newFighter);
newFighter.contractPop = newFighter.popularity || 0;
```

**交渉引き抜き** (L5844付近):
```javascript
resetFighter.contractOVR = Engine.util.ov(resetFighter);
resetFighter.contractPop = resetFighter.popularity || 0;
```

**レンタル** (L5963): 設定不要（`isRental` フィルターで給与計算対象外）。

### §3.4 設定箇所一覧

| タイミング | 場所 | 対象 |
|---|---|---|
| 初期ドラフト完了 | `completeDraft` (L7748) | ドラフト選手全員 |
| オフシーズン OffWeek 4 | 契約更新完了時 (L7403) | ロスター全選手（レンタル除く） |
| スカウト引き抜き | `executePoach` (L5630) | 加入選手 |
| 交渉引き抜き | `resolveNegotiation` (L5844) | 加入選手 |

---

## §4 UI表示

### §4.1 給与表示

現行の給与表示はすべて `getSalary` 経由なので、自動的に契約給が表示される。追加のUI変更は不要。

### §4.2 選手詳細パネル（任意・将来拡張）

選手の詳細情報に「契約給」と「実力給（もし今契約し直したらいくらか）」の差を表示すると、プレイヤーが次シーズンの人件費を予測しやすくなる。ただし初期実装では不要。

### §4.3 オフシーズン契約更新時の表示

契約更新完了時に「📋 来シーズンの給与体系が更新されました」のようなログを追加し、給与が変わったことをプレイヤーに認知させる。

---

## §5 salaryBonus との関係

`salaryBonus` は現行どおり `getSalary` の計算内で `contractBonus` として加算される。契約OVR制とは独立に機能する。

```
最終給与 = base(contractOVR) + popBonus(contractPop) + titleBonus + salaryBonus
```

- 契約交渉で昇給受諾 → `salaryBonus` に加算（現行どおり）
- S4 待遇改善 → `salaryBonus` に加算（現行どおり）
- シーズン末の20%減衰 → 現行どおり

---

## §6 AI選手への適用

AI団体の選手（`aiOrgs[orgId].roster`）にも同じ仕組みを適用するか？

**結論: 適用しない（現行維持）。**

理由:
- AI選手の給与はランキング計算にのみ影響し、プレイヤーの体験に直接関わらない
- AI選手にcontractOVR/contractPopを設定すると全AI団体のロスター管理が複雑化する
- プレイヤーの資金繰り問題の解決が目的なので、プレイヤーロスターのみで十分

---

## §7 実装手順

### Phase 1: コア変更
1. `Engine.util.getSalary` の修正（§2.1）
2. `Engine.draft.completeDraft` での初期設定（§3.1）
3. OffWeek 4 での年次更新（§3.2）
4. 新規加入時の設定（§3.3 — 2箇所）

### Phase 2: 検証
5. auto-sim テスト: 500シーズン走行し、週次給与が各シーズン内で一定であることを確認
   - 検証項目: `calcWeeklySalary` の戻り値がシーズン内の Week 1 と Week 48 で同一（タイトル変動分を除く）
6. 既存セーブデータロード: `contractOVR` が undefined の状態でゲームが正常動作することを確認
7. 手動プレイ: pop 20-40 帯で資金繰りが改善されていることを体感確認

### Phase 3: 表示改善（任意）
8. オフシーズン契約更新時に「来シーズンの給与体系更新」ログ追加
9. 将来: 選手詳細に「契約給 vs 実力給」の差を表示

---

## §8 数値影響の見積もり

OVR 45 → 55 に育成した場合（pop 10, salaryBonus 0）:

| | 現行 | 契約OVR制 |
|---|---|---|
| シーズン開始時 | 10万/週 | 10万/週 |
| シーズン途中（OVR 50時点） | 13万/週 | **10万/週** |
| シーズン末（OVR 55時点） | 17万/週 | **10万/週** |
| 翌シーズン開始 | 17万/週 | 17万/週 |

6人ロスターで全員同程度に成長した場合、**シーズン中の給与節約は週20〜40万**程度。2週サイクルで40〜80万の改善となり、pop 25-40 帯の資金繰りが大幅に緩和される。

---

## §9 決定済み事項

1. **popularity も契約時固定** — OVRと同様に contractPop で固定。シンプルで一貫性がある
2. **更新タイミングは OffWeek 4** — 契約更新＝新しい給与条件確定のタイミング
3. **AI選手は対象外** — プレイヤーロスターのみ
4. **会場収益の調整は不要** — 契約OVR制で十分な改善が見込まれる
