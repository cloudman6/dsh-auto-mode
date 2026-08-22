import {
  AAEvidencePackError,
  buildAAEvidencePack,
  buildPolicyEligibleAASnapshot,
  evidenceComponentDigest,
  validateAAEvidencePack,
} from './aa-evidence-pack.mjs'
import { compileActiveAACatalog } from './aa-active-catalog.mjs'
import { deriveStructuredBindingCandidates } from './aa-binding-candidates.mjs'

export const AA_EVIDENCE_PACK_REFRESH_VERSION = 'aa-evidence-pack-refresh/v1'

export class AAEvidencePackRefreshError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'AAEvidencePackRefreshError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AAEvidencePackRefreshError(code, message)
}

function freezeTree(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function compareText(left, right) {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function recordMap(snapshot) {
  return new Map(snapshot.records.map(record => [record.recordId, record]))
}

function recordDiff(previous, next) {
  const before = recordMap(previous)
  const after = recordMap(next)
  const added = [...after.keys()].filter(id => !before.has(id)).sort(compareText)
  const removed = [...before.keys()].filter(id => !after.has(id)).sort(compareText)
  const renamed = []
  const metricChanges = []
  for (const id of [...after.keys()].filter(id => before.has(id)).sort(compareText)) {
    const left = before.get(id)
    const right = after.get(id)
    if (left.label !== right.label) renamed.push({ recordId: id, before: left.label, after: right.label })
    const metricBefore = {
      capability: left.evaluations.artificial_analysis_intelligence_index,
      price: left.pricing.price_1m_blended_7_to_2_to_1,
      latency: left.performance.median_time_to_first_answer_token_seconds,
    }
    const metricAfter = {
      capability: right.evaluations.artificial_analysis_intelligence_index,
      price: right.pricing.price_1m_blended_7_to_2_to_1,
      latency: right.performance.median_time_to_first_answer_token_seconds,
    }
    if (JSON.stringify(metricBefore) !== JSON.stringify(metricAfter)) {
      metricChanges.push({ recordId: id, before: metricBefore, after: metricAfter })
    }
  }
  return { added, removed, renamed, metricChanges }
}

function quarantineMissingBindings(previousRegistry, snapshot) {
  const records = new Set(snapshot.records.map(record => record.recordId))
  const quarantined = []
  const restored = []
  const bindings = previousRegistry.bindings.map(binding => {
    const next = cloneJson(binding)
    if (!records.has(next.aaRecordId)) {
      next.quarantine = { reasonCode: 'aa-bound-record-missing' }
      quarantined.push(next.aaRecordId)
    } else if (next.quarantine?.reasonCode === 'aa-bound-record-missing') {
      next.quarantine = null
      restored.push(next.aaRecordId)
    }
    return next
  })
  return {
    registry: {
      schemaVersion: previousRegistry.schemaVersion,
      registryVersion: previousRegistry.registryVersion,
      normalizationRules: cloneJson(previousRegistry.normalizationRules),
      bindings,
    },
    quarantined: quarantined.sort(compareText),
    restored: restored.sort(compareText),
  }
}

function red(reasonCode, message) {
  return freezeTree({
    schemaVersion: 1,
    refreshVersion: AA_EVIDENCE_PACK_REFRESH_VERSION,
    classification: 'RED',
    autoApplicable: false,
    reasonCode,
    message,
    evidencePack: null,
  })
}

function refreshDigest(value) {
  const copy = cloneJson(value)
  delete copy.digest
  return evidenceComponentDigest(copy)
}

/** Classify and prepare one deterministic, exception-isolating Evidence Pack update. */
export function prepareAAEvidencePackRefresh({
  previousPack,
  acquisition,
  snapshotId,
  packId,
  source,
  rights,
  hostRoutes = [],
  now,
  maximumAgeDays = 30,
} = {}) {
  validateAAEvidencePack(previousPack)
  if (evidenceComponentDigest(rights) !== evidenceComponentDigest(previousPack.manifest.rights)) {
    return red('aa-refresh-rights-contract-changed', 'rights changes require explicit external review')
  }
  let snapshotResult
  try {
    snapshotResult = buildPolicyEligibleAASnapshot({
      acquisition, snapshotId, source, rights, now, maximumAgeDays,
    })
  } catch (error) {
    if (error instanceof AAEvidencePackError) return red(error.code, error.message)
    throw error
  }

  let candidateUpdate
  try {
    candidateUpdate = deriveStructuredBindingCandidates({
      snapshot: snapshotResult.snapshot,
      normalizationRules: previousPack.bindingRegistry.normalizationRules,
      existingBindings: previousPack.bindingRegistry.bindings,
    })
  } catch (error) {
    return red(error.code ?? 'aa-binding-candidate-invalid', error.message)
  }
  const bindingUpdate = quarantineMissingBindings({
    ...previousPack.bindingRegistry,
    bindings: [...previousPack.bindingRegistry.bindings, ...candidateUpdate.generated],
  }, snapshotResult.snapshot)
  let evidencePack
  let hostImpact
  try {
    evidencePack = buildAAEvidencePack({
      packId,
      snapshot: snapshotResult.snapshot,
      bindingRegistry: bindingUpdate.registry,
      routePolicy: previousPack.routePolicy,
      runtimeCompatibility: previousPack.manifest.runtimeCompatibility,
      rights,
    })
    hostImpact = compileActiveAACatalog({ evidencePack, hostRoutes })
  } catch (error) {
    return red(error.code ?? 'aa-evidence-refresh-invalid', error.message)
  }

  const amberHostReasons = new Set([
    'aa-binding-missing',
    'aa-binding-quarantined',
    'aa-binding-record-missing',
    'evidence-route-model-unmapped',
    'evidence-route-control-missing',
    'evidence-route-control-unmapped',
    'evidence-route-rule-missing',
    'evidence-route-rule-ambiguous',
  ])
  const classification = bindingUpdate.quarantined.length > 0
    || snapshotResult.exclusions.length > 0
    || candidateUpdate.exclusions.length > 0
    || hostImpact.exclusions.some(exclusion => amberHostReasons.has(exclusion.reasonCode))
    ? 'AMBER'
    : 'GREEN'
  const prepared = {
    schemaVersion: 1,
    refreshVersion: AA_EVIDENCE_PACK_REFRESH_VERSION,
    classification,
    autoApplicable: true,
    reasonCode: classification === 'GREEN' ? 'aa-refresh-routine-valid' : 'aa-refresh-exceptions-isolated',
    previousPackDigest: evidenceComponentDigest(previousPack),
    evidencePack,
    report: {
      records: recordDiff(previousPack.snapshot, evidencePack.snapshot),
      eligibilityExclusions: snapshotResult.exclusions,
      bindings: {
        generated: candidateUpdate.generated.map(binding => binding.aaRecordId),
        reused: candidateUpdate.reused,
        candidateExclusions: candidateUpdate.exclusions,
        quarantined: bindingUpdate.quarantined,
        restored: bindingUpdate.restored,
      },
      hostImpact: {
        activeRouteIds: hostImpact.entries.map(entry => entry.routeId),
        bindingStates: hostImpact.bindingStates,
        exclusions: hostImpact.exclusions,
      },
      componentDigests: evidencePack.manifest.components,
    },
  }
  prepared.digest = refreshDigest(prepared)
  return freezeTree(prepared)
}

/** Revalidate a prepared valid refresh immediately before atomic activation. */
export function validatePreparedAAEvidencePackRefresh(prepared) {
  if (prepared?.schemaVersion !== 1
    || prepared?.refreshVersion !== AA_EVIDENCE_PACK_REFRESH_VERSION
    || !['GREEN', 'AMBER'].includes(prepared.classification)
    || prepared.autoApplicable !== true
    || typeof prepared.digest !== 'string') {
    invalid('aa-evidence-refresh-invalid', 'prepared refresh must be an applicable GREEN or AMBER update')
  }
  if (refreshDigest(prepared) !== prepared.digest) {
    invalid('aa-evidence-refresh-digest-mismatch', 'prepared refresh digest does not match')
  }
  validateAAEvidencePack(prepared.evidencePack)
  return freezeTree(prepared)
}
