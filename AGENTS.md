# DSH Auto Mode — Agent context

[简体中文](AGENTS.zh-CN.md)

> Start every new agent session here. Read this file first, then load only the documents required by the current task.

## Project in one sentence

DSH Auto Mode gives individual power users of coding agents an adaptive Auto mode for DeepSeek Harness. It selects models and reasoning effort from task context, execution evidence, and user constraints; preserves a configured `strong` quality baseline; optimizes latency before cost; and limits damage when routing is wrong.

## Project snapshot

| Item | Current state |
|---|---|
| Stage | Specification review; implementation planning, task breakdown, and coding have not started |
| Existing work | Product specification, architecture, routing, recovery, delegation, RouterBench, roadmap, open questions, 4 Proposed ADRs, and 1 Accepted documentation-language ADR |
| Primary user | Individual power users of coding agents |
| Primary success metric | Real active users who continue using Auto |
| Optimization order | Fixed strong quality baseline → end-to-end latency → total cost |
| Canonical specification | `docs/spec.md` |
| Current progress | `PROJECT_STATUS.md` |
| Next-stage gate | User review of the specification and Proposed ADRs; planning starts only after approval |

This table contains only enough context to orient a session. `PROJECT_STATUS.md` is authoritative for progress, blockers, and next actions; do not maintain full status in both places.

## Required reading for a new session

Read in this order:

1. `PROJECT_STATUS.md`: progress, blockers, next action, and recent status changes.
2. `docs/spec.md`: product scope, assumptions, success criteria, and boundaries.
3. `docs/architecture.md`: capability boundaries, ownership, data flow, and DSH integration points.
4. `docs/roadmap.md`: dependency order, phase acceptance criteria, and explicit non-goals.
5. `docs/open-questions.md`: unresolved questions.
6. `docs/decisions/README.md`: ADR states and decision index.

Load topic documents only when relevant; do not load the entire repository indiscriminately:

- Route selection, down-routing, abstention, and within-turn switching: `docs/routing-policy.md`.
- Attempts, episodes, continue, salvage, and restart: `docs/recovery.md`.
- Parent- and child-agent authority: `docs/delegation.md`.
- Task suites, quality gates, and evaluation: `docs/routerbench.md`.
- Terms: `docs/glossary.md`.
- Documentation language and translation synchronization: `docs/localization.md`.
- Rationale for a high-cost decision: the corresponding file in `docs/decisions/`.

## Current-stage constraints

The project is in specification review. Until the user accepts the specification:

- Design documents may be revised, reviewed, and extended.
- Do not create product code, dependencies, build configuration, CI, or release workflows.
- Do not treat a `Proposed` ADR as an accepted implementation constraint.
- Do not convert roadmap phases directly into implementation tasks; specification review is the gate to planning.

## Language rules

| Context | Language |
|---|---|
| Discussion with the current maintainer | Chinese |
| Canonical public documents at default paths | English |
| Simplified Chinese translations | Root `*.zh-CN.md` files and `docs/zh-CN/` |
| Public Git metadata | English commit messages, branch names, issue/PR titles, and normative PR descriptions |
| Code identifiers, events, schemas, configuration keys, and comments | English |

English canonical documents and Chinese translations are governed by `docs/localization.md` and ADR-005. Do not create bilingual commit messages or two normative sources. When the languages conflict, fix the Chinese translation to match English.

## Product invariants

1. Quality comes first: each task category uses its configured `strong` route as the baseline; optimize end-to-end latency before total cost.
2. Do not treat user choices, parent-agent overrides, or model self-reports as correct routing labels.
3. Host Routing Policy owns normal routing decisions; models may provide task intent or optional semantic assessment only.
4. High-risk, out-of-distribution, or weak-evidence tasks must `abstain` and use the safe fallback.
5. Every automatic decision must be explainable, auditable, and recoverable; the effective provider/model/effort and rationale must be reconstructable from persisted facts.
6. Within one unresolved episode, the route floor may only stay fixed or rise. The same turn may be re-routed downward after a trusted phase boundary.
7. Parent agents may raise the quality floor or add semantic constraints by default; they may not bypass Routing Policy with an arbitrary provider/model.
8. Recovery Supervisor operates on formal events and does not require a self-reporting prompt protocol on every turn.
9. Never implement workspace recovery with raw Git rollback. Session checkpoints and workspace checkpoints have separate semantics and owners.
10. RouterBench and online execution use the same policy implementation. End-to-end metrics include assessor, switching, retry, and recovery costs.

