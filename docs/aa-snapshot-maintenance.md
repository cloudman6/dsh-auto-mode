# AA snapshot maintenance

[简体中文](zh-CN/aa-snapshot-maintenance.md)

## Status and boundary

This maintainer-only workflow implements `aa-snapshot-refresh/v1` outside the DSH runtime request path. Auto continues to read one frozen local seed and never calls Artificial Analysis while routing a user task.

The adapter uses the official Pro language-model endpoint because the Free endpoint omits the blended-price field required by `aa-route-policy/v1`. It fixes the endpoint to `https://artificialanalysis.ai/api/v2/language/models`, sets `prompt_type=medium`, reads `AA_API_KEY` only from the server-side environment, and follows the documented page envelope. Stable AA model and creator IDs remain the binding keys; names and slugs are display data only.

Official references:

- [Artificial Analysis Data API documentation](https://artificialanalysis.ai/data-api/docs)
- [Artificial Analysis Data API plans](https://artificialanalysis.ai/data-api)
- [Artificial Analysis Terms of Use](https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf)
- [Artificial Analysis Data Platform Terms v1.1](https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf)

This document records an engineering control, not legal advice. Under the reviewed Data Platform Terms v1.1, real raw or structured machine-readable AA data must not be redistributed, and a third-party product whose primary purpose includes model or provider selection requires prior written consent. Maintainer authorization to use the API is not that consent.

The default rights mode is therefore `internal-only`. Real acquisitions, candidate snapshots, active seeds, rollback seeds, credentials, and grant documents stay under the Git-ignored `local/` directory and out of the browser client. `written-license` mode additionally requires an external grant reference plus explicit assertions that the grant covers machine-readable distribution and an AA-informed model-selection product. The grant itself must not enter Git.

Keep a raw acquisition only for the shortest period needed to review and reproduce its candidate. The current terms require every copy of raw Data and raw Data files to be deleted within 30 days after the applicable subscription ends. Conservatively treat acquisitions and any local export that retains individually identifiable AA metrics as raw Data unless a written AA grant states otherwise; the deadline applies even if a local seed is still operationally useful. Deletion is a deliberate maintainer action because the tool does not guess subscription state or remove local evidence automatically.

## Private files

Create a private directory before the first refresh:

```sh
mkdir -p local
chmod 700 local
cp examples/aa-refresh-manifest.example.json local/aa-refresh-manifest.json
cp examples/aa-binding-plan.example.json local/aa-binding-plan.json
cp examples/host-routes.example.json local/host-routes.json
```

Replace every placeholder. `host-routes.json` is the exact current Host-materialized route inventory. Each binding must use the route ID and effective-configuration fingerprint derived from that exact configuration and must point to one stable AA record ID. A different effort or any other material request control is a different Host route and cannot reuse the binding silently.

All CLI inputs and outputs must be inside `--private-root`. Target parents must already exist. Symlink targets, out-of-root paths, files larger than 16 MiB, excessive JSON depth or node counts, malformed JSON, duplicate options, and unknown options fail closed. Private outputs are atomically replaced with mode `0600`.

## Refresh sequence

### 1. Acquire

Load the API key into the process environment without putting it in a command argument or repository file, then fetch the fixed paginated endpoint:

```sh
npm run aa:snapshot -- fetch \
  --private-root local \
  --output local/aa-acquisition.json
```

The request rejects redirects, non-JSON or non-200 responses, pages over 16 MiB, excessive JSON depth or node counts, more than 100 pages, malformed pagination, and non-Pro/non-Commercial tiers. Errors do not include the key or response body.

### 2. Prepare without mutation

Set a new unique `snapshotId` in the manifest and review the current Host routes and binding plan. Then prepare a candidate:

```sh
npm run aa:snapshot -- prepare \
  --private-root local \
  --acquisition local/aa-acquisition.json \
  --manifest local/aa-refresh-manifest.json \
  --binding-plan local/aa-binding-plan.json \
  --host-routes local/host-routes.json \
  --current local/aa-catalog-seed.json \
  --candidate local/aa-candidate.json
```

Preparation pins the reviewed terms, attribution, API Intelligence Index version, full `v4.1.1` capability methodology, freshness limit, and rights mode. It copies only bound records and only stable identity, display metadata, Intelligence Index, 7:2:1 blended price, and median time to first answer token. A missing or incomplete bound record rejects the whole candidate. An incomplete unbound source record is omitted.

For identical acquisition, manifest, binding plan, Host routes, and predecessor seed, preparation produces the same candidate digest. The current wall clock is used only to enforce freshness and does not enter the digest.

### 3. Review

The prepare command prints the candidate digest and a structured report. Review both the stdout report and `local/aa-candidate.json`. The report covers:

- record additions, removals, renames, and metric changes;
- binding additions, removals, and stable-record replacements;
- Light/Standard/Deep band changes;
- price/latency/stable-route ordering before and after the update.

Do not approve a change whose Host identity, stable AA record, score methodology, price field, latency field, rights basis, or resulting ordering is not understood. Preparation never changes the active seed.

### 4. Apply the reviewed digest

Copy the exact `sha256:...` digest from the reviewed output:

```sh
npm run aa:snapshot -- apply \
  --private-root local \
  --candidate local/aa-candidate.json \
  --current local/aa-catalog-seed.json \
  --rollback local/aa-catalog-seed.previous.json \
  --approve sha256:replace-with-reviewed-digest
```

Apply revalidates the candidate and digest, verifies that the active seed is still the exact reviewed predecessor, atomically saves that predecessor and its deterministic digest in a versioned rollback envelope, and atomically replaces the active seed. A stale predecessor, altered candidate, wrong digest, or invalid seed leaves the active seed unchanged.

### 5. Roll back

If post-apply validation fails, restore the saved seed:

```sh
npm run aa:snapshot -- rollback \
  --private-root local \
  --current local/aa-catalog-seed.json \
  --rollback local/aa-catalog-seed.previous.json
```

Rollback validates the envelope and saved-seed digest, then atomically restores the seed without deleting the rollback copy. A malformed or checksum-mismatched rollback file leaves the active seed unchanged. Re-run the catalog, policy, plugin, Session, and UI checks before treating either an applied or restored seed as usable.

## Version and schema stops

The refresh intentionally stops when the AA endpoint, tier, pagination, Intelligence Index version, required policy fields, terms version, attribution, or rights assertions change. Such a stop requires source review and a new versioned decision; it must not be bypassed by editing fetched data or weakening validation.

Only synthetic AA-shaped fixtures and placeholder examples belong in Git. Before any commit, inspect staged files for real AA data, `AA_API_KEY`, `.env` files, license grants, account data, and raw responses.
