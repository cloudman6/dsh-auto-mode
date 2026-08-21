# Architecture decision records

[简体中文](../zh-CN/decisions/README.md)

| ADR | Status | Decision |
|---|---|---|
| [ADR-001](0001-host-owned-routing.md) | Accepted | Host policy owns normal routing decisions |
| [ADR-002](0002-quality-constrained-optimization.md) | Superseded by ADR-010 | Historical benchmark-governed quality and latency-first design |
| [ADR-003](0003-formal-recovery-protocol.md) | Accepted | Recovery Supervisor uses a formal, provenance-aware event protocol |
| [ADR-004](0004-monotonic-parent-authority.md) | Accepted | Parent-agent authority is bounded and Host-resolved |
| [ADR-005](0005-english-canonical-documentation.md) | Accepted | English is canonical and Simplified Chinese is a maintained translation |
| [ADR-006](0006-evidence-governed-route-admission.md) | Superseded by ADR-010 | Historical evidence-governed admission design |
| [ADR-007](0007-recovery-capability-gates-recovery-claims.md) | Accepted | Recovery Capability gates mutable routing and recovery claims |
| [ADR-008](0008-external-prior-experimental-auto.md) | Superseded by ADR-010 | Historical authorization for the completed Phase 0P MVP |
| [ADR-009](0009-phase-0p-attributable-worktree-loss-bound.md) | Accepted | Phase 0P mutable work is bounded to attributable changes in a clean isolated worktree |
| [ADR-010](0010-aa-informed-heuristic-routing.md) | Superseded by ADR-011 | Established AA-informed task levels and price-first route resolution without a Benchmark admission gate |
| [ADR-011](0011-bind-host-routes-to-aa-evidence.md) | Accepted | Bind generic Host route identities to AA evidence without a universal model/effort ontology |

When an ADR is superseded, retain the original file and point its status to the replacement ADR.
