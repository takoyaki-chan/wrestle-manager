# ゲームサイクル変更 Phase 2：影響範囲の洗い出し

> 作成: 2026-03-07
> 前提: Phase 1 確定版（全要素+1年シフト、17歳最速デビュー）
> 目的: Phase 1の変更が波及する全システムを列挙し、影響度で分類する

---

## 分類基準

- **必須調整**: Phase 1の変更と直接矛盾する。変更しないとバグや体験破綻が起きる
- **調整推奨**: 変更しなくても動くが、体験が不自然になるか、バランスが崩れる
- **様子見**: Phase 1だけで自然に調整されるか、影響が軽微。テスト後に判断

---

## A. 必須調整（変更しないと壊れる）

### A-1. ageMultiplier テーブル書き換え

**ファイル**: `data.js` L1252-1281
**現行**: 17→0.80 / 18-19→1.10 / 20-22→1.30 / 23-25→1.00 / 26-28→0.60 / 29-30→0.15 / 31-32→0.05 / 33+→0
**新**: ≤17→0.70 / 18→1.00 / 19-20→1.30 / 21-22→1.00 / 23-24→0.50 / 25-26→0.10 / 27+→0

### A-2. 特性補正（早熟/晩成/遅咲き）書き換え

**ファイル**: `data.js` L1263-1279（ageMultiplier関数内）
**現行**: 早熟≤21/≥26、晩成≤21/26-32、遅咲き≤25/26-34
**新**: 早熟≤18/≥23、晩成≤18/21-27、遅咲き≤20/21-29

### A-3. Wear蓄積開始年齢

**ファイル**: `engine.js` L2092（プレイヤー）、L2774（AI）
**現行**: `decayStartAge = 28 + durability`
**新**: `decayStartAge = 23 + durability`

### A-4. 初期年齢分布 — 全箇所

| 箇所 | ファイル:行 | 現行 | 新 |
|------|-----------|------|---|
| ドラフト年齢生成 | `data.js` L359 | `16 + rng(0,3)` | `17 + rng(0,2)` |
| FA初期 | `engine.js` L6392 | `16 + rng(0,5)` | `17 + rng(0,3)` |
| AI団体初期 | `engine.js` L2417 | `15 + rng(0,18)` | `17 + rng(0,11)` |
| AI補充（新人） | `engine.js` L2974 | `16 + rng(0,4)` | `17 + rng(0,2)` |
| AI補充（別箇所） | `engine.js` L4996 | `16 + rng(0,4)` | `17 + rng(0,2)` |
| FA再出現（新規） | `engine.js` L3672 | `18 + rng(0,6)` | `17 + rng(0,4)` |
| 緊急補充 | `engine.js` L3710, L3713 | `18 + rng(0,2)` | `17 + rng(0,2)` |

### A-5. スカウト候補の年齢分布

**ファイル**: `engine.js` L4868-4873（generateCandidate）
**現行**:
```
40%: 15-16 / 25%: 17 / 20%: 18-19 / 15%: 20-22
```
**新**:
```
40%: 16-17 / 25%: 18 / 20%: 19 / 15%: 20
```

### A-6. スカウト候補のstartRatio（入団時ステ比率）

**ファイル**: `engine.js` L4908-4911（generateCandidate）
**現行**: ≤17→0.55 / ≤20→0.65 / else→0.75
**新**: ≤18→0.55 / ≤20→0.65 / else→0.75
（+1年シフト。18歳以下は原石、19-20は即戦力寄り）

### A-7. generateStartValues の年齢区分

**ファイル**: `engine.js` L2222-2226
**現行**: ≤17→0.55 / ≤20→0.65 / ≤24→0.75 / ≤29→0.85 / 30+→0.90
**新**: ≤18→0.55 / ≤20→0.65 / ≤24→0.75 / ≤27→0.85 / 28+→0.90

### A-8. デフォルト年齢・キャリア開始年齢（fallback値）

以下の `|| 16` や `|| 20` を `|| 17` に統一:

| 箇所 | ファイル:行 | 現行 | 新 |
|------|-----------|------|---|
| makeChar entryAge | `engine.js` L6208 | `opts.age \|\| 16` | `opts.age \|\| 17` |
| ドラフトfallback(4箇所) | `engine.js` L6279,6296,6322,6382 | `\|\| 16` | `\|\| 17` |
| applySeasonEnd fallback | `engine.js` L2088 | `c.age \|\| 16` | `c.age \|\| 17` |
| AI aging fallback | `engine.js` L2772 | `f.age \|\| 20` | `f.age \|\| 17` |
| growthCalc fallback | `engine.js` L2029 | `16 + careerSeasons` | `17 + careerSeasons` |
| aiSeasonGrowth fallback | `engine.js` L2837 | `f.age \|\| 20` | `f.age \|\| 17` |
| makeAIFighter fallback | `engine.js` L2258 | `16 + rng(0,12)` | `17 + rng(0,11)` |

