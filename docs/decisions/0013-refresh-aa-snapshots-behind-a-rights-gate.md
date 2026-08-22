# ADR-013: Refresh AA snapshots behind an explicit rights gate

[简体中文](../zh-CN/decisions/0013-refresh-aa-snapshots-behind-a-rights-gate.md)

## Status

Proposed

## Date

2026-08-22

## Context

Auto Mode needs current Artificial Analysis capability, price, and latency facts without making the request path depend on a live remote service. Manual transcription is not reproducible, cannot reliably expose record renames or binding changes, and makes it too easy for malformed data to replace the last valid local catalog.

Artificial Analysis now publishes a versioned Data API. Its official documentation identifies model and creator IDs as stable integration keys, requires API keys to remain server-side, and exposes the language-model data needed by the current policy through the Pro endpoint. The Free endpoint omits the blended-price field used by `aa-route-policy/v1`. The acquisition request therefore has to pin the Pro language-model endpoint and the performance prompt type instead of relying on undocumented page data or screenshots.

Data access does not imply redistribution rights. Artificial Analysis Data Platform Terms version 1.1, revised 2026-08-19, prohibit redistribution of raw or structured machine-readable Data and require prior written consent for products made available to third parties whose primary purpose includes model or provider selection guidance. Those restrictions apply directly to an AA-informed Auto router. Maintainer authorization to integrate the API cannot substitute for Artificial Analysis's written permission.

Official sources reviewed for this decision:

- https://artificialanalysis.ai/data-api/docs
- https://artificialanalysis.ai/data-api
- https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf
- https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf

## Decision

Implement `aa-snapshot-refresh/v1` as a maintainer-run, offline publication workflow. It is not part of the DSH runtime request path.

The supported acquisition adapter calls only `https://artificialanalysis.ai/api/v2/language/models` over HTTPS with `prompt_type=medium`, follows the documented pagination envelope, and reads the API key only from `AA_API_KEY`. It rejects redirects, oversized responses, unexpected tiers, malformed pagination, duplicate stable IDs, and missing policy fields. Raw responses and credentials remain under the Git-ignored local workspace and never enter the browser client.

Every refresh uses an explicit manifest that pins the source endpoint, API index version, full capability-methodology version, capture time, maximum age, terms version, attribution, and one of two rights modes. Its snapshot ID must differ from the predecessor; maintainers remain responsible for uniqueness across older history:

- `internal-only`: the default. Generated snapshots remain local and must not be redistributed.
- `written-license`: requires an auditable external grant reference that explicitly covers both machine-readable distribution and an AA-informed model-selection product. The grant itself remains outside Git.

The tool does not claim that a grant reference proves legal sufficiency. It records the maintainer's asserted basis and fails closed when the required scope is absent.

Candidate snapshots contain only stable AA records referenced by the reviewed binding plan and only the fields consumed by current policy: stable record identity, display metadata, the pinned Intelligence Index score, the pinned blended price, and median time to first answer token. Names and slugs never replace stable IDs. An incomplete bound record invalidates the candidate; incomplete unbound source records are not copied.

Preparation is deterministic for the same acquisition bundle, manifest, binding plan, Host routes, and previous seed. It produces a content digest plus a review report covering source-policy metadata before and after, record additions, removals, renames, metric changes, binding additions, removals and replacements, capability-band moves, and per-band ordering changes. Preparation never mutates the active seed.

Applying a candidate requires the exact digest shown in the review report and verifies that the active seed still matches the candidate's recorded predecessor. The file workflow validates the candidate again, writes the previous valid seed plus its deterministic digest to a versioned rollback envelope, and atomically replaces the active seed. Rollback verifies the envelope and seed digest before atomically restoring the seed. Interrupted, rejected, or checksum-invalid updates leave the prior active seed usable.

Synthetic offline fixtures are the only AA-shaped dataset committed to Git. No real AA snapshot, raw API response, credential, or confidential license grant is committed or bundled into the DSH browser client.

## Alternatives considered

### Query AA during every Auto decision

Rejected. It adds availability, latency, credential, rate-limit, and upstream-drift dependencies to the routing path and makes historical decisions harder to reconstruct.

### Commit a minimized real AA snapshot because it contains fewer fields

Rejected without written permission. Individually identifiable scores, prices, and latency values remain structured Data under the current terms even after field minimization.

### Scrape public pages without an API key

Rejected. The website terms restrict automated scraping, and page presentation is not a stable machine contract.

### Automatically follow names, slugs, or replacement records

Rejected. Names and slugs can change, and a new record is not evidence-equivalent until the binding replacement is explicitly reviewed.

### Replace the current seed immediately after fetching

Rejected. Acquisition, review, approval, and publication are separate state transitions; a remote or malformed response cannot own the active catalog.

## Consequences

- Auto remains runnable from a frozen local seed with no live AA dependency.
- Maintainers can reproduce and audit refreshes without committing raw source data.
- Public distribution of real AA metrics remains blocked until an external written grant covers this product and the intended machine-readable distribution.
- A Pro or Commercial API entitlement is required for the blended-price field used by the current policy; the Free endpoint is insufficient.
- Every binding and band change becomes explicit before publication, and the previous valid seed remains recoverable.
- Terms and API schema changes intentionally stop the refresh workflow until the manifest and adapter are reviewed.
