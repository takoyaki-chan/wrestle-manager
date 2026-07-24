# test/ — how this suite works, and how to not let it rot

## Running

```bash
npm test            # node test/run-all.js        — full suite (85 tests, ~85s)
npm run test:quick   # node test/run-all.js --quick — fast subset (~80 tests, <15s)
npm run test:stale    # node test/stale-lint.js     — staleness report (never fails the build)
npm run test:engine   # node test/auto-sim.js 20    — engine-integrity check, 20 seasons
```

`node test/run-all.js` also accepts:
- `--engine` — after the suite, also runs `test/auto-sim.js 20` and folds its ALL CLEAR /
  violation count into the summary.
- a bare filename substring, e.g. `node test/run-all.js spring-tag`, to run only matching
  tests. Combine with `--quick`.

## What counts as a test

- `test/*-test.js` — pass/fail assertion tests. Exit 0 = pass, anything else = fail.
  `run-all.js` discovers these automatically (glob `*-test.js`, excluding itself and
  `helpers/`). If you add a new test, name it `whatever-test.js` and it's picked up with
  no further wiring.
- Everything else in `test/` (`_*.js`, `diag-*`, `probe-*`, `scan-*`, `*-analysis.js`,
  `*-measure*.js`, `*-projection.js`, `*-search.js`, `make-save.js`, one-off `.json`
  fixtures, etc.) is a measurement/analysis tool, not a test. It doesn't assert pass/fail
  and `run-all.js` does not run it.
- **Known exception, do not "fix" it into a test**: `decay-longevity-test.js` is actually
  a long-running profiler (5 seeds × 30 seasons, no assert/throw anywhere) that happens to
  be named `*-test.js`. It legitimately takes 2+ minutes and times out under `run-all.js`'s
  default 120s budget. It is excluded from the `--quick` subset. If it needs to run
  routinely, invoke it directly with smaller args: `node test/decay-longevity-test.js 10`.
- The engine-integrity crown jewel is `test/auto-sim.js` (`node test/auto-sim.js <seasons> [seed]`).
  It's not part of the `*-test.js` glob and is only pulled in via `--engine` or `npm run test:engine`.

## The rule that keeps this suite from rotting

**This suite's entire recurring failure mode has been: a test reads a source file as raw
text and asserts `sourceText.includes('some literal that used to be in the code')`.**
Correct refactors, renames, version bumps, and even CRLF vs LF line endings then break the
test for a reason that has nothing to do with a real bug. Four tests were broken exactly
this way before this runner existed; `test/stale-lint.js` exists to catch the next ones
before they cost someone a debugging session.

Follow these rules for every new or edited test:

1. **Prefer executing real engine functions and asserting on their RESULTS over matching
   source text.** Many tests in this suite already do this well — e.g.
   `junior-tournament-watch-fix-test.js` extracts real function bodies from `app.js` via
   `new Function(...)` and runs them with a mock `App`/`Engine`, then asserts on the
   returned/mutated values. That survives refactors that source-text matching cannot.
2. **When you genuinely must check source text** (verifying a CSS class exists, a function
   was renamed away, a specific line was removed), always read the file through
   `test/helpers/source.js`'s `readSource(...)` — never a raw `fs.readFileSync`. It
   normalizes CRLF→LF so a `\n`-containing literal in your assertion matches regardless of
   the working tree's line endings (this repo's working tree is CRLF on Windows via
   `core.autocrlf`).
3. **Never hardcode a version number.** Use `manifestVersion()` from
   `test/helpers/source.js`, which reads the single source of truth,
   `release/manifest.json`'s `"version"` field. A hardcoded `'1.20'` is exactly what broke
   `version-consistency-test.js` after the real version moved to `1.21`.
4. **Keep mock `Engine`/`App` objects shape-correct with the real one.** When a test stubs
   out `Engine` (or part of it) to run an extracted function body, and the real code adds a
   new call like `Engine.mq.finalize(...)`, the mock needs a matching stub with a
   contract-correct return shape — inspect the real function in `src/management.js` (or
   wherever it lives) and mirror its return value's shape, not just enough to silence the
   `TypeError`. This is what fixed `junior-tournament-watch-fix-test.js`: it was missing
   `Engine.mq.finalize`, and the fix mirrors the real `finalize`'s `{ mq, mqInventory,
   externalMQBonus, trustMQPenalty, consumedNextMatchMqBuff, lastRunFighterId }` shape.

## `test/stale-lint.js`

Run it any time (`npm run test:stale`); it's a report, not a gate, and always exits 0
unless you pass `--strict`. It statically scans every `test/*-test.js` file for the
`sourceVar.includes('literal')` idiom, resolves which source file `sourceVar` was read
from, and flags any literal that's no longer found in that file. It intentionally skips (and
counts, doesn't hide) two things it can't verify safely:
- **negated assertions** (`!sourceVar.includes('dead code marker')`) — these pass when the
  literal is *absent*, so "not found" there is success, not staleness;
- **interpolated/concatenated literals** (backticks with `${...}`, string concatenation) —
  not statically resolvable.

If it reports something, that test's assertion is checking for text that no longer exists
in the named source file — go look at whether the code moved/renamed (fix the test) or the
feature actually regressed (fix the code).

## Adding a new test

Name it `something-test.js`, write it so it exits non-zero (throw, or a failed `assert`)
on failure and exits 0 (falls off the end, or an explicit `console.log('...: ok')`) on
success. `run-all.js` and `stale-lint.js` both pick it up automatically — no registration
needed. If it's a measurement/profiling script instead, do NOT name it `*-test.js`; use one
of the existing conventions (`*-analysis.js`, `probe-*`, `diag-*`, etc.) so it isn't
mistaken for a gate.
