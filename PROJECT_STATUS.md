# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-18

## Current stage

Phase 0P MVP is accepted. The project has entered Phase 1 of the post-MVP roadmap: replace prototype route assumptions with a versioned AA-informed catalog and the user-facing task-handling levels `light`, `standard`, and `deep`.

The maintained DSH fork remains pinned at `2a2db7a6ec3ce9969857cc41de839f911ef5902e`. The current runnable plugin still uses the prototype `fast`/`standard`/`strong` implementation until Phase 1 migrates code and UI; documentation now distinguishes that historical implementation from the accepted forward direction.

## Accepted post-MVP direction

- Artificial Analysis is the maintained external source for model capability, price, and latency conclusions.
- DSH Auto Mode does not build or require an in-house model-quality benchmark.
- User-facing task-handling levels are Light, Standard, and Deep; Chinese labels are 轻量、常规、深度.
- A fixed semantic Task Assessor returns task attributes and confidence; deterministic Host policy chooses the level and retains final authority.
- AA matching uses model family, semantic version, variant, and effort. Date/build/deployment revision is ignored for equality; the latest duplicate AA row in the snapshot is used.
- Within one level, the resolver prefers lower AA-reported price, then lower AA-reported latency, then stable route identity.
- Product claims remain explicitly AA-informed and do not claim project-benchmarked quality, safety, non-inferiority, or universal optimality.

These decisions are recorded in [ADR-010](docs/decisions/0010-aa-informed-heuristic-routing.md), which supersedes ADR-002, ADR-006, and ADR-008 for post-MVP development.

## Completed foundation

- Established the bilingual English-canonical documentation workflow.
- Audited DSH and implemented product-neutral A1 pre-assembly and A2 Session-event contracts on the maintained fork.
- Published the A1/A2 proposal and evidence in DeepSeek Harness Discussion #2281.
- Built and accepted the Phase 0P MVP: Auto/manual control, task-dependent route changes, request/selection equality, persisted explanations, visible model/effort transitions, real-provider calls, and Manual non-interference.
- Restored the complete GUI suite to 3,760 passing tests with four existing skips at the pinned fork commit.
- Accepted the AA-informed post-MVP strategy and replaced Benchmark admission with an optional evaluation track.

## Current implementation plan

1. Migrate route terminology and UI from `fast`/`standard`/`strong` to `light`/`standard`/`deep` and 轻量/常规/深度.
2. Implement normalized AA model-key matching and duplicate-date resolution.
3. Compile versioned AA capability bands and resolve same-band routes by price, latency, and stable identity.
4. Replace keyword classification with a fixed structured semantic Task Assessor.
5. Integrate the new decision path end to end while preserving the accepted UI behavior and Manual mode.

Detailed dependencies and acceptance checks are in [the roadmap](docs/roadmap.md), [implementation plan](tasks/plan.md), and [task checklist](tasks/todo.md).

## Current blockers and open decisions

There is no blocker to starting Phase 1. Before its route catalog can be finalized, the maintainer must select:

- the AA capability field and versioned boundaries for Light, Standard, and Deep;
- the canonical AA price field and latency tie-break field;
- initial normalization aliases for the DSH routes in the local seed.

Stable AA acquisition, data distribution rights, within-session adaptation, recovery, child-agent routing, and official DSH compatibility belong to later roadmap phases and do not block Phase 1.

## Next action

Implement Phase 1A as one bounded change: introduce the normalized model key and fixture-backed matching rules while keeping the existing MVP behavior available until the full Phase 1 catalog path is ready.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a phase gate closes, or the next action changes.
- Keep product requirements in `docs/spec.md`, component behavior in `docs/architecture.md`, policy in `docs/routing-policy.md`, and implementation order in `docs/roadmap.md`.
- Preserve superseded ADRs as historical records.
