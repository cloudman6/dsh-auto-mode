const TIERS = ['fast', 'standard', 'strong']
const EFFORTS = new Set(['off', 'high', 'max'])

const STRONG_SIGNALS = [
  /\b(?:security|vulnerabilit(?:y|ies)|authentication|authorization|race condition|deadlock|concurren(?:cy|t)|architecture|migration|data loss|incident)\b/i,
  /(?:安全|漏洞|认证|鉴权|权限|竞态|并发|死锁|架构|迁移|数据丢失|事故)/u,
]

const FAST_SIGNALS = [
  /\b(?:format|formatting|typo|readme|rename|locate|find|summari[sz]e)\b/i,
  /(?:格式|错别字|文档|重命名|查找|定位|总结)/u,
]

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requiredString(value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${path} must be a non-empty string`)
  }
  return value
}

function selectionOf(value, path) {
  if (!isRecord(value)) throw new TypeError(`${path} must be an object`)
  const provider = requiredString(value.provider, `${path}.provider`)
  const model = requiredString(value.model, `${path}.model`)
  const reasoningEffort = requiredString(value.reasoningEffort, `${path}.reasoningEffort`)
  if (!EFFORTS.has(reasoningEffort)) {
    throw new TypeError(`${path}.reasoningEffort must be off, high, or max`)
  }
  return { provider, model, reasoningEffort }
}

function aaOf(value, path) {
  if (!isRecord(value)) throw new TypeError(`${path} must be an object`)
  return {
    recordId: requiredString(value.recordId, `${path}.recordId`),
    label: requiredString(value.label, `${path}.label`),
  }
}

function freezeTree(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

function exactSelectionKey(selection) {
  return `${selection.provider}\u0000${selection.model}\u0000${selection.reasoningEffort}`
}

/** Compile a maintainer-supplied local seed into a deterministic prototype catalog. */
export function compileSeed(input) {
  if (!isRecord(input)) throw new TypeError('seed must be an object')
  if (input.schemaVersion !== 1) throw new TypeError('seed.schemaVersion must be 1')
  if (!isRecord(input.source)) throw new TypeError('seed.source must be an object')
  const source = {
    name: requiredString(input.source.name, 'seed.source.name'),
    capturedAt: requiredString(input.source.capturedAt, 'seed.source.capturedAt'),
    url: requiredString(input.source.url, 'seed.source.url'),
  }
  const fallback = selectionOf(input.fallback, 'seed.fallback')
  const candidates = isRecord(input.routes) ? input.routes : {}
  const routes = {}
  const invalidTiers = {}
  const seen = new Set()

  for (const tier of TIERS) {
    const candidate = candidates[tier]
    if (candidate === undefined) continue
    try {
      if (!isRecord(candidate)) throw new TypeError(`seed.routes.${tier} must be an object`)
      const selection = selectionOf(candidate.selection, `seed.routes.${tier}.selection`)
      const key = exactSelectionKey(selection)
      if (seen.has(key)) throw new TypeError('duplicate exact selection')
      const aa = aaOf(candidate.aa, `seed.routes.${tier}.aa`)
      routes[tier] = {
        selection,
        aa,
      }
      seen.add(key)
    } catch (error) {
      invalidTiers[tier] = error instanceof Error ? error.message : String(error)
    }
  }

  return freezeTree({
    schemaVersion: 1,
    evidenceStatus: 'experimental-unadmitted',
    source,
    routes,
    invalidTiers,
    fallback,
  })
}

/** Classify one task using the deliberately small Phase 0P prototype policy. */
export function classifyTask(taskText) {
  const text = typeof taskText === 'string' ? taskText : ''
  if (STRONG_SIGNALS.some(pattern => pattern.test(text))) {
    return {
      tier: 'strong',
      reasonCode: 'high-complexity-task',
      reason: 'Matched a high-complexity or high-consequence task signal.',
    }
  }
  if (FAST_SIGNALS.some(pattern => pattern.test(text))) {
    return {
      tier: 'fast',
      reasonCode: 'bounded-simple-task',
      reason: 'Matched a bounded low-complexity task signal.',
    }
  }
  return {
    tier: 'standard',
    reasonCode: 'default-standard-task',
    reason: 'No fast or strong signal matched; selected the prototype default.',
  }
}

/** Resolve a task classification to an exact local mapping or the configured fallback. */
export function chooseRoute(taskText, catalog) {
  const classification = classifyTask(taskText)
  const route = catalog.routes[classification.tier]
  if (route !== undefined) {
    return freezeTree({
      ...classification,
      selection: route.selection,
      aaRecordId: route.aa.recordId,
      evidenceStatus: catalog.evidenceStatus,
    })
  }
  const invalid = Object.hasOwn(catalog.invalidTiers, classification.tier)
  return freezeTree({
    tier: 'fallback',
    selection: catalog.fallback,
    reasonCode: invalid ? 'invalid-tier-mapping' : 'missing-tier-mapping',
    reason: invalid
      ? `The ${classification.tier} mapping is invalid; used the configured fixed strong fallback.`
      : `The ${classification.tier} mapping is missing; used the configured fixed strong fallback.`,
    evidenceStatus: catalog.evidenceStatus,
  })
}
