# Product roadmap

[简体中文](zh-CN/roadmap.md)

## Principle

The roadmap expresses dependency order; it does not justify omitting the complete architecture. Every phase must produce verifiable evidence, and later phases may not change the quality baseline under the rationale of “build it first.”

## Phase A: RouterBench and Route Profiles

Build a minimal task suite spanning different verification levels. Define the strong baseline, quality tolerance, unacceptable outcomes, latency, and cost statistics. Produce versioned Route Profiles instead of writing routing rules from model rankings by hand.

Acceptance: paired reports can compare multiple model/effort combinations and identify task categories that cannot down-route safely.

## Phase B: Static Adaptive Router

Implement Host Routing Policy, Task Assessment, Route Profile Resolver, the `agent/request` consumer, abstention, and decision logging. First solve “Which route should this request use?” without user-choice labels.

Acceptance: online decisions and RouterBench use the same policy; users can inspect the route, effective configuration, and reason.

## Phase C: Within-turn adaptation and Continue

Add formal Recovery Signals, Episode Controller, route floors, escalation, and down-routing after trusted phase boundaries. Implement same-Session continue without claiming code rollback.

Acceptance: repeated failure escalates; unresolved episodes do not down-route because a model self-reports completion; execution can down-route within the same turn after a complex phase ends.

## Phase D: Isolated Attempts and full recovery

Design Checkpoint Provider, associate Session boundaries with workspace state, and implement salvage/restart with Evidence Capsule.

Acceptance: recovery does not overwrite user changes or other-agent changes that existed before the attempt; fault injection proves harmful side effects cannot escape.

## Phase E: Child-agent constraints

Implement Delegation Policy, persistent RoutingConstraints, in-process child routing, and an external-provider adapter. Parent agents may only raise the route floor by default.

Acceptance: parent agents cannot bypass hard constraints; constraints remain auditable after cold recovery; independent-review diversity requirements are verifiable.

## Phase F: Calibration from real use

With explicit consent, privacy protection, and revocability, collect objective runtime facts and update RouterBench task distributions and policy thresholds. Real active users are the product metric; telemetry volume itself is not success.

## Directions not started

- General Subagent Scheduler.
- Organization-level budget, approval, and quota platform.
- Automatic training of a Router model.
- Plugin marketplace or general model-ranking service.
- Automatic workspace rollback without attribution and recovery capability.
