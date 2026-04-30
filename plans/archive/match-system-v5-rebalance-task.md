# タスク指示書: 戦闘エンジン v5.0 — 試合システム全面再調整

**承認済み**: 2026-04-30 / Keisuke
**前提計画書**: `plans/match-system-v5-rebalance-plan.md`
**実装モード**: Claude Code 単独実行可、最後にシミュレーション検証必須
**注意**: 前回作成された B案実装計画書 `momentum-effect-reduction-plan.md` の変更も**本計画に統合**されているので、別途実装する必要はない。

---

## 1. 変更内容（順番通りに実施）

### 1-1. `src/data.js` — 定数変更

**L.700**:
```diff
-const MAX_T = 20;
+const MAX_T = 16;
```

**L.712 を以下に置換**（counterBase 4→3、counterMax 22→18）:
```diff
-  counterBase: 4, counterTecScale: 0.055, counterSpdPenalty: 0.07, counterMin: 2, counterMax: 22,
+  counterBase: 3, counterTecScale: 0.055, counterSpdPenalty: 0.07, counterMin: 2, counterMax: 18,
```

**L.714 を以下に置換**（dmgPwrScale, dmgTecScale, dmgSpdScale 強化）:
```diff
-  dmgPwrScale: 0.20, dmgTecScale: 0.08, dmgSpdScale: 0.08,
+  dmgPwrScale: 0.24, dmgTecScale: 0.10, dmgSpdScale: 0.10,
```

**L.715 を以下に置換**（defStaScale, defMntScale 強化、momDmgScale 縮小）:
```diff
-  defStaScale: 0.02, defMntScale: 0.055, momDmgScale: 0.003,
+  defStaScale: 0.03, defMntScale: 0.06, momDmgScale: 0.001,
```

**L.708 を以下に置換**（hpBase 50→100、hpScale 0.90→1.80）:
```diff
-  hpBase: 50, hpScale: 0.90,
+  hpBase: 100, hpScale: 1.80,
```

**L.719 を以下に置換**（pinAttemptMomBonus 0.15→0.03）:
```diff
-  pinAttemptMomBonus: 0.15, pinAttemptMntPenalty: 0.20,
+  pinAttemptMomBonus: 0.03, pinAttemptMntPenalty: 0.20,
```

**L.734 を以下に置換**（rollupBaseSuccess 16→10）:
```diff
-  rollupHpThreshold: 0.35, rollupTecBonus: 0.18, rollupBaseSuccess: 16
+  rollupHpThreshold: 0.35, rollupTecBonus: 0.18, rollupBaseSuccess: 10
```

**L.738**:
```diff
-const BIGMATCH_MAX_T = 24;
+const BIGMATCH_MAX_T = 24;
```
（変更なし、確認のみ）

**L.747-749 を以下に置換**（hpBase 85→170、hpScale 1.10→2.20、rollupBaseSuccess 11→10）:
```diff
-  hpBase: 85,
-  hpScale: 1.10,
-  rollupBaseSuccess: 11,
+  hpBase: 170,
+  hpScale: 2.20,
+  rollupBaseSuccess: 10,
```

**TAG_MATCH_CONFIG**: 触らない（hpBase 70, hpScale 1.00 のまま）。

### 1-2. `src/match-engine.js` — シングルマッチ修正

**L.176 を置換**（leftChance に mom 縮小 + popularity 反映）:
```diff
-        const leftChance = 50 + mom * 0.3;
+        const _popAdvL = ((L.popularity || 50) - (R.popularity || 50)) / 100;
+        const _popMultL = (tier >= 2 ? 2.0 : 1.0);
+        const leftChance = 50 + mom * 0.05 + _popAdvL * 6 * _popMultL;
```

