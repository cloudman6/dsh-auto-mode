# ADR-006: Route admission is evidence-governed and separated from policy scenarios

[简体中文](../zh-CN/decisions/0006-evidence-governed-route-admission.md)

## Status

Accepted

Phase 0P may use external rankings only as explicitly unadmitted experimental priors under [ADR-008](0008-external-prior-experimental-auto.md). RouterBench remains the sole project admission path.

## Date

2026-08-14

## Context

A benchmark can leak oracle labels into routing inputs, overfit thresholds to repeatedly inspected cases, or conflate model capability with control-plane behavior. A single aggregate score cannot support safety claims across task risk, verifiability, reversibility, and detectability slices.

## Decision

RouterBench has two governed systems:

- Route Capability Bench evaluates concrete provider/model/reasoning-selection configurations against absolute baseline and candidate non-inferiority gates. Explicit effort, adapter-default materialization, and provider-default omission are distinct evidence identities.
- Policy Scenario Bench evaluates routing, phase transitions, abstention, recovery, persistence, and delegation as event-driven behavior.

Calibration, validation, held-out acceptance, time-shifted, and out-of-distribution data remain isolated. Execution-visible case input is separated from evaluator-only oracle metadata. Every Policy Pack preregisters taxonomy, evaluators, statistics, sample size, versions, expiry, and revocation rules.

Within-turn routing and full recovery enter product scope only if randomized strategy ablations show material incremental end-to-end value over the adjacent simpler control plane while all quality and safety gates continue to pass.

## Alternatives considered

### One benchmark and one aggregate score

Rejected. It hides failing slices and cannot distinguish configuration quality from policy behavior.

### Public model rankings as routing truth

Rejected. Rankings are useful priors but do not identify deployment, task distribution, evaluator relation, or severe-failure risk.

### Reuse all cases while tuning policy

Rejected. Repeated inspection destroys held-out evidence and permits benchmark overfitting.

## Consequences

- Benchmark data and evaluator governance are release-critical assets.
- Route admissions are versioned, expiring, and revocable.
- Strategy-arm deltas prevent generic recovery benefits from being misreported as routing benefits.
- A large architecture remains documented without making every control plane an unconditional product commitment.
