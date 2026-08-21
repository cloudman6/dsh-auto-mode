# ADR-011: Bind Host route identities to AA evidence

[简体中文](../zh-CN/decisions/0011-bind-host-routes-to-aa-evidence.md)

## Status

Accepted

Supersedes ADR-010 for the post-MVP product direction. It retains ADR-010's AA-informed routing, Light/Standard/Deep handling levels, deterministic Host ownership, price-first resolution, optional RouterBench, and product-claim limits. It replaces only the route-to-AA identity contract and the Phase 1A work derived from that contract.

## Date

2026-08-21

## Context

ADR-010 required every AA match to use model family, semantic version, variant, and explicit effort. That shape describes the current DeepSeek fixture but is not a stable industry model. Providers expose different model variants, zero or several reasoning controls, and other request options that affect capability, price, or latency. Making `variant` and `effort` universally mandatory would turn one provider's product structure into an Auto Mode architecture contract.

Artificial Analysis already treats evaluated model/configuration combinations as separate records and assigns them independent capability, price, and performance facts. DSH does not need to reproduce AA's model taxonomy. It does need to preserve the identity of the executable Host route and prove which AA record supplies evidence for that route.

An AA record ID cannot replace the Host route identity. AA records are evidence objects, not executable provider requests. A DSH route may include provider-specific effective configuration, may use a rolling provider alias, or may have no valid AA record. Collapsing both identities into an AA ID would hide execution differences and make alias drift look like evidence continuity.

## Decision

Keep execution identity and external evidence identity separate.

A **Host route identity** is the complete, effective DSH selection used for one model call. It includes the provider, model, and a stable fingerprint of every Host-materialized request option that can change execution semantics. Reasoning effort is one optional provider-owned dimension; it is not a universal required field. The Host route identity remains authoritative for availability, capability checks, request assembly, persistence, UI projection, and Manual equality.

An **AA evidence binding** is a versioned, explicit mapping from one Host route identity to one stable AA model/configuration record in one frozen AA snapshot. It records at least:

- the Host route identity and effective-configuration fingerprint;
- the AA snapshot and stable AA record ID;
- the binding-rule version and declared match basis;
- relevant AA release metadata and known evidence limitations.

Bindings are maintained data, not fuzzy name inference. Model names, slugs, family labels, versions, variants, efforts, and release dates may be match evidence when available, but no fixed subset is mandatory across all providers. A binding may not cross a Host-materialized execution difference. An unmatched or ambiguous route is excluded with a stable reason; it does not inherit evidence from a similar name.

Snapshot updates do not silently move a binding to a different AA record. Adding, replacing, or removing an AA record requires an explicit reviewed binding change. A revisionless or rolling provider alias may be bound only with a visible limitation that the match is semantic rather than proof of the exact deployed weights.

The AA route catalog joins DSH-discovered Host routes to validated bindings, attaches AA capability, price, and latency facts, and assigns each eligible route to exactly one versioned Light, Standard, or Deep capability band. Handling levels remain Host Policy concepts; they are not effort aliases or intrinsic AA classifications. The resolver continues to select within the requested band by lower AA price, then lower AA latency, then stable Host route identity.

Phase 1A therefore establishes the Host route identity and AA evidence-binding contract with mixed-provider fixtures. The current six DeepSeek model/effort combinations are one fixture set, not the catalog schema or supported industry cardinality.

## Alternatives considered

### Keep the mandatory family/version/variant/effort key

Rejected. It makes optional provider concepts universal, cannot naturally represent providers with no effort or additional controls, and encourages effort-to-band coupling.

### Use only the stable AA record ID as route identity

Rejected. AA identity cannot encode the executable provider request, Host-materialized defaults, provider capability, or rolling-alias drift. It is evidence identity, not execution identity.

### Infer bindings from names or slugs at runtime

Rejected. Presentation identifiers can change and similar names do not prove equivalent configurations. Runtime fuzzy matching would make routing nondeterministic and unauditable.

### Restore exact deployment fingerprints as a normal requirement

Rejected. Many provider aliases do not expose exact deployed weights. Explicit bindings preserve the limitation without claiming deployment equality or making exact fingerprints a general release gate.

## Consequences

- Adding a provider with zero, one, or many reasoning configurations does not require changing the catalog schema.
- The Host route and AA record remain independently visible and auditable.
- Maintainers must review explicit binding changes when AA records or provider routes change; automatic latest-row substitution is removed.
- Mixed-provider fixtures must prove that optional and additional execution dimensions do not collide.
- Current DeepSeek routes may still use family, version, variant, effort, and release metadata as declared match evidence, but those fields are not an industry-wide key.
- ADR-010 remains the historical source for why Benchmark admission was removed; ADR-011 is the current post-MVP routing-identity decision.
- ADR-001, ADR-003, ADR-004, ADR-005, ADR-007, and ADR-009 remain in force for their authority, documentation, recovery, delegation, and effect-safety boundaries.
