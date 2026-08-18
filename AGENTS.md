# DSH Auto Mode — Agent context

[简体中文](AGENTS.zh-CN.md)

> Start every new agent session here. Read this file first, then load only the documents required by the current task.

## Project in one sentence

DSH Auto Mode gives individual power users of coding agents an AA-informed Auto mode for DeepSeek Harness: a fixed semantic assessor describes the task, deterministic Host policy chooses Light, Standard, or Deep, and the resolver prefers lower AA price then lower AA latency among eligible routes in that level.

## Project snapshot

| Item | Current state |
|---|---|
| Stage | Phase 1 AA route catalog after the accepted Phase 0P MVP |
| Existing work | Runnable MVP on the A1/A2-pinned maintainer DSH fork, focused tests and real-provider evidence, plus accepted ADR-010 direction |
| Primary user | Individual power users of coding agents |
| Primary success metric | Real active users who continue using Auto |
| Optimization order | Required task-handling level → AA-reported price → AA-reported latency → stable route identity |
| Canonical specification | `docs/spec.md` |
| Current progress | `PROJECT_STATUS.md` |
| Next-stage gate | Phase 1A normalized model-key matching with fixture evidence |

This table contains only enough context to orient a session. `PROJECT_STATUS.md` is authoritative for progress, blockers, and next actions; do not maintain full status in both places.

## Required reading for a new session

While `PROJECT_STATUS.md` identifies Phase 1 as active, read only these files before implementation or review:

1. `PROJECT_STATUS.md`.
2. `docs/spec.md`.
3. `docs/routing-policy.md`.
4. `docs/roadmap.md` and the current task in `tasks/todo.md`.
5. `docs/phase-0p-fast-prototype.md` only when preserving or comparing MVP behavior.
6. The code and tests directly involved in the requested change.

Do not load the long-term specification, architecture, roadmap, recovery, admission, or open-question documents unless the maintainer explicitly asks to change that long-term design or the active prototype document links to a specific fact needed by the task. Findings from those deferred documents cannot enlarge the prototype boundary.

Outside that active scope lock, read in this order:

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
- Frozen Phase 0P exact-route identities and exclusions: `docs/evidence/phase-0p-route-inventory.md`.
- Historical multi-view review evidence: `docs/reviews/2026-08-14-multi-view-design-review.md`.
- Terms: `docs/glossary.md`.
- Documentation language and translation synchronization: `docs/localization.md`.
- Rationale for a high-cost decision: the corresponding file in `docs/decisions/`.

## Current-stage constraints

The maintainer accepted ADR-010 on 2026-08-18. Post-MVP implementation proceeds under these constraints:

- Treat the accepted specification and ADR-010 as binding. ADR-002, ADR-006, and ADR-008 are historical and superseded for post-MVP product behavior.
- Keep the implemented A1 and A2 contracts product-neutral and pinned to the verified fork commit; DSH Core must not learn Auto Mode route tiers, Task Assessment, or Policy Pack semantics.
- Use AA as the external source for capability, price, and latency conclusions; do not claim project-Benchmarked quality or universal optimality.
- Match AA and DSH by model family, semantic version, variant, and explicit effort. Ignore date/build revisions for equality, but never cross version, variant, or effort.
- Use `light`, `standard`, and `deep` internally and Light/Standard/Deep plus 轻量/常规/深度 in user-facing text. The completed MVP's old labels remain historical until migrated.
- Within one handling level, prefer lower AA-reported price, then lower AA-reported latency, then stable route identity. Do not add a local token-cost estimator.
- A fixed Task Assessor may return structured task attributes only; deterministic Host policy owns the level and concrete route decision.
- Treat ADR-009 as risk authorization, not capability evidence. Mutable Experimental Auto remains disabled until a separately accepted concrete provider design freezes every production tool entry and a versioned Host provider proves a clean isolated worktree, durable Attempt-scoped file attribution and containment, process and credential isolation, and `externalSideEffects: 'none'`; uncovered or unsupported entries fail closed.
- Keep the implementation fork-pinned and do not claim official DSH compatibility until the corresponding roadmap gate passes.