**L.52-60 の `calcKickoutChance` を以下に置換**（popAdv 引数を追加）:
```diff
-    calcKickoutChance(def, ph, _eng) {
-      const e = _eng || ENG;
-      let chance = (def.mn / 100) * e.kickoutMnScale;
+    calcKickoutChance(def, ph, _eng, popAdv, popMult) {
+      const e = _eng || ENG;
+      let chance = (def.mn / 100) * e.kickoutMnScale;
+      if (popAdv != null) chance += popAdv * 0.07 * (popMult || 1);
       if (ph.name === 'Climax') chance *= e.kickoutClimaxMult;
       // 闘志: HP低下時のキックアウト率UP
       if (Traits.has(def, '闘志') && def.hp / def.mhp < 0.3) chance += 0.08;
       chance = Engine.util.clamp(chance, 0.05, 0.45);
       if (def.kickoutCount >= e.kickoutMax) chance = 0;
       return chance;
     },
```

**L.62-69 の `calcGuEscapeChance` を以下に置換**（popAdv 引数を追加）:
```diff
-    calcGuEscapeChance(def, ph, _eng) {
-      const e = _eng || ENG;
-      let chance = (def.mn / 100) * e.guEscapeMnScale;
+    calcGuEscapeChance(def, ph, _eng, popAdv, popMult) {
+      const e = _eng || ENG;
+      let chance = (def.mn / 100) * e.guEscapeMnScale;
+      if (popAdv != null) chance += popAdv * 0.07 * (popMult || 1);
       if (ph.name === 'Climax') chance *= 0.8;
       chance = Engine.util.clamp(chance, 0.05, 0.40);
       if (def.kickoutCount >= e.guEscapeMax) chance = 0;
       return chance;
     },
```

**L.207 を置換**（calcDamage 後に M1 OVR比補正 + popularity ダメージ補正）:

該当箇所:
```javascript
            const dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
            def.hp -= dmg;
```

を以下に置換:
```javascript
            let dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
            // v5.0 M1: OVR比ダメージ補正
            const _atkOvr = (atk.pw + atk.sp + atk.te + atk.st + atk.mn) / 5;
            const _defOvr = (def.pw + def.sp + def.te + def.st + def.mn) / 5;
            const _ovrMult = Math.pow(_atkOvr / Math.max(1, _defOvr), 0.50);
            // v5.0 popularity: 防御側人気優位で被ダメ軽減
            const _popAdvD = ((def.popularity || 50) - (atk.popularity || 50)) / 100;
            const _popMultD = (tier >= 2 ? 2.0 : 1.0);
            dmg = Math.max(eng.dmgFloor, Math.round(dmg * _ovrMult * (1 - _popAdvD * 0.06 * _popMultD)));
            def.hp -= dmg;
```

**L.230 の koChance 計算を popAdv/popMult 引数付きに変更**:
```diff
-                let koChance = B.calcKickoutChance(def, ph, eng);
+                const _popAdvKo = ((def.popularity || 50) - (atk.popularity || 50)) / 100;
+                const _popMultKo = (tier >= 2 ? 2.0 : 1.0);
+                let koChance = B.calcKickoutChance(def, ph, eng, _popAdvKo, _popMultKo);
```

**L.242 の escChance 計算を popAdv/popMult 引数付きに変更**:
```diff
-                let escChance = B.calcGuEscapeChance(def, ph, eng);
+                const _popAdvGu = ((def.popularity || 50) - (atk.popularity || 50)) / 100;
+                const _popMultGu = (tier >= 2 ? 2.0 : 1.0);
+                let escChance = B.calcGuEscapeChance(def, ph, eng, _popAdvGu, _popMultGu);
```

**L.758 のカウンター時 calcDamage 後にも同様の M1 補正を入れる**:

該当箇所:
```javascript
          let cDmg = B.calcDamage(rng, cMv, def, atk, mom, atkSide === 'left' ? 'right' : 'left', ph);
```

