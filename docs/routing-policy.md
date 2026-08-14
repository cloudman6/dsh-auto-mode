# Routing policy

[简体中文](zh-CN/routing-policy.md)

## Objective function

Routing Policy does not seek the cheapest model. It solves a constrained optimization problem:

```text
Constraint: candidate-route quality is no lower than the strong baseline
            minus epsilon, and unacceptable-result probability is no
            greater than delta.

Objective: minimize end-to-end latency first, then total cost.
```

End-to-end metrics include assessors, history replay, cache loss, switching, failures, escalation, and recovery. Comparing one API call price is insufficient.

## Route semantics

```ts
type BuiltinRoute = 'fast' | 'standard' | 'strong'

type RouteDecision =
  | {
      outcome: 'selected'
      route: BuiltinRoute
      reasonCode: ReasonCode
    }
  | {
      outcome: 'abstained'
      fallbackRoute: 'strong'
      reasonCode: ReasonCode
    }
```

- `fast`: low complexity and risk, bounded scope, and easy verification or recovery.
- `standard`: default production work, balancing quality and speed.
- `strong`: complex, high-risk, non-verifiable, out-of-distribution, or already stalled.
- `abstain`: policy lacks sufficient evidence to select a weaker route safely. Execution uses the `strong` fallback, but metrics distinguish abstention from selecting strong deliberately.

A route ID is a policy semantic, not a model name. User profiles map it to an actual provider/model/effort.

## Decision precedence

```text
Explicit user route lock
→ Host/security/capability hard constraints
→ Quality floor calculated by Delegation Policy
→ Route floor from active Recovery Episodes
→ Routing Policy
→ Strong fallback after abstention
→ Route Profile Resolver and adapter capability validation
```

One resolver must compute this precedence. Multiple plugins cannot each claim final authority.

## Initial task selection

The first question is not “Which model is cheapest?” It is:

> Is there sufficient evidence not to use strong?

When evidence is insufficient, `abstain`. Only after sufficient evidence exists does policy choose between `fast` and `standard`.

This reflects asymmetric under-routing and over-routing loss: a weak model missing a critical issue usually costs far more than one unnecessary strong-model call.

## Down-routing admission without mechanical verification

No runtime test does not mean no objective evidence. The system may combine:

1. RouterBench quality priors for the task category.
2. Current task risk, scope, reversibility, and error detectability.
3. Partial checks such as citation coverage, source fidelity, and structured checklists.
4. Whether the task lies inside a calibrated distribution and the classification confidence.

A route weaker than strong is allowed only when all conditions hold:

```text
Candidate route passes the quality gate for this task category
AND task belongs to a calibrated distribution
AND error impact is limited
AND scope is bounded
AND result is easy to review or recover
AND classification confidence reaches the policy threshold
```

Typical decisions:

| Task | Decision |
|---|---|
| Local README copy edit | `fast` or `standard` may be selected |
| Source-backed document summary | May down-route after Benchmark admission and citation checks |
| Long-term storage architecture | Default to `abstain` / `strong` |
| Security-vulnerability exploitability judgment | `strong` |
| Unfamiliar domain or low classification confidence | `abstain` |

## Re-routing within a turn

One DSH turn may contain multiple model steps. Prohibiting all down-routing within a turn wastes low-risk tail work; allowing arbitrary up- and down-routing per step creates oscillation.

The correct scope is one unresolved episode:

- The effective route floor may only stay fixed or rise within one episode.
- After trusted evidence closes the episode, policy recomputes the base route for a new phase and may down-route within the same turn.
- A phase describes the current kind of work. An episode explains why a temporary route floor exists. A model's claim that it entered a new phase does not close an unresolved episode.

Effective route:

```text
max(
  base route for the current phase,
  user quality floor,
  hard-constraint floor,
  Delegation Policy floor,
  floor of every active episode
)
```

## Escalation and down-routing thresholds

Escalation thresholds should be low; down-routing thresholds should be high:

- Repeated failure, high-risk ambiguity, missing capability, or context overflow may escalate immediately.
- Down-routing requires that the escalation trigger is resolved, relevant validation occurred after the latest mutation, a stable checkpoint exists, and expected remaining work exceeds switching cost.
- Time, step, or token expiration cannot release a route floor automatically.

This hysteresis prevents oscillation such as:

```text
standard → strong → standard → strong → fast
```

## Switching economics

Switching models is not free:

- Changing provider/model may discard prompt cache.
- The new model must replay history.
- Information present only in private state of the previous model cannot be handed off reliably.
- Savings on one simple tail step may be smaller than switching overhead.

Policy must therefore estimate remaining work and switching cost. If only one commit message remains, the main Agent need not switch; execution may retain the current model, make one lightweight auxiliary call, or use a deterministic tool.

An action name cannot determine a route by itself: “update documentation” may change public API semantics, and “commit code” may require a high-risk final review.

## Decision transparency

Auto executes high-confidence decisions directly instead of asking users to guess whether to accept them. Every decision exposes:

- Effective route and provider/model/effort.
- Selection, keep, escalation, down-routing, or abstention.
- Structured reason code and short explanation.
- Key evidence and policy/profile versions.
- Recovery action and checkpoint when recovery occurs.

User behavior is not a routing label. A user may explicitly correct and lock a route, but that record represents user intent only.
