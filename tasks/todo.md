# Task list: Phase 0P AA-seeded Experimental Auto

[简体中文](todo.zh-CN.md)

## Task 1: Freeze exact routes and A3p mappings

**Description:** Inventory the pinned fork's active provider/model/reasoning selections, compute their exact intersection with Artificial Analysis configuration records, and exclude every selection whose deployment identity cannot be bound.

**Acceptance criteria:**
- [x] Every inventoried explicit selection has an exact provider/model/reasoning-selection key and reproducible fingerprint evidence.
- [x] Explicit effort, adapter-default, and provider-default identities are not collapsed.
- [x] Unmatched or unverifiable configurations are explicitly excluded.

**Verification:**
- [x] Re-run the inventory from the pinned fork and obtain the same normalized identities.
- [x] Review the evidence matrix with the project Code Review Skill.

**Dependencies:** None

**Files likely touched:** `docs/dsh-integration.md`, `docs/evidence/phase-0p-route-inventory.md`, Chinese translations

**Estimated scope:** Medium

## Task 2: Freeze the external-prior and data-boundary contract

**Description:** Define the local snapshot schema, Artificial Analysis endpoint and field mapping, prompt/index semantics, pagination coverage, source and policy versions, canonical content digest, freshness, attribution, heuristic score boundaries, access method, and public-data-rights stop condition.

**Acceptance criteria:**
- [ ] Snapshot and policy schemas have explicit versions and fail-closed validation rules.
- [ ] Retrieval metadata and a canonical full-content digest identify the exact snapshot even when an upstream index version omits patch revisions or does not version every index family.
- [ ] The durable `ExternalRoutePriorSnapshotEvent` schema records source/schema/query/rights-policy versions, pagination completeness, attribution, retrieval time, content digest, and only normalized exact-match records; raw responses, unmatched rows, credentials, headers, prompts, and code are excluded.
- [ ] The initial index-family and `fast`/`standard`/`strong` heuristic rules are deterministic and reviewable.
- [ ] API credentials, fetched ranking data, attribution, and redistribution boundaries are unambiguous.

**Verification:**
- [ ] Synthetic valid, stale, incomplete, and malformed examples have expected outcomes.
- [ ] Maintainer explicitly approves API access and dependency additions before Task 3 or 4 implementation.
- [x] Maintainer accepts the ADR-007-compliant possible-loss bound in ADR-009.

**Dependencies:** Task 1

**Files likely touched:** `docs/routing-policy.md`, `docs/architecture.md`, `docs/decisions/`, Chinese translations

**Estimated scope:** Medium

## Checkpoint: Evidence foundation

- [ ] Tasks 1-2 are complete and reviewed.
- [ ] No route relies on name-only or inferred-effort matching.
- [ ] Required external access and dependencies are explicitly authorized.

Tasks 3-7 remain read-only and fail closed for mutable execution. Tasks 8-9 separately accept the concrete provider design and prove its executable ADR-009 capability before mutable enablement, avoiding a dependency cycle with this checkpoint.

## Task 3: Establish the implementation scaffold and domain types

**Description:** Create the accepted TypeScript/ESM package and test harness, with discriminated experimental and admitted evidence/catalog types.

**Acceptance criteria:**
- [ ] Build, test, lint, and typecheck commands are documented and green.
- [ ] Type boundaries prevent `experimental-unadmitted` evidence from satisfying `RouteAdmission`.
- [ ] No network access or production ranking data is required by tests.

**Verification:**
- [ ] Focused type and unit tests pass.
- [ ] Project Code Review Skill returns `PASS` before commit.

**Dependencies:** Task 2 and explicit dependency authorization

**Files likely touched:** `package.json`, `tsconfig.json`, `src/domain/`, `tests/domain/`, `docs/spec.md`

**Estimated scope:** Medium

## Task 4: Implement snapshot loading and exact matching

**Description:** Load a locally supplied external-prior snapshot, validate provenance and freshness, and intersect exact external records with DSH route identities.

