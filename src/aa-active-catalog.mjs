import { createHostRouteIdentity } from './aa-evidence-binding.mjs'
import { AA_BINDING_REGISTRY_VERSION } from './aa-evidence-pack.mjs'
import { normalizeAAEvidencePackForRuntime } from './aa-evidence-pack-migration.mjs'
import {
  createEvidenceRouteKey,
  evidenceRouteKeyId,
  EvidenceRouteKeyError,
} from './evidence-route-key.mjs'

export const AA_ACTIVE_CATALOG_SCHEMA_VERSION = 1
export const AA_ACTIVE_CATALOG_VERSION = 'aa-active-catalog/v1'

export class AAActiveCatalogError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'AAActiveCatalogError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AAActiveCatalogError(code, message)
}

function freezeTree(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

function compareText(left, right) {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function cloneJson(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    invalid('host-route-invalid', 'Host route must be JSON serializable')
  }
}

function exclusionSortKey(value) {
  return `${value.hostRouteId ?? ''}\0${value.evidenceRouteKeyId ?? ''}\0${value.reasonCode}`
}

/**
 * Derive the runtime Active Catalog from one compatible pack and the current
 * Host-materialized routes. No AA access or fuzzy identity inference occurs.
 */
export function compileActiveAACatalog({ evidencePack, hostRoutes } = {}) {
  const compatiblePack = normalizeAAEvidencePackForRuntime(evidencePack)
  if (!Array.isArray(hostRoutes)) invalid('aa-active-catalog-invalid', 'hostRoutes must be an array')

  const registry = compatiblePack.bindingRegistry
  const snapshot = compatiblePack.snapshot
  const records = new Map(snapshot.records.map(record => [record.recordId, record]))
  const bindings = new Map()
  for (const binding of registry.bindings) {
    bindings.set(evidenceRouteKeyId(binding.evidenceRouteKey), binding)
  }
  const activeKeys = new Set()
  const entries = []
  const exclusions = []
  const executionRouteIds = new Set()

  for (const effectiveConfig of hostRoutes) {
    let hostRoute
    try {
      hostRoute = createHostRouteIdentity(effectiveConfig)
    } catch (error) {
      exclusions.push({ source: 'host-route', reasonCode: error.code ?? 'host-route-invalid' })
      continue
    }
    if (executionRouteIds.has(hostRoute.routeId)) {
      exclusions.push({
        source: 'host-route',
        hostRouteId: hostRoute.routeId,
        reasonCode: 'host-route-duplicate',
      })
      continue
    }
    executionRouteIds.add(hostRoute.routeId)
    const rules = registry.normalizationRules.filter(rule => rule.providerIds.includes(hostRoute.provider))
    if (rules.length !== 1) {
      exclusions.push({
        source: 'host-route',
        hostRouteId: hostRoute.routeId,
        reasonCode: rules.length === 0 ? 'evidence-route-rule-missing' : 'evidence-route-rule-ambiguous',
      })
      continue
    }
    let evidenceRouteKey
    let keyId
    try {
      evidenceRouteKey = createEvidenceRouteKey(effectiveConfig, rules[0])
      keyId = evidenceRouteKeyId(evidenceRouteKey)
    } catch (error) {
      if (!(error instanceof EvidenceRouteKeyError)) throw error
      exclusions.push({
        source: 'host-route',
        hostRouteId: hostRoute.routeId,
        reasonCode: error.code,
      })
      continue
    }
    const binding = bindings.get(keyId)
    if (binding === undefined) {
      exclusions.push({
        source: 'host-route',
        hostRouteId: hostRoute.routeId,
        evidenceRouteKeyId: keyId,
        reasonCode: 'aa-binding-missing',
      })
      continue
    }
    activeKeys.add(keyId)
    if (binding.quarantine !== null) {
      exclusions.push({
        source: 'host-route',
        hostRouteId: hostRoute.routeId,
        evidenceRouteKeyId: keyId,
        aaRecordId: binding.aaRecordId,
        reasonCode: 'aa-binding-quarantined',
        quarantineReasonCode: binding.quarantine.reasonCode,
      })
      continue
    }
    const aaRecord = records.get(binding.aaRecordId)
    if (aaRecord === undefined) {
      exclusions.push({
        source: 'host-route',
        hostRouteId: hostRoute.routeId,
        evidenceRouteKeyId: keyId,
        aaRecordId: binding.aaRecordId,
        reasonCode: 'aa-binding-record-missing',
      })
      continue
    }
    entries.push({
      routeId: hostRoute.routeId,
      provider: hostRoute.provider,
      model: hostRoute.model,
      effectiveConfig: cloneJson(effectiveConfig),
      hostRoute,
      effectiveConfigFingerprint: hostRoute.effectiveConfigFingerprint,
      executionFingerprint: hostRoute.effectiveConfigFingerprint,
      evidenceRouteKey,
      evidenceRouteKeyId: keyId,
      aaSnapshotId: snapshot.snapshotId,
      aaRecordId: binding.aaRecordId,
      bindingVersion: registry.registryVersion,
      bindingRegistryVersion: registry.registryVersion,
      manifestVersion: compatiblePack.manifest.manifestVersion,
      evidenceBinding: binding,
      aaRecord,
    })
  }

  entries.sort((left, right) => compareText(left.routeId, right.routeId))
  exclusions.sort((left, right) => compareText(exclusionSortKey(left), exclusionSortKey(right)))
  const bindingStates = registry.bindings.map(binding => {
    const keyId = evidenceRouteKeyId(binding.evidenceRouteKey)
    const missingRecord = !records.has(binding.aaRecordId)
    const quarantined = binding.quarantine !== null || missingRecord
    return {
      evidenceRouteKeyId: keyId,
      aaRecordId: binding.aaRecordId,
      status: quarantined ? 'quarantined' : activeKeys.has(keyId) ? 'active' : 'dormant',
      ...(binding.quarantine !== null
        ? { quarantineReasonCode: binding.quarantine.reasonCode }
        : missingRecord ? { quarantineReasonCode: 'aa-binding-record-missing' } : {}),
    }
  }).sort((left, right) => compareText(left.evidenceRouteKeyId, right.evidenceRouteKeyId))

  return freezeTree({
    schemaVersion: AA_ACTIVE_CATALOG_SCHEMA_VERSION,
    catalogVersion: AA_ACTIVE_CATALOG_VERSION,
    packId: compatiblePack.manifest.packId,
    manifestVersion: compatiblePack.manifest.manifestVersion,
    aaSnapshotId: snapshot.snapshotId,
    bindingVersion: AA_BINDING_REGISTRY_VERSION,
    bindingRegistryVersion: registry.registryVersion,
    routePolicyVersion: compatiblePack.routePolicy.policyVersion,
    entries,
    bindingStates,
    exclusions,
  })
}
