# v0.9 patch: difficulty mode + low-OV MQ guard + season date format

## A. difficulty mode (no subsidy hard mode)

### overview
Add difficulty selection at game start. Normal = unchanged. Hard = subsidies disabled. No economy rebalancing needed.

### A-1. GameState flag (engine.js createInitialState)
```js
difficultyMode: 'normal', // 'normal' | 'hard'
```

### A-2. getSubsidy mode check (engine.js)
```js
getSubsidy(orgPop, difficultyMode) {
  if (difficultyMode === 'hard') return 0;
  for (const s of SUBSIDY_TABLE) if (orgPop <= s.max) return s.val;
  return 0;
},
```
Pass G.difficultyMode from all call sites (tickWeek, app.js etc).

### A-3. Mode selection UI before draft
Dark theme. Two radio options: normal (subsidy until orgPop 40) / hard (no subsidy, all self-earned). Start button.

### A-4. Subsidy badge (ui-render.js)
Hard mode: dispSubsidy hidden automatically (subsidy=0). Verify only.

### A-5. Subsidy cutoff notification (engine.js)
Add `G.difficultyMode === 'normal'` condition to orgPop 40 cutoff message.

### A-6. Mode indicator
Small badge in header or finance report. Optional.

### A-7. Save compatibility
Missing difficultyMode = 'normal'.

### A: no changes to
SUBSIDY_TABLE, SPONSOR_TABLE, BROADCAST_TABLE, initial funds 5000, salary, venues, show income.

---

## B. low-OV MQ guard

### overview
Low-level fighters have structurally low MQ ceilings (avgOV 25 = ceiling 35) but penalty thresholds are fixed (Heat: MQ<40, Main MQ: MQ<45 etc). Early-game fighters get penalized even for matches that are perfect within their ability range.

Apply the same threshold-shift pattern already proven in getMQAdjust(orgPop), but based on avgOV, to Heat, main event MQ penalty, and locker room morale.

### B-1. New function getOVMQAdjust(avgOV)
Add to Engine.util.

```js
getOVMQAdjust(avgOV) {
  if (avgOV < 30) return { shift: -15, mult: 0.3 };
  if (avgOV < 40) return { shift: -10, mult: 0.5 };
  if (avgOV < 50) return { shift: -5,  mult: 0.7 };
  return { shift: 0, mult: 1.0 };
}
```

| avgOV | shift | mult | example |
|-------|-------|------|---------|
| < 30  | -15   | 0.3  | Main MQ threshold 45->30, Heat 40->25 |
| < 40  | -10   | 0.5  | Main MQ threshold 45->35, Heat 40->30 |
| < 50  | -5    | 0.7  | Main MQ threshold 45->40, Heat 40->35 |
| 50+   | 0     | 1.0  | unchanged |

### B-2. Apply: Heat (engine.js heat.calcUpdate)

Current:
```js
calcUpdate(G, avgMQ) {
  let delta = avgMQ >= 75 ? 2 : avgMQ >= 60 ? 1 : avgMQ >= 40 ? 0 : avgMQ >= 25 ? -1 : -2;
```

Change:
```js
calcUpdate(G, avgMQ, avgOV) {
  const adj = Engine.util.getOVMQAdjust(avgOV || 50);
  let delta = avgMQ >= (75 + adj.shift) ? 2
            : avgMQ >= (60 + adj.shift) ? 1
            : avgMQ >= (40 + adj.shift) ? 0
            : avgMQ >= (25 + adj.shift) ? -1 : -2;
  if (delta < 0) delta *= adj.mult;
```

