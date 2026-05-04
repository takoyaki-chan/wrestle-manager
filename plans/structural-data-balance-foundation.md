# Structural Data And Balance Foundation

## Implemented In This Branch

- Made the weekly faction hook safe when the Node balance harness has not loaded the faction module yet.
- Loaded the same runtime dependencies in simulation harnesses that the browser entrypoint already loads.
- Tightened high-bond relationship gains and weekly drift so strong bonds do not pin too easily at the top end.
- Added a shared Node game loader for the balance/simulation harnesses touched by this pass.
- Added package scripts for the short and long balance checks used during this pass.

## Current Smoke Baseline

- `npm run test:balance:relationships`
- `npm run test:balance:match`
- `npm run test:smoke:economy`
- `npm run test:smoke:growth`
- `npm run test:smoke:roster`
- `npm run test:long:economy`
- `npm run test:long:growth`
- `npm run test:long:roster`

Full regression sweep completed:

- 27/27 existing `test/*test*.js` files pass.
- Short simulation scripts pass.
- Long economy/growth/roster scripts complete without crashes.

Economy baseline after reverting the compatibility-risky balance adjustment:

- S1: funds 12701万, net 8727万, profit 70%.
- S2: funds 31899万, net 19447万, profit 67%.
- This intentionally restores the previous money-surplus behavior because the stricter economy pass made existing save data go into deficit.

## Remaining Structural Risks

- `src/data.js`, `src/management.js`, `src/app.js`, and `src/ui-render.js` are still very large global-script files.
- Save migrations and transient `_pending*` state are spread across the runtime instead of being centralized.
- Match validation still shows popularity can heavily swing big matches; this may be intentional, but needs a design decision.
- Economy is still structurally too generous, but any future fix should be save-compatible and probably gated behind a new difficulty/balance version instead of changing existing saves in place.
- The economy simulation harness still flags money surplus under auto-play, while hands-on play can become salary-constrained when the roster is upgraded aggressively.
- Several source comments and docs still contain mojibake, which makes future balancing slower and riskier.
- Long simulations should still be expanded before release.

## Recommended Next Phases

1. Extract balance constants into domain-specific config modules while keeping browser globals backward compatible.
2. Add one shared Node harness loader so simulation tests cannot silently omit browser dependencies again.
3. Centralize save migrations into numbered migration functions with a single applied-version field.
4. Add a save/balance-version switch so economy changes can apply only to new games or opt-in difficulty modes.
5. Define intended target ranges for economy, relationship drift, roster supply, and popularity impact.
6. Run multi-seed long simulations after each balance pass and store the summary snapshots.
