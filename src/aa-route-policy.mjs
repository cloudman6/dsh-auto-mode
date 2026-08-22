import {
  AA_EVIDENCE_CATALOG_SCHEMA_VERSION,
  AA_EVIDENCE_CATALOG_VERSION,
} from './aa-catalog.mjs'

export const AA_ROUTE_POLICY_VERSION = 'aa-route-policy/v1'
const ACTIVE_CATALOG_VERSION = 'aa-active-catalog/v1'

const LEVEL_LABELS = Object.freeze({
  light: 'Light',
  standard: 'Standard',
  deep: 'Deep',
})

function freezeTree(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

export const AA_ROUTE_POLICY_V1 = freezeTree({
  policyVersion: AA_ROUTE_POLICY_VERSION,
  capabilityField: 'evaluations.artificial_analysis_intelligence_index',
  capabilityMethodologyVersion: 'v4.1.1',
  priceField: 'pricing.price_1m_blended_7_to_2_to_1',
  latencyField: 'performance.median_time_to_first_answer_token_seconds',
  missingDataPolicy: {
    capability: 'exclude',
    price: 'exclude',
    latency: 'sort-after-measured-then-route-id',
  },
  bandPolicy: {
    light: { minimumInclusive: null, maximumExclusive: 35 },
    standard: { minimumInclusive: 35, maximumExclusive: 50 },
    deep: { minimumInclusive: 50, maximumExclusive: null },
  },
})

export class AARoutePolicyError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'AARoutePolicyError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AARoutePolicyError(code, message)
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function compareText(left, right) {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function compareRoutes(left, right) {
  if (left.aaPrice !== right.aaPrice) return left.aaPrice - right.aaPrice
  if (left.aaLatencySeconds === null && right.aaLatencySeconds !== null) return 1
  if (left.aaLatencySeconds !== null && right.aaLatencySeconds === null) return -1
  if (left.aaLatencySeconds !== right.aaLatencySeconds) {
    return left.aaLatencySeconds - right.aaLatencySeconds
  }
  return compareText(left.routeId, right.routeId)
}

function compareExclusions(left, right) {
  return compareText(
    `${left.hostRouteId ?? ''}\u0000${left.reasonCode}`,
    `${right.hostRouteId ?? ''}\u0000${right.reasonCode}`,
  )
}

function handlingLevel(score) {
  if (score < AA_ROUTE_POLICY_V1.bandPolicy.light.maximumExclusive) return 'light'
  if (score < AA_ROUTE_POLICY_V1.bandPolicy.standard.maximumExclusive) return 'standard'
  return 'deep'
}

function comparisonFacts(entry) {
  const evaluations = entry.aaRecord?.evaluations
  const capability = evaluations?.artificial_analysis_intelligence_index
  if (capability === undefined || capability === null) {
    return { exclusion: 'aa-capability-missing' }
  }
  if (!finiteNumber(capability) || capability < 0) {
    return { exclusion: 'aa-capability-invalid' }
  }

  const pricing = entry.aaRecord?.pricing
  const price = pricing?.price_1m_blended_7_to_2_to_1
  if (price === undefined || price === null) return { exclusion: 'aa-price-missing' }
  if (!finiteNumber(price) || price < 0) return { exclusion: 'aa-price-invalid' }

  const performance = entry.aaRecord?.performance
  const latency = performance?.median_time_to_first_answer_token_seconds
  return {
    capability,
    price,
    latency: finiteNumber(latency) && latency >= 0 ? latency : null,
  }
}

/** Assign validated AA evidence entries to versioned handling levels. */
export function compileAARoutePolicyCatalog(evidenceCatalog) {
  if (!isRecord(evidenceCatalog) || !Array.isArray(evidenceCatalog.entries)
    || !Array.isArray(evidenceCatalog.exclusions)
    || evidenceCatalog.schemaVersion !== AA_EVIDENCE_CATALOG_SCHEMA_VERSION
    || ![AA_EVIDENCE_CATALOG_VERSION, ACTIVE_CATALOG_VERSION].includes(evidenceCatalog.catalogVersion)
    || typeof evidenceCatalog.aaSnapshotId !== 'string'
    || evidenceCatalog.aaSnapshotId.trim() === '') {
    invalid('aa-route-policy-invalid', 'evidence catalog must be a compiled AA catalog')
  }

  const levels = { light: [], standard: [], deep: [] }
  const exclusions = evidenceCatalog.exclusions.map(exclusion => ({ ...exclusion }))
  for (const entry of evidenceCatalog.entries) {
    if (!isRecord(entry) || typeof entry.routeId !== 'string' || !isRecord(entry.aaRecord)) {
      invalid('aa-route-policy-invalid', 'each evidence entry must contain a route and AA record')
    }
    const facts = comparisonFacts(entry)
    if (facts.exclusion) {
      exclusions.push({ hostRouteId: entry.routeId, reasonCode: facts.exclusion })
      continue
    }
    const level = handlingLevel(facts.capability)
    levels[level].push(freezeTree({
      ...entry,
      policyVersion: AA_ROUTE_POLICY_VERSION,
      handlingLevel: level,
      aaCapabilityScore: facts.capability,
      aaPrice: facts.price,
      aaLatencySeconds: facts.latency,
    }))
  }

  for (const routes of Object.values(levels)) routes.sort(compareRoutes)
  exclusions.sort(compareExclusions)
  return freezeTree({
    schemaVersion: 1,
    policyVersion: AA_ROUTE_POLICY_VERSION,
    aaSnapshotId: evidenceCatalog.aaSnapshotId,
    evidenceCatalogVersion: evidenceCatalog.catalogVersion,
    bindingVersion: evidenceCatalog.bindingVersion,
    capabilityField: AA_ROUTE_POLICY_V1.capabilityField,
    capabilityMethodologyVersion: AA_ROUTE_POLICY_V1.capabilityMethodologyVersion,
    priceField: AA_ROUTE_POLICY_V1.priceField,
    latencyField: AA_ROUTE_POLICY_V1.latencyField,
    missingDataPolicy: AA_ROUTE_POLICY_V1.missingDataPolicy,
    bandPolicy: AA_ROUTE_POLICY_V1.bandPolicy,
    levels,
    exclusions,
  })
}

/** Select the first Host-valid route in one already-compiled handling level. */
export function resolveAARoute(catalog, level) {
  if (!isRecord(catalog) || catalog.policyVersion !== AA_ROUTE_POLICY_VERSION) {
    invalid('aa-route-policy-invalid', 'catalog must use the current AA route policy')
  }
  if (!Object.hasOwn(LEVEL_LABELS, level)) {
    invalid('aa-handling-level-invalid', 'handling level must be light, standard, or deep')
  }
  const routes = catalog.levels?.[level]
  if (!Array.isArray(routes) || routes.length === 0) {
    invalid('aa-route-unavailable', `no AA-matched route is available in ${level}`)
  }
  return freezeTree({
    policyVersion: catalog.policyVersion,
    aaSnapshotId: catalog.aaSnapshotId,
    handlingLevel: level,
    route: routes[0],
    reasonCode: 'aa-price-first',
    explanation: `${LEVEL_LABELS[level]} AA capability band; selected by lower AA price, then lower AA latency, then stable route identity`,
  })
}
