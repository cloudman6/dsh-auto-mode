# ADR-014: Separate AA evidence packs from runtime active catalogs

[简体中文](../zh-CN/decisions/0014-separate-aa-evidence-packs-from-active-catalogs.md)

## Status

Proposed

If accepted, this decision supersedes only ADR-011's full-effective-configuration binding key and snapshot-scoped binding contract, plus ADR-013's current-Host-only minimization and mandatory human approval for every valid metric refresh. ADR-011's separation of execution and evidence identity, and ADR-013's acquisition, rights, credential, validation, atomicity, and rollback boundaries, remain in force.

## Date

2026-08-22

## Context

The completed catalog binds one complete Host effective-configuration fingerprint to one AA record in one snapshot. The completed refresh workflow then retains only records referenced by bindings for the current Host inventory. That is auditable, but it makes ordinary execution-only defaults part of evidence identity and prevents a reviewed mapping from remaining dormant until a user later adds the corresponding provider/model/reasoning route.

An AA metric refresh and a Host execution-config change are different events. A score, price, latency, or display-name update should not require rebuilding stable route mappings. Likewise, changing `maxTokens`, `temperature`, or another execution-only default must remain visible in request audit without invalidating evidence for the same evaluated model configuration. Conversely, a different model, reasoning mode, dated variant, or other control that changes which AA record applies must never inherit evidence merely because its display name is similar.

The runtime also must not require human intervention after every normal AA update. Human review remains necessary for semantic exceptions, rights changes, methodology changes, and ambiguous new mappings, but a deterministic metric-only refresh should update valid evidence automatically while preserving rollback.

## Decision

Package maintained AA evidence as one versioned **Evidence Pack** with four independently versioned parts:

1. An **AA Snapshot** containing every policy-eligible record from the pinned acquisition, minimized to stable identity, display metadata, capability, price, latency, and source-policy fields consumed by the product.
2. A long-lived **Binding Registry** mapping an exact `EvidenceRouteKey` to one stable AA record ID. A binding does not cite one snapshot ID and may remain dormant when no current Host route uses it.
3. The versioned **AA Route Policy** that defines eligibility fields, methodology, Light/Standard/Deep boundaries, missing-data behavior, and price/latency ordering.
4. An **Evidence Pack Manifest** that binds component versions and digests to a compatible Runtime contract and the applicable rights mode.

### Evidence identity and execution identity

An `EvidenceRouteKey` is a canonical, provider-scoped identity for the request dimensions that determine which AA evaluated record applies:

```ts
interface EvidenceRouteKey {
  schemaVersion: 1
  providerNamespace: string
  modelKey: string
  evidenceControls: Readonly<Record<string, string | number | boolean>>
}
```

`providerNamespace` and `modelKey` come from a versioned provider normalization rule. `evidenceControls` contains only controls that distinguish AA evaluation records for that provider, such as reasoning mode, dated model variant, or another explicitly declared evaluated configuration. No control is universally mandatory across providers. Keys use canonical field ordering and exact equality; runtime fuzzy matching remains forbidden.

The existing complete `ExecutionFingerprint` continues to cover every Host-materialized request option and remains authoritative for assembly/request equality, Session audit, cold reconstruction, capability validation, and Manual equality. Execution-only controls such as temperature, token limits, stop sequences, credential references, and transport defaults do not enter an `EvidenceRouteKey` unless a versioned provider rule explicitly proves that the control selects a different AA evaluated record.

### Binding Registry

Each binding records its key, stable AA record ID, rule version, match basis, and limitations. Availability is derived rather than stored: a binding is active when a current materialized Host route produces the same key, dormant when none does, and quarantined when refresh validation detects a semantic integrity exception. A new Host route automatically becomes eligible when its exact key already has a valid binding and its AA record exists in the current compatible snapshot.

