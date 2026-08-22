# DSH Auto Mode

[简体中文](README.zh-CN.md)

DSH Auto Mode is an adaptive routing plugin for DeepSeek Harness, designed for individual power users of coding agents. The normal interaction is one choice: use Auto, or manually select a provider/model/reasoning selection. Auto uses task context to choose a `light`, `standard`, or `deep` handling level, then prefers the lower Artificial Analysis price among eligible routes in that level and uses AA latency as a tie-break.

The accepted Phase 0P MVP and Phases 1–4.1 now form one runnable decision path on the pinned maintainer fork. A reusable local Evidence Pack retains every policy-eligible AA record and long-lived exact bindings; Runtime derives the Active Catalog from current Host routes, automatically activates dormant bindings, and isolates quarantined or unbound routes. For each DSH user turn, the plugin resolves a bounded semantic assessment, applies deterministic Host policy and route constraints, selects by level and AA price, and freezes one complete effective configuration through assembly, request, persistence, and cold reconstruction. The live UI shows Light/Standard/Deep, the actual model and applicable effort, the evidence basis, and the exact AA snapshot when applicable. AA is external heuristic evidence; the plugin does not claim project-benchmarked quality, universal optimality, safety, or official DSH compatibility.

## Product boundary

DSH Auto Mode begins with AA-informed model selection. Its full direction includes:

- Adaptive Router: selects a task-handling level and concrete route before a model request and explains the decision.
- Routing Policy: maps structured task attributes to `light`, `standard`, or `deep`.
- AA Evidence Pack and Active Catalog: bind exact provider-scoped evidence keys to stable AA records, derive current executable candidates at runtime, then resolve same-level routes by AA price and latency.
- Recovery Supervisor: detects stalled execution and performs escalation, continue, salvage, or restart only where declared recovery support permits it.
- Delegation Policy: constrains how a parent agent can influence child-agent routing.
- Optional evaluation: focused fixtures and scenarios may study policy behavior without becoming a model-quality admission gate.

Actual task scheduling—concurrency limits, priorities, queues, preemption, and budget allocation across child agents—is outside the current scope and should not be conflated with model routing under the name “scheduler.”

## Documentation

- [Project status](PROJECT_STATUS.md)
- [Runnable Phase 0P fast prototype](docs/phase-0p-fast-prototype.md)
- [Product specification](docs/spec.md)
- [System architecture](docs/architecture.md)
- [Routing policy](docs/routing-policy.md)
- [Recovery and episodes](docs/recovery.md)
- [Child-agent delegation authority](docs/delegation.md)
- [Optional evaluation track](docs/routerbench.md)
- [DSH integration and compatibility](docs/dsh-integration.md)
- [Published upstream A1/A2 Host-contract Discussion](docs/upstream/2026-08-15-host-contracts-discussion.md)
- [Product roadmap](docs/roadmap.md)
- [Open questions](docs/open-questions.md)
- [Glossary](docs/glossary.md)
- [Architecture decision records](docs/decisions/README.md)
- [Documentation localization policy](docs/localization.md)
- [2026-08-14 multi-view design review](docs/reviews/2026-08-14-multi-view-design-review.md)
- [Current implementation plan](tasks/plan.md)
- [Current implementation checklist](tasks/todo.md)
- [Bounded-stage Code Review Skill](.agents/skills/dsh-auto-mode-code-review/SKILL.md)
- [Contributing](CONTRIBUTING.md)

## Current commands

The repository contains the dependency-free implementation and accepted design documents.

```bash
# Run dependency-free unit tests
npm test

# Evidence Pack lifecycle commands and required flags: docs/aa-snapshot-maintenance.md

# Add real DSH Loader composition coverage
DSH_FORK_ROOT="$HOME/deepseek-harness/.worktrees/auto-mode-host-contracts/workspace" npm test

# Check whitespace errors and merge-conflict markers
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' .

# Inspect the worktree
git status --short --branch
```

## Contributing

Start with [`PROJECT_STATUS.md`](PROJECT_STATUS.md), [`docs/spec.md`](docs/spec.md), and the current phase in [`docs/roadmap.md`](docs/roadmap.md). The completed MVP remains documented in [`docs/phase-0p-fast-prototype.md`](docs/phase-0p-fast-prototype.md). See [`CONTRIBUTING.md`](CONTRIBUTING.md) for language and contribution rules.
