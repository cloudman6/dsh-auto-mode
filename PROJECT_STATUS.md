# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-15

## Current stage

Phase 0 critical-path execution. The maintainer accepted `docs/spec.md` and ADR-001 through ADR-007 on 2026-08-15. Product-neutral A1 pre-assembly step preparation and A2 runtime Session-event registration are implemented and tested on the declared DSH fork at commit `801ded7f60a0dfab07b9690cb9d98fce6234d243`. Phase 0C itself remains gated by the minimal Phase A admission slice, A3p deployment identity, and A5p carrier verification.

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
- Accepted the revised specification and ADR-001 through ADR-007 on explicit maintainer authorization.
- Implemented A1 and A2 on the maintainer DSH fork, passed their combined JSONL cold-reload probe, 402 relevant tests, typecheck, lint, and all 28 DSH documentation gates, and pushed the exact fork commit.

## Current implementation entry points

1. Close A3p for the initial baseline and candidate route identities.
2. Produce the minimal Phase A admission slice and close A5p against one concrete preview carrier.
3. Keep the fork pinned to `801ded7f60a0dfab07b9690cb9d98fce6234d243`; do not claim official DSH compatibility before upstream acceptance.

## Gates before Phase 0C preview planning

- Keep the implemented product-neutral A1 pre-assembly and A2 required-event contracts pinned and green on the declared fork.
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

The specification gate is closed. A1 and A2 are no longer fork-preview blockers: they are implemented and tested on the maintainer fork, but are not present in official DSH and therefore remain an upstream compatibility dependency. A3p identity evidence, the minimal Phase A admission slice, and A5p carrier verification are the remaining Phase 0C blockers. Full recovery and external child model/reasoning-selection control remain deferred to later roadmap phases.

## Next action

Close A3p for the initial route identities, produce the minimal Phase A admission evidence, and close A5p for the concrete preview carrier. Keep A1/A2 verified against their pinned fork commit while preparing them for separate upstream review. The production release carrier remains a separate Phase B/release decision.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a gate closes, or the next action changes.
- This file records current status only; it does not duplicate long-lived product requirements, full architecture, or the open-question inventory.
- Historical decisions belong in ADRs, long-lived scope and success criteria in `docs/spec.md`, and unresolved questions in `docs/open-questions.md`.
