# ゲームサイクル変更 Phase 4：実装仕様書（全数値確定版）

> 作成: 2026-03-07
> ステータス: 設計完了・実装待ち
> 実装方法: Claude Code で段階的に適用

---

## 実装チェックリスト

### ═══ A群：必須調整（14箇所）═══

---

#### A-1. ageMultiplier テーブル書き換え
- **ファイル**: `src/data.js` L1252-1281
- **変更**:
```js
function ageMultiplier(age, traits) {
  let mul;
  if (age <= 17)      mul = 0.70;   // 新人: 体がまだできていない
  else if (age <= 18) mul = 1.00;   // 成長開始
  else if (age <= 20) mul = 1.30;   // 黄金の成長期
  else if (age <= 22) mul = 1.00;   // 安定成長
  else if (age <= 24) mul = 0.50;   // 仕上げ段階
  else if (age <= 26) mul = 0.10;   // ほぼ停止
  else                mul = 0;      // 成長なし
  // ... 特性補正は A-2 で変更
}
```
- [ ] 実装完了

---

#### A-2. 特性補正（早熟/晩成/遅咲き）
- **ファイル**: `src/data.js` L1263-1279（ageMultiplier関数内）
- **変更**:
```js
  // 早熟: ≤18で+30%、≥23で-30%
  if (traits.includes('早熟')) {
    if (age <= 18) mul *= 1.3;
    else if (age >= 23) mul *= 0.7;
  }
  // 晩成: ≤18で-20%、21-27で+40%
  if (traits.includes('晩成')) {
    if (age <= 18) mul *= 0.8;
    else if (age >= 21 && age <= 27) mul *= 1.4;
  }
  // 遅咲き: ≤20で-20%、21-29で爆発的成長
  if (traits.includes('遅咲き')) {
    if (age <= 20) mul *= 0.8;
    else if (age <= 29) mul = Math.max(mul, 0.9);
  }
```
- [ ] 実装完了

---

#### A-3. Wear蓄積開始年齢
- **ファイル**: `src/engine.js` L2092（プレイヤー）、L2774（AI）
- **変更**: `28` → `23`
```js
// L2092: プレイヤー
const decayStartAge = 23 + (nc.durability || 0);

// L2774: AI
const aiDecayStart = 23 + (f.durability || 0);
```
- [ ] 実装完了

---

#### A-4. 初期年齢分布（全7箇所）

| # | ファイル:行 | 現行 | 新 |
|---|-----------|------|---|
| 1 | `data.js` L359 | `16 + rng(0,3)` | `17 + rng(0,2)` |
| 2 | `engine.js` L6392 | `16 + rng(0,5)` | `17 + rng(0,3)` |
| 3 | `engine.js` L2417 | `15 + rng(0,18)` | `17 + rng(0,11)` |
| 4 | `engine.js` L2974 | `16 + rng(0,4)` | `17 + rng(0,2)` |
| 5 | `engine.js` L4996 | `16 + rng(0,4)` | `17 + rng(0,2)` |
| 6 | `engine.js` L3672 | `18 + rng(0,6)` | `17 + rng(0,4)` |
| 7 | `engine.js` L3710,3713 | `18 + rng(0,2)` | `17 + rng(0,2)` |

- [ ] 実装完了（7箇所すべて）

---

#### A-5. スカウト候補の年齢分布
- **ファイル**: `src/engine.js` L4868-4873
- **変更**:
```js
if (ageRoll < 0.40) age = 16 + Engine.rng.int(rng, 0, 1);       // 16-17: 40%
else if (ageRoll < 0.65) age = 18;                                // 18: 25%
else if (ageRoll < 0.85) age = 19;                                // 19: 20%
else age = 20;                                                     // 20: 15%
```
- [ ] 実装完了

---

#### A-6. スカウトstartRatio
- **ファイル**: `src/engine.js` L4908-4911
- **変更**:
```js
if (age <= 18) startRatio = 0.55 + Engine.rng.float(rng) * 0.10;
else if (age <= 20) startRatio = 0.65 + Engine.rng.float(rng) * 0.10;
else startRatio = 0.75 + Engine.rng.float(rng) * 0.10;
```
- [ ] 実装完了

