# AA Evidence Pack maintenance

[简体中文](zh-CN/aa-snapshot-maintenance.md)

## Boundary

`aa-evidence-pack-refresh/v1` is a maintainer-only, offline workflow. Runtime loads one local compatible Evidence Pack, derives an Active Catalog from current Host routes, and never calls Artificial Analysis while routing a task.

`aa-api-acquisition/v2` pins the official `https://artificialanalysis.ai/api/v2/language/models/free` response and every pagination page. Free, Pro, and Commercial keys may return this shape; no Pro-only query or field is required. `AA_API_KEY` is read only from the server-side environment and never enters the acquisition artifact, Evidence Pack, stdout, browser, or Git.

Real machine-readable AA metrics remain `internal-only`. Public distribution still requires an externally auditable written grant covering both machine-readable distribution and this model-selection product. The new packaging and automatic-update mechanics do not grant or bypass those rights.

## Artifact model

One Evidence Pack contains:

- `aa-snapshot/v3`: every policy-eligible record from the complete Free-shaped acquisition, minimized to stable identity, display metadata, Intelligence, raw input/output/cache-hit prices, cache substitution basis, normalized price, nullable latency, and source facts;
- `aa-binding-registry/v1`: provider normalization rules, optional stable-ID `aaRecordMappings`, and durable exact EvidenceRouteKey-to-record bindings;
- `aa-route-policy/v2`: field choices, methodology, bands, missing-data behavior, `aa-price-normalization/v1`, and ordering;
- `aa-evidence-pack-manifest/v1`: component digests, `aa-evidence-pack-runtime/v2` compatibility, and rights mode.

The normalized price is `(7 × effective cache-hit price + 2 × input price + output price) / 10`. `effective cache-hit price` is the AA-reported cache-hit price when present, including zero; otherwise it is the input price. Records missing Intelligence, input price, or output price are isolated. Missing latency remains nullable and sorts after measured latency for an equal normalized price.

The Active Catalog is not stored. Runtime deterministically recompiles it from the installed Pack and current Host-materialized routes. A binding is shown as active, dormant, or quarantined according to current facts.

All private inputs and outputs must remain under one existing Git-ignored root such as `local/`. The file boundary rejects symlinks and out-of-root paths, limits JSON size and complexity, writes mode `0600`, checks component and predecessor digests, atomically replaces the active Pack, and retains one validated rollback artifact.

## One-time migration

Prepare private JSON files containing the legacy seed, its exact Host routes, provider normalization rules, source facts, and `{ "mode": "internal-only" }` rights. Then run:

```bash
npm run aa:evidence-pack -- migrate \
  --private-root local \
  --seed local/aa-catalog-seed.json \
  --host-routes local/host-routes.json \
  --rules local/provider-normalization-rules.json \
  --source local/aa-source.json \
  --rights local/aa-rights.json \
  --pack-id aa-pack-migrated-v1 \
  --output local/aa-evidence-pack.json
```

Migration requires every legacy full-configuration binding to match an exact supplied Host route. It derives the narrower key through exactly one provider rule. Two legacy routes may collapse only when they cite the same AA record; conflicting collapsed keys fail closed. Existing Sessions are not rewritten and retain their original frozen facts.

## Refresh

Load the user-owned key into the current shell without printing it, then fetch the complete Free response with the bounded Evidence Pack command:

```bash
AA_API_KEY="$(sed -n 's/^AA_API_KEY=//p' .env.local)"
export AA_API_KEY

npm run aa:evidence-pack -- fetch \
  --private-root local \
  --output local/aa-acquisition.json
```

The command emits only `capturedAt`, page count, and status. Keep `.env.local`, acquisition data, prepared reports, active Packs, and rollback artifacts under ignored private paths with mode `0600`.

