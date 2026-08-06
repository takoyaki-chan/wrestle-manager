# Wrestle-Manager Codex Working Agreement

## Workspace ownership

- `C:\Users\nkmrk\Downloads\wrestle-manager` is Claude's shared integration
  workspace. Codex treats it as read-only, except when the user explicitly
  requests one-time workspace administration.
- Codex file-changing tasks must run in
  `C:\Users\nkmrk\Downloads\wrestle-manager-codex` on branch
  `codex/agent-workspace`.
- If the current directory is not the Codex workspace, stop before editing and
  tell the user which workspace is required. Do not leave a Codex scratch diff
  in Claude's workspace.

## Task closure and Git safety

For every task that changes tracked or newly-created project files, choose one
status before sending the final answer. Do not describe a task as complete unless
it meets the rules for `COMPLETE`.

### COMPLETE

- The requested scope and acceptance criteria are implemented.
- Relevant verification has passed.
- The task's changes are committed in a scoped Git commit.
- `git status --short` is empty.
- The final answer contains: status, verification, commit hash, and remaining
  work (`none` when applicable).

### PENDING REVIEW

- A user decision, review, or external input is needed before the task can be
  complete.
- Never leave edited files uncommitted in the primary workspace. Preserve the
  work in a dedicated branch or worktree with a `WIP:` commit whose message
  states the next required decision.
- State clearly that the task is not complete and list the exact next action.

### BLOCKED

- State the blocker and do not call the task complete.
- Preserve any work that must survive in a dedicated branch or worktree as a
  `WIP:` commit; otherwise leave no file changes behind.

### Default Git policy

- For a normal, bounded implementation task, the default is: verify, commit the
  task's files only, and do not push unless the user asks.
- For large, exploratory, or multi-session work, begin in a dedicated branch or
  worktree. Do not use `main` as an uncommitted scratchpad.
- Before committing, inspect the file list and protect unrelated user changes.
- Before declaring `COMPLETE`, run `npm run task:closeout` after the commit.
- A release package must only be created from a clean working tree. The release
  script enforces this and has no bypass.

## Final-answer format for file-changing tasks

Use this compact structure:

```text
Status: COMPLETE / PENDING REVIEW / BLOCKED
Verification: <commands and result>
Git: <commit hash and push state, or WIP commit>
Remaining: none / <exact next action>
```

## UI and audio checks

- Prefer static checks and headless tests during ordinary work.
- Run interactive visual or audio checks only when UI flow, layout, or sound is
  changed; immediately before a release; or when a reported bug cannot be
  reproduced otherwise.
- Announce an interactive check before starting it. Keep automated checks silent
  and do not start background audio as part of routine audits.
