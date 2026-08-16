# ADR-002: Optimize latency, then cost, under absolute and relative quality gates

[简体中文](../zh-CN/decisions/0002-quality-constrained-optimization.md)

## Status

Accepted

Phase 0P is a narrowly scoped experimental execution path defined by [ADR-008](0008-external-prior-experimental-auto.md). It does not amend the admission requirements for Phase 0C or public quality claims.

## Date

2026-08-14

## Context

Users struggle to estimate the model and effort a task requires, so they often keep a high configuration to be safe. Minimizing cost alone increases under-routing risk. Relative comparison alone is also unsafe: a candidate can match a baseline that itself fails the task.

## Decision

Each task slice uses a configured baseline guarantee tier, conventionally named `strong`. It is a Policy Pack guarantee, not a universal claim that one model is strongest.

The baseline must first pass preregistered absolute quality and unacceptable-result gates. A candidate route becomes eligible only when its one-sided non-inferiority interval satisfies `epsilon`, its unacceptable-result upper confidence bound satisfies `delta`, power and sample-size requirements are met, and no unexplained severe failure cluster exists.

Within the policy-eligible admitted set, optimize end-to-end latency before total cost. Routing Policy and concrete resolution operate on one frozen Effective Route Catalog: Policy applies versioned tier-level evidence, and the resolver orders concrete candidates within the selected tier by predicted end-to-end latency, total cost, and stable admission identity. Missing required comparison or identity evidence invalidates the profile; live discovery order is never a tie-break. If policy cannot distinguish among admitted legal routes, `abstain` selects the admitted baseline. If no safe admitted configuration exists, return `no-safe-route` and stop or request user intervention; never silently fall back to an unadmitted configuration.

Maintainers publish versioned Policy Packs. Ordinary users choose only Auto or a manual concrete configuration; they do not calibrate quality profiles.

## Alternatives considered

### Always select the cheapest route

Rejected. Loss from a missed critical issue is not comparable to model price.

### Admit by relative quality alone

Rejected. Non-inferiority to a failing baseline provides no absolute quality guarantee.

### Use historical user choices as labels

Rejected. Users have no A/B counterfactual; a choice generally expresses risk preference or a guess.

### Always use the baseline

Rejected. It does not solve latency or cost and cannot produce a useful Auto product.

## Consequences

- Route Capability Bench and Policy Pack governance are product infrastructure.
- Metrics report absolute baseline failures, intervals, severe slices, coverage, abstention, and `no-safe-route`.
- Classifier, switching, retry, and recovery overhead enter latency and cost.
- Aliases, model drift, expired evidence, or a failed baseline revoke admission.
- Explicit effort, adapter-default materialization, and provider-default omission are different concrete selections for evidence and drift purposes.
