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

## Phase 1: AA route catalog and handling-level policy — complete

Replace prototype terminology and hard-coded route assumptions with the first versioned AA-informed catalog.

### 1A. Bind Host routes to AA evidence

- Define a provider-neutral Host route identity over provider, model, and the effective request-configuration fingerprint.
- Define an explicit, versioned binding from each eligible Host route to one stable AA record in one snapshot.
- Treat effort and other provider controls as optional execution dimensions rather than universal schema fields.
- Reject fuzzy, ambiguous, stale, or configuration-crossing bindings with stable reasons.

Acceptance: mixed-provider and current local-seed fixtures cover routes with zero, one, and several execution controls; valid bindings resolve deterministically and configuration collisions, ambiguity, and silent AA-record substitution are rejected.

### 1B. Compile capability bands

- Use `light`/`standard`/`deep` in the new catalog and reserve Light/Standard/Deep plus “轻量/常规/深度” for the Phase 3 live plugin and UI migration.
- Define versioned AA score boundaries for the three bands.
- Keep the exact AA snapshot, band policy, and matched route records inspectable.

Acceptance: every eligible route belongs to exactly one band and the same snapshot plus policy produces the same catalog.

### 1C. Resolve by AA price

- Within one band, prefer the lower AA-reported price.
- Use AA-reported latency as the second comparator and stable route identity as the final comparator.
- Exclude or explicitly handle missing comparison fields; never depend on discovery order.

Acceptance: permutation tests produce the same winner and explanation for the same frozen catalog.

Phase acceptance: completed on 2026-08-21. Tasks 1–3 compile the local evidence catalog offline, assign every eligible route through `aa-route-policy/v1`, and resolve one level by AA price, AA latency, and stable route identity without changing Manual mode.

## Phase 2: Semantic Task Assessor

Replace keyword routing with a bounded LLM classifier whose versioned selection policy resolves one environment-valid route and freezes it before each call.

- Return task kind, scope, complexity, risk, verifiability, confidence, and reasons.
- Never return a concrete provider, model, or effort.
- Resolve a concrete route from the current frozen catalog without inspecting the task, then freeze it so Auto cannot recursively or mid-call reroute it.
- Map structured attributes to `light`/`standard`/`deep` with deterministic Host policy.
- Use `deep` on timeout, invalid output, low confidence, high risk, or unknown scope.

Task 4 completed on 2026-08-22: the route policy, bounded input, request budget, strict schema, confidence threshold, and valid/invalid/timeout/low-confidence contract fixtures are frozen.

Task 5 and Phase 2 completed on 2026-08-22. `task-handling-policy/v1` maps validated attributes and reason codes deterministically; one direct, tool-free, zero-retry assessor call enforces the total deadline independently of stream cooperation. Fixtures cover coding, debugging, research, writing, architecture, security, ambiguity, route incompatibility, provider failure, truncation, timeout, and caller cancellation. The runnable MVP is unchanged until Phase 3 integrates this isolated path.

## Phase 3: AA-informed Auto beta

Combine the catalog and semantic assessor into the user-facing product loop.

- Refresh the decision for each new user task at the verified pre-assembly boundary.
- Freeze one selection through provider-dependent assembly and `agent/request`.
- Show task-handling level, actual model/effort, AA snapshot, and concise reason.
- Preserve the rolling/breathing switch animation and conversation notice.
- Preserve a configured deep fallback and explicit no-route failure.
- Keep all claims explicitly AA-informed; do not claim project-benchmarked quality.

Acceptance: browser and real-provider scenarios prove Light, Standard, Deep, fallback, failure, and Manual paths; displayed, persisted, and effective request configurations agree.

Task 6 completed on 2026-08-22. `auto-decision/v1` now refreshes at the Host-owned DSH user-turn boundary and remains frozen across every step in that turn. The pinned-fork composition proves all three levels, monotonic escalation, explicit configured Deep fallback, no-route failure before dispatch, exact assembly/request/Session equality, cold reconstruction, and Manual non-interference.

Task 7 completed on 2026-08-22. Schema-v2 projections and the maintained UI use Light/Standard/Deep without publishing a prototype tier, show the actual model and optional effort, distinguish AA evidence from configured Deep fallback, and retain schema-v1 replay. Component and browser fixtures preserve model-only, effort-only, combined, and level-only transitions, localized snapshots, and the existing animation and conversation placement.

