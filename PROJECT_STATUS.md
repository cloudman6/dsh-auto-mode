# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-22

## Current stage

Phase 0P MVP and Phases 1–4.2 are complete. The project now continues with Phase 5 adaptive execution: formal runtime signals and reassessment boundaries are the next design work.

The maintained DSH fork is pinned at `9c163d4086d6f12e9a2c8f4151358a9e66955ac1`. The runnable plugin composes the Phase 1 AA catalog and Phase 2 assessor at `agent/prepare-step`, freezes one `auto-decision/v1` for each DSH user turn, and reuses its complete effective configuration through assembly and every `agent/request` step in that turn. Required Session events preserve the route, assessment, evidence basis, versions, reason codes, and explanation for cold reconstruction. Schema-v2 decisions publish Light/Standard/Deep semantics without a prototype tier; the maintained UI shows the exact model, optional effort, handling level, evidence basis, and exact AA snapshot when applicable. Existing schema-v1 Sessions remain readable through an explicit legacy-only mapping.

## Accepted post-MVP direction

- Artificial Analysis is the maintained external source for model capability, price, and latency conclusions.
- DSH Auto Mode does not build or require an in-house model-quality benchmark.
- User-facing task-handling levels are Light, Standard, and Deep; Chinese labels are 轻量、常规、深度.
- A versioned assessor route policy resolves one environment-valid classifier route without inspecting the task and freezes it before the call. The semantic assessor returns task attributes and confidence; deterministic Host policy chooses the level and retains final authority.
- Executable Host route identity is separate from AA evidence identity. Complete ExecutionFingerprints remain authoritative for request equality; provider-scoped EvidenceRouteKeys contain only declared AA-evaluated controls and map through long-lived exact bindings to stable AA records.
- Within one level, the resolver prefers lower normalized price derived from AA-reported prices, then lower AA-reported latency, then stable route identity.
- AA acquisition and Evidence Pack refresh run only through maintainer-owned offline workflows. GREEN applies automatically, AMBER isolates affected evidence, and RED retains the previous Pack. Runtime routing never calls AA; real metrics remain `internal-only` unless a written AA grant covers machine-readable distribution and this model-selection product.
- Product claims remain explicitly AA-informed and do not claim project-benchmarked quality, safety, non-inferiority, or universal optimality.

The route/evidence decisions are recorded in [ADR-011](docs/decisions/0011-bind-host-routes-to-aa-evidence.md), which succeeds ADR-010 while retaining its AA-informed, price-first direction. The environment-aware assessor-route decision is recorded in [ADR-012](docs/decisions/0012-resolve-and-freeze-task-assessor-routes.md). The offline acquisition, rights, review, publication, and rollback boundary is recorded in [ADR-013](docs/decisions/0013-refresh-aa-snapshots-behind-a-rights-gate.md). ADR-010 remains the historical decision that superseded ADR-002, ADR-006, and ADR-008.

ADR-014 is Accepted. It separates full policy-eligible AA Snapshots, long-lived Binding Registries, and runtime-derived Active Catalogs; separates EvidenceRouteKeys from complete ExecutionFingerprints; and automates structurally valid refreshes by GREEN/AMBER/RED exception class. Its narrow supersession leaves ADR-011's execution/evidence separation and ADR-013's rights, acquisition, credential, validation, atomicity, and rollback boundaries in force.

ADR-015 is Accepted. It replaces only the mandatory Pro endpoint and AA-native blended-price field with the AA Free response and `aa-price-normalization/v1`, while retaining exact bindings, offline runtime, attribution, internal-only defaults, and the written-license distribution gate.

## Completed foundation