Provider normalization rules may create or confirm bindings automatically only from structured, versioned, uniquely matching identity fields. Names, slugs, similarity scores, discovery order, or a guessed latest record cannot create or replace a binding. An otherwise eligible AA record with no deterministic binding remains in the snapshot as unbound evidence and cannot enter the Active Catalog.

### Runtime Active Catalog

The **Active Catalog** is never a maintained publication artifact. Runtime deterministically derives it from:

```text
current Host-materialized routes
  intersection exact Binding Registry keys
  intersection current compatible AA Snapshot records
  filtered and ordered by the current AA Route Policy
```

For every active entry, Runtime retains both the evidence key and the complete execution fingerprint. Missing, malformed, unbound, quarantined, incompatible, or Host-invalid routes receive stable exclusions without invalidating unrelated routes. Runtime never calls AA.

### Exception-driven refresh

Refresh classifies a prepared update before publication:

- **GREEN**: metric changes, stable-ID-preserving display changes, unbound record additions/removals, dormant/active transitions, and execution-only Host changes. A fully valid GREEN update may apply automatically and atomically.
- **AMBER**: a bound record disappears, a new route lacks a binding, or one record cannot be normalized uniquely. Valid snapshot and registry content may advance, but the affected record or binding is isolated and reported as unbound or quarantined.
- **RED**: source schema, pinned methodology, terms/rights contract, stable-ID integrity, manifest compatibility, or digest validation changes unexpectedly. The update is rejected and the previous valid Evidence Pack remains active.

The updater produces deterministic component and Active Catalog impact reports for every class. Automatic application never grants distribution rights, silently changes a binding's stable AA record, or weakens a RED condition.

### Packaging and distribution

Runtime and Evidence Pack have independent versions but one compatibility contract. An installer may present one update action, but it must validate the complete compatible pair before atomic activation and retain the previous valid pair for rollback. Metric-only AA changes therefore update the Evidence Pack without requiring a Runtime release.

Real AA records remain `internal-only` unless the written-license gate from ADR-013 is satisfied. A public Runtime artifact must not embed, fetch around, or otherwise bypass that gate. Credentials, raw acquisitions, review material, rollback envelopes, and grant documents remain outside the browser client and public package.

## Alternatives considered

### Keep bindings scoped to one complete effective configuration

Rejected. It makes unrelated execution defaults invalidate reusable evidence and prevents dormant mappings from activating for a later Host configuration.

### Put all AA records and bindings in one generated catalog

Rejected. It couples stable mappings to volatile metrics and current Host availability, so every refresh rewrites concepts that did not change.

### Automatically bind every AA record by model name or slug

Rejected. Presentation metadata is not a stable cross-namespace identity and cannot prove which provider request configuration AA evaluated.

### Require human approval for every refresh digest

Rejected for structurally valid GREEN changes. Mandatory routine approval does not add semantic evidence; deterministic classification, atomic replacement, retained reports, and rollback provide the relevant control. Human review remains for AMBER mapping decisions and RED contract changes.

### Query AA at runtime

Rejected. It preserves the availability, credential, latency, drift, and historical-reconstruction problems already rejected by ADR-013.

## Consequences

- Users can add a Host route after installation and receive automatic Auto eligibility when an exact dormant binding already exists.
- Ordinary AA score, price, latency, and stable-ID-preserving rename updates require no binding rewrite and no routine human approval.
- The project must maintain provider-specific normalization rules and cannot promise automatic support where providers or AA expose no reliable common identity.
- Existing schema-v1 catalog seeds require an explicit migration path; legacy Sessions retain their frozen evidence and execution facts.
- Snapshot growth is bounded by policy eligibility and maintenance file limits rather than current Host inventory.
- Public distribution of real Evidence Packs remains blocked without the ADR-013 written grant, even when the package is technically ready.
- Phase 5 adaptive execution should begin only after this catalog foundation is accepted and implemented, so escalation does not depend on obsolete binding identity.
