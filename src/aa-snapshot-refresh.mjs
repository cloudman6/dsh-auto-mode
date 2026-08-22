import { createHash } from 'node:crypto'

import {
  AA_EVIDENCE_BINDING_VERSION,
  createHostRouteIdentity,
  HOST_ROUTE_IDENTITY_VERSION,
} from './aa-evidence-binding.mjs'
import {
  AA_EVIDENCE_CATALOG_SCHEMA_VERSION,
  AA_EVIDENCE_CATALOG_VERSION,
  compileLocalAACatalog,
} from './aa-catalog.mjs'
import {
  AA_ROUTE_POLICY_V1,
  compileAARoutePolicyCatalog,
} from './aa-route-policy.mjs'

export const AA_SNAPSHOT_REFRESH_SCHEMA_VERSION = 1
export const AA_SNAPSHOT_REFRESH_VERSION = 'aa-snapshot-refresh/v1'
export const AA_API_ACQUISITION_VERSION = 'aa-api-acquisition/v1'
export const AA_BINDING_PLAN_VERSION = 'aa-binding-plan/v1'
export const AA_LANGUAGE_MODELS_ENDPOINT = 'https://artificialanalysis.ai/api/v2/language/models'
export const AA_DATA_TERMS_VERSION = '1.1'
export const AA_DATA_TERMS_REVISED_AT = '2026-08-19'
export const AA_DATA_TERMS_URL = 'https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf'
export const AA_ATTRIBUTION = 'Source: Artificial Analysis (artificialanalysis.ai)'

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000
const FUTURE_TOLERANCE_MILLISECONDS = 5 * 60 * 1000
const HOST_ROUTE_PATTERN = /^host-route:v1:[a-f0-9]{64}$/
const CONFIG_FINGERPRINT_PATTERN = /^sha256:[a-f0-9]{64}$/
const SENSITIVE_HOST_ROUTE_FIELDS = new Set([
  'accesstoken',
  'apikey',
  'authorization',
  'clientsecret',
  'password',
  'privatekey',
  'refreshtoken',
  'secret',
  'token',
])

export class AASnapshotRefreshError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'AASnapshotRefreshError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AASnapshotRefreshError(code, message)
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value, keys, path, code) {
  if (!isRecord(value) || Object.keys(value).sort().join('\u0000') !== [...keys].sort().join('\u0000')) {
    invalid(code, `${path} must contain exactly ${keys.join(', ')}`)
  }
}

function requiredString(value, path, code, maximumLength = 512) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > maximumLength
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    invalid(code, `${path} must be a bounded non-empty string without control characters`)
  }
  return value
}

function finiteNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function parseTimestamp(value, path, code) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    invalid(code, `${path} must be a canonical UTC ISO-8601 timestamp`)
  }
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) {
    invalid(code, `${path} must be a valid canonical UTC ISO-8601 timestamp`)
  }
  return milliseconds
}

function freezeTree(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid('aa-refresh-invalid', 'digest input contains a non-finite number')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (!isRecord(value)) invalid('aa-refresh-invalid', 'digest input must contain only JSON values')
  return `{${Object.keys(value).sort().map(
    key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`,
  ).join(',')}}`
}

function sha256Json(value) {
  return `sha256:${createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex')}`
}

