# Implementation plan: Phase 0P AA-seeded Experimental Auto

[简体中文](plan.zh-CN.md)

## Objective

Deliver a maintainer-only, explicit-opt-in, one-decision-per-Session Experimental Auto path on the pinned DSH fork. Artificial Analysis supplies versioned external priors for exact model-and-effort configurations; deterministic Host policy makes the final decision; every decision remains `experimental-unadmitted`. RouterBench admission is deferred to Phase 0C and is not weakened or simulated by this work.

## Architecture decisions

- Use a discriminated `ExperimentalRouteCatalog`; never insert external ranking records into `PolicyPack.admissions`.
- Keep Artificial Analysis acquisition outside the interactive client. The plugin consumes a validated local snapshot; credentials and raw fetched data never enter the repository.
- Map only exact provider/model/reasoning-selection identities. Do not infer unmeasured efforts or collapse explicit, adapter-default, and provider-default encodings.
- Keep Task Assessment and routing deterministic in Phase 0P. The external source provides evidence fields, not a route decision.
- Freeze one Experimental Auto decision per Session before provider-dependent assembly and persist the external snapshot, assessment, decision, resolution, request encoding, and explanation references.
- Prioritize the DSH Web model-selection surface for A5p, but accept it only after a focused seam probe proves Auto/manual control and persisted explanation retrieval.

## Dependency graph

```text
Task 1: exact route inventory and A3p mapping
       |
       +--> Task 2: external-prior contract and data boundary
                    |
                    +--> Task 3: repository scaffold and domain types
                              |
                              +--> Task 4: snapshot loader and exact matcher
                              |         |
                              |         +--> Task 5: deterministic assessment and policy
                              |                    |
                              +--> Task 6: Session persistence and projection
                                                   |
                                                   +--> Task 7: pre-assembly Host integration
                                                              |
Task 1 -------------------------------------------------------+
                                                              |
                                                              +--> Task 8: A5p client carrier
                                                                         |
                                                                         +--> Task 9: vertical dogfood probe
```

## Task list

### Foundation

- [ ] Task 1: Freeze the initial exact route inventory and A3p evidence matrix.
- [ ] Task 2: Freeze the ExternalRoutePrior snapshot, heuristic-policy, freshness, attribution, and data-rights contract.

### Checkpoint: evidence foundation

- [ ] Every proposed experimental route has an exact DSH-to-external-record mapping or is explicitly excluded.
- [ ] The maintainer reviews the heuristic boundaries and explicitly authorizes any Artificial Analysis API access and new runtime/development dependencies before implementation.
- [ ] The maintainer separately accepts an ADR-007-compliant possible-loss bound and verified Recovery Capability scope before mutable Experimental Auto is enabled; otherwise implementation and dogfood remain read-only.

### Core

- [ ] Task 3: Establish the TypeScript/ESM package, test harness, and discriminated admitted-versus-experimental domain types.
- [ ] Task 4: Implement the offline external-prior snapshot loader and exact route matcher.
- [ ] Task 5: Implement deterministic Task Assessment and Session Static experimental policy.

### Checkpoint: pure policy

- [ ] Unit, property, schema, and golden-decision tests pass without DSH or network access.
- [ ] A fresh project Code Review Skill run returns `PASS` with no P0-P2 findings.

### Host and client vertical slices

- [ ] Task 6: Persist and cold-reconstruct Phase 0P catalog, assessment, decision, resolution, and explanation events.
- [ ] Task 7: Integrate one frozen Session decision through `agent/prepare-step`, provider-dependent assembly, and `agent/request`.
- [ ] Task 8: Implement and verify the A5p Experimental Auto/manual carrier and persisted explanation view.

### Checkpoint: integrated path

- [ ] Pinned-fork contract tests prove request/snapshot identity, fail-closed incompatibility, and cold reconstruction.
- [ ] Web or alternate carrier tests prove one-operation mode selection and actual persisted explanation retrieval.
- [ ] A fresh project Code Review Skill run returns `PASS` for each bounded integration stage.

