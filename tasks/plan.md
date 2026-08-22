# Implementation plan: AA-informed post-MVP Auto

[简体中文](plan.zh-CN.md)

## Objective

Evolve the accepted Phase 0P MVP into an AA-informed Auto beta. The implementation classifies each task into Light, Standard, or Deep; binds each eligible effective DSH route explicitly to one stable AA evidence record; and chooses the lower normalized AA-derived price within the selected level, using AA latency and stable Host route identity as tie-breaks.

## Accepted architecture decisions

- ADR-011 succeeds ADR-010, retaining its removal of Benchmark admission and latency-first optimization while replacing the mandatory four-field matching key.
- AA is the external source for capability, price, and latency conclusions.
- A versioned assessor policy resolves and freezes one environment-valid classifier route; the Task Assessor provides structured task attributes and deterministic Host policy owns the final level and user-task route.
- Host route identity is independent of AA record identity; variant and effort are optional provider dimensions.
- Manual mode and the accepted model/effort transition UX remain unchanged.

## Dependency graph

```text
Host route identity, AA evidence binding, and fixtures
        ↓
AA catalog schema and binding validation
        ↓
capability-band compiler and price-first resolver
        ↓
resolved-and-frozen semantic Task Assessor
        ↓
end-to-end Auto integration and UI terminology
        ↓
dogfood and snapshot-refresh workflow
```

## Phase 1: AA catalog foundation

Status: complete on 2026-08-21.

### Task 1: Bind Host route identity to AA evidence

Define the effective Host route identity, stable configuration fingerprint, and explicit versioned binding to one AA record. Cover mixed-provider routes with zero, one, and several execution controls. Do not change live routing yet.

### Task 2: Compile the local AA catalog

Load the Git-ignored seed, join it to DSH route inventory through validated bindings, exclude invalid matches, and persist snapshot plus binding-rule versions.

### Task 3: Assign levels and resolve price-first

Compile Light/Standard/Deep bands from versioned AA boundaries. Resolve one level by AA price, AA latency, and stable route identity.

### Checkpoint A

The pure catalog pipeline is deterministic, secret-free, independent of live AA access, and does not change Manual mode.

## Phase 2: Semantic assessment

### Task 4: Freeze the Task Assessor contract

Status: complete on 2026-08-22.

Define structured attributes, bounded input, a versioned environment-aware route policy, per-call route freezing, timeout, validation, confidence threshold, and Deep fallback.

### Task 5: Implement the resolved assessor and level mapper

Status: complete on 2026-08-22.

Call the resolved-and-frozen assessor outside Auto recursion and map validated output to Light/Standard/Deep with deterministic reason codes. Cover representative fixture tasks and all fallback paths.

### Checkpoint B

Status: complete on 2026-08-22.

The assessor never emits a concrete route; repeated structured inputs map to the same level; timeout, invalid output, uncertainty, and high risk select Deep.

## Phase 3: Product integration

### Task 6: Integrate one frozen decision path

At the verified pre-assembly boundary, combine assessment, catalog, constraints, and resolver. Apply the same selection to assembly, `agent/request`, Session facts, and UI projection.

Status: complete on 2026-08-22. `auto-decision/v1` refreshes once per DSH user turn, revalidates current Host routes, escalates monotonically, distinguishes AA evidence from configured fallback, fails explicitly without a valid route, and survives required-event cold reconstruction.

### Task 7: Migrate user-facing terminology and explanations

Replace prototype labels with Light/Standard/Deep and 轻量/常规/深度. Show AA-matched versus configured-fallback reasons while preserving rolling/breathing animations and conversation placement.

Status: complete on 2026-08-22. Schema-v2 projections omit the prototype tier, while the maintained selector and conversation facts display localized handling levels, actual model and optional effort, and AA or configured Deep fallback basis. Existing schema-v1 Sessions retain a legacy read path.

### Task 8: Prove Auto and Manual end to end

Exercise all three levels, price ordering, latency tie-break, low-confidence fallback, missing-catalog failure, Session reconstruction, and Manual non-interference in browser and available real-provider scenarios.

Status: complete on 2026-08-22. The keyless cross-repository browser fixture reaches Light, Standard, Deep, and Manual through the real Web and agent loop, proves same-level price and latency ordering, and requires the displayed route and AA snapshot, persisted selection, and effective request configuration to agree. Loader and Session fixtures cover fallback, failure, and cold reconstruction. No provider credential was available for a new Phase 3 live call, so no new provider-specific result is claimed.

### Checkpoint C

Displayed, persisted, and effective request routes agree for every path. Public text says AA-informed and makes no Benchmark-quality claim.

Status: complete on 2026-08-22. The pinned support matrix and all schema and policy versions are recorded in `PROJECT_STATUS.md`.

