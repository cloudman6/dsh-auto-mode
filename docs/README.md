# Design document index

[简体中文](zh-CN/README.md)

Current progress, blockers, and the next action are maintained in the repository-root [`PROJECT_STATUS.md`](../PROJECT_STATUS.md).

## Review order

1. [Product specification](spec.md): confirm users, objectives, success criteria, boundaries, and assumptions.
2. [System architecture](architecture.md): confirm capability boundaries, ownership, and DSH integration points.
3. [Routing policy](routing-policy.md): confirm route semantics, down-routing admission, and switching rules.
4. [Recovery and episodes](recovery.md): confirm stall detection, episodes, checkpoints, and recovery actions.
5. [Child-agent delegation authority](delegation.md): confirm authority precedence among users, parent agents, and policy.
6. [RouterBench](routerbench.md): confirm the quality baseline, task suite, and evaluation method.
7. [Product roadmap](roadmap.md): confirm implementation order without converting phases into coding tasks at this stage.
8. [Open questions](open-questions.md): choose the next discussion and validation focus.

The [documentation localization policy](localization.md) defines the English source of truth and Simplified Chinese synchronization workflow.

## Document state

Unless a file explicitly says `Accepted`, all content is design pending review. ADRs use `Proposed`, `Accepted`, `Superseded`, and `Deprecated` for their lifecycle.
