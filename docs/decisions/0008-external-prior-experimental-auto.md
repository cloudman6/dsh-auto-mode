# ADR-008: External rankings may seed maintainer-only Experimental Auto

[简体中文](../zh-CN/decisions/0008-external-prior-experimental-auto.md)

## Status

Accepted

## Date

2026-08-16

## Context

The evidence-governed admission protocol in ADR-002 and ADR-006 is required before Auto can make quality or non-inferiority claims. Building the initial RouterBench task corpus and statistical admission evidence before exercising a real Auto path would, however, delay evidence about a different question: whether the Host integration, one-operation Auto/manual interaction, task assessment, deterministic policy, persisted explanation, and route-identity mapping form a useful product loop.

[Artificial Analysis](https://artificialanalysis.ai/models) publishes independent model-configuration indices plus pricing and performance measurements. These rankings are useful external priors, but they do not establish task-distribution-specific quality, deployment identity, non-inferiority, or severe-failure bounds for DSH Auto Mode.

## Decision

Introduce **Phase 0P: AA-seeded Experimental Auto** before Phase 0C.

Phase 0P is a maintainer-only, explicit-opt-in dogfood stage on the declared DSH fork. It may actively route model calls without RouterBench admission only under all of these constraints:

- Every selected configuration is the exact intersection of a DSH-discovered provider/model/reasoning selection, reproducible A3p identity evidence, user and Host constraints, and one matching Artificial Analysis configuration record.
- Explicit effort, adapter-materialized default, and provider-default omission remain different identities. A score measured for one form is never interpolated or transferred to another.
- A versioned local evidence snapshot records the Artificial Analysis endpoint and query semantics, pagination coverage, upstream index version where supplied, record identifiers, retrieval time, source attribution, relevant capability indices, latency and cost fields, and a canonical full-content digest. The digest is the snapshot identity when upstream versions omit patch revisions or do not version an index family separately. The repository does not scrape the website, bundle ranking data, or contain an API key.
- Task Assessment maps bounded task attributes to an index family. Deterministic policy maps that assessment and the frozen evidence snapshot to `fast`, `standard`, or `strong`; the external source never emits the final route decision.
- High-risk, unknown, or low-confidence task assessment uses the strongest exactly matched experimental configuration from a valid frozen catalog. An unmatched or identity-drifted route, invalid evidence, or missing required Host contract leaves Auto with `no-experimental-route` and no call. This path never reuses admitted Auto's `no-safe-route`.
- Host-declared `RecoveryCapability` remains a required policy input under ADR-007. No experimental tier, including `strong`, may execute mutable work unless its possible loss is inside an ADR-007-compliant risk bound accepted in a separate decision and every relevant effect class has sufficient declared attribution and recovery support. Phase 0P itself does not create that risk bound. Any irreversible external effect, or any mutation that cannot be shown to fit the bound, terminates the current Experimental Auto attempt. User intervention may switch to Manual or wait for a newly declared execution world, but confirmation alone cannot authorize the blocked Experimental Auto provider dispatch.
- Every decision and explanation is marked `experimental-unadmitted` and states that no project-specific quality or non-inferiority evidence exists.
- Phase 0P makes no claim of safe admission, candidate non-inferiority, production readiness, official DSH compatibility, or public support. Its evidence cannot be promoted into a normal Policy Pack admission.

Artificial Analysis is the first `ExternalRoutePrior` source, not a permanent hard-coded dependency. Private maintainer dogfood may use a locally supplied API credential subject to source terms and attribution. Public or redistributed use remains blocked until the applicable data rights are confirmed.

ADR-002 and ADR-006 continue to govern Phase 0C and every public quality claim. RouterBench remains the only project admission path. Phase 0P is a separately labelled experimental execution path, not an admitted-route exception that production policy may silently inherit.

## Alternatives considered

### Complete RouterBench before exercising Auto

Rejected for Phase 0P. It answers route-quality questions but delays product-loop and integration evidence that can be collected without claiming quality.

### Treat the public ranking as route admission

Rejected. The ranking does not prove transfer to the project's task distribution, exact provider deployment, request encoding, or severe-failure envelope.

### Scrape or redistribute leaderboard data

Rejected. The documented API supplies stable identifiers and versioned fields, while public redistribution requires a separately verified data-rights path.

### Let an assessor model choose the concrete model and effort

Rejected. It would move final authority out of deterministic Host policy and introduce a recursive routing problem.

## Consequences

- The project can test a real Auto/manual user flow before RouterBench exists.
- A3p identity and A5p carrier verification remain on the immediate critical path.
- Phase 0P policy thresholds are explicitly heuristic and versioned; they are not quality guarantees.
- Experimental decisions require a distinct evidence state and user-visible explanation, preventing accidental promotion into admitted policy.
- Real dogfood cases may inform later RouterBench taxonomy and fixtures, but cannot enter held-out acceptance sets without provenance and leakage controls.
- Phase 0C still requires the minimal Phase A admission slice defined by the accepted roadmap.
