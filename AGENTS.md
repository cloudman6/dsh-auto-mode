# DSH Auto Mode — Agent context

[简体中文](AGENTS.zh-CN.md)

> Start every new agent session here. Read this file first, then load only the documents required by the current task.

## Project in one sentence

DSH Auto Mode gives individual power users of coding agents an adaptive Auto mode for DeepSeek Harness. It selects models and reasoning effort from task context, execution evidence, and user constraints; admits a configured baseline only after an absolute quality gate; optimizes latency before cost among admitted routes; and limits damage when routing is wrong.

## Project snapshot

| Item | Current state |
|---|---|
| Stage | Phase 0 critical-path execution; A1/A2 are implemented and pinned on the maintainer DSH fork |
| Existing work | Accepted product specification, architecture, routing, recovery, delegation, RouterBench, DSH integration evidence, roadmap, open questions, and 7 Accepted ADRs |
| Primary user | Individual power users of coding agents |
| Primary success metric | Real active users who continue using Auto |
| Optimization order | Absolute baseline quality gate + candidate non-inferiority → end-to-end latency → total cost |
| Canonical specification | `docs/spec.md` |
| Current progress | `PROJECT_STATUS.md` |
| Next-stage gate | Minimal Phase A admission evidence, preview-specific A3p identity evidence, and A5p carrier verification |

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
- Verified DSH extension points and upstream gaps: `docs/dsh-integration.md`.
- Historical multi-view review evidence: `docs/reviews/2026-08-14-multi-view-design-review.md`.
- Terms: `docs/glossary.md`.
- Documentation language and translation synchronization: `docs/localization.md`.
- Rationale for a high-cost decision: the corresponding file in `docs/decisions/`.

## Current-stage constraints

The maintainer accepted the specification and ADR-001 through ADR-007 on 2026-08-15. Phase 0 critical-path implementation may proceed under these constraints:

- Treat the accepted specification and ADRs as binding until a superseding decision is explicitly accepted.
- Keep the implemented A1 and A2 contracts product-neutral and pinned to the verified fork commit; DSH Core must not learn Auto Mode route tiers, Task Assessment, or Policy Pack semantics.
- Keep the Phase 0C preview fork-pinned and limited to one routing decision per Session.
- Do not claim official DSH compatibility, route admission, or a usable preview until the corresponding roadmap evidence gates pass.

## Bounded-stage code review gate

A bounded implementation stage has one acceptance outcome and is independently testable and revertible. After its focused verification passes and before committing, invoke [the project Code Review Skill](.agents/skills/dsh-auto-mode-code-review/SKILL.md). A `BLOCKED` verdict, any P0-P2 finding, missing mandatory evidence, or ambiguous scope prevents commit; fix the stage and run a fresh review. Changes to routing authority, DSH extension points, durable Session data, recovery, security, deployment identity, or parent/child authority also require the skill's fresh-context independent review when that facility is available.

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

