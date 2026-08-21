# DSH integration and compatibility

[简体中文](zh-CN/dsh-integration.md)

## Audit scope

This document records a source audit of DeepSeek Harness commit [`47f943859bef60e4160492346772ded9b24f765a`](https://github.com/deepseek-ai/deepseek-harness/tree/47f943859bef60e4160492346772ded9b24f765a), performed on 2026-08-14. It is evidence about that revision, not a compatibility promise for later DSH versions.

The plugin must pin an exact tested DSH version or commit and run an extension-contract suite before declaring compatibility.

## Current fork preview runtime carrier

The current preview runtime carrier is the maintainer fork [`cloudman6/deepseek-harness`](https://github.com/cloudman6/deepseek-harness). Its `master` branch was verified at the audited baseline on 2026-08-14. Product-neutral A1 and A2 contracts were implemented from that baseline; the experimental Auto UI was then added without changing those contracts. Branch `codex/auto-mode-host-contracts` is pinned at exact commit [`2a2db7a6ec3ce9969857cc41de839f911ef5902e`](https://github.com/cloudman6/deepseek-harness/commit/2a2db7a6ec3ce9969857cc41de839f911ef5902e).

The product-neutral seams and fork evidence were published for upstream design feedback in DeepSeek Harness [Discussion #2281](https://github.com/deepseek-ai/deepseek-harness/discussions/2281) on 2026-08-16. Publication does not imply maintainer acceptance or official compatibility.

Every preview build must identify the exact fork remote and post-seam commit. That identifies the Host build, not the remote model deployment. Under ADR-011, the effective Host route is bound explicitly to one AA evidence record while preserving any semantic-match limitation; the binding is not a provider deployment fingerprint. A local checkout path is never part of the public compatibility contract, and successful fork validation must not be presented as official DSH support.

The concrete MVP carrier is the fork model-selection UI plus the plugin's optional Session projection and `/auto` command. It provides a one-operation Auto/manual choice, a checked Auto state, the effective model and effort, and the persisted explanation. A changed decision includes its preceding route, allowing the UI to roll only the changed model and/or effort value to the effective selection over 1.2 seconds; Auto and changed targets use DSH business blue, breathe twice, and return to their normal color, including on an effort-only transition. The chat timeline records the before/after model and effort plus the handling level, reason code, and explanation immediately after the triggering user message and before the resulting assistant response. Phase 3 reuses this carrier and migrates its terminology and policy to ADR-011 after the completed offline Phase 1 catalog and Phase 2 assessor; the production carrier remains undecided.

### Fork contract evidence

The pinned fork commit adds an agent-scoped `agent/prepare-step` waterfall after inbox claim and before prompt assembly, while preserving the existing post-assembly `agent/pre-step`. It also adds effect-scoped required-event namespace registration in `SessionStore`, immutable namespace/version envelope identity, append-time validation, and exact-registration validation before cold Session reconstruction.

The combined JSONL probe changes the selected model during `agent/prepare-step`, verifies that prompt assembly and `agent/request` use that same model, persists a required plugin decision event, rejects cold load without its registration, and reloads successfully after the exact registration is restored. Verification passed on 2026-08-15 with 402 relevant tests, `pnpm typecheck`, `pnpm lint`, and all 28 `pnpm doc-sync` gates.

This evidence closes A1/A2 and the bounded MVP carrier for the pinned fork only. It is not official DSH compatibility and does not decide the production carrier.

## Verified usable seams

### Per-step request configuration

The scoped `agent/request` waterfall can replace the complete `LlmCallConfig` for each step, including provider, model, and adapter-owned reasoning effort. The loop resolves the proposed configuration, records its effective value in `request/header`, and then sends the frozen request. See the [event contract](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/agent/src/runtime-types.ts#L232-L245) and [request construction](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/agent-loop/src/agent.ts#L407-L482).

This seam is sufficient to apply an already-frozen route. It is not, by itself, sufficient to decide the route for the current step because prompt/tool assembly has already happened.

### Coupled model selection across assembly and request

DSH exports `installModelSelection()`, which captures one mutable selection during `system-prompt/assemble` and applies that same selection during `agent/request`. This prevents a concurrent switch from splitting provider-dependent prompt assembly from the request. See [`model-selection.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/agent/src/model-selection.ts#L1-L78).

Auto Mode should reuse or generalize this snapshot mechanism rather than create a second competing ownership path.

### Provider, model, and effort discovery

DSH already exposes provider-neutral runtime discovery: `listProviders()` enumerates active adapter routes, `listModels(provider)` returns each adapter's advisory model catalog, `resolveModelInfo(provider, model)` returns exact-route metadata and may expose adapter-owned reasoning efforts, and `llm/adapters-updated` tells consumers to refresh after topology changes. See [`LlmRuntime`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/llm/llm/src/index.ts#L415-L421), [catalog and exact-model resolution](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/llm/llm/src/index.ts#L575-L624), the [topology event](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/llm/llm/src/types.ts#L12-L24), and [optional reasoning metadata](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/llm/llm/src/types.ts#L252-L280).

Auto Mode should populate its concrete route inventory from these seams and refresh it on topology changes. DSH explicitly defines catalog membership as advisory, so discovery proves only current availability metadata; it does not prove quality or completeness. ADR-011 fingerprints each discovered route's effective configuration, joins it through one reviewed AA evidence binding, then applies Host capability and user constraints.

Reasoning metadata is optional. An explicit effort is eligible only when exact-route metadata lists that effort. If the adapter exposes `defaultEffort`, omitting a caller effort produces an adapter-materialized default whose exact effort is recorded. If no adapter default is materialized, omission preserves provider-default behavior. These request semantics remain distinct Host route identities; Auto must never invent an effort merely because metadata is absent. A provider-default route cannot bind to an effort-specific AA record unless the Host reliably materializes that effective value. Manual mode may still expose explicitly entered configurations under normal DSH validation.

### In-process child execution

In-process children are created as ordinary DSH Agents and therefore enter the same Agent loop. `SubagentStartRequest.agentOptions` can carry concrete Agent options, but the request has no semantic routing-constraint contract. See [`SubagentStartRequest`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/subagent/subagent/src/types.ts#L100-L154) and the [in-process driver](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/subagent/subagent-in-process-driver/src/index.ts#L99-L143).

The existing delegation helpers persist sandbox and approval policy, proving that child-local durable policy is a supported pattern. They do not persist Auto Mode's risk, minimum handling level, diversity, or latency constraints.

## Baseline gaps resolved on the pinned fork

### Current-step decision input arrives after assembly

The loop claims pending messages, assembles the system prompt, and only then invokes `agent/pre-step`; `agent/request` occurs still later. See [`preStep()`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/agent-loop/src/agent.ts#L225-L245).

`installModelSelection()` guarantees snapshot consistency only if `selection.current` was decided before assembly. An Auto policy that needs the newly claimed user message cannot obtain that message from the current `system-prompt/assemble` contract. Updating the selection in `agent/pre-step` is too late for the same step.

Fork resolution: `agent/prepare-step` now receives the frozen claimed messages, stable turn/step identity, and cancellation signal before assembly. Rejection prevents assembly and model dispatch; `installModelSelection()` snapshots a preparation-time selection for both assembly and `agent/request`. Official DSH still lacks this contract.

### Required plugin Session events cannot be registered reliably at runtime

The persistence reader checks a generated repository-local set of known event types. Its own generator states that downstream plugin events are outside the set and that a registration surface is deferred. Unknown required events cause cold-load refusal unless marked ignorable. See the [generated vocabulary](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/session/src/known-event-types.ts#L1-L19) and [persistence contract test](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/session/session-persistence/tests/coordinator-contract.ts#L1360-L1384).

Fork resolution: `SessionStore.registerEventNamespace()` now binds a namespace, owner, exact positive schema version, and complete payload-schema map. Required plugin events are validated and tagged before append; cold readers require the exact live registration and fail before reconstruction on missing, malformed, incompatible, undeclared, or invalid events. Official DSH still lacks this contract.

## Verified blocking or incomplete seams

### Child routing constraints are not a first-class durable contract

`agentOptions` permits a caller to pass concrete options, but it does not express or validate semantic intent such as risk, minimum handling level, independent review, deadline, or model-family diversity. Auto Mode needs a Host-resolved persistent constraint contract; raw `agentOptions` is not a substitute.

External Codex and Claude Code providers also do not expose request-level model/effort selection through this subagent seam. Their documented behavior delegates model choice to native product configuration: [Codex provider](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/subagent/subagent-codex/README.md#L28-L30) and [Claude Code provider](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/subagent/subagent-claude-code/README.md#L63-L65).

### General recovery capability is not established

The audited seams do not establish a general contract for workspace checkpoint/restore, mutation attribution, external-side-effect rollback, or same-Session model handoff. These are required capabilities, not properties Auto Mode may infer from filesystem or tool access.

Implementation planning must identify explicit upstream or composed providers for each declared `RecoveryCapability`; otherwise salvage/restart and mutable-work down-routing remain unavailable.

## Upstream dependency tracks and priority

A1 and A2 are resolved on the maintained fork. Other needs enter only in the roadmap phase that consumes them.

| Track | Capability | Required for | Audited status | Expected owner |
|---|---|---|---|---|
| A1 | Pre-assembly step context shared with `agent/request` | Session Static Auto | Implemented and tested on pinned fork; absent upstream | DSH upstream |
| A2 | Required plugin Session-event registration and compatibility | Session Static Auto | Implemented and tested on pinned fork; absent upstream | DSH upstream |
| A3p | Versioned Host-route-to-AA evidence binding | Phase 1 AA catalog | DSH selection inventory exists; ADR-011 separates effective Host route identity from AA evidence identity | Plugin |
| A3 | Optional resolved deployment fingerprint | Future claims that require exact deployment identity | Focused audit required; not on current critical path | Provider adapter or DSH upstream |
| A4 | Extensible purpose and audit classification for fixed auxiliary calls | Task Assessor operations | Focused audit required | Plugin if open; otherwise DSH upstream |
| A5p | One verified carrier for Auto/manual and persisted explanations | Phase 1–3 usability | MVP carrier verified on pinned fork; terminology and AA details remain to migrate | Fork UI plus plugin Session projection and command |
| A5 | General Auto/manual and explanation UI extension contract | Official-compatible user-facing release | Focused audit required | Client plugin or DSH upstream |
| B1 | Persistent typed child-creation metadata for semantic constraints | In-process child routing | Verified incomplete | Generic DSH seam plus plugin schema |
| B2 | External subagent creation-time model/effort capabilities | External child routing | Verified absent in audited providers | Provider adapters; shared capability declaration if needed |
| C1 | Structured validation, mutation, provenance, and trust signals | Routing safety and recovery | Incomplete across tools | Capability adapters and possibly DSH upstream |
| C2 | Provider-neutral `RecoveryCapability` declaration | Mutable down-routing and recovery | Verified absent as a general contract | Execution-world/sandbox seam |
| C3 | Atomic workspace checkpoint and Session/attempt lineage | Salvage/restart | Verified absent as a general contract | DSH upstream and checkpoint providers |
| C4 | Controlled Session handoff with constrained evidence | Salvage/restart | Partial Session primitives; sufficiency unverified | DSH upstream or stable extension capability |

### Track A contribution sequence

1. **Completed:** freeze product-neutral contracts for A1 and A2 in narrow DSH design notes.
2. **Completed:** add core contract tests for the absent baseline behavior.
3. **Completed:** implement and verify the seams, now carried by fork commit `2a2db7a6ec3ce9969857cc41de839f911ef5902e`.
4. **Completed:** publish the product-neutral contracts and fork evidence for upstream feedback in Discussion #2281.
5. **Historical inventory complete:** the [Phase 0P route inventory](evidence/phase-0p-route-inventory.md) records why the former deployment-level rule produced an empty exact intersection. ADR-010 removed that release gate; ADR-011 now defines the current explicit evidence-binding contract.
6. **MVP completed:** the fork UI and plugin projection/command cover explicit opt-in, Auto/manual choice, persisted selection, actual configuration, and explanation retrieval.
7. Add a vertical Phase 1–3 probe proving semantic assessment, AA evidence binding, price-first resolution, assembly/request selection identity, persistence, and Manual non-interference.
8. If maintainers invite external changes, submit A1 and A2 as separate upstream contributions.
9. Pin the plugin to the first compatible official DSH revision after merge. While upstream is unavailable, identify the exact fork and do not claim official compatibility.

A1 must be product-neutral: it carries claimed messages, stable step identity, cancellation, and immutable per-step context, but knows nothing about routes. A2 must fail with a precise missing-plugin or incompatible-event diagnostic rather than silently skipping normative state.

An `agent/request`-only prototype, ignorable plugin events, or a configuration-only UI with no explanation path remains insufficient for the AA-informed product path.

### Later-track ownership boundary

DSH should provide lifecycle, persistence, capability, and execution-world contracts. Auto Mode retains Task Assessment schemas and models, Host-route-to-AA binding data, task-handling levels, Routing Policy, episode policy, and optional evaluation. This boundary keeps upstream extensions reusable and prevents DSH Core from embedding one routing product's taxonomy.

## Compatibility policy

An Auto Mode release must declare:

- Exact tested DSH version/commit range.
- Required event-registration and pre-assembly contracts.
- Contract-test version and results.
- Host route identity, AA evidence-binding semantics, and concrete route capability requirements.
- The verified Auto/manual and explanation carrier for the declared release surface.
- Supported in-process and external child providers.
- Supported recovery-effect classes.
- Fail-closed behavior for every missing or incompatible seam.

Plugin activation fails before serving Auto when a required normative event cannot round-trip through cold persistence, when route assembly and request cannot share one snapshot, or when the configured catalog requires an unavailable capability.

## Upstream contribution candidates

1. Runtime registration and compatibility metadata for required Session event types.
2. A scoped pre-assembly step-decision seam carrying claimed messages and stable turn/step identity.
3. A durable semantic child-routing constraint capability with Host conflict resolution.
4. Provider-neutral recovery-capability and execution-world checkpoint interfaces.
5. Contract fixtures proving snapshot, persistence, cold-recovery, and child-constraint behavior.

Whether these land in DSH core or a stable extension package remains open. Host ownership of policy is an authority decision, not a decision that all implementation must live in core.
