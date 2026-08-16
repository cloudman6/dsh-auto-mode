# Design document index

[简体中文](zh-CN/README.md)

Current progress, blockers, and the next action are maintained in the repository-root [`PROJECT_STATUS.md`](../PROJECT_STATUS.md).

## Review order

1. [Product specification](spec.md): confirm users, objectives, success criteria, boundaries, and assumptions.
2. [Routing policy](routing-policy.md): confirm guarantee tiers, Policy Packs, absolute and relative quality gates, and failure behavior.
3. [System architecture](architecture.md): confirm capability boundaries, Route Snapshot timing, state ownership, and persistence.
4. [DSH integration and compatibility](dsh-integration.md): confirm fork-resolved Host contracts, remaining upstream gaps, and compatibility policy.
5. [RouterBench](routerbench.md): confirm evidence isolation, statistical admission, strategy ablation, and revocation.
6. [Recovery and episodes](recovery.md): confirm signals, provenance, recovery capability, episodes, and actions.
7. [Child-agent delegation authority](delegation.md): confirm proposal, resolution, and override boundaries.
8. [Product roadmap](roadmap.md): confirm evidence-gated implementation order and phase acceptance criteria.
9. [Open questions](open-questions.md): choose the next discussion and validation focus.
10. [Glossary](glossary.md): check terminology and semantic distinctions.

The [architecture decision records](decisions/README.md) contain the accepted decisions that constrain implementation. The [documentation localization policy](localization.md) defines the English source of truth and Simplified Chinese synchronization workflow.

## Historical review evidence

- [2026-08-14 multi-view design review](reviews/2026-08-14-multi-view-design-review.md): informational record of findings, conflict arbitration, and meta-review limits that produced the current revision.

## Upstream feedback

- [A1/A2 product-neutral Host contracts](upstream/2026-08-15-host-contracts-discussion.md): published as DeepSeek Harness Discussion #2281 with pinned fork evidence and maintainer questions.

## Document state

The specification and ADR-001 through ADR-009 are Accepted. Documents may still mark individual future interfaces or event names as Proposed. ADRs use `Proposed`, `Accepted`, `Superseded`, and `Deprecated` for their lifecycle.
