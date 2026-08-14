# Specification: DSH Auto Mode

[简体中文](zh-CN/spec.md)

## Status

Proposed, awaiting user review.

## Assumptions

This specification is based on the following assumptions. If any assumption is rejected, update the specification before implementation:

1. The primary user is an individual power user of coding agents, not a centralized enterprise-governance team.
2. The primary success metric is real active users, not plugin downloads, GitHub stars, or model-call volume.
3. The product targets DeepSeek Harness and should remain installable through its plugin ecosystem, but the audited DSH gaps may require narrow upstream core or extension-package changes; the final carrier is not yet accepted.
4. The expected implementation language is TypeScript/ESM, following DSH/Cordis plugin and capability seams, but the technology stack is not yet accepted.
5. Users are willing to spend model calls and project-maintained Benchmark resources for a more reliable Auto mode; they are not expected to maintain calibration thresholds or route evidence themselves.
6. The current stage delivers a design baseline only, not runtime code, dependencies, or CI.

## Objective

Users should no longer guess which model and reasoning effort a task requires. The system selects an appropriate route from task properties, available model capabilities, RouterBench priors, current Session evidence, runtime failures, and user constraints. When selection is wrong, it limits damage, performs only recovery supported by declared capability, and otherwise stops or requests intervention.

The product promises this optimization order:

1. Require the configured baseline to pass an absolute quality gate, then admit candidates only within a predeclared non-inferiority bound and unacceptable-result limit.
2. Within those quality constraints, reduce end-to-end latency first.
3. Reduce model cost and token consumption only after the latency objective is satisfied.

`strong` names the configured baseline guarantee tier; it does not claim that one model is universally strongest. If no currently admitted safe configuration exists, Auto stops with `no-safe-route` instead of calling an unverified fallback.

## User problem

The core problem for individual power users is not the absence of a model selector; it is the absence of trustworthy selection evidence:

- Users struggle to estimate task complexity and the correct effort, so manual selection is often close to random.
- To be safe, users keep a high configuration for most work, adding avoidable latency and cost.
- Users have no A/B counterfactual for a single choice, so their manual choice must not become a supervised label.
- Ordinary Auto modes select only the first call, cannot explain switches, and cannot recover after a wrong selection.
- If a parent agent can select an arbitrary child-agent model, it bypasses unified policy and creates another source of error.

## User experience

The ordinary interaction exposes exactly two choices: `Auto`, or manual provider/model/reasoning selection. Reasoning selection may be an explicit effort or the displayed default behavior supported by that exact route. Selecting Auto is one operation. Policy thresholds, admission matrices, calibration, expiry, and revocation belong to project-maintained versioned Policy Packs, not to ordinary user configuration. Advanced provider restrictions and custom packs are optional.

Users may inspect decisions but do not have to approve every decision:

```text
Selected standard
Reason: bounded code change with explicit tests; standard has current admission
for this task slice and the configured baseline passed its absolute gate.

Escalated to strong
Reason: the same validation failure recurred, opening a diagnosis episode.

Down-routed to standard
Reason: the original failure is resolved and verified; execution entered
the documentation phase, and expected remaining work exceeds switching cost.
```

The product does not provide a Shadow Mode that asks users to guess whether to switch. Transparency exists for explanation and audit; accepting or rejecting a suggestion is not treated as a correctness label. Manual selection exits Auto policy for that scope but still passes Host security and provider capability validation.

## Functional scope

### Required

- Semantic routes: `fast`, `standard`, `strong`, and `abstain`.
- Maintainer-owned versioned Policy Packs plus deployment profiles populated from DSH's active provider/model catalog and exact-route metadata; explicit effort, adapter-default materialization, and provider-default omission remain distinct admission identities, and arbitrary user mappings have no quality guarantee until admitted.
- Routing Policy running in the Host; neither parent agents nor classifier models own normal final decisions.
- A route snapshot frozen before provider-dependent prompt and tool assembly, then applied unchanged to the corresponding model request.
- Explicit resolution outcomes for invalid profiles, unavailable providers, unsatisfiable constraints, and `no-safe-route`.
- Causally ordered persistent records of raw decision context, constraints, assessments, decisions, reasons, frozen catalog and Policy Pack versions, actual models, reasoning selection, and request encoding.
- RouterBench: separate route-capability and production-policy scenario protocols for quality, latency, cost, coverage, and recovery behavior.
- Runtime escalation and episode state, preventing repeated down-routing while a problem remains unresolved.
- Child-agent constraint semantics and authority rules.

