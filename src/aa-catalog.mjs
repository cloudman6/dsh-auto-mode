import { readFileSync } from 'node:fs'

import {
  AA_EVIDENCE_BINDING_VERSION,
  AAEvidenceBindingError,
  createHostRouteIdentity,
  resolveAAEvidenceBinding,
} from './aa-evidence-binding.mjs'

export const AA_EVIDENCE_CATALOG_SCHEMA_VERSION = 1
export const AA_EVIDENCE_CATALOG_VERSION = 'aa-evidence-catalog/v1'
const AA_CATALOG_SEED_MAX_BYTES = 1024 * 1024

export class AACatalogError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'AACatalogError'
    this.code = code
  }
}

function invalidCatalog(message) {
  throw new AACatalogError('aa-catalog-invalid', message)
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

function cloneEffectiveConfig(value) {
  return freezeTree(JSON.parse(JSON.stringify(value)))
}

function capabilityFactsOf(aaRecord) {
  const facts = aaRecord.capabilityFacts
  if (!Array.isArray(facts) || facts.length === 0
    || facts.some(fact => typeof fact !== 'string' || fact.trim() === '')
    || new Set(facts).size !== facts.length) {
    throw new AACatalogError(
      'aa-capability-facts-invalid',
      `AA record ${aaRecord.recordId} must contain distinct non-empty capability facts`,
    )
  }
  return facts
}

function compareText(left, right) {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function compareEntries(left, right) {
  return compareText(left.routeId, right.routeId)
}

function compareExclusions(left, right) {
  return compareText(
    `${left.source}\u0000${left.hostRouteId ?? ''}\u0000${left.bindingIndex ?? ''}\u0000${left.reasonCode}`,
    `${right.source}\u0000${right.hostRouteId ?? ''}\u0000${right.bindingIndex ?? ''}\u0000${right.reasonCode}`,
  )
}

function partitionBindings(bindings, hostRouteIds) {
  const eligible = []
  const exclusions = []
  for (let bindingIndex = 0; bindingIndex < bindings.length; bindingIndex += 1) {
    const binding = bindings[bindingIndex]
    const descriptor = isRecord(binding)
      ? Object.getOwnPropertyDescriptor(binding, 'hostRouteId')
      : undefined
    if (descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value')
      || typeof descriptor.value !== 'string' || descriptor.value.trim() === '') {
      exclusions.push(Object.freeze({
        source: 'binding',
        bindingIndex,
        reasonCode: 'aa-binding-invalid',
      }))
      continue
    }
    if (!hostRouteIds.has(descriptor.value)) {
      exclusions.push(Object.freeze({
        source: 'binding',
        hostRouteId: descriptor.value,
        reasonCode: 'aa-binding-host-route-missing',
      }))
      continue
    }
    eligible.push(binding)
  }
  return { eligible, exclusions }
}

/**
 * Compile one Git-ignored AA seed against the current Host route inventory.
 * This evidence catalog does not assign handling levels or select comparison
 * fields; those remain Task 3 policy decisions.
 */
export function compileLocalAACatalog(input) {
  if (!isRecord(input)) invalidCatalog('catalog input must be an object')
  const { seed, hostRoutes } = input
  if (!isRecord(seed)) invalidCatalog('seed must be an object')
  if (seed.schemaVersion !== AA_EVIDENCE_CATALOG_SCHEMA_VERSION) {
    invalidCatalog('seed.schemaVersion must be 1')
  }
  if (seed.catalogVersion !== AA_EVIDENCE_CATALOG_VERSION) {
    invalidCatalog(`seed.catalogVersion must be ${AA_EVIDENCE_CATALOG_VERSION}`)
  }
  if (seed.bindingVersion !== AA_EVIDENCE_BINDING_VERSION) {
    invalidCatalog(`seed.bindingVersion must be ${AA_EVIDENCE_BINDING_VERSION}`)
  }
  if (!isRecord(seed.snapshot)) invalidCatalog('seed.snapshot must be an object')
  if (typeof seed.snapshot.snapshotId !== 'string' || seed.snapshot.snapshotId.trim() === '') {
    invalidCatalog('seed.snapshot.snapshotId must be a non-empty string')
  }
  if (!Array.isArray(seed.snapshot.records)) invalidCatalog('seed.snapshot.records must be an array')
  if (!Array.isArray(seed.bindings)) invalidCatalog('seed.bindings must be an array')
  if (!Array.isArray(hostRoutes)) invalidCatalog('hostRoutes must be an array')

  const identities = new Map()
  for (const effectiveConfig of hostRoutes) {
    let hostRoute
    try {
      hostRoute = createHostRouteIdentity(effectiveConfig)
    } catch (error) {
      if (error instanceof AAEvidenceBindingError) {
        throw new AACatalogError(error.code, error.message)
      }
      throw error
    }
    if (identities.has(hostRoute.routeId)) {
      throw new AACatalogError('host-route-duplicate', `duplicate Host route ${hostRoute.routeId}`)
    }
    identities.set(hostRoute.routeId, { hostRoute, effectiveConfig: cloneEffectiveConfig(effectiveConfig) })
  }

  const { eligible: eligibleBindings, exclusions } = partitionBindings(
    seed.bindings,
    new Set(identities.keys()),
  )
  const entries = []
  for (const { hostRoute, effectiveConfig } of identities.values()) {
    try {
      const resolved = resolveAAEvidenceBinding({
        hostRoute,
        bindings: eligibleBindings,
        aaSnapshot: seed.snapshot,
        bindingVersion: seed.bindingVersion,
      })
      const capabilityFacts = capabilityFactsOf(resolved.aaRecord)
      entries.push(freezeTree({
        routeId: hostRoute.routeId,
        provider: hostRoute.provider,
        model: hostRoute.model,
        effectiveConfig,
        hostRoute,
        effectiveConfigFingerprint: hostRoute.effectiveConfigFingerprint,
        aaSnapshotId: resolved.binding.aaSnapshotId,
        aaRecordId: resolved.binding.aaRecordId,
        bindingVersion: resolved.binding.bindingVersion,
        evidenceBinding: resolved.binding,
        aaRecord: resolved.aaRecord,
        capabilityFacts,
      }))
    } catch (error) {
      if (!(error instanceof AAEvidenceBindingError) && !(error instanceof AACatalogError)) throw error
      exclusions.push(Object.freeze({
        source: 'host-route',
        hostRouteId: hostRoute.routeId,
        reasonCode: error.code,
      }))
    }
  }

  entries.sort(compareEntries)
  exclusions.sort(compareExclusions)
  return freezeTree({
    schemaVersion: AA_EVIDENCE_CATALOG_SCHEMA_VERSION,
    catalogVersion: seed.catalogVersion,
    aaSnapshotId: seed.snapshot.snapshotId,
    bindingVersion: seed.bindingVersion,
    entries,
    exclusions,
  })
}

/** Load one maintainer-selected local JSON seed, then compile it offline. */
export function compileLocalAACatalogFromFile(input) {
  if (!isRecord(input) || typeof input.seedPath !== 'string' || input.seedPath.trim() === '') {
    throw new AACatalogError(
      'aa-catalog-seed-invalid',
      'seedPath must be a non-empty string',
    )
  }

  let bytes
  try {
    bytes = readFileSync(input.seedPath)
  } catch {
    throw new AACatalogError(
      'aa-catalog-seed-invalid',
      'local AA catalog seed must be readable JSON',
    )
  }
  if (bytes.byteLength > AA_CATALOG_SEED_MAX_BYTES) {
    throw new AACatalogError(
      'aa-catalog-seed-too-large',
      'local AA catalog seed must not exceed 1 MiB',
    )
  }

  let seed
  try {
    seed = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new AACatalogError(
      'aa-catalog-seed-invalid',
      'local AA catalog seed must be readable JSON',
    )
  }
  return compileLocalAACatalog({ seed, hostRoutes: input.hostRoutes })
}
