# Implementation plan: AA-informed post-MVP Auto

[简体中文](plan.zh-CN.md)

## Objective

Evolve the accepted Phase 0P MVP into an AA-informed Auto beta. The implementation will classify each task into Light, Standard, or Deep; bind each eligible effective DSH route explicitly to one stable AA evidence record; and choose the lower AA price within the selected level, using AA latency and stable Host route identity as tie-breaks.

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

### Task 7: Migrate user-facing terminology and explanations

Replace prototype labels with Light/Standard/Deep and 轻量/常规/深度. Show AA-matched versus configured-fallback reasons while preserving rolling/breathing animations and conversation placement.

### Task 8: Prove Auto and Manual end to end

Exercise all three levels, price ordering, latency tie-break, low-confidence fallback, missing-catalog failure, Session reconstruction, and Manual non-interference in browser and available real-provider scenarios.

### Checkpoint C

Displayed, persisted, and effective request routes agree for every path. Public text says AA-informed and makes no Benchmark-quality claim.

## Phase 4: Snapshot maintenance

### Task 9: Define the refresh workflow

Choose the stable AA acquisition method and rights boundary, validate and minimize the snapshot, inspect changes, and support restoring the previous valid snapshot. This task requires explicit approval before adding an external dependency or remote service.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| AA fields or naming change | Catalog stops matching or silently re-bands routes | Version schema and bindings; reject unknown fields; keep previous valid snapshot |
| Semantic assessor is inconsistent | Wrong level or unnecessary Deep fallback | Versioned route policy, per-call freezing, bounded schema, fixture regression, deterministic fallback |
| Comparison fields are incomplete | Wrong same-level winner | Exclude missing capability or price; sort missing latency after measured latency for equal-price routes |
| Effective DSH configuration is opaque | False AA binding | Fingerprint Host-materialized options; exclude unresolved or ambiguous routes |
| AA-informed wording is mistaken for proof | Overstated product claim | Persist snapshot and reason; use required AA-informed disclaimer |

## Current open decisions

- Stable AA acquisition and distribution mechanism for Phase 4.
