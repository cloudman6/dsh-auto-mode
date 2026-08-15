# ADR-007: Recovery Capability gates mutable routing and recovery claims

[简体中文](../zh-CN/decisions/0007-recovery-capability-gates-recovery-claims.md)

## Status

Accepted

## Date

2026-08-14

## Context

A code-producing Agent can affect files, processes, databases, remote APIs, messages, and deployments. A Session checkpoint does not restore these effects. Treating every attempt as recoverable can turn an incorrect weak-model action into an escaped side effect while the product falsely reports rollback.

## Decision

Every execution world exposes a structured `RecoveryCapability` describing attribution, checkpoint, isolation, detection, restore, and verification support for each relevant effect class.

Routing Policy uses that declaration as an input. Mutable work may down-route only when its possible loss is inside an admitted risk bound and the required recovery support exists. Salvage and restart are offered only for explicitly supported effects. Unknown mutation, failed recovery, or irreversible external effects enter explicit stop, escalation, or user-intervention states.

The system never infers recovery capability from a tool name, filesystem access, a Git repository, or model self-report.

## Alternatives considered

### Assume Git can recover Agent work

Rejected. Git neither attributes concurrent changes nor restores uncommitted external effects.

### Allow rollback and document edge cases

Rejected. A partial rollback presented as recovery is a false safety claim.

### Disable all mutable down-routing

Rejected as a universal policy. It is safe but unnecessarily excludes environments that can prove attribution, isolation, and restoration.

## Consequences

- Routing safety and full recovery remain distinct claims.
- Checkpoint Provider and effect adapters need contract tests and fault injection.
- Recovery availability can differ by task, tool set, execution world, and side-effect class.
- Unsupported recovery narrows Auto coverage instead of weakening the quality baseline.