- Established the bilingual English-canonical documentation workflow.
- Audited DSH and implemented product-neutral A1 pre-assembly and A2 Session-event contracts on the maintained fork.
- Published the A1/A2 proposal and evidence in DeepSeek Harness Discussion #2281.
- Built and accepted the Phase 0P MVP: Auto/manual control, task-dependent route changes, request/selection equality, persisted explanations, visible model/effort transitions, real-provider calls, and Manual non-interference.
- Restored and retained the complete GUI suite; the Task 7 pinned fork run completed with 3,767 passing tests and one skip.
- Accepted the AA-informed post-MVP strategy and replaced Benchmark admission with an optional evaluation track.
- Accepted the generic Host route identity and explicit AA evidence-binding architecture, replacing the mandatory family/version/variant/effort key.
- Implemented Phase 1A without changing live routing: zero-, one-, and several-control routes resolve only through exact Host fingerprints, snapshot IDs, and stable AA record IDs; ambiguous, stale, fuzzy, configuration-crossing, colliding, and silent-record-replacement cases fail with stable reasons.
- Implemented Task 2 without changing live routing: a maintainer-selected Git-ignored JSON seed compiles against the current Host route inventory into frozen, sorted evidence entries and stable exclusions; malformed, unmatched, ambiguous, stale, configuration-crossing, and invalid-capability rows remain out of the catalog.
- Completed Phase 1 Task 3 and Checkpoint A without changing live routing: `aa-route-policy/v1` pins AA Intelligence Index `v4.1.1`, Light `<35`, Standard `35–<50`, Deep `>=50`, AA 7:2:1 blended price, and median time to first answer token. Missing capability or price excludes a route; missing latency sorts after measured latency for equal-price routes.
- Finalized the Git-ignored local seed with the three approved current bindings: DeepSeek Pro/off in Light, Pro/high in Standard, and Flash/max in Deep. Flash/off, Flash/high, and Pro/max remain excluded rather than receiving unsupported or ambiguous evidence.
- Completed Phase 2 Task 4: `task-assessor-route-policy/v1` requests Light, escalates through Standard and Deep, excludes missing or over-budget AA latency, and freezes the price-first winner from the current catalog. `task-assessor-contract/v1` fixes the bounded input, one-shot request budget, strict output schema, discrete confidence threshold, and deterministic Deep fallback fixtures without calling a live provider or changing the runnable MVP.
- Completed Phase 2 Task 5 and Checkpoint B without changing live routing: compatible assessor routes run through exactly one direct, tool-free `ctx.llm.stream()` call with a hard total deadline; validated attributes map through `task-handling-policy/v1`; representative semantic and failure fixtures prove deterministic Light, Standard, Deep, and fallback explanations.
- Completed Phase 3 Task 6: current Host routes are re-materialized before each new user turn, exact AA matches are filtered before price-first resolution, and one frozen decision drives assembly, requests, persisted facts, and cold projection. The pinned-fork suite covers all three levels, monotonic escalation, configured Host-valid Deep fallback without false AA evidence, explicit no-route failure before dispatch, and Manual non-interference.
- Completed Phase 3 Task 7: schema-v2 projections no longer publish prototype tiers; the selector and conversation facts show localized task-handling levels, actual model and optional effort, plus AA or configured Deep fallback basis. Model-only, effort-only, combined, and level-only browser transitions preserve the 1.2-second roll, business-blue highlight, two breathing cycles, durable message placement, and English/Chinese snapshots.
- Completed Phase 3 Task 8 and Checkpoint C: a cross-repository keyless browser fixture drives the real Web UI, agent loop, Session log, and request header through Light, Standard, Deep, and Manual. Its Standard candidates prove price-first and latency-second resolution; every automatic turn proves the displayed route and AA snapshot equal the persisted selection and effective request configuration. Focused Loader and Session tests retain fallback, no-route failure, cold reconstruction, and Manual non-interference coverage. The support matrix pins fork `9c163d4086d6f12e9a2c8f4151358a9e66955ac1`, selection schema v2, `auto-decision/v1`, `aa-evidence-catalog/v1`, `task-assessor-contract/v1`, `task-assessor-route-policy/v1`, `task-handling-policy/v1`, and `aa-route-policy/v1`.
- Completed Phase 4 Task 9: `aa-snapshot-refresh/v1` fixes the official Pro acquisition contract, server-side credential boundary, source methodology, attribution, retention, freshness, minimization, and explicit rights modes. Its maintainer CLI derives credential-free Host identities, stores bounded source material privately, prepares deterministic candidates and complete source/record/binding/band/order diffs, requires exact digest approval, atomically preserves and replaces the active seed, and verifies rollback integrity. Ninety-nine offline tests pass; only synthetic AA-shaped fixtures and placeholder examples are tracked.
- Completed Phase 4.1 Tasks 10–19 and Checkpoints D1–D3: ADR-014 is Accepted; independently validated Snapshot, Registry, Policy, and Manifest components use deterministic digests and a Runtime compatibility contract. Exact provider rules separate EvidenceRouteKeys from complete ExecutionFingerprints; full acquisition retains every policy-eligible record; `aa-binding-candidate-compiler/v1` automatically materializes only predeclared stable-record mappings and isolates missing, conflicting, or ambiguous declarations; dormant bindings activate from current Host routes; quarantined, unbound, missing, or malformed routes are isolated. GREEN/AMBER/RED refresh, atomic local activation, rollback, legacy migration, Plugin loading, Session audit, and Manual non-interference are implemented without a new dependency or service. The current private schema-v1 seed was migrated to a mode-`0600` local Pack with three preserved bindings; a future credentialed acquisition is still required to populate the complete accessible AA record set. The project suite passes 129 tests, the pinned fork passes all seven Loader scenarios, and six focused UI projection/view tests pass.
- Completed Phase 4.2 Tasks 20–24 and Checkpoint D4: the bounded Evidence Pack CLI fetches the complete AA Free response without persisting the key; Snapshot v3 retains Intelligence, raw input/output/cache-hit prices, cache substitution basis, normalized price, and nullable latency; Route Policy v2 and Runtime v2 use unchanged bands and normalized-price-first ordering. Valid v1 Packs are strictly validated and explicitly migrated with `legacy-aa-blended` provenance. A real private acquisition returned 610 records across four pages; 405 eligible records compile to 295 Light, 70 Standard, and 40 Deep. Six exact DeepSeek model/effort bindings yield three active and three dormant entries for the current Host inventory with no Active Catalog exclusion. The active Pack, predecessor, source, rights, and Host inventory are mode `0600` under ignored `local/`; 133 offline tests pass.

