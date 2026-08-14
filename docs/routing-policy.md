# Routing policy

[简体中文](zh-CN/routing-policy.md)

## Objective function

Routing Policy solves a quality-constrained optimization problem. It does not seek the cheapest model and it does not assume that a configuration named `strong` is safe merely because of its name.

```text
Admission prerequisites:
  the task-category baseline passes an absolute quality gate
  AND the candidate satisfies a predeclared non-inferiority bound
  AND the unacceptable-result upper bound satisfies delta
  AND the evidence is current and no severe failure cluster is unresolved

Objective after admission:
  minimize end-to-end latency first, then total cost
```

End-to-end metrics include assessment, prompt assembly, history replay, cache loss, switching, failures, escalation, and recovery. Comparing one API-call price is insufficient.

## User interaction boundary

The ordinary user-facing choice has exactly two modes:

- `Auto`: the Host selects an admitted route and explains changes.
- Manual: the user selects provider/model/reasoning behavior directly, including supported defaults.

Ordinary users do not configure `epsilon`, `delta`, assessor thresholds, expiry, canaries, or route-admission matrices. Those facts belong to a maintainer-owned, versioned Policy Pack. Advanced users may restrict providers, define budgets, or install a custom pack, but a custom mapping has no quality guarantee until admitted by the same evidence protocol.

Manual mode bypasses Auto policy, not Host security or provider capability validation. A manual choice is user intent, never a correctness label.

## Policy Pack and deployment profile

A versioned Policy Pack binds the facts required to interpret route guarantees:

```ts
interface PolicyPack {
  id: string
  version: string
  taxonomyVersion: string
  policyVersion: string
  evaluatorVersion: string
  admissions: RouteAdmission[]
  expiresAt: string
  revocationState: 'active' | 'expired' | 'revoked'
}
```

It contains task taxonomy, baseline definitions, candidate admissions, quality thresholds, assessor policy, evidence references, expiry, and revocation conditions. A deployment profile reads the active provider/model catalog and exact-route metadata from DSH, then combines them with credentials references, user allowlists, capability metadata, and stable deployment identity evidence. The Effective Route Catalog is compiled from the Policy Pack and deployment profile; neither source alone grants admission.

Reasoning selection is part of concrete route identity and has three non-interchangeable forms:

```ts
type ReasoningSelection =
  | { mode: 'explicit'; effortId: ReasoningEffortId }
  | { mode: 'adapter-default'; effortId: ReasoningEffortId }
  | { mode: 'provider-default' }

interface AdmissionIdentity {
  providerRoute: string
  modelId: string
  reasoning: ReasoningSelection
  deploymentFingerprint: string
  adapterIdentity: string
}
```

`explicit` requires exact-route reasoning metadata that contains the requested effort. `adapter-default` requires a resolved adapter default and records the materialized effort. `provider-default` means the request deliberately omits effort and preserves provider behavior; it is not equivalent to an unknown or empty explicit effort. It may enter Auto only when admission evidence evaluated that omission behavior and the deployment identity contract is strong enough to detect or conservatively invalidate drift.

Discovery is automatic and its size is not hard-coded. Availability in DSH is necessary but not sufficient for Auto: only the intersection of discovered configurations and current admissions enters the automatic candidate set. Unadmitted configurations may remain available to manual selection.

Provider aliases, server-side model changes, default-effort changes, and missing fingerprints can invalidate evidence. Expired, revoked, or unidentifiable configurations are unavailable for automatic down-routing until canaries or a complete evaluation renew admission.

## Route semantics

```ts
type BuiltinRoute = 'fast' | 'standard' | 'strong'

type PolicyDecision =
  | { outcome: 'selected'; route: BuiltinRoute; reasonCode: ReasonCode }
  | { outcome: 'abstained'; requestedFallback: 'strong'; reasonCode: ReasonCode }

type ResolutionFailure =
  | 'constraints-unsatisfiable'
  | 'profile-invalid'
  | 'profile-unavailable'
  | 'provider-unavailable'
  | 'no-safe-route'

type RouteResolution =
  | { outcome: 'resolved'; route: BuiltinRoute; config: EffectiveCallConfig }
  | { outcome: 'failed'; failure: ResolutionFailure; reasonCode: ReasonCode }
```

- `fast`: the lowest admitted guarantee tier for bounded, low-risk work.
- `standard`: the normal admitted guarantee tier for production work.
- `strong`: the configured baseline guarantee tier for the task category, after that baseline passes an absolute gate.
- `abstained`: Policy lacks evidence to choose a weaker tier. Resolution attempts the admitted baseline, but returns `no-safe-route` without a model call if no safe configuration exists.

