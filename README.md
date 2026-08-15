# DSH Auto Mode

[简体中文](README.zh-CN.md)

DSH Auto Mode is an adaptive routing plugin for DeepSeek Harness, designed for individual power users of coding agents. The normal interaction is one choice: use Auto, or manually select a provider/model/reasoning selection, including supported default behavior. Auto selects only from evidence-admitted configurations. Its optimization order is strict: pass the configured baseline's absolute quality gate, preserve candidate non-inferiority, reduce latency, and only then reduce cost.

The specification and all current ADRs are accepted. Product-neutral A1 pre-assembly step preparation and A2 runtime Session-event registration are implemented and pinned on the declared DSH fork. No user-usable Auto Mode preview exists until the remaining Phase 0C admission, deployment-identity, and carrier gates pass.

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
- [Product specification](docs/spec.md)
- [System architecture](docs/architecture.md)
- [Routing policy](docs/routing-policy.md)
- [Recovery and episodes](docs/recovery.md)
- [Child-agent delegation authority](docs/delegation.md)
- [RouterBench](docs/routerbench.md)
- [DSH integration and compatibility](docs/dsh-integration.md)
- [Upstream A1/A2 Host-contract Discussion draft](docs/upstream/2026-08-15-host-contracts-discussion.md)
- [Product roadmap](docs/roadmap.md)
- [Open questions](docs/open-questions.md)
- [Glossary](docs/glossary.md)
- [Architecture decision records](docs/decisions/README.md)
- [Documentation localization policy](docs/localization.md)
- [2026-08-14 multi-view design review](docs/reviews/2026-08-14-multi-view-design-review.md)
- [Completed A1/A2 implementation plan and evidence](tasks/plan.md)
- [A1/A2 task record](tasks/todo.md)
- [Contributing](CONTRIBUTING.md)

## Current commands

This repository currently contains the accepted specification and implementation plans; product code has not yet landed here.

```bash
# Inspect the worktree
git status --short --branch

# Check whitespace errors and merge-conflict markers
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' .

# List design documents
find docs -type f -name '*.md' -print | sort
```

## Contributing

Start with the accepted assumptions, success criteria, and scope in [`docs/spec.md`](docs/spec.md), then review the architecture, ADRs, roadmap gates, and current task plan. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for language and contribution rules.