## Current implementation plan

1. Completed: provider-neutral Host route identity and explicit AA evidence bindings with mixed-provider fixtures.
2. Completed: compile the Git-ignored local AA seed through validated bindings and stable exclusion reasons.
3. Completed: compile versioned AA capability bands and resolve same-band routes by price, latency, and stable identity.
4. Completed: freeze the bounded Task Assessor contract and deterministic environment-aware assessor route policy.
5. Completed: call the resolved-and-frozen assessor outside Auto recursion and implement deterministic level mapping.
6. Completed: integrate one frozen decision path through assembly, request, Session persistence, and cold projection.
7. Completed: migrate the live UI terminology, evidence basis, optional-effort display, and transition explanations.
8. Completed: prove all beta paths end to end across the browser, Loader, Session, and effective request boundary.
9. Completed: define and implement the versioned AA snapshot refresh workflow and rights boundary.
10. Completed: accept ADR-014 and freeze the Phase 4.1 Evidence Pack contracts.
11. Completed: implement Tasks 11–19 and complete the reusable Evidence Pack foundation.
12. Completed: implement Tasks 20–24, activate the private complete Free-endpoint Pack, and complete Checkpoint D4.
13. Active: define formal runtime evidence and reassessment boundaries for Phase 5 monotonic adaptive execution.

Detailed dependencies and acceptance checks are in [the roadmap](docs/roadmap.md), [implementation plan](tasks/plan.md), and [task checklist](tasks/todo.md).

## Current blockers and open decisions

Phase 1 has no remaining blocker. Its field choices, boundaries, missing-data policy, and initial bindings are frozen and verified offline.

Phase 2 has no remaining blocker. Tasks 4–5 freeze dynamic environment-aware assessor route resolution, bounded input, a hard 12-second timeout, discrete confidence, deterministic level mapping, and strict Deep fallbacks.

Phase 3 has no remaining blocker. Task 8 found no provider credential in the verification environment, so it makes no new live-provider-call claim; the completed keyless vertical proof covers the product-specific decision path, while the accepted Phase 0P evidence remains the historical real-provider dispatch proof.

Phase 4 has no remaining implementation blocker. ADR-013 resolves stable AA acquisition, attribution, retention, freshness, minimization, review, atomic replacement, and rollback. Public distribution of real machine-readable AA metrics remains unavailable until an external written AA grant covers both distribution and this model-selection product; that external restriction does not block the completed default `internal-only` workflow.

Phase 4.1 has no remaining implementation blocker. Its former complete-accessible-record acquisition follow-up was completed by Phase 4.2. Public distribution of a real Evidence Pack remains separately blocked by the ADR-013 written-license gate.

Phase 4.2 has no remaining implementation blocker. The user-owned Free key populated and activated a private Pack containing every policy-eligible record returned by the Free endpoint. Public redistribution of that real machine-readable Pack remains blocked by the ADR-013 written-license gate; this does not affect local routing or future private refreshes.

Phase 5 must define which formal runtime signals justify escalation, where reassessment may occur, and how monotonicity and persisted explanation are enforced. Recovery, child-agent routing, and official DSH compatibility remain later phases.

## Next action

Define Phase 5 formal runtime signals, reassessment boundaries, monotonic escalation behavior, and persisted explanations.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a phase gate closes, or the next action changes.
- Keep product requirements in `docs/spec.md`, component behavior in `docs/architecture.md`, policy in `docs/routing-policy.md`, and implementation order in `docs/roadmap.md`.
- Preserve superseded ADRs as historical records.
