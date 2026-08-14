# ADR-002: Optimize latency, then cost, under a quality constraint

[简体中文](../zh-CN/decisions/0002-quality-constrained-optimization.md)

## Status

Proposed

## Date

2026-08-14

## Context

Users struggle to estimate the model and effort a task requires, so they often keep a high configuration to be safe. Minimizing cost alone increases under-routing risk, while average quality may hide a small number of severe failures.

## Decision

Each task category uses its configured `strong` route as the quality baseline. A candidate route becomes eligible for automatic coverage only when its quality gap is no greater than `epsilon`, its unacceptable-result probability is no greater than `delta`, and it has no unexplained severe failure cluster.

Within the quality constraint, optimize full end-to-end latency before total cost. When evidence is insufficient, `abstain` and execute the strong fallback.

## Alternatives considered

### Always select the cheapest route

Rejected. Loss from a missed critical issue is not comparable to the model price.

### Use historical user choices as personalization labels

Rejected. Users have no A/B counterfactual; a choice generally expresses risk preference or a guess.

### Always use strong

Rejected. It minimizes quality risk but does not solve latency or cost, and it cannot produce a useful Auto product.

## Consequences

- RouterBench is product infrastructure, not an evaluation added after release.
- Metrics must report auto coverage, abstention, and under-routing loss.
- Open-ended tasks need multiple forms of evidence such as checklists, source evaluation, and blind pairing.
- Classifier, switching, retry, and recovery overhead enter latency and cost.
