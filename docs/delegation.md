# Child-agent delegation and routing authority

[简体中文](zh-CN/delegation.md)

## Core principle

A parent agent expresses what a child task needs; Routing Policy decides which route provides it. A parent agent is itself a model and does not become the final controller of the model catalog by default.

## Authority precedence

```text
Explicit user route lock
→ Host/security hard constraints
→ Parent-agent quality floor and semantic requirements
→ Routing Policy
→ Abstention fallback
```

A parent agent may by default:

- Describe a child task and its acceptance criteria.
- Raise the minimum route.
- Declare constraints such as high risk, read-only execution, independent review, or a latency deadline.
- Request model-family or provider diversity without naming a concrete model.
- Restrict tools and execution capabilities available to the child agent.

A parent agent may not by default:

- Lower the minimum quality selected by Routing Policy.
- Provide an arbitrary provider/model/effort string.
- Disable Host security policy.
- Treat its own risk claim as fact or a training label.
- Bypass Auto silently.

## Proposed constraints

```ts
interface RoutingConstraints {
  risk?: 'low' | 'medium' | 'high'
  readOnly?: boolean
  independentReview?: boolean
  diversity?: {
    differentProvider?: boolean
    differentModelFamily?: boolean
  }
  latencyDeadlineMs?: number
  minimumRoute?: RouteId
  requiredCapabilities?: CapabilityId[]
}

interface DelegatedTask {
  description: string
  prompt: ContentBlock[]
  constraints?: RoutingConstraints
}
```

These fields are parent-agent proposals. Delegation Policy may raise risk, reject conflicting requirements, or override a latency request because of user budget constraints.

## Monotonic authority

Normal parent-agent control is monotonic: it may require stronger execution but cannot unilaterally require weaker execution.

```text
Parent minimumRoute=strong
→ policy selects at least strong

Parent minimumRoute=fast
and policy determines that the task requires strong
→ strong remains effective
```

A user may explicitly grant exact override authority, still restricted to a semantic-route allowlist:

```yaml
delegationPolicy:
  parentRouteOverride:
    enabled: true
    allowedRoutes:
      - standard
      - strong
```

Do not expose raw provider/model identifiers to the parent agent. This avoids configuration coupling and an unbounded escape hatch. Persist each override source and reason, but do not treat it as a correct label.

## Why a Subagent Scheduler is unnecessary

After an in-process child agent is created, it remains a normal DSH Agent; every model request passes through the unified `agent/request` seam. Adaptive Router therefore serves main and child agents through the same path.

```text
Parent submits child task and constraints
→ create child Session
→ child's first agent/request
→ Delegation Policy + Routing Policy
→ child route
```

Only an external provider that must choose a model before creating a process or remote Session needs a `SubagentRoutingAdapter`. The adapter calls the same Routing Policy and does not create a second router.

The term Scheduler is reserved for actual task scheduling: concurrency limits, queues, priorities, preemption, resource budgets, and lifecycle admission. This project does not implement those capabilities.

## Persistence

RoutingConstraints must be associated with the child Session or its persistent descriptor so that the system can:

- Preserve the same quality floor after cold recovery.
- Audit what the parent proposed and what policy accepted.
- Distinguish user authority from model-generated constraints.
- Replay real delegation scenarios in RouterBench.

If the current DSH Subagent request supports only concrete AgentOptions and has no semantic-constraint extension point, propose the narrowest upstream capability seam. Do not hide constraints in a prompt.

## Independent review

`independentReview` cannot mean only “call the same model again.” Delegation Policy and Route Catalog need verifiable diversity attributes such as provider, model family, training lineage, or tool-environment difference.

A diversity constraint only narrows the candidate route set; it does not prove that two models are statistically independent. Product language must not overstate actual independence.