## Phase 4: Snapshot maintenance

### Task 9: Define the refresh workflow

Choose the stable AA acquisition method and rights boundary, validate and minimize the snapshot, inspect changes, and support restoring the previous valid snapshot. This task requires explicit approval before adding an external dependency or remote service.

Status: complete on 2026-08-22. ADR-013 accepts an offline `aa-snapshot-refresh/v1` workflow with `internal-only` as the default rights mode and written AA permission required before redistributing real machine-readable metrics. The maintainer CLI derives credential-free Host identities, acquires the pinned Pro endpoint into private files, prepares deterministic minimized candidates and complete diffs, requires exact digest approval, atomically applies the reviewed seed, and verifies rollback integrity. Ninety-nine offline tests pass; only synthetic AA-shaped fixtures and placeholder examples are tracked.

## Phase 4.1: Reusable Evidence Packs

Status: complete on 2026-08-22. ADR-014, Tasks 10–19, and Checkpoints D1–D3 are implemented and verified; Phase 5 is now active.

### Capability map

| Module ID | Responsibility | Depends on |
|---|---|---|
| `evidence-pack-contract` | Independent Snapshot, Binding Registry, Route Policy, Manifest, compatibility, and failure schemas | ADR-014 |
| `evidence-route-identity` | Provider-scoped EvidenceRouteKey plus separate complete ExecutionFingerprint | `evidence-pack-contract` |
| `eligible-aa-snapshot` | Retain every policy-eligible minimized AA record from the complete pinned acquisition | `evidence-pack-contract` |
| `binding-registry` | Long-lived exact mappings, provider normalization rules, dormant and quarantine behavior | `evidence-route-identity`, `eligible-aa-snapshot` |
| `active-catalog` | Derive current eligible routes from Host inventory, Registry, Snapshot, and Route Policy | `binding-registry` |
| `exception-refresh` | GREEN automatic apply, AMBER isolation, RED rejection, deterministic report and rollback | `eligible-aa-snapshot`, `binding-registry`, `active-catalog` |
| `package-update` | Runtime/Evidence Pack compatibility and atomic local activation boundary | `evidence-pack-contract`, `exception-refresh` |
| `seed-migration` | Explicit legacy seed conversion without changing historical Session facts | `active-catalog`, `package-update` |
| `evidence-pack-e2e` | Runtime, Loader, Session, UI, rollback, and Manual non-interference proof | all preceding modules |

Build order: contract → identity and snapshot → registry → active catalog → refresh → package update → migration → end-to-end proof.

### Task 10: Accept the Evidence Pack decision

Completed. ADR-014 freezes component ownership, exact identity rules, exception classes, distribution boundary, and migration consequences.

### Task 11: Implement Evidence Pack contracts — completed

Add independently validated and deterministically serialized Snapshot, Binding Registry, Route Policy, and Manifest schemas. Define component digests, Runtime compatibility, rights mode, and stable failure codes.

### Task 12: Separate evidence and execution identities — completed

Add versioned provider normalization rules that derive exact EvidenceRouteKeys while retaining complete ExecutionFingerprints for request equality and audit. Execution-only defaults must not invalidate evidence; evidence-defining controls must not collide.

### Task 13: Build the full eligible AA Snapshot — completed

Process every page of one pinned acquisition and retain every record with the policy-required capability and price fields. Keep nullable latency behavior, stable-ID uniqueness, source bounds, and `internal-only` controls.

### Task 14: Implement the long-lived Binding Registry — completed

Validate exact key-to-record mappings independently of current Host availability and one snapshot ID. `aa-binding-candidate-compiler/v1` turns reviewed stable-record declarations into dormant-capable bindings automatically when the exact record exists and key is unoccupied; identical bindings are reused, while missing, conflicting, or ambiguous declarations are isolated. Names, slugs, similarity, and latest-record guesses remain forbidden.

### Task 15: Derive the runtime Active Catalog — completed

Join current materialized Host routes, exact Registry keys, current Snapshot records, and Route Policy. Keep complete execution fingerprints in active entries and isolate invalid or unmatched routes with stable reasons.

### Task 16: Automate exception-driven refresh — completed

Classify diffs as GREEN, AMBER, or RED. Automatically and atomically apply valid GREEN updates, isolate AMBER records or bindings while advancing unrelated valid evidence, reject RED updates, and preserve deterministic reports and rollback.

### Task 17: Establish Runtime/Evidence Pack update boundaries — completed

Define separately versioned local artifacts with one compatibility manifest and atomic pair activation. The default implementation remains local and dependency-free; a public update service, release workflow, or real Evidence Pack distribution requires the existing explicit authority and rights gates.

