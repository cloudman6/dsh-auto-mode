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

- [ ] Schema covers task kind, scope, complexity, risk, verifiability, confidence, and reasons.
- [ ] Input context, fixed route, timeout, validation, and confidence threshold are explicit.
- [ ] The contract forbids provider/model/effort output and maps failure to Deep.

**Verification:**

- [ ] Contract fixtures cover valid, invalid, timeout, and low-confidence output.

**Dependencies:** Maintainer selection of the fixed assessor configuration

## Task 5: Implement semantic assessment and deterministic level mapping

**Acceptance criteria:**

- [ ] The assessor runs outside Auto recursion and uses no tools.
- [ ] Deterministic policy maps structured attributes to Light, Standard, or Deep with reason codes.
- [ ] High risk, unknown scope, invalid output, timeout, and low confidence select Deep.

**Verification:**

- [ ] Fixture tasks cover coding, debugging, research, writing, architecture, security, and ambiguity.
- [ ] Repeated validated inputs produce the same level and explanation.

**Dependencies:** Tasks 3 and 4

## Checkpoint B: Semantic routing

- [ ] The assessor supplies evidence only; Host policy owns the decision.
- [ ] No concrete route appears in assessor output.
- [ ] All fallback paths are deterministic and visible.

## Task 6: Integrate the frozen Auto decision

**Acceptance criteria:**

- [ ] One decision combines assessment, constraints, catalog, and route resolution before assembly.
- [ ] Assembly, `agent/request`, Session facts, and UI projection consume the same provider/model/effort.
- [ ] No eligible route escalates levels or uses the configured Deep fallback with an explicit reason; no valid fallback fails visibly.

**Verification:**

- [ ] Pinned-fork composition covers Light, Standard, Deep, escalation, fallback, and failure.
- [ ] Cold reconstruction preserves the effective route and explanation.

**Dependencies:** Tasks 3 and 5

## Task 7: Migrate UI terminology and explanations

**Acceptance criteria:**

- [ ] UI uses Light/Standard/Deep and 轻量/常规/深度 rather than fast/standard/strong.
- [ ] The selector and conversation show the actual model, effort, task-handling level, and AA or fallback basis.
- [ ] Existing rolling, blue highlight, two breathing cycles, and message placement remain intact.

**Verification:**

- [ ] Browser tests cover model-only, effort-only, both, and level-only changes.
- [ ] English and Chinese snapshots are current.

**Dependencies:** Task 6

## Task 8: Prove the AA-informed Auto beta

**Acceptance criteria:**

- [ ] Different task fixtures reach all three handling levels and different eligible routes.
- [ ] Same-level selection follows AA price and latency ordering.
- [ ] Displayed, persisted, and effective request configurations agree; Manual remains unchanged.

**Verification:**

- [ ] Focused unit, Loader, Session, GUI, and available real-provider scenarios pass.
- [ ] Public explanations contain no Benchmark, optimality, non-inferiority, or safety claim.

**Dependencies:** Tasks 6 and 7

## Checkpoint C: AA-informed beta

- [ ] Tasks 1–8 are complete.
- [ ] The product is usable from one Auto action and remains transparent.
- [ ] The current fork, plugin, catalog, assessor, and policy versions are recorded.

## Task 9: Define and implement AA snapshot refresh

**Acceptance criteria:**

- [ ] Acquisition method, attribution, rights, retention, freshness, and minimization are documented.
- [ ] Malformed or incomplete updates cannot replace the last valid snapshot.
- [ ] A maintainer can inspect changes and restore the previous valid snapshot.

**Verification:**

- [ ] Offline fixtures cover update, rejection, rollback, binding addition, removal, replacement, and AA-record rename.
- [ ] Credentials and raw redistributed datasets remain outside Git and the browser client.

**Dependencies:** Checkpoint C and explicit authorization for any dependency or remote service