を以下に変更:
```javascript
          let cDmg = B.calcDamage(rng, cMv, def, atk, mom, atkSide === 'left' ? 'right' : 'left', ph);
          // v5.0 M1: カウンター時も OVR比補正
          const _cAtkOvr = (def.pw + def.sp + def.te + def.st + def.mn) / 5;
          const _cDefOvr = (atk.pw + atk.sp + atk.te + atk.st + atk.mn) / 5;
          const _cOvrMult = Math.pow(_cAtkOvr / Math.max(1, _cDefOvr), 0.50);
          const _cPopAdvD = ((atk.popularity || 50) - (def.popularity || 50)) / 100;
          const _cPopMultD = (tier >= 2 ? 2.0 : 1.0);
          cDmg = Math.max(eng.dmgFloor, Math.round(cDmg * _cOvrMult * (1 - _cPopAdvD * 0.06 * _cPopMultD)));
```

注意: カウンター時は防御側(`def`)が攻撃して攻撃側(`atk`)に当てるので、変数名の対応に注意。

### 1-3. `src/match-engine.js` — タッグマッチ修正

**L.730 を置換**（atkRoll の mom 縮小、popularity は反映しない）:
```diff
-      const atkRoll = Engine.rng.float(rng) * 100 + mom * 0.3;
+      const atkRoll = Engine.rng.float(rng) * 100 + mom * 0.05;
```

**L.843 のタッグ calcDamage 後に M1 補正を追加**（popularity は反映しない）:

該当箇所:
```javascript
          let dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
```

を以下に変更:
```javascript
          let dmg = B.calcDamage(rng, mv, atk, def, mom, atkSide, ph);
          // v5.0 M1: タッグも OVR比補正（popularity は無し）
          {
            const _tAtkOvr = (atk.pw + atk.sp + atk.te + atk.st + atk.mn) / 5;
            const _tDefOvr = (def.pw + def.sp + def.te + def.st + def.mn) / 5;
            const _tOvrMult = Math.pow(_tAtkOvr / Math.max(1, _tDefOvr), 0.50);
            dmg = Math.max(ENG.dmgFloor, Math.round(dmg * _tOvrMult));
          }
```

**L.1021 のタッグ式合体技 calcDamage 後にも同様に M1 補正**:
```javascript
        let tagDmg = B.calcDamage(rng, tagMv, effAtk, effDef, mom, atkSide, ph);
```

を以下に変更:
```javascript
        let tagDmg = B.calcDamage(rng, tagMv, effAtk, effDef, mom, atkSide, ph);
        {
          const _tgAtkOvr = (effAtk.pw + effAtk.sp + effAtk.te + effAtk.st + effAtk.mn) / 5;
          const _tgDefOvr = (effDef.pw + effDef.sp + effDef.te + effDef.st + effDef.mn) / 5;
          const _tgOvrMult = Math.pow(_tgAtkOvr / Math.max(1, _tgDefOvr), 0.50);
          tagDmg = Math.max(ENG.dmgFloor, Math.round(tagDmg * _tgOvrMult));
        }
```

**L.782, L.816, L.870, L.904** のタッグ内の `calcKickoutChance`/`calcGuEscapeChance` 呼び出しは引数を増やさない（既存のまま）。新しい引数 popAdv/popMult は省略時 undefined となり、関数内の `if (popAdv != null)` でスキップされるので popularity は反映されない設計。

### 1-4. `specs/battle-engine-spec-v4.2.md` — 仕様書更新

**変更履歴テーブル（先頭付近）に v5.0 行を追加**:
```diff
+| v5.0 | 2026-04-30 | **試合システム全面再調整**：①モメンタム実効効果縮小 ②HP×2.0延長(シングルのみ) ③通常MAX_T 20→16 ④能力値ダメージ・防御強化 ⑤番狂わせ機構抑制 ⑥M1 OVR比ダメージ補正導入 ⑦popularity反映導入(通常×1.0/ビッグ×2.0)。詳細は `plans/match-system-v5-rebalance-plan.md`。 |
```

**§3 行動順決定** — `leftChance` 計算式の更新:
```diff
-leftChance = 50 + (momentum × 0.3) + (eff(L.spd) - eff(R.spd)) × 0.15
-leftChance = clamp(leftChance, 20, 80)
+leftChance = 50 + (momentum × 0.05) + (popAdv × 6 × tierMult)
+// popAdv = (L.popularity - R.popularity) / 100, tierMult = tier>=2 ? 2.0 : 1.0
+// SPD項とclamp(20,80)は実装に存在しないため記載なし（v5.0時点）
```

