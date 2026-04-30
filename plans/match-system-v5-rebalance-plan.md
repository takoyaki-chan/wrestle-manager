# 戦闘エンジン v5.0 — 試合システム全面再調整 計画書

**作成日**: 2026-04-30
**承認**: Keisuke / 2026-04-30
**前計画**: `momentum-effect-reduction-plan.md`（B案）— 本計画に統合する形で実装する
**実装方針**: Claude Code 単独実装可、計画書通りに進めて最後にシミュレーション検証

---

## 1. 目的

現状の試合システムには以下の問題があった：
- 番狂わせ（OVR差20でも下位が勝つ）が頻発
- 5つの能力値の試合への影響度が不揃い
- 通常マッチで「ヘボ試合（5ターン以下）」が15.1%発生
- 人気（popularity）が試合に全く反映されていない

これらを全面的に解決する。

---

## 2. 設計目標（測定値ベース）

| 指標 | 現状 | 目標 |
|---|---:|---:|
| OVR差20（ビッグマッチ）下位勝率 | 22.3% | 約15%以下 |
| 通常マッチ ヘボ試合率（≤5T） | 15.1% | 5%以下 |
| 通常マッチ 平均ターン | 8.2 | 10〜12 |
| ビッグマッチ 平均ターン | 13.3〜18.6 | 18前後 |
| 通常マッチ TO率 | 0.0% | 約5% |
| ビッグマッチ TO率 | 0.3% | 約5% |
| PW/SP/TE/ST 影響度の標準偏差 | 0.71pp | 0.5pp前後 |
| 互角試合のドラマ性 | 維持要 | 維持 |
| popularity 通常マッチ反映 | なし | pop差99で約±5pp |
| popularity ビッグマッチ反映 | なし | pop差99で約±10pp |

---

## 3. 採用する変更内容

### 3-1. モメンタム影響縮小（前計画 B案を統合）

| 定数 / 計算式 | 現状 | 新案 |
|---|---|---|
| `leftChance` の `mom × ?` | 0.3 | **0.05** |
| `atkRoll`（タッグ）の `mom × ?` | 0.3 | **0.05** |
| `momDmgScale` | 0.003 | **0.001** |
| `pinAttemptMomBonus` | 0.15 | **0.03** |

### 3-2. HP延長 ×2.0（シングルマッチのみ、タッグマッチは据え置き）

| 定数 | 現状 | 新案 |
|---|---:|---:|
| `ENG.hpBase`（通常マッチ） | 50 | **100** |
| `ENG.hpScale`（通常マッチ） | 0.90 | **1.80** |
| `BIGMATCH_ENG.hpBase`（ビッグマッチ） | 85 | **170** |
| `BIGMATCH_ENG.hpScale`（ビッグマッチ） | 1.10 | **2.20** |
| `TAG_MATCH_CONFIG.hpBase` | 70 | **70（据え置き）** |
| `TAG_MATCH_CONFIG.hpScale` | 1.00 | **1.00（据え置き）** |

### 3-3. MAX_T 短縮（通常マッチのみ）

| 定数 | 現状 | 新案 |
|---|---:|---:|
| `MAX_T`（通常マッチ） | 20 | **16** |
| `BIGMATCH_MAX_T`（ビッグマッチ） | 24 | **24（据え置き）** |
| `TAG_MATCH_CONFIG.maxTotalTurns` | （現状値） | **据え置き** |

### 3-4. 能力値ダメージ・防御の強化

| 定数 | 現状 | 新案 |
|---|---:|---:|
| `dmgPwrScale` | 0.20 | **0.24** |
| `dmgTecScale` | 0.08 | **0.10** |
| `dmgSpdScale` | 0.08 | **0.10** |
| `defStaScale` | 0.02 | **0.03** |
| `defMntScale` | 0.055 | **0.06** |

### 3-5. 番狂わせ機構の僅かな抑制

