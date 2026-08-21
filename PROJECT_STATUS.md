# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-21

## Current stage

Phase 0P MVP is accepted. The project has entered Phase 1 of the post-MVP roadmap: replace prototype route assumptions with a versioned AA-informed catalog and the user-facing task-handling levels `light`, `standard`, and `deep`.

The maintained DSH fork remains pinned at `2a2db7a6ec3ce9969857cc41de839f911ef5902e`. Phase 1A is complete: the repository now has a provider-neutral effective-configuration fingerprint, stable Host route identity, explicit versioned AA evidence-binding resolver, stable rejection reasons, and mixed-provider fixtures. The current runnable plugin still uses the prototype `fast`/`standard`/`strong` implementation until later Phase 1 tasks integrate the new catalog path.

## Accepted post-MVP direction

- Artificial Analysis is the maintained external source for model capability, price, and latency conclusions.
- DSH Auto Mode does not build or require an in-house model-quality benchmark.
- User-facing task-handling levels are Light, Standard, and Deep; Chinese labels are 轻量、常规、深度.
- A fixed semantic Task Assessor returns task attributes and confidence; deterministic Host policy chooses the level and retains final authority.
- Executable Host route identity is separate from AA evidence identity. A versioned explicit binding maps one effective provider/model/request configuration to one stable AA record; effort and variant are optional provider dimensions, not universal required fields.
- Within one level, the resolver prefers lower AA-reported price, then lower AA-reported latency, then stable route identity.
- Product claims remain explicitly AA-informed and do not claim project-benchmarked quality, safety, non-inferiority, or universal optimality.

These decisions are recorded in [ADR-011](docs/decisions/0011-bind-host-routes-to-aa-evidence.md), which succeeds ADR-010 while retaining its AA-informed, price-first direction. ADR-010 remains the historical decision that superseded ADR-002, ADR-006, and ADR-008.

## Completed foundation

- Established the bilingual English-canonical documentation workflow.
- Audited DSH and implemented product-neutral A1 pre-assembly and A2 Session-event contracts on the maintained fork.
- Published the A1/A2 proposal and evidence in DeepSeek Harness Discussion #2281.
- Built and accepted the Phase 0P MVP: Auto/manual control, task-dependent route changes, request/selection equality, persisted explanations, visible model/effort transitions, real-provider calls, and Manual non-interference.
- Restored the complete GUI suite to 3,760 passing tests with four existing skips at the pinned fork commit.
- Accepted the AA-informed post-MVP strategy and replaced Benchmark admission with an optional evaluation track.
- Accepted the generic Host route identity and explicit AA evidence-binding architecture, replacing the mandatory family/version/variant/effort key.
- Implemented Phase 1A without changing live routing: zero-, one-, and several-control routes resolve only through exact Host fingerprints, snapshot IDs, and stable AA record IDs; ambiguous, stale, fuzzy, configuration-crossing, colliding, and silent-record-replacement cases fail with stable reasons.

## Current implementation plan

1. Completed: provider-neutral Host route identity and explicit AA evidence bindings with mixed-provider fixtures.
2. Compile the Git-ignored local AA seed through validated bindings and stable exclusion reasons.
3. Compile versioned AA capability bands and resolve same-band routes by price, latency, and stable identity.
4. Replace keyword classification with a fixed structured semantic Task Assessor.
5. Integrate the new decision path and terminology end to end while preserving the accepted UI behavior and Manual mode.

Detailed dependencies and acceptance checks are in [the roadmap](docs/roadmap.md), [implementation plan](tasks/plan.md), and [task checklist](tasks/todo.md).

## Current blockers and open decisions

There is no implementation-level blocker to starting Task 2. Before the catalog and band resolver can be finalized, the maintainer must review or select:

- the AA capability field and versioned boundaries for Light, Standard, and Deep;
- the canonical AA price field and latency tie-break field;
- initial reviewed AA evidence bindings for the DSH routes in the local seed.

Stable AA acquisition, data distribution rights, within-session adaptation, recovery, child-agent routing, and official DSH compatibility belong to later roadmap phases and do not block Phase 1.

## Next action

Implement Task 2 as one bounded change: compile the Git-ignored local seed through validated Phase 1A bindings, exclude invalid or unmatched rows with stable reasons, and keep the existing MVP behavior available until the full Phase 1 catalog path is ready.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a phase gate closes, or the next action changes.
- Keep product requirements in `docs/spec.md`, component behavior in `docs/architecture.md`, policy in `docs/routing-policy.md`, and implementation order in `docs/roadmap.md`.
- Preserve superseded ADRs as historical records.