### Full direction

- Evidence-gated within-turn phase routing after it proves incremental value over Session-level routing.
- Three recovery actions: `continue`, `salvage`, and `restart`, with full recovery evaluated independently from basic routing safety.
- Association between Session checkpoints and isolated workspace checkpoints.
- Optional Task Assessor and Recovery Assessor with independent calibration.
- Creation-time routing adapters for out-of-process child-agent providers such as Codex and Claude Code.
- Anonymous telemetry and policy calibration from objective runtime facts, only with explicit user consent.

### Outside the current scope

- A general task queue, concurrency scheduler, priorities, preemption, or organization-level budget governance.
- Training a new foundation model.
- Learning a “correct model” from one user manual selection.
- A Router Agent with a full Session, tools, and autonomous loop.
- Automatic reversal of user workspace changes through raw Git commands without isolation.

## Expected technology stack

These choices remain proposals until the specification is accepted:

- TypeScript with strict types and ESM.
- Cordis plugins and DSH Service Definition / Provider / Consumer structures.
- Vitest or the current DSH test infrastructure.
- JSON Schema or equivalent runtime boundary validation for model assessments and persisted events.
- A RouterBench runner and versioned task dataset.

Do not choose additional runtime dependencies before specification review completes.

## Current commands

The repository has no implementation toolchain. Available checks are limited to:

```bash
git status --short --branch
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' .
find docs -type f -name '*.md' -print | sort
```

After an implementation plan is accepted, add installation, build, test, lint, typecheck, and Benchmark commands here. Do not rely on undocumented implicit workflows.

## Project structure

Current structure:

```text
docs/                 Canonical English design and review material
docs/decisions/       Canonical architecture decision records
docs/zh-CN/           Simplified Chinese translations
README.md             Canonical project entry point
README.zh-CN.md       Simplified Chinese project entry point
CONTRIBUTING.md       Canonical contribution rules
AGENTS.md             Canonical agent work rules
```

The implementation structure must be reviewed in the technical plan. Do not create empty `src/` or `tests/` directories now.

## Proposed code style

Public types use explicit discriminated unions, keeping semantic routes separate from concrete models:

```ts
type RouteDecision =
  | {
      outcome: 'selected'
      route: RouteId
      reasonCode: ReasonCode
      policyVersion: string
    }
  | {
      outcome: 'abstained'
      requestedFallback: RouteId
      reasonCode: ReasonCode
      policyVersion: string
    }

type RouteResolution =
  | { outcome: 'resolved'; route: RouteId; config: EffectiveCallConfig }
  | {
      outcome: 'failed'
      failure:
        | 'constraints-unsatisfiable'
        | 'profile-invalid'
        | 'profile-unavailable'
        | 'provider-unavailable'
        | 'no-safe-route'
      reasonCode: ReasonCode
    }
```

Policy returns a target route. `keep`, `upgrade`, and `downgrade` are derived by comparing adjacent decisions; they are not embedded in the decision type. Public APIs must define inputs, outputs, failures, timing, and persistence requirements.

## Test strategy

- Unit tests: route-constraint parsing, policy precedence, episode state machine, and recovery-action selection.
- Property/state-machine tests: hard constraints cannot be bypassed by a model suggestion or parent-agent override.
- Integration tests: real DSH `agent/request`, Session events, child-agent lifecycle assembly, explicit/default reasoning encodings, and deterministic concrete-candidate resolution from a frozen catalog.
- Snapshot tests: user-visible decision explanations and recovery transcripts.
- RouterBench: isolated calibration/validation/held-out data, paired repeated runs, absolute gates, and four strategy arms covering Always Baseline through routing plus recovery.
- Fault injection: model timeout, low-confidence assessor, wrong route, repeated test failure, and unavailable checkpoint.
- Security tests: pre-existing uncommitted workspace changes, concurrent agent modifications, and malicious or incorrect parent-agent constraints.

