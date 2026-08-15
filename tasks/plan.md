# Implementation plan: Phase 0 A1/A2 Host contracts

[简体中文](plan.zh-CN.md)

## Objective

Implement and prove two product-neutral DeepSeek Harness contracts on the declared fork:

- A1: an agent-scoped pre-assembly step-preparation waterfall that receives the newly claimed messages and stable turn/step coordinates, can stop the step before assembly or a model call, and lets an existing model-selection snapshot feed both provider-dependent assembly and `agent/request`.
- A2: effect-scoped runtime registration for required plugin Session-event namespaces, with durable schema-version identity, namespace conflict detection, payload validation, cold-load diagnostics, and fail-closed incompatibility.

The fork implementation must not contain Auto Mode route tiers, Task Assessment, Policy Pack, provider ranking, or model-selection policy.

## Contract decisions

### A1

Add an additive `agent/prepare-step` waterfall before `system-prompt/assemble`. Its payload contains the scoped Agent, the exact frozen claimed `UserMessage[]`, `turn`, `step`, and `AbortSignal`. Its result is either `enter` or `reject`; it does not rewrite messages. Existing `agent/pre-step` remains after assembly and retains its message-rewrite semantics.

This separation keeps lifecycle policy before provider-dependent assembly without breaking existing pre-step consumers. A route owner can update the existing `installModelSelection()` state during preparation; model selection is then captured by assembly and replayed unchanged at `agent/request`.

### A2

Extend `SessionStore` with an effect-scoped namespace registry. A registration declares:

- a globally unique namespace;
- a non-empty owner identifier;
- a positive integer schema version;
- the complete event-type-to-payload-schema map for that namespace.

Schemas use a structural `parse(unknown): unknown` interface so plugins may supply Zod or another validator without adding a Session-core dependency. Runtime validation ignores transformed return values and persists the original lossless JSON snapshot.

Every required out-of-tree event appended through an attached Session receives immutable envelope metadata identifying its namespace and schema version. Cold readers accept it only when the matching live registration exists, the version matches, the type belongs to that registration, and its payload validates. Missing registration, version drift, unknown registered type, malformed metadata, and schema rejection fail before Session reconstruction. Built-in events continue to use the generated catalog; explicitly ignorable unknown events retain the existing forward-compatibility behavior.

Registration is expected at plugin activation before any cold `load` or `prepare`. Loading before registration fails closed with a diagnostic that names the missing namespace and version; retrying after registration is supported.

## Dependency graph

```text
Accepted DSH Auto Mode specification and ADRs
                    |
        +-----------+-----------+
        |                       |
 A1 public contract       A2 public contract
        |                       |
 A1 contract tests        A2 registry/load tests
        |                       |
 A1 implementation        A2 implementation
        +-----------+-----------+
                    |
          Combined vertical probe
                    |
       Fork commit pin and evidence update
```

## Increments

### Increment 1: A1 failing contract tests

Add focused Agent-loop tests proving event order, immutable claimed input, stable coordinates, scoped delivery, cancellation, and rejection before prompt assembly/model dispatch. Run the tests against the audited revision and record the expected RED result.

### Increment 2: A1 implementation

Add the public decision type and event declaration in `@deepseek-ai/dsh-agent`; dispatch the waterfall immediately after inbox claim and before `system-prompt/assemble`; preserve the existing `agent/pre-step` contract. Make the focused tests GREEN and run the Agent and Agent-loop suites.

### Increment 3: A2 failing contract tests

Add Session unit tests for registration validation, duplicate namespace/type rejection, append-time payload validation, effect disposal, and envelope metadata. Extend the shared persistence coordinator contract with cold-load tests for missing registration, version mismatch, schema failure, and register-then-retry. Record the expected RED result.

### Increment 4: A2 implementation

Implement the namespace registry in `SessionStore`, add the optional registered-event envelope metadata, validate attached live appends before log mutation, and replace the persistence coordinator's generated-set-only check with generated built-ins plus live registration resolution. Make focused Session and persistence tests GREEN.

