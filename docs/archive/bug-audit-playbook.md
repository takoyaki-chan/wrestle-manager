# Bug Audit Playbook

## Purpose

This project tends to break at state boundaries rather than inside isolated UI code.
Use this memo as the default map for future bug hunts.

## Five Pillars

1. Week progression
Check code that advances weeks, closes shows, resolves PPV, or skips phases.
Look for:
- multiple paths updating the same seasonal counters differently
- transitions that reset `showCard`, `weekPhase`, or transient popup state
- logic that runs in regular weeks but not in PPV or offseason weeks

2. Season transition
Check code that enters or exits offseason and archives seasonal data.
Look for:
- `seasonHistory`, `seasonStats`, `fundsHistory`, `orgPopHistory`
- counters reset in one path but not another
- old-season values copied forward by mistake

3. Join / leave / transfer / rental
Check all roster movement and roster-cap flows.
Look for:
- one source roster updated without the destination roster
- stale references in `showCard`, `coachAssign`, titles, or relationships
- contract duration, rental duration, and displayed duration using different units

4. Save / load / migration
Check anything that serializes or reconstructs state.
Look for:
- backward-compat migrations that preserve old field names
- transient fields accidentally persisted
- old numeric conventions surviving after a system redesign

5. UI consistency
Check whether display text matches internal state and timing.
Look for:
- `1 period = 12 weeks` style wording that differs from the actual counters
- same concept calculated differently in `engine.js`, `app.js`, `ui-render.js`, and `ui-common.js`
- summary screens reading stale or partial state

## Hotspot Themes

### Absolute week math

This codebase has used more than one absolute-week convention.
Always verify whether a feature assumes:
- `48 weeks per season`
- `52 weeks per season`
- `12 weeks per period`
- offseason weeks included or excluded

Before changing week-based logic, search for all related counters and normalize them together.

### Multi-path state updates

The same stat often updates in multiple flows:
- regular weekly advance
- normal show close
- PPV show close
- PPV TV close
- offseason week advance

If a bug appears in only one route, compare sibling routes before patching.

### UI wording vs internal units

If a system has selectable durations, prices, cooldowns, or timers:
- verify the storage unit
- verify the decrement point
- verify the display formula

These three often drift apart.

## Default Audit Workflow

1. Run `cmd /c npm run bug:audit` for diff-based inspection.
2. Read the generated report in `docs/archive/`.
3. For each hit, compare all sibling execution paths before fixing.
4. If the bug touches week math, inspect both in-season and offseason behavior.
5. If the bug touches persistence, inspect `serialize`, `deserialize`, and migrations in the same pass.

## Full Audit Workflow

Run `cmd /c npm run bug:audit:full` when:
- a large refactor landed
- state conventions changed
- weekly automation found repeated risky patterns

Use full audit results to refresh this memo when a new failure pattern appears.