## Phase 0P fast-prototype scope lock

While `PROJECT_STATUS.md` names the fast prototype as the active stage, its only acceptance criteria are: select Auto; route different tasks to different model/effort pairs; keep the persisted selection equal to the effective request; and leave Manual unchanged. Apply these rules:

- Add work only when it directly implements, proves, or repairs one of those four criteria.
- Record production-grade concerns outside that boundary as deferred work. Do not turn them into prototype blockers or new normative contracts.
- Do not introduce rights approval, signatures, credential binding, revocation ledgers, Session-egress isolation, certificates/sidecars, dispatch-contract ADRs, or complex recovery state machines unless the maintainer explicitly changes the active scope.
- When the maintainer explicitly requests a review of this repository, evaluate the bounded prototype against this scope, the pinned A1/A2 behavior, ordinary correctness, and secret/destructive-action safety. A reviewer may report deferred production risk, but may not require out-of-scope production infrastructure for a prototype `PASS`.
- Any proposed scope expansion must name the acceptance criterion it serves. Without that direct link, stop the expansion and continue the current prototype.

## Explicit-only code review

Do not invoke [the DSH Code Review Skill](.agents/skills/dsh-auto-mode-code-review/SKILL.md) automatically for changes in either `dsh-auto-mode` or the maintained DeepSeek Harness fork. Invoke it only when the maintainer explicitly requests a code review for the current task. When explicitly requested, a `BLOCKED` verdict, any P0-P2 finding, missing mandatory evidence, or ambiguous scope prevents the reviewed commit; fix the stage and run a fresh review. Ordinary focused verification and the task-completion checks still apply when no review is requested.

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

1. Auto is AA-informed heuristic routing: choose the required task-handling level first, then prefer lower AA price and lower AA latency among Host-valid routes in that level. Do not claim Benchmark-proven quality, safety, non-inferiority, or universal optimality.
2. Do not treat user choices, parent-agent overrides, or model self-reports as correct routing labels.
3. Host Routing Policy owns normal routing decisions; models may provide task intent or optional semantic assessment only.
4. High-risk, unknown, low-confidence, or invalid Task Assessment selects `deep`. Missing AA matches may use only a configured Host-valid Deep fallback with an explicit fallback reason; otherwise return an explicit no-route failure.
5. Every automatic decision must be explainable and auditable; the effective provider/model/reasoning selection, request encoding, and rationale must be reconstructable from persisted facts. Recovery may be claimed only for explicitly declared and tested effect classes.
6. Within one unresolved episode, the route floor may only stay fixed or rise. Down-routing after a phase change is an evidence-gated capability, not an unconditional product promise.
7. Parent-agent constraints are proposals. Only Host-recognized requirements or explicitly user-authorized overrides become binding; a parent may not silently raise, lower, or bypass Routing Policy with an arbitrary provider/model.
8. Recovery Supervisor operates on formal events and does not require a self-reporting prompt protocol on every turn.
9. Never implement workspace recovery with raw Git rollback. Session checkpoints and workspace checkpoints have separate semantics and owners.
10. RouterBench is optional evaluation infrastructure, not a route-admission or release gate. Required correctness tests still cover normalization, catalog compilation, price ordering, assessor fallback, persistence, UI equality, and Manual non-interference.
11. Ordinary users choose only between `Auto` and manual provider/model/reasoning selection. Maintainer-owned versioned AA snapshots, normalizers, band policies, and fallbacks carry defaults; advanced restrictions are optional.
12. A route for one model step must be frozen before provider-dependent prompt and tool assembly, then applied unchanged at `agent/request`.
13. AA data supports heuristic routing only. It must not be presented as project Benchmark evidence, an exact deployment proof, or a task-specific quality guarantee.
14. Phase 0P mutable work is limited by ADR-009 to attributable uncommitted changes created by the current Attempt in a clean isolated worktree. The concrete provider design and complete production tool-entry inventory require separate acceptance; user approval does not prove Recovery Capability and never authorizes external effects or automatic rollback.

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
| Explicitly requested code review procedure and verdict | `.agents/skills/dsh-auto-mode-code-review/SKILL.md` |

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
6. Classify the task: specification/documentation, AA catalog, semantic assessment, plugin implementation, DSH extension-point research, optional evaluation, adaptive execution, recovery, delegation adaptation, or release.
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