`fast < standard < strong` orders policy guarantee tiers, not raw model intelligence. A concrete configuration may occupy a tier for a task category only when the Policy Pack contains current admission evidence. A specialist configuration that outperforms the configured baseline belongs in the tier justified by its evidence; its model name does not determine the tier.

Routing Policy and Route Profile Resolver operate on one immutable Effective Route Catalog snapshot. Policy uses versioned tier-level quality and performance evidence to select a guarantee tier. Within that selected tier and the resolved candidate set, the resolver filters by admission, identity, capability, and security; it then orders candidates by predicted end-to-end latency, total cost, and stable `AdmissionIdentity` as the final tie-break. Missing identity or required comparison metrics is `profile-invalid`. Live catalog order, asynchronous discovery completion, and object iteration order are never selection signals.

## Constraint resolution and precedence

Auto computes constraints before selecting a route:

```text
Host security and provider capability constraints
→ user provider allow/deny rules and user quality floor
→ Host-accepted parent-agent requirements
→ floors from active Recovery Episodes
→ Routing Policy
→ Route Profile Resolver
```

An exact provider/model/reasoning selection is Manual mode, not a higher-priority Auto rule. A parent constraint becomes binding only when it maps to a Host-recognized requirement or the user explicitly grants the parent semantic-route override authority. Unsupported or conflicting constraints produce an explicit resolution failure; they are not silently discarded.

The resolver emits `ResolvedRoutingConstraints`, including accepted and rejected inputs, their provenance, the effective candidate set, the computed floor, and reason codes. Route Profile Resolver then resolves only within that candidate set.

## Initial selection

The first question is:

> Is there current evidence that an admitted route can satisfy this task's quality and safety requirements?

When evidence is insufficient, Policy abstains. It does not infer that the configured baseline is safe from its label. The resolver may use an admitted baseline candidate or stop with `no-safe-route`.

Recovery capability is part of the input. Before selecting a weaker route for mutable work, Policy must know whether the execution world is read-only, mutations are attributable and recoverable, or external side effects are declared irreversible. Unknown or non-recoverable high-impact mutation capability raises the floor or prevents Auto execution.

## Admission without mechanical verification

No runtime test does not mean no objective evidence. Policy may combine:

1. Current RouterBench priors for the task category.
2. Task risk, scope, reversibility, and error detectability.
3. Partial checks such as citation coverage, source fidelity, and predeclared omission checklists.
4. Distribution membership and calibrated assessment confidence.
5. An absolute unacceptable-result gate for both baseline and candidate.

A route below the baseline is allowed only when all conditions hold:

```text
candidate admission is current for this task category
AND baseline and candidate pass their absolute gates
AND task belongs to the calibrated distribution
AND impact and scope fit the admission envelope
AND the execution world's recovery capability is sufficient
AND assessment confidence reaches the policy threshold
```

## Phase routing within a turn

Within-turn phase routing is a candidate capability, not a prerequisite for the first usable Auto mode. It may be enabled only when Policy Scenario Bench shows a material end-to-end improvement over Session-level static routing without violating the quality gate.

When enabled:

- Execution Context Projector owns confirmed `PhaseState`; a model or classifier may only propose a phase.
- Routing Policy consumes a persisted confirmed phase, never a free-form completion claim.
- An unresolved episode floor may only stay fixed or rise.
- A confirmed phase transition does not close an episode; episode release still requires its own evidence.
- Down-routing requires current admission, sufficient recovery capability, hysteresis, and expected savings greater than switching cost.

Effective guarantee tier:

```text
max(
  admitted base tier for confirmed phase,
  user quality floor,
  Host-accepted delegation floor,
  floor of every active episode
)
```

## Escalation and switching

Repeated failure, high-risk ambiguity, missing capability, context overflow, or invalidated admission may escalate or stop immediately. Time, step, or token expiration may trigger reassessment but cannot prove resolution or release a floor.

Switching may discard prompt cache, require history replay, and lose provider-private state. Route selection therefore estimates remaining work and switching cost. A trivial tail action does not force a switch when its expected savings are smaller than the handoff cost; deterministic tools remain preferable when they can complete the work without another model call.

## Decision transparency

Auto executes admitted decisions without asking users to provide pseudo-supervision. The default UI shows the current route plus route changes, abstention, resolution failures, and recovery actions. Repeated `keep` events are aggregated. A detailed timeline exposes:

- Effective guarantee tier, provider/model/reasoning selection, and request encoding.
- Selection, keep, escalation, down-routing, abstention, or failure.
- Structured reason code and concise explanation.
- Evidence references and Policy Pack/profile versions.
- Recovery action, execution-world capability, and checkpoint when applicable.

Accepting, rejecting, or manually replacing a route expresses user intent only; it is never treated as a correct routing label.