**Acceptance criteria:**
- [ ] Invalid, stale, unknown-version, or unmatched inputs fail with stable reason codes.
- [ ] Exact effort/default encodings and deterministic tie-breaking are covered.
- [ ] No credential or fetched dataset is persisted in the repository.

**Verification:**
- [ ] Unit, schema, property, and secret-scan tests pass with synthetic fixtures.
- [ ] Project Code Review Skill returns `PASS` before commit.

**Dependencies:** Tasks 1 and 3

**Files likely touched:** `src/external-priors/`, `src/catalog/`, `tests/external-priors/`

**Estimated scope:** Medium

## Task 5: Implement deterministic assessment and policy

**Description:** Map bounded task attributes to an Artificial Analysis index family and select an experimental tier using the frozen catalog, Host-declared `RecoveryCapability`, execution-world effect classes, and versioned heuristic policy.

**Acceptance criteria:**
- [ ] Same input snapshot and policy version always produce the same decision and explanation.
- [ ] High-risk, unknown, or low-confidence task assessment chooses the strongest exact match from a valid catalog; unmatched or drifted routes and invalid evidence exit with `no-experimental-route` before a call.
- [ ] No experimental tier, including `strong`, may execute mutable work unless possible loss stays inside ADR-009 and a versioned Host provider proves clean worktree isolation, Attempt attribution, containment, process control, and `externalSideEffects: 'none'` for every relevant effect class.
- [ ] Any irreversible external effect, mutation outside the accepted bound, or insufficient attribution/recovery support terminates the current Experimental Auto attempt with `no-experimental-route`, regardless of impact level. User intervention may switch to Manual or wait for new execution-world facts; it cannot authorize the denied dispatch.
- [ ] Every result carries `experimental-unadmitted` and source-snapshot identity.

**Verification:**
- [ ] Golden-decision, boundary, permutation, property, and negative Recovery Capability tests cover `fast`, `standard`, and `strong` at every impact level, loss-bound overflow, insufficient attribution/recovery, and irreversible external effects.
- [ ] Project Code Review Skill returns `PASS` before commit.

**Dependencies:** Task 4

**Files likely touched:** `src/assessment/`, `src/policy/`, `tests/policy/`

**Estimated scope:** Medium

## Checkpoint: Pure policy

- [ ] Tasks 3-5 are complete and all pure tests pass without DSH or network access.
- [ ] Experimental evidence cannot compile or convert into admitted evidence.

## Task 6: Persist and reconstruct Phase 0P decisions

**Description:** Register and project the required Session events for routing-attempt start, preparation failure or termination, external snapshot, catalog, assessment, Host-declared Recovery Capability reference, the single Session decision and resolution, per-call authorization facts, request encoding, and explanation. In Phase 0P the producer persists the minimized `ExternalRoutePriorSnapshotEvent` before the Experimental Route Catalog that references it.

**Acceptance criteria:**
- [ ] Event schemas are versioned, validated, backward-referenced, and reconstructable after cold load.
- [ ] The external-prior event is durably appended before its catalog consumer, and missing/incompatible prior evidence fails before catalog compilation or provider dispatch.
- [ ] Invalid pre-catalog input appends a safe, backward-referenced `RoutingPreparationFailedEvent`; it stores no raw prior but remains sufficient for cold reconstruction and UI failure rendering.
- [ ] Cancellation appends `RoutingPreparationTerminatedEvent`; cold projection marks any orphan start or partial chain interrupted, and the controller appends the recovery terminal event after load and before retry. Retry is allowed only when no complete Session decision exists.
- [ ] Admitted and experimental success/failure events remain discriminated; cold reconstruction never fabricates an `AdmissionIdentity` or collapses `no-experimental-route` into `no-safe-route`.
- [ ] Phase 0P cold reconstruction yields at most one complete Session decision and preserves every step-specific `ModelCallAuthorizationEvent`.
- [ ] Claimed inputs persist ordered stable `MessageId` values from A1, not nonexistent pre-append `user/message` EventRefs or duplicated raw content; successful execution later appends the same identities.
- [ ] Missing or incompatible registrations fail before execution.
- [ ] Sensitive prompt/code content and API credentials are absent from persisted facts.

