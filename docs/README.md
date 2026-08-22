# Design document index

[简体中文](zh-CN/README.md)

Current progress, blockers, and the next action are maintained in the repository-root [`PROJECT_STATUS.md`](../PROJECT_STATUS.md).

The accepted MVP is documented in the [Phase 0P fast prototype](phase-0p-fast-prototype.md). Post-MVP implementation follows ADR-011 and the current roadmap.

## Review order

1. [Product specification](spec.md): confirm users, objectives, success criteria, boundaries, and assumptions.
2. [Routing policy](routing-policy.md): confirm task-handling levels, AA matching, price-first resolution, fallback, and failure behavior.
3. [System architecture](architecture.md): confirm capability boundaries, Route Snapshot timing, state ownership, and persistence.
4. [DSH integration and compatibility](dsh-integration.md): confirm fork-resolved Host contracts, remaining upstream gaps, and compatibility policy.
5. [Optional evaluation track](routerbench.md): confirm bounded regression and policy-evaluation scope without making it a release gate.
6. [Recovery and episodes](recovery.md): confirm signals, provenance, recovery capability, episodes, and actions.
7. [Child-agent delegation authority](delegation.md): confirm proposal, resolution, and override boundaries.
8. [Product roadmap](roadmap.md): confirm the AA catalog, semantic assessor, beta, adaptive execution, and later phase order.
9. [Open questions](open-questions.md): choose the next discussion and validation focus.
10. [Glossary](glossary.md): check terminology and semantic distinctions.

The [architecture decision records](decisions/README.md) contain the accepted decisions that constrain implementation. The [documentation localization policy](localization.md) defines the English source of truth and Simplified Chinese synchronization workflow.

## Implementation evidence

- [Phase 0P fast prototype](phase-0p-fast-prototype.md): runnable configuration, local-seed boundary, deterministic policy, acceptance criteria, and real-provider evidence.
- [AA Evidence Pack maintenance](aa-snapshot-maintenance.md): maintainer-only Free acquisition, rights gate, deterministic candidate review, atomic apply, and rollback workflow.
- [Historical Phase 0P exact route inventory and A3p evidence](evidence/phase-0p-route-inventory.md): the deployment-exact experiment that preceded the current explicit AA evidence-binding policy.

## Historical review evidence

- [2026-08-14 multi-view design review](reviews/2026-08-14-multi-view-design-review.md): informational record of findings, conflict arbitration, and meta-review limits that produced the current revision.

## Upstream feedback

- [A1/A2 product-neutral Host contracts](upstream/2026-08-15-host-contracts-discussion.md): published as DeepSeek Harness Discussion #2281 with pinned fork evidence and maintainer questions.

## Document state

The specification and ADR-011 define the current AA-informed direction. ADR-010 and the earlier ADR-002, ADR-006, and ADR-008 are superseded but retained as historical decisions; the other accepted ADRs remain in force for their stated boundaries. ADRs use `Proposed`, `Accepted`, `Superseded`, and `Deprecated` for their lifecycle.