Task 8 and Checkpoint C completed on 2026-08-22. A keyless cross-repository browser fixture mounts the external plugin and proves Light, Standard, Deep, price ordering, latency tie-break, exact displayed/persisted/request equality, source-snapshot visibility, and Manual exit through the real Web and agent loop. Loader and Session fixtures retain low-confidence fallback, missing-catalog failure, cold reconstruction, and Manual non-interference. No provider credential was available for a new Phase 3 live call; this completion combines the provider-neutral vertical proof with the accepted Phase 0P real-provider dispatch evidence and makes no new provider-specific claim.

## Phase 4: Catalog refresh and distribution

Make AA data maintenance reliable without coupling the runtime to a live remote dependency.

- Define a stable acquisition method and data-rights boundary.
- Generate a versioned minimized snapshot outside the runtime path.
- Validate schema, attribution, freshness, binding changes, and rollback to the previous valid snapshot.
- Keep credentials and redistributed raw datasets out of the repository and browser client.

Acceptance: a maintainer can update the snapshot reproducibly, inspect the diff, reject malformed data, and restore the previous valid catalog.

Task 9 and Phase 4 completed on 2026-08-22. ADR-013 fixes the official Pro language-model endpoint, server-side credential boundary, default internal-only rights mode, written-license distribution gate, attribution, retention, freshness, and pinned methodology. The offline maintainer workflow derives Host identities without credential values, minimizes only reviewed bindings, exposes source, record, binding, band, and ordering changes, requires exact digest approval, atomically replaces the active seed, and verifies the rollback checksum. Synthetic fixtures cover acquisition, rejection, update, binding addition/removal/replacement, rename, tamper detection, and rollback; no live AA dependency enters runtime routing.

## Phase 4.1: Reusable Evidence Packs

Correct the completed catalog's current-Host and full-effective-configuration coupling before adaptive execution builds on it.

- Separate a full policy-eligible minimized AA Snapshot, a long-lived Binding Registry, the AA Route Policy, and one compatibility Manifest.
- Derive exact provider-scoped EvidenceRouteKeys independently of complete ExecutionFingerprints used for request audit.
- Compile the Active Catalog at runtime from current Host routes, exact bindings, the current Snapshot, and Route Policy.
- Keep mappings dormant when a route is unavailable and activate them automatically when an exact Host route appears later.
- Apply structurally valid GREEN refreshes automatically, isolate AMBER exceptions, and reject RED contract or integrity changes while retaining rollback.
- Version Runtime and Evidence Pack independently behind one local atomic activation and migration boundary.

Acceptance: routine AA metric updates require no human action; a newly configured route automatically activates when a valid dormant binding exists; execution-only defaults do not invalidate evidence; evidence-defining controls cannot collide; migration, rollback, Loader, Session, UI, and Manual non-interference checks pass. Public real-data distribution remains disabled without the ADR-013 written-license gate.

Status: complete on 2026-08-22. ADR-014 and Tasks 10–19 deliver the dependency-free Evidence Pack contracts, exact evidence identity, full eligible Snapshot compiler, long-lived Registry, runtime Active Catalog, exception-driven refresh, local atomic activation/rollback, legacy migration, and pinned Loader/Session/UI/Manual verification. ADR-015 and Phase 4.2 subsequently replace the mandatory Pro/blended-field path. Public real-data distribution remains disabled by the ADR-013 written-license gate.

## Phase 4.2: Free AA Evidence Packs — completed

Remove the Pro subscription as an operational prerequisite while retaining exact evidence identity, offline routing, and rights controls.

- Acquire every page from the official AA Free response with a user-owned server-side key.
- Retain every record with valid Intelligence plus input/output prices in Snapshot v3.
- Preserve AA-reported price components and derive one versioned 7:2:1 normalized price, substituting input price only when cache-hit price is absent.
- Resolve unchanged Light/Standard/Deep bands through Route Policy v2 and Runtime v2.
- Strictly validate and explicitly adapt valid v1 Packs without inventing legacy component prices.

Acceptance: complete on 2026-08-22. A real private Free acquisition returned 610 records across four pages; 405 policy-eligible records compiled into 295 Light, 70 Standard, and 40 Deep records. Six exact DeepSeek model/effort bindings produce three active and three dormant states for the current Host inventory, with no Active Catalog exclusion. The private Pack and rollback artifacts remain mode `0600` and ignored; runtime remains offline and public real-data distribution remains disabled.

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