---

#### A-7. generateStartValues の年齢区分
- **ファイル**: `src/engine.js` L2222-2226
- **変更**:
```js
if (entryAge <= 18)      baseRatio = 0.55;
else if (entryAge <= 20) baseRatio = 0.65;
else if (entryAge <= 24) baseRatio = 0.75;
else if (entryAge <= 27) baseRatio = 0.85;
else                     baseRatio = 0.90;
```
- [ ] 実装完了

---

#### A-8. デフォルト年齢fallback（10箇所以上）
- **ファイル**: `src/engine.js` 複数箇所
- **変更**: すべての `|| 16` と `|| 20`（年齢fallback文脈）を `|| 17` に

| 行 | 現行 | 新 |
|---|------|---|
| L6208 | `opts.age \|\| 16` | `opts.age \|\| 17` |
| L6279 | `\|\| 16` | `\|\| 17` |
| L6296 | `\|\| 16` | `\|\| 17` |
| L6322 | `\|\| 16` | `\|\| 17` |
| L6382 | `\|\| 16` | `\|\| 17` |
| L2088 | `c.age \|\| 16` | `c.age \|\| 17` |
| L2772 | `f.age \|\| 20` | `f.age \|\| 17` |
| L2029 | `16 + (char.careerSeasons)` | `17 + (char.careerSeasons)` |
| L2837 | `f.age \|\| 20` | `f.age \|\| 17` |
| L2258 | `16 + rng(0,12)` | `17 + rng(0,11)` |
| L3644 | `r.age \|\| 18` | `r.age \|\| 17` |

- [ ] 実装完了（全箇所）

---

#### A-9. careerSeasons計算（age-16 → age-17）
- **ファイル**: `src/engine.js` L1184, L2259
```js
// L1184: generateBackstory
const careerSeasons = Math.max(1, age - 17);

// L2259: makeAIFighter
careerSeasons: Math.max(0, ((age || 17) - 17)),
```
- [ ] 実装完了

---

#### A-10. makeAIFighter のmaturity計算
- **ファイル**: `src/engine.js` L2240
```js
const maturity = Math.min(1.0, 0.70 + (age - 17) * 0.04 + Engine.rng.float(rng) * 0.10);
```
- [ ] 実装完了

---

#### A-11. FA pool除外年齢
- **ファイル**: `src/engine.js` L3659, L3698
```js
// L3659
if (age !== null && age >= 21) return false;

// L3698
return age === null || age < 21;
```
- [ ] 実装完了

---

#### A-12. リーダー気質ボーナス年齢
- **ファイル**: `src/engine.js` L2042
```js
if ((char.age || 99) <= 19 && G.roster && G.roster.some(...))
```
- [ ] 実装完了

---

#### A-13. 年齢バリデーション上限
- **ファイル**: `src/engine.js` L8924
```js
if (c.age !== undefined && (!isValidNum(c.age) || c.age < 10 || c.age > 40)) {
```
- [ ] 実装完了

---

#### A-14. セーブデータ移行: age fallback
- **ファイル**: `src/app.js` L1264
```js
if (nc.age === undefined) nc.age = 17 + (nc.careerSeasons || 0);
```
- [ ] 実装完了

---

### ═══ B群：調整推奨（16箇所）═══

---

#### B-1. reassess年齢トリガー
- **ファイル**: `src/engine.js` L2127-2134
```js
if (nc.age === 25) {
  const ageRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, nc.id, 25));
  const rv = Engine.scout.reassess(nc, 'age25', ageRng, G.season);
  nc = { ...nc, ...rv };
} else if (nc.age >= 28 && nc.age <= 29) {
  const ageRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, nc.id, 28));
  const rv = Engine.scout.reassess(nc, 'age28plus', ageRng, G.season);
  nc = { ...nc, ...rv };
}
```
- **追加**: `engine.js` reassess() のcase名変更
```js
case 'age25':
  base.assessedValue = Math.round(base.assessedValue * 0.8);
  break;
case 'age28plus':
  base.assessedValue = Math.round(base.assessedValue * 0.6);
  break;
```
- [ ] 実装完了