| 定数 | 現状 | 新案 |
|---|---:|---:|
| `rollupBaseSuccess`（ENG） | 16 | **10** |
| `rollupBaseSuccess`（BIGMATCH_ENG） | 11 | **10** |
| `counterBase` | 4 | **3** |
| `counterMax` | 22 | **18** |

**触らない**: 命中率（`tecHitBonus`、`spdDodgeBonus`、`hitMin`、`hitMax`）と乱数幅（`dmgRandMin`、`dmgRandRange`）は据え置き。互角試合のドラマ性を守るため。

### 3-6. 新メカニズム M1：OVR比ダメージ補正

ダメージ計算後、攻撃側と防御側の OVR 比を 0.50 乗してダメージに乗算する。能力差が累積でダメージに反映される、本変更の主役メカニズム。

実装場所: `src/match-engine.js` シングルマッチの `simulateMatch` 内、`const dmg = B.calcDamage(...)` 直後。タッグマッチも同等に適用。

```javascript
// 既存
const dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
def.hp -= dmg;

// 新案
let dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
const _atkOvr = (atk.pw + atk.sp + atk.te + atk.st + atk.mn) / 5;
const _defOvr = (def.pw + def.sp + def.te + def.st + def.mn) / 5;
const _ovrMult = Math.pow(_atkOvr / Math.max(1, _defOvr), 0.50);
const _popAdvD = ((def.popularity || 50) - (atk.popularity || 50)) / 100;
const _popMultD = (tier >= 2 ? 2.0 : 1.0);
dmg = Math.max(eng.dmgFloor, Math.round(dmg * _ovrMult * (1 - _popAdvD * 0.06 * _popMultD)));
def.hp -= dmg;
```

タッグマッチも同様に補正。タッグの `tier` 引数は 1 固定なので popularity 倍率は ×1.0 になる。

### 3-7. 新メカニズム：popularity 反映

| 効果 | 計算 | tier=1 倍率 | tier=2 倍率 |
|---|---|---:|---:|
| 攻撃機会 | `leftChance += popAdv × 6 × tierMult` | ×1.0 | ×2.0 |
| 被ダメ軽減 | `dmg *= (1 - popAdv × 0.06 × tierMult)` | ×1.0 | ×2.0 |
| キックアウト率 | `koChance += popAdv × 0.07 × tierMult` | ×1.0 | ×2.0 |
| ギブアップ脱出 | `guChance += popAdv × 0.07 × tierMult` | ×1.0 | ×2.0 |

`popAdv = (own.popularity - opp.popularity) / 100`、範囲は -1.0 〜 +1.0。

タッグマッチには popularity 反映を**入れない**（複雑化を避けるため、tier=1 として倍率 ×1.0 になるのは leftChance/calcDamage のみ）。

### 3-8. タッグマッチへの影響まとめ

タッグマッチの `simulateTagMatch` には以下のみ反映：
- モメンタム影響縮小（mom × 0.3 → 0.05）
- 能力値ダメージ・防御強化（共通定数のため自動）
- 番狂わせ機構抑制（共通定数のため自動）
- M1 OVR比ダメージ補正（タッグも適用）

タッグマッチには以下を**反映しない**：
- HP延長（TAG_MATCH_CONFIG.hpBase / hpScale 据え置き）
- MAX_T 短縮（タッグの maxTotalTurns 据え置き）
- popularity 反映（kickout/guEscape はタッグでも呼ばれるが、引数で popMult=1.0 を渡す）

---

## 4. 変更ファイル

| ファイル | 内容 |
|---|---|
| `src/data.js` | ENG・BIGMATCH_ENG 定数の数値変更、MAX_T 変更 |
| `src/match-engine.js` | シングル/タッグの leftChance/atkRoll、calcDamage 後の M1+pop補正、calcKickoutChance/calcGuEscapeChance に popAdv 引数追加 |
| `specs/battle-engine-spec-v4.2.md` | v5.0 の変更履歴追記、各セクション数値同期 |
| `docs/master-spec.md` | 該当箇所があれば更新（grep で確認） |
| `docs/game-system-roadmap.md` | 「前回」エントリ更新 |
| `test/_match-system-v5-validation.js` | 新規作成、検証用スクリプト |