## Authoritative document map

| Information | Authority |
|---|---|
| Current progress, blockers, next action, recent completion | `PROJECT_STATUS.md` |
| Product goals, scope, assumptions, success criteria, boundaries | `docs/spec.md` |
| Components, ownership, data flow, public capability boundaries | `docs/architecture.md` |
| Route semantics, precedence, down-routing, and switching | `docs/routing-policy.md` |
| Attempts, episodes, recovery actions, and checkpoints | `docs/recovery.md` |
| Child-agent delegation constraints and authority | `docs/delegation.md` |
| Benchmark tasks, metrics, evaluation, and route admission | `docs/routerbench.md` |
| Phase dependencies, phase acceptance, explicit non-goals | `docs/roadmap.md` |
| Unresolved questions | `docs/open-questions.md` |
| Documentation language and synchronization | `docs/localization.md` |
| High-cost decisions whose alternatives and consequences must survive | `docs/decisions/*.md` |
| Navigation and project entry points | `README.md`, `docs/README.md` |
| Agent-wide rules, task start, and completion discipline | `AGENTS.md` |

## Documentation maintenance discipline

Classify a design change before editing:

1. Confirmed product goal, scope, or acceptance criterion: update `docs/spec.md`.
2. High-cost decision awaiting review: create or update a `Proposed` ADR.
3. User-approved ADR: change it to `Accepted` only after explicit confirmation.
4. Component, ownership, data-flow, or public-boundary change: update `docs/architecture.md` and any relevant ADR.
5. Routing, recovery, delegation, or Benchmark behavior: update the corresponding topic document.
6. Implementation phase, phase acceptance, or explicit non-goal: update `docs/roadmap.md`.
7. New, closed, or changed unresolved question: update `docs/open-questions.md`.
8. Progress, blocker, or next-action change: update `PROJECT_STATUS.md`.
9. Navigation change: update `README.md` or `docs/README.md`.
10. Language or translation-workflow change: update `docs/localization.md` and ADR-005 or its successor.

Do not paste chat chronology, exploration order, or hidden reasoning into canonical documents. Main documents retain current actionable conclusions, complete constraints, evidence, status, and open questions.

Keep each design fact in one authoritative location. Other documents link to it rather than duplicating definitions. Never delete old ADRs; when a decision changes, create a new ADR and record the supersession relationship.

Every canonical English document has a corresponding Chinese locale file. Follow `docs/localization.md`: update both in the same maintainer-authored change, or explicitly mark the locale file `outdated`. Every Markdown file ends with exactly one newline.

## Task-start checklist

Before substantive work:

1. Read this file and the required new-session documents, then load relevant topic documents.
2. Treat `/Users/wanglei/dsh-auto-mode` as the main worktree. Confirm status and branch:
   ```bash
   git status --short --branch
   sh /Users/wanglei/.codex/bin/codex-git-read branch-current
   ```
3. Before modifying files, the main worktree must be clean `main`. If it is not, stop and report; never carry existing changes into a new task.
4. Compare local and remote `main` read-only. If the remote is unreachable, SHAs differ, or the default branch is unexpected, stop and request synchronization authorization:
   ```bash
   git rev-parse main
   git ls-remote --symref origin HEAD
   git ls-remote origin refs/heads/main
   ```
5. Every file-changing task starts from verified `main` in an independent `codex/<task-slug>` branch and worktree. If the environment already provides a task worktree, do not create a nested worktree.
6. Classify the task: specification/documentation, DSH extension-point research, RouterBench, plugin implementation, recovery, delegation adaptation, or release.
7. Inspect the repository and DSH before asking the user. Do not ask for facts already available in code, documents, or recorded decisions.
8. Classify every new conclusion as confirmed specification, Proposed decision, evidence, open question, or current status, and update its authoritative file.
9. Check whether the work affects a product invariant or any item under “When to stop and ask.”

## Worktree workflow

`.worktrees/` is the ignored in-repository container for task worktrees. Use relative paths and the restricted wrapper; do not call raw `git worktree add/remove` or broad `git switch` commands.

Create a task worktree from the main worktree:

