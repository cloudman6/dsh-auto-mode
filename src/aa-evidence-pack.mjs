import { createHash } from 'node:crypto'

import { AA_ROUTE_POLICY_VERSION } from './aa-route-policy.mjs'
import {
  evidenceRouteKeyId,
  validateProviderNormalizationRule,
} from './evidence-route-key.mjs'

export const AA_SNAPSHOT_SCHEMA_VERSION = 1
export const AA_SNAPSHOT_VERSION = 'aa-snapshot/v2'
export const AA_BINDING_REGISTRY_SCHEMA_VERSION = 1
export const AA_BINDING_REGISTRY_VERSION = 'aa-binding-registry/v1'
export const AA_EVIDENCE_PACK_MANIFEST_VERSION = 'aa-evidence-pack-manifest/v1'
export const AA_EVIDENCE_PACK_RUNTIME_CONTRACT = 'aa-evidence-pack-runtime/v1'
export const AA_EVIDENCE_PACK_RUNTIME_VERSION = 1
export const AA_EVIDENCE_PACK_TERMS_VERSION = '1.1'
export const AA_EVIDENCE_PACK_TERMS_REVISED_AT = '2026-08-19'
export const AA_EVIDENCE_PACK_TERMS_URL = 'https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf'
export const AA_EVIDENCE_PACK_ATTRIBUTION = 'Source: Artificial Analysis (artificialanalysis.ai)'

const AA_ENDPOINT = 'https://artificialanalysis.ai/api/v2/language/models'
const MAX_RECORDS = 10_000
const MAX_PAGES = 1_000
const MAX_COMPONENT_BYTES = 16 * 1024 * 1024
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/

export class AAEvidencePackError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'AAEvidencePackError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AAEvidencePackError(code, message)
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

function canonicalJson(value, path = 'component', active = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid('aa-evidence-pack-invalid', `${path} contains a non-finite number`)
    return JSON.stringify(value)
  }
  if (typeof value !== 'object') {
    invalid('aa-evidence-pack-invalid', `${path} must contain only JSON values`)
  }
  if (active.has(value)) invalid('aa-evidence-pack-invalid', `${path} must not contain cycles`)
  active.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.keys(value).length !== value.length) {
        invalid('aa-evidence-pack-invalid', `${path} must not contain sparse or named array properties`)
      }
      return `[${value.map((entry, index) => canonicalJson(entry, `${path}[${index}]`, active)).join(',')}]`
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      invalid('aa-evidence-pack-invalid', `${path} must contain plain objects`)
    }
    const keys = Reflect.ownKeys(value)
    if (keys.some(key => typeof key !== 'string')) {
      invalid('aa-evidence-pack-invalid', `${path} must not contain symbol keys`)
    }
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value')) {
        invalid('aa-evidence-pack-invalid', `${path}.${key} must be an enumerable data property`)
      }
    }
    return `{${keys.sort().map(
      key => `${JSON.stringify(key)}:${canonicalJson(value[key], `${path}.${key}`, active)}`,
    ).join(',')}}`
  } finally {
    active.delete(value)
  }
}

/** Deterministic canonical JSON used for component digests and disk serialization. */
export function serializeEvidenceComponent(value) {
  const serialized = canonicalJson(value)
  if (Buffer.byteLength(serialized, 'utf8') > MAX_COMPONENT_BYTES) {
    invalid('aa-evidence-pack-component-too-large', 'Evidence Pack component exceeds 16 MiB')
  }
  return serialized
}

export function evidenceComponentDigest(value) {
  return `sha256:${createHash('sha256').update(serializeEvidenceComponent(value), 'utf8').digest('hex')}`
}

function requiredString(value, path, code = 'aa-evidence-pack-invalid', maximumLength = 512) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > maximumLength
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    invalid(code, `${path} must be a bounded non-empty string`)
  }
  return value
}

function canonicalTimestamp(value, path, code) {
  requiredString(value, path, code, 64)
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) {
    invalid(code, `${path} must be a canonical UTC timestamp`)
  }
  return milliseconds
}

