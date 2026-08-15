# ADR-004: Parent-agent authority is bounded and Host-resolved

[简体中文](../zh-CN/decisions/0004-monotonic-parent-authority.md)

## Status

Accepted

## Date

2026-08-14

## Context

A parent Agent knows child-task intent but remains an untrusted model. If concrete model/effort overrides outrank policy, the parent can habitually choose the strongest configuration or incorrectly lower it. A rule that every stronger-looking parent request is automatically binding has another failure mode: systematic over-escalation can bypass Auto and consume unbounded resources.

## Decision

A parent Agent submits structured task intent and routing-constraint proposals. Host Delegation Policy validates provenance, user authorization, capability facts, security policy, and conflicts before producing `ResolvedRoutingConstraints`.

A proposal to raise the minimum guarantee tier is conservative but not automatically binding. The Host accepts it when backed by a recognized requirement, may keep its existing floor when evidence is insufficient, and rejects impossible or unauthorized constraints explicitly. A parent may never lower the Host floor or select an arbitrary raw provider/model/reasoning selection by default.

Only explicit user authorization may permit a parent semantic override from an allowlist. Raw provider/model bypass remains prohibited. Persist proposals, resolution results, and reasons; none are correctness labels.

## Alternatives considered

### Parent Agent fully controls the concrete model

Rejected. This creates a silent policy bypass and couples the Agent to deployment configuration.

### Every parent request to strengthen is binding

Rejected. It prevents under-routing but enables systematic over-escalation and bypasses policy evidence.

### Parent Agent provides no input

Rejected. This loses task intent such as risk, independent-review requirements, and required capabilities.

## Consequences

- The system needs persistent proposed and resolved RoutingConstraints.
- Delegation Policy and Routing Policy remain separate responsibilities.
- Metrics distinguish escalation proposals, accepted requirements, rejected proposals, and user-authorized overrides.
- External providers are supported only when their creation contract can enforce the resolved constraints.