1. Quality comes first: a route is eligible only after its baseline passes an absolute quality gate and the candidate satisfies a predeclared non-inferiority bound; optimize end-to-end latency before total cost.
2. Do not treat user choices, parent-agent overrides, or model self-reports as correct routing labels.
3. Host Routing Policy owns normal routing decisions; models may provide task intent or optional semantic assessment only.
4. High-risk, out-of-distribution, or weak-evidence tasks must `abstain`; if no currently admitted safe configuration exists, return `no-safe-route` and do not call a model.
5. Every automatic decision must be explainable and auditable; the effective provider/model/reasoning selection, request encoding, and rationale must be reconstructable from persisted facts. Recovery may be claimed only for explicitly declared and tested effect classes.
6. Within one unresolved episode, the route floor may only stay fixed or rise. Down-routing after a phase change is an evidence-gated capability, not an unconditional product promise.
7. Parent-agent constraints are proposals. Only Host-recognized requirements or explicitly user-authorized overrides become binding; a parent may not silently raise, lower, or bypass Routing Policy with an arbitrary provider/model.
8. Recovery Supervisor operates on formal events and does not require a self-reporting prompt protocol on every turn.
9. Never implement workspace recovery with raw Git rollback. Session checkpoints and workspace checkpoints have separate semantics and owners.
10. Route capability evaluation and production-policy scenario evaluation are separate datasets and runners; where policy is exercised, RouterBench and online execution use the same policy core. End-to-end metrics include assessor, switching, retry, and recovery costs.
11. Ordinary users choose only between `Auto` and manual provider/model/reasoning selection. Maintainer-owned versioned Policy Packs carry defaults, calibration, expiry, and revocation; advanced overrides are optional.
12. A route for one model step must be frozen before provider-dependent prompt and tool assembly, then applied unchanged at `agent/request`.

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
| Verified DSH extension points, blockers, and upstream seams | `docs/dsh-integration.md` |
| Phase dependencies, phase acceptance, explicit non-goals | `docs/roadmap.md` |
| Unresolved questions | `docs/open-questions.md` |
| Documentation language and synchronization | `docs/localization.md` |
| High-cost decisions whose alternatives and consequences must survive | `docs/decisions/*.md` |
| Navigation and project entry points | `README.md`, `docs/README.md` |
| Agent-wide rules, task start, and completion discipline | `AGENTS.md` |
| Bounded-stage code review procedure and verdict | `.agents/skills/dsh-auto-mode-code-review/SKILL.md` |

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
2. Initialize portable local paths, then treat `$main_worktree` as the main worktree. `DSH_AUTO_MODE_ROOT` and `CODEX_TOOLS_DIR` are optional overrides for non-default installations:
   ```bash
   main_worktree="${DSH_AUTO_MODE_ROOT:-$HOME/dsh-auto-mode}"
   codex_tools_dir="${CODEX_TOOLS_DIR:-$HOME/.codex/bin}"
   cd "$main_worktree"
   git status --short --branch
   sh "$codex_tools_dir/codex-git-read" branch-current
   ```
3. Before modifying files, the main worktree must be clean `main`. If it is not, stop and report; never carry existing changes into a new task.
4. Compare local and remote `main` read-only. If the remote is unreachable, SHAs differ, or the default branch is unexpected, stop and request synchronization authorization:
   ```bash
   git rev-parse main
   git ls-remote --symref origin HEAD
   git ls-remote origin refs/heads/main
   ```
5. Every file-changing task starts from verified `main` in an independent `codex/<task-slug>` branch and worktree. Creation through the restricted `codex-worktree add` wrapper is standing-authorized by the maintainer; execute it without asking again. If the environment already provides a task worktree, do not create a nested worktree.
6. Classify the task: specification/documentation, DSH extension-point research, RouterBench, plugin implementation, recovery, delegation adaptation, or release.
7. Inspect the repository and DSH before asking the user. Do not ask for facts already available in code, documents, or recorded decisions.
8. Classify every new conclusion as confirmed specification, Proposed decision, evidence, open question, or current status, and update its authoritative file.
9. Check whether the work affects a product invariant or any item under “When to stop and ask.”

## Worktree workflow

`.worktrees/` is the ignored in-repository container for task worktrees. Use relative paths and the restricted wrapper; do not call raw `git worktree add/remove` or broad `git switch` commands.

Create a task worktree from the main worktree. If the current shell has not initialized the portable variables from the task-start checklist, initialize them first:

```bash
main_worktree="${DSH_AUTO_MODE_ROOT:-$HOME/dsh-auto-mode}"
codex_tools_dir="${CODEX_TOOLS_DIR:-$HOME/.codex/bin}"
cd "$main_worktree"
sh "$codex_tools_dir/codex-worktree" add \
  -b codex/<task-slug> \
  .worktrees/<task-slug>/workspace \
  main
```

Run subsequent commands and edits in:

```text
$main_worktree/.worktrees/<task-slug>/workspace
```

Rules:

- Creating the required `codex/<task-slug>` branch and worktree with the restricted wrapper is pre-authorized; do not request per-task confirmation.
- One worktree carries exactly one task; the branch name matches the task slug.
- Do not develop directly on `main` in the main worktree.
- Do not mix another task or pre-existing user changes into the task worktree.
- Do not create nested worktrees.
- Do not store long-lived, untracked deliverables in a worktree directory.
- Never remove a dirty worktree or bypass checks with force.

