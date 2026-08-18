# Phase 0P exact route inventory and A3p evidence

> Historical Phase 0P evidence. ADR-010 supersedes deployment-level exact matching for post-MVP routing; the current policy matches model family, semantic version, variant, and effort while ignoring date/build revision.

[简体中文](../zh-CN/evidence/phase-0p-route-inventory.md)

## Evidence status

This evidence was frozen on 2026-08-16 for DSH Auto Mode Phase 0P. It applies only to the maintainer fork commit [`801ded7f60a0dfab07b9690cb9d98fce6234d243`](https://github.com/cloudman6/deepseek-harness/commit/801ded7f60a0dfab07b9690cb9d98fce6234d243) and the public DeepSeek endpoint `https://api.deepseek.com`.

The initial exact-match set is empty. The DSH inventory contains six explicit DeepSeek V4 Flash/Pro selections, but its revisionless pass-through aliases do not bind the versioned deployments measured by Artificial Analysis. Phase 0P must return `no-experimental-route` until a version-specific selector and provider-specific deployment identity produce a non-empty exact intersection.

## DSH evidence envelope

The audited official DSH commit is `47f943859bef60e4160492346772ded9b24f765a`; A1/A2 are carried by the pinned fork commit above. The provider implementation and composition files are byte-identical at those two commits:

| File | Git blob |
|---|---|
| `packages/llm/llm-deepseek/src/adapter.ts` | `5fa62d30ff8cde0f170798fdbc982905291f383c` |
| `packages/llm/llm-deepseek/src/index.ts` | `8d01d9d6bc58aec19be1580c0d8d030e264056ee` |
| `packages/llm/llm-deepseek/src/serialize.ts` | `34fa214bb981865a016378e87bc635b907505e26` |
| `packages/llm/llm/src/index.ts` | `e87c428d060305e416747adac386058d24d8e37d` |
| `packages/bundle/base/cordis.patch.yml` | `e9567d9206e5b8c64b40cf76b88619f383f2269e` |
| `examples/headless-agent/cordis.yml` | `bb75f55b98cbdd3417bdc8df8185fbba61e3577c` |

The native adapter registers `deepseek-official`, advertises `deepseek-v4-flash` and `deepseek-v4-pro`, passes the model identifier unchanged on the wire, and exposes `off`, `high`, and `max` for exact-model discovery. DSH resolves an omitted caller effort to the adapter default before dispatch. The serializer sends explicit `off` as `thinking.type: disabled` with `reasoning_effort` omitted; `high` and `max` send `thinking.type: enabled` plus the matching top-level `reasoning_effort`.

The shipped base composition mounts the pi-ai adapter with zero routes until maintainer settings add profiles. Installed pi-ai catalog entries therefore do not prove an active route and are outside this inventory.

## Canonical identity and fingerprint

The selection fingerprint is `sha256` over compact UTF-8 JSON with keys in the order shown below. `wire.reasoningEffort: "omitted"` is an identity marker; the property is absent from the actual provider request.

```json
{
  "schema": 1,
  "adapter": "@deepseek-ai/dsh-llm-deepseek",
  "adapterVersion": "0.1.0-rc.5",
  "endpoint": "https://api.deepseek.com",
  "provider": "deepseek-official",
  "model": "deepseek-v4-flash",
  "reasoningSelection": { "kind": "explicit-effort", "effort": "off" },
  "wire": { "thinkingType": "disabled", "reasoningEffort": "omitted" }
}
```

The fingerprint proves the normalized DSH selection and request encoding under the evidence envelope. It does not prove model quality, immutable server weights, the identity behind an opaque provider alias, or RouterBench admission. Tasks 6, 7, and 11 must persist and compare the effective request and a provider-specific deployment identity or attestation so alias or endpoint drift fails closed. If the provider cannot expose a binding stronger than the alias, the route remains excluded with `no-experimental-route`.

## External-record comparison

The public Artificial Analysis pages inspected on 2026-08-16 distinguish model revision and reasoning configuration more precisely than the DSH aliases. The non-reasoning Flash record identifies the 0420 deployment, the max record identifies the 0731 deployment, and the high-effort URL did not provide a stable retrievable exact record during fresh-context review. The public V4 Pro surfaces likewise mix unsuffixed and 0813 identities. None can bind a revisionless DSH selector.

| DSH selection | Selection fingerprint | Artificial Analysis observation | Status |
|---|---|---|---|
| `deepseek-official/deepseek-v4-flash`, explicit `off` | `sha256:ed4d399c52eebf6b9ead80dc7510388b70eccf4e38b270a69fd8b24215553bfa` | [`deepseek-v4-flash-non-reasoning`](https://artificialanalysis.ai/models/deepseek-v4-flash-non-reasoning) identifies a versioned non-reasoning deployment | Excluded: alias has no revision binding |
| `deepseek-official/deepseek-v4-flash`, explicit `high` | `sha256:6b12e7ad07de1da5487b761d677b52052515619b1911dadfcd31a56b70196cef` | [`deepseek-v4-flash-high`](https://artificialanalysis.ai/models/deepseek-v4-flash-high) was not a stable retrievable exact record in fresh review | Excluded: record and deployment identity unverified |
| `deepseek-official/deepseek-v4-flash`, explicit `max` | `sha256:6298daab213bc1aca67868531a8d999f4863472c7ac99d5effc641b961c392bc` | [`deepseek-v4-flash`](https://artificialanalysis.ai/models/deepseek-v4-flash) identifies a versioned max-effort deployment | Excluded: alias has no revision binding |

No ranking value is copied into this repository. The links record the comparison evidence and exclusion, not a route mapping. Task 2 still owns source access, stable record identifiers, field semantics, freshness, attribution, rights, and canonical snapshot digest.

## Explicit exclusions

| DSH selection | Reason for exclusion |
|---|---|
| `deepseek-official/deepseek-v4-pro`, explicit `off`, `high`, or `max` | The current Artificial Analysis surfaces are inconsistent about revision identity: model pages use the unsuffixed V4 Pro name while the leaderboard names `DeepSeek V4 Pro 0813`. The DSH selector is an opaque pass-through alias and supplies no revision binding. Name similarity is insufficient. |
| Any omitted effort resolved to the adapter default | DSH marks this as an adapter-materialized default. Artificial Analysis records describe explicit non-reasoning/high/max configurations, not this request-selection form. An equal effective wire value does not permit score transfer. |
| Provider-default omission on `deepseek-official` | The direct adapter exposes and materializes a default effort; no provider-default omission identity is reachable through the resolved DSH call. |
| Any pi-ai provider/model catalog entry | The shipped adapter is dormant and exposes no active route without maintainer settings. Installed catalog availability is not deployment identity. |
| Any non-public endpoint or changed adapter version/implementation | It is outside the frozen evidence envelope and requires a new identity and mapping audit. |

The V4 Pro normalized DSH fingerprints are reproducible and excluded: `off` is `sha256:0ddd5a8d304d7e6563343777eb1461636e50dab28632b7da7365f84f43bb709b`, `high` is `sha256:a6479f6160755a14d7216fd93bd3ba333e79e969d91c9f3840c35cda2e1f9123`, and `max` is `sha256:beb19b48048eb21aec0a3ba04e2dced07a78fcdd388777a1d086ca5a1ff3202e`.

## Reproduction and checks

From a checkout containing the pinned fork commit:

1. Verify the six source/composition blob IDs with `git ls-tree <commit> <path>` and verify the official-to-fork path diff is empty.
2. Load `LlmRuntime` and `@deepseek-ai/dsh-llm-deepseek` with the public endpoint and no credential resolution. Enumerate `listProviders()`, `listModels(provider)`, and `resolveModelInfo(provider, model)`.
3. For every discovered explicit effort, build the canonical identity above, serialize it with `JSON.stringify`, and calculate its SHA-256 digest.
4. Run the probe twice and compare the complete normalized JSON byte for byte.
5. Run `pnpm exec vitest run packages/llm/llm-deepseek/tests/adapter.spec.ts packages/llm/llm-deepseek/tests/serialize.spec.ts`.

On 2026-08-16 the two probe runs were byte-identical and the focused DSH suite passed 103 tests across two files. The probe required no API key and made no provider request.

## Task 1 disposition

Task 1 is complete as a route-selection inventory and exclusion matrix. The six DSH-side explicit identities are reproducible, but the initial `ExperimentalRouteCatalog` is empty and A3p remains open. A route enters the catalog only after a version-specific selector plus provider-specific evidence binds the runtime deployment to one measured configuration; otherwise resolution returns `no-experimental-route`. Adding a versioned DeepSeek selector, a pi-ai route, a default encoding, another endpoint, or a changed adapter requires a new evidence revision rather than widening this matrix by inference.