---

#### B-2. canAdvise条件
- **ファイル**: `src/engine.js` L1631-1636
```js
canAdvise(fighter) {
  if (!fighter || fighter.isRental) return false;
  if ((fighter.wear || 0) >= 20) return true;
  if ((fighter.careerSeasons || 0) >= 6) return true;
  if ((fighter.age || 0) >= 25) return true;
  return false;
},
```
- [ ] 実装完了

---

#### B-3. ブレークスルー年齢ボーナス
- **ファイル**: `src/engine.js` L7018
```js
if ((fighter.age || 17) <= 22) prob += 0.3;
```
- [ ] 実装完了

---

#### B-4. 引退セリフ年齢分岐
- **ファイル**: `src/engine.js` L1604-1608
```js
} else if (fighter.age <= 22) {
  category = 'B1_young';
} else if (fighter.age <= 26) {
  category = 'B2_prime';
} else {
  category = 'B3_older';
}
```
- [ ] 実装完了

---

#### B-5. 引退セリフcareerSeasons分岐
- **ファイル**: `src/engine.js` L1617
```js
} else if ((fighter.careerSeasons || 0) >= 7) {
  category = 'A4_veteran';
```
- [ ] 実装完了

---

#### B-6. ageMarketMultiplier
- **ファイル**: `src/engine.js` L4752-4768
```js
ageMarketMultiplier(age, fighter, rng) {
  if (age <= 19) {
    // ...（若手プレミアム判定ロジックは同じ）
    return 1.0;
  }
  if (age <= 22) return 1.0;
  if (age <= 24) return 0.95;
  if (age <= 26) return 0.85;
  return 1.0; // 27以降はreassessが処理
},
```
- [ ] 実装完了

---

#### B-7. generateBackstory peakAge
- **ファイル**: `src/engine.js` L1194
```js
const peakAge = 21 + Engine.rng.int(rng, 0, 3);
```
- [ ] 実装完了

---

#### B-8. generateBackstory youngSeasons
- **ファイル**: `src/engine.js` L1229
```js
const youngSeasons = Math.max(0, Math.min(careerSeasons, 22 - 17));
```
- [ ] 実装完了

---

#### B-9. generateBackstory careerSeasons閾値
- **ファイル**: `src/engine.js` L1310, L1319
```js
// L1310
if (careerSeasons >= 4 && Engine.rng.float(rng) < 0.15) {

// L1319
if (careerSeasons >= 7 && Engine.rng.float(rng) < 0.05) {
```
- [ ] 実装完了

---

#### B-10. generateBackstory trust bonus
- **ファイル**: `src/engine.js` L1342
```js
if (careerSeasons >= 6) baseTrust += Engine.rng.int(rng, 0, 5);
```
- [ ] 実装完了

---

#### B-11. 勧告セリフcareerSeasons分岐
- **ファイル**: `src/engine.js` L1617付近（selectAdviseLine内）
```js
// careerSeasons >= 10 → careerSeasons >= 7 のケースを確認
} else if ((fighter.careerSeasons || 0) >= 7) {
```
（B-5と同一箇所の可能性あり — 実装時に確認）
- [ ] 実装完了

---

#### B-12. AI初期Wear付与
- **ファイル**: `src/engine.js` L2274付近（makeAIFighter内）
- **新規追加**: wear=0の行の後に挿入
```js
// 初期Wear付与: decayStartAge超の選手にはwear蓄積済みとして生成
const aiDecayStart = 23 + (durability || 0);  // durabilityは上で生成済み
if (age >= aiDecayStart) {
  const yearsOfWear = age - aiDecayStart;
  const initWear = yearsOfWear * (8 + Engine.rng.int(rng, -3, 3));
  wear = Math.min(79, Math.max(0, initWear)); // 80未満に制限（80=確定引退なので初期生成では除外）
}
```
※ durability変数のスコープに注意。makeAIFighter内で `Engine.career.generateDurability(rng)` を先に呼び、その値を使う
- [ ] 実装完了

