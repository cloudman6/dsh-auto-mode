# ADR-004: Parent-agent authority increases quality monotonically by default

[简体中文](../zh-CN/decisions/0004-monotonic-parent-authority.md)

## Status

Proposed

## Date

2026-08-14

## Context

A parent agent knows more about child-task intent than the Host, but it remains a model and may select a concrete model incorrectly. If parent model/effort overrides always outrank Routing Policy, the parent may habitually choose the strongest model or incorrectly lower the configuration, defeating Auto.

## Decision

A parent agent submits semantic RoutingConstraints by default. It may raise the minimum route, require independent review, or declare capability constraints, but it may not lower the Host quality floor or select an arbitrary raw provider/model/effort.

Only when a user explicitly grants authority in a profile may the parent choose a semantic route from an allowlist. Persist every override, but do not treat it as a correct label.

## Alternatives considered

### Parent agent fully controls the concrete model

Rejected. This creates a silent bypass and tightly couples the agent to deployment configuration.

### Parent agent provides no input

Rejected. This loses important intent such as child-task risk, independent-review requirements, and required capabilities.

### Treat parent-declared risk as fact

Rejected. A model may omit or misunderstand risk; the Host still performs independent assessment and enforces hard constraints.

## Consequences

- The system needs persistent, structured RoutingConstraints.
- Delegation Policy and Routing Policy remain separate responsibilities.
- In-process children use the unified `agent/request`; no separate Scheduler is needed.
- If an external provider needs a model before creation, an adapter calls the same Routing Policy.
