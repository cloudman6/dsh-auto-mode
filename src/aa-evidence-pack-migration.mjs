import { createHostRouteIdentity } from './aa-evidence-binding.mjs'
import {
  AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
  AA_PRICE_NORMALIZATION_VERSION,
  AA_SNAPSHOT_VERSION,
  buildAAEvidencePack,
  validateAAEvidencePack,
  validateLegacyAAEvidencePackV1,
} from './aa-evidence-pack.mjs'
import { AA_ROUTE_POLICY_V2 } from './aa-route-policy.mjs'
import {
  createEvidenceRouteKey,
  evidenceRouteKeyId,
} from './evidence-route-key.mjs'

export const AA_EVIDENCE_PACK_MIGRATION_VERSION = 'aa-evidence-pack-migration/v2'

export class AAEvidencePackMigrationError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'AAEvidencePackMigrationError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AAEvidencePackMigrationError(code, message)
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function freezeTree(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function migrateRecord(record) {
  const legacyPrice = record.pricing?.price_1m_blended_7_to_2_to_1
  return {
    recordId: record.recordId,
    label: record.label,
    slug: typeof record.slug === 'string' ? record.slug : null,
    creator: isRecord(record.creator)
      ? clone(record.creator)
      : { recordId: 'legacy-unknown', label: 'Legacy unknown creator' },
    releaseDate: typeof record.releaseDate === 'string' ? record.releaseDate : null,
    evaluations: clone(record.evaluations),
    pricing: {
      price_1m_normalized_7_to_2_to_1: legacyPrice,
      normalization: {
        version: AA_PRICE_NORMALIZATION_VERSION,
        basis: 'legacy-aa-blended',
      },
    },
    performance: {
      median_time_to_first_answer_token_seconds:
        record.performance?.median_time_to_first_answer_token_seconds ?? null,
    },
  }
}

function migrateTimestamp(value) {
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds)) {
    invalid('aa-migration-input-invalid', 'legacy snapshot capturedAt is invalid')
  }
  return new Date(milliseconds).toISOString()
}

/** Convert one reviewed schema-v1 catalog seed into the accepted reusable pack. */
export function migrateLegacyAACatalogSeed({
  seed,
  hostRoutes,
  normalizationRules,
  packId,
  source,
  rights,
} = {}) {
  if (!isRecord(seed) || seed.schemaVersion !== 1
    || seed.catalogVersion !== 'aa-evidence-catalog/v1'
    || seed.bindingVersion !== 'aa-evidence-binding/v1'
    || !isRecord(seed.snapshot) || !Array.isArray(seed.snapshot.records)
    || !Array.isArray(seed.bindings) || !Array.isArray(hostRoutes)
    || !Array.isArray(normalizationRules) || normalizationRules.length === 0) {
    invalid('aa-migration-input-invalid', 'migration requires one legacy catalog seed, Host routes, and normalization rules')
  }
  const routes = new Map()
  for (const effectiveConfig of hostRoutes) {
    const identity = createHostRouteIdentity(effectiveConfig)
    routes.set(identity.routeId, { identity, effectiveConfig })
  }
  const migratedByKey = new Map()
  let collapsedBindings = 0
  for (const binding of seed.bindings) {
    const route = routes.get(binding.hostRouteId)
    if (route === undefined) {
      invalid('aa-migration-host-route-missing', `legacy Host route ${binding.hostRouteId} is not materialized`)
    }
    if (binding.effectiveConfigFingerprint !== route.identity.effectiveConfigFingerprint
      || binding.aaSnapshotId !== seed.snapshot.snapshotId) {
      invalid('aa-migration-binding-invalid', 'legacy binding does not match its exact Host route and snapshot')
    }
    const rules = normalizationRules.filter(rule => rule.providerIds?.includes(route.identity.provider))
    if (rules.length !== 1) {
      invalid('aa-migration-rule-invalid', 'each legacy provider must have exactly one normalization rule')
    }
    const evidenceRouteKey = createEvidenceRouteKey(route.effectiveConfig, rules[0])
    const keyId = evidenceRouteKeyId(evidenceRouteKey)
    const migrated = {
      evidenceRouteKey,
      aaRecordId: binding.aaRecordId,
      ruleVersion: rules[0].ruleVersion,
      matchBasis: clone(binding.matchBasis),
      limitations: clone(binding.limitations),
      quarantine: null,
    }
    const previous = migratedByKey.get(keyId)
    if (previous !== undefined) {
      if (previous.aaRecordId !== migrated.aaRecordId) {
        invalid('aa-migration-binding-conflict', 'legacy execution routes collapse to conflicting evidence bindings')
      }
      collapsedBindings += 1
      continue
    }
    migratedByKey.set(keyId, migrated)
  }

  const snapshot = {
    schemaVersion: 1,
    snapshotVersion: AA_SNAPSHOT_VERSION,
    snapshotId: seed.snapshot.snapshotId,
    capturedAt: migrateTimestamp(seed.snapshot.source?.capturedAt),
    source: clone(source),
    rights: clone(rights),
    records: seed.snapshot.records.map(migrateRecord)
      .sort((left, right) => left.recordId.localeCompare(right.recordId)),
  }
  const evidencePack = buildAAEvidencePack({
    packId,
    snapshot,
    bindingRegistry: {
      schemaVersion: 1,
      registryVersion: 'aa-binding-registry/v1',
      normalizationRules: clone(normalizationRules),
      bindings: [...migratedByKey.values()].sort((left, right) => (
        evidenceRouteKeyId(left.evidenceRouteKey).localeCompare(evidenceRouteKeyId(right.evidenceRouteKey))
      )),
    },
    routePolicy: AA_ROUTE_POLICY_V2,
    runtimeCompatibility: {
      contract: AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
      minimumVersion: 2,
      maximumVersion: 2,
    },
    rights,
  })
  return freezeTree({
    schemaVersion: 1,
    migrationVersion: AA_EVIDENCE_PACK_MIGRATION_VERSION,
    sourceCatalogVersion: seed.catalogVersion,
    evidencePack,
    report: {
      migratedRecords: snapshot.records.length,
      migratedBindings: migratedByKey.size,
      collapsedBindings,
    },
  })
}

/** Adapt one validated v1 Pack without claiming its Pro blended price was Free-derived. */
export function migrateAAEvidencePackV1ToV2(pack) {
  validateLegacyAAEvidencePackV1(pack)
  const snapshot = {
    ...clone(pack.snapshot),
    snapshotVersion: AA_SNAPSHOT_VERSION,
    records: pack.snapshot.records.map(migrateRecord),
  }
  return validateAAEvidencePack(buildAAEvidencePack({
    packId: pack.manifest.packId,
    snapshot,
    bindingRegistry: clone(pack.bindingRegistry),
    routePolicy: AA_ROUTE_POLICY_V2,
    runtimeCompatibility: {
      contract: AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
      minimumVersion: 2,
      maximumVersion: 2,
    },
    rights: clone(pack.manifest.rights),
  }))
}

/** Return the current Pack generation, adapting only the one supported predecessor. */
export function normalizeAAEvidencePackForRuntime(pack) {
  if (pack?.snapshot?.snapshotVersion === AA_SNAPSHOT_VERSION) return validateAAEvidencePack(pack)
  return migrateAAEvidencePackV1ToV2(pack)
}