---

#### B-13. DECAY_TABLE整理
- **ファイル**: `src/data.js` L1285-1301
- **変更**: 未使用のDECAY_TABLEをコメントアウト
```js
// [DEPRECATED] 旧年齢ベースdecay — applyDecayはwearベースに移行済み
// const DECAY_TABLE = { ... };
```
- [ ] 実装完了

---

#### B-14. ニュース表示の引退判定
- **ファイル**: `src/app.js` L3777
```js
if (ovr >= 70 || (f.age || 17) >= 25) {
```
- [ ] 実装完了

---

#### B-15. 引退表示のcareerYears
- **ファイル**: `src/ui-common.js` L1227
```js
const careerYears = f.careerSeasons || Math.max(1, (f.age || 17) - (f.debutAge || 17));
```
- [ ] 実装完了

---

#### B-16. セーブデータ移行: FA age fix
- **ファイル**: `src/app.js` L1284-1289
```js
if (c.age !== 17) return c; // only fix age-17 FAs (legacy: was 16)
const ageRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, c.id, 1616));
const newAge = 17 + Engine.rng.int(ageRng, 0, 6);
```
※ 既存セーブとの互換性: age===16 の旧セーブデータも age===17 と同様に修正が走るようにする。
実装時に `c.age <= 17` に条件を広げるのが安全。
- [ ] 実装完了

---

### ═══ C群：様子見（9箇所、テスト後に判断）═══

| # | 項目 | 判断基準 |
|---|------|---------|
| C-1 | GROWTH_SEASON_BASE (8.0) | 育成不足を感じるなら9.0-10.0に |
| C-2 | Wear増加量 (baseWear 7-13) | 引退が早すぎるなら5-10に減速 |
| C-3 | ライバリー閾値 (2/4/7回) | 宿命到達が困難なら5回に短縮 |
| C-4 | ロスター拡張マイルストーン | orgPop上昇速度次第 |
| C-5 | 経済バランス | スカウト費用の相対感 |
| C-6 | PPV GFバランス | AI平均OVR低下度合い |
| C-7 | クリア到達速度 | 世代交代で自然に延びるか |
| C-8 | 契約更新(trust) | 低trust離脱リスク上昇度 |
| C-9 | 新人王判定 | 影響なし（確認済み） |

---

## セーブデータ互換性

### 既存セーブ → 新バージョンでロード時

既存のセーブデータは「旧ライフサイクル」で進行済みの選手を含む。完全な互換性は保証できないが、以下で対処:

1. **age fallback変更**（A-14）で未定義ageを17基準に修正
2. **FA age fix**（B-16）で旧基準のFAを修正
3. **ageMultiplierは即座に新テーブルで計算される** → 既存の25歳選手は突然ageMul=0.10に
4. **Wear蓄積開始が前倒し** → 23歳以上のwear=0選手に次シーズン末から蓄積開始

**判断**: 既存セーブは「旧バランスの続き」として割り切る。新規ゲームで新ライフサイクルを体験してもらう前提。
移行時に大きな違和感があれば、app.jsのmigration処理でwear補正を入れることも可能。

---

## 実装順序（推奨）

Claude Code での実装は以下の順序で行うのが安全:

### Step 1: コア数値変更（A-1〜A-3）
ageMultiplier + 特性補正 + Wear開始年齢。これだけでゲームの根幹が変わる。

### Step 2: 年齢分布変更（A-4〜A-6）
初期年齢・スカウト年齢。新規ゲーム開始時のキャラクター生成に影響。

### Step 3: fallback統一（A-7〜A-11）
generateStartValues, デフォルト年齢, careerSeasons計算, maturity, FA除外。
地味だが漏れるとバグになる箇所。

### Step 4: 追加必須（A-12〜A-14）
リーダー気質、バリデーション、セーブ移行。

### Step 5: B群一括（B-1〜B-16）
体験品質に関わる閾値変更。一括で適用してテスト。

### Step 6: テスト＆C群判断
新規ゲームでプレイテストし、C群の要否を判断。
