# S級団体強化 実装仕様

> **対象**: S級団体の人材確保失敗問題 + エース育成環境の改善
> **実装者**: Claude Code
> **テスト**: Keisuke が手動確認 + auto-sim検証

---

## 背景・問題

S級団体が長期プレイで人材不足に陥る。trainCap OVR 110+（= 順調に育てばOVR 95〜100到達可能）の選手が退団・引退で減っても、補充メカニズムが弱い。

**現状の年間補充手段**:
- `aiScout`: dormantPoolからランダム順に最大3名 → potTotalを考慮しない
- `aiInterTransfer`: 25%確率で下位団体から1名引き抜き → 発動不確実
- `aiFAAcquire`: 60%確率でFA市場から1名 → 1名のみ

**trainCap OVR分布の参考値** (potTotal上位):

| 順位 | potTotal | 通常factor平均tcOVR | elite factor平均tcOVR |
|---|---|---|---|
| 1-3位 | 809-820 | 109-111 | 125-127 |
| 4-7位 | 799-803 | 108 | 124-125 |
| 8-16位 | 775-796 | 105-107 | 120-123 |

通常factor（平均0.675）だとtcOVR 110に届くのは2名のみ。elite factor（平均0.775）なら65名が到達可能。

---

## 変更点の全体像

| # | 変更 | ファイル |
|---|---|---|
| 1 | `trainCapOVR` ヘルパー関数追加 | engine.js |
| 2 | `getPotTop3Ids` → `getSEliteIds` に拡張（Top4 + trainCapベスト2 = 6名） | engine.js |
| 3 | `initRandomRoster` のfactorOverride適用を6名に拡大 | engine.js |
| 4 | `AI_COACH_CONFIG.S` のace枠を6名体制に変更 | data.js |
| 5 | `getAceConfig` を新コーチ体制に対応 | engine.js |
| 6 | `aiSeasonReinforce` 新設 — オフシーズン自動補強 | engine.js |
| 7 | オフシーズンフローに `aiSeasonReinforce` を挿入 | engine.js (tickWeek) |
| 8 | A級の微調整（elite保証2名、ace枠2名） | data.js + engine.js |

---

## Step 1: trainCapOVR ヘルパー関数

engine.jsの `Engine.rival` 内に追加:

```javascript
/** trainCap 5ステ平均を算出 */
trainCapOVR(fighter) {
  if (!fighter.trainCap) return 0;
  const tc = fighter.trainCap;
  return Math.round(((tc.pw||0) + (tc.sp||0) + (tc.te||0) + (tc.st||0) + (tc.mn||0)) / 5);
},
```

---

## Step 2: getSEliteIds（6名体制）

`getPotTop3Ids` を `getSEliteIds` にリネームし、ロジックを拡張:

```javascript
/**
 * S級elite枠: potTotal Top4 + 残りからtrainCap OVR上位2名 = 計6名
 * - Top4: ゲーム開始時にelite factorで生成
 * - trainCapベスト2: 将来への投資枠（育ってないが天井が高い選手）
 */
getSEliteIds(sRoster) {
  // sRosterが渡された場合は実ロスターのtrainCapベースで判定
  if (sRoster && sRoster.length > 0) {
    // potTotal Top4
    const byPot = [...sRoster]
      .map(f => ({
        id: f.id,
        potTotal: f.pot ? ((f.pot.pw||0)+(f.pot.sp||0)+(f.pot.te||0)+(f.pot.st||0)+(f.pot.mn||0)) : 0,
      }))
      .sort((a,b) => b.potTotal - a.potTotal);
    const top4Ids = new Set(byPot.slice(0, 4).map(f => f.id));

    // 残りからtrainCap OVRベスト2
    const rest = sRoster.filter(f => !top4Ids.has(f.id));
    const byTcOVR = rest
      .map(f => ({ id: f.id, tcOVR: Engine.rival.trainCapOVR(f) }))
      .sort((a,b) => b.tcOVR - a.tcOVR);
    const prospect2Ids = new Set(byTcOVR.slice(0, 2).map(f => f.id));

    return { top4Ids, prospect2Ids, allIds: new Set([...top4Ids, ...prospect2Ids]) };
  }

  // sRoster未指定: ALL_CHARSベースでpotTotal Top4（initRandomRoster用）
  const byPot = ALL_CHARS.map(c => ({
    id: c.id,
    potTotal: (c.pot?.pw||0)+(c.pot?.sp||0)+(c.pot?.te||0)+(c.pot?.st||0)+(c.pot?.mn||0),
  })).sort((a,b) => b.potTotal - a.potTotal);
  const top4Ids = new Set(byPot.slice(0, 4).map(c => c.id));
  return { top4Ids, prospect2Ids: new Set(), allIds: top4Ids };
},
```

