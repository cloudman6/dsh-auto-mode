# Optional evaluation track

[简体中文](zh-CN/routerbench.md)

## Status

Deferred and optional under ADR-010. RouterBench is not required to admit routes or ship the AA-informed Auto path.

## Purpose

If project resources later permit, focused evaluation can answer narrower questions:

- Did a policy change alter task-level routing as intended?
- Does the semantic assessor classify a fixed fixture set consistently?
- Does escalation improve completion after observable failure?
- Does within-session switching provide enough value to justify its complexity?
- Did an AA snapshot or normalization change cause an obvious regression?

These suites evaluate this product's behavior. They do not replace AA as the maintained source of market-wide model capability, price, and latency comparisons.

## Required tests without RouterBench

Normal product development still requires deterministic tests for:

- model-key normalization and effort mismatch;
- latest-record selection for duplicate dated AA rows;
- capability-band compilation;
- price-first, latency-second stable ordering;
- Task Assessor schema, timeout, low-confidence, and invalid-output fallback;
- selection/request/display equality;
- Manual non-interference;
- persistent explanations and route-change presentation.

These are correctness and regression tests, not evidence that one model is universally better than another.

## Possible future suites

### Assessor fixture suite

A small, versioned set of representative coding, research, writing, architecture, security, and ambiguous prompts. It validates structured classification and deterministic fallback, not model quality.

### Policy scenario suite

Event-driven scenarios for provider loss, missing catalog data, repeated failure, escalation, Session reload, and parent constraints. The online policy core and scenario runner should share the same pure policy implementation.

### Focused comparative studies

When a concrete product question justifies the cost, the project may run paired comparisons on a narrow task slice. Results must state their scope and must not become a universal route guarantee.

## Data discipline

- Keep fixtures versioned and free of secrets.
- Separate task input from expected policy trace.
- Record model, effort, policy, normalizer, AA snapshot, and environment versions.
- Treat dogfood and user choice as observations, not correctness labels.
- Never describe a small internal suite as an independent model leaderboard.

## Relationship to the roadmap

Phases 1–4 proceed without RouterBench. Evaluation work becomes relevant when it directly answers a bounded decision in Phase 5 or later. It remains a parallel optional track rather than a release gate.
