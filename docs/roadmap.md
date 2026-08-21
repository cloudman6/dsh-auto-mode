# Product roadmap

[简体中文](zh-CN/roadmap.md)

## Principle

Build from the accepted Phase 0P MVP into a useful AA-informed Auto product. Artificial Analysis supplies external capability, price, and latency conclusions; DSH Auto Mode supplies task understanding, deterministic routing, Host integration, transparency, and later recovery. An in-house model benchmark is not a prerequisite.

Each phase must produce a usable vertical slice and keep Manual unchanged.

## Phase 0: Auto loop MVP — complete

Delivered on the pinned DSH fork:

- one-operation Auto/manual choice;
- different tasks can select different model/effort configurations;
- persisted selection equals the effective request;
- visible model/effort changes and routing explanations;
- Manual non-interference;
- local, Git-ignored AA seed and explicit experimental labeling.

Acceptance: completed and accepted by the maintainer on 2026-08-18.

## Phase 1: AA route catalog and user-facing levels

Replace prototype terminology and hard-coded route assumptions with the first versioned AA-informed catalog.

### 1A. Bind Host routes to AA evidence

- Define a provider-neutral Host route identity over provider, model, and the effective request-configuration fingerprint.
- Define an explicit, versioned binding from each eligible Host route to one stable AA record in one snapshot.
- Treat effort and other provider controls as optional execution dimensions rather than universal schema fields.
- Reject fuzzy, ambiguous, stale, or configuration-crossing bindings with stable reasons.

Acceptance: mixed-provider and current local-seed fixtures cover routes with zero, one, and several execution controls; valid bindings resolve deterministically and configuration collisions, ambiguity, and silent AA-record substitution are rejected.

### 1B. Compile capability bands

- Replace `fast`/`standard`/`strong` with `light`/`standard`/`deep` internally and “轻量/常规/深度” in Chinese UI.
- Define versioned AA score boundaries for the three bands.
- Keep the exact AA snapshot, band policy, and matched route records inspectable.

Acceptance: every eligible route belongs to exactly one band and the same snapshot plus policy produces the same catalog.

### 1C. Resolve by AA price

- Within one band, prefer the lower AA-reported price.
- Use AA-reported latency as the second comparator and stable route identity as the final comparator.
- Exclude or explicitly handle missing comparison fields; never depend on discovery order.

Acceptance: permutation tests produce the same winner and explanation for the same frozen catalog.

## Phase 2: Semantic Task Assessor

Replace keyword routing with a fixed, bounded LLM classifier.

- Return task kind, scope, complexity, risk, verifiability, confidence, and reasons.
- Never return a concrete provider, model, or effort.
- Run on a fixed configuration that Auto cannot recursively route.
- Map structured attributes to `light`/`standard`/`deep` with deterministic Host policy.
- Use `deep` on timeout, invalid output, low confidence, high risk, or unknown scope.

Acceptance: a versioned fixture suite covers representative coding, research, writing, architecture, security, and ambiguous tasks; malformed or uncertain assessments deterministically fall back to `deep`.

## Phase 3: AA-informed Auto beta

Combine the catalog and semantic assessor into the user-facing product loop.

- Refresh the decision for each new user task at the verified pre-assembly boundary.
- Freeze one selection through provider-dependent assembly and `agent/request`.
- Show task-handling level, actual model/effort, AA snapshot, and concise reason.
- Preserve the rolling/breathing switch animation and conversation notice.
- Preserve a configured deep fallback and explicit no-route failure.
- Keep all claims explicitly AA-informed; do not claim project-benchmarked quality.

Acceptance: browser and real-provider scenarios prove Light, Standard, Deep, fallback, failure, and Manual paths; displayed, persisted, and effective request configurations agree.

## Phase 4: Catalog refresh and distribution

Make AA data maintenance reliable without coupling the runtime to a live remote dependency.

- Define a stable acquisition method and data-rights boundary.
- Generate a versioned minimized snapshot outside the runtime path.
- Validate schema, attribution, freshness, binding changes, and rollback to the previous valid snapshot.
- Keep credentials and redistributed raw datasets out of the repository and browser client.

Acceptance: a maintainer can update the snapshot reproducibly, inspect the diff, reject malformed data, and restore the previous valid catalog.

## Phase 5: Adaptive execution

Use runtime evidence to correct an initially insufficient level.

- Add formal failure and progress signals.
- Escalate `light → standard → deep` on deterministic evidence.
- Reassess only at explicit task or phase boundaries.
- Keep down-routing disabled until switching value and phase evidence are understood.
- Record every escalation and explanation in the Session.

Acceptance: repeated failures and capability loss escalate or stop; a model's self-report alone cannot trigger a switch or close an unresolved problem.

## Phase 6: Recovery

Add Continue first, then isolation-backed Salvage and Restart only for explicitly supported effect classes.

Acceptance: fault injection proves each claimed action preserves user-owned and other-agent work; unsupported effects stop or request intervention instead of pretending to roll back.

## Phase 7: Child agents and cross-agent adapters

- Let parent agents propose semantic task constraints, not concrete model bypasses.
- Route in-process children through the same Host policy.
- Add Codex and Claude Code adapters only where their creation and switching APIs expose the required control.

Acceptance: parent proposals cannot bypass user and Host constraints; child selections remain explainable and persistent.

## Phase 8: Real-use calibration and ecosystem

- With explicit consent, collect minimized objective signals such as selected level, route, latency, failure, escalation, and Manual takeover.
- Use dogfood to tune task mapping and AA band boundaries without treating user choices as correct labels.
- Support community-maintained evidence bindings and policy profiles with versioning and provenance.
- Decide the official DSH-compatible or fork-based release carrier.

Acceptance: updates are reversible and attributable; real active-user retention remains the product metric.

## Optional evaluation track

RouterBench is no longer an Auto admission gate. Focused evaluation suites may be added later to compare policies, detect regressions, or study specific model slices, but lack of an in-house model benchmark does not block Phases 1–4.

## Explicit non-goals

- Claiming that AA proves task-specific optimality or safety.
- Building a general model-ranking service.
- Organization-level budget, approval, queue, or quota scheduling.
- Training a foundation model for routing.
- Automatic rollback for undeclared effects.