After the task worktree is clean, its commit has been integrated into `main`, and step 9 has verified the remote `main`, remove it automatically:

```bash
cd "$main_worktree"
sh "$codex_tools_dir/codex-worktree" remove \
  .worktrees/<task-slug>/workspace
```

Automatic removal applies only to the current task's clean, integrated worktree. Never remove a dirty or unmerged worktree, and never use force. Deleting local task branches, pruning, or forcing any operation still requires separate authorization. Never force-push `main`.

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
8. After the task branch is pushed and its worktree is clean, merge it into `main` and push `main` without requesting per-task confirmation. In the clean main worktree, require local `main` to equal remote `main`, use fast-forward only, and stop if the remote is unreachable, either SHA changes during integration, or `--ff-only` fails. Never substitute a merge commit, rebase, reset, force-push, or history rewrite:
   ```bash
   task_branch="$(git branch --show-current)"
   task_commit="$(git rev-parse HEAD)"
   test "$(git ls-remote origin "refs/heads/$task_branch" | awk '{print $1}')" = "$task_commit"
   cd "$main_worktree"
   test "$(git branch --show-current)" = main
   local_main="$(git rev-parse main)"
   remote_main="$(git ls-remote origin refs/heads/main | awk '{print $1}')"
   test -n "$remote_main" && test "$local_main" = "$remote_main"
   test "$(git rev-parse main)" = "$local_main"
   git merge --ff-only "$task_branch"
   test "$(git rev-parse main)" = "$task_commit"
   test "$(git ls-remote origin refs/heads/main | awk '{print $1}')" = "$remote_main"
   git push origin main
   ```
9. After pushing `main`, verify local and remote `main` SHAs match and the task commit is an ancestor. Do not claim publication before remote verification:
   ```bash
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge-base --is-ancestor "$task_commit" main
   ```
10. After step 9 succeeds, automatically remove the clean, integrated task worktree through `codex-worktree remove`. If it is dirty, unmerged, missing, or removal fails, preserve it and report the exact path and reason; never use force. Do not delete the local task branch without separate authorization.

## When to stop and ask

Do not decide these items autonomously:

- Change the quality baseline, optimization order, primary user, or primary success metric.
- Change a `Proposed` ADR to `Accepted`, or reverse an accepted ADR.
- Add an external dependency, remote service, telemetry upload, account system, or release workflow.
- Change a DSH core extension point, Session persistence format, or upstream public API.
- Relax parent-agent authority, abstention criteria, episode release criteria, or recovery safety boundaries.
- Automatically create, restore, or delete a workspace checkpoint, or handle non-file external side effects.
- Delete or rename a public document, event, configuration, or user-facing interface.
- Delete a branch, delete a dirty or unmerged worktree, change remotes, amend or rewrite commits, rebase, reset, force-push, create a non-fast-forward merge, or otherwise rewrite published history without explicit authorization for the current task. A validated atomic commit, normal task-branch push, guarded fast-forward merge and push to `main`, and removal of the current clean integrated task worktree are standing-authorized by the maintainer.

## Current hard blocker

There is no implementation-level blocker to Phase 1A. Current field/boundary choices and later-phase questions are maintained in `PROJECT_STATUS.md` and `docs/open-questions.md`; do not duplicate the full list here.

## Security boundaries

- Never commit secrets, tokens, `.env`, private keys, account data, or sensitive prompt content.
- Never use raw Git rollback to implement product workspace recovery.
- Do not allow a parent agent to bypass Routing Policy with an arbitrary provider/model by default.
- Any recovery instruction injected into model context must be persisted through a reconstructable channel.
- Do not write temporary artifacts into the project root; use an independent `$TMPDIR` subdirectory for each task.
