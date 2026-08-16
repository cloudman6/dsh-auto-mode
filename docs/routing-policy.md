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

## Phase 0P experimental objective

Phase 0P does not claim to solve the admitted quality-constrained objective. It uses a separate, explicit evidence state:

```ts
type RouteEvidenceState =
  | { kind: 'admitted'; admissionId: AdmissionId }
  | {
      kind: 'experimental-unadmitted'
      source: 'artificial-analysis'
      sourceSnapshotId: ExternalEvidenceSnapshotId
      externalRecordId: string
    }
```

Task Assessment deterministically chooses the relevant index family: coding work uses the Coding Index, tool-heavy multi-step work uses the Agentic Index, and broad reasoning uses the Intelligence Index. Any mixed weighting, score boundary, freshness period, or latency/cost tie-break is part of a versioned experimental policy, not a hidden runtime constant.

The Phase 0P resolver considers only exact DSH and external-record identity matches. `strong` means the highest relevant external score among currently eligible exact matches; `standard` and `fast` select lower-latency configurations only within their recorded heuristic score boundaries. These names are experimental tiers, not quality guarantees. High-risk, unknown, or low-confidence task assessment selects the strongest exact match from a valid frozen catalog. An unmatched or drifted route, invalid evidence, or missing required Host contract exits Auto with `no-experimental-route` and no call. It never reuses admitted Auto's `no-safe-route`. The explanation always exposes the experimental state and source snapshot.

Host-declared `RecoveryCapability` and execution-world effect classes are required policy inputs. No experimental tier, including `strong`, may execute mutable work unless possible loss is inside an ADR-007-compliant risk bound accepted in a separate decision and every relevant effect class has sufficient declared attribution and recovery support. This routing-safety bound is not route admission. Until it exists, Phase 0P does not automatically execute mutable work. Any irreversible external effect, or any mutation not proved inside the bound, terminates the current Experimental Auto attempt with `no-experimental-route`. User intervention may switch to Manual or wait for newly declared execution-world facts; confirmation cannot authorize the denied Experimental Auto dispatch. Task Assessment cannot infer or override these capability facts.

Experimental evidence cannot satisfy `RouteAdmission`, cannot be consumed by Phase 0C policy, and cannot be promoted without the normal RouterBench protocol.

## User interaction boundary

The ordinary user-facing choice has exactly two modes:

- `Auto`: the Host selects an admitted route and explains changes.
- Manual: the user selects provider/model/reasoning behavior directly, including supported defaults.

Phase 0P retains these two modes but labels Auto as Experimental Auto and requires explicit maintainer opt-in.

Ordinary users do not configure `epsilon`, `delta`, assessor thresholds, expiry, canaries, or route-admission matrices. Those facts belong to a maintainer-owned, versioned Policy Pack. Advanced users may restrict providers, define budgets, or install a custom pack, but a custom mapping has no quality guarantee until admitted by the same evidence protocol.

Manual mode bypasses Auto policy, not Host security or provider capability validation. A manual choice is user intent, never a correctness label.

The Experimental Auto preparation listener is a no-op in Manual mode: it returns control to DSH's existing manual model-selection and Host/provider validation path. Switching to Manual may append an Auto-exit audit fact, but it is never represented as a denied Auto call and must not reject or consume the manual turn.

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

Discovery is automatic and its size is not hard-coded. Availability in DSH is necessary but not sufficient for admitted Auto: only the intersection of discovered configurations and current admissions enters that candidate set. Phase 0P builds its structurally separate experimental candidate set under the exact-match rules above. Other unadmitted configurations may remain available to manual selection.

Provider aliases, server-side model changes, default-effort changes, and missing fingerprints can invalidate evidence. Expired, revoked, or unidentifiable configurations are unavailable for automatic down-routing until canaries or a complete evaluation renew admission.

## Route semantics

```ts
type BuiltinRoute = 'fast' | 'standard' | 'strong'

type PolicyDecision =
  | { outcome: 'selected'; route: BuiltinRoute; reasonCode: ReasonCode }
  | { outcome: 'abstained'; requestedFallback: 'strong'; reasonCode: ReasonCode }

type SharedResolutionFailure =
  | 'constraints-unsatisfiable'
  | 'profile-invalid'
  | 'profile-unavailable'
  | 'provider-unavailable'

type RouteResolution =
  | {
      outcome: 'resolved'
      route: BuiltinRoute
      config: EffectiveCallConfig
      evidence: { kind: 'admitted'; admissionIdentity: AdmissionIdentity }
    }
  | {
      outcome: 'resolved'
      route: BuiltinRoute
      config: EffectiveCallConfig
      evidence: {
        kind: 'experimental-unadmitted'
        experimentalRouteIdentity: ExperimentalRouteIdentity
        sourceSnapshotId: ExternalEvidenceSnapshotId
        externalRecordId: string
      }
    }
  | {
      outcome: 'failed'
      evidenceKind: 'admitted'
      failure: SharedResolutionFailure | 'no-safe-route'
      reasonCode: ReasonCode
    }
  | {
      outcome: 'failed'
      evidenceKind: 'experimental-unadmitted'
      failure: SharedResolutionFailure | 'no-experimental-route'
      reasonCode: ReasonCode
    }
```

- `fast`: the lowest admitted guarantee tier for bounded, low-risk work.
- `standard`: the normal admitted guarantee tier for production work.
- `strong`: the configured baseline guarantee tier for the task category, after that baseline passes an absolute gate.
- `abstained`: Policy lacks evidence to choose a weaker tier. Resolution attempts the admitted baseline, but returns `no-safe-route` without a model call if no safe configuration exists.

In admitted Auto, `fast < standard < strong` orders policy guarantee tiers, not raw model intelligence. A concrete configuration may occupy an admitted tier for a task category only when the Policy Pack contains current admission evidence. A specialist configuration that outperforms the configured baseline belongs in the tier justified by its evidence; its model name does not determine the tier. Phase 0P's identically named tiers remain heuristic and `experimental-unadmitted`.

Admitted Routing Policy and Route Profile Resolver operate on one immutable Effective Route Catalog snapshot. Phase 0P operates on a structurally separate immutable Experimental Route Catalog snapshot. The admitted resolver filters by admission, identity, capability, and security and uses stable `AdmissionIdentity` as its final tie-break; the experimental resolver filters by exact external evidence identity and uses its stable experimental route identity. Missing identity or required comparison metrics is `profile-invalid`. Live catalog order, asynchronous discovery completion, and object iteration order are never selection signals.

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