---

## 5. 期待される効果（測定済み）

### 5-1. 番狂わせ率（同pop=50、純粋な能力値差）

| OVR差 | 通常マッチ | ビッグマッチ |
|---|---:|---:|
| 0 | 50.4% | 50.4% |
| 5 | 42.4% | 41.2% |
| 10 | 32.7% | 31.0% |
| 15 | 25.3% | 22.5% |
| **20** | **17.6%** | **14.7%** |
| 25 | 11.1% | 8.6% |
| 30 | 6.8% | 3.8% |

### 5-2. 試合長 / TO率 / ヘボ試合率（互角80vs80）

| 試合タイプ | 平均ターン | TO率 | ヘボ率（≤5T） |
|---|---:|---:|---:|
| 通常マッチ | 11.4 | 4.8% | 0.7% |
| ビッグマッチ | 18.4 | 5.3% | 0.0% |

### 5-3. 能力値貢献度（平均型 vs +30特化）

| 特化 | 勝率 |
|---|---:|
| PW+30 | 62.3% |
| SP+30 | 63.6% |
| TE+30 | 63.2% |
| ST+30 | 62.6% |
| MN+30 | 57.7% |
| **標準偏差（MN除く）** | **0.54pp** |

### 5-4. popularity 効果（同OVR=80、ビッグマッチ）

| pop差 | 補正値 |
|---|---:|
| 40 | +3.7pp |
| 60 | +6.6pp |
| 80 | +9.0pp |
| 99 | +10.7pp |

通常マッチでは上記の約半分。

### 5-5. 実機シナリオ（ビッグマッチ）

| 想定 | 上位勝率 |
|---|---:|
| トップ(80,p90) vs 中堅(60,p40) | 約88% |
| エース(80,p99) vs 弱者(60,p20) | 約90% |
| 人気弱者(60,p99) vs 不人気強者(80,p10)（番狂わせドラマ） | 約21% |

---

## 6. 実装順序

1. **data.js の定数変更**（モメンタム、HP、MAX_T、能力値強化、番狂わせ抑制）
2. **match-engine.js のシングルマッチ部分**
   - leftChance の mom 係数変更
   - calcKickoutChance/calcGuEscapeChance に popAdv 引数追加
   - simulateMatch 内の calcDamage 後に M1+pop ダメージ補正
   - simulateMatch 内の calcKickoutChance/calcGuEscapeChance 呼び出しに popAdv/popMult 渡す
3. **match-engine.js のタッグマッチ部分**
   - atkRoll の mom 係数変更
   - simulateTagMatch 内の calcDamage 後に M1 補正（pop なし）
   - calcKickoutChance/calcGuEscapeChance 呼び出しに popAdv=null 渡す（または引数省略でデフォルト動作）
4. **specs/battle-engine-spec-v4.2.md の更新**
5. **検証スクリプト作成 → 実行 → 数値確認**
6. **ロードマップ更新**

---

## 7. 検証スクリプト

`test/_match-system-v5-validation.js` を作成。以下を測定：

1. 番狂わせ率（OVR差0〜30、通常/ビッグ）
2. 平均ターン / TO率 / ヘボ試合率（互角80vs80）
3. 能力値貢献度（+30特化 vs 平均型）
4. popularity 効果（同OVR=80、pop差別）
5. 実機シナリオ（トップ vs 中堅など）
6. 互角試合のカーブ（OVR差 0〜10、1刻み）

期待値との一致を確認。

---

## 8. 残課題（本計画の対象外）

- 仕様書 `battle-engine-spec-v4.2.md` の `(eff(L.spd) - eff(R.spd)) × 0.15` SPD項とclamp(20,80)：実コードに復活させるかは別計画
- 番狂わせ体質トレイトの効果検証：本計画では効果が出にくい構造のため、別途専用ロジック追加検討
- タッグマッチへの popularity 反映：本計画では入れない、希望があれば次計画で
