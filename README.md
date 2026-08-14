# DSH Auto Mode

[简体中文](README.zh-CN.md)

DSH Auto Mode is an adaptive routing plugin for DeepSeek Harness, designed for individual power users of coding agents. The normal interaction is one choice: use Auto, or manually select a provider/model/reasoning selection, including supported default behavior. Auto selects only from evidence-admitted configurations. Its optimization order is strict: pass the configured baseline's absolute quality gate, preserve candidate non-inferiority, reduce latency, and only then reduce cost.

The project is currently in specification review and has no product implementation yet. The documents in this repository capture the current design, unverified assumptions, and open questions. Implementation planning starts only after the specification and proposed architecture decisions are reviewed.

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
- [Product roadmap](docs/roadmap.md)
- [Open questions](docs/open-questions.md)
- [Glossary](docs/glossary.md)
- [Architecture decision records](docs/decisions/README.md)
- [Documentation localization policy](docs/localization.md)
- [2026-08-14 multi-view design review](docs/reviews/2026-08-14-multi-view-design-review.md)
- [Contributing](CONTRIBUTING.md)

## Current commands

This repository currently contains specification documents only; there is no buildable product.

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

Start by reviewing the assumptions, success criteria, and scope in [`docs/spec.md`](docs/spec.md), then review the architecture and ADRs. Do not add implementation code, dependencies, or CI until the specification is accepted. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for language and contribution rules.
