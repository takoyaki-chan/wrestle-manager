# Care System Enhancement Spec v1.0

> Status: Design confirmed, awaiting implementation
> Created: 2026-03-03
> Dependencies: event-system-spec-v2.md / condition-system-spec-v1.0.md / growth-event-spec-v1.0.md
> Target files: data.js (CARE_ACTIONS) / engine.js (Engine.careActions) / ui-common.js (showCareActionModal) / app.js (executeCareAction)

---

## Design Philosophy

1. High-cost actions deserve satisfying feedback -- confirmation step + before/after display for cost >= 100
2. Relieve helplessness during slumps -- even small effects matter
3. Dialogue IS the reward -- the reaction from a struggling wrestler is the main payoff

---

## S1 Confirmation Step for Individual Actions

### S1.1 Scope

Individual actions with cost >= 100 (trainer / media / special_treatment + new refresh_leave).
Actions costing 50-80 (bonus / costume) keep current instant execution.

### S1.2 Confirmation Screen: renderIndividualConfirm

After selecting a fighter in renderFighterSelect, if cost >= 100, show confirmation screen before executing.

Contents:
- Fighter portrait (portraitImg, 88px) + name
- Effect description (cfg.desc)
- Cost + remaining funds change ("420 -> 260")
- [Execute] + [Back] buttons

Implementation:
- renderFighterSelect: cost >= 100 -> renderIndividualConfirm(actionId, cfg, fighterId)
- cost < 100: direct onConfirm as before
- Remaining funds color: green if healthy, red if below 200

---

## S2 Post-Execution Feedback Enhancement

### S2.1 Before/After Display

Extend Engine.careActions.execute return value with changes field:

```javascript
changes: [
  { label: 'trust', before: 67, after: 71 },
  { label: 'growth buff', text: '+30% (4 weeks)' },
]
```

Extend _showCareReaction to display changes below dialogue.

### S2.2 SE by Cost Tier

v1.0: All SE = coin. Differentiation via before/after display only.
- 0-80: Current (Toast + face dialogue)
- 100-160: coin + before/after changes
- 200+: before/after + effect summary stays in modal

### S2.3 _showCareReaction Signature Extension

```javascript
function _showCareReaction(fighter, text, changes = [], cost = 0, remainingFunds = 0)
```

---

## S3 New Care Actions: Slump/Motivation Loss Support

### S3.1 encourage

| Field | Value |
|-------|-------|
| id | encourage |
| label | Voice of support |
| emoji | speech balloon |
| cost | 0 |
| category | individual |
| condition | slump_or_motivation_loss |
| cooldown | 1 week per fighter |

Effects:
- recoveryMomentum +0.5 (trust >= 60: +0.7)
- trust +1 (trust >= 60: +2)

### S3.2 refresh_leave

| Field | Value |
|-------|-------|
| id | refresh_leave |
| label | Refresh leave |
| emoji | palm tree |
| cost | 100 |
| category | individual |
| condition | slump_or_motivation_loss |
| cooldown | 4 weeks per fighter |

Effects:
- recoveryMomentum +3.0
- condition +15
- trust +3
- schedule forced to rest

### S3.3-S3.6 See full spec file for dialogue tables and UI conditions

---

## S5 Implementation Checklist

### data.js
- [ ] Add encourage, refresh_leave to CARE_ACTIONS
- [ ] Add 6 keys to CARE_REACTION_DIALOGUES

### engine.js
- [ ] encourage branch in execute
- [ ] refresh_leave branch in execute
- [ ] reactionKey switching (state x trust)
- [ ] changes field in all action return values

### ui-common.js
- [ ] renderIndividualConfirm function
- [ ] renderFighterSelect branching (cost >= 100)
- [ ] Slump care section conditional display
- [ ] _showCareReaction signature extension + before/after DOM

### app.js
- [ ] _showCareReaction call args extension
- [ ] not_in_slump error message