### A-9. careerSeasons計算（age-16 → age-17）

| 箇所 | ファイル:行 | 現行 | 新 |
|------|-----------|------|---|
| generateBackstory | `engine.js` L1184 | `age - 16` | `age - 17` |
| makeAIFighter | `engine.js` L2259 | `(age \|\| 20) - 16` | `(age \|\| 17) - 17` |

### A-10. makeAIFighter の maturity計算

**ファイル**: `engine.js` L2240
**現行**: `0.70 + (age - 16) * 0.04`
**新**: `0.70 + (age - 17) * 0.04`
（17歳=0.70、28歳=1.14→cap1.0。年齢幅に合わせてスケール維持）

### A-11. FA pool除外年齢

**ファイル**: `engine.js` L3659
**現行**: `age >= 22` で除外
**新**: `age >= 21` で除外

---

## B. 調整推奨（動くが体験が不自然になる）

### B-1. シーズン末再査定（reassess）の年齢トリガー

**ファイル**: `engine.js` L2127-2134
**現行**: age===30 で'age30'再査定、age 35-36 で'age35plus'再査定
**新**: age===25 で'age25'再査定、age 28-29 で'age28plus'再査定

`reassess()` の case 名も変更:
- `'age30'` → `'age25'`（assessedValue × 0.8）
- `'age35plus'` → `'age28plus'`（assessedValue × 0.6）

### B-2. 引退勧告 canAdvise の条件

**ファイル**: `engine.js` L1631-1636
**現行**: wear≥20 OR careerSeasons≥8 OR age≥30
**新**: wear≥20 OR careerSeasons≥6 OR age≥25

### B-3. ブレークスルー年齢ボーナス

**ファイル**: `engine.js` L7018（calcBreakthroughProb）
**現行**: `age <= 25` で +0.3%
**新**: `age <= 22` で +0.3%

### B-4. 引退セリフの年齢分岐

**ファイル**: `engine.js` L1604-1608（selectLine）
**現行**: age≤25→B1_young / age≤30→B2_prime / else→B3_older
**新**: age≤22→B1_young / age≤26→B2_prime / else→B3_older

### B-5. 引退セリフの在籍期間分岐

**ファイル**: `engine.js` L1617
**現行**: `careerSeasons >= 10` → A4_veteran
**新**: `careerSeasons >= 7` → A4_veteran（短いキャリアでもベテラン扱い）

### B-6. ageMarketMultiplier（市場価値の年齢係数）

**ファイル**: `engine.js` L4752-4768
**現行**: ≤21→若手プレミアム / ≤25→1.0 / ≤27→0.95 / ≤29→0.85 / 30+→1.0(reassess側)
**新**: ≤19→若手プレミアム / ≤22→1.0 / ≤24→0.95 / ≤26→0.85 / 27+→1.0(reassess側)

### B-7. generateBackstory のpeakAge

**ファイル**: `engine.js` L1194
**現行**: `peakAge = 26 + rng(0,4)` → 26-30歳
**新**: `peakAge = 21 + rng(0,3)` → 21-24歳

### B-8. generateBackstory のyoungSeasons

**ファイル**: `engine.js` L1229
**現行**: `youngSeasons = min(careerSeasons, 25 - 16)` → max 9
**新**: `youngSeasons = min(careerSeasons, 22 - 17)` → max 5

### B-9. generateBackstory のcareerSeasons閾値

**ファイル**: `engine.js` L1310, L1319
**現行**: careerSeasons≥5で移籍歴生成(15%) / careerSeasons≥10で2回目(5%)
**新**: careerSeasons≥4で移籍歴生成(15%) / careerSeasons≥7で2回目(5%)

### B-10. generateBackstory の信頼度ボーナス

**ファイル**: `engine.js` L1342
**現行**: `careerSeasons >= 8` → baseTrust +0〜5
**新**: `careerSeasons >= 6` → baseTrust +0〜5

### B-11. 引退勧告セリフのcareerSeasons分岐

**ファイル**: `engine.js` L1617（selectAdviseLine付近）
**現行**: `careerSeasons >= 10` → ベテラン扱い
**新**: `careerSeasons >= 7` → ベテラン扱い

### B-12. AI団体初期Wearの付与（新規追加）

**現行**: makeAIFighter では全員 `wear: 0` で生成
**新**: Wear蓄積開始年齢（23+durability）を超えている選手には初期wearを付与

