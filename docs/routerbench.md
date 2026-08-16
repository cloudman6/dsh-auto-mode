# RouterBench

[简体中文](zh-CN/routerbench.md)

## Purpose

RouterBench is the evidence foundation of Auto Mode. It must answer two different questions without using one dataset or runner to answer both:

1. Route Capability Bench: which provider/model/reasoning-selection configurations meet absolute and relative quality gates for a task category?
2. Policy Scenario Bench: does production policy select, escalate, down-route, abstain, and recover correctly, and does each added control plane improve end-to-end outcomes?

Where policy is exercised, Benchmark and online execution use the same policy core and schemas. Benchmark treatment assignment, oracle metadata, and evaluators remain outside production policy inputs.

Phase 0P deliberately starts before this admission evidence exists. Its Artificial Analysis snapshot is an external prior with `experimental-unadmitted` status, never a substitute Route Capability Bench result. Phase 0P may validate integration, persistence, explanations, and product-loop behavior; it cannot satisfy an absolute gate, non-inferiority bound, or Phase 0C admission. Dogfood cases require provenance and leakage review before reuse in any calibration or evaluation split and are never added retrospectively to a held-out set.

## Evidence layers and data isolation

Every Benchmark release separates:

- Calibration data used to choose thresholds or fit assessment rules.
- Validation data used during Policy Pack construction.
- A held-out acceptance set opened only after taxonomy, assessor, policy, profile, and evaluator versions are frozen.
- Time-shifted and out-of-distribution sets used for drift and abstention tests.

Splits are grouped by fixture, repository, source, task family, and near-duplicate cluster. A case separates execution-visible input from evaluator-only oracle metadata:

```ts
interface CapabilityCase {
  id: string
  version: number
  executionInput: {
    prompt: string
    fixture: FixtureRef
  }
  oracleMetadata: {
    taskKind: TaskKind
    risk: RiskLevel
    verifiability: Verifiability
    evaluators: EvaluatorSpec[]
    expectedEvidence: EvidenceRequirement[]
    allowedSideEffects: SideEffectPolicy
  }
}
```

Task Assessment and Routing Policy never receive `oracleMetadata`.

## Route Capability Bench

Run the same case against a candidate configuration and the configured baseline as a randomized pair. Repeat independent runs to estimate model and environment variance. Record:

- Exact deployment profile, reasoning-selection encoding, and known model/provider fingerprint.
- Fixture hash and environment summary.
- Evaluator, rubric, judge, and taxonomy versions.
- Execution-order seed and repetition identity.
- Raw outcomes, structured evidence, latency, tokens, and cost.

The baseline itself must pass an absolute gate. A candidate cannot be admitted merely because it matches a failing baseline.

## Policy Scenario Bench

Policy behavior needs an explicit event scenario rather than an opaque fixture:

```ts
interface ScenarioCase {
  id: string
  version: number
  initialSession: SessionFixtureRef
  initialExecutionWorld: ExecutionWorldFixtureRef
  actors: ScenarioActor[]
  eventSchedule: ScheduledEvent[]
  faultSchedule: ScheduledFault[]
  checkpoints: CheckpointFixture[]
  routingConstraints: RoutingConstraintFixture[]
  expectedTrace: TraceInvariant[]
  sideEffectOracle: SideEffectOracle
}
```

Scenarios cover confirmed phase transitions, multiple episodes, restart lineage, cold recovery, provider loss, event-persistence failure, concurrent mutation, child constraints, and Session handoff. Deterministic state-machine simulation and real DSH adapter contract tests are separate test layers.

## Initial task categories

The taxonomy is hierarchical. Task kind, risk, verifiability, reversibility, and detectability are separate dimensions; admission on a broad category cannot hide a failing high-risk slice.

Initial content spans:

- Mechanically verifiable coding: validation, refactoring, diagnosis, concurrency, resource lifecycle, and authority boundaries.
- Partially verifiable work: source-backed summaries, code review, API documentation, and migration comparison.
- Open-ended work: architecture trade-offs, research synthesis, technical argument, and evolution recommendations.
- Routing scenarios: initial selection, abstention, provider loss, and no-safe-route.
- Recovery scenarios: continue, attributable mutation, checkpoint failure, salvage/restart, and unknown external side effects.
- Delegation scenarios: accepted/rejected parent constraints, systematic over-escalation, persistent child constraints, and diversity requests.