function validateRights(value) {
  if (!isRecord(value) || !['internal-only', 'written-license'].includes(value.mode)) {
    invalid('aa-evidence-pack-rights-invalid', 'rights.mode must be internal-only or written-license')
  }
  if (value.mode === 'internal-only') {
    if (Object.keys(value).length !== 1) {
      invalid('aa-evidence-pack-rights-invalid', 'internal-only rights must contain only mode')
    }
    return
  }
  if (Object.keys(value).sort().join('\0') !== [
    'allowsMachineReadableDistribution',
    'allowsModelSelectionProduct',
    'grantReference',
    'mode',
  ].join('\0')
    || value.allowsMachineReadableDistribution !== true
    || value.allowsModelSelectionProduct !== true) {
    invalid('aa-evidence-pack-rights-invalid', 'written-license rights require an external grant for both scopes')
  }
  requiredString(value.grantReference, 'rights.grantReference', 'aa-evidence-pack-rights-invalid', 256)
}

function numericField(value, path, { nullable = false } = {}) {
  if (nullable && value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    invalid('aa-snapshot-record-invalid', `${path} must be a non-negative finite number${nullable ? ' or null' : ''}`)
  }
  return value
}

function minimizeAARecord(record) {
  const recordId = requiredString(record.id, 'record.id', 'aa-snapshot-record-invalid', 128)
  const score = record.evaluations?.artificial_analysis_intelligence_index
  const price = record.pricing?.price_1m_blended_7_to_2_to_1
  if (score === undefined || score === null) return { exclusion: { recordId, reasonCode: 'aa-capability-missing' } }
  if (price === undefined || price === null) return { exclusion: { recordId, reasonCode: 'aa-price-missing' } }
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0) {
    return { exclusion: { recordId, reasonCode: 'aa-capability-invalid' } }
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    return { exclusion: { recordId, reasonCode: 'aa-price-invalid' } }
  }
  const latencyValue = record.performance?.median_time_to_first_answer_token_seconds
  const latency = typeof latencyValue === 'number' && Number.isFinite(latencyValue) && latencyValue >= 0
    ? latencyValue
    : null
  const creator = isRecord(record.model_creator) ? record.model_creator : {}
  return { record: {
    recordId,
    label: requiredString(record.name, 'record.name', 'aa-snapshot-record-invalid'),
    slug: typeof record.slug === 'string' && record.slug.trim() !== '' ? record.slug : null,
    creator: {
      recordId: requiredString(creator.id, 'record.model_creator.id', 'aa-snapshot-record-invalid', 128),
      label: requiredString(creator.name, 'record.model_creator.name', 'aa-snapshot-record-invalid'),
    },
    releaseDate: typeof record.release_date === 'string' && record.release_date.trim() !== ''
      ? record.release_date
      : null,
    evaluations: { artificial_analysis_intelligence_index: score },
    pricing: { price_1m_blended_7_to_2_to_1: price },
    performance: { median_time_to_first_answer_token_seconds: latency },
  } }
}

function validateAcquisition(acquisition) {
  if (!isRecord(acquisition) || acquisition.schemaVersion !== 1
    || acquisition.acquisitionVersion !== 'aa-api-acquisition/v1'
    || acquisition.endpoint !== AA_ENDPOINT || acquisition.promptType !== 'medium'
    || !Array.isArray(acquisition.pages) || acquisition.pages.length === 0
    || acquisition.pages.length > MAX_PAGES) {
    invalid('aa-snapshot-source-invalid', 'acquisition must be one bounded pinned AA API bundle')
  }
  canonicalTimestamp(acquisition.capturedAt, 'acquisition.capturedAt', 'aa-snapshot-source-invalid')
  const records = new Map()
  for (let index = 0; index < acquisition.pages.length; index += 1) {
    const page = acquisition.pages[index]
    if (!isRecord(page) || !['pro', 'commercial'].includes(page.tier)
      || page.intelligence_index_version !== 4.1 || !Array.isArray(page.data)
      || !isRecord(page.pagination)) {
      invalid('aa-snapshot-methodology-mismatch', 'AA tier or Intelligence Index version changed')
    }
    const pagination = page.pagination
    if (pagination.page !== index + 1 || pagination.total_pages !== acquisition.pages.length
      || pagination.has_more !== (index + 1 < acquisition.pages.length)
      || !Number.isInteger(pagination.page_size) || pagination.page_size < 1) {
      invalid('aa-snapshot-source-invalid', 'acquisition pagination is incomplete')
    }
    for (const record of page.data) {
      if (!isRecord(record)) invalid('aa-snapshot-source-invalid', 'AA record must be an object')
      const id = requiredString(record.id, 'record.id', 'aa-snapshot-record-invalid', 128)
      if (records.has(id)) invalid('aa-snapshot-record-id-duplicate', `AA record ID ${id} occurs more than once`)
      records.set(id, record)
      if (records.size > MAX_RECORDS) invalid('aa-snapshot-too-large', 'AA acquisition exceeds record bound')
    }
  }
  return records
}

