# Product roadmap

[简体中文](zh-CN/roadmap.md)

## Principle

The roadmap retains the complete architecture but gates each control plane on causal evidence. AI implementation capacity is not the limiting factor; unsupported quality claims, unsafe DSH seams, and control-plane complexity are. A phase advances only when its evidence contract passes.

## Phase 0: Critical-path DSH enablement and evidence contract

This is the highest-priority phase. Session Static Auto cannot be implemented correctly against the audited official DSH revision until two blocking Host contracts exist:

1. A scoped pre-assembly step-preparation seam carrying claimed messages and stable turn/step identity, able to freeze one context for both provider-dependent assembly and `agent/request`, and able to stop before a model call.
2. Runtime registration and compatibility handling for required plugin Session events, including schema/version validation, namespace conflict detection, cold-load registration order, missing-plugin diagnostics, and fail-closed incompatibility.

Freeze the normal product interaction as exactly two choices: Auto, or manual provider/model/reasoning selection. Define Policy Pack ownership, the absolute baseline gate, candidate non-inferiority protocol, `no-safe-route`, and the four RouterBench strategy arms.

### Phase 0A: Freeze the upstream contracts

- Write narrow, product-neutral DSH design notes or issues for the two blocking contracts. DSH Core must not learn Auto Mode route tiers or Task Assessment semantics.
- Specify lifecycle timing, cancellation, scoping, immutability, persistence, cold recovery, and failure behavior before implementation.
- Add DSH contract tests that fail on the audited revision and prove the intended behavior on a fork.
- Build one vertical plugin probe proving that the current message drives a decision before assembly, the same snapshot reaches `agent/request`, `no-safe-route` prevents a call, and required events survive cold reload.

### Phase 0B: Upstream or pin a declared fork

- Submit the pre-assembly and event-registration work as separate minimal PRs after the contract probe passes.
- If upstream review is pending or rejects the API shape, continue validation only on an exact pinned DSH fork and state that official DSH is unsupported.
- Do not treat an `agent/request`-only prototype or ignorable Session events as a product-compatible fallback.

### Phase 0P: AA-seeded Experimental Auto

This is the earliest actively routed dogfood build. It exists to validate the product loop before RouterBench admission is available. It is maintainer-only, explicit opt-in, fork-pinned, and visibly labelled `experimental-unadmitted`; it is not the Phase 0C preview and makes no quality, non-inferiority, official-compatibility, or public-support claim.

Phase 0P may proceed without the minimal Phase A admission slice only under [ADR-008](decisions/0008-external-prior-experimental-auto.md):

1. A1 and A2 remain green on the declared fork.
2. A3p binds every selectable DSH provider/model/reasoning selection to one exact external-evidence configuration; scores never transfer across explicit effort, adapter-default materialization, or provider-default omission.
3. A versioned, attributed Artificial Analysis snapshot is supplied locally without repository-bundled data, website scraping, or a client-exposed API key.
4. Deterministic Task Assessment selects an index family and deterministic Host policy selects a semantic experimental tier. The external source never chooses the final route.
5. High-risk, unknown, or low-confidence task assessment may select the strongest exactly matched experimental configuration only from a valid frozen catalog. Unmatched or identity-drifted routes, invalid evidence, and missing required Host contracts leave Auto with `no-experimental-route` and no model call.
6. A5p verifies one concrete carrier for one-operation Auto/manual control and persisted experimental explanations.
7. Routing remains one frozen decision per Session.
8. Host-declared `RecoveryCapability` is a required policy input. No experimental tier, including `strong`, may execute mutable work until possible loss is inside an ADR-007-compliant risk bound accepted in a separate decision and every effect class has sufficient attribution and recovery support. Any irreversible external effect or mutation outside that bound terminates the current Auto attempt. User intervention can switch to Manual or wait for a new execution-world declaration; confirmation cannot authorize the blocked Experimental Auto dispatch.

Acceptance:

