# ADR-010: Use AA-informed heuristic routing and price-first resolution

[简体中文](../zh-CN/decisions/0010-aa-informed-heuristic-routing.md)

## Status

Superseded by [ADR-011](0011-bind-host-routes-to-aa-evidence.md) for the post-MVP product direction. Retained as the historical decision that removed Benchmark admission and established AA-informed, price-first routing.

ADR-011 retains this ADR's AA-informed routing, task-handling levels, Host ownership, price-first resolution, optional RouterBench, and product-claim limits while replacing its mandatory four-field model-matching contract.

## Date

2026-08-18

## Context

The original design required an in-house RouterBench to establish an absolute baseline, candidate non-inferiority, exact deployment identity, admission, expiry, and revocation before a usable Auto product. The project does not have the resources to create and govern a model-quality benchmark at the breadth and statistical standard that those claims require.

Artificial Analysis already publishes broad model capability, price, and latency comparisons. The accepted Phase 0P MVP proved that DSH Auto Mode can use external data to select and visibly apply different model/effort configurations while preserving Manual mode. The product's differentiated work is task understanding, deterministic routing, DSH integration, transparency, and later recovery—not operating another model leaderboard.

The MVP also showed that requiring a provider deployment fingerprint is impractical when DSH exposes stable semantic aliases. A useful product can make a narrower, honest match at model family, semantic version, variant, and effort level without claiming exact build identity.

## Decision

Use Artificial Analysis as the maintained external source for model capability bands, price, and latency. DSH Auto Mode remains responsible for the final decision.

Replace user-visible `fast`/`standard`/`strong` tiers with task-handling levels:

- `light` / 轻量;
- `standard` / 常规;
- `deep` / 深度.

A fixed Task Assessor returns structured task attributes and confidence but never a concrete model or effort. Deterministic Host policy maps those attributes to one handling level. Low confidence, unknown scope, or high risk selects `deep`.

Match AA records to DSH models by normalized model family, semantic version, variant, and explicit effort. Ignore date suffixes and deployment/build revisions for equality. When several dated AA records share one normalized key, use the latest record in the snapshot. Version, variant, and effort mismatches remain invalid.

Within one handling level, resolve eligible routes in this order:

1. lower AA-reported price;
2. lower AA-reported latency;
3. stable concrete route identity.

Do not estimate task token counts or maintain a private cost model. Host capability, availability, security, and user constraints filter the candidate set before price comparison.

RouterBench is optional evaluation infrastructure. It may test bounded policy questions or regressions later, but it is not a prerequisite for an AA-informed Auto release. Exact deployment fingerprints, project-specific baseline guarantees, candidate non-inferiority, and benchmark admission are not product claims.

Every decision states that it is AA-informed and references the current AA snapshot. The product must not describe a route as benchmark-proven, safest, universally best, or guaranteed non-inferior.

## Alternatives considered

### Build the original RouterBench before continuing

Rejected. The required task corpus, evaluator governance, repeated runs, statistical power, and ongoing drift maintenance exceed current project resources and would delay the product's primary value.

### Let AA directly choose the concrete route

Rejected. AA does not know the current task, local availability, user constraints, or DSH Host state. It supplies market data; Host policy owns the decision.

### Require exact deployment date or fingerprint

Rejected for normal matching. Many provider aliases do not expose that identity. The product instead makes a transparent semantic-version-level match and avoids exact-deployment claims.

### Estimate per-task token cost

Rejected. It adds an uncertain local model where AA already supplies a comparable price conclusion. The resolver uses AA price directly.

### Keep `fast`/`standard`/`strong`

Rejected for user-facing language. Those names mix latency and unproven strength. `light`/`standard`/`deep` describe the amount of task handling allocated without claiming a certified quality guarantee.

## Consequences

- The roadmap moves from benchmark admission to AA catalog construction and semantic task assessment.
- Existing Phase 0P integration and UI become the base of the next product iteration.
- Model matching is practical but intentionally less precise than deployment-level identity.
- Price becomes the first comparator within one capability band; latency becomes the second.
- Product explanations and public documentation must preserve the AA-informed heuristic limitation.
- Future focused evaluations may improve confidence but do not silently change the product into an admitted quality-guarantee system.
- ADR-001, ADR-003, ADR-004, ADR-005, ADR-007, and ADR-009 remain in force for their authority, documentation, recovery, delegation, and effect-safety boundaries.
