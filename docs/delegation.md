# Child-agent delegation and routing authority

[简体中文](zh-CN/delegation.md)

## Core principle

A parent agent expresses what a child task needs; the Host decides which requirements are accepted and Routing Policy decides which route provides them. A parent agent is itself a model and does not become the final controller of the model catalog by default. A request for a higher tier is not automatically correct merely because it is conservative.

## Authority precedence

```text
Host security and provider capability constraints
→ Explicit user Auto/manual choice or semantic handling-level lock
→ Host-accepted parent-agent requirements
→ Routing Policy
→ Route resolution: eligible AA catalog route, configured Deep fallback, or explicit failure
```

A parent agent may by default:

- Describe a child task and its acceptance criteria.
- Propose a minimum task-handling level with a semantic reason.
- Declare constraints such as high risk, read-only execution, independent review, or a latency deadline.
- Request model-family or provider diversity without naming a concrete model.
- Restrict tools and execution capabilities available to the child agent.

A parent agent may not by default:

- Lower the minimum quality selected by Routing Policy.
- Provide an arbitrary provider/model/reasoning-selection tuple.
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
  minimumHandlingLevel?: TaskHandlingLevel
  requiredCapabilities?: CapabilityId[]
}

interface DelegatedTask {
  description: string
  prompt: ContentBlock[]
  constraints?: RoutingConstraints
}
```

These fields are parent-agent proposals. Delegation Policy validates them and Constraint Resolver emits `ResolvedRoutingConstraints` containing accepted and rejected requirements, provenance, reasons, the effective candidate set, and the computed floor. It may raise independently assessed risk, reject conflicting requirements, or reject an infeasible latency request.

## Bounded monotonic authority

Accepted parent-agent control is monotonic with respect to the Host-selected handling level: it may narrow the candidate set or raise the effective floor but cannot lower Host requirements. The parent does not unilaterally decide that its proposal is accepted.

```text
Parent proposes minimumHandlingLevel=deep with high-risk review requirement
AND Host accepts the requirement
→ policy selects Deep

Parent minimumHandlingLevel=light
and policy determines that the task requires Deep
→ Deep remains effective

Parent proposes minimumHandlingLevel=deep without an accepted requirement
→ proposal is recorded but does not bypass policy
```

A user may explicitly grant semantic-route override authority, still restricted to an allowlist and Host security/capability constraints:

```yaml
delegationPolicy:
  parentRouteOverride:
    enabled: true
    allowedHandlingLevels:
      - standard
      - deep
```

Do not expose raw provider/model identifiers to the parent agent. This avoids configuration coupling and an unbounded escape hatch. Persist each proposal, acceptance or rejection, override source, and reason, but do not treat any of them as a correct label. Report parent escalation-request and acceptance rates so systematic over-escalation is visible.

## Why a Subagent Scheduler is unnecessary

After an in-process child agent is created, it remains a normal DSH Agent. Adaptive Router serves main and child Agents through the same pre-assembly Route Snapshot and `agent/request` application path.

```text
Parent submits child task and constraints
→ create child Session
→ pre-assembly child decision boundary
→ Delegation Policy + Routing Policy + resolver
→ frozen child Route Snapshot
→ assembly + child's first agent/request
```

Only an external provider that must choose a model before creating a process or remote Session needs a `SubagentRoutingAdapter`. The adapter calls the same Routing Policy and does not create a second router.

The term Scheduler is reserved for actual task scheduling: concurrency limits, queues, priorities, preemption, resource budgets, and lifecycle admission. This project does not implement those capabilities.

## Persistence

RoutingConstraints must be associated with the child Session or its persistent descriptor so that the system can:

- Preserve the same handling-level floor after cold recovery.
- Audit what the parent proposed and what policy accepted.
- Distinguish user authority from model-generated constraints.
- Replay delegation behavior in the optional policy-scenario suite when that suite exists.

If the current DSH Subagent request supports only concrete AgentOptions and has no semantic-constraint extension point, propose the narrowest upstream capability seam. Do not hide constraints in a prompt.

## Independent review

`independentReview` cannot mean only “call the same model again.” Delegation Policy and Route Catalog need verifiable diversity attributes such as provider, model family, training lineage, or tool-environment difference.

A diversity constraint only narrows the candidate route set; it does not prove that two models are statistically independent. Product language must not overstate actual independence.
