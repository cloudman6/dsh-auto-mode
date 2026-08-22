# AA Evidence Pack maintenance

[简体中文](zh-CN/aa-snapshot-maintenance.md)

## Boundary

`aa-evidence-pack-refresh/v1` is a maintainer-only, offline workflow. Runtime loads one local compatible Evidence Pack, derives an Active Catalog from current Host routes, and never calls Artificial Analysis while routing a task.

The official Pro endpoint remains pinned because the Free endpoint omits the blended-price field required by `aa-route-policy/v1`. Acquisition fixes `https://artificialanalysis.ai/api/v2/language/models`, `prompt_type=medium`, and every pagination page. `AA_API_KEY` is read only from the server-side environment and never enters the acquisition artifact, Evidence Pack, stdout, browser, or Git.

Real machine-readable AA metrics remain `internal-only`. Public distribution still requires an externally auditable written grant covering both machine-readable distribution and this model-selection product. The new packaging and automatic-update mechanics do not grant or bypass those rights.

## Artifact model

One Evidence Pack contains:

- `aa-snapshot/v2`: every policy-eligible record from the complete pinned acquisition, minimized to stable identity, display metadata, capability, price, latency, and source facts;
- `aa-binding-registry/v1`: provider normalization rules and durable exact EvidenceRouteKey-to-record bindings;
- `aa-route-policy/v1`: field choices, methodology, bands, missing-data behavior, and ordering;
- `aa-evidence-pack-manifest/v1`: component digests, `aa-evidence-pack-runtime/v1` compatibility, and rights mode.

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

Fetch the complete acquisition with the existing bounded command:

```bash
npm run aa:snapshot -- fetch \
  --private-root local \
  --output local/aa-acquisition.json
```

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

- `GREEN`: stable-ID-preserving metric/display changes, unbound record additions/removals, and ordinary execution-only changes. The candidate is automatically applicable.
- `AMBER`: missing bound records, incomplete eligible rows, unbound current Host routes, or normalization exceptions. The valid Pack advances while affected bindings/routes are quarantined or excluded. No unrelated route is blocked.
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

The legacy `seed` and `seedPath` inputs remain readable for migration and historical compatibility. New installations should use the Evidence Pack path. Runtime rejects an incompatible or tampered Pack before assessment or user-task dispatch.

## Verification

```bash
npm test
DSH_FORK_ROOT="$HOME/deepseek-harness/.worktrees/auto-mode-host-contracts/workspace" \
  node --test test/dsh-loader.test.mjs
```

The suite covers full-page retention, incomplete exclusions, stable-ID collisions, deterministic serialization, component tampering, EvidenceRouteKey separation, dormant activation, quarantine, price-first ordering, GREEN/AMBER/RED classification, atomic apply, rollback, migration, Loader composition, cold Session reconstruction, effective-request equality, UI projection compatibility, and Manual non-interference.