- A maintainer can explicitly enable Experimental Auto, complete an end-to-end task on the pinned fork, inspect the actual provider/model/reasoning selection, and return to Manual mode.
- Cold reload reconstructs the same decision, external-evidence snapshot identity, effective request encoding, and `experimental-unadmitted` explanation.
- Exact-identity mismatch, unsupported effort, stale or malformed evidence, and missing A1/A2 always fail before a request. Only task-assessment fallback may select the strongest exact match, and only while the frozen catalog, exact identity, and required Host contracts remain valid.
- Negative tests prove that all irreversible external effects, every mutation outside the accepted loss bound, and insufficient attribution or recovery support terminate Experimental Auto before a call. Until a loss bound is accepted, no experimental tier—including `strong`—may execute mutable work; a confirmation action cannot reach provider dispatch.
- Repeated-step and cold-load tests prove one Session decision is reused while every attempted Experimental Auto call receives a new authorization; identity, Host-contract, evidence-freshness, provider, or Recovery Capability drift denies the call without re-routing. Switching to Manual bypasses the Auto listener and preserves the existing manual request path without consuming the claimed turn.
- Tests prove that an Artificial Analysis record does not itself become a normal admission and cannot enter the Phase 0C Effective Route Catalog.
- The repository contains no Artificial Analysis credential or redistributed ranking dataset.
- A self-skipping, credentialed real-entry smoke loads the production plugin through DSH, calls the selected provider when its key is present, and verifies the external response plus persisted `request/header` agree with provider/model/reasoning selection. Absence of the key is an explicit skip, not a pass.

Dogfood outcomes may inform RouterBench taxonomy and fixtures, but cannot be treated as held-out evidence or promoted directly into a Policy Pack admission.

### Phase 0C: Fork-based Static Auto Preview

This is the earliest user-usable Auto mode. It is a dogfood preview on the declared DSH fork, not an official-DSH compatibility release. It may begin only after:

1. The specification and applicable Proposed ADRs are accepted.
2. A1 and A2 pass their DSH contract tests on the fork and the combined vertical probe passes.
3. A minimal Phase A evidence slice admits one baseline and one candidate, and A3p binds both admissions to reproducible provider/model/reasoning-selection deployment identities. Unknown identity or drift revokes the route before Auto serves a request.
4. A5p verifies one concrete preview carrier that performs the one-operation Auto/manual choice and retrieves the persisted effective configuration and explanation.
5. The preview routing scope is frozen as one decision per Session. Objective-scoped recomputation is deferred until Host-owned objective boundaries have a separate accepted contract.

Each preview build pins the fork remote and exact post-seam commit, the initial route-identity evidence, and the preview carrier version.

The preview delivers:

- One user operation to choose Auto, while the existing manual provider/model/reasoning-selection path remains available.
- Session Static Auto for narrowly admitted task slices, with one decision made when the Session enters Auto and reused for that Session. Starting another task that needs a new automatic decision requires a new Session in Phase 0C.
- Conservative automatic candidate discovery from DSH's advisory active provider/model catalog. Explicit efforts require matching exact-route metadata; adapter-default and provider-default omission are separate reasoning selections with their own admission identities. The candidate count is not hard-coded: the preview selects only from the intersection of discovered configurations, stable identity evidence, user and capability constraints, and current preview admissions.
- At least one admitted baseline and one admitted candidate for one initial task slice. This is an evidence minimum for demonstrating selection, not a two-configuration product limit.
- Deterministic Task Assessment, plus a fixed non-recursively-routed assessor only where the A4 audit establishes a bounded and auditable preview path.
- Persisted causal decision input, effective provider/model/reasoning selection and request encoding, reason codes, concise explanations, and explicit `no-safe-route` behavior.

The preview does not claim within-turn switching, recovery, child-agent routing, community Policy Packs, online learning, or official DSH compatibility. It may expand to additional discovered configurations and task slices only when each has current preview admission evidence.

Acceptance:

- A user can select Auto once and complete supported tasks end to end on the pinned fork.
- The verified preview carrier keeps manual provider/model/reasoning selection available and can retrieve the persisted explanation for the actual request.
- DSH catalog changes refresh the deployment profile without hand-maintaining a duplicate model list.
- Tests prove that an available but unadmitted configuration is never selected automatically.
- Tests prove that unknown or changed deployment identity revokes a preview route; if no admitted baseline remains, the call stops with `no-safe-route`.
- Tests cover explicit effort, adapter-default materialization, and provider-default omission without collapsing their identities.
- Repeated steps in one Auto Session reuse the same Session Static decision; no undocumented objective-boundary heuristic triggers recomputation.
- The persisted route snapshot and explanation reconstruct the configuration actually sent.
- Missing or incompatible A1/A2 contracts fail before Auto serves a request.