### Dogfood

- [ ] Task 9: Run the secret-free vertical probe, package the maintainer dogfood build, and publish a local runbook and evidence report.

### Checkpoint: Phase 0P ready

- [ ] Maintainer can opt into Experimental Auto, run a task end to end, inspect the exact model/effort and source snapshot, cold reload, and return to Manual.
- [ ] No Artificial Analysis credential or redistributed dataset is tracked, and no output claims RouterBench admission, non-inferiority, official DSH compatibility, or public support.
- [ ] `PROJECT_STATUS.md` records the exact plugin commit, DSH fork commit, carrier version, verification evidence, and remaining Phase 0C gates.

## Verification strategy

- Pure domain tests run without network or DSH runtime.
- Snapshot tests use synthetic fixtures with Artificial Analysis-compatible fields, not copied production ranking data, and prove endpoint/pagination metadata plus a canonical content digest identify the exact input.
- Contract tests prove exact identity and effort matching, freshness failure, malformed data failure, deterministic tie-breaking, and experimental/admitted type separation.
- Policy tests prove mutable experimental routing requires a separately accepted loss bound plus sufficient Host-declared Recovery Capability for every effect class; irreversible external effects and out-of-bound mutations terminate Auto before a call. User intervention can switch to Manual or wait for new execution-world facts, but cannot authorize the denied Experimental Auto dispatch.
- DSH integration tests include a real Loader plus app/process composition, a keyless headless Session JSONL transcript, a self-skipping with-key real-provider smoke, and negative controls. They prove one Session decision plus per-call authorization, stable A1 message identities without forward event references, interrupted-preparation recovery, Manual bypass without turn consumption, the same immutable route snapshot reaches assembly and request, required events survive cold reload, and the persisted request/header matches the provider's external response.
- A5p tests prove displayed state comes from persisted Session facts rather than client-local optimistic state; a Web carrier also requires browser snapshots for positive, reload, Manual, and stopped states.
- Every bounded implementation task invokes `.agents/skills/dsh-auto-mode-code-review/SKILL.md` after focused verification and before commit.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Artificial Analysis access or redistribution rights do not cover the intended public product | High | Keep Phase 0P local and maintainer-only; store no ranking dataset; stop before public distribution until rights are confirmed |
| DSH route identity cannot prove the leaderboard configuration actually served | High | Exclude the route; never fall back to alias-name matching |
| A ranking measured at one effort is applied to another | High | Make reasoning-selection encoding part of the exact match key and test all three default/explicit forms |
| Heuristic score boundaries look like safety guarantees | High | Persist and display `experimental-unadmitted`; use separate catalog types and explicit reason codes |
| External rankings drift | Medium | Pin source index version and retrieval time, enforce freshness, and require a new snapshot rather than silently reinterpreting old decisions |
| A5p Web seams cannot retrieve required Session facts | High | Run the carrier seam probe before UI implementation and choose an alternate explicit carrier only if it satisfies the same contract |
| Phase 0P code contaminates Phase 0C admission policy | High | Prohibit conversions from experimental evidence to `RouteAdmission`; add compile-time and runtime separation tests |

## Open questions

The implementation must close the Phase 0P section of [open questions](../docs/open-questions.md). The immediate unresolved decisions are the exact initial route set, heuristic score boundaries, snapshot freshness, Artificial Analysis access/data rights, and the concrete A5p carrier.

## Explicit non-goals

- RouterBench admission or quality/non-inferiority claims.
- Within-turn switching, recovery, child-agent routing, online learning, or telemetry upload.
- Public package publication, default-on Auto, official DSH compatibility, or Artificial Analysis data redistribution.
- Inferring model capability for an effort or provider-default encoding that Artificial Analysis did not measure exactly.