```bash
cd /Users/wanglei/dsh-auto-mode
sh /Users/wanglei/.codex/bin/codex-worktree add \
  -b codex/<task-slug> \
  .worktrees/<task-slug>/workspace \
  main
```

Run subsequent commands and edits in:

```text
/Users/wanglei/dsh-auto-mode/.worktrees/<task-slug>/workspace
```

Rules:

- One worktree carries exactly one task; the branch name matches the task slug.
- Do not develop directly on `main` in the main worktree.
- Do not mix another task or pre-existing user changes into the task worktree.
- Do not create nested worktrees.
- Do not store long-lived, untracked deliverables in a worktree directory.
- Never remove a dirty worktree or bypass checks with force.

Use the controlled wrapper when a branch switch is required:

```bash
sh /Users/wanglei/.codex/bin/codex-worktree switch <branch>
```

After the task worktree is clean and its commit has been integrated with authorization:

```bash
cd /Users/wanglei/dsh-auto-mode
sh /Users/wanglei/.codex/bin/codex-worktree remove \
  .worktrees/<task-slug>/workspace
```

Deleting local task branches, pruning, or forcing any operation requires separate authorization. Never force-push `main`.

## Task-completion checklist

After every change:

1. Use the documentation maintenance discipline to determine which authoritative files need synchronization; explicitly make the determination even if none do.
2. Run validation proportional to the change. During specification review, the minimum is:
   ```bash
   git diff --check
   git diff --cached --check
   rg -n '^(<<<<<<<|=======|>>>>>>>)' .
   ```
3. When navigation changes, validate every local relative link. When terminology or public-type proposals change, inspect every reference.
4. Review the working diff with the restricted reader, and review the staged diff after staging:
   ```bash
   sh /Users/wanglei/.codex/bin/codex-git-read diff
   sh /Users/wanglei/.codex/bin/codex-git-read diff --staged
   ```
5. Stage only task files. Check for unrelated changes, temporary files, secrets, tokens, `.env`, private keys, and sensitive prompt content.
6. Create an atomic commit only with explicit authorization for this task. Commit messages use English Conventional Commits. Confirm a clean task worktree and record its branch and commit SHA:
   ```bash
   git status --short --branch
   git rev-parse HEAD
   ```
7. Merge and write remotely only with explicit authorization. In the clean main worktree, re-check the remote SHA, use fast-forward only, and stop if the remote moved or `--ff-only` fails:
   ```bash
   cd /Users/wanglei/dsh-auto-mode
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge --ff-only codex/<task-slug>
   git push origin main
   ```
8. After push, verify local and remote `main` SHAs match and the task commit is an ancestor. Do not claim publication before remote verification:
   ```bash
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge-base --is-ancestor <task-commit-sha> main
   ```
9. Remove the worktree only after it is clean, the commit has been integrated with authorization, and remote verification succeeds. Without commit, merge, or push authorization, preserve the worktree and report its exact path and state.

## When to stop and ask

Do not decide these items autonomously:

- Change the quality baseline, optimization order, primary user, or primary success metric.
- Change a `Proposed` ADR to `Accepted`, or reverse an accepted ADR.
- Move from specification review into implementation planning, task breakdown, or coding.
- Add an external dependency, remote service, telemetry upload, account system, or release workflow.
- Change a DSH core extension point, Session persistence format, or upstream public API.
- Relax parent-agent authority, abstention criteria, episode release criteria, or recovery safety boundaries.
- Automatically create, restore, or delete a workspace checkpoint, or handle non-file external side effects.
- Delete or rename a public document, event, configuration, or user-facing interface.
- Commit, merge, push, delete a branch/worktree, or otherwise modify Git refs or remotes without explicit authorization for the current task.

## Current hard blocker

There is no implementation-level fault blocker. The pre-implementation design gates and unresolved questions are maintained in `PROJECT_STATUS.md` and `docs/open-questions.md`; do not duplicate the full list here.

## Security boundaries

- Never commit secrets, tokens, `.env`, private keys, account data, or sensitive prompt content.
- Never use raw Git rollback to implement product workspace recovery.
- Do not allow a parent agent to bypass Routing Policy with an arbitrary provider/model by default.
- Any recovery instruction injected into model context must be persisted through a reconstructable channel.
- Do not write temporary artifacts into the project root; use an independent `$TMPDIR` subdirectory for each task.
