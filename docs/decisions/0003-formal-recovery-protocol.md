# ADR-003: Recovery Supervisor uses a formal, provenance-aware event protocol

[简体中文](../zh-CN/decisions/0003-formal-recovery-protocol.md)

## Status

Accepted

## Date

2026-08-14

## Context

Recovery Supervisor must detect stalled execution, maintain episodes, and select a recovery action. Injecting a prompt every turn and asking the current model to report phase and progress adds tokens, couples behavior to natural language, and allows the supervised model to release its own restrictions.

Signals can also be misleading without provenance: a model claim, tool-native fact, derived observation, and trusted validator result do not carry equal authority.

## Decision

Recovery Supervisor core does not depend on a model. It consumes typed, versioned Recovery Signals through Session, Agent, Tool, validation, and capability events. Each observation records source, provenance, trust class, and evidence references. The supervisor persists objective, phase, attempt, episode, and recovery state and exposes route floors and recovery availability to Routing Policy.

Agent phase and completion claims are weak evidence. An optional Recovery Assessor uses a fixed configuration, makes one call without tools, and returns a validated structure; deterministic Recovery Policy still owns transitions.

Prompt injection occurs only when a persisted continue, salvage, restart, or user-intervention action must change model behavior. Normative recovery state is never carried only in prompt text.

Routing-safety supervision and full execution recovery are separate product claims. The former may escalate or stop without restoring effects; the latter is available only for declared and tested Recovery Capabilities.

## Alternatives considered

### Inject a progress protocol every turn

Rejected. It pollutes context, adds latency, and bases supervision on model self-report.

### Supervisor parses all natural-language output

Rejected. It is brittle and unversioned, and tool-output semantics belong to the corresponding capability.

### Model assessor closes an episode directly

Rejected. The assessor has no final authority; low-confidence or wrong judgments must fail safely.

## Consequences

- DSH needs runtime registration for required plugin Session events; ignorable events cannot carry normative recovery state.
- Tool and validation adapters must expose structured facts with provenance and trust classification.
- UI explanation renders from structured events rather than hidden prompt text.
- Failed recovery and unknown mutation become explicit states requiring stop, escalation, or user intervention.