**Verification:**
- [ ] Synthetic persistence and cold-reload contract tests pass on the pinned fork, including cancellation or interruption after every event boundary in the preparation chain.
- [ ] Project Code Review Skill returns `PASS` before commit.

**Dependencies:** Tasks 3 and 5

**Files likely touched:** `src/session/`, `tests/session/`, DSH probe fixtures

**Estimated scope:** Medium

## Task 7: Integrate the frozen decision with the DSH Host

**Description:** Use A1 to create at most one Phase 0P decision per Session. Manual mode makes the Auto listener return control without rejection or authorization so the existing manual path remains unchanged. Before every Experimental Auto model call, including after cold load, capture current Host-contract, provider, exact deployment/reasoning identity, evidence-freshness, Recovery Capability, and effect-class facts; persist a new authorization and apply the configuration only when it authorizes the call.

**Acceptance criteria:**
- [ ] Repeated steps and cold load reuse exactly one Session decision but create a fresh authorization and RouteSnapshot for each attempted call.
- [ ] Snapshot mismatch or drift in identity, Host contracts, evidence freshness, provider, or Recovery Capability denies the current Experimental Auto call before assembly/provider dispatch and never triggers an implicit re-decision.
- [ ] A denied authorization persists the observed and required contract versions, provider availability, expected and observed deployment identity, evidence check/expiry, Recovery Capability reference, effect classes, and loss-bound version required to reconstruct the decision.
- [ ] Manual mode bypasses the Auto listener and continues through existing Host/provider validation; switching to Manual neither creates a denied authorization nor rejects or consumes the turn.

**Verification:**
- [ ] Pinned-fork integration and combined vertical contract tests pass.
- [ ] A real DSH Loader plus app/process composition test loads the plugin through its production entry point and records a keyless, headless Session JSONL transcript proving the assembled request and persisted route snapshot agree.
- [ ] Negative composition controls prove missing plugin registration, missing A1/A2, invalid evidence, and insufficient Recovery Capability stop before provider dispatch.
- [ ] A confirmation/intervention action cannot bypass a denied authorization or directly reach provider dispatch.
- [ ] A manual-switch control proves the same claimed message reaches the existing manual request path exactly once.
- [ ] Project Code Review Skill returns `PASS` before commit.

**Dependencies:** Tasks 1, 5, and 6

**Files likely touched:** `src/plugin/`, `src/host/`, `tests/integration/`

**Estimated scope:** Medium

## Task 8: Freeze and accept the execution-world provider design

**Description:** Audit the actual DSH production composition and propose a concrete provider mechanism before implementation. Freeze every capability and tool entry that mutable Experimental Auto can reach, the executor where each decision is enforced, the runner/platform isolation mechanism, supported operating systems, dependency and service ownership, credential boundary, persistent evidence contract, and fail-closed behavior. Record the choice in a Proposed ADR; implementation cannot start until the maintainer accepts it and explicitly authorizes every new dependency, external service, or DSH Core seam.

**Acceptance criteria:**
- [ ] The production inventory covers in-process filesystem and Web tools, foreground and background shell or terminal execution, Code Mode nested dispatch, hooks, subagents, direct capability callers, and every alternate executor discovered in the pinned DSH composition.
- [ ] Each inventory entry names the exact enforcement point and is either covered by the provider or disabled for mutable Experimental Auto. Schema omission, prompt instructions, or listener order are not treated as enforcement.
- [ ] The design selects a concrete platform/runner and explains file, network, process, mount, and environment isolation; existing DSH file-only sandbox claims and E2B limitations are not promoted into broader capability evidence.
- [ ] The design specifies supported operating systems and a fail-closed result for unsupported, partially enforced, missing, stale, or misconfigured providers.
- [ ] The design specifies an option-aware read-only Git wrapper/allowlist, fixed environment, disabled output/external-helper paths, and before/after repository-state evidence.
- [ ] The design specifies a durable, versioned, causally ordered Attempt boundary and attribution journal, immutable identity, cold-load reconstruction, live reconciliation, interruption semantics, and safe persisted fields.
- [ ] Ownership and composition are explicit for plugin code, DSH extensions, platform runner, new dependencies, external services, and credential scrubbing. Every change covered by a project stop-and-ask boundary has explicit maintainer authorization.