旧 `getPotTop3Ids` は削除し、呼び出し箇所を `getSEliteIds` に置き換え。

---

## Step 3: initRandomRoster のfactorOverride拡大

**場所**: engine.js `initRandomRoster` 内、L2811付近

```
変更前:
      const potTop3Ids = Engine.rival.getPotTop3Ids();
      ...
      const factorOverride = (org.tier === 'S' && potTop3Ids.has(id)) ? [0.75, 0.80] : null;

変更後:
      const sElite = Engine.rival.getSEliteIds();
      ...
      let factorOverride = null;
      if (org.tier === 'S') {
        if (sElite.top4Ids.has(id)) factorOverride = [0.75, 0.80];
        // prospect2はinitRandomRoster時点では不明（ロスター未確定）なので初期化後に判定不要
        // → 初期化時はTop4のみelite factor。運用中に新加入する選手はaiSeasonReinforceで適用
      }
```

**初期化後のロスターでprospect2を確定する処理を追加**:

```javascript
// initRandomRoster の return 直前に追加:
// S級ロスター確定後、Top4以外のtrainCapベスト2にもelite factorを再適用
const sOrg = orgs['org_s'];
if (sOrg) {
  const sEliteResult = Engine.rival.getSEliteIds(sOrg.roster);
  // prospect2の選手のtrainCapを再生成（elite factor適用）
  sOrg.roster = sOrg.roster.map(f => {
    if (sEliteResult.prospect2Ids.has(f.id)) {
      const template = ALL_CHARS.find(c => c.id === f.id);
      if (template) {
        const prospectRng = Engine.rng.create(Engine.rng.derive(rng._state || 0, f.id, 0xE11E));
        const newTrainCap = Engine.rival.generateTrainCap(prospectRng, null, template.pot, [0.70, 0.80]);
        return { ...f, trainCap: newTrainCap };
      }
    }
    return f;
  });
}
```

---

## Step 4: AI_COACH_CONFIG.S 変更

**場所**: data.js

```
変更前:
  S: {
    ace: {
      count: 3,
      top1: { coachMul: 1.25, intensiveRate: 0.30, practiceRate: 0.85 },
      top2_3: { coachMul: 1.18, intensiveRate: 0.20, practiceRate: 0.85 },
    },
    general: { coachMul: 1.18, intensiveRate: 0.12, practiceRate: 0.80 },
  },

変更後:
  S: {
    ace: {
      count: 4,                    // OVR上位4名がエース（旧: 3名）
      top1: { coachMul: 1.25, intensiveRate: 0.30, practiceRate: 0.85 },
      top2_4: { coachMul: 1.20, intensiveRate: 0.25, practiceRate: 0.85 },
    },
    prospect: {
      count: 2,                    // trainCap上位2名（Top4除外）がエース候補
      config: { coachMul: 1.18, intensiveRate: 0.20, practiceRate: 0.85 },
    },
    general: { coachMul: 1.15, intensiveRate: 0.10, practiceRate: 0.75 },
  },
```

