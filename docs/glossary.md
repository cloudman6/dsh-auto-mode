# Glossary

[简体中文](zh-CN/glossary.md)

## Auto / Manual

The normal user-facing choice. Auto lets policy select from admitted routes; Manual lets the user select a concrete provider/model/reasoning selection. Policy Pack calibration is not a normal-user task.

## Route

A semantic guarantee tier at the policy layer, such as `fast`, `standard`, or `strong`. It is not a concrete model name or a universal intelligence ranking.

## Policy Pack

A maintainer-produced, versioned evidence artifact containing taxonomy, thresholds, admissions, evaluator versions, invalidation rules, and compatible deployment profiles.

## Deployment Profile

Deployment-local configuration and verified identity for concrete provider/model/reasoning-selection options.

## Reasoning Selection

The request semantics for reasoning on one exact provider/model route: an explicit effort, an adapter-materialized default effort, or omission that preserves provider-default behavior. These forms have separate admission identities and request encodings; an absent effort is not an unknown explicit effort.

## Effective Route Catalog

The intersection of a valid Policy Pack, local Deployment Profile, current provider availability, capabilities, and Host security policy.

## Route Snapshot

The immutable resolved route and decision identity consumed by all provider-dependent prompt/tool assembly and by the corresponding provider request.

## Decision Input Snapshot

The final immutable policy input that references an already-persisted raw routing-context snapshot, resolved constraints, optional assessment, and all applicable policy and resolver versions. It never contains forward references.

## Abstain

Policy lacks sufficient evidence to choose among otherwise legal admitted routes. It selects the configured admitted baseline when one exists; absence of any safe admitted route is `no-safe-route`, not abstention.

## Task Assessment

Provider-independent attributes such as task category, risk, scope, verifiability, reversibility, and confidence. An assessor does not select a model directly.

## Routing Policy

Host policy that selects a semantic route from task attributes, resolved constraints, current execution state, recovery capability, and Policy Pack evidence.

## Execution Context Projector

A deterministic Host projection of persisted Session, tool, validation, episode, and objective events into confirmed phase and execution state used by policy.

## Phase

A confirmed semantic stage of current work, such as research, implementation, debugging, validation, or documentation. A model's phase claim is only evidence, not authority.

## Episode

A persisted unresolved-problem state that can impose a route floor. It has no fixed length and closes only through its release policy.

## Attempt

One execution try with declared recovery capability and persisted lineage. A workspace checkpoint is optional and cannot be assumed.

## Recovery Capability

A structured declaration of which workspace and external effects can be attributed, checkpointed, isolated, restored, or only detected. Policy may not infer recovery support from a tool name.

## Continue

Keep the current Session and execution world, change the route or behavior instruction, and continue.

## Salvage

Restore only declared supported effects, create a clean execution context, and carry a constrained Evidence Capsule.

## Restart

Return to a declared recoverable pre-attempt state and re-execute without old model hypotheses. If that state cannot be restored, restart is unavailable.

## Recovery Supervisor

Host capability that consumes formal runtime signals, manages episodes, and selects recovery actions. Its core path does not depend on a model.

## Delegation Policy

Host capability that validates parent-agent proposals and computes effective child-agent routing constraints. A parent proposal is not binding merely because it requests a stronger tier.

## Route Capability Bench

Paired, statistically governed evaluation of concrete configurations against absolute and relative quality gates.

## Policy Scenario Bench

State-machine and adapter scenarios that evaluate policy, phase routing, recovery, persistence, and delegation behavior end to end.

## No safe route

An explicit fail-closed result indicating that no available configuration satisfies admission, capability, security, and effective constraints. The system stops or asks for user intervention instead of silently selecting an unsafe fallback.

## Shadow Mode

A mode that only recommends a switch and asks the user to decide. This project does not treat it as a product phase: the user lacks a counterfactual, so the decision cannot prove routing correctness. Its explanation capability remains part of Auto transparency.