**§7.1 ダメージ計算** — `mMod` 係数とポストプロセス追加:
```diff
-mMod = 1.0 + (momentum_advantage × 0.003)
+mMod = 1.0 + (momentum_advantage × 0.001)   // v5.0
+
+// v5.0 ポストプロセス（calcDamage 後に呼び出し元で適用）
+ovrMult = (atk.OVR / def.OVR) ^ 0.50
+popMult = 1 - popAdv × 0.06 × tierMult
+dmg = max(dmgFloor, round(dmg × ovrMult × popMult))
```

**§フォール狙い発動率** — `attemptRate` 係数:
```diff
-attemptRate = 25 + (momentum_advantage × 0.15)
+attemptRate = 25 + (momentum_advantage × 0.03)   // v5.0
```

**§ENG定数** — 数値同期:
```diff
-  hpBase: 50, hpScale: 0.90,
+  hpBase: 100, hpScale: 1.80,
-  counterBase: 4, ..., counterMax: 22,
+  counterBase: 3, ..., counterMax: 18,
-  dmgPwrScale: 0.20, dmgTecScale: 0.08, dmgSpdScale: 0.08,
+  dmgPwrScale: 0.24, dmgTecScale: 0.10, dmgSpdScale: 0.10,
-  defStaScale: 0.02, defMntScale: 0.055, momDmgScale: 0.003,
+  defStaScale: 0.03, defMntScale: 0.06, momDmgScale: 0.001,
-  pinAttemptMomBonus: 0.15,
+  pinAttemptMomBonus: 0.03,
-  rollupBaseSuccess: 16
+  rollupBaseSuccess: 10
-MAX_T = 20
+MAX_T = 16
```

**§BIGMATCH_ENG定数** — 数値同期:
```diff
-  hpBase: 85, hpScale: 1.10, rollupBaseSuccess: 11,
+  hpBase: 170, hpScale: 2.20, rollupBaseSuccess: 10,
```

**§calcKickoutChance / calcGuEscapeChance** — 引数追加と popularity 補正の説明を追記:
```
v5.0: popAdv（人気優位度）と popMult（tier倍率）を引数に追加。
chance += popAdv × 0.07 × popMult
（popAdv = (def.popularity - atk.popularity) / 100、tierMult = tier>=2 ? 2.0 : 1.0）
```

### 1-5. `docs/master-spec.md` の確認

```bash
grep -n "0\.3\|0\.003\|0\.15\|hpBase\|MAX_T" docs/master-spec.md | head -20
```

該当箇所があれば数値を v5.0 値に更新。なければスキップ。

### 1-6. `docs/game-system-roadmap.md` の更新

冒頭の「前回」エントリを以下のスタイルで上書き：

