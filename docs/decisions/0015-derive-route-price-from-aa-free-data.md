# ADR-015: Derive route price from AA Free data

[简体中文](../zh-CN/decisions/0015-derive-route-price-from-aa-free-data.md)

## Status

Accepted

This decision supersedes ADR-013's mandatory Pro acquisition endpoint and mandatory AA blended-price field, plus the corresponding price-field clauses in ADR-011 and ADR-014. It preserves their external-evidence identity, exact binding, offline acquisition, credential isolation, rights, validation, atomic activation, rollback, and no-runtime-AA-call boundaries.

## Date

2026-08-22

## Context

The implemented route policy requires `pricing.price_1m_blended_7_to_2_to_1`, which is available only from AA's Pro language-model endpoint. A valid Free key can instead call `/api/v2/language/models/free`. That endpoint keeps stable record and creator IDs, headline Intelligence scores, input/output prices, optional cache prices, and median performance while omitting the Pro blended-price field.

The verified 2026-08-22 Free acquisition contained 610 stable records. Of those, 597 had an Intelligence score, 405 had an Intelligence score plus valid input and output prices, and 308 of those 405 also had median time to first answer token. Requiring Pro therefore blocks a materially larger locally maintainable catalog even though Free contains enough source facts to preserve capability bands and deterministic price-first resolution.

Different model and reasoning configurations remain separate AA records. Their AA score, not their provider effort label, determines their Light, Standard, or Deep band. Free data does not solve Host-to-AA identity: display names and slugs remain insufficient to create bindings, so exact provider normalization rules and stable AA record IDs remain mandatory.

## Decision

Introduce `aa-route-policy/v2`, `aa-snapshot/v3`, `aa-api-acquisition/v2`, and Runtime compatibility version 2.

The maintained acquisition adapter calls only:

```text
https://artificialanalysis.ai/api/v2/language/models/free?page=N
```

It accepts the Free-shaped response for a valid Free, Pro, or Commercial key, follows every documented page, keeps the key server-side, rejects redirects and malformed or oversized responses, and stores acquisitions only in the existing private local boundary. The runtime never calls AA.

### Capability bands

Each stable AA record is independently assigned by `evaluations.artificial_analysis_intelligence_index` under methodology `v4.1.1`:

| Handling level | Score |
|---|---:|
| Light | `< 35` |
| Standard | `>= 35` and `< 50` |
| Deep | `>= 50` |

Effort, reasoning mode, model family, and provider do not imply a handling level.

### Normalized price

Policy eligibility requires a valid Intelligence score plus non-negative finite AA input and output prices. Cache-hit price is optional. For each eligible record, Snapshot construction derives:

```text
effectiveCachePrice = cacheHitPrice ?? inputPrice

price_1m_normalized_7_to_2_to_1 =
  (7 * effectiveCachePrice + 2 * inputPrice + outputPrice) / 10
```

The 7:2:1 weights represent cache-hit/input/output token prices. Missing cache-hit price means no evidenced cache discount and therefore substitutes the AA input price. Cache-write price is not part of this comparison formula. The Snapshot retains the AA input, output, nullable cache-hit prices, the derived normalized price, and whether cache-hit or input substitution supplied the cache leg.

This is a deterministic normalization of AA-reported unit prices, not a prediction of task token counts or a private task-cost estimator. User-task token volume remains outside Routing Policy.

Within one handling level, Runtime orders routes by lower normalized price, then lower AA median time to first answer token, then stable route identity. Missing latency remains nullable and sorts after measured latency at equal price. Task Assessor eligibility continues to require measured latency at or below six seconds.

### Compatibility

New Free acquisitions produce only v2/v3 artifacts. Runtime version 2 provides one explicit migration adapter for a valid v1 Evidence Pack: its AA-reported Pro blended value becomes the v2 normalized value with basis `legacy-aa-blended`. The adapter never invents missing component prices and records the compatibility basis. A subsequent Free refresh replaces this transition representation with `derived-free-prices` records.

Historical Session facts remain unchanged. Old ADRs and legacy refresh code remain historical compatibility sources rather than being rewritten to describe v2.

### Rights and distribution

The Free acquisition path defaults to `internal-only`, requires Artificial Analysis attribution, and does not grant redistribution. Real acquisitions, Snapshots, credentials, rollback material, and refresh reports remain Git-ignored and outside the browser client and public plugin. A public real Evidence Pack still requires the separately auditable written grant defined by ADR-013.

## Alternatives considered

### Require Pro

Rejected as the default. It makes the installed product depend on a paid entitlement even though Free exposes the capability, token-price, and median-latency facts needed by a deterministic policy.

### Use Intelligence Index cost per task

Rejected as the primary price field. It is directly AA-reported but was present for only 145 of the 610 verified Free records, so it would exclude most otherwise comparable model/effort records.

### Compare input then output price lexicographically

Rejected. It gives arbitrary priority to one token class and can prefer a route with a slightly cheaper input price but a substantially higher output price.

### Infer effort bindings from AA names

Rejected. Effort is often presentation text rather than a stable structured field, and multiple evaluated configurations may share a slug. Names and slugs cannot prove an executable Host route identity.

### Bundle the Free Snapshot with the public plugin

Rejected without a written grant. Free access permits local acquisition; it does not establish public redistribution rights for a machine-readable model-selection product.

## Consequences

- A user-owned Free key can populate the complete locally policy-eligible AA Snapshot without a Pro subscription.
- The verified current dataset yields 405 capability-and-price-eligible records; missing latency does not prevent ordinary task routing.
- Price explanations must say “normalized from AA-reported prices,” not “AA blended price.”
- Provider normalization rules and exact Binding Registry entries remain necessary before a Snapshot record can enter the Active Catalog.
- Runtime and Pack compatibility advance together, while legacy packs remain usable through an explicit, auditable migration basis.
- AA schema, methodology, terms, or rights changes remain RED and retain the previous valid local Pack.

## Reviewed official sources

- [Artificial Analysis Data API documentation](https://artificialanalysis.ai/data-api/docs): Free endpoint, response fields, pagination, key handling, tiers, and rate limit.
- [Artificial Analysis Data API access page](https://artificialanalysis.ai/data-api): Free internal-workflow scope, attribution, and non-redistribution boundary.
- [Artificial Analysis Terms of Use](https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf): reviewed general terms, version 1.0, revised 2024-04-28.