function validateSnapshot(snapshot) {
  if (!isRecord(snapshot) || snapshot.schemaVersion !== AA_SNAPSHOT_SCHEMA_VERSION
    || snapshot.snapshotVersion !== AA_SNAPSHOT_VERSION
    || !Array.isArray(snapshot.records) || !isRecord(snapshot.source)) {
    invalid('aa-snapshot-invalid', 'snapshot must use aa-snapshot/v2')
  }
  requiredString(snapshot.snapshotId, 'snapshot.snapshotId', 'aa-snapshot-invalid', 128)
  canonicalTimestamp(snapshot.capturedAt, 'snapshot.capturedAt', 'aa-snapshot-invalid')
  validateRights(snapshot.rights)
  if (snapshot.source.methodologyVersion !== 'v4.1.1') {
    invalid('aa-snapshot-methodology-mismatch', 'snapshot methodology must remain v4.1.1')
  }
  if (snapshot.source.attribution !== AA_EVIDENCE_PACK_ATTRIBUTION
    || !isRecord(snapshot.source.terms)
    || snapshot.source.terms.version !== AA_EVIDENCE_PACK_TERMS_VERSION
    || snapshot.source.terms.revisedAt !== AA_EVIDENCE_PACK_TERMS_REVISED_AT
    || snapshot.source.terms.url !== AA_EVIDENCE_PACK_TERMS_URL) {
    invalid('aa-evidence-pack-rights-invalid', 'snapshot must retain the reviewed AA terms and attribution')
  }
  const ids = new Set()
  let previous = null
  for (const record of snapshot.records) {
    if (!isRecord(record)) invalid('aa-snapshot-record-invalid', 'snapshot record must be an object')
    requiredString(record.recordId, 'snapshot.record.recordId', 'aa-snapshot-record-invalid', 128)
    if (ids.has(record.recordId)) invalid('aa-snapshot-record-id-duplicate', 'snapshot record IDs must be unique')
    if (previous !== null && previous >= record.recordId) {
      invalid('aa-snapshot-record-order-invalid', 'snapshot records must be sorted by stable ID')
    }
    ids.add(record.recordId)
    previous = record.recordId
    numericField(record.evaluations?.artificial_analysis_intelligence_index, 'record capability')
    numericField(record.pricing?.price_1m_blended_7_to_2_to_1, 'record price')
    numericField(record.performance?.median_time_to_first_answer_token_seconds, 'record latency', { nullable: true })
  }
  serializeEvidenceComponent(snapshot)
}

/** Scan every acquired page and retain every record eligible under the pinned route policy. */
export function buildPolicyEligibleAASnapshot({
  acquisition,
  snapshotId,
  source,
  rights,
  now,
  maximumAgeDays = 30,
}) {
  const records = validateAcquisition(acquisition)
  if (source?.methodologyVersion !== 'v4.1.1') {
    invalid('aa-snapshot-methodology-mismatch', 'source methodology must remain v4.1.1')
  }
  if (!isRecord(source.terms)) invalid('aa-snapshot-rights-invalid', 'source terms are required')
  validateRights(rights)
  if (now !== undefined) {
    const age = canonicalTimestamp(now, 'now', 'aa-snapshot-source-invalid')
      - canonicalTimestamp(acquisition.capturedAt, 'acquisition.capturedAt', 'aa-snapshot-source-invalid')
    if (!Number.isInteger(maximumAgeDays) || maximumAgeDays < 1 || maximumAgeDays > 366
      || age > maximumAgeDays * 86_400_000) {
      invalid('aa-snapshot-source-stale', 'acquisition exceeds maximumAgeDays')
    }
  }
  const minimized = []
  const exclusions = []
  for (const record of records.values()) {
    const result = minimizeAARecord(record)
    if (result.record) minimized.push(result.record)
    else exclusions.push(result.exclusion)
  }
  minimized.sort((left, right) => left.recordId.localeCompare(right.recordId))
  exclusions.sort((left, right) => left.recordId.localeCompare(right.recordId))
  const snapshot = {
    schemaVersion: AA_SNAPSHOT_SCHEMA_VERSION,
    snapshotVersion: AA_SNAPSHOT_VERSION,
    snapshotId: requiredString(snapshotId, 'snapshotId', 'aa-snapshot-invalid', 128),
    capturedAt: acquisition.capturedAt,
    source: JSON.parse(canonicalJson(source)),
    rights: JSON.parse(canonicalJson(rights)),
    records: minimized,
  }
  validateSnapshot(snapshot)
  return freezeTree({ snapshot, exclusions })
}

