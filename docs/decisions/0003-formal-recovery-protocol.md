# ADR-003: Recovery Supervisor uses a formal event protocol

[简体中文](../zh-CN/decisions/0003-formal-recovery-protocol.md)

## Status

Proposed

## Date

2026-08-14

## Context

Recovery Supervisor must detect stalled execution, decide whether an episode is resolved, and select a recovery action. One approach injects a prompt on every turn and asks the current model to report its phase and progress. That adds tokens, couples product behavior to prompts, and allows the supervised model to release restrictions through self-report.

## Decision

Recovery Supervisor core does not depend on a model. It receives formal RecoverySignals through Session, Agent, Tool, and capability events, persists episode state, and provides route floors to Routing Policy.

Agent phase and completion claims are weak evidence. An optional Recovery Assessor uses a fixed configuration, makes one call without tools, and returns a validated structure; deterministic Recovery Policy still owns the final state transition.

One persisted prompt injection occurs only when continue, salvage, or restart must change model behavior.

## Alternatives considered

### Inject a progress protocol every turn

Rejected. It pollutes context, adds latency, and bases supervision on model self-report.

### Supervisor parses all natural-language output

Rejected. It is brittle and unversioned, and tool-output semantics belong to the corresponding capability.

### Model assessor closes an episode directly

Rejected. The assessor has no final authority; low-confidence or wrong judgments must fail safely.

## Consequences

- The system needs a Recovery Signal Provider seam and persisted events.
- Test, shell, filesystem, and other capabilities should expose structured facts or dedicated adapters.
- UI explanation renders from structured events rather than prompt text.
- Semantic judgment may still use an auxiliary model, but its latency, cost, and uncertainty are measured separately.