Every user-visible routing behavior needs secret-free critical-path tests. Evaluations that require real models must be separately marked and reproducible.

## Work boundaries

### Always

- Update the specification or ADR before implementing a change in public behavior.
- Record every route decision, effective configuration, and reason.
- `abstain` for low-confidence, out-of-distribution, and high-risk non-verifiable tasks; stop when no admitted safe route exists.
- Treat model assessment as evidence, not final authority.
- Where policy is exercised, use the same policy implementation for online routing and Policy Scenario Bench; Route Capability Bench keeps treatment assignment and oracle metadata outside policy.

### Confirm first

- Change a DSH core extension point or Session format.
- Add a third-party dependency, telemetry upload, remote service, or account system.
- Change the quality baseline, optimization order, or parent-agent authority model.
- Automatically create, restore, or delete a workspace checkpoint.
- Publish an npm package or GitHub Release, or enable Auto by default.

### Never

- Commit secrets or record sensitive prompt values.
- Treat a user model choice, parent-agent override, or one model self-report as a correct label.
- Release an episode route floor because time, token, or step count expired.
- Roll back files or external side effects without proof of ownership.
- Switch models silently without recording the final configuration and reason.

## Success criteria

### Product success

- Primary metric: real active users who continue using Auto.
- Operational definition: among users who consent to product telemetry, report the cohort that completes a configured minimum number of Auto tasks in 28 days and returns in the following 28-day window. Non-consenting users remain unobserved rather than estimated.
- Supporting metrics: Auto enablement, completed Auto tasks, manual takeover, failure-to-retention, and opt-out rate.
- Users can understand why any routing or recovery action occurred.
- Ordinary users perform one mode choice—Auto or manual—and do not maintain calibration data or provide pseudo-supervision to the router.

### Routing quality

- Every task category baseline must pass an absolute quality gate before it can define a guarantee tier.
- A candidate route may automatically cover a task category only when RouterBench shows a predeclared non-inferiority bound within `epsilon`, an unacceptable-result upper bound within `delta`, sufficient power, and no unresolved severe failure cluster.
- Out-of-distribution, weak-evidence, or high-impact non-verifiable tasks `abstain`.
- Expired, revoked, drifted, or unidentifiable admissions cannot down-route; absent a safe admitted baseline, resolution returns `no-safe-route`.
- Report auto coverage, abstention rate, and under-routing loss; do not hide severe failures in an average score.

### Performance

- Metrics include full end-to-end latency, including classifier, switching, cache loss, recovery, and retry cost.
- Compare latency before cost after the quality constraint is satisfied.
- Do not down-route when savings from the remaining step are smaller than model-switching cost.
- Compare Always Baseline, Session-level static Auto, within-turn Auto, and within-turn Auto plus recovery before admitting later control planes.

### Recovery

- Within one unresolved episode, the route floor may only stay fixed or rise.
- Within-turn down-routing is enabled only after a persisted confirmed phase boundary and independent evidence that it adds net value over Session-level routing.
- Mutable down-routing requires declared sufficient recovery capability; `salvage` and `restart` apply only to attributable, adapter-supported side effects and must not overwrite pre-existing user or other-agent changes.

## Open questions

The authoritative list is in [Open questions](open-questions.md). Do not begin full implementation before closing:

- Initial taxonomy, absolute quality gates, non-inferiority margins, and evaluation power.
- Sources, signing, expiry, revocation, and update ownership for default Policy Packs.
- The upstream DSH seams identified in [DSH integration evidence](dsh-integration.md).
- A recoverable execution world and checkpoint provider.
- Fixed configuration, invocation threshold, and privacy boundary for Task and Recovery Assessors.