**変更ポイント**:
- ace枠: 3名→4名、`top2_3` → `top2_4`（1枠増、coachMul 1.18→1.20、intensive 20%→25%）
- prospect枠: 新設2名（trainCapベスト2）。coachMul 1.18、intensive 20%、practice 85%
- general: coachMul 1.18→1.15、intensive 12%→10%、practice 80%→75%（6名との差を明確化）

---

## Step 5: getAceConfig の対応

**場所**: engine.js `getAceConfig` 関数

```
変更後:
getAceConfig(org, fighter) {
  const config = AI_COACH_CONFIG[org.tier] || AI_COACH_CONFIG.B;
  const roster = (org.roster || [])
    .filter(f => !f.injury)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const rank = roster.findIndex(f => f.id === fighter.id);
  if (rank < 0) return config.general;

  if (org.tier === 'S') {
    // S級: 6名体制（Top4 ace + prospect 2名）
    const sElite = Engine.rival.getSEliteIds(org.roster);

    // trainCap Top3（potTop4ではなく実際のtrainCap上位3名）にpracticeRate 0.95
    const byTrainCap = [...(org.roster || [])]
      .map(f => ({ id: f.id, capOvr: Engine.rival.trainCapOVR(f) }))
      .sort((a, b) => b.capOvr - a.capOvr);
    const trainCapTop3Ids = new Set(byTrainCap.slice(0, 3).map(f => f.id));

    // prospect枠判定
    if (sElite.prospect2Ids.has(fighter.id)) {
      const baseConfig = config.prospect.config;
      // trainCapTop3に入っていればpracticeRate上書き
      if (trainCapTop3Ids.has(fighter.id)) {
        return { ...baseConfig, practiceRate: 0.95 };
      }
      return baseConfig;
    }

    // ace枠判定（OVR順位ベース）
    if (rank === 0 && config.ace.top1) {
      const base = config.ace.top1;
      if (trainCapTop3Ids.has(fighter.id)) return { ...base, practiceRate: 0.95 };
      return base;
    }
    if (rank < config.ace.count && config.ace.top2_4) {
      const base = config.ace.top2_4;
      if (trainCapTop3Ids.has(fighter.id)) return { ...base, practiceRate: 0.95 };
      return base;
    }

    return config.general;
  }

  // A級・B級は既存ロジック
  if (rank === 0 && config.ace.top1) return config.ace.top1;
  if (rank < config.ace.count && config.ace.top2_3) return config.ace.top2_3;
  if (rank < config.ace.count) return config.ace.top1;
  return config.general;
},
```

---

## Step 6: aiSeasonReinforce — オフシーズン自動補強

engine.jsの `Engine.rival` 内に新設:

