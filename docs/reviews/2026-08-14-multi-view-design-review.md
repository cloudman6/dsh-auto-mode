# Multi-view design review — 2026-08-14

[简体中文](../zh-CN/reviews/2026-08-14-multi-view-design-review.md)

## Status and role

Informational historical review record. It does not override the normative specification or ADRs. Accepted changes are linked to their current authoritative documents.

## Review method

The review used independent AI passes for architecture (A), product/evidence evaluation (B), adversarial red-team analysis (F), user experience (C), implementation feasibility (K), and a meta-review (Z). The final disposition was **revise, not reject**: the product problem and Host-owned policy direction are coherent, but the original design made unsupported quality, integration, recovery, and complexity claims.

These passes are not statistically independent expert votes. They share model-family priors and the same source documents; agreement is a prioritization signal, not external validation.

## Consensus findings incorporated

### Quality needs an absolute gate

Relative parity with a configured `strong` route is insufficient when the baseline itself fails. The revised design requires an absolute baseline gate, candidate non-inferiority interval, unacceptable-result upper bound, held-out evidence, and revocable admission. See [routing policy](../routing-policy.md), [RouterBench](../routerbench.md), and [ADR-002](../decisions/0002-quality-constrained-optimization.md).

### Capability evidence and policy behavior are different experiments

Model/effort qualification and control-plane behavior were previously mixed. RouterBench now separates Route Capability Bench from Policy Scenario Bench and compares Always Baseline, Session Static Auto, Within-turn Auto, and Full Auto as adjacent strategy arms. See [RouterBench](../routerbench.md) and [ADR-006](../decisions/0006-evidence-governed-route-admission.md).

### Route selection must precede provider-dependent assembly

Applying a route only at `agent/request` can make prompt/tool assembly disagree with the effective provider. The revised architecture requires one frozen Route Snapshot. A source audit found DSH already has a coupled model-selection helper, but lacks the current-step message-bearing pre-assembly semantic decision seam required by Auto. See [architecture](../architecture.md) and [DSH integration](../dsh-integration.md).

### Recovery claims require declared effect support

A Session or Git boundary does not recover arbitrary filesystem, process, database, API, message, or deployment effects. Recovery Capability now gates mutable down-routing, salvage, and restart; unknown or failed recovery produces explicit intervention states. See [recovery](../recovery.md) and [ADR-007](../decisions/0007-recovery-capability-gates-recovery-claims.md).

### Parent-agent authority must be bounded in both directions

Preventing a parent from lowering quality is insufficient if every stronger request automatically bypasses policy. Parent inputs are now proposals; Host Delegation Policy resolves recognized requirements, rejects conflicts, and records acceptance and over-escalation. See [delegation](../delegation.md) and [ADR-004](../decisions/0004-monotonic-parent-authority.md).

### Normative state cannot depend on prompts or ignorable events

Objective, phase, decision, episode, constraint, and recovery state require typed, versioned, provenance-aware persistence. Current DSH rejects unknown required plugin events after cold load and has no runtime registration surface at the audited commit. This is a blocking upstream compatibility contract. See [ADR-003](../decisions/0003-formal-recovery-protocol.md) and [DSH integration](../dsh-integration.md).

## User-experience arbitration

One review warned that Auto could replace model-choice burden with Profile maintenance. That conclusion does not apply to the intended normal user flow. The product surface has exactly two choices:

- Auto.
- Manual provider/model/reasoning effort.

Policy Pack authors and maintainers own calibration, expiration, revocation, and deployment-profile evidence. Users may inspect why Auto changed a route, but are not asked to tune routing profiles or certify a decision without a counterfactual.

Transparency remains necessary, but default presentation should aggregate events into the selected tier, concrete configuration, primary reason, constraints, and any safety stop. Full traces remain inspectable for diagnosis.

## Conflicts resolved

### Full architecture versus narrower first product behavior

The review did not justify deleting within-turn adaptation, recovery, or delegation from the architecture. It did justify making them evidence-gated product capabilities. The [roadmap](../roadmap.md) retains the full design but requires incremental causal value over Session Static Auto before each control plane enters the product surface.

### Strong fallback versus fail closed

`abstain` uses an admitted configured baseline when one exists. If the baseline is unadmitted, unavailable, incompatible, or cannot satisfy hard constraints, the result is `no-safe-route`; silently using a nominal `strong` alias is prohibited.

### Host-owned policy versus implementation location

The Host owns normal decision authority. That does not decide whether the first implementation ships as an external plugin, an upstream DSH capability, or a split architecture. The carrier remains an open implementation-planning question.

## Residual risks

- Benchmark contamination, evaluator-family bias, and insufficient severe-failure sample size can still create false admission confidence.
- Provider aliases and silent model changes can invalidate Policy Packs faster than canaries detect drift.
- First-step semantic routing remains blocked without a pre-assembly decision input that includes claimed messages.
- Required plugin state remains unsafe until DSH provides event registration and compatibility handling.
- External Codex and Claude Code subagents do not currently expose the required request-level model/effort control through the audited DSH provider seam.
- Privacy and retention policy for real-use evidence is not yet specified.

## Meta-review limitation

The review increased defect discovery breadth but did not establish empirical product value, benchmark validity, security, or DSH compatibility. Those claims require source-pinned contract tests, held-out experiments, fault injection, privacy review, and real-user evidence. Consensus from these AI reviewers must not be cited as proof that a design choice is correct.
