# ADR-012: Resolve and freeze Task Assessor routes

[简体中文](../zh-CN/decisions/0012-resolve-and-freeze-task-assessor-routes.md)

## Status

Accepted

## Date

2026-08-22

## Context

Phase 2 originally described the Task Assessor as one fixed provider/model/effort configuration. Interpreted as a product-wide physical route, that contract cannot work across installations: each DSH environment exposes different providers, models, optional reasoning controls, user restrictions, and Host-valid routes. Hard-coding the current maintainer's DeepSeek Pro/off route would make local evidence into an industry-wide runtime dependency and would fail even when another valid classifier route is available.

Selecting the assessor according to the user task would create a circular dependency: the system would need an assessment before it could choose the model responsible for producing that assessment. Allowing the model to choose its own provider/model/effort would also bypass Host ownership.

The assessor still needs stable behavior and bounded overhead. A route that changes during one assessment is not reconstructable, and a route whose AA-reported first-answer latency already exceeds the request budget is not a useful fallback.

## Decision

Separate the fixed **selection policy** from the environment-dependent **physical assessor route**.

`task-assessor-route-policy/v1` resolves one route from the current frozen `aa-route-policy/v1` catalog without inspecting task content. Classification is a fixed Light request. The resolver tries Light, Standard, then Deep; inside the first eligible level it preserves the catalog's lower-AA-price, lower-AA-latency, stable-route-identity ordering. Assessor eligibility requires measured AA median time to first answer token at or below 6 seconds, half of the 12-second total request deadline. Missing or over-budget latency is excluded for this auxiliary call even though the user-task resolver may retain missing latency under its own tie-break policy.

The selected Host route identity, effective configuration fingerprint, catalog version, AA snapshot, route-policy version, and timeout are frozen before one assessor call. The route may differ between installations or after a reviewed catalog/configuration change, but it cannot change during a call and is never recursively selected by Auto. No eligible route, an invalid catalog, or call failure produces a stable unknown assessment and selects Deep.

`task-assessor-contract/v1` fixes the other Task 4 boundaries: bounded visible text and attachment metadata only; no tools or retries; temperature `0`; 512 output tokens; 8 KiB output; 12-second total timeout; strict JSON with no extra fields; discrete confidence `0`, `0.5`, `0.8`, or `1`; threshold `0.8`; and Host-owned assessor provenance. Provider, model, effort, route, and handling level are forbidden model outputs.

## Alternatives considered

### Hard-code one provider/model/effort for every installation

Rejected. Availability and reasoning controls differ by environment, and a local DeepSeek binding is not a portable product contract.

### Select the assessor route from the current task

Rejected. That makes assessor selection depend on the assessment it is supposed to produce and reintroduces recursive Auto routing.

### Let ordinary users select a dedicated assessor manually

Rejected as the default. It exposes an internal auxiliary role, creates another required setup decision, and does not provide deterministic behavior across unconfigured installations. A future maintainer-only pin may be additive, but an unavailable explicit pin must fail closed rather than silently substitute another route.

### Call any available route and rely only on the runtime timeout

Rejected. Calling a route whose measured first-answer latency is already outside the budget wastes time and cost before reaching the same Deep fallback.

## Consequences

- The same versioned policy adapts to providers with zero, one, or many reasoning configurations because it resolves generic Host route identities.
- The current maintainer catalog resolves DeepSeek Pro/off because it is the eligible Light route; that is an output, not a hard-coded dependency.
- Assessor behavior can differ across installations, so every decision must persist the actual frozen route and catalog evidence in addition to the assessor contract version.
- Installations without an eligible local AA catalog fail conservatively to Deep. General catalog acquisition and distribution remain Phase 4 work.
- Task 5 implements the one-shot provider call and deterministic level mapper; Task 4 does not modify the live MVP routing path.
