# ADR-001: Host policy owns normal routing decisions

[简体中文](../zh-CN/decisions/0001-host-owned-routing.md)

## Status

Proposed

## Date

2026-08-14

## Context

Auto Mode must decide which admitted provider/model/reasoning-effort configuration serves each request. Candidate authorities include the user, current Agent, parent agent, a Router Agent, and deterministic Host policy.

Users and parent agents lack a reliable counterfactual. A Router Agent creates the recursive question “Which model should the Router use?” and adds Session, tool, authority, latency, and failure surfaces.

## Decision

Deterministic Routing Policy in the DSH Host owns normal decisions. Parent agents submit task intent and untrusted semantic proposals; optional assessment models return task attributes only; a resolver applies Host-recognized constraints and maps a semantic guarantee tier to an admitted concrete configuration.

Users retain the highest explicit control through Auto/manual selection and authorized semantic overrides. The Decision Input Snapshot, policy result, resolution result, and effective Route Snapshot are persisted in the served Agent's Session.

The policy decision must be frozen before provider-dependent prompt/tool assembly and reused for the matching provider request. DSH carrier and extension work is specified separately in [DSH integration and compatibility](../dsh-integration.md).

## Alternatives considered

### Current or parent Agent selects directly

Rejected. This reduces Auto to one model guessing another model and encourages habitual strongest-configuration selection.

### Full Router Agent

Rejected. It needs its own model, Session, and tool policy, introducing recursion and another attack surface.

### Classifier returns a model name directly

Rejected. The output is unstable and hard to test, and it couples provider deployment to semantic classification.

## Consequences

- Routing Policy can be unit-tested and replayed independently.
- Assessment-model failure can produce explicit abstention without transferring authority.
- Host ownership is an authority boundary, not a conclusion that every component must ship in DSH core; external plugin, upstream core, or split carrier remains open.
- The system needs a pre-assembly Route Snapshot and required persistent events. Current DSH gaps are blocking integration contracts, not details to hide behind `agent/request`.