### Task 18: Migrate legacy catalog seeds — completed

Provide an explicit, deterministic conversion from the current combined seed to Snapshot, Registry, and Manifest inputs. Preserve legacy Session replay and reject mappings that cannot be converted without inference.

### Task 19: Prove the complete path — completed

Cover full acquisition, dormant activation, identity separation, all refresh classes, rollback, migration, offline runtime, all handling levels, exact request equality, cold Session reconstruction, UI evidence details, and Manual non-interference.

### Checkpoint D1: Contract

ADR-014 is Accepted; Tasks 11–12 pass focused contract and collision tests; canonical and localized documents agree.

### Checkpoint D2: Automated evidence

Tasks 13–16 prove routine AA updates need no human action and a newly configured route automatically activates when an exact dormant binding exists.

### Checkpoint D3: Installable boundary

Tasks 17–19 prove one compatible Runtime/Evidence Pack pair can be atomically activated and rolled back locally. Public real-data distribution remains a separate written-license gate.

## Phase 4.2: Free AA Evidence Packs

Status: completed on 2026-08-22 under Accepted ADR-015.

### Dependency graph

```text
Free-shaped acquisition contract
        ↓
Snapshot v3 normalized-price contract
        ↓
Route Policy v2 and Active Catalog
        ↓
Runtime v2 compatibility migration
        ↓
private refresh, activation, and runtime proof
```

### Task 20: Accept the Free evidence decision

Record the Free endpoint, normalized-price formula, eligibility, missing-data, rights, exact-binding, compatibility, and distribution boundaries in ADR-015.

### Task 21: Acquire the complete Free dataset

Add a private Evidence Pack fetch command that follows every Free page, accepts Free/Pro/Commercial caller tiers, validates the external envelope and resource bounds, and never persists or reports the key or remote error body.

### Task 22: Build Snapshot v3 and Route Policy v2

Retain every record with a valid Intelligence score plus input/output prices. Preserve raw comparison inputs and derive a 7:2:1 cache-hit/input/output normalized price, substituting input price only when cache-hit price is absent. Keep nullable latency and the existing handling-level boundaries.

### Task 23: Preserve compatible local operation

Advance the Runtime compatibility contract and migrate valid v1 packs explicitly. Preserve legacy Pro blended evidence with a visible transition basis, keep historical Session facts unchanged, and require future Free refreshes to replace the compatibility representation.

### Task 24: Prove the complete Free path

Cover acquisition, eligibility, price derivation, ordering, binding activation, refresh classification, atomic activation, rollback, plugin runtime, Manual non-interference, secret exclusion, and one real private Free acquisition without tracking its data.

### Checkpoint D4

Tasks 20–24 pass focused and full verification. A user-owned Free key can create and activate a private full-market Evidence Pack; Runtime remains offline and public real-data distribution remains disabled.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| AA fields or naming change | Catalog stops matching or silently re-bands routes | Version schema and bindings; reject unknown fields; keep previous valid snapshot |
| Semantic assessor is inconsistent | Wrong level or unnecessary Deep fallback | Versioned route policy, per-call freezing, bounded schema, fixture regression, deterministic fallback |
| Comparison fields are incomplete | Wrong same-level winner | Exclude missing capability or price; sort missing latency after measured latency for equal-price routes |
| Effective DSH configuration is opaque | False AA binding | Fingerprint Host-materialized options; exclude unresolved or ambiguous routes |
| AA-informed wording is mistaken for proof | Overstated product claim | Persist snapshot and reason; use required AA-informed disclaimer |
| Provider and AA identities share no reliable structured key | False automatic binding | Keep the record unbound; require one reviewed provider normalization rule instead of fuzzy matching |
| Evidence Pack grows beyond maintenance bounds | Refresh denial or runtime cost | Retain only policy fields, enforce record/file limits, and keep runtime compilation deterministic |
| Automatic refresh hides a semantic break | Incorrect evidence continuity | RED on methodology, rights, stable-ID, schema, compatibility, or digest changes; isolate AMBER cases |
| Locally derived price is mistaken for an AA-native blended field | Misleading audit and UI claims | Store raw inputs, derivation version, cache fallback basis, and normalized output separately |
| A plugin upgrade invalidates the existing local Pack | Auto becomes unavailable before the first Free refresh | Provide one deterministic v1-to-v2 compatibility migration and preserve its legacy price basis |

## Current open decisions

- Formal runtime signals and reassessment boundaries for Phase 5 adaptive execution.
- Evidence required before down-routing may enter scope.
- Public carrier and update service remain undecided; Phase 4.1 implements a local atomic artifact boundary without adding a release workflow.
- Public distribution of real Evidence Packs remains blocked pending the ADR-013 written grant.
