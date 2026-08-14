# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-14

## Current stage

Specification review after multi-view revision. The repository has a revised product, evidence, architecture, DSH-integration, and recovery design, but the user has not accepted `docs/spec.md` or the six Proposed product/architecture ADRs. ADR-005, which defines documentation language, remains Accepted. Implementation planning, dependency selection, and coding remain gated.

## Completed

- Established the Git repository and English-canonical, Simplified-Chinese-maintained documentation workflow.
- Completed an architecture, evaluation, adversarial, user-experience, feasibility, and meta-review; recorded its informational outcome in `docs/reviews/2026-08-14-multi-view-design-review.md`.
- Revised normal UX to exactly Auto or manual provider/model/reasoning selection; calibration belongs to Policy Pack maintainers.
- Replaced relative-only quality claims with an absolute baseline gate, candidate non-inferiority, severe-failure bounds, evidence isolation, admission expiry, and revocation.
- Split RouterBench into Route Capability Bench and Policy Scenario Bench, with strategy ablations for Static, Within-turn, and Full Auto.
- Added Route Snapshot timing, explicit route-resolution failures, formal persisted state, provenance-aware recovery signals, and Recovery Capability gates.
- Audited DeepSeek Harness commit `47f943859bef60e4160492346772ded9b24f765a` and documented usable seams and blocking gaps in `docs/dsh-integration.md`.
- Verified DSH's provider/model discovery and optional exact-route reasoning metadata seams, recorded the maintainer fork as the preview runtime carrier, and added a fork-based Static Auto Preview as Phase 0C.
- Closed the fresh-context review's causal-ordering, reasoning-default, deterministic-resolution, preview-identity, preview-carrier, and planning-gate contradictions without changing ADR states.
- Revised ADR-001 through ADR-004 and added Proposed ADR-006 and ADR-007 without changing any Proposed decision to Accepted.

## Current review entry points

1. Review the revised normative documents in the order listed by `docs/README.md`.
2. Review six Proposed ADRs in `docs/decisions/`; change state only after explicit user confirmation.
3. Treat the historical multi-view report as review evidence, not as empirical validation.

## Gates before Phase 0C preview planning

- Explicitly accept the revised product specification.
- Resolve the six Proposed ADR states.
- Freeze the product-neutral A1 pre-assembly and A2 required-event contracts, including their failing and passing contract tests.
- Preregister the initial Policy Pack taxonomy, baseline/candidate deployments, statistics, evaluator governance, and isolated datasets.
- Close A3p for the initial baseline and candidate with reproducible provider/model/reasoning-selection identity evidence.
- Close A5p by verifying one concrete preview carrier for the Auto/manual choice and persisted explanations.
- Keep Phase 0C routing scope fixed to one decision per Session; do not introduce an unresolved objective-boundary heuristic.

## Gates before Phase B and production-release planning

- Decide the production release carrier: external plugin, upstream DSH capability, or split architecture. Phase 0C's fork preview does not settle that release decision.
- Generalize A3p and A5p into supported official-compatible A3 identity and A5 client-extension contracts.
- Define consent, minimization, retention, and deletion policy for real-use evidence.
- Decide which Recovery Capability providers and side-effect classes, if any, enter the production implementation plan.

## Current blockers

The design gate remains open. In addition, the audited DSH revision lacks two contracts required for the proposed external plugin: runtime registration of required normative Session events, and a pre-assembly decision input that carries the current step's claimed messages. These are the Phase 0 critical path for Session Static Auto, not optional later refinements. Full recovery and external child model/reasoning-selection control also lack general contracts, but their roadmap phases can remain out of the first product behavior.

## Next action

Review the revised specification and ADRs, then freeze the product-neutral A1 pre-assembly and A2 required-event contracts described in `docs/roadmap.md`. In parallel, close A3p for the initial route identities and A5p for the concrete preview carrier. Phase 0C planning may begin when that preview-specific gate set passes. The production release carrier remains a separate Phase B/release decision.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a gate closes, or the next action changes.
- This file records current status only; it does not duplicate long-lived product requirements, full architecture, or the open-question inventory.
- Historical decisions belong in ADRs, long-lived scope and success criteria in `docs/spec.md`, and unresolved questions in `docs/open-questions.md`.