## Quality evaluation

### Mechanical work

Use real tests, type checks, static analysis, builds, hidden requirements, mutation oracles, and deterministic invariants. Passing visible tests is necessary evidence, not proof of requirement completeness.

### Open-ended work

Use complementary evidence:

- Absolute rubrics and prewritten critical-omission checklists.
- Hidden fact graphs or source-grounded evidence requirements.
- Citation correctness, source fidelity, and coverage.
- Blind randomized pairwise comparison.
- Diverse, versioned evaluators with family and known training-relation metadata.
- Mandatory human or domain-expert blind review for high-risk cases, evaluator disagreement, or baseline failure.

Call evaluators diverse, not statistically independent. Version judges, measure position and same-family bias, retain rationales, and report disagreement rather than averaging it away.

## Statistical admission protocol

Each Policy Pack preregisters:

- `epsilon`: one-sided non-inferiority margin.
- `delta`: upper bound for unacceptable-result probability.
- Confidence level, power, minimum effect, and interval method.
- Repetition count and variance model across case, model run, repository, and evaluator.
- Multiple-comparison correction across candidate × category decisions.
- Minimum sample sizes derived from the rare severe-failure target.

For binary unacceptable outcomes, use a justified exact or conservative upper confidence bound. Observing zero failures does not establish zero risk; at 95% confidence the rough `3/n` rule shows why small samples cannot support a strict `delta`.

Admission requires all of:

```text
baseline passes its absolute quality and unacceptable-result gates
AND candidate non-inferiority interval satisfies epsilon
AND candidate unacceptable-result upper bound satisfies delta
AND preregistered power and sample size are met
AND no unexplained severe failure cluster exists
AND the task slice is represented in held-out acceptance data
```

## Strategy ablations

Use the same cases, budgets, and randomized order to compare at least:

1. Always Baseline: the admitted baseline configuration for the whole task.
2. Session Static Auto: one admitted route per Session/task objective.
3. Within-turn Auto: confirmed-phase routing without full recovery.
4. Full Auto: within-turn routing plus the recovery control plane under test.

Report incremental differences between adjacent arms. Recovery benefits observed equally under Always Baseline are generic execution-supervision benefits, not routing benefits.

Within-turn routing and full salvage/restart are admitted to product scope only when their incremental end-to-end improvement is material and all quality and safety gates continue to pass.

## Core metrics

### Quality and coverage

- Absolute baseline pass rate.
- `quality_gap_to_baseline` with interval.
- `unacceptable_result_rate` upper bound.
- `under_routing_loss`, severe clusters, quantiles, and worst slices.
- `auto_coverage`, abstention, no-safe-route, and out-of-distribution rates.

### Performance and product value

- Latency to first valid result and total completion latency.
- Input, output, assessor, replay, retry, and recovery tokens.
- Model-call and Benchmark amortized cost.
- Prompt-cache loss and switching overhead.
- Strategy-arm incremental value.

### Recovery and delegation

- Escalation precision/recall and selective risk.
- Episode duration distribution, unresolved survival, and release correctness.
- Continue/salvage/restart incremental success and cost.
- Harmful-mutation escape rate for declared supported effects.
- Parent escalation-request, acceptance, rejection, and override rates.

## Admission lifecycle and revocation

A Route Admission records configuration identity, supported capabilities, task slice, evidence version, sample size, statistics, data date, expiry, invalidation conditions, and revocation status.

Admission is revoked or suspended when:

- The provider/model fingerprint changes or becomes unknown.
- A configured alias may point to an unverified deployment.
- A periodic paired canary crosses a drift threshold.
- The Policy Pack expires.
- A new severe failure cluster appears.
- Required capabilities or evaluator assumptions change.

Revocation immediately removes the configuration from weaker automatic tiers. If no admitted baseline remains, Auto returns `no-safe-route`.

## Labels not used

These facts do not prove route correctness:

- User or parent selected a model or route.
- User accepted or rejected a switch.
- Model claimed the task was simple, complete, or resolved.
- One result was not redone.

Usable evidence includes deliberately designed paired evaluation, reproducible validation, explicit correction tied to objective evidence, confirmed task completion criteria, and attributable recovery side effects.