```
if (age >= 23 + durability) {
  const yearsOfWear = age - (23 + durability);
  wear = yearsOfWear * (8 + rng(-3,3));  // 年8前後の蓄積
}
```

→ これがないと28歳のAIベテランがwear=0の全盛期状態になり、設計意図と矛盾する

### B-13. DECAY_TABLE（data.js L1285-1301）の整理

**現行**: 年齢ベースのdecay定義（30-32:early / 33-34:mid / 35+:late）が残存
**対応**: 実際にはapplyDecayで使われていないが、混乱防止のためコメントアウトまたは削除推奨

---

## C. 様子見（テスト後に判断）

### C-1. GROWTH_SEASON_BASE（8.0）

到達OVRが十分かどうかはプレイテストで判断。短いキャリアで育成不足を感じる場合は9.0〜10.0に引き上げを検討。

### C-2. Wear増加量（baseWear 7-13）

蓄積開始が早まった分、同じ速度だと引退が早すぎる可能性。逆に「ちょうどいい」可能性もある。テスト後判断。

### C-3. ライバリー閾値（因縁2回/宿敵4回/宿命7回）

キャリアが短くなると年24興行で7回対戦は可能だが、同じ相手との対戦頻度が上がるか。matchup freshness との兼ね合いもある。

### C-4. ロスター拡張マイルストーン到達タイミング

orgPopの上昇速度が変わらなければ影響なし。選手の入れ替え頻度が上がることで間接的に影響する可能性。

### C-5. 経済バランス（育成投資の回収期間）

選手のピーク期間が短い＝回収期間が短い。スカウト費用やFA獲得費用が相対的に高く感じられる可能性。

### C-6. PPV GRAND FINALのバランス

AI選手の平均OVRが現行より低くなる可能性（短いキャリアで完成度が下がる）。PPVの対戦品質に影響するか。

### C-7. クリア到達速度

世代交代により「一時的な戦力ダウン」が発生し、クリアまでのシーズン数が自然に伸びる可能性が高い。ただし確証はないのでテスト後判断。

### C-8. 契約更新（trust-based）

trustベースなので年齢変更の直接影響なし。ただし選手回転が速くなると、trustを積む前に衰退する選手が増える → 低trustでの離脱リスクが上がる可能性。

### C-9. 新人王判定（careerSeasons===1）

careerSeasons の定義が変わらない（+1/シーズン）ので影響なし。

---

## 変更箇所サマリー

### 必須調整: 11項目

| # | 対象 | ファイル | 変更内容 |
|---|------|---------|---------|
| A-1 | ageMultiplier テーブル | data.js | 全面書き換え |
| A-2 | 特性補正 | data.js | 年齢閾値シフト |
| A-3 | decayStartAge | engine.js ×2 | 28→23 |
| A-4 | 初期年齢分布 | data.js ×1, engine.js ×6 | 全7箇所 |
| A-5 | スカウト年齢分布 | engine.js | 分布テーブル書き換え |
| A-6 | スカウトstartRatio | engine.js | 閾値シフト |
| A-7 | generateStartValues | engine.js | 年齢区分シフト |
| A-8 | デフォルト年齢fallback | engine.js ×10+ | 16→17統一 |
| A-9 | careerSeasons計算 | engine.js ×2 | age-16→age-17 |
| A-10 | maturity計算 | engine.js | age-16→age-17 |
| A-11 | FA pool除外年齢 | engine.js | 22→21 |

### 調整推奨: 13項目

| # | 対象 | 変更内容 |
|---|------|---------|
| B-1 | reassess年齢トリガー | 30/35-36 → 25/28-29 |
| B-2 | canAdvise条件 | age≥30→25, career≥8→6 |
| B-3 | ブレークスルー年齢bonus | ≤25 → ≤22 |
| B-4 | 引退セリフ年齢分岐 | ≤25/≤30 → ≤22/≤26 |
| B-5 | 引退セリフcareer分岐 | ≥10 → ≥7 |
| B-6 | ageMarketMultiplier | 全閾値シフト |
| B-7 | backstory peakAge | 26-30 → 21-24 |
| B-8 | backstory youngSeasons | max9 → max5 |
| B-9 | backstory career閾値 | ≥5/≥10 → ≥4/≥7 |
| B-10 | backstory trust bonus | ≥8 → ≥6 |
| B-11 | 勧告セリフcareer分岐 | ≥10 → ≥7 |
| B-12 | AI初期Wear付与 | 新規追加（23歳超のAIにwear設定）|
| B-13 | DECAY_TABLE整理 | 未使用テーブルの削除/コメントアウト |

### 様子見: 9項目（テスト後に判断）