```markdown
前回: **戦闘エンジン v5.0 — 試合システム全面再調整（2026-04-30）。** `plans/match-system-v5-rebalance-plan.md` の確定案実装。①現状調査で「OVR差20でも下位勝率22%」「通常マッチで5T以下のヘボ試合15%発生」「人気は試合に未反映」と判明。②方針：能力値差を貫通的に試合結果に反映する新メカニズム M1（OVR比ダメージ補正、ovrMult = (atkOvr/defOvr)^0.50）を主役に、HP×2.0延長＋MAX_T短縮で試合長と TO率を調整、popularity 反映を tier別倍率（通常×1.0、ビッグ×2.0）で導入。③変更：data.js（hpBase 50→100, hpScale 0.90→1.80, hpBase_t2 85→170, hpScale_t2 1.10→2.20, MAX_T 20→16, BIGMATCH_MAX_T 24→24据置, momDmgScale 0.003→0.001, pinAttemptMomBonus 0.15→0.03, dmgPwrScale 0.20→0.24, dmgTec/SpdScale 0.08→0.10, defStaScale 0.02→0.03, defMntScale 0.055→0.06, counterBase 4→3, counterMax 22→18, rollupBaseSuccess 16→10/11→10）、match-engine.js（leftChance mom×0.3→0.05+popularity項追加, atkRoll mom×0.3→0.05, calcKickoutChance/calcGuEscapeChance に popAdv/popMult 引数追加, シングル calcDamage後 にM1+pop補正、カウンター時も M1+pop補正、タッグ calcDamage後にM1のみ補正、タッグ式合体技にもM1補正）。④期待効果（測定済）：通常マッチ平均ターン 8.2→11.4、ビッグ 13.3→18.4、ヘボ試合率15.1%→0.7%、通常TO率0%→4.8%、ビッグTO率0.3%→5.3%、OVR差20番狂わせ通常25.1%→17.6% / ビッグ22.3%→14.7%、OVR差30 ビッグ11.5%→3.8%、能力値貢献度標準偏差0.71pp→0.54pp、互角バランス 50.4/49.6 維持。popularity効果: pop差80でビッグ+9pp、pop差99で+10.7pp。⑤副作用なし：タッグマッチはHP/MAX_T/popularity反映なし（M1とmom縮小のみ適用、試合時間が長すぎ問題は悪化させない）、セーブ互換性影響なし、MQ算出は内部で平均ターン参照のため自動追従。⑥仕様書 specs/battle-engine-spec-v4.2.md を v5.0 として変更履歴追加＋§3/§7.1/§フォール狙い/§ENG定数/§BIGMATCH_ENG定数/§calcKickoutChance/§calcGuEscapeChance を実装に同期。⑦検証：test/_match-system-v5-validation.js で番狂わせ率/平均ターン/ヘボ率/能力値貢献度/popularity効果/互角試合カーブを測定、計画書 §5 の期待値と一致確認、auto-sim 100シーズン(seed=12345) ALL CLEAR、stat-contribution-test で能力値貢献度に大きな歪みがないことを確認。⑧残タスク：仕様書のSPD項（leftChance内 spd差×0.15項とclamp(20,80)）の復活は別計画として未着手、番狂わせ体質トレイトの効果検証は別途、タッグマッチへのpopularity反映は希望があれば次計画。変更：src/data.js+src/match-engine.js+specs/battle-engine-spec-v4.2.md+plans/match-system-v5-rebalance-plan.md+plans/match-system-v5-rebalance-task.md+test/_match-system-v5-validation.js+docs/game-system-roadmap.md(本項)。
```

検証結果は実測値で書き換え。

---

## 2. 検証スクリプト作成

`test/_match-system-v5-validation.js` を新規作成（Node.js で実行可能、外部パッケージ不要）。

### 内容

