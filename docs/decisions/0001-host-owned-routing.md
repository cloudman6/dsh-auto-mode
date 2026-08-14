# ADR-001: Host policy owns normal routing decisions

[简体中文](../zh-CN/decisions/0001-host-owned-routing.md)

## Status

Proposed

## Date

2026-08-14

## Context

Auto Mode must decide which provider, model, and reasoning effort to use for every request. Candidate owners include the user, current Agent, parent agent, independent Router Agent, and Host plugin.

Users and parent agents lack a reliable counterfactual. A Router Agent creates the recursive question “Which model should the Router use?” and adds Session, tool, authority, latency, and failure surfaces.

## Decision

Routing Policy in the DSH Host makes normal decisions. Parent agents submit task intent and semantic constraints only; optional assessment models return task attributes only; Route Profile Resolver maps a semantic route to concrete provider/model/effort.

Users retain the highest explicit control. The actual Routing Policy decision and effective call configuration are persisted in the served Agent's Session.

## Alternatives considered

### Current or parent agent selects directly

Rejected. This reduces Auto to one model guessing another model and encourages habitual selection of the strongest configuration.

### Full Router Agent

Rejected. It needs its own model, Session, and tool policy, introducing recursion and another attack surface.

### Classifier returns a model name directly

Rejected. Output is unstable and difficult to test, and it couples provider configuration to semantic classification.

## Consequences

- Routing policy can be unit-tested and replayed in RouterBench independently.
- Assessment-model failure can produce an explicit abstention.
- The system needs persisted route-decision events and a DSH `agent/request` consumer.
- One resolver must combine authority from users, parent agents, assessors, and policy.