Pass avgOV from call site (average of each match's (ov(charL)+ov(charR))/2).

### B-3. Apply: Main event MQ penalty (engine.js popularity.checkMainEventPenalty)

Current:
```js
checkMainEventPenalty(mq) {
  if (mq < 25) return -5;
  if (mq < 35) return -3;
  if (mq < 45) return -1;
  return 0;
},
```

Change:
```js
checkMainEventPenalty(mq, avgOV) {
  const adj = Engine.util.getOVMQAdjust(avgOV || 50);
  let penalty = 0;
  if      (mq < (25 + adj.shift)) penalty = -5;
  else if (mq < (35 + adj.shift)) penalty = -3;
  else if (mq < (45 + adj.shift)) penalty = -1;
  return Math.round(penalty * adj.mult);
},
```

Pass avgOV from applyMQPopularity (charL/charR available in match result).

### B-4. Apply: Locker room morale (engine.js trust.updateLockerRoomMorale)

Current:
```js
if (avgMQ >= 65) delta += 3;
```

Change:
```js
const rosterAvgOV = /* roster average OV */;
const adj = Engine.util.getOVMQAdjust(rosterAvgOV || 50);
if (avgMQ >= (65 + adj.shift)) delta += 3;
```

### B-5. Passing avgOV
Battle results contain charL/charR. Call sites compute avgOV. For show-wide avgOV, average each match pair.

### B: no changes to
MQ ceiling formula, orgPop getMQAdjust(), drama/pacing/finish deductions, individual pop base gain (MQ 30/50/70 tiers).

---

## C. Date display: season format

### overview
Current "1年目 4月 第1週" causes confusion: months 1-3 appear at year-end but look like year-start. Replace calendar months with season + week-in-season.

### current format
```
1年目 4月 第1週 ... 1年目 3月 第4週
```

### new format
```
1年目 🌸 春 第1週 ... 🌸 春 第12週 ... ☀️ 夏 第1週 ... ❄️ 冬 第12週
```

4 seasons x 12 weeks = 48 weeks/year. Same as current structure.

### C-1. engine.js util changes

```js
// ADD:
getWeekInQuarter(w) { return ((w - 1) % 12) + 1; },
getQuarterLabel(w) { return QUARTER_LABELS[this.getQuarter(w)] || '🌸 春'; },

// CHANGE formatDate:
formatDate(s, w) { return `${s}年目 ${this.getQuarterLabel(w)} 第${this.getWeekInQuarter(w)}週`; },
```

### C-2. Auto-propagation
All formatDate() call sites update automatically:
- ui-render.js: header date, week title, transfer/rivalry/summit labels, save slots, survival clear
- app.js: CONTINUE button

### C-3. Manual fixes needed
Grep for display-purpose usage of getMonth(), weekInMonth, hardcoded month/week patterns. Convert to getQuarterLabel() + getWeekInQuarter().

Known: ui-render.js has a direct month+weekInMonth display. Convert to season format.

### C-4. Off-season
Keep as-is: "オフシーズン 1/4"

### C-5: no changes to
getQuarter(), getMonth(), getWeekInMonth() (keep for internal logic), QUARTER_LABELS (reused), season/quarter week counts.

---

## Design rationale

### A. Difficulty
Normal: ~3,000 cumulative subsidy, min balance ~2,700 (safe).
Hard: 0 subsidy, min balance ~508 (one bad show from crisis).

### B. Low-OV guard (avgOV 25, ceiling 35)

| System | Current | Guarded | Effect |
|--------|---------|---------|--------|
| Heat -1 | MQ<40 | MQ<25 | typical MQ 19: -1 x 0.3 = -0.3 |
| Heat -2 | MQ<25 | MQ<10 | almost never |
| Main -1 | MQ<45 | MQ<30 | decent match exempt |
| Main -3 | MQ<35 | MQ<20 | typical MQ 19: barely exempt |
| Morale +3 | avgMQ 65+ | avgMQ 50+ | near-ceiling match boosts morale |

OV 50+ = shift 0, mult 1.0 = completely unchanged.

### C. Date format
Eliminates month 1-3 confusion. Season labels map naturally to April-start year. QUARTER_LABELS already defined in data.js. Week 1-12 per season gives clear progress without ambiguous calendar months.