### Increment 5: Combined vertical probe

Mount Agent loop, system prompt, model selection, JSONL persistence, and a synthetic plugin registration. During `agent/prepare-step`, select a different model and append a required plugin decision event. Prove:

- the current claimed message drives the decision before assembly;
- assembly and `agent/request` observe the same selected route;
- `reject` produces no assembly and no model call;
- the required plugin event survives flush and cold reload when registered;
- cold reload fails closed with precise diagnostics when the plugin registration is missing or incompatible.

### Increment 6: Verification and evidence

Run focused tests after each behavioral change, then DSH typecheck, lint, documentation synchronization checks, and the full relevant test suite. Record the exact fork commit and test evidence in `docs/dsh-integration.md` and `PROJECT_STATUS.md`. Do not mark Phase 0C usable: A3p, the minimal Phase A evidence slice, and A5p remain open.

## Verification commands

Use repository-local commands discovered from the DSH root:

```bash
pnpm exec vitest run \
  packages/core/agent-loop/tests/interception.spec.ts \
  packages/core/agent-loop/tests/resume.spec.ts \
  packages/core/session/tests/session.spec.ts \
  packages/core/scope/tests/invariant.spec.ts \
  packages/session/session-persistence/tests/persistence.spec.ts \
  packages/session/session-persistence-jsonl/tests/jsonl.spec.ts
pnpm typecheck
pnpm lint
pnpm doc-sync
```

Generated documentation/catalog commands discovered during implementation must also pass when public events or package contracts change.

## Execution result

Completed on 2026-08-15 in the maintainer fork branch `codex/auto-mode-host-contracts` at commit [`801ded7f60a0dfab07b9690cb9d98fce6234d243`](https://github.com/cloudman6/deepseek-harness/commit/801ded7f60a0dfab07b9690cb9d98fce6234d243).

- A1 dispatches `agent/prepare-step` after inbox claim and before prompt assembly; contract tests cover ordering, frozen claimed messages, rejection, cancellation, and assembly/request route identity.
- A2 registers effect-scoped required-event namespaces, validates append and cold-read payloads, persists exact namespace/version identity, and fails closed on missing, malformed, incompatible, or undeclared registrations.
- The combined JSONL probe selects a route before assembly, persists its required plugin event, rejects an unregistered cold read, and succeeds after the exact registration is restored.
- Verification passed: 402 tests across the affected Agent-loop, Session, scope, memory-persistence, and JSONL-persistence suites; `pnpm typecheck`; `pnpm lint`; and all 28 `pnpm doc-sync` gates.

The implementation was committed as one integrated Host-contract change because the public catalogs, shared persistence contracts, and vertical probe jointly describe the compatibility boundary. A1 and A2 should still be proposed as separate upstream changes. This result closes the fork implementation task only; it does not close A3p, Phase A admission, A5p, or official DSH compatibility.

## Risks and controls

| Risk | Control |
|---|---|
| Moving existing `agent/pre-step` breaks consumers | Add a new preparation event; do not reorder or weaken existing pre-step message rewriting |
| Route changes split prompt assembly and request | Reuse `installModelSelection()` snapshot; vertical test compares assembly and request |
| Plugin schema changes silently reinterpret old logs | Persist namespace/version identity and validate on every cold read |
| Plugin unload makes existing logs unreadable | Fail closed with a missing-plugin diagnostic; never mark normative events ignorable |
| Registration collisions become load-order dependent | Reject duplicate namespaces and built-in event types deterministically |
| Validator transforms persisted state | Ignore parser output and retain the original validated JSON snapshot |
| Scope expands into Auto Mode policy | Contract tests and code use only synthetic product-neutral fixtures |

## Explicit non-goals

- Implementing Routing Policy, Task Assessment, Policy Packs, A3p, A5p, RouterBench admission, or the Auto/manual UI.
- Claiming official DSH compatibility before upstream acceptance.
- Adding within-turn switching, recovery, or child-agent routing.