```javascript
/**
 * S級団体のオフシーズン自動補強
 * trainCap OVR 110+が6名未満の場合:
 * - ロスター下位（trainCap OVR最低）を放出
 * - dormantPoolからpotTotal最高の選手をelite factorで生成して加入
 * - 6名に達するまで繰り返す
 */
aiSeasonReinforce(rng, state) {
  const events = [];
  const TC_THRESHOLD = 110;
  const TARGET_COUNT = 6;

  const newAiOrgs = {};
  Object.keys(state.aiOrgs).forEach(orgId => {
    newAiOrgs[orgId] = { ...state.aiOrgs[orgId], roster: [...(state.aiOrgs[orgId]?.roster || [])] };
  });
  let dormantEntries = [...(state.dormantPool || [])];
  let poolIds = dormantEntries.map(e => typeof e === 'object' ? e.id : e);

  const sOrgId = 'org_s';
  const sOrg = RIVAL_ORGS.find(o => o.id === sOrgId);
  if (!sOrg || !newAiOrgs[sOrgId]) return { aiOrgs: newAiOrgs, dormantPool: dormantEntries, events };

  let roster = newAiOrgs[sOrgId].roster;

  // 現在のtrainCap OVR 110+の人数
  const countElite = () => roster.filter(f => Engine.rival.trainCapOVR(f) >= TC_THRESHOLD).length;
  let iterations = 0;
  const maxIterations = 5; // 安全弁

  while (countElite() < TARGET_COUNT && iterations < maxIterations) {
    iterations++;

    // dormantPoolからpotTotal最高の候補を探す
    const occupied = new Set();
    Object.values(newAiOrgs).forEach(a => (a.roster||[]).forEach(f => occupied.add(f.id)));
    (state.roster || []).forEach(f => occupied.add(f.id));
    (state.freeAgents || []).forEach(f => occupied.add(f.id));

    const available = poolIds.filter(id => !occupied.has(id));
    if (available.length === 0) break;

    // potTotal降順でソート
    const sorted = available.map(id => {
      const t = ALL_CHARS.find(c => c.id === id);
      if (!t) return null;
      const potTotal = (t.pot.pw||0)+(t.pot.sp||0)+(t.pot.te||0)+(t.pot.st||0)+(t.pot.mn||0);
      return { id, potTotal, template: t };
    }).filter(Boolean).sort((a,b) => b.potTotal - a.potTotal);

    const candidate = sorted[0];
    if (!candidate) break;

    // elite factorで生成してtrainCap OVR 110+に届くか事前チェック
    const testRng = Engine.rng.create(Engine.rng.derive(rng._state || 0, candidate.id, 0xE11F));
    const testFighter = Engine.rival.makeAIFighter(candidate.template, testRng, sOrgId, 17 + Engine.rng.int(rng, 0, 2), [0.75, 0.80]);
    if (Engine.rival.trainCapOVR(testFighter) < TC_THRESHOLD) {
      // elite factorでも届かない → これ以上の候補はない
      break;
    }

    // ロスター下位を放出
    const byTcOVR = [...roster]
      .map(f => ({ id: f.id, tcOVR: Engine.rival.trainCapOVR(f) }))
      .sort((a,b) => a.tcOVR - b.tcOVR);
    const weakest = byTcOVR[0];
    if (!weakest) break;

    const weakFighter = roster.find(f => f.id === weakest.id);
    roster = roster.filter(f => f.id !== weakest.id);
    events.push(`${sOrg.emoji} ${sOrg.name}: ${weakFighter.name}(tcOVR ${weakest.tcOVR})を放出`);

    // 新選手を加入
    const recruitRng = Engine.rng.create(Engine.rng.derive(rng._state || 0, candidate.id, 0xE120, iterations));
    const newFighter = Engine.rival.makeAIFighter(candidate.template, recruitRng, sOrgId, 17 + Engine.rng.int(rng, 0, 2), [0.75, 0.80]);
    Engine.rival.pushUniqueFighter(roster, newFighter);

    // dormantPoolから除去
    poolIds = poolIds.filter(id => id !== candidate.id);
    dormantEntries = dormantEntries.filter(e => (typeof e === 'object' ? e.id : e) !== candidate.id);

    const newTcOVR = Engine.rival.trainCapOVR(newFighter);
    events.push(`${sOrg.emoji} ${sOrg.name}: ${candidate.template.name}(tcOVR ${newTcOVR})を戦略補強`);
  }

  newAiOrgs[sOrgId] = { ...newAiOrgs[sOrgId], roster };
  return { aiOrgs: newAiOrgs, dormantPool: dormantEntries, events };
},
```

---

## Step 7: オフシーズンフローへの挿入

**場所**: engine.js tickWeek内、offWeek === 2（AIスカウト後）