**Verification:**
- [ ] Source audit maps the inventory to the current official DSH default branch and pinned fork, including direct and alternate callers.
- [ ] Threat-model review traces file escape, network/exfiltration, ambient credentials, process lifetime, Git helper/option bypass, concurrent mutation, and crash/cold-load paths to an executor-level denial or fail-closed state.
- [ ] Project Code Review Skill and required fresh-context independent review both return `PASS`; the maintainer then explicitly accepts the provider ADR.

**Dependencies:** Tasks 6 and 7

**Files likely touched:** `docs/architecture.md`, `docs/dsh-integration.md`, `docs/recovery.md`, `docs/decisions/`, production capability inventory and Chinese translations

**Estimated scope:** Large

## Task 9: Implement and prove the accepted ADR-009 execution-world provider

**Description:** Implement the accepted, versioned Host execution-world provider for the isolated-worktree envelope. The provider authorizes only attributable filesystem mutations inside one clean task worktree, prevents excluded effects before they occur at every inventoried executor, contains child processes, and supplies reconstructable capability and attribution facts to each model-call authorization.

**Acceptance criteria:**
- [ ] Startup refuses a dirty or non-isolated worktree and records a stable Attempt boundary before any mutable tool execution.
- [ ] Canonical-path enforcement prevents traversal, symlink, hard-link, mount, and out-of-root escape before the effect; after-the-fact detection alone is rejected.
- [ ] Git index, object database, configuration, references, history, linked-worktree administration, worktree state changed through Git, and remotes cannot be mutated. Read-only Git inspection runs only through the accepted option-aware wrapper with fixed environment, optional locks/index refresh disabled, and output, pager, hook, external-diff, and text-conversion execution paths denied.
- [ ] Every inventoried Web, filesystem, shell/terminal, background, Code Mode, hook, subagent, direct, and alternate entry enforces the accepted policy at its executor; uncovered entries are unavailable. Agent-issued networked or unclassified commands, dependency or system installation, external APIs, account or operating-system changes, and other external effects are denied before execution. Model-provider dispatch remains a separately authorized Host action.
- [ ] Child processes receive only the accepted scrubbed environment, cannot read ambient credentials, and cannot exfiltrate canary secrets through any inventoried output or network path.
- [ ] Allowed tool processes and descendants are contained and quiescent before the Attempt is considered stopped; process escape or leakage fails closed.
- [ ] The provider durably appends a versioned stable Attempt boundary and causally ordered attribution journal before publishing the immutable `RecoveryCapability` reference. Every created, modified, and deleted path is attributable; concurrent or unknown mutation invalidates mutable authorization.
- [ ] Cold load reconstructs the journal and capability reference without process-memory state, marks orphan/interrupted boundaries fail closed, reconciles the live worktree before reauthorization, and persists drift or terminal evidence in causal order.
- [ ] Failure preserves the worktree and evidence for inspection without claiming automatic rollback, `salvage`, or `restart`.

