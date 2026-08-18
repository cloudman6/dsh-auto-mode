# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-18

## Current stage

Phase 0P fast prototype MVP accepted by the maintainer on 2026-08-18. The runnable, dependency-free `experimental-unadmitted` plugin uses the product-neutral A1/A2 seams and the visible Auto carrier on the pinned DSH fork at `2a2db7a6ec3ce9969857cc41de839f911ef5902e`. It consumes a manually maintained, local, gitignored AA seed; applies a deterministic fast/standard/strong policy; persists and displays the choice and explanation; falls back to a configured fixed strong selection; and leaves Manual unchanged. Subsequent work proceeds incrementally through the roadmap. This MVP does not amend or satisfy the deferred production admission, deployment-identity, rights, recovery, or official-compatibility gates.

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
- Accepted ADR-009's initial mutable-work loss bound: all uncommitted changes attributable to the current Attempt inside a clean isolated worktree, with no external effects or automatic-recovery claim.
- Completed the initial Phase 0P route-selection inventory and A3p evidence matrix. Six explicit DeepSeek Flash/Pro selections have reproducible DSH fingerprints, but the exact external intersection is empty: Artificial Analysis records bind versioned deployments while DSH exposes revisionless pass-through aliases. Defaults, dormant pi-ai routes, and non-public endpoints are also excluded.
- Implemented the deliberately bounded Phase 0P fast prototype: 12 unit and real-Loader tests pass; Auto fast/strong decisions match effective request headers; Manual is unchanged; and real provider calls completed on `deepseek-v4-flash / off` and `deepseek-v4-pro / max` with matching Session evidence.
- Closed the bounded Phase 0P A5p carrier: the model menu puts checked `Auto` above manual controls, labels the effective model/effort explicitly inside the Auto status card, updates that selection and its explanation from the Session projection while a task runs, and exits Auto before applying a manual choice. A changed decision carries its preceding route, so the UI rolls each changed model and/or effort value to the effective route over 1.2 seconds; Auto and every changed target use DSH business blue, breathe twice, and return to their normal color. The browser regression covers model-only, effort-only, and simultaneous changes. The plugin persists each selection after its current user message and before its effective request header, so the chat timeline records each changed field as prior value, arrow, and blue effective value, while unchanged fields display only the effective value; it also records tier, reason code, and explanation in that same interval, before the resulting assistant response. Initial projection remains static. Focused component, conversation-node, Loader-composition, and keyless assembled-Web tests passed through fork commit `2a2db7a6ec3ce9969857cc41de839f911ef5902e`.
- Accepted the Phase 0P fast-prototype MVP after its four criteria were demonstrated: Auto can be selected, distinct tasks can route to distinct model/effort configurations, the persisted selection matches the effective request, and Manual remains unchanged.

## Next implementation direction

1. Continue iteratively from the accepted MVP in the dependency order defined by `docs/roadmap.md`.
2. Keep collecting task text, selected tier, effective request, latency, and user outcome locally without treating user choices as correctness labels.
3. Keep the fork pinned and every result visibly `experimental-unadmitted`; do not claim route admission, quality improvement, or official DSH compatibility until the relevant roadmap gates close.

## Deferred production-grade Phase 0P gates

The fast prototype does not wait on the following gates. They remain required before any production-grade or publicly supported Auto claim:

- A1/A2 stay green on the pinned fork.
- Every selectable configuration has exact A3p provider/model/reasoning-selection identity and one exact external-evidence match.
- Artificial Analysis data is locally supplied, versioned, attributed, and kept out of the repository; any API credential remains outside the browser client and repository and is supplied through a process environment or secret store.
- Experimental policy, persistence, and explanations preserve the `experimental-unadmitted` state and cannot compile into a normal admission.
- Persistence proves one Session decision plus a fresh fail-closed authorization for every attempted Experimental Auto model call, including after cold load and live identity/capability drift; Manual bypasses the Auto listener.
- ADR-009 supplies the accepted possible-loss bound, but a versioned Host provider must still prove clean worktree isolation, Attempt attribution, containment, process control, and `externalSideEffects: 'none'` before every mutable Auto call; until that evidence exists, Phase 0P dogfood is read-only.
- The bounded Phase 0P A5p carrier is proven; Phase 0C still requires an admission-aware carrier probe.
- Keyless real composition passes, and a self-skipping with-key real-provider smoke passes whenever the required secret is available; a missing key is reported as skipped evidence, not a pass.

## Gates before Phase 0C preview planning

- Keep the implemented product-neutral A1 pre-assembly and A2 required-event contracts pinned and green on the declared fork.
- Preregister the initial Policy Pack taxonomy, baseline/candidate deployments, statistics, evaluator governance, and isolated datasets.
- Close A3p for the initial baseline and candidate with reproducible provider/model/reasoning-selection identity evidence.
- Extend the verified Phase 0P A5p carrier with admission-aware assertions before treating it as the Phase 0C preview carrier.
- Keep Phase 0C routing scope fixed to one decision per Session; do not introduce an unresolved objective-boundary heuristic.

## Gates before Phase B and production-release planning

- Decide the production release carrier: external plugin, upstream DSH capability, or split architecture. Phase 0C's fork preview does not settle that release decision.
- Generalize A3p and A5p into supported official-compatible A3 identity and A5 client-extension contracts.
- Define consent, minimization, retention, and deletion policy for real-use evidence.
- Decide which Recovery Capability providers and side-effect classes, if any, enter the production implementation plan.

## Current blockers

There is no implementation blocker for the bounded fast prototype. The previously identified production blockers—deployment-bound A3 identity, a distributable external-evidence contract, data-rights automation, a production carrier, full recovery evidence, and RouterBench admission—remain deferred and must not be converted back into prototype blockers. A1/A2 remain a pinned-fork dependency.

## Next action

Implement the next roadmap item selected by the maintainer, starting from the accepted MVP rather than reopening its closed acceptance boundary. Keep the preserved production-contract research worktree separate until the corresponding roadmap work is explicitly resumed.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a gate closes, or the next action changes.
- This file records current status only; it does not duplicate long-lived product requirements, full architecture, or the open-question inventory.
- Historical decisions belong in ADRs, long-lived scope and success criteria in `docs/spec.md`, and unresolved questions in `docs/open-questions.md`.
