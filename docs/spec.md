# Specification: DSH Auto Mode

[简体中文](zh-CN/spec.md)

## Status

Proposed, awaiting user review.

## Assumptions

This specification is based on the following assumptions. If any assumption is rejected, update the specification before implementation:

1. The primary user is an individual power user of coding agents, not a centralized enterprise-governance team.
2. The primary success metric is real active users, not plugin downloads, GitHub stars, or model-call volume.
3. The product starts as a DeepSeek Harness plugin, but public policy and Benchmark data structures should not bind to one model provider.
4. The expected implementation language is TypeScript/ESM, following DSH/Cordis plugin and capability seams, but the technology stack is not yet accepted.
5. Users are willing to spend model calls and Benchmark resources for a more reliable Auto mode; absolute minimum cost is not the objective.
6. The current stage delivers a design baseline only, not runtime code, dependencies, or CI.

## Objective

Users should no longer guess which model and reasoning effort a task requires. The system selects an appropriate route from task properties, available model capabilities, RouterBench priors, current Session evidence, runtime failures, and user constraints; when the selection is wrong, it limits damage and recovers.

The product promises this optimization order:

1. Preserve the quality baseline of a fixed `strong` route.
2. Within that quality constraint, reduce end-to-end latency first.
3. Reduce model cost and token consumption only after the latency objective is satisfied.

## User problem

The core problem for individual power users is not the absence of a model selector; it is the absence of trustworthy selection evidence:

- Users struggle to estimate task complexity and the correct effort, so manual selection is often close to random.
- To be safe, users keep a high configuration for most work, adding avoidable latency and cost.
- Users have no A/B counterfactual for a single choice, so their manual choice must not become a supervised label.
- Ordinary Auto modes select only the first call, cannot explain switches, and cannot recover after a wrong selection.
- If a parent agent can select an arbitrary child-agent model, it bypasses unified policy and creates another source of error.

## User experience

The default interaction exposes one `Auto` mode. Users may inspect decisions but do not have to approve every decision:

```text
Selected standard
Reason: bounded code change with explicit tests; this task category meets
the strong quality baseline in RouterBench.

Escalated to strong
Reason: the same validation failure recurred, opening a diagnosis episode.

Down-routed to standard
Reason: the original failure is resolved and verified; execution entered
the documentation phase, and expected remaining work exceeds switching cost.
```

The product does not provide a Shadow Mode that asks users to guess whether to switch. Transparency exists for explanation and audit; accepting or rejecting a suggestion is not treated as a correctness label.

## Functional scope

### Required

- Semantic routes: `fast`, `standard`, `strong`, and `abstain`.
- User-configurable route profiles that map semantic routes to provider/model/effort.
- Routing Policy running in the Host; neither parent agents nor classifier models own normal final decisions.
- A routing seam before every model request, supporting re-routing across phases within one turn.
- A safe fallback for `abstain`, defaulting to a fixed high configuration.
- Persistent records of decisions, reasons, policy versions, actual models, and effort.
- RouterBench: paired experiments for quality, latency, cost, coverage, and recovery behavior.
- Runtime escalation and episode state, preventing repeated down-routing while a problem remains unresolved.
- Child-agent constraint semantics and authority rules.

### Full direction

- Three recovery actions: `continue`, `salvage`, and `restart`.
- Association between Session checkpoints and isolated workspace checkpoints.
- Optional Task Assessor and Recovery Assessor.
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
      fallbackRoute: RouteId
      reasonCode: ReasonCode
      policyVersion: string
    }
```

Policy returns a target route. `keep`, `upgrade`, and `downgrade` are derived by comparing adjacent decisions; they are not embedded in the decision type. Public APIs must define inputs, outputs, failures, timing, and persistence requirements.

## Test strategy

- Unit tests: route-constraint parsing, policy precedence, episode state machine, and recovery-action selection.
- Property/state-machine tests: hard constraints cannot be bypassed by a model suggestion or parent-agent override.
- Integration tests: real DSH `agent/request`, Session events, and child-agent lifecycle assembly.
- Snapshot tests: user-visible decision explanations and recovery transcripts.
- RouterBench: paired runs of each task against a candidate route and the `strong` baseline.
- Fault injection: model timeout, low-confidence assessor, wrong route, repeated test failure, and unavailable checkpoint.
- Security tests: pre-existing uncommitted workspace changes, concurrent agent modifications, and malicious or incorrect parent-agent constraints.

Every user-visible routing behavior needs secret-free critical-path tests. Evaluations that require real models must be separately marked and reproducible.

## Work boundaries

### Always

- Update the specification or ADR before implementing a change in public behavior.
- Record every route decision, effective configuration, and reason.
- `abstain` for low-confidence, out-of-distribution, and high-risk non-verifiable tasks.
- Treat model assessment as evidence, not final authority.
- Use the same policy implementation for online routing and RouterBench.

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
- Users can understand why any routing or recovery action occurred.
- Users do not need to keep selecting a model and effort or provide pseudo-supervision to the router.

### Routing quality

- Every task category uses its configured `strong` route as a baseline.
- A candidate route may automatically cover a task category only when RouterBench shows a quality gap within configured tolerance `epsilon` and an unacceptable-result bound within `delta`.
- Out-of-distribution, weak-evidence, or high-impact non-verifiable tasks `abstain`.
- Report auto coverage, abstention rate, and under-routing loss; do not hide severe failures in an average score.

### Performance

- Metrics include full end-to-end latency, including classifier, switching, cache loss, recovery, and retry cost.
- Compare latency before cost after the quality constraint is satisfied.
- Do not down-route when savings from the remaining step are smaller than model-switching cost.

### Recovery

- Within one unresolved episode, the route floor may only stay fixed or rise.
- The same turn may be re-routed downward after a trusted phase boundary.
- `salvage` and `restart` must not overwrite pre-existing user or other-agent changes.

## Open questions

The authoritative list is in [Open questions](open-questions.md). Do not begin full implementation before closing:

- Initial RouterBench task categories and quality-evaluation protocol.
- Sources and update ownership for default model profiles.
- Whether DSH already exposes sufficient extension points for persistent routing constraints and semantic child-agent constraints.
- A recoverable execution world and checkpoint provider.
- Fixed configuration, invocation threshold, and privacy boundary for Task and Recovery Assessors.
