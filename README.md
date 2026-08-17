# DSH Auto Mode

[简体中文](README.zh-CN.md)

DSH Auto Mode is an adaptive routing plugin for DeepSeek Harness, designed for individual power users of coding agents. The normal interaction is one choice: use Auto, or manually select a provider/model/reasoning selection, including supported default behavior. Auto selects only from evidence-admitted configurations. Its optimization order is strict: pass the configured baseline's absolute quality gate, preserve candidate non-inferiority, reduce latency, and only then reduce cost.

The accepted long-term design remains evidence-gated. A separate maintainer-only Phase 0P fast prototype is now runnable: it uses local manually entered AA seeds and the pinned A1/A2 Host seams to prove Auto selection, real request switching, persisted explanations, fallback, and Manual non-interference. It is visibly `experimental-unadmitted` and makes no safety, quality, public-support, or official-compatibility claim.

## Product boundary

DSH Auto Mode begins with evidence-governed model selection. Its full, evidence-gated direction includes:

- Adaptive Router: selects a semantic route before every model request and explains the decision.
- Routing Policy: uses a testable policy to select `fast`, `standard`, `strong`, or `abstain`.
- Recovery Supervisor: detects stalled execution and performs escalation, continue, salvage, or restart only where declared recovery support permits it.
- Delegation Policy: constrains how a parent agent can influence child-agent routing.
- RouterBench: separately qualifies concrete configurations and evaluates policy behavior with held-out task and scenario suites.

Actual task scheduling—concurrency limits, priorities, queues, preemption, and budget allocation across child agents—is outside the current scope and should not be conflated with model routing under the name “scheduler.”

## Documentation

- [Project status](PROJECT_STATUS.md)
- [Runnable Phase 0P fast prototype](docs/phase-0p-fast-prototype.md)
- [Product specification](docs/spec.md)
- [System architecture](docs/architecture.md)
- [Routing policy](docs/routing-policy.md)
- [Recovery and episodes](docs/recovery.md)
- [Child-agent delegation authority](docs/delegation.md)
- [RouterBench](docs/routerbench.md)
- [DSH integration and compatibility](docs/dsh-integration.md)
- [Published upstream A1/A2 Host-contract Discussion](docs/upstream/2026-08-15-host-contracts-discussion.md)
- [Product roadmap](docs/roadmap.md)
- [Open questions](docs/open-questions.md)
- [Glossary](docs/glossary.md)
- [Architecture decision records](docs/decisions/README.md)
- [Documentation localization policy](docs/localization.md)
- [2026-08-14 multi-view design review](docs/reviews/2026-08-14-multi-view-design-review.md)
- [Deferred production-grade Phase 0P plan](tasks/plan.md)
- [Deferred production-grade Phase 0P checklist](tasks/todo.md)
- [Bounded-stage Code Review Skill](.agents/skills/dsh-auto-mode-code-review/SKILL.md)
- [Contributing](CONTRIBUTING.md)

## Current commands

The repository contains a dependency-free prototype plus the accepted design documents.

```bash
# Run dependency-free unit tests
npm test

# Add real DSH Loader composition coverage
DSH_FORK_ROOT="$HOME/deepseek-harness/.worktrees/auto-mode-host-contracts/workspace" npm test

# Check whitespace errors and merge-conflict markers
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' .

# Inspect the worktree
git status --short --branch
```

## Contributing

While the fast prototype is active, start with [`PROJECT_STATUS.md`](PROJECT_STATUS.md) and [`docs/phase-0p-fast-prototype.md`](docs/phase-0p-fast-prototype.md); do not use deferred production documents to expand prototype work. For long-term design changes, start with the accepted assumptions and scope in [`docs/spec.md`](docs/spec.md). See [`CONTRIBUTING.md`](CONTRIBUTING.md) for language and contribution rules.