function compareText(left, right) {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function validateRights(rights) {
  if (!isRecord(rights) || !['internal-only', 'written-license'].includes(rights.mode)) {
    invalid('aa-refresh-rights-invalid', 'manifest.rights.mode must be internal-only or written-license')
  }
  if (rights.mode === 'internal-only') {
    exactKeys(rights, ['mode'], 'manifest.rights', 'aa-refresh-rights-invalid')
    return Object.freeze({ mode: rights.mode })
  }
  exactKeys(
    rights,
    ['mode', 'grantReference', 'allowsMachineReadableDistribution', 'allowsModelSelectionProduct'],
    'manifest.rights',
    'aa-refresh-rights-invalid',
  )
  const grantReference = requiredString(
    rights.grantReference,
    'manifest.rights.grantReference',
    'aa-refresh-rights-invalid',
    256,
  )
  if (rights.allowsMachineReadableDistribution !== true
    || rights.allowsModelSelectionProduct !== true) {
    invalid(
      'aa-refresh-rights-invalid',
      'written-license rights must assert machine-readable distribution and model-selection product scope',
    )
  }
  return Object.freeze({
    mode: rights.mode,
    grantReference,
    allowsMachineReadableDistribution: true,
    allowsModelSelectionProduct: true,
  })
}

function validateManifest(manifest) {
  exactKeys(manifest, [
    'schemaVersion',
    'refreshVersion',
    'snapshotId',
    'apiIntelligenceIndexVersion',
    'capabilityMethodologyVersion',
    'maximumAgeDays',
    'terms',
    'attribution',
    'rights',
  ], 'manifest', 'aa-refresh-manifest-invalid')
  if (manifest.schemaVersion !== AA_SNAPSHOT_REFRESH_SCHEMA_VERSION
    || manifest.refreshVersion !== AA_SNAPSHOT_REFRESH_VERSION) {
    invalid('aa-refresh-manifest-invalid', 'manifest must use aa-snapshot-refresh/v1 schema version 1')
  }
  const snapshotId = requiredString(
    manifest.snapshotId,
    'manifest.snapshotId',
    'aa-refresh-manifest-invalid',
    128,
  )
  if (!finiteNonNegative(manifest.apiIntelligenceIndexVersion)) {
    invalid('aa-refresh-manifest-invalid', 'manifest.apiIntelligenceIndexVersion must be non-negative')
  }
  if (manifest.capabilityMethodologyVersion !== AA_ROUTE_POLICY_V1.capabilityMethodologyVersion) {
    invalid(
      'aa-refresh-methodology-mismatch',
      `manifest capability methodology must remain ${AA_ROUTE_POLICY_V1.capabilityMethodologyVersion}`,
    )
  }
  if (!Number.isInteger(manifest.maximumAgeDays)
    || manifest.maximumAgeDays < 1 || manifest.maximumAgeDays > 366) {
    invalid('aa-refresh-manifest-invalid', 'manifest.maximumAgeDays must be an integer from 1 to 366')
  }
  exactKeys(manifest.terms, ['version', 'revisedAt', 'url'], 'manifest.terms', 'aa-refresh-rights-invalid')
  if (manifest.terms.version !== AA_DATA_TERMS_VERSION
    || manifest.terms.revisedAt !== AA_DATA_TERMS_REVISED_AT
    || manifest.terms.url !== AA_DATA_TERMS_URL) {
    invalid('aa-refresh-rights-invalid', 'manifest must pin the reviewed AA Data Platform Terms')
  }
  if (manifest.attribution !== AA_ATTRIBUTION) {
    invalid('aa-refresh-rights-invalid', 'manifest must retain the required AA attribution')
  }
  return freezeTree({
    schemaVersion: manifest.schemaVersion,
    refreshVersion: manifest.refreshVersion,
    snapshotId,
    apiIntelligenceIndexVersion: manifest.apiIntelligenceIndexVersion,
    capabilityMethodologyVersion: manifest.capabilityMethodologyVersion,
    maximumAgeDays: manifest.maximumAgeDays,
    terms: { ...manifest.terms },
    attribution: manifest.attribution,
    rights: validateRights(manifest.rights),
  })
}

function validateAcquisition(acquisition, manifest, now) {
  exactKeys(acquisition, [
    'schemaVersion',
    'acquisitionVersion',
    'endpoint',
    'promptType',
    'capturedAt',
    'pages',
  ], 'acquisition', 'aa-refresh-source-invalid')
  if (acquisition.schemaVersion !== 1
    || acquisition.acquisitionVersion !== AA_API_ACQUISITION_VERSION
    || acquisition.endpoint !== AA_LANGUAGE_MODELS_ENDPOINT
    || acquisition.promptType !== 'medium'
    || !Array.isArray(acquisition.pages)
    || acquisition.pages.length === 0) {
    invalid('aa-refresh-source-invalid', 'acquisition must be a non-empty pinned AA API bundle')
  }
  const capturedAt = parseTimestamp(
    acquisition.capturedAt,
    'acquisition.capturedAt',
    'aa-refresh-source-invalid',
  )
  const nowMilliseconds = parseTimestamp(now, 'now', 'aa-refresh-source-invalid')
  if (capturedAt > nowMilliseconds + FUTURE_TOLERANCE_MILLISECONDS) {
    invalid('aa-refresh-source-invalid', 'acquisition.capturedAt must not be in the future')
  }
  if (nowMilliseconds - capturedAt > manifest.maximumAgeDays * DAY_MILLISECONDS) {
    invalid('aa-refresh-source-stale', 'acquisition exceeds manifest.maximumAgeDays')
  }

  const records = new Map()
  for (let index = 0; index < acquisition.pages.length; index += 1) {
    const page = acquisition.pages[index]
    if (!isRecord(page) || !['pro', 'commercial'].includes(page.tier)
      || page.intelligence_index_version !== manifest.apiIntelligenceIndexVersion
      || !isRecord(page.pagination) || !Array.isArray(page.data)) {
      invalid('aa-refresh-methodology-mismatch', 'AA API tier or Intelligence Index version changed')
    }
    const pagination = page.pagination
    const expectedPage = index + 1
    if (pagination.page !== expectedPage
      || !Number.isInteger(pagination.page_size) || pagination.page_size < 1
      || pagination.total_pages !== acquisition.pages.length
      || pagination.has_more !== (expectedPage < acquisition.pages.length)) {
      invalid('aa-refresh-source-invalid', 'AA API pagination envelope is incomplete or inconsistent')
    }
    for (const record of page.data) {
      if (!isRecord(record)) invalid('aa-refresh-source-invalid', 'AA API records must be objects')
      const id = requiredString(record.id, 'AA record id', 'aa-refresh-source-invalid', 128)
      if (records.has(id)) invalid('aa-refresh-source-invalid', `AA record ID ${id} occurs more than once`)
      records.set(id, record)
    }
  }
  return { capturedAt: acquisition.capturedAt, records }
}

function validateHostRoutes(hostRoutes) {
  if (!Array.isArray(hostRoutes)) invalid('aa-refresh-host-routes-invalid', 'hostRoutes must be an array')
  const routes = new Map()
  for (const effectiveConfig of hostRoutes) {
    const pending = [effectiveConfig]
    const seen = new WeakSet()
    while (pending.length > 0) {
      const current = pending.pop()
      if (current === null || typeof current !== 'object' || seen.has(current)) continue
      seen.add(current)
      for (const [key, value] of Object.entries(current)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (SENSITIVE_HOST_ROUTE_FIELDS.has(normalizedKey)) {
          invalid(
            'aa-refresh-host-routes-sensitive',
            `Host route effective configuration must not contain the ${key} credential field`,
          )
        }
        pending.push(value)
      }
    }
    let identity
    try {
      identity = createHostRouteIdentity(effectiveConfig)
    } catch (error) {
      invalid('aa-refresh-host-routes-invalid', error.message)
    }
    if (routes.has(identity.routeId)) {
      invalid('aa-refresh-host-routes-invalid', `duplicate Host route ${identity.routeId}`)
    }
    routes.set(identity.routeId, { effectiveConfig, identity })
  }
  return routes
}

/** Build the private, deterministic identity inventory used to review bindings. */
export function buildAASnapshotHostRouteIdentityInventory(hostRoutes) {
  const routes = [...validateHostRoutes(hostRoutes).values()]
    .sort((left, right) => compareText(left.identity.routeId, right.identity.routeId))
    .map(route => ({
      hostRouteId: route.identity.routeId,
      effectiveConfigFingerprint: route.identity.effectiveConfigFingerprint,
      provider: route.identity.provider,
      model: route.identity.model,
      effectiveConfig: JSON.parse(canonicalJson(route.effectiveConfig)),
    }))
  return freezeTree({
    schemaVersion: 1,
    identityVersion: HOST_ROUTE_IDENTITY_VERSION,
    routes,
  })
}

function validateBindingPlan(bindingPlan, hostRoutes) {
  exactKeys(
    bindingPlan,
    ['schemaVersion', 'bindingPlanVersion', 'bindings'],
    'bindingPlan',
    'aa-refresh-binding-plan-invalid',
  )
  if (bindingPlan.schemaVersion !== 1
    || bindingPlan.bindingPlanVersion !== AA_BINDING_PLAN_VERSION
    || !Array.isArray(bindingPlan.bindings)) {
    invalid('aa-refresh-binding-plan-invalid', 'bindingPlan must use aa-binding-plan/v1')
  }
  const planned = new Map()
  for (const binding of bindingPlan.bindings) {
    exactKeys(binding, [
      'hostRouteId',
      'effectiveConfigFingerprint',
      'aaRecordId',
      'matchBasis',
      'limitations',
    ], 'bindingPlan.bindings[]', 'aa-refresh-binding-plan-invalid')
    if (!HOST_ROUTE_PATTERN.test(binding.hostRouteId)
      || !CONFIG_FINGERPRINT_PATTERN.test(binding.effectiveConfigFingerprint)) {
      invalid('aa-refresh-binding-plan-invalid', 'binding plan contains an invalid Host identity')
    }
    const route = hostRoutes.get(binding.hostRouteId)
    if (route === undefined
      || route.identity.effectiveConfigFingerprint !== binding.effectiveConfigFingerprint) {
      invalid('aa-refresh-binding-plan-invalid', 'binding plan does not match a current Host route')
    }
    const aaRecordId = requiredString(
      binding.aaRecordId,
      'bindingPlan.bindings[].aaRecordId',
      'aa-refresh-binding-plan-invalid',
      128,
    )
    for (const [field, allowEmpty] of [['matchBasis', false], ['limitations', true]]) {
      const values = binding[field]
      if (!Array.isArray(values) || (!allowEmpty && values.length === 0)
        || values.some(value => typeof value !== 'string' || value.trim() === '' || value.length > 256)
        || new Set(values).size !== values.length) {
        invalid('aa-refresh-binding-plan-invalid', `binding ${field} is invalid`)
      }
    }
    if (planned.has(binding.hostRouteId)) {
      invalid('aa-refresh-binding-plan-invalid', `Host route ${binding.hostRouteId} is bound more than once`)
    }
    planned.set(binding.hostRouteId, {
      hostRouteId: binding.hostRouteId,
      effectiveConfigFingerprint: binding.effectiveConfigFingerprint,
      aaRecordId,
      matchBasis: [...binding.matchBasis],
      limitations: [...binding.limitations],
    })
  }
  return planned
}

function minimizeRecord(record, methodologyVersion) {
  const id = requiredString(record.id, 'AA record id', 'aa-refresh-record-incomplete', 128)
  const label = requiredString(record.name, `AA record ${id} name`, 'aa-refresh-record-incomplete', 256)
  if (!isRecord(record.model_creator)) {
    invalid('aa-refresh-record-incomplete', `AA record ${id} lacks creator identity`)
  }
  const creatorId = requiredString(
    record.model_creator.id,
    `AA record ${id} creator ID`,
    'aa-refresh-record-incomplete',
    128,
  )
  const creatorLabel = requiredString(
    record.model_creator.name,
    `AA record ${id} creator name`,
    'aa-refresh-record-incomplete',
    256,
  )
  const score = record.evaluations?.artificial_analysis_intelligence_index
  const price = record.pricing?.price_1m_blended_7_to_2_to_1
  const latency = record.performance?.median_time_to_first_answer_token_seconds
  if (!finiteNonNegative(score) || !finiteNonNegative(price)) {
    invalid('aa-refresh-record-incomplete', `AA record ${id} lacks valid capability or blended price`)
  }
  if (latency !== null && latency !== undefined && !finiteNonNegative(latency)) {
    invalid('aa-refresh-record-incomplete', `AA record ${id} contains invalid latency`)
  }
  const releaseDate = record.release_date === null || record.release_date === undefined
    ? null
    : requiredString(record.release_date, `AA record ${id} release date`, 'aa-refresh-record-incomplete', 32)
  return freezeTree({
    recordId: id,
    label,
    creator: { recordId: creatorId, label: creatorLabel },
    releaseDate,
    capabilityFacts: [`intelligence-index-${methodologyVersion}=${score}`],
    evaluations: { artificial_analysis_intelligence_index: score },
    pricing: { price_1m_blended_7_to_2_to_1: price },
    performance: { median_time_to_first_answer_token_seconds: latency ?? null },
  })
}

function recordMetrics(record) {
  return {
    capability: record?.evaluations?.artificial_analysis_intelligence_index ?? null,
    price: record?.pricing?.price_1m_blended_7_to_2_to_1 ?? null,
    latency: record?.performance?.median_time_to_first_answer_token_seconds ?? null,
  }
}

function levelFor(record) {
  const score = recordMetrics(record).capability
  if (!finiteNonNegative(score)) return null
  if (score < AA_ROUTE_POLICY_V1.bandPolicy.light.maximumExclusive) return 'light'
  if (score < AA_ROUTE_POLICY_V1.bandPolicy.standard.maximumExclusive) return 'standard'
  return 'deep'
}

function sortedOrdering(seed) {
  const records = new Map(seed.snapshot.records.map(record => [record.recordId, record]))
  const levels = { light: [], standard: [], deep: [] }
  for (const binding of seed.bindings) {
    const record = records.get(binding.aaRecordId)
    const level = levelFor(record)
    const metrics = recordMetrics(record)
    if (level === null || !finiteNonNegative(metrics.price)) continue
    levels[level].push({
      routeId: binding.hostRouteId,
      price: metrics.price,
      latency: finiteNonNegative(metrics.latency) ? metrics.latency : null,
    })
  }
  for (const entries of Object.values(levels)) {
    entries.sort((left, right) => {
      if (left.price !== right.price) return left.price - right.price
      if (left.latency === null && right.latency !== null) return 1
      if (left.latency !== null && right.latency === null) return -1
      if (left.latency !== right.latency) return left.latency - right.latency
      return compareText(left.routeId, right.routeId)
    })
  }
  return Object.fromEntries(Object.entries(levels).map(
    ([level, entries]) => [level, entries.map(entry => entry.routeId)],
  ))
}

function normalizedPreviousSeed(previousSeed) {
  if (!isRecord(previousSeed) || !isRecord(previousSeed.snapshot)
    || typeof previousSeed.snapshot.snapshotId !== 'string'
    || !Array.isArray(previousSeed.snapshot.records)
    || !Array.isArray(previousSeed.bindings)) {
    invalid('aa-refresh-previous-invalid', 'previousSeed must be a complete local AA seed')
  }
  const clone = JSON.parse(canonicalJson(previousSeed))
  const recordIds = new Set()
  for (const record of clone.snapshot.records) {
    if (!isRecord(record) || typeof record.recordId !== 'string' || recordIds.has(record.recordId)) {
      invalid('aa-refresh-previous-invalid', 'previousSeed contains invalid or duplicate records')
    }
    recordIds.add(record.recordId)
  }
  const routeIds = new Set()
  for (const binding of clone.bindings) {
    if (!isRecord(binding) || typeof binding.hostRouteId !== 'string'
      || typeof binding.aaRecordId !== 'string' || routeIds.has(binding.hostRouteId)
      || !recordIds.has(binding.aaRecordId)) {
      invalid('aa-refresh-previous-invalid', 'previousSeed contains invalid bindings')
    }
    routeIds.add(binding.hostRouteId)
  }
  return freezeTree(clone)
}

function validateCandidateSeed(seed, hostRoutes) {
  const normalized = normalizedPreviousSeed(seed)
  exactKeys(
    normalized,
    ['schemaVersion', 'catalogVersion', 'bindingVersion', 'snapshot', 'bindings'],
    'prepared.seed',
    'aa-refresh-candidate-invalid',
  )
  if (normalized.schemaVersion !== AA_EVIDENCE_CATALOG_SCHEMA_VERSION
    || normalized.catalogVersion !== AA_EVIDENCE_CATALOG_VERSION
    || normalized.bindingVersion !== AA_EVIDENCE_BINDING_VERSION) {
    invalid('aa-refresh-candidate-invalid', 'prepared seed uses an unsupported catalog schema')
  }
  exactKeys(
    normalized.snapshot,
    ['snapshotId', 'source', 'records'],
    'prepared.seed.snapshot',
    'aa-refresh-candidate-invalid',
  )
  requiredString(
    normalized.snapshot.snapshotId,
    'prepared.seed.snapshot.snapshotId',
    'aa-refresh-candidate-invalid',
    128,
  )
  exactKeys(normalized.snapshot.source, [
    'name',
    'endpoint',
    'promptType',
    'capturedAt',
    'apiIntelligenceIndexVersion',
    'capabilityMethodologyVersion',
    'maximumAgeDays',
    'terms',
    'attribution',
    'rights',
  ], 'prepared.seed.snapshot.source', 'aa-refresh-candidate-invalid')
  const source = normalized.snapshot.source
  if (source.name !== 'Artificial Analysis'
    || source.endpoint !== AA_LANGUAGE_MODELS_ENDPOINT
    || source.promptType !== 'medium'
    || !finiteNonNegative(source.apiIntelligenceIndexVersion)
    || source.capabilityMethodologyVersion !== AA_ROUTE_POLICY_V1.capabilityMethodologyVersion
    || !Number.isInteger(source.maximumAgeDays)
    || source.maximumAgeDays < 1 || source.maximumAgeDays > 366
    || source.attribution !== AA_ATTRIBUTION) {
    invalid('aa-refresh-candidate-invalid', 'prepared seed contains invalid pinned source metadata')
  }
  parseTimestamp(
    source.capturedAt,
    'prepared.seed.snapshot.source.capturedAt',
    'aa-refresh-candidate-invalid',
  )
  exactKeys(source.terms, ['version', 'revisedAt', 'url'], 'prepared seed terms', 'aa-refresh-candidate-invalid')
  if (source.terms.version !== AA_DATA_TERMS_VERSION
    || source.terms.revisedAt !== AA_DATA_TERMS_REVISED_AT
    || source.terms.url !== AA_DATA_TERMS_URL) {
    invalid('aa-refresh-candidate-invalid', 'prepared seed terms do not match the reviewed version')
  }
  try {
    validateRights(source.rights)
  } catch (error) {
    invalid('aa-refresh-candidate-invalid', error.message)
  }

  const recordIds = new Set()
  for (const record of normalized.snapshot.records) {
    exactKeys(record, [
      'recordId',
      'label',
      'creator',
      'releaseDate',
      'capabilityFacts',
      'evaluations',
      'pricing',
      'performance',
    ], 'prepared seed record', 'aa-refresh-candidate-invalid')
    const recordId = requiredString(
      record.recordId,
      'prepared seed record ID',
      'aa-refresh-candidate-invalid',
      128,
    )
    requiredString(record.label, `prepared seed record ${recordId} label`, 'aa-refresh-candidate-invalid', 256)
    exactKeys(record.creator, ['recordId', 'label'], 'prepared seed creator', 'aa-refresh-candidate-invalid')
    requiredString(record.creator.recordId, 'prepared seed creator ID', 'aa-refresh-candidate-invalid', 128)
    requiredString(record.creator.label, 'prepared seed creator label', 'aa-refresh-candidate-invalid', 256)
    if (record.releaseDate !== null) {
      requiredString(record.releaseDate, 'prepared seed release date', 'aa-refresh-candidate-invalid', 32)
    }
    exactKeys(record.evaluations, ['artificial_analysis_intelligence_index'], 'prepared seed evaluations', 'aa-refresh-candidate-invalid')
    exactKeys(record.pricing, ['price_1m_blended_7_to_2_to_1'], 'prepared seed pricing', 'aa-refresh-candidate-invalid')
    exactKeys(record.performance, ['median_time_to_first_answer_token_seconds'], 'prepared seed performance', 'aa-refresh-candidate-invalid')
    const score = record.evaluations.artificial_analysis_intelligence_index
    const price = record.pricing.price_1m_blended_7_to_2_to_1
    const latency = record.performance.median_time_to_first_answer_token_seconds
    if (!finiteNonNegative(score) || !finiteNonNegative(price)
      || (latency !== null && !finiteNonNegative(latency))
      || !Array.isArray(record.capabilityFacts) || record.capabilityFacts.length !== 1
      || record.capabilityFacts[0] !== `intelligence-index-${source.capabilityMethodologyVersion}=${score}`) {
      invalid('aa-refresh-candidate-invalid', `prepared seed record ${recordId} has invalid policy facts`)
    }
    recordIds.add(recordId)
  }

  const boundRecordIds = new Set()
  for (const binding of normalized.bindings) {
    exactKeys(binding, [
      'bindingVersion',
      'hostRouteId',
      'effectiveConfigFingerprint',
      'aaSnapshotId',
      'aaRecordId',
      'matchBasis',
      'limitations',
    ], 'prepared seed binding', 'aa-refresh-candidate-invalid')
    if (binding.bindingVersion !== AA_EVIDENCE_BINDING_VERSION
      || !HOST_ROUTE_PATTERN.test(binding.hostRouteId)
      || !CONFIG_FINGERPRINT_PATTERN.test(binding.effectiveConfigFingerprint)
      || binding.aaSnapshotId !== normalized.snapshot.snapshotId
      || !recordIds.has(binding.aaRecordId)) {
      invalid('aa-refresh-candidate-invalid', 'prepared seed contains an invalid evidence binding')
    }
    for (const [field, allowEmpty] of [['matchBasis', false], ['limitations', true]]) {
      if (!Array.isArray(binding[field]) || (!allowEmpty && binding[field].length === 0)
        || binding[field].some(value => typeof value !== 'string' || value.trim() === '' || value.length > 256)
        || new Set(binding[field]).size !== binding[field].length) {
        invalid('aa-refresh-candidate-invalid', `prepared seed binding ${field} is invalid`)
      }
    }
    boundRecordIds.add(binding.aaRecordId)
  }
  if (recordIds.size !== boundRecordIds.size
    || [...recordIds].some(recordId => !boundRecordIds.has(recordId))) {
    invalid('aa-refresh-candidate-invalid', 'prepared seed must contain exactly its bound AA records')
  }

  let compiled
  try {
    compiled = compileLocalAACatalog({ seed: normalized, hostRoutes })
    compileAARoutePolicyCatalog(compiled)
  } catch (error) {
    invalid('aa-refresh-candidate-invalid', error.message)
  }
  const compiledRouteIds = new Set(compiled.entries.map(entry => entry.routeId))
  if (normalized.bindings.some(binding => !compiledRouteIds.has(binding.hostRouteId))) {
    invalid('aa-refresh-candidate-invalid', 'prepared seed contains a binding that does not compile')
  }
  return normalized
}

/** Return the deterministic digest used to guard a reviewed seed predecessor. */
export function snapshotSeedDigest(seed) {
  return sha256Json(normalizedPreviousSeed(seed))
}

function buildReport(previousSeed, nextSeed, sourceDigest) {
  const previousRecords = new Map(previousSeed.snapshot.records.map(record => [record.recordId, record]))
  const nextRecords = new Map(nextSeed.snapshot.records.map(record => [record.recordId, record]))
  const previousBindings = new Map(previousSeed.bindings.map(binding => [binding.hostRouteId, binding]))
  const nextBindings = new Map(nextSeed.bindings.map(binding => [binding.hostRouteId, binding]))

  const records = {
    added: [...nextRecords.keys()].filter(id => !previousRecords.has(id)).sort(compareText),
    removed: [...previousRecords.keys()].filter(id => !nextRecords.has(id)).sort(compareText),
    renamed: [],
    metrics: [],
  }
  for (const id of [...nextRecords.keys()].filter(id => previousRecords.has(id)).sort(compareText)) {
    const before = previousRecords.get(id)
    const after = nextRecords.get(id)
    if (before.label !== after.label) records.renamed.push({ recordId: id, before: before.label, after: after.label })
    const beforeMetrics = recordMetrics(before)
    const afterMetrics = recordMetrics(after)
    if (canonicalJson(beforeMetrics) !== canonicalJson(afterMetrics)) {
      records.metrics.push({ recordId: id, before: beforeMetrics, after: afterMetrics })
    }
  }

  const bindings = {
    added: [...nextBindings.keys()].filter(id => !previousBindings.has(id)).sort(compareText),
    removed: [...previousBindings.keys()].filter(id => !nextBindings.has(id)).sort(compareText),
    replaced: [],
  }
  const bandChanges = []
  for (const hostRouteId of [...nextBindings.keys()].filter(id => previousBindings.has(id)).sort(compareText)) {
    const beforeBinding = previousBindings.get(hostRouteId)
    const afterBinding = nextBindings.get(hostRouteId)
    if (beforeBinding.aaRecordId !== afterBinding.aaRecordId) {
      bindings.replaced.push({
        hostRouteId,
        beforeAARecordId: beforeBinding.aaRecordId,
        afterAARecordId: afterBinding.aaRecordId,
      })
    }
    const beforeLevel = levelFor(previousRecords.get(beforeBinding.aaRecordId))
    const afterLevel = levelFor(nextRecords.get(afterBinding.aaRecordId))
    if (beforeLevel !== null && afterLevel !== null && beforeLevel !== afterLevel) {
      bandChanges.push({
        hostRouteId,
        aaRecordId: afterBinding.aaRecordId,
        before: beforeLevel,
        after: afterLevel,
      })
    }
  }
  const beforeOrdering = sortedOrdering(previousSeed)
  const afterOrdering = sortedOrdering(nextSeed)
  const orderingChanges = Object.fromEntries(['light', 'standard', 'deep'].map(level => [level, {
    before: beforeOrdering[level],
    after: afterOrdering[level],
  }]))

  return freezeTree({
    previousSnapshotId: previousSeed.snapshot.snapshotId,
    nextSnapshotId: nextSeed.snapshot.snapshotId,
    sourceDigest,
    source: {
      before: previousSeed.snapshot.source,
      after: nextSeed.snapshot.source,
    },
    records,
    bindings,
    bandChanges,
    orderingChanges,
  })
}

function digestPayload(prepared) {
  return {
    schemaVersion: prepared.schemaVersion,
    refreshVersion: prepared.refreshVersion,
    previousSeedDigest: prepared.previousSeedDigest,
    sourceDigest: prepared.sourceDigest,
    hostRoutes: prepared.hostRoutes,
    seed: prepared.seed,
    report: prepared.report,
  }
}

/** Return the immutable digest over one prepared refresh candidate. */
export function preparedSnapshotDigest(prepared) {
  return sha256Json(digestPayload(prepared))
}

/** Validate one reviewed candidate, optionally against its exact predecessor. */
export function validatePreparedAASnapshotRefresh(prepared, { previousSeed } = {}) {
  if (!isRecord(prepared)) {
    invalid('aa-refresh-candidate-invalid', 'prepared refresh must use aa-snapshot-refresh/v1')
  }
  exactKeys(prepared, [
    'schemaVersion',
    'refreshVersion',
    'previousSeedDigest',
    'sourceDigest',
    'hostRoutes',
    'seed',
    'report',
    'digest',
  ], 'prepared refresh', 'aa-refresh-candidate-invalid')
  if (prepared.schemaVersion !== AA_SNAPSHOT_REFRESH_SCHEMA_VERSION
    || prepared.refreshVersion !== AA_SNAPSHOT_REFRESH_VERSION
    || !CONFIG_FINGERPRINT_PATTERN.test(prepared.previousSeedDigest)
    || !CONFIG_FINGERPRINT_PATTERN.test(prepared.sourceDigest)
    || !CONFIG_FINGERPRINT_PATTERN.test(prepared.digest)
    || !Array.isArray(prepared.hostRoutes) || !isRecord(prepared.report)) {
    invalid('aa-refresh-candidate-invalid', 'prepared refresh must use aa-snapshot-refresh/v1')
  }
  const expected = preparedSnapshotDigest(prepared)
  if (prepared.digest !== expected) {
    invalid('aa-refresh-digest-mismatch', 'prepared refresh content does not match its digest')
  }
  const currentHostRoutes = validateHostRoutes(prepared.hostRoutes)
  validateCandidateSeed(
    prepared.seed,
    [...currentHostRoutes.values()].map(route => route.effectiveConfig),
  )
  if (previousSeed !== undefined) {
    const normalizedPrevious = normalizedPreviousSeed(previousSeed)
    if (snapshotSeedDigest(normalizedPrevious) !== prepared.previousSeedDigest) {
      invalid('aa-refresh-predecessor-mismatch', 'prepared refresh predecessor does not match')
    }
    const expectedReport = buildReport(normalizedPrevious, prepared.seed, prepared.sourceDigest)
    if (canonicalJson(expectedReport) !== canonicalJson(prepared.report)) {
      invalid('aa-refresh-report-mismatch', 'prepared refresh report does not match its predecessor and seed')
    }
  }
  freezeTree(prepared)
  return prepared
}

/** Build one reviewable, deterministic candidate without mutating the active seed. */
export function prepareAASnapshotRefresh({
  acquisition,
  manifest,
  bindingPlan,
  hostRoutes,
  previousSeed,
  now = new Date().toISOString(),
}) {
  const normalizedManifest = validateManifest(manifest)
  const normalizedPrevious = normalizedPreviousSeed(previousSeed)
  if (normalizedManifest.snapshotId === normalizedPrevious.snapshot.snapshotId) {
    invalid('aa-refresh-snapshot-id-reused', 'manifest.snapshotId must differ from its predecessor')
  }
  const currentHostRoutes = validateHostRoutes(hostRoutes)
  const normalizedHostRoutes = [...currentHostRoutes.values()]
    .sort((left, right) => compareText(left.identity.routeId, right.identity.routeId))
    .map(route => JSON.parse(canonicalJson(route.effectiveConfig)))
  const plannedBindings = validateBindingPlan(bindingPlan, currentHostRoutes)
  const source = validateAcquisition(acquisition, normalizedManifest, now)

  const records = []
  for (const aaRecordId of [...new Set([...plannedBindings.values()].map(binding => binding.aaRecordId))]
    .sort(compareText)) {
    const rawRecord = source.records.get(aaRecordId)
    if (rawRecord === undefined) {
      invalid('aa-refresh-record-missing', `AA record ${aaRecordId} is absent from the acquisition`)
    }
    records.push(minimizeRecord(rawRecord, normalizedManifest.capabilityMethodologyVersion))
  }
  const bindings = [...plannedBindings.values()].sort(
    (left, right) => compareText(left.hostRouteId, right.hostRouteId),
  ).map(binding => freezeTree({
    bindingVersion: AA_EVIDENCE_BINDING_VERSION,
    hostRouteId: binding.hostRouteId,
    effectiveConfigFingerprint: binding.effectiveConfigFingerprint,
    aaSnapshotId: normalizedManifest.snapshotId,
    aaRecordId: binding.aaRecordId,
    matchBasis: binding.matchBasis,
    limitations: binding.limitations,
  }))
  const seed = freezeTree({
    schemaVersion: AA_EVIDENCE_CATALOG_SCHEMA_VERSION,
    catalogVersion: AA_EVIDENCE_CATALOG_VERSION,
    bindingVersion: AA_EVIDENCE_BINDING_VERSION,
    snapshot: {
      snapshotId: normalizedManifest.snapshotId,
      source: {
        name: 'Artificial Analysis',
        endpoint: acquisition.endpoint,
        promptType: acquisition.promptType,
        capturedAt: source.capturedAt,
        apiIntelligenceIndexVersion: normalizedManifest.apiIntelligenceIndexVersion,
        capabilityMethodologyVersion: normalizedManifest.capabilityMethodologyVersion,
        maximumAgeDays: normalizedManifest.maximumAgeDays,
        terms: normalizedManifest.terms,
        attribution: normalizedManifest.attribution,
        rights: normalizedManifest.rights,
      },
      records,
    },
    bindings,
  })

  let compiled
  try {
    compiled = compileLocalAACatalog({ seed, hostRoutes })
    compileAARoutePolicyCatalog(compiled)
  } catch (error) {
    invalid('aa-refresh-candidate-invalid', error.message)
  }
  const compiledRouteIds = new Set(compiled.entries.map(entry => entry.routeId))
  for (const hostRouteId of plannedBindings.keys()) {
    if (!compiledRouteIds.has(hostRouteId)) {
      invalid('aa-refresh-candidate-invalid', `planned Host route ${hostRouteId} did not compile`)
    }
  }

  const sourceDigest = sha256Json(acquisition)
  const prepared = {
    schemaVersion: AA_SNAPSHOT_REFRESH_SCHEMA_VERSION,
    refreshVersion: AA_SNAPSHOT_REFRESH_VERSION,
    previousSeedDigest: snapshotSeedDigest(normalizedPrevious),
    sourceDigest,
    hostRoutes: normalizedHostRoutes,
    seed,
    report: buildReport(normalizedPrevious, seed, sourceDigest),
  }
  prepared.digest = preparedSnapshotDigest(prepared)
  return validatePreparedAASnapshotRefresh(freezeTree(prepared), { previousSeed: normalizedPrevious })
}
