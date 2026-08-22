# Task checklist: AA-informed post-MVP Auto

[简体中文](todo.zh-CN.md)

## Task 1: Bind Host route identity to AA evidence

**Acceptance criteria:**

- [x] A stable Host route identity contains provider, model, and a fingerprint of every Host-materialized execution option.
- [x] One versioned explicit binding maps an eligible Host route to one stable AA record in one frozen snapshot.
- [x] Effort and variant remain optional provider dimensions; ambiguous, stale, fuzzy, or configuration-crossing bindings are rejected.

**Verification:**

- [x] Mixed-provider fixtures cover zero, one, and several execution controls, valid bindings, collisions, ambiguity, and AA-record replacement.
- [x] Existing MVP and Manual tests remain green.

**Dependencies:** None

## Task 2: Compile the local AA catalog

**Acceptance criteria:**

- [x] The Git-ignored local seed joins only to valid DSH routes.
- [x] Every entry records snapshot, binding-rule version, AA record, Host route identity, effective configuration fingerprint, and capability facts.
- [x] Invalid or unmatched rows are excluded with stable reasons and no secret is committed.

**Verification:**

- [x] Catalog fixtures are deterministic without network access.
- [x] Secret and tracked-dataset checks pass.

**Dependencies:** Task 1

## Task 3: Assign handling levels and resolve price-first

**Acceptance criteria:**

- [x] Every eligible route belongs to exactly one versioned Light, Standard, or Deep band.
- [x] Same-level ordering uses AA price, then AA latency, then stable route ID.
- [x] Missing comparison fields follow one explicit rule and discovery order never changes the winner.

**Verification:**

- [x] Boundary and permutation tests cover all bands and tie-breaks.
- [x] Explanations identify the band and price-first reason.

**Dependencies:** Task 2 and maintainer selection of AA fields/boundaries

## Checkpoint A: Catalog foundation

- [x] Tasks 1–3 pass without DSH provider credentials or live AA access.
- [x] Manual mode behavior is unchanged.
- [x] No project Benchmark or exact deployment fingerprint is required.

## Task 4: Freeze the Task Assessor contract

**Acceptance criteria:**

- [x] Schema covers task kind, scope, complexity, risk, verifiability, confidence, and reasons.
- [x] Input context, environment-aware route resolution plus per-call freezing, timeout, validation, and confidence threshold are explicit.
- [x] The contract forbids provider/model/effort output and maps failure to Deep.

**Verification:**

- [x] Contract fixtures cover valid, invalid, timeout, and low-confidence output.

**Dependencies:** Tasks 1–3 and maintainer approval of `task-assessor-route-policy/v1` and `task-assessor-contract/v1`

## Task 5: Implement semantic assessment and deterministic level mapping

**Acceptance criteria:**

- [x] The assessor runs outside Auto recursion and uses no tools.
- [x] Deterministic policy maps structured attributes to Light, Standard, or Deep with reason codes.
- [x] High risk, unknown scope, invalid output, timeout, and low confidence select Deep.

**Verification:**

- [x] Fixture tasks cover coding, debugging, research, writing, architecture, security, and ambiguity.
- [x] Repeated validated inputs produce the same level and explanation.

**Dependencies:** Tasks 3 and 4

## Checkpoint B: Semantic routing

- [x] The assessor supplies evidence only; Host policy owns the decision.
- [x] No concrete route appears in assessor output.
- [x] All fallback paths are deterministic and visible.

## Task 6: Integrate the frozen Auto decision

**Acceptance criteria:**

- [x] One decision combines assessment, constraints, catalog, and route resolution before assembly.
- [x] Assembly, `agent/request`, Session facts, and UI projection consume the same provider/model/effort.
- [x] No eligible route escalates levels or uses the configured Deep fallback with an explicit reason; no valid fallback fails visibly.

**Verification:**

- [x] Pinned-fork composition covers Light, Standard, Deep, escalation, fallback, and failure.
- [x] Cold reconstruction preserves the effective route and explanation.

**Dependencies:** Tasks 3 and 5

## Task 7: Migrate UI terminology and explanations

**Acceptance criteria:**

- [x] UI uses Light/Standard/Deep and 轻量/常规/深度 rather than fast/standard/strong.
- [x] The selector and conversation show the actual model, effort, task-handling level, and AA or fallback basis.
- [x] Existing rolling, blue highlight, two breathing cycles, and message placement remain intact.

**Verification:**

- [x] Browser tests cover model-only, effort-only, both, and level-only changes.
- [x] English and Chinese snapshots are current.

**Dependencies:** Task 6

## Task 8: Prove the AA-informed Auto beta

**Acceptance criteria:**

- [x] Different task fixtures reach all three handling levels and different eligible routes.
- [x] Same-level selection follows AA price and latency ordering.
- [x] Displayed, persisted, and effective request configurations agree; Manual remains unchanged.