The source file used for a new Free Pack records methodology `v4.1.1`, attribution `Source: Artificial Analysis (artificialanalysis.ai)`, and the reviewed general Terms of Use version `1.0`, revised `2024-04-28`, at `https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf`. The rights file remains `{ "mode": "internal-only" }` unless the ADR-013 written grant is independently satisfied.

Prepare a new Pack:

```bash
npm run aa:evidence-pack -- prepare \
  --private-root local \
  --current local/aa-evidence-pack.json \
  --acquisition local/aa-acquisition.json \
  --source local/aa-source.json \
  --rights local/aa-rights.json \
  --host-routes local/host-routes.json \
  --snapshot-id aa-snapshot-YYYY-MM-DD \
  --pack-id aa-pack-YYYY-MM-DD \
  --output local/aa-evidence-pack.prepared.json
```

Preparation emits only classification and status on stdout; the metric and impact report remains inside the private prepared file.

Before classification, `aa-binding-candidate-compiler/v1` processes every explicit `aaRecordMappings` declaration independently of current Host routes. If the named stable AA record exists and the exact EvidenceRouteKey is free, refresh adds a durable dormant-capable binding automatically. An identical binding is reused. Missing records, cross-rule ambiguity, and conflicts with an existing binding are reported and isolated; they never replace evidence. Names, slugs, similarity, discovery order, and latest-record guesses are not candidate inputs. Routine AA refresh therefore requires no user action, while a genuinely new provider/AA identity relationship still requires a reviewed exact rule declaration rather than unsafe inference.

- `GREEN`: stable-ID-preserving metric/display changes, unbound record additions/removals, exact structured binding generation, and ordinary execution-only changes. The candidate is automatically applicable.
- `AMBER`: missing bound or declared records, conflicting/ambiguous candidate declarations, incomplete eligible rows, unbound current Host routes, or normalization exceptions. The valid Pack advances while affected bindings/routes are quarantined or excluded. No unrelated route is blocked.
- `RED`: methodology, source schema, rights, stable-ID, compatibility, or digest contract changes. No candidate Pack is produced and apply is impossible.

Apply a valid GREEN or isolated AMBER update without an approval token:

```bash
npm run aa:evidence-pack -- apply \
  --private-root local \
  --prepared local/aa-evidence-pack.prepared.json \
  --current local/aa-evidence-pack.json \
  --rollback local/aa-evidence-pack.previous.json
```

Apply revalidates the prepared digest, every component digest, Runtime compatibility, rights equality, and the exact predecessor before writing rollback and active files. A stale or tampered update leaves the active Pack unchanged.

Restore the retained predecessor:

```bash
npm run aa:evidence-pack -- rollback \
  --private-root local \
  --current local/aa-evidence-pack.json \
  --rollback local/aa-evidence-pack.previous.json
```

## Runtime configuration

Use either an inline `evidencePack` or a private path:

```yaml
mode: auto
evidencePackPath: ./local/aa-evidence-pack.json
```

The legacy `seed` and `seedPath` inputs remain readable for migration and historical compatibility. A valid runtime-v1 Pack is strictly validated and deterministically adapted to Snapshot v3 / Route Policy v2 with `legacy-aa-blended` provenance; no component price is invented. New installations should use the Evidence Pack path. Runtime rejects any other incompatible or tampered Pack before assessment or user-task dispatch.

## Verification

```bash
npm test
DSH_FORK_ROOT="$HOME/deepseek-harness/.worktrees/auto-mode-host-contracts/workspace" \
  node --test test/dsh-loader.test.mjs
```

The suite covers Free pagination and tiers, bounded untrusted responses, credential redaction, full-page retention, incomplete exclusions, exact price derivation and cache fallback, stable-ID collisions, deterministic serialization, component tampering, EvidenceRouteKey separation, dormant activation, quarantine, normalized-price-first ordering, GREEN/AMBER/RED classification, atomic apply, rollback, v1-to-v2 migration, Loader composition, cold Session reconstruction, effective-request equality, UI projection compatibility, and Manual non-interference.
