import { AA_ROUTE_POLICY_VERSION } from './aa-route-policy.mjs'
import { createHostRouteIdentity } from './aa-evidence-binding.mjs'
import {
  TASK_ASSESSOR_VERSION,
} from './task-assessor-contract.mjs'
import { TASK_HANDLING_POLICY_VERSION } from './task-assessor.mjs'

export const AUTO_DECISION_VERSION = 'auto-decision/v1'

const LEVELS = Object.freeze(['light', 'standard', 'deep'])
const LEVEL_LABELS = Object.freeze({
  light: 'Light',
  standard: 'Standard',
  deep: 'Deep',
})

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

function cloneConfig(value) {
  const identity = createHostRouteIdentity(value)
  return { identity, config: freezeTree(JSON.parse(JSON.stringify(value))) }
}

function cloneAudit(value) {
  if (value === undefined || value === null) return value
  return freezeTree(JSON.parse(JSON.stringify(value)))
}

function unique(values) {
  return [...new Set(values)]
}

function normalizedAssessment(result) {
  const decision = result?.decision
  if (result?.assessorVersion === TASK_ASSESSOR_VERSION
    && result?.handlingPolicyVersion === TASK_HANDLING_POLICY_VERSION
    && ['valid', 'fallback'].includes(result.assessmentStatus)
    && isRecord(result.assessment)
    && (result.assessorRoute === null || isRecord(result.assessorRoute))
    && isRecord(decision)
    && decision.policyVersion === TASK_HANDLING_POLICY_VERSION
    && LEVELS.includes(decision.handlingLevel)
    && Array.isArray(decision.reasonCodes)
    && decision.reasonCodes.every(code => typeof code === 'string' && code.length > 0)
    && typeof decision.explanation === 'string'
    && decision.explanation.length > 0) {
    return {
      requestedLevel: decision.handlingLevel,
      reasonCodes: [...decision.reasonCodes],
      explanation: decision.explanation,
      assessmentStatus: result.assessmentStatus,
      taskAssessment: cloneAudit(result.assessment),
      assessorRoute: cloneAudit(result.assessorRoute),
    }
  }
  return {
    requestedLevel: 'deep',
    reasonCodes: ['auto-assessment-invalid'],
    explanation: 'Deep fallback: the Task Assessment contract is invalid',
    assessmentStatus: 'fallback',
    taskAssessment: undefined,
    assessorRoute: null,
  }
}

function assessmentAudit(assessment) {
  return {
    assessmentStatus: assessment.assessmentStatus,
    ...(assessment.taskAssessment === undefined
      ? {}
      : { taskAssessment: assessment.taskAssessment }),
    assessorRoute: assessment.assessorRoute,
  }
}

function eligibleRouteIndex(routes) {
  if (!Array.isArray(routes)) return new Map()
  const index = new Map()
  for (const route of routes) {
    try {
      const normalized = cloneConfig(route)
      if (!index.has(normalized.identity.routeId)) {
        index.set(normalized.identity.routeId, normalized)
      }
    } catch {
      // A malformed candidate is not Host-valid and cannot enter resolution.
    }
  }
  return index
}

function validCatalogRoute(route) {
  if (!isRecord(route) || !isRecord(route.effectiveConfig)
    || typeof route.routeId !== 'string'
    || typeof route.effectiveConfigFingerprint !== 'string'
    || typeof route.provider !== 'string'
    || typeof route.model !== 'string') return false
  try {
    const identity = createHostRouteIdentity(route.effectiveConfig)
    return identity.routeId === route.routeId
      && identity.effectiveConfigFingerprint === route.effectiveConfigFingerprint
      && identity.provider === route.provider
      && identity.model === route.model
  } catch {
    return false
  }
}

function catalogState(catalog) {
  if (!isRecord(catalog)
    || catalog.policyVersion !== AA_ROUTE_POLICY_VERSION
    || typeof catalog.aaSnapshotId !== 'string'
    || catalog.aaSnapshotId.length === 0
    || !isRecord(catalog.levels)) {
    return { valid: false, reasonCode: 'auto-route-catalog-invalid' }
  }
  for (const level of LEVELS) {
    if (!Array.isArray(catalog.levels[level])
      || catalog.levels[level].some(route => !validCatalogRoute(route))) {
      return { valid: false, reasonCode: 'auto-route-catalog-invalid' }
    }
  }
  return { valid: true }
}

function validFallback(deepFallback, eligible) {
  if (deepFallback === undefined) return undefined
  try {
    const normalized = cloneConfig(deepFallback)
    const hostRoute = eligible.get(normalized.identity.routeId)
    return hostRoute === undefined ? undefined : hostRoute
  } catch {
    return undefined
  }
}

