# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-22

## Current stage

Phase 0P MVP, Phase 1, and Phase 2 are complete. The project is ready for Phase 3 Task 6: integrate the completed AA catalog, semantic assessor, deterministic handling-level policy, and price-first resolver into one frozen Auto decision before provider-dependent assembly.

The maintained DSH fork remains pinned at `2a2db7a6ec3ce9969857cc41de839f911ef5902e`. Phase 1 Tasks 1–3 provide the provider-neutral AA catalog pipeline. Phase 2 Tasks 4–5 provide the resolved-and-frozen one-shot assessor plus `task-handling-policy/v1`: bounded visible input, strict untrusted-output validation, deterministic Light/Standard/Deep mapping, and visible Deep fallback. The current runnable plugin still uses the prototype `fast`/`standard`/`strong` implementation until Phase 3 integrates the new catalog and assessor path.

## Accepted post-MVP direction

- Artificial Analysis is the maintained external source for model capability, price, and latency conclusions.
- DSH Auto Mode does not build or require an in-house model-quality benchmark.
- User-facing task-handling levels are Light, Standard, and Deep; Chinese labels are 轻量、常规、深度.
- A versioned assessor route policy resolves one environment-valid classifier route without inspecting the task and freezes it before the call. The semantic assessor returns task attributes and confidence; deterministic Host policy chooses the level and retains final authority.
- Executable Host route identity is separate from AA evidence identity. A versioned explicit binding maps one effective provider/model/request configuration to one stable AA record; effort and variant are optional provider dimensions, not universal required fields.
- Within one level, the resolver prefers lower AA-reported price, then lower AA-reported latency, then stable route identity.
- Product claims remain explicitly AA-informed and do not claim project-benchmarked quality, safety, non-inferiority, or universal optimality.

The route/evidence decisions are recorded in [ADR-011](docs/decisions/0011-bind-host-routes-to-aa-evidence.md), which succeeds ADR-010 while retaining its AA-informed, price-first direction. The environment-aware assessor-route decision is recorded in [ADR-012](docs/decisions/0012-resolve-and-freeze-task-assessor-routes.md). ADR-010 remains the historical decision that superseded ADR-002, ADR-006, and ADR-008.

## Completed foundation

- Established the bilingual English-canonical documentation workflow.
- Audited DSH and implemented product-neutral A1 pre-assembly and A2 Session-event contracts on the maintained fork.
- Published the A1/A2 proposal and evidence in DeepSeek Harness Discussion #2281.
- Built and accepted the Phase 0P MVP: Auto/manual control, task-dependent route changes, request/selection equality, persisted explanations, visible model/effort transitions, real-provider calls, and Manual non-interference.
- Restored the complete GUI suite to 3,760 passing tests with four existing skips at the pinned fork commit.
- Accepted the AA-informed post-MVP strategy and replaced Benchmark admission with an optional evaluation track.
- Accepted the generic Host route identity and explicit AA evidence-binding architecture, replacing the mandatory family/version/variant/effort key.
- Implemented Phase 1A without changing live routing: zero-, one-, and several-control routes resolve only through exact Host fingerprints, snapshot IDs, and stable AA record IDs; ambiguous, stale, fuzzy, configuration-crossing, colliding, and silent-record-replacement cases fail with stable reasons.
- Implemented Task 2 without changing live routing: a maintainer-selected Git-ignored JSON seed compiles against the current Host route inventory into frozen, sorted evidence entries and stable exclusions; malformed, unmatched, ambiguous, stale, configuration-crossing, and invalid-capability rows remain out of the catalog.
- Completed Phase 1 Task 3 and Checkpoint A without changing live routing: `aa-route-policy/v1` pins AA Intelligence Index `v4.1.1`, Light `<35`, Standard `35–<50`, Deep `>=50`, AA 7:2:1 blended price, and median time to first answer token. Missing capability or price excludes a route; missing latency sorts after measured latency for equal-price routes.
- Finalized the Git-ignored local seed with the three approved current bindings: DeepSeek Pro/off in Light, Pro/high in Standard, and Flash/max in Deep. Flash/off, Flash/high, and Pro/max remain excluded rather than receiving unsupported or ambiguous evidence.
- Completed Phase 2 Task 4: `task-assessor-route-policy/v1` requests Light, escalates through Standard and Deep, excludes missing or over-budget AA latency, and freezes the price-first winner from the current catalog. `task-assessor-contract/v1` fixes the bounded input, one-shot request budget, strict output schema, discrete confidence threshold, and deterministic Deep fallback fixtures without calling a live provider or changing the runnable MVP.
- Completed Phase 2 Task 5 and Checkpoint B without changing live routing: compatible assessor routes run through exactly one direct, tool-free `ctx.llm.stream()` call with a hard total deadline; validated attributes map through `task-handling-policy/v1`; representative semantic and failure fixtures prove deterministic Light, Standard, Deep, and fallback explanations.

## Current implementation plan

1. Completed: provider-neutral Host route identity and explicit AA evidence bindings with mixed-provider fixtures.
2. Completed: compile the Git-ignored local AA seed through validated bindings and stable exclusion reasons.
3. Completed: compile versioned AA capability bands and resolve same-band routes by price, latency, and stable identity.
4. Completed: freeze the bounded Task Assessor contract and deterministic environment-aware assessor route policy.
5. Completed: call the resolved-and-frozen assessor outside Auto recursion and implement deterministic level mapping.
6. Next: integrate the new frozen decision path end to end while preserving the accepted UI behavior and Manual mode.

Detailed dependencies and acceptance checks are in [the roadmap](docs/roadmap.md), [implementation plan](tasks/plan.md), and [task checklist](tasks/todo.md).

## Current blockers and open decisions

Phase 1 has no remaining blocker. Its field choices, boundaries, missing-data policy, and initial bindings are frozen and verified offline.

Phase 2 has no remaining blocker. Tasks 4–5 freeze dynamic environment-aware assessor route resolution, bounded input, a hard 12-second timeout, discrete confidence, deterministic level mapping, and strict Deep fallbacks.

Stable AA acquisition, data distribution rights, within-session adaptation, recovery, child-agent routing, and official DSH compatibility belong to later roadmap phases and do not block Phase 3 Task 6.

## Next action

Implement Phase 3 Task 6: compose assessment, Host constraints, the frozen AA catalog, handling-level policy, and price-first route resolution at the verified pre-assembly boundary, then prove assembly, `agent/request`, and persisted Session facts consume one identical frozen selection.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a phase gate closes, or the next action changes.
- Keep product requirements in `docs/spec.md`, component behavior in `docs/architecture.md`, policy in `docs/routing-policy.md`, and implementation order in `docs/roadmap.md`.
- Preserve superseded ADRs as historical records.