### Parallel foundation audits

Before Phase B, generalize the preview-specific A3p identity evidence into A3's declared official-compatible identity contract, and generalize A5p into A5's supported client extension contract. Also close the extensible purpose/audit classification for fixed Task Assessor calls. Each must be classified as already supported, plugin-local, provider-specific, or requiring another upstream seam. Passing a fork-pinned preview path does not by itself establish an official-compatible contract.

Acceptance:

- The DSH compatibility document is pinned to source and identifies the exact supported official version or fork.
- Both blocking contracts have executable DSH and plugin contract tests.
- The vertical probe proves assembly/request snapshot identity and cold recovery of required plugin state.
- Unsupported or incompatible seams fail before Auto serves a request.
- Every other Static Auto dependency has a verified owner and no unresolved assumption is presented as existing DSH functionality.

Phase A evidence work may proceed in parallel where it does not depend on runtime seams. Phase 0C may begin when its narrower entry gates pass, but it does not close Phase 0. Phase B cannot begin as an official-compatible product implementation until the full Phase 0 exit gates pass.

## Phase A: Route Capability Bench and Policy Packs

Build the capability taxonomy, isolated calibration/validation/held-out datasets, evaluator protocol, deployment profiles, and admission lifecycle. Establish at least one admitted baseline before admitting any weaker configuration.

Acceptance: paired reports identify task slices that meet absolute and non-inferiority gates; aliases, missing fingerprints, expired evidence, and baseline failure revoke admission.

## Phase B: Official-compatible Session Static Auto

Promote and generalize the Phase 0C implementation onto the declared supported DSH contract. Complete Task Assessment, Constraint Resolver, Routing Policy, Effective Route Catalog, Route Snapshot Coordinator, explicit resolution failures, decision persistence, and transparent explanation across the admitted Phase A scope. Preserve one decision per Session unless a separate Host-owned objective-boundary contract has been accepted and passed its contract tests; do not yet claim within-turn adaptation.

Acceptance: online execution and RouterBench use the same policy; route-dependent prompt/tool assembly and the provider call consume one frozen snapshot; Auto never silently falls back to an unadmitted route.

## Phase C: Policy Scenario Bench and within-turn evidence gate

Build deterministic scenario simulation and real DSH adapter contract tests. Compare Session Static Auto against confirmed-phase Within-turn Auto, including cache loss, switching overhead, phase uncertainty, and large-turn tail work.

Acceptance: within-turn routing enters product scope only if its incremental end-to-end benefit is material and quality gates still pass. Otherwise Session Static Auto remains the product behavior while the full architecture stays documented.

## Phase D: Routing safety and Continue

Add formal Recovery Signals, persisted episodes, route floors, recovery capability declarations, failed-recovery handling, and same-Session Continue. This phase limits routing loss; it does not claim generic workspace rollback.

Acceptance: repeated failure escalates; untrusted self-report cannot release an episode; unknown mutation or external side effects block unsafe down-routing and recovery claims.

## Phase E: Isolated execution and full recovery

Add Checkpoint Provider, isolated attempts, Evidence Capsule, salvage, and restart only for side-effect classes with declared and tested recovery support.

Acceptance: fault injection proves that supported harmful effects cannot escape; unsupported effects produce an explicit stop or user-intervention state rather than a false rollback claim.

## Phase F: Child-agent constraints

Implement persistent semantic RoutingConstraints and Host conflict resolution for in-process children. External providers are supported only where their creation and switching contracts expose the required route controls.

Acceptance: parent proposals cannot bypass Host constraints; acceptance and rejection are auditable; cold recovery preserves the effective child constraints.

## Phase G: Real-use calibration

With explicit consent, data minimization, retention controls, and revocability, collect objective runtime evidence and update task distributions, admission thresholds, and Policy Packs. Real active users and successful Auto task retention are product outcomes; telemetry volume is not.

## Directions not started

- General Subagent Scheduler.
- Organization-level budget, approval, and quota platform.
- Automatic training of a Router model.
- Plugin marketplace or general model-ranking service.
- Automatic rollback for undeclared or unsupported side effects.