**Verification:**

- [x] Focused unit, Loader, Session, GUI, and available real-provider scenarios pass.
- [x] Public explanations contain no Benchmark, optimality, non-inferiority, or safety claim.

The verification environment exposed no provider credential, so no new Phase 3 live-provider scenario was available and no such result is claimed. The accepted Phase 0P real-provider dispatch evidence remains the live seam proof.

**Dependencies:** Tasks 6 and 7

## Checkpoint C: AA-informed beta

- [x] Tasks 1–8 are complete.
- [x] The product is usable from one Auto action and remains transparent.
- [x] The current fork, plugin, catalog, assessor, and policy versions are recorded.

## Task 9: Define and implement AA snapshot refresh

**Acceptance criteria:**

- [x] Acquisition method, attribution, rights, retention, freshness, and minimization are documented.
- [x] Malformed or incomplete updates cannot replace the last valid snapshot.
- [x] A maintainer can inspect changes and restore the previous valid snapshot.

**Verification:**

- [x] Offline fixtures cover update, rejection, rollback, binding addition, removal, replacement, and AA-record rename.
- [x] Credentials and raw redistributed datasets remain outside Git and the browser client.

**Dependencies:** Checkpoint C and explicit authorization for any dependency or remote service

## Task 10: Accept the Evidence Pack architecture

**Acceptance criteria:**

- [x] ADR-014 fixes independent Snapshot, Binding Registry, Route Policy, Manifest, EvidenceRouteKey, ExecutionFingerprint, Active Catalog, and GREEN/AMBER/RED semantics.
- [x] The decision states exactly which ADR-011 and ADR-013 clauses it supersedes and preserves all remaining rights and runtime-offline boundaries.
- [x] The maintainer explicitly changes ADR-014 from Proposed to Accepted before incompatible runtime implementation begins.

**Verification:**

- [x] English and Chinese ADRs and decision indexes are current and link-valid.
- [x] `git diff --check` and conflict-marker checks pass.

**Dependencies:** Task 9 and explicit maintainer approval

## Task 11: Implement Evidence Pack contracts

**Acceptance criteria:**

- [ ] Snapshot, Binding Registry, Route Policy, and Manifest validate independently with deterministic serialization and component digests.
- [ ] Manifest compatibility and rights mode fail closed with stable reason codes.
- [ ] No real AA metrics, credential, grant, or private refresh material enters tracked fixtures or browser output.

**Verification:**

- [ ] Contract tests cover valid, malformed, duplicate, oversized, incompatible, tampered, and nondeterministic inputs.
- [ ] Existing catalog and Manual tests remain green.

**Dependencies:** Task 10

## Task 12: Separate EvidenceRouteKey from ExecutionFingerprint

**Acceptance criteria:**

- [ ] Provider-scoped normalization derives exact canonical EvidenceRouteKeys from declared evidence-defining controls.
- [ ] Complete Host-materialized configuration still produces the persisted ExecutionFingerprint used for assembly/request equality.
- [ ] Execution-only default changes preserve an evidence match while model, reasoning, variant, or declared evidence-control changes cannot collide.

**Verification:**

- [ ] Mixed-provider tests cover zero, one, and several evidence controls plus temperature, token, stop, credential-reference, variant, and effort changes.
- [ ] Fuzzy name/slug matching and ambiguous normalization fail with stable reasons.

**Dependencies:** Task 11

## Task 13: Build the full policy-eligible AA Snapshot

**Acceptance criteria:**

- [ ] Every page of the pinned acquisition is scanned and every unique record with valid capability and price is retained independently of bindings or current Host routes.
- [ ] Only policy-consumed stable identity, display, capability, price, latency, and source fields are retained; nullable latency follows the existing ordering rule.
- [ ] Bounds, stable-ID integrity, methodology, rights, freshness, and credential protections remain fail closed.

**Verification:**

- [ ] Offline fixtures cover multi-page acquisition, eligible unbound additions, incomplete exclusions, duplicates, page reordering, oversized data, and unchanged deterministic output.
- [ ] Runtime tests prove no AA network call occurs.

**Dependencies:** Task 11

## Task 14: Implement the long-lived Binding Registry

**Acceptance criteria:**

- [ ] Exact EvidenceRouteKey-to-AA-record mappings are independent of current Host inventory and one Snapshot ID.
- [ ] Bindings derive active or dormant status from Host availability and support quarantine without mutating unrelated mappings.
- [ ] Structured uniquely matching provider rules may create candidates automatically; names, slugs, similarity, and latest-record guesses cannot bind or replace records.

**Verification:**

- [ ] Fixtures cover active, dormant, reactivated, unbound, quarantined, duplicate-key, duplicate-record, ambiguous, missing-record, and stable-ID replacement cases.
- [ ] Registry permutation tests produce identical serialized content and lookup results.