function resolvedFromAA({ assessment, catalog, route, resolvedLevel }) {
  const escalated = resolvedLevel !== assessment.requestedLevel
  const resolutionReason = escalated ? 'auto-route-level-escalated' : 'aa-price-first'
  const routeExplanation = escalated
    ? `No eligible ${LEVEL_LABELS[assessment.requestedLevel]} route; escalated from ${LEVEL_LABELS[assessment.requestedLevel]} to ${LEVEL_LABELS[resolvedLevel]} and selected by lower AA price, then lower AA latency, then stable route identity`
    : `${LEVEL_LABELS[resolvedLevel]} AA capability band; selected by lower AA price, then lower AA latency, then stable route identity`
  return freezeTree({
    decisionVersion: AUTO_DECISION_VERSION,
    status: 'resolved',
    requestedHandlingLevel: assessment.requestedLevel,
    handlingLevel: resolvedLevel,
    selection: route.hostRoute.config,
    routeId: route.catalogRoute.routeId,
    effectiveConfigFingerprint: route.catalogRoute.effectiveConfigFingerprint,
    routeBasis: 'aa-matched',
    fallback: false,
    ...assessmentAudit(assessment),
    aaSnapshotId: catalog.aaSnapshotId,
    aaRecordId: route.catalogRoute.aaRecordId,
    evidenceBindingVersion: route.catalogRoute.bindingVersion,
    catalogVersion: catalog.evidenceCatalogVersion,
    routePolicyVersion: catalog.policyVersion,
    ...(catalog.packId === undefined ? {} : { evidencePackId: catalog.packId }),
    ...(route.catalogRoute.evidenceRouteKeyId === undefined
      ? {}
      : { evidenceRouteKeyId: route.catalogRoute.evidenceRouteKeyId }),
    ...(route.catalogRoute.bindingRegistryVersion === undefined
      ? {}
      : { bindingRegistryVersion: route.catalogRoute.bindingRegistryVersion }),
    ...(route.catalogRoute.manifestVersion === undefined
      ? {}
      : { manifestVersion: route.catalogRoute.manifestVersion }),
    assessorVersion: TASK_ASSESSOR_VERSION,
    handlingPolicyVersion: TASK_HANDLING_POLICY_VERSION,
    reasonCode: resolutionReason,
    reasonCodes: unique([...assessment.reasonCodes, resolutionReason]),
    explanation: `${assessment.explanation}. ${routeExplanation}.`,
  })
}

function resolvedFromFallback({ assessment, fallback, catalogReason }) {
  const reasonCodes = unique([
    ...assessment.reasonCodes,
    ...(catalogReason === undefined ? ['auto-route-no-aa-match'] : [catalogReason]),
    'auto-route-configured-deep-fallback',
  ])
  return freezeTree({
    decisionVersion: AUTO_DECISION_VERSION,
    status: 'resolved',
    requestedHandlingLevel: assessment.requestedLevel,
    handlingLevel: 'deep',
    selection: fallback.config,
    routeId: fallback.identity.routeId,
    effectiveConfigFingerprint: fallback.identity.effectiveConfigFingerprint,
    routeBasis: 'configured-deep-fallback',
    fallback: true,
    ...assessmentAudit(assessment),
    assessorVersion: TASK_ASSESSOR_VERSION,
    handlingPolicyVersion: TASK_HANDLING_POLICY_VERSION,
    reasonCode: 'auto-route-configured-deep-fallback',
    reasonCodes,
    explanation: `Deep fallback: no Host-valid AA-matched route remained at or above ${LEVEL_LABELS[assessment.requestedLevel]}; used the explicitly configured Host-valid route.`,
  })
}

function failed({ assessment, catalogReason }) {
  const reasonCodes = unique([
    ...assessment.reasonCodes,
    ...(catalogReason === undefined ? ['auto-route-no-aa-match'] : [catalogReason]),
    'auto-route-unavailable',
  ])
  return freezeTree({
    decisionVersion: AUTO_DECISION_VERSION,
    status: 'failure',
    requestedHandlingLevel: assessment.requestedLevel,
    handlingLevel: 'deep',
    fallback: false,
    ...assessmentAudit(assessment),
    assessorVersion: TASK_ASSESSOR_VERSION,
    handlingPolicyVersion: TASK_HANDLING_POLICY_VERSION,
    reasonCode: 'auto-route-unavailable',
    reasonCodes,
    explanation: 'Auto routing failed: no Host-valid AA-matched route or configured Deep fallback is available.',
  })
}

/**
 * Resolve one already-assessed task against the frozen AA catalog and the
 * caller's serialized Host-valid route set. The result is deeply frozen and
 * carries either one complete effective request config or an explicit failure.
 */
export function resolveFrozenAutoDecision({
  assessmentResult,
  catalog,
  eligibleHostRoutes = [],
  deepFallback,
} = {}) {
  const assessment = normalizedAssessment(assessmentResult)
  const eligible = eligibleRouteIndex(eligibleHostRoutes)
  const catalogStatus = catalogState(catalog)

  if (catalogStatus.valid) {
    const start = LEVELS.indexOf(assessment.requestedLevel)
    for (const resolvedLevel of LEVELS.slice(start)) {
      for (const catalogRoute of catalog.levels[resolvedLevel]) {
        const hostRoute = eligible.get(catalogRoute.routeId)
        if (hostRoute !== undefined) {
          return resolvedFromAA({
            assessment,
            catalog,
            route: { catalogRoute, hostRoute },
            resolvedLevel,
          })
        }
      }
    }
  }

  const fallback = validFallback(deepFallback, eligible)
  if (fallback !== undefined) {
    return resolvedFromFallback({
      assessment,
      fallback,
      catalogReason: catalogStatus.valid ? undefined : catalogStatus.reasonCode,
    })
  }
  return failed({
    assessment,
    catalogReason: catalogStatus.valid ? undefined : catalogStatus.reasonCode,
  })
}