```javascript
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  vm.runInThisContext(code, { filename });
}
loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');

function mk(name, ovr, opts) {
  opts = opts || {};
  return { id: name, name,
    pw: opts.pw != null ? opts.pw : ovr, sp: opts.sp != null ? opts.sp : ovr,
    te: opts.te != null ? opts.te : ovr, st: opts.st != null ? opts.st : ovr,
    mn: opts.mn != null ? opts.mn : ovr,
    style: opts.style || 'Allround',
    popularity: opts.popularity != null ? opts.popularity : 50,
    traits: opts.traits || [], injuryWeeks: 0
  };
}

function runDist(L, R, n, tier) {
  const turns = [];
  let lw = 0, rw = 0, to = 0;
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    const r = Engine.battle.simulateMatch(L, R, Engine.rng.create(i + 1), tier || 1);
    turns.push(r.turns);
    if (r.winner === 'left') lw++; else if (r.winner === 'right') rw++;
    if (r.finishPhase === 'Timeout') to++;
  }
  for (let i = 0; i < half; i++) {
    const r = Engine.battle.simulateMatch(R, L, Engine.rng.create(half + i + 1), tier || 1);
    turns.push(r.turns);
    if (r.winner === 'left') rw++; else if (r.winner === 'right') lw++;
    if (r.finishPhase === 'Timeout') to++;
  }
  const avg = turns.reduce((a,b)=>a+b,0) / turns.length;
  let le5 = 0;
  for (const t of turns) if (t <= 5) le5++;
  return { lw: lw/n*100, rw: rw/n*100, t: avg, to: to/n*100, le5: le5/n*100 };
}

const N = 5000;

console.log('═══ 戦闘エンジン v5.0 検証 ═══\n');

console.log('━━ 試験1: 番狂わせ率（同pop=50） ━━');
console.log('OVR上位 vs 下位 | 通常 下位勝率 | ビッグ 下位勝率');
for (const [hi, lo] of [[80,80],[80,75],[80,70],[80,65],[80,60],[80,55],[80,50]]) {
  const r1 = runDist(mk('A', hi), mk('B', lo), N, 1);
  const r2 = runDist(mk('A', hi), mk('B', lo), N, 2);
  console.log(`${hi} vs ${lo}     | ${r1.rw.toFixed(1)}%       | ${r2.rw.toFixed(1)}%`);
}

console.log('\n━━ 試験2: 試合長 / TO率 / ヘボ試合率（互角80vs80） ━━');
const eq1 = runDist(mk('A', 80), mk('B', 80), N, 1);
const eq2 = runDist(mk('A', 80), mk('B', 80), N, 2);
console.log(`通常 互角  | 平均T ${eq1.t.toFixed(1)} / TO率 ${eq1.to.toFixed(1)}% / ヘボ率 ${eq1.le5.toFixed(1)}%`);
console.log(`ビッグ 互角| 平均T ${eq2.t.toFixed(1)} / TO率 ${eq2.to.toFixed(1)}% / ヘボ率 ${eq2.le5.toFixed(1)}%`);

console.log('\n━━ 試験3: 能力値貢献度（平均60 vs +30特化） ━━');
const baseline = mk('Base', 60);
const stats = [];
for (const [k, key] of [['PW','pw'],['SP','sp'],['TE','te'],['ST','st'],['MN','mn']]) {
  const sp = mk(`${k}90`, 60); sp[key] = 90;
  const r = runDist(baseline, sp, N, 1);
  console.log(`${k}+30 | 勝率 ${r.rw.toFixed(1)}%`);
  if (k !== 'MN') stats.push(r.rw);
}
const m = stats.reduce((a,b)=>a+b,0) / stats.length;
const sd = Math.sqrt(stats.reduce((s,v)=>s+(v-m)**2,0)/stats.length);
console.log(`PW/SP/TE/ST 標準偏差 ${sd.toFixed(2)}pp`);

console.log('\n━━ 試験4: popularity効果（同OVR=80、pop差別） ━━');
console.log('pop差         | 通常 補正 | ビッグ 補正');
for (const [pa, pb] of [[50,50],[70,30],[80,20],[90,10],[99,1]]) {
  const r1 = runDist(mk('A', 80, { popularity: pa }), mk('B', 80, { popularity: pb }), N, 1);
  const r2 = runDist(mk('A', 80, { popularity: pa }), mk('B', 80, { popularity: pb }), N, 2);
  console.log(`${pa} vs ${pb}      | +${(r1.lw-50).toFixed(1)}pp    | +${(r2.lw-50).toFixed(1)}pp`);
}

console.log('\n━━ 試験5: 互角試合カーブ（OVR差0〜10、ビッグマッチ） ━━');
console.log('OVR上位 vs 下位 | 上位勝率');
for (const lo of [80,79,78,77,76,75,73,70]) {
  const r = runDist(mk('A', 80), mk('B', lo), N, 2);
  console.log(`80 vs ${lo}    | ${r.lw.toFixed(1)}%`);
}

console.log('\n━━ 試験6: 実機シナリオ（ビッグマッチ） ━━');
const scs = [
  { n: 'トップ(80,p90) vs 中堅(60,p40)', L: mk('A', 80, { popularity: 90 }), R: mk('B', 60, { popularity: 40 }) },
  { n: 'エース(80,p99) vs 弱者(60,p20)', L: mk('A', 80, { popularity: 99 }), R: mk('B', 60, { popularity: 20 }) },
  { n: '人気弱者(60,p99) vs 不人気強者(80,p10)', L: mk('A', 60, { popularity: 99 }), R: mk('B', 80, { popularity: 10 }) },
];
for (const s of scs) {
  const r = runDist(s.L, s.R, N, 2);
  console.log(`${s.n.padEnd(40)} | 左勝率 ${r.lw.toFixed(1)}%`);
}

console.log('\n═══ 検証完了 ═══');
```

