# Project status

[简体中文](PROJECT_STATUS.zh-CN.md)

## Last updated

2026-08-14

## Current stage

Specification review. The repository has a product and architecture design baseline, but the user has not accepted `docs/spec.md`. Four product and architecture ADRs remain `Proposed`; ADR-005, which defines the repository's documentation language, is `Accepted`. The current gate prohibits implementation planning, task breakdown, dependency selection, and coding.

## Completed

- Established the Git repository and `main` baseline.
- Established product specification, system architecture, routing policy, recovery/episode, delegation authority, RouterBench, roadmap, open questions, and glossary documents.
- Recorded Host-owned Routing Policy, quality-constrained optimization, the formal recovery protocol, and monotonic parent-agent authority as Proposed ADRs.
- Defined the primary user, real-active-user metric, and the objective order of strong quality baseline, latency, then cost.
- Established English canonical documentation, complete Simplified Chinese translations, English public Git metadata, and source-blob translation tracking through Accepted ADR-005.

## Current review entry points

1. Review the assumptions, scope, success criteria, and work boundaries in `docs/spec.md`.
2. Review the four Proposed product and architecture ADRs in `docs/decisions/`; change their state only after explicit user confirmation.
3. Select the next questions in `docs/open-questions.md` that require research or experiments.

## Gates before implementation planning

- Explicitly accept the product specification.
- Resolve the ADR states for Routing Policy ownership, quality objectives, recovery interaction, and parent-agent authority.
- Verify current DSH extension points and separate plugin-local implementation from required upstream changes.
- Define initial RouterBench task categories, model/effort profiles, and quality-evaluation protocol.
- Define route-admission evidence for tasks without mechanical verification.
- Decide whether Recovery Assessor and workspace checkpoints belong in the first implementation scope.

## Current blockers

There is no code or toolchain fault. The unresolved blocker is the design gate; detailed questions are maintained in `docs/open-questions.md`.

## Next action

Complete specification and ADR review. After approval, use planning-and-task-breakdown to produce an implementation plan and verifiable tasks; do not begin coding directly from the roadmap.

## Status maintenance rules

- Update this file when a significant result completes, a blocker appears, a gate closes, or the next action changes.
- This file records current status only; it does not duplicate long-lived product requirements, full architecture, or the open-question inventory.
- Historical decisions belong in ADRs, long-lived scope and success criteria in `docs/spec.md`, and unresolved questions in `docs/open-questions.md`.