function validateStringList(value, path, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    invalid('aa-binding-registry-invalid', `${path} must be ${allowEmpty ? 'an' : 'a non-empty'} array`)
  }
  const normalized = value.map((entry, index) => requiredString(
    entry, `${path}[${index}]`, 'aa-binding-registry-invalid', 512,
  ))
  if (new Set(normalized).size !== normalized.length) {
    invalid('aa-binding-registry-invalid', `${path} contains duplicates`)
  }
}

export function validateBindingRegistry(registry, { requireCanonicalOrder = true } = {}) {
  if (!isRecord(registry) || registry.schemaVersion !== AA_BINDING_REGISTRY_SCHEMA_VERSION
    || registry.registryVersion !== AA_BINDING_REGISTRY_VERSION
    || !Array.isArray(registry.normalizationRules) || registry.normalizationRules.length === 0
    || !Array.isArray(registry.bindings)) {
    invalid('aa-binding-registry-invalid', 'registry must use aa-binding-registry/v1')
  }
  const ruleVersions = new Set()
  const providerIds = new Set()
  let previousRuleVersion = null
  for (const candidate of registry.normalizationRules) {
    const rule = validateProviderNormalizationRule(candidate)
    if (ruleVersions.has(rule.ruleVersion)) {
      invalid('aa-binding-registry-rule-duplicate', `rule version ${rule.ruleVersion} occurs more than once`)
    }
    ruleVersions.add(rule.ruleVersion)
    if (requireCanonicalOrder && previousRuleVersion !== null
      && previousRuleVersion.localeCompare(rule.ruleVersion) >= 0) {
      invalid('aa-binding-registry-order-invalid', 'normalization rules must be sorted by rule version')
    }
    previousRuleVersion = rule.ruleVersion
    for (const providerId of rule.providerIds) {
      if (providerIds.has(providerId)) {
        invalid('aa-binding-registry-rule-ambiguous', `provider ${providerId} is owned by more than one rule`)
      }
      providerIds.add(providerId)
    }
  }
  const keys = new Set()
  let previousKeyId = null
  for (const binding of registry.bindings) {
    if (!isRecord(binding)) invalid('aa-binding-registry-invalid', 'binding must be an object')
    const keyId = evidenceRouteKeyId(binding.evidenceRouteKey)
    if (keys.has(keyId)) invalid('aa-binding-registry-key-duplicate', `binding key ${keyId} occurs more than once`)
    if (requireCanonicalOrder && previousKeyId !== null && previousKeyId.localeCompare(keyId) >= 0) {
      invalid('aa-binding-registry-order-invalid', 'bindings must be sorted by EvidenceRouteKey ID')
    }
    keys.add(keyId)
    previousKeyId = keyId
    requiredString(binding.aaRecordId, 'binding.aaRecordId', 'aa-binding-registry-invalid', 128)
    requiredString(binding.ruleVersion, 'binding.ruleVersion', 'aa-binding-registry-invalid', 128)
    if (!ruleVersions.has(binding.ruleVersion)) {
      invalid('aa-binding-registry-rule-missing', `binding rule ${binding.ruleVersion} is not present`)
    }
    validateStringList(binding.matchBasis, 'binding.matchBasis', { allowEmpty: false })
    validateStringList(binding.limitations, 'binding.limitations')
    if (binding.quarantine !== null) {
      if (!isRecord(binding.quarantine)) invalid('aa-binding-registry-invalid', 'binding.quarantine must be null or an object')
      requiredString(binding.quarantine.reasonCode, 'binding.quarantine.reasonCode', 'aa-binding-registry-invalid', 128)
    }
  }
  serializeEvidenceComponent(registry)
  return freezeTree(registry)
}

function validateRoutePolicy(policy) {
  if (!isRecord(policy) || policy.policyVersion !== AA_ROUTE_POLICY_VERSION
    || policy.capabilityMethodologyVersion !== 'v4.1.1') {
    invalid('aa-evidence-pack-policy-invalid', 'route policy is incompatible')
  }
  serializeEvidenceComponent(policy)
}

