# RouterBench

[简体中文](zh-CN/routerbench.md)

## Purpose

RouterBench is the quality-evidence foundation of Auto Mode, not an auxiliary demo. It answers:

- On which task categories can a model and effort preserve the strong quality baseline?
- On which tasks does the router have enough evidence to choose a weaker route automatically?
- Do escalation, down-routing, and recovery improve end-to-end outcomes?
- Do classifier, switching, and retry overhead eliminate model savings?

Online routing and Benchmark execution must use the same Task Assessment, Routing Policy, Route Profile, and versioned configuration.

## Experimental unit

A Benchmark case contains at least:

```ts
interface RouterBenchCase {
  id: string
  version: number
  taskKind: TaskKind
  prompt: string
  fixture: FixtureRef
  risk: RiskLevel
  verifiability: Verifiability
  evaluators: EvaluatorSpec[]
  expectedEvidence?: EvidenceRequirement[]
  allowedSideEffects: SideEffectPolicy
}
```

Run the same case against a candidate route and the strong baseline as a pair. Randomize execution order, record model snapshots and profile versions, and repeat runs to measure model variance.

## Initial task categories

### Mechanically verifiable coding

- Local API parameter validation.
- Multi-file refactoring and type updates.
- Test-failure diagnosis.
- Concurrency, lifecycle, and resource-release defects.
- Security boundaries and authority checks.

### Partially verifiable work

- Source-backed document summaries.
- Code review and risk inventories.
- Public API documentation synchronization.
- Migration-plan comparison.

### No single objective answer

- Architecture options and trade-offs.
- Research synthesis.
- Technical writing and argumentation.
- Long-term evolution recommendations.

### Routing and recovery scenarios

- Initial route selection.
- Continue after a weak model stalls.
- Salvage/restart after harmful mutations.
- Transition within one turn from complex implementation to low-risk tail work.
- High-risk child-agent constraints and model diversity.

## Quality evaluation

### Mechanical verification

Prefer real tests, type checks, static analysis, builds, and deterministic invariants. Passing tests is necessary evidence but does not prove requirement completeness automatically; cases must detect omissions and speculative workarounds.

### Open-ended tasks

When no standard answer exists, do not invent one canonical response. Combine:

- A prewritten checklist of critical omissions and error modes.
- Citation correctness, source fidelity, and coverage.
- Blind pairwise comparison between candidate and strong outputs.
- Multiple independent evaluators, reporting disagreement instead of only an average.
- Human or domain-expert sampling for high-risk tasks.

An LLM judge is not truth. Version the judge, measure position and same-family model bias, and retain the rationale behind each judgment.

## Core metrics

### Quality

- `quality_gap_to_strong`: candidate-route quality gap relative to strong.
- `unacceptable_result_rate`: fraction of unacceptable outcomes.
- `under_routing_loss`: severe loss caused by selecting a route that is too weak.
- Quantiles and worst-category performance, not only means.

### Coverage

- `auto_coverage`: fraction of tasks optimized automatically without abstention.
- `abstention_rate`: fraction using fallback because evidence is insufficient.
- `out_of_distribution_rate`: fraction that cannot map to a calibrated task category.

### Performance

- End-to-end latency to the first valid result.
- Total task-completion latency.
- Input, output, and auxiliary-model tokens.
- Model-call cost.
- Cache loss and history-replay overhead from switching.

### Recovery

- Escalation precision and recall.
- Mean episode duration in steps and unresolved-episode rate.
- Success rate and additional cost of continue, salvage, and restart.
- Harmful-mutation escape rate: weak-model side effects that remain after recovery.

## Admission rules

Decide route admission independently for every task category. A proposed rule is:

```text
Confidence interval of candidate quality gap satisfies epsilon
AND upper bound of unacceptable-result rate satisfies delta
AND sample size reaches the minimum
AND no unexplained high-severity failure cluster exists
```

Passing on average cannot hide a systematic failure in one high-risk subcategory. Security, concurrency, irreversible external operations, and similar categories use stricter thresholds or a fixed strong route.

## Model profiles

Public model-capability rankings may be a cold-start prior, but they are not routing truth. A Route Profile records:

- Provider, model, effort, and capabilities.
- Hard constraints such as context window and vision/tool support.
- RouterBench version and sample size.
- Quality, latency, cost, and confidence intervals.
- Data date and invalidation conditions.

Model updates, provider aliases, and server-side behavior changes may invalidate historical profiles. Runtime canaries and version fingerprints remain future design questions.

## Labels not used

These signals do not prove that a route is correct:

- A user manually chose a model.
- A user accepted or rejected a switching suggestion.
- A parent agent selected a route.
- A model claimed the task was simple or resolved.
- One output was not redone by the user.

Usable facts include reproducible validation, explicit user correction, eventual task completion, recovery actions and side effects, and deliberately designed paired evaluation.