---

## 3. 検証実行手順

### 3-1. v5.0 専用検証スクリプト

```bash
node test/_match-system-v5-validation.js
```

期待値（±2%程度の許容誤差内なら合格）:
- 試験1: 80 vs 60 通常 17.6%、ビッグ 14.7%
- 試験2: 通常 平均 11.4 / TO 4.8% / ヘボ 0.7%、ビッグ 平均 18.4 / TO 5.3% / ヘボ 0.0%
- 試験3: PW/SP/TE/ST 各 62-64%、MN 57.7%、標準偏差 0.5pp 前後
- 試験4: pop差99 通常 +5.5pp、ビッグ +10.7pp
- 試験5: 80 vs 75 → 60.1%（ビッグ）
- 試験6: トップ vs 中堅 → 約88%、人気弱者 → 約21%

### 3-2. エンジン整合性テスト

```bash
node test/auto-sim.js 100 12345
```

ALL CLEAR 確認（違反0、エラー0、ゲームオーバー0）。

### 3-3. 能力値貢献度テスト（既存）

```bash
node test/stat-contribution-test.js
```

PW/SP/TE/ST が概ね揃っていることを目視確認。

---

## 4. 実装後のチェックリスト

- [ ] `src/data.js` の各定数変更を完了
- [ ] `src/match-engine.js` のシングルマッチ部分（leftChance、calcKickoutChance/calcGuEscapeChance、calcDamage後補正、カウンター時補正）
- [ ] `src/match-engine.js` のタッグマッチ部分（atkRoll、calcDamage後 M1のみ、タッグ式合体技にも M1）
- [ ] `specs/battle-engine-spec-v4.2.md` v5.0 の変更履歴追記＋数値同期
- [ ] `docs/master-spec.md` の数値も同期（該当箇所があれば）
- [ ] `test/_match-system-v5-validation.js` を作成
- [ ] `node test/_match-system-v5-validation.js` 実行、期待値と一致
- [ ] `node test/auto-sim.js 100 12345` で ALL CLEAR
- [ ] `node test/stat-contribution-test.js` で大きな歪みなし
- [ ] `docs/game-system-roadmap.md` 「前回」エントリ更新

---

## 5. 完了報告フォーマット

実装完了後、以下を Keisuke に報告：

1. **変更したファイル一覧**
2. **`_match-system-v5-validation.js` の出力結果**（全試験の数値）
3. **auto-sim 結果**（ALL CLEAR か、エラー有無）
4. **stat-contribution-test 結果**
5. **ロードマップ「前回」エントリ全文**（コピペ用、検証結果は実測値で書き換え済み）
6. **想定外の動作や疑問点**があれば併記

---

## 6. 注意事項

### 6-1. タッグマッチへの popularity 反映なし

タッグマッチでは calcKickoutChance/calcGuEscapeChance を呼ぶ際、popAdv 引数を渡さない（既存の呼び出しコードのまま）。関数側の `if (popAdv != null)` で popularity 補正をスキップする設計。

### 6-2. 相互作用のテスト

M1 補正 + popularity 補正 + 能力値強化 + HP延長 が同時に効くため、想定外の相互作用がないか検証スクリプトで確認すること。

### 6-3. ロールバック手順

万一不具合が出たら：

```bash
git diff HEAD~1 -- src/match-engine.js src/data.js
git checkout HEAD~1 -- src/match-engine.js src/data.js
```

仕様書とロードマップは別コミットに分けるとロールバックしやすい。

---

## 7. 完了後のタスク移動

```bash
mkdir -p plans/archive
mv plans/match-system-v5-rebalance-task.md plans/archive/
```
