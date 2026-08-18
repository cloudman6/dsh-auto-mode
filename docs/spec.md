# Specification: DSH Auto Mode

[简体中文](zh-CN/spec.md)

## Status

Accepted by the maintainer. The AA-informed post-MVP direction was accepted on 2026-08-18 through [ADR-010](decisions/0010-aa-informed-heuristic-routing.md).

## Product premise

DSH Auto Mode serves individual power users who do not want to guess which model and reasoning effort a task needs. The project does not have the resources to maintain a model-quality benchmark. It therefore uses Artificial Analysis (AA) as its external source for model capability, price, and latency comparisons, while keeping final routing authority in deterministic Host policy.

AA evidence is a useful market prior, not proof that a selected route is optimal for one user's task. Product language must say “AA-informed” or “based on the current AA snapshot”; it must not claim benchmark-proven quality, safety, non-inferiority, or universal best value.

## Primary outcome

- Primary user: an individual power user of coding agents.
- Primary success metric: real active users who continue using Auto.
- Normal interaction: one choice between Auto and manual provider/model/reasoning selection.
- Optimization rule: determine the required task-handling level first; among eligible routes at that level, prefer the lower AA-reported price, then lower AA-reported latency.

## User-facing task-handling levels

The user-visible levels describe how much reasoning capacity Auto allocates, not an objective judgment of whether the user's task is easy or valuable:

| Internal ID | Chinese label | English label | Meaning |
|---|---|---|---|
| `light` | 轻量 | Light | Bounded scope, few steps, directly checkable result |
| `standard` | 常规 | Standard | Normal development, analysis, and modification work |
| `deep` | 深度 | Deep | Broad scope, high uncertainty or risk, weak verifiability, or substantial reasoning |

High risk, low classifier confidence, an unknown task shape, or an unavailable requested level raises the decision to `deep`. The configured deep fallback is a conservative heuristic fallback, not a certified safety baseline.

## AA route catalog

A concrete route remains the complete provider/model/reasoning selection used by DSH. AA capability matching uses a normalized model key:

```text
model family + semantic version + variant + explicit reasoning effort
```

Dates, release-day suffixes, provider deployment revisions, and hidden build fingerprints are not part of equality. If the AA snapshot contains multiple dated records for one normalized key, the catalog uses the latest record in that snapshot. A semantic-version, variant, or effort mismatch never matches. An unspecified effort matches only when a separately declared normalization rule makes its effective effort explicit.

The provider remains part of the executable DSH route and capability filtering even when AA capability evidence is shared by normalized model key.

## Routing ownership

- A fixed, non-recursively-routed Task Assessor may classify task attributes and confidence.
- The assessor returns structured task properties, never a provider, model, or effort.
- Deterministic Routing Policy maps those attributes to `light`, `standard`, or `deep`.
- Route Resolver filters unavailable or incompatible routes and applies AA price-first ordering inside the selected level.
- The chosen configuration is frozen before provider-dependent assembly and applied unchanged at `agent/request`.
- The effective configuration and explanation are persisted in the served Session.

## Required product behavior

- Auto and Manual remain one-operation alternatives; Manual is not changed by Auto policy.
- Every automatic decision displays the task-handling level, actual model, actual effort, source snapshot, and concise reason.
- Model and effort changes remain visible in the selector and in the conversation between the triggering user message and resulting assistant response.
- Missing or malformed AA data, no compatible route, or low-confidence assessment uses the configured deep fallback when it is available and Host-valid; otherwise Auto reports an explicit resolution failure.
- User choices, parent-agent proposals, and model self-reports are not treated as correct routing labels.
- Parent agents may express task constraints but do not directly own concrete route selection.

## Current and future scope

### Current path

- Versioned local AA snapshots, initially maintained manually and kept out of Git.
- Normalized model-version/variant/effort matching without deployment-date identity.
- AA-informed `light`/`standard`/`deep` catalog construction.
- A fixed semantic Task Assessor plus deterministic level and route policy.
- Transparent DSH Web UI, persistent decision facts, and Manual non-interference.

### Later path

- Stable AA data acquisition and snapshot refresh.
- Within-session reassessment and evidence-triggered escalation.
- Recovery actions only for effect classes with explicit support.
- Parent/child routing constraints and adapters for Codex and Claude Code.
- Optional privacy-preserving dogfood calibration and community route profiles.

### Outside the required path

- Maintaining an in-house model-quality benchmark as an Auto admission gate.
- Claiming that AA rankings prove task-specific quality or safety.
- Training a Router foundation model.
- A Router Agent with its own tools and autonomous Session.
- Organization-level scheduling, quotas, or approval governance.
- Automatic rollback of undeclared workspace or external effects.

## Success criteria

- Users can select Auto once and see the actual model and effort chosen for the current task.
- Different task characteristics produce explainable differences in task-handling level and concrete route.
- Within one level, the resolver deterministically prefers the lower AA-reported price and then lower AA-reported latency.
- Persisted selection, displayed selection, and effective request configuration agree.
- Manual selection remains unchanged and exits Auto for its scope.
- Users understand that the result is AA-informed heuristic routing rather than project-benchmarked admission.
- Real users continue using Auto after repeated tasks.

## Safety and integrity boundaries

- Host security, provider availability, and concrete route capability checks precede economic ordering.
- No missing capability is inferred from a model name or AA score.
- A task assessor cannot bypass Host policy or select a concrete model.
- Every route change is recorded; silent switching is forbidden.
- Secrets, credentials, raw AA datasets, sensitive prompts, and private code are not committed.
- Recovery and workspace-mutation claims remain governed by ADR-007 and ADR-009 where those capabilities are implemented.

## Superseded requirements

ADR-010 supersedes the former requirement that RouterBench admission, exact deployment fingerprints, an absolute baseline, candidate non-inferiority, and latency-before-cost optimization must precede a usable Auto product. RouterBench remains optional evaluation infrastructure and may inform future policy, but it is not on the critical path.
