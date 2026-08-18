# Implementation plan: AA-informed post-MVP Auto

[简体中文](plan.zh-CN.md)

## Objective

Evolve the accepted Phase 0P MVP into an AA-informed Auto beta. The implementation will classify each task into Light, Standard, or Deep; match available DSH routes to AA by model family, semantic version, variant, and effort; and choose the lower AA price within the selected level, using AA latency and stable route identity as tie-breaks.

## Accepted architecture decisions

- ADR-010 supersedes Benchmark admission and latency-first optimization for the post-MVP path.
- AA is the external source for capability, price, and latency conclusions.
- A fixed Task Assessor provides structured task attributes; deterministic Host policy owns the final level and route.
- Date/build/deployment revision is not part of model equality.
- Manual mode and the accepted model/effort transition UX remain unchanged.

## Dependency graph

```text
normalized model key and fixtures
        ↓
AA catalog schema and latest-row resolution
        ↓
capability-band compiler and price-first resolver
        ↓
fixed semantic Task Assessor
        ↓
end-to-end Auto integration and UI terminology
        ↓
dogfood and snapshot-refresh workflow
```

## Phase 1: AA catalog foundation

### Task 1: Normalize model identity

Define the model family/version/variant/effort key, explicit aliases, and duplicate-date rule with synthetic fixtures. Do not change live routing yet.

### Task 2: Compile the local AA catalog

Load the Git-ignored seed, join it to DSH route inventory, exclude invalid matches, and persist snapshot plus normalizer versions.

### Task 3: Assign levels and resolve price-first

Compile Light/Standard/Deep bands from versioned AA boundaries. Resolve one level by AA price, AA latency, and stable route identity.

### Checkpoint A

The pure catalog pipeline is deterministic, secret-free, independent of live AA access, and does not change Manual mode.

## Phase 2: Semantic assessment

### Task 4: Freeze the Task Assessor contract

Define structured attributes, bounded input, fixed model configuration, timeout, validation, confidence threshold, and Deep fallback.

### Task 5: Implement the fixed assessor and level mapper

Call the fixed assessor outside Auto recursion and map validated output to Light/Standard/Deep with deterministic reason codes. Cover representative fixture tasks and all fallback paths.

### Checkpoint B

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
| AA fields or naming change | Catalog stops matching or silently re-bands routes | Version schema and normalizer; reject unknown fields; keep previous valid snapshot |
| Semantic assessor is inconsistent | Wrong level or unnecessary Deep fallback | Fixed configuration, bounded schema, fixture regression, deterministic fallback |
| Price fields are incomparable | Wrong same-level winner | Select one canonical AA price field and reject missing/ambiguous comparisons |
| DSH default effort is opaque | False AA match | Require explicit or reliably materialized effort; otherwise exclude |
| AA-informed wording is mistaken for proof | Overstated product claim | Persist snapshot and reason; use required AA-informed disclaimer |

## Current open decisions

- AA capability field and initial band boundaries.
- Canonical AA price and latency fields.
- Fixed Task Assessor provider/model/effort and confidence threshold.
- Stable AA acquisition and distribution mechanism for Phase 4.
