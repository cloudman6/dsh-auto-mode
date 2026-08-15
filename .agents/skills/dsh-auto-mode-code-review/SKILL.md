---
name: dsh-auto-mode-code-review
description: Review one bounded DSH Auto Mode implementation stage against the accepted product invariants, the pinned DeepSeek Harness contracts, and current official DSH engineering standards. Use after focused verification and before committing any independently testable code, test, build, configuration, persistence, routing, recovery, delegation, or DSH-integration increment; also use before merge, when reviewing a PR, or when a DSH compatibility target changes.
---

# Review DSH Auto Mode code

Review raw artifacts, not the author's explanation. Treat this as a quality gate: report defects and evidence, do not edit the implementation while wearing the reviewer role. A blocked stage returns to implementation, then receives a new review.

## Establish the review boundary

1. Resolve the repository root, exact base, exact head, current branch, worktree status, and changed paths. Verify remote refs before reviewing a published or merge-bound branch.
2. Require one bounded stage: one acceptance outcome whose changes are independently testable and revertible. If the diff combines independent contracts, unrelated cleanup, or multiple rollback units, return `BLOCKED — split scope` before detailed review.
3. Prefer the staged diff before commit. Otherwise review an explicit `<base>...<head>` range. Never infer the boundary from chat chronology.
4. Record generated, untracked, and pre-existing files separately. Exclude unrelated user work; do not silently absorb it into the review.

## Load authority

Read project authority before judging the diff:

- `AGENTS.md`, `PROJECT_STATUS.md`, `docs/spec.md`, and the relevant accepted ADRs.
- The owning topic document: routing, recovery, delegation, RouterBench, architecture, roadmap, or DSH integration.
- [`references/official-dsh-review-sources.md`](references/official-dsh-review-sources.md), then every source it marks required for the changed surface.

Resolve the tested DSH revision from `docs/dsh-integration.md`. Review compatibility against that exact revision. Separately check the current official default branch for engineering-standard drift; report drift, but never silently change the product's compatibility target.

## Inspect contracts before code style

Trace each changed behavior from producer to final consumer and failure path. Review these axes in order:

1. **Scope and ownership:** map every abstraction and public choice to a current requirement and owner. Reject speculative generality and Auto Mode semantics leaking into product-neutral DSH seams.
2. **Product invariants:** preserve Host-owned routing, evidence-governed admission, fail-closed abstention, frozen route snapshots, bounded parent authority, formal recovery events, and the prohibition on unsupported recovery claims.
3. **Interface correctness:** inspect both sides of every event, service, schema, configuration, durable record, and public type. Verify defaults, errors, cancellation, scoping, immutability, versioning, and consumer behavior.
4. **Lifecycle and concurrency:** verify registration disposal, publication only after success, cancellation across every await, callback containment, no re-entry corruption, and quiescent teardown. Load the official defensive-pattern source for any async lifecycle change.
5. **Persistence and reconstruction:** distinguish required from ignorable state; verify append-time and cold-read behavior, exact identity/version semantics, retry after late registration where promised, and reconstruction from persisted facts rather than process memory.
6. **Security and privacy:** inspect every untrusted parser, model/tool payload, filesystem or subprocess operation, secret boundary, external side effect, and diagnostic. Reject raw Git rollback, ambient-secret exposure, predictable temporary paths, and claims that exceed declared capability.
7. **DSH plugin mechanics:** verify Cordis effects and disposers, Service Definition/Provider/Consumer ownership, Loader exports, scoped event semantics, model-visible-to-logged equivalence, and prompt/request snapshot identity where applicable.
8. **Tests and evidence:** require a regression-sensitive negative control, focused unit/contract coverage, real composition or snapshot coverage for visible behavior, and external-state assertions rather than agent self-report. Do not accept coverage percentage as scenario evidence.
9. **Documentation:** require matching JSDoc, package or project references, Agent Notes/ADRs for durable decisions, generated catalogs, and semantically equivalent English/Chinese documents. A pairing hash is not translation review.

Do not spend findings on formatting already enforced by a green gate unless the formatting hides a semantic defect.

## Require independent review where risk is high

For a boundary that changes routing authority, a DSH extension point, durable Session data, recovery, security, provider identity, or parent/child authority, require a fresh-context independent reviewer when an agent-review facility is available. Give that reviewer only:

- this skill;
- the exact base/head or staged diff;
- repository authority files and test output;
- no intended verdict, suspected defect, or implementation narrative.

Reconcile independent findings against source and code. Agreement is not proof; disagreement requires evidence-based resolution. If an independent reviewer is unavailable, record that limitation as residual risk rather than pretending independence.

## Verify proportionally

Confirm the author ran checks required by the changed surface. Run additional focused checks only when review invalidates earlier evidence or exposes an untested path. Do not rerun a passing full suite merely because commit or push follows.

At minimum, require:

- whitespace and conflict-marker checks;
- focused tests for each changed behavior and failure path;
- typecheck/lint for code or public types;
- documentation/link/translation validation for prose or catalogs;
- real-entry or snapshot evidence for model-, protocol-, or user-visible behavior;
- exact DSH contract probes when compatibility is claimed.

## Report the verdict

Lead with findings, ordered by severity:

- `P0`: data loss, security failure, or broadly destructive behavior;
- `P1`: required behavior is wrong, bypassable, unrecoverable, or incompatible;
- `P2`: meaningful correctness, lifecycle, test, or maintenance defect with bounded impact;
- `P3`: non-blocking improvement supported by concrete evidence.

For every finding state the file and tight line range, violated obligation, runtime or maintenance impact, and evidence. Omit speculative concerns and issues already guaranteed by a passing mechanical gate.

End with exactly one verdict:

- `PASS`: no P0-P2 finding, required evidence is present, and the stage is independently committable.
- `BLOCKED`: at least one P0-P2 finding, missing mandatory evidence, ambiguous scope, or unresolved authority conflict.

Then list sources/revisions consulted, checks observed or run, independent-review status, and residual risks. Never turn user approval, model self-report, or the absence of an observed failure into evidence that the route or implementation is correct.