Use the controlled wrapper when a branch switch is required:

```bash
sh "$codex_tools_dir/codex-worktree" switch <branch>
```

After the task worktree is clean and its commit has been integrated with authorization:

```bash
cd "$main_worktree"
sh "$codex_tools_dir/codex-worktree" remove \
  .worktrees/<task-slug>/workspace
```

Deleting local task branches, pruning, or forcing any operation requires separate authorization. Never force-push `main`.

## Task-completion checklist

After every change:

1. Use the documentation maintenance discipline to determine which authoritative files need synchronization; explicitly make the determination even if none do.
2. Run validation proportional to the change. For a documentation-only change, the minimum is:
   ```bash
   git diff --check
   git diff --cached --check
   rg -n '^(<<<<<<<|=======|>>>>>>>)' .
   ```
3. When navigation changes, validate every local relative link. When terminology or public-type proposals change, inspect every reference.
4. Review the working diff with the restricted reader, and review the staged diff after staging:
   ```bash
   sh "$codex_tools_dir/codex-git-read" diff
   sh "$codex_tools_dir/codex-git-read" diff --staged
   ```
5. Stage only task files. Check for unrelated changes, temporary files, secrets, tokens, `.env`, private keys, and sensitive prompt content.
6. After validation succeeds, create an atomic commit without requesting per-task confirmation. Commit messages use English Conventional Commits. Do not commit when validation fails, the staged scope is ambiguous, or the staged diff contains unrelated or sensitive material. Confirm a clean task worktree and record its branch and commit SHA:
   ```bash
   git status --short --branch
   git rev-parse HEAD
   ```
7. Push the current task branch to `origin` after committing, without requesting per-task confirmation. Use a normal fast-forward push, never force-push. If the remote task branch has diverged or the push is rejected, stop and report instead of rewriting history:
   ```bash
   task_branch="$(git branch --show-current)"
   git ls-remote origin "refs/heads/$task_branch"
   git push -u origin HEAD
   git ls-remote origin "refs/heads/$task_branch"
   ```
8. Merge into `main` and push `main` only with explicit authorization. In the clean main worktree, re-check the remote SHA, use fast-forward only, and stop if the remote moved or `--ff-only` fails:
   ```bash
   cd "$main_worktree"
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge --ff-only codex/<task-slug>
   git push origin main
   ```
9. After pushing `main`, verify local and remote `main` SHAs match and the task commit is an ancestor. Do not claim publication before remote verification:
   ```bash
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge-base --is-ancestor <task-commit-sha> main
   ```
10. Remove the worktree only after it is clean, the commit has been integrated with authorization, and remote verification succeeds. Without merge authorization, preserve the worktree and report its exact path and state.

## When to stop and ask

Do not decide these items autonomously:

- Change the quality baseline, optimization order, primary user, or primary success metric.
- Change a `Proposed` ADR to `Accepted`, or reverse an accepted ADR.
- Add an external dependency, remote service, telemetry upload, account system, or release workflow.
- Change a DSH core extension point, Session persistence format, or upstream public API.
- Relax parent-agent authority, abstention criteria, episode release criteria, or recovery safety boundaries.
- Automatically create, restore, or delete a workspace checkpoint, or handle non-file external side effects.
- Delete or rename a public document, event, configuration, or user-facing interface.
- Merge into or push `main`, delete a branch/worktree, change remotes, amend or rewrite commits, rebase, reset, force-push, or otherwise rewrite published history without explicit authorization for the current task. A validated atomic commit and a normal push of the current task branch are standing-authorized by the maintainer.

## Current hard blocker

There is no implementation-level fault blocker. The remaining evidence gates and unresolved questions are maintained in `PROJECT_STATUS.md` and `docs/open-questions.md`; do not duplicate the full list here.

## Security boundaries

- Never commit secrets, tokens, `.env`, private keys, account data, or sensitive prompt content.
- Never use raw Git rollback to implement product workspace recovery.
- Do not allow a parent agent to bypass Routing Policy with an arbitrary provider/model by default.
- Any recovery instruction injected into model context must be persisted through a reconstructable channel.
- Do not write temporary artifacts into the project root; use an independent `$TMPDIR` subdirectory for each task.