```
変更前:
        const scoutResult = Engine.rival.aiScout(rng, s);
        s = { ...s, aiOrgs: scoutResult.aiOrgs, dormantPool: scoutResult.dormantPool };
        if (scoutResult.events.length > 0) events.push(...scoutResult.events);

変更後:
        const scoutResult = Engine.rival.aiScout(rng, s);
        s = { ...s, aiOrgs: scoutResult.aiOrgs, dormantPool: scoutResult.dormantPool };
        if (scoutResult.events.length > 0) events.push(...scoutResult.events);

        // S級戦略補強: trainCap OVR 110+が6名未満なら自動補強
        const reinforceRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 0xE11E));
        const reinforceResult = Engine.rival.aiSeasonReinforce(reinforceRng, s);
        s = { ...s, aiOrgs: reinforceResult.aiOrgs, dormantPool: reinforceResult.dormantPool };
        if (reinforceResult.events.length > 0) events.push(...reinforceResult.events);
```

---

## Step 8: A級の微調整

### 8a. AI_COACH_CONFIG.A 変更

```
変更前:
  A: {
    ace: {
      count: 1,
      top1: { coachMul: 1.18, intensiveRate: 0.20, practiceRate: 0.75 },
    },
    general: { coachMul: 1.12, intensiveRate: 0.0, practiceRate: 0.60 },
  },

変更後:
  A: {
    ace: {
      count: 2,                    // エース2名（旧: 1名）
      top1: { coachMul: 1.20, intensiveRate: 0.20, practiceRate: 0.80 },
      top2_3: { coachMul: 1.15, intensiveRate: 0.15, practiceRate: 0.75 },
    },
    general: { coachMul: 1.10, intensiveRate: 0.0, practiceRate: 0.55 },
  },
```

### 8b. initRandomRoster — A級elite保証2名

現在: A級にelite以上1名保証
変更: A級にelite以上2名保証

**場所**: engine.js `initRandomRoster` 内のA級ピック処理

該当箇所を見つけて `slice(0, 1)` → `slice(0, 2)` に変更。
A級のfactorOverrideは追加しない（通常factor [0.55, 0.80] のまま）。

---

## 定数まとめ

| 定数 | 値 | 用途 |
|---|---|---|
| S級elite factor (Top4) | [0.75, 0.80] | 天井引き上げ |
| S級prospect factor (ベスト2) | [0.70, 0.80] | 将来投資枠 |
| 通常factor | [0.55, 0.80] | それ以外 |
| `TC_THRESHOLD` | 110 | S級戦略補強の発動基準 |
| `TARGET_COUNT` | 6 | trainCap OVR 110+の目標人数 |
| S級ace枠 | 4名（OVR上位） | コーチ環境 |
| S級prospect枠 | 2名（trainCapベスト2、Top4除外） | コーチ環境 |
| A級ace枠 | 2名（旧1名） | コーチ環境 |

---

## チェックリスト

- [ ] ゲーム開始直後: S級ロスターにpotTotal Top4がelite factorで生成されている
- [ ] ゲーム開始直後: S級ロスターのtrainCapベスト2（Top4除外）がprospect factorで生成されている
- [ ] S級のtrainCap OVR 110+が6名以上いる
- [ ] オフシーズンにS級のtcOVR 110+が6名未満の場合、自動補強が発動する
- [ ] 自動補強: 下位選手が放出され、高ポテンシャルの新人がelite factorで加入する
- [ ] S級コーチ環境: ace Top1 = coachMul 1.25、Top2-4 = 1.20、prospect 2名 = 1.18、一般 = 1.15
- [ ] S級trainCapTop3にpracticeRate 0.95が適用されている
- [ ] A級にelite以上が2名保証されている
- [ ] A級ace枠が2名になっている
- [ ] auto-sim 100シーズン ALL CLEAR
- [ ] S級の長期OVR推移が以前より底上げされている（S10時点で平均OVRを比較）

---

## 禁止事項

- **テストコードを書かない**: Keisukeが手動確認する
- **ブラウザ起動やスクリーンショット取得をしない**
- **既存のbattlePointsやランキング計算を変更しない**
- **B級の設定を変更しない**（S級・A級のみ対象）
