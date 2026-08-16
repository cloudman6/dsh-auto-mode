# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-16

## Current stage

Phase 0P planning and critical-path execution. The maintainer accepted ADR-008 on 2026-08-16, authorizing a maintainer-only, explicitly unadmitted Artificial Analysis-seeded dogfood path before RouterBench admission. Product-neutral A1 pre-assembly step preparation and A2 runtime Session-event registration remain implemented and tested on the declared DSH fork at commit `801ded7f60a0dfab07b9690cb9d98fce6234d243`. Phase 0C remains separately gated by the minimal Phase A admission slice, A3p deployment identity, and A5p carrier verification.

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
- Added a repository-local Code Review Skill that gates every bounded implementation stage against accepted Auto Mode invariants and the pinned official DSH engineering contracts.
- Published the bilingual product-neutral A1/A2 Host-contract proposal as DeepSeek Harness [Discussion #2281](https://github.com/deepseek-ai/deepseek-harness/discussions/2281), with reproducible fork evidence and explicit maintainer questions.
- Accepted ADR-008 and introduced Phase 0P, allowing externally seeded, visibly unadmitted maintainer dogfood without weakening Phase 0C admission requirements.

## Current implementation entry points

1. Inventory exact DSH and Artificial Analysis configurations, then close A3p for the first Experimental Auto route set.
2. Freeze the external-evidence snapshot schema, exact-match rules, heuristic policy, and data-rights boundary.
3. Implement the one-decision-per-Session Phase 0P path and close A5p against one concrete carrier.
4. Keep the fork pinned to `801ded7f60a0dfab07b9690cb9d98fce6234d243`; do not claim route admission or official DSH compatibility.

## Gates before Phase 0P dogfood

- A1/A2 stay green on the pinned fork.
- Every selectable configuration has exact A3p provider/model/reasoning-selection identity and one exact external-evidence match.
- Artificial Analysis data is locally supplied, versioned, attributed, and kept out of the repository; any API credential remains outside the browser client and repository and is supplied through a process environment or secret store.
- Experimental policy, persistence, and explanations preserve the `experimental-unadmitted` state and cannot compile into a normal admission.
- Persistence proves one Session decision plus a fresh fail-closed authorization for every attempted Experimental Auto model call, including after cold load and live identity/capability drift; Manual bypasses the Auto listener.
- Host-declared Recovery Capability and an ADR-007-compliant possible-loss bound accepted in a separate decision gate every mutable Auto call; until then, Phase 0P dogfood is read-only.
- A5p proves one-operation Auto/manual control and explanation retrieval.
- Keyless real composition passes, and a self-skipping with-key real-provider smoke passes whenever the required secret is available; a missing key is reported as skipped evidence, not a pass.

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

The Phase 0P decision gate is closed. Its remaining implementation blockers are the exact initial route set and A3p mappings, the external-evidence snapshot and heuristic-policy contract, an ADR-007-compliant possible-loss bound plus Recovery Capability evidence for any mutable scope, and one verified A5p carrier. Until the recovery gate closes, Phase 0P dogfood is read-only. A1/A2 are implemented on the maintainer fork but remain an upstream compatibility dependency. The minimal Phase A admission slice is deliberately deferred from Phase 0P and remains a Phase 0C blocker. Full recovery and external child model/reasoning-selection control remain deferred.

## Next action

Execute the accepted Phase 0P implementation plan: first freeze the exact DSH/Artificial Analysis route inventory and A3p evidence matrix, then establish the external-prior schema, immutable experimental resolution contract, and deterministic policy. Propose the ADR-007 loss bound and Recovery Capability evidence separately before enabling mutable tasks; Host and A5p integration can proceed with read-only fixtures meanwhile. Keep A1/A2 verified against the pinned fork and monitor Discussion #2281 asynchronously. RouterBench admission remains the next gate for Phase 0C, not a Phase 0P prerequisite.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a gate closes, or the next action changes.
- This file records current status only; it does not duplicate long-lived product requirements, full architecture, or the open-question inventory.
- Historical decisions belong in ADRs, long-lived scope and success criteria in `docs/spec.md`, and unresolved questions in `docs/open-questions.md`.
