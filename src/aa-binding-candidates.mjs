import {
  EVIDENCE_ROUTE_KEY_SCHEMA_VERSION,
  evidenceRouteKeyId,
  validateProviderNormalizationRule,
} from './evidence-route-key.mjs'

export const AA_BINDING_CANDIDATE_COMPILER_VERSION = 'aa-binding-candidate-compiler/v1'

export class AABindingCandidateError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'AABindingCandidateError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AABindingCandidateError(code, message)
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

function exclusion(reasonCode, proposal) {
  return {
    source: 'record-mapping',
    reasonCode,
    ruleVersion: proposal.ruleVersion,
    aaRecordId: proposal.aaRecordId,
    evidenceRouteKeyId: proposal.keyId,
  }
}

/**
 * Compile only exact stable-record declarations into binding candidates.
 * Display names, slugs, similarity, discovery order, and Host availability are not inputs.
 */
export function deriveStructuredBindingCandidates({
  snapshot,
  normalizationRules,
  existingBindings,
} = {}) {
  if (!Array.isArray(snapshot?.records) || !Array.isArray(normalizationRules)
    || !Array.isArray(existingBindings)) {
    invalid('aa-binding-candidate-input-invalid', 'candidate compilation requires a Snapshot, rules, and bindings')
  }
  const recordIds = new Set()
  for (const record of snapshot.records) {
    if (typeof record?.recordId !== 'string' || record.recordId === '' || recordIds.has(record.recordId)) {
      invalid('aa-binding-candidate-input-invalid', 'Snapshot record IDs must be unique strings')
    }
    recordIds.add(record.recordId)
  }
  const existingByKey = new Map()
  for (const binding of existingBindings) {
    const keyId = evidenceRouteKeyId(binding?.evidenceRouteKey)
    if (existingByKey.has(keyId)) {
      invalid('aa-binding-candidate-input-invalid', 'existing bindings contain a duplicate EvidenceRouteKey')
    }
    existingByKey.set(keyId, binding)
  }

  const proposalsByKey = new Map()
  const exclusions = []
  const rules = normalizationRules.map(validateProviderNormalizationRule)
    .sort((left, right) => compareText(left.ruleVersion, right.ruleVersion))
  for (const rule of rules) {
    for (const mapping of rule.aaRecordMappings) {
      const evidenceRouteKey = {
        schemaVersion: EVIDENCE_ROUTE_KEY_SCHEMA_VERSION,
        providerNamespace: rule.providerNamespace,
        modelKey: mapping.modelKey,
        evidenceControls: mapping.evidenceControls,
      }
      const proposal = {
        evidenceRouteKey,
        keyId: evidenceRouteKeyId(evidenceRouteKey),
        aaRecordId: mapping.aaRecordId,
        ruleVersion: rule.ruleVersion,
      }
      if (!recordIds.has(mapping.aaRecordId)) {
        exclusions.push(exclusion('aa-binding-candidate-record-missing', proposal))
        continue
      }
      const group = proposalsByKey.get(proposal.keyId) ?? []
      group.push(proposal)
      proposalsByKey.set(proposal.keyId, group)
    }
  }

  const generated = []
  let reused = 0
  for (const keyId of [...proposalsByKey.keys()].sort(compareText)) {
    const proposals = proposalsByKey.get(keyId)
    if (proposals.length !== 1) {
      for (const proposal of proposals) {
        exclusions.push(exclusion('aa-binding-candidate-ambiguous', proposal))
      }
      continue
    }
    const proposal = proposals[0]
    const existing = existingByKey.get(keyId)
    if (existing !== undefined) {
      if (existing.aaRecordId === proposal.aaRecordId) reused += 1
      else exclusions.push(exclusion('aa-binding-candidate-conflict', proposal))
      continue
    }
    generated.push({
      evidenceRouteKey: proposal.evidenceRouteKey,
      aaRecordId: proposal.aaRecordId,
      ruleVersion: proposal.ruleVersion,
      matchBasis: [`structured stable AA record mapping in ${proposal.ruleVersion}`],
      limitations: [],
      quarantine: null,
    })
  }

  exclusions.sort((left, right) => compareText(
    `${left.evidenceRouteKeyId}\0${left.aaRecordId}\0${left.ruleVersion}\0${left.reasonCode}`,
    `${right.evidenceRouteKeyId}\0${right.aaRecordId}\0${right.ruleVersion}\0${right.reasonCode}`,
  ))
  return freezeTree({
    compilerVersion: AA_BINDING_CANDIDATE_COMPILER_VERSION,
    generated,
    reused,
    exclusions,
  })
}