function validateManifest(manifest, components) {
  if (!isRecord(manifest) || manifest.schemaVersion !== 1
    || manifest.manifestVersion !== AA_EVIDENCE_PACK_MANIFEST_VERSION) {
    invalid('aa-evidence-pack-manifest-invalid', 'manifest must use aa-evidence-pack-manifest/v1')
  }
  requiredString(manifest.packId, 'manifest.packId', 'aa-evidence-pack-manifest-invalid', 128)
  validateRights(manifest.rights)
  if (!isRecord(manifest.components)
    || Object.keys(manifest.components).sort().join('\0') !== [
      'bindingRegistry', 'routePolicy', 'snapshot',
    ].join('\0')) {
    invalid('aa-evidence-pack-manifest-invalid', 'manifest must contain exactly the three component descriptors')
  }
  const compatibility = manifest.runtimeCompatibility
  if (!isRecord(compatibility) || compatibility.contract !== AA_EVIDENCE_PACK_RUNTIME_CONTRACT
    || !Number.isInteger(compatibility.minimumVersion)
    || !Number.isInteger(compatibility.maximumVersion)
    || compatibility.minimumVersion > AA_EVIDENCE_PACK_RUNTIME_VERSION
    || compatibility.maximumVersion < AA_EVIDENCE_PACK_RUNTIME_VERSION) {
    invalid('aa-evidence-pack-runtime-incompatible', 'Evidence Pack is incompatible with this Runtime')
  }
  for (const [name, component] of Object.entries(components)) {
    const descriptor = manifest.components?.[name]
    if (!isRecord(descriptor) || !DIGEST_PATTERN.test(descriptor.digest)) {
      invalid('aa-evidence-pack-manifest-invalid', `manifest component ${name} is invalid`)
    }
    if (descriptor.digest !== evidenceComponentDigest(component)) {
      invalid('aa-evidence-pack-digest-mismatch', `Evidence Pack component ${name} digest does not match`)
    }
  }
}

/** Validate a complete compatible Evidence Pack while preserving object identity. */
export function validateAAEvidencePack(pack) {
  if (!isRecord(pack) || !isRecord(pack.snapshot) || !isRecord(pack.bindingRegistry)
    || !isRecord(pack.routePolicy) || !isRecord(pack.manifest)) {
    invalid('aa-evidence-pack-invalid', 'Evidence Pack must contain four components')
  }
  validateSnapshot(pack.snapshot)
  validateBindingRegistry(pack.bindingRegistry)
  validateRoutePolicy(pack.routePolicy)
  validateManifest(pack.manifest, {
    snapshot: pack.snapshot,
    bindingRegistry: pack.bindingRegistry,
    routePolicy: pack.routePolicy,
  })
  if (canonicalJson(pack.snapshot.rights) !== canonicalJson(pack.manifest.rights)) {
    invalid('aa-evidence-pack-rights-invalid', 'snapshot and manifest rights must agree')
  }
  return freezeTree(pack)
}

/** Assemble and sign the component relationship with deterministic SHA-256 digests. */
export function buildAAEvidencePack({
  packId,
  snapshot,
  bindingRegistry,
  routePolicy,
  runtimeCompatibility,
  rights,
}) {
  validateSnapshot(snapshot)
  validateBindingRegistry(bindingRegistry, { requireCanonicalOrder: false })
  const canonicalRegistry = JSON.parse(canonicalJson(bindingRegistry))
  canonicalRegistry.normalizationRules.sort((left, right) => left.ruleVersion.localeCompare(right.ruleVersion))
  canonicalRegistry.bindings.sort((left, right) => (
    evidenceRouteKeyId(left.evidenceRouteKey).localeCompare(evidenceRouteKeyId(right.evidenceRouteKey))
  ))
  validateBindingRegistry(canonicalRegistry)
  validateRoutePolicy(routePolicy)
  validateRights(rights)
  const manifest = {
    schemaVersion: 1,
    manifestVersion: AA_EVIDENCE_PACK_MANIFEST_VERSION,
    packId: requiredString(packId, 'packId', 'aa-evidence-pack-manifest-invalid', 128),
    runtimeCompatibility: JSON.parse(canonicalJson(runtimeCompatibility)),
    rights: JSON.parse(canonicalJson(rights)),
    components: {
      snapshot: { version: snapshot.snapshotVersion, digest: evidenceComponentDigest(snapshot) },
      bindingRegistry: { version: canonicalRegistry.registryVersion, digest: evidenceComponentDigest(canonicalRegistry) },
      routePolicy: { version: routePolicy.policyVersion, digest: evidenceComponentDigest(routePolicy) },
    },
  }
  return validateAAEvidencePack({ snapshot, bindingRegistry: canonicalRegistry, routePolicy, manifest })
}