**Verification:**
- [ ] Executor-level fault injection covers every frozen production entry point and alternate caller, including Web requests/SSRF, foreground and background shell or terminal work, Code Mode nested dispatch, hooks, subagents, direct capability calls, package or system installation, unclassified commands, ambient-credential canary exfiltration, and child-process escape. The external observer verifies no denied request or state change occurred.
- [ ] Filesystem fault injection covers dirty start, path traversal, symlink, hard-link, mount and canonical-path escape, concurrent mutation, and attribution drift before effect.
- [ ] Git fault injection covers add, restore, clean, checkout/switch, commit, reset, ref/tag/branch/worktree/config/object-database/remote mutation plus output-file, pager, hook, external-diff, textconv, and arbitrary-option bypasses. Positive inspection proves the fixed environment and full repository/worktree state are unchanged.
- [ ] Journal tests interrupt or crash after every durable boundary, cold load without prior process memory, compare the reconstructed journal with the live worktree, and prove stale, orphaned, reordered, missing, or drifted evidence fails closed.
- [ ] Positive tests cover attributable create, modify, and delete effects plus accepted read-only Git inspection.
- [ ] Real Loader/app/process composition exercises every enabled production executor, proves policy consumes the persisted capability reference and journal, and refuses mutable dispatch when the provider or inventory is absent, incompatible, stale, partially enforced, or reports drift.
- [ ] Project Code Review Skill and required fresh-context independent review both return `PASS` before commit.

**Dependencies:** Task 8, its Accepted provider ADR, and explicit authorization for every selected new dependency, external service, or DSH Core seam

**Files likely touched:** `src/execution-world/`, `src/host/`, `tests/execution-world/`, `tests/integration/`, capability and evidence documentation

**Estimated scope:** Large

## Task 10: Close A5p with a concrete client carrier

**Description:** Add explicit Experimental Auto/manual control and render the actual persisted selection, source snapshot, and unadmitted explanation in the verified DSH client surface.

**Acceptance criteria:**
- [ ] One user operation selects Experimental Auto and Manual remains directly available.
- [ ] Displayed configuration and explanation come from persisted Session facts and survive reload.
- [ ] The carrier cannot present the route as admitted, safe, or officially supported.

**Verification:**
- [ ] Client seam probe, component tests, and browser end-to-end checks pass.
- [ ] If Web is selected, browser snapshots cover Auto, Manual, persisted explanation after reload, preparation failure, and denied per-call `no-experimental-route` states rendered from Session facts.
- [ ] Project Code Review Skill returns `PASS` before commit.

**Dependencies:** Tasks 6 and 7

**Files likely touched:** verified DSH client-plugin files, `tests/client/`, `docs/dsh-integration.md`

**Estimated scope:** Medium

## Checkpoint: Integrated path

- [ ] Tasks 6-10 pass pinned-fork, cold-load, fault-injection, and client acceptance tests.
- [ ] Actual request configuration equals the persisted and displayed route snapshot.

## Task 11: Package and prove the dogfood build

**Description:** Run a secret-free end-to-end probe, create the local maintainer installation/runbook, and record exact build evidence without publishing a public release.

**Acceptance criteria:**
- [ ] A runnable keyless example exercises the real plugin composition and emits an auditable assembled transcript before the credentialed maintainer dogfood run.
- [ ] A self-skipping with-key smoke uses the real Loader/app entry and selected provider; when the key exists it verifies the external response and persisted `request/header` agree on provider/model/reasoning selection, and when absent it reports an explicit skip rather than pass.
- [ ] Maintainer completes an Experimental Auto task, inspects the explanation, cold reloads, and switches to Manual.
- [ ] Build pins plugin, DSH fork, carrier, external snapshot, and policy versions.
- [ ] Status and evidence state all excluded claims and remaining Phase 0C gates.

**Verification:**
- [ ] Full focused test suite, typecheck, lint, documentation, secret scan, keyless vertical probe, and available with-key smoke pass.
- [ ] Final project Code Review Skill returns `PASS` before commit.

**Dependencies:** Tasks 1-10

**Files likely touched:** `docs/runbook/`, `docs/evidence/`, `PROJECT_STATUS.md`, README navigation and translations

**Estimated scope:** Medium

## Checkpoint: Phase 0P ready

- [ ] All task acceptance criteria and reviews pass.
- [ ] Repository and Git history contain no Artificial Analysis secret or redistributed dataset.
- [ ] Phase 0C remains blocked on RouterBench admission and its existing release-quality gates.