**Dependencies:** Tasks 12 and 13

## Checkpoint D1: Evidence contracts

- [ ] Tasks 10–14 are complete under Accepted ADR-014.
- [ ] Identity, Snapshot, and Registry fixtures are provider-neutral and deterministic.
- [ ] Existing Runtime behavior remains available through an explicit compatibility path.

## Task 15: Derive the runtime Active Catalog

**Acceptance criteria:**

- [ ] Current Host routes join exact Registry keys and current Snapshot records before Route Policy assigns levels and ordering.
- [ ] Active entries retain EvidenceRouteKey, AA record identity, Snapshot identity, Binding Registry version, and complete ExecutionFingerprint.
- [ ] Dormant, unbound, quarantined, malformed, incompatible, and Host-invalid items are isolated with stable exclusions.

**Verification:**

- [ ] Adding a Host route with an existing dormant binding activates it without changing Snapshot or Registry.
- [ ] Discovery order, execution-only defaults, and unrelated invalid records cannot change valid winners.

**Dependencies:** Task 14

## Task 16: Automate exception-driven refresh

**Acceptance criteria:**

- [ ] GREEN updates apply atomically without human approval; AMBER updates isolate affected evidence while preserving valid advancement; RED updates retain the previous valid pack.
- [ ] Classification covers metrics, stable-ID-preserving renames, unbound records, dormant transitions, missing bound records, normalization ambiguity, methodology, schema, terms, rights, compatibility, and digest integrity.
- [ ] Deterministic reports and verified rollback remain available for every applied update.

**Verification:**

- [ ] Offline file tests cover every GREEN/AMBER/RED reason, interruption, tampering, stale predecessor, atomic replacement, and rollback.
- [ ] No report or CLI stdout exposes credentials, raw response bodies, or real tracked AA data.

**Dependencies:** Tasks 13–15

## Checkpoint D2: Automated evidence maintenance

- [ ] Tasks 15–16 are complete.
- [ ] Routine AA metric updates require no human action.
- [ ] Semantic or contract exceptions cannot silently change active evidence.

## Task 17: Establish Runtime and Evidence Pack update boundaries

**Acceptance criteria:**

- [ ] Runtime and Evidence Pack have independent versions joined by one validated compatibility manifest.
- [ ] A local installer/update operation validates the complete pair before atomic activation and retains the previous valid pair for rollback.
- [ ] The default implementation adds no external dependency, release workflow, public service, or real-data distribution path.

**Verification:**

- [ ] Packaging tests prove compatible install, incompatible rejection, metric-only pack update, Runtime-only compatible update, interruption safety, and rollback.
- [ ] Package inspection proves private maintenance files and real AA data are absent.

**Dependencies:** Tasks 11 and 16

## Task 18: Migrate legacy catalog seeds

**Acceptance criteria:**

- [ ] One explicit migration converts valid combined schema-v1 seeds into Snapshot, Binding Registry, Route Policy reference, and Manifest artifacts.
- [ ] Conversion rejects ambiguous or lossy evidence mappings instead of inferring them.
- [ ] Existing schema-v1 Sessions remain readable and retain their original frozen evidence and execution facts.

**Verification:**

- [ ] Fixtures cover current seed conversion, deterministic rerun, invalid legacy input, ambiguous control extraction, and rollback to the predecessor artifact pair.
- [ ] Equivalent Host inventory and policy produce the same eligible winners before and after migration.

**Dependencies:** Tasks 15 and 17

## Task 19: Prove the Evidence Pack path end to end

**Acceptance criteria:**

- [ ] Full acquisition through local activation, runtime Active Catalog, Task Assessor, resolver, request, Session, and UI works without runtime AA access.
- [ ] Dormant activation, all three handling levels, price/latency ordering, GREEN/AMBER/RED behavior, rollback, and cold reconstruction are visible and deterministic.
- [ ] Manual remains unchanged and public product text makes no unsupported AA, Benchmark, safety, or optimality claim.

**Verification:**

- [ ] Focused unit, complete `npm test`, pinned Loader/Session, keyless browser, migration, packaging, secret, translation, and link checks pass.
- [ ] Any unavailable credential-dependent scenario is reported as unclaimed rather than silently skipped as evidence.

**Dependencies:** Tasks 12–18

## Checkpoint D3: Phase 4.1 complete

- [ ] Tasks 10–19 are complete and the local Runtime/Evidence Pack pair is rollback-safe.
- [ ] `PROJECT_STATUS.md`, specification, architecture, routing policy, roadmap, maintenance guide, examples, and translations describe the implemented state.
- [ ] Public real Evidence Pack distribution remains disabled unless the ADR-013 written-license gate is independently satisfied.
