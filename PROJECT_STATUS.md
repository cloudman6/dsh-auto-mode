# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-22

## Current stage

Phase 0P MVP, Phase 1, Phase 2, and Phase 3 Tasks 6–7 are complete. The project is ready for Task 8: prove the AA-informed beta end to end.

The maintained DSH fork is pinned at `afc8d47d597dfdb058a0129a8a95403df16664b4`. The runnable plugin composes the Phase 1 AA catalog and Phase 2 assessor at `agent/prepare-step`, freezes one `auto-decision/v1` for each DSH user turn, and reuses its complete effective configuration through assembly and every `agent/request` step in that turn. Required Session events preserve the route, assessment, evidence basis, versions, reason codes, and explanation for cold reconstruction. Schema-v2 decisions publish Light/Standard/Deep semantics without a prototype tier; the maintained UI shows the exact model, optional effort, handling level, and AA or configured-fallback basis. Existing schema-v1 Sessions remain readable through an explicit legacy-only mapping.

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

## Current implementation plan

1. Completed: provider-neutral Host route identity and explicit AA evidence bindings with mixed-provider fixtures.
2. Completed: compile the Git-ignored local AA seed through validated bindings and stable exclusion reasons.
3. Completed: compile versioned AA capability bands and resolve same-band routes by price, latency, and stable identity.
4. Completed: freeze the bounded Task Assessor contract and deterministic environment-aware assessor route policy.
5. Completed: call the resolved-and-frozen assessor outside Auto recursion and implement deterministic level mapping.
6. Completed: integrate one frozen decision path through assembly, request, Session persistence, and cold projection.
7. Completed: migrate the live UI terminology, evidence basis, optional-effort display, and transition explanations.
8. Next: prove all beta paths end to end in browser and available real-provider scenarios.

Detailed dependencies and acceptance checks are in [the roadmap](docs/roadmap.md), [implementation plan](tasks/plan.md), and [task checklist](tasks/todo.md).

## Current blockers and open decisions

Phase 1 has no remaining blocker. Its field choices, boundaries, missing-data policy, and initial bindings are frozen and verified offline.

Phase 2 has no remaining blocker. Tasks 4–5 freeze dynamic environment-aware assessor route resolution, bounded input, a hard 12-second timeout, discrete confidence, deterministic level mapping, and strict Deep fallbacks.

Phase 3 Tasks 6–7 have no remaining blocker. Task 8 has no unresolved design decision; its real-provider verification depends on provider credentials and availability in the execution environment. Stable AA acquisition, data distribution rights, within-session adaptation, recovery, child-agent routing, and official DSH compatibility belong to later roadmap phases.

## Next action

Implement Phase 3 Task 8: exercise Light, Standard, Deep, price ordering, latency tie-break, fallback, no-route failure, cold reconstruction, and Manual non-interference; prove displayed, persisted, and effective request configurations agree in browser and available real-provider scenarios.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a phase gate closes, or the next action changes.
- Keep product requirements in `docs/spec.md`, component behavior in `docs/architecture.md`, policy in `docs/routing-policy.md`, and implementation order in `docs/roadmap.md`.
- Preserve superseded ADRs as historical records.
